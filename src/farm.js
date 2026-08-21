// The farm: beds out past the cave.
//
// Nothing grows in them on its own. A farmhand stands at a bed and tends it, and
// it comes on while tended; when it is ripe it is cut and a spore rises off it.
// So the crop is the crew's attention -- the same trade the cave asks for, in a
// different shape: the cave spends a worker's *time away*, the farm spends a
// worker *standing still*.

import { P, WORKER, FARM_BEDS, FARM_GAP, FARM_H, TEND_BASE, TEND_FLOOR, FARM_WALK, SPORE_CELL }
  from './config.js';
import { S, farm } from './state.js';
import { standOn, pileOf } from './world.js';
import { mult } from './lab.js';
import { spawnChip, aim } from './dust.js';

// how long one bed takes to come on, at this level of tending
export const tendMs = (lvl = S.tendLevel) =>
  Math.max(400, Math.round(Math.max(TEND_FLOOR, TEND_BASE * Math.pow(0.82, lvl)) / mult('tend')));

export const tendRate = (lvl = S.tendLevel) => 60000 / tendMs(lvl);   // beds a minute

export const bedX = i => farm.x + i * FARM_GAP;
export const bedTop = i => S.groundY - FARM_H * S.beds[i];

export function plantBeds() {
  if (S.beds.length !== FARM_BEDS) S.beds = new Array(FARM_BEDS).fill(0);
}

export function newFarmhand() {
  plantBeds();
  return { type: 'farmhand', goal: 'to', bed: 0, x: bedX(0), y: 0, carry: 0 };
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
function cut(i, x) {
  S.beds[i] = 0;
  const p = pileOf('farm');
  const y = S.groundY - FARM_H;
  const land = p ? p.from + P * 2 + Math.random() * Math.max(P, (p.to - p.from) * 0.5) : x + P * 6;
  const v = aim(x, y, land, P);
  spawnChip(x, y, v.vx, v.vy, SPORE_CELL, land);
}

// one farmhand, one frame
export function stepFarmhand(w, now, dt) {
  plantBeds();
  w.y = standOn(S.groundY);

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
  if (S.pileFull.farm) return;
  S.beds[w.bed] = Math.min(1, S.beds[w.bed] + dt / tendMs());
  if (S.beds[w.bed] >= 1) {
    cut(w.bed, bedX(w.bed));
    w.bed = pickBed(w);
    w.goal = 'to';
  }
}
