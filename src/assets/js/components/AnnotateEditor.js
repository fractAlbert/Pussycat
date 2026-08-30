import { Component } from '../core/Component.js';
import { html, raw, esc } from '../core/html.js';
import { IMAGE_PATH } from '../config.js';
import { Puzzle } from '../models/Puzzle.js';
import { FIELDS, DELETE_REASONS, coerce } from '../annotate/fields.js';
import {
  readAsDataURL,
  nextImageName,
  extensionFor,
  formatBytes,
  LARGE_IMAGE_BYTES,
} from '../annotate/AnnotateSession.js';

/**
 * The editor for one entry. Opens in place of the normal detail modal while
 * annotate mode is on.
 *
 * Every control writes straight through to the EditDocument, so the card
 * behind it updates as you type and there is no separate save step to forget.
 */
export class AnnotateEditor extends Component {
  constructor(el, store, { session }) {
    super(el, store);
    this.session = session;
    this.shownId = null;
    this.pendingPick = null;
  }

  render(state) {
    this.el.addEventListener('cancel', (event) => {
      event.preventDefault();
      this.#close();
    });
    this.el.addEventListener('close', () => this.#close());
    this.onState(state);
  }

  onState(state) {
    const id = state.annotating ? state.editing : null;

    if (!id) {
      if (this.el.open) this.el.close();
      this.shownId = null;
      return;
    }

    const puzzle = state.puzzles.find((p) => p.id === id);
    if (!puzzle) return;

    // Rebuild only when the entry changes, so typing does not lose the caret.
    if (this.shownId !== id) {
      this.shownId = id;
      this.#build(puzzle);
      if (!this.el.open) this.el.showModal();
    } else {
      this.#refreshLive(puzzle);
    }
  }

  #close() {
    if (this.store.state.editing !== null) this.store.patch({ editing: null });
    this.shownId = null;
  }

  // ---- markup ----------------------------------------------------------

  #build(puzzle) {
    const doc = this.session.doc;
    const effective = doc.applyTo(puzzle);
    const deletion = doc.deletionFor(puzzle.id);

    this.el.innerHTML = html`
      <form method="dialog" class="annoedit__form">
        <header class="annoedit__head">
          <div>
            <h2 class="annoedit__title">${effective.name}</h2>
            <p class="annoedit__id"><code>${puzzle.id}</code></p>
          </div>
          <button type="button" class="annoedit__close" data-act="close" aria-label="Close">×</button>
        </header>

        <section class="annoedit__section">
          <h3 class="annoedit__legend">Mark for deletion</h3>
          <div class="annoedit__delete" id="anno-delete">
            ${raw(this.#deleteControls(deletion))}
          </div>
        </section>

        <section class="annoedit__section">
          <h3 class="annoedit__legend">Images</h3>
          <div class="annoedit__images" id="anno-images">
            ${raw(this.#imageList(puzzle, effective))}
          </div>
          <button type="button" class="annoedit__btn" data-act="add-image">Add an image…</button>
          <input type="file" accept="image/*" id="anno-image-file" hidden>
          <p class="annoedit__hint">
            The picture is copied into the edit file itself, so the file is all
            that needs handing over. Nothing on disk is touched.
          </p>
        </section>

        <section class="annoedit__section">
          <h3 class="annoedit__legend">Details</h3>
          ${raw(FIELDS.map((f) => this.#field(f, puzzle, effective)).join(''))}
        </section>
      </form>
    `;

    this.el.querySelector('[data-act="close"]').addEventListener('click', () => {
      this.el.close();
    });
    this.el.addEventListener('click', (event) => this.#onClick(event));
    this.el.addEventListener('input', (event) => this.#onInput(event));
    this.el.addEventListener('change', (event) => this.#onInput(event));
    this.el
      .querySelector('#anno-image-file')
      .addEventListener('change', (event) => this.#onImagePicked(event));

    this.#applyDeletedState(Boolean(deletion));
  }

  #deleteControls(deletion) {
    const active = Boolean(deletion);
    const reason = deletion?.reason ?? '';
    return html`
      <label class="annoedit__check">
        <input type="checkbox" data-del="on" ${raw(active ? 'checked' : '')}>
        <span>Mark this entry for deletion</span>
      </label>
      <div class="annoedit__reasons" ${raw(active ? '' : 'hidden')}>
        ${raw(
          DELETE_REASONS.map(
            (r) => html`
              <label class="annoedit__radio">
                <input type="radio" name="del-reason" value="${r.value}"
                  ${raw(reason === r.value ? 'checked' : '')}>
                <span>${r.label}</span>
              </label>
            `,
          ).join(''),
        )}
        <input type="text" class="annoedit__input" data-del="note"
          placeholder="${raw(
            reason === 'duplicate'
              ? esc('Which entry is it a duplicate of?')
              : esc('Details (required for “Other”)'),
          )}"
          value="${deletion?.note ?? ''}">
      </div>
    `;
  }

  #imageList(puzzle, effective) {
    const pending = this.session.doc.imagesFor(puzzle.id);
    if (!effective.images.length) {
      return html`<p class="annoedit__empty">No photograph yet.</p>`;
    }
    return effective.images
      .map((image, index) => {
        const pendingIndex = pending.findIndex((p) => p.targetFile === image.file);
        const isPending = pendingIndex !== -1;
        return html`
          <figure class="annoedit__image ${raw(isPending ? 'is-pending' : '')}">
            <img src="${Puzzle.srcFor(image, IMAGE_PATH)}" alt="${effective.labelFor(image, index)}">
            <figcaption>
              <code>${image.file}</code>
              ${raw(isPending ? html`<em class="annoedit__new">new</em>` : '')}
            </figcaption>
            ${raw(
              isPending
                ? html`<button type="button" class="annoedit__btn annoedit__btn--quiet"
                         data-act="drop-image" data-index="${pendingIndex}">Undo</button>`
                : html`<button type="button" class="annoedit__btn annoedit__btn--quiet"
                         data-act="replace-image" data-file="${image.file}">Replace…</button>`,
            )}
          </figure>
        `;
      })
      .join('');
  }

  #field(field, puzzle, effective) {
    const record = effective.toRecord();
    const value = record[field.key];
    const changed = field.key in this.session.doc.fieldsFor(puzzle.id);
    const cls = `annoedit__field${changed ? ' is-changed' : ''}`;
    const hint = field.hint ? html`<span class="annoedit__hint">${field.hint}</span>` : '';

    if (field.type === 'checkbox') {
      return html`
        <label class="${raw(cls)} annoedit__check">
          <input type="checkbox" data-field="${field.key}" ${raw(value ? 'checked' : '')}>
          <span>${field.label}</span>
        </label>
      `;
    }

    if (field.type === 'grid') {
      return html`
        <div class="${raw(cls)}">
          <span class="field__label">${field.label}</span>
          <span class="annoedit__grid">
            <input type="number" min="1" max="30" data-field="grid" data-part="rows"
              value="${value?.rows ?? ''}" placeholder="rows" aria-label="Grid rows">
            <span>×</span>
            <input type="number" min="1" max="30" data-field="grid" data-part="cols"
              value="${value?.cols ?? ''}" placeholder="cols" aria-label="Grid columns">
          </span>
          ${raw(hint)}
        </div>
      `;
    }

    if (field.type === 'select') {
      return html`
        <label class="${raw(cls)}">
          <span class="field__label">${field.label}</span>
          <select data-field="${field.key}">
            ${raw(
              field.options
                .map(
                  (o) => html`<option value="${o.value}"
                    ${raw(String(value ?? '') === o.value ? 'selected' : '')}>${o.label}</option>`,
                )
                .join(''),
            )}
          </select>
          ${raw(hint)}
        </label>
      `;
    }

    if (field.type === 'textarea') {
      return html`
        <label class="${raw(cls)}">
          <span class="field__label">${field.label}</span>
          <textarea data-field="${field.key}" rows="4">${value ?? ''}</textarea>
          ${raw(hint)}
        </label>
      `;
    }

    return html`
      <label class="${raw(cls)}">
        <span class="field__label">${field.label}</span>
        <input type="${field.type}" data-field="${field.key}" value="${value ?? ''}">
        ${raw(hint)}
      </label>
    `;
  }

  // ---- events ----------------------------------------------------------

  #onClick(event) {
    const act = event.target.closest('[data-act]')?.dataset.act;
    if (!act) return;
    const puzzleId = this.shownId;

    if (act === 'add-image') {
      this.pendingPick = { op: 'add', replaces: null };
      this.el.querySelector('#anno-image-file').click();
    }
    if (act === 'replace-image') {
      this.pendingPick = { op: 'replace', replaces: event.target.dataset.file };
      this.el.querySelector('#anno-image-file').click();
    }
    if (act === 'drop-image') {
      const index = Number(event.target.dataset.index);
      this.session.update((doc) => doc.removeImage(puzzleId, index));
      this.#rebuildImages();
    }
  }

  #onInput(event) {
    const target = event.target;
    const puzzle = this.store.state.puzzles.find((p) => p.id === this.shownId);
    if (!puzzle) return;

    if (target.dataset.del) {
      this.#onDeleteInput(puzzle);
      return;
    }

    const key = target.dataset.field;
    if (!key) return;
    const field = FIELDS.find((f) => f.key === key);
    if (!field) return;

    let value;
    if (field.type === 'checkbox') {
      value = target.checked;
    } else if (field.type === 'grid') {
      const box = target.closest('.annoedit__grid');
      value = {
        rows: box.querySelector('[data-part="rows"]').value,
        cols: box.querySelector('[data-part="cols"]').value,
      };
    } else {
      value = target.value;
    }

    this.session.update((doc) => doc.setField(puzzle, key, coerce(field, value)));
    this.#markChanged(key, target);
  }

  #onDeleteInput(puzzle) {
    const on = this.el.querySelector('[data-del="on"]').checked;
    const reason = this.el.querySelector('[name="del-reason"]:checked')?.value ?? 'duplicate';
    const note = this.el.querySelector('[data-del="note"]').value;

    this.session.update((doc) => {
      if (on) doc.markDeleted(puzzle.id, reason, note);
      else doc.unmarkDeleted(puzzle.id);
    });

    this.el.querySelector('.annoedit__reasons').hidden = !on;
    if (on && !this.el.querySelector('[name="del-reason"]:checked')) {
      this.el.querySelector('[name="del-reason"]').checked = true;
    }
    this.#applyDeletedState(on);
  }

  async #onImagePicked(event) {
    const input = event.target;
    const file = input.files?.[0];
    const pick = this.pendingPick;
    input.value = '';
    this.pendingPick = null;
    if (!file || !pick) return;

    if (!file.type.startsWith('image/')) {
      alert(`${file.name} is not an image.`);
      return;
    }
    if (
      file.size > LARGE_IMAGE_BYTES &&
      !confirm(
        `${file.name} is ${formatBytes(file.size)}. It will be embedded in the edit ` +
          'file, making it large and possibly too big for the browser to remember ' +
          'between visits. Add it anyway?',
      )
    ) {
      return;
    }

    const puzzle = this.store.state.puzzles.find((p) => p.id === this.shownId);
    const doc = this.session.doc;
    const taken = [
      ...puzzle.images.map((i) => i.file),
      ...doc.imagesFor(puzzle.id).map((i) => i.targetFile),
    ];

    let data;
    try {
      data = await readAsDataURL(file);
    } catch (error) {
      alert(error.message);
      return;
    }

    const extension = extensionFor(file);
    const targetFile =
      pick.op === 'replace'
        ? pick.replaces.replace(/\.\w+$/, `.${extension}`)
        : nextImageName(puzzle.id, taken, extension);

    this.session.update((d) =>
      d.addImage(puzzle.id, {
        op: pick.op,
        targetFile,
        replaces: pick.replaces,
        sourceName: file.name,
        mimeType: file.type,
        bytes: file.size,
        label: guessLabel(targetFile, puzzle.id),
        addedAt: new Date().toISOString(),
        data,
      }),
    );
    this.#rebuildImages();
  }

  // ---- partial refreshes ----------------------------------------------

  /** Only the image list is rebuilt, so nothing being typed into is disturbed. */
  #rebuildImages() {
    const puzzle = this.store.state.puzzles.find((p) => p.id === this.shownId);
    if (!puzzle) return;
    const effective = this.session.doc.applyTo(puzzle);
    this.el.querySelector('#anno-images').innerHTML = this.#imageList(puzzle, effective);
  }

  #refreshLive(puzzle) {
    const title = this.el.querySelector('.annoedit__title');
    const effective = this.session.doc.applyTo(puzzle);
    if (title && title.textContent !== effective.name) title.textContent = effective.name;
  }

  #markChanged(key, target) {
    const wrapper = target.closest('.annoedit__field');
    if (!wrapper) return;
    const changed = key in this.session.doc.fieldsFor(this.shownId);
    wrapper.classList.toggle('is-changed', changed);
  }

  #applyDeletedState(deleted) {
    this.el.classList.toggle('is-deleted', deleted);
  }
}

/** A file called <id>-front / <id>-back names its own view; the rest do not. */
function guessLabel(targetFile, id) {
  const stem = targetFile.slice(id.length + 1).replace(/\.\w+$/, '');
  if (stem === 'front') return 'Front';
  if (stem === 'back') return 'Back';
  return null;
}
