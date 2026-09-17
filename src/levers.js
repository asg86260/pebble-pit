// The casino's controls, on the building itself: the arm beside the funnel,
// a throttle dragged to pour the stake in or back out, and the sign under
// the throat, tapped to drop it.
// No board -- the stake is what you held for and the sign is what you
// press, so the building says what it does where it does it. See DESIGN.md,
// "The pour".
//
// Owns where each control stands, whether it is live, what working it does,
// and the hit test; render/casino.js draws them off `leverShape`.

import { P, HOPPER_H, GATE_H, CASINO_SIGN_H, ARM_LENGTH, ARM_BOSS, ARM_KNOB, ARM_SWING, LEVER_HIT, LEVER_SWING_MS } from './config.js';
import { S, casino } from './state.js';
import { canHold, holdArm, setThrottle, canDrop, dropIt } from './casino.js';
import { now } from './clock.js';
import { coarse } from './prefs.js';

// The arm: which wall it is on, how far down the building its boss sits, and
// the two halves of a decision -- may it, and do it. It stands beside the
// funnel, on a boss out from the right wall.
export const LEVERS = [
  { key: 'casino-gate', name: 'the arm', kind: 'arm',
    side: 'right', row: () => HOPPER_H - 2, live: canHold, hold: holdArm }
];

// Where the arm's pivot is, in the world: on the wall, `row` cells down from
// the roof, and which way it reaches out. The pivot stands out from the wall
// on its boss, so the stem rises beside the funnel's wall rather than along
// it.
export function leverAt(l) {
  const dir = l.side === 'left' ? -1 : 1;
  const wall = l.side === 'left' ? casino.x : casino.x + casino.w;
  const x = wall + dir * ARM_BOSS * P;
  return { x, y: casino.y + l.row() * P, dir, wall };
}

// The arm's angle for a throttle: rest is the middle of the throw, a full
// pull the bottom, a full push the top.
const HALF = ARM_SWING / 2;
const angleOf = throttle => HALF + throttle * HALF;

// The arm's shape to draw: held, it stands where the hand has it, black;
// let go, it springs back to rest over `LEVER_SWING_MS` from wherever it
// was; dead, it lies at the bottom of its swing, grey.
export function leverShape(l) {
  const live = l.live();
  if (S.holding) return { live: true, angle: angleOf(S.throttle), throttle: S.throttle };
  if (!live) return { live, angle: ARM_SWING, throttle: 1 };
  const p = S.leverPulled && S.leverPulled.key === l.key ? S.leverPulled : null;
  const k = p ? Math.max(0, 1 - (now() - p.at) / LEVER_SWING_MS) : 0;
  const throttle = (p ? p.from : 0) * k;
  return { live, angle: angleOf(throttle), throttle };
}

// Where a point puts the throttle: the angle of the point round the pivot,
// from straight up, taken as the arm's angle and read against the throw.
export function throttleAt(l, x, y) {
  const at = leverAt(l);
  const dx = (x - at.x) * at.dir, dy = y - at.y;
  const angle = Math.atan2(Math.max(0, dx), -dy);       // 0 up, pi down; never behind the wall
  return Math.max(-1, Math.min(1, (angle - HALF) / HALF));
}

// The box a pointer has to be in: the whole of the arm's swing, the loudest
// target on the building, opened out to `LEVER_HIT` cells on a phone so a
// thumb can find it, and taking in a cell of the wall, since the pivot
// stands on it.
export function leverBox(l) {
  const { y, dir, wall } = leverAt(l);
  const grow = coarse() ? LEVER_HIT : 0;
  let out = ARM_LENGTH + ARM_BOSS + ARM_KNOB, up = ARM_LENGTH + ARM_KNOB, down = Math.ceil(ARM_LENGTH * Math.sin(ARM_SWING - Math.PI / 2)) + ARM_KNOB;
  out = Math.max(out, grow); up = Math.max(up, grow); down = Math.max(down, grow / 2);
  const left = dir < 0 ? wall - out * P : wall - P;
  return { x: left, y: y - up * P, w: (out + 1) * P, h: (up + down) * P };
}
const inBox = (b, x, y) => x >= b.x && x < b.x + b.w && y >= b.y && y < b.y + b.h;

export function leverUnder(x, y) {
  if (!S.casinoOpen) return null;
  for (const l of LEVERS) if (inBox(leverBox(l), x, y)) return l;
  return null;
}

// The sign under the throat: the building's width, the sign band's height.
// It is a button only while a stake stands in the funnel.
export const signBox = () => ({ x: casino.x, y: casino.y + (HOPPER_H + GATE_H) * P, w: casino.w, h: CASINO_SIGN_H * P });
export const signUnder = (x, y) => S.casinoOpen && canDrop() && inBox(signBox(), x, y);

// A press on the arm grabs it where the pointer is, a drag moves it, and a
// release lets it go; a tap on the sign drops the stake. The same calls the
// pointer makes, so a check that holds the arm holds it the player's way.
export function holdAt(x, y) {
  const l = leverUnder(x, y);
  if (!l || !l.live()) return false;
  return l.hold(true, throttleAt(l, x, y));
}
export function dragArm(x, y) {
  if (!S.holding) return false;
  setThrottle(throttleAt(LEVERS[0], x, y));
  return true;
}
export const releaseArm = () => { if (S.holding) holdArm(false); };
export function tapAt(x, y) {
  if (!signUnder(x, y)) return false;
  return dropIt();
}
