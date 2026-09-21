// What is in the sky, which is nothing that matters and is the point of it.
// Clouds slide past at the back and now and then a few birds cross. Neither
// is ever in front of the rock: they are drawn with the far things, before
// the ground line.
//
// Both live in *sky coordinates*: an x turned into a world x each frame
// against the camera, so a thing at `far` 0.2 slides a fifth as fast as the
// ground when the view scrolls.

import { P, ROCK_SKY, CLOUDS_ON, CLOUDS_WANTED, CLOUD_TONE, CLOUD_UNDER, CLOUD_DRIFT,
         CLOUD_TOP, CLOUDS_STORM, CLOUD_SETTLE_S, CLOUD_GROW_W, CLOUD_GROW_ROWS,
         CLOUD_GROW_UNDER, CLOUD_LEAN, STORM_BREW_S,
         CLOUD_MURK_GROW, CLOUD_MURK_TINT, CLOUD_MURK_INK_AT, CLOUD_MURK_INK, CLOUD_MURK_GIVE,
         SMOG_CAP, SMOG_TINTS,
         BIRD_TONE, BIRD_GAP, BIRD_FLOCK, BIRD_SPEED, BIRD_REACH, BIRD_DUST,
         BIRD_BOLT } from './config.js';
import { S, floor } from './state.js';
import { frames } from './clock.js';
import { bornUnder, dryTime } from './smog/rain.js';
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
export const murk = () => Math.min(1, S.haze / SMOG_CAP);

// The smoke's browns, parsed once, and the clouds' two pales, so a cell can be
// slid from its pale toward a tint and on toward ink without a parse a frame.
const rgb = h => [parseInt(h.slice(1,3),16), parseInt(h.slice(3,5),16), parseInt(h.slice(5,7),16)];
const MURK_PAL = SMOG_TINTS.mach.map(rgb);
const PALE = { body: rgb(CLOUD_TONE), under: rgb(CLOUD_UNDER) };
const INK = [0, 0, 0];
const mix = (a, b, k) => [a[0]+(b[0]-a[0])*k, a[1]+(b[1]-a[1])*k, a[2]+(b[2]-a[2])*k];
// A stable per-cell number out of the cloud and the cell, so a cell keeps its
// tint and its weight frame to frame and the sky does not shimmer.
const hash = (a, b, cc) => { let h = (Math.imul(a|0,73856093) ^ Math.imul(b|0,19349663) ^ Math.imul(cc|0,83492791)) >>> 0; return ((h ^ (h>>>13)) >>> 0) / 4294967296; };
// The color a cloud cell is drawn this frame: its pale when the sky is clean,
// sliding toward its own smoke tint with the murk and, past MURK_INK_AT, on
// toward ink -- quantized, so cells of a color batch into one fill.
function murkColor(seed, cx, cy, part, mk) {
  const base = PALE[part];
  if (mk < 0.02) return base;
  const r = hash(seed, cx, cy);
  const tint = MURK_PAL[(r * 4) | 0];
  const give = 1 - CLOUD_MURK_GIVE + r * CLOUD_MURK_GIVE * 2;
  let col = mix(base, tint, Math.min(1, mk * CLOUD_MURK_TINT * give));
  if (mk > CLOUD_MURK_INK_AT)
    col = mix(col, INK, (mk - CLOUD_MURK_INK_AT) / (1 - CLOUD_MURK_INK_AT) * CLOUD_MURK_INK * give);
  return [Math.round(col[0]/8)*8, Math.round(col[1]/8)*8, Math.round(col[2]/8)*8];
}

// A cloud is a few flat bars stacked and stepped in: widest at the bottom,
// narrowing upward, and never symmetrical. Its `give` is its own share of the
// swell, so no two grow a cell on the same frame and the sky never steps in
// lockstep -- read off its depth rather than drawn, because a draw here is a
// number off the yard's one generator at seed time and every seeded run,
// weather or not, would come out differently. A `storm` cloud is one the
// front brought, which is nothing at all until the swell has grown it and
// goes as the swell goes.
function makeCloud(x, storm = false) {
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
  return { x, yb: rand(), w, bars, far, vx: CLOUD_DRIFT * (0.5 + far),
           give: 0.7 + (far - 0.14) / 0.22 * 0.6, storm };
}

// The bars a cloud is drawn as this frame, swelled: each widens at its foot
// more than at its crown, rows are added on top continuing the step, and
// the underside deepens by whole rows. All in whole cells, so a cloud grows
// a cell at a time; the per-cloud `give` puts each one's steps on frames of
// its own. A storm cloud is its whole self scaled by the swell.
function barsOf(c, sw) {
  // A cloud grows with the murk (a dirty sky is a heavier ceiling) and with
  // the storm's swell (a front is a bigger one), the two adding up to the cap.
  const k = Math.min(1, (sw + murk() * CLOUD_MURK_GROW) * c.give);
  const grow = Math.round(CLOUD_GROW_W / 2 * k);
  const scale = c.storm ? Math.min(1, sw * c.give) : 1;
  // Every row's width only ever grows with k -- the widening, the scale and
  // the rows continued off the crown all do -- so the cloud never loses a
  // cell on the way up. The rows too thin to draw are dropped last, for
  // that reason: a row continued off a crown that was itself too thin would
  // come and go as the crown crossed the line.
  const rows = [];
  for (const bar of c.bars) {
    const g = Math.max(0, grow - bar.r);
    // the width rounded once, on its own: rounding both ends can lose a cell
    // between them as the scale grows
    const a = Math.round((bar.a - g) * scale);
    rows.push({ a, b: a + Math.round((bar.b - bar.a + 2 * g) * scale), r: bar.r });
  }
  const crown = rows[rows.length - 1];
  const more = Math.round(CLOUD_GROW_ROWS * k);
  for (let r = 1; r <= more; r++)
    rows.push({ a: crown.a + 2 * r, b: crown.b - 2 * r, r: crown.r + r });
  return { bars: rows.filter(bar => bar.b - bar.a >= 3), under: Math.round(CLOUD_GROW_UNDER * k) };
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
  const { bars, under } = barsOf(c, sw);
  return bars.reduce((m, b) => m + (b.b - b.a), 0) + (bars[0] ? under * (bars[0].b - bars[0].a) : 0);
}

// Where rain is born: the underside of every cloud bar over the window, as
// world spans with the y of that underside. Both the water and the washed
// acid fall from here, so a light front rains in patches under what cloud
// there is and a full storm everywhere, the storm being a ceiling. Handed to
// the rain rather than imported by it (`bornUnder`), because weather.js
// reaches the renderer and rain.js is reached from the rules.
export function rainSpans() {
  const out = [];
  const sw = swell();
  const left = S.camX, right = S.camX + S.viewW;
  for (const c of CLOUDS) {
    const { bars, under } = barsOf(c, sw);
    const foot = bars[0];
    if (!foot) continue;
    const x = skyX(c);
    const x0 = Math.max(left, x + foot.a * P), x1 = Math.min(right, x + foot.b * P);
    if (x1 <= x0) continue;
    out.push({ x0, x1, y: Math.round(cloudY(c) / P) * P + under * P });
  }
  return out;
}
bornUnder(rainSpans);


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
  // A clean sky is the fast path: whole bars in the two pales, one fill a bar,
  // the way the clouds have always drawn. A dirty sky shades cell by cell, so
  // the cells are bucketed by their quantized color and each bucket filled in
  // one path -- a few dozen fills for the whole sky, not one a cell.
  if (mk < 0.02) {
    for (const c of CLOUDS) {
      const x = skyX(c), y = Math.round(cloudY(c) / P) * P;
      const { bars, under } = barsOf(c, sw);
      for (const bar of bars) {
        ctx.fillStyle = bar.r ? CLOUD_TONE : CLOUD_UNDER;
        ctx.fillRect(x + bar.a * P, y - (bar.r + 1) * P, (bar.b - bar.a) * P, P);
      }
      const foot = bars[0];
      if (foot) for (let k = 0; k < under; k++)
        ctx.fillRect(x + foot.a * P, y + k * P, (foot.b - foot.a) * P, P);
    }
    ctx.fillStyle = '#000';
    return;
  }
  const runs = new Map();
  const cell = (seed, wx, cx, cy, part) => {
    const col = murkColor(seed, cx, cy, part, mk);
    const key = (col[0] << 16) | (col[1] << 8) | col[2];
    let run = runs.get(key);
    if (!run) runs.set(key, run = { col, at: [] });
    run.at.push(wx, cy * P);
  };
  for (const c of CLOUDS) {
    const x = skyX(c), y = Math.round(cloudY(c) / P) * P;
    const seed = (c.seed * 1e6) | 0;
    const { bars, under } = barsOf(c, sw);
    for (const bar of bars) {
      const ry = (y - (bar.r + 1) * P) / P;
      for (let cx = bar.a; cx < bar.b; cx++) cell(seed, x + cx * P, cx, ry, bar.r ? 'body' : 'under');
    }
    const foot = bars[0];
    if (foot) for (let k = 0; k < under; k++) {
      const ry = (y + k * P) / P;
      for (let cx = foot.a; cx < foot.b; cx++) cell(seed, x + cx * P, cx, ry, 'under');
    }
  }
  for (const run of runs.values()) {
    ctx.fillStyle = `rgb(${run.col[0]},${run.col[1]},${run.col[2]})`;
    for (let i = 0; i < run.at.length; i += 2) ctx.fillRect(run.at[i], run.at[i + 1], P, P);
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
