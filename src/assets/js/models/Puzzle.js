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
    this.images = Puzzle.normalizeImages(record.images);
    this.description = record.description ?? '';
    this.source = record.source ?? null;
    this.verified = record.verified === true;
    this.owned = record.owned === true;
    // Printed on the puzzle itself — the closest thing to a catalogue key.
    this.artNumber = record.artNumber ?? null;
    this.copyright = record.copyright ?? null;
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

  /**
   * Photographs in display order. Accepts either a plain array or the older
   * {front, back} shape.
   *
   * `label` is only set when the view is actually known — a listing photo is
   * just a photo, and calling one "Back" because it happened to be second
   * would put a guess in the catalog.
   */
  static normalizeImages(images) {
    if (!images) return [];
    const list = Array.isArray(images)
      ? images
      : [
          images.front && { ...images.front, label: images.front.label ?? 'Front' },
          images.back && { ...images.back, label: images.back.label ?? 'Back' },
        ];
    return list
      .filter((image) => image && image.file)
      .map((image) => ({
        file: image.file,
        sourceUrl: image.sourceUrl ?? null,
        label: image.label ?? null,
        // Set only for a photograph picked in annotate mode that has not been
        // written to src/images/puzzles/ yet. Rendering prefers it over `file`.
        dataUrl: image.dataUrl ?? null,
      }));
  }

  /** Where to load this image from — a pending pick, or the catalog folder. */
  static srcFor(image, imagePath) {
    return image.dataUrl ?? imagePath + image.file;
  }

  /**
   * The plain record this was built from. Round-trips through the constructor,
   * which is what lets annotate mode overlay edits without special-casing
   * every field.
   */
  toRecord() {
    return {
      id: this.id,
      name: this.name,
      artist: this.artist,
      series: this.series,
      artNumber: this.artNumber,
      copyright: this.copyright,
      grid: this.grid ? { ...this.grid } : null,
      blank: this.blank,
      images: this.images.map((image) => ({ ...image })),
      description: this.description,
      source: this.source,
      owned: this.owned,
      verified: this.verified,
    };
  }

  /** The one shown on the catalog card. */
  get primaryImage() {
    return this.images[0] ?? null;
  }

  get hasImages() {
    return this.images.length > 0;
  }

  labelFor(image, index) {
    return image.label ?? `View ${index + 1}`;
  }

  /** Art numbers are searchable with or without their internal spaces. */
  get searchText() {
    const art = this.artNumber ? [this.artNumber, this.artNumber.replace(/\s+/g, '')] : [];
    return [this.name, this.artistLabel, this.series, this.description, ...art]
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
    // A grid alone is fine — it still sizes and filters, it just cannot yield
    // a tile count. A blank type with no grid tells us nothing at all.
    if (record.blank && !record.grid) {
      console.warn(`"${record.id}": blank type given without a grid`);
    }
    return null;
  }
}
