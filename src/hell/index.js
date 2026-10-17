// Act 4, hell: its frame and its save (DESIGN.md, "Acts 3 and 4: the
// afterlife and hell (design, not built)", act 4). The scaffold: the act's
// state, the step the sim calls every frame (game.js, `STEPS`) and the saver;
// every part it steps is a stub.
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
import { stepOre } from './ore.js';
import { stepForge } from './forge.js';
import { stepBarriers } from './barriers.js';
import { stepCage } from './cage.js';

// The act's facts, as the spec's save shape names them, each empty: ore and
// bars held by tier; brimstone; the tool tier made (0 the yard's pick); the
// tier each face holds, each furnace's fuel and lit state, each seam's depth;
// the chamber reached; each barrier's blows taken (its drawn cells derive
// from the count); the wall gang; the stair's flights; the muster's members;
// the rungs. Lumps in hands, spoil in flight and a wall's fall mid-beat are
// this session's and live on the modules.
const byOre = () => Object.fromEntries(HELL_TIERS.map(t => [t.ore, 0]));
export const blankHell = () => ({
  ore: byOre(),
  bars: byOre(),
  brimstone: 0,
  tool: 0,
  faces: [],
  furnaces: [],
  seams: [],
  chamber: 0,
  blows: HELL_TIERS.map(() => 0),
  gang: 0,
  flights: 0,
  muster: 0,
  rungs: {}
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
// the run and its road, the faces, the furnaces and the anvil, the barriers,
// the cage room.
export function stepHell(c) {
  if (!hellOn()) return;
  frames++;
  if (!S.hell) return;
  stepChambers(c);
  stepOre(c);
  stepForge(c);
  stepBarriers(c);
  stepCage(c);
}

// The save (persist.js, `SAVERS`): written whole, null before the act
// begins, read over a blank so a field added later comes back empty.
export const SAVE = {
  fields: ['hell'],
  write(out) { out.hell = S.hell ? JSON.parse(JSON.stringify(S.hell)) : null; },
  read(s) {
    const h = s.hell;
    if (!h || typeof h !== 'object') { S.hell = null; return; }
    const b = blankHell();
    S.hell = { ...b, ...h, ore: { ...b.ore, ...(h.ore || {}) }, bars: { ...b.bars, ...(h.bars || {}) },
               blows: b.blows.map((n, i) => (Array.isArray(h.blows) && +h.blows[i]) || n) };
  },
  blank() { S.hell = null; }
};
