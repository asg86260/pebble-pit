// The meteor: a rock in the sky, cells you take off one at a time, a rind
// round a core. Only a wizard can reach it. When the last cell is off the
// wizards summon the next one.

import { P, METEOR_CORE, METEOR_SPARKS, METEOR_CORE_SPARKS, SUMMON_MS, SUMMON_SHAKE, SPARK_CELL, someFind,
         BOLT_PACE, WIZ_ORBIT } from './config.js';
import { S, sky } from './state.js';
import { now, frames } from './clock.js';
import { spawnChip, bell } from './dust.js';
import { shakeView } from './world.js';
import { rand } from './rng.js';
import { sfx } from './audio.js';

// what a cell of it is
export const RIND = 1, CORE = 2;

// Magic on its way to the star. The cell is taken on arrival, not on release,
// which is why this is an object and not an animation over a thing that has
// already happened; a bolt whose cell has gone in the meantime arrives at
// nothing.
export const BOLTS = [];

// The wizards' own light, wherever it is: one list and one kind of speck.
export const SPARKLE = [];

export function sparkle(x, y, vx, vy, life) {
  if (SPARKLE.length > 500) return;          // a fog of it is not a spell
  SPARKLE.push({ x, y, vx, vy, born: now(), life, tone: Math.floor(rand() * 4) });
}

export function stepSparkle(dt) {
  const t = now();
  for (let i = SPARKLE.length - 1; i >= 0; i--) {
    const k = SPARKLE[i];
    if (t - k.born > k.life) { SPARKLE.splice(i, 1); continue; }
    k.x += k.vx * (dt / 16);
    k.y += k.vy * (dt / 16);
    k.vx *= 0.96;
    k.vy = k.vy * 0.96 + 0.012;              // it slows, and then it sinks
  }
}

// the ring the wizards fly, and the bolts leave from
export const orbitR = () => sky.r + WIZ_ORBIT;

export function fire(fromX, fromY, cell, bite = 1) {
  if (!cell) return;
  BOLTS.push({ x: fromX, y: fromY, px: fromX, py: fromY, c: cell.c, r: cell.r, bite });
  sfx('bolt-throw', { x: fromX });
  // a handful of specks off the hand it left, thrown the way it went
  const dx = cellX(cell.c) - fromX, dy = cellY(cell.r) - fromY;
  const d = Math.hypot(dx, dy) || 1;
  for (let i = 0; i < 6; i++)
    sparkle(fromX, fromY,
            (dx / d) * (0.6 + rand() * 0.8) + (rand() - 0.5) * 0.6,
            (dy / d) * (0.6 + rand() * 0.8) + (rand() - 0.5) * 0.6, 320);
}

function stepBolts() {
  for (let i = BOLTS.length - 1; i >= 0; i--) {
    const b = BOLTS[i];
    const tx = cellX(b.c) + sky.p / 2, ty = cellY(b.r) + sky.p / 2;
    const dx = tx - b.x, dy = ty - b.y;
    const d = Math.hypot(dx, dy);
    const step = BOLT_PACE * frames();     // pixels a frame, times the frame
    if (d > step) {
      b.px = b.x;                       // where it was, for the tail behind it
      b.py = b.y;
      b.x += (dx / d) * step;
      b.y += (dy / d) * step;
      // it sheds as it goes, so what crosses the gap is a thing burning
      sparkle(b.x, b.y, (rand() - 0.5) * 0.5, (rand() - 0.5) * 0.5, 340);
      if (rand() < 0.5)
        sparkle(b.x, b.y, (rand() - 0.5) * 1.1, (rand() - 0.5) * 1.1, 220);
      continue;
    }
    // A stronger bolt takes the cells around it too, spreading outward rather
    // than punching a deeper hole.
    takeCell(b.c, b.r);
    for (let n = 1; n < (b.bite || 1); n++) {
      const near = nearestLive(b.c, b.r);
      if (!near) break;
      takeCell(near.c, near.r);
    }
    sfx(b.bite > 1 ? 'bolt-crit' : 'bolt-strike', { x: tx });
    BOLTS.splice(i, 1);
  }
}

// The nearest cell still standing, searched in rings out from where the bolt
// hit, so what comes off is a patch rather than a line.
function nearestLive(c0, r0) {
  for (let d = 1; d < 8; d++) {
    for (let dr = -d; dr <= d; dr++) for (let dc = -d; dc <= d; dc++) {
      if (Math.max(Math.abs(dr), Math.abs(dc)) !== d) continue;
      const c = c0 + dc, r = r0 + dr;
      if (c < 0 || r < 0 || c >= sky.cols || r >= sky.rows) continue;
      if (sky.cells[r * sky.cols + c]) return { c, r };
    }
  }
  return null;
}

const at = (c, r) => sky.cells[r * sky.cols + c];
const put = (c, r, v) => {
  const i = r * sky.cols + c;
  if (sky.cells[i] && !v) sky.n--;
  else if (!sky.cells[i] && v) sky.n++;
  sky.cells[i] = v;
};

// Where a cell is in the world, snapped to the lattice: the disc is an odd
// number of cells across, and laid out from its own middle its left edge sits
// half a cell off, which draws a hairline of grey between every cell.
const originX = () => Math.round((sky.x - sky.cols * sky.p / 2) / P) * P;
const originY = () => Math.round((sky.y - sky.rows * sky.p / 2) / P) * P;
export const cellX = c => originX() + c * sky.p;
export const cellY = r => originY() + r * sky.p;

export const meteorAlive = () => S.meteorOpen && sky.n > 0;

// The sky before there is anything in it: the lattice a star gets built in.
// The same state a picked-clean sky is in, so `summoning` and `summon` do not
// have to know which they are looking at.
export function emptySky() {
  const n = Math.max(3, Math.round(sky.r * 2 / P));
  sky.cols = sky.rows = n;
  sky.cells = new Uint8Array(n * n);
  sky.n = 0;
}

export function makeMeteor() {
  const n = Math.max(3, Math.round(sky.r * 2 / P));
  sky.cols = sky.rows = n;
  sky.cells = new Uint8Array(n * n);
  sky.n = 0;
  const mid = (n - 1) / 2;
  const core = mid * METEOR_CORE;
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const d = Math.hypot(c - mid, r - mid);
      if (d > mid + 0.1) continue;
      put(c, r, d <= core ? CORE : RIND);
    }
  }
}

// The star, on the save (persist.js, `SAVERS`): what is left of it is a
// rock half taken apart. The hat on the go is not saved: a spell mid-cast
// has no beginning, so the tower starts it again.
export const SAVE = {
  fields: ['meteorCells', 'summon'],
  write(out) {
    out.meteorCells = sky.cells ? Array.from(sky.cells) : null;
    out.summon = +(S.summon || 0).toFixed(3);
  },
  read(s) {
    if (!S.meteorOpen) return;
    makeMeteor();
    // The cells as they were left, if the save is of this shape of sky.
    if (Array.isArray(s.meteorCells) && s.meteorCells.length === sky.cells.length) {
      sky.cells.set(s.meteorCells);
      sky.n = sky.cells.reduce((n, v) => n + (v ? 1 : 0), 0);
    }
    S.summon = Math.max(0, Math.min(1, s.summon || 0));
  },
  blank() {
    sky.cells = null;
    sky.n = 0;
  }
};

// The cell a wizard takes next: the furthest out from the middle, and of those
// the nearest to the body. Furthest out first is what makes it a rind and a
// core rather than a shaft bored straight to the red. `taken` is the cells
// other bodies are on: without it every wizard picks the same cell.
export function nextCell(fromX, fromY, taken) {
  if (!meteorAlive()) return null;
  const mid = (sky.cols - 1) / 2;
  let best = null, bestD = -1, bestNear = Infinity;
  for (let r = 0; r < sky.rows; r++) {
    for (let c = 0; c < sky.cols; c++) {
      if (!at(c, r)) continue;
      if (taken && taken.has(r * sky.cols + c)) continue;
      const d = Math.hypot(c - mid, r - mid);
      if (d < bestD - 0.5) continue;
      const near = Math.hypot(cellX(c) - fromX, cellY(r) - fromY);
      if (d > bestD + 0.5) { best = { c, r }; bestD = d; bestNear = near; continue; }
      if (near < bestNear) { best = { c, r }; bestD = Math.max(bestD, d); bestNear = near; }
    }
  }
  return best;
}

// One cell off, and what it was made of falls to the ground for the haulers
// to find: nothing is banked up here. Sparks from rind and core alike; the
// core is worth more, which is what makes the digging down worth doing.
export function takeCell(c, r) {
  if (!sky.cells || !at(c, r)) return null;
  const kind = at(c, r);
  put(c, r, 0);
  const x = cellX(c), y = cellY(r);
  const n = kind === CORE ? METEOR_CORE_SPARKS : METEOR_SPARKS;
  for (let i = 0; i < n; i++)
    spawnChip(x, y, bell() * 0.4, 0.2 + rand() * 0.2, someFind(SPARK_CELL));
  // and a burst of the magic that did it, thrown back off the face
  for (let i = 0; i < 5; i++)
    sparkle(x + P / 2, y + P / 2, (rand() - 0.5) * 1.6, (rand() - 0.5) * 1.6, 380);
  // worked out: the wizards make the next one (`summon`)
  if (sky.n === 0) S.summon = 0;
  return kind;
}

// --- calling one down -------------------------------------------------------------
// An empty sky is a job, not a wait: the wizards pour light into the middle
// of it. One body takes `SUMMON_MS`, two take half; nobody up there and the
// charge holds where it is.
export const summoning = () => S.meteorOpen && sky.n === 0;
export const summonAt = () => Math.max(0, Math.min(1, S.summon || 0));

export function summon(hands, secs) {
  if (!summoning() || hands <= 0) return;
  S.summon = summonAt() + (hands * secs * 1000) / SUMMON_MS;
  if (S.summon < 1) return;
  // The flash is a fact about the moment, not a state; the light they poured
  // in comes back out as a ring thrown clear in every direction.
  S.summon = 0;
  S.flashAt = now();
  const out = 44;
  for (let i = 0; i < out; i++) {
    const a = (i / out) * Math.PI * 2 + rand() * 0.1;
    const v = 2.2 + rand() * 2.4;
    sparkle(sky.x, sky.y, Math.cos(a) * v, Math.sin(a) * v, 700 + rand() * 400);
  }
  shakeView(SUMMON_SHAKE);                  // and the ground feels it
  sfx('meteor-call', { x: sky.x, big: true });
  makeMeteor();
}

export function stepMeteor(t) {
  if (!S.meteorOpen) { BOLTS.length = 0; return; }
  if (!sky.cells) { makeMeteor(); return; }
  stepBolts();
}
