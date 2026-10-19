// The afterlife's sky and depth as a frame (DESIGN.md, "The camps are far
// apart for the eye, not for the walk", "God's camp stands in the clouds"):
// where the horizon is, how deep a thing stands and where that puts it, where
// God sits and his crowd. Read by the camera (view.js) and the drawing
// (render/aftercrowd.js, render/after/cloudfloor.js) alike.
//
// The camera only slides. Depth is the one camera every far thing goes
// through: a floor point at floor x `u` and depth `d` (the near layer, where
// the workshops and the union's camp stand, at 1) is drawn, with the window's
// middle at `cx`, at world x `cx + (u - cx) / d`, its foot AFTER_HORIZON / d
// cells under the horizon, 1/d its size. So it slides 1/d as fast as the
// camera -- the sliding camera is a perspective camera stepping sideways --
// and a body walking back into depth shrinks and slows as it goes, at its
// own depth's speed. The near layer is the world as the sim has it.
//
// The sky is laid out off the window the place has at rest -- its floor where
// the yard's ground stands, at the yard's zoom.

import { S } from '../state.js';
import { P, SKY_FIT, GOD_CELLS, GOD_FIT, GOD_UP, GOD_DEPTH, GOD_FAR, GOD_CROWD, GOD_SIGN_DEEP, AFTER_HORIZON,
         CROWD_X0, CROWD_FILES, CROWD_PITCH, CROWD_NEAR, CROWD_ROW, CROWD_FAR_ROW } from '../config.js';
import { yardCell } from '../world.js';
import { actPlace } from '../acts.js';
import { afterFloor, afterTop, afterX1, afterOpenX, unionX1, campEdges, crowdX1 } from './place.js';
import { smoothstep } from '../motion.js';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, k) => a + (b - a) * k;
const snap = (v, q) => Math.round(v / q) * q;

// The window the place has at rest, in world px, and its top.
export const restW = () => S.W * P / yardCell();
export const restH = () => S.H * P / yardCell();
export const restTop = () => afterFloor() + actPlace('after').margin - restH();

// --- the depth camera ---------------------------------------------------------------
export const horizonY = () => afterFloor() - AFTER_HORIZON * P;
// A floor point's foot, world y, at depth d; and the depth under world y.
export const footY = d => horizonY() + AFTER_HORIZON * P / d;
export const depthAtY = y => AFTER_HORIZON * P / Math.max(1e-3, y - horizonY());
// A floor point's world x with the window's middle at `cx`, and back.
export const seenX = (u, d, cx) => cx + (u - cx) / d;
export const floorX = (x, d, cx) => cx + (x - cx) * d;

// God's throne's floor x: GOD_FAR windows past the union's camp, so his
// layer and the union's would only meet past the window's right edge.
export const godU = () => unionX1() + GOD_FAR * restW();
// The furthest right the window's middle goes: God's throne in its middle,
// or the place's own last window if that is further.
export const afterEnd = () => Math.max(afterX1() - restW() / 2, godU());
// The camera's right limit (acts.js, the place's `x1`).
export const afterReach = () => afterEnd() + restW() / 2;
// God's middle, world x, with the window's middle at `cx`.
export const godMid = cx => seenX(godU(), GOD_DEPTH, cx);
// God's camp slides as one at his depth's speed, his crowd and what stands in
// it with him (the voted mock's), so it stays a band at his feet however the
// camera stands: a point of it is drawn off his middle, its offset from his
// floor x at its own depth's scale.
export const campX = (u, d, cx) => godMid(cx) + (u - godU()) / d;
// A floor point `p` ({ u, d, k }) drawn, world x: `k` of the way from the
// near layer's camera (0) to God's camp's (1).
export const pointX = (p, cx) => { const a = seenX(p.u, p.d, cx); return a + (campX(p.u, p.d, cx) - a) * (p.k || 0); };
// And back: the floor x a world x stands at, at depth d, `k` into the camp.
export const pointU = (x, d, k, cx) => {
  const a = seenX(0, d, cx), b = campX(0, d, cx), o = a + (b - a) * k;
  return (x - o) * d;
};

let frame = null, frameKey = '';
export function skyFrame() {
  // The window's top at rest, or the place's own where the window shows past
  // it: the camera is never let above the place.
  const top = Math.max(restTop(), afterTop()), W = restW(), key = `${top}|${W}`;
  if (frame && key === frameKey) return frame;
  const floor = afterFloor(), bank = footY(GOD_DEPTH), sky = bank - top;
  const gc = GOD_CELLS.find(c => c * GOD_FIT <= sky) || GOD_CELLS[GOD_CELLS.length - 1];
  // God's square's top, its crown's spikes GOD_UP of the sky down off the top.
  const gy0 = top + snap(sky * GOD_UP + 19 * gc, gc);
  frame = {
    floor, top, bank, sky, W, H: restH(), gc, XR: afterOpenX(), hor: horizonY(), gy0,
    // A sky cell, world px: half a God-cell, or less where the sky is too
    // short to hold the mock's layout under him.
    h: Math.max(1, Math.floor(Math.min(gc / 2, (bank - gy0) / SKY_FIT) * 2) / 2)
  };
  frameKey = key;
  return frame;
}
// God's face, world y: the middle of his square.
export const faceY = () => { const f = skyFrame(); return f.gy0 + 9 * f.gc; };

// --- God's crowd on the floor ------------------------------------------------------
// The crowd's half-width as drawn at depth d, world px, lerped from its
// front to its back.
const crowdK = d => clamp((d - GOD_CROWD.front) / (GOD_CROWD.back - GOD_CROWD.front), 0, 1);
export const crowdHalf = d => lerp(GOD_CROWD.hf, GOD_CROWD.hb, crowdK(d)) * skyFrame().h;
// A soul of the sim's field (file `f`, rank `r`, either fractional) as a
// floor point in God's crowd: its file across the crowd at its depth, its
// rank from the front row back. Signs, posters and the bodies among them
// stand there.
export function crowdPoint(f, r) {
  const d = lerp(GOD_CROWD.front, GOD_CROWD.back, clamp(r / GOD_SIGN_DEEP, 0, 1));
  const a = clamp((f + 0.5) / CROWD_FILES, 0, 1) * 2 - 1;
  return { u: godU() + a * crowdHalf(d) * d * 0.85, d, k: 1 };
}
// A sim body over God's yard's field, its rank read back off its height.
const rankOf = y => {
  const up = afterFloor() - P * 2 - y, near = CROWD_NEAR * CROWD_ROW;
  return up < near ? Math.max(0, up / CROWD_ROW) : CROWD_NEAR + (up - near) / CROWD_FAR_ROW;
};
// Where a sim point is drawn in depth: the near layer as it is up to the
// union's camp's edge on God's side; from there to God's yard the way runs
// back into depth, a straight line on the floor to his crowd's front, handed
// over from the near layer's camera to his camp's as it goes; over his yard,
// its spot in the crowd. { u, d, k }: the floor point (`pointX`). The walk
// in the yard stays the sim's; only the eye's way is long.
export function walkPoint(x, y) {
  const a = campEdges()[1], b = CROWD_X0 - CROWD_PITCH;
  if (x <= a) return { u: x, d: 1, k: 0 };
  const front = crowdPoint((x - CROWD_X0 - P) / CROWD_PITCH, 0);
  if (x < b) {
    const k = (x - a) / (b - a);
    return { u: lerp(a, front.u, k), d: lerp(1, front.d, k), k };
  }
  if (x > crowdX1() + CROWD_PITCH) {
    // Past the field, toward the throne's foot.
    const k = clamp((x - crowdX1() - CROWD_PITCH) / (CROWD_PITCH * 8), 0, 1);
    const end = crowdPoint(CROWD_FILES, rankOf(y));
    return { u: lerp(end.u, godU(), k), d: lerp(end.d, GOD_DEPTH * 0.96, k), k: 1 };
  }
  return crowdPoint((x - CROWD_X0 - P) / CROWD_PITCH, rankOf(y));
}
// The share of the way into depth a sim x stands, 0 on the near layer: for
// what is drawn there as the near layer draws it and what is not.
export const deepAt = x => smoothstep(clamp((x - campEdges()[1]) / (P * 6), 0, 1));
// Whether world point (x, y) is on God's camp as drawn with the window's
// middle at `cx`: from his crown down to his crowd's front, across his
// crowd. A click there is a click on his crowd (after/gestures.js).
export function godCampAt(x, y, cx) {
  const f = skyFrame(), hw = crowdHalf(GOD_CROWD.front);
  return y >= f.gy0 - 12 * f.gc && y <= footY(GOD_CROWD.front) + P && Math.abs(x - godMid(cx)) <= hw;
}
