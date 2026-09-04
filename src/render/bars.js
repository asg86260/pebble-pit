// The progress bar, and where each site's bar hangs. Extracted verbatim from
// render.js; behavior unchanged. Owns bar, barSpot and drawWorkBars. ctx comes
// from ./ctx.js.

import { P } from '../config.js';
import { S } from '../state.js';
import { SITES, progressOf, siteBox, worksAt } from '../works.js';
import { farmShed, quarryShed } from '../world.js';
import { apothHut } from '../apothecary.js';
import { ctx } from './ctx.js';

// One bar, drawn wherever something is being worked through. The lab has had
// this picture since the day it opened and it is the right one for every site
// that builds: a thing filling a cell at a time, over the place it is happening,
// that stops dead while nobody is standing there.
export function bar(cx, cy, at) {
  const w = P * 14, h = P * 3;
  const x = cx - w / 2, y = cy - h / 2;

  ctx.fillStyle = '#fff';
  ctx.fillRect(x, y, w, h);
  ctx.lineWidth = Math.max(1, P / 3);
  ctx.strokeStyle = '#000';
  ctx.strokeRect(x, y, w, h);

  ctx.fillStyle = '#000';
  const room = w - P * 2;
  const done = Math.round(room * at / P) * P;
  if (done > 0) ctx.fillRect(x + P, y + P, done, h - P * 2);
}

// Where a site's bar hangs. Over the place the work is happening, which for the
// yard is wherever the thing is going to stand -- a row that opens a place knows
// where its place will be and says so, and the two machines on the bench do not,
// so theirs hangs over the rock the yard is built round.
// Where a site's bar hangs: over the middle of the thing, a little clear of the
// top of it. Off the site's own box (see `siteFoot`), which is the station's own
// rect or the ground a build covers -- so a bar cannot end up in the middle of
// what it is about, and a station that is resited or grows takes its bar with
// it.
//
// This was a table of hand-placed spots, one a site, each with its own offset
// worked out by eye: twenty-four cells over the quarry, twenty-two over the
// farm, eight over the tower, twenty over the ground for anything the yard was
// putting up. Which was fine until a thing was taller than the number somebody
// had guessed for it -- the settlement grows a course at a time, so its bar
// ended up inside the building rather than above it. Nothing here is placed by
// hand any more.
const BAR_CLEAR = P * 4;                 // how far above the top of a thing it floats

// Sites whose box is wider than their building hang the bar over the building.
// The quarry's and farm's boxes are ground -- the hole and the plots -- and the
// apothecary's is the whole plot of hut, shelves and pots; a bar centered on
// any of those floats over the middle of nowhere. Each has one rect that IS the
// building (the board opens at it, the crew stand at it), so the bar hangs over
// that. Still a measured rect, not a hand-placed spot.
// Deferred with arrows: this module sits in an import cycle with world.js, so
// naming the bindings while the object is built reads them before they exist.
const BUILDING_OF = { quarry: () => quarryShed(), farm: () => farmShed(),
                      apothecary: () => apothHut() };

export function barSpot(site) {
  const box = BUILDING_OF[site] ? BUILDING_OF[site]() : siteBox(site);
  if (!box) return null;
  // A hole in the ground has no top above the line -- the quarry's box starts at
  // the ground and goes down -- so the bar hangs off the ground line for those,
  // which is the top of them as far as anybody looking at the yard is concerned.
  const top = Math.min(box.y ?? S.groundY, S.groundY);
  return { x: box.x + box.w / 2, y: top - BAR_CLEAR };
}

export function drawWorkBars() {
  for (const site of SITES) {
    const list = worksAt(site);
    if (!list.length) continue;
    const at = barSpot(site);
    if (!at) continue;
    // One bar a work, stacked upward. A site with room for two -- the lab, with
    // a second bench -- has two things on the go and two bars to say so; every
    // other site has one and this is the one, exactly where it always hung.
    list.forEach((w, i) => bar(Math.round(at.x / P) * P,
                               Math.round(at.y / P) * P - i * P * 5, progressOf(w)));
  }
}
