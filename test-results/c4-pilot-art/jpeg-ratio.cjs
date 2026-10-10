// Reads a JPEG's SOF dimensions and compares them with the catalog entry's cols/rows.
const fs = require('fs');
const [file, id] = process.argv.slice(2);
const b = fs.readFileSync(file);
let i = 2, w, h;
while (i < b.length) {
  const marker = b[i + 1], len = b.readUInt16BE(i + 2);
  if (marker >= 0xc0 && marker <= 0xc3) { h = b.readUInt16BE(i + 5); w = b.readUInt16BE(i + 7); break; }
  i += 2 + len;
}
const entry = JSON.parse(fs.readFileSync('src/data/puzzles.json', 'utf8')).find((e) => e.id === id);
const want = entry.grid.cols / entry.grid.rows;
const diff = ((w / h) / want - 1) * 100;
console.log(`file ${file}: ${w}x${h}, ratio ${(w / h).toFixed(4)}`);
console.log(`entry ${id}: grid ${entry.grid.rows} rows x ${entry.grid.cols} cols, cols/rows ${want.toFixed(4)}`);
console.log(`difference ${diff.toFixed(3)}% -> ${Math.abs(diff) <= 1 ? 'ok within 1%' : 'FAIL'}`);
console.log(`art.sourceUrl ${entry.art.sourceUrl}`);
console.log(`art.basis ${entry.art.basis}`);
process.exit(Math.abs(diff) <= 1 ? 0 : 1);
