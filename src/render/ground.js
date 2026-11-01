// The ground line, the hole in it and what is lying in the hole.

import { GROUND_INK, GROUND_TEXTURE, GROUND_TILE, P, ACT_CRATER, CRATER_IN_S } from '../config.js';
import { craterNow, craterMid, craterCol } from '../crater.js';
import { fallNow } from '../actbeats.js';
import { themeGen } from '../ink.js';
import { pitDepth } from '../pit.js';
import { S, floor, pit } from '../state.js';
import { ctx } from './ctx.js';

// The ground runs up to the lip and picks up again past the far wall. Drawn
// before the rock, so the couple of cells the rock sinks below the line read
// as the rock being in front of the ground rather than buried in it.
// Where the house's rock lies the line runs down round the crater it made
// (crater.js), a cell a column, the ground's face above it the bowl's far
// bank; knocked in at the impact, faded in over its first frames.
export function drawGroundLine() {
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#000';
  const deep = craterNow(), c = craterMid(), half = ACT_CRATER.half * P, y = S.groundY + 1;
  const f = fallNow(), a = f && f.rock >= 1 ? Math.min(1, (f.u || 0) / CRATER_IN_S) : 1;
  ctx.beginPath();
  ctx.moveTo(0, y);
  if (deep > 0) {
    ctx.lineTo(c - half, y);
    ctx.moveTo(c + half, y);
  }
  ctx.lineTo(pit.x - 1, y);
  ctx.moveTo(pit.x + pit.w + 1, y);
  ctx.lineTo(S.worldW, y);
  ctx.stroke();
  if (deep <= 0) return;
  const was = ctx.globalAlpha;
  if (a < 1) {
    ctx.globalAlpha = was * (1 - a);
    ctx.beginPath(); ctx.moveTo(c - half, y); ctx.lineTo(c + half, y); ctx.stroke();
  }
  ctx.globalAlpha = was * a;
  ctx.beginPath();
  ctx.moveTo(c - half, y);
  for (let i = -ACT_CRATER.half; i < ACT_CRATER.half; i++) {
    const d = y + craterCol(i, deep) * P;
    ctx.lineTo(c + i * P, d);
    ctx.lineTo(c + (i + 1) * P, d);
  }
  ctx.lineTo(c + half, y);
  ctx.stroke();
  ctx.globalAlpha = was;
}

// The ground's grain: a repeating tile of cell-sized marks below the line
// either side of the hole. Built once per setting and cached: a fillRect with
// a pattern is one call a frame, where a mark a cell would be a hundred
// thousand.
let tileKey = '';   // cache: the key of tilePat
let tilePat = null;   // cache: keyed by tileKey (the ground's texture settings)
const hash = (c, r) => {
  let h = (Math.imul(c, 374761393) + Math.imul(r, 668265263)) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return (h ^ (h >>> 16)) >>> 0;
};
function groundPattern() {
  const key = `${GROUND_TEXTURE}/${GROUND_TILE}/${GROUND_INK}/${themeGen}`;
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
