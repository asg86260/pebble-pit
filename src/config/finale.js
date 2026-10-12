// --- the finale (src/finale.js; docs/mocks/retire-2026-10-12.html, the owner's picks) ---
// After the kill: she hangs her gear back on her station, one of the deep's
// own crew takes it up, the pair swim up through the portal, out of the
// drowned pit and down the whole yard to its far (left) end with the crew
// falling in behind, fireworks overhead, and sit together at sunset. Seconds
// unless named; a pace is pixels a second.
import { P } from './yard.js';

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
// The walk: the length of the yard to its left end, in whole cells, at this
// pace or quicker where the yard is longer than FINALE_WALK_MAX_S of it.
export const FINALE_WALK_PX_S = P * 30;
export const FINALE_WALK_MAX_S = 30;
export const FINALE_LEAD = 0.38;          // where the pair stand in the window, a share of it from the left
export const FINALE_END_CELLS = 40;       // where they stop: cells off the yard's left edge
export const FINALE_PAIR_GAP = P;         // between the two of them, hand in hand
// The crowd: each body leaves its work as the pair pass within this many
// cells of it and falls in behind them, two files, a rank every
// FINALE_RANK, the second file half a rank back and a cell nearer,
// hurrying to its place.
export const FINALE_JOIN_CELLS = 4;
export const FINALE_JOIN_PX_S = P * 42;
export const FINALE_RANK = P * 7;
export const FINALE_BEHIND = P * 3;       // between the pair and the first of the crowd
export const FINALE_HOP_S = 0.125;        // a held pose of the hop
export const FINALE_HOP = [0, 1, 2, 1];   // cells up, pose by pose
export const FINALE_MARK_EVERY_S = 3;     // a mark over each of the crowd this often
export const FINALE_MARK_S = 0.8;         // and up this long
// Fireworks over the walk, one this often, each a starburst, rings or a
// willow at random; a rise, then the burst in held steps, then the fall.
export const FINALE_FIREWORK_S = 1.25;
export const FIREWORK_RISE_S = 0.8;
export const FIREWORK_LIFE_S = 2.6;       // from the burst to the last spark gone
export const FIREWORK_HIGH = [0.12, 0.42];  // the burst's height, a share of the window down from its top
export const FIREWORK_STEP_HZ = 10;       // every firework moves in held steps of this many a second
// The ending at the far end: the sky over the horizon fills in grey bands, a
// band a step; they sit, a heart, the striped sun sinks a row a step; a last hold.
export const SUNSET_BAND_S = 0.6;
export const SUNSET_BANDS = 7;
export const SUNSET_BAND_CELLS = 2;
export const SUNSET_SIT_S = 0.6;
export const SUNSET_HEART_S = 1.2;        // when the heart goes up over them
export const SUNSET_HEART_FOR_S = 3;
export const SUNSET_SINK_S = 1.2;         // a row of the sun a step
export const SUNSET_SINK_ROWS = 5;
export const SUNSET_SUN_R = 9;            // cells
export const SUNSET_SUN_OFF = 22;         // its middle, cells left of where they sit
export const SUNSET_HOLD_S = 7.5;         // the whole ending, the final hold its last stretch
export const SUNSET_OUT_S = 1.5;          // the bands going again once the sheet is put down
// The space bar: what is left of the finale plays this much faster.
export const FINALE_HURRY = 4;

// --- the two of them afterwards, at the yard's left end, for good ---------------
// A small round of idling, a turn picked at random every RETIRED_TURN_S..:
// sitting together, a short stroll, looking up at the sky, a heart, a hop.
export const RETIRED_TURN_S = [5, 10];
export const RETIRED_STROLL_CELLS = 10;
export const RETIRED_STROLL_PX_S = P * 3;
export const RETIRED_HOP_S = 0.25;
export const RETIRED_HEART_S = 1.6;

// --- how it is drawn (render/finale.js) -----------------------------------------
// The yard's greys by name, darkest first (the page's own map turns them on a
// dark page, ink.js), and the accent: the portal's purple.
export const FINALE_GREYS = ['#262626', '#3d3d3d', '#666666', '#959595', '#c4c4c4', '#e3e3e3'];
export const FINALE_PURPLE = '#7b3fe4';
// The sunset's bands: the two nearest the horizon the darker.
export const SUNSET_BAND_TONES = ['#c4c4c4', '#e3e3e3'];
export const SUNSET_STRIPE_ROWS = 4;      // the sun's rows under this many over its middle are cut into stripes
export const SUNSET_RAY_R = 11;           // the purple dotted ring round it, cells
// Each firework's shape, in cells and seconds from its burst:
//   star    `spokes` rays growing a cell every `grow`, then `sparks` falling out
//   ring    a ring widening a cell every `grow`, then `sparks` falling out
//   willow  a quick pop, then `sparks` drooping in long grey trails
export const FIREWORKS = {
  star:   { spokes: 8, grow: 0.15, open: 0.6, sparks: 16, from: 4, spread: 3, drop: 5, out: 2.4 },
  ring:   { grow: 0.15, open: 0.75, sparks: 14, from: 5, spread: 1.5, drop: 3, out: 2.4 },
  willow: { pop: 0.3, sparks: 10, fan: 0.55, reach: 2.4, squash: 0.6, drop: 4, trail: 4, trailS: 0.12, out: 2.6 },
};
export const FIREWORK_TAIL = 3;           // the rising shell's trail, cells
export const FIREWORK_DIM = [1.2, 1.8];   // seconds past the burst its sparks go grey, then pale
// The ring ringing out at the deep's end of the portal as they go through.
export const FINALE_RING_FROM = 1;        // cells past the portal's own edge
