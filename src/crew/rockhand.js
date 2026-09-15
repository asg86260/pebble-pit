// The gang on the hill: how one is made, where the working layer is, and one
// frame of taking the rock off it.
//
// The crew take the hill off in layers. A rockhand does not stand in one spot and
// bore a shaft: it walks the top layer, striking the rock under its feet as it
// goes, so the crest comes off as a row and the next row is exposed underneath.
// It turns at the ends of the layer and turns before walking into a mate, so the
// gang works back and forth across the rock like a line of men on a bench.

import { P, WORKER, IDLE_BEAT, IDLE_STRIDE, IDLE_PACE,
         SWING_BOB, SWING_DRIVE } from '../config.js';
import { S } from '../state.js';
import { standOn, rockLeft } from '../world.js';
import { climbTo } from '../route.js';
import { boulderAlive, knockOff, rockTopY, rockPatch } from '../rock.js';
import { tidyStep } from '../tidy.js';
import { rockhandMs, rockhandBite } from '../upgrades.js';
import { workBoost } from '../apothecary.js';
import { TYPE } from '../jobs.js';
import { rockMuck } from '../smog.js';
import { frames } from '../clock.js';
import { rand } from '../rng.js';
import { stopJig } from './dance.js';

const MINE_BAND = 3;      // cells below the peak still counted as the top layer
const ROCKHAND_WALK = 0.5;   // pixels a frame along the row

export function findPeak() {
  S.peakRow = S.gh;
  for (let c = 0; c < S.gw; c++) {
    if (S.rockTops[c] >= 0 && S.rockTops[c] < S.peakRow) S.peakRow = S.rockTops[c];
  }
}

const inBand = c =>
  c >= 0 && c < S.gw && S.rockTops[c] >= 0 && S.rockTops[c] <= S.peakRow + MINE_BAND;

const colAtX = x => Math.max(0, Math.min(S.gw - 1, Math.round((x - rockLeft()) / P)));

// the nearest column that is still part of the working layer, or null when no
// column is: there is no rock to work
export function nearestInBand(from) {
  for (let d = 0; d < S.gw; d++) {
    if (inBand(from - d)) return from - d;
    if (inBand(from + d)) return from + d;
  }
  return null;
}

// Somebody already working the stretch this one is about to walk into.
//
// It asks `mineDir` -- the way this one is working along the row -- rather than
// which way it is facing. They are the same thing for a rockhand on the crest and
// they are not the same field: a heading is remembered between frames and turned
// round at the ends of the layer, and a facing is measured off the ground the
// body has just covered. See `faceTravel`.
export function elbowed(w, x) {
  for (const o of S.workers) {
    if (o === w || o.type !== TYPE.ROCK) continue;
    if ((o.x - w.x) * w.mineDir <= 0) continue;         // behind it: not in the way
    if (Math.abs(o.x - x) < WORKER * 1.2) return true;
  }
  return false;
}

export function newRockhand() {
  return {
    type: TYPE.ROCK, next: 0, lunge: 0,
    x: rockLeft() + rand() * S.gw * P, y: S.cy,
    mineDir: rand() < 0.5 ? -1 : 1,  // which way along the layer it is working
    ph: rand() * Math.PI * 2,        // where in its wobble it starts
    sp: 0.5 + rand() * 0.9,          // how fast it sways
    wob: 0.05 + rand() * 0.10,       // how far it drifts round its seat
    rw: 0.4 + rand() * 0.9           // how much it drifts in and out
  };
}

export function rockhandWork(w, c) {
  const { now } = c;

  // Back to it. The dance leaves its ground and its move behind, so the next
  // rock is celebrated somewhere else -- and the say goes with it, or a body
  // walks back up the hill still shouting about the last one.
  if (w.jigAt != null) stopJig(w);

  // The crew climb the hill and work it from the top down. Each one keeps a
  // stretch of the crest to itself, stands on whatever rock is left there and
  // sinks with it as the rock goes; when its stretch is bare it ambles along
  // to the nearest that is not.
  // The rock's pile is full. The crew stand where they are until it has
  // been carried away: dust with nowhere to go used to roll into the pit,
  // which banks it for nothing and leaves the haulers with no job.
  //
  // And so does a gang with no layer to work at all -- no rock standing and
  // none on its way. `nearestInBand` has nothing to point at then, and the
  // "walk back to the layer" branch below, given no layer, walked the body
  // briskly in whatever direction it last worked, forever: across the yard,
  // over the mouth of the hole, and out to the world's edge (the slots check,
  // 2026-09-15, a rockhand made during the opening's chat).
  if (S.pileFull.rock || nearestInBand(colAtX(w.x + WORKER / 2)) === null) {
    w.resting = true;                      // stopped, and free to take five
    // Standing down is not being switched off. It shifts its weight where
    // it stands: a slow pace of about a cell either side of the spot it
    // stopped on, and now and then it straightens up. Every rockhand has its
    // own phase already, so a stopped gang reads as a gang standing about
    // rather than as one animation played five times -- and it is nothing
    // like the dance, which is three hops a second and goes nowhere.
    if (w.idleAt == null) w.idleAt = w.x;
    const idle = now / 1000 * IDLE_BEAT + w.ph;
    // Stepped toward the sway's target, never assigned to it. An absolute
    // assignment overwrites whatever the climber gave back last frame -- its
    // whole way of refusing a step is to undo it -- so a sway written as
    // position dragged bodies over edges the climber was refusing. The janitor
    // idles this way already; now the stood-down rockhand does too.
    const swayTo = w.idleAt + Math.sin(idle * IDLE_STRIDE) * P;
    w.x += Math.sign(swayTo - w.x) * Math.min(IDLE_PACE * frames(), Math.abs(swayTo - w.x));
    const surf = rockTopY(colAtX(w.x + WORKER / 2));
    // No straightening-up hop. There used to be a whole cell of it -- the body
    // rose 6px the frame its sway crossed a threshold and dropped 6px when it
    // crossed back, which at these beats is an instant third-of-a-body jump
    // every few seconds. It read as a glitch, not a posture; the amble and the
    // sway carry the standing-about on their own.
    w.y = climbTo(w, standOn(surf));
    w.next = now + rockhandMs();
    return;
  }
  w.resting = false;
  w.idleAt = null;

  const t = now / 1000;

  // Walk the layer, turning at its ends and before walking into a mate. A
  // rockhand that finds itself off the layer -- because the rest of the gang
  // took the row down around it, or because it was hired onto a flank --
  // climbs back to it rather than standing there boring a shaft.
  //
  // `mineDir` is the way it is working *along the row*, which is a thing it
  // remembers between frames and turns round at the ends -- not the way it
  // happens to be facing, which is measured off its own feet. See
  // `faceTravel`.
  const here = colAtX(w.x + WORKER / 2);
  if (!inBand(here)) {
    const back = nearestInBand(here);      // never null here: the stand-down above caught that
    if (back !== here) w.mineDir = Math.sign(back - here);
    w.x += w.mineDir * ROCKHAND_WALK * 2.5 * frames();       // brisk, it has ground to make up
  } else {
    const step = w.x + w.mineDir * ROCKHAND_WALK * frames();
    if (inBand(colAtX(step + WORKER / 2)) && !elbowed(w, step)) w.x = step;
    else w.mineDir = -w.mineDir;
  }

  const col = colAtX(w.x + WORKER / 2);
  const surf = rockTopY(col);
  // Where it is standing, climbed to rather than assigned. The bob and the
  // swing go on top of the foot, not into it: they are what the body is
  // doing, and easing them would damp them into nothing.
  w.y = climbTo(w, standOn(surf)) + Math.sin(t * w.sp + w.ph) * SWING_BOB
      + w.lunge * P * SWING_DRIVE;

  if (boulderAlive() && now >= w.next && S.rockTops[col] >= 0) {
    // twice the bite for a breaker: the shards bought a bigger swing on a
    // body that is not going anywhere
    const bite = rockhandBite() * (w.trained ? 2 : 1);
    knockOff(w.x + WORKER / 2, surf + P / 2, bite, true, w);
    w.mined = (w.mined || 0) + bite;
    w.lunge = 1;
    // A hearty stew quickens the swing the way it quickens a stoop at the farm --
    // the rockhand's own clock, divided by the boost, so a fed rockhand comes round
    // sooner. `workBoost` is 1 for a body wearing no work tonic.
    w.next = now + rockhandMs() / workBoost(w) * (0.85 + rand() * 0.3);    // never quite in time
  } else if (boulderAlive()) {
    // Between swings, and never instead of one: a grain that came down on the
    // hill is lying on the ground this body is working, so it goes on the rock's
    // own heap on the same throw its spoil takes. See tidy.js, and `rockSand` in
    // rock.js for what it is lying on.
    tidyStep(w, rockPatch(), c.rockTaken, now);
  }
}

// A mess on the rock comes before the rock. It used to come before nothing
// but standing about: a rockhand picked up a shovel only when its pile was full
// and there was no swing left to take, and the layer on the rock was not
// something a shovel could touch at all -- it was worked off a swing at a
// time by whoever happened to be mining. Nobody mining meant nobody
// clearing, for the rest of the run: a full pile, a crew with nobody on the
// rock, or the gap between one rock and the next all left the face under
// muck for good.
//
// Its own site and not the whole yard -- unless its pile is full, in which
// case there is nothing else for it to be doing. A gang that downed tools
// for every patch anywhere would stop mining altogether for the minute and a
// half a full rain takes to shift.
export const rockhandMess = () => rockMuck() > 0 || S.pileFull.rock;

// and back up the hill when the face is clear. A rockhand carries no goal of
// its own, so the shovel's is put down with the shovel.
export function rockhandBack(w) {
  if (w.goal === 'muck') { w.goal = null; w.muckAt = null; }
}
