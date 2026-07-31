/**
 * Holds every registered filter. The catalog asks the registry, never an
 * individual filter, so adding one does not touch the others (D-006).
 */
export class FilterRegistry {
  #filters = new Map();

  add(filter) {
    this.#filters.set(filter.key, filter);
    return this;
  }

  get(key) {
    return this.#filters.get(key);
  }

  all() {
    return [...this.#filters.values()];
  }

  /** Empty selections for every registered filter. */
  emptySelections() {
    return Object.fromEntries(this.all().map((f) => [f.key, new Set()]));
  }

  /** True when a puzzle satisfies every filter at once. */
  accepts(puzzle, selections) {
    return this.all().every((f) => f.matches(puzzle, selections[f.key]));
  }

  /**
   * Only shows a filter that can actually narrow the list: either it offers a
   * choice between values, or a single value that some entries lack. A lone
   * option still earns its place when other puzzles have nothing recorded —
   * one "Art" button is what separates the art series from everything else.
   */
  withOptions(puzzles) {
    return this.all()
      .map((filter) => ({ filter, options: filter.options(puzzles) }))
      .filter(({ filter, options }) => {
        if (options.length === 0) return false;
        if (options.length > 1) return true;
        return puzzles.some((p) => filter.valueFor(p) === null);
      });
  }
}
