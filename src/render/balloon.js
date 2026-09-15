// The filter balloons the scrubbing house sells, and anyone stepped out under a
// brolly.

import { BALLOON_BASKET, BALLOON_FILTER_H, BALLOON_FILTER_W, BALLOON_H, BALLOON_W, CRAFT, craftY, mastX } from '../balloon.js';
import { BROLLY_STICK, BROLLY_W, P, WORKER } from '../config.js';
import { S } from '../state.js';
import { walkY } from '../world.js';
import { ctx } from './ctx.js';

// The craft the scrubbing house sells, one per lane. See balloon.js.
//
// Everything about where it is comes off the craft's own geometry; nothing is
// remembered, so a balloon cannot be drawn over a house re-sited under it.
//
// The filter is the point of the drawing: without the vented box slung between
// bag and basket the craft is a nice picture of the wrong thing.
export function drawBalloons() {
  if (!S.scrubOpen) return;
  for (let i = 0; i < CRAFT.length; i++) {
    const c = CRAFT[i];
    // Whole pixels, and *not* the lattice: a balloon is not standing on
    // anything, and snapping it turns a slow drift into a six-pixel stutter.
    const bx = Math.round(c.x);
    const by = Math.round(craftY(i));
    const w = BALLOON_W, h = BALLOON_H;
    const fw = BALLOON_FILTER_W, fh = BALLOON_FILTER_H;
    const ftop = by - BALLOON_BASKET - fh;     // the filter's own top
    const top = ftop - h;                      // and the crown of the envelope
    const left = bx - w / 2;

    ctx.fillStyle = '#000';
    // The tether, only while the craft is actually tied down: a rope paying out
    // behind a rising balloon is a rope that is not holding it.
    if (c.lift < 0.02) {
      const mast = Math.round(mastX());
      const foot = walkY(c.x);
      ctx.fillRect(mast, by, P, Math.max(0, foot - by));
    }

    // The envelope, drawn as rows rather than an oval: a curve here would be
    // the one smooth edge in the game.
    const rows = Math.round(h / P);
    for (let n = 0; n < rows; n++) {
      const t = n / (rows - 1);
      const bulge = Math.sin(Math.min(1, t * 1.15) * Math.PI * 0.92);
      const cells = Math.max(2, Math.round((w / P) * (0.42 + bulge * 0.58)));
      const runW = cells * P;
      ctx.fillRect(Math.round(left + (w - runW) / 2), top + n * P, runW, P);
    }

    // The lines from the envelope down to the filter's shoulders.
    const fl = Math.round(bx - fw / 2);
    ctx.fillRect(fl + P, ftop - P, P, P);
    ctx.fillRect(fl + fw - P * 2, ftop - P, P, P);

    // The vents are what say filter rather than crate.
    ctx.fillRect(fl, ftop, fw, P);                       // the intake lip, solid
    for (let cx = 0; cx < Math.round(fw / P); cx++) {
      // every other cell open across the middle, and the ends always closed
      const open = cx > 0 && cx < Math.round(fw / P) - 1 && cx % 2 === 1;
      if (!open) ctx.fillRect(fl + cx * P, ftop + P, P, P);
    }
    ctx.fillRect(fl, ftop + P * 2, fw, fh - P * 2);       // and the sump under it

    // The basket, hanging under the works on two lines.
    const bw = P * 3, bl = bx - P * 1.5;
    ctx.fillRect(Math.round(bl) + P, by - BALLOON_BASKET, P, BALLOON_BASKET - P * 2);
    ctx.fillRect(Math.round(bl) + bw - P * 2, by - BALLOON_BASKET, P, BALLOON_BASKET - P * 2);
    ctx.fillRect(Math.round(bl), by - P * 2, bw, P * 2);
  }
}

// The umbrella a body puts up when it steps out of a balloon: a scalloped cap
// and one straight stick. (A parachute needs rigging, and thin diagonals in
// cells are staircases.) Drawn with the craft rather than the crew because it
// is a piece of the balloon's story.
export function drawBrollies() {
  for (const w of S.workers) {
    if (!w.brolly) continue;
    const cx = Math.round((w.x + WORKER / 2 - P / 2) / P) * P;   // the stick's column
    const hemY = Math.round(w.y) - BROLLY_STICK;                 // where the cap sits
    const wide = Math.round(BROLLY_W / P);                       // cells across
    ctx.fillStyle = '#000';

    // Three rows, the *bottom* one widest, as shares of the width: three numbers
    // are easier to read and change than the curve that produces them.
    const rowsOf = [0.45, 0.82, 1];
    for (let n = 0; n < rowsOf.length; n++) {
      let cells = Math.max(2, Math.round(wide * rowsOf[n]));
      if ((cells & 1) !== (wide & 1)) cells++;                   // keep it centered on the stick
      const runW = cells * P;
      ctx.fillRect(Math.round(cx + P / 2 - runW / 2), hemY - (rowsOf.length - n) * P, runW, P);
    }

    // The scallop: every other cell hanging below the hem is the whole of what
    // says umbrella rather than mushroom.
    const hemCells = (() => {
      let c = Math.max(2, Math.round(wide));
      if ((c & 1) !== (wide & 1)) c++;
      return c;
    })();
    const left = Math.round(cx + P / 2 - (hemCells * P) / 2);
    for (let c = 1; c < hemCells - 1; c += 2) ctx.fillRect(left + c * P, hemY, P, P);

    // The stick, one cell wide, to the top of the head.
    ctx.fillRect(cx, hemY - P, P, Math.max(P, Math.round(w.y) - hemY + P));
  }
}
