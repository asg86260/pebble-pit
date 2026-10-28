// One carry (DESIGN.md, "One resource system for every act", section 4): a
// body in any act carries cells. `w.load` is an array of cell values, one a
// unit, as a yard hauler's has always been, and `w.carry` is its length. A
// grain keeps its shade and a block its kind and tone through a body's arms
// and a reload, as they do through the hand.
//
// What a body can hold is a weight, as the hand's is: `haulCap()` grains, and
// a unit weighs its kind's `weight` (config/blocks.js; a grain, a find or a
// shade weighs one), so a log takes sixteen grains' room, a plank four, and
// the strength ladder means the same in every act. A body holds one of any
// kind at the least. These are the whole of the mechanism: the yard's
// haulers, the deep's gatherers and act 3's members all take, set down and
// throw through them, and each act supplies only where the units come from
// and go to. The cells themselves are cells.js (no levels in its imports, so
// the sites and the rows may use it); the weight rule is here.

import { haulCap } from './levels.js';
import { KINDS } from './config.js';
import { count, push, pop, unpop, beat } from './cells.js';
export * from './cells.js';

// How many units of `kind` a body holds: by the same weight rule as the hand,
// one at the least.
export const holds = kind => Math.max(1, Math.floor(haulCap() / KINDS[kind].weight));
// Whether the arms are full of `kind`, or cannot take another of it.
export const full = (w, kind) => count(w) >= holds(kind);
// Taken up a unit a beat: `get()` takes one from the place and returns its cell
// value, or 0 when it found none; `left()` how many are still there to take.
// True once the hands have done (full of `kind`, or none left), holding
// however many came.
export function pickUp(w, dt, kind, left, get, period) {
  if (count(w) >= holds(kind) || left() <= 0) return true;
  if (!beat(w, dt, period)) return false;
  if (left() <= 0) return true;                 // another body took the last while this beat ran
  if (!push(w, get())) return left() <= 0;
  return count(w) >= holds(kind) || left() <= 0;
}
// Set down a unit a beat: `put(v)` sets the unit of value `v` where it goes and
// says whether it went. True once the hands are empty; a place that would not
// take it leaves it in the arms and the body to find another (`unpop` is the
// same).
export function putDown(w, dt, put, period) {
  if (!count(w)) return true;
  if (!beat(w, dt, period)) return false;
  const v = pop(w);
  if (!put(v)) { unpop(w, v); return false; }
  return !count(w);
}
