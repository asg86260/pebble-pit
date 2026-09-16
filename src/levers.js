// The casino's three controls, on the building itself: the gate lever beside
// the funnel's throat, the bank chute at the foot's left wall, the hoist
// crank beside the tray. No board -- every decision about a hand is a thing
// you do to the building, placed where the thing it does happens, so a
// control says what it is by where it stands. A click or a tap pulls one; it
// stands up when it can be pulled and lies flat when it cannot, for the
// reasons the rows were dead. See DESIGN.md, "The stake is a heap you carry".
//
// Owns where each lever stands, whether it is live, what pulling it does, and
// the hit test; render/casino.js draws them off `leverShape`.

import { P, HOPPER_H, TRAY_H, LEVER_REACH, LEVER_HIT, LEVER_SWING_MS } from './config.js';
import { S, casino } from './state.js';
import { canLet, letGo, canBank, bank, canRide, ride } from './casino.js';
import { now } from './clock.js';
import { coarse } from './prefs.js';

// Each lever: which wall it stands out from, how far down the building its
// pivot is, and the two halves of a decision -- may it, and do it. The gate
// stands at the throat's height; the chute and the crank at the tray's.
export const LEVERS = [
  { key: 'casino-gate', name: 'the gate lever: let it go',
    side: 'right', row: () => HOPPER_H - 2, live: canLet, pull: letGo },
  { key: 'casino-chute', name: 'the bank chute: tip the tray out',
    side: 'left', row: () => casino.h / P - TRAY_H, live: canBank, pull: bank },
  { key: 'casino-crank', name: 'the hoist crank: drop it again',
    side: 'right', row: () => casino.h / P - TRAY_H, live: canRide, pull: ride }
];

// Where a lever's pivot is, in the world: on the wall, `row` cells down from
// the roof, and which way its stem reaches.
export function leverAt(l) {
  const x = l.side === 'left' ? casino.x : casino.x + casino.w;
  return { x, y: casino.y + l.row() * P, dir: l.side === 'left' ? -1 : 1 };
}

// The stem's angle: up when live, flat when dead, and swinging down and back
// over `LEVER_SWING_MS` when it has just been pulled.
export function leverShape(l) {
  const live = l.live();
  const p = S.leverPulled && S.leverPulled.key === l.key ? (now() - S.leverPulled.at) / LEVER_SWING_MS : 2;
  const swing = p < 1 ? Math.sin(p * Math.PI) : 0;          // out and back
  return { live, swing };
}

// The box a pointer has to be in: the stem's reach out from the wall and up
// from the pivot, opened out to `LEVER_HIT` cells on a phone so a thumb can
// find it. Clear of the heaps and the rim by where the levers stand, so a
// lift and a pull cannot be confused.
export function leverBox(l) {
  const { x, y, dir } = leverAt(l);
  const reach = (coarse() ? Math.max(LEVER_HIT, LEVER_REACH) : LEVER_REACH) * P;
  // a cell of the wall itself is in the box too: the pivot stands on it
  const left = dir < 0 ? x - reach : x - P;
  return { x: left, y: y - reach, w: reach + P, h: reach + P * 2 };
}

export function leverUnder(x, y) {
  if (!S.casinoOpen) return null;
  for (const l of LEVERS) {
    const b = leverBox(l);
    if (x >= b.x && x < b.x + b.w && y >= b.y && y < b.y + b.h) return l;
  }
  return null;
}

// Pull one, by key: true when it was live and did its thing. The same call
// the pointer makes, so a check that pulls a lever pulls it the player's way.
export function pullLever(key) {
  const l = LEVERS.find(x => x.key === key);
  if (!l || !S.casinoOpen || !l.live()) return false;
  l.pull();
  S.leverPulled = { key, at: now() };
  return true;
}

// A click or a tap on one.
export function leverHit(x, y) {
  const l = leverUnder(x, y);
  if (!l) return false;
  pullLever(l.key);
  return true;
}
