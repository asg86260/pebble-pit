// A site with work on it looks like a building site: barriers, tape, and the
// chips off the builder's hammer.

import { P } from '../config.js';
import { S } from '../state.js';
import { SITES, rowFor, siteBox, worksAt } from '../works.js';
import { ctx } from './ctx.js';
import { xorInk } from '../ink.js';

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
export function drawBuildSites() {
  for (const site of SITES) for (const work of construction(site)) {
    const foot = siteBox(site, work);
    if (!foot) continue;

    const postW = P * 2, postBands = 5, postH = P * postBands;
    const left = Math.round(foot.x / P) * P - P * 3 - postW;
    const right = Math.round((foot.x + foot.w) / P) * P + P * 3;
    const topY = S.groundY - postH;

    ctx.fillStyle = '#000';
    drawBarrierPost(left, topY, postW, postBands);
    drawBarrierPost(right, topY, postW, postBands);

    // the tape, at head height, dashed a cell on and a cell off
    const tapeY = S.groundY - P * 3;
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
// An INVERSION of whatever is behind it rather than black, which is the only
// thing that makes site dust visible: the chips are thrown inside the biggest
// black mass in the yard, so black grains are black-on-black. `difference`
// against white gives each grain the opposite of its ground and needs no test
// of what is underneath.
export function drawGrit() {
  ctx.save();
  ctx.globalCompositeOperation = 'difference';
  ctx.fillStyle = xorInk;
  for (const g of S.grit) {
    ctx.globalAlpha = Math.max(0, 1 - (g.t / g.life) ** 2);
    ctx.fillRect(Math.round(g.x / P) * P, Math.round(g.y / P) * P, P, P);
  }
  ctx.restore();
  ctx.globalAlpha = 1;
}
