// The pair's podium (DESIGN.md, "The level, the two crowds and the flags";
// docs/mocks/act3-level-2026-10-19, a3podium2): low, in the first plane, in
// front of their crowd -- a ladder of five, a soapbox crate, crates stacked
// two high with a plank, a plank stage with the fist banner on its front, a
// cloud plinth of squared blocks with steps, the Greek cloud column. A rung
// bought, the new one is built where the old stood: the old fades, the new
// stands up a course at a time, and the pair step up onto it. The pair on
// top, a cell of paper round them so they stand off the crowd's ink; a line
// of the speech a held pose -- a crouch, then up a cell with the shout mark
// -- and their speech bubbles rising off them and fading (after/bubbles.js).
// The rebel pile at its foot, a small grey heap a power of ten.

import { P, GREY, AFTER_ART_SCALE, AFTER_SHOUT_HOLD_S, AFTER_PODIUM_U as U, AFTER_PODIUM_CLIMB as CLIMB } from '../../config.js';
import { S } from '../../state.js';
import { afterFloor, speakerAt, pileX, podiumMid, podiumTopOf } from '../../after/place.js';
import { podiumRung } from '../../after/levels.js';
import { bubbles, pairSpeaking } from '../../after/bubbles.js';
import { ctx } from '../ctx.js';
import { frame, square, K, W, PALE, MID } from './kit.js';

const fr = (x, y, w, h, tone) => { ctx.fillStyle = GREY[tone]; ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
const clamp01 = v => Math.max(0, Math.min(1, v));
const FIST = ['.X.X.X.', 'XXXXXXX', 'XXXXXX.', '.XXXX..', '..XXX..'];

// Each podium about its middle `x` with its foot on `y`, in the mock's cells
// (U px each); `c(dx, dy, w, h, tone)` a rect off them, dy up from the foot.
const PODS = [
  // the soapbox: a slatted crate, a diagonal brace across its face
  c => {
    const w = 22, h = 10;
    c(-w / 2, -h, w, h, K); c(-w / 2 + 2, -h + 2, w - 4, h - 4, W);
    for (let y = -h + 4; y < -2; y += 3) c(-w / 2 + 2, y, w - 4, 1, K);
    for (let i = 0; i < w - 4; i += 2) c(-w / 2 + 2 + i, -h + 2 + Math.round(i * (h - 4) / (w - 4)), 2, 1, K);
  },
  // crates stacked two high, a plank laid across the top
  c => {
    const w = 20, h = 9;
    for (const [x, y] of [[-21, -h], [1, -h], [-10, -2 * h]]) { c(x, y, w, h, K); c(x + 2, y + 2, w - 4, h - 4, W); c(x + 2, y + 4, w - 4, 1, K); }
    c(-16, -2 * h - 2, 32, 2, K);
  },
  // a plank stage up on legs, taller than the crates, the fist banner hung
  // from its deck
  c => {
    const w = 48, t = -24;
    c(-w / 2, t, w, 2, K);
    for (const x of [-w / 2 + 2, w / 2 - 4]) c(x, t + 2, 2, -t - 2, K);
    c(-w / 2 + 4, -8, w - 8, 1, K);
    c(-12, t + 2, 24, 12, K);
    FIST.forEach((r, j) => [...r].forEach((ch, i) => { if (ch === 'X') c(-3 + i, t + 5 + j, 1, 1, W); }));
  },
  // a cloud plinth: five squared courses stepping in, paper, each one's
  // underside a mid line of shade -- paper against the crowd's greys
  c => {
    [26, 22, 18, 14, 12].forEach((hw, k) => { const dy = -6 * (k + 1); c(-hw, dy, 2 * hw, 6, W); c(-hw, dy + 5, 2 * hw, 1, MID); });
  },
  // the Greek cloud column: a fluted paper shaft on a paper cloud base, its
  // flutes, the base's tops and the capital's undersides and scrolls mid --
  // paper against the crowd's greys
  c => {
    const t = -40;
    for (const [dx, r] of [[-14, 6], [-4, 7], [7, 6], [16, 5]]) for (let dy = -r; dy <= 0; dy++) {
      const hw = Math.round(Math.sqrt(r * r - dy * dy));
      c(dx - hw, -2 + dy, 2 * hw, 1, dy === -r ? MID : W);
    }
    c(-9, t + 6, 18, -8 - t - 6, W);
    for (let i = -7; i <= 7; i += 3) c(i, t + 7, 1, -9 - t - 7, MID);
    c(-13, t + 3, 26, 3, W); c(-13, t + 5, 26, 1, MID);
    for (const sx of [-14, 11]) { c(sx, t + 3, 3, 3, MID); c(sx + 1, t + 4, 1, 1, W); }
    c(-15, t, 30, 3, W); c(-15, t + 2, 30, 1, MID);
  }
];
// Podium `n` drawn, `k` of it standing (bottom course first: a course is a
// cell, and those above the line are not yet up), at `alpha`.
function podium(n, k = 1, alpha = 1) {
  if (k <= 0 || alpha <= 0) return;
  const x = podiumMid(), y = afterFloor(), h = podiumTopOf(n), shown = Math.ceil(h / U * k) * U;
  const was = ctx.globalAlpha;
  ctx.globalAlpha = was * alpha;
  PODS[n]((dx, dy, w, hh, tone) => {
    // a rect clipped to the courses standing: from the foot up `shown`
    const top = y + dy * U, bot = top + hh * U, cut = Math.max(top, y - shown);
    if (bot > cut) fr(x + dx * U, cut, w * U, bot - cut, tone);
  });
  ctx.globalAlpha = was;
}
// How far through the climb to rung `n` the place is, 0 to 1, or null when
// no climb is going on.
function climb() {
  const n = podiumRung(), at = S.after?.upAt?.['after-podium'];
  if (!n || at == null) return null;
  const u = (S.after.t - at) / CLIMB.s;
  return u >= 0 && u < 1 ? u : null;
}
export function drawPillar() {
  if (!S.after) return;
  const n = podiumRung(), u = climb();
  if (u == null) { podium(n); return; }
  // the old fading where it stood, the new standing up a course at a time
  podium(n - 1, 1, 1 - clamp01(u / CLIMB.fade));
  podium(n, clamp01((u - CLIMB.rise[0]) / (CLIMB.rise[1] - CLIMB.rise[0])));
}
// The pair's feet, world y: the top they stand on, stepping up onto the new
// one a cell at a time over the climb's step.
function pairFeet() {
  const u = climb(), fl = afterFloor();
  if (u == null || u < CLIMB.step[0]) return speakerAt(0).y;
  const n = podiumRung(), a = podiumTopOf(n - 1), b = podiumTopOf(n), k = clamp01((u - CLIMB.step[0]) / (CLIMB.step[1] - CLIMB.step[0]));
  return fl - (a + Math.floor((b - a) * k / P) * P);
}

// The shout mark: three short rays over a head, held.
function shout(x, y) { fr(x + 8, y - 12, 2, 6, K); fr(x + 1, y - 9, 2, 2, K); fr(x + 3, y - 7, 2, 2, K); fr(x + 15, y - 9, 2, 2, K); fr(x + 13, y - 7, 2, 2, K); }
// A body, the yard's square: 18 px, a 2 px rim round a white middle.
const body = (x, y, h = 18) => square(fr, x, y, 18, h);

// The pair, while they stand up there: a cell of paper round the two of them,
// the left one speaking on a line -- crouched for the first third of the
// hold, then up a cell with the mark.
export function drawPair() {
  if (!S.after || !pairSpeaking()) return;
  const a = S.after, since = a.shout == null ? 1e9 : a.t - a.shout, feet = pairFeet();
  const l = speakerAt(0).x, r = speakerAt(1).x + 18;
  fr(l - P, feet - 18 - P - (since < AFTER_SHOUT_HOLD_S ? P : 0), r - l + 2 * P, 18 + P, W);
  for (let k = 0; k < 2; k++) {
    const x = speakerAt(k).x;
    if (k === 0 && since < AFTER_SHOUT_HOLD_S / 3) body(x, feet - 18 + 4, 14);
    else if (k === 0 && since < AFTER_SHOUT_HOLD_S) { body(x, feet - 18 - P); shout(x, feet - 18 - P); }
    else body(x, feet - 18);
  }
}

// A speech bubble: a box with its corners cut and a tail, all scaled for a
// bigger one, a symbol in it and never a word (the owner, 2026-10-18): a
// shout, a question shouted, a raised fist; risen and faded as bubbles.js
// says. The symbols are cells of the bubble's own 2 px, laid in its middle.
const SYM = {
  shout: ['##', '##', '##', '##', '..', '##'],
  ask:   ['####.##', '...#.##', '.###.##', '.#...##', '.......', '.#...##'],
  fist:  ['.#.#.#.', '#######', '#######', '#######', '.#####.', '..###..', '..###..']
};
export function drawBubbles() {
  for (const b of bubbles()) {
    if (b.alpha <= 0) continue;
    const s = b.scale, x = b.x, y = b.y, was = ctx.globalAlpha;
    ctx.globalAlpha = was * b.alpha;
    fr(x + 2 * s, y, 32 * s, 20 * s, K); fr(x, y + 2 * s, 36 * s, 16 * s, K);
    fr(x + 2 * s, y + 2 * s, 32 * s, 16 * s, W);
    fr(x + 6 * s, y + 18 * s, 6 * s, 4 * s, K); fr(x + 8 * s, y + 18 * s, 2 * s, 2 * s, W);
    const rows = SYM[b.sym] || SYM.shout, d = Math.max(2, Math.round(2 * s)), w = rows[0].length * d, h = rows.length * d;
    const sx = Math.round(x + (36 * s - w) / 2), sy = Math.round(y + (20 * s - h) / 2);
    rows.forEach((row, j) => [...row].forEach((ch, i) => { if (ch === '#') fr(sx + i * d, sy + j * d, d, d, K); }));
    ctx.globalAlpha = was;
  }
}

// The rebel pile at the foot: a stepped heap two cells high, mid at its core
// and pale over it, wider by a cell a power of ten of rebel.
export function drawRebelPile() {
  if (!S.after) return;
  const cols = Math.min(8, 2 + Math.floor(Math.log10(1 + S.after.rebel)));
  const d = frame(pileX(), afterFloor(), 0, null, AFTER_ART_SCALE);
  for (let j = 0; j < cols; j++) {
    const hh = Math.max(1, Math.round(2 * Math.sin(Math.PI * (j + 0.5) / cols)));
    for (let r = 0; r < hh; r++) d.c(j, -1 - r, r === hh - 1 && hh > 1 ? PALE : (j + r) % 3 === 0 ? MID : PALE);
  }
}
