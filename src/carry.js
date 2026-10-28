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
// and go to.
//
// A unit is counted only when the take returned it: a take that found
// nothing (a block buried under another, a pile gone bare) leaves the arms as
// they were, so nothing is ever held that is not a unit that existed.

import { haulCap } from './levels.js';
import { KINDS } from './config.js';
import { kindOf as cellKind } from './grid.js';

// The load as an array, made on the first use (a body that never held
// anything has none, which the rules allow).
export const loadOf = w => (Array.isArray(w.load) ? w.load : (w.load = []));
export const count = w => (Array.isArray(w.load) ? w.load.length : 0);
export const isEmpty = w => count(w) === 0;
// Grains of weight in the arms.
export function weight(w) {
  let n = 0;
  if (Array.isArray(w.load)) for (const v of w.load) { const k = cellKind(v); n += k ? k.weight : 1; }
  return n;
}
// What kind the arms hold (the first unit's), or null for grains and finds,
// which are no kind.
export function loadKind(w) {
  if (!Array.isArray(w.load) || !w.load.length) return null;
  const k = cellKind(w.load[0]);
  return k ? k.key : null;
}
// How many units of `kind` a body holds: by the same weight rule as the hand,
// one at the least.
export const holds = kind => Math.max(1, Math.floor(haulCap() / KINDS[kind].weight));
// Whether the arms are full of `kind`, or cannot take another of it.
export const full = (w, kind) => count(w) >= holds(kind);
// Everything in the arms set down or thrown: the load emptied, its count kept.
export function clear(w) {
  if (Array.isArray(w.load)) w.load.length = 0;
  else w.load = [];
  w.carry = 0;
}

// A unit into the arms: `v` the cell value a take returned, 0 for a take that
// found nothing. True when it is held now.
export function push(w, v) {
  if (!(v > 0)) return false;
  loadOf(w).push(v);
  w.carry = w.load.length;
  return true;
}
// The last unit out of the arms, to be set down: its value, or 0 with empty
// hands. `unpop` puts it back when the place would not have it.
export function pop(w) {
  if (!count(w)) return 0;
  const v = w.load.pop();
  w.carry = w.load.length;
  return v;
}
export const unpop = (w, v) => { loadOf(w).push(v); w.carry = w.load.length; };

// The beat of a pickup or a set-down, on the body's own clock `w.t`: true on
// the frame a unit is due.
export function beat(w, dt, period) {
  w.t += dt;
  if (w.t < period) return false;
  w.t = 0;
  return true;
}

// Taken up a unit a beat: `get()` takes one from the place and returns its cell
// value, or 0 when it found none; `left()` how many are still there to take.
// True once the hands have done (full of `kind`, or none left), holding
// however many came.
export function pickUp(w, dt, kind, left, get, period) {
  if (count(w) >= holds(kind) || left() <= 0) return true;
  if (!beat(w, dt, period)) return false;
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
// The whole load thrown or let go, each unit through `each(v, i)`: how many
// there were. The arms are empty after.
export function dump(w, each) {
  const n = count(w);
  for (let i = 0; i < n; i++) each(w.load[i], i);
  clear(w);
  return n;
}
