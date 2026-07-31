import { html, raw } from '../core/html.js';
import { IMAGE_PATH } from '../config.js';

/**
 * One grid tile. Built once and kept in the DOM for the life of the page;
 * filtering toggles visibility rather than rebuilding (D-005).
 */
export class PuzzleCard {
  constructor(puzzle) {
    this.puzzle = puzzle;
    this.el = this.#build();
  }

  #build() {
    const p = this.puzzle;
    const article = document.createElement('article');
    article.className = 'card';
    article.dataset.id = p.id;
    article.innerHTML = html`
      <button class="card__open" data-open="${p.id}" aria-haspopup="dialog">
        ${raw(this.#media())}
        <span class="card__body">
          <span class="card__name">${p.name}</span>
          <span class="card__artist">${p.artistLabel}</span>
          <span class="card__meta">${this.#meta()}</span>
        </span>
      </button>
    `;
    return article;
  }

  /** Size and format, whichever of them is known. */
  #meta() {
    const parts = [this.puzzle.sizeLabel, this.puzzle.blankLabel].filter(Boolean);
    return parts.length ? parts.join(' · ') : 'Format not recorded';
  }

  #media() {
    const image = this.puzzle.frontImage;
    if (!image?.file) {
      return html`
        <span class="card__media card__media--empty" aria-hidden="true">
          <span class="card__placeholder">${this.puzzle.sizeLabel ?? '?'}</span>
        </span>
      `;
    }
    return html`
      <span class="card__media">
        <img src="${IMAGE_PATH + image.file}"
             alt="${this.puzzle.name}"
             loading="lazy">
      </span>
    `;
  }

  setVisible(visible) {
    this.el.hidden = !visible;
  }
}
