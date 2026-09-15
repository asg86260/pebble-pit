// One row a job, and the row is the whole of what makes that job different.
//
// Everything that is the same for everybody is a stage in step.js, and
// everything a stage needs to know about a particular trade is answered from
// here rather than from an `if` on `w.type` inside the stage. It is the same
// shape as `LOOK` in render.js and `MOVES` in the dance: **adding a job is one
// file in this folder plus one row here**, and no row can quietly forget to
// answer.
//
// Three questions used to be asked of a job in three different places, and each
// of them was a list somebody had to remember to add to:
//
//   `MAKE`        how a body of this kind is made from nothing  -> `factory`
//   `want`        how many of them the yard is asking for       -> `want`
//   `JOBS`        what one of them does with a frame            -> `step`
//
// A job missing from the middle one had a count on the boards and no bodies in
// the yard: `room[w.type]` came back undefined, every body of that type was
// stood down on the frame it was made, and the station ran on the number alone
// with nobody ever walking to it. It cannot be missing now, because there is one
// row and the row answers all three.
//
// The order of the rows is the order jobs are *filled* -- see `TYPES` at the
// bottom. Carrying comes last so that a spare body goes to a station that is
// short of one before it goes back to sweeping the yard; builders come just
// before it, like every other job, so a spare body goes to the thing the yard is
// in the middle of building before it goes back to sweeping.
//
// Note the name: `../jobs.js` is the yard's vocabulary (the `TYPE` table), and
// this is the registry of what each of those types actually does. Two different
// things with the same word on them, so the import below is spelt out.

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
//             late  it picks its own shovel up, inside `work`, rather than in
//                   the mess stage. The hauler alone, and see the note there.
//
// The mess rules, said once and in one place: a rockhand shovels what is lying on
// the rock, and the whole yard when its pile is full and there is nothing else
// in the world it could be doing; a quarrier and a farmhand shovel their own
// site's, and only from up on the surface; a janitor shovels everything,
// everywhere, always, because that is the whole of the job; a hauler shovels the
// yard. A scholar, a purifier and a wizard have no shovel at all -- a body behind
// a door or four hundred feet up is not somewhere a mess reaches.
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
      // the gang -- see `shack` in SITE_JOB. The rock's gang swings throughout.
      work: (w, c) => rockhandWork(w, c),
      mess: { when: w => rockhandMess(w), back: rockhandBack }
    }
  },

  // A mess on its own site comes before the station, the same as it does for the
  // gang on the rock: what is lying on the quarry or on the plots is in the way
  // of the body working it. This used to run only when their own pile was full
  // -- their branches end in `continue`, above the shovelling -- so a working
  // quarry and a working farm meant two bodies walking over the muck all day,
  // and the layer on the quarry and the plots could only be dug and tended
  // through, a cell at a time, by whoever happened to be there.
  //
  // The rest of the yard they leave to the haulers.
  [TYPE.QUARRY]: {
    factory: newQuarrier,
    want: () => S.quarriers,
    step: {
      work: (w, c) => stepQuarrier(w, c.now, c),
      mess: {
        when: w => upTop(w) && (quarryMuck() > 0 || S.pileFull.quarry),
        // and back to the station when the mess is gone or the pile has been
        // cleared: `to` is the walk to it, so nobody is put back.
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

  // The scholar is gone with the lab. Research is a build now, done by builders
  // at the construction bench, because works.js always drove the lab and the
  // yard through one engine and the lab was a second name for it. See DESIGN.md,
  // "The lab is deleted".

  // A purifier is behind a door, and a balloon is a door too.
  //
  // The house's body has always been out of the yard's reach once it is through
  // the door -- it simply had no `shutIn` to say so, because `goal === 'in'`
  // also means "not drawn" and nothing outside was reaching for it anyway. A
  // body in a *craft* is a different case and needs saying out loud: it is
  // standing in a basket several hundred pixels up, and every rule in the
  // pipeline below -- the fall, the lip, the muck errand, the re-plant on to the
  // ground it is supposedly standing on -- would take it back. What that looked
  // like was a balloon that rose a few pixels, lost its rider to the yard, sank,
  // and picked it up again: the rider was aloft on six frames in a hundred.
  //
  // The same sentence the wizard's entry makes, for the same reason: nothing in
  // the pipeline applies to a body that is not on the ground.
  [TYPE.PURIFY]: {
    factory: newPurifier,
    want: () => S.purifiers,
    step: { work: stepPurifier, shutIn: w => w.goal === 'in' || w.goal === 'aloft' }
  },

  // A stirrer at the pot is behind a door like a scholar; a stirrer out dealing a
  // dose is a body walking a load and belongs to the yard again. `shutIn` only
  // while it is through the door.
  //
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

  // The one job that is not on the ground. Nothing else in the pipeline applies
  // to a body in the sky -- there is no rock to dodge up there, no lip to stop
  // at and no muck to shovel -- so it is taken out of the yard's rules entirely,
  // the same way a body down the hole is.
  [TYPE.WIZARD]: {
    factory: newWizard,
    want: () => S.wizards,
    step: { work: (w, c) => stepWizard(w, c.now) }
  },

  // A builder walks to whatever is being put up and stands there. It shovels
  // like anybody else: a build is not so urgent that the mess can pile up round
  // it, and the mess is the one errand every body in this yard answers.
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

// Carrying is the fallback as well as a row: a body of a type nobody has written
// a row for is a body with no station, and a body with no station fetches dust.
export const jobOf = w => (JOBS[w.type] || JOBS[TYPE.HAUL]).step;

// How many of each kind the yard is asking for, read fresh off the counts. It is
// a function per row rather than a field on `S`, so a row cannot go stale: the
// number is the one the roster holds this frame.
export const wanted = () => {
  const want = {};
  for (const type of TYPES) want[type] = JOBS[type].want();
  return want;
};

// Every body gets a rhythm of its own, whatever trade it is.
//
// `ph` and `sp` are where a body is in its own sway and how fast it sways, and
// they are what stop a gang reading as one animation played five times. Some of
// the factories set them and some did not, which was fine while only the trades
// that sway used them -- and then the janitor was given something to do while it
// waits, read a phase nobody had given it, and multiplied its position by the
// sine of `undefined`. A body at NaN is a body nowhere: it vanishes, and asking
// the view to follow it takes you to an empty white corner of the world.
//
// So they are handed out here, where every body in the game is made, rather than
// eight times over in eight factories that each have to remember.
// The `?.()` is for a save written by a build that had a trade this one does not.
// `restoreCrew` guards that case -- `if (!made.type) continue;` -- but it guards
// it *after* calling this, and spreading the result of calling `undefined` throws
// before the guard is ever reached. An old save should cost you one body, not the
// whole load.
export const FACTORY = type => {
  const made = {
    ph: rand() * Math.PI * 2,
    sp: 0.5 + rand() * 0.9,
    ...(JOBS[type]?.factory() || {})
  };
  // And its feet on the ground under it, for the same reason. Four of the
  // factories put a body at `y: 0` and one at the middle of the rock, and left
  // the climb to bring it down: a cell a frame, so a farmhand made at the top
  // of the world sank for five seconds through the sky to the plots. In play a
  // fresh body is nearly always a carter, which stood itself right; a save
  // missing a body, a dev hook and a scene did not, and the "nothing floats"
  // rule (verify.js, rule 9) named every one. So the ground is asked here, once,
  // and no factory has to know what is under the spot it picked.
  if (Number.isFinite(made.x)) made.y = feetOn(wayOver(made.x), made.x);
  return made;
};
