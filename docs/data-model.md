# Data model

Settled 2026-07-30 from `requirements.md` §3 and the decisions in
`decisions.md`. All records live in one array in `src/data/puzzles.json`
(D-002).

## Fields

| Field | Required | Type | Notes |
| --- | --- | --- | --- |
| `id` | yes | string | Slug, unique. Used for the modal URL fragment and as the image filename stem. |
| `name` | yes | string | Title only — artist is *not* part of it. `Van Gogh - Flowers` becomes name `Flowers`, artist `Van Gogh`. |
| `artist` | yes | string \| null | `null` means genuinely unknown, rendered as "Unattributed" (D-007). |
| `grid` | yes | `{rows, cols}` | Integers. Dimensions of the **completed image**, not the frame. |
| `blank` | yes | `"extra"` \| `"inline"` | See below. |
| `series` | no | string \| null | Proposed, not yet confirmed. |
| `images.front` | no | image object | |
| `images.back` | no | image object | |
| `description` | no | string | Free text. |

An image object is `{ "file": "...", "sourceUrl": "..." }`. `sourceUrl` is
proposed, not yet confirmed.

## `blank` — the two puzzle formats

This is the distinction §3 recorded as "7x6 with extra space", and it is a real
axis, not a universal property.

- **`"extra"`** — the grid is completely filled and the artwork is whole. The
  frame carries one additional empty cell in a corner, outside the image area.
  To start, you slide the corner tile into that extra space. Tile count is
  `rows × cols`.
- **`"inline"`** — classic 15-puzzle layout. One cell inside the grid is empty,
  so the assembled image is missing a tile. Tile count is `rows × cols - 1`.

Both are filterable, and independently of grid size.

## Derived, never stored

Computed at render time so they cannot drift from the source fields:

- `tileCount` — from `grid` and `blank` per the rules above.
- display size — `7×9`, from `grid`.
- filter option lists — artists, sizes, series are all derived by scanning the
  data, so a new value appears in the filter UI automatically when an entry
  uses it.

## Conventions

- **`id`**: lowercase, hyphenated, artist first — `van-gogh-flowers`. Stable
  once published, because it appears in shareable URLs.
- **Image filenames**: `<id>-front.jpg` / `<id>-back.jpg` in
  `src/images/puzzles/`. Deriving them from `id` means a typo shows as a broken
  image rather than a silently wrong one.
- **Unknown values**: `null`, never `""` or `"unknown"`. One representation of
  absent keeps filter and sort logic from special-casing three spellings.

## Example

```json
{
  "id": "van-gogh-flowers",
  "name": "Flowers",
  "artist": "Van Gogh",
  "series": "Art",
  "grid": { "rows": 7, "cols": 9 },
  "blank": "extra",
  "images": {
    "front": {
      "file": "van-gogh-flowers-front.jpg",
      "sourceUrl": "https://example.com/where-this-came-from"
    },
    "back": {
      "file": "van-gogh-flowers-back.jpg",
      "sourceUrl": "https://example.com/where-this-came-from"
    }
  },
  "description": "This is a hard puzzle."
}
```

## Still open

- Is `series` a field? Included above as optional pending confirmation.
- Is `sourceUrl` captured per image? Included above pending confirmation.
