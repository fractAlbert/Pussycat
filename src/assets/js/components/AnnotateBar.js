import { Component } from '../core/Component.js';
import { html } from '../core/html.js';
import { formatBytes } from '../annotate/AnnotateSession.js';

/**
 * The annotate-mode toolbar: what is pending, and the ways in and out of a
 * file. Hidden entirely when annotate mode is off.
 */
export class AnnotateBar extends Component {
  constructor(el, store, { session, toggleEl }) {
    super(el, store);
    this.session = session;
    this.toggleEl = toggleEl;
  }

  render(state) {
    this.el.innerHTML = html`
      <div class="annobar__inner">
        <div class="annobar__counts" id="anno-counts" role="status"></div>
        <div class="annobar__actions">
          <button type="button" class="annobar__btn" data-act="download">
            Download edit file
          </button>
          <button type="button" class="annobar__btn" data-act="load">
            Load edit file…
          </button>
          <button type="button" class="annobar__btn annobar__btn--quiet" data-act="reset">
            Discard all
          </button>
          <input type="file" accept="application/json,.json" id="anno-file" hidden>
        </div>
      </div>
      <label class="annobar__notes">
        <span class="field__label">Notes for whoever applies this file</span>
        <textarea id="anno-notes" rows="2"
          placeholder="Anything that does not fit a single entry…"></textarea>
      </label>
      <p class="annobar__warning" id="anno-warning" hidden></p>
    `;

    this.countsEl = this.el.querySelector('#anno-counts');
    this.notesEl = this.el.querySelector('#anno-notes');
    this.warningEl = this.el.querySelector('#anno-warning');
    this.fileEl = this.el.querySelector('#anno-file');

    this.el.addEventListener('click', (event) => {
      const act = event.target.closest('[data-act]')?.dataset.act;
      if (act === 'download') this.#download();
      if (act === 'load') this.fileEl.click();
      if (act === 'reset') this.#reset();
    });

    this.fileEl.addEventListener('change', () => this.#load());

    this.notesEl.addEventListener('input', () => {
      this.session.doc.notes = this.notesEl.value;
      this.session.save();
      this.#renderCounts(this.store.state);
    });

    this.toggleEl.addEventListener('click', () => {
      const on = !this.store.state.annotating;
      this.store.patch({ annotating: on, selected: null });
    });

    this.onState(state);
  }

  onState(state) {
    const on = state.annotating === true;
    this.el.hidden = !on;
    this.toggleEl.setAttribute('aria-pressed', String(on));
    this.toggleEl.textContent = on ? 'Done annotating' : 'Annotate';
    document.body.classList.toggle('is-annotating', on);

    if (!on) return;
    if (this.notesEl.value !== this.session.doc.notes) {
      this.notesEl.value = this.session.doc.notes;
    }
    this.#renderCounts(state);
  }

  #renderCounts(state) {
    const { deletions, edited, images, reordered } = this.session.doc.summary;
    const parts = [];
    if (deletions) parts.push(`${deletions} to delete`);
    if (edited) parts.push(`${edited} edited`);
    if (images) parts.push(`${images} image${images === 1 ? '' : 's'}`);
    if (reordered) parts.push('reordered');

    const size = this.session.byteSize;
    this.countsEl.innerHTML = parts.length
      ? html`<strong>${parts.join(' · ')}</strong>
             <span class="annobar__size">edit file ≈ ${formatBytes(size)}</span>`
      : html`<span class="annobar__idle">No changes yet — click any card to start.</span>`;

    const full = this.session.storageFull && parts.length > 0;
    this.warningEl.hidden = !full;
    if (full) {
      this.warningEl.textContent =
        'Too large to keep in browser storage — these changes will be lost if you ' +
        'close the tab. Download the edit file now.';
    }
    void state;
  }

  #download() {
    if (this.session.doc.isEmpty) {
      this.#flash('Nothing to download yet.');
      return;
    }
    const size = this.session.download(this.store.state.puzzles);
    this.#flash(`Downloaded — ${formatBytes(size)}.`);
  }

  async #load() {
    const file = this.fileEl.files?.[0];
    if (!file) return;
    const replacing = !this.session.doc.isEmpty;
    if (replacing && !confirm('Replace the changes you have pending with this file?')) {
      this.fileEl.value = '';
      return;
    }
    try {
      await this.session.load(file);
      this.#flash(`Loaded ${file.name}.`);
    } catch (error) {
      this.#flash(`Could not load that file — ${error.message}`, true);
    }
    this.fileEl.value = '';
  }

  #reset() {
    if (this.session.doc.isEmpty) return;
    if (!confirm('Discard every pending change? This cannot be undone.')) return;
    this.session.reset();
  }

  #flash(message, isError = false) {
    this.warningEl.hidden = false;
    this.warningEl.textContent = message;
    this.warningEl.classList.toggle('annobar__warning--error', isError);
    clearTimeout(this.flashTimer);
    this.flashTimer = setTimeout(() => {
      this.warningEl.classList.remove('annobar__warning--error');
      this.#renderCounts(this.store.state);
    }, 4000);
  }
}
