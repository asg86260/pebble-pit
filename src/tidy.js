// Tidying up: a body working a site puts stray dust on its own ground into its
// own pile.
//
// One rule, and the whole of it is here. A quarrier between digs, a farmhand
// between plots and a miner between swings all do the same thing to three quite
// different patches of ground -- the floor of the cut, the strip the plots stand
// on, and the surface of the hill itself -- so what differs is the *patch* and
// nothing else. A patch is five questions about a column of somewhere:
//
//   key            whose heap what is picked up here belongs on
//   cols           how many columns the place has
//   colOf(x)       which of them a place in the world is in
//   xOf(c)         where the middle of one is in the world
//   peek(c)        the shade lying on top of it, or 0 for bare ground
//   take(c)        lift that grain off and hand it back
//   yOf(c)         where the top of that column is, so the throw starts there
//
// Three of those in three files, and the rule itself written once.
//
// Three things it has to be, and each of them is a bug somebody has already had:
//
//   opportunistic  it happens between strokes of the actual job and never
//                  instead of one. Every call site is behind that job's own
//                  "nothing to do this instant" gate, so a body that could be
//                  digging, tending or swinging is doing that.
//   claim-disciplined  no two bodies go for the same grain. Same books, same
//                  elbows, same one-frame release as the mess -- see `nearestMuck`
//                  in smog.js, which is where those three rules were learnt.
//   conserved      what is lifted is thrown, and lands as a real chip on a real
//                  heap. Nothing here deletes a grain; a swept mess is worth
//                  nothing and this is worth exactly what it was worth on the
//                  ground it came off.

import { P, WORKER } from './config.js';
import { S } from './state.js';
import { spawnSpoil } from './dust.js';

// How far a body reaches for a stray grain. This is "when they come across it"
// as a number: a couple of body widths, so a body clears the ground it is
// standing on and its neighbours as it passes, and never walks off the job to
// fetch something from the far end of its site. What makes a whole site come
// clean is that all three of these trades already walk their site end to end.
export const TIDY_REACH = P * 8;

// A claim is a stretch, not a cell -- for the same reason the mess's is. A
// column is six pixels and a body is eighteen wide, so reserving the one column
// somebody is bent over puts the next body inside it.
export const TIDY_ELBOW = 3;

// How long one grain takes to pick up and throw. One number for the one act:
// tidying is the same job wherever it happens, and a per-trade constant here
// would be three numbers saying one thing.
export const TIDY_MS = 420;

// The nearest column of stray dust within reach that nobody else has gone for.
// The book is the site's own -- the cut shares the haulers' -- so a claim made
// here is a claim everybody who works this ground can see.
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
  // Nothing here for this pair of hands. It says so and gets on with its job --
  // there is no second pass handing out a column that is already somebody's,
  // which is the fallback that once granted three bodies one cell.
  return null;
}

// One body, one frame, one patch. True when it has actually thrown something.
//
// The claim is held on the body between frames and let go a frame before the
// next is taken, exactly the way the mess's is: the book is rebuilt at the top
// of every frame from the claims that are held, with their elbows out, so a
// body that has just finished a column is barred from the cells beside it for
// one frame and does not hop along its own leavings.
export function tidyStep(w, patch, taken, now) {
  // Let a spent column go -- and not pick another in the same breath.
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
  // Thrown, on the one arc this yard throws everything on, at the heap that
  // belongs to the place it was picked up in. It lands as a chip and comes to
  // rest as a grain: nothing is destroyed and nothing is put anywhere nobody
  // carried it.
  spawnSpoil(patch.xOf(c), y, v, patch.key);
  w.tidied = (w.tidied || 0) + 1;
  w.tidyNext = now + TIDY_MS;
  w.lunge = 1;                                    // and it is seen to stoop for it
  S.dirty = true;
  return true;
}
