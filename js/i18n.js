// Locale registry: add a new language here and create data/locales/<code>.json.
export const LOCALES = {
  en: 'English',
  'pt-BR': 'Português (Brasil)',
  es: 'Español',
  fr: 'Français',
};

export const DEFAULT_LOCALE = 'en';
const STORAGE_KEY = 'fbtimeline.lang';
const cache = new Map();

function matchLocale(tag) {
  if (!tag) return null;
  if (LOCALES[tag]) return tag;
  const base = tag.toLowerCase().split('-')[0];
  return Object.keys(LOCALES).find((l) => l.toLowerCase().split('-')[0] === base) || null;
}

function readStored() {
  try { return localStorage.getItem(STORAGE_KEY); } catch { return null; }
}

export function persistLocale(locale) {
  try { localStorage.setItem(STORAGE_KEY, locale); } catch { /* storage unavailable */ }
  const url = new URL(location.href);
  url.searchParams.set('lang', locale);
  history.replaceState(null, '', url);
}

// Priority: ?lang= in the URL, saved preference, browser languages, default.
export function detectLocale() {
  const candidates = [
    new URLSearchParams(location.search).get('lang'),
    readStored(),
    ...(navigator.languages || [navigator.language]),
  ];
  for (const c of candidates) {
    const match = matchLocale(c);
    if (match) return match;
  }
  return DEFAULT_LOCALE;
}

async function fetchLocale(locale) {
  if (!cache.has(locale)) {
    cache.set(locale, fetch(`data/locales/${locale}.json`, { cache: 'no-cache' }).then((r) => {
      if (!r.ok) throw new Error(`Could not load locale ${locale}`);
      return r.json();
    }));
  }
  return cache.get(locale);
}

function deepMerge(base, override) {
  const out = { ...base };
  for (const [k, v] of Object.entries(override || {})) {
    out[k] = v && typeof v === 'object' && !Array.isArray(v) ? deepMerge(base?.[k], v) : v;
  }
  return out;
}

// Missing strings fall back to the default locale.
export async function loadLocale(locale) {
  const base = await fetchLocale(DEFAULT_LOCALE);
  if (locale === DEFAULT_LOCALE) return base;
  return deepMerge(base, await fetchLocale(locale));
}

export function t(dict, key, vars = {}) {
  const value = key.split('.').reduce((obj, part) => obj?.[part], dict);
  if (typeof value !== 'string') return key;
  return value.replace(/\{(\w+)\}/g, (_, name) => vars[name] ?? `{${name}}`);
}

export function applyStatic(dict, locale) {
  document.documentElement.lang = locale;
  document.title = t(dict, 'ui.title');
  document.querySelectorAll('[data-i18n]').forEach((node) => {
    node.textContent = t(dict, node.dataset.i18n);
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach((node) => {
    node.placeholder = t(dict, node.dataset.i18nPlaceholder);
  });
  document.querySelectorAll('[data-i18n-aria-label]').forEach((node) => {
    node.setAttribute('aria-label', t(dict, node.dataset.i18nAriaLabel));
  });
}
