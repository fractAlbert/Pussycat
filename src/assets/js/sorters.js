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

const bySize = (a, b) => a.tileCount - b.tileCount || byName(a, b);

export const SORTERS = [
  new Sorter({ key: 'name', label: 'Name', compare: byName }),
  new Sorter({ key: 'artist', label: 'Artist', compare: byArtist }),
  new Sorter({ key: 'size', label: 'Size', compare: bySize }),
];

export function sorterFor(key) {
  return SORTERS.find((s) => s.key === key) ?? SORTERS[0];
}
