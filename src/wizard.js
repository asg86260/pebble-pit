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

import { P, WORKER, WIZ_MS, WIZ_RISE, WIZ_BOB, WIZ_SPIN } from './config.js';
import { S, sky } from './state.js';
import { walkY } from './world.js';
import { meteorAlive, nextCell, fire, orbitR } from './meteor.js';

// The ground under the meteor: where a wizard walks to before it goes anywhere
// near the sky, and where it comes back down to.
export const underMeteor = () => sky.x - WORKER / 2;

export function newWizard() {
  // Its own spot on the ground under the meteor, a few cells either side of the
  // middle of it. They go up from where they are standing, so a gang given one
  // column between them would rise as a single body four deep.
  const x = underMeteor() + Math.round((Math.random() - 0.5) * 6) * P;
  return {
    type: 'wizard', x, spot: x, y: walkY(x + WORKER / 2),
    aloft: false,           // whether its feet are off the ground
    orb0: null,             // its place on the ring round the star, once it has one
    cell: null,             // the cell of the meteor it is working on
    next: 0,                // when its next pass at that cell comes due
    goal: 'to',
    ph: Math.random() * Math.PI * 2,        // where in its drift it starts
    sp: 0.4 + Math.random() * 0.5
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

// Somewhere on the ring nobody else is on: the middle of the widest gap. They
// all turn at the same rate, so a gap in the places they were given is a gap for
// as long as they are up there.
function freeAngle() {
  const taken = S.workers.filter(o => o.type === 'wizard' && o.orb0 != null)
                         .map(o => ((o.orb0 % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2))
                         .sort((a, b) => a - b);
  if (!taken.length) return Math.random() * Math.PI * 2;
  let best = taken[0] + Math.PI, gap = -1;
  for (let i = 0; i < taken.length; i++) {
    const next = i + 1 < taken.length ? taken[i + 1] : taken[0] + Math.PI * 2;
    if (next - taken[i] > gap) { gap = next - taken[i]; best = (taken[i] + next) / 2; }
  }
  return best;
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

export function stepWizard(w, now) {
  // No hat, no flying. The hat is the job -- see the tower -- so a body put on
  // this before the tower has finished one stands under the meteor and waits for
  // it, which is exactly what `stepKit` is already walking it to the tower for.
  if (!w.trained || !meteorAlive()) {
    if (!descend(w)) return;
    // and it waits under the sky rather than wandering off: this is its station,
    // the same as the face of the cut is a quarrier's
    const d = (w.spot ?? underMeteor()) - w.x;
    if (Math.abs(d) > 1) {
      w.x += Math.sign(d) * Math.min(1.1, Math.abs(d));
      w.dir = Math.sign(d);
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
      w.dir = Math.sign(d);
      w.y = walkY(w.x + WORKER / 2);
      return;
    }
    w.aloft = true;
  }

  // Round it goes, whatever else it is doing. The turn is the job -- a wizard
  // parked in the sky is a hat on a stick -- and it carries on while the body is
  // still climbing up to the ring, so it arrives already moving with the rest.
  if (w.orb0 == null) w.orb0 = freeAngle() - now / 1000 * WIZ_SPIN;

  // What it is working on. A cell is kept until it is gone, so the body is not
  // re-deciding every frame and drifting between two of them.
  if (!w.cell || !cellLeft(w.cell)) {
    // Elbows first, and the bare cells if that leaves nothing: at the end of a
    // meteor there are a handful of cells and everybody's elbows are over all of
    // them, and two of them working shoulder to shoulder on the last of it is
    // better than one of them floating back down to the ground for it.
    w.cell = nextCell(w.x + WORKER / 2, w.y + WORKER / 2, spokenFor(w, true))
          || nextCell(w.x + WORKER / 2, w.y + WORKER / 2, spokenFor(w, false));
    w.next = now + WIZ_MS;
  }
  const to = ringSpot(w, now);
  const tx = to.x - WORKER / 2, ty = to.y - WORKER / 2;
  const dx = tx - w.x, dy = ty - w.y;
  const d = Math.hypot(dx, dy);

  // Up to the ring, at the pace it floats. Both directions at once, so it curves
  // in and joins the turn rather than going up and then sideways.
  if (d > WIZ_RISE) {
    w.x += (dx / d) * WIZ_RISE;
    w.y += (dy / d) * WIZ_RISE;
    if (Math.abs(dx) > 1) w.dir = Math.sign(dx);
    w.next = Math.max(w.next, now + WIZ_MS / 2);   // no throwing while travelling
    return;
  }

  // On it. It rides its place round the star, drifting a little, and throws
  // every so often at whatever it has picked.
  w.x = tx;
  w.y = ty + Math.sin(now / 1000 * w.sp + w.ph) * WIZ_BOB;
  w.dir = Math.cos(angleOf(w, now)) > 0 ? -1 : 1;  // facing what it is circling
  w.lunge = (w.lunge || 0) * 0.82;
  if (now >= w.next && w.cell) {
    fire(w.x + WORKER / 2, w.y + WORKER / 2, w.cell);
    w.mined = (w.mined || 0) + 1;
    w.lunge = 1;
    w.cell = null;                 // the bolt has it now; pick the next one
    w.next = now + WIZ_MS;
  }
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
