// The sphere: the tower's machine, a shell of plates the wizards pour round
// the star. Closed, it catches the star's light and lets it fall as sparks, so
// the star stops being a thing you take apart and becomes a thing you keep.
// See DESIGN.md, "The sphere: the tower's machine".
//
// It is a machine like the other four (machines.js) with two differences, both
// because nobody on the ground can reach it: it is poured by the ring after it
// is bought (`standing`), and its one tender works it from the air (`aloft`).

import { P, SPHERE_WORK, SPHERE_OUT, SPHERE_PANEL, SPHERE_VENT, SPHERE_FLARE_MS, METEOR_CORE,
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
// Seen face on, a sphere covers its star: a disc of plates `SPHERE_OUT` cells
// wider than the star, square plates `SPHERE_PANEL` cells a side with a
// one-cell seam between them, and the seams are where the light gets out.
// Derived from the star, never stored, and worked out once for where the star
// is: the drawing and the machine both walk it every frame.
export const shellR = () => sky.r + SPHERE_OUT * P;

let cached = null, cachedAt = '';
export function shellCells() {
  const R = shellR();
  const key = `${sky.x},${sky.y},${R}`;
  if (cached && cachedAt === key) return cached;
  const every = SPHERE_PANEL + 1;
  const n = Math.ceil(R / P);
  // The top-left of the middle cell, on the lattice: a cell centered on the
  // star's middle would sit half a cell off it.
  const ox = Math.round((sky.x - P / 2) / P) * P, oy = Math.round((sky.y - P / 2) / P) * P;
  const out = [];
  for (let r = -n; r <= n; r++) {
    for (let c = -n; c <= n; c++) {
      const dx = c * P, dy = r * P;
      if (Math.hypot(dx, dy) > R) continue;
      // Seams centered on the star, so the lattice is symmetric about it.
      const mc = ((c + (every >> 1)) % every + every) % every;
      const mr = ((r + (every >> 1)) % every + every) % every;
      const seam = mc === SPHERE_PANEL || mr === SPHERE_PANEL;
      // Which plate, for its tone; and how far round from the bottom this cell
      // is, nought straight under the star and one straight over it, which is
      // the order the ring pours in: up both sides, closing over the top.
      const tile = Math.floor((c + (every >> 1)) / every) * 31 + Math.floor((r + (every >> 1)) / every);
      const far = Math.abs(Math.atan2(dx, dy)) / Math.PI;
      const d = Math.hypot(dx, dy);
      out.push({ x: ox + dx, y: oy + dy, seam, tile, far, mc, mr,
                 // where two seams cross: a bolt, not a gap
                 cross: mc === SPHERE_PANEL && mr === SPHERE_PANEL,
                 // the outermost cell of the disc: the riveted band the
                 // plates are hung in
                 band: d > R - P,
                 // a rivet every third cell round the band, by angle so the
                 // spacing holds all the way round
                 rivet: (Math.round(Math.atan2(dy, dx) / (Math.PI * 2) * Math.round(Math.PI * 2 * R / P)) % 3 + 3) % 3 === 0,
                 // a fixed quarter for each seam cell, so a rung covers a
                 // quarter of them and the same quarter every frame
                 quarter: ((c * 7 + r * 13) % 4 + 4) % 4,
                 rim: d > R - P * 2, low: dy > 0 });
    }
  }
  cachedAt = key;
  return (cached = out);
}
// Snapped to whole cells: `x` and `y` above are each cell's top-left.
const snap = v => Math.round(v / P) * P;

// The vents on the shell's crown, where the soot comes off: three short
// chimneys standing out of the band, a cell wide and `SPHERE_VENT` tall, at
// the top and a little either side of it. Their mouths are where the stack
// puffs.
export function sphereVents() {
  const R = shellR();
  return [-0.45, 0, 0.45].map(a => {
    const ux = Math.sin(a), uy = -Math.cos(a);
    return { x: snap(sky.x + ux * R - P / 2), y: snap(sky.y + uy * R - P / 2), ux, uy,
             mouth: { x: sky.x + ux * (R + SPHERE_VENT * P), y: sky.y + uy * (R + SPHERE_VENT * P) } };
  });
}

// Whether a cell of the shell is poured yet.
export const laid = (cell, at = pouredAt()) => at >= 1 || cell.far < at;

// A seam a rung of the ladder has covered with a second course of plate: a
// quarter a rung, so a topped sphere still lets one seam cell in four through.
export const covered = (cell, tune = tuneOf('sphere')) => cell.seam && cell.quarter < tune;

// The two points the pour is landing on, for the beams: the growing edges,
// one up each side.
export function sphereEdges() {
  const a = pouredAt() * Math.PI, R = shellR();
  return [{ x: snap(sky.x - Math.sin(a) * R), y: snap(sky.y + Math.cos(a) * R) },
          { x: snap(sky.x + Math.sin(a) * R), y: snap(sky.y + Math.cos(a) * R) }];
}

// When each seam cell last let a chip go, for the drawing. A moment, not state:
// a flare is over in half a second and a reload owes nobody one. Keyed on the
// cell object, so a star that moves starts a fresh map with its fresh cells.
export const FLARES = new WeakMap();

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

// An open seam on the underside's rim, where a chip let go falls clear of the
// shell. The chips fall from where the light gets out.
function dropSeams() {
  return shellCells().filter(c => c.seam && c.rim && !c.band && !c.cross && c.low && !covered(c));
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
  // Two kinds of chimney: the vents on the shell, where the light is being
  // worked, and the tower's spire, the station the machine belongs to. The
  // runner shares the soot out between them.
  stacks: () => [...sphereVents().map(v => v.mouth), { x: tower.x + tower.w / 2, y: tower.y }],
  // The ring's own clock, a bolt's worth of cells at a time, divided by what
  // the machine is worth over the three bodies it replaced.
  ms: rate => wizMs() / wizBite() / Math.max(0.01, rate),
  ready: () => sphereUp() && meteorAlive() && !S.pileFull.sky,
  bite: (tender, owed) => {
    const seams = dropSeams();
    if (!seams.length) return 0;
    const t = now();
    for (let u = 0; u < owed; u++) {
      const c = seams[Math.floor(rand() * seams.length)];
      const n = rand() < CORE_SHARE ? METEOR_CORE_SPARKS : METEOR_SPARKS;
      for (let i = 0; i < n; i++)
        spawnChip(c.x, c.y, bell() * 0.4, 0.2 + rand() * 0.2, someFind(SPARK_CELL));
      FLARES.set(c, t);
    }
    return owed;
  }
});

// The flare's age, nought to one, for the drawing.
export const flareOf = cell => {
  const at = FLARES.get(cell);
  if (at == null) return 1;
  return Math.min(1, (now() - at) / SPHERE_FLARE_MS);
};
