// What every part of the afterlife shares: its own chance, its clock, and a
// body's walk.
//
// The act draws its chance off a word of its own kept in `S.after.seed`, never
// the yard's generator (rng.js): the yard below keeps running (call 1) and a
// cloud drifting in up here must not move the yard's run off the stream its
// checks were seeded on. Kept in the save, so a reloaded afterlife goes on
// drawing where it left off.

import { S } from '../state.js';
import { AFTER_WALK } from '../config.js';
import { secs, walkLine } from '../placebodies.js';

export const A = () => S.after;

// A number in [0, 1) off the act's own word (mulberry32, as rng.js).
export function arand() {
  const a = S.after;
  const s = a.seed = ((a.seed | 0) + 0x6D2B79F5) | 0;
  let t = s;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
export const apick = list => list[Math.floor(arand() * list.length)];

// A frame's seconds, clamped, and one frame of a body's straight walk toward
// (tx, ty), true once it stands there: the place body engine's
// (placebodies.js), at the act's pace. Bodies walk; nothing up here is set
// down where it is wanted.
export { secs };
export const walk = (w, tx, ty, dt) => walkLine(w, tx, ty, AFTER_WALK, dt);

// A fresh id for anything the act keeps a list of.
export const nextId = () => { const a = S.after; a.ids = (a.ids || 0) + 1; return a.ids; };
