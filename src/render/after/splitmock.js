// MOCK, throwaway branch mock-log-split: three ways a 4x4 log becomes three
// 2x2 timber blocks and four grains at the saw mill's blade, drawn in the
// real mill so they can be judged at the real camera. Picked by
// globalThis.__splitStyle ('A' | 'B' | 'C'), set by the after-split-* scenes.
// Never merged.

import { P } from '../../config.js';
import { S } from '../../state.js';
import { K, W, PALE, MID, hash, clamp01 } from './kit.js';
import { ctx } from '../ctx.js';
import { GREY, AFTER_ART_SCALE } from '../../config.js';
import { addGrain, settle, at, put, topRow, wakeGrid } from '../../grid.js';

const LOG = MID, TIMBER = PALE;
const TIMBER_X = 53, PER_ROW = 3, CAP = 9;
const lerp = (a, b, k) => a + (b - a) * k;
// A block of one flat tone, `s` cells square, a pixel of page short of its neighbors.
const block = (d, tone, x, y, s, w = s) => d.px(x * P, y * P, w * P - 1, s * P - 1, tone);
// Where the timber pile's next block goes, and the pile itself: 2x2 blocks three wide, growing up.
// --- round 7: the timber pile is a plot on the shared sand rules (grid.js),
// as the casino's bins are: a grain is one 2x2 block, heaps stand up
// at the dust's own slope, a block that lands rolls down the heap's side until it rests,
// and a block taken off the top lets the heap slump. The plot is in the mill
// frame's own cells, starting under the bed's end; the blocks drop onto its
// third column and roll off either side into a mound. Drawing-only state for the mock.
const PLOT_COLS = 7, PLOT_ROWS = 5, PILE_CAP = 20, SETTLE_S = 0.07, DROP_COL = 1;
// round 8: the outfeed -- rollers from the blade to a short table past the bed's end (END)
const BED_END = 50, END = 52;
// round 21, the hand-off from the machine to the pile (globalThis.__flowStyle):
// 'T1' a chute slanting down off the bed's end to a pile standing clear;
// 'T2' a longer table, tipped off its far end onto a pile just past it;
// 'T3' no table, spilled off the bed's end onto a pile mounded against it.
const flow = () => globalThis.__flowStyle || 'T0';
const GEOM = {
  T0: { table: END, plotX: BED_END, dropCol: 1, low0: true },
  T1: { table: BED_END, plotX: BED_END + 6, dropCol: 1, chute: { x1: BED_END + 8, y1: -4 } },
  T2: { table: BED_END + 8, plotX: BED_END + 8, dropCol: 0 },
  T3: { table: BED_END, plotX: BED_END, dropCol: 0 }
};
const geom = () => GEOM[flow()] || GEOM.T0;
const plot = { x: BED_END, y: 0, ceiling: c => (c === 0 ? 2 : PLOT_ROWS), cols: PLOT_COLS, rows: PLOT_ROWS, p: 2, grid: new Uint8Array(PLOT_COLS * PLOT_ROWS),
               n: 0, awake: null, awakeOf: null, awakeN: 0, awakeList: null, repose: false };
let plotT = null, plotStock = null;
// The saw's own heap under the blade: grains kept, not counted afresh each cut, so none pops out.
const FOOT_MAX = 9;
let footN = 5;
const landedKeys = new Set();
const plotTop = c => { const r = topRow(plot, c); return -(r + 2) * 2; };   // the top of column c's stack, as a block's y
// Each block keeps an identity as it rolls (its value, 1..9), so the loose
// pile's nudge off the lattice goes with the block rather than the cell.
let nextId = 0;
const dropIn = () => addGrain(plot, plot.x + geom().dropCol * 2, undefined, 1 + (nextId++ % 9), true);
// round 19, the pile three ways (globalThis.__pileStyle): 'A' the even mound,
// 'B' the same mound loose (each block a fixed nudge of its own, in cells'
// sizes but free positions), 'C' a tall heap that stands up.
const pileStyle = () => globalThis.__pileStyle || 'A';
const nudge = v => (pileStyle() === 'B' ? { x: (hash(v * 7.31) - 0.5) * 0.8, y: hash(v * 3.17) * 0.4 } : { x: 0, y: 0 });
// Blocks taken off the top when timber is spent fade out where they lay.
const ghosts = [];
const GHOST_S = 0.4;
export function blockPile(d) {
  const a = S.after, t = a ? a.t : 0, stock = a ? Math.floor(a.stock.timber) : 0;
  if (plotT == null || t < plotT) {                     // a fresh scene: the pile stands as the stock says
    plot.repose = pileStyle() === 'C'; plot.cols = pileStyle() === 'C' ? 5 : PLOT_COLS;
    plot.x = geom().plotX; plot.ceiling = geom().low0 ? (c => (c === 0 ? 2 : PLOT_ROWS)) : null;
    plot.grid = new Uint8Array(plot.cols * plot.rows); plot.awake = null; ghosts.length = 0;
    landedKeys.clear(); wakeGrid(plot); footN = 5;
    for (let i = 0; i < Math.min(stock, PILE_CAP); i++) { dropIn(); for (let k = 0; k < 12; k++) settle(plot); }
    plotT = t; plotStock = stock;
  }
  // timber spent: as many blocks off the top, and the heap slumps into the gap
  if (stock < plotStock) for (let i = 0; i < plotStock - stock; i++) {
    let best = -1, hi = -1;
    for (let c = 0; c < plot.cols; c++) { const r = topRow(plot, c); if (r > hi) { hi = r; best = c; } }
    if (best >= 0 && hi >= 0) { ghosts.push({ c: best, r: hi, v: at(plot, best, hi), at: t }); put(plot, best, hi, 0); }
  }
  plotStock = stock;
  while (t - plotT >= SETTLE_S) { settle(plot); plotT += SETTLE_S; }
  // round 20: the pile's shape filled solid behind its blocks, so the pixel
  // between two blocks is a seam of mid tone, not a hole the sky shows through
  const back = (c, r, v) => { const n = nudge(v); d.px((plot.x + c * 2 + n.x) * P, (-(r + 1) * 2 + n.y) * P, 2 * P, 2 * P, MID); };
  const put2 = (c, r, v) => { const n = nudge(v); block(d, TIMBER, plot.x + c * 2 + n.x, -(r + 1) * 2 + n.y, 2); };
  for (let c = 0; c < plot.cols; c++) for (let r = 0; r < plot.rows; r++) { const v = at(plot, c, r); if (v) back(c, r, v); }
  for (let c = 0; c < plot.cols; c++) for (let r = 0; r < plot.rows; r++) { const v = at(plot, c, r); if (v) put2(c, r, v); }
  for (let i = ghosts.length - 1; i >= 0; i--) {
    const g = ghosts[i], k = (t - g.at) / GHOST_S;
    if (k >= 1) { ghosts.splice(i, 1); continue; }
    d.fade(1 - k, () => { back(g.c, g.r, g.v); put2(g.c, g.r, g.v); });
  }
}

// Grains puffed out under the bed, one a down-stroke, falling to the heap at the saw's foot.
function grains(d, bx, times, ph, T) {
  for (let i = 0; i < times.length; i++) {
    const age = (ph - times[i]) * T;
    if (age < 0) continue;
    const y = -2 + age * age * 18;
    if (y >= -1) continue;
    d.px((bx + 0.5 + (hash(i * 7.3) - 0.5) * (1 + age * 4)) * P, y * P, P, P, hash(i * 3.1) < 0.5 ? MID : K);
  }
}
function footHeap(d, bx, n) {
  const at = [[0, 0], [1, 0], [-1, 0], [2, 0], [-2, 0], [0, 1], [1, 1], [-1, 1], [0, 2]];
  for (let i = 0; i < Math.min(n, at.length); i++) d.px((bx + at[i][0]) * P, (-1 - at[i][1]) * P, P, P, hash(i * 5.7) < 0.4 ? MID : PALE);
}
// Off the bed's end onto the pile: block `b` of three, from where it sits.
function slideOff(d, from, out, b, puff = false) {
  // off the bed's end, then dropped onto the top of the plot's first column,
  // where it becomes a grain of the pile and the sand rules roll it on
  const raw = out * 1.5 - b * 0.25, kk = clamp01(raw), slide = clamp01(kk * 2), drop = clamp01(kk * 2 - 1);
  const key = `${Math.floor(((S.after && S.after.t) || 0) / 6.4)}-${b}`;
  if (kk >= 1) { if (!landedKeys.has(key)) { landedKeys.add(key); dropIn(); if (landedKeys.size > 256) landedKeys.clear(); } return; }
  const to = { x: plot.x + DROP_COL * 2, y: plotTop(DROP_COL) };
  if (puff && raw >= 0.9 && raw < 1) d.fade(1 - (raw - 0.9) / 0.1, () => { for (const sx of [-1, 2]) d.px((to.x + sx) * P, (to.y + 1.5) * P, P, P, MID); });
  block(d, TIMBER, lerp(from[0], to.x, slide), lerp(from[1], to.y, drop * drop), 2);
}

// --- round 3: the bite. The feed is split into BITES strokes, a turn of the
// wheel each: the log is driven in on the down-stroke, the blade holds at the
// bottom a beat (the held impact), and the up-stroke draws back with the log
// still. The mill reads the wheel's angle from here, so wheel, blade and log
// keep one beat.
export const BITES = 8;
const HOLD = 0.12;   // the share of a bite the blade holds at the bottom
// Three feels of the same bite, by the style's second letter ('C1' bite, 'C2' labor, 'C3' punch).
const turnAt = g => Math.round((-Math.PI / 2 + g * 2 * Math.PI) / (Math.PI / 8)) * (Math.PI / 8);
export function biteOf(ph, mode = 'C1') {
  const asked = mode;
  const k = clamp01((ph - 0.05) / 0.7);
  if (k <= 0 || k >= 1) return { mode, k, bite: k >= 1 ? BITES : 0, f: 0, a: -Math.PI / 2, smear: false, impact: -1, cutting: -1, eaten: k >= 1 ? 4 : 0 };
  const x = k * BITES, bite = Math.floor(x), f = x - bite;
  let g, feed, smear, impact = -1, cutting = -1;
  if (mode[1] && 'ABC'.includes(mode[1])) {
    // round 5, bite and punch: still while the blade rises, then slammed down
    // fast, held long at the bottom with the big burst, then drawn back up
    g = f < 0.15 ? 0.08 * (f / 0.15) : f < 0.3 ? 0.08 + 0.42 * ((f - 0.15) / 0.15) ** 2 : f < 0.55 ? 0.5 : 0.5 + 0.5 * ((f - 0.55) / 0.45);
    feed = f < 0.15 ? 0 : f < 0.3 ? ((f - 0.15) / 0.15) ** 2 : 1;
    smear = f >= 0.15 && f < 0.3; impact = f >= 0.3 ? f - 0.3 : -1;
    mode = 'C3';   // its chips and speed lines are the punch's
  } else if (mode === 'C2') {
    // labor: a slow heavy cut through most of the turn, the log creeping in with it; a quick snap back
    const c = 0.72;
    g = f < c ? 0.5 * (f / c) : 0.5 + 0.5 * ((f - c) / (1 - c));
    feed = f < c ? f / c : 1;
    smear = f >= c; cutting = f < c ? f / c : -1;
  } else if (mode === 'C3') {
    // punch: slammed down fast, held long at the bottom, then drawn back
    const hit = 0.22, hold = 0.5;
    g = f < hit ? 0.5 * (f / hit) ** 2 : f < hold ? 0.5 : 0.5 + 0.5 * ((f - hold) / (1 - hold));
    feed = f < hit ? (f / hit) ** 2 : 1;
    smear = f < hit; impact = f >= hit ? f - hit : -1;
  } else {
    // bite: still, driven in as the blade comes down, held a beat at the bottom
    g = f < 0.5 ? f : f < 0.5 + HOLD ? 0.5 : 0.5 + (f - 0.5 - HOLD) / (0.5 - HOLD) * 0.5;
    feed = f < 0.15 ? 0 : f < 0.5 ? ((f - 0.15) / 0.35) ** 2 : 1;
    smear = f < 0.5; impact = f >= 0.5 ? f - 0.5 : -1;
  }
  return { mode, asked, k, bite, f, a: turnAt(g), smear, impact, cutting, eaten: (bite + feed) * 4 / BITES };
}
// What comes off the kerf: a spit of chips at the impact (bite), a bigger
// burst (punch), or a steady trickle of fine dust while the blade cuts (labor).
function chips(d, bx, LY, b, T) {
  const sec = 0.7 * T / BITES;
  if (b.mode === 'C2') {
    if (b.cutting < 0) return;
    for (let i = 0; i < 6; i++) {
      const u = (b.cutting * 3 + i / 6) % 1, side = i % 2 ? 1 : -1;
      d.fade(1 - u, () => d.px((bx + 1 + side * (0.6 + u * 2.2)) * P, (LY + 2 + u * 3.5) * P, P, P, i < 2 ? MID : PALE));
    }
    return;
  }
  if (b.impact < 0) return;
  const big = b.mode === 'C3', age = b.impact * sec, life = big ? 0.6 : 0.5, n = big ? 14 : 8;
  if (age > life) return;
  d.fade(1 - age / life, () => {
    for (let i = 0; i < n; i++) {
      const side = i % 2 ? 1 : -1, sp = (big ? 6 : 4) + hash(b.bite * 9.1 + i) * (big ? 12 : 8), up = (big ? 9 : 6) + hash(b.bite * 3.7 + i) * 8;
      const x = bx + 1 + side * (1 + age * sp), y = LY + 1 + (i % 4) * 0.6 - age * up + age * age * 45;
      d.px(x * P, y * P, P, P, i < (big ? 5 : 3) ? MID : PALE);
    }
  });
}
// Punch: speed lines either side of the blade while it is slammed down.
function speedLines(d, bx, LY, b) {
  if (b.mode !== 'C3' || !b.smear) return;
  d.fade(0.8, () => { for (const sx of [-2, 3]) d.px((bx + sx) * P, (LY - 7) * P, P, 6 * P, PALE); });
}

// `ph` the cut's phase, 0..1: the feed, then the blocks off the end.
export function splitLog(d, style, ph, bed, bx, T) {
  const LY = bed - 4, k = clamp01((ph - 0.05) / 0.7), out = clamp01((ph - 0.78) / 0.17);
  const done = ph >= 0.78;
  let kerf = [];
  if (style === 'A') {
    // Quarters: two columns through and they are two blocks; the next two one block, the last quarter the kerf.
    const X = bx - 4 + 10 * k, re = X + 4;
    const logW = Math.max(0, Math.min(4, bx - X));
    if (logW > 0 && !done) d.px(X * P, LY * P, logW * P, 4 * P, LOG);
    if (!done) {
      const x0 = Math.max(bx + 2, X);
      [[re - 2, re], [re - 4, re - 2]].forEach(([a, b], i) => { const l = Math.max(a, x0); if (b > l) { block(d, TIMBER, l, LY, 2, b - l); if (i === 0) block(d, TIMBER, l, LY + 2, 2, b - l); } });
    } else [[bx + 6, LY], [bx + 8, LY], [bx + 8, LY + 2]].forEach((f, b) => slideOff(d, f, out, b));
    kerf = [2, 2.5, 3, 3.5].map(th => 0.05 + 0.7 * ((th + 2) / 10));
  } else if (style === 'B') {
    // Seams open: the log crosses whole, timber past the blade; the pale quarter crumbles at the end.
    const X = bx - 4 + 10 * k;
    const logW = Math.max(0, Math.min(4, bx - X));
    if (logW > 0 && !done) d.px(X * P, LY * P, logW * P, 4 * P, LOG);
    if (!done) for (let q = 0; q < 4; q++) {
      const qx = X + (q % 2) * 2, qy = LY + Math.floor(q / 2) * 2, from = Math.max(qx, bx + 2), vis = qx + 2 - from;
      if (vis > 0) block(d, q === 3 ? W : TIMBER, from, qy, 2, Math.min(2, vis));
      if (vis > 0 && q === 3) d.px(from * P, qy * P, Math.min(2, vis) * P - 1, 2 * P - 1, MID);
    }
    else {
      [[bx + 6, LY], [bx + 8, LY], [bx + 6, LY + 2]].forEach((f, b) => slideOff(d, f, out, b));
      for (let g = 0; g < 4; g++) { const age = out * 1.2 - g * 0.06, y = LY + 2 + (g >> 1) + age * age * 40; if (age > 0 && y < -1) d.px((bx + 8 + (g & 1)) * P, y * P, P, P, MID); }
    }
  } else {
    // A column at a time, round 9: the bed is a roller conveyor end to end, and each block rides out the
    // moment its column is cut, tipping off the end one after another.
    const OUT = 0.75;
    const b = biteOf(ph, style), cutting = ph >= 0.05 && ph < OUT, eaten = cutting ? b.eaten : 0, left = 4 - eaten;
    rollerBed(d, bed, ((S.after && S.after.t) || 0) * ROLL_V);
    if (cutting && left > 0) d.px((bx - left) * P, LY * P, left * P, 4 * P, LOG);
    // the block being cut, growing out of the blade
    const w = cutting && eaten < 3 ? 2 * (eaten % 1) : 0;
    if (w > 0) block(d, TIMBER, bx + 2, LY + 2, 2, w);
    if (cutting) { chips(d, bx, LY, b, T); }
    // the cut blocks riding out: this cut's and the last cut's still on their way
    outflow(d, bed, bx, ph, T);
    // the kerf: the last two bites spit two grains each at their impact
    const at = bite => 0.05 + 0.7 * ((bite + 0.5) / BITES);
    kerf = [at(6), at(6) + 0.004, at(7), at(7) + 0.004];
  }
  grains(d, bx, kerf, ph, T);
  // the saw's heap keeps every grain that reached it: each joins once, when it lands, and stays
  const start = Math.round(((S.after && S.after.t) || 0) - ph * T);
  kerf.forEach((g, i) => { const key = `${start}-k${i}`; if (ph > g + 0.06 && !landedKeys.has(key)) { landedKeys.add(key); footN = Math.min(FOOT_MAX, footN + 1); } });
  footHeap(d, bx, footN);
}

// --- round 5: the bar from the wheel to the blade, three ways ('CA' a real
// con-rod, 'CB' a bigger crank and a longer stroke, 'CC' a rocker beam). The
// mill hands over the wheel's angle and its own numbers; this draws the rod
// (behind the frame) and the crosshead (after the blade), and says how far
// down the blade is (`o`).
// A pin: two cells of ink round one of paper, centered on the joint wherever it is.
const eye = (d, x, y) => { d.px(x * P - P, y * P - P, 2 * P, 2 * P, K); d.px(x * P - P / 2, y * P - P / 2, P, P, W); };
const disc = (d, cx, cy, r) => { for (let y = Math.floor(cy - r - 1); y <= cy + r + 1; y++) for (let x = Math.floor(cx - r - 1); x <= cx + r + 1; x++) if (Math.hypot(x + 0.5 - cx, y + 0.5 - cy) <= r) d.c(x, y, K); };
// A bar exactly one cell thick, laid at its true position so it moves smoothly, in a paper rim.
const rodLine = (d, x0, y0, x1, y1) => { d.line(x0, y0, x1, y1, P + 4, W); d.line(x0, y0, x1, y1, P, K); };
export function linkage(style, a, MW, head, bx) {
  const kind = style[1], r = kind === 'A' ? 1.5 : 3, stroke = kind === 'B' ? 6 : 3;
  const pin = { x: MW.cx + Math.cos(a) * r, y: MW.cy + Math.sin(a) * r };
  const o = Math.round(stroke / 2 + (stroke / 2) * Math.sin(a));
  const top = (kind === 'B' ? head - 8 : head - 5) + o;          // the crosshead's top row
  const lk = { kind, r, pin, o, top, MW, head, bx };
  if (kind === 'C') {
    // round 6, the beam as a true linkage: the rod keeps one length, so the
    // beam takes whatever angle puts its long end that far from the crank pin,
    // and its short end, on the crosshead, sets how far down the blade is.
    const pv = { x: bx - 5, y: head - 4 }, LONG = 8, SHORT = 5;
    const rod = Math.hypot(pv.x - LONG - MW.cx, pv.y - MW.cy);       // its length with the beam level
    // Two angles fit at most points of the turn; the one nearest level is the
    // beam's, so it never flips between them.
    const f = t => Math.hypot(pv.x - LONG * Math.cos(t) - pin.x, pv.y - LONG * Math.sin(t) - pin.y) - rod;
    let th = 0, near = Infinity;
    for (let i = 0; i < 480; i++) {
      let lo = -1.2 + 2.4 * i / 480, hi = lo + 2.4 / 480;
      if (f(lo) * f(hi) > 0) continue;
      for (let j = 0; j < 30; j++) { const m = (lo + hi) / 2; if (f(lo) * f(m) <= 0) hi = m; else lo = m; }
      const r = (lo + hi) / 2;
      if (Math.abs(r) < near) { near = Math.abs(r); th = r; }
    }
    lk.pv = pv;
    lk.q = { x: pv.x - Math.cos(th) * LONG, y: pv.y - Math.sin(th) * LONG };
    lk.end = { x: pv.x + Math.cos(th) * SHORT, y: pv.y + Math.sin(th) * SHORT };
    lk.top = lk.end.y;
    // the blade's three rows of stroke over the beam's own travel (-1.7 to 2.9 cells about the crosshead's rest)
    lk.o = Math.max(0, Math.min(3, Math.round((lk.end.y - (head - 5) + 1.7) * 3 / 4.6)));
  }
  return lk;
}
export function drawRod(d, lk) {
  d.line(lk.MW.cx, lk.MW.cy, lk.pin.x, lk.pin.y, P, K);             // the crank arm off the hub, a cell thick
  const to = lk.kind === 'C' ? lk.q : { x: lk.bx - 2.5, y: lk.top + 1 };
  rodLine(d, lk.pin.x, lk.pin.y, to.x, to.y);
  if (lk.kind === 'C') {
    d.r(lk.pv.x - 0.5, lk.pv.y, 1, lk.head - lk.pv.y, K);          // the beam's post, off the frame's head
    rodLine(d, lk.q.x, lk.q.y, lk.end.x, lk.end.y);                  // the beam, a cell thick
    eye(d, lk.pv.x, lk.pv.y); eye(d, lk.q.x, lk.q.y);
  }
  eye(d, lk.pin.x, lk.pin.y);
}
export function drawHead(d, lk) {
  const { bx, top, head } = lk;
  d.r(bx, top + 2, 2, Math.max(0, head - top - 2), K);              // the strap down into the head
  d.r(bx - 3, top, 6, 2, K);                                         // the crosshead
  if (lk.kind === 'C') eye(d, lk.end.x, lk.end.y);
  else eye(d, bx - 2.5, top + 1);
}

// --- round 9: the outfeed. The bed's top is rollers end to end, from the
// infeed past the blade and onto a short table off its end, all turning while
// the saw runs. A block rides out the moment its column is cut, at the
// rollers' pace, tips over the table's edge -- a quarter turn about the
// corner, drawn whole -- and drops onto the pile, where it becomes a grain.
const ROLL_V = 3, TIP_S = 0.4, FALL_S = 0.25, BED_L = 31;
function rollerBed(d, bed, travel) {
  const g = geom();
  if (g.table > BED_END) {
    d.r(BED_END, bed, g.table - BED_END, 2, K);                      // the table off the bed's end
    d.r(g.table - 1, bed + 2, 1, -bed - 2, K);                       // and its leg, under its far end
  }
  if (g.chute) d.line(BED_END, bed + 0.5, g.chute.x1 + 1, g.chute.y1 + 2.5, P, K);   // the chute, a cell thick
  // round 16: the bed stays plain black; the blocks slide out along it (the owner: "revert to the plain black cells").
}
// A block turned `ang` about the pivot (px, py), in the frame's cells, drawn as one piece.
function turned(d, px0, py0, ang) {
  const s = P * AFTER_ART_SCALE, at0 = d.world(px0, py0);
  ctx.save(); ctx.translate(at0.x, at0.y); ctx.rotate(ang);
  ctx.fillStyle = GREY[TIMBER]; ctx.fillRect(-2 * s, -2 * s, 2 * s - 1, 2 * s - 1);
  ctx.restore();
}
// When block j of a cut is whole and starts to ride: the end of the bite that finishes its column.
const doneAt = j => 0.05 + 0.7 * ((2 * j + 1) + 0.3) / BITES;
function outflow(d, bed, bx, ph, T) {
  const g = geom(), edge = g.table, top = bed - 2, now = (S.after && S.after.t) || 0, travel = (edge - 2 - (bx + 2)) / ROLL_V;
  const CHUTE_S = 0.9;
  for (const back of [1, 0]) for (let j = 0; j < 3; j++) {
    const age = (ph + back - doneAt(j)) * T;
    if (age < 0) continue;
    const key = `${Math.round(now - age)}-${j}`;
    if (age < travel) { block(d, TIMBER, bx + 2 + ROLL_V * age, top, 2); continue; }
    let u = age - travel, fromX = edge, fromY = top;
    if (g.chute) {
      // down the chute, sliding its length, quickening
      if (u < CHUTE_S) { const k = (u / CHUTE_S) ** 1.5; block(d, TIMBER, lerp(edge - 2, g.chute.x1, k), lerp(top, g.chute.y1, k), 2); continue; }
      u -= CHUTE_S; fromX = g.chute.x1; fromY = g.chute.y1;
    } else {
      if (u < TIP_S) { turned(d, edge, bed, (Math.PI / 2) * (u / TIP_S) ** 1.6); continue; }
      u -= TIP_S;
    }
    const f = u / FALL_S, landX = plot.x + g.dropCol * 2;
    if (f < 1) { block(d, TIMBER, lerp(fromX, landX, f), lerp(fromY, plotTop(g.dropCol), f * f), 2); continue; }
    // it joins the pile once, in the half second after it lands
    if (f < 1 + 0.5 / FALL_S && !landedKeys.has(key)) { landedKeys.add(key); dropIn(); if (landedKeys.size > 256) landedKeys.clear(); }
  }
}

// --- round 23: the sawyer at work, three ways (globalThis.__workStyle).
// 'W1' heave: leans with the crank and squats hard on the slam, held through
// the hit; 'W2' both hands: closer, both arms on the knob, the body bobbing
// with it like a pump; 'W3' treadwheel: walks inside the flywheel's foot, the
// walking turning it, no arms. `a` is the wheel's angle (the bite's), `base`
// the mill's spot for the body, `hub` the wheel's middle.
export function workPose(a, base, hub) {
  const st = globalThis.__workStyle;
  if (st === 'W1') {
    const low = Math.sin(a) > 0.4;
    return { x: base, y: -3, dx: Math.cos(a) * P * 0.6, dy: 0, squat: low, arms: [{ x: base + 2.5, y: low ? -1.2 : -2.2 }] };
  }
  if (st === 'W2') {
    const bob = -Math.sin(a) * 0.6;
    return { x: base + 2, y: -3, dx: 0, dy: bob * P, squat: false, arms: [{ x: base + 4.5, y: -2.4 + bob }, { x: base + 4.5, y: -1.4 + bob }] };
  }
  if (st === 'W3') {
    const step = Math.floor(a / (Math.PI / 4)) & 1;
    return { x: hub.x - 1.5, y: -7, dx: 0, dy: step ? -2 : 0, squat: false, arms: [], feet: step };
  }
  return null;
}
// The arms to the knob, a cell thick, and a fist of two cells round it; or the treadwheel's feet.
export function drawWork(d, pose, knob) {
  for (const arm of pose.arms) d.line(arm.x, arm.y, knob.x, knob.y, P, K);
  if (pose.arms.length) { d.px(knob.x * P - P, knob.y * P - P, 2 * P, 2 * P, K); d.px(knob.x * P - P / 2, knob.y * P - P / 2, P, P, W); }
  if (pose.feet != null) { const fx = pose.x + (pose.feet ? 0 : 1); d.r(fx, -4, 1, 1, K); d.r(fx + 1 + (pose.feet ? 0 : -1), -4, 1, 1, K); }
}
