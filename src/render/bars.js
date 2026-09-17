// The progress bar, and where each site's bar hangs.

import { P, TOWER_SHAFT, SHELF_GLYPH_CELLS as CELLS, BUILD_GHOST_INK } from '../config.js';
import { glyphFor } from '../glyphs.js';
import { S, casino, lab, outhouse, scrub, tower } from '../state.js';
import { OPENS_PLACE, SITES, progressOf, rowFor, siteBox, onTheGo } from '../works.js';
import { farmShed, quarryShed } from '../world.js';
import { apothHut } from '../apothecary.js';
import { flagReach } from './aura.js';
import { ctx } from './ctx.js';

// One bar for every site that builds: a thing filling a cell at a time, over
// the place it is happening, that stops dead while nobody is standing there.
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

// Where a site's bar hangs: over the middle of the thing, a little clear of the
// top of it, off the site's own box (`siteBox`) rather than a hand-placed spot,
// so a station that is resited or grows takes its bar with it and a bar cannot
// end up inside the building it is about.
const BAR_CLEAR = P * 7;                 // how far above the top of a thing it floats

// The spire: the main shaft, without the turret off the right-hand side, since
// a bar centered on the tower's full rect lands right of the point. The top is
// raised by the vane's three cells plus one course so BAR_CLEAR does not draw
// the bar through the vane.
const towerSpireBox = () =>
  ({ x: tower.x, w: P * TOWER_SHAFT, y: tower.y - P * 4, h: tower.h + P * 4 });

// Sites whose box is wider than their building hang the bar over the building.
// The quarry's, farm's and apothecary's boxes are their sheds already
// (`SITE_BOX` in works.js), so the tower is the one entry.
const BUILDING_OF = {
                      tower: towerSpireBox };

// The finished rect of each place a `kind: 'building'` work can raise, keyed
// the way risingPlace names them, readable mid-build.
const RISING_BOX = { lab: () => lab, scrub: () => scrub,
                     casino: () => casino, outhouse: () => outhouse,
                     tower: towerSpireBox,
                     apothecary: () => apothHut(),
                     quarry: () => quarryShed(), farm: () => farmShed(),
                     house: () => siteBox('yard') };

// Which place a yard work is raising, per WORK: the yard holds two builds at
// once, and each bar belongs over its own.
const placeOf = w =>
  rowFor(w.key)?.kind === 'building'
    ? (OPENS_PLACE[w.key] || (w.key === 'house' ? 'house' : null)) : null;

export function barSpot(site, w = null) {
  const box = BUILDING_OF[site] ? BUILDING_OF[site]() : siteBox(site, w);
  if (!box) return null;
  // A hole in the ground has no top above the line, so the bar hangs off the
  // ground line for those.
  let top = Math.min(box.y ?? S.groundY, S.groundY);
  // A bar hangs over the WHOLE station at its finished height, not the slice
  // that has risen so far: a bar that creeps up as it fills cannot be glanced
  // at twice from the same place. The yard's own box carries no `y` for an
  // unlock, so the finished height comes off the PLACE the work is raising.
  if (site === 'yard' && w) {
    const place = placeOf(w);
    const b = place && (RISING_BOX[place] ? RISING_BOX[place]() : null);
    if (b) top = Math.min(b.y ?? S.groundY, S.groundY);
  }
  // And above the station's flag, which reaches well past BAR_CLEAR. The reach
  // is asked of the thing that draws the flag; a clearance guessed here would
  // be a second opinion about how tall a flag is.
  const reach = flagReach(site);
  if (reach != null) top = Math.min(top, reach);
  return { x: box.x + box.w / 2, y: top - BAR_CLEAR };
}

// The thing being built, over the place it is happening: the row's own glyph
// at a yard cell a sprite cell, going up the way the card's does (glyphs.js,
// `drawGlyph`) -- bottom row first, left to right, one cell of the drawing a
// share of the work, the rest the shape's outline and nothing inside (the
// card's `plan`). The same picture on the tile and over the station, so a
// glance at either says what is coming.
const EDGE = P / 6;                      // the outline's stroke, one yard pixel
export function buildingGlyph(cx, cy, rows, at) {
  const laid = [];
  const shape = new Set();
  rows.forEach((r, y) => [...r].forEach((ch, x) => { if (ch === '#') { laid.push([x, y]); shape.add(`${x},${y}`); } }));
  laid.sort((a, b) => b[1] - a[1] || a[0] - b[0]);
  const up = Math.floor(at * laid.length);
  const x0 = cx - (CELLS * P) / 2, y0 = cy - (CELLS * P) / 2;
  laid.forEach(([x, y], k) => {
    const px = x0 + x * P, py = y0 + y * P;
    if (k < up) { ctx.fillStyle = '#000'; ctx.fillRect(px, py, P, P); return; }
    // Each side of the cell that faces out of the shape gets a stroke, so the
    // outline runs round the whole drawing rather than boxing every cell. In
    // a light gray: what is not there yet stands back from what is.
    ctx.fillStyle = BUILD_GHOST_INK;
    if (!shape.has(`${x},${y - 1}`)) ctx.fillRect(px, py, P, EDGE);
    if (!shape.has(`${x},${y + 1}`)) ctx.fillRect(px, py + P - EDGE, P, EDGE);
    if (!shape.has(`${x - 1},${y}`)) ctx.fillRect(px, py, EDGE, P);
    if (!shape.has(`${x + 1},${y}`)) ctx.fillRect(px + P - EDGE, py, EDGE, P);
  });
}

export function drawWorkBars() {
  for (const site of SITES) {
    // A picture over what is being built and none over what is in line behind it.
    const list = onTheGo(site);
    if (!list.length) continue;
    // One a work. On the yard each work stands on its own ground, so each
    // hangs over its own thing; elsewhere a second work stacks upward.
    let stacked = 0;
    for (const w of list) {
      const at = barSpot(site, w);
      if (!at) continue;
      const x = Math.round(at.x / P) * P;
      const lift = site === 'yard' ? 0 : stacked++;
      // Its foot where the bar's was (a bar is three cells deep, centred on
      // the spot), so the picture stands clear of the flag's tip the way the
      // bar did instead of sitting on it.
      const cy = Math.round(at.y / P) * P - (CELLS / 2 - 1.5) * P - lift * P * (CELLS + 2);
      buildingGlyph(x, cy, glyphFor(w.key), progressOf(w));
    }
  }
}
