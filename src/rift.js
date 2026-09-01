// The rift: the hole in the air at the far end of the pit, and the wizard who
// holds it open.
//
// The hole in the ground holds 37,566 grains at full size and an endgame yard
// banks that in minutes. What is banked past it does not sit in the hole and it
// is not thrown away: it goes through here, into another dimension, where it
// costs nothing to keep because nothing about it is drawn. See `## The rift` in
// DESIGN.md for why this rather than a finer grain, a wider hole, or a drain.
//
// The arithmetic that forces it, in one line: one grain is one dust and a grain
// is six pixels, so two hundred thousand dust needs 7.2M px² of pile and the
// hole is 1.5M. There is no arrangement of this hole that shows it. The premise
// that had to give was that the pit is where the dust is *kept* -- it is not, it
// is the working floor, and this is the bank.
//
// What is here is a place on the ground, the body standing at it, and its two
// rows. What actually moves the grains is `swallow` in pit.js, which is the same
// lift-off-the-top that paying uses: one way of taking dust out of the pile,
// two destinations.

import { P, RIFT_W, RIFT_H,
         RIFT_RATE, RIFT_RATE0, RIFT_RATE_COST, RIFT_RATE_UP } from './config.js';
import { S, pit, rift } from './state.js';
import { swallow } from './pit.js';

// --- where it stands ---------------------------------------------------------
// Past the far wall of the pit, in the pad of ground that was already there.
//
// Deliberately *inside* `PIT_PAD` rather than past it. The world's width is
// measured off the pit (`S.worldW = pit.x + PIT_W_MAX + PIT_PAD * P`), the
// floor's column count is measured off the world, and a changed column count
// invalidates every saved floor grid in existence -- see the note over
// `placeSites` in world.js. Adding a building by making the world wider would
// have quietly thrown away the ground out of every save anybody had. There were
// eighteen cells of pad and the rift wants fifteen of them.
//
// And it is the right place for it on its own merits: it is the last thing on
// the longest walk, past the whole length of the hole, which is what a thing you
// reach only at the end of the game should cost to get to.
export function seatRift() {
  rift.w = RIFT_W;
  rift.h = RIFT_H;
  rift.x = pit.x + pit.w + P * 2;
  rift.y = S.groundY - RIFT_H;
}

// The mouth of it, and whether a given body is standing at it. A rift is not a
// building with a door -- there is nothing to go inside -- so a body works it by
// standing at the middle of the plot, the way the tower's wizards stand at the
// tower.
export const riftMouth = () => rift.x + rift.w * 0.5;

export function newRifter() {
  return { type: 'rifter', goal: 'to', x: rift.x, y: 0 };
}

export const atRift = w => w.type === 'rifter' && w.goal === 'in';

// How many are actually standing there. Not `S.rifters`, which counts everybody
// the rift has been *given* -- one of them may still be walking the length of
// the hole to get there, and nothing goes through until somebody has arrived.
// The same distinction `inScrub` makes, and for the same reason: this yard does
// not teleport anybody, so being assigned to a place and being at it are two
// facts and the machinery must read the second one.
export const inRift = () => S.workers.filter(atRift).length;

// Whether it is actually swallowing: built, and somebody standing at it.
//
// An unstaffed rift is shut. That is the whole of what stops this from being a
// magic box that gets something for nothing -- the cost of unbounded storage is
// a body not on the rock, which is the same bargain the scrubbing house and
// every other station in this yard makes, and it is a decision you can take back
// whenever you like. Take the wizard off and the hole fills up exactly as it did
// before there was a rift at all.
export const riftOpen = () => !!S.riftOpen && inRift() > 0;

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
  if (!riftOpen()) { owed = 0; return 0; }    // shut: nothing is owed from while it was
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
