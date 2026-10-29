import { LOCALES, detectLocale, loadLocale, persistLocale, applyStatic } from './i18n.js';
import { renderFilters, renderTimeline } from './timeline.js';

const state = {
  locale: detectLocale(),
  dict: {},
  people: [],
  categories: [],
  events: [],
  activePeople: new Set(),
  activeCategories: new Set(),
  query: '',
};

function render() {
  renderFilters(state, render);
  renderTimeline(state);
}

// Opens and scrolls to the event in the URL hash, clearing filters that hide it.
function openFromHash() {
  const id = decodeURIComponent(location.hash.slice(1));
  if (!id || !state.events.some((e) => e.id === id)) return;
  if (!document.getElementById(id)) {
    state.activePeople.clear();
    state.activeCategories.clear();
    state.query = '';
    document.getElementById('search').value = '';
    render();
  }
  const node = document.getElementById(id);
  node.querySelector('details').open = true;
  node.scrollIntoView({ block: 'center' });
}

async function setLocale(locale) {
  state.locale = locale;
  state.dict = await loadLocale(locale);
  persistLocale(locale);
  applyStatic(state.dict, locale);
  render();
}

async function init() {
  const [people, events] = await Promise.all([
    fetch('data/people.json').then((r) => r.json()),
    fetch('data/events.json').then((r) => r.json()),
  ]);
  state.people = people.people;
  state.categories = events.categories;
  state.events = events.events.slice().sort((a, b) => a.date.localeCompare(b.date));

  const select = document.getElementById('lang-select');
  select.replaceChildren(...Object.entries(LOCALES).map(([code, name]) => new Option(name, code)));
  select.value = state.locale;
  select.addEventListener('change', () => setLocale(select.value));

  document.getElementById('search').addEventListener('input', (e) => {
    state.query = e.target.value;
    renderTimeline(state);
  });

  document.getElementById('clear-filters').addEventListener('click', () => {
    state.activePeople.clear();
    state.activeCategories.clear();
    state.query = '';
    document.getElementById('search').value = '';
    render();
  });

  window.addEventListener('hashchange', openFromHash);

  await setLocale(state.locale);
  openFromHash();
}

init().catch((err) => {
  console.error(err);
  document.getElementById('timeline').textContent =
    'Could not load the timeline data. If you opened this file directly, serve it over HTTP (see README).';
});
