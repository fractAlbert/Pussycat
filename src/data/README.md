# Catalog data

`puzzles.json` is the entire catalog. One array, one object per puzzle.
Field reference: `../../docs/data-model.md`.

## The current contents are seed data

Two entries are labelled `Placeholder` and describe no real puzzle. They exist
only so the filters have more than one option to render. **Delete them** as soon
as real entries go in — they are not catalog facts.

The `van-gogh-flowers` entry comes from the example in the requirements; its
details still need verifying.

## Adding a puzzle

```json
{
  "id": "artist-title",
  "name": "Title",
  "artist": "Artist",
  "series": null,
  "grid": { "rows": 7, "cols": 9 },
  "blank": "extra",
  "images": {
    "front": { "file": "artist-title-front.jpg", "sourceUrl": "https://…" }
  },
  "description": ""
}
```

- `grid` describes the **completed image**, not the frame.
- `blank` is `"extra"` (image complete, spare cell in a corner) or `"inline"`
  (one tile missing from the image).
- Unknown values are `null`, never `""`.
- Images go in `../images/puzzles/` named `<id>-front.jpg` / `<id>-back.jpg`.

A malformed entry is skipped with a warning in the browser console rather than
breaking the page — so if a puzzle does not appear, check there first.
