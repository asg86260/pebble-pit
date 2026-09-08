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
export const FLAG_RIPPLE_MS = 1500;  // one wave traveling the pennant's length.
                                     // It was 700, which put two waves through
                                     // the cloth a second: at this size that is
                                     // not cloth in a breeze, it is a shiver
export const FLAG_SWING = 0.55;      // radians the ripple turns the cloth by at
                                     // the loose end. An angle, not a shift: the
                                     // cloth is walked out from the knot half a
                                     // cell at a time and the wave steers the
                                     // walk, so the ripple bends the whole sheet
                                     // instead of sliding columns of it past
                                     // each other
export const FLAG_WAVES = 0.75;      // waves standing on the cloth at once. A
                                     // third of one moved the whole pennant
                                     // together -- one flap, not a ripple
export const FLAG_FILL = 2.0;        // how much of the yard's wind the cloth
                                     // takes, as a share of a right angle. The
                                     // wind peaks near 0.94, so at this the flag
                                     // stands right out about a third of the
                                     // time, hangs about a fifth, and is
                                     // somewhere between for the rest. Lower
                                     // read calmer and cost too much: this flag
                                     // is a SIGNAL -- it says a station has
                                     // something you can afford -- so time spent
                                     // furled is time the sign cannot be read.
                                     // The calm came out of the ripple instead,
                                     // which is where the gale actually was
export const FLAG_SAG = 0.35;        // how far the loose end falls back toward
                                     // vertical when the wind is less than full.
                                     // The knot goes on holding its own end up
                                     // whatever the wind does, so the sag is
                                     // nothing there and gathers along the length
export const FLAG_LIMP = 0.35;       // the share of its ripple the cloth keeps
                                     // with no wind in it at all. Cloth is never
                                     // rigid: a furled flag still stirs, and
                                     // without this the hang drew as a straight
                                     // vertical bar on a vertical pole -- three
                                     // cells of nothing you could tell from the
                                     // mast, on the one mark that has to stay
                                     // legible the whole time it is up
export const FLAG_GIVE = 0.12;       // a flag's own share of the one wind, a
                                     // spread either way. Two flags differ by a
                                     // few percent and never disagree about which
                                     // way it is blowing -- the same bargain
                                     // wind.js strikes for every mote in the air


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

// --- raising and striking the flag -------------------------------------------
// A flag does not appear. When a station's board first holds something you can
// afford, the pole slides up out of the roofline and the pennant is then run up
// it; when the offer closes the same two moves run backwards. Instant is the
// one reading that is wrong here: the flag is the yard telling you something
// has just changed, and a mark that is simply there on the next frame reads as
// a mark that was always there.
export const FLAG_RAISE_MS = 700;    // the pole, out of nothing to full height
export const FLAG_HOIST_MS = 550;    // then the cloth, base to masthead. Shorter
                                     // than the pole: the pole is being pushed
                                     // up, the cloth is being pulled on a rope
