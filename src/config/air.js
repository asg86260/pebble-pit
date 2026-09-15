import { P } from './yard.js';

// --- the air ----------------------------------------------------------------
// Nothing stands in the background of this game, so the dust hanging in the
// air is the only thing the view has to move against.
//
// Three bands at different distances. One number sets everything about a band
// at once, because that is what distance does: far ones are pale, small, slow
// and barely take the camera's movement; near ones are darker, bigger and
// sweep past.
export const AIR_BANDS = [
  //  take: the share of the camera's movement the band takes, 1 being the yard itself
  { take: 0.20, size: 1, pace: 0.35, share: 0.44, front: false },
  { take: 0.46, size: 2, pace: 0.62, share: 0.36, front: false },
  // the near band is drawn *over* the world rather than behind it, which is the
  // whole of why the yard has any depth: dust passes in front of the rock
  { take: 0.90, size: 3, pace: 1.00, share: 0.20, front: true }
];
// --- the band's own movement --------------------------------------------------
// A perfectly even lattice held still reads as printed tone, and a fluid costs
// over a millisecond a frame on five thousand specks. So the band stirs in
// *lanes*: a dozen offsets worked out once a frame, each mote reading the one
// its slot lands on. A lane is a translation, so it cannot clump.
export const SWAY_LANES = 12;        // how many pieces the band drifts in
export const SWAY_X = 16;            // pixels either way, sideways
export const SWAY_Y = 8;             // and up and down, which is the smaller motion
// Radians a second: about fifteen seconds end to end. Slower and the band moves
// a pixel a second, which can be measured and not seen.
export const SWAY_PACE = 0.42;

// The sky's tones, one set a kind, so a dirty sky says *which part of the
// works* is dirtying it. Four of each, and a speck keeps the one it was born
// with: one flat color a kind reads as printed tone rather than as air. More
// saturated than they look like they should be, because they are laid down at
// a tenth of an ink and alpha flattens a hue toward the paper.
export const SMOG_TINTS = {
  // Browned, not grey: burnt air is brown, so a dirty sky reads as smog rather
  // than as the page dimming.
  dust:  ['#5c4224', '#6b4d28', '#503a20', '#644626'],
  shard: ['#1436b8', '#2444c4', '#0f2c9c', '#2a3fa8'],
  spore: ['#12703a', '#1c8046', '#0d6032', '#237a48'],
  // What comes off a machine's stack is soot, whatever the station digs: an
  // engine puts up the same thing wherever it stands, and it is nobody's
  // resource. A shade darker than the rock's dust, because it is dirtier.
  mach:  ['#3c2c18', '#46341c', '#332615', '#402f19']
};

// A mote is the color of whatever kicked it up, in the pale end of the hue its
// shards or spores are drawn in. One tone a band, in band order: a mote
// further back is paler, which is what makes the bands read as depth.
export const AIR_KINDS = ['dust', 'shard', 'spore'];
export const AIR_TINTS = {
  dust:  ['#dedede', '#c2c2c2', '#a6a6a6'],
  shard: ['#ccd8f4', '#a8bce9', '#8aa2dc'],
  spore: ['#cfe8d7', '#a4d2b2', '#80bf93']
};
export const AIR_FLOOR = 95;      // motes over a bare yard, before anything is lying about
export const AIR_PER_DUST = 22;   // and one more for every this much dust on the ground
export const AIR_CAP = 420;       // however much is lying about
export const AIR_RISE = 0.10;     // screen pixels a mote climbs in a frame
export const AIR_SINK = 0.06;     // and the heavier grit that goes the other way
export const AIR_GRIT = 0.16;     // the share of the air that is that grit
export const AIR_SITE = 0.35;     // share of new motes that come off an open site in view
export const AIR_SITE_UP = P * 10;  // and how high above the ground line they are born
// The whole of a mote's sideways travel is its share of the one wind
// (`wind.js`): a per-mote wobble on top reads as static, not weather. Off
// `gust()` rather than `wind()`, so a lull is nearly still and a gust plainly
// moves; a drift of twenty pixels a second is filed by the eye as a static
// field.
export let AIR_LEAN = 1.7;        // screen pixels a mote is carried in a frame, at full gust and pace 1
// How far a mote is smeared along the wind, at full gust, as a multiple of its
// own size, so the near band streaks most and the one-pixel far band stays a
// square. A speed, not a distance traveled this frame, so it is NOT scaled by
// frame length: scaled, a slow machine would draw the frame rate, not the
// weather.
export let AIR_STREAK = 1.3;
// How far a mote may differ from the mote beside it. A fifth either way is
// enough that the field does not move like a sheet of card, and not enough
// that any two ever plainly disagree.
export const AIR_GIVE = 0.18;
// Grit is the heavy half of the air, so it takes less of the wind than the
// fine stuff floating past it.
export const AIR_GRIT_LEAN = 0.65;
// A local wind made by a moving cursor, dying away behind it; a parked pointer
// does nothing. Barely there on purpose: strong enough to visibly obey the
// pointer is a toy, not air. The scatter gives each mote its own lean off the
// heading, held while it is being stirred, so a pass billows the dust open
// instead of dragging a plate of it.
export let AIR_STIR = 0.055;      // how hard a fast cursor drags a mote along
export const AIR_STIR_R = 96;     // how far the wake reaches, in screen pixels
export const AIR_STIR_CAP = 1.5;  // the fastest the draught will carry one
export const AIR_STIR_EASE = 2.2; // and how quickly it dies, share a second
export const AIR_STIR_SCATTER = 0.8; // furthest a mote leans off the heading, radians

// The same hand through the smoke, fainter again: a mote of haze weighs
// nothing and hangs a long way off, so a cursor stirs it and never sweeps it.
export const SMOKE_STIR = 0.007;   // how hard the cursor moves smoke
export const SMOKE_STIR_R = 70;    // how far it reaches, in world pixels
export const SMOKE_STIR_CAP = 3;   // and the furthest a mote is ever pushed

// A plume takes it harder than the band: the band is settled air a long way
// up, a plume is smoke an arm's length away, and at the band's figure a cursor
// through a plume did nothing at all. Still a nudge, not a gust.
export const PLUME_STIR = 0.028;
export const PLUME_STIR_R = 90;
export const PLUME_STIR_CAP = 7;
export const SMOKE_STIR_EASE = 2.4;   // and how quickly it eases back

// How far a puff drifts sideways for every pixel it climbs, so a plume leans
// and opens instead of going up as one cylinder. A share of the climb rather
// than a speed, so a puff ends about a sixth of its height off the column
// however fast it got there.
export const PLUME_LEAN = 0.16;
export const AIR_LOW = 0.6;       // share of the air that hangs low, near the ground
export const AIR_LOW_BAND = 260;  // how far above the ground line "low" reaches

// --- the wind ------------------------------------------------------------------
// One wind over the whole yard (`wind.js`), leaned on by the dust, the settled
// haze and the climbing smoke alike; each field on its own phase is static,
// not weather. A share rather than a distance: 1 is the wind the yard was
// tuned for, and every field turns it into its own pixels.
export let WIND = 1;
export const WIND_MS = 9000;      // the slower of the swings the wind is made of
// How deep the lulls are. A sum of sines never repeats but never drops either;
// a slow envelope takes it down to a third and back, so a gust arrives out of
// quiet air, which is the part recognized as weather.
export const WIND_LULL = 0.45;
// How hard the wind's middle is bent down for anything drawn being blown by it
// (`gust` in wind.js). At 1 nothing is bent and the field reads as one slow
// drift from end to end.
export let WIND_GUST_POW = 1.3;

// The dev panel's rows for the knobs above, beside the bindings because an
// imported `let` is read-only; config.js gathers every file's rows into TUNABLE.
export const AIR_KNOBS = [
  { key: 'AIR_STIR', label: 'cursor draught', min: 0, max: 2, step: 0.02,
    get: () => AIR_STIR, set: v => { AIR_STIR = v; } },
  { key: 'AIR_LEAN', label: 'dust carried', min: 0, max: 4, step: 0.05,
    get: () => AIR_LEAN, set: v => { AIR_LEAN = v; } },
  { key: 'AIR_STREAK', label: 'dust streak', min: 0, max: 4, step: 0.1,
    get: () => AIR_STREAK, set: v => { AIR_STREAK = v; } },
  { key: 'WIND_GUST_POW', label: 'gust bend', min: 1, max: 4, step: 0.1,
    get: () => WIND_GUST_POW, set: v => { WIND_GUST_POW = v; } },
  { key: 'WIND', label: 'the wind', min: 0, max: 3, step: 0.05,
    get: () => WIND, set: v => { WIND = v; } }
];
