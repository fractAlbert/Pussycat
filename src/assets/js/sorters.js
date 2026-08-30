import { UNATTRIBUTED } from './models/Puzzle.js';

export class Sorter {
  constructor({ key, label, compare }) {
    this.key = key;
    this.label = label;
    this.compare = compare;
  }
}

const byName = (a, b) => a.name.localeCompare(b.name);

/** Unattributed sinks to the bottom; within an artist, sort by name. */
const byArtist = (a, b) => {
  if (a.artistLabel !== b.artistLabel) {
    if (a.artistLabel === UNATTRIBUTED) return 1;
    if (b.artistLabel === UNATTRIBUTED) return -1;
    return a.artistLabel.localeCompare(b.artistLabel);
  }
  return byName(a, b);
};

/** Puzzles with no recorded size sort last rather than as if they were zero. */
const bySize = (a, b) => {
  if (a.tileCount === null || b.tileCount === null) {
    if (a.tileCount === b.tileCount) return byName(a, b);
    return a.tileCount === null ? 1 : -1;
  }
  return a.tileCount - b.tileCount || byName(a, b);
};

/**
 * Hand-arranged order, set by dragging cards in annotate mode.
 *
 * It has no comparator of its own because the order lives in the edit
 * document, not in the puzzles — CatalogGrid sorts by that list directly and
 * falls back to name when there is no order yet.
 */
export const MANUAL_SORT = 'manual';

export const SORTERS = [
  new Sorter({ key: 'name', label: 'Name', compare: byName }),
  new Sorter({ key: 'artist', label: 'Artist', compare: byArtist }),
  new Sorter({ key: 'size', label: 'Size', compare: bySize }),
  new Sorter({ key: MANUAL_SORT, label: 'Custom order', compare: byName }),
];

export function sorterFor(key) {
  return SORTERS.find((s) => s.key === key) ?? SORTERS[0];
}
