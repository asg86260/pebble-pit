// The finale as it is seen (finale.js): the two of them, her gear on its way
// to her station and hung there, the ring ringing out as they go through, the
// fireworks over the walk and the volley and the heart at the door; the
// crowd's smears and dust, what the builders carry; and the two of them at
// the house after it. Flat cells on the grid, held steps, the portal's purple
// the one accent; no flash and no shake. The house itself is render/home.js.

import { S } from '../state.js';
import { P, WORKER, FINALE_LIFT_S, FINALE_LIFT_CELLS, FINALE_HANG_S, FINALE_HANG_STEPS,
         FINALE_TAKE_S, FINALE_TAKE_STEPS, FINALE_RING_S, FINALE_RING_STEPS, FINALE_RING_FROM, FINALE_PAIR_GAP,
         FIREWORK_RISE_S, FIREWORK_LIFE_S, FIREWORK_STEP_HZ, FIREWORK_SMOKE_S, FIREWORK_DIM, FIREWORKS,
         FINALE_GREYS, FINALE_PURPLE, FINALE_PURPLE_DARK, FINALE_PURPLE_LIGHT } from '../config.js';
import { now } from '../clock.js';
import { ctx } from './ctx.js';
import { drawBody, drawSaying, lookFor } from './crew.js';
import { dressBehind, dressOn, dressHead } from './wardrobe.js';
import { inFront } from './recede.js';
import { recede } from '../cutscene.js';
import { REST, kitOnly, PURPLES, ring } from '../deep/kits.js';
import { keyOf, fighterAt, stationById } from '../deep/party.js';
import { deepPortal } from '../deep/place.js';
import { abyssLine } from '../pit.js';
import { hungAt, pairInYard } from '../finale.js';
import { lerp } from '../motion.js';

const snap = v => Math.round(v / P) * P;
const clamp01 = k => Math.max(0, Math.min(1, k));
const stepped = (k, n) => Math.min(1, Math.ceil(clamp01(k) * n) / n);
const [, G2, G3, G4, G5, G6] = FINALE_GREYS;
const INK = '#000', PU = FINALE_PURPLE, PUD = FINALE_PURPLE_DARK, PUL = FINALE_PURPLE_LIGHT, WHITE = '#fff';

// A station's kit with no body in it, the body's top-left at (x, y) pixels.
function kitAt(st, x, y) {
  const key = keyOf(st);
  if (!key || !REST[key]) return;
  kitOnly(() => REST[key](ctx, x / P, y / P, st.rung || 0, now() / 1000));
}

// --- in the deep -------------------------------------------------------------------
// The gear hung on a station, and its taking up: off the prop and onto the
// one who took the station, in held steps (deep/classes.js, `takeUp`).
export function drawHungKits() {
  if (S.view !== 'deep') return;
  const f = S.finale;
  for (const st of S.stations || []) {
    if (!st.built || !st.hung) continue;
    // still coming off her: the finale's own drawing has it
    if (f && f.st === st.id && (f.phase === 'swim' || f.phase === 'lift' || f.phase === 'hang')) continue;
    const at = hungAt(st), w = st.takeAt != null ? fighterAt(st) : null;
    if (!w) { kitAt(st, at.x, at.y); continue; }
    const k = stepped((now() - st.takeAt) / 1000 / FINALE_TAKE_S, FINALE_TAKE_STEPS);
    kitAt(st, snap(lerp(at.x, w.x, k)), snap(lerp(at.y, w.y, k)));
  }
  ctx.fillStyle = INK;
}

// The two of them in the deep, the gear coming off her, the heart, and the
// ring as they go through.
export function drawFinaleDeep() {
  const f = S.finale;
  if (!f || S.view !== 'deep') return;
  const st = f.st ? stationById(f.st) : null;
  if ((f.phase === 'lift' || f.phase === 'hang') && st && f.kit) {
    const up = f.kit.y - FINALE_LIFT_CELLS * P;
    if (f.phase === 'lift') kitAt(st, f.kit.x, snap(lerp(f.kit.y, up, stepped(f.u / FINALE_LIFT_S, FINALE_LIFT_CELLS))));
    else {
      const to = hungAt(st), k = stepped(f.u / FINALE_HANG_S, FINALE_HANG_STEPS);
      kitAt(st, snap(lerp(f.kit.x, to.x, k)), snap(lerp(up, to.y, k)));
    }
  }
  const deepPhase = ['swim', 'lift', 'hang', 'heart', 'heir', 'up', 'ring', 'through'].includes(f.phase);
  if (!deepPhase) return;
  f.pair.forEach((o, i) => { if (o) drawBody(snap(o.x), snap(o.y), lookFor(WHO[i], KEYS[i], o.x, { face: o.face, deep: true })); });
  const [a, b] = f.pair;
  if (f.phase === 'heart' && a && b) drawSaying(snap((a.x + b.x) / 2), snap(Math.min(a.y, b.y)), { mark: 'heart' });
  if (f.phase === 'ring') {
    // widening rings of the portal's purple, a cell a step
    const pc = deepPortal(), n = Math.floor(f.u / FINALE_RING_S * FINALE_RING_STEPS);
    const r0 = pc.r / P + FINALE_RING_FROM;
    ring(ctx, pc.x / P, pc.y / P, r0 + n, PURPLES[Math.max(5, 11 - n)], 2);
    if (n > 0) ring(ctx, pc.x / P, pc.y / P, r0 + n - 1, PURPLES[Math.max(3, 8 - n)], 3);
  }
  ctx.fillStyle = INK;
}

// --- in the yard -----------------------------------------------------------------------
// The two of them by their place in the pair, her first, and a key apiece to
// read each one's walk off (`motionOf`): the pair's objects are made anew
// every frame.
const WHO = ['sqouse', 'you'], KEYS = [{}, {}];
// A body drawn by one of the shapes below, with what it wears round it; the
// square of (WORKER, h) stood with its top-left at (x, y).
function dressed(x, y, look, draw, h = WORKER) {
  if (look) dressBehind(ctx, x, y, look, h);
  draw();
  if (look) { dressOn(ctx, x, y, look, WORKER, h); dressHead(ctx, x, y, look); }
  ctx.fillStyle = INK;
}
// Under the liquid the body is drawn as the deep draws one, and so is what
// it wears: white marks on its black.
const UNDER = { ink: WHITE, paper: INK, grey: G4, pale: G2 };
// A body sat down: the same square, two cells tall.
function drawSat(x, y) {
  ctx.fillStyle = WHITE;
  ctx.fillRect(x + 1, y + P + 1, WORKER - 2, WORKER - P - 2);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 1, y + P + 1, WORKER - 2, WORKER - P - 2);
  ctx.fillStyle = INK;
}
// A body under the drowned pit's surface, as the deep draws one: white
// round a black square.
function drawUnder(x, y) {
  ctx.fillStyle = INK;
  ctx.fillRect(x + 1, y + 1, WORKER - 2, WORKER - 2);
  ctx.strokeStyle = WHITE;
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 1, y + 1, WORKER - 2, WORKER - 2);
  ctx.fillStyle = INK;
}
// A body going into the lit room or coming out of it, `dim` steps in: its
// outline going over to the room's purples, filled with the room.
function drawDim(x, y, dim) {
  ctx.fillStyle = PUL;
  ctx.fillRect(x + 1, y + 1, WORKER - 2, WORKER - 2);
  ctx.strokeStyle = [INK, G2, PUD, PUL][dim] || PUD;
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 1, y + 1, WORKER - 2, WORKER - 2);
  ctx.fillStyle = INK;
}
const cellAt = (x, y, tone) => { ctx.fillStyle = tone; ctx.fillRect(x, y, P, P); };

// A hop's smears and a landing's dust round a body stood with its top-left
// at (x, y) (render/crew.js): the smear in the row the body has just left,
// the dust either side of its feet.
export function drawHopMarks(x, y, pose) {
  if (pose.smear === 'under') {
    cellAt(x, y + 2 * P, G6); cellAt(x + P, y + 2 * P, G5); cellAt(x + 2 * P, y + 2 * P, G6);
  } else if (pose.smear === 'over') {
    cellAt(x, y - 2 * P, G6); cellAt(x + P, y - 2 * P, G5); cellAt(x + 2 * P, y - 2 * P, G6);
  }
  if (pose.dust) { cellAt(x - P, y + 2 * P, G4); cellAt(x + WORKER, y + 2 * P, G4); }
  ctx.fillStyle = INK;
}
// A builder's arms up and what it carries over its head (render/crew.js):
// the piece as a bar its own width (a board, a tile row, the window's frame),
// or the bundle off the pile while it carries that down the yard.
export function drawHeldPiece(x, y, hold, arms) {
  if (arms) { cellAt(x - P, y - P, INK); cellAt(x + WORKER, y - P, INK); }
  if (hold) {
    const w = hold === 'bundle' ? 4 : Math.min(hold.kind === 'plank' ? 8 : 5, hold.w + 1);
    const left = x + Math.round((WORKER - w * P) / 2 / P) * P, top = y - (arms ? 3 : 2) * P;
    ctx.fillStyle = hold === 'bundle' ? G3 : hold.kind === 'wall' ? INK : hold.kind === 'window' ? WHITE : G3;
    ctx.fillRect(left, top, w * P, P);
    if (hold === 'bundle') { ctx.fillStyle = G4; ctx.fillRect(left, top - P, w * P, P); }
    if (hold !== 'bundle' && hold.kind === 'window') cellAt(left - P, top, G3);
  }
  ctx.fillStyle = INK;
}

// The two of them on the yard: out of the pit, down the yard, in at the
// door; and afterwards, at the house, whatever their turn is. Faded with the
// bystanders while some other scene holds the yard.
export function drawFinaleYard() {
  const pair = pairInYard();
  if (!pair) return;
  const was = ctx.globalAlpha;
  const ink = inFront() ? 1 : 1 - recede();
  if (ink <= 0) return;
  ctx.globalAlpha = was * ink;
  const f = S.finale, r = S.retired;
  const mode = !f && r ? r.mode : null;
  const line = abyssLine();
  pair.forEach((o, i) => {
    if (!o) return;
    const x = Math.round(o.x), y = Math.round(o.y);
    // What they wear goes with them through each of these (render/wardrobe.js):
    // in the liquid's inks under the surface, in the door's as they go in,
    // on the squashed square sat down.
    const look = lookFor(WHO[i], KEYS[i], o.x, { face: o.face || null });
    if (f && f.phase === 'out' && y + WORKER > line) dressed(x, y, look && { ...look, inks: UNDER }, () => drawUnder(x, y));
    else if (o.dim) dressed(x, y, look && { ...look, inks: { ...look.inks, ink: [INK, G2, PUD, PUL][o.dim] || PUD, paper: PUL } }, () => drawDim(x, y, o.dim));
    else if (o.sit) dressed(x, y + P, look, () => drawSat(x, y), WORKER - P);
    else drawBody(x, y, look);
  });
  const [a, b] = pair;
  // hand in hand across the cell between them
  if (a && b && !a.dim && !b.dim && !a.sit && Math.abs(b.x - a.x - WORKER - FINALE_PAIR_GAP) < 1
      && Math.abs(a.y - b.y) < 1 && (!f || f.phase !== 'out')) {
    ctx.fillStyle = INK;
    ctx.fillRect(Math.round(a.x) + WORKER, Math.round(a.y) + P, FINALE_PAIR_GAP, P);
  }
  if (mode === 'heart' && a && b) drawSaying(Math.round((a.x + b.x) / 2), Math.round(Math.min(a.y, b.y)) + P, { mark: 'heart' });
  ctx.globalAlpha = was;
  ctx.fillStyle = INK;
}

// --- the fireworks ---------------------------------------------------------------------------
// Each off its burst's moment on the finale's clock, in held steps; placed as
// a share of the window, since they go up far off over the yard, or over the
// house for the volley and the heart. Every cell a whole cell.
function fade(b, k, base) {
  return b < FIREWORK_DIM[0] ? (k % 3 === 0 ? PU : base) : b < FIREWORK_DIM[1] ? G3 : b < FIREWORK_DIM[2] ? G4 : G5;
}
export function drawFireworks() {
  const f = S.finale;
  if (!f || !f.bursts || !f.bursts.length) return;
  const T = Math.floor(f.T * FIREWORK_STEP_HZ + 1e-6) / FIREWORK_STEP_HZ;
  for (const fw of f.bursts) drawShell(fw, T);
  ctx.fillStyle = INK;
}
function drawShell(fw, T) {
  const rise = fw.rise || FIREWORK_RISE_S, a = T - fw.at;
  if (a < 0 || a > rise + FIREWORK_LIFE_S) return;
  const X = fw.wx != null ? fw.wx : Math.round(S.camX + fw.sx * S.viewW);
  const Y = Math.round(S.camY + fw.sy * S.viewH);
  const c = (dx, dy, tone) => { if (!tone) return; ctx.fillStyle = tone; ctx.fillRect(X + Math.round(dx) * P, Y + Math.round(dy) * P, P, P); };
  const ringAt = (cx, cy, r, tone, every = 1) => {
    const n = Math.max(8, Math.ceil(Math.PI * 2 * r)), seen = new Set();
    for (let k = 0; k < n; k += every) {
      const an = k / n * Math.PI * 2, x = Math.round(cx + Math.cos(an) * r), y = Math.round(cy + Math.sin(an) * r);
      if (seen.has(x + ',' + y)) continue;
      seen.add(x + ',' + y);
      c(x, y, tone);
    }
  };
  // The rocket: up from the ground, leaving a cell of smoke at every held
  // step, greying out where it hangs.
  const gy = Math.round((S.groundY - Y) / P) - 1;
  const n = Math.floor(Math.min(a, rise) * FIREWORK_STEP_HZ + 1e-6);
  for (let j = 0; j <= n; j++) {
    const age = a - j / FIREWORK_STEP_HZ;
    if (age > FIREWORK_SMOKE_S[2]) continue;
    const ry = Math.round(lerp(gy, 0, j / FIREWORK_STEP_HZ / rise));
    c(0, ry + 1, age < FIREWORK_SMOKE_S[0] ? G4 : age < FIREWORK_SMOKE_S[1] ? G5 : G6);
  }
  if (a < rise) { c(0, Math.round(lerp(gy, 0, a / rise)), INK); return; }
  const b = a - rise, s = FIREWORKS[fw.kind] || FIREWORKS.peony;
  if (fw.kind === 'ring') {
    if (b < s.open) {
      const r = s.r0 + Math.floor(b / s.grow);
      if (r > s.r0) ringAt(0, 0, r - 1, G4, 2);
      ringAt(0, 0, r, r % 2 ? PU : INK, 1);
    } else if (b < s.out) {
      const u = b - s.open;
      for (let k = 0; k < s.sparks; k++) {
        const an = k * Math.PI * 2 / s.sparks, d = s.from + u * s.spread;
        c(Math.cos(an) * d, Math.sin(an) * d + u * u * s.drop, fade(b, k, INK));
      }
    }
  } else if (fw.kind === 'willow') {
    if (b < s.pop) { c(0, 0, PU); ringAt(0, 0, s.r0 + Math.floor(b / (s.pop / 2)), INK, 2); }
    else if (b < s.out) willow(c, b - s.pop, b, s);
  } else if (fw.kind === 'crossette') {
    const r = Math.min(s.r, 1 + Math.floor(b / s.grow));
    if (b < s.open) {
      c(0, 0, PU);
      for (let k = 0; k < s.arms; k++) {
        const an = -Math.PI / 2 + k * 2 * Math.PI / s.arms;
        for (let j = 1; j <= r; j++)
          c(Math.cos(an) * j, Math.sin(an) * j, j === r ? (b < s.purpleS ? PU : INK) : j > r - 2 ? G3 : null);
      }
    } else if (b < s.out) {
      const u = b - s.open, d = Math.min(s.cross, Math.floor(u / s.crossS));
      for (let k = 0; k < s.arms; k++) {
        const an = -Math.PI / 2 + k * 2 * Math.PI / s.arms;
        const hx = Math.cos(an) * s.r, hy = Math.sin(an) * s.r + u * u * s.drop;
        if (u < s.split) { c(hx, hy, WHITE); ringAt(hx, hy, 1, PU, 2); continue; }
        for (let q = 0; q < 4; q++) {
          const aq = an + Math.PI / 4 + q * Math.PI / 2, dy = u * u * s.crossDrop;
          c(hx + Math.cos(aq) * d, hy + Math.sin(aq) * d + dy, fade(b - s.crossFade, q + k, INK));
          if (d > 1 && u < s.trailS) c(hx + Math.cos(aq) * (d - 1), hy + Math.sin(aq) * (d - 1) + dy, G4);
        }
      }
    }
  } else if (fw.kind === 'peony') {
    const r = Math.min(s.r, s.r0 + Math.floor(b / s.grow));
    if (b < s.open) {
      ctx.fillStyle = b < s.coreS ? PU : PUD;
      ctx.fillRect(X - P, Y - P, 3 * P, 3 * P);
      for (let k = 0; k < s.spokes; k++) {
        const an = k * Math.PI * 2 / s.spokes;
        c(Math.cos(an) * r, Math.sin(an) * r, k % 4 === 0 ? PU : INK);
        if (r > s.inner + 1) c(Math.cos(an) * (r - s.inner), Math.sin(an) * (r - s.inner), G4);
      }
    } else if (b < s.out) {
      const u = b - s.open;
      for (let k = 0; k < s.spokes; k++) {
        const an = k * Math.PI * 2 / s.spokes;
        c(Math.cos(an) * (s.r + u), Math.sin(an) * (s.r + u) + u * u * s.drop, fade(b - s.fade, k, INK));
      }
    }
  } else if (fw.kind === 'ringwillow') {
    const r = Math.min(s.r, 1 + Math.floor(b / s.grow));
    if (b < s.open) {
      // a single purple cell until the ring is wide enough not to read as a body
      if (r < s.solid) c(0, 0, PU);
      else { ringAt(0, 0, r, INK); if (r > s.inner + 1) ringAt(0, 0, r - s.inner, PU); }
    } else if (b < s.out) {
      const u = b - s.open, tones = [G2, G3, G3, G4, G5, G6];
      for (let k = 0; k < s.sparks; k++) {
        const an = k * Math.PI * 2 / s.sparks;
        for (let j = s.trail; j >= 0; j--) {
          const s2 = Math.max(0, u - j * s.trailS);
          const px = Math.cos(an) * (s.r + s2 * s.spreadX), py = Math.sin(an) * (s.r + s2 * s.spreadY) + s2 * s2 * s.drop;
          c(px, py, j === 0 ? (u < s.headS ? (k % 2 ? INK : PU) : G4) : u > s.paleS ? G6 : tones[j]);
        }
      }
    }
  } else if (fw.kind === 'heart') {
    const pts = [];
    for (let k = 0; k < s.points; k++) {
      const q = k / s.points * Math.PI * 2;
      pts.push([Math.pow(Math.sin(q), 3), -(13 * Math.cos(q) - 5 * Math.cos(2 * q) - 2 * Math.cos(3 * q) - Math.cos(4 * q)) / 16]);
    }
    const big = s.sizes[s.sizes.length - 1];
    if (b < s.held) {
      const sc = s.sizes[Math.min(s.sizes.length - 1, Math.floor(b / s.stepS))];
      pts.forEach(([px, py], k) => c(px * sc, py * sc, b < s.greyS ? (k % 2 ? PU : PUD) : G3));
    } else if (b < s.out) {
      const u = b - s.held;
      pts.forEach(([px, py], k) => c(px * big, py * big + u * u * s.drop, fade(u + s.greyS, k, PU)));
    }
  }
}
// A willow's sparks drooping from its pop in long grey trails.
function willow(c, t0, b, s) {
  const trail = [G2, G3, G4, G5];
  for (let k = 0; k < s.sparks; k++) {
    const an = -Math.PI / 2 + (k - (s.sparks - 1) / 2) * s.fan;
    const at = t => [Math.cos(an) * (s.r0 + t * s.reach), Math.sin(an) * (s.r0 + t * s.reach) * s.squash + t * t * s.drop];
    for (let j = s.trail; j >= 1; j--) {
      const t = t0 - j * s.trailS;
      if (t < 0) continue;
      const [px, py] = at(t);
      c(px, py, b > FIREWORK_DIM[1] ? G5 : trail[j - 1]);
    }
    const [hx, hy] = at(t0);
    c(hx, hy, b > FIREWORK_DIM[1] ? G4 : (k % 3 ? INK : PU));
  }
}
