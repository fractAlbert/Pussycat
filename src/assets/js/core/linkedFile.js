/**
 * Remembering the file a page saved to, so it can be picked up again later.
 *
 * When the browser supports it, saving goes through the file picker ("Save
 * As") and hands back a `FileSystemFileHandle`. Keeping that handle means the
 * next visit can read the same file back, and later saves overwrite it in
 * place instead of littering the downloads folder with copies.
 *
 * The handle lives in IndexedDB rather than a cookie. A cookie holds text, and
 * a handle is not text — it is an opaque object that only survives a
 * structured clone, which IndexedDB does and `document.cookie` cannot. It also
 * outlasts a cookie: there is no expiry to renew.
 *
 * Browsers without the picker (Firefox, Safari) fall back to an ordinary
 * download, and there is nothing to remember — a download gives the page no
 * reference to where the file went.
 */

const DB_NAME = 'pussycat';
const STORE = 'fileHandles';

export function supportsFilePicker() {
  return typeof window.showSaveFilePicker === 'function';
}

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE)) {
        request.result.createObjectStore(STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function withStore(mode, run) {
  let db;
  try {
    db = await openDb();
  } catch {
    // Private browsing and blocked storage both land here. Saving still works;
    // it just will not be remembered.
    return null;
  }
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, mode);
      const request = run(tx.objectStore(STORE));
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch {
    return null;
  } finally {
    db.close();
  }
}

const putHandle = (key, handle) => withStore('readwrite', (s) => s.put(handle, key));
const getHandle = (key) => withStore('readonly', (s) => s.get(key));

export const forgetLinked = (key) => withStore('readwrite', (s) => s.delete(key));

/**
 * Writes `text`, through the file picker when available.
 *
 * Returns what happened, so the caller can say so:
 *   { mode: 'linked' | 'download' | 'cancelled', name }
 */
export async function saveLinked(key, { suggestedName, text, description = 'JSON file' }) {
  if (!supportsFilePicker()) {
    downloadFallback(suggestedName, text);
    return { mode: 'download', name: suggestedName };
  }

  let handle = await getHandle(key);

  // Reuse the remembered file when it is still writable, so repeated saves go
  // to the same place without asking again.
  if (handle && (await ensurePermission(handle, 'readwrite', false)) !== 'granted') {
    handle = null;
  }

  if (!handle) {
    try {
      handle = await window.showSaveFilePicker({
        suggestedName,
        types: [{ description, accept: { 'application/json': ['.json'] } }],
      });
    } catch (error) {
      if (error.name === 'AbortError') return { mode: 'cancelled', name: null };
      downloadFallback(suggestedName, text);
      return { mode: 'download', name: suggestedName };
    }
  }

  try {
    const writable = await handle.createWritable();
    await writable.write(text);
    await writable.close();
  } catch (error) {
    // The file may have been moved or deleted since it was remembered.
    await forgetLinked(key);
    downloadFallback(suggestedName, text);
    return { mode: 'download', name: suggestedName };
  }

  await putHandle(key, handle);
  return { mode: 'linked', name: handle.name };
}

/**
 * Reads the remembered file back.
 *
 * `interactive` decides whether the browser may prompt for permission, which
 * it can only do from a user gesture. On page load it is false, so this either
 * returns the contents or reports that a click is needed.
 *
 * A file that has been deleted or moved is forgotten rather than reported, so
 * a stale reference cleans itself up.
 */
export async function readLinked(key, { interactive = false } = {}) {
  if (!supportsFilePicker()) return null;
  const handle = await getHandle(key);
  if (!handle) return null;

  const permission = await ensurePermission(handle, 'read', interactive);
  if (permission !== 'granted') {
    return { status: 'needs-permission', name: handle.name };
  }

  try {
    const file = await handle.getFile();
    return { status: 'ok', name: handle.name, text: await file.text() };
  } catch (error) {
    if (error.name === 'NotFoundError' || error.name === 'NotReadableError') {
      await forgetLinked(key);
      return { status: 'missing', name: handle.name };
    }
    return null;
  }
}

/** The remembered filename, for display. Null when nothing is linked. */
export async function linkedName(key) {
  if (!supportsFilePicker()) return null;
  const handle = await getHandle(key);
  return handle?.name ?? null;
}

async function ensurePermission(handle, mode, interactive) {
  try {
    const options = { mode };
    let state = await handle.queryPermission(options);
    if (state === 'prompt' && interactive) {
      state = await handle.requestPermission(options);
    }
    return state;
  } catch {
    return 'denied';
  }
}

function downloadFallback(name, text) {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}
