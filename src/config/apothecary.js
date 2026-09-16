import { P } from './yard.js';

// --- the apothecary -------------------------------------------------------------
// A hut, a bookshelf of stock, and a row of pots on their fires. The farm's crop
// goes in and comes back out as tonics the yard is under. Every number the
// building turns on is here; the behavior is in apothecary.js. See DESIGN.md,
// "The apothecary".
//
// It opens shortly after the plots are broken, so it is priced the way the farm
// is: a core, because a place costs a core, and less dust than the lab because
// it stands earlier.
export const APOTHECARY_H = P * 15;    // room for the fat belly, the bail handle and steam
export const APOTHECARY_CORES = 1;     // a place costs a core
export const APOTHECARY_DUST = 900;    // and dust, a shade above the plots it follows

// What one batch of each tonic costs. Crop on every recipe, plus the coin the
// brew's AXIS is about: the stew is speed and costs crop alone; the strong brew
// is strength and is priced in ore; the bracing tonic is crit and is priced in
// sparks (DESIGN.md, "Three brews, one a coin, read per trade"). Nothing is
// priced in dust: a brew is a running cost, not a rung. `brewCost` in
// apothecary.js is a lookup on this.
export const BREW_BILL = {
  stew:   [['spore', 12]],
  strong: [['spore', 16], ['shard', 4]],
  brace:  [['spore', 10], ['spark', 3]]
};

// A batch is thirty seconds and not a ladder: with doses a brew and pots beside
// it, a faster pot pushes production up while nothing draws it down. What you
// buy is doses, dose length and potency, each off its list in config/rungs.js;
// potency climbs one tonic at a time (`potencyLevel`).
export const BREW_MS = 30000;          // a batch, always

// The three brews, and what each is worth at potency nought. Every body reads
// the axis in its own trade's terms (`speedBoost` and `strengthBoost` in
// apothecary.js); each brew's potency list climbs its own (config/rungs.js).
export const TONIC_STEW_SPEED = 0.25;     // +25% quicker, whatever the trade's clock is
export const TONIC_STRONG_STRENGTH = 0.25;// +25% more, whatever the trade makes a go
export const TONIC_BRACE_CRIT = 0.08;     // +8 points of crit chance, for whoever rolls

// One body, one dose, one walk: an armful of vials is four deals for one
// crossing of the yard, which is production climbing by another name.
export const DOSE_CARRY = 1;

// One stirrer to a pot, and one pot to begin with. `another pot` breaks standing
// room for one more -- capOfBare-shaped, the farm's "another plot" exactly.
export const APOTH_POTS0 = 1;          // pots the building comes with
export const APOTH_POTS_MAX = 4;       // and the most it can hold
export const POT_COST = 700;           // dust for the second pot after it
export const POT_RATE = 1.7;           // and how much steeper each one gets

// --- how the building stands on the ground ------------------------------------
// Hut, then shelves, then pots, left to right: the order the place works in.
//
// The width is the building's widest FUTURE self, room for every pot it can
// ever hold: ground is reserved when the table names a site, so breaking room
// for a fourth pot must never shove the lab along.
export const APOTH_HUT_W = P * 10;     // the main building: the door, the sign, the board
export const APOTH_HUT_H = P * 10;     // and how tall it stands, gable and all
// --- the shelf of stock -------------------------------------------------------
// A bottle standing on a plank for every dose in stock, one plank to a tonic,
// the brew's own color in the glass. Everything in the box is derived from what
// a bottle is: change BOTTLE_W or SHELF_CAP and the case, the pots and the
// whole walk move to fit.
export const BOTTLE_W = 3;             // a bottle: a cork over a body this wide...
export const BOTTLE_H = 3;             // ...and this tall, cork row included
export const BOTTLE_PITCH = BOTTLE_W + 1;   // with a cell of air, or the bodies merge into a bar
export const SHELF_CAP = 5;            // bottles a plank shows before it starts counting instead
// The well the count lives in, at the far end of every plank, reserved whether
// or not there is a number in it: a numeral drawn at a fixed screen size
// against a gap measured in world pixels overlaps at some zoom no matter where
// it is put. Ground of its own inside the case, clipped, cannot reach anything.
export const SHELF_NUM_W = 3;          // cells of the plank always kept for the count
// ...and what it takes once there IS a count in it: the last bottle's place as
// well, since the fifth bottle was only ever saying "and more".
export const SHELF_NUM_WIDE = SHELF_NUM_W + BOTTLE_PITCH;
// The floor on the numeral, in cells of its own height: shrunk to fit by
// fractions of a CSS pixel it comes out unreadable.
export const SHELF_NUM_MIN = 2;
export const SHELF_PAD = 1;            // and a cell of air inside each wall
export const APOTH_SHELF_ROWS = BOTTLE_H + 1;    // a bottle and the plank under it
export const APOTH_SHELF_W = P * (2 + SHELF_PAD * 2
                                    + SHELF_CAP * BOTTLE_PITCH - 1
                                    + 1 + SHELF_NUM_W);
export const APOTH_SHELF_H = P * (1 + 3 * APOTH_SHELF_ROWS);   // a plank a tonic, and a top
export const APOTH_GAP = P * 3;        // bare ground between hut, shelves and the first pot
export const POT_W = P * 13;           // a cauldron is this wide...
// ...and this tall: the CAULDRON grid's own row count, so retyping a row into
// the grid means changing this too. The click box that sets a pot's brew wants
// it and cannot read the grid.
export const POT_H = P * 10;
// Four clear cells between one belly and the next, or four pots in a row read
// as one black wall.
export const POT_PITCH = P * 17;       // ...and this is the step from one to the next
// Where the row of pots starts, measured in from the building's left edge, and
// where a keeper stands. Derived, so moving the shelf moves the pots.
export const APOTH_POT_ROW = APOTH_HUT_W + APOTH_GAP + APOTH_SHELF_W + APOTH_GAP;
export const APOTH_POT_STAND = P * 2;  // a keeper stands this far left of its pot
export const APOTHECARY_W = APOTH_POT_ROW
                          + POT_PITCH * (APOTH_POTS_MAX - 1) + POT_W;


// The tonic burning off a dosed body -- a plume of colored motes off the head.
// See `stepDoseMotes` in apothecary.js.
export const DOSE_MOTE_MS = 90;        // between one little puff and the next
export const DOSE_MOTE_RISE = 0.38;    // pixels a frame, well under the chimney's
export const DOSE_MOTE_LIFE = 0.55;    // seconds before it has gone into the page
export const DOSE_MOTE_HUE = 26;       // degrees of hue a mote may vary from its tonic

// How much of a tonic's own color the fire under its pot takes: hot at the
// foot, cooling into the brew's color at the tip, so which pot is on which
// tonic reads from across the yard without a label.
export const FLAME_HOT = 0.62;         // how far the foot is washed toward white
export const FLAME_TIP = 0.28;         // and how far the middle of it is
export const FLAME_STEAM = 0.35;       // the tint the steam off that pot carries

// The swatch under a pot: a block of the brew's own color saying what that
// cauldron is set to, in the register the building already says tonics in. An
// empty block says the pot is set to nothing.
export const POT_SWATCH = 3;           // the block, in cells on a side
export const POT_SWATCH_EDGE = 0.4;    // its ink border, in cells
export const POT_SWATCH_DROP = 0.5;    // cells of air between the ground and it
