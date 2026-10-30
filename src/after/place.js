// Where the afterlife is (DESIGN.md, "Acts 3 and 4", act 3, "The picture").
//
// One wide place on the cloud, laid out above the yard's sky, so a soul that
// rises out of the yard arrives somewhere real and every position in it is an
// ordinary world position the route, the camera and the drawing all read the
// same way -- the deep's rule (deep/place.js), turned upward. Its parts, left
// to right (layout A, docs/mocks/act3-place-2026-10-18), are the grove, the
// camp's stations, the shack, the pedestal, our crowd behind them, the walk
// across, God's yard and the stair. Everything below is where a thing stands,
// read by the sim and the drawing alike, so a body walks to the spot the
// picture shows.

import { P, AFTER_SAW, AFTER_GAP, AFTER_H, AFTER_W, AFTER_FLOOR_MARGIN,
         AFTER_GROVE_X0, AFTER_GROVE_START, AFTER_PLOT_MAX, AFTER_PLOT_STEP, AFTER_PLOT_GAP, AFTER_TREE, AFTER_OAK, AFTER_OAK_HALF, AFTER_BED, AFTER_STATIONS, AFTER_PODIUM_U, AFTER_PODIUM_TOPS, AFTER_PODIUM_PAIR, AFTER_PODIUM_CLIMB, AFTER_PODIUM_PILE, UNION_CROWD, AFTER_START_BUILT,
         CROWD_X0, CROWD_FILES, CROWD_PITCH, CROWD_NEAR, CROWD_ROW, CROWD_FAR_ROW,
         AFTER_STAIR_X, AFTER_STAIR_W, AFTER_STAIR_RISE,
         AFTER_ZONE_GAP, AFTER_UNION_W, AFTER_BILLOW_SEED, AFTER_BILLOW_BIG, AFTER_PUFF_LEAST, AFTER_SHELF, ACT_GATES_CELL, AFTER_ART_SCALE, AFTER_IDLE_STEP,
         AFTER_SIGN_BOARD, AFTER_PEDESTAL_SIGN_GAP } from '../config.js';

import { S } from '../state.js';
import { ART as BASE_ART, standCol, rampRun, pileLeft, pileCells, pileHigh, pileGrid } from './art.js';

const snap = v => Math.round(v / P) * P;
// An art cell, world px: a cell of act 3's drawings, AFTER_ART_SCALE grid
// cells across. Everything laid off the art's own cells is laid off these.
export const AP = P * AFTER_ART_SCALE;

// The cloud floor's top: the yard's top is world y 0, so the afterlife's floor
// stands AFTER_GAP above it and its own top AFTER_H above that.
export const afterFloor = () => snap(-AFTER_GAP);
// A station's shelf, in cells over the floor line, and the top of it: where
// its drawing, piles, board's spot, door and roster stand (config, AFTER_SHELF).
// A tree and a stump stand on the grove's.
const SHELF_KEY = { tree: 'grove', stump: 'grove' };
export const shelfOf = key => AFTER_SHELF[SHELF_KEY[key] || key] || 0;
export const groundOf = key => afterFloor() - shelfOf(key) * P;
export const afterTop = () => afterFloor() - AFTER_H;
export const afterX0 = () => 0;
export const afterX1 = () => afterX0() + AFTER_W;
export const afterRect = () => ({ x: afterX0(), y: afterTop(), w: AFTER_W, h: AFTER_H });
export const inAfter = (x, y) => y >= afterTop() && y <= afterFloor() && x >= afterX0() && x <= afterX1();

// --- the stations' drawings, as ground ------------------------------------------------
// Each station's drawing as ground, and the camp's order, are after/art.js's,
// where the config lays the camp out off them; the pedestal stands as high
// as the config says.
// The pedestal is the pair's podium (render/after/pedestal.js), its box as
// tall as the podium they stand on. Its board's spot (`signBox`) stands on
// the open floor between the workshops and the union's crowd,
// AFTER_PEDESTAL_SIGN_GAP.shack art cells past the last workshop's ground
// (the shack's board's spot ends it), and its ground runs from that spot;
// the crowd stops `crowd` art cells short of
// that spot (`unionHalf`). Farther when the last workshop's shelf stands higher
// than its ramp down to the pedestal's floor has room for (after/art.js, `rampRun`).
const lastWorks = () => Object.keys(AFTER_STATIONS).filter(k => k !== 'pedestal').reduce((a, k) => (worksEnd(k) > worksEnd(a) ? k : a));
const worksEnd = k => stationX0(k) + ART[k].ground * AP;
const pedSign = () => (workshopsX1() + Math.max(AFTER_PEDESTAL_SIGN_GAP.shack * AP, rampRun(shelfOf(lastWorks()) - shelfOf('pedestal')) * P) - stationX0('pedestal')) / AP;
export const ART = { ...BASE_ART, pedestal: { ...BASE_ART.pedestal,
  get box() { return [1, 10, Math.ceil(podiumTop() / AP)]; },
  get sign() { return pedSign(); },
  get lead() { return Math.min(BASE_ART.pedestal.box[0], pedSign()); } } };
export const stationX0 = key => afterX0() + AFTER_STATIONS[key].at * P;
// A column `x` of a station's drawing, `w` wide, where it stands: turned with
// a turned drawing (`flip`), as `pileAt` turns its piles.
const turnCol = (art, x, w = 0) => (art.flip ? art.flip - x - w : x);

// --- the grove ---------------------------------------------------------------------
// The grove counts from the forestry shack (the owner, 2026-10-28: "start
// the first tree close to the cabin, then grow left from there"): a plot's
// line (the boundary between its trunk's two middle columns) stands so its
// footprint ends AFTER_PLOT_GAP short of the shack's nearest claim, its
// drawing or its board's column, and each next plot a plot's step further
// left. The grove's ground runs from AFTER_GROVE_START to the shack's own
// (config/after.js lays the shack off it), so the last plot can never reach
// the gateway.
export const plotReach = () => AFTER_OAK_HALF;
export const plotX = i => snap(Math.min(stationBox('forestry').x, signBox('forestry').x) - (AFTER_PLOT_GAP + plotReach()) * AP - i * AFTER_PLOT_STEP);
export const groveX0 = () => afterX0() + AFTER_GROVE_START * P;
export const groveX1 = () => stationX0('forestry') + ART.forestry.lead * AP;

// --- the camp ----------------------------------------------------------------------
// A station's box on the floor: its drawing, off ART.
export const stationBox = key => {
  const s = AFTER_STATIONS[key], art = ART[key];
  if (!s || !art) return null;
  const [x, w, h] = art.box;
  return { x: stationX0(key) + turnCol(art, x, w) * AP, y: groundOf(key) - h * AP, w: w * AP, h: h * AP };
};
// Where a carrier takes a sign off the workshop's pile (beside it, `pileMid`),
// and the sign march's length from there to God's crowd's near edge, px:
// what the throne's speech is paced against (config/after.js,
// AFTER_BURN_MARCHES).
export const signFetchX = () => pileMid('workshop', 'signs');
export const signMarch = () => CROWD_X0 - signFetchX();
// Where a body stands to work a station: the middle column of the worker the
// mock draws there.
export const stationDoor = key => (ART[key] ? stationX0(key) + turnCol(ART[key], ART[key].door) * AP : 0);
export const stationMid = key => { const b = stationBox(key); return b ? b.x + b.w / 2 : 0; };
// The column of a station's ground its board stands over (after/art.js,
// SIGN), from the floor up, and its upper part alone, the board's anchor
// (after/stations.js, `boardAnchor`): beside the station, so the board
// covers none of the parts the hand works.
export const signBox = key => {
  const C = AFTER_SIGN_BOARD;
  return ART[key] && { x: stationX0(key) + turnCol(ART[key], ART[key].sign, C.w) * AP, y: groundOf(key) - (C.post + C.h) * AP, w: C.w * AP, h: (C.post + C.h) * AP };
};
export const signBoard = key => { const b = signBox(key); return b && { ...b, h: AFTER_SIGN_BOARD.h * AP }; };
// A station's pile of `what`, its left edge in the world. A pile's place in
// ART is in the drawing's own cells (after/art.js, `pileLeft`), so a turned
// drawing turns its piles too.
export const pileAt = (key, what) => {
  const art = ART[key], x = pileLeft(art, what);
  return stationX0(key) + turnCol(art, x, pileCells(what)) * AP;
};
// The station a counted pile lies on, by the pile's stock key, and the box
// the hand finds it in: across the pile, `reach` art cells up off the floor
// under it (its station's shelf, `floorAt`), or a cell over the pile's plot
// at its fullest where that stands taller.
export const pileOwner = what => Object.keys(ART).find(k => what in ART[k].pile) || null;
const pileCenter = (key, what) => pileAt(key, what) + (pileCells(what) / 2) * AP;
export const pileBox = (key, what, reach) => {
  const h = Math.max(reach, pileHigh(what) + 1) * AP;
  return { x: pileAt(key, what), y: floorAt(pileCenter(key, what)) - h, w: pileCells(what) * AP, h };
};
// A counted pile's plot in the world (after/art.js, `pileGrid`), shaped as
// grid.js reads a grid and the yard's floor is laid: `x` its left edge, `p`
// a block's width, its bottom row on its station's ground. Null for a pile
// that is not a plot of blocks.
export const pilePlace = what => {
  const g = pileGrid(what), key = pileOwner(what);
  if (!g || !key) return null;
  const p = g.size * AP;
  return { x: pileAt(key, what), y: groundOf(key) - g.rows * p, cols: g.cols, rows: g.rows, p };
};
// Where a station's loads are piled while it is raised (after/build.js): on
// its ground beside its drawing, where its own product pile will stand,
// BUILD_PILE_W art cells across and kept on the ground. Its left edge.
export const BUILD_PILE_W = 12;
export const buildPileAt = key => {
  const art = ART[key], x0 = stationX0(key);
  const last = Object.keys(art.pile).at(-1);
  const want = last == null ? art.box[0] + art.box[1] + 1 : (pileAt(key, last) - x0) / AP - 1;
  return x0 + Math.max(0, Math.min(art.ground - BUILD_PILE_W, want)) * AP;
};
// Where a builder stands to lay a load into a band: either side of the
// drawing (`side` 0 its left, 1 its right), a cell off it.
export const buildLayAt = (key, side) => { const b = stationBox(key); return side ? b.x + b.w + P * 2 : b.x - P * 2; };
// Where a body stands to put a thing down on a pile or take one off it, its
// middle column: beside the pile on the side away from its station's
// drawing (after/art.js, `standCol`), so the load stacked over its head
// stands clear of the pile; the floor it stands on is the station's ground.
export const pileMid = (key, what) => {
  const art = ART[key], s = standCol(art, what);
  return stationX0(key) + turnCol(art, s) * AP;
};
// Where the pair stand to speak: on the pillar's top, their feet on it, two
// cells apart. A speaker's spot is its left edge.
// The podium the pair stand on, 0 the soapbox: the rungs bought (the ladder's
// row, after/rows.js), but the last until they have stepped up onto the new
// one part of the way through its building (AFTER_PODIUM_CLIMB). Read here
// off `S.after`, so the place does not import the upgrades; its top over the
// floor, px.
export const podiumStood = () => {
  const a = S.after, n = Math.max(0, Math.min(AFTER_PODIUM_TOPS.length - 1, (a && a.ups['after-podium']) || 0));
  const at = a?.upAt?.['after-podium'];
  return n > 0 && at != null && a.t - at < AFTER_PODIUM_CLIMB.s * AFTER_PODIUM_CLIMB.step[1] ? n - 1 : n;
};
export const podiumTopOf = n => AFTER_PODIUM_TOPS[n] * AFTER_PODIUM_U;
export const podiumTop = () => podiumTopOf(podiumStood());
export const podiumMid = () => stationX0('pedestal') + ART.pedestal.ground * AP / 2;
// The union's crowd (render/after/unioncrowd.js) across the half at most:
// its back rows kept AFTER_PEDESTAL_SIGN_GAP.crowd art cells short of the
// pedestal's board's spot, which stands between it and the workshops.
export const unionHalf = () => {
  const s = signBox('pedestal');
  return Math.min(UNION_CROWD.half[1], podiumMid() - (s.x + s.w) - AFTER_PEDESTAL_SIGN_GAP.crowd * AP);
};
export const speakerAt = k => ({ x: podiumMid() + AFTER_PODIUM_PAIR[k ? 1 : 0], y: afterFloor() - podiumTop() });
// The rebel pile at the pedestal's foot, on God's-yard side, where the motes land.
export const pileX = () => snap(podiumMid() + AFTER_PODIUM_PILE * AP);
// Where an idle member stands, agitating: in a row behind the pedestal, a
// spot each, as many spots as the floor holds between the pedestal and
// its board's spot (one at the least); the rest wait in the crowd.
export const idleX = k => { const b = stationBox('pedestal'); return b.x - P * 3 - k * AFTER_IDLE_STEP; };
export const idleSpots = () => { const s = signBox('pedestal'); return Math.max(1, Math.floor((idleX(0) - P * 3 - (s.x + s.w)) / AFTER_IDLE_STEP) + 1); };
// The members waiting are counted, not stood anywhere (the owner, 2026-10-18:
// our crowd behind the camp is dropped). A member comes into the camp, and
// goes back out of it, at one of its two edges, fading as it crosses: the
// floor just left of the grove (past heaven's gates, which stand before it),
// and the open floor past the pedestal where one walking out of God's yard
// arrives. `campSpot(to)` is the edge nearest world x `to`; with no `to`,
// the edge on God's yard's side.
export const campEdges = () => [snap(afterX0() + AFTER_GROVE_X0 - P * 8), snap(stationX0('pedestal') + ART.pedestal.ground * AP + P * 4)];
export const campSpot = (to = null) => {
  const [x0, x1] = campEdges();
  return { x: to == null || Math.abs(to - x1) <= Math.abs(to - x0) ? x1 : x0, y: afterFloor() };
};
// Where across it the camera opens: just past the pedestal, so the pair and
// the front of the crowd are what the act opens on.
export const afterOpenX = () => { const b = stationBox('pedestal'); return snap(b.x + b.w + P * 8); };
// --- the level's three zones ---------------------------------------------------------
// (DESIGN.md, "The level, the two crowds and the flags"; config/after.js lays
// them out.) Read off where things stand, so a station added or moved
// carries the zones with it: the workshops end where the last station's
// ground but the pedestal's does; God's camp starts a file short of his
// crowd's first; the union's camp is the floor round the pedestal, the open
// floor between it and each neighbor.
export const workshopsX1 = () => Math.max(...Object.keys(AFTER_STATIONS).filter(k => k !== 'pedestal').map(k => stationX0(k) + ART[k].ground * AP));
export const godX0 = () => CROWD_X0 - CROWD_PITCH;
export const unionX0 = () => workshopsX1() + AFTER_ZONE_GAP * P;
export const unionX1 = () => unionX0() + AFTER_UNION_W * P;
const pedMid = () => podiumMid();
// Where a soul won over in God's crowd ends its drift across to the union's
// camp (render/aftercrowd.js): over the floor on God's side of the pedestal,
// a body's height up. One point, so the union's own crowd, when it is
// drawn, takes them in there.
export const unionJoinAt = () => ({ x: snap(pedMid() + P * 12), y: afterFloor() - P * 6 });

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
// The nearest world x to `x` over God's crowd: where a body on the floor
// steps up into its rows.
export const crowdEdge = x => Math.max(CROWD_X0 - CROWD_PITCH, Math.min(CROWD_X0 + (CROWD_FILES + 1) * CROWD_PITCH, x));
// The file under a world x, clamped to the field.
export const fileAt = x => Math.max(0, Math.min(CROWD_FILES - 1, Math.floor((x - CROWD_X0) / CROWD_PITCH)));

// --- the stair ------------------------------------------------------------------------
export const stairFoot = () => AFTER_STAIR_X - AFTER_STAIR_W;
export const throneAt = () => ({ x: AFTER_STAIR_X, y: afterFloor() - AFTER_STAIR_RISE });

// --- the cloud floor's billow (floor A) -----------------------------------------------
// A cell column's height over the floor line, in cells. Flat where something
// built stands -- a station's drawing, its piles and its door, the heap and
// the notch, a tree's foot, the pillar's pile, the stair -- at its shelf's
// height, so it stands where the sim stands it. Between two flats, an eased
// ramp from the one's height to the other's, flat where they match; under
// God's crowd, puffs a few cells wide and one or two high (`billow`), its
// front row standing on them (render/aftercrowd.js). A body walks up and
// over all of it (`floorAt`). Worked out again only when a station is
// ordered.
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
// God's crowd's columns, [from, to) in cells: where its lip is drawn.
export const crowdLip = () => [Math.round((CROWD_X0 - CROWD_PITCH - afterX0()) / P), Math.round((CROWD_X0 + (CROWD_FILES + 1) * CROWD_PITCH - afterX0()) / P)];
// The flats, in cells off the place's left: [from, to, height], each a cell
// wider either side than what stands on it, so a puff never butts a wall,
// and as high as the shelf it is part of.
export function floorFlats() {
  const c = x => Math.round((x - afterX0()) / P);
  const span = (x, w) => [c(x) - 1, c(x) + w + 1];
  const out = [];
  // The grove on its shelf, from its far slope to the shack: a tree falls
  // across its plot and its logs come to rest anywhere along it.
  out.push([...span(groveX0(), (groveX1() - groveX0()) / P), shelfOf('grove')]);
  // A station's whole ground, from the moment it is ordered: an unbuilt
  // spot is open floor like any other (the owner, 2026-10-18).
  for (const key of Object.keys(AFTER_STATIONS)) {
    if (!sited(key)) continue;
    const b = stationBox(key), h = shelfOf(key), on = s => out.push([...s, h]);
    on(span(b.x, b.w / P)); on(span(stationX0(key) + ART[key].lead * AP, (ART[key].ground - ART[key].lead) * AFTER_ART_SCALE));
    for (const what of Object.keys(ART[key].pile)) on(span(pileAt(key, what), pileCells(what) * AFTER_ART_SCALE));
    on(span(stationDoor(key) - P, 3));
    on(span(signBox(key).x, AFTER_SIGN_BOARD.w * AFTER_ART_SCALE));
  }
  // The rebel pile at the pillar's foot.
  out.push(span(pileX(), 8));
  // Where a body steps from the floor into God's crowd's rows (`overCrowd`),
  // drawn there by the crowd standing on the flat line behind its lip.
  const [l0, l1] = crowdLip();
  out.push([l0 - 2, l0 + 2], [l1 - 2, l1 + 2]);
  out.push([c(stairFoot()) - 2, c(afterX1())]);
  // Heaven's gates, standing on the floor with the light coming up between
  // them (render/gates.js), and the floor heaped either side.
  out.push([ACT_GATES_CELL - 20, ACT_GATES_CELL + 20]);
  return out;
}
// Whether a station's ground is taken: standing, or ordered and going up.
// Before the act begins, the two that stand from its first frame.
// Every station of the camp stands on its ground from the start, closed until
// it is built, drawn as its dotted plan (render/after.js).
export const sited = key => (S.after ? S.after.built.includes(key) || !!S.after.raising[key] || key in AFTER_STATIONS : AFTER_START_BUILT.includes(key));
// Whether a station stands closed: standing whole but not built yet, its
// dotted plan until its rebuild fills it in.
export const closed = key => !!S.after && !AFTER_START_BUILT.includes(key) && !S.after.built.includes(key) && key in AFTER_STATIONS;
// Which grounds are taken, as a key: the profile is worked out again only
// when that changes.
export const sitesKey = () => Object.keys(AFTER_STATIONS).filter(sited).join(',');
let profile = null, profileKey = null; // cache: keyed by `sitesKey()`
export function floorProfile() {
  const key = sitesKey();
  if (profile && key === profileKey) return profile;
  profileKey = key;
  const cols = Math.ceil(AFTER_W / P), lvl = new Array(cols).fill(-1);
  for (const [a, b, h = 0] of floorFlats()) for (let j = Math.max(0, a); j < Math.min(cols, b); j++) lvl[j] = Math.max(lvl[j], h);
  const [l0, l1] = crowdLip(), puffs = billow(cols, AFTER_BILLOW_SEED);
  profile = lvl.map(h => Math.max(0, h));
  for (let j = 0; j < cols;) {
    if (lvl[j] >= 0) { j++; continue; }
    let k = j;
    while (k < cols && lvl[k] < 0) k++;
    const from = j > 0 ? lvl[j - 1] : 0, to = k < cols ? lvl[k] : 0;
    // A gap between two flats too narrow for a puff would stand a lone post
    // of cloud: left flat.
    if (j >= l0 && k <= l1) { if (k - j >= AFTER_PUFF_LEAST) for (let q = j; q < k; q++) profile[q] = puffs[q]; }
    else for (let q = j; q < k; q++) { const u = (q - j + 0.5) / (k - j); profile[q] = Math.round(from + (to - from) * u * u * (3 - 2 * u)); }
    j = k;
  }
  return profile;
}
// The floor's top under world x, where a body standing there has its feet:
// the columns' heights joined straight between their middles, so a body
// walking a swell rises and falls with it rather than a cell at a time.
export const floorAt = x => {
  const el = floorProfile(), u = (x - afterX0()) / P - 0.5, j = Math.floor(u), f = u - j;
  return afterFloor() - ((el[j] || 0) * (1 - f) + (el[j + 1] || 0) * f) * P;
};

// --- the tree, as drawn ------------------------------------------------------------
// The grove's tree (config's AFTER_TREE and AFTER_OAK), read here by the
// drawing (render/after/pine.js), the hand (after/grove.js, `treeAt`) and the
// map (footprints.js) alike, so all three see the one shape. Cells
// [c, r, part, clump]: c off the plot's line, r up from the floor (row -1
// the bottom), part 'stump', 'trunk', 'crown' or 'bough', and a leaf's clump
// (the one it sits deepest in, by which it is shaded and broken).
export const TRUNK_TOP = -(AFTER_TREE.stump + AFTER_TREE.logs * AFTER_TREE.log);
const mirror = lobes => lobes.flatMap(([x, y, r]) => (x ? [[x, y, r], [-x, y, r]] : [[x, y, r]]));
export const OAK = mirror(AFTER_OAK);
let CELLS = null; // cache: the tree's cells, worked out once
export function treeCells() {
  if (CELLS) return CELLS;
  const { c0, w, stump } = AFTER_TREE, out = [], leaf = new Set();
  for (let r = -1; r >= -stump; r--) for (let c = c0; c < c0 + w; c++) out.push([c, r, 'stump', 0]);
  for (let r = -stump - 1; r >= TRUNK_TOP; r--) for (let c = c0; c < c0 + w; c++) out.push([c, r, 'trunk', 0]);
  const reach = Math.ceil(Math.max(...OAK.map(([, y, r]) => y + r))), low = Math.floor(Math.min(...OAK.map(([, y, r]) => y - r)));
  const inLobe = (cx, cy) => OAK.some(([x, y, r]) => (cx - x) ** 2 + (cy - y) ** 2 <= r * r);
  const depth = (cx, cy, k) => Math.hypot(cx - OAK[k][0], cy - OAK[k][1]) - OAK[k][2];
  for (let y = reach; y >= low; y--) for (let c = -AFTER_OAK_HALF; c < AFTER_OAK_HALF; c++) {
    const cx = c + 0.5, cy = y - 0.5;
    if (!inLobe(cx, cy)) continue;
    let k = 0;
    for (let j = 1; j < OAK.length; j++) if (depth(cx, cy, j) < depth(cx, cy, k)) k = j;
    leaf.add(`${c}|${y}`);
    out.push([c, TRUNK_TOP - y, 'crown', k]);
  }
  // The leader: the trunk's two middle columns carried on up under the leaves.
  for (let c = c0 + 1; c < c0 + w - 1; c++) for (let y = 1; y <= reach && !leaf.has(`${c}|${y}`); y++) out.push([c, TRUNK_TOP - y, 'bough', 0]);
  // The boughs: from the trunk's top out to each side clump, seen where the
  // leaves leave them showing.
  const has = new Set(out.map(q => `${q[0]}|${q[1]}`));
  for (const [x, y] of OAK) {
    if (Math.abs(x) < 2) continue;
    const x0 = Math.sign(x), steps = 24;
    for (let k = 0; k <= steps; k++) {
      const c = Math.floor(x0 + (x - x0) * k / steps), yy = Math.ceil(y * k / steps), key = `${c}|${TRUNK_TOP - yy}`;
      if (yy > 0 && !leaf.has(`${c}|${yy}`) && Math.abs(c + 0.5) > w / 2 - 0.01 && !has.has(key)) { has.add(key); out.push([c, TRUNK_TOP - yy, 'bough', 0]); }
    }
  }
  return (CELLS = out);
}
// The order a tree comes in as it grows (B1): the stump and trunk from the
// ground up, then the crown from its lowest row up, each row from the middle
// out.
let ORDER = null; // cache: the cells in growing order, worked out once
export function growOrder() {
  if (ORDER) return ORDER;
  ORDER = treeCells().slice().sort((a, b) => (b[1] - a[1]) || (Math.abs(a[0] + 0.5) - Math.abs(b[0] + 0.5)) || (a[0] - b[0]));
  return ORDER;
}
// The tree's cells as a set of "c|r", what the hand presses exactly (gaps
// between the clumps are sky, nobody's).
let CELL_SET = null; // cache: the tree's cells as keys, worked out once
export const treeHas = (c, r) => (CELL_SET || (CELL_SET = new Set(treeCells().map(([cc, rr]) => `${cc}|${rr}`)))).has(`${c}|${r}`);
// The tree as rows [row, from, to] of cells off its plot's line and the floor,
// and the box round them: the map's.
let ROWS = null; // cache: the tree's rows, worked out once
export function treeRows() {
  if (ROWS) return ROWS;
  const spans = new Map();
  for (const [c, r] of treeCells()) { const s = spans.get(r); spans.set(r, s ? [Math.min(s[0], c), Math.max(s[1], c)] : [c, c]); }
  return (ROWS = [...spans].map(([r, [a, b]]) => [r, a, b]).sort((p, q) => p[0] - q[0]));
}
// A plot's soil bed, [from, to) world x.
export const bedSpan = i => [plotX(i) + AFTER_BED[0] * AP, plotX(i) + (AFTER_BED[1] + 1) * AP];
// A plot's own ground along the grove, [from, to) world x: from where the
// next plot's footprint ends to where the shack's gap begins, where its logs rest.
export const plotSpan = i => [plotX(i) - AFTER_PLOT_STEP + plotReach() * AP, plotX(i) + (AFTER_PLOT_GAP + plotReach()) * AP];

// --- each station's moving part, for the hand ----------------------------------------
// The hand saw lying across a grown trunk a log's height up, its blade's edge
// on the stump's top and its grip on the shack's side (the tree falls the
// other way): in cells off the plot's line, the columns it sweeps over its
// whole stroke and the rows it stands in, teeth to grip (track B;
// after/gestures.js `handSawAt` lays it). At the full push the grip stops
// flush at the trunk's edge; at the full pull the blade's toe is still a cell
// inside the trunk, so the stroke is a cell short of the blade.
const SAW_EDGE = AFTER_TREE.c0 + AFTER_TREE.w, SAW_BLADE = AFTER_SAW.depth.length;
export const SAW_SPAN = [SAW_EDGE - SAW_BLADE, SAW_EDGE + (SAW_BLADE - 1) + AFTER_SAW.grip - 1];
export const SAW_ROWS = [-AFTER_TREE.stump - Math.max(...AFTER_SAW.depth), -AFTER_TREE.stump];
// The grove's icons, [width, height] in their own dots of ICON_DOT px: the
// saw over a grown tree and the shovel over a stump (render/after/pine.js),
// the hand's placeholder until tracks B and C retire them.
export const ICON_DOT = P;
export const ICON = { saw: [13, 8], shovel: [5, 13] };
// What the hand's motion at each station aims at (after/gestures.js,
// `partsOf`), in world px, read off the numbers the drawing uses
// (render/after/stations.js, pine.js, pedestal.js). Every key has `box`, the
// area a press works;
// besides it: the mill's `wheel` {x, y, r}, a tree's `saw` {x, y}
// (the middle of its cut) and a stump's `at` {x, y} (its foot) for plot `i`;
// and the rest of each moving part for the cues to point at.
export function stationParts(key, i = 0) {
  const fl = groundOf(key);
  const at = (x0, x, y) => ({ x: x0 + x * AP, y: fl + y * AP });
  const box = (x0, x, y, w, h) => ({ x: x0 + x * AP, y: fl + y * AP, w: w * AP, h: h * AP });
  if (key === 'tree') {
    // The grown tree as drawn: its rows' spans off `foot` (its plot's line on
    // the grove's floor), and the box round them; `sawBox` the handsaw across
    // its trunk at rest, and `icon` the saw icon over its crown.
    const bx = plotX(i), rows = treeRows();
    const a = Math.min(...rows.map(r => r[1])), b = Math.max(...rows.map(r => r[2])), top = Math.min(...rows.map(r => r[0]));
    const ic = { w: ICON.saw[0] * ICON_DOT, h: ICON.saw[1] * ICON_DOT };
    const icon = { x: bx, y: fl + top * AP - P * 2, box: { x: snap(bx - ic.w / 2), y: fl + top * AP - P * 2 - ic.h, w: ic.w, h: ic.h } };
    return { box: box(bx, a, top, b - a + 1, -top), rows, foot: { x: bx, y: fl }, top: fl + top * AP,
             sawBox: box(bx, SAW_SPAN[0], SAW_ROWS[0], SAW_SPAN[1] - SAW_SPAN[0] + 1, SAW_ROWS[1] - SAW_ROWS[0] + 1), icon };
  }
  if (key === 'stump') {
    // `stump` the block as drawn, one whole log; `grip` round it and up over
    // it, where the hand takes hold to lift it; `icon` the shovel over it.
    const bx = plotX(i), { c0, w, stump: h } = AFTER_TREE, ic = { w: ICON.shovel[0] * ICON_DOT, h: ICON.shovel[1] * ICON_DOT };
    const iy = fl - (h + 2) * AP;
    return { box: box(bx, c0 - 1, -h, w + 2, h), at: { x: bx, y: fl }, stump: box(bx, c0, -h, w, h),
             grip: box(bx, c0 - 1, -h - 2, w + 2, h + 3), icon: { x: bx, y: iy, box: { x: snap(bx - ic.w / 2), y: iy - ic.h, w: ic.w, h: ic.h } } };
  }
  if (key === 'pedestal') {
    const a = speakerAt(0), b = speakerAt(1);
    const h = Math.ceil(podiumTop() / AP);
    return { box: { x: a.x, y: a.y - P * 3, w: b.x + P * 3 - a.x, h: P * 3 }, top: box(stationX0(key), 1, -h, 10, h) };
  }
  const b = stationBox(key);
  if (!b) return null;
  const x0 = stationX0(key);
  if (key === 'mill') return { box: b, wheel: { ...at(x0, 19, -9), r: 6 * AP }, knob: 8 * AP, frame: box(x0, 31, -26, 19, 26) };
  if (key === 'workshop') return { box: b, sign: box(x0, 8, -6, 12, 2), hammer: box(x0, 8, -14, 14, 6), hand: at(x0, 13, -9),
                                    nails: [9, 12, 15, 18].map(c => box(x0, c - 0.5, -8.5, 2, 3)) };   // a nail's head and a half cell round it: the gaps between are misses
  return { box: b };
}

