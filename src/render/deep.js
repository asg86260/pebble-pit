// The deep: the inside of the abyss the drowned pit holds (DESIGN.md, "The
// deep is the inside of the abyss in the pit"). Its sky, its water, its motes,
// its floor and the stations on it, the bodies swimming there, and the one
// fill at the end that turns the whole of it over.
//
// The palette is the yard's, inverted (docs/wave-serpent.md, "The palette"):
// everything here draws in the ordinary inks on the paper, and `deep invert`
// lays a `difference` of raw white over the deep, so the paper comes out as
// the liquid's black and every mark as its negative. A tone this file names
// is the tone it will be SEEN in, the abyss's own greys and purples, and is
// flipped once at load (`seen`) into what has to be drawn to come out that
// way. The bodies, the serpent and the scales draw as they would in the yard
// and come out white.

import { now } from '../clock.js';
import { P, WORKER, ABYSS_TONES, ABYSS_MAGIC_TONES, ABYSS_FLOW_MS, ABYSS_FLOW_COL, ABYSS_FLOW_ROW,
         ABYSS_FLOW_SHEAR, ABYSS_FLOW_ASPECT, ABYSS_FLOW_DRIFT, ABYSS_SHEAR_ROW, ABYSS_SHEAR_TURN,
         ABYSS_SHEAR_AMT2, ABYSS_SHEAR_COL, ABYSS_SHEAR_AMT_Y, ABYSS_FLOW_COL2, ABYSS_FLOW_ROW2,
         ABYSS_FLOW_DRIFT2, ABYSS_FLOW_MIX, ABYSS_VEIL_AT, ABYSS_VEIL_EVERY, ABYSS_VEIL_JITTER,
         ABYSS_STAR_MS, ABYSS_BREATH_BEND, ABYSS_RIPPLE_MS,
         DEEP_H, DEEP_CURRENT, DEEP_CURRENT_MS, COIL_SEGS,
         DEEP_SURFACE, SHAFT_LIGHT_W, SHAFT_SPILL, DEEP_VEIL_LIT, DEEP_VEIL_DEEP,
         DEEP_STAR_EVERY, DEEP_STAR_TOP, DEEP_MOTE_TINTS, DEEP_SILT, DEEP_SILT_SINK,
         DEEP_FLECK_EVERY, DEEP_FLECK_LIFE, DEEP_CHURN, DEEP_CHURN_LIFE, DEEP_MOTES_MAX,
         SWIM_BOB, SWIM_BOB_MS, SWIM_KICK_MS } from '../config.js';
import { S, deepBed } from '../state.js';
import { deepTop, deepFloor, deepX0, deepX1, mouthX, spotX, coilAt } from '../deep/place.js';
import { raw } from '../ink.js';
import { viewDark } from '../view.js';
import { ctx } from './ctx.js';
import { swellAt } from './cores.js';
import { hash } from './flicker.js';
import { drawBody, inTheDeep } from './crew.js';

// --- the inverted palette ---------------------------------------------------------
// A tone as it is to be seen, turned into what is drawn to get it. Ordinary
// strings, not `raw`: in dark mode the page maps them like every other color
// before the difference turns them over, so the deep stays the yard's
// negative in either mode.
const flip = h => '#' + (0xffffff ^ parseInt(h.slice(1), 16)).toString(16).padStart(6, '0');
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

export function drawDeepStations() {
  const { x0, x1 } = deepWindow();
  for (const key in SPRITES) {
    if (!STANDS[key]()) continue;
    const rows = SPRITES[key];
    const w = rows[0].length * P, h = rows.length * P;
    const left = Math.round((spotX(key) - w / 2) / P) * P;
    if (left > x1 || left + w < x0) continue;
    const top = deepFloor() - h;
    for (let r = 0; r < rows.length; r++) {
      for (let c = 0; c < rows[r].length; c++) {
        const ink = SPRITE_INK[rows[r][c]];
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

// --- swimmers ----------------------------------------------------------------------
// A body in the deep is the same square, swimming: it bobs on its own tempo
// and kicks a cell behind it on a faster one, leaning into the way it faces.
// A body still in the shaft above the underside of the surface is in the
// liquid and not drawn; one crossing it comes out of it a row at a time.

export function drawSwimmers() {
  const t = now();
  const cut = deepTop() + DEEP_SURFACE + P;
  ctx.save();
  ctx.beginPath();
  ctx.rect(deepX0() - P * 8, cut, deepX1() - deepX0() + P * 16, deepFloor() - cut + P * 4);
  ctx.clip();
  for (const w of S.workers) {
    if (!inTheDeep(w)) continue;
    const h = hash(w.id != null ? w.id : w.x);
    const bob = Math.round(Math.sin(t / SWIM_BOB_MS * Math.PI * 2 + h * 6.28) * SWIM_BOB);
    const x = Math.round(w.x), y = Math.round(w.y) + bob;
    const face = w.face || 1;
    drawBody(x, y);
    // the kick: a cell off the back corner, up and down
    const kick = Math.sin(t / SWIM_KICK_MS * Math.PI * 2 + h * 6.28) > 0 ? 0 : P;
    ctx.fillStyle = '#000';
    ctx.fillRect(face > 0 ? x - P : x + WORKER, y + WORKER - P * 2 + kick, P, P);
  }
  ctx.restore();
  ctx.fillStyle = '#000';
}

// --- the last of it --------------------------------------------------------------
// Everything drawn over the deep, turned over: the paper to the liquid's
// black and every mark to its negative. Raw white, so the dark page's map
// does not turn the white it needs into its own paper.
export function drawDeepInvert() {
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
