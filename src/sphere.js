// The sphere: the tower's machine, a shell of plates the wizards pour round
// the star. Closed, it catches the star's light and lets it fall as sparks, so
// the star stops being a thing you take apart and becomes a thing you keep.
// See DESIGN.md, "The sphere: the tower's machine".
//
// It is a machine like the other four (machines.js) with two differences, both
// because nobody on the ground can reach it: it is poured by the ring after it
// is bought (`standing`), and its one tender works it from the air (`aloft`).

import { P, SPHERE_WORK, SPHERE_OUT, SPHERE_PANEL, SPHERE_FLARE_MS, METEOR_CORE,
         METEOR_SPARKS, METEOR_CORE_SPARKS, SPARK_CELL, SUMMON_SHAKE, someFind } from './config.js';
import { S, sky, tower } from './state.js';
import { now } from './clock.js';
import { machine, defineMachine, tuneOf } from './machines.js';
import { meteorAlive } from './meteor.js';
import { spawnChip, bell } from './dust.js';
import { shakeView } from './world.js';
import { rand } from './rng.js';
import { sfx } from './audio.js';
import { JOB, TYPE } from './jobs.js';
import { wizMs, wizBite, underMeteor } from './wizard.js';

export const sphereBought = () => !!machine('sphere')?.bought;
export const pouredAt = () => Math.max(0, Math.min(1, S.spherePour || 0));
export const sphereUp = () => sphereBought() && pouredAt() >= 1;
// Poured round a star, so an empty sky is summoned first and the pour waits.
export const sphereRising = () => sphereBought() && !sphereUp() && meteorAlive();

// --- the shell's geometry --------------------------------------------------------
// One ring of cells at `SPHERE_OUT` cells past the star's edge, cut into panels
// of `SPHERE_PANEL` plate and one of slit. Derived from the star every call,
// never stored: the star's size is the sky's, and the shell follows it.
export const shellR = () => sky.r + SPHERE_OUT * P;

export function shell() {
  const R = shellR();
  const n = Math.max(12, Math.round((Math.PI * 2 * R) / P));
  const every = SPHERE_PANEL + 1;
  return { R, n, every, panels: Math.floor(n / every) };
}

// A cell of the ring, in the world, snapped to the lattice. Angle nought is
// straight down, toward the yard, which is where the pour starts.
export function shellCell(i, s = shell()) {
  const a = Math.PI / 2 + (i / s.n) * Math.PI * 2;
  return { x: Math.round((sky.x + Math.cos(a) * s.R - P / 2) / P) * P,
           y: Math.round((sky.y + Math.sin(a) * s.R - P / 2) / P) * P };
}

// Which panels are up: laid from the bottom outward both ways, so the shell
// closes over the top of the star, the last place the yard can see into.
// Panel k's place in that order is how far it is from the bottom.
export function panelLaid(k, s = shell(), at = pouredAt()) {
  const half = s.panels / 2;
  const far = Math.min(k, s.panels - k) / half;       // 0 at the bottom, 1 at the top
  return far < at || at >= 1;
}

// The two cells the pour is landing on, for the beams: the growing ends.
export function sphereEdges(s = shell()) {
  const k = Math.round(pouredAt() * s.panels / 2);
  return [shellCell(k * s.every, s), shellCell(((s.panels - k) % s.panels) * s.every, s)];
}

// Which slits a rung of the ladder has covered with a second course of plate:
// a quarter a rung, so a topped sphere still shows one slit in four.
export const slitCovered = (j, tune = tuneOf('sphere')) => (j % 4) < tune;

// When each slit last let a chip go, for the drawing. A moment, not state: a
// flare is over in half a second and a reload owes nobody one.
export const FLARES = new Map();

// --- the pour --------------------------------------------------------------------
// Everybody in the ring pours, once a frame (`stepSummon` in wizard.js), the
// way a star is summoned and the dome is raised.
export function pourSphere(hands, secs) {
  if (!sphereRising() || hands <= 0) return;
  S.spherePour = Math.min(1, pouredAt() + (hands * secs) / SPHERE_WORK);
  if (S.spherePour >= 1) closeSphere();
}

// The last panel set: the machine stands, and the ring it no longer needs is
// sent down, as `buyMachine` sends every other station's gang the moment its
// machine is bought.
function closeSphere() {
  S.flashAt = now();
  shakeView(SUMMON_SHAKE);
  sfx('meteor-call', { x: sky.x, big: true });
  S.restaff = { job: JOB.WIZARD, want: 1 };
}

// --- the machine -----------------------------------------------------------------
// A unit of its work is one cell's worth of light: a rind cell's sparks, or a
// core's, in the proportion a fresh star is laid out (`makeMeteor`, whose core
// is a disc `METEOR_CORE` of the radius across, so that share of the area).
const CORE_SHARE = METEOR_CORE * METEOR_CORE;

// An open slit on the underside, or any open slit if the rungs have covered
// every one down there. The chips fall from where the light gets out.
function dropSlit(s) {
  const open = [];
  for (let j = 0; j < s.panels; j++) {
    if (slitCovered(j)) continue;
    open.push(j);
  }
  if (!open.length) return null;
  const low = open.filter(j => shellCell(j * s.every + SPHERE_PANEL, s).y > sky.y);
  const from = low.length ? low : open;
  return from[Math.floor(rand() * from.length)];
}

defineMachine('sphere', {
  job: JOB.WIZARD,
  type: TYPE.WIZARD,
  // Worked from the ring, not from a post on the ground (`tenderFor`).
  aloft: true,
  // Bought is not standing: the ring pours it first.
  standing: sphereUp,
  at: () => underMeteor(),
  y: () => sky.y,
  // The tower's spire is the stack: the machine belongs to the tower, and the
  // chimney a player can point at is on the ground.
  stack: () => ({ x: tower.x + tower.w / 2, y: tower.y }),
  // The ring's own clock, a bolt's worth of cells at a time, divided by what
  // the machine is worth over the three bodies it replaced.
  ms: rate => wizMs() / wizBite() / Math.max(0.01, rate),
  ready: () => sphereUp() && meteorAlive() && !S.pileFull.sky,
  bite: (tender, owed) => {
    const s = shell();
    const t = now();
    for (let u = 0; u < owed; u++) {
      const j = dropSlit(s);
      if (j == null) return u;
      const c = shellCell(j * s.every + SPHERE_PANEL, s);
      const n = rand() < CORE_SHARE ? METEOR_CORE_SPARKS : METEOR_SPARKS;
      for (let i = 0; i < n; i++)
        spawnChip(c.x, c.y, bell() * 0.4, 0.2 + rand() * 0.2, someFind(SPARK_CELL));
      FLARES.set(j, t);
    }
    return owed;
  }
});

// The flare's age, nought to one, for the drawing.
export const flareOf = j => {
  const at = FLARES.get(j);
  if (at == null) return 1;
  return Math.min(1, (now() - at) / SPHERE_FLARE_MS);
};
