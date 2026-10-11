import { Store } from './core/Store.js';
import { Puzzle } from './models/Puzzle.js';
import { TodoList } from './components/TodoList.js';
import { PuzzleModal } from './components/PuzzleModal.js';
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

  // `selected` drives the detail modal, the same as on the catalog page.
  const store = new Store({ puzzles, selected: null });
  new TodoList($('todo'), store, { summaryEl: $('summary') }).mount();
  new PuzzleModal($('detail'), store).mount();
  document.body.dataset.ready = 'true';
}

start();
