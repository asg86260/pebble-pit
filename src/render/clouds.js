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
         CLOUDS_TREATMENTS } from '../config.js';

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
    litOf: lobe.map(r => depth(K.lit, r)),
    sums: Array.from({ length: nt }, () => new Float32Array(n)),
    T: new Int8Array(n).fill(-1),
    roles: [new Uint8Array(n), new Uint8Array(n)],    // the step behind, the step ahead
    next: new Uint8Array(n),                          // the step after, being worked out
    diff: new Int32Array(n), nd: 0,
    phase: rnd() * K.step,                            // so sheets do not all turn on one frame
    k0: null, unit: 0, nextT: 0, full: true,
    page: 'light', treat: 'C', lut: null,
    canvas: null, ctx: null, img: null,
    flips: 0, backs: 0, last: new Uint8Array(n)       // for the checks: cells re-toned, and gone back
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
// A cell with at most one 4-neighbor of its own role takes its neighbors'
// commonest one: no spur or sliver a cell wide survives a bake.
function cleanRows(sh, R, y0, y1) {
  const { w, h } = sh, bottom = sh.ground ? (sh.nt - 1) * 4 + 1 : 0;
  const at = (x, y) => (y < 0 ? 0 : y >= h ? bottom
    : x < 0 || x >= w ? (sh.wrap ? R[y * w + ((x + w) % w)] : 0) : R[y * w + x]);
  for (let y = y0; y < y1; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x, r = R[i];
    const a = at(x - 1, y), b = at(x + 1, y), c = at(x, y - 1), d = at(x, y + 1);
    if ((a === r) + (b === r) + (c === r) + (d === r) > 1) continue;
    let best = r, most = 0;
    for (const v of [a, b, c, d]) if (v !== r) {
      const m = (v === a) + (v === b) + (v === c) + (v === d);
      if (m > most) { most = m; best = v; }
    }
    R[i] = best;
  }
}
// A bake is passes over the rows: a field per tier, the front-most tier, the
// roles and two cleanups. A pass reads rows ahead of the one it is on, so it
// starts only once the pass before has finished; the work can stop after any
// row of any pass and go on next frame. A field row costs about ten of any
// other pass's, which is what `weight` says.
const passes = sh => sh.nt + 4;
const total = sh => passes(sh) * sh.h;
const weight = (sh, u) => { const f = sh.nt * sh.h; return u < f ? u : f + (u - f) * 0.1; };
function bakeUnits(sh, t, out, u0, u1) {
  for (let u = u0; u < u1;) {
    const pass = Math.floor(u / sh.h), y0 = u % sh.h, y1 = Math.min(sh.h, y0 + (u1 - u));
    if (pass < sh.nt) fieldRows(sh, t, pass, y0, y1);
    else if (pass === sh.nt) tierRows(sh, y0, y1);
    else if (pass === sh.nt + 1) roleRows(sh, out, y0, y1);
    else cleanRows(sh, out, y0, y1);
    u += y1 - y0;
  }
}
export function bakeNow(sh, t, out = sh.next) { bakeUnits(sh, t, out, 0, total(sh)); return out; }

// --- tones ------------------------------------------------------------------------
function lutOf(sh) {
  const L = CLOUDS_TONES[sh.page], lut = new Array(4 * sh.nt + 4).fill(null);
  for (let j = 0; j < sh.nt; j++) {
    const one = sh.tone1[j], [body, shade] = sh.K.tones[sh.page];
    const two = CLOUDS_TREATMENTS[sh.treat].tones === 2;
    lut[j * 4 + 1] = hexRgb(L.steps[two ? body : one]);
    lut[j * 4 + 2] = hexRgb(L.steps[two ? shade : one]);
    lut[j * 4 + 3] = hexRgb(L.lit);
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
  sh.last.fill(0);
  diff(sh);
  sh.unit = 0; sh.nextT = (sh.k0 + 2) * sh.K.step - sh.phase;
  sh.full = true;
}
function diff(sh) {
  const [A, B] = sh.roles; let nd = 0, backs = 0;
  for (let i = 0; i < sh.n; i++) if (A[i] !== B[i]) {
    sh.diff[nd++] = i;
    if (sh.last[i] === B[i] + 1) backs++;           // back to what it was a step ago
    sh.last[i] = A[i] + 1;
  }
  sh.nd = nd; sh.flips = nd; sh.backs = backs;
}
// Turn every sheet's clock to `t` (game seconds) and work their bakes, the
// slices of all of them inside one budget a frame (CLOUDS_BUDGET_MS). Returns
// the milliseconds the bakes took.
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
  const ms = performance.now() - t0;
  for (const sh of sheets) {
    const a = Math.min(1, Math.max(0, (t + sh.phase) / sh.K.step - sh.k0));
    paint(sh, a * a * (3 - 2 * a));                   // eased, so a cell glides into its change
  }
  return ms;
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
  if (sh.full) { for (let i = 0; i < sh.n; i++) put(i); sh.full = false; }
  else for (let k = 0; k < sh.nd; k++) put(sh.diff[k]);
  sh.ctx.putImageData(sh.img, 0, 0);
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
// Cells that have one or no 4-neighbors of their own role: what the cleanup
// pass is meant to leave none of.
export function spursOf(sh, R = sh.roles[1]) {
  const { w, h } = sh, bottom = sh.ground ? (sh.nt - 1) * 4 + 1 : 0;
  const at = (x, y) => (y < 0 ? 0 : y >= h ? bottom
    : x < 0 || x >= w ? (sh.wrap ? R[y * w + ((x + w) % w)] : 0) : R[y * w + x]);
  let n = 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const r = R[y * w + x];
    if ((at(x - 1, y) === r) + (at(x + 1, y) === r) + (at(x, y - 1) === r) + (at(x, y + 1) === r) <= 1) n++;
  }
  return n;
}
