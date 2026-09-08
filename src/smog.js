// The air, and what it costs.
//
// Every grain taken out of the ground puts a mote of it into the sky, and that
// mote is a real thing for the whole of its life. It comes off the swing where
// the swing happened, climbs, reaches the band and stays up there. It drifts. It
// finds the other motes and clumps with them, so the sky thickens into banks
// that were never drawn as banks -- they are only where the motes ended up. When
// there are enough of them they start coming down, one at a time, and land as
// muck. The house pulls them out of the sky one at a time as well.
//
// There is no cloud sprite in this file and no cloud shape. The sky is the dust
// you put there and it looks like whatever that dust has done. That is the only
// honest version: everything else in this yard is grains you can count, and a
// painted cloud over the top would be the one thing in the game that was a
// picture of something rather than the thing itself. It is also the only version
// that has no shelves or right angles in it, because nobody drew any.
//
// The answer to it is a building with somebody in it. An empty scrubbing house is
// a shed. Put a body in it and motes start leaving the sky for its intake -- the
// same motes, on a different errand. More bodies pull harder. The cost of clean
// air is bodies not on the rock, and the recycler turns what they catch back into
// dust on the ground.
//
// The file is a directory now, one part per section it used to carry:
//
//   band.js     the lists everything else works on, and where the sky sits
//   vents.js    what goes up, and what a speck looks like
//   draught.js  a hand through the smoke
//   sky.js      how the sky is arranged: slots, sway, creep, settling
//   house.js    the scrubbing house pulling on the band
//   craft.js    what the balloons take
//   rain.js     the shower, and whether one breaks
//   layer.js    the muck it leaves on the ground, and shifting it
//   books.js    what the boards are told, and seeding a run
//
// This file is the door, and the one frame at the bottom: the order those parts
// run in, which is the only thing about them that is not local to one of them.

import { S } from './state.js';
import { DROPS, GOING, SKY, bandLow, bandTop, climbing, clogged, fanPull,
         outletMuck, raining, scrubRate, scrubbing } from './smog/band.js';
import { foul, reckon, stepPuffs } from './smog/vents.js';
import { stirSmoke } from './smog/draught.js';
import { clearSky, cloudR, fillSky, moteX, moteY, place, skyFromSave } from './smog/sky.js';
import { DRAUGHT, breathe, pull } from './smog/house.js';
import { pullCraft } from './smog/craft.js';
import { breaks, dryTime, markStorm, pour, rainOdds, settled, stepDrops,
         stepGoing, stepStorm } from './smog/rain.js';
import { MESS, MUCK_ELBOW, buried, cleanSpotNear, colAt, dropMuckAt, messAt,
         muckAtCol, muckCols, muckFloor, muckFor, muckLeft, nearestMuck,
         plotMuck, poopCols, poopLeft, quarryMuck, retally, rockMuck, slumpMess,
         sweepMuckAt, throughPlotMuck, throughQuarryMuck, throughRockMuck,
         workSpot, yardMuck, yardMuckFor } from './smog/layer.js';
import { airReadout, airTrend, clumpiness, drawnIn, sampleAir, seedSmog,
         skyBins, smogReport } from './smog/books.js';

export { SKY, DROPS, GOING, bandTop, bandLow, raining, clogged, scrubbing,
         outletMuck, fanPull, scrubRate, climbing,
         foul, stirSmoke,
         moteX, moteY, clearSky, fillSky, skyFromSave, cloudR,
         DRAUGHT, rainOdds, dryTime,
         MESS, MUCK_ELBOW, colAt, messAt, muckCols, poopCols, muckFloor,
         muckAtCol, muckLeft, poopLeft, muckFor, yardMuck, yardMuckFor,
         nearestMuck, rockMuck, quarryMuck, plotMuck, buried, retally,
         throughRockMuck, throughQuarryMuck, throughPlotMuck, cleanSpotNear,
         workSpot, dropMuckAt, slumpMess, sweepMuckAt,
         sampleAir, airTrend, airReadout, clumpiness, skyBins, drawnIn,
         smogReport, seedSmog };

// --- one frame ---------------------------------------------------------------------
export function stepSmog(dt) {
  const secs = dt / 1000;
  stepPuffs(secs);
  // The draught, or the sky letting go of it again. The house takes motes; it
  // used to take motes *and* dock the number by what the fan was worth, which is
  // the same dirt subtracted twice.
  if (scrubbing()) { pull(secs); breathe(secs); }
  else { DRAUGHT.length = 0; }
  // The craft take their own, wherever they happen to be. After the house, so a
  // mote in the throat is the house's rather than being fought over.
  pullCraft(secs);
  // The number is worked out from the sky before anything asks whether it should
  // be raining, because the answer to that question has to be about what is
  // actually overhead.
  reckon();
  // A roll that succeeds starts a *brew*, not a shower (wave6-sky, item 5):
  // the sky darkens for STORM_BREW_S and only then does the drizzle begin --
  // see `stepStorm`. The marking happens now, at the roll: everything settled
  // up there right now belongs to this storm. Anything that arrives after this
  // frame does not, and will still be there when it stops -- which is what a
  // sky that keeps being dirtied ought to look like.
  if (breaks(secs)) {
    S.stormFor = 0; S.rains++;
    // The first rain is what shows you the sky's reading.
    //
    // It used to be bought, at the lab, as "watch the sky" -- and when the lab
    // was deleted that row went with it and nothing set `seenAir` at all, which
    // left the scrubbing house gated on a flag no longer reachable: an entire
    // building, and the whole pollution arc behind it, unreachable in a real
    // game. See DESIGN.md, "The lab is deleted".
    //
    // Told rather than sold, which is the rule every currency on these boards
    // already goes by: nothing is named until you have met one. Rain on your
    // head is meeting it -- you do not need to have paid somebody to notice
    // that the sky has just emptied itself on the yard.
    if (!S.seenAir) { S.seenAir = true; S.dirty = true; }
    let marked = 0;
    for (const m of SKY) if (settled(m)) { m.rain = S.rains; marked++; }
    markStorm(marked);
  }
  stepStorm(secs);
  if (raining()) pour(secs);
  place(secs);
  stepGoing(secs);
  stepDrops();
}
