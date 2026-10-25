// The aura the two of them may wear (wardrobe.js, the `aura` slot), drawn as
// the owner's vote on docs/mocks/wardrobe-aura-2026-10-16 draws it. Not
// render/aura.js, which is the offer flag's ring.
//
// Every particle is a rect a unit square on the world's own two-pixel grid,
// placed by a seed and the clock alone: nothing is thrown with
// Math.random, so a frame drawn twice is the same frame, and the clock is
// held to WARD_AURA_FPS so they change pose in held frames as the rest of
// the yard's drawing does. A particle comes and goes by opacity
// (docs/design-language/canvas.md, "Fades"); at full ink it is a rung of
// the yard's grey ramp, or in the deep a rung of the deep's own, so the
// deep's cap holds what it draws.
//
// What it is drawn round is the look's (render/wardrobe.js), and two passes
// of it: `back` before the body and what hangs off it, `front` after the
// head. The particles that leave the body (motes, bits, prints, petals,
// embers) stand where the body was when each was born, so a walking body
// leaves them behind: its walk is remembered a few seconds (`trail`), keyed
// by the object the body is drawn from, as its walk is read (`motionOf`).

import { WORKER, WARD_UNIT as U, GREY, PURPLE, GOLD, ABYSS_TONES, ABYSS_MAGIC_TONES, WARD_AURA_FPS, WARD_AURA_KEEP_S,
         WARD_AURA_SEED, WARD_AURA_TURN, WARD_AURAS as A, WARD_AURA_EMBERS } from '../config.js';
import { GREYS, PURPLES, seen } from './deeptones.js';
import { fill, headHeight } from './wardrobe.js';
import { perPage } from '../ink.js';

const MID = WORKER / 2;
const lum = h => parseInt(h.slice(1, 3), 16);

// A yard grey as the deep shows it: the yard's rung turned over, the nearest
// rung of the abyss's ramp to that, folded onto the ones the deep keeps.
// Which abyss rung each is, worked out once; the tone itself is read off
// the deep's ramp, which turns with the page.
const DEEP_RUNG = GREY.map(c => {
  const v = 255 - lum(c);
  let best = 0;
  ABYSS_TONES.forEach((t, i) => { if (Math.abs(lum(t) - v) < Math.abs(lum(ABYSS_TONES[best]) - v)) best = i; });
  return best;
});
const DEEP_GREY = [];
const deepPurple = r => PURPLES[Math.max(0, ABYSS_MAGIC_TONES.indexOf(PURPLE[r]))];
const INKS = {
  yard: { grey: r => GREY[r], gold: GOLD.yard,
          ember: WARD_AURA_EMBERS.yard.map(([k, r]) => (k === 'grey' ? GREY[r] : PURPLE[r])) },
  deep: { grey: r => DEEP_GREY[r] },
};
perPage(() => {
  DEEP_GREY.splice(0, DEEP_GREY.length, ...DEEP_RUNG.map(i => GREYS[i]));
  INKS.deep.gold = seen(GOLD.deep);
  INKS.deep.ember = WARD_AURA_EMBERS.deep.map(([k, r]) => (k === 'grey' ? DEEP_GREY[r] : deepPurple(r)));
});
// A look's grey ramp, rung by rung, in the yard's or the deep's: for the
// head pieces drawn in more than the two greys an outfit carries
// (render/wardheads.js).
export const rampOf = l => (l && l.deep ? INKS.deep : INKS.yard).grey;

function hash(i, j) { const s = Math.sin(i * 12.9898 + j * 78.233) * 43758.5453; return s - Math.floor(s); }
const snap = v => Math.round(v / U) * U;
const fadeInOut = (k, i, o) => Math.min(1, k / i, (1 - k) / o);
// Particle i of n's life, each on its own phase: its age, the share of its
// life gone, and which life it is on (a new place each life).
function life(t, i, n, L, seed) {
  const u = t + i * L / n + hash(i, seed) * 0.37 * L, cyc = Math.floor(u / L), a = u - cyc * L;
  return { a, k: a / L, cyc };
}
// One particle, at a strength under the context's own opacity (a body drawn
// fading carries its aura with it).
function dot(g, x, y, tone, a = 1, w = U, h = U) {
  a = Math.min(1, a);
  if (a <= 0.02) return;
  const was = g.globalAlpha;
  g.globalAlpha = was * a;
  fill(g, snap(x), snap(y), w, h, tone);
  g.globalAlpha = was;
}

// Each aura: `draw(g, at, t, pass, k, s, over)`, `at(t)` where the body
// stood then ({ x, y, moving }, its top-left), `t` the held clock, `k` the
// inks, `s` the body's seed and `over` how tall what it wears on its head
// stands.
const AURAS = {
  'dust-motes'(g, at, t, pass, k, s) {
    const c = A['dust-motes'];
    for (let i = 0; i < c.n; i++) {
      const l = life(t, i, c.n, c.life, c.seed + s);
      if ((hash(i, l.cyc) < c.back) !== (pass === 'back')) continue;
      const p = at(t - l.a);
      const x = p.x + MID + (hash(i, l.cyc + 0.5) - 0.5) * c.spread + Math.sin(l.k * 2 * Math.PI + i) * c.sway;
      const y = p.y + c.top + hash(i, l.cyc + 0.7) * c.band - l.k * c.rise;
      dot(g, x, y, k.grey(c.rung + Math.floor(hash(i, l.cyc + 0.9) * c.rungs)), Math.sin(Math.PI * l.k));
    }
  },
  'pebble-bits'(g, at, t, pass, k, s) {
    if (pass !== 'front') return;
    const c = A['pebble-bits'];
    for (let i = 0; i < c.n; i++) {
      const l = life(t, i, c.n, c.life, c.seed + s), p = at(t - l.a);
      if (!p.moving && i > 0) continue;
      const side = hash(i, l.cyc) < 0.5 ? -U - 1 : WORKER + 1;
      const x = p.x + side + hash(i, l.cyc + 0.2) * c.jitter, y0 = p.y + c.from + hash(i, l.cyc + 0.3) * c.band, foot = p.y + WORKER - U;
      const f = Math.min(1, l.k / c.fall), y = y0 + (foot - y0) * f * f;
      dot(g, x, y, k.grey(c.rung + Math.floor(hash(i, l.cyc + 0.6) * c.rungs)),
          Math.min(1, l.k / c.in, l.k > c.fall ? (1 - l.k) / (1 - c.fall) : 1));
    }
  },
  bubbles(g, at, t, pass, k, s) {
    if (pass !== 'front') return;
    const c = A.bubbles, tone = k.grey(c.rung);
    for (let i = 0; i < c.n; i++) {
      const l = life(t, i, c.n, c.life, c.seed + s), p = at(t - l.a * c.lag);
      const x = p.x + (i % 2 ? -c.off : WORKER + 1) + hash(i, l.cyc) * c.jitter + Math.round(Math.sin(l.k * c.wobble + i)) * U;
      const y = p.y + c.from - l.k * c.rise, a = fadeInOut(l.k, c.in, c.out);
      // the last a single unit, the rest rings
      if (i === c.n - 1) { dot(g, x, y, tone, a); continue; }
      dot(g, x + U, y, tone, a); dot(g, x, y + U, tone, a); dot(g, x + 2 * U, y + U, tone, a); dot(g, x + U, y + 2 * U, tone, a);
    }
  },
  'orbiting-pixel'(g, at, t, pass, k, s) {
    const c = A['orbiting-pixel'], b = at(t), cx = b.x + MID - U / 2;
    c.trail.forEach((al, j) => {
      const an = t * c.speed - j * c.gap + s * WARD_AURA_TURN, sn = Math.sin(an);
      if ((sn < 0) !== (pass === 'back')) return;
      dot(g, cx + Math.cos(an) * c.rx, b.y + c.mid + sn * c.ry, k.grey(c.rung), al);
    });
  },
  'sparkle-glints'(g, at, t, pass, k, s) {
    if (pass !== 'front') return;
    const c = A['sparkle-glints'], b = at(t), tone = k.grey(c.rung);
    for (let i = 0; i < c.n; i++) {
      const l = life(t, i, c.n, c.life, c.seed + s);
      if (l.k > c.up) continue;                     // resting
      const q = l.k / c.up, an = hash(i, l.cyc) * 2 * Math.PI, r = c.r + hash(i, l.cyc + 0.4) * c.rr;
      const x = b.x + MID - U / 2 + Math.cos(an) * r, y = b.y + c.mid + Math.sin(an) * r * c.squash;
      if (q < c.in) dot(g, x, y, tone, q / c.in);
      else if (q < c.hold) { dot(g, x, y, tone); dot(g, x - U, y, tone); dot(g, x + U, y, tone); dot(g, x, y - U, tone); dot(g, x, y + U, tone); }
      else dot(g, x, y, tone, Math.min(1, (1 - q) / c.out));
    }
  },
  footprints(g, at, t, pass, k) {
    if (pass !== 'back') return;
    const c = A.footprints, n0 = Math.floor(t / c.step), tone = k.grey(c.rung);
    for (let j = 0; j <= Math.ceil(c.life / c.step); j++) {
      const n = n0 - j, ts = n * c.step, age = t - ts, p = at(ts);
      if (age > c.life || !p.moving) continue;
      dot(g, p.x + c.feet[((n % 2) + 2) % 2], p.y + WORKER + c.below, tone, 1 - age / c.life, 2 * U, U);
    }
  },
  // over the head item, not through it: the mock's bare body had none, and
  // a cloud drawn on a top hat's crown reads as a hat
  'rain-cloud'(g, at, t, pass, k, s, over) {
    if (pass !== 'front') return;
    const c = A['rain-cloud'], b = at(t), lag = at(t - c.lag), bob = Math.floor(t * c.bob) % 2 ? -U : 0;
    const top = b.y - over - c.over + bob, left = lag.x + c.inset;
    c.rows.forEach((r, ry) => {
      for (let rx = 0; rx < r.length; rx++)
        if (r[rx] === '#') dot(g, left + rx * U, top + ry * U, k.grey(c.rung + Math.floor(hash(rx, ry + 9) * c.rungs)));
    });
    const y0 = top + c.rows.length * U, y1 = b.y - over - c.dropTo;
    for (let i = 0; i < c.drops; i++) {
      const l = life(t, i, c.drops, c.dropLife, c.seed + s);
      dot(g, left + c.dropIn + hash(i, l.cyc) * c.dropSpan, y0 + l.k * (y1 - y0), k.grey(c.dropRung), Math.min(1, (1 - l.k) / c.out), U, c.dropLen);
    }
  },
  'falling-petals'(g, at, t, pass, k, s) {
    const c = A['falling-petals'];
    for (let i = 0; i < c.n; i++) {
      const l = life(t, i, c.n, c.life, c.seed + s);
      if ((hash(i, l.cyc + 0.1) < c.back) !== (pass === 'back')) continue;
      const p = at(t - l.a), x0 = p.x + c.from + hash(i, l.cyc) * c.spread, y0 = p.y - c.over, foot = p.y + WORKER + c.below;
      const tone = k.grey(c.rung + Math.floor(hash(i, l.cyc + 0.3) * c.rungs));
      const a = Math.min(1, l.k / c.in, (1 - l.k) / c.out);
      if (l.k < c.land) {
        const f = l.k / c.land, flat = Math.floor(t * c.turnHz + i) % 2;
        dot(g, x0 + Math.sin(l.k * c.swayHz + i * 2) * c.sway, y0 + (foot - y0) * f, tone, a, flat ? 2 * U : U, U);
      } else dot(g, x0 + Math.sin(c.land * c.swayHz + i * 2) * c.sway, foot, tone, a, 2 * U, U);
    }
  },
  'scale-swirl'(g, at, t, pass, k, s) {
    const c = A['scale-swirl'], b = at(t), cx = b.x + MID - c.size / 2;
    for (let i = 0; i < c.n; i++) {
      const an = t * c.speed + i * 2 * Math.PI / c.n + s * WARD_AURA_TURN, sn = Math.sin(an);
      if ((sn < 0) !== (pass === 'back')) continue;
      const edge = ((t + i * c.edge) % c.every) < c.edge;
      const y = b.y + c.mid + sn * c.ry + Math.sin(t * c.bobHz + i * 1.7) * c.bob;
      dot(g, cx + Math.cos(an) * c.rx, y + (edge ? 1 : 0), k.grey(c.rung), 1, c.size, edge ? c.size / 2 : c.size);
    }
  },
  embers(g, at, t, pass, k, s) {
    const c = A.embers;
    for (let i = 0; i < c.n; i++) {
      const l = life(t, i, c.n, c.life, c.seed + s);
      const an = i * 2 * Math.PI / c.n + l.k * c.turn + hash(i, l.cyc) * c.spread, sn = Math.sin(an);
      if ((sn < 0) !== (pass === 'back')) continue;
      const p = at(t - l.a * c.lag);
      const tone = k.ember[Math.min(k.ember.length - 1, Math.floor(l.k * k.ember.length))];
      dot(g, p.x + MID - U / 2 + Math.cos(an) * (c.r + c.grow * l.k), p.y + WORKER - c.foot - l.k * c.rise, tone, fadeInOut(l.k, c.in, c.out));
    }
  },

  // --- the expansion's (docs/mocks/wardrobe-expansion-2026-10-16) ---------------
  flies(g, at, t, pass, k, s) {
    const c = A.flies, b = at(t), cx = b.x + MID - U / 2, cy = b.y + c.mid;
    for (let i = 0; i < c.n; i++) {
      const an = t * (c.speed + i * c.step) * (i % 2 ? -1 : 1) + Math.sin(t * c.dartHz + i * 2) * c.dart + i * c.phase + s;
      if ((Math.sin(an) < 0) !== (pass === 'back')) continue;
      const r = c.r + c.rr * Math.sin(t * c.rHz + i);
      const x = cx + Math.cos(an) * r, y = cy + Math.sin(an * 2 + i) * c.loop - c.lift + Math.sin(an) * c.sink;
      const wy = (Math.floor(t * c.flapHz) + i) % 2 ? -U : U;
      dot(g, x, y, k.grey(c.rung));
      dot(g, x - U, y + wy, k.grey(c.wing));
      dot(g, x + U, y + wy, k.grey(c.wing));
    }
  },
  stink(g, at, t, pass, k, s) {
    if (pass !== 'front') return;
    const c = A.stink, b = at(t);
    c.at.forEach((ox, i) => {
      const l = life(t, i, c.at.length, c.life, c.seed + s), base = b.y + c.from - l.k * c.rise, a = fadeInOut(l.k, c.in, c.out);
      for (let j = 0; j < c.units; j++) {
        const wob = Math.round(Math.sin(j * c.wave - Math.floor(t * c.waveHz) * c.travel + i)) * U;
        dot(g, b.x + ox + wob, base - j * c.gap, k.grey(c.rung), a * (1 - j * c.thin));
      }
    });
  },
  'juggling-balls'(g, at, t, pass, k, s, over) {
    if (pass !== 'front') return;
    const c = A['juggling-balls'], b = at(t), cx = b.x + MID - c.size / 2, base = b.y + c.from, high = c.high + over;
    for (let i = 0; i < c.n; i++) {
      const q = ((t + s) / c.period + i / c.n) % 1;
      let x, y;
      if (q < c.throw) { const u = q / c.throw; x = cx - c.half + 2 * c.half * u; y = base - 4 * high * u * (1 - u); }
      else { const u = (q - c.throw) / (1 - c.throw); x = cx + c.half - 2 * c.half * u; y = base - 4 * c.low * u * (1 - u); }
      dot(g, x, y, k.grey(i === 1 ? c.odd : c.rung), 1, c.size, c.size);
    }
  },
  'potion-fizz'(g, at, t, pass, k, s, over) {
    if (pass !== 'front') return;
    const c = A['potion-fizz'], b = at(t), tone = k.grey(c.rung);
    for (let i = 0; i < c.n; i++) {
      const l = life(t, i, c.n, c.life, c.seed + s);
      const x = b.x + c.at + hash(i, l.cyc) * c.spread, y = b.y - c.from - over - l.k * c.rise;
      if (l.k < c.grow) dot(g, x, y, tone, l.k / c.in);
      else if (l.k < c.ring) { dot(g, x + U, y, tone); dot(g, x, y + U, tone); dot(g, x + 2 * U, y + U, tone); dot(g, x + U, y + 2 * U, tone); }
      else {
        const q = (l.k - c.ring) / (1 - c.ring), d = U + q * c.fly;
        for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) dot(g, x + U + sx * d, y + U + sy * d, tone, 1 - q);
      }
    }
  },
  'dizzy-stars'(g, at, t, pass, k, s, over) {
    const c = A['dizzy-stars'], b = at(t), cx = b.x + MID - U / 2, cy = b.y - c.over - over;
    for (const off of [0, Math.PI]) {
      const an = t * c.speed + off + s, sn = Math.sin(an);
      if ((sn < 0) !== (pass === 'back')) continue;
      plus(g, cx + Math.cos(an) * c.r, cy + sn * c.ry, k.grey(c.rung));
    }
  },
  'shooting-star'(g, at, t, pass, k, s, over) {
    if (pass !== 'front') return;
    const c = A['shooting-star'], b = at(t), q = (t + s) % c.every;
    if (q > c.for) return;
    const u = q / c.for, x0 = b.x + c.from[0], y0 = b.y + c.from[1] - over, [dx, dy] = c.by;
    const a = Math.min(1, u / c.in, (1 - u) / c.out);
    for (let j = c.trail; j >= 1; j--) {
      const v = u - j * c.gap;
      dot(g, x0 + dx * v, y0 + dy * v, k.grey(c.rung - j * 2), a * (1 - j * c.thin));
    }
    plus(g, x0 + dx * u, y0 + dy * u, k.grey(c.rung), a);
  },
  'flock-overhead'(g, at, t, pass, k, s, over) {
    const c = A['flock-overhead'], b = at(t), cx = b.x + MID - U / 2, cy = b.y - c.over - over, tone = k.grey(c.rung);
    for (let i = 0; i < c.n; i++) {
      const an = t * (c.speed + i * c.step) + i * Math.PI + s, sn = Math.sin(an);
      if ((sn < 0) !== (pass === 'back')) continue;
      const x = cx + Math.cos(an) * c.r, y = cy + sn * c.ry - (i ? c.apart : 0), up = (Math.floor(t * c.flapHz) + i) % 2 ? -U : U;
      dot(g, x, y, tone); dot(g, x - U, y + up, tone); dot(g, x + U, y + up, tone);
    }
  },
  'speed-lines'(g, at, t, pass, k) {
    if (pass !== 'back') return;
    const c = A['speed-lines'], b = at(t);
    if (!b.moving) return;
    const f = Math.floor(t * c.hz) % 2;
    for (const [dy, l0, l1] of c.rows) {
      const len = snap(f ? l1 : l0), x = b.dir > 0 ? b.x - c.gap - len : b.x + WORKER + c.gap;
      dot(g, x, b.y + dy, k.grey(c.rung), c.ink, len, U);
    }
  },
  // the gold set's: the ring's far half behind the head, its near half and
  // the motes in front
  'gold-halo'(g, at, t, pass, k, s, over) {
    const c = A['gold-halo'], b = at(t), top = b.y - c.over - over, left = b.x;
    const a = 1 - c.breath + c.breath * Math.sin(t * c.breathHz);
    c.rows.forEach((r, ry) => {
      if ((ry < c.back) !== (pass === 'back')) return;
      [...r].forEach((ch, rx) => { if (ch === '#') dot(g, left + rx * U, top + ry * U, k.gold, a); });
    });
    if (pass === 'back') return;
    for (let i = 0; i < c.motes; i++) {
      const l = life(t, i, c.motes, c.life, c.seed + s);
      dot(g, left + 1 + hash(i, l.cyc) * c.spread + Math.sin(l.k * c.swayHz + i) * c.sway, top - c.lift - l.k * c.rise, k.gold,
          Math.sin(Math.PI * l.k));
    }
  },
};
const plus = (g, x, y, tone, a = 1) => {
  dot(g, x, y, tone, a); dot(g, x - U, y, tone, a); dot(g, x + U, y, tone, a); dot(g, x, y - U, tone, a); dot(g, x, y + U, tone, a);
};

// A body's walk, remembered: one sample a held frame, the last few seconds.
// The newest is always where the body stands now, so what rides with it
// (the orbit, the cloud) never lags it.
const TRAILS = new WeakMap();
function trail(l, x, y, t) {
  const live = { x, y, moving: !!l.moving, dir: l.dir || 1 };
  if (!l.key || typeof l.key !== 'object') return () => live;
  let tr = TRAILS.get(l.key);
  if (!tr || t < tr.last) TRAILS.set(l.key, tr = { last: -Infinity, s: [] });
  if (t > tr.last) {
    tr.s.push({ t, ...live });
    tr.last = t;
    while (tr.s.length > 1 && tr.s[0].t < t - WARD_AURA_KEEP_S) tr.s.shift();
  } else tr.s[tr.s.length - 1] = { t, ...live };
  const s = tr.s;
  return when => {
    if (when >= t) return live;
    for (let i = s.length - 1; i >= 0; i--) if (s[i].t <= when) return s[i];
    return s[0];
  };
}

// The look's aura, one pass of it, round a body standing with its top-left
// at (x, y). A look that says `aura: false` (a body under the rock) wears
// none.
export function dressAura(g, x, y, l, pass) {
  const draw = l && l.aura !== false && AURAS[l.outfit && l.outfit.aura];
  if (!draw) return;
  const t = Math.floor((l.t || 0) * WARD_AURA_FPS) / WARD_AURA_FPS;
  draw(g, trail(l, x, y, t), t, pass, l.deep ? INKS.deep : INKS.yard, (l.seed || 0) * WARD_AURA_SEED, headHeight(l));
}

// The auras drawn, by key, for the slot's own list to be checked against.
export const AURA_KEYS = Object.keys(AURAS);
