// The deep: the inside of the abyss the drowned pit holds (DESIGN.md, "The
// deep is the inside of the abyss in the pit"). Its sky, its water, its motes,
// its floor and the stations on it, the bodies swimming there, and the one
// fill at the end that turns the whole of it over.
//
// The palette is the yard's, inverted (docs/wave-serpent.md, "The palette"):
// everything here draws in the ordinary inks on the paper, and on the light
// page `deep invert` turns every channel of the deep over, so the
// paper comes out as the liquid's black and every mark as its negative. The
// dark page needs no turning over -- its paper is already dark and its map
// already turns black to the light ink -- so there the fill is skipped and
// the deep is dark on both pages. A tone this file names is the tone it will
// be SEEN in, the abyss's own greys and purples, and is turned once at load
// (`seen`) into what has to be drawn to come out that way. The bodies, the
// serpent and the scales draw as they would in the yard and come out white.

import { now } from '../clock.js';
import { bodyInk } from './recede.js';
import { CRUSH_FIRE, CRUSH_STIR, CRUSH_HEAT, CRUSH_SPARKS, CRUSH_SPARK_MS,
         CRUSH_SPARK, SERPENT_PHASES } from '../config.js';
import { invertByFilter } from './invert.js';
import { P, WORKER, ABYSS_TONES, ABYSS_MAGIC_TONES, ABYSS_FLOW_MS, ABYSS_FLOW_COL, ABYSS_FLOW_ROW,
         ABYSS_FLOW_SHEAR, ABYSS_FLOW_ASPECT, ABYSS_FLOW_DRIFT, ABYSS_SHEAR_ROW, ABYSS_SHEAR_TURN,
         ABYSS_SHEAR_AMT2, ABYSS_SHEAR_COL, ABYSS_SHEAR_AMT_Y, ABYSS_FLOW_COL2, ABYSS_FLOW_ROW2,
         ABYSS_FLOW_DRIFT2, ABYSS_FLOW_MIX, ABYSS_VEIL_AT, ABYSS_VEIL_EVERY, ABYSS_VEIL_JITTER,
         ABYSS_STAR_MS, ABYSS_BREATH_BEND, ABYSS_RIPPLE_MS,
         DEEP_H, DEEP_CURRENT, DEEP_CURRENT_MS, COIL_SEGS,
         DEEP_SURFACE, DEEP_WATER_DEPTH,
         DEEP_MOTE_TINTS, DEEP_SILT, DEEP_SILT_SINK,
         DEEP_FLECK_EVERY, DEEP_FLECK_LIFE, DEEP_MOTES_MAX, DEEP_PURPLE,
         DEEP_STAR_THIN, DEEP_STAR_DIM, DEEP_MOTE_FADE_MS, DEEP_MOTE_RIM, DEEP_WAVE,
         DEEP_FLOOR_TOP_RUNG, DEEP_FLOOR_BOTTOM_RUNG, DEEP_FLOOR_FADE_ROWS, DEEP_FLOOR_BAYER } from '../config.js';
import { S, deepBed } from '../state.js';
import { deepTop, deepFloor, deepX0, deepX1, mouthX, coilAt, crusherRect, podAt,
         waterShift } from '../deep/place.js';
import { paintAbyssField } from './abyssfield.js';
import { shiftAt, WAVE_REACH } from './deepwave.js';
import { abyssLine } from '../pit.js';
import { CRUSHER_SPRITES } from '../deep/sprites.js';
import { propCells, brewCells } from '../deep/props.js';
import { topRow } from '../grid.js';
import { drawMark } from './marks.js';
import { raw, darkPage } from '../ink.js';
import { ctx } from './ctx.js';
import { swellAt } from './cores.js';
import { hash } from './flicker.js';
import { drawBody, inTheDeep } from './crew.js';
import * as place from '../deep/place.js';
import { SCAFFOLD_BANDS, CAPSTONE_RUNG, PLINTH_H, PLINTH_TONES, DOME_TONES, CHOOSE_MARK, CHOOSE_MARK_UP, CHOOSE_MARK_BOB_MS } from '../config.js';
import { unchosen } from '../deep/party.js';
import { doneAt } from '../works.js';
import { TYPE } from '../jobs.js';
import { GREYS, PURPLES, TONE, LIGHT, breathAt } from './deeptones.js';

const isFighter = w => w.type === TYPE.FIGHTER;

// --- the inverted palette ---------------------------------------------------------
// A tone as it is to be seen, turned into what is drawn to get it
// (render/deeptones.js): six greys and five purples, and white.
export { GREYS, PURPLES };
const MOTE_TONES = Object.fromEntries(Object.entries(DEEP_MOTE_TINTS)
  .map(([k, v]) => [k, v.tones.map(i => (v.purple ? PURPLES : GREYS)[i])]));
// The breathing light along a top edge, as drawn, at `ms`.
const breath = ms => PURPLES[breathAt(ms)];

// --- where the deep is on the screen ----------------------------------------------
// The window over the deep, in world pixels on the cell lattice. The deep's
// layers draw only what is in it.
export function deepWindow() {
  const x0 = Math.floor(S.camX / P) * P, y0 = Math.floor(S.camY / P) * P;
  return { x0, y0, x1: Math.ceil((S.camX + S.viewW) / P) * P, y1: Math.ceil((S.camY + S.viewH) / P) * P };
}

// --- the water ----------------------------------------------------------------
// One flat water (the zones' layer lays it, render/fauna.js), and in it the
// drowned pit's stars alone, every one purple: the same field
// (`drawAbyss`, render/cores.js), the same constants, so the deep is plainly
// the same fluid seen from inside it, but with no veil. A star breathes up
// the kept purples a held step at a time; under the dimmest it is not drawn,
// since the water is the one grey over black and a darker star is a hole.
const STAR_SHARE = 7;   // stars in seven that are purple: all of them
const STARS = PURPLES.map((c, i) => (i < DEEP_PURPLE.dim ? null : c));
export function drawDeepWater() {
  const { x0, y0, x1, y1 } = deepWindow();
  // The whole window, top edge to floor: the deep has no surface on screen
  // (DESIGN.md, "The way between the halves"). The field is the drowned
  // pit's own liquid, carried on under it, and at its full depth from the
  // window's top edge down: its fade toward the pit's surface would stand in
  // the deep as a black band over the water wherever the window reaches
  // higher than the deep's own top, as a tall one does.
  const top = y0, bottom = Math.min(y1, deepFloor());
  if (bottom <= top) return;
  // The swell carries the stars (render/deepwave.js): in from past the
  // window's edges, but never up out of the floor, where no star is seated.
  const tS = now() / 1000;
  const reach = bottom < y1 ? { ...WAVE_REACH, down: 0 } : WAVE_REACH;
  paintAbyssField({ from: x0, to: x1, top, bottom, line: abyssLine(), rowShift: waterShift(),
                    deep: DEEP_WATER_DEPTH, tones: GREYS, magic: STARS, t: now(),
                    veil: false, magicShare: STAR_SHARE, thin: DEEP_STAR_THIN, dim: DEEP_STAR_DIM, fade: true,
                    shift: (c, out) => shiftAt(c, tS, 0, out), reach });
  ctx.fillStyle = '#000';
}

// --- the floor -----------------------------------------------------------------
// The ground under the deep, flat, its top course a rung lighter so the floor
// has an edge against the water, and the scales lying on it through the
// bed's own painter (deep/scales.js lays it): a plot like the pit's. Deep
// enough for the tallest window the deep is framed in, and as wide as the
// deep or the window, whichever is wider: a window wider than the deep is
// held at its left end and shows past its right one.
const GROUND_ROWS = 40;
// The top course dithers down through the ground into the darker grey
// (config DEEP_FLOOR_*). The band is one tile four cells wide, painted once
// and laid as a pattern from the floor's top, so a cell is the same cell
// whatever the camera does: the tile's x origin is the world's, and four
// cells divide it. Below the band the floor is flat.
let floorPat = null, floorBand = 0;
function floorPattern() {
  if (floorPat) return floorPat;
  const top = DEEP_FLOOR_TOP_RUNG, bottom = DEEP_FLOOR_BOTTOM_RUNG, rows = DEEP_FLOOR_FADE_ROWS;
  const off = document.createElement('canvas');
  floorBand = rows + 1;
  off.width = 4 * P; off.height = floorBand * P;
  const g = off.getContext('2d');
  for (let r = 0; r < floorBand; r++) for (let c = 0; c < 4; c++) {
    const L = top - (top - bottom) * Math.min(1, r / rows);
    const k = Math.max(bottom, Math.min(top - 2, 2 * Math.floor(L / 2)));
    const rung = DEEP_FLOOR_BAYER[r & 3][c & 3] < (L - k) / 2 * 16 ? k + 2 : k;
    g.fillStyle = GREYS[rung];
    g.fillRect(c * P, r * P, P, P);
  }
  return (floorPat = ctx.createPattern(off, 'repeat'));
}
export function drawDeepFloor() {
  const win = deepWindow();
  const fy = deepFloor(), from = Math.min(win.x0, deepX0() - P * 4), to = Math.max(win.x1, deepX1() + P * 4);
  const pat = floorPattern();
  ctx.save();
  ctx.translate(0, fy);
  ctx.fillStyle = pat;
  ctx.fillRect(from, 0, to - from, floorBand * P);
  ctx.fillStyle = GREYS[DEEP_FLOOR_BOTTOM_RUNG];
  ctx.fillRect(from, floorBand * P, to - from, (GROUND_ROWS - floorBand) * P);
  ctx.restore();
  ctx.fillStyle = '#000';
}

export function drawDeepBed() {
  const b = deepBed;
  if (!b.painter || !b.grid) return;
  b.painter.paint(ctx, b.x, b.y, b.cols * b.p, b.rows * b.p);
}

// Where the bed's top stands at a world x: a sigil and a station stand on
// the scales rather than under them.
export function bedTop(x) {
  const b = deepBed;
  if (!b.grid) return deepFloor();
  const c = Math.floor((x - b.x) / b.p);
  if (c < 0 || c >= b.cols) return deepFloor();
  let r = b.rows - 1;
  while (r >= 0 && !b.grid[r * b.cols + c]) r--;
  return deepFloor() - (r + 1) * b.p;
}

// --- the crusher -----------------------------------------------------------------
// The furnace's drawing is the deep's geometry (deep/sprites.js); these are
// the tones its characters are seen in: frame and brick one flat stone, the
// mortar a rung under it so it still reads as brick, its door the hole, and
// every cell with nothing over it the breathing light (`TOP`).
const SPRITE_INK = { '#': TONE.stone, '+': TONE.stone, '-': TONE.ground, 'o': TONE.hole, '*': LIGHT.bright };
const TOP = 'top';

// The crusher, a brick furnace (deep/sprites.js), painted at crusherRect():
// the drawing, painted once into an image of its own as a station is and
// kept by where the crusher stands, so a resize repaints it; then the fire
// in its door, drawn over that every frame; then the sparks of each scale
// that has gone in lately (`S.crushes`).
const FURNACE = CRUSHER_SPRITES.rest;
// A cell of the frame or the brick with open water over it: the edge the light catches.
const isBrick = ch => ch === '#' || ch === '+' || ch === '-';
const topEdge = (r, col) => isBrick(FURNACE[r][col]) && !isBrick(FURNACE[r - 1]?.[col]);
let furnace = null;
function crusherImage(c, t) {
  const lit = breath(t), id = `${c.x}|${c.y}|${lit}`;
  if (furnace && furnace.id === id) return furnace;
  const img = document.createElement('canvas');
  img.width = FURNACE[0].length * P; img.height = FURNACE.length * P;
  const g = img.getContext('2d');
  for (let r = 0; r < FURNACE.length; r++) {
    for (let col = 0; col < FURNACE[r].length; col++) {
      const ink = topEdge(r, col) ? lit : SPRITE_INK[FURNACE[r][col]];
      if (!ink) continue;
      g.fillStyle = ink;
      g.fillRect(col * P, r * P, P, P);
    }
  }
  furnace = { id, img };
  return furnace;
}

// The door, read off the drawing: every open cell under the brick's top
// edge (the chute's are over it). Its foot is the lowest of them and its
// middle their mean column, so the fire's heart sits on the door's own axis.
const BRICK_TOP = FURNACE.findIndex(row => row.includes('####'));
const DOOR = [];
FURNACE.forEach((row, r) => {
  if (r > BRICK_TOP) [...row].forEach((ch, c) => { if (ch === 'o') DOOR.push([r, c]); });
});
const DOOR_FOOT = Math.max(...DOOR.map(([r]) => r));
const DOOR_MID = DOOR.reduce((sum, [, c]) => sum + c, 0) / DOOR.length;
const FIRE_WHITE = TONE.white, FIRE_GREY = TONE.pale;
const rung = k => PURPLES[Math.max(0, Math.min(PURPLES.length - 1, Math.round(k)))];

// How warm the scales going in have made it, 0..1: each swells in and eases
// back, summed and bent under one.
function fireHeat(t) {
  const { each, swellS, easeS } = CRUSH_HEAT;
  let sum = 0;
  for (const q of S.crushes) {
    const d = (t - q.at) / 1000;
    if (d > 0) sum += each * (1 - Math.exp(-d / swellS)) * Math.exp(-d / easeS);
  }
  return 1 - Math.exp(-sum);
}

// The stir, -1..1, in the door's cells and seconds.
function stir(x, y, t) {
  const { a, bend, b } = CRUSH_STIR;
  const one = Math.sin(x * a.col + t * a.t + Math.sin(y * bend.row - t * bend.t) * bend.amp);
  const two = Math.sin(y * b.row + t * b.t + x * b.col);
  return (one + two) * 0.5;
}

// The fire: every cell of the door reads a heat -- highest at the heart,
// falling off upward and outward, stirred by the climbing noise -- and paints
// the rung it reaches: white, the palest grey, then down the purple ramp.
// The whole field breathes, and burns up as scales go in.
function drawFire(c, t) {
  const F = CRUSH_FIRE, s = t / 1000;
  const breath = 0.5 + 0.5 * Math.sin(2 * Math.PI * s / F.breathS);
  const base = F.base + breath * F.breath + fireHeat(t) * F.heat;
  for (const [r, col] of DOOR) {
    const up = DOOR_FOOT - r, side = col - DOOR_MID;
    const v = base - up * F.rise - side * side * F.side + stir(col, r + s * F.climb, s) * F.stir;
    if (v < F.dark) continue;
    ctx.fillStyle = v > F.white ? FIRE_WHITE : v > F.grey ? FIRE_GREY : rung(F.rampAt + v * F.rampPer);
    ctx.fillRect(c.x + col * P, c.y + r * P, P, P);
  }
}

// Each scale's sparks: out of the door's foot either way, over the brick and
// down onto the floor at the drawing's foot, white as they leave and cooling
// down the purple ramp as they land.
function drawSparks(c, t) {
  const K = CRUSH_SPARK, floor = FURNACE.length - 1;
  for (const q of S.crushes) {
    const u = (t - q.at) / CRUSH_SPARK_MS;
    if (u < 0 || u > 1) continue;
    for (let i = 0; i < CRUSH_SPARKS; i++) {
      const dir = i % 2 ? 1 : -1, speed = K.speed + hash(q.id * 5 + i) * K.spread;
      const x = Math.round(DOOR_MID + dir * (K.out + speed * u));
      const y = Math.round(Math.min(DOOR_FOOT - K.up - K.rise * u + K.fall * u * u, floor));
      ctx.fillStyle = u < K.whiteFor ? FIRE_WHITE
        : rung(PURPLES.length - 1 - Math.max(0, u - K.coolAfter) * K.cool);
      ctx.fillRect(c.x + x * P, c.y + y * P, P, P);
    }
  }
}

function drawCrusher() {
  const c = crusherRect(), t = now();
  const smooth = ctx.imageSmoothingEnabled;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(crusherImage(c, t).img, c.x, c.y);
  ctx.imageSmoothingEnabled = smooth;
  drawFire(c, t);
  drawSparks(c, t);
  ctx.fillStyle = '#000';
}

// The pods: a capsule for each of the crew who lives down here, stacked from
// the floor. A flat hull, a rim a rung above it with its top edge the
// breathing light, and a porthole lit from inside, so a stack reads as
// somewhere people live.
function drawPods() {
  const lit = breath(now());
  for (let i = 0; i < (S.pods || 0); i++) {
    const r = podAt(i);
    for (let y = r.y; y < r.y + r.h; y += P) {
      for (let x = r.x; x < r.x + r.w; x += P) {
        const edgeX = x === r.x || x === r.x + r.w - P, edgeY = y === r.y || y === r.y + r.h - P;
        if (edgeX && edgeY) continue;                                  // rounded
        ctx.fillStyle = y === r.y ? lit : edgeX || edgeY ? TONE.stone : TONE.ground;
        ctx.fillRect(x, y, P, P);
      }
    }
    const px = r.x + Math.round((r.w / 2 - P) / P) * P, py = r.y + P;
    ctx.fillStyle = TONE.lit;
    ctx.fillRect(px, py, P * 2, P * 2);
  }
}

// --- the party's stations, at their slots -----------------------------------------
// A station is its fighter and a prop (DESIGN.md, "A station is its fighter
// and a prop"): the fighter is the fighters' layer's (render/arms.js), and
// here is the prop beside its post -- the crate below the fork, the class's
// own from it, its parts purple from rung 8. Where it stands is place.js's
// (`propRect`), and what it is made of props.js's (`propCells`).
const snap = v => Math.round(v / P) * P;
// A prop's cell as drawn: 'g' a grey rung, 'p' a purple one, 'top' the
// breathing light along its top edges (deep/props.js, `propCells`).
const toneOf = (ramp, i, lit) => (ramp === 'top' ? lit : (ramp === 'p' ? PURPLES : GREYS)[i]);

// A prop never changes but at the fork and at rung 8, so each is painted
// once into an image of its own, a cell a cell, and drawn from there. Kept by
// the prop and whether it is lit; it is drawn at wherever its station stands.
const painted = new Map();
function propImage(key, lit, light) {
  const id = `${key}|${lit ? 8 : 0}|${light}`;
  let img = painted.get(id);
  if (img) return img;
  const cells = propCells(key, lit);
  img = document.createElement('canvas');
  img.width = Math.max(...cells.map(c => c[0] + 1)) * P;
  img.height = Math.max(...cells.map(c => c[1] + 1)) * P;
  const g = img.getContext('2d');
  for (const [c, r, ramp, i] of cells) { g.fillStyle = toneOf(ramp, i, light); g.fillRect(c * P, r * P, P, P); }
  painted.set(id, img);
  return img;
}

// The plinth under a station (`plinthRect`): a lit top course over flat
// stone, each course a cell further out than the one over it. The same for
// every station of one width, so painted once a width.
const plinths = new Map();
function plinthImage(b) {
  const cols = b.w / P, steps = b.step / P, id = `${cols}|${steps}`;
  let img = plinths.get(id);
  if (img) return img;
  const across = cols + 2 * steps * (PLINTH_H - 1);
  img = document.createElement('canvas');
  img.width = across * P; img.height = PLINTH_H * P;
  const g = img.getContext('2d');
  for (let r = 0; r < PLINTH_H; r++) {
    const l = steps * (PLINTH_H - 1 - r), n = cols + 2 * steps * r;
    g.fillStyle = GREYS[r === 0 ? PLINTH_TONES.top : PLINTH_TONES.body];
    g.fillRect(l * P, r * P, n * P, P);
  }
  plinths.set(id, img);
  return img;
}
function drawPlinth(st) {
  const b = place.plinthRect(st);
  ctx.drawImage(plinthImage(b), b.x - b.step * (PLINTH_H - 1), b.y);
}
// The low dome behind a built station (`domeRect`): one flat rung over the
// water, the floor's own, and along its top edge a dim purple, a few rungs
// under the light the props breathe so the dome stays behind them. The same
// for every dome of one size, so painted once a size.
const domes = new Map();
function domeImage(w, wall) {
  const id = `${w}|${wall}`;
  let img = domes.get(id);
  if (img) return img;
  const cols = w / P, r = cols / 2, rows = Math.ceil(r) + wall;
  const inside = (c, y) => {
    if (c < 0 || c >= cols || y < 0 || y >= rows) return false;
    if (y >= rows - wall) return true;
    const dx = c + 0.5 - r, dy = y + 0.5 - (rows - wall);
    return dx * dx + dy * dy <= r * r;
  };
  img = document.createElement('canvas');
  img.width = w; img.height = rows * P;
  const g = img.getContext('2d');
  for (let y = 0; y < rows; y++) for (let c = 0; c < cols; c++) {
    if (!inside(c, y)) continue;
    g.fillStyle = inside(c, y - 1) ? GREYS[DOME_TONES.wall] : PURPLES[DOME_TONES.edge];
    g.fillRect(c * P, y * P, P, P);
  }
  domes.set(id, img);
  return img;
}
function drawDome(st) {
  const d = place.domeRect(st), wall = (deepFloor() - d.spring) / P, img = domeImage(d.w, wall);
  ctx.drawImage(img, d.x, deepFloor() - img.height);
}


function drawProp(st, t) {
  const p = place.propRect(st), lit = (st.rung || 0) >= CAPSTONE_RUNG, light = breath(t * 1000);
  ctx.drawImage(propImage(p.key, lit, light), p.x, p.y);
  // the one prop that moves: the hexer's brew, over its pot
  for (const [c, r, ramp, i] of brewCells(p.key, lit, t)) {
    ctx.fillStyle = toneOf(ramp, i, light);
    ctx.fillRect(p.x + c * P, p.y + r * P, P, P);
  }
}

// A station not built yet stands as a building site does (render/buildsites.js):
// a striped post each side of the ground it will stand on and the tape
// between them at head height, until a delver's work lands.
function drawScaffold(stand) {
  const postW = P * 2, postH = P * SCAFFOLD_BANDS;
  const left = snap(stand.x) - P * 3 - postW, right = snap(stand.x + stand.w) + P * 3;
  const top = deepFloor() - postH;
  ctx.fillStyle = TONE.lit;
  for (const x of [left, right]) for (let i = 0; i < SCAFFOLD_BANDS; i += 2) ctx.fillRect(x, top + i * P, postW, P);
  for (let x = left + postW; x < right; x += P * 2) ctx.fillRect(x, deepFloor() - P * 3, P, 2);
}

// The mark over a station whose Recruit waits on rung 1: where it hangs, its
// top-left, centered over the station's ground and bobbing a held cell.
const MARK_W = CHOOSE_MARK[0].length * P, MARK_H = CHOOSE_MARK.length * P;
export function chooseMarkAt(st, t = now()) {
  const g = place.standOfStation(st), bob = Math.floor(t / CHOOSE_MARK_BOB_MS) % 2;
  return { x: snap(g.x + g.w / 2 - MARK_W / 2), y: g.y - (CHOOSE_MARK_UP + bob) * P - MARK_H, w: MARK_W, h: MARK_H };
}
// Whether a station wears it: its Recruit waiting, and the build's own done
// check already read -- that one says it stands, and stays until its board
// is opened; the two never stack on one station.
const wearsMark = st => unchosen(st) && !doneAt(st.id).length;
// The station whose mark the pointer (world x, y) is over, if any.
export const overChooseMark = (x, y) => (S.stations || []).find(st => {
  if (!wearsMark(st)) return false;
  const m = chooseMarkAt(st);
  return x >= m.x - P && x < m.x + m.w + P && y >= m.y - P && y < m.y + m.h + 2 * P;
}) || null;
// White on a black keyline: every empty cell touching the ink, then the ink.
function drawChooseMark(st) {
  const m = chooseMarkAt(st), rows = CHOOSE_MARK, ink = (r, c) => rows[r]?.[c] === '#';
  ctx.fillStyle = TONE.hole;
  for (let r = -1; r <= rows.length; r++) for (let c = -1; c <= rows[0].length; c++) {
    if (ink(r, c)) continue;
    let touch = false;
    for (let dr = -1; dr <= 1 && !touch; dr++) for (let dc = -1; dc <= 1; dc++) if (ink(r + dr, c + dc)) { touch = true; break; }
    if (touch) ctx.fillRect(m.x + c * P, m.y + r * P, P, P);
  }
  ctx.fillStyle = TONE.white;
  rows.forEach((row, r) => [...row].forEach((ch, c) => { if (ch === '#') ctx.fillRect(m.x + c * P, m.y + r * P, P, P); }));
}

export function drawDeepStations() {
  const { x0, x1 } = deepWindow();
  if (S.snatched) drawCrusher();
  drawPods();
  const smooth = ctx.imageSmoothingEnabled, t = now() / 1000;
  ctx.imageSmoothingEnabled = false;
  // every dome first, so no station's dome is over its neighbor's prop
  for (const st of S.stations || []) {
    if (st.slot == null || !st.built) continue;
    const d = place.domeRect(st);
    if (d.x <= x1 && d.x + d.w >= x0) drawDome(st);
  }
  for (const st of S.stations || []) {
    if (st.slot == null) continue;
    const stand = place.standOfStation(st);
    if (stand.x > x1 || stand.x + stand.w < x0) continue;
    if (!st.built) drawScaffold(stand);
    else { drawPlinth(st); drawProp(st, t); if (wearsMark(st)) drawChooseMark(st); }
  }
  ctx.imageSmoothingEnabled = smooth;
  ctx.fillStyle = '#000';
}

// --- the motes -------------------------------------------------------------------
// Silt hanging in the water, and flecks shed off the coil.
// Drawing only: they are stepped here, on the frame's own clock, never by the
// sim, and live on `S.deepMotes` so a reload starts the water afresh.
let motesAt = 0, fleckOwed = 0;
const SWELL_NOW = new Float64Array(3), SWELL_WAS = new Float64Array(3);

const current = (y, t) => DEEP_CURRENT * Math.sin(t / DEEP_CURRENT_MS * Math.PI * 2 + y / (P * 40));

function mote(kind, x, y, vx = 0, vy = 0, life = Infinity) {
  const tones = MOTE_TONES[kind];
  S.deepMotes.push({ kind, x, y, vx, vy, life, age: 0, s: tones[Math.floor(Math.random() * tones.length)] });
}

function stepMotes() {
  const t = now();
  const dt = Math.min(100, Math.max(0, t - (motesAt || t)));
  motesAt = t;
  const f = dt / (1000 / 60);
  const { x0, y0, x1, y1 } = deepWindow();
  // The window's top edge, not the deep's: the water goes all the way up.
  const top = y0, bottom = Math.min(y1, deepFloor());
  const list = S.deepMotes;
  // The silt keeps the window full: a mote that drifts out of it comes back
  // in at the far side, so the water is never thinner in one place for having
  // been looked at.
  let silt = 0;
  for (const m of list) if (m.kind === 'silt') silt++;
  while (silt < DEEP_SILT && list.length < DEEP_MOTES_MAX) {
    mote('silt', x0 + Math.random() * (x1 - x0), top + Math.random() * Math.max(P, bottom - top));
    silt++;
  }
  // A fleck off a swaying coil every so often, at a segment the window holds.
  if (S.serpentStage < SERPENT_PHASES || S.serpentFreed) {
    fleckOwed += dt / 1000;
    while (fleckOwed > DEEP_FLECK_EVERY) {
      fleckOwed -= DEEP_FLECK_EVERY;
      const p = coilAt(Math.floor(Math.random() * COIL_SEGS), t);
      if (p.x >= x0 && p.x < x1 && list.length < DEEP_MOTES_MAX)
        mote('fleck', p.x + (Math.random() - 0.5) * P * 4, p.y + (Math.random() - 0.5) * P * 4,
             0, 0.1, DEEP_FLECK_LIFE * 1000);
    }
  }
  // The swell (render/deepwave.js) carries a mote by however much more it
  // pushes and lifts a point there now than a frame ago: the band's push
  // and its easing back, with the half the mote keeps left behind as part of
  // where it is, so the silt creeps right a little each wave.
  const tS = t / 1000, wasS = (t - dt) / 1000;
  let n = 0;
  for (const m of list) {
    m.life -= dt;
    m.age = (m.age || 0) + dt;
    if (m.life <= 0) continue;
    m.vx *= Math.pow(0.97, f); m.vy *= Math.pow(0.97, f);
    if (dt > 0) {
      shiftAt(m.x / P, tS, DEEP_WAVE.keep, SWELL_NOW);
      shiftAt(m.x / P, wasS, DEEP_WAVE.keep, SWELL_WAS);
      m.x += (SWELL_NOW[0] - SWELL_WAS[0]) * P;
      m.y -= (SWELL_NOW[1] - SWELL_WAS[1]) * P;
    }
    m.x += (m.vx + current(m.y, t)) * f;
    m.y += (m.vy + (m.kind === 'silt' ? DEEP_SILT_SINK * Math.sin(t / 3000 + m.x) : 0)) * f;
    if (m.kind === 'silt') {
      if (m.x < x0) m.x += x1 - x0; else if (m.x >= x1) m.x -= x1 - x0;
      if (m.y < top) m.y += bottom - top; else if (m.y >= bottom) m.y -= bottom - top;
    } else if (m.y < top || m.y > deepFloor()) continue;
    list[n++] = m;
  }
  list.length = n;
}

export function drawDeepMotes() {
  stepMotes();
  // A mote fades in as it is born and out as its life ends, by opacity, and
  // thins toward the window's edges, where silt wraps round to the far side:
  // nothing in the water blinks on or off.
  const was = ctx.globalAlpha, { x0, y0, x1, y1 } = deepWindow(), rim = P * DEEP_MOTE_RIM;
  const bottom = Math.min(y1, deepFloor());
  for (const m of S.deepMotes) {
    const edge = m.kind === 'silt' ? Math.min(m.x - x0, x1 - m.x, m.y - y0, bottom - m.y) / rim : 1;
    const a = Math.min(1, (m.age || 0) / DEEP_MOTE_FADE_MS, m.life / DEEP_MOTE_FADE_MS, edge);
    if (a <= 0) continue;
    ctx.globalAlpha = was * a;
    ctx.fillStyle = m.s;
    ctx.fillRect(Math.round(m.x / P) * P, Math.round(m.y / P) * P, P, P);
  }
  ctx.globalAlpha = was;
  ctx.fillStyle = '#000';
}

// --- the bodies in the deep ----------------------------------------------------------
// A body in the deep is the same square. At work it glides straight where it
// is going; at rest it strolls, floats and hops about its station
// (deep/rest.js), and that motion is its real position, so nothing here adds
// a bob of its own. A body still in the shaft above the underside of the
// surface is in the liquid and not drawn; one crossing it comes out of it a
// row at a time.

export function drawSwimmers() {
  const cut = deepTop() + DEEP_SURFACE + P;
  ctx.save();
  ctx.beginPath();
  ctx.rect(deepX0() - P * 8, cut, deepX1() - deepX0() + P * 16, deepFloor() - cut + P * 4);
  ctx.clip();
  const was = ctx.globalAlpha;
  for (const w of S.workers) {
    if (w.lifted || !inTheDeep(w)) continue;   // the one in your hand: `drawHeld`
    // a fighter at a built station is the fighters' layer's (render/arms.js)
    if (isFighter(w) && (S.stations || []).some(st => st.built && st.id === w.station)) continue;
    const ink = bodyInk(w);                    // a scene holding the deep (render/recede.js)
    if (ink <= 0) continue;
    ctx.globalAlpha = was * ink;
    const x = Math.round(w.x), y = Math.round(w.y);
    drawBody(x, y);
    // A gatherer's handful, overhead two abreast, each scale as it is. A
    // fang in its arms is the fang's own to draw, over its head
    // (render/scales.js).
    for (let i = 0; i < Math.min(w.carry || 0, 24); i++) {
      drawMark(w.load?.[i] || 1, x + (WORKER - P * 2) / 2 + (i % 2) * P + P / 2,
               y - P * (Math.floor(i / 2) + 1) + P / 2);
    }
  }
  ctx.globalAlpha = was;
  ctx.restore();
  ctx.fillStyle = '#000';
}

// --- the last of it --------------------------------------------------------------
// Everything drawn over the deep, turned over: the paper to the liquid's
// black and every mark to its negative. The frame so far is drawn back over
// itself through an `invert` filter, over the deep's window in device
// pixels, where the filter turns every channel over exactly (render/invert.js);
// everywhere else a `difference` fill: raw white, so the dark page's map
// does not turn the white it needs into its own paper.
export function drawDeepInvert() {
  if (darkPage) return;
  const { x0, y0, x1, y1 } = deepWindow();
  ctx.save();
  if (invertByFilter(ctx)) {
    const t = ctx.getTransform(), c = ctx.canvas;
    const left = Math.max(0, Math.floor(t.a * (x0 - P) + t.e));
    const top = Math.max(0, Math.floor(t.d * (y0 - P) + t.f));
    const right = Math.min(c.width, Math.ceil(t.a * (x1 + P) + t.e));
    const bottom = Math.min(c.height, Math.ceil(t.d * (y1 + P) + t.f));
    if (right > left && bottom > top) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalAlpha = 1;
      ctx.filter = 'invert(1)';
      ctx.drawImage(c, left, top, right - left, bottom - top, left, top, right - left, bottom - top);
    }
  } else {
    ctx.globalCompositeOperation = 'difference';
    ctx.fillStyle = raw('#fff');
    ctx.fillRect(x0 - P, y0 - P, x1 - x0 + P * 2, y1 - y0 + P * 2);
  }
  ctx.restore();
  ctx.fillStyle = '#000';
}

