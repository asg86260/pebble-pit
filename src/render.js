// Everything the game draws, and nothing that decides anything.
//
// Painting order is the whole trick: the rock goes down over the ground line so
// it stands in front of it, the crew and the spoil go over the rock, and the pit
// is blitted from its own scratch canvas rather than drawn a grain at a time.

import { P, SMOKE_LIFE, SHADES, MARK_SIZE, FIND_COLOR, findKind, FIND_TONES, CORE_CELL, SHARD_CELL, SPORE_CELL,
         CORE_SIZE, WORKER, ROCK_SINK, TARGET, FARM_H, FARM_GATE, SPARK_LIFE,
         CASINO_SLICES, CASINO_KEEP, CASINO_LOSE, CASINO_H } from './config.js';
import { S, floor, pit, bench, quarry, farm, lab, sky, school, casino, table } from './state.js';
import { at, bottomY, shadeOf, isDust, depthShade, count } from './grid.js';
import { rockLeft, overRock, bridgeSpan } from './world.js';
import { boulderAlive, depthOf, cellPos, rockTopY } from './rock.js';
import { coreHome } from './core.js';
import { pitDepth, pitFull } from './pit.js';

import { AIR } from './air.js';
import { capacity, benchMark } from './upgrades.js';
import { underground, quarryCut, ladder } from './quarry.js';
import { indoors, progress } from './lab.js';
import { spinning, pot, potAt, potShade, sliceKeeps } from './casino.js';
import { buriedVisible, buriedAt } from './intro.js';
import { bedX, bedTop } from './farm.js';
import { fmt } from './board.js';
import { drawRoster, drawRosterCounts, kitStands, KIT_MARK } from './roster.js';
import { atHome } from './crew.js';
import { drawHouses } from './house.js';
import { drawAir, drawAirNear } from './air.js';
import { drawClouds, drawBirds } from './weather.js';
import { now } from './clock.js';

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
  const postH = P * 6;
  ctx.fillStyle = '#000';
  for (const px of [farm.x - FARM_GATE, farm.x + farm.w + FARM_GATE - P]) {
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
// else that stands on this ground.


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
  ctx.fillRect(c(9), y + P * 7, P * 2, P * 3);            // the door, standing open
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
// beds, a hole in the ground -- and a casino says what it is by shouting. A sign
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
const scale = () => window.__signScale ||
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
// The pot is a real bed of sand now -- see casino.js -- so it is blitted like
// the yard and the hole rather than drawn a triangle at a time.
export function drawPotPile() {
  if (!S.casinoOpen || !table.grid || !table.n) return;
  drawGrid(table);
}

export function drawSparks() {
  for (const k of S.sparks) {
    const find = findKind(k.s);
    // A grain on its way out of the game fades as it goes. Everything else in
    // this yard either is somewhere or is not; this is the one thing that is
    // *leaving*, and it should look like it rather than blinking off.
    if (k.fade) ctx.globalAlpha = Math.max(0, 1 - k.t / SPARK_LIFE);
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

  // The wheel: eight slices, half filled and half bare, alternating all the way
  // round -- which is the odds written on the thing itself. Black and white, like the rest of the yard -- a filled cell
  // is a thing and white is the absence of one, which is exactly what winning and
  // losing a pot are, so it needs no colour to say it.
  // Set low enough in the block that the pointer above it clears the roof: the
  // sign stands up out of the middle of that roof, and a pointer at the top of
  // the wheel was drawn straight into the bottom of the sign board.
  const cx = x + w / 2, cy = y + h * 0.62, r = Math.min(w, h) * 0.38;
  const step = (Math.PI * 2) / CASINO_SLICES;

  // A white disc knocked out of the block first. The slices are black now, and
  // black slices on a black building are a wheel you cannot find: what makes it
  // read as a wheel is the white it is set in.
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

  // a door, because somebody goes in
  ctx.fillStyle = '#fff';
  ctx.fillRect(x + w - P * 5, y + h - P * 5, P * 3, P * 5);
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
      // nothing below the ground line: what this is meant to read as is heat
      // coming off the thing, and heat does not go down into the dirt
      if (y >= S.groundY) continue;
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

// The body: one hollow square, whoever it is. Each job used to carry a mark of
// its own -- a lamp on a quarrier's head, a low notch on a stooping farmhand, a
// hollow centre on a miner -- and every one of them was a thing to learn before
// the yard could be read. Where somebody is standing already says what they are
// doing: the one on the rock is mining it, the one at a bed is tending it. So
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
//   lamp    a bar with a cell standing proud of the middle of it. The cut is
//           the one place in the yard with no daylight in it.
//   brim    a bar hanging a cell over each side, with a crown on top. Out in the
//           beds all day, and the only hat here that is about the sun.
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
  return { x: back < 0 ? x - CART_W - P : x + WORKER + P,
           y: y + WORKER - CART_H, back };
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
    const at = screenAt(k.x - P + STAND_W / 2, k.y - STAND_H - P * 3);
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

export function drawSays() {
  for (const w of S.workers) {
    if (!w.say || underground(w) || indoors(w) || atHome(w)) continue;
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
    if (underground(w) || indoors(w) || atHome(w)) continue;   // out of sight: in the lab, down the cut, or home

    if (w.type === 'labber' || w.type === 'farmhand' || w.type === 'quarrier') {
      const x = Math.round(w.x), y = Math.round(w.y + (w.lunge || 0) * P);
      drawBody(x, y);
      if (wearing(w) && wearing(w) !== 'cart') drawHat(x, y, wearing(w));
      // what a quarrier is bringing up rides over its head, the way a load does
      if (w.type === 'quarrier' && w.carry) drawMark(SHARD_CELL, x + WORKER / 2, y - P * 2);
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
  drawBridge();              // and the way across it
  drawFarm();
  drawSky();
  drawLab();
  drawCasino();
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

  drawGrid(floor);
  drawPit();

  drawPitOutline();

  drawPaid();
  drawBench();
  drawHouses(ctx);         // where the crew live, behind them: a body walking past is in front of it
  drawCore();
  drawPileMarks();         // and a bar over anything that has stopped for a full one
  drawLabBar();            // how far along the lab is, over the lab itself
  drawLabMark();           // and a tick over it if it finished something
  drawCasinoMark();        // and which way the last hand at the table went
  drawKitStands();                                // and the kit put out ready at each of them
  drawRoster(ctx, drawBody, drawHat, drawCart);   // who is working here, under the place they work
  drawIntro();             // the two of them, or whoever is under the rock
  drawWorkers();
  drawSays();              // and what any of them stood about is saying
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

  // And then, only under `vite dev` and only if somebody has switched one on, a
  // filter held in front of the finished frame. `dev.js` installs this; a
  // production build never sets it, so this is one property read a frame.
  if (window.__fx) window.__fx(canvas, P * S.zoom * S.dpr);
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
// and a six-pixel ring in a bed of grey speckle is a grain that happens to be
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
