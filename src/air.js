// The dust hanging in the air. It rises off whatever is lying about, leans on
// the wind, and passes at its own rate as the view scrolls, which is how
// movement reads with nothing in the background to move against.
//
// Motes are kept in *screen* pixels rather than world ones. They are weather,
// not scenery: a mote with a place in the world spends nearly all of the game
// outside the window. What ties them to the yard is where they are born.

import { P, WORKER, AIR_BANDS, AIR_KINDS, AIR_TINTS, AIR_FLOOR, AIR_PER_DUST, AIR_CAP, AIR_RISE, AIR_SINK,
         AIR_GRIT, AIR_LEAN, AIR_STREAK, AIR_GIVE, AIR_GRIT_LEAN, AIR_LOW, AIR_LOW_BAND,
         AIR_SITE, AIR_SITE_UP, AIR_STIR, AIR_STIR_R, AIR_STIR_CAP, AIR_STIR_EASE, AIR_STIR_SCATTER,
         RIFT_PULL, RIFT_PULL_R, RIFT_EAT, RIFT_FEED } from './config.js';
import { pitDepth } from './pit.js';
import { S, floor, pit, quarry, farm, rift } from './state.js';
import { at, surfaceY } from './grid.js';
import { blocked, overPitMouth } from './world.js';
import { ctx } from './render.js';
import { now, frames } from './clock.js';
import { gust, give } from './wind.js';
import { rand } from './rng.js';

export const AIR = [];

const MARGIN = 24;                 // how far past the edge a mote may sit before it wraps
let camWasX = 0, camWasY = 0;      // last frame's camera, for how far the field has to slide

export function seedAir() {
  AIR.length = 0;
  camWasX = S.camX;
  camWasY = S.camY;
  // the air is already there when you arrive: it does not fade in over the first
  // few seconds of a new game
  for (let i = 0; i < AIR_FLOOR; i++) AIR.push(born(true));
}

// which band a new mote belongs to, by the share each one is meant to hold
function pickBand() {
  let r = rand();
  for (const b of AIR_BANDS) { r -= b.share; if (r <= 0) return b; }
  return AIR_BANDS[AIR_BANDS.length - 1];
}

// where the ground line is on the screen, which is where dust hangs thickest
const groundOnScreen = () => (S.groundY - S.camY) * S.zoom;

// How far a mote may sink at a place on the screen before it has landed. The
// ground stops it except where the ground is open: the pit is the biggest
// dust source in the game, and culling at the ground line would kill every
// mote it gave off in the frame it was born.
function floorAt(x) {
  const g = groundOnScreen();
  // the line is off the top of the window: you are looking down the hole, and
  // there is nothing in view to land on
  if (g <= 40) return Infinity;
  const wx = x / S.zoom + S.camX;
  if (overPitMouth(wx)) return (S.groundY + pitDepth() - S.camY) * S.zoom;
  if (S.quarryOpen && wx > quarry.x && wx < quarry.x + quarry.w)
    return (S.groundY + quarry.h - S.camY) * S.zoom;
  return g;
}

// Where each walker was last frame, kept out here rather than on the worker,
// because a worker is a thing the game saves and this is a thing the air wants.
const wasAt = new WeakMap();

// Whether somebody is moving this frame, to the same tolerance the dust uses.
// Exported because the crew's card asks exactly this question. A body's own
// `walking` flag is no help: it is set for the errand legs and not for a
// hauler's whole working day, which is walking and nothing else.
export const onTheMove = w => {
  const was = wasAt.get(w);
  return was !== undefined && Math.abs(w.x - was) >= 0.3;
};

function offAWalker() {
  const crew = S.workers;
  if (!crew.length) return null;
  for (let tries = 0; tries < 6; tries++) {
    const w = crew[Math.floor(rand() * crew.length)];
    const was = wasAt.get(w);
    if (was === undefined || Math.abs(w.x - was) < 0.3) continue;   // standing still: no dust
    const x = (w.x + rand() * WORKER - S.camX) * S.zoom;
    const y = (w.y + WORKER - S.camY) * S.zoom - 2;   // just clear of the boots
    if (x < -MARGIN || x > S.W + MARGIN || y < -MARGIN || y > S.H + MARGIN) continue;
    return { x, y };
  }
  return null;
}

// walked in from `stepAir` once a frame, after the crew have moved
function rememberWalkers() {
  for (const w of S.workers) wasAt.set(w, w.x);
}

// a spot just above the dust in a random column of a pile, in screen pixels, or
// null if there is nothing lying about within the window
function offAPile() {
  const b = rand() < 0.5 ? floor : pit;
  for (let tries = 0; tries < 12; tries++) {
    const c = Math.floor(rand() * b.cols);
    if (!at(b, c, 0)) continue;
    if (b === floor && blocked(c)) continue;
    const x = (b.x + c * b.p + rand() * b.p - S.camX) * S.zoom;
    const y = (surfaceY(b, c) - P - S.camY) * S.zoom;
    if (x < -MARGIN || x > S.W + MARGIN || y < -MARGIN || y > S.H + MARGIN) continue;
    return { x, y };
  }
  return null;
}

// What the air is made of over a place on the screen: the quarry and the
// plots give off their own, a little past their edges too. Asked of a mote
// every frame rather than once at birth: the color is a property of the air
// over a place, not of a speck, and a field that took its colors at birth
// would take minutes to turn blue after the quarry opened and then carry the
// blue out over the world on the wind.
const OVER = P * 6;                // how far past a site's edge its air reaches

function kindAt(sx) {
  const wx = sx / S.zoom + S.camX;
  if (S.farmOpen && wx > farm.x - OVER && wx < farm.x + farm.w + OVER) return 'spore';
  if (S.quarryOpen && wx > quarry.x - OVER && wx < quarry.x + quarry.w + OVER) return 'shard';
  return 'dust';
}

// A site gives off its own air whether or not anybody is standing in it: a
// farmhand stood at a plot is not walking, so off walkers alone the plots
// gave off nothing.
function offASite() {
  const open = [];
  if (S.quarryOpen) open.push(quarry);
  if (S.farmOpen) open.push(farm);
  if (!open.length) return null;
  const site = open[Math.floor(rand() * open.length)];
  const x = (site.x + rand() * site.w - S.camX) * S.zoom;
  const y = (S.groundY - rand() * AIR_SITE_UP - S.camY) * S.zoom;
  if (x < -MARGIN || x > S.W + MARGIN || y < -MARGIN || y > S.H + MARGIN) return null;
  return { x, y };
}

// Put a mote somewhere it can be seen. `anywhere` scatters it across the
// whole window, for a seeded field; otherwise it comes in low, because dust
// gets into the air by being kicked into it, and random heights read as snow.
function place(m, anywhere) {
  // boots first: dust at somebody's feet is the one bit of the air plainly
  // caused by something you are watching
  const from = anywhere ? null
             : (rand() < AIR_SITE ? offASite() : null)
               || offAWalker() || (dustAbout() > 20 ? offAPile() : null);
  if (from) { m.x = from.x; m.y = from.y; m.kind = kindAt(m.x); return m; }

  m.x = rand() * S.W;
  m.kind = kindAt(m.x);
  if (anywhere && rand() > AIR_LOW) { m.y = rand() * S.H; return m; }

  // low: in the band of air just over the ground, clamped to the window so a
  // ground line scrolled off the bottom does not take the whole field with it
  const g = Math.min(Math.max(groundOnScreen(), 0), S.H);
  m.y = g - rand() * AIR_LOW_BAND * S.zoom;
  if (m.y < 0 || m.y > S.H) m.y = rand() * S.H;
  return m;
}

function born(anywhere) {
  const b = pickBand();
  const grit = rand() < AIR_GRIT;
  return place({
    b,
    grit,                                        // heavier: it sinks instead of climbing
    vy: (grit ? AIR_SINK : -AIR_RISE) * b.pace * (0.6 + rand() * 0.8),
    // How much of the wind this one takes, fixed for its life; less if it is
    // grit. A share of one wind, not a phase of its own: a mote leaning the
    // opposite way to the one beside it says there is no wind.
    lean: give(rand(), AIR_GIVE) * (grit ? AIR_GRIT_LEAN : 1)
  }, anywhere);
}

// How many motes the yard is asking for, before the cap.
const appetite = () => AIR_FLOOR + Math.round(dustAbout() / AIR_PER_DUST);

export function stepAir() {
  const t = now();
  const want = Math.min(AIR_CAP, appetite());
  const wind = gust() * AIR_LEAN;         // the yard's wind, in the pixels dust travels in

  // how far the field has to slide to stay put: the camera moved, and each band
  // takes its own share of that
  const dx = (S.camX - camWasX) * S.zoom;
  const dy = (S.camY - camWasY) * S.zoom;
  camWasX = S.camX;
  camWasY = S.camY;

  // the air thickens and thins a mote at a time, so a pile being carried away
  // does not put a hole in the sky
  if (AIR.length < want) AIR.push(born(false));
  else if (AIR.length > want + 8) AIR.splice(Math.floor(rand() * AIR.length), 1);

  // Everything below is pixels a frame, stepped by however long this frame
  // was; the easing, a proportion of what is left, is raised to that power.
  // See `frames` in clock.js.
  const f = frames();
  const keep = Math.max(0, 1 - AIR_STIR_EASE / 60) ** f;
  const suck = riftOnGlass();
  for (const m of AIR) {
    // The one wind, scaled per band rather than a wind per band: two winds
    // would have the far dust drifting one way while the near went the
    // other, and depth would read as disagreement.
    m.x += (wind * m.b.pace * m.lean) * f - dx * m.b.take;
    m.y += m.vy * f - dy * m.b.take;

    // the cursor's draught, dying away: the mote keeps moving after the
    // pointer has gone by, which is what air does
    if (m.sx || m.sy) {
      m.x += m.sx * f;
      m.y += m.sy * f;
      m.sx *= keep;
      m.sy *= keep;
      if (Math.abs(m.sx) < 0.02) m.sx = 0;
      if (Math.abs(m.sy) < 0.02) m.sy = 0;
    }

    // A mote that reaches the middle of the rift is gone and put back
    // somewhere else, so this frame's work on it is finished.
    if (suck && intoTheRift(m, suck, f)) continue;

    // off the sides it comes back on the other one, which keeps the field even
    // however long the camera pans one way
    if (m.x < -MARGIN) m.x += S.W + MARGIN * 2;
    else if (m.x > S.W + MARGIN) m.x -= S.W + MARGIN * 2;

    // off the top, or down onto whatever is under it, it is a new mote kicked
    // up somewhere else rather than a wrapped one: dust that climbed out of the
    // picture does not come back down, and grit that has settled has settled
    if (m.y < -MARGIN || m.y > S.H + MARGIN || m.y > floorAt(m.x)) place(m, false);

    m.kind = kindAt(m.x);              // whatever it is drifting over now
  }

  rememberWalkers();
}

// --- what the rift does to the air ---------------------------------------------
// The one thing acting on a mote that is not weather: a black hole that does
// not visibly pull is a black circle. No books here; a mote drawn into the
// middle is put back by `place` in the same frame, so the field holds exactly
// the number the yard has earned.
//
// Where the disc is on the glass, converted once a frame with the same
// transform the yard is drawn with, shake and all, so the pull stays on the
// disc while the view is rocking.
function riftOnGlass() {
  if (!S.riftOpen) return null;
  const z = S.zoom;
  return { x: (rift.x + rift.w * 0.5 - S.camX + S.shakeX) * z,
           y: (rift.y + rift.h * 0.5 - S.camY + S.shakeY) * z,
           r: rift.w * 0.5 * z };
}

// Where a mote goes once the rift has had it. Most come back at the edge of
// its reach, which gives the pull something to pull on (RIFT_FEED).
function reborn(m, s) {
  if (rand() > RIFT_FEED) return place(m, false);
  const a = rand() * Math.PI * 2;
  const r = s.r * RIFT_PULL_R * (0.86 + rand() * 0.14);
  m.x = s.x + Math.cos(a) * r;
  m.y = s.y + Math.sin(a) * r;
  m.kind = kindAt(m.x);
  return m;
}

// One mote's share of it. True when the mote was eaten and is somewhere else
// now. Gravity, not a swirl: an inverse square quoted at one disc radius,
// into the mote's own speed rather than its position, so a mote drifting
// past on the wind swings round and one coming in slowly falls straight down.
// The speed goes in `sx, sy`, the pair the cursor's draught uses, which
// already decays, so orbits lose energy and come in.
function intoTheRift(m, s, f) {
  const dx = s.x - m.x, dy = s.y - m.y;
  const d = Math.hypot(dx, dy);
  const reach = s.r * RIFT_PULL_R;
  if (d > reach) return false;
  if (d < s.r * RIFT_EAT) { reborn(m, s); return true; }     // through, and gone
  // Held at its rim value further in, because a true square runs away at the
  // middle and would throw a mote across the yard in one frame.
  const g = RIFT_PULL * (s.r * s.r) / Math.max(d * d, s.r * s.r);
  const k = g * m.b.take * f;
  // Clamped to AIR_STIR_CAP, the ceiling the cursor's draught keeps: a force
  // added to a speed needs one, and without it the terminal speed crosses
  // the window in a second.
  const cap = AIR_STIR_CAP;
  m.sx = Math.max(-cap, Math.min(cap, (m.sx || 0) + (dx / d) * k));
  m.sy = Math.max(-cap, Math.min(cap, (m.sy || 0) + (dy / d) * k));
  return false;
}

// --- the draught off the cursor ------------------------------------------------
// A mote is dragged the way the cursor is *going*, not away from where it is:
// a wake, not a repulsion, with a little speed of its own that dies away.
//
// Screen pixels, because that is what a mote is in: the cursor is asked for
// its place on the *glass*, so dragging the view along, which moves the
// pointer over the world without moving it over the screen, rightly stirs
// nothing. The near band takes the most of it, on the same share it takes of
// the camera.
export function stirAir(sx, sy, dx, dy) {
  const speed = Math.hypot(dx, dy);
  if (speed < 0.5 || !AIR.length) return 0;
  // A flick across the window is not a hundred times the draught of a slow drag.
  const push = Math.min(speed, 45) * AIR_STIR;
  const ux = dx / speed, uy = dy / speed;
  let moved = 0;
  for (const m of AIR) {
    const d = Math.hypot(m.x - sx, m.y - sy);
    if (d > AIR_STIR_R) continue;
    // hardest right under the cursor, nothing at all at the edge of its reach
    const fall = 1 - d / AIR_STIR_R;
    const k = push * fall * fall * m.b.take;
    // Each mote leans its own way off the cursor's heading, picked when the
    // wake first touches it and kept while it coasts; all of them on the
    // exact heading slide as one stiff sheet.
    if (!m.sx && !m.sy) m.st = (rand() * 2 - 1) * AIR_STIR_SCATTER;
    const cs = Math.cos(m.st || 0), sn = Math.sin(m.st || 0);
    const px = ux * cs - uy * sn, py = ux * sn + uy * cs;
    m.sx = Math.max(-AIR_STIR_CAP, Math.min(AIR_STIR_CAP, (m.sx || 0) + px * k));
    m.sy = Math.max(-AIR_STIR_CAP, Math.min(AIR_STIR_CAP, (m.sy || 0) + py * k));
    moved++;
  }
  return moved;
}

// Behind the world, in screen pixels: these have no size in the yard and do
// not zoom with it.
export function drawAir() {
  paint(false);
}

// And in front of it, the near band only, so the yard has something between
// you and the rock.
export function drawAirNear() {
  paint(true);
}

// Band by band, and within a band one color at a time, as one path a
// band-and-kind rather than one call a mote. The order (band, then kind) is
// the depth and is kept exactly. Every tint is opaque (AIR_TINTS), so a path
// holding two overlapping squares puts down exactly what two fills would;
// the batching is invisible, and that is checked by hashing the frame.
const KI = { dust: 0, shard: 1, spore: 2 };
const BUCKET = AIR_BANDS.map(() => AIR_KINDS.map(() => ({ n: 0, xy: new Float64Array(AIR_CAP * 2) })));

function paint(front) {
  ctx.setTransform(S.dpr, 0, 0, S.dpr, 0, 0);
  for (let i = 0; i < AIR_BANDS.length; i++)
    for (let k = 0; k < AIR_KINDS.length; k++) BUCKET[i][k].n = 0;

  for (const m of AIR) {
    const i = AIR_BANDS.indexOf(m.b);
    if (AIR_BANDS[i].front !== front) continue;
    const b = BUCKET[i][KI[m.kind]];
    b.xy[b.n * 2] = Math.round(m.x);
    b.xy[b.n * 2 + 1] = Math.round(m.y);
    b.n++;
  }

  // A square has no direction in it; a speck smeared along its own travel
  // says the speed in a still frame, which motion alone cannot at these sizes.
  const g = gust();
  // The streak trails BEHIND, because it is where the mote just was.
  const back = g > 0;

  for (let i = 0; i < AIR_BANDS.length; i++) {
    const band = AIR_BANDS[i];
    if (band.front !== front) continue;
    for (let k = 0; k < AIR_KINDS.length; k++) {
      const b = BUCKET[i][k];
      if (!b.n) continue;
      // the fill style is the expensive thing to change, and it is set once a
      // bucket -- and not at all for a bucket with nothing in it
      ctx.fillStyle = AIR_TINTS[AIR_KINDS[k]][i];
      // A band's own reach, off the same number its pallor, pace and parallax
      // come off; the far band works out at nothing and stays square.
      const tail = Math.round(AIR_STREAK * Math.abs(g) * band.pace * band.size);
      const from = back ? -tail : 0;
      ctx.beginPath();
      for (let j = 0; j < b.n; j++)
        ctx.rect(b.xy[j * 2] + from, b.xy[j * 2 + 1], band.size + tail, band.size);
      ctx.fill();
    }
  }
  ctx.fillStyle = '#000';
}


// For the checks: how much air there is, how much is in the front band, and
// whether any has got in under the ground.
export function airReport() {
  let under = 0, front = 0;
  const kinds = { dust: 0, shard: 0, spore: 0 };
  for (const m of AIR) {
    if (m.y > floorAt(m.x) + 1) under++;
    if (m.b.front) front++;
    kinds[m.kind]++;
  }
  return { n: AIR.length, under, front, kinds, want: appetite() };
}


// How much dust is lying about; only sets how many motes drift in the air.
// Both plots keep a live count of their occupied cells (grid.js `put`,
// verify.js rule 7), so this is two field reads, never a walk of the grids.
export function dustAbout() {
  return (floor.n || 0) + (pit.n || 0);
}
