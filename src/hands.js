// Your hands: what a click, a drag and a flick do.
//
// Sweeping lifts dust off the ground onto the cursor, a flick throws it, and
// anything still in the air can be caught on the way past.

import { P, BRUSH, GRAV, CORE_SIZE, MINE_DELAY } from './config.js';
import { S, floor, pit } from './state.js';
import { at, put, inside, colOf, bottomY } from './grid.js';
import { blocked, overPitMouth } from './world.js';
import { spawnChip } from './dust.js';
import { bankDust } from './pit.js';
import { capacity } from './upgrades.js';
import { now } from './clock.js';

export const THROW = 9;          // cursor px/ms -> pixel velocity
export const THROW_MAX = 17;

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
    S.motes.push({
      s: ch.s,
      a: Math.random() * Math.PI * 2,
      d: P * (1 + Math.random() * 2.6),
      spin: (Math.random() - 0.5) * 0.03,
      bob: Math.random() * Math.PI * 2
    });
    S.dirty = true;
  }
}

// pick up floor dust inside the brush, up to what the cursor can carry
export function sweep(mx, my) {
  // a loose core on the ground is picked up by hand, no capacity needed
  if (S.coreItem && !S.heldCore &&
      Math.abs(S.coreItem.x + CORE_SIZE / 2 - mx) < CORE_SIZE &&
      Math.abs(S.coreItem.y + CORE_SIZE / 2 - my) < CORE_SIZE) {
    S.coreItem = null;
    S.heldCore = true;
    S.dirty = true;
  }

  let room = capacity() - S.held;
  if (room <= 0) return;

  let taken = 0;
  const lifted = [];

  const c0 = colOf(floor, mx);
  const r0 = Math.floor((bottomY(floor) - my) / P);
  for (let dr = -BRUSH; dr <= BRUSH && room > 0; dr++) {
    for (let dc = -BRUSH; dc <= BRUSH && room > 0; dc++) {
      const c = c0 + dc, r = r0 + dr;
      const v = inside(floor, c, r) ? at(floor, c, r) : 0;
      if (!v) continue;
      if (dc * dc + dr * dr > BRUSH * BRUSH) continue;
      put(floor, c, r, 0);
      lifted.push(v);
      taken++;
      room--;
    }
  }
  if (taken) {
    S.held += taken;
    for (let i = 0; i < taken; i++) {
      S.motes.push({
        s: lifted[i],
        a: Math.random() * Math.PI * 2,
        d: P * (1 + Math.random() * 2.6),
        spin: (Math.random() - 0.5) * 0.03,
        bob: Math.random() * Math.PI * 2
      });
    }
    S.dirty = true;
  }
}

export function release(x, y) {
  const { vx, vy } = throwVel();
  if (S.heldCore) {
    S.heldCore = false;
    S.coreItem = { x: x - CORE_SIZE / 2, y: y - CORE_SIZE / 2, vx, vy, rest: false };
    S.dirty = true;
  }
  if (!S.held) return;
  for (let i = 0; i < S.held; i++) {
    spawnChip(x + (Math.random() - 0.5) * P * 6, y + (Math.random() - 0.5) * P * 6,
              vx + (Math.random() - 0.5) * 1.4,
              vy + (Math.random() - 0.5) * 1.4,
              S.motes[i]?.s || 1);
  }
  S.held = 0;
  S.motes = [];
  S.dirty = true;
}

