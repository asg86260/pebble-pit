// The casino: the building that is the machine, read top to bottom. The hopper
// on the roof with the stake standing in it, the floor that splits when you let
// go, the sign across the front with its chase of lights, the white face knocked
// out of the block with the pegs standing in it and the handful falling through
// them, the bins with their pay written under them, and the tray at the foot.
// Owns drawCasino, drawPotPile, drawSparks, casinoMarkAt, drawCasinoMark and
// the glyphs. The shared primitives (ctx, drawGrid, drawMark, withRise, rising)
// come from ./ctx.js, ./ground.js, ./marks.js and ./rise.js.

import { fieldAt, hasPeg, pegRow, busy, mayFlash, shownMult, shownChange, shownCur, payingBin, binLeft, slotW } from '../casino.js';
import { now } from '../clock.js';
import { FIND_COLOR, P, SHADES, SHARD_CELL, SPORE_CELL, TABLE_LIFE, findKind,
         HOPPER_H, HOPPER_PROFILE, GATE_H, GATE_W, CASINO_SIGN_H, FIELD_H, BIN_H, LABEL_H, TRAY_H,
         BOARD_COLS, CASINO_MARGIN, CASINO_PEG_ROWS, CASINO_BINS, CASINO_GATE_MS,
         CASINO_WIN_MS, CASINO_STROBE_MS, CASINO_DARK_MS, CASINO_RELIGHT_MS,
         CASINO_CHASE_MS, CASINO_CHASE_LIVE_MS, CASINO_EDGE_STROBE_MS, CASINO_FLASH_MS, CASINO_PEG_BEAT_MS } from '../config.js';
import { S, casino, table, tray } from '../state.js';
import { at } from '../grid.js';
import { ctx } from './ctx.js';
import { drawGrid } from './ground.js';
import { drawMark } from './marks.js';
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
  O: ['0111110', '1000001', '1000001', '1000001', '0111110']
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

function drawSign() {
  const x = signX(), y = signY(), w = SIGN_W, h = CASINO_SIGN_H;

  // the board itself: white paper with a black edge, like everything else here
  ctx.fillStyle = '#fff';
  ctx.fillRect(x, y, w * P, h * P);
  ctx.lineWidth = Math.max(1, P / 3);
  ctx.strokeStyle = '#000';
  ctx.strokeRect(x, y, w * P, h * P);

  // the word, along the board, centered
  ctx.fillStyle = '#000';
  let left = (SIGN_W - SIGN_MIN) / 2 + SIGN_PAD;
  WORD.split('').forEach((ch, n) => {
    const rows = GLYPH[ch];
    for (let r = 0; r < GLYPH_H; r++)
      for (let c = 0; c < GLYPH_W; c++)
        if (rows[r][c] === '1') ctx.fillRect(x + (left + c) * P, y + (SIGN_PAD + r) * P, P, P);
    left += GLYPH_W + (n === WORD.length / 2 - 1 ? MID_GAP : GLYPH_GAP);
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
  const t = now();
  const step = Math.floor(t / (busy() ? CASINO_CHASE_LIVE_MS : CASINO_CHASE_MS));
  const age = S.hand ? t - S.hand.at : Infinity;
  const edgeAge = t - (S.tableFx.strobeAt || -Infinity);
  const strobe = mayFlash() && ((S.hand?.won && age < CASINO_WIN_MS) ||
                                (edgeAge >= 0 && edgeAge < CASINO_EDGE_STROBE_MS));
  const lit = mayFlash() && S.hand && S.hand.won === false
    ? Math.max(0, Math.floor((age - CASINO_DARK_MS) / CASINO_RELIGHT_MS)) : Infinity;
  ringCells(w, h).forEach(([cx, cy], i) => {
    if (strobe) { if (Math.floor(t / CASINO_STROBE_MS) % 2) return; }
    else if (i >= lit || (i + step) % CHASE_EVERY) return;
    ctx.fillRect(x + cx * P, y + cy * P, P, P);
  });
}
const CHASE_EVERY = 4;           // how many dark bulbs stand between the lit
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
  '1': ['010', '110', '010', '010', '111'],
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

  // times: the mark before a multiple; and up or down, before the change
  'x': ['000', '101', '010', '101', '000'],
  '+': ['000', '010', '111', '010', '000'],
  '-': ['000', '000', '111', '000', '000']
};
const DIGIT_H = 5;
const digitW = ch => DIGIT[ch][0].length;

function drawDigit(ch, x, y) {
  const rows = DIGIT[ch];
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
const labelOf = m => m === 0.5 ? '.5' : String(m);

function drawLabels(fx, fy) {
  const top = fy + (FIELD_H + BIN_H) * P;
  const paying = payingBin();
  CASINO_BINS.forEach((m, b) => {
    const word = labelOf(m);
    const col = binLeft(b) + (slotW(b) - wordW(word)) / 2;
    // the foot of the bin paying this beat goes white on black, so the eye is
    // led through the settlement from the middle outward
    if (b === paying) {
      ctx.fillStyle = '#000';
      ctx.fillRect(fx + binLeft(b) * P, top + P, slotW(b) * P, (LABEL_H - 2) * P);
      ctx.fillStyle = '#fff';
    } else ctx.fillStyle = '#000';
    drawWord(word, fx + col * P, top + LABEL_ROW * P);
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

    // The block, from the hopper floor down. The hopper itself is open to the
    // sky: two walls and the floor, with the heap standing in it drawn by
    // `drawPotPile` over the sky, because that is where it stands.
    ctx.fillStyle = '#000';
    ctx.fillRect(x, y + HOPPER_H * P, w, h - HOPPER_H * P);
    // The funnel: the walls step in a row at a time along `HOPPER_PROFILE`,
    // the building's own wall plus the inset, so the bowl the heap sits in is
    // the shape the sand rules see.
    HOPPER_PROFILE.forEach((inset, r) => {
      ctx.fillRect(x, y + r * P, (1 + inset) * P, P);
      ctx.fillRect(x + w - (1 + inset) * P, y + r * P, (1 + inset) * P, P);
    });

    // The floor, open: it splits from the middle over `CASINO_GATE_MS`, the
    // middle cell first and then the one either side, and the hole shows white
    // -- a way through, like every opening in this yard. It stays open for the
    // hand and shuts when the tray is paid.
    if (S.drop) {
      const k = Math.min(1, (t - S.drop.at) / Math.max(1, CASINO_GATE_MS));
      const open = 1 + 2 * Math.round(k * (GATE_W - 1) / 2);
      ctx.fillStyle = '#fff';
      ctx.fillRect(x + w / 2 - (open * P) / 2, y + HOPPER_H * P, open * P, GATE_H * P);
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
    // slot and foot, and the tray's rim under the lot. A x39 bin goes black for
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
    ctx.fillRect(x + P, footTop, w - 2 * P, P);
    ctx.fillRect(x + P, footTop + (LABEL_H - 1) * P, w - 2 * P, P);

    drawLabels(f.x, f.y);

    // and the tray, a white plot in the block's foot
    ctx.fillStyle = '#fff';
    ctx.fillRect(tray.x, tray.y, tray.cols * P, tray.rows * P);
    ctx.fillStyle = '#000';
  });
}

// --- the sand -------------------------------------------------------------------
// The two heaps are real plots of sand -- see casino.js -- so they are blitted
// like the yard and the hole rather than drawn a grain at a time. The bins are
// plots too, but a few dozen cells each, so they and the handful on the pegs
// are drawn straight, cell for cell in the grain's own shade.
const shadeOf = s => {
  const find = findKind(s);
  return find ? FIND_COLOR[find][s - find] : SHADES[Math.min(SHADES.length, s) - 1];
};

export function drawPotPile() {
  if (!S.casinoOpen) return;
  if (table.grid && table.n) drawGrid(table);
  if (tray.grid && tray.n) drawGrid(tray);
  const f = fieldAt();
  const grains = S.drop ? S.drop.grains : [];
  const demo = S.attract?.grain;
  // A falling grain is the figure: solid black, one cell, with the cell it
  // just left behind it in a lighter shade -- the yard's idiom for a thing in
  // motion -- so the stream reads from across the yard. Its own shade waits
  // for the bin.
  for (const g of demo ? [...grains, demo] : grains) {
    if (g.landed) continue;
    g.trail.forEach(([c, r], i) => {
      ctx.fillStyle = TRAIL_SHADES[i];
      ctx.fillRect(f.x + c * P, f.y + r * P, P, P);
    });
    ctx.fillStyle = '#000';
    ctx.fillRect(f.x + g.c * P, f.y + g.r * P, P, P);
  }
  if (S.drop) {
    S.drop.bins.forEach((bin, b) => {
      if (!bin.n) return;
      for (let c = 0; c < bin.cols; c++)
        for (let r = 0; r < bin.rows; r++) {
          const s = at(bin, c, r);
          if (!s) continue;
          ctx.fillStyle = shadeOf(s);
          ctx.fillRect(f.x + (binLeft(b) + c) * P, f.y + (FIELD_H + BIN_H - 1 - r) * P, P, P);
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
// The multiple and the change, standing beside the tray: "x0.8 -20" with the
// staked coin's mark, or "x1.3 +30" -- the multiple to a tenth, or whole past
// ten -- both counting up as the bins pay and then standing for a few seconds,
// so a board you were not watching still tells you how it went and what it
// cost. A box wide enough for its words, in the same paper-and-edge as the
// lab's tick.
const multText = m => m >= 10 ? String(Math.round(m)) : (Math.round(m * 10) / 10).toFixed(1);
const changeText = d => (d < 0 ? '-' : '+') + String(Math.abs(d));

// Its left edge two cells clear of the building's wall, beside the tray, so
// the box grows away from the building rather than into it.
export function casinoMarkAt() {
  return { x: Math.round((casino.x + casino.w + P * 2) / P) * P,
           y: Math.round((tray.y - P * 4) / P) * P };
}

export function drawCasinoMark() {
  if (!S.casinoOpen) return;
  const m = shownMult();
  if (m == null) return;
  const at = casinoMarkAt();
  const y = at.y + Math.round(Math.sin(now() / 500)) * P;
  const mult = 'x' + multText(m), change = changeText(shownChange());
  const cur = shownCur();
  // the multiple, two cells of air, the change, a cell, and the coin's mark
  const w = wordW(mult) + 2 + wordW(change) + 1 + 1 + 2, h = DIGIT_H + 2;
  const left = at.x, top = y - Math.floor(h / 2) * P;

  ctx.fillStyle = '#fff';
  ctx.fillRect(left, top, w * P, h * P);
  ctx.lineWidth = Math.max(1, P / 3);
  ctx.strokeStyle = '#000';
  ctx.strokeRect(left, top, w * P, h * P);
  ctx.fillStyle = '#000';
  drawWord(mult, left + P, top + P);
  const cx = left + (1 + wordW(mult) + 2) * P;
  drawWord(change, cx, top + P);
  drawMark(cur === 'shard' ? SHARD_CELL : cur === 'spore' ? SPORE_CELL : 4,
           cx + (wordW(change) + 1) * P + P / 2, top + P + (DIGIT_H * P) / 2);
}
