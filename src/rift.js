// The rift: the black hole hanging in the pit, and what it swallows.
//
// The hole in the ground holds 37,566 grains at full size and an endgame yard
// banks that in minutes. What is banked past it does not sit in the hole and it
// is not thrown away: it goes through here, into another dimension, where it
// costs nothing to keep because nothing about it is drawn. See `## The rift`
// and `## The endgame pass` in DESIGN.md for why this rather than a finer
// grain, a wider hole, or a drain.
//
// The arithmetic that forces it, in one line: one grain is one dust and a grain
// is six pixels, so two hundred thousand dust needs 7.2M px² of pile and the
// hole is 1.5M. There is no arrangement of this hole that shows it. The premise
// that had to give was that the pit is where the dust is *kept* -- it is not, it
// is the working floor, and this is the bank.
//
// **Nobody holds it open.** It used to be a station: a lens on the ground past
// the far wall, shut until a body had walked the whole length of the hole to
// stand at it, and the bargain was a body not on the rock. The bargain stopped
// paying -- the body arrived once and stood there for ever, two windows off
// screen, and a decision nobody ever takes back is not a decision. Torn is
// open. What it costs is what it already cost: red to tear it, and an endless
// ladder of red and dust on how fast it swallows. The yard's two oldest rules
// survive that, because no body was ever what moved the grains, and the rift
// is not a station -- it is what the hole does with its overflow, and the hole
// has never been staffed either.
//
// What is here is where it hangs, and its two rows. What actually moves the
// grains is `swallow` in pit.js, which is the same lift-off-the-top that paying
// uses: one way of taking dust out of the pile, two destinations.

import { P, RIFT_W, RIFT_H, RIFT_AT, RIFT_UP,
         RIFT_RATE, RIFT_RATE0, RIFT_RATE_COST, RIFT_RATE_UP } from './config.js';
import { S, pit, rift } from './state.js';
import { swallow, pitWidth } from './pit.js';

// --- where it hangs ------------------------------------------------------------
// Over the near end of the hole, and standing in the air rather than sunk in it:
// its middle RIFT_UP cells above the ground line, so the lower edge of the disc
// dips into the mouth and the rest of it is against the white page.
//
// The near end because that is where the haulers tip in, where the belt's head
// drops and where the counter stands -- the one end of the pit that is on
// screen. It stood past the far wall once and nobody saw it: the endgame's dust
// was a stream arcing off the edge of the window while the pit itself sat there,
// one unchanging full pile.
//
// And above the line because a black disc buried in a full hole has no
// silhouette. Everything in this yard is black on white, so an absence only
// reads as one against the paper; sunk to its middle in grey speckle it is a
// blob painted on the pile, which is what the cell of white round it in
// `drawRift` was already patching. Standing clear of the lip, the thing that is
// behind it is nothing, which is the truth about it.
//
// `PIT_PAD` is untouched, and so is every column count. The world's width is
// measured off the pit and the floor's column count off the world, and a changed
// column count invalidates every saved floor grid in existence -- see the note
// over `placeSites` in world.js. The disc moves within ground the pit and the
// sky already own.
export function seatRift() {
  rift.w = RIFT_W;
  rift.h = RIFT_H;
  rift.x = pit.x + Math.round(pitWidth() * RIFT_AT / P) * P;
  rift.y = S.groundY - RIFT_UP * P - Math.round(RIFT_H / 2 / P) * P;
}

// The middle of it: where the orbit tightens to, and where a grain is gone.
export const riftMouth = () => rift.x + rift.w * 0.5;
export const riftCenter = () => ({ x: rift.x + rift.w * 0.5, y: rift.y + rift.h * 0.5 });
export const riftRadius = () => rift.w * 0.5;

// Whether it is swallowing: torn. There is nothing else to it.
export const riftOpen = () => !!S.riftOpen;

// --- how fast ----------------------------------------------------------------
// Grains a second. An endless ladder, and endless is the point rather than an
// oversight.
//
// What the rift sells is **rate**, never room. Capacity is unbounded from the
// moment it is built, because a magic hole with a number written on it is the
// pit again -- and the whole lesson of the press is that selling capacity is
// selling the wrong thing. What you are buying is whether the rift keeps up with
// what the yard is making. A works that has outgrown its rift fills the hole and
// stops, exactly as it does today, so the pressure is real and the answer to it
// is a row that never runs out.
export const riftRate = () => RIFT_RATE0 * Math.pow(RIFT_RATE, S.riftLevel || 0);

// and what the next rung of it costs, in red and in dust
export const riftUpCost = () => Math.round(RIFT_RATE_COST * Math.pow(RIFT_RATE_UP, S.riftLevel || 0));

// --- the swallowing ----------------------------------------------------------
// Grains off the top of the pile and out of this dimension, at the rift's rate.
//
// The remainder is carried between frames. At one grain a second and a sixtieth
// of a second a frame, flooring every frame's share would swallow nothing at
// all, for ever -- the same trap the sky's fouling fell into, and the reason
// every rate in this game is accumulated rather than rounded at each step.
let owed = 0;

export function stepRift(dt) {
  if (!riftOpen()) { owed = 0; return 0; }    // not torn: nothing is owed
  owed += riftRate() * dt / 1000;
  const whole = Math.floor(owed);
  if (whole < 1) return 0;
  owed -= whole;
  return swallow(whole);
}

// The two rows it sells live in upgrades.js with the rest of the bench's, under
// `the hole` -- the section the press used to stand in, which is the right home
// for them: what both are about is what happens when the hole is full. They are
// not here because upgrades.js reaches this file through pit.js and shop.js, and
// an array spread across that circle is read before it exists.
