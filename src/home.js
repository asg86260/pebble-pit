// The house at the yard's left end (docs/mocks/finale-house-2026-10-12.html,
// the owner's picks): put up by the yard's builders while the two of them
// walk home in the finale (finale.js), a piece a trip from a pile they carried
// down the yard; then theirs for good, with the bench by the door and the
// woodpile the scaffold came down onto.
//
// The house stands wherever `S.retired` does, so a yard that has had the
// finale has it with nothing more written down -- an old save included. While
// the finale builds it, which pieces are up is the build's, in `S.finale.house`
// (never saved: a reload mid-finale lands with it finished, `land`).
//
// Nothing pops in: every piece leaves the pile in a builder's hands and is set
// in place by that builder, standing at it (`set`, kept for the checks).
//
// Afterwards (`stepRetired`) the two of them come out and sit on the bench,
// and take turns at random: sat, a heart, a stroll, one nipping in, both in a
// while. The window is lit while anyone is in. `S.retired` is `{ x, mode, u,
// left }`: where each of them is, the turn, the seconds into it and how long
// a turn with no end of its own still has. A mode this file does not know (an
// older save's) is read as sat on the bench.

import { S } from './state.js';
import { P, WORKER, FINALE_END_CELLS, FINALE_DOOR_CELL, FINALE_HOUSE_W, FINALE_WALL_ROWS, FINALE_WINDOW,
         FINALE_DOOR_W, FINALE_DOOR_H, FINALE_POSTS, FINALE_ROOF, FINALE_CHIMNEY, FINALE_BENCH, FINALE_BENCH_W,
         FINALE_POLES, FINALE_PLANK_ROW, FINALE_REACH_ROW, FINALE_PILE_CELL, FINALE_PILE_W, FINALE_PILE_HOMES,
         FINALE_BUILDERS, FINALE_BUILDERS_LEAST, FINALE_HAUL_S, FINALE_HAUL_MOST_PX_S, FINALE_BUILD_FROM_S, FINALE_BUILD_SPARE_S,
         FINALE_TRIP, FINALE_POLE_STEPS, FINALE_CHEER_PX_S,
         RETIRED_TURN_S, RETIRED_STROLL_CELLS, RETIRED_STROLL_S, RETIRED_HEART_S, RETIRED_OUT_S,
         RETIRED_OUT_HIM_S, RETIRED_DOOR_OUT_S, RETIRED_WALK_S, RETIRED_WALK_STEPS, RETIRED_SHUT_AT_S,
         RETIRED_NIP_S, RETIRED_NIP, RETIRED_IN_SHUT_AT_S, FINALE_STEP_S, FINALE_STEP_STEPS, FINALE_DIM_AT_S,
         FINALE_DIM_S, FINALE_DIM_STEPS, FINALE_HIM_AFTER_S, FINALE_DOOR_S, FINALE_DOOR_STEPS } from './config.js';
import { rand } from './rng.js';
import { frames } from './clock.js';
import { commutePace } from './levels.js';
import { feetOn, ways, sendTo, keepTo, stepRoute, belowYard } from './route.js';
import { onYard } from './crew/body.js';
import { wearing } from './kit.js';
import { TYPE, isDeepType } from './jobs.js';
import { clamp01, held, lerp, smoothstep as ease } from './motion.js';

// A held step: `k` 0..1 in `n` whole steps, each taken as its stretch ends.
const seg = (t, a, b) => clamp01((t - a) / (b - a));

// --- where it stands -------------------------------------------------------------
// In world pixels: the left wall, the door (where the walk ends), the pile's
// left end, the bench's, and the ground line's row in cells.
export const houseX = () => (FINALE_END_CELLS - FINALE_DOOR_CELL) * P;
export const doorX = () => FINALE_END_CELLS * P;
export const pileX = () => houseX() + FINALE_PILE_CELL * P;
export const benchX = () => houseX() + FINALE_BENCH * P;
const groundRow = () => Math.round(S.groundY / P);
const feet = x => feetOn(ways().yard, x);
// Whether the house is there at all: the yard has had its finale.
export const houseStands = () => !!S.retired || !!(S.finale && S.finale.house);

// --- the pieces ------------------------------------------------------------------------
// In the order the builders bring them: `segs` are [x, row, w, h] in cells
// from the left wall and up from the ground line; `up` pieces are set from
// the scaffold's plank; `off` pieces are the scaffold taken down, naming the
// piece they take away.
let LAYOUT = null;  // cache: worked out from config alone
export function pieces() {
  if (LAYOUT) return LAYOUT;
  const out = [];
  const add = (kind, segs, o = {}) => out.push({ kind, segs, ...o });
  const [pl, pr] = FINALE_POLES, poleH = -FINALE_PLANK_ROW, plankW = pr - pl + 1;
  add('pole', [[pl, FINALE_PLANK_ROW, 1, poleH]]);
  add('pole', [[pr, FINALE_PLANK_ROW, 1, poleH]]);
  add('plank', [[pl, FINALE_PLANK_ROW, plankW, 1]]);
  const top = -FINALE_WALL_ROWS - 1;
  FINALE_POSTS.forEach((x, i) => add('post', [[x, -FINALE_WALL_ROWS, 1, FINALE_WALL_ROWS]], { up: i >= 2 }));
  const mid = FINALE_POSTS[2];
  add('plate', [[0, top, mid + 1, 1]], { up: true });
  add('plate', [[mid + 1, top, FINALE_HOUSE_W - mid, 1]], { up: true });
  const [wx, wr, ww, wh] = FINALE_WINDOW, dx = FINALE_DOOR_CELL;
  for (let row = -1; row >= -FINALE_WALL_ROWS; row--) {
    const winRow = row >= wr && row < wr + wh, doorRow = row >= -FINALE_DOOR_H, up = row < FINALE_REACH_ROW;
    add('wall', winRow ? [[1, row, wx - 1, 1], [wx + ww, row, mid - wx - ww, 1]] : [[1, row, mid - 1, 1]], { up });
    add('wall', doorRow ? [[mid + 1, row, dx - mid - 1, 1], [dx + FINALE_DOOR_W, row, FINALE_HOUSE_W - 1 - dx - FINALE_DOOR_W, 1]]
                        : [[mid + 1, row, FINALE_HOUSE_W - 1 - mid, 1]], { up });
  }
  FINALE_ROOF.forEach(([x, w], j) => {
    const half = Math.floor(w / 2), row = top - 1 - j;
    add('roof', [[x, row, half, 1]], { up: true, eave: j === 0 });
    add('roof', [[x + half, row, w - half, 1]], { up: true, eave: j === 0 });
  });
  add('chimney', [FINALE_CHIMNEY], { up: true });
  add('door', [[dx, -FINALE_DOOR_H, FINALE_DOOR_W, FINALE_DOOR_H]]);
  add('window', [FINALE_WINDOW]);
  add('bench', [[FINALE_BENCH, -2, FINALE_BENCH_W, 1], [FINALE_BENCH, -1, 1, 1], [FINALE_BENCH + FINALE_BENCH_W - 1, -1, 1, 1]]);
  // and the scaffold down, the plank first
  add('plank', [[pl, FINALE_PLANK_ROW, plankW, 1]], { off: 2 });
  add('pole', [[pr, FINALE_PLANK_ROW, 1, poleH]], { off: 1 });
  add('pole', [[pl, FINALE_PLANK_ROW, 1, poleH]], { off: 0 });
  for (const p of out) {
    const x0 = Math.min(...p.segs.map(s => s[0])), x1 = Math.max(...p.segs.map(s => s[0] + s[2]));
    p.cx = (x0 + x1) / 2;
    p.top = Math.min(...p.segs.map(s => s[1]));
    p.w = Math.max(...p.segs.map(s => s[2]));
  }
  return (LAYOUT = out);
}
const STANDING = () => pieces().filter(p => p.off == null).length;

// --- the build ---------------------------------------------------------------------------
// Who builds it: the yard's builders, and the spare hands builders are drawn
// from to make up the gang -- the nearest the plot first; with none of
// either, a few of whoever else is on the yard. Taken off their work at the
// hand-over (finale.js); each carries a share of the pile down the yard to
// the plot while the deep half plays.
const canBuild = w => !w.parade && !w.lifted && !w.falling && !w.aloft && !w.floating && !w.inside
  && w.craft == null && w.homeward == null && !w.carry && onYard(w) && !belowYard(w) && !isDeepType(w.type);
const builderFirst = w => (w.type === TYPE.BUILD ? 0 : w.type === TYPE.HAUL ? (wearing(w) === 'cart' ? 2 : 1) : 3);
export function takeBuilders(f) {
  const x0 = pileX();
  const all = S.workers.filter(canBuild)
    .sort((a, b) => builderFirst(a) - builderFirst(b) || Math.abs(a.x - x0) - Math.abs(b.x - x0));
  const spare = all.filter(w => builderFirst(w) < 3);
  const gang = spare.length ? spare.slice(0, FINALE_BUILDERS) : all.slice(0, FINALE_BUILDERS_LEAST);
  gang.forEach((w, b) => {
    w.house = { b, st: 'haul', trip: -1, t0: 0 };
    w.walking = false;
    w.route = null;
    w.say = null;
    if (w.claim != null) w.claim = -1;
  });
  f.house = { n: gang.length, delivered: 0, next: 0, from: null, D: 0, step: 0, set: [], gone: [], wood: 0, done: false };
}
const homeX = b => pileX() + FINALE_PILE_HOMES[b % FINALE_PILE_HOMES.length] * P;
const cheerX = b => pileX() - (b + 1) * WORKER;

// The plan, made as the pair come out of the pit: trips a step apart from
// FINALE_BUILD_FROM_S, each its own length, the last done FINALE_BUILD_SPARE_S
// before `doorT` -- when the pair will reach the door, on the finale's clock.
export function planBuild(f, doorT) {
  const h = f.house;
  if (!h) return;
  const N = pieces().length, gang = Math.max(1, h.n);
  const room = Math.max(1, doorT - FINALE_BUILD_SPARE_S - FINALE_BUILD_FROM_S);
  h.D = room / ((N - 1) / gang + 1);
  h.step = h.D / gang;
  h.from = FINALE_BUILD_FROM_S;
}

export const spotOf = p => houseX() + Math.round(p.cx - WORKER / P / 2) * P;
const upY = () => S.groundY + (FINALE_PLANK_ROW - WORKER / P) * P;
const poleOf = p => {
  const [pl, pr] = FINALE_POLES, at = Math.round(p.cx - WORKER / P / 2);
  return houseX() + (Math.abs(at - pl) < Math.abs(at - pr) ? pl - 1 : pr - 1) * P;
};
// The body of a scaffold piece an `off` trip takes down.
const scaffoldOf = p => pieces().findIndex(o => o.off == null && o.kind === p.kind && o.segs[0][0] === p.segs[0][0]);

// One of the builders' frames, from the hand-over to the sheet (finale.js,
// `finaleBody`): the haul down to the pile, then a piece a trip, then off to
// the side to cheer.
export function stepBuilder(w, f) {
  const h = f.house, me = w.house;
  if (!h || !me) return;
  const dt = frames() / 60 * f.hurry;
  if (me.st === 'haul') {
    const to = homeX(me.b);
    if (me.pace == null) me.pace = Math.min(FINALE_HAUL_MOST_PX_S / 60, Math.max(commutePace(), Math.abs(w.x - to) / FINALE_HAUL_S / 60));
    if (!keepTo(w, to, ways().yard)) { w.x = to; w.y = feet(to); }
    if (stepRoute(w, me.pace * f.hurry)) return;
    w.route = null;
    w.x = to; w.y = feet(to);
    me.st = 'idle';
    h.delivered++;
    return;
  }
  if (me.st === 'cheer') {
    const to = cheerX(me.b), d = to - w.x;
    w.x += Math.sign(d) * Math.min(Math.abs(d), FINALE_CHEER_PX_S * dt);
    w.y = feet(w.x);
    return;
  }
  if (me.st === 'idle') {
    if (h.from == null) return;
    const N = pieces().length;
    if (h.next >= N) {
      if (!S.workers.some(o => o.house && o.house.st === 'trip')) { h.done = true; me.st = 'cheer'; }
      return;
    }
    const i = h.next, p = pieces()[i];
    if (f.T < h.from + i * h.step) return;
    // the scaffold comes down only once everything set from it is up
    if (p.off != null && pieces().some((o, j) => o.up && !h.set[j])) return;
    h.next++;
    me.st = 'trip'; me.trip = i; me.t0 = f.T;
  }
  if (me.st !== 'trip') return;
  const i = me.trip, p = pieces()[i], k = (f.T - me.t0) / h.D, T = FINALE_TRIP;
  const pile = homeX(me.b), spot = spotOf(p), ground = feet(pile);
  me.rows = 3; me.arms = false; me.hold = null;
  if (p.off != null) {
    if (k < T.offOut) { w.x = lerp(pile, spot, ease(k / T.offOut)); w.y = ground; }
    else if (k < T.offBack) {
      w.x = spot; w.y = ground; me.arms = true;
      if (k >= T.offTake) { h.gone[scaffoldOf(p)] = true; me.hold = p; }
    } else if (k < T.offDrop) { h.gone[scaffoldOf(p)] = true; w.x = lerp(spot, pile, ease((k - T.offBack) / (T.offDrop - T.offBack))); w.y = ground; me.hold = p; }
    else { if (!h.set[i]) { h.set[i] = { by: w.name, x: w.x, y: w.y }; h.wood++; } w.x = pile; w.y = ground; me.rows = 2; }
  } else if (k < T.take) {
    w.x = pile; w.y = ground; me.rows = 2; if (k > T.take / 2) me.hold = p;
  } else if (!p.up) {
    if (k < T.carry) { w.x = lerp(pile, spot, ease((k - T.take) / (T.carry - T.take))); w.y = ground; me.hold = p; }
    else if (k < T.back) {
      w.x = spot; w.y = ground; me.arms = true;
      if (k < T.set) me.hold = p; else setPiece(h, i, w);
      if (k >= T.squat[0] && k < T.squat[1]) me.rows = 2;
    } else { setPiece(h, i, w); w.x = lerp(spot, pile, ease((k - T.back) / (1 - T.back))); w.y = ground; }
  } else {
    // up the nearer pole a cell a step, along the plank, set it, and back
    const pole = poleOf(p), top = upY();
    if (k < T.pole) { w.x = lerp(pile, pole, ease((k - T.take) / (T.pole - T.take))); w.y = ground; me.hold = p; }
    else if (k < T.climb) { w.x = pole; w.y = lerp(ground, top, held((k - T.pole) / (T.climb - T.pole), FINALE_POLE_STEPS)); me.hold = p; }
    else if (k < T.along) { w.x = lerp(pole, spot, ease((k - T.climb) / (T.along - T.climb))); w.y = top; me.hold = p; }
    else if (k < T.back) { w.x = spot; w.y = top; me.arms = true; if (k < T.set) me.hold = p; else setPiece(h, i, w); }
    else if (k < T.unclimb) { setPiece(h, i, w); w.x = lerp(spot, pole, ease((k - T.back) / (T.unclimb - T.back))); w.y = top; }
    else if (k < T.down) { w.x = pole; w.y = lerp(top, ground, held((k - T.unclimb) / (T.down - T.unclimb), FINALE_POLE_STEPS)); }
    else { w.x = lerp(pole, pile, ease((k - T.down) / (1 - T.down))); w.y = ground; }
    // up there it stands on the plank, which the fall rule cannot see
    if (w.y < ground - 0.5) w.aboardAt = S.tick;
  }
  if (k >= 1) { w.x = pile; w.y = ground; me.st = 'idle'; me.trip = -1; me.rows = 3; me.arms = false; me.hold = null; }
}
function setPiece(h, i, w) {
  if (!h.set[i]) h.set[i] = { by: w.name, x: w.x, y: w.y };
}
// How a builder is drawn this frame (render/crew.js, render/finale.js): two
// rows tall when stooped, its arms up when setting a piece, and what it holds.
export function builderPose(w) {
  const me = w.house;
  if (!me) return null;
  if (me.st === 'haul') return { rows: 3, arms: false, hold: 'bundle' };
  if (me.st !== 'trip') return null;
  return { rows: me.rows || 3, arms: !!me.arms, hold: me.hold || null };
}
// Let go of when the sheet is put down (finale.js, `sheetDown`).
export function freeBuilders() {
  for (const w of S.workers) if (w.house) delete w.house;
}

// --- what is standing -----------------------------------------------------------------
// Whether piece `i` is in place: all of them, scaffold down, once the house
// is finished or was had already; while it is going up, set and not yet
// taken down.
export function pieceUp(i) {
  const p = pieces()[i];
  const h = S.finale && S.finale.house;
  if (p.off != null) return false;
  const scaffold = p.kind === 'pole' || p.kind === 'plank';
  if (!h || h.done || h.all) return !scaffold;
  return !!h.set[i] && !h.gone[i];
}
// The pile's rows still standing (its pieces not yet taken, of those carried
// down), and the woodpile's rows on it.
export function pileNow() {
  const h = S.finale && S.finale.house;
  const offs = pieces().filter(p => p.off != null).length;
  if (!h || h.all || h.done) return { left: 0, wood: offs };
  const N = pieces().length;
  let taken = 0;
  for (let i = 0; i < N; i++) if (pieces()[i].off == null && (h.set[i] || i < h.next)) taken++;
  const share = h.n ? h.delivered / h.n : 0;
  return { left: (STANDING() - taken) / STANDING() * share, wood: h.wood };
}
// Finished, for the checks: every piece set and the scaffold down.
export function houseDone() {
  const h = S.finale && S.finale.house;
  if (!h) return houseStands();
  return h.done || !!h.all;
}
// Stood up finished at once (a reload mid-finale, `land`).
export function finishHouse(f) {
  if (!f.house) f.house = { n: 0, delivered: 0, next: pieces().length, from: 0, D: 0, step: 0, set: [], gone: [], wood: 0, done: true };
  f.house.all = true;
  f.house.done = true;
}

// --- the two of them afterwards ------------------------------------------------------
const MODES = new Set(['in', 'out', 'sit', 'heart', 'stroll', 'nip']);
const TURNS = ['sit', 'heart', 'stroll', 'nip', 'in'];
const LENGTH = { out: RETIRED_OUT_S, heart: RETIRED_HEART_S, stroll: RETIRED_STROLL_S, nip: RETIRED_NIP_S };
// When everything of going in is done, its door shut.
export const IN_DONE_S = RETIRED_IN_SHUT_AT_S + FINALE_DOOR_S;
const bench = () => [benchX(), benchX() + WORKER];

// Home for good, both in, the door shut: the finale's end, and a reload's.
export function retiredIn() {
  return { x: [doorX(), doorX()], mode: 'in', u: IN_DONE_S, left: 0 };
}

export function stepRetired(c) {
  const r = S.retired;
  if (!r) return;
  if (!MODES.has(r.mode)) { r.mode = 'sit'; r.u = 0; r.left = RETIRED_TURN_S[0]; }
  const dt = c.dt / 1000;
  r.u = (r.u || 0) + dt;
  r.left = (r.left ?? 0) - dt;
  const len = LENGTH[r.mode];
  const over = len != null ? r.u >= len : r.left <= 0 && (r.mode !== 'in' || r.u >= IN_DONE_S);
  if (over) {
    // out of the door they sit together first, whatever comes after
    let mode = r.mode === 'in' ? 'out' : 'sit';
    if (r.mode !== 'in' && r.mode !== 'out') {
      mode = TURNS[Math.floor(rand() * TURNS.length) % TURNS.length];
      if (mode === r.mode) mode = TURNS[(TURNS.indexOf(mode) + 1) % TURNS.length];
    }
    r.mode = mode;
    r.u = 0;
    r.left = RETIRED_TURN_S[0] + rand() * (RETIRED_TURN_S[1] - RETIRED_TURN_S[0]);
  }
  r.x = afterPair(r).map(o => (o ? o.x : doorX()));
}

// Into the room from where it stands: the step to the door in held steps,
// then dimming into the lit room; null once in.
export function goInto(u, from) {
  const D = doorX();
  if (u < 0) return null;
  if (u < FINALE_DIM_AT_S) return { x: lerp(from, D, held(u / FINALE_STEP_S, FINALE_STEP_STEPS)) };
  if (u < FINALE_DIM_AT_S + FINALE_DIM_S) return { x: D, dim: 1 + Math.floor(seg(u, FINALE_DIM_AT_S, FINALE_DIM_AT_S + FINALE_DIM_S) * FINALE_DIM_STEPS) };
  return null;
}
// And out: undimming at the door, then along to `to` in held steps.
function comeOut(u, to) {
  const D = doorX();
  if (u < 0) return null;
  if (u < RETIRED_DOOR_OUT_S) return { x: D, dim: FINALE_DIM_STEPS - Math.floor(seg(u, 0, RETIRED_DOOR_OUT_S) * FINALE_DIM_STEPS) };
  return { x: lerp(D, to, held(seg(u, RETIRED_DOOR_OUT_S, RETIRED_DOOR_OUT_S + RETIRED_WALK_S), RETIRED_WALK_STEPS)) };
}
// Where the two of them are in a turn, [her, him]: { x, y, face, sit, dim }
// in world pixels, or null for one indoors.
export function afterPair(r) {
  const [bh, bm] = bench(), u = r.u || 0;
  const y = feet(bh), sat = x => ({ x, sit: true });
  let her = sat(bh), him = sat(bm);
  if (r.mode === 'in') {
    her = goInto(u, bh);
    him = goInto(u - FINALE_HIM_AFTER_S, bm) ?? (u < FINALE_HIM_AFTER_S ? sat(bm) : null);
  } else if (r.mode === 'out') {
    her = comeOut(u, bh);
    him = comeOut(u - RETIRED_OUT_HIM_S, bm);
    const sitAt = RETIRED_DOOR_OUT_S + RETIRED_WALK_S;
    if (her && u >= sitAt) her = sat(bh);
    if (him && u - RETIRED_OUT_HIM_S >= sitAt) him = sat(bm);
  } else if (r.mode === 'stroll') {
    const half = RETIRED_STROLL_S / 2, k = u < half ? u / half : Math.max(0, 2 - u / half);
    him = { x: bm + Math.round(k * RETIRED_STROLL_CELLS) * P, face: u < half ? 1 : -1 };
  } else if (r.mode === 'nip') {
    const N = RETIRED_NIP;
    if (u < N.door) her = { x: lerp(bh, doorX(), held(u / N.door, N.steps)) };
    else if (u < N.dim) her = { x: doorX(), dim: 1 + Math.floor(seg(u, N.door, N.dim) * FINALE_DIM_STEPS) };
    else if (u < N.out) her = null;
    else if (u < N.undim) her = { x: doorX(), dim: FINALE_DIM_STEPS - Math.floor(seg(u, N.out, N.undim) * FINALE_DIM_STEPS) };
    else her = { x: lerp(doorX(), bh, held(seg(u, N.undim, N.sit), RETIRED_WALK_STEPS)), sit: u >= N.sit };
  }
  return [her, him].map((o, i) => o && { x: o.x, y, face: o.face ?? (r.mode === 'heart' ? (i ? -1 : 1) : -1), sit: !!o.sit, dim: o.dim || 0 });
}

// How far the door stands open, 0..FINALE_DOOR_STEPS, open over [a, a +
// door] and shut over [b - door, b] of `u`.
export function doorBetween(u, a, b) {
  const n = FINALE_DOOR_STEPS, s = FINALE_DOOR_S;
  if (u < a || u >= b) return 0;
  return Math.max(0, Math.min(n, Math.floor(seg(u, a, a + s) * n + 1e-6)) - Math.floor(seg(u, b - s, b) * n + 1e-6));
}
// The door and the window afterwards: how far open, and whether lit.
export function afterDoor(r) {
  const u = r.u || 0;
  if (r.mode === 'out') return doorBetween(u, 0, RETIRED_SHUT_AT_S + FINALE_DOOR_S);
  if (r.mode === 'nip') return doorBetween(u, RETIRED_NIP.open[0], RETIRED_NIP.open[1]);
  if (r.mode === 'in') return doorBetween(u, RETIRED_NIP.open[0], IN_DONE_S);
  return 0;
}
export function afterLit(r) {
  return afterPair(r).some(o => !o || o.dim >= 2);
}

// The two of them's spots on the bench, for the checks.
export const benchAt = () => bench();
