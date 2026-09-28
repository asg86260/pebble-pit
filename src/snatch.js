// The second half's first beat, and its last: the snatch and the freeing
// (DESIGN.md, "The serpent: the second half of the game"; docs/wave-serpent.md,
// "The story").
//
// The snatch needs two facts, the sqwife out and the pit drowned, which come
// on their own clocks; it plays on whichever comes second (`snatchDue`, read
// by its row in beats.js). Two of the crew nearest the mouth are taken off it
// for the length of the beat and walked as `S.pair`, the reunion's own
// drawing: out to the plank, where a portal opens in the abyss's own surface
// -- a whirlpool turning on the liquid -- and something comes up out of it a
// cell a frame, takes the one nearer the water and goes back down. The
// portal starts to close, and the one left standing runs and leaps into it
// before it shuts: she is the deep's whole crew, the first station's fighter
// once it stands, sinking to its floor under the portal (DESIGN.md, "Two crews and a
// portal"). Nobody else ever crosses.
//
// The freeing is the fourth defense broken (deep/serpent.js sets the flag):
// the belly opens, he comes out of it and is one of the deep's crew, a spare
// hand down there.
//
// `S.snatch` is the beat's state while it plays, and what the drawing reads:
// `{ phase, at, headY, carried, portal }` -- the phase, when it began, the
// world y of the top of the head, whether he is in its jaws, and how open
// the portal is (0..1). Nothing about it is
// saved; a reload plays the beat again from the start, or, past the take,
// from the surface closing (`startSnatch`).

import { P, WORKER, COMMUTE_PACE, CORE_SIZE, INTRO_BEAT,
         SNATCH_RISE, SNATCH_EDGE, SNATCH_LOOK_MS, SNATCH_TAKE_MS, SNATCH_CLOSE_MS,
         SNATCH_HURRY, FREED_OPEN_MS, SNATCH_PORTAL_MS, SNATCH_LEAP_AT, SNATCH_LEAP_MS, SNATCH_LEAP_H,
         DEEP_SURFACE, SERPENT_ON } from './config.js';
import { S } from './state.js';
import { frames } from './clock.js';
import { mouthX, bellyAt, deepTop } from './deep/place.js';
import { abyssLine } from './pit.js';
import { walkY, lookAt } from './world.js';
import { spawnChip, bell } from './dust.js';
import { rebalance, JOBS } from './staffing.js';
import { syncWorkers, retask, FACTORY, newRecord, unbook } from './crew.js';
import { belowYard } from './route.js';
import { onYard } from './crew/body.js';
import { TYPE, JOB_OF } from './jobs.js';
import { beatDone } from './beats.js';

// --- whether ---------------------------------------------------------------------
// The half is played by a dev build and the node yard (which has no
// `import.meta.env`), and by a released build only when the switch is on.
// A check can say either way for itself.
const DEV_BUILD = !import.meta.env || !!import.meta.env.DEV;
let forced = null;
export function serpentOn() { return forced ?? (SERPENT_ON || DEV_BUILD); }
export function forceSerpent(on) { forced = on; }

// --- when -------------------------------------------------------------------------
// Both facts, the ending's sheet put down (the rescue's own beat and its
// sheet come first when the rescue is the second fact, and the snatch takes
// the second dance's place), and no scene on the camera (the drowning's, when
// the drowning is the second fact: the snatch plays when it has finished).
// Every function beats.js names is a declaration, not a const: beats.js reads
// them at load and imports this file in a ring.
export function snatchDue() {
  return serpentOn() && S.rescued && S.drowned && beatDone('ending') && !S.beat.camera;
}

// Where each of the two stands at the edge: the one it takes nearest the
// water, at the head of the shaft itself.
const edgeX = i => i === 1 ? mouthX() : mouthX() - WORKER - SNATCH_EDGE;
const onPlank = x => walkY(x + WORKER / 2);

// Taken off the crew for the beat: the `n` bodies nearest the mouth that are
// out in the yard and free to walk over. Their loads go on the ground and
// their claims go back, as for any body stood down (`syncWorkers`); the count
// goes with them, so the crew is not made up again behind them.
function takeOff(n) {
  const mx = mouthX();
  // Stood on the yard's own floor, so the walk to the edge starts from the
  // ground it is walked on: not on the hill, not down the cut.
  const free = w => !w.lifted && !w.falling && !w.aloft && !w.craft && !w.inside
                 && !w.lentFrom && w.type !== TYPE.BUILD && onYard(w)
                 && Math.abs(w.y - onPlank(w.x)) < 1;
  let pool = S.workers.filter(free);
  if (pool.length < n) pool = S.workers.filter(w => !w.lifted && !w.craft && !belowYard(w));
  const took = pool.sort((a, b) => Math.abs(a.x - mx) - Math.abs(b.x - mx)).slice(0, n);
  for (const w of took) {
    for (let i = 0; i < (w.carry || 0); i++)
      spawnChip(w.x + WORKER / 2, S.groundY - WORKER, bell() * 0.5, -1.2, w.load?.[i] || 1);
    if (w.hasCore) {
      S.coreItem = { x: w.x, y: S.groundY - CORE_SIZE, vx: 0, vy: -1, rest: false };
      if (S.coreTaker === w) S.coreTaker = null;
    }
    w.carry = 0;
    w.load = [];
    w.hasCore = false;
    w.claim = -1;
    unbook(w);
    const job = JOB_OF[w.type];
    if (JOBS.includes(job) && S[job] > 0) S[job]--;
    S.workers.splice(S.workers.indexOf(w), 1);
    S.crew--;
  }
  rebalance();
  syncWorkers();
  return took;
}

// --- the beat ---------------------------------------------------------------------
export function startSnatch(t) {
  S.introCut = false;
  S.introSaid = 0;
  // Past the take (a reload after he went under): only the one left standing
  // is off the crew, and the beat is the surface closing over him.
  const after = !!S.snatched;
  const took = takeOff(after ? 1 : 2);
  // Nearest first, so the one nearer the water is the one taken.
  took.reverse();
  S.pair = took.map(w => ({ x: w.x, y: w.y, say: null, body: w }));
  const surface = abyssLine();
  S.snatch = { phase: after ? 'close' : 'walk', at: t, headY: surface, carried: after, hurry: 1,
               him: null, stood: null, portal: after ? 1 : 0 };
  lookAt(mouthX() + WORKER / 2);
}

// The space bar. Nothing is cut to its end -- a body at the edge one frame
// and gone the next is the one thing this game never shows -- so what is left
// of the beat plays faster, the take included, and the beat carries on.
export function cutSnatch() {
  if (S.introCut || !S.snatch) return false;
  S.introCut = true;
  S.snatch.hurry = SNATCH_HURRY;
  return false;
}

// One frame: true while there is more of it.
export function stepSnatch(t) {
  const s = S.snatch;
  if (!s) return false;
  for (const b of S.pair) if (b.say && t >= b.say.until) b.say = null;
  const f = frames() * s.hurry;
  const held = ms => t - s.at >= ms / s.hurry;
  const surface = abyssLine();
  const next = phase => { s.phase = phase; s.at = t; };

  if (s.phase === 'walk') {
    // Out to the plank at the pace anybody crosses the yard at, a little
    // apart, and stood at its edge looking in; one of them says so.
    let there = true;
    for (const [i, b] of S.pair.entries()) {
      const d = edgeX(S.pair.length === 1 ? 1 : i) - b.x;
      if (Math.abs(d) > 1) { b.x += Math.sign(d) * Math.min(COMMUTE_PACE * f, Math.abs(d)); there = false; }
      else b.x = edgeX(S.pair.length === 1 ? 1 : i);
      // Feet to the floor at the same pace, for one taken off the hill.
      const up = onPlank(b.x) - b.y;
      b.y += Math.sign(up) * Math.min(COMMUTE_PACE * f, Math.abs(up));
      if (Math.abs(up) > 1) there = false;
    }
    if (!there) { s.stood = null; return true; }
    s.stood ??= t;
    if (t >= (S.introSaid || 0) && S.pair[0]) {
      S.introSaid = t + INTRO_BEAT * 1.4;
      S.pair[0].say = { mark: 'dots', n: 3, until: t + INTRO_BEAT };
    }
    if (t - s.stood >= SNATCH_LOOK_MS / s.hurry) next('open');
    return true;
  }
  if (s.phase === 'open') {
    // The portal opens in the surface before anything comes out of it.
    s.portal = Math.min(1, (t - s.at) / (SNATCH_PORTAL_MS / s.hurry));
    if (s.portal >= 1) next('rise');
    return true;
  }
  if (s.phase === 'rise') {
    // Up out of the surface a cell a frame, never popped in.
    s.headY = Math.max(surface - SNATCH_RISE, s.headY - P * f);
    if (s.headY <= surface - SNATCH_RISE) {
      next('take');
      s.carried = true;
      // He is in its jaws now, drawn there off `S.snatch`, not as one of the
      // pair; the one left says what anybody would.
      s.him = S.pair.length > 1 ? S.pair.pop() : null;
      if (S.pair[0]) S.pair[0].say = { mark: 'bang', until: t + SNATCH_TAKE_MS + SNATCH_CLOSE_MS / 2 };
    }
    return true;
  }
  if (s.phase === 'take') {
    if (held(SNATCH_TAKE_MS)) next('sink');
    return true;
  }
  if (s.phase === 'sink') {
    // And back down the same way, with him, until the both of them are under.
    s.headY = Math.min(surface + WORKER, s.headY + P * f);
    if (s.headY >= surface + WORKER) {
      S.snatched = true;               // the crew is one fewer: he is not given back
      S.shopStale = true;              // the deep's boards stand from here
      next('close');
    }
    return true;
  }
  // 'close': the portal closing over him, and the one left at the edge
  // running and leaping in before it shuts -- an arc from where she stands to
  // the whirlpool's middle, and under.
  const k = Math.min(1, (t - s.at) / (SNATCH_CLOSE_MS / s.hurry));
  s.portal = 1 - k;
  const b = S.pair[0];
  if (b && k >= SNATCH_LEAP_AT) {
    b.leap ??= { x: b.x, y: b.y };
    const j = Math.min(1, (k - SNATCH_LEAP_AT) * SNATCH_CLOSE_MS / SNATCH_LEAP_MS);
    const tx = mouthX() - WORKER / 2, ty = surface;
    b.x = b.leap.x + (tx - b.leap.x) * j;
    b.y = b.leap.y + (ty - b.leap.y) * j - Math.sin(j * Math.PI) * SNATCH_LEAP_H;
    if (j >= 1) b.under = true;
    b.say = null;
  }
  if (k < 1) return true;
  giveBack();
  return false;
}

// The one who leapt is one of the crew again, as the rescue's body was, and
// the deep's whole crew: she comes down through the liquid under the portal
// and sinks to the deep's floor (crew/falls.js, `sink`), and treads water
// there until the first station stands, then swims to it as its fighter.
// She is the deep's first body, living in its first pod, and the only one
// until another is built.
function giveBack() {
  const b = S.pair[0];
  const w = b?.body || (b && Object.assign(FACTORY(TYPE.HAUL), newRecord()));
  S.pair = [];
  S.snatch = null;
  if (!w) return;
  S.crew++;
  S.deepCrew = (S.deepCrew || 0) + 1;
  // Her home down there: the deep's first pod is hers, standing from the
  // start, so the pods sell the second.
  S.pods = Math.max(1, S.pods || 0);
  // A spare hand down there until a station stands for her: the first one
  // is free, and she is its fighter once it does (`seatUpTo`, deep/party.js).
  rebalance();
  retask(w, TYPE.GATHER);
  w.say = null;
  w.x = mouthX() - WORKER / 2;
  w.y = deepTop() + DEEP_SURFACE + P * 2;
  w.walking = false;
  w.route = null;
  w.falling = true;
  w.vx = 0;
  w.vy = 0;
  S.workers.push(w);
  syncWorkers();
  S.shopStale = true;
}

// The bodies held off the crew while the snatch plays, where they stand, for
// the save (`SAVE` in crew/records.js): written as ordinary hands of the crew
// on the plank, so a reload has them back where they were and the beat, played
// again, takes them from there.
export const heldBodies = () =>
  S.snatch ? S.pair.filter(b => b.body).map(b => ({ w: b.body, x: b.x, y: b.y })) : [];

// --- the freeing ------------------------------------------------------------------
// The belly opens for FREED_OPEN_MS (drawn off the flag), and he comes out of
// it: one of the deep's crew, a spare hand down there, who sinks to its
// floor and gathers like any other. The beat is over the moment he is out,
// so a reload before then opens the belly again and one after it has him in
// the crew already.
export function startFreed(t) { S.introAt = t; }

export function stepFreed(t) {
  if (t - S.introAt < FREED_OPEN_MS) return true;
  const at = bellyAt(t);
  const w = Object.assign(FACTORY(TYPE.GATHER), newRecord());
  w.x = at.x - WORKER / 2;
  w.y = at.y - WORKER / 2;
  w.falling = true;
  w.vx = w.vy = 0;
  S.crew++;
  S.deepCrew = (S.deepCrew || 0) + 1;
  rebalance();
  S.workers.push(w);
  syncWorkers();
  S.shopStale = true;
  return false;
}
