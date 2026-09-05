import { Store } from './core/Store.js';
import { Puzzle } from './models/Puzzle.js';
import { Checklist } from './components/Checklist.js';
import { ChecklistState } from './checklist/ChecklistState.js';
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

  $('checklist-save').addEventListener('click', () => {
    if (ticks.size === 0) {
      say('Nothing ticked yet.');
      return;
    }
    ticks.download(puzzles);
    say(`Saved ${ticks.size} tick${ticks.size === 1 ? '' : 's'}.`);
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

start();
