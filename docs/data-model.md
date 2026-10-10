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
| `blankPosition` | no | `"bottom-right"` \| `"bottom-left"` \| `"top-right"` \| `"top-left"` \| null | `"inline"` only. Where the gap sits when solved; `null` or absent means bottom-right. Ignored, with a console warning, on `"extra"`. |
| `brand` | no | string | As marked on the puzzle. Absent means `"Pussycat"`; set only for other names, so far `"Pussy"` (D-011). |
| `series` | no | string \| null | |
| `images` | no | array of image objects | Ordered. The first is the catalog card thumbnail. |
| `art` | no | `{file, sourceUrl, title, date, basis}` \| null | The clean artwork that Play slices into tiles (D-012). Only `file` is required inside; the rest records provenance. Local file in `src/images/art/`, never hotlinked. |
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

**The two formats occur within the same run and the same grid.** Two owned 63-cell
art puzzles (7 × 9, the Cézanne held portrait as 9 rows × 7 columns) differ: the Cézanne is `"extra"` (63 tiles) and the Kandinsky is
`"inline"` (62). This is what the long-running "62 or 63 tiles?" disagreement
among sellers turned out to be — not a miscount, but two layouts. A tile count
therefore cannot be inferred from a grid alone; the format has to be seen.

## Play

A puzzle is playable from the detail view (D-012). **Play shows only when `art`,
`grid` and `blank` are all recorded, and `grid` has `rows` and `cols` each at
least 2.** No grid, no Play: size is never guessed.

The art file must already be cropped to the aspect ratio `cols:rows` before it
is added. The page slices it into `rows × cols` tiles as it is and does not crop
it, so a file with the wrong ratio plays stretched.

### Where the blank sits

- **`"extra"`** — the spare cell sits to the right of the bottom-right image
  cell. The owner confirmed this holds for every extra-space puzzle
  (2026-10-10).
- **`"inline"`** — the gap home comes from `blankPosition`, default
  bottom-right.

### Art images

Art files live in `src/images/art/` as `<id>.jpg`, apart from the listing
photographs in `src/images/puzzles/`, so `sync-images` ignores them.

Pilot provenance, `cezanne-mardi-gras.jpg`: the Wikimedia Commons original
`File:Mardi gras, par Paul Cézanne, Yorck.jpg` (1580×2000), cropped to a 1556×2000
box at x=12 (exactly 7:9, centred), resized to 622×800 with PowerShell
System.Drawing (HighQualityBicubic), saved as JPEG at quality 85. Licence as
returned by the Commons API: `LicenseShortName` "Public domain", `License` "pd".

Every art image follows the same method: a Commons original, cropped to the
region the puzzle shows (or the whole painting when no puzzle photo exists),
trimmed centred to exactly cols:rows when a grid is known, resized so the long
side is 800px with PowerShell System.Drawing, and saved as JPEG at quality 85.
The crop box for each image is recorded in the evidence for #11
(`test-results/c3-contact-sheet/crops.json`). The licence is checked through
the Commons API.

## Never read a listing's dimensions as a grid

Sellers quote the frame size in inches, and it looks exactly like a grid.
`6x5` in a title is almost always 6 × 5 inches, not 30 tiles. One listing reads
"49 Tiles ~ 6”x5”" — the same puzzle described both ways in one line.

A grid may only be recorded when it follows from a **tile count** (49 → 7×7,
55 plus a place holder → 7×8), from an explicit grid statement, or from
measuring the puzzle in hand. This mistake created a phantom 6×5 entry that
duplicated `escher-e72-fish`.

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
