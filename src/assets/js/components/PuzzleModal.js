import { Component } from '../core/Component.js';
import { html, raw } from '../core/html.js';
import { IMAGE_PATH } from '../config.js';

/**
 * Detail view. Uses a native <dialog>, which brings focus trapping, Esc to
 * close, and the backdrop with it.
 *
 * The open puzzle is mirrored into the URL fragment so a detail view can be
 * linked and shared — the modal has no address of its own otherwise (D-003).
 */
export class PuzzleModal extends Component {
  /**
   * The initial hash has to be read *after* Component.mount() subscribes —
   * #syncFromHash patches the store, and a patch during render() would notify
   * nobody, so a shared link would open to an empty page.
   */
  mount() {
    super.mount();
    this.#syncFromHash();
    return this;
  }

  render() {
    this.el.addEventListener('click', (event) => {
      const thumb = event.target.closest('[data-thumb]');
      if (thumb) { this.#showView(thumb); return; }

      if (event.target.closest('[data-close]')) this.#close();
      // A click landing on the dialog itself is the backdrop; the content
      // sits inside a child element.
      if (event.target === this.el) this.#close();
    });

    // Escape fires "cancel", not "close" — listening only for the latter
    // leaves the dialog shut but the state and URL still pointing at a puzzle.
    this.el.addEventListener('cancel', () => this.#close());
    this.el.addEventListener('close', () => this.#close());

    window.addEventListener('hashchange', () => this.#syncFromHash());
  }

  onState(state) {
    const puzzle = state.puzzles.find((p) => p.id === state.selected) ?? null;

    if (!puzzle) {
      this.shownId = null;
      if (this.el.open) this.el.close();
      if (location.hash) history.replaceState(null, '', location.pathname);
      return;
    }

    // Rebuild only when the puzzle changes. Otherwise an unrelated state
    // change — a keystroke in the search box — would wipe out focus in here.
    if (this.shownId !== puzzle.id) {
      this.el.innerHTML = this.#content(puzzle);
      this.shownId = puzzle.id;
    }
    if (!this.el.open) this.el.showModal();
    if (location.hash.slice(1) !== puzzle.id) {
      history.replaceState(null, '', `#${puzzle.id}`);
    }
  }

  #syncFromHash() {
    const id = decodeURIComponent(location.hash.slice(1));
    const known = this.store.state.puzzles.some((p) => p.id === id);
    this.store.patch({ selected: known ? id : null });
  }

  #showView(thumb) {
    const main = this.el.querySelector('#gallery-main');
    if (!main) return;
    main.src = thumb.dataset.thumb;
    main.alt = thumb.dataset.alt;
    for (const button of this.el.querySelectorAll('[data-thumb]')) {
      button.setAttribute('aria-selected', String(button === thumb));
    }
  }

  #close() {
    if (this.store.state.selected !== null) this.store.patch({ selected: null });
  }

  #content(puzzle) {
    const facts = [
      ['Artist', puzzle.artistLabel],
      ['Series', puzzle.series],
      ['Art no.', puzzle.artNumber],
      ['Copyright', puzzle.copyright],
      ['Size', puzzle.sizeLabel],
      ['Format', puzzle.blankLabel],
      ['Tiles', puzzle.tileCount],
    ].filter(([, value]) => value !== null && value !== undefined);

    return html`
      <div class="modal">
        <button type="button" class="modal__close" data-close aria-label="Close">×</button>
        <h2 class="modal__title">${puzzle.name}</h2>
        ${raw(puzzle.verified ? '' : html`
          <p class="modal__unverified">
            Compiled from a sale listing and not yet checked against the puzzle itself.
          </p>
        `)}
        ${raw(this.#gallery(puzzle))}
        <dl class="facts">
          ${raw(facts.map(([term, value]) => html`
            <dt>${term}</dt><dd>${value}</dd>
          `).join(''))}
        </dl>
        ${raw(puzzle.description ? html`<p class="modal__description">${puzzle.description}</p>` : '')}
        ${raw(this.#sources(puzzle))}
      </div>
    `;
  }

  /**
   * One large view plus a thumbnail strip. Clicking a thumbnail swaps the
   * large image in place — this is view state that dies with the modal, so it
   * is handled in the DOM rather than pushed through the store.
   */
  #gallery(puzzle) {
    if (!puzzle.hasImages) return '';
    const first = puzzle.images[0];

    const strip = puzzle.images.length < 2 ? '' : html`
      <div class="gallery__thumbs" role="tablist" aria-label="Other views">
        ${raw(puzzle.images.map((image, i) => html`
          <button type="button"
                  class="gallery__thumb"
                  role="tab"
                  data-thumb="${IMAGE_PATH + image.file}"
                  data-alt="${puzzle.name}, ${puzzle.labelFor(image, i)}"
                  aria-selected="${i === 0}"
                  title="${puzzle.labelFor(image, i)}">
            <img src="${IMAGE_PATH + image.file}" alt="${puzzle.labelFor(image, i)}">
          </button>
        `).join(''))}
      </div>
    `;

    return html`
      <div class="gallery">
        <img class="gallery__main"
             id="gallery-main"
             src="${IMAGE_PATH + first.file}"
             alt="${puzzle.name}, ${puzzle.labelFor(first, 0)}">
        ${raw(strip)}
      </div>
    `;
  }

  /**
   * Attribution only. Images are served from this repo, never hotlinked — a
   * listing URL stops resolving the moment the item sells.
   */
  #sources(puzzle) {
    const imageSources = [...new Set(
      puzzle.images.map((image) => image.sourceUrl).filter(Boolean),
    )];
    const links = [
      puzzle.source && ['Record', puzzle.source],
      ...imageSources
        .filter((url) => url !== puzzle.source)
        .map((url, i) => [imageSources.length > 1 ? `Photos ${i + 1}` : 'Photos', url]),
    ].filter(Boolean);
    if (links.length === 0) return '';

    return html`
      <p class="modal__sources">
        Source:
        ${raw(links.map(([label, url]) => html`
          <a href="${url}" target="_blank" rel="noopener noreferrer">${label}</a>
        `).join(' · '))}
        · <a href="images.html">about the images</a>
      </p>
    `;
  }
}
