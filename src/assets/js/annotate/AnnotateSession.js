import { EditDocument } from './EditDocument.js';

const STORAGE_KEY = 'pussycat.edits.v1';

/** Anything larger than this in one photograph is worth a warning first. */
export const LARGE_IMAGE_BYTES = 8 * 1024 * 1024;

/**
 * Owns the pending edits: keeps them in the store, saves them to the browser
 * between visits, and moves them in and out of a file.
 *
 * Work survives a closed tab because it is mirrored to localStorage, but that
 * has a few megabytes of room at most and attached photographs eat it quickly.
 * When it overflows, the edits stay live in memory and the bar says so — the
 * downloaded file is the real artefact, localStorage is only a safety net.
 */
export class AnnotateSession {
  constructor(store) {
    this.store = store;
    this.doc = new EditDocument();
    this.storageFull = false;
  }

  /** Re-publishes the document so subscribed components re-render. */
  #changed() {
    this.save();
    this.store.patch({ edits: this.doc, editsRevision: Date.now() });
  }

  update(mutate) {
    mutate(this.doc);
    this.#changed();
  }

  replace(doc) {
    this.doc = doc;
    this.#changed();
  }

  reset() {
    this.doc = new EditDocument();
    this.storageFull = false;
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* Private mode and blocked storage both land here; nothing to undo. */
    }
    this.#changed();
  }

  // ---- persistence -----------------------------------------------------

  save() {
    try {
      // Nothing pending means nothing to remember — otherwise a discard would
      // leave an empty document behind for the next visit to restore.
      if (this.doc.isEmpty) localStorage.removeItem(STORAGE_KEY);
      else localStorage.setItem(STORAGE_KEY, JSON.stringify(this.doc.toJSON()));
      this.storageFull = false;
    } catch (error) {
      // QuotaExceededError, or storage disabled entirely. Neither is fatal.
      this.storageFull = true;
    }
  }

  restore() {
    let raw;
    try {
      raw = localStorage.getItem(STORAGE_KEY);
    } catch {
      return false;
    }
    if (!raw) return false;
    try {
      this.doc = EditDocument.fromJSON(JSON.parse(raw));
      return !this.doc.isEmpty;
    } catch (error) {
      console.warn('Ignoring unreadable saved edits:', error.message);
      return false;
    }
  }

  // ---- the file --------------------------------------------------------

  download(catalog) {
    const payload = JSON.stringify(this.doc.toJSON(catalog), null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pussycat-edits-${stamp()}.json`;
    document.body.append(link);
    link.click();
    link.remove();
    // Revoking immediately can cancel the download in some browsers.
    setTimeout(() => URL.revokeObjectURL(url), 30_000);
    return payload.length;
  }

  async load(file) {
    const text = await file.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error('that file is not valid JSON');
    }
    this.replace(EditDocument.fromJSON(data));
  }

  /** Rough size of the edit file as it stands, for the counter in the bar. */
  get byteSize() {
    try {
      return JSON.stringify(this.doc.toJSON()).length;
    } catch {
      return 0;
    }
  }
}

/** Reads a picked file as a data URL so the bytes travel inside the edit file. */
export function readAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error(`could not read ${file.name}`));
    reader.readAsDataURL(file);
  });
}

/**
 * The filename a new photograph should be saved as, following the convention
 * in docs/data-model.md: <id>-front, then <id>-2, <id>-3, …
 */
export function nextImageName(id, existingFiles, extension) {
  if (existingFiles.length === 0) return `${id}-front.${extension}`;
  let highest = 1;
  for (const file of existingFiles) {
    const stem = file.slice(id.length + 1).replace(/\.\w+$/, '');
    const n = Number(stem);
    if (Number.isFinite(n) && n > highest) highest = n;
  }
  return `${id}-${highest + 1}.${extension}`;
}

export function extensionFor(file) {
  const fromName = file.name.includes('.') ? file.name.split('.').pop().toLowerCase() : '';
  if (fromName === 'jpeg') return 'jpg';
  if (['jpg', 'png', 'webp', 'gif', 'avif'].includes(fromName)) return fromName;
  const fromType = (file.type.split('/')[1] ?? 'jpg').toLowerCase();
  return fromType === 'jpeg' ? 'jpg' : fromType;
}

export function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function stamp() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`;
}
