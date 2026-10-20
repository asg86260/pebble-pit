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

import { P, GREY, AFTER_PILE_FADE_S, AFTER_TONES } from '../../config.js';
import { S } from '../../state.js';
import { ctx } from '../ctx.js';

// The act's four tones (config, AFTER_TONES), rungs of GREY: every cell up
// here is one of them.
export const { ink: K, paper: W, pale: PALE, mid: MID } = AFTER_TONES;
export const FOUR = [W, PALE, MID, K];
export const clamp01 = v => Math.max(0, Math.min(1, v));
// A held step of the four from tone a to tone b, f of the way: what a thing
// drying, thickening or fading in tone walks along instead of a grey between.
export const toward = (a, b, f) => { const i = FOUR.indexOf(a), j = FOUR.indexOf(b); return FOUR[Math.round(i + (j - i) * clamp01(f))]; };
// The one of the four nearest a rung of GREY, the lighter on a tie: for a
// tone that comes from outside the act (a yard grain paid up into it).
export const nearest = g => FOUR.reduce((a, b) => (Math.abs(b - g) < Math.abs(a - g) ? b : a));
// A fixed number in [0, 1) for a cell or a seed: tones pick off it, so they
// hold still frame to frame.
export const hash = n => { const v = Math.sin(n * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };
// The materials, a mix of the four a cell: sawdust pale flecked mid, soil
// mid with a pale crumb (never the ink, which up here is the masses: a
// pine, a station).
export const DUST = [PALE, MID, PALE, PALE, MID];
export const SOIL = [MID, MID, PALE, MID, MID, MID];
export const toneOf = (pal, x, y, seed = 0) => pal[Math.floor(hash(x * 13.1 + y * 7.7 + seed) * pal.length)];
export const now = () => (S.after ? S.after.t : 0);
export const inView = (x, w) => x + w >= S.camX && x <= S.camX + S.viewW;

// The yard's square, the one body drawing every body up here shares: a 2 px
// ink rim round a middle (paper as the yard draws a worker), `w` across and
// `h` high from its top left, laid by `fill(x, y, w, h, tone)` in whatever
// space the caller draws in. A worker, the pair, and God's crowd's souls are
// all this square.
export const RIM = 2;
export function square(fill, x, y, w, h = w, mid = W) {
  fill(x, y, w, h, K);
  fill(x + RIM, y + RIM, w - 2 * RIM, h - 2 * RIM, mid);
}

// With `sink`, the frame paints nothing and hands every rect, in its own
// unturned px, to sink(x, y, w, h) instead: how a drawing's silhouette is
// read off the drawing itself (`silhouette`). `s` is the drawing's grid cells
// a cell of its own (config/after.js, AFTER_ART_SCALE): every cell of it `s` grid cells
// across, so a drawing at twice its size stays on the grid. A body stood in
// it keeps the yard's size, its feet where the drawing puts them.
// While `fn` runs, every frame's fills are laid in `map(tone)` instead: a
// drawing drawn in other tones as it stands (a closed station, unlit).
let toneMap = null;
export function withTones(map, fn) {
  const was = toneMap;
  toneMap = map;
  try { fn(); } finally { toneMap = was; }
}
export function frame(ox, oy, flip = 0, sink = null, s = 1) {
  const X = (x, w) => (flip ? ox + flip * P * s - x - w : ox + x);
  // a rect already in the frame's scaled px
  const put = (x, y, w, h, tone) => {
    if (sink) { sink(x, y, w, h); return; }
    ctx.fillStyle = GREY[toneMap ? toneMap(tone) : tone];
    ctx.fillRect(Math.round(X(x, w)), Math.round(oy + y), Math.round(w), Math.round(h));
  };
  const d = {
    ox, oy, sinking: !!sink,
    // local px: a rect, whole pixels
    px(x, y, w, h, tone) { put(x * s, y * s, w * s, h * s, tone); },
    r(x, y, w, h, tone = K) { d.px(x * P, y * P, w * P, h * P, tone); },
    c(x, y, tone = K) { d.r(x, y, 1, 1, tone); },
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
      const h = squat ? 12 : 18, mid = (x * P + dxpx + 9) * s, foot = (y * P + dypx + 18) * s;
      square(put, mid - 9, foot - h, 18, h);
    },
    world: (x, y) => ({ x: X(x * P * s, 0), y: oy + y * P * s })
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
