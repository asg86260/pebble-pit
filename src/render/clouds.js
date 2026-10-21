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
         CLOUDS_RECIPE, CLOUDS_BILLOW, CLOUDS_KINDS, CLOUDS_ONE_TONE_ROWS, CLOUDS_BAND_MIN, CLOUDS_CREASE_MIN, CLOUDS_CORE_MIN, CLOUDS_LOBE_LIGHT, CLOUDS_SEA,
         CLOUDS_TREATMENTS, CLOUDS_SKY, CLOUDS_LOD, CLOUDS_BANK, CLOUDS_LIFE, CLOUDS_SHAPES, CLOUDS_VOLUME, CLOUDS_TIERS,
         CLOUDS_FLOW, CLOUDS_GROUND_FLOW, CLOUDS_PALETTE, CLOUDS_DEPTH_BANDS, CLOUDS_LIGHT, CLOUDS_VOLUME_BANDS,
         CLOUDS_GROUND_DEPTHS } from '../config.js';

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

// The cloud sea (CLOUDS_SEA): rows of billows of every size, back (0) to
// front, each a tier, now and then a mound rising out of a row.
function sea(rnd, w, top, rows, size, tiers, fills) {
  const E = CLOUDS_SEA;
  let line = top;
  for (let row = 0; row < rows; row++) {
    const r0 = size(row);
    if (row) line += E.drop * r0;
    for (let x = rnd() * r0; x < w + r0;) {
      const r = r0 * Math.min(E.most, Math.max(E.least, lognormal(rnd, E.spread)));
      const y = line - r * lerp(rnd(), E.at);
      tiers[row].push({ x, y, r });
      if (rnd() < E.mound) {
        // a mound: a big billow standing up out of the row, smaller ones on it
        const R = r0 * E.rise, my = line - R * 0.55;
        tiers[row].push({ x, y: my, r: R });
        for (let k = 0, n = count(rnd, E.kids); k < n; k++) {
          const a = Math.PI * 0.45 * (rnd() * 2 - 1), rk = R * (0.4 + 0.25 * rnd());
          tiers[row].push({ x: x + Math.sin(a) * R * 0.8, y: my - Math.cos(a) * R * 0.8, r: rk });
        }
      }
      x += r * lerp(rnd(), E.step);
    }
    fills[row] = line + r0 * E.fill;
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

// A sheet baked once and held still: the drawing a page without WebGL2 shows
// in place of the liquid sky. Its one step is both of the steps it shows, so
// every cell is its tone exactly and nothing is ever re-baked.
export function stillSheet(opts, look = {}) {
  const sh = cloudSheet(opts);
  setLook(sh, look);
  bakeNow(sh, 0, sh.roles[0]);
  sh.roles[1].set(sh.roles[0]);
  sh.k0 = 0; sh.full = true; sh.nd = 0; sh.box = null;
  paint(sh, 0);
  return sh;
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
// A sky is one sheet of cloud cut into layers of distance (CLOUDS_SKY), and
// in each, clouds of many shapes and sizes, run together into masses. Unlike a sheet above, a layer's puffs are not baked a step at a
// time: each moves every frame on its own current (CLOUDS_FLOW) and swells
// and wanes over its cloud's life (CLOUDS_LIFE), and the field is worked out
// afresh each frame -- on the graphics card (render/cloudgl.js), or here,
// cell by cell, for the checks and a hit test.

// A layer's numbers: its distance on the sheet (`z`, 1 the nearest, out to
// CLOUDS_SKY.far), what comes of the distance (size, height, parallax, wind,
// each over it), and each [far, near] pair taken at its share of the way in.
export function layerParams(i) {
  const S = CLOUDS_SKY, d = S.layers > 1 ? i / (S.layers - 1) : 1, z = Math.pow(S.far, 1 - d);
  const P = { d, e: d, z };
  for (const k of Object.keys(S)) if (Array.isArray(S[k])) P[k] = S[k][0] + (S[k][1] - S[k][0]) * d;
  for (const k of ['R', 'lift', 'parallax', 'wind']) P[k] = S[k] / z;
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
const TIER = Object.fromEntries(CLOUDS_TIERS.map((n, j) => [n, j]));
const count = (rnd, [a, b]) => a + Math.floor(rnd() * (b - a + 1));

// A cloud in the round, size R, its base on `base`, middle `cx`, every puff
// squashed by `flat` and handed to `add(tier name, x, y, r, flat)`, the way a
// cumulus stacks (CLOUDS_VOLUME): a broad shelf along the base line in the
// rear, turrets rising off it, and smaller turrets clustered on each, each a
// step in front of or behind the one it grows from, so every turret shows its
// own round edge against its neighbors instead of melting into a slab.
const DEPTH = ['rear', 'mid', 'front', 'near'];
function volume(rnd, cx, base, R, flat, add) {
  const V = CLOUDS_VOLUME, B = V.base, T = V.turrets, K = V.kids;
  // the turrets side by side, each overlapping the last by `close` of their
  // radii, the group centered on the cloud's middle
  const n = count(rnd, T.n), rs = [], xs = [];
  for (let k = 0; k < n; k++) {
    const u = n > 1 ? Math.abs((k / (n - 1)) * 2 - 1) : 0;
    rs.push(R * lerp(rnd(), T.r) * (1 - T.ends * u));
    xs.push(k ? xs[k - 1] + (rs[k - 1] + rs[k]) * lerp(rnd(), T.close) : 0);
  }
  const lo = xs[0] - rs[0], hi = xs[n - 1] + rs[n - 1], shift = cx - (lo + hi) / 2;
  // the shelf under them all, a little wider than the turrets
  const half = (hi - lo) / 2 * lerp(rnd(), B.span), f = flat * B.flat;
  for (let x = cx - half; x <= cx + half;) {
    const r = R * lerp(rnd(), B.r);
    add('rear', x, base - r * B.at * f, r, f);
    x += r * lerp(rnd(), B.step);
  }
  // a turret, and the smaller ones clustered on its upper edge
  // (each rides the one it grows from, so it stays on it as the cloud
  // swells and thins)
  const grow = (x, y, r, z, gen, on = null) => {
    const me = add(DEPTH[z], x, y, r, flat, on);
    if (gen >= K.levels) return me;
    for (let k = 0, m = count(rnd, K.n); k < m; k++) {
      const rk = r * lerp(rnd(), K.shrink);
      if (rk < K.least) continue;
      const a = Math.PI * K.arc * (rnd() * 2 - 1), d = r * lerp(rnd(), K.out);
      let zk = z + (rnd() < K.front ? 1 : -1);
      if (zk < 0 || zk >= DEPTH.length) zk = z * 2 - zk;
      grow(x + Math.sin(a) * d, y - Math.cos(a) * d * flat, rk, zk, gen + 1, me);
    }
    return me;
  };
  // the one nearest the middle is the tallest; neighbors stand at different
  // depths, so two turrets side by side part; every turret's foot is in the
  // shelf, so none floats
  let tall = 0;
  for (let k = 1; k < n; k++) if (Math.abs(xs[k] + shift - cx) < Math.abs(xs[tall] + shift - cx)) tall = k;
  const first = Math.floor(rnd() * 3);
  for (let k = 0; k < n; k++) {
    const x = xs[k] + shift, y = base - rs[k] * lerp(rnd(), T.rise) * flat, z = 1 + (first + k) % 3;
    const me = grow(x, y, rs[k], z, 0);
    // the tallest tower: a turret stood on top of it, rooted in it
    if (k === tall) grow(x + (rnd() - 0.5) * rs[k] * 0.3, y - rs[k] * T.stack[0] * flat, rs[k] * T.stack[1], z === 1 ? 2 : z - 1, 0, me);
  }
}

// One cloud of a shape, as `volume` hands it out.
function shape(rnd, kind, cx, base, R, flat, add) {
  const H = CLOUDS_SHAPES;
  if (kind === 'cumulus') return volume(rnd, cx, base, R, flat, add);
  if (kind === 'tower' || kind === 'anvil') {
    volume(rnd, cx, base, R, flat, add);
    // domes stacked up the crown, each smaller, wandering a little off line:
    // rooted low, reaching high
    const T = H.tower;
    let r = R * T.shrink, x = cx, y = base - R * 1.1 * flat;
    for (let k = 0, n = count(rnd, T.levels); k < n; k++) {
      y -= r * T.climb * flat; x += (rnd() * 2 - 1) * T.wander * r;
      add(k % 2 ? 'front' : 'mid', x, y, r, flat);
      add('rear', x + (rnd() < 0.5 ? -1 : 1) * r * 0.7, y + r * 0.35 * flat, r * 0.6, flat);
      r *= T.shrink;
    }
    if (kind === 'anvil') {
      // the top spreads downwind into a flat shelf
      const A = H.anvil, reach = R * lerp(rnd(), A.reach);
      for (let dx = -R * 0.3; dx < reach; dx += R * 0.4)
        add('rear', x + dx, y - r * 0.4 * flat, R * lerp(rnd(), A.r), flat * A.flat);
    }
    return;
  }
  if (kind === 'heap') {
    // wide and low: a long body over a flat base, a few small domes
    const T = H.heap, f = flat * T.flat;
    for (let x = cx - T.span * R; x <= cx + T.span * R;) {
      const r = R * (0.45 + 0.2 * rnd());
      add('rear', x, base - r * 0.55 * f, r, f);
      // (its center well over the base, so the base's cut leaves a lobe and
      // not a strip one or two cells high)
      add(rnd() < 0.5 ? 'mid' : 'front', x + r * 0.4, base - r * 0.45 * f, r * 0.7, f);
      x += r * (1.0 + 0.4 * rnd());
    }
    for (let k = 0, n = count(rnd, T.crown); k < n; k++)
      add('near', cx + (rnd() * 2 - 1) * T.span * R * 0.6, base - R * 0.8 * f, R * lerp(rnd(), T.crownR), f);
    return;
  }
  if (kind === 'stratus') {
    // a long low sheet of small squashed puffs, wandering up and down
    const T = H.stratus, n = count(rnd, T.count), len = R * lerp(rnd(), T.length), f = flat * T.flat;
    let y = base - R * 0.3 * flat;
    for (let k = 0; k < n; k++) {
      y += (rnd() - 0.5) * T.wander * R * f;
      add('mid', cx - len / 2 + len * (k + rnd() * 0.6) / n, y, R * lerp(rnd(), T.r) * (1 - 0.5 * Math.abs(k / (n - 1) * 2 - 1)), f);
    }
    return;
  }
  if (kind === 'blob') {
    // a far cloud drawn plain: a few big lobes side by side on the base
    const T = H.blob;
    let x = cx;
    const rs = Array.from({ length: count(rnd, T.n) }, () => R * lerp(rnd(), T.r));
    x -= rs.reduce((a, r) => a + r * T.step[0], 0) / 2;
    for (const r of rs) { add('mid', x, base - r * lerp(rnd(), T.rise) * flat, r, flat); x += r * lerp(rnd(), T.step); }
    return;
  }
  // a scrap: a few small puffs, loose
  const T = H.scrap;
  for (let k = 0, n = count(rnd, T.count); k < n; k++)
    add(DEPTH[1 + (k % 3)], cx + (rnd() - 0.5) * T.spread * R, base - R * (0.2 + 0.4 * rnd()) * flat, R * lerp(rnd(), T.r), flat);
}

// A puff of the liquid sky: where it rests, its size, its squash, its tier,
// its cloud's life and wander, and its own current.
function flowPuff(rnd, x, y, r, flat, tier, life, stray, F) {
  const per = () => lerp(rnd(), F.period), amp = () => r * lerp(rnd(), F.wander);
  return { x, y, r, flat, tier, life, stray,
    a: [amp(), amp() * 0.6, amp() * 0.35], w: [TAU / per(), TAU / per(), TAU / per()],
    p: [rnd() * TAU, rnd() * TAU, rnd() * TAU], q: [rnd() * TAU, rnd() * TAU, rnd() * TAU] };
}

// A cloud's puffs, made and given their current, with the crust of small
// lumps on its big lobes: lumps that ride their lobe's current, many on the
// front tiers and few on the rear, so the back of a cloud is softer.
function cloudPuffs(rnd, kind, cx, base, R, flat, life, stray, puffs) {
  const K = CLOUDS_VOLUME.crust, F = CLOUDS_FLOW;
  shape(rnd, kind, cx, base, R, flat, (name, x, y, r, f, on) => {
    const j = TIER[name], p = flowPuff(rnd, x, y, r, f, j, life, stray, F);
    p.kind = kind;
    if (on) { p.follow = on; p.a = p.a.map(v => v * CLOUDS_VOLUME.kids.ride); }
    // every puff of a cloud stops at its base line: the bottom is flat
    p.cut = base;
    puffs.push(p);
    if (r < K.from || kind === 'blob') return p;
    const n = Math.round(r * K.per * (name === 'rear' ? K.back : 1));
    for (let k = 0; k < n; k++) {
      const a = Math.PI * (K.arc[0] + (K.arc[1] - K.arc[0]) * (k + rnd()) / n);
      const c = flowPuff(rnd, x + Math.cos(a) * r * K.out, y + Math.sin(a) * r * K.out * f, r * lerp(rnd(), K.r), f, j, life, stray, F);
      c.follow = p; c.crust = true; c.a = c.a.map(v => v * 0.4); c.cut = p.cut;
      puffs.push(c);
    }
    return p;
  });
}

// One layer of the sky, `W` cells round (it wraps), seeded: a band of the
// one sheet of cloud (CLOUDS_SKY), groups of clouds along it, each cloud
// somewhere in the band's slice of distance, so its base stands at the
// sheet's height seen from there. Its rows run from the top of its highest
// cloud down past its lowest base; `baseRow` is the horizon's row in them,
// `sky` the sky's height in cells that `lift` is a share of.
// `lane`, when given, is where the layer's bases sit instead: [highest,
// lowest] in cells below the layer's top row (its first row at y 0), a
// nearer, bigger cloud of the band higher in it -- the yard's lanes, for a
// place whose clouds keep to the top of its sky (act 3, render/after/cloudsky.js).
export function skyLayer({ i, seed = 1, W, sky = 145, lane = null }) {
  const S = CLOUDS_SKY, D = CLOUDS_LOD, P = layerParams(i), rnd = gen(seed * 7919 + 101 * (i + 1));
  const slice = Math.pow(S.far, 1 / Math.max(1, S.layers - 1)), puffs = [];
  const plain = P.d < D.plain;
  if (P.d < D.bank) bank(rnd, P, W, sky, puffs);
  else {
    let x = rnd() * P.R * 3;
    while (x < W) {
      // a group: clouds packed close enough to run into a mass
      for (let k = 0, n = 1 + Math.floor(expo(rnd, P.group - 1)); k < n && x < W; k++) {
        const kind = plain ? 'blob' : pick(rnd, S.kinds), L = CLOUDS_LIFE[kind] || CLOUDS_LIFE.heap;
        // nearer or farther in the band: bigger and higher, or smaller and lower
        const near = Math.pow(slice, S.jitter * (rnd() * 2 - 1));
        const R0 = near * Math.min(P.R * P.tail, Math.max(P.R * 0.3, P.R * lognormal(rnd, P.spread)));
        const life = { per: TAU / lerp(rnd(), L.life), ph: rnd() * TAU, keep: L.keep };
        const stray = (rnd() * 2 - 1) * S.stray * P.wind, cs = Math.floor(rnd() * 1e9);
        const u = Math.log(near) / Math.log(slice) / Math.max(S.jitter, 1e-6) * 0.5 + 0.5;
        const base = lane ? lane[1] - (lane[1] - lane[0]) * u : -P.lift * near * sky;
        // never smaller than the grid can draw whole: built again bigger
        const make = R => { const ps = []; cloudPuffs(gen(cs), kind, x, base, R, P.flat, life, stray, ps); return ps; };
        let ps = make(R0), R = R0;
        const [w, h] = extent(ps, base), k = Math.max(D.least.w / Math.max(w, 1e-3), D.least.h / Math.max(h, 1e-3));
        if (k > 1) ps = make(R = R0 * k);
        puffs.push(...ps);
        x += R * lerp(rnd(), [P.packing * 0.6, P.packing * 1.4]);
      }
      x += P.R * expo(rnd, P.gap);
    }
  }
  let top = 0, bottom = 0;
  for (const p of puffs) { top = Math.min(top, p.y - (p.r * 1.3 + p.a[0]) * p.flat * REACH); bottom = Math.max(bottom, p.y + (p.r * 1.3 + p.a[0]) * p.flat * REACH); }
  const baseRow = Math.ceil(-top) + 1;
  for (const p of puffs) { p.y += baseRow; if (p.cut !== undefined) p.cut += baseRow; }
  return { i, P, W, puffs, h: Math.ceil(baseRow + bottom) + 2, baseRow, ground: false, nt: CLOUDS_TIERS.length,
           rowOf: CLOUDS_TIERS.map(() => 0), fills: null, plain };
}
// A cloud's size as drawn, in cells: how wide, and how tall over its base.
function extent(ps, base) {
  let l = Infinity, r = -Infinity, t = base;
  for (const p of ps) { l = Math.min(l, p.x - p.r); r = Math.max(r, p.x + p.r); t = Math.min(t, p.y - p.r * p.flat); }
  return [r - l, base - t];
}
// The horizon's bank (CLOUDS_BANK): one row of low lobes all the way round,
// sitting on the horizon, each at least as tall as CLOUDS_LOD lets a cloud be.
function bank(rnd, P, W, sky, puffs) {
  const B = CLOUDS_BANK, F = CLOUDS_FLOW, f = P.flat * B.flat, j = TIER.mid;
  const least = CLOUDS_LOD.least.h / (f * (1 + B.at[0]));
  for (let x = rnd() * P.R; x < W + P.R;) {
    const r = Math.max(least, P.R * lerp(rnd(), B.r) * lognormal(rnd, B.spread));
    const p = flowPuff(rnd, x, -r * lerp(rnd(), B.at) * f, r, f, j, null, 0, F);
    p.cut = 0;
    puffs.push(p);
    x += r * lerp(rnd(), B.step);
  }
}

// The ground in the liquid sky: the billow rows of CLOUDS_KINDS.ground, each
// puff on a current of its own, each row filled solid beneath.
// `R` is its nearest row's billow size, `rows` how many rows and `depths`
// each row's depth for its tones (CLOUDS_DEPTH_BANDS), where a place wants a
// ground of its own measure (act 3's lapped edge, its foreground).
export function groundLayer({ seed = 1, W, R = CLOUDS_GROUND_FLOW.R, rows = CLOUDS_KINDS.ground.rows, depths = CLOUDS_GROUND_DEPTHS }) {
  const K = { ...CLOUDS_KINDS.ground, rows }, G = { ...CLOUDS_GROUND_FLOW, R }, rnd = gen(seed * 7919 + 977);
  const tiers = Array.from({ length: K.rows }, () => []), fills = [];
  const E = CLOUDS_SEA, size = row => G.R * Math.pow(E.grow, row - (K.rows - 1));
  let depthSum = 0;
  for (let row = 1; row < K.rows; row++) depthSum += E.drop * size(row);
  const top = size(0) * (E.rise + 1) + 1;
  sea(rnd, W, top, K.rows, size, tiers, fills);
  const F = { wander: G.wander, period: G.period };
  const puffs = [];
  // no crust on the billows: lumps on a row's top break its crevice into
  // splinters
  tiers.forEach((ps, j) => ps.forEach(p => puffs.push(flowPuff(rnd, p.x, p.y, p.r, 1, j, null, 0, F))));
  return { i: -1, P: { d: 1, e: 1, R: G.R, parallax: 1, wind: 0, every: G.every }, W, puffs, h: Math.ceil(top + depthSum + G.R * 0.9),
           baseRow: 0, ground: true, nt: K.rows, rowOf: tiers.map((_, j) => j), fills, depths };
}

// Where a puff is at time t, in its layer's own cells (x not yet wrapped),
// and how big: on its current, and swollen or shrunk by its cloud's life.
const lead = {};
export function puffAt(p, t, out = {}) {
  // a lobe is asked again for each lump of its crust in the same frame: its
  // answer is kept for the frame
  if (p._t === t) { out.x = p._x; out.y = p._y; out.r = p._r; out.flat = p.flat; return out; }
  puffNow(p, t, out);
  p._t = t; p._x = out.x; p._y = out.y; p._r = out.r;
  return out;
}
function puffNow(p, t, out) {
  if (p.follow) {
    // a crust lump: its lobe's place and swell, its own small stray on top
    puffAt(p.follow, t, lead);
    const k = lead.r / p.follow.r;
    out.x = lead.x + (p.x - p.follow.x) * k + p.a[0] * Math.sin(t * p.w[0] + p.p[0]);
    out.y = lead.y + (p.y - p.follow.y) * k + CLOUDS_FLOW.lift * p.a[1] * Math.sin(t * p.w[1] + p.q[0]);
    out.r = p.r * k * (1 + 0.1 * Math.sin(t * p.w[2] + p.q[1]));
    out.flat = p.flat;
    return out;
  }
  const life = p.life ? p.life.keep + (1 - p.life.keep) * (0.5 - 0.5 * Math.cos(t * p.life.per + p.life.ph)) : 1;
  // two sines across and two up and down, at three periods between them, so
  // no two lobes keep step and the path never quite repeats
  const s1 = Math.sin(t * p.w[1] + p.p[1]);
  out.x = p.x + p.stray * t + p.a[0] * Math.sin(t * p.w[0] + p.p[0]) + p.a[1] * s1;
  out.y = p.y + CLOUDS_FLOW.lift * (p.a[0] * Math.sin(t * p.w[2] + p.q[0]) + p.a[1] * Math.sin(t * p.w[1] + p.q[1]));
  // a life's swell is square-root shaped, so a cloud fills out fast and thins slow
  out.r = p.r * Math.sqrt(life) * (1 + 0.06 * Math.sin(t * p.w[2] + p.q[0]));
  out.flat = p.flat;
  return out;
}

// The tier sums at one cell of a layer, at time t (the CPU's answer to what
// the card works out): for the checks and to hit a clickable cloud.
export function sumsAt(layer, t, cx, cy, out = []) {
  out.length = layer.nt; out.fill(0);
  const q = {}, W = layer.W;
  for (const p of layer.puffs) {
    puffAt(p, t, q);
    const R = q.r * REACH;
    let dx = cx + 0.5 - q.x; dx -= W * Math.round(dx / W);
    const dy = (cy + 0.5 - q.y) / q.flat;
    const v = 1 - (dx * dx + dy * dy) / (R * R);
    if (v > 0 && !(cy + 0.5 > p.cut)) out[p.tier] += v * v * v;
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

// How a layer is drawn, as the card's passes read it: each tier's lit-face,
// shadow, base and core depths, which cloud each tier is, what lies under
// the last row, the light's way, and each role's tone and color for the page
// and treatment. Roles are tier * 5 + 1 lit face, + 2 body, + 3 shadowed
// side and underside, + 4 core (cloudgl.js, ROLES).
export function layerLook(layer, { page = 'light', treat = 'C' } = {}) {
  const LL = CLOUDS_LOBE_LIGHT, D = CLOUDS_TREATMENTS[treat], C = CLOUDS_PALETTE[page], P = layer.P, nt = layer.nt, VB = CLOUDS_VOLUME_BANDS;
  const eight = f => Int32Array.from({ length: 8 }, (_, j) => (j < nt ? f(j) : 0));
  const lobes = Array.from({ length: nt }, (_, j) => {
    // the crust's small lumps are not what a tier's bands are sized by
    const ps = layer.puffs.filter(p => p.tier === j && !p.crust);
    return ps.reduce((a, p) => a + p.r * p.flat, 0) / Math.max(1, ps.length);
  });
  const depthOf = j => (layer.ground ? (layer.depths || CLOUDS_GROUND_DEPTHS)[j] : P.e);
  const bandOf = j => CLOUDS_DEPTH_BANDS[page].filter(b => b[0] <= depthOf(j)).pop();
  const ladderOf = j => bandOf(j)[1];
  const round = j => bandOf(j)[2] === 'round' && D.tones === 2, based = j => bandOf(j)[2] !== 'flat' && D.tones === 2;
  const lut = new Float32Array(40 * 4), tone = new Int32Array(40), named = Object.keys(C);
  const rgba = h => { const n = parseInt(h.slice(1), 16); return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255, 1]; };
  const id = role => named.findIndex(k => C[k] === C[role]) + 1;
  // a plain layer (CLOUDS_LOD): one flat tone, its band's body, and no bands
  const plain = !!layer.plain;
  for (let j = 0; j < nt; j++) {
    const L = ladderOf(j);
    // A: one tone; B: the light and the shadow; C: lit face, body, shadow, core
    const kinds = D.tones === 1 || plain ? [1, 1, 1, 1] : D.belly === 'sky' ? [1, 1, 2, 2] : [0, 1, 2, 3];
    // a rear lobe sits a step deeper: where a front lobe's face is lit, its
    // is in the body's tone
    if (!layer.ground && CLOUDS_TIERS[j] === 'rear') kinds[0] = Math.max(kinds[0], 1);
    for (let k = 1; k <= 4; k++) {
      const role = L[kinds[k - 1]];
      lut.set(rgba(C[role]), (j * 5 + k) * 4); tone[j * 5 + k] = id(role);
    }
  }
  tone[0] = named.indexOf('sky') + 1;
  const band = (share, r) => depth(share, r);
  return {
    lit: eight(j => (round(j) && D.belly === 'inside' && !layer.ground ? band(VB.lit, lobes[j]) : 0)),
    shade: eight(j => (layer.ground ? (D.tones === 2 && lobes[j] >= CLOUDS_SEA.creaseMin ? Math.max(2, Math.round(CLOUDS_SEA.crease * lobes[j])) : 0)
      : round(j) && D.belly === 'inside' ? band(VB.shade, lobes[j]) : 0)),
    base: eight(j => (based(j) && !layer.ground ? Math.max(2, Math.round(VB.base * P.R)) : 0)),
    core: eight(j => (round(j) && D.belly === 'inside' && !layer.ground && CLOUDS_TIERS[j] !== 'near' && lobes[j] >= CLOUDS_CORE_MIN ? band(VB.core, lobes[j]) : 0)),
    row: eight(j => layer.rowOf[j]), bottom: layer.ground ? nt : 0,
    light: CLOUDS_LIGHT, tone, lut,
    // each lobe lit in the round, where the tier is drawn in the round
    // (the ground's billows take only the lit cap: their shadow is the
    // crevice where the row in front stands, and a crescent of their own on
    // top of it reads as cracks)
    lobe: eight(j => (layer.ground ? (D.tones === 2 ? 2 : 0) : round(j) ? 1 : 0)),
    lobeAt: [LL.lit[0], LL.lit[1], LL.shade[0], LL.shade[1]], lobeMin: LL.least * REACH,
    lightN: (() => { const [x, y] = CLOUDS_LIGHT, m = Math.hypot(x, y); return [x / m, y / m]; })()
  };
}

// One lone cloud of a shape, as a layer that does not wrap: a clickable
// cloud, or a cloud to study on the bench. `d` is how near it is, for its
// tones.
export function cloudLayer({ kind = 'cumulus', R = 8, seed = 1, flat = 1, d = 0.6 }) {
  const rnd = gen(seed * 7919 + 4243), puffs = [], L = CLOUDS_LIFE[kind];
  const life = { per: TAU / lerp(rnd(), L.life), ph: rnd() * TAU, keep: Math.max(0.6, L.keep) };
  cloudPuffs(rnd, kind, 0, 0, R, flat, life, 0, puffs);
  let top = 0, bottom = 0, left = 0, right = 0;
  for (const p of puffs) {
    const m = (p.r * 1.3 + p.a[0]) * REACH;
    top = Math.min(top, p.y - m * p.flat); bottom = Math.max(bottom, p.y + m * p.flat);
    left = Math.min(left, p.x - m); right = Math.max(right, p.x + m);
  }
  const ox = Math.ceil(-left) + 1, oy = Math.ceil(-top) + 1;
  for (const p of puffs) { p.x += ox; p.y += oy; if (p.cut !== undefined) p.cut += oy; }
  return { i: -2, P: { d, e: d, R, parallax: 0.6, wind: 0.2 }, W: 1e6, puffs,
           w: Math.ceil(ox + right) + 2, h: Math.ceil(oy + bottom) + 2, baseRow: oy, ground: false, nt: CLOUDS_TIERS.length,
           rowOf: CLOUDS_TIERS.map(() => 0), fills: null };
}
