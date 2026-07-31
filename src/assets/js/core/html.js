/**
 * Escaping helpers.
 *
 * There is no framework here doing this for us (D-005). Every value that comes
 * from puzzles.json and ends up in markup must go through esc(), or a
 * description containing "<" silently breaks the page.
 */

const ENTITIES = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

export function esc(value) {
  if (value === null || value === undefined) return '';
  return String(value).replace(/[&<>"']/g, (c) => ENTITIES[c]);
}

/**
 * Tagged template that escapes every interpolated value.
 *
 *   html`<h2>${puzzle.name}</h2>`
 *
 * Wrap a value in raw() to opt out when it is already-escaped markup.
 */
export function html(strings, ...values) {
  return strings.reduce((out, str, i) => {
    if (i === 0) return str;
    const value = values[i - 1];
    const rendered = value instanceof Raw
      ? value.markup
      : Array.isArray(value)
        ? value.map((v) => (v instanceof Raw ? v.markup : esc(v))).join('')
        : esc(value);
    return out + rendered + str;
  }, '');
}

class Raw {
  constructor(markup) {
    this.markup = markup;
  }
}

export function raw(markup) {
  return new Raw(markup);
}
