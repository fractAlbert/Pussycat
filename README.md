# Pussycat

A catalog of Pussycat slide puzzles. Plain HTML, no database.

**Status:** working catalog. 92 entries, grid with filters and search, detail
modal, printable checklist. Almost everything is compiled from sale listings
and carries `"verified": false` until checked against a physical puzzle.

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
browsers block for `file://` URLs, so **double-clicking `src/index.html` will
not work** — you get the page frame with no puzzles in it. It has to be served
over HTTP.

```
node scripts/serve.js
```

Then open **http://localhost:8000**. Pass a port to use a different one
(`node scripts/serve.js 8080`). No dependencies and no network needed — it is
plain Node, like the other scripts here.

Any static server does the same job if you would rather (`npx serve src`,
`python -m http.server -d src`). Nothing in `scripts/` is deployed; Netlify
serves `src/` directly.

## Correcting the data

The catalog page has an **Annotate** button. It turns the grid into an editor:
mark entries for deletion with a reason, fix any field, attach photographs from
your machine, drag cards into a new order. Nothing on disk is touched — the
work downloads as a single edit file to be applied later, and can be loaded back
in to carry on another day.

The checklist page works the same way: tick what you hold, save the ticks to a
file, load them back another day.

See `docs/annotating.md`.

## Deploying

Netlify serves `src/` as-is (`netlify.toml`), no build command.

## Adding a puzzle

Edit `src/data/puzzles.json` and drop images into `src/images/puzzles/`.
See `src/data/README.md` for the entry format.

## Adding a filter

Subclass `Filter` in `src/assets/js/filters/`, implement `valueFor()`, and
register it in `filters/index.js`. Nothing else changes — the filter UI and the
matching logic are both driven by the registry.
