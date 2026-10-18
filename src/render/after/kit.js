// What every drawing up in the afterlife shares (render/after/*.js): a frame
// that lays cells off a station's own ground, the way the voted mocks draw
// them (docs/mocks/act3-stations-2026-10-18), so a mock's numbers carry over
// as they are; the counted piles and their fades; and the counts, gathered
// in the world pass and written in screen pixels after it.
//
// A frame's cells are (x, y) with x across from the station's left and y up
// from the floor line: row -1 is the bottom row standing on the floor, the
// mocks' `G - 1`. A flipped frame is turned about its own ground's width, so
// a drawing faces the other way without a second copy of it.

import { P, GREY, AFTER_PILE_FADE_S } from '../../config.js';
import { S } from '../../state.js';
import { ctx } from '../ctx.js';

export const K = 10, W = 0;            // ink and paper, rungs of GREY
export const clamp01 = v => Math.max(0, Math.min(1, v));
// A fixed number in [0, 1) for a cell or a seed: tones pick off it, so they
// hold still frame to frame.
export const hash = n => { const v = Math.sin(n * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };
// The materials' greys (the mocks'): sawdust, pulp, soil.
export const DUST = [3, 4, 5, 4, 6];
export const PULP = [3, 3, 4];
export const SOIL = [5, 6, 7, 6];
export const toneOf = (pal, x, y, seed = 0) => pal[Math.floor(hash(x * 13.1 + y * 7.7 + seed) * pal.length)];
export const now = () => (S.after ? S.after.t : 0);
export const inView = (x, w) => x + w >= S.camX && x <= S.camX + S.viewW;

// With `sink`, the frame paints nothing and hands every rect, in its own
// unturned px, to sink(x, y, w, h) instead: how a drawing's silhouette is
// read off the drawing itself (`silhouette`).
export function frame(ox, oy, flip = 0, sink = null) {
  const X = (x, w) => (flip ? ox + flip * P - x - w : ox + x);
  const d = {
    ox, oy,
    // local px: a rect, whole pixels
    px(x, y, w, h, tone) {
      if (sink) { sink(x, y, w, h); return; }
      ctx.fillStyle = GREY[tone];
      ctx.fillRect(Math.round(X(x, w)), Math.round(oy + y), Math.round(w), Math.round(h));
    },
    r(x, y, w, h, tone = K) { d.px(x * P, y * P, w * P, h * P, tone); },
    c(x, y, tone = K) { d.r(x, y, 1, 1, tone); },
    // cell rows, '#' ink and a digit its grey
    spr(rows, x, y) {
      rows.forEach((row, j) => [...row].forEach((ch, i) => {
        if (ch === '#') d.c(x + i, y + j, K); else if (ch >= '0' && ch <= '9') d.c(x + i, y + j, +ch);
      }));
    },
    // a line `w` px thick between two points in cells, laid on whole pixels
    line(x0, y0, x1, y1, w = 2, tone = K, centered = true) {
      const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0) * P), o = centered ? w / 2 : 0;
      for (let i = 0; i <= n; i++) {
        const f = n ? i / n : 0;
        d.px(Math.round((x0 + (x1 - x0) * f) * P - o), Math.round((y0 + (y1 - y0) * f) * P - o), w, w, tone);
      }
    },
    fade(a, fn) { if (sink) { fn(); return; } const was = ctx.globalAlpha; ctx.globalAlpha = was * clamp01(a); fn(); ctx.globalAlpha = was; },
    // a body: the mocks' 18 px square, a black rim 2 px round a white middle;
    // squat, two rows high with its feet where they were
    body(x, y, dxpx = 0, dypx = 0, squat = false) {
      const bx = x * P + dxpx, by = y * P + dypx + (squat ? P : 0), h = squat ? 12 : 18;
      d.px(bx, by, 18, h, K); d.px(bx + 2, by + 2, 14, h - 4, W);
    },
    world: (x, y) => ({ x: X(x * P, 0), y: oy + y * P })
  };
  return d;
}

// --- backings ------------------------------------------------------------------------
// A drawing's paper silhouette: every cell it inks, each row filled from its
// first inked cell to its last, so what stands behind it (the camp's own
// crowd) is masked through its open parts -- inside a wheel, under a roof,
// in a jaw -- the way a solid thing would hide it. Read off the drawing by
// running it through a sinking frame, `draw(d)`, so a station redrawn is a
// backing redrawn and none is cut by hand. Rows as [row, from, to] in the
// frame's cells, from and to inclusive.
export function silhouette(draw) {
  const rows = new Map();
  const d = frame(0, 0, 0, (x, y, w, h) => {
    if (w <= 0 || h <= 0) return;
    for (let r = Math.floor(y / P); r < Math.ceil((y + h) / P); r++) {
      const a = Math.floor(x / P), b = Math.ceil((x + w) / P) - 1, s = rows.get(r);
      rows.set(r, s ? [Math.min(s[0], a), Math.max(s[1], b)] : [a, b]);
    }
  });
  draw(d);
  return [...rows].map(([r, [a, b]]) => [r, a, b]);
}
// The silhouette laid in paper on a frame (turned with it).
export const backing = (d, rows) => { for (const [r, a, b] of rows) d.r(a, r, b - a + 1, 1, W); };

// --- piles ---------------------------------------------------------------------------
// What each pile showed last, and since when: a thing coming on or going off
// fades over AFTER_PILE_FADE_S rather than popping. Drawing state only.
const seen = new Map();
export function pileState(key, n) {
  const t = now();
  let s = seen.get(key);
  if (!s || t < s.at) { s = { n, prev: n, at: -1e9 }; seen.set(key, s); }
  if (n !== s.n) { s.prev = s.n; s.n = n; s.at = t; }
  return { n, prev: s.prev, since: t - s.at };
}
export function pileAlpha(i, st) {
  const f = clamp01(st.since / AFTER_PILE_FADE_S);
  if (i < Math.min(st.n, st.prev)) return 1;
  return st.n > st.prev ? f : 1 - f;
}

// --- counts --------------------------------------------------------------------------
// Each pile's count, where it hangs in the world, written in screen pixels
// once the world is drawn (render/after.js, `drawAfterCounts`) so its digits
// stay sharp, like the yard's.
let counts = [];
export const clearCounts = () => { counts = []; };
export const countAt = (x, y, n) => { counts.push({ x, y, n: Math.round(n) }); };
export const pendingCounts = () => counts;
