// The air, and what it costs.
//
// Every grain taken out of the ground is a mote in the sky for the whole of
// its life: it climbs from the swing, settles in the band, drifts, clumps, and
// comes down one at a time as muck or leaves through the air filter. There
// is no cloud sprite; the sky is the dust you put there.
//
// The parts, one file each:
//
//   band.js     the lists everything else works on, and where the sky sits
//   vents.js    what goes up, and what a speck looks like
//   draught.js  a hand through the smoke
//   sky.js      how the sky is arranged: slots, sway, creep, settling
//   house.js    the air filter pulling on the band
//   craft.js    what the balloons take
//   rain.js     the shower, and whether one breaks
//   layer.js    the muck it leaves on the ground, and shifting it
//   books.js    what the boards are told, and seeding a run
//
// This file is the door, and the one frame at the bottom: the order those parts
// run in, which is the only thing about them that is not local to one of them.

import { S } from './state.js';
import { RAIN_FALL, PUFF_UP, SMOG_PER_MOTE } from './config.js';
import { CLODS, DROPS, GOING, SKY, STACK, bandLow, bandTop, climbing, clogged, fanPull, murk,
         outletMuck, raining, filterRate, filtering } from './smog/band.js';
import { foul, look, puffStack, reckon, skyMote, stepPuffs, stepStack } from './smog/vents.js';
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
import { pullCraft, stepClods } from './smog/craft.js';
import { dryTime, forceStrike, LEDGER, markSky, nextDue, pinHeft, pour, remarkSky, rollHeft, stepBolt, stepDrops, stepEmbers, EMBERS,
         stepFront, stepGoing, stepStorm } from './smog/rain.js';
import { MESS, MUCK_ELBOW, buried, cleanSpotNear, colAt, dropMuckAt, messAt,
         muckAtCol, muckCols, muckFloor, muckFor, muckLeft, nearestMuck,
         plotMuck, poopCols, poopLeft, quarryMuck, retally, rockMuck, slumpMess,
         sweepMuckAt, throughPlotMuck, throughQuarryMuck, throughRockMuck,
         workSpot, yardMuck, yardMuckFor } from './smog/layer.js';
import { airReadout, airTrend, clumpiness, drawnIn, sampleAir, seedSmog,
         skyBins, smogReport } from './smog/books.js';

// A save coming back. The band is rebuilt out of the haze (sky.js); a storm
// brewing or pouring at the save marks the rebuilt sky as its own by the same
// share the roll took, or the shower finds no mote it may drop and pours
// clean.
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
  // The rain already falling, where it was. A drop saved before the water
  // came has no fourth field and was sky, so it is dirty.
  if (Array.isArray(drops))
    for (const d of drops)
      if (Array.isArray(d) && Number.isFinite(d[0]) && Number.isFinite(d[1]))
        DROPS.push({ x: d[0], y: d[1], vy: Number.isFinite(d[2]) ? d[2] : RAIN_FALL,
                     dirt: d.length < 4 || !!d[3] });
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
  if (S.raining || S.stormFor >= 0) remarkSky();
}

// The sky, on the save (persist.js, `SAVERS`): the haze as a number and
// what it is made of, the rain already falling, and every speck still on its
// way up. Counts, not motes: the band itself is rebuilt on the way back in.
export const SAVE = {
  fields: ['haze', 'poop', 'skyKinds', 'drops', 'puffs', 'clods'],
  write(out) {
    // Rounded: a fraction of a mote is not worth the characters.
    out.haze = Math.round(S.haze);
    // What the haze is made of, by kind, or the band rebuilt all as dust
    // tells the readout nothing but hand work fouled it.
    out.skyKinds = skyKindCounts();
    // The drops already falling are the muck the shower was about to leave.
    out.drops = DROPS.map(d => [Math.round(d.x), Math.round(d.y), +d.vy.toFixed(2), d.dirt ? 1 : 0]);
    // Every speck still on its way up, with its climb.
    out.puffs = SKY.filter(m => m.up).map(m => [Math.round(m.x), Math.round(m.y), m.kind || 'dust', +(m.vy || 0).toFixed(3),
                                             Math.round(m.y0 ?? m.y), +(m.lean || 0).toFixed(2), +(m.fade ?? 1).toFixed(2), Math.round(m.age || 0)]);
    out.poop = S.poop || [];
    // And the filter's loads still falling off the spout: each is a load of
    // muck the heap is owed.
    out.clods = CLODS.map(k => [Math.round(k.x), Math.round(k.y), +k.vy.toFixed(2), k.n, +(k.vx || 0).toFixed(2)]);
  },
  read(s) {
    S.haze = s.haze || 0;
    S.filterBank = 0;
    // The weather in flight comes back with the sky (`raining`, `rainFor`,
    // `stormFor` are plain saved fields); the bolt is a flash of a few
    // frames and is not.
    S.bolt = null;
    S.poop = Array.isArray(s.poop) ? s.poop.slice() : [];
    // The sky itself, not only the number for it: `settleCount` only ever
    // takes motes away in play, so a haze read back over an empty band
    // stays wrong for an hour. Safe here because the world is laid out
    // before the save is read (main.js), so there is a width to spread it
    // across.
    skyFromSave(s.skyKinds, s.drops, s.puffs);
    CLODS.length = 0;
    for (const k of Array.isArray(s.clods) ? s.clods : [])
      if (Array.isArray(k) && Number.isFinite(k[0]) && Number.isFinite(k[1]))
        CLODS.push({ x: k[0], y: k[1], vy: Number.isFinite(k[2]) ? k[2] : 0, n: +k[3] || 1,
                     vx: Number.isFinite(k[4]) ? k[4] : 0 });
  },
  // A new yard's sky is seeded by `reset` itself: the fresh-yard arm of
  // `restore` runs on a page whose layout has already seeded one.
  blank() {}
};

export { murk, SKY, DROPS, CLODS, GOING, STACK, bandTop, bandLow, raining, clogged, filtering,
         outletMuck, fanPull, filterRate, climbing,
         foul, puffStack, stirSmoke,
         moteX, moteY, clearSky, fillSky, cloudR,
         DRAUGHT, dryTime, forceStrike, EMBERS, LEDGER, pinHeft,
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
  // Before the house takes anything this frame, so a load made this frame is
  // in the air for at least one frame even when the heap is up at the lip.
  stepClods();
  // The house takes motes and nothing else docks the number for the fan: that
  // is the same dirt subtracted twice.
  if (filtering()) { pull(secs); breathe(secs); }
  else { DRAUGHT.length = 0; }
  // After the house, so a mote in the throat is the house's rather than
  // fought over.
  pullCraft(secs);
  // Before the front, whose marking has to be about what is actually overhead.
  reckon();
  // A front that is due starts a brew, not a shower (`stepStorm`), and rolls
  // the next one. The marking happens at the roll: the front's share of what
  // is settled now belongs to this storm, and what arrives after does not and
  // stays up when it stops. The first front of a save is a full storm, so the
  // lightning is seen early over a sky too clean to mark.
  if (stepFront(secs)) {
    S.stormFor = 0; S.rains++;
    S.stormHeft = rollHeft();
    S.rainDue = nextDue();
    // The first rain is what shows you the sky's reading; nothing else sets
    // `seenAir`, and the air filter is gated on it.
    if (!S.seenAir) { S.seenAir = true; }
    markSky();
  }
  stepStorm(secs);
  if (raining()) pour(secs);
  place(secs);
  // Counted again after the shower has taken its motes, or the number stands
  // a frame's worth of drops over the sky between frames -- which is where
  // the boards and the checks read it.
  if (raining()) reckon();
  stepGoing(secs);
  stepStack(secs);
  stepDrops();
  stepBolt(secs);
  stepEmbers(secs);
}
