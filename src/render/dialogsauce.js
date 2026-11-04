// MOCK dialog-sauce
// Throwaway review drawing, never merged (src/dialogsauce.js says what each
// option is): a line typed in letter by letter with its words' effects, and
// God's light on the two of them standing before him. Both in screen pixels,
// in the caption's place over the bands (render/portals.js).
//
// A letter fades in over its own short time, never popping; the bubble was
// sized to the whole line before the first letter (render/dialog.js), so it
// never grows. The effects move smoothly by their true offsets: the wave a
// sine, the shake held poses a pixel either way (the nervous letters each on
// a clock of their own), the glow a see-through halo behind the word whose
// opacity swings, the rainbow a smooth run through the game's colors, the
// pulse a slow swell, the drop a fall onto the letter's place, the boom a
// letter big as it lands and held at its size. Under reduced motion nothing
// moves or changes color and every marked word is only bold.
//
// The light is plain see-through fills, a world-pixel row at a time, never a
// blend, fading in and out by opacity: the cone from his face down onto them,
// or the ring on the cloud floor round their feet. Each soft edge is the same
// shape a few times over, narrower each time, so the middle is the brightest.

import { S } from '../state.js';
import { GREY, WORKER, CELL, SAUCE_FX as FX, SAUCE_PAIR as L, COIN_TONES, COIN_DARK, AFTER_GOODS, AFTER_GOODS_DARK } from '../config.js';
import { raw, darkPage } from '../ink.js';
import { ctx } from './ctx.js';
import { now } from '../clock.js';
import { reducedMotion } from '../prefs.js';
import { bandCells } from '../shot.js';
import { toScreen } from '../world.js';
import { pairBodies } from '../ghosts.js';
import { afterFloor } from '../after/place.js';
import { godHead } from './aftercrowd.js';
import { sauce, parseMarks, births, letterFade } from '../dialogsauce.js';

// --- the words ------------------------------------------------------------------
const hash = (a, b) => { const v = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return v - Math.floor(v); };
// The rainbow's run: the game's own colors, the coins' and the goods', each
// page's, written past the page's map as the goods are.
const RUN = () => (darkPage ? [COIN_DARK.ore, COIN_DARK.crop, COIN_DARK.spark, AFTER_GOODS_DARK.log[0], AFTER_GOODS_DARK.sign[0]]
                            : [COIN_TONES.ore[1], COIN_TONES.crop[2], COIN_TONES.spark[1], AFTER_GOODS.log[1], AFTER_GOODS.sign[0]]);
const hex = h => [1, 3, 5].map(k => parseInt(h.slice(k, k + 2), 16));
// Between two colors, `k` of the way: the run moves smoothly, never a step.
const mix = (a, b, k) => { const A = hex(a), B = hex(b); return '#' + A.map((v, j) => Math.round(v + (B[j] - v) * k).toString(16).padStart(2, '0')).join(''); };
const ease = k => 1 - (1 - k) ** 2;

// The line's letters as drawn into `rows` (the plain words, wrapped), from
// (x, y) down, `lh` a row: each faded in from its birth `u` seconds into the
// line (all in at once when `full`), with its effect.
export function drawTyped(text, rows, x, y, lh, u, full, tone) {
  const { letters } = parseMarks(text), { at } = births(letters);
  const calm = reducedMotion(), t = now() / 1000, was = ctx.globalAlpha;
  const fade = i => (full ? 1 : Math.max(0, Math.min(1, (u - at[i]) / letterFade(letters[i]))));
  let i = 0;
  rows.forEach((row, r) => {
    let cx = x;
    const cy = y + r * lh;
    // the glow's halo first, behind its word, as far as the word has come in
    const runs = [];
    for (let k = 0, j = i; k < row.length; k++, j++) {
      if (letters[j] && letters[j].fx === 'glow' && fade(j) > 0) {
        const w = ctx.measureText(row[k]).width, px = x + ctx.measureText(row.slice(0, k)).width;
        const last = runs[runs.length - 1];
        if (last && last.end === k) { last.w = px + w - last.x; last.end = k + 1; last.a = Math.min(last.a, fade(j)); }
        else runs.push({ x: px, w, end: k + 1, a: fade(j) });
      }
    }
    for (const g of runs) {
      const swing = calm ? 0.5 : 0.5 + 0.5 * Math.sin(t * Math.PI * 2 * FX.glowHz);
      ctx.globalAlpha = was * g.a * (FX.glowA[0] + (FX.glowA[1] - FX.glowA[0]) * swing);
      ctx.fillStyle = GREY[FX.glowRung];
      ctx.fillRect(Math.round(g.x - 2), cy - 1, Math.round(g.w + 4), lh - 1);
    }
    const fh = lh - 3;   // the face's height, for a letter's middle
    for (const ch of row) {
      const l = letters[i], a = fade(i), cw = ctx.measureText(ch).width;
      if (a > 0 && ch !== ' ') {
        // how long it has been in, for the effects that play as it arrives
        const age = full ? 99 : u - at[i];
        let dx = 0, dy = 0, k = 1, ink = tone, bold = !!l.fx && (calm || l.fx === 'glow' || l.fx === 'boom');
        if (!calm) {
          if (l.fx === 'wave') dy = -Math.sin(t * Math.PI * 2 * FX.waveHz + i * FX.waveStep) * FX.waveH;
          if (l.fx === 'shake') {
            const n = Math.floor(t / FX.shakeHoldS);
            dx = Math.round(hash(i, n) * 2 - 1) * FX.shake; dy = Math.round(hash(n, i) * 2 - 1) * FX.shake;
          }
          // each letter its own clock, so no two move together
          if (l.fx === 'nervous') {
            const hold = FX.nervousHoldS[0] + hash(i, 7) * (FX.nervousHoldS[1] - FX.nervousHoldS[0]);
            const n = Math.floor((t + hash(i, 3)) / hold);
            dx = Math.round(hash(i, n) * 2 - 1) * FX.nervous; dy = Math.round(hash(n + 5, i) * 2 - 1) * FX.nervous;
          }
          if (l.fx === 'rainbow') {
            const run = RUN(), p = (t * FX.rainbowHz + i * FX.rainbowStep) % run.length;
            ink = raw(mix(run[Math.floor(p)], run[(Math.floor(p) + 1) % run.length], p - Math.floor(p)));
          }
          if (l.fx === 'pulse') k = 1 + FX.pulse * (0.5 - 0.5 * Math.cos(t * Math.PI * 2 * FX.pulseHz));
          // falling from over its place, quicker as it comes, and landed
          if (l.fx === 'drop') dy = -FX.dropH * (1 - Math.min(1, age / letterFade(l))) ** 2;
          // big as it comes in, down to its size and held: a landing, not a shake
          if (l.fx === 'boom') k = 1 + (FX.boomK - 1) * (1 - ease(Math.min(1, age / letterFade(l))));
        }
        ctx.globalAlpha = was * a;
        ctx.fillStyle = ink;
        if (k !== 1) {
          const mx = cx + cw / 2, my = cy + fh / 2;
          ctx.save();
          ctx.translate(mx + dx, my + dy); ctx.scale(k, k);
          ctx.fillText?.(ch, -cw / 2, -fh / 2);
          if (bold) ctx.fillText?.(ch, -cw / 2 + 1 / k, -fh / 2);
          ctx.restore();
        } else {
          ctx.fillText?.(ch, cx + dx, cy + dy);
          // a marked word is bold: struck again a pixel over
          if (bold) ctx.fillText?.(ch, cx + dx + 1, cy + dy);
        }
      }
      cx += cw;
      i++;
    }
    i++;   // the space the wrap took between this row and the next
  });
  ctx.globalAlpha = was;
}

// --- his light on them --------------------------------------------------------------
let lit = 0, litAt = null; // cache: how lit, 0..1, and the clock it was last stepped at
function strength() {
  const t = now(), dt = litAt == null ? 0 : Math.max(0, t - litAt) / 1000;
  litAt = t;
  const on = !!sauce() && S.view === 'after' && S.beat && S.beat.camera === 'meet-god';
  lit = Math.max(0, Math.min(1, lit + (on ? 1 : -1) * dt / L.lightS));
  return lit;
}

export function drawSauceLight() {
  const k = strength();
  const s = sauce();
  if (k <= 0 || !s || S.view !== 'after') return;
  const two = pairBodies(), g = godHead();
  if (!two || !g) return;
  const band = Math.round(S.hush * bandCells()) * CELL;
  const a0 = toScreen(Math.min(two[0].x, two[1].x), 0).x, a1 = toScreen(Math.max(two[0].x, two[1].x) + WORKER, 0).x;
  const floor = toScreen(0, afterFloor()).y, mid = (a0 + a1) / 2, half = (a1 - a0) / 2;
  ctx.save();
  ctx.setTransform(S.dpr, 0, 0, S.dpr, 0, 0);
  ctx.beginPath(); ctx.rect(0, band, S.W, S.H - band * 2); ctx.clip();
  ctx.fillStyle = GREY[L.tone];
  if (s.light === 'ring') {
    const R = L.ring;
    for (let e = 0; e < R.edges; e++) {
      ctx.globalAlpha = k * R.a / R.edges;
      const rx = half + R.w - e * R.edge, ry = Math.max(2, R.h - e * R.edge * R.h / (half + R.w));
      for (let y = -Math.ceil(ry); y <= Math.ceil(ry); y++) {
        const w = rx * Math.sqrt(Math.max(0, 1 - (y / ry) ** 2));
        if (w > 0) ctx.fillRect(Math.round(mid - w), Math.round(floor + y), Math.round(w * 2), 1);
      }
    }
  } else {
    const C = L.cone, hd = toScreen(g.x, g.bottom);
    const y0 = Math.round(hd.y), y1 = Math.round(floor);
    for (let e = 0; e < C.edges; e++) {
      ctx.globalAlpha = k * C.a / C.edges;
      for (let y = y0; y < y1; y++) {
        const f = (y - y0) / Math.max(1, y1 - y0);
        const c = hd.x + (mid - hd.x) * f;
        const w = Math.max(1, C.top / 2 + (half + C.pool - C.top / 2) * f - e * C.edge * (0.4 + 0.6 * f));
        ctx.fillRect(Math.round(c - w), y, Math.round(w * 2), 1);
      }
    }
  }
  ctx.restore();
  ctx.fillStyle = '#000';
}
