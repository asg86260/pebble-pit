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
function slideOff(d, from, out, b) {
  const kk = clamp01(out * 1.5 - b * 0.25), slide = clamp01(kk * 2), drop = clamp01(kk * 2 - 1);
  if (kk >= 1) return;
  const to = slotAt(shownTimber() + b);
  block(d, TIMBER, lerp(from[0], to.x, slide), lerp(from[1], to.y, drop * drop), 2);
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
    // A column at a time: the log shortens into the blade, each column out the far side as one block; the fourth is the kerf.
    const eaten = k * 4, left = 4 - eaten;
    if (left > 0 && !done) d.px((bx - left) * P, LY * P, left * P, 4 * P, LOG);
    const n = Math.min(3, Math.floor(eaten)), w = eaten < 3 ? 2 * (eaten % 1) : 0;
    if (!done) {
      if (w > 0) block(d, TIMBER, bx + 2, LY + 2, 2, w);
      for (let j = 0; j < n; j++) block(d, TIMBER, bx + 2 + w + (n - 1 - j) * 2, LY + 2, 2);
    } else for (let b = 0; b < 3; b++) slideOff(d, [bx + 2 + (2 - b) * 2, LY + 2], out, b);
    kerf = [3, 3.25, 3.5, 3.75].map(e => 0.05 + 0.7 * (e / 4));
  }
  grains(d, bx, kerf, ph, T);
  footHeap(d, bx, 5 + kerf.filter(g => ph > g + 0.06).length);
}
