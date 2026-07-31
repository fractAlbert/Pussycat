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
   * Filters with nothing to offer (a series filter when no entry has a series)
   * are hidden rather than rendered as an empty group.
   */
  withOptions(puzzles) {
    return this.all()
      .map((filter) => ({ filter, options: filter.options(puzzles) }))
      .filter(({ options }) => options.length > 1);
  }
}
