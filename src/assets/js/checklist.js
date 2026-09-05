import { Store } from './core/Store.js';
import { Puzzle } from './models/Puzzle.js';
import { Checklist } from './components/Checklist.js';
import { ChecklistState, LINKED_KEY } from './checklist/ChecklistState.js';
import { readLinked } from './core/linkedFile.js';
import { DATA_PATH } from './config.js';

async function start() {
  const $ = (id) => document.getElementById(id);

  let puzzles;
  try {
    const response = await fetch(DATA_PATH);
    if (!response.ok) throw new Error(`${DATA_PATH} returned ${response.status}`);
    puzzles = Puzzle.parseAll(await response.json());
  } catch (error) {
    console.error(error);
    $('status').textContent = 'Could not load the catalog. Serve the folder over HTTP — see the README.';
    return;
  }

  const store = new Store({ puzzles });
  const ticks = new ChecklistState(store);
  const restored = ticks.restore();

  const list = new Checklist($('checklist'), store, {
    countEl: $('owned-count'),
    ticks,
  }).mount();

  wireToolbar({ $, ticks, list, puzzles, restored });
  document.body.dataset.ready = 'true';
}

function wireToolbar({ $, ticks, list, puzzles, restored }) {
  const status = $('status');
  const fileInput = $('checklist-file');
  let timer;

  /**
   * Feedback on an action fades; a standing fact does not. Coming back to
   * ticks made days ago is worth saying until something else happens, rather
   * than for five seconds while you are still reading the page.
   */
  const say = (message, { isError = false, sticky = false } = {}) => {
    status.textContent = message;
    status.classList.toggle('status--error', isError);
    clearTimeout(timer);
    if (sticky) return;
    timer = setTimeout(() => {
      status.textContent = '';
      status.classList.remove('status--error');
    }, 5000);
  };

  if (restored) {
    say(`Picked up ${ticks.size} tick${ticks.size === 1 ? '' : 's'} from last time.`, {
      sticky: true,
    });
  }

  // A file saved through the picker can be read back on a later visit. This
  // does not override work already in this browser — localStorage is written on
  // every tick, so it is never older than the file.
  resumeFromLinkedFile({ ticks, list, say, hadLocalWork: restored });

  $('checklist-save').addEventListener('click', async () => {
    if (ticks.size === 0) {
      say('Nothing ticked yet.');
      return;
    }
    const { mode, name } = await ticks.download(puzzles);
    if (mode === 'cancelled') return;
    say(
      mode === 'linked'
        ? `Saved ${ticks.size} tick${ticks.size === 1 ? '' : 's'} to ${name}. This page will offer it back next visit.`
        : `Downloaded ${name}.`,
    );
  });

  $('checklist-load').addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', async () => {
    const file = fileInput.files?.[0];
    fileInput.value = '';
    if (!file) return;
    if (ticks.size > 0 && !confirm('Replace the ticks on this page with that file?')) return;
    try {
      await ticks.load(file);
      list.refreshAll();
      say(`Loaded ${ticks.size} tick${ticks.size === 1 ? '' : 's'} from ${file.name}.`);
    } catch (error) {
      say(`Could not load that file — ${error.message}`, { isError: true });
    }
  });

  $('checklist-clear').addEventListener('click', () => {
    if (ticks.size === 0) return;
    if (!confirm(`Clear all ${ticks.size} ticks?`)) return;
    ticks.clear();
    list.refreshAll();
    say('Cleared.');
  });
}

/**
 * Reads back the file this page last saved to, if the browser still allows it.
 *
 * Permission can only be asked for from a click, so on load this either loads
 * the file outright or puts a button up. A file that has been deleted or moved
 * is forgotten rather than nagged about.
 */
async function resumeFromLinkedFile({ ticks, list, say, hadLocalWork }) {
  const result = await readLinked(LINKED_KEY);
  if (!result) return;

  if (result.status === 'missing') {
    say(`${result.name} is gone, so this page has stopped looking for it.`, { sticky: true });
    return;
  }

  const apply = (text, name) => {
    try {
      ticks.loadText(text);
      list.refreshAll();
      say(`Loaded ${ticks.size} tick${ticks.size === 1 ? '' : 's'} from ${name}.`, { sticky: true });
    } catch (error) {
      say(`${name} could not be read — ${error.message}`, { isError: true, sticky: true });
    }
  };

  if (result.status === 'ok') {
    // Work in this browser is at least as new as the file, so it wins.
    if (hadLocalWork) {
      say(`Ticks from last time. Linked to ${result.name}.`, { sticky: true });
      return;
    }
    apply(result.text, result.name);
    return;
  }

  if (result.status === 'needs-permission') {
    offerResume(result.name, say, async () => {
      const granted = await readLinked(LINKED_KEY, { interactive: true });
      if (granted?.status === 'ok') apply(granted.text, granted.name);
      else if (granted?.status === 'missing') {
        say(`${granted.name} is gone, so this page has stopped looking for it.`, { sticky: true });
      }
    });
  }
}

/** A one-click resume, because the browser will not grant access without one. */
function offerResume(name, say, onClick) {
  const status = document.getElementById('status');
  say('', { sticky: true });
  status.append(`Continue from ${name}? `);
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'annobar__btn';
  button.textContent = 'Open it';
  button.addEventListener('click', onClick);
  status.append(button);
}

start();
