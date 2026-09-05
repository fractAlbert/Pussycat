/**
 * Stands in for "this puzzle has no value recorded for this filter".
 *
 * A plain string rather than a symbol because option values round-trip through
 * a `data-value` attribute, which can only carry text. Real values are grid
 * sizes and format names, so nothing can collide with it.
 */
export const UNKNOWN = '__unknown__';

/**
 * Base class for a catalog filter.
 *
 * To add a filter: subclass this, implement valueFor(), and register it in
 * filters/index.js. Nothing else in the app needs to change (D-006).
 *
 * Pass `includeUnknown: true` to give the filter an extra "Unknown" option
 * that selects the entries it has nothing recorded for. Worth having wherever
 * the gaps are themselves interesting — the unmeasured puzzles are a worklist.
 */
export class Filter {
  constructor({ key, label, includeUnknown = false }) {
    this.key = key;
    this.label = label;
    this.includeUnknown = includeUnknown;
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

  /** The text on the option button. */
  displayLabel(value) {
    return value === UNKNOWN ? 'Unknown' : this.labelFor(value);
  }

  /** Every distinct value present in the data, in display order. */
  options(puzzles) {
    const values = new Set();
    let anyMissing = false;
    for (const puzzle of puzzles) {
      const value = this.valueFor(puzzle);
      if (value === null || value === undefined) anyMissing = true;
      else values.add(value);
    }

    const sorted = [...values].sort((a, b) => this.compare(a, b));
    // Appended rather than sorted in, so compare() never has to know about the
    // sentinel. Unknown is the absence of a value, not one of them, and it
    // belongs at the end of the row.
    if (this.includeUnknown && anyMissing) sorted.push(UNKNOWN);
    return sorted;
  }

  /**
   * An empty selection means "no constraint", so a filter nobody has touched
   * never removes anything.
   */
  matches(puzzle, selected) {
    if (!selected || selected.size === 0) return true;
    const value = this.valueFor(puzzle);
    if (value === null || value === undefined) {
      return this.includeUnknown && selected.has(UNKNOWN);
    }
    return selected.has(value);
  }
}
