/**
 * Base class for a catalog filter.
 *
 * To add a filter: subclass this, implement valueFor(), and register it in
 * filters/index.js. Nothing else in the app needs to change (D-006).
 */
export class Filter {
  constructor({ key, label }) {
    this.key = key;
    this.label = label;
  }

  /** The value this puzzle should be filed under. Return null to exclude it. */
  valueFor(_puzzle) {
    throw new Error(`${this.constructor.name} must implement valueFor()`);
  }

  /** How the value reads in the filter UI. */
  labelFor(value) {
    return String(value);
  }

  /** Ordering of the option buttons. */
  compare(a, b) {
    return String(a).localeCompare(String(b));
  }

  /** Every distinct value present in the data, in display order. */
  options(puzzles) {
    const values = new Set();
    for (const puzzle of puzzles) {
      const value = this.valueFor(puzzle);
      if (value !== null && value !== undefined) values.add(value);
    }
    return [...values].sort((a, b) => this.compare(a, b));
  }

  /**
   * An empty selection means "no constraint", so a filter nobody has touched
   * never removes anything.
   */
  matches(puzzle, selected) {
    if (!selected || selected.size === 0) return true;
    return selected.has(this.valueFor(puzzle));
  }
}
