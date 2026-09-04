// The filter balloons the scrubbing house sells, and anyone stepped out under a
// brolly. Extracted verbatim from render.js; behavior unchanged. Owns
// drawBalloons and drawBrollies. ctx comes from render.js, the core module.

import { BALLOON_BASKET, BALLOON_FILTER_H, BALLOON_FILTER_W, BALLOON_H, BALLOON_W, CRAFT, craftY, mastX } from '../balloon.js';
import { BROLLY_STICK, BROLLY_W, P, WORKER } from '../config.js';
import { S } from '../state.js';
import { walkY } from '../world.js';
import { ctx } from '../render.js';

// The craft the scrubbing house sells, one per lane. See balloon.js.
//
// Everything about where it is comes off the craft's own geometry -- the mast is
// the house's door, the lane is off the sky's own top and bottom, and the height
// is eased between the two by `lift`. Nothing here is remembered, so a balloon
// cannot end up drawn over a house that has been re-sited under it.
//
// **The filter is the point of the drawing.** A bag with a basket under it is a
// balloon; what makes this one read as a *purifier* is the works slung between
// the two -- a vented box the air goes into at the top and what is caught falls
// out of the bottom. Without it the craft is a nice picture of the wrong thing.
export function drawBalloons() {
  if (!S.scrubOpen) return;
  for (let i = 0; i < CRAFT.length; i++) {
    const c = CRAFT[i];
    // Whole pixels, and *not* the lattice. Everything standing on the ground in
    // this yard is snapped to a cell; a balloon is not standing on anything, and
    // snapping it would turn a slow drift into a six-pixel stutter -- the same
    // reason the tractor rolls on pixels.
    const bx = Math.round(c.x);
    const by = Math.round(craftY(i));
    const w = BALLOON_W, h = BALLOON_H;
    const fw = BALLOON_FILTER_W, fh = BALLOON_FILTER_H;
    const ftop = by - BALLOON_BASKET - fh;     // the filter's own top
    const top = ftop - h;                      // and the crown of the envelope
    const left = bx - w / 2;

    ctx.fillStyle = '#000';
    // The tether, and **only while the craft is actually tied down.**
    //
    // It used to be drawn the whole way up, which made the rope the loudest thing
    // about a launch: a black line growing out of the ground for two seconds,
    // stretching to follow the balloon, then vanishing. A rope that pays out
    // behind a rising balloon is a rope that is not holding it, and drawing one
    // says the opposite of what is happening. What a mooring line is for is
    // saying "this thing is not going anywhere", so it is there while that is
    // true and gone the instant it is not.
    if (c.lift < 0.02) {
      const mast = Math.round(mastX());
      const foot = walkY(c.x);
      ctx.fillRect(mast, by, P, Math.max(0, foot - by));
    }

    // The envelope: a bag, widest a third of the way down and closing to a neck.
    // Drawn as rows rather than as an oval, because everything in this yard is
    // cells and a curve here would be the one smooth edge in the game.
    const rows = Math.round(h / P);
    for (let n = 0; n < rows; n++) {
      const t = n / (rows - 1);
      const bulge = Math.sin(Math.min(1, t * 1.15) * Math.PI * 0.92);
      const cells = Math.max(2, Math.round((w / P) * (0.42 + bulge * 0.58)));
      const runW = cells * P;
      ctx.fillRect(Math.round(left + (w - runW) / 2), top + n * P, runW, P);
    }

    // The lines from the envelope down to the filter's shoulders, so the works
    // hangs off the bag rather than being stuck to it.
    const fl = Math.round(bx - fw / 2);
    ctx.fillRect(fl + P, ftop - P, P, P);
    ctx.fillRect(fl + fw - P * 2, ftop - P, P, P);

    // The filter: a box with its middle course vented. The vents are what say it
    // is a filter rather than a crate -- a solid block that size under a balloon
    // reads as cargo.
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

// The umbrella a body puts up when it steps out of a balloon.
//
// It was a parachute for four goes and never read as one at the size it is
// played at. A parachute is a hard shape to draw small: what makes it legible is
// a canopy *and* a spread of rigging, and rigging is thin diagonal lines, which
// in cells are staircases -- so it came out as a bulb, a lampshade, a mushroom
// and a funnel in turn. An umbrella is the same joke and one tenth the drawing:
// a scalloped cap and one straight stick.
//
// Drawn with the craft rather than with the crew, because it is a piece of the
// balloon's story: it is what the yard shows you instead of a body being
// switched off in mid-air.
export function drawBrollies() {
  for (const w of S.workers) {
    if (!w.brolly) continue;
    const cx = Math.round((w.x + WORKER / 2 - P / 2) / P) * P;   // the stick's column
    const hemY = Math.round(w.y) - BROLLY_STICK;                 // where the cap sits
    const wide = Math.round(BROLLY_W / P);                       // cells across
    ctx.fillStyle = '#000';

    // The cap: three rows, and it is the *bottom* one that is widest. Written out
    // as shares of the width rather than worked out from a curve -- three numbers
    // are easier to read and to change than the arithmetic that produces them,
    // and the arithmetic is what got the last four wrong.
    const rowsOf = [0.45, 0.82, 1];
    for (let n = 0; n < rowsOf.length; n++) {
      let cells = Math.max(2, Math.round(wide * rowsOf[n]));
      if ((cells & 1) !== (wide & 1)) cells++;                   // keep it centred on the stick
      const runW = cells * P;
      ctx.fillRect(Math.round(cx + P / 2 - runW / 2), hemY - (rowsOf.length - n) * P, runW, P);
    }

    // **The scallop.** One row of cells hanging below the hem, every other one --
    // and this is the whole of what says umbrella rather than mushroom. A cap
    // with a ruled edge is a toadstool; a cap with a wavy one is cloth on ribs.
    const hemCells = (() => {
      let c = Math.max(2, Math.round(wide));
      if ((c & 1) !== (wide & 1)) c++;
      return c;
    })();
    const left = Math.round(cx + P / 2 - (hemCells * P) / 2);
    for (let c = 1; c < hemCells - 1; c += 2) ctx.fillRect(left + c * P, hemY, P, P);

    // The stick, straight down the middle to the top of the head. One cell wide,
    // and the one line in the whole drawing.
    ctx.fillRect(cx, hemY - P, P, Math.max(P, Math.round(w.y) - hemY + P));
  }
}
