// The second half's first beat, and its last: the snatch and the freeing
// (DESIGN.md, "The serpent: the second half of the game"; docs/wave-serpent.md,
// "The story").
//
// The snatch needs two facts, the sqwife out and the pit drowned, which come
// on their own clocks; it plays on whichever comes second (`snatchDue`, read
// by its row in beats.js). Two of the crew nearest the mouth are taken off it
// for the length of the beat and walked as `S.pair`, the reunion's own
// drawing: out to the plank, where a portal opens in the abyss's own surface
// -- a whirlpool turning on the liquid -- and something heaves under it, comes
// up out of it in held steps, takes the one nearer the water and goes back down. The
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

import { demoOn } from './demo.js';
import { P, WORKER, COMMUTE_PACE, INTRO_BEAT,
         SNATCH_RISE, SNATCH_EDGE, SNATCH_WALK_MAX_S, SNATCH_LOOK_MS, SNATCH_HEAVE_MS,
         SNATCH_RISE_MS, SNATCH_RISE_STEPS, SNATCH_TAKE_MS, SNATCH_SINK_MS, SNATCH_SINK_STEPS,
         SNATCH_ALONE_MS, SNATCH_LEAP_MS, SNATCH_LEAP_STEPS, SNATCH_LEAP_H, SNATCH_STILL_MS,
         SNATCH_HURRY, SNATCH_PORTAL_MS, COIL_SEGS, KILL, KILL_WALK_PX_S, KILL_WALK_MAX_S, KILL_CHEER_S, KILL_GLIDE_S, KILL_MEET_GAP, KILL_HOP_S, KILL_IN_S, KILL_OUT_S,
         DEEP_SURFACE, SERPENT_ON, STAGE_WAIT_S } from './config.js';
import { S } from './state.js';
import { frames } from './clock.js';
import { mouthX, bellyAt, deepTop, deepFloor, deepX0, deepX1, coilLine, domeRect } from './deep/place.js';
import { killFrame } from './view.js';
import { now } from './clock.js';
import { abyssLine } from './pit.js';
import { walkY, lookAt } from './world.js';
import { spawnChip, bell } from './dust.js';
import { rebalance, JOBS } from './staffing.js';
import { syncWorkers, retask, FACTORY, newRecord, unbook } from './crew.js';
import { belowYard } from './route.js';
import { onYard } from './crew/body.js';
import { TYPE, JOB_OF } from './jobs.js';
import { beatDone, beatRunning } from './beats.js';
import { stageClear } from './stage.js';
import { standFirst } from './deep/party.js';

// --- whether ---------------------------------------------------------------------
// Two switches (DESIGN.md, "Three builds"). The snatch plays in every build
// but the demo: on the free itch page it is the teaser, the story going on
// past the rescue as far as the wizards. The deep -- the portal, the serpent
// fight -- is the paid game's (SERPENT_ON), and a dev build's and the node
// yard's (no `import.meta.env`). A check can say either way for itself.
const DEV_BUILD = !import.meta.env || !!import.meta.env.DEV;
let forced = null, forcedDeep = null;
export function serpentOn() { return !demoOn() && (forced ?? true); }
export function forceSerpent(on) { forced = on; }
export function deepOn() { return serpentOn() && (forcedDeep ?? (SERPENT_ON || DEV_BUILD)); }
export function forceDeep(on) { forcedDeep = on; }

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
    w.carry = 0;
    w.load = [];
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
    // apart, and stood at its edge looking in; one of them says so. A long
    // way off, they hurry, so the walk is never the longest beat of the
    // scene (SNATCH_WALK_MAX_S): the pace is set once, from the walk ahead.
    s.pace ??= Math.max(COMMUTE_PACE, ...S.pair.map((b, i) =>
      Math.abs(edgeX(S.pair.length === 1 ? 1 : i) - b.x) / (SNATCH_WALK_MAX_S * 60)));
    let there = true;
    for (const [i, b] of S.pair.entries()) {
      const d = edgeX(S.pair.length === 1 ? 1 : i) - b.x;
      if (Math.abs(d) > 1) { b.x += Math.sign(d) * Math.min(s.pace * f, Math.abs(d)); there = false; }
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
    // And nobody else in the picture before anything comes up (stage.js):
    // the rest of the crew have faded out of it, never waited on past
    // STAGE_WAIT_S.
    const clear = S.introCut || stageClear() || t - s.stood >= STAGE_WAIT_S * 1000;
    if (t - s.stood >= SNATCH_LOOK_MS / s.hurry && clear) next('open');
    return true;
  }
  if (s.phase === 'open') {
    // The portal opens in the surface before anything comes out of it.
    s.portal = Math.min(1, (t - s.at) / (SNATCH_PORTAL_MS / s.hurry));
    if (s.portal >= 1) next('heave');
    return true;
  }
  if (s.phase === 'heave') {
    // The surface heaves over what is coming before anything breaks it
    // (render/serpent.js draws the swell off the phase).
    if (held(SNATCH_HEAVE_MS)) next('rise');
    return true;
  }
  if (s.phase === 'rise') {
    // Up out of the surface in held frames, never popped in and never a
    // smooth slide: each step a pose.
    const k = Math.min(1, (t - s.at) / (SNATCH_RISE_MS / s.hurry));
    s.headY = surface - SNATCH_RISE * Math.min(1, Math.ceil(k * SNATCH_RISE_STEPS) / SNATCH_RISE_STEPS);
    if (k >= 1) {
      next('take');
      s.carried = true;
      // He is in its jaws now, drawn there off `S.snatch`, not as one of the
      // pair; the one left says what anybody would.
      s.him = S.pair.length > 1 ? S.pair.pop() : null;
      if (S.pair[0]) S.pair[0].say = { mark: 'bang', until: t + SNATCH_TAKE_MS + SNATCH_SINK_MS + SNATCH_ALONE_MS };
    }
    return true;
  }
  if (s.phase === 'take') {
    if (held(SNATCH_TAKE_MS)) next('sink');
    return true;
  }
  if (s.phase === 'sink') {
    // And back down the same way, with him, in held frames, until the both
    // of them are under.
    const k = Math.min(1, (t - s.at) / (SNATCH_SINK_MS / s.hurry));
    const top = surface - SNATCH_RISE;
    s.headY = top + (surface + WORKER - top) * Math.floor(k * SNATCH_SINK_STEPS) / SNATCH_SINK_STEPS;
    if (k >= 1) {
      s.headY = surface + WORKER;
      S.snatched = true;               // the crew is one fewer: he is not given back
      S.shopStale = true;              // the deep's boards stand from here
      next('close');
    }
    return true;
  }
  // 'close': the one left at the edge alone a beat, then running and leaping
  // in -- an arc in held poses from where she stands to the whirlpool's
  // middle, and under -- and the portal closing over the empty water after.
  const u = (t - s.at) * s.hurry;
  const b = S.pair[0];
  if (b && u >= SNATCH_ALONE_MS) {
    b.leap ??= { x: b.x, y: b.y };
    const j = Math.min(1, Math.floor((u - SNATCH_ALONE_MS) / SNATCH_LEAP_MS * SNATCH_LEAP_STEPS) / SNATCH_LEAP_STEPS);
    const tx = mouthX() - WORKER / 2, ty = surface;
    b.x = b.leap.x + (tx - b.leap.x) * j;
    b.y = b.leap.y + (ty - b.leap.y) * j - Math.sin(j * Math.PI) * SNATCH_LEAP_H;
    if (j >= 1) b.under = true;
    b.say = null;
  }
  const shut = SNATCH_ALONE_MS + SNATCH_LEAP_MS;
  s.portal = u < shut ? 1 : Math.max(0, 1 - (u - shut) / SNATCH_STILL_MS);
  if (u < shut + SNATCH_STILL_MS) return true;
  giveBack();
  return false;
}

// The one who leapt is one of the crew again, as the rescue's body was, and
// the deep's whole crew: she comes down through the liquid under the portal
// and sinks to the deep's floor (crew/falls.js, `sink`), and swims to the
// first station, which stands from here (`standFirst`), as its fighter.
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
  // The first station, free, and her its fighter (`seatUpTo`, deep/party.js):
  // she fights from the moment she is down, watched or not.
  standFirst();
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
// The kill (config KILL): the last blow, the serpent limp and sinking to the
// floor, its hide coming apart (all drawn off `S.freedAt`, deep/phases.js);
// then he is out on the floor where the belly was and walks to her, they
// cheer, and the frame pulls back. He is one of the deep's crew at the end of
// it, where he stands: a spare hand down there. The beat's clock is saved, so
// a reload picks it up where it was. A skip plays it out at once.
const ease = k => 1 - Math.pow(1 - Math.max(0, Math.min(1, k)), 3);
const outAt = () => KILL.last + KILL.limp + KILL.apart;
export function startFreed(t) { if (S.freedAt == null) S.freedAt = t; glide = null; }
// Where he stops: beside her, out in the water past her station's glass on
// his side (she comes out to its edge, stage.js `meetHim`), so the two of
// them meet where they can be seen. With no station standing, beside the
// deep's own body nearest, or a little way off.
function herX(from) {
  const st = S.stations && S.stations[0];
  if (st && st.built) {
    const d = domeRect(st), side = from < d.x + d.w / 2 ? -1 : 1;
    const her = side < 0 ? d.x - WORKER - KILL_MEET_GAP : d.x + d.w + KILL_MEET_GAP;
    return Math.max(deepX0() + P, Math.min(deepX1() - WORKER - P, her + side * (WORKER + KILL_MEET_GAP)));
  }
  const w = (st && S.workers.find(o => o.station === st.id)) || S.workers.find(o => belowYard(o));
  const x = w ? w.x : from - P * 12;
  return Math.max(deepX0() + P, Math.min(deepX1() - WORKER - P, x + WORKER + P));
}
// Where he is, once out: walking from the belly to her, then hopping as they
// cheer. Null before he is out, or once the beat is over.
// How long his walk to her takes.
const walkS = () => Math.min(KILL_WALK_MAX_S, Math.abs(S.freedTo - S.freedFrom) / KILL_WALK_PX_S);
export function freedBody(t = now()) {
  if (!beatRunning('freed') || S.freedFrom == null) return null;
  const a = (t - S.freedAt) / 1000 - outAt();
  const walk = walkS();
  const k = walk > 0 ? Math.min(1, a / walk) : 1, cheer = a - walk;
  const hop = cheer >= 0 && cheer < KILL_CHEER_S && Math.floor(cheer / KILL_HOP_S) % 2 === 0;
  return { x: S.freedFrom + (S.freedTo - S.freedFrom) * k, y: deepFloor() - WORKER - (hop ? P : 0), cheering: cheer >= 0 };
}
// Where she comes out to meet him, while the beat has her: a body and a gap
// on from where he stops, on the floor. Null outside the beat.
export function meetAt() {
  if (!beatRunning('freed') || S.freedFrom == null || S.freedTo == null) return null;
  const dir = Math.sign(S.freedTo - S.freedFrom) || 1;
  return { x: S.freedTo + dir * (WORKER + KILL_MEET_GAP), y: deepFloor() - WORKER };
}
// The frame's glide: from where it was when the move began to where it is
// going, on an ease over KILL_GLIDE_S, and then on it exactly. Not a share of
// the gap a frame, which is a chase that is still sliding when the thing
// happens. In the kill's own seconds; a reload takes the move again.
let glide = null;
const easeInOut = k => k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
function glideTo(move, a, x) {
  if (!glide || glide.move !== move) glide = { move, at: a, from: S.camX + S.viewW / 2 };
  const k = easeInOut(Math.max(0, Math.min(1, (a - glide.at) / KILL_GLIDE_S)));
  return glide.from + (x - glide.from) * k;
}
// Where the frame looks while they meet: on the two of them, from his way
// out to the cheer -- the middle of his walk when the whole of it fits the
// frame, so he walks in to her across a held shot, else on him.
function lookAtMeet(t) {
  const him = freedBody(t), m = meetAt();
  if (!m) return (him ? him.x : S.freedTo) + WORKER / 2;
  if (Math.abs(m.x - S.freedFrom) + WORKER * 4 <= S.viewW) return (S.freedFrom + m.x) / 2 + WORKER / 2;
  return ((him ? him.x : S.freedTo) + m.x) / 2 + WORKER / 2;
}
// Where the frame looks while he is down: on the belly as he goes limp; then
// after the coming apart as it runs in from the tail, until it reaches the
// belly and lets him go.
function lookAtKill(t, a) {
  const belly = bellyAt(t).x;
  const apart = (a - KILL.last - KILL.limp) / KILL.apart;
  if (apart <= 0 || apart >= 1) return belly;
  const front = coilLine((1 - apart) * (COIL_SEGS - 1), t).x;
  return Math.max(front, belly);
}
export function stepFreed(t) {
  const a = (t - S.freedAt) / 1000;
  const zin = ease((a - KILL.last) / KILL_IN_S);
  if (a < outAt()) { killFrame(zin, glideTo('kill', a, lookAtKill(t, a))); return true; }
  if (S.freedFrom == null) { S.freedFrom = bellyAt(t).x - WORKER / 2; S.freedTo = herX(S.freedFrom); }
  // The frame goes over to the two of them and holds.
  const end = outAt() + walkS() + KILL_CHEER_S;
  killFrame(zin * (1 - ease((a - end) / KILL_OUT_S)), glideTo('meet', a, lookAtMeet(t)));
  if (a < end + KILL_OUT_S) return true;
  const w = Object.assign(FACTORY(TYPE.GATHER), newRecord());
  w.x = S.freedTo;
  w.y = deepFloor() - WORKER;
  w.vx = w.vy = 0;
  w.cast = true;                    // the scene's still, until the deep is back (stage.js)
  S.crew++;
  S.deepCrew = (S.deepCrew || 0) + 1;
  rebalance();
  S.workers.push(w);
  syncWorkers();
  S.shopStale = true;
  S.freedFrom = S.freedTo = null;
  return false;
}
// The skip: all of it at once, played out on the next frame.
export function cutFreed() { S.freedAt = -1e12; return false; }
