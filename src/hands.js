// Your hands: what a click, a drag and a flick do.
//
// Sweeping lifts dust off the ground onto the cursor, a flick throws it (or a
// held hand lets it go at the hole by itself, once that is bought), and
// anything still in the air can be caught on the way past.

import { P, BRUSH, CORE_SIZE, THROW, THROW_MAX, LADDER, TOSS_RISE, TOSS_RISE_VARY, HAND_ARC } from './config.js';
import { S, floor } from './state.js';
import { at, put, inside, colOf, bottomY } from './grid.js';
import { spawnChip, aim, bell } from './dust.js';
import { holeLanding } from './pit.js';
import { capacity, tossReach } from './levels.js';
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
    // not what the held hand itself just let go, or the toss would come
    // straight back off the cursor it left from
    if (ch.auto) continue;
    if (Math.abs(ch.x + P / 2 - mx) > reach || Math.abs(ch.y + P / 2 - my) > reach) continue;
    S.chips.splice(i, 1);
    S.held++;
    room--;
    noteCatch(ch);
    S.motes.push(mote(ch.s));
  }
}

// One grain on the cursor.
const mote = s => ({ s, a: rand() * Math.PI * 2, d: P * (1 + rand() * 2.6), spin: (rand() - 0.5) * 0.03, bob: rand() * Math.PI * 2 });

// The ground's cells within the brush, in the order the brush walks them.
function* brushCells(mx, my) {
  const c0 = colOf(floor, mx);
  const r0 = Math.floor((bottomY(floor) - my) / P);
  for (let dr = -BRUSH; dr <= BRUSH; dr++) {
    for (let dc = -BRUSH; dc <= BRUSH; dc++) {
      if (dc * dc + dr * dr > BRUSH * BRUSH) continue;
      const c = c0 + dc, r = r0 + dr;
      if (inside(floor, c, r) && at(floor, c, r)) yield [c, r];
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
  for (const _ of brushCells(mx, my)) return true;
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
  for (const [c, r] of brushCells(mx, my)) {
    if (room <= 0) break;
    const v = at(floor, c, r);
    put(floor, c, r, 0);
    S.motes.push(mote(v));
    taken++;
    room--;
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
  }
  noteThrow(S.chips.slice(from), full);
  S.held = 0;
  S.motes = [];
}

// Hold to toss: the handful leaves the hand where it is, aimed at the hole
// on the arc the haulers throw on (`holdToToss` in game.js decides when).
// The hand has a reach (the bench's ladder): a hole further off than that
// gets the handful thrown that far toward it, to land on the ground and be
// picked up again from there. The peak grows with the distance, so a throw
// from the far side of the rock clears it. Not a juggle: nothing here is
// thrown to be caught.
export function tossAtHole(x, y) {
  if (!S.held) return;
  const from = S.chips.length;
  for (let i = 0; i < S.held; i++) {
    const fx = x + (rand() - 0.5) * P * 6, fy = y + (rand() - 0.5) * P * 6;
    const hole = holeLanding();
    const land = Math.abs(hole - fx) <= tossReach() ? hole : fx + Math.sign(hole - fx) * tossReach();
    const rise = Math.max(TOSS_RISE, Math.abs(land - fx) * HAND_ARC) * (1 + bell() * TOSS_RISE_VARY * 0.4);
    const v = aim(fx, fy, land, P, rise);
    spawnChip(fx, fy, v.vx, v.vy, S.motes[i]?.s || 1);
    S.chips[S.chips.length - 1].auto = true;      // past the hand that threw it (catchAir)
  }
  noteThrow(S.chips.slice(from), false);
  S.held = 0;
  S.motes = [];
}

