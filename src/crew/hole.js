// The hole, and the ladder down the cut: two errands that are the same errand,
// plus the books that say how much room a trip has spoken for.

import { P, WORKER, LIFT_LOAD } from '../config.js';
import { S, pit, cut, quarry } from '../state.js';
import { at, put, colOf, topRow, isDust } from '../grid.js';
import { keepTo, stepRoute, wayAt, wayOver, ways, climbTo, feetOn } from '../route.js';
import { sweepMuckAt } from '../smog.js';
import { swingFor } from './tenders.js';
import { haulCap, scoopMs, commutePace } from '../levels.js';
import { stronger } from '../apothecary.js';
import { now } from '../clock.js';
import { rand } from '../rng.js';

// --- down the hole, and out the other side ---------------------------------------
// Muck in the hole and muck on the ground past it are the same errand: the
// body asks for a route and walks it. Nothing here says "ladder", "side" or
// "across" -- the ladders are the only edges out of the hole and the far
// ground is joined to the world only through it (`ways` and `links` in
// route.js), so a body asked to go somewhere no route reaches stays put.
// What stays here is the digging, because digging is work and not getting
// about.
export function downTheHole(w, to) {
  const all = ways();
  // Nothing to go for means coming home to the near lip. This is what fetches
  // a body back off the far ground once the last of the muck out there is
  // shifted; without it the last body out there is stranded for good.
  const at = to == null ? pit.x - WORKER : to - WORKER / 2;
  const on = to == null ? all.yard : wayOver(at, all);
  // A couple of cells short is arrived, the same slack `takeMuck` allows up
  // top, so a body planting its feet on a whole cell is not walked back a
  // pixel at a time.
  if (Math.abs(at - w.x) > P * 2 || wayAt(w.x, w.y, all).key !== on.key) {
    if (!keepTo(w, at, on)) return;
    if (stepRoute(w, commutePace())) return;
    w.route = null;
    return;
  }
  w.route = null;
  if (to == null) return;

  // Arrived. The same swing as up top (`takeMuck`). `now` is the clock
  // *function* in here, not the frame time the yard's branches are handed, so
  // it has to be called; compared against the function nothing is ever
  // greater.
  const t = now();
  w.x = Math.round(w.x / P) * P;
  w.y = climbTo(w, feetOn(on, w.x));
  if (t >= (w.sweepAt || 0)) {
    sweepMuckAt(w.x + WORKER / 2, 1, w);
    w.lunge = 1;
    w.sweepAt = t + swingFor(w) * (0.85 + rand() * 0.3);
  }
}

// --- down the ladder, for a load of the cut's own dust -------------------------
// Grains on the floor of the cut are carried out like anything else on the
// yard: down the ladder, with a claim on a column, banked at the pit. Mirrors
// `downTheHole` with a column in place of a spot.
export function downTheCut(w, col) {
  const all = ways();
  const spot = col == null ? quarry.x - WORKER : cut.x + col * P + P / 2 - WORKER / 2;
  const on = col == null ? all.yard : all.cut;
  if (!on) { w.cutClaim = null; return; }
  if (Math.abs(spot - w.x) > P * 2 || wayAt(w.x, w.y, all).key !== on.key) {
    if (!keepTo(w, spot, on)) { w.cutClaim = null; return; }
    if (stepRoute(w, commutePace())) return;
    w.route = null;
    return;
  }
  w.route = null;
  if (col == null) return;

  // Arrived at the column it claimed: a scoop at a time, at the yard's own
  // fetching cadence.
  w.x = Math.round(w.x / P) * P;
  w.y = climbTo(w, feetOn(on, w.x));
  if (now() < (w.next || 0)) return;
  const r = topRow(cut, col);
  if (r < 0 || !isDust(at(cut, col, r)) || !roomToTake(w)) { w.cutClaim = null; return; }
  (w.load ||= []).push(at(cut, col, r));
  put(cut, col, r, 0);
  w.carry = (w.carry || 0) + 1;
  tookOne(w);
  w.next = now() + scoopMs();
}

// The nearest column of the cut's own dust nobody else has gone for: one
// column, one worker, as `nearestDust` keeps for the yard's piles. Only a
// hauler calls this, the one trade whose branch routes down the ladder.
export function nearestCutDust(x, taken) {
  if (!cut.grid) return -1;
  const from = Math.max(0, Math.min(cut.cols - 1, colOf(cut, x)));
  for (let d = 0; d <= cut.cols; d++) {
    for (const c of [from - d, from + d]) {
      if (c < 0 || c >= cut.cols || taken.has(c)) continue;
      const r = topRow(cut, c);
      if (r >= 0 && isDust(at(cut, c, r))) return c;
    }
  }
  return -1;
}

// --- booking the trip ---------------------------------------------------------
// A hauler says how much it is going for *before* it goes: a trip is
// `w.booked` grains and no more, and `w.took` is how many are in hand.
//
// The room in the hole is never in question: a grain the pile has no cell for
// tears the hole open and goes through the rift (`throughRift` in pit.js).
// Booked against the hole's count instead, every hauler stood down at the lip
// for good, because the one trip that would have opened the rift was the one
// nobody was allowed to make.
export const pitFree = () => Infinity;

// what one body carries in a trip: a cart holds twice, a forklift `LIFT_LOAD`
// over that, and a strong brew adds its half on top for as long as the dose
// is worn (apothecary.js)
export const load = w =>
  stronger(w, Math.round(haulCap() * (w.trained ? 2 : 1) * (w.lift ? LIFT_LOAD : 1)));

// what it may still take this trip, and taking one more off it
export const roomOnBoard = w => (w.booked || 0) - (w.took || 0);
export const tookOne = w => { w.took = (w.took || 0) + 1; };

// Book what is going: whatever is left of a load, or whatever the hole has left,
// whichever is less. Returns what it managed to get.
export function bookRoom(w, want = load(w)) {
  if (roomOnBoard(w) < 1) w.booked = (w.took || 0) + Math.max(0, Math.min(want, pitFree()));
  return roomOnBoard(w);
}

// Whether this body may take one more. A spent booking is asked again for
// what the hands have left rather than a whole load, because `took` stays in
// the booking and a full re-book would speak for grains nothing carries.
export const roomToTake = w =>
  (w.carry || 0) < load(w) &&
  (roomOnBoard(w) > 0 || bookRoom(w, load(w) - (w.carry || 0)) > 0);

// Hands empty and nothing owed: the trip is over, so the room goes back.
export function unbook(w) {
  w.booked = 0;
  w.took = 0;
}
