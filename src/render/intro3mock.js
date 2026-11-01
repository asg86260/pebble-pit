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
//   d  c hotter: a longer flickering flame, sparks shed, the glow rising as
//      it nears, the shadow beating faster
//   e  d with an impact: a held smear, the house thrown up in pieces, a
//      ring of dust along the ground
//   f  e and after: scorched ground with embers going out, a smoke column

import { S } from '../state.js';
import { P, FINALE_HOUSE_W, FINALE_GREYS, ACT_ROCK_W, ACT_ROCK_H, INTRO3_MOCK, INTRO3_FLAME, INTRO3_SMOKE, GREY } from '../config.js';
import { ctx } from './ctx.js';
import { hash } from './flicker.js';
import { light, raw, turnedOver } from '../ink.js';
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
function flame(x0, y0, bx, by, len, flare, t, a = 1, rim = 1, down = false, flick = false) {
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
      // a flickering edge: a cell at a time, on the same held beats
      if (flick && (pe > half - 1.5 || far > 0.55) && hash(c * 13.1 + r * 7.3 + beat * 3.7) < 0.38) continue;
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
    if (c.shadow) shadow(c, k, rest, c.pulse ? 0.7 + 0.3 * Math.cos(Math.PI * 2 * c.fallS * (1.5 * k + 4 * k * k)) : 1);
    if (c.sparks) sparks(c, o, k, rest, t);
    const x0 = onPx(at.x, S.camX), y0 = onPx(at.y, S.camY);
    flame(x0, y0, bx, by, c.trail, c.flare, t, 1, c.shadow ? 2 : 1, false, !!c.flick);
    rockCells(x0, y0, H);
    if (c.glow) glow(x0, y0, k * k);
    return true;
  }
  // the impact, held: the rock at rest, what it brought burning out on it
  const u = t;
  if (o === 'b') { embers(c, 1, rest, u + c.fallS); smoke(c, rest, u); }
  drawRuinRock();
  const burn = Math.max(0, 1 - u / 0.7);
  if (o === 'a') { flame(rest.x, rest.y, 0, -1, c.trail * burn, c.flare * (1 + (1 - burn) * 2), u + 9, burn, 1, true); puff(rest, u); }
  if (o === 'b') flame(rest.x, rest.y, 0.6, -0.8, c.trail * burn, c.flare, u + 9, burn, 1, true);
  if (c.shadow) cool(c, rest, u);
  if (c.sparks) sparks(c, o, 1, rest, c.fallS + u);
  if (c.column) column(c, rest, u);
  if (c.scorch) scorch(c, rest, u);
  if (c.ring) ring(c, rest, u);
  if (c.chunks) chunks(c, rest, u);
  if (c.smear) smear(c, rest, u);
  return true;
}

// The heat rising as it nears: a glow over its lower rows and a ring of
// red round it, both by opacity (`a` 0..1).
function glow(x0, y0, a) {
  if (a <= 0) return;
  for (let r = -3; r < H + 3; r++) for (let col = -3; col < W + 3; col++) {
    if (inRock(col, r)) { if (r >= H / 2) cell(x0 + col * P, y0 + r * P, fire(0), a * 0.7 * (r - H / 2) / (H / 2)); }
    else if (inRock(col, r, 3) && !inRock(col, r, 2)) cell(x0 + col * P, y0 + r * P, fire(1), a * 0.8);
  }
}
// D on: sparks thrown off the dive, each drifting a little and fading
// where it was left. `t` is seconds since the fall began.
function sparks(c, o, k, rest, t) {
  for (let i = 0; i < c.sparks; i++) {
    const s = i / c.sparks;
    if (s > k) break;
    const age = t - s * c.fallS, life = 0.6 + hash(i * 3.7) * 0.6;
    if (age < 0 || age > life) continue;
    const p = pathAt(o, s, rest);
    const sx = (hash(i * 5.3) - 0.5) * 2, sy = -0.3 - hash(i * 2.9) * 0.7;
    const x = p.x + W * P / 2 + sx * (W * P * 0.45 + age * P * 10);
    const y = p.y + H * P * 0.4 + sy * age * P * 8 + age * age * P * 12;
    cell(onPx(x, S.camX), onPx(y, S.camY), fire(hash(i * 1.3) < 0.5 ? 0 : 1), 1 - age / life);
  }
}
// E on: the impact held. For `smear` seconds the flame lies flattened out
// along the ground both ways from the rock's foot, held still, and then
// goes by opacity.
function smear(c, rest, u) {
  // (in over a few frames, never popped on)
  const a = u < c.smear ? Math.min(1, u / 0.08) : Math.max(0, 1 - (u - c.smear) / 0.35);
  if (a <= 0) return;
  const floor = rest.y + H * P - P;
  for (let side = -1; side <= 1; side += 2) for (let j = 0; j < 14; j++) for (let row = 0; row < 4 - Math.floor(j / 4); row++) {
    const x = rest.x + W * P / 2 + side * (W * P / 2 - P * 2 + j * P) - (side < 0 ? P : 0);
    cell(x, floor - row * P, fire(Math.min(3, Math.floor(j / 4) + (row > 1 ? 1 : 0))), a);
  }
}
// E on: the house thrown up in pieces from under it, on arcs, each lying
// where it lands and fading there. They wait out the held smear.
function chunks(c, rest, u) {
  const t = u - (c.smear || 0);
  if (t <= 0) return;
  const floor = rest.y + H * P - P, g = P * 110, end = c.holdS - (c.smear || 0) - 0.3;
  for (let i = 0; i < c.chunks; i++) {
    const side = i % 2 ? 1 : -1, h1 = hash(i * 4.7), h2 = hash(i * 8.3);
    const vx = side * P * (10 + h1 * 30), vy = -P * (42 + h2 * 34);
    const x0 = rest.x + W * P / 2 + side * P * (3 + h1 * 4), y0 = floor - P * 3;
    const land = (-vy + Math.sqrt(vy * vy + 2 * g * (floor - y0))) / g;
    const tt = Math.min(t, land);
    const x = x0 + vx * tt, y = Math.min(floor, y0 + vy * tt + g * tt * tt / 2);
    const life = Math.min(end, land + 0.9 + h2 * 0.6);
    const a = Math.min(1, t / 0.08) * (t < land ? 1 : Math.max(0, 1 - (t - land) / Math.max(0.1, life - land)));
    if (a <= 0) continue;
    const tone = i % 5 === 0 ? fire(2) : i % 3 === 0 ? '#000' : FINALE_GREYS[i % 3];
    // a board's end, a block, or a splinter: one drawing each, on its own grid
    const wide = h1 > 0.6 ? 3 : h1 > 0.3 ? 2 : 1, tall = h2 > 0.5 ? 2 : 1;
    for (let w = 0; w < wide; w++) for (let hgt = 0; hgt < tall; hgt++)
      cell(onPx(x + w * P, S.camX), onPx(y - hgt * P, S.camY), tone, a);
  }
}
// E on: a ring of dust running out along the ground both ways, a band two
// cells tall at its front and thinning behind, gone by opacity.
function ring(c, rest, u) {
  const t = u - (c.smear || 0) * 0.5, q = Math.min(1, t / 1.1);
  if (t <= 0 || q >= 1) return;
  const e = 1 - (1 - q) * (1 - q), floor = rest.y + H * P - P;
  for (let side = -1; side <= 1; side += 2) {
    // (the yard's own dust greys, darkest at the front)
    const front = rest.x + W * P / 2 + side * (W * P / 2 + e * c.ring * P);
    for (let j = 0; j < 6; j++) {
      const x = front - side * j * P - (side < 0 ? 0 : P);
      const tall = j < 2 ? 3 : j < 4 ? 2 : 1;
      for (let row = 0; row < tall; row++) cell(onPx(x, S.camX), floor - row * P, FINALE_GREYS[Math.min(2, j >> 1)], Math.min(1, t / 0.08) * (1 - q) * (1 - j / 7));
    }
  }
}
// F: the ground scorched round it, and embers glowing in it, going out
// over the hold (on the ground's face, under its line).
function scorch(c, rest, u) {
  const life = c.holdS - 0.2, a = Math.min(1, u / 0.15) * Math.max(0, 1 - Math.pow(u / life, 2));
  if (a <= 0) return;
  const floor = rest.y + H * P, cx = rest.x + W * P / 2, half = W / 2 + 7;
  for (let i = -half; i < half; i++) for (let row = 0; row < 3; row++) {
    const h = hash(i * 3.3 + row * 11.9), edge = Math.abs(i + 0.5) / half;
    if (h < 0.15 + edge * 0.6 + row * 0.15) continue;
    const ember = h > 0.9 && edge < 0.8;
    const tw = ember ? 0.65 + 0.35 * Math.sin(u * 5 + i * 1.7) : 1;
    cell(cx + i * P, floor + row * P, ember ? fire(1) : shadowTone(), a * tw * (ember ? 1 : 0.9));
  }
}
// F: a column of smoke off the rock, rising, spreading and leaning off
// downwind as it goes, each puff gone before the hold ends.
function column(c, rest, u) {
  const life = 2.2, last = c.holdS - life - 0.1;
  for (let i = 0; i < c.column; i++) {
    const born = (i / c.column) * last, age = u - born;
    if (age < 0 || age > life) continue;
    const a = Math.min(1, age / 0.2) * (1 - age / life);
    const x = rest.x + (W / 2 + (hash(i * 4.1) - 0.5) * W * 0.4) * P + age * age * P * 4;
    const y = rest.y + P * 2 - age * P * 11;
    const gap = P * (1 + age * 0.8);
    for (const [ox, oy] of [[0, 0], [gap, 0], [0, -gap], [gap, -gap], [gap * 0.5, -gap * 2]])
      cell(onPx(x + ox, S.camX), onPx(y + oy, S.camY), INTRO3_SMOKE[i % 3], a * 0.85);
  }
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
// A shadow is dark on either page: the yard's near-black ink on the light
// page, and plain black under the turned map, where the yard's greys go light.
const shadowTone = () => (turnedOver() ? raw('#000000') : GREY[9]);
function shadow(c, k, rest, beat = 1) {
  const floor = rest.y + H * P, cx = rest.x + W * P / 2, tone = shadowTone(), a = c.shadow * Math.min(1, k * 1.4) * beat;
  const half = Math.max(1, Math.round((W / 2 + 3) * Math.min(1, 0.2 + k)));
  for (let i = -half; i < half; i++) cell(cx + i * P, floor, tone, a);
  for (let i = -half + 3; i < half - 3; i++) cell(cx + i * P, floor + P, tone, a * 0.6);
}
// C: on the ground its heat burns out, the glow over the rock thinning by
// opacity, the rim going, a few embers lifting off it.
function cool(c, rest, u) {
  const q = Math.min(1, u / (c.holdS * 0.85)), beat = Math.floor(u / 0.09);
  // the shadow it cast goes out under it by opacity, not at the touch
  shadow({ shadow: c.shadow * Math.max(0, 1 - u / 0.5) }, 1, rest);
  flame(rest.x, rest.y, 0, -1, c.trail * Math.max(0, 1 - u / 0.5), c.flare, u + 9, 1 - q, 2, true, !!c.flick);
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
