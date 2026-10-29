// Where each placed object stands, as ground, for the one rule the map keeps:
// no two objects of different kinds occupy the same cell (verify.js, rule 21;
// test/no-overlap.test.mjs).
//
// A footprint is a list of world-space rectangles an object takes up over its
// whole life: built, growing and moving, including what rises or swings. Every
// number here is read off the export the drawing or the placement already
// uses; a size typed in a second time would be a footprint that agrees with the
// code on the day it was written. Where the drawing keeps a size to itself
// (a literal inside a draw function), the placement's own constant is read
// instead and the gap is said in a comment.
//
// One row of the table is one object (`id`), however many rects it takes: a
// shed and the hole it stands beside are the quarry's, so they may touch.
// Different ids may not. The `place` is the world the object stands in, the
// same word the `place` column of `STATIONS` carries: 'yard' (the surface),
// 'deep', 'after' and 'hell'. The yard and the deep are one world on screen
// but two grounds, so their objects are never compared with each other.
//
// Only objects that are standing, or being raised, are in a place's list: a
// site the player has not opened is not on the map yet. Each test stage in
// test/no-overlap.test.mjs brings more of them up.

import { S, bench, shack, apothecary, filter, casino, outhouse, tower, farm, quarry, pit, rift, sky } from './state.js';
import { P, FARM_H, FARM_GAP, FINALE_WALL_ROWS, FINALE_ROOF, FINALE_CHIMNEY, 
         FINALE_BENCH, FINALE_BENCH_W, FINALE_PILE_CELL, FINALE_PILE_W, FINALE_PILE_ROWS,
         MANSION_AT, MANSION_FLOORS, MANSION_FLOOR_ROWS, MANSION_WING_W, MANSION_WING_FLOORS, MANSION_MAIN_W,
         MANSION_TOWER_FLOORS, MANSION_TOWER_W, MANSION_BLOCKS_AT, MANSION_BLOCKS_W,
         ACT_GATES_REACH, ACT_GATES_BANK_CELLS, ACT_GATES_BANK, AFTER_PLOT_MAX, AFTER_STAIR_W, AFTER_STAIR_RISE, HELL_TIERS,
         AFTER_PILE_REACH, AFTER_PILE_GAP, AFTER_PODIUM_HALF, AFTER_PODIUM_TOPS, AFTER_PODIUM_U, AFTER_REBEL_PILE_CELLS } from './config.js';
import { STATIONS } from './stations.js';
import { plotSlots, rockLeft, shackSpot } from './world.js';
import { rockFootY, rockTopY, ramX } from './rock.js';
import { spriteW, spriteH, RAM } from './sprites.js';
import { machine } from './machines.js';
import { houseStands, houseX } from './home.js';
import { mansionStands, mansionX } from './mansion.js';
import { portalStands, portalEnd } from './portals.js';
import { stairPieces } from './render/gates.js';
import { afterlifeOn, hellOn } from './acts.js';
import { deepPortal, standOfStation, deepFloor } from './deep/place.js';
import { stationById } from './deep/party.js';
import { PROPS } from './deep/props.js';
import { afterFloor, groundOf, stationBox, stationX0, signBox, plotX, pineRows, PINE_GROWN, ART, pileBox, stairFoot, stationParts, podiumMid, pileX, AP } from './after/place.js';
import { basketBox } from './after/place.js'; // MOCK grove
import { DRAW } from './render/after/stations.js';
import { silhouette } from './render/after/kit.js';
import { furnaceBox, barrierBox } from './hell/place.js';
import { riftOpen } from './rift.js';

export const PLACES = ['yard', 'deep', 'after', 'hell'];

const rect = (x, y, w, h) => ({ x, y, w, h });
// A block of `w` by `h` cells standing on the ground line, its left edge at `x`.
const standing = (x, w, h) => rect(x, S.groundY - h * P, w * P, h * P);

// The boxes the yard's sites are seated into (world.js, `seatSites`): the
// whole drawn extent of each, which is wider than the stand the board answers
// to (the apothecary's hut is the left of its pots; the tower's box the whole
// tower). The stand is the fallback for a station with no box of its own.
const SITE_BOX = { bench, shack, apothecary, filter, casino, outhouse, tower };

const dim = r => r && r.w > 0 && r.h > 0;

// --- the yard ---------------------------------------------------------------
function yardParts() {
  const out = [];
  const add = (id, ...rs) => { const rects = rs.filter(dim); if (rects.length) out.push({ id, rects }); };

  for (const row of STATIONS) {
    if (!row.stand || (row.place && row.place !== 'yard') || !row.open()) continue;
    const box = SITE_BOX[row.key];
    const r = box ? { x: box.x, y: box.y, w: box.w, h: box.h } : row.stand();
    // The hut scoots away from a bigger rock at SHACK_SCOOT (world.js,
    // `stepShack`), so for a few seconds it is where it was; the map is read
    // where it settles.
    if (row.key === 'shack') r.x = shackSpot();
    if (row.key === 'quarry') add('quarry', r, rect(quarry.x, S.groundY - P, quarry.w, quarry.h + P));
    else if (row.key === 'farm') {
      // The fence is drawn at its widest from the first frame (`plotSlots`).
      add('farm', r, rect(farm.x, S.groundY - FARM_H, (plotSlots() - 1) * FARM_GAP, FARM_H));
    } else add(row.key, r);
  }

  // The rock as it stands, column by column (its top is a hill, so a box
  // round it would swallow ground the hill never reaches), and the pit's
  // mouth and the star the tower calls. The ram that works the rock is the
  // rock's: it is driven up to the face and back through a fresh boulder by
  // design (rock.js, `ramTargetX`), so the two touching is not a fault;
  // what the ram may not do is stand on anything else.
  const hill = [];
  for (let c = 0; c < S.gw; c++) {
    const top = rockTopY(c);
    if (top >= rockFootY()) continue;
    const last = hill[hill.length - 1];
    if (last && last.y === top && last.x + last.w === rockLeft() + c * P) last.w += P;
    else hill.push(rect(rockLeft() + c * P, top, P, rockFootY() - top));
  }
  if (machine('ram')?.bought) {
    const x = ramX();
    hill.push(rect(x, S.groundY - spriteH(RAM) * P, spriteW(RAM) * P, spriteH(RAM) * P));
  }
  add('rock', ...hill.map(r => ({ ...r, h: Math.max(r.h, P) })));
  add('pit', rect(pit.x, S.groundY - P, pit.w, pit.h + P));
  if (S.meteorOpen) add('sky', rect(sky.x - sky.r, sky.y - sky.r, sky.r * 2, sky.r * 2));
  if (riftOpen() || S.riftOpen) add('rift', rect(rift.x, rift.y, rift.w, rift.h));

  // The heaps lie on the ground, a cell high at the least; the strip is where
  // they may lie, so a building standing in it has taken the heap's ground.
  for (const p of S.piles || []) add(`heap:${p.key}`, rect(p.from, S.groundY - P, p.to - p.from, P));

  // The finale's house (home.js) and, once it has fallen and the mansion is
  // begun, the mansion that is built on its ground: one after the other,
  // never together, so the house is dropped when the mansion's first piece
  // is begun. Its bench by the door and the woodpile stay with it.
  if (!mansionStands() && houseStands()) {
    const x = houseX();
    const top = Math.max(FINALE_WALL_ROWS + FINALE_ROOF.length, -FINALE_CHIMNEY[1]);
    const roofL = Math.min(...FINALE_ROOF.map(r => r[0])), roofR = Math.max(...FINALE_ROOF.map(r => r[0] + r[1]));
    add('home', standing(x + roofL * P, roofR - roofL, top),
        standing(x + FINALE_BENCH * P, FINALE_BENCH_W, 2),
        standing(x + FINALE_PILE_CELL * P, FINALE_PILE_W, FINALE_PILE_ROWS));
  }
  if (mansionStands()) {
    const x = mansionX(), R = MANSION_FLOOR_ROWS, mainX = x + MANSION_WING_W * P;
    add('mansion',
        standing(x, MANSION_WING_W, MANSION_WING_FLOORS * R),
        standing(mainX, MANSION_MAIN_W, MANSION_FLOORS * R),
        standing(mainX + MANSION_MAIN_W * P, MANSION_WING_W, MANSION_WING_FLOORS * R),
        standing(mainX, MANSION_TOWER_W, MANSION_TOWER_FLOORS * R),
        standing(mainX + (MANSION_MAIN_W - MANSION_TOWER_W) * P, MANSION_TOWER_W, MANSION_TOWER_FLOORS * R));
    // The blocks pile the rock is broken onto, until the last piece is set.
    add('mansion-blocks', standing(MANSION_BLOCKS_AT * P, MANSION_BLOCKS_W, 2));
  }

  // Heaven's gates over the yard: the leaves and their crest, the cloud bank
  // under them, and the stair of cloud down to the ground, left of the house.
  if (afterlifeOn() && portalStands('heaven')) {
    const e = portalEnd('heaven', 'yard');
    // One object: the stair climbs into the bank, which is where it ends.
    add('heaven-stairway', rect(e.x - ACT_GATES_REACH, e.top, ACT_GATES_REACH * 2, e.feet - e.top), ...bank(e), ...stairRects(e));
  }
  return out;
}

// The bank the gates stand in, in cells off the gates' middle column, and the
// cloud three cells deep under each tread: both are drawn in render/gates.js,
// off ACT_GATES_BANK_CELLS (config/acts.js) and its exported `stairPieces`.
function bank(e) {
  const cx = Math.round(e.x / P), ty = Math.round(e.feet / P), b = ACT_GATES_BANK_CELLS;
  return [rect((cx + b.lo) * P, ty * P, (b.hi - b.lo + 1) * P, ACT_GATES_BANK.deep * P)];
}
function stairRects(e) {
  const g = Math.round(S.groundY / P);
  return stairPieces(Math.round(e.x / P), g).map(({ x0, x1, r }) => rect(x0 * P, r * P, (x1 - x0 + 1) * P, 3 * P));
}

// --- the deep ---------------------------------------------------------------
function deepParts() {
  const out = [];
  for (const row of STATIONS) {
    if (row.place !== 'deep' || !row.stand || !row.open()) continue;
    const r = row.stand();
    if (!dim(r)) continue;
    // A party station's ground is its prop's, and the prop is the class it
    // takes (deep/props.js): over its life it stands as each of them in
    // turn, so it holds the ground of all of them at its slot.
    const st = row.party && stationById(row.key);
    const rects = st ? Object.keys(PROPS).map(cls => standOfStation({ ...st, cls: cls === 'flag' ? null : cls })) : [r];
    out.push({ id: row.key, rects: rects.map(q => ({ x: q.x, y: q.y, w: q.w, h: q.h })) });
  }
  if (S.snatched) {
    const p = deepPortal();
    out.push({ id: 'deep-portal', rects: [rect(p.x - p.r, p.y - p.r, p.r * 2, p.r * 2)] });
  }
  if (hellOn() && portalStands('hell')) {
    // As drawn (render/portals.js, `drawActsDeep`): a row of cells on the
    // floor, `r` either side of the middle one, and the glow a row over it.
    const e = portalEnd('hell', 'deep'), half = Math.round(e.r / P), x = Math.round(e.x / P) * P;
    out.push({ id: 'hell-slit', rects: [rect(x - half * P, Math.round(deepFloor() / P) * P - 2 * P, (2 * half + 1) * P, 2 * P)] });
  }
  return out;
}

// --- the afterlife ----------------------------------------------------------
// A station stands on what its drawing inks at its fullest, read off the
// drawing itself (render/after/kit.js, `silhouette`) rather than off a box
// or a reach typed beside it.
// The silhouette fills each row
// from its first inked cell to its last, so a row is one rect. Worked out
// once a station: the drawing does not move, and running it writes the pose
// its moving parts were drawn in.
const FULLEST = {};
const SHAPES = new Map();   // cache: each station's fullest silhouette, by key
function drawnRows(key) {
  if (!SHAPES.has(key)) SHAPES.set(key, DRAW[key] ? silhouette(d => DRAW[key](d, false, 0, null, false, FULLEST[key] || {})) : null);
  return SHAPES.get(key);
}
// Those rows in the world, turned with the drawing (`flip`).
export function drawnRects(key) {
  const rows = drawnRows(key);
  if (!rows) return null;
  const x0 = stationX0(key), fl = groundOf(key), flip = ART[key].flip || 0;
  return rows.map(([r, a, b]) => rect(x0 + (flip ? flip - 1 - b : a) * AP, fl + r * AP, (b - a + 1) * AP, AP));
}
// The pedestal draws no one shape: the podium bought stands on it, so it
// stands on the widest of them, as tall as the tallest (config/after.js,
// AFTER_PODIUM_HALF and AFTER_PODIUM_TOPS), and the rebel pile at its foot
// at its widest. The pile's size is a literal in its drawing
// (render/after/pedestal.js, `drawRebelPile`), read here off the config's
// copy of it.
function podiumRects() {
  const half = Math.max(...AFTER_PODIUM_HALF) * AFTER_PODIUM_U, h = Math.max(...AFTER_PODIUM_TOPS) * AFTER_PODIUM_U;
  const [w, ph] = AFTER_REBEL_PILE_CELLS;
  return [rect(podiumMid() - half, afterFloor() - h, half * 2, h), rect(pileX(), afterFloor() - ph * AP, w * AP, ph * AP)];
}
// The middle of what a station draws, across: the span of its drawing at its
// fullest (the pedestal's, the podium at its widest), its piles left out,
// since they are objects of their own. What stands centered on a station --
// its UPGRADES button and its roster -- stands centered on this, the
// station as the eye sees it, which its box (`stationBox`) is not where a
// part reaches past it (the saw mill's chute).
export function drawnMid(key) {
  const s = drawnSpan(key);
  return s && (s[0] + s[1]) / 2;
}
// ...and that span, [left, right] in world px, or null for no station.
export function drawnSpan(key) {
  if (key === 'pedestal') { const half = Math.max(...AFTER_PODIUM_HALF) * AFTER_PODIUM_U; return [podiumMid() - half, podiumMid() + half]; }
  const rs = drawnRects(key);
  if (!rs || !rs.length) { const b = stationBox(key); return b ? [b.x, b.x + b.w] : null; }
  return [Math.min(...rs.map(r => r.x)), Math.max(...rs.map(r => r.x + r.w))];
}
// What a station takes up but its board's spot: its drawing (or the podium), and its
// piles as high as the hand finds them, their counts over them (`piles`).
export function stationRects(key, piles = true) {
  const b = stationBox(key);
  if (!b) return null;
  const rs = key === 'pedestal' ? [b, ...podiumRects()] : drawnRects(key) || [b];
  if (piles) for (const what of Object.keys(ART[key].pile || {})) rs.push(pileBox(key, what, AFTER_PILE_REACH));
  return rs;
}
// A station's pile as an object of its own on the map, not a part of its
// station, so it may not touch its own station's drawing either: as high as
// the hand finds it, and AFTER_PILE_GAP cells of floor either side, the gap
// it is laid with (after/art.js, `layPiles`), which nothing else may stand in.
const pileRect = (key, what) => {
  const r = pileBox(key, what, AFTER_PILE_REACH), g = AFTER_PILE_GAP * AP;
  return rect(r.x - g, r.y, r.w + g * 2, r.h);
};

// The parts of a drawn station standing off its own ground: its drawing,
// piles and board's spot each inside the ground after/art.js lays for it (`lead` to
// `ground`, off the reach and piles typed there), or the camp's layout,
// which spaces the grounds and not the drawings, has put it on its
// neighbor's floor. Each as `key: what` with the cells it runs over. The
// pedestal is laid by the config round the podium's middle, not off its
// drawing, so it is not asked here (rule 21 still is).
export function offGround() {
  if (!afterlifeOn() || !S.after) return [];
  const out = [];
  for (const key of Object.keys(DRAW)) {
    if (!ART[key] || !stationBox(key)) continue;
    const x0 = stationX0(key) + ART[key].lead * AP, x1 = stationX0(key) + ART[key].ground * AP;
    const parts = [...stationRects(key).map(r => ['drawn', r]), ['board', signBox(key)]];
    for (const [what, r] of parts) {
      const over = Math.max(0, x0 - r.x, r.x + r.w - x1);
      if (over > 0) out.push(`${key}: ${what} ${over / AP} art cells past its ground`);
    }
  }
  return out;
}

function afterParts() {
  const out = [];
  if (!afterlifeOn() || !S.after) return out;
  const fl = afterFloor();
  // Every station of the camp, built or not: its ground is the camp's layout,
  // laid out in the config before anything is raised. Its board's spot is
  // claimed too, so nothing drawn stands where its board goes up.
  for (const key of Object.keys(ART)) {
    const rs = stationRects(key, false);
    if (!rs) continue;
    out.push({ id: key, rects: rs });
    out.push({ id: `board:${key}`, rects: [signBox(key)] });
    for (const what of Object.keys(ART[key].pile || {})) out.push({ id: `pile:${what}`, rects: [pileRect(key, what)] });
  }
  // The grove at its fullest: every plot a big pine (the box the hand reads).
  const rows = pineRows(PINE_GROWN, true);
  const a = Math.min(...rows.map(r => r[1])), z = Math.max(...rows.map(r => r[2])), top = Math.min(...rows.map(r => r[0]));
  for (let i = 0; i < AFTER_PLOT_MAX; i++)
    out.push({ id: `pine:${i}`, rects: [rect(plotX(i) + a * AP, fl + top * AP, (z - a + 1) * AP, -top * AP)] });
  if (globalThis.__groveMock) { const k = basketBox(); out.push({ id: 'seed-basket', rects: [rect(k.x, k.y - 4 * AP, k.w, k.h + 4 * AP)] }); } // MOCK grove  the seed basket and the acorns heaped in it
  // The sawdust heap stands under the saw mill's bed, inside its drawing
  // (after/mill.js), so it is the mill's footprint and claims none of its own.
  out.push({ id: 'throne-stair', rects: [rect(stairFoot(), fl - AFTER_STAIR_RISE, AFTER_STAIR_W, AFTER_STAIR_RISE)] });
  if (portalStands('heaven')) {
    const e = portalEnd('heaven', 'after');
    out.push({ id: 'heaven-gates', rects: [rect(e.x - ACT_GATES_REACH, e.top, ACT_GATES_REACH * 2, e.feet - e.top)] });
  }
  return out;
}

// --- hell -------------------------------------------------------------------
function hellParts() {
  const out = [];
  if (!hellOn()) return out;
  for (let i = 0; i < HELL_TIERS.length; i++) {
    out.push({ id: `furnace:${i}`, rects: [furnaceBox(i)] });
    out.push({ id: `barrier:${i}`, rects: [barrierBox(i)] });
  }
  if (portalStands('hell')) {
    const e = portalEnd('hell', 'hell');
    out.push({ id: 'hell-ring', rects: [rect(e.x - e.r, e.y - e.r, e.r * 2, e.r * 2)] });
  }
  return out;
}

const PARTS = { yard: yardParts, deep: deepParts, after: afterParts, hell: hellParts };

// Every object standing in `place` and the ground it takes.
export const footprints = place => PARTS[place]();

const meet = (a, b) => {
  const w = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
  const h = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
  return w > 0 && h > 0 ? { w, h } : null;
};

// The pairs of different objects in `place` that share ground, each with the
// size of the largest piece they share in cells, keyed `place:a|b` with the
// two ids in sorted order.
export function overlaps(place) {
  const list = footprints(place), out = [];
  for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) {
    let best = null;
    for (const ra of list[i].rects) for (const rb of list[j].rects) {
      const m = meet(ra, rb);
      if (m && (!best || m.w * m.h > best.w * best.h)) best = m;
    }
    if (!best) continue;
    const [a, b] = [list[i].id, list[j].id].sort();
    out.push({ place, a, b, key: `${place}:${a}|${b}`, w: best.w / P, h: best.h / P });
  }
  return out;
}

export const allOverlaps = () => PLACES.flatMap(overlaps);
