// A site with work on it looks like a building site: barriers, tape, and the
// chips off the builder's hammer.

import { P, DEEP_GRIT_RUNG } from '../config.js';
import { PURPLES } from './deeptones.js';
import { S } from '../state.js';
import { rowFor, siteShown } from '../works.js';
import { ctx } from './ctx.js';
import { footprints } from '../footprints.js';
import { groundAt } from '../world.js';
import { risingPlaces, laidCourses } from './rise.js';
import { fences, FENCE_POST_BANDS } from '../fence.js';

// --- a busy site looks like a building site -----------------------------------
// A station's footprint is its own rect. The yard is one slot shared by every
// building with no gang of its own, and what is going up there is named by the
// *row*, not the site; the ground a work is on is `siteBox` in works.js, one
// answer for the tape, the bar and the builder's patch.

// A striped post: the black bands do all the work; a white band is the page.
function drawBarrierPost(x, y, w, bands) {
  for (let i = 0; i < bands; i++) {
    if (i % 2 !== 0) continue;
    ctx.fillRect(x, y + i * P, w, P);
  }
}

// The site sheds no dust of its own on purpose: a haze off the foot of a
// building reads as the ground smoldering. What says building site is the
// barriers, the tape and the chips off each blow (`workJig` in crew.js).
// The fence's shape is fence.js's, shared with the ground it claims; each
// place draws its own sites' fences.
export function drawBuildSites() {
  for (const { site, fence } of fences()) {
    if (!siteShown(site)) continue;
    ctx.fillStyle = '#000';
    for (const q of fence.posts) drawBarrierPost(q.x, q.y, q.w, FENCE_POST_BANDS);
    // the tape, at head height, dashed a cell on and a cell off
    for (let x = fence.tape.x0; x < fence.tape.x1; x += P * 2)
      ctx.fillRect(x, fence.tape.y, P, 2);
  }
}

// The chips off a builder's hammer.
//
// Drawn here, after the buildings and the crew, not on `S.smoke`: smoke is
// painted behind every building, and dust thrown off the front of a wall that
// renders behind the wall reads as a smudge on the horizon. One cell, no
// growth: swelling it like a smoke mote reads as exhaust off a joist.
//
// A chip is the paper over what stands and the ink over open sky (the owner,
// 2026-10-29: plain colors, never a blend), which is the only thing that makes
// site dust visible: the chips are thrown inside the biggest black mass in the
// yard, so black grains are black-on-black. What stands is asked of the place,
// never of the frame's pixels: under its floor, inside a placed object's
// footprint, or inside the courses a rising building has laid so far
// (render/rise.js). A footprint is the object's box, not its ink, so a chip
// over a doorway is the paper as well -- a third of a second, at a fade. A
// chip thrown in an act carries its floor (`ground`) and is drawn there only.
export function drawGrit() {
  const act = S.view === 'after';
  const mine = g => !g.sea && (g.ground != null) === act;
  if (!S.grit.some(mine)) return;
  // A rising building's own footprint is not yet standing: only its laid
  // courses are. An act's station stands under its own key (`stands`).
  const going = new Set(risingPlaces().flatMap(r => [r.place, rowFor(r.key)?.stands].filter(Boolean)));
  const stand = [...footprints(act ? 'after' : 'yard').filter(o => !going.has(o.id)).flatMap(o => o.rects), ...laidCourses()];
  const solid = (g, x, y) => y >= (g.ground ?? groundAt(x)) || stand.some(r => x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h);
  for (const g of S.grit) {
    if (!mine(g)) continue;
    const a = fade(g);
    if (a <= 0) continue;
    const x = Math.round(g.x / P) * P, y = Math.round(g.y / P) * P;
    ctx.globalAlpha = a;
    ctx.fillStyle = solid(g, x + P / 2, y + P / 2) ? '#fff' : '#000';
    ctx.fillRect(x, y, P, P);
  }
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#000';
}
const fade = g => Math.max(0, 1 - (g.t / g.life) ** 2);

// The same chips struck in the deep, painted with the deep's layers: the water
// is laid down after the yard's, and silt under it was never seen. Not the
// frame turned over at an alpha, as in the yard: that is a tone the deep's
// palette does not hold. A chip is the deep's light, one kept purple
// (DEEP_GRIT_RUNG), fading out by opacity as it goes.
const silt = () => PURPLES[DEEP_GRIT_RUNG];   // read at the fill: the ramp turns with the page
export function drawSilt() {
  ctx.fillStyle = silt();
  for (const g of S.grit) {
    if (!g.sea) continue;
    const a = fade(g);
    if (a <= 0) continue;
    ctx.globalAlpha = Math.min(1, a);
    ctx.fillRect(Math.round(g.x / P) * P, Math.round(g.y / P) * P, P, P);
  }
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#000';
}
