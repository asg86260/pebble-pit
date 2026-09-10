// The gang body that builds its own station's upgrade. (wave6-sim, item 2)
//
// A quarry or farm upgrade used to be credited to the whole gang while every
// one of them went on producing: the bar filled and nothing in the yard
// changed, which is a price the player never actually pays. Now the work
// claims one body -- it stops producing, walks to the station's shed, stands
// there for the duration, and the bar advances only while it is standing
// there. When the work lands the claim clears and the body walks back to its
// post. A one-body gang simply stops producing during the upgrade; that is
// the intended bargain.
//
// The apothecary keeps the same rule, and it had the opposite defect: its work
// was credited only while a stirrer stood at the pot (`goal === 'in'`), and a
// keeper with stock on the shelf is out dealing on nearly every frame -- so
// "another pot" climbed while the first batch brewed and then froze for good.
// Claimed to the hut, the keeper stops brewing and the bar moves; the pot goes
// cold meanwhile, which is the price.
//
// The claim is `w.onBuild = site` on the body, and `w.atShed` once it has
// arrived; both are ephemeral -- bodies are not saved, they are rebuilt from
// the counts -- and both are cleared by `settle` when the body is retasked.
// `handsAt` in muster.js is what turns the standing into work credit.

import { WORKER, QUARRY_WALK } from '../config.js';
import { S } from '../state.js';
import { busyAt } from '../works.js';
import { farmShed, quarryShed } from '../world.js';
import { shack } from '../state.js';
import { apothHut } from '../apothecary.js';
import { keepTo, stepRoute, wayOver } from '../route.js';
import { TYPE } from '../jobs.js';

// Deferred with arrows: this module sits in an import cycle with world.js, so
// naming the bindings while the object is built reads them before they exist
// -- the same note BUILDING_OF in render/bars.js carries.
const SHED_OF = { [TYPE.QUARRY]: ['quarry', () => quarryShed()],
                  [TYPE.FARM]: ['farm', () => farmShed()],
                  // the rock's gang fits its picks at its own hut
                  [TYPE.ROCK]: ['shack', () => shack],
                  // and a keeper breaks the next pot's ground from the building
                  // itself: the hut is what the row is bought at and what the
                  // bar hangs over
                  [TYPE.STIR]: ['apothecary', () => apothHut()] };

// Every site a gang builds for itself this way. `handsAt` in muster.js reads
// it rather than keeping a list of its own, so a trade added here is counted
// there without a second edit.
export const SHED_SITES = new Set(Object.values(SHED_OF).map(([site]) => site));

// The site whose shed this body would build at, if its trade has one. Asked by
// stepTender: a machine's post must not outbid an open work at the station, or
// a one-body gang -- which is every gang once its machine is bought, see
// `capOf` -- tends for ever and the purchase never gets worked.
export const shedSite = w => (SHED_OF[w.type] || [null])[0];

// where the claimed body stands: the middle of the shed's front
const shedFoot = shed => shed.x + shed.w / 2 - WORKER / 2;

// Is this body standing at its shed? One place answers it, for the step below
// and for `handsAt` in muster.js, so the two cannot drift apart.
export const atShed = w => !!(w.onBuild && w.atShed);

// One frame of the errand. Returns true while the errand owns the body -- the
// caller (the job's own `work` wrapper in crew/jobs.js) skips production for
// exactly those frames.
export function stepShedwork(w) {
  const of = SHED_OF[w.type];
  if (!of) return false;
  const [site, shed] = of;

  if (!w.onBuild) {
    // A site with an open work claims one gang body -- the first arrived one
    // to ask, and only while nobody else holds the claim. A body still
    // commuting is left alone: it is not producing yet either way, and the
    // claim should go to somebody who is. So is one with a load in its hands
    // -- a stirrer out with an armful finishes the round, because doses
    // walked halfway to a body and carried off to a building site are doses
    // nobody gets.
    if (!busyAt(site) || w.goal === 'to' || w.holding) return false;
    if (S.workers.some(o => o !== w && o.onBuild === site)) return false;
    w.onBuild = site;
    w.atShed = false;
    // off whatever errand it was on: the muck claim goes back to the crew
    if (w.goal === 'muck') { w.goal = null; w.muckAt = null; }
    // ...and out from behind the door. `in` is a body at its post and out of
    // sight -- not drawn, counted as brewing -- and a body walking to the shed
    // is neither. The walk home sets `to` again when the claim clears.
    if (w.goal === 'in') w.goal = null;
    w.route = null;
  }

  // The work has landed (or been dropped): the claim clears and the body walks
  // back to its post -- `goal: 'to'` is the walk, so nothing teleports.
  if (!busyAt(w.onBuild)) {
    w.onBuild = null;
    w.atShed = false;
    w.goal = 'to';
    w.route = null;
    return false;
  }

  // Walking to the shed, wherever it started -- a route, not a straight line,
  // because a quarrier claimed on the floor of the cut leaves by the ladder.
  const to = shedFoot(shed());
  if (!keepTo(w, to, wayOver(to))) return true;
  if (stepRoute(w, QUARRY_WALK)) { w.atShed = false; return true; }
  w.route = null;
  w.atShed = true;
  return true;
}
