import { P } from './yard.js';

// --- the apothecary -------------------------------------------------------------
// A pot, a fire and somebody stirring. The farm's crop goes in and comes back
// out as a tonic the whole yard is under. Every number the building turns on is
// here; the behavior is in apothecary.js. See DESIGN.md, "The apothecary".
//
// It opens shortly after the plots are broken -- it is the reason the plots are
// worth breaking -- so it is priced the way the farm is: a core, and dust a
// small early yard can just about find. A core, because a place costs a core;
// less dust than the lab, because it stands earlier than the lab.
export const APOTHECARY_W = P * 24;    // the stock shelf, the stirrer, and the cauldron, left to right
export const APOTHECARY_H = P * 15;    // room for the fat belly, the bail handle and steam
export const APOTHECARY_CORES = 1;     // a place costs a core
export const APOTHECARY_DUST = 900;    // and dust, a shade above the plots it follows

// A tonic is a crop base plus a reagent. The crop is the green drain the whole
// design wants; the reagent is the second coin that gives the recipe its
// identity. Both are spent when a brew starts -- carried in, in spirit, though
// the general carried-to-the-site machinery is a follow-up (see the report).
export const BREW_CROP = 5;            // spore a brew, on every tonic -- the green drain
export const BREW_REAGENT = 2;         // the second coin a brew, per the recipe

// The pot at level 0, and where each ladder takes it by its fifth rung. Every
// one of these eases straight across `RUNGS` the way the crit ladders do.
export const BREW_MS0 = 30000;         // 30 s a batch at brew-speed 0...
export const BREW_MS5 = 15000;         // ...and 15 s at the top: drain and coverage double
export const BUFF_MS0 = 60000;         // a dose lasts a minute at buff-length 0...
export const BUFF_MS5 = 180000;        // ...three minutes at the top
export const DOSES0 = 3;               // bodies a brew reaches at doses 0...
export const DOSES5 = 8;               // ...eight at the top
// Buff strength: the fraction a level-0 dose is worth, and at the top. The stew
// is +25% at level 0 -- the lab's own STEP, one familiar size -- and +60% maxed.
// Every tonic's own effect is scaled by the same climb, so one ladder deepens
// the whole menu at once. See `strengthMult` in apothecary.js.
export const STRENGTH0 = 0.25;
export const STRENGTH5 = 0.60;

// The three tonics the game opens with. Each is a crop base plus one reagent
// that is never the coin of the station it boosts, and each effect is a lever
// the game already has: the stew scales a body's own action, the bracing tonic
// lifts its crit chance, the strong brew widens what a hauler carries. The magic
// numbers are the level-0 effects; the strength ladder climbs them together.
export const TONIC_STEW_WORK = 0.25;   // +25% work, its own main action
export const TONIC_BRACE_CRIT = 0.08;  // +8 points of crit chance
export const TONIC_STRONG_CARRY = 0.50;// +50% carried a trip

// The five ladders, priced spore + dust like every tier-two row (rockhandpick's
// shape). `doses a brew` and `bodies a brew` are one rung here, not two: a dose
// is one body, one buff -- a fresh dose refreshes the timer rather than stacking
// -- so "more doses" and "more bodies reached" are the same sentence. See the
// report and DESIGN.md "Open".
export const BREW_RUNG_SPORE = 5;      // first rung, spore, rungCost-shaped
export const BREW_RUNG_DUST = 300;     // and the dust half, per the house rule

// One stirrer to a pot, and one pot to begin with. `another pot` breaks standing
// room for one more -- capOfBare-shaped, the farm's "another plot" exactly.
export const APOTH_POTS0 = 1;          // pots the building comes with
export const APOTH_POTS_MAX = 4;       // and the most it can hold
export const POT_COST = 700;           // dust for the second pot after it
export const POT_RATE = 1.7;           // and how much steeper each one gets

// How fast a body under a tonic wears its mark down -- purely a draw rate, the
// mark fading as the dose runs out. Read off the dose's own clock, so nothing
// is stepped here; this is only how many cells the mark stands in when full.
export const DOSE_MARK_CELLS = 3;      // the mark on a buffed body, in cells
// How fast a stirrer walks a dose out to a body -- an errand pace, quicker than
// the farmhand's amble between plots and slower than a laden hauler's trudge.
export const APOTH_WALK = 2.4;

// The tonic burning off a dosed body -- a plume of coloured motes off the head.
// See `stepDoseMotes` in apothecary.js.
export const DOSE_MOTE_MS = 90;        // between one little puff and the next
export const DOSE_MOTE_RISE = 0.38;    // pixels a frame, well under the chimney's
export const DOSE_MOTE_LIFE = 0.55;    // seconds before it has gone into the page
export const DOSE_MOTE_HUE = 26;       // degrees of hue a mote may vary from its tonic
