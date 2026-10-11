// Compares the catalog on this branch with main and checks every added entry
// against the rules in docs/scanning.md. Run from the repo root.
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const now = JSON.parse(readFileSync('src/data/puzzles.json', 'utf8'));
const before = JSON.parse(execSync('git show origin/main:src/data/puzzles.json', { encoding: 'utf8', maxBuffer: 1 << 26 }));
const known = new Set(before.map((p) => p.id));
const added = now.filter((p) => !known.has(p.id));
const problems = [];

const ids = new Set();
for (const p of now) { if (ids.has(p.id)) problems.push(`duplicate id ${p.id}`); ids.add(p.id); }
for (const p of before) { if (!ids.has(p.id)) problems.push(`entry removed: ${p.id}`); }
// An existing entry must be byte-for-byte unchanged.
const nowById = new Map(now.map((p) => [p.id, p]));
for (const p of before) if (JSON.stringify(nowById.get(p.id)) !== JSON.stringify(p)) problems.push(`entry changed: ${p.id}`);

const byNumber = new Map();
for (const p of now) if (p.artNumber) { const k = p.artNumber.replace(/\s+/g, ''); byNumber.set(k, [...(byNumber.get(k) ?? []), p.id]); }
const newCollisions = [...byNumber].filter(([, v]) => v.length > 1 && v.some((id) => !known.has(id)));
for (const [k, v] of newCollisions) problems.push(`art number collision ${k}: ${v}`);

for (const p of added) {
  const where = `[${p.id}]`;
  if (!p.name) problems.push(`${where} no name`);
  if (p.verified !== false) problems.push(`${where} verified must be false`);
  if (p.grid || p.blank) problems.push(`${where} grid/blank must be null (sizes in listings are inches)`);
  if (p.art) problems.push(`${where} must not have art`);
  if (p.images.length) problems.push(`${where} images must be empty (photos are added by hand)`);
  if (!/^https:\/\/www\.ebay\.com\/itm\/\d{9,14}$/.test(p.source ?? '')) problems.push(`${where} source is not an eBay item link`);
  if (p.brand && p.brand !== 'Pussy') problems.push(`${where} unexpected brand ${p.brand}`);
  if (p.artNumber) problems.push(`${where} unexpected art number`);
  console.log(`${p.id.padEnd(38)} ${(p.brand ?? 'Pussycat').padEnd(8)} ${p.name}  <${p.source.split('/').pop()}>`);
}
console.log(`\n${before.length} entries on main -> ${now.length} here; ${added.length} added; existing entries unchanged`);
// A listing item number must not already be cited by an existing entry.
const cited = new Set(before.flatMap((p) => [p.source ?? '', p.description ?? ''].join(' ').match(/\d{11,12}/g) ?? []));
for (const p of added) if (cited.has(p.source.split('/').pop())) problems.push(`[${p.id}] item already cited by an existing entry`);
console.log(problems.length ? 'PROBLEMS:\n' + problems.join('\n') : 'ALL PASS');
process.exitCode = problems.length ? 1 : 0;
