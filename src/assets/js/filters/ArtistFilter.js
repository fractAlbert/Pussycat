import { Filter } from './Filter.js';
import { UNATTRIBUTED } from '../models/Puzzle.js';

export class ArtistFilter extends Filter {
  constructor() {
    super({ key: 'artist', label: 'Artist' });
  }

  valueFor(puzzle) {
    return puzzle.artistLabel;
  }

  /** Unattributed sorts last rather than alphabetically among real artists. */
  compare(a, b) {
    if (a === UNATTRIBUTED) return 1;
    if (b === UNATTRIBUTED) return -1;
    return a.localeCompare(b);
  }
}
