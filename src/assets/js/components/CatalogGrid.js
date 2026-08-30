import { Component } from '../core/Component.js';
import { PuzzleCard } from './PuzzleCard.js';
import { sorterFor, MANUAL_SORT } from '../sorters.js';

/**
 * The grid of cards, plus the result count.
 *
 * Cards are created once. State changes reorder and hide them; they are never
 * destroyed and rebuilt, which is what keeps the search box from losing focus
 * mid-keystroke (D-005).
 */
export class CatalogGrid extends Component {
  constructor(el, store, { registry, countEl, emptyEl, session = null }) {
    super(el, store);
    this.registry = registry;
    this.countEl = countEl;
    this.emptyEl = emptyEl;
    this.session = session;
    this.cards = new Map();
    this.revision = null;
    this.dragId = null;
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
      if (!trigger) return;
      const id = trigger.dataset.open;
      // While annotating, a card opens the editor rather than the read-only modal.
      if (this.store.state.annotating) this.store.patch({ editing: id });
      else this.store.patch({ selected: id });
    });

    if (this.session) this.#wireDragging();

    this.onState(state);
  }

  onState(state) {
    if (this.session) this.#syncAnnotations(state);

    const visible = this.#visible(state);
    const visibleIds = new Set(visible.map((p) => p.id));

    for (const [id, card] of this.cards) {
      card.setVisible(visibleIds.has(id));
      if (this.session) card.setDraggable(state.annotating === true);
    }
    this.#reorder(visible);

    this.countEl.textContent = this.#countLabel(visible.length, state.puzzles.length);
    this.emptyEl.hidden = visible.length > 0;
  }

  /**
   * Redraws cards whose pending edits changed since the last patch.
   *
   * Comparison is by content signature rather than by "is this entry
   * annotated", because a card also has to be redrawn when its annotation is
   * taken away — a deletion mark leaves the puzzle object itself untouched, so
   * identity alone cannot see it disappear.
   */
  #syncAnnotations(state) {
    if (state.editsRevision === this.revision) return;
    this.revision = state.editsRevision;
    const doc = this.session.doc;

    for (const puzzle of state.puzzles) {
      const card = this.cards.get(puzzle.id);
      if (!card) continue;
      const signature = annotationSignature(doc, puzzle.id);
      if (card.signature === signature) continue;
      card.signature = signature;
      card.refresh(doc.applyTo(puzzle), doc.deletionFor(puzzle.id));
    }
  }

  #visible(state) {
    const query = state.query.trim().toLowerCase();
    const doc = this.session?.doc;

    const matches = state.puzzles
      .filter((puzzle) => {
        // Filters and search read the edited values, so a card you just
        // retitled does not vanish out from under you.
        const shown = doc ? doc.applyTo(puzzle) : puzzle;
        return (
          this.registry.accepts(shown, state.selections) &&
          (!query || shown.searchText.includes(query))
        );
      });

    if (state.sort === MANUAL_SORT && doc?.order) {
      const rank = new Map(doc.order.map((id, i) => [id, i]));
      return matches.sort(
        (a, b) => (rank.get(a.id) ?? Infinity) - (rank.get(b.id) ?? Infinity),
      );
    }
    return matches.sort(sorterFor(state.sort).compare);
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

  // ---- drag to reorder -------------------------------------------------

  #wireDragging() {
    this.el.addEventListener('dragstart', (event) => {
      const card = event.target.closest('.card');
      if (!card || !this.store.state.annotating) return;
      this.dragId = card.dataset.id;
      card.classList.add('is-dragging');
      event.dataTransfer.effectAllowed = 'move';
      // Firefox ignores a drag that carries no payload.
      event.dataTransfer.setData('text/plain', this.dragId);
    });

    this.el.addEventListener('dragend', () => {
      this.el.querySelector('.is-dragging')?.classList.remove('is-dragging');
      this.el.querySelector('.is-drop-target')?.classList.remove('is-drop-target');
      this.dragId = null;
    });

    this.el.addEventListener('dragover', (event) => {
      if (!this.dragId) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = 'move';
      const over = event.target.closest('.card');
      if (!over || over.dataset.id === this.dragId) return;
      const current = this.el.querySelector('.is-drop-target');
      if (current !== over) {
        current?.classList.remove('is-drop-target');
        over.classList.add('is-drop-target');
      }
    });

    this.el.addEventListener('drop', (event) => {
      if (!this.dragId) return;
      event.preventDefault();
      const over = event.target.closest('.card');
      const dragged = this.dragId;
      this.dragId = null;
      if (!over || over.dataset.id === dragged) return;

      const state = this.store.state;
      const order = this.#displayOrder(state);
      const from = order.indexOf(dragged);
      const to = order.indexOf(over.dataset.id);

      // Dropping onto a card ahead of you lands after it, behind you lands
      // before it. Without the distinction, dragging one card onto the next
      // puts it back exactly where it started and nothing appears to happen.
      const beforeId = from < to ? (order[to + 1] ?? null) : over.dataset.id;

      this.session.update((doc) => doc.moveBefore(order, dragged, beforeId));
      // A manual order is only visible under the matching sort, so switch to it.
      if (state.sort !== MANUAL_SORT) {
        this.store.patch({ sort: MANUAL_SORT });
      }
    });
  }

  /**
   * Every id in the order the grid is currently showing them — including
   * entries hidden by a filter, which keep their sorted positions so a
   * rearrangement made through a filter still describes the whole catalog.
   */
  #displayOrder(state) {
    const existing = this.session.doc.order;
    if (state.sort === MANUAL_SORT && existing) {
      const known = new Set(existing);
      return [...existing, ...state.puzzles.map((p) => p.id).filter((id) => !known.has(id))];
    }
    return [...state.puzzles].sort(sorterFor(state.sort).compare).map((p) => p.id);
  }

  #countLabel(shown, total) {
    if (shown === total) {
      return `${total} ${total === 1 ? 'puzzle' : 'puzzles'}`;
    }
    return `${shown} of ${total} puzzles`;
  }
}

/**
 * Everything about an entry's annotation that affects how its card looks.
 * Image payloads are excluded — the filenames are enough to tell them apart,
 * and the base64 is far too big to compare on every keystroke.
 */
function annotationSignature(doc, id) {
  const images = doc.imagesFor(id).map((i) => i.targetFile).join(',');
  return JSON.stringify([doc.fieldsFor(id), images, doc.deletionFor(id)]);
}
