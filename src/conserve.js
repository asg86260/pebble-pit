// What exists, by kind, wherever it is (DESIGN.md, "One resource system for
// every act", sections 5 and 8). A unit is in exactly one of the places
// below at a time -- a cell of a ground, the hand, the air, a body's arms, a
// machine -- so moving it changes no total, and the total of a kind changes
// only where a door says so (src/flow.js). verify.js rule 23 asks the two
// halves of that every frame; this file is the first half, a census.
//
// Act 3 today. The yard joins when its own sources and sinks (rock spoil, the
// rind, the farm, the meteor, finds) are named doors, or the rule would be
// red across the node tier on the first frame.

import { S, afterGround as G } from './state.js';
import { kindOf } from './grid.js';
import { sawdustCount, sawyerHolds } from './after/mill.js';

// The kinds the census counts, act 3's.
export const CENSUS_KINDS = ['log', 'plank', 'sign', 'sawdust', 'load'];

// How many units of each kind exist now in act 3: lying on its ground, in the
// hand, in the air, in its bodies' arms, and inside the saw mill (the log on
// its bed or in the sawyer's arms, the blocks on their way out of it, the
// grains falling to and lying on the heap).
export function census() {
  const n = Object.fromEntries(CENSUS_KINDS.map(k => [k, 0]));
  const a = S.after;
  if (!a) return n;
  if (G.grid && G.blockN && G.blockGrid === G.grid) for (const ai of G.blockSet) { const k = kindOf(G.grid[ai]); if (k) n[k.key]++; }
  for (const ch of S.chips) if (ch.kind && ch.kind in n) n[ch.kind]++;
  for (const m of S.motes) if (m.kind && m.kind in n) n[m.kind]++;
  for (const w of a.bodies) if (Array.isArray(w.load)) for (const v of w.load) { const k = kindOf(v); if (k && k.key in n) n[k.key]++; }
  const saw = a.saw;
  if (saw) {
    if (saw.bed) n.log++;
    if (sawyerHolds()) n.log++;
    n.plank += saw.out.length;
    n.sawdust += saw.dust.length;
  }
  n.sawdust += sawdustCount();
  return n;
}
