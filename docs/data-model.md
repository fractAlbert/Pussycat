# Data model

Settled 2026-07-30 from `requirements.md` §3 and the decisions in
`decisions.md`. All records live in one array in `src/data/puzzles.json`
(D-002).

## Fields

| Field | Required | Type | Notes |
| --- | --- | --- | --- |
| `id` | yes | string | Slug, unique. Used for the modal URL fragment and as the image filename stem. |
| `name` | yes | string | Title only — artist is *not* part of it. `Van Gogh - Flowers` becomes name `Flowers`, artist `Van Gogh`. |
| `artist` | no | string \| null | `null` means genuinely unknown, rendered as "Unattributed" (D-007). |
| `grid` | no | `{rows, cols}` \| null | Integers. Dimensions of the **completed image**, not the frame. |
| `blank` | no | `"extra"` \| `"inline"` \| null | See below. Give it together with `grid`. |
| `series` | no | string \| null | |
| `images` | no | array of image objects | Ordered. The first is the catalog card thumbnail. |
| `description` | no | string | Free text. |
| `artNumber` | no | string \| null | Printed on the puzzle, e.g. `80 23244`. Searchable with or without spaces. |
| `copyright` | no | number \| null | Copyright year printed on the puzzle, not the year of the artwork. |
| `source` | no | string \| null | URL the record was compiled from. |
| `owned` | no | boolean | Drives the checklist. Defaults to `false`. |
| `verified` | no | boolean | `true` only when checked against the physical puzzle. Defaults to `false`. |

## Art numbers

The closest thing to a catalogue key. Two families are visible so far:

- `80 29xx` — 49-tile 7×7 puzzles (wildlife, dinosaurs, crosswords).
- `80 23xxx` — the fine-art run carrying a 1999 copyright (Cézanne, Monet,
  Klee, Picasso).

Escher puzzles instead use an `E nnn` reference from the Escher catalogue
raisonné, which is stored in the same field.

An image object is `{ "file": "...", "sourceUrl": "...", "label": null }`.

`file` is always a local file in `src/images/puzzles/`. Images are **never**
hotlinked — a listing URL stops resolving as soon as the item sells, and a
catalog whose pictures quietly vanish is worse than one with none. `sourceUrl`
exists for attribution only and is never used to load an image.

`label` is `"Front"`, `"Back"`, or `null`. It is set only when the view is
actually known. Listing photographs arrive in arbitrary order, so calling the
second one "Back" would record a guess as a fact; those stay `null` and display
as "View 2", "View 3".

The older `{ "front": …, "back": … }` shape is still accepted and normalised on
load, so old hand-written entries keep working.

Only `id` and `name` are required (D-009). Entries are built from sale
listings, which routinely give a title and nothing else; a schema that
demanded a grid would have made most of what is known unrecordable.

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
