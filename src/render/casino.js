// The casino: the building that is the machine, read top to bottom. The hopper
// on the roof with the stake standing in it, the floor that splits when you let
// go, the sign across the front with its chase of lights, the white face knocked
// out of the block with the pegs standing in it and the handful falling through
// them, the bins with their pay written under them, and the tray at the foot.
// Owns drawCasino, drawPotPile, drawSparks, casinoMarkAt, drawCasinoMark and
// the glyphs. The shared primitives (ctx, drawGrid, drawMark, withRise, rising)
// come from ./ctx.js, ./ground.js, ./marks.js and ./rise.js.

import { fieldAt, hasPeg, pegRow, binCell, busy, mayFlash, shownMult } from '../casino.js';
import { now } from '../clock.js';
import { FIND_COLOR, P, SHADES, SHARD_CELL, SPORE_CELL, TABLE_LIFE, findKind,
         HOPPER_H, GATE_H, GATE_W, CASINO_SIGN_H, FIELD_H, BIN_W, BIN_H, LABEL_H, TRAY_H,
         BOARD_COLS, CASINO_MARGIN, CASINO_PEG_ROWS, CASINO_BINS, CASINO_GATE_MS,
         CASINO_WIN_MS, CASINO_STROBE_MS, CASINO_DARK_MS, CASINO_RELIGHT_MS,
         CASINO_CHASE_MS, CASINO_CHASE_LIVE_MS, CASINO_EDGE_STROBE_MS, CASINO_FLASH_MS } from '../config.js';
import { S, casino, table, tray } from '../state.js';
import { ctx } from './ctx.js';
import { drawGrid } from './ground.js';
import { drawMark } from './marks.js';
import { rising as risingAt, withRise } from './rise.js';

// --- the glyphs -----------------------------------------------------------------
// The one place in this yard with writing on it, and it has earned it: every
// other building says what it is by being the shape it is -- a chimney, a row of
// plots, a hole in the ground -- and a casino says what it is by shouting.
//
// Three cells across and five down, one stroke thick, because the sign runs
// across the front of a building twenty-six cells wide: six letters of the
// seven-wide face the roof sign wore would be forty-seven. A stroke needs air
// around it or it is not a stroke, so a cell of it stands between letters and
// a clear cell between the letters and the bulbs. The same face writes the
// bins' pay and the box's multiple, so the whole machine is in one hand.
const GLYPH = {
  C: ['111', '100', '100', '100', '111'],
  A: ['010', '101', '111', '101', '101'],
  S: ['111', '100', '111', '001', '111'],
  I: ['111', '010', '010', '010', '111'],
  // Two stems and the bar across the top: the diagonal a three-wide N wants
  // does not exist, and this reads as the letter where a filled middle read as
  // an H.
  N: ['111', '101', '101', '101', '101'],
  O: ['111', '101', '101', '101', '111'],
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
  // the point: one cell, on the baseline
  '.': ['0', '0', '0', '0', '1'],
  // times: the mark before a multiple
  'x': ['000', '101', '010', '101', '000']
};
const GLYPH_H = 5;
const glyphW = ch => GLYPH[ch][0].length;

function drawGlyph(ch, x, y) {
  const rows = GLYPH[ch];
  for (let r = 0; r < GLYPH_H; r++)
    for (let c = 0; c < rows[r].length; c++)
      if (rows[r][c] === '1') ctx.fillRect(x + c * P, y + r * P, P, P);
}
// A word along a row, a cell of air between glyphs; returns its width in cells.
const wordW = s => s.split('').reduce((w, ch) => w + glyphW(ch), 0) + s.length - 1;
function drawWord(s, x, y) {
  let c = 0;
  for (const ch of s) { drawGlyph(ch, x + c * P, y); c += glyphW(ch) + 1; }
}

// --- the sign -----------------------------------------------------------------
// CASINO across the front of the hopper, where it reads as the hopper's own
// edge, with the chase of lights round the border. The word is split about
// the middle so the handful falls through the gap in it: two clear cells
// between the S and the I, which is exactly the two the floor opens to. Six
// letters, four gaps and the gate are the building's inner width to the cell,
// and a stroke needs air around it, so the board stands a cell proud of the
// block either side, the way a marquee does.
const WORD = ['CAS', 'INO'];
const SIGN_W = BOARD_COLS + CASINO_MARGIN * 2 + 2;
const signX = () => casino.x - P;
const signY = () => casino.y + (HOPPER_H + GATE_H) * P;

function drawSign() {
  const x = signX(), y = signY(), w = SIGN_W, h = CASINO_SIGN_H;

  // the board itself: white paper with a black edge, like everything else here
  ctx.fillStyle = '#fff';
  ctx.fillRect(x, y, w * P, h * P);
  ctx.lineWidth = Math.max(1, P / 3);
  ctx.strokeStyle = '#000';
  ctx.strokeRect(x, y, w * P, h * P);

  // the two halves of the word, each a cell in from the bulbs, leaving the
  // gate's columns clear between them
  ctx.fillStyle = '#000';
  const gapL = w / 2 - GATE_W / 2, gapR = w / 2 + GATE_W / 2;
  drawWord(WORD[0], x + (gapL - wordW(WORD[0])) * P, y + P);
  drawWord(WORD[1], x + gapR * P, y + P);

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

// --- the bins' pay --------------------------------------------------------------
// What each bin pays, written under it in the sign's own glyphs. A glyph is
// three cells and a bin is two, so the labels stand in two rows -- the upper
// for the even bins, the lower for the odd -- and the three half bins in the
// middle share one label. A two-digit pay stacks its digits down both rows.
// Each is a column in field cells and which row it stands on; the left half
// leans right and the right half leans left, so a clear cell stands between
// every pair. A lower label is a long way under its bin, so a one-cell leader
// runs up from it to the bin's floor, at the label's inner edge.
const LABELS = (() => {
  const out = [];
  const n = CASINO_BINS.length, last = n - 1, mid = Math.floor(n / 2);
  const text = m => m === 0.5 ? '.5' : String(m);
  for (let b = 0; b < n; b++) {
    const m = CASINO_BINS[b];
    if (m === 0.5 && b !== mid) continue;                // the half bins share
    const s = text(m), left = b < mid;
    if (b === 0) out.push({ col: -1, row: 0, stack: s.split('') });
    else if (b === last) out.push({ col: b * BIN_W, row: 0, stack: s.split('') });
    else if (b === mid) out.push({ col: b * BIN_W - 2, row: 0, word: s });
    else {
      const odd = b % 2;
      const col = left ? b * BIN_W + odd : b * BIN_W - 1 - odd;
      out.push({ col, row: odd, word: s, leader: odd ? (left ? col : col + 2) : null });
    }
  }
  return out;
})();
const LABEL_ROW_H = GLYPH_H + 1;

function drawLabels(fx, fy) {
  ctx.fillStyle = '#000';
  const floor = fy + (FIELD_H + BIN_H) * P;
  const top = floor + P;
  for (const l of LABELS) {
    const x = fx + l.col * P;
    if (l.stack) l.stack.forEach((ch, i) => drawGlyph(ch, x, top + i * LABEL_ROW_H * P));
    else drawWord(l.word, x, top + l.row * LABEL_ROW_H * P);
    if (l.leader != null) ctx.fillRect(fx + l.leader * P, floor, P, (1 + LABEL_ROW_H) * P);
  }
}

// --- the building -------------------------------------------------------------
export function drawCasino() {
  const rising = risingAt('casino') && 'casino';
  if (!S.casinoOpen && !rising) return;
  const { x, y, w, h } = casino;
  withRise(rising, x, S.groundY, w, h, () => {
    const t = now();
    const f = fieldAt();
    const line = Math.max(1, P / 3);

    // The block, from the hopper floor down. The hopper itself is open to the
    // sky: two walls and the floor, with the heap standing in it drawn by
    // `drawPotPile` over the sky, because that is where it stands.
    ctx.fillStyle = '#000';
    ctx.fillRect(x, y + HOPPER_H * P, w, h - HOPPER_H * P);
    ctx.fillRect(x, y, P, HOPPER_H * P);
    ctx.fillRect(x + w - P, y, P, HOPPER_H * P);

    // The floor, open: it splits from the middle over `CASINO_GATE_MS`, a cell
    // at a time from the inside out, and the hole shows white -- a way through,
    // like every opening in this yard. It stays open for the hand and shuts
    // when the tray is paid.
    if (S.drop) {
      const k = Math.min(1, (t - S.drop.at) / Math.max(1, CASINO_GATE_MS));
      const open = Math.max(1, Math.round(k * GATE_W / 2));
      ctx.fillStyle = '#fff';
      ctx.fillRect(x + (w / 2) - open * P, y + HOPPER_H * P, open * 2 * P, GATE_H * P);
    }

    drawSign();

    // The face: a white board knocked out of the block, the way the wheel's
    // disc was, a wall in from each side, running from the air the stream fans
    // in down through the pegs and the bins to the tray at the foot.
    ctx.fillStyle = '#fff';
    ctx.fillRect(x + P, f.y, w - 2 * P, (FIELD_H + BIN_H + LABEL_H + TRAY_H) * P);

    // The pegs: row k has k + 1 of them, one under each seat a grain can reach,
    // so the odds are the picture. A peg on the beat is a hit: it throws a
    // spark -- its four corners lit for a frame or two -- with the grain
    // sitting black on top of it.
    ctx.fillStyle = '#000';
    for (let k = 0; k < CASINO_PEG_ROWS; k++)
      for (let c = 0; c < BOARD_COLS; c++)
        if (hasPeg(k, c)) ctx.fillRect(f.x + c * P, f.y + pegRow(k) * P, P, P);
    if (mayFlash()) {
      for (const p of S.tableFx.pegs || []) {
        if (t - p.at >= CASINO_FLASH_MS) continue;
        for (const [dc, dr] of [[-1, -1], [1, -1], [-1, 1], [1, 1]])
          ctx.fillRect(f.x + (p.c + dc) * P, f.y + (p.r + dr) * P, P, P);
      }
    }

    // The bins: eleven slots with a divider between each pair and a floor
    // under the lot, drawn as lines rather than cells because eleven bins two
    // cells wide is the whole width and there is no cell to spare for a wall.
    // A x39 bin flashes black for a beat when a grain lands in it -- and, without
    // the sound, when a grain one coin off falls inward instead.
    const binTop = f.y + FIELD_H * P, binBottom = binTop + BIN_H * P;
    const e = S.tableFx.edge;
    if (e && mayFlash() && t - e.at < CASINO_FLASH_MS) {
      ctx.fillStyle = '#000';
      ctx.fillRect(f.x + e.side * BIN_W * P, binTop, BIN_W * P, BIN_H * P);
    }
    ctx.fillStyle = '#000';
    for (let b = 0; b <= CASINO_BINS.length; b++)
      ctx.fillRect(f.x + b * BIN_W * P - line / 2, binTop, line, BIN_H * P);
    ctx.fillRect(f.x, binBottom - line / 2, BOARD_COLS * P, line);

    drawLabels(f.x, f.y);

    // and the tray's rim: the line the labels stand on and the sand stands under
    ctx.fillRect(x + P, tray.y - line / 2, w - 2 * P, line);
    ctx.fillStyle = '#000';
  });
}

// --- the sand -------------------------------------------------------------------
// The two heaps are real plots of sand -- see casino.js -- so they are blitted
// like the yard and the hole rather than drawn a grain at a time. The handful
// on the pegs and what is lying in the bins are cells too, but a few dozen of
// them, so they are drawn straight.
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
  for (const g of demo ? [...grains, demo] : grains) {
    if (g.landed) continue;
    ctx.fillStyle = shadeOf(g.s);
    ctx.fillRect(f.x + g.c * P, f.y + g.r * P, P, P);
  }
  if (S.drop) {
    S.drop.bins.forEach((bin, b) => bin.forEach((s, i) => {
      const [c, r] = binCell(b, i);
      ctx.fillStyle = shadeOf(s);
      ctx.fillRect(f.x + c * P, f.y + r * P, P, P);
    }));
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
           y: Math.round((tray.y - P * 2) / P) * P };
}

export function drawCasinoMark() {
  if (!S.casinoOpen) return;
  const m = shownMult();
  if (m == null) return;
  const at = casinoMarkAt();
  const y = at.y + Math.round(Math.sin(now() / 500)) * P;
  const word = 'x' + multText(m);
  const w = wordW(word) + 2, h = GLYPH_H + 2;

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
