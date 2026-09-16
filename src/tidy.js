// Tidying up: a body working a site puts stray dust on its own ground into its
// own pile.
//
// One rule for the cut, the plots and the hill; what differs is the *patch*,
// which answers these questions about a column of somewhere:
//
//   key            whose heap what is picked up here belongs on
//   cols           how many columns the place has
//   colOf(x)       which of them a place in the world is in
//   xOf(c)         where the middle of one is in the world
//   peek(c)        the shade lying on top of it, or 0 for bare ground
//   take(c)        lift that grain off and hand it back
//   yOf(c)         where the top of that column is, so the throw starts there
//
// Three things it must be:
//
//   opportunistic  every call site is behind that job's own "nothing to do
//                  this instant" gate, so it never displaces the job.
//   claim-disciplined  no two bodies go for the same grain: same books, same
//                  elbows, same one-frame release as `nearestMuck` in smog.js.
//   conserved      what is lifted is thrown and lands as a real chip on a real
//                  heap; nothing here deletes a grain.

import { P, WORKER } from './config.js';
import { S } from './state.js';
import { spawnSpoil } from './dust.js';

// How far a body reaches for a stray grain: a couple of body widths, so it
// clears the ground it passes over and never walks off the job to fetch
// something from the far end of its site.
export const TIDY_REACH = P * 8;

// A claim is a stretch, not a cell: a column is six pixels and a body is
// eighteen wide, so reserving one column puts the next body inside it.
export const TIDY_ELBOW = 3;

// How long one grain takes to pick up and throw, wherever it happens.
export const TIDY_MS = 420;

// The nearest column of stray dust within reach that nobody else has gone for.
// The book is the site's own (the cut shares the haulers'), so a claim made
// here is seen by everybody who works this ground.
export function nearestStray(wx, patch, taken, reach = TIDY_REACH) {
  const span = Math.ceil(reach / P);
  const home = patch.colOf(wx);
  for (let d = 0; d <= span; d++) {
    for (const c of (d ? [home - d, home + d] : [home])) {
      if (c < 0 || c >= patch.cols || !patch.peek(c)) continue;
      if (taken && taken.has(c)) continue;
      if (Math.abs(patch.xOf(c) - wx) > reach) continue;
      if (taken) for (let k = c - TIDY_ELBOW; k <= c + TIDY_ELBOW; k++) taken.add(k);
      return c;
    }
  }
  // No second pass handing out a column that is already somebody's: that is
  // how three bodies once got one cell.
  return null;
}

// One body, one frame, one patch. True when it has actually thrown something.
//
// The claim is held on the body between frames and let go a frame before the
// next is taken: the book is rebuilt at the top of every frame from held
// claims with their elbows out, so a body that has just finished a column is
// barred from the cells beside it for one frame and does not hop along its
// own leavings.
export function tidyStep(w, patch, taken, now) {
  // Let a spent column go, and not pick another in the same breath.
  if (w.tidyAt != null && (w.tidyAt >= patch.cols || !patch.peek(w.tidyAt))) {
    w.tidyAt = null;
    return false;
  }
  if (w.tidyAt == null) {
    w.tidyAt = nearestStray(w.x + WORKER / 2, patch, taken, patch.reach || TIDY_REACH);
    if (w.tidyAt == null) return false;
  }
  if (now < (w.tidyNext || 0)) return false;      // between strokes, not every frame
  const c = w.tidyAt;
  const y = patch.yOf(c);
  const v = patch.take(c);
  if (!v) { w.tidyAt = null; return false; }
  // Thrown at the heap that belongs to the place it was picked up in; it lands
  // as a chip and comes to rest as a grain.
  spawnSpoil(patch.xOf(c), y, v, patch.key);
  w.tidied = (w.tidied || 0) + 1;
  w.tidyNext = now + TIDY_MS;
  w.lunge = 1;                                    // and it is seen to stoop for it
  return true;
}
