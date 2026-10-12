// Scales: knocked off the serpent, fallen through the water, lying loose on
// the deep's floor, and crushed. The crusher is the deep's purse (DESIGN.md,
// "The crusher"): a scale is money once it lands in the hopper and never
// before, the way a grain is the yard's once it is in the pit.
//
// Anything that piles up is a cell in a plot, so the floor of the deep is a
// sand grid like the pit (`deepBed` in state.js): the scales lying loose,
// waiting for a gatherer or the hand. `S.scales` is the crushed account, kept
// here and set nowhere else (`crush`, `spendScales`). What is in the water on
// its way down, into the hopper, or up to a station that paid with it, is this
// session's, and a reload finds it landed or gone.

import { S, deepBed } from '../state.js';
import { P, SHADES, DEEP_W, DEEP_BED_ROWS, DEEP_GRAV, DEEP_DRAG, DEEP_CURRENT,
         DEEP_CURRENT_MS, SCALE_KICK, SCALE_SHADE, SCALE_SPREAD, LIFT_PACE, LIFT_FLECKS,
         LIFT_STAGGER, SETTLE_BUDGET, DEEP_BED_BRIM, GATHER_TOSS_FRAMES, GATHER_TOSS_RISE, GATHER_TOSS_STAGGER,
         CRUSH_HEAT, CRUSH_HEAT_KEEP, SPRAY_GAIN, SPRAY_FAN } from '../config.js';
import { put, addGrain, settleSome, recount, wakeGrid, topRow, surfaceY, colOf, shadeNear } from '../grid.js';
import { makePainter } from '../painter.js';
import { frames, now } from '../clock.js';
import { rand } from '../rng.js';
import { earned } from '../income.js';
import { deepX0, deepX1, deepFloor, inHopper, hopperRect } from './place.js';

// The push of the deep's current at a moment: one slow turn, so a shed cloud
// leans one way for a while and then the other.
export const current = t => DEEP_CURRENT * Math.sin(2 * Math.PI * t / DEEP_CURRENT_MS);

// Scales into the crusher: the account, said in one place so nothing else
// writes it up. `crushes` is for the drawing: each landing warms the fire
// and spits its own sparks, so each keeps its moment (and a number for its
// sparks' throw), forgotten once it has burned out or been crowded off.
// A refund coming home is the player's own, not income.
let crushed = 0;
export function crush(n, income = true) {
  if (!(n > 0)) return;
  S.scales += n;
  S.seenScale = true;
  const t = now(), gone = t - CRUSH_HEAT.keepS * 1000;
  const list = S.crushes;
  for (let i = 0; i < Math.min(n, CRUSH_HEAT_KEEP); i++) list.push({ at: t, id: crushed++ });
  let drop = Math.max(0, list.length - CRUSH_HEAT_KEEP);
  while (drop < list.length && list[drop].at < gone) drop++;
  if (drop) list.splice(0, drop);
  if (income) earned('scale', n);
}

// Loose `n` scales from (x, y): they sink, and lie where they land. A blow's
// `spray` ({ dir, k }) sends them out of the edge it bit -- up for -1, down
// for 1 -- in a fan, faster for a bigger blow (`k`, 0..1); without one they
// drift off in a little cloud of their own, the way a held weapon bleeds them.
// No more are let go than the bed has room for, counting those already in
// the water: past that a scale has nowhere to lie and is lost to the dark
// (`stepScales`), so it would be a fall drawn for nothing.
export const shed = (x, y, n, spray = null) => {
  if (deepBed.grid) n = Math.min(n, deepBed.cols * deepBed.rows - deepBed.n - S.sinking.length);
  for (let i = 0; i < n; i++) {
    let vx, vy;
    if (spray) {
      const a = spray.dir * Math.PI / 2 + (rand() * 2 - 1) * SPRAY_FAN;
      const v = SCALE_KICK * (1 + SPRAY_GAIN * spray.k) * (0.4 + 0.6 * rand());
      vx = Math.cos(a) * v; vy = Math.sin(a) * v;
    } else {
      vx = (rand() * 2 - 1) * SCALE_KICK; vy = -rand() * SCALE_KICK;
    }
    S.sinking.push({ x, y, vx, vy, s: shadeNear(SCALE_SHADE, SCALE_SPREAD) });
  }
};

// `n` scales laid loose on the bed, for a setup that is not about the fall.
// Spread across the whole floor, as a bed that has been filling for a while
// would lie.
export function looseScales(n) {
  if (!deepBed.grid) return 0;
  let laid = 0;
  for (let i = 0; i < n; i++) {
    const x = deepBed.x + rand() * deepBed.cols * P;
    if (!addGrain(deepBed, x, null, shadeNear(SCALE_SHADE, SCALE_SPREAD), true)) break;
    laid++;
  }
  return laid;
}

// `n` scales already crushed, for a setup that wants a purse (`__scales`, the
// board's grant).
export function layScales(n) {
  const k = Math.max(0, Math.floor(n));
  crush(k);
  return k;
}

// Up to `n` scales taken off the bed by a hand or a gatherer at world x:
// column by column outward from the one under it, off the tops, within
// `reach` px either side. Answers the shades it took, one a scale.
export function scoop(x, n, reach) {
  const got = [];
  if (!deepBed.grid || !(n > 0)) return got;
  const home = colOf(deepBed, x);
  const span = Math.max(0, Math.round(reach / P));
  for (let d = 0; d <= span && got.length < n; d++) {
    for (const c of d ? [home - d, home + d] : [home]) {
      if (c < 0 || c >= deepBed.cols || got.length >= n) continue;
      const r = topRow(deepBed, c);
      if (r < 0) continue;
      got.push(deepBed.grid[r * deepBed.cols + c]);
      put(deepBed, c, r, 0);
    }
  }
  return got;
}

// The column of the bed a gatherer should work next from x, with room for
// `want` more in its arms and its load bound for `drop`: the most scales
// banked for the swim. A stretch is worth what lies within `reach` of it, up
// to the load, and costs the swim there and on to the crusher; the best
// worth over cost wins, so a near stretch holding a load beats a tall heap
// across the deep. A stretch within `apart` columns of one in `kept` (the
// stretches the other gatherers are on) is theirs, so a second body goes for
// other scales, or along the same heap clear of the first. -1 on a bare
// floor, or one with nothing on it that is not spoken for.
export function nextStretch(x, want, drop, reach, kept = [], apart = 0) {
  if (!deepBed.grid || !deepBed.n) return -1;
  const span = Math.max(0, Math.round(reach / P));
  const lying = new Array(deepBed.cols);
  for (let c = 0; c < deepBed.cols; c++) lying[c] = topRow(deepBed, c) + 1;
  let best = -1, score = -Infinity, near = 0;
  for (let c = Math.max(0, -span); c <= Math.min(deepBed.cols - 1, span - 1); c++) near += lying[c];
  for (let c = 0; c < deepBed.cols; c++) {
    // The running sum of the stretch's columns, [c - span, c + span].
    if (c + span < deepBed.cols) near += lying[c + span];
    if (c - span - 1 >= 0) near -= lying[c - span - 1];
    if (!lying[c] || kept.some(k => Math.abs(k - c) < apart)) continue;
    const at = bedX(c);
    const v = Math.min(want, near) / (Math.abs(at - x) + Math.abs(at - drop) + P);
    if (v > score) { score = v; best = c; }
  }
  return best;
}
export const bedX = c => deepBed.x + c * P + P / 2;

// The floor at its brim: some stretch of the bed within DEEP_BED_BRIM rows of
// its top, so the gathering has fallen behind. The deep's pile-full mark.
export function bedAtBrim() {
  if (!deepBed.grid || !deepBed.n) return false;
  for (let c = 0; c < deepBed.cols; c++) if (topRow(deepBed, c) >= deepBed.rows - DEEP_BED_BRIM) return true;
  return false;
}

// Whether there are scales on the bed within `reach` of a point near its
// top: what the hand can sweep there.
export function bedNear(x, y, reach) {
  if (!deepBed.grid || !deepBed.n) return false;
  const home = colOf(deepBed, x);
  const span = Math.max(0, Math.round(reach / P));
  for (let c = Math.max(0, home - span); c <= Math.min(deepBed.cols - 1, home + span); c++) {
    const r = topRow(deepBed, c);
    if (r >= 0 && Math.abs(y - (deepFloor() - (r + 1) * P)) <= reach) return true;
  }
  return false;
}

// Scales tossed into the hopper by a gatherer: on an arc drawn in the water,
// each leaving the hand a few frames after the last, crushed where it ends.
export function tossIn(x, y, shades) {
  const h = hopperRect();
  shades.forEach((s, i) => {
    S.sinking.push({ x, y, x0: x, y0: y, tx: h.x + h.w / 2 + (rand() - 0.5) * (h.w - P * 4),
                     ty: h.y + h.h + P * 2, arc: 0, wait: i * GATHER_TOSS_STAGGER, s });
  });
}

// A bill in scales handed back (a station's reset, a waiting copy's refund):
// the payment's picture the other way. At most LIFT_FLECKS scales are tossed
// from (x, y) into the hopper, each carrying its share of `n`, and the purse
// takes them back as they land.
export function refundScales(n, x, y) {
  n = Math.floor(n);
  if (!(n > 0)) return;
  const shown = Math.min(n, LIFT_FLECKS), h = hopperRect();
  for (let i = 0; i < shown; i++) {
    const v = Math.floor(n / shown) + (i < n % shown ? 1 : 0);
    S.sinking.push({ x, y, x0: x, y0: y, tx: h.x + h.w / 2 + (rand() - 0.5) * (h.w - P * 4),
                     ty: h.y + h.h + P * 2, arc: 0, wait: i * GATHER_TOSS_STAGGER, v, back: true,
                     s: shadeNear(SCALE_SHADE, SCALE_SPREAD) });
  }
}

// Pay `n` scales out of the crusher: the account goes down, and a stream of
// flecks standing for them rises out of the hopper and drifts to (toX, toY).
// True if the purse held them.
export const spendScales = (n, toX, toY) => {
  n = Math.floor(n);
  if (!(n > 0)) return true;
  if (!(S.scales >= n)) return false;
  S.scales -= n;
  const h = hopperRect();
  const shown = Math.min(n, LIFT_FLECKS);
  for (let i = 0; i < shown; i++) {
    S.lifting.push({ x: h.x + P + rand() * (h.w - P * 2), y: h.y, tx: toX, ty: toY,
                     s: shadeNear(SCALE_SHADE, SCALE_SPREAD), wait: i * LIFT_STAGGER });
  }
  return true;
};

// The bed laid under the deep: as wide as the deep and its bottom on the
// deep's floor. A new layout moves it with the pit; the scales on it keep
// their columns.
export const wireBed = () => {
  deepBed.p = P;
  deepBed.cols = DEEP_W / P;
  deepBed.rows = DEEP_BED_ROWS;
  deepBed.x = deepX0();
  deepBed.y = deepFloor() - deepBed.rows * P;
  if (!deepBed.grid || deepBed.grid.length !== deepBed.cols * deepBed.rows) {
    deepBed.grid = new Uint8Array(deepBed.cols * deepBed.rows);
    recount(deepBed);
  }
  deepBed.blocked = null;
  deepBed.repose = false;                  // under water a heap lies down
  if (!deepBed.painter) deepBed.painter = makePainter(deepBed);
  deepBed.onPut = deepBed.painter.mark;
  deepBed.painter.repaint();
  wakeGrid(deepBed);
};

// One frame of the water: the sinking fall on the deep's gravity and drift
// on its current until they reach the bed; the paid rise to their station
// and are gone there; the bed settles.
export const stepScales = c => {
  if (!deepBed.grid) return;
  const f = frames();
  const push = current(now());
  const lo = deepX0(), hi = deepX1() - P;
  const sink = S.sinking;
  let keep = 0;
  for (let i = 0; i < sink.length; i++) {
    const g = sink[i];
    // A tossed scale rides its arc over the lip and is crushed at its end.
    if (g.arc != null) {
      if (g.wait > 0) { g.wait -= f; sink[keep++] = g; continue; }
      g.arc = Math.min(1, g.arc + f / GATHER_TOSS_FRAMES);
      g.x = g.x0 + (g.tx - g.x0) * g.arc;
      g.y = g.y0 + (g.ty - g.y0) * g.arc - Math.sin(Math.PI * g.arc) * (GATHER_TOSS_RISE + Math.max(0, g.y0 - g.ty));
      if (g.arc >= 1) { crush(g.v || 1, !g.back); continue; }
      sink[keep++] = g;
      continue;
    }
    g.vx *= Math.pow(DEEP_DRAG, f);
    g.vy = g.vy * Math.pow(DEEP_DRAG, f) + DEEP_GRAV * f;
    g.x = Math.max(lo, Math.min(hi, g.x + (g.vx + push) * f));
    g.y += g.vy * f;
    // Anything that falls into the hopper is crushed, whoever let it go.
    if (inHopper(g.x, g.y)) { crush(1); continue; }
    const col = Math.max(0, Math.min(deepBed.cols - 1, colOf(deepBed, g.x)));
    if (g.y >= surfaceY(deepBed, col)) {
      // A bed full to its brim has nowhere to put one more, and a scale with
      // nowhere to lie is lost to the dark.
      addGrain(deepBed, g.x, null, g.s, true);
      continue;
    }
    sink[keep++] = g;
  }
  sink.length = keep;

  const lift = S.lifting;
  keep = 0;
  for (let i = 0; i < lift.length; i++) {
    const g = lift[i];
    if (g.wait > 0) { g.wait -= f; lift[keep++] = g; continue; }
    const dx = g.tx - g.x, dy = g.ty - g.y, d = Math.hypot(dx, dy);
    const step = LIFT_PACE * f;
    if (d <= Math.max(P, step)) continue;              // arrived: it is the station's now
    g.x += dx / d * step;
    g.y += dy / d * step;
    lift[keep++] = g;
  }
  lift.length = keep;

  settleSome(deepBed, SETTLE_BUDGET);
};

// On the save the bed is the height of every column: every cell is a scale,
// and the speckle is dealt again on the way back in from a stream of its own,
// so a reload does not move the game's chance on. A refund still in the air
// is owed to the purse, and a reload finds it landed.
const owed = () => S.sinking.reduce((n, g) => n + (g.back ? g.v : 0), 0);
export const SAVE = {
  fields: ['deepBed'],
  write(out) {
    const heights = new Array(deepBed.cols).fill(0);
    if (deepBed.grid) {
      for (let c = 0; c < deepBed.cols; c++) {
        let n = 0;
        for (let r = 0; r < deepBed.rows; r++) if (deepBed.grid[r * deepBed.cols + c]) n++;
        heights[c] = n;
      }
    }
    out.deepBed = { cols: deepBed.cols, heights, owed: owed() };
  },
  read(s) {
    S.sinking = S.sinking.filter(g => !g.back);
    if (s.deepBed && s.deepBed.owed > 0) crush(s.deepBed.owed, false);
    if (!deepBed.grid) return;
    deepBed.grid.fill(0);
    const sv = s.deepBed;
    const heights = sv && Array.isArray(sv.heights) ? sv.heights : [];
    let seed = 1;
    const speckle = () => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      const k = seed / 0x7fffffff * 2 - 1;
      return Math.max(1, Math.min(SHADES.length, Math.round(SCALE_SHADE + k * SCALE_SPREAD)));
    };
    if (sv && sv.cols === deepBed.cols) {
      for (let c = 0; c < deepBed.cols; c++) {
        const h = Math.max(0, Math.min(deepBed.rows, heights[c] | 0));
        for (let r = 0; r < h; r++) deepBed.grid[r * deepBed.cols + c] = speckle();
      }
    } else {
      // A bed of another width: the same scales, laid flat from the left.
      let n = heights.reduce((a, h) => a + (h | 0), 0);
      for (let r = 0; r < deepBed.rows && n > 0; r++)
        for (let c = 0; c < deepBed.cols && n > 0; c++, n--) deepBed.grid[r * deepBed.cols + c] = speckle();
    }
    recount(deepBed);                        // written cell by cell, not put
    deepBed.painter.repaint();
  },
  blank() {
    if (!deepBed.grid) return;
    deepBed.grid.fill(0);
    recount(deepBed);
    deepBed.painter.repaint();
  }
};
