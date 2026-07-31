import { FilterRegistry } from './FilterRegistry.js';
import { ArtistFilter } from './ArtistFilter.js';
import { SeriesFilter } from './SeriesFilter.js';
import { SizeFilter } from './SizeFilter.js';
import { BlankFilter } from './BlankFilter.js';

/**
 * The one place filters are wired up.
 *
 * Adding a filter is a new file next to these, plus one line below.
 */
export function buildRegistry() {
  return new FilterRegistry()
    .add(new ArtistFilter())
    .add(new SeriesFilter())
    .add(new SizeFilter())
    .add(new BlankFilter());
}
