// The yard at rest.
//
// What a body does while standing about, purely for watching: nothing here
// makes, spends or moves anything. **A break only ever happens to a body that
// had stopped anyway.** Nobody downs tools to have one, so the pace of the
// works is untouched. Everything is drawn in cells, never words: a note is
// singing, a burst is swearing, dots going between two bodies is talk, and a
// cigarette is the chimney's smoke off a body.

import { P, WORKER, BREAK_WAIT, BREAK_ODDS, BREAK_LIFE, BREAK_NEAR, BREAK_BEAT } from './config.js';
import { S } from './state.js';
import { puff } from './puff.js';
import { rand } from './rng.js';

// `needs: 'mate'` is the whole difference between singing and talking.
const KINDS = [
  { key: 'smoke', weight: 3 },
  { key: 'sing',  weight: 2 },
  { key: 'curse', weight: 1 },
  { key: 'talk',  weight: 4, needs: 'mate' }
];

// A body whose break is always the same thing. A janitor is mostly seen idle,
// so its idle wants to be recognizable from across the yard.
const HABIT = { janitor: 'smoke' };

const kind = key => KINDS.find(k => k.key === key);

const pick = w => {
  const habit = HABIT[w.type];
  if (habit) return kind(habit);
  let n = rand() * KINDS.reduce((a, k) => a + k.weight, 0);
  for (const k of KINDS) if ((n -= k.weight) < 0) return k;
  return KINDS[0];
};

// Somebody else stood about within earshot, not already on a break. Earshot
// is short: two bodies at opposite ends of the yard swapping dots read as
// semaphore.
function mate(w) {
  let best = null, near = BREAK_NEAR;
  for (const o of S.workers) {
    if (o === w || !o.resting || o.brk || HABIT[o.type]) continue;
    const d = Math.abs(o.x - w.x);
    if (d > near || Math.abs(o.y - w.y) > WORKER * 2) continue;
    near = d;
    best = o;
  }
  return best;
}

function begin(w, now) {
  // Most turns come to nothing; that rarity is what makes a cigarette worth
  // noticing. A habit is not a thing you catch a body at, so it always fires.
  if (!HABIT[w.type] && rand() > BREAK_ODDS) return sit(w, now);
  const k = pick(w);
  const other = k.needs === 'mate' ? mate(w) : null;
  if (k.needs === 'mate' && !other) return sit(w, now);   // nobody to talk to; wait
  const until = now + BREAK_LIFE * (0.7 + rand() * 0.8);
  w.brk = { kind: k.key, until, next: now, turn: true, with: other || null };
  if (other) {
    other.brk = { kind: 'talk', until, next: now, turn: false, with: w };
    // Facing is not set here: nothing on a body draws a front (`MOVES` in
    // crew.js), and the one thing facing draws, the side a cart trails on, is
    // measured off the ground the body last covered.
  }
}

// nothing to do and nobody to do it with: try again in a while
const sit = (w, now) => { w.brkAt = now + BREAK_WAIT * (0.5 + rand()); };

// One body, one frame of its break. `say` is a mark over its head with a
// moment left to live; the drawing knows nothing else about any of this.
function stepOne(w, now) {
  const b = w.brk;
  if (now >= b.until) { end(w, now); return; }
  if (now < b.next) return;

  if (b.kind === 'smoke') {
    // the chimney's puff, smaller and with fewer motes, off the side of its head
    puff(w.x + WORKER + P * 0.5 * (w.face || 1) - (w.face > 0 ? 0 : WORKER), w.y + P,
         { s: 0.6, n: 2, flag: 'cig' });
    b.next = now + BREAK_BEAT * 1.6 * (0.8 + rand() * 0.6);
    return;
  }

  if (b.kind === 'talk') {
    // They take it in turns; both at once does not read.
    const o = b.with;
    if (!o || !o.brk || o.brk.with !== w) { end(w, now); return; }
    if (b.turn) {
      w.say = { mark: 'dots', n: 1 + Math.floor(rand() * 3), until: now + BREAK_BEAT };
      b.turn = false;
      o.brk.turn = true;
    }
    b.next = now + BREAK_BEAT * 0.9;
    return;
  }

  w.say = { mark: b.kind === 'sing' ? 'note' : 'burst', until: now + BREAK_BEAT * 1.4 };
  b.next = now + BREAK_BEAT * (b.kind === 'sing' ? 1.6 : 3.2);
}

// stopped mid-break, with nothing said about when the next one is
function drop(w) {
  const o = w.brk && w.brk.with;
  w.brk = null;
  w.say = null;
  if (o && o.brk && o.brk.with === w) { o.brk = null; o.say = null; }
}

// and one that ran its course, which does set the clock on the next
function end(w, now) {
  const o = w.brk && w.brk.with;
  drop(w);
  sit(w, now);
  if (o) sit(o, now);
}

// One frame of the whole yard's idling. Runs after the crew have been
// stepped, so `resting` is this frame's answer and not the last one's.
export function stepBreaks(now) {
  for (const w of S.workers) {
    if (w.say && now >= w.say.until) w.say = null;
    // Back at work: the break stops, but the clock on the *next* one is left
    // alone. A hauler rests a few seconds at a time between strolls, and a
    // timer reset on every step would never come round.
    if (!w.resting) {
      if (w.brk) drop(w);
      continue;
    }
    if (w.brk) { stepOne(w, now); continue; }
    if (w.brkAt == null) { sit(w, now); continue; }
    if (now >= w.brkAt) begin(w, now);
  }
}

// what the yard is up to, for the checks
export const breakReport = () => S.workers
  .filter(w => w.brk)
  .map(w => ({ type: w.type, kind: w.brk.kind, paired: !!w.brk.with, say: w.say?.mark || null }));
