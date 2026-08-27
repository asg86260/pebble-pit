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
// What it does up there is what a miner does on the rock -- one cell off at a
// time, from the outside in -- and what comes off falls the whole way back down
// to the yard, where the haulers deal with it like anything else lying about.

import { P, WORKER, WIZ_MS, WIZ_RISE, WIZ_BOB, WIZ_STANDOFF } from './config.js';
import { S, sky } from './state.js';
import { walkY } from './world.js';
import { meteorAlive, nextCell, takeCell, hoverSpot } from './meteor.js';

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
    cell: null,             // the cell of the meteor it is working on
    next: 0,                // when its next pass at that cell comes due
    goal: 'to',
    ph: Math.random() * Math.PI * 2,        // where in its drift it starts
    sp: 0.4 + Math.random() * 0.5
  };
}

// Where a wizard is trying to be. Off the rind of the meteor beside whatever it
// is working on; or, with nothing to work on, back down on the ground.
function want(w) {
  if (!w.trained || !meteorAlive() || !w.cell) return null;
  return hoverSpot(w.cell, WIZ_STANDOFF + WORKER / 2);
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

  // What it is working on. A cell is kept until it is gone, so the body is not
  // re-deciding every frame and drifting between two of them.
  if (!w.cell || !cellLeft(w.cell)) {
    w.cell = nextCell(w.x + WORKER / 2, w.y + WORKER / 2, spokenFor(w));
    w.next = now + WIZ_MS;
  }
  const to = want(w);
  if (!to) { descend(w); return; }

  // Up, or across, at the pace it floats. Both at once, so it arcs round the
  // meteor rather than going up and then sideways.
  const tx = to.x - WORKER / 2, ty = to.y - WORKER / 2;
  const dx = tx - w.x, dy = ty - w.y;
  const d = Math.hypot(dx, dy);
  if (d > WIZ_RISE) {
    w.x += (dx / d) * WIZ_RISE;
    w.y += (dy / d) * WIZ_RISE;
    if (Math.abs(dx) > 1) w.dir = Math.sign(dx);
    w.next = Math.max(w.next, now + WIZ_MS / 2);   // no working while travelling
    return;
  }

  // There. It hangs, drifting a little, and takes a cell off every so often.
  w.x = tx;
  w.y = ty + Math.sin(now / 1000 * w.sp + w.ph) * WIZ_BOB;
  w.lunge = (w.lunge || 0) * 0.82;
  if (now >= w.next) {
    takeCell(w.cell.c, w.cell.r);
    w.mined = (w.mined || 0) + 1;
    w.lunge = 1;
    w.cell = null;
    w.next = now + WIZ_MS;
  }
}

// whether the cell a body is working on is still there to work on
function cellLeft(cell) {
  return sky.cells && !!sky.cells[cell.r * sky.cols + cell.c];
}

// the cells the rest of them are already on, so nobody picks one twice
function spokenFor(w) {
  const out = new Set();
  for (const o of S.workers)
    if (o !== w && o.type === 'wizard' && o.cell) out.add(o.cell.r * sky.cols + o.cell.c);
  return out;
}
