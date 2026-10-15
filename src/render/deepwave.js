// The deep's swell (DESIGN.md, "The deep's water"): one wide band at a time
// crossing the deep left to right, pushing what it passes right and up, then
// letting it ease back with a slight overshoot. Read off the clock alone, in
// the deep's own cells, so the band is in the water rather than on the glass:
// the camera moves under it, and two frames at one time agree.
//
// Wave n sets off near n slots in, from half its width left of the deep's
// left edge, at its feel's speed. A point's share of a wave is a fraction of
// the push: it climbs smoothly to the whole push as the band crosses it,
// then settles toward `keep` -- a star's nought, a mote's half -- swinging
// once past it on the way.

import { P, DEEP_W, DEEP_WAVE } from '../config.js';
import { deepX0 } from '../deep/place.js';
import { hash } from './flicker.js';

const W = DEEP_WAVE, TAU = Math.PI * 2;
const smooth = u => (u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u));

// The feel dealt to wave n, by its share, off the seeded sequence.
function feelOf(n) {
  const roll = hash(n * 1.618 + W.seed * 101.3);
  let acc = 0;
  for (let i = 0; i < W.feels.length; i++) { acc += W.feels[i].share; if (roll < acc) return i; }
  return W.feels.length - 1;
}
const startOf = n => n * W.slot + (hash(n * 0.731 + W.seed * 7.7) * 2 - 1) * W.jitter;

// How long after it sets off a wave is still asked of anywhere: across the
// whole deep and a wide window's worth past it at the slowest feel, then its
// tail.
const slowest = Math.min(...W.feels.map(f => (W.span + f.width) / f.cross));
const LIFE = (DEEP_W / P * 2 + W.span) / slowest + W.tailS;

// The waves still moving at `tS`, each as its feel, its speed, how long its
// band takes to pass a point, and when its middle would cross world column
// nought. Two times' lists are kept, the frame's and the one before it, which
// the motes ask of in turn.
const kept = [{ at: NaN, list: [] }, { at: NaN, list: [] }];
let older = 0;
export function wavesAt(tS) {
  if (kept[0].at === tS) return kept[0].list;
  if (kept[1].at === tS) return kept[1].list;
  const slot = kept[older];
  older ^= 1;
  slot.at = tS;
  const list = slot.list = [];
  const x0 = deepX0() / P;
  for (let n = Math.floor((tS + W.jitter) / W.slot); n >= 0; n--) {
    const t0 = startOf(n);
    if (t0 > tS) continue;
    if (tS - t0 > LIFE) break;
    const f = W.feels[feelOf(n)], v = (W.span + f.width) / f.cross;
    // seconds at which the middle would cross column nought
    list.push({ n, feel: feelOf(n), f, v, tb: f.width / v, at0: t0 - (x0 - f.width / 2) / v });
  }
  return list;
}

// A point at deep column `x` (cells) at `tS`: how far it is pushed right and
// lifted, in cells, and how deep inside a band it sits (0..1, times the
// band's brightening), into `out`. `keep` is the share of the push it keeps.
export function shiftAt(x, tS, keep, out) {
  let dx = 0, dy = 0, glow = 0;
  for (const w of wavesAt(tS)) {
    const tau = tS - (w.at0 + x / w.v), u = tau / w.tb;
    if (u <= -0.5) continue;
    if (u < 0.5) {
      dx += smooth(u + 0.5) * w.f.push;
      dy += Math.sin(Math.PI * (u + 0.5)) * w.f.lift;
      const c = Math.cos(Math.PI * u);
      glow += c * c * w.f.bright;
      continue;
    }
    const s = tau - w.tb / 2;
    const back = s > W.tailS ? 0 : Math.exp(-s / W.settleS) * Math.cos(TAU * s / W.swingS);
    dx += (keep + (1 - keep) * back) * w.f.push;
  }
  out[0] = dx; out[1] = dy; out[2] = glow;
  return out;
}

// The next wave, of at least feel `least` (0 gentle, 1 medium, 2 strong),
// whose middle crosses deep column `x` after `tS`: when, and its feel.
export function nextWave(x, tS, least = 0) {
  const x0 = deepX0() / P;
  for (let n = Math.max(0, Math.floor((tS - LIFE) / W.slot)); n < Math.floor(tS / W.slot) + 1000; n++) {
    const k = feelOf(n);
    if (k < least) continue;
    const f = W.feels[k], v = (W.span + f.width) / f.cross;
    const at = startOf(n) + (x - (x0 - f.width / 2)) / v;
    if (at > tS) return { at, feel: k };
  }
  return null;
}

// Cells a wave can carry a point from: right of where it rests (the push),
// left of it (the overshoot) and under it (the lift), with every wave of a
// strong feel overlapping at its worst.
const most = k => Math.ceil(Math.max(...W.feels.map(f => f[k])));
export const WAVE_REACH = { left: most('push') + 1, right: Math.ceil(most('push') / 2), down: most('lift') + 1 };
