import { Store } from './core/Store.js';
import { Puzzle } from './models/Puzzle.js';
import { Checklist } from './components/Checklist.js';
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
  new Checklist($('checklist'), store, { countEl: $('owned-count') }).mount();
}

start();
