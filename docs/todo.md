# TODO

Open work, roughly in the order it blocks other things.

## Contact address for image removal requests

`src/images.html` promises that a photograph will be removed on request, but
there is no address to make the request to. It currently points at GitHub
issues as a stand-in. Replace the `callout` block in that page once an address
exists.

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

## Fill in the owner's own puzzles

Six or so puzzles beyond the Cézanne are held but not yet recorded. Each one
gives a verified anchor: art number, copyright year, grid, and format.
