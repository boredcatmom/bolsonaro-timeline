import { t } from './i18n.js';

function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    // setProperty, not Object.assign: custom properties like --c are ignored by assignment.
    if (k === 'style') for (const [p, val] of Object.entries(v)) node.style.setProperty(p, val);
    else if (k.startsWith('on')) node.addEventListener(k.slice(2), v);
    else node.setAttribute(k, v === true ? '' : v);
  }
  node.append(...children.flat().filter((c) => c != null && c !== false));
  return node;
}

const normalize = (s) => (s || '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

// Dates may be YYYY, YYYY-MM or YYYY-MM-DD; format only the precision we have.
export function formatDate(date, locale) {
  const [y, m, d] = date.split('-').map(Number);
  const opts = d ? { year: 'numeric', month: 'long', day: 'numeric' }
    : m ? { year: 'numeric', month: 'long' }
      : { year: 'numeric' };
  return new Intl.DateTimeFormat(locale, { ...opts, timeZone: 'UTC' })
    .format(new Date(Date.UTC(y, (m || 1) - 1, d || 1)));
}

export function eventText(dict, id) {
  return dict.events?.[id] || { title: id, summary: '' };
}

export function filterEvents(state) {
  const query = normalize(state.query.trim());
  const peopleById = Object.fromEntries(state.people.map((p) => [p.id, p]));
  return state.events.filter((ev) => {
    if (state.activePeople.size && !ev.people.some((p) => state.activePeople.has(p))) return false;
    if (state.activeCategories.size && !state.activeCategories.has(ev.category)) return false;
    if (!query) return true;
    const text = eventText(state.dict, ev.id);
    const haystack = [text.title, text.summary, text.context, ...ev.people.map((p) => peopleById[p]?.name)].join(' ');
    return normalize(haystack).includes(query);
  });
}

function chip({ label, color, pressed, title, onclick }) {
  return el('button', {
    type: 'button', class: 'chip', 'aria-pressed': String(pressed), title,
    style: color ? { '--c': color } : null, onclick,
  }, label);
}

export function renderFilters(state, onChange) {
  const toggle = (set, value) => () => {
    set.has(value) ? set.delete(value) : set.add(value);
    onChange();
  };

  document.getElementById('people-filters').replaceChildren(...state.people.map((p) => chip({
    label: p.name,
    color: p.color,
    title: t(state.dict, `people.${p.id}.role`),
    pressed: state.activePeople.has(p.id),
    onclick: toggle(state.activePeople, p.id),
  })));

  document.getElementById('category-filters').replaceChildren(...state.categories.map((c) => chip({
    label: t(state.dict, `categories.${c}`),
    pressed: state.activeCategories.has(c),
    onclick: toggle(state.activeCategories, c),
  })));
}

function copyLink(state, id, button) {
  const url = new URL(location.href);
  url.searchParams.set('lang', state.locale);
  url.hash = id;
  const done = () => {
    button.textContent = t(state.dict, 'ui.linkCopied');
    setTimeout(() => { button.textContent = t(state.dict, 'ui.copyLink'); }, 2000);
  };
  if (navigator.clipboard) navigator.clipboard.writeText(url.href).then(done, () => prompt('', url.href));
  else prompt('', url.href);
}

function renderEvent(state, ev, peopleById) {
  const text = eventText(state.dict, ev.id);
  const people = ev.people.map((id) => peopleById[id]).filter(Boolean);
  const copyButton = el('button', { type: 'button', class: 'link-button' }, t(state.dict, 'ui.copyLink'));
  copyButton.addEventListener('click', () => copyLink(state, ev.id, copyButton));

  return el('li', { class: 'event', id: ev.id },
    el('span', { class: 'dot', 'aria-hidden': 'true', style: people[0] ? { '--c': people[0].color } : null }),
    el('details', {},
      el('summary', {},
        el('div', { class: 'meta' },
          el('time', { datetime: ev.date }, formatDate(ev.date, state.locale)),
          el('span', { class: 'category' }, t(state.dict, `categories.${ev.category}`)),
        ),
        el('h3', {}, text.title),
        people.length ? el('div', { class: 'people' },
          people.map((p) => el('span', { class: 'person-tag', style: { '--c': p.color } }, p.name))) : null,
      ),
      el('div', { class: 'body' },
        el('p', {}, text.summary),
        text.context ? el('aside', { class: 'context' },
          el('strong', {}, t(state.dict, 'ui.context')), text.context) : null,
        el('h4', {}, t(state.dict, 'ui.sources')),
        ev.sources.length
          ? el('ul', { class: 'sources' }, ev.sources.map((s) => el('li', {},
            el('a', { href: s.url, target: '_blank', rel: 'noopener noreferrer' }, s.outlet),
            s.title ? ` — ${s.title}` : '',
            s.lang ? ` (${s.lang})` : '')))
          : el('p', { class: 'pending' }, t(state.dict, 'ui.sourcePending')),
        el('div', { class: 'actions' }, copyButton),
      ),
    ),
  );
}

export function renderTimeline(state) {
  const root = document.getElementById('timeline');
  const visible = filterEvents(state);
  const peopleById = Object.fromEntries(state.people.map((p) => [p.id, p]));

  const byYear = new Map();
  for (const ev of visible) {
    const year = ev.date.slice(0, 4);
    if (!byYear.has(year)) byYear.set(year, []);
    byYear.get(year).push(ev);
  }

  root.replaceChildren(...[...byYear].map(([year, events]) => el('li', { class: 'year' },
    el('h2', {}, year),
    el('ol', {}, events.map((ev) => renderEvent(state, ev, peopleById))),
  )));
  root.setAttribute('aria-busy', 'false');

  document.getElementById('empty').hidden = visible.length > 0;
  document.getElementById('result-count').textContent =
    t(state.dict, 'ui.resultCount', { shown: visible.length, total: state.events.length });
}
