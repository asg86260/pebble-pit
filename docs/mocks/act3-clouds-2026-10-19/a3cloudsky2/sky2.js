// ---------------------------------------------------------------- the sky
// Every range of cloud is drawn from math, seeded: nothing is placed by
// hand, the same seed gives the same sky, and the sky moves on with time.
//
// Sky time T is in seconds: the scrub, plus the page's clock times the speed.
const SKY = { seed: 7, spd: 1, w: 0.5, T0: 0 };
const skyT = () => SKY.T0 + tick * 0.25 * SKY.spd;
// Tones. By day white tops, a pale body and a line along the top no darker
// than mid; by night dim masses whose tops catch the light and whose bodies
// sink into the night sky.
const SKYT = {
  light: ['#fff', '#fff', '#d6d6d6', '#757575', '#d6d6d6', '#fff'],
  dark: ['#121212', '#262626', '#121212', '#666666', '#3a3a3a', '#3a3a3a'] };
// roles in the buffer: 0 sky, 1 lit, 2 shade, 3 near line, 4 far line, 5 lit top (night)

// value noise: a seeded random number at each whole point, eased between
// them. n1 runs along x; n2 along x and time, so a shape can change in place.
const ease = k => k * k * (3 - 2 * k);
const rnd = (i, j, k) => hsh(i, j, k + SKY.seed * 7919);
function n2(x, y, k) {
  const ix = Math.floor(x), iy = Math.floor(y), fx = ease(x - ix), fy = ease(y - iy);
  const a = rnd(ix, iy, k), b = rnd(ix + 1, iy, k), c = rnd(ix, iy + 1, k), d = rnd(ix + 1, iy + 1, k);
  return lerp(lerp(a, b, fx), lerp(c, d, fx), fy);
}
// The weather: the slider, swung slowly either way over half an hour, from
// calm (low ranges, small heads) to towering.
const weather = T => clamp(SKY.w + 0.3 * Math.sin(T * 2 * Math.PI / 1800 + SKY.seed), 0, 1);
// The three ranges, far to near: how tall they may stand, how big their
// heads, how fast they drift, and how their line is drawn.
const RANGES = [
  { A: 70, R: 7, S: 8, drift: 0.04, far: 1, cap: 4 },
  { A: 50, R: 10, S: 11, drift: 0.08, far: 1, cap: 6 },
  { A: 32, R: 14, S: 15, drift: 0.14, far: 0, cap: 8 }];
// A range's ridge at screen column x: three octaves of noise over the
// drifting coordinate u and over slow time, cut off at a floor so the range
// dips into valleys and is gone in places -- so the ranges overlap
// irregularly rather than stacking in bands.
function ridge(g, k, u, T, wf) {
  const v = 0.6 * n2(u / 95, T / 600, k * 10 + 1) + 0.32 * n2(u / 38, T / 300, k * 10 + 2) + 0.08 * n2(u / 16, T / 140, k * 10 + 3);
  return g.A * wf * Math.max(0, (v - 0.3) / 0.7);
}
// The top of each range, column by column (in cells, fractional): the ridge,
// with billow heads along it. A head j sits at a fixed place in u, so it
// drifts with the range; its radius is noise in time, and runs down to
// nothing and back, so heads swell, vanish and are reborn -- never pop.
function rangeTops(g, k, T) {
  const W2 = weather(T), wf = lerp(0.6, 1.3, W2), rf = lerp(0.7, 1.2, W2), off = rnd(k, 0, 99) * 1000 + g.drift * T;
  const top = new Float32Array(W + 8).fill(1e9), base = HOR + 2, X = i => i - 4 + 0.5;
  for (let i = 0; i < W + 8; i++) { const h = ridge(g, k, X(i) + off, T, wf); if (h > 0.3) top[i] = base - h; }
  const j0 = Math.floor((off - 4 - g.R * 2) / g.S), j1 = Math.ceil((off + W + 4 + g.R * 2) / g.S);
  for (let j = j0; j <= j1; j++) {
    const uj = (j + 0.5 + (rnd(j, k, 5) - 0.5) * 0.7) * g.S, x = uj - off;
    const h = ridge(g, k, uj, T, wf); if (h <= 0.3) continue;
    const r = g.R * rf * clamp(n2(j * 1.37, T / 90, k * 10 + 7) * 1.6 - 0.25, 0, 1) * Math.min(1, h / (g.R * 0.8));
    if (r < 0.5) continue;
    const cy = base - h + r * 0.25;
    for (let i = Math.max(0, Math.floor(x - r + 4)); i <= Math.min(W + 7, Math.ceil(x + r + 4)); i++) {
      const dx = X(i) - x; if (Math.abs(dx) >= r) continue;
      top[i] = Math.min(top[i], cy - Math.sqrt(r * r - dx * dx));
    }
  }
  return top;
}
// One frame of sky as a buffer of roles. Each range is solid from its top
// down. Its shading comes from the top line alone: white to a depth that
// grows on slopes facing the light (up and left) and thins on slopes facing
// away, cut under each head by a crescent where the point down and right of
// a cell is outside; shade below. The line runs along the top and down any
// steep side.
function skyFrame(T) {
  const buf = new Uint8Array(W * (HOR + 1));
  RANGES.forEach((g, k) => {
    const top = rangeTops(g, k, T), tp = i => top[i + 4];
    for (let x = 0; x < W; x++) {
      const t0 = tp(x); if (t0 > HOR) continue;
      const s = clamp(((tp(x + 1) > 1e8 ? HOR : tp(x + 1)) - (tp(x - 1) > 1e8 ? HOR : tp(x - 1))) / 2, -1.5, 1.5);
      const capD = g.cap * (1 - 0.45 * s), d = g.far ? 1 : 2;
      for (let y = Math.max(0, Math.floor(t0)); y <= HOR; y++) {
        const py = y + 0.5; if (py < t0) continue;
        const depth = py - t0, inside = (ox, oy) => { const tt = tp(Math.min(W + 3, x + ox)); return py + oy >= tt; };
        let role = depth < capD && inside(d, d) ? 1 : 2;
        if (role === 1 && depth < 2 && st.theme === 'dark') role = 5;
        if (depth < 1 || (depth < capD && (tp(x - 1) > py || tp(x + 1) > py))) role = g.far ? 4 : 3;
        buf[y * W + x] = role;
      }
    }
  });
  return buf;
}
// Cells never flip: the sky is worked out at whole steps of Q seconds, and
// each frame shows the step behind it with the step ahead laid over it at
// the share of the way between them -- a cell that changes fades across.
const Q = 2, FRAMES = new Map();
function frameAt(q) {
  const key = `${SKY.seed}|${SKY.w}|${st.theme}|${q}`; let f = FRAMES.get(key);
  if (!f) { f = skyFrame(q * Q); FRAMES.set(key, f); if (FRAMES.size > 6) FRAMES.delete(FRAMES.keys().next().value); }
  return f;
}
function sky() {
  const T = skyT(), q = Math.floor(T / Q), a = T / Q - q, A = frameAt(q), B = frameAt(q + 1), C = SKYT[st.theme];
  for (let y = 0; y <= HOR; y++) for (let x = 0; x < W; x++) {
    const c = y * W + x;
    cell(x, y, 1, 1, C[A[c]]);
    if (B[c] !== A[c] && a > 0.02) { g.globalAlpha = a; cell(x, y, 1, 1, C[B[c]]); g.globalAlpha = 1; }
  }
  const ro = document.getElementById('skyclock'); if (ro) ro.textContent = `sky time ${Math.floor(T / 60)}m ${String(Math.floor(T % 60)).padStart(2, '0')}s, weather ${weather(T).toFixed(2)}`;
}
