// The house's fall, drawn (actbeats.js plays it; the owner's G at K's speed,
// review 'act 3: the intro', 2026-10-31): a meteor out of the sky onto the
// house, the impact, and the rock lying in the crater it made with a fire
// smouldering round it.
//
// The fall: from wholly off the top of the window (worked out off the camera
// as it begins) straight down onto the ruin under gravity, a flame streaming
// up behind it and flickering a cell at a time at its edges, sparks thrown
// off it and fading where they were left, its heat glowing brighter as it
// nears, and its shadow swelling on the ground under it, beating faster as
// it comes. The rock and its flame are one drawing on the rock's own grid,
// placed at its true spot each frame, so it moves smoothly and never shears.
//
// The impact: held still a moment (ACT_METEOR.smear), the flame flattened
// along the ground; then the blast let go -- flame cells and smoke balls out
// and up, the house in pieces on arcs, a ring of dust running out along the
// ground, the ground scorched -- the rock's glow and flame burning out on
// it, and a column of smoke leaning off downwind. The yard's own shake is
// handed the throw where the fall ends (actbeats.js). Everything fades by
// opacity and is gone by the hold's end.
//
// After: the rock in its crater (crater.js: the ground dips, so the bowl is
// drawn with the ground line, render/ground.js), the dirt it threw heaped on
// the lips, and small flames round its foot going out over
// ACT_METEOR.smoulderS.

// REVIEW act-3-the-intro-built
import { S } from '../state.js';
import { P, GREY, FINALE_GREYS, FINALE_HOUSE_W, ACT_ROCK_W, ACT_ROCK_H, ACT_ROCK_FALL_S, ACT_ROCK_DUST_S,
         ACT_METEOR, ACT_METEOR_FX, ACT_METEOR_LOOK, ACT_SMOULDER_SPOTS, ACT_FLAME, ACT_SMOKE, ACT_CRATER } from '../config.js';
import { ctx } from './ctx.js';
import { hash } from './flicker.js';
import { light, raw, turnedOver } from '../ink.js';
import { houseX } from '../home.js';
import { held } from '../reset.js';
import { now } from '../clock.js';
import { fallNow, fallLanded } from '../actbeats.js';
import { rockRowsLeft } from '../mansion.js';
import { craterNow, craterDepth, craterCol, craterMid } from '../crater.js';

const W = ACT_ROCK_W, H = ACT_ROCK_H, M = ACT_METEOR, FX = ACT_METEOR_FX, L = ACT_METEOR_LOOK, FL = L.flame;
const snap = v => Math.round(v / P) * P;
const gnd = () => snap(S.groundY);
const lerp = (a, b, k) => a + (b - a) * k;

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
// A flame's tone: a thing that shines, so its hue holds on a turned page.
const fire = i => light(ACT_FLAME[Math.max(0, Math.min(ACT_FLAME.length - 1, i))]);
// A shadow is dark on either page: the yard's near-black ink on the light
// page, and plain black under the turned map, where the yard's greys go light.
const shadowTone = () => (turnedOver() ? raw('#000000') : GREY[9]);

// Inside the rock's outline (portals.js draws the rock off the same rule),
// or `grow` cells out round it.
const inRock = (c, r, grow = 0) => {
  if (c < -grow || r < -grow || c >= W + grow || r >= H + grow) return false;
  const u = (c + 0.5 + grow) / (W + grow * 2) * 2 - 1, v = (r + 0.5 + grow) / (H + grow * 2) * 2 - 1;
  return u * u + Math.max(0, v) * v * 0.15 + Math.min(0, v) * v <= 1;
};

// Where the rock comes to rest, its top-left: over the house's middle, sat
// on the crater's floor (`rows` of it left, the floor shallower as it goes).
const restAt = (rows = ACT_ROCK_H) => ({ x: snap(houseX() + FINALE_HOUSE_W * P / 2 - W * P / 2),
                                         y: gnd() - H * P + craterCol(0, craterDepth(rows)) * P });

// Where the fall starts, worked out once off the camera standing then, so
// the rock and the whole of its flame begin outside the window.
let start = null; // held: the fall's start, cleared on any frame no fall plays
held('housefall', () => { start = null; });
function startOf(rest) {
  const y = S.camY - H * P - (M.trail + M.flare + 2) * P - M.margin * P;
  return { x: rest.x + (rest.y - y) * M.drift, y };
}
// The rock's top-left `k` of the way down: its height going as the square of
// the time, a fall under gravity.
const pathAt = (k, rest) => { const e = k * k; return { x: lerp(start.x, rest.x, e), y: lerp(start.y, rest.y, e) }; };

// --- the drawing, frame by frame ----------------------------------------------------
// From the yard's acts layer (render/portals.js), in the rock's place: true
// when it drew the rock, false to leave the rock (none, standing house) be.
export function drawHouseFall(rockCells) {
  const f = fallNow();
  if (!f || f.rock < 0) start = null;
  if (f && f.rock >= 0 && f.rock < 1) { falling(f, rockCells); return true; }
  if (!S.acts || S.acts.house === 'standing') return false;
  const rows = rockRowsLeft(), rest = restAt(rows);
  drawRim();
  if (rows > 0) rockCells(rest.x, rest.y, rows);
  if (f) impact(rest, f.u || 0);
  else {
    const at = fallLanded();
    const since = at == null ? Infinity : (now() - at) / 1000;
    smoulder(rest, 1 - Math.max(0, since - ACT_ROCK_DUST_S) / M.smoulderS, since);
  }
  return true;
}

function falling(f, rockCells) {
  const rest = restAt();
  if (!start) start = startOf(rest);
  const k = f.rock, t = f.u || 0, at = pathAt(k, rest);
  shadow(k, rest, L.shadow.pulse[0] + L.shadow.pulse[1] * Math.cos(Math.PI * 2 * ACT_ROCK_FALL_S * (L.shadow.beats[0] * k + L.shadow.beats[1] * k * k)));
  sparks(k, rest, t);
  const x0 = onPx(at.x, S.camX), y0 = onPx(at.y, S.camY);
  flame(x0, y0, M.trail, t, 1);
  rockCells(x0, y0, H);
  glow(x0, y0, k * k);
}

function impact(rest, u) {
  const burn = Math.max(0, 1 - u / FX.burnS), q = Math.min(1, u / (ACT_ROCK_DUST_S * FX.coolOf));
  // the shadow goes out under it, and its flame and heat burn out on it
  shadow(1, rest, Math.max(0, 1 - u / FX.burnS));
  flame(rest.x, rest.y, M.trail * burn, u + 9, 1 - q, true);
  const top = H * L.cool.from;
  for (let r = Math.floor(top); r < H; r++) for (let c = 0; c < W; c++) {
    if (!inRock(c, r)) continue;
    cell(rest.x + c * P, rest.y + r * P, fire(1 + (hash(c * 3.3 + r * 1.7) < L.cool.hot ? 1 : 0)), (1 - q) * L.cool.a * (r - top) / (H - top));
  }
  smoulder(rest, Math.min(1, Math.max(0, u - FX.smoulderIn[0]) / FX.smoulderIn[1]), u);
  sparks(1, rest, ACT_ROCK_FALL_S + u);
  column(rest, u);
  scorch(u);
  ring(rest, u);
  chunks(rest, u);
  smear(rest, u);
  burst(rest, u);
}

// --- the meteor ------------------------------------------------------------------------
// The flame on the rock's own grid, streaming up behind it: a rim of red
// round the rock, and the run tapering up from it, red at the core, darker
// out to its edge and up its run, its last of it smoke. It sways in shape on
// held hashed beats and never in brightness (PROP_FLAME's rule), and its edge
// cells flicker a cell at a time on the same beats. `len` and `a` let it
// burn out; `down`, on the ground, keeps it above the rock's foot.
function flame(x0, y0, len, t, a, down = false) {
  const hw = W / 2, R = H / 2, flare = M.flare, beat = Math.floor(t / M.flickS);
  const reach = Math.ceil(R + len + flare + 2);
  for (let r = Math.floor(H / 2 - reach); r < (down ? H : Math.ceil(H / 2 + reach)); r++) {
    for (let c = Math.floor(W / 2 - reach); c < Math.ceil(W / 2 + reach); c++) {
      if (inRock(c, r)) continue;
      const al = H / 2 - (r + 0.5), pe = Math.abs(c + 0.5 - W / 2);
      if (inRock(c, r, FL.rim)) { cell(x0 + c * P, y0 + r * P, fire(al < -R * FL.front ? 0 : 1), a); continue; }
      if (al < R * FL.front || len <= 0) continue;
      const far = Math.max(0, al - R) / len;
      const sway = (hash(Math.round(al) * 3.1 + beat * 7.7) - 0.5) * FL.sway;
      const half = (hw + flare) * Math.pow(Math.max(0, 1 - far), FL.taper) + sway * (FL.swayFar + far);
      if (pe > half || far > 1 + hash(beat * 1.3 + c * 0.7) * FL.ragged) continue;
      if ((pe > half - FL.edge || far > FL.edgeFar) && hash(c * 13.1 + r * 7.3 + beat * 3.7) < FL.flicker) continue;
      const core = pe < half * FL.core && far < FL.coreFar, edge = pe > half - 1 ? 1 : 0;
      if (far < FL.smokeAt) cell(x0 + c * P, y0 + r * P, fire(core ? 0 : Math.min(ACT_FLAME.length - 1, 1 + Math.floor(far * FL.steps) + edge)), a);
      else cell(x0 + c * P, y0 + r * P, ACT_SMOKE[1], a * (1 - (far - FL.smokeAt) / FL.smokeOver));
    }
  }
}
// Its heat rising as it nears (`a` 0..1): a glow over its lower rows and a
// ring of red round it, both by opacity.
function glow(x0, y0, a) {
  if (a <= 0) return;
  const g = L.glow.reach;
  for (let r = -g; r < H + g; r++) for (let c = -g; c < W + g; c++) {
    if (inRock(c, r)) { if (r >= H / 2) cell(x0 + c * P, y0 + r * P, fire(0), a * L.glow.core * (r - H / 2) / (H / 2)); }
    else if (inRock(c, r, g) && !inRock(c, r, g - 1)) cell(x0 + c * P, y0 + r * P, fire(1), a * L.glow.ring);
  }
}
// Sparks thrown off the dive, each drifting a little and fading where it
// was left. `t` is seconds since the fall began.
function sparks(k, rest, t) {
  for (let i = 0; i < M.sparks; i++) {
    const s = i / M.sparks;
    if (s > k) break;
    const age = t - s * ACT_ROCK_FALL_S, life = lerp(FX.spark.life[0], FX.spark.life[1], hash(i * 3.7));
    if (age < 0 || age > life) continue;
    const p = pathAt(s, rest), sx = (hash(i * 5.3) - 0.5) * 2, sy = -lerp(L.spark.up[0], L.spark.up[0] + L.spark.up[1], hash(i * 2.9));
    const x = p.x + W * P / 2 + sx * (W * P * L.spark.across + age * P * FX.spark.out);
    const y = p.y + H * P * L.spark.at + sy * age * P * FX.spark.up + age * age * P * FX.spark.drop;
    cell(onPx(x, S.camX), onPx(y, S.camY), fire(hash(i * 1.3) < 0.5 ? 0 : 1), 1 - age / life);
  }
}
// Its shadow on the ground's face where it will land, under the ground line
// where nothing standing covers it, swelling as it comes; `beat` its pulse.
function shadow(k, rest, beat) {
  const sh = L.shadow, floor = gnd(), cx = rest.x + W * P / 2, tone = shadowTone(), a = M.shadow * Math.min(1, k * sh.in) * beat;
  const half = Math.max(1, Math.round((W / 2 + sh.past) * Math.min(1, sh.from + k)));
  for (let i = -half; i < half; i++) cell(cx + i * P, floor, tone, a);
  for (let i = -half + sh.past; i < half - sh.past; i++) cell(cx + i * P, floor + P, tone, a * sh.under);
}

// --- the impact ------------------------------------------------------------------------
// Held: for `smear` seconds the flame lies flattened out along the ground
// both ways from the rock's foot, held still, then goes by opacity.
function smear(rest, u) {
  const a = u < M.smear ? Math.min(1, u / FX.fadeIn.piece) : Math.max(0, 1 - (u - M.smear) / FX.smear.fadeS);
  if (a <= 0) return;
  const floor = gnd() - P;
  for (let side = -1; side <= 1; side += 2) for (let j = 0; j < FX.smear.cells; j++) for (let row = 0; row < FX.smear.rows - Math.floor(j / 4); row++) {
    const x = rest.x + W * P / 2 + side * (W * P / 2 - P * 2 + j * P) - (side < 0 ? P : 0);
    cell(x, floor - row * P, fire(Math.min(3, Math.floor(j / 4) + (row > 1 ? 1 : 0))), a);
  }
}
// The blast: flame cells and smoke balls thrown out and up from where it
// struck, slowing as they go, held at their first spread through the smear.
// Each keeps its one tone and fades.
function burst(rest, u) {
  const te = u < M.smear ? FX.heldAt : FX.heldAt + (u - M.smear), fadeIn = Math.min(1, u / FX.fadeIn.blast);
  const cx = rest.x + W * P / 2, cy = gnd() - P * 2;
  for (let i = 0; i < M.balls; i++) {
    const h1 = hash(i * 7.9), h2 = hash(i * 3.1), life = lerp(FX.ball.life[0], FX.ball.life[1], h2);
    if (te > life) continue;
    const ang = -Math.PI * (L.burst.balls[0] + L.burst.balls[1] * h1), v = P * lerp(FX.ball.speed[0], FX.ball.speed[1], h2);
    const d = v * (1 - Math.exp(-te * FX.ball.damp)) / FX.ball.damp;
    const bx = cx + Math.cos(ang) * d, by = cy + Math.sin(ang) * d - te * P * FX.ball.rise;
    const r = Math.min(FX.ball.r[1], FX.ball.r[0] + te * FX.ball.grow), a = fadeIn * (1 - te / life) * 0.95, n = Math.ceil(r);
    for (let dy = -n; dy <= n; dy++) for (let dx = -n; dx <= n; dx++) {
      if (dx * dx + dy * dy <= r * r) cell(onPx(bx + dx * P, S.camX), onPx(by + dy * P, S.camY), ACT_SMOKE[i % 3], a);
    }
  }
  for (let i = 0; i < M.burst; i++) {
    const h1 = hash(i * 4.3), h2 = hash(i * 9.7), life = lerp(FX.ember.life[0], FX.ember.life[1], h2);
    if (te > life) continue;
    const ang = -Math.PI * (L.burst.embers[0] + L.burst.embers[1] * h1), v = P * lerp(FX.ember.speed[0], FX.ember.speed[1], h2);
    const d = v * (1 - Math.exp(-te * FX.ember.damp)) / FX.ember.damp;
    const x = cx + Math.cos(ang) * d, y = cy + Math.sin(ang) * d + te * te * P * FX.ember.drop;
    const tone = fire(Math.floor(hash(i * 1.7) * 3)), size = h2 > 0.6 ? 2 : 1;
    for (let w = 0; w < size; w++) for (let k = 0; k < size; k++) cell(onPx(x + w * P, S.camX), onPx(y + k * P, S.camY), tone, fadeIn * (1 - te / life));
  }
}
// The house thrown up in pieces from under it, on arcs, each lying where it
// lands and fading there; they wait out the held smear. A board's end, a
// block or a splinter: one drawing each, on its own grid.
function chunks(rest, u) {
  const t = u - M.smear;
  if (t <= 0) return;
  const floor = gnd() - P, g = P * FX.chunk.drop, end = ACT_ROCK_DUST_S - M.smear - FX.chunk.endS;
  for (let i = 0; i < M.chunks; i++) {
    const side = i % 2 ? 1 : -1, h1 = hash(i * 4.7), h2 = hash(i * 8.3);
    const vx = side * P * lerp(FX.chunk.across[0], FX.chunk.across[1], h1) * M.throw;
    const vy = -P * lerp(FX.chunk.up[0], FX.chunk.up[1], h2) * M.throw;
    const x0 = rest.x + W * P / 2 + side * P * (3 + h1 * 4), y0 = floor - P * 3;
    const land = (-vy + Math.sqrt(vy * vy + 2 * g * (floor - y0))) / g, tt = Math.min(t, land);
    const x = x0 + vx * tt, y = Math.min(floor, y0 + vy * tt + g * tt * tt / 2);
    const life = Math.min(end, land + lerp(FX.chunk.rest[0], FX.chunk.rest[1], h2));
    const a = Math.min(1, t / FX.fadeIn.piece) * (t < land ? 1 : Math.max(0, 1 - (t - land) / Math.max(0.1, life - land)));
    if (a <= 0) continue;
    const tone = i % 5 === 0 ? fire(2) : i % 3 === 0 ? '#000' : FINALE_GREYS[i % 3];
    const wide = h1 > 0.6 ? 3 : h1 > 0.3 ? 2 : 1, tall = h2 > 0.5 ? 2 : 1;
    for (let w = 0; w < wide; w++) for (let k = 0; k < tall; k++) cell(onPx(x + w * P, S.camX), onPx(y - k * P, S.camY), tone, a);
  }
}
// A ring of dust running out along the ground both ways, a band `ringRows`
// tall at its front and thinning behind, in the yard's dust greys, darkest at
// the front, gone by opacity.
function ring(rest, u) {
  const t = u - M.smear * 0.5, q = Math.min(1, t / FX.ringS);
  if (t <= 0 || q >= 1) return;
  const e = 1 - (1 - q) * (1 - q), floor = gnd() - P;
  for (let side = -1; side <= 1; side += 2) {
    const front = rest.x + W * P / 2 + side * (W * P / 2 + e * M.ring * P);
    for (let j = 0; j < FX.ringTail; j++) {
      const x = front - side * j * P - (side < 0 ? 0 : P), tall = j < 2 ? M.ringRows : j < 4 ? M.ringRows - 1 : 1;
      for (let row = 0; row < tall; row++) cell(onPx(x, S.camX), floor - row * P, FINALE_GREYS[Math.min(2, j >> 1)], Math.min(1, t / FX.fadeIn.piece) * (1 - q) * (1 - j / (FX.ringTail + 1)));
    }
  }
}
// The ground scorched round it, and embers glowing in it, going out over the
// hold (on the ground's face, under its line).
function scorch(u) {
  const life = ACT_ROCK_DUST_S - FX.fadeIn.puff, a = Math.min(1, u / FX.fadeIn.scorch) * Math.max(0, 1 - Math.pow(u / life, 2));
  if (a <= 0) return;
  const floor = gnd() + craterNow() * P, cx = craterMid(), half = W / 2 + FX.scorch.reach;
  for (let i = -half; i < half; i++) for (let row = 0; row < FX.scorch.rows; row++) {
    const h = hash(i * 3.3 + row * 11.9), edge = Math.abs(i + 0.5) / half;
    if (h < 0.15 + edge * 0.6 + row * 0.15) continue;
    const ember = h > 0.9 && edge < 0.8, tw = ember ? 0.65 + 0.35 * Math.sin(u * 5 + i * 1.7) : 1;
    cell(cx + i * P, floor + row * P, ember ? fire(1) : shadowTone(), a * tw * (ember ? 1 : 0.9));
  }
}
// A column of smoke off the rock, rising, spreading and leaning off downwind
// as it goes, each puff gone before the hold ends.
function column(rest, u) {
  const life = FX.puffS, last = ACT_ROCK_DUST_S - life - FX.fadeIn.puff;
  for (let i = 0; i < M.column; i++) {
    const age = u - (i / M.column) * last;
    if (age < 0 || age > life) continue;
    const a = Math.min(1, age / FX.fadeIn.puff) * (1 - age / life) * 0.85;
    const x = rest.x + (W / 2 + (hash(i * 4.1) - 0.5) * W * 0.4) * P + age * age * P * FX.puff.lean;
    const y = rest.y + P * 2 - age * P * FX.puff.rise, gap = P * (1 + age * FX.puff.spread);
    for (const [ox, oy] of [[0, 0], [gap, 0], [0, -gap], [gap, -gap], [gap * 0.5, -gap * 2]])
      cell(onPx(x + ox, S.camX), onPx(y + oy, S.camY), ACT_SMOKE[i % 3], a);
  }
}

// --- after -----------------------------------------------------------------------------
// The dirt the impact threw, heaped on the bowl's lips, tallest at the lip
// and as much of it as the bowl is deep (it goes back in as the bowl fills),
// each clod a dust grey of its own.
function drawRim() {
  const k = craterNow() / ACT_CRATER.depth;
  if (k <= 0) return;
  const g = gnd(), cx = craterMid(), rim = Math.round(ACT_CRATER.rim * k), n = ACT_CRATER.rim + 3;
  for (let side = -1; side <= 1; side += 2) for (let j = 0; j < n; j++) {
    const tall = Math.max(0, rim - Math.floor(j * rim / n));
    const x = cx + side * (ACT_CRATER.half + j) * P - (side < 0 ? P : 0);
    for (let r = 0; r < tall; r++) {
      if (r === tall - 1 && hash(j * 5.1 + side * 2.3) < 0.35) continue;
      cell(x, g - (r + 1) * P, GREY[6 + Math.floor(hash(j * 3.7 + r * 1.3 + side) * 3)]);
    }
  }
}
// The fire left in the crater: small flames round the rock's foot and on
// the lips, each a column of one to three cells flickering a cell at a time,
// and a thin wisp off each now and then. `a` is how much is left.
function smoulder(rest, a, t) {
  if (!(a > 0)) return;
  const g = gnd(), cx = rest.x + W * P / 2, half = ACT_CRATER.half;
  ACT_SMOULDER_SPOTS.forEach((s, i) => {
    const beat = Math.floor(t / FX.flick + i * 0.37), x = cx + Math.round(s) * P;
    const lip = Math.abs(s) > half - 0.5;
    const base = lip ? g - ACT_CRATER.rim * P * 0.5 : g + craterCol(Math.round(s), craterNow()) * P;
    const tall = 1 + Math.floor(hash(i * 3.3 + beat * 1.7) * 3);
    for (let k = 0; k < tall; k++) {
      if (k > 0 && hash(i * 5.9 + k * 2.1 + beat * 0.9) < 0.3) continue;
      cell(x, base - (k + 1) * P, fire(Math.min(2, k)), a);
    }
    const age = (t + i * 0.71) % FX.wisp;
    const wa = a * Math.min(1, age / 0.2) * (1 - age / FX.wisp) * 0.8;
    cell(onPx(x + Math.sin(age * 2.5 + i) * P * 1.2, S.camX), onPx(base - P * 3 - age * P * 6, S.camY), ACT_SMOKE[1], wa);
  });
}
