// Picasso ride-along: owner photos present, 800px long side, no EXIF; entry fields set; no art.
// Run from the repo root: node test-results/c5-picasso/picasso.mjs
import { readFileSync } from 'node:fs';

function inspect(file) {
  const b = readFileSync(file);
  let i = 2, exif = false, size = null;
  while (i < b.length && b[i] === 0xff) {
    const marker = b[i + 1];
    const len = b.readUInt16BE(i + 2);
    if (marker === 0xe1 && b.toString('latin1', i + 4, i + 8) === 'Exif') exif = true;
    if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
      size = { h: b.readUInt16BE(i + 5), w: b.readUInt16BE(i + 7) };
      break;
    }
    i += 2 + len;
  }
  return { exif, size };
}

const data = JSON.parse(readFileSync('src/data/puzzles.json', 'utf8'));
const p = (Array.isArray(data) ? data : data.puzzles).find((x) => x.id === 'picasso-80-23185');
const checks = [];
const check = (label, ok) => checks.push([label, !!ok]);
for (const side of ['front', 'back']) {
  const { exif, size } = inspect(`src/images/puzzles/picasso-80-23185-${side}.jpg`);
  check(`${side}: ${size.w}x${size.h}, long side 800`, Math.max(size.w, size.h) === 800);
  check(`${side}: no EXIF block`, !exif);
}
check(`name "${p.name}"`, p.name === 'Kopf eines Mannes mit Strohhut');
check(`copyright ${p.copyright}`, p.copyright === 1996);
check(`grid ${JSON.stringify(p.grid)}`, p.grid?.rows === 9 && p.grid?.cols === 7);
check(`blank ${p.blank}, blankPosition ${p.blankPosition}`, p.blank === 'inline' && p.blankPosition === 'top-right');
check(`owned ${p.owned}`, p.owned === true);
check(`images ${p.images.map((x) => x.file).join(', ')}`, p.images.length === 2);
check('no art', !p.art);
for (const [label, ok] of checks) console.log(`${ok ? 'ok  ' : 'FAIL'} ${label}`);
const failed = checks.filter(([, ok]) => !ok).length;
console.log(failed ? `FAILED: ${failed}` : 'ALL PASS');
process.exitCode = failed ? 1 : 0;
