import { html, raw } from '../core/html.js';
import { Board, SPARE } from '../play/Board.js';
import { ART_PATH } from '../config.js';

const MAX_TILE = 48;
const GAP = 2;
// Keep in step with .play__board's gap and padding in style.css.
const PADDING = 4;

/**
 * The sliding-puzzle game inside the detail modal. A plain class rather than a
 * store Component: a game is throwaway view state, like the gallery's selected
 * thumbnail, and must not leak into the catalog store or the URL.
 *
 * Tiles are rendered once and moved by rewriting their grid position, so a
 * focused tile keeps focus across moves.
 */
export class PlayView {
  constructor(container, puzzle) {
    this.container = container;
    this.puzzle = puzzle;
    this.board = new Board({
      rows: puzzle.grid.rows,
      cols: puzzle.grid.cols,
      format: puzzle.blank,
      corner: puzzle.blankCorner,
    });
    this.board.shuffle();
    this.locked = false;
    this.timer = null;
    this.startedAt = 0;
    this.elapsed = 0;

    this.#render();
    this.#positionAll();

    this.boardEl.addEventListener('click', (event) => {
      const tile = event.target.closest('.play__tile');
      if (tile) this.#move(tile.dataset.home);
    });
    this.boardEl.addEventListener('keydown', (event) => {
      const direction = {
        ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
      }[event.key];
      if (!direction) return;
      // Stop the arrow keys scrolling the dialog behind the board.
      event.preventDefault();
      if (this.locked) return;
      const home = this.board.tileInto(direction);
      if (home) this.#move(home);
    });

    // Test hook: lets the browser driver inspect a shuffled board and skip to
    // the last move. Not used by the page itself.
    window.pussycatPlay = {
      state: () => this.board.state(),
      nearlySolve: () => {
        this.board.nearlySolve();
        clearInterval(this.timer);
        this.timer = null;
        this.elapsed = 0;
        this.locked = false;
        this.statusEl.textContent = '';
        this.statusEl.classList.remove('play__solved');
        this.#positionAll();
        this.#updateCounters();
      },
    };
  }

  focus() {
    this.boardEl.focus();
  }

  destroy() {
    clearInterval(this.timer);
    this.timer = null;
    delete window.pussycatPlay;
  }

  #render() {
    const { rows, cols } = this.board;
    const extra = this.board.format === 'extra';
    const gridCols = cols + (extra ? 1 : 0);
    const available = this.container.clientWidth || 320;
    const room = available - 2 * PADDING - GAP * (gridCols - 1);
    this.tile = Math.max(8, Math.min(MAX_TILE, Math.floor(room / gridCols)));
    const t = this.tile;
    const art = `url("${ART_PATH + this.puzzle.art.file}")`;

    const tiles = this.board.cells
      .filter((cell) => cell !== this.board.holeHome)
      .map((cell) => {
        const [r, c] = this.board.coords(cell);
        return html`
          <button type="button" class="play__tile" data-home="${cell}" data-cell="${cell}"
                  aria-label="Tile row ${r + 1}, column ${c + 1}"
                  style="background-image:${art};background-size:${cols * t}px ${rows * t}px;background-position:-${c * t}px -${r * t}px"></button>
        `;
      }).join('');

    let frame = '';
    if (extra) {
      for (let r = 0; r < rows - 1; r++) {
        frame += `<div class="play__frame" style="grid-row:${r + 1};grid-column:${gridCols}"></div>`;
      }
      frame += `<div class="play__spare" style="grid-row:${rows};grid-column:${gridCols}"></div>`;
    }

    this.container.innerHTML = html`
      <div class="play">
        <div class="play__header">
          <h2 class="play__name">${this.puzzle.name}</h2>
          <button type="button" class="play__back">Back</button>
          <span class="play__moves">Moves: 0</span>
          <span class="play__time">Time: 0s</span>
        </div>
        <div class="play__board" tabindex="0" role="group"
             aria-label="Sliding puzzle. Use the arrow keys or click a tile next to the gap to slide it."
             style="grid-template-columns:repeat(${gridCols},${t}px);grid-template-rows:repeat(${rows},${t}px)">
          ${raw(tiles + frame)}
        </div>
        <p class="play__status" role="status"></p>
      </div>
    `;
    this.root = this.container.querySelector('.play');
    this.boardEl = this.root.querySelector('.play__board');
    this.spareEl = this.root.querySelector('.play__spare');
    this.movesEl = this.root.querySelector('.play__moves');
    this.timeEl = this.root.querySelector('.play__time');
    this.statusEl = this.root.querySelector('.play__status');
    this.tiles = new Map(
      [...this.root.querySelectorAll('.play__tile')].map((el) => [el.dataset.home, el]),
    );
  }

  /** Writes every tile's position and the movable flags from the board. */
  #positionAll() {
    for (const [home, el] of this.tiles) this.#place(el, this.board.cellOf(home));
    this.#flagMovable();
  }

  #place(el, cell) {
    el.dataset.cell = cell;
    if (cell === SPARE) {
      el.style.gridRow = '';
      el.style.gridColumn = '';
      if (el.parentElement !== this.spareEl) this.spareEl.append(el);
      return;
    }
    const [r, c] = this.board.coords(cell);
    el.style.gridRow = String(r + 1);
    el.style.gridColumn = String(c + 1);
    if (el.parentElement !== this.boardEl) this.boardEl.append(el);
  }

  #flagMovable() {
    const movable = this.locked ? [] : this.board.movableTiles();
    for (const [home, el] of this.tiles) {
      el.toggleAttribute('data-movable', movable.includes(home));
    }
  }

  #move(home) {
    if (this.locked || !this.board.move(home)) return;
    const el = this.tiles.get(home);
    const hadFocus = document.activeElement === el;
    this.#place(el, this.board.cellOf(home));
    // Re-parenting drops focus; give it back so the keyboard can carry on.
    if (hadFocus) el.focus();

    if (!this.timer && !this.board.isSolved()) this.#startTimer();
    if (this.board.isSolved()) this.#solve();
    this.#flagMovable();
    this.#updateCounters();
  }

  #startTimer() {
    this.startedAt = Date.now();
    this.timer = setInterval(() => {
      this.elapsed = Math.floor((Date.now() - this.startedAt) / 1000);
      this.#updateCounters();
    }, 1000);
  }

  #solve() {
    this.locked = true;
    if (this.timer) {
      this.elapsed = Math.floor((Date.now() - this.startedAt) / 1000);
      clearInterval(this.timer);
      this.timer = null;
    }
    const moves = this.board.moves;
    // The live region already exists, so screen readers announce the change.
    this.statusEl.classList.add('play__solved');
    this.statusEl.textContent = `Solved in ${moves} ${moves === 1 ? 'move' : 'moves'}, ${this.elapsed}s`;
  }

  #updateCounters() {
    this.movesEl.textContent = `Moves: ${this.board.moves}`;
    this.timeEl.textContent = `Time: ${this.elapsed}s`;
  }
}
