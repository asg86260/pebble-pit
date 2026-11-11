// REVIEW review-mansion
// The ending's mansion (the owner, 2026-10-17 night: "the game ends with the
// squares getting a massive mansion to live in after freeing God"). On the
// house's ground at the yard's left end, bigger than the house: a main block
// between two lower wings, a tower at each of its corners. Drawn by
// render/mansion.js. A placeholder shape, before any mock.
//
// It is a standing job from the cage's fall (actbeats.js, `unchain`), so it
// can top out while the two of them walk home. It goes up on the yard's one
// construction (DESIGN.md, "The mansion and the house on the one
// construction"): a work on works.js, its own site, built by the yard's
// builders -- the spare, short of them a body lent off its post -- a piece a
// trip by its row's `way` (crew/builders.js). Nothing pops: the scaffold goes
// up a pole a trip off the old house's woodpile; the fallen rock is broken up
// a row a trip onto the blocks pile beside the ground; every piece after is
// carried off that pile and set at its place by the body that carried it,
// floor by floor; the scaffold comes down last. A set piece fades in.
//
// Saved on `S.acts.mansion` (actbeats.js saves `S.acts`): the build's clock,
// and for each piece the clock when it was set; the work is saved by
// works.js. Who is carrying what is this session's (`w.piece` on the body,
// not kept): a reload lets the carriers go, and a piece one was carrying was
// not yet set, so it is carried again.

import { S } from './state.js';
import { P, MANSION_AT, MANSION_FLOORS, MANSION_FLOOR_ROWS, MANSION_WING_W, MANSION_WING_FLOORS,
         MANSION_MAIN_W, MANSION_TOWER_W, MANSION_TOWER_FLOORS, MANSION_DOOR_W, MANSION_DOOR_H, MANSION_POLES,
         MANSION_BUILDERS, MANSION_BLOCKS_AT, MANSION_BLOCKS_W, MANSION_TAKE_S, MANSION_SET_S, MANSION_FADE_S,
         MANSION_SOULS, MANSION_SOUL_EVERY_S, MANSION_SHEET_AFTER_S, MANSION_FILE_W, MANSION_FILE_AT,
         ACT_ROCK_H, ACT_ROCK_W, GHOST_PX_S, ACT_FLOAT_PX_S, FINALE_PILE_CELL, FINALE_PILE_W, FINALE_HOUSE_W } from './config.js';
import { threshold, underGates, driftAt } from './ghosts.js';
import { craterRows } from './crater.js';
import { feetOn, ways } from './route.js';
import { TYPE } from './jobs.js';
import { start, abandonAt, workOn, registerRows } from './works.js';
import { shapePieces, pieceSpot } from './pieces.js';
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
let LAYOUT = null;  // cache: worked out from config alone
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
  return (LAYOUT = shapePieces(out));
}
// Where a piece is set from: the ground under its middle.
const spotOf = p => pieceSpot(mansionX(), p);
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
// the crater fills as the rock goes (crater.js)
craterRows(rockRowsLeft);
export function blocksLeft() {
  const m = M();
  if (!m) return 0;
  const all = mansionPieces();
  const brought = all.filter((p, i) => p.kind === 'clear' && m.set[i] != null).length * ACT_ROCK_W;
  const fromPile = all.filter(p => p.from === 'blocks');
  const taken = fromPile.filter((p, i) => m.set[all.indexOf(p)] != null || carrying(all.indexOf(p))).length;
  return Math.max(0, brought - Math.round(taken * brought / Math.max(1, fromPile.length)));
}
export function woodLeft() {
  const m = M();
  const poles = mansionPieces().map((p, i) => [p, i]).filter(([p]) => p.kind === 'pole');
  if (!m) return poles.length;
  return poles.filter(([, i]) => m.set[i] == null && !carrying(i)).length;
}
export const mansionDone = () => !!(M() && M().done);
export const mansionStands = () => !!M();

// --- the job -------------------------------------------------------------------
// A work on the yard's construction (works.js), on its own site, built by the
// yard's builders (`manSites`, crew/builders.js) a piece a trip: the row's
// `way` is the plan the builders carry by. Which pieces are set is this
// file's record (`set`, the fades' clock); the work's progress is read off it.
const carrying = i => S.workers.some(w => w.piece && w.piece.i === i && w.type === TYPE.BUILD && w.site === 'mansion');
// The next piece a hand may take: unset, nobody carrying it, every earlier
// stage set, so the floors go up in order.
function nextPiece() {
  const m = M(), all = mansionPieces();
  if (!m || m.done) return -1;
  for (let i = 0; i < all.length; i++) {
    if (m.set[i] != null || carrying(i)) continue;
    const st = all[i].stage;
    if (all.some((p, j) => p.stage < st && m.set[j] == null)) return -1;
    return i;
  }
  return -1;
}
export const MANSION_WAY = {
  count: () => mansionPieces().length,
  // With no mansion begun there is nothing to build: a work left over lands.
  laid: () => { const m = M(); return m ? mansionPieces().filter((_, i) => m.set[i] != null).length : mansionPieces().length; },
  next: nextPiece,
  from: i => pileOf(mansionPieces()[i]),
  to: i => destOf(mansionPieces()[i]),
  open: i => { const m = M(); return !!m && !m.done && i >= 0 && i < mansionPieces().length && m.set[i] == null; },
  set: i => { const m = M(); if (m && m.set[i] == null) m.set[i] = m.T; },
  // Where a hand with nothing to take waits: the nearest ground from its
  // blocks pile to the mansion's far end.
  near: x => Math.max(blocksX(), Math.min(mansionX() + (MANSION_W - 1) * P, x)),
  takeS: MANSION_TAKE_S,
  setS: MANSION_SET_S
};
const ROW = { key: 'mansion', kind: 'building', site: 'mansion', hands: MANSION_BUILDERS, way: MANSION_WAY, unlisted: true,
              buy() { const m = M(); if (m) m.done = true; } };
registerRows([ROW]);

// Begun: the clock, the empty set, and the work. Once.
export function beginMansion() {
  if (!S.acts || S.acts.mansion) return;
  S.acts.mansion = { T: 0, set: [], done: false, G: null };
  start('mansion', ROW, mansionDoorX());
}

// One frame of the job: its clock, and its work kept on the go while it is
// not done -- an old save, or one read back before the work was, picks it up
// here -- and taken off once it is.
export function stepMansion(c) {
  const m = M();
  if (!m) return;
  m.T += c.dt / 1000;
  const on = workOn('mansion');
  if (m.done) { if (on) abandonAt('mansion'); return; }
  if (!on) start('mansion', ROW, mansionDoorX());
}

// What a builder holds, for the drawing: the piece while it carries or sets
// it, else null.
export function mansionHeld(w) {
  const me = w.piece;
  if (!me || w.type !== TYPE.BUILD || w.site !== 'mansion' || (me.st !== 'carry' && me.st !== 'set')) return null;
  return mansionPieces()[me.i] || null;
}

// --- the gathering -------------------------------------------------------------------
// Begun once the two of them are in; `G` the seconds since.
export function beginGathering() { const m = M(); if (m && m.G == null) m.G = 0; }
export function stepGathering(c) { const m = M(); if (m && m.G != null) m.G += c.dt / 1000; }
export const gatherAt = () => (M() && M().G != null ? M().G : null);
// Soul i, freed: out of heaven's open gates at its turn, floated down from
// them to the ground under them (ghosts.js, `driftAt`, the pair's own sway),
// and along the ground to its place in the files. Where it is at gathering
// second `g`, top-left, whether it is still floating, and how far it has
// come out of the gateway (`k`, its fade in), or null before its turn.
const slotX = i => (MANSION_FILE_AT + (i % MANSION_FILE_W) * 4 + Math.floor(i / MANSION_FILE_W) * 2) * P;
// The float down's length and seconds, off the gates as they stand.
const fall = () => { const a = threshold(), b = underGates(); return { a, b, s: Math.hypot(b.x - a.x, b.y - a.y) / ACT_FLOAT_PX_S }; };
export function soulAt(i, g = gatherAt()) {
  if (g == null) return null;
  const u = g - i * MANSION_SOUL_EVERY_S;
  if (u < 0) return null;
  const f = fall(), k = Math.min(1, u / 0.5);
  if (u < f.s) { const at = driftAt(f.a, f.b, u / f.s); return { x: at.x, y: at.y, floating: true, k }; }
  const to = slotX(i);
  const x = f.b.x + Math.sign(to - f.b.x) * Math.min(Math.abs(to - f.b.x), (u - f.s) * GHOST_PX_S);
  return { x, y: feet(x), floating: false, k };
}
// Every soul down and in its file, and the hold after.
export function gathered() {
  const g = gatherAt();
  if (g == null) return false;
  const last = MANSION_SOULS - 1, at = soulAt(last, g);
  if (!at || at.floating || Math.abs(at.x - slotX(last)) > 0.5) return false;
  const f = fall(), walk = f.s + Math.abs(slotX(last) - f.b.x) / GHOST_PX_S;
  return g >= last * MANSION_SOUL_EVERY_S + walk + MANSION_SHEET_AFTER_S;
}
