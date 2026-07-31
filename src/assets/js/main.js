import { Store } from './core/Store.js';
import { Puzzle } from './models/Puzzle.js';
import { buildRegistry } from './filters/index.js';
import { CatalogGrid } from './components/CatalogGrid.js';
import { FilterPanel } from './components/FilterPanel.js';
import { SearchBox } from './components/SearchBox.js';
import { SortSelect } from './components/SortSelect.js';
import { PuzzleModal } from './components/PuzzleModal.js';
import { DATA_PATH } from './config.js';

async function loadPuzzles() {
  const response = await fetch(DATA_PATH);
  if (!response.ok) {
    throw new Error(`${DATA_PATH} returned ${response.status}`);
  }
  return Puzzle.parseAll(await response.json());
}

async function start() {
  const $ = (id) => document.getElementById(id);
  const registry = buildRegistry();

  let puzzles;
  try {
    puzzles = await loadPuzzles();
  } catch (error) {
    console.error(error);
    $('status').textContent =
      'Could not load the catalog. If you opened this file directly from disk, ' +
      'serve the folder over HTTP instead — see the README.';
    return;
  }

  const store = new Store({
    puzzles,
    query: '',
    sort: 'name',
    selected: null,
    selections: registry.emptySelections(),
  });

  new SearchBox($('search'), store).mount();
  new SortSelect($('sort'), store).mount();
  new FilterPanel($('filters'), store, {
    registry,
    clearEl: $('clear'),
  }).mount();
  new CatalogGrid($('grid'), store, {
    registry,
    countEl: $('count'),
    emptyEl: $('empty'),
  }).mount();
  new PuzzleModal($('detail'), store).mount();

  document.body.dataset.ready = 'true';
}

start();
