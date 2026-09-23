// The forklifts: machines that haul by themselves. Not crew -- a forklift is
// in `S.lifts`, never `S.workers`, so nothing that is about people (a break, a
// dance, the outhouse, the house, the pointer, the crew board) ever sees one.
// What it shares with the haulers is the work: it runs the haulers' own loop
// (`haulerWork`), and its claims are in the haulers' books, so a forklift and
// a hauler never go for the same column. See DESIGN.md, "The forklifts drive
// themselves".

import { P, WORKER, HAUL_EMPTY, GARAGE_W, GARAGE_H } from '../config.js';
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

// The garage: a shed on the ground left of the carts' stand, standing from
// the first forklift. However many there are, an idle one drives in at the
// door and is out of sight until there is something to fetch, the way a body
// goes into its house (DESIGN.md, "The forklifts drive themselves").
export const garage = () => ({ x: Math.round(liftX() / P) * P, w: GARAGE_W, h: GARAGE_H });
export const hasGarage = () => liftsOf() > 0;
// Where a forklift stands to go in or come out: in the doorway.
export const doorX = () => garage().x + (GARAGE_W - WORKER) / 2;
export const inGarage = () => (S.lifts || []).filter(w => w.inside).length;

// Typed as a hauler, because the haulers' loop and books ask of bodies that
// haul; `vehicle` is what says it is a machine (`drive`, `load`, the idle).
// A new one is made in the garage and drives out of it.
function newLift(x) {
  return { type: TYPE.HAUL, vehicle: true, x, y: walkY(x + WORKER / 2),
           carry: 0, next: 0, goal: 'idle', claim: -1, cutClaim: null, face: -1,
           inside: true };
}

// One forklift in the yard for every one owned (`S.drivers`). A new one is
// stood up at its slot on the stand, which is where the bench made it; one
// taken away (a dev hook, a save that says fewer) puts its load down first.
export function syncLifts() {
  if (!S.lifts) S.lifts = [];
  const want = liftsOf();
  while (S.lifts.length < want) S.lifts.push(newLift(doorX()));
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
    // Anything to do takes it back out through the door it went in by.
    if (w.inside && w.goal !== 'idle') { w.inside = false; w.x = doorX(); }
    hold?.(w, x0);
    const d = w.x - x0;
    if (Math.abs(d) > 0.01) w.face = Math.sign(d);
  }
}

// Nothing to fetch: home to the garage, and in at the door.
export function park(w) {
  if (w.inside) return;
  const to = doorX();
  const d = to - w.x;
  w.x += Math.sign(d) * Math.min(liftSpeed() * HAUL_EMPTY * frames(), Math.abs(d));
  w.y = stand(w);
  if (Math.abs(d) < 1) { w.x = to; w.inside = true; }
}

// On the save: where each one is and what it has on its forks. The count is
// `S.drivers`, saved with the rest of the kit; this is the bodies, so a reload
// does not put every forklift back on the stand.
export const SAVE = {
  fields: ['lifts'],
  write(out) {
    out.lifts = (S.lifts || []).map(w => ({ x: Math.round(w.x), face: w.face || 1,
                                            carry: w.carry || 0, load: w.load || [],
                                            core: !!w.hasCore, stored: w.stored || 0,
                                            inside: !!w.inside }));
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
      w.inside = !!k.inside && !w.carry && !w.hasCore;
      if (!w.inside) w.goal = w.carry || w.hasCore ? 'dump' : 'seek';
      S.lifts.push(w);
    }
    syncLifts();
  },
  blank() { S.lifts = []; }
};
