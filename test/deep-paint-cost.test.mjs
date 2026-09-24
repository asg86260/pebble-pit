// What the deep costs to draw, as counts rather than a stopwatch.
//
// The deep ran at a fraction of the yard's frame rate on a large window, and
// two passes were the frame: the water, painted a cell at a time over the
// whole window, and the serpent's coil, a cell at a time down its length.
// Neither is something a millisecond reading here could hold still -- on
// this machine, with other agents running, the same frame reads twice as
// long one run as the next -- so, as in paint-cost.test.mjs, the checks say
// how much work a frame does and pair it with the check that the work still
// comes out right.
//
//   the water   Both of its waves are a column's part plus a row's (the drags
//               each ride on one of the two), so their sines are taken a
//               column and a row at a time, and a cell takes one only if it
//               is a star. It took two a cell, which on a large window was
//               over a hundred thousand a frame.
//   the coil    Every cell near the body asks how far it is from each sample
//               of the centerline near it -- a hundred thousand lengths a
//               frame -- and `Math.hypot`, which guards against an overflow
//               none of these lengths come near, cost several times a square
//               root. It was most of what the coil cost.

import { group, ok, yard } from './helpers.mjs';
import { P, ABYSS_STAR_EVERY } from '../src/config.js';
import { inkOf } from '../src/ink.js';

const { paintAbyssField, abyssRung } = await import('../src/render/abyssfield.js');
const { drawSerpent } = await import('../src/render/serpent.js');
const S = yard.S;

// The glass the field is painted on: the image the painter makes on its first
// call, caught on the way past (the shim hands out a fresh context a call).
let glass = null;
function paint(args) {
  const make = document.createElement;
  document.createElement = tag => {
    const el = make(tag), g = el.getContext('2d'), image = g.createImageData;
    el.getContext = () => g;
    g.createImageData = (w, h) => (glass = image(w, h));
    return el;
  };
  try { paintAbyssField(args); } finally { document.createElement = make; }
}

// Counted calls to one of Math's functions, over `fn`.
function counting(name, fn) {
  const real = Math[name];
  let n = 0;
  Math[name] = (...a) => { n++; return real(...a); };
  try { fn(); } finally { Math[name] = real; }
  return n;
}

const ramp = tint => Array.from({ length: 12 }, (_, i) =>
  '#' + [i * 20, i * 20 + tint, i * 20].map(v => v.toString(16).padStart(2, '0')).join(''));
const TONES = ramp(0), MAGIC = ramp(7);
const rgb = c => { const h = inkOf(c).slice(1); return [0, 2, 4].map(k => parseInt(h.slice(k, k + 2), 16)); };

// A window of water the size of a large screen's, in the pit (no shift, no
// lift) and in the deep (shifted under the pit's surface, lifted in).
const COLS = 320, ROWS = 180;
const WINDOWS = [
  { from: 600, top: 900, line: 600, rowShift: 0, deep: 0 },
  { from: -1200, top: 7800, line: 600, rowShift: 1500, deep: 0.6 }
];
const args = (w, t) => ({ ...w, to: w.from + COLS * P, bottom: w.top + ROWS * P, tones: TONES, magic: MAGIC, t });

group('the water takes its sines a row and a column at a time, and one a star', () => {
  const checks = [];
  for (const w of WINDOWS) {
    const sines = counting('sin', () => paint(args(w, 43210)));
    // Four a column and six a row for the waves and the drags, and one for
    // each cell whose hash could seat a star: at most four in every
    // ABYSS_STAR_EVERY, in the thickest patches.
    const most = 4 * COLS + 6 * ROWS + Math.ceil(COLS * ROWS * 4 / ABYSS_STAR_EVERY);
    checks.push(ok(sines <= most, `a ${COLS} by ${ROWS} window takes at most ${most} sines`,
                   `took ${sines}, rowShift ${w.rowShift}`));
  }
  return checks;
});

group('the water painted a window at a time is the field read a cell at a time', () => {
  const checks = [];
  for (const w of WINDOWS) for (const t of [1000, 777777, 5e6]) {
    paint(args(w, t));
    let wrong = 0, lit = 0, first = '';
    for (let j = 0; j < ROWS; j++) for (let i = 0; i < COLS; i++) {
      const x = w.from + i * P, y = w.top + j * P;
      const r = abyssRung(x, y + w.rowShift, { line: w.line, t, rampLen: TONES.length, magicLen: MAGIC.length, deep: w.deep });
      const k = (j * COLS + i) * 4, d = glass.data;
      const want = r > 0 ? rgb(TONES[r]) : r < 0 ? rgb(MAGIC[-r]) : null;
      if (want) lit++;
      const same = want ? d[k + 3] === 255 && d[k] === want[0] && d[k + 1] === want[1] && d[k + 2] === want[2]
                        : d[k + 3] === 0;
      if (!same && !wrong++) first = `cell ${i},${j}`;
    }
    checks.push(ok(lit > COLS * ROWS / 50, `there is water to see at t ${t}`, `${lit} lit`));
    checks.push(ok(wrong === 0, `every cell is the field's at t ${t}, rowShift ${w.rowShift}`,
                   `${wrong} differ, the first ${first}`));
  }
  return checks;
});

group('the coil is laid and drawn without Math.hypot', () => {
  window.__snatch({ played: true });
  window.__serpent({ stage: 0, wound: 0 });
  window.__view('deep');
  yard.fast(1);
  // The whole deep on the glass, as on the largest window it is framed in.
  S.viewW = 3200; S.viewH = 1200;
  let sqrts = 0;
  const hypots = counting('hypot', () => { sqrts = counting('sqrt', () => drawSerpent()); });
  return [
    ok(sqrts > 1000, 'the coil was drawn', `${sqrts} lengths taken`),
    ok(hypots === 0, 'no length on the way was a Math.hypot', `${hypots} were`)
  ];
});
