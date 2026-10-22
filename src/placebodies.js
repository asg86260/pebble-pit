// One body engine for the acts' places: the step, the walks, the hand's
// grab and the fall, over whichever place's own list of bodies.
//
// The yard's crew is `S.workers`, stepped through the stages in crew/step.js.
// Act 3's members (`S.after.bodies`) and hell's ghosts (`S.hell.bodies`) stay
// in their places' own lists, so the yard's rebalance, its haulers-as-leftover
// and its lifespans never reach them; what they share is this file. A place
// hands it a crew (`PLACES[v].crew`, acts.js), which is data and a few
// answers:
//
//   list()        the place's body list, read fresh each frame (a place may
//                 put a new array there when bodies leave it)
//   jobs          the place's JOBS registry, keyed by job, shaped like the
//                 yard's (crew/jobs.js): `step` for every row, and `want` and
//                 `factory` where the place fills its jobs by count
//   dt(c)         the frame's seconds as the place reads them
//   begin(dt)     what the place does before its bodies, handing back the
//                 frame's context (hell's muster and its jobs by order)
//   tick(w, f)    the clocks that run whatever a body is doing
//   stage(w, f, k) a body claimed before its job (on the road in, walking out)
//   idle(w, dt, f) a body whose job has no row
//   end(f)        what the place does after its bodies (a builder's site)
//   spare()       whether a body can be had to fill a job
//   box(w)        where the body is drawn, for the hand
//   pickable(w)   whether the hand may take it (not one drawn somewhere else)
//   hold(w, x, y) the body on the cursor at (x, y)
//   lifted(w)     what a body taken off its walk forgets (its walk, its door)
//   land(w)       the floor under a falling body, and the place's x range
//   landed(w)     what a body that has come down picks up again
//
// The stages are the yard's, in its order (crew/step.js): a body in the hand
// is not in the place; a body let go falls before anything else; then the
// place's own stage, then the job.

import { GRAV, HURL, HURL_MAX, HURL_DRAG, HOVER_SLOW } from './config.js';
import { now } from './clock.js';

// A body under the cursor with the right button held walks slow, as the
// yard's do (crew/step.js): it moves on HOVER_SLOW of the frames and stands
// through the rest. Kept off the body, since a place saves its bodies whole
// and a wall-clock stamp read back after a reload would hold one for ever.
const slow = new WeakMap();
export const slowBody = (w, until) => { slow.set(w, { until, owed: slow.get(w)?.owed || 0 }); };

// A frame's seconds, clamped: a background tab's long frame is not a long
// stride for every body.
export const secs = c => Math.min(0.1, Math.max(0, (c.dt || 0) / 1000));

// --- the walks -------------------------------------------------------------------
// A straight walk toward (tx, ty) at `speed` px/s: true once it stands there.
export function walkLine(w, tx, ty, speed, dt) {
  const dx = tx - w.x, dy = ty - w.y, d = Math.hypot(dx, dy);
  const step = speed * dt;
  if (d <= step) { w.x = tx; w.y = ty; return true; }
  w.x += dx / d * step; w.y += dy / d * step;
  if (dx) w.face = dx > 0 ? 1 : -1;
  return false;
}

// A walk along a way, a list of points [x, y, floor] taken in turn, each leg
// at the pace `speedOf(dx, dy)` gives it, carrying a frame's leftover on to
// the next leg. True once the way is walked.
export function walkWay(b, dt, speedOf) {
  let left = dt;
  while (b.way.length && left > 0) {
    const [tx, ty, tc] = b.way[0];
    const dx = tx - b.x, dy = ty - b.y, d = Math.hypot(dx, dy);
    const speed = speedOf(dx, dy);
    if (d <= speed * left) {
      b.x = tx; b.y = ty; b.c = tc;
      left -= d / speed;
      b.way.shift();
      continue;
    }
    b.x += dx / d * speed * left;
    b.y += dy / d * speed * left;
    if (dx) b.face = dx > 0 ? 1 : -1;
    left = 0;
  }
  return !b.way.length;
}

// --- the fall --------------------------------------------------------------------
// Let go of, a body falls under the yard's gravity with the yard's flick
// (crew/falls.js, `fall`), in sixtieths of a second as those are written, and
// lands on the place's floor under it.
function fall(crew, w, dt) {
  const f = dt * 60, at = crew.land(w);
  if (w.vx) {
    w.x += w.vx * f;
    w.vx *= HURL_DRAG ** f;
    if (w.x < at.x0) { w.x = at.x0; w.vx = -w.vx * 0.4; }
    if (w.x > at.x1) { w.x = at.x1; w.vx = -w.vx * 0.4; }
    if (Math.abs(w.vx) < 0.05) w.vx = 0;
  }
  w.vy = (w.vy || 0) + GRAV * f;
  w.y += w.vy * f;
  const foot = crew.land(w).y;
  if (w.y < foot) return;
  w.y = foot;
  w.vx = w.vy = 0;
  w.falling = false;
  crew.landed?.(w);
}

// --- one frame -------------------------------------------------------------------
export function stepCrew(crew, c) {
  if (!crew.list()) return;
  const dt = crew.dt(c);
  const f = { dt, ...(crew.begin?.(dt) || {}) };
  const list = crew.list();
  for (let k = 0; k < list.length; k++) {
    const w = list[k];
    crew.tick?.(w, f);
    if (w.lifted) continue;
    if (w.falling) { fall(crew, w, dt); continue; }
    const s = slow.get(w);
    if (s && s.until > now()) { s.owed += HOVER_SLOW; if (s.owed < 1) continue; s.owed -= 1; }
    if (crew.stage?.(w, f, k)) continue;
    const row = crew.jobs[w.job];
    if (row) row.step(w, dt, f); else crew.idle(w, dt, f);
  }
  crew.end?.(f);
  fill(crew);
}

// Every row the place fills by count, in the registry's order: a body made
// for each one short, while the place has one to give.
function fill(crew) {
  const list = crew.list();
  for (const [job, row] of Object.entries(crew.jobs)) {
    if (!row.want || !row.factory) continue;
    let short = row.want() - list.reduce((n, b) => n + (b.job === job ? 1 : 0), 0);
    while (short-- > 0 && (!crew.spare || crew.spare())) list.push(row.factory());
  }
}

// --- the hand --------------------------------------------------------------------
// The body under (x, y) in a place's crew, the last drawn first, as the
// yard's `workerAt` asks; `pad` the reach round it.
export function bodyAt(crew, x, y, pad) {
  const list = crew && crew.list();
  if (!list) return null;
  for (let i = list.length - 1; i >= 0; i--) {
    const w = list[i];
    if (w.falling || !crew.pickable(w)) continue;
    const b = crew.box(w);
    if (x < b.x - pad || x > b.x + b.w + pad || y < b.y - pad || y > b.y + b.h + pad) continue;
    return w;
  }
  return null;
}

// Taken up: off its walk, its job kept, so it picks the job up where it lands.
export function liftBody(crew, w) {
  w.lifted = true;
  w.falling = false;
  w.vx = w.vy = 0;
  crew.lifted?.(w);
}

// Let go of, with the hand's flick (`throwVel`), a share of it and capped as
// the yard's are.
export function dropBody(w, v) {
  w.lifted = false;
  w.falling = true;
  w.vx = Math.max(-HURL_MAX, Math.min(HURL_MAX, v.vx * HURL));
  w.vy = Math.max(-HURL_MAX, Math.min(HURL_MAX, v.vy * HURL));
}

// A list read back from a save: a body that was in the hand when it was
// written is let go where it was, and falls from there.
export function settleHeld(list) {
  for (const w of list || []) if (w && w.lifted) { w.lifted = false; w.falling = true; w.vx = w.vy = 0; }
}
