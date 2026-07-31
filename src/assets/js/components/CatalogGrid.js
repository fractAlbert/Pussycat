import { Component } from '../core/Component.js';
import { PuzzleCard } from './PuzzleCard.js';
import { sorterFor } from '../sorters.js';

/**
 * The grid of cards, plus the result count.
 *
 * Cards are created once. State changes reorder and hide them; they are never
 * destroyed and rebuilt, which is what keeps the search box from losing focus
 * mid-keystroke (D-005).
 */
export class CatalogGrid extends Component {
  constructor(el, store, { registry, countEl, emptyEl }) {
    super(el, store);
    this.registry = registry;
    this.countEl = countEl;
    this.emptyEl = emptyEl;
    this.cards = new Map();
  }

  render(state) {
    const fragment = document.createDocumentFragment();
    for (const puzzle of state.puzzles) {
      const card = new PuzzleCard(puzzle);
      this.cards.set(puzzle.id, card);
      fragment.append(card.el);
    }
    this.el.append(fragment);

    this.el.addEventListener('click', (event) => {
      const trigger = event.target.closest('[data-open]');
      if (trigger) this.store.patch({ selected: trigger.dataset.open });
    });

    this.onState(state);
  }

  onState(state) {
    const visible = this.#visible(state);
    const visibleIds = new Set(visible.map((p) => p.id));

    for (const [id, card] of this.cards) {
      card.setVisible(visibleIds.has(id));
    }
    this.#reorder(visible);

    this.countEl.textContent = this.#countLabel(visible.length, state.puzzles.length);
    this.emptyEl.hidden = visible.length > 0;
  }

  #visible(state) {
    const query = state.query.trim().toLowerCase();
    return state.puzzles
      .filter((puzzle) => this.registry.accepts(puzzle, state.selections))
      .filter((puzzle) => !query || puzzle.searchText.includes(query))
      .sort(sorterFor(state.sort).compare);
  }

  /**
   * append() on an element already in the DOM moves it, so this reorders in
   * place without touching anything else.
   */
  #reorder(visible) {
    for (const puzzle of visible) {
      this.el.append(this.cards.get(puzzle.id).el);
    }
  }

  #countLabel(shown, total) {
    if (shown === total) {
      return `${total} ${total === 1 ? 'puzzle' : 'puzzles'}`;
    }
    return `${shown} of ${total} puzzles`;
  }
}
