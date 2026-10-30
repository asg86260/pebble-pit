// Where a unit may be made and where it may be unmade (DESIGN.md, "One
// resource system for every act", sections 5 and 7). Every unit lives in one
// place at a time -- a cell of a ground, the hand, the air, a body's arms, a
// machine -- and moving it between those changes no count. Only a named door
// makes one or unmakes one: a tree felled, a cut at the saw, a sign joined, a
// sign planted, a band laid, a scale crushed. The
// door says so here, with the kind, how many and why; verify.js (rule 23)
// reads the units that exist against the net of these every frame, so a unit
// written around the doors is the frame it goes red.
//
// Kept for the session only: a save has no flows, only the units it holds,
// and a read starts the books over (verify.js sees the world replaced).

import { held } from './reset.js';

let net = {};      // held: each kind's made less unmade since the page began, the rule's other half
let by = {};       // held: the same by door, `kind:why`, for a failure to name
held('flow', () => { net = {}; by = {}; });

// `n` units of `kind` made at the door `why`.
export function source(kind, n = 1, why = 'source') {
  if (!n) return;
  net[kind] = (net[kind] || 0) + n;
  const k = `${kind}:${why}`;
  by[k] = (by[k] || 0) + n;
}
// `n` units of `kind` unmade at the door `why`.
export const sink = (kind, n = 1, why = 'sink') => source(kind, -n, why);
export const flowNet = () => net;
export const flowBy = () => by;
