// --- act 3: the afterlife --------------------------------------------------------
// DESIGN.md, "Acts 3 and 4: the afterlife and hell (design, not built)", act 3:
// the union, its loop the owner's grove and press (2026-10-17), reworked to
// the owner's settled calls (2026-10-18). Every name below is the spec's own;
// a number the spec gives is the spec's, and every other is a default chosen
// to stand the act up, marked so in its comment, for the pace tool to move.
import { P } from './yard.js';
import { AFTER_JOB as J } from '../jobs.js';
import { campLayout, rampRun, ART as CAMP_ART, CAMP_ORDER, SIGN as CAMP_SIGN } from '../after/art.js';
import { AFTER_ZONE_GAP, AFTER_UNION_W } from './aftercrowd.js';
import { ACT_GATES_CELL, ACT_GATES_REACH } from './acts.js';
import { AFTER_BLOCK } from './afterpiles.js';

// The switch for the act (DESIGN.md, "Held-back flags"), set by the build:
// `VITE_AFTERLIFE=1`, which no build sets yet, so the free itch build, the
// Steam demo and the paid builds all keep the house standing and the pair on
// the bench for good. A dev build and the node yard stand the act whatever
// this says, the way they play the deep (acts.js, `afterlifeOn`), so work on
// it goes on; `__actsOn(false)` plays a released build's yard.
const env = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : {};
// Act 3's art is drawn at this many grid cells a cell of its own: every
// station, the shack, the grove's pines at every stage, the stumps and the
// felled trees, the pedestal and its podiums, and the piles, each cell of the
// mocks' drawings this many cells across, so the art stays on the grid.
// One, the grid's own size, so a machine stands to the yard's bodies as the
// yard's own stations do (the owner, 2026-10-26: "machines at 1", after two
// read as a mill seventeen bodies tall). Everything laid off the art -- the
// camp's ground, the grove's plots, the doors, the piles, the parts the hand
// works -- is laid off it times this. The bodies keep the yard's size.
export const AFTER_ART_SCALE = 1;
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
// one or two cells, pressed flat under every station: the near edge of the
// main plane's cloud path (config/aftercrowd.js, GROUND_PATH).
export const AFTER_BILLOW_SEED = 3;        // which run of puffs (the mock's layout strip)
export const AFTER_BILLOW_BIG = 0.55;      // the share of puffs two cells high, the rest one
export const AFTER_PUFF_LEAST = 4;        // cells: a run of billow narrower than this between two flats is pressed flat too
// Shelves of cloud (the owner, 2026-10-22: the rolling swells tried and
// dropped, "i dont want the hills to go up then down"): each station's whole
// ground raised this many cells off the floor line, its own shelf, and an
// eased ramp of cloud between two shelves at different heights. The grove,
// the pedestal and God's crowd stand on the line itself. Three times the first
// shelves (the owner, 2026-10-26: "C. shelves and slopes", the camp rising about twenty
// cells), each ramp a cell a column at its steepest, the stations laid as
// far apart as their ramp needs (after/art.js, `rampRun`).
// The lip of billows along the path's front (render/after/ground.js; the
// owner, 2026-10-22, mock A): billows of radius r cells, as tall as `round`
// of that, `step` of a diameter apart so they overlap; their foot `drop`
// cells under the path's edge, a lit crest `crest` cells deep, the body
// hanging `hang` cells and a half-height billow more under that.
export const AFTER_LIP = { seed: 17, r: [5, 8], round: 0.45, step: 0.8, drop: 2, crest: 2, hang: 2 };
// The grove and the forestry shack stand on a floor raised 3 cells, so a
// plot's soil bed reads above the cloud's lip (DESIGN.md, "Act 3's grove,
// rebuilt", call 2).
export const AFTER_SHELF = { grove: 3, forestry: 3, mill: 9, workshop: 18, shack: 6, pedestal: 0 };

// --- the click: the pair's speech, and rebel ------------------------------------
// The act's coin is rebel (the owner, 2026-10-18; a working name, the label
// the owner's): the pair on a pedestal in the camp, facing God's yard, and
// every click on them a line of a speech that knocks rebel off as motes,
// counted where they land on the pile. A tree takes TREE_CHOPS strokes of
// the saw to come down. Defaults.
export const TREE_CHOPS = 8;               // default

// --- how support spreads ---------------------------------------------------------
// Signs are the only way a soul is won. A soul's lean is the eight cells
// round its square: eight inked is a member (the spec's number), who walks
// out of God's yard to the camp (call 14, settled). The reaches are
// defaults, each with the reach its card's upgrade buys.
export const RIM_PIECES = 8;
export const SIGN_REACH = 1;               // files round a planted sign (default; "a few files")
export const SIGN_REACH_UP = 2;            // ...with the workshop's bigger sign (default)

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
// The five cards: the pedestal (the speech and the agitators), the
// construction shack (every station that can be built), the grove (the saw
// and the trees), the saw mill and the workshop. Keys, not words: every
// name a player reads is the owner's, in locales/en.ftl.
export const AFTER_CARDS = ['pedestal', 'shack', 'grove', 'mill', 'workshop'];

// --- act 3's loop, placeholder (track A, 2026-10-17; reworked 2026-10-18) ----------
// The grove and the press on the scaffold, every drawing a placeholder of
// flat cells, reworked to the owner's settled calls (DESIGN.md, "Act 3's own
// calls", "Settled by the owner, 2026-10-18") and the pedestal's speech.
// Every number below is a default chosen to stand the loop up and watch it
// run; none is the spec's unless its comment says so.

// --- the layout, left to right (place.js reads these) ---
// The place's left end is heaven's gates (portals.js), where the souls come
// in; the grove's first plot starts past the gates' reach by the camp's own
// spacing between neighbors (AFTER_CAMP_GAP), so its first pine stands
// neither on the level's edge nor in the gateway.
export const AFTER_CAMP_GAP = 12;
export const AFTER_GROVE_X0 = P * (ACT_GATES_CELL + AFTER_CAMP_GAP) + ACT_GATES_REACH;
export const AFTER_PLOTS0 = 1;             // plots the grove starts with, a grown tree in it (call 10, the owner's)
export const AFTER_SEEDS0 = 5;             // acorns in the seed basket at the act's start, and in a save the rebuild reaches (the owner, 2026-10-30)
export const AFTER_PLOT_MAX = 4;           // ...and the most its card clears
// track A: the grove's tree (DESIGN.md, "Act 3's grove, rebuilt", "The tree,
// drawn"; the signed-off mock, OAK-2), in cells off a plot's line (the
// boundary between its trunk's two middle columns, so every row is an even
// width with no half cell), rows up from the floor (row -1 the bottom):
//   c0, w    the trunk's first column and its width: a log's
//   stump    rows of the stump, itself one whole log block
//   logs     logs end to end above it, `log` cells each: the trunk is
//            exactly the logs it breaks into
export const AFTER_TREE = { c0: -2, w: 4, stump: 4, logs: 4, log: 4 };
// The crown, OAK-2: clumps [x, y, r] in cells off the trunk's middle and up
// from its top, each off the middle mirrored, within AFTER_OAK_HALF a side.
export const AFTER_OAK = [[0, 7.5, 4.4], [3.8, 3.5, 3.8], [6, -1.5, 3], [0, -2.5, 3.4]];
export const AFTER_OAK_HALF = 9;
// A plot's soil bed, the columns it spans off the plot's line, one row deep.
export const AFTER_BED = [-6, 5];
// The trunk landed breaks along its seams into its logs: each hops a cell
// and comes down AFTER_BREAK_SPREAD px further from the trunk's middle over
// AFTER_BREAK_S, then lies as a log; the crown's clumps scatter under
// AFTER_CROWN_GRAV px/s^2 and fade over AFTER_CROWN_S, held whole for
// AFTER_CROWN_HOLD_S first (the mock's numbers).
export const AFTER_BREAK_S = 0.55;
export const AFTER_BREAK_SPREAD = 3;
export const AFTER_CROWN_S = 1.7;
export const AFTER_CROWN_HOLD_S = 0.3;
export const AFTER_CROWN_GRAV = 620;
export const AFTER_PLOT_GAP = 2;           // cells of floor between a plot's footprint and the shack's nearest claim
// A plot's step, derived (the owner, 2026-10-30: "~28 cells a plot"): the
// trunk's half on the fall side, its logs end to end with their spread, the
// stump-log's landing beside them, the gap, and the neighbor's soil bed
// reaching back toward it, so the logs and the stump always come to rest on
// their own plot.
const PLOT_CELLS = -AFTER_TREE.c0 + AFTER_TREE.logs * AFTER_TREE.log
  + Math.ceil(AFTER_BREAK_SPREAD * (AFTER_TREE.logs - 1) / 2 / P) + AFTER_TREE.log + AFTER_PLOT_GAP + AFTER_BED[1] + 1;
export const AFTER_PLOT_STEP = P * AFTER_ART_SCALE * PLOT_CELLS;
// Where the grove's raised floor starts, cells: past the gates' reach and the
// camp's gap, and the slope up to the grove's shelf.
export const AFTER_GROVE_START = AFTER_GROVE_X0 / P + rampRun(AFTER_SHELF.grove);
// The grove's end, in cells: its plots count from the shack's end, and
// everything right of it is laid off it, so a wider grove moves the camp,
// God's yard and the stair along with it.
const GROVE_END = AFTER_GROVE_START + AFTER_PLOT_MAX * AFTER_PLOT_STEP / P;
// The members waiting are our crowd behind the camp (render/aftercrowd.js,
// OURS_X0 to the pedestal): a member walking out of God's yard walks into its
// front at the end nearest God's yard, and one going to a post steps out of
// its front at the point nearest the post (after/place.js, `campSpot`), each
// fading over this as it goes into the crowd or comes out of it.
export const AFTER_JOIN_FADE_S = 0.5;
// A pile's count stands on a plate of paper this many screen px proud of its digits.
export const AFTER_COUNT_PAD = 2;
// The camp's stations, left to right (layout A, docs/mocks/act3-place-2026-10-18),
// laid off the grove's end by after/art.js (track A, 2026-10-18), with
// AFTER_STATION_GAP art cells of open floor between every two neighbors'
// grounds (the owner, 2026-10-20: "a bit closer together", then "too far
// apart ... and inconsistently placed": six, the grove's end to the
// forestry shack the same; ten once each stood a shop sign at its end,
// 2026-10-21, "they run together a bit"; sixteen for room to ramp between
// the shelves, 2026-10-22, "lets space em a part a bit"; each ground running from its first
// drawn column to its last, after/art.js). Each is the
// left edge of its ground in cells off the place's left (`at`); its piles
// and its drawing are laid off that.
export const AFTER_STATION_GAP = 16;
// The forestry shack's ground starts at the grove's end itself: the plot
// nearest it keeps the grove's own gap off it (after/place.js, `plotX`).
const CAMP = campLayout(GROVE_END, AFTER_STATION_GAP, AFTER_ART_SCALE, AFTER_SHELF, 0);
// The level's three zones (DESIGN.md, "The level, the two crowds and the
// flags"): the workshops -- the grove and every station but the pedestal --
// then AFTER_ZONE_GAP cells of open floor, the union's camp AFTER_UNION_W
// cells across with the pedestal at its middle, as much open floor again,
// and God's camp (config/aftercrowd.js).
const WORKS_END = Math.max(...CAMP_ORDER.filter(k => k !== 'pedestal').map(k => CAMP.stations[k].at + CAMP_ART[k].ground * AFTER_ART_SCALE));
const UNION_END = WORKS_END + AFTER_ZONE_GAP + AFTER_UNION_W;
CAMP.stations.pedestal.at = WORKS_END + AFTER_ZONE_GAP + Math.round((AFTER_UNION_W - CAMP_ART.pedestal.ground * AFTER_ART_SCALE) / 2);
export const AFTER_STATIONS = CAMP.stations;
// The pair's podium (DESIGN.md, "The level, the two crowds and the flags"):
// a ladder of five, low and in the first plane -- a soapbox crate, crates
// stacked two high with a plank, a plank stage with the fist banner, a cloud
// plinth of squared blocks with steps, the Greek cloud column -- drawn in the
// mock's cells (docs/mocks/act3-level-2026-10-19, a3podium2) at AFTER_PODIUM_U
// px a cell -- the mock's two, times the art's scale -- so the soapbox stands
// over the pair's height. Each one's top over
// the floor, in those cells, where the pair stand; and the pair's two left
// edges off the podium's middle, px.
export const AFTER_PODIUM_U = 2 * AFTER_ART_SCALE;
export const AFTER_PODIUM_TOPS = [10, 20, 24, 30, 40];
// ...and each one's half across at its widest, in those cells.
export const AFTER_PODIUM_HALF = [11, 22, 24, 26, 22];
export const AFTER_PODIUM_PAIR = [-19, 1];
// The rebel pile at the podium's foot, this many art cells off its middle:
// clear of the widest of them.
export const AFTER_PODIUM_PILE = 9;
// A rung bought, the new podium is built where the old stood over this: the
// old fading out over the first `fade` of it, the new standing up a course at
// a time from `rise[0]` to `rise[1]`, the pair stepping up onto it from
// `step[0]` to `step[1]`.
export const AFTER_PODIUM_CLIMB = { s: 10, fade: 0.8, rise: [0.2, 0.8], step: [0.8, 0.9] };
// The stations standing from the act's first frame: the pedestal the pair
// speak from and the construction shack that sells every other.
export const AFTER_START_BUILT = ['pedestal', 'shack', 'forestry'];
// The camp's other stations stand whole from the start, closed until they are
// built: its board offers its rebuild, the shack's build row for it, and the
// station works once it is built. The ground each station's board stands
// over, beside it where its shop sign stood until 2026-10-27 (the station is
// its own shop now), in the act's art cells (AP): `w` by `h` over a gap
// `post` high, where after/art.js lays it.
export const AFTER_SIGN_BOARD = CAMP_SIGN;
// A closed station reads as not open yet (the owner, 2026-10-20: "seeing
// them in game doesnt read as closed"; the pick of three, an outline): a
// dotted plan of the station on the grid, its board at the door, filled in a
// course a piece of the build as each lands, the plan and the board fading.
// The product looks like the protest from the start (board card
// act3-trees-to-rebellion, the owner's pick A, 2026-10-20): the workshop
// letters the fist onto the sign as it works it, the finished signs stand in
// a rack outside it as the fist flags planted in God's crowd, and a carrier
// marches one out held high. A sign's flag cell, world px, held and racked;
// the rack's flags this many cells apart; a carried one this many cells over
// the carrier's head.
export const AFTER_SIGN_FLAG_U = { rack: 3, held: 2, apart: 8, up: 4 };
export const AFTER_BUILD_FADE_S = 2;       // a piece of a station, a plot cleared or a post put up fades in over this
// A station bought on the shack is raised a piece at a time, a band of its
// box from the floor up, by a builder at its door: a member from the camp,
// or the pair down off the pedestal when nobody is waiting there.
export const AFTER_BUILD_PIECES = 4;
export const AFTER_BUILD_PIECE_S = 3;      // a builder's piece
// The crowd field: files across God's yard, the near ranks drawn as bodies
// (a soul and its eight rim cells, three cells square) and the far ranks a
// cell a soul, thinning back up the screen.
export const CROWD_X0 = P * (UNION_END + AFTER_ZONE_GAP);   // the first file's left: God's camp, the open floor past the union's
export const CROWD_FILES = 40;
export const CROWD_PITCH = P * 4;          // across a file
export const CROWD_NEAR = 5;               // ranks drawn as bodies
export const CROWD_ROW = P * 4;            // a near rank's depth up the screen
export const CROWD_FAR_ROW = P * 2;        // a far rank's, every other one staggered half a file
export const AFTER_CROWD = 1600;           // souls standing at the act's start
// Inked full by the refusal, in the front rank: the camp's first members, the
// hands for the first posts (a woodcutter, a hauler, a sawyer, a joiner, a
// carrier, and three more carriers or agitators).
export const AFTER_FIRST_MEMBERS = 8;
export const AFTER_KIN_SHARE = 0.25;       // souls of the player's own lines, arriving part-inked
export const AFTER_KIN_PIECES = 5;         // ...up to this many pieces
export const AFTER_RISE_S = 30;            // a soul rising into the back of the crowd (the spec's "a soul every half-minute")
export const AFTER_STAIR_X = CROWD_X0 + P * 200;   // the stair's head, the throne's ground
// Across the whole place: grove, camp, God's yard, the stair (the mock's
// layout A), and AFTER_FAR_W cells of open cloud past them: room for the
// camera's last window at any width, which ends half a window past God's
// stage's front (acts.js, `PLACES`).
export const AFTER_FAR_W = 456;
export const AFTER_W = AFTER_STAIR_X + P * 4 + AFTER_FAR_W * P;
export const AFTER_STAIR_W = P * 36;       // the stair's run, foot to head
export const AFTER_STAIR_RISE = P * 50;    // how high the throne stands off the floor

// --- rebel ---
// (The sky's clouds are the one cloud renderer's: config/clouds.js, CLOUDS_ACT3.)
// The speech: a click on the pair is a line of it, a pose held with a shout
// mark over them, and its rebel knocked off as motes that fall to the pile
// beside the pedestal and are counted there.
// A line's rebel, by the podium the pair speak from: the higher, the further
// the speech carries.
export const AFTER_PODIUM_REBEL = [2, 3, 5, 7, 10];
export const AFTER_SHOUT_HOLD_S = 0.35;    // the pose and the mark held after a line
export const AFTER_MOTE_FALL = 60;         // px/s a mote of rebel comes down
export const AFTER_MOTE_RISE = P * 6;      // how far up off a speaker's head a mote is knocked before it falls
export const AFTER_MOTES_A_HIT = 4;        // motes a line at most, its rebel shared among them
// A member with no job, agitating at the podium: a line of their own on a
// slow clock, worth less than the pair's (they win nobody: rebel only).
export const AFTER_AGITATE_S = 4;
export const AFTER_AGITATE_REBEL = 1;
// A soul won pays this rebel, and a worker is bought out of the won with it
// on the pedestal's recruit row, priced as the yard prices a house: the
// first AFTER_RECRUIT_COST0, each after AFTER_RECRUIT_RATE dearer (DESIGN.md,
// "Act 3's workers are bought with rebel"; a first cut, to tune).
export const AFTER_WON_REBEL = 3;
export const AFTER_RECRUIT_COST0 = 10;
export const AFTER_RECRUIT_RATE = 1.15;

// --- the grove ---
// A tree grows from the acorn planted in its plot, row by row, over
// AFTER_TREE_GROW_S, or AFTER_TREE_GROW_S_UP with the grove's "faster
// growth" (DESIGN.md, "Act 3's grove, rebuilt": the same total growth as the
// two held stages it replaces); the acorn is first seen sinking into the
// soil over AFTER_SEED_SINK_S, and the growth starts once it is in.
export const AFTER_TREE_GROW_S = 60;
export const AFTER_TREE_GROW_S_UP = 30;
export const AFTER_SEED_SINK_S = 0.9;
// A tree sawn through tips over as one drawing turned by its true angle,
// quicker as it goes (the motion rule, the owner 2026-10-20), and hits the
// ground in AFTER_FALL_S; it rocks back off the ground and settles over
// AFTER_FALL_BOUNCE_S, AFTER_FALL_BOUNCE radians at most; then its trunk
// breaks into its logs (AFTER_BREAK_S, above) and its crown into clumps.
export const AFTER_FALL_S = 1.6;
export const AFTER_FALL_BOUNCE_S = 0.35;
export const AFTER_FALL_BOUNCE = 0.06;
// A member's swing held on the blow (the agitator's stir).
export const AFTER_CHOP_HOLD_S = 0.25;
// A stump's roots: each snaps on a strain held (the hand) or a pull (a
// woodcutter, once stump removal is bought), and with the last the stump
// comes out as a log.
export const AFTER_DIG_CLICKS = 3;

// --- the saw mill and the workshop ---
// Every station is worked by the click first (the owner, 2026-10-18): a
// click on the mill saws a cut, on the workshop joins a sign; its mark held
// a moment.
// A post bought on its card then works it on the worker's clock, slower.
export const AFTER_WORK_HOLD_S = 0.3;
export const AFTER_SAW_S = 3;              // a sawyer's cut
export const AFTER_SIGN_TIMBER = 4;        // timber blocks a sign: signs are timber alone (call 11), a 4x4 of four 2x2s
export const AFTER_SIGN_S = 25;             // a joiner's sign
export const AFTER_BENCH_SIGNS = 2;        // signs a joining with the workshop's second bench
export const AFTER_PLANT_S = 1.5;          // a carrier planting a sign
export const AFTER_PUT_S = 0.3;
// --- goods on the floor ---
// The pile a good lying on the floor is carried back to by a gatherer: the
// one its station makes it onto.
export const AFTER_GOODS_HOME = { log: 'grovelogs', plank: 'timber', sign: 'signs', acorn: 'seeds' };
// A pile's reach for the hover and its footprint, art cells up off the
// floor: its tallest stack (a sign on its post) and a cell over.
export const AFTER_PILE_REACH = 10;
// A good lying on the floor, art cells across where the hover finds it (a
// log and a plank their blocks, config/afterpiles.js), and the art cells
// between two let go from one load.
export const AFTER_GOODS_FOOT = { log: AFTER_BLOCK.log, plank: AFTER_BLOCK.plank, sign: 4, acorn: AFTER_BLOCK.acorn };
export const AFTER_LAY_GAP = 1;
// The most of a load drawn stacked over a head: past it the stack would
// stand taller than the camp's stations.
export const AFTER_CARRY_SHOWN = 6;
export const AFTER_SIGN_GAP = 2;           // files at least between two signs

// --- how support spreads ---
export const AFTER_SPREAD_HZ = 4;          // the crowd is worked this many times a second
export const AFTER_SIGN_INK_S = 36;         // a sign inks a piece on each soul in reach, this often

// --- God's pushback ---
// The throne's speech burns a sign as often as a carrier can
// march a sign out (the coordinator, 2026-10-20: the act's pace must not
// hang on how wide the camp is drawn). Its interval is AFTER_BURN_MARCHES
// sign marches -- a carrier's walk from where it takes a sign at the
// workshop to God's crowd's near edge, at AFTER_WALK (after/place.js,
// `signMarch`) -- halved past the slowdown. The multiple is the act's
// balance as tuned: a speech every AFTER_SPEECH_S over the march of
// AFTER_SPEECH_MARCH px it was tuned against (the camp at the art's first
// size), so a wider camp gives the carriers the same race against the burn.
export const AFTER_SPEECH_S = 100;
export const AFTER_SPEECH_MARCH = 1236;
export const AFTER_SPEECH_WARN_S = 6;      // warned this long ahead

// --- the members and their jobs ---
// Every member won over is a worker (DESIGN.md, "Act 3's crew: assigned like
// the yard's"): one with no job stands at the podium and agitates there, and
// a station takes members through the yard's roster under it, a seat at a
// time, one seat to start and more bought on its board.
export const AFTER_WALK = 150;             // px/s, every body up here (the owner, 2026-10-21: "a lot faster" than 50)
export const AFTER_BURN_MARCHES = AFTER_SPEECH_S / (AFTER_SPEECH_MARCH / AFTER_WALK);
// One job a station (DESIGN.md, "Act 3: one job a station"): its worker
// runs the station's whole round, its input fetched and its output taken out.
export const AFTER_JOBS = [J.CUT, J.SAW, J.JOIN];
// The station each job works at, so which station's roster it stands on and
// which board sells its seats; the woodcutter's is the forestry shack's.
export const AFTER_JOB_POST = { [J.CUT]: 'grove', [J.SAW]: 'mill', [J.JOIN]: 'workshop' };
// The idle members' spots behind the pedestal, a body and a cell apart; as
// many stand there as the floor holds up to the last workshop, the rest in
// the crowd, agitating all the same.
export const AFTER_IDLE_STEP = P * 4;
// A roster stands this far under the cloud floor, as the yard's stands under
// its ground line (roster.js, `postAt`): its sprite clear of the floor and
// of what lies on it.
export const AFTER_ROSTER_DOWN = P * 10;
// ...and this much further: a post with a board carries its UPGRADES button
// over its count (roster.js), and the button must clear the cloud's lip.
export const AFTER_ROSTER_SHOP_DROP = P * 6;
// A job's seats past the first, the bill for each in turn (the owner,
// 2026-10-20: "Each station should be locked to one worker, and more slots
// can be purchased per station"): rebel and dust first, then timber and
// crops, then ore, the last the deep's scales; one row a job, so the grove's
// jobs are bought apart.
export const AFTER_SEAT_BILLS = [
  [['rebel', 15], ['dust', 2000]],
  [['rebel', 30], ['dust', 4000]],
  [['rebel', 50], ['dust', 8000], ['spore', 2000]],
  [['rebel', 80], ['timber', 3], ['dust', 12000], ['spore', 4000]],
  [['rebel', 120], ['timber', 5], ['dust', 20000], ['spore', 6000]],
  [['rebel', 180], ['timber', 10], ['dust', 30000], ['spore', 9000], ['shard', 8000]],
  [['rebel', 260], ['timber', 14], ['dust', 45000], ['spore', 12000], ['shard', 12000]],
  [['rebel', 360], ['timber', 16], ['dust', 60000], ['spore', 16000], ['shard', 16000]],
  [['rebel', 500], ['timber', 18], ['dust', 80000], ['spore', 20000], ['shard', 20000], ['scale', 800]]
];

// --- the cards ---
// Every bill up here takes the yard's coins too (DESIGN.md, "The yard pays
// too", the owner, 2026-10-18): the yard keeps running while the pair are
// dead, so a well-kept yard funds the union. They are added in the order the
// yard hands them out -- the cheapest and earliest bills rebel and dust, then
// crops (`spore`), then ore (`shard`), the top upgrades a spark -- with
// timber on the bigger ones as before. The yard's share is sized
// in seconds of a finished yard's income (act3-pace.mjs, LATE_YARD: about
// 900 dust, 240 crops, 300 ore and 65 sparks a second, read off a played
// yard at the deep's door): a quarter of a minute of it for the first
// stations, two to four for the top upgrades. From the ore band on a bill names the deep's scales too
// (AFTER_YARD_COINS), sized to a late deep: seven stations at their top
// rungs shed about 25 a second (tools/node/deep-pace.mjs --table) and the
// floor holds some ten thousand, so a bill is one to three thousand, a
// minute or three of the deep's, and the ten that name them take about
// fifteen thousand across the act. Across the act that is about a third of what the yard
// makes, so it matters, and paced against the rebel it is never the only
// thing a bill waits on. The rebel tops out near three minutes of the
// speech's, so nothing on a card is ever a long wait. The yard's coins keep
// the yard's own names, so a card draws them with the yard's marks (words.js
// `MARK`).
//
// Every station the shack can build, all of them on its board and priced
// from the start (the owner, 2026-10-18: the gates offer nothing), each
// locked only behind a station it truly needs first: timber comes off the
// saw mill. `needs` is the stations any one of which must stand first.
// Listed in camp order, the order the shack's board lists them.
export const AFTER_BUILDS = {
  mill:      { needs: [],                   bill: [['rebel', 40], ['dust', 15000]] },
  workshop:  { needs: ['mill'],             bill: [['rebel', 60], ['dust', 25000], ['spore', 3500]] }
};
// Every station's upgrades: no bands, no ladders (call 12, settled -- act 3 is
// outside the eight-rungs rule): two or three short named upgrades a card,
// each a change on screen, paid in rebel, timber and the yard's
// coins. Each row is its card and its bills, one bill a time it can be
// bought -- once for all but the grove's plots, a plot a bill. The seats are
// sold beside them (rows.js, AFTER_SEAT_BILLS); the stations themselves on the shack
// (AFTER_BUILDS).
export const AFTER_UPGRADES = {
  // The podium ladder: a rung a bill, each opening when support reaches its
  // mark, a share of the strike's (`marks`).
  'after-podium':      { card: 'pedestal',  bills: [[['rebel', 30], ['timber', 2]], [['rebel', 80], ['timber', 6]],
                                                    [['rebel', 200], ['timber', 15]], [['rebel', 500], ['timber', 18]]],
                         marks: [0.1, 0.25, 0.45, 0.7] },
  'after-saw':         { card: 'grove',     bills: [[['rebel', 50], ['dust', 8000]]] },                  // the saw: the woodcutter fells (the owner, 2026-10-30)
  'after-plot':        { card: 'grove',     bills: [[['rebel', 60], ['dust', 15000]],
                                                    [['rebel', 200], ['timber', 5], ['dust', 40000], ['spore', 10000]],
                                                    [['rebel', 400], ['timber', 18], ['dust', 80000], ['spore', 20000], ['shard', 20000], ['scale', 800]]] },   // a plot cleared, AFTER_PLOT_MAX in all
  'after-grow':        { card: 'grove',     bills: [[['rebel', 150], ['timber', 5], ['dust', 30000], ['spore', 8000]]] },                    // faster growth
  // Stump removal names no timber: the first trees are the only timber until
  // it is had, and a player who never digs a stump by hand fells them, spends
  // the timber on signs and has no way to the next tree.
  'after-stumps':      { card: 'grove',     bills: [[['rebel', 200], ['dust', 40000], ['spore', 10000]]] },                                   // stump removal: woodcutters dig stumps too
  // Self-seeding (track D): four rungs, the chance a felled crown drops an
  // acorn (AFTER_SELF_SEED). Timber is an order, carried.
  'after-selfseed':    { card: 'grove',     bills: [[['rebel', 150], ['dust', 30000]],
                                                    [['rebel', 300], ['timber', 6], ['dust', 60000], ['spore', 15000]],
                                                    [['rebel', 600], ['timber', 12], ['dust', 100000], ['spore', 30000], ['shard', 30000]],
                                                    [['rebel', 1000], ['timber', 18], ['dust', 150000], ['spore', 45000], ['shard', 45000], ['spark', 6000]]] },
  'after-blade':       { card: 'mill',      bills: [[['rebel', 180], ['timber', 15], ['dust', 35000], ['spore', 8000]]] },                    // a second blade
  'after-bench':       { card: 'workshop',  bills: [[['rebel', 300], ['timber', 18], ['dust', 70000], ['spore', 18000], ['shard', 18000], ['scale', 1000]]] },  // a second bench
  'after-signreach':   { card: 'workshop',  bills: [[['rebel', 600], ['timber', 18], ['dust', 120000], ['spore', 45000], ['shard', 50000], ['scale', 2500], ['spark', 10000]]] }   // a bigger sign
};
// The yard's coins a bill can name, in the order the yard hands them out
// (shop.js `COIN_ORDER`), and the order a card writes a bill in: the act's
// coins first. The deep's scales ride with them (the owner, 2026-10-18:
// "incorporate scales into the act 3 pricing"), named from the ore band on:
// they come off the deep's own purse (`take`), and up through the same
// patch as motes in a scale's shade.
export const AFTER_YARD_COINS = ['dust', 'spore', 'shard', 'scale', 'spark'];
export const AFTER_TAG_ORDER = ['rebel', 'timber', ...AFTER_YARD_COINS];

// --- the yard's coins coming up --------------------------------------------------
// Nothing teleports: a bill's yard coins are lifted off the yard's pile the
// way a yard purchase lifts them (upgrades.js `take`) and fly up to the thin
// patch in the cloud floor; out of it they come as motes in the yard's own
// tones and arc to the station bought (render/aftercoins.js). Defaults.
export const AFTER_PATCH_AT = CAMP.patch;   // the thin patch, cells off the place's left: open floor between the shack and the pedestal
export const AFTER_COIN_MOTES = 8;         // motes a coin of a bill at most
export const AFTER_COIN_UNDER_S = 1.4;     // the yard's grains on their way up to the patch, before the first mote comes out of it
export const AFTER_COIN_STAGGER_S = 0.08;  // between one mote coming out of the patch and the next
export const AFTER_COIN_UP = P * 4;        // how far a mote rises out of the patch before it turns for the station
export const AFTER_COIN_RISE_S = 0.6;      // ...over this
export const AFTER_COIN_FLY_S = 2.4;       // the arc from there to the station
export const AFTER_COIN_LIFE_S = AFTER_COIN_RISE_S + AFTER_COIN_FLY_S;   // out of the patch to landed
export const AFTER_COIN_LIFT = P * 10;     // how high the arc stands over its straight line
export const AFTER_COIN_FADE_S = 0.4;      // a mote fades in coming out of the cloud, and out on landing, over this
export const AFTER_COIN_SPREAD = 4;        // cells either side of the patch's middle a mote comes out at

// --- act 3's place and station art (track A, 2026-10-18) -------------------------
// The mocks the owner voted (docs/mocks/act3-place-2026-10-18,
// docs/mocks/act3-stations-2026-10-18): the stations' working poses and the
// pair's bubbles.
// A station shows its working pose this long after a unit of hand work: the
// mocks' cycle, so one click plays one turn of the moving part.
export const AFTER_ART_WORK_S = 2.4;
export const AFTER_PILE_FADE_S = 0.4;      // a thing coming onto or off a pile fades over this
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

// --- the act's coin marks (track C, 2026-10-18) -----------------------------------
// Rebel and timber as marks at the yard's coin size, beside the yard's own
// on every bill and in the purse (docs/mocks/act3-handwork-ui-2026-10-18,
// "marks for the act's coins"): a flag for the union, two planks. Ink
// only, since red stays the machines'. Drawn the
// scale's way (SCALE_MARK): ink `#`, paper `.`, handed to the stylesheet as a
// mask by board.js.
export const AFTER_COIN_MARKS = {
  rebel: [
    '.#######.',
    '.#######.',
    '.#######.',
    '.#######.',
    '.#######.',
    '.#.......',
    '.#.......',
    '.#.......',
    '.#.......'
  ],
  timber: [
    '.........',
    '#########',
    '#########',
    '#########',
    '.........',
    '#########',
    '#########',
    '#########',
    '.........'
  ]
};
// The act's coins, in the order the purse lists them ahead of the yard's.
export const AFTER_ACT_COINS = ['rebel', 'timber'];
// Tiles a plank of a camp board holds before they wrap onto another row (the
// owner, 2026-10-18: "narrow the shops a bit, make a couple rows"): the
// grove's five upgrades in two rows, the yard's
// own wrapping (board.js `pinWidth`), against the yard's SHELF_SLOTS.
export const AFTER_BOARD_SLOTS = 3;

// track a3-bodies: the slot a member is dealt among those bound for one place
// (after/bodies.js, `slotted`): a body's width, so none stands in another.
export const AFTER_SLOT_GAP = P * 3;

// track a3-placement
// The rebel pile at the podium's foot at its widest, [across, high] in art
// cells: as drawn (render/after/pedestal.js, `drawRebelPile`), for the
// pedestal's footprint (footprints.js).
export const AFTER_REBEL_PILE_CELLS = [8, 2];
// The pedestal's board's spot (where its shop sign stood) is on the open
// floor between the workshops and the union's crowd (after/place.js), in art
// cells: `shack` past the last workshop's ground, which the shack's spot
// ends, and `crowd` short of the crowd's widest row (`unionHalf`).
export const AFTER_PEDESTAL_SIGN_GAP = { shack: 8, crowd: 3 };

// track a3-piles
// A pile's count stands on its pile: the foot of its paper plate this far
// over the pile's top, in world px, whatever the zoom (render/after.js,
// `drawAfterCounts`), so a count never drifts up off its pile into the
// station behind it.
export const AFTER_COUNT_LIFT = P;

// track B: carried goods
// track A: saw mill
// The saw mill as a machine a log is followed through (DESIGN.md, "Act 3's
// goods are blocks, and bodies carry every one", "The saw mill"; the voted
// mock, branch mock-log-split, rounds 5 to 25). One table, read by the sim
// (after/mill.js) and the drawing (render/after/stations.js) alike, in the
// mill drawing's own cells: x across from its ground's left edge, y up from
// the floor (row -1 stands on it).
//   wheel     the flywheel the sawyer walks inside, its crank pin `crank` off the hub
//   frame     the posts' columns `L` and `R`, the head's top row, the bed's top
//             row and how many rows the bed is, the blade's column `bx`, and
//             `end` the column past the bed's right end
//   beam      the rocker's pivot over the head, its long arm (to the rod) and short
//             arm (to the crosshead): the rod keeps the length it has with the
//             beam level, and the blade's stroke is `stroke` rows over the
//             beam's whole travel
//   seat      where the sawyer sets a log down on the bed (its left column), and
//             the span of log middles a log thrown by hand lands on the bed in
//   approach  cells a stroke the bed carries a log up to the blade: more than the
//             seat's span, so a log anywhere on it reaches the blade in one stroke
//   strokes   down-strokes a column of the log takes, column by column: four
//             columns of timber, a 2x2 block each
//   stroke_s  a stroke at the sawyer's pace, seconds
//   pose      where the sawyer's body stands (its left column, top row): in the
//             wheel, where it climbs out at its side, at the log pile and at the bed
//   chute     the chute off the bed's end, from its top to its foot, a block's
//             bottom on it; `ride` cells a second a cut block rides the bed out,
//             `slide` the seconds down the chute; off its foot a block keeps
//             its speed and falls onto the mound's near column (after/mill.js)
//   fall      a cut block's fall off the chute's foot, cells a second squared
//   set_s     a log set down on the bed: lifted and swung over, then held down;
//             `held` of it the held set-down, `puff` the puff off its ends
//   chips_s   the burst of chips at each stroke's bottom
export const AFTER_MILL = {
  wheel: { cx: 19, cy: -9, r: 6, crank: 3 },
  frame: { L: 32, R: 47, head: -21, bed: -6, bedRows: 2, bx: 40, end: 50 },
  beam: { x: 35, y: -25, long: 8, short: 5, stroke: 3 },
  seat: { x: 34, land: [33, 38] },
  approach: 6,
  strokes: [4, 4, 4, 4],
  stroke_s: 0.56,
  pose: { wheel: { x: 17.5, y: -7 }, side: 10, pile: 6, bed: 28 },
  chute: { x0: 50, y0: -6, x1: 58, y1: -3, ride: 4, slide: 0.5 },
  fall: 36,
  set_s: 0.6, held: 0.25, puff: 0.3,
  chips_s: 0.6
};

// --- track B: the saw (DESIGN.md, "Act 3's grove, rebuilt", calls 7 to 9) ---------
// The one hand saw, the woodcutter's and the hand's: a grip `grip` cells
// square round a paper cell, and a blade as long as `depth` is, each cell of
// it as deep as `depth` says (deep at the heel, tapering to the toe), its back
// a line of ink and its teeth under its odd cells.
export const AFTER_SAW = { grip: 3, depth: [3, 3, 3, 2, 2, 2, 1, 1, 1] };
// The woodcutter's stroke, W-2 with heft (the owner's beats, not tuned):
// pulled back and held `back` s; pushed in `push` s, smeared; the bite held
// `bite` s with the body leant `lean` cells in; eased back in `pull` s. A
// stroke carries the saw `travel` cells; the grip's ring ends `gripHalf` of a
// cell past the hand toward the blade, so it is stood back far enough that at
// the full push the grip stops flush at the trunk's near edge. Before the
// last stroke lands the body holds the push `strain` s. Each bite throws
// `specks` of sawdust off the kerf, the last `lastSpecks`.
export const AFTER_SAW_HEFT = { back: 0.22, push: 0.08, bite: 0.2, pull: 0.16, travel: 3.5, lean: 1, gripHalf: 0.5,
                                strain: 0.6, specks: 5, lastSpecks: 8 };
// Sawdust (the owner, 2026-10-30: "just have them fade out when they fall. no
// by product"): each speck flung out of the kerf's far mouth at `vx` px/s out
// and `vy` px/s up, each a share of its range by its hash, falling under
// `grav` px/s^2 and faded to nothing over `life` s, before it could reach the
// floor.
export const AFTER_SAWDUST = { vx: [25, 120], vy: [45, 130], grav: 760, life: 0.6 };
// The smear a fast stroke leaves (the animation feel: visible smears): the
// saw where the slide began, at this ink.
export const AFTER_SAW_SMEAR = 0.35;
// The saw carried at a body's side between jobs, tilted this far (radians).
export const AFTER_SAW_CARRY = 0.35;
// The saw lying across a standing trunk fades in as the tree stands grown and
// out as it goes over, or while a woodcutter saws that tree with its own.
export const AFTER_SAW_FADE_S = 0.4;

// --- track C: the stump, F3a-1 "the earth gives" (DESIGN.md, "Act 3's grove,
// rebuilt"; the signed-off mock's numbers, its `ROOTS`, `CHIPS` and the snap's
// hold, on branch a3-review-both) -----------------------------------------------------
// The stump's three roots, in the log's darkest tone: cells [column off the
// stump block's left, depth under its foot], two thick where they leave the
// block, tapering and branching down (the owner: "a little more root like
// and thicker"). They go in order, the first first; pulled, each shows as far
// as the stump is up, and snapped only its stub (depth 0) stays on the block.
export const STUMP_ROOTS = [
  [[0, 0], [1, 0], [-1, 1], [0, 1], [-1, 2], [0, 2], [-2, 3], [0, 3]],
  [[2, 0], [1, 1], [2, 1], [2, 2], [1, 3], [3, 3]],
  [[3, 0], [4, 0], [3, 1], [4, 1], [4, 2], [3, 2], [5, 3]]
];
// The root about to go pulls taut, straight down to the ground, past this
// share of the strain.
export const STUMP_TAUT = 0.45;
// The soil cracks either side of the stump as the work goes, up to
// STUMP_CRACKS a side, STUMP_CRACK_STEP cells apart, each inking in as its
// share of the work comes: eased in over STUMP_CRACK_IN_S, faded over
// STUMP_CRACK_OUT_S once the hand lets go or the stump is out.
export const STUMP_CRACKS = 4;
export const STUMP_CRACK_STEP = 2;
export const STUMP_CRACK_IN_S = 0.15;
export const STUMP_CRACK_OUT_S = 0.6;
// Each snap holds the stump a cell higher this long (the held jerk).
export const STUMP_JERK_S = 0.3;
// Each snap throws STUMP_DIRT clods of dirt off the root's break, whole
// cells: across at up to half STUMP_DIRT_VX px/s either way, up at
// STUMP_DIRT_UP[0] plus up to STUMP_DIRT_UP[1] px/s, falling at
// STUMP_DIRT_GRAV px/s^2, and fading by opacity as they fall, gone by the
// time they come back down to the soil they left: never resting.
export const STUMP_DIRT = 7;
export const STUMP_DIRT_VX = 140;
export const STUMP_DIRT_UP = [70, 90];
export const STUMP_DIRT_GRAV = 520;
// The woodcutter's pull (stump removal bought), built from F3a-1's pieces
// with a body's hands on the stump: it stands `stand` cells off the stump's
// shack side, takes hold over `grip` s, heaves the stump up to its root's
// height over `heave` s, leans back up to `lean` cells while the root strains
// (the hand's strain, GESTURE_STRAIN_S), and after each snap's held jerk
// heaves again; the last root out, the stump-log is swung up onto its head
// over `hoist` s and carried home as any log is. The height a root holds the
// stump at runs from the strain height (GESTURE_STRAIN_LIFT) for the first to
// the hand's most (GESTURE_STUMP_MAX) for the last.
export const AFTER_PULL = { stand: 1, grip: 0.3, heave: 0.35, lean: 1, hoist: 0.4 };
// The stump come out into the hand swings in from where it came out to hang
// off the pointer as a held log does, at this rate a second.
export const STUMP_HOLD_EASE = 6;

// --- track D: seeds (DESIGN.md, "Act 3's grove, rebuilt", "The economy and the pace") ---
// The seeds row's first six bills, deepening a band every two in the earlier
// acts' coins only (the owner, 2026-10-30: "the first seeds cost prev
// resources"); past the table each purchase costs the last bill times
// AFTER_SEED_RATE for every purchase beyond it, so none is as cheap as the one before.
export const AFTER_SEED_BILLS = [[['dust', 4000]], [['dust', 8000]], [['dust', 15000], ['spore', 3000]],
                                 [['dust', 25000], ['spore', 6000]], [['dust', 40000], ['spore', 10000], ['shard', 8000]],
                                 [['dust', 60000], ['spore', 15000], ['shard', 15000]]];
// The design wrote 1.15; the pace run (tools/node/act3-pace.mjs, seed 1,
// 2026-10-30) struck at 109:32 with it and at 42:52 with 1.05, against
// 41:54 before the rebuild.
export const AFTER_SEED_RATE = 1.05;
// The chance a felled crown drops an acorn, by self-seeding's rung. Kept as a
// debt (`S.after.selfSeed`): each fall adds the chance, and an acorn drops
// when it reaches one, so 25% is exactly every fourth tree.
export const AFTER_SELF_SEED = [0.25, 0.5, 0.75, 1];
// A seed fetched from heaven's gates: the beat the hands take to close on it.
export const AFTER_SEED_TAKE_S = 0.6;
// Where a crown's acorn comes to rest, cells off the trunk's pivot toward
// the fall: on the middle of the trunk's logs, on its own plot.
export const AFTER_SEED_DROP = AFTER_TREE.logs * AFTER_TREE.log / 2;
// A woodcutter's planting, the mock's beats (a1): the reach into the basket,
// then the kneel and the set-down at the bed.
export const AFTER_SEED_REACH_S = 0.7;
export const AFTER_SEED_PLANT_S = 0.75;
// The seed basket (render/after/basket.js), its rows up off the floor, each
// [cells it starts past the heap's left edge, cells it ends past the right
// edge, its part, front or back]: the woven body and the near rim over the
// bottom row's nuts, then behind the acorns the inside, showing round their
// caps and stalks, and the far rim a cell in from each end behind the top
// row's tips, so the top row sits in the basket and a part-filled one is a
// basket with acorns in it. Each part one of timber's tones, the body woven of two.
export const AFTER_BASKET = {
  rows: [[0, 0, 'body', 'front'], [-1, 1, 'rim', 'front'], [-1, 1, 'inside', 'back'], [0, 0, 'inside', 'back'], [1, -1, 'lip', 'back']],
  tone: { rim: 3, inside: 2, lip: 0, body: 1, weave: 2 }
};

// --- the forestry shack's stump house (the owner's pick C, 2026-10-30) ----------
// Its stovepipe's smoke (render/after/stations.js): `puffs` squares `size`
// cells across, each `life` s from the pipe's top up `rise` cells and `drift`
// across, swaying `sway` cells at `swayRate` rad/s, each puff `swayPhase` rad
// behind the last; fading in over the first 1/`fadeIn` of its life to `peak`
// and out over the rest, and from the mid grey to the pale over `greyFade` of
// its life about `greyAt`: a fade, never a step (the mock's numbers).
export const AFTER_CABIN_SMOKE = { puffs: 4, size: 2, life: 4.8, rise: 8, drift: 1.6, sway: 0.35, swayRate: 0.9, swayPhase: 2.1, fadeIn: 5, peak: 0.85, greyAt: 0.45, greyFade: 0.15 };
