// MOCK act-3-the-intro
// Throwaway review code, never merged: the owner's "the boulder should spawn
// off screen, not 2 feet above the house, the boulder should have some flames
// like a meteorite", as three entries on the review bench. The rock and its
// flame are one drawing on the rock's own cell grid, placed at its true
// (fractional) spot each frame, so it moves smoothly and never shears; what
// it leaves behind (embers, smoke, the puff) are single cells that fade by
// opacity. `globalThis.__intro3Mock` picks the option (actbeats.js holds
// the timing); null is the game as it is.
//   a  a steep dive from off the top, a streaming flame tail, a dust puff
//   b  a long arc in from off the right, embers left along it fading, smoke
//   c  a shadow swelling on the ground first, then the rock glowing in from
//      far above; on impact its glow and flames burn out on it

import { S } from '../state.js';
import { P, FINALE_HOUSE_W, ACT_ROCK_W, ACT_ROCK_H, INTRO3_MOCK, INTRO3_FLAME, INTRO3_SMOKE, GREY } from '../config.js';
import { ctx } from './ctx.js';
import { hash } from './flicker.js';
import { light } from '../ink.js';
import { houseX } from '../home.js';
import { held } from '../reset.js';

const W = ACT_ROCK_W, H = ACT_ROCK_H;
const opt = () => INTRO3_MOCK[globalThis.__intro3Mock] ? globalThis.__intro3Mock : null;
export const intro3On = () => !!opt();

// A world x or y put on the device's pixel, so a cell drawn there has crisp
// edges and the shape's cells sit flush; the spot itself moves freely.
const onPx = (v, cam) => { const z = S.zoom * (S.dpr || 1); return cam + Math.round((v - cam) * z) / z; };
function cell(x, y, tone, a = 1) {
  if (a <= 0) return;
  const was = ctx.globalAlpha;
  ctx.globalAlpha = was * Math.min(1, a);
  ctx.fillStyle = tone;
  ctx.fillRect(x, y, P, P);
  ctx.globalAlpha = was;
}
const fire = i => light(INTRO3_FLAME[Math.max(0, Math.min(INTRO3_FLAME.length - 1, i))]);

const inRock = (c, r, grow = 0) => {
  if (c < -grow || r < -grow || c >= W + grow || r >= H + grow) return false;
  const u = (c + 0.5 + grow) / (W + grow * 2) * 2 - 1, v = (r + 0.5 + grow) / (H + grow * 2) * 2 - 1;
  return u * u + Math.max(0, v) * v * 0.15 + Math.min(0, v) * v <= 1;
};

// Where the rock rests (its top-left), as portals.js draws it at rest.
const restAt = () => ({ x: Math.round((houseX() + FINALE_HOUSE_W * P / 2 - W * P / 2) / P) * P,
                        y: Math.round(S.groundY / P) * P - H * P });

// The start, worked out once a fall off the camera standing then, so the
// rock and the whole of its flame begin outside the view.
let start = null; // held: the fall's start, cleared each frame no fall plays
held('intro3mock-start', () => { start = null; });
function startOf(o, rest) {
  const c = INTRO3_MOCK[o], reach = (c.trail + c.flare + 2) * P;
  if (o === 'b') {
    return { x: S.camX + S.viewW + c.margin * P + reach, y: S.camY + S.viewH * 0.08 };
  }
  const y = S.camY - H * P - reach - c.margin * P;
  return { x: rest.x + (rest.y - y) * c.drift, y };
}
// The rock's top-left `k` of the way down (0..1), on its path.
function pathAt(o, k, rest) {
  const c = INTRO3_MOCK[o], s = start, e = Math.pow(Math.max(0, Math.min(1, k)), c.ease);
  if (o === 'b') {
    // a thrown curve: out level from the side, bending down onto the ruin
    const cx = s.x + (rest.x - s.x) * 0.55, cy = s.y + (rest.y - s.y) * 0.05;
    const q = 1 - e;
    return { x: q * q * s.x + 2 * q * e * cx + e * e * rest.x, y: q * q * s.y + 2 * q * e * cy + e * e * rest.y };
  }
  return { x: s.x + (rest.x - s.x) * e, y: s.y + (rest.y - s.y) * e };
}

// The flame on the rock's own grid, streaming away from the way it moves
// (`bx`, `by`, a unit vector pointing back). It sways in shape on held,
// hashed beats and never in brightness (PROP_FLAME's rule); `len` and `a`
// let it burn out.
function flame(x0, y0, bx, by, len, flare, t, a = 1, rim = 1, down = false) {
  const nx = -by, ny = bx;
  const hw = Math.hypot(W / 2 * nx, H / 2 * ny), R = Math.hypot(W / 2 * bx, H / 2 * by);
  const beat = Math.floor(t / 0.09), reach = Math.ceil(R + len + flare + 2);
  const c0 = Math.floor(W / 2 - reach), c1 = Math.ceil(W / 2 + reach), r0 = Math.floor(H / 2 - reach), r1 = Math.ceil(H / 2 + reach);
  // (down on the ground, nothing of it below the rock's foot)
  for (let r = r0; r < (down ? H : r1); r++) {
    for (let c = c0; c < c1; c++) {
      if (inRock(c, r)) continue;
      const dx = c + 0.5 - W / 2, dy = r + 0.5 - H / 2;
      const al = dx * bx + dy * by, pe = Math.abs(dx * nx + dy * ny);
      // the rim hugging the rock: white-hot on its leading face
      if (inRock(c, r, rim)) { cell(x0 + c * P, y0 + r * P, fire(al < -R * 0.2 ? 0 : 1), a); continue; }
      if (al < R * 0.2 || len <= 0) continue;
      const far = Math.max(0, al - R) / len;
      const sway = (hash(Math.round(al) * 3.1 + beat * 7.7) - 0.5) * 2.2;
      const half = (hw + flare) * Math.pow(Math.max(0, 1 - far), 1.4) + sway * (0.4 + far);
      if (pe > half || far > 1 + hash(beat * 1.3 + c * 0.7) * 0.2) continue;
      // a white core down the middle near the rock, red out to the edge and
      // down the run, the last of it smoke
      const core = pe < half * 0.4 && far < 0.3 ? 0 : 1;
      const edge = pe > half - 1 ? 1 : 0;
      if (far < 0.75) cell(x0 + c * P, y0 + r * P, fire(core === 0 ? 0 : Math.min(3, 1 + Math.floor(far * 2.7) + edge)), a);
      else cell(x0 + c * P, y0 + r * P, INTRO3_SMOKE[1], a * (1 - (far - 0.75) / 0.45));
    }
  }
}

// The meteor while the fall plays and its hold after; true when it drew (so
// portals.js draws nothing of its own), false to leave the rock to it.
export function drawIntro3(f, rockCells, drawRuinRock) {
  const o = opt();
  if (!o || !f || f.rock < 0) { start = null; return false; }
  const c = INTRO3_MOCK[o], rest = restAt();
  if (!start) {
    start = startOf(o, rest);
    // readout for the review's own check: the start box against the view
    globalThis.__intro3Start = { x: start.x, y: start.y, w: W * P, h: H * P, reach: (c.trail + c.flare + 2) * P,
                                 camX: S.camX, camY: S.camY, viewW: S.viewW, viewH: S.viewH };
  }
  const t = f.u || 0;
  if (f.rock < 1) {
    const k = f.rock, at = pathAt(o, k, rest), was = pathAt(o, Math.max(0, k - 0.02), rest);
    let bx = was.x - at.x, by = was.y - at.y; const d = Math.hypot(bx, by);
    if (d < 1e-6) { bx = 0; by = -1; } else { bx /= d; by /= d; }
    if (o === 'b') embers(c, k, rest, t);
    if (o === 'c') shadow(c, k, rest);
    const x0 = onPx(at.x, S.camX), y0 = onPx(at.y, S.camY);
    flame(x0, y0, bx, by, c.trail, c.flare, t, 1, o === 'c' ? 2 : 1);
    rockCells(x0, y0, H);
    return true;
  }
  // the impact, held: the rock at rest, what it brought burning out on it
  const u = t;
  if (o === 'b') { embers(c, 1, rest, u + c.fallS); smoke(c, rest, u); }
  drawRuinRock();
  const burn = Math.max(0, 1 - u / 0.7);
  if (o === 'a') { flame(rest.x, rest.y, 0, -1, c.trail * burn, c.flare * (1 + (1 - burn) * 2), u + 9, burn, 1, true); puff(rest, u); }
  if (o === 'b') flame(rest.x, rest.y, 0.6, -0.8, c.trail * burn, c.flare, u + 9, burn, 1, true);
  if (o === 'c') cool(c, rest, u);
  return true;
}

// B: cells shed along the way it came, each fading where it was left.
function embers(c, k, rest, t) {
  const n = 70;
  for (let i = 0; i < n; i++) {
    const s = i / n;
    if (s > k) break;
    const age = (k - s) * c.fallS + Math.max(0, t - c.fallS);
    const a = 1 - age / c.embers;
    if (a <= 0) continue;
    const p = pathAt('b', s, rest), h = hash(i * 5.3);
    const x = Math.round((p.x + W * P / 2 + (h - 0.5) * H * P * 0.8) / P) * P;
    const y = Math.round((p.y + H * P / 2 + (hash(i * 2.9) - 0.5) * H * P * 0.8) / P) * P;
    const tone = h < 0.35 ? fire(1) : h < 0.6 ? fire(3) : INTRO3_SMOKE[0];
    cell(x, y, tone, a);
  }
}
// B: smoke off the rock once it lies there, cells drifting up and thinning.
function smoke(c, rest, u) {
  for (let i = 0; i < c.smoke; i++) {
    const born = (i / c.smoke) * c.holdS * 0.8, age = u - born;
    if (age < 0) continue;
    const life = 1.8, a = 1 - age / life;
    if (a <= 0) continue;
    // a puff of four cells, spreading as it climbs
    const x = rest.x + (W / 2 + (hash(i * 4.1) - 0.5) * W * 0.5 + Math.sin(age * 2.4 + i) * 1.2) * P;
    const y = rest.y + P * 2 - age * P * 8;
    const gap = P * (1 + age * 0.6);
    for (const [ox, oy] of [[0, 0], [gap, 0], [0, -gap], [gap, -gap]])
      cell(onPx(x + ox, S.camX), onPx(y + oy, S.camY), INTRO3_SMOKE[i % 3], a * 0.85);
  }
}
// A: the dust thrown out along the ground both ways, and up, thinning.
function puff(rest, u) {
  const q = Math.min(1, u / 1.4), e = 1 - (1 - q) * (1 - q), floor = rest.y + H * P - P;
  for (let i = 0; i < 36; i++) {
    const side = i % 2 ? 1 : -1, j = Math.floor(i / 2);
    const x = rest.x + W * P / 2 + side * (W * P / 2 - P * 2 + (1 + (j % 9) * 1.4) * e * P * 2.4) - P / 2;
    const y = floor - (j % 5) * e * P * 1.6 - e * P * 2 * (j >= 9 ? 1 + (j % 3) : 0);
    cell(onPx(x, S.camX), onPx(y, S.camY), INTRO3_SMOKE[j % 3], 1 - q);
  }
}
// C: the shadow on the ground where it will land, swelling as it comes.
// (on the ground's face under its line, where nothing standing covers it)
function shadow(c, k, rest) {
  const floor = rest.y + H * P, cx = rest.x + W * P / 2;
  const half = Math.max(1, Math.round((W / 2 + 3) * Math.min(1, 0.2 + k)));
  for (let i = -half; i < half; i++) cell(cx + i * P, floor, GREY[9], c.shadow * Math.min(1, k * 1.4));
  for (let i = -half + 3; i < half - 3; i++) cell(cx + i * P, floor + P, GREY[9], c.shadow * Math.min(1, k * 1.4) * 0.6);
}
// C: on the ground its heat burns out, the glow over the rock thinning by
// opacity, the rim going, a few embers lifting off it.
function cool(c, rest, u) {
  const q = Math.min(1, u / (c.holdS * 0.85)), beat = Math.floor(u / 0.09);
  // the shadow it cast goes out under it by opacity, not at the touch
  shadow({ shadow: c.shadow * Math.max(0, 1 - u / 0.5) }, 1, rest);
  flame(rest.x, rest.y, 0, -1, c.trail * Math.max(0, 1 - u / 0.5), c.flare, u + 9, 1 - q, 2, true);
  for (let r = Math.floor(H / 3); r < H; r++) for (let col = 0; col < W; col++) {
    if (!inRock(col, r)) continue;
    const near = (r - H / 3) / (H * 2 / 3);
    cell(rest.x + col * P, rest.y + r * P, fire(1 + (hash(col * 3.3 + r * 1.7) > 0.6 ? 1 : 0)), (1 - q) * 0.75 * near);
  }
  for (let i = 0; i < 10; i++) {
    const born = i * 0.18, age = u - born;
    if (age < 0) continue;
    const a = 1 - age / 1.1;
    if (a <= 0) continue;
    const x = rest.x + (W / 2 + (hash(i * 6.1) - 0.5) * W * 0.8) * P, y = rest.y - age * P * 7;
    cell(onPx(x, S.camX), onPx(y, S.camY), fire(i % 2 ? 1 : 3), a);
  }
}
