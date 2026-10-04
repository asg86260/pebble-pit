// The creatures the serpent eats (DESIGN.md, "The serpent eats to heal"), the
// owner's eight (docs/mocks/heal-bestiary-2026-09-30.html), drawn cell by cell
// from a local frame: x runs back from the front tip, the end that goes in the
// mouth, and y runs down. A meal is a swim in from the left, the jaws, a
// swallow; the creature is drawn just before the serpent, so its head is in
// front of it and the mouth's gape is the only place it shows inside.
//
// Only drawn: which creature and when are `deep/meals.js`, off the saved meal
// counter, and the heal itself is the sim's (`deep/serpent.js`).

import { now } from '../clock.js';
import { S } from '../state.js';
import { ctx } from './ctx.js';
import { GREYS, PURPLES } from './deeptones.js';
import { coilLine } from '../deep/place.js';
import { mealNow, nearAt, nearAll, eatenBefore, nowS, BITE_BEFORE, jawOpen, jawGap } from '../deep/meals.js';
import { P, SNOUT, MEAL_SWIM_S, MEAL_GULP_S, MEAL_SWALLOW_S, MEAL_SWIM_CELLS, MEAL_HINGE, MEAL_SQUEEZE,
         FLOW_EVERY_S, FLOW_CELL, FLOW_SPEED, FLOW_PARALLAX, FLOW_SHARE, FLOW_MARGIN, FLOW_GIANT_S, FLOW_GIANT_SPEED,
         FLOW_NEAR_BAND, FLOW_KINDS, DEEP_H, COIL_Y, SERPENT_PHASES } from '../config.js';
import { deepTop, deepFloor, deepX0, deepX1 } from '../deep/place.js';

// The mock's tones, on the deep's own ramps.
const G = [4, 6, 8, 9, 10, 11].map(i => GREYS[i]);
const Pu = [2, 3, 4, 5, 7, 9, 10, 11, 11].map(i => PURPLES[i]);
const BLACK = GREYS[0];
const unit = n => { const x = Math.sin(n * 127.1 + 3.7) * 43758.5453; return x - Math.floor(x); };
const ease = x => x * x * (3 - 2 * x);

const ell = (put, cx, cy, rx, ry, tone) => {
  for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++)
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
      const d = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2;
      if (d <= 1) put(x, y, tone(x, y, d));
    }
};
const SP = [
  { name: 'Lantern angler', L: 18, bob: t => Math.sin(t * 2.4) * 1.6,
    draw(put, t) {
      const flick = Math.sin(t * 9), jaw = Math.sin(t * 6) > 0.3 ? 1 : 0;
      ell(put, 6.5, 0, 6, 3.2, (x, y, d) => y > 1 ? G[1] : d > 0.7 ? G[3] : G[2]);
      for (let x = 0; x <= 4; x++) put(x, 2 + jaw, G[1]);
      for (const x of [0, 2, 4]) put(x, 1, G[5]);
      for (let i = 0; i < 4; i++) { put(11 + i, Math.round(flick * i * 0.4) - 1, G[2]); put(11 + i, Math.round(flick * i * 0.4) + 1, G[1]); }
      put(12, Math.round(flick * 1.6), G[2]);
      put(8, -4, G[1]); put(9, -4, G[1]);
      put(4, -1, G[5]); put(3, -1, G[0]);
      const bulb = Pu[6 + Math.round(Math.sin(t * 5) + 1)];
      for (const [x, y] of [[9, -3], [8, -4], [6, -5], [4, -6], [2, -6], [1, -5]]) put(x, y, G[1]);
      put(0, -5, bulb); put(0, -4, bulb); put(-1, -5, Pu[8]); put(-1, -4, bulb);
    } },
  { name: 'Ribbon eel', L: 26, bob: t => 0,
    draw(put, t) {
      for (let i = 0; i < 26; i++) {
        const amp = 0.6 + i * 0.09, yy = Math.round(Math.sin(i / 2.4 - t * 7) * Math.min(2.6, amp)), th = i < 3 ? 2 : i < 18 ? 1.5 : 1;
        put(i, yy, Pu[i < 3 ? 7 : 6]);
        if (th >= 1.5) put(i, yy + 1, Pu[i % 4 < 2 ? 8 : 7]);
        if (i > 3 && i < 21 && i % 2 === 0) put(i, yy - 1, Pu[4]);
        if (i < 3) put(i, yy - 1, Pu[6]);
      }
      put(1, Math.round(Math.sin(1 / 2.4 - t * 7) * 0.7) - 1, G[5]);
      put(-1, Math.round(Math.sin(-t * 7) * 0.6), G[5]);
    } },
  { name: 'Glass jelly', L: 18, bob: t => Math.sin(t * 1.5) * 3,
    draw(put, t) {
      const pulse = Math.sin(t * 3.2), rx = 5 + pulse * 0.8, ry = 4 - pulse * 0.9;
      for (let x = 0; x <= 6; x++) {
        const w = ry * Math.sqrt(Math.max(0, 1 - ((rx - x) / rx) ** 2));
        for (let y = -Math.round(w); y <= Math.round(w); y++)
          put(x, y, Math.abs(y) >= Math.round(w) || x === 0 ? G[5] : G[3 + ((x + y) & 1)]);
      }
      for (let j = 0; j < 3; j++) put(2 + j * 1.5, Math.round(Math.sin(t * 3 + j * 2) * 1.4), Pu[Math.sin(t * 4 + j * 2.1) > 0 ? 8 : 6]);
      for (let j = -2; j <= 2; j++)
        for (let x = 7; x < 18; x++) put(x, Math.round(j * 0.9 + Math.sin((x - 7) / 1.6 - t * 4 + j) * (0.6 + (x - 7) * 0.12)), (x + j) % 3 ? G[2] : G[1]);
      for (let x = 7; x < 12; x++) for (const o of [-1, 1]) put(x, o + Math.round(Math.sin(x - t * 3)), Pu[5]);
    } },
  { name: 'Skull fish', L: 20, bob: t => Math.sin(t * 0.9) * 1,
    draw(put, t) {
      const chat = Math.sin(t * 11) > 0 ? 1 : 0, sway = x => Math.round(Math.sin(x / 3.2 - t * 5) * 1.2);
      ell(put, 4.5, -0.5, 4.3, 3.6, (x, y, d) => d > 0.72 ? G[5] : G[4]);
      for (let x = 0; x <= 2; x++) { put(x, 0, G[4]); put(x, 1, G[4]); }
      ell(put, 3.6, -1, 1.7, 1.6, () => G[0]);
      put(3, -1, G[5]);
      for (const x of [0, 1, 2, 3, 4]) put(x, 2, x % 2 ? G[5] : G[2]);
      for (let x = 0; x <= 5; x++) { put(x, 3 + chat, G[3]); if (x % 2 === 0) put(x, 2 + chat, G[5]); }
      for (let x = 7; x < 20; x++) put(x, sway(x), x % 2 ? G[4] : G[3]);
      for (let x = 8; x <= 14; x += 2) for (const o of [-2, -1, 1, 2]) put(x, sway(x) + o, o === -1 || o === 1 ? G[3] : G[2]);
      for (const o of [-2, -1, 1, 2]) put(19 + (Math.abs(o) === 2 ? 1 : 0), sway(19) + o, G[3]);
    } },
  { name: 'Wandering eye', L: 22, bob: t => Math.sin(t * 2.6) * 2,
    draw(put, t) {
      const blink = (t % 1.7) < 0.22 ? (t % 1.7) / 0.22 : 0, lid = Math.round(Math.sin(blink * Math.PI) * 7);
      ell(put, 4, 0, 4.2, 4.2, (x, y, d) => d > 0.8 ? G[3] : G[5]);
      ell(put, 2.4, 0, 2.2, 2.2, () => Pu[8]);
      ell(put, 2.4, 0, 1.4, 1.4, () => Pu[6]);
      ell(put, 2.2, 0, 0.7, 0.7, () => BLACK);
      put(3, -1, G[5]);
      for (const [x, y] of [[6, -2], [7, 0], [6, 2], [5, -3]]) put(x, y, Pu[4]);
      for (let y = -5; y < -5 + lid; y++) for (let x = -1; x <= 9; x++) if (((x - 4) / 4.6) ** 2 + (y / 4.6) ** 2 <= 1) put(x, y, G[2]);
      for (let i = 0; i < 16; i++) put(8 + i, Math.round(Math.sin(i / 2 - t * 5) * (0.8 + i * 0.1)), Pu[Math.max(1, 6 - (i >> 2))]);
    } },
  { name: 'Spiral drifter', L: 12, bob: t => Math.sin(t * 1.8) * 1.5,
    draw(put, t) {
      const rot = t * 2.6;
      ell(put, 7, 0, 4.6, 4.6, (x, y, d) => {
        const r = Math.hypot(x - 7, y), ang = Math.atan2(y, x - 7) - rot;
        const turn = ((ang / (Math.PI * 2) + r / 1.7) % 1 + 1) % 1;
        return d > 0.8 ? G[5] : turn < 0.35 ? G[1] : turn < 0.7 ? G[3] : G[4];
      });
      ell(put, 1.6, 1, 2.6, 1.6, () => Pu[5]);
      ell(put, 1.2, 1, 1.4, 0.8, () => Pu[6]);
      const w = Math.sin(t * 5);
      put(-1, -1 + Math.round(w), Pu[7]); put(-2, -2 + Math.round(w * 1.5), Pu[6]);
      put(-1, 2 - Math.round(w), Pu[7]); put(-2, 3 - Math.round(w * 1.5), Pu[6]);
      put(1, 0, G[5]);
    } },
  { name: 'Many-mouthed blob', L: 16, bob: t => Math.sin(t * 2.2) * 2,
    draw(put, t) {
      const lobes = [[7, 0, 4.4 + Math.sin(t * 3) * 0.7, 3.6], [3.5, -1, 3 + Math.sin(t * 4 + 1) * 0.6, 2.8], [10.5, 1, 3.2 + Math.sin(t * 3.5 + 2) * 0.6, 3], [6, 2.4, 2.6 + Math.sin(t * 5 + 3) * 0.5, 2.4]];
      const inside = (x, y) => lobes.some(([cx, cy, rx, ry]) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1);
      for (let x = -1; x < 16; x++) for (let y = -6; y <= 6; y++) {
        if (!inside(x, y)) continue;
        const rim = !inside(x + 1, y) || !inside(x - 1, y) || !inside(x, y + 1) || !inside(x, y - 1);
        put(x, y, rim ? Pu[7] : Pu[4 + ((x * 3 + y * 5) & 1) + (unit(x * 7 + y) > 0.8 ? 1 : 0)]);
      }
      [[3, 0, 0], [7, -2, 1.7], [9, 2, 3.1], [5, 3, 4.4], [12, 0, 5.2]].forEach(([x, y, ph]) => {
        const open = Math.max(0, Math.sin(t * 3 + ph)) * 1.4;
        if (open > 0.3) { put(x, y, BLACK); if (open > 0.8) put(x, y + 1, BLACK); put(x + 1, y, G[5]); }
      });
      for (let x = 0; x < 15; x += 2) if (unit(x + Math.floor(t * 6)) > 0.5) { put(x, -5 - (unit(x) > 0.5 ? 1 : 0), Pu[6]); put(x, 5 + (unit(x + 3) > 0.5 ? 1 : 0), Pu[6]); }
    } },
  { name: 'Toothed ring', L: 10, bob: t => 0,
    draw(put, t) {
      ell(put, 5, 0, 5.2, 5.2, (x, y, d) => d > 0.72 ? G[3] : d > 0.32 ? G[2] : BLACK);
      for (let i = 0; i < 12; i++) { const a = t * 5 + i * Math.PI / 6; put(5 + Math.cos(a) * 5.6, Math.sin(a) * 5.6, G[5]); }
      for (let i = 0; i < 8; i++) { const a = -t * 7 + i * Math.PI / 4; put(5 + Math.cos(a) * 2.6, Math.sin(a) * 2.6, G[4]); }
      put(5, 0, G[0]);
    } },
];


// A creature's length, for the swallow that follows it down the neck.
export const lengthOfKind = k => SP[k].L;
export const KINDS = SP.length;
if (SP.length !== FLOW_KINDS) throw new Error('fish: FLOW_KINDS is the creatures drawn here');

// --- the near stream and the meal, in the world ------------------------------------
// Where each near creature is, and which one a meal is, are the sim's
// (deep/meals.js); here they are drawn. A creature's height: its lane in the
// band over the coil's middle, bobbing; the meal's drifts to the mouth's.
const laneY = (c, t) => deepTop() + COIL_Y * DEEP_H - FLOW_NEAR_BAND * (0.2 + c.lane) + Math.sin((t - c.at) * 1.3 + c.at) * P * 2;

// Which creature meal `n` is, for the swallow's size (render/serpent.js).
let lastMeal = { n: -1, kind: 0 };
export const mealKind = n => (n === lastMeal.n ? lastMeal.kind : mealNow().kind);

export function drawFish() {
  if (S.view !== 'deep' || !S.snatched || S.serpentFreed || S.serpentStage >= SERPENT_PHASES) return;
  const meal = mealNow(), { toLand } = meal;
  lastMeal = { n: meal.n, kind: meal.kind };
  if (toLand > BITE_BEFORE + MEAL_SWIM_S || toLand < MEAL_SWALLOW_S) return;
  const t = nowS(), head = coilLine(0, now());
  const mouthCol = Math.floor((head.x - SNOUT) / P), mouthRow = Math.round(head.y / P);
  const c = nearAt(meal.i, t), sp = SP[meal.kind];
  // Its own path and pace to the mouth; only its height drifts to the mouth's.
  // At the bite its front is at the tip of the jaws; then it is pulled in.
  const s = Math.max(0, Math.min(1, 1 - (toLand - BITE_BEFORE) / MEAL_SWIM_S)), e = ease(s);
  const gulp = Math.max(0, Math.min(1, (BITE_BEFORE - toLand) / MEAL_GULP_S));
  const front = c ? Math.min(c.x / P, mouthCol) : mouthCol;
  const col0 = Math.round(front + gulp * (sp.L + 1));
  const fromY = c ? laneY(c, t) / P : mouthRow;
  const row0 = Math.round(fromY + (mouthRow - fromY) * e);
  const paint = (cc, r, tone) => { ctx.fillStyle = tone; ctx.fillRect(Math.round(cc) * P, Math.round(r) * P, P, P); };
  // Going in it is squeezed toward the mouth's line, and a cell past the tip
  // shows only between the jaws: it is cut by the jaw lines the head is
  // drawn on (`jawGap`), and the head covers the rest of it.
  const open = jawOpen(toLand), squeeze = 1 - (1 - MEAL_SQUEEZE) * gulp;
  const put = (x, y, tone) => {
    const cc = Math.round(col0 - x), r = Math.round(row0 + y * squeeze), d = cc - mouthCol;
    if (d >= 0 && (d >= MEAL_HINGE || Math.abs(r - mouthRow) >= jawGap(d, open))) return;
    paint(cc, r, tone);
  };
  sp.draw(put, t);
}

// --- the stream -----------------------------------------------------------------
// Drawn on the glass rather than in the world: each depth slides with
// FLOW_PARALLAX of the camera's pan, and a crossing wraps round only off the
// glass, so nothing appears in the water. Which creature, which way and how
// deep is a fixed schedule off the clock, the same on every draw.
const darker = new Map();
for (const ramp of [GREYS, PURPLES]) ramp.forEach((c, i) => darker.set(c, ramp[Math.max(1, i - 4)]));
const FAR = PURPLES[3], GIANT = PURPLES[1];
const toneAt = (d, c) => (d === 2 ? c : d === 1 ? (darker.get(c) || c) : FAR);
const depthOf = h => (h < FLOW_SHARE[0] ? 0 : h < FLOW_SHARE[0] + FLOW_SHARE[1] ? 1 : 2);

function onGlass(draw) {
  if (S.view !== 'deep' || !S.snatched) return;
  ctx.save();
  ctx.setTransform(S.dpr, 0, 0, S.dpr, 0, 0);
  draw();
  ctx.restore();
}
// The water's band on the glass, top to bottom.
const water = () => ({ top: (deepTop() - S.camY) * S.zoom, bottom: (deepFloor() - S.camY) * S.zoom });

// Each depth's track runs, on its own sliding plane, from off the glass with
// the camera at the deep's left end to off the glass with it at the right:
// whatever the view, a crossing starts and ends out of sight. The schedule
// runs a whole crossing ahead of the clock, so the water is full from the
// first frame.
function track(d) {
  const z = S.zoom * FLOW_PARALLAX[d];
  return { from: deepX0() * z - FLOW_MARGIN, to: Math.max(deepX0(), deepX1() - S.viewW) * z + S.W + FLOW_MARGIN };
}
const AHEAD = () => (Math.max(...[0, 1].map(d => track(d).to - track(d).from)) / (Math.min(...FLOW_SPEED) * 0.8));
function crossings(want, now0) {
  const out = [], ahead = AHEAD(), t = now0 + ahead;
  for (let i = Math.max(0, Math.floor((t - ahead) / FLOW_EVERY_S) - 1); i <= Math.floor(t / FLOW_EVERY_S); i++) {
    const at = i * FLOW_EVERY_S + unit(i * 31) * FLOW_EVERY_S;
    const d = depthOf(unit(i * 5));
    if (!want(d) || at > t) continue;
    const { from, to } = track(d), span = to - from;
    const dir = unit(i * 7) < 0.5 ? 1 : -1, speed = FLOW_SPEED[d] * (0.8 + unit(i * 19) * 0.4);
    const run = (t - at) * speed;
    if (run > span) continue;
    const x = (dir > 0 ? from + run : to - run) - S.camX * S.zoom * FLOW_PARALLAX[d];
    out.push({ d, dir, x, at, kind: Math.floor(unit(i * 13) * SP.length), y: unit(i * 17) });
  }
  return out;
}
function drawCrossing(c, t) {
  const { top, bottom } = water(), band = bottom - top;
  const cell = Math.max(1, Math.round(P * S.zoom * FLOW_CELL[c.d]));
  // the far ones higher in the water, the near ones lower, all inside it
  const y = top + band * (0.12 + c.d * 0.18 + c.y * 0.45) + Math.sin((t - c.at) * 1.3 + c.at) * cell * 2;
  const put = (lx, ly, tone) => {
    ctx.fillStyle = toneAt(c.d, tone);
    ctx.fillRect(Math.round((c.x - c.dir * lx * cell) / cell) * cell, Math.round((y + ly * cell) / cell) * cell, cell, cell);
  };
  SP[c.kind].draw(put, t + c.at);
}

// Behind everything in the deep: the giant, then the far and middle crossings.
export function drawFishFar() {
  onGlass(() => {
    const t = now() / 1000, { top, bottom } = water();
    const len = 320, gx = -len - FLOW_MARGIN + (t % FLOW_GIANT_S) * FLOW_GIANT_SPEED;
    if (gx < S.W + FLOW_MARGIN) {
      ctx.fillStyle = GIANT;
      const mid = top + (bottom - top) * 0.3, cell = Math.max(2, Math.round(P * S.zoom * 0.5)), n = Math.ceil(len / cell);
      for (let i = 0; i < n; i++) {
        const r = 34 * Math.sin(Math.PI * i / n);
        ctx.fillRect(Math.round((gx + i * cell) / cell) * cell, Math.round((mid - r * 0.6) / cell) * cell, cell, Math.round((r * 1.2 + 6) / cell) * cell);
      }
    }
    for (const c of crossings(d => d < 2, t)) drawCrossing(c, t);
  });
}
// In front of the serpent: the near creatures, in the world, but the ones the
// serpent has eaten and the one it is eating.
export function drawFishNear() {
  if (S.view !== 'deep' || !S.snatched) return;
  const t = nowS(), gone = eatenBefore(t);
  const meal = S.serpentFreed || S.serpentStage >= SERPENT_PHASES ? null : mealNow(t);
  if (meal && meal.toLand <= BITE_BEFORE + MEAL_SWIM_S) gone.add(meal.i);
  for (const c of nearAll(t)) {
    if (gone.has(c.i)) continue;
    const sp = SP[c.kind], row = Math.round(laneY(c, t) / P);
    sp.draw((x, y, tone) => {
      ctx.fillStyle = tone;
      ctx.fillRect(Math.round(c.x / P - c.dir * x) * P, (row + y) * P, P, P);
    }, t + c.at);
  }
}
