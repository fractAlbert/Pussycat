import { html, raw } from '../core/html.js';
import { IMAGE_PATH } from '../config.js';
import { Puzzle } from '../models/Puzzle.js';

/**
 * One grid tile. Built once and kept in the DOM for the life of the page;
 * filtering toggles visibility rather than rebuilding (D-005).
 *
 * The exception is annotate mode: an edited card is redrawn on the spot so the
 * page shows the pending change. That is one card, on an explicit action, and
 * nothing being typed into lives inside it.
 */
export class PuzzleCard {
  constructor(puzzle) {
    this.puzzle = puzzle;
    this.shown = puzzle;
    this.el = document.createElement('article');
    this.el.className = 'card';
    this.el.dataset.id = puzzle.id;
    this.el.innerHTML = this.#markup(puzzle, null);
  }

  /**
   * Redraw with edits applied. `annotation` is the pending deletion for this
   * entry, or null.
   */
  refresh(effective, annotation) {
    this.shown = effective;
    this.el.innerHTML = this.#markup(effective, annotation);
    this.el.classList.toggle('card--deleted', Boolean(annotation));
  }

  #markup(puzzle, annotation) {
    return html`
      <button class="card__open" data-open="${puzzle.id}" aria-haspopup="dialog">
        ${raw(this.#media(puzzle))}
        <span class="card__body">
          <span class="card__name">${puzzle.name}</span>
          <span class="card__artist">${puzzle.artistLabel}</span>
          <span class="card__meta">${this.#meta(puzzle)}</span>
        </span>
      </button>
      ${raw(annotation ? this.#deleteBadge(annotation) : '')}
    `;
  }

  #deleteBadge(annotation) {
    const label =
      annotation.reason === 'duplicate'
        ? 'Duplicate'
        : annotation.reason === 'not-applicable'
          ? 'Not applicable'
          : 'To delete';
    return html`<span class="card__badge" title="${annotation.note}">${label}</span>`;
  }

  /** Size and format, whichever of them is known. */
  #meta(puzzle) {
    const parts = [puzzle.sizeLabel, puzzle.blankLabel].filter(Boolean);
    return parts.length ? parts.join(' · ') : 'Format not recorded';
  }

  #media(puzzle) {
    const image = puzzle.primaryImage;
    if (!image) {
      return html`
        <span class="card__media card__media--empty" aria-hidden="true">
          <span class="card__placeholder">${puzzle.sizeLabel ?? '?'}</span>
        </span>
      `;
    }
    return html`
      <span class="card__media">
        <img src="${Puzzle.srcFor(image, IMAGE_PATH)}"
             alt="${puzzle.name}"
             loading="lazy">
      </span>
    `;
  }

  setVisible(visible) {
    this.el.hidden = !visible;
  }

  setDraggable(on) {
    this.el.draggable = on;
    this.el.classList.toggle('card--draggable', on);
  }
}
