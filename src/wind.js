// The wind over the yard. One of it.
//
// There were three before this and none of them knew about the others: a gust in
// the dust, a wander in the settled haze, a sway in the smoke still climbing.
// Worse than three, really -- each of those was per mote, on that mote's own
// phase and its own period, so what you were actually looking at was a few
// hundred specks each obeying a private breeze. Slowed down it reads as static;
// sped up it reads as insects. Neither of them reads as air, because air is the
// one thing in the world where everything in a given place is doing the same
// thing at the same moment. That shared motion is the whole of what makes a
// field of dots look like weather, and it was the one thing missing.
//
// So there is one number here, asked for the clock, and everything that hangs in
// the air leans on it. What a field is allowed to keep is *how much* of it to
// take -- a far band takes less than a near one, which is parallax and is wanted;
// heavy grit takes less than fine dust, which is weight -- and a small per-mote
// give, a fifth either way, so the field is not a sheet of card. Those are
// deviations on a shared number rather than motions of their own, which is the
// difference between a crowd leaning in a gust and a crowd milling about.

import { WIND, WIND_MS, WIND_LULL, WIND_GUST_POW } from './config.js';
import { now } from './clock.js';

// How hard it is blowing, and which way, as one signed share: about -1 to 1 at
// WIND = 1, positive being to the right.
//
// Two swings pulling against each other at periods that do not divide, so it
// leans one way for a while and then the other and never repeats on a beat you
// could count. That much was already here and it was right. What it lacked was
// quiet: a sum of sines is always roughly as strong as it ever gets, so the wind
// changed direction but never dropped, and a wind that never drops is a fan.
// The envelope is a third swing, slower again, multiplied in rather than added:
// it takes the whole thing down to a bit over half and back, so a gust builds out
// of still air, peaks, and eases off. Multiplied, because a lull has to be quiet
// in both directions -- added, it would only have been a fourth wobble.
export function windAt(t) {
  const swing = Math.sin(t / WIND_MS) * 0.7
              + Math.sin(t / (WIND_MS * 0.37) + 1.3) * 0.3;
  const strength = 1 - WIND_LULL * (0.5 + 0.5 * Math.sin(t / (WIND_MS * 2.9) + 0.6));
  return WIND * swing * strength;
}

// What it is doing this instant. Everything that asks within a frame gets the
// same answer, because they all ask the same clock -- which is the point.
export const wind = () => windAt(now());

// The same wind, as a thing being *blown* feels it rather than as the air
// measures it.
//
// `wind()` is the honest field and everything that needs the truth should keep
// asking it. But the truth, drawn, was the problem: a mote's sideways travel is
// straight off that number, so a middling wind moved the field a little, a
// strong one moved it slightly more, and the whole range came out as one slow
// drift with nothing to tell the ends of it apart. The eye does not read a
// twenty percent difference in the speed of a speck; it reads *still* against
// *going*.
//
// So this bends the middle down and leaves the ends alone: a power curve, sign
// kept. A lull goes properly quiet and a gust properly moves, and the same
// bend is applied to the dust, the haze and anything else that is drawn being
// blown -- one shape, so the sky and the ground never disagree about whether
// this is a strong moment. What it must not touch is anything that *is* the
// wind rather than a thing in it: the flag's heading is the wind, and putting
// this under it would only have made the flag hang longer.
export const gust = () => {
  const w = wind();
  return (w < 0 ? -1 : 1) * Math.abs(w) ** WIND_GUST_POW;
};

// A mote's own share of it, from any number that is fixed for the mote's life: a
// small spread about 1, never a sign flip. Two motes side by side differ by a few
// percent, so the field breathes rather than sliding as one piece, and neither of
// them ever goes the other way from its neighbour -- which is exactly the thing
// the old per-mote sines did and the thing that made the air read as random.
export const give = (r, spread) => 1 + (r - 0.5) * 2 * spread;
