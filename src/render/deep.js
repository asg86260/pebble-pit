// The deep: the inside of the abyss the drowned pit holds (DESIGN.md, "The
// deep is the inside of the abyss in the pit"). Its sky, its water, its motes,
// its floor and the stations on it, the bodies swimming there, and the one
// fill at the end that turns the whole of it over.
//
// The palette is the yard's, inverted (docs/wave-serpent.md, "The palette"):
// everything here draws in the ordinary inks on the paper, and on the light
// page `deep invert` lays a `difference` of raw white over the deep, so the
// paper comes out as the liquid's black and every mark as its negative. The
// dark page needs no turning over -- its paper is already dark and its map
// already turns black to the light ink -- so there the fill is skipped and
// the deep is dark on both pages. A tone this file names is the tone it will
// be SEEN in, the abyss's own greys and purples, and is turned once at load
// (`seen`) into what has to be drawn to come out that way. The bodies, the
// serpent and the scales draw as they would in the yard and come out white.

import { now } from '../clock.js';
import { STATION_SCALE, DOME_PAD, DOME_WALL, CRUSHER_W, CRUSHER_H, HOPPER_W, CRUSH_SHOW_MS,
         CRUSHER_ROLLER, CRUSHER_BRIM } from '../config.js';
import { P, WORKER, ABYSS_TONES, ABYSS_MAGIC_TONES, ABYSS_FLOW_MS, ABYSS_FLOW_COL, ABYSS_FLOW_ROW,
         ABYSS_FLOW_SHEAR, ABYSS_FLOW_ASPECT, ABYSS_FLOW_DRIFT, ABYSS_SHEAR_ROW, ABYSS_SHEAR_TURN,
         ABYSS_SHEAR_AMT2, ABYSS_SHEAR_COL, ABYSS_SHEAR_AMT_Y, ABYSS_FLOW_COL2, ABYSS_FLOW_ROW2,
         ABYSS_FLOW_DRIFT2, ABYSS_FLOW_MIX, ABYSS_VEIL_AT, ABYSS_VEIL_EVERY, ABYSS_VEIL_JITTER,
         ABYSS_STAR_MS, ABYSS_BREATH_BEND, ABYSS_RIPPLE_MS,
         DEEP_H, DEEP_CURRENT, DEEP_CURRENT_MS, COIL_SEGS,
         DEEP_SURFACE, SHAFT_LIGHT_W, SHAFT_SPILL, DEEP_VEIL_LIT, DEEP_VEIL_DEEP,
         DEEP_STAR_EVERY, DEEP_STAR_TOP, DEEP_MOTE_TINTS, DEEP_SILT, DEEP_SILT_SINK,
         DEEP_FLECK_EVERY, DEEP_FLECK_LIFE, DEEP_CHURN, DEEP_CHURN_LIFE, DEEP_MOTES_MAX } from '../config.js';
import { S, deepBed } from '../state.js';
import { deepTop, deepFloor, deepX0, deepX1, mouthX, spotX, coilAt, crusherRect, hopperRect } from '../deep/place.js';
import { topRow } from '../grid.js';
import { drawMark } from './marks.js';
import { warning } from './pilemarks.js';
import { raw, darkPage, turned } from '../ink.js';
import { viewDark } from '../view.js';
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

// The underside of the surface at a world column: the same swell the pit's
// surface breathes with (`swellAt`), seen from below.
export const ceilingAt = (x, t) => deepTop() + DEEP_SURFACE + swellAt(Math.round(x / P), t);

// --- the sky: the roof, the underside of the surface, the shaft's light --------
// Overhead is the underside of the pit's surface, breathing on the pit's own
// clock, and over it the dark it holds up. The one light in the deep is the
// yard showing through where the pit opens, straight down the shaft, and a
// thin spill of it under the surface, thinning with depth.
export function drawDeepSky() {
  const t = now();
  const { x0, y0, x1 } = deepWindow();
  const mx = mouthX(), half = SHAFT_LIGHT_W / 2;
  for (let x = x0; x < x1; x += P) {
    const c = x / P;
    const line = ceilingAt(x, t);
    const lit = Math.abs(x + P / 2 - mx) <= half;
    // the roof, mottled so no stretch of it is one flat tone
    for (let y = y0; y < line; y += P) {
      const h = seeth(c, y / P);
      ctx.fillStyle = lit ? GREYS[GREYS.length - 1 - (h % 7 === 0 ? 1 : 0)] : GREYS[h % 5 === 0 ? 2 : 1];
      ctx.fillRect(x, y, P, P);
    }
    // The surface itself: a line of light where it crests, dimmer in its
    // troughs, so the swell is read off the line as it is on the pit.
    const crest = (swellAt(c, t) / P + 3) / 6;
    const rung = Math.max(4, Math.min(GREYS.length - 2, Math.round(4 + crest * 5 + (seeth(c, 3) % 2))));
    ctx.fillStyle = lit ? GREYS[GREYS.length - 1] : GREYS[rung];
    ctx.fillRect(x, line, P, P);
  }
  // The spill: a cone of sparse cells under the shaft, their chance and their
  // tone both falling with depth, each cell breathing on its own phase so the
  // light shivers the way light under water does.
  const top = deepTop() + DEEP_SURFACE + P;
  for (let d = 0; d < SHAFT_SPILL; d += P) {
    const k = d / SHAFT_SPILL;
    const wide = Math.round((half + d * 0.35) / P) * P;
    for (let x = Math.round((mx - wide) / P) * P; x <= mx + wide; x += P) {
      if (x < x0 || x >= x1) continue;
      const h = seeth(x / P, d / P + 11);
      const breath = (Math.sin(t / 900 + h) + 1) / 2;
      if (h % 100 > (1 - k) * 55 * breath) continue;
      const r = Math.round((1 - k) * (GREYS.length - 3)) + 1;
      ctx.fillStyle = GREYS[Math.max(1, r - (h % 2))];
      ctx.fillRect(x, top + d, P, P);
    }
  }
  // Where somebody went through, the surface closes over them in a notch of
  // dark, the way the pit's does from above.
  for (const r of S.ripples) {
    const k = Math.min(1, (t - r.at) / ABYSS_RIPPLE_MS);
    const wide = P * (1 + Math.round(k * 2));
    const rx = Math.round((r.x - wide / 2) / P) * P;
    if (rx + wide < x0 || rx > x1) continue;
    ctx.fillStyle = GREYS[0];
    ctx.fillRect(rx, ceilingAt(rx, t), wide, P);
  }
  ctx.fillStyle = '#000';
}

// --- the water ----------------------------------------------------------------
// The drowned pit's flowing interference, everywhere and faint: the same
// field (`drawAbyss`, render/cores.js), the same constants, so the deep is
// plainly the same fluid seen from inside it. Stars breathe in it more
// sparsely, and never reach the bright end of their ramp.
export function drawDeepWater() {
  const t = now();
  const { x0, y0, x1, y1 } = deepWindow();
  const top = Math.max(y0, deepTop() + DEEP_SURFACE + P * 2);
  const bottom = Math.min(y1, deepFloor());
  if (bottom <= top) return;
  const a = t / ABYSS_FLOW_MS * Math.PI * 2;
  const dragY = [];
  for (let x = x0; x < x1; x += P) {
    dragY.push(Math.sin((x / P) * ABYSS_FLOW_COL * ABYSS_SHEAR_COL - a * ABYSS_SHEAR_COL)
               * ABYSS_FLOW_SHEAR * ABYSS_SHEAR_AMT_Y);
  }
  for (let y = top; y < bottom; y += P) {
    const r = y / P;
    const dragX = Math.sin(r * ABYSS_FLOW_ROW + a) * ABYSS_FLOW_SHEAR
                + Math.sin(r * ABYSS_FLOW_ROW * ABYSS_SHEAR_ROW - a * ABYSS_SHEAR_TURN)
                  * ABYSS_FLOW_SHEAR * ABYSS_SHEAR_AMT2;
    const depth = (y - deepTop()) / DEEP_H;
    for (let x = x0, i = 0; x < x1; x += P, i++) {
      const c = x / P;
      const cx = c + dragX, ry = r + dragY[i];
      const f = Math.sin(cx * ABYSS_FLOW_COL + ry * ABYSS_FLOW_ROW * ABYSS_FLOW_ASPECT - a * ABYSS_FLOW_DRIFT);
      const h = seeth(c, r);
      if (h % DEEP_STAR_EVERY === 0) {
        const swing = (Math.sin(t / ABYSS_STAR_MS * Math.PI * 2 * (0.6 + (h % 7) * 0.1) + h) + 1) / 2;
        const ramp = h % 5 === 0 ? PURPLES : GREYS;
        const rung = Math.round(Math.pow(swing, ABYSS_BREATH_BEND) * (DEEP_STAR_TOP - (h >> 4) % 2));
        if (rung > 0) { ctx.fillStyle = ramp[rung]; ctx.fillRect(x, y, P, P); continue; }
      }
      const swell = 1 - ABYSS_FLOW_MIX + ABYSS_FLOW_MIX
                  * (Math.sin(cx * ABYSS_FLOW_COL2 + ry * ABYSS_FLOW_ROW2 - a * ABYSS_FLOW_DRIFT2) + 1) / 2;
      const off = Math.abs(f), band = ABYSS_VEIL_AT * swell;
      if (off > band || h % ABYSS_VEIL_EVERY === 0) continue;
      const thick = (1 - off / band) * swell;
      const lit = thick * (DEEP_VEIL_LIT + depth * DEEP_VEIL_DEEP) + (h % 3 - 1) * ABYSS_VEIL_JITTER;
      const rung = Math.max(0, Math.min(GREYS.length - 1, Math.round(lit * (GREYS.length - 1))));
      if (rung === 0) continue;
      ctx.fillStyle = GREYS[rung];
      ctx.fillRect(x, y, P, P);
    }
  }
  ctx.fillStyle = '#000';
}

// --- the floor -----------------------------------------------------------------
// The ground under the deep, mottled dark, and the scales lying on it through
// the bed's own painter (deep/scales.js lays it): a plot like the pit's.
export function drawDeepFloor() {
  const { x0, x1, y1 } = deepWindow();
  const fy = deepFloor();
  for (let y = fy; y < y1; y += P) {
    for (let x = Math.max(x0, deepX0() - P * 4); x < Math.min(x1, deepX1() + P * 4); x += P) {
      const h = seeth(x / P, y / P + 7);
      ctx.fillStyle = GREYS[2 + (h % 3) + (y === fy ? 2 : 0)];
      ctx.fillRect(x, y, P, P);
    }
  }
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

// --- the stations ------------------------------------------------------------------
// Each drawn on the floor at its spot, a cell a character, in the tones they
// are seen in: `#` the white of anything made, `+` and `-` its greys, `o` the
// black water held in it, `*` the abyss's purple, `.` nothing. Each is its
// weapon's shape: the altar a slab, the well a ring holding black water with
// a lance stood in it, the font a goblet with a ball of held ripples, the
// circle a standing stone over its ring, the spire a tower to a point.
const SPRITES = {
  altar: [
    '................',
    '..############..',
    '..#++++++++++#..',
    '..#+-*----*-+#..',
    '..############..',
    '....#+#..#+#....',
    '....#-#..#-#....',
    '....#+#..#+#....',
    '..############..',
    '.##############.'
  ],
  well: [
    '.......#........',
    '.......#........',
    '.......#........',
    '......*#*.......',
    '.......*........',
    '.##.........##..',
    '.#+#########+#..',
    '.#+oo*ooo*oo+#..',
    '.#+ooooooooo+#..',
    '.#+ooo*oooo*+#..',
    '.#############..'
  ],
  font: [
    '.....-++-.......',
    '....+*oo*+......',
    '....+o**o+......',
    '....+*oo*+......',
    '.....-++-.......',
    '..###########...',
    '...#+++++++#....',
    '....#######.....',
    '......#+#.......',
    '......#-#.......',
    '....#######.....',
    '...#########....'
  ],
  circle: [
    '.......##.......',
    '......#++#......',
    '......#*+#......',
    '......#+-#......',
    '......#+*#......',
    '......#-+#......',
    '......#++#......',
    '..**..#++#..**..',
    '.*..**####**..*.',
    '..**........**..'
  ],
  spire: [
    '.......#........',
    '......###.......',
    '......#*#.......',
    '.....##+##......',
    '.....#+++#......',
    '.....#+*+#......',
    '.....#+-+#......',
    '....##+++##.....',
    '....#++o++#.....',
    '....#++o++#.....',
    '...##+++++##....',
    '...#+++*+++#....',
    '..###########...',
    '.#############..'
  ]
};
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
// sprite, and a half circle over them, cell by cell so it sits on the grid.
// Lit from inside a shade above the water, its rim a shade above that, and
// every cell dealt a tone near it so the dome is not a flat block.
function drawDome(mid, spriteH) {
  const w = cellsOf(16) * P + DOME_PAD * 2, r = w / 2;
  const spring = deepFloor() - spriteH - DOME_WALL;
  const top = Math.round((spring - r) / P) * P, left = Math.round((mid - r) / P) * P;
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
      ctx.fillStyle = GREYS[(rim ? 5 : 2) + (seeth(x / P, y / P) % 2)];
      ctx.fillRect(x, y, P, P);
    }
  }
}

// The crusher: a hopper open at the top, a body with two rollers seen through
// its window, and a chute at the foot where the grit comes out. The rollers
// turn only while scales are going in (`S.crushAt`), so a busy crusher looks
// busy and an idle one is still. Every cell a tone near its part's, like the
// domes, so the machine is not a printed block.
function drawCrusher() {
  const c = crusherRect(), h = hopperRect(), t = now();
  const busy = t - (S.crushAt || -Infinity) < CRUSH_SHOW_MS;
  const cell = (x, y, tone) => { ctx.fillStyle = GREYS[tone + (seeth(x / P, y / P) % 2)]; ctx.fillRect(x, y, P, P); };
  // the hopper: a funnel from the mouth down to the body, dark inside
  const funnel = Math.round(CRUSHER_H * 0.3 / P) * P;
  // A funnel with walls two cells thick and a lip across its mouth, the
  // inside a shade off the water so it reads as a bowl and not two sticks.
  const mid = h.x + h.w / 2;
  for (let y = c.y; y < c.y + funnel; y += P) {
    const k = (y - c.y) / funnel;
    const half = Math.round((h.w / 2 - k * (h.w / 2 - P * 4)) / P) * P;
    for (let x = mid - half - P * 2; x < mid + half + P * 2; x += P) {
      const wall = x < mid - half || x >= mid + half;
      cell(x, y, y === c.y ? 9 : wall ? 7 : 2);
    }
  }
  // the body, and its window onto the rollers
  const top = c.y + funnel, foot = c.y + CRUSHER_H - P * 4;
  for (let y = top; y < foot; y += P) {
    for (let x = c.x; x < c.x + CRUSHER_W; x += P) {
      const rim = x === c.x || x === c.x + CRUSHER_W - P || y === top;
      cell(x, y, rim ? 8 : 4);
    }
  }
  const wy = top + P * 3, wh = foot - wy - P * 3, wx = c.x + P * 3, ww = CRUSHER_W - P * 6;
  ctx.fillStyle = GREYS[1];
  ctx.fillRect(wx, wy, ww, wh);
  // two rollers, turning toward each other while it crushes
  const turn = busy ? t / 90 : 0;
  for (const [cx, dir] of [[wx + ww * 0.3, 1], [wx + ww * 0.7, -1]]) {
    const cy = wy + wh / 2;
    for (let y = cy - CRUSHER_ROLLER; y <= cy + CRUSHER_ROLLER; y += P) {
      for (let x = cx - CRUSHER_ROLLER; x <= cx + CRUSHER_ROLLER; x += P) {
        const dx = x - cx, dy = y - cy;
        if (dx * dx + dy * dy > CRUSHER_ROLLER * CRUSHER_ROLLER) continue;
        // teeth: a band every quarter turn, rolling round as it works
        const a = Math.atan2(dy, dx) + turn * dir;
        const tooth = Math.floor(((a / (Math.PI / 2)) % 1 + 1) % 1 * 4) === 0;
        ctx.fillStyle = GREYS[tooth ? 10 : 7];
        ctx.fillRect(Math.round(x / P) * P, Math.round(y / P) * P, P, P);
      }
    }
  }
  // the feet, and the chute the grit leaves by
  for (let y = foot; y < c.y + CRUSHER_H; y += P) {
    for (let x = c.x + P * 2; x < c.x + CRUSHER_W - P * 2; x += P) {
      if (y > foot && x > c.x + P * 5 && x < c.x + CRUSHER_W - P * 6) continue;
      cell(x, y, 6);
    }
  }
  if (busy) {
    for (let i = 0; i < 6; i++) {
      const gx = c.x + CRUSHER_W / 2 + (hash(Math.floor(t / 70) + i) - 0.5) * P * 6;
      const gy = c.y + CRUSHER_H - P * 2 - hash(i * 7 + Math.floor(t / 90)) * P * 3;
      ctx.fillStyle = GREYS[5 + (i % 3)];
      ctx.fillRect(Math.round(gx / P) * P, Math.round(gy / P) * P, P, P);
    }
  }
  // Scales lying at the brim of the floor's bed: the gathering has fallen
  // behind, and the mark says so over the crusher that is waiting on it.
  let brim = false;
  if (deepBed.grid) for (let col = 0; col < deepBed.cols && !brim; col++)
    brim = topRow(deepBed, col) >= deepBed.rows - CRUSHER_BRIM;
  if (brim) warning(c.x + CRUSHER_W / 2, c.y - P * 5);
  ctx.fillStyle = '#000';
}

// A sprite `n` cells across drawn at STATION_SCALE is this many cells: the
// scale need not be whole, since each drawn cell reads the sprite cell under
// it, nearest first, and so every cell stays on the grid.
const cellsOf = n => Math.round(n * STATION_SCALE);

export function drawDeepStations() {
  const { x0, x1 } = deepWindow();
  if (S.snatched) drawCrusher();
  for (const key in SPRITES) {
    if (!STANDS[key]()) continue;
    const rows = SPRITES[key];
    const cw = cellsOf(rows[0].length), ch = cellsOf(rows.length);
    const w = cw * P, h = ch * P;
    const left = Math.round((spotX(key) - w / 2) / P) * P;
    if (left - DOME_PAD > x1 || left + w + DOME_PAD < x0) continue;
    drawDome(left + w / 2, h);
    const top = deepFloor() - h;
    for (let r = 0; r < ch; r++) {
      const row = rows[Math.min(rows.length - 1, Math.floor(r / STATION_SCALE))];
      for (let c = 0; c < cw; c++) {
        const ink = SPRITE_INK[row[Math.min(row.length - 1, Math.floor(c / STATION_SCALE))]];
        if (!ink) continue;
        ctx.fillStyle = ink;
        ctx.fillRect(left + c * P, top + r * P, P, P);
      }
    }
  }
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
  const top = Math.max(y0, deepTop() + DEEP_SURFACE + P), bottom = Math.min(y1, deepFloor());
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
// A body in the deep is the same square, drifting: the deep is a void, not a
// sea, so nothing bobs or kicks -- it glides where it is going and hangs
// still when it is there. A body still in the shaft above the underside of the surface is in the
// liquid and not drawn; one crossing it comes out of it a row at a time.

export function drawSwimmers() {
  const cut = deepTop() + DEEP_SURFACE + P;
  ctx.save();
  ctx.beginPath();
  ctx.rect(deepX0() - P * 8, cut, deepX1() - deepX0() + P * 16, deepFloor() - cut + P * 4);
  ctx.clip();
  for (const w of S.workers) {
    if (!inTheDeep(w)) continue;
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
// black and every mark to its negative. Raw white, so the dark page's map
// does not turn the white it needs into its own paper.
export function drawDeepInvert() {
  if (darkPage) return;
  const { x0, y0, x1, y1 } = deepWindow();
  ctx.save();
  ctx.globalCompositeOperation = 'difference';
  ctx.fillStyle = raw('#fff');
  ctx.fillRect(x0 - P, y0 - P, x1 - x0 + P * 2, y1 - y0 + P * 2);
  ctx.restore();
  ctx.fillStyle = '#000';
}

// --- the glide ---------------------------------------------------------------------
// The frame going black at the middle of a glide, in screen pixels over the
// whole finished yard or deep: the liquid, filling the window as the camera
// goes into it.
export function drawGlideDark() {
  const k = viewDark();
  if (k <= 0) return;
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = Math.min(1, k * 1.25);
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.restore();
  ctx.fillStyle = '#000';
}
