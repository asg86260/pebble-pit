// A building coming out of the ground: which places are rising, and the clip
// that shows only as much of each as has actually gone up. Owns risingPlaces,
// rising and withRise, which every station's own draw asks for. ctx comes from
// ./ctx.js.
//
// wave7b-build: plural now. The yard used to hold one build at a time, so "the
// rising place" was one word off the head of `S.works['yard']`; with the
// construction bench's second post two buildings rise at once, so each is a
// row here and each is clipped to ITS OWN work's progress rather than the
// head's.

import { OPENS_PLACE, progressOfKey, rowFor, worksAt } from '../works.js';
import { ctx } from './ctx.js';

// Every `kind: 'building'` work on the yard, as the place it is raising and
// how far up it is. Only buildings -- a machine fitted here (the ram, the
// belt) has no rising analogue and stays exactly as sudden as it always was.
// A row may also name what it raises outright. `OPENS_PLACE` answers for the
// rows that open a place for sale, which was every building there was until the
// bench started being built: the bench opens nothing -- it *is* the shop -- so
// putting it in that table would have it claiming ground in the walk's build
// order (see `reserve` in works.js) for a place that was laid out from the
// first frame. A row saying what it raises is the general form of the `house`
// case that was already special here.
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

// Whether this one place is going up right now -- the question every station's
// draw actually asks.
export const rising = place => risingPlaces().some(r => r.place === place);

// Clip a building's own draw to the slice of it that has actually gone up,
// rising from `bottom` -- the ground line for the stations that stand on it,
// but a house room's own foot for the settlement, which climbs a course at a
// time and so is not always standing on the ground itself. The draw itself is
// unchanged, only masked.
//
// `place` is the station's own name: a place not rising (already standing, or
// nothing bought) draws straight through with no clip at all, so the ordinary
// case costs nothing and the caller does not branch.
export function withRise(place, x, bottom, w, h, fn) {
  const r = place && risingPlaces().find(o => o.place === place);
  if (!r) { fn(); return; }
  const p = Math.max(0, Math.min(1, progressOfKey('yard', r.key)));
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, bottom - h * p, w, h * p);
  ctx.clip();
  fn();
  ctx.restore();
}
