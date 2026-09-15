// A building coming out of the ground: which places are rising, and the clip
// that shows only as much of each as has actually gone up. Plural: the yard
// holds two builds at once, and each is clipped to ITS OWN work's progress.

import { OPENS_PLACE, progressOfKey, rowFor, worksAt } from '../works.js';
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

// Clip a building's own draw to the slice that has gone up, rising from
// `bottom`: the ground line for the stations, but a room's own foot for the
// settlement, which climbs a course at a time. A place not rising draws
// straight through with no clip, so the caller does not branch.
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
