// The shock a crit leaves behind: one ring and a scatter of specks. Neither is
// dust and neither is counted: one grain is one dust and the pile is the dust,
// so anything drawn for effect has to be plainly not a grain. The ring is an
// outline nothing else has, and the specks wink out without landing.
//
// Not grit: grit has gravity on it and dies at the ground line, and a crit
// happens down the cut as well, where a quarrier stands well below the line
// and every speck would be culled the frame it was thrown. A leaf for the
// same reason `grit.js` and `puff.js` are.

import { P, CRIT_RING_MS, CRIT_RING_R, CRIT_MOTES,
         CRIT_MOTE_LIFE, CRIT_MOTE_SPEED, CRIT_MOTE_DRAG } from './config.js';
import { S } from './state.js';
import { rockTop } from './route.js';
import { now } from './clock.js';
import { rand } from './rng.js';

// One crit landing. `power` is the crit's multiplier, and everything here is
// measured in it.
//
// One blow, one shock: `critToss` is called once per grain the crit turned up,
// from a different cell each time at the rock, so the guard is the same
// *frame* at the same *place of work* (`where`, the pile key, which no two
// stations share). Two bodies critting at one station inside a sixtieth of a
// second land one ring between them, which is the right side to err on.
//
// `wave` is for a ring that is not a crit's (shield.js, `fanfare`): `ms` how
// long it runs, `r` how far it reaches, `color` for the dome. Left off, it is
// the crit's ring, measured in the crit's power.
export function shockAt(x, y, power = 3, where = '', wave = null) {
  const at = now();
  const last = S.shocks[S.shocks.length - 1];
  if (last && last.at === at && last.where === where) return;
  S.shocks.push({ x, y, at, power, where, t: 0, ...(wave || {}) });
  for (let i = 0; i < Math.round(CRIT_MOTES * power); i++) {
    // Spread by the loop rather than by chance, so a burst is always a ring of
    // specks instead of occasionally a clump on one side.
    const a = (i + rand()) / Math.round(CRIT_MOTES * power) * Math.PI * 2;
    const v = CRIT_MOTE_SPEED * (0.6 + rand() * 0.8);
    S.shockMotes.push({
      x: x + Math.cos(a) * P, y: y + Math.sin(a) * P,
      vx: Math.cos(a) * v, vy: Math.sin(a) * v,
      t: 0, life: CRIT_MOTE_LIFE * (0.7 + rand() * 0.6), color: wave && wave.color
    });
  }
  S.dirty = true;
}

// `dt` arrives in MILLISECONDS like every other stepper; taken for seconds a
// ring ages a thousand times over inside one frame (see `stepGrit`).
const FRAME = 1000 / 60;    // what "per frame" means, for the thrown velocities

export function stepShocks(dt) {
  const secs = dt / 1000, frames = dt / FRAME;
  for (let i = S.shocks.length - 1; i >= 0; i--) {
    const s = S.shocks[i];
    s.t += secs;
    if (s.t * 1000 >= (s.ms || CRIT_RING_MS)) S.shocks.splice(i, 1);
  }
  for (let i = S.shockMotes.length - 1; i >= 0; i--) {
    const m = S.shockMotes[i];
    m.t += secs;
    if (m.t > m.life) { S.shockMotes.splice(i, 1); continue; }
    m.x += m.vx * frames;
    m.y += m.vy * frames;
    // A speck that has reached the ground is on the ground.
    if (m.y >= rockTop(m.x)) { S.shockMotes.splice(i, 1); continue; }
    // The blow spends itself: a speck leaves fast and is barely moving by the
    // time it goes, so the burst reads as one push outward.
    const drag = Math.pow(CRIT_MOTE_DRAG, frames);
    m.vx *= drag;
    m.vy *= drag;
  }
  if (S.shocks.length || S.shockMotes.length) S.dirty = true;
}

// How far through its run a ring is, nought to one: what the drawing is a
// function of.
export const shockAge = s => Math.min(1, (s.t * 1000) / (s.ms || CRIT_RING_MS));

// How far it has got, in world pixels, per point of the crit's multiplier.
// Eased out hard, most of the reach in the first third, because a blow spends
// itself at once; a ring that grows evenly reads as an announcement.
export const shockReach = s => {
  const k = shockAge(s);
  return (s.r || CRIT_RING_R * s.power) * (1 - Math.pow(1 - k, 3));
};
