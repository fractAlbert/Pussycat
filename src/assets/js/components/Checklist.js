import { Component } from '../core/Component.js';
import { html, raw } from '../core/html.js';

/**
 * Every known puzzle, grouped by artist, with a box to tick.
 *
 * The boxes are the reader's own: they start empty and are ticked by hand,
 * rather than being pre-filled from `owned` in the catalog. What the catalog
 * already records is shown as a tag beside the row instead, so the two never
 * get confused for each other.
 *
 * Ticking updates the tallies in place rather than re-rendering, which keeps
 * your place on a page that is ninety rows long.
 */
export class Checklist extends Component {
  constructor(el, store, { countEl, ticks }) {
    super(el, store);
    this.countEl = countEl;
    this.ticks = ticks;
  }

  render(state) {
    this.groups = this.#group(state.puzzles);

    this.el.innerHTML = this.groups.map(([heading, puzzles], index) => html`
      <section class="checklist__group">
        <h2 class="checklist__heading">
          ${heading}
          <span class="checklist__tally" data-tally="${index}">${this.#tally(puzzles)}</span>
        </h2>
        <ul class="checklist__list">
          ${raw(puzzles.map((p) => this.#row(p)).join(''))}
        </ul>
      </section>
    `).join('');

    this.el.addEventListener('change', (event) => {
      const box = event.target.closest('[data-tick]');
      if (box) this.#onTick(box);
    });

    this.refreshCounts();
  }

  /** Called after a bulk change — loading a file, or clearing. */
  refreshAll() {
    for (const box of this.el.querySelectorAll('[data-tick]')) {
      const on = this.ticks.has(box.dataset.tick);
      box.checked = on;
      box.closest('.checklist__item').classList.toggle('is-ticked', on);
    }
    this.refreshCounts();
  }

  refreshCounts() {
    for (const [index, [, puzzles]] of this.groups.entries()) {
      const el = this.el.querySelector(`[data-tally="${index}"]`);
      if (el) el.textContent = this.#tally(puzzles);
    }
    const total = this.store.state.puzzles.length;
    const held = this.ticks.countIn(this.store.state.puzzles);
    this.countEl.textContent = `${held} of ${total} ticked`;
  }

  #onTick(box) {
    const on = this.ticks.toggle(box.dataset.tick);
    box.checked = on;
    box.closest('.checklist__item').classList.toggle('is-ticked', on);
    this.refreshCounts();
  }

  /** Artists first, alphabetically; everything unattributed last. */
  #group(puzzles) {
    const map = new Map();
    for (const p of puzzles) {
      const key = p.artist ?? 'Without an artist';
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(p);
    }
    return [...map.entries()]
      .sort(([a], [b]) => {
        if (a === 'Without an artist') return 1;
        if (b === 'Without an artist') return -1;
        return a.localeCompare(b);
      })
      .map(([k, list]) => [k, list.sort((x, y) => x.name.localeCompare(y.name))]);
  }

  #tally(puzzles) {
    return `${this.ticks.countIn(puzzles)}/${puzzles.length}`;
  }

  #row(puzzle) {
    const notes = [
      puzzle.artNumber && `art. ${puzzle.artNumber}`,
      puzzle.sizeLabel,
      puzzle.copyright && `© ${puzzle.copyright}`,
      !puzzle.verified && 'unverified',
    ].filter(Boolean);

    const on = this.ticks.has(puzzle.id);

    return html`
      <li>
        <label class="checklist__item ${raw(on ? 'is-ticked' : '')}">
          <input type="checkbox" class="checklist__input" data-tick="${puzzle.id}"
                 ${raw(on ? 'checked' : '')}>
          <span class="checklist__box" aria-hidden="true"></span>
          <span class="checklist__name">${puzzle.name}${raw(
            puzzle.owned ? html`<span class="checklist__recorded">recorded</span>` : '',
          )}</span>
          <span class="checklist__notes">${notes.join(' · ')}</span>
        </label>
      </li>
    `;
  }
}
