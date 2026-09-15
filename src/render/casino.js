// The casino: the block with a wheel in it, its shouting sign, and the pot and
// spoils on the table.

import { potAt, sliceKeeps } from '../casino.js';
import { now } from '../clock.js';
import { CASINO_H, CASINO_KEEP, CASINO_LOSE, CASINO_SLICES, DOOR_H, DOOR_W, FIND_COLOR, P, SHADES, SHARD_CELL, SPORE_CELL, TABLE_LIFE, findKind,
         CASINO_WIN_MS, CASINO_FLASH_MS, CASINO_STROBE_MS, CASINO_DARK_MS, CASINO_RELIGHT_MS } from '../config.js';
import { S, casino, floor, table } from '../state.js';
import { ctx } from './ctx.js';
import { drawGrid } from './ground.js';
import { drawMark } from './marks.js';
import { TICK, drawMarkBox } from './donemarks.js';
import { rising as risingAt, withRise } from './rise.js';

// The casino is a block with one big round hole knocked out of it and a wheel
// in the hole. The wheel turns while there is a pot on the table and spins in
// earnest while a ride is being settled: the rows say what the numbers are,
// this says whether anything is happening.

// --- the sign -----------------------------------------------------------------
// The one place in the yard with writing on it: a casino says what it is by
// shouting. Letters stacked down a board on the roof, with a chase of lights
// round the edge; nothing else in the yard blinks.
//
// Seven cells across and five down, every stroke one cell thick. Four rows is
// one short of what an S needs (two dashes passing each other however you draw
// it), and a stroke drawn thicker comes out as blocks with notches in them,
// since every glyph-cell is two world cells at full size.
const GLYPH = {
  // A C's open side has to be *missing*: a right-hand stem standing at the
  // first and last rows is an O with a notch in it.
  C: ['0111110', '1000000', '1000000', '1000000', '0111110'],
  A: ['0111110', '1000001', '1111111', '1000001', '1000001'],
  S: ['0111111', '1000000', '0111110', '0000001', '1111110'],
  I: ['1111111', '0001000', '0001000', '0001000', '1111111'],
  // An N is two stems and one unbroken diagonal, corner to corner; a staircase
  // floating between them reads as an H with something dropped on it.
  N: ['1100001', '1010001', '1001001', '1000101', '1000011'],
  O: ['0111110', '1000001', '1000001', '1000001', '0111110']
};
const WORD = 'CASINO';
// Every glyph-cell is two world cells; at one the word reads as a stack of
// smudges. On a window with less sky than the board is tall it drops to one
// cell a glyph rather than running off the top. Whole numbers only: half a
// cell is a cell drawn across a fraction of a device pixel.
// (`window.__signScale = 2` forces the big one on a short window.)
const scale = () => (import.meta.env.DEV && window.__signScale) ||
  ((signH(2) + CASINO_H / P) * P <= S.groundY - S.camY ? 2 : 1);
// The gap and the margin are two cells: a stroke is two world cells thick at
// full size, and less air than the stroke is thick runs the letters and the
// bulbs together into texture.
const GLYPH_H = 5, GLYPH_W = 7, GLYPH_GAP = 2, SIGN_PAD = 2;
const signW = k => GLYPH_W * k + SIGN_PAD * 2;
const signH = k => WORD.length * (GLYPH_H * k + GLYPH_GAP) - GLYPH_GAP + SIGN_PAD * 2;
const CHASE_MS = 130;            // how fast a light walks round the border
const CHASE_EVERY = 4;           // and how many dark ones stand between the lit

// On the roof, stood up out of the middle of it; the whole of it has to be
// inside the sky you can see.
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

  // The lights, walking round the edge a whole cell at a time. A win puts every
  // bulb on a strobe; a loss puts the board out and brings the bulbs back one
  // at a time round the ring, and the chase picks up among the ones that are
  // back (`CASINO_WIN_MS` and its neighbors).
  const step = Math.floor(now() / CHASE_MS);
  const age = S.hand ? now() - S.hand.at : Infinity;
  const strobe = S.hand?.won && age < CASINO_WIN_MS;
  const lit = S.hand && !S.hand.won
    ? Math.max(0, Math.floor((age - CASINO_DARK_MS) / CASINO_RELIGHT_MS)) : Infinity;
  const ring = ringCells(w, h);
  ring.forEach(([cx, cy], i) => {
    if (strobe) { if (Math.floor(age / CASINO_STROBE_MS) % 2) return; }
    else if (i >= lit || (i + step) % CHASE_EVERY) return;
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

// The pot is a real plot of sand (casino.js), so it is blitted like the yard
// and the hole rather than drawn a triangle at a time.
export function drawPotPile() {
  if (!S.casinoOpen || !table.grid || !table.n) return;
  drawGrid(table);
}

export function drawSparks() {
  for (const k of S.tableAir) {
    const find = findKind(k.s);
    // A grain on its way out of the game fades as it goes rather than blinking
    // off.
    if (k.fade) ctx.globalAlpha = Math.max(0, 1 - k.t / TABLE_LIFE);
    ctx.fillStyle = find ? FIND_COLOR[find][k.s - find] : SHADES[Math.min(SHADES.length, k.s) - 1];
    const d = k.big ? P * 2 : P;               // a hand's confetti is two cells a square
    ctx.fillRect(Math.round(k.x), Math.round(k.y), d, d);
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

  // The wheel: CASINO_SLICES slices, half bare and half filled, which is the
  // odds written on the thing itself (CASINO_KEEP). Set low enough in the block
  // that the pointer above it clears the roof, where the sign stands.
  const cx = x + w / 2, cy = y + h * 0.62, r = Math.min(w, h) * 0.38;
  const step = (Math.PI * 2) / CASINO_SLICES;

  // A white disc knocked out of the block first, a cell proud of the rim:
  // neither the black nor the white slices read on a black building without it.
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(cx, cy, r + P, 0, Math.PI * 2);
  ctx.fill();
  // A win flashes the wheel: the slices swap sides a few times as it stops.
  // Whole flips on the strobe's clock, never a blend.
  const age = S.hand ? now() - S.hand.at : Infinity;
  const flip = S.hand?.won && age < CASINO_FLASH_MS && Math.floor(age / CASINO_STROBE_MS) % 2;
  for (let i = 0; i < CASINO_SLICES; i++) {
    ctx.fillStyle = (sliceKeeps(i) !== !!flip) ? CASINO_KEEP : CASINO_LOSE;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, S.wheel + i * step, S.wheel + (i + 1) * step);
    ctx.closePath();
    ctx.fill();
  }

  // A divider on every cut, white: the only place one is needed is between two
  // filled slices, and a white line is exactly what shows there.
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

  // The pointer at the top does not turn, and it is white because it stands
  // against the black of the building.
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

  // A door, off to one side rather than under the wheel, where a hole would
  // read as part of the works. Two clear cells of wall hold it off the corner;
  // DOOR_W by DOOR_H like every other way in.
  ctx.fillStyle = '#fff';
  ctx.fillRect(x + w - P * (DOOR_W + 2), y + h - P * DOOR_H, P * DOOR_W, P * DOOR_H);
  ctx.fillStyle = '#000';

  drawSign();
  });
}

// Which way the last hand went, standing over the casino for a few seconds in
// the same box the lab's news stands in: a tick for a win, with what it is now
// worth under it, and a cross for a hand that is gone.
const CROSS = [[-2, -2], [-1, -1], [0, 0], [1, 1], [2, 2],
               [2, -2], [1, -1], [-1, 1], [-2, 2]];

// Clear of the sign, which stands out of the middle of the roof; over the pot,
// which is the thing the news is about.
export function casinoMarkAt() {
  return { x: potAt().x, y: Math.round((S.groundY - P * 22) / P) * P };
}

export function drawCasinoMark() {
  if (!S.casinoOpen || !S.hand) return;
  const at = casinoMarkAt();
  const y = at.y + Math.round(Math.sin(now() / 500)) * P;
  const won = S.hand.won;

  drawMarkBox(at, y, won ? TICK : CROSS);

  // and what is on the table now, under the mark, in the mark of whatever was
  // staked
  if (!won || !S.hand.n) return;
  drawMark(S.hand.cur === 'shard' ? SHARD_CELL : S.hand.cur === 'spore' ? SPORE_CELL : 4,
           at.x - P * 2, y + P * 5.5);
}
