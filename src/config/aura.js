import { P } from './yard.js';

// --- the hold-a-body ring -----------------------------------------------------
// The steady ring a station wears under a held body. Offers fly a flag, below.
export const AURA_IN = 2;            // how far inside the walls the ring sits
export const AURA_BREATH = 4;        // reach of the (now unused) outward swell

// --- the offer flag ----------------------------------------------------------
// A station with something affordable on its board flies a flag: a pole off
// the roof peak, a black pennant rippling in the wind. The numbers are cells.
export const FLAG_POLE = 8;          // cells of pole above the roofline
export const FLAG_W = 5;             // the pennant, cells across
export const FLAG_H = 3;             // and deep -- the measure across the walk,
                                     // so it is the cloth's height while the
                                     // flag flies level and its width while the
                                     // flag hangs
export const FLAG_RIPPLE_MS = 1500;  // one wave traveling the pennant's length;
                                     // two a second is a shiver, not cloth
export const FLAG_SWING = 0.55;      // radians the ripple turns the cloth by at
                                     // the loose end. An angle, not a shift: the
                                     // cloth is walked out from the knot half a
                                     // cell at a time and the wave steers the
                                     // walk, so it bends the whole sheet instead
                                     // of sliding columns past each other
export const FLAG_WAVES = 0.75;      // waves standing on the cloth at once; a
                                     // third of one is one flap, not a ripple
export const FLAG_FILL = 2.0;        // how much of the yard's wind the cloth
                                     // takes, as a share of a right angle. The
                                     // wind peaks near 0.94, so the flag stands
                                     // right out about a third of the time and
                                     // hangs about a fifth. The flag is a SIGNAL,
                                     // so time furled is time it cannot be read
export const FLAG_SAG = 0.35;        // how far the loose end falls back toward
                                     // vertical when the wind is less than full.
                                     // The knot holds its own end up, so the sag
                                     // is nothing there and gathers along the length
export const FLAG_LIMP = 0.35;       // the share of its ripple the cloth keeps
                                     // with no wind at all. Without it the hang
                                     // is a vertical bar on a vertical pole,
                                     // indistinguishable from the mast
export const FLAG_GIVE = 0.12;       // a flag's own share of the one wind, a
                                     // spread either way, so two flags differ by
                                     // a few percent and never disagree about
                                     // which way it is blowing


// When an offer first opens, one ring of ink breathes off the flag's tip, then
// the flag alone carries it.
export const OFFER_WAVE_MS = 2600;   // the ring, born to gone
export const OFFER_WAVE_R = 9 * P;   // how far it reaches before it dies
export const OFFER_WAVE_INK = 0.35;  // the darkest the ring ever is

// The thing a station is building, drawn over it (render/bars.js): the part
// not up yet is an outline in this gray, lighter than the card's ghost so it
// sits back from the black that is there.
export const BUILD_GHOST_INK = '#bdbdbd';

// While the board behind a flying flag holds a row you have never seen, the
// tip keeps sending rings: the opening ring over again, several in flight at
// once, spaced evenly, until the row has been looked at.
export const NEW_WAVE_MS = 3000;     // one ring, born to gone
export const NEW_WAVE_R = 7 * P;     // how far it reaches before it dies
export const NEW_WAVE_INK = 0.25;    // the darkest a ring is, at birth
export const NEW_WAVES = 2;          // rings in flight at once

// --- assignment by hand ------------------------------------------------------
// How far past a station's own ground a held body may be dropped and still mean
// that station: a drop that has to land on the doorway to the pixel is a
// control nobody hits twice.
export const ASSIGN_PAD = P * 2;     // either side of the stand rect (the top
                                     // of the zone is the top of the sky)

// The marker over each station a held body could join: a small arrow pointing
// down at the place, bobbing so it reads as an invitation rather than a stain.
export const DROP_MARK_LIFT = 10;    // cells above the station's top
export const DROP_MARK_BOB_MS = 1000;

// --- raising and striking the flag -------------------------------------------
// The pole slides up out of the roofline and the pennant is then run up it;
// on close the same two moves run backwards. A mark simply there on the next
// frame reads as a mark that was always there.
export const FLAG_RAISE_MS = 700;    // the pole, out of nothing to full height
export const FLAG_HOIST_MS = 550;    // then the cloth, base to masthead. Shorter
                                     // than the pole: the pole is being pushed
                                     // up, the cloth is being pulled on a rope
