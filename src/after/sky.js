// The afterlife's sky as a frame (docs/mocks/act3-skycrowd-2026-10-18, round
// 2; docs/wave-act3-build.md, track B): where God's crowd stands, where God
// sits, and how the camera's middle moves both. Read by the camera (view.js)
// and the drawing (render/aftercrowd.js) alike, so the dive arrives on the
// face the drawing puts there.
//
// The sky is laid out off the window the place has at rest -- its floor where
// the yard's ground stands, at the yard's zoom -- so a band's top is a share
// of the sky a player sees there, and the dive magnifies that picture rather
// than laying it out again.
//
// Every layer pans at its own rate: a thing at layer x stands, with the
// window's middle at `cx`, at world x `layerX(x, rate, cx)`, so it stands
// where its x says when the act opens and slides `rate` as fast as the
// camera from there. God is the exception past the opening: the dive turns
// toward him, pulling him to the window's middle as it goes in.

import { S } from '../state.js';
import { P, SKY_BANK, SKY_TOPS, GOD_CELLS, GOD_FIT, GOD_UP, GOD_OPEN_AT, GOD_RATE,
         AFTER_ZOOM_MAX, AFTER_FOCUS_AT } from '../config.js';
import { yardCell } from '../world.js';
import { actPlace } from '../acts.js';
import { afterFloor, afterX0, afterX1, afterOpenX } from './place.js';
import { smoothstep } from '../motion.js';

const clamp01 = v => Math.max(0, Math.min(1, v));
const snap = (v, q) => Math.round(v / q) * q;

// The window the place has at rest, in world px, and its top.
export const restW = () => S.W * P / yardCell();
export const restH = () => S.H * P / yardCell();
export const restTop = () => afterFloor() + actPlace('after').margin - restH();
// The furthest right the window's middle goes: the last window the place has.
export const afterEnd = () => afterX1() - restW() / 2;

// The dive: none left of where the act opens, all of it at the end of the
// pan. `pullAt` is the ease of the way there (how far God is pulled to the
// middle, and the face to its height); the zoom is its square.
export function panAt(cx) {
  const a = afterOpenX(), b = afterEnd();
  return b > a ? clamp01((cx - a) / (b - a)) : 0;
}
export const pullAt = cx => smoothstep(panAt(cx));
export const zoomAt = cx => 1 + (AFTER_ZOOM_MAX - 1) * pullAt(cx) ** 2;

let frame = null, frameKey = '';
export function skyFrame() {
  const top = restTop(), W = restW(), key = `${top}|${W}|${afterOpenX()}`;
  if (frame && key === frameKey) return frame;
  const floor = afterFloor(), bank = floor - SKY_BANK, sky = bank - top;
  const gc = GOD_CELLS.find(c => c * GOD_FIT <= sky) || GOD_CELLS[GOD_CELLS.length - 1];
  const XR = afterOpenX();
  frame = {
    floor, top, bank, sky, W, H: restH(), gc, XR,
    tops: SKY_TOPS.map(f => top + snap(sky * f, P)),
    // God's square's top, its crown's spikes GOD_UP of the sky down off the top.
    gy0: top + snap(sky * GOD_UP + 19 * gc, gc),
    // The window's middle at its furthest left and right.
    c0: afterX0() + W / 2, c1: Math.max(afterEnd(), XR)
  };
  frameKey = key;
  return frame;
}

// A layer's x in the world, with the window's middle at `cx`.
export const layerX = (x, rate, cx) => x + (cx - skyFrame().XR) * (1 - rate);
// God's middle, world x: GOD_OPEN_AT across the window when the act opens,
// sliding at his rate walking toward the camp, pulled to the middle walking on.
export function godMid(cx) {
  const f = skyFrame(), open = f.XR + (GOD_OPEN_AT - 0.5) * f.W;
  if (cx <= f.XR) return open + (cx - f.XR) * (1 - GOD_RATE);
  const at = GOD_OPEN_AT + (0.5 - GOD_OPEN_AT) * pullAt(cx);
  return cx + (at - 0.5) * f.W / zoomAt(cx);
}
// God's face, world y: the middle of his square.
export const faceY = () => { const f = skyFrame(); return f.gy0 + 9 * f.gc; };
// The window's top with the middle at `cx`, at zoom `z` (1 at rest): the
// face carried from where it stands at rest to AFTER_FOCUS_AT down the window.
export function topAt(cx, z) {
  const f = skyFrame(), y = faceY();
  const at = (y - f.top) / f.H + (AFTER_FOCUS_AT - (y - f.top) / f.H) * pullAt(cx);
  return y - at * f.H / z;
}
