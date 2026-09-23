// The wizard: the one body in this yard whose feet leave the ground. It walks
// under the meteor like anybody, then goes *up*, a pixel and a bit a frame,
// slow on purpose: a body that got there instantly would have teleported with
// a hat on. Up there it rides a ring round the star and throws bolts at it,
// the one thing in the yard allowed to happen at range.

import { P, WORKER, WIZ_MS, WIZ_RISE, WIZ_BOB, WIZ_SPIN, WIZ_DASH, WIZ_DASH_EASE,
         WIZ_REACH, WIZ_TRAIL_MS, WIZ_TRAIL_LIFE } from './config.js';
import { frames } from './clock.js';
import { S, sky } from './state.js';
import { STEP } from './mult.js';
import { walkY } from './world.js';
import { meteorAlive, nextCell, fire, orbitR, summoning, summon, sparkle } from './meteor.js';
import { domeRising, domeSpot, domeOrbitR, pourDome } from './shield.js';
import { rand } from './rng.js';
import { critRoll } from './crit.js';
import { critBoost, speedBoost, strengthBoost, doseComing } from './apothecary.js';
import { TYPE } from './jobs.js';
import { sphereRising, sphereUp, pourSphere } from './sphere.js';

// The ground under the meteor: where a wizard walks to before it goes up, and
// comes back down to.
export const underMeteor = () => sky.x - WORKER / 2;

// Whether this wizard is at the tower: in the ring, or on the ground under it
// with its walk done. A body, not an assignment, or a hat rung finishes for a
// wizard still out across the yard.
export const atTower = w =>
  w.aloft || (!w.walking && Math.abs((w.spot ?? underMeteor()) - w.x) <= WORKER);

// The spots a wizard may go up from, a few cells either side of the middle
// and two cells apart: a body is three cells wide, so neighbors one cell
// apart rise as one smudge.
const SPOTS = [-4, -2, 0, 2, 4];

export function newWizard() {
  // Its own spot: they go up from where they stand, and two on one cell would
  // rise as a single body. A spot another wizard holds is not drawn while a
  // free one is left.
  const held = new Set(S.workers.filter(w => w.type === TYPE.WIZARD).map(w => w.spot));
  const at = d => underMeteor() + d * P;
  const free = SPOTS.filter(d => !held.has(at(d)));
  const pick = free.length ? free : SPOTS;
  const x = at(pick[Math.floor(rand() * pick.length)]);
  return {
    type: TYPE.WIZARD, x, spot: x, y: walkY(x + WORKER / 2),
    aloft: false,           // whether its feet are off the ground
    orb0: null,             // its place on the ring round the star, once it has one
    cell: null,             // the cell of the meteor it is working on
    next: 0,                // when its next pass at that cell comes due
    goal: 'to',
    ph: rand() * Math.PI * 2,        // where in its drift it starts
    sp: 0.4 + rand() * 0.5
  };
}

// Its place on the ring this instant: each keeps its own angle.
const angleOf = (w, now) => w.orb0 + now / 1000 * WIZ_SPIN;

// What the ring is around: the star, or the dome while one is rising, a small
// halo over the crown of the thing they are pouring (shield.js).
const ringMid = () => domeRising() ? domeSpot() : { x: sky.x, y: sky.y };
const ringR = () => domeRising() ? domeOrbitR() : orbitR();

function ringSpot(w, now) {
  const a = angleOf(w, now);
  const c = ringMid();
  return { x: c.x + Math.cos(a) * ringR(),
           y: c.y + Math.sin(a) * ringR() };
}

// How far apart they keep on the ring, in radians: bodies all arrive at the
// foot of it, and without this they would ride round in a heap.
const APART = Math.PI / 3;

// They arrive where they arrive and then push apart, each frame leaning away
// from whoever is nearest, where you can watch it.
function spaceOut(w, secs) {
  let push = 0;
  for (const o of S.workers) {
    if (o === w || o.type !== TYPE.WIZARD || o.orb0 == null || !o.aloft) continue;
    let d = (o.orb0 - w.orb0) % (Math.PI * 2);
    if (d > Math.PI) d -= Math.PI * 2;
    if (d < -Math.PI) d += Math.PI * 2;
    if (Math.abs(d) >= APART) continue;
    push -= Math.sign(d || 1) * (APART - Math.abs(d));
  }
  w.orb0 += push * secs;
}

// A flying body sheds a speck of its own light every so often: the one thing
// that says it is carried rather than standing. The same specks as the bolts'
// (`sparkle` in meteor.js).
function trail(w, now) {
  if (now < (w.trailAt || 0)) return;
  // Specks by the pixel rather than by the clock, so a body flat out across
  // the yard leaves a streak instead of dots forty pixels apart.
  const gait = Math.max(1, (w.pace || WIZ_RISE) / WIZ_RISE);
  w.trailAt = now + WIZ_TRAIL_MS / gait * (0.7 + rand() * 0.6);
  sparkle(w.x + WORKER / 2 + (rand() - 0.5) * P * 2, w.y + WORKER - P / 2,
          (rand() - 0.5) * 0.3,
          0.15 + rand() * 0.25,      // it sinks: it is falling out of the spell
          WIZ_TRAIL_LIFE);
}

// A body taken off the sky, on its way down under its own hat rather than
// under gravity. Returns true once its feet are on the ground; the crew loop
// holds everything else off until then (`retask`).
export function floatDown(w) {
  const foot = walkY(w.x + WORKER / 2);
  w.aloft = w.y < foot;
  if (w.y >= foot) {
    w.y = foot; w.floating = false; w.aloft = false;
    return true;
  }
  w.y = Math.min(foot, w.y + WIZ_RISE * 1.6 * frames());   // pixels a frame
  return false;
}

// A body coming down: a wizard stood down mid-air lands before it does
// anything else, because there is no job you do from up there.
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

// A body coming down for its dose: a glide to its own spot on the ground, not
// straight down from wherever on the ring it was, since the far side of the
// ring can be over a roof or the hole.
function landForDose(w) {
  const foot = walkY(w.x + WORKER / 2);
  const d = (w.spot ?? underMeteor()) - w.x;
  const pace = WIZ_RISE * 2 * frames();
  w.cell = null; w.channel = false; w.pace = pace / frames();
  if (Math.abs(d) > 1) w.x += Math.sign(d) * Math.min(pace, Math.abs(d));
  if (w.y >= foot && Math.abs(d) <= 1) { w.y = foot; w.aloft = false; w.pace = 0; return; }
  w.y = Math.min(foot, w.y + pace);
  w.aloft = w.y < foot;
}

export function stepWizard(w, now) {
  if (w.aloft) trail(w, now);

  // A stirrer is on its way with a dose (`doseComing`), and a body on the ring
  // cannot be handed anything. Not mid-dome: the pour is not dropped for a
  // drink, and the stirrer waits it out.
  if (doseComing(w) && !domeRising()) { landForDose(w); return; }

  // No hat, no flying: a body put on this before the tower has finished one
  // waits under the meteor.
  if (!w.trained || (!meteorAlive() && !summoning() && !domeRising())) {
    if (!descend(w)) return;
    // and it waits under the sky rather than wandering off: this is its station
    const d = (w.spot ?? underMeteor()) - w.x;
    if (Math.abs(d) > 1) {
      w.x += Math.sign(d) * Math.min(1.1, Math.abs(d));
      w.y = walkY(w.x + WORKER / 2);
    }
    return;
  }

  // Out to under it on the ground first, or it crosses the yard at four
  // hundred feet. The dome is the exception: it lifts off where it stands and
  // flies there low, since a wizard that walked to it arrived after the rock.
  if (!w.aloft) {
    const d = (w.spot ?? underMeteor()) - w.x;
    if (!domeRising() && Math.abs(d) > 1) {
      w.x += Math.sign(d) * Math.min(1.6, Math.abs(d));
      w.y = walkY(w.x + WORKER / 2);
      return;
    }
    w.aloft = true;
  }

  // What it is working on: a cell is kept until it is gone, so the body is not
  // drifting between two of them. Nothing to pick while it is here to pour.
  // Nor while the shell is poured or standing: nobody throws at a star under
  // a sphere.
  if (domeRising() || !meteorAlive() || sphereRising() || sphereUp()) w.cell = null;
  else if (!w.cell || !cellLeft(w.cell)) {
    // Elbows first, and the bare cells if that leaves nothing: at the end of a
    // meteor everybody's elbows are over all of it.
    w.cell = nextCell(w.x + WORKER / 2, w.y + WORKER / 2, spokenFor(w, true))
          || nextCell(w.x + WORKER / 2, w.y + WORKER / 2, spokenFor(w, false));
    w.next = now + wizMs();
  }
  // Out to the ring straight away from the middle, never across it: a wizard
  // sent to the far side in a straight line flew through the star.
  const mid = ringMid();
  const mx = w.x + WORKER / 2, my = w.y + WORKER / 2;
  const out = Math.hypot(mx - mid.x, my - mid.y) || 1;
  // A body is on the ring if it is within a stride of anywhere its own breath
  // can put it: the bob below swings it `WIZ_BOB` in and out, and measured
  // against the stride alone a wizard at the top of a breath read as off the
  // ring, spent a frame floating back with its channel dropped, and was placed
  // again -- pouring at a fraction of its rate for as long as its breath
  // peaked past the line (test/sky-work.test.mjs).
  if (Math.abs(out - ringR()) > WIZ_RISE + WIZ_BOB) {
    const want = ringR() / out;
    const tx = mid.x + (mx - mid.x) * want - WORKER / 2;
    const ty = mid.y + (my - mid.y) * want - WORKER / 2;
    const dx = tx - w.x, dy = ty - w.y, d = Math.hypot(dx, dy) || 1;
    // The climb to the star is slow on purpose; the flight to the dome is flat
    // out, easing off over the last stretch so it settles onto the ring.
    const pace = (domeRising() ? Math.min(WIZ_DASH, Math.max(WIZ_RISE, d / WIZ_DASH_EASE))
                               : WIZ_RISE) * frames();
    w.pace = pace / frames();
    w.x += (dx / d) * Math.min(pace, d);
    w.y += (dy / d) * Math.min(pace, d);
    // Pouring starts on the way in, once the dome is within reach.
    w.channel = domeRising() && d < WIZ_REACH;
    w.next = Math.max(w.next, now + wizMs() / 2);   // no throwing while travelling
    // it takes its place on the ring from where it got there
    w.orb0 = Math.atan2(my - mid.y, mx - mid.x) - now / 1000 * WIZ_SPIN;
    return;
  }
  if (w.orb0 == null) w.orb0 = Math.atan2(my - mid.y, mx - mid.x) - now / 1000 * WIZ_SPIN;
  w.pace = 0;
  spaceOut(w, 1 / 60);

  const to = ringSpot(w, now);
  const tx = to.x - WORKER / 2, ty = to.y - WORKER / 2;
  const dx = tx - w.x, dy = ty - w.y;
  const d = Math.hypot(dx, dy);
  if (d > WIZ_RISE) {
    // along the ring to its own place on it, never through the middle
    const pace = WIZ_RISE * frames();
    w.x += (dx / d) * Math.min(pace, d);
    w.y += (dy / d) * Math.min(pace, d);
    return;
  }

  // On it, and *placed* rather than steered: its position is its angle, so it
  // turns smoothly. The bob is a slow breath along the radius; a body chasing
  // a moving mark and bobbing on top read as shaking, not orbiting.
  const a = angleOf(w, now);
  const r = ringR() + Math.sin(now / 1000 * w.sp * 0.5 + w.ph) * WIZ_BOB;
  w.x = mid.x + Math.cos(a) * r - WORKER / 2;
  w.y = mid.y + Math.sin(a) * r - WORKER / 2;

  // Nothing there to work: everybody in the ring pours into the middle
  // (`summon`), and the channel is drawn off the same fact. The shell is the
  // same: poured into while it rises (`pourSphere`), tended once it stands
  // (`tenderFor` in crew/tenders.js reads the channel).
  if (domeRising() || !meteorAlive() || sphereRising() || sphereUp()) {
    w.channel = true;
    return;
  }
  w.channel = false;

  // A full pile stops the station, and the sky is a station: the ring holds
  // until somebody has carried some away.
  if (S.pileFull.sky) { w.lunge = 0; return; }

  if (now >= w.next && w.cell) {
    // The star is a bounded job, so a crit PULLS FORWARD: a cluster of cells
    // in one strike (`nearestLive` in meteor.js). The strong brew pays out
    // here because the bite is the one per-body step in a wizard's yield.
    const bite = wizBite() * critRoll(critBoost(w)) * strengthBoost(w);
    fire(w.x + WORKER / 2, w.y + WORKER / 2, w.cell, bite);
    w.mined = (w.mined || 0) + bite;
    w.lunge = 1;
    w.cell = null;                 // the bolt has it now; pick the next one
    w.next = now + wizMs() / speedBoost(w);
  }
}

// Everybody in the ring, pouring. Once a frame rather than once a body: it
// is one thing being made by all of them.
export function stepSummon(dt) {
  const hands = S.workers.filter(w => w.type === TYPE.WIZARD && w.aloft && w.channel).length;
  // The dome first: while one is rising every channel pours into it.
  if (domeRising()) { pourDome(hands, dt / 1000); return; }
  if (sphereRising()) { pourSphere(hands, dt / 1000); return; }
  if (!summoning()) return;
  summon(hands, dt / 1000);
}

// whether the cell a body is working on is still there to work on
function cellLeft(cell) {
  return sky.cells && !!sky.cells[cell.r * sky.cols + cell.c];
}

// A claim is a stretch, not a cell: a cell is six pixels and a body is
// eighteen, so booking one cell puts the next body inside this one. The same
// number as `MUCK_ELBOW` on the ground.
const ELBOW = 3;

function spokenFor(w, elbows) {
  const out = new Set();
  for (const o of S.workers) {
    if (o === w || o.type !== TYPE.WIZARD || !o.cell) continue;
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
