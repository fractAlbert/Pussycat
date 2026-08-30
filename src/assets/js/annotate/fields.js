/**
 * The fields annotate mode can edit, and how to render each one.
 *
 * Adding a field here is all it takes for it to appear in the editor and to be
 * carried through to the edit file — the same "one file, one registration"
 * shape the filters use (D-006).
 */
import { BLANK_LABELS } from '../models/Puzzle.js';

export const FIELDS = [
  { key: 'name', label: 'Name', type: 'text', hint: 'Title only — the artist goes in its own field.' },
  { key: 'artist', label: 'Artist', type: 'text', hint: 'Leave blank for Unattributed.' },
  { key: 'series', label: 'Series', type: 'text' },
  { key: 'artNumber', label: 'Art number', type: 'text', hint: 'As printed, e.g. 80 23244.' },
  { key: 'copyright', label: 'Copyright year', type: 'number' },
  { key: 'grid', label: 'Grid', type: 'grid', hint: 'Only from a tile count or the puzzle in hand — a size in a listing is inches.' },
  {
    key: 'blank',
    label: 'Format',
    type: 'select',
    options: [
      { value: '', label: 'Not recorded' },
      ...Object.entries(BLANK_LABELS).map(([value, label]) => ({ value, label })),
    ],
  },
  { key: 'description', label: 'Description', type: 'textarea' },
  { key: 'source', label: 'Source URL', type: 'url' },
  { key: 'owned', label: 'I own this one', type: 'checkbox' },
  { key: 'verified', label: 'Checked against the physical puzzle', type: 'checkbox' },
];

export const DELETE_REASONS = [
  { value: 'duplicate', label: 'Duplicate' },
  { value: 'not-applicable', label: 'Not applicable' },
  { value: 'other', label: 'Other…' },
];

/**
 * Normalises a raw form value to what belongs in puzzles.json.
 * Empty means absent, and absent is null — never "" (docs/data-model.md).
 */
export function coerce(field, value) {
  if (field.type === 'checkbox') return value === true;
  if (field.type === 'number') {
    const trimmed = String(value ?? '').trim();
    if (!trimmed) return null;
    const n = Number(trimmed);
    return Number.isFinite(n) ? n : null;
  }
  if (field.type === 'grid') {
    if (!value || !value.rows || !value.cols) return null;
    return { rows: Number(value.rows), cols: Number(value.cols) };
  }
  const trimmed = String(value ?? '').trim();
  return trimmed === '' ? null : trimmed;
}

/** Field values are compared structurally so a no-op edit is not recorded. */
export function same(a, b) {
  if (a === b) return true;
  if (a === null || b === null || a === undefined || b === undefined) {
    return (a ?? null) === (b ?? null);
  }
  if (typeof a === 'object' && typeof b === 'object') {
    return JSON.stringify(a) === JSON.stringify(b);
  }
  return false;
}
