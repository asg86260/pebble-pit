// Scales: knocked off the serpent, fallen through the water, lying on the
// deep's floor. The bed is the deep's purse, the way the pit is the yard's.
//
// Anything that piles up is a cell in a plot, so the floor of the deep is a
// sand grid like the pit (`deepBed` in state.js) and a scale is counted when
// it lands in it, never when it is knocked loose: `S.scales` is the bed's
// cell count and nothing else, kept here and set nowhere else. What is in
// the water on its way down, or on its way up to a station that paid with
// it, is this session's and a reload finds it landed or gone.
//
// Track SERPENT owns this file (docs/wave-serpent.md).

import { S, deepBed } from '../state.js';
import { P, SHADES, DEEP_W, DEEP_BED_ROWS, DEEP_GRAV, DEEP_DRAG, DEEP_CURRENT,
         DEEP_CURRENT_MS, SCALE_KICK, SCALE_SHADE, SCALE_SPREAD, LIFT_PACE, LIFT_FLECKS,
         LIFT_STAGGER, SETTLE_BUDGET } from '../config.js';
import { put, addGrain, settleSome, recount, wakeGrid, topRow, surfaceY, colOf, shadeNear } from '../grid.js';
import { makePainter } from '../painter.js';
import { frames, now } from '../clock.js';
import { rand } from '../rng.js';
import { earned } from '../income.js';
import { deepX0, deepX1, deepFloor } from './place.js';

// The push of the deep's current at a moment: one slow turn, so a shed cloud
// leans one way for a while and then the other.
const current = t => DEEP_CURRENT * Math.sin(2 * Math.PI * t / DEEP_CURRENT_MS);

// The bed's count is the purse; said in one place so nothing else writes it.
const tally = () => { S.scales = deepBed.n; };

// Loose `n` scales from (x, y): they sink and are counted where they land.
export const shed = (x, y, n) => {
  for (let i = 0; i < n; i++) {
    S.sinking.push({ x, y, vx: (rand() * 2 - 1) * SCALE_KICK, vy: -rand() * SCALE_KICK,
                     s: shadeNear(SCALE_SHADE, SCALE_SPREAD) });
  }
};

// `n` scales laid straight on the bed, for a setup that is not about the fall
// (`__scales`, and the board's grant). Spread across the whole floor, as a
// bed that has been filling for a while would lie.
export function layScales(n) {
  if (!deepBed.grid) return 0;
  let laid = 0;
  for (let i = 0; i < n; i++) {
    const x = deepBed.x + rand() * deepBed.cols * P;
    if (!addGrain(deepBed, x, null, shadeNear(SCALE_SHADE, SCALE_SPREAD), true)) break;
    laid++;
  }
  if (laid) S.seenScale = true;
  tally();
  return laid;
}

// Pay `n` scales: taken off the top of the bed and lifted toward (toX, toY).
// True if the bed held them. Taken column by column outward from the one
// under the payer, whole columns at a time: a dip dug at the station's foot
// that the bed slumps back into over the next frames, the way a bite out of
// the pit does.
export const spendScales = (n, toX, toY) => {
  n = Math.floor(n);
  if (!(n > 0)) return true;
  if (!deepBed.grid || deepBed.n < n) return false;
  const home = Math.max(0, Math.min(deepBed.cols - 1, colOf(deepBed, toX)));
  const shown = Math.min(n, LIFT_FLECKS);
  let left = n, sent = 0;
  const takeFrom = c => {
    for (let r = topRow(deepBed, c); r >= 0 && left > 0; r--) {
      const v = deepBed.grid[r * deepBed.cols + c];
      if (!v) continue;
      // Every so many cells one goes up as a fleck standing for the rest, so
      // a big bill is a stream and not a column of thousands.
      if (sent < shown && (n - left) * shown >= sent * n) {
        S.lifting.push({ x: deepBed.x + c * P, y: deepFloor() - (r + 1) * P, tx: toX, ty: toY,
                         s: v, wait: sent * LIFT_STAGGER });
        sent++;
      }
      put(deepBed, c, r, 0);
      left--;
    }
  };
  for (let d = 0; left > 0 && d < deepBed.cols; d++) {
    if (home - d >= 0) takeFrom(home - d);
    if (d && left > 0 && home + d < deepBed.cols) takeFrom(home + d);
  }
  tally();
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
  tally();
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
    g.vx *= Math.pow(DEEP_DRAG, f);
    g.vy = g.vy * Math.pow(DEEP_DRAG, f) + DEEP_GRAV * f;
    g.x = Math.max(lo, Math.min(hi, g.x + (g.vx + push) * f));
    g.y += g.vy * f;
    const col = Math.max(0, Math.min(deepBed.cols - 1, colOf(deepBed, g.x)));
    if (g.y >= surfaceY(deepBed, col)) {
      // A bed full to its brim has nowhere to put one more, and a scale with
      // nowhere to lie is lost to the dark rather than counted in the air.
      if (addGrain(deepBed, g.x, null, g.s, true)) { S.seenScale = true; earned('scale', 1); }
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
  tally();
};

// On the save the bed is the height of every column: every cell is a scale,
// and the speckle is dealt again on the way back in from a stream of its own,
// so a reload does not move the game's chance on.
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
    out.deepBed = { cols: deepBed.cols, heights };
  },
  read(s) {
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
    tally();
  },
  blank() {
    if (!deepBed.grid) return;
    deepBed.grid.fill(0);
    recount(deepBed);
    deepBed.painter.repaint();
    tally();
  }
};
