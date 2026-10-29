# CLAUDE.md

Static, multilingual timeline of the Bolsonaro family in Brazilian politics. Plain HTML/CSS/JS (ES modules), no framework, no build step. Deployed with GitHub Pages from `main` (root).

## Commands

```sh
python3 -m http.server 8000           # serve locally (fetch() needs HTTP, file:// won't work)
node scripts/validate.mjs --strict    # same check CI runs; must pass before committing data changes
```

## Data model

- `data/events.json`: language-neutral facts only (`id`, `date`, `people`, `category`, `sources`). An optional `note` is for editors and is not displayed.
- `data/locales/<lang>.json`: UI strings plus `events.<id>.{title, summary, context?}`. `en` is the reference and must be complete. Other locales fall back to `en` key by key.
- Dates use the precision actually known: `YYYY`, `YYYY-MM` or `YYYY-MM-DD`.
- Adding a language means creating `data/locales/<code>.json` and registering it in `LOCALES` in `js/i18n.js`.

## Editorial rules (strict)

- Every event needs at least one verifiable public source. Find sources with web search and never write a URL from memory. Prefer wire services and major outlets (Reuters, AP, AFP, NPR, BBC, Al Jazeera) or primary documents. For the English audience, prefer English-language sources.
- Before adding a URL, check it returns 200 with curl. A 403 from Bloomberg, Washington Times and similar sites is usually bot-blocking, but every event must still have at least one source that actually opens.
- `summary` holds facts only, and allegations are attributed ("prosecutors allege…"). Note denials. Background goes in `context`.
- Never invent quotes. In translations, only use quotation marks for wording verified in the original language. Otherwise use indirect speech.
- Events after the model's knowledge cutoff must be researched, not recalled. Leave contested or single-source claims out.

## Code conventions

- DOM is built with the `el()` helper in `js/timeline.js`. Never use `innerHTML` with data.
- Colors are CSS custom properties on `:root`, with a dark-mode override.
