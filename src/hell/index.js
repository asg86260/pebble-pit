// Act 4, hell: its frame, its save, its click and its seams for the story
// (DESIGN.md, "Acts 3 and 4: the afterlife and hell", act 4).
//
// Everything keeps running (call 1, the owner's, 2026-10-17): hell is stepped
// every frame with its act on, on screen or not, and every other place goes on
// being stepped while the camera is down here. Act 4 is the mine and the
// forge (call 4's loop): ore to bars to a better tool, a tier at a time, each
// tool breaking the barrier its tier yields.
//
// `S.hell` is null until the act begins -- the first descent, once that is
// built -- so a yard that never reaches it saves `hell: null`.

import { S } from '../state.js';
import { HELL_TIERS } from '../config.js';
import { hellOn } from '../acts.js';
import { stepChambers } from './chambers.js';
import { stepOre, strikeAt } from './ore.js';
import { stepForge } from './forge.js';
import { stepBarriers, strikeWall, hellWallDue, tellWall, wallsFallen } from './barriers.js';
import { stepBodies } from './bodies.js';
import { stepCage, cageBroken } from './cage.js';
import { chamberFocusX, faceX, faceTop, chamberFloor, furnaceBox, anvilX, storeX, roadX, barrierBox } from './place.js';
import { P } from '../config.js';
import { settleHeld } from '../placebodies.js';
import { readOver } from '../placesave.js';

// The act's facts, every one a body or a count a body moves (bodies.js), so
// all of it is saved and a reload stands the act back as it was:
//   ore       lumps lying loose at each face, by ore
//   bars      bars stocked at the anvil, by ore (the boards' bar coins)
//   brimstone banked at the landing's store (the boards' lead coin)
//   tool      the tool tier the forge has made, 0 the yard's pick
//   faces     a chamber each: the tool carried there, blows toward the next
//             lump, a flare's slag, lumps cut
//   furnaces  a chamber each: fuel, warmth 0..1, lit, the hopper and the tray
//             by ore, the bar under way, the burn's clock
//   seams     a chamber each: how many cells the face has cut back
//   vents     a chamber each: crust lying round it, its clock
//   chamber   the deepest open, 0 the landing
//   blows     a barrier each, the blows taken (its drawn cells derive)
//   walls     a barrier each: the tool carried there, slag, spoil lying at
//             its foot, spoil carried to the heap
//   gang      the wall gang's size, the gang card's choice
//   flights   the stair's flights (not built: the stair is a ladder for now)
//   muster    how many ghosts have come down
//   rungs     each hell ladder's rung, by key (upgrades/rows-hell.js)
//   bodies    every ghost: where, its way, its job and errand, what it carries
//   pieces    a barrier's cells in the air
//   forge     the tool on the anvil and its strokes, or null
//   water     black water at the anvil; road, barrels at the road's foot
//   flares    a chamber each: the next burst, the end of the burning one
//   clock     hell's own seconds
//   told      the barriers whose fall the story has taken
//   mined, smelted   lumps and bars made, by ore; rings, flareCount: tallies
const byOre = () => Object.fromEntries(HELL_TIERS.map(t => [t.ore, 0]));
const each = make => HELL_TIERS.map(make);
export const blankHell = () => ({
  ore: byOre(),
  bars: byOre(),
  brimstone: 0,
  tool: 0,
  faces: each(() => ({ tool: 0, hits: 0, crust: 0, cut: 0 })),
  furnaces: each(() => ({ fuel: 0, warm: 0, lit: false, hopper: byOre(), tray: byOre(), prog: 0, burn: 0 })),
  seams: each(() => 0),
  vents: each(() => ({ crust: 0, t: 0 })),
  chamber: 0,
  blows: each(() => 0),
  walls: each(() => ({ tool: 0, crust: 0, loose: 0, heap: 0 })),
  gang: 0,
  flights: 0,
  muster: 0,
  musterT: 0,
  rungs: {},
  bodies: [],
  nextId: 1,
  pieces: [],
  forge: null,
  water: 0,
  road: 0,
  flares: each(() => ({ next: 0, until: 0 })),
  clock: 0,
  told: [],
  mined: byOre(),
  smelted: byOre(),
  rings: 0,
  flareCount: 0
});

// The act begun: its facts stood up empty, once. The first descent will call
// this; until it is built only the dev travel does (`__goPlace`).
export function beginHell() {
  if (!S.hell) S.hell = blankHell();
  return S.hell;
}

// How many frames hell has been stepped this session (test/acts-scaffold.test.mjs).
let frames = 0;
export const hellFrames = () => frames;

// One frame of hell, called every frame with the act on, on screen or not:
// the clock and the flares, the vents, the ghosts, the furnaces, the falling
// pieces, the cage room.
export function stepHell(c) {
  if (!hellOn()) return;
  frames++;
  if (!S.hell) return;
  stepChambers(c);
  stepOre(c);
  stepBodies(c);
  stepForge(c);
  stepBarriers(c);
  stepCage(c);
}

// --- the hand (the boards are hell/stations.js's rows) ------------------------------------
// The last click's swing, for the drawing: where, when on hell's clock, and
// what the blow did. Not saved: a held pose a quarter of a second long.
let lastSwing = null;
export const hellSwing = () => lastSwing;

// A click in hell, in world pixels: a blow at a face or a barrier with the
// best tool made. True if it struck something.
export function clickHell(wx, wy) {
  if (!hellOn() || !S.hell) return false;
  const hit = strikeAt(wx, wy) || strikeWall(wx, wy);
  if (!hit) return false;
  lastSwing = { x: wx, y: wy, at: S.hell.clock, did: hit.did };
  return true;
}

// --- the story's seams (Track C wires the beats) -------------------------------
// Where the camera should hold: the deepest chamber reached, its next barrier
// toward the right edge (world x of the view's middle). The camera's own
// opening reads the same (place.js, `hellOpenX`); a glide on a fall is
// Track C's, from the old chamber's focus to this.
export const hellCamTarget = () => chamberFocusX(S.hell ? Math.min(S.hell.chamber, HELL_TIERS.length - 1) : 0);
export { hellWallDue, tellWall, wallsFallen, cageBroken };

// The save (persist.js, `SAVERS`): written whole, null before the act
// begins, read over a blank (placesave.js) so a field added later comes
// back empty.
export const SAVE = {
  fields: ['hell'],
  write(out) { out.hell = S.hell ? JSON.parse(JSON.stringify(S.hell)) : null; },
  read(s) {
    const h = s.hell;
    if (!h || typeof h !== 'object') { S.hell = null; return; }
    S.hell = readOver(blankHell(), h);
    settleHeld(S.hell.bodies);
  },
  blank() { S.hell = null; }
};
