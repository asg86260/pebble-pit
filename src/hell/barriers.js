// The barriers (DESIGN.md, "Acts 3 and 4", act 4, "The barriers: an attempt
// is work, not a fight").
//
// A barrier across each chamber's far side, one a row of HELL_TIERS --
// rubble, the bone wall, the lava gate, the anchor chains and, last, the
// cage -- each a block of cells that comes down a piece at a time over
// BARRIER_BLOWS blows. Barrier i yields only to tool i + 1: a lesser tool
// rings off and nothing comes loose. The cells down are the blows taken
// (`S.hell.blows`), so a reload draws the same hole; each cell knocked loose
// falls (`S.hell.pieces`), lands at the barrier's foot as spoil
// (`walls[i].loose`) and is carried to the chamber's heap by a hauler. A
// barrier has no bill and no health bar. Its fall opens the next chamber
// (`S.hell.chamber`), and is told to the story once (`hellWallDue`).
//
// The wall gang -- miners taken off their faces, `S.hell.gang` -- works the
// deepest barrier reached once a tool exists that it yields to, with the tool
// carried down to it (`walls[i].tool`); the pair's click works it too.

import { S } from '../state.js';
import { P, HELL_TIERS, BARRIER_BLOWS, PIECE_FALL } from '../config.js';
import { barrierBox, chamberFloor } from './place.js';

const N = () => HELL_TIERS.length;
export const barrierCells = i => { const b = barrierBox(i); return (b.w / P) * (b.h / P); };
export const barrierFallen = i => !!S.hell && (S.hell.blows[i] || 0) >= BARRIER_BLOWS[i];
// How far barrier `i` has come down, 0..1, off its blows taken.
export const barrierDown = i => (S.hell ? Math.min(1, (S.hell.blows[i] || 0) / BARRIER_BLOWS[i]) : 0);
// Cells knocked out of barrier `i`.
export const cellsDown = i => Math.floor(barrierDown(i) * barrierCells(i));
// The tool tier barrier `i` yields to.
export const wallWants = i => i + 1;

// The order a barrier's cells come out in: the passage's middle first,
// working outward, each cell nudged by a fixed hash so the hole is ragged.
// Built once a barrier; the drawing and the pieces read the same order.
const ORDERS = [];
export function cellOrder(i) {
  if (ORDERS[i]) return ORDERS[i];
  const b = barrierBox(i), cols = b.w / P, rows = b.h / P;
  const cells = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const h = ((((c + 1) * 73856093) ^ ((r + 1) * 19349663) ^ ((i + 1) * 83492791)) >>> 0) % 1000 / 1000;
    const d = Math.hypot((c - (cols - 1) / 2) / cols, (r - rows * 0.55) / rows) + h * 0.35;
    cells.push({ c, r, d });
  }
  cells.sort((a, b2) => a.d - b2.d);
  return (ORDERS[i] = cells.map(({ c, r }) => ({ c, r })));
}

// The barrier the gang can work now: the deepest reached, still standing,
// with a tool made that it yields to; -1 when there is none.
export function workableWall() {
  const h = S.hell, i = h.chamber;
  if (i >= N() || barrierFallen(i)) return -1;
  return h.tool >= wallWants(i) ? i : -1;
}

// One blow at barrier `i` with tool `tool`: 'shut' (not reached), 'fallen',
// 'crust' (a flare's slag chipped), 'ring' (the wrong tool) or 'hit'; a hit
// may knock cells loose, and the last one brings it down.
export function blowWall(i, tool) {
  const h = S.hell;
  if (i > h.chamber) return 'shut';
  if (barrierFallen(i)) return 'fallen';
  const w = h.walls[i];
  if (w.crust > 0) { w.crust--; return 'crust'; }
  if (tool < wallWants(i)) { h.rings++; return 'ring'; }
  const before = cellsDown(i);
  h.blows[i] = (h.blows[i] || 0) + 1;
  const after = cellsDown(i);
  const order = cellOrder(i), b = barrierBox(i);
  for (let k = before; k < after; k++) {
    const { c, r } = order[k];
    h.pieces.push({ b: i, x: b.x + c * P, y: b.y + r * P, vy: 0 });
  }
  if (barrierFallen(i)) fall(i);
  return 'hit';
}

// A barrier down: the chamber behind it opens, and its fall is owed to the
// story. The cage's fall is the climax (cage.js), not a wall beat.
function fall(i) {
  const h = S.hell;
  if (i < N() - 1) h.chamber = Math.max(h.chamber, i + 1);
}

// Whether a world point is on barrier `i` while it stands.
export const onBarrier = (i, x, y) => {
  const b = barrierBox(i);
  return !barrierFallen(i) && x >= b.x - P && x <= b.x + b.w + P && y >= b.y - P && y <= b.y + b.h;
};

// A click in hell on a barrier: the pair's blow with the best tool made.
export function strikeWall(x, y) {
  const h = S.hell;
  if (!h) return null;
  for (let i = 0; i <= Math.min(h.chamber, N() - 1); i++) {
    if (onBarrier(i, x, y)) return { wall: i, did: blowWall(i, h.tool) };
  }
  return null;
}

// One frame of the falling pieces: each drops to its chamber's floor and
// lies there as spoil.
export function stepBarriers(c) {
  const h = S.hell, dt = c.dt / 1000;
  if (!h.pieces.length) return;
  const keep = [];
  for (const p of h.pieces) {
    p.vy += PIECE_FALL * dt;
    p.y += p.vy * dt;
    const floor = chamberFloor(p.b) - P;
    if (p.y < floor) { keep.push(p); continue; }
    h.walls[p.b].loose++;
  }
  h.pieces = keep;
}

// --- the story's seams -----------------------------------------------------
// The first barrier (not the cage) whose fall the story has not been told,
// or -1. A beat calls `tellWall` when it takes it.
export function hellWallDue() {
  const h = S.hell;
  if (!h) return -1;
  for (let i = 0; i < N() - 1; i++) if (barrierFallen(i) && !h.told.includes(i)) return i;
  return -1;
}
export function tellWall(i) {
  const h = S.hell;
  if (h && !h.told.includes(i)) h.told.push(i);
}
// Every barrier down, in order.
export const wallsFallen = () => HELL_TIERS.map((_, i) => i).filter(barrierFallen);
