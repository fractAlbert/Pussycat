import { Store } from './Store.js';

/**
 * Base class for anything that owns a piece of the page.
 *
 * Lifecycle is deliberately small: build the DOM once in render(), then react
 * to state changes in onState(). Subclasses should not rebuild their subtree
 * on every change — see D-005 in docs/decisions.md for why.
 */
export class Component {
  #unsubscribe = null;

  constructor(el, store) {
    if (!(el instanceof HTMLElement)) {
      throw new Error(`${this.constructor.name}: root element not found`);
    }
    if (!(store instanceof Store)) {
      throw new Error(`${this.constructor.name}: a Store is required`);
    }
    this.el = el;
    this.store = store;
  }

  mount() {
    this.render(this.store.state);
    this.#unsubscribe = this.store.subscribe((state) => this.onState(state));
    return this;
  }

  destroy() {
    this.#unsubscribe?.();
    this.#unsubscribe = null;
  }

  /** Build the initial DOM. Called once. */
  render(_state) {}

  /** React to a state change. Called on every patch. */
  onState(_state) {}
}
