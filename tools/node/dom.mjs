// Enough of a browser for the game to run in node.
//
// The yard needs four things from a page and no more: an element to call a
// canvas, a scratch canvas for the sand painters, somewhere to keep a save, and
// a window with a size. None of them are drawn on in a check that never draws --
// the painters mark what changed and nobody ever asks them to paint it -- so
// every drawing call here is a shrug, and the ones that have to return something
// return the smallest thing that is not a lie.
//
// This is deliberately not jsdom. jsdom is a document model, and what is missing
// here is not a document model: it is a canvas, which jsdom does not have
// either. Fifty lines that say no to everything is a smaller thing to trust.

const noop = () => {};

function ctx2d() {
  return new Proxy({
    canvas: null,
    createImageData: (w, h) => ({ width: w, height: h, data: new Uint8ClampedArray(w * h * 4) }),
    getImageData: (x, y, w, h) => ({ width: w, height: h, data: new Uint8ClampedArray(w * h * 4) }),
    measureText: t => ({ width: String(t).length * 6 }),
    setTransform: noop, getContext: noop
  }, {
    // Anything else a drawing routine reaches for is a no-op that returns
    // nothing, and any property it reads is nothing. A check that draws is a
    // check for the browser tier; this is here so that a module which draws can
    // be *loaded* without one.
    get: (t, k) => k in t ? t[k] : noop,
    set: (t, k, v) => { t[k] = v; return true; }
  });
}

function element(tag = 'div') {
  const el = {
    tagName: String(tag).toUpperCase(),
    style: {}, dataset: {}, children: [], hidden: false,
    width: 300, height: 150, offsetWidth: 0, offsetHeight: 0,
    classList: { add: noop, remove: noop, toggle: noop, contains: () => false },
    getContext: () => ctx2d(),
    appendChild: c => { el.children.push(c); return c; },
    removeChild: noop, addEventListener: noop, removeEventListener: noop,
    setAttribute: noop, getAttribute: () => null,
    getBoundingClientRect: () => ({ x: 0, y: 0, width: 0, height: 0, top: 0, left: 0, right: 0, bottom: 0 }),
    className: '',
    // Enough of a selector engine for `.cls`, which is how a row finds the cell
    // it wants to fill in. Rows used to be addressed by position -- children[2]
    // -- which meant wrapping two cells in a third renumbered every one of them.
    querySelector: sel => el.querySelectorAll(sel)[0] || null,
    querySelectorAll: sel => {
      const want = String(sel).replace(/^\./, '');
      const out = [];
      const walk = e => {
        for (const c of e.children) {
          if (String(c.className).split(/\s+/).includes(want)) out.push(c);
          walk(c);
        }
      };
      walk(el);
      return out;
    },
    textContent: ''
  };
  // A row on a board is written as one string of markup and then filled in cell
  // by cell -- `row.querySelector('.cost').textContent = price`. So what this has
  // to do with markup is make a child per opening tag and remember what each one
  // was called, which is all a row ever asks it. The children come out flat
  // whatever the nesting said, and nothing minds: a row looks its cells up by
  // name, and nothing in a check that never draws is looking at the shape.
  let html = '';
  Object.defineProperty(el, 'innerHTML', {
    get: () => html,
    set: v => {
      html = String(v);
      el.children = [...html.matchAll(/<([a-zA-Z]+)([^>]*)>/g)].map(([, tag, attrs]) => {
        const kid = element(tag);
        kid.className = (attrs.match(/class="([^"]*)"/) || [, ''])[1];
        return kid;
      });
    }
  });
  return el;
}

// One element per id, kept, because the game holds on to what it is given: ask
// twice for the canvas and it has to be the same canvas both times.
const byId = new Map();

const store = new Map();
const localStorage = {
  getItem: k => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: k => store.delete(k),
  clear: () => store.clear()
};

export function installDom({ W = 800, H = 600, dpr = 1 } = {}) {
  const document = {
    getElementById: id => {
      if (!byId.has(id)) byId.set(id, element());
      return byId.get(id);
    },
    createElement: tag => element(tag),
    querySelector: () => null,
    querySelectorAll: () => [],
    documentElement: { clientWidth: W, clientHeight: H, style: {} },
    body: element('body'),
    addEventListener: noop, removeEventListener: noop
  };

  globalThis.document = document;
  globalThis.localStorage = localStorage;
  globalThis.innerWidth = W;
  globalThis.innerHeight = H;
  globalThis.devicePixelRatio = dpr;
  globalThis.requestAnimationFrame = cb => setTimeout(() => cb(performance.now()), 0);
  globalThis.cancelAnimationFrame = clearTimeout;
  globalThis.window = globalThis;
  globalThis.addEventListener = noop;
  globalThis.removeEventListener = noop;
  return { document, localStorage };
}
