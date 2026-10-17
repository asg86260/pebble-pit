// The union: the crowd and its support (DESIGN.md, "Acts 3 and 4", act 3,
// "How support spreads" and "God's pushback (no fight)"; call 14, settled
// 2026-10-18: members walk out). Placeholder drawing.
//
// The crowd field: every soul a slot with its rim pieces (RIM_PIECES; eight
// inked is a member), stepped as data a few times a second (AFTER_SPREAD_HZ),
// and only the files in view drawn (render/after.js, `crowdSpan`), so a big
// crowd costs the frame the files on screen (call 1's frame cost). The rims
// are saved as `S.after.rims`, a character a soul ('0'..'8', and '9' for a
// slot whose member has walked out); the field works on a byte array
// mirrored off that string and written back to it whenever it changes.
//
// What inks a rim: a sign planted close (every soul within its reach, to the
// full) and a poster on the fence (its reach of souls down its file, to half:
// POSTER_CAP). Nothing else: the pair's speech and the agitators make rebel
// and win nobody, and word of mouth is gone. A soul of the player's own
// lines arrives part-inked (a share, until lineage exists to say whose).
// Souls keep rising from the running yard into the back of the crowd.
//
// A member walks out: the frame its rim closes, its slot is left empty and a
// body sets off from where it stood to the camp (bodies.js), so God's yard
// empties as the union wins, and the gates read off how empty it is
// (`support`, the share walked out).
//
// God's pushback: the throne's speech, warned ahead, sweeping a band of files
// and stripping every half-won soul in it back to pale -- a member is gone
// from the yard by then and never un-made -- and knocking the signs in it
// askew; and the wardens, walking rounds, tearing posters down and carrying
// signs up the stair into the glare. Nobody fights them.

import { S } from '../state.js';
import { P, RIM_PIECES, POSTER_CAP, CROWD_FILES, AFTER_CROWD, AFTER_FIRST_MEMBERS, AFTER_KIN_SHARE,
         AFTER_KIN_PIECES, AFTER_RISE_S, AFTER_SPREAD_HZ, AFTER_SIGN_INK_S, AFTER_POSTER_INK_S, AFTER_SPEECH_S,
         AFTER_SPEECH_WARN_S, AFTER_SPEECH_FILES, AFTER_SPEECH_HOLD_S, AFTER_WARDENS, AFTER_WARDEN_REST_S,
         AFTER_TEAR_S, AFTER_PULL_S, CROWD_X0, CROWD_PITCH } from '../config.js';
import { arand, secs, walk, nextId } from './util.js';
import { signReach, posterReach } from './levels.js';
import { soulX, soulY, fileOf, rankOf, slotX, afterFloor, throneAt, stairFoot } from './place.js';

const OUT = 9;           // a slot whose member walked out to the camp

// --- the field, mirrored off the save ------------------------------------------------
const field = { ref: null, str: null, arr: new Uint8Array(0), dirty: false, out: 0 };
function rebuild() {
  const s = S.after.rims || '';
  const arr = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) arr[i] = Math.max(0, Math.min(OUT, s.charCodeAt(i) - 48));
  field.ref = S.after; field.str = s; field.arr = arr;
  field.dirty = false;
  recount();
}
export function souls() {
  if (field.ref !== S.after || field.str !== S.after.rims) rebuild();
  return field.arr;
}
function recount() {
  let o = 0;
  for (const v of field.arr) if (v === OUT) o++;
  field.out = o;
}
// The string the save carries, brought up to the field.
export function syncRims() {
  if (!S.after) return;
  souls();
  if (!field.dirty) return;
  let s = '';
  const a = field.arr;
  for (let i = 0; i < a.length; i += 4096) s += String.fromCharCode(...a.subarray(i, i + 4096).map(v => v + 48));
  S.after.rims = s; field.str = s; field.dirty = false;
}
const grow = (arr, n) => { const b = new (arr.constructor)(n); b.set(arr.subarray(0, Math.min(arr.length, n))); return b; };
// A soul added at the back: the crowd's new slot, its rim as it arrives.
function addSoul(v) {
  souls();
  const n = field.arr.length + 1;
  field.arr = grow(field.arr, n);
  field.arr[n - 1] = v; field.dirty = true;
}

export const soulPos = i => ({ x: soulX(fileOf(i)) + P / 2, y: soulY(rankOf(i)) + P * 2 });

// Every member still standing in the field walks out: its slot emptied, a
// body set off from it toward the camp, walking (bodies.js, 'out').
function walkOuts() {
  const a = souls(), A = S.after;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== RIM_PIECES) continue;
    a[i] = OUT; field.dirty = true; field.out++;
    const at = soulPos(i);
    A.bodies.push({ id: nextId(), job: null, state: 'out', x: at.x, y: at.y, face: -1, t: 0, load: null, target: null, n: 0 });
  }
}

// The crowd stood up at the act's start: AFTER_CROWD souls, a share part-inked
// (the player's own lines), the first members inked full in the front rank
// (they walk out on the first frame).
export function seedCrowd() {
  const a = S.after;
  let s = '';
  for (let i = 0; i < AFTER_CROWD; i++) {
    const kin = arand() < AFTER_KIN_SHARE;
    s += String(kin ? 1 + Math.floor(arand() * AFTER_KIN_PIECES) : 0);
  }
  const mid = Math.floor(CROWD_FILES / 2 - AFTER_FIRST_MEMBERS / 2);
  const chars = s.split('');
  for (let k = 0; k < AFTER_FIRST_MEMBERS; k++) chars[mid + k] = String(RIM_PIECES);
  a.rims = chars.join('');
  rebuild();
}

// --- the reads -----------------------------------------------------------------------
export const crowdSize = () => (S.after ? souls().length : 0);
export const crowdRanks = () => Math.ceil(crowdSize() / CROWD_FILES);
// The souls who have walked out of God's yard, and their share of the crowd
// as it stands: what the gates read.
export const union = () => (S.after ? (souls(), field.out) : 0);
export const support = () => { const n = crowdSize(); return n ? union() / n : 0; };
export const rimOf = i => souls()[i];
// The ink in the 3 by 3 block round a slot, for picking where a sign goes: an
// empty slot counts full.
export function inkAround(f, r) {
  const a = souls();
  let sum = 0;
  for (let dr = -1; dr <= 1; dr++) for (let df = -1; df <= 1; df++) {
    const ff = f + df, rr = r + dr;
    if (ff < 0 || ff >= CROWD_FILES || rr < 0) continue;
    const i = rr * CROWD_FILES + ff;
    if (i < a.length) sum += a[i] === OUT ? RIM_PIECES : a[i];
  }
  return sum;
}

// For a check or a scene: every soul's rim set by `fn(i, v)`, the setup a
// check is not about (`__afterCrowd`). A rim set full walks out on the next
// frame like any other; a slot set to 9 is one already gone, with no body.
export function setCrowd(fn) {
  const a = souls();
  for (let i = 0; i < a.length; i++) a[i] = Math.max(0, Math.min(OUT, fn(i, a[i]) | 0));
  field.dirty = true; recount(); syncRims();
}

// --- the spread ------------------------------------------------------------------------
let spreadIn = 0;
function spread(dt) {
  const a = souls(), n = a.length, F = CROWD_FILES;
  const A = S.after;
  // Signs: every soul within the sign's reach, a piece each AFTER_SIGN_INK_S,
  // to the full, while it stands straight.
  for (const s of A.signs) {
    if (s.askew || s.pull != null) continue;
    s.acc = (s.acc || 0) + dt;
    const R = signReach(s.big);
    while (s.acc >= AFTER_SIGN_INK_S) {
      s.acc -= AFTER_SIGN_INK_S;
      for (let r = Math.max(0, s.r - R); r <= s.r + R; r++)
        for (let f = Math.max(0, s.f - R); f <= Math.min(F - 1, s.f + R); f++) {
          const i = r * F + f;
          if (i < n && a[i] < RIM_PIECES) { a[i]++; field.dirty = true; }
        }
    }
  }
  // Posters: the poster's reach of souls down the file passing its wall, a
  // piece each AFTER_POSTER_INK_S, to half.
  for (const p of A.posters) {
    if (p.torn != null) continue;
    p.acc = (p.acc || 0) + dt;
    const R = posterReach(p.big);
    while (p.acc >= AFTER_POSTER_INK_S) {
      p.acc -= AFTER_POSTER_INK_S;
      const f = Math.max(0, Math.min(F - 1, Math.floor((slotX(p.slot) - CROWD_X0) / CROWD_PITCH)));
      for (let k = 0; k < R; k++) {
        const i = k * F + f;
        if (i >= n) break;
        if (a[i] < POSTER_CAP) { a[i]++; field.dirty = true; }
      }
    }
  }
}

// --- God's pushback --------------------------------------------------------------------
// The speech's state: when the next one comes, the files it sweeps, and when
// the last was held (for the drawing). Its period halves past the slowdown.
const speechEvery = () => AFTER_SPEECH_S * (S.after.gate >= 2 ? 0.5 : 1);
export const speechWarned = () => { const sp = S.after?.speech; return !!sp && S.after.t >= sp.next - AFTER_SPEECH_WARN_S; };
export const speechHeld = () => { const sp = S.after?.speech; return !!sp && sp.held != null && S.after.t - sp.held < AFTER_SPEECH_HOLD_S; };
function stepSpeech() {
  const A = S.after;
  if (!A.speech) A.speech = { next: A.t + speechEvery(), f0: Math.floor(arand() * (CROWD_FILES - AFTER_SPEECH_FILES)), held: null };
  const sp = A.speech;
  if (A.t < sp.next) return;
  const a = souls(), n = a.length;
  for (let r = 0; r * CROWD_FILES < n; r++)
    for (let f = sp.f0; f < sp.f0 + AFTER_SPEECH_FILES; f++) {
      const i = r * CROWD_FILES + f;
      if (i < n && a[i] > 0 && a[i] < RIM_PIECES) { a[i] = 0; field.dirty = true; }
    }
  for (const s of A.signs) if (s.f >= sp.f0 && s.f < sp.f0 + AFTER_SPEECH_FILES) s.askew = true;
  sp.held = A.t;
  sp.next = A.t + speechEvery();
  sp.f0 = Math.floor(arand() * (CROWD_FILES - AFTER_SPEECH_FILES));
}

// The wardens on rounds: their number by the gate reached, each walking down
// from the throne, to a poster (torn down where it hangs) or a sign (pulled up
// and carried up the stair into the glare, where it fades), and resting at
// the stair's foot between rounds.
export const wardensDue = () => AFTER_WARDENS[Math.min(AFTER_WARDENS.length - 1, S.after.gate)];
function pickRound(w) {
  const A = S.after;
  const posters = A.posters.filter(p => p.torn == null && !A.wardens.some(o => o !== w && o.goal === 'poster' && o.target === p.id));
  const signs = A.signs.filter(s => s.pull == null && !A.wardens.some(o => o !== w && o.goal === 'sign' && o.target === s.id));
  if (!posters.length && !signs.length) return false;
  const takeSign = signs.length && (!posters.length || arand() < 0.5);
  if (takeSign) { const s = signs[Math.floor(arand() * signs.length)]; w.goal = 'sign'; w.target = s.id; }
  else { const p = posters[Math.floor(arand() * posters.length)]; w.goal = 'poster'; w.target = p.id; }
  w.state = 'go';
  return true;
}
function stepWarden(w, dt) {
  const A = S.after, floor = afterFloor(), th = throneAt();
  w.t = (w.t || 0) + dt;
  if (w.state === 'rest') {
    walk(w, stairFoot(), floor, dt);
    if (w.t >= AFTER_WARDEN_REST_S && pickRound(w)) w.t = 0;
    return;
  }
  if (w.state === 'go') {
    const p = w.goal === 'poster' ? A.posters.find(q => q.id === w.target && q.torn == null) : null;
    const s = w.goal === 'sign' ? A.signs.find(q => q.id === w.target && q.pull == null) : null;
    if (!p && !s) { w.state = 'rest'; w.t = 0; return; }
    const tx = p ? slotX(p.slot) : soulX(s.f) + P / 2, ty = p ? floor : soulY(s.r) + P * 2;
    if (walk(w, tx, ty, dt)) { w.state = p ? 'tear' : 'pull'; w.t = 0; }
    return;
  }
  if (w.state === 'tear') {
    const p = A.posters.find(q => q.id === w.target && q.torn == null);
    if (!p) { w.state = 'rest'; w.t = 0; return; }
    if (w.t >= AFTER_TEAR_S) { p.torn = A.t; w.state = 'rest'; w.t = 0; }
    return;
  }
  if (w.state === 'pull') {
    const s = A.signs.find(q => q.id === w.target);
    if (!s) { w.state = 'rest'; w.t = 0; return; }
    if (s.pull == null) s.pull = A.t;
    if (w.t >= AFTER_PULL_S) {
      A.signs = A.signs.filter(q => q !== s);
      w.load = 'sign'; w.state = 'carry'; w.t = 0;
    }
    return;
  }
  if (w.state === 'carry') {
    if (walk(w, th.x, th.y, dt)) { w.load = null; w.dropped = A.t; w.state = 'rest'; w.t = 0; }
  }
}
function stepWardens(dt) {
  const A = S.after, th = throneAt();
  while (A.wardens.length < wardensDue())
    A.wardens.push({ id: nextId(), x: th.x, y: th.y, state: 'rest', t: 0, goal: null, target: null, load: null, dropped: null, face: -1 });
  for (const w of A.wardens) stepWarden(w, dt);
}

// One frame of the crowd, the members walking out, the speech and the wardens.
let riseIn = AFTER_RISE_S;
export function stepUnion(c) {
  const dt = secs(c);
  souls();
  spreadIn += dt;
  if (spreadIn >= 1 / AFTER_SPREAD_HZ) { spread(spreadIn); spreadIn = 0; }
  walkOuts();
  riseIn -= dt;
  if (riseIn <= 0) { riseIn = AFTER_RISE_S; addSoul(arand() < AFTER_KIN_SHARE ? 1 : 0); }
  stepSpeech();
  stepWardens(dt);
  syncRims();
}
