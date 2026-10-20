// The union's gathered crowd (DESIGN.md, "The level, the two crowds and the
// flags", "The camps are far apart for the eye"; docs/mocks/act3-level-
// 2026-10-19, a3ucrowd2 straight, and a3campgap2's lighter souls): one crowd
// facing the pair, standing round and behind their podium in straight rows
// stepping up and back, each row back smaller, higher and paler. It is drawn
// light -- loose rows, the near souls a grey body under an ink cap, the far
// ones mid and pale -- so God stays the eye's anchor.
//
// It fills in from the front as support rises. A soul that comes walks in
// from the right, from God's side, into its row, fading in as it starts; one
// that leaves fades where it stands. When a line of the pair's speech goes up
// (`S.after.shout`) most of the near rows hop a cell, held a beat.
//
// Nothing of it is saved: who stands is read off support, and when each
// newcomer started walking in is drawing state, forgotten on a new act, a
// reload or a jump of the clock, when everyone due simply stands.

import { P, GREY, STRIKE_SHARE, UNION_CROWD as C, AFTER_PODIUM_U, AFTER_PODIUM_HALF } from '../../config.js';
import { S } from '../../state.js';
import { afterFloor, podiumMid, unionHalf } from '../../after/place.js';
import { support } from '../../after/union.js';
import { podiumRung } from '../../after/levels.js';
import { ctx } from '../ctx.js';
import { fillOnPixels, onPixel } from '../frame.js';
import { K, PALE, MID, inView } from './kit.js';

const clamp01 = v => Math.max(0, Math.min(1, v));
const lerp = (a, b, k) => a + (b - a) * k;
const cells = v => Math.round(v / P);
const ease = k => k * k * (3 - 2 * k);
function hsh(a, b = 0) {
  let h = (a * 374761393 + b * 668265263) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

// A row's shape, front (r 0) to back, in cells off the crowd's own origin
// (the podium's middle on the grid): its souls' side, the step from one to
// the next, the cell its first soul stands on, how many fit, and its feet.
// Every number here is a whole cell, so a row is one drawing on the grid and
// none of its souls is rounded on its own.
function row(r) {
  const k = r / (C.rows - 1), n = C.n[r], gap = C.gap[r], pitch = n + gap;
  const half = Math.floor(Math.min(lerp(C.half[0], C.half[1], k), unionHalf()) / P);
  const from = -half + (r & 1) * Math.floor(pitch / 2);
  return { k, n, gap, pitch, from, count: Math.max(0, Math.ceil((half - from) / pitch)), y: afterFloor() - cells(lerp(0, C.rise, k)) * P };
}
const origin = () => cells(podiumMid()) * P;
// Whether soul i of row r is due at this share of the way to the strike.
const due = (s, r, i) => s * C.rows * C.fill - r - hsh(i, r + 3) * C.luck > 0;

// When each soul started walking in (or leaving), by row and spot: drawing
// state only.
const since = new Map();
let seenAct = null, lastT = null;
const key = (r, i) => r * 1000 + i;
function catchUp(s) {
  since.clear();
  for (let r = 0; r < C.rows; r++) {
    const R = row(r);
    for (let i = 0; i < R.count; i++) if (due(s, r, i)) since.set(key(r, i), { in: true, at: -Infinity });
  }
}

export const unionDrawn = { souls: 0 };
export function drawUnionCrowd() {
  const a = S.after;
  if (!a) return;
  const t = a.t, s = clamp01(support() / STRIKE_SHARE), mid = podiumMid(), o = origin();
  if (seenAct !== a || lastT == null || Math.abs(t - lastT) > 1) { seenAct = a; catchUp(s); }
  lastT = t;
  if (!inView(mid - C.half[1] - C.walk, 2 * C.half[1] + 2 * C.walk)) return;
  const hop = a.shout != null && t - a.shout >= 0 && t - a.shout < C.hopS;
  const clear = AFTER_PODIUM_HALF[podiumRung()] * AFTER_PODIUM_U + C.clear;
  let count = 0;
  const was = ctx.globalAlpha;
  // back to front, so a nearer row stands over the feet of the one behind
  for (let r = C.rows - 1; r >= 0; r--) {
    const R = row(r), tone = r < C.midTo ? MID : PALE, w = R.n * P;
    for (let i = 0; i < R.count; i++) {
      // every other soul a cell or so off its place where the gap leaves room
      const jit = i & 1 && R.gap > C.jit ? Math.round((hsh(i, r + 17) - 0.5) * 2 * C.jit) : 0;
      const x = o + (R.from + i * R.pitch + jit) * P;
      // the front rows open in front of the podium
      if (r < 2 && Math.abs(x + w / 2 - mid) < clear + w / 2) continue;
      const k = key(r, i), want = due(s, r, i);
      let st = since.get(k);
      if (!st || st.in !== want) { st = { in: want, at: t }; since.set(k, st); }
      const u = clamp01((t - st.at) / (want ? C.walkS : C.fadeOut));
      let alpha, dx = 0;
      // a newcomer walks in at its true position, the whole soul one piece
      if (want) { alpha = clamp01(u / C.fadeIn); dx = (1 - ease(u)) * C.walk; }
      else alpha = 1 - u;
      if (alpha <= 0.001) continue;
      if (want && u >= 1) count++;
      const lift = hop && r < C.hopRows && hsh(i, r) < C.hop ? P : 0;
      const short = R.n >= C.shortMin && hsh(i, r + 29) < C.short ? P : 0;
      const sx = dx ? onPixel(x + dx) : x, sy = R.y - w - lift + short, h = w - short;
      ctx.globalAlpha = was * alpha;
      ctx.fillStyle = GREY[tone]; fillOnPixels(ctx, sx, sy, w, h);
      if (r < C.cap) { ctx.fillStyle = GREY[K]; fillOnPixels(ctx, sx, sy, w, P); }
    }
  }
  ctx.globalAlpha = was;
  unionDrawn.souls = count;
}
// For a scene or a check: the newcomers' walks forgotten, everyone due standing.
export function unionSettle() { if (S.after) catchUp(clamp01(support() / STRIKE_SHARE)); }
