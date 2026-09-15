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
    // A shelf tile writes its dots' phase and its lean as custom properties;
    // the yard draws nothing, so they go nowhere.
    style: { setProperty: noop, removeProperty: noop, getPropertyValue: () => '' }, dataset: {}, children: [], hidden: false,
    width: 300, height: 150, offsetWidth: 0, offsetHeight: 0,
    classList: { add: noop, remove: noop, toggle: noop, contains: () => false },
    getContext: () => ctx2d(),
    appendChild: c => { el.children.push(c); return c; },
    // A shelf tile puts its drawing in with this (`wearGlyph`).
    replaceChildren: (...c) => { el.children = c; },
    removeChild: noop, addEventListener: noop, removeEventListener: noop,
    setAttribute: noop, getAttribute: () => null,
    getBoundingClientRect: () => ({ x: 0, y: 0, width: 0, height: 0, top: 0, left: 0, right: 0, bottom: 0 }),
    className: '',
    // Nothing here is nested -- the children this makes are flat -- so nothing
    // has an ancestor to find. It answers the question rather than not having
    // the method, which is the difference between a check that runs and a check
    // that dies on the way in.
    closest: () => null,
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
    }
  };
  // Emptying an element empties it. `el.textContent = ''` is how every board in
  // this game throws its rows away before building new ones, and here it was a
  // plain property that set a string and left the children where they were --
  // so a board rebuilt twice had two boards' worth of rows in it, and a check
  // asking what was drawn could never see a row *leave*. The words themselves
  // are kept as they were written rather than gathered from the children: what
  // reads `textContent` back is a cell that wrote one, and it wants its own.
  let text = '';
  Object.defineProperty(el, 'textContent', {
    get: () => text,
    set: v => { text = String(v); el.children = []; }
  });
  // A row on a board is written as one string of markup and then filled in cell
  // by cell -- `row.querySelector('.cost').textContent = price`. So what this has
  // to do with markup is make an element per tag and remember what each one was
  // called.
  //
  // Nested the way the markup nests, rather than laid out flat. Flat was enough
  // for as long as every cell was found by class, and it stopped being enough
  // the day the pips moved *inside* the name: `refresh` reads the two halves of
  // that cell off `name.firstElementChild` and `.lastElementChild`, and with
  // every tag a child of the row those two were the wrong elements -- so
  // filling a board in node threw, and the one tier that can afford to do it
  // sixty times could not read a single word off a row.
  let html = '';
  Object.defineProperty(el, 'innerHTML', {
    get: () => html,
    set: v => {
      html = String(v);
      el.children = [];
      const stack = [el];
      for (const [, close, tag, attrs] of html.matchAll(/<(\/?)([a-zA-Z]+)([^>]*)>/g)) {
        if (close) { if (stack.length > 1) stack.pop(); continue; }
        const kid = element(tag);
        kid.className = (attrs.match(/class="([^"]*)"/) || [, ''])[1];
        stack[stack.length - 1].children.push(kid);
        // A tag that closes itself has no children and nothing to pop it.
        if (!/\/>\s*$/.test(attrs + '>')) stack.push(kid);
      }
    }
  });
  // The first and last of an element's own children, which is how a row finds
  // the two halves of a cell it wrote as one string of markup.
  Object.defineProperties(el, {
    firstElementChild: { get: () => el.children[0] || null },
    lastElementChild: { get: () => el.children[el.children.length - 1] || null }
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
  clear: () => store.clear(),
  // the two the real one has for walking every key, which is how the sheet
  // measures how full the origin is (save.js, `storeTrouble`)
  key: i => [...store.keys()][i] ?? null,
  get length() { return store.size; }
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
  // The seat measures the sheet through this now (feedback7, items 2 and 3);
  // here there is no layout, so every property reads empty and the callers'
  // own `|| 0` fallbacks do the rest.
  globalThis.getComputedStyle = () => ({ columnGap: '', getPropertyValue: () => '' });
  globalThis.requestAnimationFrame = cb => setTimeout(() => cb(performance.now()), 0);
  globalThis.cancelAnimationFrame = clearTimeout;
  // settings.js watches the held sheet's `hidden` through one of these at
  // module top; here nothing ever hides or shows, so an observer that never
  // fires is the whole of it. input.js imports settings.js, and every yard
  // check imports input.js, so without this none of them load.
  globalThis.MutationObserver = class { observe() {} disconnect() {} takeRecords() { return []; } };
  globalThis.window = globalThis;
  globalThis.addEventListener = noop;
  globalThis.removeEventListener = noop;
  return { document, localStorage };
}
