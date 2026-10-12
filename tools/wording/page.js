// Injected into every page the wording shots visit (tools/wording-shots.mjs):
// find the element that says an inventory string, outline it, and say where
// it is. Plain script, no imports: it is sent as the text of an evaluate.
(() => {
  if (window.__wq) return;
  const css = document.createElement('style');
  css.textContent = '.wq-hl{outline:2px solid #a020f0 !important;outline-offset:2px !important;}' +
    '.wq-box{position:fixed;border:2px solid #a020f0;pointer-events:none;z-index:2147483647;}';
  document.head.append(css);

  const ents = s => s.replace(/&middot;/g, '·').replace(/&larr;/g, '←').replace(/&rarr;/g, '→')
    .replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/&#10005;/g, '✕');
  const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // An inventory string as a pattern: a `${...}` slot is anything, a tag is
  // anything (a <br> is nothing, a filled <span> is its contents), and a run of
  // spaces is any space or none (a <br> leaves none in textContent).
  function srcOf(text) {
    return ents(text).split(/(\$\{[^}]*\}|<[^>]*>)/).map(p => {
      if (!p) return '';
      if (p.startsWith('${') || p.startsWith('<')) return '.*?';
      return p.split(/\s+/).map(esc).join('\\s*');
    }).join('');
  }
  const literalLen = text => ents(text).replace(/\$\{[^}]*\}|<[^>]*>/g, '').trim().length;

  // On screen, and not clipped away by a scroller: the part of its box that
  // is, or null.
  function shown(el) {
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) return null;
    let x0 = r.left, y0 = r.top, x1 = r.right, y1 = r.bottom;
    for (let a = el; a && a !== document.documentElement; a = a.parentElement) {
      const cs = getComputedStyle(a);
      if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity < 0.05) return null;
      if (a !== el && /(auto|scroll|hidden|clip)/.test(cs.overflowX + cs.overflowY)) {
        const q = a.getBoundingClientRect();
        x0 = Math.max(x0, q.left); y0 = Math.max(y0, q.top); x1 = Math.min(x1, q.right); y1 = Math.min(y1, q.bottom);
      }
    }
    x0 = Math.max(x0, 0); y0 = Math.max(y0, 0); x1 = Math.min(x1, innerWidth); y1 = Math.min(y1, innerHeight);
    if (x1 - x0 < 2 || y1 - y0 < 2) return null;
    return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
  }
  const SKIP = new Set(['SCRIPT', 'STYLE', 'HEAD', 'TITLE', 'HTML', 'BODY', 'svg', 'rect', 'path']);
  const all = () => [...document.body.querySelectorAll('*')].filter(e => !SKIP.has(e.tagName) && !e.classList.contains('wq-box'));
  const norm = e => e.textContent.replace(/\s+/g, ' ').trim();
  // The deepest elements whose text the pattern matches, shown ones only.
  function byText(re) {
    const hits = all().filter(e => re.test(norm(e)));
    const deepest = hits.filter(e => !hits.some(o => o !== e && e.contains(o)));
    return deepest.map(e => [e, shown(e)]).filter(([, r]) => r);
  }
  function byAttr(re) {
    const out = [];
    for (const e of all()) for (const a of ['placeholder', 'aria-label', 'title']) {
      const v = e.getAttribute(a);
      if (v && re.test(v.trim())) { const r = shown(e); if (r) out.push([e, r, a]); }
    }
    return out;
  }

  // specs: [{ id, text, re? }]. Answers by id: how it was found and where.
  function mark(specs) {
    const out = {};
    for (const s of specs) {
      const src = s.re || srcOf(s.text);
      let hits = byText(new RegExp('^' + src + '$', 'i')), how = 'text';
      if (!hits.length && !s.exact && literalLen(s.text) >= 6) { hits = byText(new RegExp(src, 'i')); how = 'text (part)'; }
      if (!hits.length) { hits = byAttr(new RegExp('^' + src + '$', 'i')); how = hits.length ? 'attr:' + hits[0][2] : null; }
      if (!hits.length) { out[s.id] = { found: false }; continue; }
      for (const [e] of hits) e.classList.add('wq-hl');
      out[s.id] = { found: true, how, rect: hits[0][1], n: hits.length };
    }
    return out;
  }
  // A box drawn round a rect, for text that is not an element (the canvas).
  function box(r) {
    const d = document.createElement('div');
    d.className = 'wq-box';
    Object.assign(d.style, { left: r.x - 3 + 'px', top: r.y - 3 + 'px', width: r.w + 2 + 'px', height: r.h + 2 + 'px' });
    document.body.append(d);
  }
  function clear() {
    for (const e of document.querySelectorAll('.wq-hl')) e.classList.remove('wq-hl');
    for (const e of document.querySelectorAll('.wq-box')) e.remove();
  }
  const rectOf = sel => { const e = document.querySelector(sel); return e ? shown(e) || (r => ({ x: r.left, y: r.top, w: r.width, h: r.height }))(e.getBoundingClientRect()) : null; };
  const frames = (n = 2) => new Promise(r => { const f = k => (k ? requestAnimationFrame(() => f(k - 1)) : r(1)); f(n); });
  const until = async (fn, ms = 3000) => { const t = performance.now(); while (performance.now() - t < ms) { try { if (fn()) return true; } catch {} await new Promise(r => setTimeout(r, 30)); } return false; };
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const btn = (text, root = document) => [...root.querySelectorAll('button')].find(b => b.textContent.trim() === text && b.offsetParent);
  window.__wq = { mark, clear, box, rectOf, frames, until, sleep, btn, srcOf };
})();
