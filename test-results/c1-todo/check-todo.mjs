// Checks the To do page's sorting logic against the catalog, with the rules
// restated independently. Run from the repo root.
import { readFileSync } from 'node:fs';
import { Puzzle } from '../../src/assets/js/models/Puzzle.js';
import { sortOut, PUBLIC_DOMAIN_ARTISTS, HELD_BACK } from '../../src/assets/js/todo/needs.js';

const raw = JSON.parse(readFileSync('src/data/puzzles.json', 'utf8'));
const puzzles = Puzzle.parseAll(raw);
const L = sortOut(puzzles);
const problems = [];
const ids = (rows) => rows.map((r) => r.puzzle.id);
const expect = (label, got, want) => { if (JSON.stringify(got) !== JSON.stringify(want)) problems.push(`${label}: got ${got}, wanted ${want}`); };

// Independent restatement of "playable".
const playable = raw.filter((p) => p.art && p.grid && p.grid.rows >= 2 && p.grid.cols >= 2 && (p.blank === 'extra' || p.blank === 'inline'));
expect('playable count', L.playable.length, playable.length);

// Lists must not overlap where they should not, and each row must truly belong.
for (const r of L.needsCount) if (!r.puzzle.art || r.puzzle.isPlayable) problems.push(`needsCount wrong: ${r.puzzle.id}`);
for (const r of L.needsArt) {
  if (r.puzzle.art) problems.push(`needsArt has art: ${r.puzzle.id}`);
  if (!PUBLIC_DOMAIN_ARTISTS.has(r.puzzle.artist)) problems.push(`needsArt not a public-domain artist: ${r.puzzle.id}`);
  if (r.puzzle.series === "Collector's Edition") problems.push(`needsArt includes a set: ${r.puzzle.id}`);
  if (r.puzzle.id in HELD_BACK) problems.push(`needsArt includes a held-back work: ${r.puzzle.id}`);
}
for (const r of L.needsPhoto) if (r.puzzle.images.length) problems.push(`needsPhoto has a photo: ${r.puzzle.id}`);
for (const r of L.needsGrid) if (r.puzzle.grid && r.puzzle.blank) problems.push(`needsGrid is complete: ${r.puzzle.id}`);
for (const p of puzzles) {
  const listed = ids(L.needsPhoto).includes(p.id);
  if (!p.images.length && !listed) problems.push(`missing from needsPhoto: ${p.id}`);
}
// Every unplayable puzzle with art, or by a public-domain artist, appears somewhere.
for (const p of puzzles) {
  if (p.isPlayable) continue;
  const inAny = [L.needsCount, L.needsArt, L.heldBack].some((l) => ids(l).includes(p.id));
  const set = p.series === "Collector's Edition";
  if ((p.art || PUBLIC_DOMAIN_ARTISTS.has(p.artist)) && !set && !inAny) problems.push(`unaccounted for: ${p.id}`);
}
// Pinned expectations at the time of writing.
expect('needsCount', ids(L.needsCount).sort(), ['klimt-the-kiss', 'macke-modegeschaeft', 'marc-blauschwarzer-fuchs', 'marc-cat-under-a-tree']);
expect('heldBack', ids(L.heldBack).sort(), ['kandinsky-trente', 'klee-80-23155', 'klee-uebermut']);
const detail = L.needsArt.filter((r) => r.notes.some((n) => /detail/.test(n))).map((r) => r.puzzle.id).sort();
expect('detail crops', detail, ['klimt-die-drei-lebensalter-der-frau', 'klimt-die-jungfrau', 'macke-indianer']);

console.log(`puzzles ${puzzles.length}; playable ${L.playable.length}`);
console.log(`needs a tile count ${L.needsCount.length}: ${ids(L.needsCount).join(', ')}`);
console.log(`needs art ${L.needsArt.length}: ${ids(L.needsArt).join(', ')}`);
console.log(`held back ${L.heldBack.length}: ${ids(L.heldBack).join(', ')}`);
console.log(`needs a photo ${L.needsPhoto.length}; needs a grid or layout ${L.needsGrid.length}`);
console.log(problems.length ? 'PROBLEMS:\n' + problems.join('\n') : 'ALL PASS');
process.exitCode = problems.length ? 1 : 0;
