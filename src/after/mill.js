// The saw mill (DESIGN.md, "Acts 3 and 4", act 3, "The chain: trees to
// signs"; the owner's calls of 2026-10-18 and 2026-10-26). Placeholder
// drawing.
//
// A cut through the saw turns a log into a fixed split of timber and sawdust
// (the fence is cut), a log a blade, the sawdust onto the heap on the saw
// mill's own ground. The heap stands at a brim -- the pile-full mark -- and
// the saw stops until it is tipped: a click on the heap tips a load through
// the notch in the cloud floor beside it, and a sawyer tips one there too
// once the heap has stood full a while, so the saw never stops for good. It
// is worked by the click first and then by a member at a post (work.js,
// bodies.js): the work itself is here, the same whoever does it.

import { S } from '../state.js';
import { P, AFTER_LOG_TIMBER, AFTER_LOG_SAWDUST, AFTER_TIP_LOAD, AFTER_SWEEP_WAIT_S, AFTER_SPILL_S } from '../config.js';
import { bladeLogs, heapBrim } from './levels.js';
import { secs } from './util.js';
import { heapMid, groundOf } from './place.js';

// The heap is at its brim while nobody has tipped it: the saw stops. The
// brim is the heap's `pile` on the one station table (after/stations.js), so
// the pile-full mark, its hover and its cursor are the yard's
// (render/pilemarks.js, input.js).
export const heapFull = () => !!S.after && S.after.stock.sawdust >= heapBrim();

// The row's key, and the box the shared mark is placed from: `pileMarkAt`
// hangs a pile row's mark five cells above its ground's top, so the box's top
// is ten cells under the saw mill's floor to hang it five under the heap,
// clear of the window's foot, in the middle of the heap.
export const HEAP_PILE = 'after-sawdust';
export const heapMarkBox = () => ({ x: heapMid() - P, y: groundOf('mill') + P * 10, w: P * 2, h: P * 2 });

// A cut through the saw, a log a blade: false with no log on its pile or the
// heap full.
export function sawLog() {
  const st = S.after.stock;
  if (st.logs <= 0 || heapFull()) return false;
  const n = Math.min(bladeLogs(), st.logs);
  st.logs -= n;
  st.timber += AFTER_LOG_TIMBER * n;
  st.sawdust += AFTER_LOG_SAWDUST * n;
  drops.push(S.after.t);
  if (drops.length > DROPS_KEPT) drops.shift();
  return true;
}
// When each of the last cuts came out of the saw's right side onto its timber
// pile: this session's, for the plank drawn falling there (render/after/drop.js).
const DROPS_KEPT = 4, drops = [];
export const sawDrops = () => drops;


// --- tipping the heap ------------------------------------------------------------------
// The grains of a tip falling through the notch and fading, and when the heap
// was last held tipped: this session's drawing only, a load already gone.
const spills = [];
export const airSpills = () => spills;
export const forgetSpills = () => { spills.length = 0; drops.length = 0; };
// A load off the heap through the notch: what was taken.
export function tipSawdust() {
  const a = S.after, st = a.stock;
  if (st.sawdust <= 0) return 0;
  const n = Math.min(AFTER_TIP_LOAD, st.sawdust);
  st.sawdust -= n;
  a.tipAt = a.t;
  spills.push({ n, age: 0 });
  return n;
}

// A sawyer tips once the heap has stood at its brim AFTER_SWEEP_WAIT_S, so the
// stopped saw and its mark are seen first.
export const sweepDue = () => heapFull() && S.after.brimAt != null && S.after.t - S.after.brimAt >= AFTER_SWEEP_WAIT_S;

// One frame of the saw mill: the heap's clock and the falling grains.
export function stepMill(c) {
  const a = S.after, dt = secs(c);
  if (!heapFull()) a.brimAt = null;
  else if (a.brimAt == null) a.brimAt = a.t;
  for (let i = spills.length - 1; i >= 0; i--) if ((spills[i].age += dt) > AFTER_SPILL_S) spills.splice(i, 1);
}
