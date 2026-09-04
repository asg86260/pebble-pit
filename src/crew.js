// The crew: who they are, where they stand and what they do with their hands.
//
// This file is the barrel. The crew was one file of two thousand seven hundred
// lines whose own section comments already said where the seams were, and it is
// now one file per seam under `src/crew/`; every name it used to export is
// re-exported from here, so the dozen modules that import from `crew.js` are
// unchanged and nothing outside this folder has to know the shape of the split.
//
// What lives where:
//
//   jobs.js      the registry -- one row a job, holding its factory, how many
//                the yard wants, and what it does with a frame. **Adding a job
//                is one file in here plus one row there**, and that is the whole
//                point of the folder.
//   body.js      what is true of every body: where its feet go, what stops it,
//                whether it is out in the yard at all.
//   step.js      the per-frame body step -- the STAGES list and `updateWorkers`.
//   commute.js   settling onto a job, the kit walk, and one frame of getting
//                somewhere.
//   muster.js    the crew kept to the counts, and who is actually at a site.
//   hole.js      down the hole and down the cut, and the room a trip books.
//   shovel.js    going and shovelling, which several kinds of body do.
//   falls.js     hats and falls, the two things gravity does to a body.
//   idle.js      the yard at rest -- where somebody with nothing to do wanders.
//   nature.js    now and then a body has to stop.
//   rockhand.js  the gang on the hill.
//   janitor.js   the mess, and whoever is on it.
//   hauler.js    carrying, which is the job with no station.
//
// and the five that were already here -- dance.js, kitwalk.js, pointer.js,
// records.js, tenders.js -- are untouched by the split.
//
// `muster.js` is imported for its side effect as well as its exports: it is
// where `setHands` and `setStaff` are registered with works.js, and those have
// to run when anything imports the crew at all.
import './crew/muster.js';

export { newRecord, KEEPS, keepOf, wearRecord, outOfYard, stepRecords, mainlyAt } from './crew/records.js';
export { stepMachines } from './crew/tenders.js';
export { workerAt, lift, lifted, drop, shakeHeld } from './crew/pointer.js';
export { kitFree } from './crew/kitwalk.js';

export { stand, duck, hireSpot, atHome, homeCount, upTop } from './crew/body.js';
export { FACTORY } from './crew/jobs.js';
export { findPeak, nearestInBand, elbowed } from './crew/rockhand.js';
export { stepBuilder } from './crew/builders.js';
export { stationX, nextLeg, errand, retask } from './crew/commute.js';
export { syncWorkers, wearKitOnLoad } from './crew/muster.js';
export { stepHat } from './crew/falls.js';
export { pitFree, unbook } from './crew/hole.js';
export { anyBackedUp, topGrain } from './crew/hauler.js';
export { updateWorkers } from './crew/step.js';

// The pace a body crosses the yard at when it has been put on something else.
// Its own legs, hands free. Lives in upgrades.js now so the stations can pace
// their own long trips with it; re-exported here for everybody that always
// imported it from the crew.
export { commutePace } from './upgrades.js';
