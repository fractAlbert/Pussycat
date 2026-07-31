# Data model

Not decided yet — this file exists so the shape of a catalog entry has one home
once section 3 of `requirements.md` is filled in.

## Working sketch (placeholder, expect to change)

A single puzzle might look something like:

```
id            stable slug, used in URLs and image filenames
title         name as it appears on the puzzle or packaging
manufacturer
year          or approximate range
type          e.g. 15-puzzle, rotating, sliding-block, other
size          grid dimensions
material
dimensions    physical size
condition
acquired
images[]      filenames under src/images/puzzles/
notes         free text
```

## Open points

- Which fields are required vs. optional
- Which fields are filterable (those need controlled vocabularies, not free text)
- How unknown/uncertain values are represented (blank? "unknown"? a date range?)
- Whether an entry can reference related entries (variants, reissues, sets)
