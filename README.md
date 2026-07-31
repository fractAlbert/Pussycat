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

## Next step

Fill in `docs/requirements.md`, then work through `docs/open-questions.md`.
The answers there decide whether pages are hand-authored or data-driven, which
is the one choice everything else hangs off.
