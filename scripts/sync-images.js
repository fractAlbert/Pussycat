#!/usr/bin/env node
/**
 * Scans src/images/puzzles/ and folds any files it finds into puzzles.json.
 *
 * Naming convention:
 *   <id>-front.jpg   the catalog card thumbnail, listed first
 *   <id>-back.jpg    labelled "Back"
 *   <id>-2.jpg …     extra views, unlabelled
 *
 * Existing entries keep their labels and source URLs; new files inherit the
 * attribution URL already recorded for that puzzle. Run it after dropping
 * files into the folder — it is safe to run repeatedly.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DATA = path.join(ROOT, 'src/data/puzzles.json');
const IMAGES = path.join(ROOT, 'src/images/puzzles');

const puzzles = JSON.parse(fs.readFileSync(DATA, 'utf8'));
const files = fs.readdirSync(IMAGES).filter((f) => /\.(jpe?g|png|webp)$/i.test(f));

/** front first, then back, then numbered views in numeric order. */
function rank(file, id) {
  const rest = file.slice(id.length + 1).replace(/\.\w+$/, '');
  if (rest === 'front') return -2;
  if (rest === 'back') return -1;
  const n = Number(rest);
  return Number.isFinite(n) ? n : 999;
}

function labelFor(file, id) {
  const rest = file.slice(id.length + 1).replace(/\.\w+$/, '');
  if (rest === 'back') return 'Back';
  return null;
}

let added = 0;
let touched = 0;

for (const puzzle of puzzles) {
  const mine = files
    .filter((f) => f === `${puzzle.id}-front.jpg` || f.startsWith(`${puzzle.id}-`))
    .filter((f) => {
      // "escher-e128-birds-2.jpg" must not be claimed by "escher-e128".
      const rest = f.slice(puzzle.id.length + 1).replace(/\.\w+$/, '');
      return rest === 'front' || rest === 'back' || /^\d+$/.test(rest);
    })
    .sort((a, b) => rank(a, puzzle.id) - rank(b, puzzle.id));

  if (mine.length === 0) continue;

  const existing = new Map((puzzle.images || []).map((img) => [img.file, img]));
  const attribution =
    (puzzle.images || []).find((img) => img.sourceUrl)?.sourceUrl ?? puzzle.source ?? null;

  const next = mine.map((file) => {
    const prior = existing.get(file);
    if (prior) return prior;
    added += 1;
    return { file, sourceUrl: attribution, label: labelFor(file, puzzle.id) };
  });

  if (JSON.stringify(next) !== JSON.stringify(puzzle.images)) {
    puzzle.images = next;
    touched += 1;
  }
}

const orphans = files.filter(
  (f) => !puzzles.some((p) => (p.images || []).some((img) => img.file === f)),
);

fs.writeFileSync(DATA, `${JSON.stringify(puzzles, null, 2)}\n`);

console.log(`${added} new image(s) added across ${touched} entr(ies).`);
if (orphans.length) {
  console.log(`\n${orphans.length} file(s) match no entry id — check the names:`);
  for (const f of orphans) console.log(`  ${f}`);
}
