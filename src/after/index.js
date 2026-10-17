// Act 3, the afterlife: its frame and its save (DESIGN.md, "Acts 3 and 4:
// the afterlife and hell (design, not built)", act 3). The scaffold: the act's
// state, the step the sim calls every frame (game.js, `STEPS`) and the saver;
// every part it steps is a stub.
//
// Everything keeps running (call 1, the owner's, 2026-10-17): the afterlife is
// stepped every frame whether or not the camera is up there, as the deep is,
// and the yard and the deep go on being stepped while the camera is here. The
// sim never reads the view.
//
// `S.after` is null until the act begins -- the house's fall, once that is
// built -- so a yard that never reaches it saves `after: null` and nothing
// else (DESIGN.md, "Rules and consequences to check", the save shape).

import { S } from '../state.js';
import { AFTER_STOCK } from '../config.js';
import { afterlifeOn } from '../acts.js';
import { stepFaith } from './faith.js';
import { stepGrove } from './grove.js';
import { stepMill } from './mill.js';
import { stepPress } from './press.js';
import { stepUnion } from './union.js';
import { stepStrike } from './strike.js';

// The act's facts, as the spec's save shape names them, each empty: faith
// and ink; the chain's stock; each soul's inked rim pieces, a character a
// soul (union.js); the volunteers by job; the grove's plots and each tree's
// growth; the signs planted and posters pasted with their wear; the mill's
// fence (null while call 13 is open); the camp's stations built and their
// rungs; the gate reached. Souls in flight, loads in hands and the crowd's
// draw are this session's and live on the modules, never here.
export const blankAfter = () => ({
  faith: 0,
  ink: 0,
  stock: Object.fromEntries(AFTER_STOCK.map(k => [k, 0])),
  rims: '',
  volunteers: {},
  plots: [],
  signs: [],
  posters: [],
  fence: null,
  built: [],
  rungs: {},
  gate: 0
});

// The act begun: its facts stood up empty, once. The house's fall will call
// this; until it is built only the dev travel does (`__goPlace`).
export function beginAfter() {
  if (!S.after) S.after = blankAfter();
  return S.after;
}

// How many frames the afterlife has been stepped this session: the check
// that the place keeps running off screen reads it (test/acts-scaffold.test.mjs).
let frames = 0;
export const afterFrames = () => frames;

// One frame of the afterlife, called every frame with the act on, on screen
// or not. Its parts in the order the place hands its work along: the sky's
// clouds and faith, the grove, the mills, the workshop and the press, the
// crowd, the gates.
export function stepAfter(c) {
  if (!afterlifeOn()) return;
  frames++;
  if (!S.after) return;
  stepFaith(c);
  stepGrove(c);
  stepMill(c);
  stepPress(c);
  stepUnion(c);
  stepStrike(c);
}

// The save (persist.js, `SAVERS`): written whole, null before the act
// begins, and read over a blank so a save from before a field was added
// comes back with that field empty rather than missing.
export const SAVE = {
  fields: ['after'],
  write(out) { out.after = S.after ? JSON.parse(JSON.stringify(S.after)) : null; },
  read(s) {
    const a = s.after;
    S.after = a && typeof a === 'object' ? { ...blankAfter(), ...a, stock: { ...blankAfter().stock, ...(a.stock || {}) } } : null;
  },
  blank() { S.after = null; }
};
