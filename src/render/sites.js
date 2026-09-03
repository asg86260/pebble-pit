// The two outdoor sites and the way across one: the quarry cut and its ladder,
// the bridge over it, the farm plots, and the sheds beside the quarry and the
// farm. Extracted verbatim from render.js; behavior unchanged. Owns drawQuarry,
// drawCut, drawLadder, drawBridge, drawFarm, drawShed, drawFarmShed and
// drawQuarryShed. The shared primitives (ctx, drawMark, withRise, risingPlace)
// come from render.js, the core module.

import { FARM_GATE, FARM_H, P, SPORE_CELL } from '../config.js';
import { plotX } from '../farm.js';
import { ladder, quarryCells } from '../quarry.js';
import { S, cut, farm, quarry } from '../state.js';
import { bridgeSpan, farmShed, plotSlots, quarryShed } from '../world.js';
import { ctx, drawMark, risingPlace, withRise } from '../render.js';

// The mouth of the quarry: an open cut going down, so the ground line breaks
// across it and the walls carry on below. Drawn downwards rather than as an arch
// standing on the ground, which read as a black lozenge sitting on a wire.
export function drawQuarry() {
  if (!S.quarryOpen) return;
  const { x, y, w, h } = quarry;
  const E = 2;                             // how thick a cut edge is

  // The hole is empty air first: white over the mouth, which is what breaks the
  // ground line cleanly across it. Then the one outline -- both walls stepping
  // down in benches and the uneven floor between them -- as a single stroked
  // path. It is one line, so nothing doubles up where the parts meet, which is
  // what three separate filled bars used to do along each rim.
  // What has been taken out, and nothing else. The quarry is not outlined in
  // advance: there is no hole until somebody has dug one, so what is drawn is
  // the ground that is gone -- column by column, down to whatever depth that
  // column has been worked to. The benched walls and the uneven floor appear as
  // they are reached rather than being promised from the first frame.
  const cells = quarryCells();
  ctx.fillStyle = '#fff';
  for (let c = 0; c < cells.length; c++) {
    if (!cells[c]) continue;
    ctx.fillRect(x + c * P, y, P, cells[c] * P);
  }

  // and a line round the edge of it, drawn off the same columns: the lip where
  // the ground breaks, and the step down wherever one column is deeper than the
  // one beside it.
  ctx.fillStyle = '#000';
  for (let c = 0; c < cells.length; c++) {
    const d = cells[c];
    if (!d) continue;
    const cx = x + c * P;
    // No line along the lip. The ground already ends there -- the ground line
    // runs across the whole yard and stops at the hole, which is the edge -- so
    // drawing another one on top of it boxed the quarry in and made it read as a
    // thing sitting in the ground rather than a hole in it.
    ctx.fillRect(cx, y + d * P - E, P, E);               // the floor of it
    const left = c > 0 ? cells[c - 1] : 0;
    const right = c < cells.length - 1 ? cells[c + 1] : 0;
    if (left < d) ctx.fillRect(cx, y + left * P, E, (d - left) * P);
    if (right < d) ctx.fillRect(cx + P - E, y + right * P, E, (d - right) * P);
  }

  drawLadder();
  ctx.fillStyle = '#000';
}

// The dust that has fallen into the cut, over the blank white the quarry's own
// dig just painted. Blitted from its own scratch canvas exactly the way the
// pit is -- see `drawPit` -- and drawn after `drawQuarry` for the same reason
// `drawJaw` is: the quarry's white columns would otherwise erase it.
export function drawCut() {
  if (!S.quarryOpen || !cut.grid) return;
  cut.painter.paint(ctx, cut.x, cut.y, cut.cols * P, cut.rows * P);
}

// The ladder in the near corner, head a cell proud of the rim the way a
// ladder's is. Stiles and rungs are lines rather than cells: a cell-thick stile
// with a cell-thick rung every other cell is nine tenths black, which is a post,
// and what makes a ladder read is the air between the rungs.
const RAIL = 2, RUNG_GAP = P * 2;

function drawLadder() {
  const l = ladder();
  ctx.fillStyle = '#000';
  const h = l.foot - l.top;
  ctx.fillRect(l.x, l.top, RAIL, h);
  ctx.fillRect(l.x + l.w - RAIL, l.top, RAIL, h);
  for (let y = l.top + RUNG_GAP; y < l.foot - RAIL; y += RUNG_GAP)
    ctx.fillRect(l.x, Math.round(y), l.w, RAIL);
}
// The plots: a stalk per plot, as tall as the plot is far along, with a spore on
// top once it is ripe. A bare plot is a notch in the ground, so an untended farm
// still reads as a farm.
// A bridge over the quarry: a ramp up, a deck, a ramp down. Three lines, which is
// the whole of it -- the planked deck with a handrail and newels that stood here
// before was a lot of furniture for a thing you cross in a second and a half.
// The crew walk it, so it also has to be where groundAt() says it is.
export function drawBridge() {
  if (!S.quarryOpen) return;
  const { x0, d0, d1, x1, top } = bridgeSpan();
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x0, S.groundY);
  ctx.lineTo(d0, top);
  ctx.lineTo(d1, top);
  ctx.lineTo(x1, S.groundY);
  ctx.stroke();
}


export function drawFarm() {
  if (!S.farmOpen) return;

  // Laid out at its full width from the first frame -- see C6 in
  // wave-feedback3.md. `plotSlots` is every furrow the row will ever have;
  // `S.plots.length` is how many have actually been broken. The fence brackets
  // the whole row, and a slot past what has been bought draws as a bare post
  // with nothing turned over in it -- ground waiting to be broken, not ground
  // that does not exist yet.
  const slots = plotSlots();
  const rightX = plotX(slots - 1);

  // The farm needs a silhouette or it is just texture on the ground line: a post
  // at either end of the row, with a stub of rail running off it, so the plot
  // reads as somewhere fenced and kept even when nothing is growing. Kept low
  // and thin -- it is there to bracket the plots, not to be the thing you look at.
  const postH = P * 6;
  ctx.fillStyle = '#000';
  for (const px of [farm.x - FARM_GATE, rightX + FARM_GATE - P]) {
    ctx.fillRect(px, S.groundY - postH, P, postH);
    ctx.fillRect(px + (px < farm.x ? P : -P * 2), S.groundY - postH + P * 2, P * 2, P);
  }

  // A plot is three cells across and two deep, with the earth turned over in it.
  // Small, but a shape rather than a scratch, and it has something in it even
  // when nobody has been by to tend it.
  for (let i = 0; i < slots; i++) {
    const x = Math.round(plotX(i) / P) * P;

    if (i >= S.plots.length) {
      // Not broken yet: a bare post at the furrow's spot, and no furrow -- the
      // fence knows the row is this wide before a single plot in it is bought.
      ctx.fillStyle = '#000';
      ctx.fillRect(x, S.groundY - P * 3, P, P * 3);
      continue;
    }

    const soil = S.groundY - P * 2;

    ctx.fillStyle = '#000';
    ctx.fillRect(x - P, soil, P * 3, P * 2);           // the plot
    ctx.fillStyle = '#fff';
    ctx.fillRect(x - P, soil + P, P, P);              // earth turned over
    ctx.fillRect(x + P, soil, P, P);
    ctx.fillStyle = '#000';

    const grown = S.plots[i];
    if (grown <= 0.02) { ctx.fillRect(x, soil - P, P, P); continue; }

    const top = soil - Math.round(FARM_H * grown / P) * P;
    ctx.fillRect(x, top, P, soil - top);              // the stalk
    const tall = soil - top;
    if (tall > P * 3) ctx.fillRect(x - P, top + P * 2, P, P);   // a leaf either side
    if (tall > P * 5) ctx.fillRect(x + P, top + P * 4, P, P);

    if (grown >= 1) drawMark(S.plotTone[i] || SPORE_CELL, x + P / 2, top - P / 2);
  }
}

// The farm's and the quarry's own shed, in the black-box-with-a-door style
// every building here is drawn in -- a mass, and a hole knocked in it for the
// way in. See C5 in wave-feedback3.md.
function drawShed(rect) {
  const { x, y, w, h } = rect;
  ctx.fillStyle = '#000';
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = '#fff';
  const dw = Math.min(P * 2, w - P * 2), dh = Math.min(P * 3, h - P);
  ctx.fillRect(x + (w - dw) / 2, y + h - dh, dw, dh);
  ctx.fillStyle = '#000';
}

// Both sheds rise out of the ground while they are being built, like every
// other building in the yard.
//
// They did not, and the reason is worth keeping: #3 of "Wave 3.1" wired the
// rise into the six places that have a `withRise` call of their own, and the
// quarry and the farm were not among them because neither is *drawn* as a
// building -- one is a hole and the other is a row of furrows, and the shed
// that carries each one's board only arrived in the same wave (C5). So both
// were in `OPENS_PLACE`, both were rising as far as `risingPlace` was
// concerned, and nothing anywhere clipped a draw to it: they popped in whole.
export function drawFarmShed() {
  const rising = risingPlace() === 'farm';
  if (!S.farmOpen && !rising) return;
  const r = farmShed();
  withRise(rising, r.x, S.groundY, r.w, r.h, () => drawShed(r));
}

export function drawQuarryShed() {
  const rising = risingPlace() === 'quarry';
  if (!S.quarryOpen && !rising) return;
  const r = quarryShed();
  withRise(rising, r.x, S.groundY, r.w, r.h, () => drawShed(r));
}



