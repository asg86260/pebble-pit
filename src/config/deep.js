// --- the deep: the serpent's half ---------------------------------------------
// The place under the drowned pit, the serpent in it, and the fight. See "The serpent: the second half of the game" in DESIGN.md and
// docs/wave-serpent.md. Every number here is a first guess: the heals and the
// depths are the second half's `ABYSS_AT`, and they are tuned against the
// first half's length once the whole half can be played.
import { P } from './yard.js';

// The switch for the whole half. Off, a released build's story ends where
// 0.4.1's did: the rescue's sheet, the crew's dance, a drowned pit and no
// snatch, so nothing below it is ever reached. A dev build and the node yard
// play the half whatever this says (snatch.js, `serpentOn`), so work on it
// goes on; `__serpentOn(false)` plays a released build's yard.
export const SERPENT_ON = false;

// --- where it is ---------------------------------------------------------------
// The deep lies under the world, below the yard's bottom edge, so a body that
// goes down the shaft has somewhere real to arrive and every position in it is
// an ordinary world position. The view is a camera move to it (view.js).
export const DEEP_GAP = P * 20;      // world px of shaft between the yard's bottom and the deep's ceiling
export const DEEP_H = P * 130;       // the deep's ceiling to its floor
export const DEEP_LEFT = P * 140;    // how far it reaches left of the pit's near lip
export const DEEP_W = P * 520;       // and across
export const DEEP_MOUTH = P * 40;    // the shaft, in from the pit's near lip: where a body goes in and comes up
// The stations stand on the deep's floor, at these fractions of its width from
// its left edge. The altar is the deep's bench: punching, and the doors. The
// pods stand between the crusher and the altar (the owner's call,
// 2026-09-23), clear of the gatherers' toss at the crusher's side. Past the
// crusher they stand an even step apart, each step wider than a station and
// the ground its crew stands on (DEEP_STAND_W) together, and the spire is
// still well inside the deep's right end.
export const DEEP_SPOTS = { crusher: 0.05, pods: 0.19, altar: 0.335, well: 0.475, font: 0.62, circle: 0.76, spire: 0.9 };
// The pods: the deep's houses, a capsule a body, stacked POD_COLS abreast from
// the floor up (DESIGN.md, "One crew, two homes").
export const POD_W = P * 7;
export const POD_H = P * 5;
export const POD_GAP = P;
export const POD_COLS = 4;
// How far either side of a station's middle a body working it may stand.
// The station's own ground is its prop and its post (`standOfStation` in deep/place.js).
export const DEEP_STAND_W = P * 30;

// --- the crusher ------------------------------------------------------------------
// The purse's mouth, at the deep's left end (DESIGN.md, "The crusher"): a
// scale is money once it lands in the hopper, and not before. The hopper is
// the top of the machine, narrower than its body.
export const CRUSHER_W = P * 30;
export const CRUSHER_H = P * 30;
export const HOPPER_W = P * 20;      // the mouth across the top
export const HOPPER_LIP = P * 3;     // how far down into the hopper a scale has to fall to be taken
// A gatherer's toss: from beside the crusher up and over into the hopper, on
// an arc drawn in the water rather than thrown on its gravity, so every scale
// a gatherer throws goes in.
export const GATHER_TOSS_FRAMES = 40;       // frames from the hand to the hopper
export const GATHER_TOSS_RISE = P * 14;     // how high over the lip the arc peaks
export const GATHER_TOSS_FROM = P * 8;      // how far out from the crusher's side a gatherer stands to toss
export const GATHER_TOSS_STAGGER = 3;       // frames between one scale of a load leaving and the next
// A hand's flick in the water: the yard's throw, damped, so a handful let go
// over the hopper drops in rather than sailing past it.
export const DEEP_THROW = 0.25;

// --- the serpent's body ------------------------------------------------------------
// A chain of segments across the deep, swaying on its own clock: nothing in the
// deep is still. `coilAt` in deep/place.js is the one reader.
export const COIL_SEGS = 56;         // segments, head to tail
export const COIL_X0 = 0.28;         // the head's end, a fraction of DEEP_W
export const COIL_X1 = 0.94;         // the tail's end
export const COIL_Y = 0.58;          // its centerline, a fraction of DEEP_H down from the ceiling
export const COIL_AMP = P * 9;       // how far it swings either side of that
export const COIL_WAVES = 3;         // waves along its length
export const COIL_SWAY_MS = 7000;    // one sway
// The body's girth along it, a python's: a head fuller than the slim neck
// behind it, swelling to its thickest where he is held and holding that to
// COIL_TAIL_FROM, then a long taper to the tip. `coilThick` in place.js is
// the one reader, for the drawing and for every hit alike.
export const HEAD_SEGS = 3;          // segments of head
export const COIL_HEAD = P * 8;      // the head, across
export const COIL_NECK = P * 5;      // the neck behind it, the slimmest of the body
export const COIL_NECK_EASE = 2;     // segments the head takes to narrow to the neck
export const COIL_GIRTH = P * 9;     // the body at its thickest, from the belly back
export const COIL_TAIL_FROM = 0.75;  // where the tail starts to thin, head to tail
export const COIL_TIP = 0.25;        // the tip, a share of the girth
export const BELLY_AT = 0.58;        // where he is held, a fraction of the way from head to tail
export const SPLIT_LENGTHS = 5;      // stage three: the coil divides into this many lengths

// A phase is a window (DESIGN.md, "The serpent heals whole: a phase is a
// window"): the party has SERPENT_WINDOW seconds of it, then the serpent eats
// the next creature to reach its mouth and heals to full. A depth is about
// what the party should do in one window. First guesses; the dev panel has both.
export let SERPENT_WINDOW = [40, 32, 26, 20];                // seconds a phase gives before it eats
export const SERPENT_DEPTHS = [4300, 9400, 6700, 5100];    // the depth that breaks it, a stage (tools/node/deep-pace.mjs --solve)
export let SERPENT_WOUND = SERPENT_DEPTHS.slice();           // and as the dev panel has scaled it
// Resists (DESIGN.md, "Resists: magic in the ward, physical in the split,
// both in the fading"). Every hit is one kind of damage, and a phase resists
// a kind: a resisted hit does RESIST_K of itself. The bare phase resists
// nothing; the fading takes the two in turn, RESIST_TURN_S each, the coming
// one showing on the hide RESIST_WARN_S before it (deep/phases.js). The click
// is a punch, of no kind, whole in every phase.
export const DAMAGE_KIND = {
  punch: null,
  brawler: 'physical', sword: 'physical', martial: 'physical', assassin: 'physical', ranger: 'physical',
  monk: 'magic', hexer: 'magic', mage: 'magic',
  sapper: 'explosive'
};
export const RESISTS = [[], ['magic'], ['physical'], ['magic', 'physical']];
export const RESIST_K = 0.5;
export const RESIST_TURN_S = 20;
export const RESIST_WARN_S = 1;
// Each hit's multiple a phase, the fading's as it opens: the table the checks
// and the model read. What a hit takes this frame is `guardOf` (deep/phases.js).
export const SERPENT_DEFENSE = Object.fromEntries(Object.entries(DAMAGE_KIND).map(([hit, kind]) =>
  [hit, RESISTS.map(r => (kind && r[0] === kind ? RESIST_K : 1))]));
// A stunning blow seizes the coil and stops the heal (DESIGN.md, "Blows land:
// the burst and the stun"). Only a capstone stuns -- the Brawler's haymaker,
// the Monk's chi palm, the Ranger's aimed shot and the Sapper's pair of
// charges, each from rung 8. A stun lasts STUN_BASE_S, longer on the square
// root of how many times over the share the blow was, up to STUN_MAX_S; a new
// stun keeps the longer of the two, and none can start in the grace after one
// ends.
export let STUN_SHARE = 0.03;        // a blow's share of the stage's depth that stuns
export let STUN_BASE_S = 1.5;        // seconds a blow of exactly the share stuns for
export let STUN_MAX_S = 5;           // and the longest any blow does
export let STUN_GRACE_S = 4;         // seconds after a stun ends before another can start
// The click in the deep is always a punch, worth this on the first station's
// rung: the hand grows with the first fighter's ladder.
export const CLICK_DMG = [1, 2, 3, 5, 8, 12, 18, 26, 40];

// --- statuses ----------------------------------------------------------------------
// Laid on the whole serpent (deep/statuses.js): Bleeding ticks, Exposed takes
// more from everything, Held neither eats nor sways. On a fighter: Inspired
// hits harder, Hasted swings sooner. What raises a hit -- Exposed, Inspired --
// is added up and multiplied in once, at most AMP_MAX more.
export const EXPOSED_AMP = [0.15, 0.25];   // Exposed, this much more from everything: the Hexer's move, its capstone
export const AMP_MAX = 1;                  // every amp together, at most
export const HASTE = 0.2;            // Hasted: this much more often

// --- scales ------------------------------------------------------------------------
// A hit knocks scales loose by the size of what it did, a few more for each
// tenfold of its damage rather than one a unit: the party's damage grows a
// hundredfold over the fight and the gatherers' carry does not, so a shed
// that followed the damage buried the floor. They fall through the water on
// the deep's own gravity and settle on its floor, which is the deep's purse:
// a scale is counted when it lands, like a grain in the pit.
export const SCALE_PER_DECADE = 1.5; // scales a hit sheds for each tenfold of its damage, one at least
export const SCALE_BASE = 2;         // and this many more on every hit, so a small one sheds a handful
export const DUST_PER_SCALE = 10;    // what a scale is worth against dust (DUST_PER in upgrades/price.js)
export const DEEP_BED_ROWS = 40;     // the floor's plot of scales: this many cells deep at most
export const DEEP_BED_BRIM = 4;      // rows short of that the floor counts as full (the pile-full mark)
// A scale knocked loose leaves the hit with a little scatter of its own, so a
// hit sheds a cloud rather than a column. Its tone is dealt near the middle
// of the shades: a bed of one tone is printed paint.
export const SCALE_KICK = 1.2;       // px a frame, the most a loosed scale starts moving
export const SCALE_SHADE = 3;        // the shade a scale is dealt near (SHADES)
export const SCALE_SPREAD = 1;       // and how far either side
// Paying lifts scales off the bed to the station that took them. A payment of
// thousands is drawn as a stream of a few, each one standing for the rest.
export const LIFT_PACE = 3;          // px a frame a paid scale rises
export const LIFT_FLECKS = 40;       // the most flecks one payment sends up
export const LIFT_STAGGER = 2;       // frames between one fleck leaving and the next

// --- the water ---------------------------------------------------------------------
// Buoyant and slowed: everything sinks at a fraction of a grain's fall and is
// pushed sideways by a current that turns on its own clock.
export let DEEP_GRAV = 0.05;         // px a frame a frame, against the yard's GRAV of 1
export let DEEP_DRAG = 0.95;         // velocity kept a frame
export let DEEP_CURRENT = 0.3;       // px a frame, the current's push at its strongest
export const DEEP_CURRENT_MS = 11000; // one turn of it
// Bodies in the deep swim, at a share of their walk: the water is thick.
export const SWIM_PACE = 0.5;

// --- the deep's crew at rest -----------------------------------------------------
// A body whose station has nothing for it strolls, floats or hops about its
// station's ground (DEEP_STAND_W), with a rest between (DESIGN.md, "The deep's
// crew at rest", D of the mocks). Speeds are px a frame, times ms.
export let DEEP_REST_WALK = 0.3;          // a stroll's top pace, against the yard's IDLE_PACE
export const DEEP_REST_BOB = P / 2;       // how high a stroll's step lifts it, at full pace
export const DEEP_REST_STRIDE = P * 2.5;  // px of stroll a step
export const DEEP_REST_REACH = 0.6;       // a stroll goes at most this share of the ground from where it is
export let DEEP_REST_MS = 2000;           // the least rest between two goes
export const DEEP_REST_MORE_MS = 3000;    // and up to this much longer
// What a body picks once its rest is up: a stroll, a float, a hop, as weights.
// A stroll most often, as the owner voted.
export const DEEP_REST_MIX = { walk: 0.45, float: 0.27, hop: 0.28 };
// A float: it rises this many cells, eased, hangs swaying, and sinks back.
export let DEEP_REST_RISE = [4, 11];              // cells: fewest, most
export const DEEP_REST_RISE_MS = [2600, 4400];    // the rise takes between these
export const DEEP_REST_HANG_MS = [1200, 3400];    // and it hangs between these
export const DEEP_REST_SWAY = 2;                  // px a hanging body sways up and down
export const DEEP_REST_SWAY_MS = 1800;            // one sway
export const DEEP_REST_CURRENT = 0.25;            // the share of the current that pushes a floating body
export const DEEP_REST_DRIFT = 0.15;              // and its own sideways drift, at most
// The pull on a body sinking or hopping: the water's, far under the yard's,
// and held back by the drag. A sink comes in soft: never faster than the
// first number plus the second for each px it still has to fall.
export let DEEP_REST_PULL = 0.018;
export const DEEP_REST_DRAG = 0.985;
export const DEEP_REST_SOFT = [0.06, 0.02];
export const DEEP_REST_SINK = 0.6;                // a sink's pull, a share of the hop's
// A hop: a push off between these (px a frame, up), aimed a few cells along,
// one to DEEP_REST_HOPS in a row with a crouch between.
export const DEEP_REST_HOP = [1.4, 2.2];
export const DEEP_REST_HOP_REACH = P * 8;
export const DEEP_REST_HOPS = 3;
export const DEEP_REST_CROUCH_MS = [500, 1000];
// How far under the water line a resting body's top keeps, so nothing at rest
// drifts up into the surface's clip.
export const DEEP_REST_HEADROOM = P * 30;
export const DEEP_REST_SILT = 4;                  // silt a landing kicks up

// --- the fighters -------------------------------------------------------------------
// The class numbers are in config/classes.js. What hurts for as long as it is
// held -- the Mage's beam, a bleed -- strikes in ticks of this long, each tick
// a hit that sheds its own scales: a hit a frame would shed a scale a frame
// whatever the damage was.
export const DOT_TICK_S = 0.5;

// --- a phase's mechanic (DESIGN.md, "A phase has a mechanic and a class answers it") ---
// One a phase past the first, on the phase's own clock: calm, then its
// warning, then the thing itself, then round again, `every` seconds a turn.
// Seconds throughout.
//
//   surge  the heal times `x` for `last`; a stun in the warning or in it spends it
//   lash   a wave runs head to tail in `last` and throws off the melee
//          fighters at the hide, dazed `daze` where they land; the Hexer's
//          Held in the warning stops it
//   sink   he dims into the abyss for `last`, in and out over `fade`;
//          nothing strikes him past half gone, and the heal runs
export const MECHANICS = [
  null,
  { kind: 'surge', every: 45, warn: 3, last: 6, x: 3 },
  { kind: 'lash', every: 30, warn: 1.5, last: 1.1, daze: 3 },
  { kind: 'sink', every: 40, warn: 1, last: 8, fade: 1 }
];
// The lash's shape: the coil draws up to this share of its sway in the
// warning, over `LASH_TAUT_S`, and the tail lifts; then a bump this deep and
// this wide (a share of the body) runs down it.
export const LASH_TAUT = 0.8;
export const LASH_TAUT_S = 0.6;
export const LASH_LIFT = P * 12;       // the tail's tip, raised at the height of the warning
export const LASH_H = P * 14;          // the bump, down off the line
export const LASH_W = 0.05;            // its half width, a share of the body head to tail
// A lashed fighter is thrown this hard, px a frame: down, and out to a side.
export const LASH_THROW = [1.6, 2.2];
// The surge's throb over the belly, and the sink's: how far out the ring
// stands, cells, and its beat; how dim the coil goes under; the warning's flicker.
export const THROB_R = 4;
export const THROB_HZ = 2.5;
export const SINK_DIM = 0.85;
export const SINK_WARN_DIM = 0.3;
export const SINK_VEIL_EVERY = 3;      // a veil cell every this many cells along the body

// --- a phase's break (the owner's vote, 2026-10-04) ---------------------------------
// The first break is a dive (the owner's B): he goes down out of sight below
// the deep's floor over `in`, in BREAK_DIVE_STEPS held steps, stays under for
// `under` while bubbles rise off the floor, and comes back up over `out` in
// the next phase's hide, the bar refilling as he rises and its phase boxes shown from then on.
// The later ones are a roar: the jaws stand wide over `gape`, a bump runs up
// off the line head to tail over `run`, the new hide behind it and the bar
// filling with it, and the jaws shut over `shut`. The bump throws off the
// melee fighters it passes, dazed BREAK_ROAR_DAZE. Nothing reaches him while
// either plays, and nothing heals. Seconds.
export const BREAK_DIVE = { in: 1, under: 1.2, out: 1 };
export const BREAK_DIVE_STEPS = 4;     // the held steps down, and back up
export const BREAK_DIVE_OVER = P * 4;  // how far past the floor his top edge goes
export const BREAK_BUBBLES = 9;        // bubbles off the body while he is under
export const BREAK_BUBBLE_RISE = 14;   // cells a bubble climbs before it is gone
export const BREAK_ROAR = { gape: 0.4, run: 1.6, shut: 0.4 };
export const BREAK_ROAR_H = P * 8;     // the bump, up off the line
export const BREAK_ROAR_DAZE = 0.6;
export const BREAK_FILL_STEPS = 8;     // the bar refills in this many held steps

export const DEEP_KNOBS = [
  { key: 'SERPENT_WINDOW_1', label: 'serpent window, bare', min: 5, max: 120, step: 1,
    get: () => SERPENT_WINDOW[0], set: v => { SERPENT_WINDOW = SERPENT_WINDOW.map((w, i) => (i === 0 ? v : w)); } },
  { key: 'SERPENT_WINDOW_2', label: 'serpent window, warded', min: 5, max: 120, step: 1,
    get: () => SERPENT_WINDOW[1], set: v => { SERPENT_WINDOW = SERPENT_WINDOW.map((w, i) => (i === 1 ? v : w)); } },
  { key: 'SERPENT_WINDOW_3', label: 'serpent window, split', min: 5, max: 120, step: 1,
    get: () => SERPENT_WINDOW[2], set: v => { SERPENT_WINDOW = SERPENT_WINDOW.map((w, i) => (i === 2 ? v : w)); } },
  { key: 'SERPENT_WINDOW_4', label: 'serpent window, fading', min: 5, max: 120, step: 1,
    get: () => SERPENT_WINDOW[3], set: v => { SERPENT_WINDOW = SERPENT_WINDOW.map((w, i) => (i === 3 ? v : w)); } },
  { key: 'SERPENT_WOUND_SCALE', label: 'serpent wound depths, x', min: 0.1, max: 5, step: 0.1,
    get: () => SERPENT_WOUND[0] / SERPENT_DEPTHS[0],
    set: v => { SERPENT_WOUND = SERPENT_DEPTHS.map(d => Math.round(d * v)); } },
  ...MECHANICS.filter(Boolean).map(m => ({ key: `MECH_${m.kind.toUpperCase()}_EVERY`, label: `${m.kind}, every s`,
    min: 5, max: 180, step: 1, get: () => m.every, set: v => { m.every = v; } })),
  { key: 'STUN_SHARE', label: 'stun, share of the depth a blow needs', min: 0.005, max: 1, step: 0.005,
    get: () => STUN_SHARE, set: v => { STUN_SHARE = v; } },
  { key: 'STUN_BASE_S', label: 'stun, seconds at the share', min: 0.2, max: 10, step: 0.1,
    get: () => STUN_BASE_S, set: v => { STUN_BASE_S = v; } },
  { key: 'STUN_MAX_S', label: 'stun, seconds at most', min: 0.5, max: 20, step: 0.5,
    get: () => STUN_MAX_S, set: v => { STUN_MAX_S = v; } },
  { key: 'STUN_GRACE_S', label: 'stun, grace after one, s', min: 0, max: 20, step: 0.5,
    get: () => STUN_GRACE_S, set: v => { STUN_GRACE_S = v; } },
  { key: 'DEEP_GRAV', label: 'deep gravity', min: 0.01, max: 0.3, step: 0.01,
    get: () => DEEP_GRAV, set: v => { DEEP_GRAV = v; } },
  { key: 'DEEP_DRAG', label: 'deep drag', min: 0.8, max: 1, step: 0.005,
    get: () => DEEP_DRAG, set: v => { DEEP_DRAG = v; } },
  { key: 'DEEP_CURRENT', label: 'deep current', min: 0, max: 1.5, step: 0.05,
    get: () => DEEP_CURRENT, set: v => { DEEP_CURRENT = v; } },
  { key: 'DEEP_REST_WALK', label: 'deep rest, stroll pace', min: 0.05, max: 1.5, step: 0.05,
    get: () => DEEP_REST_WALK, set: v => { DEEP_REST_WALK = v; } },
  { key: 'DEEP_REST_RISE_TOP', label: 'deep rest, float cells at most', min: 4, max: 24, step: 1,
    get: () => DEEP_REST_RISE[1], set: v => { DEEP_REST_RISE = [DEEP_REST_RISE[0], v]; } },
  { key: 'DEEP_REST_MS', label: 'deep rest, least rest ms', min: 0, max: 10000, step: 250,
    get: () => DEEP_REST_MS, set: v => { DEEP_REST_MS = v; } },
  { key: 'DEEP_REST_PULL', label: 'deep rest, pull on a hop', min: 0.005, max: 0.1, step: 0.001,
    get: () => DEEP_REST_PULL, set: v => { DEEP_REST_PULL = v; } }
];
