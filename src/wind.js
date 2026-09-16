// The wind over the yard. One of it.
//
// One number, asked for the clock, and everything that hangs in the air leans
// on it: air is the one thing in the world where everything in a given place
// is doing the same thing at the same moment, and that shared motion is what
// makes a field of dots look like weather. What a field may keep is *how
// much* of it to take (a far band less than a near one, grit less than fine
// dust) and a small per-mote give, so the field is not a sheet of card.

import { WIND, WIND_MS, WIND_LULL, WIND_GUST_POW } from './config.js';
import { now } from './clock.js';

// How hard it is blowing, and which way, as one signed share: about -1 to 1 at
// WIND = 1, positive being to the right.
//
// Two swings at periods that do not divide, so it never repeats on a beat you
// could count, under an envelope that is a third swing, slower again and
// multiplied in: a sum of sines is always roughly as strong as it ever gets,
// and a wind that never drops is a fan. Multiplied because a lull has to be
// quiet in both directions; added, it would only be a fourth wobble.
export function windAt(t) {
  const swing = Math.sin(t / WIND_MS) * 0.7
              + Math.sin(t / (WIND_MS * 0.37) + 1.3) * 0.3;
  const strength = 1 - WIND_LULL * (0.5 + 0.5 * Math.sin(t / (WIND_MS * 2.9) + 0.6));
  return WIND * swing * strength;
}

// What it is doing this instant. Everything that asks within a frame gets the
// same answer, because they all ask the same clock.
export const wind = () => windAt(now());

// The same wind as a thing being *blown* feels it: a power curve, sign kept,
// that bends the middle down and leaves the ends alone, because the eye does
// not read a twenty percent difference in a speck's speed, it reads *still*
// against *going*. One shape for the dust, the haze and anything else drawn
// being blown, so the sky and the ground agree about whether this is a strong
// moment. Never for anything that *is* the wind rather than a thing in it:
// the flag's heading is `wind()`.
export const gust = () => {
  const w = wind();
  return (w < 0 ? -1 : 1) * Math.abs(w) ** WIND_GUST_POW;
};

// A mote's own share of it, from any number fixed for the mote's life: a
// small spread about 1, never a sign flip, so the field breathes rather than
// sliding as one piece and no mote goes the other way from its neighbor.
export const give = (r, spread) => 1 + (r - 0.5) * 2 * spread;
