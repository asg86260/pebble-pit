// Heaven's gates stand over the house since 2026-11-01, with no stairway up
// to them (the owner's K2), so the home is laid out from the yard's edge
// rather than past the stairway, and the whole yard -- the house, the
// mansion's ground, every site, the rock, the pit, and the deep and hell
// under it (laid out off the pit) -- stands further left by the same
// distance: the change in the ground's anchor, `floor.cx`. The floor and the
// smog layers slide by that anchor already (persist.js, `floorShift`); this
// moves everything else a save holds by world x along with them, so a reload
// finds every body where it stood against the ground it stood on. Act 3's
// place has its own floor (after/place.js) and does not move.
//
// The pair on the stair that is gone float on instead: on the way up, from
// where they are to the gates; on the way down, from where they are to the
// ruin (ghosts.js, the float legs).
import { P } from '../config/yard.js';
import { WORKER } from '../config/crew.js';
import { GROUND_LEFT } from '../config/sites.js';
import { FINALE_END_CELLS } from '../config/finale.js';
import { afterFloor, afterTop } from '../after/place.js';

const DOWN_FLOAT = 2;   // `down`'s float leg (ghosts.js)
// The door's cell off the yard's left edge before this (FINALE_END_CELLS on
// 2026-10-20, 2026-10-20-gates-left.js): the two of them at home go with the
// house by its own move, whether or not the save carries the ground's anchor.
const DOOR_THEN = 81;

export default {
  since: '2026-11-01',
  v: 37,
  says: 'heaven\'s gates over the house and no stairway: the yard laid out further left, everything in it moved with it',
  apply(s) {
    const cx = s.floor && Number.isFinite(s.floor.cx) ? s.floor.cx : null;
    const d = cx == null ? 0 : GROUND_LEFT - cx;
    const col = Math.round(d / P);
    const by = v => (Number.isFinite(v) ? v + d : v);
    const row0 = list => (Array.isArray(list) ? list.forEach(r => { if (Array.isArray(r)) r[0] = by(r[0]); }) : null);
    if (d) {
      if (Number.isFinite(s.camX)) s.camX += d;
      s.mouth = by(s.mouth);   // where the cut's mouth was under the crew (records.js)
      for (const w of Array.isArray(s.who) ? s.who : []) {
        w.x = by(w.x); w.footAt = by(w.footAt);
        if (w.hatOff) w.hatOff.x = by(w.hatOff.x);
        if (Number.isFinite(w.claim) && w.claim >= 0) w.claim += col;   // a floor column
      }
      for (const key of ['lifts', 'roombaBots']) for (const w of Array.isArray(s[key]) ? s[key] : []) w.x = by(w.x);
      for (const key of ['chips', 'drops', 'puffs', 'clods']) row0(s[key]);
      if (s.shield) s.shield.x = by(s.shield.x);
      for (const b of s.hell && Array.isArray(s.hell.bodies) ? s.hell.bodies : []) b.x = by(b.x);
    }
    const r = s.retired, home = (FINALE_END_CELLS - DOOR_THEN) * P;
    if (r) {
      if (Number.isFinite(r.home)) r.home += home;
      if (Array.isArray(r.x)) r.x = r.x.map(x => (Number.isFinite(x) ? x + home : x));
    }
    const p = s.acts && s.acts.pair;
    if (!p) return;
    // up in act 3's place they stand where they stood; anywhere else they go
    // with the yard
    const inAfter = Number.isFinite(p.y) && p.y + WORKER <= afterFloor() + P && p.y >= afterTop();
    if (!inAfter && d) { p.x = by(p.x); if (p.drift) p.drift.x = by(p.drift.x); }
    if (p.route === 'climb') { p.route = 'float'; p.leg = 0; delete p.drift; }
    if (p.at === 'climb') p.at = 'float';
    if (p.route === 'down' && p.leg > DOWN_FLOAT) { p.leg = DOWN_FLOAT; delete p.drift; }
  }
};
