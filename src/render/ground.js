// The ground line, the hole in it and what is lying in the hole. Extracted
// verbatim from render.js; behavior unchanged. Owns drawGroundLine,
// drawPitOutline, drawPit, drawPitCores and drawGrid. ctx comes from ./ctx.js
// and the mark from ./marks.js.

import { CORE_CELL, CORE_SIZE } from '../config.js';
import { at, bottomY } from '../grid.js';
import { heldInHole, pitDepth } from '../pit.js';
import { S, floor, pit } from '../state.js';
import { drawCoreGlow } from './cores.js';
import { ctx } from './ctx.js';
import { drawMark } from './marks.js';

// push whatever changed into the scratch canvas, then blit it into the world at
// grain size. Cores are drawn on top, as circles, not as pixels
// The ground runs up to the lip and picks up again past the far wall. It is
// drawn before the rock, so the rock's foot stands over it: the couple of cells
// the rock sinks below the line then read as the rock being in front of the
// ground rather than buried in it.
export function drawGroundLine() {
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#000';
  ctx.beginPath();
  ctx.moveTo(0, S.groundY + 1);
  ctx.lineTo(pit.x - 1, S.groundY + 1);
  ctx.moveTo(pit.x + pit.w + 1, S.groundY + 1);
  ctx.lineTo(S.worldW, S.groundY + 1);
  ctx.stroke();
}

// the walls and floor of the pit, over the pile so the hole keeps its edges
export function drawPitOutline() {
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#000';
  ctx.beginPath();
  ctx.moveTo(pit.x - 1, S.groundY + 1);
  ctx.lineTo(pit.x - 1, S.groundY + pitDepth() + 1);
  ctx.lineTo(pit.x + pit.w + 1, S.groundY + pitDepth() + 1);
  ctx.lineTo(pit.x + pit.w + 1, S.groundY + 1);
  ctx.stroke();
}

export function drawPit() {
  pit.painter.paint(ctx, pit.x, pit.y, pit.w, pit.h);
  drawPitCores();
}

// Everything in the pile that is not dust: cores, and whatever the sites have
// given up. The pile shows exactly what you hold, so spending takes them back
// out of it.
// A core in the pile is drawn at the size a core is everywhere else in the game:
// the same ring you picked up off the ground and carried here. It holds one cell
// like any other grain -- it heaps and settles as one -- but a cell is six pixels
// and a six-pixel ring in a plot of grey speckle is a grain that happens to be
// pale. You put it in the hole and it vanished. So the mark is the size of the
// thing, not the size of its cell, and the dust behind it is covered the way it
// is behind a core lying in the yard.
//
// Where the cores in the pile were last found.
//
// The hole is six hundred cells by seventy-one, and looking in every one of them
// for a core is forty-three thousand reads a frame to find, at most a handful --
// 0.1 ms a frame, and the largest single thing left in the draw once the rock
// and the counter were dealt with.
//
// Two facts make it cheap. The counter knows how many there are to find: the
// pile holds exactly what you hold (`seedPitCores`), and every way of spending
// one takes its cell out in the same breath as the count, so the pile never has
// more cores in it than `S.cores` says -- nought means there is nothing to look
// for, and finding the last one means there is nothing left to look for. And a
// core that has not moved is still where it was, so the cells it was found in
// are checked first: `S.cores` reads instead of forty-three thousand. If every
// one of them still holds a core then those are all of them, in the order a
// fresh search would have found them, because there cannot be a further one.
// Anything else -- a core settling a row, one spent, one arriving -- fails the
// check and the pile is searched again that frame. A search that did not find
// as many as the counter claims is not evidence of anything: a list shorter than
// the count fails the very first test next frame, so the pile is looked through
// again. That is the shape a dev hook's granted core leaves behind, and the
// answer to it is to look again rather than to trust a short list.
let coreCells = [];

export function drawPitCores() {
  // What is *in the hole*, not what you own: a core through the rift is not in
  // the pile to be found, and asking for it would fail the kept-cells check
  // every frame and search the whole hole again looking for something that is
  // in another dimension.
  const want = heldInHole('cores');
  if (!want) return;
  let kept = coreCells.length === want * 2;
  for (let i = 0; kept && i < coreCells.length; i += 2)
    kept = coreCells[i] < pit.cols && coreCells[i + 1] < pit.rows &&
           at(pit, coreCells[i], coreCells[i + 1]) === CORE_CELL;   // a re-dug hole is a new one
  if (!kept) {
    coreCells = [];
    let left = want;
    for (let r = 0; r < pit.rows && left; r++) {
      for (let c = 0; c < pit.cols && left; c++) {
        // only cores: everything else in the pile is painted with the dust
        if (at(pit, c, r) !== CORE_CELL) continue;
        coreCells.push(c, r);
        left--;
      }
    }
  }
  const pad = CORE_SIZE / 2 + 1;
  for (let i = 0; i < coreCells.length; i += 2) {
    const x = pit.x + coreCells[i] * pit.p, y = bottomY(pit) - (coreCells[i + 1] + 1) * pit.p;
    const cx = Math.min(Math.max(x + pit.p / 2, pit.x + pad), pit.x + pit.w - pad);
    const cy = Math.min(Math.max(y + pit.p / 2, pit.y + pad), bottomY(pit) - pad);
    // It does not stop giving off whatever it gives off because you put it
    // somewhere. A hole with a few of them in it is a hole with a few of them
    // in it, and the counter is not the only place that should say so.
    drawCoreGlow(cx, cy);
    drawMark(CORE_CELL, cx, cy, CORE_SIZE, true);
  }
  ctx.fillStyle = '#000';
}

// the ground, through its own painter for the same reason as the pit: an
// under-staffed yard can leave fifty thousand grains lying about
export function drawGrid(b) {
  b.painter.paint(ctx, b.x, b.y, b.cols * b.p, b.rows * b.p);
}

// The yard's own floor, which is the one `drawGrid` is asked for in the frame.
export function drawFloor() {
  drawGrid(floor);
}
