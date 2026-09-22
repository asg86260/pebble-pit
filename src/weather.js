// What is in the sky, which is nothing that matters and is the point of it.
// Clouds slide past at the back and now and then a few birds cross. Neither
// is ever in front of the rock: they are drawn with the far things, before
// the ground line.
//
// Both live in *sky coordinates*: an x turned into a world x each frame
// against the camera, so a thing at `far` 0.2 slides a fifth as fast as the
// ground when the view scrolls.

import { P, ROCK_SKY, CLOUDS_ON, CLOUDS_WANTED, CLOUD_TONE, CLOUD_UNDER, CLOUD_DRIFT,
         CLOUD_LAYERS, CLOUD_FAR_JITTER, CLOUD_FLOOR, CLOUD_FADE_FAR, CLOUD_MELT_S, CLOUD_EDGE_STEPS, CLOUD_TONES, CLOUD_LIT, CLOUD_MID, CLOUD_SHADE_REACH, CLOUD_KINDS,
         CLOUD_SPINE_R, CLOUD_SPINE_LAP, CLOUD_SPINE_LOW, CLOUD_PUFF_R, CLOUD_PUFF_SINK,
         CLOUD_TOP, CLOUDS_STORM, CLOUD_SETTLE_S,
         CLOUD_GROW_R, CLOUD_LEAN, STORM_BREW_S,
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
// The clouds' band runs deeper than the birds': down to CLOUD_FLOOR above the
// ground line, behind the works, so the far sheet can sit low toward the
// horizon and the sky has a bottom as well as a top. The birds keep the
// shallow band, since a bird is a click and a click behind a stack is lost.
function cloudBand() {
  const { top } = band();
  return { top, low: Math.max(top + P * 12, S.groundY - CLOUD_FLOOR) };
}
// ...but never so high that its crown is off the top of the window on a dry
// day: a near cloud is tall, and a tall cloud cut flat at the top is a slab.
function cloudY(c) {
  const { top, low } = cloudBand();
  const fit = top + (c.tall + 1) * cellOf(c);
  return Math.max(fit, top + (c.yb ?? 0.5) * (low - top));
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
const fadeAt = far => CLOUD_FADE_FAR * (1 - (far - FAR_MIN) / (FAR_MAX - FAR_MIN));
// One cloud's colors this frame, crown to base: CLOUD_TONES steps between the
// two part colors, every step then faded toward the page by the cloud's depth
// -- the air takes the same share off every tone, so a far cloud's shades are
// pressed together as well as paler.
function cloudTones(crown, base, far, off = 0) {
  const fade = Math.min(1, fadeAt(far) + off * (1 - fadeAt(far))), out = [];
  for (let k = 0; k < CLOUD_TONES; k++) {
    let col = mix(crown, base, k / (CLOUD_TONES - 1));
    if (fade > 0) col = mix(col, PAGE, fade);
    out.push(col);
  }
  return out;
}

// A cell is not always all there. A cloud's outline is a circle's edge, which
// crosses a cell part way: how much of the cell the cloud fills is drawn as
// how far its tone has come up from the page, in CLOUD_EDGE_STEPS steps. So a
// cell arriving as the sky swells comes up out of the page, and one going as
// the front lets go goes back down into it, instead of either blinking. The
// styles are built as they are asked for and kept: a cloud uses a dozen at
// most, and building a string a cell would be a string a cell. The colors
// slide with the murk and the swell, so the table is emptied when it has
// grown past what a frame could want.
const STYLES = new Map();
function styleOf(col, k) {
  if (STYLES.size > 600) STYLES.clear();
  const key = `${col[0]|0},${col[1]|0},${col[2]|0},${k}`;
  let s = STYLES.get(key);
  if (s === undefined) {
    const c = k >= CLOUD_EDGE_STEPS ? col : mix(PAGE, col, k / CLOUD_EDGE_STEPS);
    s = `rgb(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])})`;
    STYLES.set(key, s);
  }
  return s;
}

// A cloud is one mass of circles on a flat base, the way a cumulus is: a
// spine of big ones sitting low along the base, overlapping heavily so the
// bottom is one long shape with rounded ends, and smaller puffs riding on
// the spine's surface, which is what gives the top its heaps and dips. Which
// kind of cumulus is drawn from CLOUD_KINDS -- a puff, a heap, a tower, a
// long low bank. A circle is `x` and `y` its center in cells from the base's
// left end (y negative, above the base) and `r` its radius; everything under
// the circles down to the base line is solid. Its `give` is its own share of
// the swell, so no two clouds grow a cell on the same frame and the sky never
// steps in lockstep -- read off its depth rather than drawn, because a draw
// here is a number off the yard's one generator at seed time and every seeded
// run, weather or not, would come out differently. A `storm` cloud is one the
// front brought, which is nothing at all until the swell has grown it and goes
// as the swell goes. `sheet` is which of CLOUD_LAYERS it is born into, and it
// stays there: its size, its depth and its lane in the band are the sheet's.
const between = ([a, b]) => a + rand() * (b - a);
const count = ([a, b]) => a + Math.floor(rand() * (b - a + 1));
function pickKind() {
  let x = rand() * CLOUD_KINDS.reduce((n, k) => n + k.share, 0);
  for (const k of CLOUD_KINDS) if ((x -= k.share) < 0) return k;
  return CLOUD_KINDS[CLOUD_KINDS.length - 1];
}
function makeCloud(x, sheet, storm = false) {
  const L = CLOUD_LAYERS[sheet];
  const kind = pickKind();
  const wide = (14 + Math.floor(rand() * 12)) * L.scale * between(kind.wide);
  const H = wide * between(kind.tall);
  const spine = [];
  let bx = 0;
  for (let i = 0, n = count(kind.spine); i < n; i++) {
    const r = H * between(CLOUD_SPINE_R);
    if (i) bx += (spine[i - 1].r + r) * between(CLOUD_SPINE_LAP);
    spine.push({ x: bx, r, y: -r * between(CLOUD_SPINE_LOW) });
  }
  const bumps = spine.slice();
  const x0 = spine[0].x, x1 = spine[spine.length - 1].x;
  for (let j = 0, m = count(kind.puffs); j < m; j++) {
    const px = x0 + rand() * (x1 - x0);
    // the spine's surface at px, for the puff to sit on
    let top = 0;
    for (const sp of spine) top = Math.max(top, -(sp.y - Math.sqrt(Math.max(0, sp.r * sp.r - (px - sp.x) ** 2))));
    const r = H * between(CLOUD_PUFF_R);
    bumps.push({ x: px, r, y: -(top - r * between(CLOUD_PUFF_SINK)) });
  }
  // the base runs from the leftmost circle's edge to the rightmost one's
  const left = Math.min(...bumps.map(b => b.x - b.r));
  for (const b of bumps) b.x -= left;
  const w = Math.ceil(Math.max(...bumps.map(b => b.x + b.r)));
  const off = rand() * 2 - 1;                // where in its sheet's thickness it sits
  const far = L.far + off * CLOUD_FAR_JITTER;
  const yb = L.lane[0] + rand() * (L.lane[1] - L.lane[0]);
  const c = { x, yb, w, bumps, far, sheet, vx: CLOUD_DRIFT * (0.5 + far),
              give: 0.7 + (off + 1) / 2 * 0.6, storm, tall: 0, melt: 0 };
  // its height on a dry day, in its own cells, for keeping its crown in view
  const { lo, hi, h } = columnsOf(c, 0);
  for (let cx = lo; cx <= hi; cx++) if ((h[cx] || 0) > c.tall) c.tall = h[cx];
  return c;
}

// a cloud's cell in world pixels: its sheet's
const cellOf = c => P * CLOUD_LAYERS[c.sheet].cell;

// A cloud on its way out, which is every cloud in the end: nothing in the sky
// blinks off. It thins from the bottom a cell at a time and climbs as it goes,
// paling toward the page, the way a cloud actually breaks up -- over
// CLOUD_MELT_S. A melting cloud no longer counts toward its sheet, so its
// replacement drifts in while it is still going.
const melting = c => c.melt > 0;
const fade = c => Math.min(1, c.melt) * 0.9;

// how many of a sheet's clouds are in the sky, not counting the ones going
const inSheet = (sheet, storm) => CLOUDS.reduce((n, c) => n + (c.sheet === sheet && c.storm === storm && !melting(c)), 0);

// The columns a cloud is drawn as this frame: for each column across it, how
// many cells stand above the base line, and how many of the lowest are the
// underside. Only the bumps' radii grow -- with the murk a little, with the
// storm's swell a lot -- and never their centers, so every column only ever
// gets taller as the swell climbs and the cloud never loses a cell on the way
// up. A storm cloud's radii are scaled by the swell, from nothing.
function columnsOf(c, sw) {
  const flat = CLOUD_LAYERS[c.sheet].flat;
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
      // the column's height under this bump, from the base line up to the
      // bump's top edge -- kept as it falls, fraction and all: the part of a
      // cell the cloud fills is what says how solid that cell is drawn, and
      // rounding here is what made a cell blink on and off as the sky swelled
      const top = -(b.y - Math.sqrt(d2)) * flat;
      if (top <= 0) continue;
      h[cx] = Math.max(h[cx] || 0, top);
      if (cx < lo) lo = cx; if (cx > hi) hi = cx;
    }
  }
  if (lo === Infinity) return { lo: 0, hi: -1, h: [], under: 0 };
  // The underside is one row, the flat base a cumulus has: a storm darkens
  // it rather than thickening it, since the shade above is the puffs' own.
  return { lo, hi, h, under: 1 };
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
  CLOUD_LAYERS.forEach((L, sheet) => {
    for (let i = 0; i < L.n; i++) {
      const c = makeCloud(0, sheet);
      c.x = S.camX * c.far + (i + rand()) * (S.viewW / L.n) - c.w * cellOf(c);
      CLOUDS.push(c);
    }
  });
}

export function stepWeather(now) {
  const wide = S.viewW + P * 40;               // the strip a cloud wraps around

  if (CLOUDS_ON) CLOUD_LAYERS.forEach((L, sheet) => {
    while (inSheet(sheet, false) < L.n) {
      const c = makeCloud(0, sheet);
      c.x = S.camX * c.far - c.w * cellOf(c) - P * 4;    // in off the left, going right
      CLOUDS.push(c);
    }
  });
  // The front's own clouds: more of them the heavier it is, born anywhere
  // across the strip since a storm cloud is nothing until the swell grows
  // it, and gone once the swell has let them shrink to nothing. Dealt round
  // the sheets from the nearest out, so the front is overhead first.
  const sw = swell();
  const want = Math.round((CLOUDS_STORM - CLOUDS_WANTED) * sw);
  let storms = CLOUDS.reduce((n, c) => n + c.storm, 0);
  while (CLOUDS_ON && storms < want) {
    const sheet = CLOUD_LAYERS.length - 1 - (storms % CLOUD_LAYERS.length);
    const c = makeCloud(0, sheet, true);
    c.x = S.camX * c.far + rand() * S.viewW - c.w * cellOf(c) / 2;
    CLOUDS.push(c);
    storms++;
  }
  // Pixels a frame, stepped by how long the frame was, or the sky slows down
  // on a slow machine while the clock behind it does not.
  const f = frames();
  // a swelled cloud leans with the wind the rain under it leans with
  const lean = gust() * CLOUD_LEAN * sw;
  const secs = f / 60;
  // the front has peaked and is letting go: neither brewing nor pouring
  const letting = !S.raining && S.stormFor < 0;
  for (let i = CLOUDS.length - 1; i >= 0; i--) {
    const c = CLOUDS[i];
    c.x += (c.vx + lean) * f;
    // A cloud melts once it is on its way out. One the front brought breaks up
    // as the front lets go of it -- its melt is the swell's own fall, so it is
    // gone exactly when the sky has settled, rather than hanging on after it.
    // Any other goes by the clock once it is off the end of the strip.
    const at = acrossView(c);
    if (c.storm && letting) c.melt = Math.max(c.melt, 1 - sw);
    else if (at > S.viewW + P * 8) c.melt = Math.max(c.melt, 1e-6) + secs / CLOUD_MELT_S;
    if (melting(c)) {
      if (c.melt >= 1) CLOUDS.splice(i, 1);
    } else if (at < -c.w * cellOf(c) - P * 8) {
      c.x += wide;                             // in off the left again, still whole
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
    if (at < -BIRD_TAIL || at > S.viewW + BIRD_TAIL) BIRDS.splice(i, 1);
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
    birdY: BIRDS.map(b => Math.round(b.y)),
    birdAcross: BIRDS.map(across),
    birdWorld: BIRDS.map(b => ({ x: skyX(b), y: Math.round(b.y / P) * P })),
    drifts: CLOUDS.every(c => c.vx > 0),
    fars: CLOUDS.map(c => +c.far.toFixed(2)),
    sheets: CLOUD_LAYERS.map((L, i) => inSheet(i, false)),
    melting: CLOUDS.filter(melting).length,
    // the front: how far the sky is swelled, and how many cells of cloud
    // are drawn, so a check can watch it grow a cell at a time
    swell: +swell().toFixed(3),
    storm: CLOUDS.filter(c => c.storm).length,
    cloudEach: CLOUDS.map(c => cellsOf(c, swell())),
    cloudCells: CLOUDS.reduce((n, c) => n + cellsOf(c, swell()), 0)
  };
}

// the cells a cloud is drawn as, for the report. Whole cells: a column's
// height is carried as a fraction now (the part of the top cell the cloud
// fills, which is how solid it is drawn), and counting those would make every
// cloud's count change on every frame.
function cellsOf(c, sw) {
  const { lo, hi, h } = columnsOf(c, sw);
  let n = 0;
  for (let cx = lo; cx <= hi; cx++) n += Math.ceil(h[cx] || 0);
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
// slowly. A bird's is rounded to whole cells, or its bars land between device
// pixels and go soft. A cloud's is not: it is snapped to device pixels as it
// is drawn, and rounding it to its cell first made it hop a cell at a time
// against a camera that scrolls smoothly.
const skyAt = s => s.x + S.camX * (1 - s.far);
const skyX = s => Math.round(skyAt(s) / P) * P;

// The tone of one cell, `cx` across and `r` rows above the base: lit from
// above, the way a rock cell is shaded by its depth into the rock. Its depth
// is how far it sits below the nearest bit of the cloud's top outline, looking
// up its own column and up to CLOUD_SHADE_REACH columns either side (a step
// sideways counting as one down), as a share of the cloud's height: the top
// CLOUD_LIT of it is lit, down to CLOUD_MID is the body, and below that is
// the shade -- so every puff is lit on top and the shade pools under the
// heaps and thins under the dips, which is what makes the top read as puffs
// rather than an outline. The base rows are the underside.
function cellTone(h, peak, cx, r, u) {
  if (r < u) return CLOUD_TONES - 1;
  let d = Infinity;
  for (let k = -CLOUD_SHADE_REACH; k <= CLOUD_SHADE_REACH; k++) {
    const n = h[cx + k] || 0;
    if (n > r) d = Math.min(d, n - 1 - r + Math.abs(k));
  }
  return d <= CLOUD_LIT * peak ? 0 : d <= CLOUD_MID * peak ? 1 : 2;
}

// Farthest first, so a near cloud covers a far one and the overlap is what
// says which is in front -- between the sheets and within one.
export function drawClouds() {
  const sw = swell(), mk = murk();
  const crown = partColor('body', mk, sw), base = partColor('under', mk, sw);
  // Cut at the top of the window: a storm swollen past it is a ceiling there,
  // not a wall running up out of the sky. Not the band's top -- a cloud sits
  // *in* the band, base and all, and cutting there flattened every one that
  // rode high into the same slab.
  const top = S.camY;
  // Every edge snapped to a whole device pixel: a sheet's cell is not the
  // yard's, so its edges land between device pixels at most zooms, and two
  // fills meeting there blend into a hairline of page through the cloud.
  const k = S.zoom * S.dpr, snap = v => Math.round(v * k) / k;
  const order = CLOUDS.slice().sort((a, b) => a.far - b.far);
  for (const c of order) {
    const tones = cloudTones(crown, base, c.far, fade(c));
    const cp = P * CLOUD_LAYERS[c.sheet].cell;      // the sheet's cell, in pixels
    const x = skyAt(c), y = cloudY(c);
    const { lo, hi, h, under: u } = columnsOf(c, sw);
    let peak = 0;
    for (let cx = lo; cx <= hi; cx++) if ((h[cx] || 0) > peak) peak = h[cx];
    const cap = Math.min(Math.ceil(peak), Math.floor((y - top) / cp));   // clipped at the window's top
    // How far a melting cloud has been eaten off its bottom, in cells and
    // fractions of one: it is drawn that far up as well, so it climbs as it
    // thins, and the row it is halfway through is drawn half solid.
    const ate = c.melt * (peak + 1);
    // Row by row from the base up, runs of one style as one rect: cells
    // joined along the row rather than up the column, or every column's
    // edge is a seam once the zoom puts it between device pixels.
    for (let r = Math.floor(ate); r < cap; r++) {
      const below = Math.min(1, r + 1 - ate);      // how much of this row the melt has left
      let from = lo, style = null;
      for (let cx = lo; cx <= hi + 1; cx++) {
        let now = null;
        if (cx <= hi) {
          const fill = Math.min(below, (h[cx] || 0) - r);   // how much of this cell is cloud
          if (fill > 0) now = styleOf(tones[cellTone(h, peak, cx, r, u)],
                                      Math.max(1, Math.ceil(fill * CLOUD_EDGE_STEPS)));
        }
        if (now === style) continue;
        if (style) {
          const x0 = snap(x + from * cp), y0 = snap(y - (r + 1 - ate) * cp);
          ctx.fillStyle = style;
          ctx.fillRect(x0, y0, snap(x + cx * cp) - x0, snap(y - (r - ate) * cp) - y0);
        }
        style = now; from = cx;
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
