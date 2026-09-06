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
export const FLAG_H = 3;             // and down -- deep enough that a column a
                                     // cell out of step still shares two cells
                                     // with its neighbor, so the cloth holds
                                     // together instead of tearing into blocks
export const FLAG_RIPPLE_MS = 700;   // one wave traveling the pennant's length
export const FLAG_GUST_MS = 7000;    // the slow swell of the wind's strength;
                                     // its sign is the way the cloth flies


// When an offer first opens, one ring of ink breathes off the flag's tip --
// the tower's own gesture at a whisper -- then the flag alone carries it.
export const OFFER_WAVE_MS = 2600;   // the ring, born to gone
export const OFFER_WAVE_R = 9 * P;   // how far it reaches before it dies
export const OFFER_WAVE_INK = 0.35;  // the darkest the ring ever is

// --- assignment by hand (wave7b-assign, feedback7 item 16) --------------------
// How far past a station's own ground a held body may be dropped and still mean
// that station. A body is a bigger thing than a cursor; a drop that has to land
// on the doorway to the pixel is a control nobody hits twice.
export const ASSIGN_PAD = P * 2;     // on every side of the stand rect
