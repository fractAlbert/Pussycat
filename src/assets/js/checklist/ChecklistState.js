import { saveLinked } from '../core/linkedFile.js';

export const CHECKLIST_FORMAT = 'pussycat-checklist';
export const CHECKLIST_VERSION = 1;
const STORAGE_KEY = 'pussycat.checklist.v1';
export const LINKED_KEY = 'checklist';

/**
 * Which puzzles are ticked on the checklist.
 *
 * The ticks are the reader's own working record and start empty — they are not
 * seeded from `owned` in the catalog. A checklist you carry to a fair is
 * something you fill in, and pre-ticking it would mean rubbing marks out to
 * correct them rather than putting them in.
 *
 * What the catalog already records is still shown beside each row, so nothing
 * is hidden; it just does not move the box.
 *
 * Like annotate mode, this never writes to the site. Ticks live in the browser
 * and leave as a downloaded file (D-010).
 */
export class ChecklistState {
  constructor(store) {
    this.store = store;
    this.checked = new Set();
    this.storageFull = false;
  }

  has(id) {
    return this.checked.has(id);
  }

  get size() {
    return this.checked.size;
  }

  toggle(id) {
    if (this.checked.has(id)) this.checked.delete(id);
    else this.checked.add(id);
    this.save();
    return this.checked.has(id);
  }

  countIn(puzzles) {
    return puzzles.reduce((n, p) => n + (this.checked.has(p.id) ? 1 : 0), 0);
  }

  replace(ids) {
    this.checked = new Set(ids);
    this.save();
  }

  clear() {
    this.checked.clear();
    this.save();
  }

  // ---- persistence -----------------------------------------------------

  save() {
    try {
      if (this.checked.size === 0) localStorage.removeItem(STORAGE_KEY);
      else localStorage.setItem(STORAGE_KEY, JSON.stringify([...this.checked]));
      this.storageFull = false;
    } catch {
      // Storage disabled or full. The ticks still work for this visit.
      this.storageFull = true;
    }
  }

  restore() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return false;
      const ids = JSON.parse(raw);
      if (!Array.isArray(ids)) return false;
      this.checked = new Set(ids.filter((id) => typeof id === 'string'));
      return this.checked.size > 0;
    } catch {
      return false;
    }
  }

  // ---- the file --------------------------------------------------------

  toJSON(puzzles) {
    const checked = puzzles.filter((p) => this.checked.has(p.id));
    const ids = new Set(puzzles.map((p) => p.id));

    return {
      format: CHECKLIST_FORMAT,
      version: CHECKLIST_VERSION,
      updated: new Date().toISOString(),
      catalog: { entries: puzzles.length },
      summary: { checked: checked.length, of: puzzles.length },
      howToApply: HOW_TO_APPLY,
      checked: checked.map((p) => ({ id: p.id, name: p.name })),
      // Named explicitly so the disagreement is impossible to miss: these are
      // recorded as held in puzzles.json but were not ticked here.
      recordedOwnedButNotTicked: puzzles
        .filter((p) => p.owned && !this.checked.has(p.id))
        .map((p) => ({ id: p.id, name: p.name })),
      // Ticks kept for entries that are no longer in the catalog, so a tick
      // made before a merge is not silently thrown away.
      tickedButNotInCatalog: [...this.checked].filter((id) => !ids.has(id)),
    };
  }

  /** Writes the checklist, reusing the same file once one has been chosen. */
  async download(puzzles) {
    const payload = JSON.stringify(this.toJSON(puzzles), null, 2);
    const result = await saveLinked(LINKED_KEY, {
      suggestedName: `pussycat-checklist-${stamp()}.json`,
      text: payload,
      description: 'Pussycat checklist',
    });
    return { ...result, bytes: payload.length };
  }

  /** Applies the contents of a linked file that was read back on load. */
  loadText(text) {
    const data = JSON.parse(text);
    if (data.format !== CHECKLIST_FORMAT) throw new Error('not a checklist file');
    const ids = (Array.isArray(data.checked) ? data.checked : [])
      .map((entry) => (typeof entry === 'string' ? entry : entry?.id))
      .filter((id) => typeof id === 'string');
    this.replace([...ids, ...(data.tickedButNotInCatalog ?? [])]);
  }

  async load(file) {
    let data;
    try {
      data = JSON.parse(await file.text());
    } catch {
      throw new Error('that file is not valid JSON');
    }
    if (data.format !== CHECKLIST_FORMAT) {
      throw new Error(`not a checklist file (format was "${data.format ?? 'missing'}")`);
    }
    if (Number(data.version) > CHECKLIST_VERSION) {
      throw new Error(`written by a newer version (${data.version}) than this page understands`);
    }
    const ids = (Array.isArray(data.checked) ? data.checked : [])
      .map((entry) => (typeof entry === 'string' ? entry : entry?.id))
      .filter((id) => typeof id === 'string');
    this.replace([...ids, ...(data.tickedButNotInCatalog ?? [])]);
  }
}

const HOW_TO_APPLY = [
  'A checklist filled in from the Pussycat catalog page. Nothing in the site has',
  'been modified.',
  '',
  'Every id under "checked" is a puzzle the owner holds: set "owned": true on it',
  'in src/data/puzzles.json. Ticking is done by hand from an empty list, so an',
  'entry missing from "checked" means only that it was not ticked — it is not a',
  'statement that the puzzle is not held.',
  '',
  '"recordedOwnedButNotTicked" lists entries the catalog already marks as owned',
  'that were not ticked. Ask before clearing any of them; the likely cause is an',
  'unfinished pass rather than a puzzle having left the collection.',
  '',
  '"tickedButNotInCatalog" holds ticks whose entry has since been renamed or',
  'merged away. Work out where each one went rather than dropping it.',
].join('\n');

function stamp() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`;
}
