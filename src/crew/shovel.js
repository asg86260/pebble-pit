// --- going and shovelling -------------------------------------------------------
// One thing a body can be told to do, because several different kinds of body
// have to be able to do it.
//
// This used to live inline in the shared part of the loop, below the rock hands' own
// branch -- and that branch ends in `continue`, so a rockhand never reached it. That
// was invisible while the rock was worth swinging at. It stops being invisible
// the moment the rock's pile fills up, which is what happens when the hole is
// full and the haulers cannot clear it: the rock hands stand down, "free to take
// five", and take five under a yard of muck with nothing else in the world to
// do. Idle bodies and a mess is the one combination this whole idea was written
// to rule out.

import { P, WORKER } from '../config.js';
import { S } from '../state.js';
import { workSpot, muckAtCol, nearestMuck, muckFor, sweepMuckAt, poopCols, colAt,
         MUCK_ELBOW } from '../smog.js';
import { ways, wayAt, wayOver, keepTo, stepRoute, climbTo, feetOn, inWorking } from '../route.js';
import { commutePace } from '../upgrades.js';
import { TYPE } from '../jobs.js';
import { frames } from '../clock.js';
import { rand } from '../rng.js';
import { stopJig } from './dance.js';
import { swingFor } from './tenders.js';
import { across } from './body.js';
import { unbook } from './hole.js';

// Nobody shovels inside anybody. The same quarter-step the idlers take, for the
// one job the whole crew drops everything to do at once.
// Only when two of them are genuinely standing in each other.
//
// It used to push at anything within a body and a half, every frame, while the
// body it was pushing was walking back towards the patch it had claimed -- so a
// shovelling gang slid back and forth on the spot for the whole clear-up, each
// body shoved out and walking in again sixty times a second. The claims already
// keep them four columns apart (see `nearestMuck`); this is only for the end of
// a clear-up, when the last patch is claimed by somebody and a second body comes
// for it anyway.
//
// It hands the nudge back rather than moving the body itself, because where a
// shovelling body stands is snapped to a whole cell and a nudge of a third of a
// pixel does not survive a snap. See the caller.
function elbowMuck(w) {
  for (const o of S.workers) {
    if (o === w || o.inside || o.goal !== 'muck' || inWorking(o)) continue;
    const d = o.x - w.x;
    if (Math.abs(d) >= WORKER * 0.8) continue;
    // Two on the very same pixel have no side to push to. The tiebreak is where
    // each stands in the crew list, so they alternate and actually come apart --
    // a coin toss they both call the same way leaves them stacked for ever.
    // Sideways, and nothing else. It used to plant the feet on the ground line
    // after the nudge, which is right for the yard and wrong on the hill: a
    // rockhand shovelling the crest was dropped the height of the rock on every
    // frame it stood too close to somebody, and lifted back up on every frame it
    // did not -- the body flickering between the top of the rock and the ground
    // for as long as the two of them were shoulder to shoulder. Height belongs
    // to whoever is doing the job; the elbow only says where along the ground.
    const tie = S.workers.indexOf(w) % 2 ? 1 : -1;
    return -Math.sign(d || tie) * 0.35 * frames();
  }
  return 0;
}

// The nearest column of poop to a place, the same search `nearestMuck` runs
// over every kind at once, kept to the one kind that is a janitor's alone (see
// B4 in wave-feedback3.md, and `takeMess` below, which is the only caller). A
// column already spoken for -- by anybody, the same `taken` set `nearestMuck`
// itself reads and writes -- is skipped and a claim reserves the same elbow on
// the way out, so the two searches can never both hand out the same ground.
function nearestPoop(wx, taken) {
  const p = poopCols();
  const home = colAt(wx);
  for (let d = 0; d < p.length; d++) {
    for (const c of (d ? [home - d, home + d] : [home])) {
      if (c < 0 || c >= p.length || !p[c]) continue;
      if (taken && taken.has(c)) continue;
      if (taken) for (let k = c - MUCK_ELBOW; k <= c + MUCK_ELBOW; k++) taken.add(k);
      return c * P + P / 2;
    }
  }
  return null;
}

// Returns true if the body is on muck duty and has had its turn this frame.
export function takeMess(w, c) {
  const { now, taken, muckTaken, poopTaken } = c;
  // Two kinds of mess, and they are not the same job.
  //
  // What the sky drops is weather. It lands on everybody's yard and everybody
  // clears it, the way they always have. What a body leaves behind is a body's
  // own, and that is a post: it lies there until you put somebody on it, and
  // there is nobody to put on it until the shed is up. Which is what the shed
  // buys -- not a tidier yard, but the job. See `capOf` and `sweepMuckAt`.
  if (w.carry || w.hasCore || muckFor(w) <= 0) return false;
  // One body, one column, held until that column is clear -- the same
  // booking a hauler makes on a column of dust.
  //
  // The set below is rebuilt every pass, so on its own it only stopped two
  // bodies choosing the same column *in the same frame*: every one of them
  // then re-chose the nearest the very next frame, and the whole crew walked
  // to the same spot anyway. A claim has to be kept to be a claim.
  // A finished column is let go and the next one picked a FRAME later, not in
  // the same breath. The set is rebuilt at the top of the frame from every held
  // claim with its elbows out -- including this body's own, which it has only
  // just finished with -- so a same-frame re-pick was barred from the four
  // columns either side of where it stood, and a lone cleaner hopped away from
  // its own remnants. One frame of empty hands and the rebuild is clean.
  //
  // And that frame is still a frame on the job. This used to hand back false,
  // which told the caller the body was off muck duty -- so `mess.back` put it on
  // its own goal and its own work moved it for one frame: a janitor took one
  // stride toward its shed at a full commute, and the next frame's claim walked
  // it straight back. Once per column, which on a thin strip is once per swing
  // -- a body that lurches half a cell toward home and back every half second
  // is the reported "janitor vibrating while it cleans". Empty hands between two
  // columns of the same mess are not a walk home; the body stands where it is
  // and picks again next frame.
  if (w.muckAt != null && muckAtCol(w.muckAt, w) <= 0) { w.muckAt = null; return true; }
  // ...and the same frame of empty hands when the hauler's own hole branch let
  // the column go a few lines up (see `muckDropped` there): the set is just as
  // stale for a release made anywhere else in the frame.
  if (w.muckDropped === now) return true;
  if (w.muckAt == null) {
    // A janitor's own mess first -- see B4 in wave-feedback3.md. `nearestMuck`
    // treats every kind alike and hands out whichever column is nearest, which
    // is fine with one pair of hands on it and is not fine with a yard full of
    // haulers idling into the shared muck besides: poop is the one mess only a
    // janitor may touch, and with everybody else free to work everything else,
    // the nearest column for a janitor's own search kept drifting to wherever
    // the crowd had not yet reached, and the actual mess a player wants gone
    // sat for as long as the yard had any ordinary muck left to offer instead
    // -- not shoved by anybody's elbow, simply never the nearest thing going.
    // A janitor looks for its own kind first and only falls back to the shared
    // search when there is genuinely none of it left.
    const pick = (w.type === TYPE.JANITOR ? nearestPoop(w.x + WORKER / 2, poopTaken) : null)
      ?? nearestMuck(w.x + WORKER / 2, muckTaken, w);
    w.muckAt = pick == null ? null : Math.floor(pick / P);
  }
  // The patch, and the ground to work it from. They are the same place out on
  // the yard and they are not on the rock, the quarry or the plots: a body cannot
  // stand on a site, so it walks to the edge of it and reaches across. The
  // claim is still the muck's own column, so it is held until that column is
  // clear rather than until the ground beside it is.
  const patch = w.muckAt == null ? null : w.muckAt * P + P / 2;
  if (patch == null) return false;
  // Ground a shovel can actually be swung from is ground close to the patch --
  // a body's own width, give or take, the way it already stands a step back
  // from a heap it cannot walk into. `workSpot` does not know that: asked for a
  // patch with nothing solid anywhere near it -- muck lying over the open mouth
  // of an empty pit, where `footing` rightly calls the whole span NONE -- it
  // widens its search until it finds real ground *somewhere*, however far off,
  // and hands that back. Taken at face value, that reads as a stance beside the
  // mess; it is really the nearest dry land, cells away, with the claimed
  // column left hanging over open air in between. `nearestMuck` lets a hauler
  // or a janitor be sent at such a column on the understanding that getting
  // down there is a route, the same one a hauler takes into a filled pit; a
  // body that instead stood at that far stance and shovelled across the gap
  // was standing on the ground line with its claim several hundred pixels
  // below its feet -- the reported "walking through the air over the pit",
  // reappeared here at the pit's own mouth once the crew started moving fast
  // enough to reach the lip and stop before anything caught the mismatch. So a
  // stance too far from its patch to be a stance at all is not one: the claim
  // is dropped and picked up again next frame, the same way an emptied column
  // is, rather than worked from arm's length.
  const to = patch == null ? null : workSpot(patch);
  if (to == null || Math.abs(to - patch) > WORKER) { w.muckAt = null; return true; }
  // A mess under the coming rock, or the far side of it, is not fetched through
  // the fall. The walk never asked about the zone, so a body sent at one ground
  // against the zone's wall -- stepping in, shoved out by the duck, stepping in
  // -- and juddered on the line for the whole of the fall. Every hauler errand
  // already answers this with the dance (see `across` and `heldUp` below), and
  // a shovel is an errand like any other: the body joins in and picks the mess
  // back up when the ground is open again. The claim is kept -- nobody else can
  // walk there either.
  if (S.rockFall > 0 && c.zone &&
      ((to + WORKER > c.zone.from && to < c.zone.to) || across(c.zone, w.x, to))) {
    // The claim is kept -- nobody else can walk there either -- and the body is
    // left to the celebrate stage, which has already had this frame. Reached
    // only by a body whose shovel was booked before the rock was announced.
    return true;
  }
  // and the dance is put away when the shovel comes back out, the same tidy-up
  // the rock hands and the haulers do, so the hop is not carried to the mess
  if (w.jigAt != null) stopJig(w);
  if (w.claim >= 0) { taken.delete(w.claim); w.claim = -1; }
  unbook(w);
  // Out of the house first. A mess is the one thing that calls a body back
  // off its own doorstep, and this runs before the going-home branch --
  // so a body indoors used to pick up a shovel without ever coming out,
  // and worked the yard invisible and still counted as being at home.
  w.inside = false;
  w.goal = 'muck';
  // Off the rock, and down -- but climbed down, not dropped down.
  //
  // This used to put the body's feet on the ground line the moment the job
  // came up, on the reasoning that a rockhand going shovelling is a rockhand off the
  // rock. It is, eventually; it is not off it in the frame it decides to go.
  // A body standing on the crest with muck to clear fell ninety pixels in one
  // frame -- the height of the hill, from the top of it to the yard, between
  // one frame and the next -- and then walked to the mess. Which is the one
  // thing this file exists to not do.
  //
  // Nothing needs setting. `foot()` below already asks where the body is: on
  // the rock's footprint it climbs to the rock's surface, off it, it walks the
  // ground -- and `climbTo` eases from wherever the feet actually are, in
  // either direction. A rockhand leaving the crest walks down it the way it
  // walked up.
  if (w.type === TYPE.ROCK) {
    if (w.jigAt != null) stopJig(w);
    w.idleAt = null;
  }
  // A shovel in hand is not a break, whoever is holding it. Only the rockhand
  // said so; a janitor came off its loitering with `resting` still set and
  // shovelled the whole mess "on a break" -- on its card, and to the break
  // clock, which would light it a cigarette mid-swing.
  w.resting = false;
  // Getting there, which is a route and not a walk.
  //
  // The mess is a place, and a place is on a way (see `wayOver` in route.js):
  // muck on the face is on the hill, muck out on the yard is on the yard. What
  // this did with that was plant the feet on the *mess's* way for the whole
  // trip and step the body's x towards it by hand -- and that is right only
  // while the body is already on that way.
  //
  // A janitor up on the crest, having just cleared a patch off the face, with
  // its next patch out on the yard, is not. It started easing its feet down to
  // the ground line while it was still standing over the middle of the hill,
  // and walked the length of the footprint sixty pixels inside solid rock.
  // Rule 2 in verify.js caught it -- buried, and still buried a second later,
  // so not a climb lagging behind but a body standing in the hill.
  //
  // Two ways make a route. That is the whole of what the ladders taught this
  // file: getting from a place on one way to a place on another is what
  // `keepTo` and `stepRoute` are for, and every hand-written copy of it walks
  // bodies through something. It is the same going `downTheHole` makes on the
  // same errand when the mess is in the bottom of the hole. It is also what
  // keeps the hill a workplace rather than a road, without anybody being told:
  // a route from one end of the yard to the other runs along the flat in front
  // of the hill because that is the shorter way, and a route to a patch on the
  // face climbs a flank because there is no other way onto it.
  const at = to - WORKER / 2;
  const all = ways();
  const on = wayOver(at, all);
  // Still on the way. A couple of cells short is arrived -- the same slack
  // `downTheHole` allows -- but only from the right way: standing at the mess's
  // x at the height of the yard, under a heap that is up on the hill, is being
  // there in one coordinate out of two.
  //
  // And once it is stood there, a body's width of slack rather than a couple
  // of cells. The elbow below parts two shovellers until they are most of a
  // body apart -- three cells -- and with two cells of slack the parted body
  // was walked straight back into the one it had been parted from, to be
  // pushed out again: a slow slide out and walk back, every couple of seconds,
  // for as long as both stood at the last patch. The shovel reaches from
  // wherever it stands, so nothing is lost by letting it stand where it was put.
  const slack = w.route ? P * 2 : WORKER;
  if (Math.abs(at - w.x) > slack || wayAt(w.x, w.y, all).key !== on.key) {
    // Nowhere a route reaches: it gives the patch up rather than standing there
    // holding a claim on it. `mess.back` puts the body back on its own goal and
    // it looks again next frame.
    if (!keepTo(w, at, on)) return false;
    if (stepRoute(w, commutePace())) return true;
    w.route = null;
    return true;
  }
  w.route = null;
  // Arrived: it stands still and shovels. It used to keep walking the last
  // two cells in towards the exact column it had claimed while the elbow
  // pushed it back out again -- a body sliding on the spot for as long as
  // there was muck in front of it.
  //
  // And it shovels the way a rockhand mines: it plants its feet, swings, and a
  // cell comes off. The muck was being poured away at a *rate* with the
  // lunge pinned at full every frame, which reads as a shape vibrating over
  // a heap that melts -- a progress bar wearing a hat. Same throughput, one
  // cell to a swing, so there is something to watch and something to count.
  //
  // Its feet land on a whole cell and stay on it between swings. Pinning it
  // outright was tried and is wrong: the elbow that keeps a gang from
  // standing in each other needs to be able to move a body, and a gang that
  // cannot be spaced out bunches onto one spot and clears a yard slower than
  // it did before. Snapping is enough -- what read as sliding was a body
  // creeping a fraction of a pixel a frame with its lunge pinned at full.
  //
  // The snap is taken off a spot the body keeps in whole pixels of its own,
  // rather than off `w.x` itself. It was `w.x = Math.round(w.x / P) * P` -- and
  // the elbow at the bottom of this function then nudged `w.x` by about a third
  // of a pixel, which the very next frame's round put straight back. The nudge
  // could never add up to anything, so two bodies that arrived on one column
  // shovelled through each other for the whole of the clear-up: at the end of a
  // heap there is nowhere else for the second one to be sent.
  //
  // It is the trap balloon.js writes up over its craft: a thing that moves less
  // than a pixel a frame has to remember the part of a pixel it has moved. So
  // the fraction lives on `shovelAt` and `w.x` is what that rounds to -- the
  // feet still land on a whole cell and stay on it between swings, and the elbow
  // still moves the body, a cell at a time, once it has pushed far enough to be
  // worth a cell.
  //
  // Re-taken whenever the body is not already stood on its own spot, which is
  // every arrival: it has just walked here, and where it walked to is where it
  // means to stand.
  //
  // And the snap is taken TOWARD the spot the body was walking to, never past
  // it. Rounding to the nearest cell of the world sent a body that had arrived
  // a fraction short of its spot back the other way to reach the cell behind
  // it -- under a pixel, but `faceTravel` measures facing off any move at all,
  // so the janitor turned round on the frame it arrived and stood shovelling
  // with its back to the mess it had just walked to. Snapping toward `at` is
  // a step in the direction it was already going; and it stays put under the
  // elbow, since which side of `at` the fraction lies on cannot change without
  // the fraction itself crossing it.
  //
  // "Not already stood on its own spot" is read off the SNAPPED spot, not off
  // the fraction. The fraction sits up to a whole cell from the feet by
  // construction, so a test on it against a cell was a test on floating-point
  // noise: the elbow's push would reach the next cell, the fraction would be a
  // hair over a cell from the feet, and it was thrown away and started again
  // -- a body that could be pushed one cell and never a second one.
  const spot = s => { const d = s - at; return at + Math.sign(d) * Math.floor(Math.abs(d) / P) * P; };
  if (w.shovelAt == null || Math.abs(spot(w.shovelAt) - w.x) > P) w.shovelAt = w.x;
  w.x = spot(w.shovelAt);
  w.y = climbTo(w, feetOn(on, w.x));
  if (now >= (w.sweepAt || 0)) {
    sweepMuckAt(w.x + WORKER / 2, 1, w);
    w.lunge = 1;
    w.sweepAt = now + swingFor(w) * (0.85 + rand() * 0.3);
  }
  // and not shoulder to shoulder with the next one. A yard under muck
  // has something to shovel wherever you stand, so a gang that arrived
  // together would each find work on the spot they arrived on and clear
  // the whole mess as one lump you cannot count.
  w.shovelAt += elbowMuck(w);
  return true;
}
