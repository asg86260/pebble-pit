// The saw mill, the chipper and the paper mill (DESIGN.md, "Acts 3 and 4",
// act 3, "The chain: trees to signs and posters"; the owner's calls of
// 2026-10-18). Placeholder drawing.
//
// A cut through the saw turns a log into a fixed split of timber and sawdust
// (the fence is cut), a log a blade; the chipper turns a log into sawdust
// alone. Both tip their sawdust onto the one heap between them. With no
// paper mill the heap stands at a brim -- the pile-full mark -- and the saw
// and the chipper stop until it is tipped: a click on the heap tips a load
// through the notch in the cloud floor beside it, and a sawyer tips one there
// too once the heap has stood full a while, so the saw never stops for good.
// The paper mill pulps sawdust into sheets, a batch a vat. Each is worked by the click first
// and then by a member at a post (work.js, bodies.js): the work itself is
// here, the same whoever does it.

import { S } from '../state.js';
import { AFTER_LOG_TIMBER, AFTER_LOG_SAWDUST, AFTER_TIP_LOAD, AFTER_SWEEP_WAIT_S, AFTER_PULP_SAWDUST,
         AFTER_SPILL_S } from '../config.js';
import { AFTER_JOB } from '../jobs.js';
import { built, bladeLogs, vatSheets, vats, heapBrim, chipLogs, chipSawdust } from './levels.js';
import { secs } from './util.js';

// The heap is at its brim while nothing takes sawdust away: the saw and the
// chipper stop (the pile-full mark, render/after.js).
export const heapFull = () => !!S.after && !built('papermill') && S.after.stock.sawdust >= heapBrim();

// A cut through the saw, a log a blade: false with no log on its pile or the
// heap full.
export function sawLog() {
  const st = S.after.stock;
  if (st.logs <= 0 || heapFull()) return false;
  const n = Math.min(bladeLogs(), st.logs);
  st.logs -= n;
  st.timber += AFTER_LOG_TIMBER * n;
  st.sawdust += AFTER_LOG_SAWDUST * n;
  return true;
}

// A feed through the chipper, a log a drum: all of it sawdust.
export function chipLog() {
  const st = S.after.stock;
  if (st.chiplogs <= 0 || heapFull()) return false;
  const n = Math.min(chipLogs(), st.chiplogs);
  st.chiplogs -= n;
  st.sawdust += chipSawdust() * n;
  return true;
}

// A batch pulled at the paper mill, its sheets the vat's (the bigger vat's
// more): false while the sawdust is short of a sheet.
export function pulpSheet() {
  const st = S.after.stock;
  const n = Math.min(vatSheets(), Math.floor(st.sawdust / AFTER_PULP_SAWDUST));
  if (n < 1) return false;
  st.sawdust -= AFTER_PULP_SAWDUST * n;
  st.paper += n;
  return true;
}
// The batches stirring at once, a pulper to each: one, or two with the
// drying line taking a batch off to dry (`vats`). The pulpers take the vats
// in the order they came to their posts, so which one stirs never flickers;
// one past them waits at the door, its clock held, until a vat is its.
export function vatOf(w) {
  const k = S.after.bodies.filter(b => b.job === AFTER_JOB.PULP).indexOf(w);
  return k >= 0 && k < vats() ? k : null;
}

// --- tipping the heap ------------------------------------------------------------------
// The grains of a tip falling through the notch and fading, and when the heap
// was last held tipped: this session's drawing only, a load already gone.
const spills = [];
export const airSpills = () => spills;
export const forgetSpills = () => { spills.length = 0; };
// A load off the heap through the notch: what was taken. While there is a
// paper mill the heap has somewhere better to go, and is never tipped.
export function tipSawdust() {
  const a = S.after, st = a.stock;
  if (built('papermill') || st.sawdust <= 0) return 0;
  const n = Math.min(AFTER_TIP_LOAD, st.sawdust);
  st.sawdust -= n;
  a.tipAt = a.t;
  spills.push({ n, age: 0 });
  return n;
}

// A sawyer tips once the heap has stood at its brim AFTER_SWEEP_WAIT_S, so the
// stopped saw and its mark are seen first.
export const sweepDue = () => heapFull() && S.after.brimAt != null && S.after.t - S.after.brimAt >= AFTER_SWEEP_WAIT_S;

// One frame of the mills: the heap's clock and the falling grains.
export function stepMill(c) {
  const a = S.after, dt = secs(c);
  if (!heapFull()) a.brimAt = null;
  else if (a.brimAt == null) a.brimAt = a.t;
  for (let i = spills.length - 1; i >= 0; i--) if ((spills[i].age += dt) > AFTER_SPILL_S) spills.splice(i, 1);
}
