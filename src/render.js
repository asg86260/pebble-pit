// Everything the game draws, and nothing that decides anything.
//
// Painting order is the whole trick: the rock goes down over the ground line so
// it stands in front of it, the crew and the spoil go over the rock, and the pit
// is blitted from its own scratch canvas rather than drawn a grain at a time.

import { P, SHADES, CORE_CELL, CORE_SIZE, WORKER, ROCK_SINK, TARGET, FARM_H } from './config.js';
import { S, floor, pit, bench, cave, farm, lab, meteor } from './state.js';
import { at, bottomY, shadeOf, depthShade, count } from './grid.js';
import { rockLeft, overRock, standOn } from './world.js';
import { boulderAlive, depthOf, cellPos } from './rock.js';
import { coreHome } from './core.js';
import { pitPix, pitPixCtx, SHADE_RGBA } from './pit.js';
import { AIR } from './air.js';
import { capacity } from './upgrades.js';
import { underground } from './cave.js';
import { bedX, bedTop } from './farm.js';
import { charge } from './meteor.js';
import { fmt } from './board.js';
import { drawAir } from './air.js';

const canvas = document.getElementById('c');
export const ctx = canvas.getContext('2d');
export { canvas };

// a shard: a triangle, filled or hollow, the mark that means the cave
export function drawTriangle(x, y, r, hollow) {
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.lineTo(x + r, y + r * 0.8);
  ctx.lineTo(x - r, y + r * 0.8);
  ctx.closePath();
  if (hollow) {
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#000';
    ctx.stroke();
  } else {
    ctx.fillStyle = '#000';
    ctx.fill();
  }
  ctx.fillStyle = '#000';
}

// The mouth of the cave: a shaft going down, so the ground line breaks across it
// and the dark carries on below. Drawn downwards rather than as an arch standing
// on the ground, which read as a black lozenge sitting on a wire.
export function drawCave() {
  if (!S.caveOpen) return;
  const { x, y, w, h } = cave;
  const lip = P * 2;

  ctx.fillStyle = '#fff';                  // the ground line stops at the hole
  ctx.fillRect(x - 1, y - 1, w + 2, 5);

  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + w, y);
  ctx.lineTo(x + w - lip, y + h);          // it narrows as it goes down
  ctx.lineTo(x + lip, y + h);
  ctx.closePath();
  ctx.fill();

  // the ground either side of it, thickened into a lip you could stand on
  ctx.fillRect(x - P * 3, y, P * 3, 3);
  ctx.fillRect(x + w, y, P * 3, 3);

  // whatever has just been brought up, rising over the mouth
  for (const f of S.finds) {
    ctx.globalAlpha = Math.max(0, 1 - f.t / 1.6);
    drawTriangle(f.x, f.y, P, false);
    ctx.globalAlpha = 1;
  }
  ctx.fillStyle = '#000';
}

// a spore: a diamond, the mark that means the farm
export function drawDiamond(x, y, r) {
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.lineTo(x + r, y);
  ctx.lineTo(x, y + r);
  ctx.lineTo(x - r, y);
  ctx.closePath();
  ctx.fillStyle = '#000';
  ctx.fill();
}

// The beds: a stalk per bed, as tall as the bed is far along, with a diamond on
// top once it is ripe. A bare bed is a notch in the ground, so an untended farm
// still reads as a farm.
export function drawFarm() {
  if (!S.farmOpen) return;
  ctx.fillStyle = '#000';
  for (let i = 0; i < S.beds.length; i++) {
    const x = Math.round(bedX(i));
    ctx.fillRect(x - P, S.groundY - 2, P * 2, 3);          // the bed itself
    const top = Math.round(bedTop(i));
    if (S.beds[i] > 0.02) ctx.fillRect(x - 1, top, 2, S.groundY - top);
    if (S.beds[i] >= 1) drawDiamond(x, top - P, P);
  }

  for (const c of S.crop) {
    ctx.globalAlpha = Math.max(0, 1 - c.t / 1.6);
    drawDiamond(c.x, c.y, P);
    ctx.globalAlpha = 1;
  }
  ctx.fillStyle = '#000';
}

// The lab: a squat block with a chimney. Flat black shapes, like everything
// else that stands on this ground.
// a spark: a four-armed cross, the mark that means the meteor
export function drawSpark(x, y, r) {
  ctx.fillStyle = '#000';
  ctx.fillRect(x - r / 3, y - r, r * 2 / 3, r * 2);
  ctx.fillRect(x - r, y - r / 3, r * 2, r * 2 / 3);
}

// The meteor: a plain black circle hanging in the sky, with a ring round it that
// closes as it charges, so you can see one is due without a bar or a number.
export function drawMeteor() {
  if (!S.meteorOpen) return;
  const { x, y, r } = meteor;

  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();

  const c = charge(performance.now());
  if (c > 0) {
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y, r + 8, -Math.PI / 2, -Math.PI / 2 + c * Math.PI * 2);
    ctx.stroke();
  }

  for (const f of S.falling) drawSpark(f.x, f.y, P);
  ctx.fillStyle = '#000';
}

export function drawLab() {
  if (!S.labOpen) return;
  const { x, y, w, h } = lab;
  ctx.fillStyle = '#000';
  ctx.fillRect(x, y + h * 0.35, w, h * 0.65);              // the body
  ctx.fillRect(x + w * 0.18, y, w * 0.2, h * 0.35);        // a chimney
  ctx.fillStyle = '#fff';
  ctx.fillRect(x + w * 0.55, y + h * 0.55, P * 3, P * 3);  // a window
  ctx.fillStyle = '#000';
}

export function drawCircle(cxp, cyp, r) {
  ctx.beginPath();
  ctx.arc(cxp, cyp, r, 0, Math.PI * 2);
  ctx.fillStyle = '#fff';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#000';
  ctx.stroke();
  ctx.fillStyle = '#000';
}

export function drawCoreAt(x, y) {
  // radius allows for the 2px stroke, so the circle stays inside its box and
  // never paints over the ground line it is resting on
  drawCircle(x + CORE_SIZE / 2, y + CORE_SIZE / 2, CORE_SIZE / 2 - 2);
}

// buried in the rock: drawn first so the boulder covers it until you dig it out
export function drawCoreBehind() {
  if (S.heldCore || S.coreItem || !boulderAlive()) return;
  const h = coreHome();
  drawCoreAt(h.x, h.y);
}

// out in the world: on the cursor or lying on the ground
export function drawCore() {
  if (S.heldCore) drawCoreAt(S.mouse.x - CORE_SIZE / 2, S.mouse.y - CORE_SIZE / 2);
  else if (S.coreItem) drawCoreAt(S.coreItem.x, S.coreItem.y);
}

// dust hanging in the air, thrown off the piles themselves: the more dust is
// lying about, the more of it drifts. They pass at their own rate as the view
// scrolls, so movement reads without any furniture in the background
export function stepPaid() {
  const tx = bench.x + bench.w / 2, ty = bench.y - P * 2;
  for (let i = S.paid.length - 1; i >= 0; i--) {
    const m = S.paid[i];
    m.t += m.rate;
    if (m.t >= 1) { S.paid.splice(i, 1); continue; }
    if (m.t <= 0) continue;

    const e = m.t * m.t * (3 - 2 * m.t);           // ease in and out
    m.x = m.x0 + (tx - m.x0) * e;
    m.y = m.y0 + (ty - m.y0) * e - Math.sin(e * Math.PI) * m.lift;
  }
}

export function drawPaid() {
  let shade = 0;
  for (const m of S.paid) {
    if (m.s !== shade) { shade = m.s; ctx.fillStyle = shadeOf(m.s); }
    ctx.fillRect(Math.round(m.x), Math.round(m.y), P, P);
  }
  ctx.fillStyle = '#000';
}


export function drawCount() {
  ctx.font = '13px ui-monospace, "Courier New", monospace';
  ctx.textAlign = 'left';

  // over the pit mouth, but kept on screen as you scroll along it
  const x = Math.max(S.camX + P * 3, Math.min(pit.x + P * 4, S.camX + S.viewW - P * 30));
  const y = Math.min(S.groundY - P * 3, S.camY + S.viewH - P * 3);

  // a grain of dust, then the count of it
  ctx.fillStyle = '#000';
  ctx.fillRect(x, y - P, P, P);
  ctx.fillText(fmt(Math.round(S.shownStored)), x + P * 2, y);

  // a core, then the count of those
  let row = y;
  if (S.seenCore) {
    row -= P * 3;
    drawCircle(x + P / 2, row - P / 2, P / 2 + 1);
    ctx.fillStyle = '#000';
    ctx.fillText(String(S.cores), x + P * 2, row);
  }

  // and a shard, once the cave has given one up
  if (S.seenShard) {
    row -= P * 3;
    drawTriangle(x + P / 2, row - P / 2 - 1, P / 2 + 1, false);
    ctx.fillStyle = '#000';
    ctx.fillText(fmt(S.shards), x + P * 2, row);
  }

  // and a spore, once the farm has grown one
  if (S.seenSpore) {
    row -= P * 3;
    drawDiamond(x + P / 2, row - P / 2, P / 2 + 1);
    ctx.fillStyle = '#000';
    ctx.fillText(fmt(S.spores), x + P * 2, row);
  }

  // and a spark, once one has come down
  if (S.seenSpark) {
    row -= P * 3;
    drawSpark(x + P / 2, row - P / 2, P / 2 + 1);
    ctx.fillStyle = '#000';
    ctx.fillText(fmt(S.sparks), x + P * 2, row);
  }
}

export function drawBench() {
  ctx.fillStyle = '#000';
  ctx.fillRect(bench.x, bench.y, bench.w, P * 2);                       // top slab
  ctx.fillRect(bench.x + P, bench.y + P * 2, P * 2, bench.h - P * 2);   // legs
  ctx.fillRect(bench.x + bench.w - P * 3, bench.y + P * 2, P * 2, bench.h - P * 2);
  ctx.fillRect(bench.x + P * 4, bench.y - P * 2, P * 2, P * 2);         // something clamped to it
  if (S.boardOpen) return;
  ctx.fillRect(bench.x + bench.w / 2 - P / 2, bench.y - P * 5, P, P);   // a dot when idle
}

export function drawWorkers() {
  for (const w of S.workers) {
    if (underground(w)) continue;          // down the cave, not on the surface

    if (w.type === 'farmhand') {
      const x = Math.round(w.x), y = Math.round(w.y);
      ctx.fillRect(x, y, WORKER, WORKER);
      ctx.fillStyle = '#fff';
      ctx.fillRect(x + P, y + P * 2, P, P);   // stooped: the notch is low
      ctx.fillStyle = '#000';
      continue;
    }

    if (w.type === 'spelunker') {
      const x = Math.round(w.x), y = Math.round(w.y);
      ctx.fillRect(x, y, WORKER, WORKER);
      ctx.fillStyle = '#fff';
      ctx.fillRect(x + P, y, P, P);         // a lamp on its head
      ctx.fillStyle = '#000';
      if (w.carry) drawTriangle(x + WORKER / 2, y - P * 2, P, false);
      continue;
    }

    if (w.type === 'miner') {
      ctx.fillRect(Math.round(w.x), Math.round(w.y), WORKER, WORKER);
      ctx.fillStyle = '#fff';
      ctx.fillRect(Math.round(w.x) + P, Math.round(w.y) + P, P, P);    // hollow centre
      ctx.fillStyle = '#000';
    } else {
      const y = standOn(S.groundY);
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.strokeRect(Math.round(w.x) + 1, y + 1, WORKER - 2, WORKER - 2);
      // the load rides overhead, stacked two abreast
      const left = Math.round(w.x) + (WORKER - P * 2) / 2;
      for (let i = 0; i < Math.min(w.carry, 24); i++) {
        ctx.fillStyle = shadeOf(w.load?.[i] || 1);
        ctx.fillRect(left + (i % 2) * P, y - P * (Math.floor(i / 2) + 1), P, P);
      }
      ctx.fillStyle = '#000';
      if (w.hasCore) {
        const stack = Math.ceil(Math.min(w.carry, 24) / 2);        // ride above the dust
        drawCircle(Math.round(w.x) + WORKER / 2, y - P * (stack + 2), P * 1.2);
      }
    }
  }
}

export function draw() {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = '#fff';                       // the page is painted, not assumed
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawAir();

  ctx.save();
  const k = S.zoom * S.dpr;
  ctx.setTransform(k, 0, 0, k, Math.round(-S.camX * k), Math.round(-S.camY * k));
  drawCoreBehind();
  drawGroundLine();
  drawCave();              // a hole in the ground, so it goes down with the ground
  drawFarm();
  drawLab();
  drawMeteor();
  ctx.fillStyle = '#000';

  const deep = depthOf();
  let shade = 0;
  for (let y = 0; y < S.gh; y++) {
    for (let x = 0; x < S.gw; x++) {
      const v = S.boulder[y][x];
      if (!v) continue;
      const band = depthShade(v, deep);
      if (band !== shade) { shade = band; ctx.fillStyle = shadeOf(band); }
      const { px, py } = cellPos(x, y);
      ctx.fillRect(px, py, P, P);
    }
  }

  ctx.fillStyle = '#000';

  for (const ch of S.chips) {
    ctx.fillStyle = shadeOf(ch.s);
    ctx.fillRect(Math.round(ch.x), Math.round(ch.y), P, P);
  }
  ctx.fillStyle = '#000';

  drawGrid(floor);
  drawPit();

  drawPitOutline();

  drawPaid();
  drawBench();
  drawCount();
  drawCore();
  drawWorkers();
  drawCursor();
  ctx.restore();

}

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
  ctx.lineTo(pit.x - 1, S.groundY + pit.h + 1);
  ctx.lineTo(pit.x + pit.w + 1, S.groundY + pit.h + 1);
  ctx.lineTo(pit.x + pit.w + 1, S.groundY + 1);
  ctx.stroke();
}

export function drawPit() {
  if (!S.pitImage || pitPix.width !== pit.cols || pitPix.height !== pit.rows) {
    pitPix.width = pit.cols;
    pitPix.height = pit.rows;
    S.pitImage = pitPixCtx.createImageData(pit.cols, pit.rows);
    S.pitPainted = false;
  }

  if (!S.pitPainted) { S.pitLo = 0; S.pitHi = pit.cols - 1; S.pitTop = 0; S.pitBot = pit.rows - 1; }

  if (S.pitHi >= S.pitLo && S.pitTop >= 0) {
    const d = S.pitImage.data;
    for (let r = S.pitTop; r <= S.pitBot; r++) {
      // row 0 is the floor of the pit, so the image is drawn upside down
      const py = pit.rows - 1 - r;
      for (let c = S.pitLo; c <= S.pitHi; c++) {
        const v = at(pit, c, r);
        const i = (py * pit.cols + c) * 4;
        if (!v) { d[i + 3] = 0; continue; }
        const rgba = SHADE_RGBA[Math.min(SHADES.length, Math.max(1, v)) - 1];
        d[i] = rgba[0]; d[i + 1] = rgba[1]; d[i + 2] = rgba[2]; d[i + 3] = 255;
      }
    }
    pitPixCtx.putImageData(S.pitImage, 0, 0, S.pitLo, pit.rows - 1 - S.pitBot,
                           S.pitHi - S.pitLo + 1, S.pitBot - S.pitTop + 1);
    S.pitPainted = true;
    S.pitLo = pit.cols; S.pitHi = -1; S.pitTop = -1; S.pitBot = 0;
  }

  const sm = ctx.imageSmoothingEnabled;
  ctx.imageSmoothingEnabled = false;       // grains are squares, not smudges
  ctx.drawImage(pitPix, pit.x, pit.y, pit.w, pit.h);
  ctx.imageSmoothingEnabled = sm;

  drawPitCores();
}

// a core draws bigger than the grain it sits in, so keep the whole circle inside
// the pile's walls and floor rather than letting it poke through
export function drawPitCores() {
  const rad = P * 1.2, pad = rad + 2;
  for (let r = 0; r < pit.rows; r++) {
    for (let c = 0; c < pit.cols; c++) {
      if (at(pit, c, r) !== CORE_CELL) continue;
      const x = pit.x + c * pit.p, y = bottomY(pit) - (r + 1) * pit.p;
      drawCircle(Math.min(Math.max(x + pit.p / 2, pit.x + pad), pit.x + pit.w - pad),
                 Math.min(Math.max(y + pit.p / 2, pit.y + pad), bottomY(pit) - pad), rad);
    }
  }
  ctx.fillStyle = '#000';
}

export function drawGrid(b) {
  let shade = 0;
  const buried = [];
  for (let r = 0; r < b.rows; r++) {
    for (let c = 0; c < b.cols; c++) {
      const v = at(b, c, r);
      if (!v) continue;
      const x = b.x + c * b.p, y = bottomY(b) - (r + 1) * b.p;
      if (v === CORE_CELL) { buried.push([x, y]); continue; }
      if (v !== shade) { shade = v; ctx.fillStyle = shadeOf(v); }
      ctx.fillRect(x, y, b.p, b.p);
    }
  }
  // a core draws bigger than the cell it sits in, so keep the whole circle inside
  // the pile's walls and floor rather than letting it poke through
  const rad = P * 1.2, pad = rad + 2;
  for (const [x, y] of buried) {
    const cxp = Math.min(Math.max(x + P / 2, b.x + pad), b.x + b.cols * P - pad);
    const cyp = Math.min(Math.max(y + P / 2, b.y + pad), bottomY(b) - pad);
    drawCircle(cxp, cyp, rad);
  }
  ctx.fillStyle = '#000';
}

// the carried dust drifts loosely around the cursor
export function drawCursor() {
  if (!S.held) return;
  const t = performance.now() / 1000;
  let shade = 0;
  for (const m of S.motes) {
    m.a += m.spin;
    if (m.s !== shade) { shade = m.s; ctx.fillStyle = shadeOf(m.s); }
    const x = S.mouse.x + Math.cos(m.a) * m.d + Math.sin(t * 1.7 + m.bob) * 2;
    const y = S.mouse.y + Math.sin(m.a) * m.d + Math.cos(t * 1.3 + m.bob) * 2;
    ctx.fillRect(Math.round(x), Math.round(y), P, P);
  }
  ctx.fillStyle = '#000';
}

// the board opens when the cursor comes near the bench. There is nothing to
// click: the ground round it sweeps like anywhere else
