// --- the deep's crew: the swim, the shaft, the caps, the snatch and the freeing ---
// Owned by track CREW of docs/wave-serpent.md. Every number the track needs
// lives here; a magic number in a module is a bug.
import { P } from './yard.js';

// --- the shaft -------------------------------------------------------------------
// The way down from the plank over the drowned pit to the deep's floor is a
// link like a ladder (route.js), but it is a swim through the liquid rather
// than a climb, and it is long: this, times the body's own pace, is how fast it
// goes. A share of the walking pace rather than a speed of its own, so the
// commute ladder hurries the shaft with everything else.
export let SHAFT_PACE = 0.6;

// --- the party (docs/wave-party.md) -----------------------------------------------
// A station holds one fighter, so the fighters' cap is the stations standing
// (`capOfBare` in levels.js); the most there can be is FIGHT_STATIONS_MAX.
//
// Worker-seconds a delver puts into a station before it stands: a building's
// worth, like the doors of the deep it replaces.
export const STATION_WORK_S = 45;
// A fang drops at each of the serpent's first this-many phase breaks: the
// first station is free, and each fang buys one more.
export const FANG_BREAKS = 3;
// A fang sinks like a scale (DEEP_GRAV, DEEP_DRAG), let go this far off the
// coil's belly with a little sideways drift.
export const FANG_KICK = 0.6;
// The gatherers: the deep's crew on no weapon (`S.deepCrew`, set at the
// shaft). They keep a hauler's load and pace (`haulCap`, `haulSpeed`), scoop
// at GATHER_SCOOP, and wait by the crusher on a bare floor.
export const GATHER_SCOOP = 8;       // scales a second, into a hauler's arms

// A body thrown in the deep (crew/falls.js): the water takes the throw off it
// and it sinks, slowly, to the floor it is over.
export const SINK_PULL = 0.06;       // px a frame a frame, down
export const SINK_DRAG = 0.93;       // what is left of its speed after a frame


// --- the snatch ----------------------------------------------------------------------
// The pair walk to the plank and stand at its edge; the surface heaves, then
// something comes up out of it in held steps, takes one of them, holds him
// there, and goes back down; the one left stands alone a beat, leaps in
// after him, and the surface closes over the both of them. Each moment ends
// in a hold (docs/mocks/cutscene-focus-2026-10-12.html, the snatch's
// timeline: rise 0.5, take 1.2, sink 0.6, alone 1.4, leap 0.8, still 1.2).
export const SNATCH_RISE = P * 16;     // how far over the surface the head comes up
export const SNATCH_EDGE = P * 4;      // how far apart the two stand at the edge, one nearer the water
export const SNATCH_WALK_MAX_S = 2;    // the walk out to the plank, at least the pace anybody crosses the yard at
export const SNATCH_LOOK_MS = 800;     // stood at the edge before anything comes up
export const SNATCH_HEAVE_MS = 600;    // the surface heaving over the head before it breaks
export const SNATCH_HEAVE_STEPS = 4;   // up a cell and back, held each
export const SNATCH_RISE_MS = 500;     // the head up out of the surface
export const SNATCH_RISE_STEPS = 3;    // in held frames, never popped in
export const SNATCH_TAKE_MS = 1200;    // the head held over them, him in its jaws, before it goes
export const SNATCH_SINK_MS = 600;     // and back down with him
export const SNATCH_SINK_STEPS = 3;
export const SNATCH_ALONE_MS = 1400;   // her alone at the edge, a mark over her
export const SNATCH_LEAP_MS = 800;     // her leap, edge to whirlpool
export const SNATCH_LEAP_STEPS = 16;   // in held poses, each under a body's width so none is a jump
export const SNATCH_LEAP_H = P * 12;   // and how high it arcs
export const SNATCH_STILL_MS = 1200;   // the whirlpool closing over the empty water, held on it
// The snatch goes through a portal in the abyss's own surface (DESIGN.md,
// "Two crews and a portal"): a whirlpool opening on the liquid before the
// head comes up out of it, and closing once she is through it.
export const SNATCH_PORTAL_MS = 900;   // the whirlpool opening on the surface
// The portal itself: a ring turning on the surface over the shaft, this wide
// and this deep, and how long the conjured one takes to open.
export const PORTAL_RX = P * 11;
export const PORTAL_RY = P * 3;
export const PORTAL_OPEN_MS = 1500;
export const PORTAL_TURN_MS = 2400;    // one turn of its rim
// The wizards' portal is a hole torn into the drowned pit's near wall
// (DESIGN.md, "Two crews and a portal", F of the mocks): this much of its
// width in the ground, the rest in the liquid.
export const PORTAL_INTO_WALL = 0.7;
// Its lip is the abyss's veil laid round the tear: from and to this far out,
// in the hole's own radius, brightest at the middle and fading this far to
// either side; streaming round in this many runs a turn, one run passing in
// PORTAL_LIP_MS, bent by a slower wobble.
export const PORTAL_LIP_FROM = 0.8;
export const PORTAL_LIP_TO = 1.12;
export const PORTAL_LIP_MID = 0.96;
export const PORTAL_LIP_HALF = 0.16;
export const PORTAL_LIP_RUNS = 7;
export const PORTAL_LIP_MS = 900;
export const PORTAL_LIP_WOBBLE_MS = 2300;
export const PORTAL_LIP_FLOOR = 0.4;      // how lit its dimmest stretch still is
export const PORTAL_LIP_WOBBLE_RUNS = 3;
export const PORTAL_LIP_WOBBLE = 3;       // radians the wobble bends the runs by
export const PORTAL_LIP_JITTER = 0.06;    // the hash's nudge, so no stretch is one flat tone
export const PORTAL_LIP_MIN = 0.12;       // lit under this, the liquid or the ground shows through
export const PORTAL_LIP_GREY_TOP = 0.8;   // how far up the grey ramp its greys reach
export const PORTAL_LIP_PURPLE_FROM = 0.55; // where on the purple ramp its purples start
export const PORTAL_LIP_PURPLE = 0.72;    // lit past this, the veil goes purple
// Stars riding round in the lip: this many seats a turn, a lap in this long.
export const PORTAL_LIP_SEATS = 60;
export const PORTAL_LIP_LAP_MS = 5200;
export const PORTAL_LIP_SEAT_EVERY = 3;   // one seat in this many holds a star
export const PORTAL_LIP_SEAT_W = 0.05;    // a star's width round the turn, in seats, and across the lip, in radii
// The tear wanders a little cell to cell and in slow lobes round the turn;
// the ground torn behind the lip is these greys.
export const PORTAL_TEAR_JITTER = 1 / 90;
export const PORTAL_TEAR_LOBES = 5;
export const PORTAL_TEAR_LOBE = 0.05;
export const PORTAL_TORN = ['#8a8a8a', '#b0b0b0'];
// The mouth: the liquid under it, a little deeper and purpler, held this
// many rungs darker on the grey ramp and on the purple one.
export const PORTAL_MOUTH_DEEP = 0.4;
export const PORTAL_MOUTH_PURPLE = 2;     // stars in seven
export const PORTAL_MOUTH_DIM = 3;
export const PORTAL_MOUTH_DIM_PURPLE = 2;
// Crumbs of the torn ground falling off the lip and spiraling in: this many
// at once, each in this long from the lip to the middle, going round this
// many turns on the way.
export const PORTAL_CRUMBS = 9;
export const PORTAL_CRUMB_MS = 5200;
export const PORTAL_CRUMB_TURNS = 0.45;
// The wizards' portal is summoned, not bought outright: a wizard flies out
// over the pit and pours it for this many wizard-seconds, from this high
// over the surface.
export const PORTAL_POUR_S = 18;
export const PORTAL_HOVER = P * 18;
// What the wizards ask to hold one open: the dome's shape, smaller -- a
// first guess, like every price of the second half.
export const PORTAL_BILL = [['dust', 120000], ['shard', 2500], ['spore', 5000], ['spark', 2500]];
// The skip (space, held) does not cut to the end -- nothing teleports -- it
// plays what is left of the beat this many times faster.
export const SNATCH_HURRY = 4;

// --- the freeing -----------------------------------------------------------------------
// The fourth defense broken (the owner's B and D, docs mock 2026-10-04,
// "Serpent Kill: Limp and Apart"): the last blow lands; the sway dies and the
// serpent sinks to the floor in KILL_LIMP_STEPS held steps; lying there its
// hide comes apart into the abyss's motes from the tail up, leaving him on
// the floor where the belly was; he walks to her at KILL_WALK_PX_S and they
// cheer; the camera, in on the belly since the last blow, pulls back; the
// sheet. Put down, the motes gather back into the serpent head first over
// KILL_REFORM_S. Seconds.
// The last blow is held a full beat before the coil goes limp.
export const KILL = { last: 1, limp: 1.6, apart: 1.6 };
export const KILL_LIMP_STEPS = 4;
export const KILL_WALK_PX_S = P * 18;
export const KILL_WALK_MAX_S = 2;     // and never longer than this: across the whole deep he hurries
export const KILL_CHEER_S = 1.2;       // held on the two of them before the finale takes them on
export const KILL_HOP_S = 0.25;        // a hop up and down, a beat each, while they cheer
export const KILL_ZOOM = 0.7;          // how much closer the deep's frame comes in
export const KILL_IN_S = 0.8;
export const KILL_OUT_S = 1;
// The frame's moves, each a glide on an ease and then held: onto the belly
// at the last blow, and over to where the two of them meet once he is out.
export const KILL_GLIDE_S = 1.2;
// They meet outside her station's glass, where they can be seen: she comes
// out to its edge, and he stops a body and a cell short of her.
export const KILL_MEET_GAP = P;
export const KILL_MOTE_S = 1.5;        // a mote off the coming-apart hide, up and gone
export const KILL_MOTE_RISE = 8;       // cells a second it climbs
export const KILL_REFORM_S = 2.2;
// Let go where the belly was, he drops to the floor in KILL_DROP_STEPS held
// steps over KILL_DROP_S.
export const KILL_DROP_S = 0.4;
export const KILL_DROP_STEPS = 3;

export const DEEP_CREW_KNOBS = [
  { key: 'SHAFT_PACE', label: 'shaft pace, x', min: 0.1, max: 3, step: 0.1,
    get: () => SHAFT_PACE, set: v => { SHAFT_PACE = v; } }
];

// The rescue's sheet with the second half on (DESIGN.md, "From the rescue
// straight into the snatch"; the owner's A): no button; it stands this long,
// then rises and fades over RESCUE_SHEET_LEAVE_S as the snatch begins.
export const RESCUE_SHEET_HOLD_S = 2;
export const RESCUE_SHEET_LEAVE_S = 1.2;
