// The teacher: the training grounds' own body. (wave6-sim, item 1)
//
// The school sells trades and hats, and every one of them is a work somebody
// has to stand there and do -- and until now the somebody was whoever the yard
// could spare, which meant a post with no name on the boards and a station that
// taught nothing the moment the yard was busy. A teacher is put on the school
// the way a scholar is put on the lab: one body, through the door, and the
// works run only while it is in there.
//
// The walk and the door are the purifier's, word for word: cross the yard to
// the front of the building, and step inside. The school's outputs hang off
// `handsAt('school')` in muster.js, which is what makes the standing matter.

import { WORKER, FARM_WALK } from '../config.js';
import { S, school } from '../state.js';
import { walkY } from '../world.js';
import { TYPE } from '../jobs.js';

export function newTeacher() {
  return { type: TYPE.TEACH, goal: 'to', x: school.x, y: 0 };
}

// the door, in the middle of the front, like every other shed here
export const schoolDoor = () => school.x + school.w * 0.5;

export function stepTeacher(w) {
  if (w.goal === 'in') return;                   // through the door, teaching
  w.y = walkY(w.x + WORKER / 2);
  const d = schoolDoor() - WORKER / 2 - w.x;
  if (Math.abs(d) < 1) { w.goal = 'in'; return; }
  w.x += Math.sign(d) * Math.min(FARM_WALK, Math.abs(d));
}
