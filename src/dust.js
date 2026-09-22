// Dust in the air: what comes off the rock, and how it gets to the ground.
//
// Nothing here knows what a worker is or what the shop sells. A chip is a shade,
// a place and a velocity, and it stops being one when it lands.

import { P, GRAV, WORKER, BELT_RAMP, BELT_THROW_LOW, BELT_THROW_TOP, BELT_SCATTER } from './config.js';
import { makePainter } from './painter.js';
import { rockEdge, rockLeft, pileOf } from './world.js';
import { rockTopY } from './rock.js';
import { S, floor, pit, band } from './state.js';
import { defineMachine, machine } from './machines.js';
import { at, put, colOf, bottomY, addGrain, settle, topRow, grainsIn, recount, resizeGrid, fillFlat, REPOSE_DROP } from './grid.js';
import { scoopMs, haulCap } from './levels.js';

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
  const v = aim(px, py, land, P, clearRock(px, py, land));
  spawnChip(px, py, v.vx, v.vy, shade, land);
}

// A grain dug out of the middle of the boulder has the rest of it between
// it and the heap, and the arc sized to the distance alone flew through the
// rock and came down on its flank, where the belt's tail lies buried and
// caught it: dust thrown on to the boulder. So the pop is raised to clear
// the highest of the rock's surface between here and there, a cell over it;
// null when nothing of the rock stands above the grain, and the arc is the
// distance's own.
function clearRock(x, y, land) {
  if (!S.rockTops || !S.gw) return null;
  const L = rockLeft();
  const c0 = Math.max(0, Math.floor((Math.min(x, land) - L) / P));
  const c1 = Math.min(S.gw - 1, Math.floor((Math.max(x, land) - L) / P));
  let top = Infinity;
  for (let c = c0; c <= c1; c++) top = Math.min(top, rockTopY(c));
  return top < y ? S.groundY - top + P : null;
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
// The ramp the head ends in: `BELT_RAMP` cells out from the head, a cell up
// for a cell out, the band running up it to the lip it flicks its load off.
// `rampTop` is the top of the step under x, the band's own height short of
// the head.
//
// The ramp is the band's strip carried on: a column that runs off the head
// goes on to the first step whole, and every cell the band runs it moves a
// step up, as the load on the flat moves a column along, so the heap keeps
// its shape up the ramp and comes apart only at the lip. Its grains are
// riders in `S.belt`, `{ x, r, s, k }`: a step's x, the row in the column
// it stands in, and how high in its column it left the band (`k`, how far
// it is thrown). Anything in `S.belt` past the head is on the ramp.
export const rampLip = () => beltTo() + BELT_RAMP * P;
export const rampTop = x => beltY() - Math.max(0, Math.min(BELT_RAMP - 1, Math.floor((x - beltTo()) / P))) * P;

// How fast the band runs, in world pixels a frame at sixty.
export const BELT_PACE = P * 0.9;
// How fast the scoop lifts one out of the ground onto it. Quicker than the
// band: the climb is a couple of cells and the run is the whole yard.
const BELT_LIFT = P * 0.7;

// --- what is riding it ----------------------------------------------------------
// The load is **ground on the belt**: `band` in state.js is a strip of the
// same grid the yard's floor is, laid over the band from tail to head and
// reaching the top of the world, so a heap on it is as tall as its own
// slope lets it be and never flat-topped by a ceiling. A grain lands in it the way a grain lands on the ground
// (`addGrain`), it slumps and stands up the way the ground does (`settle`,
// with `repose`), and the machine moves it by shifting every column a cell
// toward the head each time the band has run a cell, so it travels the way
// the band's own marks do. What shifts off the last column is over the mouth
// and falls (`spawnChip`). Loads written any other way -- counted, spread,
// given a height -- were grains that did not sit on the grid and did not
// settle, and looked it.
//
// A *lift* is the one thing not in the grid: `S.belt` holds the grains the
// scoop is carrying up from the ground, `{ x, y, s }`, a climb rather than a
// throw (the heap between the rock and the hole is routinely deeper than the
// belt is tall, and a grain tossed at the band from inside a heap lands back
// on the heap). It creeps forward while it climbs and joins the grid at the
// surface of its column.
export const bandY = () => beltY() - P;       // the band's top row: where a load sits

// The strip laid over the band. The bottom row sits on the band and the top
// row is the top of the world, so `y` is nought or the cell nearest it.
// Wired at boot with the ground (`settleIntoWorld`); a resize keeps its
// grains, packed flat.
export function wireBelt() {
  if (!band.painter) band.painter = makePainter(band);
  band.onPut = (c, r) => { band.painter.mark(c, r); markHigh(c, r); };
  band.x = beltFrom();
  band.cols = Math.max(1, Math.round((beltTo() - beltFrom()) / P));
  band.rows = Math.max(1, Math.floor(bandY() / P) + 1);
  band.y = bandY() - (band.rows - 1) * P;
  band.repose = true;                      // a heap on the band stands up, as on the ground
  band.high = new Uint16Array(band.cols);  // before the cells: `resizeGrid` writes through `put`
  resizeGrid(band);
  measureHigh();
}

// --- how deep each column stands -------------------------------------------------
// `band.high` is the row above the top grain of each column, kept beside the
// cells: the strip runs to the top of the world, so reading a column's top
// off the cells is a walk down three hundred empty rows, and the landing
// asks for it three times a column it walks (`restOn`) for every grain that
// comes down, every frame. Kept the way `n` is: every write through `put`
// tells `onPut`, and a write behind its back (the shift in `stepBelt`, a
// resize) measures it again.
const highOf = c => band.high[c];
function markHigh(c, r) {
  if (at(band, c, r)) { if (r >= band.high[c]) band.high[c] = r + 1; return; }
  if (r + 1 !== band.high[c]) return;      // a cell under the top: the top is where it was
  let t = r; while (t > 0 && !at(band, c, t - 1)) t--;
  band.high[c] = t;
}
function measureHigh() {
  for (let c = 0; c < band.cols; c++) band.high[c] = topRow(band, c) + 1;
}
// The world y of the top of a column, as a line: where a grain coming down
// it lands.
const highY = c => bottomY(band) - (highOf(c) + 1) * P;

// Where a grain coming down on column `c` of the load comes to rest: there,
// or -- when standing there would put the column more than a drop over the
// one beside it, so it would only slide off -- down the face, to the first
// column it would rest on. What `settle` does over frames, a cell a pass,
// done at once, because a tuned ram lands a dozen grains a frame on the one
// column whose crest meets its arc, and a column sheds one a pass. The
// ground's heaps have their ceiling (`bankCeiling`) to spread a landing;
// the band's load has none.
//
// Past either end of the strip is a drop, so the load rises away from the
// tail at the slope it rests at, as a heap on the ground rises from the end
// of its strip. To `settle` the tail is a wall, and a load fed at it (the
// scoop bites from the tail forward) would lean on it as a cliff for every
// cell the band runs to expose. A grain that rolls off an end is off the
// strip: -1, and it falls.
function restOn(c) {
  const EDGE = 0;                          // how deep the ground past an end stands: not at all
  while (c >= 0 && c < band.cols) {
    const left = c > 0 ? highOf(c - 1) : EDGE;
    const right = c + 1 < band.cols ? highOf(c + 1) : EDGE;
    if (highOf(c) + 1 - Math.min(left, right) <= REPOSE_DROP) return c;
    c += left < right ? -1 : 1;
  }
  return -1;
}

// A grain on to the load at x, where it would come to rest. False when it
// rolled off an end of the strip, or found no cell: it is not on the band.
function landOn(x, shade) {
  const c = restOn(Math.max(0, Math.min(band.cols - 1, colOf(band, x))));
  return c >= 0 && addGrain(band, band.x + c * P, null, shade);
}

// How much is on the machine: on the band and on the scoop.
export const onBelt = () => grainsIn(band) + S.belt.length;

// Every grain on the machine as `[x, shade]`, the head's first: what the
// save keeps, and what a check reads to see the load moving. `limit` stops
// the walk once it has enough.
export function beltGrains(limit = Infinity) {
  const out = [];
  if (band.grid) {
    for (let c = band.cols - 1; c >= 0 && out.length < limit; c--) {
      for (let r = 0; r < band.rows && out.length < limit; r++) {
        const v = at(band, c, r);
        if (v) out.push([band.x + c * P, v]);
      }
    }
  }
  for (const b of S.belt) { if (out.length >= limit) break; out.push([Math.round(b.x), b.s]); }
  return out;
}

// Nothing on the band or the scoop: a reset, and a save being unpacked.
export function emptyBelt() {
  S.belt = [];
  S.beltRun = 0;
  if (band.grid) { fillFlat(band, 0); measureHigh(); }
}

// A save's grains, `[x, shade]`, back onto the machine: one past the head on
// the ramp where it was, the rest into the strip at each one's column while
// the strip is wired, or -- before the world is laid out -- as lifts at the
// band's height, which the first frame puts in.
export function fillBelt(grains) {
  for (const [x, sh] of grains) {
    if (band.grid && x >= beltTo()) { onRamp(x, sh || 1, rand()); continue; }
    if (band.grid && addGrain(band, x, null, sh || 1)) continue;
    S.belt.push({ x, y: bandY(), s: sh || 1 });
  }
}

// The belt and the air, on the save (persist.js, `SAVERS`).
export const SAVE = {
  fields: ['belt', 'chips'],
  write(out) {
    // Position and shade, on the band and on the scoop alike; the band's
    // height is the world's to answer on the way back in.
    out.belt = beltGrains();
    // Every grain in the air: a refresh destroying what was up is the one
    // thing the yard promises it never does.
    out.chips = (S.chips || []).map(c => [Math.round(c.x), Math.round(c.y), +c.vx.toFixed(2), +c.vy.toFixed(2), c.s, c.land == null ? null : Math.round(c.land)]);
  },
  read(s) {
    S.chips = Array.isArray(s.chips)
      ? s.chips.filter(c => Array.isArray(c) && Number.isFinite(c[0]) && Number.isFinite(c[1]))
          .map(([x, y, vx, vy, sh, land]) => ({ x, y, vx: vx || 0, vy: vy || 0, s: sh || 1, land: Number.isFinite(land) ? land : null }))
      : [];
    // Every grain back into the strip at its own column, so it lies as it
    // did (`fillBelt`); the strip is emptied first, since the save is the
    // whole of the load.
    emptyBelt();
    fillBelt(Array.isArray(s.belt) ? s.belt.filter(b => Array.isArray(b) && Number.isFinite(b[0])) : []);
  },
  blank() { emptyBelt(); }
};

// The lift: on the scoop from this moment, climbing to the band.
export function loadBelt(x, y, shade) {
  S.belt.push({ x, y, s: shade });
  sfx('belt-load', { x });
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
// The test is the ground's own (`stepChips`): a chip coming down that is at
// or below the surface of its column -- the top of what is riding there, or
// the band -- has landed. Not "crossed it this frame": a chip coming down
// on the side of a heap steps into a taller column whose surface it was
// already under, and tested for the crossing it went through the heap and
// the band to the floor, for the scoop to pick back up. Only from above the
// band: a chip under it, thrown off the face below the band's height, is on
// its way up and crosses the band the way anything thrown does. Judged from
// where it was a frame ago (`f` is the frame), since a fast one can pass
// the band's own row in one.
export function catchBelt(ch, now, f) {
  if (ch.vy <= 0) return false;                       // still going up: it has landed on nothing
  if (!beltRunning(now) || !band.grid) return false;
  if (ch.y - ch.vy * f > beltY()) return false;       // under the band, not over it
  if (ch.x + P <= beltFrom() || ch.x >= beltReach()) return false;
  // Not over another station's strip: the cut's stone and the farm's crop
  // are carried by hand to their own piles and belong there.
  const c = colOf(floor, ch.x);
  const reg = floor.region ? floor.region(c) : null;
  if (reg !== null && reg !== 'rock') return false;
  const bc = Math.max(0, Math.min(band.cols - 1, colOf(band, ch.x)));
  if (ch.y < highY(bc)) return false;                 // still above what is riding there
  if (!landOn(ch.x, ch.s)) return false;              // nowhere on the strip at all: it falls on through
  sfx('belt-catch', { x: ch.x });
  return true;
}

// One frame of the band. It runs while manned, so a belt whose tender
// wanders off stops with its load on it, like every other machine. Not gated
// on the machine having *bitten* this frame: the ground goes clean long
// before the last load reaches the hole, and a band that stopped then would
// leave a row of grains hanging over the yard.
export function stepBelt(now, f) {
  if (!band.grid) return;
  if (!beltRunning(now)) return;
  // The lifts: up to the surface of the column each is under, and in. The
  // riders on the ramp move with the band's cells, below.
  const head = beltTo();
  for (let i = S.belt.length - 1; i >= 0; i--) {
    const b = S.belt[i];
    if (b.x >= head) continue;
    const c = Math.max(0, Math.min(band.cols - 1, colOf(band, b.x)));
    const d = highY(c) - b.y;
    if (Math.abs(d) > BELT_LIFT * f) {
      // Still on the scoop. It creeps forward while it climbs, so the lift
      // reads as a machine taking it up rather than a grain levitating.
      b.y += Math.sign(d) * BELT_LIFT * f;
      b.x += BELT_PACE * 0.35 * f;
      continue;
    }
    S.belt.splice(i, 1);
    // Off the scoop and on to the load; one that rolls off the tail end of
    // it falls to the ground under the tail, for the scoop to take again.
    if (!landOn(b.x, b.s)) spawnChip(b.x, b.y, -BELT_PACE * 0.35, 0, b.s);
  }
  // The band never stops for the hole: a band held on a full count stood for
  // good when the count was ahead of the pile, because the load that would
  // have torn the hole open was one it was holding. What the head drops that
  // the pile has no cell for goes through the rift (`bankDust` in pit.js).
  //
  // It has run a cell: every column a cell toward the head, the ramp's a
  // step up it, the top step's off the lip into the air, and the last
  // column on to the first step.
  S.beltRun = (S.beltRun || 0) + BELT_PACE * f;
  while (S.beltRun >= P) {
    S.beltRun -= P;
    if (!grainsIn(band) && !S.belt.some(b => b.x >= head)) { S.beltRun = 0; break; }
    climbRamp();
    const last = band.cols - 1;
    const tall = Math.max(1, highOf(last));
    for (let r = 0; r < band.rows; r++) {
      const v = at(band, last, r);
      if (v) onRamp(head, v, (r + 1) / tall, r);
      const row = r * band.cols;
      band.grid.copyWithin(row + 1, row, row + last);
      band.grid[row] = 0;
    }
    recount(band);                        // written behind `put`'s back
    band.high.copyWithin(1, 0, last); band.high[0] = 0;
    band.painter.repaint();
  }
}

// A grain on to the ramp at the step at x, on top of what stands there
// already unless its row is given.
function onRamp(x, v, k, r = null) {
  x = beltTo() + Math.max(0, Math.round((x - beltTo()) / P)) * P;
  if (r == null) r = S.belt.filter(b => b.x === x).length;
  S.belt.push({ x, r, y: rampTop(x) - (r + 1) * P, s: v, k });
}

// The ramp's run of a cell: every rider a step on and a step up, and off
// the top step into the air.
function climbRamp() {
  const lip = rampLip();
  for (let i = S.belt.length - 1; i >= 0; i--) {
    const b = S.belt[i];
    if (b.x < beltTo()) continue;
    if (b.x + P >= lip) { S.belt.splice(i, 1); flick(b.x, b.y, b.k, b.s); continue; }
    b.x += P;
    b.y = rampTop(b.x) - (b.r + 1) * P;
  }
}

// Off the lip and into the air, on the ramp's slope: as much up as along.
// Fanned by `k`: every grain leaving on the one speed falls as the column
// did, a slab hanging off the head, and the top of the load goes furthest.
function flick(x, y, k, v) {
  const s = BELT_THROW_LOW + (BELT_THROW_TOP - BELT_THROW_LOW) * k;
  const vx = Math.max(0, BELT_PACE * (s + bell() * BELT_SCATTER));
  spawnChip(x, y, vx, -vx * (0.85 + 0.3 * rand()), v);
}

// And the load lies the way ground does -- and lies *still* by the end of
// the frame: a slide leaves the column it left a cell lower, so a pass a
// frame, as the floor gets, ends the frame with a step beside every slide.
// A pass answers through the awake columns, so a load at rest costs one
// empty look, and what lands is put at rest (`restOn`), so this is a few
// passes; the strip's height bounds it. After the chips have landed
// (game.js, `STEPS`), or what came down this frame would stand unsettled
// through the draw.
export function settleBelt(now) {
  if (!band.grid || !beltRunning(now)) return;
  for (let i = 0; i < band.rows && settle(band); i++);
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
    return got / load;
  }
});
