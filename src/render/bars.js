// The progress bar, and where each site's bar hangs.

import { P, TOWER_SHAFT, SHELF_GLYPH_CELLS as CELLS, BUILD_GHOST_INK } from '../config.js';
import { glyphFor, inkSpan } from '../glyphs.js';
import { S, casino, lab, outhouse, filter, tower } from '../state.js';
import { OPENS_PLACE, SITES, progressOf, rowFor, siteBox, worksAt, doneAt } from '../works.js';
import { tintOf } from '../upgrades.js';
import { farmShed, quarryShed } from '../world.js';
import { apothHut } from '../apothecary.js';
import { KINDS, shieldPlan } from '../shield.js';
import { flagReach } from './aura.js';
import { risingPlaces } from './rise.js';
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
const RISING_BOX = { lab: () => lab, filter: () => filter,
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

// A shield is the one yard build that is not a place: it stands over the rock
// at the height its plan gives it (`shieldPlan`), so its bar hangs off
// that, not off the ground line -- which is inside the rock.
const shieldTop = w =>
  KINDS[w.key] && !KINDS[w.key].cast ? S.groundY - shieldPlan(w.key).h * P : null;

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
    const sh = shieldTop(w);
    if (sh != null) top = Math.min(top, sh);
  }
  // And above the station's flag, which reaches well past BAR_CLEAR. The reach
  // is asked of the thing that draws the flag; a clearance guessed here would
  // be a second opinion about how tall a flag is.
  const reach = flagReach(site);
  if (reach != null) top = Math.min(top, reach);
  return { x: box.x + box.w / 2, y: top - BAR_CLEAR };
}

// The thing being worked on, over the place it is happening: the row's own
// glyph at a yard cell a sprite cell, going up the way the card's does
// (glyphs.js, `drawGlyph`) -- bottom row first, left to right, one cell of the
// drawing a share of the work, the rest the shape's outline and nothing inside
// (the card's `plan`), and round the cells that are up the rung's coloured
// stroke (`tint`, the card's `tintOf`) as thick as the done mark's, growing
// with the fill. The same picture on the tile and over the station, so a
// glance at either says what is coming.
const EDGE = P / 6;                      // the outline's stroke, one yard pixel
export function buildingGlyph(cx, cy, rows, at, tint = null) {
  const g = glyphPlan(rows);
  const up = Math.floor(at * g.laid.length);
  const d = g.at[up] ||= drawnAt(g, up);
  // Centred on the ink, not the box: a drawing off to one side of its grid
  // (the shovel, the lamp) would otherwise hang beside the station.
  const x0 = Math.round(cx / P - g.mid) * P, y0 = cy - (CELLS * P) / 2;
  if (tint && up) paintRects(d.stroke, tint, x0, y0);
  paintRects(d.ink, '#000', x0, y0);
  paintRects(d.ghost, BUILD_GHOST_INK, x0, y0);
}

function paintRects(rects, color, x0, y0) {
  if (!rects.length) return;
  ctx.fillStyle = color;
  for (let i = 0; i < rects.length; i += 4) ctx.fillRect(x0 + rects[i], y0 + rects[i + 1], rects[i + 2], rects[i + 3]);
}

// The shape of a drawing and of each stage of it going up, worked out once:
// every station's stack redraws every frame, and a stack of finished rungs is
// dozens of glyphs whose floods and cell sets never change. Keyed on the rows
// themselves, which a glyph edit replaces rather than rewrites.
const PLANS = new WeakMap();
function glyphPlan(rows) {
  let g = PLANS.get(rows);
  if (g) return g;
  const laid = [];
  const shape = new Set();
  rows.forEach((r, y) => [...r].forEach((ch, x) => { if (ch === '#') { laid.push([x, y]); shape.add(`${x},${y}`); } }));
  laid.sort((a, b) => b[1] - a[1] || a[0] - b[0]);
  const [lo, hi] = inkSpan(rows);
  g = { laid, shape, mid: (lo + hi) / 2, at: [] };
  PLANS.set(rows, g);
  return g;
}

// The rectangles of a drawing with `up` of its cells built, about its corner.
function drawnAt({ laid, shape }, up) {
  const stroke = [], ink = [], ghost = [];
  // The stroke first, under the cells: a strip along each side of a built cell
  // that faces the outside, and a square on each corner whose diagonal is
  // outside, so it runs round what is up without boxing a cell or lining a
  // hole. Outside is flooded from a cell past the grid over everything not
  // yet built, the way the done mark's stroke finds it.
  if (up) {
    const t = Math.max(1, P / 3);
    const built = new Set(laid.slice(0, up).map(([x, y]) => `${x},${y}`));
    const out = new Set(), q = [[-1, -1]];
    while (q.length) {
      const [x, y] = q.pop(), k = `${x},${y}`;
      if (x < -1 || y < -1 || x > CELLS || y > CELLS || out.has(k) || built.has(k)) continue;
      out.add(k); q.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
    }
    const open = (x, y) => out.has(`${x},${y}`);
    laid.slice(0, up).forEach(([x, y]) => {
      const px = x * P, py = y * P;
      if (open(x, y - 1)) stroke.push(px, py - t, P, t);
      if (open(x, y + 1)) stroke.push(px, py + P, P, t);
      if (open(x - 1, y)) stroke.push(px - t, py, t, P);
      if (open(x + 1, y)) stroke.push(px + P, py, t, P);
      if (open(x - 1, y - 1)) stroke.push(px - t, py - t, t, t);
      if (open(x + 1, y - 1)) stroke.push(px + P, py - t, t, t);
      if (open(x - 1, y + 1)) stroke.push(px - t, py + P, t, t);
      if (open(x + 1, y + 1)) stroke.push(px + P, py + P, t, t);
    });
  }
  laid.forEach(([x, y], k) => {
    const px = x * P, py = y * P;
    if (k < up) { ink.push(px, py, P, P); return; }
    // Each side of the cell that faces out of the shape gets a stroke, so the
    // outline runs round the whole drawing rather than boxing every cell. In
    // a light gray: what is not there yet stands back from what is.
    if (!shape.has(`${x},${y - 1}`)) ghost.push(px, py, P, EDGE);
    if (!shape.has(`${x},${y + 1}`)) ghost.push(px, py + P - EDGE, P, EDGE);
    if (!shape.has(`${x - 1},${y}`)) ghost.push(px, py, EDGE, P);
    if (!shape.has(`${x + 1},${y}`)) ghost.push(px + P - EDGE, py, EDGE, P);
  });
  return { stroke, ink, ghost };
}

// Over a construction -- a building coming out of the ground, whose own
// sprite already shows the thing going up (`risingPlaces`) -- the bar, so the
// picture is not said twice. Over anything else a station is working on (a
// rung, a machine, a bench, a spell) the thing itself, since nothing on the
// ground shows what it is.
// The stack over a station: the glyphs of what it has finished since its
// board was read at the foot, then what is going up, then what is in line,
// each a glyph's height apart, so the whole of it reads bottom to top as the
// order things were bought. `slot` counts from the foot. The foot is where
// the bar's would be (a bar is three cells deep, centred on the spot), so the
// picture stands clear of the flag's tip the way the bar does instead of
// sitting on it.
export function stackSlot(site, slot, w = null) {
  const at = barSpot(site, w);
  if (!at) return null;
  const x = Math.round(at.x / P) * P, y = Math.round(at.y / P) * P;
  return { x, y, cy: y - (CELLS / 2 - 1.5) * P - slot * P * (CELLS + 2) };
}

export function drawWorkBars() {
  for (const site of SITES) {
    // The whole list, the line included: a work in line is at nought, so it
    // hangs as the outline alone over the one being built, and the stack is
    // what the station has been paid for.
    const list = worksAt(site);
    if (!list.length) continue;
    // One a work. On the yard each work stands on its own ground, so each
    // hangs over its own thing; elsewhere the stack starts over what the
    // station has finished and not yet shown (`drawDoneMarks`).
    let stacked = doneAt(site).length;
    for (const w of list) {
      const lift = site === 'yard' ? 0 : stacked++;
      const at = stackSlot(site, lift, w);
      if (!at) continue;
      if (site === 'yard' && risingPlaces().some(r => r.key === w.key)) {
        bar(at.x, at.y, progressOf(w));
        continue;
      }
      const row = rowFor(w.key);
      buildingGlyph(at.x, at.cy, glyphFor(w.key), progressOf(w), row ? tintOf(row) : null);
    }
  }
}
