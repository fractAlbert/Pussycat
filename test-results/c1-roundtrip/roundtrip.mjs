import { pathToFileURL } from 'node:url';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
const root = process.argv[2];
const imp = (p) => import(pathToFileURL(join(root, p)).href);
const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
};
const { Puzzle } = await imp('src/assets/js/models/Puzzle.js');
const { EditDocument } = await imp('src/assets/js/annotate/EditDocument.js');
const { ChecklistState } = await imp('src/assets/js/checklist/ChecklistState.js');
let fail = 0;
const check = (ok, msg) => { console.log(`${ok ? 'ok' : 'FAIL'} ${msg}`); if (!ok) fail++; };

const records = JSON.parse(readFileSync(join(root, 'src/data/puzzles.json'), 'utf8'));
const puzzles = Puzzle.parseAll(records);
console.log(`loaded ${puzzles.length} of ${records.length}`);
check(puzzles.length === records.length, 'all entries load');

let drift = 0;
for (const p of puzzles) {
  const a = JSON.stringify(p.toRecord());
  const b = JSON.stringify(new Puzzle(p.toRecord()).toRecord());
  if (a !== b) drift++;
}
console.log(`record drift ${drift}`);
check(drift === 0, 'toRecord round-trips with no drift');

const art = { file: 'cezanne-mardi-gras.jpg', sourceUrl: 'https://example.org/a', title: 'Mardi Gras', date: '1888', basis: 'public domain' };
const base = puzzles.find((p) => p.id === 'cezanne-mardi-gras');
const withArt = new Puzzle({ ...base.toRecord(), art });
check(JSON.stringify(withArt.art) === JSON.stringify(art), 'art normalised');
check(withArt.isPlayable === true, 'sample entry is playable');

const doc = new EditDocument();
doc.setField(withArt, 'name', 'Mardi Gras (edited)');
const doc2 = EditDocument.fromJSON(JSON.parse(JSON.stringify(doc.toJSON([withArt]))));
const applied = doc2.applyTo(withArt);
const expected = { ...withArt.toRecord(), name: 'Mardi Gras (edited)' };
console.log(`art kept: ${JSON.stringify(applied.art) === JSON.stringify(art)}`);
check(JSON.stringify(applied.art) === JSON.stringify(art), 'applyTo keeps art');
check(JSON.stringify(applied.toRecord()) === JSON.stringify(expected), 'applyTo keeps every other field');

const cs = new ChecklistState(null);
cs.replace(['cezanne-mardi-gras', 'cezanne-card-players']);
const text = JSON.stringify(cs.toJSON(puzzles));
const cs2 = new ChecklistState(null);
cs2.loadText(text);
check(cs2.size === 2 && cs2.has('cezanne-mardi-gras') && cs2.has('cezanne-card-players'), 'checklist ids kept');
process.exit(fail ? 1 : 0);
