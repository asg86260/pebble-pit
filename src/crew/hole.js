// The hole, and the ladder down the cut: two errands that are the same errand,
// plus the books that say how much room a trip has spoken for.

import { P, WORKER } from '../config.js';
import { S, pit, cut, quarry } from '../state.js';
import { at, put, colOf, topRow, isDust } from '../grid.js';
import { keepTo, stepRoute, wayAt, wayOver, ways, climbTo, feetOn } from '../route.js';
import { sweepMuckAt } from '../smog.js';
import { swingFor } from './tenders.js';
import { pitRoom } from '../pit.js';
import { haulCap, scoopMs, commutePace } from '../upgrades.js';
import { stronger } from '../apothecary.js';
import { now } from '../clock.js';
import { rand } from '../rng.js';

// --- down the hole, and out the other side ---------------------------------------
// Muck that fell in the hole lies on the dust at the bottom of it, and muck that
// fell past the hole lies on ground the crew can only get to by going through.
// Both are the same errand, and neither of them is written out here any more.
//
// This was a five-state machine -- `to`, `down`, `dig`, `cross`, `up`, with a
// `w.side` and a `w.farSide` and a lip clamp with two sides to it -- sitting
// beside a routing system that does all of that generically for everybody else,
// and beside a hole whose two ladders were already rows in the links table. Two
// systems doing one job, and the copy that drifts is always the one that is not
// the general one.
//
// So the body asks for a route and walks it, exactly as a quarrier does since
// the cut stopped having its own way out. Nothing below says "ladder", "side"
// or "across": the ladders are the only edges out of the hole, and the strip of
// ground past the far wall is joined to the world only through it -- see `ways`
// and `links` in route.js -- so a body that gets to either at all gets there
// that way, and one asked to go somewhere no route reaches stays where it is.
//
// What stays is the digging, because digging is work and not getting about.
export function downTheHole(w, to) {
  const all = ways();
  // Nothing to go for means coming home, and home is the near lip: the yard is
  // over there. This is what fetches a body back off the far ground once the
  // last of the muck out there has been shifted -- which used to be a rule of
  // its own called `marooned`, because the crossing only ever ran while there
  // was muck to chase and the last body out there was stranded for good.
  const at = to == null ? pit.x - WORKER : to - WORKER / 2;
  const on = to == null ? all.yard : wayOver(at, all);
  // Still on the way: a couple of cells short is arrived, the same slack
  // `takeMuck` allows up top, so a body settling on to a patch is not walked
  // back a pixel at a time every time it plants its feet on a whole cell.
  if (Math.abs(at - w.x) > P * 2 || wayAt(w.x, w.y, all).key !== on.key) {
    if (!keepTo(w, at, on)) return;
    if (stepRoute(w, commutePace())) return;
    w.route = null;
    return;
  }
  w.route = null;
  if (to == null) return;

  // Arrived. The same swing as up top -- see `takeMuck`. Feet planted, a cell to
  // a stroke, rather than a heap quietly melting under a shaking body.
  //
  // `now` is the clock *function* in here -- this one is not handed the frame
  // time the way the yard's branches are -- so it has to be called. Compared
  // against the function it is never greater, and the body stood over the heap
  // swinging at nothing at all.
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
// Grains that fell in through the cut's mouth lie on the floor of the working
// and have to be carried out like anything else on the yard -- down the one
// ladder there is, out with a claim on a column exactly the way the yard's own
// dust is claimed, and banked at the pit like any other load. Mirrors
// `downTheHole`: a column rather than a body, and a route rather than a walk
// written out by hand.
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

  // Arrived at the column it claimed. Feet planted, and a scoop at a time --
  // the same cadence `haulSpeed`'s own fetching keeps on the yard.
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
  S.dirty = true;
}

// The nearest column of the cut's own dust that nobody else has gone for, by
// the same rule `nearestDust` keeps for the yard's own piles: one column, one
// worker. Only a hauler ever calls this -- it is the one trade whose branch
// routes down the ladder for it -- so the claim it makes is already held to
// `nearestMuck`'s own rule: nobody stands on the floor of the cut who cannot
// walk down to it.
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

// --- booking the hole ---------------------------------------------------------
// A hauler says how much it is going for *before* it goes, and the room it
// asked for is spoken for until it tips.
//
// Without that, every body in the yard set off with an empty pair of hands,
// filled them, walked to the lip and only then found out the hole was full --
// eight workers stood at the brim holding a load each, with nowhere to put any
// of it and no way to put it back. Room in the hole is a resource like a column
// of dust is a resource, and the fix is the same one the columns already use:
// claim it at the moment you decide, and hold the claim until you have spent it.
//
// So a trip is `w.booked` grains of dust and no more. Room for five is one
// worker going for five, not five workers going for a load each.
//
// Everything is in this. A shard, a spore and a core take a grain of room the
// same as a grain of dust does: one capacity, one queue. A hole that held
// everything except the four things it did not hold was a hole with a rule you
// could not see, and it let a body set off for a find with a full pit behind it
// and stand at the lip holding one.
const bookings = () => S.workers.reduce((n, o) => n + (o.booked || 0), 0);

// ...and once the hole has collapsed, the room is not the hole's any more.
//
// A booking is a promise that there will be somewhere to put this grain down.
// While the hole could refuse, that promise was worth exactly what the hole had
// left. A hole that has torn open cannot refuse -- what will not fit goes
// through the rift (see `throughRift` in pit.js) -- so the promise is always
// good and the queue is as long as the trip.
//
// Without this the collapse fixed the wrong half: nothing was turned away any
// more, but nobody set off either, because the booking still asked a full hole
// how much room it had and was told none. Six carters banked fifteen grains in
// thirty seconds -- the rift's own swallowing rate, and a yard still stopped in
// every way that matters.
export const pitFree = () => S.riftOpen ? Infinity : pitRoom() - bookings();

// what one body carries in a trip -- a cart holds twice, and a strong brew adds
// its half on top of that for as long as the dose is worn (see apothecary.js)
export const load = w => stronger(w, Math.round(haulCap() * (w.trained ? 2 : 1)));

// what it may still take this trip, and taking one more off it
export const roomOnBoard = w => (w.booked || 0) - (w.took || 0);
export const tookOne = w => { w.took = (w.took || 0) + 1; };

// Book what is going: whatever is left of a load, or whatever the hole has left,
// whichever is less. Returns what it managed to get.
export function bookRoom(w, want = load(w)) {
  if (roomOnBoard(w) < 1) w.booked = (w.took || 0) + Math.max(0, Math.min(want, pitFree()));
  return roomOnBoard(w);
}

// Whether this body may take one more, asking the hole again if it has to.
//
// A booking is made once, with the hands empty, against the room the hole had
// at that moment -- and the walk out is long. A hole with room for two sent a
// body out booked for two, and by the time it was stood over the heap a dig had
// made room for twenty; the body took its two, walked past the rest with its
// hands mostly empty, and tipped. What its hands hold is the ceiling; what the
// hole has *now* is the other one; a spent booking is asked again against both,
// and gets nothing when the hole is still full, which is the trip ending the
// way it always did.
//
// Asked for what the hands have left rather than a whole load, because `took`
// stays in the booking: a re-book for a full load on top of two already in hand
// spoke for two grains of the hole that nothing was ever going to fill.
export const roomToTake = w =>
  (w.carry || 0) < load(w) &&
  (roomOnBoard(w) > 0 || bookRoom(w, load(w) - (w.carry || 0)) > 0);

// Hands empty and nothing owed: the trip is over, so the room goes back.
export function unbook(w) {
  w.booked = 0;
  w.took = 0;
}
