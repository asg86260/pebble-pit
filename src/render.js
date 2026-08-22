// Everything the game draws, and nothing that decides anything.
//
// Painting order is the whole trick: the rock goes down over the ground line so
// it stands in front of it, the crew and the spoil go over the rock, and the pit
// is blitted from its own scratch canvas rather than drawn a grain at a time.

import { P, PIT_H, SMOKE_LIFE, SHADES, MARK_SIZE, FIND_COLOR, findKind, CORE_CELL, SHARD_CELL, SPORE_CELL,
         CORE_SIZE, WORKER, ROCK_SINK, TARGET, FARM_H } from './config.js';
import { S, floor, pit, bench, quarry, farm, lab, sky } from './state.js';
import { at, bottomY, shadeOf, isDust, depthShade, count } from './grid.js';
import { rockLeft, overRock, bridgeSpan } from './world.js';
import { boulderAlive, depthOf, cellPos, rockTopY } from './rock.js';
import { coreHome } from './core.js';

import { AIR } from './air.js';
import { capacity, benchMark } from './upgrades.js';
import { underground, quarryCut } from './quarry.js';
import { indoors } from './lab.js';
import { bedX, bedTop } from './farm.js';
import { fmt } from './board.js';
import { drawAir } from './air.js';
import { drawClouds, drawBirds } from './weather.js';
import { now } from './clock.js';

const canvas = document.getElementById('c');
export const ctx = canvas.getContext('2d');
export { canvas };

// a shard: a triangle, filled or hollow, the mark that means the quarry
export function drawTriangle(x, y, r, hollow) {
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.lineTo(x + r, y + r * 0.8);
  ctx.lineTo(x - r, y + r * 0.8);
  ctx.closePath();
  if (hollow) {
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.lineWidth = Math.max(1, r / 6);
    ctx.strokeStyle = '#000';
    ctx.stroke();
  } else {
    ctx.fillStyle = '#000';
    ctx.fill();
  }
  ctx.fillStyle = '#000';
}

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
  ctx.fillStyle = '#fff';
  ctx.fillRect(x, y - E, w, h + E);

  const pts = quarryCut().outline;
  ctx.strokeStyle = '#000';
  ctx.lineWidth = E;
  ctx.lineJoin = 'miter';
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.stroke();
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
// A bridge over the cut: a ramp up, a deck, a ramp down. Three lines, which is
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

  // The farm needs a silhouette or it is just texture on the ground line: a post
  // at either end of the row, with a stub of rail running off it, so the plot
  // reads as somewhere fenced and kept even when nothing is growing. Kept low
  // and thin -- it is there to bracket the beds, not to be the thing you look at.
  const postH = P * 6, gate = P * 3;
  ctx.fillStyle = '#000';
  for (const px of [farm.x - gate, farm.x + farm.w + gate - P]) {
    ctx.fillRect(px, S.groundY - postH, P, postH);
    ctx.fillRect(px + (px < farm.x ? P : -P * 2), S.groundY - postH + P * 2, P * 2, P);
  }

  // A bed is three cells across and two deep, with the earth turned over in it.
  // Small, but a shape rather than a scratch, and it has something in it even
  // when nobody has been by to tend it.
  for (let i = 0; i < S.beds.length; i++) {
    const x = Math.round(bedX(i) / P) * P;
    const soil = S.groundY - P * 2;

    ctx.fillStyle = '#000';
    ctx.fillRect(x - P, soil, P * 3, P * 2);           // the plot
    ctx.fillStyle = '#fff';
    ctx.fillRect(x - P, soil + P, P, P);              // earth turned over
    ctx.fillRect(x + P, soil, P, P);
    ctx.fillStyle = '#000';

    const grown = S.beds[i];
    if (grown <= 0.02) { ctx.fillRect(x, soil - P, P, P); continue; }

    const top = soil - Math.round(FARM_H * grown / P) * P;
    ctx.fillRect(x, top, P, soil - top);              // the stalk
    const tall = soil - top;
    if (tall > P * 3) ctx.fillRect(x - P, top + P * 2, P, P);   // a leaf either side
    if (tall > P * 5) ctx.fillRect(x + P, top + P * 4, P, P);

    if (grown >= 1) drawMark(S.bedTone[i] || SPORE_CELL, x + P / 2, top - P / 2);
  }
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
// `glyph` draws the shape it stands for, which is what the counter and anything
// else with room to spare wants. Out in the yard there is no room to spare: a
// find is a solid cell of its own colour, exactly as the painter draws it in a
// pile, because that is the only thing that tiles.
export function drawMark(v, x, y, size = MARK_SIZE, glyph = false) {
  if (isDust(v)) {                             // a grain of dust is a grain: one cell
    ctx.fillStyle = shadeOf(v);
    ctx.fillRect(Math.round(x - P / 2), Math.round(y - P / 2), P, P);
    return;
  }
  const tones = FIND_COLOR[findKind(v)];
  if (!glyph && tones) {
    ctx.fillStyle = tones[v - findKind(v)];
    ctx.fillRect(Math.round(x - P / 2), Math.round(y - P / 2), P, P);
    ctx.fillStyle = '#000';
    return;
  }
  // No backing square. It was there to keep two of these readable when they
  // overlapped, and they cannot overlap any more: a resting one stands in a slot
  // of its own. A white box behind a triangle is a white box on the ground.
  const h = size / 2;
  ctx.fillStyle = tones ? tones[Math.min(2, v - findKind(v))] : '#000';
  const kind = findKind(v) || v;
  if (v === CORE_CELL) {
    const lw = Math.max(1, size / 4);
    ctx.beginPath();
    ctx.arc(x, y, Math.max(0.5, h - lw / 2), 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.lineWidth = lw;
    ctx.strokeStyle = '#000';
    ctx.stroke();
  } else if (kind === SHARD_CELL) {
    ctx.beginPath();
    ctx.moveTo(x, y - h);
    ctx.lineTo(x + h, y + h);
    ctx.lineTo(x - h, y + h);
    ctx.closePath();
    ctx.fill();
  } else if (kind === SPORE_CELL) {
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

// The thing in the sky: a plain black circle a long way out past the farm, with
// a ring around it. It does nothing at all -- it is the far end of the world,
// and something to have walked towards.
export function drawSky() {
  if (!S.skyShown) return;                 // benched: see the note in config.js
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.arc(sky.x, sky.y, sky.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(sky.x, sky.y, sky.r + P * 2, 0, Math.PI * 2);
  ctx.stroke();
}

// Smoke off the lab's chimney. It is the only thing that says the place is being
// worked, because the crew are inside it -- so it is worth its own few pixels.
export function drawSmoke() {
  for (const p of S.smoke) {
    const k = p.t / SMOKE_LIFE;
    const size = Math.round(P * (1 + k * 1.4));
    ctx.globalAlpha = Math.max(0, 0.5 - k * 0.5);
    ctx.fillStyle = '#000';
    ctx.fillRect(Math.round(p.x - size / 2), Math.round(p.y - size / 2), size, size);
  }
  ctx.globalAlpha = 1;
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
    // the mark sits inside the outline rather than on it: a triangle's base is
    // its lowest edge, and a dot resting on that reads as a smudge
    ctx.fillRect(at.x - P / 2, at.y - P, P, P * 1.6);
    ctx.fillRect(at.x - P / 2, at.y + P * 1.4, P, P);
  }
}

// Under the station, not over it: the pile is the station's problem and the mark
// belongs with the thing that has stopped, and there is nothing else down there
// to read it against. It sits below the ground line, in the space the pit's
// depth already keeps clear on screen.
export function pileMarkAt(key) {
  const x = key === 'rock' ? S.cx
          : key === 'quarry' ? quarry.x + quarry.w / 2
          : farm.x + farm.w / 2;
  // clear of the station itself: the quarry hangs below the ground line, so a
  // mark under the ground would be a mark down the shaft
  const y = key === 'quarry' ? quarry.y + quarry.h + P * 5 : S.groundY + P * 7;
  return { x: Math.round(x / P) * P, y: Math.round(y / P) * P };
}

// where the cursor has to be to be asking about one
export function overPileMark(key, mx, my) {
  const at = pileMarkAt(key);
  return Math.abs(mx - at.x) < P * 5 && Math.abs(my - at.y) < P * 5;
}

// The things the sites give up, lying where they came to rest. Each has a body
// two cells square and its glyph fills it, so what you see is what it is and
// what it collides as -- which is why they stack now instead of overlapping.


// The lab: a squat block with a chimney. Flat black shapes, like everything
// else that stands on this ground.


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
    drawMark(cell, x + MARK / 2, row - MARK / 2, MARK, true);
    ctx.fillStyle = '#000';
    ctx.fillText(text, x + MARK * 2, row);
  };
  line(S.seenCore, CORE_CELL, String(S.cores));
  line(S.seenShard, SHARD_CELL, fmt(S.shards));
  line(S.seenSpore, SPORE_CELL, fmt(S.spores));
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
    if (underground(w) || indoors(w)) continue;   // out of sight: in the lab, or below

    if (w.type === 'labber') {
      const x = Math.round(w.x), y = Math.round(w.y + (w.lunge || 0) * P);
      ctx.fillRect(x, y, WORKER, WORKER);
      ctx.fillStyle = '#fff';
      ctx.fillRect(x + P, y + P, P, P);     // a hollow middle, like a miner's
      ctx.fillStyle = '#000';
      continue;
    }

    if (w.type === 'farmhand') {
      const x = Math.round(w.x), y = Math.round(w.y + (w.lunge || 0) * P);
      ctx.fillRect(x, y, WORKER, WORKER);
      ctx.fillStyle = '#fff';
      ctx.fillRect(x + P, y + P * 2, P, P);   // stooped: the notch is low
      ctx.fillStyle = '#000';
      continue;
    }

    if (w.type === 'quarrier') {
      const x = Math.round(w.x), y = Math.round(w.y + (w.lunge || 0) * P);
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
      // where it actually is, not where the ground line is: on the bridge those
      // are different, and it was the ground line that won
      const y = Math.round(w.y);
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
  drawClouds();              // the far end of everything, so it goes down first
  drawBirds();
  drawCoreBehind();
  drawGroundLine();
  drawQuarry();              // a hole in the ground, so it goes down with the ground
  drawBridge();              // and the way across it
  drawFarm();
  drawSky();
  drawLab();
  drawSmoke();
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
  ctx.lineTo(pit.x - 1, S.groundY + PIT_H + 1);
  ctx.lineTo(pit.x + pit.w + 1, S.groundY + PIT_H + 1);
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
  const pad = MARK_SIZE / 2 + 1;
  for (let r = 0; r < pit.rows; r++) {
    for (let c = 0; c < pit.cols; c++) {
      // only cores: everything else in the pile is painted with the dust
      if (at(pit, c, r) !== CORE_CELL) continue;
      const x = pit.x + c * pit.p, y = bottomY(pit) - (r + 1) * pit.p;
      const cx = Math.min(Math.max(x + pit.p / 2, pit.x + pad), pit.x + pit.w - pad);
      const cy = Math.min(Math.max(y + pit.p / 2, pit.y + pad), bottomY(pit) - pad);
      drawMark(CORE_CELL, cx, cy, MARK_SIZE, true);
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
  const t = now() / 1000;
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
