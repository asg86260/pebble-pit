// What is in the sky, which is nothing that matters and is the point of it.
// Clouds slide past at the back and now and then a few birds cross. Neither
// is ever in front of the rock: they are drawn with the far things, before
// the ground line.
//
// Both live in *sky coordinates*: an x turned into a world x each frame
// against the camera, so a thing at `far` 0.2 slides a fifth as fast as the
// ground when the view scrolls.

import { P, ROCK_SKY, CLOUDS_ON, CLOUD_TONE, CLOUD_UNDER, CLOUD_DRIFT,
         CLOUD_LAYERS, CLOUD_FAR_JITTER, CLOUD_FADE_FAR, CLOUD_LANES, CLOUD_TONES,
         CLOUD_SHAPES, CLOUD_R, CLOUD_GRAIN, CLOUD_BUDS, CLOUD_SINK,
         CLOUD_TOP, CLOUD_SETTLE_S,
         CLOUD_GROW_R, CLOUD_LEAN, STORM_BREW_S,
         CLOUD_MURK_GROW, CLOUD_MURK_TINT, CLOUD_MURK_POW, CLOUD_MURK_TONE, CLOUD_MURK_UNDER,
         CLOUD_STORM_TONE, CLOUD_STORM_UNDER, CLOUD_STORM_TINT, CLOUD_STORM_UNDER_TINT,
         SMOG_CAP, CLOUD_DRAWN_MAX,
         BIRD_TONE, BIRD_GAP, BIRD_FLOCK, BIRD_SPEED, BIRD_REACH, BIRD_DUST,
         BIRD_BOLT } from './config.js';
import { S, floor } from './state.js';
import { ambientFrames } from './clock.js';
import { dryTime } from './smog/rain.js';
import { gust } from './wind.js';
import { spawnChip, bell } from './dust.js';
import { ctx } from './render.js';
import { cloudLayer, restTiers } from './render/clouds.js';
import { rand } from './rng.js';
import { meet } from './met.js';
import { sfx } from './audio.js';
import { earn } from './notices.js';
import { smoothstep as smooth } from './motion.js';

const BIRD_TAIL = P * 90;    // how far off either side of the view a lot may stretch

export const CLOUDS = [];
export const BIRDS = [];
let nextBirds = 0;  // held: when the next birds come

// The band of sky worth putting anything in: below the top of the view and
// above the height the rock is allowed to reach, so nothing up here ever
// crosses the works. The haze has the whole sky, so a cloud is seen through
// the works' own dirt.
function band() {
  const top = skyCam().y + CLOUD_TOP * P;
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
// A cloud's base, measured down from the top of the window rather than as a
// share of anything: a share of a band whose bottom is the ground line slides
// every cloud up and down the sky as the window is resized, and the height
// clouds sit at has nothing to do with how tall the window is. `yb` is that
// depth, in world pixels, picked once at birth out of its sheet's lane, and
// nothing moves it after: a clamp that kept a tall crown under the top of the
// window pushed the near sheet -- which is the tall one -- below the sheets
// behind it, which is the one thing the lanes exist to prevent. A near cloud
// tall enough to be cut by the top of the window is a cloud overhead.
function cloudBand() {
  const top = skyCam().y + CLOUD_TOP * P;
  return { top, low: top + Math.max(...Object.values(CLOUD_LANES).map(l => l[1])) * P };
}
function cloudY(c) {
  return skyCam().y + CLOUD_TOP * P + (c.yb ?? 0);
}

// --- the front ---------------------------------------------------------------
// The clouds are the storm's warning. How far the sky is swelled, nought to
// one, is read off the storm's clock every frame and never kept: up through
// the brew, held through the pour, and down again over CLOUD_SETTLE_S once the
// shower has stopped -- so a reload mid-brew comes back at the same swell,
// and a game picked up again after one is a settled sky, like a dry one.
export function swell() {
  const heft = S.stormHeft || 0;
  if (S.stormFor >= 0) return heft * smooth(S.stormFor / STORM_BREW_S);
  if (S.raining) return heft;
  return heft * (1 - smooth(dryTime() / CLOUD_SETTLE_S));
}

// How dirty the whole sky is (smog/band.js): the clouds are its readout, and
// the air filter's dial reads the same number.
import { murk } from './smog/band.js';
import { GUESTS } from './skyguests.js';
import { skyCam } from './view.js';   // the yard's window, even with the deep on screen
import { held } from './reset.js';
export { murk };
// One cloud's murk: the sky's, less what a balloon drawing it in has paled it
// (`drawn`, eased by balloon.js). Picture only; the count is the sky's.
const murkOf = c => murk() * (1 - (c.drawn || 0) * CLOUD_DRAWN_MAX);

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
const PAGE = [255, 255, 255];
// The color of a cloud's crown or its base this frame: pale, browned by the
// murk up to CLOUD_MURK_TINT of the way, then greyed over that by the storm's
// swell.
function partColor(part, mk, sw) {
  let col = PALE[part];
  if (mk > 0) col = mix(col, MURKY[part], Math.min(1, mk) * CLOUD_MURK_TINT);
  if (sw > 0) col = mix(col, STORMY[part], Math.min(1, sw) * (part === 'under' ? CLOUD_STORM_UNDER_TINT : CLOUD_STORM_TINT));
  return col;
}
// The air between you and a depth: how far its tones go toward the page.
const FAR_MIN = CLOUD_LAYERS[0].far - CLOUD_FAR_JITTER;
const FAR_MAX = CLOUD_LAYERS[CLOUD_LAYERS.length - 1].far + CLOUD_FAR_JITTER;
// Exported, because the rain falls from these same sheets and has to be
// faded by the same air (`drawRainBack` in render/smog.js). Copied into the
// rain instead, the two would drift apart the first time a sheet moved.
export const fadeAt = far => CLOUD_FADE_FAR * (1 - (far - FAR_MIN) / (FAR_MAX - FAR_MIN));
// One flat color faded by a depth, for anything in the sky that is not a
// cloud: the same mix toward the page, so a far drop and a far cloud are the
// same distance away. Takes the hex the tone is written as and hands back a
// css string, since that is what a fill wants. Called a handful of times a
// frame (one per sheet per kind), never per drop.
const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
export const paled = (tone, far) => {
  const f = fadeAt(far);
  if (!(f > 0)) return tone;
  const c = mix(hex(tone), PAGE, f);
  return `rgb(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])})`;
};
// A tone taken a share of the way to the page, for a fade that is a fact
// about the thing rather than about its depth.
export const towardPage = (tone, k) => {
  const c = mix(hex(tone), PAGE, k);
  return `rgb(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])})`;
};
// One cloud's colors this frame, crown to base: CLOUD_TONES steps between the
// two part colors, every step then faded toward the page by the cloud's depth
// -- the air takes the same share off every tone, so a far cloud's shades are
// pressed together as well as paler.
function cloudTones(crown, base, far) {
  const fade = fadeAt(far), out = [];
  for (let k = 0; k < CLOUD_TONES; k++) {
    let col = mix(crown, base, k / (CLOUD_TONES - 1));
    if (fade > 0) col = mix(col, PAGE, fade);
    out.push(col);
  }
  return out;
}

// A cloud is the one cloud renderer's (render/clouds.js): puffs in tiers, a
// shape of CLOUD_SHAPES stood on a flat
// base, its puffs worked into one field and flowing on their own currents
// as it is drawn. Here it is the fact the game keeps: where it is, how deep,
// how fast it drifts, and `layer`, its puffs in its own window of cells
// (`cloudLayer`), sized for it at the fullest swell, its buds (CLOUD_BUDS)
// made with it and shut, so the window is never made again as it grows. The puffs are drawn from a stream of the cloud's
// own seed, one draw off the yard's generator: a drawing must not spend the
// yard's chance. Its `give` is its own share of the swell, so no two clouds
// grow a cell on the same frame and the sky never steps in lockstep -- read
// off its depth rather than drawn, because a draw here is a number off the
// yard's one generator at seed time and every seeded run, weather or not,
// would come out differently. `sheet` is which of CLOUD_LAYERS it is born into, and it stays there:
// its size, its grain and its depth are the sheet's. Its height is not --
// every cloud's base is in its sheet's lane (CLOUD_LANES).
const between = ([a, b]) => a + rand() * (b - a);
function pickShape(shares) {
  let x = rand() * Object.values(shares).reduce((n, k) => n + k, 0);
  for (const k in shares) if ((x -= shares[k]) < 0) return k;
  return Object.keys(shares)[0];
}
// How near a depth is, for the renderer's depth bands (CLOUDS_DEPTH_BANDS):
// nought the farthest sheet's air, one the nearest's -- the fade turned round,
// so the bands and the paling are the one depth.
const nearOf = far => 1 - fadeAt(far) / CLOUD_FADE_FAR;
function makeCloud(x, sheet) {
  const L = CLOUD_LAYERS[sheet];
  const kind = pickShape(CLOUD_SHAPES);
  const R = between(CLOUD_R) * L.scale * CLOUD_GRAIN;
  const seed = Math.floor(rand() * 1e9);
  const off = rand() * 2 - 1;                // where in its sheet's thickness it sits
  const far = L.far + off * CLOUD_FAR_JITTER;
  const yb = between(CLOUD_LANES[L.name]) * P;   // its base, in pixels below the band's top
  const layer = cloudLayer({ kind, R, seed, flat: L.flat, d: nearOf(far), grow: 1 + CLOUD_GROW_R, buds: CLOUD_BUDS });
  return { x, yb, w: layer.w, layer, far, sheet, vx: CLOUD_DRIFT * (0.5 + far),
           give: 0.7 + (off + 1) / 2 * 0.6 };
}

// a cloud's cell in world pixels: its sheet's
const cellOf = c => P * CLOUD_LAYERS[c.sheet].cell / CLOUD_GRAIN;

// how many of a sheet's clouds are in the sky
const inSheet = sheet => CLOUDS.reduce((n, c) => n + (c.sheet === sheet), 0);

// The swell as size: how the renderer scales a cloud's puffs this frame (a
// layer's `scale`, render/cloudgl.js) -- `r` their radii, `bud` how far its
// buds are open (`budOf`, render/clouds.js). The radii grow with the storm's
// swell and the murk alike, the buds with the swell alone, and never a
// puff's place: a bigger puff in the same place adds to every cell it
// reaches, and a bud opens out of a lobe's edge, so a growing cloud gains
// cells and never loses one.
function scaleOf(c, sw) {
  const s = Math.min(1, sw * c.give);
  const k = Math.min(1, s + Math.min(1, murkOf(c) * c.give) * CLOUD_MURK_GROW);
  return { r: 1 + CLOUD_GROW_R * k, bud: s };
}

// How far a cloud's base comes down as it grows (CLOUD_SINK), in world
// pixels: by its own share of the swell, like its grow.
const sinkOf = (c, sw) => CLOUD_SINK * P * Math.min(1, sw * c.give);

// Where a sky thing is on the screen right now, in world units across the view.
function acrossView(s) {
  return s.x - skyCam().x * s.far;
}

// A sky already full, rather than one that fills up while it is being looked
// at. Asked for here and done on the next frame (`spreadSky`), because this
// runs from `settleIntoWorld`, which is before the camera has been put where
// the save left it: a sky spread across the view at the old camera is a sky
// that is nowhere near the new one, and every cloud in it is wound back into
// the strip on the first frame -- which is the whole sky visibly rearranging
// itself a moment after the page comes up.
let toSpread = true;  // held: a sky to fill on the next frame
export function seedWeather() {
  if (!CLOUDS_ON) { CLOUDS.length = 0; return; }
  toSpread = true;
}
// The sky's own clock, in seconds: the clouds' currents run on it
// (render/yardsky.js). The background's clock, so a held scene holds them.
let skyT = 0;   // held: seconds of sky since the page came up
export const skyClock = () => skyT;
held('weather-timers', () => { nextBirds = 0; toSpread = true; skyT = 0; });

// A new run is a new sky. Only from the yard's own reset, never from the
// layout: the layout runs on every resize, and a sky cleared there is a
// window full of different clouds every time it is dragged. The clouds are
// drawn out of the run's own chance, so one left standing is a fact of the
// last run in this one -- which `the same seed is the same run` catches.
export function resetWeather() {
  CLOUDS.length = 0;
  BIRDS.length = 0;
  nextBirds = 0;
  toSpread = true;
}

// Fills whatever the sky is short of, spread evenly across the view. Only what
// is missing: called again on every relayout, and making a new sky there put a
// fresh set of clouds in the window every time it was resized and took the
// birds out of the air mid-flight.
function spreadSky() {
  CLOUD_LAYERS.forEach((L, sheet) => {
    for (let i = inSheet(sheet); i < L.n; i++) {
      const c = makeCloud(0, sheet);
      c.x = skyCam().x * c.far + (i + rand()) * (skyCam().w / L.n) - c.w * cellOf(c);
      CLOUDS.push(c);
    }
  });
}

export function stepWeather(now) {
  if (toSpread && CLOUDS_ON) { spreadSky(); toSpread = false; }

  if (CLOUDS_ON) CLOUD_LAYERS.forEach((L, sheet) => {
    while (inSheet(sheet) < L.n) {
      const c = makeCloud(0, sheet);
      c.x = skyCam().x * c.far - c.w * cellOf(c) - P * 4;    // in off the left, going right
      CLOUDS.push(c);
    }
  });
  const sw = swell();
  // Pixels a frame, stepped by how long the frame was, or the sky slows down
  // on a slow machine while the clock behind it does not -- on the
  // background's clock, which stands still while a scene holds the yard.
  const f = ambientFrames();
  // a swelled cloud leans with the wind the rain under it leans with
  const lean = gust() * CLOUD_LEAN * sw;
  const secs = f / 60;
  skyT += secs;
  for (let i = CLOUDS.length - 1; i >= 0; i--) {
    const c = CLOUDS[i];
    c.x += (c.vx + lean) * f;
    // A cloud wraps around the strip. It only ever crosses an edge well
    // outside the window, so nobody sees it go; melting it there would let a
    // jump of the camera strand one dissolving in the middle of the sky for
    // no reason anybody could see.
    //
    // The strip is the window's width plus the cloud's own, and a margin at
    // each end: a cloud that has just cleared one edge has to land clear of
    // the other, and a strip only as wide as the window landed a wide one with
    // its far end still showing -- which is a cloud popping in at the edge
    // while you scroll. Wound back in one step rather than shifted a strip at
    // a time, so a resize (which moves both ends) does not thrash it.
    const at = acrossView(c), wide = c.w * cellOf(c) + P * 32;
    const from = -(c.w * cellOf(c) + P * 16), span = skyCam().w + wide;
    if (at > skyCam().w + P * 16 || at < from) {
      c.x = from + (((at - from) % span) + span) % span + skyCam().x * c.far;
    }
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
    if (at < -BIRD_TAIL || at > skyCam().w + BIRD_TAIL) BIRDS.splice(i, 1);
  }
}

// what is up there, for the checks: a position in sky coordinates is not one
// anybody outside here can work out
export function skyReport() {
  const { top, low } = cloudBand();
  const across = s => Math.round(acrossView(s));
  return {
    clouds: CLOUDS.length,
    birds: BIRDS.length,
    top: Math.round(top),
    low: Math.round(low),
    cloudY: CLOUDS.map(c => Math.round(cloudY(c))),
    cloudAcross: CLOUDS.map(across),
    // and how wide each is on the screen, so a check can ask whether one was
    // in view when it wrapped
    cloudWide: CLOUDS.map(c => Math.round(c.w * cellOf(c))),
    cloudSheet: CLOUDS.map(c => c.sheet),
    birdY: BIRDS.map(b => Math.round(b.y)),
    birdAcross: BIRDS.map(across),
    birdWorld: BIRDS.map(b => ({ x: skyX(b), y: Math.round(b.y / P) * P })),
    drifts: CLOUDS.every(c => c.vx > 0),
    fars: CLOUDS.map(c => +c.far.toFixed(2)),
    sheets: CLOUD_LAYERS.map((L, i) => inSheet(i)),
    // the front: how far the sky is swelled, and how many cells of cloud
    // are drawn, so a check can watch it grow a cell at a time
    swell: +swell().toFixed(3),
    cloudEach: CLOUDS.map(c => cellsOf(c, swell())),
    cloudCells: CLOUDS.reduce((n, c) => n + cellsOf(c, swell()), 0)
  };
}

// The cells a cloud stands on this frame, for the report: the renderer's own
// field (`restTiers`) at the swell's scale, with every puff where it was made.
// Not where its current has carried it this second: the currents move every
// cloud's edge a cell this way or that on every frame, and the count is what
// the swell has done to the sky, which the currents never change. Kept until
// the scale moves, so the report's three asks a frame cost one.
let tiers = null;   // cache: scratch for restTiers
function cellsOf(c, sw) {
  const sc = scaleOf(c, sw);
  if (c.cells && c.cells.r === sc.r && c.cells.bud === sc.bud) return c.cells.n;
  let n = 0;
  tiers = restTiers(c.layer, sc, tiers && tiers.length === c.layer.w * c.layer.h ? tiers : null);
  for (let i = 0; i < tiers.length; i++) n += tiers[i] >= 0;
  c.cells = { r: sc.r, bud: sc.bud, n };
  return n;
}


// A few birds, strung out rather than in a formation: same heading, each a
// little behind and a little off the last.
export function sendBirds() {
  const dir = rand() < 0.5 ? 1 : -1;
  const far = 0.35 + rand() * 0.3;
  const y = inBand();
  const speed = BIRD_SPEED * (0.7 + rand() * 0.6) * dir;
  const from = dir > 0 ? -P * 8 : skyCam().w + P * 8;
  const n = 2 + Math.floor(rand() * (BIRD_FLOCK - 1));
  // The lot they came in as, shared by all of them, is what says whether you
  // got the whole lot. On the birds rather than in the save because the birds
  // are not saved either.
  const lot = { n, hit: 0 };
  meet('bird');
  for (let i = 0; i < n; i++) {
    BIRDS.push({
      lot,
      x: skyCam().x * far + from - dir * i * (P * 6 + rand() * P * 8),
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
// slowly. A bird's is rounded to whole cells, or its bars land between device
// pixels and go soft. A cloud's is not: it is snapped to device pixels as it
// is drawn, and rounding it to its cell first made it hop a cell at a time
// against a camera that scrolls smoothly.
const skyAt = s => s.x + skyCam().x * (1 - s.far);

// Where a balloon hangs under a cloud, in the cloud's own space: the middle of
// its base, as an `x` the camera is added to the way it is added to a cloud's
// (`skyAt`), the cloud's depth, and the base line, lowered as the cloud is.
export function cloudSpot(c) {
  return { x: c.x + c.layer.mid * cellOf(c), far: c.far, y: cloudY(c) + sinkOf(c, swell()) };
}
GUESTS.clouds = () => CLOUDS;
GUESTS.spot = cloudSpot;

// Things that live among the clouds and are drawn between their sheets by
// depth: the balloons (skyguests.js), asked each frame for a list of
// `{ far, draw }`, farthest drawn first, interleaved with the clouds.

// The color the air is this frame, as a cloud's underside shows it: what a
// balloon is drawing in is drawn in this (render/balloon.js), so the haze
// going into the box is the same brown the clouds are.
// The sky's cloud tones at depth `far`, lit crown to shaded base, as fill
// styles: the road up to heaven draws its clouds in these (render/road.js),
// so they are the yard's own sky continued, murk and storm and all.
export function roadTones(far) {
  const sw = swell(), mk = murk();
  return cloudTones(partColor('body', mk, sw), partColor('under', mk, sw), far)
    .map(c => `rgb(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])})`);
}

export function murkTone() {
  const col = partColor('under', murk(), swell());
  return `rgb(${Math.round(col[0])},${Math.round(col[1])},${Math.round(col[2])})`;
}
const skyX = s => Math.round(skyAt(s) / P) * P;

// A cloud as its drawing wants it this frame (render/yardsky.js): its
// window's left edge and its base line in the world, its sheet's cell, the
// swell as size, and its colors crown to base -- the sky's, or its own while
// a balloon draws it in -- faded by its depth.
export function cloudNow(c, sw = swell(), mk = murk()) {
  const own = c.drawn > 0.01 ? murkOf(c) : mk;
  return { x: skyAt(c), base: cloudY(c) + sinkOf(c, sw), cell: cellOf(c), scale: scaleOf(c, sw),
           tones: cloudTones(partColor('body', own, sw), partColor('under', own, sw), c.far) };
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
