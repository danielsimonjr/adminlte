/*
 * catalog.js - the constrained component vocabulary for the Starship console.
 *
 * WHY A CATALOG AT ALL
 *   This layer renders JSON that an LLM produced. That is a prompt-injection surface unless the
 *   output space is closed. The idea is borrowed from json-render (danielsimonjr/json-render):
 *   give the model a typed catalog and validate at the boundary, so anything it emits is either
 *   schema-valid or rejected - nothing in between.
 *
 *   What is NOT borrowed is the renderer. json-render is React + Next.js and ships three
 *   components; AdminLTE ships a hundred dashboard primitives and no way to drive them from data.
 *   So: their pattern, AdminLTE's vocabulary, no build step and no server.
 *
 * THE RULE THIS FILE EXISTS TO ENFORCE
 *   The JSON is DATA TO VALIDATE, never INSTRUCTIONS TO OBEY. Same control-plane / data-plane
 *   separation that a wake-on-boot design violated on 2026-08-14 by telling an agent to read a
 *   writable file and "do exactly what it says". A guardrail refused that five times before the
 *   flaw was seen. This catalog is that guardrail, in UI form.
 *
 * ADDING A COMPONENT IS A DELIBERATE ACT. If it is not here, it cannot render.
 */

(function (global) {
  'use strict';

  // Prop types. Each returns a COERCED SAFE VALUE or throws. Never returns raw input.
  const T = {
    text: (v) => {
      if (typeof v !== 'string') throw new Error('expected string');
      if (v.length > 500) throw new Error('string too long (max 500)');
      return v;                       // rendered via textContent only - never innerHTML
    },
    num: (v) => {
      if (typeof v !== 'number' || !isFinite(v)) throw new Error('expected finite number');
      return v;
    },
    bool: (v) => {
      if (typeof v !== 'boolean') throw new Error('expected boolean');
      return v;
    },
    // A dotted path into the data object. Restricted charset so it cannot escape into anything.
    //
    // FIXED 2026-08-16. This validator REFUSED "$item" while render.js implements a "$item" scope
    // prefix, so every scoped path inside a Repeat or a Table was rejected here before the resolver
    // ever saw it - and validate() is all-or-nothing, so ONE such path refused the WHOLE view.
    // view.json line 332 uses "valuePath": "$item", which means this console has been refusing its
    // own view tree since it shipped. Neither file was wrong on its own terms; they disagreed with
    // each other, and nothing tested the seam. Found by porting the same code to C# and RUNNING it.
    //
    // "$item" is handled as a LITERAL PREFIX, not by adding "$" to the charset. The one-character
    // version would have legalised every other use of "$" at the same time.
    path: (v) => {
      if (typeof v !== 'string') throw new Error('expected string path');

      // Prototype check FIRST, against the WHOLE string including any scope prefix. "__proto__" is
      // charset-legal, so testing the charset first would let a valid-looking prototype path through
      // on a future regex edit - and checking before the prefix is stripped stops
      // "$item.__proto__" smuggling one past.
      if (v.includes('__proto__') || v.includes('constructor') || v.includes('prototype')) {
        throw new Error('prototype access refused');   // prototype-pollution guard
      }

      let rest = v;
      if (rest.startsWith('$item')) {
        rest = rest.slice(5);
        if (rest === '') return v;                     // bare "$item" is the item itself
        if (rest[0] !== '.') throw new Error('illegal characters in path');
        rest = rest.slice(1);
        if (rest === '') throw new Error('illegal characters in path');
      }

      if (!/^[A-Za-z0-9_.\[\]]+$/.test(rest)) throw new Error('illegal characters in path');
      return v;
    },
    // Closed set. No arbitrary class names, so no CSS-driven exfiltration or layout escape.
    tone: (v) => {
      const ok = ['nominal', 'attention', 'critical', 'degraded', 'muted', 'info'];
      if (!ok.includes(v)) throw new Error('tone must be one of ' + ok.join('|'));
      return v;
    },
    enumOf: (list) => (v) => {
      if (!list.includes(v)) throw new Error('must be one of ' + list.join('|'));
      return v;
    }
  };

  /*
   * The catalog. Each entry declares its props and whether it accepts children.
   * Deliberately NO: raw html, links with model-supplied hrefs, images with model-supplied src,
   * event handlers, style strings, or class overrides. Every one of those is an injection vector
   * and none is needed to display machine telemetry.
   */
  const CATALOG = {
    // Full-width status banner. The single most important thing on the page.
    StatusBanner: {
      props: { label: T.text, tone: T.tone, detail: { type: T.text, optional: true } },
      children: false
    },
    // A titled container. The workhorse.
    Panel: {
      props: { title: T.text, tone: { type: T.tone, optional: true } },
      children: true
    },
    // One number with a label. Binds to data via valuePath.
    Metric: {
      props: {
        label: T.text,
        valuePath: T.path,
        unit: { type: T.text, optional: true },
        deltaPath: { type: T.path, optional: true },
        tone: { type: T.tone, optional: true }
      },
      children: false
    },
    // Label / value line. For things that are not numbers.
    Field: {
      props: { label: T.text, valuePath: T.path, tone: { type: T.tone, optional: true } },
      children: false
    },
    // Repeats its children once per element of an array, with $item scope.
    Repeat: {
      props: { fromPath: T.path, emptyText: { type: T.text, optional: true } },
      children: true
    },
    // A table built from an array of objects. columns are dotted paths relative to the item.
    Table: {
      props: {
        fromPath: T.path,
        columns: (v) => {
          if (!Array.isArray(v)) throw new Error('columns must be an array');
          if (v.length > 8) throw new Error('max 8 columns');
          return v.map((c) => ({ header: T.text(c.header), valuePath: T.path(c.valuePath) }));
        },
        emptyText: { type: T.text, optional: true }
      },
      children: false
    },
    // Bounded bar. pct is 0-100 after clamping.
    Gauge: {
      props: { label: T.text, valuePath: T.path, maxPath: { type: T.path, optional: true }, tone: { type: T.tone, optional: true } },
      children: false
    },
    // Plain paragraph. textContent only.
    Note: {
      props: { text: T.text, tone: { type: T.tone, optional: true } },
      children: false
    },
    // Layout: an N-column row. Children are distributed across columns.
    Row: {
      props: { cols: T.enumOf([1, 2, 3, 4]) },
      children: true
    }
  };

  /*
   * validate(node) -> normalized node, or throws.
   * Recursive. Rejects unknown components, unknown props, missing required props, and any
   * child on a component that does not accept children. Depth-capped so a malformed or hostile
   * tree cannot blow the stack.
   */
  function validate(node, depth) {
    depth = depth || 0;
    if (depth > 12) throw new Error('tree too deep (max 12)');
    if (!node || typeof node !== 'object') throw new Error('node must be an object');

    const spec = CATALOG[node.type];
    if (!spec) throw new Error('unknown component: ' + String(node.type));

    const out = { type: node.type, props: {} };
    const given = node.props || {};

    // Reject unknown props outright rather than ignoring them. Silent ignores hide typos, and a
    // typo in a security boundary is how things get through.
    for (const key of Object.keys(given)) {
      if (!(key in spec.props)) throw new Error(node.type + ': unknown prop "' + key + '"');
    }

    for (const [key, rule] of Object.entries(spec.props)) {
      const optional = rule && rule.optional === true;
      const fn = optional ? rule.type : rule;
      if (!(key in given)) {
        if (optional) continue;
        throw new Error(node.type + ': missing required prop "' + key + '"');
      }
      try { out.props[key] = fn(given[key]); }
      catch (e) { throw new Error(node.type + '.' + key + ': ' + e.message); }
    }

    if (node.children) {
      if (!spec.children) throw new Error(node.type + ' does not accept children');
      if (!Array.isArray(node.children)) throw new Error('children must be an array');
      if (node.children.length > 64) throw new Error('too many children (max 64)');
      out.children = node.children.map((c) => validate(c, depth + 1));
    }
    return out;
  }

  global.StarshipCatalog = { CATALOG, validate };
})(window);
