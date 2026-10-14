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
import { blowK } from '../deep/serpent.js';
import { kickTop, leaveOf } from './barflight.js';
import { barShown, barRect, barLeft } from './serpentbar.js';
import { sheetOf, write, widthOf, sayNum, GH } from './numfont.js';
import { NUM_FONT_PX, NUM_FACE, NUM_DROP, NUM_LIFE_S, NUM_HEAL_LIFE_S, NUM_IN_S, NUM_OUT, NUM_STEPS,
         NUM_LIFT, NUM_KICK_UP, NUM_KICK_UP_K, NUM_KICK_SIDE, NUM_KICK_SIDE_K, NUM_KICK_GRAV, NUM_KICK_HOLD_S,
         NUM_KICK_BIG, NUM_KICK_LINE, NUM_KICK_LINE_H, NUM_HEAL_SIDE, NUM_HEAL_DROP_BY, NUM_HEAL_RISE,
         NUM_HEAL_SWELL, NUM_HEAL_SWELL_LAG, NUM_HEAL_FADE, NUM_HEAL_FACES, NUM_HEAL_DROPS,
         NUM_BAR_IN_S, NUM_BAR_BITE_S } from '../config.js';
import { toned } from './tone.js';

// On the dark page every color is mapped by its lightness (ink.js), and the
// deep there is drawn turned so the map brings it back: the numbers too.
const seen = c => darkPage ? turned(c) : c;

// A number's weight over its life, in whole steps: in quickly, held, out
// over its last share, each step a rung down its ramp toward the deep's black
// (render/tone.js), never a thinning.
function lifeK(age, life) {
  const k = age < NUM_IN_S ? age / NUM_IN_S : age > life * (1 - NUM_OUT) ? (life - age) / (life * NUM_OUT) : 1;
  return Math.round(Math.max(0, Math.min(1, k)) * NUM_STEPS) / NUM_STEPS;
}

// Where a blow's number is `age` seconds after it was knocked off, in screen
// pixels off where it left: its flight on the clock, the clock stopped
// NUM_KICK_HOLD_S at the top of the arc. And whether it is still going up.
function kick(age, k, dir) {
  const up = NUM_KICK_UP + NUM_KICK_UP_K * k, top = kickTop(k);
  const tt = age < top ? age : age < top + NUM_KICK_HOLD_S ? top : age - NUM_KICK_HOLD_S;
  return { dx: dir * (NUM_KICK_SIDE + NUM_KICK_SIDE_K * k) * tt, dy: -up * tt + NUM_KICK_GRAV * tt * tt / 2, rising: age < top };
}

export function drawFightNumbers() {
  if (!S.hits.length) return;
  const t = now();
  // The world's transform, read rather than rebuilt: a hit's world point is
  // where the deep's camera puts it, in device pixels.
  const m = ctx.getTransform();
  const u = S.dpr;                                   // device pixels a screen pixel
  const px = Math.max(1, Math.round(NUM_FONT_PX * u)), big = px + Math.max(1, Math.round(u));
  // Where a number goes in: the end of the bar's fill, as it stands now.
  let into = null;
  if (barShown()) {
    const b = barRect();
    into = { x: (b.x + b.w * barLeft(t)) * u, y: (b.y + b.h / 2) * u, top: b.y * u, h: b.h * u };
  }
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  for (const hit of S.hits) {
    if (t < hit.shut) continue;                      // a held weapon's second, still being summed
    const heal = hit.weapon === 'heal';
    const age = (t - hit.shut) / 1000, life = heal ? NUM_HEAL_LIFE_S : NUM_LIFE_S;
    const n = Math.round(hit.done);
    if (age >= life || n < 1) continue;
    const wx = m.a * hit.x + m.e, wy = m.d * hit.y + m.f;
    const str = heal ? '+' + sayNum(n) : sayNum(n);
    const k = heal ? 0 : blowK(hit.done), size = !heal && k > NUM_KICK_BIG ? big : px;
    const dir = hit.side % 2 ? 1 : -1;
    // A number's center and bottom at `a` seconds, before it goes in.
    const at = a => heal
      ? { x: wx + dir * NUM_HEAL_SIDE * u, y: wy + NUM_HEAL_DROP_BY * u - Math.round(a * NUM_HEAL_RISE * u / px) * px }
      : (f => ({ x: wx + f.dx * u, y: wy - NUM_LIFT * u + f.dy * u, rising: f.rising }))(kick(a, k, dir));
    const face = heal ? NUM_HEAL_FACES[0] : NUM_FACE, drop = heal ? NUM_HEAL_DROPS[0] : NUM_DROP;
    const leave = leaveOf(hit);
    if (into && age >= leave) {
      // into the bar, quickening, to the end of its fill; gone once there,
      // but for a few grains off the end as it lands
      const v = (age - leave) / NUM_BAR_IN_S;
      if (v >= 1) {
        if (age - leave - NUM_BAR_IN_S < NUM_BAR_BITE_S) {
          ctx.fillStyle = seen(face);
          for (const [dx, dy] of [[-2, -2], [1, -3], [-1, 1], [2, 2]])
            ctx.fillRect(Math.round(into.x + dx * px), Math.round((dy < 0 ? into.top : into.top + into.h) + dy * px), px, px);
        }
        continue;
      }
      const from = at(leave), q = v * v;
      const x = from.x + (into.x - from.x) * q, y = from.y + (into.y + (GH + 1) * size / 2 - from.y) * q;
      write(sheetOf(size, face, drop), str, size, Math.round(x / size) * size - Math.round(widthOf(str, size) / 2),
            Math.round(y / size) * size);
      continue;
    }
    if (heal) {
      // under the belly, climbing in whole font pixels, a swell running along it
      const f = Math.min(NUM_HEAL_FACES.length - 1,
        Math.floor(Math.max(0, age / life - NUM_HEAL_FADE) / (1 - NUM_HEAL_FADE) * NUM_HEAL_FACES.length));
      const p = at(age);
      const k = age < NUM_IN_S ? 0.5 : 1;
      write(sheetOf(px, toned(NUM_HEAL_FACES[f], k, true), toned(NUM_HEAL_DROPS[f], k, true)), str, px, Math.round(p.x - widthOf(str, px) / 2),
            Math.round(p.y), i => Math.round(Math.sin(age * NUM_HEAL_SWELL - i * NUM_HEAL_SWELL_LAG)));
      continue;
    }
    const a = lifeK(age, life);
    if (a <= 0) continue;
    // knocked off the hide, away from the hit, turn and turn about
    const p = at(age);
    const left = Math.round(p.x / size) * size - Math.round(widthOf(str, size) / 2);
    const bottom = Math.round(p.y / size) * size;
    if (size === big && p.rising) {
      // held speed lines under a big one on its way up
      ctx.fillStyle = seen(toned(NUM_KICK_LINE, a, true));
      const mid = left + Math.round(widthOf(str, size) / 2);
      for (const d of [-2, 0, 2]) ctx.fillRect(mid + d * size, bottom + 2 * size, size, NUM_KICK_LINE_H * u);
    }
    write(sheetOf(size, toned(NUM_FACE, a, true), toned(NUM_DROP, a, true)), str, size, left, bottom);
  }
  ctx.restore();
}
