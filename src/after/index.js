// Act 3, the afterlife: its frame and its save (DESIGN.md, "Acts 3 and 4:
// the afterlife and hell (design, not built)", act 3). The act's state, the
// step the sim calls every frame (game.js, `STEPS`), the click, and the saver.
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
import { AFTER_STOCK, AFTER_FENCE0, AFTER_START_BUILT } from '../config.js';
import { afterlifeOn } from '../acts.js';
import { stepRebel, clickPlace } from './rebel.js';
import { stepGrove, blankPlots } from './grove.js';
import { stepMill } from './mill.js';
import { stepPress } from './press.js';
import { stepUnion, seedCrowd, syncRims } from './union.js';
import { stepStrike } from './strike.js';
import { stepBodies } from './bodies.js';
import { secs } from './util.js';

// The act's facts, as the spec's save shape names them and the owner's
// settled calls (2026-10-18) reshaped them: rebel, the act's coin; the
// chain's stock; each soul's inked rim pieces, a character a soul
// (union.js); the members waiting in the camp (`camp`, a count: each stands
// on its spot) and the posts bought at each station by job (`posts`); the
// grove's plots and each tree's growth; the signs planted and posters
// pasted; the mill's fence; the camp's stations built, and how many times
// each named upgrade is bought (`ups`); the gate reached. When the last post
// of each job and each upgrade was bought (`postAt`, `upAt`), so what it puts
// on screen fades in. And what the loop
// added to stand it up: the act's clock (`t`) and its chance (`seed`), the
// axe bought and in hand, the pair's last line (`shout`), the clouds and the
// motes coming down, the bodies -- members walking out and members at their
// posts -- the wardens, the throne's speech, when each station went up, and
// the last id handed out.
export const blankAfter = () => ({
  rebel: 0,
  stock: Object.fromEntries(AFTER_STOCK.map(k => [k, 0])),
  rims: '',
  camp: 0,
  posts: {},
  postAt: {},
  plots: [],
  signs: [],
  posters: [],
  fence: AFTER_FENCE0,
  built: [],
  ups: {},
  upAt: {},
  gate: 0,
  t: 0,
  seed: 1,
  axeBought: false,
  axe: false,
  shout: null,
  clouds: [],
  motes: [],
  bodies: [],
  wardens: [],
  speech: null,
  builtAt: {},
  gateAt: null,
  brimAt: null,
  ids: 0
});

// The act begun: its facts stood up, once -- the crowd in its files, the
// grove's one grown tree, the pedestal and the hall on the camp's patch. The
// house's fall calls this (actbeats.js), and the dev travel (`__goPlace`).
export function beginAfter() {
  if (S.after) return S.after;
  S.after = blankAfter();
  S.after.seed = (S.tick * 2654435761) | 0 || 1;
  S.after.plots = blankPlots();
  S.after.built = [...AFTER_START_BUILT];
  seedCrowd();
  return S.after;
}

// How many frames the afterlife has been stepped this session: the check
// that the place keeps running off screen reads it (test/acts-scaffold.test.mjs).
let frames = 0;
export const afterFrames = () => frames;

// One frame of the afterlife, called every frame with the act on, on screen
// or not. Its parts in the order the place hands its work along: the sky and
// the rebel coming down, the grove, the members walking and at their posts,
// the mills, the workshop and the press, the crowd, the gates.
export function stepAfter(c) {
  if (!afterlifeOn()) return;
  frames++;
  if (!S.after) return;
  S.after.t += secs(c);
  stepRebel(c);
  stepGrove(c);
  stepBodies(c);
  stepMill(c);
  stepPress(c);
  stepUnion(c);
  stepStrike(c);
}

// A click on the place, in world pixels: true if it was the afterlife's (a
// line of the pair's speech, a tree chopped with the axe, a stump dug at).
// input.js calls it with the camera up here.
export function clickAfter(wx, wy) {
  if (!afterlifeOn() || !S.after) return false;
  return clickPlace(wx, wy);
}

// The save (persist.js, `SAVERS`): written whole, null before the act
// begins, and read over a blank so a save from before a field was added
// comes back with that field empty rather than missing. The crowd's rims are
// brought up to the field first (union.js keeps them as bytes between).
export const SAVE = {
  fields: ['after'],
  write(out) { if (S.after) syncRims(); out.after = S.after ? JSON.parse(JSON.stringify(S.after)) : null; },
  read(s) {
    const a = s.after;
    S.after = a && typeof a === 'object' ? { ...blankAfter(), ...a, stock: { ...blankAfter().stock, ...(a.stock || {}) } } : null;
  },
  blank() { S.after = null; }
};
