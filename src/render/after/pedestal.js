// The pedestal, pedestal C (docs/mocks/act3-place-2026-10-18, section 3,
// "cloud pillar"): a lump of the floor pushed up, billow-topped like floor A,
// two pale strokes of cloud on its face; the pair on top, a line of the
// speech a held pose -- a crouch, then up a cell with the shout mark -- and
// their speech bubbles rising off them and fading (after/bubbles.js). The
// rebel pile at its foot, a small grey heap a power of ten.

import { P, AFTER_PEDESTAL_H, AFTER_SHOUT_HOLD_S } from '../../config.js';
import { S } from '../../state.js';
import { afterFloor, speakerAt, stationX0, pileX } from '../../after/place.js';
import { bubbles, pairSpeaking } from '../../after/bubbles.js';
import { ctx } from '../ctx.js';
import { frame, K, W, now } from './kit.js';
import { GREY } from '../../config.js';

const fr = (x, y, w, h, tone) => { ctx.fillStyle = GREY[tone]; ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };

// The pillar's top, a cell a column off its left, cells over the floor.
const TOP = [3, 4, 4, 4, 4, 4, 4, 4, 4, 3].map(v => v - 4 + AFTER_PEDESTAL_H);
export function drawPillar() {
  const x0 = stationX0('pedestal'), fl = afterFloor();
  // The paper mass first, then its line, each convex corner cut a 2 px step.
  TOP.forEach((v, j) => {
    const x = x0 + (j + 1) * P, y = fl - v * P;
    const cutL = j > 0 && TOP[j - 1] < v, cutR = j < TOP.length - 1 && TOP[j + 1] < v;
    fr(x, y + (cutL || cutR ? 2 : 0), P, fl - y, W);
    fr(x + (cutL ? 2 : 0), y, P - (cutL ? 2 : 0) - (cutR ? 2 : 0), 2, K);
    if (j > 0 && v !== TOP[j - 1]) { const hi = fl - Math.max(v, TOP[j - 1]) * P; fr(v > TOP[j - 1] ? x : x - 2, hi + 2, 2, Math.abs(v - TOP[j - 1]) * P, K); }
  });
  fr(x0 + P - 2, fl - (TOP[0]) * P, 2, TOP[0] * P, K);
  fr(x0 + P * 11, fl - TOP[TOP.length - 1] * P, 2, TOP[TOP.length - 1] * P, K);
  fr(x0 + P * 3, fl - P * 2, P * 3, 2, 2); fr(x0 + P * 7, fl - P, P * 2, 2, 2);
}

// The shout mark: three short rays over a head, held.
function shout(x, y) { fr(x + 8, y - 12, 2, 6, K); fr(x + 1, y - 9, 2, 2, K); fr(x + 3, y - 7, 2, 2, K); fr(x + 15, y - 9, 2, 2, K); fr(x + 13, y - 7, 2, 2, K); }
// A body, the yard's square: 18 px, a 2 px rim round a white middle.
function body(x, y, h = 18) { fr(x, y, 18, h, K); fr(x + 2, y + 2, 14, h - 4, W); }

// The pair, while they stand up there: the left one speaking on a line --
// crouched for the first third of the hold, then up a cell with the mark.
export function drawPair() {
  if (!S.after || !pairSpeaking()) return;
  const a = S.after, since = a.shout == null ? 1e9 : a.t - a.shout;
  for (let k = 0; k < 2; k++) {
    const at = speakerAt(k);
    if (k === 0 && since < AFTER_SHOUT_HOLD_S / 3) body(at.x, at.y - 18 + 4, 14);
    else if (k === 0 && since < AFTER_SHOUT_HOLD_S) { body(at.x, at.y - 18 - P); shout(at.x, at.y - 18 - P); }
    else body(at.x, at.y - 18);
  }
}

// A speech bubble: a box with its corners cut, two lines standing in for
// words, a tail, all scaled for a big one; risen and faded as bubbles.js says.
export function drawBubbles() {
  for (const b of bubbles()) {
    if (b.alpha <= 0) continue;
    const s = b.scale, x = b.x, y = b.y, was = ctx.globalAlpha;
    ctx.globalAlpha = was * b.alpha;
    fr(x + 2 * s, y, 32 * s, 20 * s, K); fr(x, y + 2 * s, 36 * s, 16 * s, K);
    fr(x + 2 * s, y + 2 * s, 32 * s, 16 * s, W);
    fr(x + 6 * s, y + 6 * s, 22 * s, 2 * s, K); fr(x + 6 * s, y + 11 * s, 14 * s, 2 * s, K);
    fr(x + 6 * s, y + 18 * s, 6 * s, 4 * s, K); fr(x + 8 * s, y + 18 * s, 2 * s, 2 * s, W);
    ctx.globalAlpha = was;
  }
}

// The rebel pile at the foot: a stepped heap two cells high, darker at its
// core, wider by a cell a power of ten of rebel.
export function drawRebelPile() {
  if (!S.after) return;
  const cols = Math.min(8, 2 + Math.floor(Math.log10(1 + S.after.rebel)));
  const d = frame(pileX(), afterFloor());
  for (let j = 0; j < cols; j++) {
    const hh = Math.max(1, Math.round(2 * Math.sin(Math.PI * (j + 0.5) / cols)));
    for (let r = 0; r < hh; r++) d.c(j, -1 - r, 3 + ((j + r) % 3 === 0 ? 1 : 0) - (r === hh - 1 ? 1 : 0));
  }
}
export const pedestalNow = now;
