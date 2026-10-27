// MOCK, throwaway branch mock-log-split: three ways a 4x4 log becomes three
// 2x2 timber blocks and four grains at the saw mill's blade, drawn in the
// real mill so they can be judged at the real camera. Picked by
// globalThis.__splitStyle ('A' | 'B' | 'C'), set by the after-split-* scenes.
// Never merged.

import { P } from '../../config.js';
import { S } from '../../state.js';
import { K, W, PALE, MID, hash, clamp01 } from './kit.js';

const LOG = MID, TIMBER = PALE;
const TIMBER_X = 53, PER_ROW = 3, CAP = 9;
const lerp = (a, b, k) => a + (b - a) * k;
// A block of one flat tone, `s` cells square, a pixel of page short of its neighbors.
const block = (d, tone, x, y, s, w = s) => d.px(x * P, y * P, w * P - 1, s * P - 1, tone);
// Where the timber pile's next block goes, and the pile itself: 2x2 blocks three wide, growing up.
const slotAt = i => ({ x: TIMBER_X + (i % PER_ROW) * 2, y: -2 - Math.floor(i / PER_ROW) * 2 });
export function blockPile(d, n) { for (let i = 0; i < Math.min(n, CAP); i++) { const s = slotAt(i); block(d, TIMBER, s.x, s.y, 2); } }
const shownTimber = () => Math.min(CAP - 1, Math.floor((S.after && S.after.stock.timber) || 0));

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
  const raw = out * 1.5 - b * 0.25, kk = clamp01(raw), slide = clamp01(kk * 2), drop = clamp01(kk * 2 - 1);
  const to = slotAt(shownTimber() + b);
  // round 3: a block that lands kicks a little dust off the pile, fading as it rises
  if (puff && raw >= 1 && raw < 1.4) { const u = (raw - 1) / 0.4; d.fade(1 - u, () => { for (const sx of [-1, 2]) d.px((to.x + sx + (sx < 0 ? -u : u)) * P, (to.y + 1.5 - u * 1.5) * P, P / 2, P / 2, MID); }); }
  if (kk >= 1) return;
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
  const k = clamp01((ph - 0.05) / 0.7);
  if (k <= 0 || k >= 1) return { mode, k, bite: k >= 1 ? BITES : 0, f: 0, a: -Math.PI / 2, smear: false, impact: -1, cutting: -1, eaten: k >= 1 ? 4 : 0 };
  const x = k * BITES, bite = Math.floor(x), f = x - bite;
  let g, feed, smear, impact = -1, cutting = -1;
  if (mode === 'C2') {
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
  return { mode, k, bite, f, a: turnAt(g), smear, impact, cutting, eaten: (bite + feed) * 4 / BITES };
}
// What comes off the kerf: a spit of chips at the impact (bite), a bigger
// burst (punch), or a steady trickle of fine dust while the blade cuts (labor).
function chips(d, bx, LY, b, T) {
  const sec = 0.7 * T / BITES;
  if (b.mode === 'C2') {
    if (b.cutting < 0) return;
    for (let i = 0; i < 6; i++) {
      const u = (b.cutting * 3 + i / 6) % 1, side = i % 2 ? 1 : -1;
      d.fade(1 - u, () => d.px((bx + 1 + side * (0.6 + u * 2.2)) * P, (LY + 2 + u * 3.5) * P, P / 2, P / 2, i < 2 ? MID : PALE));
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
      const fat = i < (big ? 5 : 3);
      d.px(x * P, y * P, fat ? P : P / 2, fat ? P : P / 2, fat ? MID : PALE);
    }
  });
}
// Punch: speed lines either side of the blade while it is slammed down.
function speedLines(d, bx, LY, b) {
  if (b.mode !== 'C3' || !b.smear) return;
  d.fade(0.8, () => { for (const sx of [-1.5, 2.5]) d.px((bx + sx) * P, (LY - 7) * P, 2, 6 * P, PALE); });
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
    // A column at a time, round 4: three feels of the bite (C1 bite, C2 labor, C3 punch). driven a bite at a time; each column out the far side as one block; the fourth is the kerf.
    const b = biteOf(ph, style), eaten = done ? 4 : b.eaten, left = 4 - eaten;
    if (left > 0 && !done) d.px((bx - left) * P, LY * P, left * P, 4 * P, LOG);
    const n = Math.min(3, Math.floor(eaten)), w = eaten < 3 ? 2 * (eaten % 1) : 0;
    if (!done) {
      if (w > 0) block(d, TIMBER, bx + 2, LY + 2, 2, w);
      for (let j = 0; j < n; j++) block(d, TIMBER, bx + 2 + w + (n - 1 - j) * 2, LY + 2, 2);
      chips(d, bx, LY, b, T);
      speedLines(d, bx, LY, b);
    } else for (let q = 0; q < 3; q++) slideOff(d, [bx + 2 + (2 - q) * 2, LY + 2], out, q, true);
    // the kerf: the last two bites spit two grains each at their impact
    const at = bite => 0.05 + 0.7 * ((bite + 0.5) / BITES);
    kerf = [at(6), at(6) + 0.004, at(7), at(7) + 0.004];
  }
  grains(d, bx, kerf, ph, T);
  footHeap(d, bx, 5 + kerf.filter(g => ph > g + 0.06).length);
}
