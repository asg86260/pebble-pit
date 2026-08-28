// What is in the sky, which is nothing that matters and is the point of it.
//
// The yard is a still picture until something in it moves. The dust motes in
// air.js do that job close up; this does it far off. Clouds sit at the back and
// slide past almost too slowly to catch, and now and then a few birds cross.
// Neither is clickable, neither sheds anything, and neither is ever in front of
// the rock -- they are drawn with the far things, before the ground line, so the
// works always stands over them.
//
// Both live in *sky coordinates*: an x that is turned into a world x each frame
// against the camera, so a thing at `far` 0.2 slides a fifth as fast as the
// ground when the view scrolls. That is the only depth in the game that is not
// a shade.

import { P, ROCK_SKY, CLOUDS_ON, CLOUDS_WANTED, CLOUD_TONE, CLOUD_UNDER, CLOUD_DRIFT,
         SMOG_TOP, SMOG_BAND,
         BIRD_TONE, BIRD_GAP, BIRD_FLOCK, BIRD_SPEED, BIRD_REACH, BIRD_DUST,
         BIRD_BOLT } from './config.js';
import { S } from './state.js';
import { frames } from './clock.js';
import { spawnChip, bell } from './dust.js';
import { ctx } from './render.js';

const BIRD_TAIL = P * 90;    // how far off either side of the view a lot may stretch

export const CLOUDS = [];
export const BIRDS = [];
let nextBirds = 0;

// The band of sky that is worth putting anything in: below the top of the view
// and above the height the rock is allowed to reach, so nothing up here ever
// crosses the works. A short window leaves a thin band; that is fine, it just
// means fewer things fit in it.
// Under the smog and above the rock. The haze lies along the very top of the
// window, so the clouds start below it: they are weather that has nothing to do
// with the works, and a pale cloud drawn through your own smoke would tie the two
// together in the one place the game wants them kept apart.
function band() {
  const top = S.camY + (SMOG_TOP + SMOG_BAND + 2) * P;
  // And deep enough to be a band. Pushing the top down under the haze squeezed
  // what was left against the rock's reserved sky, and four cells of headroom is
  // not somewhere clouds can sit at different heights. They are drawn behind the
  // ground line, so a low one goes behind the works rather than across it.
  const low = Math.max(top + P * 12, S.groundY - ROCK_SKY - P * 2);
  return { top, low };
}

function inBand() {
  const { top, low } = band();
  return top + Math.random() * (low - top);
}

// A cloud is a few flat bars stacked and stepped in, which is all a cloud has to
// be in a game drawn out of cells. Widest at the bottom, narrowing upwards, and
// never symmetrical.
function makeCloud(x) {
  const w = 10 + Math.floor(Math.random() * 12);
  const bars = [];
  let a = 0, b = w;
  for (let r = 0; r < 4; r++) {
    bars.push({ a, b, r });
    a += 1 + Math.floor(Math.random() * 3);
    b -= 1 + Math.floor(Math.random() * 3);
    if (b - a < 3) break;
  }
  const far = 0.14 + Math.random() * 0.22;
  return { x, y: inBand(), w, bars, far, vx: CLOUD_DRIFT * (0.5 + far) };
}

// Where a sky thing is on the screen right now, in world units across the view.
function acrossView(s) {
  return s.x - S.camX * s.far;
}

export function seedWeather() {
  CLOUDS.length = 0;
  BIRDS.length = 0;
  nextBirds = 0;
  // start with a sky already full, rather than one that fills up while it is
  // being looked at
  if (!CLOUDS_ON) return;
  for (let i = 0; i < CLOUDS_WANTED; i++) {
    const c = makeCloud(0);
    c.x = S.camX * c.far + (i + Math.random()) * (S.viewW / CLOUDS_WANTED) - c.w * P;
    CLOUDS.push(c);
  }
}

export function stepWeather(now) {
  const wide = S.viewW + P * 40;               // the strip a cloud wraps around

  while (CLOUDS_ON && CLOUDS.length < CLOUDS_WANTED) {
    const c = makeCloud(0);
    c.x = S.camX * c.far - c.w * P - P * 4;    // in off the left, going right
    CLOUDS.push(c);
  }
  // Scenery drifts in pixels a frame like everything else, so it too is stepped
  // by how long the frame was -- otherwise the sky slows down on a slow machine
  // while the clock behind it does not.
  const f = frames();
  for (const c of CLOUDS) {
    c.x += c.vx * f;
    const at = acrossView(c);
    if (at > S.viewW + P * 8) c.x -= wide;     // out the right, back in the left
    else if (at < -c.w * P - P * 8) c.x += wide;
  }

  if (!nextBirds) nextBirds = now + BIRD_GAP / 2;
  if (now >= nextBirds) {
    sendBirds();
    nextBirds = now + BIRD_GAP * (0.6 + Math.random() * 0.8);
  }
  for (let i = BIRDS.length - 1; i >= 0; i--) {
    const b = BIRDS[i];
    b.x += b.vx * f;
    b.y += Math.sin((b.x + b.sway) / 90) * 0.12 * f;   // a long lazy rise and fall
    b.flap += b.beat * f;
    // A lot is strung out well behind its leader, so the margin here has to be
    // wider than the tail is long or the stragglers are dropped before they fly
    const at = acrossView(b);
    if (at < -BIRD_TAIL || at > S.viewW + BIRD_TAIL) BIRDS.splice(i, 1);
  }
}

// what is up there, for the checks: everything they need to see is a position,
// and a position in sky coordinates is not one anybody outside here can work out
export function skyReport() {
  const { top, low } = band();
  const across = s => Math.round(acrossView(s));
  return {
    clouds: CLOUDS.length,
    birds: BIRDS.length,
    top: Math.round(top),
    low: Math.round(low),
    cloudY: CLOUDS.map(c => Math.round(c.y)),
    cloudAcross: CLOUDS.map(across),
    birdY: BIRDS.map(b => Math.round(b.y)),
    birdAcross: BIRDS.map(across),
    birdWorld: BIRDS.map(b => ({ x: skyX(b), y: Math.round(b.y / P) * P })),
    drifts: CLOUDS.every(c => c.vx > 0),
    fars: CLOUDS.map(c => +c.far.toFixed(2))
  };
}

// A few birds, strung out rather than in a formation: same heading, each a
// little behind and a little off the last.
export function sendBirds() {
  const dir = Math.random() < 0.5 ? 1 : -1;
  const far = 0.35 + Math.random() * 0.3;
  const y = inBand();
  const speed = BIRD_SPEED * (0.7 + Math.random() * 0.6) * dir;
  const from = dir > 0 ? -P * 8 : S.viewW + P * 8;
  const n = 2 + Math.floor(Math.random() * (BIRD_FLOCK - 1));
  for (let i = 0; i < n; i++) {
    BIRDS.push({
      x: S.camX * far + from - dir * i * (P * 6 + Math.random() * P * 8),
      y: y + (Math.random() - 0.5) * P * 6,
      vx: speed,
      far,
      sway: Math.random() * 1000,
      flap: Math.random() * 10,
      beat: 0.12 + Math.random() * 0.06
    });
  }
}

// A bird is worth a click. It carries nothing -- what it drops is a few grains
// shaken loose as it bolts, and they are not thrown anywhere: they fall from
// where the bird was and land wherever under it the ground happens to be. The
// rest of the lot break for it too: a flock that carried on in formation after
// one of them was startled would say the click had not landed.
// close enough to one to knock it off its line
export const overBird = (wx, wy) =>
  BIRDS.some(b => Math.abs(wx - skyX(b)) <= BIRD_REACH && Math.abs(wy - b.y) <= BIRD_REACH);

export function startle(wx, wy) {
  for (let i = 0; i < BIRDS.length; i++) {
    const b = BIRDS[i];
    if (Math.abs(wx - skyX(b)) > BIRD_REACH || Math.abs(wy - b.y) > BIRD_REACH) continue;

    const from = skyX(b);
    for (let n = 0; n < BIRD_DUST; n++) {
      // no arc and no target: a small sideways nudge so the few of them do not
      // fall down the one line, and gravity does the rest
      // the two palest shades, and never 0: a cell of 0 is an empty one, and a
      // grain spawned as one lands nowhere and is counted as nothing
      spawnChip(from, b.y, bell() * 0.3, 0, 1 + Math.floor(Math.random() * 2));
    }

    BIRDS.splice(i, 1);
    for (const other of BIRDS) {
      if (Math.abs(other.y - b.y) > P * 30) continue;    // the ones it was flying with
      other.vx *= BIRD_BOLT;
      other.beat *= BIRD_BOLT;
    }
    S.dirty = true;
    return BIRD_DUST;
  }
  return 0;
}

// Both are drawn inside the world transform, so a cell is still a cell, but at
// their own x: the camera has already been taken off, so putting the parallax
// back on is what leaves them moving slowly. Rounded to whole cells, or the
// bars land between device pixels and go soft.
function skyX(s) {
  return Math.round((s.x + S.camX * (1 - s.far)) / P) * P;
}

export function drawClouds() {
  for (const c of CLOUDS) {
    const x = skyX(c);
    const y = Math.round(c.y / P) * P;
    for (const bar of c.bars) {
      ctx.fillStyle = bar.r ? CLOUD_TONE : CLOUD_UNDER;   // the underside is the darker one
      ctx.fillRect(x + bar.a * P, y - (bar.r + 1) * P, (bar.b - bar.a) * P, P);
    }
  }
  ctx.fillStyle = '#000';
}

export function drawBirds() {
  ctx.fillStyle = BIRD_TONE;
  for (const b of BIRDS) {
    const x = skyX(b);
    const y = Math.round(b.y / P) * P;
    // Three cells: a body, and two wingtips that swap from above it to below.
    // A pose with the wings level with the body is a dash rather than a bird, so
    // there isn't one -- it goes straight from a V to a caret, and that flick is
    // the whole wingbeat.
    const up = Math.floor(b.flap) % 2 ? -P : P;
    ctx.fillRect(x, y, P, P);
    ctx.fillRect(x - P, y + up, P, P);
    ctx.fillRect(x + P, y + up, P, P);
  }
  ctx.fillStyle = '#000';
}
