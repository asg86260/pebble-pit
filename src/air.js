// The dust hanging in the air. It rises off whatever is lying about, so a big
// pit visibly gives off more than a bare one, it leans on a wind that never
// quite settles, and it passes at its own rate as the view scrolls -- which is
// how movement reads with nothing in the background to move against.
//
// Motes are kept in *screen* pixels rather than world ones. They are weather,
// not scenery: what they have to do is be in front of you, and a mote with a
// place in the world spends nearly all of the game outside the window, which is
// exactly where the old ones went. What ties them to the yard is where they are
// born -- off the top of a real pile -- and after that they belong to the air.

import { P, WORKER, AIR_BANDS, AIR_KINDS, AIR_TINTS, AIR_FLOOR, AIR_PER_DUST, AIR_CAP, AIR_RISE, AIR_SINK,
         AIR_GRIT, AIR_LEAN, AIR_GIVE, AIR_GRIT_LEAN, AIR_LOW, AIR_LOW_BAND,
         AIR_SITE, AIR_SITE_UP, AIR_STIR, AIR_STIR_R, AIR_STIR_CAP, AIR_STIR_EASE } from './config.js';
import { pitDepth } from './pit.js';
import { S, floor, pit, quarry, farm } from './state.js';
import { at, count, surfaceY } from './grid.js';
import { blocked, overPitMouth } from './world.js';
import { ctx } from './render.js';
import { now } from './clock.js';
import { windAt, give } from './wind.js';

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
  let r = Math.random();
  for (const b of AIR_BANDS) { r -= b.share; if (r <= 0) return b; }
  return AIR_BANDS[AIR_BANDS.length - 1];
}

// where the ground line is on the screen, which is where dust hangs thickest
const groundOnScreen = () => (S.groundY - S.camY) * S.zoom;

// How far a mote may sink at a given place on the screen before it has landed.
// The ground stops it -- dust does not drift about inside solid ground -- except
// where the ground is open. The pit mouth and the quarry are holes with air in
// them, and the pit is the biggest dust source in the game: culling at the
// ground line would kill every mote it gave off in the frame it was born.
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

// A spot at the feet of somebody who is actually walking, in screen pixels.
// Where each of them was last frame is kept out here rather than on the worker,
// because a worker is a thing the game saves and this is a thing the air wants.
const wasAt = new WeakMap();

function offAWalker() {
  const crew = S.workers;
  if (!crew.length) return null;
  for (let tries = 0; tries < 6; tries++) {
    const w = crew[Math.floor(Math.random() * crew.length)];
    const was = wasAt.get(w);
    if (was === undefined || Math.abs(w.x - was) < 0.3) continue;   // standing still: no dust
    const x = (w.x + Math.random() * WORKER - S.camX) * S.zoom;
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
  const b = Math.random() < 0.5 ? floor : pit;
  for (let tries = 0; tries < 12; tries++) {
    const c = Math.floor(Math.random() * b.cols);
    if (!at(b, c, 0)) continue;
    if (b === floor && blocked(c)) continue;
    const x = (b.x + c * b.p + Math.random() * b.p - S.camX) * S.zoom;
    const y = (surfaceY(b, c) - P - S.camY) * S.zoom;
    if (x < -MARGIN || x > S.W + MARGIN || y < -MARGIN || y > S.H + MARGIN) continue;
    return { x, y };
  }
  return null;
}

// What the air is made of over a given place on the screen. The yard is dust;
// the quarry and the beds give off their own, and a little past their edges
// too, because a hole in the ground does not stop breathing at its rim. A site
// that is not open yet is bare ground and gives off nothing but dust.
//
// This is asked of a mote every frame rather than once when it is born. The
// colour is a property of the air over a place, not of a speck: motes live for
// thousands of frames, so a field that took its colours at birth would take
// minutes to turn blue after the quarry opened, and would then carry that blue
// out over the rest of the world on the wind. Asked every frame, the haze over
// a site is its colour the moment you look at it, and stays put.
const OVER = P * 6;                // how far past a site's edge its air reaches

function kindAt(sx) {
  const wx = sx / S.zoom + S.camX;
  if (S.farmOpen && wx > farm.x - OVER && wx < farm.x + farm.w + OVER) return 'spore';
  if (S.quarryOpen && wx > quarry.x - OVER && wx < quarry.x + quarry.w + OVER) return 'shard';
  return 'dust';
}

// A site gives off its own air whether or not anybody is standing in it: the
// quarry breathes out of the ground, the beds off the crop. Without this the
// only coloured motes are the ones a walker happens to kick up, and a farmhand
// stood at a bed is not walking, so the beds gave off nothing at all.
function offASite() {
  const open = [];
  if (S.quarryOpen) open.push(quarry);
  if (S.farmOpen) open.push(farm);
  if (!open.length) return null;
  const site = open[Math.floor(Math.random() * open.length)];
  const x = (site.x + Math.random() * site.w - S.camX) * S.zoom;
  const y = (S.groundY - Math.random() * AIR_SITE_UP - S.camY) * S.zoom;
  if (x < -MARGIN || x > S.W + MARGIN || y < -MARGIN || y > S.H + MARGIN) return null;
  return { x, y };
}

// Put a mote somewhere it can be seen. `anywhere` scatters it across the whole
// window, which is what a seeded field wants; without it a mote comes in low --
// off a pile if there is one, otherwise off the ground line -- because dust
// gets into the air by being kicked into it, and starting them all at random
// heights reads as snow.
function place(m, anywhere) {
  // boots first: the crew crossing the yard stir up more than the yard does by
  // sitting there, and dust at somebody's feet is the one bit of the air that
  // is plainly caused by something you are watching
  const from = anywhere ? null
             : (Math.random() < AIR_SITE ? offASite() : null)
               || offAWalker() || (S.dustSeen > 20 ? offAPile() : null);
  if (from) { m.x = from.x; m.y = from.y; m.kind = kindAt(m.x); return m; }

  m.x = Math.random() * S.W;
  m.kind = kindAt(m.x);
  if (anywhere && Math.random() > AIR_LOW) { m.y = Math.random() * S.H; return m; }

  // low: in the band of air just over the ground, clamped to the window so a
  // ground line scrolled off the bottom does not take the whole field with it
  const g = Math.min(Math.max(groundOnScreen(), 0), S.H);
  m.y = g - Math.random() * AIR_LOW_BAND * S.zoom;
  if (m.y < 0 || m.y > S.H) m.y = Math.random() * S.H;
  return m;
}

function born(anywhere) {
  const b = pickBand();
  const grit = Math.random() < AIR_GRIT;
  return place({
    b,
    grit,                                        // heavier: it sinks instead of climbing
    vy: (grit ? AIR_SINK : -AIR_RISE) * b.pace * (0.6 + Math.random() * 0.8),
    // How much of the wind this one takes, fixed for its life. A fifth either
    // way, and less again if it is grit, which is heavy. It used to be a phase
    // and a period -- its own cosine, its own beat -- and that is what made the
    // field look shaken rather than blown: a mote leaning the opposite way to
    // the one beside it says there is no wind, whatever else is going on.
    lean: give(Math.random(), AIR_GIVE) * (grit ? AIR_GRIT_LEAN : 1)
  }, anywhere);
}

// How many motes the yard is asking for, before the cap. A well-stocked pit
// asks for far more than the screen can carry -- the cap is what stops the air
// turning to soup -- so this is the number that actually answers the yard.
const appetite = t => AIR_FLOOR + Math.round(dustAbout(t) / AIR_PER_DUST);

export function stepAir() {
  const t = now();
  const want = Math.min(AIR_CAP, appetite(t));
  const wind = windAt(t) * AIR_LEAN;      // the yard's wind, in the pixels dust travels in

  // how far the field has to slide to stay put: the camera moved, and each band
  // takes its own share of that
  const dx = (S.camX - camWasX) * S.zoom;
  const dy = (S.camY - camWasY) * S.zoom;
  camWasX = S.camX;
  camWasY = S.camY;

  // the air thickens and thins a mote at a time, so a pile being carried away
  // does not put a hole in the sky
  if (AIR.length < want) AIR.push(born(false));
  else if (AIR.length > want + 8) AIR.splice(Math.floor(Math.random() * AIR.length), 1);

  const keep = Math.max(0, 1 - AIR_STIR_EASE / 60);
  for (const m of AIR) {
    // The one wind, times what this band takes of it, times this mote's share.
    // The band is the depth: a far band leans less than a near one on the same
    // gust, which is the parallax the bands are there for and is the reason the
    // shared wind is scaled per band rather than each band being given a wind of
    // its own -- two winds would have had the far dust drifting one way while
    // the near dust went the other, and depth would have read as disagreement.
    m.x += wind * m.b.pace * m.lean - dx * m.b.take;
    m.y += m.vy - dy * m.b.take;

    // and whatever draught the cursor left behind it, dying away. A real wind
    // for a moment rather than a shove: the mote keeps moving after the pointer
    // has gone by, and slows, which is what air does once something has been
    // through it.
    if (m.sx || m.sy) {
      m.x += m.sx;
      m.y += m.sy;
      m.sx *= keep;
      m.sy *= keep;
      if (Math.abs(m.sx) < 0.02) m.sx = 0;
      if (Math.abs(m.sy) < 0.02) m.sy = 0;
    }

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

// --- the draught off the cursor ------------------------------------------------
// Something moving through still air moves the air. The dust is the one thing in
// this yard the pointer passes through without touching anything, and a field
// that takes no notice of a hand going through it is a picture of dust rather
// than dust.
//
// A mote is dragged the way the cursor is *going*, not away from where it is: a
// wake, not a repulsion. It is given a little speed of its own that then dies
// away, so the air keeps moving after the pointer has gone by and slows -- which
// is the difference between stirring a room and pushing a wall through it.
//
// Screen pixels, because that is what a mote is in. These are weather rather
// than scenery: they have no place in the yard, so the cursor has to be asked
// for its place on the *glass*, and dragging the view along -- which moves the
// pointer over the world without moving it over the screen -- rightly stirs
// nothing.
//
// The near band takes the most of it, the far band almost none, on the same
// share they take of the camera: what is close to you is what your hand is in.
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
    m.sx = Math.max(-AIR_STIR_CAP, Math.min(AIR_STIR_CAP, (m.sx || 0) + ux * k));
    m.sy = Math.max(-AIR_STIR_CAP, Math.min(AIR_STIR_CAP, (m.sy || 0) + uy * k));
    moved++;
  }
  return moved;
}

// Behind the world. Drawn in screen pixels, which is the point of the whole
// exercise: these have no size in the yard and do not zoom with it.
export function drawAir() {
  paint(false);
}

// And in front of it -- the near band only, so the yard has something between
// you and the rock.
export function drawAirNear() {
  paint(true);
}

function paint(front) {
  ctx.setTransform(S.dpr, 0, 0, S.dpr, 0, 0);
  // Band by band, and within a band one colour at a time: the fill style is the
  // expensive thing to change, so it is set nine times a frame rather than once
  // a mote. Depth is still what the bands are for -- the pass order is by band,
  // so a near green mote is drawn over a far grey one, not under it.
  for (let i = 0; i < AIR_BANDS.length; i++) {
    const b = AIR_BANDS[i];
    if (b.front !== front) continue;
    for (const kind of AIR_KINDS) {
      ctx.fillStyle = AIR_TINTS[kind][i];
      for (const m of AIR) {
        if (m.b !== b || m.kind !== kind) continue;
        ctx.fillRect(Math.round(m.x), Math.round(m.y), b.size, b.size);
      }
    }
  }
  ctx.fillStyle = '#000';
}


// What the air is doing, for the checks: how much of it there is, how much of
// it is in the band drawn in front of the yard, and whether any of it has got in
// under the ground -- which is the one thing that would look plainly wrong.
export function airReport() {
  let under = 0, front = 0;
  const kinds = { dust: 0, shard: 0, spore: 0 };
  for (const m of AIR) {
    if (m.y > floorAt(m.x) + 1) under++;
    if (m.b.front) front++;
    kinds[m.kind]++;
  }
  return { n: AIR.length, under, front, kinds, want: appetite(now()) };
}


// roughly how much dust is lying about, refreshed a few times a second: this
// only sets how many motes drift in the air, and counting a full pit every
// frame would cost more than the whole rest of the game
export function dustAbout(now) {
  if (now - S.dustSeenAt > 400) {
    S.dustSeen = count(floor) + count(pit);
    S.dustSeenAt = now;
  }
  return S.dustSeen;
}
