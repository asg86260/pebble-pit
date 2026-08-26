// The farm: beds out past the quarry.
//
// Nothing grows in them on its own. A farmhand stands at a bed and tends it, and
// it comes on while tended; when it is ripe it is cut and a spore rises off it.
// So the crop is the crew's attention -- the same trade the quarry asks for, in a
// different shape: the quarry spends a worker's *time away*, the farm spends a
// worker *standing still*.

import { P, WORKER, FARM_GAP, FARM_H, TEND_BASE, TEND_FLOOR, FARM_WALK, CUT_MS, TEND_STOOP, SPORE_CELL, someFind }
  from './config.js';
import { foul, throughBedMuck } from './smog.js';
import { FARM_FOUL } from './config.js';
import { S, farm } from './state.js';
import { walkY, bedCount } from './world.js';
import { mult } from './lab.js';
import { spawnSpoil } from './dust.js';

// how long one bed takes to come on, at this level of tending
export const tendMs = (lvl = S.tendLevel) =>
  Math.max(400, Math.round(Math.max(TEND_FLOOR, TEND_BASE * Math.pow(0.82, lvl)) / mult('tend')));

export const tendRate = (lvl = S.tendLevel) => 60000 / tendMs(lvl);   // beds a minute

export const bedX = i => farm.x + i * FARM_GAP;
export const bedTop = i => S.groundY - FARM_H * S.beds[i];

// The plot as it stands. Beds are broken one at a time, so this grows and the
// beds already in the ground are left exactly as they were: a bed you had
// half-tended when you paid for the next one is a bed still half-tended.
export function plantBeds() {
  const n = bedCount();
  while (S.beds.length < n) S.beds.push(0);
  while (S.bedTone.length < n) S.bedTone.push(0);
  if (S.beds.length > n) S.beds.length = n;
  if (S.bedTone.length > n) S.bedTone.length = n;
}

export function newFarmhand() {
  plantBeds();
  return {
    type: 'farmhand', goal: 'to', bed: 0, cutAt: 0, stoopAt: 0, lunge: 0,
    bob: Math.random() * Math.PI * 2,      // its own rhythm, so a row of them is not a chorus
    x: bedX(0), y: 0, carry: 0
  };
}

// the bed most worth walking to: the one furthest along that nobody else has
function pickBed(w) {
  let best = -1, most = -1;
  for (let i = 0; i < S.beds.length; i++) {
    if (S.workers.some(o => o !== w && o.type === 'farmhand' && o.bed === i)) continue;
    if (S.beds[i] > most) { most = S.beds[i]; best = i; }
  }
  return best < 0 ? w.bed : best;
}

// Cut, and the spore drops beside the bed and lies in the dust until somebody
// carries it to the pit.
// Cut, and the spore leaves from the tip of the stalk it grew on -- the same
// one that has been sitting there since it ripened, in the same tone.
function cut(i, x) {
  const tone = S.bedTone[i] || someFind(SPORE_CELL);
  spawnSpoil(x, bedTop(i) - P, tone, 'farm');
  S.beds[i] = 0;
  S.bedTone[i] = 0;
}

// one farmhand, one frame
export function stepFarmhand(w, now, dt) {
  plantBeds();
  // a bed that is not there any more -- a save from a wider plot -- is not a
  // bed anybody can stand at
  if (w.bed >= S.beds.length) { w.bed = pickBed(w); w.goal = 'to'; }
  w.y = walkY(w.x + WORKER / 2);

  if (w.goal === 'to') {
    // stand beside the bed, not on top of it, so the crop can be seen growing
    const target = bedX(w.bed) - WORKER - P * 2;
    const d = target - w.x;
    w.x += Math.sign(d) * Math.min(FARM_WALK, Math.abs(d));
    if (Math.abs(d) < 1) w.goal = 'tend';
    return;
  }

  // standing over it, bringing it on -- unless the last crop is still lying in
  // the pile behind, in which case there is no sense cutting another
  // It works the bed rather than standing to attention beside it: it stoops over
  // it on its own rhythm and shifts its weight between times. Whether the farm
  // is producing and whether it looks tended are two different questions.
  w.lunge *= 0.84;
  if (now >= w.stoopAt) {
    w.lunge = 1;
    w.stoopAt = now + TEND_STOOP * (0.75 + Math.random() * 0.6);
  }
  w.x = bedX(w.bed) - WORKER - P * 2 + Math.sin(now / 620 + w.bob) * P * 0.9;

  if (S.pileFull.farm) { w.resting = true; return; }
  w.resting = false;
  const i = w.bed;

  // bringing it on. The moment it is ripe a spore forms at the tip of the stalk
  // and stays there: it is a thing that grew, and it should be seen to have
  // grown before anybody takes it away.
  if (S.beds[i] < 1) {
    // a grower brings a bed on twice as fast
    S.beds[i] = Math.min(1, S.beds[i] + dt / tendMs() * (w.trained ? 2 : 1));
    if (S.beds[i] >= 1) {
      S.bedTone[i] = someFind(SPORE_CELL);
      w.cutAt = now + CUT_MS;
      S.dirty = true;
    }
    return;
  }

  // then it is taken off, from exactly where it grew
  if (!w.cutAt) w.cutAt = now + CUT_MS;         // walked up to one already ripe
  if (now < w.cutAt) return;
  // a smothered plot is dug out before it is picked: the muck is on top of the
  // crop, not beside it
  if (throughBedMuck(1) < 1) { w.cutAt = now + CUT_MS; return; }
  cut(i, bedX(i));
  w.farmed = (w.farmed || 0) + 1;
  foul(FARM_FOUL, bedX(i), S.groundY - P * 2);
  w.cutAt = 0;
  w.bed = pickBed(w);
  w.goal = 'to';
}
