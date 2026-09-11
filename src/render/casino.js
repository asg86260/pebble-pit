// The casino: the block with a wheel in it, its shouting sign, and the pot and
// spoils on the table. Extracted verbatim from render.js; behavior unchanged.
// Owns drawSign, ringCells, drawPotPile, drawSparks, drawCasino, casinoMarkAt,
// drawCasinoMark and the sign's glyphs. The shared primitives (ctx, drawGrid,
// drawMark, withRise, risingPlace) come from ./ctx.js, ./ground.js, ./marks.js
// and ./rise.js.

import { potAt, sliceKeeps, plinkoBox, rockAt, PLINKO_COLS, PLINKO_W, PLINKO_FIELD_H } from '../casino.js';
import { now } from '../clock.js';
import { CASINO_H, CASINO_KEEP, CASINO_LOSE, CASINO_SLICES, DOOR_H, DOOR_W, FIND_COLOR, P, SHADES, SHARD_CELL, SPORE_CELL, TABLE_LIFE, findKind,
         PLINKO_ROWS, PLINKO_BINS, PLINKO_PITCH, PLINKO_ROW_H, PLINKO_SIGN_H, PLINKO_HOPPER_H, PLINKO_BIN_H, PLINKO_LABEL_H, PLINKO_MARGIN } from '../config.js';
import { S, casino, floor, table } from '../state.js';
import { ctx } from './ctx.js';
import { drawGrid } from './ground.js';
import { drawMark } from './marks.js';
import { TICK, drawMarkBox } from './donemarks.js';
import { rising as risingAt, withRise } from './rise.js';

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
  signBoard(x, y, w, h, k, (n, r, c) => [SIGN_PAD + c * k, SIGN_PAD + n * (GLYPH_H * k + GLYPH_GAP) + r * k]);
}

// The board, the word and the lights, wherever the sign stands: down the roof
// board or across the top of the drop tower. `cell` says where a glyph-cell of
// letter `n` goes on the board, which is the only thing the two differ in.
function signBoard(x, y, w, h, k, cell) {
  // the board itself: white paper with a black edge, like everything else here
  ctx.fillStyle = '#fff';
  ctx.fillRect(x, y, w * P, h * P);
  ctx.lineWidth = Math.max(1, P / 3);
  ctx.strokeStyle = '#000';
  ctx.strokeRect(x, y, w * P, h * P);

  ctx.fillStyle = '#000';
  WORD.split('').forEach((ch, n) => {
    const rows = GLYPH[ch];
    for (let r = 0; r < GLYPH_H; r++)
      for (let c = 0; c < GLYPH_W; c++)
        if (rows[r][c] === '1') {
          const [gx, gy] = cell(n, r, c);
          ctx.fillRect(x + gx * P, y + gy * P, P * k, P * k);
        }
  });

  // and the lights, walking round the edge. A whole cell at a time, like
  // everything that moves in this game: a bulb is on or it is off.
  const step = Math.floor(now() / CHASE_MS);
  ringCells(w, h).forEach(([cx, cy], i) => {
    if ((i + step) % CHASE_EVERY) return;
    ctx.fillRect(x + cx * P, y + cy * P, P, P);
  });
}

// --- the drop -----------------------------------------------------------------
// The board on the roof: a black tower with the sign across the top, a white
// peg field knocked out of its face the way the wheel is a white disc knocked
// out of the block, and a row of white slots along the bottom with what they
// pay written in them. The rock is a two-by-two block, black on the white and
// white on the black, and a peg is a two-cell bar. See DESIGN.md, "The drop".
//
// The bins' glyphs are three cells wide -- a bin is four -- and a two-digit
// pay stacks them, the way the roof sign stacks its letters.
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
  // the point in ".5": a half is written the way the counter would write it,
  // stacked like the two-digit pays. A half-filled box was tried and read as a
  // zero at this size, which on a bin is the one thing it must not say.
  '.': ['000', '000', '000', '000', '010']
};
const DIGIT_W = 3, DIGIT_H = 5;
// what a bin says: the digits of its pay, a half as ".5"
const payGlyphs = m => (m === 0.5 ? '.5' : String(m)).split('');

function drawDigit(ch, x, y) {
  const rows = DIGIT[ch];
  for (let r = 0; r < DIGIT_H; r++)
    for (let c = 0; c < DIGIT_W; c++)
      if (rows[r][c] === '1') ctx.fillRect(x + c * P, y + r * P, P, P);
}

// The cells of a pay, for the mark box over the pot: digits side by side with
// a cell of air, centered, in the box's own offset form.
export function payMark(m) {
  const g = payGlyphs(m);
  const w = g.length * DIGIT_W + (g.length - 1);
  const cells = [];
  g.forEach((ch, n) => {
    const rows = DIGIT[ch];
    for (let r = 0; r < DIGIT_H; r++)
      for (let c = 0; c < DIGIT_W; c++)
        if (rows[r][c] === '1') cells.push([n * (DIGIT_W + 1) + c - (w - 1) / 2, r - (DIGIT_H - 1) / 2]);
  });
  return cells;
}

const SIGN_GAP_ACROSS = 1;   // between letters written along a row
function drawPlinko() {
  const rising = risingAt('plinko') && 'plinko';
  if (!S.plinkoOpen && !rising) return;
  const { x, y, w, h } = plinkoBox();
  withRise(rising, x, casino.y, w, h, () => {
    ctx.fillStyle = '#000';
    ctx.fillRect(x, y, w, h);                                // the tower

    // the sign, across the top, with the chase round it
    const pad = Math.floor((PLINKO_W - (WORD.length * GLYPH_W + (WORD.length - 1) * SIGN_GAP_ACROSS)) / 2);
    signBoard(x, y, PLINKO_W, PLINKO_SIGN_H, 1,
              (n, r, c) => [pad + n * (GLYPH_W + SIGN_GAP_ACROSS) + c, SIGN_PAD + r]);

    // the hopper, the field and the slots, in white
    const top = PLINKO_SIGN_H + PLINKO_HOPPER_H;
    const fx = x + PLINKO_MARGIN * P, mid = PLINKO_MARGIN + PLINKO_COLS / 2;
    ctx.fillStyle = '#fff';
    ctx.fillRect(x + (mid - 4) * P, y + PLINKO_SIGN_H * P, 8 * P, PLINKO_HOPPER_H * P);
    ctx.fillRect(fx, y + top * P, PLINKO_COLS * P, PLINKO_FIELD_H * P);
    for (let b = 0; b < PLINKO_BINS.length; b++)
      ctx.fillRect(fx + b * PLINKO_PITCH * P, y + (top + PLINKO_FIELD_H) * P,
                   (PLINKO_PITCH - 1) * P, PLINKO_BIN_H * P);

    // the pegs: row r has r + 1 of them, one cell under each place the rock can
    // be, so the odds are the picture. One cell and not a bar the rock's width:
    // a two-cell bar under a two-cell rock read as a taller peg, and the rock
    // was the one thing on the board you could not find.
    ctx.fillStyle = '#000';
    for (let r = 0; r < PLINKO_ROWS; r++)
      for (let j = 0; j <= r; j++) {
        const cx = mid + (PLINKO_PITCH / 2) * (2 * j - r);
        ctx.fillRect(x + (cx - 1) * P, y + (top + PLINKO_ROW_H * r + 1) * P, P, P);
      }

    // what each bin pays, under its slot, white on the tower: a glyph in the
    // slot itself touched the divider beside it and fused with it
    ctx.fillStyle = '#fff';
    for (let b = 0; b < PLINKO_BINS.length; b++) {
      const g = payGlyphs(PLINKO_BINS[b]);
      const sx = fx + b * PLINKO_PITCH * P, sy = y + (top + PLINKO_FIELD_H + PLINKO_BIN_H) * P;
      if (g.length === 1) drawDigit(g[0], sx, sy + 4 * P);
      else g.forEach((ch, n) => drawDigit(ch, sx, sy + (1 + n * (DIGIT_H + 1)) * P));
    }

    // and the rock, wherever it is: on the board, in a bin, or on its way back
    // up the frame
    const r = rockAt();
    ctx.fillStyle = r.frame ? '#fff' : '#000';
    ctx.fillRect(x + Math.round(r.x * P), y + Math.round(r.y * P), 2 * P, 2 * P);
    ctx.fillStyle = '#000';
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
  const rising = risingAt('casino') && 'casino';
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

  // The sign stands on the roof until the drop tower does, and then it is the
  // tower's, across the top: two signs on one building would be a shout twice.
  if (!S.plinkoOpen && !risingAt('plinko')) drawSign();
  });
  drawPlinko();
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
  // With the drop tower up, the spot over the pot is under the tower's
  // overhang -- so it stands clear of the tower's right edge instead, at the
  // same height, still on the pot's side of the building.
  const x = S.plinkoOpen ? Math.max(potAt().x, plinkoBox().x + plinkoBox().w + P * 5) : potAt().x;
  return { x, y: Math.round((S.groundY - P * 22) / P) * P };
}

export function drawCasinoMark() {
  if (!S.casinoOpen || !S.hand) return;
  const at = casinoMarkAt();
  const y = at.y + Math.round(Math.sin(now() / 500)) * P;
  const won = S.hand.won;

  // A drop's answer is a number rather than a yes or a no, so the box says the
  // bin -- 3, 39, the half mark -- in the board's own digits.
  drawMarkBox(at, y, S.hand.mult != null ? payMark(S.hand.mult) : won ? TICK : CROSS);

  // and what is on the table now, under the mark, in the mark of whatever was
  // staked -- a win is a number as much as it is a yes
  if (!won || !S.hand.n) return;
  drawMark(S.hand.cur === 'shard' ? SHARD_CELL : S.hand.cur === 'spore' ? SPORE_CELL : 4,
           at.x - P * 2, y + P * 5.5);
}
