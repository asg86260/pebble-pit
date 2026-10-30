// A site with work on it looks like a building site: barriers, tape, and the
// chips off the builder's hammer.

import { P, PARTY_IDS, DEEP_GRIT_RUNG } from '../config.js';
import { PURPLES } from './deeptones.js';
import { S } from '../state.js';
import { SITES, rowFor, siteBox, worksAt } from '../works.js';
import { ctx } from './ctx.js';
import { footprints } from '../footprints.js';
import { groundAt } from '../world.js';
import { risingPlaces, laidCourses } from './rise.js';
import { groundOf } from '../deep/place.js';

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

// Only a building or a machine rising out of the ground gets fenced: a rung
// worked at the bench (`kind: 'rung'`) is a body at a bench that was already
// there, and tape round it would fence off thin air.
const risingKinds = new Set(['building', 'machine']);
// Per WORK, not per site: a build in line behind another stands fenced on its
// own ground too, which is how the yard says the ground is spoken for.
const construction = site =>
  worksAt(site).filter(w => risingKinds.has(rowFor(w.key)?.kind));

// The site sheds no dust of its own on purpose: a haze off the foot of a
// building reads as the ground smoldering. What says building site is the
// barriers, the tape and the chips off each blow (`workJig` in crew.js).
// A station of the party going up draws its own scaffold in the deep's tones
// (`drawDeepStations`, render/deep.js), so it is not fenced a second time
// here; its site keeps its box for the builder, the bar and the roster.
const OWN_SCAFFOLD = new Set(PARTY_IDS);
export function drawBuildSites() {
  for (const site of SITES) for (const work of OWN_SCAFFOLD.has(site) ? [] : construction(site)) {
    const foot = siteBox(site, work);
    if (!foot) continue;

    const postW = P * 2, postBands = 5, postH = P * postBands;
    const left = Math.round(foot.x / P) * P - P * 3 - postW;
    const right = Math.round((foot.x + foot.w) / P) * P + P * 3;
    const ground = groundOf(foot.y);
    const topY = ground - postH;

    ctx.fillStyle = '#000';
    drawBarrierPost(left, topY, postW, postBands);
    drawBarrierPost(right, topY, postW, postBands);

    // the tape, at head height, dashed a cell on and a cell off
    const tapeY = ground - P * 3;
    for (let x = left + postW; x < right; x += P * 2)
      ctx.fillRect(x, tapeY, P, 2);

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
// yard, so black grains are black-on-black. What stands is asked of the yard,
// never of the frame's pixels: under the ground line, inside a placed object's
// footprint, or inside the courses a rising building has laid so far
// (render/rise.js). A footprint is the object's box, not its ink, so a chip
// over a doorway is the paper as well -- a third of a second, at a fade.
export function drawGrit() {
  if (!S.grit.some(g => !g.sea)) return;
  const going = new Set(risingPlaces().map(r => r.place));
  const stand = [...footprints('yard').filter(o => !going.has(o.id)).flatMap(o => o.rects), ...laidCourses()];
  const solid = (x, y) => y >= groundAt(x) || stand.some(r => x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h);
  for (const g of S.grit) {
    if (g.sea) continue;
    const a = fade(g);
    if (a <= 0) continue;
    const x = Math.round(g.x / P) * P, y = Math.round(g.y / P) * P;
    ctx.globalAlpha = a;
    ctx.fillStyle = solid(x + P / 2, y + P / 2) ? '#fff' : '#000';
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
