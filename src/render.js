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

// Extracted draw clusters. render.js stays the core (ctx, drawMark, drawBody,
// withRise, bar and the master frame draw); each of these owns one drawn thing
// and imports those primitives back. Re-exported here so render.js keeps its
// old public surface for the rest of the game.
import { drawApothecary } from './render/apothecary.js';
export { CAULDRON, CAULDRON_BREW_ROW, drawApothecary } from './render/apothecary.js';
import { drawMuck, drawSmog, drawPuffs, drawDraught, drawRain } from './render/smog.js';
export { drawMuck, drawSmog, drawPuffs, drawDraught, drawRain } from './render/smog.js';
import { drawOuthouse, drawTower, drawTowerWaves, drawTowerBar, towerBarAt } from './render/tower.js';
export { drawOuthouse, drawTower, drawTowerWaves, drawTowerBar, towerBarAt } from './render/tower.js';
import { drawBalloons, drawBrollies } from './render/balloon.js';
export { drawBalloons, drawBrollies } from './render/balloon.js';
import { drawScrub } from './render/scrub.js';
export { drawScrub } from './render/scrub.js';
import { drawPotPile, drawSparks, drawCasino, casinoMarkAt, drawCasinoMark } from './render/casino.js';
export { drawPotPile, drawSparks, drawCasino, casinoMarkAt, drawCasinoMark } from './render/casino.js';
import { drawSky } from './render/sky.js';
export { drawSky } from './render/sky.js';
import { drawCoreAt, drawCoreBehind, drawCore, drawPaid, drawRift, drawCoreGlow, drawRockSand } from './render/cores.js';
export { drawCoreAt, drawCoreBehind, drawCore, drawPaid, drawRift } from './render/cores.js';
import { drawCount } from './render/counter.js';
export { drawCount } from './render/counter.js';
import { drawDrill, drawRam, drawTiller, drawBelt, drawRunSwitch, stepMachineSmoke } from './render/machines.js';
export { drawDrill, drawRam, drawTiller, drawBelt, drawRunSwitch, stepMachineSmoke } from './render/machines.js';

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

// A cell of a ring, put down *centred* on the point it is drawn at rather than
// hanging off it by its top-left corner. Half a cell down and half a cell right
// is not much on its own and is exactly enough to make a ring read as slipped
// off whatever it is supposed to be coming out of. Shared: the star's corona and
// the tower's pour rings both lay their circumferences down a cell at a time.
export function cell(x, y) {
  ctx.rect(Math.round((x - P / 2) / P) * P, Math.round((y - P / 2) / P) * P, P, P);
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
export function bar(cx, cy, at) {
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
export function risingPlace() {
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
export function withRise(rising, x, bottom, w, h, fn) {
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

// A little flask, in cells: a corked neck over a rounded body, with the liquid
// filling the body from the bottom by `fill` (0..1). Black glass, a white line
// for the surface of what is in it -- no glow, on the grid, the yard's language.
// `x` is the left of the three-wide body; `topY` is the neck's row.
function drawPotion(x, topY, fill = 1) {
  x = Math.round(x / P) * P;
  topY = Math.round(topY / P) * P;
  ctx.fillStyle = '#000';
  ctx.fillRect(x + P, topY, P, P);                 // the cork/neck, centered
  ctx.fillRect(x, topY + P, P * 3, P * 3);         // the body, three wide and tall
  // The liquid: a white surface line that sits lower as the flask empties, so a
  // full dose is a full bottle and a spent one is nearly empty.
  ctx.fillStyle = '#fff';
  const drop = Math.round((1 - Math.max(0, Math.min(1, fill))) * 2);   // 0..2 cells down
  ctx.fillRect(x + P, topY + P + drop * P, P, P);                      // surface within the body
  ctx.fillStyle = '#000';
}

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

    // The tonic on the body: the potion itself, floating over the head, so a
    // buffed body reads as buffed at a glance rather than by a bar that merged
    // into the black of the worker. Its liquid drops as the dose wears off -- the
    // flask empties -- which is the readout being a picture, not a lamp. See
    // `doseFrac` in apothecary.js.
    const frac = doseFrac(w);
    if (frac > 0) drawPotion(x + WORKER / 2 - P * 1.5, y - P * 6, frac);

    // A stirrer with a dose in hand carries the flask in front of it, so the
    // round is a body plainly walking a potion out to somebody -- not a number
    // arriving on a worker across the yard. See `stepStirrer`.
    if (w.type === 'stirrer' && w.holding)
      drawPotion(x + (w.face || 1) * P * 2, y - P * 2, 1);

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

