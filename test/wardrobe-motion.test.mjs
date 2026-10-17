// How what the two of them wear moves (render/wardrobe.js, the owner's vote on
// docs/mocks/wardrobe-polish-2026-10-16): a dangle lags one held pose as the
// body sets off and settles over held poses as it stops -- catching up, one
// past rest, back -- before it rests; and a dressed body is drawn rigid, its
// corner on a whole device pixel, so its marks keep one shape as it walks.
//
// Walked the way the yard walks a body: a world pixel at a time, read off
// where it is drawn frame to frame (`motionOf`), drawn on a sheet that keeps
// every fill.
import { group, ok } from './helpers.mjs';
import { WORKER, WARD_STILL_S, WARD_SETTLE_S, WARD_SETTLE_POSES } from '../src/config.js';
import { motionOf, dressBehind, dressHead, YARD_INKS } from '../src/render/wardrobe.js';
import { drawBody } from '../src/render/crew.js';
import { paintOn } from '../src/render/ctx.js';

const BARE = { head: 'none', face: 'none', neck: 'none', back: 'none', pattern: 'plain', aura: 'none' };
const DT = 1 / 60, SPEED = 36;

// A sheet `k` device pixels a world pixel, offset `e`, keeping every fill in
// device pixels.
function sheet(k = 1, e = 0) {
  let tx = 0, ty = 0;
  const fills = [];
  const g = {
    fillStyle: '#000', globalAlpha: 1, imageSmoothingEnabled: false, globalCompositeOperation: 'source-over',
    getTransform: () => ({ a: k, b: 0, c: 0, d: k, e: e + tx * k, f: ty * k }),
    translate: (x, y) => { tx += x; ty += y; },
    save() {}, restore() {}, beginPath() {}, rect() {}, clip() {}, moveTo() {}, lineTo() {}, fill() {},
    fillRect(x, y, w, h) { fills.push([(x + tx) * k + e, (y + ty) * k, w * k, h * k, this.fillStyle]); },
  };
  return { g, fills };
}

// What one piece draws for a look, as a string to compare poses by.
function shapeOf(outfit, l) {
  const { g, fills } = sheet();
  const look = { outfit: { ...BARE, ...outfit }, inks: YARD_INKS, back: true, aura: false, ...l };
  dressBehind(g, 0, 0, look);
  dressHead(g, 0, 0, look);
  return JSON.stringify(fills);
}

// A walk of `walk` seconds then a stand of `stand`, a frame each: the shape
// drawn, and the shape a body long at rest would draw at the same moment.
function walkThenStand(outfit, walk = 1, stand = 1.5, t0 = 10) {
  const key = {}, out = [];
  let x = 100, lastStep = null, firstStep = null;
  for (let f = 0; f * DT < walk + stand; f++) {
    const s = f * DT, t = t0 + s;
    if (s < walk) {
      const nx = 100 + Math.floor(SPEED * s);
      if (nx !== x) { x = nx; lastStep = t; firstStep ??= t; }
    }
    const m = motionOf(key, x, t);
    out.push({ t, moving: m.moving, since: m.since,
               drawn: shapeOf(outfit, { dir: m.dir, moving: m.moving, since: m.since, t }),
               rest: shapeOf(outfit, { dir: m.dir, moving: false, since: 99, t }) });
  }
  return { out, lastStep, firstStep };
}

// The runs of one shape in a list of frames: [shape, from, to].
function runs(frames) {
  const r = [];
  for (const fr of frames) {
    if (r.length && r[r.length - 1][0] === fr.drawn) r[r.length - 1][2] = fr.t;
    else r.push([fr.drawn, fr.t, fr.t]);
  }
  return r;
}

const DANGLES = {
  cape: { back: 'cape' }, 'short cape': { back: 'short-cape' }, 'gold cape': { back: 'gold-cape' },
  balloon: { back: 'balloon' }, flag: { back: 'flag' }, 'striped scarf': { neck: 'striped-scarf' },
  bow: { head: 'bow' }, headband: { head: 'headband' }, mortarboard: { head: 'mortarboard' },
  bird: { head: 'bird' }, antenna: { head: 'antenna' }, flower: { head: 'flower' },
};
const STIFF = new Set(['bird', 'antenna', 'flower']);
// The weights: one more bounce as the body stops, not a swing.
const BOUNCE = { moneybag: { back: 'moneybag' }, backpack: { back: 'backpack' } };

group('a dangle settles as the body stops: three held poses over the settle, swinging past rest, then rest', async () => {
  const checks = [];
  for (const [name, outfit] of Object.entries(DANGLES)) {
    // the bird's hop comes round every few seconds: the stop is put clear of it
    const { out, lastStep } = walkThenStand(outfit, 1, 1.5, 11);
    const still = lastStep + WARD_STILL_S, settled = still + WARD_SETTLE_S * WARD_SETTLE_POSES;
    const settle = out.filter(f => f.t >= still + 1e-9 && f.t < settled - 1e-9);
    const after = out.filter(f => f.t >= settled + 1e-9);
    const held = runs(settle);
    const longest = Math.max(...held.map(([, a, b]) => b - a + DT));
    checks.push(
      ok(held.length === WARD_SETTLE_POSES && held.every(([, a, b]) => b - a + DT >= WARD_SETTLE_S - 2 * DT),
         `${name}: the stop is ${WARD_SETTLE_POSES} held poses of ${WARD_SETTLE_S} s`,
         held.map(([, a, b]) => (b - a + DT).toFixed(3)).join(', ') + ` (longest ${longest.toFixed(3)})`),
      // the stiff ones (a stalk, a bird) catch up to rest itself: one of
      // their three is rest, the swing past and back are not
      ok(held.filter(([s]) => !settle.some(f => f.drawn === s && f.drawn === f.rest)).length >= (STIFF.has(name) ? 2 : 3),
         `${name}: the settle's poses are off rest${STIFF.has(name) ? ' but the catch-up' : ''}`,
         `${settle.filter(f => f.drawn === f.rest).length} of ${settle.length} frames at rest`),
      ok(after.length > 30 && after.every(f => f.drawn === f.rest), `${name}: after the settle it rests`,
         `${after.filter(f => f.drawn !== f.rest).length} of ${after.length} frames not at rest`),
    );
  }
  for (const [name, outfit] of Object.entries(BOUNCE)) {
    const { out, lastStep } = walkThenStand(outfit, 1, 1.5, 11);
    const still = lastStep + WARD_STILL_S, settled = still + WARD_SETTLE_S * WARD_SETTLE_POSES;
    const settle = out.filter(f => f.t >= still + 1e-9 && f.t < settled - 1e-9);
    const after = out.filter(f => f.t >= settled + 1e-9);
    const off = settle.filter(f => f.drawn !== f.rest).length * DT;
    checks.push(ok(Math.abs(off - WARD_SETTLE_S) < 2.5 * DT && after.every(f => f.drawn === f.rest),
                   `${name}: one more bounce of ${WARD_SETTLE_S} s as the body stops, then it rests`,
                   `${off.toFixed(3)} s off rest in the settle, ${after.filter(f => f.drawn !== f.rest).length} frames off after`));
  }
  return checks;
});

group('a dangle lags one held pose as the body sets off, then walks', async () => {
  const checks = [];
  for (const [name, outfit] of Object.entries({ cape: DANGLES.cape, balloon: DANGLES.balloon, flag: DANGLES.flag,
                                                 scarf: DANGLES['striped scarf'], headband: DANGLES.headband })) {
    const { out, firstStep } = walkThenStand(outfit, 1, 0.2, 21);
    const start = out.filter(f => f.t >= firstStep && f.t < firstStep + WARD_SETTLE_S - 1e-9);
    const walking = out.filter(f => f.t >= firstStep + WARD_SETTLE_S + 1e-9 && f.t < firstStep + 0.9);
    checks.push(
      ok(start.length >= 6 && new Set(start.map(f => f.drawn)).size === 1 && start[0].drawn !== start[0].rest,
         `${name}: the start is one held pose, not the rest pose`, `${start.length} frames, ${new Set(start.map(f => f.drawn)).size} poses`),
      ok(walking.every(f => f.drawn !== start[0].drawn), `${name}: the walk's poses are not the start's`,
         `${walking.filter(f => f.drawn === start[0].drawn).length} walking frames in the start pose`),
    );
  }
  return checks;
});

group('a dressed body is drawn rigid: its marks keep one shape as it walks at a zoom that is not whole', async () => {
  const k = 1.25, e = 0.4, look = { outfit: { ...BARE, face: 'glasses', pattern: 'dots', neck: 'striped-scarf', back: 'cape', head: 'bow' },
                                     inks: YARD_INKS, dir: 1, moving: false, since: 99, t: 5, back: true, aura: false };
  const shapes = new Set(), corners = [];
  for (let i = 0; i < 12; i++) {
    const x = 50 + i, { g, fills } = sheet(k, e);
    paintOn({ getContext: () => g }, () => drawBody(x, 40, look));
    // the square: the first fill a whole body wide
    const sq = fills.find(f => Math.abs(f[2] - WORKER * k) < 1.01 && Math.abs(f[3] - WORKER * k) < 1.01 && f[4] === '#000');
    corners.push(sq ? sq[0] : NaN);
    shapes.add(JSON.stringify(fills.map(([fx, fy, w, h, c]) => [+(fx - sq[0]).toFixed(3), +(fy - sq[1]).toFixed(3), +w.toFixed(3), +h.toFixed(3), c])));
  }
  return [
    ok(corners.every(c => Math.abs(c - Math.round(c)) < 1e-6), 'the body\'s corner is on a whole device pixel', corners.join(', ')),
    ok(shapes.size === 1, 'everything it wears is the one shape off its corner at every step', `${shapes.size} shapes over 12 steps`),
  ];
});
