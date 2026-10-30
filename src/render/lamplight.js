// A lamp hat's light (the owner, 2026-10-16: "lamp light all the time"): a
// wedge out of the front of the lamp the way the body faces, held, no
// flicker. Worn by the two of them as a head item (render/wardrobe.js,
// `dressBehind`) and by a quarrier in its station's lamp (render/crew.js).
//
// The wedge is drawn before the body, a plain fill and never a blend (the
// owner, 2026-10-29: Firefox's card has no `darken`, and a blend there takes
// the whole canvas off it): see-through, so the light lies over a rock or a
// heap in its reach as well as the paper, a world pixel a column so its
// edges climb smoothly, and fading with the distance to nothing at its end.
// Its numbers are LAMP_CONE.
//
// It comes and goes by opacity (docs/design-language/canvas.md, "Fades")
// as the lamp goes on and comes off, remembered per body and per source,
// keyed as the body's walk is (`motionOf`).

import { P, GREY, LAMP_CONE as C } from '../config.js';
import { GREYS } from './deeptones.js';
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
  const was = g.globalAlpha;
  for (let d = 0; d < C.reach; d++) {
    g.globalAlpha = was * a * C.glow * (1 - d / C.reach) ** C.falloff;
    const half = C.from + d * C.spread, mid = cy + d * C.tilt;
    fill(g, dir > 0 ? front + d : front - d - 1, mid - half, 1, 2 * half, tone);
  }
  g.globalAlpha = was;
}
