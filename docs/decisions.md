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

### D-002 — One JSON file holds the whole catalog
Date: 2026-07-30
Decision: All puzzle records live in a single `src/data/puzzles.json`, loaded
once at page load and rendered client-side.
Alternatives considered: One file per puzzle; data inlined into hand-written
HTML pages.
Rationale: Ceiling is ~100 entries (requirements §7). At that size the whole
catalog is a small download, and sort/filter/search over an in-memory array is
instant. A single file is also the easiest thing to hand-edit or have an agent
edit (§8).
Consequences: Puzzle pages are not hand-authored — there is one template. Adding
a puzzle means adding one object to one array. Revisit only if the catalog grows
past a few thousand entries, which is far outside the stated range.

### D-003 — Grid view with a modal detail, no per-puzzle URLs by default
Date: 2026-07-30
Decision: Catalog is a grid; detail opens as a modal (§4).
Rationale: Stated in requirements.
Consequences: A modal has no address of its own unless one is added. For a
collector site, a shareable link to a single puzzle is worth having, so the
modal should also set a URL fragment (e.g. `#van-gogh-flowers`) and open from
that fragment on load. This keeps the modal UX and makes entries linkable.

### D-004 — Hosted on Netlify, public
Date: 2026-07-30
Decision: Public site deployed to Netlify, no custom domain (§9).
Consequences: Resolves open question #3 — the site is served over HTTP, so
`fetch()` of a local JSON file works and the data need not be a `.js` file.
Note for local work: opening `index.html` directly from disk will *not* work
for the same reason; local preview needs a one-line static server.

### D-005 — Vanilla ES modules and classes; no framework, no build step
Date: 2026-07-30
Decision: The site is written as native ES modules with plain JavaScript
classes. No framework, no bundler, no build step. Files are edited and served
as-is.
Alternatives considered: native Web Components; Lit; Alpine.js.
Rationale: The only real machinery is `filter change → recompute visible set →
update grid`, over ~100 records held in memory. A framework's core value is
efficient reconciliation of frequently-changing state, which this app does not
generate. Hand-written plumbing is roughly 200 lines, written once. The project
owner also wants class-based structure to be the visible architecture rather
than something a library imposes.
Consequences:
- Netlify deploys the repo directly with no build configuration.
- Two known costs are accepted deliberately:
  1. Re-render must not rebuild the whole grid on every keystroke, or text
     input loses focus and scroll position. Render once, then toggle
     visibility (or key cards by id and patch only what changed).
  2. There is no template escaping for free. Any value interpolated into
     markup must be escaped, or a puzzle description containing `<` breaks
     the page.
- Not a one-way door: if galleries, transitions, or routed per-puzzle pages
  arrive later, Lit is a contained migration. The filter classes below port
  over untouched; only the rendering components change.

### D-006 — Filters are classes in a registry
Date: 2026-07-30
Decision: Each filter is a class with a `matches(puzzle, value)` method,
registered into a central registry. The catalog asks the registry, never
individual filters.
Rationale: Adding the tenth filter must not require touching the other nine.
This is the structure the project owner specifically wanted to see in practice.
Consequences: A new filter is one new file plus one registration line. This
pattern is independent of D-005 and survives a later framework change.

### D-007 — Artist is a first-class field
Date: 2026-07-30
Decision: `artist` is stored as its own field, separate from `name`.
Alternatives considered: parsing it out of names like `Van Gogh - Flowers`.
Rationale: Requirements §5 asks for sort and filter by artist. Splitting on
`" - "` fails the first time a title contains a dash, and silently produces
wrong groupings rather than an error.
Consequences: Every entry needs an artist value, including a deliberate
convention for puzzles with no known artist (e.g. `null` rendered as
"Unattributed") so the filter list stays clean.

### D-008 — Size is a grid plus a blank-format flag
Date: 2026-07-30
Decision: Size is stored as `grid: {rows, cols}` describing the completed
image, plus `blank: "extra" | "inline"`. Both are filterable, independently.
Alternatives considered: grid dimensions alone; free-text size with no filter.
Rationale: The two formats differ in what the assembled puzzle looks like. With
`"extra"` the artwork is complete and the empty cell sits outside the image in
a corner; with `"inline"` the blank is a missing tile inside the image. That is
a distinction a collector browses on, so it cannot be folded into the grid
numbers or left as prose.
Consequences: Numbers sort correctly and group into a short filter list. Tile
count is derived, not stored: `rows × cols` for `"extra"`, `rows × cols - 1`
for `"inline"`.

### D-009 — Only id and name are required; records carry provenance
Date: 2026-07-30
Decision: Every field except `id` and `name` is optional. Two fields are added:
`source` (the URL a record was compiled from) and `verified` (false unless
checked against the physical puzzle).
Supersedes: the required `grid`/`blank`/`artist` of D-007 and D-008. Those
decisions still stand on *how* the fields are shaped; only their obligation is
relaxed.
Rationale: Discovered when the first real data went in. Catalog entries are
compiled from sale listings, which typically give a title, sometimes an artist
and a tile count, and often nothing else. Requiring a grid would have made most
of what is actually known unrecordable, and the alternative — guessing the
missing values — would put invented measurements in a reference collectors are
meant to trust.
Consequences:
- Unknown size and format read as "Format not recorded" on the card, and their
  rows are omitted from the detail view rather than shown empty.
- Filters skip entries with no value for that filter, so filtering by size
  narrows to entries whose size is actually known.
- Sorting by size puts unrecorded entries last instead of treating them as
  zero.
- A filter offering a single value is still shown when some entries lack that
  value, since it can still narrow the list — one "Art" button separates the
  art series from the promotional and puzzle-book designs.
- The detail view states plainly when an entry is unverified and links to the
  listing it came from.
