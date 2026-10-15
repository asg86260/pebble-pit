// Where the deep is, and where everything in it stands.
//
// The deep lies under the world, below the yard's bottom edge: a body that
// goes down the shaft arrives somewhere real, and every position in the deep
// is an ordinary world position that the route, the camera and the drawing
// all read the same way. Nothing here moves on its own except the serpent's
// body, which is a function of the clock, of the sway its stuns have held
// back (`serpentStill`, saved) and of its phase's lash (deep/phases.js).
//
// Track SERPENT owns this file (docs/wave-serpent.md); every other track reads
// it.

import { now } from '../clock.js';
import { S, pit } from '../state.js';
import { P, PLINTH_H, PLINTH_OVER, DEEP_GAP, DEEP_H, DEEP_SURFACE, DEEP_LEFT, DEEP_W, DEEP_MOUTH, DEEP_SPOTS, DEEP_SLOTS,
         COIL_SEGS, COIL_X0, COIL_X1, COIL_Y, COIL_AMP,
         COIL_WAVES, COIL_SWAY_MS, HEAD_SEGS, COIL_HEAD, COIL_NECK, COIL_NECK_EASE, COIL_GIRTH, COIL_TAIL_FROM, COIL_TIP, SPLIT_LENGTHS, SPLIT_WRITHE, SPLIT_WRITHE_MS, BELLY_AT, CRUSHER_W, CRUSHER_H, HOPPER_W, HOPPER_LIP,
         GATHER_TOSS_FROM, POD_W, POD_H, POD_GAP, POD_COLS, DEEP_PORTAL_R, DEEP_PORTAL_DOWN, DEEP_PORTAL_AT, PORTAL_INTO_WALL,
         WORKER, PROP_GAP, PROP_GAP_OF, LASH_TAUT, LASH_LIFT, LASH_H, LASH_W ,
         BREAK_DIVE_OVER, BREAK_ROAR_H,
         PORTAL_LIP_TO, PORTAL_TEAR_LOBE, PORTAL_TEAR_JITTER, NEARDEATH } from '../config.js';
import { tautK, lashK, diveK, roarK, renewed, killSway, killDrop, killA, recoilPose, rearPose } from './phases.js';
import { PROPS, propKey } from './props.js';
import { abyssLine, pitDepth } from '../pit.js';

const snap = v => Math.round(v / P) * P;
const NEAR_SAG_TAIL = NEARDEATH.sagTail;

export const deepTop = () => snap(S.worldH + DEEP_GAP);
export const deepFloor = () => deepTop() + DEEP_H;
export const deepX0 = () => snap(Math.max(0, pit.x - DEEP_LEFT));
export const deepX1 = () => deepX0() + DEEP_W;
export const deepRect = () => ({ x: deepX0(), y: deepTop(), w: DEEP_W, h: DEEP_H });
// The ground a thing at world height y stands on: the deep's floor for
// anything down there, the yard's ground line for anything else. What a bar,
// a fence or a mark is hung off, so each is drawn in the half its site is in.
export const groundOf = y => (y != null && y > deepTop() ? deepFloor() : S.groundY);
export const inDeep = (x, y) => y >= deepTop() && y <= deepFloor() && x >= deepX0() && x <= deepX1();

// The shaft: where a body steps off the plank into the drowned pit, and where
// it comes up again. The same x at the top and at the bottom, so the way down
// is straight.
export const mouthX = () => snap(pit.x + DEEP_MOUTH);

// The wizards' portal, and the deep's way in and out for the player: a hole
// torn into the drowned pit's near wall, as tall as the abyss is deep, most
// of it in the ground (DESIGN.md, "Two crews and a portal", the owner's
// call). The snatch's own whirlpool opens on the surface at the mouth, where
// the pair stand.
export function portalCircle() {
  const line = abyssLine(), floor = S.groundY + pitDepth();
  const r = snap((floor - line) / 2);
  return { x: snap(pit.x + r * (1 - PORTAL_INTO_WALL)), y: snap((line + floor) / 2), r };
}
export const portalX = () => portalCircle().x;
// How far out from its middle the hole reaches at radius `r`: the lip's
// outer edge where the tear's lobes and jitter carry it furthest. Here rather
// than with the drawing, so the yard can keep clear of it too (glimpse.js).
export const portalReach = (r = portalCircle().r) =>
  r * (PORTAL_LIP_TO + PORTAL_TEAR_LOBE + PORTAL_TEAR_JITTER * 5);
// Its other end in the deep, hanging in the water across the deep's middle
// rather than under the yard's end, which stands near the deep's left edge:
// the way up, and where the deep's camera opens.
export function deepPortal() {
  const r = DEEP_PORTAL_R;
  return { x: snap(deepX0() + DEEP_PORTAL_AT * DEEP_W), y: snap(deepTop() + DEEP_SURFACE + P * 2 + DEEP_PORTAL_DOWN + r), r };
}

// How far the drowned pit's surface stands from the deep's underside of it:
// the deep's water is the pit's liquid carried on below (render/abyssfield.js),
// so a row down here is this far from the same row of the pit's liquid.
export const waterShift = () => snap(abyssLine() - (deepTop() + DEEP_SURFACE));

// A station's middle, on the floor.
export const spotX = key => snap(deepX0() + DEEP_SPOTS[key] * DEEP_W);

// --- the party's floor (docs/wave-party.md) ------------------------------------
// A station stands at a floor slot, not at a spot of its kind's: a kind can
// stand twice, and the floor fills in the order stations are bought. Slot
// `i`'s middle, on the floor.
export const slotX = i => snap(deepX0() + DEEP_SLOTS[i] * DEEP_W);
// A station is its fighter and a prop (DESIGN.md, "A station is its fighter
// and a prop"). The fighter's post: the left of its body, standing on the
// floor over its slot's middle -- where it swims to (deep/classes.js) and
// where it is stood when it is made (crew/deep.js). On the cell grid, as
// everything at rest is: a body three cells wide cannot be centered on a
// cell line, and half a cell off, the gap to its prop was never a whole
// number of cells.
export const postX = st => snap(slotX(st.slot) - WORKER / 2);
// The top of the plinth a station stands on (PLINTH_H), and the fighter's
// post on it: where its body's top is, stood there.
export const plinthTop = () => deepFloor() - PLINTH_H * P;
export const postY = () => plinthTop() - WORKER;
// The prop, on the floor, its right-hand column PROP_GAP cells short of the
// body's left column (PROP_GAP_OF where a class carries its kit further
// off). Its own grid, top-left: a cell of the drawing is a cell here, and
// the props are drawn big (deep/props.js), so this is most of the station.
export function propRect(st) {
  const key = propKey(st), rows = PROPS[key].rows;
  const right = postX(st) / P - (PROP_GAP_OF[st.cls] ?? PROP_GAP);
  const w = rows[0].length * P, h = rows.length * P;
  return { key, x: (right + 1) * P - w, y: plinthTop() - h, w, h };
}
// The plinth: its top course from PLINTH_OVER cells left of the prop to as
// far right of the body, each course under it a cell wider at both ends.
// `x`, `w` are the top course's; `step` how much each course down gains a side.
export function plinthRect(st) {
  const x = propRect(st).x - PLINTH_OVER * P, right = postX(st) + WORKER + PLINTH_OVER * P;
  return { x, y: plinthTop(), w: right - x, h: PLINTH_H * P, step: P };
}
// A station's ground: the prop and the fighter's post together, from the
// prop's left column to the body's right edge and from the taller of the two
// down to the floor. What the pointer opens its board on, the build's
// scaffold stands round and the works stack over: read off the prop the
// station stands beside now, so it answers to the picture. A station still
// going up has no class, so its scaffold stands round the crate's ground.
export function standOfStation(st) {
  const p = propRect(st), b = plinthRect(st), out = (PLINTH_H - 1) * b.step;
  const y = Math.min(p.y, postY());
  return { x: b.x - out, y, w: b.w + 2 * out, h: deepFloor() - y };
}
// The crusher at the deep's left end, standing on the floor, and the hopper
// across its top: the purse's mouth (DESIGN.md, "The crusher"). A scale is
// taken once it is inside the mouth and HOPPER_LIP below its rim.
export const crusherRect = () => ({ x: snap(spotX('crusher') - CRUSHER_W / 2), y: deepFloor() - CRUSHER_H,
                                     w: CRUSHER_W, h: CRUSHER_H });
export const hopperRect = () => {
  const c = crusherRect();
  return { x: snap(c.x + (CRUSHER_W - HOPPER_W) / 2), y: c.y, w: HOPPER_W, h: HOPPER_LIP };
};
export const inHopper = (x, y) => {
  const h = hopperRect();
  return x >= h.x && x < h.x + h.w && y >= h.y + h.h && y < h.y + CRUSHER_H / 2;
};
// Pod `i`, bottom course first and left to right within a course, standing
// on the deep's floor at the pods' spot; and the ground the stack stands on,
// for the build going up there and the pointer.
export function podAt(i) {
  const across = POD_COLS * (POD_W + POD_GAP) - POD_GAP;
  const left = snap(spotX('pods') - across / 2);
  const col = i % POD_COLS, row = Math.floor(i / POD_COLS);
  return { x: left + col * (POD_W + POD_GAP), y: deepFloor() - (row + 1) * (POD_H + POD_GAP) + POD_GAP,
           w: POD_W, h: POD_H };
}
export const podsRect = () => {
  const a = podAt(0), top = podAt(Math.max(0, S.pods)).y;
  const across = POD_COLS * (POD_W + POD_GAP) - POD_GAP;
  return { x: a.x, y: top, w: across, h: deepFloor() - top };
};

// Where a gatherer stands to toss a load in: on the floor, beside the
// crusher on the side the rest of the deep is.
export const tossX = () => crusherRect().x + CRUSHER_W + GATHER_TOSS_FROM;

// The serpent's centerline at `u` segments from the head (fractional), at
// time `t` in ms. The line it lies along is a travelling wave across the
// deep (and in the splitting stage a thrash running down it on top); the
// body is laid ALONG that line from the head, a fixed length a segment, so
// it never stretches on a slope or bunches on a crest -- read off each
// segment's own x, the wave pulled the segments apart and together as it
// passed. The tail's end drifts in and out as the wave goes by instead.
// Unsnapped, so the body can be laid smoothly along it; everything that
// asks where a segment is uses `coilAt`, the same point on the grid. Every
// reader comes through `coilLine`, which turns the clock into the coil's.
// `waveLine(t)` is the line at one instant, everything but x worked out
// once: the walk below asks it for thousands of points a frame.
// The lash (deep/phases.js) bends it too: drawn up in the warning, its sway
// cut and its tail lifted, then a bump run down it head to tail.
const waveLine = t => {
  const x0 = coilX0(), span = coilSpan(), base = deepTop() + COIL_Y * DEEP_H;
  const split = S.serpentStage === 2 && !S.serpentFreed;
  // The dive takes his highest edge past the floor, out of sight.
  const dive = diveK(), drop = dive ? dive * (deepFloor() - coilCeiling() + BREAK_DIVE_OVER) : 0, roar = roarK();
  const taut = tautK(), lash = lashK();
  // The kill: the sway dying, and the line sunk until the body lies on the floor.
  const lie = killDrop() * (deepFloor() - base - COIL_GIRTH / 2);
  // A level's bar emptied (deep/phases.js, `recoilPose`): the rear's bump
  // held on the line, the body slack and sunk on the brink, the coil wound
  // tighter as the deep pours in -- deeper swings, and more of them.
  const rp = recoilPose(), rk = rp ? rp.rk : 0, bump = rk ? rearPose() : null;
  const wind = rp ? rp.m : 1, waves = COIL_WAVES * (1 + (wind - 1) / 2), sag = rp ? rp.sag : 0;
  const amp = COIL_AMP * (1 - LASH_TAUT * taut) * killSway() * wind * (rp ? rp.amp : 1);
  return x => {
    const k = (x - x0) / span;
    let y = base + amp * Math.sin(2 * Math.PI * (k * waves - t / COIL_SWAY_MS));
    if (split && renewed(k)) y += SPLIT_WRITHE * Math.sin(2 * Math.PI * (k * SPLIT_LENGTHS - t / SPLIT_WRITHE_MS));
    if (taut && k > COIL_TAIL_FROM) y -= taut * LASH_LIFT * (k - COIL_TAIL_FROM) / (1 - COIL_TAIL_FROM);
    if (lash != null) y += LASH_H * Math.exp(-((k - lash) ** 2) / (LASH_W * LASH_W));
    if (roar != null) y -= BREAK_ROAR_H * Math.exp(-((k - roar) ** 2) / (LASH_W * LASH_W));
    if (bump) y -= rk * bump.lift * Math.exp(-((k - bump.at) ** 2) / (bump.w * bump.w));
    if (sag) y += sag * (1 - NEAR_SAG_TAIL * Math.max(0, k));
    y += drop + lie;
    return y;
  };
};
const waveY = (x, t) => lineAt(t).wave(x);
const coilX0 = () => deepX0() + COIL_X0 * DEEP_W;
const coilSpan = () => (COIL_X1 - COIL_X0) * DEEP_W;
// Where the body runs, head to tail, across the deep.
export const coilEnds = () => ({ x0: coilX0(), x1: coilX0() + coilSpan() });
// How far along the body x is, head 0 to tail 1: what the lash is laid on.
export const coilK = x => (x - coilX0()) / coilSpan();

// The line at `t`, kept while nothing it is worked out from has moved.
// Every point of the body asks for it, thousands a frame, so the check is a
// row of comparisons on what the line is made of -- the clock, the stage,
// the phase's turn (`part`), the break (`breakKind`), the kill (`killA`), the recoil and
// where the deep stands -- rather than on the bends worked out from them
// (`tautK`, `lashK`, ...), which allocate a reading each: a reading, a key
// or a line made a point is megabytes a second for the collector, and a
// pause every few seconds. Anything `waveLine` comes to read belongs in
// this row.
const line = { t: NaN, now: NaN, snatched: false, stage: 0, freed: false, mechAt: 0, mechSkip: false, breakT: null, recoilT: null,
               freedAt: null, reformAt: null, top: NaN, x0: NaN, wave: null, xs: null };
export let lineBuilds = 0;                // how often the line was worked out afresh (test/deep-alloc.test.mjs)
function lineAt(t) {
  const L = line, at = now(), top = deepTop(), x0 = coilX0();
  if (L.t === t && L.now === at && L.snatched === S.snatched && L.stage === S.serpentStage
      && L.freed === S.serpentFreed && L.mechAt === S.mechAt && L.mechSkip === S.mechSkip && L.breakT === S.breakT && L.recoilT === S.recoilT
      && L.freedAt === S.freedAt && L.reformAt === S.reformAt && L.top === top && L.x0 === x0) return L;
  L.t = t; L.now = at; L.snatched = S.snatched; L.stage = S.serpentStage; L.freed = S.serpentFreed;
  L.mechAt = S.mechAt; L.mechSkip = S.mechSkip; L.breakT = S.breakT; L.recoilT = S.recoilT; L.freedAt = S.freedAt; L.reformAt = S.reformAt;
  L.top = top; L.x0 = x0;
  L.wave = waveLine(t); L.xs = null;
  lineBuilds++;
  return L;
}

// The line walked once: x at every step of arc length along it, so a
// segment's place is a lookup.
const STEP = 2;                           // px of arc a table entry
function walk(t) {
  const L = lineAt(t);
  if (L.xs) return L.xs;
  const xs = [L.x0];
  const wave = L.wave;
  let x = xs[0], y = wave(x), acc = 0;
  const end = coilSpan() * 1.02;          // the body's length, and a little over
  // Small x steps, arc summed, a table entry every STEP of arc. A step's
  // length is a square root rather than `Math.hypot`, whose overflow guard
  // nothing here needs and which costs several times as much.
  while (acc < end) {
    const nx = x + 0.5, ny = wave(nx);
    acc += Math.sqrt((nx - x) * (nx - x) + (ny - y) * (ny - y));
    x = nx; y = ny;
    while (xs.length * STEP <= acc) xs.push(x);
  }
  L.xs = xs;
  return xs;
}
export function coilLine(u, t) {
  // The sway runs on the clock less what the stuns have held back, so a
  // stunned coil holds its pose and the one after it carries on from there
  // (`serpentStill`, deep/serpent.js).
  t -= S.serpentStill;
  // Struck down, the sway is held where the last blow caught it, from the
  // blow's own frame: the kill settles at once (deep/phases.js, `killA`).
  if (killA() != null) t = Math.min(t, S.freedAt - S.serpentStill);
  const s = u / (COIL_SEGS - 1) * coilSpan();   // arc from the head
  if (s <= 0) {
    // The snout, run on past the head along the same wave.
    const x = coilX0() + s;
    return { x, y: waveY(x, t) };
  }
  const xs = walk(t);
  const i = Math.min(xs.length - 2, Math.floor(s / STEP)), f = s / STEP - i;
  const x = xs[i] + (xs[i + 1] - xs[i]) * f;
  return { x, y: waveY(x, t) };
}
// The highest the body's top edge ever reaches as it sways: the line's highest
// swing, the writhe of the split lengths on top of it, and the thickest half.
// What the serpent's bar is held over.
export function coilCeiling() {
  let thick = 0;
  for (let u = 0; u < COIL_SEGS; u++) thick = Math.max(thick, coilThick(u));
  const writhe = S.serpentStage === 2 && !S.serpentFreed ? SPLIT_WRITHE : 0;
  return deepTop() + COIL_Y * DEEP_H - COIL_AMP - writhe - thick / 2;
}
// Segment `i`, on the cell grid.
export function coilAt(i, t) {
  const p = coilLine(i, t);
  return { x: snap(p.x), y: snap(p.y) };
}
// How thick the body is at `u` segments from the head (DESIGN.md, "The
// serpent, redrawn"): the head, then the neck swelling to the girth at the
// belly, held, then tapering to the tip.
export function coilThick(u) {
  if (u < HEAD_SEGS) return COIL_HEAD;
  const body = bodyThick(u / (COIL_SEGS - 1));
  // The head narrows onto the neck over COIL_NECK_EASE segments, eased at
  // both ends: dropped at once, the underside fell three cells in a step.
  const e = Math.min(1, (u - HEAD_SEGS) / COIL_NECK_EASE);
  return COIL_HEAD + (body - COIL_HEAD) * e * e * (3 - 2 * e);
}
function bodyThick(k) {
  const headK = HEAD_SEGS / (COIL_SEGS - 1);
  if (k < BELLY_AT) return COIL_NECK + (COIL_GIRTH - COIL_NECK) * Math.sin(Math.PI / 2 * (k - headK) / (BELLY_AT - headK));
  if (k < COIL_TAIL_FROM) return COIL_GIRTH;
  return COIL_GIRTH * (1 - (1 - COIL_TIP) * ((k - COIL_TAIL_FROM) / (1 - COIL_TAIL_FROM)) ** 1.5);
}
export const bellySeg = () => Math.round(BELLY_AT * (COIL_SEGS - 1));
export const bellyAt = t => coilAt(bellySeg(), t);

// The segment nearest a point, and how far it is: the one question a click, a
// lance and a grenade all ask of the body.
// The segment straight over x: the coil is laid along x, so it crosses a
// column once, and the segment nearest in x is the one there.
export function segAbove(x, t) {
  let best = 0, d = Infinity;
  for (let i = 0; i < COIL_SEGS; i++) {
    const e = Math.abs(coilAt(i, t).x - x);
    if (e < d) { d = e; best = i; }
  }
  return best;
}
export function nearestSeg(x, y, t) {
  let best = 0, d = Infinity;
  for (let i = 0; i < COIL_SEGS; i++) {
    const p = coilAt(i, t);
    const e = Math.hypot(p.x - x, p.y - y);
    if (e < d) { d = e; best = i; }
  }
  return { seg: best, d };
}
