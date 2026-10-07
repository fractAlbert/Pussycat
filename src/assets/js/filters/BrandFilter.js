import { Filter } from './Filter.js';
import { DEFAULT_BRAND } from '../models/Puzzle.js';

export class BrandFilter extends Filter {
  constructor() {
    super({ key: 'brand', label: 'Brand' });
  }

  valueFor(puzzle) {
    return puzzle.brand;
  }

  /** Pussycat first — it is the catalog's subject; the rest follow alphabetically. */
  compare(a, b) {
    if (a === DEFAULT_BRAND) return -1;
    if (b === DEFAULT_BRAND) return 1;
    return a.localeCompare(b);
  }
}
