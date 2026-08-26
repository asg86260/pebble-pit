// The game, without the browser around it.
//
// One frame of the yard: what happens, and in what order. Everything this file
// touches is the simulation -- the ground, the rock, the crew, the sky -- and
// nothing in it draws, listens for a pointer or writes to the page. That is the
// whole of the split: `main.js` is the shell that gives this a window, a canvas
// and a mouse, and this is the game underneath it.
//
// It is separate so the game can be run without a window at all. A check about
// what the crew do with a full hole is a check about `step`, and running it
// through a browser to find out cost a browser -- so the checks that are about
// the yard rather than about the page run this in node instead, one file per
// feature, as many at once as the machine has cores. See tools/node.
//
// `step` is called by whoever is turning the handle: sixty times a second by the
// frame loop in the shell, or as fast as it will go by a check.

import { P, GRAV, SETTLE_BUDGET, PILE_LIMIT } from './config.js';
import { S, floor, pit, bench } from './state.js';
import { plantBeds } from './farm.js';
import { stepBreaks } from './break.js';
import { at, put, addGrain, colOf, surfaceY, settleSome, resizeGrid, isDust, bottomY, roomFor } from './grid.js';
import { stepCamera, stepShake, blocked, bankCeiling, overPitMouth, pileAt } from './world.js';
import { placeRock, overBoulder, topOfRock, knockOff, stepRock } from './rock.js';
import { wirePit, setPitGrain, settlePit, bankDust, pitFull } from './pit.js';
import { spawnChip, spawnSpoil } from './dust.js';
import { stepCore } from './core.js';
import { sampleRates, stepLab, stepSmoke } from './lab.js';
import { makePainter } from './painter.js';
import { updateWorkers, stepRecords } from './crew.js';
import { catchAir } from './hands.js';
import { seedAir, stepAir } from './air.js';
import { seedWeather, stepWeather } from './weather.js';
import { stepHouse } from './house.js';
import { stepCasino, stepTable, wireTable } from './casino.js';
import { stepIntro, stepBuried, maybeReunion } from './intro.js';
import { canAfford, mineMs } from './upgrades.js';
import { now as clockNow } from './clock.js';
import { stepSmog, sampleAir } from './smog.js';
import { stepScrub } from './scrubhouse.js';
// The ground is the ground because of these: the grid module knows none of it.
// A new bed of sand somewhere else is another few lines like this, not another
// copy of the sand rules.
export function wireGround() {
  if (!floor.painter) floor.painter = makePainter(floor);
  floor.onPut = floor.painter.mark;
  floor.blocked = blocked;
  floor.ceiling = bankCeiling;             // and lean away from the rock rather than against it
  floor.repose = true;                     // heaps on the ground stand up
  // Nothing topples over the lip on its own any more. Dust may not stand deep
  // enough beside the ledge to do it: a heap that could tip itself in banked the
  // whole yard for free and put the haulers out of work, which is the one thing
  // the ground must never do. `grid.js` still has the hooks; nothing uses them.
  //   floor.spillsInto = overPitMouth; floor.spillsAt = 4; floor.spill = ...
  pit.onDig = shedNewMouth;                // and what a dig does to the ground
}

// A dig takes the far wall out from under whatever was lying behind it. Those
// grains were resting on the strip past the hole; the strip is hole now, and
// dust lying across an opening is dust lying on nothing -- it hung there in the
// air over the new mouth for the rest of the run, because settling only moves a
// grain that has somewhere to fall to and the ground it stood on was still the
// bottom row of the floor.
//
// So the dig hands them back to the air. They fall from where they lay and the
// same landing rules that catch every other chip take it from there: into the
// hole, which is what the hole is for, or back out by the lip if there is no
// room in it.
//
// The columns behind the new wall are swept for the same reason one step out.
// A bank may only rise as it gets away from the hole, and the wall has just
// moved towards it -- so whatever now stands above that line is over a slope it
// could never have been piled on, and it goes back in the air with the rest.
export function shedNewMouth() {
  if (!floor.grid) return;
  for (let c = Math.max(0, colOf(floor, pit.x)); c < floor.cols; c++) {
    const x = floor.x + c * P;
    const mouth = overPitMouth(x);
    for (let r = floor.rows - 1; r >= 0; r--) {
      const v = at(floor, c, r);
      if (!v) continue;
      // top down, so the first grain that is standing legally means every one
      // under it is too, and the column is done
      if (!mouth && roomFor(floor, c, r)) break;
      put(floor, c, r, 0);
      spawnChip(x, bottomY(floor) - (r + 1) * P, 0, 0, v);
    }
  }
  S.dirty = true;
}

// Laying out the world moves things; this is what each site does about it. The
// order matters: the rock needs the ground line, the rest need the rock.
export function settleIntoWorld() {
  placeRock();
  wireGround();
  wirePit();
  wireTable();                             // the ground the pot piles up on
  resizeGrid(floor);
  if (!pit.grid) setPitGrain(S.pitStep);   // the pit never changes with the window
  seedAir();
  seedWeather();       // and a sky that is already full of cloud
}

export function step() {
  // The bench arrives the moment there is something on it worth buying, and
  // stays from then on: a bench that came and went would be worse than one that
  // sat there empty.
  if (!S.seenBench && canAfford()) { S.seenBench = true; S.dirty = true; }
  // The beds are dug when the ground is broken, not when the first farmhand
  // walks up to them: a plot you have paid for that shows nothing but fence
  // posts reads as a purchase that did not happen. Asked every frame rather
  // than hooked onto the sale, so a save, the dev panel and the sale itself all
  // arrive at the same plot; it is two length checks and it does nothing once
  // the beds are there.
  if (S.farmOpen) plantBeds();
  stepCamera(clockNow());
  stepShake();                                // and whatever the last landing left
  stepAir();
  stepPaid();
  sampleRates(clockNow());
  const now = clockNow();
  stepWeather(now);
  const dt = Math.min(100, now - (S.lastFrame || now));   // a long tab-out is not a long frame
  S.lastFrame = now;
  // How much is lying about. Counting fifty thousand cells is not a thing to do
  // every frame, and the answer moves by a grain at a time, so it is counted
  // twice a second and the crew are told to stop or start on that.
  S.tick++;
  // four times a second, not twice: this is what tells a station it has room
  // again, and waiting half a second to notice reads as the crew dawdling.
  if (S.tick % 15 === 1) surveyFloor();
  stepRock();                                 // a new one on its way down
  updateWorkers(now, dt);
  stepRecords(dt);                            // and everybody gets a little older
  stepBreaks(now);                            // and what the stopped ones get up to
  stepLab(dt);                                // and whatever the lab is working on
  stepSmoke(now, dt);                         // which the chimney says out loud
  stepCasino(dt);                             // and the wheel, if there is anything on the table
  stepTable(dt);                              // and the pot, arriving or leaving, a grain at a time
  maybeReunion(now);                          // the one beat after the first rock
  stepIntro(now);                             // and, once and once only, the two of them
  stepBuried(now);                            // and whoever is under the rock, when they can be seen
  stepHouse(now);                             // and the crew's own hearth, now and then
  stepCore();
  stepScrub(dt);                              // and the pumps on the scrubbing house
  stepSmog(dt);                               // and the sky, which is filling up
  sampleAir(now);
  if (S.dragging) catchAir(S.mouse.x, S.mouse.y);   // swinging does not catch its own spray

  if (S.mining) {
    S.nextHit = Math.max(S.nextHit, now - 500);      // don't burst after a background tab
    while (now >= S.nextHit) {
      // A held swing takes the top off, at the nearest high point to where the
      // cursor is -- see `topOfRock`. You aim a click; holding the button is
      // working, and a rock is worked from the top down.
      const at = overBoulder(S.mouse.x, S.mouse.y) ? topOfRock(S.mouse.x) : null;
      if (at) knockOff(at.x, at.y);
      S.nextHit += mineMs();
    }
  }

  for (let i = S.chips.length - 1; i >= 0; i--) {
    const ch = S.chips[i];
    ch.vy += GRAV;
    ch.x += ch.vx;
    ch.y += ch.vy;

    if (ch.x < 0) { ch.x = 0; ch.vx = Math.abs(ch.vx) * 0.6; }
    if (ch.x > S.worldW - P) {
      ch.x = S.worldW - P;
      ch.vx = -Math.abs(ch.vx) * 0.3;
    }

    // down the shaft: the pit collects whatever falls through its mouth
    // `>=`, to match what the ground asks a line below. With `>` a chip that
    // came down exactly on the ground line over the mouth failed the pit's
    // test, passed the floor's, and was shoved back to the end of a pile.
    if (overPitMouth(ch.x) && ch.y + P >= S.groundY) {
      // A full hole hands it straight back: thrown at a brim there is no room
      // under, the grain comes back out over the lip and lands on the rock's own
      // pile. Nothing that was mined is destroyed by a pit with no room in it,
      // and nothing goes in uncounted.
      if (pitFull() && isDust(ch.s)) {
        spawnSpoil(ch.x, ch.y, ch.s);
        S.chips.splice(i, 1);
        continue;
      }
      const pc = Math.max(0, Math.min(pit.cols - 1, colOf(pit, ch.x)));
      if (ch.vx < 0 && ch.x < pit.x) { ch.x = pit.x; ch.vx = 0; }             // pit wall
      // And the far one, which is a wall to anything already below the lip.
      //
      // A throw that *clears* the hole clears it and lands on the ground behind
      // -- that is a throw that went too far, and it never comes through here at
      // all, because it is never over the mouth at ground level. This is the
      // other case: a grain down inside the hole, still travelling, arriving at
      // the back of it. It used to be let through and deposited on the surface
      // beyond, which is a grain climbing out of a hole.
      if (ch.vx > 0 && ch.x + P > pit.x + pit.w) { ch.x = pit.x + pit.w - P; ch.vx = 0; }
      if (ch.vy > 0 && ch.y >= surfaceY(pit, pc)) {
        // The hole would not take it -- everything counts against the same
        // capacity now, finds included. It is not swallowed: it comes back out
        // on to the ground by the lip and lies there until a dig makes room.
        if (!bankDust(ch.x, ch.s)) spawnSpoil(pit.x - P * 4, S.groundY - P * 4, ch.s);
        S.chips.splice(i, 1);
        continue;
      }
      continue;
    }

    // Land on the floor dust -- but an aimed chip clears the bank it is thrown
    // over first. Stopping it on the near face is what built the bank towards
    // the rock instead of away from it: every chip came down on the slope facing
    // the rock and the heap grew back up to the foot.
    const c = Math.max(0, Math.min(floor.cols - 1, colOf(floor, ch.x)));
    const arrived = ch.land == null || ch.y >= S.groundY - P ||
                    (ch.vx > 0 ? ch.x >= ch.land : ch.x <= ch.land);
    if (ch.vy > 0 && arrived && ch.y >= surfaceY(floor, c)) {
      // One rule for everything that lands: a shard keeps to the piles exactly as
      // a grain of dust does, because as far as the ground is concerned it is one.
      if (!addGrain(floor, ch.x, blocked, ch.s)) bankDust(ch.x, ch.s);
      S.chips.splice(i, 1);
      S.dirty = true;
    }
  }

  settleSome(floor, SETTLE_BUDGET);
  settlePit();
}

// One walk of the ground, four times a second, for the things worth knowing about
// it and not worth working out every frame: how much is lying there, and where
// anything that is not dust has come to rest. A mark is drawn only where it is
// the top of its column -- one under a foot of dust is buried, and looks it.
export function surveyFloor() {
  const marks = [];
  const count = {};
  for (const p of S.piles) count[p.key] = 0;
  let grains = 0;
  for (let c = 0; c < floor.cols; c++) {
    const x = floor.x + c * P;
    const pile = pileAt(x);
    let n = 0;
    for (let r = 0; r < floor.rows; r++) {
      const v = at(floor, c, r);
      if (!v) continue;
      n++;
      // The painter has no colour for anything that is not dust, so it leaves
      // that cell clear and the mark is drawn over the top. Every one of them,
      // not just the top of a column: a cell left clear and never marked is a
      // hole in the pile, and a shard with another on top of it is still there.
      if (!isDust(v)) {
        marks.push({ v, x: x + P / 2, y: bottomY(floor) - (r + 1) * P + P / 2 });
      }
    }
    grains += n;
    if (pile) count[pile.key] += n;
  }
  S.floorMarks = marks;
  S.floorGrains = grains;
  S.pileCount = count;

  // A pile that is full stops the station behind it, and the moment there is
  // room for one more it starts again. No waiting for the pile to come down by
  // some fraction: clearing a handful should put somebody back to work, because
  // that is what clearing a handful looks like it ought to do.
  const full = {};
  for (const p of S.piles) full[p.key] = count[p.key] >= (PILE_LIMIT[p.key] || Infinity);
  S.pileFull = full;
}

// Dust flying to the bench, on its way out of the counter. A purchase is not a
// number going down: the grains leave the pile and cross the yard, and this is
// where along that arc each of them is. It moves them; `drawPaid` in the shell
// draws them.
export function stepPaid() {
  const tx = bench.x + bench.w / 2, ty = bench.y - P * 2;
  for (let i = S.paid.length - 1; i >= 0; i--) {
    const m = S.paid[i];
    m.t += m.rate;
    if (m.t >= 1) { S.paid.splice(i, 1); continue; }
    if (m.t <= 0) continue;

    const e = m.t * m.t * (3 - 2 * m.t);           // ease in and out
    m.x = m.x0 + (tx - m.x0) * e;
    m.y = m.y0 + (ty - m.y0) * e - Math.sin(e * Math.PI) * m.lift;
  }
}
