// --- acts 3 and 4: the connective tissue -----------------------------------------
// DESIGN.md, "Acts 3 and 4", "The portals and the mansion (owner, 2026-10-17
// night)": the two portals (heaven's over the fallen house, hell's on the
// deep's floor), the story's beats as placeholder cutscenes, the ghosts on the
// road, and the ending's mansion. Every number here is a default chosen to
// stand the placeholder up, for the owner and the mocks to move; nothing in
// it is tuned. Seconds unless named; a pace is world pixels a second.
import { P } from './yard.js';
import { GREY, PURPLE } from './palette.js';

// --- the portals -------------------------------------------------------------
// A portal is the camera's way between two places, never a body's (bodies
// walk the road, ghosts.js), and it has an end in each. Heaven's is a pair of
// pearly gates (below, "heaven's gates"): in the yard on a cloud bank up a
// cloud stair at the yard's left end, left of the house, in the afterlife
// standing on the cloud floor by the camp. Hell's is a white-hot slit
// in the deep's floor straight over hell's road down (hell/place.js, `roadX`),
// and the landing; its end in hell ACT_HELL_HANG over the landing's floor.
export const ACT_PORTAL_R = P * 5;           // a ring's radius
export const ACT_HELL_HANG = P * 14;
export const ACT_PORTAL_OPEN_S = 2;          // a ring opening, by opacity and size
export const ACT_PORTAL_SPIN_HZ = 0.6;       // its cells turning, steps a second
// The pointing hand beside an act portal, as the yard portal's: shown until
// the player has been through and back by their own hand, then faded.
export const ACT_HAND_SIDE = P * 2;          // the gap between the ring and the hand
export const ACT_HAND_FADE_S = 3;

// --- the prompt that starts act 3 (call 7: the player says go on) ------------
// A small card over the house once the finale's sheet is down; pressing it
// is the player's say. It fades in over ACT_GOON_FADE_S after ACT_GOON_WAIT_S.
export const ACT_GOON_WAIT_S = 4;
export const ACT_GOON_FADE_S = 1.5;
export const ACT_GOON_ABOVE = P * 22;        // its foot over the ground line
export const ACT_GOON_PAD = P;               // the card's margin round its words
export const ACT_GOON_FONT_PX = 12;          // screen px, the counter's register

// --- the beats -------------------------------------------------------------
// A beat is phases (actbeats.js), each a place to stand in, a spot to look at
// and a few seconds to hold. The space bar or a click hurries a beat by
// ACT_HURRY; nothing in it is cut.
export const ACT_HURRY = 4;
export const ACT_CAPTION_S = 3.5;            // a caption's hold, the default phase
export const ACT_CAPTION_FADE_S = 0.5;       // in and out, by opacity
export const ACT_CAPTION_FONT_PX = 13;
export const ACT_CAPTION_GREY = GREY[0];     // the words, on the letterbox's black

// The house's fall (docs: review 'act 3: the intro', the owner's G at K's
// speed, 2026-10-31): a meteor out of the sky onto the house. It falls
// ACT_ROCK_FALL_S under gravity (its height goes as the square of the time)
// from a start ACT_METEOR.margin cells above the window's top edge, worked
// out off the camera as the fall begins; then the impact, held
// ACT_ROCK_DUST_S; then the two souls out of the wreck, up to the gates and
// through them onto the cloud floor (below).
export const ACT_ROCK_FALL_S = 1.5;
export const ACT_ROCK_W = 16;                // cells, wider than the house's walls
export const ACT_ROCK_H = 11;
export const ACT_ROCK_DUST_S = 5.2;
export const ACT_ROCK_TONES = [GREY[10], GREY[9], GREY[8]];
// The meteor, drawn (render/housefall.js), all in cells and seconds:
//   margin   how far above the window's top it starts, past its flame
//   drift    across per down: it comes in a little from the right
//   trail    the flame's length behind it, `flare` its reach past the rock's
//            sides; its edge flickers a cell at a time on `flickS` beats
//   sparks   thrown off the dive, each fading where it was left
//   shadow   the shadow's opacity on the ground where it will land, beating
//            faster as it comes
//   smear    the impact frame held still before the blast is let go
//   burst    flame cells and `balls` smoke balls thrown out and up
//   chunks   the house in pieces on arcs, `throw` their speed against a
//            hand's toss; `ring` how far the dust runs along the ground
//            either way, `ringRows` its height at its front
//   column   smoke puffs rising off the rock through the hold
//   smoulderS  the fire left round it going out, once the hold is over
//   shake    the throw handed to the yard's shake (world.js, `shakeView`),
//            which the motion setting turns off
export const ACT_METEOR = {
  margin: 6, drift: 0.1, trail: 24, flare: 2, flickS: 0.09, sparks: 60, shadow: 0.9,
  smear: 0.2, burst: 130, balls: 18, chunks: 36, throw: 1.5, ring: 54, ringRows: 4,
  column: 34, smoulderS: 20, shake: 20
};
// How each piece of it moves and how long it lasts, seconds and cells a
// second (render/housefall.js); a life ends by opacity, never a cut.
//   spark    life [shortest, longest], how fast thrown out and up, how fast it drops
//   ball     a smoke ball's life [shortest, longest], speed [slowest, fastest],
//            how fast its speed dies, its rise, radius [first, last] and growth
//   ember    a flame cell's life and speed the same way, and its drop
//   chunk    the house's pieces: drop, speed across and up [least, most]
//   ringS    how long the dust ring runs out
//   puffS    a column puff's life, `rise` and `lean` how it climbs and drifts
//   burnS    the flame left on the rock after the impact, gone by then
//   coolOf   the share of the hold the rock's glow takes to go
//   flick    a smouldering flame's beat; `wisp` its smoke's period, and
//            `smoulderIn` [from, over] when the fire comes up in the hold
//   fadeIn   how long each piece takes to come up from nothing (never popped)
//   smear    the held impact's flame: how long it fades, its length either
//            way and its height, in cells
//   heldAt   the blast's age, in seconds, it is held at through the smear
//   chunk    also `endS` short of the hold's end it is gone by, `rest`
//            [least, most] it lies where it lands
//   ringTail the dust ring's tail behind its front, cells; `scorch` the
//            scorched ground's reach past the rock's sides and its depth
export const ACT_METEOR_FX = {
  spark: { life: [0.6, 1.2], out: 10, up: 8, drop: 12 },
  ball: { life: [1.6, 2.8], speed: [30, 70], damp: 2.2, rise: 4, r: [2.5, 7], grow: 4.5 },
  ember: { life: [0.5, 1.2], speed: [70, 180], damp: 3, drop: 10 },
  chunk: { drop: 110, across: [10, 40], up: [42, 76], endS: 0.3, rest: [0.9, 1.5] },
  ringS: 1.1, puffS: 2.2, puff: { rise: 11, lean: 4, spread: 0.8 }, burnS: 0.5, coolOf: 0.85,
  flick: 0.12, wisp: 2.2, smoulderIn: [0.4, 0.8],
  fadeIn: { blast: 0.05, piece: 0.08, scorch: 0.15, puff: 0.2 },
  smear: { fadeS: 0.35, cells: 14, rows: 4 },
  heldAt: 0.16, ringTail: 6, scorch: { reach: 7, rows: 3 }
};
// How the meteor is drawn (render/housefall.js), its shapes as shares and cells:
//   flame   `rim` cells of red hugging the rock, the run starting `front` of
//           the rock's half-height behind its middle; its width tapering as
//           the power `taper` of the way along, swaying `sway` cells (and
//           `swayFar` more toward its end) on held beats, its end ragged by
//           `ragged`; its edge cells (within `edge` of it, or past `edgeFar`
//           of the run) dropped `flicker` of the beats; its core `core` of
//           its width out to `coreFar` of the run; its tone stepping `steps`
//           times down the run to smoke at `smokeAt`, gone `smokeOver` after
//   glow    the heat's opacity over the rock's lower half and on the ring
//           `reach` cells round it
//   spark   thrown `across` the rock's width from `at` of its height, up by
//           `up` [least, most]
//   shadow  its first width `from` of the whole, swelling in by `in` times
//           the fall, `past` cells wider than the rock, its second row
//           `under` as dark; its pulse `pulse` [base, swing] over
//           `beats` [linear, square] beats of the fall
//   cool    the glow left on the rock: from `from` of its height down, at
//           `a`, `hot` of its cells the hotter tone
//   burst   the blast's arc: smoke balls from `balls` [first, span] of a
//           half-turn, flame cells from `embers` [first, span]
export const ACT_METEOR_LOOK = {
  flame: { rim: 2, front: 0.2, taper: 1.4, sway: 2.2, swayFar: 0.4, ragged: 0.2, edge: 1.5, edgeFar: 0.55, flicker: 0.38,
           core: 0.4, coreFar: 0.3, steps: 2.7, smokeAt: 0.75, smokeOver: 0.45 },
  glow: { core: 0.7, ring: 0.8, reach: 3 },
  spark: { across: 0.45, at: 0.4, up: [0.3, 0.7] },
  shadow: { from: 0.2, in: 1.4, past: 3, under: 0.6, pulse: [0.7, 0.3], beats: [1.5, 4] },
  cool: { from: 1 / 3, a: 0.75, hot: 0.4 },
  burst: { balls: [0.08, 0.84], embers: [0.03, 0.94] }
};
// The flame, hottest first: the meteor's own red (COIN_TONES.spark,
// palette.js: "out of the sky and still hot"), its brightest against the
// rock and down the flame's middle, its darkest at the edges and the end of
// the run; then smoke. White would vanish on the paper.
export const ACT_FLAME = ['#e8503a', '#d93a25', '#c62d1c', '#9c2214'];
export const ACT_SMOKE = [GREY[5], GREY[6], GREY[7]];
// The crater it leaves (route.js, `craterDip`): a bowl ACT_CRATER.depth cells
// deep under the rock, flat across the rock's width and sloping up to lips
// `half` cells either side of the house's middle, with a rim of thrown dirt
// `rim` cells high past each lip. It fills a cell at a time as the rock is
// broken up for the mansion's blocks (mansion.js), level when the last row
// goes, so the mansion stands on level ground and nothing pops.
export const ACT_CRATER = { depth: 2, half: 14, rim: 3 };
export const CRATER_IN_S = 0.12;             // the bowl's line faded in at the impact, under the blast
// Where the fire left in the crater burns, in cells off the house's middle:
// at the rock's foot either side, on the bowl's lips, and one on each slope.
export const ACT_SMOULDER_SPOTS = [-ACT_ROCK_W / 2 - 1, -ACT_ROCK_W / 2 - 2.6, ACT_ROCK_W / 2, ACT_ROCK_W / 2 + 1.6,
  -ACT_CRATER.half - 1, ACT_CRATER.half, -ACT_ROCK_W / 2 + 1, ACT_ROCK_W / 2 - 2, -ACT_CRATER.half + 2, ACT_CRATER.half - 3];
export const ACT_SOUL_LIFT_S = 1.5;          // out of the wreck, where they wait unseen
// A soul (the owner, 2026-10-30: "float a little bit and be lighter
// colored"): its rim a mid grey, its clothes paler, a halo of
// ACT_SOUL_HALO_TONE round it at ACT_SOUL_HALO, all drawn as written on a
// dark page so they read light there too; and a bob of ACT_SOUL_BOB cells
// over ACT_SOUL_BOB_S while a soul.
export const ACT_SOUL_RIM = GREY[4];
export const ACT_SOUL_CLOTH = { grey: GREY[3], pale: GREY[1] };
export const ACT_SOUL_HALO_TONE = GREY[3];
export const ACT_SOUL_HALO = 0.45;
export const ACT_SOUL_BOB = 1;
export const ACT_SOUL_BOB_S = 1.8;
export const ACT_SOUL_BOB_APART = 1.9;       // radians between the two of them's bobs
export const ACT_SOUL_PAPER = GREY[0];
// The rise (the owner's J): the souls float from the ruin up to the gates'
// step at ACT_FLOAT_PX_S, eased in and out, swaying ACT_FLOAT_SWAY cells
// either side over ACT_FLOAT_SWINGS swings, still at both ends; the second
// hangs ACT_FLOAT_LAG cells under the first at the middle. Act 4's way down
// and the freed souls' come down the same way, reversed. The souls fade in
// from nothing to whole by ACT_RISE_FADE.soul of the rise; the gates, absent
// till then, fade in from ACT_RISE_FADE.gatesFrom to `gatesTo` (the owner's
// K2, 2026-10-31).
export const ACT_FLOAT_PX_S = P * 9;
export const ACT_FLOAT_SWAY = 2.5;
export const ACT_FLOAT_SWINGS = 2.5;
export const ACT_FLOAT_LAG = 2;
export const ACT_RISE_FADE = { soul: 0.35, gatesFrom: 0.33, gatesTo: 0.9 };
// The rise is framed from this many cells over the gates' top down to the
// ground (actbeats.js, `riseBox`), so the gates stand clear of the band.
export const ACT_RISE_FRAME_OVER = 3;
// The opening's end (the owner's K2 to God, 2026-11-01): the arrival held
// ACT_ARRIVE_S with no line, the meeting God's lines (dialog.js), and then
// the walk to the pedestal in play at ACT_PEDESTAL_K times the road's pace.
export const ACT_ARRIVE_S = 0.4;
export const ACT_PEDESTAL_K = 5;
export const ACT_SLIT_TONES = [GREY[0], PURPLE[13], GREY[1]];          // the slit, white-hot

// --- the ghosts on the road (call 5: carry, not work) -----------------------
// After the road opens and the pair come down, they walk a loop: the ruin to
// the drowned pit, down through the abyss to the deep's floor, along it to
// hell's slit and down onto the landing, on to hell's store and back the
// same way, carrying a load of the yard's dust down and nothing up. A load
// is GHOST_LOAD dust, taken off the purse at the ruin if the purse has it.
// Called somewhere by a beat (the cage, home) they walk ACT_CALL_K faster.
export const GHOST_PX_S = P * 8;
export const GHOST_LOAD = 25;
export const GHOST_GAP = P * 4;              // between the two of them, one behind
export const ACT_CALL_K = 3;

// Lives returned: the rims closing a piece at a time (the union's rim build).
export const ACT_RIM_PIECES = 8;
export const ACT_RIM_STEP_S = 0.5;

// --- heaven's gates (docs/mocks/act3-gates-2026-10-19, take A; the owner,
// 2026-10-31: directly over the house, and no stairway) ------------------------
// Tall pearly gates in a long cloud bank high over the house: their middle
// column is the house's middle (portals.js), and the bank stands
// ACT_GATES_SKY over the ground, worked out below off the mansion that rises
// there at the end. The gates are the portal and nothing stands over them:
// going through the open gates is the trip (the ripple plays as the camera
// goes through), a body fading into the gateway at one end and out of it at
// the other over ACT_GATES_PASS cells of walk.
// Two leaves, each ACT_GATES_LEAF cells wide and ACT_GATES_H tall, open by
// sinking into the bank a bar at a time over ACT_GATES_SINK_S, the meeting
// stiles first and then outward, so the top edge steps down like a crowd band
// sinking (the owner, 2026-10-26: "sinking like the crowd"): each
// bar starts ACT_GATES_BAR.lead into the opening plus an even share of the
// rest, runs ACT_GATES_BAR.run of it, and goes ACT_GATES_BAR.deep cells down,
// clear of its pearl. Once they are down, a rally runs out along the bank's
// top over ACT_GATES_RALLY.s: a cell on each column it passes, ACT_GATES_RALLY
// .band cells either side of its front, faded up and down by opacity, out to
// ACT_GATES_RALLY.reach cells. A press waits ACT_GATES_STAND_S with them
// standing open before the ripple, the rally's front run out past the posts
// by then so it is seen, and they stand open ACT_GATES_HOLD_S after
// the camera has come through before they rise shut the same way. The light
// in the gateway reaches ACT_GATES_LIGHT cells further out at its fullest.
export const ACT_GATES_PASS = 6;
export const ACT_GATES_CLEAR = 4;
export const ACT_GATES_LEAF = 5;             // a leaf's width, cells
export const ACT_GATES_H = 16;
export const ACT_GATES_REACH = P * 8;        // the middle to a post's outside
export const ACT_GATES_SINK_S = 1.6;
export const ACT_GATES_BAR = { lead: 0.04, run: 0.44, deep: ACT_GATES_H + 2 };
export const ACT_GATES_RALLY = { s: 1.1, reach: 16, band: 2 };
export const ACT_GATES_LIGHT = 4;
export const ACT_GATES_STAND_S = ACT_GATES_RALLY.s * (ACT_GATES_REACH / P) / ACT_GATES_RALLY.reach;
export const ACT_GATES_HOLD_S = 1.5;
export const ACT_GATES_NEAR = P * 6;         // a body this near the gateway has them open
// ...and a soul floating up to them this far under their bank: the sink's
// time at the float's pace, so they stand open as it reaches the step
export const ACT_GATES_UNDER = Math.ceil(ACT_GATES_SINK_S * ACT_FLOAT_PX_S / P) * P;
// The cloud bank the gates stand in, in cells: its reach on its long side
// of the gates' middle column (ACT_GATES_LONG, -1 the left) and on its short
// side, and its depth under their feet (render/gates.js).
export const ACT_GATES_BANK = { long: 20, short: 11, deep: 3 };
export const ACT_GATES_LONG = -1;
// The bank's cells off the gates' middle column, `lo` the first and `hi` the
// last. The bank's puffs are drawn over it by a cell or two (render/gates.js).
export const ACT_GATES_BANK_CELLS = {
  lo: -(ACT_GATES_LONG < 0 ? ACT_GATES_BANK.long : ACT_GATES_BANK.short),
  hi: ACT_GATES_LONG < 0 ? ACT_GATES_BANK.short : ACT_GATES_BANK.long
};
// The home's left end, cells off the yard's left edge: bare ground the width
// of the gates' clearance in from the edge, now that nothing stands left of it.
export const HOME_AT = ACT_GATES_CLEAR;
// The gates' middle column over the afterlife's cloud floor, cells off its
// left edge. The camp is laid out from it (config/after.js), so it is its
// own number.
export const ACT_GATES_CELL = 54;

// --- the mansion (the owner, 2026-10-17 night) ------------------------------
// On the house's ground, bigger than the house: a main block MANSION_FLOORS
// floors high between two lower wings and two towers. In cells, from its
// left end at MANSION_AT cells off the yard's left edge, just past its blocks
// pile at the home's left end; the door is the main block's middle. A floor
// is MANSION_FLOOR_ROWS rows. The old house stood on its ground with its left
// wall MANSION_HOUSE_AT cells in (config/finale.js places it off this).
export const MANSION_BLOCKS_W = 4;
export const MANSION_BLOCKS_AT = HOME_AT;
export const MANSION_AT = MANSION_BLOCKS_AT + MANSION_BLOCKS_W + 1;
export const MANSION_HOUSE_AT = 23;
export const MANSION_FLOORS = 4;
export const MANSION_FLOOR_ROWS = 6;
export const MANSION_WING_W = 10;            // each wing, cells
export const MANSION_WING_FLOORS = 2;
export const MANSION_MAIN_W = 22;            // the main block
export const MANSION_TOWER_W = 4;            // each tower, standing at the main block's corners
export const MANSION_TOWER_FLOORS = 6;
// The rows over the ground the mansion's drawing holds: its towers and the
// spires over them (render/mansion.js).
export const MANSION_TOP_ROWS = MANSION_TOWER_FLOORS * MANSION_FLOOR_ROWS + 4;
// Heaven's bank over the house stands over the mansion that rises there at
// the end: its foot ACT_GATES_CLEAR cells over the mansion's top.
export const ACT_GATES_SKY = P * (MANSION_TOP_ROWS + ACT_GATES_BANK.deep + ACT_GATES_CLEAR);
export const MANSION_DOOR_W = 4;
export const MANSION_DOOR_H = 5;
export const MANSION_WINDOW = [2, 3];        // a window's w and h, cells
export const MANSION_WINDOW_EVERY = 5;       // cells between windows along a floor
export const MANSION_POLES = [11, 20, 28, 37];   // the scaffold's poles, cells off its left end
// The build, a standing job from the cage's fall: up to MANSION_BUILDERS of
// the yard's own builders (spare hands if it has none), a piece a trip.
// First the scaffold, a pole a trip off the old house's woodpile; then the
// fallen rock broken up, a row a trip, onto the blocks pile at
// MANSION_BLOCKS_AT (above), which is where every
// piece after comes from; the scaffold carried down last. A body takes
// MANSION_TAKE_S at a pile and MANSION_SET_S at the piece; a set piece fades
// in over MANSION_FADE_S.
export const MANSION_BUILDERS = 6;
export const MANSION_BLOCK_CELLS = 4;          // the rock's cells a block on the pile stands for
export const MANSION_TAKE_S = 0.5;
export const MANSION_SET_S = 0.7;
export const MANSION_FADE_S = 0.6;
export const MANSION_GREYS = [GREY[10], GREY[8], GREY[6], GREY[4], GREY[2]];
export const MANSION_LIT = PURPLE[12];
// The gathering: the freed souls coming down heaven's cloud stair and
// standing in files beside the mansion, MANSION_SOULS of them, a soul every
// MANSION_SOUL_EVERY_S; then the sheet after MANSION_SHEET_AFTER_S.
export const MANSION_SOULS = 24;
export const MANSION_SOUL_EVERY_S = 0.4;
export const MANSION_FILE_W = 8;             // souls a file
export const MANSION_FILE_AT = MANSION_AT + MANSION_WING_W * 2 + MANSION_MAIN_W + 3;   // the files' left end, cells off the yard's left edge: past the mansion
export const MANSION_SHEET_AFTER_S = 4;

// --- act 3 flow (the playthrough track, 2026-10-18) ---
// The pair up on the pedestal after the refusal: the road's drawing of them
// fades off over the pedestal's own (and back on before they climb down).
export const ACT_PEDESTAL_FADE_S = 0.6;

// --- the road up (the owner's pick B, 2026-10-18; the rise no longer rides it
// since heaven's gates became the portal, 2026-10-19) -------------------------
// The sky between the yard and the cloud floor (render/road.js). ACT_ROAD_CLOUDS clouds are spread up
// the road above the yard's own window, ACT_ROAD_CLOUD_W cells wide at the
// least and the most, ACT_ROAD_CLOUD_H rows high at most; the cloud floor's
// underside is ACT_ROAD_UNDER under the deepest the afterlife's own window
// shows of it, and billows down ACT_ROAD_BILLOW rows more (seeded by
// ACT_ROAD_SEED, as the floor's top is).
export let ACT_ROAD_CLOUDS = 14;
export const ACT_ROAD_CLOUD_W = [10, 24];
export const ACT_ROAD_CLOUD_H = 4;
export const ACT_ROAD_UNDER = P * 4;
export const ACT_ROAD_BILLOW = 2;
export const ACT_ROAD_SEED = 71;
// The road's clouds are as near as the yard's nearest sheet, the camera
// passing close by them: their tones are the yard's clouds' at this far
// (weather.js, `roadTones`).
export const ACT_ROAD_FAR = 0.4;
// Across, the clouds spread over this share of the yard's window, round the
// tear; up, each sits off its even place on the road by up to this share of
// the step between two; each row of one is drawn in at its ends by its height
// squared over this; and this share of their cells (and the underside's
// shaded row) take a tone a step darker, so none is a flat slab.
export const ACT_ROAD_SPREAD = 1.3;
export const ACT_ROAD_JITTER = 0.6;
export const ACT_ROAD_ROUND = 2.4;
export const ACT_ROAD_SPECKLE = 0.25;

export const ACT_KNOBS = [
  { key: 'ACT_ROAD_CLOUDS', label: 'clouds up the road', min: 0, max: 40, step: 1,
    get: () => ACT_ROAD_CLOUDS, set: v => { ACT_ROAD_CLOUDS = v; } }
];

// --- the story's dialog (dialog.js, render/dialog.js; DESIGN.md "A dialog system") ---
export const DIALOG_FADE_S = 0.4;          // a line in and out, by opacity
export const DIALOG_STROKE_PX = 2;         // screen px: the bubble's stroke, and the cell its tail is drawn on
export const DIALOG_PAD_CELLS = 2;         // the bubble's inside margin, in CELLs
export const DIALOG_WIDE_PX = 260;         // the widest a line runs before it wraps
export const DIALOG_LINE_PX = 3;           // the gap between two wrapped lines
// The tail (the owner's pick A1, 2026-11-01): its paper's width in stroke
// cells, row by row out from the box, tapering a cell a side every two rows
// to a middle point. The first row lies over the box's own stroke.
export const DIALOG_TAIL = [5, 5, 3, 3, 1, 1];
