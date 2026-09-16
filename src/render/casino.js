// The casino: the building that is the machine, read top to bottom. The hopper
// on the roof with the stake standing in it, the floor that splits when you let
// go, the sign across the front with its chase of lights, the white face knocked
// out of the block with the pegs standing in it and the handful falling through
// them, the bins with their pay written under them, and the foot the pay
// falls through and out of.
// Owns drawCasino, drawPotPile, drawSparks, casinoMarkAt, drawCasinoMark and
// the glyphs. The shared primitives (ctx, drawGrid, drawMark, withRise, rising)
// come from ./ctx.js, ./ground.js, ./marks.js and ./rise.js.

import { fieldAt, hasPeg, pegRow, busy, mayFlash, shownPays, shownChange, payingBin, binLeft, slotW, PEBBLE, hopperN, hatchOpen } from '../casino.js';
import { shown } from '../tween.js';
import { now } from '../clock.js';
import { FIND_COLOR, P, SHADES, SHARD_CELL, SPORE_CELL, SPARK_CELL, TABLE_LIFE, findKind,
         HOPPER_H, HOPPER_PROFILE, GATE_H, GATE_W, CASINO_SIGN_H, FIELD_H, BIN_H, LABEL_H, FOOT_H,
         BOARD_COLS, CASINO_MARGIN, CASINO_PEG_ROWS, CASINO_BINS, CASINO_GATE_MS,
         CASINO_WIN_MS, CASINO_STROBE_MS, CASINO_DARK_MS, CASINO_RELIGHT_MS,
         CASINO_CHASE_MS, CASINO_CHASE_LIVE_MS, CASINO_EDGE_STROBE_MS, CASINO_FLASH_MS, CASINO_PEG_BEAT_MS } from '../config.js';
import { S, casino, table } from '../state.js';
import { LEVERS, leverAt, leverShape } from '../levers.js';
import { ARM_LENGTH, ARM_BOSS, MARK_CELLS, DIGIT_H, BUTTON_PRESS_MS,
         SIGN_SWAP_MS, SIGN_CHASE_MIN_MS, SIGN_CHASE_MAX_MS, SIGN_FLASH_MS, SIGN_READY_STEP_MS, SIGN_READY_LIGHTS, SIGN_FLASH_FACE } from '../config.js';
import { fmt } from '../words.js';
import { at } from '../grid.js';
import { ctx } from './ctx.js';
import { drawGrid } from './ground.js';
import { rising as risingAt, withRise } from './rise.js';

// --- the sign -----------------------------------------------------------------
// The one place in this yard with writing on it, and it has earned it: every
// other building says what it is by being the shape it is -- a chimney, a row of
// plots, a hole in the ground -- and a casino says what it is by shouting. A sign
// is what the building *is* rather than a label somebody stuck on it.
//
// Seven cells across and five down, and every stroke one cell thick. Getting
// these right took several goes and every fault was the same fault in a
// different place: a stroke needs air around it or it is not a stroke. A C
// with its right-hand stem standing at the top and bottom rows is an O with a
// bite out of it; an N's diagonal has to run corner to corner and touch both
// stems; and the letters stand a clear cell from each other and from the
// bulbs, which is why the board is wider than the building.
const GLYPH = {
  C: ['0111110', '1000000', '1000000', '1000000', '0111110'],
  A: ['0111110', '1000001', '1111111', '1000001', '1000001'],
  S: ['0111111', '1000000', '0111110', '0000001', '1111110'],
  I: ['1111111', '0001000', '0001000', '0001000', '1111111'],
  N: ['1100001', '1010001', '1001001', '1000101', '1000011'],
  O: ['0111110', '1000001', '1000001', '1000001', '0111110'],
  // and the figures, in the same stroke, for the stake standing in the
  // funnel ("The pour": the sign says the stake); 'k' and 'm' for a big one
  '0': ['0111110', '1000001', '1000001', '1000001', '0111110'],
  '1': ['0001000', '0011000', '0001000', '0001000', '0111110'],
  '2': ['0111110', '0000001', '0111110', '1000000', '1111111'],
  '3': ['1111110', '0000001', '0111110', '0000001', '1111110'],
  '4': ['1000001', '1000001', '1111111', '0000001', '0000001'],
  '5': ['1111111', '1000000', '1111110', '0000001', '1111110'],
  '6': ['0111110', '1000000', '1111110', '1000001', '0111110'],
  '7': ['1111111', '0000001', '0000010', '0000100', '0001000'],
  '8': ['0111110', '1000001', '0111110', '1000001', '0111110'],
  '9': ['0111110', '1000001', '0111111', '0000001', '0111110'],
  '.': ['0000000', '0000000', '0000000', '0000000', '0001000'],
  // and the words the ready sign flashes: DROP IT
  T: ['1111111', '0001000', '0001000', '0001000', '0001000'],
  D: ['1111100', '1000010', '1000001', '1000010', '1111100'],
  R: ['1111110', '1000001', '1111110', '1001000', '1000110'],
  P: ['1111110', '1000001', '1111110', '1000000', '1000000'],
  ' ': ['000', '000', '000', '000', '000'],
  'k': ['1000010', '1001100', '1110000', '1001100', '1000010'],
  'm': ['0000000', '0000000', '1101100', '1010010', '1000010']
};
const WORD = 'CASINO';
const GLYPH_H = 5, GLYPH_W = 7, GLYPH_GAP = 1, SIGN_PAD = 2;
// Across the front in one word, the building's own width. Six letters and
// five gaps come to forty-seven cells, one more than can center on a building
// an even number of cells wide -- so the gap in the middle of the word is two,
// and the handful falls through it; the rest of the width is air either side.
const MID_GAP = 2;
const SIGN_MIN = WORD.length * GLYPH_W + (WORD.length - 1) * GLYPH_GAP + (MID_GAP - GLYPH_GAP) + SIGN_PAD * 2;
const SIGN_W = Math.max(SIGN_MIN, BOARD_COLS + CASINO_MARGIN * 2);
const signX = () => casino.x + casino.w / 2 - (SIGN_W * P) / 2;
const signY = () => casino.y + (HOPPER_H + GATE_H) * P;

// What the sign says: CASINO, or the stake standing in the funnel -- from
// the first poured pebble until the drop, rolling through the counter tween
// so it climbs under the hand and runs down as the pile drains.
// The sign's state: idle (CASINO), pouring (the arm held, the count
// climbing), ready (a stake standing, the arm let go), or draining (the
// floor open, the count running down).
function signState() {
  const standing = S.pot && (S.pouring || S.drop || S.holding || hopperN() > 0);
  if (!standing) return 'idle';
  if (S.drop) return 'draining';
  if (S.holding || S.pouring) return 'pouring';
  return 'ready';
}
function signWord() {
  const state = signState();
  if (state === 'idle') return { word: WORD, gap: true, state };
  // ready, the sign flashes between the count and the words, on the beat
  const face = SIGN_FLASH_FACE ?? Math.floor(now() / SIGN_FLASH_MS) % 2;
  if (state === 'ready' && face) return { word: 'DROP IT', gap: false, state };
  // the count is the stake as held -- what has been committed, in the bowl
  // or on its way -- and, draining, what is left of it in the bowl
  const d = S.drop;
  const n = d ? S.pot.stake * hopperN() / Math.max(1, d.hopperAt || hopperN()) : S.pot.stake;
  return { word: fmt(Math.round(shown('casino:sign', n))), gap: false, state };
}

function drawSign() {
  const x = signX(), w = SIGN_W, h = CASINO_SIGN_H;
  const { word, gap, state } = signWord();
  // With a count on it the sign is the drop button -- the marquee says so
  // -- and a tap presses the board down for a beat: a cell lower, the
  // figures grey. Reading CASINO it lies flat and is nothing to press.
  const ready = state === 'ready';
  const pressed = ready && now() - (S.signPressed || -Infinity) < BUTTON_PRESS_MS;
  const y = signY() + (pressed ? P : 0);

  // the board itself: white paper with a black edge, like everything else here
  ctx.fillStyle = '#fff';
  ctx.fillRect(x, y, w * P, h * P);
  ctx.lineWidth = Math.max(1, P / 3);
  ctx.strokeStyle = '#000';
  ctx.strokeRect(x, y, w * P, h * P);

  // the word, along the board, centered; the mid gap is the word's, and
  // a number stands on the gaps alone
  ctx.fillStyle = pressed ? PEG_SHADE : '#000';
  const glyphW = ch => GLYPH[ch][0].length;
  const wordCells = word.split('').reduce((n, ch) => n + glyphW(ch), 0) + (word.length - 1) * GLYPH_GAP + (gap ? MID_GAP - GLYPH_GAP : 0);
  let left = Math.floor((SIGN_W - wordCells) / 2);
  word.split('').forEach((ch, n) => {
    const rows = GLYPH[ch];
    for (let r = 0; r < GLYPH_H; r++)
      for (let c = 0; c < rows[r].length; c++)
        if (rows[r][c] === '1') ctx.fillRect(x + (left + c) * P, y + (SIGN_PAD + r) * P, P, P);
    left += glyphW(ch) + (gap && n === word.length / 2 - 1 ? MID_GAP : GLYPH_GAP);
  });

  // and the lights, walking round the edge. A whole cell at a time, like
  // everything that moves in this game: a bulb is on or it is off. The chase
  // quickens for the whole of a hand, from the chip going down to the tray
  // standing, so the machine is visibly awake.
  //
  // Unless something has just happened. A win puts every bulb on a strobe for a
  // couple of seconds, and so does a grain reaching a x39 the second it lands;
  // a dud puts the whole board out and then brings the bulbs back one at a time
  // round the ring, and the chase picks up among the ones that are back. None
  // of it under reduced motion: the chase keeps its step and nothing flashes.
  // ...and, under "The pour", the marquee carries the state: idle, every
  // other bulb swapping on a slow beat; pouring or draining, a run chasing
  // round with the dust, a step a grain; ready, two runs chasing against
  // each other under the count and every bulb on under the words ('twin'),
  // or all on with a sparkle dropping out ('sparkle').
  const t = now();
  const chasing = state === 'pouring' || state === 'draining';
  const stepMs = chasing ? Math.max(SIGN_CHASE_MIN_MS, Math.min(SIGN_CHASE_MAX_MS, 1000 / Math.max(0.001, grainsASecond(t))))
    : state === 'ready' ? SIGN_READY_STEP_MS : busy() ? CASINO_CHASE_LIVE_MS : CASINO_CHASE_MS;
  const step = chaseStep(t, stepMs);
  const swap = Math.floor(t / SIGN_SWAP_MS) % 2;
  const words = state === 'ready' && (SIGN_FLASH_FACE ?? Math.floor(t / SIGN_FLASH_MS) % 2);
  const age = S.hand ? t - S.hand.at : Infinity;
  const edgeAge = t - (S.tableFx.strobeAt || -Infinity);
  const strobe = mayFlash() && ((S.hand?.won && age < CASINO_WIN_MS) ||
                                (edgeAge >= 0 && edgeAge < CASINO_EDGE_STROBE_MS));
  const lit = mayFlash() && S.hand && S.hand.won === false
    ? Math.max(0, Math.floor((age - CASINO_DARK_MS) / CASINO_RELIGHT_MS)) : Infinity;
  ringCells(w, h).forEach(([cx, cy], i) => {
    if (strobe) { if (Math.floor(t / CASINO_STROBE_MS) % 2) return; }
    else if (i >= lit) return;
    else if (state === 'idle') { if ((i + swap) % 2) return; }
    else if (state === 'ready') {
      if (SIGN_READY_LIGHTS === 'sparkle') { if (sparkleOut(i, step)) return; }
      else if (!words && (i + step) % CHASE_EVERY && (i - step + 1e6) % CHASE_EVERY) return;
    }
    else if (chasing && (i + step) % CHASE_EVERY) return;
    ctx.fillRect(x + cx * P, y + cy * P, P, P);
  });
}
const CHASE_EVERY = 4;           // how many dark bulbs stand between the lit

// The chase's step is counted, not read off the clock, so a step that
// changes length with the dust runs on rather than jumping.
let chaseAt = 0, chaseN = 0;
function chaseStep(t, ms) {
  if (t - chaseAt >= ms) { chaseN += Math.floor((t - chaseAt) / ms); chaseAt = t; }
  return chaseN;
}
// How fast the dust is moving through the funnel: grains landing in the
// bowl a second while pouring, grains leaving it a second while draining,
// read off the bowl's count between frames and smoothed a little.
let rateAt = 0, rateN = 0, rate = 0;
function grainsASecond(t) {
  const n = hopperN();
  if (rateAt && t > rateAt) {
    const r = Math.abs(n - rateN) / ((t - rateAt) / 1000);
    rate = rate * 0.8 + r * 0.2;
  }
  rateAt = t; rateN = n;
  return rate;
}
// a bulb out this step, for the sparkle: about one in four, by a hash of
// the bulb and the step so it holds for the step and moves on the next
const sparkleOut = (i, step) => ((i * 2654435761 + step * 40503) >>> 0) % 4 === 0;
const PEG_SHADE = SHADES[0];     // a peg: the lightest grey the yard has, so a grain reads over it
const TRAIL_SHADES = [SHADES[3], SHADES[0]];   // the last two cells a falling grain left, nearest first
const PEG_HIT = 'plain';          // how a peg shows a hit: 'ring' or 'plain'

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

// --- the digits -----------------------------------------------------------------
// What a bin pays, and what a hand came to: three cells across and five down,
// the smallest face a digit reads in. A three-cell glyph sits under a
// three-cell slot exactly, which is why a bin is the width it is.
const DIGIT = {
  '0': ['111', '101', '101', '101', '111'],
  // a one is a stroke: with a foot it was three cells, and "1.5" with air
  // each side wanted a slot of eleven; as a stroke the widest pay is seven
  '1': ['1', '1', '1', '1', '1'],
  '2': ['111', '001', '111', '100', '111'],
  '3': ['111', '001', '111', '001', '111'],
  '4': ['101', '101', '111', '001', '001'],
  '5': ['111', '100', '111', '001', '111'],
  '6': ['111', '100', '111', '101', '111'],
  '7': ['111', '001', '001', '001', '001'],
  '8': ['111', '101', '111', '101', '111'],
  '9': ['111', '101', '111', '001', '111'],
  // the point in ".5": on the baseline, a cell wide. A half-filled box was
  // tried at this size and read as a zero, which on a bin is the one thing it
  // must not say.
  '.': ['0', '0', '0', '0', '1'],

  // up or down, before the change
  '+': ['000', '010', '111', '010', '000'],
  '-': ['000', '000', '111', '000', '000']
};
const glyphRows = ch => DIGIT[ch];
const digitW = ch => glyphRows(ch)[0].length;

function drawDigit(ch, x, y) {
  const rows = glyphRows(ch);
  for (let r = 0; r < DIGIT_H; r++)
    for (let c = 0; c < rows[r].length; c++)
      if (rows[r][c] === '1') ctx.fillRect(x + c * P, y + r * P, P, P);
}
// A number along a row, a cell of air between digits; and its width in cells.
const wordW = s => s.split('').reduce((w, ch) => w + digitW(ch), 0) + s.length - 1;
function drawWord(s, x, y) {
  let c = 0;
  for (const ch of s) { drawDigit(ch, x + c * P, y); c += digitW(ch) + 1; }
}

// --- the bins' pay --------------------------------------------------------------
// What each bin pays, in the bin's own foot: the dividers run on down through
// the band, so it is a row of table cells, one under each bin, and a pay can
// only be read as belonging to the bin over it. A digit is three cells and an
// inner slot is three; the edge bins' 39 is seven, and their slots are cut
// that wide for it. The half bins each wear their own half, in one glyph.
const LABEL_ROW = 2;                                     // under the floor line and a clear row
// A half is ".5" with its point a clear cell from the five, which is why an
// inner slot is five cells: ".5" squeezed into three read as a six, and a one
// over a two in five by five read as a W.
const labelOf = m => m === 0.5 ? '.5' : String(m);      // 1.5 is '1.5': the point is a cell
// a foot's face: a coin's mark, or the multiple
const faceW = f => typeof f === 'string' ? MARK_CELLS : wordW(labelOf(f));

function drawLabels(fx, fy) {
  const top = fy + (FIELD_H + BIN_H) * P;
  const paying = payingBin();
  CASINO_BINS.forEach((m, b) => {
    const col = binLeft(b) + Math.floor((slotW(b) - faceW(m)) / 2);
    // the foot of the bin paying this beat goes white on black, so the eye is
    // led through the settlement from the middle outward
    if (b === paying) {
      ctx.fillStyle = '#000';
      ctx.fillRect(fx + binLeft(b) * P, top + P, slotW(b) * P, (LABEL_H - 2) * P);
      ctx.fillStyle = '#fff';
    } else ctx.fillStyle = '#000';
    // a converting bin's foot wears its coin's own color -- the tone the
    // purse counter and the sky's motes use for it -- lit or not
    if (typeof m === 'string') { ctx.fillStyle = coinTone(m); cells(MARK[m], fx + col * P, top + LABEL_ROW * P); }
    else drawWord(labelOf(m), fx + col * P, top + LABEL_ROW * P);
  });
  ctx.fillStyle = '#000';
}

// --- the building -------------------------------------------------------------
export function drawCasino() {
  const rising = risingAt('casino') && 'casino';
  if (!S.casinoOpen && !rising) return;
  const { x, y, w, h } = casino;
  withRise(rising, x, S.groundY, w, h, () => {
    const t = now();
    const f = fieldAt();

    // The block, from the hopper floor down. The hopper itself is the top of
    // the machine, open to the sky: two walls and the floor, with the heap
    // standing in it drawn by `drawPotPile` over the sky, because that is
    // where it stands.
    const hy = y;
    ctx.fillStyle = '#000';
    ctx.fillRect(x, hy + HOPPER_H * P, w, h - HOPPER_H * P);
    // The funnel: the walls step in a row at a time along `HOPPER_PROFILE`,
    // the building's own wall plus the inset, so the bowl the heap sits in is
    // the shape the sand rules see.
    HOPPER_PROFILE.forEach((inset, r) => {
      ctx.fillRect(x, hy + r * P, (1 + inset) * P, P);
      ctx.fillRect(x + w - (1 + inset) * P, hy + r * P, (1 + inset) * P, P);
    });

    // The floor, open: it splits from the middle over `CASINO_GATE_MS`, the
    // middle cell first and then the one either side, and the hole shows white
    // -- a way through, like every opening in this yard. It stays open for the
    // hand and shuts when the last bin has paid.
    if (S.drop) {
      const k = Math.min(1, (t - S.drop.at) / Math.max(1, CASINO_GATE_MS));
      const open = 1 + 2 * Math.round(k * (GATE_W - 1) / 2);
      ctx.fillStyle = '#fff';
      ctx.fillRect(x + w / 2 - (open * P) / 2, hy + HOPPER_H * P, open * P, GATE_H * P);
    }

    drawSign();

    // The face: a white board knocked out of the block, the way the wheel's
    // disc was, a wall in from each side, running from the air the stream fans
    // in down through the pegs and the bins to their feet.
    ctx.fillStyle = '#fff';
    ctx.fillRect(x + P, f.y, w - 2 * P, (FIELD_H + BIN_H + LABEL_H) * P);

    // The pegs: row k has k + 1 of them, one under each seat a grain can reach,
    // so the odds are the picture. A mid grey, not black: the falling grains
    // are the figure and the pegs are the ground, and black pegs under black
    // grains made a stream that vanished into the triangle. A peg on the beat
    // is a hit: it throws a spark -- its four corners lit black for a frame or
    // two -- with the grain sitting black on top of it.
    ctx.fillStyle = PEG_SHADE;
    for (let k = 0; k < CASINO_PEG_ROWS; k++)
      for (let c = 0; c < BOARD_COLS; c++)
        if (hasPeg(k, c)) ctx.fillRect(f.x + c * P, f.y + pegRow(k) * P, P, P);
    ctx.fillStyle = '#000';
    // A peg on the beat rings: it swells from its grey dot to a hollow ring
    // three cells across -- black outline, white center -- and back. A ring
    // cannot be mistaken for a grain, and in the field the falling grains are
    // the only black things that move. (`PEG_HIT` 'plain' is the other
    // candidate, the peg going black for the beat; see DESIGN.md.)
    if (mayFlash()) {
      for (const p of S.tableFx.pegs || []) {
        if (t - p.at >= CASINO_PEG_BEAT_MS) continue;
        const px = f.x + p.c * P, py = f.y + p.r * P;
        if (PEG_HIT === 'ring') {
          ctx.fillStyle = '#000';
          ctx.fillRect(px - P, py - P, 3 * P, 3 * P);
          ctx.fillStyle = '#fff';
          ctx.fillRect(px, py, P, P);
        } else {
          ctx.fillStyle = '#000';
          ctx.fillRect(px, py, P, P);
        }
      }
      ctx.fillStyle = '#000';
    }

    // The bins: eleven slots with a cell of wall between, the dividers running
    // on down through the feet the pays are written in, a floor line between
    // slot and foot, and the feet's rim under the lot. A x39 bin goes black for
    // a beat when a grain lands in it -- and, without the sound, when a grain
    // one coin off falls inward instead.
    const binTop = f.y + FIELD_H * P, footTop = binTop + BIN_H * P;
    const e = S.tableFx.edge;
    if (e && mayFlash() && t - e.at < CASINO_FLASH_MS) {
      ctx.fillStyle = '#000';
      ctx.fillRect(f.x + binLeft(e.side) * P, binTop, slotW(e.side) * P, BIN_H * P);
    }
    // The dividers are a cell through the bins and a rule through the feet: a
    // three-cell digit in a three-cell foot has no air from a cell-wide wall,
    // and a digit touching the wall on both sides is a barcode.
    ctx.fillStyle = '#000';
    const rule = Math.max(1, P / 3), footH = (LABEL_H - 1) * P;
    const divider = cx => {
      ctx.fillRect(cx, binTop, P, BIN_H * P);
      ctx.fillRect(cx + (P - rule) / 2, footTop, rule, footH);
    };
    divider(f.x - P);
    for (let b = 0; b < CASINO_BINS.length; b++) divider(f.x + (binLeft(b) + slotW(b)) * P);
    // the floor line and the feet's rim run the width of the field, not
    // the front: past the outer bins the front is the block's face
    ctx.fillRect(f.x - P, footTop, (BOARD_COLS + 2) * P, P);
    ctx.fillRect(f.x - P, footTop + (LABEL_H - 1) * P, (BOARD_COLS + 2) * P, P);

    drawLabels(f.x, f.y);

    // and the foot: a white room in the block under the bins, a wall in from
    // each side, that the pay falls through
    const footY = y + h - FOOT_H * P;
    ctx.fillStyle = '#fff';
    ctx.fillRect(x + P, footY, w - 2 * P, FOOT_H * P);

    // The foot's hatch, open while the pay goes out of it on to the ground:
    // white, a way through like every opening here.
    if (hatchOpen()) { ctx.fillStyle = '#fff'; ctx.fillRect(x, footY + (FOOT_H - 3) * P, P, 3 * P); }
    // The arm on the wall beside the funnel: black while it can be held
    // (and while it is), grey when it cannot.
    for (const l of LEVERS) drawControl(l);
    ctx.fillStyle = '#000';
  });
}

// --- the feet's marks --------------------------------------------------------------
// The coins' marks at five cells, for the converting bins' feet: the plots'
// hexagon, the quarry's triangle, the core's four-point spark -- the
// counter's own shapes.
const COIN_CELL = { spore: SPORE_CELL, shard: SHARD_CELL, spark: SPARK_CELL };
const coinTone = kind => FIND_COLOR[COIN_CELL[kind]][0];
const MARK = {
  spore: ['01110', '11111', '11111', '11111', '01110'],
  shard: ['00100', '00100', '01110', '01110', '11111'],
  spark: ['00100', '01110', '11111', '01110', '00100']
};
function cells(rows, x0, y0) {
  rows.forEach((row, r) => {
    for (let c = 0; c < row.length; c++) if (row[c] === '1') ctx.fillRect(x0 + c * P, y0 + r * P, P, P);
  });
}

// A round knob on the grid: a square of `n` cells with its corners knocked
// off, centered on a cell.
function knob(cx, cy, n) {
  const x0 = Math.round(cx / P) * P - Math.floor(n / 2) * P, y0 = Math.round(cy / P) * P - Math.floor(n / 2) * P;
  for (let r = 0; r < n; r++)
    for (let c = 0; c < n; c++) {
      const corner = (c === 0 || c === n - 1) && (r === 0 || r === n - 1);
      if (n > 2 && corner) continue;
      ctx.fillRect(x0 + c * P, y0 + r * P, P, P);
    }
}

function drawControl(l) {
  const { x, y, dir, wall } = leverAt(l);
  const shape = leverShape(l);
  const ink = shape.live ? '#000' : PEG_SHADE;
  ctx.fillStyle = ink;
  ctx.strokeStyle = ink;
  // the arm turns about a boss out from the wall: the stem swings from
  // straight up, the ball leading
  const reach = ARM_LENGTH * P;
  const a = Math.PI / 2 - shape.angle;
  const ex = x + dir * Math.cos(a) * reach, ey = y - Math.sin(a) * reach;
  ctx.fillRect(Math.min(wall, x), y - P, ARM_BOSS * P, P * 2);
  knob(x, y, 2);
  ctx.lineWidth = P;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(ex, ey);
  ctx.stroke();
  knob(ex, ey, 3);
  ctx.fillStyle = '#000';
}

// --- the sand -------------------------------------------------------------------
// The hopper is a real plot of sand, so it is blitted like the yard and the
// hole rather than drawn a grain at a time. The bins are plots too, but a few
// dozen cells each, so they and the handful on the pegs are drawn straight,
// cell for cell in the grain's own shade.
const shadeOf = s => {
  const find = findKind(s);
  return find ? FIND_COLOR[find][s - find] : SHADES[Math.min(SHADES.length, s) - 1];
};

export function drawPotPile() {
  if (!S.casinoOpen) return;
  if (table.grid && table.n) drawGrid(table);
  const f = fieldAt();
  const grains = S.drop ? S.drop.grains : [];
  const demo = S.attract?.grain;
  // A falling grain is the figure: solid black, one cell, with the cell it
  // just left behind it in a lighter shade -- the yard's idiom for a thing in
  // motion -- so the stream reads from across the yard. Its own shade waits
  // for the bin.
  // A pebble is a two-by-two block -- the boulder's own shape, the drop's rock
  // at a smaller scale -- standing on its cell with its left half over the
  // peg, so sixteen of them read as sixteen things falling rather than a thin
  // stream.
  const pebble = (c, r) => ctx.fillRect(f.x + c * P, f.y + (r - PEBBLE + 1) * P, PEBBLE * P, PEBBLE * P);
  for (const g of demo ? [...grains, demo] : grains) {
    if (g.landed) continue;
    g.trail.forEach(([c, r], i) => { ctx.fillStyle = TRAIL_SHADES[i]; pebble(c, r); });
    ctx.fillStyle = '#000';
    pebble(g.c, g.r);
  }
  if (S.drop) {
    S.drop.bins.forEach((bin, b) => {
      if (!bin.n) return;
      for (let c = 0; c < bin.cols; c++)
        for (let r = 0; r < bin.rows; r++) {
          const s = at(bin, c, r);
          if (!s) continue;
          ctx.fillStyle = shadeOf(s);
          ctx.fillRect(f.x + (binLeft(b) + c * PEBBLE) * P, f.y + (FIELD_H + BIN_H - (r + 1) * PEBBLE) * P, PEBBLE * P, PEBBLE * P);
        }
    });
  }
  ctx.fillStyle = '#000';
}

export function drawSparks() {
  for (const k of S.tableAir) {
    // A grain on its way out of the game fades as it goes. Everything else in
    // this yard either is somewhere or is not; this is the one thing that is
    // *leaving*, and it should look like it rather than blinking off.
    if (k.fade) ctx.globalAlpha = Math.max(0, 1 - k.t / TABLE_LIFE);
    ctx.fillStyle = shadeOf(k.s);
    const d = k.big ? P * 2 : P;               // a hand's confetti is two cells a square
    ctx.fillRect(Math.round(k.x), Math.round(k.y), d, d);
    ctx.globalAlpha = 1;
  }
  ctx.fillStyle = '#000';
}

// --- what the hand came to ----------------------------------------------------------
// What was won, by kind, standing beside the foot: a line a coin -- the
// coin's mark in its color and the count -- for the kinds that paid and no
// other, and under them the change against the stake, up or down; all
// counting up as the bins pay and then standing for a few seconds, so a
// board you were not watching still tells you how it went and what it cost.
// No multiple: a multiple is a number about the bet, and what you see is
// what landed on the ground. A box wide enough for its words, in the same
// paper-and-edge as the lab's tick.
const changeText = d => (d < 0 ? '-' : '+') + String(Math.abs(d));
const PAY_LINES = ['dust', 'spore', 'shard', 'spark'];

// Its left edge two cells clear of the building's wall, above the foot, so
// the box grows away from the building rather than into it.
export function casinoMarkAt() {
  return { x: Math.round((casino.x + casino.w + P * 2) / P) * P,
           y: Math.round((casino.y + casino.h - FOOT_H * P - P * 9) / P) * P };
}

export function drawCasinoMark() {
  if (!S.casinoOpen) return;
  const pays = shownPays();
  if (!pays) return;
  const lines = PAY_LINES.filter(k => pays[k] > 0).map(k => ({ kind: k, text: String(Math.round(pays[k])) }));
  const change = changeText(shownChange());
  const at = casinoMarkAt();
  const y = at.y + Math.round(Math.sin(now() / 500)) * P;
  // a mark, a cell of air, the count; the change line under the lot
  const w = 1 + Math.max(change.length ? wordW(change) : 0, ...lines.map(l => MARK_CELLS + 1 + wordW(l.text))) + 1;
  const h = (lines.length + 1) * (DIGIT_H + 1) + 1;
  const left = at.x, top = y - Math.floor(h / 2) * P;

  ctx.fillStyle = '#fff';
  ctx.fillRect(left, top, w * P, h * P);
  ctx.lineWidth = Math.max(1, P / 3);
  ctx.strokeStyle = '#000';
  ctx.strokeRect(left, top, w * P, h * P);
  lines.forEach((l, i) => {
    const ly = top + (1 + i * (DIGIT_H + 1)) * P;
    if (l.kind === 'dust') {
      // a pebble is the counter's square: three cells, black
      ctx.fillStyle = '#000';
      ctx.fillRect(left + 2 * P, ly + P, 3 * P, 3 * P);
    } else {
      ctx.fillStyle = coinTone(l.kind);
      cells(MARK[l.kind], left + P, ly);
    }
    ctx.fillStyle = '#000';
    drawWord(l.text, left + (1 + MARK_CELLS + 1) * P, ly);
  });
  ctx.fillStyle = '#000';
  drawWord(change, left + P, top + (1 + lines.length * (DIGIT_H + 1)) * P);
}
