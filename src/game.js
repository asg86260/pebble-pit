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

import { P, GRAV, SETTLE_BUDGET, PILE_LIMIT, RIFT_TURNS, RIFT_ORBIT_FRAMES } from './config.js';
import { S, floor, pit, cut, quarry, bench, rift } from './state.js';
import { plantPlots } from './farm.js';
import { stepBreaks } from './break.js';
import { at, put, addGrain, colOf, surfaceY, settleSome, resizeGrid, isDust, bottomY, roomFor } from './grid.js';
import { stepCamera, stepShake, blocked, bankCeiling, overPitMouth, overCutMouth, pileAt, layPiles, rockLeft, lookAt } from './world.js';
import { placeRock, overBoulder, topOfRock, knockOff, stepRock, restOnRock, sandTopY, boulderAlive } from './rock.js';
import { wirePit, setPitGrain, settlePit, bankDust, pitFull, pitRefuses } from './pit.js';
import { stepRift, riftCenter, riftRadius } from './rift.js';
import { wireCut } from './quarry.js';
import { spawnChip, spawnSpoil, stepBelt, catchBelt } from './dust.js';
import { stepCore } from './core.js';
import { stepMeteor, stepSparkle } from './meteor.js';
import { stepSummon } from './wizard.js';
import { sampleRates, stepLab, stepSmoke, labFinished } from './lab.js';
import { stepGrit } from './grit.js';
import { stepWorks, setGround, setDone, setFoot, setRooms } from './works.js';
import { cubes as houseCubes } from './house.js';

// The ground is laid the moment the order the yard was bought in changes, and
// not on the frame after. `layPiles` would catch it next frame -- the order is
// in its key now -- but a frame late is too late for anything that reads a
// position in the same tick as the purchase: `__finish` in the checks does
// exactly that, and so does a player's click landing a build and the board
// seating itself off where the building now is.
setGround(layPiles);
// and the lab puts a mark up when its own work lands -- see `labFinished`
setDone(labFinished);
// and where a station stands, for a body walking over to help at one
setFoot(stationFoot);
// and the settlement's rooms, so a build there is fenced round what will stand
setRooms(houseCubes);
import { makePainter } from './painter.js';
import { updateWorkers, stepRecords, stepMachines } from './crew.js';
import { catchAir } from './hands.js';
import { seedAir, stepAir } from './air.js';
import { seedWeather, stepWeather } from './weather.js';
import { stepHouse } from './house.js';
import { stepCasino, stepTable, wireTable } from './casino.js';
import { stepIntro, stepBuried, maybeReunion } from './intro.js';
import { canAfford, mineMs, restaff, staffSheds } from './upgrades.js';
import { stepMachineSmoke } from './render.js';
import { now as clockNow, setFrames, frames } from './clock.js';
import { stepSmog, sampleAir, slumpMess } from './smog.js';
import { stepBalloons } from './balloon.js';
import { tidyBoards, stationFoot } from './board.js';
import { stepScrub } from './scrubhouse.js';
// A chip coming down over the hill, and whether the hill has taken it. The
// height test is here rather than in `restOnRock` because it is the chip loop's
// own question -- has this thing reached the surface yet -- and every other
// place that puts a grain on the rock has no chip to ask it of.
function restOnRockAt(x, y, shade) {
  if (!boulderAlive()) return false;
  const c = Math.floor((x - rockLeft()) / P);
  if (c < 0 || c >= S.gw || S.rockTops[c] < 0) return false;
  if (y + P < sandTopY(c)) return false;
  return restOnRock(x, shade);
}

// The ground is the ground because of these: the grid module knows none of it.
// A new plot of sand somewhere else is another few lines like this, not another
// copy of the sand rules.
export function wireGround() {
  if (!floor.painter) floor.painter = makePainter(floor);
  floor.onPut = floor.painter.mark;
  floor.blocked = blocked;
  floor.ceiling = bankCeiling;             // and lean away from the rock rather than against it
  floor.repose = true;                     // heaps on the ground stand up
  // Nothing topples over the lip on its own. Dust may not stand deep enough
  // beside the ledge to do it: a heap that could tip itself in banked the whole
  // yard for free and put the haulers out of work, which is the one thing the
  // ground must never do. The hooks that used to allow it are gone from grid.js
  // as well -- a branch nothing takes is a branch nothing keeps honest.
}

// Laying out the world moves things; this is what each site does about it. The
// order matters: the rock needs the ground line, the rest need the rock.
export function settleIntoWorld() {
  placeRock();
  wireGround();
  wirePit();
  wireCut();                               // the cut's own sand, sized off the quarry
  wireTable();                             // the ground the pot piles up on
  resizeGrid(floor);
  if (!pit.grid) setPitGrain();            // the pit never changes with the window
  seedAir();
  seedWeather();       // and a sky that is already full of cloud
}

export function step() {
  // The bench arrives the moment there is something on it worth buying, and
  // stays from then on: a bench that came and went would be worse than one that
  // sat there empty.
  if (!S.seenBench && canAfford()) { S.seenBench = true; S.dirty = true; }
  // The plots are dug when the ground is broken, not when the first farmhand
  // walks up to them: a plot you have paid for that shows nothing but fence
  // posts reads as a purchase that did not happen. Asked every frame rather
  // than hooked onto the sale, so a save, the dev panel and the sale itself all
  // arrive at the same plot; it is two length checks and it does nothing once
  // the plots are there.
  if (S.farmOpen) plantPlots();
  // And the ground each station heaps on, for the same reason: a save, the dev
  // panel and the door itself all arrive at the same strips. It does nothing at
  // all unless the set of open places has actually changed. See `layPiles`.
  layPiles();
  // How long this frame was, before anything moves on the strength of it. It
  // used to be worked out halfway down, which was fine while it was only handed
  // to the things below it; now that everything which moves reads it (see
  // `frames` in clock.js) it has to be the first thing the frame knows.
  const frameNow = clockNow();
  const dt = Math.min(100, frameNow - (S.lastFrame || frameNow));  // a long tab-out is not a long frame
  S.lastFrame = frameNow;
  setFrames(dt);
  stepCamera(clockNow());
  stepShake();                                // and whatever the last landing left
  stepAir();
  stepPaid();
  sampleRates(clockNow());
  const now = clockNow();
  stepWeather(now);

  // How much is lying about. Counting fifty thousand cells is not a thing to do
  // every frame, and the answer moves by a grain at a time, so it is counted
  // twice a second and the crew are told to stop or start on that.
  S.tick++;
  // four times a second, not twice: this is what tells a station it has room
  // again, and waiting half a second to notice reads as the crew dawdling.
  if (S.tick % 15 === 1) surveyFloor();
  // The lab and the scrubbing house take a body when there is work for one. Not
  // every frame: it is a decision about the roster, and the roster does not need
  // revisiting sixty times a second.
  if (S.tick % 15 === 7) staffSheds();
  // And the mess settles, a few times a second rather than every frame: a heap
  // finding its angle is a slow thing and nobody is watching a single cell.
  if (S.tick % 12 === 3) slumpMess();
  tidyBoards();                               // and no submenu outliving its board
  stepRock();                                 // a new one on its way down
  updateWorkers(now, dt);
  // A lever that was thrown during the pass asks for its station to be staffed
  // again, and it cannot do that itself: `restaff` calls `syncWorkers`, which
  // replaces `S.workers` -- the very array the pass was walking. So the arrival
  // sets a latch and it is drained here, one frame's worth at a time, safely
  // outside the loop. This is the same reason the yard does its rebuilding
  // between passes rather than inside them.
  if (S.restaff) { const r = S.restaff; S.restaff = null; restaff(r.job, r.want); }
  // Before `stepSmog`, so the dirt a machine makes this frame is in this frame's
  // sky rather than trailing it by one -- the same ordering the stations' own
  // fouling already has.
  stepMachines(now);                          // and whatever the machines got through
  stepRecords(dt);                            // and everybody gets a little older
  stepBreaks(now);                            // and what the stopped ones get up to
  stepLab(dt);                                // and whatever the lab is working on
  // The hole collapsing is the one thing in this game that happens TO you rather
  // than because you pressed something, so the view goes and looks at it. Once:
  // `throughRift` raises the flag the first time a grain will not fit, and this
  // is where it is put down. It is not a stoppage -- the yard carries on behind
  // the glide, which is the whole point of the collapse.
  if (S.riftFell) { S.riftFell = false; lookAt(rift.x + rift.w / 2); }
  stepWorks(dt);                              // and whatever the yard is building
  stepMachineSmoke(now);                      // and the stacks over the machines
  stepSmoke(now, dt);                         // which the chimney says out loud
  stepGrit(dt);                               // and the chips off a builder's hammer
  stepCasino(dt);                             // and the wheel, if there is anything on the table
  stepTable(dt);                              // and the pot, arriving or leaving, a grain at a time
  maybeReunion(now);                          // the one beat after the first rock
  stepIntro(now);                             // and, once and once only, the two of them
  stepBuried(now);                            // and whoever is under the rock, when they can be seen
  stepHouse(now);                             // and the crew's own hearth, now and then
  stepCore();
  stepMeteor(now);                            // and the sky, which has a rock in it now
  stepSummon(dt);                             // and whatever the ring is pouring into it
  stepSparkle(dt);                            // and the magic they leave in the air
  stepScrub(dt);                              // and the pumps on the scrubbing house
  // And the rift swallows, if it is torn. It takes grains off the top of the
  // pile without taking them off you -- see `swallow` in pit.js -- so this is
  // the one thing in the yard that empties the hole and leaves the counter where
  // it was.
  stepRift(dt);
  stepSmog(dt);                               // and the sky, which is filling up
  stepBalloons();                             // and the craft crossing it
  sampleAir(now);
  if (S.dragging) catchAir(S.mouse.x, S.mouse.y);   // swinging does not catch its own spray

  if (S.mining) {
    S.nextHit = Math.max(S.nextHit, now - 500);      // don't burst after a background tab
    while (now >= S.nextHit) {
      // A held swing takes the top off, at the nearest high point to where the
      // cursor is -- see `topOfRock`. You aim a click; holding the button is
      // working, and a rock is worked from the top down.
      const at = overBoulder(S.mouse.x, S.mouse.y) ? topOfRock(S.mouse.x) : null;
      if (at) knockOff(at.x, at.y, undefined, false);   // hold-to-mine is still your hands
      S.nextHit += mineMs();
    }
  }

  const f = frames();
  // The belt's band, before the chips: a load that runs off the head becomes a
  // chip this same frame, and it should fall on the frame it left rather than
  // hanging in the air for one.
  stepBelt(now, f);
  for (let i = S.chips.length - 1; i >= 0; i--) {
    const ch = S.chips[i];
    // however long this frame was, in the sixtieths these speeds are written in
    ch.vy += GRAV * f;
    ch.x += ch.vx * f;
    ch.y += ch.vy * f;

    if (ch.x < 0) { ch.x = 0; ch.vx = Math.abs(ch.vx) * 0.6; }
    if (ch.x > S.worldW - P) {
      ch.x = S.worldW - P;
      ch.vx = -Math.abs(ch.vx) * 0.3;
    }

    // The far wall of the hole is a wall at every height, not only below the
    // ground line. Everything is thrown at the pit from the near lip, so a grain
    // that gets past the far wall is a throw that sailed -- and it used to be
    // stopped only once it was already down inside the mouth, which let the odd
    // one over the top and out onto the strip of ground behind, where it lies
    // for the rest of the run with nobody able to reach it.
    if (ch.vx > 0 && ch.x + P > pit.x + pit.w && ch.x < S.worldW - P) {
      ch.x = pit.x + pit.w - P;
      ch.vx = 0;
    }

    // Onto the belt's band, which is a surface like the ground is a surface --
    // the rock's spoil comes down on it straight off the shovel and never
    // touches the yard. See `catchBelt`, which owns every condition; this is a
    // landing like the three below it and is written in the same shape.
    //
    // Ahead of the hole and the cut, because the head of the belt hangs out over
    // the mouth of the hole and a grain crossing the band above the lip would
    // otherwise be taken by the hole from under it.
    if (catchBelt(ch, now, f)) { S.chips.splice(i, 1); continue; }

    // down the shaft: the pit collects whatever falls through its mouth
    // `>=`, to match what the ground asks a line below. With `>` a chip that
    // came down exactly on the ground line over the mouth failed the pit's
    // test, passed the floor's, and was shoved back to the end of a pile.
    if (overPitMouth(ch.x) && ch.y + P >= S.groundY) {
      // A full hole hands it straight back: thrown at a brim there is no room
      // under, the grain comes back out over the lip and lands on the rock's own
      // pile. Nothing that was mined is destroyed by a pit with no room in it,
      // and nothing goes in uncounted.
      if (pitRefuses() && isDust(ch.s)) {
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

    // down the ladder's own hole: the cut collects whatever falls through its
    // mouth, exactly the way the pit does through the mouth of the hole. See
    // `overCutMouth`, and the one clause this took out of `blocked` in world.js
    // -- a grain over the mouth used to have nowhere at all to land, because
    // there was no cut for it to land in.
    if (overCutMouth(ch.x) && ch.y + P >= S.groundY) {
      const cc = Math.max(0, Math.min(cut.cols - 1, colOf(cut, ch.x)));
      if (ch.vx < 0 && ch.x < quarry.x) { ch.x = quarry.x; ch.vx = 0; }
      if (ch.vx > 0 && ch.x + P > quarry.x + quarry.w) { ch.x = quarry.x + quarry.w - P; ch.vx = 0; }
      if (ch.vy > 0 && ch.y >= surfaceY(cut, cc)) {
        // Almost always room: the cut is a working plot, not a bank, and the
        // grid is mostly open air above whatever rock is left. The one time it
        // is not is a chip still in flight the instant `fillQuarry` puts the
        // ground back in underneath it -- the whole column solid rock, rim to
        // floor, nowhere for the grain to go. It is not an opening any more
        // either way, so it comes down on it exactly as it would on any other
        // ground: every pixel is worth one dust, the same rule the fill itself
        // keeps.
        if (!addGrain(cut, ch.x, null, ch.s)) {
          if (!addGrain(floor, ch.x, blocked, ch.s)) bankDust(ch.x, ch.s);
        }
        S.chips.splice(i, 1);
        S.dirty = true;
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

    // And on the rock, which is a surface like any other now. The hill used to
    // be barred ground -- a grain over the crest had nowhere to be, so it walked
    // out from under the footprint and appeared in the heap beside it, eighty
    // columns from where it was dropped. It comes to rest on the outline as it
    // has actually been mined, and lies there until a miner throws it on the
    // heap: see `restOnRock` in rock.js.
    //
    // Behind `arrived`, which is what keeps this from catching the spoil coming
    // off the face: a thrown grain is aimed past the hill and is not arrived
    // while it is still over it. Only something coming down on the rock without
    // anywhere else to be -- a chip over the crest, a shaken body's spill --
    // stops here.
    if (ch.vy > 0 && arrived && restOnRockAt(ch.x, ch.y, ch.s)) {
      S.chips.splice(i, 1);
      S.dirty = true;
      continue;
    }
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
  if (cut.grid) settleSome(cut, SETTLE_BUDGET);
}

// One walk of the ground, four times a second, for the things worth knowing about
// it and not worth working out every frame: how much is lying there, and where
// anything that is not dust has come to rest. A mark is drawn only where it is
// the top of its column -- one under a foot of dust is buried, and looks it.
export function surveyFloor() {
  const marks = [];
  const count = {};
  for (const p of S.piles) count[p.key] = 0;
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
    if (pile) count[pile.key] += n;
  }
  S.floorMarks = marks;
  // The total is not counted here. The floor keeps its own ledger -- `put`
  // maintains it and verify.js rule 7 watches it drift -- so re-deriving it from
  // the same walk would be a second copy of a number that is already exact. The
  // walk stays for the two things a ledger cannot answer: which strip each grain
  // is standing on, and where the cells that are not dust have come to rest.
  S.floorGrains = floor.n;
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
  fly(S.paid, bench.x + bench.w / 2, bench.y - P * 2);
  // And the ones going into the rift, which do not arc anywhere: they rise off
  // the top of the pile to the ring round the disc, go round it on a tightening
  // spiral, and are gone at the middle. Same lift off the pile as paying --
  // `liftTo` in pit.js makes both lists -- and a different journey, because the
  // one thing a player needs to read about a swallowed grain is that it went
  // *in*, not that it went somewhere.
  orbit(S.gulped);
}

// A grain's whole orbit is one number, `t`, from nought at the pile to one at
// the middle of the disc. The angle runs on with it and the radius comes in
// with it, so the path is a spiral; the first stretch of it blends from where
// the grain left the pile to where it joins the ring, so it is seen to rise off
// the top rather than appear on the ring. Every grain has its own angle to join
// at and its own way round, from `lift`, so the ring is a ring and not a queue.
function orbit(list) {
  const f = frames();
  const c = riftCenter(), R = riftRadius();
  const rate = 1 / RIFT_ORBIT_FRAMES;
  for (let i = list.length - 1; i >= 0; i--) {
    const m = list[i];
    m.t += rate * f;
    if (m.t >= 1) { list.splice(i, 1); continue; }
    if (m.t <= 0) continue;
    const t = m.t;
    const a = m.a0 + m.spin * t * RIFT_TURNS * Math.PI * 2;
    // Out past the rim for most of the way round, then a dive: cubed, so the
    // radius barely moves until late and the ring reads as a ring rather than
    // a cloud. It ends well inside the rim, which is under the disc.
    const r = R * (1.35 - 0.95 * t * t * t);
    const ox = c.x + Math.cos(a) * r, oy = c.y + Math.sin(a) * r;
    const join = Math.min(1, t / 0.2);            // the rise off the pile
    const e = join * join * (3 - 2 * join);
    m.x = m.x0 + (ox - m.x0) * e;
    m.y = m.y0 + (oy - m.y0) * e;
  }
}

function fly(list, tx, ty) {
  const f = frames();                            // the flight is a rate a frame
  for (let i = list.length - 1; i >= 0; i--) {
    const m = list[i];
    m.t += m.rate * f;
    if (m.t >= 1) { list.splice(i, 1); continue; }
    if (m.t <= 0) continue;

    const e = m.t * m.t * (3 - 2 * m.t);           // ease in and out
    m.x = m.x0 + (tx - m.x0) * e;
    m.y = m.y0 + (ty - m.y0) * e - Math.sin(e * Math.PI) * m.lift;
  }
}
