// What exists, by kind, wherever it is (DESIGN.md, "One resource system for
// every act", sections 5 and 8). A unit is in exactly one of the places
// below at a time -- a cell of a ground, the hand, the air, a body's arms, a
// machine -- so moving it changes no total, and the total of a kind changes
// only where a door says so (src/flow.js). verify.js rule 23 asks the two
// halves of that every frame; this file is the first half, a census.
//
// Act 3 and the deep today. The yard joins when its own sources and sinks (rock
// spoil, the rind, the farm, the meteor, finds) are named doors, or the rule
// would be red across the node tier on the first frame.

import { S, afterGround as G, deepBed } from './state.js';
import { kindOf } from './grid.js';
import { isDeepType } from './jobs.js';
import { sawyerHolds } from './after/mill.js';

// The kinds the census counts, act 3's.
export const CENSUS_KINDS = ['log', 'plank', 'sign', 'load', 'scale'];

// How many units of each kind exist now in act 3: lying on its ground, in the
// hand, in the air, in its bodies' arms, and inside the saw mill (the log on
// its bed or in the sawyer's arms, the blocks on their way out of it).
export function census() {
  const n = Object.fromEntries(CENSUS_KINDS.map(k => [k, 0]));
  deepCensus(n);
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
  }
  return n;
}

// The deep's scales: lying on its bed, falling through its water, tossed on
// the gatherers' arc to the hopper, on the cursor, and in the gatherers' arms.
// Money is not counted: the crusher's purse (`S.scales`) and the flecks that
// picture a payment (`S.lifting`) or a refund (`back`) are accounts, not goods.
function deepCensus(n) {
  if (deepBed.grid) n.scale += deepBed.n;
  for (const ch of S.chips) if (ch.place === 'deep') n.scale++;
  for (const g of S.sinking) if (!g.back) n.scale++;
  for (const m of S.motes) if (m.place === 'deep') n.scale++;
  for (const w of S.workers) if (isDeepType(w.type) && Array.isArray(w.load)) n.scale += w.load.length;
}
