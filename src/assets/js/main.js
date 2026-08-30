import { Store } from './core/Store.js';
import { Puzzle } from './models/Puzzle.js';
import { buildRegistry } from './filters/index.js';
import { CatalogGrid } from './components/CatalogGrid.js';
import { FilterPanel } from './components/FilterPanel.js';
import { SearchBox } from './components/SearchBox.js';
import { SortSelect } from './components/SortSelect.js';
import { PuzzleModal } from './components/PuzzleModal.js';
import { AnnotateBar } from './components/AnnotateBar.js';
import { AnnotateEditor } from './components/AnnotateEditor.js';
import { AnnotateSession } from './annotate/AnnotateSession.js';
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
    // Annotate mode. `edits` is the pending EditDocument; `editsRevision`
    // exists so components can tell when it changed, since it mutates in place.
    annotating: false,
    editing: null,
    edits: null,
    editsRevision: 0,
  });

  const session = new AnnotateSession(store);
  const restored = session.restore();
  store.patch({ edits: session.doc });

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
    session,
  }).mount();
  new PuzzleModal($('detail'), store).mount();
  new AnnotateBar($('annotate-bar'), store, {
    session,
    toggleEl: $('annotate-toggle'),
  }).mount();
  new AnnotateEditor($('annotate-editor'), store, { session }).mount();

  // Unsaved work from a previous visit is worth surfacing, not just restoring
  // silently — the file is the artefact, and it has not been written yet.
  if (restored) {
    store.patch({ annotating: true });
    $('status').textContent =
      'Picked up where you left off — unsaved annotations were restored. ' +
      'Download the edit file when you are done.';
  }

  document.body.dataset.ready = 'true';
}

start();
