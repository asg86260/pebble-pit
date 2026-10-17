// The saw mill and the paper mill (DESIGN.md, "Acts 3 and 4", act 3, "The
// chain: trees to signs and posters"). Placeholder drawing.
//
// A log sawn into timber and sawdust, by a sawyer through the mill's door
// (crew.js here, `bodies.js`: the work is done by the body standing there,
// never by a count). The sawdust heaps beside the mill to its brim -- the
// pile-full mark -- and, until the paper mill opens at the slowdown, a sawyer
// has to sweep it off the cloud's edge, a trip that takes the sawyer off the
// saw. The paper mill pulps sawdust into sheets, two a pull with its second
// vat. The mill's second blade saws two logs a cut. And the fence, the act's
// standing decision, bought on the mill's card and then a dial on it: set
// fine, more timber; coarse, more sawdust. Until it is bought every log cuts
// at AFTER_FENCE0.

import { S } from '../state.js';
import { AFTER_LOG_YIELD, AFTER_FENCE_STEPS, AFTER_FENCE0, AFTER_SAWDUST_BRIM, AFTER_SWEEP_LOAD, AFTER_SWEEP_WAIT_S,
         AFTER_PULP_SAWDUST } from '../config.js';
import { built, bladeLogs, fenceOn, vatSheets } from './levels.js';

// The fence's setting: timber of each log's AFTER_LOG_YIELD, the rest sawdust.
export const fenceSplit = () => (S.after ? (fenceOn() ? (S.after.fence ?? AFTER_FENCE0) : AFTER_FENCE0) : null);
export function setFence(v) {
  if (!S.after || !fenceOn() || !AFTER_FENCE_STEPS.includes(v)) return false;
  S.after.fence = v;
  return true;
}

// The heap beside the mill is at its brim while nothing takes sawdust away:
// the saw stops, and a sawyer sweeps (the pile-full mark, render/after.js).
export const heapFull = () => !!S.after && !built('papermill') && S.after.stock.sawdust >= AFTER_SAWDUST_BRIM;

// A cut through the saw, a log a blade: false with no log on the pile or the
// heap full.
export function sawLog() {
  const st = S.after.stock;
  if (st.logs <= 0 || heapFull()) return false;
  const n = Math.min(bladeLogs(), st.logs), timber = fenceSplit();
  st.logs -= n;
  st.timber += timber * n;
  st.sawdust += (AFTER_LOG_YIELD - timber) * n;
  return true;
}

// A sweep's load off the heap, carried to the cloud's edge: what was taken.
export function takeSweep() {
  const st = S.after.stock;
  const n = Math.min(AFTER_SWEEP_LOAD, st.sawdust);
  st.sawdust -= n;
  return n;
}

// A pull, a sheet a vat: false while the sawdust is short of one.
export function pulpSheet() {
  const st = S.after.stock;
  const n = Math.min(vatSheets(), Math.floor(st.sawdust / AFTER_PULP_SAWDUST));
  if (n < 1) return false;
  st.sawdust -= AFTER_PULP_SAWDUST * n;
  st.paper += n;
  return true;
}

// A sweep is due once the heap has stood at its brim AFTER_SWEEP_WAIT_S, so
// the stopped saw and its mark are seen before a sawyer walks off with it.
export const sweepDue = () => heapFull() && S.after.brimAt != null && S.after.t - S.after.brimAt >= AFTER_SWEEP_WAIT_S;

// One frame of the mills: only the heap's clock. Every sheet and board is a
// body's work at its door (bodies.js).
export function stepMill(c) {
  const a = S.after;
  if (!heapFull()) a.brimAt = null;
  else if (a.brimAt == null) a.brimAt = a.t;
}
