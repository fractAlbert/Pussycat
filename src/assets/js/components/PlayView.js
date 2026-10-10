import { html, raw } from '../core/html.js';
import { Board, SPARE } from '../play/Board.js';
import { ART_PATH } from '../config.js';

const MAX_TILE = 48;
const GAP = 2;
// Keep in step with .play__board's gap and padding in style.css.
const PADDING = 30;
// How far the sunken tray reaches past the tiles, so its edges show round them.
const WELL = 3;
// Shuffle throws the game away, so it needs a deliberate hold, not a click.
const HOLD_MS = 1000;
let wellCount = 0;

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

    this.#holdToShuffle(this.root.querySelector('.play__shuffle'));
    this.flipEl.addEventListener('click', () => this.#flip(!this.flipped));
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
      if (this.locked || this.flipped) return;
      const home = this.board.tileInto(direction);
      if (home) this.#move(home);
    });

    // Test hook: lets the browser driver inspect a shuffled board and skip to
    // the last move. Not used by the page itself.
    window.pussycatPlay = {
      state: () => this.board.state(),
      nearlySolve: () => {
        this.board.nearlySolve();
        this.#restart();
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

    const well = this.#well(t);
    const picture = `left:${PADDING}px;top:${PADDING}px;width:${cols * t + GAP * (cols - 1)}px;`
      + `height:${rows * t + GAP * (rows - 1)}px;background-image:${art}`;

    this.container.innerHTML = html`
      <div class="play">
        <div class="play__header">
          <h2 class="play__name">${this.puzzle.name}</h2>
          <button type="button" class="play__back">Back</button>
          <button type="button" class="play__shuffle" style="--hold:${HOLD_MS}ms">Hold to shuffle</button>
          <button type="button" class="play__flip" aria-pressed="false">Flip</button>
          <span class="play__moves">Moves: 0</span>
          <span class="play__time">Time: 0s</span>
        </div>
        <div class="play__card">
          <div class="play__board" tabindex="0" role="group"
               aria-label="Sliding puzzle. Use the arrow keys or click a tile next to the gap to slide it."
               style="grid-template-columns:repeat(${gridCols},${t}px);grid-template-rows:repeat(${rows},${t}px)">
            ${raw(well + tiles + frame)}
          </div>
          <div class="play__edge play__edge--left"></div>
          <div class="play__edge play__edge--right"></div>
          <div class="play__board play__back-face" role="img" aria-label="The finished picture" inert
               style="grid-template-columns:repeat(${gridCols},${t}px);grid-template-rows:repeat(${rows},${t}px)">
            ${raw(well)}
            <div class="play__picture" style="${picture}"></div>
          </div>
        </div>
        <p class="play__status" role="status"></p>
      </div>
    `;
    this.root = this.container.querySelector('.play');
    this.boardEl = this.root.querySelector('.play__board');
    this.cardEl = this.root.querySelector('.play__card');
    this.backFaceEl = this.root.querySelector('.play__back-face');
    this.flipEl = this.root.querySelector('.play__flip');
    this.flipped = false;
    this.spareEl = this.root.querySelector('.play__spare');
    this.movesEl = this.root.querySelector('.play__moves');
    this.timeEl = this.root.querySelector('.play__time');
    this.statusEl = this.root.querySelector('.play__status');
    this.tiles = new Map(
      [...this.root.querySelectorAll('.play__tile')].map((el) => [el.dataset.home, el]),
    );
  }

  /**
   * The sunken tray the tiles sit in, drawn as one outline so its edges run
   * unbroken round the picture and, on extra boards, step out round the spare.
   * Top and left edges fall in shadow; bottom and right edges catch the light.
   */
  #well(t) {
    const { rows, cols } = this.board;
    const m = WELL;
    const w = cols * t + GAP * (cols - 1);
    const h = rows * t + GAP * (rows - 1);
    const extra = this.board.format === 'extra';
    const full = extra ? w + GAP + t : w;
    const step = h - t - m; // the top of the spare's slot
    const outline = extra
      ? [[-m, -m], [w + m, -m], [w + m, step], [full + m, step], [full + m, h + m], [-m, h + m]]
      : [[-m, -m], [w + m, -m], [w + m, h + m], [-m, h + m]];
    const shade = extra
      ? `M${-m} ${h + m}L${-m} ${-m}L${w + m} ${-m}M${w + m} ${step}L${full + m} ${step}`
      : `M${-m} ${h + m}L${-m} ${-m}L${w + m} ${-m}`;
    const light = extra
      ? `M${w + m} ${-m}L${w + m} ${step}M${full + m} ${step}L${full + m} ${h + m}L${-m} ${h + m}`
      : `M${w + m} ${-m}L${w + m} ${h + m}L${-m} ${h + m}`;
    const id = `play-well-${++wellCount}`;
    const points = outline.map((p) => p.join(',')).join(' ');
    return `<svg class="play__well" aria-hidden="true" focusable="false"
        style="left:${PADDING - m}px;top:${PADDING - m}px"
        width="${full + 2 * m}" height="${h + 2 * m}" viewBox="${-m} ${-m} ${full + 2 * m} ${h + 2 * m}">
      <defs>
        <clipPath id="${id}-clip"><polygon points="${points}"/></clipPath>
        <filter id="${id}-blur" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="2"/></filter>
      </defs>
      <polygon points="${points}" fill="#030303"/>
      <g clip-path="url(#${id}-clip)" fill="none" stroke-linejoin="round">
        <path d="${shade}" stroke="rgba(0,0,0,0.95)" stroke-width="8" filter="url(#${id}-blur)"/>
        <path d="${light}" stroke="rgba(255,255,255,0.22)" stroke-width="2"/>
      </g>
    </svg>`;
  }

  /** Back to a fresh game on the current arrangement: no moves, no time. */
  #restart() {
    clearInterval(this.timer);
    this.timer = null;
    this.elapsed = 0;
    this.locked = false;
    this.statusEl.textContent = '';
    this.statusEl.classList.remove('play__solved');
    this.#flip(false);
    this.#positionAll();
    this.#updateCounters();
  }

  /**
   * Shuffles only once the button has been held for HOLD_MS, by pointer or by
   * Space/Enter. The button fills up meanwhile; letting go early cancels.
   */
  #holdToShuffle(button) {
    let timer = null;
    const start = () => {
      if (timer) return;
      button.toggleAttribute('data-holding', true);
      timer = setTimeout(() => {
        cancel();
        this.board.shuffle();
        this.#restart();
      }, HOLD_MS);
    };
    const cancel = () => {
      clearTimeout(timer);
      timer = null;
      button.removeAttribute('data-holding');
    };
    button.addEventListener('pointerdown', (event) => {
      if (event.button === 0) start();
    });
    for (const type of ['pointerup', 'pointerleave', 'pointercancel', 'blur']) {
      button.addEventListener(type, cancel);
    }
    // A long press on a touch screen would otherwise open the context menu.
    button.addEventListener('contextmenu', (event) => event.preventDefault());
    button.addEventListener('keydown', (event) => {
      if (event.key !== ' ' && event.key !== 'Enter') return;
      event.preventDefault();
      if (!event.repeat) start();
    });
    button.addEventListener('keyup', (event) => {
      if (event.key === ' ' || event.key === 'Enter') cancel();
    });
  }

  /** Turns the board over to show the finished picture, or back again. */
  #flip(flipped) {
    this.flipped = flipped;
    this.cardEl.toggleAttribute('data-flipped', flipped);
    this.flipEl.setAttribute('aria-pressed', String(flipped));
    this.boardEl.inert = flipped;
    this.backFaceEl.inert = !flipped;
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
    if (this.locked || this.flipped || !this.board.move(home)) return;
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
