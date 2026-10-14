// The deep's water and its floor cover everything the window shows of
// the deep, at any window (DESIGN.md, "The deep's zones"). The deep's zoom
// tops out at the yard's, so a tall window reaches as far over the deep's
// ceiling as it is tall, and a window wider than the deep is held at its left
// end and shows past its right one; the tint stopped sixty rows over the
// ceiling and at the deep's own ends, a hard edge across the water on a tall
// screen. Read off what the layers actually draw: the rect each fills or
// hands `drawImage`, against the camera's.

import { group, ok, SEED, yard } from './helpers.mjs';

const S = yard.S;
const { drawDeepZones } = await import('../src/render/fauna.js');
const { drawDeepFloor, deepWindow } = await import('../src/render/deep.js');
const { paintOn } = await import('../src/render/ctx.js');
const { killFrame } = await import('../src/view.js');
const { deepTop, deepFloor, deepX0, deepX1 } = await import('../src/deep/place.js');

const WINDOWS = {
  desk: { W: 1280, H: 800 },
  'tall (1600x2400)': { W: 1600, H: 2400 },
  'stood-up monitor (1080x1920)': { W: 1080, H: 1920 },
  'ultrawide (3440x1440)': { W: 3440, H: 1440 },
  'very tall (1200x4000)': { W: 1200, H: 4000 },
  phone: { W: 390, H: 844, coarse: true },
};

function windowOf(win) {
  document.documentElement.clientWidth = win.W;
  document.documentElement.clientHeight = win.H;
  globalThis.innerWidth = win.W;
  globalThis.innerHeight = win.H;
  window.__coarse(!!win.coarse);
  window.__seed(SEED);
}

// The rect a layer fills or draws its image to, caught on a sheet of its own.
function drawnBy(layer) {
  let rect = null;
  const g = { imageSmoothingEnabled: true, fillStyle: null,
              fillRect: (x, y, w, h) => { rect = { x, y, w, h }; },
              drawImage: (img, x, y, w = img.width, h = img.height) => { rect = { x, y, w, h }; } };
  paintOn({ getContext: () => g }, layer);
  return rect;
}

// What of the window lies short of `rect`, in world pixels each way.
function short(rect, win, bottom) {
  return {
    left: Math.max(0, rect.x - win.x0), right: Math.max(0, win.x1 - (rect.x + rect.w)),
    up: Math.max(0, rect.y - win.y0), down: Math.max(0, bottom - (rect.y + rect.h)),
  };
}
const covered = s => s.left + s.right + s.up + s.down === 0;
const say = (s, win) => `short ${JSON.stringify(s)} of the window ${win.x0}..${win.x1} x ${win.y0}..${win.y1}`;

for (const [name, win] of Object.entries(WINDOWS)) {
  group(`at a ${name} window, the water and the floor cover the whole of the deep on screen`, async () => {
    windowOf(win);
    window.__crew(3, 3, 5, 7);
    window.__snatch({ played: true });
    S.beatsDone.push('abyss');
    window.__view('deep');
    const checks = [];
    // The deep's own framing, then the camera at each end of it and lifted
    // to the ceiling (the finale's way up holds it there).
    const framings = [
      ['framed', () => {}],
      ['at the left end', () => window.__look(-1e6)],
      ['at the right end', () => window.__look(1e6)],
      ['lifted to the ceiling', () => killFrame(0, (deepX0() + deepX1()) / 2, deepTop())],
    ];
    for (const [where, frame] of framings) {
      frame();
      const w = deepWindow();
      const tint = drawnBy(drawDeepZones);
      const t = short(tint, w, Math.min(w.y1, deepFloor()));
      checks.push(ok(covered(t), `${where}, the water covers the deep on screen`, say(t, w)));
      const ground = drawnBy(drawDeepFloor);
      const g = short({ ...ground, y: deepFloor() }, w, deepFloor());
      checks.push(ok(g.left + g.right === 0, `${where}, the floor runs the window's width`, say(g, w)));
    }
    killFrame(0, 0);
    return checks;
  });
}
