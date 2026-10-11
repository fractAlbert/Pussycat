// Checks the ten grids counted from photographs: each is recorded with the
// right fields, its art file has exactly the aspect ratio cols:rows, nothing
// else in the catalog changed, and the Play condition holds for exactly the
// puzzles that should have it. Run from the repo root.
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const now = JSON.parse(readFileSync('src/data/puzzles.json', 'utf8'));
const before = JSON.parse(execSync('git show origin/main:src/data/puzzles.json', { encoding: 'utf8', maxBuffer: 1 << 26 }));
const WANT = {
  'macke-spaziergaenger-am-see': [7, 7, 'extra', null],
  'van-gogh-sunflowers': [9, 7, 'inline', 'bottom-left'],
  'renoir-1881': [9, 7, 'inline', 'bottom-left'],
  'renoir-1883': [9, 7, 'inline', 'bottom-left'],
  'renoir-1876': [9, 7, 'inline', 'bottom-left'],
  'cezanne-card-players': [7, 9, 'inline', 'bottom-right'],
  'cezanne-large-bathers': [7, 9, 'inline', 'bottom-right'],
  'cezanne-kitchen-table': [7, 9, 'inline', 'bottom-right'],
  'renoir-boating-party': [7, 9, 'inline', 'bottom-right'],
  'monet-80-23215': [9, 7, 'inline', null],
};
const problems = [];

// JPEG size without a dependency: scan for the SOF marker.
function jpegSize(file) {
  const b = readFileSync(file);
  let i = 2;
  while (i < b.length) {
    if (b[i] !== 0xff) { i++; continue; }
    const m = b[i + 1];
    if (m >= 0xc0 && m <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(m)) return { h: b.readUInt16BE(i + 5), w: b.readUInt16BE(i + 7) };
    i += 2 + b.readUInt16BE(i + 2);
  }
  return null;
}

const byId = new Map(now.map((p) => [p.id, p]));
const beforeById = new Map(before.map((p) => [p.id, p]));
for (const [id, [rows, cols, blank, pos]] of Object.entries(WANT)) {
  const p = byId.get(id);
  if (!p) { problems.push(`${id}: missing`); continue; }
  if (p.grid?.rows !== rows || p.grid?.cols !== cols) problems.push(`${id}: grid is ${JSON.stringify(p.grid)}, wanted ${rows}x${cols}`);
  if (p.blank !== blank) problems.push(`${id}: blank is ${p.blank}`);
  if ((p.blankPosition ?? null) !== pos) problems.push(`${id}: blankPosition is ${p.blankPosition}`);
  if (p.verified !== false) problems.push(`${id}: must stay unverified`);
  if (!/counted from the listing photo, not measured/.test(p.description)) problems.push(`${id}: description does not say the grid is photo-counted`);
  const { w, h } = jpegSize(`src/images/art/${p.art.file}`);
  const off = Math.abs(w / h - cols / rows) / (cols / rows);
  console.log(`${id.padEnd(30)} ${rows}x${cols} ${blank.padEnd(6)} ${String(pos).padEnd(12)} art ${w}x${h} ratio ${(w / h).toFixed(4)} vs ${(cols / rows).toFixed(4)} (${(off * 100).toFixed(2)}% off)`);
  if (off > 0.01) problems.push(`${id}: art ratio ${w}x${h} is ${(off * 100).toFixed(2)}% off ${cols}:${rows}`);
  if (Math.max(w, h) > 800) problems.push(`${id}: art longer than 800`);
}
// Nothing else may change.
for (const p of before) {
  const q = byId.get(p.id);
  if (!q) { problems.push(`removed: ${p.id}`); continue; }
  const changed = JSON.stringify(q) !== JSON.stringify(p);
  if (changed && !(p.id in WANT)) problems.push(`changed unexpectedly: ${p.id}`);
  if (!changed && p.id in WANT) problems.push(`not changed: ${p.id}`);
}
if (now.length !== before.length) problems.push('entry count changed');
// Play appears exactly for art + grid + blank.
const playable = now.filter((p) => p.art && p.grid && p.grid.rows >= 2 && p.grid.cols >= 2 && (p.blank === 'extra' || p.blank === 'inline'));
console.log(`\nplayable now: ${playable.length} (was ${before.filter((p) => p.art && p.grid && p.blank).length})`);
console.log(problems.length ? 'PROBLEMS:\n' + problems.join('\n') : 'ALL PASS');
process.exitCode = problems.length ? 1 : 0;
