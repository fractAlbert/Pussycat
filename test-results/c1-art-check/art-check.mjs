// Checks every catalog entry's `art` against the #11 rules. Run from the repo root:
//   node test-results/c1-art-check/art-check.mjs
import { readFileSync, existsSync } from 'node:fs';

const DIED = {
  'Paul Cézanne': 1906, 'Claude Monet': 1926, 'Pierre-Auguste Renoir': 1919,
  'Vincent van Gogh': 1890, 'Gustav Klimt': 1918, 'August Macke': 1914,
  'Franz Marc': 1916, 'Paul Gauguin': 1903, 'Henri de Toulouse-Lautrec': 1901,
  'Wassily Kandinsky': 1944, 'Paul Klee': 1940,
};
const THIS_YEAR = 2026;

function jpegSize(file) {
  const b = readFileSync(file);
  let i = 2;
  while (i < b.length) {
    const marker = b[i + 1];
    const len = b.readUInt16BE(i + 2);
    if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
      return { h: b.readUInt16BE(i + 5), w: b.readUInt16BE(i + 7) };
    }
    i += 2 + len;
  }
  throw new Error('no SOF in ' + file);
}

// Latest year a date string names: "1890–92" -> 1892, "c. 1881–86" -> 1886.
function lastYear(date) {
  const m = String(date).match(/(\d{4})(?:\s*[–-]\s*(\d{2,4}))?/);
  if (!m) return NaN;
  if (!m[2]) return Number(m[1]);
  return m[2].length === 4 ? Number(m[2]) : Number(m[1].slice(0, 2) + m[2]);
}

const data = JSON.parse(readFileSync('src/data/puzzles.json', 'utf8'));
const list = Array.isArray(data) ? data : data.puzzles;
let failures = 0;
const fail = (id, msg) => { failures++; console.log(`FAIL ${id}: ${msg}`); };

for (const p of list.filter((p) => p.art)) {
  const a = p.art;
  const file = `src/images/art/${a.file}`;
  for (const k of ['file', 'sourceUrl', 'title', 'date', 'basis']) if (!a[k]) fail(p.id, `missing art.${k}`);
  if (!/^https:\/\/commons\.wikimedia\.org\/wiki\/File:/.test(a.sourceUrl)) fail(p.id, 'sourceUrl is not a Commons file page');
  if (!(p.artist in DIED)) fail(p.id, `artist not on the allowed list: ${p.artist}`);
  else if (THIS_YEAR - DIED[p.artist] <= 70) fail(p.id, 'artist died 70 years ago or less');
  const year = lastYear(a.date);
  if (!(year <= 1930)) fail(p.id, `work date ${a.date} is not 1930 or earlier`);
  if (!existsSync(file)) { fail(p.id, `missing ${file}`); continue; }
  const { w, h } = jpegSize(file);
  if (Math.max(w, h) !== 800) fail(p.id, `long side ${Math.max(w, h)}, not 800`);
  let ratio = '-';
  if (p.grid) {
    const want = p.grid.cols / p.grid.rows;
    const off = Math.abs(w / h - want) / want;
    ratio = `${p.grid.cols}:${p.grid.rows} off ${(off * 100).toFixed(2)}%`;
    if (off > 0.01) fail(p.id, `ratio ${w}x${h} is more than 1% off ${p.grid.cols}:${p.grid.rows}`);
  }
  console.log(`ok   ${p.id.padEnd(30)} ${String(w).padStart(3)}x${String(h).padEnd(3)} date ${a.date} (${year}) ratio ${ratio}`);
}
const excluded = list.filter((p) => p.art && !(p.artist in DIED));
console.log(`entries with art: ${list.filter((p) => p.art).length}; on excluded artists: ${excluded.length}`);
console.log(failures ? `FAILED: ${failures}` : 'ALL PASS');
process.exit(failures ? 1 : 0);
