import { Component } from '../core/Component.js';
import { html, raw } from '../core/html.js';

/**
 * Renders one group of toggle buttons per registered filter. The groups and
 * their options are derived from the data, so a new filter class or a new
 * value in puzzles.json appears here with no change to this file (D-006).
 */
export class FilterPanel extends Component {
  constructor(el, store, { registry, clearEl }) {
    super(el, store);
    this.registry = registry;
    this.clearEl = clearEl;
  }

  render(state) {
    const groups = this.registry.withOptions(state.puzzles);

    this.el.innerHTML = groups
      .map(({ filter, options }) => this.#group(filter, options))
      .join('');

    this.el.addEventListener('click', (event) => {
      const button = event.target.closest('[data-filter]');
      if (button) this.#toggle(button.dataset.filter, button.dataset.value);
    });

    this.clearEl.addEventListener('click', () => {
      this.store.patch({ selections: this.registry.emptySelections(), query: '' });
    });

    this.onState(state);
  }

  #group(filter, options) {
    const chips = options.map((value) => html`
      <button type="button"
              class="chip"
              data-filter="${filter.key}"
              data-value="${value}"
              aria-pressed="false">${filter.displayLabel(value)}</button>
    `).join('');

    return html`
      <fieldset class="filter">
        <legend class="filter__legend">${filter.label}</legend>
        <div class="filter__options">${raw(chips)}</div>
      </fieldset>
    `;
  }

  #toggle(key, value) {
    const next = new Set(this.store.state.selections[key]);
    if (next.has(value)) next.delete(value);
    else next.add(value);

    this.store.patch({
      selections: { ...this.store.state.selections, [key]: next },
    });
  }

  onState(state) {
    let active = 0;
    for (const button of this.el.querySelectorAll('[data-filter]')) {
      const selected = state.selections[button.dataset.filter];
      const on = selected.has(button.dataset.value);
      button.setAttribute('aria-pressed', String(on));
      if (on) active += 1;
    }
    this.clearEl.hidden = active === 0 && state.query.trim() === '';
  }
}
