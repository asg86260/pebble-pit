// The rock: how one is made, where it stands, how it is hit, and what comes off.
//
// A rock is a heightfield, not a disc: a broad hill with crags along its crest,
// sitting flat on the ground. Every cell holds how much rock is still stacked
// there, so a hit takes a sheet off the front and you dig *into* it.

import {
  P, MAX_DEPTH, ROCK_W, ROCK_H, ROCK_GROW_W, ROCK_GROW_H, ROCK_SINK, ROCK_SKY,
  TO_BENCH
} from './config.js';
import { S, floor } from './state.js';
import { at, put, addGrain, depthShade } from './grid.js';
import { blocked } from './world.js';
import { spawnSpoil } from './dust.js';
import { pickCount } from './upgrades.js';

// --- boulder ----------------------------------------------------------------
// boulder n is n sheets thick (capped) and a little wider than the last, so each
// one is a longer dig. Cells hold remaining thickness, deepest in the middle.
export function depthOf() {
  return Math.min(MAX_DEPTH, S.boulderNo);
}

// how big rock n is, in cells. It may never grow into the bench, nor out of the
// sky kept clear above the ground line
export function rockSize() {
  const w = ROCK_W + (S.boulderNo - 1) * ROCK_GROW_W;
  const h = ROCK_H + (S.boulderNo - 1) * ROCK_GROW_H;
  return {
    w: Math.max(10, Math.min(w, Math.floor((TO_BENCH - P * 14) * 2 / P))),
    h: Math.max(6, Math.min(h, Math.floor((ROCK_SKY - P * 4) / P)))
  };
}

// the rock's foot sits just under the ground line so it looks planted, not laid
export function placeRock() {
  S.cy = S.groundY + ROCK_SINK - (S.gh / 2) * P;
}

// world y of the top of the rock in a column, or the ground where there is none
export function rockTopY(c) {
  const t = S.rockTops[c];
  return t >= 0 ? S.groundY + ROCK_SINK - (S.gh - t) * P : S.groundY;
}

// the surface the crew stand on, kept per column so nobody walks it every frame
export function refreshRockTops() {
  S.rockTops = new Array(S.gw).fill(-1);
  for (let c = 0; c < S.gw; c++) {
    for (let y = 0; y < S.gh; y++) if (S.boulder[y][c]) { S.rockTops[c] = y; break; }
  }
}

// A heightfield, not a disc: a broad hill with crags along its crest, sitting
// flat on the ground. Cells hold remaining thickness, deepest at the base and
// through the middle, thinning towards the skyline.
export function makeBoulder() {
  const size = rockSize();
  S.gw = size.w;
  S.gh = size.h;
  const deep = depthOf();
  const seed = [Math.random() * 6, Math.random() * 6, Math.random() * 6,
                Math.random() < 0.5 ? -1 : 1];

  const crest = [];
  for (let x = 0; x < S.gw; x++) {
    const u = x / (S.gw - 1);
    let f = Math.pow(Math.sin(Math.PI * u), 0.42);        // broad, with steep shoulders
    f *= 1 + 0.16 * (u - 0.5) * seed[3]                   // it leans one way or the other
           + 0.05 * Math.sin(u * 6.1 + seed[0])           // and the crest is rough, not wavy
           + 0.07 * Math.sin(u * 14.7 - seed[1])
           + 0.06 * Math.sin(u * 27.3 + seed[2]);
    crest.push(Math.max(1, Math.min(S.gh, Math.round(f * S.gh))));
  }

  S.coreBuried = true;
  S.boulder = [];
  for (let y = 0; y < S.gh; y++) {
    const row = [];
    for (let x = 0; x < S.gw; x++) {
      const up = S.gh - y;                                   // 1 at the foot, S.gh at the sky
      if (up > crest[x]) { row.push(0); continue; }
      const k = crest[x] <= 1 ? 0 : (up - 1) / (crest[x] - 1);
      const mid = Math.sqrt(Math.max(0, 1 - ((x / (S.gw - 1) - 0.5) * 2) ** 2 * 0.55));
      const t = Math.sqrt(Math.max(0, 1 - k * k)) * mid;
      row.push(Math.max(1, Math.round(deep * t)));
    }
    S.boulder.push(row);
  }
  placeRock();
  refreshRockTops();
  clearApron();
}

// shift any dust the last rock left inside this one's apron out to clear ground,
// so a bigger rock never lands standing in a heap
export function clearApron() {
  if (!floor.grid) return;
  for (let c = 0; c < floor.cols; c++) {
    if (!blocked(c)) continue;
    for (let r = 0; r < floor.rows; r++) {
      const v = at(floor, c, r);
      if (!v) continue;
      put(floor, c, r, 0);
      addGrain(floor, floor.x + c * P, blocked, v);     // to the nearest clear column
    }
  }
}

export function gridToString() {
  let s = '';
  for (const row of S.boulder) for (const v of row) s += String(v);
  return s;
}

export function gridFromString(s, w, h) {
  if (typeof s !== 'string' || !w || !h || s.length !== w * h) return false;
  S.gw = w;
  S.gh = h;
  S.boulder = [];
  for (let y = 0; y < S.gh; y++) {
    const row = [];
    for (let x = 0; x < S.gw; x++) row.push(+s[y * S.gw + x] || 0);
    S.boulder.push(row);
  }
  placeRock();
  refreshRockTops();
  return true;
}

// the rock is anchored by its foot, not its middle: it grows upwards and outwards
export const cellPos = (x, y) => ({ px: S.cx + (x - S.gw / 2) * P, py: S.groundY + ROCK_SINK - (S.gh - y) * P });

export function boulderAlive() {
  for (const row of S.boulder) for (const v of row) if (v) return true;
  return false;
}

// the boulder's whole footprint, so clicking a chipped-out gap still chips
// on the rock if there is rock close by: chipped-out gaps still count, but the
// empty air below it does not, so falling dust can be caught there
// the rock's whole footprint takes a swing, so clicking its general area works
export function overBoulder(mx, my) {
  if (!boulderAlive()) return false;         // nothing left to swing at
  const half = (S.gw / 2) * P;
  const foot = S.groundY + ROCK_SINK;
  return mx > S.cx - half && mx < S.cx + half && my > foot - S.gh * P && my < foot;
}

// the cell under the cursor, or the nearest filled one if that spot is already hollow
export function pickCell(mx, my) {
  const gx = (mx - S.cx) / P + S.gw / 2;
  const gy = S.gh - (S.groundY + ROCK_SINK - my) / P;
  const hx = Math.floor(gx), hy = Math.floor(gy);
  if (S.boulder[hy]?.[hx]) return { x: hx, y: hy };

  let best = null, bestD = Infinity;
  for (let y = 0; y < S.gh; y++) {
    for (let x = 0; x < S.gw; x++) {
      if (!S.boulder[y][x]) continue;
      const d = (x + 0.5 - gx) ** 2 + (y + 0.5 - gy) ** 2;
      if (d < bestD) { bestD = d; best = { x, y }; }
    }
  }
  return best;
}

export function knockOff(mx, my) {
  const c = pickCell(mx, my);
  if (!c) return;

  const want = pickCount();
  const reach = Math.ceil(Math.sqrt(want)) + 1;
  const near = [];
  for (let dy = -reach; dy <= reach; dy++) {
    for (let dx = -reach; dx <= reach; dx++) {
      const x = c.x + dx, y = c.y + dy;
      if (!S.boulder[y]?.[x]) continue;
      near.push({ x, y, d: dx * dx + dy * dy });
    }
  }
  near.sort((a, b) => a.d - b.d);

  for (const cell of near.slice(0, want)) {
    const left = S.boulder[cell.y][cell.x];
    const shade = depthShade(left, depthOf());   // how deep it looked, for colour
    S.boulder[cell.y][cell.x] = left - 1;
    const { px, py } = cellPos(cell.x, cell.y);
    spawnSpoil(px, py, shade);
  }
  S.dirty = true;
  refreshRockTops();
}

