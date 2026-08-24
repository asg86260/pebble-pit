// The yard at rest.
//
// A body with nothing to do already ambles rather than standing to attention:
// a spot to stroll to, a stand about when it gets there, then another. This is
// what it does during the standing about, and it is the only thing in the game
// that is purely for watching -- nothing here makes, spends or moves anything,
// and a break that produced something would be a break you farmed.
//
// So the rule is strict and worth stating: **a break only ever happens to a
// body that had stopped anyway.** A miner stood down because the yard is full,
// a hauler with nothing left to fetch, a quarrier at a face it cannot tip
// another shard off. Nobody ever downs tools to have one. The pace of the works
// is exactly what it was before this file existed.
//
// What they do is drawn in cells, like everything else, and never in words: a
// note over the head is singing, a burst is swearing, and dots going back and
// forth between two of them is a conversation. A cigarette is the one that is
// not a mark at all -- it is a puff of the same smoke the lab's chimney makes,
// off a body instead of off a roof.

import { P, WORKER, BREAK_WAIT, BREAK_ODDS, BREAK_LIFE, BREAK_NEAR, BREAK_BEAT } from './config.js';
import { S } from './state.js';

// What a body can be caught doing. `alone` is whether it needs somebody to do
// it at, which is the whole of the difference between singing and talking.
const KINDS = [
  { key: 'smoke', weight: 3 },
  { key: 'sing',  weight: 2 },
  { key: 'curse', weight: 1 },
  { key: 'talk',  weight: 4, needs: 'mate' }
];

const pick = () => {
  let n = Math.random() * KINDS.reduce((a, k) => a + k.weight, 0);
  for (const k of KINDS) if ((n -= k.weight) < 0) return k;
  return KINDS[0];
};

// Somebody else stood about within earshot, not already busy having a break of
// their own. Earshot is short on purpose: two bodies at opposite ends of the
// yard swapping dots would read as semaphore rather than as a conversation.
function mate(w) {
  let best = null, near = BREAK_NEAR;
  for (const o of S.workers) {
    if (o === w || !o.resting || o.brk) continue;
    const d = Math.abs(o.x - w.x);
    if (d > near || Math.abs(o.y - w.y) > WORKER * 2) continue;
    near = d;
    best = o;
  }
  return best;
}

function begin(w, now) {
  // Most turns come to nothing, and that is the whole tuning of this: what makes
  // a cigarette worth noticing is that the last four times you looked over there
  // nobody was having one.
  if (Math.random() > BREAK_ODDS) return sit(w, now);
  const k = pick();
  const other = k.needs === 'mate' ? mate(w) : null;
  if (k.needs === 'mate' && !other) return sit(w, now);   // nobody to talk to; wait
  const until = now + BREAK_LIFE * (0.7 + Math.random() * 0.8);
  w.brk = { kind: k.key, until, next: now, turn: true, with: other || null };
  if (other) {
    other.brk = { kind: 'talk', until, next: now, turn: false, with: w };
    // they turn to face each other, which is the half of a conversation that
    // reads from across the yard
    w.face = Math.sign(other.x - w.x) || 1;
    other.face = -w.face;
  }
}

// nothing to do and nobody to do it with: try again in a while
const sit = (w, now) => { w.brkAt = now + BREAK_WAIT * (0.5 + Math.random()); };

// One body, one frame of its break. `say` is a mark standing over its head with
// a moment left to live, and the drawing knows nothing else about any of this.
function stepOne(w, now) {
  const b = w.brk;
  if (now >= b.until) { end(w, now); return; }
  if (now < b.next) return;

  if (b.kind === 'smoke') {
    // the same smoke the chimney makes, smaller, off the side of its head
    S.smoke.push({
      x: w.x + WORKER + P * 0.5 * (w.face || 1) - (w.face > 0 ? 0 : WORKER),
      y: w.y + P,
      drift: (Math.random() - 0.5) * 0.2,
      s: 0.55,
      cig: true,                             // not the chimney's, and not counted with it
      t: 0
    });
    b.next = now + BREAK_BEAT * (0.8 + Math.random() * 0.6);
    return;
  }

  if (b.kind === 'talk') {
    // They take it in turns. A pair both saying something at once is two people
    // talking over each other, which is a thing that happens and not a thing
    // that reads.
    const o = b.with;
    if (!o || !o.brk || o.brk.with !== w) { end(w, now); return; }
    if (b.turn) {
      w.say = { mark: 'dots', n: 1 + Math.floor(Math.random() * 3), until: now + BREAK_BEAT };
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

// One frame of the whole yard's idling. It runs after the crew have been
// stepped, so `resting` is this frame's answer and not the last one's.
export function stepBreaks(now) {
  for (const w of S.workers) {
    if (w.say && now >= w.say.until) w.say = null;
    // Back at work. Whatever it was doing stops, but the clock on the *next*
    // one is left alone: a hauler's standing about comes in a few seconds at a
    // time between strolls, and a timer reset every time it took a step would
    // be a timer that never came round at all.
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
