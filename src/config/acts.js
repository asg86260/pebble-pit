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

// --- heaven's gates (docs/mocks/act3-gates-2026-10-19, take A; the owner,
// 2026-10-19, and 2026-10-20: left of the house) ------------------------------
// Tall pearly gates in a long cloud bank high over the ground, a cloud stair
// up to them in switchback flights of ACT_STAIR_FLIGHTS steps each, turning
// on a landing ACT_STAIR_LANDING cells long: the first away from the house,
// the next back, and so on, an even count so its top comes out over its foot.
// ACT_STAIR_SIDE is the first flight's way along the ground: the house stands
// to the gates' right, so away from it is left. A step is ACT_STAIR_TREAD
// cells along and ACT_STAIR_RISE up, so the bank stands ACT_GATES_SKY, every
// step's rise, over the ground (the owner, 2026-10-19: higher, the climb
// longer). The gates are the portal and nothing stands over them: going
// through the open gates is the trip (the ripple plays as the camera goes
// through), a body fading into the gateway at one end and out of it at the
// other over ACT_GATES_PASS cells of walk.
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
export const ACT_STAIR_TREAD = 3;
export const ACT_STAIR_RISE = 2;
export const ACT_STAIR_FLIGHTS = [5, 5, 5, 5];
export const ACT_STAIR_LANDING = 6;           // so each flight starts clear of the last one's top
export const ACT_STAIR_SIDE = -1;
export const ACT_GATES_SKY = P * ACT_STAIR_RISE * ACT_STAIR_FLIGHTS.reduce((a, n) => a + n, 0);
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
// The cloud bank the gates stand in, in cells: its reach on the stair's side
// of the gates' middle column and on the house's, and its depth under their
// feet (render/gates.js).
export const ACT_GATES_BANK = { stair: 20, house: 11, deep: 3 };
// The stair's foot, in cells off the gates' middle column: a body's left
// edge standing under the gateway (ghosts.js, `tearX`, a worker three
// cells wide), and the cells the treads and landings take either side of it.
export const ACT_STAIR_FOOT = -1;
export const ACT_STAIR_CELLS = ACT_STAIR_FLIGHTS.reduce((o, n, i) => {
  const d = ACT_STAIR_SIDE * (i % 2 ? -1 : 1);
  o.x += d * ACT_STAIR_TREAD * n;
  o.lo = Math.min(o.lo, o.x); o.hi = Math.max(o.hi, o.x + ACT_STAIR_TREAD - 1);
  if (i < ACT_STAIR_FLIGHTS.length - 1) {
    o.x += d * ACT_STAIR_LANDING;
    o.lo = Math.min(o.lo, o.x); o.hi = Math.max(o.hi, o.x + ACT_STAIR_TREAD - 1);
  }
  return o;
}, { x: 0, lo: 0, hi: ACT_STAIR_TREAD - 1 });
// The whole stairway, in cells off the gates' middle column: the farthest
// of the stair, the bank and a gate post on each side, where `lo` is the
// first cell and `hi` the last. The bank's puffs are drawn over it by a
// cell or two (render/gates.js), inside ACT_GATES_CLEAR.
export const ACT_GATES_BANK_CELLS = {
  lo: -(ACT_STAIR_SIDE < 0 ? ACT_GATES_BANK.stair : ACT_GATES_BANK.house),
  hi: ACT_STAIR_SIDE < 0 ? ACT_GATES_BANK.house : ACT_GATES_BANK.stair
};
export const ACT_STAIRWAY = {
  lo: Math.min(ACT_STAIR_FOOT + ACT_STAIR_CELLS.lo, ACT_GATES_BANK_CELLS.lo, -ACT_GATES_REACH / P),
  hi: Math.max(ACT_STAIR_FOOT + ACT_STAIR_CELLS.hi, ACT_GATES_BANK_CELLS.hi, ACT_GATES_REACH / P - 1)
};
// The gates' middle column over the yard, cells off its left edge: the
// stairway is the first thing at the yard's left end, ACT_GATES_CLEAR of bare
// ground in from the edge, and the home (the house, the mansion and its
// blocks) is laid out ACT_GATES_CLEAR past its right end (`HOME_AT`).
export const ACT_GATES_YARD_CELL = ACT_GATES_CLEAR - ACT_STAIRWAY.lo;
// The whole stairway's right end, cells off the yard's left edge.
export const ACT_STAIRWAY_END = ACT_GATES_YARD_CELL + ACT_STAIRWAY.hi + 1;
// The home's left end, cells off the yard's left edge: past the stairway.
export const HOME_AT = ACT_STAIRWAY_END + ACT_GATES_CLEAR;
// The gates' middle column over the afterlife's cloud floor, cells off its
// left edge. The camp is laid out from it (config/after.js), so it is its
// own number: it was the yard's column until the yard's gates moved left of
// the house (2026-10-20), and the camp stays where it was.
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

// MOCK act-3-the-intro
// Throwaway review numbers, never merged: the house's rock as a meteor, off
// screen to the ruin with flames (src/render/intro3mock.js), and the
// intro's walk up the stair and across the cloud floor at ACT_CALL_K's pace.
// Per option: `fallS` the fall's seconds, `holdS` the impact's hold (the dust
// phase), `trail` the flame's length behind the rock and `flare` its width
// past the rock's, in cells; `margin` cells kept clear of the view's edge at
// the start, so it begins wholly off screen; `ease` the power the fall
// speeds up by.
// Round 2 builds on C ("lets give it more sauce", the owner): `flick` the
// flame's edge cells flickering a cell at a time, `sparks` shed along the
// dive, `glow` the heat brightening as it nears the ground, `pulse` the
// shadow beating faster as it comes; then on the ground `smear` seconds of
// a held impact pose (the flame flattened out along the ground), `chunks`
// of the house thrown up in arcs, `ring` the dust's shockwave, `scorch`
// the scorched ground and its embers, `column` the smoke rising and
// drifting. Each hold is long enough that everything has faded by its end.
const INTRO3_C = { fallS: 2.6, holdS: 2.6, trail: 12, flare: 1, margin: 30, ease: 1.9, drift: 0.1, shadow: 0.9 };
const INTRO3_D = { ...INTRO3_C, trail: 24, flare: 2, margin: 36, flick: true, sparks: 60, glow: true, pulse: true };
const INTRO3_E = { ...INTRO3_D, holdS: 3.2, smear: 0.35, chunks: 20, ring: 34 };
const INTRO3_F = { ...INTRO3_E, holdS: 4.8, chunks: 26, scorch: true, column: 34 };
export const INTRO3_MOCK = {
  a: { fallS: 1.5, holdS: 2.2, trail: 34, flare: 2, margin: 4, ease: 1.7, drift: 0.18 },
  b: { fallS: 3.2, holdS: 2.8, trail: 18, flare: 1, margin: 4, ease: 1.25, embers: 0.9, smoke: 26 },
  c: INTRO3_C,
  d: INTRO3_D,
  e: INTRO3_E,
  f: INTRO3_F,
  // Round 3 on F (the owner: "it should come in, accellerating a bit,
  // screenshake, big explosion, slight crater, smouldering fire"): `ease` 2
  // is a fall under gravity, its speed growing the whole way, from a start
  // just `margin` cells off the top so the speeding up is seen; `shake` the
  // throw handed to the yard's own shake (world.js, `shakeView`, which the
  // motion setting already turns off), rung out by SHAKE_RATE and
  // SHAKE_DECAY in about half a second; `burst` flame cells and `balls`
  // smoke balls thrown out and up, held `smear` seconds first; `throw` the
  // debris's speed against E's; `ringRows` the dust ring's height at its
  // front; `crater` the bowl in cells (its depth, its half width, how far
  // the rock sits down in it, its rim's height); `smoulderS` the seconds
  // the fire left in it takes to go out once the hold is over.
  g: { ...INTRO3_F, fallS: 3.0, ease: 2, margin: 6, holdS: 5.2, smear: 0.2, shake: 20, burst: 130, balls: 18,
       chunks: 36, throw: 1.5, ring: 54, ringRows: 4, crater: { depth: 2, half: 14, sink: 2, rim: 3 }, smoulderS: 20 }
};
// The meteor's flame, hottest first: the meteor's own red (COIN_TONES.spark,
// palette.js: "out of the sky and still hot"), its brightest against the
// rock and down the flame's middle, its darkest at the edges and the end of
// the run, then smoke. White would vanish on the paper.
// Round 4, after G's impact (the owner: "lets have the two souls float a
// little bit and be lighter colored. and lets have them float straight up
// instead of the stairs"): `__intro3Float` picks a rise from the ruin up to
// heaven's gates in place of the stair. `s` the rise's seconds, `lead` the
// share of it spent going straight up before it leans over to the gates,
// `ease` the power its climb speeds up by, `sway` cells of side-to-side
// and `swayN` its swings. The second soul hangs `lag` cells below the first
// at the rise's middle, level with it at both ends. While any rise is
// picked the souls bob `bob` cells over `bobS` seconds wherever they go,
// are drawn in INTRO3_SOUL (a rim a step paler than ACT_SOUL_RIM, their
// clothes paler still), and wear a halo of INTRO3_HALO at `halo` opacity.
export const INTRO3_FLOAT = {
  h: { s: 4.0, lead: 0.62, ease: 1, sway: 0, swayN: 0, lag: 1.5 },
  i: { s: 4.6, lead: 0.55, ease: 2.2, sway: 0, swayN: 0, lag: 2.5 },
  j: { s: 5.2, lead: 0, ease: 1, sway: 2.5, swayN: 2.5, lag: 2 }
};
export const INTRO3_BOB = { bob: 1, bobS: 1.8, halo: 0.45 };
export const INTRO3_SOUL = { rim: GREY[2], grey: GREY[1], pale: GREY[0] };
export const INTRO3_HALO = GREY[3];
export const INTRO3_FLAME = ['#e8503a', '#d93a25', '#c62d1c', '#9c2214'];
export const INTRO3_SMOKE = [GREY[5], GREY[6], GREY[7]];
