// The ten classes' attacks (docs/wave-party.md, "The picture"), ported from
// the owner's kit growth page (docs/mocks/kit-growth-2026-09-27.html) with
// all three of its passes on: the sauce (a wind-up, a beat's hit-pause, a
// carry past and an ease home, a heavy blow's recoil, the coil's give), the
// smears, and the classic pass (the clock stepped in held poses round every
// contact, a solid held smear the pose before it with a dark keyline where
// it crosses the hide, a two-pose held impact star, key poses pushed 1.7x,
// speed lines, a whole cell of squash and stretch).
//
// A class is a turn: `a` is seconds on the fighter's own clock since the turn
// began, and `hits` its contacts on that clock. The picks the owner made on
// the page are the only branches kept: Haymaker C, Whirlwind A with the heavy
// build-up and the Plant ending, thrust smear B, the spaced-bead arch and the
// connected halo, the traced glyph, the beam Mage with its white core only at
// rung 8 and a finishing blow.
//
// Positions are world cells (deep/kits.js): (x, restY) is the body's
// top-left where it stands, and the hide is asked of the coil as drawn this
// frame (render/serpent.js). What leaves the fighter -- an arrow, a beam, a
// charge, a hex, a note -- is handed to `api.shot` and drawn on the `shots`
// layer, over every fighter.
//
// The scales a blow knocks loose and the bite it takes are the sim's own
// (DESIGN.md, "Blows land"): the page's stand-ins for them are not ported.
//
// Owned by track RENDER.

import { P, DRAW_POSE, DRAW_KEY_EX, DRAW_NEAR_BEAT, DRAW_HAY_HOLDS, DRAW_HOLDS, DRAW_KICK } from '../config.js';
import { deepFloor } from '../deep/place.js';
import {
  GREYS, PURPLES, WHITE, BODY, R4, R8, hash, clamp, lerp, along, ease, cell, rect, ring, body, pips, blit,
  MOTES_P, MOTE_TONES, drift, bSize, bFist, bladeLen, sword, swordSprite, swordAt, TELL, MONK_SPIN, beads,
  ribbon, pike, staffBack, drawBow, blades, dagger, bundle, charge, motes, glyph, glyphTimes, glyphAt,
  stone, mStaff, flute, REST, liftOf,
} from '../deep/kits.js';
import { hideTop, hideBot, hideMid, onHide } from './serpent.js';

const POSE = DRAW_POSE, EX = DRAW_KEY_EX;
const cTop = cx => hideTop(Math.round(cx));
const cBot = cx => hideBot(Math.round(cx));
const cY = cx => hideMid(Math.round(cx));
const maxBot = xs => Math.max(...xs.map(c => cBot(c)));

// A wind-up and its settle: nothing until `lead` before `at`, easing out to
// `depth` (pushed by the key-pose factor) by `at`, then easing back over `back`.
const dip = (a, at, depth, lead = 0.15, back = 0.2) => {
  const u = a - at;
  if (u < -lead || u > back) return 0;
  depth *= EX;
  return u < 0 ? depth * ease((u + lead) / lead) : depth * (1 - ease(u / back));
};
// A melee fighter's swim: 0 where it stands, 1 under the coil.
const trip = (a, up, back, len) => a < up ? ease(a / up) : a < back ? 1 : 1 - ease(clamp((a - back) / (len - back), 0, 1));

// --- the classic pass's drawings -----------------------------------------------
const PAL_GREY = { lead: WHITE, body: GREYS[9], line: GREYS[10], ramp: [WHITE, GREYS[10], GREYS[9], GREYS[7], GREYS[5]] };
const PAL_PURPLE = { lead: PURPLES[11], body: PURPLES[8], line: PURPLES[10], ramp: [PURPLES[11], PURPLES[10], PURPLES[9], PURPLES[7], PURPLES[5]] };
// A held smear: the cells a turning weapon sweeps from `from` to `to` about
// the pivot cell (px, py), radius r0 to r1 -- solid, the leading edge white,
// a step of grey inside; where the leading edge crosses the white hide, a
// dark keyline one cell ahead keeps it from vanishing.
function boldArc(g, px, py, from, to, r0, r1, lead, pal = PAL_GREY) {
  const seen = new Map(), n = Math.max(3, Math.ceil(Math.abs(to - from) * r1 * 1.6)), dir = Math.sign(to - from) || 1;
  for (let i = 0; i <= n; i++) {
    const q = i / n, an = lerp(to, from, q);
    for (let r = r0; r <= r1; r++) {
      const ox = Math.round(Math.sin(an) * r), oy = Math.round(-Math.cos(an) * r), key = ox + ',' + oy;
      if (!seen.has(key)) seen.set(key, [ox, oy, q]);
    }
  }
  for (const [ox, oy, q] of seen.values()) {
    if (q < 0.1 && onHide(px + ox, py + oy)) {
      const ka = to + dir * 0.9 / r1, r = Math.hypot(ox, oy);
      cell(g, px + Math.round(Math.sin(ka) * r), py + Math.round(-Math.cos(ka) * r), GREYS[2]);
    }
    cell(g, px + ox, py + oy, q < 0.1 ? pal.lead : pal.body);
  }
  for (let r = lead; r < r0; r++) cell(g, px + Math.round(Math.sin(to) * r), py + Math.round(-Math.cos(to) * r), pal.line);
}
// A held streak: a thrust's travel from the point (x, top) down to `bottom`,
// solid -- the point white, then bright, then one grey -- with a dark keyline
// over the point if it sits on the hide.
function boldStreak(g, x, top, bottom, tip = WHITE, purple = false) {
  if (onHide(x, top)) cell(g, x, top - 1, GREYS[2]);
  cell(g, x, top, tip);
  for (let y = top + 1; y <= bottom; y++) cell(g, x, y, y - top < 3 ? (purple ? PURPLES[10] : GREYS[10]) : purple ? PURPLES[8] : GREYS[9]);
}
// Speed lines: `n` short straight streaks trailing (below) a fast thing at
// column cx, row cy, a cell or two to its sides.
function speed(g, cx, cy, n = 2, len = 3, purple = false) {
  const cols = [-1, 1, -2, 2], tones = purple ? [PURPLES[10], PURPLES[8], PURPLES[6]] : [GREYS[9], GREYS[7], GREYS[5]];
  for (let i = 0; i < n; i++) for (let j = 0; j < len; j++)
    cell(g, cx + cols[i], cy + 1 + (i % 2) + j, tones[Math.min(2, j)]);
}
// The impact star, held two poses: first a bold star of cells at the
// contact, bright; then broken, its arms thrown a cell further out and
// dimmer. The arms start two cells out, so the fist or blade reads on top.
const ARMS = [[-1, 0, 1], [1, 0, 1], [0, 1, 1], [-1, 1, 0], [1, 1, 0], [-1, -1, 0], [1, -1, 0]];
function star(g, t, t0, cx, cy, k, o = {}) {
  const u = t - t0;
  if (u < 0 || u >= 2 * POSE) return;
  const L = 3 + Math.round(2 * k), broke = u >= POSE;
  for (const [dx, dy, main] of ARMS) {
    const len = main ? L : Math.max(2, L - 1);
    for (let r = 2; r <= len; r++) {
      if (broke && r % 2 === 0) continue;
      const rr = broke ? r + 1 : r, x = cx + dx * rr, y = cy + dy * rr;
      const tone = o.purple ? (broke ? (r < len ? PURPLES[9] : PURPLES[7]) : r < len ? PURPLES[11] : PURPLES[10])
        : broke ? (r < len ? GREYS[9] : GREYS[7]) : r < len ? WHITE : GREYS[10];
      cell(g, x, y, onHide(x, y) ? GREYS[3] : tone);
    }
  }
}
// Is `a` the pose just before a contact at `at` (the smear), or the contact's own (the hold)?
const smearPose = (a, at) => a >= at - POSE - 1e-9 && a < at - 1e-9;
const holdPose = (a, at) => Math.abs(a - at) < 1e-6;

// --- the fighter's clock -----------------------------------------------------------
// Each contact (`hits`, on the fighter's own clock) holds the fighter still
// a beat, so the posed clock runs behind the raw one; round each strike it
// steps in held poses, one of them landing on the contact itself. `real` is
// when a contact lands on the raw clock -- what the coil's give and the
// star are timed by, and when the sim should strike (`contactTimes`).
// `kick` is the recoil after a heavy one, in cells.
function groupsOf(c, R, x) {
  const groups = [];
  for (const h of c.hits(R, x).sort((p, q) => p.at - q.at)) {
    const gr = groups.find(o => Math.abs(o.at - h.at) < 1e-6);
    if (gr) { gr.k = Math.max(gr.k, h.k); gr.list.push(h); } else groups.push({ at: h.at, k: h.k, list: [h] });
  }
  let shift = 0;
  for (const gr of groups) {
    // a hit may ask for a longer hold of its own (the Whirlwind's last)
    const own = Math.max(0, ...gr.list.map(h => h.pause || 0));
    gr.real = gr.at + shift;
    gr.pause = Math.max(own, (gr.list.some(h => h.kind === 'hay') ? DRAW_HAY_HOLDS : DRAW_HOLDS) * POSE);
    // a beam's ticks land without holding her: the beam runs on through them
    if (gr.list.every(h => h.noPause)) gr.pause = 0;
    shift += gr.pause;
  }
  return groups;
}
export function sauceOf(c, R, a, x) {
  const groups = groupsOf(c, R, x);
  let aw = null, kick = 0;
  for (const gr of groups) {
    const shift = gr.real - gr.at;
    if (aw == null && a < gr.real) aw = a - shift;
    else if (aw == null && a < gr.real + gr.pause) aw = gr.at;
    const u = a - gr.real - gr.pause, amt = DRAW_KICK.find(([k]) => gr.k >= k)?.[1] || 0;
    if (amt && u >= 0 && u < 0.5) kick += amt * (u < 0.05 ? u / 0.05 : 1 - ease((u - 0.05) / 0.45));
  }
  if (aw == null) aw = a - (groups.length ? groups[groups.length - 1].real + groups[groups.length - 1].pause - groups[groups.length - 1].at : 0);
  const beats = [...groups.filter(gr => gr.pause > 0).map(gr => gr.at), ...(c.beats ? c.beats(R) : [])];
  let best = null;
  for (const b of beats) if (Math.abs(aw - b) <= DRAW_NEAR_BEAT && (best == null || Math.abs(aw - b) < Math.abs(aw - best))) best = b;
  const step = c.poseStep ? c.poseStep(R, aw) : POSE;
  if (best != null) aw = best + Math.floor((aw - best) / step + 1e-9) * step;
  return { a: aw, kick: Math.min(c.kickMax ?? 0, kick), groups, R };
}
// The coil's give under this turn's contacts: where and how hard, and when
// each landed, in world seconds (`t` now, `a` the raw clock).
export const dentsOf = (S, t, a) => S.groups.flatMap(gr => gr.list.map(h => ({ x: h.x, k: h.k, t0: t - (a - gr.real) })));
// The held star at each contact, under the fighter so the fist or blade reads on top.
export function sparksOf(g, S, t, a) {
  for (const gr of S.groups) for (const h of gr.list) {
    const t0 = t - (a - gr.real), cy = cBot(h.x) + 1;
    // at rung 8 every capstone contact is the abyss's: its star in the purples
    const po = R8(S.R ?? 0) && h.purple !== false ? { purple: true } : {};
    // the Haymaker's star a pose late (C); the Whirlwind's on its middle hit only (A)
    if (h.kind === 'hay') star(g, t, t0 + POSE, Math.round(h.x), cy, h.k, po);
    else if (h.kind === 'whirl') { if (h.mid) star(g, t, t0, Math.round(h.x), cy, h.k, po); }
    else star(g, t, t0, Math.round(h.x), cy, h.k, po);
  }
}

// --- the Brawler -----------------------------------------------------------------
// A punch's reach at `a` for one landing at L: 1 at the hide, negative the
// wind-up in cells. It winds back `wind` cells (eased), drives in
// accelerating, carries a little past the hide and eases home.
function punchReach(a, L, wind = 1) {
  const d = a - L;
  if (d < -0.34 || d > 0.42) return 0;
  if (d < -0.1) return -wind * ease((d + 0.34) / 0.24);
  if (d < 0) return lerp(-wind, 1, ((d + 0.1) / 0.1) ** 2);
  if (d < 0.07) return 1 + 0.2 * Math.sin(Math.PI * d / 0.07);
  return 1 - ease((d - 0.07) / 0.35);
}
const brawler = {
  len: 3.0, kickMax: 2,
  punches(R) {
    const p = [[0.6, -1], [1.0, 1], [1.4, -1], [1.9, 1]].map(([at, side]) => ({ at, side, k: 0.3, size: bSize(R) }));
    if (R4(R)) Object.assign(p[3], { size: bSize(R) + 1, k: 0.75, hay: true });
    return p;
  },
  hits(R, x) { return this.punches(R).map(p => { const fx = p.side < 0 ? x - p.size : x + BODY; return { at: p.at, x: fx + (p.size - 1) / 2, k: p.k, kind: p.hay ? 'hay' : '' }; }); },
  draw(g, t, a, api, R, x) {
    const ps = this.punches(R), hover = maxBot([x - 2, x + 5]) + 5;
    let y = lerp(api.restY, hover, trip(a, 0.4, 2.5, this.len)) + api.kick;
    const hay = ps.find(p => p.hay);
    // the haymaker's wind-up: the body sinks
    if (hay) y += dip(a, hay.at - 0.12, 2, 0.33, 0.1);
    const spot = p => { const size = p.size || 1, fx = p.side < 0 ? x - size : x + BODY; return { fx, size, cx: fx + (size - 1) / 2 }; };
    body(x, y);
    for (const side of [-1, 1]) {
      let reach = 0, size = bSize(R), held = null;
      for (const p of ps.filter(p => p.side === side)) { const r = punchReach(a, p.at, (p.hay ? 2 : 1) * EX); if (r) { reach = r; size = p.size; if (holdPose(a, p.at)) held = p; } }
      const fx = side < 0 ? x - size : x + BODY, rest = y;
      let fy = reach < 0 ? rest - reach : rest;
      if (reach > 0) fy = rest + (maxBot([fx, fx + size - 1]) + 1 - rest) * reach;
      if (held) {
        // the fist squashed a cell wider and a cell shorter against the hide,
        // a dark keyline round it; the haymaker trails speed lines
        rect(g, fx - (side < 0 ? 1 : 0) - 1, fy - 1, size + 3, 3, GREYS[2]);
        rect(g, fx - (side < 0 ? 1 : 0), fy, size + 1, 1, R4(R) ? WHITE : GREYS[10]);
        if (held.hay) speed(g, fx + size / 2 - 0.5, fy, 4, 3);
      } else bFist(g, fx, fy, size, R, t, side);
    }
    if (hay) {
      const d = a - hay.at, cx = spot(hay).cx, cy = cBot(cx);
      if (d >= 0 && d < 0.5) ring(g, cx, cy, 1 + d * 14, d < 0.25 ? WHITE : GREYS[7], 2);
      if (R8(R) && d >= 0.35 && d < 0.85) ring(g, cx, cy, 1 + (d - 0.35) * 14, d < 0.6 ? GREYS[9] : GREYS[6], 2);
    }
  },
};

// --- the Swordsman ---------------------------------------------------------------
// The blade's angle is a track of keys: [time, angle, how it gets there, and
// for a contact its strength]. 'in' accelerates (a strike), 'out'
// decelerates (a carry), 'io' eases both ends, 'lin' holds its speed. A
// contact is always at a whole turn, the blade straight up into the hide.
//   Rung 0, the cut: a held wind-up cocked far back over the shoulder, a
//   strike into the hide, a follow-through well past, then home.
//   Rung 4, the Whirlwind, the heaviest thing drawn: he sinks two cells with
//   the blade drawn far back and low and holds the strain; three turns, each
//   faster than the last, a contact at the top of each, the last the
//   biggest; then the Plant -- carried down in front of him, planted
//   point-down, his weight settling, lifted back.
//   Rung 8: the last turn carrying straight into a spin back (the third cut
//   hits twice), then the Plant turning the other way.
const TURN = 2 * Math.PI;
const swordsman = {
  len: 3.4, kickMax: 2,
  HELD: [-1.2, -0.7],
  SPIN: { sink: 0.5, coiled: 0.7, go: 0.95, c1: 1.23, c2: 1.53, c3: 1.73 },
  track(R) {
    const T = TURN, K = [];
    if (!R4(R)) {
      const H = -1.2, W = -2.5;
      for (const c of [0.8, 1.4, 2.0]) K.push([c - 0.26, H, 'io'], [c - 0.08, W, 'io'], [c, 0, 'in', 0.45], [c + 0.12, 1.9, 'out'], [c + 0.34, H, 'io']);
      return K;
    }
    const H = -0.7, B = -2.6, S = this.SPIN;
    K.push([S.sink, H, 'io'], [S.coiled, B, 'io'], [S.go, B, 'io'],
      [S.c1, 0, 'in', 0.35], [S.c2, T, 'lin', 0.5], [S.c3, 2 * T, 'lin', 1.3]);
    if (!R8(R)) {
      K.push([2.1, 2 * T + Math.PI, 'out'], [2.3, 2 * T + Math.PI, 'io'], [2.75, 3 * T + H, 'io']);
      return K;
    }
    K.push([1.9, 2 * T + 0.6, 'out'], [2.25, T, 'in', 0.9]);
    K.push([2.6, T - Math.PI, 'out'], [2.8, T - Math.PI, 'io'], [3.25, T + H, 'io']);
    return K;
  },
  contacts(R) { return this.track(R).filter(k => k[3]).map(k => ({ at: k[0], k: k[3] })); },
  // slower through the build-up and the Plant, quicker with each turn, so
  // the pose rate rises through the spin
  poseStep(R, a) {
    if (!R4(R)) return POSE;
    const S = this.SPIN;
    return a < S.go ? 0.1 : a < S.c1 ? 0.07 : a < S.c2 ? 0.055 : a < S.c3 ? 0.04 : 0.09;
  },
  angle(R, a) {
    const K = this.track(R);
    if (a < K[0][0] || a >= K[K.length - 1][0]) return null;
    for (let i = 1; i < K.length; i++) {
      const [t1, a1, e] = K[i], [t0, a0] = K[i - 1];
      if (a >= t1) continue;
      const u = (a - t0) / (t1 - t0);
      return lerp(a0, a1, e === 'in' ? u * u : e === 'out' ? 1 - (1 - u) * (1 - u) : e === 'lin' ? u : ease(u));
    }
    return null;
  },
  hits(R, x) {
    const px = x + 1, cs = this.contacts(R);
    return cs.flatMap(({ at, k }) => (R4(R) ? [px - 6, px, px + 6] : [px]).map(sx => ({
      at, x: sx, k: sx === px ? k : Math.min(k, 0.5), kind: R4(R) ? 'whirl' : '', mid: sx === px,
      // the Whirlwind's last contact holds longest
      pause: k >= 1.2 ? 0.2 : 0 })));
  },
  draw(g, t, a, api, R, x) {
    const L = bladeLen(R), spin = R4(R), pal = R8(R) ? PAL_PURPLE : PAL_GREY;
    // a cut pivots over his head; a spin about the body's middle, the blade clear of it
    const from = spin ? 2 : 1, reach = from + L + 1, tip = reach;
    const hover = maxBot([x - 1, x + 3]) + reach + (spin ? -1 : 0);
    const k = trip(a, 0.4, 3.0, this.len), cs = this.contacts(R).map(c => c.at);
    let y = lerp(api.restY, hover, k) + api.kick, bx = x;
    const S = this.SPIN, last = cs[cs.length - 1];
    if (spin) {
      // the build-up: he sinks two cells and holds the coil, then rises into the spin
      y += a < S.sink ? 0 : a < S.coiled ? 2 * ease((a - S.sink) / (S.coiled - S.sink)) : a < S.go ? 2 : a < S.go + 0.12 ? 2 * (1 - ease((a - S.go) / 0.12)) : 0;
      // the Plant: his weight settling a cell as the blade plants
      const u = a - last;
      if (u > 0.2 && u < 1.0) y += u < 0.37 ? ease((u - 0.2) / 0.17) : u < 0.57 ? 1 : 1 - ease((u - 0.57) / 0.43);
    } else for (const c of cs) {
      // the cut: the body leans into the swing by a cell and settles
      const u = a - c;
      if (u > -0.08 && u < 0.34) bx += u < 0 ? ease((u + 0.08) / 0.08) : u < 0.14 ? 1 : 1 - ease((u - 0.14) / 0.2);
    }
    const px = bx + 1, py = spin ? y + 1 : y - 1;
    body(bx, y);
    api.at(bx, y);
    if (k < 0.2) { sword(g, bx - 3, y + 1, R, t); return; }
    const held = this.HELD[spin ? 1 : 0], at = a0 => this.angle(R, a0) ?? held;
    let ang = at(a);
    // the strain of the coil: the blade trembles a little, and dust puffs off his feet
    if (spin && a >= S.coiled && a < S.go) {
      ang += Math.floor(a / 0.08) % 2 ? 0.07 : -0.07;
      const f = (a - S.coiled) / (S.go - S.coiled);
      for (const side of [-1, 1]) {
        const dx = side < 0 ? bx - 1 - Math.floor(f * 2) : bx + BODY + Math.floor(f * 2);
        cell(g, dx, y + 2 - Math.floor(f * 2), f < 0.5 ? GREYS[7] : GREYS[5]);
      }
    }
    // rung 8's combo trails the blade the whole way: a dim arc behind its point
    if (R8(R) && this.angle(R, a) != null) {
      const back = at(a - 0.12), dir = Math.sign(ang - back);
      if (Math.abs(ang - back) > 0.2) for (let q = 0.15; q <= 1; q += 0.1) {
        const an = lerp(ang - dir * 0.15, back, q);
        for (const r of [tip, tip - 1]) cell(g, px + Math.round(Math.sin(an) * r), py + Math.round(-Math.cos(an) * r), q < 0.5 ? pal.ramp[3] : pal.ramp[4]);
      }
    }
    const swung = () => {
      blit(g, swordSprite(R, from), (px + 0.5) * P, (py + 0.5) * P, ang);
      if (R8(R)) { drift(g, ...swordAt(px, py, ang, from + 2), t, 1, 0.3, 3, 2.2, MOTES_P); drift(g, ...swordAt(px, py, ang, from + 4), t, 1, 0.8, 3, 2.2, MOTES_P); }
    };
    // the fastest turn: a thin ring of smear most of the way round, a gap
    // behind the blade, with the blade itself on it
    const pre = cs.find(c => smearPose(a, c));
    if (spin && a > S.c2 && a < S.c3) {
      boldArc(g, px, py, ang - 2 * Math.PI + 1.0, ang, tip - 1, tip, tip - 1, pal);
      swung();
    } else if (pre != null) {
      // where the blade was two and a half poses back, brought round to within
      // a turn behind where it bites, kept to a crescent
      const to = at(pre), sgn = Math.sign(to - at(pre - 0.02)) || 1;
      let span = ((sgn * (to - at(pre - 2.5 * POSE))) % TURN + TURN) % TURN;
      if (span < 0.3) span = 1.4;
      const back = to - sgn * Math.min(span, 2.4);
      boldArc(g, px, py, back, to, tip - 2, tip, from, pal);
      for (const [dA, r0] of [[0.25, tip], [0.45, tip - 2]]) for (let j = 0; j < 2; j++) {
        const an = back - sgn * (dA + j * 0.12);
        cell(g, px + Math.round(Math.sin(an) * r0), py + Math.round(-Math.cos(an) * r0), j ? pal.ramp[4] : pal.ramp[3]);
      }
    } else swung();
  },
};

// --- the Monk ----------------------------------------------------------------------
// Palms build chi; a chi palm stuns. The beads tell the chi, and their spin
// builds into each palm (the owner: "build up to the attack. instead of a
// linear speed"), peaking at the release and easing out; the chi palm builds
// longer and peaks harder, and the ring draws in at a peak.
const monk = {
  len: 3.1, kickMax: 0.75,
  palms(R) { return R4(R) ? [0.3, 0.8, 1.3, 2.0] : [0.3, 0.75, 1.2, 1.65, 2.2]; },
  chi(R) { return R4(R) ? 2 : 4; },   // palms to a chi palm, the last of them the chi palm
  hits(R, x) { return this.palms(R).map((p, i) => ({ at: p + 0.5, x: x + 1, k: i === this.chi(R) ? 0.7 : 0.3 })); },
  beats(R) { return this.palms(R); },
  // `th` is the turn so far -- the speed summed over her clock, so a
  // hit-pause holds it -- and `tight` how far the ring has drawn in.
  spin(R, a) {
    const ps = this.palms(R), n = this.chi(R);
    const at = u => {
      let w = MONK_SPIN, tight = 0;
      ps.forEach((p, i) => {
        const big = i === n, L = big ? 0.5 : 0.3, D = big ? 0.5 : 0.35, pk = big ? 13 : 6, tk = big ? 1 : 0.4;
        if (u >= p - L && u < p) { const q = (u - p + L) / L; w = Math.max(w, MONK_SPIN + (pk - MONK_SPIN) * q * q); tight = Math.max(tight, tk * q * q); }
        else if (u >= p && u < p + D) { const v = 1 - (u - p) / D; w = Math.max(w, MONK_SPIN + (pk - MONK_SPIN) * v * v); tight = Math.max(tight, tk * v * v); }
      });
      return [w, tight];
    };
    let th = 0;
    for (let u = 0; u < a; u += 0.01) th += at(u)[0] * Math.min(0.01, a - u);
    return { th, tight: at(a)[1] };
  },
  draw(g, t, a, api, R, x) {
    const ps = this.palms(R), n = this.chi(R);
    // he sinks into each palm, deeper for the chi palm, and rises out of it
    let dy = 0;
    ps.forEach((p, i) => { dy += dip(a, p, i === n ? 1 : 0.5, 0.15, 0.25); });
    const y = api.restY - liftOf('monk', R) + Math.min(1, dy + api.kick);
    const lit = ps.filter((p, i) => i < n && a >= p).length % (n + 1);
    body(x, y);
    api.at(x, y);
    // the chi count on the beads: one lit a chi, the fifth as she gathers the chi palm
    const chiN = a >= ps[n] - 0.15 && a < ps[n] + 0.5 ? 5 : Math.min(4, R4(R) ? lit * 2 : lit);
    // the chi palm's peak, held as a smear round the ring: the pose before its release
    const sp = this.spin(R, a), cp = ps[n];
    beads(g, x, y, R, t, i => i < chiN, chiN >= 5, { u: a, th: sp.th, tight: sp.tight, smear: a >= cp - POSE - 1e-9 && a < cp - 1e-9 });
    const spent = a >= ps[n] && a < ps[n] + 0.4;
    pips(g, x, y, R4(R) ? lit * 2 : lit, 4, spent ? 1 : 0);
    // the palm's wave, rising off her to the hide, and its ring there
    api.shot(() => ps.forEach((p, i) => {
      const big = i === n, d = a - p, top = y - 2, hit = cBot(x + 1) + 1;
      if (d >= 0 && d < 0.5) {
        const k = (d / 0.5) ** 1.6, wy = lerp(top - 1, hit, k), half = (big ? 2 : 1) + Math.round(k * 2);
        for (let dx = -half; dx <= half; dx++) cell(g, x + 1 + dx, wy, Math.abs(dx) === half ? PURPLES[8] : PURPLES[11]);
      }
      if (d >= 0.5 && d < 1.0) ring(g, x + 1, hit - 1, 1 + (d - 0.5) * (big ? 12 : 8), [PURPLES[11], PURPLES[9], PURPLES[7], PURPLES[5]][Math.floor((d - 0.5) / 0.125)], 2);
    }));
  },
};

// --- the Martial Artist --------------------------------------------------------------
const martial = {
  len: 3.0, kickMax: 1.5,
  plan(R) { return R4(R) ? { thrusts: [0.5, 0.8, 1.1], fin: 1.5, after: [2.0, 2.3], per: 2 } : { thrusts: [0.5, 0.75, 1.0, 1.25, 1.5], fin: 1.9, after: [], per: 1 }; },
  hits(R, x) { const pl = this.plan(R); return [...pl.thrusts, ...pl.after].map(p => ({ at: p, x: x + 1, k: 0.18 })).concat([{ at: pl.fin, x: x + 1, k: 0.7 }]); },
  // A thrust's tip: pulled down a cell, driven up accelerating, a little
  // into the hide, then eased home. Null outside every thrust.
  tipAt(a, all, rt, ht) {
    for (const p of all) {
      const u = a - p;
      if (u < -0.2 || u >= 0.25) continue;
      if (u < -0.08) return rt + EX * ease((u + 0.2) / 0.12);
      if (u < 0) return lerp(rt + EX, ht, ((u + 0.08) / 0.08) ** 2);
      if (u < 0.05) return ht - 0.4 * Math.sin(Math.PI * u / 0.05);
      return lerp(ht, rt, ease((u - 0.05) / 0.2));
    }
    return null;
  },
  draw(g, t, a, api, R, x) {
    const pl = this.plan(R), hover = maxBot([x - 2, x + 4]) + 6;
    // she sinks before the finisher
    const y = lerp(api.restY, hover, trip(a, 0.35, 2.5, this.len)) + api.kick + dip(a, pl.fin - 0.15, 1.5, 0.2, 0.15);
    const all = [...pl.thrusts, ...pl.after];
    const sweep = a >= pl.fin - 0.15 && a < pl.fin + 0.3;
    const on = all.find(p => a >= p - 0.08 && a < p + 0.12);
    body(x, y);
    api.at(x, y);
    if (sweep && smearPose(a, pl.fin)) {
      // the finisher's sweep held as one wide bold arc up to the hide
      const top = maxBot([x - 2, x + 4]) + 1, rows = Math.max(2, Math.round(y - 1 - top) + 1);
      for (let i = rows - 1; i >= 0; i--) {
        const sh = Math.floor(i * 3 / rows);
        for (let c = x - 2 + sh; c <= x + 4 - sh; c++) cell(g, c, top + i, R8(R) ? (i === 0 ? PURPLES[11] : i === 1 ? PURPLES[10] : PURPLES[8]) : i === 0 ? WHITE : i === 1 ? GREYS[10] : GREYS[9]);
      }
      if (R8(R)) pike(g, x + 4, top, 1, 0);
      // the speed lines trail the staff's two ends, clear of her body
      for (const ex of [x - 2, x + 4]) for (let j = 0; j < 3; j++) cell(g, ex, top + rows + j, R8(R) ? [PURPLES[10], PURPLES[8], PURPLES[6]][j] : j === 0 ? GREYS[9] : j === 1 ? GREYS[7] : GREYS[5]);
    } else if (sweep) {
      // the finisher: flat over her head, pressed into the hide
      const row = a >= pl.fin ? maxBot([x - 2, x + 4]) + 1 : y - 1;
      for (let c = x - 2; c <= x + 4; c++) cell(g, c, row, c === x - 2 || c === x + 4 ? WHITE : GREYS[8]);
      if (R4(R)) ribbon(g, x - 2, row, -1, t, 4, 0, R8(R));
      if (R8(R)) pike(g, x + 4, row, 1, 0);
    } else if (a > 0.3 && a < 2.5) {
      // on end through her middle, the tip driven up to the hide on a thrust
      const blade = R8(R) ? 3 : 0, ht = cBot(x + 1) + 1 + blade;
      const st = this.tipAt(a, all, y - 3, ht);
      const tip = st != null ? st : on != null ? ht : y - 3;
      const cp = all.find(p => smearPose(a, p)), hp = all.find(p => holdPose(a, p));
      if (cp != null) {
        // the pose before contact: a tapered wedge, three cells at the point
        // (and down the pike's blade, which leads at rung 8) narrowing to one;
        // at rung 8 in the purples
        const top = ht - blade, bot = tip + 7, n = bot - top, pu = R8(R);
        for (let yy = top; yy <= bot; yy++) {
          const q = (yy - top) / Math.max(1, n), k = yy - top, half = k < 2 + blade ? 1 : 0;
          const core = yy === top || (blade && k < blade) ? (pu ? PURPLES[11] : WHITE) : q < 0.5 ? (pu ? PURPLES[10] : GREYS[10]) : pu ? PURPLES[8] : GREYS[9];
          for (let dx = -half; dx <= half; dx++) cell(g, x + 1 + dx, yy, dx ? (pu ? PURPLES[8] : GREYS[9]) : core);
        }
        if (onHide(x + 1, top)) for (let dx = -1; dx <= 1; dx++) cell(g, x + 1 + dx, top - 1, GREYS[2]);
      } else {
        for (let r = 0; r < 7; r++) cell(g, x + 1, tip + r, r === 0 && !blade ? (on != null ? WHITE : GREYS[9]) : GREYS[8]);
        if (blade) pike(g, x + 1, tip, 0, -1);
        // contact: the tip stretched a cell longer into the hide
        if (hp != null) cell(g, x + 1, tip - blade - 1, WHITE);
      }
      body(x, y);
      // the ribbon is tied to the staff's foot, inside her body on a thrust:
      // only its waving tail pokes out past her edge
      if (R4(R)) ribbon(g, x + 1, tip + 6, -1, t, 4, 0, R8(R));
    } else staffBack(g, x, y, R, t);
    // the pips: thrusts since the last finisher
    let n = 0;
    for (const p of pl.thrusts) if (a >= p) n += pl.per;
    if (a >= pl.fin) { n = 0; for (const p of pl.after) if (a >= p) n += pl.per; }
    pips(g, x, y, Math.min(5, n), 5, sweep ? 1 : 0);
  },
};

// --- the Ranger ------------------------------------------------------------------
const ranger = {
  len: 3.2, shots: [0.6, 0.95, 1.3, 1.65], aimed: 2.45,
  beats(R) { return R4(R) ? [...this.shots, this.aimed] : [0.8]; },
  hits(R, x) {
    const lx = x + 1, hs = (R4(R) ? this.shots : [0.8]).map(v => ({ at: v + 0.25, x: lx, k: 0.2, purple: false }));
    if (R4(R)) for (const dx of [-1, 1]) hs.push({ at: this.aimed + 0.1, x: lx + dx, k: 0.8 });
    return hs;
  },
  draw(g, t, a, api, R, x) {
    // rung 0 shoots once; from rung 4 a run of arrows, then the aimed shot, two at once
    const y = api.restY, aimed = R4(R) ? this.aimed : null;
    const shots = R4(R) ? this.shots : [0.8];
    const last = aimed || shots[shots.length - 1], up = 0.15, down = last + 0.35;
    const pulling = shots.some(v => a >= v - 0.18 && a < v) || (aimed && a >= 1.9 && a < aimed);
    const pose = a < up || a >= down + 0.24 ? 'rest' : a < up + 0.12 || a >= down + 0.12 ? 'lift'
               : a < up + 0.24 || a >= down ? 'over' : pulling ? 'drawn' : 'braced';
    body(x, y);
    api.at(x, y);
    drawBow(g, pose, x, y, R, aimed && a >= 1.9 && a < aimed);
    const lx = x + 1, ly = y - 6, ty = cBot(lx) + 1;
    api.shot(() => {
      // the aim: a dotted line up to the hide and a ring closing on the spot
      if (aimed && a >= 1.95 && a < aimed) {
        const tone = a > 2.25 ? GREYS[9] : GREYS[6];
        for (let cy = ly - 1; cy > ty; cy -= 2) cell(g, lx, cy, tone);
        ring(g, lx, ty - 1, Math.max(1, Math.round(4 - (a - 1.95) * 5)), tone, 2);
      }
      const arrows = shots.map(v => ({ at: v, fly: 0.25, ax: lx }));
      if (aimed) for (const dx of [-1, 1]) arrows.push({ at: aimed, fly: 0.1, aimed: true, ax: lx + dx });
      for (const ar of arrows) {
        const d = a - ar.at, ax = ar.ax, ay = cBot(ax) + 1;
        if (d < 0) continue;
        const pu = ar.aimed;
        if (d < ar.fly) {
          const hy = lerp(ly, ay, d / ar.fly);
          cell(g, ax, hy, pu ? PURPLES[11] : WHITE); cell(g, ax, hy + 1, pu ? PURPLES[10] : GREYS[10]); cell(g, ax, hy + 2, pu ? PURPLES[8] : GREYS[8]);
          speed(g, ax, hy + 1, 2, 3, pu && R8(R));
          // rung 8's aimed arrows leave a short purple trail
          if (pu && R8(R)) { cell(g, ax, hy + 3, PURPLES[7]); cell(g, ax, hy + 4, PURPLES[5]); }
          continue;
        }
        // stuck in the hide a moment, then gone
        const since = d - ar.fly;
        if (since < 0.9) { const tone = pu ? PURPLES[since < 0.4 ? 9 : 6] : GREYS[since < 0.4 ? 9 : 6]; cell(g, ax, ay, tone); cell(g, ax, ay + 1, tone); }
      }
      if (aimed) { const since = a - aimed - 0.1; if (since >= 0 && since < 0.45) ring(g, lx, ty - 1, 1 + since * 14, R8(R) ? (since < 0.2 ? PURPLES[11] : PURPLES[8]) : since < 0.2 ? WHITE : GREYS[7], 2); }
    });
  },
};

// --- the Assassin ------------------------------------------------------------------
// She floats up to get in reach, then holds nearly still, a cell's give at
// each stab, while the dagger does the travelling up to the hide and back:
// the two taking turns from rung 4, and at rung 8 each spinning as it goes.
const assassin = {
  len: 3.0, stabs: [0.6, 1.1, 1.6, 2.1], out: 0.2, back: 0.3, kickMax: 1.5,
  stabK(R, i) { return R8(R) && i === 3 ? 1 : R4(R) ? 0.25 + i * 0.12 : 0.3; },
  hits(R, x) { const bs = blades(x, R); return this.stabs.map((p, i) => ({ at: p, x: bs[i % bs.length], k: this.stabK(R, i) })); },
  draw(g, t, a, api, R, x) {
    const bs = blades(x, R), hover = maxBot([x - 2, x + 4]) + 9;
    let y = lerp(api.restY, hover, trip(a, 0.35, 2.45, this.len)) + api.kick;
    if (this.stabs.some(p => a >= p - 0.05 && a < p + 0.1)) y -= 1;
    body(x, y);
    api.at(x, y);
    // which blade each stab is: the one at rung 0, turn and turn about after;
    // the window opens a beat early for the dagger's pull back
    const flying = new Map();
    this.stabs.forEach((p, i) => {
      const bx = bs[i % bs.length], d = a - p + this.out;
      if (d >= -0.12 && d < this.out + this.back) flying.set(bx, d);
      const e = a - p;
      if (R8(R) && i === 3 && e >= 0 && e < 0.3) ring(g, bx, cY(bx), Math.round(6 - e * 16), PURPLES[e < 0.15 ? 11 : 8]);
    });
    for (const bx of bs) {
      const home = y, d = flying.get(bx);
      if (d == null) { dagger(g, bx, home, R); continue; }
      // out fast, point first, to where its tip meets the belly; back slower:
      // pulled back a cell, then out accelerating, a little into the hide, eased home
      const top = cBot(bx) + 4, u = d - this.out;
      const gy = u < -this.out ? home + EX * ease((d + 0.12) / 0.12)
               : u < 0 ? lerp(home + EX, top, ((u + this.out) / this.out) ** 2)
               : u < 0.05 ? top - 0.5 * Math.sin(Math.PI * u / 0.05)
               : lerp(top, home, ease((u - 0.05) / (this.back - 0.05)));
      const spins = R8(R) ? (d < this.out ? d / this.out : 1 + (d - this.out) / this.back) * Math.PI * 2 : 0;
      if (u >= -POSE - 1e-9 && u < -1e-9) {
        // the pose before contact: a held streak from the hide down to her fist
        boldStreak(g, bx, top - 3, gy + 1, R8(R) ? PURPLES[11] : WHITE, R8(R));
        speed(g, bx, gy, 2, 3, R8(R));
      } else dagger(g, bx, gy, R, spins);
    }
  },
};

// --- the Sapper --------------------------------------------------------------------
const sapper = {
  len: 3.2, throwAt: 0.3, fly: 0.6, blowAt: 2.1,
  targets(R, x) { return R8(R) ? [x - 1, x + 8] : [x + 4]; },
  hits(R, x) { return this.targets(R, x).map((tx, i) => ({ at: R4(R) ? this.blowAt : this.throwAt + i * 0.15 + this.fly, x: tx, k: R4(R) ? 0.9 : 0.6 })); },
  beats() { return [this.throwAt]; },
  draw(g, t, a, api, R, x) {
    // he leans back before the throw, swings through it and settles; the
    // charges still go where they were aimed
    const ts = this.targets(R, x), u0 = a - this.throwAt;
    x += u0 >= -0.2 && u0 < 0 ? -ease((u0 + 0.2) / 0.2) : u0 >= 0 && u0 < 0.08 ? lerp(-1, 0.5, u0 / 0.08) : u0 >= 0.08 && u0 < 0.38 ? 0.5 * (1 - ease((u0 - 0.08) / 0.3)) : 0;
    const y = api.restY;
    // a charge is gone from its hand from the throw until a beat after the blow
    const away = i => a >= this.throwAt + i * 0.15 && a < (R4(R) ? this.blowAt : this.throwAt + this.fly) + 0.5;
    body(x, y);
    api.at(x, y);
    bundle(g, x, y, R, t, R8(R) ? { l: away(0), r: away(1) } : { r: away(0) });
    const floor = deepFloor() / P;
    api.shot(() => ts.forEach((tx, i) => {
      const t0 = this.throwAt + i * 0.15, d = a - t0, land = t0 + this.fly;
      const hitY = cBot(tx) + 1;
      // at rung 8 the first charge leaves the left hand, the second the right
      const fromX = R8(R) && i === 0 ? x - 3 : x + 5;
      if (d >= 0 && d < this.fly) {
        const k = d / this.fly;
        charge(g, lerp(fromX, tx, k), lerp(y + 1, hitY, k) - 3 * Math.sin(Math.PI * k), t, R, true);
        return;
      }
      if (d < 0) return;
      const boomAt = R4(R) ? this.blowAt : land;
      // Sticky: stuck under the belly, its light ticking faster as it runs down;
      // squashed flat for the pose it sticks, then its own shape
      if (R4(R) && a < boomAt) {
        if (a < land + POSE) rect(g, tx - 1.5, hitY, 4, 1, GREYS[9]);
        else charge(g, tx, hitY, t, R, false);
        const rate = 3 + 8 * along(a, land, boomAt);
        cell(g, tx, hitY + 2, Math.floor(t * rate) % 2 ? WHITE : GREYS[6]);
      }
      // rung 8's two go off in the abyss's purple: the ring, a white core at
      // the heart for a pose, and a spray of purple debris
      const e = a - boomAt, big = R4(R), pu = R8(R);
      if (e >= 0 && e < 0.45) ring(g, tx, hitY - 1, 1 + e * (big ? 22 : 12), pu ? (e < 0.15 ? PURPLES[11] : e < 0.3 ? PURPLES[9] : PURPLES[7]) : e < 0.15 ? WHITE : e < 0.3 ? GREYS[9] : GREYS[6]);
      if (pu && e >= 0 && e < POSE) { cell(g, tx, hitY - 1, WHITE); cell(g, tx - 1, hitY - 1, PURPLES[11]); cell(g, tx + 1, hitY - 1, PURPLES[11]); cell(g, tx, hitY - 2, PURPLES[11]); }
      if (pu && e >= 0 && e < 1.2) for (let j = 0; j < 10; j++) {
        const ang = -Math.PI * (0.05 + 0.9 * hash(j * 13 + i)), sp = 14 * (0.5 + hash(j + 7 * i));
        const dx = tx + Math.cos(ang) * sp * e, dy = hitY - 1 + Math.sin(ang) * sp * e + 9 * e * e;
        if (dy < floor) cell(g, dx, dy, PURPLES[[11, 10, 9, 7, 5][Math.min(4, Math.floor(e / 0.24))]]);
      }
    }));
  },
};

// --- the Hexer ---------------------------------------------------------------------
// Before each hex the glyph is written cell by cell along its stroke, flares
// a held pose when the last stroke closes, the hex streams up out of it, and
// it fades out down the purples. At rung 8 a ring is traced round it, she
// floats a cell up, and the hex is bigger.
const hexer = {
  len: 3.4,
  land(R) { return R4(R) ? glyphTimes(R).land : 1.3; },
  hits(R, x) { const L = this.land(R), h = [{ at: L, x: x + 1, k: R8(R) ? 0.45 : 0.15 }]; if (R8(R)) h.push({ at: L + 0.6, x: x + 7, k: 0.6 }); return h; },
  beats(R) { const T = glyphTimes(R); return R4(R) ? [T.t0, T.done] : [0.3]; },
  draw(g, t, a, api, R, x) {
    // she rises as she gathers the hex and settles as it goes
    const T = glyphTimes(R), start = R4(R) ? T.out : 0.3;
    const y = api.restY - liftOf('hexer', R) - dip(a, start, 1, 0.25, 0.35), tx = x + 1, hitY = cBot(tx), big = R8(R);
    body(x, y);
    api.at(x, y);
    // the hex streams out of the glyph's middle (her head, at rung 0) as motes
    const [gx, gy] = glyphAt(x, y, t);
    if (R4(R)) glyph(g, gx, gy, R, a);
    const from = R4(R) ? gy + 2 : y - 2;
    if (a >= this.land(R) + 0.5) motes(g, tx, R4(R) ? gy : y, t);
    api.shot(() => {
      const n = big ? 9 : 5;
      for (let m = 0; m < n; m++) {
        const s0 = start + m * 0.5 / n;
        if (a < s0 || a >= s0 + 0.5) continue;
        const cx = tx + [-1, 1, 0, -2, 2, -1, 1, 0, 0][m], cy = lerp(from, hitY + 1, ((a - s0) / 0.5) ** 1.5);
        cell(g, cx, cy, PURPLES[11]); cell(g, cx, cy + 1, PURPLES[7]);
      }
      const e = a - this.land(R);
      if (e >= 0 && e < 0.8) ring(g, tx, hitY, 1 + e * (big ? 14 : 8), MOTE_TONES[Math.floor(e / 0.2)], 2);
    });
  },
};

// --- the Mage ------------------------------------------------------------------------
// The staff up, the stone gathering in a held pose, a held flare, then a
// steady beam from the stone into the coil. From rung 4 it widens from one
// cell to three the longer she holds it; at rung 8 it burns through at full
// width, its core white. It ends on a finishing blow: a surge a cell wider
// held a pose, then a pulse shooting down the beam that lands as a single
// real hit and pushes her back; the stone is spent a beat, then relights.
function beam(g, ax, ay, bx, by, w, t, fade = 0, white = true, surge = false, from = 0) {
  const len = Math.hypot(bx - ax, by - ay) || 1, ux = (bx - ax) / len, uy = (by - ay) / len;
  const offs = w >= 4 ? [-1, 0, 1, 2] : w >= 3 ? [-1, 0, 1] : w === 2 ? [0, 1] : [0], f = Math.floor(t * 14);
  const SH = [PURPLES[9], PURPLES[10], PURPLES[11]];
  const down = k => [PURPLES[11], PURPLES[9], PURPLES[7], PURPLES[5]][Math.min(3, k + Math.floor(fade * 3.99))];
  for (let i = Math.ceil(from * len); i <= Math.ceil(len); i++) for (const o of offs) {
    // widened across the grid, not across the slant, so the band has no holes
    const side = Math.abs(uy) > Math.abs(ux), cx = Math.round(ax + ux * i) + (side ? o : 0), cy = Math.round(ay + uy * i) + (side ? 0 : o), sh = (i + f + (o + 3)) % 3;
    const core = w >= 3 && o === 0;
    const lit = w < 3 ? SH[sh] : white ? (core ? (sh === 0 ? PURPLES[11] : WHITE) : SH[sh])
              : core ? (sh === 0 ? PURPLES[10] : PURPLES[11]) : (sh === 0 ? PURPLES[9] : PURPLES[8]);
    const hot = core ? (white ? WHITE : PURPLES[11]) : sh === 0 ? PURPLES[10] : PURPLES[11];
    cell(g, cx, cy, fade > 0 ? down(core ? 0 : 1) : surge ? hot : lit);
  }
}
// The finishing pulse: a bright bead `n` cells long at `p` 0..1 of the way
// from (ax, ay) to (bx, by), `w` cells across, white at its head.
function bead(g, ax, ay, bx, by, p, w, n, white) {
  const len = Math.hypot(bx - ax, by - ay) || 1, ux = (bx - ax) / len, uy = (by - ay) / len, side = Math.abs(uy) > Math.abs(ux);
  const offs = w >= 3 ? [-1, 0, 1] : w === 2 ? [0, 1] : [0], head = p * len;
  for (let j = 0; j < n; j++) {
    const i = head - j;
    if (i < 0) break;
    for (const o of offs) {
      const cx = Math.round(ax + ux * i) + (side ? o : 0), cy = Math.round(ay + uy * i) + (side ? 0 : o);
      cell(g, cx, cy, j === 0 && (white || o === 0) ? WHITE : j < 2 ? PURPLES[11] : PURPLES[10]);
    }
  }
}
const mage = {
  len: 3.9,
  BEAM: { lift: 0.2, gather: 0.3, flare: 0.55, start: 0.6, surge: 0.2, pulse: 0.16, spent: 0.5 },
  hold(R) { return R4(R) ? 2.0 : 1.5; },
  end(R) { return this.BEAM.start + this.hold(R); },
  // the finishing blow lands as the pulse reaches the hide
  fin(R) { return this.end(R) + this.BEAM.pulse; },
  blowK(R) { return R8(R) ? 1.3 : R4(R) ? 0.85 : 0.5; },
  // how far into its ramp the beam is, 0..1 (full width at 1)
  ramp(R, a) { return clamp((a - this.BEAM.start) / (0.7 * this.hold(R)), 0, 1); },
  // the ticks where the beam bites the hide, each a small spark and give
  ticks(R) { const B = this.BEAM, out = []; for (let u = B.start + 0.075; u < this.end(R) - B.surge; u += 0.15) out.push(u); return out; },
  hits(R, x) {
    return [...this.ticks(R).map(u => ({ at: u, x: x - 5, noPause: true,
      k: R4(R) ? 0.15 + (R8(R) ? 0.45 : 0.3) * this.ramp(R, u) : 0.15 })),
      // the finishing blow: a real hit, its pause the biggest at rung 8
      { at: this.fin(R), x: x - 5, k: this.blowK(R), pause: R8(R) ? 0.24 : R4(R) ? 0.16 : 0.1 }];
  },
  // the gather, the flare and the surge are held poses; the beam itself runs
  // smooth, and the pulse steps down it a pose at a time
  beats(R) { return [this.BEAM.gather, this.BEAM.flare, this.end(R) - this.BEAM.surge]; },
  poseStep(R, a) { return a >= this.BEAM.start && a < this.end(R) - this.BEAM.surge - 1e-9 ? 0.001 : POSE; },
  draw(g, t, a, api, R, x) {
    const B = this.BEAM, H = this.hold(R), end = this.end(R), fin = this.fin(R), sx = x - 1;
    const surge = a >= end - B.surge && a < end, u = a - fin;
    // she rises into the gather, and the beam's start pushes her down a little
    let y = api.restY - dip(a, B.gather + 0.2, 0.5, 0.25, 0.3), staffUp = 0;
    const v = a - B.start;
    if (v >= 0 && v < 0.25) y += 0.6 * (1 - v / 0.25);
    // the release pushes her down a cell (and back one at rung 8) and kicks
    // the staff up, then she settles
    let bx = x;
    if (u >= 0) {
      const back = u < 0.1 ? 1 : 1 - ease(clamp((u - 0.1) / 0.3, 0, 1));
      y += back; if (R8(R)) bx += Math.round(back); staffUp = u < 0.15 ? 1 : u < 0.3 ? 0.5 : 0;
    }
    const spent = u >= 0 && u < B.spent, up = a >= B.lift && a < fin + 0.3;
    const glow = up && !spent ? clamp((a - B.gather) / 0.25, 0, 1) : 0;
    body(bx, Math.round(y));
    api.at(bx, Math.round(y));
    mStaff(g, bx, Math.round(y - staffUp * 2), R, t, up, glow, true, spent);
    const oy = Math.round(y - staffUp * 2) - 4, tx = x - 5, hy = cBot(tx);
    // relit: a single flash back into the stone as the beat ends
    if (u >= B.spent && u < B.spent + 0.08) for (const [dx, dy] of [[0, -1], [-1, 0], [1, 0]]) cell(g, bx - 1 + dx, oy + (up ? 0 : 1) + dy, PURPLES[10]);
    // the gather: a ring of the abyss closing on the stone
    if (a >= B.gather && a < B.flare) ring(g, sx, oy + 0.5, 3.2 - 2.2 * (a - B.gather) / (B.flare - B.gather), a < B.gather + 0.15 ? PURPLES[8] : PURPLES[10]);
    // the flare as the beam starts, held a pose
    if (a >= B.flare && a < B.start + 0.06) for (const [dx, dy] of [[0, -1], [-1, 0], [1, 0], [0, 1], [-1, -1], [1, -1]]) cell(g, sx + dx, oy + dy, Math.abs(dx) + Math.abs(dy) > 1 ? PURPLES[11] : WHITE);
    if (surge) for (const [dx, dy] of [[0, -1], [-1, 0], [1, 0]]) cell(g, sx + dx, oy + dy, WHITE);
    api.shot(() => {
      // the beam, held; in the surge a cell wider and a step brighter
      const r = this.ramp(R, a), w0 = R4(R) ? (r < 0.33 ? 1 : r < 0.8 ? 2 : 3) : 1, w = w0 + (surge ? 1 : 0);
      if (a >= B.start && a < end) beam(g, sx, oy - 0.5, tx, hy, w, t, 0, R8(R), surge);
      // the pulse: the beam cut behind a bright bead shooting from stone to
      // hide; what is left ahead of it dims, and at rung 8 its white core
      // flares once more instead
      if (a >= end && a < fin) {
        const p = Math.min(1, (Math.floor((a - end) / POSE + 1e-9) + 1) / Math.ceil(B.pulse / POSE));
        beam(g, sx, oy - 0.5, tx, hy, w0, t, R8(R) ? 0 : 0.3, R8(R), R8(R), p);
        bead(g, sx, oy - 0.5, tx, hy, p, R8(R) ? 3 : 2, R8(R) ? 5 : R4(R) ? 4 : 3, R8(R));
      }
      // where the pulse lands, held a pose: a bar of cells across the hide
      if (u >= 0 && u < POSE) {
        const half = 1 + (R4(R) ? 1 : 0) + (R8(R) ? 1 : 0);
        for (let dx = -half; dx <= half; dx++) cell(g, tx + dx, cBot(tx + dx), R8(R) ? (dx ? PURPLES[11] : WHITE) : WHITE);
      }
      if (R8(R)) {
        const full = a >= B.start + 0.7 * H;
        // burning through: the hide bitten deeper while it holds, purple
        // sparks spraying off it; the blow tears the bite wider, then it closes
        const bite = full && a < end + B.pulse ? 0.9 + 1.4 * clamp((a - B.start - 0.7 * H) / (0.3 * H), 0, 1)
          : u >= 0 && u < 0.7 ? 3.4 - 1.6 * ease(u / 0.7) : 0;
        if (bite) for (let xx = Math.floor(tx - bite); xx <= tx + bite; xx++) for (let yy = Math.floor(hy - bite); yy <= hy; yy++)
          if ((xx - tx) ** 2 + (yy - hy) ** 2 <= bite * bite) cell(g, xx, yy, GREYS[1]);
        if (full && a < end) for (let j = 0; j < 7; j++) {
          const age = (t * 2.2 + hash(j * 5)) % 1, ang = Math.PI * (0.15 + 0.7 * hash(j * 11 + 3));
          cell(g, tx + Math.cos(ang) * age * 6, hy + 1 + Math.sin(ang) * age * 4 + age * age * 3, [PURPLES[11], PURPLES[10], PURPLES[8], PURPLES[6]][Math.floor(age * 3.99)]);
        }
        // the afterglow: a short purple line lingering along the hide where it burned
        if (u >= 0 && u < 0.6) for (let dx = -3; dx <= 3; dx++) {
          if (u > 0.3 && Math.abs(dx) % 2) continue;
          cell(g, tx + dx, cBot(tx + dx), [PURPLES[11], PURPLES[9], PURPLES[7]][Math.min(2, Math.floor(u / 0.2 + Math.abs(dx) / 4))]);
        }
      }
    });
  },
};

// --- the Bard ------------------------------------------------------------------------
// No blow of her own: notes rise off the flute and drift to the fighters,
// one to each.
const bard = {
  len: 3.0, loop: 6.6,
  hits() { return []; },
  beats() { return [0.1]; },
  draw(g, t, a, api, R, x) {
    // she draws a breath before the song: a rise and a settle
    const y = api.restY - dip(a, 0.1, 0.5, 0.25, 0.4);
    body(x, y);
    api.at(x, y);
    flute(g, x, y, R);
    if (a > 2.6) return;
    const tip = [x + 6, y - 1];
    api.shot(() => api.others.forEach((o, n) => {
      const s0 = 0.1 + (n % 5) * 0.12, k = along(a, s0, s0 + 1.2);
      if (a < s0 || a >= s0 + 1.2) return;
      const nx = lerp(tip[0], o.x + 1, k), ny = lerp(tip[1], o.y - 3, k) - 8 * Math.sin(Math.PI * k);
      cell(g, nx, ny, PURPLES[11]); cell(g, nx + 1, ny - 1, PURPLES[9]);
    }));
  },
};

export const ATTACKS = { brawler, sword: swordsman, monk, martial, ranger, assassin, sapper, hexer, mage, bard };
// How long a class's turn loops for, rest included, on the page.
export const loopOf = c => c.loop || Math.max(c.len + 1.6, 4.6);
export { REST, liftOf };

// The contacts of a class's turn on its raw clock, the hit-pauses before
// each summed in: when its blows land, for the sim to strike on (FIGHT).
export function contactTimes(key, R) {
  const c = ATTACKS[key];
  if (!c) return [];
  return groupsOf(c, R, 0).map(gr => ({ at: gr.real, k: gr.k, pause: gr.pause, n: gr.list.length }));
}
