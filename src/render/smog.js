// The muck, the smog, the rain and the draught -- everything the sky does and
// leaves behind. Extracted verbatim from render.js; behavior unchanged. Owns
// drawStink, drawMuck, drawSmog, drawPuffs, drawDraught, drawRain and their
// module-private tones and helpers. ctx comes from ./ctx.js.

import { now } from '../clock.js';
import { BOLT_FLASH_INK, BOLT_LIFE_S, DRAUGHT_INK, FLIES_PER, FLY_BEAT, FLY_EVERY, FLY_ORBIT, HAZE_CA, HAZE_STREAK, MUCK_SKIN, MUCK_TONE, P, RAIN_DASH_MAX, RAIN_DASH_MIN, RAIN_FALL, RAIN_FALL_GIVE, RAIN_LEAN, SMOG_TINTS, STINK_EVERY, STINK_LIFE, STINK_RISE } from '../config.js';
import { at } from '../grid.js';
import { DRAUGHT, DROPS, GOING, SKY, moteX, moteY, muckCols, muckFloor, poopCols } from '../smog.js';
import { gust } from '../wind.js';
import { S, floor } from '../state.js';
import { ctx } from './ctx.js';
import { screenAt } from './frame.js';

// What the rain left, drawn where it landed: one column of the world at a time,
// stacked on whatever that column has -- the ground, the floor of the quarry, or
// the rock itself. The layer is the record. There is no number anywhere saying
// how buried a thing is that could disagree with the picture.
//
// Grey rather than a shade of dust, and it never joins a pile: this is the one
// thing in the yard that looks like material and is worth nothing. Read "that is
// in the way", never "there is dust up there".
// the layer, and the grains on their way to being it: one substance, one colour
const MUCK_GREY = MUCK_TONE;
const MUCK_EDGE = MUCK_SKIN;

// Flies, and a wisp coming off it.
//
// Only over what a body left. The weather's muck is dirty and this is rotten,
// and those are already told apart by being two different piles doing two
// different jobs -- so the flies say which is which at a glance, from across the
// yard, without anybody having to read a colour.
//
// Nothing is remembered between frames. A fly's whole life is a function of
// which column it is over and what time it is, so there is no swarm to keep, no
// list to add to when a body squats and none to prune when a janitor shovels:
// the flies are over the poop because the poop is there, and they are gone in
// the same frame it is. The column index seeds the phase so that neighbouring
// columns are not one animation played side by side.
function drawStink(from, to, poo) {
  const t = now() / 1000;
  ctx.fillStyle = '#000';
  for (let c = from; c <= to; c++) {
    const n = poo[c] || 0;
    if (!n) continue;
    const top = muckFloor(c) - n * P;
    const seed = c * 2.399;                        // no two columns in step
    for (let k = 0; k < (c % FLY_EVERY ? 0 : FLIES_PER); k++) {
      const ph = seed + k * 2.1;
      // Drawn on the lattice like everything else: a fly off the grid is a
      // black speck that shimmers against the cells it crosses.
      const fx = Math.round((c * P + Math.cos(t * FLY_BEAT + ph) * FLY_ORBIT) / P) * P;
      const fy = Math.round((top - P * 2 + Math.sin(t * FLY_BEAT * 1.5 + ph) * P * 1.2) / P) * P;
      ctx.fillRect(fx, fy, P, P);
    }
    // And a wisp off one column in three, climbing and fading. One per column
    // was a curtain; the point is a suggestion of a smell, not a chimney.
    if (c % STINK_EVERY) continue;
    const age = (t + seed) % STINK_LIFE;
    const wy = Math.round((top - P - age * STINK_RISE) / P) * P;
    const wx = Math.round((c * P + Math.sin(t + seed) * P) / P) * P;
    ctx.globalAlpha = 0.28 * (1 - age / STINK_LIFE);
    ctx.fillRect(wx, wy, P, P);
    ctx.globalAlpha = 1;
  }
}

export function drawMuck() {
  const m = muckCols();
  if (!m.length) return;
  // Both stacks. The yard keeps what the weather drops and what a body leaves in
  // two separate columns, because they are two different jobs -- everybody
  // clears the first and only a janitor clears the second -- and this drew the
  // first and no more. So what the crew left was never on the screen at all: it
  // piled up in the count, held the row that sells the outhouse open, and looked
  // for all the world like somebody had been round and tidied it away.
  const poo = poopCols();
  const from = Math.max(0, Math.floor(S.camX / P) - 2);
  const to = Math.min(m.length - 1, Math.ceil((S.camX + S.viewW) / P) + 2);
  // Gathered up and drawn in two fills: after a heavy shower the layer runs the
  // whole width of the world, and a column at a time was two calls into the
  // canvas for every one of thirteen hundred columns. Same picture, same order
  // -- the body first, its skin over the top -- for a fraction of the work.
  const body = [], skin = [];
  for (let c = from; c <= to; c++) {
    const n = (m[c] || 0) + (poo[c] || 0);
    if (!n) continue;
    const foot = muckFloor(c);

    // Loose, not packed. Grey on its own was not enough: a pile of dust in this
    // yard is a solid block of grey cells and so was this, so muck lying on a
    // pile read as more of the pile -- which is the one thing it must never read
    // as, because one of them is worth something and the other is worth nothing.
    //
    // Two things tell it apart, doing two different jobs.
    //
    // The colour says it is a different substance: a drab earth brown, beside the
    // cut's blue and the plots' green and duller than either, because those are
    // saturated for being worth something and this is worth nothing.
    //
    // Solid, and the colour does the whole job. It was holed for a while -- every
    // other cell left out, so the layer read as loose -- and two things saying one
    // thing is one of them too many: the brown already says this is not the pile
    // it is lying on, and the gaps only made a straightforward layer fussy.
    body.push(c * P, foot - n * P, n * P);
    // and the top course solid and darker, so the layer has a skin on it and a
    // depth of two reads as two rather than as one taller one
    skin.push(c * P, foot - n * P);
  }
  // and the flies, over what a body left rather than over the whole layer
  drawStink(from, to, poo);
  if (body.length) {
    ctx.fillStyle = MUCK_GREY;
    ctx.beginPath();
    for (let i = 0; i < body.length; i += 3) ctx.rect(body[i], body[i + 1], P, body[i + 2]);
    ctx.fill();
    ctx.fillStyle = MUCK_EDGE;
    ctx.beginPath();
    for (let i = 0; i < skin.length; i += 2) ctx.rect(skin[i], skin[i + 1], P, P);
    ctx.fill();
  }
  ctx.fillStyle = '#000';
}

// What the yard has put up there. Not a cloud: the motes themselves, every one
// of which climbed off a swing and is still up there. Where they have clumped
// they overlap and the sky goes dark; where they have not it stays thin. Nobody
// draws an outline, so there are no shelves and no right angles in it -- there is
// nothing in this to have an edge.
// It is also the one thing here you are looking *through*. Everything else in
// this yard is an object with an edge; the sky is a field, and a field of flat
// black rectangles reads as paint on the glass rather than as air in front of
// it. So it comes apart into colour the way a lens makes it: nothing at the
// middle of the window, a hair of red one side and cyan the other by the time
// you reach the edges.
//
// Only the motes that are actually off-centre pay for it. A fringe under half a
// pixel is a fringe nobody can see, and the sky is the most expensive thing on
// this canvas already -- so the middle of the screen draws one rectangle a mote
// exactly as it always did, and only the edges draw three.
const CA_FLOOR = 0.5;              // separation not worth drawing
const CA_INK = 0.55;               // how solid a fringe is against the mote itself
const CA_WARM = '#c02a2a';         // the red edge
const CA_COOL = '#1f9ad0';         // and the cyan one

// Drawn as a handful of paths rather than as thousands of rectangles.
//
// A full sky is six or seven thousand specks and a fat window shows a couple of
// thousand of them at once, each of them one `fillRect` and two more for its
// fringe -- eight thousand calls into the canvas, sixty times a second, for a
// field of identical squares. Every one of those calls costs the same setup
// whatever it draws, and that setup was most of what a shower cost: the yard
// visibly slowed while it rained, which is the one moment the yard is supposed
// to be at its busiest.
//
// The specks are the same size, the same weight and one of four colours, so they
// go into one path per colour and one fill each. Nothing about the picture
// changes -- the same squares land in the same places -- and there are a dozen
// calls where there were thousands.
export function drawSmog() {
  if (!SKY.length && !GOING.length) return;
  const mid = S.camX + S.viewW / 2;
  const half = Math.max(1, S.viewW / 2);

  // One path a tint *and a weight*: every speck carries its own ink -- see
  // `skyMote` -- and specks of the same colour and weight go down together, so a
  // band of six thousand is still a dozen fills rather than six thousand.
  const runs = new Map();
  const warm = [], cool = [];
  for (const m of SKY) {
    // Where it is, asked of the sky rather than read off the mote: a settled
    // mote is not written to every frame any more -- see `moteX` in smog.js.
    // The cull comes first and it is a cull on x alone, so the height and the
    // fringe are only worked out for what is actually on the glass -- four
    // motes in five never get that far.
    const mx = moteX(m);
    if (!onScreen(mx)) continue;
    const my = moteY(m);
    const x = Math.round(mx), y = Math.round(my);
    const off = Math.max(-1, Math.min(1, (mx - mid) / half)) * HAZE_CA;
    if (Math.abs(off) >= CA_FLOOR) {
      warm.push(Math.round(mx - off), y);
      cool.push(Math.round(mx + off), y);
    }
    // its kind's palette, and its own tone out of that palette. Both are fixed
    // on the mote, so a speck does not shimmer between colours frame to frame.
    const shades = SMOG_TINTS[m.kind] || SMOG_TINTS.dust;
    const tint = shades[(m.tone ?? 0) % shades.length];
    // to the nearest twentieth, so the weights fall into a handful of buckets --
    // and times whatever the mote's own fade is, which is how a speck arriving in
    // the band comes up to weight instead of appearing at it.
    //
    // `fade` was stepped, was used to decide when a mote could stop being
    // stepped, and was handed out to the hooks -- and was never once drawn. So a
    // speck reaching the top of its climb, where it joins the sky at whatever
    // place along the world the air up there has taken it, simply appeared over
    // there at full weight and vanished from over the works. See `settleHere`.
    const step = Math.round((m.ink ?? 1) * (m.fade ?? 1) * 20) / 20;
    if (!step) continue;
    const key = tint + '|' + step;
    let run = runs.get(key);
    if (!run) runs.set(key, run = { tint, ink: step, at: [] });
    run.at.push(x, y);
  }

  // ...and the ones a mouth has taken, thinning where they stood. Same buckets,
  // same fills: a fading speck is the same speck at a lighter weight, so it goes
  // down the same path as everything else rather than needing a pass of its own.
  // No fringe on them -- the chromatic edge is a thing about the sky's depth, and
  // one of these is on its way out of it.
  for (const g of GOING) {
    if (!onScreen(g.x)) continue;
    const shades = SMOG_TINTS[g.kind] || SMOG_TINTS.dust;
    const tint = shades[(g.tone ?? 0) % shades.length];
    const step = Math.round((g.ink ?? 1) * g.t * 20) / 20;
    if (!step) continue;
    const key = tint + '|' + step;
    let run = runs.get(key);
    if (!run) runs.set(key, run = { tint, ink: step, at: [] });
    run.at.push(Math.round(g.x), Math.round(g.y));
  }

  // A rect at a time, and not one path with two thousand rectangles in it.
  //
  // The path was the obvious way to write this and it was the most expensive
  // thing in the frame by a factor of twenty. One `fill()` over a couple of
  // thousand subpaths makes the browser tessellate the lot as a single shape
  // before it can lay down a pixel; `fillRect` is a fast path that never builds
  // a path at all. Same rectangles, same colours, same alpha -- a thick sky went
  // from twenty-two milliseconds to one and a half.
  //
  // It is not quite the same arithmetic, and the difference is worth knowing:
  // rectangles inside one path are filled once where they overlap, while
  // separate fills composite, so two specks on top of each other now stack to a
  // darker mark instead of one flat one. Measured over a full band that moves
  // the mean of the sky by a tenth of a level out of 255 -- these are sparse
  // enough that overlaps are rare -- and it arguably reads better, because a
  // clump of smog being denser than a single speck is what smog does.
  // The sky is blown too, and it has to say so with the same voice the dust
  // does or the two read as two weathers over one yard. Same shaped number
  // (`gust`), same trailing streak, one reach of its own.
  //
  // And the ink comes down exactly as far as the speck goes wide. A gust does
  // not make more muck -- it spreads the muck that is there -- so a smeared
  // speck has to lay down the same amount of ink over the longer mark, or the
  // sky darkens every time it blows. That would be worse than merely wrong: how
  // dark the band is, is how filthy the yard is, and it is a thing the player
  // is meant to be reading and acting on. A weather effect that moved that
  // reading would be lying about the game's state.
  const g = gust();
  const tail = Math.round(HAZE_STREAK * Math.abs(g));
  const from = g > 0 ? -tail : 0;
  const thin = P / (P + tail);
  const spill = (pts, colour, ink) => {
    if (!pts.length) return;
    ctx.globalAlpha = ink * thin;
    ctx.fillStyle = colour;
    for (let i = 0; i < pts.length; i += 2)
      ctx.fillRect(pts[i] + from, pts[i + 1], P + tail, P);
  };
  spill(warm, CA_WARM, HAZE_INK * CA_INK);
  spill(cool, CA_COOL, HAZE_INK * CA_INK);
  for (const run of runs.values()) spill(run.at, run.tint, HAZE_INK * run.ink);

  ctx.globalAlpha = 1;
  ctx.fillStyle = '#000';
}

// What a swing just put up: a cell off the work, climbing, thinning as it goes.
// This is the whole connection between what the crew do and what is overhead --
// without it the sky is weather and the yard is a factory, and the one has
// nothing to do with the other.
// The same weight as the haze it is on its way to becoming. It was heavier than
// that, on the reasoning that a fresh puff is thicker than old smog -- which is
// true of smoke and wrong here: a mote that arrives dark and then lightens is a
// mote that changes into something else on the way up, and the whole point of
// these is that the thing in the sky and the thing off the swing are one thing.
// Subtle enough to be air, solid enough to follow with your eye.
// Raised with the count. A haze reads as haze when a lot of faint specks
// overlap; the fix for an invisible band is mostly more of them, but a tenth of
// an ink is under what a screen can honestly show against this paper, so the
// speck itself comes up a little too. Not far -- past about a quarter these
// stop being air and start being confetti, which is the fault this number was
// held down to avoid in the first place.
const HAZE_INK = 0.2;

// Only what is on the screen. The sky runs the whole width of the world and the
// window shows a fifth of it, so four motes in five are being composited into a
// place nobody is looking -- and a thousand alpha rects a frame is the difference
// between a yard that runs and one that does not.
const onScreen = x => x > S.camX - P && x < S.camX + S.viewW + P;

// A climbing mote and a settled one are drawn by `drawSmog`, in the same pass,
// because they are the same thing. This is kept as the name the shell calls, and
// there is nothing left for it to do.
export function drawPuffs() {}

// The air going into the house: faint specks falling in from all round the hood
// while there is somebody inside it. They are not the haze -- they are worth
// nothing and counted nowhere -- and they are drawn thin enough to say so: what
// they are for is a fan over a clean sky still plainly pulling.
export function drawDraught() {
  if (!DRAUGHT.length) return;
  ctx.fillStyle = SMOG_TINTS.dust[0];
  ctx.beginPath();
  for (const k of DRAUGHT) {
    if (!onScreen(k.x)) continue;
    ctx.rect(Math.round(k.x / P) * P, Math.round(k.y / P) * P, P, P);
  }
  ctx.globalAlpha = HAZE_INK * DRAUGHT_INK;
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#000';
}

export function drawRain() {
  if (!DROPS.length) return;
  // One path for the whole shower: four thousand drops is four thousand calls
  // into the canvas otherwise, and they are all the same square in the same
  // colour. See `drawSmog` -- the same trick, for the same reason.
  // A drop is a dash of cells drawn along the way it is going: the head where
  // the drop is, the rest trailing back up its path, each cell stepped
  // sideways by however far the wind carries it in one cell of fall. The smog
  // is a square and a shower drawn in squares was a dirtier sky, not a storm:
  // nothing in a still frame said falling (critics 2026-09-10, C12). And a
  // vertical dash nudged over by the gust was still a vertical dash -- rain in
  // a wind comes down slanted, the whole sheet at one angle.
  const lean = gust() * RAIN_LEAN;
  // The dash is as long as the drop is fast: its place in the speed range,
  // spread over the lengths. Slow far flecks, long near strokes.
  const slowest = RAIN_FALL - RAIN_FALL_GIVE / 2;
  const cellsPer = (RAIN_DASH_MAX - RAIN_DASH_MIN + 1) / (RAIN_FALL_GIVE || 1);
  ctx.fillStyle = MUCK_GREY;
  ctx.beginPath();
  for (const d of DROPS) {
    if (!onScreen(d.x)) continue;
    const x = Math.round(d.x), y = Math.round(d.y);
    const step = lean / d.vy * P;             // sideways per cell of fall
    const len = Math.min(RAIN_DASH_MAX, RAIN_DASH_MIN + Math.floor((d.vy - slowest) * cellsPer));
    for (let k = 0; k < len; k++)
      ctx.rect(x - Math.round(k * step), y - k * P, P, P);
  }
  ctx.fill();
  // Nothing is drawn going the other way any more. What the house takes is the
  // sky itself, dragged in by the draught and drawn by `drawSmog` all the way to
  // the mouth -- there is no separate thread of specks on an errand, because
  // there is no errand.
}

// The bolt: its cells in black, full for the first half of its life and
// fading through the second. It is drawn black even through the flash, and
// the flash is what turns it white -- see `drawFlash`.
export function drawBolt() {
  const b = S.bolt;
  if (!b) return;
  ctx.fillStyle = '#000';
  ctx.globalAlpha = Math.min(1, b.left / (BOLT_LIFE_S / 2));
  ctx.beginPath();
  for (const [x, y] of b.cells) ctx.rect(x, y, P, P);
  ctx.fill();
  ctx.globalAlpha = 1;
}

// The flash: for the first instant of a strike a dark pane drops over the
// finished frame and the bolt is drawn white on top of it. Over the frame in
// screen space, so it covers the lot. Dark rather than white because the page
// is already white: the only way a white page can flash is to go dark. It
// used to invert the whole window, and that was a blow to the eye rather than
// a flash -- this dims the yard by BOLT_FLASH_INK and leaves it the right way
// round, with the bolt the one bright thing in it.
export function drawFlash() {
  const b = S.bolt;
  if (!b || b.flash <= 0) return;
  ctx.fillStyle = '#000';
  ctx.globalAlpha = BOLT_FLASH_INK;
  ctx.fillRect(0, 0, S.W, S.H);
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  const k = P * S.zoom;
  for (const [x, y] of b.cells) { const p = screenAt(x, y); ctx.rect(p.x, p.y, k, k); }
  ctx.fill();
}
