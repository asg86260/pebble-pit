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
import { DOME_PAD, DOME_WALL, CRUSH_FIRE, CRUSH_STIR, CRUSH_HEAT, CRUSH_SPARKS, CRUSH_SPARK_MS,
         CRUSH_SPARK } from '../config.js';
import { invertByFilter } from './invert.js';
import { P, WORKER, ABYSS_TONES, ABYSS_MAGIC_TONES, ABYSS_FLOW_MS, ABYSS_FLOW_COL, ABYSS_FLOW_ROW,
         ABYSS_FLOW_SHEAR, ABYSS_FLOW_ASPECT, ABYSS_FLOW_DRIFT, ABYSS_SHEAR_ROW, ABYSS_SHEAR_TURN,
         ABYSS_SHEAR_AMT2, ABYSS_SHEAR_COL, ABYSS_SHEAR_AMT_Y, ABYSS_FLOW_COL2, ABYSS_FLOW_ROW2,
         ABYSS_FLOW_DRIFT2, ABYSS_FLOW_MIX, ABYSS_VEIL_AT, ABYSS_VEIL_EVERY, ABYSS_VEIL_JITTER,
         ABYSS_STAR_MS, ABYSS_BREATH_BEND, ABYSS_RIPPLE_MS,
         DEEP_H, DEEP_CURRENT, DEEP_CURRENT_MS, COIL_SEGS,
         DEEP_SURFACE, DEEP_WATER_DEPTH,
         DEEP_MOTE_TINTS, DEEP_SILT, DEEP_SILT_SINK,
         DEEP_FLECK_EVERY, DEEP_FLECK_LIFE, DEEP_MOTES_MAX } from '../config.js';
import { S, deepBed } from '../state.js';
import { deepTop, deepFloor, deepX0, deepX1, mouthX, coilAt, crusherRect, podAt,
         waterShift } from '../deep/place.js';
import { paintAbyssField } from './abyssfield.js';
import { abyssLine } from '../pit.js';
import { SPRITES, CRUSHER_SPRITES } from '../deep/sprites.js';
import { topRow } from '../grid.js';
import { drawMark } from './marks.js';
import { raw, darkPage } from '../ink.js';
import { ctx } from './ctx.js';
import { swellAt } from './cores.js';
import { hash } from './flicker.js';
import { drawBody, inTheDeep } from './crew.js';
import * as place from '../deep/place.js';
import * as CFG from '../config.js';
import { DEEP_W, DEEP_SLOTS_DRAWN, SCAFFOLD_BANDS } from '../config.js';
import { GREYS, PURPLES, seen } from './deeptones.js';

const isFighter = w => w.type === 'fighter';   // TYPE.FIGHTER, until merge

// --- the inverted palette ---------------------------------------------------------
// A tone as it is to be seen, turned into what is drawn to get it (render/deeptones.js).
const flip = seen;
export { GREYS, PURPLES };
const MOTE_TONES = Object.fromEntries(Object.entries(DEEP_MOTE_TINTS)
  .map(([k, v]) => [k, { tones: v.tones.map(flip), ink: v.ink }]));

const seeth = (c, r) => Math.abs((c * 73856093) ^ (r * 19349663)) % 997;

// --- where the deep is on the screen ----------------------------------------------
// The window over the deep, in world pixels on the cell lattice. The deep's
// layers draw only what is in it.
export function deepWindow() {
  const x0 = Math.floor(S.camX / P) * P, y0 = Math.floor(S.camY / P) * P;
  return { x0, y0, x1: Math.ceil((S.camX + S.viewW) / P) * P, y1: Math.ceil((S.camY + S.viewH) / P) * P };
}

// --- the water ----------------------------------------------------------------
// The drowned pit's flowing interference, everywhere and faint: the same
// field (`drawAbyss`, render/cores.js), the same constants, so the deep is
// plainly the same fluid seen from inside it. Stars breathe in it more
// sparsely, and never reach the bright end of their ramp.
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
  paintAbyssField({ from: x0, to: x1, top, bottom, line: abyssLine(), rowShift: waterShift(),
                    deep: DEEP_WATER_DEPTH, tones: GREYS, magic: PURPLES, t: now() });
  ctx.fillStyle = '#000';
}

// --- the floor -----------------------------------------------------------------
// The ground under the deep, mottled dark, and the scales lying on it through
// the bed's own painter (deep/scales.js lays it): a plot like the pit's.
// The ground never changes, so it is painted once into an image, a world
// pixel a pixel, and drawn from there (a fillRect a cell was a sizeable share
// of the deep's frame). Deep enough for the tallest window the deep is
// framed in, and painted afresh if the deep has moved.
let ground = null;
const GROUND_ROWS = 40;
export function drawDeepFloor() {
  const fy = deepFloor(), from = deepX0() - P * 4, to = deepX1() + P * 4;
  const id = `${fy}|${from}|${to}`;
  if (!ground || ground.id !== id) {
    const img = document.createElement('canvas');
    img.width = to - from; img.height = GROUND_ROWS * P;
    const g = img.getContext('2d');
    for (let r = 0; r < GROUND_ROWS; r++) {
      for (let x = from; x < to; x += P) {
        const y = fy + r * P, h = seeth(x / P, y / P + 7);
        g.fillStyle = GREYS[2 + (h % 3) + (r === 0 ? 2 : 0)];
        g.fillRect(x - from, r * P, P, P);
      }
    }
    ground = { id, img };
  }
  const smooth = ctx.imageSmoothingEnabled;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(ground.img, from, fy);
  ctx.imageSmoothingEnabled = smooth;
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

// --- the stations ------------------------------------------------------------------
// The sprites and where each stands are the deep's geometry (deep/sprites.js);
// these are the tones their characters are seen in.
const SPRITE_INK = {
  '#': seen('#ffffff'), '+': GREYS[9], '-': GREYS[6], 'o': seen('#000000'), '*': PURPLES[11]
};

// The dome over a station: walls from the floor to DOME_WALL above the
// drawing, and a half circle over them, cell by cell so it sits on the grid.
// As wide as the drawing and DOME_PAD either side, so the two share one
// middle whatever the drawing's width: a dome of one width for every station
// had half a cell to spare on one side of every odd-width drawing.
// Lit from inside a shade above the water, its rim a shade above that, and
// every cell dealt a tone near it so the dome is not a flat block.
function drawDome(stand, g = ctx) {
  const w = stand.w + DOME_PAD * 2, r = w / 2, left = stand.x - DOME_PAD;
  const spring = stand.y - DOME_WALL;
  const top = Math.round((spring - r) / P) * P;
  const inside = (x, y) => {
    if (x < left || x >= left + w || y >= deepFloor() || y < top) return false;
    if (y >= spring) return true;
    const dx = x + P / 2 - (left + r), dy = y + P / 2 - spring;
    return dx * dx + dy * dy <= r * r;
  };
  for (let y = top; y < deepFloor(); y += P) {
    for (let x = left; x < left + w; x += P) {
      if (!inside(x, y)) continue;
      const rim = !inside(x - P, y) || !inside(x + P, y) || !inside(x, y - P);
      g.fillStyle = GREYS[(rim ? 5 : 2) + (seeth(x / P, y / P) % 2)];
      g.fillRect(x, y, P, P);
    }
  }
}

// The crusher, a brick furnace (deep/sprites.js), painted at crusherRect():
// the drawing, painted once into an image of its own as a station is and
// kept by where the crusher stands, so a resize repaints it; then the fire
// in its door, drawn over that every frame; then the sparks of each scale
// that has gone in lately (`S.crushes`).
const FURNACE = CRUSHER_SPRITES.rest;
let furnace = null;
function crusherImage(c) {
  const id = `${c.x}|${c.y}`;
  if (furnace && furnace.id === id) return furnace;
  const img = document.createElement('canvas');
  img.width = FURNACE[0].length * P; img.height = FURNACE.length * P;
  const g = img.getContext('2d');
  for (let r = 0; r < FURNACE.length; r++) {
    for (let col = 0; col < FURNACE[r].length; col++) {
      const ink = SPRITE_INK[FURNACE[r][col]];
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
const FIRE_WHITE = seen('#ffffff'), FIRE_GREY = GREYS[GREYS.length - 2];
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
  ctx.drawImage(crusherImage(c).img, c.x, c.y);
  ctx.imageSmoothingEnabled = smooth;
  drawFire(c, t);
  drawSparks(c, t);
  ctx.fillStyle = '#000';
}

// The pods: a capsule for each of the crew who lives down here, stacked from
// the floor. A hull a shade above the dark, a rim a shade above that, and a
// porthole lit from inside, so a stack reads as somewhere people live.
function drawPods() {
  for (let i = 0; i < (S.pods || 0); i++) {
    const r = podAt(i);
    for (let y = r.y; y < r.y + r.h; y += P) {
      for (let x = r.x; x < r.x + r.w; x += P) {
        const edgeX = x === r.x || x === r.x + r.w - P, edgeY = y === r.y || y === r.y + r.h - P;
        if (edgeX && edgeY) continue;                                  // rounded
        ctx.fillStyle = GREYS[(edgeX || edgeY ? 7 : 4) + (seeth(x / P, y / P) % 2)];
        ctx.fillRect(x, y, P, P);
      }
    }
    const px = r.x + Math.round((r.w / 2 - P) / P) * P, py = r.y + P;
    ctx.fillStyle = GREYS[GREYS.length - 2];
    ctx.fillRect(px, py, P * 2, P * 2);
  }
}

// --- the party's stations, at their slots -----------------------------------------
// The floor's slots (docs/wave-party.md): any kind at any slot, more than one
// of a kind. A kind's drawing is `SPRITES[kind]`; the armory wears the old
// font's until its own lands. The place of a slot and of the station on it
// is track BOARD's (deep/place.js, `slotX`, `standOfStation`); until merge
// it is worked out here the way `spriteRect` works out the old spots, the
// DRAWING's middle on the slot.
const spriteOf = kind => SPRITES[kind] || (kind === 'armory' ? SPRITES.font : null);   // until merge
const snap = v => Math.round(v / P) * P;
const slotMid = i => (place.slotX ? place.slotX(i)                                         // until merge
  : snap(deepX0() + (CFG.DEEP_SLOTS || DEEP_SLOTS_DRAWN)[i] * DEEP_W));
const inkOf = new Map();
function inked(rows) {
  const id = rows.join('|');
  if (inkOf.has(id)) return inkOf.get(id);
  let c0 = rows[0].length, c1 = -1, r0 = rows.length, r1 = -1;
  rows.forEach((row, r) => [...row].forEach((ch, c) => {
    if (ch === '.') return;
    c0 = Math.min(c0, c); c1 = Math.max(c1, c); r0 = Math.min(r0, r); r1 = Math.max(r1, r);
  }));
  const ink = { c0, r0, cols: c1 - c0 + 1, rows: r1 - r0 + 1 };
  inkOf.set(id, ink);
  return ink;
}
// The sprite's whole grid standing on the floor at a slot, and the station
// as drawn inside it.
function placed(st) {
  const rows = spriteOf(st.kind);
  if (!rows || st.slot == null) return null;
  const ink = inked(rows), w = rows[0].length * P, h = rows.length * P;
  const s = { x: snap(slotMid(st.slot) - (ink.c0 + ink.cols / 2) * P), y: deepFloor() - h, w, h };
  return { rows, s, stand: { x: s.x + ink.c0 * P, y: s.y + ink.r0 * P, w: ink.cols * P, h: ink.rows * P } };
}

// A station and its dome never change once they stand, so each is painted
// once into an image of its own, a world pixel a pixel, and drawn from there:
// several hundred cells a station were a fillRect each, every frame. Kept by
// the station and where it stands, so a station that moves (a resize, a
// sprite edited in the station editor) is painted afresh.
const painted = new Map();
function stationImage(key, rows, s, stand) {
  const r = (stand.w + DOME_PAD * 2) / 2;
  const x = stand.x - DOME_PAD, y = Math.round((stand.y - DOME_WALL - r) / P) * P - P;
  const w = stand.w + DOME_PAD * 2, h = deepFloor() - y;
  const id = `${x}|${y}|${rows.join('')}`;
  const had = painted.get(key);
  if (had && had.id === id) return had;
  const img = document.createElement('canvas');
  img.width = w; img.height = h;
  const g = img.getContext('2d');
  g.translate(-x, -y);
  drawDome(stand, g);
  for (let rr = 0; rr < rows.length; rr++) {
    for (let c = 0; c < rows[rr].length; c++) {
      const ink = SPRITE_INK[rows[rr][c]];
      if (!ink) continue;
      g.fillStyle = ink;
      g.fillRect(s.x + c * P, s.y + rr * P, P, P);
    }
  }
  const out = { id, img, x, y };
  painted.set(key, out);
  return out;
}

// A station not built yet stands as a building site does (render/buildsites.js):
// a striped post each side of the ground it will stand on and the tape
// between them at head height, until a delver's work lands.
function drawScaffold(stand) {
  const postW = P * 2, postH = P * SCAFFOLD_BANDS;
  const left = snap(stand.x) - P * 3 - postW, right = snap(stand.x + stand.w) + P * 3;
  const top = deepFloor() - postH;
  ctx.fillStyle = GREYS[9];
  for (const x of [left, right]) for (let i = 0; i < SCAFFOLD_BANDS; i += 2) ctx.fillRect(x, top + i * P, postW, P);
  for (let x = left + postW; x < right; x += P * 2) ctx.fillRect(x, deepFloor() - P * 3, P, 2);
}

export function drawDeepStations() {
  const { x0, x1 } = deepWindow();
  if (S.snatched) drawCrusher();
  drawPods();
  const smooth = ctx.imageSmoothingEnabled;
  ctx.imageSmoothingEnabled = false;
  for (const st of S.stations || []) {
    const at = placed(st);
    if (!at) continue;
    const { rows, s, stand } = at;
    if (s.x - DOME_PAD > x1 || s.x + s.w + DOME_PAD < x0) continue;
    if (!st.built) { drawScaffold(stand); continue; }
    const p = stationImage(st.id, rows, s, stand);
    ctx.drawImage(p.img, p.x, p.y);
  }
  ctx.imageSmoothingEnabled = smooth;
  ctx.fillStyle = '#000';
}

// --- the motes -------------------------------------------------------------------
// Silt hanging in the water, and flecks shed off the coil.
// Drawing only: they are stepped here, on the frame's own clock, never by the
// sim, and live on `S.deepMotes` so a reload starts the water afresh.
let motesAt = 0, fleckOwed = 0;

const current = (y, t) => DEEP_CURRENT * Math.sin(t / DEEP_CURRENT_MS * Math.PI * 2 + y / (P * 40));

function mote(kind, x, y, vx = 0, vy = 0, life = Infinity) {
  const tones = MOTE_TONES[kind].tones;
  S.deepMotes.push({ kind, x, y, vx, vy, life, s: tones[Math.floor(Math.random() * tones.length)] });
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
  if (S.serpentStage < 4 || S.serpentFreed) {
    fleckOwed += dt / 1000;
    while (fleckOwed > DEEP_FLECK_EVERY) {
      fleckOwed -= DEEP_FLECK_EVERY;
      const p = coilAt(Math.floor(Math.random() * COIL_SEGS), t);
      if (p.x >= x0 && p.x < x1 && list.length < DEEP_MOTES_MAX)
        mote('fleck', p.x + (Math.random() - 0.5) * P * 4, p.y + (Math.random() - 0.5) * P * 4,
             0, 0.1, DEEP_FLECK_LIFE * 1000);
    }
  }
  let n = 0;
  for (const m of list) {
    m.life -= dt;
    if (m.life <= 0) continue;
    m.vx *= Math.pow(0.97, f); m.vy *= Math.pow(0.97, f);
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
  for (const m of S.deepMotes) {
    const ink = MOTE_TONES[m.kind].ink;
    // a mote nearing the end of its life thins out a cell at a time rather
    // than fading: it is drawn on fewer and fewer frames
    if (m.life < 600 && hash(m.x + now() / 100) > m.life / 600) continue;
    ctx.globalAlpha = ink;
    ctx.fillStyle = m.s;
    ctx.fillRect(Math.round(m.x / P) * P, Math.round(m.y / P) * P, P, P);
  }
  ctx.globalAlpha = 1;
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
  for (const w of S.workers) {
    if (w.lifted || !inTheDeep(w)) continue;   // the one in your hand: `drawHeld`
    // a fighter at a built station is the fighters' layer's (render/arms.js)
    if (isFighter(w) && (S.stations || []).some(st => st.built && st.id === w.station)) continue;
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

