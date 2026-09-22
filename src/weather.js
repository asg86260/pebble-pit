// What is in the sky, which is nothing that matters and is the point of it.
// Clouds slide past at the back and now and then a few birds cross. Neither
// is ever in front of the rock: they are drawn with the far things, before
// the ground line.
//
// Both live in *sky coordinates*: an x turned into a world x each frame
// against the camera, so a thing at `far` 0.2 slides a fifth as fast as the
// ground when the view scrolls.

import { P, ROCK_SKY, CLOUDS_ON, CLOUDS_WANTED, CLOUD_TONE, CLOUD_UNDER, CLOUD_DRIFT,
         CLOUD_TOP, CLOUDS_STORM, CLOUD_SETTLE_S,
         CLOUD_GROW_UNDER, CLOUD_GROW_R, CLOUD_LEAN, STORM_BREW_S,
         CLOUD_MURK_GROW, CLOUD_MURK_TINT, CLOUD_MURK_POW, CLOUD_MURK_TONE, CLOUD_MURK_UNDER,
         CLOUD_STORM_TONE, CLOUD_STORM_UNDER, CLOUD_STORM_TINT, CLOUD_STORM_UNDER_TINT,
         SMOG_CAP,
         BIRD_TONE, BIRD_GAP, BIRD_FLOCK, BIRD_SPEED, BIRD_REACH, BIRD_DUST,
         BIRD_BOLT } from './config.js';
import { S, floor } from './state.js';
import { frames } from './clock.js';
import { dryTime } from './smog/rain.js';
import { gust } from './wind.js';
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

// A cloud's height, worked out from the band every frame rather than fixed at
// birth: the band follows the camera, so a cloud born while the view sat one
// place would strand above or below it once the view moved (and the clouds are
// the sky now, so a stranded cloud is a missing sky). `yb` is its lane in the
// band, nought at the top to one at the bottom.
function cloudY(c) {
  const { top, low } = band();
  return top + (c.yb ?? 0.5) * (low - top);
}

// --- the front ---------------------------------------------------------------
// The clouds are the storm's warning. How far the sky is swelled, nought to
// one, is read off the storm's clock every frame and never kept: up through
// the brew, held through the pour, and down again over CLOUD_SETTLE_S once the
// shower has stopped -- so a reload mid-brew comes back at the same swell,
// and a game picked up again after one is a settled sky, like a dry one.
const smooth = k => { k = Math.max(0, Math.min(1, k)); return k * k * (3 - 2 * k); };
export function swell() {
  const heft = S.stormHeft || 0;
  if (S.stormFor >= 0) return heft * smooth(S.stormFor / STORM_BREW_S);
  if (S.raining) return heft;
  return heft * (1 - smooth(dryTime() / CLOUD_SETTLE_S));
}

// How dirty the whole sky is, nought to one: the one number the clouds are the
// readout of (DESIGN.md, "The sky is the clouds"). Not a mote's place -- the
// murk is the sky's total, and every cloud takes it together.
export const murk = () => Math.pow(Math.min(1, S.haze / SMOG_CAP), CLOUD_MURK_POW);

// The tones a cloud can be, parsed once: its two pales, the smoke's brown it
// slides toward with the murk (and stops at -- a dirty sky is a heavy brown,
// never black), and the cool grey a storm brings, which is weather and not
// dirt, so the two are told apart at a glance. Flat fills, deliberately: a
// cloud is a shape, and speckling it made it read as a heap of dirt.
const rgb = h => [parseInt(h.slice(1,3),16), parseInt(h.slice(3,5),16), parseInt(h.slice(5,7),16)];
const PALE = { body: rgb(CLOUD_TONE), under: rgb(CLOUD_UNDER) };
const MURKY = { body: rgb(CLOUD_MURK_TONE), under: rgb(CLOUD_MURK_UNDER) };
const STORMY = { body: rgb(CLOUD_STORM_TONE), under: rgb(CLOUD_STORM_UNDER) };
const mix = (a, b, k) => [a[0]+(b[0]-a[0])*k, a[1]+(b[1]-a[1])*k, a[2]+(b[2]-a[2])*k];
// The color a cloud's body or underside is this frame: pale, browned by the
// murk up to CLOUD_MURK_TINT of the way, then greyed over that by the storm's
// swell. One color a part a frame, so the sky is a handful of fills.
function cloudColor(part, mk, sw) {
  let col = PALE[part];
  if (mk > 0) col = mix(col, MURKY[part], Math.min(1, mk) * CLOUD_MURK_TINT);
  if (sw > 0) col = mix(col, STORMY[part], Math.min(1, sw) * (part === 'under' ? CLOUD_STORM_UNDER_TINT : CLOUD_STORM_TINT));
  return `rgb(${Math.round(col[0])},${Math.round(col[1])},${Math.round(col[2])})`;
}

// A cloud is one connected mass: round bumps along its width, packed closer
// than a radius so the top is a continuous scallop with no gaps and the
// bottom is the mass's own flat underside. The middle bumps sit highest, so
// the crown is in the middle. Its `give` is its own share of the swell, so no
// two clouds grow a cell on the same frame and the sky never steps in lockstep
// -- read off its depth rather than drawn, because a draw here is a number off
// the yard's one generator at seed time and every seeded run, weather or not,
// would come out differently. A `storm` cloud is one the front brought, which
// is nothing at all until the swell has grown it and goes as the swell goes.
function makeCloud(x, storm = false) {
  const w = 14 + Math.floor(rand() * 12);
  const r0 = w * 0.22;
  const bumps = [];
  let bx = r0 * 0.6;
  while (bx < w - r0 * 0.4) {
    const r = r0 * (0.7 + rand() * 0.45);
    bumps.push({ x: bx, r });
    bx += r * (0.75 + rand() * 0.25);        // closer than a radius: no gaps, but each bump its own
  }
  const n = bumps.length;
  bumps.forEach((b, i) => {
    const mid = 1 - Math.abs(i / Math.max(1, n - 1) - 0.5) * 2;
    b.y = -(b.r * 0.55 + mid * b.r * 0.3);   // its center, above the base line; the middle a little higher
  });
  const far = 0.14 + rand() * 0.22;
  return { x, yb: rand(), w, bumps, far, vx: CLOUD_DRIFT * (0.5 + far),
           give: 0.7 + (far - 0.14) / 0.22 * 0.6, storm };
}

// The columns a cloud is drawn as this frame: for each column across it, how
// many cells stand above the base line, and how many of the lowest are the
// underside. Only the bumps' radii grow -- with the murk a little, with the
// storm's swell a lot -- and never their centers, so every column only ever
// gets taller as the swell climbs and the cloud never loses a cell on the way
// up. A storm cloud's radii are scaled by the swell, from nothing.
function columnsOf(c, sw) {
  const k = Math.min(1, (sw + murk() * CLOUD_MURK_GROW) * c.give);
  const grow = 1 + CLOUD_GROW_R * k;
  const scale = (c.storm ? Math.min(1, sw * c.give) : 1) * grow;
  const h = [];
  let lo = Infinity, hi = -Infinity;
  for (const b of c.bumps) {
    const r = b.r * scale;
    const x0 = Math.floor(b.x - r), x1 = Math.ceil(b.x + r);
    for (let cx = x0; cx <= x1; cx++) {
      const dx = cx + 0.5 - b.x;
      const d2 = r * r - dx * dx;
      if (d2 <= 0) continue;
      // the column's height under this bump: from the base line up to the
      // bump's top edge, never below a whole cell
      const top = Math.ceil(-(b.y - Math.sqrt(d2)));
      if (top < 1) continue;
      h[cx] = Math.max(h[cx] || 0, top);
      if (cx < lo) lo = cx; if (cx > hi) hi = cx;
    }
  }
  if (lo === Infinity) return { lo: 0, hi: -1, h: [], under: 0 };
  return { lo, hi, h, under: 1 + Math.round(CLOUD_GROW_UNDER * sw) };
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
  // The front's own clouds: more of them the heavier it is, born anywhere
  // across the strip since a storm cloud is nothing until the swell grows
  // it, and gone once the swell has let them shrink to nothing.
  const sw = swell();
  const want = CLOUDS_WANTED + Math.round((CLOUDS_STORM - CLOUDS_WANTED) * sw);
  while (CLOUDS_ON && CLOUDS.length < want) {
    const c = makeCloud(0, true);
    c.x = S.camX * c.far + rand() * S.viewW - c.w * P / 2;
    CLOUDS.push(c);
  }
  if (sw <= 0) for (let i = CLOUDS.length - 1; i >= 0; i--) if (CLOUDS[i].storm) CLOUDS.splice(i, 1);
  // Pixels a frame, stepped by how long the frame was, or the sky slows down
  // on a slow machine while the clock behind it does not.
  const f = frames();
  // a swelled cloud leans with the wind the rain under it leans with
  const lean = gust() * CLOUD_LEAN * sw;
  for (const c of CLOUDS) {
    c.x += (c.vx + lean) * f;
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
    cloudY: CLOUDS.map(c => Math.round(cloudY(c))),
    cloudAcross: CLOUDS.map(across),
    birdY: BIRDS.map(b => Math.round(b.y)),
    birdAcross: BIRDS.map(across),
    birdWorld: BIRDS.map(b => ({ x: skyX(b), y: Math.round(b.y / P) * P })),
    drifts: CLOUDS.every(c => c.vx > 0),
    fars: CLOUDS.map(c => +c.far.toFixed(2)),
    // the front: how far the sky is swelled, and how many cells of cloud
    // are drawn, so a check can watch it grow a cell at a time
    swell: +swell().toFixed(3),
    storm: CLOUDS.filter(c => c.storm).length,
    cloudEach: CLOUDS.map(c => cellsOf(c, swell())),
    cloudCells: CLOUDS.reduce((n, c) => n + cellsOf(c, swell()), 0)
  };
}

// the cells a cloud is drawn as, for the report
function cellsOf(c, sw) {
  const { lo, hi, h } = columnsOf(c, sw);
  let n = 0;
  for (let cx = lo; cx <= hi; cx++) n += h[cx] || 0;
  return n;
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
  const sw = swell(), mk = murk();
  const body = cloudColor('body', mk, sw), under = cloudColor('under', mk, sw);
  // Cut at the top of the window: a storm swollen past it is a ceiling there,
  // not a wall running up out of the sky. Not the band's top -- a cloud sits
  // *in* the band, base and all, and cutting there flattened every one that
  // rode high into the same slab.
  const top = S.camY;
  for (const c of CLOUDS) {
    const x = skyX(c), y = Math.round(cloudY(c) / P) * P;
    const { lo, hi, h, under: u } = columnsOf(c, sw);
    // One rect a column for the body and one for the underside: a column is
    // always solid from its top to the base line, so two fills draw it.
    for (let cx = lo; cx <= hi; cx++) {
      const n = h[cx] || 0;
      if (!n) continue;
      const cxP = x + cx * P;
      const cap = Math.min(n, Math.floor((y - top) / P));   // clipped at the band's top
      if (cap <= 0) continue;
      const uu = Math.min(u, cap);
      ctx.fillStyle = under;
      ctx.fillRect(cxP, y - uu * P, P, uu * P);
      if (cap > uu) {
        ctx.fillStyle = body;
        ctx.fillRect(cxP, y - cap * P, P, (cap - uu) * P);
      }
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
