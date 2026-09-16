// The call to build the bench.
//
// The bench is built by the one body you have, and it is the first thing the
// game teaches (DESIGN.md, "The bench is built, not delivered"). The button is
// the page's business and lives in board.js; this file is the yard's half --
// what is being built, whether the call is out, and what pressing it does --
// so the node tier can press it without a document.

import { WORK_BASE } from './config.js';
import { S, bench } from './state.js';
import { canAfford } from './upgrades.js';
import { registerRows, start, workOn } from './works.js';
import { lookAt } from './world.js';

// On no board. It needs a row because works.js finishes a work by calling
// `rowFor(w.key).buy()`, which is how a work coming back out of a save knows
// what it was for.
const RAISE_BENCH = {
  key: 'raisebench',
  name: 'the bench',
  // A building, which earns it the barriers, the tape and the clip (`risingPlaces`
  // in render/rise.js).
  kind: 'building',
  // A bench's worth of work rather than a building's: it runs while there is
  // one body in the yard and nothing else to watch.
  work: () => WORK_BASE.place,
  // Read live because the layout moves with the window.
  box: () => ({ x: bench.x, w: bench.w, y: bench.y, h: bench.h }),
  // and which place is coming out of the ground, for the clip
  raises: 'bench',
  buy: () => { S.seenBench = true; }
};
registerRows([RAISE_BENCH]);

export const raising = () => !!workOn('raisebench');

// Derived from facts the yard already holds, so nothing new is saved; a save
// taken mid-build comes back mid-build because the work rides in `S.works`.
export const callOut = () => !S.seenBench && !raising() && canAfford();

// The one door in: the button on the page calls this and so does the check.
export function raiseBench() {
  if (!callOut()) return false;
  // The view goes to it if it is not already there: a window that opens on
  // the rock alone has the bench off to the left.
  const mid = bench.x + bench.w / 2;
  const sx = (mid - S.camX) * S.zoom;
  if (sx < 0 || sx > S.W) lookAt(mid);
  return start('yard', RAISE_BENCH, mid);
}
