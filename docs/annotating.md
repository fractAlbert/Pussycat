# Annotating the catalog

A way to correct the data from the page itself, instead of hand-editing
`src/data/puzzles.json`. See D-010 for why it works this way.

**Nothing you do here changes the site.** A static page cannot write to disk,
so the catalog and the image folder are out of reach by construction. Changes
accumulate in the browser and leave as a single downloaded file.

## Using it

Serve the site (`node scripts/serve.js`, then http://localhost:8000) and click
**Annotate**, top right of the controls. A toolbar appears and every card
becomes editable and draggable. Click any card to open its editor.

**Mark for deletion.** Tick the box, choose *Duplicate*, *Not applicable* or
*Other*, and add a note. For a duplicate, say which entry it duplicates — that
is what makes the merge possible later. The card greys out and gets a badge,
but stays on the page so you can change your mind.

**Edit any field.** Name, artist, series, art number, copyright year, grid,
format, description, source URL, and the *owned* and *verified* flags. Changed
fields get a red bar. The card behind updates as you type, so you can see what
you are doing. Put a field back to its original value and the edit disappears
rather than being recorded as a no-op.

**Add or replace photographs.** *Add an image…* picks a file from your machine
and adds it as a new view; *Replace…* under an existing photo swaps that one
out. The filename is worked out for you from the entry id, following the
convention in `data-model.md` — `<id>-front.jpg`, then `<id>-2.jpg` and so on.
The picture appears on the card immediately.

**Reorder.** Drag cards around. The sort switches to *Custom order*, and the
full intended order is recorded.

Dragging rearranges **what is currently on screen** — the new arrangement starts
from the sort you are looking at, so the first drag moves one card and leaves
everything else where it was. Dropping onto a card further down puts you after
it; dropping onto one further up puts you before it. Entries hidden by a filter
keep their positions, so an arrangement made while filtered still describes the
whole catalog.

**Notes.** The box in the toolbar is for anything that does not belong to a
single entry.

## Saving and resuming

Work is kept in browser storage as you go, so closing the tab does not lose it
— reopening the page picks up where you left off and says so.

That storage holds only a few megabytes, and embedded photographs fill it fast.
If it overflows, the toolbar turns red and says the changes will not survive the
tab closing. **Download the file when that happens.** The file is the real
artefact; browser storage is only a safety net.

- **Save edit file** writes `pussycat-edits-<date>.json`.
- **Load edit file…** reads one back in, so you can stop and continue another
  day, or on another machine.
- **Discard all** throws away everything pending.

Then hand the file over to be applied.

## The page remembers the file you saved to

In Chrome and Edge, **Save edit file** opens a *Save As* dialog. Once you pick a
place, the page remembers that file: later saves overwrite it silently instead
of dropping numbered copies in Downloads, and the next visit offers to open it
again. The checklist page does the same with its own file.

This only works with Save As. A plain download tells the page nothing about
where the file went, so Firefox and Safari — which have no file picker API —
fall back to an ordinary download with nothing remembered.

What is stored is a `FileSystemFileHandle`, which lives in IndexedDB rather than
a cookie: a handle is an opaque object, not text, so `document.cookie` cannot
hold one. It also has no expiry to renew.

Two things follow:

- **Permission.** A browser will not hand a page access to a file on a fresh
  load without asking, and it can only ask from a click. When permission has
  lapsed the page shows *Continue from &lt;file&gt;?* with an **Open it** button
  instead of loading silently.
- **Precedence.** Work already in this browser wins over the file, because
  localStorage is written on every change and so is never older. The file is
  read automatically only when there is nothing local to lose — a new browser,
  a different machine, or cleared storage. Otherwise the page just says which
  file it is linked to.

If the file has been deleted or moved, the page says so once and stops looking
for it — the handle is dropped rather than left to fail again.

## What is in the file

JSON, grouped by entry rather than by kind of change, so everything about one
puzzle sits together. It carries a `howToApply` block describing itself, so it
makes sense on its own.

```json
{
  "format": "pussycat-edits",
  "version": 1,
  "summary": { "deletions": 1, "edited": 1, "images": 2, "reordered": true },
  "howToApply": "…instructions…",
  "notes": "",
  "entries": [
    {
      "id": "french-crossword",
      "currentName": "French Crossword",
      "action": "delete",
      "delete": { "reason": "duplicate", "note": "same art number as kreuzwortraetsel-802931" }
    },
    {
      "id": "monet-80-23215",
      "currentName": "Monet (title unrecorded)",
      "action": "update",
      "fields": { "name": { "from": "Monet (title unrecorded)", "to": "Water Lilies" } },
      "images": [
        {
          "op": "replace",
          "targetFile": "monet-80-23215-front.png",
          "replaces": "monet-80-23215-front.jpg",
          "sourceName": "IMG_2931.PNG",
          "bytes": 402113,
          "label": "Front",
          "data": "data:image/png;base64,…"
        }
      ]
    }
  ],
  "order": { "sort": "manual", "ids": ["…"] }
}
```

Two details that matter when applying it:

- Every field edit records **`from` as well as `to`**. If `from` no longer
  matches what the catalog says, the data changed underneath the annotation and
  it should be questioned rather than applied.
- An image's **`data` holds the actual file**, base64-encoded. Decoding it to
  `src/images/puzzles/<targetFile>` is how the photograph reaches the repo —
  there is no other route from a file picker to the folder.

## Known limits

- Filter buttons come from the catalog on disk, so an artist or series you type
  in annotate mode has no button until the edit file is applied. If a filter is
  active, retitling an entry out of it will hide the card.
- Photographs are stored at full size. A dozen phone photos make a large file.
- The checklist and about pages have no annotate mode; this is the catalog grid
  only.

## The checklist

`checklist.html` is a separate, simpler thing on the same principle: tick the
puzzles you hold, and the ticks leave as a file.

The boxes **start empty**. They are not pre-filled from `owned` in the catalog,
because a list you carry to a fair is one you fill in — pre-ticking it would
mean rubbing marks out to correct them. Entries the catalog already records as
held are tagged `recorded` beside the name instead, so the two never get
confused.

Ticks are kept in this browser as you go. **Save ticks to a file** writes
`pussycat-checklist-<date>.json`; **Load a file…** reads one back.

The file carries the ticked ids, and two fields that exist to stop a half-done
pass from quietly destroying data:

- `recordedOwnedButNotTicked` — entries the catalog marks as held that were not
  ticked. These are questioned before anything is cleared, since the likely
  cause is an unfinished pass rather than a puzzle leaving the collection.
- `tickedButNotInCatalog` — ticks whose entry has since been merged or renamed
  away. They survive a save-and-load rather than being dropped.
