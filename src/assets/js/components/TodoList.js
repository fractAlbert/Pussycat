import { Component } from '../core/Component.js';
import { html, raw } from '../core/html.js';
import { sortOut } from '../todo/needs.js';

/**
 * What the catalog still needs, as sections of puzzles. Each name opens the
 * puzzle's detail, the same as on the checklist. Built once: the page has no
 * state of its own to react to.
 */
export class TodoList extends Component {
  constructor(el, store, { summaryEl }) {
    super(el, store);
    this.summaryEl = summaryEl;
  }

  render(state) {
    const lists = sortOut(state.puzzles);

    this.summaryEl.textContent =
      `${lists.playable.length} of ${state.puzzles.length} puzzles can be played now.`;

    const sections = [
      {
        key: 'count',
        title: 'Needs a tile count',
        open: true,
        rows: lists.needsCount,
        help: 'These already have their art, so a grid and layout is all that stops them being playable. Count the tiles on the puzzle, or from a photo, then record the grid and format in annotate mode.',
      },
      {
        key: 'art',
        title: 'Needs art, then a count',
        open: true,
        rows: lists.needsArt,
        help: 'By an artist whose work can be public domain. Each needs a public-domain image of the painting cropped to what the puzzle shows (docs/data-model.md has the rules), and then a grid.',
      },
      {
        key: 'held',
        title: 'Held back by the date of the work',
        open: false,
        rows: lists.heldBack,
        help: 'The artist qualifies, but the work is too recent to reuse. These stay unplayable.',
      },
      {
        key: 'photo',
        title: 'Needs a photograph',
        open: false,
        rows: lists.needsPhoto,
        help: 'No photo yet. Save one from the listing (docs/image-wishlist.md has the file names), or take your own if you hold the puzzle.',
      },
      {
        key: 'grid',
        title: 'Needs a grid or layout',
        open: false,
        rows: lists.needsGrid,
        help: 'Every puzzle without both a grid and a layout. Most are quick to fix in annotate mode from the catalog page.',
      },
    ];

    this.el.innerHTML = sections.map((s) => this.#section(s)).join('');

    this.el.addEventListener('click', (event) => {
      const trigger = event.target.closest('[data-open]');
      if (trigger) this.store.patch({ selected: trigger.dataset.open });
    });
  }

  #section({ key, title, open, rows, help }) {
    return html`
      <details class="todo__section" data-section="${key}" ${raw(open ? 'open' : '')}>
        <summary class="todo__summary">
          <h2 class="todo__heading">${title}</h2>
          <span class="todo__count">${rows.length}</span>
        </summary>
        <p class="todo__help">${help}</p>
        ${raw(rows.length
          ? html`<ul class="todo__list">${raw(rows.map((r) => this.#row(r)).join(''))}</ul>`
          : html`<p class="todo__none">Nothing here.</p>`)}
      </details>
    `;
  }

  #row({ puzzle, notes, link }) {
    return html`
      <li class="todo__item">
        <button type="button" class="todo__open" data-open="${puzzle.id}" aria-haspopup="dialog">
          <span class="todo__name">${puzzle.name}</span>
          <span class="todo__artist">${puzzle.artistLabel}${puzzle.artNumber ? ` · art. ${puzzle.artNumber}` : ''}</span>
        </button>
        <span class="todo__notes">${notes.join(' ')}${raw(link
          ? html` <a href="${link}" target="_blank" rel="noopener noreferrer">Listing</a>`
          : '')}</span>
      </li>
    `;
  }
}
