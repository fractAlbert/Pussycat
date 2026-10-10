/**
 * The sliding-puzzle rules for play mode: pure logic, no DOM, no dependencies.
 *
 * Cells are keyed "r-c"; an "extra" board also has one spare cell, "spare",
 * sitting just right of the bottom-right image cell. A tile is named by the
 * cell it belongs in (its home). Moving, the solved test, shuffling and the
 * solvability parity rule are ported from Shuffle.
 *
 * "extra": rows×cols tiles, every image cell filled, the hole starts in the
 * spare. Only the bottom-right tile can ever enter the spare, so the rest of
 * the board is the usual puzzle with the bottom-right cell as its hole.
 * "inline": one tile is missing from the image itself; the hole's home is the
 * corner cell named by `corner`.
 */

export const SPARE = 'spare';

// Where the tile that moves in each direction sits, relative to the hole.
const DELTAS = {
  up: [1, 0],
  down: [-1, 0],
  left: [0, 1],
  right: [0, -1],
};

export class Board {
  constructor({ rows, cols, format, corner = 'bottom-right' }) {
    if (!(rows >= 2 && cols >= 2)) throw new Error('a board needs at least 2 rows and 2 columns');
    if (format !== 'extra' && format !== 'inline') throw new Error(`unknown board format "${format}"`);
    this.rows = rows;
    this.cols = cols;
    this.format = format;
    this.corner = corner;

    // Where the hole belongs when solved: the spare, or the named corner cell.
    if (format === 'extra') {
      this.holeHome = SPARE;
    } else {
      const r = corner.startsWith('bottom') ? rows - 1 : 0;
      const c = corner.endsWith('right') ? cols - 1 : 0;
      this.holeHome = key(r, c);
    }

    this.cells = [];
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) this.cells.push(key(r, c));
    if (format === 'extra') this.cells.push(SPARE);

    this.reset();
  }

  // ---- reading ---------------------------------------------------------

  /** Home key of the tile sitting in a cell, or null for the hole. */
  tileAt(cell) {
    return this.occupant.get(cell) ?? null;
  }

  cellOf(tileHome) {
    for (const [cell, tile] of this.occupant) if (tile === tileHome) return cell;
    return null;
  }

  /** Tiles next to the hole, i.e. the ones a move would accept. */
  movableTiles() {
    return this.neighbours(this.hole).map((cell) => this.tileAt(cell));
  }

  /** The tile a keyboard direction would slide, or null when there is none. */
  tileInto(direction) {
    const delta = DELTAS[direction];
    if (!delta) return null;
    const [r, c] = this.coords(this.hole);
    const cell = this.cellAtCoords(r + delta[0], c + delta[1]);
    return cell ? this.tileAt(cell) : null;
  }

  isSolved() {
    for (const [cell, tile] of this.occupant) {
      if (tile !== null && tile !== cell) return false;
    }
    return this.hole === this.holeHome;
  }

  /** A plain snapshot for the test hook. */
  state() {
    const corner = key(this.rows - 1, this.cols - 1);
    return {
      rows: this.rows,
      cols: this.cols,
      format: this.format,
      hole: this.hole,
      solved: this.isSolved(),
      moves: this.moves,
      cornerHome: this.format === 'extra' ? this.tileAt(corner) === corner : null,
    };
  }

  // ---- moving ----------------------------------------------------------

  /** Slides a tile into the hole if it is next to it. */
  move(tileHome) {
    const cell = this.cellOf(tileHome);
    if (cell === null || !this.neighbours(this.hole).includes(cell)) return false;
    this.occupant.set(this.hole, tileHome);
    this.occupant.set(cell, null);
    this.hole = cell;
    this.moves++;
    return true;
  }

  // ---- starting positions ----------------------------------------------

  /** Solved: every tile home, the hole in its own cell. */
  reset() {
    this.hole = this.holeHome;
    this.occupant = new Map(this.cells.map((cell) => [cell, cell === this.hole ? null : cell]));
    this.moves = 0;
  }

  /** A random solvable arrangement that is not already solved. */
  shuffle(rng = Math.random) {
    do {
      if (this.format === 'extra') this.shuffleExtra(rng);
      else this.shuffleInline(rng);
    } while (this.isSolved());
    this.moves = 0;
  }

  /** Solved, then one move away: the finishing move solves it. */
  nearlySolve() {
    this.reset();
    if (this.format === 'extra') {
      // The only tile that can reach the spare is the bottom-right one.
      this.move(key(this.rows - 1, this.cols - 1));
    } else {
      this.move(this.tileAt(this.neighbours(this.hole)[0]));
    }
    this.moves = 0;
  }

  // ---- internals -------------------------------------------------------

  /** Cell keys orthogonally adjacent to `cell`. */
  neighbours(cell) {
    const [r, c] = this.coords(cell);
    return [
      this.cellAtCoords(r - 1, c),
      this.cellAtCoords(r + 1, c),
      this.cellAtCoords(r, c - 1),
      this.cellAtCoords(r, c + 1),
    ].filter(Boolean);
  }

  /** [row, col] of a cell. The spare sits at (rows-1, cols). */
  coords(cell) {
    if (cell === SPARE) return [this.rows - 1, this.cols];
    return cell.split('-').map(Number);
  }

  /** The cell at a coordinate, or null off the board. */
  cellAtCoords(r, c) {
    if (this.format === 'extra' && r === this.rows - 1 && c === this.cols) return SPARE;
    if (r < 0 || c < 0 || r >= this.rows || c >= this.cols) return null;
    return key(r, c);
  }

  // Corner tile stays home, spare empty; the other tiles are permuted evenly,
  // because the hole returns to where it started (distance 0, so even parity).
  shuffleExtra(rng) {
    const corner = key(this.rows - 1, this.cols - 1);
    const spots = this.cells.filter((cell) => cell !== SPARE && cell !== corner);
    const order = spots.map((_, i) => i);
    fisherYates(order, rng);
    if (parity(order) === 1) [order[0], order[1]] = [order[1], order[0]];

    this.occupant = new Map(this.cells.map((cell) => [cell, null]));
    this.occupant.set(corner, corner);
    spots.forEach((spot, i) => this.occupant.set(spot, spots[order[i]]));
    this.hole = SPARE;
  }

  // The hole is shuffled as one more item; solvable when the permutation's
  // parity matches the parity of the hole's Manhattan distance from home.
  shuffleInline(rng) {
    const order = this.cells.map((_, i) => i);
    fisherYates(order, rng);
    const holeId = this.cells.indexOf(this.holeHome);
    const [hr, hc] = this.coords(this.cells[order.indexOf(holeId)]);
    const [homeR, homeC] = this.coords(this.holeHome);
    const distance = Math.abs(hr - homeR) + Math.abs(hc - homeC);

    if (parity(order) !== distance % 2) {
      const [a, b] = order.map((_, i) => i).filter((i) => order[i] !== holeId);
      [order[a], order[b]] = [order[b], order[a]];
    }

    this.occupant = new Map(
      this.cells.map((cell, i) => [cell, order[i] === holeId ? null : this.cells[order[i]]]),
    );
    this.hole = this.cells[order.indexOf(holeId)];
  }
}

function key(r, c) {
  return `${r}-${c}`;
}

function fisherYates(list, rng) {
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
}

/** 0 for an even permutation of 0..n-1, 1 for an odd one. */
function parity(order) {
  const seen = new Array(order.length).fill(false);
  let swaps = 0;
  for (let start = 0; start < order.length; start++) {
    if (seen[start]) continue;
    let length = 0;
    for (let i = start; !seen[i]; i = order[i]) {
      seen[i] = true;
      length++;
    }
    swaps += length - 1;
  }
  return swaps % 2;
}
