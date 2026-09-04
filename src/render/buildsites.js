// A site with work on it looks like a building site: barriers, tape, and the
// chips off the builder's hammer. Extracted verbatim from render.js; behavior
// unchanged. Owns drawBuildSites and drawGrit. ctx comes from ./ctx.js.

import { P } from '../config.js';
import { S } from '../state.js';
import { SITES, rowFor, siteBox, workAt } from '../works.js';
import { ctx } from './ctx.js';

// --- a busy site looks like a building site -----------------------------------
// See C3 in wave-feedback3.md. A site under way used to read exactly like an
// idle one but for a bar floating over it; now it is fenced while the work is
// on, the way a real hole in the ground is.
//
// The footprint of a *station* -- the quarry, the farm, the scrub house, the
// tower, the bench -- is simply its own rect. The yard is the odd one: it is
// one slot shared by every building that has no gang of its own (the house,
// the outhouse, the school, the lab, the casino, the tower's own unlock), and
// what is going up there is named by the *row*, not by the site. The ground a
// site's work is on comes from works.js now -- one answer for the tape round
// it, the bar over it and the patch the builder works across. See `siteBox`
// there.

// A striped post: alternating cell-high bands, the black ones doing all the
// work -- a white band against the page is simply the page.
function drawBarrierPost(x, y, w, bands) {
  for (let i = 0; i < bands; i++) {
    if (i % 2 !== 0) continue;
    ctx.fillRect(x, y + i * P, w, P);
  }
}

// A busy site only looks like a building site when there is a building (or a
// machine) actually going up on it. A rung worked at the bench (`kind: 'rung'`)
// is a body standing at a bench that was already there -- nothing is rising out
// of the ground, so barriers and tape round it would be fencing off thin air.
// See #2, "Wave 3.1" in wave-feedback3.md.
const risingKinds = new Set(['building', 'machine']);
const underConstruction = site => {
  const w = workAt(site);
  return !!w && risingKinds.has(rowFor(w.key)?.kind);
};

// The site sheds no dust of its own, and that is deliberate rather than
// missing. There was a haze along the foot of whatever was going up -- a puff
// every so often from the ground line, spread across the frontage -- and made
// heavy enough to see it read as the ground smouldering rather than as work.
// What says a building site is a building site is the barriers, the tape, the
// thing rising out of the ground, and the body swinging a hammer at it with
// chips coming off each blow (see `workJig` in crew.js). Dust with nobody
// making it was decoration.
export function drawBuildSites() {
  for (const site of SITES) {
    if (!underConstruction(site)) continue;
    const foot = siteBox(site);
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
// Drawn here, after the buildings and the crew, rather than pushed on to
// `S.smoke` -- which is where this dust used to go, and which is drawn (see
// `drawSmoke`, called long before `drawHouses`) *behind* every building in the
// yard. Dust thrown off the front of a wall that renders behind the wall reads
// as a smudge on the horizon, so it had to come out of the smoke list for the
// draw order alone, quite apart from behaving nothing like smoke.
//
// One cell, no growth, no fade to speak of -- a chip is a chip until it is
// gone. `drawSmoke` swells its motes by 140% over their life because that is
// what a wisp does; doing it here is what made the old dust read as a puff of
// exhaust coming off a joist.
//
// Drawn as an INVERSION of whatever is behind it rather than in black, and that
// is not a flourish -- it is the only thing that makes site dust visible at
// all. Everything in this yard is a black mass on a white page, and a building
// going up is the biggest black mass there is. The haze off the works is shed
// along the foot of the footprint, which is to say inside that mass, so every
// grain of it was black-on-black: thrown correctly, stepped correctly, faded
// correctly, and invisible. Moving where it is thrown would only trade the
// site's dust for the hammer's, which crosses the same wall whenever a builder
// swings beside one.
//
// `difference` against white gives each grain the opposite of its ground: dark
// over the open page, pale over a wall, mid-grey over the tones between. It
// costs nothing per mote and needs no test of what is underneath, which is the
// point -- there is no list of "dark things" to keep in step with.
export function drawGrit() {
  ctx.save();
  ctx.globalCompositeOperation = 'difference';
  ctx.fillStyle = '#fff';
  for (const g of S.grit) {
    ctx.globalAlpha = Math.max(0, 1 - (g.t / g.life) ** 2);
    ctx.fillRect(Math.round(g.x / P) * P, Math.round(g.y / P) * P, P, P);
  }
  ctx.restore();
  ctx.globalAlpha = 1;
}
