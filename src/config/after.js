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
export const AFTER_W = P * 440;            // across: grove, camp, God's yard, the stair (default; sized to the placeholder layout below)
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
// call 12, open (a pledge, recommended, or a rare drop): the pledge stands in
// its seat as the placeholder (rows.js), a member off the crowd a rung.
export const AFTER_TOP_COIN = 'pledge';
export const AFTER_BANDS = [['faith'], ['faith', 'timber'], ['faith', 'timber', 'paper'], ['timber', 'paper', AFTER_TOP_COIN]];

// --- the placeholder backdrop ----------------------------------------------------
// High key: white cloud and pale floor, black only for rims (DESIGN.md, "The
// look"). Rungs of the one grey ramp (palette.js, GREY), lightest first; the
// floor's cells pick among them so it is never one flat tone.
export const AFTER_FLOOR_TONES = [1, 1, 2, 1, 2, 3];

// --- act 3's loop, placeholder (track A, 2026-10-17) ------------------------------
// The grove and the press built on the scaffold, every drawing a placeholder
// of flat cells. Every number below is a default chosen to stand the loop up
// and watch it run, for the ladder book and the pace tool to move; none is
// the spec's unless its comment says so.

// --- the layout, left to right (place.js reads these) ---
export const AFTER_GROVE_X0 = P * 4;       // the grove's first plot's left
export const AFTER_PLOTS = 10;             // plots in the grove
export const AFTER_PLOT_STEP = P * 9;      // across a plot
// The camp's stations, left to right, each its left edge in cells off the
// place's left and its width in cells: the mill nearest the grove, the hall
// nearest God's yard.
export const AFTER_STATIONS = {
  mill:      { at: 110, w: 12 },
  papermill: { at: 133, w: 11 },
  workshop:  { at: 148, w: 11 },
  press:     { at: 163, w: 11 },
  well:      { at: 178, w: 7 },
  plate:     { at: 189, w: 7 },
  hall:      { at: 200, w: 12 }
};
// The stations standing from the act's first frame: the plate the click
// lands on, the hall that hires, the well the ink falls to.
export const AFTER_START_BUILT = ['plate', 'hall', 'well'];
export const AFTER_BUILD_FADE_S = 2;       // a station bought fades in over this
// The crowd field: files across God's yard, the near ranks drawn as bodies
// (a soul and its eight rim cells, three cells square) and the far ranks a
// cell a soul, thinning back up the screen.
export const CROWD_X0 = P * 236;           // the first file's left
export const CROWD_FILES = 40;
export const CROWD_PITCH = P * 4;          // across a file
export const CROWD_NEAR = 5;               // ranks drawn as bodies
export const CROWD_ROW = P * 4;            // a near rank's depth up the screen
export const CROWD_FAR_ROW = P * 2;        // a far rank's, every other one staggered half a file
export const AFTER_CROWD = 1200;           // souls standing at the act's start
export const AFTER_FIRST_MEMBERS = 4;      // inked full by the refusal, in the front rank
export const AFTER_KIN_SHARE = 0.15;       // souls of the player's own lines, arriving part-inked
export const AFTER_KIN_PIECES = 3;         // ...up to this many pieces
export const AFTER_RISE_S = 30;            // a soul rising into the back of the crowd (the spec's "a soul every half-minute")
export const AFTER_WALL_STEP = P * 4;      // a poster's slot along the fence at the crowd's front
export const AFTER_STAIR_X = P * 436;      // the stair's head, the throne's ground
export const AFTER_STAIR_W = P * 36;       // the stair's run, foot to head
export const AFTER_STAIR_RISE = P * 50;    // how high the throne stands off the floor

// --- the sky: clouds, faith and ink ---
export const AFTER_SKY_LO = P * 62;        // the lowest a cloud drifts, above the floor
export const AFTER_SKY_HI = P * 92;        // the highest
export const AFTER_CLOUDS = 7;             // clouds drifting at once
export const AFTER_CLOUD_EVERY_S = 3;      // a new one drifting in, at most this often
export const AFTER_CLOUD_DRIFT = [6, 14];  // px/s, slowest and fastest
export const AFTER_CLOUD_SIZE = [3, 5];    // a white cloud's puffs, fewest and most
export const AFTER_STORM_SHARE = 0.25;     // of new clouds, storm grey
export const AFTER_THUNDER_SHARE = 0.04;   // of new clouds, a thunderhead
export const AFTER_THUNDER_SIZE = 8;
export const AFTER_THUNDER_BURST = 6;      // a thunderhead hit gives this many hits' faith
export const AFTER_CLOUD_FADE_S = 1.2;     // a cloud fades in, and out, over this
export const AFTER_PUFF_S = 0.4;           // a puff's cells pushing out and fading
export const AFTER_MOTE_FALL = 90;         // px/s a mote of faith or a drop of ink comes down
export const AFTER_MOTES_A_HIT = 4;        // motes a hit at most, the faith shared among them
export const AFTER_GATHER_S = 3;           // a gatherer's swing
export const AFTER_GATHER_FAITH = 1;       // a swing's faith: the click stays worth more
export const AFTER_POLE = P * 70;          // how far up a gatherer's pole reaches

// --- the grove ---
export const AFTER_LOGS_A_TREE = 3;
export const AFTER_FALL_FRAMES = 4;        // a falling tree's held frames, upright to down
export const AFTER_FALL_S = 1.6;           // ...over this
export const AFTER_CROWN_FADE_S = 2.5;     // the fallen crown's cells fading off
export const AFTER_CHOP_HOLD_S = 0.25;     // a swing held on the blow
export const AFTER_FELL_S = 1.5;           // a feller's swing
export const AFTER_GRUB_S = 4;             // a planter grubbing a stump and setting a sapling
export const AFTER_SAPLING_FAITH = 3;      // what a sapling costs

// --- the mills, the workshop, the press ---
export const AFTER_LOG_YIELD = 4;          // what a log saws into, timber and sawdust together
export const AFTER_FENCE_STEPS = [1, 2, 3];// the fence's settings: timber of the yield, coarse to fine
export const AFTER_FENCE0 = 2;             // where the fence starts
export const AFTER_SAWDUST_BRIM = 24;      // the heap's brim before the paper mill opens
export const AFTER_SWEEP_LOAD = 8;         // sawdust a sweep carries off the cloud's edge
export const AFTER_SWEEP_WAIT_S = 8;       // the heap stands at its brim, its mark up, this long before a sawyer sweeps
export const AFTER_SIGN_TIMBER = 2;
export const AFTER_SIGN_INK = 1;
export const AFTER_PULP_SAWDUST = 2;       // sawdust a sheet of paper
export const AFTER_POSTER_PAPER = 1;
export const AFTER_POSTER_INK = 1;
export const AFTER_PRESS_S = 5;           // a printer pulling a stack
export const AFTER_PLANT_S = 1.5;          // a carrier planting a sign
export const AFTER_PASTE_S = 1.2;          // a paster pasting a poster
export const AFTER_PASTE_LOAD = 4;         // posters a paster carries out
export const AFTER_SIGN_GAP = 4;           // files at least between two signs

// --- how support spreads ---
export const AFTER_SPREAD_HZ = 4;          // the crowd is worked this many times a second
export const AFTER_SIGN_INK_S = 6;         // a sign inks a piece on each soul in reach, this often
export const AFTER_POSTER_INK_S = 10;      // a poster, to half
export const AFTER_POSTER_LIFE_S = 240;    // a poster weathers off after this
export const AFTER_POSTER_FADE_S = 2;      // a torn poster's strips fading
export const AFTER_CANVASS_S = 2;          // a canvasser's word, a piece
export const AFTER_CANVASS_RANKS = 3;      // canvassers work the front ranks

// --- God's pushback ---
export const AFTER_SPEECH_S = 150;         // between speeches; halved past the slowdown
export const AFTER_SPEECH_WARN_S = 6;      // warned this long ahead
export const AFTER_SPEECH_FILES = 12;      // files its sweep crosses
export const AFTER_SPEECH_HOLD_S = 1.5;    // the glare held across them
export const AFTER_WARDENS = [1, 1, 2, 4]; // wardens on rounds, by gate reached (the slowdown doubles them)
export const AFTER_WARDEN_REST_S = 25;     // a warden's rest between rounds
export const AFTER_TEAR_S = 3;             // a warden tearing a poster down
export const AFTER_PULL_S = 2;             // ...or pulling a sign up

// --- the volunteers ---
export const AFTER_WALK = 42;              // px/s, every body up here
export const AFTER_JOBS = ['canvasser', 'gatherer', 'planter', 'feller', 'hauler', 'sawyer',
                           'pulper', 'joiner', 'printer', 'carrier', 'paster'];
// Which station a job stands at, and so which station must stand before it
// is hired; null for a job that works the open cloud.
export const AFTER_JOB_POST = {
  canvasser: null, gatherer: 'plate', planter: 'grove', feller: 'grove', hauler: 'grove',
  sawyer: 'mill', pulper: 'papermill', joiner: 'workshop', printer: 'press',
  carrier: 'workshop', paster: 'press'
};
export const AFTER_HIRE_FAITH0 = 12;       // the first volunteer
export const AFTER_HIRE_RATE = 1.15;       // each one dearer

// --- the cards ---
// What a station's door costs, and the gate that offers it (how many of
// AFTER_GATES are reached, 1 the meeting); the grove opens on the meeting
// alone.
export const AFTER_DOORS = {
  mill:      { gate: 1, bill: [['faith', 40]] },
  workshop:  { gate: 1, bill: [['faith', 60]] },
  papermill: { gate: 2, bill: [['faith', 200], ['timber', 30]] },
  press:     { gate: 2, bill: [['faith', 250], ['timber', 40]] }
};
// What a band coin is worth in faith, turning a rung's written cost into each
// coin of its bill; a pledge is one whole member, however dear the rung.
export const AFTER_PER = { faith: 1, timber: 4, paper: 6 };
// Every act-3 ladder is a written table in LADDERS' shape (config/rungs.js):
// a value at each of its nine stands, foot to top, in the row's unit, and
// what each of its eight rungs costs in faith.
const AFTER_COST = [8, 15, 25, 40, 60, 90, 130, 180];
export const AFTER_LADDERS = {
  'after-puff':    { value: [1, 2, 3, 4, 6, 8, 11, 15, 20], cost: AFTER_COST },              // faith a hit
  'after-axe':     { value: [8, 7, 6, 5, 5, 4, 4, 3, 3], cost: AFTER_COST.map(c => c * 2) }, // chops a tree (TREE_CHOPS the foot)
  'after-grow':    { value: [90, 80, 70, 62, 55, 48, 42, 36, 30], cost: AFTER_COST },        // seconds a growth stage (TREE_GROW_S the foot)
  'after-saw':     { value: [4, 3.6, 3.2, 2.8, 2.5, 2.2, 1.9, 1.6, 1.4], cost: AFTER_COST }, // seconds a log
  'after-joinery': { value: [6, 5.4, 4.8, 4.2, 3.7, 3.2, 2.8, 2.4, 2], cost: AFTER_COST },   // seconds a sign
  'after-pulp':    { value: [4, 3.6, 3.2, 2.8, 2.5, 2.2, 1.9, 1.6, 1.4], cost: AFTER_COST }, // seconds a sheet
  'after-print':   { value: [2, 2, 3, 3, 4, 4, 5, 5, 6], cost: AFTER_COST },                 // posters a stack
  'after-wring':   { value: [1, 2, 2, 3, 3, 4, 5, 6, 7], cost: AFTER_COST }                  // ink a storm hit
};
// Which card each ladder hangs on.
export const AFTER_LADDER_CARD = {
  'after-puff': 'plate', 'after-axe': 'plate', 'after-grow': 'grove', 'after-saw': 'mill',
  'after-joinery': 'workshop', 'after-pulp': 'papermill', 'after-print': 'press', 'after-wring': 'well'
};
