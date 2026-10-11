import { Filter } from './Filter.js';

/**
 * Narrows the catalog to the puzzles that can be played on the site: they
 * need art, a grid and a blank type (see Puzzle.isPlayable). One button,
 * because "not playable" is just everything else.
 */
export class PlayableFilter extends Filter {
  constructor() {
    super({ key: 'playable', label: 'Play' });
  }

  valueFor(puzzle) {
    return puzzle.isPlayable ? 'playable' : null;
  }

  labelFor() {
    return 'Playable';
  }
}
