// The head pieces that move (wardrobe.js, the head items with `draw`), as
// the owner's vote on docs/mocks/wardrobe-expansion-2026-10-16 draws them:
// laid in WARD_UNIT marks rather than whole cells, since each is a small
// picture with a part that moves (a bird's hop, a tassel, a bowler tipped).
// Placed off the body's top-left (x, y), facing the way it faces, on the
// look's clock; its numbers are WARD_HEADS.

import { WORKER, WARD_UNIT as U, WARD_HEADS as H, ABYSS_MAGIC_TONES } from '../config.js';
import { art, fill } from './wardrobe.js';
import { seen } from './deeptones.js';
import { rampOf } from './wardaura.js';

const pose = (t, hz) => Math.floor((t || 0) * hz) % 2;
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
  // its back to under it in two held poses
  bird(g, x, y, l) {
    const c = H.bird, k = l.inks, grey = rampOf(l), t = l.t || 0;
    const s = t % c.every, hop = s < c.hop;
    const lift = hop ? Math.round(Math.sin(Math.PI * s / c.hop) * c.high) * U : (l.moving && pose(t, c.stepHz) ? U : 0);
    const tones = { '#': grey(c.rung), e: k.paper, b: k.ink, l: k.ink };
    const x0 = x + 1, y0 = y - 5 * U - lift;
    art(g, ['.....##.', '....#e#b', '#######.', '.#####..', hop ? '........' : '..l..l..'], x0, y0, l.dir, tones);
    if (hop) {
      if (pose(t, c.flapHz)) art(g, ['.#......', '..##....'], x0, y0 - 2 * U, l.dir, tones);
      else art(g, ['..##....', '.#......'], x0, y0 + 4 * U, l.dir, tones);
    }
  },
  // the board and its cap, the tassel off the back corner swinging with the step
  mortarboard(g, x, y, l) {
    const c = H.mortarboard, grey = rampOf(l)(c.rung), x0 = x - 3, y0 = y - 5 * U;
    art(g, ['....####....', '############', '....####....', '.##########.', '.##########.'], x0, y0, l.dir, { '#': l.inks.ink });
    const sw = l.moving && pose(l.t, c.stepHz) ? 1 : 0, col = n => (l.dir < 0 ? 11 - n : n);
    fill(g, x0 + col(10) * U, y0 + U, U, U, grey);
    fill(g, x0 + col(11) * U, y0 + 2 * U, U, U, grey);
    fill(g, x0 + col(11 + sw) * U, y0 + 3 * U, U, U, grey);
    fill(g, x0 + col(11 + sw) * U, y0 + 4 * U, U, 2 * U, grey);
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
  // last shortening to one, along the top from the front and on down the back
  'serpent-comb'(g, x, y, l) {
    const c = H['serpent-comb'], n = c.top + c.down;
    const tone = l.deep ? seen(ABYSS_MAGIC_TONES[c.rung]) : ABYSS_MAGIC_TONES[c.rung];
    for (let i = 0; i < n; i++) {
      const left = 1 - i / n, tall = Math.max(1, Math.round((i % 2 ? c.tall - 1 : c.tall) * Math.min(1, left * 1.6))) * U;
      if (i < c.top) {
        const col = 2 * i * U;
        fill(g, l.dir > 0 ? x + WORKER - col - U : x + col, y - tall, U, tall, tone);
      } else {
        const row = 2 * (i - c.top + 1) * U;
        fill(g, l.dir > 0 ? x - tall : x + WORKER, y + row, tall, U, tone);
      }
    }
  },
};
