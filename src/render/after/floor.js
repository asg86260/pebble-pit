// The cloud floor, floor A (docs/mocks/act3-place-2026-10-18, section 1, "the
// billow edge"): the line every body stands on goes lumpy, puffs one or two
// cells high stepped on the grid and pressed flat under every station
// (after/place.js, `floorProfile`): the near layer's ground, over the cloud
// floor seen in depth (render/after/cloudfloor.js). Each convex corner of a
// puff is cut by one 2 px step, so it reads round when near and soft when far.

import { P, GREY, AFTER_BUILD_FADE_S } from '../../config.js';
import { S } from '../../state.js';
import { afterX0, afterFloor, floorProfile, floorFlats, notchX, crowdLip, sitesKey, sited } from '../../after/place.js';
import { ctx } from '../ctx.js';
import { K, W, PALE, now, clamp01 } from './kit.js';

const fr = (x, y, w, h, tone) => { ctx.fillStyle = GREY[tone]; ctx.fillRect(x, y, w, h); };

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
export function drawFloor() {
  // Under the line is the cloud floor (render/after/cloudfloor.js), and the
  // line is drawn only where something stands on it -- a station's ground, a
  // tree's foot: across the open floor the cloud floor itself is the ground,
  // and a ruled line the width of the window would cut it in two.
  const el = floorProfile(), top = afterFloor(), bot = top + 2, flats = floorFlats();
  const j0 = Math.max(0, Math.floor((S.camX - afterX0()) / P) - 1);
  const j1 = Math.min(el.length, Math.ceil((S.camX + S.viewW - afterX0()) / P) + 2);
  const bare = j => !flats.some(([a, b]) => j >= a && j < b);
  const key = sitesKey();
  if (key !== wasKey) { if (wasKey != null) { changedAt = now(); } else was = el.slice(); wasKey = key; }
  const f = clamp01((now() - changedAt) / AFTER_BUILD_FADE_S);
  if (f >= 1 || now() < changedAt) was = el.slice();
  const moving = j => f < 1 && (was[j] || 0) !== (el[j] || 0);
  // The notch beside the sawdust heap: a gap in the line two cells wide,
  // there once the saw mill's ground is taken.
  const n0 = sited('mill') ? Math.round((notchX() - afterX0()) / P) : -9, inNotch = j => j >= n0 && j < n0 + 2;
  edge(el, j0, j1, afterX0(), top, K, true, bot, j => bare(j) || inNotch(j) || moving(j) || moving(j - 1));
  if (f < 1) {
    const g = ctx.globalAlpha, near = j => !(moving(j) || moving(j - 1)) || inNotch(j);
    ctx.globalAlpha = g * f; edge(el, j0, j1, afterX0(), top, K, false, bot, near);
    ctx.globalAlpha = g * (1 - f); edge(was, j0, j1, afterX0(), top, K, false, bot, near);
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
