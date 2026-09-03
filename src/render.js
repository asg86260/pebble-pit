// Everything the game draws, and nothing that decides anything.
//
// Painting order is the whole trick: the rock goes down over the ground line so
// it stands in front of it, the crew and the spoil go over the rock, and the pit
// is blitted from its own scratch canvas rather than drawn a grain at a time.

import { P, SMOKE_LIFE, SHADES, MARK_SIZE, FIND_COLOR, findKind, CORE_CELL, CORE_FROM, SHARD_CELL, SPARK_CELL,
        SPORE_CELL, CORE_SIZE, WORKER, FARM_H, FARM_GATE, TABLE_LIFE, CASINO_SLICES,
        CASINO_KEEP, CASINO_LOSE, CASINO_H, SCRUB_FOLDS,
        RAY_N, RAY_MIN, RAY_MAX, RAY_BEAT, CORE_FLICK, SUMMON_FLASH, MAGIC_TONES, DRAUGHT_INK, BROLLY_W, BROLLY_STICK,
        TOWER_WAVE_MS, TOWER_WAVE_N, TOWER_WAVE_R, TOWER_SHAFT, MAX_DEPTH } from './config.js';
import { S, floor, pit, cut, bench, quarry, farm, lab, apothecary, sky, school, casino, scrub, table , tower, outhouse, rift } from './state.js';
import { boiling, atPot, doseFrac, brewFrac } from './apothecary.js';
import { at, bottomY, shadeOf, isDust, depthShade, count } from './grid.js';
import { PILE_HOLDS, CRATE_H, CRATED } from './config.js';
import { SITES, workAt, worksAt, siteBox, progressAt, progressOf, busyAt, rowFor, OPENS_PLACE } from './works.js';
import { bridgeSpan } from './world.js';
import { boulderAlive, depthOf, rockFootY } from './rock.js';
import { coreHome } from './core.js';
import { brewing, brewAt } from './tower.js';
import { cellX, cellY, BOLTS, SPARKLE, summoning, summonAt, CORE as METEOR_CORE_CELL } from './meteor.js';
import { pitDepth, pitFull, pitRefuses, heldInHole } from './pit.js';

import { underground, quarryShape, ladder, quarryCells, LADDER_W } from './quarry.js';
import { indoors } from './lab.js';
import { inHouse, inScrub } from './scrubhouse.js';
import { DOOR_W, DOOR_H, LAB_FLUE, SCRUB_CHUTE, SCRUB_ARM, MUCK_TONE, MUCK_SKIN, SMOG_TINTS,
         FLIES_PER, FLY_EVERY, FLY_ORBIT, FLY_BEAT, STINK_RISE, STINK_LIFE, STINK_EVERY, DOSE_MARK_CELLS } from './config.js';
import { HAZE_CA } from './config.js';
import { SKY, DROPS, DRAUGHT, GOING, moteX, moteY, muckCols, poopCols, muckFloor } from './smog.js';
import { machine, MACHINES, specOf } from './machines.js';
import { drawSprite, spriteW, spriteH, HATS, HATS_TIGHT, DRILL, BIT, RAM, TILLER, MACHINE_MARK } from './sprites.js';
import { walkY } from './world.js';
import { puff } from './puff.js';
import { jawX, jawY, shaftX, rigTop } from './quarry.js';
import { ramX, rockFaceX, rockShare, sandTopY } from './rock.js';
import { beltFrom, beltTo, beltReach, beltPost, beltY, beltRunning } from './dust.js';
import { rockLeft, groundAt, farmShed, quarryShed, plotSlots, shakeView } from './world.js';
import { tillerAt, tillerWay } from './farm.js';
import { MACHINE_PUFF_MS, MACHINE_PUFF_S, MACHINE_PUFF_RISE, MACHINE_PUFF_LIFE, MACHINE_IDLE_MS,
         BUILD_SHAKE, HOUSE_CUBE } from './config.js';
import { pot, potAt, sliceKeeps } from './casino.js';
import { buriedVisible, buriedAt } from './intro.js';
import { plotX } from './farm.js';
import { fmt, STATIONS, stationFoot, hasOffer } from './board.js';
import { drawRoster, drawRosterCounts, kitStands } from './roster.js';
import { wearing, HAT_TALL, KIT_MARK } from './kit.js';
import { atHome } from './crew.js';
import { drawHouses, cubes as houseCubes } from './house.js';
import { drawAir, drawAirNear } from './air.js';
import { drawClouds, drawBirds } from './weather.js';
import { CRAFT, craftY, mastX, BALLOON_W, BALLOON_H, BALLOON_BASKET,
         BALLOON_FILTER_W, BALLOON_FILTER_H } from './balloon.js';
import { now } from './clock.js';
import { press } from './press.js';
import { rand } from './rng.js';

const canvas = document.getElementById('c');
export const ctx = canvas.getContext('2d');
export { canvas };

// The house is scenery this file draws; its report goes out through here so that
// main.js has one import for the whole of the drawing side.

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
//
// `g` is the canvas it goes on, and it is the frame's unless somebody says
// otherwise. The counter keeps its column of marks on a canvas of its own -- see
// `drawCount` -- and a mark that could only ever be drawn on the frame would
// have to be copied off it afterwards, which means reading the frame back.
export function drawMark(v, x, y, size = MARK_SIZE, glyph = false, g = ctx) {
  // `size` is a cell everywhere but on a crit's dust, which swells through the
  // top of its arc and shrinks back by the time it lands -- so the square is
  // drawn at `size` rather than at a hardcoded cell. The default is `MARK_SIZE`,
  // which is one cell, so every ordinary grain and find draws exactly as before.
  if (isDust(v)) {                             // a grain of dust is a grain: one cell
    g.fillStyle = shadeOf(v);
    g.fillRect(Math.round(x - size / 2), Math.round(y - size / 2), Math.round(size), Math.round(size));
    return;
  }
  const tones = FIND_COLOR[findKind(v)];
  if (!glyph && tones) {
    g.fillStyle = tones[v - findKind(v)];
    g.fillRect(Math.round(x - size / 2), Math.round(y - size / 2), Math.round(size), Math.round(size));
    g.fillStyle = '#000';
    return;
  }
  // No backing square. It was there to keep two of these readable when they
  // overlapped, and they cannot overlap any more: a resting one stands in a slot
  // of its own. A white box behind a triangle is a white box on the ground.
  const h = size / 2;
  g.fillStyle = tones ? tones[Math.min(2, v - findKind(v))] : '#000';
  const kind = findKind(v) || v;
  if (v === CORE_CELL) {
    const lw = Math.max(1, size / 4);
    g.beginPath();
    g.arc(x, y, Math.max(0.5, h - lw / 2), 0, Math.PI * 2);
    g.fillStyle = '#fff';
    g.fill();
    g.lineWidth = lw;
    g.strokeStyle = '#000';
    g.stroke();
  } else if (kind === SHARD_CELL) {
    g.beginPath();
    g.moveTo(x, y - h);
    g.lineTo(x + h, y + h);
    g.lineTo(x - h, y + h);
    g.closePath();
    g.fill();
  } else if (kind === SPORE_CELL) {
    const k = h * 0.866;                       // flat-topped, so it fills the width
    g.beginPath();
    g.moveTo(x - h, y);
    g.lineTo(x - h / 2, y - k);
    g.lineTo(x + h / 2, y - k);
    g.lineTo(x + h, y);
    g.lineTo(x + h / 2, y + k);
    g.lineTo(x - h / 2, y + k);
    g.closePath();
    g.fill();
  } else if (kind === SPARK_CELL) {
    // A spark: four points, longer than they are wide. The quarry is a triangle and
    // the plots are a hexagon -- both of them things with sides -- so this one is
    // a thing with no sides at all, which is what it looked like coming down.
    g.beginPath();
    g.moveTo(x, y - h);
    g.lineTo(x + h / 3, y - h / 3);
    g.lineTo(x + h, y);
    g.lineTo(x + h / 3, y + h / 3);
    g.lineTo(x, y + h);
    g.lineTo(x - h / 3, y + h / 3);
    g.lineTo(x - h, y);
    g.lineTo(x - h / 3, y - h / 3);
    g.closePath();
    g.fill();
  } else {
    const t = size / 3;
    g.fillRect(x - t / 2, y - h, t, size);
    g.fillRect(x - h, y - t / 2, size, t);
  }
  g.fillStyle = '#000';
}

// The thing in the sky is a star, and a small one: a dead black crust with fire
// under it, drawn cell by cell like everything else here that is made of cells.
//
// It reads as a star rather than as a stone because of what stands off it. A
// corona of rays all round, breathing in and out on a slow beat, and the rays
// take their colour from what is showing: black while the crust is whole, and
// redder the more of the core has been uncovered. So the thing visibly catches
// as it is worked -- the last of a star is a blazing one -- and that is the same
// fact the counter is about to be told, said by the picture first.
//
// Nothing here is a gradient or a glow. Rays are cells on the lattice like the
// rock is, the fire is the four reds the sparks are drawn in, and the shimmer is
// those four tones changing places every quarter second.
export function drawSky() {
  if (!S.skyShown && !S.meteorOpen) return;
  drawTrail();
  // Being made. The ring is pouring into the middle of an empty sky, so what is
  // there is whatever they have poured so far -- see `drawSummon`.
  if (S.meteorOpen && (!sky.cells || !sky.n)) { drawSummon(); return; }
  // Nothing called down yet: the plain circle, the far end of the world.
  if (!sky.cells || !sky.n) {
    if (!S.skyShown) return;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(sky.x, sky.y, sky.r, 0, Math.PI * 2);
    ctx.fill();
    skyRing();
    return;
  }
  drawFlash();

  // How much of it is fire, which is what the corona is drawn from.
  let core = 0, all = 0;
  for (const v of sky.cells) { if (!v) continue; all++; if (v === METEOR_CORE_CELL) core++; }
  const hot = all ? core / all : 0;

  drawCorona(hot);

  const tones = FIND_COLOR[SPARK_CELL];
  const flick = Math.floor(now() / CORE_FLICK);
  for (let r = 0; r < sky.rows; r++) {
    for (let c = 0; c < sky.cols; c++) {
      const v = sky.cells[r * sky.cols + c];
      if (!v) continue;
      if (v === METEOR_CORE_CELL) {
        // The fire, and never the same two cells the same shade for long: the
        // tone is picked off the cell and the clock, so it shifts where it
        // stands rather than crawling about. Only the brighter half of the four
        // reds, so the core is always plainly hotter than the crust round it.
        ctx.fillStyle = tones[(c * 7 + r * 13 + flick) % 2];
      } else {
        // The crust: the deepest of the reds rather than black. It is a star and
        // the whole of it is hot -- a black body with a red middle read as an
        // eclipse, which is a picture of a thing being in front of a sun rather
        // than of a sun.
        ctx.fillStyle = tones[tones.length - 1];
      }
      ctx.fillRect(cellX(c), cellY(r), sky.p, sky.p);
    }
  }
  ctx.fillStyle = '#000';
  drawBolts();
}

// The rays. Whole cells, stepped out along the ray's own line, so a ray is a
// dotted run of squares rather than a drawn line -- there are no lines in this
// game and a stroked one here would be the only stroke in the sky.
function drawCorona(hot) {
  const beat = now() / 1000 / RAY_BEAT * Math.PI * 2;
  const tones = FIND_COLOR[SPARK_CELL];
  for (let i = 0; i < RAY_N; i++) {
    const a = (i / RAY_N) * Math.PI * 2;
    // every other ray on the opposite half of the breath, so the corona pulses
    // rather than swelling as one lump
    const swing = Math.sin(beat + (i % 2 ? Math.PI : 0)) * 0.5 + 0.5;
    const long = RAY_MIN + Math.round(swing * (RAY_MAX - RAY_MIN));
    for (let k = 0; k < long; k++) {
      const d = sky.r + P * (1 + k);
      const x = Math.round((sky.x + Math.cos(a) * d - P / 2) / P) * P;
      const y = Math.round((sky.y + Math.sin(a) * d - P / 2) / P) * P;
      // The tip is thinner than the root: the further out a cell is, the paler
      // it is drawn, which is a corona thinning into the sky rather than a
      // starburst cut out of paper.
      ctx.globalAlpha = 1 - k / (RAY_MAX + 1);
      // Brighter the more of the fire is uncovered: a crusted star throws a dull
      // corona and a stripped one blazes.
      ctx.fillStyle = tones[hot > 0.25 ? 0 : hot > 0.05 ? 1 : 2];
      ctx.fillRect(Math.round(x - P / 2), Math.round(y - P / 2), P, P);   // about its middle
    }
  }
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#000';
}

// A star being made.
//
// Every body in the ring pours into the middle of the empty spot, and what is
// there grows as they pour: a knot of fire that starts as one cell and opens out
// into the disc the star will be. The beams are drawn from each of them, cell by
// cell along the line, brightening and thickening as the thing takes -- and the
// last of it goes off as a flash, because a star arriving quietly would be the
// one moment in this game that deserves a noise and does not make one.
//
// Nothing here is a sprite or a gradient. Beams are runs of whole cells, the
// knot is the same red the core is drawn in, and the flash is a ring of cells
// going out.
function drawSummon() {
  const at = summonAt();
  const mid = { x: sky.x, y: sky.y };
  const tones = FIND_COLOR[SPARK_CELL];
  const t = now() / 1000;

  drawFlash();
  if (at <= 0 && !S.workers.some(w => w.channel)) return;

  // The beams: one steady line of cells from each body that is pouring, and a
  // bead of light running down it. Every cell used to flicker on its own clock,
  // which is not a beam -- it is a shower of confetti in the rough shape of one.
  // A quiet line says where the magic is going; the bead says it is going.
  for (const w of S.workers) {
    if (!w.channel || !w.aloft) continue;
    const fx = w.x + WORKER / 2, fy = w.y + WORKER / 2;
    const dx = mid.x - fx, dy = mid.y - fy;
    const len = Math.hypot(dx, dy) || 1;
    const from = P * 2, to = len - P * 2;

    ctx.globalAlpha = 0.2 + at * 0.35;
    ctx.fillStyle = MAGIC_TONES[2];
    ctx.beginPath();
    for (let d = from; d < to; d += P) {
      ctx.rect(Math.round((fx + dx * (d / len)) / P) * P,
               Math.round((fy + dy * (d / len)) / P) * P, P, P);
    }
    ctx.fill();

    // and the bead: two cells, running inward, on this body's own phase so a
    // ring of them is not one flash repeated
    ctx.globalAlpha = 0.55 + at * 0.45;
    ctx.fillStyle = MAGIC_TONES[0];
    const k = (t * 0.55 + (w.ph || 0) / (Math.PI * 2)) % 1;
    for (const off of [0, P]) {
      const d = from + (to - from) * k + off;
      if (d < from || d > to) continue;
      ctx.fillRect(Math.round((fx + dx * (d / len)) / P) * P,
                   Math.round((fy + dy * (d / len)) / P) * P, P, P);
    }
  }
  ctx.globalAlpha = 1;

  // And the knot in the middle: a solid disc of the star's own fire, opening out
  // as it takes. Its edge is an edge -- it was fraying cell by cell on its own
  // clock, which read as a thing coming apart rather than a thing being made --
  // and what moves is the shimmer inside it and the size of it, which are the
  // same shimmer and the same shape the finished star will have.
  const r = Math.max(P, at * sky.r);
  const flick = Math.floor(now() / CORE_FLICK);
  for (let y = -r; y <= r; y += P) {
    for (let x = -r; x <= r; x += P) {
      if (Math.hypot(x, y) > r) continue;
      ctx.fillStyle = tones[(Math.round(x / P) * 7 + Math.round(y / P) * 13 + flick) % 2];
      ctx.fillRect(Math.round((mid.x + x) / P) * P, Math.round((mid.y + y) / P) * P, P, P);
    }
  }
  ctx.fillStyle = '#000';
}

// The moment it takes: a ring of cells going out from where it arrived, and
// gone within the second. It is drawn over a star that now exists, which is the
// point -- the flash is the arrival, not a thing standing in for it.
function drawFlash() {
  const since = now() - (S.flashAt || 0);
  if (!S.flashAt || since > SUMMON_FLASH) return;
  const k = since / SUMMON_FLASH;
  const tones = FIND_COLOR[SPARK_CELL];

  // Two rings rather than one: the star's own fire going out fast and hard, and
  // the last of the magic that made it following it out, slower and wider. One
  // ring read as a hoop; two reads as a thing letting go.
  const rings = [
    { r: sky.r + k * sky.r * 3.4, ink: 1 - k, colour: tones[0], step: 1 },
    { r: sky.r + Math.max(0, k - 0.15) * sky.r * 5, ink: Math.max(0, 0.8 - k), colour: MAGIC_TONES[1], step: 2 }
  ];
  for (const ring of rings) {
    if (ring.r <= sky.r || ring.ink <= 0) continue;
    ctx.globalAlpha = ring.ink;
    ctx.fillStyle = ring.colour;
    const n = Math.max(12, Math.round((Math.PI * 2 * ring.r) / (P * ring.step)));
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      cell(sky.x + Math.cos(a) * ring.r, sky.y + Math.sin(a) * ring.r);
    }
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#000';
}

// What comes off a flying body: its own light, sinking and going out. Drawn
// before the star and the bodies, so it is behind them -- it is what they left
// behind, not something in front of them.
function drawTrail() {
  if (!SPARKLE.length) return;
  const t = now();
  for (const k of SPARKLE) {
    const life = 1 - (t - k.born) / k.life;
    if (life <= 0) continue;
    // It goes out as it ages, and it goes *down* the tones as it goes: a speck
    // ends deeper and fainter than it started, which is a thing burning out
    // rather than a thing being turned off.
    ctx.globalAlpha = Math.max(0, life) * 0.8;
    ctx.fillStyle = MAGIC_TONES[Math.min(MAGIC_TONES.length - 1,
                                         k.tone + Math.floor((1 - life) * 2))];
    ctx.fillRect(Math.round(k.x / P) * P, Math.round(k.y / P) * P, P, P);
  }
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#000';
}

// A cell of a ring, put down *centred* on the point it is drawn at rather than
// hanging off it by its top-left corner. Half a cell down and half a cell right
// is not much on its own and is exactly enough to make a ring read as slipped
// off whatever it is supposed to be coming out of.
function cell(x, y) {
  ctx.rect(Math.round((x - P / 2) / P) * P, Math.round((y - P / 2) / P) * P, P, P);
}

// The magic on its way to the star: a speck of the wizard's own light, drawn as
// what it is about to knock loose.
function drawBolts() {
  for (const b of BOLTS) {
    // the cell behind it, fainter: two cells is enough to say which way a thing
    // is going, and a longer tail on a six pixel cell is a streak. The specks it
    // has shed are drawn with the rest of the magic -- see `drawTrail`.
    ctx.globalAlpha = 0.45;
    ctx.fillStyle = MAGIC_TONES[2];
    ctx.fillRect(Math.round(b.px / P) * P, Math.round(b.py / P) * P, P, P);
    ctx.globalAlpha = 1;
    ctx.fillStyle = MAGIC_TONES[0];
    ctx.fillRect(Math.round(b.x / P) * P, Math.round(b.y / P) * P, P, P);
  }
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#000';
}

// Only the benched circle wears this. A star does not need a line drawn round it
// to read as a thing hanging in the air -- its own corona does that -- and a ring
// through the rays was a bubble it was sitting in.
function skyRing() {
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(sky.x, sky.y, sky.r + P * 2, 0, Math.PI * 2);
  ctx.stroke();
}

// Smoke off the lab's chimney -- and off a cigarette, which is the same smoke
// at a little over half the size. It is the only thing that says the lab is
// being worked, because the crew are inside it, so it is worth its own pixels.
export function drawSmoke() {
  for (const p of S.smoke) {
    const k = p.t / SMOKE_LIFE;
    const size = Math.round(P * (p.s || 1) * (1 + k * 1.4));
    ctx.globalAlpha = Math.max(0, 0.5 - k * 0.5);
    ctx.fillStyle = '#000';
    ctx.fillRect(Math.round(p.x - size / 2), Math.round(p.y - size / 2), size, size);
  }
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#000';
}

// --- the ground a station pays out on to -------------------------------------
//
// Every strip in `S.piles` is ground that belongs to somebody, and until this
// went in an empty strip was indistinguishable from the bare walk either side of
// it: there was no way to see where the quarry's stone was going to land, or how
// much room the farm had left before it jammed. So the ground is marked, the way
// a plot is marked before anything is built on it -- a peg at each end with its
// foot turned inwards, a dashed run between them, and the thing that piles here
// standing in the middle of it.
//
// It reads the strips and nothing else. There is no table of positions per
// station in here and there must never be one: the ends come off `from` and
// `to`, the middle is halfway between them, and what it holds comes off
// `PILE_HOLDS`, which defaults to dust. A station added to `SITES` tomorrow gets
// its pegs with no new code -- which is the whole point, and is the opposite of
// what the warning marks below used to do (they named two keys and sent
// everything else to the farm, and two stations spent a while with their signs
// three thousand pixels from the thing that had stopped).
const GROUND_INK = '#c9c9c9';         // paler than anything built: a marking, not a wall

// What piles here, cut into the ground it is kept for.
//
// A find gets its own glyph, in its own colour -- the same shape the counter and
// the crew board use for it -- with `glyph` on, because a solid coloured cell is
// what a single *grain* looks like, and a strip marked with one grain reads as
// one grain lying there rather than as ground kept for a heap. Dust has no glyph
// and does not need one: it is drawn as what a heap of it looks like from a
// distance, a little mound of cells, in the same grey as the pegs so the whole
// marking reads as one thing.
function stripMark(kind, x, y) {
  if (kind) { drawMark(kind, x, y, P * 4, true); ctx.fillStyle = '#000'; return; }
  ctx.fillStyle = GROUND_INK;
  ctx.fillRect(x - P * 1.5, y, P * 3, P);
  ctx.fillRect(x - P / 2, y - P, P, P);
  ctx.fillStyle = '#000';
}

// The crate a station's output is thrown into.
//
// This was pegs and a dashed run -- a surveyor's marking on bare ground, which
// said "something belongs here" and left you to imagine what. A crate says it
// outright, in the vocabulary the rest of the yard is written in: the bench, the
// kit stand and the closet are all THINGS, and a heap of stone that lives in a
// box is easier to read than a heap of stone that lives on a line.
//
// Drawn before the grid, so what is thrown in piles up inside it. The sides hold
// the pile in rather than overlapping it -- see `bankCeiling` in world.js, where
// a strip fills to the brim of its sides before anything leans.
export function drawPileGround() {
  for (const p of S.piles) {
    const y = S.groundY;
    // In the yard's own ink, not the pale grey a marking is drawn in. A crate is
    // furniture -- the same black the bench and the kit stand are drawn in --
    // and the pegs were pale because they were a note about the ground rather
    // than a thing standing on it.
    ctx.fillStyle = '#000';
    // The box, where there is one. The rock's strip has none: it runs the width
    // of the hill, and a box that long is a bar laid across the yard rather than
    // something with sides -- see `CRATED` in config.js, which the rule about how
    // a strip fills reads from the same place.
    if (CRATED(p.key)) {
      // Two sides, standing on the floor. A cell thick, so they read as boards
      // rather than as walls.
      for (const x of [p.from, p.to - P]) ctx.fillRect(x, y - CRATE_H, P, CRATE_H);
      // ...and the floor they stand on, in the same ink as the sides, because a
      // box is made of one thing. It lies in the ground rather than on it -- the
      // cell *under* the ground line -- so what is thrown in sits on top of it
      // instead of standing in it. Drawn pale and level with the first row of
      // grains, it was a floor nobody ever saw: the first thing thrown covered
      // it, and a crate whose floor only shows while it is empty is two posts.
      ctx.fillRect(p.from - P, y, (p.to - p.from) + P * 2, P);
    }
    // ...and whose crate it is, cut into the ground under it rather than hung
    // in the air over it. It stays put as the crate fills: a marking that dimmed
    // as the strip filled told you least about the strip you could see least of.
    const mid = Math.round((p.from + p.to) / 2 / P) * P;
    ctx.fillStyle = GROUND_INK;
    stripMark(PILE_HOLDS[p.key], mid, y + P * 3);
    ctx.fillStyle = '#000';
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
  // The hole is one of them. A full pit stops the haulers exactly the way a full
  // pile stops a gang, and a crew that stands down with nothing on screen to say
  // why reads as a game that has broken rather than as a hole you have to dig.
  // It stands on the near lip, on the ground the haulers walk to and are not
  // walking to now -- and to the left of it, because the counter is to the right.
  // No mark over the hole. It used to carry the same warning a stopped station
  // does -- a triangle and "the hole is full" under the cursor -- because a full
  // hole stopped the yard and you needed telling why. It cannot stop anything
  // now: the first grain it will not take tears it open and the rest goes
  // through the rift (see `throughRift` in pit.js). A warning about a thing that
  // no longer happens is a warning that teaches you to ignore warnings.
  for (const p of S.piles) {
    if (!S.pileFull[p.key]) continue;
    const at = pileMarkAt(p.key);
    // a warning triangle: hollow, with a bar and a dot inside it. A triangle
    // sits low in its own outline, so the mark hangs below the middle of it.
    warning(at.x, at.y);
  }
}

// a warning triangle: hollow, with a bar and a dot inside it. A triangle sits
// low in its own outline, so the mark hangs below the middle of it.
//
// One radius, and everything inside is a fraction of it. The bar and the dot
// used to be four numbers of their own, which meant the triangle could only ever
// be the size those four numbers had been picked for -- shrink it and the mark
// inside stayed put and burst out through the side. The shape has one dimension
// now and changing it changes the whole sign.
const WARN_R = P * 2.6;
function warning(x, y, r = WARN_R) {
  drawTriangle(x, y, r, true);
  ctx.fillStyle = '#000';
  // the mark sits inside the outline rather than on it: a triangle's base is its
  // lowest edge, and a dot resting on that reads as a smudge
  ctx.fillRect(x - r / 8, y - r / 4, r / 4, r * 0.4);
  ctx.fillRect(x - r / 8, y + r * 0.35, r / 4, r / 4);
}

// Under the station, not over it: the pile is the station's problem and the mark
// belongs with the thing that has stopped, and there is nothing else down there
// to read it against. It sits below the ground line, in the space the pit's
// depth already keeps clear on screen.
// Every strip in `S.piles` gets one of these, so every station has to have an
// answer here. It used to name two keys and send everything else to the farm --
// which was fine while there were three piles, and became wrong the moment the
// scrubbing house and the star got strips of their own: both of them stopped
// with their warning hanging over the farm, three thousand pixels from the thing
// that had stopped. A station added tomorrow gets the middle of its own heap
// without anybody remembering to come back here.
// --- where a station's marks go -------------------------------------------------
// Two things can hang under a station: a bar saying it has stopped, and a
// pointer saying its board has something on it. They used to work out their own
// positions independently -- one off `stationFoot`, one off the pile's strip,
// each with its own idea of how far under the line to sit -- and the answer was
// that they landed on top of each other at some stations and a long way apart at
// others, with nothing anywhere deciding which.
//
// So there is a row of **slots** under each station, and each kind of mark has
// one. A slot is a place, not a queue: the pointer sits in the same spot whether
// or not the bar is showing, so a mark never moves because a different mark
// appeared. That is the whole of what makes a row of icons readable -- you learn
// where to look once.
// How far apart the slots sit, and it follows the marks rather than leading
// them. Six cells was the gap the old, larger signs needed; with smaller ones in
// the same slots the pair stopped reading as a row and started reading as two
// marks that happened to be near each other. Four and a half went too far the
// other way -- the triangle is 5.2 cells across and the diamond 3.2, so their
// half-widths alone come to 4.2 and the two were all but touching.
const SLOT_W = P * 5.5;
const SLOTS = ['stopped', 'offer'];        // left to right, and never reordered

// Which of them a station is showing right now.
//
// They used to sit in fixed places whether or not the other was there, on the
// argument that a mark which never moves is a mark you learn the position of.
// That is true of a row of controls and wrong for a pair of signs: one sign
// hanging off to the left of nothing reads as a thing that has come loose. So
// they are centred as a group -- one in the middle, two side by side about the
// middle -- which is what anybody drawing this by hand would have done.
function marksOn(key) {
  const on = [];
  if (S.pileFull[key]) on.push('stopped');
  if (STATIONS.includes(key) && hasOffer(key)) on.push('offer');
  return on;
}

// The middle of a station's row of slots. Everything that hangs under a station
// is measured from here, so moving a station moves its marks with it.
export function markAnchor(key) {
  const box = key === 'scrub' ? scrub : null;
  const strip = S.piles.find(p => p.key === key);
  // A station's signs hang under the station, and for the quarry and the farm
  // the station is the SHACK. That is where its board hangs and where you stand
  // to open it (`standAt` in board.js), and a sign about what is on that board
  // belongs with it -- a diamond out beside a hole is a diamond about nothing
  // you can walk up to. `stationFoot` is the same answer board.js gives to the
  // same question, so the two can no longer drift apart: this used to reach
  // past the mouth of the quarry with a slot's clearance and to the middle of
  // the plots, both worked out here and neither known to the board.
  const x = key === 'rock' ? S.cx
          : key === 'sky' ? sky.x
          : box ? box.x + box.w / 2
          : (f => f != null ? f
                 : strip ? (strip.from + strip.to) / 2
                 : farm.x + farm.w / 2)(stationFoot(key));
  // Clear of the station itself. The star is four hundred pixels up with no
  // ground under it at all, so its marks hang beneath it where the wizards are;
  // everything else stands on the floor of the yard -- the quarry included,
  // whose signs are under its shack now rather than out over the hole.
  const y = key === 'sky' ? sky.y + sky.r + P * 9 : S.groundY + P * 7;
  return { x: Math.round(x / P) * P, y: Math.round(y / P) * P };
}

// One slot of that row.
export function markAt(key, kind) {
  const at = markAnchor(key);
  // Centred as a group, in the order the slots are declared -- so with one up it
  // is in the middle, and when the second appears they part about the middle
  // rather than one of them staying put and the other arriving beside it.
  const on = marksOn(key);
  const i = on.indexOf(kind);
  if (i < 0) return { x: at.x, y: at.y };     // asked about one that is not up
  const left = at.x - (on.length * SLOT_W) / 2 + SLOT_W / 2;
  return { x: Math.round((left + i * SLOT_W) / P) * P, y: at.y };
}

export function pileMarkAt(key) {
  return markAt(key, 'stopped');
}

// where the cursor has to be to be asking about one
export function overPileMark(key, mx, my) {
  const at = pileMarkAt(key);
  // Half a slot, so the two marks can never both answer to the same cursor.
  // This was a flat five cells, which was inside the six-cell gap and is wider
  // than the gap now -- hovering the diamond would have asked about the triangle
  // as well, and whichever was tested first would have won.
  return Math.abs(mx - at.x) < SLOT_W / 2 && Math.abs(my - at.y) < P * 4;
}

// The things the sites give up, lying where they came to rest. Each has a body
// two cells square and its glyph fills it, so what you see is what it is and
// what it collides as -- which is why they stack now instead of overlapping.


// The lab: a squat block with a chimney. Flat black shapes, like everything
// else that stands on this ground. (Its own note is over drawLab.)


// The school. A long block with a belfry over the door and a row of tall narrow
// windows -- read against the lab, which is a tall body with one chimney, and
// against the crew's own place, which is a stack of one-cell rooms. One of them
// is where something is cooked up out of sight, one is where people sleep, and
// this is the one people walk into and come out of again. The silhouettes have
// to say which is which from across the yard, because that is all you can see of
// any of them.
//
// Every edge is a whole cell. It was laid out in fractions of the building's
// width at first, which put the door and the belfry slot a third of a pixel off
// the lattice and drew them with a grey fringe -- the same hairline the whole
// game is arranged to avoid.
export function drawSchool() {
  const rising = risingPlace() === 'school';
  if (!S.schoolOpen && !rising) return;
  const { x, y, w, h } = school;
  withRise(rising, x, S.groundY, w, h, () => {
    const c = (n) => x + P * n;                             // cell n across the front
    ctx.fillStyle = '#000';
    ctx.fillRect(c(9), y, P * 2, P * 3);                    // the belfry
    ctx.fillRect(x, y + P * 3, w, h - P * 3);               // and the block under it
    ctx.fillStyle = '#fff';
    ctx.fillRect(c(9), y + P, P * 2, P);                    // the opening it rings out of
    // Tall and narrow, and there are a lot of them: a row of standing windows is
    // the one thing a building can do that says people are in there in numbers.
    for (const n of [2, 4, 6, 13, 15, 17]) ctx.fillRect(c(n), y + P * 4, P, P * 2);
    // The way in, standing open. Two cells by three before, which was the smallest
    // door in the yard on the widest building in it -- a twenty-cell front with a
    // slot in it, and a body three cells across walking up to a hole three cells
    // tall. It is DOOR_W by DOOR_H now like every other way in, and it is centred
    // on the same column the belfry is, so the one thing standing out of the roof
    // and the one thing cut into the wall are on one axis.
    ctx.fillRect(c(10 - DOOR_W / 2), y + h - P * DOOR_H, P * DOOR_W, P * DOOR_H);
    ctx.fillStyle = '#000';
  });
}

// The lab: a tall body with one chimney, read against the school's long block and
// against the stack of one-cell rooms the crew live in.
//
// It was the one building in the yard with no way in. Everything else on the
// ground has a door because somebody walks into it, and a wall a labber
// evaporates against is the thing the scrubbing house's door was added to stop --
// so it had the same fault, and nobody had said so out loud.
//
// And it was laid out in fractions of its own width and height: 0.35 of ten
// courses is three and a half, so the body's roof, the foot of the chimney and
// the window all sat half a cell off the lattice and drew with the grey fringe
// the rest of the game is arranged to avoid. It is whole cells now, the same way
// the school was fixed, and the two numbers it is built on are in config.js with
// every other building's. Sixteen across and twelve down: LAB_FLUE courses of
// chimney standing against the sky, and eight of body under it. Nothing here is
// a fraction of anything, and nothing is a literal either -- read the front off
// the cells it is actually made of, so a lab a course taller draws right.
export function drawLab() {
  const rising = risingPlace() === 'lab';
  if (!S.labOpen && !rising) return;
  const { x, y, w, h } = lab;
  withRise(rising, x, S.groundY, w, h, () => {
    const across = Math.round(w / P);
    const c = (n) => x + P * n;                              // cell n across the front
    const r = (n) => y + P * n;                              // and cell n down it
    ctx.fillStyle = '#000';
    ctx.fillRect(x, r(LAB_FLUE), w, h - P * LAB_FLUE);       // the body
    ctx.fillRect(c(2), y, P * 3, P * LAB_FLUE);              // a chimney
    ctx.fillStyle = '#fff';
    // The window goes off to one side, because the middle of the front belongs to
    // the door now: a window over a doorway is a fanlight, which is a detail this
    // yard is too coarse to draw, and a window beside one is a room with somebody
    // in it. A clear cell off the jamb of the door and two off the far corner,
    // because a hole on a building's edge is a bite taken out of the silhouette
    // rather than a light in a wall.
    //
    // Two cells square, which is the window in a room of the crew's house. It was
    // three, and three cells of white in a wall beside a four-course door is two
    // holes rather than a wall with things in it. A window is a shared measure
    // here the same way a door is: one size for a room with somebody in it, and
    // the school's tall narrow lights, which come in a row and say a crowd.
    ctx.fillRect(c(across - 4), r(LAB_FLUE + 1), P * 2, P * 2);   // a window
    // and the way in, DOOR_W by DOOR_H like every other way in, dead in the middle
    // of the front and standing on the ground. lab.js walks a labber to the middle
    // of it (labDoor), so the hole in the wall and the place a body disappears at
    // are one thing rather than two numbers that used to differ by a tenth of the
    // front -- which put every labber through the window.
    ctx.fillRect(c(across / 2 - DOOR_W / 2), y + h - P * DOOR_H, P * DOOR_W, P * DOOR_H);
    ctx.fillStyle = '#000';
  });
}

// The apothecary: a cauldron on a fire, a bed of herbs beside it, and steam off
// the pot when there is a body stirring it. The steam IS the readout -- the
// lab's chimney rule, word for word -- so a pot with nobody on it stands cold,
// however much crop is in the yard, and you learn it is up from across the
// yard the way you learn the lab is being worked. See `boiling` in apothecary.js.
export function drawApothecary() {
  const rising = risingPlace() === 'apothecary';
  if (!S.apothecaryOpen && !rising) return;
  const { x, y, w, h } = apothecary;
  withRise(rising, x, S.groundY, w, h, () => {
    const g = S.groundY;
    ctx.fillStyle = '#000';

    // The bed of herbs on the left -- two stalks with a leaf apiece, standing off
    // the ground: the crop, before it is a tonic.
    for (let s = 0; s < 2; s++) {
      const hx = x + P * s;
      ctx.fillRect(hx, g - P * 3, P, P * 3);
      ctx.fillRect(hx + (s ? P : -P), g - P * 3, P, P);
    }

    // The cauldron, right of the herbs. A round-bellied pot: a rim narrower than
    // the belly, so the belly bulges past it -- which is the whole of what reads
    // as a pot and not a table -- rounding back in to two feet with the fire
    // between them. Each row is [y, cells inset from EACH side]; the belly rows
    // at inset 0 are the widest.
    const potW = P * 6;                     // six cells across the widest belly
    const potX = x + P * 3;                 // clear of the herb bed
    const rimY = g - P * 6;                 // the rim sits six cells up
    const potMid = potX + potW / 2;
    for (const [ry, inset] of [[rimY, 1], [rimY + P, 0], [rimY + P * 2, 0],
                               [rimY + P * 3, 1], [rimY + P * 4, 2]])
      ctx.fillRect(potX + inset * P, ry, potW - inset * P * 2, P);
    // Two feet under the belly's lower round, the fire between them.
    ctx.fillRect(potX,             g - P, P, P);
    ctx.fillRect(potX + potW - P,  g - P, P, P);

    // The brew: liquid sitting in the mouth, framed by the rim on both sides.
    ctx.fillStyle = '#fff';
    ctx.fillRect(potX + P * 2, rimY, potW - P * 4, P);
    ctx.fillStyle = '#000';

    // The fire under the belly: two licks with a cell of gap between them, so it
    // reads as flame and not a solid foot. Uneven height for a little flicker.
    // Always laid; only the steam and the bubbles say the pot is being worked.
    for (const [fx, ht] of [[potX + P * 2, 2], [potX + P * 4, 3]])
      for (let hy = 0; hy < ht; hy++) ctx.fillRect(fx, g - P * (hy + 1), P, P);

    // A working pot bubbles and steams; an idle one is a cold cauldron. See
    // `boiling` -- true only while a stirrer is through the door on a batch.
    if (boiling()) {
      const t = now();
      // Bubbles rising through the brew and breaking its surface: a black cell
      // that climbs the mouth on its own phase, so they pop one after another.
      for (let bcol = 0; bcol < 2; bcol++) {
        const bx = potX + P * 2 + bcol * P;                  // the two mouth cells
        const ph = (t / 560 + bcol * 0.5) % 1;
        if (ph < 0.6) ctx.fillRect(bx, rimY - (ph < 0.3 ? 0 : P), P, P);
      }
      // Steam: three wisps off the mouth, climbing and fading out near the top --
      // one cell at a time, each on its own slow clock, swaying as it rises.
      for (let k = 0; k < 3; k++) {
        const ph = (t / 900 + k * 0.33) % 1;
        if (ph > 0.85) continue;                             // gone near the top
        const sway = Math.round(Math.sin(t / 800 + k * 1.4) * 1.2);
        const sx = potMid + (k - 1) * P + sway * P;
        const sy = rimY - P * 2 - Math.round(ph * 5) * P;
        ctx.fillRect(Math.round(sx / P) * P, sy, P, P);
      }
    }
  });

  // The brew's progress bar, over the cauldron -- only up while a batch is going.
  // Drawn outside `withRise` so it rides above the pot at full size once the
  // building has finished rising. Uses the yard's one bar, the same the lab and
  // the tower show.
  if (S.apothecaryOpen && !rising && brewFrac() > 0) {
    const potMid = apothecary.x + P * 6;                     // middle of the belly
    bar(Math.round(potMid / P) * P, S.groundY - P * 9, brewFrac());
  }
}

// What the rain left, drawn where it landed: one column of the world at a time,
// stacked on whatever that column has -- the ground, the floor of the quarry, or
// the rock itself. The layer is the record. There is no number anywhere saying
// how buried a thing is that could disagree with the picture.
//
// Grey rather than a shade of dust, and it never joins a pile: this is the one
// thing in the yard that looks like material and is worth nothing. Read "that is
// in the way", never "there is dust up there".
// the layer, and the grains on their way to being it: one substance, one colour
const MUCK_GREY = MUCK_TONE;
const MUCK_EDGE = MUCK_SKIN;

// Flies, and a wisp coming off it.
//
// Only over what a body left. The weather's muck is dirty and this is rotten,
// and those are already told apart by being two different piles doing two
// different jobs -- so the flies say which is which at a glance, from across the
// yard, without anybody having to read a colour.
//
// Nothing is remembered between frames. A fly's whole life is a function of
// which column it is over and what time it is, so there is no swarm to keep, no
// list to add to when a body squats and none to prune when a janitor shovels:
// the flies are over the poop because the poop is there, and they are gone in
// the same frame it is. The column index seeds the phase so that neighbouring
// columns are not one animation played side by side.
function drawStink(from, to, poo) {
  const t = now() / 1000;
  ctx.fillStyle = '#000';
  for (let c = from; c <= to; c++) {
    const n = poo[c] || 0;
    if (!n) continue;
    const top = muckFloor(c) - n * P;
    const seed = c * 2.399;                        // no two columns in step
    for (let k = 0; k < (c % FLY_EVERY ? 0 : FLIES_PER); k++) {
      const ph = seed + k * 2.1;
      // Drawn on the lattice like everything else: a fly off the grid is a
      // black speck that shimmers against the cells it crosses.
      const fx = Math.round((c * P + Math.cos(t * FLY_BEAT + ph) * FLY_ORBIT) / P) * P;
      const fy = Math.round((top - P * 2 + Math.sin(t * FLY_BEAT * 1.5 + ph) * P * 1.2) / P) * P;
      ctx.fillRect(fx, fy, P, P);
    }
    // And a wisp off one column in three, climbing and fading. One per column
    // was a curtain; the point is a suggestion of a smell, not a chimney.
    if (c % STINK_EVERY) continue;
    const age = (t + seed) % STINK_LIFE;
    const wy = Math.round((top - P - age * STINK_RISE) / P) * P;
    const wx = Math.round((c * P + Math.sin(t + seed) * P) / P) * P;
    ctx.globalAlpha = 0.28 * (1 - age / STINK_LIFE);
    ctx.fillRect(wx, wy, P, P);
    ctx.globalAlpha = 1;
  }
}

export function drawMuck() {
  const m = muckCols();
  if (!m.length) return;
  // Both stacks. The yard keeps what the weather drops and what a body leaves in
  // two separate columns, because they are two different jobs -- everybody
  // clears the first and only a janitor clears the second -- and this drew the
  // first and no more. So what the crew left was never on the screen at all: it
  // piled up in the count, held the row that sells the closet open, and looked
  // for all the world like somebody had been round and tidied it away.
  const poo = poopCols();
  const from = Math.max(0, Math.floor(S.camX / P) - 2);
  const to = Math.min(m.length - 1, Math.ceil((S.camX + S.viewW) / P) + 2);
  // Gathered up and drawn in two fills: after a heavy shower the layer runs the
  // whole width of the world, and a column at a time was two calls into the
  // canvas for every one of thirteen hundred columns. Same picture, same order
  // -- the body first, its skin over the top -- for a fraction of the work.
  const body = [], skin = [];
  for (let c = from; c <= to; c++) {
    const n = (m[c] || 0) + (poo[c] || 0);
    if (!n) continue;
    const foot = muckFloor(c);

    // Loose, not packed. Grey on its own was not enough: a pile of dust in this
    // yard is a solid block of grey cells and so was this, so muck lying on a
    // pile read as more of the pile -- which is the one thing it must never read
    // as, because one of them is worth something and the other is worth nothing.
    //
    // Two things tell it apart, doing two different jobs.
    //
    // The colour says it is a different substance: a drab earth brown, beside the
    // cut's blue and the plots' green and duller than either, because those are
    // saturated for being worth something and this is worth nothing.
    //
    // Solid, and the colour does the whole job. It was holed for a while -- every
    // other cell left out, so the layer read as loose -- and two things saying one
    // thing is one of them too many: the brown already says this is not the pile
    // it is lying on, and the gaps only made a straightforward layer fussy.
    body.push(c * P, foot - n * P, n * P);
    // and the top course solid and darker, so the layer has a skin on it and a
    // depth of two reads as two rather than as one taller one
    skin.push(c * P, foot - n * P);
  }
  // and the flies, over what a body left rather than over the whole layer
  drawStink(from, to, poo);
  if (body.length) {
    ctx.fillStyle = MUCK_GREY;
    ctx.beginPath();
    for (let i = 0; i < body.length; i += 3) ctx.rect(body[i], body[i + 1], P, body[i + 2]);
    ctx.fill();
    ctx.fillStyle = MUCK_EDGE;
    ctx.beginPath();
    for (let i = 0; i < skin.length; i += 2) ctx.rect(skin[i], skin[i + 1], P, P);
    ctx.fill();
  }
  ctx.fillStyle = '#000';
}

// What the yard has put up there. Not a cloud: the motes themselves, every one
// of which climbed off a swing and is still up there. Where they have clumped
// they overlap and the sky goes dark; where they have not it stays thin. Nobody
// draws an outline, so there are no shelves and no right angles in it -- there is
// nothing in this to have an edge.
// It is also the one thing here you are looking *through*. Everything else in
// this yard is an object with an edge; the sky is a field, and a field of flat
// black rectangles reads as paint on the glass rather than as air in front of
// it. So it comes apart into colour the way a lens makes it: nothing at the
// middle of the window, a hair of red one side and cyan the other by the time
// you reach the edges.
//
// Only the motes that are actually off-centre pay for it. A fringe under half a
// pixel is a fringe nobody can see, and the sky is the most expensive thing on
// this canvas already -- so the middle of the screen draws one rectangle a mote
// exactly as it always did, and only the edges draw three.
const CA_FLOOR = 0.5;              // separation not worth drawing
const CA_INK = 0.55;               // how solid a fringe is against the mote itself
const CA_WARM = '#c02a2a';         // the red edge
const CA_COOL = '#1f9ad0';         // and the cyan one

// Drawn as a handful of paths rather than as thousands of rectangles.
//
// A full sky is six or seven thousand specks and a fat window shows a couple of
// thousand of them at once, each of them one `fillRect` and two more for its
// fringe -- eight thousand calls into the canvas, sixty times a second, for a
// field of identical squares. Every one of those calls costs the same setup
// whatever it draws, and that setup was most of what a shower cost: the yard
// visibly slowed while it rained, which is the one moment the yard is supposed
// to be at its busiest.
//
// The specks are the same size, the same weight and one of four colours, so they
// go into one path per colour and one fill each. Nothing about the picture
// changes -- the same squares land in the same places -- and there are a dozen
// calls where there were thousands.
export function drawSmog() {
  if (!SKY.length && !GOING.length) return;
  const mid = S.camX + S.viewW / 2;
  const half = Math.max(1, S.viewW / 2);

  // One path a tint *and a weight*: every speck carries its own ink -- see
  // `skyMote` -- and specks of the same colour and weight go down together, so a
  // band of six thousand is still a dozen fills rather than six thousand.
  const runs = new Map();
  const warm = [], cool = [];
  for (const m of SKY) {
    // Where it is, asked of the sky rather than read off the mote: a settled
    // mote is not written to every frame any more -- see `moteX` in smog.js.
    // The cull comes first and it is a cull on x alone, so the height and the
    // fringe are only worked out for what is actually on the glass -- four
    // motes in five never get that far.
    const mx = moteX(m);
    if (!onScreen(mx)) continue;
    const my = moteY(m);
    const x = Math.round(mx), y = Math.round(my);
    const off = Math.max(-1, Math.min(1, (mx - mid) / half)) * HAZE_CA;
    if (Math.abs(off) >= CA_FLOOR) {
      warm.push(Math.round(mx - off), y);
      cool.push(Math.round(mx + off), y);
    }
    // its kind's palette, and its own tone out of that palette. Both are fixed
    // on the mote, so a speck does not shimmer between colours frame to frame.
    const shades = SMOG_TINTS[m.kind] || SMOG_TINTS.dust;
    const tint = shades[(m.tone ?? 0) % shades.length];
    // to the nearest twentieth, so the weights fall into a handful of buckets --
    // and times whatever the mote's own fade is, which is how a speck arriving in
    // the band comes up to weight instead of appearing at it.
    //
    // `fade` was stepped, was used to decide when a mote could stop being
    // stepped, and was handed out to the hooks -- and was never once drawn. So a
    // speck reaching the top of its climb, where it joins the sky at whatever
    // place along the world the air up there has taken it, simply appeared over
    // there at full weight and vanished from over the works. See `settleHere`.
    const step = Math.round((m.ink ?? 1) * (m.fade ?? 1) * 20) / 20;
    if (!step) continue;
    const key = tint + '|' + step;
    let run = runs.get(key);
    if (!run) runs.set(key, run = { tint, ink: step, at: [] });
    run.at.push(x, y);
  }

  // ...and the ones a mouth has taken, thinning where they stood. Same buckets,
  // same fills: a fading speck is the same speck at a lighter weight, so it goes
  // down the same path as everything else rather than needing a pass of its own.
  // No fringe on them -- the chromatic edge is a thing about the sky's depth, and
  // one of these is on its way out of it.
  for (const g of GOING) {
    if (!onScreen(g.x)) continue;
    const shades = SMOG_TINTS[g.kind] || SMOG_TINTS.dust;
    const tint = shades[(g.tone ?? 0) % shades.length];
    const step = Math.round((g.ink ?? 1) * g.t * 20) / 20;
    if (!step) continue;
    const key = tint + '|' + step;
    let run = runs.get(key);
    if (!run) runs.set(key, run = { tint, ink: step, at: [] });
    run.at.push(Math.round(g.x), Math.round(g.y));
  }

  // A rect at a time, and not one path with two thousand rectangles in it.
  //
  // The path was the obvious way to write this and it was the most expensive
  // thing in the frame by a factor of twenty. One `fill()` over a couple of
  // thousand subpaths makes the browser tessellate the lot as a single shape
  // before it can lay down a pixel; `fillRect` is a fast path that never builds
  // a path at all. Same rectangles, same colours, same alpha -- a thick sky went
  // from twenty-two milliseconds to one and a half.
  //
  // It is not quite the same arithmetic, and the difference is worth knowing:
  // rectangles inside one path are filled once where they overlap, while
  // separate fills composite, so two specks on top of each other now stack to a
  // darker mark instead of one flat one. Measured over a full band that moves
  // the mean of the sky by a tenth of a level out of 255 -- these are sparse
  // enough that overlaps are rare -- and it arguably reads better, because a
  // clump of smog being denser than a single speck is what smog does.
  const spill = (pts, colour, ink) => {
    if (!pts.length) return;
    ctx.globalAlpha = ink;
    ctx.fillStyle = colour;
    for (let i = 0; i < pts.length; i += 2) ctx.fillRect(pts[i], pts[i + 1], P, P);
  };
  spill(warm, CA_WARM, HAZE_INK * CA_INK);
  spill(cool, CA_COOL, HAZE_INK * CA_INK);
  for (const run of runs.values()) spill(run.at, run.tint, HAZE_INK * run.ink);

  ctx.globalAlpha = 1;
  ctx.fillStyle = '#000';
}

// What a swing just put up: a cell off the work, climbing, thinning as it goes.
// This is the whole connection between what the crew do and what is overhead --
// without it the sky is weather and the yard is a factory, and the one has
// nothing to do with the other.
// The same weight as the haze it is on its way to becoming. It was heavier than
// that, on the reasoning that a fresh puff is thicker than old smog -- which is
// true of smoke and wrong here: a mote that arrives dark and then lightens is a
// mote that changes into something else on the way up, and the whole point of
// these is that the thing in the sky and the thing off the swing are one thing.
// Subtle enough to be air, solid enough to follow with your eye.
// Raised with the count. A haze reads as haze when a lot of faint specks
// overlap; the fix for an invisible band is mostly more of them, but a tenth of
// an ink is under what a screen can honestly show against this paper, so the
// speck itself comes up a little too. Not far -- past about a quarter these
// stop being air and start being confetti, which is the fault this number was
// held down to avoid in the first place.
const HAZE_INK = 0.2;

// Only what is on the screen. The sky runs the whole width of the world and the
// window shows a fifth of it, so four motes in five are being composited into a
// place nobody is looking -- and a thousand alpha rects a frame is the difference
// between a yard that runs and one that does not.
const onScreen = x => x > S.camX - P && x < S.camX + S.viewW + P;

// A climbing mote and a settled one are drawn by `drawSmog`, in the same pass,
// because they are the same thing. This is kept as the name the shell calls, and
// there is nothing left for it to do.
export function drawPuffs() {}

// The air going into the house: faint specks falling in from all round the hood
// while there is somebody inside it. They are not the haze -- they are worth
// nothing and counted nowhere -- and they are drawn thin enough to say so: what
// they are for is a fan over a clean sky still plainly pulling.
export function drawDraught() {
  if (!DRAUGHT.length) return;
  ctx.fillStyle = SMOG_TINTS.dust[0];
  ctx.beginPath();
  for (const k of DRAUGHT) {
    if (!onScreen(k.x)) continue;
    ctx.rect(Math.round(k.x / P) * P, Math.round(k.y / P) * P, P, P);
  }
  ctx.globalAlpha = HAZE_INK * DRAUGHT_INK;
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#000';
}

export function drawRain() {
  if (!DROPS.length) return;
  // One path for the whole shower: four thousand drops is four thousand calls
  // into the canvas otherwise, and they are all the same square in the same
  // colour. See `drawSmog` -- the same trick, for the same reason.
  ctx.fillStyle = MUCK_GREY;
  ctx.beginPath();
  for (const d of DROPS)
    if (onScreen(d.x)) ctx.rect(Math.round(d.x), Math.round(d.y), P, P);
  ctx.fill();
  // Nothing is drawn going the other way any more. What the house takes is the
  // sky itself, dragged in by the draught and drawn by `drawSmog` all the way to
  // the mouth -- there is no separate thread of specks on an errand, because
  // there is no errand.
}

// The scrubbing house: a hood open to the sky, and a bellows breathing under it.
//
// It is the only building in the yard that takes anything in at the top --
// everything else has a door -- because what this one takes comes out of the
// sky. The hood is the whole of that: five courses of black wall flaring open at
// the haze, each one stepping a cell out from the one below it, so the building
// is widest where it meets the air and narrowest where it stands. Every other
// thing on this ground is the other way up. The settlement steps back as it
// rises, the lab's chimney is under half the body under it, the school's belfry
// a tenth of its front, the casino a block that is the same block all the way to
// the roof. A shape that opens upward is a shape that takes from up there, and
// there is only one of them.
//
// Four cells of wall and not two. Two was a wall leaning at forty five degrees
// that measured one and a half cells through -- thinner than the lab's flue,
// thinner than the settlement's chimney, the thinnest structural member in the
// yard, and carrying the single sentence this building exists to say. At four it
// measures the same through as the lab's chimney does, which is the weight
// everything else here is drawn at, and the top course is two runs of four cells
// standing against the haze rather than two ticks of linework in it.
//
// Five courses of it and not four. At four the notch in the sky stopped at five
// cells across and the last of the taper had to be finished in white, inside the
// tower, where it was two courses of paint on a black face and gone from a few
// feet away -- a splayed collar rather than a funnel. At five the mouth closes to
// three cells in the silhouette itself: eleven, nine, seven, five, three. The
// blocked-out shape is the whole of what you can see of any building here from
// the far end of the ground, so the one sentence this building says has to be
// said in it.
//
// What it had was a body with a stack on it and a square punched in the front,
// which is drawLab's construction with the chimney slid to the middle -- and
// that square was a wide hole with something turning in it, a few dozen cells
// along the same walk from a casino which is a wide hole with something turning
// in it. Then it was a notch cut down into the top of a block, which was the
// right idea drawn the wrong way round: a notch that narrows and stops is a
// bevelled roof. Then it was a rack of four slots with blocks riding in them,
// which is the school's front drawn larger -- narrow openings ranked across a
// black face, symmetric about the middle, a stub on the roof -- and one-cell
// piers between two-cell voids go to grey at any distance, so the band read as a
// single white bar with something moving in it, which is the casino a third
// time. The mouth is mass now, and it closes the whole way, from eleven cells of
// sky to one, whether there is anybody in there or not. What a building IS
// cannot depend on whether it is working.
//
// What it is DOING is one thing and not a row of things, and it is not an
// aperture at all: a bellows, hung from the head of a shaft that stands dead on
// the middle column, under the point of the throat. Five cells across in a shaft
// seven wide, so there is a clear cell of white down either side of it however
// it is folded -- the blades welded themselves to the housing and the plungers
// filled their slots edge to edge, and a black thing touching black wall on both
// sides is not an object in a shaft, it is a bridge across one. The jambs beside
// the shaft are two cells and the tower is eleven, so black outweighs white
// across the working band in every pose the thing has. A mass with holes in it,
// which is how every building here is built, and never a white box with lines
// round it.
//
// A bellows because it is the one machine that is unmistakably about air, and
// because of the way it moves. Everything else in this yard that works moves by
// going somewhere: the wheel turns, the bar fills, the plunger slides, the arm
// swings. A thing photographed on its way somewhere looks exactly like the same
// thing stopped there -- that is the answer the fan never gave, a fan halted at
// some angle being precisely a fan caught mid-turn, so the picture of the empty
// house was the picture of the worked one. A bellows does not travel. It changes
// its own proportions. Shut, it is a solid tongue of four courses hanging off
// the head of the shaft; open, it is four leaves with air between them; and
// there is no instant you can catch it at where those are the same picture.
//
// It opens a fold at a time, from the mount downward, because a fold is a whole
// cell and this yard has no half ones -- the whole of it stretching evenly would
// be four leaves each moving a third of a cell. So the fold under the mount goes
// first, then the one under that, then the last, and the wave runs down the
// folds of one object instead of along a rank of four pumps. That is the reading
// the rack was after, got out of a single thing.
//
// Shut is rest, and only rest. Under work the count of open folds runs one, two,
// three, two, and never reaches nought: there is always air in it while there is
// a hand on it. So there is no frame of the working bellows that is the frame of
// the idle one, which is the whole trouble with a signal made of nothing
// happening. And it settles rather than snaps -- when the last body leaves, the
// folds close one at a time down to shut (scrubhouse.js stepScrub) rather than
// the picture cutting to the parked pose. A machine that stops is a machine you
// watch stop.
//
// One bellows for any number of bodies, and it beats faster with each of them up
// to four, which is the cap the lab's chimney smokes on. One leaf to a body
// reads beautifully up to four and then lies: nothing caps this roster the way a
// bench caps the quarry or a plot caps the plot, and a fifth body pulls another five
// and a half motes a second out of the sky off a front that has not changed by a
// cell. The count is written under the building on its roster. What the building
// says is how hard it is being worked, which a rate can say honestly at any
// number.
//
// Every edge is a whole cell off the building's own corner, which world.js snaps
// to the lattice. It was laid out in fractions of w and h -- a body top at 2.6
// cells, a fan hub at 7.54 -- and a quarter-cell edge antialiases, which made
// this the one building in the game with grey on it.
const HOOD = 5;          // courses of hood standing against the sky, above the tower
const HOOD_WALL = 4;     // and cells of black through each of its two walls
const BAY = 8;           // courses of shaft the bellows hangs in
const LEAF = 5;          // and cells across every leaf of it, in a shaft LEAF + 2 wide
// see config.js: the mechanic reads these two as well, so they live there
const CHUTE = SCRUB_CHUTE;

// The tower. The one building in this yard that goes up rather than along: a
// narrow shaft, a band of stone every few courses so it reads as built rather
// than extruded, and a lit window near the top that is the only light in the
// yard nobody walks to. Everything else out here is a shed or a hole.
// The outhouse. The smallest thing anybody builds here, and the only one whose
// whole job is somewhere to be for a minute: a black shed with a pitched roof, a
// door cut white out of it, and the moon over the door that every outhouse ever
// drawn has had.
//
// The moon goes solid once the tower has seen to it. That is the only sign the
// magic is working -- what it does is make a thing not happen, and there is no
// way to draw an absence except by marking the place it would have been.
export function drawOuthouse() {
  const rising = risingPlace() === 'outhouse';
  if (!S.outhouseOpen && !rising) return;
  const { x, y, w, h } = outhouse;
  withRise(rising, x, S.groundY, w, h, () => {
    const c = n => x + P * n;
    const r = n => y + P * n;
    const WIDE = Math.round(w / P);              // 7 across
    const TALL = Math.round(h / P);              // 10 down
    const MID = (WIDE - 1) / 2;                  // the middle column: 3 of 0..6
    const ROOF = 4;

    // A pitched roof, built out of odd courses about the middle column: three,
    // five, seven and then nine, the last of them overhanging a cell each side the
    // way eaves do.
    //
    // Every one of those is odd and centred on a whole column, which is the whole
    // fix: it was a share of the width rounded per course, and 7/2 is 3.5 -- so
    // both edges of a course rounded the same way and the roof came out a cell
    // wider on the right than on the left. A symmetrical thing has to be built
    // out of symmetrical numbers, not rounded into symmetry afterwards.
    ctx.fillStyle = '#000';
    for (let i = 0; i < ROOF; i++) {
      const half = i + 1;                        // 1, 2, 3, 4 -> 3, 5, 7, 9 wide
      ctx.fillRect(c(MID - half), r(i), P * (half * 2 + 1), P);
    }
    ctx.fillRect(x, r(ROOF), w, h - P * ROOF);

    // The way in: three cells wide on a seven-cell front, so it stands on whole
    // columns with two of wall either side of it. It was two cells wide starting
    // at a *half* column -- the one door in the yard drawn off the lattice, with
    // the grey fringe down both jambs that comes with it.
    const DOOR = 3;
    ctx.fillStyle = '#fff';
    ctx.fillRect(c(MID - (DOOR - 1) / 2), r(TALL - 5), P * DOOR, P * 5);

    // and the moon cut in the door, three by three about the same column, which is
    // what says shed rather than shack.
    const my = r(ROOF + 1);
    ctx.fillRect(c(MID), my, P * 2, P);
    ctx.fillRect(c(MID - 1), my + P, P, P);
    ctx.fillRect(c(MID), my + P * 2, P * 2, P);
    ctx.fillStyle = '#000';
  });
}

// The tower. Everything the crew put up is a shed or a hole; this is neither, so
// it is the one thing here with a roof that comes to a point -- and a smaller one
// beside it doing the same, because two pointed roofs at different heights is
// what a tower reads as and one is just a spike.
//
// Drawn the way every other building here is drawn: a solid black silhouette
// with the openings cut white out of it. It is the shape that carries a building
// in this game, not the outline -- the school is a black block with a belfry, the
// scrubbing house is a black block with a chute, and a tower is a black shaft
// with a hat on.
export function drawTower() {
  const rising = risingPlace() === 'tower';
  if (!S.towerOpen && !rising) return;
  const { x, y, w, h } = tower;
  withRise(rising, x, S.groundY, w, h, () => {
    const c = n => x + P * n;                    // cell n across the front
    const r = n => y + P * n;                    // and n down from the top
    const WIDE = Math.round(w / P);              // 13 across
    const TALL = Math.round(h / P);              // 34 down
    const SHAFT = TOWER_SHAFT;                   // the main shaft, on the left
    const TUR = WIDE - SHAFT;                    // and the little one beside it
    const SPIRE = 7;                             // rows of roof on the main
    const TUR_ROOF = 4;                          // on the turret
    const TUR_TOP = 14;                          // how far down the turret starts

    // A roof that comes to a point, drawn the only way a point can be drawn in
    // cells: a stack of rows each a little wider than the last.
    const spire = (cx, cw, top, rows) => {
      const mid = cx + cw / 2;
      for (let i = 0; i < rows; i++) {
        const half = ((i + 1) / rows) * (cw / 2);
        const from = Math.round(mid - half), to = Math.round(mid + half);
        ctx.fillRect(c(from), r(top + i), P * Math.max(1, to - from), P);
      }
    };

    ctx.fillStyle = '#000';
    spire(0, SHAFT, 0, SPIRE);                             // the hat
    ctx.fillRect(x, r(SPIRE), P * SHAFT, P * (TALL - SPIRE));   // the shaft
    spire(SHAFT, TUR, TUR_TOP, TUR_ROOF);                  // the little hat
    ctx.fillRect(c(SHAFT), r(TUR_TOP + TUR_ROOF), P * TUR, P * (TALL - TUR_TOP - TUR_ROOF));

    // A weather vane over the point: one cell up, and one across it. The flick of
    // the hat that says somebody lives here on purpose.
    ctx.fillRect(c(SHAFT / 2) - P / 2, r(-2), P, P * 2);
    ctx.fillRect(c(SHAFT / 2) - P * 1.5, r(-3), P * 3, P);

    // The openings, cut white out of it. Tall and narrow like the school's, and
    // stacked up the shaft rather than in a row: a tower is read by how far up its
    // windows go.
    ctx.fillStyle = '#fff';
    for (const n of [SPIRE + 3, SPIRE + 9, SPIRE + 15])
      ctx.fillRect(c(3), r(n), P * 2, P * 3);
    ctx.fillRect(c(SHAFT + 1), r(TUR_TOP + TUR_ROOF + 3), P * 2, P * 2);
    // a slit in the spire, the way the school's belfry rings out of one
    ctx.fillRect(c(SHAFT / 2) - P / 2, r(SPIRE - 3), P, P * 2);
    // and the way in, the same door every other building has
    ctx.fillRect(c(SHAFT / 2 - DOOR_W / 2), y + h - P * DOOR_H, P * DOOR_W, P * DOOR_H);

    ctx.fillStyle = '#000';
  });
}

// What the tower does while it is making a hat: rings of light going out from
// the point of it, one after another, in the wizards' own purple.
//
// It was the windows blinking out one at a time up the shaft, which is a lamp
// being switched rather than a spell being cast -- and a building that says it
// is working by *stopping* saying something is a building arguing with itself.
// This is the same shape the star's corona is: cells on a ring, going out.
//
// Drawn after the tower rather than on it, so the rings pass over the stone the
// way light would.
export function drawTowerWaves() {
  if (!S.towerOpen) return;
  // Always something coming off it, and more of it while it is working.
  //
  // A tower that was blank until you bought a hat was a building that did
  // nothing for most of the game -- and this is the one building in the yard
  // that is *magic*, standing among sheds that are honestly made of planks. It
  // should be plainly doing something at rest. So the rings never stop: they go
  // out slower, thinner and shorter when the bench is idle, and the fast bright
  // ones are what the brewing looks like on top of that.
  const work = brewing();
  const pace = work ? TOWER_WAVE_MS : TOWER_WAVE_MS * 2.6;
  const reach = work ? TOWER_WAVE_R : TOWER_WAVE_R * 0.55;
  const ink = work ? 0.85 : 0.3;
  // On the vane, which is the top of the thing and the only part of it that is
  // not stone: rings coming off the middle of the spire's *base* were rings
  // coming off the roof, a couple of cells low and reading as slightly slipped.
  const from = { x: tower.x + P * 4, y: tower.y - P * 2 };
  for (let i = 0; i < TOWER_WAVE_N; i++) {
    const k = ((now() / pace) + i / TOWER_WAVE_N) % 1;
    const rad = k * reach;
    if (rad < P) continue;
    // fainter as it goes out, and deeper down the purples with it: a ring that
    // held its colour all the way would read as a hoop rather than as something
    // spending itself on the air
    ctx.globalAlpha = (1 - k) * ink;
    ctx.fillStyle = MAGIC_TONES[Math.min(MAGIC_TONES.length - 1, Math.floor(k * 3))];
    // a cell every cell round the circumference, so it is a ring rather than a
    // dotted line pretending to be one
    const n = Math.max(10, Math.round((Math.PI * 2 * rad) / P));
    ctx.beginPath();
    for (let j = 0; j < n; j++) {
      const a = (j / n) * Math.PI * 2;
      cell(from.x + Math.cos(a) * rad, from.y + Math.sin(a) * rad);
    }
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#000';
}

// How far along the hat is, over the tower: the same bar the lab gets, in the
// same place over the building doing the work, filling a cell at a time.
//
// The board says the same thing in words, and that is not enough on its own: a
// number you have to walk across the yard and open a menu to see is a number you
// check once and forget is running. This is the two minutes made visible from
// wherever you happen to be standing.
export function drawTowerBar() {
  if (!S.towerOpen || !brewing()) return;
  const at = towerBarAt();
  const w = P * 14, h = P * 3;
  const x = at.x - w / 2, y = at.y - h / 2;

  ctx.fillStyle = '#fff';
  ctx.fillRect(x, y, w, h);
  ctx.lineWidth = Math.max(1, P / 3);
  ctx.strokeStyle = '#000';
  ctx.strokeRect(x, y, w, h);

  ctx.fillStyle = '#000';
  const room = w - P * 2;
  const done = Math.round(room * brewAt() / P) * P;
  if (done > 0) ctx.fillRect(x + P, y + P, done, h - P * 2);

  // and the hat it is making, over the bar, so the bar is about something
  drawHat(at.x - WORKER / 2, y - P * 2, 'point', true);
}

// Clear of the weather vane over the point, which is three cells up from the
// roof: a bar drawn through it would be two marks in one place.
// Over the spire, not over the building. The turret off the right-hand side is
// two and a half cells of the tower's width, so the middle of the whole thing
// sits well to the right of the point -- and a bar about the hat being made
// under that roof belongs over that roof.
export function towerBarAt() {
  return { x: Math.round((tower.x + P * TOWER_SHAFT / 2) / P) * P,
           y: Math.round((tower.y - P * 8) / P) * P };
}

// The craft the scrubbing house sells, one per lane. See balloon.js.
//
// Everything about where it is comes off the craft's own geometry -- the mast is
// the house's door, the lane is off the sky's own top and bottom, and the height
// is eased between the two by `lift`. Nothing here is remembered, so a balloon
// cannot end up drawn over a house that has been re-sited under it.
//
// **The filter is the point of the drawing.** A bag with a basket under it is a
// balloon; what makes this one read as a *scrubber* is the works slung between
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

export function drawScrub() {
  const rising = risingPlace() === 'scrub';
  if (!S.scrubOpen && !rising) return;
  const { x, y, w, h } = scrub;
  withRise(rising, x, S.groundY, w, h, () => {
  const on = inScrub() > 0;
  const across = Math.round(w / P), down = Math.round(h / P);
  const throatMid = (across - 1) / 2;      // the middle column, wanted before the shaft is
  const c = (n) => x + P * n;                        // cell n across the front
  const r = (n) => y + P * n;                        // and cell n down it

  ctx.fillStyle = '#000';
  // The hood, drawn as its two walls rather than as a block with the mouth
  // painted white back out of it. Over sky those are the same picture -- the
  // paper is already white and drawing white on it changes nothing -- so the only
  // part worth spending a rect on is the part that is actually there. Four cells
  // thick, stepping in one a course, which is a wall leaning at forty five
  // degrees drawn as the cells it would be built from.
  for (let i = 0; i < HOOD; i++) {
    ctx.fillRect(c(i), r(i), P * HOOD_WALL, P);
    ctx.fillRect(c(across - HOOD_WALL - i), r(i), P * HOOD_WALL, P);
  }
  // The tower: exactly as wide as the hood has come down to, so the walls land on
  // it rather than beside it and the two are one object.
  const towerL = HOOD - 1;
  ctx.fillRect(c(towerL), r(HOOD), P * (across - towerL * 2), h - P * HOOD);

  // The throat: the same taper carried on past the last course of hood and cut
  // white out of the tower's head -- eleven cells of sky, nine, seven, five,
  // three, and then the one cell that is the hole itself. It comes to a point and
  // goes in, which is what a funnel does, and that last cell, dead on the middle
  // column, is where the caught motes end (smog.js intake()). One line of
  // arithmetic runs the whole taper from the top course to the point, so the
  // mouth and the hole cannot fall out of step: the wall stops being drawn where
  // the tower starts, and the same inner edge goes on closing.
  //
  // Open while somebody is drawing through it, shut when nobody is -- the only
  // part of this building that is a different shape empty than worked, and it is
  // one cell, on purpose. What the house IS is the hood, and the hood is mass and
  // closes the whole way whichever it is; all that changes is whether there is a
  // hole at the end of it. It is also the far end of the thread of motes, so a
  // thread that arrives finds something to arrive at rather than a black face.
  // A mote is let go once it is within a cell or two of the hole (smog.js
  // pull()), and every cell it can be let go in is inside this building -- the
  // throat of the hood above it, the wall of the tower below -- so a thread that
  // ends early ends inside the mouth. It used to end in the air over a roof tab
  // that touched the building nowhere.
  //
  // Under it, it was going to fan out into a course of white across the head of
  // the works, to draw the route from the mouth to them. That is a white T laid
  // hard against a front that already has one big hole in it, and the pair read
  // as two shelves rather than as one thing feeding another. What happens between
  // the mouth and the works happens inside the building, which is the same
  // bargain the lab makes with its door.
  //
  // One cell, on the middle column, and it is always open. It was a loop carrying
  // the taper on for as many courses as the arithmetic allowed, which sounds
  // general and is not: at this width the first turn already closes the gap to a
  // single cell and the second breaks, so the loop ran once and drew the one cell
  // it now draws plainly.
  //
  // And it does not blink. It was white while somebody was drawing through it and
  // black when nobody was, which put the whole of the building's state into one
  // cell -- a cell with white on three sides of it, so opening it extended a notch
  // rather than knocking a hole in anything, at the far end of the longest walk in
  // the game. The bellows says whether this place is working. A second, worse
  // telling of the same fact is not redundancy, it is noise.
  ctx.fillStyle = '#fff';
  ctx.fillRect(c(throatMid), r(HOOD), P, P);

  // The shaft, and the bellows in it. It starts one whole solid course below the
  // point of the throat: without that course the hole at the end of the funnel
  // would open straight into the top of the shaft, and a hole opening into a hole
  // is one tall opening rather than a mouth over a works.
  //
  // Everything on the front is worked out from the middle column, which an odd
  // front has and an even one does not. The shaft is LEAF + 2 wide about it, the
  // door is DOOR_W wide beside it, and the throat closes on to it, so the building
  // has one axis and everything that goes into it goes in on that axis: the sky
  // at the top, the crew at the bottom, the works between the two.
  const mid = (across - 1) / 2;
  const head = HOOD + 2;
  ctx.fillStyle = '#fff';
  ctx.fillRect(c(mid - (LEAF + 1) / 2), r(head), P * (LEAF + 2), P * BAY);

  // The folds. A cell at a time, like the lab bar: half a cell of travel is a
  // leaf drawn across a fraction of a device pixel, which is the one thing the
  // yard never does. So the bellows opens a fold at a time from the mount
  // downward and the count of open folds is the whole of the animation --
  // scrubhouse.js keeps it, because a clock kept in the draw loop runs at double
  // speed the moment anything draws the yard twice in a frame.
  //
  // The triangle is what makes it breathe: going shut takes as long as opening,
  // where a bellows that snapped back would be a thing that teleports once a
  // second. Worked, it never lets the count reach nought -- there is always air
  // in it while there is a hand on it -- so the one pose that means nobody is
  // home is a pose the working cycle cannot show. Idle it is four courses of
  // solid black hanging off the head of the shaft, with white down both sides of
  // it and four clear courses under its foot: a tongue in a shaft, which is a
  // thing that could move, and not a window, which is a thing that could not.
  //
  // The shaft is deep enough for the whole of the stroke and one cell over, so
  // the foot of the bellows never lands on the floor of its own shaft. A plate
  // sitting flush on a floor has no floor left under it to sit on. It holds a
  // beat at the shut end, where the count is one twice running, which is where a
  // bellows dwells anyway: the hand is at the bottom of the push.
  //
  // A leaf is one cell thick, which is thinner than anything this building is
  // allowed to be built out of -- four cells through the hood wall, two through
  // the jambs -- and that is the difference between a member and a moving part. A
  // fold of a bellows carries nothing. It is thin because a fold is thin.
  const k = Math.floor(S.pumpAt) % (SCRUB_FOLDS * 2);
  const fold = k <= SCRUB_FOLDS ? k : SCRUB_FOLDS * 2 - k;
  const open = on ? Math.max(1, fold) : fold;
  ctx.fillStyle = '#000';
  for (let i = 0; i <= SCRUB_FOLDS; i++)
    ctx.fillRect(c(mid - (LEAF - 1) / 2), r(head + i + Math.min(i, open)), P * LEAF, P);

  // The way in. A scrubber walks the length of the yard to get here and has to
  // arrive somewhere -- the settlement gives a body a P*4 doorway explicitly so
  // that a building does not read as a model of a building, the school's stands
  // open, the casino has one because somebody goes in -- and before this there
  // was nowhere on the front for a body to go, so a scrubber crossed the ground
  // and evaporated against the most solid column of it.
  //
  // DOOR_W by DOOR_H, which is the way in at the school, the lab, the casino and
  // the crew's own rooms as well: what a door is measured against is a body, and
  // a body is the same body wherever it is walking. See config.js.
  //
  // This is the one front in the yard an even door cannot centre on. Everything
  // here is worked out from the middle column, and a four-cell door about a
  // single column lands half a cell to one side of it -- three world units, at
  // the foot, under a tower whose axis has not moved. The alternative was an odd
  // door everywhere, which would have thrown the school, the lab and the house
  // off the lattice instead to keep this one on it.
  //
  // Four courses of foot under the works, which config.js is holding the extra
  // course for: the door stands on the ground and stops one course short of the
  // shaft, so there is still a solid course between the way in and the works.
  ctx.fillStyle = '#fff';
  ctx.fillRect(c(mid - DOOR_W / 2 + 1), r(down - DOOR_H), P * DOOR_W, P * DOOR_H);
  ctx.fillStyle = '#000';

  // The recycler, drawn at the end of the process rather than at the start of it:
  // what it catches used to go in and stop, and now some of it comes back out as
  // dust on the ground beside the building. So it is a chute: an arm out of the
  // near wall, two courses deep, cantilevered clear of the building and turning a
  // cell down at its end. The lip is what makes it a chute rather than a buttress
  // -- a shelf that runs into the floor is part of the floor -- and it is what
  // the left-hand silhouette gains: something that overhangs, and points at the
  // ground where the grain lands.
  //
  // Mass hung off the wall, not a hole cut into it. Every version of this upgrade
  // that was white disappeared: a square laid over ground the building had
  // already painted white showed as a two-pixel nick, and a mouth cut at the foot
  // ran into the bottom of the works and turned them into a shaft with the end
  // knocked out. Black on sky at the one corner where this building has nothing
  // is a change you can see from where the rest of the yard is read.
  //
  // Both halves of it are measured off the wall it hangs on and off the cell the
  // grain leaves from, and off nothing else. The arm is CHUTE cells long because
  // that is what it takes to cross the empty box beside the tower's face and come
  // out one cell past the corner the hood's flare comes down to: an arm that
  // stopped level with that corner would be a foot growing under the overhang,
  // which is a building getting bigger rather than a building growing a spout.
  // It ends over the cell smog.js releases the grain from (outlet()), which is
  // the only number in this that is not ours to choose. The lip drops from that
  // same end rather than from a course counted off the building, so the two
  // cannot come apart if the shaft is ever a course deeper. Under the whole of it
  // is daylight, and under the lip one clear cell of it before the ground.
  //
  // It sits on the courses of foot, clear below the shaft, so what it is bolted
  // to is the full width of solid wall. Hung level with the works, a two-course
  // arm had a one-course jamb to be bolted to and nothing else.
  //
  // It was a post standing a cell proud of the roof, which is the lab's flue and
  // the settlement's chimney said in the same three cells, and in this yard a
  // thing standing out of a roof means something going OUT into the sky. This one
  // means the opposite.
  //
  // Hung a course higher than it first was, and its lip measured off its own
  // underside rather than off the bottom of the box. Two things were wrong with
  // the old arithmetic. A body is three courses tall and stands on the bottom
  // three, so an arm two courses off the ground left one clear course and every
  // scrubber the house was given walked out from under it with its head inside
  // the chute -- daylight underneath is true of paper and false of anything that
  // walks. It hangs off the foot of the building and the courses of daylight
  // wanted under it, which is the thing that actually decides where it goes. It
  // used to be measured off the door, which decides nothing about it, so widening
  // the way in by a course swung the arm down into the crew.
  //
  // Old note, kept because the shape of the mistake is worth keeping: the arm was
  // measured off the door while the lip was measured off
  // the foot, so they met only because two sums happened to agree: widen the door
  // by a course and the lip detaches and hangs in the air by itself.
  if (!S.recycler) return;
  ctx.fillStyle = '#000';
  const end = c(towerL) - P * CHUTE;
  const armTop = down - SCRUB_ARM - 2;
  ctx.fillRect(end, r(armTop), P * CHUTE, P * 2);
  ctx.fillRect(end, r(armTop + 2), P, P);
  });
}

// The casino: a block with one big round hole knocked out of it, and a wheel in
// the hole. Everything else in this yard is a shape with holes in it, and a
// wheel is the one thing that is properly round -- which is why it is the whole
// of the building rather than a detail on it.
//
// The wheel turns while there is a pot on the table and spins in earnest while a
// ride is being settled, and that is the entire signal: the rows say what the
// numbers are, and this says whether anything is happening.

// --- the sign -----------------------------------------------------------------
// The one place in this yard with writing on it, and it has earned it: every
// other building says what it is by being the shape it is -- a chimney, a row of
// plots, a hole in the ground -- and a casino says what it is by shouting. A sign
// is what the building *is* rather than a label somebody stuck on it.
//
// Letters are five cells square, stacked down a board narrower than the block it
// stands on, with a chase of lights round the edge. The lights are the whole
// reason it is here: nothing else in the yard blinks, so from the far end of the
// ground the only thing moving out past the lab is this.
// Five cells across and four down. Four rather than five because the sign has to
// stand on the roof and still have its top in the window: six letters five deep
// ran a good hundred pixels past the sky you can see, and a sign whose top you
// can never read is a sign that is not a sign.
// Seven cells across and five down, and every stroke one cell thick.
//
// It was four rows for a while, to keep the whole board inside the sky, and four
// rows is one short of what half these letters need: an S is top bar, upper
// stem, middle bar, lower stem, bottom bar, and squeezing that into four gives
// you two dashes passing each other however you draw it. The C and the O had the
// same trouble in a milder form. The sign is a few cells taller instead, which
// costs nothing but sky -- there is plenty of it -- and buys every letter the
// row it was missing.
//
// One cell thick, too. Every glyph-cell is drawn two world cells across, so a
// stroke drawn three glyph-cells thick came out thirty-six pixels of solid ink
// and the letters read as blocks with notches in them. A letter is a line with
// air round it.
const GLYPH = {
  // A C is a ring with a side missing, so the side has to be *missing*. It was
  // drawn with the right-hand stem still standing at the first and last rows and
  // only the middle row open, which is not a C -- it is an O with a notch in it.
  C: ['0111110', '1000000', '1000000', '1000000', '0111110'],
  A: ['0111110', '1000001', '1111111', '1000001', '1000001'],
  S: ['0111111', '1000000', '0111110', '0000001', '1111110'],
  I: ['1111111', '0001000', '0001000', '0001000', '1111111'],
  // and an N is two stems and one unbroken diagonal between them, corner to
  // corner. It had a two-cell staircase floating in the middle, touching
  // neither, which reads as an H somebody has dropped something on.
  N: ['1100001', '1010001', '1001001', '1000101', '1000011'],
  O: ['0111110', '1000001', '1000001', '1000001', '0111110']
};
const WORD = 'CASINO';
// Every glyph-cell is two world cells: at one, the whole word came to twenty-four
// screen pixels and read as a stack of smudges. A sign is for being read from
// the far end of the ground.
//
// Unless there is no room for it. On a short window there is less sky than the
// board is tall, and half a sign is worse than a small one -- so it drops to one
// cell a glyph rather than running off the top. Whole numbers only: half a cell
// is a cell drawn across a fraction of a device pixel, which is the one thing
// this game never does.
// (`window.__signScale = 2` forces the big one on a window too short for it,
// which is the only way to look at it without owning a taller screen.)
const scale = () => (import.meta.env.DEV && window.__signScale) ||
  ((signH(2) + CASINO_H / P) * P <= S.groundY - S.camY ? 2 : 1);
// The gap and the margin are two cells, not one. A stroke is two world cells
// thick at full size, so one cell of air between a letter and the bulb beside it
// is less air than the letter is thick -- the two ran together and the whole
// board read as texture. A letter needs a clear cell of nothing around it before
// anything else starts.
const GLYPH_H = 5, GLYPH_W = 7, GLYPH_GAP = 2, SIGN_PAD = 2;
const signW = k => GLYPH_W * k + SIGN_PAD * 2;
const signH = k => WORD.length * (GLYPH_H * k + GLYPH_GAP) - GLYPH_GAP + SIGN_PAD * 2;
const CHASE_MS = 130;            // how fast a light walks round the border
const CHASE_EVERY = 4;           // and how many dark ones stand between the lit

// On the roof, stood up out of the middle of it, which is where a casino puts
// its name. What that costs is height -- the whole of it has to be inside the
// sky you can actually see -- which is why the letters are four cells deep
// rather than five.
function drawSign() {
  const k = scale();
  const w = signW(k), h = signH(k);
  const x = Math.round((casino.x + casino.w / 2 - (w * P) / 2) / P) * P;
  const y = Math.round((casino.y - h * P) / P) * P;

  // the board itself: white paper with a black edge, like everything else here
  ctx.fillStyle = '#fff';
  ctx.fillRect(x, y, w * P, h * P);
  ctx.lineWidth = Math.max(1, P / 3);
  ctx.strokeStyle = '#000';
  ctx.strokeRect(x, y, w * P, h * P);

  // the word, down the board
  ctx.fillStyle = '#000';
  WORD.split('').forEach((ch, n) => {
    const rows = GLYPH[ch];
    const top = SIGN_PAD + n * (GLYPH_H * k + GLYPH_GAP);
    for (let r = 0; r < GLYPH_H; r++)
      for (let c = 0; c < GLYPH_W; c++)
        if (rows[r][c] === '1')
          ctx.fillRect(x + (SIGN_PAD + c * k) * P, y + (top + r * k) * P, P * k, P * k);
  });

  // and the lights, walking round the edge. A whole cell at a time, like
  // everything that moves in this game: a bulb is on or it is off.
  const step = Math.floor(now() / CHASE_MS);
  ringCells(w, h).forEach(([cx, cy], i) => {
    if ((i + step) % CHASE_EVERY) return;
    ctx.fillRect(x + cx * P, y + cy * P, P, P);
  });
}

// every cell round the border of the sign, in order, so a light walking the
// list walks the edge
let ring = null, ringKey = '';
function ringCells(w, h) {
  const key = `${w}x${h}`;
  if (ring && ringKey === key) return ring;
  ringKey = key;
  ring = [];
  for (let c = 0; c < w; c++) ring.push([c, 0]);
  for (let r = 1; r < h; r++) ring.push([w - 1, r]);
  for (let c = w - 2; c >= 0; c--) ring.push([c, h - 1]);
  for (let r = h - 2; r > 0; r--) ring.push([0, r]);
  return ring;
}

// The chips the table throws when a spin lands. They are scenery: they never
// come down anywhere, they are worth nothing, and they are gone in a second and
// a half. Drawn last of the building's parts so they pass in front of the wheel
// that threw them.
// The pot is a real plot of sand now -- see casino.js -- so it is blitted like
// the yard and the hole rather than drawn a triangle at a time.
export function drawPotPile() {
  if (!S.casinoOpen || !table.grid || !table.n) return;
  drawGrid(table);
}

export function drawSparks() {
  for (const k of S.tableAir) {
    const find = findKind(k.s);
    // A grain on its way out of the game fades as it goes. Everything else in
    // this yard either is somewhere or is not; this is the one thing that is
    // *leaving*, and it should look like it rather than blinking off.
    if (k.fade) ctx.globalAlpha = Math.max(0, 1 - k.t / TABLE_LIFE);
    ctx.fillStyle = find ? FIND_COLOR[find][k.s - find] : SHADES[Math.min(SHADES.length, k.s) - 1];
    ctx.fillRect(Math.round(k.x), Math.round(k.y), P, P);
    ctx.globalAlpha = 1;
  }
  ctx.fillStyle = '#000';
}

export function drawCasino() {
  const rising = risingPlace() === 'casino';
  if (!S.casinoOpen && !rising) return;
  const { x, y, w, h } = casino;
  withRise(rising, x, S.groundY, w, h, () => {
  ctx.fillStyle = '#000';
  ctx.fillRect(x, y, w, h);                                // the block

  // The wheel: eight slices, half bare and half filled, alternating all the way
  // round -- which is the odds written on the thing itself. Black and white, like
  // the rest of the yard: white is the way through and black is the wall, the
  // same as every doorway on this ground, so it needs no colour to say it. See
  // CASINO_KEEP in config.js -- the two used to be the other way about.
  // Set low enough in the block that the pointer above it clears the roof: the
  // sign stands up out of the middle of that roof, and a pointer at the top of
  // the wheel was drawn straight into the bottom of the sign board.
  const cx = x + w / 2, cy = y + h * 0.62, r = Math.min(w, h) * 0.38;
  const step = (Math.PI * 2) / CASINO_SLICES;

  // A white disc knocked out of the block first, a cell proud of the rim. Half
  // the slices are black and half are white, and neither reads on a black
  // building without it: the black ones would vanish into the wall and the white
  // ones would have no edge to stop at. What makes it read as a wheel is the
  // white it is set in, and the rim drawn round the lot.
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(cx, cy, r + P, 0, Math.PI * 2);
  ctx.fill();
  for (let i = 0; i < CASINO_SLICES; i++) {
    ctx.fillStyle = sliceKeeps(i) ? CASINO_KEEP : CASINO_LOSE;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, S.wheel + i * step, S.wheel + (i + 1) * step);
    ctx.closePath();
    ctx.fill();
  }

  // A divider on every cut, so it reads as eight slices rather than as a few
  // black shapes. They are white: the only place a divider is *needed* is
  // between two filled slices, and a white line is exactly what shows there --
  // between two bare ones there is nothing to divide.
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i < CASINO_SLICES; i++) {
    const a = S.wheel + i * step;
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
  }
  ctx.stroke();

  // and the rim round the lot, which is what makes it a wheel and not a pattern
  ctx.strokeStyle = '#000';
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.arc(cx, cy, P * 0.9, 0, Math.PI * 2);
  ctx.fill();

  // And the pointer, at the top, which is the whole of what a spin says: the
  // slice under it when the wheel stops is the answer. It does not turn, and it
  // is white, because what it is standing against is the black of the building.
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.moveTo(cx, cy - r + P * 1.4);
  ctx.lineTo(cx - P * 1.4, cy - r - P * 1.8);
  ctx.lineTo(cx + P * 1.4, cy - r - P * 1.8);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#000';

  // A door, because somebody goes in. Off to one side rather than under the
  // wheel: the wheel is what this building is, and a hole cut under it would
  // read as part of the works. Two clear cells of wall hold it off the corner.
  //
  // It is DOOR_W by DOOR_H like every other way in -- three by five before, which
  // was the tallest door in the yard and the only one taller than it was wide.
  ctx.fillStyle = '#fff';
  ctx.fillRect(x + w - P * (DOOR_W + 2), y + h - P * DOOR_H, P * DOOR_W, P * DOOR_H);
  ctx.fillStyle = '#000';

  drawSign();
  });
}

// Which way the last hand went, standing over the casino for a few seconds.
//
// A wheel that stopped and told you nothing is a wheel you had to have been
// watching, and you are usually somewhere else in the yard. So a settled hand
// leaves a mark, in the same box the lab's news stands in: a tick for a win,
// with what it is now worth written under it, and a cross for a hand that is
// gone. Two answers, one shape each, and neither of them a word.
const CROSS = [[-2, -2], [-1, -1], [0, 0], [1, 1], [2, 2],
               [2, -2], [1, -1], [-1, 1], [-2, 2]];

// Clear of the sign, which stands up out of the middle of the roof: a mark
// behind a hundred cells of CASINO is a mark nobody sees. It goes over the pot
// instead, which is the thing the news is about.
export function casinoMarkAt() {
  return { x: potAt().x, y: Math.round((S.groundY - P * 22) / P) * P };
}

export function drawCasinoMark() {
  if (!S.casinoOpen || !S.hand) return;
  const at = casinoMarkAt();
  const y = at.y + Math.round(Math.sin(now() / 500)) * P;
  const won = S.hand.won;

  ctx.fillStyle = '#fff';
  ctx.fillRect(at.x - P * 3.5, y - P * 3.5, P * 7, P * 7);
  ctx.lineWidth = Math.max(1, P / 3);
  ctx.strokeStyle = '#000';
  ctx.strokeRect(at.x - P * 3.5, y - P * 3.5, P * 7, P * 7);

  ctx.fillStyle = '#000';
  for (const [dx, dy] of (won ? TICK : CROSS))
    ctx.fillRect(at.x + dx * P - P / 2, y + dy * P - P / 2, P, P);

  // and what is on the table now, under the mark, in the mark of whatever was
  // staked -- a win is a number as much as it is a yes
  if (!won || !S.hand.n) return;
  drawMark(S.hand.cur === 'shard' ? SHARD_CELL : S.hand.cur === 'spore' ? SPORE_CELL : 4,
           at.x - P * 2, y + P * 5.5);
}

// The lab finished something while you were looking somewhere else. The
// chimney says the place is *being* worked, and it goes out the moment the work
// is done -- which is a signal made of nothing happening, and no use at all if
// you were not watching. So finishing leaves a mark standing over the lab: a
// tick in a box, the opposite number to the bar that means a station stopped.
// It bobs, because it is asking to be come and looked at rather than reporting
// a state, and it stays there until somebody opens the lab.
const TICK = [[-2, 0], [-1, 1], [0, 0], [1, -1], [2, -2]];

// One bar, drawn wherever something is being worked through. The lab has had
// this picture since the day it opened and it is the right one for every site
// that builds: a thing filling a cell at a time, over the place it is happening,
// that stops dead while nobody is standing there.
function bar(cx, cy, at) {
  const w = P * 14, h = P * 3;
  const x = cx - w / 2, y = cy - h / 2;

  ctx.fillStyle = '#fff';
  ctx.fillRect(x, y, w, h);
  ctx.lineWidth = Math.max(1, P / 3);
  ctx.strokeStyle = '#000';
  ctx.strokeRect(x, y, w, h);

  ctx.fillStyle = '#000';
  const room = w - P * 2;
  const done = Math.round(room * at / P) * P;
  if (done > 0) ctx.fillRect(x + P, y + P, done, h - P * 2);
}

// Where a site's bar hangs. Over the place the work is happening, which for the
// yard is wherever the thing is going to stand -- a row that opens a place knows
// where its place will be and says so, and the two machines on the bench do not,
// so theirs hangs over the rock the yard is built round.
// Where a site's bar hangs: over the middle of the thing, a little clear of the
// top of it. Off the site's own box (see `siteFoot`), which is the station's own
// rect or the ground a build covers -- so a bar cannot end up in the middle of
// what it is about, and a station that is resited or grows takes its bar with
// it.
//
// This was a table of hand-placed spots, one a site, each with its own offset
// worked out by eye: twenty-four cells over the quarry, twenty-two over the
// farm, eight over the tower, twenty over the ground for anything the yard was
// putting up. Which was fine until a thing was taller than the number somebody
// had guessed for it -- the settlement grows a course at a time, so its bar
// ended up inside the building rather than above it. Nothing here is placed by
// hand any more.
const BAR_CLEAR = P * 4;                 // how far above the top of a thing it floats

export function barSpot(site) {
  const box = siteFoot(site);
  if (!box) return null;
  // A hole in the ground has no top above the line -- the quarry's box starts at
  // the ground and goes down -- so the bar hangs off the ground line for those,
  // which is the top of them as far as anybody looking at the yard is concerned.
  const top = Math.min(box.y ?? S.groundY, S.groundY);
  return { x: box.x + box.w / 2, y: top - BAR_CLEAR };
}

export function drawWorkBars() {
  for (const site of SITES) {
    const list = worksAt(site);
    if (!list.length) continue;
    const at = barSpot(site);
    if (!at) continue;
    // One bar a work, stacked upward. A site with room for two -- the lab, with
    // a second bench -- has two things on the go and two bars to say so; every
    // other site has one and this is the one, exactly where it always hung.
    list.forEach((w, i) => bar(Math.round(at.x / P) * P,
                               Math.round(at.y / P) * P - i * P * 5, progressOf(w)));
  }
}

// --- a busy site looks like a building site -----------------------------------
// See C3 in wave-feedback3.md. A site under way used to read exactly like an
// idle one but for a bar floating over it; now it is fenced while the work is
// on, the way a real hole in the ground is.
//
// The footprint of a *station* -- the quarry, the farm, the scrub house, the
// tower, the bench -- is simply its own rect. The yard is the odd one: it is
// one slot shared by every building that has no gang of its own (the house,
// the closet, the school, the lab, the casino, the tower's own unlock), and
// what is going up there is named by the *row*, not by the site. So the row's
// key is mapped to the placement table's key -- the same table `placeSites`
// filled in -- and the rect that comes back is the thing actually being built,
// not a guess at where the yard's building work happens to stand this week.
const YARD_ROW_SITE = {
  house: 'house', unlockouthouse: 'outhouse', unlockschool: 'school',
  unlocklab: 'lab', unlockcasino: 'casino', unlocktower: 'tower'
};

// Every room the settlement will have once the one going up lands -- one more
// than today's count, the same way `nextHouseAt` in house.js asks. `houseFoot`
// and `risingRoom` (below) both want this and must not disagree about which
// room is going up, so there is exactly one place that works it out.
const roomsIncludingRising = () => {
  const today = S.crew > 0 ? S.crew + 1 : 0;
  return houseCubes(today + (S.crew > 0 ? 1 : 2));
};

// The ground a site's work is on comes from works.js now -- one answer for the
// tape round it, the bar over it and the patch the builder works across. See
// `siteBox` there.
const siteFoot = siteBox;

// A striped post: alternating cell-high bands, the black ones doing all the
// work -- a white band against the page is simply the page.
function drawBarrierPost(x, y, w, bands) {
  for (let i = 0; i < bands; i++) {
    if (i % 2 !== 0) continue;
    ctx.fillRect(x, y + i * P, w, P);
  }
}

// A busy site only looks like a building site when there is a building (or a
// machine) actually going up on it. A rung worked at the bench (`kind: 'rung'`)
// is a body standing at a bench that was already there -- nothing is rising out
// of the ground, so barriers and tape round it would be fencing off thin air.
// See #2, "Wave 3.1" in wave-feedback3.md.
const risingKinds = new Set(['building', 'machine']);
const underConstruction = site => {
  const w = workAt(site);
  return !!w && risingKinds.has(rowFor(w.key)?.kind);
};

// The site sheds no dust of its own, and that is deliberate rather than
// missing. There was a haze along the foot of whatever was going up -- a puff
// every so often from the ground line, spread across the frontage -- and made
// heavy enough to see it read as the ground smouldering rather than as work.
// What says a building site is a building site is the barriers, the tape, the
// thing rising out of the ground, and the body swinging a hammer at it with
// chips coming off each blow (see `workJig` in crew.js). Dust with nobody
// making it was decoration.
export function drawBuildSites() {
  for (const site of SITES) {
    if (!underConstruction(site)) continue;
    const foot = siteFoot(site);
    if (!foot) continue;

    const postW = P * 2, postBands = 5, postH = P * postBands;
    const left = Math.round(foot.x / P) * P - P * 3 - postW;
    const right = Math.round((foot.x + foot.w) / P) * P + P * 3;
    const topY = S.groundY - postH;

    ctx.fillStyle = '#000';
    drawBarrierPost(left, topY, postW, postBands);
    drawBarrierPost(right, topY, postW, postBands);

    // the tape, at head height, dashed a cell on and a cell off
    const tapeY = S.groundY - P * 3;
    for (let x = left + postW; x < right; x += P * 2)
      ctx.fillRect(x, tapeY, P, 2);

  }
}

// The chips off a builder's hammer.
//
// Drawn here, after the buildings and the crew, rather than pushed on to
// `S.smoke` -- which is where this dust used to go, and which is drawn (see
// `drawSmoke`, called long before `drawHouses`) *behind* every building in the
// yard. Dust thrown off the front of a wall that renders behind the wall reads
// as a smudge on the horizon, so it had to come out of the smoke list for the
// draw order alone, quite apart from behaving nothing like smoke.
//
// One cell, no growth, no fade to speak of -- a chip is a chip until it is
// gone. `drawSmoke` swells its motes by 140% over their life because that is
// what a wisp does; doing it here is what made the old dust read as a puff of
// exhaust coming off a joist.
//
// Drawn as an INVERSION of whatever is behind it rather than in black, and that
// is not a flourish -- it is the only thing that makes site dust visible at
// all. Everything in this yard is a black mass on a white page, and a building
// going up is the biggest black mass there is. The haze off the works is shed
// along the foot of the footprint, which is to say inside that mass, so every
// grain of it was black-on-black: thrown correctly, stepped correctly, faded
// correctly, and invisible. Moving where it is thrown would only trade the
// site's dust for the hammer's, which crosses the same wall whenever a builder
// swings beside one.
//
// `difference` against white gives each grain the opposite of its ground: dark
// over the open page, pale over a wall, mid-grey over the tones between. It
// costs nothing per mote and needs no test of what is underneath, which is the
// point -- there is no list of "dark things" to keep in step with.
export function drawGrit() {
  ctx.save();
  ctx.globalCompositeOperation = 'difference';
  ctx.fillStyle = '#fff';
  for (const g of S.grit) {
    ctx.globalAlpha = Math.max(0, 1 - (g.t / g.life) ** 2);
    ctx.fillRect(Math.round(g.x / P) * P, Math.round(g.y / P) * P, P, P);
  }
  ctx.restore();
  ctx.globalAlpha = 1;
}

// --- a building rising out of the ground ---------------------------------------
// #3, "Wave 3.1" in wave-feedback3.md. Everything past the bench builds on the
// yard's one shared site, so at most one place is ever going up at a time, and
// this is the one word that says which: the place `OPENS_PLACE` names the work
// after, or `'house'` for the one row that is not in that table. Only for a
// `kind: 'building'` work -- a machine fitted here (the ram, the belt) has no
// rising analogue and stays exactly as sudden as it always was.
function risingPlace() {
  const w = workAt('yard');
  if (!w || rowFor(w.key)?.kind !== 'building') return null;
  return OPENS_PLACE[w.key] || (w.key === 'house' ? 'house' : null);
}

// Clip a building's own draw to the slice of it that has actually gone up,
// rising from `bottom` -- the ground line for the six stations that stand on
// it, but a house room's own foot for the settlement, which climbs a course at
// a time and so is not always standing on the ground itself. The draw itself
// is unchanged, only masked. `rising` false is the ordinary case (a place
// already standing) and draws straight through with no clip at all.
function withRise(rising, x, bottom, w, h, fn) {
  if (!rising) { fn(); return; }
  const p = Math.max(0, Math.min(1, progressAt('yard')));
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, bottom - h * p, w, h * p);
  ctx.clip();
  fn();
  ctx.restore();
}

// The room a hire is currently building, if any -- the one `kind: 'building'`
// work with no entry in `OPENS_PLACE`, because what it raises is not a place
// but the next room on a settlement that already exists. `cubes` (house.js) is
// asked for one room more than the crew has today, the same way `nextHouseAt`
// does, so the room about to appear is the last one it hands back.
function risingRoom() {
  const rooms = roomsIncludingRising();
  return rooms[rooms.length - 1] || null;
}

// The next room, going up over `workFor` seconds with a builder at it (C1) --
// see #3, "Wave 3.1", for making that visible the way every other building's
// rise is. Drawn in the same black mass as the rest of the settlement, clipped
// to the work's own progress and rising from its own foot -- a room on the
// ground rises out of the ground, a room on the third storey rises out of the
// course under it, which is the only "ground" it has.
function drawRisingHouse() {
  if (risingPlace() !== 'house') return;
  const room = risingRoom();
  if (!room) return;
  withRise(true, room.x, room.y + HOUSE_CUBE, HOUSE_CUBE, HOUSE_CUBE, () => {
    ctx.fillStyle = '#000';
    ctx.fillRect(room.x, room.y, HOUSE_CUBE, HOUSE_CUBE);
  });
}

// The frame a rising place lands, the yard feels it -- a puff over the middle
// of the roof and a knock on the view, half as hard as a rock coming down (see
// `BUILD_SHAKE`). Watched here rather than from `stepWorks` in works.js, which
// has no idea where any of these places actually stand: this file draws every
// one of them and so is the one place that already knows.
const RISE_PLACES = ['school', 'lab', 'tower', 'casino', 'scrub', 'outhouse',
                     'quarry', 'farm', 'house'];
const wasRising = {};
function stepRiseLandings() {
  for (const place of RISE_PLACES) {
    const rising = risingPlace() === place;
    if (wasRising[place] && !rising) {
      const rect = place === 'school' ? school : place === 'lab' ? lab
                 : place === 'tower' ? tower : place === 'casino' ? casino
                 : place === 'scrub' ? scrub : place === 'outhouse' ? outhouse
                 : place === 'quarry' ? quarryShed() : place === 'farm' ? farmShed()
                 : null;
      if (rect) { puff(rect.x + rect.w / 2, rect.y); shakeView(BUILD_SHAKE); }
      else {
        // The house: the room that just landed is the last one `cubes` hands
        // back now that `S.crew` has actually grown.
        const room = houseCubes()[houseCubes().length - 1];
        if (room) { puff(room.x + HOUSE_CUBE / 2, room.y); shakeView(BUILD_SHAKE); }
      }
    }
    wasRising[place] = rising;
  }
}

export function drawLabMark() {
  if (!S.labOpen || !S.labDone) return;
  const at = labMarkAt();
  const y = at.y + Math.round(Math.sin(now() / 500)) * P;   // one cell, never half

  ctx.fillStyle = '#fff';
  ctx.fillRect(at.x - P * 3.5, y - P * 3.5, P * 7, P * 7);
  ctx.lineWidth = Math.max(1, P / 3);
  ctx.strokeStyle = '#000';
  ctx.strokeRect(at.x - P * 3.5, y - P * 3.5, P * 7, P * 7);

  ctx.fillStyle = '#000';
  for (const [dx, dy] of TICK)
    ctx.fillRect(at.x + dx * P - P / 2, y + dy * P - P / 2, P, P);
}

// Over the lab, clear of the chimney: the plume comes off it and would read
// straight through the mark otherwise.
export function labMarkAt() {
  return { x: Math.round((lab.x + lab.w / 2) / P) * P,
           y: Math.round((lab.y - P * 8) / P) * P };
}

// where the cursor has to be to be asking what finished
export function overLabMark(mx, my) {
  const at = labMarkAt();
  return Math.abs(mx - at.x) < P * 5 && Math.abs(my - at.y) < P * 5;
}

// A core: a solid disc, not a ring.
//
// It was drawn hollow -- white inside a thick black stroke -- which reads as an
// outline of a thing rather than as the thing. Everything else worth something
// in this yard is solid, and the one object the whole game is about was the one
// drawn as a hole.
export function drawCircle(cxp, cyp, r) {
  ctx.beginPath();
  ctx.arc(cxp, cyp, r, 0, Math.PI * 2);
  ctx.fillStyle = '#000';
  ctx.fill();
}

// --- what a core gives off ----------------------------------------------------
// The one thing in this game with anything in it.
//
// Everything else in the yard is what it looks like: dust is dust, a shard is a
// blue chip, a rock is a lot of rock. A core is a rock's worth of *something*
// and the game has never said so -- it was a ring, drawn once, sitting there.
//
// So it gives something off: rings of cells walking outward and fading, each
// one a different colour and all of them cycling, which is as close to heat
// coming off a thing as a grid this coarse gets. Cells, not a gradient -- the
// glow is made of the same squares the rest of the world is, so it belongs to
// the picture rather than sitting on top of it -- and faint, because the whole
// of it should read as the air over the thing rather than as the thing.
const WAVES = 3;                   // rings in the air at once
const WAVE_MS = 2400;              // how long one takes to walk out and go
const WAVE_REACH = P * 6;          // and how far it gets
const WAVE_ALPHA = 0.62;

// Rounding that treats the two sides of nought alike. See the ring below.
const evenly = v => Math.sign(v) * Math.round(Math.abs(v));

function drawCoreGlow(cx, cy, capAtGround) {
  const t = now();
  // The middle, snapped once, and every cell of every ring measured from *it*.
  //
  // Each cell used to be snapped to the world grid on its own -- `round(x / P)`
  // of an absolute position -- which puts the ring where the grid happens to
  // fall rather than round the thing it belongs to. The core does not sit on a
  // whole cell (it rolls, and you carry it about), so the rounding bit harder on
  // one side than the other and the glow sat visibly off its own disc. Measured
  // out from a snapped middle, it is symmetrical by construction and still lands
  // on whole cells.
  // The origin IS the centre of the circle. Not a cell corner, not the nearest
  // cell centre -- the point the disc is drawn around.
  //
  // This has been wrong twice, in the same way both times: the ring was measured
  // out from a *snapped* version of the middle, so it sat wherever the lattice
  // fell rather than around the thing it belongs to. Snapping to a corner put it
  // half a cell down and right; snapping to a cell centre fixed the systematic
  // half-cell and left up to another half of drift, because a core does not sit
  // on a whole cell -- it rolls, and you carry it about. Three pixels on an
  // eighteen-pixel core is still visibly off its own disc.
  //
  // So nothing is snapped. Each cell is still a whole cell and still a whole
  // cell's step from the next -- the shape is as square as it ever was -- but
  // the point they are all measured from is `cx, cy` exactly, which makes the
  // ring symmetric about the disc by construction at any position.
  const ox = cx, oy = cy;
  for (let i = 0; i < WAVES; i++) {
    const k = ((t / WAVE_MS) + i / WAVES) % 1;
    const r = CORE_SIZE / 2 + k * WAVE_REACH;
    // out and gone: it thins as it widens, the way anything spreading does
    ctx.globalAlpha = WAVE_ALPHA * (1 - k) * (1 - k);
    ctx.fillStyle = `hsl(${Math.round(t / 12 + i * 140) % 360} 85% 58%)`;
    // one cell per cell of arc, and never the same cell twice: a ring drawn at
    // an even angle doubles up on the diagonals, and a cell painted twice at
    // half alpha is a cell at full alpha
    // An EVEN number of them, always.
    //
    // This is why the ring leaned. The angles sampled are `j/n` of a turn plus
    // however far round the ring has spun; when n is even that set is closed
    // under adding half a turn, so every cell has an exact opposite and the
    // whole thing is symmetric about the middle wherever it has spun to. When n
    // is odd nothing pairs up and the ring really is lopsided -- a different way
    // each frame, which is how it looked.
    const spokes = Math.max(8, Math.round((Math.PI * 2 * r) / P));
    const n = spokes + (spokes % 2);
    const seen = new Set();
    for (let j = 0; j < n; j++) {
      const a = (j / n) * Math.PI * 2 + k * 0.8;      // and it turns as it goes
      // Rounded away from nought rather than always upwards -- the other half
      // of the lean. `Math.round` goes half-UP, so a cell wanted at plus a half
      // lands on 1 and its mirror at minus a half lands on 0: the offset exists
      // on one side and not on the other. `cell` is odd-symmetric, so
      // `cell(-v) === -cell(v)` for every v and a pair of opposite spokes always
      // produces a pair of opposite cells.
      const x = ox + evenly(Math.cos(a) * r / P) * P;
      const y = oy + evenly(Math.sin(a) * r / P) * P;
      // A whole ring, except where the thing is still inside the rock.
      //
      // A core lying about glows all round, which is what a thing giving
      // something off does -- the ground line is not a lid for it. But the one
      // still buried is drawn BEHIND the boulder so the boulder covers it, and
      // the rock only covers what is above the ground line: the bottom of the
      // ring came out underneath the hill and lay on the open ground, glowing,
      // while the core was still in the rock. So that one -- and only that one
      // -- keeps the cut.
      if (capAtGround && y - P / 2 >= S.groundY) continue;


      const key = `${x},${y}`;
      if (seen.has(key)) continue;
      seen.add(key);
      // `x, y` is where the cell's MIDDLE goes; `fillRect` wants its top-left.
      // Passing one as the other puts every cell of the ring half a cell down
      // and to the right, which is the whole ring off its own disc -- and it is
      // the same half cell three times over now, so it is worth being explicit:
      // this offset is the conversion, not a nudge.
      ctx.fillRect(x - P / 2, y - P / 2, P, P);
    }
  }
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#000';
}

export function drawCoreAt(x, y, capAtGround) {
  // One middle for both, so the glow and the thing it is coming off cannot
  // disagree about where the thing is.
  const cx = x + CORE_SIZE / 2, cy = y + CORE_SIZE / 2;
  drawCoreGlow(cx, cy, capAtGround);
  // radius allows for the 2px stroke, so the circle stays inside its box and
  // never paints over the ground line it is resting on
  drawCircle(cx, cy, CORE_SIZE / 2 - 2);
}

// What is lying on the hill. Drawn straight after the rock and before the chips,
// so a grain on the crest is in front of the rock it is resting on and behind
// anything still in the air over it.
//
// Every grain through `drawMark`, which is what a chip in the air and a mark on
// the ground both go through: what lands up here is dust, or a spore, or a
// shard, and it has to look like the thing it is. There are never many of them
// -- a miner throws them off between swings -- so a call each costs nothing.
function drawRockSand() {
  if (!boulderAlive() || !S.rockSand) return;
  const left = rockLeft();
  for (let c = 0; c < S.rockSand.length; c++) {
    const s = S.rockSand[c];
    if (!s || !s.length) continue;
    const top = sandTopY(c);
    for (let k = 0; k < s.length; k++)
      drawMark(s[k], left + c * P + P / 2, top + (s.length - 1 - k) * P + P / 2);
  }
  ctx.fillStyle = '#000';
}

// Buried in the rock: drawn first so the boulder covers it until you dig it out.
//
// Which is only true once the boulder is *there*. A rock still coming down out
// of the sky is drawn up in the sky, so for the second and a half of the fall it
// covers nothing at all and the core sat on the bare ground in plain view,
// waiting to be landed on. Nothing is buried until there is something on top
// of it.
export function drawCoreBehind() {
  if (S.heldCore || S.coreItem || !boulderAlive() || S.rockFall > 0) return;
  // and there is nothing to see inside the first four, because there is nothing
  // in them: cores start at CORE_FROM. `coreBuried` is set on every rock -- what
  // it means is "this one still has something to give up", which is a question
  // about the rock being whole rather than about what is inside it -- so drawing
  // off it showed a core in four rocks that were never going to yield one.
  if (S.boulderNo < CORE_FROM) return;
  const h = coreHome();
  drawCoreAt(h.x, h.y, true);          // still in the rock: nothing spills onto the ground
}

// out in the world: on the cursor or lying on the ground
export function drawCore() {
  if (S.heldCore) drawCoreAt(S.mouse.x - CORE_SIZE / 2, S.mouse.y - CORE_SIZE / 2);
  else if (S.coreItem) drawCoreAt(S.coreItem.x, S.coreItem.y);
}

// The grains in the air on the way out of the pile, drawn as whatever they are.
const drawLeaving = list => {
  let shade = 0;
  for (const m of list) {
    if (m.s !== shade) { shade = m.s; ctx.fillStyle = shadeOf(m.s); }
    ctx.fillRect(Math.round(m.x), Math.round(m.y), P, P);
  }
  ctx.fillStyle = '#000';
};

// The stream arcing off the top of the pile to the bench, because you bought
// something. The other stream off the pile -- the one going into the rift -- is
// drawn by `drawRift`, under the disc, so a grain that has spiralled inside the
// rim is gone behind it rather than drawn over it.
export function drawPaid() { drawLeaving(S.paid); }

// The rift: a black hole hanging in the pit, over the pile, with the dust it is
// swallowing going round it.
//
// Everything in this yard is black cells on white paper, so the honest drawing
// of an absence is the paper's opposite -- a solid black disc, with nothing
// inside it because there is nothing inside it. It is the only thing in the
// game that is a shape rather than an object: no walls, no roof, no machine on
// the front. And it is always filled in, because it is always open: nobody
// holds it, so there is no shut to draw.
//
// The ring comes first and the disc over it. The orbit runs from outside the
// rim in to the middle, so the last of every grain's path is under the disc --
// which is what going *in* looks like, and it costs nothing: the grains are the
// `gulped` list that was always drawn, and a disc is fewer rectangles than the
// lens was.
export function drawRift() {
  if (!S.riftOpen) return;
  drawLeaving(S.gulped);
  const { x, y, w, h } = rift;
  const across = Math.round(w / P), down = Math.round(h / P);
  const mid = (across - 1) / 2, midR = (down - 1) / 2;
  // A disc: the half-width of each row off the circle, worked out from the row
  // rather than written down as a table, so the shape follows RIFT_W and RIFT_H
  // if either ever moves. Drawn twice: a cell wider in paper first, then the
  // black. Over a full pile a black disc on grey speckle is a blob painted on
  // the pile; with a cell of paper round it, it is a hole *in* the pile, and a
  // grain crossing that margin on its way in is seen going.
  const disc = (grow, style) => {
    ctx.fillStyle = style;
    for (let r = -grow; r < down + grow; r++) {
      const dy = (r - midR) / (midR + 0.5 + grow);
      const half = Math.floor((mid + grow) * Math.sqrt(Math.max(0, 1 - dy * dy)) + 0.5);
      if (half < 0) continue;
      const left = x + Math.round(mid - half) * P;
      ctx.fillRect(left, y + r * P, (half * 2 + 1) * P, P);
    }
  };
  disc(1, '#fff');
  disc(0, '#000');
}


// The counter is the one thing here that is read rather than looked at, so it is
// drawn in **screen** pixels and stays the size it is however far the yard has
// been scaled down to fit the window. Everything else is world furniture and a
// cell is a cell; a number you have to squint at is just a number you cannot
// read. It still sits over the pit mouth, and still slides along to stay on
// screen as you scroll the length of the hole.
const MARK = 9;          // a mark on the counter, in screen pixels
const ROW = 19;          // and the gap between one row and the next

// the marks down the left of the counter, lifted off the card and put back
let markCan = null, markKey = '';

// The counter's numbers, remembered.
//
// `fmt` is `toLocaleString`, and `toLocaleString` is eight microseconds a call --
// once the marks are kept it is the entire remaining cost of the card, 0.04 ms a
// frame. The card asks it for the same five numbers sixty times a second, and a
// count that has not moved is the string it was last frame. Cleared rather than
// grown when it fills: the numbers worth keeping are the ones on the card now,
// and while a count is running to a new value every frame is a new number.
const said = new Map();
function digits(n) {
  let s = said.get(n);
  if (s === undefined) { if (said.size > 32) said.clear(); said.set(n, s = fmt(n)); }
  return s;
}

export function drawCount() {
  ctx.setTransform(S.dpr, 0, 0, S.dpr, 0, 0);
  ctx.font = '13px ui-monospace, "Courier New", monospace';
  ctx.textAlign = 'left';

  // The dust count is the widest thing on it and it grows a digit at a time, so
  // the room it needs is measured rather than guessed: a counter that clips its
  // own number at seven figures is a counter that fails exactly when it matters.
  const dust = digits(Math.round(S.shownStored));
  const wide = MARK * 2 + ctx.measureText(dust).width + 10;
  const x = Math.max(10, Math.min((pit.x + P * 4 - S.camX) * S.zoom, S.W - wide));
  const y = Math.min((S.groundY - P * 3 - S.camY) * S.zoom, S.H - 10);

  // Everything that is going on it, bottom row first. Gathered before any of it
  // is drawn because the card behind it has to be the size of all of it.
  const lines = [{ cell: null, text: dust }];
  if (S.seenCore) lines.push({ cell: CORE_CELL, text: String(S.cores) });
  if (S.seenShard) lines.push({ cell: SHARD_CELL, text: digits(S.shards) });
  if (S.seenSpore) lines.push({ cell: SPORE_CELL, text: digits(S.spores) });
  if (S.seenSpark) lines.push({ cell: SPARK_CELL, text: digits(S.sparks) });

  // The card.
  //
  // These numbers float over whatever the yard happens to be doing behind them:
  // over the pit they are black on white and perfectly clear, and over a heap of
  // dust or a body walking past they are black on black. A reading you cannot
  // read half the time is not a reading. So they get a sheet to stand on, the
  // same white box with a black edge every menu in this game is made of -- it is
  // the same kind of thing, a panel that says what you have.
  const PAD = 7;
  const widest = lines.reduce((w, l) => Math.max(w, ctx.measureText(l.text).width), 0);
  const box = {
    x: Math.round(x - PAD),
    y: Math.round(y - MARK - (lines.length - 1) * ROW - PAD),
    w: Math.round(MARK * 2 + widest + PAD * 2),
    h: Math.round(MARK + (lines.length - 1) * ROW + PAD * 2)
  };
  ctx.fillStyle = '#fff';
  ctx.fillRect(box.x, box.y, box.w, box.h);
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 2;
  // on the half pixel, so a two-wide edge lands on two whole ones
  ctx.strokeRect(box.x + 1, box.y + 1, box.w - 2, box.h - 2);

  // The column of marks down the left of the card, kept rather than redrawn.
  //
  // The digits are cheap, and they are the part that moves. The marks are
  // neither: a core is an arc with a stroke round it, a spore is a hexagon and a
  // spark is an eight-point star, and a filled path costs a hundred times what a
  // fillRect does. A late yard shows all four, and drawing four shapes that had
  // not changed since the last one was found cost 0.08 ms a frame -- a fifth of
  // the whole draw on a busy yard, spent on a picture nothing had touched.
  //
  // So the column is kept on a canvas of its own and laid down whole, and drawn
  // again only when the card moves or grows or gains a row. It is *drawn* there
  // rather than copied off the frame: reading the frame back is half a
  // millisecond in a browser with no card under it, which would turn every
  // camera move into a hitch -- the very thing this is meant to take out.
  //
  // Two things make the strip exactly the pixels it replaces. It is laid down at
  // whole device pixels, and it is drawn at the same offset in device pixels, so
  // every mark keeps the fraction of a pixel it would have been drawn on and
  // nothing is resampled at any device ratio. And it is filled with the card's
  // own white first, so an opaque strip goes down over flat white and there is no
  // blending to round differently. The digits' column is left out of it -- that
  // is the part that moves -- and so is the card's edge, whose outermost pixels
  // are shared with whatever the yard is doing behind them.
  const d = S.dpr;
  const cx0 = Math.floor((box.x + 4) * d), cy0 = Math.floor((box.y + 4) * d);
  const cw = Math.ceil(MARK * 2 * d), ch = Math.ceil((box.h - 8) * d);
  // A card with nothing on it but a grain of dust has nothing worth keeping: a
  // fillRect is cheaper than any picture of one, and an early yard is all there
  // is until the first core comes up.
  const key = lines.length > 1 &&
              `${cx0},${cy0},${cw},${ch},${x},${y},${lines.map(l => l.cell).join('.')}`;
  if (!key) {
    markKey = '';
    ctx.fillStyle = '#000';
    ctx.fillRect(x, y - MARK, MARK, MARK);
  } else {
    if (markKey !== key) {
      markCan = markCan || document.createElement('canvas');
      if (markCan.width !== cw || markCan.height !== ch) { markCan.width = cw; markCan.height = ch; }
      const g = markCan.getContext('2d');
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.fillStyle = '#fff';
      g.fillRect(0, 0, cw, ch);
      g.setTransform(d, 0, 0, d, -cx0, -cy0);   // the card's own place, so nothing shifts
      // a grain of dust, and then one mark for every other kind, each shown only
      // once you have seen one
      g.fillStyle = '#000';
      g.fillRect(x, y - MARK, MARK, MARK);
      let at = y;
      for (const l of lines) {
        if (!l.cell) continue;                 // the dust is drawn above
        at -= ROW;
        drawMark(l.cell, x + MARK / 2, at - MARK / 2, MARK, true, g);
      }
      markKey = key;
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(markCan, cx0, cy0);
    ctx.setTransform(d, 0, 0, d, 0, 0);
  }

  // and the counts themselves, which are the part that moves
  ctx.fillStyle = '#000';
  ctx.fillText(dust, x + MARK * 2, y);
  let row = y;
  for (const l of lines) {
    if (!l.cell) continue;
    row -= ROW;
    ctx.fillText(l.text, x + MARK * 2, row);
  }
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
}

// The body: one hollow square, whoever it is. Each job used to carry a mark of
// its own -- a lamp on a quarrier's head, a low notch on a stooping farmhand, a
// hollow centre on a miner -- and every one of them was a thing to learn before
// the yard could be read. Where somebody is standing already says what they are
// doing: the one on the rock is mining it, the one at a plot is tending it. So
// the marks went, and what is left is a body.
//
// Drawn here rather than in each branch of `drawWorkers`, because the roster
// under each station draws the same square beside its count.
export function drawBody(x, y) {
  // Filled, not see-through. An outlined square standing on a black rock or in a
  // grey bank showed the pile through its middle, so a body read as a hole in
  // whatever was behind it rather than as somebody standing in front of it --
  // and a gang on the crest of a rock came out as a row of notches in the rock.
  // The page is white, so a body is white: it is the same paper everything else
  // in this game is drawn on, and now it covers what it is standing over.
  ctx.fillStyle = '#fff';
  ctx.fillRect(x + 1, y + 1, WORKER - 2, WORKER - 2);
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 1, y + 1, WORKER - 2, WORKER - 2);
  ctx.fillStyle = '#000';
}

// The kit, on a body or on the ground. Both marks are one cell: anything finer
// than that on an eighteen-pixel square is a smudge, and both of them have to
// read at a glance from across the yard, because what they are for is telling
// you at a glance who has picked up what.
//
// A trade wears its own. All three are the same solid bar across the top of the
// square -- the only filled thing on a body, and the one thing that reads as
// headgear rather than as hair -- with one cell of difference each, which is
// exactly as much difference as an eighteen-pixel square will carry:
//
//   helmet  a bare bar. The rock, where the thing on your head is for the rock
//           landing on it and nothing else.
//   lamp    a bar with a cell standing proud of the middle of it. The quarry is
//           the one place in the yard with no daylight in it.
//   brim    a bar hanging a cell over each side, with a crown on top. Out in the
//           plots all day, and the only hat here that is about the sun.
//
// A carter wears no hat at all: what you see of a carter is the cart.
// `tight` pulls the sun hat's brim in by a cell each side. It is for the roster,
// where the mark stands in a slot with a number beside it and a brim at full
// span reaches under the digits; out in the yard it wears its proper width.
// A hat, from the table in sprites.js. `tight` pulls an overhanging brim in to
// the body's own width, for the hats drawn on a counter where there is no room
// beside them -- and the wizard's point is exempt, because the brim standing
// proud of the body is the whole of what says wizard.
//
// The shapes themselves are not here any more. They were a handful of `fillRect`
// calls with offsets in them, which is hard to read and impossible to *design*:
// nobody can look at `fillRect(x + P, y - P, WORKER - P * 2, P)` and see a flat
// cap. They are pictures now, in one file, one character to a cell.
export function drawHat(x, y, kind = 'helmet', tight = false) {
  // `tight` is for a hat drawn on a counter, where there is no bare ground
  // either side to overhang into -- and only the sun hat has a narrower version,
  // because a helmet is a helmet either way and the wizard's brim standing proud
  // of the body is the whole of what says wizard.
  const rows = (tight && HATS_TIGHT[kind]) || HATS[kind] || HATS.helmet;
  // Centred on the body, sitting with its bottom row one cell above the top of
  // it -- which is where every hat in this yard has always sat.
  // Not snapped to the cell grid.
  //
  // A body moves in whole *pixels* -- `drawBody` rounds `w.x` and no further --
  // so a hat snapped to the six-pixel lattice hopped a cell at a time while the
  // head under it slid, and spent most of every step somewhere the body was not.
  // The offset is a whole number of pixels already (a hat is an odd number of
  // cells wide on a three-cell body), so the snapping was doing nothing but
  // introducing the lag.
  const left = x + (WORKER - spriteW(rows) * P) / 2;
  drawSprite(ctx, rows, left, y - spriteH(rows) * P);
}

// What a body has on: asked of kit.js, which is the one place that knows. It
// used to be worked out here, which meant the drawing believed in a different
// set of hats from the roster, the errand and the shop -- and the janitor's cap,
// which only this file believed in at all.

// A carter drags a cart: a box on the ground behind it, hitched by a shaft, and
// what it is carrying rides *in* the cart rather than over its head. That is the
// whole of why a cart is worth having, and a carter walking a double load
// stacked on its own head would be a cart that was decoration.
//
// Wider than the body and half its height, on purpose. At three cells square it
// was the same box as the person pulling it and a carter read as two workers
// walking in step; four by two is the one proportion in the yard that is not a
// body, so it reads as a thing being dragged before you have worked out what.
const CART_W = P * 4, CART_H = P * 2, CART_ABREAST = 4;

function cartBox(x, y, face) {
  const back = face > 0 ? -1 : 1;                       // behind whichever way it is going
  // A cell off the ground, because it is standing on a wheel now: see
  // `drawCartBox`. The body of the cart rides above the axle, the way a barrow
  // does, and what was on the ground before was the box itself.
  return { x: back < 0 ? x - CART_W - P : x + WORKER + P,
           y: y + WORKER - CART_H - P, back };
}

function drawCartBox(x, y) {
  // white through it too, for the same reason the body is: half a carter solid
  // and half of it see-through is worse than either
  ctx.fillStyle = '#fff';
  ctx.fillRect(x + 1, y + 1, CART_W - 2, CART_H - 2);
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 1, y + 1, CART_W - 2, CART_H - 2);
  ctx.fillStyle = '#000';
  // And the wheel it rolls on, under the middle of it. A box sliding along the
  // ground behind somebody is a crate being dragged; one cell of wheel under it
  // is the difference between a thing hauled and a thing wheeled, and it is the
  // whole reason a carter carries twice as much without going any slower.
  ctx.fillRect(x + CART_W / 2 - P / 2, y + CART_H, P, P);
}

// The cart, hitched behind a body at (x, y). Exported because the roster draws
// the same thing beside its count: what a carter looks like is a body *with* a
// cart, and a cart on its own is a cart nobody is pulling.
export { drawCart };

function drawCart(x, y, face) {
  const c = cartBox(x, y, face);
  drawCartBox(c.x, c.y);
  ctx.fillStyle = '#000';
  // the shaft, from the cart to the body it is hitched to
  ctx.fillRect(c.back < 0 ? c.x + CART_W : x + WORKER, c.y + CART_H / 2 - 1, P + 1, 2);
}

// The kit nobody is wearing, lying on the ground where the work is. A hat sits
// on the ground as the same bar it is on a head, and a cart as the same box it
// is behind one: what you are looking at is the thing itself put down, not an
// icon for it, so picking it up is obviously what happens when somebody walks
// over there.
// The kit waiting at a station: a stand with one of the thing on it, and over it
// the figure for how many there are. A trestle -- a slab and two legs, five
// cells across -- because a helmet lying on bare ground reads as a helmet
// somebody dropped, and this is gear put out ready.
const STAND_W = P * 5, STAND_H = P * 3;

// How far above the slab each mark reaches, so the count can stand clear of it.
// Off the kit table with the rest of it: a hat added there stands the right
// height here without anybody remembering to come and say so.

// An arrow under a station, pointing up at it: there is something on that board
// you could buy.
//
// One mark and one question. There were two for a while -- a flag for a heading
// you had never read, a dot for something you could afford -- and telling those
// apart is a thing to learn before the yard can be read at a glance, for a
// difference that changes nothing about what you do: you walk over and look
// either way.
//
// It stays up while you are standing there reading the board, too. Taking it
// down was tidy and read as the mark flickering off under the cursor -- and what
// it says is still true: there is something on that board. It goes when you buy
// the thing, which is the only event that changes the answer.
//
// It goes *under* the station, in the empty ground below the line, where nothing
// else in this game is drawn. Over the roof it would be among the tower's bar,
// the lab's tick and the casino's mark, every one of which is about what a place
// is *doing*; this is about what it is offering, and those want telling apart.
function drawOffers() {
  ctx.fillStyle = '#000';
  for (const which of STATIONS) {
    if (stationFoot(which) == null || !hasOffer(which)) continue;
    const at = markAt(which, 'offer');
    // A diamond, not an arrow.
    //
    // The arrow was a solid head pointing up, and up is a direction -- which
    // asks to be read as "go this way" when what it means is "there is something
    // here". A diamond has no direction in it at all: it is a marker, the same
    // shape a map puts on a place, and it stops competing with the pointer over
    // a body's head that really does mean go and look at this.
    //
    // A real diamond, drawn as a shape rather than built out of cells.
    //
    // This is the one mark in the yard that is not on the lattice, and it earns
    // the exception the same way the core's ring does: it has to be small *and*
    // unambiguous, and those two things fight on a six-pixel grid. Stepped, a
    // diamond small enough not to shout is five courses -- and five courses of
    // square cells is a fat plus, because the corner steps are the same size as
    // the arms and nothing in the shape tells you which is which. Every attempt
    // to fix that made it bigger, hollow, or blurred.
    //
    // Four points and a fill has no steps in it at all, so the slopes are
    // slopes at any size. The core is drawn the same way and for the same
    // reason: some shapes are not made of cells.
    // Half the size it was. At two and a half cells by three it was the biggest
    // thing on the ground line -- taller than the plots it hung under and heavier
    // than the counter beside it -- which is the wrong weight for a mark whose
    // whole job is to be noticed and then ignored. It has no steps in it, so it
    // stays a clean diamond at any size; there was nothing keeping it large.
    const w = P * 1.25, h = P * 1.5;
    ctx.beginPath();
    ctx.moveTo(at.x + P / 2, at.y - h);          // top
    ctx.lineTo(at.x + P / 2 + w, at.y);          // right
    ctx.lineTo(at.x + P / 2, at.y + h);          // bottom
    ctx.lineTo(at.x + P / 2 - w, at.y);          // left
    ctx.closePath();
    ctx.fill();
  }
}

// A hat that has been shaken off somebody: in the air on its own little arc
// while it falls, then lying where it came down until its owner comes round and
// fetches it. Drawn off its own position both ways -- it flies off the head the
// moment the shaking counts, so for the first half-second what you see is a hat
// tumbling away from a body still in your hand. Not on a stand: it was not put
// down, it came off.
export function drawDroppedHats() {
  for (const w of S.workers) {
    if (!w.hatOff || w.hatOff.x == null) continue;
    const x = Math.round(w.hatOff.x), y = Math.round(w.hatOff.y);
    // Drawn as the thing it IS, derived from whose kit it is -- `kind` used to
    // carry a boolean and everything knocked off drew as the helmet fallback,
    // so a cart lying on the ground was a little hat. A cart is the box and
    // its wheel, tumbling and lying exactly as it stands at the lip's stand;
    // everything else is its own hat shape.
    const mark = KIT_MARK[w.hatOff.of] || 'helmet';
    if (mark === 'cart') drawCartBox(x, y - CART_H - P);
    else drawHat(x, y, mark);
  }
}

export function drawKitStands() {
  ctx.fillStyle = '#000';
  for (const k of kitStands()) {
    const top = k.y - STAND_H;
    ctx.fillRect(k.x - P, top, STAND_W, P);                       // the slab
    ctx.fillRect(k.x - P, top + P, P, STAND_H - P);               // and its legs
    ctx.fillRect(k.x + STAND_W - P * 2, top + P, P, STAND_H - P);
    // and the one on it, standing on the slab the way it stands on a head
    if (k.mark === 'cart') drawCartBox(k.x - P, top - CART_H);
    else drawHat(k.x + (STAND_W - P * 2 - WORKER) / 2, top, k.mark);
  }
}

// And the figure over it, in screen pixels like every other number in the yard:
// a count is type, and type scaled by five sixths is type with a fuzzy edge.
function drawKitCounts(screenAt) {
  const stands = kitStands();
  if (!stands.length) return;
  ctx.font = '13px ui-monospace, "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#000';
  for (const k of stands) {
    // A clear two cells over whatever is standing on the slab, whatever that is.
    // Three cells of headroom was plenty while every mark was a bar a cell or
    // two tall; the wizard's cone is three courses on its own and the number sat
    // in the tip of it. Measured off the mark rather than fixed, so the gap over
    // a helmet and the gap over a cone are the same gap.
    const at = screenAt(k.x - P + STAND_W / 2,
                        k.y - STAND_H - HAT_TALL[k.mark] - P * 2);
    ctx.fillText(String(k.n), Math.round(at.x), Math.round(at.y));
  }
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
}

// --- what a body on a break has to say ----------------------------------------
// Never words. The yard has no writing in it anywhere and is not about to start
// on the strength of somebody having a smoke, so a thing said is a mark: a note
// is singing, a burst is swearing, and dots are talking -- and dots going back
// and forth between two bodies facing each other is a conversation, which is a
// thing you read off the pair rather than off either of them.
//
// All of it is cells, like everything else, and all of it stands a clear cell
// above the head so it never touches the load a worker is carrying.
function drawSay(w) {
  const x = Math.round(w.x) + WORKER / 2;
  const top = Math.round(w.y) - P * 2;
  ctx.fillStyle = '#000';

  // the same heart the opening uses: a body saying it and a body in the opening
  // saying it are the same thing said, so they are the same shape
  if (w.say.mark === 'heart') {
    for (let r = 0; r < HEART.length; r++)
      for (let c = 0; c < 5; c++)
        if (HEART[r][c] === '1')
          ctx.fillRect(Math.round(x - P * 2.5 + c * P), top - P * 3 + r * P, P, P);
    return;
  }

  if (w.say.mark === 'dots') {
    const n = w.say.n || 2;
    for (let i = 0; i < n; i++)
      ctx.fillRect(Math.round(x - (n * P) / 2 + i * P), top - P, P - 1, P - 1);
    return;
  }

  // A little heap, in the colour of the stuff it is about to become. Nothing
  // else in this yard is drawn in brown, so it needs no explaining -- and it is
  // the same shape the muck makes on the ground a second later.
  // Stars. Two cells going round the head rather than a fixed pair, so a body
  // seeing them is plainly still spinning -- which is the whole of what being
  // shaken about earns you.
  if (w.say.mark === 'dizzy') {
    const t = now() / 160;
    for (const off of [0, Math.PI]) {
      const a = t + off;
      ctx.fillRect(Math.round(x + Math.cos(a) * P * 2.2) - P / 2,
                   Math.round(top - P * 1.4 + Math.sin(a) * P), P - 1, P - 1);
    }
    return;
  }

  if (w.say.mark === 'loo') {
    ctx.fillStyle = MUCK_TONE;
    ctx.fillRect(Math.round(x - P * 1.5), top - P, P * 3, P);
    ctx.fillRect(Math.round(x - P * 0.5), top - P * 2, P, P);
    ctx.fillStyle = '#000';
    return;
  }

  if (w.say.mark === 'note') {
    // a head and a stem: the smallest thing that is unmistakably a note
    ctx.fillRect(Math.round(x - P), top - P, P, P);
    ctx.fillRect(Math.round(x), top - P * 2, P - 2, P + 1);
    return;
  }

  // a burst: four cells off a corner, which is the shape a swear word is in
  // every comic ever drawn
  for (const [dx, dy] of [[0, -1], [-1, 0], [1, 0], [0, 1]])
    ctx.fillRect(Math.round(x + dx * P) - P / 2, top - P + dy * P, P - 1, P - 1);
}

// Somebody you have just asked for by name. A solid arrow over the head, bobbing
// so it reads as put there rather than drawn on -- nothing else in this yard
// hangs still in the air.
const ARROW = ['11111', '01110', '00100'];

export function drawPointed() {
  const t = now();
  for (const w of S.workers) {
    if (!w.pointed || w.pointed < t) continue;
    if (underground(w) || indoors(w) || inHouse(w) || atPot(w) || atHome(w)) continue;
    const bob = Math.round(Math.sin(t / 140) * 1.5) * P;
    const x = Math.round(w.x) + WORKER / 2;
    const top = Math.round(w.y) - P * 5 + bob;
    ctx.fillStyle = '#000';
    for (let r = 0; r < ARROW.length; r++)
      for (let c = 0; c < 5; c++)
        if (ARROW[r][c] === '1')
          ctx.fillRect(Math.round(x - P * 2.5 + c * P), top + r * P, P, P);
  }
}

export function drawSays() {
  for (const w of S.workers) {
    if (!w.say || underground(w) || indoors(w) || inHouse(w) || atHome(w)) continue;
    drawSay(w);
  }
  ctx.fillStyle = '#000';
}

// --- the two of them, and the one under the rock -----------------------------
// The opening is two squares talking on the bare ground. They are drawn here
// rather than being workers, because they are not: nobody has been hired yet and
// one of them is about to stop being anybody at all.
//
// And afterwards, every time the last of a rock goes, the one underneath is
// there -- alive, on the bare ground, saying the same dots two people say to
// each other anywhere else in this yard. Then the next rock lands on them. That
// is the whole story and it is told in shapes.
// What somebody in the opening has to say, over its head. Three marks and no
// words, like everything else here: dots are talking, a heart is the other
// thing, and a bang is what you say when a boulder has just landed on somebody.
const HEART = ['01010', '11111', '11111', '01110', '00100'];

function drawSaying(x, y, say) {
  ctx.fillStyle = '#000';
  const mid = x + WORKER / 2;
  const top = y - P * 3;

  if (say.mark === 'heart') {
    for (let r = 0; r < HEART.length; r++)
      for (let c = 0; c < 5; c++)
        if (HEART[r][c] === '1')
          ctx.fillRect(Math.round(mid - P * 2.5 + c * P), top - P * 3 + r * P, P, P);
    return;
  }

  if (say.mark === 'bang') {
    // a bar and a dot under it, which is the shape of the thing everywhere
    ctx.fillRect(Math.round(mid - P / 2), top - P * 4, P, P * 3);
    ctx.fillRect(Math.round(mid - P / 2), top, P, P);
    return;
  }

  const n = say.n || 2;
  for (let i = 0; i < n; i++)
    ctx.fillRect(Math.round(mid - (n * P) / 2 + i * P), top, P - 1, P - 1);
}

// A body knocked flat. It is the same square lying down: two cells tall and
// three wide instead of the other way about, which is the least a square can do
// to say it is on its back and the most this alphabet has.
function drawFloored(x, y) {
  ctx.fillStyle = '#fff';
  ctx.fillRect(x - P + 1, y + WORKER - P * 2 + 1, WORKER + P * 2 - 2, P * 2 - 2);
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 2;
  ctx.strokeRect(x - P + 1, y + WORKER - P * 2 + 1, WORKER + P * 2 - 2, P * 2 - 2);
  ctx.fillStyle = '#000';
}

export function drawIntro() {
  for (const b of S.pair) {
    const x = Math.round(b.x), y = Math.round(b.y);
    if (b.down) drawFloored(x, y);
    else drawBody(x, y);
    if (b.say) drawSaying(x, y, b.say);
  }

  if (!buriedVisible()) return;
  const at = buriedAt();
  drawBody(at.x, at.y);
  if (S.buriedSay) drawSaying(at.x, at.y, S.buriedSay);
}

// How each kind of body is drawn, as a row rather than as a branch.
//
// This was six branches, each repeating the same four steps in a slightly
// different order and each free to forget one of them -- which is how a hat came
// to be drawn on five kinds of body and not the sixth, and how a miner walking a
// shovelful of muck across the yard carried it invisibly. A body is a body: it
// stands somewhere, it may be dragging a cart, it wears whatever is on its head,
// and it is holding whatever it picked up. The only things that actually differ
// between one kind and the next are in this table.
//
//   lunge  which way a swing throws the body: down into the work for anybody on
//          the ground, up for a wizard, whose work is above it. 0 for the bodies
//          that do not swing at all.
//   lean   ...or forward instead, into the way it is facing, for a body whose
//          swing is a push rather than a stoop. A janitor plants its feet on a
//          whole cell and shovels without going anywhere, so a lunge on its y was
//          the only thing about it that moved: a square dropping a cell and
//          rising again, four times a second, on the spot -- which reads as a
//          body bobbing, not as a body working. It shoves the shovel out in
//          front of it instead, which is what the swing actually is.
//   load   how what it is carrying is drawn. A quarrier brings up one thing at a
//          time and it rides over its head as that thing; everybody else stacks
//          grains, in the cart if there is one.
const LOOK = {
  janitor:  { lunge:  0, lean: 1 },
  labber:   { lunge:  1 },
  farmhand: { lunge:  1 },
  quarrier: { lunge:  1, load: 'shard' },
  wizard:   { lunge: -1 },
  miner:    { lunge:  0 },
  hauler:   { lunge:  0 },
  // A builder at a busy site hops and lunges at the bottom of each hop -- see
  // `workJig` in crew.js -- but with no row here it fell through to `PLAIN`,
  // whose `lunge: 0` threw the lunge away regardless of what `w.lunge` said.
  // #4, "Wave 3.1": the body was hopping (a player just could not see it),
  // and this is why the one part of the hop meant to read as effort read as
  // nothing at all.
  builder:  { lunge:  1 }
};
const PLAIN = { lunge: 0 };

// How far a lean throws a body, in cells. Half of what a stoop drops it: an
// eighteen-pixel square shoved a whole cell sideways reads as a body stepping,
// not as a body reaching.
const LEAN = 0.5;

export function drawWorkers() {
  for (const w of S.workers) {
    // out of sight: in the lab, down the quarry, in the outhouse, or home
    if (underground(w) || indoors(w) || inHouse(w) || atPot(w) || atHome(w)) continue;

    const look = LOOK[w.type] || PLAIN;
    const throwOn = w.lunge || 0;
    const x = Math.round(w.x + throwOn * (look.lean || 0) * (w.face || 1) * P * LEAN);
    const y = Math.round(w.y + throwOn * look.lunge * P);

    // A cart is kit like any other, so it is drawn off what the body is holding
    // rather than off what the books say it is. Somebody walking a cart back to
    // the lip is walking a cart back to the lip, whatever job it is on this
    // second -- the same rule a helmet has always had.
    const cart = wearing(w) === 'cart' ? cartBox(x, y, w.face || 1) : null;
    if (cart) drawCart(x, y, w.face || 1);       // behind the body it follows

    drawBody(x, y);

    // and whatever is on its head. One line, for everybody: this is the whole of
    // what "hats are always shown" means.
    const hat = wearing(w);
    if (hat && hat !== 'cart') drawHat(x, y, hat);

    // The tonic on the body, drawn in cells like everything else -- no glow, no
    // gradient. A short bar off the shoulder that stands in fewer cells as the
    // dose wears off, so a buffed corner of the yard reads at a glance and the
    // bar shrinking is the dose running out. See `doseFrac` in apothecary.js.
    const frac = doseFrac(w);
    if (frac > 0) {
      const cells = Math.max(1, Math.ceil(frac * DOSE_MARK_CELLS));
      const mx = x - P;
      ctx.fillStyle = '#000';
      for (let k = 0; k < cells; k++) ctx.fillRect(mx, y - P * (k + 1), P, P);
    }

    if (!w.carry && !w.hasCore) continue;

    // What it brought up, over its head, as the thing itself.
    if (look.load === 'shard') { drawMark(SHARD_CELL, x + WORKER / 2, y - P * 2); continue; }

    // A load is drawn grain by grain as whatever each grain is, so a worker
    // walking a shard to the pit is visibly walking a shard to the pit. It
    // rides overhead, stacked two abreast -- or in the cart, four abreast,
    // if there is a cart to put it in.
    const abreast = cart ? CART_ABREAST : 2;
    const left = cart ? cart.x : x + (WORKER - P * 2) / 2;
    const top = cart ? cart.y : y;
    const cap = cart ? 40 : 24;
    for (let i = 0; i < Math.min(w.carry, cap); i++) {
      drawMark(w.load?.[i] || 1,
               left + (i % abreast) * P + P / 2,
               top - P * (Math.floor(i / abreast) + 1) + P / 2);
    }
    ctx.fillStyle = '#000';
    if (w.hasCore) {
      const stack = Math.ceil(Math.min(w.carry, 24) / 2);        // ride above the dust
      const cx = x + WORKER / 2, cy = y - P * (stack + 2);
      // A carried core is still a core: it gives off the same waves one lying
      // on the ground does, the way `drawCoreAt` draws both together. Drawn
      // straight here rather than through `drawCoreAt` because the disc riding
      // a body is a different size from the one on the ground.
      drawCoreGlow(cx, cy);
      drawCircle(cx, cy, P * 1.2);
    }
  }
}


// the tone of every thickness a rock cell can hold, filled in once a frame
// rather than worked out per cell. See the rock's pass in `draw`.
const TONE = [];

export function draw() {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = '#fff';                       // the page is painted, not assumed
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const k = S.zoom * S.dpr;
  // Where you are looking, plus whatever the yard is still rocking through. The
  // shake goes in before the rounding, not after: the offset lands on a whole
  // device pixel like everything else, so a rock coming down does not put a
  // hairline through every seam in the picture for half a second.
  const world = () => ctx.setTransform(k, 0, 0, k,
                   Math.round((-S.camX + S.shakeX) * k),
                   Math.round((-S.camY + S.shakeY) * k));

  // The sky goes down first: clouds and birds are the far end of everything.
  // Then the dust, which hangs in front of them -- it is weather in the yard and
  // not something out on the horizon, so a cloud must never paint over it.
  ctx.save();
  world();
  drawClouds();
  drawBirds();
  ctx.restore();

  drawAir();

  ctx.save();
  world();
  drawCoreBehind();
  drawGroundLine();
  drawQuarry();              // a hole in the ground, so it goes down with the ground
  drawQuarryShed();          // the shed beside it, holding its board
  drawCut();                 // the dust lying in it, after the quarry for the same reason
                 // after the quarry, or its white columns erase it
  drawBridge();              // and the way across it
  drawDrill();               // which the drill stands on
  drawFarm();
  drawFarmShed();            // the shed beside it, holding its board
  drawApothecary();          // the pot on the fire, standing right past the farm
  drawTiller();
  drawRam();                 // before the rock, so the hill stands in front of it
  drawBelt();                // the road from the rock to the hole
  drawSky();
  drawLab();
  drawCasino();
  drawScrub();
  drawTower();
  drawOuthouse();
  drawPotPile();    // what is on the table, as a heap on the ground
  drawSparks();     // and whatever the last spin threw out of it
  drawSchool();
  drawSmoke();
  ctx.fillStyle = '#000';

  // The rock, a run at a time rather than a cell at a time.
  //
  // A rock is up to forty cells across and twenty deep, and this used to be
  // eight hundred separate `fillRect`s with a `cellPos` object allocated for
  // each one -- the most expensive thing in the whole frame, and by some way:
  // measured at 0.12 ms on a yard with nothing else in it.
  //
  // But shade *is* depth, and depth runs in bands across a row. A row of a rock
  // is three or four runs of one tone, not forty cells of it, so each run goes
  // down as one `fillRect` and the whole rock is a few dozen calls. The tone of
  // a thickness is looked up once a frame rather than worked out per cell for
  // the same reason: neither `depthShade` nor `shadeOf` knows anything a table
  // of seven entries does not.
  const deep = depthOf();
  for (let v = 0; v <= MAX_DEPTH; v++) TONE[v] = shadeOf(depthShade(v, deep));
  const left = rockLeft(), foot = rockFootY();
  let shade = null;
  for (let y = 0; y < S.gh; y++) {
    const row = S.boulder[y], py = foot - (S.gh - y) * P;
    let x = 0;
    while (x < S.gw) {
      if (!row[x]) { x++; continue; }
      const tone = TONE[row[x]];
      let e = x + 1;
      while (e < S.gw && row[e] && TONE[row[e]] === tone) e++;
      if (tone !== shade) { shade = tone; ctx.fillStyle = tone; }
      ctx.fillRect(left + x * P, py, (e - x) * P, P);
      x = e;
    }
  }

  drawRockSand();          // and whatever has come down on top of it

  ctx.fillStyle = '#000';

  // a chip is a grain in the air, drawn as whatever it is -- and a crit's chip
  // swells through the top of its arc. The apex is where the grain is slowest
  // vertically, so the swell is read straight off `vy`: fattest where `|vy|` is
  // smallest (near nothing at the top), back to one cell where it is fastest
  // (its launch speed `cv`). No apex is stored and no per-grain timer runs -- it
  // is a number worked out from `vy` the same frame it is drawn. A harder crit
  // (`cp`) blooms fatter, which ties the two tells together: it throws higher,
  // so it hangs longer near the slow apex, so it is both higher and fatter.
  for (const ch of S.chips) {
    let size = MARK_SIZE;
    if (ch.crit) {
      const slow = 1 - Math.min(1, Math.abs(ch.vy) / ch.cv);   // 0 at launch, 1 at apex
      size = P * (1 + (0.6 + 0.12 * (ch.cp || 3)) * slow);
    }
    drawMark(ch.s, Math.round(ch.x) + P / 2, Math.round(ch.y) + P / 2, size);
  }
  ctx.fillStyle = '#000';

  // The bench and the settlement go down before the loose stuff, not after.
  //
  // Everything that is lying on the ground -- dust, finds, the muck a rain left --
  // is in front of every building it reaches. A heap that runs up to a wall and
  // then stops dead at it is a heap that has been drawn around the wall; a heap
  // that piles up *against* the wall and buries its foot is a heap. The buildings
  // are the yard and the loose stuff is what the yard is full of.
  drawBench();
  drawHouses(ctx);         // and the crew are drawn later still, so they walk in front of both
  drawRisingHouse();       // the one room still going up, if a hire is under way

  drawPileGround();        // the pegs on the ground each station's heap belongs to
  drawGrid(floor);
  drawPit();
  drawMuck();              // and whatever the last rain left on top of the lot
  drawRift();              // the black hole in the pit, over the pile it is eating

  drawPitOutline();

  drawPaid();
  drawCore();
  drawPileMarks();         // and a bar over anything that has stopped for a full one
  drawWorkBars();          // and whatever else the yard is putting up
  drawBuildSites();        // fenced off and dusty, for as long as it is under way
  drawGrit();              // and the chips off the hammer, in FRONT of the walls
  stepRiseLandings();      // a puff and a knock, the frame a rising place lands
  drawDraught();           // the air going into the scrubbing house
  drawTowerWaves();        // the tower pouring, while it is making a hat
  drawTowerBar();          // and how far along the tower's hat is, over the tower
  drawLabMark();           // and a tick over it if it finished something
  drawCasinoMark();        // and which way the last hand at the table went
  drawOffers();            // and an arrow under whichever of them has something for you
  drawKitStands();                                // and the kit put out ready at each of them
  drawDroppedHats();                              // and any that has been shaken off somebody
  drawRoster(ctx, drawBody, drawHat, drawCart, drawRunSwitch);   // who is working here, under the place they work
  drawIntro();             // the two of them, or whoever is under the rock
  drawWorkers();
  drawSays();              // and what any of them stood about is saying
  drawPuffs();             // what the crew are putting up there right now
  drawSmog();              // and what it has gathered into up there
  drawBalloons();          // and the craft crossing it
  drawBrollies();          // and anybody who has stepped out of one
  drawRain();              // and whatever is coming down out of it, or going into the house
  drawPointed();           // and an arrow over whoever you just asked for by name
  drawCursor();
  ctx.restore();

  drawAirNear();           // the nearest dust passes in front of the yard, not behind it

  // The roster's counts, in screen pixels so the digits stay sharp, but moved
  // with the yard rather than pinned to the window: the number belongs to the
  // badge beside it, shake and all.
  ctx.setTransform(S.dpr, 0, 0, S.dpr, 0, 0);
  const screenAt = (wx, wy) => ({ x: (wx - S.camX + S.shakeX) * S.zoom,
                                 y: (wy - S.camY + S.shakeY) * S.zoom });
  drawRosterCounts(ctx, screenAt);
  drawKitCounts(screenAt);       // and how many are waiting on each stand

  drawCount();             // last, and in screen pixels: it is read, not looked at

  // And then the filter, over the finished frame and on the frame's own canvas:
  // two cached fills rather than a trip out through a second graphics context.
  // See press.js.
  press(canvas, ctx);
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


// --- the machines ---------------------------------------------------------------
// Three machines and a hoist, drawn the way everything else in this yard is
// drawn: a solid black shape with a few white holes knocked in it, laid out in
// whole cells off a snapped corner.
//
// Each one moves, and each one moves *differently*, because that is what makes
// three black blocks read as three different machines from across the yard. The
// jaw opens and shuts. The hoist's skip rides up and down its rope. The ram's
// piston strikes and draws back. The tiller crawls the row. None of those phases
// is stored on the machine as a position -- they are read off the clock, so a
// paused game holds still and a machine that is not running settles rather than
// freezing mid-stroke.
//
// Nothing here decides *whether* a machine is working. It asks the record, and
// the record is the same one `stepMachines` reads.

// How far through its stroke, 0..1, and nought when it is not actually working.
// A machine standing idle with its mouth half open reads as broken; one that
// closes and stays closed reads as off, which is what it is.
function stroke(key, ms = 900) {
  const m = machine(key);
  if (!m || !m.bought) return 0;
  // And not while it is standing idle. `on` is the lever; `workedAt` is when it
  // last actually got something done. A machine with nobody at it, or one stood
  // down by a full pile, kept chewing away visibly while producing nothing --
  // the drawing claiming exactly what the yard denies.
  //
  // Against the *moment* rather than the frame flag: a beat lands on one frame
  // in three or worse, and a stroke gated on the flag itself would strobe.
  if (now() - (m.workedAt || 0) > MACHINE_IDLE_MS) return 0;
  return (now() % ms) / ms;
}

// A machine that has been bought but is not running is still *there* -- it is a
// large object somebody paid for. It is drawn the same and simply does not move.
const built = key => { const m = machine(key); return !!(m && m.bought); };

// The quarry's drill: a rig on the deck over the mouth, a shaft down the bore,
// and a triangular bit on the end of it working the floor.
//
// The rig stands on the bridge deck and does not move. What moves is the bit and
// the length of the shaft carrying it, and both are derived: the bit sits at
// `jawY`, which is `dugTopY` down the bore, so as the cut is taken deeper the
// shaft pays out after it, and when the quarry falls in behind the last body out
// the bit comes back up with the ground.
export function drawDrill() {
  if (!S.quarryOpen || !built('jaw')) return;
  const x = Math.round(jawX() / P) * P;
  const top = rigTop();                       // stood on the bridge deck
  drawSprite(ctx, DRILL, x, top);

  // The shaft and the bit. Neither is part of the rig's picture, because how far
  // down they reach is a fact about the game rather than about the shape.
  const shaft = Math.round(shaftX() / P) * P;
  const from = top + spriteH(DRILL) * P;

  // The plunge. It bores *at the floor*, a cell of travel on its own beat -- the
  // skip this replaces rode the whole depth of the hole, and a cutting head at
  // the top of its own bore is a drill doing nothing.
  const t = stroke('jaw', 900);
  const bite = Math.round(Math.abs(Math.sin(t * Math.PI)) * P);
  const bitTop = Math.max(from, Math.round(jawY() / P) * P - (spriteH(BIT) - 1) * P + bite);

  ctx.fillStyle = '#000';
  if (bitTop > from) ctx.fillRect(shaft, from, P, bitTop - from);
  // Centred on the shaft: the point of the triangle is the middle column of it.
  drawSprite(ctx, BIT, shaft - ((spriteW(BIT) - 1) >> 1) * P, bitTop);
  ctx.fillStyle = '#000';
}

// The ram: a squat engine outside the apron with an arm that reaches into the
// face and strikes. One white slot for the piston, and the arm is the thing that
// moves -- it is the only machine whose working end is somewhere other than
// where its body stands, which is the whole of why it can be there at all.
// How many rows of the ram's picture are stack rather than engine -- the rows
// above the solid body, counted off the sprite, so the arm still comes out of
// the middle of the engine if the chimney is ever made taller.
const BONNET = RAM.findIndex(r => !r.includes('.'));

export function drawRam() {
  if (!built('ram')) return;
  const x = Math.round(ramX() / P) * P;
  const W = spriteW(RAM), H = spriteH(RAM);
  const y = Math.round((S.groundY - H * P) / P) * P;
  drawSprite(ctx, RAM, x, y);

  // The arm, whose *length* is the animation -- so it is drawn rather than
  // pictured. Out fast, held, then drawn back slowly, which is what a ram does
  // and what makes the hit read as a hit rather than as a slider going to and
  // fro. At rest it stands half out, so the arm is part of the machine's shape
  // instead of something that only exists while you happen to be watching.
  // How far it has to reach: to the **face**, which is where the rock actually
  // still is, not to `rockLeft()`, which is where the grid begins and does not
  // move. Measured rather than taken from `RAM_REACH` so the arm still lands on
  // the stone in the frames where the two disagree -- the face moves the instant
  // a column empties, and the machine snaps to the cell grid.
  const gap = Math.max(2, Math.round((rockFaceX() - (x + W * P)) / P));
  const t = stroke('ram', 900);
  const rest = Math.max(2, Math.round(gap / 2));
  const reach = t === 0 ? rest
              : t < 0.18 ? Math.round(rest + (gap - rest) * (t / 0.18))
              : t < 0.34 ? gap
              : Math.max(2, Math.round(gap - (gap - rest) * ((t - 0.34) / 0.66)));
  // Out of the middle of the body's height, not off a row counted from its top:
  // the arm is the machine's *centre line*, and a literal there is a literal to
  // fix by hand every time the engine grows a row.
  const mid = Math.round((H - BONNET) / 2) + BONNET;      // the body's middle row
  ctx.fillStyle = '#000';
  ctx.fillRect(x + W * P, y + (mid - 1) * P, P * reach, P * 2);
  ctx.fillRect(x + W * P + (reach - 1) * P, y + (mid - 2) * P, P * 2, P * 4);   // the head

  // How far through this boulder it is. The hill is the one workplace whose
  // progress has no shape you can read from beside the machine.
  const share = rockShare();
  if (share > 0) {
    const wide = Math.max(1, Math.round((W - 2) * share));
    const bar = y + (H - 2) * P;                          // the last row inside the body
    ctx.fillStyle = '#fff';
    ctx.fillRect(x + P, bar, (W - 2) * P, P);
    ctx.fillStyle = '#000';
    ctx.fillRect(x + P, bar, wide * P, P);
  }
}

// The tiller: a low frame that crawls the plot line and turns the ground behind
// it. The only machine that travels, which is what makes it read as a different
// kind of thing at a glance. Its x is derived from the plot it is working, so it
// is where the work is by construction.
// The tiller: a tractor, and it should look like one from across the yard.
//
// It was a three-by-two box with a chimney, which is the same shape as every
// other machine here and says nothing. A tractor has a silhouette everybody
// already knows -- a big wheel at the back, a small one at the front, a bonnet
// sloping down between them and somebody sitting up over the back axle -- and
// that silhouette is worth more than any amount of detail.
//
// The ground line is where a body's feet are: `walkY` is the top of a body
// standing there, not the surface under it.
// A column of the tractor's picture, in cells off its left edge, mirrored when
// it is facing the other way. One place that knows how the flip works, so the
// wheels, the seat and the chimney cannot disagree with the sprite about which
// end is the front.
const tCol = c => tillerWay() < 0 ? spriteW(TILLER) - 1 - c : c;

export function drawTiller() {
  if (!S.farmOpen || !built('tiller')) return;
  // Whole pixels, not whole cells. The tractor *crosses the farm*, and snapped
  // to the six-pixel lattice it went along the row in hops while the body riding
  // it slid -- so the driver spent most of every step beside the seat rather
  // than in it. Everything that moves in this yard moves in pixels; the cell
  // grid is what things are *made of*, not what they travel on.
  const x = Math.round(tillerAt());
  const g = Math.round((walkY(x + WORKER / 2) + WORKER) / P) * P;
  // Facing where it is going, like everything else that walks in this yard. It
  // is the only machine that travels, and it was the one thing that travelled
  // backwards half the time -- bonnet trailing, exhaust at the wrong end, driver
  // riding the front axle up the row. `flip` is the same mirror a body gets.
  const back = tillerWay() < 0;
  drawSprite(ctx, TILLER, x, g - spriteH(TILLER) * P, { flip: back });

  // The spokes turning. Two cells, moving round the wheels the picture already
  // has -- which at this size is the whole of what a turning wheel looks like.
  const t = stroke('tiller', 700);
  // Turning the way it is travelling, or the wheels drive it the other way.
  const a = t * Math.PI * 2 * (back ? -1 : 1);
  const y0 = g - spriteH(TILLER) * P;
  // The hubs, off the picture: the middle of each white ring, so a redrawn
  // tractor turns its own wheels rather than the ones the old one had -- and
  // mirrored with the picture, so they stay inside the tyres when it turns round.
  for (const [wx, wy, r] of [[x + tCol(3) * P, y0 + P * 5, 1],
                             [x + tCol(8) * P, y0 + P * 5, 0]]) {
    ctx.fillStyle = '#fff';
    ctx.fillRect(Math.round((wx + Math.cos(a) * r * P) / P) * P,
                 Math.round((wy + Math.sin(a) * r * P) / P) * P, P, P);
  }
  ctx.fillStyle = '#000';
}

// The belt: a run of trestles from the rock to the lip with a band over them, and
// the band moves. It is the only machine that is *long* rather than tall, which
// is what makes it read as a different kind of thing at a glance -- the other
// three are engines standing at a face, and this is a road.
export function drawBelt() {
  if (!built('belt')) return;
  const from = beltFrom(), to = beltTo(), y = beltY();
  ctx.fillStyle = '#000';
  ctx.fillRect(from, y, to - from, P);                   // the band
  // And what holds it up -- only as far as there is ground to stand on. The head
  // overhangs the mouth of the hole, so a leg out there would be a leg planted
  // in mid-air over a hundred feet of nothing.
  for (let x = from; x < beltReach(); x += P * 8) {
    ctx.fillRect(x, y + P, P, S.groundY - y - P);
  }
  // The band's own marks: white cut out of it, a few cells apart, running. This
  // is the *band* moving and nothing else -- it used to stand in for the load as
  // well, back when the load was thrown over the top of it in one arc and never
  // touched it. What is actually being carried is drawn below, as grains.
  //
  // Not `stroke`: that reads `workedAt`, which is stamped by *bites*, and the
  // belt has hardly bitten since the rock's spoil started landing on the band
  // straight off the shovel -- so the marks stood still under moving loads.
  // The band runs whenever it is manned, on, and has somewhere to put things
  // down, which is exactly the gate `stepBelt` keeps.
  const t = beltRunning(now()) && !pitRefuses() ? (now() % 900) / 900 : 0;
  ctx.fillStyle = '#fff';
  for (let x = from + Math.round(t * 4) * P; x < to; x += P * 4) {
    ctx.fillRect(x, y, P, P);
  }
  ctx.fillStyle = '#000';
  // What is riding it: each load a grain, drawn as whatever it is, sitting on
  // the band. Same call a chip in the air gets, because it is the same grain --
  // it was one a moment ago and it will be one again off the head.
  for (const b of S.belt) drawMark(b.s, Math.round(b.x) + P / 2, Math.round(b.y) + P / 2);
  ctx.fillStyle = '#000';
}

// The machine's switch, drawn on the roster under the headcount.
//
// It is a **lever**, and after a checkbox and a slide switch that is the one it
// should always have been -- because a lever is the thing the yard already says
// it is. Nothing here happens without hands: you throw it, and somebody walks
// over and does it. Every other drawing was an abstraction of a mechanism the
// game was at pains to keep concrete.
//
// A pivot, a rod, a ball on the end. It leans **towards** the machine's mark
// when the machine is working the station and away from it when the hands are,
// so which way is which needs no telling: the lever points at what is doing the
// work.
//
// **Two positions, and no third.** It shows what you have *asked* for. Throwing
// it is a request that takes a walk to answer, but that is the yard's business
// and not the switch's -- a control that sat at half-cock until somebody arrived
// was a control reporting on the crew rather than on itself, and it made a
// yes-or-no question look like it had three answers.
//
// What went before, so it is not tried again. A checkbox is a question and its
// answer in one square with the question written nowhere, and which of ticked
// and clear means *on* is a convention somebody has to be told. The slide switch
// that replaced it was drawn inside out -- a black knob riding a white slot cut
// into a black plate, so the knob had no contrast against the thing it slid in
// and the only part that visibly moved was the white gap. It read as a meter,
// and worse, as *this station's own meter*: a white bar inside a black body is
// exactly how the ram draws how far through the boulder it is.
// What is working this station, drawn on the roster under the headcount: the
// machine's own mark, and nothing else.
//
// It is a **label, not a control**, and getting to that took three goes at a
// control that should never have existed. A checkbox, which is a question and
// its answer in one square with the question written nowhere. Then a slide
// switch, drawn inside out -- a black knob riding a white slot cut into a black
// plate, so the only part that visibly moved was the gap, and the whole thing
// read as a meter. Then a lever, which was at least honest about the mechanism.
//
// All three were answering "is this station worked by the hands or by the
// machine", and the yard had a better answer to that all along: **is anybody
// standing at it.** A machine with nobody at it produces nothing and smokes
// nothing, and the count directly above this mark is how many bodies are there.
// So the way to stop a machine is the `-` button that stops every other station,
// and the picture underneath is simply what those hands are working.
//
// Which leaves the mark one job, and the rule for it is that it must be the
// *same machine* as the one standing in the yard -- the same silhouette, feature
// for feature. See MACHINE_MARK.
export function drawRunSwitch(box, key) {
  const mark = MACHINE_MARK[key];
  if (!mark) return;
  const w = spriteW(mark), h = spriteH(mark);
  // Centred on the strip, standing on its bottom line, so it sits under the
  // count rather than off to one side of it.
  const x = box.x + Math.round((box.w / P - w) / 2) * P;
  const y = box.y + box.h - h * P;

  // A cell of clear air behind it. Most rosters stand on bare white ground and
  // this paints nothing anyone can see; the ones that do not -- a mark with a
  // pile or a wall behind it -- would otherwise be black drawn on black, which
  // is no drawing at all.
  ctx.fillStyle = '#fff';
  ctx.fillRect(x - P, y - P, (w + 2) * P, (h + 2) * P);
  drawSprite(ctx, mark, x, y);
  ctx.fillStyle = '#000';
}

// A puff off a machine's stack. It is the same smoke the lab's chimney makes and
// the same list, flagged `mach` so that the lab's own count -- which means
// something specific, that research is being worked on -- is not muddled by it.
//
// Only a machine that is actually running smokes, and `stepMachines` is what
// decides that. A stack puffing over an idle machine would be the drawing
// claiming something the yard denies.
// A puff off a machine's stack. It is the same smoke the lab's chimney makes and
// the same list, flagged `mach` so that the lab's own count -- which means
// something specific, that research is being worked on -- is not muddled by it.
//
// Only a machine that is actually running smokes, and `stepMachines` is what
// decides that. A stack puffing over an idle machine would be the drawing
// claiming something the yard denies.
//
// Where each stack is, is the station's own business and is registered with the
// machine -- see `defineMachine`. This used to be a table here, which meant the
// drawing had one opinion about where the chimney was and `stepMachines` had
// another about where the dirt went up, and the two disagreed for as long as
// nobody put them side by side.

export function stepMachineSmoke(now) {
  for (const m0 of MACHINES) {
    const key = m0.key;
    const m = machine(key);
    if (!m || !m.bought) continue;
    if (now - (m.workedAt || 0) > MACHINE_IDLE_MS) continue;   // idle, unmanned, or stood down
    if (now < (m.puffAt || 0)) continue;
    m.puffAt = now + MACHINE_PUFF_MS * (0.6 + rand() * 0.8);
    const spec = specOf(key);
    if (!spec || !spec.stack) continue;
    const at = spec.stack();
    puff(at.x, at.y, { s: MACHINE_PUFF_S, n: 4, flag: 'mach',
                       rise: MACHINE_PUFF_RISE, life: MACHINE_PUFF_LIFE });
  }
}
