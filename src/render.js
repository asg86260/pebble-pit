// Everything the game draws, and nothing that decides anything.
//
// Painting order is the whole trick: the rock goes down over the ground line so
// it stands in front of it, the crew and the spoil go over the rock, and the pit
// is blitted from its own scratch canvas rather than drawn a grain at a time.

import { P, SMOKE_LIFE, SHADES, MARK_SIZE, FIND_COLOR, findKind, CORE_CELL, CORE_FROM, SHARD_CELL, SPARK_CELL,
        SPORE_CELL, CORE_SIZE, WORKER, FARM_H, FARM_GATE, TABLE_LIFE, CASINO_SLICES,
        CASINO_KEEP, CASINO_LOSE, CASINO_H, SCRUB_FOLDS,
        RAY_N, RAY_MIN, RAY_MAX, RAY_BEAT, CORE_FLICK, SUMMON_FLASH, MAGIC_TONES, DRAUGHT_INK,
        TOWER_WAVE_MS, TOWER_WAVE_N, TOWER_WAVE_R, TOWER_SHAFT } from './config.js';
import { S, floor, pit, bench, quarry, farm, lab, sky, school, casino, scrub, table , tower, outhouse } from './state.js';
import { at, bottomY, shadeOf, isDust, depthShade, count } from './grid.js';
import { bridgeSpan } from './world.js';
import { boulderAlive, depthOf, cellPos } from './rock.js';
import { coreHome } from './core.js';
import { brewing, brewAt } from './tower.js';
import { cellX, cellY, BOLTS, SPARKLE, summoning, summonAt, CORE as METEOR_CORE_CELL } from './meteor.js';
import { pitDepth, pitFull } from './pit.js';

import { underground, quarryShape, ladder, quarryCells, LADDER_W } from './quarry.js';
import { indoors, progress } from './lab.js';
import { inHouse, inScrub } from './scrubhouse.js';
import { DOOR_W, DOOR_H, LAB_FLUE, SCRUB_CHUTE, SCRUB_ARM, MUCK_TONE, MUCK_SKIN, SMOG_TINTS } from './config.js';
import { HAZE_CA } from './config.js';
import { SKY, DROPS, DRAUGHT, muckCols, poopCols, muckFloor } from './smog.js';
import { machine, MACHINES, asked } from './machines.js';
import { leverBox } from './crew.js';
import { walkY } from './world.js';
import { jawX, jawY } from './quarry.js';
import { ramX } from './rock.js';
import { rockLeft, groundAt } from './world.js';
import { tillerAt } from './farm.js';
import { MACHINE_PUFF_MS, MACHINE_PUFF_S, MACHINE_IDLE_MS } from './config.js';
import { pot, potAt, sliceKeeps } from './casino.js';
import { buriedVisible, buriedAt } from './intro.js';
import { plotX } from './farm.js';
import { fmt, STATIONS, stationFoot, hasOffer } from './board.js';
import { drawRoster, drawRosterCounts, kitStands, KIT_MARK } from './roster.js';
import { atHome } from './crew.js';
import { drawHouses } from './house.js';
import { drawAir, drawAirNear } from './air.js';
import { drawClouds, drawBirds } from './weather.js';
import { now } from './clock.js';
import { press } from './press.js';

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

  // The farm needs a silhouette or it is just texture on the ground line: a post
  // at either end of the row, with a stub of rail running off it, so the plot
  // reads as somewhere fenced and kept even when nothing is growing. Kept low
  // and thin -- it is there to bracket the plots, not to be the thing you look at.
  const postH = P * 6;
  ctx.fillStyle = '#000';
  for (const px of [farm.x - FARM_GATE, farm.x + farm.w + FARM_GATE - P]) {
    ctx.fillRect(px, S.groundY - postH, P, postH);
    ctx.fillRect(px + (px < farm.x ? P : -P * 2), S.groundY - postH + P * 2, P * 2, P);
  }

  // A plot is three cells across and two deep, with the earth turned over in it.
  // Small, but a shape rather than a scratch, and it has something in it even
  // when nobody has been by to tend it.
  for (let i = 0; i < S.plots.length; i++) {
    const x = Math.round(plotX(i) / P) * P;
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
  } else if (kind === SPARK_CELL) {
    // A spark: four points, longer than they are wide. The quarry is a triangle and
    // the plots are a hexagon -- both of them things with sides -- so this one is
    // a thing with no sides at all, which is what it looked like coming down.
    ctx.beginPath();
    ctx.moveTo(x, y - h);
    ctx.lineTo(x + h / 3, y - h / 3);
    ctx.lineTo(x + h, y);
    ctx.lineTo(x + h / 3, y + h / 3);
    ctx.lineTo(x, y + h);
    ctx.lineTo(x - h / 3, y + h / 3);
    ctx.lineTo(x - h, y);
    ctx.lineTo(x - h / 3, y - h / 3);
    ctx.closePath();
    ctx.fill();
  } else {
    const t = size / 3;
    ctx.fillRect(x - t / 2, y - h, t, size);
    ctx.fillRect(x - h, y - t / 2, size, t);
  }
  ctx.fillStyle = '#000';
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
      ctx.fillRect(x, y, P, P);
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
  if (pitFull()) { const at = pitMarkAt(); warning(at.x, at.y); }
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
function warning(x, y) {
  drawTriangle(x, y, P * 4, true);
  ctx.fillStyle = '#000';
  // the mark sits inside the outline rather than on it: a triangle's base is its
  // lowest edge, and a dot resting on that reads as a smudge
  ctx.fillRect(x - P / 2, y - P, P, P * 1.6);
  ctx.fillRect(x - P / 2, y + P * 1.4, P, P);
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
const SLOT_W = P * 6;
const SLOTS = ['stopped', 'offer'];        // left to right, and never reordered

// The middle of a station's row of slots. Everything that hangs under a station
// is measured from here, so moving a station moves its marks with it.
export function markAnchor(key) {
  const box = key === 'quarry' ? quarry
            : key === 'farm' ? farm
            : key === 'scrub' ? scrub
            : null;
  const strip = S.piles.find(p => p.key === key);
  // The quarry is a hole, and its marks used to hang off the left-hand lip --
  // which is the corner the ladder comes up and the busiest few cells in the
  // yard. They stand on the ground to the *right* of the mouth instead, where
  // there is nothing else and nothing walks.
  const x = key === 'quarry' ? quarry.x + quarry.w + SLOT_W
          : key === 'rock' ? S.cx
          : key === 'sky' ? sky.x
          : box ? box.x + box.w / 2
          : strip ? (strip.from + strip.to) / 2
          : (f => f == null ? farm.x + farm.w / 2 : f)(stationFoot(key));
  // Clear of the station itself. The star is four hundred pixels up with no
  // ground under it at all, so its marks hang beneath it where the wizards are;
  // everything else stands on the floor of the yard, including the quarry now
  // that its marks are beside the hole rather than over it.
  const y = key === 'sky' ? sky.y + sky.r + P * 9 : S.groundY + P * 7;
  return { x: Math.round(x / P) * P, y: Math.round(y / P) * P };
}

// One slot of that row.
export function markAt(key, kind) {
  const at = markAnchor(key);
  const i = Math.max(0, SLOTS.indexOf(kind));
  const left = at.x - (SLOTS.length * SLOT_W) / 2 + SLOT_W / 2;
  return { x: Math.round((left + i * SLOT_W) / P) * P, y: at.y };
}

export function pileMarkAt(key) {
  return markAt(key, 'stopped');
}

// where the cursor has to be to be asking about one
export function overPileMark(key, mx, my) {
  const at = pileMarkAt(key);
  return Math.abs(mx - at.x) < P * 5 && Math.abs(my - at.y) < P * 5;
}

// The hole's own mark. Above the ground line rather than below it, because below
// it is the pile -- and to the left of the lip, because the counter is to the
// right of it.
export function pitMarkAt() {
  return { x: Math.round((pit.x - P * 5) / P) * P, y: S.groundY - P * 7 };
}

export function overPitMark(mx, my) {
  const at = pitMarkAt();
  return Math.abs(mx - at.x) < P * 5 && Math.abs(my - at.y) < P * 5;
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
  if (!S.schoolOpen) return;
  const { x, y, w, h } = school;
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
  if (!S.labOpen) return;
  const { x, y, w, h } = lab;
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
  if (!SKY.length) return;
  const mid = S.camX + S.viewW / 2;
  const half = Math.max(1, S.viewW / 2);

  // One path a tint *and a weight*: every speck carries its own ink -- see
  // `skyMote` -- and specks of the same colour and weight go down together, so a
  // band of six thousand is still a dozen fills rather than six thousand.
  const runs = new Map();
  const warm = [], cool = [];
  for (const m of SKY) {
    if (!onScreen(m.x)) continue;
    const x = Math.round(m.x), y = Math.round(m.y);
    const off = Math.max(-1, Math.min(1, (m.x - mid) / half)) * HAZE_CA;
    if (Math.abs(off) >= CA_FLOOR) {
      warm.push(Math.round(m.x - off), y);
      cool.push(Math.round(m.x + off), y);
    }
    // its kind's palette, and its own tone out of that palette. Both are fixed
    // on the mote, so a speck does not shimmer between colours frame to frame.
    const shades = SMOG_TINTS[m.kind] || SMOG_TINTS.dust;
    const tint = shades[(m.tone ?? 0) % shades.length];
    // to the nearest twentieth, so the weights fall into a handful of buckets
    const step = Math.round((m.ink ?? 1) * 20) / 20;
    const key = tint + '|' + step;
    let run = runs.get(key);
    if (!run) runs.set(key, run = { tint, ink: step, at: [] });
    run.at.push(x, y);
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
  if (!S.outhouseOpen) return;
  const { x, y, w, h } = outhouse;
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
  if (!S.towerOpen) return;
  const { x, y, w, h } = tower;
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

export function drawScrub() {
  if (!S.scrubOpen) return;
  const { x, y, w, h } = scrub;
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
  if (!S.casinoOpen) return;
  const { x, y, w, h } = casino;
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

// A piece of research under way, over the lab: a bar that fills. It reads from
// across the yard, which a percentage in a menu never did -- the lab works while
// you are somewhere else entirely, and a number you have to walk over and open a
// board to see is a number you check once and then forget is running.
//
// It fills a cell at a time rather than smoothly, like everything else that
// moves in this game, and it does not move at all while the lab is empty --
// which is the mechanic, said by the thing itself instead of by a caption.
export function drawLabBar() {
  if (!S.labOpen || !S.research) return;
  const at = labMarkAt();
  const w = P * 14, h = P * 3;
  const x = at.x - w / 2, y = at.y - h / 2;

  ctx.fillStyle = '#fff';
  ctx.fillRect(x, y, w, h);
  ctx.lineWidth = Math.max(1, P / 3);
  ctx.strokeStyle = '#000';
  ctx.strokeRect(x, y, w, h);

  ctx.fillStyle = '#000';
  const room = w - P * 2;
  const done = Math.round(room * progress() / P) * P;
  if (done > 0) ctx.fillRect(x + P, y + P, done, h - P * 2);
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

function drawCoreGlow(cx, cy) {
  const t = now();
  for (let i = 0; i < WAVES; i++) {
    const k = ((t / WAVE_MS) + i / WAVES) % 1;
    const r = CORE_SIZE / 2 + k * WAVE_REACH;
    // out and gone: it thins as it widens, the way anything spreading does
    ctx.globalAlpha = WAVE_ALPHA * (1 - k) * (1 - k);
    ctx.fillStyle = `hsl(${Math.round(t / 12 + i * 140) % 360} 85% 58%)`;
    // one cell per cell of arc, and never the same cell twice: a ring drawn at
    // an even angle doubles up on the diagonals, and a cell painted twice at
    // half alpha is a cell at full alpha
    const n = Math.max(8, Math.round((Math.PI * 2 * r) / P));
    const seen = new Set();
    for (let j = 0; j < n; j++) {
      const a = (j / n) * Math.PI * 2 + k * 0.8;      // and it turns as it goes
      const x = Math.round((cx + Math.cos(a) * r) / P) * P;
      const y = Math.round((cy + Math.sin(a) * r) / P) * P;
      // Nothing below the ground line -- what this reads as is heat coming off
      // the thing, and heat does not go down into the dirt. Unless the thing is
      // already down there, in which case the ground line is not a lid.
      if (cy < S.groundY && y >= S.groundY) continue;
      const key = `${x},${y}`;
      if (seen.has(key)) continue;
      seen.add(key);
      ctx.fillRect(x, y, P, P);
    }
  }
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#000';
}

export function drawCoreAt(x, y) {
  drawCoreGlow(x + CORE_SIZE / 2, y + CORE_SIZE / 2);
  // radius allows for the 2px stroke, so the circle stays inside its box and
  // never paints over the ground line it is resting on
  drawCircle(x + CORE_SIZE / 2, y + CORE_SIZE / 2, CORE_SIZE / 2 - 2);
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
  drawCoreAt(h.x, h.y);
}

// out in the world: on the cursor or lying on the ground
export function drawCore() {
  if (S.heldCore) drawCoreAt(S.mouse.x - CORE_SIZE / 2, S.mouse.y - CORE_SIZE / 2);
  else if (S.coreItem) drawCoreAt(S.coreItem.x, S.coreItem.y);
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

  // Everything that is going on it, bottom row first. Gathered before any of it
  // is drawn because the card behind it has to be the size of all of it.
  const lines = [{ cell: null, text: dust }];
  if (S.seenCore) lines.push({ cell: CORE_CELL, text: String(S.cores) });
  if (S.seenShard) lines.push({ cell: SHARD_CELL, text: fmt(S.shards) });
  if (S.seenSpore) lines.push({ cell: SPORE_CELL, text: fmt(S.spores) });
  if (S.seenSpark) lines.push({ cell: SPARK_CELL, text: fmt(S.sparks) });

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

  // a grain of dust, then the count of it
  ctx.fillStyle = '#000';
  ctx.fillRect(x, y - MARK, MARK, MARK);
  ctx.fillText(dust, x + MARK * 2, y);

  // then one row for every other kind, each shown only once you have seen one
  let row = y;
  for (const l of lines) {
    if (!l.cell) continue;                     // the dust is drawn above
    row -= ROW;
    drawMark(l.cell, x + MARK / 2, row - MARK / 2, MARK, true);
    ctx.fillStyle = '#000';
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
export function drawHat(x, y, kind = 'helmet', tight = false) {
  ctx.fillStyle = '#000';
  if (kind === 'brim') {
    // Two clear cells of brim past the body on each side, and a low crown on
    // top of it. Narrower than this and it was a helmet somebody had sat on:
    // what says sun hat is the overhang, so the overhang is most of the shape.
    const over = tight ? P : P * 2;
    ctx.fillRect(x - over, y - P, WORKER + over * 2, P);
    ctx.fillRect(x + P * 2, y - P * 2, WORKER - P * 4, P);
    return;
  }
  if (kind === 'point') {
    // The wizard's, and the only hat here that goes up rather than across: a
    // brim a cell proud each side, and a cone stepped off it -- five cells, then
    // three, then one, which is the only symmetrical taper a three-cell body
    // will carry.
    //
    // The middle course used to be two cells wide, sat off-centre, and the tip
    // was drawn at a *negative* width and so never drawn at all: a lopsided stub
    // rather than a hat. It is the one piece of headgear in the yard with a
    // shape of its own and it was the one drawn wrong.
    //
    // And it keeps its brim wherever it is drawn. `tight` is for hats that can
    // afford to lose their overhang -- a helmet is a helmet either way -- and
    // this is the one that cannot: the brim standing proud of the body is the
    // whole of what says wizard. Squeezed to the body's own width it was three
    // cells on three cells with a nub on top, which is a bottle with a cork in
    // it, and it was what every counter in the game was wearing while the body
    // out in the yard wore a cone.
    ctx.fillRect(x - P, y - P, WORKER + P * 2, P);
    ctx.fillRect(x, y - P * 2, WORKER, P);
    ctx.fillRect(x + P, y - P * 3, P, P);
    return;
  }
  ctx.fillRect(x, y - P, WORKER, P);
  if (kind === 'lamp') ctx.fillRect(x + WORKER / 2 - P / 2, y - P * 2, P, P);
}

// What a body has on. It is asked of the *kit* -- which station the thing came
// off -- and never of the job the body is doing, because those two are different
// for the length of the walk back: somebody taken off the rock is a hauler as
// far as the books are concerned and is still carrying the rock's helmet, and
// drawing it as a hauler put a cart behind it for the whole of that walk.
const wearing = w => w.trained ? KIT_MARK[w.kitOf] || null : null;

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
const HAT_TALL = { helmet: P, lamp: P * 2, brim: P * 2, point: P * 3, cart: 0 };

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
    // Five courses about the middle: 1, 3, 5, 3, 1.
    for (let i = 0; i < 5; i++) {
      const wide = (i < 3 ? i : 4 - i);                // 0,1,2,1,0
      ctx.fillRect(at.x - wide * P, at.y - P * 2 + i * P, P * (wide * 2 + 1), P);
    }
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
    if (underground(w) || indoors(w) || inHouse(w) || atHome(w)) continue;
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

export function drawWorkers() {
  for (const w of S.workers) {
    // out of sight: in the lab, down the quarry, in the outhouse, or home
    if (underground(w) || indoors(w) || inHouse(w) || atHome(w)) continue;

    if (w.type === 'labber' || w.type === 'farmhand' || w.type === 'quarrier') {
      const x = Math.round(w.x), y = Math.round(w.y + (w.lunge || 0) * P);
      drawBody(x, y);
      if (wearing(w) && wearing(w) !== 'cart') drawHat(x, y, wearing(w));
      // what a quarrier is bringing up rides over its head, the way a load does
      if (w.type === 'quarrier' && w.carry) drawMark(SHARD_CELL, x + WORKER / 2, y - P * 2);
      continue;
    }

    // A wizard, wherever it has got to: on the ground walking out to the tower,
    // or four hundred pixels up with its hat on. Nothing else about it is drawn
    // differently -- it is a body, and the whole trick of it is that it is a
    // body somewhere a body cannot be.
    if (w.type === 'wizard') {
      const x = Math.round(w.x), y = Math.round(w.y + (w.lunge || 0) * -P);
      drawBody(x, y);
      if (wearing(w)) drawHat(x, y, wearing(w));
      continue;
    }

    if (w.type === 'miner') {
      drawBody(Math.round(w.x), Math.round(w.y));
      if (wearing(w) && wearing(w) !== 'cart') drawHat(Math.round(w.x), Math.round(w.y), wearing(w));
    } else {
      // where it actually is, not where the ground line is: on the bridge those
      // are different, and it was the ground line that won
      const y = Math.round(w.y);
      const x = Math.round(w.x);
      const cart = wearing(w) === 'cart' ? cartBox(x, y, w.face || 1) : null;
      if (cart) drawCart(x, y, w.face || 1);       // behind the body it follows
      drawBody(x, y);
      // and a hauler still carrying somewhere else's kit back to it wears that,
      // not a cart it never picked up
      const hat = wearing(w);
      if (hat && hat !== 'cart') drawHat(x, y, hat);
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
        drawCircle(Math.round(w.x) + WORKER / 2, y - P * (stack + 2), P * 1.2);
      }
    }
  }
}


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
  drawJaw();                 // after the quarry, or its white columns erase it
  drawBridge();              // and the way across it
  drawHoist();               // which the hoist stands on
  drawFarm();
  drawTiller();
  drawRam();                 // before the rock, so the hill stands in front of it
  drawLevers();              // and the one control in the yard that is not on a board
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

  // The bench and the settlement go down before the loose stuff, not after.
  //
  // Everything that is lying on the ground -- dust, finds, the muck a rain left --
  // is in front of every building it reaches. A heap that runs up to a wall and
  // then stops dead at it is a heap that has been drawn around the wall; a heap
  // that piles up *against* the wall and buries its foot is a heap. The buildings
  // are the yard and the loose stuff is what the yard is full of.
  drawBench();
  drawHouses(ctx);         // and the crew are drawn later still, so they walk in front of both

  drawGrid(floor);
  drawPit();
  drawMuck();              // and whatever the last rain left on top of the lot

  drawPitOutline();

  drawPaid();
  drawCore();
  drawPileMarks();         // and a bar over anything that has stopped for a full one
  drawLabBar();            // how far along the lab is, over the lab itself
  drawDraught();           // the air going into the scrubbing house
  drawTowerWaves();        // the tower pouring, while it is making a hat
  drawTowerBar();          // and how far along the tower's hat is, over the tower
  drawLabMark();           // and a tick over it if it finished something
  drawCasinoMark();        // and which way the last hand at the table went
  drawOffers();            // and an arrow under whichever of them has something for you
  drawKitStands();                                // and the kit put out ready at each of them
  drawRoster(ctx, drawBody, drawHat, drawCart);   // who is working here, under the place they work
  drawIntro();             // the two of them, or whoever is under the rock
  drawWorkers();
  drawSays();              // and what any of them stood about is saying
  drawPuffs();             // what the crew are putting up there right now
  drawSmog();              // and what it has gathered into up there
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
export function drawPitCores() {
  const pad = CORE_SIZE / 2 + 1;
  for (let r = 0; r < pit.rows; r++) {
    for (let c = 0; c < pit.cols; c++) {
      // only cores: everything else in the pile is painted with the dust
      if (at(pit, c, r) !== CORE_CELL) continue;
      const x = pit.x + c * pit.p, y = bottomY(pit) - (r + 1) * pit.p;
      const cx = Math.min(Math.max(x + pit.p / 2, pit.x + pad), pit.x + pit.w - pad);
      const cy = Math.min(Math.max(y + pit.p / 2, pit.y + pad), bottomY(pit) - pad);
      // It does not stop giving off whatever it gives off because you put it
      // somewhere. A hole with a few of them in it is a hole with a few of them
      // in it, and the counter is not the only place that should say so.
      drawCoreGlow(cx, cy);
      drawMark(CORE_CELL, cx, cy, CORE_SIZE, true);
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
  if (!m || !m.bought || !m.on) return 0;
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

// The jaw: a block on the floor of the cut with a mouth cut white out of its
// front, opening and shutting on its own beat. It stands on the ground as the
// ground is now -- see `jawY`, which reads `dugTopY` -- so when the quarry falls
// back in the jaw comes up with it, the way a quarrier's feet do.
export function drawJaw() {
  if (!S.quarryOpen || !built('jaw')) return;
  const x = Math.round(jawX() / P) * P;
  const y = Math.round(jawY() / P) * P;
  const W = 4, H = 3;                          // cells
  ctx.fillStyle = '#000';
  ctx.fillRect(x, y, W * P, H * P);
  // the stack, standing a cell proud of the body on the far side from the face
  ctx.fillRect(x + P * (W - 1), y - P * 2, P, P * 2);
  // The mouth: a white slot in the near face that opens a cell and shuts again.
  // Two frames of animation is all it needs -- it is eighteen pixels of machine.
  const open = stroke('jaw') < 0.5 ? 1 : 2;
  ctx.fillStyle = '#fff';
  ctx.fillRect(x, y + P, P, P * open);
}

// The hoist: an upright frame on the deck over the mouth of the cut, a white
// rope line down the middle of it, and a skip that rides the rope. Its x comes
// off `ladder()` so the rope and the rungs cannot drift apart when the quarry is
// resited.
export function drawHoist() {
  if (!S.quarryOpen || !built('jaw')) return;
  const l = ladder();
  const x = Math.round((l.x - P * 3) / P) * P;
  // On the deck, not on the ladder's overhang: `l.top` stands LADDER_OVER proud
  // of the walking surface, and standing the frame on it left the hoist floating
  // a cell above the boards.
  const top = Math.round((groundAt(l.x + LADDER_W / 2) - P * 7) / P) * P;
  const H = 7;
  ctx.fillStyle = '#000';
  ctx.fillRect(x, top, P, P * H);                        // the near leg
  ctx.fillRect(x + P * 2, top, P, P * H);                // and the far one
  ctx.fillRect(x, top, P * 3, P);                        // the head
  // The rope is black on a white yard -- it was drawn white, which on this
  // background is nothing at all -- and the skip is cut white out of it, so the
  // two cannot be confused with each other.
  ctx.fillRect(x + P, top + P, P, P * (H - 1));
  const t = stroke('jaw', 2200);
  const ride = Math.round(Math.abs(1 - t * 2) * (H - 2));  // the whole drop, and back
  ctx.fillStyle = '#fff';
  ctx.fillRect(x + P, top + P + ride * P, P, P);
}

// The ram: a squat engine outside the apron with an arm that reaches into the
// face and strikes. One white slot for the piston, and the arm is the thing that
// moves -- it is the only machine whose working end is somewhere other than
// where its body stands, which is the whole of why it can be there at all.
export function drawRam() {
  if (!built('ram')) return;
  const x = Math.round(ramX() / P) * P;
  const y = Math.round((S.groundY - P * 4) / P) * P;
  const W = 4, H = 4;
  ctx.fillStyle = '#000';
  ctx.fillRect(x, y, W * P, H * P);
  ctx.fillRect(x + P, y - P * 2, P, P * 2);              // the stack
  // The arm: out towards the hill on the stroke, back on the return.
  // The arm is as long as the gap it has to cross, worked out rather than
  // guessed: three cells of literal left it striking empty air a good way short
  // of the hill. It draws back by two on the return.
  const gap = Math.max(1, Math.round((rockLeft() - (x + W * P)) / P) + 1);
  const t = stroke('ram', 700);
  const reach = t < 0.35 ? gap : t < 0.5 ? gap - 1 : Math.max(1, gap - 2);
  ctx.fillRect(x + W * P, y + P, P * reach, P);
  ctx.fillStyle = '#fff';
  ctx.fillRect(x + P, y + P, P * 2, P);                   // the slot
}

// The tiller: a low frame that crawls the plot line and turns the ground behind
// it. The only machine that travels, which is what makes it read as a different
// kind of thing at a glance. Its x is derived from the plot it is working, so it
// is where the work is by construction.
export function drawTiller() {
  if (!S.farmOpen || !built('tiller')) return;
  const x = Math.round(tillerAt() / P) * P;
  // It sits *on* the ground, so its foot is where a body's foot is. `walkY` is
  // the top of a body standing there, not the surface under it -- a box drawn at
  // `walkY - height` hangs below the line rather than standing on it.
  const y = Math.round((walkY(x + WORKER / 2) + WORKER - P * 2) / P) * P;
  ctx.fillStyle = '#000';
  ctx.fillRect(x, y, P * 3, P * 2);
  ctx.fillRect(x + P, y - P * 2, P, P * 2);              // the stack
  // Two wheels, white, turning: the cell that is cut out moves round the frame,
  // which at this size is what a turning wheel looks like.
  const t = stroke('tiller', 520);
  ctx.fillStyle = '#fff';
  ctx.fillRect(x + (t < 0.5 ? 0 : P * 2), y + P, P, P);
}

// The lever. A stand with an arm on it, and the arm's angle says what the lever
// has been *asked* for rather than what the machine is doing -- so throwing it
// reads as thrown immediately, while somebody is still walking over, instead of
// looking like nothing happened for the length of a commute.
//
// That distinction is the whole of why `asked()` exists.
export function drawLevers() {
  for (const m of MACHINES) {
    const b = leverBox(m.key);
    if (!b) continue;
    ctx.fillStyle = '#000';
    ctx.fillRect(b.x, b.y + b.h - P, b.w, P);            // the stand
    ctx.fillRect(b.x + P, b.y + P, P, b.h - P * 2);      // the post
    // Over for on, down for off. Two cells of travel is all it needs to read.
    const on = asked(m.key);
    ctx.fillRect(b.x + (on ? b.w - P : 0), b.y, P, P * 2);
  }
}

// A puff off a machine's stack. It is the same smoke the lab's chimney makes and
// the same list, flagged `mach` so that the lab's own count -- which means
// something specific, that research is being worked on -- is not muddled by it.
//
// Only a machine that is actually running smokes, and `stepMachines` is what
// decides that. A stack puffing over an idle machine would be the drawing
// claiming something the yard denies.
const STACKS = {
  jaw:    () => ({ x: jawX() + P * 3, y: jawY() - P * 2 }),
  ram:    () => ({ x: ramX() + P, y: S.groundY - P * 6 }),
  tiller: () => ({ x: tillerAt() + P, y: walkY(tillerAt() + WORKER / 2) + WORKER - P * 4 })
};

export function stepMachineSmoke(now) {
  for (const key of Object.keys(STACKS)) {
    const m = machine(key);
    if (!m || !m.bought || !m.on) continue;
    if (now - (m.workedAt || 0) > MACHINE_IDLE_MS) continue;   // idle, unmanned, or stood down
    if (now < (m.puffAt || 0)) continue;
    m.puffAt = now + MACHINE_PUFF_MS * (0.6 + Math.random() * 0.8);
    const at = STACKS[key]();
    S.smoke.push({ x: at.x, y: at.y, drift: (Math.random() - 0.5) * 0.3,
                   s: MACHINE_PUFF_S, mach: true, t: 0 });
  }
}
