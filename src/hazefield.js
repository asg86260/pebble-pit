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
         HAZE_CONTRAST, HAZE_CURVE,
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

// The field itself: two octaves, the coarse one carrying most of the weight.
//
// The coarse octave is what makes the haze clump -- soft patches with thin
// places between them, which is what a sky full of smoke actually looks like.
// The fine one only breaks up the edges, because a field of nothing but big
// blobs reads as clouds and a field of nothing but small ones reads as static.
// Both wrong in the same way: evenly wrong.
const FIELD = new Float32Array(HAZE_NOISE_W * HAZE_NOISE_H);
{
  let lo = Infinity, hi = -Infinity;
  for (let r = 0; r < HAZE_NOISE_H; r++) {
    for (let c = 0; c < HAZE_NOISE_W; c++) {
      const v = octave(c, r, HAZE_COARSE, 0) * HAZE_CLUMP
              + octave(c, r, HAZE_FINE, 7919) * (1 - HAZE_CLUMP);
      FIELD[r * HAZE_NOISE_W + c] = v;
      if (v < lo) lo = v;
      if (v > hi) hi = v;
    }
  }
  // Stretched to fill nought-to-one. Two octaves averaged together pile up in
  // the middle, so without this the first cell appears at a third of a sky and
  // the last one is never reached: the top and the bottom of the range would
  // both be dead, which is most of the range anybody plays in.
  const span = Math.max(1e-6, hi - lo);
  // ...and then pulled back in towards the middle. The stretch above is what
  // makes the whole range usable; this is what decides how much of the picture
  // is *whether* a cell is painted and how much is how heavily. At full spread
  // the thin places stay bare until the sky is nearly full and a middling sky
  // reads as fog banks with clean air between them. Pulled in, the clumps mostly
  // say how heavy each part of the sky is, and the whole sky carries the level.
  for (let i = 0; i < FIELD.length; i++) {
    const v = (FIELD[i] - lo) / span;
    FIELD[i] = 0.5 + (v - 0.5) * HAZE_CONTRAST;
  }
}

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
// On the wind, sign and all, so the sky stalls in a lull and comes back on the
// return gust -- the same number the band's own creep runs on. A sky that
// drifted at a fixed rate would be the one thing in the yard taking no notice of
// the weather.
let creep = 0;

export function stepHaze(secs) {
  creep += secs * HAZE_DRIFT * windAt(now());
}

// Handed out for the checks and the console: the field is scenery, so there is
// nothing here worth saving, but there is something worth being able to ask.
export const hazeCreep = () => creep;

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

  // Which way the field has slid, in whole cells.
  const off = Math.round(creep);

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
      const t = at(c + off, r);
      // Under the density, or it is clear air. This is the whole of the rule.
      const over = density - t;
      if (over <= 0) continue;

      // How deep in the haze this cell is, which is its weight. A cell that has
      // only just come in is faint; one the density has long passed is at full
      // ink. So the level goes on being readable after the sky has run out of
      // room to get any fuller, and the patches have soft edges without anything
      // being drawn softly.
      const deep = Math.min(1, over / HAZE_FADE);

      // Its own colour and its own weight, both fixed on the cell. A second hash
      // rather than the field's own value, or the palest cells would all be one
      // shade and the darkest another, and the sky would band.
      const h = hash(c + off + 104729, r + 15485863);
      let kind = kinds[kinds.length - 1];
      for (let i = 0; i < upto.length; i++) if (h < upto[i]) { kind = kinds[i]; break; }
      const shades = SMOG_TINTS[kind] || SMOG_TINTS.mach;
      const g = hash(c + off, r + 32452843);
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
