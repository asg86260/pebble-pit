// Your hands: what a click, a drag and a flick do.
//
// Sweeping lifts dust off the ground onto the cursor, a flick throws it, and
// anything still in the air can be caught on the way past. The casino's
// stake piles and its hopper are swept the same way: a grain off one of
// them remembers whose coin it is and what it is worth, and the chip loop
// sends it into the funnel or home when it comes down (stakes.js).

import { P, BRUSH, CORE_SIZE, THROW, THROW_MAX, LADDER } from './config.js';
import { S, floor } from './state.js';
import { at, put, inside, colOf, bottomY } from './grid.js';
import { spawnChip } from './dust.js';
import { sweepablePlots } from './stakes.js';
import { unstakeGrain } from './casino.js';
import { capacity } from './levels.js';
import { now } from './clock.js';
import { rand } from './rng.js';
import { noteThrow, noteCatch } from './notices.js';

export function track(x, y) {
  S.trail.push({ x, y, t: now() });
  if (S.trail.length > 5) S.trail.shift();
}

// velocity of the flick you let go on
export function throwVel() {
  if (S.trail.length < 2) return { vx: 0, vy: 0 };
  const a = S.trail[0], b = S.trail[S.trail.length - 1];
  const dt = Math.max(16, b.t - a.t);
  if (now() - b.t > 120) return { vx: 0, vy: 0 };   // paused before letting go
  const clamp = v => Math.max(-THROW_MAX, Math.min(THROW_MAX, v));
  return { vx: clamp((b.x - a.x) / dt * THROW), vy: clamp((b.y - a.y) / dt * THROW) };
}

// pixels still in flight are caught if they pass the cursor while it is held
export function catchAir(mx, my) {
  let room = capacity() - S.held;
  if (room <= 0) return;

  const reach = (BRUSH + 2) * P;      // forgiving: dust falls quickly
  for (let i = S.chips.length - 1; i >= 0 && room > 0; i--) {
    const ch = S.chips[i];
    if (Math.abs(ch.x + P / 2 - mx) > reach || Math.abs(ch.y + P / 2 - my) > reach) continue;
    S.chips.splice(i, 1);
    S.held++;
    room--;
    noteCatch(ch);
    S.motes.push(mote(ch.s, ch));
  }
}

// One grain on the cursor. A grain of a stake pile or of the hopper keeps
// its coin, its worth and where it came from, so it can be let go into the
// funnel or find its way home.
function mote(s, tag) {
  const m = { s, a: rand() * Math.PI * 2, d: P * (1 + rand() * 2.6), spin: (rand() - 0.5) * 0.03, bob: rand() * Math.PI * 2 };
  if (tag && tag.cur) { m.cur = tag.cur; m.worth = tag.worth; m.from = tag.from; }
  return m;
}

// Everything a sweep may take from: the ground, and whatever the casino
// says is lying loose (its piles, the bowl of its hopper). The ground first,
// so a grain on the ground in front of a pile is still the ground's.
const plots = () => [{ plot: floor }, ...sweepablePlots()];

// The cells of one plot within the brush, in the order the brush walks
// them; a wall of the hopper is never a grain.
function* brushCells(e, mx, my) {
  const g = e.plot;
  const c0 = colOf(g, mx);
  const r0 = Math.floor((bottomY(g) - my) / P);
  for (let dr = -BRUSH; dr <= BRUSH; dr++) {
    for (let dc = -BRUSH; dc <= BRUSH; dc++) {
      if (dc * dc + dr * dr > BRUSH * BRUSH) continue;
      const c = c0 + dc, r = r0 + dr;
      if (!inside(g, c, r) || !at(g, c, r)) continue;
      if (e.fixed && e.fixed(c, r)) continue;
      yield [c, r];
    }
  }
}

// A loose core under the cursor, the one thing in this yard you handle
// yourself.
export const overCore = (mx, my) =>
  !!S.coreItem && !S.heldCore &&
  Math.abs(S.coreItem.x + CORE_SIZE / 2 - mx) < CORE_SIZE &&
  Math.abs(S.coreItem.y + CORE_SIZE / 2 - my) < CORE_SIZE;

// Whether a sweep here would find anything, at the same reach `sweep` uses,
// without taking it. A finger on a phone asks it once, on the press, to tell
// a sweep from a look about (DESIGN.md, "One finger looks about").
export function dustUnder(mx, my) {
  if (overCore(mx, my)) return true;
  for (const e of plots()) for (const _ of brushCells(e, mx, my)) return true;
  return false;
}

export function sweep(mx, my) {
  // a loose core on the ground is picked up by hand, no capacity needed
  if (S.coreItem && !S.heldCore &&
      Math.abs(S.coreItem.x + CORE_SIZE / 2 - mx) < CORE_SIZE &&
      Math.abs(S.coreItem.y + CORE_SIZE / 2 - my) < CORE_SIZE) {
    S.coreItem = null;
    S.heldCore = true;
  }

  let room = capacity() - S.held;
  if (room <= 0) return;

  let taken = 0;
  // One coin a hand: once a grain of a pile is on the cursor the sweep takes
  // only more of that coin, or plain dust off the ground, which carries no
  // coin and falls wherever it is thrown.
  const holding = S.motes.find(m => m.cur)?.cur;
  for (const e of plots()) {
    if (room <= 0) break;
    if (e.cur && holding && e.cur !== holding) continue;
    for (const [c, r] of brushCells(e, mx, my)) {
      if (room <= 0) break;
      const v = at(e.plot, c, r);
      // a grain out of the bowl takes its share of the pot with it
      const worth = e.worth ? e.worth() : 0;
      if (e.from === 'hopper') unstakeGrain(worth);
      put(e.plot, c, r, 0);
      S.motes.push(mote(v, e.cur ? { cur: e.cur, worth, from: e.from } : null));
      taken++;
      room--;
    }
  }
  if (taken) {
    S.held += taken;
    // The bench's 'strength' row appears the first time this happens.
    if (!S.seenDrag) { S.seenDrag = true; S.shopStale = true; }
  }
}

export function release(x, y) {
  const { vx, vy } = throwVel();
  if (S.heldCore) {
    S.heldCore = false;
    S.coreItem = { x: x - CORE_SIZE / 2, y: y - CORE_SIZE / 2, vx, vy, rest: false };
  }
  if (!S.held) return;
  // The juggling notice is for the biggest hand there is: a level-0 hand is
  // one grain, and throwing one grain is not juggling.
  const full = S.carryLevel >= LADDER && S.held >= capacity();
  const from = S.chips.length;
  for (let i = 0; i < S.held; i++) {
    spawnChip(x + (rand() - 0.5) * P * 6, y + (rand() - 0.5) * P * 6,
              vx + (rand() - 0.5) * 1.4,
              vy + (rand() - 0.5) * 1.4,
              S.motes[i]?.s || 1);
    // a stake grain keeps its coin through the throw
    const m = S.motes[i];
    if (m && m.cur) Object.assign(S.chips[S.chips.length - 1], { cur: m.cur, worth: m.worth, from: m.from });
  }
  noteThrow(S.chips.slice(from), full);
  S.held = 0;
  S.motes = [];
}

