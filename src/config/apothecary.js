import { P } from './yard.js';

// --- the apothecary -------------------------------------------------------------
// A hut, a bookshelf of stock, and a row of pots on their fires. The farm's crop
// goes in and comes back out as tonics the yard is under. Every number the
// building turns on is here; the behavior is in apothecary.js. See DESIGN.md,
// "The apothecary".
//
// It opens shortly after the plots are broken -- it is the reason the plots are
// worth breaking -- so it is priced the way the farm is: a core, and dust a
// small early yard can just about find. A core, because a place costs a core;
// less dust than the lab, because it stands earlier than the lab.
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
// This ladder is climbed one tonic at a time now (item 14): a rung deepens the
// tonic it was bought for and leaves the rest of the menu where it was, so
// leaning on one brew is a decision rather than a side effect of any purchase.
// See `potencyLevel` in apothecary.js.
export const STRENGTH0 = 0.25;
export const STRENGTH5 = 0.60;

// The three tonics the game opens with. Each is a crop base plus one reagent
// that is never the coin of the station it boosts, and each effect is a lever
// the game already has: the stew scales a body's own action, the bracing tonic
// lifts its crit chance, the strong brew widens what a hauler carries. The magic
// numbers are the level-0 effects; each tonic's own potency ladder climbs its
// own.
export const TONIC_STEW_WORK = 0.25;   // +25% work, its own main action
export const TONIC_BRACE_CRIT = 0.08;  // +8 points of crit chance
export const TONIC_STRONG_CARRY = 0.50;// +50% carried a trip

// The ladders, priced spore + dust like every tier-two row (rockhandpick's
// shape). `doses a brew` and `bodies a brew` are one rung here, not two: a dose
// is one body, one buff -- a fresh dose refreshes the timer rather than stacking
// -- so "more doses" and "more bodies reached" are the same sentence. See the
// report and DESIGN.md "Open".
export const BREW_RUNG_SPORE = 5;      // first rung, spore, rungCost-shaped
export const BREW_RUNG_DUST = 300;     // and the dust half, per the house rule

// How many doses a stirrer takes out of the building in one trip, rung by rung.
// One at level nought -- a body carrying a single vial, which is what it always
// did -- then two, three and four, so a full ladder is one walk where there used
// to be four. Three rungs, not five: the pace of the round is the thing being
// bought and four vials in a pair of hands is where that stops being believable.
export const DOSE_CARRY = [1, 2, 3, 4];
export const CARRY_RUNGS = DOSE_CARRY.length - 1;

// One stirrer to a pot, and one pot to begin with. `another pot` breaks standing
// room for one more -- capOfBare-shaped, the farm's "another plot" exactly.
export const APOTH_POTS0 = 1;          // pots the building comes with
export const APOTH_POTS_MAX = 4;       // and the most it can hold
export const POT_COST = 700;           // dust for the second pot after it
export const POT_RATE = 1.7;           // and how much steeper each one gets

// --- how the building stands on the ground ------------------------------------
// Hut, then shelves, then pots, left to right: you meet the building itself
// first, the stock it holds next, and the fires last, which is the order the
// place works in and the order the eye wants (item 18).
//
// The width is the building's widest FUTURE self -- room for every pot the place
// can ever hold -- for the farm's reason: ground is reserved when the table
// names a site, so breaking room for a fourth pot must never shove the lab along.
export const APOTH_HUT_W = P * 10;     // the main building: the door, the sign, the board
export const APOTH_HUT_H = P * 10;     // and how tall it stands, gable and all
export const APOTH_SHELF_W = P * 7;    // the bookshelf of stock beside it
export const APOTH_SHELF_H = P * 12;   // three shelves, one to a tonic, and a frame
export const APOTH_GAP = P * 3;        // bare ground between hut, shelves and the first pot
export const POT_W = P * 13;           // a cauldron is this wide...
// Four clear cells between one belly and the next. Bellies this fat need real
// air between them or four of them in a row read as one black wall rather than
// as four pots -- and the walk has room for it now that GROUND_LEFT is derived
// from the site table rather than typed, so a wider building buys its own ground
// instead of overflowing somebody else's.
export const POT_PITCH = P * 17;       // ...and this is the step from one to the next
// Where the row of pots starts, measured in from the building's left edge, and
// where a keeper stands: at its own pot's left, clear of the belly and reaching
// in. Both are derived rather than typed, so moving the shelf moves the pots.
export const APOTH_POT_ROW = APOTH_HUT_W + APOTH_GAP + APOTH_SHELF_W + APOTH_GAP;
export const APOTH_POT_STAND = P * 2;  // a keeper stands this far left of its pot
export const APOTHECARY_W = APOTH_POT_ROW
                          + POT_PITCH * (APOTH_POTS_MAX - 1) + POT_W;

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

// How much of a tonic's own colour the fire under its pot takes. The flame runs
// hot at the foot and cools into the brew's colour at the tip, so which pot is
// on which tonic reads from across the yard without a label (item 18).
export const FLAME_HOT = 0.62;         // how far the foot is washed toward white
export const FLAME_TIP = 0.28;         // and how far the middle of it is
export const FLAME_STEAM = 0.35;       // the tint the steam off that pot carries
