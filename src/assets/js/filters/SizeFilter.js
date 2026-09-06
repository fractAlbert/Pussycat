import { Filter } from './Filter.js';

export class SizeFilter extends Filter {
  constructor() {
    super({ key: 'size', label: 'Size', includeUnknown: true });
  }

  valueFor(puzzle) {
    return puzzle.sizeKey;
  }

  labelFor(value) {
    return value.replace('x', '×');
  }

  /** Numeric ordering, so 7x9 does not sort before 10x10 as a string would. */
  compare(a, b) {
    const [aRows, aCols] = a.split('x').map(Number);
    const [bRows, bCols] = b.split('x').map(Number);
    return aRows * aCols - bRows * bCols || aRows - bRows;
  }
}
