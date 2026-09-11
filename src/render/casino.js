// The casino: the building that is the machine. The tray on the roof with the
// stake standing in it, the sign across the top of the face, the white board
// knocked out of the block with the pegs and the slot walls standing in it, and
// the slots' rates written along the foot. Owns drawCasino, drawPotPile,
// drawSparks, casinoMarkAt, drawCasinoMark and the sign's glyphs. The shared
// primitives (ctx, drawGrid, drawMark, withRise, rising) come from ./ctx.js,
// ./ground.js, ./marks.js and ./rise.js.

import { potAt, PEGS, slot, gateCols, rateOf } from '../casino.js';
import { now } from '../clock.js';
import { FIND_COLOR, P, SHADES, SHARD_CELL, SPORE_CELL, TABLE_LIFE, findKind,
         CASINO_SIGN_H, LABEL_H, SLOTS, SLOT_W, SLOT_PITCH, SLOT_RATES } from '../config.js';
import { S, casino, table, board } from '../state.js';
import { ctx } from './ctx.js';
import { drawGrid } from './ground.js';
import { drawMark } from './marks.js';
import { drawMarkBox } from './donemarks.js';
import { rising as risingAt, withRise } from './rise.js';

// --- the sign -----------------------------------------------------------------
// The one place in this yard with writing on it, and it has earned it: every
// other building says what it is by being the shape it is -- a chimney, a row of
// plots, a hole in the ground -- and a casino says what it is by shouting. A sign
// is what the building *is* rather than a label somebody stuck on it.
//
// Seven cells across and five down, and every stroke one cell thick. A stroke
// needs air around it or it is not a stroke: the letters sit a clear cell in
// from the bulbs and a clear cell from each other.
const GLYPH = {
  // A C is a ring with a side missing, so the side has to be *missing*.
  C: ['0111110', '1000000', '1000000', '1000000', '0111110'],
  A: ['0111110', '1000001', '1111111', '1000001', '1000001'],
  S: ['0111111', '1000000', '0111110', '0000001', '1111110'],
  I: ['1111111', '0001000', '0001000', '0001000', '1111111'],
  // and an N is two stems and one unbroken diagonal between them, corner to corner
  N: ['1100001', '1010001', '1001001', '1000101', '1000011'],
  O: ['0111110', '1000001', '1000001', '1000001', '0111110']
};
const WORD = 'CASINO';
const GLYPH_H = 5, GLYPH_W = 7, GLYPH_GAP = 1, SIGN_PAD = 1;
const CHASE_MS = 130;            // how fast a light walks round the border
const CHASE_EVERY = 4;           // and how many dark ones stand between the lit

// Across the top of the face, between the tray and the board, with a cell of
// the block above it for the gate to cut through and a cell below.
function drawSign() {
  const w = WORD.length * GLYPH_W + (WORD.length - 1) * GLYPH_GAP + SIGN_PAD * 2;
  const h = GLYPH_H + SIGN_PAD * 2;
  const x = Math.round((casino.x + casino.w / 2 - (w * P) / 2) / P) * P;
  const y = casino.y + P;

  // the board itself: white paper with a black edge, like everything else here
  ctx.fillStyle = '#fff';
  ctx.fillRect(x, y, w * P, h * P);
  ctx.lineWidth = Math.max(1, P / 3);
  ctx.strokeStyle = '#000';
  ctx.strokeRect(x, y, w * P, h * P);

  ctx.fillStyle = '#000';
  WORD.split('').forEach((ch, n) => {
    const rows = GLYPH[ch];
    const left = SIGN_PAD + n * (GLYPH_W + GLYPH_GAP);
    for (let r = 0; r < GLYPH_H; r++)
      for (let c = 0; c < GLYPH_W; c++)
        if (rows[r][c] === '1') ctx.fillRect(x + (left + c) * P, y + (SIGN_PAD + r) * P, P, P);
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

// --- the slots' rates ---------------------------------------------------------
// Three cells wide, five tall, stacked down the label band under each slot the
// way the old roof sign stacked its letters: a slot is three cells wide and a
// two-digit rate is seven, so it goes down rather than across. A point between
// two digits is one row with a dot in it.
const DIGIT = {
  '0': ['111', '101', '101', '101', '111'],
  '1': ['010', '110', '010', '010', '111'],
  '2': ['111', '001', '111', '100', '111'],
  '3': ['111', '001', '111', '001', '111'],
  '4': ['101', '101', '111', '001', '001'],
  '5': ['111', '100', '111', '001', '111'],
  '6': ['111', '100', '111', '101', '111'],
  '7': ['111', '001', '001', '001', '001'],
  '8': ['111', '101', '111', '101', '111'],
  '9': ['111', '101', '111', '001', '111'],
  '.': ['010']
};
const DIGIT_W = 3;
const rateGlyphs = m => String(m).split('');
// a cell of air after each glyph, except the point, which is its own air
const after = ch => DIGIT[ch].length + (ch === '.' ? 0 : 1);
const stackH = g => g.reduce((h, ch) => h + after(ch), 0) - 1;

function drawStack(g, x, y) {
  let r0 = 0;
  for (const ch of g) {
    const rows = DIGIT[ch];
    for (let r = 0; r < rows.length; r++)
      for (let c = 0; c < DIGIT_W; c++)
        if (rows[r][c] === '1') ctx.fillRect(x + c * P, y + (r0 + r) * P, P, P);
    r0 += after(ch);
  }
}

// a cross, for a call the sand missed
const CROSS = [[-2, -2], [-1, -1], [0, 0], [1, 1], [2, 2],
               [2, -2], [1, -1], [-1, 1], [-2, 2]];

// The cells of a rate, for the mark box over the building: digits side by side
// with a cell of air, centered, in the box's own offset form.
export function rateMark(m) {
  const g = rateGlyphs(m);
  const w = g.reduce((n, ch) => n + (ch === '.' ? 1 : DIGIT_W), 0) + (g.length - 1);
  const cells = [];
  let c0 = 0;
  for (const ch of g) {
    const rows = ch === '.' ? ['0', '0', '0', '0', '1'] : DIGIT[ch];
    const cw = ch === '.' ? 1 : DIGIT_W;
    for (let r = 0; r < 5; r++)
      for (let c = 0; c < cw; c++)
        if (rows[r][c] === '1') cells.push([c0 + c - (w - 1) / 2, r - 2]);
    c0 += cw + 1;
  }
  return cells;
}

// --- the building -------------------------------------------------------------
export function drawCasino() {
  const rising = risingAt('casino') && 'casino';
  if (!S.casinoOpen && !rising) return;
  const { x, y, w, h } = casino;
  withRise(rising, x, S.groundY, w, h + table.rows * P, () => {
    ctx.fillStyle = '#000';
    ctx.fillRect(x, y, w, h);                                // the block

    // The tray on the roof: a wall each side, the roof for a floor. The heap
    // in it is drawn by `drawPotPile`, over the sky, because that is where it
    // stands.
    ctx.fillRect(x, table.y, P, casino.y - table.y);
    ctx.fillRect(x + w - P, table.y, P, casino.y - table.y);

    // The hole in the floor, where the sand is going through: white cells cut
    // out of the roof's top row, as wide as the tear has spread.
    ctx.fillStyle = '#fff';
    for (const c of gateCols()) ctx.fillRect(table.x + c * P, y, P, P);

    drawSign();

    // The face: a white board knocked out of the block, the way the wheel was a
    // white disc, with the pegs and the slot walls standing in it as black
    // cells. The sand on it is drawn by `drawPotPile`.
    ctx.fillStyle = '#fff';
    ctx.fillRect(board.x, board.y, board.cols * P, board.rows * P);
    ctx.fillStyle = '#000';
    const bottom = board.y + board.rows * P;
    for (const [c, r] of PEGS) ctx.fillRect(board.x + c * P, bottom - (r + 1) * P, P, P);

    // What each slot pays, under it, white on the block -- and the called slot
    // the other way about, a white box with the rate in black, so the call is
    // read off the building and not only off the row.
    const ly = bottom + P;
    for (let k = 0; k < SLOTS; k++) {
      const g = rateGlyphs(SLOT_RATES[k]);
      const sx = board.x + k * SLOT_PITCH * P;
      const called = k === slot();
      if (called) {
        ctx.fillStyle = '#fff';
        ctx.fillRect(sx, ly, SLOT_W * P, (LABEL_H - 2) * P);
      }
      ctx.fillStyle = called ? '#000' : '#fff';
      drawStack(g, sx, ly + Math.floor((LABEL_H - 2 - stackH(g)) / 2) * P);
    }
    ctx.fillStyle = '#000';
  });
}

// The pot is a real plot of sand -- see casino.js -- so it is blitted like the
// yard and the hole rather than drawn a grain at a time: the heap in the tray,
// and whatever is on the board.
export function drawPotPile() {
  if (!S.casinoOpen) return;
  if (table.grid && table.n) drawGrid(table);
  if (board.grid) drawGrid(board);
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

// How the last hand went, standing beside the tray for a few seconds. A board
// you were not watching still tells you: the rate it paid, in the slots' own
// digits, with what it came to under it -- or a cross, for a call the sand
// missed altogether.
export function casinoMarkAt() {
  return { x: Math.round((casino.x + casino.w + P * 6) / P) * P,
           y: Math.round((table.y + P * 5) / P) * P };
}

export function drawCasinoMark() {
  if (!S.casinoOpen || !S.hand) return;
  const at = casinoMarkAt();
  const y = at.y + Math.round(Math.sin(now() / 500)) * P;
  const won = S.hand.n > 0;

  drawMarkBox(at, y, won ? rateMark(S.hand.rate) : CROSS);

  // and what it came to, under the mark, in the mark of whatever was staked
  if (!won) return;
  drawMark(S.hand.cur === 'shard' ? SHARD_CELL : S.hand.cur === 'spore' ? SPORE_CELL : 4,
           at.x - P * 2, y + P * 5.5);
}
