// A phase's mechanic: the split and the fading each do one thing to the party
// on a clock of its own, warned ahead, and one class answers it (DESIGN.md,
// "A phase has a mechanic and a class answers it"). The lash throws the melee
// fighters off the hide and the Hexer's Held stops it; the sink takes him into the abyss
// where nothing reaches him, and a burst banked before it is the answer.
//
// Its resist is here too: the kind of damage it halves, which in the fading
// changes on a turn of its own (`resistNow`, `guardOf`).
//
// `S.mechAt` is the seconds into the phase's turn and `S.mechSkip` whether
// this turn's mechanic was answered; both are saved, so a reload lands in the
// same beat. A strike reads `sunk`, the coil's line
// reads `lashK` and `tautK`, a melee fighter reads `lashHits`, and the
// drawing reads the parts.

import { S } from '../state.js';
import { now } from '../clock.js';
import { MECHANICS, LASH_TAUT_S, LASH_W, DAMAGE_KIND, RESISTS, RESIST_K, RESIST_TURN_S, RESIST_WARN_S,
         BREAK_DIVE, BREAK_DIVE_STEPS, BREAK_ROAR, KILL, KILL_LIMP_STEPS, KILL_REFORM_S, BELLY_AT,
         SERPENT_PHASES, SERPENT_WOUND, P, WORKER, ORB_R, ORB_CLOSE_S, ORB_RISE_S, ORB_STEP, ORB_CLEAR,
         ORB_BOB_S, ORB_GHOST_K, ORB_HANG_S, ORB_SINK_S, ORB_SINK_EASE, ORB_SQUASH_S } from '../config.js';
import { CLASSES, PAIRS } from '../config/classes.js';
import { has } from './statuses.js';
import { hitRect } from '../stations.js';

const LAST = SERPENT_PHASES - 1;
export const mechOf = () => (S.snatched && !S.serpentFreed && S.serpentStage <= LAST ? MECHANICS[S.serpentStage] : null);

// Where the turn is: 'calm', 'warn' or 'on', and how far through that part,
// 0..1. The mechanic comes at the end of its turn, so a phase opens calm.
export function part() {
  const m = mechOf();
  if (!m) return { part: 'calm', k: 0, m };
  const on = m.every - m.last, warn = on - m.warn, t = S.mechAt;
  if (t < warn) return { part: 'calm', k: t / warn, m };
  if (t < on) return { part: 'warn', k: (t - warn) / m.warn, m };
  return { part: 'on', k: (t - on) / m.last, m };
}
const live = kind => { const p = part(); return p.m && p.m.kind === kind && !S.mechSkip ? p : null; };


// How far into the abyss he is, 0..1: in over `fade`, held, out over `fade`.
export function sinkK() {
  const p = live('sink');
  if (!p || p.part !== 'on') return 0;
  const s = p.k * p.m.last;
  return Math.max(0, Math.min(1, s / p.m.fade, (p.m.last - s) / p.m.fade));
}
// Past half gone, nothing strikes him.
export const sunk = () => sinkK() >= 0.5;

// The lash along the body, head 0 to tail 1, while it runs; null otherwise.
export const lashK = () => { const p = live('lash'); return p && p.part === 'on' ? p.k : null; };
// How far drawn up the coil is, 0..1: up over LASH_TAUT_S of the warning,
// held, and let go as the lash runs out.
export function tautK() {
  const p = live('lash');
  if (!p || p.part === 'calm') return 0;
  if (p.part === 'on') return 1 - p.k;
  return Math.min(1, p.k * p.m.warn / LASH_TAUT_S);
}
// Whether the lash is on a body at `k` along the body this frame.
export const lashHits = k => { const at = lashK(); return at != null && Math.abs(k - at) < LASH_W; };

// One frame of the turn. The answer is asked here: Held in the lash's
// warning stops that lash. A new turn is unanswered again.
export function stepMechanic(c) {
  const m = mechOf();
  S.phaseAt = (S.phaseAt || 0) + c.dt / 1000;
  if (!m) { S.mechAt = 0; S.mechSkip = false; return; }
  S.mechAt += c.dt / 1000;
  if (S.mechAt >= m.every) { S.mechAt %= m.every; S.mechSkip = false; }
  const p = part();
  if (m.kind === 'lash' && p.part === 'warn' && has('held')) S.mechSkip = true;
  if (m.kind === 'orb') stepOrb(p);
}

// --- the orb (the constrict) -----------------------------------------------------------
// On its turn the serpent casts an orb round the strongest station's fighter
// (the highest rung, the first slot of those), unless this turn's was broken
// already. It holds until it is cracked, the fighter is lifted out of it, or
// its turn runs out.
export const orbOn = () => (S.orb && S.orb.hp > 0 && S.serpentStage === LAST && !S.serpentFreed ? S.orb : null);
function stepOrb(p) {
  if (p.part === 'on' && !S.orb && !S.mechSkip) {
    const manned = S.stations.filter(st => st.built && st.fighter);
    if (!manned.length) return;
    const st = manned.reduce((b, o) => ((o.rung || 0) > (b.rung || 0) ? o : b));
    const hp = p.m.hp * SERPENT_WOUND[S.serpentStage];
    S.orb = { st: st.id, hp, max: hp, at: now() };
  }
  if (S.orb && p.part !== 'on') breakOrb();
}
// Broken -- cracked, lifted out of, or its turn over: it bursts, and the turn
// is answered.
export function breakOrb() {
  if (!S.orb) return;
  // `from`: the height it let go at, which its fighter sinks home from.
  const st = S.stations.find(s => s.id === S.orb.st);
  S.orbBurst = { st: S.orb.st, at: now(), from: heldLift(st, S.orb) || 0 };
  S.orb = null;
  S.mechSkip = true;
}
// Blows land on the orb first: what is left of `done` after it, and whether
// there was an orb to take it.
export function hitOrb(done) {
  const o = orbOn();
  if (!o) return done;
  const took = Math.min(o.hp, done);
  o.hp -= took;
  if (o.hp <= 0) breakOrb();
  return 0;
}
// Whether this body is the one in the orb.
export const inOrb = w => { const o = orbOn(); return !!o && !!w && w.station === o.st; };

// --- where the orb's fighter is drawn ------------------------------------------------
// The body stays on its spot in the yard; the orb, the arms, the burst and
// the hand all read its height off `orbLift`, so they cannot disagree.
//
// Seconds since a moment. The orb is saved and the page's clock starts again
// near nought on a refresh, so a moment ahead of the clock is from an older
// page and reads as long past: the orb risen, nothing replayed.
const since = at => (at > now() ? Infinity : (now() - at) / 1000);
const fighterOf = st => st && S.workers.find(w => w.station === st.id);
const easeOut = s => 1 - Math.pow(1 - Math.min(1, Math.max(0, s)), 3);
// Falling on the deep's gravity under its drag: speeding up, then steady.
const sinkCurve = k => {
  const a = ORB_SINK_EASE;
  return (k < a ? k * k / (2 * a) : k - a / 2) / (1 - a / 2);
};
// How many cells the orb must rise for its bottom to clear its station's hit
// box by ORB_CLEAR, in whole steps: none for a fighter already clear of it.
function orbTop(st, w) {
  const r = hitRect(st.id);
  if (!r || !w) return 0;
  const cx = w.x + WORKER / 2;
  if (cx + ORB_R * P <= r.x || cx - ORB_R * P >= r.x + r.w) return 0;
  const need = Math.ceil((w.y + WORKER / 2 + ORB_R * P - r.y) / P) + ORB_CLEAR;
  return need <= 0 ? 0 : Math.ceil(need / ORB_STEP) * ORB_STEP;
}
// The rise's progress, 0..1, or null with no orb `o` on this station.
function riseK(st, o = orbOn()) {
  if (!o || !st || o.st !== st.id) return null;
  return Math.max(0, Math.min(1, (since(o.at) - ORB_CLOSE_S) / ORB_RISE_S));
}
// How high orb `o` holds the fighter: risen in steps, then bobbing. Asked of
// the orb itself as it breaks, when it is no longer on.
function heldLift(st, o) {
  const k = riseK(st, o);
  if (k == null) return null;
  const top = orbTop(st, fighterOf(st));
  if (k < 1) return ORB_STEP * Math.floor(easeOut(k) * top / ORB_STEP);
  // the bob counted from the top, so it does not add a cell to the last step
  const up = since(o.at) - ORB_CLOSE_S - ORB_RISE_S;
  return top + Math.floor((Number.isFinite(up) ? up : now() / 1000) / ORB_BOB_S) % 2;
}
// How many cells the fighter is drawn over its spot: the orb's rise and bob,
// then, let go, the hang and the sink home.
export function orbLift(st) {
  const held = heldLift(st, orbOn());
  if (held != null) return held;
  const b = S.orbBurst;
  if (!b || !st || b.st !== st.id || !b.from) return 0;
  const a = since(b.at);
  if (a < ORB_HANG_S) return b.from;
  const s = (a - ORB_HANG_S) / ORB_SINK_S;
  return s < 1 ? b.from - Math.floor(sinkCurve(s) * b.from) : 0;
}
// The same for a body: a fighter's station's, nobody else's.
export const orbLiftOf = w => (w && w.station && S.stations ? orbLift(S.stations.find(s => s.id === w.station)) : 0);
// The middle of the orb's fighter where it is drawn, by station id: the orb's
// middle while it holds, the burst's after.
export function orbMiddle(id) {
  const st = S.stations.find(s => s.id === id), w = fighterOf(st);
  return w ? { x: w.x + WORKER / 2, y: w.y + WORKER / 2 - orbLift(st) * P } : null;
}
// The drawing's beats: whether the rise is still fast enough to trail rings,
// the sink fast enough to trail lines, and the landing's squash.
export const orbRising = st => { const k = riseK(st); return k != null && k > 0 && k < ORB_GHOST_K; };
function sinkS(st) {
  const b = S.orbBurst;
  return b && st && b.st === st.id && b.from ? (since(b.at) - ORB_HANG_S) / ORB_SINK_S : null;
}
export const orbSinking = st => { const s = sinkS(st); return s != null && s > ORB_SINK_EASE && s < 1; };
export const orbSquash = st => { const s = sinkS(st); return s != null && s >= 1 && s < 1 + ORB_SQUASH_S / ORB_SINK_S; };
// Seconds since the orb was cast, as the bolts read it.
export const orbAge = () => (orbOn() ? since(orbOn().at) : Infinity);

// --- a phase's break -------------------------------------------------------------
// It plays from the frame the defense breaks (`S.breakT`, seconds in): into
// the first phase past the bare one a dive, into the later ones a roar
// (config BREAK_DIVE, BREAK_ROAR). The stage has already moved on; what is
// shown of the old one is the break's to say.
const lenOf = b => Object.values(b).reduce((a, n) => a + n, 0);
export const breakKind = () => (S.breakT == null || !S.snatched || S.serpentFreed || S.serpentStage < 1 || S.serpentStage > LAST ? null
                               : S.serpentStage === 1 ? 'dive' : 'roar');
export const breakLen = () => { const k = breakKind(); return k ? lenOf(k === 'dive' ? BREAK_DIVE : BREAK_ROAR) : 0; };
export const breaking = () => !!breakKind();
// How far down the dive has him, 0..1, in held steps: a step taken as soon as
// each part of the way down begins.
export function diveK() {
  if (breakKind() !== 'dive') return 0;
  const b = BREAK_DIVE, s = S.breakT;
  const k = Math.max(0, Math.min(1, s / b.in, (lenOf(b) - s) / b.out));
  return Math.ceil(k * BREAK_DIVE_STEPS) / BREAK_DIVE_STEPS;
}
// Whether the dive is past its bottom, on the way back up.
export const rising = () => breakKind() === 'dive' && S.breakT >= BREAK_DIVE.in + BREAK_DIVE.under;
// Where the roar's bump is along the body, head 0 to tail 1, while it runs.
export function roarK() {
  if (breakKind() !== 'roar') return null;
  const s = S.breakT - BREAK_ROAR.gape;
  return s >= 0 && s < BREAK_ROAR.run ? s / BREAK_ROAR.run : null;
}
// Whether the roar's bump is on a body at `k` along the body this frame.
export const roarHits = k => { const at = roarK(); return at != null && Math.abs(k - at) < LASH_W; };
// How wide the roar holds the jaws, 0..1: open over `gape`, shut over `shut`.
export function roarGape() {
  if (breakKind() !== 'roar') return 0;
  const b = BREAK_ROAR, s = S.breakT;
  return Math.max(0, Math.min(1, s / b.gape, (lenOf(b) - s) / b.shut));
}
// Whether the hide at `k` along the body (head 0) is the new phase's yet: under
// the dive it changes at the bottom, under the roar behind the bump.
export function renewed(k) {
  const kind = breakKind();
  if (!kind) return true;
  if (kind === 'dive') return S.breakT >= BREAK_DIVE.in;
  const at = roarK();
  return at == null ? S.breakT >= BREAK_ROAR.gape + BREAK_ROAR.run : k < at;
}
// How full the bar is let stand, 0..1, in held steps: it fills as he rises,
// or as the bump runs.
export function breakFill(steps) {
  const kind = breakKind();
  if (!kind) return 1;
  let f;
  if (kind === 'dive') f = rising() ? (S.breakT - BREAK_DIVE.in - BREAK_DIVE.under) / BREAK_DIVE.out : 0;
  else { const at = roarK(); f = at == null ? (S.breakT < BREAK_ROAR.gape ? 0 : 1) : at; }
  return Math.floor(Math.min(1, f) * steps) / steps;
}
// One frame of a break; true while it plays, when nothing else of the
// serpent's runs.
export function stepBreak(c) {
  if (S.breakT == null) return false;
  if (!breakKind()) { S.breakT = null; return false; }
  S.breakT += c.dt / 1000;
  if (S.breakT >= breakLen()) S.breakT = null;
  return true;
}
// The resist the old phase had, for the hide not yet renewed.
const oldResist = () => resistsOf(S.serpentStage - 1)[0] || null;
export const resistAt = k => (renewed(k) ? resistNow() : oldResist());

// --- the kill (snatch.js plays it; config KILL) -------------------------------------
// Seconds since the fourth break, while the serpent is down and not yet
// gathering itself again; null otherwise.
const clamp01 = v => Math.max(0, Math.min(1, v));
export const killA = () => (S.serpentFreed && S.freedAt != null && S.reformAt == null ? (now() - S.freedAt) / 1000 : null);
// How much of the sway is left as he goes limp, 1..0.
export function killSway() {
  const a = killA();
  return a == null ? 1 : 1 - clamp01((a - KILL.last) / (KILL.limp * 0.6));
}
// How far down to the floor he has sunk, 0..1, in held steps.
export function killDrop() {
  const a = killA();
  return a == null ? 0 : Math.ceil(clamp01((a - KILL.last) / KILL.limp) * KILL_LIMP_STEPS) / KILL_LIMP_STEPS;
}
// How much of him has come apart, tail first, 0..1.
export function apartK() {
  const a = killA();
  return a == null ? 0 : clamp01((a - KILL.last - KILL.limp) / KILL.apart);
}
// When, in seconds of the kill, the coming apart reaches the belly and lets
// him go; and whether he is still held in it (the cage drawn round him).
export const killFreeA = () => KILL.last + KILL.limp + (1 - BELLY_AT) * KILL.apart;
export const cradled = () => {
  if (!S.serpentFreed) return S.serpentStage < SERPENT_PHASES;
  const a = killA();
  return a != null && a < killFreeA();
};
// How much of him has gathered again, head first, 0..1; null when he is not.
export const reformK = () => (S.reformAt == null ? null : clamp01((now() - S.reformAt) / 1000 / KILL_REFORM_S));

// A phase broken: the next opens at the top of its turn.
export function resetMechanic() { S.mechAt = 0; S.mechSkip = false; S.phaseAt = 0; }

// --- the resist ------------------------------------------------------------------
// The serpent hardens against its strongest fighters (DESIGN.md, "The serpent
// hardens against its strongest foes"): at each break a phase that resists
// anything resists the kinds of the party's highest-rung fighters -- one kind,
// or in the fading the first two -- chosen once and saved in `S.resistBy`.
// A tie on the rung goes to the older station. A fighter dealing no kind (the
// Recruit's punch, the Bard) is passed over; a party with none falls back on
// the written table.
const kindOf = st => {
  const key = st.cls || (st.kind ? PAIRS[st.kind]?.[0] : null);
  return (key && DAMAGE_KIND[CLASSES[key]?.hit]) || null;
};
export function chooseResist(stage) {
  const want = (RESISTS[stage] || []).length;
  if (!want) return [];
  const kinds = [];
  // stable: equal rungs keep the stations' order, oldest first
  for (const st of [...S.stations].sort((a, b) => b.rung - a.rung)) {
    const k = kindOf(st);
    if (k && !kinds.includes(k)) kinds.push(k);
  }
  return kinds.length ? kinds.slice(0, want) : RESISTS[stage].slice();
}
// Chosen at the break into `stage` (deep/serpent.js), and by a dev jump.
export function settleResist(stage) {
  if (stage > LAST) return;
  S.resistBy = { ...(S.resistBy || {}), [stage]: chooseResist(stage) };
}
const resistsOf = stage => S.resistBy?.[stage] || RESISTS[stage] || [];
// The kind of damage the phase up resists, and in the fading, which of its two
// is up: they take turns on `S.phaseAt`, the seconds into the phase (saved).
const resists = () => (S.snatched && !S.serpentFreed && S.serpentStage <= LAST ? resistsOf(S.serpentStage) : []);
export function resistNow() {
  const r = resists();
  return r.length ? r[Math.floor(S.phaseAt / RESIST_TURN_S) % r.length] : null;
}
// The one coming in the last RESIST_WARN_S of a turn, for the hide to show
// ahead; null when nothing is about to change.
export function resistNext() {
  const r = resists();
  if (r.length < 2 || S.phaseAt % RESIST_TURN_S < RESIST_TURN_S - RESIST_WARN_S) return null;
  return r[(Math.floor(S.phaseAt / RESIST_TURN_S) + 1) % r.length];
}
// What a hit of `weapon` is worth this frame, of itself; undefined for a
// weapon the serpent does not know.
export function guardOf(weapon) {
  if (!(weapon in DAMAGE_KIND)) return undefined;
  const kind = DAMAGE_KIND[weapon];
  return kind && kind === resistNow() ? RESIST_K : 1;
}
