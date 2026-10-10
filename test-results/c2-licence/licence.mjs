// Asks the Commons API for the licence of every art image's source file.
// Run from the repo root: node test-results/c2-licence/licence.mjs
import { readFileSync } from 'node:fs';

const UA = 'PussycatCatalog/1.0 (https://github.com/fractAlbert/Pussycat)';
const OK = /^(public domain|pd|cc0)/i;

const data = JSON.parse(readFileSync('src/data/puzzles.json', 'utf8'));
const list = (Array.isArray(data) ? data : data.puzzles).filter((p) => p.art);
const titleOf = (url) => 'File:' + decodeURIComponent(url.split('/wiki/File:')[1]).replace(/_/g, ' ');

const titles = list.map((p) => titleOf(p.art.sourceUrl));
const api = 'https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo&iiprop=extmetadata'
  + '&iiextmetadatafilter=LicenseShortName|License&titles=' + encodeURIComponent(titles.join('|'));
const res = await fetch(api, { headers: { 'User-Agent': UA } });
const json = await res.json();
const byTitle = new Map();
for (const page of Object.values(json.query.pages)) byTitle.set(page.title, page);
const norm = new Map((json.query.normalized || []).map((n) => [n.from, n.to]));

let failures = 0;
for (const p of list) {
  const t = titleOf(p.art.sourceUrl);
  const page = byTitle.get(norm.get(t) || t);
  const meta = page?.imageinfo?.[0]?.extmetadata || {};
  const short = meta.LicenseShortName?.value ?? '(none)';
  const lic = meta.License?.value ?? '(none)';
  const pass = page && !('missing' in page) && (OK.test(short) || OK.test(lic));
  if (!pass) failures++;
  console.log(`${pass ? 'ok  ' : 'FAIL'} ${p.id.padEnd(30)} LicenseShortName="${short}" License="${lic}"`);
}
console.log(`HTTP ${res.status}; files checked: ${list.length}`);
console.log(failures ? `FAILED: ${failures}` : 'ALL PASS');
process.exitCode = failures ? 1 : 0;
