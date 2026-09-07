import { P } from './yard.js';

// --- the hold-a-body ring (wave7b-assign) -------------------------------------
// The steady ring a station wears under a held body. The offer aura that once
// shared these numbers is gone -- offers fly a flag now, below.
export const AURA_IN = 2;            // how far inside the walls the ring sits
export const AURA_BREATH = 4;        // reach of the (now unused) outward swell

// --- the offer flag (replaces the aura) --------------------------------------
// A station with something affordable on its board flies a flag: a pole off
// the roof peak, a black pennant rippling in the wind. The numbers are cells.
export const FLAG_POLE = 8;          // cells of pole above the roofline
export const FLAG_W = 5;             // the pennant, cells across
export const FLAG_H = 3;             // and deep -- the measure across the walk,
                                     // so it is the cloth's height while the
                                     // flag flies level and its width while the
                                     // flag hangs
export const FLAG_RIPPLE_MS = 700;   // one wave traveling the pennant's length
export const FLAG_SWING = 0.95;      // radians the ripple turns the cloth by at
                                     // the loose end. It is an angle now, not a
                                     // shift: the cloth is walked out from the
                                     // knot a half cell at a time and the wave
                                     // steers the walk, so the ripple bends the
                                     // whole sheet instead of sliding columns
                                     // of it up and down past each other
export const FLAG_WAVES = 0.75;      // waves standing on the cloth at once. A
                                     // third of one moved the whole pennant
                                     // together -- one flap, not a ripple
export const FLAG_FILL = 2.2;        // how fast the cloth lifts as the wind
                                     // rises. Steeper than the wind, so the
                                     // flag flies level for most of a gust and
                                     // hangs only around the turn
export const FLAG_SAG = 0.18;        // how much of the slack the cloth carries
                                     // right at the knot. The knot holds its
                                     // own end up whatever the wind does, so
                                     // the sag is small there and grows out
                                     // along the length toward the loose end
export const FLAG_GUST_MS = 7000;    // the slow swell of the wind's strength;
                                     // its sign is the way the cloth flies
export const FLAG_GUST_SPAN = 2400;  // world px a gust front spans: the wind
                                     // is a wave crossing the yard, so flags
                                     // far apart turn at different moments


// When an offer first opens, one ring of ink breathes off the flag's tip --
// the tower's own gesture at a whisper -- then the flag alone carries it.
export const OFFER_WAVE_MS = 2600;   // the ring, born to gone
export const OFFER_WAVE_R = 9 * P;   // how far it reaches before it dies
export const OFFER_WAVE_INK = 0.35;  // the darkest the ring ever is

// --- assignment by hand (wave7b-assign, feedback7 item 16) --------------------
// How far past a station's own ground a held body may be dropped and still mean
// that station. A body is a bigger thing than a cursor; a drop that has to land
// on the doorway to the pixel is a control nobody hits twice.
export const ASSIGN_PAD = P * 2;     // either side of the stand rect (the top
                                     // of the zone is the top of the sky)

// The marker over each station a held body could join: a small arrow pointing
// down at the place, bobbing so it reads as an invitation rather than a stain.
export const DROP_MARK_LIFT = 10;    // cells above the station's top
export const DROP_MARK_BOB_MS = 1000;
