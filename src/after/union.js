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
// A soul is won the frame its rim closes: it pays AFTER_WON_REBEL rebel,
// motes off its head that drift to the pile (rebel.js), and stays in its
// slot, won and waiting (the owner, 2026-10-21: "use rebellion to buy
// workers instead of it happening automatically"). It walks out only when a
// worker is bought (`hire`, the pedestal's recruit row): its slot left empty
// and a body set off from where it stood to the camp (bodies.js). The gates
// read the share won, hired or not (`support`).
//
// God's pushback: the throne's speech, warned ahead by his gaze settling on a
// sign or a poster, burning it (docs/wave-act3-build.md, track B). Souls are
// never knocked back and nobody walks rounds: the wardens are dropped.

import { S } from '../state.js';
import { P, RIM_PIECES, POSTER_CAP, CROWD_FILES, AFTER_CROWD, AFTER_FIRST_MEMBERS, AFTER_KIN_SHARE,
         AFTER_KIN_PIECES, AFTER_RISE_S, AFTER_SPREAD_HZ, AFTER_SIGN_INK_S, AFTER_POSTER_INK_S,
         AFTER_SPEECH_WARN_S, AFTER_BURN_S, CROWD_X0, CROWD_PITCH , AFTER_BURN_MARCHES, AFTER_WALK} from '../config.js';
import { arand, secs, nextId } from './util.js';
import { signReach, posterReach } from './levels.js';
import { soulX, soulY, fileOf, rankOf, slotX, signMarch } from './place.js';
import { wonRebel } from './rebel.js';

const OUT = 9;           // a slot whose member walked out to the camp
// The empty slot's value, read by the drawing (render/aftercrowd.js).
export const OUT_RIM = OUT;

// --- the field, mirrored off the save ------------------------------------------------
const field = { ref: null, str: null, arr: new Uint8Array(0), dirty: false, out: 0, ready: 0 };
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
  let o = 0, r = 0;
  for (const v of field.arr) if (v === OUT) o++; else if (v === RIM_PIECES) r++;
  field.out = o; field.ready = r;
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

// The won soul nearest the front walks out to be a worker: its slot emptied,
// a body set off from it toward the camp (bodies.js, 'out'). False with none
// won and waiting.
export function hire() {
  const i = souls().indexOf(RIM_PIECES);
  if (i < 0) return false;
  walkOut(i);
  return true;
}
// Every soul won walks out at once: a check's or a scene's setup, in one pass.
export function hireAll() {
  const a = souls();
  for (let i = 0; i < a.length; i++) if (a[i] === RIM_PIECES) walkOut(i);
}
function walkOut(i) {
  souls()[i] = OUT; field.dirty = true; field.out++; field.ready--;
  const at = soulPos(i);
  S.after.bodies.push({ id: nextId(), job: null, state: 'out', x: at.x, y: at.y, face: -1, t: 0, load: null, target: null, n: 0 });
}
// A piece of ink on soul i; the piece that closes its rim wins it.
function ink(a, i) {
  a[i]++; field.dirty = true;
  if (a[i] === RIM_PIECES) { field.ready++; wonRebel(soulPos(i)); }
}

// The crowd stood up at the act's start: AFTER_CROWD souls, a share part-inked
// (the player's own lines), the first members won in the front rank. They
// walk out free on the act's first frame (`stepUnion`): nobody would plant
// the first sign otherwise.
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
// The souls who have walked out of God's yard to work; those won and waiting
// to be hired; all won, hired or not, and their share of the crowd as it
// stands: what the gates read.
export const union = () => (S.after ? (souls(), field.out) : 0);
export const ready = () => (S.after ? (souls(), field.ready) : 0);
export const won = () => union() + ready();
export const support = () => { const n = crowdSize(); return n ? won() / n : 0; };
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
// check is not about (`__afterCrowd`). A rim set full is won and waiting,
// paying nothing; a slot set to 9 is one already gone, with no body.
export function setCrowd(fn) {
  const a = souls();
  for (let i = 0; i < a.length; i++) a[i] = Math.max(0, Math.min(OUT, fn(i, a[i]) | 0));
  field.dirty = true; recount(); syncRims();
}

// --- the spread ------------------------------------------------------------------------
function spread(dt) {
  const a = souls(), n = a.length, F = CROWD_FILES;
  const A = S.after;
  // Signs: every soul within the sign's reach, a piece each AFTER_SIGN_INK_S,
  // to the full, while it stands straight.
  for (const s of A.signs) {
    s.age = (s.age || 0) + dt;
    if (s.askew || s.pull != null || s.burnt != null) continue;
    s.acc = (s.acc || 0) + dt;
    const R = signReach(s.big);
    while (s.acc >= AFTER_SIGN_INK_S) {
      s.acc -= AFTER_SIGN_INK_S;
      for (let r = Math.max(0, s.r - R); r <= s.r + R; r++)
        for (let f = Math.max(0, s.f - R); f <= Math.min(F - 1, s.f + R); f++) {
          const i = r * F + f;
          if (i < n && a[i] < RIM_PIECES) ink(a, i);
        }
    }
  }
  // Posters: the poster's reach of souls down the file passing its wall, a
  // piece each AFTER_POSTER_INK_S, to half.
  for (const p of A.posters) {
    if (p.torn != null || p.burnt != null) continue;
    p.acc = (p.acc || 0) + dt;
    const R = posterReach(p.big);
    while (p.acc >= AFTER_POSTER_INK_S) {
      p.acc -= AFTER_POSTER_INK_S;
      const f = Math.max(0, Math.min(F - 1, Math.floor((slotX(p.slot) - CROWD_X0) / CROWD_PITCH)));
      for (let k = 0; k < R; k++) {
        const i = k * F + f;
        if (i >= n) break;
        if (a[i] < POSTER_CAP) ink(a, i);
      }
    }
  }
}

// --- God's pushback --------------------------------------------------------------------
// The throne's speech: warned AFTER_SPEECH_WARN_S ahead by God's gaze
// settling on one sign or poster, then that one burnt -- charring away over
// AFTER_BURN_S, inking nobody from the moment it catches, and gone. Nothing
// else: a soul is never knocked back, a rim never stripped. Its period
// halves past the slowdown. With nothing standing to burn when the warning
// would start, it is a roar and nothing more, and the next is timed.
//
// `S.after.speech` is { next, target, burnt }: when it falls, what it is
// aimed at once warned ({ kind: 'sign' | 'poster', id }), and the last one
// burnt ({ at, kind, id }), for the drawing.
const speechEvery = () => AFTER_BURN_MARCHES * (signMarch() / AFTER_WALK) * (S.after.gate >= 2 ? 0.5 : 1);
export const speechWarned = () => { const sp = S.after?.speech; return !!sp && !!sp.target && S.after.t >= sp.next - AFTER_SPEECH_WARN_S; };
// The thing the speech is aimed at, while warned: a sign or a poster.
export function speechTarget() {
  const A = S.after, sp = A?.speech;
  if (!sp || !sp.target || !speechWarned()) return null;
  const list = sp.target.kind === 'sign' ? A.signs : A.posters;
  return list.find(q => q.id === sp.target.id) || null;
}
const standing = q => q.burnt == null && q.torn == null && q.pull == null;
function pickTarget() {
  const A = S.after;
  const all = [...A.signs.filter(standing).map(q => ({ kind: 'sign', id: q.id })),
               ...A.posters.filter(standing).map(q => ({ kind: 'poster', id: q.id }))];
  return all.length ? all[Math.floor(arand() * all.length)] : null;
}
function stepSpeech() {
  const A = S.after;
  if (!A.speech) A.speech = { next: A.t + speechEvery(), target: null, burnt: null };
  const sp = A.speech;
  // A burnt thing gone once its char has faded.
  A.signs = A.signs.filter(q => q.burnt == null || A.t - q.burnt < AFTER_BURN_S);
  A.posters = A.posters.filter(q => q.burnt == null || A.t - q.burnt < AFTER_BURN_S);
  if (A.t < sp.next - AFTER_SPEECH_WARN_S) return;
  // Aimed as the warning starts, and again if its mark went first.
  const list = t => (t.kind === 'sign' ? A.signs : A.posters);
  if (!sp.target || !list(sp.target).some(q => q.id === sp.target.id && standing(q))) sp.target = pickTarget();
  if (A.t < sp.next) return;
  if (sp.target) {
    const q = list(sp.target).find(o => o.id === sp.target.id);
    if (q) { q.burnt = A.t; sp.burnt = { at: A.t, kind: sp.target.kind, id: q.id }; }
  }
  sp.target = null;
  sp.next = A.t + speechEvery();
}

// Whether the act's clock crossed a multiple of `every` this frame. The spread
// and the rise are facts of the saved clock, so a reload or a new game keeps
// their beat rather than a module's leftover count.
const crossed = (dt, every) => Math.floor(S.after.t / every) > Math.floor((S.after.t - dt) / every);

// One frame of the crowd and the speech.
export function stepUnion(c) {
  const dt = secs(c);
  souls();
  // Nobody hired yet is the act's first frame: the refusal's members go.
  if (!field.out) for (let k = 0; k < AFTER_FIRST_MEMBERS; k++) hire();
  if (crossed(dt, 1 / AFTER_SPREAD_HZ)) spread(1 / AFTER_SPREAD_HZ);
  if (crossed(dt, AFTER_RISE_S)) addSoul(arand() < AFTER_KIN_SHARE ? 1 : 0);
  stepSpeech();
  syncRims();
}
