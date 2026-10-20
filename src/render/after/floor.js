// The main plane's ground (the owner, 2026-10-20: "the plane should static
// cloud like paths, not a flat plane"): a path of cloud on the world itself,
// moving with the camera as the yard's ground does. Its near edge is floor
// A's line (docs/mocks/act3-place-2026-10-18, "the billow edge"): puffs one
// or two cells high stepped on the grid and pressed flat under every station
// (after/place.js, `floorProfile`), so it stands where the sim stands it.
// Under it paper, GROUND_PATH.depth cells down to the path's far edge, a pale
// billow line. Each convex corner of a puff is cut by one 2 px step. Static:
// nothing on it moves but what is built on it.

import { P, GREY, AFTER_BUILD_FADE_S, GROUND_PATH } from '../../config.js';
import { S } from '../../state.js';
import { afterX0, afterFloor, floorProfile, notchX, crowdLip, sitesKey, sited, billow } from '../../after/place.js';
import { ctx } from '../ctx.js';
import { fillOnPixels } from '../frame.js';
import { K, W, PALE, MID, now, clamp01 } from './kit.js';

// Every fill on whole device pixels, so a thin line never blends into a
// tone between the four.
const fr = (x, y, w, h, tone) => { ctx.fillStyle = GREY[tone]; fillOnPixels(ctx, x, y, w, h); };

// A stepped top edge along a profile, columns j0..j1 of it, in `tone`, with
// paper under it down to yBot when `fill`; columns `skip` says are left open.
function edge(el, j0, j1, x0, yTop, tone, fill, yBot, skip) {
  for (let j = j0; j < j1; j++) {
    if (skip && skip(j)) continue;
    const x = x0 + j * P, y = yTop - (el[j] || 0) * P;
    const cutL = j > 0 && (el[j - 1] || 0) < (el[j] || 0), cutR = (el[j + 1] || 0) < (el[j] || 0);
    if (fill) fr(x, y + (cutL || cutR ? 2 : 0), P, yBot - y, W);
    fr(x + (cutL ? 2 : 0), y, P - (cutL ? 2 : 0) - (cutR ? 2 : 0), 2, tone);
    if (j > 0 && (el[j] || 0) !== (el[j - 1] || 0) && !(skip && skip(j - 1))) {
      const hi = yTop - Math.max(el[j], el[j - 1]) * P, lo = yTop - Math.min(el[j], el[j - 1]) * P;
      fr(el[j] > el[j - 1] ? x : x - 2, hi + 2, 2, lo - hi, tone);
    }
  }
}

// The profile as it stood before a station was ordered, and since when: the
// puffs under a newly taken ground fade out as its flat line fades in, never
// popped. Drawing state only.
let was = null, wasKey = null, changedAt = -1e9;
// The far edge's profile, repeating every FAR_N cells.
const FAR_N = 512;
let far = null;
export function drawFloor() {
  const el = floorProfile(), top = afterFloor(), bot = top + GROUND_PATH.depth * P;
  const j0 = Math.floor((S.camX - afterX0()) / P) - 1;
  const j1 = Math.ceil((S.camX + S.viewW - afterX0()) / P) + 2;
  // the path's far edge, a pale billow line a few cells down
  far ||= billow(FAR_N, GROUND_PATH.seed, 1);
  for (let j = j0; j < j1; j++) {
    const v = far[((j % FAR_N) + FAR_N) % FAR_N], l = far[(((j - 1) % FAR_N) + FAR_N) % FAR_N], x = afterX0() + j * P;
    fr(x, bot + v * P, P, 2, PALE);
    if (v !== l) fr(v > l ? x : x - 2, bot + Math.min(v, l) * P, 2, Math.abs(v - l) * P + 2, PALE);
  }
  const key = sitesKey();
  if (key !== wasKey) { if (wasKey != null) { changedAt = now(); } else was = el.slice(); wasKey = key; }
  const f = clamp01((now() - changedAt) / AFTER_BUILD_FADE_S);
  if (f >= 1 || now() < changedAt) was = el.slice();
  const moving = j => f < 1 && (was[j] || 0) !== (el[j] || 0);
  // The notch beside the sawdust heap: a gap in the line two cells wide,
  // there once the saw mill's ground is taken.
  const n0 = sited('mill') ? Math.round((notchX() - afterX0()) / P) : -9, inNotch = j => j >= n0 && j < n0 + 2;
  edge(el, j0, j1, afterX0(), top, MID, true, bot, j => inNotch(j) || moving(j) || moving(j - 1));
  if (f < 1) {
    const g = ctx.globalAlpha, near = j => !(moving(j) || moving(j - 1)) || inNotch(j);
    ctx.globalAlpha = g * f; edge(el, j0, j1, afterX0(), top, MID, false, bot, near);
    ctx.globalAlpha = g * (1 - f); edge(was, j0, j1, afterX0(), top, MID, false, bot, near);
    ctx.globalAlpha = g;
  }
  // The notch's walls: the line turned down a cell, then the cloud's depth in
  // pale steps either side, the gap left white.
  if (!sited('mill')) return;
  const nx = notchX();
  fr(nx - 2, top, 2, P + 2, K); fr(nx + 2 * P, top, 2, P + 2, K);
  for (let r = 1; r < 4; r++) { fr(nx - 2, top + r * P, 2, P, PALE); fr(nx + 2 * P, top + r * P, 2, P, PALE); }
}

// The puffs again over God's crowd, drawn after its front row (render/
// aftercrowd.js): the crowd stands on the one floor, shoulder to shoulder,
// and a puff rising in front of a file hides its feet, so the crowd reads as
// standing in the cloud without its rows climbing into each other.
export function drawFloorLip() {
  const el = floorProfile(), top = afterFloor(), [a, b] = crowdLip();
  const j0 = Math.max(a, Math.floor((S.camX - afterX0()) / P) - 1);
  const j1 = Math.min(b, Math.ceil((S.camX + S.viewW - afterX0()) / P) + 2);
  if (j1 > j0) edge(el, j0, j1, afterX0(), top, K, true, top);
}
