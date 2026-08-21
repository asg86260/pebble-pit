// Everything the game draws, and nothing that decides anything.
//
// Painting order is the whole trick: the rock goes down over the ground line so
// it stands in front of it, the crew and the spoil go over the rock, and the pit
// is blitted from its own scratch canvas rather than drawn a grain at a time.

import { P, SHADES, CORE_CELL, SHARD_CELL, SPORE_CELL, SPARK_CELL,
         CORE_SIZE, WORKER, ROCK_SINK, TARGET, FARM_H } from './config.js';
import { S, floor, pit, bench, cave, farm, lab, meteor } from './state.js';
import { at, bottomY, shadeOf, isDust, depthShade, count } from './grid.js';
import { rockLeft, overRock, standOn } from './world.js';
import { boulderAlive, depthOf, cellPos, rockTopY } from './rock.js';
import { coreHome } from './core.js';

import { AIR } from './air.js';
import { capacity, benchMark } from './upgrades.js';
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
    ctx.lineWidth = Math.max(1, r / 3);
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

  ctx.fillStyle = '#000';
}

// a diamond: no longer a currency mark, kept because it is a shape worth having
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

// The beds: a stalk per bed, as tall as the bed is far along, with a spore on
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
    if (S.beds[i] >= 1) drawMark(SPORE_CELL, x, top - P);
  }

  ctx.fillStyle = '#000';
}

// The one mark for each kind of thing, wherever it is being drawn: lying on the
// ground waiting to be fetched, or rising off the worker that just got it.
// One grain, one cell -- for these as much as for dust. They were drawn at a
// radius of a whole cell, which makes a mark two cells across, so two of them
// side by side overlapped and a column of them ran into each other. A mark is
// the size of the thing it stands for, and the thing it stands for is one grain.
// One glyph, one size, everywhere a grain is drawn outside the sand painter: in
// the air, on the ground, in the pile, on the cursor and in a worker's hands.
//
// Every one is drawn inside the same cell-sized box, centred on `x, y`. A cell
// is what a grain occupies and what it collides as, so a mark bigger than its
// cell is a mark that lies about where the thing is -- and marks of different
// sizes read as different amounts of something rather than different things.
export function drawMark(v, x, y, size = P) {
  const h = size / 2;
  if (isDust(v)) {
    ctx.fillStyle = shadeOf(v);
    ctx.fillRect(Math.round(x - h), Math.round(y - h), size, size);
    return;
  }
  ctx.fillStyle = '#000';
  if (v === CORE_CELL) {
    const lw = Math.max(1, size / 4);
    ctx.beginPath();
    ctx.arc(x, y, Math.max(0.5, h - lw / 2), 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.lineWidth = lw;
    ctx.strokeStyle = '#000';
    ctx.stroke();
  } else if (v === SHARD_CELL) {
    ctx.beginPath();
    ctx.moveTo(x, y - h);
    ctx.lineTo(x + h, y + h);
    ctx.lineTo(x - h, y + h);
    ctx.closePath();
    ctx.fill();
  } else if (v === SPORE_CELL) {
    const k = h * 0.866;                       // flat-topped, so it fills the width
    ctx.beginPath();
    ctx.moveTo(x - h, y);
    ctx.lineTo(x - h / 2, y - k);
    ctx.lineTo(x + h / 2, y - k);
    ctx.lineTo(x + h, y);
    ctx.lineTo(x + h / 2, y + k);
    ctx.lineTo(x - h / 2, y + k);
    ctx.closePath();
    ctx.fill();
  } else {
    const t = size / 3;
    ctx.fillRect(x - t / 2, y - h, t, size);
    ctx.fillRect(x - h, y - t / 2, size, t);
  }
  ctx.fillStyle = '#000';
}

// A station whose pile is full has stopped, and says so: a bar over it, which is
// the one mark in the game that means nothing is happening. It sits above the
// station rather than above the pile, because the station is the thing that has
// stopped and the pile is only why.
export function drawPileMarks() {
  ctx.fillStyle = '#000';
  for (const p of S.piles) {
    if (!S.pileFull[p.key]) continue;
    const at = pileMarkAt(p.key);
    // a warning triangle: hollow, with a bar and a dot inside it. A triangle
    // sits low in its own outline, so the mark hangs below the middle of it.
    drawTriangle(at.x, at.y, P * 4, true);
    ctx.fillStyle = '#000';
    ctx.fillRect(at.x - P / 2, at.y - P, P, P * 2);
    ctx.fillRect(at.x - P / 2, at.y + P * 2, P, P);
  }
}

// Under the station, not over it: the pile is the station's problem and the mark
// belongs with the thing that has stopped, and there is nothing else down there
// to read it against. It sits below the ground line, in the space the pit's
// depth already keeps clear on screen.
export function pileMarkAt(key) {
  const x = key === 'rock' ? S.cx
          : key === 'cave' ? cave.x + cave.w / 2
          : farm.x + farm.w / 2;
  return { x: Math.round(x / P) * P, y: S.groundY + P * 7 };
}

// where the cursor has to be to be asking about one
export function overPileMark(key, mx, my) {
  const at = pileMarkAt(key);
  return Math.abs(mx - at.x) < P * 5 && Math.abs(my - at.y) < P * 5;
}

// whatever is not dust, lying in the yard where it was dropped or dumped
export function drawFloorMarks() {
  ctx.fillStyle = '#000';
  for (const m of S.floorMarks) drawMark(m.v, m.x, m.y);
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
  ctx.lineWidth = Math.max(1, r / 3);
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


// The counter is the one thing here that is read rather than looked at, so it is
// drawn in **screen** pixels and stays the size it is however far the yard has
// been scaled down to fit the window. Everything else is world furniture and a
// cell is a cell; a number you have to squint at is just a number you cannot
// read. It still sits over the pit mouth, and still slides along to stay on
// screen as you scroll the length of the hole.
const MARK = 9;          // a mark on the counter, in screen pixels
const ROW = 19;          // and the gap between one row and the next

export function drawCount() {
  ctx.setTransform(S.dpr, 0, 0, S.dpr, 0, 0);
  ctx.font = '13px ui-monospace, "Courier New", monospace';
  ctx.textAlign = 'left';

  // The dust count is the widest thing on it and it grows a digit at a time, so
  // the room it needs is measured rather than guessed: a counter that clips its
  // own number at seven figures is a counter that fails exactly when it matters.
  const dust = fmt(Math.round(S.shownStored));
  const wide = MARK * 2 + ctx.measureText(dust).width + 10;
  const x = Math.max(10, Math.min((pit.x + P * 4 - S.camX) * S.zoom, S.W - wide));
  const y = Math.min((S.groundY - P * 3 - S.camY) * S.zoom, S.H - 10);

  // a grain of dust, then the count of it
  ctx.fillStyle = '#000';
  ctx.fillRect(x, y - MARK, MARK, MARK);
  ctx.fillText(dust, x + MARK * 2, y);

  // then one row for every other kind, each shown only once you have seen one
  let row = y;
  // the same glyph the world draws, at the same size as each other
  const line = (seen, cell, text) => {
    if (!seen) return;
    row -= ROW;
    drawMark(cell, x + MARK / 2, row - MARK / 2, MARK);
    ctx.fillStyle = '#000';
    ctx.fillText(text, x + MARK * 2, row);
  };
  line(S.seenCore, CORE_CELL, String(S.cores));
  line(S.seenShard, SHARD_CELL, fmt(S.shards));
  line(S.seenSpore, SPORE_CELL, fmt(S.spores));
  line(S.seenSpark, SPARK_CELL, fmt(S.sparks));
}

// The bench is not in the yard until there is something on it worth buying, and
// once it is there it says so without being opened: a dot for something you can
// afford this second, a flag for a heading you have never seen. A flag is worth
// more than a dot -- one more row under `you` is not news, a whole new group is.
export function drawBench() {
  if (!S.seenBench) return;
  ctx.fillStyle = '#000';
  ctx.fillRect(bench.x, bench.y, bench.w, P * 2);                       // top slab
  ctx.fillRect(bench.x + P, bench.y + P * 2, P * 2, bench.h - P * 2);   // legs
  ctx.fillRect(bench.x + bench.w - P * 3, bench.y + P * 2, P * 2, bench.h - P * 2);
  ctx.fillRect(bench.x + P * 4, bench.y - P * 2, P * 2, P * 2);         // something clamped to it
  if (S.boardOpen) return;
  const x = bench.x + bench.w / 2 - P;             // a whole cell, so it stays square
  const mark = benchMark();
  if (mark === 'flag') {
    ctx.fillRect(x, bench.y - P * 7, P, P * 7);                         // a post on the bench
    ctx.fillRect(x + P, bench.y - P * 7, P * 2, P * 2);                 // with a flag on it
  } else if (mark === 'dot') {
    ctx.fillRect(x, bench.y - P * 5, P, P);                             // just a dot
  }
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
      if (w.carry) drawMark(SHARD_CELL, x + WORKER / 2, y - P * 2);
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
      // a load is drawn grain by grain as whatever each grain is, so a worker
      // walking a shard to the pit is visibly walking a shard to the pit
      for (let i = 0; i < Math.min(w.carry, 24); i++) {
        drawMark(w.load?.[i] || 1,
                 left + (i % 2) * P + P / 2,
                 y - P * (Math.floor(i / 2) + 1) + P / 2);
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

  // a chip is a grain in the air, drawn as whatever it is
  for (const ch of S.chips) drawMark(ch.s, Math.round(ch.x) + P / 2, Math.round(ch.y) + P / 2);
  ctx.fillStyle = '#000';

  drawGrid(floor);
  drawPit();

  drawPitOutline();

  drawPaid();
  drawBench();
  drawCore();
  drawFloorMarks();        // shards and the like lying in the yard
  drawPileMarks();         // and a bar over anything that has stopped for a full one
  drawWorkers();
  drawCursor();
  ctx.restore();

  drawCount();             // last, and in screen pixels: it is read, not looked at

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
  pit.painter.paint(ctx, pit.x, pit.y, pit.w, pit.h);
  drawPitCores();
}

// Everything in the pile that is not dust: cores, and whatever the sites have
// given up. The pile shows exactly what you hold, so spending takes them back
// out of it.
export function drawPitCores() {
  const rad = pit.p / 2, pad = rad;
  for (let r = 0; r < pit.rows; r++) {
    for (let c = 0; c < pit.cols; c++) {
      const v = at(pit, c, r);
      if (!v || isDust(v)) continue;
      const x = pit.x + c * pit.p, y = bottomY(pit) - (r + 1) * pit.p;
      const cx = Math.min(Math.max(x + pit.p / 2, pit.x + pad), pit.x + pit.w - pad);
      const cy = Math.min(Math.max(y + pit.p / 2, pit.y + pad), bottomY(pit) - pad);
      drawMark(v, cx, cy, pit.p);
    }
  }
  ctx.fillStyle = '#000';
}

// the ground, through its own painter for the same reason as the pit: an
// under-staffed yard can leave fifty thousand grains lying about
export function drawGrid(b) {
  b.painter.paint(ctx, b.x, b.y, b.cols * b.p, b.rows * b.p);
}

// the carried dust drifts loosely around the cursor
export function drawCursor() {
  if (!S.held) return;
  const t = performance.now() / 1000;
  for (const m of S.motes) {
    m.a += m.spin;
    const x = S.mouse.x + Math.cos(m.a) * m.d + Math.sin(t * 1.7 + m.bob) * 2;
    const y = S.mouse.y + Math.sin(m.a) * m.d + Math.cos(t * 1.3 + m.bob) * 2;
    drawMark(m.s, Math.round(x) + P / 2, Math.round(y) + P / 2);   // what it is, not a grain of dust
  }
  ctx.fillStyle = '#000';
}

// the board opens when the cursor comes near the bench. There is nothing to
// click: the ground round it sweeps like anywhere else
