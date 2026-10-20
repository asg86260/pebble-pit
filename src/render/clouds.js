// Clouds: the one way a cloud is drawn, for any place that has sky.
//
// A cloud is puffs -- circles -- in tiers, back to front (CLOUDS_RECIPE). Each
// tier is a smooth union of its puffs: every puff adds a bump to a field and
// the cloud is where the field passes a threshold, so two lobes near each
// other meet in a rounded neck instead of a crease. The union is banded into
// flat tones by offset copies of itself, never by slope: a lobe's cells whose
// cell a set depth below is open sky, or something farther back, are its
// belly in shadow -- a round crescent under every lobe that hangs free, inside
// the cloud as well as under it. On the ground a row's cells whose cell below
// is the next row's dome are the crevice between them, in shadow too. With
// the rim on, the cells whose cell above is not the lobe catch the light.
// Nothing is a slope, a stripe or a line drawn round anything.
//
// The art is on the cell grid and the motion is not. A cloud is baked into a
// sheet, a pixel a cell, and the sheet is drawn scaled up with no smoothing,
// at its true position rounded once for the whole sheet -- so it slides a
// pixel at a time as one piece and nothing in it shears or shimmers. The
// slow roll of the lobes changes the field, so the sheet is baked again
// every `step` seconds, a slice of rows a frame, and each frame shows the
// step behind blended into the step ahead.
//
// Place-agnostic: a caller makes sheets of a kind (CLOUDS_KINDS), ticks them,
// and draws them where its own camera puts them. Nothing here reads S.

import { CLOUDS_TONES, CLOUDS_THRESHOLD, CLOUDS_HYST, CLOUDS_BUDGET_MS, CLOUDS_SLICE,
         CLOUDS_RECIPE, CLOUDS_BILLOW, CLOUDS_KINDS, CLOUDS_ONE_TONE_ROWS, CLOUDS_BAND_MIN, CLOUDS_CREASE_MIN,
         CLOUDS_TREATMENTS, CLOUDS_SKY, CLOUDS_LIFE, CLOUDS_SHAPES, CLOUDS_FLOW,
         CLOUDS_GROUND_FLOW, CLOUDS_PALETTE, CLOUDS_DEPTH_BANDS, CLOUDS_GROUND_DEPTHS, CLOUDS_RIM, CLOUDS_BUBBLES } from '../config.js';

// A cloud's shape is its own seed's, not a draw from the yard's `rand()`: a
// drawing must never move the game's stream, or a seeded run would play out
// differently with the sky on screen. mulberry32, as rng.js.
function gen(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const lerp = (r, [a, b]) => a + (b - a) * r;
// A band (a belly, a rim) a share of a tier's lobe radius deep,
// and none on a tier whose lobes are under CLOUDS_BAND_MIN times that: on a
// small lobe the band would be the whole lobe and read as a line, so a small
// or far cloud is drawn plainer, which is depth by scale.
const depth = (share, r) => {
  const d = share ? Math.max(2, Math.round(share * r)) : 0;
  return d && r >= CLOUDS_BAND_MIN * d ? d : 0;
};
const TAU = Math.PI * 2;
const puff = (rnd, x, y, r) => ({ x, y, r, ph: rnd() * TAU, ph2: rnd() * TAU, pace: 0.8 + rnd() * 0.4 });

// --- shapes ---------------------------------------------------------------------
// One cumulus of size R standing on the line `base`, its middle at `cx`, its
// puffs pushed onto `tiers[...]` by recipe tier name.
function cumulus(rnd, cx, base, R, names, tiers) {
  const C = CLOUDS_RECIPE;
  // the shoulders, when the kind has them, are a tier of their own in front
  // of the tallest dome; without, they are part of the crown
  const shoulders = names.indexOf('shoulders');
  for (let j = 0; j < names.length; j++) {
    const name = names[j], T = C[name], into = tiers[j];
    if (name === 'shoulders') continue;
    if (name === 'crown') {
      // the tallest dome off the middle, then smaller domes stepping down
      // and out from it, to one side and the other in turn
      const lean = (rnd() * 2 - 1) * T.lean * R, mid = cx + lean;
      into.push(puff(rnd, mid, base - R * lerp(rnd(), T.at), R));
      const sideTier = shoulders >= 0 ? tiers[shoulders] : into;
      const reach = [0, 0];
      const n = T.domes[0] + Math.floor(rnd() * (T.domes[1] - T.domes[0] + 1));
      for (let k = 0; k < n; k++) {
        const side = (k + (rnd() < 0.5 ? 0 : 1)) % 2, r = R * lerp(rnd(), T.r) * Math.pow(T.fall, reach[side]);
        const x = mid + (side ? 1 : -1) * (R * 0.55 + reach[side] * R * 0.5 + r * lerp(rnd(), T.step));
        sideTier.push(puff(rnd, x, base - r * lerp(rnd(), T.at) * Math.pow(0.85, reach[side]), r));
        reach[side]++;
      }
      continue;
    }
    // a row of lobes across the cloud, smaller toward its ends
    let x = cx - T.span * R;
    while (x <= cx + T.span * R) {
      const edge = Math.abs(x - cx) / (T.span * R);
      const r = R * lerp(rnd(), T.r) * (1 - 0.3 * edge * edge);
      into.push(puff(rnd, x, base - r * lerp(rnd(), T.at), r));
      x += r * lerp(rnd(), T.step);
    }
  }
}

// The ground: rows of billows, back (0) to front, each row a tier, bigger
// and lower than the one behind (perspective), filled solid beneath its line
// so no sky shows between rows.
function billows(rnd, w, top, R, K, tiers, fills) {
  const B = CLOUDS_BILLOW;
  let line = top;
  for (let row = 0; row < K.rows; row++) {
    const r0 = R * Math.pow(K.rowGrow, row - (K.rows - 1));
    if (row) line += K.rowDrop * r0;
    for (let x = rnd() * r0 * 2; x < w + r0;) {
      // now and then a big dome among the middling ones
      const big = rnd() < B.big[0], r = r0 * lerp(rnd(), B.r) * (big ? B.big[1] : 1);
      tiers[row].push(puff(rnd, x + r * 0.5, line - r * lerp(rnd(), B.at), r));
      x += r * lerp(rnd(), B.step);
    }
    fills[row] = line + r0 * B.fill;
  }
}

// --- a sheet -------------------------------------------------------------------
// The cells of one cloud (a 'puff'), of a bank of them across a wrapping strip
// ('far', 'mid'), or of the ground. `w` and `h` in cells; a band wraps at `w`.
// `single` draws one cloud of a band's kind on its own.
export function cloudSheet({ kind, seed = 1, w, h, R, scale = 1, single = false }) {
  const K = CLOUDS_KINDS[kind], rnd = gen(seed * 7919 + 13);
  const ground = kind === 'ground', band = !single && (kind === 'far' || kind === 'mid');
  const nt = ground ? K.rows : K.tiers.length;
  const tiers = Array.from({ length: nt }, () => []), fills = [];
  const size = () => (R || lerp(rnd(), K.R)) * scale;
  if (ground) {
    const s = size();
    let depth = 0;
    for (let row = 1; row < K.rows; row++) depth += K.rowDrop * s * Math.pow(K.rowGrow, row - (K.rows - 1));
    const top = s * Math.pow(K.rowGrow, 1 - K.rows) * 2.2;
    h = h || Math.ceil(top + depth + s * 0.9);
    billows(rnd, w, top, s, K, tiers, fills);
  } else if (band) {
    // clouds of different sizes along the strip, sometimes with sky between
    // the crown stands up to 2.2 R over the base line and the base's lobes
    // hang up to 0.9 R under it
    const top = K.R[1] * scale * 2.3;
    h = h || Math.ceil(top + K.R[1] * scale * 1.0);
    let x = rnd() * 8;
    for (;;) {
      const s = size(), half = s * 2.2;
      if (x + half * 2 > w) break;
      cumulus(rnd, x + half, top, s, K.tiers, tiers);
      x += half * 2 + s * lerp(rnd(), K.gap) - s * 0.8;
    }
  } else {
    const s = size();
    w = w || Math.ceil(s * 6 + 4);
    h = h || Math.ceil(s * 3.2 + 3);
    cumulus(rnd, w / 2, Math.ceil(s * 2.25 + 1), s, K.tiers, tiers);
  }
  // each tier's tone with two tones a cloud and with one; the depth of its
  // sunlit cap (the ground's: the tops of its billows catch the light and the
  // mass under them is in shadow) and of the optional paper rim
  const lobe = tiers.map(ps => ps.reduce((a, p) => a + p.r, 0) / Math.max(1, ps.length));
  const n = w * h;
  const sh = {
    kind, K, w, h, n, nt, tiers, fills, wrap: band || ground, ground,
    // a cumulus's tiers are one cloud and never crease against each other;
    // the ground's rows are separate clouds, one behind the other
    rowOf: tiers.map((_, j) => (ground ? j : 0)),
    tone1: tiers.map((_, j) => (ground ? CLOUDS_ONE_TONE_ROWS[j] : K.one)),
    // each tier's belly, crevice and rim depths, a share of its lobes' size
    // one belly depth for a whole cumulus, off its base's lobes, so its
    // underside is one even scalloped band wherever any tier reaches it
    shadeOf: lobe.map(r => depth(K.shade, ground ? r : lobe[nt - 1])),
    creaseOf: lobe.map(r => (K.crease && r >= CLOUDS_CREASE_MIN ? Math.max(2, Math.round(K.crease * r)) : 0)),
    // a rim under three cells deep stairs into one-cell slivers on a slope
    litOf: lobe.map(r => { const d = depth(K.lit, r); return d && Math.max(3, d); }),
    sums: Array.from({ length: nt }, () => new Float32Array(n)),
    T: new Int8Array(n).fill(-1),
    roles: [new Uint8Array(n), new Uint8Array(n)],    // the step behind, the step ahead
    next: new Uint8Array(n),                          // the step after, being worked out
    diff: new Int32Array(n), nd: 0,
    phase: rnd() * K.step,                            // so sheets do not all turn on one frame
    k0: null, unit: 0, nextT: 0, full: true,
    page: 'light', treat: 'C', lut: null,
    canvas: null, ctx: null, img: null,
    // for the checks: cells re-toned last step, and those that went straight
    // back to what they were the step before; what each cell was and when
    flips: 0, backs: 0, last: new Uint8Array(n), lastK: new Int32Array(n)
  };
  sh.lut = lutOf(sh);
  return sh;
}

// A lobe at time t: swelling and settling, swaying, and on the ground rolling
// along the row.
function lobeAt(p, t, K, w) {
  const [amp, period] = K.breathe, a = TAU * t / period * p.pace;
  let x = p.x + K.sway * Math.sin(a * 0.77 + p.ph2) + (K.drift || 0) * t;
  if (w) x = ((x % w) + w) % w;
  return { x, y: p.y + 0.35 * K.sway * Math.sin(a + p.ph), r: p.r * (1 + amp * Math.sin(a + p.ph)) };
}

// --- the bake --------------------------------------------------------------------
// One tier's field over rows [y0, y1): every lobe adds (1 - d^2/R^2)^3 to the
// cells within its reach R (CLOUDS_THRESHOLD says why R is what it is).
const REACH = 1 / Math.sqrt(1 - Math.cbrt(CLOUDS_THRESHOLD));
function fieldRows(sh, t, j, y0, y1) {
  const { w, K } = sh, S = sh.sums[j], fill = sh.ground ? sh.fills[j] : null;
  for (let i = y0 * w; i < y1 * w; i++) S[i] = 0;
  if (fill !== null) {
    // the row's solid underneath: a ramp a few cells deep, so its join with
    // the billows above is as round as theirs with each other
    for (let y = y0; y < y1; y++) {
      const v = Math.max(0, Math.min(1, (y + 0.5 - fill) / 3 + 0.5)) * CLOUDS_THRESHOLD * 2;
      if (v) S.fill(v, y * w, y * w + w);
    }
  }
  for (const p0 of sh.tiers[j]) {
    const p = lobeAt(p0, t, K, sh.wrap ? w : 0), R = p.r * REACH, R2 = R * R;
    const ya = Math.max(y0, Math.floor(p.y - R)), yb = Math.min(y1, Math.ceil(p.y + R));
    for (let y = ya; y < yb; y++) {
      const dy = y + 0.5 - p.y, left = R2 - dy * dy;
      if (left <= 0) continue;
      const span = Math.sqrt(left), xa = Math.ceil(p.x - span - 0.5), xb = Math.floor(p.x + span - 0.5);
      for (let xx = xa; xx <= xb; xx++) {
        let x = xx;
        if (x < 0 || x >= w) { if (!sh.wrap) continue; x = ((x % w) + w) % w; }
        const dx = xx + 0.5 - p.x, q = 1 - (dx * dx + dy * dy) / R2;
        if (q > 0) S[y * w + x] += q * q * q;
      }
    }
  }
}
// The front-most tier at each cell, kept from the last step unless the field
// has moved CLOUDS_HYST past it: `lo` is the tier the field puts there for
// certain, `hi` the one it could, and the old answer stands between them.
function tierRows(sh, y0, y1) {
  const { w, nt, sums, T } = sh, up = CLOUDS_THRESHOLD * (1 + CLOUDS_HYST), dn = CLOUDS_THRESHOLD * (1 - CLOUDS_HYST);
  for (let i = y0 * w; i < y1 * w; i++) {
    let lo = -1, hi = -1;
    for (let j = nt - 1; j >= 0; j--) {
      const s = sums[j][i];
      if (hi < 0 && s > dn) hi = j;
      if (s > up) { lo = j; break; }
    }
    if (hi < lo) hi = lo;
    const was = T[i];
    T[i] = was < lo ? lo : was > hi ? hi : was;
  }
}
// The roles: tier * 4 + 1 in the light, + 2 in shadow, + 3 the rim.
//   belly    the cell `shade` below is open sky or a tier farther back
//   crevice  the cell `crease` below is a nearer row's dome (the ground)
//   rim      the cell `lit` above, or up and to the left toward the light,
//            is not this tier, where the treatment and the page draw one
// The treatment (CLOUDS_TREATMENTS) says which of these a cloud is drawn with.
function roleRows(sh, out, y0, y1) {
  const { w, h, T, rowOf } = sh, bottom = sh.ground ? sh.nt - 1 : -1;
  const at = (x, y) => (y >= h ? bottom : y < 0 ? -1 : T[y * w + x]);
  const atx = (x, y) => (x < 0 || x >= w ? (sh.wrap ? at((x + w) % w, y) : -1) : at(x, y));
  const D = CLOUDS_TREATMENTS[sh.treat], rimOn = D.rim && CLOUDS_TONES[sh.page].rim;
  const inside = D.belly === 'inside', bellies = D.belly !== 'none';
  for (let y = y0; y < y1; y++) for (let x = 0; x < w; x++) {
    const j = T[y * w + x];
    let r = 0;
    if (j >= 0) {
      const s = bellies ? sh.shadeOf[j] : 0, c = bellies ? sh.creaseOf[j] : 0, l = rimOn ? sh.litOf[j] : 0;
      r = j * 4 + 1;
      if (l && (at(x, y - l) !== j || atx(x - Math.round(l * 0.7), y - Math.round(l * 0.7)) !== j)) r = j * 4 + 3;
      if (s) { const b = at(x, y + s); if (b < 0 || (inside && b < j)) r = j * 4 + 2; }
      if (c) { const b = at(x, y + c); if (b > j && rowOf[b] !== rowOf[j]) r = j * 4 + 2; }
    }
    out[y * w + x] = r;
  }
}
// A spur is a cell of a tone no neighbor shares; a one-cell bump on a flat
// edge, its one neighbor of its tone having that tone on both sides across
// the bump; or a sliver, a cell between two of one other tone across it
// (a line a cell wide, which reads as a scratch, not a shape). A crescent's tapering tip is neither -- its last cell leans on the
// row above or below -- and is left alone, or the cleanup would eat every
// crescent from its tips in. Tones, not roles: two tiers in one tone are one
// shape on screen.
function spurAt(tone, at, x, y) {
  const me = tone[at(x, y)];
  const l = tone[at(x - 1, y)] === me, r = tone[at(x + 1, y)] === me, u = tone[at(x, y - 1)] === me, d = tone[at(x, y + 1)] === me;
  const n = l + r + u + d;
  if (n === 0) return true;
  if ((!l && !r && tone[at(x - 1, y)] === tone[at(x + 1, y)]) || (!u && !d && tone[at(x, y - 1)] === tone[at(x, y + 1)])) return true;
  if (n > 1) return false;
  const [nx, ny] = l ? [x - 1, y] : r ? [x + 1, y] : u ? [x, y - 1] : [x, y + 1];
  return nx !== x ? tone[at(nx, y - 1)] === me && tone[at(nx, y + 1)] === me
                  : tone[at(x - 1, ny)] === me && tone[at(x + 1, ny)] === me;
}
// A spur takes the role of its neighbors' commonest tone.
function cleanRows(sh, R, y0, y1, up = false) {
  const { w, h } = sh, bottom = sh.ground ? (sh.nt - 1) * 4 + 1 : 0, tone = sh.toneOf;
  const at = (x, y) => (y < 0 ? 0 : y >= h ? bottom
    : x < 0 || x >= w ? (sh.wrap ? R[y * w + ((x + w) % w)] : 0) : R[y * w + x]);
  for (let k = y0; k < y1; k++) for (let x = 0; x < w; x++) {
    const y = up ? y1 - 1 - (k - y0) : k;
    if (!spurAt(tone, at, x, y)) continue;
    // the neighbors' tones, commonest first; the first that leaves the cell
    // no spur in its new tone wins (at a corner of three tones the commonest
    // can be a one-cell bump itself)
    const i = y * w + x, was = R[i], me = tone[was];
    const n = [at(x - 1, y), at(x + 1, y), at(x, y - 1), at(x, y + 1)], t = n.map(v => tone[v]);
    const order = [0, 1, 2, 3].filter(k => t[k] !== me)
      .sort((a, b) => (t.filter(v => v === t[b]).length - t.filter(v => v === t[a]).length) || a - b);
    let pick = order.length ? n[order[0]] : was;
    for (const k of order) { R[i] = n[k]; if (!spurAt(tone, at, x, y)) { pick = n[k]; break; } }
    R[i] = pick;
  }
}
// A bake is passes over the rows: a field per tier, the front-most tier, the
// roles and three cleanups. A pass reads rows ahead of the one it is on, so it
// starts only once the pass before has finished; the work can stop after any
// row of any pass and go on next frame. A field row costs about ten of any
// other pass's, which is what `weight` says.
const passes = sh => sh.nt + 5;
const total = sh => passes(sh) * sh.h;
const weight = (sh, u) => { const f = sh.nt * sh.h; return u < f ? u : f + (u - f) * 0.1; };
function bakeUnits(sh, t, out, u0, u1) {
  for (let u = u0; u < u1;) {
    const pass = Math.floor(u / sh.h), y0 = u % sh.h, y1 = Math.min(sh.h, y0 + (u1 - u));
    if (pass < sh.nt) fieldRows(sh, t, pass, y0, y1);
    else if (pass === sh.nt) tierRows(sh, y0, y1);
    else if (pass === sh.nt + 1) roleRows(sh, out, y0, y1);
    // every other cleanup runs bottom to top, so a fix that leaves a new spur
    // above it is met by the next pass
    else if ((pass - sh.nt) % 2) cleanRows(sh, out, y0, y1);
    else cleanRows(sh, out, sh.h - y1, sh.h - y0, true);
    u += y1 - y0;
  }
}
export function bakeNow(sh, t, out = sh.next) { bakeUnits(sh, t, out, 0, total(sh)); return out; }

// --- tones ------------------------------------------------------------------------
// The colors of a sheet's roles, and each role's tone as a number (the
// ladder step, the rim 9, the sky 0) for the cleanup to compare.
function lutOf(sh) {
  const L = CLOUDS_TONES[sh.page], lut = new Array(4 * sh.nt + 4).fill(null);
  const tone = sh.toneOf = new Int8Array(4 * sh.nt + 4);
  for (let j = 0; j < sh.nt; j++) {
    const one = sh.tone1[j], [body, shade] = sh.K.tones[sh.page];
    const two = CLOUDS_TREATMENTS[sh.treat].tones === 2;
    lut[j * 4 + 1] = hexRgb(L.steps[tone[j * 4 + 1] = two ? body : one]);
    lut[j * 4 + 2] = hexRgb(L.steps[tone[j * 4 + 2] = two ? shade : one]);
    lut[j * 4 + 3] = hexRgb(L.lit); tone[j * 4 + 3] = 9;
  }
  return lut;
}
function hexRgb(h) { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }

// The page and the treatment. Both change the bake (the rim is drawn by
// night only), so the sheet starts its clock again.
export function setLook(sh, { page = sh.page, treat = sh.treat } = {}) {
  const rebake = treat !== sh.treat || page !== sh.page;
  sh.page = page; sh.treat = treat;
  sh.lut = lutOf(sh); sh.full = true;
  if (rebake) sh.k0 = null;
}

// --- the clock --------------------------------------------------------------------
function start(sh, t) {
  const tl = t + sh.phase;
  sh.k0 = Math.floor(tl / sh.K.step);
  sh.T.fill(-1);
  bakeNow(sh, sh.k0 * sh.K.step - sh.phase, sh.roles[0]);
  bakeNow(sh, (sh.k0 + 1) * sh.K.step - sh.phase, sh.roles[1]);
  sh.last.fill(0); sh.lastK.fill(-9);
  diff(sh);
  sh.unit = 0; sh.nextT = (sh.k0 + 2) * sh.K.step - sh.phase;
  sh.full = true;
}
function diff(sh) {
  const [A, B] = sh.roles; let nd = 0, backs = 0, x0 = sh.w, x1 = -1, y0 = sh.h, y1 = -1;
  for (let i = 0; i < sh.n; i++) if (A[i] !== B[i]) {
    sh.diff[nd++] = i;
    const x = i % sh.w, y = (i - x) / sh.w;
    if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
    if (sh.lastK[i] === sh.k0 - 1 && sh.last[i] === B[i] + 1) backs++;
    sh.last[i] = A[i] + 1; sh.lastK[i] = sh.k0;
  }
  sh.nd = nd; sh.flips = nd; sh.backs = backs;
  sh.box = nd ? [x0, y0, x1 - x0 + 1, y1 - y0 + 1] : null;   // the only cells a fade frame writes
}
// Turn every sheet's clock to `t` (game seconds) and work their bakes, the
// slices of all of them inside one budget a frame (CLOUDS_BUDGET_MS), and
// paint the fade. Returns the milliseconds it took.
export function tickClouds(sheets, t) {
  const t0 = performance.now();
  for (const sh of sheets) {
    if (sh.k0 === null) start(sh, t);
    const tl = t + sh.phase, k = Math.floor(tl / sh.K.step);
    while (k > sh.k0) {                               // the step turned: ahead becomes behind
      if (sh.unit < total(sh)) { bakeUnits(sh, sh.nextT, sh.next, sh.unit, total(sh)); sh.unit = total(sh); }
      paint(sh, 1);                                   // every cell now shows what was ahead
      const old = sh.roles[0]; sh.roles[0] = sh.roles[1]; sh.roles[1] = sh.next; sh.next = old;
      sh.k0++; diff(sh);
      sh.unit = 0; sh.nextT = (sh.k0 + 2) * sh.K.step - sh.phase;
    }
    // what must be done by now to finish inside CLOUDS_SLICE of the step
    const into = Math.min(1, (tl / sh.K.step - sh.k0) / CLOUDS_SLICE), W = weight(sh, total(sh));
    let u = sh.unit;
    while (u < total(sh) && weight(sh, u) < W * into) u++;
    if (u > sh.unit) { bakeUnits(sh, sh.nextT, sh.next, sh.unit, u); sh.unit = u; }
  }
  // then work ahead, a row at a time, while the frame's budget lasts
  let busy = true;
  while (busy && performance.now() - t0 < CLOUDS_BUDGET_MS) {
    busy = false;
    for (const sh of sheets) if (sh.unit < total(sh)) {
      bakeUnits(sh, sh.nextT, sh.next, sh.unit, sh.unit + 1); sh.unit++; busy = true;
      if (performance.now() - t0 >= CLOUDS_BUDGET_MS) break;
    }
  }
  for (const sh of sheets) {
    const a = Math.min(1, Math.max(0, (t + sh.phase) / sh.K.step - sh.k0));
    paint(sh, a * a * (3 - 2 * a));                   // eased, so a cell glides into its change
  }
  return performance.now() - t0;
}

// --- the sheet's pixels -------------------------------------------------------------
// Only the cells that differ between the two steps are written each frame.
// With no canvas to paint (node), the roles are the whole of the sheet.
function paint(sh, a) {
  if (!sh.canvas) {
    if (typeof document === 'undefined') return;
    sh.canvas = document.createElement('canvas');
    sh.canvas.width = sh.w; sh.canvas.height = sh.h;
    sh.ctx = sh.canvas.getContext('2d');
    sh.img = sh.ctx.createImageData(sh.w, sh.h);
    sh.full = true;
  }
  const d = sh.img.data, [A, B] = sh.roles, lut = sh.lut;
  const put = i => {
    const c0 = lut[A[i]], c1 = lut[B[i]], o = i * 4;
    if (!c0 && !c1) { d[o + 3] = 0; return; }
    if (!c0) { d[o] = c1[0]; d[o + 1] = c1[1]; d[o + 2] = c1[2]; d[o + 3] = 255 * a; return; }
    if (!c1) { d[o] = c0[0]; d[o + 1] = c0[1]; d[o + 2] = c0[2]; d[o + 3] = 255 * (1 - a); return; }
    d[o] = c0[0] + (c1[0] - c0[0]) * a; d[o + 1] = c0[1] + (c1[1] - c0[1]) * a;
    d[o + 2] = c0[2] + (c1[2] - c0[2]) * a; d[o + 3] = 255;
  };
  if (sh.full) { for (let i = 0; i < sh.n; i++) put(i); sh.full = false; sh.ctx.putImageData(sh.img, 0, 0); return; }
  for (let k = 0; k < sh.nd; k++) put(sh.diff[k]);
  if (sh.box) sh.ctx.putImageData(sh.img, 0, 0, ...sh.box);
}

// --- placing a sheet --------------------------------------------------------------
// `x`, `y` are where the sheet's first cell goes, in the context's own units,
// and `cell` is a cell's size in them. `px` is one device pixel in the same
// units: the position is rounded to it once, for the whole sheet, so the
// cloud moves by its true position a pixel at a time and its cells stay
// whole squares. Returns the x it was drawn at.
export function drawCloud(ctx, sh, x, y, cell, px = 1, alpha = 1) {
  if (!sh.canvas) return x;
  const sx = Math.round(x / px) * px, sy = Math.round(y / px) * px;
  const was = ctx.imageSmoothingEnabled, ga = ctx.globalAlpha;
  ctx.imageSmoothingEnabled = false; ctx.globalAlpha = ga * alpha;
  ctx.drawImage(sh.canvas, 0, 0, sh.w, sh.h, sx, sy, sh.w * cell, sh.h * cell);
  ctx.imageSmoothingEnabled = was; ctx.globalAlpha = ga;
  return sx;
}
// A wrapping band scrolled by `off` (its true scroll, same units), whole
// copies side by side across `width`.
export function drawBand(ctx, sh, off, y, cell, width, px = 1) {
  if (!sh.canvas) return;
  const W = sh.w * cell, o = Math.round(off / px) * px;
  for (let x = -(((o % W) + W) % W); x < width; x += W) drawCloud(ctx, sh, x, y, cell, px);
}
// Whether local cell (cx, cy) of a sheet is cloud in either step it shows.
export function cloudAt(sh, cx, cy) {
  if (cx < 0 || cy < 0 || cx >= sh.w || cy >= sh.h) return false;
  const i = cy * sh.w + cx;
  return sh.roles[0][i] !== 0 || sh.roles[1][i] !== 0;
}
// The spurs a sheet shows (spurAt): what the cleanup leaves none of.
export function spursOf(sh, R = sh.roles[1]) {
  const { w, h } = sh, bottom = sh.ground ? (sh.nt - 1) * 4 + 1 : 0;
  const at = (x, y) => (y < 0 ? 0 : y >= h ? bottom
    : x < 0 || x >= w ? (sh.wrap ? R[y * w + ((x + w) % w)] : 0) : R[y * w + x]);
  let n = 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) n += spurAt(sh.toneOf, at, x, y);
  return n;
}

// --- the liquid sky -----------------------------------------------------------------
// A sky is layers (CLOUDS_SKY), each a field of clouds of many shapes and
// sizes run together into masses. Unlike a sheet above, a layer's puffs are
// not baked a step at a time: each moves every frame on its own current
// (CLOUDS_FLOW) and swells and wanes over its cloud's life (CLOUDS_LIFE), and
// the field is worked out afresh each frame -- on the graphics card
// (render/cloudgl.js), or here, cell by cell, for the checks and a hit test.

// A layer's numbers: each [at the horizon, nearest] pair taken at its depth.
export function layerParams(i) {
  const S = CLOUDS_SKY, d = S.layers > 1 ? i / (S.layers - 1) : 1, e = Math.pow(d, S.ease);
  const at = k => (Array.isArray(S[k]) ? S[k][0] + (S[k][1] - S[k][0]) * e : S[k]);
  const kinds = {};
  for (const k of new Set([...Object.keys(S.kinds[0]), ...Object.keys(S.kinds[1])]))
    kinds[k] = (S.kinds[0][k] || 0) * (1 - e) + (S.kinds[1][k] || 0) * e;
  const P = { d, e, kinds };
  for (const k of ['R', 'spread', 'tail', 'flat', 'rise', 'group', 'packing', 'gap', 'parallax', 'wind', 'shade', 'step', 'every']) P[k] = at(k);
  P.every = Math.max(1, Math.round(P.every));
  return P;
}

const pick = (rnd, w) => {
  let x = rnd() * Object.values(w).reduce((a, b) => a + b, 0);
  for (const k in w) if ((x -= w[k]) < 0) return k;
  return Object.keys(w)[0];
};
// a log-normal draw: most near 1, a long tail of big ones
const lognormal = (rnd, sigma) => Math.exp(sigma * Math.sqrt(-2 * Math.log(1 - rnd() * 0.999)) * Math.cos(TAU * rnd()));
const expo = (rnd, mean) => -mean * Math.log(1 - rnd() * 0.999);
const TIERS = ['crown', 'shoulders', 'body', 'base'];

// One cloud of a shape, size R, its base on `base`, middle `cx`, every puff
// squashed by `flat` and handed to `add(tier, x, y, r, flat)`.
function shape(rnd, kind, cx, base, R, flat, add0) {
  const H = CLOUDS_SHAPES, B = CLOUDS_BUBBLES;
  // every big lobe wears a crust of small ones round its upper side, as a
  // cumulus is lumps on lumps: they ride the same flow, so its edge bubbles
  const add = (tier, x, y, r, f) => {
    add0(tier, x, y, r, f);
    if (r < B.from) return;
    const n = Math.round(r * B.per);
    for (let k = 0; k < n; k++) {
      const a = Math.PI * (B.arc[0] + (B.arc[1] - B.arc[0]) * (k + rnd()) / n), rr = r * lerp(rnd(), B.r);
      // in the back tier, so a lump shows only where it stands out against
      // the sky, and never shades the cloud it sits on
      add0(0, x + Math.cos(a) * r * B.out, y + Math.sin(a) * r * B.out * f, rr, f);
    }
  };
  const tiers = TIERS.map(() => []);
  const fromCumulus = () => {
    cumulus(rnd, cx, base, R, TIERS, tiers);
    tiers.forEach((ps, j) => ps.forEach(p => add(j, p.x, base - (base - p.y) * flat, p.r, flat)));
  };
  if (kind === 'cumulus') return fromCumulus();
  if (kind === 'tower' || kind === 'anvil') {
    fromCumulus();
    // domes stacked up the crown, each smaller, wandering a little off line
    const T = H.tower, n = T.levels[0] + Math.floor(rnd() * (T.levels[1] - T.levels[0] + 1));
    let r = R * T.shrink, x = cx, y = base - R * 1.1 * flat;
    for (let k = 0; k < n; k++) {
      y -= r * T.climb * flat; x += (rnd() * 2 - 1) * T.wander * r;
      add(0, x, y, r, flat);
      add(1, x + (rnd() < 0.5 ? -1 : 1) * r * 0.7, y + r * 0.35 * flat, r * 0.6, flat);
      r *= T.shrink;
    }
    if (kind === 'anvil') {
      // the top spreads downwind into a flat shelf
      const A = H.anvil, reach = R * lerp(rnd(), A.reach);
      for (let dx = -R * 0.3; dx < reach; dx += R * 0.4) {
        const rr = R * lerp(rnd(), A.r);
        add(0, x + dx, y - r * 0.4 * flat + (rnd() - 0.5) * rr * 0.3, rr, flat * A.flat);
      }
    }
    return;
  }
  if (kind === 'heap') {
    // wide and low: a long body over a flat base, a few small domes
    const T = H.heap, f = flat * T.flat;
    for (let x = cx - T.span * R; x <= cx + T.span * R;) {
      const r = R * (0.45 + 0.2 * rnd());
      add(2, x, base - r * 0.55 * f, r, f);
      add(3, x + r * 0.4, base - r * 0.1 * f, r * 0.7, f * 0.8);
      x += r * (1.0 + 0.4 * rnd());
    }
    const n = T.crown[0] + Math.floor(rnd() * (T.crown[1] - T.crown[0] + 1));
    for (let k = 0; k < n; k++) {
      const r = R * lerp(rnd(), T.crownR);
      add(0, cx + (rnd() * 2 - 1) * T.span * R * 0.6, base - R * 0.65 * f - r * 0.4 * f, r, f);
    }
    return;
  }
  if (kind === 'stratus') {
    // a long wisp of small squashed puffs, wandering up and down
    const T = H.stratus, n = T.count[0] + Math.floor(rnd() * (T.count[1] - T.count[0] + 1));
    const len = R * lerp(rnd(), T.length), f = flat * T.flat;
    let y = base - R * 0.3 * flat;
    for (let k = 0; k < n; k++) {
      const x = cx - len / 2 + len * (k + rnd() * 0.6) / n;
      y += (rnd() - 0.5) * T.wander * R * f;
      add(2, x, y, R * lerp(rnd(), T.r) * (1 - 0.5 * Math.abs(k / (n - 1) * 2 - 1)), f);
    }
    return;
  }
  // a scrap: a few small puffs, loose
  const T = H.scrap, n = T.count[0] + Math.floor(rnd() * (T.count[1] - T.count[0] + 1));
  for (let k = 0; k < n; k++)
    add(2, cx + (rnd() - 0.5) * T.spread * R, base - R * (0.2 + 0.4 * rnd()) * flat, R * lerp(rnd(), T.r), flat);
}

// A puff of the liquid sky: where it rests, its size, its squash, its tier,
// its cloud's life and wander, and its own current.
function flowPuff(rnd, x, y, r, flat, tier, life, stray, F) {
  const per = () => lerp(rnd(), F.period), amp = () => r * lerp(rnd(), F.wander);
  return { x, y, r, flat, tier, life, stray,
    a: [amp(), amp() * 0.6, amp() * 0.35], w: [TAU / per(), TAU / per(), TAU / per()],
    p: [rnd() * TAU, rnd() * TAU, rnd() * TAU], q: [rnd() * TAU, rnd() * TAU, rnd() * TAU] };
}

// One layer of the sky, `W` cells round (it wraps), seeded.
export function skyLayer({ i, seed = 1, W }) {
  const P = layerParams(i), rnd = gen(seed * 7919 + 101 * (i + 1));
  const puffs = [], F = CLOUDS_FLOW;
  let x = rnd() * P.R * 3, top = 0, bottom = 0;
  while (x < W) {
    // a group: clouds packed close enough to run into one mass
    const n = 1 + Math.floor(expo(rnd, P.group - 1));
    for (let k = 0; k < n && x < W; k++) {
      const kind = pick(rnd, P.kinds), L = CLOUDS_LIFE[kind];
      const R = Math.min(P.R * P.tail, Math.max(P.R * 0.3, P.R * lognormal(rnd, P.spread)));
      const life = { per: TAU / lerp(rnd(), L.life), ph: rnd() * TAU, keep: L.keep };
      const stray = (rnd() * 2 - 1) * CLOUDS_SKY.stray * P.wind;
      const base = (rnd() - 0.5) * P.R * 0.5 * P.flat;
      shape(rnd, kind, x, base, R, P.flat, (tier, px, py, r, flat) => {
        puffs.push(flowPuff(rnd, px, py, r, flat, tier, life, stray, F));
        top = Math.min(top, py - r * flat * 1.6); bottom = Math.max(bottom, py + r * flat * 1.6);
      });
      x += R * lerp(rnd(), [P.packing * 0.6, P.packing * 1.4]);
    }
    x += P.R * expo(rnd, P.gap);
  }
  // the layer's cells: its base line `baseRow` rows down, room for the
  // tallest tower over it and the lowest belly under it
  const baseRow = Math.ceil(-top) + 1;
  for (const p of puffs) p.y += baseRow;
  return { i, P, W, puffs, h: Math.ceil(baseRow + bottom) + 2, baseRow, ground: false, nt: 4,
           rowOf: [0, 0, 0, 0], fills: null };
}

// The ground in the liquid sky: the billow rows of CLOUDS_KINDS.ground, each
// puff on a current of its own, each row filled solid beneath.
export function groundLayer({ seed = 1, W }) {
  const K = CLOUDS_KINDS.ground, G = CLOUDS_GROUND_FLOW, rnd = gen(seed * 7919 + 977);
  const tiers = Array.from({ length: K.rows }, () => []), fills = [];
  let depthSum = 0;
  for (let row = 1; row < K.rows; row++) depthSum += K.rowDrop * G.R * Math.pow(K.rowGrow, row - (K.rows - 1));
  const top = G.R * Math.pow(K.rowGrow, 1 - K.rows) * 2.2;
  billows(rnd, W, top, G.R, K, tiers, fills);
  const F = { wander: G.wander, period: G.period };
  const puffs = [];
  // no crust on the billows: lumps on a row's top break its crevice into
  // splinters
  tiers.forEach((ps, j) => ps.forEach(p => puffs.push(flowPuff(rnd, p.x, p.y, p.r, 1, j, null, 0, F))));
  return { i: -1, P: { d: 1, R: G.R, parallax: 1, wind: 0, shade: 0, every: 1 }, W, puffs, h: Math.ceil(top + depthSum + G.R * 0.9),
           baseRow: 0, ground: true, nt: K.rows, rowOf: tiers.map((_, j) => j), fills };
}

// Where a puff is at time t, in its layer's own cells (x not yet wrapped),
// and how big: on its current, and swollen or shrunk by its cloud's life.
export function puffAt(p, t, out = {}) {
  const life = p.life ? p.life.keep + (1 - p.life.keep) * (0.5 - 0.5 * Math.cos(t * p.life.per + p.life.ph)) : 1;
  out.x = p.x + p.stray * t + p.a[0] * Math.sin(t * p.w[0] + p.p[0]) + p.a[1] * Math.sin(t * p.w[1] + p.p[1]) + p.a[2] * Math.sin(t * p.w[2] + p.p[2]);
  out.y = p.y + CLOUDS_FLOW.lift * (p.a[0] * Math.sin(t * p.w[1] + p.q[0]) + p.a[1] * Math.sin(t * p.w[2] + p.q[1]) + p.a[2] * Math.sin(t * p.w[0] + p.q[2]));
  // a life's swell is square-root shaped, so a cloud fills out fast and thins slow
  out.r = p.r * Math.sqrt(life) * (1 + 0.06 * Math.sin(t * p.w[2] + p.q[0]));
  out.flat = p.flat;
  return out;
}

// The tier sums at one cell of a layer, at time t (the CPU's answer to what
// the card works out): for the checks and to hit a clickable cloud.
export function sumsAt(layer, t, cx, cy, out = [0, 0, 0, 0]) {
  out.length = layer.nt; out.fill(0);
  const q = {}, W = layer.W;
  for (const p of layer.puffs) {
    puffAt(p, t, q);
    const R = q.r * REACH;
    let dx = cx + 0.5 - q.x; dx -= W * Math.round(dx / W);
    const dy = (cy + 0.5 - q.y) / q.flat;
    const v = 1 - (dx * dx + dy * dy) / (R * R);
    if (v > 0) out[p.tier] += v * v * v;
  }
  if (layer.fills) layer.fills.forEach((f, j) => { if (f !== null) out[j] += Math.max(0, Math.min(1, (cy + 0.5 - f) / 3 + 0.5)) * CLOUDS_THRESHOLD * 2; });
  return out;
}
// The front-most tier at a cell, given the one it had (hysteresis, as
// tierRows); -1 is open sky.
export function tierOf(sums, was = null) {
  const up = CLOUDS_THRESHOLD * (1 + CLOUDS_HYST), dn = CLOUDS_THRESHOLD * (1 - CLOUDS_HYST);
  let lo = -1, hi = -1;
  for (let j = sums.length - 1; j >= 0; j--) {
    if (hi < 0 && sums[j] > dn) hi = j;
    if (sums[j] > up) { lo = j; break; }
  }
  if (hi < lo) hi = lo;
  if (was === null) return lo;
  return was < lo ? lo : was > hi ? hi : was;
}

// How a layer is drawn, as the card's passes read it: each tier's belly,
// crevice and rim depths, which cloud each tier is, what lies under the last
// row, and each role's tone and color for the page and treatment.
export function layerLook(layer, { page = 'light', treat = 'C' } = {}) {
  const D = CLOUDS_TREATMENTS[treat], C = CLOUDS_PALETTE[page], P = layer.P, nt = layer.nt;
  const named = Object.keys(C);
  const four = a => Int32Array.from({ length: 4 }, (_, j) => (j < nt ? a(j) : 0));
  const lobes = Array.from({ length: nt }, (_, j) => {
    // the crust's small lumps are not what a tier's bands are sized by
    const ps = layer.puffs.filter(p => p.tier === j && !p.crust);
    return ps.reduce((a, p) => a + p.r, 0) / Math.max(1, ps.length);
  });
  const belly = D.belly !== 'none' && !layer.ground ? Math.round(P.shade * P.R) : 0;
  const crease = j => (D.belly !== 'none' && layer.ground && lobes[j] >= CLOUDS_CREASE_MIN ? Math.max(2, Math.round(CLOUDS_KINDS.ground.crease * lobes[j])) : 0);
  const rim = D.rim ? Math.max(2, Math.round(CLOUDS_RIM * P.R)) : 0;
  const depthOf = j => (layer.ground ? CLOUDS_GROUND_DEPTHS[j] : P.e);
  const lut = new Float32Array(20 * 4), tone = new Int32Array(20);
  const rgba = (h, a = 1) => { const n = parseInt(h.slice(1), 16); return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255, a]; };
  for (let j = 0; j < nt; j++) {
    const band = CLOUDS_DEPTH_BANDS[page].filter(b => b[0] <= depthOf(j)).pop();
    const body = band[1], shade = D.tones === 2 ? band[2] : band[1];
    // a role's tone number is its color's, so two roles in one color are one
    // shape to the cleanup
    const id = role => named.findIndex(k => C[k] === C[role]) + 1;
    lut.set(rgba(C[body]), (j * 4 + 1) * 4); tone[j * 4 + 1] = id(body);
    lut.set(rgba(C[shade]), (j * 4 + 2) * 4); tone[j * 4 + 2] = id(shade);
    lut.set(rgba(C.lit), (j * 4 + 3) * 4); tone[j * 4 + 3] = id('lit');
  }
  tone[0] = named.indexOf('sky') + 1;
  return {
    shade: four(() => (belly >= 2 ? belly : 0)), crease: four(crease), lit: four(() => rim),
    row: four(j => layer.rowOf[j]), bottom: layer.ground ? nt : 0, inside: D.belly === 'inside',
    rimSky: page === 'dark', tone, lut
  };
}

// One lone cloud of a shape, as a layer that does not wrap: a clickable cloud.
export function cloudLayer({ kind = 'cumulus', R = 8, seed = 1, flat = 1 }) {
  const rnd = gen(seed * 7919 + 4243), puffs = [], L = CLOUDS_LIFE[kind];
  const life = { per: TAU / lerp(rnd(), L.life), ph: rnd() * TAU, keep: Math.max(0.6, L.keep) };
  let top = 0, bottom = 0, left = 0, right = 0;
  shape(rnd, kind, 0, 0, R, flat, (tier, x, y, r, f) => {
    puffs.push(flowPuff(rnd, x, y, r, f, tier, life, 0, CLOUDS_FLOW));
    top = Math.min(top, y - r * f * 1.7); bottom = Math.max(bottom, y + r * f * 1.7);
    left = Math.min(left, x - r * 1.7); right = Math.max(right, x + r * 1.7);
  });
  const ox = Math.ceil(-left) + 1, oy = Math.ceil(-top) + 1;
  for (const p of puffs) { p.x += ox; p.y += oy; }
  return { i: -2, P: { d: 0.6, e: 0.6, R, shade: CLOUDS_SKY.shade[1] * 0.8, parallax: 0.6, wind: 0.2 }, W: 1e6, puffs,
           w: Math.ceil(ox + right) + 2, h: Math.ceil(oy + bottom) + 2, baseRow: oy, ground: false, nt: 4, rowOf: [0, 0, 0, 0], fills: null };
}
