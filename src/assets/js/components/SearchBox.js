import { Component } from '../core/Component.js';

export class SearchBox extends Component {
  render() {
    this.el.addEventListener('input', () => {
      this.store.patch({ query: this.el.value });
    });
  }

  /**
   * Only writes back when the value actually differs, so typing is never
   * interrupted by the component overwriting what is being typed.
   */
  onState(state) {
    if (this.el.value !== state.query) this.el.value = state.query;
  }
}
