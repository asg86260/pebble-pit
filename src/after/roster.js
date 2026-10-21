// Act 3's rosters: a post a job, under the station it works at, on the
// yard's own roster (roster.js; DESIGN.md, "Act 3's crew: assigned like the
// yard's"). The drawing, the buttons, the hit test and the seat pips are the
// yard's; what is the act's is the answers -- how many of a job the roster
// wants (`S.after.crew`), who is spare (the idle, at the podium or in the
// crowd), the seats bought, and the bodies on the job (bodies.js).
//
// A station's jobs stand side by side under it, in the order AFTER_JOBS
// lists them; the grove's (woodcutter, gatherer, hauler) under the forestry
// shack in front of its trees.

import { S } from '../state.js';
import { AFTER_JOBS, AFTER_JOB_POST, AFTER_ROSTER_DOWN } from '../config.js';
import { rosterPlace } from '../roster.js';
import { afterlifeOn } from '../acts.js';
import { built, seatsOf } from './levels.js';
import { stationBox, afterFloor, closed } from './place.js';
import { crewAt, bodiesOf, spareMembers, putOn, walkLeft } from './bodies.js';

const stationOf = card => (card === 'grove' ? 'forestry' : card);
const live = () => afterlifeOn() && !!S.after;

const SRC = {
  count: p => crewAt(p.job),
  press: (p, d) => putOn(p.job, d),
  spare: () => spareMembers(),
  cap: p => seatsOf(p.job),
  bodies: p => bodiesOf(p.job),
  coming: w => !w.on,
  left: w => walkLeft(w),
  uid: w => `after:${w.id}`
};

const POSTS = AFTER_JOBS.map(job => {
  const card = AFTER_JOB_POST[job], key = stationOf(card);
  return {
    key: `after-${job}`, job, place: 'after', group: `after-${key}`, kit: false, fixed: false, src: SRC,
    show: () => live() && built(card) && !closed(card),
    at: () => { const b = stationBox(key); return b.x + b.w / 2; },
    y: () => afterFloor() + AFTER_ROSTER_DOWN,
    deep: false
  };
});
export const afterPosts = () => POSTS;
rosterPlace('after', afterPosts);
