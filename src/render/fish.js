// The creatures the serpent eats (DESIGN.md, "The serpent eats to heal"), the
// owner's eight (docs/mocks/heal-bestiary-2026-09-30.html), drawn cell by cell
// from a local frame: x runs back from the front tip, the end that goes in the
// mouth, and y runs down. A meal is a swim in from the left, the jaws, a
// swallow; the creature is drawn just before the serpent, so its head is in
// front of it and the mouth's gape is the only place it shows inside.
//
// Only drawn: which creature and when are `deep/meals.js`, off the saved meal
// counter, and the heal itself is the sim's (`deep/serpent.js`); where the
// stream's creatures are, and which are reacting to a click, `deep/flow.js`.

import { now } from '../clock.js';
import { S } from '../state.js';
import { ctx } from './ctx.js';
import { GREYS, PURPLES, dimmed } from './deeptones.js';
import { coilLine } from '../deep/place.js';
import { mealNow, nearAt, nearAll, eatenBefore, nowS, BITE_BEFORE, jawOpen, jawGap } from '../deep/meals.js';
import { P, SNOUT, MEAL_SWIM_S, MEAL_GULP_S, MEAL_SWALLOW_S, MEAL_HINGE, MEAL_SQUEEZE,
         FLOW_KINDS, FLOW_LENGTHS, SERPENT_PHASES,
         FAUNA_SMEAR } from '../config.js';
import { nearY, streamPose, streamLead } from '../deep/flow.js';
import { smoothstep as ease } from '../motion.js';

// The mock's tones, on the deep's own ramps.
const G = [4, 6, 8, 9, 10, 11].map(i => GREYS[i]);
const Pu = [2, 3, 4, 5, 7, 9, 10, 11, 11].map(i => PURPLES[i]);
const BLACK = GREYS[0];
const unit = n => { const x = Math.sin(n * 127.1 + 3.7) * 43758.5453; return x - Math.floor(x); };

const ell = (put, cx, cy, rx, ry, tone) => {
  for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++)
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
      const d = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2;
      if (d <= 1) put(x, y, tone(x, y, d));
    }
};
const SP = [
  { name: 'Lantern angler', L: FLOW_LENGTHS[0], bob: t => Math.sin(t * 2.4) * 1.6,
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
  { name: 'Ribbon eel', L: FLOW_LENGTHS[1], bob: t => 0,
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
  { name: 'Glass jelly', L: FLOW_LENGTHS[2], bob: t => Math.sin(t * 1.5) * 3,
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
  { name: 'Skull fish', L: FLOW_LENGTHS[3], bob: t => Math.sin(t * 0.9) * 1,
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
  { name: 'Wandering eye', L: FLOW_LENGTHS[4], bob: t => Math.sin(t * 2.6) * 2,
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
  { name: 'Spiral drifter', L: FLOW_LENGTHS[5], bob: t => Math.sin(t * 1.8) * 1.5,
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
  { name: 'Many-mouthed blob', L: FLOW_LENGTHS[6], bob: t => Math.sin(t * 2.2) * 2,
    draw(put, t) {
      const lobes = [[7, 0, 4.4 + Math.sin(t * 3) * 0.7, 3.6], [3.5, -1, 3 + Math.sin(t * 4 + 1) * 0.6, 2.8], [10.5, 1, 3.2 + Math.sin(t * 3.5 + 2) * 0.6, 3], [6, 2.4, 2.6 + Math.sin(t * 5 + 3) * 0.5, 2.4]];
      // Indexed, not destructured: this is asked a thousand times a frame,
      // and a destructured array is an iterator made each time.
      const inside = (x, y) => {
        for (const l of lobes) if (((x - l[0]) / l[2]) ** 2 + ((y - l[1]) / l[3]) ** 2 <= 1) return true;
        return false;
      };
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
  { name: 'Toothed ring', L: FLOW_LENGTHS[7], bob: t => 0,
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

// The same eight seen through the rift (render/riftlife.js): one drawn into
// any `put` at its own clock `t`, in the deep's drawn tones, and its bob.
export const drawKind = (k, put, t) => SP[k].draw(put, t);
export const bobOf = (k, t) => SP[k].bob(t);

// --- a click's reaction ---------------------------------------------------------
// The owner's A for each of the eight (docs/mocks/creature-clicks-2026-10-13.html),
// the pose off deep/flow.js: moved along and down its own cells, its drawing
// held at a moment (`clock`) or run quick (`gain`), and the cells a pose adds.
// The angler's bulb ringed while it is held lit:
const HALO = [[1, -5], [1, -4], [-2, -5], [-2, -4], [0, -6], [-1, -6], [0, -3], [-1, -3]];
// The blob's five mouths, the order they shut in:
const MOUTHS = [[3, 0], [7, -2], [9, 2], [5, 3], [12, 0]];
// The ribbon eel tied `k` of the way into its knot: each cell of it moved
// that far from where its own swim has it to where the knot does -- the head
// straight, a loop thrown behind it, the tail swimming on -- so it ties and
// unties a cell at a time rather than popping from one drawing to the other.
function knotEel(put, t, k) {
  const r = 2.6;
  for (let i = 0; i < 26; i++) {
    let lx, ly;
    if (i < 3) { lx = i; ly = 0; }
    else if (i < 17) { const a = (i - 3) / 14 * Math.PI * 2; lx = 3 + Math.sin(a) * r + (i - 3) * 0.25; ly = -r + Math.cos(a) * r; }
    else { lx = 6.5 + (i - 16); ly = Math.sin(i / 2.4 - t * 7) * 0.8; }
    const sy = Math.round(Math.sin(i / 2.4 - t * 7) * Math.min(2.6, 0.6 + i * 0.09));
    const x = Math.round(i + (lx - i) * k), y = Math.round(sy + (ly - sy) * k);
    // the swim's drawing, cell for cell (SP[1]), carried along
    put(x, y, Pu[i < 3 ? 7 : 6]);
    if (i < 18) put(x, y + 1, Pu[i % 4 < 2 ? 8 : 7]);
    if (i > 3 && i < 21 && i % 2 === 0) put(x, y - 1, Pu[4]);
    if (i < 3) put(x, y - 1, Pu[6]);
  }
  const eye = Math.round(Math.sin(1 / 2.4 - t * 7) * 0.7) - 1;
  put(1, Math.round(eye + (-1 - eye) * k), G[5]);
  if (k < 0.5) put(-1, Math.round(Math.sin(-t * 7) * 0.6), G[5]);
}
// One creature of kind `k` into `put` (its own frame: x back from the front
// tip), on its own clock `t`, in `pose` or its own swim when that is null.
function drawPosed(k, put, t, pose) {
  if (!pose) { SP[k].draw(put, t); return; }
  const at = (x, y, tone) => put(x - pose.dx, y + pose.dy, tone);
  const clock = pose.clock ?? t + pose.gain;
  if (k === 1 && pose.knot) knotEel(at, clock, pose.knot);
  else SP[k].draw(at, clock);
  if (k === 0 && pose.halo) for (const [x, y] of HALO) at(x, y, Pu[4]);
  if (k === 6 && pose.mouths) for (const [x, y] of MOUTHS.slice(0, pose.mouths)) { at(x, y, BLACK); at(x, y + 1, BLACK); at(x + 1, y, G[5]); }
}
// The smear: on the frame a table marks for it, the pose a moment ago drawn
// under it, darker, if it has come far enough since.
const smearTone = new Map();
for (const c of [...GREYS, ...PURPLES]) smearTone.set(c, dimmed(c, FAUNA_SMEAR.rungs));
function drawReacting(k, put, t, poseNow, poseThen) {
  if (poseNow && poseThen) {
    const moved = Math.abs(poseNow.dx - poseThen.dx) + Math.abs(poseNow.dy - poseThen.dy);
    if (moved >= FAUNA_SMEAR.moved && moved < FAUNA_SMEAR.far)
      drawPosed(k, (x, y, tone) => put(x, y, smearTone.get(tone) || tone), t - FAUNA_SMEAR.lag, poseThen);
  }
  drawPosed(k, put, t, poseNow);
}
// A stream creature's pose now, and a moment ago when its table smears it.
const posesOf = (key, kind, t) => {
  const now0 = streamPose(key, kind, t);
  return [now0, now0 && now0.smear && now0.s >= FAUNA_SMEAR.lag ? streamPose(key, kind, t - FAUNA_SMEAR.lag) : null];
};

// --- the near stream and the meal, in the world ------------------------------------
// Where each near creature is, and which one a meal is, are the sim's
// (deep/meals.js, deep/flow.js); here they are drawn. The meal's height
// drifts from its lane to the mouth's.

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
  // A click is not taken on the meal close to its turn (deep/flow.js), but a
  // window moved after the click can make a reacting creature the meal: its
  // reaction plays out on the swim in, short of the jaws, rather than stop.
  const [pose, then] = posesOf('n' + meal.i, meal.kind, t);
  // Its own path and pace to the mouth; only its height drifts to the mouth's.
  // At the bite its front is at the tip of the jaws; then it is pulled in.
  const s = Math.max(0, Math.min(1, 1 - (toLand - BITE_BEFORE) / MEAL_SWIM_S)), e = ease(s);
  const gulp = Math.max(0, Math.min(1, (BITE_BEFORE - toLand) / MEAL_GULP_S));
  const front = c ? Math.min(c.x / P, mouthCol) : mouthCol;
  const col0 = Math.round(front + gulp * (sp.L + 1));
  const fromY = c ? nearY(c, t) / P : mouthRow;
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
  drawReacting(meal.kind, put, t + streamLead('n' + meal.i, meal.kind, t), pose, then);
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
    const row = Math.round(nearY(c, t) / P);
    const [pose, then] = posesOf('n' + c.i, c.kind, t);
    drawReacting(c.kind, (x, y, tone) => {
      ctx.fillStyle = tone;
      ctx.fillRect(Math.round(c.x / P - c.dir * x) * P, Math.round(row + y) * P, P, P);
    }, t + c.at + streamLead('n' + c.i, c.kind, t), pose, then);
  }
}

