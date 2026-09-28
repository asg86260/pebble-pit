// A site with work on it looks like a building site: barriers, tape, and the
// chips off the builder's hammer.

import { P, INVERT_PROBE, PARTY_IDS } from '../config.js';
import { S } from '../state.js';
import { SITES, rowFor, siteBox, worksAt } from '../works.js';
import { ctx } from './ctx.js';
import { darkPage, xorInk } from '../ink.js';
import { invertByFilter } from './invert.js';
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
// An INVERSION of whatever is behind it rather than black, which is the only
// thing that makes site dust visible: the chips are thrown inside the biggest
// black mass in the yard, so black grains are black-on-black. `difference`
// against white gives each grain the opposite of its ground and needs no test
// of what is underneath.
export function drawGrit() { paintGrit(false); }

// The same chips struck in the deep, painted with the deep's layers: the water
// is laid down after the yard's, and silt under it was never seen.
export function drawSilt() { paintGrit(true); }

// Where the invert filter is exact (render/invert.js) the grains are the
// frame under them turned over through it, not a `difference` fill: on
// Firefox's card a fill of that kind is the whole window taken to the
// processor and back, a grain at a time. The patch under this half's grains
// is copied out once, turned over on the way, and each grain's cell drawn
// back from it at the grain's alpha. A cell two grains share is drawn once,
// at the alpha the two fills in turn come to (`a + b - 2ab`: two whole
// grains on one cell turn it back), so it comes out as the fills did.
let patch = null, patchCtx = null;
const cells = new Map();
const fade = g => Math.max(0, 1 - (g.t / g.life) ** 2);

function paintGrit(sea) {
  let any = false;
  for (const g of S.grit) if (!g.sea === !sea) { any = true; break; }
  if (!any) return;
  if (!darkPage && invertByFilter(ctx)) turnGrit(sea);
  else xorGrit(sea);
}

function turnGrit(sea) {
  cells.clear();
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const g of S.grit) {
    if (!g.sea !== !sea) continue;
    const a = fade(g);
    if (a <= 0) continue;
    const x = Math.round(g.x / P) * P, y = Math.round(g.y / P) * P;
    const key = x + ',' + y, had = cells.get(key);
    if (had) { had.a = had.a + a - 2 * had.a * a; continue; }
    cells.set(key, { x, y, a });
    if (x < x0) x0 = x;
    if (y < y0) y0 = y;
    if (x > x1) x1 = x;
    if (y > y1) y1 = y;
  }
  if (!cells.size) return;
  const t = ctx.getTransform(), c = ctx.canvas;
  const left = Math.max(0, Math.floor(t.a * x0 + t.e)), top = Math.max(0, Math.floor(t.d * y0 + t.f));
  const w = Math.min(c.width, Math.ceil(t.a * (x1 + P) + t.e)) - left;
  const h = Math.min(c.height, Math.ceil(t.d * (y1 + P) + t.f)) - top;
  if (w <= 0 || h <= 0) return;
  // In whole probe's sides, and only ever grown: Firefox draws a canvas
  // smaller than that in software, where copying the card's frame into it is
  // a trip off the card, and a canvas made afresh each frame as a burst
  // spreads is the same trip (the rift's sheet, render/cores.js).
  if (!patch) {
    patch = document.createElement('canvas');
    patch.width = patch.height = INVERT_PROBE;
    patchCtx = patch.getContext('2d');
  }
  if (patch.width < w || patch.height < h) {
    patch.width = Math.max(patch.width, Math.ceil(w / INVERT_PROBE) * INVERT_PROBE);
    patch.height = Math.max(patch.height, Math.ceil(h / INVERT_PROBE) * INVERT_PROBE);
  }
  patchCtx.filter = 'invert(1)';
  patchCtx.drawImage(c, left, top, w, h, 0, 0, w, h);
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  for (const { x, y, a } of cells.values()) {
    if (a <= 0) continue;
    ctx.globalAlpha = a;
    ctx.drawImage(patch, t.a * x + t.e - left, t.d * y + t.f - top, t.a * P, t.d * P, x, y, P, P);
  }
  ctx.restore();
}

function xorGrit(sea) {
  ctx.save();
  ctx.globalCompositeOperation = 'difference';
  ctx.fillStyle = xorInk;
  for (const g of S.grit) {
    if (!g.sea !== !sea) continue;
    ctx.globalAlpha = fade(g);
    ctx.fillRect(Math.round(g.x / P) * P, Math.round(g.y / P) * P, P, P);
  }
  ctx.restore();
  ctx.globalAlpha = 1;
}
