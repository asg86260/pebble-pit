// The wizard: the one body in this yard whose feet leave the ground.
//
// Everything else here walks. A station idles until somebody is actually
// standing at it, a hole is a thing you climb down a ladder into, and nothing is
// ever anywhere it did not travel to -- which is the rule that makes the yard
// read as people rather than as numbers with sprites on them.
//
// A wizard does not break that rule so much as pay for it. It walks out to the
// tower for its hat like every other tradesman, walks under the meteor, and then
// goes *up*, a pixel and a bit a frame, the whole four hundred and sixty of it.
// You watch it climb. It is slow on purpose: the sky is a long way off, and a
// body that got there instantly would be a body that teleported with a hat on.
//
// What it does up there is not what a miner does on the rock. It rides a ring
// round the star at a distance and throws bolts at it, and the cell comes off
// where the bolt lands -- which is the one thing in this yard that is allowed to
// happen at range, and the whole of what the hat is for. What comes off falls
// the four hundred pixels back down to the yard, where the haulers deal with it
// like anything else lying about.

import { P, WORKER, WIZ_MS, WIZ_RISE, WIZ_BOB, WIZ_SPIN,
         WIZ_TRAIL_MS, WIZ_TRAIL_LIFE, CHUTE_FALL } from './config.js';
import { frames } from './clock.js';
import { S, sky } from './state.js';
import { STEP } from './lab.js';
import { walkY } from './world.js';
import { meteorAlive, nextCell, fire, orbitR, summoning, summon, sparkle } from './meteor.js';
import { rand } from './rng.js';

// The ground under the meteor: where a wizard walks to before it goes anywhere
// near the sky, and where it comes back down to.
export const underMeteor = () => sky.x - WORKER / 2;

export function newWizard() {
  // Its own spot on the ground under the meteor, a few cells either side of the
  // middle of it. They go up from where they are standing, so a gang given one
  // column between them would rise as a single body four deep.
  const x = underMeteor() + Math.round((rand() - 0.5) * 6) * P;
  return {
    type: 'wizard', x, spot: x, y: walkY(x + WORKER / 2),
    aloft: false,           // whether its feet are off the ground
    orb0: null,             // its place on the ring round the star, once it has one
    cell: null,             // the cell of the meteor it is working on
    next: 0,                // when its next pass at that cell comes due
    goal: 'to',
    ph: rand() * Math.PI * 2,        // where in its drift it starts
    sp: 0.4 + rand() * 0.5
  };
}

// Where a wizard is trying to be: its place on the ring, this instant. They
// circle the star rather than hanging off the cell they are working, because
// what they do to it is thrown rather than swung -- see `fire` in meteor.js --
// and a body that has to be *at* the thing it is working is a body with a pick.
//
// Each keeps its own angle and they are dealt out a whole turn apart when a body
// arrives, so a gang reads as a ring going round rather than as a knot.
const angleOf = (w, now) => w.orb0 + now / 1000 * WIZ_SPIN;

function ringSpot(w, now) {
  const a = angleOf(w, now);
  return { x: sky.x + Math.cos(a) * orbitR(),
           y: sky.y + Math.sin(a) * orbitR() };
}

// How far apart they keep on the ring, in radians. Bodies arrive at the bottom
// of it -- they come up off the ground under the star -- so without this they
// would ride round in a heap of three.
const APART = Math.PI / 3;

// They do not *choose* a place: they arrive where they arrive, at the foot of
// the ring, and then push apart. Each turn they lean away from whoever is
// nearest until there is a body's room between them, which is the same thing
// the gangs on the ground do with their elbows -- and it happens where you can
// watch it rather than being decided before anybody sets off.
function spaceOut(w, secs) {
  let push = 0;
  for (const o of S.workers) {
    if (o === w || o.type !== 'wizard' || o.orb0 == null || !o.aloft) continue;
    let d = (o.orb0 - w.orb0) % (Math.PI * 2);
    if (d > Math.PI) d -= Math.PI * 2;
    if (d < -Math.PI) d += Math.PI * 2;
    if (Math.abs(d) >= APART) continue;
    push -= Math.sign(d || 1) * (APART - Math.abs(d));
  }
  w.orb0 += push * secs;
}

// What comes off a body that is flying: a speck of its own light every so often,
// drifting down behind it and going out. It is the only thing in this yard that
// says a body is being carried rather than standing on something -- everybody
// else is on the ground, and the ground says it for them.
//
// The same specks the bolts leave and throw off the star -- see `sparkle` in
// meteor.js. One substance, one list: what a wizard trails and what its magic
// scatters are the same magic.
function trail(w, now) {
  if (now < (w.trailAt || 0)) return;
  w.trailAt = now + WIZ_TRAIL_MS * (0.7 + rand() * 0.6);
  sparkle(w.x + WORKER / 2 + (rand() - 0.5) * P * 2, w.y + WORKER - P / 2,
          (rand() - 0.5) * 0.3,
          0.15 + rand() * 0.25,      // it sinks: it is falling out of the spell
          WIZ_TRAIL_LIFE);
}

// A body taken off the sky, on its way down. It comes down the way it went up --
// under its own hat, a pixel and a bit at a time -- rather than dropping under
// gravity: a wizard is not a thing that falls when you stop paying it, and four
// hundred pixels of gravity is over in a quarter of a second.
//
// Nothing else about the body happens while it is coming down: it is `true`
// until its feet are on the ground, and the crew loop holds everything else off
// until then. See `retask`.
export function floatDown(w) {
  const foot = walkY(w.x + WORKER / 2);
  w.aloft = w.y < foot;
  // The canopy goes with the landing, along with everything else that says this
  // body is in the sky. A parachute left on a body standing on the ground is a
  // parachute drawn over somebody shovelling.
  if (w.y >= foot) {
    w.y = foot; w.floating = false; w.aloft = false; w.chute = false;
    return true;
  }
  // Under a canopy it comes down slower, because that is what a canopy is for.
  // A body stepping out of a balloon and dropping at a wizard's pace is a body
  // being lowered on a wire.
  const pace = w.chute ? CHUTE_FALL : WIZ_RISE * 1.6;
  w.y = Math.min(foot, w.y + pace * frames());   // pixels a frame
  return false;
}

// A body coming down. Used when the sky has nothing left in it, and when the
// hat comes off -- a wizard stood down mid-air lands before it does anything
// else, because there is no job in this game you do from up there.
function descend(w) {
  const foot = walkY(w.x + WORKER / 2);
  w.cell = null;
  if (w.y >= foot) { w.y = foot; w.aloft = false; return true; }
  w.y = Math.min(foot, w.y + WIZ_RISE * 2);      // down quicker than up
  w.aloft = true;
  return false;
}

// How often one throws, and how much a throw takes off. The tower's two ladders.
export const wizMs = () => Math.max(120, WIZ_MS / Math.pow(STEP, S.wizSpeedLevel || 0));
export const wizBite = () => 1 + (S.wizPowerLevel || 0);

export function stepWizard(w, now) {
  if (w.aloft) trail(w, now);

  // No hat, no flying. The hat is the job -- see the tower -- so a body put on
  // this before the tower has finished one stands under the meteor and waits for
  // it, which is exactly what `stepKit` is already walking it to the tower for.
  if (!w.trained || (!meteorAlive() && !summoning())) {
    if (!descend(w)) return;
    // and it waits under the sky rather than wandering off: this is its station,
    // the same as the face of the quarry is a quarrier's
    const d = (w.spot ?? underMeteor()) - w.x;
    if (Math.abs(d) > 1) {
      w.x += Math.sign(d) * Math.min(1.1, Math.abs(d));
      w.y = walkY(w.x + WORKER / 2);
    }
    return;
  }

  // Out to under it first, on the ground, before any of the going up. A wizard
  // that rose from wherever it happened to be standing would be a wizard
  // crossing the yard at four hundred feet, over the rock and the houses.
  if (!w.aloft) {
    const d = (w.spot ?? underMeteor()) - w.x;
    if (Math.abs(d) > 1) {
      w.x += Math.sign(d) * Math.min(1.6, Math.abs(d));
      w.y = walkY(w.x + WORKER / 2);
      return;
    }
    w.aloft = true;
  }

  // Round it goes, whatever else it is doing. The turn is the job -- a wizard
  // parked in the sky is a hat on a stick -- and it carries on while the body is
  // still climbing up to the ring, so it arrives already moving with the rest.

  // What it is working on. A cell is kept until it is gone, so the body is not
  // re-deciding every frame and drifting between two of them. With nothing up
  // there to work, there is nothing to pick: it is here to pour instead.
  if (!meteorAlive()) w.cell = null;
  else if (!w.cell || !cellLeft(w.cell)) {
    // Elbows first, and the bare cells if that leaves nothing: at the end of a
    // meteor there are a handful of cells and everybody's elbows are over all of
    // them, and two of them working shoulder to shoulder on the last of it is
    // better than one of them floating back down to the ground for it.
    w.cell = nextCell(w.x + WORKER / 2, w.y + WORKER / 2, spokenFor(w, true))
          || nextCell(w.x + WORKER / 2, w.y + WORKER / 2, spokenFor(w, false));
    w.next = now + wizMs();
  }
  // Out to the ring the short way: straight away from the middle of the star,
  // from wherever the body happens to be. Never across it -- a wizard given a
  // place on the far side and sent to it in a straight line flew through the
  // star to get there, which is a body inside the thing it is working, four
  // hundred feet up, on fire.
  const mx = w.x + WORKER / 2, my = w.y + WORKER / 2;
  const out = Math.hypot(mx - sky.x, my - sky.y) || 1;
  if (Math.abs(out - orbitR()) > WIZ_RISE) {
    const want = orbitR() / out;
    const tx = sky.x + (mx - sky.x) * want - WORKER / 2;
    const ty = sky.y + (my - sky.y) * want - WORKER / 2;
    const dx = tx - w.x, dy = ty - w.y, d = Math.hypot(dx, dy) || 1;
    w.x += (dx / d) * Math.min(WIZ_RISE, d);
    w.y += (dy / d) * Math.min(WIZ_RISE, d);
    w.next = Math.max(w.next, now + wizMs() / 2);   // no throwing while travelling
    // and it takes its place on the ring from where it got there, so there is
    // nothing to travel round to
    w.orb0 = Math.atan2(my - sky.y, mx - sky.x) - now / 1000 * WIZ_SPIN;
    return;
  }
  if (w.orb0 == null) w.orb0 = Math.atan2(my - sky.y, mx - sky.x) - now / 1000 * WIZ_SPIN;
  spaceOut(w, 1 / 60);

  const to = ringSpot(w, now);
  const tx = to.x - WORKER / 2, ty = to.y - WORKER / 2;
  const dx = tx - w.x, dy = ty - w.y;
  const d = Math.hypot(dx, dy);
  if (d > WIZ_RISE) {
    // along the ring to its own place on it, never through the middle
    w.x += (dx / d) * Math.min(WIZ_RISE, d);
    w.y += (dy / d) * Math.min(WIZ_RISE, d);
    return;
  }

  // On it, and *placed* rather than steered.
  //
  // Its position is its angle: the angle turns smoothly, so the body does. It
  // used to chase a mark that was itself going round -- stepping towards it,
  // snapping on to it when it caught up, and bobbing a couple of pixels a frame
  // on top of that -- and the three of them together read as a body shaking in
  // the sky rather than one orbiting. What is left of the bob is a slow breath
  // in and out along the radius, which is a thing floating rather than a thing
  // vibrating.
  const a = angleOf(w, now);
  const r = orbitR() + Math.sin(now / 1000 * w.sp * 0.5 + w.ph) * WIZ_BOB;
  w.x = sky.x + Math.cos(a) * r - WORKER / 2;
  w.y = sky.y + Math.sin(a) * r - WORKER / 2;

  // Nothing there to work: they are making one. Everybody in the ring pours
  // into the middle for as long as they are up here -- see `summon` -- and the
  // channel is drawn off the same fact.
  if (!meteorAlive()) {
    w.channel = true;
    return;
  }
  w.channel = false;

  // A full pile stops the station, and the sky is a station. What comes off the
  // star lands on the ground under it, and once that ground is heaped as high as
  // it will go there is nowhere for the next cell to land: the ring holds where
  // it is until somebody has carried some away. It is the same rule the rock and
  // the quarry and the plots have, and it is the reason the star's sparks are worth
  // fetching rather than worth ignoring.
  if (S.pileFull.sky) { w.lunge = 0; return; }

  if (now >= w.next && w.cell) {
    fire(w.x + WORKER / 2, w.y + WORKER / 2, w.cell, wizBite());
    w.mined = (w.mined || 0) + wizBite();
    w.lunge = 1;
    w.cell = null;                 // the bolt has it now; pick the next one
    w.next = now + wizMs();
  }
}

// Everybody in the ring, pouring. Called once a frame rather than once a body:
// what it makes is one thing being made by all of them, and a share each would
// be a different mechanic with the same name.
export function stepSummon(dt) {
  if (!summoning()) return;
  const hands = S.workers.filter(w => w.type === 'wizard' && w.aloft && w.channel).length;
  summon(hands, dt / 1000);
}

// whether the cell a body is working on is still there to work on
function cellLeft(cell) {
  return sky.cells && !!sky.cells[cell.r * sky.cols + cell.c];
}

// The cells the rest of them are already on -- and their elbows with them.
//
// A claim is a stretch, not a cell, for the same reason a claim on the muck is:
// a cell is six pixels and a body is eighteen, so booking only the one cell
// somebody is working puts the next body one cell over, which is close enough
// that the two of them hang inside each other for the whole meteor. It is the
// same rule and the same number as `MUCK_ELBOW` on the ground.
const ELBOW = 3;

function spokenFor(w, elbows) {
  const out = new Set();
  for (const o of S.workers) {
    if (o === w || o.type !== 'wizard' || !o.cell) continue;
    if (!elbows) { out.add(o.cell.r * sky.cols + o.cell.c); continue; }
    for (let dr = -ELBOW; dr <= ELBOW; dr++) {
      const r = o.cell.r + dr;
      if (r < 0 || r >= sky.rows) continue;
      for (let dc = -ELBOW; dc <= ELBOW; dc++) {
        const c = o.cell.c + dc;
        if (c < 0 || c >= sky.cols) continue;
        out.add(r * sky.cols + c);
      }
    }
  }
  return out;
}
