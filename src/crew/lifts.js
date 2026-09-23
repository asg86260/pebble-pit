// The forklifts: machines that haul by themselves. Not crew -- a forklift is
// in `S.lifts`, never `S.workers`, so nothing that is about people (a break, a
// dance, the outhouse, the house, the pointer, the crew board) ever sees one.
// What it shares with the haulers is the work: it runs the haulers' own loop
// (`haulerWork`), and its claims are in the haulers' books, so a forklift and
// a hauler never go for the same column. See DESIGN.md, "The forklifts drive
// themselves".

import { P, WORKER, HAUL_EMPTY, LIFT_PARK } from '../config.js';
import { S } from '../state.js';
import { TYPE } from '../jobs.js';
import { frames } from '../clock.js';
import { walkY, liftX } from '../world.js';
import { liftsOf } from '../kit.js';
import { liftSpeed } from '../levels.js';
import { spawnChip, bell } from '../dust.js';
import { haulerWork } from './hauler.js';
import { stand } from './body.js';
import { unbook } from './hole.js';

// Its slot at the stand, where it rolls out from and parks: a row of them
// running off to the left of the bench, one truck's width and a cell apart.
export const parkX = i => liftX() - i * LIFT_PARK;

// Typed as a hauler, because the haulers' loop and books ask of bodies that
// haul; `vehicle` is what says it is a machine (`drive`, `load`, the idle).
function newLift(x) {
  return { type: TYPE.HAUL, vehicle: true, x, y: walkY(x + WORKER / 2),
           carry: 0, next: 0, goal: 'seek', claim: -1, cutClaim: null, face: 1 };
}

// One forklift in the yard for every one owned (`S.drivers`). A new one is
// stood up at its slot on the stand, which is where the bench made it; one
// taken away (a dev hook, a save that says fewer) puts its load down first.
export function syncLifts() {
  if (!S.lifts) S.lifts = [];
  const want = liftsOf();
  while (S.lifts.length < want) S.lifts.push(newLift(parkX(S.lifts.length)));
  while (S.lifts.length > want) {
    const w = S.lifts.pop();
    for (let i = 0; i < (w.carry || 0); i++)
      spawnChip(w.x + WORKER / 2, S.groundY - WORKER, bell() * 0.5, -1.2, w.load?.[i] || 1);
    if (S.coreTaker === w) S.coreTaker = null;
    unbook(w);
  }
}

// A frame of them, inside the crew's frame (`updateWorkers`), with the crew's
// own books handed in `c` and the crew's own line round a falling rock's
// footprint in `hold`.
export function stepLifts(c, hold) {
  for (const w of S.lifts || []) {
    const x0 = w.x;
    haulerWork(w, c);
    hold?.(w, x0);
    const d = w.x - x0;
    if (Math.abs(d) > 0.01) w.face = Math.sign(d);
  }
}

// Nothing to fetch: back to its slot and switched off there, forks toward the
// yard. A parked row of them is the picture of a yard with nothing left to
// haul.
export function park(w) {
  const to = parkX(Math.max(0, S.lifts.indexOf(w)));
  const d = to - w.x;
  w.x += Math.sign(d) * Math.min(liftSpeed() * HAUL_EMPTY * frames(), Math.abs(d));
  w.y = stand(w);
  if (Math.abs(d) < 1) { w.x = to; w.face = 1; }
}

// On the save: where each one is and what it has on its forks. The count is
// `S.drivers`, saved with the rest of the kit; this is the bodies, so a reload
// does not put every forklift back on the stand.
export const SAVE = {
  fields: ['lifts'],
  write(out) {
    out.lifts = (S.lifts || []).map(w => ({ x: Math.round(w.x), face: w.face || 1,
                                            carry: w.carry || 0, load: w.load || [],
                                            core: !!w.hasCore, stored: w.stored || 0 }));
  },
  read(s) {
    S.lifts = [];
    for (const k of s.lifts || []) {
      if (!Number.isFinite(k.x)) continue;
      const w = newLift(k.x);
      w.face = k.face || 1;
      w.carry = k.carry | 0;
      w.load = Array.isArray(k.load) ? k.load.slice(0, w.carry) : [];
      w.hasCore = !!k.core;
      w.stored = k.stored | 0;
      if (w.carry || w.hasCore) w.goal = 'dump';
      S.lifts.push(w);
    }
    syncLifts();
  },
  blank() { S.lifts = []; }
};
