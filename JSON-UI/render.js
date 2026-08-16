/*
 * render.js - turns a VALIDATED catalog tree into AdminLTE DOM.
 *
 * SECURITY POSTURE, stated so it is not eroded by a later "small" change:
 *   - Every text value reaches the DOM through textContent. innerHTML is never used, anywhere.
 *   - Class names come from THIS FILE only, never from the JSON. The catalog's `tone` prop is a
 *     closed enum that maps to a fixed class here, so the model cannot inject a class.
 *   - No element is created from a model-supplied tag name.
 *   - No attribute is set from model-supplied keys.
 *   - Data lookup goes through a path resolver that refuses __proto__/constructor/prototype.
 *   If you are editing this file and reach for innerHTML, stop: that is the whole attack surface.
 */

(function (global) {
  'use strict';

  const TONE_CLASS = {
    nominal:   'stx-nominal',
    attention: 'stx-attention',
    critical:  'stx-critical',
    degraded:  'stx-degraded',
    muted:     'stx-muted',
    info:      'stx-info'
  };

  // Resolve "sections.roster.live" or "sections.disk.drives[0].freeGB" against the data object.
  // Returns undefined rather than throwing: a missing value is a display problem, not a crash,
  // and it must render as UNKNOWN so a blind spot never looks like a zero.
  function resolve(data, path, scope) {
    if (path === undefined || path === null) return undefined;
    let root = data;
    let p = String(path);
    if (p.startsWith('$item')) { root = scope; p = p.slice(5).replace(/^\./, ''); }
    if (p === '') return root;
    if (/__proto__|constructor|prototype/.test(p)) return undefined;
    return p.split('.').reduce((acc, part) => {
      if (acc === undefined || acc === null) return undefined;
      const m = part.match(/^([^\[]+)?((\[\d+\])*)$/);
      if (!m) return undefined;
      let cur = acc;
      if (m[1]) cur = cur[m[1]];
      if (m[2]) {
        for (const idx of m[2].match(/\d+/g) || []) {
          if (cur === undefined || cur === null) return undefined;
          cur = cur[Number(idx)];
        }
      }
      return cur;
    }, root);
  }

  // The one place a value becomes visible text. UNKNOWN is deliberate and load-bearing: a section
  // that could not be measured must never render as 0, because a green zero reads as health.
  function display(v) {
    if (v === undefined || v === null) return 'UNKNOWN';
    if (typeof v === 'boolean') return v ? 'YES' : 'NO';
    if (typeof v === 'number') return String(v);
    if (Array.isArray(v)) return String(v.length);
    if (typeof v === 'object') return 'OBJ';
    return String(v);
  }

  function el(tag, cls, text) {
    const n = document.createElement(tag);          // tag is a literal from this file, never data
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;   // ALWAYS textContent
    return n;
  }

  function toneCls(t) { return t ? (TONE_CLASS[t] || 'stx-muted') : ''; }

  function renderNode(node, data, scope) {
    const p = node.props;
    switch (node.type) {

      case 'StatusBanner': {
        const w = el('div', 'stx-banner ' + toneCls(p.tone));
        w.appendChild(el('span', 'stx-banner-label', p.label));
        if (p.detail) w.appendChild(el('span', 'stx-banner-detail', p.detail));
        return w;
      }

      case 'Panel': {
        const card = el('div', 'card stx-panel ' + toneCls(p.tone));
        const head = el('div', 'card-header');
        head.appendChild(el('h3', 'card-title', p.title));
        card.appendChild(head);
        const body = el('div', 'card-body');
        (node.children || []).forEach((c) => body.appendChild(renderNode(c, data, scope)));
        card.appendChild(body);
        return card;
      }

      case 'Row': {
        const row = el('div', 'row');
        const span = Math.floor(12 / p.cols);
        (node.children || []).forEach((c) => {
          const col = el('div', 'col-md-' + span);
          col.appendChild(renderNode(c, data, scope));
          row.appendChild(col);
        });
        return row;
      }

      case 'Metric': {
        const v = resolve(data, p.valuePath, scope);
        const box = el('div', 'stx-metric ' + toneCls(p.tone) + (v === undefined ? ' stx-unknown' : ''));
        box.appendChild(el('div', 'stx-metric-label', p.label));
        const val = el('div', 'stx-metric-value', display(v) + (p.unit && v !== undefined ? ' ' + p.unit : ''));
        box.appendChild(val);
        if (p.deltaPath) {
          const d = resolve(data, p.deltaPath, scope);
          if (typeof d === 'number') {
            box.appendChild(el('div', 'stx-metric-delta ' + (d < 0 ? 'stx-down' : 'stx-up'),
              (d >= 0 ? '+' : '') + d));
          }
        }
        return box;
      }

      case 'Field': {
        const v = resolve(data, p.valuePath, scope);
        const line = el('div', 'stx-field ' + toneCls(p.tone) + (v === undefined ? ' stx-unknown' : ''));
        line.appendChild(el('span', 'stx-field-label', p.label));
        line.appendChild(el('span', 'stx-field-value', display(v)));
        return line;
      }

      case 'Gauge': {
        const v = resolve(data, p.valuePath, scope);
        const max = p.maxPath ? resolve(data, p.maxPath, scope) : 100;
        const wrap = el('div', 'stx-gauge ' + toneCls(p.tone));
        wrap.appendChild(el('div', 'stx-gauge-label', p.label + '  ' + display(v)));
        const track = el('div', 'progress');
        const bar = el('div', 'progress-bar');
        let pct = 0;
        if (typeof v === 'number' && typeof max === 'number' && max > 0) {
          pct = Math.max(0, Math.min(100, (v / max) * 100));
        }
        bar.style.width = pct.toFixed(1) + '%';        // numeric only, computed here
        track.appendChild(bar);
        wrap.appendChild(track);
        return wrap;
      }

      case 'Repeat': {
        const arr = resolve(data, p.fromPath, scope);
        const wrap = el('div', 'stx-repeat');
        if (!Array.isArray(arr) || arr.length === 0) {
          wrap.appendChild(el('div', 'stx-empty', p.emptyText || 'none'));
          return wrap;
        }
        arr.slice(0, 64).forEach((item) => {
          const rowWrap = el('div', 'stx-repeat-item');
          (node.children || []).forEach((c) => rowWrap.appendChild(renderNode(c, data, item)));
          wrap.appendChild(rowWrap);
        });
        return wrap;
      }

      case 'Table': {
        const arr = resolve(data, p.fromPath, scope);
        const wrap = el('div', 'table-responsive');
        if (!Array.isArray(arr) || arr.length === 0) {
          wrap.appendChild(el('div', 'stx-empty', p.emptyText || 'none'));
          return wrap;
        }
        const t = el('table', 'table table-sm stx-table');
        const thead = el('thead'); const htr = el('tr');
        p.columns.forEach((c) => htr.appendChild(el('th', null, c.header)));
        thead.appendChild(htr); t.appendChild(thead);
        const tb = el('tbody');
        arr.slice(0, 200).forEach((item) => {
          const tr = el('tr');
          p.columns.forEach((c) => {
            // A Table COLUMN path is row-relative by definition - that is what a column IS. The
            // renderer used to resolve it against the data ROOT unless it began with "$item", so a
            // natural column path like "name" looked for a top-level "name", found nothing, and
            // rendered UNKNOWN. Every row of every table on this console read UNKNOWN for exactly
            // this reason while the row COUNTS were correct, because fromPath resolved fine.
            //
            // The view was not wrong; this default was. Evidence: of the ten column paths written
            // for this console, nine were bare and one carried the prefix - the surprising form is
            // the one nobody reaches for. An explicit "$item." prefix still works and means the
            // same thing, so no existing view breaks.
            //
            // Scoped to Table columns ONLY. Inside a Repeat, a bare path resolving against the root
            // is meaningful - a global value shown beside each item - so that stays as it was.
            const cp = c.valuePath.startsWith('$item') ? c.valuePath : ('$item.' + c.valuePath);
            const v = resolve(data, cp, item);
            const td = el('td', v === undefined ? 'stx-unknown' : null, display(v));
            tr.appendChild(td);
          });
          tb.appendChild(tr);
        });
        t.appendChild(tb); wrap.appendChild(t);
        return wrap;
      }

      case 'Note':
        return el('p', 'stx-note ' + toneCls(p.tone), p.text);

      default:
        // Unreachable: validate() already rejected unknown types. Defensive only.
        return el('div', 'stx-error', 'unrenderable node');
    }
  }

  /*
   * render(tree, data, mountEl) -> {ok, error}
   * Validates FIRST, renders only if the whole tree passed. A partially-rendered invalid tree
   * would be worse than nothing: it looks like a working display while omitting what failed.
   */
  function render(tree, data, mount) {
    mount.textContent = '';
    let safe;
    try {
      safe = Array.isArray(tree)
        ? tree.map((n) => global.StarshipCatalog.validate(n))
        : [global.StarshipCatalog.validate(tree)];
    } catch (e) {
      const err = el('div', 'stx-banner stx-critical');
      err.appendChild(el('span', 'stx-banner-label', 'VIEW REJECTED'));
      err.appendChild(el('span', 'stx-banner-detail', e.message));
      mount.appendChild(err);
      return { ok: false, error: e.message };
    }
    safe.forEach((n) => mount.appendChild(renderNode(n, data, data)));
    return { ok: true };
  }

  global.StarshipRender = { render, resolve, display };
})(window);
