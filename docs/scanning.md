# How to scan for new puzzles

A repeatable pass for finding entries the catalog does not have yet. The whole
thing takes about fifteen minutes and needs no login.

## The short version

> Scan for new Pussycat puzzles. Follow `docs/scanning.md`.

That is enough of an instruction. The rest of this file is what happens next.

## 1. Use PicClick, not eBay

**eBay blocks automated fetches.** `curl` gets a 403, and a loop over item
pages trips bot protection and redirects the session to account verification.
WorthPoint 403s as well. Etsy 403s.

[PicClick](https://picclick.com) mirrors live eBay listings, is fetchable, and
returns a full page of results in one request. It is the scan surface.

Fetch these four, each of which turns up stock the others miss:

| URL | Covers |
| --- | --- |
| `https://picclick.com/?q=pussycat+slide+puzzle` | US listings |
| `https://picclick.com/?q=pussycat+slide+puzzle&page=2` | the long tail, where the rarities sit |
| `https://picclick.de/?q=pussycat+schiebepuzzle` | German listings — different inventory entirely |
| `https://picclick.co.uk/?q=pussycat+slide+puzzle` | UK listings |

Page 2 of the US search is not optional. It is where the Dalí, Franz Marc and
Collector's Edition finds came from.

Ask for **title, art number, price and link** for every result. Individual
listing pages can be fetched the same way when a title is ambiguous.

## 2. Diff against the catalog

```
node -e "const d=require('./src/data/puzzles.json'); for(const p of d) console.log([p.id,p.artNumber||'-',p.name].join(' | '))"
```

Read the scan results against that list and sort each one into:

- **new puzzle** — nothing in the catalog matches
- **new fact** — the puzzle is there but the listing supplies an art number, a
  title, a tile count, or a copyright year the entry is missing
- **already known** — skip

The second bucket is worth as much as the first. One pass filled in six missing
art numbers and replaced three "title unrecorded" placeholders.

## 3. Write entries the careful way

Only `id` and `name` are required (D-009). Everything else is optional, so
record what the listing actually says and leave the rest `null`.

Three rules, each of which exists because breaking it caused a real problem:

- **Never read a size in a title as a grid.** `6x5`, `7x9`, `9x7` in a listing
  title is almost always inches or centimetres. A grid may only be recorded
  when it follows from a tile count (49 → 7×7), from an explicit grid
  statement, or from the puzzle in hand. Put the listing's claim in
  `description` instead. See `data-model.md`.
- **Check art numbers for collisions before adding.** Two entries sharing a
  number means either a language variant or a misread listing, and it needs
  saying out loud in both descriptions rather than quietly merging them.
- **Everything from a listing is `"verified": false`.** Sellers describe the
  same puzzle several different ways.

Check for collisions with:

```
node -e "const d=require('./src/data/puzzles.json'),m={};for(const p of d){if(!p.artNumber)continue;const k=p.artNumber.replace(/\s+/g,'');(m[k]=m[k]||[]).push(p.id)};for(const[k,v]of Object.entries(m))if(v.length>1)console.log(k,v)"
```

## 4. Images stay manual

Listing photographs cannot be bulk-downloaded — that is what tripped eBay's
protection. New entries go in with `"images": []`, and
`docs/image-wishlist.md` collects the listings worth saving photos from by
hand. After dropping files into `src/images/puzzles/`:

```
node scripts/sync-images.js
```

## 5. Verify before committing

```
node -e "const d=require('./src/data/puzzles.json');const s=new Set();for(const p of d){if(s.has(p.id))throw new Error('dup '+p.id);s.add(p.id)}console.log(d.length,'entries, ids unique')"
```

Then load the page and confirm the new entries render and the filters picked up
any new artist or series values automatically.

## Where else to look

Worth a search when a deeper pass is wanted, though none are as productive as
PicClick:

- BoardGameGeek — where the 100-piece op art puzzle came from
- Google Arts & Culture — has at least one Pussycat item catalogued
- `vintagemanstuff.com` — a stable shop, unlike auction listings
- German search terms generally: `Schiebepuzzle`, `Geduldspiel`, `Folienpuzzle`
