// --- the finale (src/finale.js, src/home.js; docs/mocks/finale-house-2026-10-12.html, the owner's picks) ---
// After the kill: she hangs her gear back on her station, one of the deep's
// own crew takes it up, the pair swim up through the portal, out of the
// drowned pit and down the whole yard to its far (left) end with the crew
// falling in behind and fireworks overhead, while the yard's builders put a
// house up there; they go in, the door shuts, the window lights. Seconds
// unless named; a pace is pixels a second.
import { P } from './yard.js';
import { GREY, PURPLE } from './palette.js';

// The kill settles the yard at once: the background still from its first
// frame, the bands stepping in over this rather than CUT_SETTLE_S.
export const CUT_KILL_SETTLE_S = 0.25;

// In the deep: her swim to her station, and his beside her.
export const FINALE_SWIM_PX_S = P * 16;
export const FINALE_SWIM_MAX_S = 3;       // never longer: a long way off, they hurry
// The gear, in held steps: lifted off her over her head, then across and
// onto the station's prop, hung there.
export const FINALE_LIFT_S = 0.5;
export const FINALE_LIFT_CELLS = 3;
export const FINALE_HANG_S = 0.8;
export const FINALE_HANG_STEPS = 4;
export const FINALE_HEART_S = 1.4;        // the two of them together, a heart over them
// The one who takes the station: its swim over, at most this long, then the
// gear off the prop and onto it in held steps.
export const FINALE_HEIR_MAX_S = 4;
export const FINALE_TAKE_S = 0.8;
export const FINALE_TAKE_STEPS = 4;
export const FINALE_WATCH_S = 0.6;        // held on the new fighter with the gear before they go
// Up to the deep's end of the portal, the camera rising with them.
export const FINALE_UP_PX_S = P * 22;
export const FINALE_UP_MAX_S = 4;
export const FINALE_RING_S = 0.8;         // the ring ringing out as they go through
export const FINALE_RING_STEPS = 5;
// Out of the drowned pit: up through the liquid to its surface, then onto
// the near lip in held hops.
export const FINALE_OUT_S = 1.4;
export const FINALE_OUT_STEPS = 6;
// The walk: the length of the yard to the door, in whole pixels, at this
// pace or quicker where the yard is longer than FINALE_WALK_MAX_S of it.
export const FINALE_WALK_PX_S = P * 30;
export const FINALE_WALK_MAX_S = 30;
export const FINALE_LEAD = 0.38;          // where the pair stand in the window, a share of it from the left
export const FINALE_END_CELLS = 40;       // where they stop: the door, cells off the yard's left edge
export const FINALE_PAIR_GAP = P;         // between the two of them, hand in hand

// --- the crowd --------------------------------------------------------------------
// Each body leaves its work as the pair pass within this many cells of it,
// gets free the way its place lets it (down off the hill, up the cut's
// ladder, out of a shack, down out of the sky), and hurries to its place in
// two files behind them: a rank every FINALE_RANK, the second file
// FINALE_FILE_BACK further back and a cell nearer. Once in its place it is
// locked there and hops on its own beat.
export const FINALE_JOIN_CELLS = 4;
export const FINALE_JOIN_PX_S = P * 26;   // the hurry at the least
export const FINALE_HURRY_K = 1.6;        // or this much the pair's pace, whichever is quicker
export const FINALE_RANK = P * 8;
export const FINALE_FILE_BACK = P * 4;
export const FINALE_BEHIND = P * 3;       // between the pair and the first of the crowd
// Getting free, kind by kind.
export const FINALE_FREE_PX_S = P * 16;   // a walk off the hill, or to the cut's ladder
export const FINALE_FLOAT_STEP_S = 0.08;  // a wizard floats down a cell a step
export const FINALE_DOOR_OUT_S = 0.5;     // out of a shack's door before it hurries
export const FINALE_BANK_S = 0.4;         // a held hop down off a bank,
export const FINALE_BANK_STEPS = 4;       // in this many steps,
export const FINALE_BANK_CELLS = 4;       // this far along,
export const FINALE_BANK_ARC = 2;         // this high in the middle
export const FINALE_BANK_RISE = 1;        // cells over the flat floor that count as up on a bank
export const FINALE_BALLOON_S = 2.4;      // a purifier's balloon brought down to its post,
export const FINALE_BALLOON_STEPS = 12;   // in held steps
// The hop: a steady beat, the crowd in three groups a third of a beat apart,
// each beat a run of held poses -- stood, a crouch, up with a smear under
// it, the apex held, down with a smear over it, a held landing with dust.
// `lift` is cells up, `rows` how tall the body is drawn.
export const FINALE_HOP_BEAT_S = 0.76;
export const FINALE_HOP_GROUPS = 3;
export const FINALE_HOP_POSES = [
  { s: 0.20 },
  { s: 0.12, rows: 2 },
  { s: 0.08, lift: 1, smear: 'under' },
  { s: 0.16, lift: 2 },
  { s: 0.08, lift: 1, smear: 'over' },
  { s: 0.12, rows: 2, dust: true },
];
// The one drawn hop: the finale's crowd, a landing and
// his hop against the ribs all step through this table (motion.js, `poseAt`),
// scaled to their own length and height.
export const HOP_POSES = FINALE_HOP_POSES;
export const FINALE_MARK_EVERY_S = 3;     // a mark over each of the crowd this often
export const FINALE_MARK_S = 1.2;         // and up this long
export const FINALE_MARK_AFTER_S = 0.6;   // the first not until it has been in its place this long
export const FINALE_LIFT_TAIL = 1;        // ranks behind the last of the crowd a forklift rolls

// --- the house (src/home.js) ---------------------------------------------------
// Laid out in cells from its left wall on the ground line, the door
// FINALE_DOOR_CELL in, so the door is where the walk ends. Rows are cells
// up from the ground line (negative is up).
export const FINALE_DOOR_CELL = 11;
export const FINALE_HOUSE_W = 18;         // left wall to right post
export const FINALE_WALL_ROWS = 9;        // walls, a board row a trip each side
export const FINALE_WINDOW = [3, -6, 3, 2];   // x, row, w, h
export const FINALE_DOOR_W = 4;
export const FINALE_DOOR_H = 7;
export const FINALE_POSTS = [0, 17, 8];   // the corner posts, then the middle one (set from the plank)
export const FINALE_ROOF = [[-1, 20], [0, 18], [1, 16], [2, 14], [4, 10]];   // x, w a row, up from the plates
export const FINALE_CHIMNEY = [13, -18, 2, 3];
export const FINALE_BENCH = 16;           // its left end, cells from the house's left wall
export const FINALE_BENCH_W = 4;
// Bare ground between the home's buildings (this house, act 3's mansion)
// and the first of the yard's sites, which the yard keeps for them (`HOME_GROUND`
// in config/sites.js).
export const FINALE_HOME_GAP = 12;
// The scaffold: two poles and a plank across them at FINALE_PLANK_ROW, the
// builders' way up to everything set over FINALE_REACH_ROW.
export const FINALE_POLES = [-2, 19];
export const FINALE_PLANK_ROW = -8;
export const FINALE_REACH_ROW = -5;       // a wall row higher than this is set from the plank
// The pile of pieces at the plot and the woodpile the scaffold comes down
// onto, which stays.
export const FINALE_PILE_CELL = -10;      // its left end, cells from the house's left wall
export const FINALE_PILE_W = 7;
export const FINALE_PILE_ROWS = 6;        // rows tall with every piece in it
export const FINALE_PILE_HOMES = [2, 0, 4, 1, 3];   // where each builder stands at the pile, cells in
export const FINALE_BUILDERS = 5;
export const FINALE_BUILDERS_LEAST = 2;   // taken from the rest of the yard when it has no spare hands
// The build: the pile carried down the yard while the deep half plays, at
// a pace that gets it there in FINALE_HAUL_S, never quicker than
// FINALE_HAUL_MOST_PX_S; then a piece a trip from FINALE_BUILD_FROM_S into
// the yard half until FINALE_BUILD_SPARE_S before the pair reach the door.
export const FINALE_HAUL_S = 6;
export const FINALE_HAUL_MOST_PX_S = P * 168;
export const FINALE_BUILD_FROM_S = 0.6;
export const FINALE_BUILD_SPARE_S = 0.4;
// A trip, as shares of its length: the piece taken off the pile, carried
// out, set (up the nearer pole and along the plank for one set high), and
// the walk back; a scaffold piece taken down and carried onto the woodpile.
export const FINALE_TRIP = { take: 0.06, set: 0.55, squat: [0.55, 0.58], carry: 0.5, back: 0.62,
                             pole: 0.30, climb: 0.40, along: 0.52, unclimb: 0.72, down: 0.80,
                             offOut: 0.4, offTake: 0.45, offBack: 0.5, offDrop: 0.95 };
export const FINALE_POLE_STEPS = 8;       // up or down a pole a cell a step
export const FINALE_CHEER_PX_S = P * 12;  // the builders off to the side of the plot to cheer

// --- at the door -------------------------------------------------------------------
// At the door (held there until the house is done), the door slides open in
// steps on a lit room, she steps up and goes in, dimming into it, he
// follows; the door slides shut, the window lights, a hold, the sheet.
export const FINALE_ARRIVE_S = 0.6;
export const FINALE_DOOR_S = 0.5;
export const FINALE_DOOR_STEPS = 4;
export const FINALE_GAP_S = 0.1;          // between the door open and her first step
export const FINALE_IN_S = 2.8;           // her in, then him
export const FINALE_HIM_AFTER_S = 0.8;
export const FINALE_STEP_S = 0.6;         // the step up to the door's middle,
export const FINALE_STEP_STEPS = 4;       // in held steps
export const FINALE_DIM_AT_S = 0.9;       // and the dimming into the room
export const FINALE_DIM_S = 0.9;
export const FINALE_DIM_STEPS = 3;
export const FINALE_SHUT_S = 0.8;         // the door shut, the volley up
export const FINALE_LIGHT_S = 2.2;        // the window lit, the heart over the house
export const FINALE_HOLD_S = 2.6;         // the last hold: only the last sparks move
// The chimney while anyone is in: a puff a beat climbing a cell a step.
export const FINALE_SMOKE_HZ = 0.8;
export const FINALE_SMOKE_PUFFS = 4;
export const FINALE_SMOKE_ROWS = 8;
// The space bar: what is left of the finale plays this much faster.
export const FINALE_HURRY = 4;

// --- the fireworks -----------------------------------------------------------------------
// Over the walk from FIREWORK_FIRST_S into it, the gap closing from the
// first number to the second as the pair near the house, doubles in its
// last stretch; a rise trailing smoke, then the burst in held steps, then
// the fall. The volley goes up off both sides of the house as the door
// shuts, bursting left to right over it, and the heart as the window lights.
export const FIREWORK_GAP_S = [1.25, 0.55];
export const FIREWORK_FIRST_S = 0.5;
export const FIREWORK_LAST_S = 0.3;       // none launched this close to the door
export const FIREWORK_DOUBLE_FROM = 2 / 3;   // the share of the walk after which some go up in twos
export const FIREWORK_DOUBLE_CHANCE = 0.5;
export const FIREWORK_DOUBLE_LAG_S = 0.15;
export const FIREWORK_DOUBLE_DX = 0.18;   // a share of the window right of the first
export const FIREWORK_KINDS = ['peony', 'crossette', 'ringwillow', 'willow', 'crossette', 'peony'];
export const FIREWORK_RISE_S = 0.8;
export const FIREWORK_LIFE_S = 3.4;       // from the burst to the last spark gone
export const FIREWORK_HIGH = [0.12, 0.42];  // the burst's height, a share of the window down from its top
export const FIREWORK_STEP_HZ = 10;       // every firework moves in held steps of this many a second
export const FIREWORK_SMOKE_S = [0.3, 0.6, 0.9];   // the rocket's smoke greying out, then gone
export const FINALE_VOLLEY = { n: 6, every: 0.12, from: -14, step: 9, high: [0.12, 0.2], rise: 0.6 };
export const FINALE_HEART_BURST = { at: 0.5, dx: 9, high: 0.18, rise: 0.6 };   // `at` into the shut

// --- the two of them afterwards, at the house, for good ---------------------------
// The sheet put down, they come out and sit on the bench by the door; then a
// turn at random every RETIRED_TURN_S..: sat together, a heart, a stroll, one
// nipping in (the window lit while anyone is in), or both in for a while.
export const RETIRED_TURN_S = [5, 10];
export const RETIRED_STROLL_CELLS = 10;
export const RETIRED_STROLL_S = 4;
export const RETIRED_HEART_S = 2.2;
// Coming out: the door opens, her out of the room and along to the bench in
// held steps, him after her, both sat; the door shut behind them.
export const RETIRED_OUT_S = 3.4;
export const RETIRED_OUT_HIM_S = 0.8;
export const RETIRED_DOOR_OUT_S = 0.6;    // out of the room, undimming
export const RETIRED_WALK_S = 1.0;        // door to bench,
export const RETIRED_WALK_STEPS = 6;      // in held steps
export const RETIRED_SHUT_AT_S = 3.0;     // the door shut behind them
// Nipping in: her to the door, in, a moment, back out and sat again.
export const RETIRED_NIP_S = 4;
export const RETIRED_NIP = { door: 0.8, steps: 5, dim: 1.6, out: 2.0, undim: 2.6, sit: 3.4, open: [0.4, 3.0] };
// Both in: to the door and in as at the end of the finale, the door shut.
export const RETIRED_IN_SHUT_AT_S = 2.8;

// --- how it is drawn (render/finale.js, render/home.js) -------------------------------
// Six rungs of the yard's one grey ramp, darkest first (the page's own map
// turns them on a dark page, ink.js), and the accent: rungs of the one purple,
// with its dark and its light (the lit room). All palette.js's.
export const FINALE_GREYS = [GREY[9], GREY[8], GREY[7], GREY[5], GREY[3], GREY[1]];
export const FINALE_PURPLE = PURPLE[11];
export const FINALE_PURPLE_DARK = PURPLE[7];
export const FINALE_PURPLE_LIGHT = PURPLE[13];
// Each firework's shape, in cells and seconds from its burst (render/finale.js):
//   peony       a purple core and a ring opening to `r`, held, then falling out
//   crossette   `arms` arms opening and held, then every head splitting into a cross
//   ringwillow  a ring with a purple ring inside, held, then every point drooping in a trail
//   willow      a quick pop, then `sparks` drooping in long grey trails
//   ring        a ring widening a cell every `grow`, then `sparks` falling out
//   heart       a heart drawn big in three steps, held, then falling out
// Every ring opens at two cells or more: a ring of one is a hollow 3x3 box,
// which reads as a body.
export const FIREWORKS = {
  peony:      { r0: 2, r: 7, grow: 0.08, open: 0.9, spokes: 20, inner: 2, coreS: 0.6, fade: 0.3, drop: 4, out: 2.8 },
  crossette:  { arms: 5, r: 5, grow: 0.1, open: 0.75, purpleS: 0.5, split: 0.15, cross: 4, crossS: 0.1,
                crossDrop: 2, crossFade: 0.4, trailS: 0.9, drop: 3, out: 2.8 },
  ringwillow: { r: 7, grow: 0.1, open: 1.0, solid: 3, inner: 3, sparks: 16, trail: 5, trailS: 0.1,
                spreadX: 1.2, spreadY: 0.8, headS: 1.2, paleS: 1.8, drop: 4, out: 3.4 },
  willow:     { pop: 0.3, r0: 2, sparks: 10, fan: 0.55, reach: 2.4, squash: 0.6, drop: 4, trail: 4, trailS: 0.12, out: 2.6 },
  ring:       { r0: 2, grow: 0.15, open: 0.75, sparks: 14, from: 5, spread: 1.5, drop: 3, out: 2.4 },
  heart:      { points: 28, sizes: [3, 6, 9], stepS: 0.3, greyS: 1.2, held: 1.6, drop: 4, out: 3.2 },
};
export const FIREWORK_DIM = [1.2, 1.8, 2.3];   // seconds past the burst its sparks go grey, paler, palest
// The ring ringing out at the deep's end of the portal as they go through.
export const FINALE_RING_FROM = 1;        // cells past the portal's own edge
