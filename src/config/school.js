import { P } from './yard.js';

export const CASINO_SAY_MS = 4000;
// The school stands on the bare ground between the quarry's spoil and the crew's
// own front doors, which is the stretch everybody walks twice a shift. Where you
// go to learn a trade is on the way to work, and it is the last thing on this
// side that is about people rather than about rock.
// Pushed further out to open the strip the outhouse stands in. The block of
// rooms cannot come the other way to make that room -- it is sixty pixels off
// the bench and the bench is sixty off the apron, and the bench sits centred
// between them on purpose -- so the ground between the school and the front
// doors is the only ground there is to give.
export const TO_SCHOOL = -918;   // rock centre to the middle of the school
export const SCHOOL_W = P * 20;
export const SCHOOL_H = P * 10;
// The lab, which had no numbers of its own: it was two literals in world.js and
// a handful of fractions of them in the drawing. Sixteen across and twelve down
// now, and it was fourteen by ten -- the smallest thing on the ground by both
// measures, standing between a twenty-cell school and an eighteen-cell casino
// and reading as a shed beside them. It keeps the casino's height, which is what
// makes the two of them the same building at different jobs, and stays under the
// school's width, because the school is the long low one and the lab is the tall
// one. Even across, so the way in centres on the lattice.
export const LAB_W = P * 16;
export const LAB_H = P * 12;
export const LAB_FLUE = 4;       // courses of it standing against the sky, above the body
// What the school costs to build, and what a trade costs once it is up. Shards,
// all of it: the quarry starts giving them up long before the lab is a thing you
// could afford, and a currency you cannot spend reads as scenery.
export const SCHOOL_COST = 4;    // shards to build it
// and the dust beside them. Every row in this game is priced in dust; the
// training grounds was the one that was not. It is the first building offered
// after the quarry opens, so the number is small enough to be a nod to the pile
// rather than a gate in front of the place that teaches everybody.
export const SCHOOL_DUST = 300;
// And what a trade costs once it is up. A helmet was two shards, which is about
// four minutes of one body in the quarry: cheap enough that kitting the whole yard
// out was something you did on the way past rather than something you saved for.
// A trade doubles what a body does at the thing it does, for good and for free
// from then on, and nothing else in the game gives that much away -- so it is
// priced like the decision it is. A thousand is a quarry running for a long
// while, which is what makes the first one worth choosing between the four.
// A thousand was priced against a cut that gave up shards far faster than this
// one does. Two bodies in the quarry bank about two shards a minute, so a
// thousand is seven hours of it -- a price nobody was ever going to pay, which
// makes the school scenery and the shard a currency you cannot spend all over
// again. Twenty is about ten minutes of a working cut for the first, and the
// rate below still doubles-and-a-bit it every time.
export let TRADE_COST = 20;    // and for the first of any one trade
export const TRADE_RATE = 1.6;   // each one after that
// The lip is as close to the rock as the rock's own spoil will allow, and not a
// cell further out. What has to fit between the apron and the lip is one full
// pile and a sweep of bare ground: 1400 grains at the angle sand stands at wants
// a base of 62 cells, and the biggest rock's apron reaches 204px out, so the
// strip runs to 576 and the lip stands 60 past that.
//
// It used to be 840, with the strip 372 wide and the rest of it bare. That gap
// was ground you dragged dust across by hand -- the first pile in the game is
// cleared with the cursor, before there is anybody hired to carry anything --
// and it was the length of the yard for no reason: nothing stands in it, nothing
// happens in it, and the pile it separates from the hole is the pile going into
// the hole. Closing it does not make the pit smaller or the pile smaller. It
// takes out the walk.

// The dev panel's rows for the knobs above. A row lives beside the binding it
// moves because nothing but this file can assign to one: an imported `let` is
// read-only everywhere else, so the get/set pair has to be written where the
// `let` is. config.js gathers every file's rows into one TUNABLE.
export const SCHOOL_KNOBS = [
  { key: 'TRADE_COST', label: 'a trade costs', min: 2, max: 4000, step: 2,
    get: () => TRADE_COST, set: v => { TRADE_COST = v; } }
];
