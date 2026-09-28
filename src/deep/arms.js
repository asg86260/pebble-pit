// A body in the deep's water, and what the fighters put in it: arrows, palm
// waves, hexes and daggers flying to the coil, charges thrown on the water's
// gravity, charges stuck to the hide ticking down.
//
// Nothing strikes the serpent that a body did not loose or a click did not
// swing: every shot here left a fighter's hands (deep/classes.js says what
// each class looses and what it does when it lands), and this file only
// carries it through the water to the hide. A shot is the water's own and
// no save keeps it: a refresh mid-flight loses it, as it loses a scale in
// the air.
//
// Track FIGHT owns this file (docs/wave-party.md).

import { S } from '../state.js';
import { P, WORKER, SWIM_PACE, DEEP_GRAV } from '../config.js';
import { frames } from '../clock.js';
import { commutePace } from '../levels.js';
import { deepTop, deepFloor, inDeep, coilAt, coilThick, nearestSeg } from './place.js';
import { stepStatuses } from './statuses.js';
import { stepFighter } from './classes.js';

// --- a body in the water ----------------------------------------------------------

export const mid = w => w.x + WORKER / 2;
// Where a body's top stands on the deep's floor: the deep way's feet.
export const feet = () => deepFloor() - WORKER;

// Arrived: not commuting, and down in the deep rather than in the shaft or
// the yard above it.
export const working = w => !w.walking && inDeep(mid(w), w.y + WORKER - 1);

// A body off the floor is held up by the water, the way a seat holds a
// driver: stamped every frame it is up there, so the rules about falling and
// floating (crew/step.js, verify.js rule 9) read it as supported for as long
// as it is swimming and not a frame longer.
export const afloat = w => { if (w.y < feet() - P) w.aboardAt = S.tick; };

// One frame's swim toward a top-left (tx, ty), at a share of the walk.
// True once it is there.
export function swim(w, tx, ty, pace = commutePace() * SWIM_PACE) {
  const step = pace * frames();
  const dx = tx - w.x, dy = ty - w.y, d = Math.hypot(dx, dy);
  if (dx) w.face = dx > 0 ? 1 : -1;
  if (d <= step) { w.x = tx; w.y = ty; afloat(w); return true; }
  w.x += dx / d * step;
  w.y += dy / d * step;
  afloat(w);
  return false;
}

// --- the shots ----------------------------------------------------------------------
// Everything in flight, for the drawing (`shots` in LAYERS) and for the frame.
// A shot:
//
//   kind       'arrow' | 'aimed' | 'palm' | 'chi' | 'hex' | 'dagger' |
//              'charge' (thrown) -- what it is, for the drawing
//   by         the fighter who loosed it
//   x, y       where it is now; vx, vy its motion this frame, px a frame
//   x0, y0     where it left the hand, and `at` when (ms, the game's clock)
//   fly        ms from the hand to the hide, for the ones that fly straight in
//   seg        the segment it is flying to (and stuck to, once stuck)
//   arc        px its path bows up by at the middle of the flight (an arrow)
//   stuck      stuck to the hide, riding the coil; `blowAt` when it goes off
//   land(s, p) what it does on the hide at p: set by the class that loosed it
//
// A straight shot never misses: it flies to where its segment is on each
// frame and is there at `at + fly`. A thrown charge falls on the water's
// gravity from the throw's aim, and goes off where it meets the coil, or
// where it is when it has been in the water twice its aimed time.
export const shots = [];

export function loose(s) {
  shots.push(Object.assign({ vx: 0, vy: 0, arc: 0, stuck: false, blowAt: 0 }, s));
  return s;
}

function stepShots(t) {
  const f = frames();
  let keep = 0;
  for (const s of shots) {
    const px = s.x, py = s.y;
    if (s.stuck) {
      const p = coilAt(s.seg, t);
      s.x = p.x; s.y = p.y;
      s.vx = s.x - px; s.vy = s.y - py;
      // Two stuck together go off together, on the later one's fuse.
      if (t < (s.pair ? s.pair.blowAt : s.blowAt)) { shots[keep++] = s; continue; }
      s.land(s, p);
      continue;
    }
    if (s.kind === 'charge') {
      s.vy += DEEP_GRAV * f;
      s.x += s.vx * f;
      s.y += s.vy * f;
      const near = nearestSeg(s.x, s.y, t);
      const reached = near.d <= coilThick(near.seg) / 2 + P;
      const lost = t - s.at > s.fly * 2 || s.y < deepTop() || s.y > deepFloor();
      if (!reached && !lost) { shots[keep++] = s; continue; }
      s.seg = near.seg;
      s.reached = reached;
      // Landing may stick it rather than set it off: then it rides on.
      if (s.land(s, { x: s.x, y: s.y }) === 'stuck') shots[keep++] = s;
      continue;
    }
    const p = coilAt(s.seg, t);
    const k = Math.min(1, (t - s.at) / s.fly);
    s.x = s.x0 + (p.x - s.x0) * k;
    s.y = s.y0 + (p.y - s.y0) * k - Math.sin(k * Math.PI) * s.arc;
    s.vx = s.x - px; s.vy = s.y - py;
    if (k < 1) { shots[keep++] = s; continue; }
    s.land(s, p);
  }
  shots.length = keep;
}

// The water's own, a frame: the statuses on the serpent run on and bleed,
// and the shots fly. Nothing is in the water before the snatch, and a new
// game (the shots are not on S, so no reset reaches them) starts with none.
export const stepArms = c => {
  if (!S.snatched) { shots.length = 0; return; }
  stepStatuses(c);
  stepShots(c.now);
};

// The five weapon crews' steps, routed to the fighter's: a body of one of the
// retired weapon jobs, tied to a station that names it, fights as that
// station's fighter. CREW's JOBS registry steps TYPE.FIGHTER with
// `stepFighter` directly, and these go with the five rows. until merge
const tied = w => {
  if (!S.stations.some(s => s.id === w.station)) {
    const st = S.stations.find(s => s.fighter === w.name || s.fighter === w.uid);
    w.station = st ? st.id : null;
  }
  return w;
};
export function stepBrawler(w, c) { stepFighter(tied(w), c); }
export function stepLancer(w, c) { stepFighter(tied(w), c); }
export function stepGrenadier(w, c) { stepFighter(tied(w), c); }
export function stepScribe(w, c) { stepFighter(tied(w), c); }
export function stepWarlock(w, c) { stepFighter(tied(w), c); }
