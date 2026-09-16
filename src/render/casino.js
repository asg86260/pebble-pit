// The casino: the building that is the machine, read top to bottom. The hopper
// on the roof with the stake standing in it, the floor that splits when you let
// go, the sign across the front with its chase of lights, the white face knocked
// out of the block with the pegs standing in it and the handful falling through
// them, the bins with their pay written under them, and the tray at the foot.
// Owns drawCasino, drawPotPile, drawSparks, casinoMarkAt, drawCasinoMark and
// the glyphs. The shared primitives (ctx, drawGrid, drawMark, withRise, rising)
// come from ./ctx.js, ./ground.js, ./marks.js and ./rise.js.

import { fieldAt, hasPeg, pegRow, busy, mayFlash, shownMult, BIN_COLS } from '../casino.js';
import { now } from '../clock.js';
import { FIND_COLOR, P, SHADES, SHARD_CELL, SPORE_CELL, TABLE_LIFE, findKind,
         HOPPER_H, HOPPER_PROFILE, GATE_H, GATE_W, CASINO_SIGN_H, FIELD_H, BIN_W, BIN_H, LABEL_H, TRAY_H,
         BOARD_COLS, CASINO_MARGIN, CASINO_PEG_ROWS, CASINO_BINS, CASINO_GATE_MS,
         CASINO_WIN_MS, CASINO_STROBE_MS, CASINO_DARK_MS, CASINO_RELIGHT_MS,
         CASINO_CHASE_MS, CASINO_CHASE_LIVE_MS, CASINO_EDGE_STROBE_MS, CASINO_FLASH_MS } from '../config.js';
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
// Across the front in one word. Six letters and five gaps come to forty-seven
// cells, which is one more than the board's inner width can center on a
// building an even number of cells wide -- so the gap in the middle of the
// word is two, and the handful falls through it.
const MID_GAP = 2;
const SIGN_W = WORD.length * GLYPH_W + (WORD.length - 1) * GLYPH_GAP + (MID_GAP - GLYPH_GAP) + SIGN_PAD * 2;
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

  // the word, along the board
  ctx.fillStyle = '#000';
  let left = SIGN_PAD;
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
const TRAIL_SHADE = SHADES[1];   // and the cell a falling grain just left

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
  // times: the mark before a multiple
  'x': ['000', '101', '010', '101', '000']
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
// What each bin pays, across in one line on a plaque under the bins -- the
// same boxed strip the sign is, and no bulbs. Eleven labels want to stand
// centered under their slots; two of them are seven cells and a slot is three,
// so they are settled: each starts at its own center and the row is pushed
// apart, two clear cells between neighbors -- one is the gap inside a number,
// and a row of pays a cell apart read as one long number -- and a clear cell
// from the plaque's edge, the middle held, until nothing touches. The plaque
// is as wide as that needs, never narrower than the sign, and stands proud of
// the block either side, so the ends spill out under the walls. The three half
// bins share one label under a bar spanning the three.
const PLAQUE_PAD = 1;                                    // a clear cell in from the edge
const LABEL_GAP = 2;                                     // clear cells between labels
const LABEL_ROW = 2;                                     // a clear row and the bracket's above it
const LABELS = (() => {
  const n = CASINO_BINS.length, mid = Math.floor(n / 2);
  const text = m => m === 0.5 ? '.5' : String(m);
  const from = CASINO_BINS.indexOf(0.5), to = CASINO_BINS.lastIndexOf(0.5);
  const slotMid = b => b * BIN_W + (BIN_COLS - 1) / 2;
  // the labels, in field cells, each wanting its bin's middle; the halves as one
  const want = [];
  for (let b = 0; b < n; b++) {
    if (CASINO_BINS[b] === 0.5 && b !== mid) continue;
    const s = text(CASINO_BINS[b]);
    want.push({ word: s, w: wordW(s), c: b === mid ? (slotMid(from) + slotMid(to)) / 2 : slotMid(b) });
  }
  // the plaque: what the row needs, or the sign's width, whichever is more,
  // and even so it centers on the block to the cell
  const need = want.reduce((n, l) => n + l.w, 0) + LABEL_GAP * (want.length - 1) + PLAQUE_PAD * 2;
  const plaqueW = Math.max(SIGN_W, need + (need % 2));
  // settle the row: push touching neighbors apart about the held middle, and
  // back in from the plaque's edges, until it stands
  const held = want.findIndex(l => l.word === '.5');
  const left = -(plaqueW - BOARD_COLS) / 2 + PLAQUE_PAD, right = BOARD_COLS - 1 + (plaqueW - BOARD_COLS) / 2 - PLAQUE_PAD;
  const start = l => l.c - (l.w - 1) / 2, end = l => l.c + (l.w - 1) / 2;
  const G = LABEL_GAP + 1;
  for (let pass = 0; pass < 50; pass++) {
    let moved = false;
    // outward from the middle, each pushed clear of the one inside it
    for (let i = held - 1; i >= 0; i--) {
      const room = start(want[i + 1]) - G - end(want[i]);
      if (room < 0) { want[i].c += room; moved = true; }
    }
    for (let i = held + 1; i < want.length; i++) {
      const room = start(want[i]) - G - end(want[i - 1]);
      if (room < 0) { want[i].c -= room; moved = true; }
    }
    // and back in from the plaque's edges, each pushed clear of the one
    // outside it, so the ends spill only as far as the plaque
    for (let i = 0; i < held; i++) {
      const edge = i === 0 ? left - G : end(want[i - 1]);
      const room = start(want[i]) - G - edge;
      if (room < 0) { want[i].c -= room; moved = true; }
    }
    for (let i = want.length - 1; i > held; i--) {
      const edge = i === want.length - 1 ? right + G : start(want[i + 1]);
      const room = edge - G - end(want[i]);
      if (room < 0) { want[i].c += room; moved = true; }
    }
    if (!moved) break;
  }
  return { labels: want.map(l => ({ word: l.word, col: start(l) })),
           bracket: [slotMid(from), slotMid(to)], w: plaqueW };
})();

function drawLabels(fx, fy) {
  const top = fy + (FIELD_H + BIN_H) * P;
  const x = fx - ((LABELS.w - BOARD_COLS) / 2) * P;
  // the plaque: white paper with a black edge, like the sign over it
  ctx.fillStyle = '#fff';
  ctx.fillRect(x, top, LABELS.w * P, LABEL_H * P);
  ctx.lineWidth = Math.max(1, P / 3);
  ctx.strokeStyle = '#000';
  ctx.strokeRect(x, top, LABELS.w * P, LABEL_H * P);
  ctx.fillStyle = '#000';
  for (const l of LABELS.labels) drawWord(l.word, fx + l.col * P, top + LABEL_ROW * P);
  // and the bar over the three half bins, saying the label under it is theirs
  const [a, b] = LABELS.bracket;
  ctx.fillRect(fx + a * P, top + (LABEL_ROW - 1) * P, (b - a + 1) * P, P);
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
    // in down through the pegs and the bins to the labels.
    ctx.fillStyle = '#fff';
    ctx.fillRect(x + P, f.y, w - 2 * P, (FIELD_H + BIN_H) * P);

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
    if (mayFlash()) {
      for (const p of S.tableFx.pegs || []) {
        if (t - p.at >= CASINO_FLASH_MS) continue;
        for (const [dc, dr] of [[-1, -1], [1, -1], [-1, 1], [1, 1]])
          ctx.fillRect(f.x + (p.c + dc) * P, f.y + (p.r + dr) * P, P, P);
      }
    }

    // The bins: eleven slots three cells wide with a cell of wall between,
    // and a floor under the lot. A x39 bin goes black for a beat when a grain
    // lands in it -- and, without the sound, when a grain one coin off falls
    // inward instead.
    const binTop = f.y + FIELD_H * P;
    const e = S.tableFx.edge;
    if (e && mayFlash() && t - e.at < CASINO_FLASH_MS) {
      ctx.fillStyle = '#000';
      ctx.fillRect(f.x + e.side * BIN_W * P, binTop, BIN_COLS * P, BIN_H * P);
    }
    ctx.fillStyle = '#000';
    ctx.fillRect(f.x - P, binTop, P, BIN_H * P);
    for (let b = 0; b < CASINO_BINS.length; b++)
      ctx.fillRect(f.x + (b * BIN_W + BIN_COLS) * P, binTop, P, BIN_H * P);

    // the pays, on their plaque across the bins' floor
    drawLabels(f.x, f.y);

    // and the tray, a white plot in the block's foot; the plaque is its rim
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
    if (g.pc !== g.c || g.pr !== g.r) {
      ctx.fillStyle = TRAIL_SHADE;
      ctx.fillRect(f.x + g.pc * P, f.y + g.pr * P, P, P);
    }
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
          ctx.fillRect(f.x + (b * BIN_W + c) * P, f.y + (FIELD_H + BIN_H - 1 - r) * P, P, P);
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
// The multiple, standing beside the tray: x0.7, x1.3, x2.6 -- to a tenth, or
// whole past ten -- counting up as the bins pay and then standing for a few
// seconds, so a board you were not watching still tells you how it went. A
// box wide enough for its word, in the same paper-and-edge as the lab's tick.
const multText = m => m >= 10 ? String(Math.round(m)) : (Math.round(m * 10) / 10).toFixed(1);

export function casinoMarkAt() {
  return { x: Math.round((casino.x + casino.w + P * 8) / P) * P,
           y: Math.round((tray.y - P * 4) / P) * P };
}

export function drawCasinoMark() {
  if (!S.casinoOpen) return;
  const m = shownMult();
  if (m == null) return;
  const at = casinoMarkAt();
  const y = at.y + Math.round(Math.sin(now() / 500)) * P;
  const word = 'x' + multText(m);
  const w = wordW(word) + 2, h = DIGIT_H + 2;

  ctx.fillStyle = '#fff';
  ctx.fillRect(at.x - Math.floor(w / 2) * P, y - Math.floor(h / 2) * P, w * P, h * P);
  ctx.lineWidth = Math.max(1, P / 3);
  ctx.strokeStyle = '#000';
  ctx.strokeRect(at.x - Math.floor(w / 2) * P, y - Math.floor(h / 2) * P, w * P, h * P);
  ctx.fillStyle = '#000';
  drawWord(word, at.x - Math.floor(w / 2) * P + P, y - Math.floor(h / 2) * P + P);

  // and what is in the tray now, under the box, in the mark of whatever was
  // staked -- a hand that came back is a number as much as a multiple
  if (!S.hand || !S.hand.n) return;
  drawMark(S.hand.cur === 'shard' ? SHARD_CELL : S.hand.cur === 'spore' ? SPORE_CELL : 4,
           at.x - P * 2, y + Math.floor(h / 2) * P + P * 1.5);
}
