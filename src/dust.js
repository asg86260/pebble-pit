// Dust in the air: what comes off the rock, and how it gets to the ground.
//
// Nothing here knows what a worker is or what the shop sells. A chip is a shade,
// a place and a velocity, and it stops being one when it lands.

import { P, GRAV, WORKER } from './config.js';
import { rockEdge, pileOf } from './world.js';
import { S, floor, pit } from './state.js';
import { defineMachine, machine } from './machines.js';
import { at, put, colOf, bottomY } from './grid.js';
import { scoopMs, haulCap } from './upgrades.js';
import { pitFull } from './pit.js';
import { rand } from './rng.js';
import { JOB, TYPE } from './jobs.js';
import { shockAt } from './shock.js';
import { sfx } from './audio.js';

// roughly normal, in about -1.5..1.5, most of it near nothing
export const bell = () => rand() + rand() + rand() - 1.5;

// `land` is where an aimed chip is meant to come down. A chip without one comes
// down wherever it meets the ground, which is what a swept or spilled grain does.
export function spawnChip(x, y, vx, vy, shade = 1, land = null) {
  S.chips.push({ x, y, vx, vy, s: shade, land });
}

// A body tosses its spoil onto the heap that belongs to its station (`key`),
// on the same arc everything else in the yard is thrown on. Aimed, because a
// grain let fall lands on either side of the rock and half of it ends up
// behind the hill where nobody has a reason to walk.
export function spawnSpoil(px, py, shade, key = 'rock') {
  const p = pileOf(key);
  const near = p ? p.from : rockEdge(1);
  const far = p ? Math.max(near + P, p.to - P * 2) : near + P * 24;
  // most of it near the rock end of the heap, tailing away out along it, which
  // is the shape a heap somebody is throwing onto actually takes
  const land = Math.min(far, near + P * 2 + Math.abs(bell()) * (far - near) * 0.45);
  const v = aim(px, py, land, P);
  spawnChip(px, py, v.vx, v.vy, shade, land);
}

// A crit throws its spoil up as a fountain: the same grains, on a taller arc,
// fanned across the heap, landing and banking like any other dust (there is
// no parallel settle path, and must not be: the pile is the dust). A grain is
// flagged so the draw loop can swell it through the top of its arc, and
// carries its launch speed (`cv`) and the crit's power (`cp`) for that swell
// (render.js).
export function critToss(px, py, shade, key = 'rock', power = 3) {
  const p = pileOf(key);
  const near = p ? p.from : rockEdge(1);
  const far = p ? Math.max(near + P, p.to - P * 2) : near + P * 24;
  // Fanned across the whole width of the heap rather than tailing off along it.
  const land = near + rand() * (far - near);
  // Taller than spoil's own pop, and taller again with the crit's power.
  // `bell` gives the column its ragged top.
  const rise = P * (16 + 6 * power) + Math.abs(bell()) * P * 5;
  const v = aim(px, py, land, P, rise);
  spawnChip(px, py, v.vx, v.vy, shade, land);
  const ch = S.chips[S.chips.length - 1];
  ch.crit = true;
  ch.cv = Math.abs(v.vy) || 1;   // launch |vy|: the fastest it moves, the swell's floor
  ch.cp = power;
  // The blow itself: a ring and specks that are not dust and not counted
  // (shock.js). Called once per grain; `shockAt` keeps one shock per blow.
  shockAt(px, py, power, key);
}

// The one arc from here to there: the pop is sized to the distance, and the
// sideways speed follows from how long that pop keeps it in the air. It also
// works from *below* where it is going (a shard thrown off the floor of the
// cut has to clear the rim first). `rise`, when given, replaces the
// distance-sized pop with one reaching exactly that height above the ground
// line.
export function aim(x, y, land, size, rise = null) {
  const target = S.groundY - size;                     // the line it comes down to
  const climb = Math.max(0, y - target);               // how far up before any of that
  const pop = rise != null
    ? Math.sqrt(2 * GRAV * Math.max(P, rise - (S.groundY - y)))
    : Math.max(2 + Math.min(4.5, Math.abs(land - x) / 90),
               Math.sqrt(2 * GRAV * (climb + P * 8)));
  const t = (pop + Math.sqrt(Math.max(0, pop * pop + 2 * GRAV * (target - y)))) / GRAV;
  return { vx: (land - x) / t, vy: -pop };
}



// --- the belt -------------------------------------------------------------------
// From the rock to the hole. It works the *ground between* the rock and the
// lip, picking loose dust off the floor and putting it in the hole, which is
// what a hauler does minus the walking; so it has no site of its own and
// stands along the run. Its tender stands at the lip.
//
// Three x's, three different things:
//
//   `beltFrom`  the tail, out by the rock.
//   `beltTo`    the head, which **overhangs the mouth of the hole** so the
//               load falls off it rather than being thrown the last two cells.
//   `beltPost`  where the tender stands: the near lip, not the head, which is
//               out over open air.
//   `beltReach` the last ground it sweeps: the near lip, since there is no
//               ground under the head.
export const beltFrom = () => Math.round((S.cx + P * 6) / P) * P;
export const beltTo = () => Math.round((pit.x + P * 4) / P) * P;
export const beltReach = () => Math.round((pit.x - P * 2) / P) * P;
export const beltPost = () => beltReach() - WORKER - P;
export const beltY = () => S.groundY - P * 5;

// How fast the band runs, in world pixels a frame at sixty.
export const BELT_PACE = P * 0.9;
// How fast the scoop lifts one out of the ground onto it. Quicker than the
// band: the climb is a couple of cells and the run is the whole yard.
const BELT_LIFT = P * 0.7;

// --- what is riding it ----------------------------------------------------------
// A load is `{ x, y, s }`, and it is **not a chip**: a chip is thrown once and
// left to gravity; a load is carried, and where it goes next is decided by
// the machine every frame. Two legs: lifted (a *climb*, not a throw, because
// the heap between the rock and the hole is routinely deeper than the belt
// is tall and a grain tossed at the band from inside a heap lands back on
// the heap), then ridden.
//
// Not saved, like the chips (`restore`): what is in the air when the tab
// closes is a frame's worth of dust.
export const bandY = () => beltY() - P;       // where a load sits: on top of the band

// A grain leaves the ground and is on the machine from this moment; the
// scoop takes it to the band, down as readily as up.
export function loadBelt(x, y, shade) {
  S.belt.push({ x, y, s: shade });
  sfx('belt-load', { x });
  S.dirty = true;
}

// Bought, switched on, and with somebody standing at it this moment.
// `mannedAt` is stamped by `stepMachines`, the one place that knows. Both
// the ride and the catch ask this: a stopped band must neither move what is
// on it nor take anything new.
export function beltRunning(now) {
  const m = machine('belt');
  return !!(m && m.bought && now - (m.mannedAt || 0) <= 250);
}

// --- landing on it ---------------------------------------------------------------
// The band is a **surface**: anything thrown across it comes down on it and
// is carried, so the rock's spoil goes onto the belt straight off the
// rockhand's shovel. The scoop is for what was lying about before the belt
// was bought and what misses it.
//
// `f` is the frame, so the crossing is tested exactly: a chip lands when its
// underside reaches the band's top having been above it a frame ago. A fixed
// tolerance is wrong for either a fast chip (more than a cell a frame) or a
// slow one.
export function catchBelt(ch, now, f) {
  if (ch.vy <= 0) return false;                       // still going up: it has landed on nothing
  if (!beltRunning(now)) return false;
  const y = beltY();
  const under = ch.y + P, was = under - ch.vy * f;
  if (was > y || under < y) return false;             // did not cross the band this frame
  if (ch.x + P <= beltFrom() || ch.x >= beltReach()) return false;
  // Not over another station's strip: the cut's stone and the farm's crop
  // are carried by hand to their own piles and belong there.
  const c = colOf(floor, ch.x);
  const reg = floor.region ? floor.region(c) : null;
  if (reg !== null && reg !== 'rock') return false;
  S.belt.push({ x: ch.x, y: bandY(), s: ch.s });
  sfx('belt-catch', { x: ch.x });
  S.dirty = true;
  return true;
}

// One frame of the band. It runs while manned, so a belt whose tender
// wanders off stops with its load on it, like every other machine. Not gated
// on the machine having *bitten* this frame: the ground goes clean long
// before the last load reaches the hole, and a band that stopped then would
// leave a row of grains hanging over the yard.
export function stepBelt(now, f) {
  if (!S.belt || !S.belt.length) return;
  if (!beltRunning(now)) return;
  // The band never stops for the hole: a band held on a full count stood for
  // good when the count was ahead of the pile, because the load that would
  // have torn the hole open was one it was holding. What the head drops that
  // the pile has no cell for goes through the rift (`bankDust` in pit.js).
  const top = bandY(), head = beltTo();
  for (let i = S.belt.length - 1; i >= 0; i--) {
    const b = S.belt[i];
    if (b.y !== top) {
      // Still on the scoop. It creeps forward while it climbs, so the lift
      // reads as a machine taking it up rather than a grain levitating.
      const d = top - b.y;
      b.y += Math.sign(d) * Math.min(BELT_LIFT * f, Math.abs(d));
      b.x += BELT_PACE * 0.35 * f;
      continue;
    }
    b.x += BELT_PACE * f;
    if (b.x < head) continue;
    // Off the end of the head, out over the mouth: it drops with the band's
    // speed and the chip loop puts it in the hole like everything else.
    S.belt.splice(i, 1);
    spawnChip(b.x, b.y, BELT_PACE, 0, b.s);
  }
  S.dirty = true;
}

defineMachine('belt', {
  job: JOB.HAUL,
  type: TYPE.HAUL,
  at: beltFrom,
  y: beltY,
  // The ground the machine covers, tail to reach; the build bar hangs over
  // the middle of this (`siteBox` in works.js).
  box: () => ({ x: beltFrom(), w: beltReach() - beltFrom() }),
  tendAt: beltPost,
  // At the lip end, over the last leg that has ground under it.
  stack: () => ({ x: beltPost(), y: beltY() - P * 3 }),
  // A grain moved takes a hauler's scoop time divided by what the belt is
  // worth, so everything bought for carrying still applies to the machine
  // that replaced it.
  ms: rate => scoopMs() / Math.max(0.01, rate),
  ready: () => true,
  // A beat lifts a *load* of `haulCap()` grains, the same as a carter's trip:
  // one grain a beat under the shared beats cap pinned the band at eight
  // grains a frame against the ram's forty-eight cells, a deficit no rung
  // could close.
  //
  // `n` beats' worth in one walk of the run, answered in beats.
  bite: (tender, n = 1) => {
    // The nearest loose grains along the run, never out of a station's strip.
    const from = beltFrom(), to = beltReach();
    const c0 = colOf(floor, from), c1 = colOf(floor, to);
    const load = Math.max(1, haulCap());
    let want = Math.max(1, Math.floor(n)) * load, got = 0;
    for (let c = c0; c <= c1 && got < want; c++) {
      // The rock's own spoil and the bare ground between here and the lip.
      // Another station's heap is carried by hand to its own pile and
      // belongs there.
      const reg = floor.region ? floor.region(c) : null;
      if (reg !== null && reg !== 'rock') continue;
      for (let r = floor.rows - 1; r >= 0 && got < want; r--) {
        const v = at(floor, c, r);
        if (!v) continue;
        put(floor, c, r, 0);
        // Onto the band above where it lay, and then it rides (`loadBelt`,
        // `stepBelt`).
        const x = floor.x + c * P;
        const y = bottomY(floor) - (r + 1) * P;
        loadBelt(x, y, v);
        if (tender) tender.stored = (tender.stored || 0) + 1;
        got++;
      }
    }
    if (!got) return 0;
    S.dirty = true;
    return got / load;
  }
});
