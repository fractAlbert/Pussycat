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

## Settled: 62 vs 63 is a difference of format, not a miscount

*Resolved 2026-09-05 by measuring two owned puzzles.*

Both are 7×9, and they differ in the blank:

- Cézanne *Mardi Gras* (`80 23244`) — 7×9 **extra**, spare corner cell, **63**.
- Kandinsky (`80 2341`) — 7×9 **inline**, blank inside the picture, **62**.

So the art run used both layouts, and the sellers quoting 62 tiles were
describing the inline ones rather than counting badly. Neither number is wrong.
A 7×9 art puzzle therefore cannot have its tile count assumed from its grid —
the format has to be seen.

Still open: one Renoir listing is titled "VTG 72 PIECES Sliding Puzzle 1881".
72 is 8×9, which is neither. That one is still unexplained.

## Which Paradise article number is real

`paradise-parrots-80-2938` and `-80-2983` turned out to photograph the same
puzzle, and were merged on 2026-09-05. The two article numbers are a digit
transposition of one another, so only one is right and the surviving entry
keeps `80 2983` by accident of which id was deleted. The puzzle in hand, or a
clearer photograph of the back, settles it.

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

Four are now recorded and verified: the Cézanne, the Kandinsky (`80 2341`),
Escher *Fish and Boats* (E 72), and Magritte *L'Éclat du Jour*. Any others in
the collection are still unrecorded, and each one is worth more than a listing:
it gives a verified anchor for art number, copyright year, grid and format.

Two of the four still have no copyright year recorded, which is printed on the
puzzle and would help date the runs.
