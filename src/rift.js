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
// open, and open is full strength: it costs nothing, because there is nothing
// to buy -- the hole tears itself the first time the pit cannot take a grain,
// and from that moment it takes everything thrown at the pit. The yard's two
// oldest rules survive that, because no body was ever what moved the grains,
// and the rift
// is not a station -- it is what the hole does with its overflow, and the hole
// has never been staffed either.
//
// What is here is where it hangs, and its two rows. What actually moves the
// grains is `swallow` in pit.js, which is the same lift-off-the-top that paying
// uses: one way of taking dust out of the pile, two destinations.

import { P, RIFT_W0, RIFT_WMAX, ABYSS_AT, RIFT_AT, RIFT_UP, RIFT_GULP,
         RIFT_GULP_SHOW, RIFT_SHAKE, RIFT_REACH0,
         RIFT_INHALE_MAX, RIFT_INHALE_SHOW } from './config.js';
import { S, pit, rift } from './state.js';
import { swallow, pitWidth, pitGrains } from './pit.js';

// --- how big it is -------------------------------------------------------------
// The disc grows with what it eats and with nothing else: no rung, no dial,
// nothing tended. `S.riftAte` is every grain it has ever swallowed, and the
// diameter is derived from it here rather than stored anywhere -- the square
// root front-loads the visible growth and slows toward the ceiling, which is
// the shape of a thing straining. Whole cells, because everything in this
// yard sits on the cell grid and a disc half a cell wider is a hairline.
export function riftCells() {
  const k = Math.sqrt(Math.min(1, (S.riftAte || 0) / ABYSS_AT));
  return Math.round(RIFT_W0 + (RIFT_WMAX - RIFT_W0) * k);
}

// --- where it hangs ------------------------------------------------------------
// Over the near end of the hole, and standing in the air rather than in it: the
// whole disc clear of the ground line by RIFT_UP cells, hanging over the mouth
// with white page behind all of it.
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
// `drawRift` was already patching. Clear of the ground, the thing behind it is
// nothing, which is the truth about it -- and the grains it takes have to climb
// out of the hole and cross open sky to reach it, where they are black specks on
// white instead of grey specks on a grey pile. Where it stands is most of
// whether the thing can be seen working at all.
//
// `PIT_PAD` is untouched, and so is every column count. The world's width is
// measured off the pit and the floor's column count off the world, and a changed
// column count invalidates every saved floor grid in existence -- see the note
// over `placeSites` in world.js. The disc moves within ground the pit and the
// sky already own.
export function seatRift() {
  const w = riftCells() * P;
  rift.w = w;
  rift.h = w;
  rift.x = pit.x + Math.round(pitWidth() * RIFT_AT / P) * P;
  rift.y = S.groundY - w - RIFT_UP * P;
}

// The middle of it: where the orbit tightens to, and where a grain is gone.
export const riftMouth = () => rift.x + rift.w * 0.5;
export const riftCenter = () => ({ x: rift.x + rift.w * 0.5, y: rift.y + rift.h * 0.5 });
export const riftRadius = () => rift.w * 0.5;

// Whether it is swallowing: torn. There is nothing else to it.
export const riftOpen = () => !!S.riftOpen;

// --- how fast ----------------------------------------------------------------
// **It inhales.** Everything in the hole goes, on the frame it lands there.
//
// It was a rate, and the rate was a ladder: twelve grains a second to start with
// and a row on the tower that widened it, for ever. Two things were wrong with
// that, and they are the same thing said twice.
//
// The first is what it looked like. A pile with a black hole over it, losing a
// dozen grains a second, is a pile that is very slightly shorter than it was --
// nothing about the picture says *pulled*. Grains went on settling on the floor
// under the disc and lying there, which is the one thing a hole in the air is
// supposed to make impossible.
//
// The second is what it was to play. Buying a black hole's appetite up a rung at
// a time makes it a machine with a dial, and it is the only object in this yard
// that is not machinery. Nothing tends it, nothing switches it on, and it has
// nothing on the front of it to adjust.
//
// So there is no rate and no ladder. What there is instead is a **reach**: the
// disc eats what lies within so many cells of its underside, and the reach is
// the disc's size -- RIFT_REACH0 cells into the pile the day it tears, the
// whole hole by the time it is RIFT_WMAX across. A young rift skims a crater
// out of the top of the pile under its mouth, and the pile stands at a level
// that sinks as the hole grows; a grown one takes everything, as it always did.
// Neither objection above is touched -- what you see is grains streaming out
// of a crater into the disc, and there is nothing to buy -- and the pile the
// opening was about is there to be watched being lost. Every grain the yard
// tips in lands on top of the crater, inside the reach, so what the yard earns
// still goes through; a full pit is impossible the same way it was.
//
// The ceiling on one frame, RIFT_INHALE_MAX, is not a balance number: it is
// there so that a hundred thousand grains arriving in one act are taken over a
// few frames instead of walking a million cells inside one.
export const riftBite = () => Math.min(pitGrains(), RIFT_INHALE_MAX);

// How far past the air under it it eats, in cells: RIFT_REACH0 at birth, the
// far corner of the hole at full size, and the climb between them geometric --
// the hole is six hundred cells long, and a reach that climbed toward that in
// a straight line was ninety cells at the first sign of growth, which is the
// empty pit again. Doubling on doubling is what "more and more" looks like:
// a crater, then a bowl, then the near end, then all of it.
export function riftReach() {
  const k = (riftCells() - RIFT_W0) / Math.max(1, RIFT_WMAX - RIFT_W0);
  const all = pit.cols + pit.rows;
  return RIFT_UP + RIFT_REACH0 * Math.pow(all / RIFT_REACH0, Math.max(0, Math.min(1, k)));
}

// --- the swallowing ----------------------------------------------------------
// Grains off the top of the pile and out of this dimension. Nothing is
// accumulated between frames and no remainder is carried, because there is no
// rate to carry the remainder of: what is in the hole is what goes.
export function stepRift(dt) {
  if (!riftOpen()) return 0;                  // not torn: nothing is pulled
  // The disc is reseated every step because it grows: the bottom edge stays
  // RIFT_UP cells off the ground line and the swelling goes upward, so the
  // thing rises over the mouth as it eats rather than sinking into it.
  if (!S.drowned) seatRift();
  // The drowning: the hole has eaten its fill and gives way downward. The
  // gulp runs again -- this time it is `abyssLine` rising out of the floor
  // (see pit.js) -- and from here on the abyss is the picture. One-way, once.
  if (!S.drowned && (S.riftAte || 0) >= ABYSS_AT) {
    S.drowned = true;
    S.riftGulp = RIFT_GULP;
    S.riftShake = RIFT_SHAKE;
  }
  if (S.riftGulp > 0) return gulp(dt);        // and the tearing is its own thing
  const take = riftBite();
  if (!take) return 0;
  return swallow(take, RIFT_INHALE_SHOW, false, riftReach());
}

// The tearing: the hole emptied, over RIFT_GULP seconds, however much is in it.
//
// The share is worked out against the time *left* rather than against the whole,
// so it does not matter what the frame rate is or how much fell in while the
// gulp was running -- whatever is in the hole when the last frame of it comes
// round is taken then. The hole is empty at the end of it by construction, which
// is what makes this an event rather than a fast setting of the rate.
//
// It leans on nothing the ordinary swallow does not do, with two exceptions,
// both of them about being watched. The list of grains in flight is allowed to
// be long, because the sight of it is the whole point of the moment. And it
// takes from **everywhere** rather than nearest the mouth: the ordinary rift
// pulls at what is near it and hollows a crater, which during a tear would empty
// the end of the hole you are looking at and leave the rest of the pile standing
// off the side of the window. The hole has given way -- the whole pile goes.
function gulp(dt) {
  const was = S.riftGulp;
  const left = Math.max(0, was - dt / 1000);
  S.riftGulp = left;
  const have = pitGrains();
  if (!have) return 0;
  const take = left <= 0 ? have : Math.ceil(have * Math.min(1, (was - left) / was));
  return swallow(take, RIFT_GULP_SHOW, true);
}

// How long a tear has left to run, nought to one, for anything that wants to
// draw the moment rather than take part in it.
export const riftTearing = () => Math.max(0, Math.min(1, (S.riftGulp || 0) / RIFT_GULP));

// **It sells nothing, on any board.** There is no row that summons it -- the
// hole collapses on its own the first time it cannot take a grain -- and no row
// that widens it, because there is nothing left to widen: it takes everything.
// See the note under `the black hole` in tower.js for what those two rows were
// and why each of them went.
