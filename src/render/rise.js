// A building coming out of the ground: which place is rising, and the clip that
// shows only as much of it as has actually gone up. Extracted verbatim from
// render.js; behavior unchanged. Owns risingPlace and withRise, which every
// station's own draw asks for. ctx comes from ./ctx.js.

import { OPENS_PLACE, progressAt, rowFor, workAt } from '../works.js';
import { ctx } from './ctx.js';

// --- a building rising out of the ground ---------------------------------------
// #3, "Wave 3.1" in wave-feedback3.md. Everything past the bench builds on the
// yard's one shared site, so at most one place is ever going up at a time, and
// this is the one word that says which: the place `OPENS_PLACE` names the work
// after, or `'house'` for the one row that is not in that table. Only for a
// `kind: 'building'` work -- a machine fitted here (the ram, the belt) has no
// rising analogue and stays exactly as sudden as it always was.
export function risingPlace() {
  const w = workAt('yard');
  if (!w || rowFor(w.key)?.kind !== 'building') return null;
  return OPENS_PLACE[w.key] || (w.key === 'house' ? 'house' : null);
}

// Clip a building's own draw to the slice of it that has actually gone up,
// rising from `bottom` -- the ground line for the six stations that stand on
// it, but a house room's own foot for the settlement, which climbs a course at
// a time and so is not always standing on the ground itself. The draw itself
// is unchanged, only masked. `rising` false is the ordinary case (a place
// already standing) and draws straight through with no clip at all.
export function withRise(rising, x, bottom, w, h, fn) {
  if (!rising) { fn(); return; }
  const p = Math.max(0, Math.min(1, progressAt('yard')));
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, bottom - h * p, w, h * p);
  ctx.clip();
  fn();
  ctx.restore();
}
