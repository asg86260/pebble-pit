// --- the first trip down ------------------------------------------------------
// Once, ever: the first time the player arrives in the deep, the camera finds
// him in the cage of ribs, he calls out, it pulls back to her under the
// portal, she answers, charges down to the coil and throws her first blow,
// and the deep is the player's (DESIGN.md, "The first trip down"; voted A,
// docs/mocks/abyss-intro-2026-10-12.html).
//
// The scene stages her and nothing else. The fight is the sim's as ever: she
// has been fighting unseen since the snatch, and the blow she throws here is
// her own class's ordinary swing, let go on the frame she reaches the coil,
// so it lands and counts like any other. What the scene takes is her body
// between the arrival and that swing: a hurried swim to the portal, the
// answer, and the charge to where her station has her fight. Every move is a
// swim through the water, and the charge is stepped in held poses each a
// stride under a body's width, so nothing teleports; when it lets go she is
// at her own station's work already.
//
// The beat is a row of BEATS that owns the camera (beats.js); the framing is
// cutscene.js's deep path, asking this file where to look. This file is
// imported by the crew and the drawing, so it imports nothing of the story's:
// the beat's state is read straight off `S`. `S.abyss` is the scene while it
// plays, ephemeral -- a reload plays it again from the top, from the saved
// `S.beat.camera`.

import { P, WORKER, SWIM_PACE, ABYSS_CLOSE, ABYSS_WIDE, ABYSS_PUSH_S, ABYSS_CALL_S, ABYSS_HOP_S,
         ABYSS_WAIT_S, ABYSS_WIDE_S, ABYSS_ANSWER_S, ABYSS_MARK_S, ABYSS_SWIM_K, ABYSS_UNDER,
         ABYSS_CHARGE_POSE_S, ABYSS_CHARGE_PX_S, ABYSS_IMPACT_S, ABYSS_BLOW_MAX_S,
         ABYSS_BAR_IN_S, CUT_GLIDE } from './config.js';
import { S } from './state.js';
import { frames, now } from './clock.js';
import { reducedMotion } from './prefs.js';
import { commutePace } from './levels.js';
import { TYPE } from './jobs.js';
import { deepPortal, deepFloor, bellyAt, coilAt, coilThick, segAbove, postX, postY, slotX } from './deep/place.js';
import { fighterAt, classOf } from './deep/party.js';
import { swim, mid } from './deep/arms.js';

export const KEY = 'abyss';

const ease = k => { k = Math.max(0, Math.min(1, k)); return k * k * (3 - 2 * k); };
const mix = (a, b, k) => ({ k: a.k + (b.k - a.k) * k, x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k });
// Under reduced motion a glide between two framings is a cut.
const glided = (t, at, s) => (reducedMotion() ? 1 : ease((t - at) / (s * 1000)));

// Her: the first station's fighter, who leapt in after him at the snatch and
// has stood at it since (snatch.js, `giveBack`).
const first = () => S.stations[0] || null;
export const her = () => {
  const a = S.abyss;
  if (a) return S.workers.find(w => w.uid === a.uid) || null;
  return fighterAt(first());
};

// The beat's `when`, beside the arrival itself (cutscene.js, `cameraCues`):
// he is still in the belly, and she is down there at her station to answer.
export const abyssDue = () => !!S.snatched && !S.serpentFreed && !!her();

// Where she waits to be seen: under the deep's end of the portal, the way
// the player came in.
function spot() {
  const p = deepPortal();
  return { x: p.x - WORKER / 2, y: p.y + p.r + ABYSS_UNDER * P };
}
// Where the charge ends: where her station has her fight -- up under the
// coil over it for a melee class, at its post on the floor for the rest --
// so her own swing takes over from the frame she is there.
function mark(w, t) {
  const st = S.stations.find(s => s.id === w.station) || first();
  const cls = classOf(st);
  if (!st || (cls && !cls.melee)) return st ? { x: postX(st), y: postY() } : { x: w.x, y: w.y };
  const seg = segAbove(slotX(st.slot), t), p = coilAt(seg, t);
  return { x: p.x - WORKER / 2, y: Math.min(p.y + coilThick(seg) / 2, deepFloor() - WORKER) };
}

// --- the scene's clock -----------------------------------------------------------
// push: the camera glides from where it stood onto the belly, pulled in.
// call: held on him, hopping against the ribs, his double bang; held longer
//       while she is still on her way to the portal, never past ABYSS_WAIT_S.
// wide: pulled back on her under the portal; she answers.
// charge: she goes for the coil in held poses, the camera with her.
// blow: her own swing; held on its impact, then let go.
export function startAbyss(t) {
  const w = her();
  S.abyss = { at: t, phase: 'push', phaseAt: t, uid: w ? w.uid : null, freeAt: null,
              from: { k: 1, x: S.camX + S.viewW / 2, y: S.camY + S.viewH / 2 }, cam: null,
              there: false, charge: null, hitAt: null, said: false };
  if (w) { w.pose = null; w.beam = null; w.walking = false; w.route = null; }
}

const next = (a, phase, t) => { a.phase = phase; a.phaseAt = t; a.from = a.cam || a.from; };

// Where the frame looks while she is in it: on her, wide, the coil under her
// kept in the shot.
function onHer(w, t) {
  const c = coilAt(segAbove(mid(w), t), t);
  return { k: ABYSS_WIDE, x: mid(w), y: (w.y + WORKER / 2 + c.y) / 2 };
}

// One frame of the scene: where the camera wants to look, and whether the
// scene is over (`over`) or the deep has been left under it (`gone`).
export function stepAbyss(t) {
  if (!S.abyss) startAbyss(t);
  const a = S.abyss, w = her();
  if (S.view !== 'deep') return { gone: true };
  if (a.freeAt != null) return { want: null, over: true };
  if (!w) { a.freeAt = t; return { want: null, over: true }; }
  const b = bellyAt(t), belly = { k: ABYSS_CLOSE, x: b.x, y: b.y };
  const into = t - a.phaseAt;
  if (a.phase === 'push') {
    a.cam = mix(a.from, belly, glided(t, a.phaseAt, ABYSS_PUSH_S));
    if (into >= ABYSS_PUSH_S * 1000) next(a, 'call', t);
  } else if (a.phase === 'call') {
    a.cam = belly;
    if (into >= ABYSS_CALL_S * 1000 && (a.there || into >= (ABYSS_CALL_S + ABYSS_WAIT_S) * 1000)) next(a, 'wide', t);
  } else if (a.phase === 'wide') {
    a.cam = mix(a.from, onHer(w, t), glided(t, a.phaseAt, ABYSS_WIDE_S));
    if (!a.said && into >= ABYSS_ANSWER_S * 1000) {
      a.said = true;
      w.say = { mark: 'bang', until: t + ABYSS_MARK_S * 1000 };
    }
    if (into >= ABYSS_WIDE_S * 1000) next(a, 'charge', t);
  } else {
    // With her, at the glide every scene follows a moving thing at.
    const want = onHer(w, t), k = reducedMotion() ? 1 : Math.min(1, CUT_GLIDE * frames());
    a.cam = mix(a.cam || want, want, k);
    if (a.phase === 'blow') {
      if (a.hitAt == null && w.struckAt >= a.phaseAt) a.hitAt = w.struckAt;
      if ((a.hitAt != null && t - a.hitAt >= ABYSS_IMPACT_S * 1000) || into >= ABYSS_BLOW_MAX_S * 1000) a.freeAt = t;
    }
  }
  return { want: a.cam, over: a.freeAt != null };
}

// The space bar: the camera goes, the moment does not. She is let go where
// she is, and her own work takes her to her station.
export function cutAbyss() {
  if (S.abyss && S.abyss.freeAt == null) S.abyss.freeAt = now();
}
// The beat over: nothing is held any more.
export function endAbyss() { S.abyss = null; }

// --- her body ----------------------------------------------------------------------
// A stage of a body's frame (crew/step.js): true while the scene has her.
// Under the falls and the hand, which no scene interrupts; over her work.
export function holdHer(w, c) {
  const a = S.abyss;
  if (!a || a.freeAt != null || w.uid !== a.uid || w.type !== TYPE.FIGHTER) return false;
  const t = c.now;
  if (a.phase === 'blow') return false;
  // Nothing in her hands until the blow: a swing she had in the air when the
  // scene took her is dropped, as a reload drops one.
  w.pose = null;
  w.beam = null;
  if (a.phase === 'push' || a.phase === 'call' || a.phase === 'wide') {
    // To the portal, hurried, and turned to the coil once there.
    const s = spot();
    a.there = swim(w, s.x, s.y, commutePace() * SWIM_PACE * ABYSS_SWIM_K);
    w.goal = 'rise';
    if (a.there) w.face = mark(w, t).x < w.x ? -1 : 1;
    return true;
  }
  if (a.phase === 'charge') {
    // A held pose a stride: the stride ABYSS_CHARGE_PX_S a second, taken a
    // pose at a time toward where she fights, which sways on as she comes.
    a.charge ??= { x: w.x, y: w.y };
    const to = mark(w, t);
    const dx = to.x - a.charge.x, dy = to.y - a.charge.y, d = Math.hypot(dx, dy);
    const poses = Math.floor((t - a.phaseAt) / (ABYSS_CHARGE_POSE_S * 1000));
    const k = d > 0 ? Math.min(1, poses * ABYSS_CHARGE_POSE_S * ABYSS_CHARGE_PX_S / d) : 1;
    if (dx) w.face = dx > 0 ? 1 : -1;
    w.goal = 'rise';
    if (k >= 1) {
      w.x = to.x; w.y = to.y;
      // There: her next swing is due on this frame, her own, and the scene
      // waits on it landing.
      w.next = t;
      w.combo = null;
      next(a, 'blow', t);
      return true;
    }
    w.x = a.charge.x + dx * k;
    w.y = a.charge.y + dy * k;
    w.aboardAt = S.tick;             // held up by the water, as `swim` says
    return true;
  }
  return false;
}

// --- what the drawing reads --------------------------------------------------------
const calling = t => S.abyss && S.abyss.freeAt == null && S.abyss.phase === 'call' ? t - S.abyss.phaseAt : null;
// His hop against the ribs: a cell up and back, held each, all through the call.
export function hisHop(t) {
  const u = calling(t);
  return u != null && Math.floor(u / (ABYSS_HOP_S * 1000)) % 2 === 0 ? P : 0;
}
// And his call: two bangs, for help.
export function hisSay(t) {
  const u = calling(t);
  return u != null && u < ABYSS_MARK_S * 1000 ? { mark: 'bang', n: 2 } : null;
}
// The serpent's bar, gone while the scene has the camera and faded back in
// over ABYSS_BAR_IN_S as it lets go: 0..1.
export function barK(t) {
  const a = S.abyss;
  if (!a) return 1;
  if (a.freeAt == null) return 0;
  return reducedMotion() ? 1 : Math.max(0, Math.min(1, (t - a.freeAt) / (ABYSS_BAR_IN_S * 1000)));
}
// Her charge, for its speed lines: where she is going from and to, or null.
export function charging() {
  const a = S.abyss;
  if (!a || a.freeAt != null || a.phase !== 'charge') return null;
  const w = her();
  return w ? { w, from: a.charge } : null;
}

// --- the save ------------------------------------------------------------------------
// Written while the beat is owed and not on its way out, so a reload picks
// the scene up where it stood rather than from the top: she is wherever the
// save put her, and a scene that started over on every read would never end
// for a yard read back often. Its moments go down as how long ago they were,
// the clock being the page's. Read after the beats (`SAVERS`), whose camera
// says whether there is a scene to pick up.
const MOMENTS = ['at', 'phaseAt', 'freeAt', 'hitAt'];
export const SAVE = {
  fields: ['abyss'],
  write(out) {
    const a = S.abyss;
    const owed = a && S.beat.camera === KEY && !(S.shot && S.shot.out);
    if (!owed) { out.abyss = null; return; }
    const t = now();
    out.abyss = { ...a, ...Object.fromEntries(MOMENTS.map(k => [k, a[k] == null ? null : t - a[k]])) };
  },
  read(s) {
    const a = s.abyss;
    if (!a || typeof a !== 'object' || S.beat.camera !== KEY) { S.abyss = null; return; }
    const t = now();
    S.abyss = { ...a, ...Object.fromEntries(MOMENTS.map(k => [k, Number.isFinite(a[k]) ? t - a[k] : null])) };
  },
  blank() { S.abyss = null; }
};
