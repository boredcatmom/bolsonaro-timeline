# Contributing

Thanks for helping! This project is only as strong as its sources.

## Editorial rules

1. **Every event needs at least one public, verifiable source.** Prefer wire services and major outlets (Reuters, AP, AFP, BBC, Folha, Estadão, O Globo, g1) or primary documents (STF, TSE, PGR, US Treasury). For the English version, an English-language source is preferred when one exists.
2. **The `summary` states facts only.** Who did what, when, with numbers when available. Attribute allegations ("prosecutors allege…", "according to investigators…") and note when someone denies them.
3. **Background goes in `context`.** It is displayed separately and labeled as context, for readers unfamiliar with Brazil.
4. **Use the precision you actually have.** Dates can be `YYYY`, `YYYY-MM` or `YYYY-MM-DD`.

## Adding an event

1. Add the data to `data/events.json`:

   ```json
   {
     "id": "2026-03-example-event",
     "date": "2026-03-15",
     "people": ["flavio"],
     "category": "foreign",
     "sources": [
       { "url": "https://…", "outlet": "Reuters", "title": "Headline of the article", "lang": "en" }
     ]
   }
   ```

   An optional `note` field is for editors and is not displayed.

2. Add the English text to `data/locales/en.json` under `events` (required), and other languages if you can:

   ```json
   "2026-03-example-event": { "title": "…", "summary": "…", "context": "…optional…" }
   ```

3. Run `node scripts/validate.mjs` and open a pull request.

## Translations

Translations are welcome even for a few events at a time; missing ones fall back to English. The validator prints a progress report per language.
