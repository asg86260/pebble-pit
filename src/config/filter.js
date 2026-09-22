import { P } from './yard.js';

// The shed's walls stand this many cells in from either side of its footprint;
// the eaves reach out over them. The dial hangs off the far wall, and the
// balloons' posts are measured off the dial.
export const FILTER_WALL = 3;
// The vent on the cupola: courses down from the top of the footprint.
export const FILTER_VENT = 1;

// The bare fan's pull, set against SMOG_PER_DUST: a balloon takes specks out
// of a sky that is filled at the same pace, and what it is worth against the
// yard is the only number here that decides anything. The fan ladder's rungs
// (config/rungs.js) are what a balloon pulls; this is the measure the drawn-in
// stream is sized against.
export let FILTER_PULL = 29.25;       // motes a second, per balloon -- per mote
// What a balloon lets fall for what it catches, before the recycler is fitted:
// the crew shovel it like any other mess.
export const FILTER_PER_MUCK = 135;  // motes caught per load let fall -- per mote
export const FILTER_MUCK = 1;        // and how much a load is, in cells deep
// The fan's ladder: a machine dirties the sky far harder than hands and never
// stops for a cigarette, so balloons that could only pull at the rate they
// were built with stop being an answer the moment the yard is worth having
// them. What a fan pulls at each rung, and what each rung costs, is a list in
// config/rungs.js: if the sky comes under control too early on a real yard,
// that is the dial.
export const RECYCLE_SHARDS = 120;    // and what turns catching into keeping
export const RECYCLE_TONE = 4;      // the shade it comes back around: ordinary dust, give or take one
export const RECYCLE_PER = 42;      // motes caught per grain of dust it gives back -- per mote

export const TO_FILTER = -2586;       // past the lab, at the quiet end of the walk
// Nineteen cells across and twenty down: the shed and its eaves, and the
// cupola on its ridge. Odd across, so the ridge, the cupola and the door have
// a middle column to stand on. It grows upward (filter.y is the ground less
// the height).
export const FILTER_W = P * 19;
export const FILTER_H = P * 20;
// The dial on the far wall, reading the sky from clean to brim. A needle two
// cells long can point sixteen ways; three quarters of a turn of those is
// twelve, and the needle lands on one of them.
export const DIAL_STEPS = 12;
// Its size. Here rather than in the drawing because the balloons' mast is
// stood clear of the dial, and the two have to agree on where the dial ends.
export const DIAL_CELLS = 7;          // across the gauge's face and ring
// The ring in three bands along its sweep, clean to brim: how bad the air is,
// read at a glance before the needle is.
export const DIAL_ZONES = ['#3aa655', '#e2c12b', '#d23b2e'];
export const DIAL_ZONE_NAMES = ['clean', 'dirty', 'filthy'];   // what its hover calls each band
export const DIAL_STUB = 1;           // and the stub it hangs on, out of the wall
export const DIAL_EASE = 1.5;         // share of the way to the reading it closes a second
export const DIAL_GIVE = 0.6;         // steps past its own the reading must be before it moves

// The dev panel's row for the pull: the house's whole ladder scales off it,
// so it is the one dial that moves the sky bargain.
export const FILTER_KNOBS = [
  { key: 'FILTER_PULL', label: 'house pull', min: 2, max: 60, step: 0.25,
    get: () => FILTER_PULL, set: v => { FILTER_PULL = v; } }
];
