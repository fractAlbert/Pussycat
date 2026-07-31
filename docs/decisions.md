# Decisions

A running log of settled choices. One entry per decision, newest at the bottom.
If a decision is later reversed, keep the old entry and add a new one that
supersedes it — the history is the point.

## Format

```
### D-00N — <short title>
Date: YYYY-MM-DD
Decision: <what was chosen>
Alternatives considered: <what was rejected>
Rationale: <why>
Consequences: <what this locks in or rules out>
```

---

### D-001 — Static site, no database
Date: 2026-07-30
Decision: The catalog is plain HTML with no server-side database.
Alternatives considered: CMS, static site generator, app framework with a DB.
Rationale: Stated up front by the project owner.
Consequences: Catalog data lives in files in the repo. Any search, sort, or
filter happens in the browser. Updates require editing files and redeploying.
