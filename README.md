# Bolsonaro Family Timeline

An open source, interactive, multilingual timeline of the Bolsonaro family in Brazilian politics. Every event must link to at least one public source.

Plain HTML, CSS and JavaScript (ES modules). No framework and no build step.

## Run locally

The page loads its data with `fetch`, so it needs to be served over HTTP (opening `index.html` directly won't work):

```sh
python3 -m http.server 8000
# open http://localhost:8000
```

## Structure

```
data/people.json        family members (id, name, color)
data/events.json        language-neutral event data: date, people, category, sources
data/locales/<lang>.json  UI strings + translated event titles/summaries, keyed by event id
js/i18n.js              locale detection (?lang=, saved choice, browser), fallback to English
js/timeline.js          rendering, filters, search
js/app.js               bootstrapping, deep links (#event-id)
scripts/validate.mjs    data checks + translation report
```

## Validate

```sh
node scripts/validate.mjs           # warnings for missing sources/translations
node scripts/validate.mjs --strict  # missing sources become errors
```

## Adding a language

1. Copy `data/locales/en.json` to `data/locales/<code>.json` (e.g. `es.json`, `fr.json`) and translate.
2. Register it in `LOCALES` in `js/i18n.js`.

Untranslated events fall back to English, so a language can be added incrementally.

## Deploy

Live at <https://bolsonaro.fyi>. It is served by GitHub Pages from the `main` branch (root folder); the custom domain is set in the `CNAME` file. Any other static host works too.

## License

Code: [MIT](LICENSE). Content in `data/`: [CC BY-SA 4.0](LICENSE-CONTENT).

See [CONTRIBUTING.md](CONTRIBUTING.md) for the editorial guidelines.
