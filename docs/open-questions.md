# Open questions

Things that need an answer before the baseline is settled. Move each one to
`decisions.md` once it's resolved.

Updated 2026-07-30 against the filled-in `requirements.md`.

## Resolved

| # | Question | Answer | Recorded as |
| --- | --- | --- | --- |
| 1 | How is puzzle data stored? | Single `src/data/puzzles.json` | D-002 |
| 2 | Hand-authored pages or data-driven? | Data-driven — one template, one array | D-002 |
| 3 | Must it work from `file://`? | No — Netlify hosting | D-004 |
| 4 | How many puzzles? | ~7 owned at launch, ceiling ~100 | D-002 |
| 6 | Who maintains entries? | Owner only, via agent or hand-edited JSON | D-002 |
| 7 | Search/filter at launch? | Yes — sort by name/artist, filter by size/artist, text search | §5 |
| 8 | Playable in browser? | No — catalog only, "information for collectors" (§1) | assumed |
| — | Framework or vanilla? | Vanilla ES modules + classes, no build step | D-005 |
| 9 | Is artist its own field? | Yes, separate from name | D-007 |

## Still open

| # | Question | Why it matters | Status |
| --- | --- | --- | --- |
| 10 | What does **size** actually vary over? | §3 gives `7x6 with extra space` as one free-text value, but §5 wants size as a *filter*. Filters need a small fixed set of values, not prose. **This blocks the data model.** | Open |
| 11 | Is **series** a field? | §1 singles out "the art series", implying there are named lines a collector would browse by. | Open |
| 12 | What identifies a puzzle that has no images and no description? | Only Name and Size are required. Two different puzzles could share both. | Open |
| 13 | Image rights and provenance | Images are sourced from "www" (§6) onto a public site. Storing a source URL per image costs nothing now and is painful to reconstruct later. | Open |
