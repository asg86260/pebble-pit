// The air, and what it costs.
//
// Every grain taken out of the ground is a mote in the sky for the whole of
// its life: it climbs from the swing, settles in the band, drifts, clumps, and
// comes down one at a time as muck or leaves through the scrubbing house. There
// is no cloud sprite; the sky is the dust you put there.
//
// The parts, one file each:
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
import { RAIN_FALL, PUFF_UP, SMOG_PER_MOTE } from './config.js';
import { DROPS, GOING, SKY, bandLow, bandTop, climbing, clogged, fanPull,
         outletMuck, raining, scrubRate, scrubbing } from './smog/band.js';
import { foul, look, reckon, skyMote, stepPuffs } from './smog/vents.js';
import { enter } from './smog/sky.js';

// What the band is made of, by kind, for the save. See `skyFromSave`.
export function skyKindCounts() {
  const kinds = {};
  for (const m of SKY) { const k = m.kind || 'dust'; kinds[k] = (kinds[k] || 0) + 1; }
  return kinds;
}
import { stirSmoke } from './smog/draught.js';
import { clearSky, cloudR, fillSky, moteX, moteY, place, skyFromSave as rebuildSky } from './smog/sky.js';
import { DRAUGHT, breathe, pull } from './smog/house.js';
import { pullCraft } from './smog/craft.js';
import { breaks, dryTime, forceStrike, markStorm, pour, rainOdds, settled, stepBolt, stepDrops, stepEmbers, EMBERS,
         stepGoing, stepStorm } from './smog/rain.js';
import { MESS, MUCK_ELBOW, buried, cleanSpotNear, colAt, dropMuckAt, messAt,
         muckAtCol, muckCols, muckFloor, muckFor, muckLeft, nearestMuck,
         plotMuck, poopCols, poopLeft, quarryMuck, retally, rockMuck, slumpMess,
         sweepMuckAt, throughPlotMuck, throughQuarryMuck, throughRockMuck,
         workSpot, yardMuck, yardMuckFor } from './smog/layer.js';
import { airReadout, airTrend, clumpiness, drawnIn, sampleAir, seedSmog,
         skyBins, smogReport } from './smog/books.js';

// A save coming back. The band is rebuilt out of the haze (sky.js); a storm
// brewing or pouring at the save marks the rebuilt sky as its own, the same
// rule the roll applies, or the shower finds no mote it may drop and calls
// itself over.
export function skyFromSave(kinds = null, drops = null, puffs = null) {
  // The haze counts the plume too, so what the plume will put back is taken
  // off before the fill and reckoned again once it is up.
  const climbing = Array.isArray(puffs) ? puffs.filter(q => Array.isArray(q) && Number.isFinite(q[0]) && Number.isFinite(q[1])) : [];
  S.haze = Math.max(0, S.haze - climbing.length * SMOG_PER_MOTE);
  rebuildSky();
  for (const q of climbing) {
    const p = skyMote(q[0], Number.isFinite(q[4]) ? q[4] : q[1], q[2] || 'dust');
    p.up = true;
    p.y = q[1];
    p.vy = Number.isFinite(q[3]) && q[3] < 0 ? q[3] : -PUFF_UP;
    p.lean = Number.isFinite(q[5]) ? q[5] : 0;
    p.fade = Number.isFinite(q[6]) ? q[6] : 0;
    p.age = Number.isFinite(q[7]) ? q[7] : 0;
    enter(p);
  }
  reckon();
  // The rain already falling, where it was. See `drops` in persist.js.
  if (Array.isArray(drops))
    for (const d of drops)
      if (Array.isArray(d) && Number.isFinite(d[0]) && Number.isFinite(d[1]))
        DROPS.push({ x: d[0], y: d[1], vy: Number.isFinite(d[2]) ? d[2] : RAIN_FALL });
  // The rebuild makes dust; the saved share of soot, spore and the rest is
  // relabelled onto it, look and all, so the readout of what dirtied the sky
  // survives a refresh.
  if (kinds && SKY.length) {
    const total = Object.values(kinds).reduce((n, v) => n + (+v || 0), 0);
    if (total > 0) {
      let i = 0;
      for (const [kind, n] of Object.entries(kinds)) {
        if (kind === 'dust') continue;
        const want = Math.round(SKY.length * (+n || 0) / total);
        for (let k = 0; k < want && i < SKY.length; k++, i++) Object.assign(SKY[i], { kind }, look(kind));
      }
    }
  }
  if (!(S.raining || S.stormFor >= 0)) return;
  let marked = 0;
  for (const m of SKY) if (settled(m)) { m.rain = S.rains; marked++; }
  markStorm(marked);
}

export { SKY, DROPS, GOING, bandTop, bandLow, raining, clogged, scrubbing,
         outletMuck, fanPull, scrubRate, climbing,
         foul, stirSmoke,
         moteX, moteY, clearSky, fillSky, cloudR,
         DRAUGHT, rainOdds, dryTime, forceStrike, EMBERS,
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
  // The house takes motes and nothing else docks the number for the fan: that
  // is the same dirt subtracted twice.
  if (scrubbing()) { pull(secs); breathe(secs); }
  else { DRAUGHT.length = 0; }
  // After the house, so a mote in the throat is the house's rather than
  // fought over.
  pullCraft(secs);
  // Before the rain roll, which has to be about what is actually overhead.
  reckon();
  // A roll that succeeds starts a brew, not a shower (`stepStorm`). The
  // marking happens at the roll: everything settled now belongs to this
  // storm, and what arrives after does not and stays up when it stops.
  if (breaks(secs)) {
    S.stormFor = 0; S.rains++;
    // The first rain is what shows you the sky's reading; nothing else sets
    // `seenAir`, and the scrubbing house is gated on it.
    if (!S.seenAir) { S.seenAir = true; }
    let marked = 0;
    for (const m of SKY) if (settled(m)) { m.rain = S.rains; marked++; }
    markStorm(marked);
  }
  stepStorm(secs);
  if (raining()) pour(secs);
  place(secs);
  stepGoing(secs);
  stepDrops();
  stepBolt(secs);
  stepEmbers(secs);
}
