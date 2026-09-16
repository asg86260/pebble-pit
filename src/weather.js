// What is in the sky, which is nothing that matters and is the point of it.
// Clouds slide past at the back and now and then a few birds cross. Neither
// is ever in front of the rock: they are drawn with the far things, before
// the ground line.
//
// Both live in *sky coordinates*: an x turned into a world x each frame
// against the camera, so a thing at `far` 0.2 slides a fifth as fast as the
// ground when the view scrolls.

import { P, ROCK_SKY, CLOUDS_ON, CLOUDS_WANTED, CLOUD_TONE, CLOUD_UNDER, CLOUD_DRIFT,
         CLOUD_TOP,
         BIRD_TONE, BIRD_GAP, BIRD_FLOCK, BIRD_SPEED, BIRD_REACH, BIRD_DUST,
         BIRD_BOLT } from './config.js';
import { S, floor } from './state.js';
import { frames } from './clock.js';
import { spawnChip, bell } from './dust.js';
import { ctx } from './render.js';
import { rand } from './rng.js';
import { sfx } from './audio.js';
import { earn } from './notices.js';

const BIRD_TAIL = P * 90;    // how far off either side of the view a lot may stretch

export const CLOUDS = [];
export const BIRDS = [];
let nextBirds = 0;

// The band of sky worth putting anything in: below the top of the view and
// above the height the rock is allowed to reach, so nothing up here ever
// crosses the works. The haze has the whole sky, so a cloud is seen through
// the works' own dirt.
function band() {
  const top = S.camY + CLOUD_TOP * P;
  // Deep enough to be a band; a low cloud goes behind the works rather than
  // across it, since they are drawn behind the ground line.
  const low = Math.max(top + P * 12, S.groundY - ROCK_SKY - P * 2);
  return { top, low };
}

function inBand() {
  const { top, low } = band();
  return top + rand() * (low - top);
}

// A cloud is a few flat bars stacked and stepped in: widest at the bottom,
// narrowing upward, and never symmetrical.
function makeCloud(x) {
  const w = 10 + Math.floor(rand() * 12);
  const bars = [];
  let a = 0, b = w;
  for (let r = 0; r < 4; r++) {
    bars.push({ a, b, r });
    a += 1 + Math.floor(rand() * 3);
    b -= 1 + Math.floor(rand() * 3);
    if (b - a < 3) break;
  }
  const far = 0.14 + rand() * 0.22;
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
    c.x = S.camX * c.far + (i + rand()) * (S.viewW / CLOUDS_WANTED) - c.w * P;
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
  // Pixels a frame, stepped by how long the frame was, or the sky slows down
  // on a slow machine while the clock behind it does not.
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
    nextBirds = now + BIRD_GAP * (0.6 + rand() * 0.8);
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

// what is up there, for the checks: a position in sky coordinates is not one
// anybody outside here can work out
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
  const dir = rand() < 0.5 ? 1 : -1;
  const far = 0.35 + rand() * 0.3;
  const y = inBand();
  const speed = BIRD_SPEED * (0.7 + rand() * 0.6) * dir;
  const from = dir > 0 ? -P * 8 : S.viewW + P * 8;
  const n = 2 + Math.floor(rand() * (BIRD_FLOCK - 1));
  // The lot they came in as, shared by all of them, is what says whether you
  // got the whole lot. On the birds rather than in the save because the birds
  // are not saved either.
  const lot = { n, hit: 0 };
  for (let i = 0; i < n; i++) {
    BIRDS.push({
      lot,
      x: S.camX * far + from - dir * i * (P * 6 + rand() * P * 8),
      y: y + (rand() - 0.5) * P * 6,
      vx: speed,
      far,
      sway: rand() * 1000,
      flap: rand() * 10,
      beat: 0.12 + rand() * 0.06
    });
  }
}

// close enough to one to knock it off its line
export const overBird = (wx, wy) =>
  BIRDS.some(b => Math.abs(wx - skyX(b)) <= BIRD_REACH && Math.abs(wy - b.y) <= BIRD_REACH);

// Ground a shaken grain could come to rest on, at a world x. Asked about
// where the bird is rather than where each grain will land: the only sideways
// push a shaken grain gets is `bell() * 0.3` of a pixel a frame, two or three
// cells over the whole fall, so that much margin answers it and no chip is
// traced.
const BIRD_DRIFT = P * 4;
const holdsDust = x =>
  x + BIRD_DRIFT > floor.x && x - BIRD_DRIFT < floor.x + floor.cols * floor.p;

// A bird is worth a click: a few grains shaken loose as it bolts, minted here
// rather than carried, falling from where the bird was. The rest of the lot
// break for it too.
export function startle(wx, wy) {
  for (let i = 0; i < BIRDS.length; i++) {
    const b = BIRDS[i];
    if (Math.abs(wx - skyX(b)) > BIRD_REACH || Math.abs(wy - b.y) > BIRD_REACH) continue;

    const from = skyX(b);
    // Nothing is shaken loose off the world, past either end of the floor
    // grid, where a grain has no column to land in and would walk inland
    // looking for one; since the grains are minted, a bird there drops none.
    // The mouths are deliberately not checked: dust let go over the hole
    // falls *in* the hole, and over the cut and the rock it rolls clear.
    if (holdsDust(from)) for (let n = 0; n < BIRD_DUST; n++) {
      // a small sideways nudge so the few of them do not fall down the one
      // line; the two palest shades, and never 0, because a grain spawned as
      // an empty cell lands nowhere and is counted as nothing
      spawnChip(from, b.y, bell() * 0.3, 0, 1 + Math.floor(rand() * 2));
    }

    BIRDS.splice(i, 1);
    earn('bird');
    if (b.lot && ++b.lot.hit >= b.lot.n) earn('wholelot');
    for (const other of BIRDS) {
      if (Math.abs(other.y - b.y) > P * 30) continue;    // the ones it was flying with
      other.vx *= BIRD_BOLT;
      other.beat *= BIRD_BOLT;
    }
    S.dirty = true;
    sfx('bird-startle', { x: from });       // your click landed on it
    return BIRD_DUST;
  }
  return 0;
}

// Drawn inside the world transform at their own x: the camera has already
// been taken off, so putting the parallax back on is what leaves them moving
// slowly. Rounded to whole cells, or the bars land between device pixels and
// go soft.
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
    // A body and two wingtips that swap from above it to below: straight from
    // a V to a caret, because wings level with the body is a dash.
    const up = Math.floor(b.flap) % 2 ? -P : P;
    ctx.fillRect(x, y, P, P);
    ctx.fillRect(x - P, y + up, P, P);
    ctx.fillRect(x + P, y + up, P, P);
  }
  ctx.fillStyle = '#000';
}
