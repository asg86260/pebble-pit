// The afterlife's sky as a frame (DESIGN.md, "God's camp stands on a stage in
// the clouds"; the owner, 2026-10-20: the main plane is the yard's camera,
// and only what surrounds it changes): where the horizon is, where God sits
// and his stage. Read by the drawing (render/aftercrowd.js,
// render/after/ground.js).
//
// There is no camera of the act's own. The main plane -- the stations, the
// workers, the pair -- is the world, framed by the yard's view (view.js) like
// any place. God sits far back on a slow layer (GOD_RATE of the camera's
// speed); his stage spans the depths between, its back at his rate and its
// front on the main plane's line at the world's, each line of it in between
// sliding at its own depth's rate -- so the stage leans as the camera pans,
// a causeway seen in perspective, and stands square in the window whose
// middle is its front's middle.
//
// The sky is laid out off the window the place has at rest -- its floor where
// the yard's ground stands, at the yard's zoom.

import { S } from '../state.js';
import { P, SKY_FIT, GOD_CELLS, GOD_FIT, GOD_UP, GOD_RATE, GOD_FOOT, GOD_CROWD, GOD_SIGN_DEEP, GOD_STAGE, AFTER_HORIZON,
         GOD_N, GOD_THRONE, WALK_BODY, WORKER,
         CROWD_X0, CROWD_FILES, CROWD_PITCH, CROWD_NEAR, CROWD_ROW, CROWD_FAR_ROW, GOD_BACK, UNION_CROWD, AFTER_SLICE_GAP } from '../config.js';
import { yardCell } from '../world.js';
import { actPlace } from '../acts.js';
import { afterFloor, afterTop, afterOpenX, campEdges, podiumMid, unionHalf, stationBox, speakerAt } from './place.js';
import { smoothstep } from '../motion.js';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, k) => a + (b - a) * k;
const snap = (v, q) => Math.round(v / q) * q;

// The window the place has at rest, in world px, and its top.
export const restW = () => S.W * P / yardCell();
export const restH = () => S.H * P / yardCell();
export const restTop = () => afterFloor() + actPlace('after').margin - restH();

// The horizon, world y: the sky's ranges stand on it and the far cloud runs
// from it down to the main plane.
export const horizonY = () => afterFloor() - AFTER_HORIZON * P;


// God's camp stands back on the horizon (config, GOD_BACK), one layer, its
// crowd in rows of the yard's square. `far` false is the frame he would have
// standing on the main plane at full size, which only lays the place's end
// (`godFront`).
const frames = new Map();
export function skyFrame(far = true) {
  // The window's top at rest, or the place's own where the window shows past
  // it: the camera is never let above the place.
  const top = Math.max(restTop(), afterTop()), W = restW(), key = `${top}|${W}|${GOD_BACK.size}`, back = far;
  const kept = frames.get(far);
  if (kept && kept.key === key) return kept.frame;
  const floor = afterFloor(), bank = floor - (back ? GOD_BACK.foot : GOD_FOOT) * P;
  // Far, he is laid out in a sky `size` as tall standing on his foot: the
  // same picture, further off.
  const sky = (bank - top) * (back ? GOD_BACK.size : 1), sTop = bank - sky;
  const gc = GOD_CELLS.find(c => c * GOD_FIT <= sky) || GOD_CELLS[GOD_CELLS.length - 1];
  // God's square's top, its crown's spikes GOD_UP of the sky down off the top.
  const gy0 = sTop + snap(sky * GOD_UP + 19 * gc, gc);
  const frame = {
    floor, top, bank, sky, W, H: restH(), gc, XR: afterOpenX(), hor: horizonY(), gy0,
    // A sky cell, world px: half a God-cell, or less where the sky is too
    // short to hold the mock's layout under him.
    h: Math.max(1, Math.floor(Math.min(gc / 2, (bank - gy0) / SKY_FIT) * 2) / 2)
  };
  frames.set(far, { key, frame });
  return frame;
}
// God's face, world y: the middle of his square.
export const faceY = () => { const f = skyFrame(); return f.gy0 + 9 * f.gc; };

// --- God's stage ---------------------------------------------------------------------
// (DESIGN.md, "God's camp stands on a stage in the clouds"; config,
// GOD_STAGE.) His camp: the stage, the throne, his crowd, its flags and
// whoever is up on it, each drawn off the camp's middle at its own depth
// (`campMid`), so a row slides as one piece and nothing on it skates. Its top
// runs from behind his foot forward to the main plane's line. A point on it
// is { dx, y }: world px across from the middle at y, and world y.
let stageMemo = null, stageKey = ''; // cache: keyed by the sky frame (horizon, cell, floor)
export function stage() {
  const f = skyFrame(), G = GOD_STAGE, key = `${f.hor}|${f.h}|${f.floor}`;
  if (stageMemo && key === stageKey) return stageMemo;
  // its front stands up among the far cloud's rows, not on the plane
  const mx = G.mx * f.h, yf = afterFloor() - GOD_BACK.front * P;
  const steps = Math.max(1, Math.ceil((f.bank - f.gy0 - (GOD_N + GOD_THRONE.seatH) * f.h) / (GOD_THRONE.step * f.h)));
  stageMemo = {
    // from behind his foot forward to the main plane's line, which is its foot
    mx, yb: Math.round((f.bank - G.back * P) / P) * P, yf, hb: G.hb * mx, hf: G.hf * mx, foot: yf,
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

// His crowd across the half at world y: the stage's top and `beyond` stage
// cells more out over the cloud either side of it (config, GOD_BACK).
export const crowdHalf = (st, y) => stageHalf(st, y) + GOD_BACK.beyond * st.mx;
// The camp's widest reach either side of its middle, world px: the crowd's
// front row, a soul past it, or the stage's side faces, whichever is out
// further.
export const campHalf = () => {
  const st = stage();
  return Math.max(crowdHalf(st, st.yf) + stageSoul(), st.hf + GOD_STAGE.side * st.mx);
};

// --- the camp across depths --------------------------------------------------------------
// The stage's front middle, world x, and the pan's end: God stands in the
// window's middle when the camera's middle is here. Two things place it,
// and it is the further of the two.
//
// Each camp owns its own slice of the window (the owner, 2026-10-20: "gods
// crowd should be off to the right. each crowd needs their own full vertical
// slice of the view, as well as enough space between them"): the union's --
// its crowd, the pair, their podium -- and right of it his, from his crowd's
// left end to its right, with AFTER_SLICE_GAP cells of open sky between. His
// camp slides at GOD_RATE, a third of the camera, so as the camera pans
// right he comes in at the window's right edge and then gains on the
// union's slice, never closes on it. So it is enough that he comes in only
// once the union's right end is the gap clear of that edge: with his reach
// (`campHalf`) L, the window V and the union's right end u, his left end is
// at the window's edge when the camera's middle is (e r - L - V/2) / r, and
// that must be no sooner than u + gap - V/2 -- solved for the front e, the
// first term below. From there on each has its own slice, at any window.
//
// And the old floor: its front a gap clear of the union's crowd at its
// widest, laid off the near frame, as it stood before his camp stood back.
const fronts = { key: '', x: 0 };
export const godFront = () => {
  const V = restW(), r = GOD_RATE, f = skyFrame(), [lo, hi] = unionSpan(), key = `${V}|${f.h}|${f.top}|${lo}|${hi}`;
  if (key === fronts.key) return fronts.x;
  const clear = hi + AFTER_SLICE_GAP * P - V / 2 + (campHalf() + V / 2) / r;
  const mx = GOD_STAGE.mx * skyFrame(false).h;
  const floor = podiumMid() + unionHalf() + GOD_STAGE.gap * P + GOD_STAGE.hf * mx + GOD_STAGE.side * mx;
  fronts.key = key; fronts.x = snap(Math.max(clear, floor), P);
  return fronts.x;
};
// The union's slice across, world px: its crowd's rows at their widest
// (render/after/unioncrowd.js: a row's souls from the podium's middle out
// its half either way, a soul and its jitter past the last, and a newcomer
// walking in from God's side), and the pedestal and the pair on it.
export const unionSpan = () => {
  const b = stationBox('pedestal'), C = UNION_CROWD, m = podiumMid(), h = unionHalf();
  return [Math.min(b.x, speakerAt(0).x, m - h - C.jit), Math.max(b.x + b.w, speakerAt(1).x + WORKER, m + h + C.n[0] + C.jit + C.walk)];
};
// His slice across with the window's middle at `cx`, world px: his crowd's
// ends either side of his middle.
export const godSpan = cx => { const m = campMid(cx, GOD_RATE), h = campHalf(); return [m - h, m + h]; };
// How fast a line of the camp slides, as a share of the camera's speed: the
// whole camp is one layer at God's rate, the far cloud's own, so nothing on
// it leans.
export const rateAt = () => GOD_RATE;
// The camp's middle at rate `r`, world x, with the window's middle at `cx`:
// every line about the window whose middle is the front's middle.
export const campMid = (cx, r) => { const e = godFront(); return e + (cx - e) * (1 - r); };
// ...and where it stands with the window's middle where the act opens, the
// fixed part a drawing adds its layer's slide to (render/aftercrowd.js).
export const campX0 = r => campMid(afterOpenX(), r);
// God's own middle: the back's.
export const godMid = cx => campMid(cx, GOD_RATE);
// A soul of the sim's field (file `f`, rank `r`, either fractional) as a spot
// on the top: its file across the top, its rank from the front row back,
// kept off the edge and out of the throne's foot. Signs and the
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
// A soul's side on the stage, world px, and the gap between two souls in a
// row and between two rows: every soul one size, in whole cells, so the
// crowd stays on the cell grid and a soul keeps its rim and its middle at
// any window.
export const stageSoul = () => GOD_BACK.soul * P;
export const stageGap = () => GOD_BACK.gap * P;
// A body of the sim's on the top: a soul of its row's size, but no wider
// than most of a file's spacing there, so the members standing side by side
// in the front ranks stand apart and never close up into a bar.
const bodySoul = (st, y) => Math.min(stageSoul(st, y), snap(GOD_CROWD.fileFill * 2 * stageHalf(st, y) / CROWD_FILES, 2));
// A sim body over God's yard, its rank read back off its height.
const rankOf = y => {
  const up = afterFloor() - P * 2 - y, near = CROWD_NEAR * CROWD_ROW;
  return up < near ? Math.max(0, up / CROWD_ROW) : CROWD_NEAR + (up - near) / CROWD_FAR_ROW;
};
// Where a sim point is drawn, with the window's middle at `cx`: { x, y, s,
// ord } -- its middle, its foot, its side and its painting order (its foot).
// On the main plane as it is up to the union's camp's edge on God's side.
// From there to God's yard the way runs along the main plane to the stage's
// left front corner, handed over from the world's slide to God's layer's as
// it goes, growing to the stage's front row's size.
// Into his yard it steps up onto the stage's front edge,
// then out across the top to its spot (the sim walks a straight line from
// the yard's edge to the spot, so where it is on that line is where it is
// between the edge and the spot). The walk in the yard stays the sim's; only
// the eye's way is long.
export function walkSeen(x, y, cx) {
  const a = campEdges()[1], b = CROWD_X0 - CROWD_PITCH, st = stage(), near = WALK_BODY * P;
  const mid = yy => campMid(cx, rateAt(st, yy));
  if (x <= a) return { x, y, s: near, ord: y };
  const corner = stageSpot(0, 0), front = bodySoul(st, corner.y);
  if (x < b) {
    const k = smoothstep((x - a) / (b - a)), fy = lerp(afterFloor(), st.foot, k);
    return { x: lerp(x, mid(corner.y) + corner.dx, k), y: fy, s: lerp(near, front, k), ord: fy };
  }
  const f = (x - CROWD_X0 - P) / CROWD_PITCH;
  if (f < 0) {
    // onto the top's front edge, from its foot
    const k = clamp((x - b) / (CROWD_X0 + P - b), 0, 1), fy = lerp(st.foot, st.yf - P, k);
    return { x: mid(fy) + corner.dx, y: fy, s: front, ord: fy };
  }
  const sp = stageSpot(Math.min(f, CROWD_FILES), rankOf(y));
  return { x: mid(sp.y) + sp.dx, y: sp.y, s: bodySoul(st, sp.y), ord: sp.y };
}
// The share of the way onto God's layer a sim x stands, 0 on the main
// plane: for what is drawn there as the camp draws it and what is not.
export const deepAt = x => smoothstep(clamp((x - campEdges()[1]) / (P * 6), 0, 1));
// Whether world point (x, y) is on God's camp as drawn with the window's
// middle at `cx`: from his crown down to the stage's front, across it.
// A click there is a click on his crowd (after/gestures.js).
export function godCampAt(x, y, cx) {
  const f = skyFrame(), st = stage(), dx = x - campMid(cx, rateAt(st, y));
  return y >= f.gy0 - 12 * f.gc && y <= st.foot && Math.abs(dx) <= (y < st.yb ? st.throne : crowdHalf(st, y));
}
