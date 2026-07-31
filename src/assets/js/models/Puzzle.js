export const UNATTRIBUTED = 'Unattributed';

export const BLANK_LABELS = {
  extra: 'Extra space',
  inline: 'Inline blank',
};

/**
 * One catalog entry.
 *
 * Everything derivable from the stored fields is a getter, never a stored
 * property, so it cannot drift out of sync with the source data.
 * See docs/data-model.md.
 *
 * Most fields are optional because entries are built from sale listings, which
 * routinely give a title and a tile count and nothing else. An entry with a
 * name is worth recording; the rest can be filled in later.
 */
export class Puzzle {
  constructor(record) {
    this.id = record.id;
    this.name = record.name;
    this.artist = record.artist ?? null;
    this.series = record.series ?? null;
    this.grid = record.grid ?? null;
    this.blank = record.blank ?? null;
    this.images = record.images ?? {};
    this.description = record.description ?? '';
    this.source = record.source ?? null;
    this.verified = record.verified === true;
  }

  get artistLabel() {
    return this.artist ?? UNATTRIBUTED;
  }

  get sizeKey() {
    return this.grid ? `${this.grid.rows}x${this.grid.cols}` : null;
  }

  get sizeLabel() {
    return this.grid ? `${this.grid.rows}×${this.grid.cols}` : null;
  }

  get blankLabel() {
    return this.blank ? BLANK_LABELS[this.blank] ?? this.blank : null;
  }

  /**
   * "extra" puzzles show the complete image and carry a spare cell outside it;
   * "inline" puzzles are missing one tile from the image itself (D-008).
   */
  get tileCount() {
    if (!this.grid || !this.blank) return null;
    const cells = this.grid.rows * this.grid.cols;
    return this.blank === 'extra' ? cells : cells - 1;
  }

  get frontImage() {
    return this.images.front ?? null;
  }

  get backImage() {
    return this.images.back ?? null;
  }

  get searchText() {
    return [this.name, this.artistLabel, this.series, this.description]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
  }

  /**
   * Builds Puzzle instances from raw JSON, dropping anything malformed with a
   * console warning. A bad hand-edited entry should cost one card, not the
   * whole page.
   */
  static parseAll(records) {
    if (!Array.isArray(records)) {
      throw new Error('puzzles.json must contain an array');
    }
    const seen = new Set();
    const puzzles = [];

    for (const record of records) {
      const problem = Puzzle.validate(record, seen);
      if (problem) {
        console.warn(`Skipping puzzle entry: ${problem}`, record);
        continue;
      }
      seen.add(record.id);
      puzzles.push(new Puzzle(record));
    }
    return puzzles;
  }

  static validate(record, seen) {
    if (!record || typeof record !== 'object') return 'not an object';
    if (!record.id) return 'missing id';
    if (seen.has(record.id)) return `duplicate id "${record.id}"`;
    if (!record.name) return `"${record.id}" is missing a name`;
    if (record.grid && !(record.grid.rows && record.grid.cols)) {
      return `"${record.id}" has a grid without both rows and cols`;
    }
    if (record.blank && !(record.blank in BLANK_LABELS)) {
      return `"${record.id}" has unknown blank type "${record.blank}"`;
    }
    // A grid without a blank type cannot yield a tile count, and vice versa.
    if (Boolean(record.grid) !== Boolean(record.blank)) {
      console.warn(`"${record.id}": grid and blank should be given together`);
    }
    return null;
  }
}
