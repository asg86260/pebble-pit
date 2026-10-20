// --- acts 3 and 4: the connective tissue -----------------------------------------
// DESIGN.md, "Acts 3 and 4", "The portals and the mansion (owner, 2026-10-17
// night)": the two portals (heaven's over the fallen house, hell's on the
// deep's floor), the story's beats as placeholder cutscenes, the ghosts on the
// road, and the ending's mansion. Every number here is a default chosen to
// stand the placeholder up, for the owner and the mocks to move; nothing in
// it is tuned. Seconds unless named; a pace is world pixels a second.
import { P } from './yard.js';
import { FINALE_END_CELLS, FINALE_DOOR_CELL, FINALE_HOUSE_W } from './finale.js';
import { GREY, PURPLE } from './palette.js';

// --- the portals -------------------------------------------------------------
// A portal is the camera's way between two places, never a body's (bodies
// walk the road, ghosts.js), and it has an end in each. Heaven's is a pair of
// pearly gates (below, "heaven's gates"): in the yard on a cloud bank up a
// cloud stair from beside the ruin, in the afterlife standing on the cloud
// floor straight above. Hell's is a white-hot slit
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

// The house's fall: the rock out of the sky over ACT_ROCK_FALL_S, from
// ACT_ROCK_FROM over the ground, in held steps; the dust; then the two souls
// out of the wreck and straight up through the tear, ridden up the road to
// the cloud floor (below).
export const ACT_ROCK_FALL_S = 2.2;
export const ACT_ROCK_FROM = P * 40;
export const ACT_ROCK_STEPS = 18;
export const ACT_ROCK_W = 16;                // cells, wider than the house's walls
export const ACT_ROCK_H = 11;
export const ACT_ROCK_DUST_S = 1.6;
export const ACT_ROCK_TONES = [GREY[10], GREY[9], GREY[8]];
export const ACT_SOUL_LIFT_S = 1.5;          // out of the wreck, fading in
export const ACT_SOUL_RIM = GREY[3];         // a soul's rim, the pale grey (DESIGN.md)
export const ACT_SOUL_PAPER = GREY[0];
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

// --- the mansion (the owner, 2026-10-17 night) ------------------------------
// On the house's ground, bigger than the house: a main block MANSION_FLOORS
// floors high between two lower wings and two towers. In cells, from its
// left end at MANSION_AT cells off the yard's left edge; the door is the
// main block's middle. A floor is MANSION_FLOOR_ROWS rows.
export const MANSION_AT = 6;
export const MANSION_FLOORS = 4;
export const MANSION_FLOOR_ROWS = 6;
export const MANSION_WING_W = 10;            // each wing, cells
export const MANSION_WING_FLOORS = 2;
export const MANSION_MAIN_W = 22;            // the main block
export const MANSION_TOWER_W = 4;            // each tower, standing at the main block's corners
export const MANSION_TOWER_FLOORS = 6;
export const MANSION_DOOR_W = 4;
export const MANSION_DOOR_H = 5;
export const MANSION_WINDOW = [2, 3];        // a window's w and h, cells
export const MANSION_WINDOW_EVERY = 5;       // cells between windows along a floor
export const MANSION_POLES = [11, 20, 28, 37];   // the scaffold's poles, cells off its left end
// The build, a standing job from the cage's fall: up to MANSION_BUILDERS of
// the yard's own builders (spare hands if it has none), a piece a trip.
// First the scaffold, a pole a trip off the old house's woodpile; then the
// fallen rock broken up, a row a trip, onto the blocks pile at
// MANSION_BLOCKS_AT cells off the yard's left edge, which is where every
// piece after comes from; the scaffold carried down last. A body takes
// MANSION_TAKE_S at a pile and MANSION_SET_S at the piece; a set piece fades
// in over MANSION_FADE_S.
export const MANSION_BUILDERS = 6;
export const MANSION_BLOCKS_AT = 1;
export const MANSION_BLOCKS_W = 4;
export const MANSION_BLOCK_CELLS = 4;          // the rock's cells a block on the pile stands for
export const MANSION_TAKE_S = 0.5;
export const MANSION_SET_S = 0.7;
export const MANSION_FADE_S = 0.6;
export const MANSION_GREYS = [GREY[10], GREY[8], GREY[6], GREY[4], GREY[2]];
export const MANSION_LIT = PURPLE[12];
// --- heaven's gates (docs/mocks/act3-gates-2026-10-19, take A; the owner,
// 2026-10-19) ------------------------------------------------------------------
// Tall pearly gates in a long cloud bank high over the ground, a cloud stair
// up to them from beside the ruin in switchback flights of ACT_STAIR_FLIGHTS
// steps each, turning on a landing ACT_STAIR_LANDING cells long: the first
// away from the ruin, the next back, and so on, an even count so its top
// comes out over its foot. A step is ACT_STAIR_TREAD cells along and
// ACT_STAIR_RISE up, so the bank stands ACT_GATES_SKY, every step's rise, over
// the ground (the owner, 2026-10-19: higher, the climb longer). The gates
// are the portal and nothing stands over them: going through the open gates
// is the trip (the ripple plays as the camera goes through), a body fading
// into the gateway at one end and out of it at the other over
// ACT_GATES_PASS cells of walk. The gates' middle stands ACT_GATES_CLEAR cells past
// the farther of the ruin's right end and the mansion's, so neither the stair
// nor the gates nor the bank stands on the mansion's ground or in its tower.
// Two leaves, each ACT_GATES_LEAF[0] cells wide and ACT_GATES_H tall, swing
// open in held steps a cell narrower each (ACT_GATES_LEAF), a step every
// ACT_GATES_STEP_S, and stand open ACT_GATES_HOLD_S after the camera has come
// through before they close the same way.
export const ACT_STAIR_TREAD = 3;
export const ACT_STAIR_RISE = 2;
export const ACT_STAIR_FLIGHTS = [5, 5, 5, 5];
export const ACT_STAIR_LANDING = 6;           // so each flight starts clear of the last one's top
export const ACT_GATES_SKY = P * ACT_STAIR_RISE * ACT_STAIR_FLIGHTS.reduce((a, n) => a + n, 0);
export const ACT_GATES_PASS = 6;
export const ACT_GATES_CLEAR = 4;
export const ACT_GATES_CELL = Math.max(FINALE_END_CELLS - FINALE_DOOR_CELL + FINALE_HOUSE_W + 3,
                                       MANSION_AT + MANSION_WING_W * 2 + MANSION_MAIN_W) + ACT_GATES_CLEAR;
export const ACT_GATES_LEAF = [5, 4, 3, 2, 1];
export const ACT_GATES_H = 16;
export const ACT_GATES_REACH = P * 8;        // the middle to a post's outside
export const ACT_GATES_STEP_S = 0.3;
export const ACT_GATES_HOLD_S = 1.5;
export const ACT_GATES_NEAR = P * 6;         // a body this near the gateway has them open
// The stair's far end, cells off the yard's left edge: the farthest landing's.
export const ACT_STAIR_END = ACT_GATES_CELL + ACT_STAIR_TREAD + 2 + ACT_STAIR_FLIGHTS.reduce(([x, far], n, i) => {
  const d = i % 2 ? -1 : 1, to = x + d * (n * ACT_STAIR_TREAD + (i < ACT_STAIR_FLIGHTS.length - 1 ? ACT_STAIR_LANDING : 0));
  return [to, Math.max(far, to)];
}, [0, 0])[1];
// The cloud bank the gates stand in, in cells: its reach either side of the
// gates' middle column and its depth under their feet (render/gates.js).
export const ACT_GATES_BANK = { left: 11, right: 20, deep: 3 };
// The whole stairway's right end, cells off the yard's left edge: the farther
// of the stair's far end, the bank's and a gate post's. The yard keeps the
// ground up to here for it (`HOME_GROUND`, config/sites.js), so no site is
// laid out under the stair however far the walk steps the sites left.
export const ACT_STAIRWAY_END = Math.max(ACT_STAIR_END, ACT_GATES_CELL + ACT_GATES_BANK.right + 1,
                                         ACT_GATES_CELL + ACT_GATES_REACH / P);

// The gathering: the freed souls coming down heaven's cloud stair and
// standing in files beside the mansion, MANSION_SOULS of them, a soul every
// MANSION_SOUL_EVERY_S; then the sheet after MANSION_SHEET_AFTER_S.
export const MANSION_SOULS = 24;
export const MANSION_SOUL_EVERY_S = 0.4;
export const MANSION_FILE_W = 8;             // souls a file
export const MANSION_FILE_AT = ACT_STAIR_END + 3;   // the files' left end, cells off the yard's left edge: past the stair
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
