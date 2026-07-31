# Pussycat

A catalog of Pussycat slide puzzles. Plain HTML, no database.

**Status:** pre-baseline. Structure only — no code written yet.

## Layout

```
docs/                 requirements, decisions, open questions
  reference/          source material, scans, notes
src/                  the site itself
  assets/css/         stylesheets
  assets/js/          scripts
  assets/img/         site chrome (logo, icons, backgrounds)
  images/puzzles/     puzzle photography
  data/               catalog data files
  pages/              individual puzzle pages, if hand-authored
```

`src/assets/img/` is for the site's own furniture; `src/images/puzzles/` is
catalog content. They're kept apart so the catalog images can be managed,
backed up, or moved independently of the site design.

## Running it locally

There is no build step. But the catalog is loaded with `fetch()`, which
browsers block for `file://` URLs, so **opening `src/index.html` directly from
disk will not work** — the page will load with an error message. Serve the
folder over HTTP instead:

```
npx serve src
```

Then open the URL it prints. Any static server will do.

## Deploying

Netlify serves `src/` as-is (`netlify.toml`), no build command.

## Adding a puzzle

Edit `src/data/puzzles.json` and drop images into `src/images/puzzles/`.
See `src/data/README.md` for the entry format.

## Adding a filter

Subclass `Filter` in `src/assets/js/filters/`, implement `valueFor()`, and
register it in `filters/index.js`. Nothing else changes — the filter UI and the
matching logic are both driven by the registry.
