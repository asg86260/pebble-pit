// The sphere: the tower's machine, a shell of plates the wizards pour round
// the star. Closed, it catches the star's light and lets it fall as sparks, so
// the star stops being a thing you take apart and becomes a thing you keep.
// See DESIGN.md, "The sphere: the tower's machine".
//
// It is a machine like the other four (machines.js) with two differences, both
// because nobody on the ground can reach it: it is poured by the ring after it
// is bought (`standing`), and its one tender works it from the air (`aloft`).

import { P, WORKER, SPHERE_WORK, SPHERE_OUT, SPHERE_PANEL, SPHERE_VENT, SPHERE_SPIN, SPHERE_SPIN_EASE, SPHERE_UNDER, SPHERE_FLARE_MS, METEOR_CORE,
         METEOR_SPARKS, METEOR_CORE_SPARKS, SPARK_CELL, SUMMON_SHAKE, someFind } from './config.js';
import { S, sky } from './state.js';
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
// Seen face on, a sphere covers its star: a disc `SPHERE_OUT` cells wider than
// the star, a riveted band round its edge and plates inside it, with a one-cell
// seam between plates where the light gets out. The plates are laid on the
// sphere, not on the page: bands of latitude and sectors of longitude, and the
// sphere turns on an upright axis (`SPHERE_SPIN`) while its tender's beam is on
// it (`stepSphere`), so the meridian seams slide
// across its face and crowd together toward the edge the way a globe's do,
// while the seams of latitude stand still. The disc's cells are worked out once
// for where the star is; which of them are seams is worked out once a frame.
export const shellR = () => sky.r + SPHERE_OUT * P;

let cached = null, cachedAt = '', turnedAt = -1;
function discCells(R) {
  const n = Math.ceil(R / P);
  // The top-left of the middle cell, on the lattice: a cell centered on the
  // star's middle would sit half a cell off it.
  const ox = Math.round((sky.x - P / 2) / P) * P, oy = Math.round((sky.y - P / 2) / P) * P;
  const around = Math.round(Math.PI * 2 * R / P);
  const out = [];
  for (let r = -n; r <= n; r++) {
    for (let c = -n; c <= n; c++) {
      const dx = c * P, dy = r * P;
      const d = Math.hypot(dx, dy);
      if (d > R) continue;
      out.push({ x: ox + dx, y: oy + dy, dx, dy,
                 // how far round from the bottom, nought straight under the
                 // star and one straight over it: the order the ring pours in,
                 // up both sides and closing over the top
                 far: Math.abs(Math.atan2(dx, dy)) / Math.PI,
                 // the outermost cell of the disc: the band the plates hang in,
                 // a rivet every third cell round it, by angle
                 band: d > R - P,
                 rivet: (Math.round(Math.atan2(dy, dx) / (Math.PI * 2) * around) % 3 + 3) % 3 === 0,
                 rim: d > R - P * 2, low: dy > 0,
                 // filled in each frame by `turn`
                 seam: false, cross: false, lit: false, dark: false, tile: 0, quarter: 0 });
    }
  }
  return out;
}

// The sphere's plating, as it stands at turn `th`. The inside of the band is a
// ball of radius `ri`; a cell's place on it is its latitude and longitude,
// and a seam is a cell within half a cell of a line of either. As many bands
// and sectors as make a plate about `SPHERE_PANEL` cells across at the middle.
function plating(ri, th) {
  const step = (SPHERE_PANEL + 1) * P;
  const lats = Math.max(2, Math.round(Math.PI * ri / step));
  const lons = Math.max(4, 2 * Math.round(Math.PI * ri / step));
  // the screen height of each line of latitude, fixed while it turns
  const latY = [];
  for (let k = 1; k < lats; k++) latY.push(ri * Math.sin(-Math.PI / 2 + k * Math.PI / lats));
  const at = (dx, dy) => {
    const sy = Math.max(-1, Math.min(1, dy / ri));
    const w = Math.sqrt(1 - sy * sy);
    const lat = latY.some(y => Math.abs(dy - y) < P / 2);
    // a line of longitude on the near side lands at `ri w sin(its angle less
    // the turn)` across this row
    let lon = false;
    for (let k = 0; k < lons && !lon; k++) {
      const a = k * Math.PI * 2 / lons - th;
      if (Math.cos(a) <= 0) continue;
      if (Math.abs(dx - ri * w * Math.sin(a)) < P / 2) lon = true;
    }
    const sx = w > 0 ? Math.max(-1, Math.min(1, dx / (ri * w))) : 0;
    const L = ((Math.asin(sx) + th) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
    const band = Math.min(lats - 1, Math.floor((Math.asin(sy) + Math.PI / 2) / (Math.PI / lats)));
    return { lat, lon, j: Math.floor(L / (Math.PI * 2 / lons)), i: band };
  };
  return at;
}

function turn(cells, R, th) {
  const at = plating(R - P, th);
  for (const c of cells) {
    if (c.band) continue;
    const here = at(c.dx, c.dy);
    c.seam = here.lat || here.lon;
    c.cross = here.lat && here.lon;
    c.tile = here.j * 31 + here.i;
    // A covered seam belongs to its plate and turns with it, so a rung paves
    // the same seams all the way round.
    c.quarter = ((here.j * 7 + here.i * 13 + (here.lat ? 1 : 0)) % 4 + 4) % 4;
    if (c.seam) { c.lit = c.dark = false; continue; }
    const s = (x, y) => { const o = at(x, y); return o.lat || o.lon; };
    // Lit where a seam is just above or to its left, shadowed where one is just
    // below or to its right: a plate with an edge the light catches.
    c.lit = s(c.dx, c.dy - P) || s(c.dx - P, c.dy);
    c.dark = s(c.dx, c.dy + P) || s(c.dx + P, c.dy);
  }
}

export function shellCells() {
  const R = shellR();
  const key = `${sky.x},${sky.y},${R}`;
  if (!cached || cachedAt !== key) { cached = discCells(R); cachedAt = key; turnedAt = -1; }
  if (angle !== turnedAt) { turn(cached, R, angle); turnedAt = angle; }
  return cached;
}

// --- the turn --------------------------------------------------------------------
// The tender's beam is what turns it: with the beam on, the sphere comes up to
// `SPHERE_SPIN`; with nobody up there it runs down and stops. Where it has got
// to is a picture, not a fact about the yard, so it is not saved: a reload
// finds it where it started, which no body walks across.
let angle = 0, spin = 0;
export const spinShare = () => spin / SPHERE_SPIN;
export function stepSphere(dt) {
  if (!sphereUp()) { spin = 0; return; }
  const beamed = S.workers.some(w => w.type === TYPE.WIZARD && w.aloft && w.channel);
  const want = beamed ? SPHERE_SPIN : 0;
  spin += (want - spin) * Math.min(1, dt / 1000 / SPHERE_SPIN_EASE);
  if (spin < SPHERE_SPIN * 0.002 && !beamed) spin = 0;
  angle = (angle + spin * dt / 1000) % (Math.PI * 2);
}

// Where the tender hangs to beam it round: under the middle of the shell. A
// second or third body, on its way down after the pour, hangs a little either
// side rather than on top of it.
export const underSphere = k => ({
  x: sky.x - WORKER / 2 + (k % 2 ? 1 : -1) * Math.ceil(k / 2) * WORKER,
  y: sky.y + shellR() + SPHERE_UNDER * P
});
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
  // The vents on the shell, where the light is being worked; the runner
  // shares the soot out between them.
  stacks: () => sphereVents().map(v => v.mouth),
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
