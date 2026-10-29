#!/usr/bin/env node
// Validates timeline data and reports missing translations.
// Usage: node scripts/validate.mjs [--strict]
//   --strict  treat events without sources as errors (use before publishing)

import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const strict = process.argv.includes('--strict');
const readJson = (p) => JSON.parse(readFileSync(join(root, p), 'utf8'));

const errors = [];
const warnings = [];

const { people } = readJson('data/people.json');
const { categories, events } = readJson('data/events.json');
const personIds = new Set(people.map((p) => p.id));

const DATE_RE = /^\d{4}(-(0[1-9]|1[0-2])(-(0[1-9]|[12]\d|3[01]))?)?$/;
const ID_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const seen = new Set();

for (const ev of events) {
  const where = `event "${ev.id}"`;
  if (!ID_RE.test(ev.id || '')) errors.push(`${where}: id must be lowercase-kebab-case`);
  if (seen.has(ev.id)) errors.push(`${where}: duplicate id`);
  seen.add(ev.id);

  if (!DATE_RE.test(ev.date || '')) errors.push(`${where}: invalid date "${ev.date}" (use YYYY, YYYY-MM or YYYY-MM-DD)`);
  else if (ev.date.length === 10 && Number.isNaN(Date.parse(ev.date))) errors.push(`${where}: date does not exist`);

  if (!categories.includes(ev.category)) errors.push(`${where}: unknown category "${ev.category}"`);
  if (!Array.isArray(ev.people)) errors.push(`${where}: people must be an array`);
  else for (const p of ev.people) if (!personIds.has(p)) errors.push(`${where}: unknown person "${p}"`);

  if (!Array.isArray(ev.sources)) errors.push(`${where}: sources must be an array`);
  else if (ev.sources.length === 0) (strict ? errors : warnings).push(`${where}: no sources`);
  else for (const s of ev.sources) {
    if (!/^https:\/\//.test(s.url || '')) errors.push(`${where}: source url must start with https://`);
    if (!s.outlet) errors.push(`${where}: source is missing "outlet"`);
  }
}

// Translations: English is the reference and must be complete.
function keys(obj, prefix = '') {
  return Object.entries(obj || {}).flatMap(([k, v]) =>
    v && typeof v === 'object' ? keys(v, `${prefix}${k}.`) : [`${prefix}${k}`]);
}

const en = readJson('data/locales/en.json');
const enKeys = new Set(keys({ ui: en.ui, categories: en.categories, people: en.people }));
for (const c of categories) if (!en.categories?.[c]) errors.push(`en: missing category "${c}"`);
for (const p of people) if (!en.people?.[p.id]?.role) errors.push(`en: missing role for "${p.id}"`);
for (const ev of events) {
  if (!en.events?.[ev.id]?.title || !en.events[ev.id].summary) errors.push(`en: missing title/summary for "${ev.id}"`);
}
for (const id of Object.keys(en.events || {})) if (!seen.has(id)) warnings.push(`en: orphan translation "${id}"`);

const report = [];
for (const file of readdirSync(join(root, 'data/locales')).filter((f) => f.endsWith('.json') && f !== 'en.json')) {
  const loc = readJson(`data/locales/${file}`);
  const locKeys = new Set(keys({ ui: loc.ui, categories: loc.categories, people: loc.people }));
  const missingUi = [...enKeys].filter((k) => !locKeys.has(k));
  const missingEvents = events.filter((ev) => !loc.events?.[ev.id]?.title).map((ev) => ev.id);
  const done = events.length - missingEvents.length;
  report.push(`  ${file.replace('.json', '').padEnd(6)} ${done}/${events.length} events, ${missingUi.length} missing UI strings`);
  for (const k of missingUi) warnings.push(`${file}: missing "${k}"`);
  for (const id of missingEvents) warnings.push(`${file}: missing event "${id}"`);
}

console.log(`${events.length} events, ${people.length} people, ${categories.length} categories`);
const sourced = events.filter((e) => e.sources?.length).length;
console.log(`Sourced: ${sourced}/${events.length}`);
if (report.length) console.log(`Translations:\n${report.join('\n')}`);
for (const w of warnings) console.log(`warning: ${w}`);
for (const e of errors) console.error(`error: ${e}`);
process.exit(errors.length ? 1 : 0);
