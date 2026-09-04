// The janitor's closet: a cupboard standing next door to the rooms, with a
// broom leaning on it.

import { CLOSET_H, P } from '../config.js';
import { S, closet } from '../state.js';
import { ctx } from './ctx.js';

// The one thing in the yard that is furniture rather than a building: eight
// cells by seven, wider than it is high, against an outhouse that is seven by
// ten. It reads as a cupboard because it is shaped like one.
//
// Drawn the way everything the crew put up is drawn -- a black silhouette with
// the openings cut white out of it -- with three things doing the work. A lid
// that overhangs both walls, because a cupboard has a lid and a building has a
// roof. A seam down the middle, which is two doors. And the broom outside,
// which is what says whose cupboard it is.
export function drawCloset() {
  // It stands as soon as anybody lives here, which in this game is the first
  // frame: the yard opens with somebody already in it, so the settlement is
  // never empty and the closet never arrives. That is the point of writing the
  // rule this way rather than drawing it unconditionally -- it says *why* the
  // cupboard is there, and it is the one condition under which a broom cupboard
  // makes any sense. Nothing pops into the yard, because there is no moment at
  // which it was not already there.
  if (S.crew < 1) return;

  const { x, y, w } = closet;
  const c = n => x + P * n;                    // cell n across the front
  const r = n => y + P * n;                    // and n down from the top
  const WIDE = Math.round(w / P);              // 8 across
  const TALL = Math.round(CLOSET_H / P);       // 7 down
  const LID = 1;                               // courses of lid over the body

  ctx.fillStyle = '#000';
  // The lid, a cell proud of each wall. A building's roof sits on its walls; a
  // lid sits over them, and that overhang is most of what tells the two apart
  // at this size.
  ctx.fillRect(c(-1), r(0), P * (WIDE + 2), P * LID);
  ctx.fillRect(x, r(LID), w, CLOSET_H - P * LID);

  // Two doors, which is the seam down the middle. It stops a course short at
  // both ends -- under the lid and above the ground -- and both matter: a
  // white line running into the lid breaks the one silhouette the thing has,
  // and a line running out at the foot cuts the cupboard into two black
  // towers standing side by side. Stopped short, it is a seam in a box, which
  // is what it is.
  ctx.fillStyle = '#fff';
  const seam = WIDE / 2;
  ctx.fillRect(c(seam), r(LID + 1), P, P * (TALL - LID - 2));

  // And nothing else on the front. It carried a handle on each door for a
  // draft, and a white bar either side of a white line is a door between two
  // windows -- which is a house, at the one size where the yard has houses
  // twenty cells away. The seam alone says two doors; the broom says whose.

  // The broom, standing on its own two cells clear of the wall.
  //
  // Leaning on the closet was the first drawing and it is the wrong one at this
  // size: a handle that reaches the wall makes one silhouette out of two, and
  // what the yard then shows is a staircase coming down off the lid. Everything
  // here is read as a shape, and two shapes that touch are one shape.
  //
  // A wide flat head and a thin tall handle, which is the whole of what makes a
  // broom a broom in six-pixel cells. Drawn at even weight it was a stack of
  // steps beside a box, which is what it looked like.
  ctx.fillStyle = '#000';
  const head = c(WIDE + 2);
  ctx.fillRect(head, r(TALL) - P * 2, P * 3, P * 2);       // the bristles, on the ground
  ctx.fillRect(head + P, r(TALL) - P * 6, P, P * 4);       // and the handle out of them
}
