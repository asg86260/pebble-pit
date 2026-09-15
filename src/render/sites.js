// The two outdoor sites and the way across one: the quarry cut and its ladder,
// the bridge over it, the farm plots, and the sheds beside the quarry and the
// farm.

import { DOOR_W, FARM_GATE, FARM_H, P, SHACK_EAVE, SPORE_CELL } from '../config.js';
import { plotX } from '../farm.js';
import { ladder, quarryCells } from '../quarry.js';
import { S, cut, farm, quarry } from '../state.js';
import { bridgeSpan, farmShed, plotSlots, quarryShed } from '../world.js';
import { ctx } from './ctx.js';
import { drawMark } from './marks.js';
import { rising as risingAt, withRise } from './rise.js';

// The mouth of the quarry: an open cut going down, so the ground line breaks
// across it and the walls carry on below.
export function drawQuarry() {
  if (!S.quarryOpen) return;
  const { x, y, w, h } = quarry;
  const E = 2;                             // how thick a cut edge is

  // What has been taken out, and nothing else: there is no hole until somebody
  // has dug one, so what is drawn is the ground that is gone, column by column,
  // down to whatever depth that column has been worked to.
  const cells = quarryCells();
  ctx.fillStyle = '#fff';
  for (let c = 0; c < cells.length; c++) {
    if (!cells[c]) continue;
    ctx.fillRect(x + c * P, y, P, cells[c] * P);
  }

  // and a line round the edge of it, off the same columns: the floor, and the
  // step down wherever one column is deeper than the one beside it.
  ctx.fillStyle = '#000';
  for (let c = 0; c < cells.length; c++) {
    const d = cells[c];
    if (!d) continue;
    const cx = x + c * P;
    // No line along the lip: the ground line already stops at the hole, and a
    // second one boxes the quarry in and makes it a thing sitting in the ground.
    ctx.fillRect(cx, y + d * P - E, P, E);               // the floor of it
    const left = c > 0 ? cells[c - 1] : 0;
    const right = c < cells.length - 1 ? cells[c + 1] : 0;
    if (left < d) ctx.fillRect(cx, y + left * P, E, (d - left) * P);
    if (right < d) ctx.fillRect(cx + P - E, y + right * P, E, (d - right) * P);
  }

  drawLadder();
  ctx.fillStyle = '#000';
}

// The dust that has fallen into the cut, blitted from its own scratch canvas
// like the pit (`drawPit`), and drawn after `drawQuarry` because the quarry's
// white columns would otherwise erase it.
export function drawCut() {
  if (!S.quarryOpen || !cut.grid) return;
  cut.painter.paint(ctx, cut.x, cut.y, cut.cols * P, cut.rows * P);
}

// The ladder in the near corner, head a cell proud of the rim. Stiles and rungs
// are lines rather than cells: a cell-thick stile with a cell-thick rung every
// other cell is nine tenths black, which is a post.
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
// A bridge over the quarry: a ramp up, a deck, a ramp down. The crew walk it,
// so it also has to be where groundAt() says it is.
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

  // Laid out at its full width from the first frame: `plotSlots` is every
  // furrow the row will ever have, `S.plots.length` how many have been broken.
  // A slot past what has been bought draws as a bare post: ground waiting to
  // be broken.
  const slots = plotSlots();
  const rightX = plotX(slots - 1);

  // A post at either end of the row with a stub of rail, so the plot reads as
  // somewhere fenced even when nothing is growing. Kept low and thin.
  const postH = P * 6;
  ctx.fillStyle = '#000';
  for (const px of [farm.x - FARM_GATE, rightX + FARM_GATE - P]) {
    ctx.fillRect(px, S.groundY - postH, P, postH);
    ctx.fillRect(px + (px < farm.x ? P : -P * 2), S.groundY - postH + P * 2, P * 2, P);
  }

  // A plot is three cells across and two deep, with the earth turned over in
  // it, so it has something in it even when nobody has been by.
  for (let i = 0; i < slots; i++) {
    const x = Math.round(plotX(i) / P) * P;

    if (i >= S.plots.length) {
      // Not broken yet: a bare post at the furrow's spot, and no furrow.
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

// The farm's and the quarry's own shed: a mass with a hole knocked in it for
// the way in, a course of height and an eave (shared, because a shack is a
// shack), and one piece of its own furniture each, passed in by the caller.
// The detail has to be black and OUTSIDE the box: anything drawn inside a
// solid wall can only be a white hole, and a white hole on a face here means
// a way in.
function drawShed(rect, detail) {
  const { x, y, w, h } = rect;
  ctx.fillStyle = '#000';
  ctx.fillRect(x, y, w, h);
  // The eave, the same lip the crew's rooms wear: what separates a building
  // from a block, in one rect.
  ctx.fillRect(x - SHACK_EAVE, y - SHACK_EAVE, w + SHACK_EAVE * 2, SHACK_EAVE);
  ctx.fillStyle = '#fff';
  // The way in is regulation size: DOOR_W across and four courses tall,
  // centered at the foot of the wall. A smaller slot reads as a crate with a
  // hole in it.
  const dw = Math.min(DOOR_W * P, w - P * 2), dh = Math.min(P * 4, h - P);
  const head = y + h - dh;                      // the top of the doorway
  ctx.fillRect(x + (w - dw) / 2, head, dw, dh);
  // (No lintel slit under the eave: with the quarry beam it makes three
  // horizontal features on a six-cell front, and the box reads as a canopy on
  // posts.)
  ctx.fillStyle = '#000';
  if (detail) detail(rect, head);
}

// The cut's shack: a timber over the door, run through the wall so its ends
// stand out either side, the same timbering the cut itself would be held open
// with.
function quarryBeam({ x, w }, head) {
  ctx.fillStyle = '#000';
  ctx.fillRect(x - P, head - P, w + P * 2, P);
}

// The field's shack: a trough on the ground beside it. A U: the notch of white
// between the two walls is what makes it a vessel, and a solid block at the
// foot of a wall is a buttress. On the shed's far side from the plots, the one
// piece of ground at this site with nothing on it.
function farmTrough({ x }) {
  const foot = S.groundY;
  ctx.fillStyle = '#000';
  ctx.fillRect(x - P * 5, foot - P, P * 4, P);
  ctx.fillRect(x - P * 5, foot - P * 2, P, P);
  ctx.fillRect(x - P * 2, foot - P * 2, P, P);
}

// Both sheds rise out of the ground while being built, like every other
// building: neither site is *drawn* as a building (a hole, a row of furrows),
// so the shed that carries each one's board is what the rise clips.
export function drawFarmShed() {
  const rising = risingAt('farm') && 'farm';
  if (!S.farmOpen && !rising) return;
  const r = farmShed();
  withRise(rising, r.x, S.groundY, r.w, r.h, () => drawShed(r, farmTrough));
}

export function drawQuarryShed() {
  const rising = risingAt('quarry') && 'quarry';
  if (!S.quarryOpen && !rising) return;
  const r = quarryShed();
  withRise(rising, r.x, S.groundY, r.w, r.h, () => drawShed(r, quarryBeam));
}



