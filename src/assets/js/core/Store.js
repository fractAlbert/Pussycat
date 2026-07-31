/**
 * Minimal observable state container.
 *
 * One store holds the whole app state. Components subscribe and are told when
 * anything changes; they decide for themselves what to do about it.
 */
export class Store {
  #state;
  #listeners = new Set();

  constructor(initial = {}) {
    this.#state = { ...initial };
  }

  get state() {
    return this.#state;
  }

  /** Returns an unsubscribe function. */
  subscribe(listener) {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  }

  /** Shallow-merge changes and notify every subscriber. */
  patch(changes) {
    this.#state = { ...this.#state, ...changes };
    for (const listener of this.#listeners) listener(this.#state);
  }
}
