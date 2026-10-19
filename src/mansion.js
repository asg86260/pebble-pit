// The ending's mansion (the owner, 2026-10-17 night: "the game ends with the
// squares getting a massive mansion to live in after freeing God"). On the
// house's ground at the yard's left end, bigger than the house: a main block
// between two lower wings, a tower at each of its corners. Drawn by
// render/mansion.js. A placeholder shape, before any mock.
//
// It is a standing job from the cage's fall (actbeats.js, `unchain`), so it
// can top out while the two of them walk home. The yard's own builders do it
// (spare hands if it has none), borrowed off their work the way the finale
// borrowed them for the house, and nothing pops: the scaffold goes up a pole
// a trip off the old house's woodpile; the fallen rock is broken up a row a
// trip onto the blocks pile beside the ground; every piece after is carried
// off that pile and set at its place by the body that carried it, floor by
// floor; the scaffold comes down last. A set piece fades in.
//
// Saved on `S.acts.mansion` (actbeats.js saves `S.acts`): the build's clock,
// and for each piece the clock when it was set. Who is carrying what is this
// session's (`w.mansion` on the body): a reload lets the builders go and the
// build takes hands again, each walking from where it stands; a piece it was
// carrying was not yet set, so it is carried again.

import { S } from './state.js';
import { P, WORKER, MANSION_AT, MANSION_FLOORS, MANSION_FLOOR_ROWS, MANSION_WING_W, MANSION_WING_FLOORS,
         MANSION_MAIN_W, MANSION_TOWER_W, MANSION_TOWER_FLOORS, MANSION_DOOR_W, MANSION_DOOR_H, MANSION_POLES,
         MANSION_BUILDERS, MANSION_BLOCKS_AT, MANSION_BLOCKS_W, MANSION_TAKE_S, MANSION_SET_S, MANSION_FADE_S,
         MANSION_SOULS, MANSION_SOUL_EVERY_S, MANSION_SHEET_AFTER_S, MANSION_FILE_W, MANSION_FILE_AT,
         ACT_ROCK_H, ACT_ROCK_W, GHOST_PX_S, FINALE_PILE_CELL, FINALE_PILE_W, FINALE_HOUSE_W } from './config.js';
import { lightDown, alongWalk, walkLength } from './ghosts.js';
import { frames } from './clock.js';
import { commutePace } from './levels.js';
import { feetOn, ways, keepTo, stepRoute, belowYard } from './route.js';
import { onYard } from './crew/body.js';
import { TYPE, isDeepType } from './jobs.js';
import { retask } from './crew.js';
import { houseX } from './home.js';

const R = MANSION_FLOOR_ROWS;
const feet = x => feetOn(ways().yard, x);

// --- where ---------------------------------------------------------------------
export const mansionX = () => MANSION_AT * P;
export const MANSION_W = MANSION_WING_W * 2 + MANSION_MAIN_W;
export const mansionDoorX = () => (MANSION_AT + MANSION_WING_W + MANSION_MAIN_W / 2) * P;
// The three piles a trip starts at: the old house's woodpile, the rock on the
// ruin, and the blocks pile the rock is broken up onto. World x of each middle.
export const woodX = () => houseX() + (FINALE_PILE_CELL + FINALE_PILE_W / 2) * P;
export const rockMidX = () => houseX() + FINALE_HOUSE_W * P / 2;
export const blocksX = () => (MANSION_BLOCKS_AT + MANSION_BLOCKS_W / 2) * P;

// --- the pieces ----------------------------------------------------------------
// In build order. `segs` are [x, row, w, h] in cells off the mansion's left
// end and up from the ground line (rows negative); `from` the pile a trip
// starts at; `to` where it goes ('piece', its own place, or the blocks pile);
// `stage` holds it back until every piece of an earlier stage is set, so the
// floors go up in order; `kind` is how it is drawn.
const BLOCKS = [
  { x: 0, w: MANSION_WING_W, floors: MANSION_WING_FLOORS },
  { x: MANSION_WING_W, w: MANSION_MAIN_W, floors: MANSION_FLOORS },
  { x: MANSION_WING_W + MANSION_MAIN_W, w: MANSION_WING_W, floors: MANSION_WING_FLOORS },
  { x: MANSION_WING_W - MANSION_TOWER_W / 2, w: MANSION_TOWER_W, floors: MANSION_TOWER_FLOORS, tower: true },
  { x: MANSION_WING_W + MANSION_MAIN_W - MANSION_TOWER_W / 2, w: MANSION_TOWER_W, floors: MANSION_TOWER_FLOORS, tower: true }
];
let LAYOUT = null;
export function mansionPieces() {
  if (LAYOUT) return LAYOUT;
  const out = [];
  const add = (p) => out.push(p);
  const poleH = MANSION_FLOORS * R;
  MANSION_POLES.forEach(x => add({ kind: 'pole', segs: [[x, -poleH, 1, poleH]], from: 'wood', to: 'piece', stage: 0 }));
  for (let r = 0; r < ACT_ROCK_H; r++) add({ kind: 'clear', segs: [], from: 'rock', to: 'blocks', stage: 1, row: r });
  const most = Math.max(...BLOCKS.map(b => b.floors));
  for (let f = 0; f < most; f++) {
    for (const b of BLOCKS) {
      if (f >= b.floors) continue;
      const half = Math.floor(b.w / 2), row = -(f + 1) * R;
      const parts = b.tower ? [[b.x, b.w]] : [[b.x, half], [b.x + half, b.w - half]];
      for (const [x, w] of parts) add({ kind: b.tower ? 'tower' : 'floor', segs: [[x, row, w, R]], from: 'blocks', to: 'piece', stage: 2 + f, block: b });
    }
  }
  const roofStage = 2 + most;
  for (const b of BLOCKS) {
    const top = -b.floors * R;
    const rows = b.tower ? [[b.x, b.w], [b.x + 1, b.w - 2], [b.x + 1, b.w - 2]] : [[b.x - 1, b.w + 2], [b.x + 1, b.w - 2], [b.x + 3, b.w - 6]];
    add({ kind: 'roof', segs: rows.map(([x, w], j) => [x, top - 1 - j, Math.max(1, w), 1]), from: 'blocks', to: 'piece', stage: roofStage });
  }
  const dx = MANSION_WING_W + MANSION_MAIN_W / 2 - MANSION_DOOR_W / 2;
  add({ kind: 'door', segs: [[dx, -MANSION_DOOR_H, MANSION_DOOR_W, MANSION_DOOR_H]], from: 'blocks', to: 'piece', stage: roofStage + 1 });
  MANSION_POLES.forEach((x, i) => add({ kind: 'off', segs: [], pole: i, from: 'pole', to: 'blocks', stage: roofStage + 2, x }));
  for (const p of out) {
    p.cx = p.segs.length ? (Math.min(...p.segs.map(s => s[0])) + Math.max(...p.segs.map(s => s[0] + s[2]))) / 2 : (p.x ?? 0) + 0.5;
  }
  return (LAYOUT = out);
}
// Where a piece is set from: the ground under its middle.
const spotOf = p => mansionX() + Math.round(p.cx - WORKER / P / 2) * P;
const pileOf = p => p.from === 'wood' ? woodX() : p.from === 'rock' ? rockMidX() : p.from === 'pole' ? spotOf(p) : blocksX();
const destOf = p => (p.to === 'blocks' ? blocksX() : spotOf(p));

// --- what stands -------------------------------------------------------------------
const M = () => S.acts && S.acts.mansion;
export const mansionBegun = () => !!M();
export const pieceSetAt = i => { const m = M(); return m && m.set[i] != null ? m.set[i] : null; };
// How far piece i has faded in, 0..1.
export function pieceIn(i) {
  const m = M(), at = pieceSetAt(i);
  if (at == null) return 0;
  return Math.max(0, Math.min(1, (m.T - at) / MANSION_FADE_S));
}
// A scaffold pole stands from its setting until the trip that takes it down sets.
export function poleUp(i) {
  const all = mansionPieces();
  const at = all.findIndex((p, j) => p.kind === 'pole' && MANSION_POLES.indexOf(p.segs[0][0]) === i);
  const off = all.findIndex(p => p.kind === 'off' && p.pole === i);
  return pieceSetAt(at) != null && pieceSetAt(off) == null;
}
// How many of the rock's rows are still on the ruin, and how many blocks the
// pile holds (rows brought less pieces taken off it).
export function rockRowsLeft() {
  const m = M();
  if (!m) return ACT_ROCK_H;
  return ACT_ROCK_H - mansionPieces().filter((p, i) => p.kind === 'clear' && m.set[i] != null).length;
}
export function blocksLeft() {
  const m = M();
  if (!m) return 0;
  const all = mansionPieces();
  const brought = all.filter((p, i) => p.kind === 'clear' && m.set[i] != null).length * ACT_ROCK_W;
  const fromPile = all.filter(p => p.from === 'blocks');
  const taken = fromPile.filter((p, i) => m.set[all.indexOf(p)] != null || claimed.has(all.indexOf(p))).length;
  return Math.max(0, brought - Math.round(taken * brought / Math.max(1, fromPile.length)));
}
export function woodLeft() {
  const m = M();
  const poles = mansionPieces().map((p, i) => [p, i]).filter(([p]) => p.kind === 'pole');
  if (!m) return poles.length;
  return poles.filter(([, i]) => m.set[i] == null && !claimed.has(i)).length;
}
export const mansionDone = () => !!(M() && M().done);
export const mansionStands = () => !!M();

// --- the job -------------------------------------------------------------------
// Begun: the clock and the empty set. Once.
export function beginMansion() {
  if (!S.acts || S.acts.mansion) return;
  S.acts.mansion = { T: 0, set: [], done: false, G: null };
}

// Pieces claimed by a body this session.
const claimed = new Set();
const free = w => !w.parade && !w.house && !w.mansion && !w.lifted && !w.falling && !w.aloft && !w.floating && !w.inside
  && w.craft == null && w.homeward == null && !w.carry && onYard(w) && !belowYard(w) && !isDeepType(w.type);
const first = w => (w.type === TYPE.BUILD ? 0 : w.type === TYPE.HAUL ? 1 : 2);

// One frame of the job: its clock, hands taken up to MANSION_BUILDERS, and
// done once every piece is set.
export function stepMansion(c) {
  const m = M();
  if (!m) return;
  m.T += c.dt / 1000;
  if (m.done) return;
  const all = mansionPieces();
  if (all.every((_, i) => m.set[i] != null)) { m.done = true; letGo(); return; }
  const have = S.workers.filter(w => w.mansion).length;
  if (have >= MANSION_BUILDERS || S.tick % 30) return;
  const x0 = mansionX();
  const pool = S.workers.filter(free).sort((a, b) => first(a) - first(b) || Math.abs(a.x - x0) - Math.abs(b.x - x0));
  const spare = pool.filter(w => first(w) < 2);
  for (const w of (spare.length ? spare : pool).slice(0, MANSION_BUILDERS - have)) {
    w.mansion = { st: 'idle', i: -1, u: 0 };
    w.walking = false; w.route = null; w.say = null;
    if (w.claim != null) w.claim = -1;
  }
}
// Every body let go back to its work.
function letGo() {
  for (const w of S.workers) if (w.mansion) { delete w.mansion; w.route = null; retask(w, w.type); }
  claimed.clear();
}
// For a new game or a read save: nobody is carrying anything.
export function forgetMansionHands() {
  claimed.clear();
  for (const w of S.workers) if (w.mansion) delete w.mansion;
}

// The next piece a body may take: unclaimed, unset, every earlier stage set.
function nextPiece() {
  const m = M(), all = mansionPieces();
  for (let i = 0; i < all.length; i++) {
    if (m.set[i] != null || claimed.has(i)) continue;
    const st = all[i].stage;
    if (all.some((p, j) => p.stage < st && m.set[j] == null)) return -1;
    return i;
  }
  return -1;
}

// Walk toward x along the yard, by the yard's routes where it can. True on arrival.
function walkTo(w, x) {
  const pace = commutePace();
  if (keepTo(w, x, ways().yard)) {
    if (stepRoute(w, pace)) return false;
    w.route = null;
  } else {
    const d = x - w.x;
    w.x += Math.sign(d) * Math.min(Math.abs(d), pace * frames());
    w.y = feet(w.x);
    if (Math.abs(x - w.x) > 0.5) return false;
  }
  w.x = x; w.y = feet(x);
  return true;
}

// One of a borrowed body's frames (crew/step.js): true while the job has it.
export function mansionBody(w) {
  const me = w.mansion;
  if (!me) return false;
  const m = M();
  if (!m || m.done) { delete w.mansion; return false; }
  const all = mansionPieces(), dt = frames() / 60;
  if (me.st === 'idle') {
    const i = nextPiece();
    if (i < 0) return true;
    claimed.add(i);
    me.i = i; me.st = 'fetch'; me.u = 0;
  }
  const p = all[me.i];
  if (!p || m.set[me.i] != null) { claimed.delete(me.i); me.st = 'idle'; return true; }
  if (me.st === 'fetch') { if (walkTo(w, pileOf(p))) { me.st = 'take'; me.u = 0; } return true; }
  if (me.st === 'take') { me.u += dt; if (me.u >= MANSION_TAKE_S) { me.st = 'carry'; me.u = 0; } return true; }
  if (me.st === 'carry') { if (walkTo(w, destOf(p))) { me.st = 'set'; me.u = 0; } return true; }
  if (me.st === 'set') {
    me.u += dt;
    if (me.u >= MANSION_SET_S) { m.set[me.i] = m.T; claimed.delete(me.i); me.st = 'idle'; me.i = -1; }
  }
  return true;
}
// What a borrowed body holds, for the drawing: the piece's kind while it
// carries or sets it, else null.
export function mansionHeld(w) {
  const me = w.mansion;
  if (!me || me.i < 0 || (me.st !== 'carry' && me.st !== 'set')) return null;
  return mansionPieces()[me.i] || null;
}

// --- the gathering -------------------------------------------------------------------
// Begun once the two of them are in; `G` the seconds since.
export function beginGathering() { const m = M(); if (m && m.G == null) m.G = 0; }
export function stepGathering(c) { const m = M(); if (m && m.G != null) m.G += c.dt / 1000; }
export const gatherAt = () => (M() && M().G != null ? M().G : null);
// Soul i, freed: out of the light over heaven's open gates at its turn, down
// through them and the cloud stair (ghosts.js, `lightDown`), and along the
// ground to its place in the files. Where it is at gathering second `g`,
// top-left, whether it is still on the stair, and how far it has come out of
// the light (`k`, its fade in), or null before its turn.
const slotX = i => (MANSION_FILE_AT + (i % MANSION_FILE_W) * 4 + Math.floor(i / MANSION_FILE_W) * 2) * P;
export function soulAt(i, g = gatherAt()) {
  if (g == null) return null;
  const u = g - i * MANSION_SOUL_EVERY_S;
  if (u < 0) return null;
  const way = lightDown(), d = u * GHOST_PX_S, k = Math.min(1, u / 0.5);
  const on = alongWalk(way, d);
  if (!on.done) return { x: on.x, y: on.y, stair: true, k };
  const foot = way[way.length - 1], to = slotX(i);
  const x = foot.x + Math.sign(to - foot.x) * Math.min(Math.abs(to - foot.x), d - walkLength(way));
  return { x, y: feet(x), stair: false, k };
}
// Every soul down and in its file, and the hold after.
export function gathered() {
  const g = gatherAt();
  if (g == null) return false;
  const last = MANSION_SOULS - 1, at = soulAt(last, g);
  if (!at || at.stair || Math.abs(at.x - slotX(last)) > 0.5) return false;
  const way = lightDown(), foot = way[way.length - 1];
  const walk = (walkLength(way) + Math.abs(slotX(last) - foot.x)) / GHOST_PX_S;
  return g >= last * MANSION_SOUL_EVERY_S + walk + MANSION_SHEET_AFTER_S;
}
