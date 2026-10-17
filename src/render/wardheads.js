// The head pieces that move (wardrobe.js, the head items with `draw`), as
// the owner's vote on docs/mocks/wardrobe-expansion-2026-10-16 draws them:
// laid in WARD_UNIT marks rather than whole cells, since each is a small
// picture with a part that moves (a bird's hop, a tassel, a bowler tipped).
// Placed off the body's top-left (x, y), facing the way it faces, on the
// look's clock; its numbers are WARD_HEADS.

import { P, WORKER, WARD_UNIT as U, WARD_HEADS as H, ABYSS_MAGIC_TONES, PURPLE } from '../config.js';
import { art, fill, phaseOf } from './wardrobe.js';
import { seen, GREYS, PURPLES } from './deeptones.js';
import { rampOf } from './wardaura.js';

const pose = (t, hz) => Math.floor((t || 0) * hz) % 2;
// A mark `rx` world pixels in from the body's left facing right, `w` wide,
// read the other way round the body for a body facing left.
const across = (x, l, rx, w) => x + (l.dir < 0 ? WORKER - rx - w : rx);
const rect = (g, x, y, l, [rx, ry, rw, rh], tone) => fill(g, across(x, l, rx, rw), y + ry, rw, rh, tone);
// A cell of a three-wide head drawing at column c, row r under `top`,
// shifted `dx` units the way the body faces.
const cellAt = (g, x, top, l, c, r, dx, tone) =>
  fill(g, x + (l.dir < 0 ? 2 - c : c) * P + (l.dir < 0 ? -dx : dx) * U, top + r * P, P, P, tone);
// How far a part that lags the body is off its rest, by the walk's phase
// (`phaseOf`): `walk` a step each, `start` one, `stop` a settle each.
const lagOf = (ph, { walk, start, stop }) =>
  ph.k === 'walk' ? walk[ph.p] : ph.k === 'start' ? start : ph.k === 'stop' ? stop[ph.i] : 0;

// The headband's band and knot, and its two ends off the knot, as rects off
// the body's top-left facing right: hanging standing, streaming walking,
// trailing as it sets off and fluttering past and back as it stops.
const HEADBAND = {
  band: [0, 4, 18, 2], knot: [-2, 4, 2, 2],
  rest: [[-2, 6, 2, 6], [-4, 6, 2, 4]],
  walk: [[[-8, 2, 6, 2], [-6, 6, 4, 2]], [[-8, 4, 6, 2], [-6, 8, 4, 2], [-8, 6, 2, 2]]],
  start: [[-4, 6, 2, 2], [-6, 8, 2, 2], [-4, 8, 2, 4]],
  stop: [[[-4, 6, 2, 4], [-6, 10, 2, 2], [-4, 6, 2, 6]],
         [[0, 6, 2, 6], [-2, 6, 2, 4]],
         [[-4, 6, 2, 6], [-6, 6, 2, 4]]],
};
// The antenna's knob, units back (trailing the step) and wobbling as it
// stops; the flower's head nodding with the step and past and back.
const ANTENNA_LEAN = { walk: [-1, -2], start: -1, stop: [0, 1, -1] };
const FLOWER_NOD = { walk: [0, -1], start: -1, stop: [0, 1, -1] };
// The bird leans back a unit as the body sets off and lurches on with the
// stop (on, on, back), dipping a unit at the stop's middle pose.
const BIRD_LURCH = { walk: [0, 0], start: -1, stop: [1, 1, 0] };
// How far back of the board's corner the tassel hangs, a unit each.
const TASSEL_SWING = { walk: [1, 2], start: 1, stop: [1, -1, 1] };

// The comb's spikes, front first: `tall` units, `top` along the top of the
// head rather than down its back.
function spikes(c) {
  const n = c.top + c.down, out = [];
  for (let i = 0; i < n; i++) {
    const left = 1 - i / n, tall = Math.max(1, Math.round((i % 2 ? c.tall - 1 : c.tall) * Math.min(1, left * 1.6)));
    out.push({ i, tall, top: i < c.top });
  }
  return out;
}
// Unit m (0 the root) of spike s, as a rect.
function spikeRect(x, y, l, c, s, m) {
  if (s.top) {
    const col = 2 * s.i * U;
    return [l.dir > 0 ? x + WORKER - col - U : x + col, y - (m + 1) * U, U, U];
  }
  const row = 2 * (s.i - c.top + 1) * U;
  return [l.dir > 0 ? x - (m + 1) * U : x + WORKER + m * U, y + row, U, U];
}
function hash(i, j) { const s = Math.sin(i * 12.9898 + j * 78.233) * 43758.5453; return s - Math.floor(s); }
// A mark at a strength under the context's own opacity: the diving bowl's
// glass, and its bubble coming and going (docs/design-language/canvas.md,
// "Fades").
function faint(g, x, y, w, h, tone, a) {
  if (a <= 0.02) return;
  const was = g.globalAlpha;
  g.globalAlpha = was * Math.min(1, a);
  fill(g, Math.round(x / U) * U, Math.round(y / U) * U, w, h, tone);
  g.globalAlpha = was;
}

export const HEADS = {
  // perched on the head; every so often it hops, a wing beating from over
  // its back to under it in two held poses; it rides the walk, leaning back
  // as the body sets off and lurching on with the stop, and never hops
  // across a stop
  bird(g, x, y, l) {
    const c = H.bird, k = l.inks, grey = rampOf(l), t = l.t || 0, ph = phaseOf(l);
    const s = t % c.every, hop = s < c.hop && ph.k !== 'stop';
    const lift = hop ? Math.round(Math.sin(Math.PI * s / c.hop) * c.high) * U : (ph.k === 'walk' && pose(t, c.stepHz) ? U : 0);
    const tones = { '#': grey(c.rung), e: k.paper, b: k.ink, l: k.ink };
    const lurch = lagOf(ph, BIRD_LURCH), dip = ph.k === 'stop' && ph.i === 1 ? U : 0;
    const x0 = x + 1 + (l.dir < 0 ? -lurch : lurch) * U, y0 = y - 5 * U - lift + dip;
    art(g, ['.....##.', '....#e#b', '#######.', '.#####..', hop ? '........' : '..l..l..'], x0, y0, l.dir, tones);
    if (hop) {
      if (pose(t, c.flapHz)) art(g, ['.#......', '..##....'], x0, y0 - 2 * U, l.dir, tones);
      else art(g, ['..##....', '.#......'], x0, y0 + 4 * U, l.dir, tones);
    }
  },
  // the board and its cap, the tassel off the back corner lagging the step,
  // a knob of the ink at its end
  mortarboard(g, x, y, l) {
    const c = H.mortarboard, grey = rampOf(l)(c.rung), x0 = x - 3, y0 = y - 5 * U, ph = phaseOf(l);
    art(g, ['....####....', '############', '....####....', '.##########.', '.##########.'], x0, y0, l.dir, { '#': l.inks.ink });
    const sw = lagOf(ph, TASSEL_SWING), col = n => (l.dir < 0 ? 11 - n : n), lift = ph.k === 'walk' && ph.p ? 1 : 0;
    fill(g, x0 + col(1) * U, y0 + U, U, U, grey);
    fill(g, x0 + col(0) * U, y0 + 2 * U, U, U, grey);
    fill(g, x0 + col(-sw) * U, y0 + (3 - lift) * U, U, 2 * U, grey);
    fill(g, x0 + col(-sw) * U, y0 + (5 - lift) * U, U, U, l.inks.ink);
  },
  // the band round the head and its knot at the back, the ends off the knot
  headband(g, x, y, l) {
    const ink = l.inks.ink, ph = phaseOf(l), b = HEADBAND;
    rect(g, x, y, l, b.band, ink);
    rect(g, x, y, l, b.knot, ink);
    const ends = ph.k === 'walk' ? b.walk[ph.p] : ph.k === 'start' ? b.start : ph.k === 'stop' ? b.stop[ph.i] : b.rest;
    for (const r of ends) rect(g, x, y, l, r, ink);
  },
  // a stalk up off the head, its knob on top trailing the step
  antenna(g, x, y, l) {
    const ink = l.inks.ink, lean = lagOf(phaseOf(l), ANTENNA_LEAN), top = y - 3 * P;
    cellAt(g, x, top, l, 1, 2, 0, ink);
    cellAt(g, x, top, l, 1, 1, 0, ink);
    cellAt(g, x, top, l, 2, 0, lean, ink);
  },
  // a flower on a stalk, its head nodding
  flower(g, x, y, l) {
    const ink = l.inks.ink, nod = lagOf(phaseOf(l), FLOWER_NOD), top = y - 4 * P;
    for (const [c, r] of [[1, 0], [0, 1], [2, 1], [1, 2]]) cellAt(g, x, top, l, c, r, nod, ink);
    cellAt(g, x, top, l, 1, 3, 0, ink);
  },
  // every so often it tips itself: lifted off the head, the crown leaning
  // over the brim at the top of the lift
  bowler(g, x, y, l) {
    const c = H.bowler, t = l.t || 0, s = t % c.every, tip = s < c.tip;
    const lift = tip ? Math.round(Math.sin(Math.PI * s / c.tip) * c.high) * U : 0, lean = tip && lift > U ? l.dir * U : 0;
    const x0 = x - 1, y0 = y - 4 * U - lift, ink = { '#': l.inks.ink };
    art(g, ['...####...', '..######..', '..######..'], x0 + lean, y0, l.dir, ink);
    art(g, ['##########'], x0, y0 + 3 * U, l.dir, ink);
  },
  // a ridge down its middle in the grey, the peak out the front
  'hard-hat'(g, x, y, l) {
    const c = H['hard-hat'];
    art(g, ['..##g##....', '.###g###...', '###########'], l.dir > 0 ? x : x - 4, y - 3 * U, l.dir,
        { '#': l.inks.ink, g: rampOf(l)(c.rung) });
  },
  // a glass ring round the head, two glints on it and a bubble rising off it
  'diving-bowl'(g, x, y, l) {
    const c = H['diving-bowl'], grey = rampOf(l), t = l.t || 0;
    const cx = x + WORKER / 2, cy = y + 7, n = Math.ceil(c.r / U) + 2;
    for (let ux = -n; ux < n; ux++) for (let uy = -n; uy < n; uy++) {
      const px = cx + ux * U, py = cy + uy * U, d = Math.hypot(px + 1 - cx, py + 1 - cy);
      if (Math.abs(d - c.r) < c.edge && py < y + WORKER - 2) faint(g, px, py, U, U, grey(c.rung), c.ink);
    }
    fill(g, cx - 8, cy - 9, U, U, grey(c.glint));
    fill(g, cx - 10, cy - 7, U, U, grey(c.glint));
    const L = c.life, u = t + hash(0, c.seed) * 0.37 * L, k = (u % L) / L;
    faint(g, cx + 2 + Math.round(Math.sin(k * c.wobble)) * U, cy - c.r - 2 - k * c.rise, U, U, grey(c.bubble),
          Math.min(1, k / c.in, (1 - k) / c.out));
  },
  // the serpent's comb, by its own rule (render/serpent.js, the crest):
  // spike, a unit of nothing, spike, every other one a unit taller and the
  // last shortening to one, along the top from the front and on down the
  // back. Now and then it gives the crest's own tell before a constrict
  // (`combLit`): lit head first, held, then dark tail first.
  'serpent-comb'(g, x, y, l) {
    const c = H['serpent-comb'], tl = c.tell, t = l.t || 0, list = spikes(c), n = list.length;
    const base = l.deep ? seen(ABYSS_MAGIC_TONES[c.rung]) : ABYSS_MAGIC_TONES[c.rung];
    for (const s of list) for (let m = 0; m < s.tall; m++) fill(g, ...spikeRect(x, y, l, c, s, m), base);
    const q = (t + (l.seed || 0) * tl.seed) % tl.every;
    let litTo = 0, offFrom = 1;
    if (q < tl.warn) litTo = q / tl.warn;
    else if (q < tl.warn + tl.hold) litTo = 1;
    else if (q < tl.warn + tl.hold + tl.dark) { litTo = 1; offFrom = 1 - (q - tl.warn - tl.hold) / tl.dark; }
    // lit, the deep's own lit crest: a white tip on its top purples; in the
    // yard those read as fading on the paper, so there the tip is the
    // brightest purple and a paler one glows round it
    const tip = l.deep ? GREYS[GREYS.length - 1] : PURPLE[tl.tip];
    const body = on => (l.deep ? PURPLES[PURPLES.length - (on ? 1 : 2)] : PURPLE[tl.body[on ? 0 : 1]]);
    for (const s of list) {
      const along = s.i / n;
      if (along >= litTo || along >= offFrom) continue;
      const on = Math.floor(t * tl.flickHz + s.i * 2) % 4 < 2;
      if (!l.deep) {
        const [rx, ry] = spikeRect(x, y, l, c, s, s.tall - 1), [ox, oy] = spikeRect(x, y, l, c, s, s.tall), glow = PURPLE[tl.glow];
        if (s.top) { fill(g, rx - U, ry, U, U, glow); fill(g, rx + U, ry, U, U, glow); }
        else { fill(g, rx, ry - U, U, U, glow); fill(g, rx, ry + U, U, U, glow); }
        fill(g, ox, oy, U, U, glow);
      }
      for (let m = 0; m < s.tall; m++) fill(g, ...spikeRect(x, y, l, c, s, m), m === s.tall - 1 ? tip : body(on));
    }
  },
};
