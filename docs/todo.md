# TODO

Open work, roughly in the order it blocks other things.

## Contact address for image removal requests

`src/images.html` promises that a photograph will be removed on request, but
there is no address to make the request to. It currently points at GitHub
issues as a stand-in. Replace the `callout` block in that page once an address
exists.

## Photographs for the 38 entries added by the August 2026 scan

Every entry added in that pass went in with `"images": []` — the scan reads
PicClick listing summaries, which do not carry usable photographs. They are
listed in `image-wishlist.md` alongside the entries that need extra views.

## Back and detail photographs for the remaining 34 entries

Only two entries (`escher-eight-heads`, `escher-e128-birds`) have more than one
photograph. The rest have a single listing photo.

The harvest that would have filled these in tripped eBay's bot protection —
fetching 36 listing pages in a loop redirected the session to an account
verification page. Do not retry it as a loop. The workable options are a slow
manual pass a few listings at a time, or replacing borrowed photos with
originals as puzzles are acquired.

Gallery photos live under `.ux-image-carousel-item img` on an item page, and
the file naming convention is `<id>-2.jpg`, `<id>-3.jpg` and so on after
`<id>-front.jpg`.

## Playable sliding-puzzle grid

The catalog grid should itself behave like a slide puzzle: click and drag a
card into an adjacent empty space, tiles shifting the way the real puzzles do.

Notes before starting:
- The grid is currently `auto-fill` and reflows with the viewport, so tile
  positions are not addressable. A playable grid needs fixed coordinates.
- Filtering and sorting reorder cards, which fights a puzzle state. The two
  modes probably need to be separate — a "shuffle" toggle that freezes the
  current result set.
- Dragging must not break the click-to-open behaviour, and needs a keyboard
  equivalent.

## Resolve the 62 vs 63 tile conflict

Sellers list the `80 23xxx` art puzzles at 62 tiles. The owned Cézanne from
that run is 7×9 fully tiled with a spare corner cell, which is 63. Nine entries
are missing a grid because of this. One recount settles all of them.

A third number has now turned up: one Renoir listing is titled "VTG 72 PIECES
Sliding Puzzle 1881". 72 is 8×9, which is neither of the other two. Either the
art run used more than one size or that seller counted badly.

## Two crosswords, one art number

`kreuzwortraetsel-802931` and `french-crossword` both carry art number 802931.
They may be language editions sharing a number, or one listing may have misread
it. They have not been compared side by side. Both descriptions say so.

## Possible duplicate Escher listing

A listing titled "MC Escher Slide Sliding Tile Puzzle Sun and Moon Birds" was
found during the scan and deliberately *not* added — it is likely to be the
existing `escher-e128-birds` or `escher-sky-and-water` under a seller's own
wording. Worth one look before it is either added or dismissed.

## Collector's Edition sets need their designs named

Thirteen `Collector's Edition` entries are boxes of six mini puzzles whose
individual designs no listing names. Each box is really six catalog entries
waiting to be identified. Photographs of the box backs would settle them.

## Fill in the owner's own puzzles

Six or so puzzles beyond the Cézanne are held but not yet recorded. Each one
gives a verified anchor: art number, copyright year, grid, and format.
