// The cloud floor, floor A (docs/mocks/act3-place-2026-10-18, section 1, "the
// billow edge"): the line every body stands on goes lumpy, puffs one or two
// cells high stepped on the grid and pressed flat under every station
// (after/place.js, `floorProfile`); under it, the cloud, white, with two
// fainter puff contours drifting slowly at two depths so the floor reads as
// layered cloud. They are lines, not speckle. Each convex corner of a puff is
// cut by one 2 px step, so it reads round when near and soft when far.

import { P, GREY, AFTER_W, AFTER_DRIFT_ROWS, AFTER_DRIFT_RATE, AFTER_BILLOW_SEED, AFTER_BUILD_FADE_S } from '../../config.js';
import { S } from '../../state.js';
import { afterX0, afterFloor, floorProfile, floorFlats, billow, notchX, crowdLip, sitesKey, sited } from '../../after/place.js';
import { ctx } from '../ctx.js';
import { K, W, PALE, now, clamp01, hash } from './kit.js';

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

// A contour that drifts: a run of one-cell puffs in `tone`, sliding a cell
// at a time and crossfaded between the two cells it is between, so it never
// jumps. `gaps` of its columns are left open, so the deeper of the two reads
// fainter in the same pale tone.
const PERIOD = 40;
let drifts = null;
function drifting(k, j0, j1, y, tone, gaps = 0) {
  drifts ||= AFTER_DRIFT_ROWS.map((_, i) => billow(Math.ceil(AFTER_W / P) + PERIOD + 2, AFTER_BILLOW_SEED + 11 + i * 12, 1));
  const s = now() * AFTER_DRIFT_RATE[k], i = Math.floor(s), f = s - i;
  for (const [off, a] of [[i, 1 - f], [i + 1, f]]) {
    const o = ((off % PERIOD) + PERIOD) % PERIOD, el = drifts[k];
    const was = ctx.globalAlpha;
    ctx.globalAlpha = was * a;
    const view = j => el[Math.max(0, j + o) % el.length];
    for (let j = j0; j < j1; j++) {
      if (gaps && hash(((j + o) % el.length) * 3.7 + k) < gaps) continue;
      const v = view(j), x = afterX0() + j * P, yy = y - v * P;
      const l = view(j - 1), r = view(j + 1), cutL = l < v, cutR = r < v;
      fr(x + (cutL ? 2 : 0), yy, P - (cutL ? 2 : 0) - (cutR ? 2 : 0), 2, tone);
      if (v !== l) fr(v > l ? x : x - 2, y - Math.max(v, l) * P + 2, 2, Math.abs(v - l) * P, tone);
    }
    ctx.globalAlpha = was;
  }
}

// The profile as it stood before a station was ordered, and since when: the
// puffs under a newly taken ground fade out as its flat line fades in, never
// popped. Drawing state only.
let was = null, wasKey = null, changedAt = -1e9;
export function drawFloor() {
  const el = floorProfile(), top = afterFloor(), bot = S.camY + S.viewH + P;
  const j0 = Math.max(0, Math.floor((S.camX - afterX0()) / P) - 1);
  const j1 = Math.min(el.length, Math.ceil((S.camX + S.viewW - afterX0()) / P) + 2);
  const key = sitesKey();
  if (key !== wasKey) { if (wasKey != null) { changedAt = now(); } else was = el.slice(); wasKey = key; }
  const f = clamp01((now() - changedAt) / AFTER_BUILD_FADE_S);
  if (f >= 1 || now() < changedAt) was = el.slice();
  const moving = j => f < 1 && (was[j] || 0) !== (el[j] || 0);
  // The notch beside the sawdust heap: a gap in the line two cells wide,
  // there once the saw mill's ground is taken.
  const n0 = sited('mill') ? Math.round((notchX() - afterX0()) / P) : -9, inNotch = j => j >= n0 && j < n0 + 2;
  edge(el, j0, j1, afterX0(), top, K, true, bot, j => inNotch(j) || moving(j) || moving(j - 1));
  if (f < 1) {
    const g = ctx.globalAlpha, near = j => !(moving(j) || moving(j - 1)) || inNotch(j);
    ctx.globalAlpha = g * f; edge(el, j0, j1, afterX0(), top, K, false, bot, near);
    ctx.globalAlpha = g * (1 - f); edge(was, j0, j1, afterX0(), top, K, false, bot, near);
    ctx.globalAlpha = g;
  }
  // A pale dash under a valley's line, where two puffs meet.
  const flats = floorFlats();
  for (let j = Math.max(1, j0); j < Math.min(j1, el.length - 1); j++) {
    if (el[j] === 0 && (el[j - 1] > 0 || el[j + 1] > 0) && !flats.some(([a, b]) => j >= a - 1 && j < b + 1)) fr(afterX0() + j * P + 2, top + 4, P - 4, 2, PALE);
  }
  AFTER_DRIFT_ROWS.forEach((rows, k) => { if (bot - top > P * (rows + 1)) drifting(k, j0, j1, top + rows * P, PALE, k ? 0.45 : 0); });
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
