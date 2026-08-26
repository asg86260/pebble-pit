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
    querySelector: () => null, querySelectorAll: () => [],
    textContent: ''
  };
  // A row on a board is written as one string of markup and then filled in cell
  // by cell -- `row.children[2].textContent = price`. So the one thing this has
  // to do with markup is say how many children it made: a child per opening tag,
  // each of them another element that says no to everything. Nothing reads them
  // back, because nothing in a check that never draws is looking at a board.
  let html = '';
  Object.defineProperty(el, 'innerHTML', {
    get: () => html,
    set: v => {
      html = String(v);
      el.children = (html.match(/<[a-zA-Z]/g) || []).map(() => element('span'));
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
