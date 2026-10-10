// Every #11 candidate is either filled (has art) or listed with a reason.
// Run from the repo root: node test-results/c4-candidates/candidates.mjs
import { readFileSync } from 'node:fs';

const ARTISTS = ['Paul Cézanne', 'Claude Monet', 'Pierre-Auguste Renoir', 'Vincent van Gogh',
  'Gustav Klimt', 'August Macke', 'Franz Marc', 'Paul Gauguin', 'Henri de Toulouse-Lautrec',
  'Wassily Kandinsky', 'Paul Klee'];
const NOT_DONE = {
  'klee-uebermut': 'excluded by the rule: Übermut is from 1939',
  'klee-80-23155': "excluded by the rule: the puzzle shows the inscription '1940 … vor einer Stunde … Nacht'",
  'klee-80-23151': 'unidentified: no Commons match, so its date cannot be checked',
  'kandinsky-weiches-hart': "unconfirmed identity, and no Commons scan of 800px or more ('Molle rudesse' 520px, 'Softened Construction' 411x800)",
  'van-gogh-selbstportraet': 'unidentifiable: no puzzle photo, and Van Gogh painted more than 35 self-portraits',
};

const data = JSON.parse(readFileSync('src/data/puzzles.json', 'utf8'));
const list = Array.isArray(data) ? data : data.puzzles;
const candidates = list.filter((p) => ARTISTS.includes(p.artist) && p.series !== "Collector's Edition");
let filled = 0, reasoned = 0, missing = 0;
for (const p of candidates) {
  if (p.art) { filled++; console.log(`filled   ${p.id}`); }
  else if (NOT_DONE[p.id]) { reasoned++; console.log(`reason   ${p.id}: ${NOT_DONE[p.id]}`); }
  else { missing++; console.log(`MISSING  ${p.id}`); }
}
console.log(`candidates ${candidates.length}: filled ${filled}, with reason ${reasoned}, unaccounted ${missing}`);
console.log(missing ? 'FAILED' : 'ALL PASS');
process.exitCode = missing ? 1 : 0;
