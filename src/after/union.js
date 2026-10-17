// The union: the crowd and its support (DESIGN.md, "Acts 3 and 4", act 3,
// "Faith buys hands", "How support spreads" and "God's pushback (no fight)").
// Placeholder drawing.
//
// The crowd field: every soul a slot with its rim pieces (RIM_PIECES; eight
// inked is a member), stepped as data a few times a second (AFTER_SPREAD_HZ),
// and only the files in view drawn (render/after.js, `crowdSpan`), so a big
// crowd costs the frame the files on screen (call 1's frame cost). The rims
// are saved as `S.after.rims`, a character a soul ('0'..'8', and '9' for a
// slot whose member has walked out to the camp as a volunteer or a pledge);
// the field works on a byte array mirrored off that string and written back
// to it whenever it changes.
//
// What inks a rim: a canvasser's word (a piece), a sign planted close (every
// soul within SIGN_REACH, to the full), a poster on the fence (POSTER_REACH
// souls down its file, to half: POSTER_CAP), and word of mouth -- a soul
// gains on a slow clock (WORD_S) as fast as it has members round it, so the
// spread fills the gaps and compounds. A soul of the player's own lines
// arrives part-inked (a share, until lineage exists to say whose). Souls
// keep rising from the running yard into the back of the crowd.
//
// God's pushback: the throne's speech, warned ahead, sweeping a band of files
// and stripping every half-won soul in it back to pale -- a member is never
// un-made -- and knocking the signs in it askew; and the wardens, walking
// rounds, tearing posters down and carrying signs up the stair into the
// glare. Nobody fights them. Members stay at their posts until the strike
// (call 14 open: they do, the recommendation).

import { S } from '../state.js';
import { P, RIM_PIECES, POSTER_CAP, SIGN_REACH, POSTER_REACH, WORD_S, CROWD_FILES,
         AFTER_CROWD, AFTER_FIRST_MEMBERS, AFTER_KIN_SHARE, AFTER_KIN_PIECES, AFTER_RISE_S,
         AFTER_SPREAD_HZ, AFTER_SIGN_INK_S, AFTER_POSTER_INK_S, AFTER_SPEECH_S, AFTER_SPEECH_WARN_S,
         AFTER_SPEECH_FILES, AFTER_SPEECH_HOLD_S, AFTER_WARDENS, AFTER_WARDEN_REST_S, AFTER_TEAR_S,
         AFTER_PULL_S, CROWD_X0, CROWD_PITCH } from '../config.js';
import { arand, secs, walk, nextId } from './util.js';
import { soulX, soulY, fileOf, rankOf, slotX, afterFloor, throneAt, stairFoot } from './place.js';

const OUT = 9;           // a slot whose member walked out to the camp

// --- the field, mirrored off the save ------------------------------------------------
const field = { ref: null, str: null, arr: new Uint8Array(0), dirty: false,
                members: 0, out: 0, inked: 0 };
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
  let m = 0, o = 0, inked = 0;
  for (const v of field.arr) { if (v === RIM_PIECES) m++; else if (v === OUT) o++; else inked += v; }
  field.members = m; field.out = o; field.inked = inked;
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
function setSoul(i, v) {
  const a = souls();
  if (a[i] === v) return;
  a[i] = v; field.dirty = true;
}
// A soul added at the back: the crowd's new slot, its rim as it arrives.
function addSoul(v) {
  souls();
  const n = field.arr.length + 1;
  field.arr = grow(field.arr, n);
  field.arr[n - 1] = v; field.dirty = true;
}

// The crowd stood up at the act's start: AFTER_CROWD souls, a share part-inked
// (the player's own lines), the first members inked full in the front rank.
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
export const members = () => (S.after ? (souls(), field.members) : 0);
// Support, members and volunteers as a share of the crowd as it stands.
export const union = () => (S.after ? (souls(), field.members + field.out) : 0);
export const support = () => { const n = crowdSize(); return n ? union() / n : 0; };
export const rimOf = i => souls()[i];
// The ink in the 3 by 3 block round a slot, for picking where a sign goes.
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

// --- the hands that ink, and the hands that leave ------------------------------------
// A canvasser's word to soul `i`: a piece, true if it took.
export function canvass(i) {
  const a = souls();
  if (i < 0 || i >= a.length || a[i] >= RIM_PIECES) return false;
  setSoul(i, a[i] + 1);
  if (a[i] === RIM_PIECES) { field.members++; }
  return true;
}
// The soul a canvasser at world x goes to next: the nearest not yet a member
// in the front `ranks`.
export function canvassTarget(x, ranks) {
  const a = souls();
  let best = -1, bd = Infinity;
  for (let r = 0; r < ranks; r++) for (let f = 0; f < CROWD_FILES; f++) {
    const i = r * CROWD_FILES + f;
    if (i >= a.length || a[i] >= RIM_PIECES) continue;
    const d = Math.abs(soulX(f) - x) + r * P * 4;
    if (d < bd) { bd = d; best = i; }
  }
  return best;
}
// A member walking out of the crowd to the camp (a hire, a pledge): the
// nearest the front, its slot left standing empty. -1 with no member free.
export function takeMember() {
  const a = souls();
  for (let i = 0; i < a.length; i++) if (a[i] === RIM_PIECES) {
    setSoul(i, OUT); field.members--; field.out++;
    return i;
  }
  return -1;
}
export const soulPos = i => ({ x: soulX(fileOf(i)) + P / 2, y: soulY(rankOf(i)) + P * 2 });

// For a check or a scene: every soul's rim set by `fn(i, v)`, the setup a
// check is not about (`__afterCrowd`).
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
  // Signs: every soul within SIGN_REACH of a sign standing straight, a piece
  // each AFTER_SIGN_INK_S, to the full.
  for (const s of A.signs) {
    if (s.askew || s.pull != null) continue;
    s.acc = (s.acc || 0) + dt;
    while (s.acc >= AFTER_SIGN_INK_S) {
      s.acc -= AFTER_SIGN_INK_S;
      for (let r = Math.max(0, s.r - SIGN_REACH); r <= s.r + SIGN_REACH; r++)
        for (let f = Math.max(0, s.f - SIGN_REACH); f <= Math.min(F - 1, s.f + SIGN_REACH); f++) {
          const i = r * F + f;
          if (i < n && a[i] < RIM_PIECES) { a[i]++; field.dirty = true; }
        }
    }
  }
  // Posters: POSTER_REACH souls down the file passing the poster's wall, a
  // piece each AFTER_POSTER_INK_S, to half.
  for (const p of A.posters) {
    if (p.torn != null) continue;
    p.acc = (p.acc || 0) + dt;
    while (p.acc >= AFTER_POSTER_INK_S) {
      p.acc -= AFTER_POSTER_INK_S;
      const f = Math.max(0, Math.min(F - 1, Math.floor((slotX(p.slot) - CROWD_X0) / CROWD_PITCH)));
      for (let k = 0; k < POSTER_REACH; k++) {
        const i = k * F + f;
        if (i >= n) break;
        if (a[i] < POSTER_CAP) { a[i]++; field.dirty = true; }
      }
    }
  }
  // Word of mouth: a soul gains as fast as it has members on its sides, a
  // piece every WORD_S on the average with two of them. A chance a tick, off
  // the act's own word, rather than a running sum a soul: memoryless, so a
  // reload loses nobody's progress.
  for (let i = 0; i < n; i++) {
    const v = a[i];
    if (v >= RIM_PIECES) continue;
    const f = i % F;
    let m = 0;
    if (f > 0 && a[i - 1] === RIM_PIECES) m++;
    if (f < F - 1 && i + 1 < n && a[i + 1] === RIM_PIECES) m++;
    if (i >= F && a[i - F] === RIM_PIECES) m++;
    if (i + F < n && a[i + F] === RIM_PIECES) m++;
    if (m && arand() < m / 2 * dt / WORD_S) { a[i] = v + 1; field.dirty = true; }
  }
  recount();
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
  recount();
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

// One frame of the crowd, the speech and the wardens.
let riseIn = AFTER_RISE_S;
export function stepUnion(c) {
  const A = S.after, dt = secs(c);
  souls();
  spreadIn += dt;
  if (spreadIn >= 1 / AFTER_SPREAD_HZ) { spread(spreadIn); spreadIn = 0; }
  riseIn -= dt;
  if (riseIn <= 0) { riseIn = AFTER_RISE_S; addSoul(arand() < AFTER_KIN_SHARE ? 1 : 0); }
  stepSpeech();
  stepWardens(dt);
  syncRims();
}
