// --- the air, and what it costs -----------------------------------------------
// Every grain taken out of the ground puts a mote of it into the sky. The sky
// holds them, they gather, and past a point the sky gives them back -- all at
// once, all over the yard, as muck. It is the only thing in this game that
// makes the works worse, and it is caused by the one thing you do most.
//
// This, SCRUB_PULL, RECYCLE_PER, SCRUB_PER_MUCK and RAIN_PER_S move together:
// they are one cycle, and changing one alone changes the balance, not the
// pace. Fouling against scrubbing is the number that decides whether the house
// is worth buying ("the air" in DESIGN.md).
//
// Small on purpose: hand labor should barely mark the sky, so that the
// machinery is the dirty thing.
export let SMOG_PER_DUST = 0.08;
export const QUARRY_FOUL = 2;        // a shard out of the quarry is a hole full of it
export const FARM_FOUL = 1;          // and turning a plot over lifts some too
// The sky has to get properly filthy before it comes down, or the rain arrives
// while the sky is still a scatter of specks and the cause is never on screen
// long enough to be read as one.
export const SMOG_RAIN_AT = 3200;    // and this many of them up there brings it down
export const SMOG_CAP = 4200;        // never more than this in the sky at once

// --- when it breaks -----------------------------------------------------------
// A sky over the line does not come down on the frame it crosses it. The yard
// takes a *sample* of what is overhead every few seconds and rolls, so you
// cannot stand under a full band counting frames to the drop: a filthy sky
// means it is *likely* to rain, and how likely is how filthy.
export const SMOG_SAMPLE = 5;        // seconds between one look at the sky and the next
// How hard the rain's odds bend against how full the sky is: the chance is the
// share of the cap raised to this, so a lightly dirty yard is very nearly
// never rained on and a brimming one rains the moment RAIN_GAP lets it.
// Against a five-second sample and a minute's dry: a quarter-full sky is a
// shower about once an hour and a half, a half-full one about one in three
// minutes, three-quarters about one in ninety seconds.
//
// **This is a balance lever, not a look.** Rain takes down the whole sky it
// breaks on, so a bend that is too gentle has the weather doing the house's
// job for it, and the house is meant to be the thing you invest in.
export let SMOG_RAIN_BEND = 5;
// A minute of dry between one shower and the next. A shower takes down the sky
// it broke on and nothing else, so over a busy yard the band is back over the
// line when it stops, and two rains with a frame between them is one rain that
// stuttered.
export const RAIN_GAP = 60;          // seconds of dry before another may break
// Haze each mote in the sky stands for -- really how *many* specks a dirty sky
// is made of, which is what decides whether you can see one. The band is spread
// evenly over the whole world and the window shows an eighth of it. Everything
// that counts motes rather than haze scales with this, marked "per mote"
// below, so the balance does not move when it does.
export const SMOG_PER_MOTE = 0.16;
// How long a speck takes to fade once a mouth has taken it. Under half a
// second a speck going out reads as a cell blinking off, the one thing nothing
// in this sky may do.
export const SMOG_GO_MS = 1400;
// A ceiling on how many can be fading at once, so a pathological rate cannot
// grow a list nobody bounded; past it a speck is dropped without its fade,
// which is why the cap must stay far above what play produces. Rain is the
// heaviest producer, some six hundred and fifty a second against a fade of
// well over one.
export const GOING_CAP = 2400;
// How quickly a fading speck's own drift eases off, and how hard the wind
// leans one that a mouth has just taken. Both small: it is finishing a
// movement, not starting one.
export const GOING_EASE = 1.1;
export const SMOG_GO_LEAN = 0.30;
export const SMOG_TOP = 2;           // cells below the top of the window the band starts
// How deep the band is, as a floor under it: the haze fills the sky from
// SMOG_TOP down to this many cells above the ground line. See DESIGN.md, "The
// sky is the band".
export const SMOG_FLOOR = 3;
// Cells below the top of the window the clouds may start at; see `band` in
// weather.js.
export const CLOUD_TOP = 6;
export const SMOG_BAND = 13;         // kept for the clouds; see CLOUD_TOP
// A settled mote's place across the sky is its slot alone, uniform over the
// whole band from the frame it arrives: the haze is a total over the yard, and
// it does not remember which machine made it.
export const SMOG_SINK = 5;          // seconds to settle from the band's underside to its height
// How far a gust lifts the band as it goes through it: the whole band rises a
// little on a wind from one side and settles again as it drops, together.
// Height only. Sideways is the drift below, which has to be a speed rather
// than an offset: an offset that grows with the wind runs *backwards* whenever
// a gust is dying, and the smoke goes left while the dust goes right.
export const SMOG_LIFT = 4;          // world pixels the band rises on a full wind
export const SMOG_GIVE = 0.15;       // how far one mote may differ from the next, either way
export const PUFF_LEAN_WIND = 26;    // world pixels a second a climbing puff is carried

// How far a speck of haze is smeared along the wind at full gust, in screen
// pixels: the sky's own reach in the sky's own units. The shape of the bend is
// shared (`gust` in wind.js); the reach is not.
export let HAZE_STREAK = 5;
export const SMOG_DRIFT = 0.06;      // and the whole lot creeps along on the wind

// How fast a puff climbs, in world pixels a frame, and how much one may differ
// from the next. This decides whether a plume reads as smoke or as sparks: a
// quick speck leaving the slow ones behind draws the eye straight up, so they
// are close together and the plume rises as a body. A mote climbs all the way
// to the height it will live at (`stepPuffs`), so this also sets how long one
// is in the air: about eight seconds for the average trip.
export const PUFF_UP = 0.40;
export const PUFF_UP_GIVE = 0.14;
export const PUFF_UP_FLOOR = 0.20;   // and the crawl it never slows below
// How long a mote takes to come up to weight in the band, or go out of it, in
// ms. Under a second an arrival reads as popping in; everything in this sky
// fades slowly enough that no single frame of the fade is noticeable.
export const PUFF_FADE = 2400;
// How long a plume is a plume. After this many seconds of climb it thins out
// where it is over PLUME_THIN, and its mote joins the band at its own height
// (`stepPuffs`); a column of smoke crossing the whole view reads as an event,
// not as exhaust. The dirt is identical either way; only the journey is cut.
// Long enough that the top of a plume is well up into the band before the
// thinning starts, or the stacks read as venting at the works rather than
// feeding the sky.
export const PLUME_LIFE = 5.5;
// The thinning dies the way it climbed, gradually; over a second reads as the
// smoke being switched off.
export const PLUME_THIN = 2.5;
// There is no cap on how many specks may be climbing at once: past a cap the
// next mote went straight into the band, which read as pollution appearing out
// of nothing in the middle of the sky.
// Grains a second across the whole yard. A brim sky is about forty seconds of
// shower, and a lighter one proportionally shorter; the muck a shower leaves
// is duration-independent (motes times RAIN_MARK), so the length only has to
// be long enough to be weather.
export let RAIN_PER_S = 650;        // per mote: a sky of more specks takes more of them a second

// --- the shape of a storm -------------------------------------------------------
// A storm is an event with a front and a tail, not a switch: it *brews* for
// STORM_BREW_S, then a drizzle at a fifth of the rate, a smoothstep up to the
// full pour, and a taper at the end (`pour` in smog/rain.js). No darkening
// wash through the brew: the sky itself is the warning, and a pane over it
// read as a screen effect.
export let STORM_BREW_S = 20;       // seconds of brewing before the first drop
export let RAIN_DRIZZLE_S = 6;      // seconds of drizzle before the pour comes on
export let RAIN_RISE_S = 6;         // and how long the smoothstep up to full takes
export const RAIN_TAPER_AT = 0.25;  // taper once this share of the marked sky is left
export const RAIN_TAPER_FLOOR = 0.1; // and never below this share of the rate
// How a drop moves, in pixels a frame. One speed: rain is at terminal velocity
// long before it is anywhere you can see it, and a drop gaining speed down the
// window reads as something dropped. The give is how much one drop may differ
// from the next; wide, because the speed is also the depth (RAIN_DASH_MIN).
export let RAIN_FALL = 6.5;
export let RAIN_FALL_GIVE = 4;
// How far the wind carries a drop sideways at a full gust. The whole sheet
// leans together, and the dash is drawn along the way its drop is going.
export let RAIN_LEAN = 2.2;
// How long a dash is, in cells, from the slowest drop to the fastest. The fast
// ones are the near ones, so the shower gets a depth: short flecks far off,
// long strokes close in.
export const RAIN_DASH_MIN = 2;
export const RAIN_DASH_MAX = 5;
// Lightning. Weather only: a strike costs the yard nothing and touches no
// body. The odds a second scale with the square of the storm envelope, so a
// drizzle almost never flashes and the full pour does about every
// BOLT_EVERY_S seconds.
export let BOLT_EVERY_S = 9;        // mean seconds between strikes at full pour
export const BOLT_LIFE_S = 0.6;     // how long the bolt hangs in the sky, fading out
export const BOLT_FLASH_S = 0.12;   // and for how long the pane takes to fade off it
export let BOLT_FLASH_INK = 0.2;    // and how dark it starts: the pane fades from this to nothing
// The bolt's shape, in cells: it comes down BOLT_STEP cells a segment and jogs
// up to BOLT_JOG cells sideways each one, with a shorter fork off it somewhere
// between the two shares of its length, running BOLT_FORK_LEN segments.
export const BOLT_STEP = 2;
export const BOLT_JOG = 2;
export const BOLT_KINK = 0.35;      // the chance a segment changes its jog, else it keeps going
// What comes off a strike: embers, along the whole length of the bolt -- one
// off each cell with EMBER_PER_CELL odds -- thrown out sideways a little,
// rising at EMBER_RISE pixels a frame and slowing as they go, carried by the
// wind like the rain, and fading out over EMBER_LIFE_S.
export const EMBER_PER_CELL = 0.3;
export const EMBER_RISE = 0.9;
export const EMBER_SCATTER = 0.7;   // sideways throw either way, pixels a frame
export const EMBER_EASE = 1.4;      // how fast the throw and the rise die off, a share a second
export const EMBER_LIFE_S = 1.4;
export const EMBER_LEAN = 0.6;      // share of the rain's lean the wind gives an ember
export const BOLT_FORK_AT = [0.3, 0.6];
export const BOLT_FORK_LEN = 4;
// The share of what lands that leaves a mark. The whole sky falls either way;
// this is how much of it is filth rather than water. A full sky lays a few
// thousand cells and the crew are on shovels for several minutes after one:
// the bill for a dirty sky.
export const RAIN_MARK = 0.1667;
export const MUCK_MAX = 6;           // and never stacks deeper than this in a column

// How far a dropped unit of mess will look for a lower spot, and how much
// taller than its neighbor a column of it may stand before it topples: the
// angle a heap of it rests at, the same as the sand, since it is drawn out of
// the same cells.
export const MESS_SLUMP = 3;
export const MESS_ANGLE = 2;
export const MUCK_SWEEP = 3.5;       // grains a second a spare pair of hands shifts
// It comes off a cell at a time, on a swing, at that rate: walk up, swing, a
// cell comes off, the way the rock has always read. A rate poured in every
// frame is a progress bar wearing a hat.
export const MUCK_SWING = Math.round(1000 / MUCK_SWEEP);

// How a swing settles. Whoever swings sets a body's lunge to 1 and this eases
// it back to nothing over about a fifth of a second, once a frame for
// everybody in `updateWorkers`, so a swing settles wherever the body spends
// the next frame: eased only inside the work branches, a body a stage took
// the frame off carried the last swing's lunge pinned at full.
export const LUNGE_EASE = 0.84;
// How much of a swing is left while a body is still thrown into it. A lean is
// drawn as a pose -- out above this, back on its cell below it -- rather than
// eased pixel by pixel: a body sliding back sideways a pixel a frame, three
// and a half times a second, is a body vibrating.
export const LEAN_HOLD = 0.5;

// Each climbing puff wanders sideways on its own seed, so the plume opens into
// a cone as it rises instead of standing as a vertical band. Amplitude in
// world pixels a second.
export let PUFF_WANDER = 14;

// The dev panel's rows for the knobs above, beside the bindings because an
// imported `let` is read-only; config.js gathers every file's rows into TUNABLE.
export const SKY_KNOBS = [
  { key: 'SMOG_PER_DUST', label: 'soot a grain', min: 0, max: 1.5, step: 0.02,
    get: () => SMOG_PER_DUST, set: v => { SMOG_PER_DUST = v; } },
  { key: 'SMOG_RAIN_BEND', label: 'rain bend', min: 1, max: 8, step: 0.1,
    get: () => SMOG_RAIN_BEND, set: v => { SMOG_RAIN_BEND = v; } },
  { key: 'RAIN_PER_S', label: 'rain rate', min: 100, max: 3000, step: 25,
    get: () => RAIN_PER_S, set: v => { RAIN_PER_S = v; } },
  { key: 'STORM_BREW_S', label: 'storm brew', min: 0, max: 60, step: 1,
    get: () => STORM_BREW_S, set: v => { STORM_BREW_S = v; } },
  { key: 'RAIN_DRIZZLE_S', label: 'drizzle', min: 0, max: 20, step: 0.5,
    get: () => RAIN_DRIZZLE_S, set: v => { RAIN_DRIZZLE_S = v; } },
  { key: 'RAIN_RISE_S', label: 'rain rise', min: 0.5, max: 20, step: 0.5,
    get: () => RAIN_RISE_S, set: v => { RAIN_RISE_S = v; } },
  { key: 'RAIN_FALL', label: 'rain speed', min: 1, max: 12, step: 0.25,
    get: () => RAIN_FALL, set: v => { RAIN_FALL = v; } },
  { key: 'RAIN_FALL_GIVE', label: 'rain spread', min: 0, max: 8, step: 0.25,
    get: () => RAIN_FALL_GIVE, set: v => { RAIN_FALL_GIVE = v; } },
  { key: 'RAIN_LEAN', label: 'rain lean', min: 0, max: 6, step: 0.1,
    get: () => RAIN_LEAN, set: v => { RAIN_LEAN = v; } },
  { key: 'BOLT_EVERY_S', label: 'lightning every', min: 1, max: 60, step: 1,
    get: () => BOLT_EVERY_S, set: v => { BOLT_EVERY_S = v; } },
  { key: 'BOLT_FLASH_INK', label: 'flash ink', min: 0, max: 1, step: 0.05,
    get: () => BOLT_FLASH_INK, set: v => { BOLT_FLASH_INK = v; } },
  { key: 'PUFF_WANDER', label: 'puff wander', min: 0, max: 40, step: 1,
    get: () => PUFF_WANDER, set: v => { PUFF_WANDER = v; } }
];
