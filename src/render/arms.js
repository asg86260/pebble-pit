// The weapons made of the abyss, as they are seen: a brawler's fists, lances
// of black water flying and stuck, grenades and the rings they burst into,
// sigils on the floor and the lengths of coil they hold, the wizards' beams,
// and the called star, falling through the yard's sky and then the deep's.
//
// All in the abyss's own vocabulary (DESIGN.md, "The magic is the abyss's
// own"): interference, ripples, cells on the lattice. No glow, no gradient:
// a thing is brighter by being drawn on more of its cells, and it fades by
// being drawn on fewer.

import { now } from '../clock.js';
import { P, WORKER, COIL_THICK, LANCE_FLY, GRENADE_R, GRENADE_RING_S,
         LANCE_LEN, RING_CELLS, BEAM_MS, BEAM_WAVE, SIGIL_RX, SIGIL_RY, STAR_TAIL, PUNCH_MS,
         MAGIC_TONES } from '../config.js';
import { S } from '../state.js';
import { coilAt, nearestSeg, deepTop } from '../deep/place.js';
import { TYPE } from '../jobs.js';
import { abyssLine } from '../pit.js';
import { ctx } from './ctx.js';
import { GREYS, PURPLES, bedTop } from './deep.js';
import { inTheDeep } from './crew.js';
import { hash } from './flicker.js';

const snap = v => Math.round(v / P) * P;
const WHITE = GREYS.length - 1;
const cell = (x, y, tone) => { ctx.fillStyle = tone; ctx.fillRect(snap(x), snap(y), P, P); };

// Cells along a line, a cell apart, each handed its distance from the start.
function along(ax, ay, bx, by, fn) {
  const d = Math.hypot(bx - ax, by - ay);
  const n = Math.max(1, Math.round(d / P));
  for (let i = 0; i <= n; i++) fn(ax + (bx - ax) * i / n, ay + (by - ay) * i / n, i, n);
}

// --- the fists --------------------------------------------------------------------
// A brawler at the coil punches it: a fist out of the body toward the nearest
// segment and back, on its own tempo, and a notch of ripple where it lands.
export function drawPunches() {
  const t = now();
  for (const w of S.workers) {
    if (w.type !== TYPE.BRAWL || !inTheDeep(w)) continue;
    const cx = w.x + WORKER / 2, cy = w.y + WORKER / 2;
    const near = nearestSeg(cx, cy, t);
    if (near.d > COIL_THICK + WORKER) continue;
    const p = coilAt(near.seg, t);
    const ph = ((t + hash(w.id ?? w.x) * PUNCH_MS) % PUNCH_MS) / PUNCH_MS;
    const out = ph < 0.5 ? ph * 2 : (1 - ph) * 2;
    const dx = p.x - cx, dy = p.y - cy, d = Math.hypot(dx, dy) || 1;
    const reach = WORKER / 2 + P + out * P * 2;
    // Drawn in the ordinary ink like the body it comes off: the deep's
    // inversion makes both white.
    cell(cx + dx / d * reach - P / 2, cy + dy / d * reach - P / 2, '#000');
    if (out > 0.85) {
      const hx = cx + dx / d * (reach + P), hy = cy + dy / d * (reach + P);
      for (const [ox, oy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) cell(hx + ox * P, hy + oy * P, PURPLES[WHITE - 1]);
    }
  }
  ctx.fillStyle = '#000';
}

// --- lances ---------------------------------------------------------------------
// A shaft of black water: grey cells with a crest of lighter ones running up
// it, and a white point. In the water it is where the thrower's arm sent it,
// pointed at the segment it will stick in; stuck, it rides that segment as
// the coil sways, point buried, and dissolves from the butt toward the point
// over its last second and a half.
export function drawLances() {
  const t = now();
  for (const l of S.lances) {
    const target = l.seg != null ? coilAt(l.seg, t) : null;
    const stuck = target && t >= l.at + LANCE_FLY * 1000;
    const tipX = stuck ? target.x : l.x, tipY = stuck ? target.y : l.y;
    // it points along its flight: from where it came, toward the coil
    let dx = target ? target.x - l.x : 1, dy = target ? target.y - l.y : 0;
    if (stuck) { dx = 1; dy = 0.6; }
    const d = Math.hypot(dx, dy) || 1;
    const ux = dx / d, uy = dy / d;
    const left = l.until ? (l.until - t) / 1500 : 1;
    const n = LANCE_LEN / P;
    for (let i = 0; i < n; i++) {
      // the butt goes first
      if (left < 1 && (n - i) / n > left) continue;
      const x = tipX - ux * i * P, y = tipY - uy * i * P;
      const crest = Math.sin(i * 1.3 - t / 180) > 0.3;
      cell(x, y, i === 0 ? GREYS[WHITE] : crest ? GREYS[9] : GREYS[6]);
    }
  }
  ctx.fillStyle = '#000';
}

// --- grenades and their rings -----------------------------------------------------
// A grenade is the surface's ripples held in a ball: a ring of purple cells
// round a black middle, turning. It bursts into rings that walk out to
// GRENADE_R and thin as they go, a lighter one lagging the first.
export function drawGrenades() {
  const t = now();
  for (const g of S.grenades) {
    const x = snap(g.x), y = snap(g.y);
    const turn = Math.floor(t / 120) % 4;
    const ring = [[0, -1], [1, 0], [0, 1], [-1, 0]];
    ring.forEach(([ox, oy], i) => cell(x + ox * P, y + oy * P, PURPLES[i === turn ? WHITE : WHITE - 3]));
    cell(x, y, GREYS[0]);
  }
  for (const r of S.rings) {
    const k = Math.min(1, (t - r.at) / (GRENADE_RING_S * 1000));
    for (const [lag, ramp] of [[0, PURPLES], [0.25, GREYS]]) {
      const kk = k - lag;
      if (kk <= 0) continue;
      const rad = kk * GRENADE_R;
      const n = Math.max(6, Math.round(RING_CELLS * kk));
      for (let i = 0; i < n; i++) {
        // thinner the further it has gone
        if (hash(i * 7.3 + r.at) < kk * 0.6) continue;
        const a = i / n * Math.PI * 2 + kk;
        cell(r.x + Math.cos(a) * rad, r.y + Math.sin(a) * rad, ramp[WHITE - (i % 3)]);
      }
    }
  }
  ctx.fillStyle = '#000';
}

// --- sigils -----------------------------------------------------------------------
// A circle drawn on the floor, seen edge-on: a flat ring of purple cells
// lying on the scales, marks inside it, and a thread of it rising to the
// length of coil it holds.
export function drawSigils() {
  const t = now();
  for (const s of S.sigils) {
    const cx = snap(s.x), floor = bedTop(cx) - P;
    const n = Math.round(SIGIL_RX * 2 / P) * 2;
    for (let i = 0; i < n; i++) {
      const a = i / n * Math.PI * 2;
      const lit = Math.sin(a * 3 - t / 400) > 0.5;
      cell(cx + Math.cos(a) * SIGIL_RX, floor - SIGIL_RY + Math.sin(a) * SIGIL_RY, PURPLES[lit ? WHITE : WHITE - 2]);
    }
    for (let m = -2; m <= 2; m += 2) cell(cx + m * P, floor - SIGIL_RY - (hash(cx + m) > 0.5 ? P : 0), GREYS[9]);
    // the thread: every other cell, up to the underside of the coil
    const seg = nearestSeg(cx, floor, t);
    const p = coilAt(seg.seg, t);
    for (let y = floor - SIGIL_RY * 2; y > p.y + COIL_THICK / 2 + P; y -= P * 2)
      cell(cx, y, PURPLES[WHITE - 4]);
  }
  ctx.fillStyle = '#000';
}

// --- beams ------------------------------------------------------------------------
// A wizard's beam: the interference drawn as a line, from the wizard to the
// segment it lights, crests travelling down it toward the coil.
export function drawBeams() {
  const t = now();
  for (const b of S.beams) {
    const p = coilAt(b.seg, t);
    along(b.x, b.y, p.x, p.y, (x, y, i) => {
      const f = Math.sin(i * BEAM_WAVE * P - t / BEAM_MS * Math.PI * 2);
      if (f > 0.35) cell(x, y, PURPLES[WHITE]);
      else if (f > -0.3) cell(x, y, GREYS[8]);
    });
  }
  ctx.fillStyle = '#000';
}

// --- the called star --------------------------------------------------------------
// A cross of cells with a tail straight up behind it, thinning. In the yard
// it falls through the sky in the magic tones and goes into the pit; in the
// deep it comes down through the underside of the surface onto the coil.
function drawStarAt(x, y, core, tones) {
  const cx = snap(x), cy = snap(y);
  for (let i = 1; i <= STAR_TAIL; i++) {
    if (hash(i + now() / 90) < i / STAR_TAIL) continue;
    cell(cx, cy - i * P, tones[Math.min(tones.length - 1, i >> 1)]);
  }
  for (const [ox, oy] of [[0, -1], [-1, 0], [1, 0], [0, 1]]) cell(cx + ox * P, cy + oy * P, tones[0]);
  cell(cx, cy, core);
}

export function drawStarYard() {
  const s = S.starFall;
  if (!s || s.y >= abyssLine()) return;
  drawStarAt(s.x, s.y, '#fff', MAGIC_TONES);
  ctx.fillStyle = '#000';
}

export function drawStarDeep() {
  const s = S.starFall;
  if (!s || s.y < deepTop()) return;
  drawStarAt(s.x, s.y, GREYS[WHITE], [PURPLES[WHITE], PURPLES[WHITE - 1], PURPLES[WHITE - 2], PURPLES[WHITE - 3]]);
  ctx.fillStyle = '#000';
}
