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
 */
export class Puzzle {
  constructor(record) {
    this.id = record.id;
    this.name = record.name;
    this.artist = record.artist ?? null;
    this.series = record.series ?? null;
    this.grid = record.grid;
    this.blank = record.blank;
    this.images = record.images ?? {};
    this.description = record.description ?? '';
  }

  get artistLabel() {
    return this.artist ?? UNATTRIBUTED;
  }

  get sizeKey() {
    return `${this.grid.rows}x${this.grid.cols}`;
  }

  get sizeLabel() {
    return `${this.grid.rows}×${this.grid.cols}`;
  }

  get blankLabel() {
    return BLANK_LABELS[this.blank] ?? this.blank;
  }

  /**
   * "extra" puzzles show the complete image and carry a spare cell outside it;
   * "inline" puzzles are missing one tile from the image itself (D-008).
   */
  get tileCount() {
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
    if (!record.grid?.rows || !record.grid?.cols) {
      return `"${record.id}" is missing grid rows/cols`;
    }
    if (!(record.blank in BLANK_LABELS)) {
      return `"${record.id}" has unknown blank type "${record.blank}"`;
    }
    return null;
  }
}
