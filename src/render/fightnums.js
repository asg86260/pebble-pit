// Reading the fight: what each blow did, and what the heal is taking back,
// as numbers rising off the coil (DESIGN.md, "Reading the fight"). The sim
// keeps the hits (deep/serpent.js, `S.hits`); this only draws them.
//
// Like the counter (render/counter.js) the digits are in screen pixels, not
// the world's cells: finer than the world and one size however the camera is
// zoomed, anchored in the world through the deep's camera. They are drawn over
// the finished deep, after its negative, so their tones are written as they
// are seen and each fades against the picture actually behind it.

import { S } from '../state.js';
import { ctx } from './ctx.js';
import { now } from '../clock.js';
import { darkPage, turned } from '../ink.js';
import { NUM_FONT, NUM_FONT_PX, NUM_FACE, NUM_DROP, NUM_HEAL, NUM_HEAL_DROP, NUM_LIFE_S,
         NUM_HEAL_LIFE_S, NUM_IN_S, NUM_STEPS, NUM_RISE, NUM_LIFT, NUM_JITTER, NUM_HEAL_SIDE,
         NUM_HEAL_DROP_BY } from '../config.js';

const CHARS = Object.keys(NUM_FONT);
const GW = NUM_FONT['0'][0].length, GH = NUM_FONT['0'].length;

// On the dark page every color is mapped by its lightness (ink.js), and the
// deep there is drawn turned so the map brings it back: the numbers too.
const seen = c => darkPage ? turned(c) : c;

// One small sheet of every glyph, a row a face (the blow's, the heal's), each
// glyph whole with its drop line under it: a number is a drawImage a glyph.
// Kept until a font pixel is a different number of device pixels.
let atlas = null, atlasPx = 0;
function glyphs(px) {
  if (atlas && atlasPx === px) return atlas;
  const c = document.createElement('canvas');
  c.width = CHARS.length * GW * px;
  c.height = 2 * (GH + 1) * px;
  const g = c.getContext('2d');
  const paint = (ch, ox, oy, tone) => {
    g.fillStyle = tone;
    NUM_FONT[ch].forEach((row, r) => {
      for (let i = 0; i < GW; i++) if (row[i] === '#') g.fillRect(ox + i * px, oy + r * px, px, px);
    });
  };
  [[NUM_FACE, NUM_DROP], [NUM_HEAL, NUM_HEAL_DROP]].forEach(([face, drop], row) => {
    const oy = row * (GH + 1) * px;
    CHARS.forEach((ch, i) => {
      paint(ch, i * GW * px, oy + px, seen(drop));   // the drop, a font pixel under
      paint(ch, i * GW * px, oy, seen(face));        // and the face over it
    });
  });
  atlas = c; atlasPx = px;
  return c;
}

// A number's opacity over its life, in whole steps, so it passes through the
// tones of whatever is behind it: in quickly, held, out over its last half.
function lifeK(age, life) {
  const k = age < NUM_IN_S ? age / NUM_IN_S : age > life / 2 ? (life - age) / (life / 2) : 1;
  return Math.round(Math.max(0, Math.min(1, k)) * NUM_STEPS) / NUM_STEPS;
}

// The same small shove either way for the same hit, frame after frame.
const hash = n => { const x = Math.sin(n * 127.1 + 3.7) * 43758.5453; return x - Math.floor(x); };

export function drawFightNumbers() {
  if (!S.hits.length) return;
  const t = now();
  // The world's transform, read rather than rebuilt: a hit's world point is
  // where the deep's camera puts it, in device pixels.
  const m = ctx.getTransform();
  const u = S.dpr;                                   // device pixels a screen pixel
  const px = Math.max(1, Math.round(NUM_FONT_PX * u));
  const sheet = glyphs(px);
  const w1 = (GW + 1) * px, h = (GH + 1) * px;
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  for (const hit of S.hits) {
    if (t < hit.shut) continue;                      // a held weapon's second, still being summed
    const heal = hit.weapon === 'heal';
    const age = (t - hit.shut) / 1000, life = heal ? NUM_HEAL_LIFE_S : NUM_LIFE_S;
    const k = lifeK(age, life);
    const n = Math.round(hit.done);
    if (k <= 0 || n < 1) continue;
    const str = heal ? '+' + n : String(n);
    const rise = Math.floor(age * NUM_RISE) * u;
    const wx = m.a * hit.x + m.e, wy = m.d * hit.y + m.f;
    const sx = heal ? wx + (hit.side % 2 ? NUM_HEAL_SIDE : -NUM_HEAL_SIDE) * u
                    : wx + (hash(hit.side + hit.at) - 0.5) * 2 * NUM_JITTER * u;
    const bottom = heal ? wy + NUM_HEAL_DROP_BY * u - rise : wy - NUM_LIFT * u - rise;
    const left = Math.round(sx - (str.length * w1 - px) / 2), top = Math.round(bottom - h);
    const row = heal ? h : 0;
    ctx.globalAlpha = k;
    for (let i = 0; i < str.length; i++) {
      const at = CHARS.indexOf(str[i]) * GW * px;
      ctx.drawImage(sheet, at, row, GW * px, h, left + i * w1, top, GW * px, h);
    }
  }
  ctx.restore();
}
