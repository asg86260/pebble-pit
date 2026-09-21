// The muck, the smog, the rain and the draught -- everything the sky does and
// leaves behind.

import { now } from '../clock.js';
import { BOLT_FLASH_INK, BOLT_FLASH_S, BOLT_LIFE_S, DRAUGHT_INK, FLIES_PER, FLY_BEAT, FLY_EVERY, FLY_ORBIT, HAZE_CA, HAZE_STREAK, MUCK_SKIN, MUCK_TONE, P, RAIN_DASH_MAX, RAIN_DASH_MIN, RAIN_FALL, RAIN_FALL_GIVE, RAIN_LEAN, SMOG_TINTS, STINK_EVERY, STINK_LIFE, STINK_RISE, RAIN_WATER_TONE } from '../config.js';
import { at } from '../grid.js';
import { DRAUGHT, DROPS, EMBERS, GOING, SKY, moteX, moteY, muckCols, muckFloor, poopCols } from '../smog.js';
import { gust } from '../wind.js';
import { S, floor } from '../state.js';
import { ctx } from './ctx.js';
import { screenAt } from './frame.js';

// What the rain left, drawn where it landed, one column at a time, stacked on
// whatever that column has. The layer is the record: there is no number
// anywhere saying how buried a thing is that could disagree with the picture.
// Never a shade of dust and never joining a pile: the one thing in the yard
// that looks like material and is worth nothing.
// the layer, and the grains on their way to being it: one substance, one color
const MUCK_GREY = MUCK_TONE;
const MUCK_EDGE = MUCK_SKIN;

// Flies, and a wisp coming off it, only over what a body left, so the rotten
// pile and the weather's dirty one tell apart from across the yard. Nothing is
// remembered between frames: a fly's whole life is a function of its column
// and the clock, so the flies are over the poop because the poop is there and
// gone in the same frame it is. The column seeds the phase so neighbors are
// not one animation played side by side.
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
      // On the lattice: a fly off the grid shimmers against the cells it crosses.
      const fx = Math.round((c * P + Math.cos(t * FLY_BEAT + ph) * FLY_ORBIT) / P) * P;
      const fy = Math.round((top - P * 2 + Math.sin(t * FLY_BEAT * 1.5 + ph) * P * 1.2) / P) * P;
      ctx.fillRect(fx, fy, P, P);
    }
    // A wisp off one column in three: one per column is a curtain.
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
  // Both stacks: the yard keeps what the weather drops and what a body leaves
  // in two columns (everybody clears the first, only a janitor the second),
  // and drawing only the first leaves the crew's leavings piling up in the
  // count with nothing on screen.
  const poo = poopCols();
  const from = Math.max(0, Math.floor(S.camX / P) - 2);
  const to = Math.min(m.length - 1, Math.ceil((S.camX + S.viewW) / P) + 2);
  // Gathered up and drawn in two fills: after a heavy shower the layer runs
  // the whole width of the world, thirteen hundred columns.
  const body = [], skin = [];
  for (let c = from; c <= to; c++) {
    const n = (m[c] || 0) + (poo[c] || 0);
    if (!n) continue;
    const foot = muckFloor(c);

    // A drab earth brown, duller than the cut's blue and the plots' green: a
    // pile of dust here is a solid block of gray cells, and muck lying on a
    // pile must never read as more of the pile. Solid; holes on top of the
    // color are two things saying one thing.
    body.push(c * P, foot - n * P, n * P);
    // the top course darker, so a depth of two reads as two rather than as one
    // taller one
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

// What the yard has put up there: the motes themselves, every one of which
// climbed off a swing. Nobody draws an outline, so there are no edges in it.
// It is the one thing here you look *through*, so it comes apart into color
// the way a lens makes it: nothing at the middle of the window, a hair of red
// one side and cyan the other by the edges. A fringe under half a pixel is a
// fringe nobody can see, so the middle of the screen draws one rectangle a
// mote and only the edges draw three.
const CA_FLOOR = 0.5;              // separation not worth drawing
const CA_INK = 0.55;               // how solid a fringe is against the mote itself
const CA_WARM = '#c02a2a';         // the red edge
const CA_COOL = '#1f9ad0';         // and the cyan one

// Drawn as a handful of fills rather than thousands of rectangles: every call
// into the canvas costs the same setup whatever it draws, and a shower is a
// couple of thousand specks on the glass at once.
export function drawSmog() {
  if (!SKY.length && !GOING.length) return;
  const mid = S.camX + S.viewW / 2;
  const half = Math.max(1, S.viewW / 2);

  // One bucket a tint *and a weight*: every speck carries its own ink (see
  // `skyMote`), and specks of the same color and weight go down together.
  const runs = new Map();
  const warm = [], cool = [];
  for (const m of SKY) {
    // Only the plume, not the band: the smoke still climbing off the works is
    // drawn -- so a swing visibly puts something up -- but the settled sky is
    // the clouds' to show now, not a field of specks over them (DESIGN.md,
    // "The sky is the clouds"). A mote climbs, fades into the cloud, and from
    // there is only counted.
    if (!m.up) continue;
    // Asked of the sky rather than read off the mote: a settled mote is not
    // written every frame (`moteX` in smog.js). The cull on x comes first, so
    // the height and the fringe are only worked out for what is on the glass.
    const mx = moteX(m);
    if (!onScreen(mx)) continue;
    const my = moteY(m);
    const x = Math.round(mx), y = Math.round(my);
    const off = Math.max(-1, Math.min(1, (mx - mid) / half)) * HAZE_CA;
    if (Math.abs(off) >= CA_FLOOR) {
      warm.push(Math.round(mx - off), y);
      cool.push(Math.round(mx + off), y);
    }
    // Both fixed on the mote, so a speck does not shimmer between colors.
    const shades = SMOG_TINTS[m.kind] || SMOG_TINTS.dust;
    const tint = shades[(m.tone ?? 0) % shades.length];
    // To the nearest twentieth, so the weights fall into a handful of buckets,
    // times the mote's own fade, which is how a speck arriving in the band
    // comes up to weight instead of appearing at it (see `settleHere`).
    const step = Math.round((m.ink ?? 1) * (m.fade ?? 1) * 20) / 20;
    if (!step) continue;
    const key = tint + '|' + step;
    let run = runs.get(key);
    if (!run) runs.set(key, run = { tint, ink: step, at: [] });
    run.at.push(x, y);
  }

  // The ones a mouth has taken, thinning where they stood: the same speck at
  // a lighter weight, so the same buckets. No fringe on them; the chromatic
  // edge is a thing about the sky's depth, and these are on their way out.
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

  // A `fillRect` at a time, never one path with two thousand rectangles in it:
  // one `fill()` over that many subpaths tessellates the lot as a single shape
  // first, twenty times the cost. Separate fills composite where a path fills
  // once, so two specks on top of each other stack darker; over a full band
  // that moves the mean of the sky by a tenth of a level, and a clump being
  // denser than a speck is what smog does.
  //
  // The sky is blown with the same voice the dust is (`gust`, the same
  // trailing streak), and the ink comes down exactly as far as the speck goes
  // wide: a gust spreads the muck that is there, and how dark the band is, is
  // how filthy the yard is, which the player is reading and acting on.
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

// The weight a puff has and the haze it is on its way to becoming, one weight
// for both, so the thing in the sky and the thing off the swing are one thing.
// Past about a quarter these stop being air and start being confetti.
const HAZE_INK = 0.2;

// Only what is on the screen: the window shows a fifth of the world, and a
// thousand alpha rects a frame is the difference between a yard that runs and
// one that does not.
const onScreen = x => x > S.camX - P && x < S.camX + S.viewW + P;

// A climbing mote and a settled one are drawn by `drawSmog` in the same pass.
// Kept as the name the shell calls; nothing left for it to do.
export function drawPuffs() {}

// The air going into the house: faint specks falling in from all round the hood
// while somebody is inside. Worth nothing and counted nowhere, and drawn thin
// enough to say so; they are what shows a fan over a clean sky still pulling.
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
  // Two paths for the whole shower (see `drawSmog`): the water in its pale
  // tone and the acid in the muck's, so the sheet says what it is before it
  // lands. A drop is a dash of cells along the way it is going, each cell
  // stepped sideways by however far the wind carries it in one cell of fall,
  // so the whole sheet comes down slanted at one angle: a shower drawn in
  // squares is a dirtier sky, not a storm.
  const lean = gust() * RAIN_LEAN;
  // The dash is as long as the drop is fast: slow far flecks, long near strokes.
  const slowest = RAIN_FALL - RAIN_FALL_GIVE / 2;
  const cellsPer = (RAIN_DASH_MAX - RAIN_DASH_MIN + 1) / (RAIN_FALL_GIVE || 1);
  for (const dirt of [false, true]) {
    ctx.fillStyle = dirt ? MUCK_GREY : RAIN_WATER_TONE;
    ctx.beginPath();
    for (const d of DROPS) {
      if (!!d.dirt !== dirt || !onScreen(d.x)) continue;
      const x = Math.round(d.x), y = Math.round(d.y);
      const step = lean / d.vy * P;             // sideways per cell of fall
      const len = Math.min(RAIN_DASH_MAX, RAIN_DASH_MIN + Math.floor((d.vy - slowest) * cellsPer));
      for (let k = 0; k < len; k++)
        ctx.rect(x - Math.round(k * step), y - k * P, P, P);
    }
    ctx.fill();
  }
}

// The bolt: black, full for the first half of its life and fading through the
// second. Black even through the flash; the flash is what turns it white
// (`drawFlash`).
export function drawBolt() {
  const b = S.bolt;
  if (b) {
    ctx.fillStyle = '#000';
    ctx.globalAlpha = Math.min(1, b.left / (BOLT_LIFE_S / 2));
    ctx.beginPath();
    for (const [x, y] of b.cells) ctx.rect(x, y, P, P);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  // and the embers off it, bucketed by weight like the haze so a burst is a
  // handful of fills and not one per speck
  if (!EMBERS.length) return;
  const runs = new Map();
  for (const e of EMBERS) {
    if (!onScreen(e.x)) continue;
    // full weight for the first half of its life, thinning through the second
    const a = Math.round(Math.min(1, 2 * e.t / e.life) * 10) / 10;
    if (!a) continue;
    let run = runs.get(a);
    if (!run) runs.set(a, run = []);
    run.push(Math.round(e.x / P) * P, Math.round(e.y / P) * P);
  }
  ctx.fillStyle = '#000';
  for (const [a, at] of runs) {
    ctx.globalAlpha = a;
    ctx.beginPath();
    for (let i = 0; i < at.length; i += 2) ctx.rect(at[i], at[i + 1], P, P);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

// The flash: for the first instant of a strike a dark pane drops over the
// finished frame, in screen space, and the bolt is drawn white on top. Dark
// because the page is already white: the only way a white page can flash is
// to go dark, and inverting the whole window is a blow to the eye.
export function drawFlash() {
  const b = S.bolt;
  if (!b || b.flash <= 0) return;
  ctx.fillStyle = '#000';
  // fading off from the first frame, not held and cut: a held pane is a blink
  ctx.globalAlpha = BOLT_FLASH_INK * Math.min(1, b.flash / BOLT_FLASH_S);
  ctx.fillRect(0, 0, S.W, S.H);
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  const k = P * S.zoom;
  for (const [x, y] of b.cells) { const p = screenAt(x, y); ctx.rect(p.x, p.y, k, k); }
  ctx.fill();
}
