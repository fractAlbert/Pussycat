import { Filter } from './Filter.js';
import { BLANK_LABELS } from '../models/Puzzle.js';

/**
 * Whether the blank cell sits outside the completed image ("extra") or is a
 * missing tile within it ("inline"). See D-008.
 */
export class BlankFilter extends Filter {
  constructor() {
    super({ key: 'blank', label: 'Format' });
  }

  valueFor(puzzle) {
    return puzzle.blank;
  }

  labelFor(value) {
    return BLANK_LABELS[value] ?? value;
  }

  /** Fixed order — these are a known pair, not data-driven. */
  compare(a, b) {
    const order = Object.keys(BLANK_LABELS);
    return order.indexOf(a) - order.indexOf(b);
  }
}
