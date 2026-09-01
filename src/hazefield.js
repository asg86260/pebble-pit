// The sky, as a picture of one number.
//
// The pollution in this game is a scalar and always has been: `S.haze` is what
// the board reads, what the rain compares against, what the report prints and
// what the save writes down, and nothing anywhere asks where a mote is. The band
// in `smog.js` exists to *store* that number -- `reckon` sets it from the count
// and `motesWanted` converts straight back -- so every bit of detail in it is
// detail carrying no information, which is why it reads as noise. See DESIGN.md,
// "The sky is one number".
//
// This is the replacement, and the one rule it keeps from the band is the one
// that matters: **the sky is still cells.** Not a tint and not a gradient -- the
// art rule at the top of DESIGN.md says flat shapes, no textures, no gradients,
// and a wash over the sky would have been the first gradient in the game. What
// rising pollution does is fill the sky in.
//
// **A cell is painted when its own threshold falls under the density.** Every
// cell has a fixed threshold out of the field below, so the order they come in
// never changes: raise the density and cells are *added*, lower it and they go
// in the reverse order, and the ones already painted stay painted throughout.
// That is the whole trick. Re-rolling the field each frame, or each time the
// number moves, reads as television snow however correct the count is; this
// thickens.
//
// It carries the level on two axes and gets the second one for free. How far a
// cell's threshold is *under* the density is how deep in the haze it is, so as
// the level rises the cells already painted darken while new ones appear pale at
// the edges of the patches. Coverage first, then weight, out of one comparison
// -- and the patches get soft edges without anything being drawn softly.
//
// Nothing here is stepped by the draw. `stepHaze` moves the drift and the sim
// calls it; a clock kept by the draw loop runs at double speed the moment
// anything draws the yard twice in a frame -- a thumbnail, a second pass, the
// harness -- and cannot be asked about by anything that does not draw. The same
// lesson the scrubbing house's bellows learned.

import { P, SMOG_CAP, SMOG_TINTS,
         HAZE_NOISE_W, HAZE_NOISE_H, HAZE_CLUMP, HAZE_COARSE, HAZE_FINE,
         HAZE_DRIFT, HAZE_GAIN, HAZE_FADE, HAZE_CELL_INK, HAZE_GIVE,
         HAZE_CONTRAST, HAZE_CURVE, HAZE_RISE, HAZE_FAR,
         HAZE_SKY_GAP } from './config.js';
import { S } from './state.js';
import { ctx } from './render.js';
import { windAt } from './wind.js';
import { now } from './clock.js';
import { hazeShares } from './smog.js';

// --- the threshold field ----------------------------------------------------------
// Built once, from a hash of its own coordinates rather than from `rand()`.
//
// That is deliberate and not a shortcut. `rand()` is the game's seeded stream,
// and a module drawing from it at load time shifts every draw the game makes
// afterwards -- so a check that passes today fails the day somebody changes how
// many cells the sky is. The field is the same field in every run of the game,
// which is what a fixed piece of scenery ought to be.
const hash = (x, y) => {
  // One integer hash, mixed enough that neighbouring cells are unrelated.
  let h = (x * 374761393 + y * 668265263) | 0;
  h = (h ^ (h >>> 13)) * 1274126177 | 0;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};

// Smoothed, so the interpolation between lattice points has no creases in it. A
// straight lerp between random values gives a field of diamonds, and diamonds in
// the sky read as a pattern rather than as weather.
const ease = t => t * t * (3 - 2 * t);

// One octave of tileable value noise, sampled at cell (c, r).
//
// Said in **cells per patch** rather than in periods across the field, which is
// the same number from the useful end: a patch of sixteen is a blob sixteen
// cells across wherever the field happens to be sampled, and that is the thing
// anybody tuning this actually wants to set.
//
// It has to divide both the width and the height of the field, and that is not
// a nicety. The first cut took a period across and half of it down, which comes
// out fractional in one axis and does not divide the height in the other -- so
// the field did not wrap vertically, and what it drew was four fat horizontal
// bands of haze with clean air ruled between them. A seam in a tiling field is
// a line across the sky.
//
// Tileable because the field repeats: the sky is wider than any field worth
// keeping in memory. Taking the lattice indices modulo the octave's own period
// in each axis is the whole of what makes it wrap.
function octave(c, r, g, seed) {
  const px = Math.max(1, Math.round(HAZE_NOISE_W / g));   // lattice squares across
  const py = Math.max(1, Math.round(HAZE_NOISE_H / g));   // and down
  const x = c / g, y = r / g;
  const x0 = Math.floor(x), y0 = Math.floor(y);
  const fx = ease(x - x0), fy = ease(y - y0);
  const wrap = (v, n) => ((v % n) + n) % n;
  const ax = wrap(x0, px), bx = wrap(x0 + 1, px);
  const ay = wrap(y0, py), by = wrap(y0 + 1, py);
  const p00 = hash(ax + seed, ay), p10 = hash(bx + seed, ay);
  const p01 = hash(ax + seed, by), p11 = hash(bx + seed, by);
  return (p00 * (1 - fx) + p10 * fx) * (1 - fy) + (p01 * (1 - fx) + p11 * fx) * fy;
}

// The field itself. Blue noise, with the octaves above kept only for the
// clumping knob -- see `buildField`, which is where the reasoning is.
const FIELD = new Float32Array(HAZE_NOISE_W * HAZE_NOISE_H);

// Built once -- and rebuilt if the clumping is dialled, which is the one input
// to it that is on the tunable panel.
//
// Everything else the field is drawn with is read per frame, so it can be turned
// while looking at the sky. This one is baked in at build time, and a knob that
// silently does nothing is worse than no knob: it tells you the thing you are
// changing does not matter. So the build remembers what it was built with and
// does itself again when that moves.
let builtWith = null;

function buildField() {
  const N = HAZE_NOISE_W * HAZE_NOISE_H;
  const wrap = (c, r) =>
    (((r % HAZE_NOISE_H) + HAZE_NOISE_H) % HAZE_NOISE_H) * HAZE_NOISE_W
    + (((c % HAZE_NOISE_W) + HAZE_NOISE_W) % HAZE_NOISE_W);

  // Ranked: every value replaced by its place in the sorted order, so the field
  // is exactly uniform over nought-to-one. That is what makes the density mean
  // what it says -- paint every cell under `d` and exactly `d` of the sky is
  // painted, at any `d`, with no calibration curve in between.
  const rank = v => {
    const order = Array.from(v.keys()).sort((a, b) => v[a] - v[b]);
    const out = new Float32Array(N);
    for (let i = 0; i < N; i++) out[order[i]] = i / N;
    return out;
  };

  // A small separable blur, wrapping, so the high-pass below has something to
  // take away.
  const K = [1, 4, 7, 4, 1], KS = 17;
  const blur = v => {
    const t = new Float32Array(N), out = new Float32Array(N);
    for (let r = 0; r < HAZE_NOISE_H; r++)
      for (let c = 0; c < HAZE_NOISE_W; c++) {
        let s = 0;
        for (let k = -2; k <= 2; k++) s += K[k + 2] * v[wrap(c + k, r)];
        t[r * HAZE_NOISE_W + c] = s / KS;
      }
    for (let r = 0; r < HAZE_NOISE_H; r++)
      for (let c = 0; c < HAZE_NOISE_W; c++) {
        let s = 0;
        for (let k = -2; k <= 2; k++) s += K[k + 2] * t[wrap(c, r + k)];
        out[r * HAZE_NOISE_W + c] = s / KS;
      }
    return out;
  };

  // **Blue noise, and this is the whole of why the sky stopped being blotchy.**
  //
  // An even scatter of specks is not what you get by giving every cell an
  // independent random threshold. White noise *clumps on its own*: measured over
  // eight-by-eight blocks of a middling sky, the ink came out anywhere between
  // 0.23 and 0.54 -- a two-fold swing in how dark one patch of sky is against
  // another, with no clumping term anywhere in the code. Those were the grey
  // blobs, and turning the clumping down to nothing did not touch them, because
  // they were never the clumping.
  //
  // What removes them is taking the low frequencies out of the noise: blur it,
  // subtract the blur, and re-rank so it is uniform again. Three passes takes
  // the block-to-block spread from 0.056 to 0.029 -- half -- and what is left is
  // a field where every part of the sky carries very nearly the same share of
  // the level, which is the thing that was asked for.
  let v = new Float32Array(N);
  for (let r = 0; r < HAZE_NOISE_H; r++)
    for (let c = 0; c < HAZE_NOISE_W; c++) v[r * HAZE_NOISE_W + c] = hash(c + 5, r + 11);
  for (let pass = 0; pass < 3; pass++) {
    const b = blur(v);
    const hp = new Float32Array(N);
    for (let i = 0; i < N; i++) hp[i] = v[i] - b[i];
    v = rank(hp);
  }

  // The clumping goes on *after* the high-pass, because it is the one piece of
  // low frequency that is wanted on purpose. It defaults to nothing -- haze is
  // specks, and patches are cloud -- and it is on the panel for when a sky wants
  // some weather in it.
  if (HAZE_CLUMP > 0) {
    const mixed = new Float32Array(N);
    for (let r = 0; r < HAZE_NOISE_H; r++)
      for (let c = 0; c < HAZE_NOISE_W; c++) {
        const i = r * HAZE_NOISE_W + c;
        const clump = octave(c, r, HAZE_COARSE, 0) * 0.6
                    + octave(c, r, HAZE_FINE, 7919) * 0.4;
        mixed[i] = v[i] * (1 - HAZE_CLUMP) + clump * HAZE_CLUMP;
      }
    v = rank(mixed);
  }

  // and pulled in towards the middle, which decides how much of the picture is
  // *whether* a cell is painted and how much is how heavily. At one it is all
  // coverage, and coverage is exactly the density.
  for (let i = 0; i < N; i++) FIELD[i] = 0.5 + (v[i] - 0.5) * HAZE_CONTRAST;
  builtWith = `${HAZE_CLUMP}|${HAZE_CONTRAST}`;
}

const field = () => {
  if (builtWith !== `${HAZE_CLUMP}|${HAZE_CONTRAST}`) buildField();
  return FIELD;
};

const at = (c, r) => {
  const x = ((c % HAZE_NOISE_W) + HAZE_NOISE_W) % HAZE_NOISE_W;
  const y = ((r % HAZE_NOISE_H) + HAZE_NOISE_H) % HAZE_NOISE_H;
  return FIELD[y * HAZE_NOISE_W + x];
};

// --- the drift --------------------------------------------------------------------
// The field slides through the cells rather than the cells moving, so everything
// stays on the lattice and stays crisp: what moves is which part of the field
// each cell is asking about. In whole cells, because a cell is the smallest
// thing this game draws and half a cell of haze is not a picture it can make.
//
// **It moves two ways at once, and in two lanes**, and all of that is the answer
// to one complaint: a single field sliding sideways is a sheet of card being
// pulled past the window. It has the right speed and none of the life.
//
//   *Sideways*, on the wind, sign and all -- so the sky leans with the gusts and
//   stalls in a lull, the same number the band's own creep runs on.
//
//   *Upward*, always, and this is the one that fixes the still picture. Smoke
//   rises. A haze that only ever went sideways stopped dead every time the wind
//   crossed zero, which is exactly when you notice it is a texture; the rise
//   never stops, so the sky is never doing nothing.
//
//   And in *two lanes*: each cell belongs to one of them for good, by its own
//   hash, and the far lane creeps at a fraction of the near one's pace. Two
//   depths of haze passing each other is what gives it any body at all -- with
//   one lane, every speck in the sky moves as one piece, and a thing that only
//   translates does not read as moving so much as as being moved.
//
// The lanes are a **fixed property of the cell**, not of the sample, so nothing
// swaps lanes as the field slides. What a cell does is come and go as different
// parts of the field pass under it, and the two lanes doing that out of step is
// the whole of the billow.
let creepX = 0, creepY = 0;

export function stepHaze(secs) {
  creepX += secs * HAZE_DRIFT * windAt(now());
  creepY -= secs * HAZE_RISE;          // up the window, because smoke goes up
}


// Handed out for the checks and the console: the field is scenery, so there is
// nothing here worth saving, but there is something worth being able to ask.
export const hazeCreep = () => ({ x: creepX, y: creepY });

// --- how much of it there is -------------------------------------------------------
// The one number, as a fraction of the field that is painted.
//
// Against `SMOG_CAP` rather than against the rain threshold: the cap is what the
// sky can actually hold, and a scale that topped out where it rains would spend
// the whole of a bad sky pinned at its own maximum with nothing left to say.
// Bent rather than straight, because a straight one spends the first third of
// the range invisible: a fifth of a sky paints a fifth of the field and every
// cell of it at the faintest weight the paper can honestly carry. Bent, the sky
// says something early and still has somewhere to go at the top.
export const hazeDensity = () => {
  const at = Math.max(0, Math.min(1, (S.haze || 0) / SMOG_CAP));
  return Math.pow(at, HAZE_CURVE) * HAZE_GAIN;
};

// --- drawing it ---------------------------------------------------------------------
// Batched by colour and weight into runs of `fillRect`, the way `drawSmog` is
// and for the same reason: one path with two thousand rectangles in it makes the
// browser tessellate the lot before it lays down a pixel, and `fillRect` never
// builds a path at all.
export function drawHaze() {
  const density = hazeDensity();
  if (density <= 0) return;
  field();                        // rebuilt only if the clumping has been dialled

  // The sky, in cells: the top of the view down to a little clear air above the
  // ground line.
  //
  // It stops at the ground line and it is the whole point that it does. The yard
  // reads exactly the same at a filthy sky as at a clean one -- nothing the
  // player is actually looking at has to be read through the haze -- and what
  // that buys is a sky that can be allowed to get properly bad.
  const top = Math.floor(S.camY / P);
  const bot = Math.floor((S.groundY - HAZE_SKY_GAP * P) / P);
  if (bot <= top) return;
  const left = Math.floor(S.camX / P);
  const right = Math.ceil((S.camX + S.viewW) / P);

  // Which way the field has slid, in whole cells, per lane. The far lane goes at
  // a fraction of the near one's pace in both axes -- one number, so the two
  // lanes never drift out of the same weather.
  const offX = [Math.round(creepX), Math.round(creepX * HAZE_FAR)];
  const offY = [Math.round(creepY), Math.round(creepY * HAZE_FAR)];

  // What is dirtying it, as a set of running totals to pick a kind out of. A
  // cell keeps whichever kind its own hash lands on, so the sky does not shimmer
  // between colours frame to frame -- and as the mix moves, cells change hands
  // slowly and a few at a time, which is what a sky changing what it is made of
  // ought to look like.
  const shares = hazeShares();
  const kinds = [], upto = [];
  let run = 0;
  for (const k of Object.keys(shares)) {
    if (!shares[k]) continue;
    run += shares[k];
    kinds.push(k);
    upto.push(run);
  }
  if (!kinds.length) { kinds.push('mach'); upto.push(1); }

  const runs = new Map();
  for (let r = top; r <= bot; r++) {
    for (let c = left; c <= right; c++) {
      // **Two layers, blended, rather than two lanes of cells.**
      //
      // Both were tried. Splitting the cells between a near lane and a far one
      // gives depth and throws away the whole of the blue noise with it -- half
      // the sky reading one part of the field and half another is two
      // uncorrelated scatters interleaved, which is white noise again by
      // another route, and the blotches came straight back (0.050 against
      // 0.031 over eight-by-eight blocks; white noise was 0.056).
      //
      // Every cell reading *both* layers and averaging what they say does the
      // opposite. Averaging two fields has less variance than either, so the
      // sky came out more even than a single layer (0.025), and a cell fading
      // between two drifting fields is a better picture of haze than a cell
      // belonging to one of them: it billows instead of sliding.
      const over0 = density - at(c + offX[0], r + offY[0]);
      const over1 = density - at(c + offX[1], r + offY[1]);
      // How deep in the haze each layer says this cell is, which is its weight.
      // A cell only just come in is faint; one the density has long passed is at
      // full ink. So the level goes on being readable after the sky has run out
      // of room to get any fuller, and the edges are soft without anything being
      // drawn softly.
      const deep = ((over0 > 0 ? Math.min(1, over0 / HAZE_FADE) : 0)
                  + (over1 > 0 ? Math.min(1, over1 / HAZE_FADE) : 0)) / 2;
      if (deep <= 0) continue;

      // Its own colour and its own weight, both fixed on the cell. A second hash
      // rather than the field's own value, or the palest cells would all be one
      // shade and the darkest another, and the sky would band.
      const h = hash(c + offX[0] + 104729, r + offY[0] + 15485863);
      let kind = kinds[kinds.length - 1];
      for (let i = 0; i < upto.length; i++) if (h < upto[i]) { kind = kinds[i]; break; }
      const shades = SMOG_TINTS[kind] || SMOG_TINTS.mach;
      const g = hash(c + offX[0], r + offY[0] + 32452843);
      const tint = shades[Math.floor(g * shades.length) % shades.length];
      // a fifth either side of the weight, so a painted sky is smoke of
      // different thicknesses rather than a screen of identical squares
      const ink = deep * HAZE_CELL_INK * (1 - HAZE_GIVE + g * HAZE_GIVE * 2);

      // to the nearest twentieth, so the weights fall into a handful of buckets
      const step = Math.round(ink * 20) / 20;
      if (!step) continue;
      const key = tint + '|' + step;
      let bucket = runs.get(key);
      if (!bucket) runs.set(key, bucket = { tint, ink: step, at: [] });
      bucket.at.push(c * P, r * P);
    }
  }

  for (const bucket of runs.values()) {
    ctx.globalAlpha = bucket.ink;
    ctx.fillStyle = bucket.tint;
    const pts = bucket.at;
    for (let i = 0; i < pts.length; i += 2) ctx.fillRect(pts[i], pts[i + 1], P, P);
  }
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#000';
}
