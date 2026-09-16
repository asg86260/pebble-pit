// The casino's three controls, on the building itself: the arm beside the
// funnel, the bank button at the foot by the chute, the hoist crank beside
// the tray. No board -- every decision about a hand is a thing you do to the
// building, placed where the thing it does happens, so a control says what
// it is by where it stands. A click or a tap works one; each stands ready
// when it can be worked and goes grey, at rest, when it cannot, for the
// reasons the rows were dead. See DESIGN.md, "The stake is a heap you carry".
//
// Owns where each control stands, whether it is live, what working it does,
// and the hit test; render/casino.js draws them off `leverShape`.

import { P, HOPPER_H, TRAY_H, ARM_LENGTH, ARM_BOSS, ARM_SWING, LEVER_REACH, LEVER_HIT, LEVER_SWING_MS,
         BUTTON_PRESS_MS, BUTTON_RECESS, CRANK_TURNS } from './config.js';
import { S, casino } from './state.js';
import { canLet, letGo, canBank, bank, canRide, ride } from './casino.js';
import { now } from './clock.js';
import { coarse } from './prefs.js';

// Each control: what it is, which wall it is on, how far down the building
// it sits, and the two halves of a decision -- may it, and do it. The arm
// stands at the throat's height; the button and the crank at the tray's.
export const LEVERS = [
  { key: 'casino-gate', name: 'the arm', kind: 'arm',
    side: 'right', row: () => HOPPER_H - 2, live: canLet, pull: letGo },
  { key: 'casino-chute', name: 'bank it', kind: 'button',
    side: 'left', row: () => casino.h / P - TRAY_H - 1, live: canBank, pull: bank },
  { key: 'casino-crank', name: 'the crank', kind: 'crank',
    side: 'right', row: () => casino.h / P - LEVER_REACH, live: canRide, pull: ride }
];

// Where a control's pivot is, in the world: on the wall, `row` cells down
// from the roof, and which way it reaches out. The arm's pivot stands out
// from the wall on its boss, so the stem rises beside the funnel's wall
// rather than along it. The button sits on the wall's outer face a cell
// above the hatch, so its pivot is its bottom right corner on the wall; the
// crank turns low on the wall, under the box that says what the hand came
// to.
export function leverAt(l) {
  const dir = l.side === 'left' ? -1 : 1;
  const wall = l.side === 'left' ? casino.x : casino.x + casino.w;
  const x = wall + (l.kind === 'arm' ? dir * ARM_BOSS * P : 0);
  return { x, y: casino.y + l.row() * P, dir, wall };
}

// How far along its motion a control is, from the moment it was worked.
const since = l => S.leverPulled && S.leverPulled.key === l.key ? now() - S.leverPulled.at : Infinity;

// The shape to draw. The arm: its angle from straight up, swinging down
// through `ARM_SWING` over `LEVER_SWING_MS` and back up over twice that,
// and lying at the bottom of the swing when dead. The button: whether its
// cap is sunk. The crank: how far its handle has turned, a few full turns
// over the hoist, driven by the sand so it comes to rest as the tray
// empties.
export function leverShape(l) {
  const live = l.live();
  if (l.kind === 'arm') {
    const t = since(l) / LEVER_SWING_MS;
    // the pull itself is drawn black to the bottom of the swing whether or
    // not the hand it let go has already made the arm dead; a dead arm then
    // lies where the pull left it
    const k = t < 1 ? t : !live ? 1 : t < 3 ? 1 - (t - 1) / 2 : 0;
    return { live: live || t < 1, angle: ARM_SWING * k };
  }
  if (l.kind === 'button') return { live, pressed: since(l) < BUTTON_PRESS_MS };
  // black while it turns, too: a crank being wound is being worked
  const h = S.hoisting;
  const turn = h ? (h.lifted / Math.max(1, h.grains)) * CRANK_TURNS : 0;
  return { live: live || !!h, angle: (turn % 1) * Math.PI * 2 };
}

// The box a pointer has to be in. The arm's is the whole of its swing, the
// loudest target on the building; the button's is its recess; the crank's
// the circle its handle turns through. Each opens out to `LEVER_HIT` cells
// on a phone so a thumb can find it, and each takes in a cell of the wall,
// since the pivot stands on it.
export function leverBox(l) {
  const { y, dir, wall } = leverAt(l);
  const grow = coarse() ? LEVER_HIT : 0;
  if (l.kind === 'button') {
    const rim = BUTTON_RECESS + 2;
    const out = Math.max(rim, grow), up = Math.max(rim, grow), down = Math.max(0, grow / 2);
    return { x: wall - out * P, y: y - up * P, w: (out + 1) * P, h: (up + down) * P };
  }
  let out, up, down;
  if (l.kind === 'arm') { out = ARM_LENGTH + ARM_BOSS + 2; up = ARM_LENGTH + 2; down = Math.ceil(ARM_LENGTH * Math.sin(ARM_SWING - Math.PI / 2)) + 2; }
  else { out = LEVER_REACH + 1; up = LEVER_REACH + 1; down = LEVER_REACH + 1; }
  out = Math.max(out, grow); up = Math.max(up, grow); down = Math.max(down, grow / 2);
  const left = dir < 0 ? wall - out * P : wall - P;
  return { x: left, y: y - up * P, w: (out + 1) * P, h: (up + down) * P };
}

export function leverUnder(x, y) {
  if (!S.casinoOpen) return null;
  for (const l of LEVERS) {
    const b = leverBox(l);
    if (x >= b.x && x < b.x + b.w && y >= b.y && y < b.y + b.h) return l;
  }
  return null;
}

// Work one, by key: true when it was live and did its thing. The same call
// the pointer makes, so a check that pulls the arm pulls it the player's way.
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
