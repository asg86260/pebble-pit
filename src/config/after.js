// --- act 3: the afterlife --------------------------------------------------------
// DESIGN.md, "Acts 3 and 4: the afterlife and hell (design, not built)", act 3:
// the union, its loop the owner's grove and press (2026-10-17), reworked to
// the owner's settled calls (2026-10-18). Every name below is the spec's own;
// a number the spec gives is the spec's, and every other is a default chosen
// to stand the act up, marked so in its comment, for the pace tool to move.
import { P } from './yard.js';
import { AFTER_JOB as J } from '../jobs.js';

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
export const AFTER_FLOOR_MARGIN = P * 9;   // the cloud floor stands this far up off the window's foot (default; the deep's)
// The cloud floor (render/after/floor.js; docs/mocks/act3-place-2026-10-18,
// floor A, the billow edge): the walking line itself billows in puffs of
// one or two cells, pressed flat under every station, and two fainter puff
// contours drift under it, the nearer this far down and the further that.
export const AFTER_BILLOW_SEED = 3;        // which run of puffs (the mock's layout strip)
export const AFTER_BILLOW_BIG = 0.55;      // the share of puffs two cells high, the rest one
export const AFTER_DRIFT_ROWS = [4, 9];    // the two contours, cells under the line
export const AFTER_DRIFT_RATE = [0.25, -0.15];  // ...and how fast each slides, cells a second

// --- the click: the pair's speech, and rebel ------------------------------------
// The act's coin is rebel (the owner, 2026-10-18; a working name, the label
// the owner's): the pair on a pedestal in the camp, facing God's yard, and
// every click on them a line of a speech that knocks rebel off as motes,
// counted where they land on the pile. The axe is bought on the pedestal's
// card (call 15, settled), and a tree then takes TREE_CHOPS chops. Defaults.
export const TREE_CHOPS = 8;               // default
// A tree's three held stages, sapling to pole to crown, seconds a stage. Default.
export const TREE_GROW_S = 90;

// --- how support spreads ---------------------------------------------------------
// Signs and posters are the only way a soul is won. A soul's lean is the
// eight cells round its square: eight inked is a member (the spec's number),
// who walks out of God's yard to the camp (call 14, settled). A poster inks
// a soul only to half (the spec's: half of the rim). The reaches are
// defaults, each with the reach its card's upgrade buys.
export const RIM_PIECES = 8;
export const POSTER_CAP = RIM_PIECES / 2;
export const SIGN_REACH = 2;               // files round a planted sign (default; "a few files")
export const SIGN_REACH_UP = 3;            // ...with the workshop's bigger sign (default)
export const POSTER_REACH = 30;            // the length of file that walks past a wall, in souls (default)
export const POSTER_REACH_UP = 60;         // ...with the press's further reach (default)

// --- the gates -------------------------------------------------------------------
// Each reads off how empty God's yard is: the first meeting a count of souls
// walked out to the camp; the slowdown and the strike the share of the
// crowd, as it stands, that has walked out. Defaults.
export const MEET_MEMBERS = 12;            // default
export const SLOW_SHARE = 0.4;             // default
export const STRIKE_SHARE = 0.8;           // default
// In the order they open (strike.js reads the reached one off `S.after.gate`).
export const AFTER_GATES = ['meeting', 'slowdown', 'strike'];

// --- the camp's cards and the chain ----------------------------------------------
// The eight cards: the pedestal (the speech, the axe, the agitators), the
// construction shack (every station that can be built), the grove, the saw
// mill, the chipper, the workshop, the paper mill and the press. Keys, not words: every
// name a player reads is the owner's, in locales/en.ftl.
export const AFTER_CARDS = ['pedestal', 'shack', 'grove', 'mill', 'chipper', 'workshop', 'papermill', 'press'];
// What the chain holds, made and spent (S.after.stock). Signs and posters are
// spent into the crowd, never a bill. The logs are two piles, the saw mill's
// (`logs`) and the chipper's (`chiplogs`), each where its haulers drop them.
export const AFTER_STOCK = ['logs', 'chiplogs', 'timber', 'sawdust', 'paper', 'signs', 'posters'];

// --- act 3's loop, placeholder (track A, 2026-10-17; reworked 2026-10-18) ----------
// The grove and the press on the scaffold, every drawing a placeholder of
// flat cells, reworked to the owner's settled calls (DESIGN.md, "Act 3's own
// calls", "Settled by the owner, 2026-10-18") and the pedestal's speech.
// Every number below is a default chosen to stand the loop up and watch it
// run; none is the spec's unless its comment says so.

// --- the layout, left to right (place.js reads these) ---
export const AFTER_GROVE_X0 = P * 12;      // the grove's first plot's left, clear of the counter in the view's corner
export const AFTER_PLOTS0 = 1;             // plots the grove starts with, a grown tree in it (call 10, the owner's)
export const AFTER_PLOT_MAX = 4;           // ...and the most its card clears
// The grove's pine, a stage a row (render/after/pine.js draws it, after/grove.js
// clicks it, after/place.js lays it out): its trunk [width, height] in cells,
// and its tiers { v0, h, s }: a tier's foot v0 cells over the top of the
// trunk, h rows tall, its top row 2s+1 wide. The big pine (the grove's bigger
// trees) is the grown one with a tier more under it.
export const AFTER_PINE = {
  1: { trunk: [1, 1], tiers: [{ v0: 0, h: 3, s: 0 }] },
  2: { trunk: [1, 1], tiers: [{ v0: 0, h: 4, s: 1 }, { v0: 4, h: 3, s: 0 }] },
  3: { trunk: [3, 2], tiers: [{ v0: 0, h: 6, s: 2 }, { v0: 6, h: 5, s: 1 }, { v0: 11, h: 4, s: 0 }] },
  big: { trunk: [3, 3], tiers: [{ v0: 0, h: 7, s: 3 }, { v0: 7, h: 6, s: 2 }, { v0: 13, h: 5, s: 1 }, { v0: 18, h: 4, s: 0 }] }
};
// A plot is as wide as the big pine's foot, its widest row (the bottom
// tier's bottom row, h - 1 + s cells either side of the trunk), and a gap,
// so the biggest trees stand clear of each other.
const BIG_FOOT = (t => 2 * (t.h - 1 + t.s) + 1)(AFTER_PINE.big.tiers[0]);
export const AFTER_PLOT_GAP = 2;           // cells of floor between two big pines' feet
export const AFTER_PLOT_STEP = P * (BIG_FOOT + AFTER_PLOT_GAP);
// The grove's end, in cells: everything right of it is laid off it, so a
// wider grove moves the camp, God's yard and the stair along with it.
const GROVE_END = AFTER_GROVE_X0 / P + AFTER_PLOT_MAX * AFTER_PLOT_STEP / P;
// The members waiting are our crowd behind the camp (render/aftercrowd.js,
// OURS_X0 to the pedestal): a member walking out of God's yard walks into its
// front at the end nearest God's yard, and one going to a post steps out of
// its front at the point nearest the post (after/place.js, `campSpot`), each
// fading over this as it goes into the crowd or comes out of it.
export const AFTER_JOIN_FADE_S = 0.5;
// A pile's count stands on a plate of paper this many screen px proud of its digits.
export const AFTER_COUNT_PAD = 2;
// The camp's stations, left to right (layout A, docs/mocks/act3-place-2026-10-18):
// each the left edge of its ground in cells off the place's left (laid off
// the grove's end), its piles
// and its drawing laid off that (after/place.js, `ART`). The mill nearest the
// grove and the chipper turned to face it, the sawdust heap between them
// (both tip onto it), the shack, and the pedestal
// nearest God's yard, facing it, with open floor past it for the walk across.
export const AFTER_STATIONS = {
  mill:      { at: GROVE_END + 12 },
  chipper:   { at: GROVE_END + 57 },
  papermill: { at: GROVE_END + 89 },
  workshop:  { at: GROVE_END + 120 },
  press:     { at: GROVE_END + 150 },
  shack:     { at: GROVE_END + 191 },
  pedestal:  { at: GROVE_END + 254 }
};
// The pedestal is a lump of the cloud floor pushed up, this many cells high.
export const AFTER_PEDESTAL_H = 4;
// The stations standing from the act's first frame: the pedestal the pair
// speak from and the construction shack that sells every other.
export const AFTER_START_BUILT = ['pedestal', 'shack'];
export const AFTER_BUILD_FADE_S = 2;       // a piece of a station, a plot cleared or a post put up fades in over this
// A station bought on the shack is raised a piece at a time, a band of its
// box from the floor up, by a builder at its door: a member from the camp,
// or the pair down off the pedestal when nobody is waiting there.
export const AFTER_BUILD_PIECES = 4;
export const AFTER_BUILD_PIECE_S = 3;      // a builder's piece
// The crowd field: files across God's yard, the near ranks drawn as bodies
// (a soul and its eight rim cells, three cells square) and the far ranks a
// cell a soul, thinning back up the screen.
export const CROWD_X0 = P * (GROVE_END + 292);   // the first file's left, past the walk across from the pedestal
export const CROWD_FILES = 40;
export const CROWD_PITCH = P * 4;          // across a file
export const CROWD_NEAR = 5;               // ranks drawn as bodies
export const CROWD_ROW = P * 4;            // a near rank's depth up the screen
export const CROWD_FAR_ROW = P * 2;        // a far rank's, every other one staggered half a file
export const AFTER_CROWD = 1200;           // souls standing at the act's start
// Inked full by the refusal, in the front rank: the camp's first members, the
// hands for the first posts (a woodcutter, a hauler, a sawyer, a joiner, a
// carrier, and one to agitate or spare).
export const AFTER_FIRST_MEMBERS = 6;
export const AFTER_KIN_SHARE = 0.15;       // souls of the player's own lines, arriving part-inked
export const AFTER_KIN_PIECES = 3;         // ...up to this many pieces
export const AFTER_RISE_S = 30;            // a soul rising into the back of the crowd (the spec's "a soul every half-minute")
export const AFTER_WALL_STEP = P * 4;      // a poster's slot along the fence at the crowd's front
export const AFTER_STAIR_X = P * (GROVE_END + 492);   // the stair's head, the throne's ground
// Across the whole place: grove, camp, God's yard, the stair (the mock's layout A).
export const AFTER_W = AFTER_STAIR_X + P * 4;
export const AFTER_STAIR_W = P * 36;       // the stair's run, foot to head
export const AFTER_STAIR_RISE = P * 50;    // how high the throne stands off the floor
// A station's posts: a stake each along its roof, filled black while a member
// holds it (or is walking to), hollow grey while it waits for one.
export const AFTER_POST_STEP = P * 2;

// --- the sky, and rebel ---
// The clouds are scenery: they drift and nothing clicks them.
export const AFTER_SKY_LO = P * 62;        // the lowest a cloud drifts, above the floor
export const AFTER_SKY_HI = P * 92;        // the highest
export const AFTER_CLOUDS = 5;             // clouds drifting at once
export const AFTER_CLOUD_EVERY_S = 6;      // a new one drifting in, at most this often
export const AFTER_CLOUD_DRIFT = [6, 14];  // px/s, slowest and fastest
export const AFTER_CLOUD_SIZE = [3, 5];    // a cloud's puffs, fewest and most
export const AFTER_CLOUD_FADE_S = 1.2;     // a cloud fades in, and out, over this
// The speech: a click on the pair is a line of it, a pose held with a shout
// mark over them, and its rebel knocked off as motes that fall to the pile
// beside the pedestal and are counted there.
export const AFTER_SHOUT_REBEL = 2;        // a line's rebel
export const AFTER_SHOUT_REBEL_UP = 5;     // ...with the pedestal's bigger speech
export const AFTER_SHOUT_HOLD_S = 0.35;    // the pose and the mark held after a line
export const AFTER_MOTE_FALL = 60;         // px/s a mote of rebel comes down
export const AFTER_MOTE_RISE = P * 6;      // how far up off a speaker's head a mote is knocked before it falls
export const AFTER_MOTES_A_HIT = 4;        // motes a line at most, its rebel shared among them
// An agitator: a member at a post beside the pedestal, a line of their own on
// a slow clock, worth less than the pair's (they win nobody: rebel only).
export const AFTER_AGITATE_S = 4;
export const AFTER_AGITATE_REBEL = 1;

// --- the grove ---
// A tree's logs, and a big one's (planted after the grove's "bigger trees");
// its shape is AFTER_PINE, above.
export const AFTER_LOGS_A_TREE = 3;
export const AFTER_LOGS_BIG_TREE = 5;
export const AFTER_GROW_S_UP = 45;         // seconds a growth stage with the grove's "faster growth"
export const AFTER_FALL_FRAMES = 4;        // a falling tree's held frames, upright to down
export const AFTER_FALL_S = 1.6;           // ...over this
export const AFTER_CROWN_FADE_S = 2.5;     // the fallen crown's cells fading off
export const AFTER_CHOP_HOLD_S = 0.25;     // a swing held on the blow
export const AFTER_FELL_S = 1.5;           // a woodcutter's swing at a tree
// A stump blocks its plot until it is dug out; dug, a sapling is set in it,
// free (the owner, 2026-10-18). The hand digs one in a few clicks, each a held
// swing; a woodcutter digs one only once the grove's stump removal is bought.
export const AFTER_DIG_CLICKS = 3;
export const AFTER_DIG_S = 4;              // a woodcutter digging a stump out

// --- the mills, the workshop, the press ---
// Every station is worked by the click first (the owner, 2026-10-18): a
// click on the mill saws a cut, on the paper mill pulls a sheet, on the
// workshop joins a sign, on the press pulls a stack; its mark held a moment.
// A post bought on its card then works it on the worker's clock, slower.
export const AFTER_WORK_HOLD_S = 0.3;
export const AFTER_LOG_TIMBER = 2;         // what a log saws into: timber (the fence is cut, a fixed split)
export const AFTER_LOG_SAWDUST = 2;        // ...and sawdust
export const AFTER_BLADE_LOGS = 2;         // logs a cut takes with the mill's second blade
export const AFTER_SAWDUST_BRIM = 24;      // the heap's brim while there is no paper mill
export const AFTER_SAWDUST_BRIM_UP = 48;   // ...with the mill's bigger heap
// The saw never stops for good: with no paper mill a click on the heap tips
// a load through the cloud's edge beside it (a notch in the floor), the heap
// held tipped a moment and the grains falling and fading; and a sawyer tips
// a load there too once the heap has stood at its brim a while.
export const AFTER_TIP_LOAD = 8;           // sawdust a tip takes, by the click or a sawyer
export const AFTER_TIP_HOLD_S = 0.4;       // the heap held tipped
export const AFTER_SPILL_S = 1.2;          // the grains falling through the notch and fading
export const AFTER_NOTCH_AT = 5;           // the notch, cells right of the heap's middle: just past its foot
export const AFTER_HEAP_R = 4;             // the sawdust heap at its brim, a triangle this many cells high
export const AFTER_SWEEP_WAIT_S = 8;       // the heap stands at its brim, its mark up, this long before a sawyer tips
export const AFTER_SAW_S = 4;              // a sawyer's cut
export const AFTER_SIGN_TIMBER = 2;        // timber a sign: signs are timber alone (call 11)
export const AFTER_SIGN_S = 6;             // a joiner's sign
export const AFTER_BENCH_SIGNS = 2;        // signs a joining with the workshop's second bench
// The chipper: logs into sawdust only, no timber.
export const AFTER_CHIP_SAWDUST = 4;       // sawdust a log
export const AFTER_CHIP_SAWDUST_UP = 6;    // ...with the chipper's wider spout
export const AFTER_CHIP_LOGS = 2;          // logs a feed takes with the chipper's second drum
export const AFTER_CHIP_S = 4;             // a feeder's feed
export const AFTER_PULP_SAWDUST = 2;       // sawdust a sheet of paper
export const AFTER_PULP_S = 4;             // a pulper's pull
export const AFTER_VAT_SHEETS = 2;         // sheets a pull with the paper mill's bigger vat
export const AFTER_DRY_SHEETS = 2;         // ...and again with its drying line, a second sheet at once
export const AFTER_POSTER_PAPER = 1;       // paper a stack: posters are paper alone (call 11)
export const AFTER_STACK = 2;              // posters a stack
export const AFTER_STACK_UP = 4;           // ...with the press's bigger stack
export const AFTER_PRESS_S = 5;            // a printer pulling a stack
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

// --- God's pushback ---
export const AFTER_SPEECH_S = 150;         // between the throne's speeches; halved past the slowdown
export const AFTER_SPEECH_WARN_S = 6;      // warned this long ahead
export const AFTER_SPEECH_FILES = 12;      // files its sweep crosses
export const AFTER_SPEECH_HOLD_S = 1.5;    // the glare held across them
export const AFTER_WARDENS = [1, 1, 2, 4]; // wardens on rounds, by gate reached (the slowdown doubles them)
export const AFTER_WARDEN_REST_S = 25;     // a warden's rest between rounds
export const AFTER_TEAR_S = 3;             // a warden tearing a poster down
export const AFTER_PULL_S = 2;             // ...or pulling a sign up

// --- the members and their posts ---
// Members in the camp are not workers (call 14, settled): a post is bought at
// a station with rebel, each dearer than the last, and a member walks from
// the camp to hold it. A post with nobody waiting in the camp stands empty.
export const AFTER_WALK = 42;              // px/s, every body up here
export const AFTER_JOBS = [J.AGITATE, J.CUT, J.HAUL, J.SAW, J.CHIP, J.PULP, J.JOIN, J.CARRY, J.PRINT, J.PASTE];
// The station each job's post is bought at, so which card sells it and which
// station must stand before it is offered.
export const AFTER_JOB_POST = {
  [J.AGITATE]: 'pedestal', [J.CUT]: 'grove', [J.HAUL]: 'grove', [J.SAW]: 'mill', [J.CHIP]: 'chipper',
  [J.PULP]: 'papermill', [J.JOIN]: 'workshop', [J.CARRY]: 'workshop',
  [J.PRINT]: 'press', [J.PASTE]: 'press'
};
export const AFTER_POST_REBEL0 = 12;       // the first post
export const AFTER_POST_RATE = 1.15;       // each one dearer, every station's counted together

// --- the cards ---
// Every station the shack can build, all of them on its board and priced
// from the start (the owner, 2026-10-18: the gates offer nothing), each
// locked only behind a station it truly needs first: timber comes off the
// saw mill, sawdust off the saw mill or the chipper, and posters are printed
// on paper. `needs` is the stations any one of which must stand first.
export const AFTER_BUILDS = {
  mill:      { needs: [],                   bill: [['rebel', 40]] },
  chipper:   { needs: [],                   bill: [['rebel', 50]] },
  workshop:  { needs: ['mill'],             bill: [['rebel', 60]] },
  papermill: { needs: ['mill', 'chipper'],  bill: [['rebel', 200], ['timber', 30]] },
  press:     { needs: ['papermill'],        bill: [['rebel', 250], ['timber', 40]] }
};
// Every station's upgrades: no bands, no ladders (call 12, settled -- act 3 is
// outside the eight-rungs rule): two or three short named upgrades a card,
// each a change on screen, paid in rebel, timber and paper. Each row is its
// card and its bills, one bill a time it can be bought -- once for all but
// the grove's plots, a plot a bill. The posts are sold beside them (rows.js);
// the stations themselves on the shack (AFTER_BUILDS).
export const AFTER_UPGRADES = {
  'after-shout':       { card: 'pedestal',  bills: [[['rebel', 30]]] },                                  // a bigger speech
  'after-axe':         { card: 'pedestal',  bills: [[['rebel', 50]]] },                                  // the axe (call 15)
  'after-plot':        { card: 'grove',     bills: [[['rebel', 40]], [['rebel', 80], ['timber', 10]],
                                                    [['rebel', 160], ['timber', 30]]] },                 // a plot cleared, AFTER_PLOT_MAX in all
  'after-grow':        { card: 'grove',     bills: [[['rebel', 60], ['timber', 10]]] },                  // faster growth
  'after-tree':        { card: 'grove',     bills: [[['rebel', 120], ['timber', 30]]] },                 // bigger trees
  'after-stumps':      { card: 'grove',     bills: [[['rebel', 100], ['timber', 20]]] },                 // stump removal: woodcutters dig stumps too
  'after-blade':       { card: 'mill',      bills: [[['rebel', 80], ['timber', 20]]] },                  // a second blade
  'after-heap':        { card: 'mill',      bills: [[['rebel', 60], ['timber', 10]]] },                  // a bigger heap
  'after-bench':       { card: 'workshop',  bills: [[['rebel', 120], ['timber', 40]]] },                 // a second bench
  'after-signreach':   { card: 'workshop',  bills: [[['rebel', 200], ['timber', 40], ['paper', 10]]] },  // a bigger sign
  'after-drum':        { card: 'chipper',   bills: [[['rebel', 70], ['timber', 15]]] },                  // a second drum
  'after-spout':       { card: 'chipper',   bills: [[['rebel', 90], ['timber', 20]]] },                  // a wider spout: more sawdust a log
  'after-vat':         { card: 'papermill', bills: [[['rebel', 150], ['timber', 30]]] },                 // a bigger vat
  'after-dry':         { card: 'papermill', bills: [[['rebel', 180], ['timber', 30], ['paper', 10]]] },  // a drying line
  'after-stack':       { card: 'press',     bills: [[['rebel', 200], ['timber', 30], ['paper', 20]]] },  // a bigger stack
  'after-posterreach': { card: 'press',     bills: [[['rebel', 300], ['timber', 40], ['paper', 30]]] }   // a bigger poster, reaching further
};

// --- act 3's place and station art (track A, 2026-10-18) -------------------------
// The mocks the owner voted (docs/mocks/act3-place-2026-10-18,
// docs/mocks/act3-stations-2026-10-18): the stations' working poses and the
// pair's bubbles.
// A station shows its working pose this long after a unit of hand work: the
// mocks' cycle, so one click plays one turn of the moving part.
export const AFTER_ART_WORK_S = 2.4;
export const AFTER_PILE_FADE_S = 0.4;      // a thing coming onto or off a pile fades over this
export const AFTER_FALL_POSES = [0.08, 0.3, 0.7, 1.15];   // a falling pine's held angles, radians, over AFTER_FALL_S
// The pair's speech bubbles (after/bubbles.js): one sent up off a speaker's
// head this often while they stand on the pedestal, rising and fading; every
// AFTER_BUBBLE_BIG_EVERY-th one twice the size and quicker.
export const AFTER_BUBBLE_EVERY_S = 2.5;
export const AFTER_BUBBLE_LIFE_S = 4.3;
export const AFTER_BUBBLE_RISE = 12.5;      // px/s
export const AFTER_BUBBLE_HOLD = 0.55;      // the share of its life a bubble holds full ink before it fades
export const AFTER_BUBBLE_BIG_EVERY = 5;
export const AFTER_BUBBLE_BIG_RISE = 2.5;   // ...a big one's rise, times a small one's
export const AFTER_BUBBLE_POP_S = 0.3;      // a bubble taken fades out over this
