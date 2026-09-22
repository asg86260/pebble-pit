// The game, without the browser around it.
//
// One frame of the yard: what happens, and in what order. Nothing in here
// draws, listens for a pointer or writes to the page; `main.js` is the shell
// that gives this a window, and the node checks run this without one. `step`
// is called by whoever is turning the handle: the frame loop in the shell, or
// a check as fast as it will go.

import { P, GRAV, SETTLE_BUDGET, PILE_LIMIT, ABYSS_DIVE_FRAMES, ABYSS_RIPPLE_MS,
         RIFT_G, RIFT_G_MIN, RIFT_DRAG, RIFT_EAT, RIFT_VMAX,
         RIFT_SLOW_FROM, RIFT_GONE, CLOCK_LEAP_MS } from './config.js';
import { S, floor, pit, cut, quarry, bench, rift } from './state.js';
import { plantPlots } from './farm.js';
import { stepBreaks } from './break.js';
import { at, addGrain, colOf, surfaceY, settleSome, resizeGrid, isDust, bottomY, tickGrid } from './grid.js';
import { stepCamera, stepShake, shakeView, blocked, bankCeiling, overPitMouth, overCutMouth, pileAt, layPiles, rockLeft, stepShack, quarryShed, farmShed } from './world.js';
import { placeRock, overBoulder, topOfRock, knockOff, stepRock, restOnRock, sandTopY, boulderAlive } from './rock.js';
import { wirePit, setPitGrain, settlePit, bankDust, riftCatch, abyssLine } from './pit.js';
import { stepRift, riftCenter, riftRadius } from './rift.js';
import { stepBeats } from './beats.js';
import { wireCut } from './quarry.js';
import { stepBelt, settleBelt, catchBelt, wireBelt } from './dust.js';
import { stepCore } from './core.js';
import { stepShield } from './shield.js';
import { stepMeteor, stepSparkle } from './meteor.js';
import { stepSummon } from './wizard.js';
import { sampleRates } from './stats.js';
import { stepNotices } from './notices.js';
import { workFinished } from './works.js';
import { stepGrit } from './grit.js';
import { stepShocks } from './shock.js';
import { stepWorks, setGround, setDone, setFoot, setRooms, setSheds } from './works.js';
import { cubes as houseCubes } from './house.js';
import { sampleBooks } from './stats.js';
import { stepAudio, sfx } from './audio.js';

// The ground is laid the moment the order the yard was bought in changes, not
// the frame after: `__finish` in the checks and a player's click landing a
// build both read a position in the same tick as the purchase.
setGround(layPiles);
// and a site puts a mark up when its own work lands -- see `workFinished`
setDone(workFinished);
// and where a station stands, for a body walking over to help at one
setFoot(stationFoot);
// and the settlement's rooms, so a build there is fenced round what will stand
setRooms(houseCubes);
// and the sheds the quarry's, the farm's and the apothecary's works are done at
setSheds({ quarry: quarryShed, farm: farmShed, apothecary: apothHut });
import { makePainter } from './painter.js';
import { updateWorkers, stepRecords, stepMachines } from './crew.js';
import { catchAir, tossFromPile } from './hands.js';
import { seedAir, stepAir } from './air.js';
import { seedWeather, stepWeather } from './weather.js';
import { stepHouse } from './house.js';
import { stepCasino, stepTable, wireTable } from './casino.js';
import { stepBuried, stepUnder } from './intro.js';
import { stepTimes } from './times.js';          // and the board of times, told they are still under
import { stepSkip } from './skip.js';
import { take } from './upgrades.js';
import { mineMs, tossMs } from './levels.js';
import { restaff, stripKit } from './staffing.js';
// The bench's row is registered by this file being loaded, here rather than
// by the page, because a yard with no document still has to raise a bench
// (raise.js).
import './raise.js';
// Wired rather than imported into apothecary.js, which would close a ring
// back to upgrades. See `setTake`.
setTake(take);
import { stepSmoke } from './puff.js';
import { now as clockNow, setFrames, frames } from './clock.js';
import { stepSmog, sampleAir, slumpMess } from './smog.js';
import { stepBalloons } from './balloon.js';
import { stepThreads } from './thread.js';
import { tidyBoards, stationFoot } from './board.js';
import { stepFilter } from './filter.js';
import { stepApothecary, stepDoseMotes, stepDoses, setTake, apothHut } from './apothecary.js';
// A chip coming down over the hill, and whether the hill has taken it. The
// height test is the chip loop's own question; every other place that puts a
// grain on the rock has no chip to ask it of.
function restOnRockAt(x, y, shade) {
  if (!boulderAlive()) return false;
  const c = Math.floor((x - rockLeft()) / P);
  if (c < 0 || c >= S.gw || S.rockTops[c] < 0) return false;
  if (y + P < sandTopY(c)) return false;
  return restOnRock(x, shade);
}

// The ground is the ground because of these: the grid module knows none of it.
export function wireGround() {
  if (!floor.painter) floor.painter = makePainter(floor);
  floor.onPut = floor.painter.mark;
  floor.blocked = blocked;
  floor.ceiling = bankCeiling;             // and lean away from the rock rather than against it
  floor.repose = true;                     // heaps on the ground stand up
  // Nothing topples over the lip on its own: a heap that could tip itself in
  // banks the yard for free and puts the haulers out of work.
}

// Laying out the world moves things; this is what each site does about it. The
// order matters: the rock needs the ground line, the rest need the rock.
export function settleIntoWorld() {
  placeRock();
  wireGround();
  wirePit();
  wireCut();                               // the cut's own sand, sized off the quarry
  wireTable();                             // the hopper on the casino's roof
  wireBelt();                              // the strip of ground riding the belt
  resizeGrid(floor);
  if (!pit.grid) setPitGrain();            // the pit never changes with the window
  seedAir();
  seedWeather();       // and a sky that is already full of cloud
}

// --- the order a frame happens in ---------------------------------------------
// One list, top to bottom, and it IS the order: `step` walks it and does
// nothing else. Entries with a comment saying what breaks if they move are
// the point of the list. Each entry is handed `c`, the frame: `{ now, dt }`,
// filled in by the `clock` entry before anything reads it; `frames()` is the
// same number for the whole frame once `setFrames` has run.

// How long this frame was, before anything moves on the strength of it:
// everything that moves reads it (`frames` in clock.js).
function startFrame(c) {
  const frameNow = clockNow();
  // a long tab-out is not a long frame -- and the clock agrees, see `tick`
  c.dt = Math.min(CLOCK_LEAP_MS, frameNow - (S.lastFrame || frameNow));
  S.lastFrame = frameNow;
  setFrames(c.dt);
  c.now = clockNow();
}

// The things worth knowing about the ground that are not worth working out
// every frame.
function countTick() {
  S.tick++;
  tickGrid();
  // four times a second: this is what tells a station it has room again, and
  // waiting half a second to notice reads as the crew dawdling.
  if (S.tick % 15 === 1) surveyFloor();
  // A fact about the roster, which does not need revisiting sixty times a
  // second.
  if (S.tick % 15 === 7) stripKit();
  // A heap finding its angle is a slow thing and nobody is watching a cell.
  if (S.tick % 12 === 3) slumpMess();
}

// A lever thrown during the crew pass cannot restaff its station itself:
// `restaff` calls `syncWorkers`, which replaces `S.workers`, the array the
// pass is walking. So the arrival sets a latch and it is drained here,
// outside the loop.
function drainRestaff() {
  if (S.restaff) { const r = S.restaff; S.restaff = null; restaff(r.job, r.want); }
}

function holdToMine(now) {
  if (!S.mining) return;
  S.nextHit = Math.max(S.nextHit, now - 500);      // don't burst after a background tab
  while (now >= S.nextHit) {
    // A held swing takes the top off at the nearest high point to the cursor
    // (`topOfRock`). Not while the rock's pile is full: the hold waits like
    // the crew, or the spoil lands on ground with no room and runs into the
    // pit as dust nobody carried.
    const at = !S.pileFull.rock && overBoulder(S.mouse.x, S.mouse.y) ? topOfRock(S.mouse.x) : null;
    if (at) knockOff(at.x, at.y, undefined, false);   // hold-to-mine is still your hands
    S.nextHit += mineMs();
  }
}

// Hold to toss: a hand held down near a pile grabs a handful off it and
// throws that at the hole (`tossFromPile`), leaving whatever is in the hand
// where it is. Paced like the swing, so a sweep and a flick is still yours:
// nothing goes before `TOSS_DELAY`, and then a handful every `tossMs`, the
// bench's pace ladder.
function holdToToss(now) {
  if (!S.dragging || !S.autoToss) return;
  if (now < S.nextToss) return;
  tossFromPile(S.mouse.x);
  S.nextToss = now + tossMs();
}

export const STEPS = [
  // The plots are dug when the ground is broken, not when the first farmhand
  // walks up. Asked every frame rather than hooked onto the sale, so a save,
  // the dev panel and the sale all arrive at the same plot; it is two length
  // checks once the plots are there.
  { name: 'plots',   step: () => { if (S.farmOpen) plantPlots(); } },
  // And the ground each station heaps on, for the same reason. It does
  // nothing unless the set of open places has changed. See `layPiles`.
  { name: 'piles',   step: layPiles },
  { name: 'clock',   step: startFrame },      // and how long this frame was
  // Before the camera, so a running scene's aim is what the glide obeys this
  // frame rather than next. The story is one machine (beats.js): the
  // opening, the reunion, the rescue, the cutscenes and the ending, and a
  // beat that owns the camera is the one thing allowed to point it; nothing
  // ad hoc takes it.
  { name: 'beats',   step: c => stepBeats(c.now) },
  { name: 'camera',  step: c => stepCamera(c.now) },
  { name: 'shake',   step: stepShake },       // and whatever the last landing left
  { name: 'air',     step: stepAir },
  { name: 'paid',    step: stepPaid },
  { name: 'rates',   step: c => sampleRates(c.now) },
  // Beside `rates` because it is the same act, reading the counters, and
  // after `clock`, which puts `now` on the frame.
  { name: 'books',   step: c => sampleBooks(c.now) },
  { name: 'notices', step: c => stepNotices(c.now) },   // and whether the yard did anything worth saying
  { name: 'weather', step: c => stepWeather(c.now) },
  { name: 'survey',  step: countTick },
  { name: 'boards',  step: tidyBoards },      // and no submenu outliving its board
  { name: 'rock',    step: stepRock },        // a new one on its way down
  { name: 'shack',   step: c => stepShack(c.dt) },  // and the hut scooting over to make room for it
  // Straight after the rock: it reads where the rock has got to this frame
  // and may stop it there, so it has to run on the same frame the rock moved.
  { name: 'shield',  step: stepShield },
  { name: 'crew',    step: c => updateWorkers(c.now, c.dt) },
  { name: 'restaff', step: drainRestaff },
  // Before `smog`, so the dirt a machine makes this frame is in this frame's
  // sky rather than trailing it by one.
  { name: 'machines', step: c => stepMachines(c.now) },   // and whatever the machines got through
  { name: 'records',  step: c => stepRecords(c.dt) },     // and everybody gets a little older
  { name: 'under',    step: c => stepUnder(c.dt) },       // and the one under the rock has been there a frame longer
  { name: 'times',    step: stepTimes },                  // and the board is asked to name the run, once
  { name: 'breaks',   step: c => stepBreaks(c.now) },     // and what the stopped ones get up to
  // The collapse does NOT take the camera: the view is where you put it, and
  // an ad hoc grab steals the frame from anything else pointing it.
  { name: 'works',        step: c => stepWorks(c.dt) },   // and whatever the yard is building
  { name: 'smoke',        step: c => stepSmoke(c.dt) },   // and every mote of it climbing and going out
  { name: 'grit',         step: c => stepGrit(c.dt) },    // and the chips off a builder's hammer
  { name: 'shocks',       step: c => stepShocks(c.dt) },  // F4: and the ring a crit left going out
  { name: 'casino',       step: c => stepCasino(c.dt) },  // the hand: the handful on the pegs, the bins paying
  { name: 'table',        step: c => stepTable(c.dt) },   // and the sand: into the hopper, away, and a caught pay out of the foot
  { name: 'skip',         step: c => stepSkip(c.now) },   // the space bar, held through any beat
  { name: 'buried',       step: c => stepBuried(c.now) }, // and whoever is under the rock, when they can be seen
  { name: 'house',        step: c => stepHouse(c.now) },  // and the crew's own hearth, now and then
  { name: 'core',         step: stepCore },
  { name: 'meteor',       step: c => stepMeteor(c.now) }, // and the sky, which has a rock in it now
  { name: 'summon',       step: c => stepSummon(c.dt) },  // and whatever the ring is pouring into it
  { name: 'sparkle',      step: c => stepSparkle(c.dt) }, // and the magic they leave in the air
  { name: 'filter',        step: c => stepFilter(c.dt) },   // and the pumps on the air filter
  { name: 'apothecary',   step: c => stepApothecary(c.dt) },  // and the pot on the boil, minting its doses
  { name: 'doses',        step: stepDoses },              // spent tonics come off the bodies wearing them
  { name: 'dosemotes',    step: c => stepDoseMotes(c.dt) },   // and the rest burn off whoever is under them
  // The rift takes grains off the top of the pile without taking them off you
  // (`swallow` in pit.js): the one thing that empties the hole and leaves the
  // counter where it was.
  { name: 'rift',      step: c => stepRift(c.dt) },
  { name: 'smog',      step: c => stepSmog(c.dt) },       // and the sky, which is filling up
  { name: 'balloons',  step: stepBalloons },              // and the craft crossing it
  { name: 'threads',   step: c => stepThreads(c.dt) },    // and what they draw down out of the clouds
  { name: 'sampleair', step: c => sampleAir(c.now) },
  // swinging does not catch its own spray
  { name: 'catch', step: () => { if (S.dragging) catchAir(S.mouse.x, S.mouse.y); } },
  { name: 'mining', step: c => holdToMine(c.now) },
  { name: 'tossing', step: c => holdToToss(c.now) },
  // The belt's band before the chips: a load that runs off the head becomes a
  // chip this same frame and should fall on the frame it left.
  { name: 'belt',  step: c => stepBelt(c.now, frames()) },
  { name: 'chips', step: c => stepChips(c.now) },
  { name: 'settle', step: c => {
      settleSome(floor, SETTLE_BUDGET);
      settlePit();
      if (cut.grid) settleSome(cut, SETTLE_BUDGET);
      settleBelt(c.now); } }
];

export function step() {
  const c = { now: 0, dt: 0 };
  for (const s of STEPS) s.step(c);
  // Last, so the audio reads the frame the yard has just finished.
  stepAudio(c.dt);
}

// Everything in the air, one frame further along, and whatever it lands on.
function stepChips(now) {
  const f = frames();
  for (let i = S.chips.length - 1; i >= 0; i--) {
    const ch = S.chips[i];
    // however long this frame was, in the sixtieths these speeds are written in
    ch.vy += GRAV * f;
    ch.x += ch.vx * f;
    ch.y += ch.vy * f;

    // The far wall of the hole is a wall at every height, not only below the
    // ground line: everything is thrown at the pit from the near lip, so a
    // grain past the far wall is a throw that sailed, and one let over lies
    // behind the hole for the rest of the run where nobody can reach it.
    //
    // Asked BEFORE the world's edge: a hauler's toss leaves the lip at over a
    // hundred pixels a frame and the ground behind the hole is eighteen
    // columns, so the edge clamp catches such a grain first, pins it on the
    // last column with its speed reversed, and a test run after would decline
    // to look at it. The hole's wall stops the throw; the world's edge is the
    // last word for anything never thrown at the hole.
    if (ch.vx > 0 && ch.x + P > pit.x + pit.w) {
      ch.x = pit.x + pit.w - P;
      ch.vx = 0;
    }

    if (ch.x < 0) { ch.x = 0; ch.vx = Math.abs(ch.vx) * 0.6; }
    if (ch.x > S.worldW - P) {
      ch.x = S.worldW - P;
      ch.vx = -Math.abs(ch.vx) * 0.3;
    }

    // Onto the belt's band, a surface like the ground (`catchBelt` owns every
    // condition). Ahead of the hole and the cut, because the head of the belt
    // hangs over the mouth of the hole and a grain crossing the band above
    // the lip would otherwise be taken by the hole from under it.
    if (catchBelt(ch, now, f)) { S.chips.splice(i, 1); continue; }

    // down the shaft: the pit collects whatever falls through its mouth
    // `>=`, to match what the ground asks below: with `>` a chip that came
    // down exactly on the ground line over the mouth failed the pit's test,
    // passed the floor's, and was shoved back to the end of a pile.
    if (overPitMouth(ch.x) && ch.y + P >= S.groundY) {
      // A torn pit takes the grain the moment it crosses the mouth, instead
      // of landing it on a pile the rift would only lift it back off.
      if (S.riftOpen && riftCatch(ch.x, ch.y, ch.s, ch.vx, ch.vy)) {
        S.chips.splice(i, 1);
        continue;
      }
      const pc = Math.max(0, Math.min(pit.cols - 1, colOf(pit, ch.x)));
      if (ch.vx < 0 && ch.x < pit.x) { ch.x = pit.x; ch.vx = 0; }             // pit wall
      // And the far one, for a grain down inside the hole arriving at the
      // back of it; let through, it is a grain climbing out of a hole.
      if (ch.vx > 0 && ch.x + P > pit.x + pit.w) { ch.x = pit.x + pit.w - P; ch.vx = 0; }
      if (ch.vy > 0 && ch.y >= surfaceY(pit, pc)) {
        // Into the pile, or through the rift if the pile has no cell for it;
        // the hole never hands a grain back.
        bankDust(ch.x, ch.s);
        S.chips.splice(i, 1);
        continue;
      }
      continue;
    }

    // down the ladder's own hole: the cut collects whatever falls through its
    // mouth, as the pit does (`overCutMouth`).
    if (overCutMouth(ch.x) && ch.y + P >= S.groundY) {
      const cc = Math.max(0, Math.min(cut.cols - 1, colOf(cut, ch.x)));
      // The walls stop a grain coming down inside the cut. A grain still on
      // its way UP is a shard thrown at the rim from the floor: from the
      // columns under the far wall it meets the face before the ground line,
      // and stopped dead there it fell back, was thrown again from the same
      // column, and never came out. Held against the wall with its throw
      // intact, it rides up the face and over the rim.
      if (ch.vx < 0 && ch.x < quarry.x) { ch.x = quarry.x; if (ch.vy >= 0) ch.vx = 0; }
      if (ch.vx > 0 && ch.x + P > quarry.x + quarry.w) { ch.x = quarry.x + quarry.w - P; if (ch.vy >= 0) ch.vx = 0; }
      if (ch.vy > 0 && ch.y >= surfaceY(cut, cc)) {
        // Almost always room in the cut. The one time not is a chip in flight
        // the instant `fillQuarry` puts the ground back under it, and then it
        // comes down as it would on any other ground.
        if (addGrain(cut, ch.x, null, ch.s) || addGrain(floor, ch.x, blocked, ch.s)) sfx('grain-land', { x: ch.x });
        else bankDust(ch.x, ch.s);
        S.chips.splice(i, 1);
      }
      continue;
    }

    // Land on the floor dust -- but an aimed chip clears the bank it is
    // thrown over first, or every chip comes down on the slope facing the
    // rock and the heap grows back up to the foot.
    const c = Math.max(0, Math.min(floor.cols - 1, colOf(floor, ch.x)));
    const arrived = ch.land == null || ch.y >= S.groundY - P ||
                    (ch.vx > 0 ? ch.x >= ch.land : ch.x <= ch.land);

    // And on the rock, a surface like any other: a grain over the crest
    // comes to rest on the outline as mined (`restOnRock` in rock.js) rather
    // than walking out from under the footprint into the heap beside it.
    // Behind `arrived`, which keeps this from catching the spoil coming off
    // the face: a thrown grain is aimed past the hill and is not arrived
    // while still over it.
    if (ch.vy > 0 && arrived && restOnRockAt(ch.x, ch.y, ch.s)) {
      S.chips.splice(i, 1);
      continue;
    }
    if (ch.vy > 0 && arrived && ch.y >= surfaceY(floor, c)) {
      // One rule for everything that lands: as far as the ground is
      // concerned a shard is a grain. The pit says its own sound when the
      // grain goes to it instead.
      if (addGrain(floor, ch.x, blocked, ch.s)) sfx('grain-land', { x: ch.x });
      else bankDust(ch.x, ch.s);
      S.chips.splice(i, 1);
    }
  }
}

// One walk of the ground, four times a second: how much lies on each strip,
// and where anything that is not dust has come to rest.
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
      // The painter has no color for anything that is not dust and leaves
      // that cell clear, so the mark is drawn over it. Every one, not just
      // the top of a column: a cell left clear and unmarked is a hole in
      // the pile.
      if (!isDust(v)) {
        marks.push({ v, x: x + P / 2, y: bottomY(floor) - (r + 1) * P + P / 2 });
      }
    }
    if (pile) count[pile.key] += n;
  }
  S.floorMarks = marks;
  // The total is the floor's own ledger (`put` keeps it, verify.js rule 7
  // watches it), not re-derived from the walk. The walk stays for what a
  // ledger cannot answer: which strip each grain stands on, and the marks.
  S.floorGrains = floor.n;
  S.pileCount = count;

  // A full pile stops the station behind it, and room for one more starts it
  // again: clearing a handful should put somebody back to work.
  const full = {};
  for (const p of S.piles) full[p.key] = count[p.key] >= (PILE_LIMIT[p.key] || Infinity);
  S.pileFull = full;
}

// Dust flying to the bench, on its way out of the counter. This moves them;
// `drawPaid` in the shell draws them.
export function stepPaid() {
  fly(S.paid, bench.x + bench.w / 2, bench.y - P * 2);
  // The hole giving way rocks the yard. The knock is asked for where the
  // tear happens (pit.js) and spent here, because a shake is the world's
  // business and pit.js is downstream of the world (`shakeView`).
  if (S.riftShake) { shakeView(S.riftShake); S.riftShake = 0; }
  sink(S.gulped);
  // ripples too old to show are dropped here rather than in the drawing,
  // which reads the clock but never writes the state
  while (S.ripples.length && clockNow() - S.ripples[0].at > ABYSS_RIPPLE_MS) S.ripples.shift();
}

// Grains going into the abyss: each dives to the liquid's surface below where
// it was caught and is eaten there, with a ripple left at the spot. The dive
// accelerates, because falling into something is what this is. While the pit
// is merely torn, the grains orbit into the hanging disc instead (`orbit`;
// "The pit's arc" in DESIGN.md).
function sink(list) {
  if (!S.drowned) return orbit(list);
  const f = frames();
  const rate = 1 / ABYSS_DIVE_FRAMES;
  const now = clockNow();
  for (let i = list.length - 1; i >= 0; i--) {
    const m = list[i];
    m.t += rate * f;
    if (m.t >= 1) {
      if (S.ripples.length < 40) S.ripples.push({ x: m.x, at: now });
      list.splice(i, 1);
      continue;
    }
    if (m.t <= 0) continue;
    // Held inside the mouth: a grain caught right at a lip still drowns in
    // the hole rather than in the ground beside it.
    const gx = Math.max(pit.x + P, Math.min(pit.x + pit.w - P, m.x0));
    const gy = abyssLine();
    const e = m.t * m.t;
    m.x = m.x0 + (gx - m.x0) * e;
    m.y = m.y0 + (gy - m.y0) * e;
  }
}

// The torn era's journey: the fall into the hanging disc. **The rift pulls
// and the grain does the rest.** An inverse square toward the middle, quoted
// at one disc radius so it follows the disc as it grows; the grain's own
// speed carries it; a little is shed each frame so nothing circles for ever;
// inside RIFT_EAT it is gone. A thrown grain swings round once or twice and
// a lifted one drops straight in, and neither is an authored curve.
function orbit(list) {
  const f = frames();
  const c = riftCenter(), R = riftRadius();
  const eat = R * RIFT_EAT;
  const drag = RIFT_DRAG ** f;
  const slowFrom = eat * RIFT_SLOW_FROM;
  for (let i = list.length - 1; i >= 0; i--) {
    const m = list[i];
    const dx = c.x - m.x, dy = c.y - m.y;
    const d = Math.hypot(dx, dy);
    // Near the horizon the grain's own clock slows: its frame is shortened,
    // so the pull, the speed and the step ease off together and it creeps
    // the last stretch. `dim` is the same number and the drawing fades on
    // it, so a grain is never seen to cross. It is also what cures the
    // flicker: a mark that jumps two cells a frame blinks.
    const ease = d <= eat ? 0
               : Math.min(1, (d - eat) / Math.max(1, slowFrom - eat)) ** 1.5;
    m.dim = ease;
    if (ease < RIFT_GONE) { list.splice(i, 1); continue; }   // faded out, and gone
    const fe = f * ease;
    // Held at its rim value inside the mouth, because a true square goes to
    // infinity at the middle; floored everywhere, because a grain off the far
    // end of this hole sits at forty radii and would feel nothing at all
    // (RIFT_G_MIN).
    const g = Math.max(RIFT_G_MIN,
                       RIFT_G * (R * R) / Math.max(d * d, R * R * RIFT_EAT * RIFT_EAT));
    m.vx = (m.vx || 0) + (dx / d) * g * fe;
    m.vy = (m.vy || 0) + (dy / d) * g * fe;
    m.vx *= drag; m.vy *= drag;
    const sp = Math.hypot(m.vx, m.vy);
    if (sp > RIFT_VMAX) { m.vx *= RIFT_VMAX / sp; m.vy *= RIFT_VMAX / sp; }
    m.x += m.vx * fe;
    m.y += m.vy * fe;
  }
}

function fly(list, tx, ty) {
  const f = frames();                            // the flight is a rate a frame
  for (let i = list.length - 1; i >= 0; i--) {
    const m = list[i];
    m.t += m.rate * f;
    if (m.t >= 1) { list.splice(i, 1); continue; }
    if (m.t <= 0) continue;

    // A grain flies to the station that sold the row it paid for (stamped on
    // the grain at `lift`, see `payTo` in pit.js) and falls back to the
    // bench (`tx`/`ty`) for a spend with no destination.
    const gx = m.tx != null ? m.tx : tx;
    const gy = m.ty != null ? m.ty : ty;
    const e = m.t * m.t * (3 - 2 * m.t);           // ease in and out
    m.x = m.x0 + (gx - m.x0) * e;
    m.y = m.y0 + (gy - m.y0) * e - Math.sin(e * Math.PI) * m.lift;
  }
}
