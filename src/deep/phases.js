// A phase's mechanic: past the first, each defense does one thing to the
// party on a clock of its own, warned ahead, and one class answers it
// (DESIGN.md, "A phase has a mechanic and a class answers it"). The surge
// heals triple and a stun spends it; the lash throws the melee fighters off
// the hide and the Hexer's Held stops it; the sink takes him into the abyss
// where nothing reaches him, and a burst banked before it is the answer.
//
// Its resist is here too: the kind of damage it halves, which in the fading
// changes on a turn of its own (`resistNow`, `guardOf`).
//
// `S.mechAt` is the seconds into the phase's turn and `S.mechSkip` whether
// this turn's mechanic was answered; both are saved, so a reload lands in the
// same beat. The heal reads `surgeK`, a strike reads `sunk`, the coil's line
// reads `lashK` and `tautK`, a melee fighter reads `lashHits`, and the
// drawing reads the parts.

import { S } from '../state.js';
import { MECHANICS, LASH_TAUT_S, LASH_W, DAMAGE_KIND, RESISTS, RESIST_K, RESIST_TURN_S, RESIST_WARN_S,
         BREAK_DIVE, BREAK_DIVE_STEPS, BREAK_ROAR } from '../config.js';
import { has } from './statuses.js';

const LAST = 3;
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

// The heal's multiple this frame.
export const surgeK = () => { const p = live('surge'); return p && p.part === 'on' ? p.m.x : 1; };

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

// One frame of the turn. The answers are asked here: a stun in the surge's
// warning or in it spends that surge, and Held in the lash's warning stops
// that lash. A new turn is unanswered again.
export function stepMechanic(c) {
  const m = mechOf();
  S.phaseAt = (S.phaseAt || 0) + c.dt / 1000;
  if (!m) { S.mechAt = 0; S.mechSkip = false; return; }
  S.mechAt += c.dt / 1000;
  if (S.mechAt >= m.every) { S.mechAt %= m.every; S.mechSkip = false; }
  const p = part();
  if (m.kind === 'surge' && p.part !== 'calm' && S.serpentStun > 0) S.mechSkip = true;
  if (m.kind === 'lash' && p.part === 'warn' && has('held')) S.mechSkip = true;
}

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
const oldResist = () => (RESISTS[S.serpentStage - 1] || [])[0] || null;
export const resistAt = k => (renewed(k) ? resistNow() : oldResist());

// A phase broken: the next opens at the top of its turn.
export function resetMechanic() { S.mechAt = 0; S.mechSkip = false; S.phaseAt = 0; }

// --- the resist ------------------------------------------------------------------
// The kind of damage the phase up resists, and in the fading, which of its two
// is up: they take turns on `S.phaseAt`, the seconds into the phase (saved).
const resists = () => (S.snatched && !S.serpentFreed && S.serpentStage <= LAST ? RESISTS[S.serpentStage] : []);
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
