// The ground line, the hole in it and what is lying in the hole.

import { CORE_CELL, CORE_SIZE, GROUND_INK, GROUND_TEXTURE, GROUND_TILE, P } from '../config.js';
import { at, bottomY } from '../grid.js';
import { heldInHole, pitDepth } from '../pit.js';
import { S, floor, pit } from '../state.js';
import { drawCoreGlow } from './cores.js';
import { ctx } from './ctx.js';
import { drawMark } from './marks.js';

// The ground runs up to the lip and picks up again past the far wall. Drawn
// before the rock, so the couple of cells the rock sinks below the line read
// as the rock being in front of the ground rather than buried in it.
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

// The ground's grain: a repeating tile of cell-sized marks below the line
// either side of the hole. Built once per setting and cached: a fillRect with
// a pattern is one call a frame, where a mark a cell would be a hundred
// thousand.
let tileKey = '';
let tilePat = null;
const hash = (c, r) => {
  let h = (Math.imul(c, 374761393) + Math.imul(r, 668265263)) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return (h ^ (h >>> 16)) >>> 0;
};
function groundPattern() {
  const key = `${GROUND_TEXTURE}/${GROUND_TILE}/${GROUND_INK}`;
  if (key === tileKey) return tilePat;
  tileKey = key;
  const n = GROUND_TILE;
  // the stipple repeats over a wide tile so its randomness does not read as a grid
  const reps = GROUND_TEXTURE === 4 ? 8 : 1;
  const side = n * reps;
  const off = document.createElement('canvas');
  off.width = off.height = side * P;
  const c = off.getContext('2d');
  c.fillStyle = `rgba(0,0,0,${GROUND_INK})`;
  for (let r = 0; r < side; r++) for (let x = 0; x < side; x++) {
    let on = false;
    if (GROUND_TEXTURE === 1) on = x % n === n >> 1 && r % n === n >> 1;
    else if (GROUND_TEXTURE === 2) on = (x + r) % n === 0;
    else if (GROUND_TEXTURE === 3) on = r % n === 0;
    else if (GROUND_TEXTURE === 4) on = hash(x, r) % (n * n / 3 | 0) === 0;
    if (on) c.fillRect(x * P, r * P, P, P);
  }
  tilePat = ctx.createPattern(off, 'repeat');
  return tilePat;
}
export function drawGroundTexture() {
  if (!GROUND_TEXTURE) return;
  const pat = groundPattern();
  if (!pat) return;
  ctx.fillStyle = pat;
  const y = S.groundY + P, h = S.worldH - y;
  ctx.fillRect(0, y, pit.x - 1, h);
  ctx.fillRect(pit.x + pit.w + 1, y, S.worldW - pit.x - pit.w - 1, h);
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

// Everything in the pile that is not dust. A core in the pile is drawn at the
// size a core is everywhere else: a six-pixel ring in a plot of gray speckle
// is a grain that happens to be pale.
//
// Where the cores in the pile were last found. Searching every cell of the
// hole is forty-three thousand reads a frame, so the cells they were found in
// are checked first: the pile never holds more cores than the count says
// (`seedPitCores`, and every spend takes the cell out with the count), so if
// every kept cell still holds a core those are all of them. Anything else
// fails the check and the pile is searched again that frame; a list shorter
// than the count (a dev hook's granted core) fails the first test next frame.
let coreCells = [];

export function drawPitCores() {
  // What is *in the hole*, not what you own: a core through the rift is not
  // in the pile to be found, and asking for it would search the whole hole
  // every frame.
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
    // It does not stop giving off what it gives off because you put it
    // somewhere.
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
