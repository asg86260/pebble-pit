// One grain, one body: a column somebody has set off for is nobody else's
// target, and a body with room in its hands does not turn for the hole while
// a grain nobody has set off for lies nearer than the hole. Both read off a
// yard the way a player has one -- a rockhand knocking chips off the rock and
// a few haulers carrying them -- watched every frame.
//
// "Within reach" is the bound `nextNear` (crew/hauler.js) holds a body with
// room to: nearer than the walk home, on the body's own side of a rock coming
// down, and not under it.

import { group, ok, run, P } from './helpers.mjs';
import { S, floor, pit } from '../src/state.js';
import { at, colOf } from '../src/grid.js';
import { load } from '../src/crew/hole.js';
import { dropZone } from '../src/rock.js';
import { sideOf } from '../src/crew/body.js';
import { TYPE } from '../src/jobs.js';

const haulers = () => S.workers.filter(w => w.type === TYPE.HAUL);

// A few haulers outnumbering the rock's spill, so the ground is sometimes
// bare and sometimes not, and hands are often only part full.
const busyYard = () => {
  window.__reset();
  window.__crew(1, 4);
  window.__levels({ pickLevel: 3, rockhandSpeedLevel: 3, rockhandPickLevel: 3, haulCarryLevel: 3 });
};

group('no two haulers head for the same grain at once', async () => {
  busyYard();
  let dup = 0, first = '';
  for (let i = 0; i < 60 * 60; i++) {
    run(1 / 60);
    const seen = new Map();
    for (const w of haulers()) {
      if (w.claim < 0) continue;
      const o = seen.get(w.claim);
      if (o) { dup++; first ||= `frame ${i}: column ${w.claim}, bodies at ${colOf(floor, o.x)} and ${colOf(floor, w.x)}`; }
      else seen.set(w.claim, w);
    }
  }
  return [ok(dup === 0, 'every claim is one body\'s', `${dup} frames doubled, first ${first}`)];
});

group('a hauler with room takes the grain beside it before the walk to the hole', async () => {
  busyYard();
  let early = 0, first = '', trips = 0;
  const goal = new Map();
  let lying = new Set();
  for (let i = 0; i < 60 * 60; i++) {
    // A rock off every quarter minute: a body with a part load and its claim
    // under the coming rock still has the ground on its own side.
    if (i % (15 * 60) === 60 * 5) window.__next();
    run(1 / 60);
    const zone = dropZone();
    const hs = haulers();
    const held = new Set(hs.filter(w => w.claim >= 0).map(w => w.claim));
    for (const w of hs) {
      const turned = goal.get(w) === 'seek' && w.goal === 'dump';
      goal.set(w, w.goal);
      if (!turned) continue;
      trips++;
      if (w.carry >= load(w)) continue;
      const here = colOf(floor, w.x + 9);
      const reach = Math.floor(Math.abs(pit.x - w.x) / P);
      const side = zone ? sideOf(zone, w.x) : 0;
      // Lying before this frame began and still lying: a grain that came
      // down after the body looked is the next trip's.
      const left = [...lying].filter(c => at(floor, c, 0) && !held.has(c) &&
        Math.abs(c - here) <= reach &&
        !(zone && floor.x + c * P >= zone.from - P && floor.x + c * P <= zone.to) &&
        !(side && sideOf(zone, floor.x + c * P) !== side));
      if (left.length) { early++; first ||= `frame ${i}: ${w.carry}/${load(w)} at column ${here}, left ${left.slice(0, 6)}`; }
    }
    lying = new Set();
    const last = colOf(floor, pit.x) - 1;
    for (let c = 0; c <= last; c++) if (at(floor, c, 0)) lying.add(c);
  }
  return [
    ok(trips > 10, 'the haulers make trips', `${trips}`),
    ok(early === 0, 'none turns for home with room and a free grain in reach', `${early} times, first ${first}`)
  ];
});
