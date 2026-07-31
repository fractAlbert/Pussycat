# Open questions

Things that need an answer before the baseline is settled. Move each one to
`decisions.md` once it's resolved.

| # | Question | Why it matters | Status |
| --- | --- | --- | --- |
| 1 | How is puzzle data stored — one JSON file, one file per puzzle, or inlined in HTML? | Determines whether pages are hand-written or generated | Open |
| 2 | Are pages hand-authored HTML, or generated from data at page load with JS? | "Plain HTML, no DB" allows both; they differ a lot in editing effort | Open |
| 3 | Must it work when opened directly from disk (`file://`)? | `fetch()` of a local JSON file is blocked under `file://` | Open |
| 4 | How many puzzles, roughly? | A few dozen vs. a few thousand changes the whole approach | Open |
| 5 | Where do images come from, and who owns them? | Affects hosting, sizes, and what can be published | Open |
| 6 | Who maintains entries after launch, and with what tooling? | Drives the data format more than anything else | Open |
| 7 | Search/filter needed at launch, or later? | Client-side search is cheap but not free | Open |
| 8 | Are the puzzles playable in-browser, or is this catalog-only? | Big scope difference | Open |
