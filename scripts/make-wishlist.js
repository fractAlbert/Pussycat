#!/usr/bin/env node
/**
 * Regenerates docs/image-wishlist.md from the catalog.
 *
 * Two groups, because they need different work:
 *   - entries with no photograph at all
 *   - entries with exactly one, which want the extra views
 *
 * Photographs cannot be harvested in bulk — a loop over listing pages trips
 * eBay's bot protection — so this produces a hand-working list instead:
 * the listing to open and the exact filename to save each image as.
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const puzzles = JSON.parse(
  fs.readFileSync(path.join(root, 'src/data/puzzles.json'), 'utf8'),
);

const count = (p) => (Array.isArray(p.images) ? p.images.length : 0);
const none = puzzles.filter((p) => count(p) === 0);
const one = puzzles.filter((p) => count(p) === 1);

/** Listing URLs are long and noisy; show the item rather than the query string. */
function link(url) {
  if (!url) return '—';
  const label = url.replace(/^https?:\/\//, '').replace(/\?.*$/, '');
  return `[${label.length > 48 ? label.slice(0, 45) + '…' : label}](${url})`;
}

const lines = [
  '# Image wishlist',
  '',
  '**Generated — run `node scripts/make-wishlist.js` to rebuild.**',
  '',
  'Save everything into `src/images/puzzles/`. When the files are in place:',
  '',
  '```',
  'node scripts/sync-images.js',
  '```',
  '',
  'which folds them into `puzzles.json`, carrying the listing URL over as',
  'attribution.',
  '',
  '## No photograph at all',
  '',
  `${none.length} entries. Save the first image as \`<id>-front.jpg\`, then any`,
  'further views as `<id>-2.jpg`, `<id>-3.jpg` and so on.',
  '',
  '| Entry | Save as | Listing |',
  '| --- | --- | --- |',
  ...none.map(
    (p) => `| ${p.name} | \`${p.id}-front.jpg\`, \`${p.id}-2.jpg\`, … | ${link(p.source)} |`,
  ),
  '',
  '## One photograph, extra views wanted',
  '',
  `${one.length} entries. Numbering continues from 2, in whatever order the`,
  'listing shows them — ordering is not meaningful, so do not worry about which',
  'is the back. If you *can* tell, say so and the entry gets a proper label.',
  '',
  '| Entry | Save extra views as | Listing |',
  '| --- | --- | --- |',
  ...one.map(
    (p) => `| ${p.name} | \`${p.id}-2.jpg\`, \`${p.id}-3.jpg\`, … | ${link(p.source)} |`,
  ),
  '',
];

const out = path.join(root, 'docs/image-wishlist.md');
fs.writeFileSync(out, lines.join('\n'));
console.log(
  `${path.relative(root, out)}: ${none.length} with no photo, ${one.length} needing extra views`,
);
