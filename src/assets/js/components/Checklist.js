import { Component } from '../core/Component.js';
import { html, raw } from '../core/html.js';

/**
 * Print-oriented checklist: every known puzzle, grouped by artist, with a box
 * to tick. Owned entries are pre-ticked from the data.
 *
 * Deliberately not interactive — there is no database to save a tick to, so
 * ownership lives in puzzles.json and this page is something to print and
 * carry to a fair.
 */
export class Checklist extends Component {
  constructor(el, store, { countEl }) {
    super(el, store);
    this.countEl = countEl;
  }

  render(state) {
    const groups = this.#group(state.puzzles);

    this.el.innerHTML = groups.map(([heading, puzzles]) => html`
      <section class="checklist__group">
        <h2 class="checklist__heading">${heading} <span class="checklist__tally">${this.#tally(puzzles)}</span></h2>
        <ul class="checklist__list">
          ${raw(puzzles.map((p) => this.#row(p)).join(''))}
        </ul>
      </section>
    `).join('');

    const owned = state.puzzles.filter((p) => p.owned).length;
    this.countEl.textContent =
      `${owned} of ${state.puzzles.length} recorded puzzles held`;
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
    const owned = puzzles.filter((p) => p.owned).length;
    return `${owned}/${puzzles.length}`;
  }

  #row(puzzle) {
    const notes = [
      puzzle.artNumber && `art. ${puzzle.artNumber}`,
      puzzle.sizeLabel,
      puzzle.copyright && `© ${puzzle.copyright}`,
      !puzzle.verified && 'unverified',
    ].filter(Boolean);

    return html`
      <li class="checklist__item ${puzzle.owned ? 'is-owned' : ''}">
        <span class="checklist__box" aria-hidden="true">${puzzle.owned ? '×' : ''}</span>
        <span class="checklist__name">${puzzle.name}</span>
        <span class="checklist__notes">${notes.join(' · ')}</span>
      </li>
    `;
  }
}
