// A building coming out of the ground: which places are rising, and the clip
// that shows only as much of each as has actually gone up. Plural: the yard
// holds two builds at once, and each is clipped to ITS OWN work's progress.

import { OPENS_PLACE, progressOfKey, rowFor, worksAt } from '../works.js';
import { P } from '../config.js';
import { ctx } from './ctx.js';

// Every `kind: 'building'` work on the yard, as the place it is raising. Only
// buildings: a machine has no rising analogue. A row may name what it raises
// outright (`raises`); `OPENS_PLACE` answers for the rows that open a place for
// sale, and the bench opens nothing (it *is* the shop), so putting it in that
// table would have it claiming ground in the walk's build order (`reserve` in
// works.js) for a place laid out from the first frame.
export function risingPlaces() {
  const out = [];
  for (const w of worksAt('yard')) {
    const row = rowFor(w.key);
    if (row?.kind !== 'building') continue;
    const place = row.raises || OPENS_PLACE[w.key] || (w.key === 'house' ? 'house' : null);
    if (place) out.push({ place, key: w.key });
  }
  return out;
}

// Whether this one place is going up right now.
export const rising = place => risingPlaces().some(r => r.place === place);

// Clip a building's own draw to the cells that have gone up, laid the way the
// shop tile lays its glyph (`drawGlyph` in glyphs.js, DESIGN.md "A tile being
// built shows the building"): bottom course first, left to right, a cell at a
// time, rising from `bottom` -- the ground line for the stations, but a room's
// own foot for the settlement, which climbs a course at a time. Nothing of the
// building shows before its cell is laid; the tape and the bar say what the
// ground is for. A place not rising draws straight through with no clip, so
// the caller does not branch.
//
// Cells are the yard's own pixels, P across, counted over the building's rect
// rather than its ink: the world does not know the shape before it is drawn.
// A course that is mostly sky fills as fast as one that is mostly wall, which
// is the price of not drawing everything twice to find out.
export function withRise(place, x, bottom, w, h, fn) {
  const r = place && risingPlaces().find(o => o.place === place);
  if (!r) { fn(); return; }
  const p = Math.max(0, Math.min(1, progressOfKey('yard', r.key)));
  // on the lattice, so a cell is a cell
  const cols = Math.max(1, Math.round(w / P)), rows = Math.max(1, Math.round(h / P));
  const left = Math.round(x / P) * P, foot = Math.round(bottom / P) * P;
  const laid = Math.floor(p * cols * rows);
  const full = Math.floor(laid / cols), part = laid % cols;

  if (!laid) return;
  ctx.save();
  ctx.beginPath();
  if (full) ctx.rect(left, foot - full * P, cols * P, full * P);
  if (part) ctx.rect(left, foot - (full + 1) * P, part * P, P);
  ctx.clip();
  fn();
  ctx.restore();
}
