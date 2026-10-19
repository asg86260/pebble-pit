// A lamp hat's light (the owner, 2026-10-16: "lamp light all the time"): a
// wedge out of the front of the lamp the way the body faces, held, no
// flicker. Worn by the two of them as a head item (render/wardrobe.js,
// `dressBehind`) and by a quarrier in its station's lamp (render/crew.js).
//
// The wedge is drawn before the body, and it only ever tints the paper: on
// the light page it is laid with `darken`, so a pale grey over the white
// ground and nothing over a rock, a heap or a body that is already darker;
// on the dark page, where the paper is the dark end, with `lighten`. The
// deep is drawn as the yard is and turned over after (render/deep.js), so
// there the same rule leaves a faint wedge lighter than the black water.
// Its numbers are LAMP_CONE.
//
// It comes and goes by opacity (docs/design-language/canvas.md, "Fades")
// as the lamp goes on and comes off, remembered per body and per source,
// keyed as the body's walk is (`motionOf`).

import { P, GREY, WARD_UNIT as U, LAMP_CONE as C } from '../config.js';
import { GREYS } from './deeptones.js';
import { turnedOver } from '../ink.js';
import { fill } from './wardrobe.js';

const SEEN = { head: new WeakMap(), hat: new WeakMap() };

// How lit it is now, 0..1, stepped toward on or off by the time since the
// last frame it was asked; a body with no key to remember it by is either.
function strength(on, key, src, t) {
  if (!key || typeof key !== 'object') return on ? 1 : 0;
  const map = SEEN[src] || SEEN.head;
  let m = map.get(key);
  if (!m) { if (!on) return 0; map.set(key, m = { a: 0, at: t }); }
  const dt = Math.max(0, t - m.at);
  m.at = t;
  m.a = Math.max(0, Math.min(1, m.a + (on ? 1 : -1) * dt / C.fade));
  return m.a;
}

// The light of a lamp on a body standing with its top-left at (x, y),
// facing `dir`. `on` whether the lamp is on its head this frame, `t` the
// clock in seconds.
export function lampCone(g, x, y, dir, { on, key = null, t = 0, deep = false, src = 'head' } = {}) {
  const a = strength(!!on, key, src, t);
  if (a <= 0) return;
  // the lamp is the middle cell of the hat's top row (sprites.js, HATS.lamp)
  const cy = y - P - P / 2, front = dir > 0 ? x + 2 * P : x + P;
  const tone = deep ? GREYS[C.deepRung] : GREY[C.rung];
  const was = g.globalAlpha, op = g.globalCompositeOperation;
  g.globalAlpha = was * a;
  g.globalCompositeOperation = turnedOver() ? 'lighten' : 'darken';
  for (let d = 0; d < C.reach; d += U) {
    const half = Math.round((C.from + d * C.spread) / U) * U, mid = cy + Math.round(d * C.tilt / U) * U;
    fill(g, dir > 0 ? front + d : front - d - U, mid - half, U, 2 * half, tone);
  }
  g.globalCompositeOperation = op;
  g.globalAlpha = was;
}
