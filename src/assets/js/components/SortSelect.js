import { Component } from '../core/Component.js';
import { html } from '../core/html.js';
import { SORTERS } from '../sorters.js';

export class SortSelect extends Component {
  render(state) {
    this.el.innerHTML = SORTERS
      .map((s) => html`<option value="${s.key}">${s.label}</option>`)
      .join('');
    this.el.value = state.sort;

    this.el.addEventListener('change', () => {
      this.store.patch({ sort: this.el.value });
    });
  }

  onState(state) {
    if (this.el.value !== state.sort) this.el.value = state.sort;
  }
}
