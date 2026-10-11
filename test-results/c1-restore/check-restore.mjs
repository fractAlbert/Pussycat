// Checks that the back-photo work (first pushed to PR #18 after it had merged)
// is on this branch together with the grids that PR #20 added. Run from the repo root.
import { existsSync, readFileSync } from 'node:fs';

const d = JSON.parse(readFileSync('src/data/puzzles.json', 'utf8'));
const by = new Map(d.map((p) => [p.id, p]));
const problems = [];
const need = (cond, msg) => { if (!cond) problems.push(msg); };

need(d.length === 126, `expected 126 entries, found ${d.length}`);
need(!by.has('miro-1953'), 'miro-1953 (a duplicate of miro-80-2991) is still present');
need(!by.has('monet-dejeuner-sur-lherbe'), 'the mislabelled Monet id is still present');
need(by.has('monet-le-dejeuner-panneau-decoratif'), 'renamed Monet entry missing');

const m = by.get('miro-80-2991');
need(m.name.startsWith('Die Leitern durchziehen'), 'miro-80-2991 has no title');
need(m.images.length === 2 && m.images[1].label === 'Back', 'miro-80-2991 needs front and back photos');

const BACKS = ['kandinsky-trente', 'macke-indianer', 'macke-staudacherhaus-in-tegernsee', 'klimt-die-jungfrau', 'klimt-die-drei-lebensalter-der-frau',
  'monet-au-bord-de-leau-bennecourt', 'monet-le-dejeuner-panneau-decoratif', 'monet-jerusalem-artichoke-flowers', 'marc-red-horses', 'marc-little-blue-horse',
  'miro-die-zeitung', 'pussy-egypt-tut-anch-amun', 'pussy-joker-poker', 'pussy-pig', 'miro-80-2991'];
for (const id of BACKS) {
  const p = by.get(id);
  if (!p) { problems.push(`${id}: missing`); continue; }
  const back = p.images.find((i) => i.label === 'Back');
  need(back && existsSync(`src/images/puzzles/${back.file}`), `${id}: back photo missing`);
  need(p.images[0] && existsSync(`src/images/puzzles/${p.images[0].file}`), `${id}: front photo missing`);
}
// No file referenced by the catalog may be missing, and no stray old names may remain on disk.
for (const p of d) for (const i of p.images ?? []) need(existsSync(`src/images/puzzles/${i.file}`), `${p.id}: ${i.file} not on disk`);
for (const stale of ['miro-1953-front.jpg', 'monet-dejeuner-sur-lherbe-front.jpg']) need(!existsSync(`src/images/puzzles/${stale}`), `${stale} should have been renamed`);

// The unsupported guess must be gone, and the art numbers read from the backs present.
need(!d.some((p) => /Collector's Edition sets already/.test(p.description ?? '')), "an entry still guesses the Collector's Edition sets");
const NUMBERS = { 'kandinsky-trente': '80 2345', 'macke-indianer': '80 2932', 'macke-staudacherhaus-in-tegernsee': '80 2931', 'klimt-die-jungfrau': '80 23194',
  'klimt-die-drei-lebensalter-der-frau': '80 23191', 'monet-au-bord-de-leau-bennecourt': '80 23211', 'monet-le-dejeuner-panneau-decoratif': '80 23212',
  'monet-jerusalem-artichoke-flowers': '80 23214', 'marc-red-horses': '80 29 123', 'marc-little-blue-horse': '80 29 125', 'miro-die-zeitung': '80 2994',
  'pussy-egypt-tut-anch-amun': '80 2955', 'pussy-joker-poker': '80 2925' };
for (const [id, n] of Object.entries(NUMBERS)) need(by.get(id)?.artNumber === n, `${id}: art number should be ${n}, is ${by.get(id)?.artNumber}`);

// PR #20's grids survive.
const GRIDS = { 'renoir-1881': [9, 7, 'inline'], 'macke-spaziergaenger-am-see': [7, 7, 'extra'], 'cezanne-card-players': [7, 9, 'inline'], 'monet-80-23215': [9, 7, 'inline'] };
for (const [id, [r, c, b]] of Object.entries(GRIDS)) need(by.get(id)?.grid?.rows === r && by.get(id)?.grid?.cols === c && by.get(id)?.blank === b, `${id}: grid from PR #20 lost`);
const playable = d.filter((p) => p.art && p.grid && p.grid.rows >= 2 && p.grid.cols >= 2 && (p.blank === 'extra' || p.blank === 'inline'));
need(playable.length === 15, `expected 15 playable, found ${playable.length}`);

// The three entries sharing 80 2931 each say so.
for (const id of ['kreuzwortraetsel-802931', 'french-crossword', 'macke-staudacherhaus-in-tegernsee']) need(/80 2931/.test(by.get(id).description), `${id}: no note about 80 2931`);

// About page carries both rounds of changes.
const about = readFileSync('src/about.html', 'utf8');
for (const [what, text] of [['maker line', 'W. Breiter GmbH'], ['article-number blocks', '80 2321x'], ['Pussy numbering', '80 2925'], ['two layouts', 'They are not'], ['photo-counted grids', 'counted from sellers']])
  need(about.includes(text), `About page lacks the ${what}`);

console.log(`${d.length} entries; ${BACKS.length} entries with front and back photos; ${playable.length} playable`);
console.log(problems.length ? 'PROBLEMS:\n' + problems.join('\n') : 'ALL PASS');
process.exitCode = problems.length ? 1 : 0;
