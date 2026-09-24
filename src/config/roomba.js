import { P } from './yard.js';
import { MUCK_TONE, MUCK_SKIN } from './weather.js';

// --- the roombas -----------------------------------------------------------------
// The janitors' closet's machine: low discs that drive out along the yard's
// floor to every patch of mess on open ground, take it into a bin, and come
// home to a dock beside the closet, where the one janitor left tips the bin
// into the closet's door (DESIGN.md, "The janitors' roomba").
//
// Bought as a count, up to three, like the forklifts but with an end: the
// owner's "buy up to 3 roombas".
export const ROOMBA_MAX = 3;
// What each one costs, a line a roomba: a written table like every ladder.
// Janitors make no coin, so it is priced like the belt, in all three grounds,
// and the first is the tiller's red because it does the least of any
// machine. Each after it is the one before times the hats' rate (1.6), the
// forklifts' rise, rounded to the dust-a-spark line.
export const ROOMBA_BILLS = [
  [['spark', 240], ['dust', 4800],  ['shard', 300], ['spore', 300]],
  [['spark', 380], ['dust', 7600],  ['shard', 480], ['spore', 480]],
  [['spark', 620], ['dust', 12400], ['shard', 780], ['spore', 780]]
];

// Its shape, in cells: a dome three high on a base six wide, the bin's gauge
// four cells along the band between them (render/roomba.js).
export const ROOMBA_W = 6;
export const ROOMBA_H = 3;
export const ROOMBA_GAUGE = 4;
// How fast it drives, as a share of a body's walk (`commutePace`): the
// "super quick" is the drive, since the intake is a machine's rate already.
export let ROOMBA_PACE = 2.5;
// What a bin holds before it goes home, in grains of mess. A patch a body
// leaves is two (`LOO_MUCK`); a rain lays a cell or two a column.
export let ROOMBA_BIN = 24;
// How long the tender takes to lift one grain out of a docked bin and throw
// it in at the closet's door, ms.
export let ROOMBA_TIP_MS = 90;
// The most intake a roomba banks between frames, in grains: a machine quicker
// than a frame takes several in one, but one that sat a while does not come
// back and take a trench.
export const ROOMBA_OWED = 4;
// The mess's own tones, for a grain in the air and the cells of the bin's
// gauge: the layer's body and its lid (render/smog.js), and one between.
export const ROOMBA_TONES = [MUCK_TONE, MUCK_SKIN, '#68503a'];
// And how long a tipped grain is in the air on its way to the door, ms.
export const ROOMBA_TIP_FLY_MS = 380;
// A grain taken in is seen going: it flies from the patch into the mouth,
// this long, in the mess's own tones.
export const ROOMBA_SUCK_FLY_MS = 160;

// The dock: a charge post and a slot a roomba, in a row along the ground on
// the closet's rock side, clear of the broom (which stands two cells off the
// wall and three wide, render/tower.js). Where the first post stands, in cells
// past the closet's right-hand wall, and how far one slot is from the next: a
// post, the roomba, and a cell of air.
export const ROOMBA_DOCK_OFF = 6;
export const ROOMBA_PITCH = ROOMBA_W + 2;
// The ground the dock keeps, the closet's `right` in sites.js: the posts and
// slots for every roomba the closet can hold, reserved from the start so
// buying one never moves a building.
export const ROOMBA_DOCK_W = P * (ROOMBA_DOCK_OFF + ROOMBA_MAX * ROOMBA_PITCH - 1);

export const ROOMBA_KNOBS = [
  { key: 'ROOMBA_PACE', label: 'a roomba drives, x a walk', min: 0.5, max: 8, step: 0.1,
    get: () => ROOMBA_PACE, set: v => { ROOMBA_PACE = v; } },
  { key: 'ROOMBA_BIN', label: "a roomba's bin holds", min: 2, max: 120, step: 1,
    get: () => ROOMBA_BIN, set: v => { ROOMBA_BIN = v; } },
  { key: 'ROOMBA_TIP_MS', label: 'ms a grain tipped', min: 10, max: 600, step: 10,
    get: () => ROOMBA_TIP_MS, set: v => { ROOMBA_TIP_MS = v; } }
];
