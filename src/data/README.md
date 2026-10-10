# Catalog data

`puzzles.json` is the entire catalog. One array, one object per puzzle.
Field reference: `../../docs/data-model.md`.

## Everything here is unverified

All current entries were compiled from sale listings and auction archives, and
every one carries `"verified": false`. Sellers describe the same puzzle several
different ways, so titles, article numbers, and tile counts should be treated as
leads rather than facts.

Set `"verified": true` on an entry only once it has been checked against the
physical puzzle.

**No images yet.** Listing photographs belong to the sellers who took them, so
none have been copied into this repo. `source` records where each entry came
from.

## Adding a puzzle

Only `id` and `name` are required. Record what is known and leave the rest out.

```json
{
  "id": "artist-title",
  "name": "Title",
  "artist": "Artist",
  "series": "Art",
  "grid": { "rows": 7, "cols": 7 },
  "blank": "extra",
  "images": {
    "front": { "file": "artist-title-front.jpg", "sourceUrl": "https://…" }
  },
  "art": {
    "file": "artist-title.jpg",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:…",
    "title": "Title of the artwork",
    "date": "1888",
    "basis": "Why this image may be reused."
  },
  "blankPosition": "bottom-right",
  "description": "",
  "source": "https://…",
  "verified": false
}
```

- Leave `brand` out for Pussycat puzzles. Set `"brand": "Pussy"` for the ones
  marked Pussy (D-011).
- `grid` describes the **completed image**, not the frame.
- **A size in a listing title is usually inches, not a grid.** `6x5` means a
  6 × 5 inch frame. Only record a grid when it follows from a tile count, an
  explicit grid statement, or the puzzle in hand.
- `blank` is `"extra"` (image complete, spare cell in a corner) or `"inline"`
  (one tile missing from the image). Give it together with `grid` — one without
  the other cannot yield a tile count.
- A 49-tile puzzle in a 7×7 arrangement is `"extra"`. A puzzle sold as "55
  pieces plus a place holder" in a 7×8 frame is `"inline"`.
- Unknown values are `null`, never `""`.
- Images go in `../images/puzzles/` named `<id>-front.jpg` / `<id>-back.jpg`.
- `art` is the clean artwork the **Play** button slices into tiles (D-012). Only
  `art.file` is required; `sourceUrl`, `title`, `date` and `basis` record where
  the image came from and why it may be reused. It is never hotlinked.
- Art files go in `../images/art/` named `<id>.jpg`, cropped to the aspect
  ratio `cols:rows` (a 7-column, 9-row puzzle needs a 7:9 image). They are kept
  apart from listing photographs so `sync-images` ignores them.
- `blankPosition` is only for `"inline"` puzzles: `"bottom-right"`,
  `"bottom-left"`, `"top-right"` or `"top-left"`, the corner where the gap sits
  when solved. Absent or `null` means bottom-right. On an `"extra"` puzzle it is
  ignored, with a console warning.
- **Play rule:** a puzzle shows Play only when `art`, `grid` (rows and cols each
  at least 2) and `blank` are all recorded. Without a grid there is no Play;
  the size is never guessed.

A malformed entry is skipped with a warning in the browser console rather than
breaking the page — so if a puzzle does not appear, check there first.
