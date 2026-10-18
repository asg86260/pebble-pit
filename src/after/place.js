// Where the afterlife is (DESIGN.md, "Acts 3 and 4", act 3, "The picture").
//
// One wide place on the cloud, laid out above the yard's sky, so a soul that
// rises out of the yard arrives somewhere real and every position in it is an
// ordinary world position the route, the camera and the drawing all read the
// same way -- the deep's rule (deep/place.js), turned upward. Its parts, left
// to right (layout A, docs/mocks/act3-place-2026-10-18), are the grove, the
// camp's stations, the shack, the waiting ground, the pedestal, the walk
// across, God's yard and the stair. Everything below is where a thing stands,
// read by the sim and the drawing alike, so a body walks to the spot the
// picture shows.

import { P, AFTER_GAP, AFTER_H, AFTER_W, AFTER_FLOOR_MARGIN,
         AFTER_GROVE_X0, AFTER_PLOT_MAX, AFTER_PLOT_STEP, AFTER_STATIONS, AFTER_PEDESTAL_H, AFTER_NOTCH_AT, AFTER_HEAP_R,
         AFTER_CAMP_X0, AFTER_CAMP_COLS, AFTER_CAMP_PITCH, AFTER_CAMP_ROW, AFTER_CAMP_ROWS,
         CROWD_X0, CROWD_FILES, CROWD_PITCH, CROWD_NEAR, CROWD_ROW, CROWD_FAR_ROW,
         AFTER_WALL_STEP, AFTER_STAIR_X, AFTER_STAIR_W, AFTER_STAIR_RISE,
         AFTER_SKY_LO, AFTER_SKY_HI, AFTER_BILLOW_SEED, AFTER_BILLOW_BIG } from '../config.js';

import { S } from '../state.js';

const snap = v => Math.round(v / P) * P;

// The cloud floor's top: the yard's top is world y 0, so the afterlife's floor
// stands AFTER_GAP above it and its own top AFTER_H above that.
export const afterFloor = () => snap(-AFTER_GAP);
export const afterTop = () => afterFloor() - AFTER_H;
export const afterX0 = () => 0;
export const afterX1 = () => afterX0() + AFTER_W;
export const afterRect = () => ({ x: afterX0(), y: afterTop(), w: AFTER_W, h: AFTER_H });
export const inAfter = (x, y) => y >= afterTop() && y <= afterFloor() && x >= afterX0() && x <= afterX1();

// --- the stations' drawings, as ground ------------------------------------------------
// Each station's drawing (render/after/stations.js) laid off the left edge of
// its ground (AFTER_STATIONS), in cells: `box` the drawing itself, as it stands (turned), as [left,
// width, height up off the floor] (what a click works and a card opens on);
// `door` the column a worker's middle stands on (where the mock draws its
// body), in the world's cells; `pile` where each counted pile lies, in the
// drawing's own (turned with it); `ground` how far its ground
// runs, piles and all, pressed flat under it. The chipper is drawn turned
// about its own ground (`flip`), facing the saw mill across the heap they
// both feed.
export const ART = {
  mill:      { box: [9, 26, 18], door: 7, pile: { logs: 0, timber: 35 }, ground: 54 },
  chipper:   { box: [3, 21, 18], door: 26, pile: { chiplogs: 0 }, ground: 36, flip: 36 },
  papermill: { box: [7, 22, 14], door: 10, pile: { paper: 31 }, ground: 36 },
  workshop:  { box: [7, 19, 16], door: 19, pile: { signs: 28 }, ground: 37 },
  press:     { box: [9, 20, 19], door: 27, pile: { posters: 33 }, ground: 38 },
  shack:     { box: [0, 14, 14], door: 7, pile: {}, ground: 14 },
  pedestal:  { box: [1, 10, AFTER_PEDESTAL_H], door: 6, pile: {}, ground: 16 }
};
export const stationX0 = key => afterX0() + AFTER_STATIONS[key].at * P;

// --- the grove ---------------------------------------------------------------------
// A plot's trunk column (its middle one), its left edge on the grid. The
// grove's ground runs to the last plot its card can clear, so the camp
// beside it never moves.
export const plotX = i => afterX0() + AFTER_GROVE_X0 + i * AFTER_PLOT_STEP + snap(AFTER_PLOT_STEP / 2);
export const groveX1 = () => plotX(AFTER_PLOT_MAX - 1) + AFTER_PLOT_STEP;

// --- the camp ----------------------------------------------------------------------
// A station's box on the floor: its drawing, off ART.
export const stationBox = key => {
  const s = AFTER_STATIONS[key], art = ART[key];
  if (!s || !art) return null;
  const [x, w, h] = art.box;
  return { x: stationX0(key) + x * P, y: afterFloor() - h * P, w: w * P, h: h * P };
};
// Where a body stands to work a station: the middle column of the worker the
// mock draws there.
export const stationDoor = key => (ART[key] ? stationX0(key) + ART[key].door * P : 0);
export const stationMid = key => { const b = stationBox(key); return b ? b.x + b.w / 2 : 0; };
// A station's pile of `what`, its left edge in the world. A pile's place in
// ART is in the drawing's own cells, so a turned drawing turns its piles too
// (a pile is six cells across).
const PILE_W = 6;
export const pileAt = (key, what) => {
  const art = ART[key], x = art.pile[what];
  return stationX0(key) + (art.flip ? art.flip - x - PILE_W : x) * P;
};
// The sawdust heap at the saw mill's right, where the chipper pours onto it
// too, `heapMid` its middle column; the notch in the cloud floor just past
// its foot, where a load is tipped through.
export const heapMid = () => stationX0('mill') + (ART.mill.ground - AFTER_NOTCH_AT - 2) * P;
export const heapX = () => heapMid() - AFTER_HEAP_R * P;
export const notchX = () => heapMid() + AFTER_NOTCH_AT * P;
// Where the pair stand to speak: on the pillar's top, their feet on it, two
// cells apart. A speaker's spot is its left edge.
export const speakerAt = k => ({ x: stationX0('pedestal') + (k ? 7 : 2) * P, y: afterFloor() - AFTER_PEDESTAL_H * P });
// The rebel pile at the pedestal's foot, on God's-yard side, where the motes land.
export const pileX = () => stationX0('pedestal') + 13 * P;
// Where an agitator stands: in a row behind the pedestal, a spot a post.
export const agitatorX = k => { const b = stationBox('pedestal'); return b.x - P * 3 - k * P * 4; };
// The spot of the k-th member waiting in the camp: rows across the camp's
// ground, each staggered half a spot, stepping up the screen, starting again
// at the front past the last row.
export const campSpot = k => {
  const row = Math.floor(k / AFTER_CAMP_COLS) % AFTER_CAMP_ROWS, col = k % AFTER_CAMP_COLS;
  return { x: afterX0() + AFTER_CAMP_X0 + col * AFTER_CAMP_PITCH + (row % 2 ? AFTER_CAMP_PITCH / 2 : 0),
           y: afterFloor() - row * AFTER_CAMP_ROW };
};
// Where across it the camera opens: just past the pedestal, so the pair and
// the front of the crowd are what the act opens on.
export const afterOpenX = () => { const b = stationBox('pedestal'); return snap(b.x + b.w + P * 8); };
// The place as the camera reads it (acts.js, `PLACES`).
export const AFTER_PLACE = { x0: afterX0, x1: afterX1, top: afterTop, floor: afterFloor, open: afterOpenX,
                             margin: AFTER_FLOOR_MARGIN, h: AFTER_H };

// --- the crowd ---------------------------------------------------------------------
// A soul is index i = rank * CROWD_FILES + file: rank-major, so a soul rising
// into the back of the crowd takes the next slot and nobody else moves.
export const fileOf = i => i % CROWD_FILES;
export const rankOf = i => Math.floor(i / CROWD_FILES);
export const soulAt = (f, r) => r * CROWD_FILES + f;
// A soul's square, its middle cell's left and top: files across God's yard,
// near ranks a body deep up the screen, far ranks a cell each behind them.
export const soulX = f => CROWD_X0 + f * CROWD_PITCH + P;
// A far rank is staggered half a file every other row, so the far field reads
// as a crowd thinning back rather than as columns.
export const farX = (f, r) => soulX(f) + (r % 2 ? CROWD_PITCH / 2 : 0);
export const soulY = r => afterFloor() - P * 2 - (r < CROWD_NEAR ? r * CROWD_ROW
                                                 : CROWD_NEAR * CROWD_ROW + (r - CROWD_NEAR) * CROWD_FAR_ROW);
// The deepest rank whose row stands at or below world y: the far field is
// drawn only up to the view's top.
export const rankAtY = y => {
  const front = afterFloor() - P * 2, near = CROWD_NEAR * CROWD_ROW;
  if (front - y < near) return Math.max(0, Math.floor((front - y) / CROWD_ROW));
  return CROWD_NEAR + Math.floor((front - near - y) / CROWD_FAR_ROW);
};
export const crowdX1 = () => CROWD_X0 + CROWD_FILES * CROWD_PITCH;
// Whether a body at world x stands over God's crowd, a file's slack either
// end: drawn there through the crowd's rows (render/aftercrowd.js), and
// everywhere else on the camp's floor (render/after.js).
export const overCrowd = x => x >= CROWD_X0 - CROWD_PITCH && x <= CROWD_X0 + (CROWD_FILES + 1) * CROWD_PITCH;
// The file under a world x, clamped to the field.
export const fileAt = x => Math.max(0, Math.min(CROWD_FILES - 1, Math.floor((x - CROWD_X0) / CROWD_PITCH)));
// The fence at the crowd's front: a poster's slot a step along it.
export const wallSlots = () => Math.floor((crowdX1() - CROWD_X0) / AFTER_WALL_STEP);
export const slotX = s => CROWD_X0 + s * AFTER_WALL_STEP + P;

// --- the stair and the sky -----------------------------------------------------------
export const stairFoot = () => AFTER_STAIR_X - AFTER_STAIR_W;
export const throneAt = () => ({ x: AFTER_STAIR_X, y: afterFloor() - AFTER_STAIR_RISE });
export const skyLo = () => afterFloor() - AFTER_SKY_LO;
export const skyHi = () => afterFloor() - AFTER_SKY_HI;

// --- the cloud floor's billow (floor A) -----------------------------------------------
// A cell column's height over the floor line, in cells: puffs a few cells
// wide, one or two cells high, their edges a step lower than their middles,
// butting so the valleys are where their low edges meet; pressed flat under
// the grove, every station's ground, the crowd and the stair, so everything
// built stands on the line the sim stands it on. Worked out once: the layout
// does not move.
const hsh = (a, b = 0, c = 0) => {
  let h = (a * 374761393 + b * 668265263 + c * 2246822519) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16; return (h >>> 0) / 4294967296;
};
export function billow(cols, seed, maxK = 2, big = AFTER_BILLOW_BIG) {
  const el = new Array(cols).fill(0);
  let c = 0, i = 0;
  while (c < cols) {
    const two = hsh(seed, i, 2) < big && maxK > 1, k = two ? 2 : 1;
    const n = two ? 8 + Math.floor(hsh(seed, i, 1) * 5) : 5 + Math.floor(hsh(seed, i, 1) * 4);
    for (let j = 0; j < n && c + j < cols; j++) el[c + j] = Math.max(el[c + j], Math.round(k * Math.pow(Math.sin(Math.PI * (j + 0.5) / n), 0.6)));
    c += n - 1; i++;                     // the next puff overlaps this one's last cell
  }
  return el;
}
// The flats, in cells off the place's left: [from, to).
export function floorFlats() {
  const c = x => Math.round((x - afterX0()) / P);
  const out = [[c(AFTER_GROVE_X0) - 2, c(groveX1())]];
  for (const key of Object.keys(AFTER_STATIONS)) out.push([AFTER_STATIONS[key].at - 1, AFTER_STATIONS[key].at + ART[key].ground + 1]);
  out.push([c(CROWD_X0) - 5, c(crowdX1()) + 4], [c(stairFoot()) - 2, c(afterX1())]);
  return out;
}
let profile = null;
export function floorProfile() {
  if (profile) return profile;
  const cols = Math.ceil(AFTER_W / P);
  profile = billow(cols, AFTER_BILLOW_SEED);
  for (const [a, b] of floorFlats()) for (let j = Math.max(0, a); j < Math.min(cols, b); j++) profile[j] = 0;
  return profile;
}
// The floor's top under a body standing with its middle at world x: the
// highest cell under its three columns, so its feet land on the puff.
export const floorAt = x => {
  const el = floorProfile(), j = Math.floor((x - afterX0()) / P);
  return afterFloor() - Math.max(el[j - 1] || 0, el[j] || 0, el[j + 1] || 0) * P;
};

// --- each station's moving part, for the hand ----------------------------------------
// What the hand's motion at each station aims at (after/gestures.js,
// `partsOf`), in world px, read off the numbers the drawing uses
// (render/after/stations.js, pine.js, pedestal.js). Every key has `box`, the
// area a press works (below a station's top strip, where its card opens);
// besides it: the mill's `wheel` {x, y, r}, the paper mill's `vat` {x, y, rx,
// ry}, the press's `bar` {x, y, len} (its pivot at the screw, level when
// idle, pulled down), the heap's `edge` (the notch's x), a tree's `saw` {x, y}
// (the middle of its cut) and a stump's `at` {x, y} (its foot) for plot `i`;
// and the rest of each moving part for the cues to point at.
const TOP_STRIP = 2;   // cells along a station's top that open its card (after/rows.js, `cardAt`)
export function stationParts(key, i = 0) {
  const fl = afterFloor();
  const at = (x0, x, y) => ({ x: x0 + x * P, y: fl + y * P });
  const box = (x0, x, y, w, h) => ({ x: x0 + x * P, y: fl + y * P, w: w * P, h: h * P });
  if (key === 'tree') {
    // A grown pine: fifteen cells across its foot, its trunk and three tiers
    // seventeen tall; a big one twenty-one across and twenty-five tall.
    const bx = plotX(i), big = !!(i >= 0 && treeBig(i));
    const half = big ? 10 : 7, h = big ? 25 : 17;
    return { box: box(bx, -half, -h, half * 2 + 1, h), saw: { x: bx + P / 2, y: fl - P * 2 + 3 },
             cut: { x0: bx - 2 * P, x1: bx + 3 * P, y: fl - P * 2 + 2 } };
  }
  if (key === 'stump') {
    const bx = plotX(i);
    return { box: box(bx, -2, -4, 5, 4), at: { x: bx + P / 2, y: fl }, stump: box(bx, -1, -2, 3, 2) };
  }
  if (key === 'heap') {
    const x0 = heapX(), edge = notchX();
    return { box: { x: x0, y: fl - P * (AFTER_HEAP_R + 4), w: edge + P * 2 - x0, h: P * (AFTER_HEAP_R + 5) }, edge,
             heap: { x: x0, y: fl - (AFTER_HEAP_R + 1) * P, w: (AFTER_HEAP_R * 2 + 1) * P, h: (AFTER_HEAP_R + 1) * P },
             notch: { x: edge, y: fl, w: P * 2, h: P * 3 } };
  }
  if (key === 'pedestal') {
    const a = speakerAt(0), b = speakerAt(1);
    return { box: { x: a.x, y: a.y - P * 3, w: b.x + P * 3 - a.x, h: P * 3 }, top: box(stationX0(key), 1, -AFTER_PEDESTAL_H, 10, AFTER_PEDESTAL_H) };
  }
  const b = stationBox(key);
  if (!b) return null;
  const worked = { x: b.x, y: b.y + P * TOP_STRIP, w: b.w, h: b.h - P * TOP_STRIP };
  const x0 = stationX0(key);
  if (key === 'mill') return { box: worked, wheel: { ...at(x0, 25, -9), r: 8 * P }, knob: 8.8 * P, bench: box(x0, 9, -5, 7, 5) };
  if (key === 'chipper') return { box: worked, mouth: box(x0, 15, -12, 7, 10), drum: box(x0, 9, -7, 6, 7), spout: box(x0, 3, -11, 4, 1) };
  if (key === 'papermill') return { box: worked, vat: { ...at(x0, 20, -6), rx: 5 * P, ry: 2.5 * P }, pivot: at(x0, 13.6, -10.3) };
  if (key === 'workshop') return { box: worked, sign: box(x0, 10, -5, 6, 3), hand: at(x0, 18, -4) };
  if (key === 'press') return { box: worked, bar: { ...at(x0, 14, -11), len: 12 * P }, knob: box(x0, 24, -6, 2, 2), platen: box(x0, 12, -8, 9, 2) };
  return { box: worked };
}// Whether plot i's tree was planted big (the grove's bigger trees).
const treeBig = i => !!(S.after && S.after.plots[i] && S.after.plots[i].big);
