// Hell, drawn (DESIGN.md, "Acts 3 and 4", act 4, "The place: a run of
// chambers down to the cage room"). Its layers are in render.js's LAYERS,
// drawn only with the camera down there.
//
// PLACEHOLDER ART, all of it: flat cells on the P grid standing in for the
// hifi mocks, so the loop can be watched. Black hollows in grey rock, each
// cell a tone of its own off a fixed hash of where it stands; heat as white
// cells whose ink rises and falls (never a tone that pops); no red anywhere
// -- red is the sparks' -- and the fire white (DESIGN.md, "The look").
// Chambers behind a standing barrier are drawn hollow and empty: what is in
// them opens with the barrier's fall. The ghosts are drawn last, in the cage
// layer, because render.js has no layer of their own yet (Track C's file).

import { P, GREY, HELL_TIERS, HELL_W, HELL_H, HELL_FLOOR_CELLS, HELL_FLOOR_TONES, HELL_ROCK_TONES, HELL_ORE_TONES,
         HELL_BARRIER_TONES, HELL_X_IN, CHAMBER_W, CHAMBER_GAP, CHAMBER_H, CHAMBER_STEP, PASS_H, FACE_H, SEAM_MAX,
         LADDER_AT, ROAD_AT, FURNACE_FUEL_MAX, FACE_LOOSE_MAX, HOPPER_MAX, TRAY_MAX, TOOL_STROKES, FLARE_WARN_S,
         HEAT_SHIMMER_S, SWING_HOLD_S, GHOST_FADE_S, SPOIL_HEAP_ROW } from '../config.js';
import { S } from '../state.js';
import { HELL_JOB } from '../jobs.js';
import { ctx } from './ctx.js';
import { hellX0, hellX1, hellTop, hellFloor, chamberX0, chamberX1, chamberFloor, ledgeY, ladderX, faceX,
         ventX, furnaceBox, anvilX, storeX, roadX, roadTop, spoilX, barrierBox } from '../hell/place.js';
import { cellOrder, cellsDown, barrierFallen } from '../hell/barriers.js';
import { flareWarning, flareBurning } from '../hell/chambers.js';
import { hopperCount, trayCount } from '../hell/forge.js';
import { hellSwing } from '../hell/index.js';
import { CAGE } from '../hell/cage.js';
import { inkOf } from '../ink.js';

const N = HELL_TIERS.length;
const hash = (c, r, k = 0) => (((c * 83492791) ^ (r * 2654435761) ^ (k * 19349663)) >>> 0) % 9973;
const pick = (list, c, r, k) => list[hash(c, r, k) % list.length];
const cell = (x, y, tone) => { ctx.fillStyle = GREY[tone]; ctx.fillRect(x, y, P, P); };
const inView = (x0, x1) => x1 >= S.camX - P && x0 <= S.camX + S.viewW + P;
const t = () => S.hell?.clock || 0;

// A cell's tone, fixed by where it is (the floor under the run).
const toneAt = (c, r) => HELL_FLOOR_TONES[hash(c, r) % HELL_FLOOR_TONES.length];

export function drawHellBackdrop() {
  ctx.fillStyle = GREY[10];
  ctx.fillRect(S.camX, S.camY, S.viewW, S.viewH);
  const x0 = Math.max(hellX0(), Math.floor(S.camX / P) * P);
  const x1 = Math.min(hellX1(), Math.ceil((S.camX + S.viewW) / P) * P);
  const top = hellFloor();
  for (let r = 0; r < HELL_FLOOR_CELLS; r++) {
    for (let x = x0; x < x1; x += P) {
      ctx.fillStyle = GREY[toneAt(x / P, r)];
      ctx.fillRect(x, top + r * P, P, P);
    }
  }
  ctx.fillStyle = '#000';
}

// --- the rock, cut ---------------------------------------------------------------
// The rock and its hollows as one picture a cell a pixel, made again only
// when what is cut changes (a seam moving back, a chamber opening): fifty
// thousand cells a frame would be the frame.
let rock = null, rockKey = '';
// Written straight into the picture's pixels, past the fill setters that
// carry the dark page's map (ink.js), so each tone is put through hell's map
// here; the palette is fixed at boot, so once is enough.
const RGB = GREY.map(h => { const c = inkOf(h, 'hell'); return [1, 3, 5].map(k => parseInt(c.slice(k, k + 2), 16)); });
function cutRock() {
  const h = S.hell;
  const key = h ? `${h.chamber}|${h.seams.join(',')}` : '-';
  if (rock && key === rockKey) return rock;
  rockKey = key;
  const W = HELL_W / P, H = HELL_H / P;
  if (!rock) { rock = document.createElement('canvas'); rock.width = W; rock.height = H; }
  const g = rock.getContext('2d'), img = g.createImageData(W, H), px = img.data;
  const hollow = new Uint8Array(W * H), vein = new Int8Array(W * H).fill(-1);
  const box = (c0, r0, c1, r1, v = 1) => {
    for (let r = Math.max(0, r0); r < Math.min(H, r1); r++)
      for (let c = Math.max(0, c0); c < Math.min(W, c1); c++) hollow[r * W + c] = v;
  };
  for (let i = 0; i < N; i++) {
    const c0 = HELL_X_IN + i * (CHAMBER_W + CHAMBER_GAP), fr = H - (N - 1 - i) * CHAMBER_STEP;
    box(c0, fr - CHAMBER_H, c0 + CHAMBER_W, fr);
    if (i < N - 1) box(c0 + CHAMBER_W, fr - PASS_H, c0 + CHAMBER_W + CHAMBER_GAP, fr);
    // The ledge the passage comes out on: rock left standing under it, the
    // seam's wall, its face cut back by the depth mined.
    if (i > 0) box(c0, fr - CHAMBER_STEP, c0 + LADDER_AT, fr - FACE_H, 0);
    const depth = h ? h.seams[i] : 0;
    box(c0 - depth, fr - FACE_H, c0, fr);
    // The vein round the face: the chamber's ore through the rock, a cell in two.
    for (let r = fr - FACE_H - 2; r < fr; r++)
      for (let c = c0 - SEAM_MAX - 2; c < c0; c++)
        if (!hollow[r * W + c] && hash(c, r, i) % 2 === 0) vein[r * W + c] = i;
  }
  // The road's shaft down into the landing.
  const road = HELL_X_IN + ROAD_AT;
  box(road - 2, 0, road + 2, H - (N - 1) * CHAMBER_STEP - CHAMBER_H);
  for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) {
    const k = r * W + c, o = k * 4;
    const tone = hollow[k] ? 10 : vein[k] >= 0 ? HELL_ORE_TONES[vein[k]] : pick(HELL_ROCK_TONES, c, r, 1);
    const [R, G, B] = RGB[tone];
    px[o] = R; px[o + 1] = G; px[o + 2] = B; px[o + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  return rock;
}

function ladder(x, y0, y1) {
  ctx.fillStyle = GREY[5];
  ctx.fillRect(x - P, y0, 1, y1 - y0);
  ctx.fillRect(x + P - 1, y0, 1, y1 - y0);
  for (let y = y0 + P; y < y1; y += P) ctx.fillRect(x - P, y, 2 * P, 1);
}

// White cells that breathe: the heat off a floor, or a flare building.
function glow(x, y, k, ink) {
  const phase = (t() / HEAT_SHIMMER_S + (hash(x / P, y / P, k) % 100) / 100) * Math.PI * 2;
  ctx.globalAlpha = Math.max(0, Math.min(1, ink * (0.5 + 0.5 * Math.sin(phase))));
  ctx.fillStyle = GREY[0];
  ctx.fillRect(x, y, P, P);
}

export function drawHellChambers() {
  const img = cutRock();
  const was = ctx.imageSmoothingEnabled;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(img, hellX0(), hellTop(), HELL_W, HELL_H);
  ctx.imageSmoothingEnabled = was;
  const h = S.hell;
  ladder(roadX() + P / 2, roadTop(), chamberFloor(0));
  if (!h) return;
  for (let i = 0; i < N; i++) {
    if (!inView(chamberX0(i) - CHAMBER_GAP * P, chamberX1(i) + CHAMBER_GAP * P)) continue;
    if (i > 0 && i <= h.chamber) ladder(ladderX(i), ledgeY(i), chamberFloor(i));
    // The floor's heat: deeper is brighter. Behind a barrier, the glow alone.
    const fy = chamberFloor(i) - P, ink = 0.12 + 0.05 * i;
    for (let x = chamberX0(i); x < chamberX1(i); x += 3 * P) glow(x + (hash(x, i) % 3) * P, fy, i, ink);
    ctx.globalAlpha = 1;
    if (i > h.chamber) continue;
    // A flare building at the vent, then burning: white columns over it.
    const vx = ventX(i);
    if (flareWarning(i)) {
      const k = 1 - (h.flares[i].next - h.clock) / FLARE_WARN_S;
      for (let d = -2; d <= 2; d++) glow(vx + d * P, fy, 7 + d, 0.3 + 0.7 * k);
    }
    if (flareBurning(i)) {
      for (let d = -3; d <= 3; d++) {
        const tall = 4 + (hash(d + 9, Math.floor(h.clock * 8), i) % 6);
        for (let r = 1; r <= tall; r++) glow(vx + d * P, fy - r * P, d * 31 + r, 0.9);
      }
    }
    ctx.globalAlpha = 1;
  }
}

// --- the seams and the vents ---------------------------------------------------
export function drawHellSeams() {
  const h = S.hell;
  if (!h) return;
  for (let i = 0; i <= h.chamber; i++) {
    const fx = faceX(i, h.seams[i]), fy = chamberFloor(i), ore = HELL_TIERS[i].ore;
    if (!inView(fx - 10 * P, ventX(i) + 4 * P)) continue;
    // The face itself, a column of ore cells; slag over it while crusted.
    for (let r = 1; r <= FACE_H; r++) cell(fx - P, fy - r * P, h.faces[i].crust > 0 && hash(i, r) % 3 ? 6 : HELL_ORE_TONES[i]);
    // Lumps lying loose at its foot.
    const n = Math.min(FACE_LOOSE_MAX, h.ore[ore] || 0);
    for (let k = 0; k < n; k++) cell(fx + (k % 4) * P, fy - (1 + Math.floor(k / 4)) * P, HELL_ORE_TONES[i]);
    if (n >= FACE_LOOSE_MAX) fullMark(fx + 2 * P, fy - 5 * P);
    // The vent: a black slit with its crust heaped either side.
    const vx = ventX(i), crust = h.vents[i].crust;
    for (let k = 0; k < crust; k++) {
      const side = k % 2 ? 1 : -1, col = 1 + Math.floor(k / 4) % 3, row = Math.floor(k / 2) % 2;
      cell(vx + side * col * P, fy - (1 + row) * P, pick([2, 3, 2, 4], k, i));
    }
    ctx.fillStyle = GREY[10];
    ctx.fillRect(vx, fy - P, P, P);
  }
}

// The pile-full mark: a triangle of cells, outlined, over a full store.
function fullMark(x, y) {
  ctx.fillStyle = GREY[0];
  ctx.fillRect(x, y, P, P);
  ctx.fillRect(x - P, y + P, 3 * P, P);
  ctx.fillStyle = GREY[10];
  ctx.fillRect(x + 2, y + P + 1, 2, 3);
}

// --- the furnaces, the anvil and the store -------------------------------------
export function drawHellForge() {
  const h = S.hell;
  if (!h) return;
  for (let i = 0; i <= h.chamber; i++) {
    const b = furnaceBox(i), f = h.furnaces[i];
    if (!inView(b.x - 4 * P, b.x + b.w + 4 * P)) continue;
    // The stack: grey brick cells, a mouth that whitens as it warms.
    for (let r = 0; r < b.h / P; r++) for (let c = 0; c < b.w / P; c++) cell(b.x + c * P, b.y + r * P, pick([6, 7, 6, 5], c, r, i));
    ctx.fillStyle = GREY[10];
    ctx.fillRect(b.x + 2 * P, b.y + b.h - 4 * P, b.w - 4 * P, 3 * P);
    if (f.warm > 0) {
      ctx.globalAlpha = f.warm;
      for (let c = 2; c < b.w / P - 2; c++) glow(b.x + c * P, b.y + b.h - 2 * P, c + i * 9, 1);
      ctx.globalAlpha = 1;
    }
    // Its fuel, a pip a brimstone up the side; its hopper on top; its tray.
    for (let k = 0; k < f.fuel; k++) cell(b.x - P, b.y + b.h - (k + 1) * (b.h / FURNACE_FUEL_MAX), 3);
    const hop = hopperCount(f);
    for (let k = 0; k < hop; k++) cell(b.x + (1 + (k % 6)) * P, b.y - (1 + Math.floor(k / 6)) * P, 4);
    if (hop >= HOPPER_MAX) fullMark(b.x + b.w / 2, b.y - 4 * P);
    let k = 0;
    for (const t2 of HELL_TIERS) for (let n = 0; n < (f.tray[t2.ore] || 0); n++, k++)
      cell(b.x + b.w + P + (k % 2) * P, b.y + b.h - (1 + Math.floor(k / 2)) * P, HELL_ORE_TONES[HELL_TIERS.indexOf(t2)]);
    if (trayCount(f) >= TRAY_MAX) fullMark(b.x + b.w + 2 * P, b.y + b.h - 7 * P);
  }
  // The anvil: a horn and a waist on a block; white sparks as it is struck.
  const ax = anvilX(), fy = chamberFloor(0);
  if (inView(ax - 6 * P, storeX() + 8 * P)) {
    ctx.fillStyle = GREY[3];
    ctx.fillRect(ax - 2 * P, fy - 3 * P, 5 * P, P);
    ctx.fillRect(ax - 3 * P, fy - 3 * P, P, P / 2);
    ctx.fillRect(ax, fy - 2 * P, P, P);
    ctx.fillRect(ax - P, fy - P, 3 * P, P);
    if (h.forge) {
      const sm = h.bodies.find(b => b.job === HELL_JOB.SMITH && b.swung != null && b.swung < SWING_HOLD_S);
      if (sm) for (let d = 0; d < 3; d++) cell(ax + (d - 1) * P, fy - (4 + d % 2) * P, 0);
      // The work on it, its strokes a pip each up its side.
      const done = h.forge.strokes / TOOL_STROKES;
      ctx.fillStyle = GREY[0];
      ctx.fillRect(ax - 2 * P, fy - 4 * P, Math.max(1, 5 * P * done), 1);
    }
    // The store: brimstone heaped, bars stacked, water barrels.
    const sx = storeX();
    for (let k = 0; k < Math.min(30, h.brimstone); k++) cell(sx + (k % 6) * P, fy - (1 + Math.floor(k / 6)) * P, pick([2, 3], k, 0));
    let k = 0;
    HELL_TIERS.forEach((t2, ti) => { for (let n = 0; n < Math.min(6, h.bars[t2.ore] || 0); n++, k++)
      { ctx.fillStyle = GREY[HELL_ORE_TONES[ti]]; ctx.fillRect(sx - 4 * P + (k % 3) * P, fy - (1 + Math.floor(k / 3)) * P / 2 - P / 2, P, P / 2); } });
    for (let n = 0; n < h.water; n++) { cell(sx + 7 * P + n * P, fy - P, 10); cell(sx + 7 * P + n * P, fy - 2 * P, 8); }
  }
  for (let n = 0; n < h.road; n++) { cell(roadX() + 2 * P + n * P, fy - P, 10); cell(roadX() + 2 * P + n * P, fy - 2 * P, 8); }
}

// --- the barriers ------------------------------------------------------------------
// Each barrier's cells but the ones knocked out, in the order they come out
// (barriers.js, `cellOrder`), so the hole drawn is the hole the blows made.
const PATTERN = [
  (c, r, i) => pick(HELL_BARRIER_TONES[i], c, r, i),                                     // rubble: fused slag, mixed
  (c, r, i) => (r % 2 === 1 ? 7 : (c + (r % 4 === 0 ? 0 : 2)) % 4 === 0 ? 7 : pick(HELL_BARRIER_TONES[i], c, r, i)), // bone, coursed
  (c, r, i) => (c % 3 === 1 ? 2 : pick(HELL_BARRIER_TONES[i], c, r, i)),                 // the gate, its seams white
  (c, r, i) => ((c + r) % 2 === 0 ? pick(HELL_BARRIER_TONES[i], c, r, i) : -1),          // chains: links, gaps between
  (c, r, i) => (c % 3 === 0 ? pick(HELL_BARRIER_TONES[i], c, r, i) : -1)                 // the cage: bars
];
export function drawHellBarriers() {
  const h = S.hell;
  if (!h) return;
  for (let i = 0; i < N; i++) {
    const b = barrierBox(i);
    if (!inView(b.x - P, b.x + b.w + P)) continue;
    // God in the cage room: a pale square hanging inside the cage.
    if (i === CAGE) {
      ctx.fillStyle = GREY[1];
      ctx.fillRect(b.x + b.w / 2 - P, b.y + 6 * P, 2 * P, 2 * P);
      ctx.fillStyle = GREY[4];
      ctx.fillRect(b.x + b.w / 2, b.y, 1, 6 * P);
    }
    if (!barrierFallen(i)) {
      const order = cellOrder(i), gone = cellsDown(i);
      const rest = order.slice(gone);
      for (const { c, r } of rest) {
        const tone = PATTERN[i](c, r, i);
        if (tone >= 0) cell(b.x + c * P, b.y + r * P, tone);
      }
      // A flare's slag over it.
      if (h.walls[i].crust > 0) for (let r = 0; r < b.h / P; r += 3) cell(b.x, b.y + r * P, 6);
      // Worked but not yet a hole: hairline cracks a cell long, white.
      if ((h.blows[i] || 0) > 0 && gone === 0) { ctx.fillStyle = GREY[0]; ctx.fillRect(b.x + b.w / 2, b.y + b.h / 2, 1, P); }
    }
    // Spoil at its foot, and on its heap.
    const fy = chamberFloor(i);
    for (let k = 0; k < h.walls[i].loose; k++) cell(b.x - (1 + k % 3) * P, fy - (1 + Math.floor(k / 3)) * P, pick(HELL_BARRIER_TONES[i], k, 0, i));
    const sx = spoilX(i);
    for (let k = 0; k < h.walls[i].heap; k++) {
      const row = Math.floor(k / SPOIL_HEAP_ROW), w = Math.max(1, SPOIL_HEAP_ROW - row * 2);
      cell(sx + (row + (k % SPOIL_HEAP_ROW) % w) * P, fy - (1 + row) * P, pick(HELL_BARRIER_TONES[i], k, 1, i));
    }
  }
  for (const p of h.pieces) cell(p.x, p.y, pick(HELL_BARRIER_TONES[p.b], Math.round(p.x), 3, p.b));
}

// --- the cage room, and the ghosts ---------------------------------------------
// The ghosts: pale-rimmed squares, a pick held in a pose while it swings
// and lowered after, whatever they carry over their heads.
function ghost(b) {
  const x = Math.round(b.x - P), y = Math.round(b.y - 2 * P);
  ctx.globalAlpha = Math.min(1, b.age / GHOST_FADE_S);
  ctx.fillStyle = GREY[2];
  ctx.fillRect(x, y, 2 * P, 2 * P);
  ctx.fillStyle = GREY[8];
  ctx.fillRect(x + 1, y + 1, 2 * P - 2, 2 * P - 2);
  const swinging = b.swung != null && b.swung < SWING_HOLD_S;
  const job = b.job;
  if (job === HELL_JOB.MINE || job === HELL_JOB.GANG || job === HELL_JOB.SMITH) {
    ctx.fillStyle = GREY[3];
    const hx = b.face > 0 ? x + 2 * P : x - P;
    if (swinging) ctx.fillRect(hx, y + P, P, 2);               // struck: the head down, level with the work
    else ctx.fillRect(hx, y - P / 2, 2, P + P / 2);            // raised
  }
  if (b.carry) {
    const tone = b.carry.what === 'ore' || b.carry.what === 'bar' ? HELL_ORE_TONES[HELL_TIERS.findIndex(t2 => t2.ore === b.carry.ore)]
               : b.carry.what === 'brim' ? 3 : b.carry.what === 'water' ? 10 : b.carry.what === 'tool' ? 0 : 6;
    ctx.fillStyle = GREY[tone];
    ctx.fillRect(x + P / 2, y - P, P, b.carry.what === 'bar' ? P / 2 : P);
  }
  ctx.globalAlpha = 1;
}

// The ghosts, a layer of their own so the corner's crew switch fades or
// hides them and nothing else (render.js, `dim`).
export function drawHellGhosts() {
  const h = S.hell;
  if (!h) return;
  for (const b of h.bodies) if (inView(b.x - P, b.x + P)) ghost(b);
}

export function drawHellCage() {
  const h = S.hell;
  if (!h) return;
  // The pair's own swing at the click, held a beat.
  const sw = hellSwing();
  if (sw && h.clock - sw.at < SWING_HOLD_S && h.clock >= sw.at) {
    ctx.fillStyle = sw.did === 'ring' ? GREY[0] : GREY[3];
    ctx.fillRect(sw.x - P, sw.y - P / 2, 2 * P, 2);
    if (sw.did === 'ring') { ctx.fillRect(sw.x + P, sw.y - P, 1, P); ctx.fillRect(sw.x - P, sw.y, 1, P); }
  }
}

