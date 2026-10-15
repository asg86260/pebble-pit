// The serpent's meals (DESIGN.md, "The serpent eats to heal"): when a
// phase's window is nearly up, it takes the nearest creature swimming the
// deep with its constrict (the owner's B, "drag",
// docs/mocks/serpent-constrict-meal-2026-10-15.html) -- the comb lights head
// first, bolts leave its tips, an orb closes round the creature, the orb is
// hauled to the mouth shrinking as it nears, the jaws take it and the swallow
// runs to the belly, where the heal lands (`deep/serpent.js`).
//
// The meal under way is `S.mealGo`, saved, and counted in seconds since it
// began, so a reload finds it where it was: the creature's kind and the spot
// the orb closed on are written down, and its slot of the walk is held empty
// again on the new page (`settleMeal`). Where the orb is at a moment is read
// off that and the coil, never stored. Drawn in render/serpent.js.

import { S } from '../state.js';
import { SERPENT_WINDOW, MEAL_WARN_S, ORB_BOLT_S, ORB_R, ORB_CLOSE_S, MEAL_GULP_S, MEAL_SWALLOW_S, MEAL_REEL,
         MEAL_FRONT, MEAL_SWING, MEAL_SHRINK, MEAL_COMB_LEFT, MEAL_GULP_BOLTS, MEAL_JAW_REACH, MEAL_GULP_SHUT,
         MEAL_GULP_IN, MEAL_SKIP, MEAL_LEAD_S, MEAL_BACK_S, MEAL_GAPE, MEAL_HINGE, JAW_POSES, SNOUT, P } from '../config.js';
import { coilLine, deepX0, deepTop } from './place.js';
import { SLOTS, COLS, visitAt, faunaPose, eatenNow, holdSlot, slotGone, widthOf, heightOf, waterTop, bolting } from './fauna.js';
import { held, smoothstep as ease } from '../motion.js';

// The jaw's held poses (JAW_POSES: shut, ajar, gape): how far open `k` (0..1)
// of the way to a full gape shows. The meal, the snatch and the roar all
// step through it, so the one mouth opens one way.
export const jawPose = k => JAW_POSES[Math.round(held(k, JAW_POSES.length - 1) * (JAW_POSES.length - 1))];
// How far each jaw stands off the mouth's line `d` cells back from the tip,
// for jaws `open` 0..1: widest at the tip, nothing at the hinge.
export const jawGap = (d, open) => (open > 0 && d < MEAL_HINGE ? MEAL_GAPE * open * (1 - Math.max(0, d) / MEAL_HINGE) : 0);

export const windowS = () => SERPENT_WINDOW[Math.max(0, Math.min(SERPENT_WINDOW.length - 1, S.serpentStage))];
// Whether the window has run far enough for a meal to begin.
export const mealDue = () => S.mealT >= windowS() - MEAL_LEAD_S;

// --- the meal's beats ----------------------------------------------------------
// The haul's length, from how many cells it has to come.
export const reelOf = d => Math.max(MEAL_REEL.min, Math.min(MEAL_REEL.max, MEAL_REEL.base + d / MEAL_REEL.per));
// The beats in order and how long each is; the haul's is known once it starts.
function beats(g) {
  return [['warn', MEAL_WARN_S], ['bolts', ORB_BOLT_S], ['reel', g.reel ?? reelOf(0)], ['gulp', MEAL_GULP_S], ['lump', MEAL_SWALLOW_S]];
}
const startOf = (g, name) => { let at = 0; for (const [n, d] of beats(g)) { if (n === name) return at; at += d; } return at; };
export const landAt = g => startOf(g, 'lump') + MEAL_SWALLOW_S;
const backAt = g => startOf(g, 'lump') + MEAL_BACK_S;
// Which beat meal `g` is on, and how far through it (0..1): `done` once it has landed.
export function beatOf(g = S.mealGo) {
  if (!g) return null;
  let at = 0;
  for (const [name, d] of beats(g)) {
    if (g.t < at + d) return { name, k: d > 0 ? (g.t - at) / d : 1, s: g.t - at };
    at += d;
  }
  return { name: 'done', k: 1, s: g.t - at };
}

// --- where things are ----------------------------------------------------------
// The snout's tip at `ms`, which way the mouth points, and the spot just off
// it the orb is hauled to.
export function mouthAt(ms) {
  const h = coilLine(0, ms), segPx = coilLine(1, ms).x - h.x || 1, tip = coilLine(-SNOUT / segPx, ms);
  let ox = tip.x - h.x, oy = tip.y - h.y;
  const l = Math.hypot(ox, oy) || 1;
  ox /= l; oy /= l;
  return { tip, ox, oy, x: tip.x + ox * MEAL_FRONT * P, y: tip.y + oy * MEAL_FRONT * P };
}
// The orb at `ms`: its middle (world pixels), its radius in cells, how much of
// it shows, and how far the creature inside is squeezed; null before it has
// closed and once it is swallowed.
export function orbOf(ms, g = S.mealGo) {
  const b = beatOf(g);
  if (!b || g.x == null || b.name === 'warn' || b.name === 'lump' || b.name === 'done') return null;
  if (b.name === 'bolts') {
    const r = Math.min(ORB_R, 1 + (ORB_R - 1) * b.s / ORB_CLOSE_S);
    return { x: g.x, y: g.y, r, alpha: 1, squash: 1 };
  }
  const f = mouthAt(ms), e = b.name === 'reel' ? ease(b.k) : 1;
  // a curve in to the snout from in front of it, its middle out past the
  // mouth and up, never over the top of the water
  const cx = Math.min(g.x, f.x) + f.ox * MEAL_SWING[0] * P;
  const cy = Math.max(deepTop() + (waterTop() + ORB_R + 1) * P, Math.min(g.y, f.y) - MEAL_SWING[1] * P);
  const a = (1 - e) * (1 - e), m = 2 * (1 - e) * e, c = e * e;
  let x = a * g.x + m * cx + c * f.x, y = a * g.y + m * cy + c * f.y, alpha = 1;
  let r = MEAL_SHRINK[0][1];
  for (const [from, rr] of MEAL_SHRINK) if (e >= from) r = rr;
  if (b.name === 'gulp') {
    const k = ease(b.k);
    x = f.x - f.ox * MEAL_GULP_IN * P * k; y = f.y - f.oy * MEAL_GULP_IN * P * k;
    alpha = 1 - k;
  }
  return { x, y, r, alpha, squash: r / ORB_R };
}
// How much of the comb is lit, head first, 0..1.
export function mealComb(g = S.mealGo) {
  const b = beatOf(g);
  if (!b) return 0;
  if (b.name === 'warn') return b.k;
  if (b.name === 'bolts') return 1;
  if (b.name === 'reel') return Math.max(MEAL_COMB_LEFT, 1 - ease(b.k));
  if (b.name === 'gulp') return b.k < MEAL_GULP_BOLTS ? MEAL_COMB_LEFT : 0;
  return 0;
}
// The bolts to the orb: how much of them shows (0 none), and their shape,
// held a sixth of a second as the fight's are.
export function mealBolts(g = S.mealGo) {
  const b = beatOf(g);
  if (!b || g.x == null) return null;
  const shape = Math.floor((g.t - MEAL_WARN_S) * 6);
  if (b.name === 'bolts' || b.name === 'reel') return { alpha: 1, shape };
  if (b.name === 'gulp' && b.k < MEAL_GULP_BOLTS) return { alpha: 1 - b.k / MEAL_GULP_BOLTS, shape };
  return null;
}
// How far open the jaws are for the meal, 0..1, in their held poses: opening
// as the orb comes in, held through the gulp and shut on it.
export function mealJaw(ms, g = S.mealGo) {
  const b = beatOf(g);
  if (!b) return 0;
  if (b.name === 'reel') {
    const o = orbOf(ms, g), f = mouthAt(ms);
    return jawPose(Math.max(0, Math.min(1, 1 - Math.hypot(o.x - f.x, o.y - f.y) / (MEAL_JAW_REACH * P))));
  }
  if (b.name === 'gulp') return b.k < MEAL_GULP_SHUT[0] ? JAW_POSES[2] : b.k < MEAL_GULP_SHUT[1] ? JAW_POSES[1] : JAW_POSES[0];
  return 0;
}
// The swallow, 0..1 of its way from the head to the belly, or null.
export function mealLump(g = S.mealGo) {
  const b = beatOf(g);
  return b && b.name === 'lump' ? b.k : null;
}

// --- choosing the creature -----------------------------------------------------
// The nearest the mouth of the slots' swimmers the meal can take: of those on
// the glass if any are, else of those in the deep, else of any (one out past
// an end has the longer haul). One mid-bolt is not taken. Null if every slot
// is already held.
function pick(ms) {
  const t = ms / 1000, tip = mouthAt(ms).tip, deep = S.view === 'deep';
  let best = null;
  for (const c of SLOTS) {
    const v = visitAt(c, t);
    if (eatenNow(v, t) || MEAL_SKIP.includes(v.kind) || bolting(v, t)) continue;
    const p = faunaPose(v, t);
    const x = deepX0() + (p.x + widthOf(v.kind) / 2) * P, y = deepTop() + (p.y + heightOf(v.kind) / 2) * P;
    const seen = deep && x > S.camX && x < S.camX + S.viewW && y > S.camY && y < S.camY + S.viewH;
    const rank = seen ? 0 : p.x > 0 && p.x < COLS ? 1 : 2;
    const d = Math.hypot(x - tip.x, y - tip.y);
    if (!best || rank < best.rank || (rank === best.rank && d < best.d)) best = { rank, d, slot: c.slot, v, p, x, y };
  }
  return best;
}

// --- the meal's clock ----------------------------------------------------------
// A meal begins: only the comb lights; the creature is chosen as the bolts
// leave, wherever it has swum by then.
export function startMeal(ms) {
  freeHeld(ms);
  S.mealGo = { t: 0, slot: null, kind: null, seed: 0, dir: 1, x: null, y: null, reel: null, heals: true };
}
// A slot held with no meal to hold it (a meal dropped by a check or a hook
// setting the fight) lets its next kind in, as the meal would have.
function freeHeld(ms) {
  for (const c of SLOTS) if ((!S.mealGo || S.mealGo.slot !== c.slot) && slotGone(c.slot, ms / 1000)) holdSlot(c.slot, ms / 1000, false);
}
// The meal `secs` on at `ms`: the creature taken as the bolts leave, the haul
// timed as it starts, its slot let go once the meal is well down. True on the
// frame it lands at the belly.
export function stepMeal(secs, ms) {
  const g = S.mealGo;
  if (!g) return false;
  const was = g.t;
  g.t += secs;
  const cross = at => was < at && g.t >= at;
  const bolts = MEAL_WARN_S, reel = bolts + ORB_BOLT_S;
  if (g.x == null && g.t >= bolts) {
    const got = pick(ms);
    if (!got) { g.t = Math.min(g.t, bolts - 1e-6); return false; }   // every slot held: the comb stays lit a beat
    g.slot = got.slot; g.kind = got.v.kind; g.seed = got.v.seed; g.dir = got.p.dir;
    g.x = got.x; g.y = got.y;
    holdSlot(g.slot, ms / 1000, true);
  }
  if (g.reel == null && g.t >= reel) {
    const f = mouthAt(ms);
    g.reel = reelOf(Math.hypot(g.x - f.x, g.y - f.y) / P);
  }
  const landed = cross(landAt(g));
  if (g.t >= backAt(g)) {
    holdSlot(g.slot, ms / 1000, false);
    S.mealGo = null;
  }
  return landed;
}
// A save read back: the creature in the orb is not on the new page's walk.
export function settleMeal(ms) {
  freeHeld(ms);
  const g = S.mealGo;
  if (!g || g.slot == null || !SLOTS[g.slot]) return;
  if (!slotGone(g.slot, ms / 1000)) holdSlot(g.slot, ms / 1000, true);
}
