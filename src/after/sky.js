// The afterlife's sky and depth as a frame (DESIGN.md, "The camps are far
// apart for the eye, not for the walk", "God's camp stands in the clouds",
// "God's camp stands on a stage in the clouds"): where the horizon is, how
// deep a thing stands and where that puts it, where God sits, and his stage. Read by the camera (view.js) and the drawing
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
import { P, SKY_FIT, GOD_CELLS, GOD_FIT, GOD_UP, GOD_DEPTH, GOD_FAR, GOD_CROWD, GOD_SIGN_DEEP, GOD_STAGE, AFTER_HORIZON,
         GOD_N, GOD_THRONE, WALK_BODY,
         CROWD_X0, CROWD_FILES, CROWD_PITCH, CROWD_NEAR, CROWD_ROW, CROWD_FAR_ROW } from '../config.js';
import { yardCell } from '../world.js';
import { actPlace } from '../acts.js';
import { afterFloor, afterTop, afterX1, afterOpenX, unionX1, campEdges } from './place.js';
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
// God's camp slides as one at his depth's speed (his stage, below): a floor
// point handed over to it is drawn off his middle, its offset from his floor
// x at its own depth's scale.
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

// --- God's stage ---------------------------------------------------------------------
// (DESIGN.md, "God's camp stands on a stage in the clouds"; config,
// GOD_STAGE.) His camp is one flat card: the stage, the throne, his crowd,
// its flags and whoever is up on it, all drawn off his middle and sliding
// with him, so nothing on it skates. Its top is cheated far deeper than his
// depth would give, so it reads as a stage seen from above. A point on it
// is { dx, y }: world px across from his middle, and world y.
let stageMemo = null, stageKey = '';
export function stage() {
  const f = skyFrame(), G = GOD_STAGE, key = `${f.hor}|${f.h}`;
  if (stageMemo && key === stageKey) return stageMemo;
  const mx = G.mx * f.h, at = c => f.hor + c * P;
  const steps = Math.max(1, Math.ceil((f.bank - f.gy0 - (GOD_N + GOD_THRONE.seatH) * f.h) / (GOD_THRONE.step * f.h)));
  stageMemo = {
    mx, yb: at(G.back), yf: at(G.front), hb: G.hb * mx, hf: G.hf * mx, stepW: G.stepW * mx,
    foot: at(G.front + G.rise + G.steps * (G.tread + G.riser)),
    // the throne's base at its bottom step, across the half, and its foot
    throne: (GOD_THRONE.baseHalf + GOD_THRONE.step * (steps - 1)) * f.h, throneY: f.bank
  };
  stageKey = key;
  return stageMemo;
}
// The top's half-width at world y.
export const stageHalf = (st, y) => lerp(st.hb, st.hf, clamp((y - st.yb) / (st.yf - st.yb), 0, 1));
// How far toward the front a world y on the top stands, 0 the back, 1 the front.
export const stageFore = (st, y) => clamp((y - st.yb) / (st.yf - st.yb), 0, 1);
// A soul of the sim's field (file `f`, rank `r`, either fractional) as a spot
// on the top: its file across the top, its rank from the front row back,
// kept off the edge and out of the throne's foot. Signs, posters and the
// bodies among them stand there.
export function stageSpot(f, r) {
  const st = stage(), m = GOD_CROWD.margin * st.mx;
  const y = lerp(st.yf - P, st.yb + 6 * P, clamp(r / GOD_SIGN_DEEP, 0, 1));
  const hw = stageHalf(st, y) - m - 4 * st.mx;
  let dx = (clamp((f + 0.5) / CROWD_FILES, 0, 1) * 2 - 1) * hw;
  // out of the throne's foot: pushed to its side
  const clear = st.throne + 4 * st.mx;
  if (y < st.throneY + 8 * P && Math.abs(dx) < clear) dx = (dx < 0 ? -1 : 1) * lerp(clear, hw, Math.abs(dx) / clear * 0.5);
  return { dx, y };
}
// A soul's side on the stage at world y, world px: the giant's scale, growing
// toward the front, on the cell grid.
export const stageSoul = (st, y) => Math.max(P, snap(lerp(GOD_CROWD.n[0], GOD_CROWD.n[1], stageFore(st, y)) * st.mx, P));
// A sim body over God's yard, its rank read back off its height.
const rankOf = y => {
  const up = afterFloor() - P * 2 - y, near = CROWD_NEAR * CROWD_ROW;
  return up < near ? Math.max(0, up / CROWD_ROW) : CROWD_NEAR + (up - near) / CROWD_FAR_ROW;
};
// Where a sim point is drawn, with the window's middle at `cx`: { x, y, s,
// ord } -- its middle, its foot, its side and its painting order (its foot).
// The near layer as it is up to the union's camp's edge on God's side. From
// there to God's yard the way crosses the cloud to the plinth's foot at its
// left front corner, handed over from the near layer's slide to the stage's
// as it goes (so a body there slides between the two speeds, the stage's at
// the foot), growing to the stage's front row's size. (The stage stands far
// lower on the window than his depth would put it -- the cheat -- so the
// floor's own perspective from the near layer to that foot would sweep a
// body across the window in a few steps.)
// Into his yard it climbs straight up the plinth to the top's front edge,
// then out across the top to its spot (the sim walks a straight line from
// the yard's edge to the spot, so where it is on that line is where it is
// between the edge and the spot). The walk in the yard stays the sim's; only
// the eye's way is long.
export function walkSeen(x, y, cx) {
  const a = campEdges()[1], b = CROWD_X0 - CROWD_PITCH, st = stage(), gm = godMid(cx);
  const body = d => WALK_BODY * P / d;
  if (x <= a) return { x, y, s: body(1), ord: y };
  const corner = stageSpot(0, 0), front = stageSoul(st, corner.y);
  if (x < b) {
    const k = smoothstep((x - a) / (b - a)), fy = lerp(afterFloor(), st.foot, k);
    return { x: lerp(x, gm + corner.dx, k), y: fy, s: lerp(body(1), front, k), ord: fy };
  }
  const f = (x - CROWD_X0 - P) / CROWD_PITCH;
  if (f < 0) {
    // up the plinth's face, from its foot to the top's front edge
    const k = clamp((x - b) / (CROWD_X0 + P - b), 0, 1), fy = lerp(st.foot, st.yf - P, k);
    return { x: gm + corner.dx, y: fy, s: front, ord: fy };
  }
  const sp = stageSpot(Math.min(f, CROWD_FILES), rankOf(y));
  return { x: gm + sp.dx, y: sp.y, s: stageSoul(st, sp.y), ord: sp.y };
}
// The share of the way into depth a sim x stands, 0 on the near layer: for
// what is drawn there as the near layer draws it and what is not.
export const deepAt = x => smoothstep(clamp((x - campEdges()[1]) / (P * 6), 0, 1));
// Whether world point (x, y) is on God's camp as drawn with the window's
// middle at `cx`: from his crown down to the plinth's foot, across the stage.
// A click there is a click on his crowd (after/gestures.js).
export function godCampAt(x, y, cx) {
  const f = skyFrame(), st = stage(), dx = x - godMid(cx);
  return y >= f.gy0 - 12 * f.gc && y <= st.foot && Math.abs(dx) <= (y < st.yb ? st.throne : stageHalf(st, y) + 2 * st.stepW);
}
