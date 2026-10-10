import { pathToFileURL } from 'node:url';
import { join } from 'node:path';
const root = process.argv[2];
const imp = (p) => import(pathToFileURL(join(root, p)).href);
const { Board } = await imp('src/assets/js/play/Board.js');
const { Puzzle } = await imp('src/assets/js/models/Puzzle.js');
let fail = 0;
const check = (ok, msg) => { console.log(`${ok ? 'ok' : 'FAIL'} ${msg}`); if (!ok) fail++; };
const mulberry32 = (a) => () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const CORNERS = ['bottom-right', 'bottom-left', 'top-right', 'top-left'];
const configs = (sizes) => sizes.flatMap(([rows, cols]) => [
  { rows, cols, format: 'extra' },
  ...CORNERS.map((corner) => ({ rows, cols, format: 'inline', corner })),
]);
const label = (c) => `${c.rows}x${c.cols} ${c.format}${c.corner ? ' ' + c.corner : ''}`;

// Parity of the arrangement as a permutation of cell ids (hole = its home id),
// counted by inversions so it is independent of the Board's cycle-count code.
function arrangementParity(b) {
  const idx = new Map(b.cells.map((c, i) => [c, i]));
  const holeId = idx.get(b.holeHome);
  const seq = b.cells.map((c) => { const t = b.tileAt(c); return t === null ? holeId : idx.get(t); });
  let inv = 0;
  for (let i = 0; i < seq.length; i++) for (let j = i + 1; j < seq.length; j++) if (seq[i] > seq[j]) inv++;
  return inv % 2;
}
const signature = (b) => b.cells.map((c) => b.tileAt(c) ?? '_').join('|');
const holeDistance = (b) => {
  const [r, c] = b.coords(b.hole); const [hr, hc] = b.coords(b.holeHome);
  return Math.abs(r - hr) + Math.abs(c - hc);
};

// (a) seeded shuffles
for (const cfg of configs([[7, 9], [9, 7], [7, 7], [3, 3], [2, 2]])) {
  const b = new Board(cfg);
  const rng = mulberry32(12345);
  let bad = 0;
  for (let i = 0; i < 500; i++) {
    b.shuffle(rng);
    if (b.isSolved() || b.moves !== 0) bad++;
    if (cfg.format === 'extra') {
      const corner = `${cfg.rows - 1}-${cfg.cols - 1}`;
      if (b.tileAt(corner) !== corner || b.hole !== 'spare' || b.tileAt('spare') !== null) bad++;
      if (arrangementParity(b) !== 0) bad++;
    } else if (arrangementParity(b) !== holeDistance(b) % 2) bad++;
    if (new Set(b.cells.map((c) => b.tileAt(c))).size !== b.cells.length) bad++;
  }
  check(bad === 0, `shuffle 500x ${label(cfg)} (bad=${bad})`);
}

// (b) BFS reachable set equals all parity-satisfying arrangements
function permutations(arr) {
  if (arr.length <= 1) return [arr];
  return arr.flatMap((x, i) => permutations([...arr.slice(0, i), ...arr.slice(i + 1)]).map((p) => [x, ...p]));
}
for (const cfg of configs([[2, 2], [2, 3], [3, 2]])) {
  const b = new Board(cfg);
  const cells = b.cells;
  const seen = new Set([signature(b)]);
  let frontier = [signature(b)];
  const load = (sig) => {
    const parts = sig.split('|');
    cells.forEach((c, i) => b.occupant.set(c, parts[i] === '_' ? null : parts[i]));
    b.hole = cells[parts.indexOf('_')];
  };
  const spareTiles = new Set();
  while (frontier.length) {
    const next = [];
    for (const sig of frontier) {
      load(sig);
      for (const tile of b.movableTiles()) {
        load(sig);
        if (!b.move(tile)) { check(false, 'movable tile refused'); continue; }
        if (b.tileAt('spare') !== null) spareTiles.add(b.tileAt('spare'));
        const s = signature(b);
        if (!seen.has(s)) { seen.add(s); next.push(s); }
      }
    }
    frontier = next;
  }
  // Every arrangement satisfying the parity rule, enumerated independently.
  const holeId = cells.indexOf(b.holeHome);
  const home = b.coords(b.holeHome);
  const expected = new Set();
  for (const perm of permutations(cells.map((_, i) => i))) {
    let inv = 0;
    for (let i = 0; i < perm.length; i++) for (let j = i + 1; j < perm.length; j++) if (perm[i] > perm[j]) inv++;
    const hc = b.coords(cells[perm.indexOf(holeId)]);
    const dist = Math.abs(hc[0] - home[0]) + Math.abs(hc[1] - home[1]);
    if (inv % 2 === dist % 2) expected.add(perm.map((id) => (id === holeId ? '_' : cells[id])).join('|'));
  }
  if (cfg.format === 'extra') {
    // Only the corner tile can enter the spare, so arrangements with another
    // tile in the spare are outside the playable set.
    const corner = `${cfg.rows - 1}-${cfg.cols - 1}`;
    for (const sig of [...expected]) {
      const inSpare = sig.split('|')[cells.indexOf('spare')];
      if (inSpare !== '_' && inSpare !== corner) expected.delete(sig);
      // With the spare empty there is no other gap, so nothing can have moved
      // the corner tile out of its cell.
      if (inSpare === '_' && sig.split('|')[cells.indexOf(corner)] !== corner) expected.delete(sig);
    }
    check(spareTiles.size === 1 && spareTiles.has(corner), `${label(cfg)} only the corner tile enters the spare`);
  }
  const equal = expected.size === seen.size && [...seen].every((s) => expected.has(s));
  console.log(`   ${label(cfg)}: reachable=${seen.size} expected=${expected.size}`);
  check(equal, `BFS reachable == parity set ${label(cfg)}`);
}

// (c) nearlySolve + its one finishing move
for (const cfg of configs([[2, 2], [3, 3], [7, 9], [9, 7]])) {
  const b = new Board(cfg);
  b.nearlySolve();
  const wasSolved = b.isSolved();
  const m0 = b.moves;
  const displaced = b.cells.find((c) => c !== b.hole && b.tileAt(c) !== null && b.tileAt(c) !== c);
  const moved = b.move(b.tileAt(displaced));
  check(!wasSolved && m0 === 0 && moved && b.isSolved(), `nearlySolve + 1 move solves ${label(cfg)}`);
  if (cfg.format === 'extra') {
    const fresh = new Board(cfg);
    const before = fresh.state().cornerHome;
    fresh.nearlySolve();
    check(before === true && fresh.state().cornerHome === false && fresh.state().hole === `${cfg.rows - 1}-${cfg.cols - 1}`, `state().cornerHome ${label(cfg)}`);
  }
}

// keyboard mapping and constructor guard
{
  const b = new Board({ rows: 3, cols: 3, format: 'extra' });
  check(b.tileInto('right') === '2-2' && b.tileInto('left') === null && b.tileInto('up') === null && b.tileInto('down') === null, 'extra hole=spare tileInto');
  const i = new Board({ rows: 3, cols: 3, format: 'inline', corner: 'top-left' });
  check(i.tileInto('up') === '1-0' && i.tileInto('left') === '0-1' && i.tileInto('down') === null && i.tileInto('right') === null, 'inline top-left tileInto');
  check(b.state().hole === 'spare' && i.state().hole === '0-0', 'state().hole');
  let threw = false;
  try { new Board({ rows: 1, cols: 5, format: 'extra' }); } catch { threw = true; }
  check(threw, 'constructor throws for 1xN');
}

// (d) isPlayable
{
  const art = { file: 'a.jpg' };
  const mk = (o) => new Puzzle({ id: 'x', name: 'x', ...o });
  check(!mk({ art, grid: { rows: 1, cols: 5 }, blank: 'extra' }).isPlayable, 'isPlayable false 1xN');
  check(!mk({ art, grid: { rows: 5, cols: 1 }, blank: 'inline' }).isPlayable, 'isPlayable false Nx1');
  check(!mk({ grid: { rows: 9, cols: 7 }, blank: 'extra' }).isPlayable, 'isPlayable false without art');
  check(mk({ art, grid: { rows: 9, cols: 7 }, blank: 'extra' }).isPlayable, 'isPlayable true 9x7 extra with art');
  check(mk({ art, grid: { rows: 3, cols: 3 }, blank: 'inline', blankPosition: 'top-left' }).blankCorner === 'top-left', 'blankCorner inline');
  check(mk({ art, grid: { rows: 3, cols: 3 }, blank: 'extra', blankPosition: 'top-left' }).blankCorner === 'bottom-right', 'blankCorner extra');
  check(mk({ blankPosition: 'middle' }).blankPosition === null, 'unknown blankPosition -> null');
  // art.file lands inside a CSS url(), so anything but a bare file name is dropped
  check(mk({ art: { file: 'x.jpg");background:url(https://e.test/t.png' }, grid: { rows: 3, cols: 3 }, blank: 'extra' }).art === null, 'unsafe art file name -> no art');
  check(mk({ art: { file: '../x.jpg' } }).art === null, 'art path traversal -> no art');
  check(mk({ art: { file: 'cezanne-mardi-gras.jpg' } }).art.file === 'cezanne-mardi-gras.jpg', 'plain art file name kept');
}
process.exit(fail ? 1 : 0);
