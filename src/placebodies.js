// REVIEW bodies-
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
//   mid(w)        the body's middle, for the thud it lands with
//   spill(w)      what a shaken body's hands held, put down where it lands
//   landed(w)     back to its work from where it came down
//   assign(w)     a body let go of over a station put on that station's job:
//                 true when it was (crew/pointer.js, `drop`)
//
// The stages are the yard's, in its order (crew/step.js), and the ones that
// are gravity's and the hand's are the yard's own functions (crew/gravity.js):
// a body in the hand is not in the place; a body let go falls before anything
// else (`fallIn`, the place answering as its ground); it sees stars where it
// landed (`stars`); one under the cursor with the right button held walks
// slow (`slowed`); then the place's own stage, then the job.

import { HURL, HURL_MAX } from './config.js';
import { now } from './clock.js';
import { fallIn, stars, slowed } from './crew/gravity.js';

// A frame's seconds, clamped: a background tab's long frame is not a long
// stride for every body.
export const secs = c => Math.min(0.1, Math.max(0, (c.dt || 0) / 1000));

// --- the walks -------------------------------------------------------------------
// A place's walks are the one router's (route.js, `routeIn`, `goIn`, over the
// ways the place supplies). This is only the straight step taken where no
// way is asked: act 3's body found off its floor stepping down onto it
// (after/route.js).
export function walkLine(w, tx, ty, speed, dt) {
  const dx = tx - w.x, dy = ty - w.y, d = Math.hypot(dx, dy);
  const step = speed * dt;
  if (d <= step) { w.x = tx; w.y = ty; return true; }
  w.x += dx / d * step; w.y += dy / d * step;
  if (dx) w.face = dx > 0 ? 1 : -1;
  return false;
}

// --- one frame -------------------------------------------------------------------
export function stepCrew(crew, c) {
  if (!crew.list()) return;
  const dt = crew.dt(c), t = now();
  const f = { dt, ...(crew.begin?.(dt) || {}) };
  const list = crew.list();
  for (let k = 0; k < list.length; k++) {
    const w = list[k];
    crew.tick?.(w, f);
    if (w.lifted) continue;
    // the yard's fall, in sixtieths of a second as its speeds are written
    if (w.falling) { fallIn(w, dt * 60, crew); continue; }
    const seeing = stars(w, t);
    if (seeing === 1) { w.y = crew.land(w).y; continue; }
    if (seeing === 2) { crew.landed(w); continue; }
    if (slowed(w, t)) continue;
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
// written is let go where it was, and falls from there. A place saves its
// bodies whole and the clock starts again with the page, so a stamp on it
// (`now()`) means nothing read back: a slow hover is forgotten, and a body
// seeing stars stands up from them where it was rocking.
export function settleHeld(list) {
  for (const w of list || []) {
    if (!w) continue;
    if (w.lifted) { w.lifted = false; w.falling = true; w.vx = w.vy = 0; }
    delete w.slowUntil; delete w.slowOwed;
    if (w.dizzyUntil) { w.dizzyUntil = 0; if (w.landedAt != null) w.x = w.landedAt; w.landedAt = null; w.say = null; }
    w.dizzyFor = 0;
  }
}
