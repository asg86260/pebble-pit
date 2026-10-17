// --- act 3: the afterlife --------------------------------------------------------
// DESIGN.md, "Acts 3 and 4: the afterlife and hell (design, not built)", act 3:
// the union, its loop the owner's grove and press (2026-10-17). The scaffold
// only: the place stands and steps, and nothing a player can reach plays in
// it. Every name below is the spec's own; a number the spec gives is the
// spec's, and every other is a default chosen to stand the scaffold up,
// marked so in its comment, for the ladder book and the pace tool to move
// once the loop is built.
import { P } from './yard.js';

// The switch for the act (DESIGN.md, "Held-back flags"), set by the build:
// `VITE_AFTERLIFE=1`, which no build sets yet, so the free itch build, the
// Steam demo and the paid builds all keep the house standing and the pair on
// the bench for good. A dev build and the node yard stand the act whatever
// this says, the way they play the deep (acts.js, `afterlifeOn`), so work on
// it goes on; `__actsOn(false)` plays a released build's yard.
const env = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : {};
export const AFTERLIFE_ON = env.VITE_AFTERLIFE === '1';

// --- where it is -----------------------------------------------------------------
// One wide place on the cloud, above the yard's sky: a body that rises out of
// the yard arrives somewhere real, every position in it an ordinary world
// position (y above the yard's top is negative). Defaults, all four: the act
// has no drawing yet to size them against.
export const AFTER_GAP = P * 40;           // world px of sky between the yard's top and the cloud floor's underside (default)
export const AFTER_H = P * 120;            // the place's top to its cloud floor (default)
export const AFTER_W = P * 520;            // across: grove, camp, God's yard, the stair (default; the deep's width)
export const AFTER_FLOOR_MARGIN = P * 9;   // the cloud floor stands this far up off the window's foot (default; the deep's)
export const AFTER_OPEN_AT = 0.5;          // where across it the camera opens, a share of its width (default)
// The cloud floor's own depth, for the placeholder backdrop (render/after.js):
// a band of pale cells the place stands on. Default.
export const AFTER_FLOOR_CELLS = 6;

// --- the click: a cloud, and faith ----------------------------------------------
// After CHOP_CLICKS cloud hits the `axe` beat hands the pair an axe (call 15
// open: a click count, the recommendation, or a faith rung); a tree takes
// TREE_CHOPS chops. Both defaults.
export const CHOP_CLICKS = 60;             // default
export const TREE_CHOPS = 8;               // default
// A tree's three held stages, sapling to pole to crown, seconds a stage. Default.
export const TREE_GROW_S = 90;

// --- how support spreads ---------------------------------------------------------
// A soul's lean is the eight cells round its square: eight inked is a member
// (the spec's number). A poster inks a soul only to half (the spec's: half of
// the rim). The reaches and the word-of-mouth clock are defaults.
export const RIM_PIECES = 8;
export const POSTER_CAP = RIM_PIECES / 2;
export const SIGN_REACH = 3;               // files round a planted sign (default; "a few files")
export const POSTER_REACH = 40;            // the length of file that walks past a wall, in souls (default)
export const WORD_S = 30;                  // seconds a piece by word of mouth, between two members (default)

// --- the gates -------------------------------------------------------------------
// The first meeting is a count of members, won by canvassers alone; the
// slowdown and the strike are shares of the crowd as it stands. Defaults.
export const MEET_MEMBERS = 12;            // default
export const SLOW_SHARE = 0.4;             // default
export const STRIKE_SHARE = 0.8;           // default
// In the order they open (strike.js reads the reached one off `S.after.gate`).
export const AFTER_GATES = ['meeting', 'slowdown', 'strike'];

// --- the camp's cards and the chain ----------------------------------------------
// The eight cards, in the spec's order: the plate (the click), the hall
// (volunteers), the grove, the saw mill (and its fence), the workshop, the
// paper mill, the press and the well. Keys, not words: every name a player
// reads is the owner's, in locales/en.ftl, when the card is built.
export const AFTER_CARDS = ['plate', 'hall', 'grove', 'mill', 'workshop', 'papermill', 'press', 'well'];
// What the chain holds, made and spent (S.after.stock). Signs and posters are
// spent into the crowd, never banked as a bill; ink is never a bill either.
export const AFTER_STOCK = ['logs', 'timber', 'sawdust', 'paper', 'signs', 'posters'];
// The bands of every act-3 ladder, in the order the place hands out its
// coins: faith, then faith and timber, then faith, timber and paper, then
// timber, paper and the top band's coin. What the top band is paid in is
// call 12, open (a pledge, recommended, or a rare drop): null holds its seat.
export const AFTER_TOP_COIN = null;
export const AFTER_BANDS = [['faith'], ['faith', 'timber'], ['faith', 'timber', 'paper'], ['timber', 'paper', AFTER_TOP_COIN]];

// --- the placeholder backdrop ----------------------------------------------------
// High key: white cloud and pale floor, black only for rims (DESIGN.md, "The
// look"). Rungs of the one grey ramp (palette.js, GREY), lightest first; the
// floor's cells pick among them so it is never one flat tone.
export const AFTER_FLOOR_TONES = [1, 1, 2, 1, 2, 3];
