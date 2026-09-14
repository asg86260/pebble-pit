// The progress bar, and where each site's bar hangs. Extracted verbatim from
// render.js; behavior unchanged. Owns bar, barSpot and drawWorkBars. ctx comes
// from ./ctx.js.

import { P, TOWER_SHAFT } from '../config.js';
import { S, casino, lab, outhouse, scrub, tower } from '../state.js';
import { OPENS_PLACE, SITES, progressOf, rowFor, siteBox, onTheGo } from '../works.js';
import { farmShed, quarryShed } from '../world.js';
import { apothHut } from '../apothecary.js';
import { flagReach } from './aura.js';
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
const BAR_CLEAR = P * 7;                 // how far above the top of a thing it floats

// The spire: the main shaft, without the turret hung off the right-hand side.
// The tower's own rect spans both, so a bar centered on it lands right of the
// point. The top is raised by the weather vane's three cells plus one course so
// the ordinary BAR_CLEAR does not draw the bar through the vane.
const towerSpireBox = () =>
  ({ x: tower.x, w: P * TOWER_SHAFT, y: tower.y - P * 4, h: tower.h + P * 4 });

// Sites whose box is wider than their building hang the bar over the building.
// The quarry's and farm's boxes are ground -- the hole and the plots -- and the
// apothecary's is the whole plot of hut, shelves and pots; a bar centered on
// any of those floats over the middle of nowhere. Each has one rect that IS the
// building (the board opens at it, the crew stand at it), so the bar hangs over
// that. Still a measured rect, not a hand-placed spot.
// Deferred with arrows: this module sits in an import cycle with world.js, so
// naming the bindings while the object is built reads them before they exist.
const BUILDING_OF = { quarry: () => quarryShed(), farm: () => farmShed(),
                      apothecary: () => apothHut(),
                      // The tower's box is the shaft plus the turret off its
                      // right side, so the middle of it sits well right of the
                      // point -- and a bar about the hat being made under that
                      // roof belongs over that roof. This is the one bar the
                      // tower gets: the hand-drawn second one it used to paint
                      // itself is deleted. (feedback6 item 9)
                      tower: towerSpireBox };

// The finished rect of each place a `kind: 'building'` work can raise, keyed
// the way risingPlace names them. The rects stand in the layout before the
// place opens, so they are readable mid-build; the house is the one that grows,
// and siteBox already answers with the rooms the build will have.
const RISING_BOX = { lab: () => lab, scrub: () => scrub,
                     casino: () => casino, outhouse: () => outhouse,
                     tower: towerSpireBox,
                     apothecary: () => apothHut(),
                     quarry: () => quarryShed(), farm: () => farmShed(),
                     house: () => siteBox('yard') };

// wave7b-build: which place a yard work is raising, per WORK now -- the yard
// holds two builds at once, and each bar belongs over its own.
const placeOf = w =>
  rowFor(w.key)?.kind === 'building'
    ? (OPENS_PLACE[w.key] || (w.key === 'house' ? 'house' : null)) : null;

export function barSpot(site, w = null) {
  const box = BUILDING_OF[site] ? BUILDING_OF[site]() : siteBox(site, w);
  if (!box) return null;
  // A hole in the ground has no top above the line -- the quarry's box starts at
  // the ground and goes down -- so the bar hangs off the ground line for those,
  // which is the top of them as far as anybody looking at the yard is concerned.
  let top = Math.min(box.y ?? S.groundY, S.groundY);
  // A bar hangs over the WHOLE station, at the height the station will be when
  // it is finished -- not over the slice of it that has risen so far.
  //
  // It used to ride the rising edge (feedback7 item 15), which kept it clear of
  // the drawing at every moment and made the bar itself climb the screen while
  // you watched it. Two things moving at once, and the one you are reading is
  // the one that should hold still: a bar that creeps up as it fills is a bar
  // you cannot glance at twice from the same place. The yard's own box carries
  // no `y` for an unlock (the ground is reserved by x alone), so the finished
  // height comes off the PLACE the work is raising.
  if (site === 'yard' && w) {
    const place = placeOf(w);
    const b = place && (RISING_BOX[place] ? RISING_BOX[place]() : null);
    if (b) top = Math.min(b.y ?? S.groundY, S.groundY);
  }
  // ...and above the station's flag, where it flies one. The flag stands off
  // the building's own topmost feature and reaches well past BAR_CLEAR, so a
  // bar measured from the roof alone was drawn straight through the pole. The
  // reach is the flag's, asked of the thing that draws it -- a clearance
  // guessed here would be a second opinion about how tall a flag is.
  const reach = flagReach(site);
  if (reach != null) top = Math.min(top, reach);
  return { x: box.x + box.w / 2, y: top - BAR_CLEAR };
}

export function drawWorkBars() {
  for (const site of SITES) {
    // A bar over what is being built, and none over what is in line behind it:
    // a bar at nought with nobody under it is a promise the yard is not keeping.
    const list = onTheGo(site);
    if (!list.length) continue;
    // One bar a work. On the yard each work stands on its own ground now, so
    // each bar hangs over its own thing -- two builds, two bars, two places --
    // and a second work that happens to share the head work's ground (the lab's
    // second bench) stacks upward exactly as it always has.
    let stacked = 0;
    for (const w of list) {
      const at = barSpot(site, w);
      if (!at) continue;
      const x = Math.round(at.x / P) * P;
      const lift = site === 'yard' ? 0 : stacked++;
      bar(x, Math.round(at.y / P) * P - lift * P * 5, progressOf(w));
    }
  }
}
