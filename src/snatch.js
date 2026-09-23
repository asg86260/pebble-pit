// The second half's first beat, and its last: the snatch and the freeing
// (DESIGN.md, "The serpent: the second half of the game"; docs/wave-serpent.md,
// "The story").
//
// The snatch needs two facts, the sqwife out and the pit drowned, which come
// on their own clocks; it plays on whichever comes second (`snatchDue`, read
// by its row in beats.js). Two of the crew nearest the mouth are taken off it
// for the length of the beat and walked as `S.pair`, the reunion's own
// drawing: out to the plank, where something comes up out of the surface a
// cell a frame, takes the one nearer the water and goes back down. The
// surface closes, the crew is one fewer, and the one left standing goes in
// after him -- the deep's first job, a brawler, walking the shaft down like
// anybody sent there.
//
// The freeing is the fourth defense broken (deep/serpent.js sets the flag):
// the belly opens, he comes out of it and is one of the crew again, a spare
// hand in the deep who swims up the shaft to the yard.
//
// `S.snatch` is the beat's state while it plays, and what the drawing reads:
// `{ phase, at, headY, carried }` -- the phase, when it began, the world y of
// the top of the head, and whether he is in its jaws. Nothing about it is
// saved; a reload plays the beat again from the start, or, past the take,
// from the surface closing (`startSnatch`).

import { P, WORKER, COMMUTE_PACE, CORE_SIZE, INTRO_BEAT,
         SNATCH_RISE, SNATCH_EDGE, SNATCH_LOOK_MS, SNATCH_TAKE_MS, SNATCH_CLOSE_MS,
         SNATCH_HURRY, FREED_OPEN_MS } from './config.js';
import { S } from './state.js';
import { frames } from './clock.js';
import { mouthX, bellyAt } from './deep/place.js';
import { abyssLine } from './pit.js';
import { walkY, lookAt } from './world.js';
import { spawnChip, bell } from './dust.js';
import { rebalance, JOBS } from './staffing.js';
import { syncWorkers, retask, FACTORY, newRecord, unbook } from './crew.js';
import { plant, belowYard } from './route.js';
import { onYard } from './crew/body.js';
import { TYPE, JOB_OF } from './jobs.js';
import { beatDone } from './beats.js';

// --- when -------------------------------------------------------------------------
// Both facts, the ending's sheet put down (the rescue's own beat and its
// sheet come first when the rescue is the second fact, and the snatch takes
// the second dance's place), and no scene on the camera (the drowning's, when
// the drowning is the second fact: the snatch plays when it has finished).
// Every function beats.js names is a declaration, not a const: beats.js reads
// them at load and imports this file in a ring.
export function snatchDue() {
  return S.rescued && S.drowned && beatDone('ending') && !S.beat.camera;
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
               him: null, stood: null };
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
    if (t - s.stood >= SNATCH_LOOK_MS / s.hurry) next('rise');
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
      S.shopStale = true;              // the altar's board stands from here
      next('close');
    }
    return true;
  }
  // 'close': the surface closing over him, the one left at the edge.
  if (!held(SNATCH_CLOSE_MS)) return true;
  giveBack();
  return false;
}

// The one left standing is one of the crew again, as the rescue's body was,
// and goes in after him on her own: the deep's first job. She walks it like
// any body put on a job -- the shaft down, the deep's floor along -- from
// where she stood.
function giveBack() {
  const b = S.pair[0];
  const w = b?.body || (b && Object.assign(FACTORY(TYPE.HAUL), newRecord()));
  S.pair = [];
  S.snatch = null;
  if (!w) return;
  w.x = b.x;
  plant(w, b.y);
  w.say = null;
  S.crew++;
  S.brawlers = 1;
  rebalance();
  retask(w, TYPE.BRAWL);
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
// it: one of the crew again, a body at the belly on no job, which is a spare
// hand, so it swims to the floor and up the shaft to the yard (crew/deep.js,
// `surface`). The beat is over the moment he is out, so a reload before then
// opens the belly again and one after it has him in the crew already.
export function startFreed(t) { S.introAt = t; }

export function stepFreed(t) {
  if (t - S.introAt < FREED_OPEN_MS) return true;
  const at = bellyAt(t);
  const w = Object.assign(FACTORY(TYPE.HAUL), newRecord());
  w.x = at.x - WORKER / 2;
  plant(w, at.y - WORKER / 2);
  S.crew++;
  rebalance();
  S.workers.push(w);
  syncWorkers();
  S.shopStale = true;
  return false;
}
