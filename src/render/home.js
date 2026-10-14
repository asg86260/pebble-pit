// The house at the yard's left end, as it is seen (home.js): whichever of
// its pieces are up, the pile they come off and the woodpile the scaffold
// comes down onto, the door sliding open and shut on the lit room, the window
// lit while anyone is in, and the chimney going. Flat cells on the grid, each
// kind of piece its own few greys; the room the portal's purples.

import { S } from '../state.js';
import { P, FINALE_GREYS, FINALE_PURPLE, FINALE_PURPLE_LIGHT, FINALE_PILE_W, FINALE_PILE_ROWS,
         FINALE_DOOR_W, FINALE_DOOR_H, FINALE_DOOR_S, FINALE_DOOR_STEPS, FINALE_CHIMNEY,
         FINALE_SMOKE_HZ, FINALE_SMOKE_PUFFS, FINALE_SMOKE_ROWS } from '../config.js';
import { now } from '../clock.js';
import { ctx } from './ctx.js';
import { hash } from './flicker.js';
import { houseStands, houseX, doorX, pileX, pieces, pieceUp, pileNow, afterDoor, afterLit } from '../home.js';

const [G1, G2, G3, G4] = FINALE_GREYS;
const INK = '#000', WHITE = '#fff', PU = FINALE_PURPLE, PUL = FINALE_PURPLE_LIGHT;
const clamp01 = k => Math.max(0, Math.min(1, k));
const cell = (x, y, tone) => { ctx.fillStyle = tone; ctx.fillRect(x * P, y * P, P, P); };

// How far the door stands open, 0..FINALE_DOOR_STEPS, and whether the room is
// lit: the finale's door beats, or the two of them's turn afterwards.
function doorNow() {
  const f = S.finale, n = FINALE_DOOR_STEPS;
  if (f) {
    if (f.phase === 'open') return Math.min(n, Math.floor(clamp01(f.u / FINALE_DOOR_S) * n + 1e-6));
    if (f.phase === 'in') return n;
    if (f.phase === 'shut') return n - Math.min(n, Math.floor(clamp01(f.u / FINALE_DOOR_S) * n + 1e-6));
    return 0;
  }
  return S.retired ? afterDoor(S.retired) : 0;
}
function litNow() {
  const f = S.finale;
  if (f) return f.phase === 'light' || f.phase === 'hold' || f.phase === 'held';
  return !!S.retired && afterLit(S.retired);
}

// A piece's cell's tone: the walls black boards with a darker one here and
// there, the posts and plates and the eaves dark, the tiles chequered in two
// greys, the chimney dark with a darker cap, the scaffold and the bench pale.
function toneOf(p, X, Y, lit) {
  switch (p.kind) {
    case 'wall': return hash(X * 7.1 + Y * 3.3) < 0.15 ? G1 : INK;
    case 'post': case 'plate': return G2;
    case 'roof': return p.eave ? G2 : (X + Y) % 2 ? G3 : G4;
    case 'chimney': return Y === p.top ? G1 : G2;
    case 'pole': case 'plank': return G4;
    case 'bench': return G3;
    case 'window': return lit ? PU : WHITE;
    default: return INK;
  }
}

export function drawHome() {
  if (!houseStands()) return;
  const hx = houseX() / P, gy = Math.round(S.groundY / P), px = pileX() / P;
  // the pile, a row for every so many pieces still in it, and the woodpile on it
  const { left, wood } = pileNow();
  const rows = Math.ceil(left * FINALE_PILE_ROWS - 1e-6);
  for (let r = 0; r < rows; r++)
    for (let i = 0; i < FINALE_PILE_W; i++) cell(px + i, gy - 1 - r, (i + r) % 3 ? G3 : G4);
  for (let r = 0; r < wood; r++)
    for (let i = 0; i < FINALE_PILE_W; i++) cell(px + i, gy - 1 - rows - r, r % 2 ? G4 : G2);
  const lit = litNow();
  const all = pieces();
  all.forEach((p, i) => {
    if (p.kind === 'door' || !pieceUp(i)) return;
    for (const [x, row, w, h] of p.segs)
      for (let a = 0; a < w; a++) for (let b = 0; b < h; b++) {
        const X = hx + x + a, Y = gy + row + b;
        cell(X, Y, toneOf(p, X, gy + row, lit));
      }
  });
  // the door: slides into the wall in held steps, the lit room behind it
  const di = all.findIndex(p => p.kind === 'door');
  if (di >= 0 && pieceUp(di)) {
    const open = doorNow(), dx = doorX() / P;
    for (let i = 0; i < FINALE_DOOR_W; i++)
      for (let y = gy - FINALE_DOOR_H; y < gy; y++) cell(dx + i, y, i < open ? PUL : G4);
    if (open < FINALE_DOOR_W - 1) cell(dx + FINALE_DOOR_W - 1, gy - Math.ceil(FINALE_DOOR_H / 2), G1);
    for (let i = 0; i < open; i++) cell(dx + i, gy - FINALE_DOOR_H, PU);
  }
  // the chimney going while anyone is in: a puff a beat, climbing a cell a step
  const ci = all.findIndex(p => p.kind === 'chimney');
  if (lit && ci >= 0 && pieceUp(ci)) {
    const [cx, cr] = FINALE_CHIMNEY, t = now() / 1000;
    for (let k = 0; k < FINALE_SMOKE_PUFFS; k++) {
      const age = (t * FINALE_SMOKE_HZ + k / FINALE_SMOKE_PUFFS) % 1, st = Math.floor(age * FINALE_SMOKE_ROWS);
      cell(hx + cx + (st % 3 === 2 ? 1 : 0), gy + cr - 1 - st, st < FINALE_SMOKE_ROWS / 2 ? G4 : st < FINALE_SMOKE_ROWS * 3 / 4 ? FINALE_GREYS[4] : FINALE_GREYS[5]);
    }
  }
  ctx.fillStyle = INK;
}
