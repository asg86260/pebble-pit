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

// What one batch of each tonic costs. Crop on every recipe -- the green drain
// the whole design wants -- plus the reagent that gives the recipe its
// identity, in amounts that differ from brew to brew. Both are spent when a
// brew starts. They were one flat pair (twelve spore, two of the reagent) on
// every line of the book, and a menu of five things at one price is a menu with
// no choice on it: the reagent's name changed and nothing else did. Now the
// shape of the bill is part of what the tonic is. The stew is the everyday brew
// and takes the everyday coin; the bracing tonic is the sharp one and pays for
// it in the scarce coin; the strong brew and the speed brew are the crop-heavy
// ones, the haulers' brews eating the haulers' own harvest; and the gleam brew
// is priced in sparks, the machines' coin, because a brew that makes sparks
// should cost the thing it makes, and a spark is the one price a wizard's owner
// already feels. `brewCost` in apothecary.js is nothing but a lookup on this,
// and the reagent named on each recipe in TONICS is the second line here.
export const BREW_BILL = {
  stew:   [['spore', 12], ['dust', 40]],
  brace:  [['spore', 10], ['shard', 4]],
  strong: [['spore', 16], ['shard', 2]],
  swift:  [['spore', 20]],
  gleam:  [['spore', 8],  ['spark', 3]]
};

// The pot's clock and the dose's. A batch is thirty seconds, and that is not
// a ladder: it was one (30 s down to 15 s), and with doses a brew and pots
// beside it every rung the building sold pushed production up while nothing
// drew it down, so an endgame yard brewed far past what its bodies could
// drink. The pot brews as fast as a keeper can light it; what you buy is how
// far a batch reaches (doses), how long it holds (dose length), and how deep
// each recipe goes (potency). All three read lists in config/rungs.js -- doses
// whole, so every rung on the card lands (it eased 3 -> 8 and rounded once,
// and two rungs read "5 -> 5"); potency one tonic at a time (item 14), a rung
// deepening the tonic it was bought for and leaving the rest of the menu where
// it was, see `potencyLevel` -- and so do their costs. The first rung was set
// at the door's own price (900 dust), not a fortieth of it: a board you can
// clear on the frame it opens is a list, not a set of choices
// (docs/critics-2026-09-10.md, B9).
export const BREW_MS = 30000;          // a batch, always

// The three tonics the game opens with. Each is a crop base plus one reagent
// that is never the coin of the station it boosts, and each effect is a lever
// the game already has: the stew scales a body's own action, the bracing tonic
// lifts its crit chance, the strong brew widens what a hauler carries. The magic
// numbers are the level-0 effects; each tonic's own potency list climbs its
// own (config/rungs.js, in the percent the row shows).
export const TONIC_STEW_WORK = 0.25;   // +25% work, its own main action
export const TONIC_BRACE_CRIT = 0.08;  // +8 points of crit chance
export const TONIC_STRONG_CARRY = 0.50;// +50% carried a trip
// The two wave-7 recipes, each for one trade only (items 21 and 25): the speed
// brew is the hauler's -- a hauler's whole day is the walk, so pace is the one
// lever a tonic can pull for it -- and the gleam brew is the wizard's, scaling
// what a bolt brings off the star. Both climb the same potency ladder shape as
// the first three.
export const TONIC_SWIFT_PACE = 0.25;  // +25% haul speed at potency 0
export const TONIC_GLEAM_SPARK = 0.20; // +20% sparks off a dosed wizard

// A stirrer carries one vial. It was a ladder (one to four an armful), and an
// armful is the walk being decoration: four vials in a pair of hands is four
// deals for one crossing of the yard, which is production climbing again by
// another name. One body, one dose, one walk -- the yard's rule.
export const DOSE_CARRY = 1;

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
// --- the shelf of stock -------------------------------------------------------
// A shelf of potions, said as potions: a bottle standing on a plank for every
// dose in stock, one plank to a tonic, the brew's own color in the glass. It
// was a narrow seven-cell case with a colored tick and a run of single cells on
// each board, and it read as a ladder with paint on it -- taller than it was
// wide, and nothing about it shaped like a bottle.
//
// So the box is wider than it is tall now, and everything in it is derived from
// what a bottle is rather than typed: change BOTTLE_W or SHELF_CAP and the case,
// the pots and the whole walk move to fit.
export const BOTTLE_W = 3;             // a bottle: a cork over a body this wide...
export const BOTTLE_H = 3;             // ...and this tall, cork row included
export const BOTTLE_PITCH = BOTTLE_W + 1;   // with a cell of air, or the bodies merge into a bar
export const SHELF_CAP = 5;            // bottles a plank shows before it starts counting instead
// The well the count lives in, at the far end of every plank. It is reserved
// whether or not there is a number in it, and that reservation IS the fix for
// the count that used to overlap the pots: a numeral drawn at a fixed size in
// screen pixels, placed against a gap measured in world pixels, overlaps at some
// zoom or some count no matter where you put it. Given ground of its own inside
// the case, and clipped to it, it cannot reach anything however big it gets.
export const SHELF_NUM_W = 3;          // cells of the plank always kept for the count
// ...and what it takes once there IS a count in it: the last bottle's place as
// well. A plank showing four bottles and a readable "12" says more than five
// bottles and a speck -- the numeral is the reading at that point, and the fifth
// bottle was only ever saying "and more".
export const SHELF_NUM_WIDE = SHELF_NUM_W + BOTTLE_PITCH;
// The floor on the numeral, in cells of its own height. Everything else in this
// game is measured in cells, and a glyph is the one thing that was not: it was
// shrunk to fit by fractions of a CSS pixel and came out unreadable. Two cells
// tall is the smallest a number in this yard may be.
export const SHELF_NUM_MIN = 2;
export const SHELF_PAD = 1;            // and a cell of air inside each wall
export const APOTH_SHELF_ROWS = BOTTLE_H + 1;    // a bottle and the plank under it
export const APOTH_SHELF_W = P * (2 + SHELF_PAD * 2
                                    + SHELF_CAP * BOTTLE_PITCH - 1
                                    + 1 + SHELF_NUM_W);
export const APOTH_SHELF_H = P * (1 + 3 * APOTH_SHELF_ROWS);   // a plank a tonic, and a top
export const APOTH_GAP = P * 3;        // bare ground between hut, shelves and the first pot
export const POT_W = P * 13;           // a cauldron is this wide...
// ...and this tall. It is the CAULDRON grid's own row count -- the picture is
// the truth and this follows it, so retyping a row into the grid means changing
// this too. What wants it is the box you click to set that pot's brew, which is
// not drawing and so cannot read the grid.
export const POT_H = P * 10;
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

// The tonic burning off a dosed body -- a plume of colored motes off the head.
// See `stepDoseMotes` in apothecary.js.
export const DOSE_MOTE_MS = 90;        // between one little puff and the next
export const DOSE_MOTE_RISE = 0.38;    // pixels a frame, well under the chimney's
export const DOSE_MOTE_LIFE = 0.55;    // seconds before it has gone into the page
export const DOSE_MOTE_HUE = 26;       // degrees of hue a mote may vary from its tonic

// How much of a tonic's own color the fire under its pot takes. The flame runs
// hot at the foot and cools into the brew's color at the tip, so which pot is
// on which tonic reads from across the yard without a label (item 18).
export const FLAME_HOT = 0.62;         // how far the foot is washed toward white
export const FLAME_TIP = 0.28;         // and how far the middle of it is
export const FLAME_STEAM = 0.35;       // the tint the steam off that pot carries

// The swatch under a pot -- the block of the brew's own color that says what
// that cauldron is set to. It used to be the brew's name spelled out, which was
// a word to read in a yard where nothing else is read, and five words in a row
// once the pots were bought. The color is the register the building already
// says tonics in -- the bottles, the flame, the plume off a dosed body -- so the
// block says it in one glance and in the same language, and an empty block says
// the pot is set to nothing, which the name had no way of saying at all.
export const POT_SWATCH = 3;           // the block, in cells on a side
export const POT_SWATCH_EDGE = 0.4;    // its ink border, in cells
export const POT_SWATCH_DROP = 0.5;    // cells of air between the ground and it
