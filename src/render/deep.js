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
import { DOME_PAD, DOME_WALL, CRUSH_SHOW_MS, CRUSH_FLICKER_MS, CRUSH_SPARKS, CRUSH_SPARK_MS,
         CRUSH_SPARK_AT } from '../config.js';
import { invertByFilter } from './invert.js';
import { P, WORKER, ABYSS_TONES, ABYSS_MAGIC_TONES, ABYSS_FLOW_MS, ABYSS_FLOW_COL, ABYSS_FLOW_ROW,
         ABYSS_FLOW_SHEAR, ABYSS_FLOW_ASPECT, ABYSS_FLOW_DRIFT, ABYSS_SHEAR_ROW, ABYSS_SHEAR_TURN,
         ABYSS_SHEAR_AMT2, ABYSS_SHEAR_COL, ABYSS_SHEAR_AMT_Y, ABYSS_FLOW_COL2, ABYSS_FLOW_ROW2,
         ABYSS_FLOW_DRIFT2, ABYSS_FLOW_MIX, ABYSS_VEIL_AT, ABYSS_VEIL_EVERY, ABYSS_VEIL_JITTER,
         ABYSS_STAR_MS, ABYSS_BREATH_BEND, ABYSS_RIPPLE_MS,
         DEEP_H, DEEP_CURRENT, DEEP_CURRENT_MS, COIL_SEGS,
         DEEP_SURFACE, DEEP_WATER_DEPTH,
         DEEP_MOTE_TINTS, DEEP_SILT, DEEP_SILT_SINK,
         DEEP_FLECK_EVERY, DEEP_FLECK_LIFE, DEEP_CHURN, DEEP_CHURN_LIFE, DEEP_MOTES_MAX } from '../config.js';
import { S, deepBed } from '../state.js';
import { deepTop, deepFloor, deepX0, deepX1, mouthX, coilAt, crusherRect, podAt,
         spriteRect, standOf, waterShift } from '../deep/place.js';
import { paintAbyssField } from './abyssfield.js';
import { abyssLine } from '../pit.js';
import { SPRITES, CRUSHER_SPRITES } from '../deep/sprites.js';
import { topRow } from '../grid.js';
import { drawMark } from './marks.js';
import { raw, darkPage, turned } from '../ink.js';
import { ctx } from './ctx.js';
import { swellAt } from './cores.js';
import { hash } from './flicker.js';
import { drawBody, inTheDeep } from './crew.js';

// --- the inverted palette ---------------------------------------------------------
// A tone as it is to be seen, turned into what is drawn to get it. On the
// light page, every channel flipped, which the difference flips back; on the
// dark page, the lightness turned over with the hue kept, which the page's
// own map turns back -- a channel flip there would come out the complement,
// the purples green.
const xor = h => '#' + (0xffffff ^ parseInt(h.slice(1), 16)).toString(16).padStart(6, '0');
const flip = darkPage ? turned : xor;
const seen = flip;
export const GREYS = ABYSS_TONES.map(flip);         // the deep's grey ramp, black to white as seen
export const PURPLES = ABYSS_MAGIC_TONES.map(flip); // and its purple one
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

// Which of them stands: the altar from the snatch, each other door once it
// is open.
const STANDS = {
  altar: () => S.snatched, well: () => S.wellOpen, font: () => S.fontOpen,
  circle: () => S.circleOpen, spire: () => S.spireOpen
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
// the rest frame, and while scales are going in (`S.crushAt`) the working
// frame traded with it so the fire flickers, and sparks hop out by the door.
// Each frame is painted once into an image of its own, as a station is, and
// drawn from there; kept by where the crusher stands, so a resize repaints it.
const furnace = new Map();
function crusherImage(frame, c) {
  const rows = CRUSHER_SPRITES[frame];
  const id = `${c.x}|${c.y}`;
  const had = furnace.get(frame);
  if (had && had.id === id) return had;
  const img = document.createElement('canvas');
  img.width = rows[0].length * P; img.height = rows.length * P;
  const g = img.getContext('2d');
  for (let r = 0; r < rows.length; r++) {
    for (let col = 0; col < rows[r].length; col++) {
      const ink = SPRITE_INK[rows[r][col]];
      if (!ink) continue;
      g.fillStyle = ink;
      g.fillRect(col * P, r * P, P, P);
    }
  }
  const out = { id, img };
  furnace.set(frame, out);
  return out;
}

function drawCrusher() {
  const c = crusherRect(), t = now();
  const busy = t - (S.crushAt || -Infinity) < CRUSH_SHOW_MS;
  const hot = busy && Math.floor(t / CRUSH_FLICKER_MS) % 2;
  const smooth = ctx.imageSmoothingEnabled;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(crusherImage(hot ? 'working' : 'rest', c).img, c.x, c.y);
  ctx.imageSmoothingEnabled = smooth;
  if (busy) {
    // Each spark hops out and falls on its own offset of the cycle, white as
    // it leaves and purple as it cools.
    const { r, c: col } = CRUSH_SPARK_AT;
    for (let i = 0; i < CRUSH_SPARKS; i++) {
      const run = t / CRUSH_SPARK_MS + i / CRUSH_SPARKS;
      const age = run % 1, k = Math.floor(run) * CRUSH_SPARKS + i;
      const dx = Math.round(age * (2 + hash(k) * 4));
      const dy = Math.round(-2 * age + 7 * age * age);
      ctx.fillStyle = age < 0.5 ? SPRITE_INK['#'] : SPRITE_INK['*'];
      ctx.fillRect(c.x + (col + dx) * P, c.y + (r + dy) * P, P, P);
    }
  }
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

// A station and its dome never change once they stand, so each is painted
// once into an image of its own, a world pixel a pixel, and drawn from there:
// several hundred cells a station were a fillRect each, every frame. Kept by
// where it stands, so a station that moves (a resize, a sprite edited in the
// station editor) is painted afresh.
const painted = new Map();
function stationImage(key) {
  const rows = SPRITES[key];
  const s = spriteRect(key), stand = standOf(key);
  const r = (stand.w + DOME_PAD * 2) / 2;
  const x = stand.x - DOME_PAD, y = Math.round((stand.y - DOME_WALL - r) / P) * P - P;
  const w = stand.w + DOME_PAD * 2, h = deepFloor() - y;
  const id = `${key}|${x}|${y}|${rows.join('')}`;
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

export function drawDeepStations() {
  const { x0, x1 } = deepWindow();
  if (S.snatched) drawCrusher();
  drawPods();
  const smooth = ctx.imageSmoothingEnabled;
  ctx.imageSmoothingEnabled = false;
  for (const key in SPRITES) {
    if (!STANDS[key]()) continue;
    const { x: left, w } = spriteRect(key);
    if (left - DOME_PAD > x1 || left + w + DOME_PAD < x0) continue;
    const p = stationImage(key);
    ctx.drawImage(p.img, p.x, p.y);
  }
  ctx.imageSmoothingEnabled = smooth;
  ctx.fillStyle = '#000';
}

// --- the motes -------------------------------------------------------------------
// Silt hanging in the water, flecks shed off the coil, the churn off a burst.
// Drawing only: they are stepped here, on the frame's own clock, never by the
// sim, and live on `S.deepMotes` so a reload starts the water afresh.
let motesAt = 0, fleckOwed = 0;
const burst = new WeakSet();

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
  // The churn off a burst: once per ring, thrown outward and slowing.
  for (const r of S.rings) {
    if (burst.has(r)) continue;
    burst.add(r);
    for (let i = 0; i < DEEP_CHURN && list.length < DEEP_MOTES_MAX; i++) {
      const a = Math.random() * Math.PI * 2, v = 0.5 + Math.random() * 1.5;
      mote('churn', r.x, r.y, Math.cos(a) * v, Math.sin(a) * v, DEEP_CHURN_LIFE * 1000 * (0.5 + Math.random() * 0.5));
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
    const x = Math.round(w.x), y = Math.round(w.y);
    drawBody(x, y);
    // A gatherer's handful, overhead two abreast, each scale as it is.
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

