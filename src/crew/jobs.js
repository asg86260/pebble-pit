// One row a job, and the row is the whole of what makes that job different.
//
// Everything that is the same for everybody is a stage in step.js; everything
// a stage needs to know about a trade is answered here, never from an `if` on
// `w.type` inside the stage. Adding a job is one file in this folder plus one
// row here, and a row answers all three of `factory`, `want` and `step`: a
// job with a count and no `want` has every body of its type stood down on the
// frame it is made.
//
// The order of the rows is the order jobs are *filled* (`TYPES`): carrying
// last, so a spare body goes to a station short of one before it goes back to
// sweeping; builders just before it.
//
// `../jobs.js` is the yard's vocabulary (the `TYPE` table); this is the
// registry of what each type does.

import { S } from '../state.js';
import { TYPE } from '../jobs.js';
import { rand } from '../rng.js';
import { wayOver, feetOn } from '../route.js';

// `step`, and the three answers the stages want from a row:
//
//   work    one frame of the job, when nothing above has claimed the body.
//   shutIn  when this body is behind a door and nothing outside reaches it.
//   mess    the shovelling rule, in three parts:
//             when  is there a mess this body should be on right now
//             back  where it goes when there is not
//             late  it picks its own shovel up inside `work` rather than in
//                   the mess stage. The hauler alone.
//
// A rockhand shovels the rock, and the whole yard when its pile is full; a
// quarrier and a farmhand their own site's, from up on the surface; a janitor
// everything; a hauler the yard. A purifier and a wizard have no shovel: a
// body behind a door or aloft is not somewhere a mess reaches.
import { newRockhand, rockhandWork, rockhandMess, rockhandBack } from './rockhand.js';
import { newJanitor, janitorWork, janitorBack } from './janitor.js';
import { newHauler, haulerWork, haulerBack } from './hauler.js';
import { newBuilder, stepBuilder } from './builders.js';
import { upTop } from './body.js';
import { newQuarrier, stepQuarrier } from '../quarry.js';
import { newFarmhand, stepFarmhand } from '../farm.js';
import { newPurifier, stepPurifier } from '../scrubhouse.js';
import { newStirrer, stepStirrer } from '../apothecary.js';
import { newWizard, stepWizard } from '../wizard.js';
import { quarryMuck, plotMuck } from '../smog.js';

export const JOBS = {
  [TYPE.ROCK]: {
    factory: newRockhand,
    want: () => S.rockhands,
    step: {
      // A pick on the go is fitted at the shack by a spare hand, not by one of
      // the gang (`shack` in SITE_JOB).
      work: (w, c) => rockhandWork(w, c),
      mess: { when: w => rockhandMess(w), back: rockhandBack }
    }
  },

  // A mess on its own site comes before the station: what is lying on the
  // quarry or the plots is in the way of the body working it. The rest of the
  // yard they leave to the haulers.
  [TYPE.QUARRY]: {
    factory: newQuarrier,
    want: () => S.quarriers,
    step: {
      work: (w, c) => stepQuarrier(w, c.now, c),
      mess: {
        when: w => upTop(w) && (quarryMuck() > 0 || S.pileFull.quarry),
        // `to` is the walk back to the station, so nobody is put back.
        back: w => { if (w.goal === 'muck') { w.goal = 'to'; w.muckAt = null; } }
      }
    }
  },

  [TYPE.FARM]: {
    factory: newFarmhand,
    want: () => S.farmhands,
    step: {
      work: (w, c) => stepFarmhand(w, c.now, c.dt, c),
      mess: {
        when: w => upTop(w) && (plotMuck() > 0 || S.pileFull.farm),
        back: w => { if (w.goal === 'muck') { w.goal = 'to'; w.muckAt = null; } }
      }
    }
  },

  // A purifier is behind a door, and a balloon is a door too: a rider in a
  // basket several hundred pixels up is taken back by every rule below (the
  // fall, the lip, the muck errand, the re-plant) unless it is shut in.
  [TYPE.PURIFY]: {
    factory: newPurifier,
    want: () => S.purifiers,
    step: { work: stepPurifier, shutIn: w => w.goal === 'in' || w.goal === 'aloft' }
  },

  // A stirrer out dealing a dose belongs to the yard again; `shutIn` only
  // while it is through the door.
  [TYPE.STIR]: {
    factory: newStirrer,
    want: () => S.stirrers,
    step: { work: w => stepStirrer(w), shutIn: w => w.goal === 'in' }
  },

  [TYPE.JANITOR]: {
    factory: newJanitor,
    want: () => S.janitors,
    step: {
      work: janitorWork,
      mess: { when: () => true, back: janitorBack }
    }
  },

  // The one job that is not on the ground: no rock to dodge, no lip, no muck.
  [TYPE.WIZARD]: {
    factory: newWizard,
    want: () => S.wizards,
    step: { work: (w, c) => stepWizard(w, c.now) }
  },

  [TYPE.BUILD]: {
    factory: newBuilder,
    want: () => S.builders,
    step: { work: stepBuilder }
  },

  [TYPE.HAUL]: {
    factory: newHauler,
    want: () => S.haulers,
    step: {
      work: haulerWork,
      mess: { late: true, when: () => true, back: haulerBack }
    }
  }
};

// The order jobs are filled in, which is the order the rows are written in.
export const TYPES = Object.keys(JOBS);

// Carrying is the fallback as well as a row: a body with no station fetches
// dust.
export const jobOf = w => (JOBS[w.type] || JOBS[TYPE.HAUL]).step;

// How many of each kind the yard is asking for, read fresh off the counts.
export const wanted = () => {
  const want = {};
  for (const type of TYPES) want[type] = JOBS[type].want();
  return want;
};

// Every body gets a rhythm of its own (`ph`, `sp`), handed out here where
// every body is made: a factory that forgets them multiplies a position by
// the sine of `undefined`, and a body at NaN is a body nowhere. The `?.()` is
// for a save written by a build that had a trade this one does not; an old
// save should cost one body, not the whole load.
export const FACTORY = type => {
  const made = {
    ph: rand() * Math.PI * 2,
    sp: 0.5 + rand() * 0.9,
    ...(JOBS[type]?.factory() || {})
  };
  // And its feet on the ground under it, asked here once: a factory that
  // leaves the climb to bring a body down from `y: 0` sinks it through the
  // sky for five seconds.
  if (Number.isFinite(made.x)) made.y = feetOn(wayOver(made.x), made.x);
  return made;
};
