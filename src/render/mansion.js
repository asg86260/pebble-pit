// The ending's mansion, drawn (mansion.js): the scaffold's poles while they
// stand, every piece set so far, the newest fading in, the blocks pile the
// rock was broken onto, and what is left of the old house's woodpile.
// Placeholder cells before a mock: dark walls with a lighter board here and
// there, windows lit in the portal's purple once the two of them are in,
// tiled roofs in two greys, the towers' caps.
//
// Every piece that has finished fading in is kept on a sheet of its own, one
// pixel a cell, and the sheet is laid down whole; it is painted again only
// when another piece finishes (the owner's review, 2026-10-17). A piece still
// fading is drawn over it, alone.

import { S } from '../state.js';
import { P, MANSION_GREYS, MANSION_LIT, MANSION_WINDOW, MANSION_WINDOW_EVERY, MANSION_FLOOR_ROWS, MANSION_POLES,
         MANSION_FLOORS, MANSION_BLOCKS_AT, MANSION_BLOCK_CELLS, MANSION_BLOCKS_W, MANSION_TOWER_FLOORS, FINALE_PILE_W, FINALE_GREYS, ACT_ROCK_TONES } from '../config.js';
import { ctx } from './ctx.js';
import { pieces } from '../home.js';
import { hash } from './flicker.js';
import { mansionPieces, mansionStands, mansionX, MANSION_W, pieceIn, poleUp, blocksLeft, woodLeft, woodX } from '../mansion.js';

const [INK, G1, G2, G3] = MANSION_GREYS;
const TOP = (MANSION_TOWER_FLOORS * MANSION_FLOOR_ROWS) + 4;   // rows over the ground the sheet must hold
// The woodpile's rows at the house's fall: one for each scaffold piece the
// finale carried down onto it (home.js).
const woodRows = () => pieces().filter(p => p.off != null).length;
const lit = () => !!(S.acts && S.acts.house === 'mansion');

// A cell's tone in a piece, by kind and where it is in the cells off the
// mansion's left end and up from the ground line.
function toneOf(p, X, Y) {
  if (p.kind === 'roof') return (X + Y) % 2 ? G2 : G3;
  if (p.kind === 'door') return G2;
  // a window: MANSION_WINDOW cells, every MANSION_WINDOW_EVERY along, in the
  // middle rows of each floor
  const [ww, wh] = MANSION_WINDOW, b = p.block, fy = ((-Y - 1) % MANSION_FLOOR_ROWS + MANSION_FLOOR_ROWS) % MANSION_FLOOR_ROWS;
  const col = ((X - (b ? b.x : 0)) % MANSION_WINDOW_EVERY + MANSION_WINDOW_EVERY) % MANSION_WINDOW_EVERY;
  if (col >= 2 && col < 2 + ww && fy >= 1 && fy < 1 + wh) return lit() ? MANSION_LIT : '#fff';
  return hash(X * 5.3 + Y * 2.1) < 0.12 ? G1 : INK;
}
function eachCell(p, fn) {
  for (const [x, row, w, h] of p.segs)
    for (let a = 0; a < w; a++) for (let b = 0; b < h; b++) fn(x + a, row + b);
}

// The sheet of finished pieces: how many it holds and whether lit, so it is
// remade only when either changes.
let sheet = null, sheetKey = '';
function sheetOf(done) {
  const key = `${done.join(',')}|${lit()}`;
  if (sheet && key === sheetKey) return sheet;
  const W = MANSION_W + 4, H = TOP;
  sheet = sheet || document.createElement('canvas');
  sheet.width = W; sheet.height = H;
  const g = sheet.getContext('2d');
  g.clearRect(0, 0, W, H);
  const all = mansionPieces();
  for (const i of done) {
    const p = all[i];
    eachCell(p, (X, Y) => { g.fillStyle = toneOf(p, X, Y); g.fillRect(X + 2, H + Y, 1, 1); });
  }
  sheetKey = key;
  return sheet;
}

export function drawMansion() {
  // The old house's woodpile outlives the house: drawn here from its fall
  // (render/home.js stops), its rows going as the scaffold's poles are carried off.
  if (!S.acts || S.acts.house === 'standing') return;
  const x0 = mansionX(), gy = Math.round(S.groundY / P) * P;
  const all = mansionPieces();
  const wood = Math.ceil(woodLeft() * woodRows() / MANSION_POLES.length);
  for (let r = 0; r < wood; r++) for (let i = 0; i < FINALE_PILE_W; i++)
    cell(woodX() - FINALE_PILE_W * P / 2 + i * P, gy - P - r * P, r % 2 ? FINALE_GREYS[4] : FINALE_GREYS[2]);
  if (!mansionStands()) { ctx.fillStyle = '#000'; return; }
  const blocks = Math.ceil(blocksLeft() / MANSION_BLOCK_CELLS);
  for (let n = 0; n < blocks; n++)
    cell((MANSION_BLOCKS_AT + n % MANSION_BLOCKS_W) * P, gy - P - Math.floor(n / MANSION_BLOCKS_W) * P, ACT_ROCK_TONES[n % ACT_ROCK_TONES.length]);
  // the scaffold, behind the pieces
  MANSION_POLES.forEach((c, i) => {
    if (!poleUp(i)) return;
    for (let r = 1; r <= MANSION_FLOORS * MANSION_FLOOR_ROWS; r++) cell(x0 + c * P, gy - r * P, FINALE_GREYS[4]);
  });
  // the finished pieces off their sheet, then each still fading in
  const done = [], fading = [];
  all.forEach((p, i) => {
    if (!p.segs.length) return;
    const k = pieceIn(i);
    if (k >= 1) done.push(i); else if (k > 0) fading.push([p, k]);
  });
  if (done.length) {
    const s = sheetOf(done);
    if (s.getContext) {
      const was = ctx.imageSmoothingEnabled;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(s, x0 - 2 * P, gy - s.height * P, s.width * P, s.height * P);
      ctx.imageSmoothingEnabled = was;
    }
  }
  for (const [p, k] of fading) {
    const was = ctx.globalAlpha;
    ctx.globalAlpha = was * k;
    eachCell(p, (X, Y) => cell(x0 + X * P, gy + Y * P, toneOf(p, X, Y)));
    ctx.globalAlpha = was;
  }
  ctx.fillStyle = '#000';
}
const cell = (x, y, tone) => { ctx.fillStyle = tone; ctx.fillRect(x, y, P, P); };
