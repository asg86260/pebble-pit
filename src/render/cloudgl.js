// The liquid sky on the graphics card: every cell of every cloud layer in
// view worked out afresh each frame, from puffs that moved this frame.
//
// Why the card: the sky flows (CLOUDS_FLOW), so the field has to be answered
// every frame, not every few seconds -- 77,000 cells at 2000 x 967, each a
// sum over the puffs near it, for every layer in view. That is a few
// milliseconds of the main thread a frame in plain JavaScript and well under
// one on any graphics card, and the card is already drawing the page. It is
// WebGL2 in the browser itself, no dependency; where there is none (node,
// an old machine) clouds.js's baked sheets draw the same clouds a step at a
// time, and the checks run there.
//
// A frame, for each layer's window (the columns in view, in the layer's own
// cells, so the window only ever moves a whole cell at a time):
//
//   field   each cell sums its nearby puffs (a table of which puffs reach
//           which 8-column strip keeps that short) into its four tiers, and
//           takes the front-most tier past the threshold -- keeping last
//           frame's answer within CLOUDS_HYST of it, so an edge does not
//           chatter as it flows across a cell
//   roles   bellies, crevices and rims, by looking a set depth below and above
//   clean   a cell alone in its tone takes its neighbors' tone
//   settle  a cell takes a new role only once it has wanted it a few frames
//   fade    each cell's color eases toward its tone over CLOUDS_FADE_S
//
// then every window is copied into one canvas, a pixel a cell, for the 2D
// page to draw scaled up at the layer's true position (drawCloud in
// clouds.js's terms: one rounding for the whole layer).

import { CLOUDS_THRESHOLD, CLOUDS_HYST, CLOUDS_FADE_S, CLOUDS_SETTLE, CLOUDS_CLEAN, CLOUDS_LOOK, CLOUDS_UNDER } from '../config.js';
import { puffAt } from './clouds.js';

const REACH = 1 / Math.sqrt(1 - Math.cbrt(CLOUDS_THRESHOLD));
const STRIP = 8;

const VERT = `#version 300 es
in vec2 a; void main() { gl_Position = vec4(a, 0., 1.); }`;

const FIELD = `#version 300 es
precision highp float; precision highp int; precision highp usampler2D;
uniform sampler2D uPuffs;   // x, y, reach, flat (row 0); tier, base cut (row 1)
uniform sampler2D uStrips;  // per 8-column strip: first, count
uniform sampler2D uIndex;   // puff indices, strip by strip
uniform usampler2D uPrev;   // last frame's tier + 1
uniform ivec2 uShift;       // where last frame's cell is, from this one
uniform int uFresh;
uniform int uTiers;
uniform float uFill[8];     // a row's solid underneath starts here (the ground), else far below
uniform int uLobe[8];       // 1: a tier whose lobes are each lit and shadowed as rounded forms; 2: lit only
uniform vec4 uLobeAt;       // lit cap: facing, rim; shadow: facing, rim (CLOUDS_LOBE_LIGHT)
uniform float uLobeMin;     // the least reach of a lobe lit on its own
uniform vec2 uLightN;       // toward the light, unit
out uint o;                 // tier + 1, and the lobe's light (0, 1 lit, 2 shadow) times 16
void main() {
  ivec2 c = ivec2(gl_FragCoord.xy);
  vec2 p = vec2(c) + 0.5;
  float s[8] = float[8](0., 0., 0., 0., 0., 0., 0., 0.);
  // each tier's strongest lobe at this cell: how strong, which way the cell
  // is from its middle as a share of its visible radius, and its reach
  float w[8] = float[8](0., 0., 0., 0., 0., 0., 0., 0.);
  vec3 d[8];
  vec2 st = texelFetch(uStrips, ivec2(c.x / ${STRIP}, 0), 0).xy;
  int first = int(st.x), n = int(st.y);
  for (int k = 0; k < n; k++) {
    int i = int(texelFetch(uIndex, ivec2((first + k) % 4096, (first + k) / 4096), 0).x);
    vec4 a = texelFetch(uPuffs, ivec2(i, 0), 0);
    float dx = p.x - a.x, dy = (p.y - a.y) / a.w;
    float q = 1. - (dx * dx + dy * dy) / (a.z * a.z);
    vec4 b = texelFetch(uPuffs, ivec2(i, 1), 0);
    // nothing of a puff below its cloud's base line: a cumulus's bottom is
    // flat, at the height the whole field shares
    if (q > 0. && p.y <= b.y) {
      int j = int(b.x);
      float v = q * q * q;
      s[j] += v;
      if (v > w[j]) { w[j] = v; d[j] = vec3(vec2(dx, dy) / (a.z * ${(1 / REACH).toFixed(5)}), a.z); }
    }
  }
  for (int j = 0; j < 8; j++) s[j] += clamp((p.y - uFill[j]) / 3. + 0.5, 0., 1.) * ${(CLOUDS_THRESHOLD * 2).toFixed(4)};
  float up = ${(CLOUDS_THRESHOLD * (1 + CLOUDS_HYST)).toFixed(5)}, dn = ${(CLOUDS_THRESHOLD * (1 - CLOUDS_HYST)).toFixed(5)};
  int lo = -1, hi = -1;
  for (int j = uTiers - 1; j >= 0; j--) { if (hi < 0 && s[j] > dn) hi = j; if (s[j] > up) { lo = j; break; } }
  if (hi < lo) hi = lo;
  int was = lo;
  ivec2 q = c + uShift, sz = textureSize(uPrev, 0);
  if (uFresh == 0 && q.x >= 0 && q.y >= 0 && q.x < sz.x && q.y < sz.y) was = int(texelFetch(uPrev, q, 0).r & 15u) - 1;
  int t = clamp(was, lo, hi);
  // a lobe in the round: its cap toward the light lit, the side away from it
  // in shadow, read off the lobe the cell belongs to (the strongest of its
  // tier there), so every turret of a cloud and every smaller one clustered
  // on it shows as its own rounded form, its edge against its neighbor a
  // lit cap meeting a shadow
  uint h = 0u;
  if (t >= 0 && uLobe[t] > 0 && w[t] > 0. && d[t].z >= uLobeMin) {
    float u = length(d[t].xy), f = u > 0. ? dot(d[t].xy / u, uLightN) : 0.;
    if (f > uLobeAt.x && u > uLobeAt.y) h = 1u;
    else if (uLobe[t] == 1 && f < -uLobeAt.z && u > uLobeAt.w) h = 2u;
  }
  o = uint(t + 1) | (h << 4);
}`;

// The volume of a cloud, by looking from each cell a set depth along the
// light and against it, never by slope. A tier's roles are j * 5 + k:
//   k 1  its lit face: the cell toward the light is open sky, so this is
//        the side of the cloud the light falls on
//   k 2  its plain body
//   k 3  its shadowed side: the cell away from the light is open sky; and
//        its underside over open sky
//   k 3  also where a nearer lobe stands just below it: the shadow where
//        lobes meet
//   k 4  the lower half of its underside, the darkest of it
// A ground row's crevice is its shadowed side where the next row stands.
const ROLES = `#version 300 es
precision highp float; precision highp int; precision highp usampler2D;
uniform usampler2D uT;
uniform int uLit[8], uShade[8], uBase[8], uCore[8], uRow[8];   // depths a tier, and which cloud it is
uniform vec2 uLight;       // toward the light, a unit step
uniform int uBottom;       // what is under the last row: a tier + 1, or 0
uniform int uLook;         // CLOUDS_LOOK: 0 one tone, 1 body and underside, 2 the full look
uniform vec2 uUnder;       // the plain underside: its share of the cloud standing over it, and its most, in base bands
out uint o;
int at(ivec2 c) {
  ivec2 sz = textureSize(uT, 0);
  if (c.y < 0) return -1;
  if (c.y >= sz.y) return uBottom - 1;
  if (c.x < 0 || c.x >= sz.x) return -2;
  return int(texelFetch(uT, c, 0).r & 15u) - 1;
}
// the lobe's own light at a cell (FIELD): 0, 1 lit, 2 shadow
int lobe(ivec2 c) { return int(texelFetch(uT, c, 0).r >> 4); }
// open sky, or -- where the tier's lobes are modeled inside the cloud (a core
// band) -- a farther lobe of the same cloud: a front lobe's top is lit where
// it stands against the lobe behind it, so it reads as standing in front
bool behind(int b, int j) { return b == -1 || (uCore[j] > 0 && b >= 0 && b < j && uRow[b] == uRow[j]); }
// open sky only: a cloud is shadowed as a whole, on its outer edge
bool open(int b) { return b == -1; }
void main() {
  ivec2 c = ivec2(gl_FragCoord.xy);
  int j = at(c);
  if (j < 0) { o = 0u; return; }
  int k = 2, h = lobe(c);
  if (h == 1) k = 1; else if (h == 2) k = 3;
  int l = uLit[j], s = uShade[j], b = uBase[j], co = uCore[j];
  if (l > 0 && behind(at(c + ivec2(round(uLight * float(l)))), j)) k = 1;
  if (s > 0 && open(at(c - ivec2(round(uLight * float(s)))))) k = 3;
  if (s > 0) { int n = at(c + ivec2(0, s)); if (n > j && uRow[n] != uRow[j]) k = 3; }
  if (b > 0 && at(c + ivec2(0, b)) == -1) k = at(c + ivec2(0, (b + 1) / 2)) == -1 ? 4 : 3;
  if (co > 0) { int n = at(c + ivec2(0, co)); if (n > j && uRow[n] == uRow[j]) k = 3; }
  if (uLook == 0) k = 2;
  if (uLook == 1) {
    // the body, a crevice where a ground row stands in front, and the
    // underside over open sky, as deep as a share of the cloud standing over
    // that column: deep under a tall lobe, thin under a low shoulder, nothing
    // at the ends -- its top edge follows the lobes' own outline above it,
    // never a ruled bar
    k = 2;
    if (s > 0) { int n = at(c + ivec2(0, s)); if (n > j && uRow[n] != uRow[j]) k = 3; }
    int most = int(float(b) * uUnder.y + 0.5), e = 0;
    for (int i = 1; i <= 16; i++) if (e == 0 && i <= most && at(c + ivec2(0, i)) == -1) e = i;
    if (e > 0) {
      int up = 0;
      for (int i = 1; i <= 96; i++) { if (at(c - ivec2(0, i)) < 0) break; up = i; }
      if (float(e) <= uUnder.x * float(e + up)) k = 3;
    }
  }
  o = uint(j * 5 + k);
}`;

const CLEAN = `#version 300 es
precision highp float; precision highp int; precision highp usampler2D;
uniform usampler2D uR;
uniform int uTone[40];   // a role's tone, so two tiers in one tone are one shape
out uint o;
uint at(ivec2 c) { ivec2 sz = textureSize(uR, 0); c = clamp(c, ivec2(0), sz - 1); return texelFetch(uR, c, 0).r; }
void main() {
  ivec2 c = ivec2(gl_FragCoord.xy);
  uint me = at(c);
  uint n[4] = uint[4](at(c - ivec2(1, 0)), at(c + ivec2(1, 0)), at(c - ivec2(0, 1)), at(c + ivec2(0, 1)));
  int tm = uTone[me], t[4];
  int same = 0;
  for (int k = 0; k < 4; k++) { t[k] = uTone[n[k]]; same += t[k] == tm ? 1 : 0; }
  // a cell one cell thick in its tone, across or up and down: a line, a
  // sliver or a speck, which the grid cannot draw as a shape (the owner,
  // 2026-10-20: "single cell lines"). It takes the tone it lies between,
  // from the side it is thin on. Steadied by the settle pass after, so a
  // band flowing a cell thinner for a frame does not blink.
  bool across = t[0] != tm && t[1] != tm, upDown = t[2] != tm && t[3] != tm;
  if (!across && !upDown) { o = me; return; }
  int best = -1, most = 0;
  int k0 = across ? 0 : 2, k1 = across && upDown ? 4 : k0 + 2;
  for (int k = k0; k < k1; k++) if (t[k] != tm) {
    int m = 0; for (int q = 0; q < 4; q++) m += t[q] == t[k] ? 1 : 0;
    if (m > most) { most = m; best = k; }
  }
  o = best >= 0 ? n[best] : me;
}`;

// A cell takes a new role only once it has wanted it CLOUDS_SETTLE frames
// running: an edge that wavers on a cell for a frame or two (a cleanup that
// takes a spur one frame and not the next, a belly's edge on a row) does not
// tick back and forth, and an edge that is really moving is a few frames
// late, which no eye can tell.
const SETTLE = `#version 300 es
precision highp float; precision highp int; precision highp usampler2D;
uniform usampler2D uR;      // the role wanted this frame
uniform usampler2D uPrev;   // shown, wanted, frames wanted
uniform ivec2 uShift;
uniform int uFresh;
out uvec4 o;
void main() {
  ivec2 c = ivec2(gl_FragCoord.xy);
  uint want = texelFetch(uR, c, 0).r;
  ivec2 q = c + uShift, sz = textureSize(uPrev, 0);
  if (uFresh == 1 || q.x < 0 || q.y < 0 || q.x >= sz.x || q.y >= sz.y) { o = uvec4(want, want, 0u, 0u); return; }
  uvec4 was = texelFetch(uPrev, q, 0);
  if (want == was.r) { o = uvec4(was.r, want, 0u, 0u); return; }
  uint n = want == was.g ? was.b + 1u : 1u;
  o = n >= ${CLOUDS_SETTLE}u ? uvec4(want, want, 0u, 0u) : uvec4(was.r, want, n, 0u);
}`;

const FADE = `#version 300 es
precision highp float; precision highp int; precision highp usampler2D;
uniform usampler2D uR;     // shown, wanted, frames wanted: the shown role is .r
uniform sampler2D uPrev;
uniform ivec2 uShift;
uniform int uFresh;
uniform vec4 uLut[40];
uniform float uStep;
out vec4 o;
void main() {
  ivec2 c = ivec2(gl_FragCoord.xy);
  vec4 want = uLut[texelFetch(uR, c, 0).r];
  ivec2 q = c + uShift, sz = textureSize(uPrev, 0);
  if (uFresh == 1 || q.x < 0 || q.y < 0 || q.x >= sz.x || q.y >= sz.y) { o = want; return; }
  vec4 was = texelFetch(uPrev, q, 0);
  // a cell coming out of the sky takes its tone at once and fades in, and
  // one going to the sky keeps its tone and fades out: only the opacity moves
  if (was.a == 0.) was = vec4(want.rgb, 0.);
  if (want.a == 0.) want = vec4(was.rgb, 0.);
  o = was + clamp(want - was, -uStep, uStep);
}`;

const BLIT = `#version 300 es
precision highp float;
uniform sampler2D uImg;
uniform ivec2 uAt;      // the window's place in the canvas, top-left, in cells
uniform int uCanvasH;
out vec4 o;
void main() {
  ivec2 c = ivec2(gl_FragCoord.xy);
  ivec2 q = ivec2(c.x - uAt.x, (uCanvasH - 1 - c.y) - uAt.y);   // the canvas's rows run down
  vec4 v = texelFetch(uImg, q, 0);
  o = vec4(v.rgb * v.a, v.a);
}`;

function program(gl, fs) {
  const p = gl.createProgram();
  for (const [type, src] of [[gl.VERTEX_SHADER, VERT], [gl.FRAGMENT_SHADER, fs]]) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    gl.attachShader(p, s);
  }
  gl.bindAttribLocation(p, 0, 'a');
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
  const u = {};
  const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
  for (let i = 0; i < n; i++) { const a = gl.getActiveUniform(p, i), name = a.name.replace(/\[0\]$/, ''); u[name] = gl.getUniformLocation(p, a.name); }
  return { p, u };
}

// A sky renderer, or null where the page has no WebGL2.
export function skyGL() {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  // a real WebGL2 context or none: a stand-in canvas (the node yard's) hands
  // back something truthy that is not one, and a card that cannot build the
  // passes is no card
  if (typeof WebGL2RenderingContext === 'undefined') return null;
  const gl = canvas.getContext('webgl2', { premultipliedAlpha: true, antialias: false, preserveDrawingBuffer: true });
  if (!(gl instanceof WebGL2RenderingContext)) return null;
  let P;
  try {
    P = { field: program(gl, FIELD), roles: program(gl, ROLES), clean: program(gl, CLEAN), settle: program(gl, SETTLE), fade: program(gl, FADE), blit: program(gl, BLIT) };
  } catch { return null; }
  const quad = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quad);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  const tex = (w, h, internal, format, type, data = null) => {
    const t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    for (const k of [gl.TEXTURE_MIN_FILTER, gl.TEXTURE_MAG_FILTER]) gl.texParameteri(gl.TEXTURE_2D, k, gl.NEAREST);
    for (const k of [gl.TEXTURE_WRAP_S, gl.TEXTURE_WRAP_T]) gl.texParameteri(gl.TEXTURE_2D, k, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, internal, w, h, 0, format, type, data);
    return t;
  };
  const target = t => { const f = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, f); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0); return f; };
  const uint8 = (w, h) => { const t = tex(w, h, gl.R8UI, gl.RED_INTEGER, gl.UNSIGNED_BYTE); return { t, f: target(t) }; };
  const rgba = (w, h) => { const t = tex(w, h, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE); return { t, f: target(t) }; };
  const urgba = (w, h) => { const t = tex(w, h, gl.RGBA8UI, gl.RGBA_INTEGER, gl.UNSIGNED_BYTE); return { t, f: target(t) }; };
  const bind = (unit, t) => { gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, t); };
  const pass = (prog, out, w, h) => { gl.useProgram(prog.p); gl.bindFramebuffer(gl.FRAMEBUFFER, out); gl.viewport(0, 0, w, h); };
  const draw = () => gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

  // a window's textures, made again when its size changes
  const windows = new Map();
  function windowOf(key, w, h) {
    let s = windows.get(key);
    if (s && s.w === w && s.h === h) return s;
    s = { w, h, T: [uint8(w, h), uint8(w, h)], R: [uint8(w, h), uint8(w, h)], Q: [urgba(w, h), urgba(w, h)], D: [rgba(w, h), rgba(w, h)], k: 0, ox: null, fresh: true,
          puffs: null, strips: null, index: null, cap: 0 };
    windows.set(key, s);
    return s;
  }

  const q = {};
  let tmp = new Float32Array(4096 * 6);
  // The puffs that reach this window, at time t, as the field pass reads them:
  // their places and sizes, and which 8-column strips each reaches (a counting
  // sort into one index list). Typed arrays kept from frame to frame, so a
  // frame makes no garbage.
  // `sc`, for a cloud that swells (the yard's, weather.js): every puff's
  // radius times `grow` and its height over the base row `base` times `rise`,
  // as its circles are counted for the sky's report.
  function upload(s, layer, t, ox, oy, sc = null) {
    const { w } = s, W = layer.W;
    let n = 0;
    for (const p of layer.puffs) {
      // where its current can have carried it at most: past that the sines
      // are not worked out at all, which is most of a wide layer's puffs
      // (a lobe that rides another -- a crust lump, a turret on a turret --
      // goes where the one at the root of its chain goes: that one's reach,
      // and how far off it this one sits, with every wander on the way)
      let lobe = p, ride = 0;
      while (lobe.follow) { ride += lobe.a[0] + lobe.a[1]; lobe = lobe.follow; }
      const reach = p.reach || (p.reach = (lobe.r * 1.08 + lobe.a[0] + lobe.a[1] + lobe.a[2]) * REACH + 1 +
        (p.follow ? (Math.abs(p.x - lobe.x) + p.r * 1.2 + ride) * REACH : 0));
      let near = lobe.x + lobe.stray * t - ox; near -= W * Math.floor(near / W);
      if (near > w + reach && near < W - reach) continue;
      puffAt(p, t, q);
      if (sc) { q.y = sc.base + (q.y - sc.base) * sc.rise; q.r *= sc.grow * sc.rise; }
      const R = q.r * REACH;
      if (R <= 0.05) continue;
      // every copy of a wrapping layer that reaches the window
      // and none that cannot reach the window's rows
      if (q.y - oy + R * q.flat < 0 || q.y - oy - R * q.flat > s.h) continue;
      let x = q.x - ox; x -= W * Math.floor(x / W);
      for (let c = x - W; c < w + R; c += W) if (c + R > 0 && c - R < w) {
        if ((n + 1) * 6 > tmp.length) { const g = new Float32Array(tmp.length * 2); g.set(tmp); tmp = g; }
        tmp[n * 6] = c; tmp[n * 6 + 1] = q.y - oy; tmp[n * 6 + 2] = R; tmp[n * 6 + 3] = q.flat; tmp[n * 6 + 4] = p.tier;
        tmp[n * 6 + 5] = p.cut === undefined ? 1e9 : p.cut - oy;
        n++;
      }
    }
    const strips = Math.ceil(w / STRIP);
    if (!s.puffs || n > s.cap) {
      s.cap = Math.max(64, n * 2);
      s.row0 = new Float32Array(s.cap * 4); s.row1 = new Float32Array(s.cap * 4);
      s.puffs = tex(s.cap, 2, gl.RGBA32F, gl.RGBA, gl.FLOAT, null);
      s.count = new Int32Array(strips + 1); s.st = new Float32Array(strips * 4);
    }
    if (s.count.length < strips + 1) { s.count = new Int32Array(strips + 1); s.st = new Float32Array(strips * 4); }
    const A = s.row0, B = s.row1, C = s.count, st = s.st;
    C.fill(0);
    const k0 = i => Math.max(0, Math.floor((tmp[i * 6] - tmp[i * 6 + 2]) / STRIP));
    const k1 = i => Math.min(strips - 1, Math.floor((tmp[i * 6] + tmp[i * 6 + 2]) / STRIP));
    let total = 0;
    for (let i = 0; i < n; i++) {
      A[i * 4] = tmp[i * 6]; A[i * 4 + 1] = tmp[i * 6 + 1]; A[i * 4 + 2] = tmp[i * 6 + 2]; A[i * 4 + 3] = tmp[i * 6 + 3];
      B[i * 4] = tmp[i * 6 + 4]; B[i * 4 + 1] = tmp[i * 6 + 5];
      for (let k = k0(i), e = k1(i); k <= e; k++) { C[k]++; total++; }
    }
    const rows = Math.max(1, Math.ceil(total / 4096));
    if (!s.idx || s.idx.length < rows * 4096) s.idx = new Float32Array(rows * 4096 * 2);
    let o = 0;
    for (let k = 0; k < strips; k++) { st[k * 4] = o; st[k * 4 + 1] = C[k]; o += C[k]; C[k] = st[k * 4]; }
    for (let i = 0; i < n; i++) for (let k = k0(i), e = k1(i); k <= e; k++) s.idx[C[k]++] = i;
    gl.bindTexture(gl.TEXTURE_2D, s.puffs);
    if (n) {
      gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, n, 1, gl.RGBA, gl.FLOAT, A, 0);
      gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 1, n, 1, gl.RGBA, gl.FLOAT, B, 0);
    }
    // the strip table and the index list, grown when they must be, else
    // written over in place
    if (!s.strips || s.stripN !== strips) { if (s.strips) gl.deleteTexture(s.strips); s.strips = tex(strips, 1, gl.RGBA32F, gl.RGBA, gl.FLOAT, st.subarray(0, strips * 4)); s.stripN = strips; }
    else { gl.bindTexture(gl.TEXTURE_2D, s.strips); gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, strips, 1, gl.RGBA, gl.FLOAT, st, 0); }
    if (!s.index || s.indexRows < rows) { if (s.index) gl.deleteTexture(s.index); s.indexRows = rows * 2; s.index = tex(4096, s.indexRows, gl.R32F, gl.RED, gl.FLOAT, null); }
    gl.bindTexture(gl.TEXTURE_2D, s.index);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, 4096, rows, gl.RED, gl.FLOAT, s.idx, 0);
    return n;
  }

  // Draw every window this frame. A view is { key, layer, ox and oy (its
  // first column and row, in the layer's cells), w, h, look (layerLook),
  // idle, every }: `idle` skips its passes this
  // frame (a far layer worked one frame in `every`); dt is the frame's
  // seconds of game time, for the fade. Returns where each window is in
  // `canvas`.
  function render(views, t, dt) {
    let H = 0, W = 0;
    for (const v of views) { H += v.h; W = Math.max(W, v.w); }
    if (canvas.width !== W || canvas.height !== H) { canvas.width = W; canvas.height = H; }
    const at = [];
    let y = 0, puffs = 0, uploadMs = 0;
    for (const v of views) {
      const s = windowOf(v.key, v.w, v.h), L = v.look;
      // a far layer that is not due this frame, and has not moved a cell,
      // keeps last frame's picture: its puffs move too little to tell
      const oy = v.oy || 0;
      if (v.idle && !s.fresh && s.ox === v.ox && s.oy === oy) { at.push({ key: v.key, x: 0, y, w: v.w, h: v.h }); y += v.h; continue; }
      const shift = s.ox === null ? 0 : v.ox - s.ox, lift = s.ox === null ? 0 : oy - s.oy;
      const fresh = s.fresh || Math.abs(shift) >= v.w || Math.abs(lift) >= v.h;
      s.ox = v.ox; s.oy = oy;
      const u0 = performance.now();
      puffs += upload(s, v.layer, t, v.ox, oy, v.swell || null);
      uploadMs += performance.now() - u0;
      const a = s.k, b = 1 - s.k;
      // the field and its tiers
      pass(P.field, s.T[b].f, v.w, v.h);
      bind(0, s.puffs); bind(1, s.strips); bind(2, s.index); bind(3, s.T[a].t);
      gl.uniform1i(P.field.u.uPuffs, 0); gl.uniform1i(P.field.u.uStrips, 1); gl.uniform1i(P.field.u.uIndex, 2); gl.uniform1i(P.field.u.uPrev, 3);
      gl.uniform2i(P.field.u.uShift, shift, lift); gl.uniform1i(P.field.u.uFresh, fresh ? 1 : 0);
      gl.uniform1i(P.field.u.uTiers, v.layer.nt);
      gl.uniform1fv(P.field.u.uFill, Array.from({ length: 8 }, (_, j) => { const f = (v.layer.fills || [])[j]; return f === null || f === undefined ? 1e9 : f - oy; }));
      gl.uniform1iv(P.field.u.uLobe, L.lobe); gl.uniform4fv(P.field.u.uLobeAt, L.lobeAt); gl.uniform1f(P.field.u.uLobeMin, L.lobeMin);
      gl.uniform2f(P.field.u.uLightN, L.lightN[0], L.lightN[1]);
      draw();
      // the roles
      pass(P.roles, s.R[0].f, v.w, v.h);
      bind(0, s.T[b].t); gl.uniform1i(P.roles.u.uT, 0);
      gl.uniform1iv(P.roles.u.uLit, L.lit); gl.uniform1iv(P.roles.u.uShade, L.shade); gl.uniform1iv(P.roles.u.uBase, L.base);
      gl.uniform1iv(P.roles.u.uCore, L.core); gl.uniform1iv(P.roles.u.uRow, L.row);
      gl.uniform2f(P.roles.u.uLight, L.light[0], L.light[1]); gl.uniform1i(P.roles.u.uBottom, L.bottom);
      gl.uniform1i(P.roles.u.uLook, CLOUDS_LOOK); gl.uniform2f(P.roles.u.uUnder, CLOUDS_UNDER.share, CLOUDS_UNDER.most);
      draw();
      // the cleanups, in pairs so the last lands where the settle reads: a
      // band a cell too thin can leave another as it goes (CLOUDS_CLEAN)
      gl.useProgram(P.clean.p); gl.uniform1i(P.clean.u.uR, 0); gl.uniform1iv(P.clean.u.uTone, L.tone);
      for (let k = 0; k < 2 * CLOUDS_CLEAN; k++) {
        const from = k % 2, to = 1 - from;
        pass(P.clean, s.R[to].f, v.w, v.h);
        bind(0, s.R[from].t);
        draw();
      }
      // the settle
      pass(P.settle, s.Q[b].f, v.w, v.h);
      bind(0, s.R[0].t); bind(1, s.Q[a].t);
      gl.uniform1i(P.settle.u.uR, 0); gl.uniform1i(P.settle.u.uPrev, 1);
      gl.uniform2i(P.settle.u.uShift, shift, lift); gl.uniform1i(P.settle.u.uFresh, fresh ? 1 : 0);
      draw();
      // the fade
      pass(P.fade, s.D[b].f, v.w, v.h);
      bind(0, s.Q[b].t); bind(1, s.D[a].t);
      gl.uniform1i(P.fade.u.uR, 0); gl.uniform1i(P.fade.u.uPrev, 1);
      gl.uniform2i(P.fade.u.uShift, shift, lift); gl.uniform1i(P.fade.u.uFresh, fresh ? 1 : 0);
      gl.uniform4fv(P.fade.u.uLut, L.lut); gl.uniform1f(P.fade.u.uStep, Math.min(1, (dt * (v.every || 1)) / CLOUDS_FADE_S));
      draw();
      s.k = b; s.fresh = false;
      at.push({ key: v.key, x: 0, y, w: v.w, h: v.h });
      y += v.h;
    }
    // every window into the one canvas
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, W, H);
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(P.blit.p);
    gl.uniform1i(P.blit.u.uCanvasH, H);
    views.forEach((v, i) => {
      const s = windows.get(v.key);
      bind(0, s.D[s.k].t); gl.uniform1i(P.blit.u.uImg, 0);
      gl.uniform2i(P.blit.u.uAt, 0, at[i].y);
      gl.enable(gl.SCISSOR_TEST);
      gl.scissor(0, H - at[i].y - v.h, v.w, v.h);
      draw();
      gl.disable(gl.SCISSOR_TEST);
    });
    return { canvas, at, puffs, uploadMs };
  }
  // A window's tiers, read back (slow; for the checks): -1 open sky.
  function tiersOf(key) {
    const s = windows.get(key), buf = new Uint32Array(s.w * s.h * 4);
    gl.bindFramebuffer(gl.FRAMEBUFFER, s.T[s.k].f);
    gl.readPixels(0, 0, s.w, s.h, gl.RGBA_INTEGER, gl.UNSIGNED_INT, buf);
    const out = new Int8Array(s.w * s.h);
    for (let i = 0; i < out.length; i++) out[i] = (buf[i * 4] & 15) - 1;
    return { w: s.w, h: s.h, tiers: out };
  }
  // A window's tones as drawn (the cleaned roles through the look's tone
  // numbers), read back (slow; for the checks): 0 open sky.
  function tonesOf(key, tone) {
    const s = windows.get(key), buf = new Uint32Array(s.w * s.h * 4);
    gl.bindFramebuffer(gl.FRAMEBUFFER, s.Q[s.k].f);
    gl.readPixels(0, 0, s.w, s.h, gl.RGBA_INTEGER, gl.UNSIGNED_INT, buf);
    const out = new Int8Array(s.w * s.h);
    for (let i = 0; i < out.length; i++) out[i] = buf[i * 4] ? tone[buf[i * 4]] : 0;
    return { w: s.w, h: s.h, tones: out };
  }
  // A window let go of, its textures and framebuffers with it: the yard's
  // front brings clouds and takes them away all session long.
  function forget(key) {
    const s = windows.get(key);
    if (!s) return;
    for (const pair of [s.T, s.R, s.Q, s.D]) for (const x of pair) { gl.deleteFramebuffer(x.f); gl.deleteTexture(x.t); }
    for (const t of [s.puffs, s.strips, s.index]) if (t) gl.deleteTexture(t);
    windows.delete(key);
  }
  return { render, canvas, gl, tonesOf, tiersOf, forget };
}
