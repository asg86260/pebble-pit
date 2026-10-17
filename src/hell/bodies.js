// The ghosts: the muster's members at work in hell (DESIGN.md, "Acts 3 and
// 4", act 4, "The crew: the muster").
//
// The muster's card says how many come down (`hellmuster`); they come down
// the road a line at a time, fading in at its top and climbing down into the
// landing, and the n-th to arrive takes the n-th job of HELL_JOBS. The wall
// gang is miners taken off their faces while a barrier can be worked
// (`S.hell.gang`, the gang card's choice), so the barrier costs the chain's
// output while it is worked. Nobody ages in hell and nobody is born.
//
// Every number that moves goes through a body: a miner swings at a face and
// the lump lies there; a hauler carries it to a furnace that can melt it, a
// bar from a tray to the anvil, a new tool from the anvil to a face or the
// gang, spoil to the heap, black water from the road's foot to the anvil and
// brimstone to the store; a stoker carries brimstone from a vent into a
// furnace and lights it; the smith's strokes are the anvil's only clock.
// Nothing is moved by a count: a source is taken from when the body is
// standing at it, a store given to when it arrives.
//
// The bodies are this act's own list (`S.hell.bodies`), saved whole -- where
// each stands, its way, what it carries -- so a reload stands every one back
// where it was. They are not the yard's crew and share no code with
// crew.js: the JOBS registry's rows for them wait on the mock.

import { S } from '../state.js';
import { P, HELL_TIERS, HELL_JOBS, GANG_MAX, GHOST_WALK, GHOST_CLIMB, MUSTER_EVERY_S, GHOST_FADE_S,
         HOPPER_MAX, FURNACE_FUEL_MAX, WALL_RATE } from '../config.js';
import { chamberFloor, ledgeY, ladderX, faceStand, ventX, furnaceStand, anvilX, storeX, roadX, roadTop,
         spoilX, barrierStand } from './place.js';
import { hellValue } from './levels.js';
import { blowFace, faceFull } from './ore.js';
import { blowWall, workableWall } from './barriers.js';
import { stoke, strikeAnvil, hopperCount, trayCount } from './forge.js';
import { flareBurning } from './chambers.js';

const N = () => HELL_TIERS.length;
const oreOf = i => HELL_TIERS[i].ore;

// How many the muster sends down: its card's value.
export const musterCount = () => Math.round(hellValue('hellmuster'));

// --- where a body goes -------------------------------------------------------
// A place in hell a body walks to, by what stands there: its x and its chamber.
function spotOf(ref) {
  const h = S.hell;
  switch (ref.k) {
    case 'face': return { x: faceStand(ref.i, h.seams[ref.i] || 0), c: ref.i };
    case 'vent': return { x: ventX(ref.i) - P, c: ref.i };
    case 'furnace': return { x: furnaceStand(ref.i), c: ref.i };
    case 'anvil': return { x: anvilX() - 2 * P, c: 0 };
    case 'store': return { x: storeX(), c: 0 };
    case 'road': return { x: roadX() + 2 * P, c: 0 };
    case 'wall': return { x: barrierStand(ref.i, ref.slot || 0), c: ref.i };
    case 'heap': return { x: spoilX(ref.i), c: ref.i };
  }
  return { x: storeX(), c: 0 };
}

// The way from a body's floor to a spot: along the floor to the ladder off
// the next chamber's ledge, down it, and on; or the same backward. A way is
// a list of points, each tagged with the chamber whose floor it is on.
function wayTo(b, x, c) {
  const pts = [];
  let at = b.c;
  while (at < c) {
    pts.push([ladderX(at + 1), ledgeY(at + 1), at]);
    pts.push([ladderX(at + 1), chamberFloor(at + 1), at + 1]);
    at++;
  }
  while (at > c) {
    pts.push([ladderX(at), chamberFloor(at), at]);
    pts.push([ladderX(at), ledgeY(at), at - 1]);
    at--;
  }
  pts.push([x, chamberFloor(c), c]);
  return pts;
}

// Walk the body on along its way: a floor at GHOST_WALK, a ladder at
// GHOST_CLIMB. True once it stands at the way's end.
function walk(b, dt) {
  let left = dt;
  while (b.way.length && left > 0) {
    const [tx, ty, tc] = b.way[0];
    const dx = tx - b.x, dy = ty - b.y, d = Math.hypot(dx, dy);
    const speed = Math.abs(dy) > Math.abs(dx) ? GHOST_CLIMB : GHOST_WALK;
    if (d <= speed * left) {
      b.x = tx; b.y = ty; b.c = tc;
      left -= d / speed;
      b.way.shift();
      continue;
    }
    b.x += dx / d * speed * left;
    b.y += dy / d * speed * left;
    if (dx) b.face = dx > 0 ? 1 : -1;
    left = 0;
  }
  return !b.way.length;
}

// Walk toward a spot; true once there.
function goTo(b, ref, dt) {
  const s = spotOf(ref);
  const end = b.way.length ? b.way[b.way.length - 1] : null;
  if (!end && Math.abs(b.x - s.x) < 1 && b.c === s.c && Math.abs(b.y - chamberFloor(s.c)) < 1) return true;
  if (!end || Math.abs(end[0] - s.x) > P / 2 || end[2] !== s.c) b.way = wayTo(b, s.x, s.c);
  return walk(b, dt);
}

// --- who does what -----------------------------------------------------------
// Each body's job this frame: its place in the muster's order, the gang
// taken off the last miners while a barrier can be worked.
function jobsWanted() {
  const h = S.hell, jobs = h.bodies.map((_, k) => HELL_JOBS[k % HELL_JOBS.length]);
  if (workableWall() >= 0) {
    let g = Math.min(h.gang, GANG_MAX);
    for (let k = jobs.length - 1; k >= 0 && g > 0; k--) if (jobs[k] === 'miner') { jobs[k] = 'gang'; g--; }
  }
  return jobs;
}

// What is already spoken for at a source, and coming to a store, by the
// bodies on their way: so two haulers are never sent for the one lump.
const same = (a, b) => a && b && a.k === b.k && a.i === b.i;
const claimed = (from, what) =>
  S.hell.bodies.reduce((n, b) => n + (b.task?.do === 'fetch' && !b.carry && same(b.task.from, from) && b.task.what === what ? 1 : 0), 0);
const coming = (to, what) =>
  S.hell.bodies.reduce((n, b) => n + (b.task?.do === 'fetch' && same(b.task.to, to) && (!what || b.task.what === what) ? 1 : 0), 0);

// The furnace a lump of tier `t` goes to: the first open chamber at or below
// its tier with room in its hopper, counting what is on its way.
function furnaceFor(t) {
  const h = S.hell;
  for (let j = t; j <= h.chamber; j++) {
    const to = { k: 'furnace', i: j };
    if (hopperCount(h.furnaces[j]) + coming(to, 'ore') < HOPPER_MAX) return to;
  }
  return null;
}

// A vent with crust nobody has been sent for, the nearest to chamber `near` first.
function ventWith(near) {
  const h = S.hell;
  let best = null, bd = Infinity;
  for (let i = 0; i <= h.chamber; i++) {
    const from = { k: 'vent', i };
    if (h.vents[i].crust - claimed(from, 'brim') <= 0) continue;
    const d = Math.abs(i - near);
    if (d < bd) { bd = d; best = from; }
  }
  return best;
}

// A hauler's next errand, in the order the chain needs them: a new tool to
// where it is wanted, bars to the anvil, ore to a furnace, spoil to the
// heap, water to the anvil, and brimstone to the store when there is
// nothing else.
function haulerTask() {
  const h = S.hell;
  const wall = workableWall();
  for (let i = 0; i <= h.chamber; i++) {
    const to = { k: 'face', i };
    if (h.faces[i].tool < h.tool && !coming(to, 'tool')) return { do: 'fetch', from: { k: 'anvil' }, to, what: 'tool' };
  }
  if (wall >= 0 && h.walls[wall].tool < h.tool) {
    const to = { k: 'wall', i: wall };
    if (!coming(to, 'tool')) return { do: 'fetch', from: { k: 'anvil' }, to, what: 'tool' };
  }
  for (let i = 0; i <= h.chamber; i++) {
    const from = { k: 'furnace', i };
    if (trayCount(h.furnaces[i]) - claimed(from, 'bar') > 0) return { do: 'fetch', from, to: { k: 'anvil' }, what: 'bar' };
  }
  for (let i = h.chamber; i >= 0; i--) {
    const from = { k: 'face', i };
    if ((h.ore[oreOf(i)] || 0) - claimed(from, 'ore') <= 0) continue;
    const to = furnaceFor(i);
    if (to) return { do: 'fetch', from, to, what: 'ore' };
  }
  for (let i = 0; i <= h.chamber; i++) {
    const from = { k: 'wall', i };
    if (h.walls[i].loose - claimed(from, 'spoil') > 0) return { do: 'fetch', from, to: { k: 'heap', i }, what: 'spoil' };
  }
  if (h.road - claimed({ k: 'road' }, 'water') > 0) return { do: 'fetch', from: { k: 'road' }, to: { k: 'anvil' }, what: 'water' };
  const vent = ventWith(0);
  if (vent) return { do: 'fetch', from: vent, to: { k: 'store' }, what: 'brim' };
  return null;
}

// A stoker's: brimstone to the furnace that most wants it -- one gone out
// first, then the emptiest -- or to the store when every one is full.
function stokerTask() {
  const h = S.hell;
  let pick = -1, want = -Infinity;
  for (let i = 0; i <= h.chamber; i++) {
    const f = h.furnaces[i], to = { k: 'furnace', i };
    const room = FURNACE_FUEL_MAX - f.fuel - coming(to, 'brim');
    if (room <= 0 && f.lit) continue;
    const score = (f.lit ? 0 : 100) + room - i * 0.01;
    if (score > want) { want = score; pick = i; }
  }
  const vent = ventWith(pick < 0 ? 0 : pick);
  if (!vent) return null;
  return { do: 'fetch', from: vent, to: pick < 0 ? { k: 'store' } : { k: 'furnace', i: pick }, what: 'brim' };
}

// --- the errands, done -------------------------------------------------------
// Take one of `what` off a source, standing at it; false if there is none.
function pickUp(b, from, what) {
  const h = S.hell;
  if (what === 'tool') { b.carry = { what, tier: h.tool }; return true; }
  if (what === 'ore') {
    const ore = oreOf(from.i);
    if (!(h.ore[ore] > 0)) return false;
    h.ore[ore]--; b.carry = { what, ore }; return true;
  }
  if (what === 'brim') {
    const v = h.vents[from.i];
    if (!(v.crust > 0)) return false;
    v.crust--; b.carry = { what }; return true;
  }
  if (what === 'bar') {
    const f = h.furnaces[from.i];
    const ore = Object.keys(f.tray).find(o => f.tray[o] > 0);
    if (!ore) return false;
    f.tray[ore]--; b.carry = { what, ore }; return true;
  }
  if (what === 'spoil') {
    const w = h.walls[from.i];
    if (!(w.loose > 0)) return false;
    w.loose--; b.carry = { what }; return true;
  }
  if (what === 'water') {
    if (!(h.road > 0)) return false;
    h.road--; b.carry = { what }; return true;
  }
  return false;
}

// Set what is carried down at a store; false if it would not take it (a
// full hopper: the body waits there with it).
function putDown(b, to) {
  const h = S.hell, k = b.carry;
  if (k.what === 'tool') {
    if (to.k === 'face') h.faces[to.i].tool = Math.max(h.faces[to.i].tool, k.tier);
    else if (to.k === 'wall') h.walls[to.i].tool = Math.max(h.walls[to.i].tool, k.tier);
  } else if (k.what === 'ore') {
    const f = h.furnaces[to.i];
    if (hopperCount(f) >= HOPPER_MAX) return false;
    f.hopper[k.ore] = (f.hopper[k.ore] || 0) + 1;
  } else if (k.what === 'brim') {
    if (to.k === 'furnace') {
      if (!stoke(to.i)) { b.task.to = { k: 'store' }; return false; }
    } else h.brimstone++;
  } else if (k.what === 'bar') h.bars[k.ore] = (h.bars[k.ore] || 0) + 1;
  else if (k.what === 'spoil') h.walls[to.i].heap++;
  else if (k.what === 'water') h.water++;
  b.carry = null;
  return true;
}

function doFetch(b, dt) {
  const t = b.task;
  if (!b.carry) {
    if (!goTo(b, t.from, dt)) return;
    if (!pickUp(b, t.from, t.what)) { b.task = null; return; }
  }
  if (!goTo(b, t.to, dt)) return;
  if (putDown(b, t.to)) b.task = null;
}

// A swing on its clock: true on the frame it lands.
function swing(b, dt, rate) {
  b.t += dt;
  if (b.t < 1 / rate) return false;
  b.t = 0;
  b.swung = 0;
  return true;
}

function doMine(b, dt, f) {
  if (flareBurning(f) || faceFull(f)) { b.t = 0; return; }
  if (!goTo(b, { k: 'face', i: f }, dt)) return;
  b.face = -1;
  if (swing(b, dt, hellValue('hellface'))) b.did = blowFace(f, S.hell.faces[f].tool);
}

function doGang(b, dt, w, slot) {
  if (flareBurning(w)) { b.t = 0; return; }
  if (!goTo(b, { k: 'wall', i: w, slot }, dt)) return;
  b.face = 1;
  if (swing(b, dt, WALL_RATE)) b.did = blowWall(w, S.hell.walls[w].tool);
}

function doSmith(b, dt) {
  if (!goTo(b, { k: 'anvil' }, dt)) return;
  b.face = 1;
  if (swing(b, dt, hellValue('hellanvil'))) b.did = strikeAnvil();
}

// Somewhere to stand with nothing to do: beside the store.
function idle(b, dt) { goTo(b, { k: 'store' }, dt); }

// --- the muster ----------------------------------------------------------------
function muster(dt) {
  const h = S.hell;
  if (h.bodies.length >= musterCount()) { h.musterT = 0; return; }
  h.musterT += dt;
  if (h.musterT < MUSTER_EVERY_S && h.bodies.length) return;
  h.musterT = 0;
  h.bodies.push({ id: h.nextId++, job: null, x: roadX(), y: roadTop(), c: 0,
                  way: [[roadX(), chamberFloor(0), 0]], carry: null, task: null, t: 0, age: 0, face: 1 });
  h.muster = h.bodies.length;
}

// One frame of every ghost.
export function stepBodies(c) {
  const h = S.hell, dt = c.dt / 1000;
  muster(dt);
  const jobs = jobsWanted();
  const wall = workableWall();
  // A miner a face, the deepest open first; the gang a slot each along the wall.
  let miner = 0, gang = 0;
  for (let k = 0; k < h.bodies.length; k++) {
    const b = h.bodies[k];
    if (b.age < GHOST_FADE_S) b.age = Math.min(GHOST_FADE_S, b.age + dt);
    if (b.swung != null) b.swung += dt;
    // Still on the road down: nothing to do but arrive.
    if (b.job == null && b.way.length) { walk(b, dt); if (b.way.length) continue; }
    // A body finishes carrying before it changes job, so nothing in its
    // hands is ever dropped.
    if (b.job !== jobs[k] && !b.carry) { b.job = jobs[k]; b.task = null; b.t = 0; }
    const job = b.job;
    if (job === 'miner') doMine(b, dt, h.chamber - (miner++ % (h.chamber + 1)));
    else if (job === 'gang' && wall >= 0) doGang(b, dt, wall, gang++);
    else if (job === 'smith') doSmith(b, dt);
    else if (job === 'hauler' || job === 'stoker' || b.carry) {
      if (!b.task) b.task = job === 'stoker' ? stokerTask() : haulerTask();
      if (b.task) doFetch(b, dt); else idle(b, dt);
    } else idle(b, dt);
  }
}
