import { Filter } from './Filter.js';

export class SeriesFilter extends Filter {
  constructor() {
    super({ key: 'series', label: 'Series' });
  }

  /** Null means "not part of a named series", which is not worth a button. */
  valueFor(puzzle) {
    return puzzle.series;
  }
}
