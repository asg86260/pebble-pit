// The finale as it is seen (finale.js): the two of them, her gear on its way
// to her station and hung there, the ring ringing out as they go through, the
// fireworks over the walk and the sunset at the far end; and the two of them
// at the yard's end after it. Flat cells on the grid, held steps, the
// portal's purple the one accent; no flash and no shake.

import { S } from '../state.js';
import { P, WORKER, FINALE_LIFT_S, FINALE_LIFT_CELLS, FINALE_HANG_S, FINALE_HANG_STEPS,
         FINALE_TAKE_S, FINALE_TAKE_STEPS, FINALE_RING_S, FINALE_RING_STEPS, FINALE_RING_FROM, FINALE_PAIR_GAP,
         FIREWORK_RISE_S, FIREWORK_STEP_HZ, FIREWORK_TAIL, FIREWORK_DIM, FIREWORKS,
         FINALE_GREYS, FINALE_PURPLE, SUNSET_BAND_S, SUNSET_BANDS, SUNSET_BAND_CELLS, SUNSET_BAND_TONES,
         SUNSET_SIT_S, SUNSET_HEART_S, SUNSET_HEART_FOR_S, SUNSET_SINK_S, SUNSET_SINK_ROWS, SUNSET_SUN_R,
         SUNSET_SUN_OFF, SUNSET_OUT_S, SUNSET_STRIPE_ROWS, SUNSET_RAY_R, FINALE_END_CELLS,
         RETIRED_HOP_S } from '../config.js';
import { now } from '../clock.js';
import { ctx } from './ctx.js';
import { drawBody, drawSaying } from './crew.js';
import { inFront } from './recede.js';
import { recede } from '../cutscene.js';
import { REST, kitOnly, PURPLES, ring } from '../deep/kits.js';
import { keyOf, fighterAt, stationById } from '../deep/party.js';
import { deepPortal } from '../deep/place.js';
import { abyssLine } from '../pit.js';
import { hungAt, pairInYard } from '../finale.js';

const snap = v => Math.round(v / P) * P;
const clamp01 = k => Math.max(0, Math.min(1, k));
const stepped = (k, n) => Math.min(1, Math.ceil(clamp01(k) * n) / n);
const lerp = (a, b, k) => a + (b - a) * k;
const [, G2, G3, G4, G5] = FINALE_GREYS;
const INK = '#000';

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
  for (const o of f.pair) if (o) drawBody(snap(o.x), snap(o.y));
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
// A body sat down: the same square, two cells tall.
function drawSat(x, y) {
  ctx.fillStyle = '#fff';
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
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 1, y + 1, WORKER - 2, WORKER - 2);
  ctx.fillStyle = INK;
}

// The two of them on the yard: out of the pit, down the yard, sat at the end;
// and afterwards, at the yard's end, whatever their turn is. Faded with the
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
    const x = snap(o.x);
    let y = Math.round(o.y);
    if (mode === 'hop') y -= Math.floor(r.u / RETIRED_HOP_S + i) % 2 ? P : 0;
    if (f && f.phase === 'out' && y + WORKER > line) drawUnder(x, y);
    else if (o.sit) drawSat(x, y);
    else drawBody(x, y);
  });
  const [a, b] = pair;
  const sitting = a.sit && b.sit;
  // hand in hand across the cell between them
  if (Math.abs(b.x - a.x - WORKER - FINALE_PAIR_GAP) < 1 && Math.abs(a.y - b.y) < 1
      && (!f || f.phase !== 'out') && mode !== 'hop') {
    ctx.fillStyle = INK;
    ctx.fillRect(snap(a.x) + WORKER, Math.round(a.y) + (sitting ? 2 * P : P), FINALE_PAIR_GAP, P);
  }
  // looking up at the sky: her arm up, pointing
  if (mode === 'look') {
    ctx.fillStyle = INK;
    ctx.fillRect(snap(a.x) - P, Math.round(a.y) - P, P, P);
    ctx.fillRect(snap(a.x) - 2 * P, Math.round(a.y) - 2 * P, P, P);
  }
  const heart = (f && f.phase === 'sunset' && f.u >= SUNSET_HEART_S && f.u < SUNSET_HEART_S + SUNSET_HEART_FOR_S)
             || mode === 'heart';
  if (heart) {
    const rise = f ? Math.floor((f.u - SUNSET_HEART_S) / (SUNSET_HEART_FOR_S / 3)) * P : 0;
    drawSaying(snap((a.x + b.x) / 2), Math.round(Math.min(a.y, b.y)) + (sitting ? P : 0) - rise, { mark: 'heart' });
  }
  ctx.globalAlpha = was;
  ctx.fillStyle = INK;
}

// --- the sunset ----------------------------------------------------------------------------
// How far along it is: the bands up (0..SUNSET_BANDS) and the rows the sun
// has sunk, stepping back out once the sheet is down.
function sunsetNow() {
  const f = S.finale;
  if (!f) return null;
  if (f.phase === 'sunset')
    return { bands: Math.min(SUNSET_BANDS, Math.floor(f.u / SUNSET_BAND_S)),
             sunk: Math.min(SUNSET_SINK_ROWS, Math.floor(Math.max(0, f.u - SUNSET_SIT_S) / SUNSET_SINK_S)) };
  if (f.phase === 'held') return { bands: SUNSET_BANDS, sunk: SUNSET_SINK_ROWS };
  if (f.phase === 'dusk') {
    const k = clamp01(f.u / SUNSET_OUT_S);
    return { bands: SUNSET_BANDS - Math.ceil(k * SUNSET_BANDS),
             sunk: SUNSET_SINK_ROWS + Math.ceil(k * (SUNSET_SUN_R + 1)) };
  }
  return null;
}

// The sky over the horizon filling in grey bands, and the striped sun going
// down behind the yard's end. Behind everything of the yard.
export function drawSunset() {
  const s = sunsetNow();
  if (!s) return;
  const gy = Math.round(S.groundY / P);
  const x0 = Math.floor(S.camX / P) - 1, x1 = Math.ceil((S.camX + S.viewW) / P) + 1;
  for (let j = 0; j < s.bands; j++) {
    ctx.fillStyle = SUNSET_BAND_TONES[j < 2 ? 0 : 1];
    ctx.fillRect(x0 * P, (gy - (j + 1) * SUNSET_BAND_CELLS) * P, (x1 - x0) * P, SUNSET_BAND_CELLS * P);
  }
  // the sun: a solid disc, its lower rows cut into stripes, sunk a row a step
  const cx = FINALE_END_CELLS - SUNSET_SUN_OFF, cy = gy + s.sunk, R = SUNSET_SUN_R;
  ctx.fillStyle = INK;
  for (let y = cy - R; y < gy; y++) {
    for (let x = cx - R; x <= cx + R; x++) {
      if ((x - cx) ** 2 + (y - cy) ** 2 > R * R) continue;
      if (y >= cy - SUNSET_STRIPE_ROWS && y % 2 !== 0) continue;
      ctx.fillRect(x * P, y * P, P, P);
    }
  }
  ctx.fillStyle = FINALE_PURPLE;
  const n = Math.ceil(Math.PI * 2 * SUNSET_RAY_R);
  for (let k = 0; k < n; k += 2) {
    const a = k / n * Math.PI * 2, y = Math.round(cy + Math.sin(a) * SUNSET_RAY_R);
    if (y < gy) ctx.fillRect(Math.round(cx + Math.cos(a) * SUNSET_RAY_R) * P, y * P, P, P);
  }
  ctx.fillStyle = INK;
}

// --- the fireworks ---------------------------------------------------------------------------
// Each off its burst's moment on the finale's clock, in held steps; placed as
// a share of the window, since they go up far off over the yard.
function spark(b, k) { return b < FIREWORK_DIM[0] ? (k % 2 ? FINALE_PURPLE : INK) : b < FIREWORK_DIM[1] ? G3 : G5; }
export function drawFireworks() {
  const f = S.finale;
  if (!f || !f.bursts || !f.bursts.length) return;
  const T = Math.floor(f.T * FIREWORK_STEP_HZ) / FIREWORK_STEP_HZ;
  const ox0 = S.camX, oy0 = S.camY;
  const groundRow = (S.groundY - oy0) / P;
  for (const fw of f.bursts) {
    const a = T - fw.at;
    if (a < 0) continue;
    const X = ox0 + fw.sx * S.viewW, Y = oy0 + fw.sy * S.viewH;
    const c = (dx, dy, tone) => { ctx.fillStyle = tone; ctx.fillRect(X + Math.round(dx) * P, Y + Math.round(dy) * P, P, P); };
    if (a < FIREWORK_RISE_S) {
      const dy = Math.round(lerp(groundRow - fw.sy * S.viewH / P, 0, a / FIREWORK_RISE_S));
      const tail = [INK, G4, G5];
      for (let j = 0; j < FIREWORK_TAIL; j++) c(0, dy + j, tail[j]);
      continue;
    }
    const b = a - FIREWORK_RISE_S, s = FIREWORKS[fw.kind] || FIREWORKS.star;
    if (fw.kind === 'ring') {
      if (b < s.open) {
        const r = 1 + Math.floor(b / s.grow);
        ringAt(c, r, r % 2 ? FINALE_PURPLE : INK, 1);
        if (r > 1) ringAt(c, r - 1, G4, 2);
      } else if (b < s.out) {
        const t = b - s.open;
        for (let k = 0; k < s.sparks; k++) {
          const an = k * Math.PI * 2 / s.sparks, d = s.from + t * s.spread;
          c(Math.cos(an) * d, Math.sin(an) * d + t * t * s.drop, spark(b, k));
        }
      }
    } else if (fw.kind === 'willow') {
      if (b < s.pop) { c(0, 0, FINALE_PURPLE); ringAt(c, 1 + Math.floor(b / (s.pop / 2)), INK, 1); }
      else if (b < s.out) {
        const t0 = b - s.pop, trail = [G2, G3, G4, G5];
        for (let k = 0; k < s.sparks; k++) {
          const an = -Math.PI / 2 + (k - (s.sparks - 1) / 2) * s.fan;
          const at = t => [Math.cos(an) * (2 + t * s.reach), Math.sin(an) * (2 + t * s.reach) * s.squash + t * t * s.drop];
          for (let j = s.trail; j >= 1; j--) {
            const t = t0 - j * s.trailS;
            if (t < 0) continue;
            const [px, py] = at(t);
            c(px, py, b > FIREWORK_DIM[1] ? G5 : trail[j - 1]);
          }
          const [hx, hy] = at(t0);
          c(hx, hy, b > FIREWORK_DIM[1] ? G4 : (k % 3 ? INK : FINALE_PURPLE));
        }
      }
    } else {
      if (b < s.open) {
        const r = 1 + Math.floor(b / s.grow);
        c(0, 0, FINALE_PURPLE);
        for (let k = 0; k < s.spokes; k++) {
          const an = k * Math.PI * 2 / s.spokes;
          for (let j = 1; j <= r; j++) c(Math.cos(an) * j, Math.sin(an) * j, j === r ? FINALE_PURPLE : INK);
        }
      } else if (b < s.out) {
        const t = b - s.open;
        for (let k = 0; k < s.sparks; k++) {
          const an = k * Math.PI * 2 / s.sparks, d = s.from + t * s.spread;
          c(Math.cos(an) * d, Math.sin(an) * d + t * t * s.drop, spark(b, k));
        }
      }
    }
  }
  ctx.fillStyle = INK;
}
// A ring of cells about a burst's middle, every `every`th, none twice.
function ringAt(c, r, tone, every) {
  const n = Math.max(8, Math.ceil(Math.PI * 2 * r)), seen = new Set();
  for (let k = 0; k < n; k += every) {
    const a = k / n * Math.PI * 2, x = Math.round(Math.cos(a) * r), y = Math.round(Math.sin(a) * r);
    if (seen.has(x + ',' + y)) continue;
    seen.add(x + ',' + y);
    c(x, y, tone);
  }
}
