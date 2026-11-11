// REVIEW bodies-
// Act 3's ways, as the one router asks them (route.js, `routeIn`), and the
// one walk every member takes over them (DESIGN.md, "Act bodies on the
// yard's engine").
//
// Two ways: the cloud floor, which rises and falls (`floorAt`), and God's
// crowd, whose rows stand up the screen over it -- a free way, walked
// straight at a spot in its rows, height and all, as the deep's water is
// swum. A body over the crowd's ground is on the crowd's way, floor or row,
// so it walks straight to a row from there; the two join at the crowd's two
// edges, where the floor runs on. Nothing a member walks to stands off the
// floor anywhere else (every target off the floor is a row of the crowd),
// so the pedestal's top is no way: the pair's own walk there is a scene's
// (actbeats.js).

import { AFTER_WALK } from '../config.js';
import { goIn } from '../route.js';
import { walk } from './util.js';
import { floorAt, afterFloor, overCrowd, crowdEdge } from './place.js';

const onFloor = w => Math.abs(w.y - floorAt(w.x)) < 0.5;
let ways = null; // cache: built on first ask, every field a live function
export const AFTER_ROUTE = {
  ways: () => ways || (ways = {
    floor: { key: 'floor', feet: x => floorAt(x) },
    crowd: { key: 'crowd', free: true, feet: x => floorAt(x) }
  }),
  links: () => [
    { x: crowdEdge(-Infinity), a: 'floor', b: 'crowd', name: 'crowd near edge', pace: AFTER_WALK },
    { x: crowdEdge(Infinity), a: 'floor', b: 'crowd', name: 'crowd far edge', pace: AFTER_WALK }
  ],
  wayAt: w => (overCrowd(w.x) ? 'crowd' : 'floor')
};

// One frame of a member's walk to (tx, ty), `ty` the floor's line
// (`afterFloor`) for anywhere on the floor: true once there. A body found off
// the floor away from the crowd (nothing stands it there but a fall's
// landing, which is on the floor) steps straight down to it first, so the
// floor's way never pulls its feet down in a frame.
export function afterGo(w, tx, ty, dt) {
  const toFloor = Math.abs(ty - afterFloor()) < 0.5;
  if (!onFloor(w) && !overCrowd(w.x)) { walk(w, w.x, floorAt(w.x), dt); return false; }
  const key = !toFloor && overCrowd(tx) ? 'crowd' : AFTER_ROUTE.wayAt({ x: tx });
  const toY = key === 'crowd' ? (toFloor ? floorAt(tx) : ty) : null;
  return goIn(AFTER_ROUTE, w, tx, key, AFTER_WALK, dt, toY);
}
// Along the floor to x.
export const floorGo = (w, x, dt) => afterGo(w, x, afterFloor(), dt);
