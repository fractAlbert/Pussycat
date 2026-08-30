import { Puzzle } from '../models/Puzzle.js';
import { same } from './fields.js';

export const EDIT_FORMAT = 'pussycat-edits';
export const EDIT_VERSION = 1;

/**
 * A set of pending changes to the catalog, held entirely in the browser.
 *
 * Nothing here ever writes to the site. A static page cannot touch the file
 * system, so `src/data/puzzles.json` and `src/images/puzzles/` are safe by
 * construction, not by promise — the only way out is toJSON(), which the user
 * downloads and hands over to be applied.
 *
 * Changes are keyed by puzzle id and grouped per entry, because that is how
 * they get read later: everything about one puzzle in one place.
 */
export class EditDocument {
  constructor() {
    /** id -> { reason, note } */
    this.deletions = new Map();
    /** id -> { field -> { from, to } } */
    this.fields = new Map();
    /** id -> [ imageChange ] */
    this.images = new Map();
    /** Full explicit id order, or null while the catalog order is untouched. */
    this.order = null;
    this.notes = '';
    this.created = new Date().toISOString();
  }

  // ---- deletions -------------------------------------------------------

  markDeleted(id, reason, note = '') {
    this.deletions.set(id, { reason, note: note.trim() });
  }

  unmarkDeleted(id) {
    this.deletions.delete(id);
  }

  deletionFor(id) {
    return this.deletions.get(id) ?? null;
  }

  // ---- field edits -----------------------------------------------------

  /**
   * Records an edit, or drops it if the value is back to what the catalog
   * already says — so a field touched and reverted leaves no trace.
   */
  setField(puzzle, key, value) {
    const original = originalValue(puzzle, key);
    const entry = this.fields.get(puzzle.id) ?? {};

    if (same(original, value)) {
      delete entry[key];
    } else {
      entry[key] = { from: original, to: value };
    }

    if (Object.keys(entry).length) this.fields.set(puzzle.id, entry);
    else this.fields.delete(puzzle.id);
  }

  fieldsFor(id) {
    return this.fields.get(id) ?? {};
  }

  // ---- images ----------------------------------------------------------

  addImage(id, change) {
    const list = this.images.get(id) ?? [];
    list.push(change);
    this.images.set(id, list);
  }

  removeImage(id, index) {
    const list = this.images.get(id) ?? [];
    list.splice(index, 1);
    if (list.length) this.images.set(id, list);
    else this.images.delete(id);
  }

  imagesFor(id) {
    return this.images.get(id) ?? [];
  }

  // ---- ordering --------------------------------------------------------

  /**
   * Moves `id` to sit immediately before `beforeId`, or last when that is null.
   *
   * `order` is the arrangement to start from and must already list every entry.
   * The caller passes the order currently on screen rather than letting this
   * invent one — seeding from the catalog's own file order instead of the sort
   * the user is looking at is what made the grid jump on the first drag.
   */
  moveBefore(order, id, beforeId) {
    const next = [...order];
    const from = next.indexOf(id);
    if (from === -1) return;
    next.splice(from, 1);
    const to = beforeId === null ? next.length : next.indexOf(beforeId);
    next.splice(to === -1 ? next.length : to, 0, id);
    this.order = next;
  }

  clearOrder() {
    this.order = null;
  }

  // ---- reading ---------------------------------------------------------

  touched(id) {
    return (
      this.deletions.has(id) ||
      this.fields.has(id) ||
      this.images.has(id)
    );
  }

  get touchedIds() {
    return new Set([...this.deletions.keys(), ...this.fields.keys(), ...this.images.keys()]);
  }

  get isEmpty() {
    return this.touchedIds.size === 0 && this.order === null && !this.notes.trim();
  }

  get summary() {
    let imageCount = 0;
    for (const list of this.images.values()) imageCount += list.length;
    return {
      deletions: this.deletions.size,
      edited: this.fields.size,
      images: imageCount,
      reordered: this.order !== null,
    };
  }

  /**
   * The puzzle as it would look once these edits are applied — what the card
   * and the modal actually display, so the page shows the work in progress.
   * Returns the original instance when nothing touches it.
   */
  applyTo(puzzle) {
    if (!this.fields.has(puzzle.id) && !this.images.has(puzzle.id)) return puzzle;

    const record = puzzle.toRecord();
    for (const [key, change] of Object.entries(this.fieldsFor(puzzle.id))) {
      record[key] = change.to;
    }

    const pending = this.imagesFor(puzzle.id);
    if (pending.length) {
      const toImage = (i) => ({
        file: i.targetFile,
        sourceUrl: null,
        label: i.label,
        dataUrl: i.data,
      });

      // A replacement takes the exact slot of the file it replaces, so the
      // gallery keeps its order and the primary photo stays primary.
      const replacements = new Map();
      const additions = [];
      for (const change of pending) {
        if (change.replaces) replacements.set(change.replaces, change);
        else additions.push(change);
      }

      const matched = new Set();
      const substituted = record.images.map((image) => {
        const change = replacements.get(image.file);
        if (!change) return image;
        matched.add(image.file);
        return toImage(change);
      });

      // A replacement whose target has since vanished still has to show up.
      const orphaned = [...replacements.values()].filter((c) => !matched.has(c.replaces));
      record.images = [...substituted, ...orphaned.map(toImage), ...additions.map(toImage)];
    }
    return new Puzzle(record);
  }

  // ---- the edit file ---------------------------------------------------

  toJSON(catalog = []) {
    const byId = new Map(catalog.map((p) => [p.id, p]));
    const ids = [...this.touchedIds].sort();

    const entries = ids.map((id) => {
      const puzzle = byId.get(id);
      const deletion = this.deletions.get(id);
      const fields = this.fieldsFor(id);
      const images = this.imagesFor(id);

      return {
        id,
        currentName: puzzle?.name ?? '(not in the loaded catalog)',
        action: deletion ? 'delete' : 'update',
        ...(deletion
          ? { delete: { reason: deletion.reason, note: deletion.note || null } }
          : {}),
        fields: Object.keys(fields).length ? fields : {},
        images,
      };
    });

    return {
      format: EDIT_FORMAT,
      version: EDIT_VERSION,
      created: this.created,
      updated: new Date().toISOString(),
      catalog: { entries: catalog.length },
      summary: this.summary,
      howToApply: HOW_TO_APPLY,
      notes: this.notes.trim(),
      entries,
      order: this.order ? { sort: 'manual', ids: this.order } : null,
    };
  }

  static fromJSON(data) {
    if (!data || typeof data !== 'object') throw new Error('not a JSON object');
    if (data.format !== EDIT_FORMAT) {
      throw new Error(`not a Pussycat edit file (format was "${data.format ?? 'missing'}")`);
    }
    if (Number(data.version) > EDIT_VERSION) {
      throw new Error(`written by a newer version (${data.version}) than this page understands`);
    }

    const doc = new EditDocument();
    doc.created = typeof data.created === 'string' ? data.created : doc.created;
    doc.notes = typeof data.notes === 'string' ? data.notes : '';

    for (const entry of Array.isArray(data.entries) ? data.entries : []) {
      if (!entry || typeof entry.id !== 'string') continue;
      if (entry.action === 'delete' && entry.delete) {
        doc.deletions.set(entry.id, {
          reason: entry.delete.reason ?? 'other',
          note: entry.delete.note ?? '',
        });
      }
      if (entry.fields && Object.keys(entry.fields).length) {
        doc.fields.set(entry.id, { ...entry.fields });
      }
      if (Array.isArray(entry.images) && entry.images.length) {
        doc.images.set(entry.id, entry.images.map((i) => ({ ...i })));
      }
    }

    if (data.order && Array.isArray(data.order.ids)) doc.order = [...data.order.ids];
    return doc;
  }
}

/** Reads the value a field currently has in the catalog. */
function originalValue(puzzle, key) {
  const record = puzzle.toRecord();
  return record[key] ?? null;
}

const HOW_TO_APPLY = [
  'This file was produced by annotate mode on the Pussycat catalog page. It is a',
  'request for changes — nothing in the site has been modified.',
  '',
  'For each object in "entries", keyed by its "id" in src/data/puzzles.json:',
  '  - action "delete": remove that entry. "delete.reason" says why; "duplicate"',
  '    means merge anything worth keeping into the entry named in the note first.',
  '  - action "update": apply every key in "fields". Each carries "from" (what the',
  '    catalog said when the edit was made) and "to" (the new value). If "from" no',
  '    longer matches the catalog, the data changed underneath — ask before applying.',
  '  - "images": each has "data" (a base64 data URL holding the actual file) and',
  '    "targetFile" (what to save it as). Decode "data" and write the bytes to',
  '    src/images/puzzles/<targetFile>, then reference it from that entry\'s',
  '    "images" array. "label" is "Front"/"Back"/null, and null renders as',
  '    "View 2", "View 3".',
  '      - op "add": append it as a new view.',
  '      - op "replace": it takes the place of the file named in "replaces" —',
  '        same position in the array. Note "targetFile" and "replaces" can differ',
  '        in extension when the new photograph is a different format, so delete',
  '        the old file rather than assuming it is overwritten.',
  '',
  'If "order" is present, "order.ids" is the full intended entry order for',
  'puzzles.json. Reorder the array to match; ids not listed keep their relative',
  'position at the end.',
  '',
  'Run `node scripts/sync-images.js` afterwards to confirm every image reference',
  'resolves, then reload the page to check nothing is broken.',
].join('\n');
