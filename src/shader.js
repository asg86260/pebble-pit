// A post-process pass over the finished frame. It is not part of the game.
//
// The yard is drawn to a 2D canvas, the way it always has been. This takes that
// canvas as a texture, runs one fullscreen fragment shader over it, and puts the
// result on a second canvas laid on top. Nothing about how the game draws
// changes; this is a filter held in front of the window.
//
// Loaded only from dev.js, which `main.js` only reaches for under `vite dev`, so
// a production build never sees any of it. That is deliberate: the upload is a
// whole screen of pixels handed to the GPU every frame, which on a phone would
// be the most expensive thing in the frame by some distance, and none of these
// looks has earned its way into the game yet.
//
// --- one shader, ten dials ---------------------------------------------------
// Every look is a *stack*, not a choice: a television is curvature and a shadow
// mask and scanlines and a fringe, and picking one of those from a list is not
// the same as being able to have a little of each. So each effect is a function
// with an amount of its own, they all live in one program, and one at zero costs
// a branch that is never taken. What you are tuning is a mix.
//
// --- on what suits this game ------------------------------------------------
// The television dials -- curve, mask, scanlines, aberration, bloom -- are built
// for bright things on a dark screen in a dark room. This game is black shapes
// on white paper, and the difference is not a matter of taste:
//
//   bloom       white cannot get brighter, so there is nothing to bloom. It can
//               only smudge the black, which is not what bloom is for.
//   aberration  black-on-white fringes every edge red and cyan. The whole pixel
//               discipline here exists to stop edges going grey or fringed, and
//               colour in this game means a thing a site gave up.
//   scanlines   over a white page, they are grey stripes across the picture.
//
// In small amounts that is not fatal, and small amounts are the point of a dial.
// The press dials -- grain, bleed, halftone, vignette, plates -- are the same
// pipeline pointed at what this game actually is: paper, ink, and a press.

const canvas = document.createElement('canvas');
canvas.id = 'fx';
canvas.style.cssText = 'position:fixed;left:0;top:0;z-index:1;pointer-events:none';
canvas.hidden = true;
document.body.appendChild(canvas);

const gl = canvas.getContext('webgl', { alpha: false, antialias: false, depth: false });

const VERT = `
attribute vec2 p;
varying vec2 uv;
void main() {
  // Flipped here rather than on the way in. A canvas has its origin at the top
  // and a texture has it at the bottom, and the usual answer -- asking WebGL to
  // flip the image while it uploads it -- makes the driver walk the whole
  // picture a row at a time on the way past, every frame. Turning the one
  // coordinate over costs nothing at all.
  uv = vec2(p.x, -p.y) * 0.5 + 0.5;
  gl_Position = vec4(p, 0.0, 1.0);
}`;

// The dials, in the order they are applied. Order is not a detail: the glass
// bends the picture before anything is sampled off it, the ink spreads before
// the paper it is on has a texture, and the edge of the page falls off last of
// all because it is the light in the room rather than anything on the sheet.
export const DIALS = [
  { key: 'curve', max: 2, of: 'tube' },
  { key: 'aberration', max: 2, of: 'tube' },
  { key: 'bloom', max: 2, of: 'tube' },
  { key: 'bleed', max: 1, of: 'press' },
  { key: 'halftone', max: 1, of: 'press' },
  { key: 'plates', max: 3, of: 'press' },
  { key: 'scanlines', max: 1, of: 'tube' },
  { key: 'mask', max: 1, of: 'tube' },
  { key: 'grain', max: 2, of: 'press' },
  { key: 'vignette', max: 2, of: 'press' }
];

// Where it starts. A hair of fringe and a whisper of scanline: enough that the
// page is coming off a screen rather than out of a printer, and not enough to
// argue with a picture made of whole black pixels.
export const DEFAULTS = { scanlines: 0.2, aberration: 0.1 };

const FRAG = `
precision highp float;
varying vec2 uv;
uniform sampler2D tex;
uniform vec2 res;
uniform float cell;   // device pixels per cell: the unit this game is built in
uniform float time;
${DIALS.map(d => `uniform float a_${d.key};`).join('\n')}

vec3 tap(vec2 at) { return texture2D(tex, at).rgb; }
float grey(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

// The glass bulges. Everything sampled after this is sampled through it.
vec2 fx_curve(vec2 at, float a) {
  vec2 c = at * 2.0 - 1.0;
  c *= 1.0 + a * 0.08 * dot(c, c);
  return c * 0.5 + 0.5;
}

// The three colours arrive at slightly different places, further out from the
// middle. Kept in device pixels rather than in a fraction of the screen, so it
// is a fringe of a fixed width and not one that grows with the window.
vec3 fx_aberration(vec2 at, vec3 col, float a) {
  vec2 off = (at - 0.5) * a * 2.4 * cell / res;
  return vec3(tap(at + off).r, col.g, tap(at - off).b);
}

// Bright things spill light into what is beside them. There is nothing here
// brighter than the page, so what it finds to spill is the page itself.
vec3 fx_bloom(vec2 at, vec3 col, float a) {
  vec3 sum = vec3(0.0);
  for (int y = -3; y <= 3; y++)
    for (int x = -3; x <= 3; x++)
      sum += max(vec3(0.0), tap(at + vec2(float(x), float(y)) * cell * 0.5 / res) - 0.75);
  return min(vec3(1.0), col + sum / 49.0 * a * 4.0);
}

// Ink spreads into the paper. A minimum over the neighbours grows the black by a
// hair, so every shape gains a little weight.
vec3 fx_bleed(vec2 at, vec3 col, float a) {
  vec2 s = cell * 0.34 / res;
  for (int y = -1; y <= 1; y++)
    for (int x = -1; x <= 1; x++)
      col = min(col, mix(vec3(1.0), tap(at + vec2(float(x), float(y)) * s), a));
  return col;
}

// Grey is not a shade of ink, it is a size of dot. The one dial that agrees with
// the game: the shades already mean how deep the rock was, and this says it in
// dots the size of the lattice everything else is built on.
vec3 fx_halftone(vec2 at, vec3 col, float a) {
  float s = max(2.0, cell * 0.7);
  vec2 q = fract(at * res / s) - 0.5;
  float on = step(length(q) * 2.0, sqrt(1.0 - grey(col)) * 1.15);
  return mix(col, vec3(1.0 - on), a);
}

// A press whose colour plate is out of register by a cell or so. It touches only
// what is already coloured -- the finds, the one thing a colour is allowed to
// mean anything about here -- and leaves every grey exactly where it was.
vec3 fx_plates(vec2 at, vec3 col, float a) {
  vec3 off = tap(at + vec2(cell, -cell * 0.5) * a / res);
  float chroma = max(max(off.r, off.g), off.b) - min(min(off.r, off.g), off.b);
  return chroma > 0.08 ? min(col, off) : col;
}

// Every other line of the tube is dark.
vec3 fx_scanlines(vec2 at, vec3 col, float a) {
  return col * (1.0 - a * 0.28 * step(1.0, mod(floor(at.y * res.y), 2.0)));
}

// And every third column of it is a different phosphor.
vec3 fx_mask(vec2 at, vec3 col, float a) {
  float m = mod(floor(at.x * res.x), 3.0);
  return col * (1.0 - a * 0.12 * step(1.0, m) * step(m, 1.5));
}

// The page is not a flat white: it has a tooth, and it is not blue-white either.
vec3 fx_grain(vec2 at, vec3 col, float a) {
  float n = hash(floor(at * res / max(1.0, cell * 0.34)) + floor(time * 8.0));
  return (col - a * 0.06 * (n - 0.45)) * mix(vec3(1.0), vec3(1.0, 0.996, 0.985), a);
}

// The edge of a lit page falls away.
vec3 fx_vignette(vec2 at, vec3 col, float a) {
  vec2 c = (at - 0.5) * vec2(res.x / res.y, 1.0);
  return col * (1.0 - a * 0.5 * smoothstep(0.35, 0.95, length(c)));
}

void main() {
  vec2 at = uv;
  if (a_curve > 0.0) {
    at = fx_curve(at, a_curve);
    if (at.x < 0.0 || at.x > 1.0 || at.y < 0.0 || at.y > 1.0) {
      gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);       // off the tube
      return;
    }
  }
  vec3 col = tap(at);
  if (a_aberration > 0.0) col = fx_aberration(at, col, a_aberration);
  if (a_bloom > 0.0) col = fx_bloom(at, col, a_bloom);
  if (a_bleed > 0.0) col = fx_bleed(at, col, a_bleed);
  if (a_halftone > 0.0) col = fx_halftone(at, col, a_halftone);
  if (a_plates > 0.0) col = fx_plates(at, col, a_plates);
  if (a_scanlines > 0.0) col = fx_scanlines(at, col, a_scanlines);
  if (a_mask > 0.0) col = fx_mask(at, col, a_mask);
  if (a_grain > 0.0) col = fx_grain(at, col, a_grain);
  if (a_vignette > 0.0) col = fx_vignette(at, col, a_vignette);
  gl_FragColor = vec4(col, 1.0);
}`;

// A few mixes worth starting from, so "what does a television look like" is one
// click rather than five sliders found by trial.
export const PRESETS = {
  off: {},
  paper: { grain: 0.8, bleed: 0.25, vignette: 0.5 },
  press: { halftone: 0.7, bleed: 0.2, grain: 0.5, plates: 1 },
  tube: { curve: 1, scanlines: 0.6, mask: 1, aberration: 0.5, vignette: 0.8 },
  glass: { ...DEFAULTS }
};

let prog = null;
let quad = null;
let texture = null;
let texW = 0, texH = 0;      // what the texture on the card is currently sized for
const amount = {};
for (const d of DIALS) amount[d.key] = DEFAULTS[d.key] || 0;

export const amounts = () => ({ ...amount });
export const anyOn = () => DIALS.some(d => amount[d.key] > 0);

export function setAmount(key, v) {
  if (!(key in amount)) return;
  amount[key] = v;
  canvas.hidden = !anyOn();
}

export function setAll(mix) {
  for (const d of DIALS) amount[d.key] = mix[d.key] || 0;
  canvas.hidden = !anyOn();
}

function build() {
  if (prog) return prog;
  const make = (type, src) => {
    const sh = gl.createShader(type);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      console.warn('fx:', gl.getShaderInfoLog(sh));
      return null;
    }
    return sh;
  };
  const vs = make(gl.VERTEX_SHADER, VERT);
  const fs = make(gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) return null;
  const p = gl.createProgram();
  gl.attachShader(p, vs);
  gl.attachShader(p, fs);
  gl.bindAttribLocation(p, 0, 'p');
  gl.linkProgram(p);
  prog = {
    p,
    tex: gl.getUniformLocation(p, 'tex'),
    res: gl.getUniformLocation(p, 'res'),
    cell: gl.getUniformLocation(p, 'cell'),
    time: gl.getUniformLocation(p, 'time'),
    dial: Object.fromEntries(DIALS.map(d => [d.key, gl.getUniformLocation(p, `a_${d.key}`)]))
  };
  return prog;
}

// One pass, at the end of a frame. `src` is the game's own canvas.
export function present(src, cellPx) {
  if (!gl || !anyOn()) return;
  const rec = build();
  if (!rec) return;

  if (canvas.width !== src.width || canvas.height !== src.height) {
    canvas.width = src.width;
    canvas.height = src.height;
  }
  canvas.style.width = src.style.width;
  canvas.style.height = src.style.height;

  if (!quad) {
    quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.bufferData(gl.ARRAY_BUFFER,
                  new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  }
  if (!texture) {
    texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    // NEAREST, and no mipmaps: this game is a lattice of whole pixels, and a
    // filter that smears them is the one thing none of these dials may do by
    // accident. Whatever blurring happens has to be a shader saying so.
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  }

  gl.bindTexture(gl.TEXTURE_2D, texture);
  // Filled rather than made, once the size is settled. `texImage2D` every frame
  // is a fresh allocation of the whole picture's worth of texture memory sixty
  // times a second, with the old one left for the driver to reclaim;
  // `texSubImage2D` writes into the one that is already there. The two look
  // identical and one of them is the frame's largest single piece of work.
  if (texW !== src.width || texH !== src.height) {
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, src);
    texW = src.width;
    texH = src.height;
  } else {
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl.RGB, gl.UNSIGNED_BYTE, src);
  }

  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.useProgram(rec.p);
  gl.uniform1i(rec.tex, 0);
  gl.uniform2f(rec.res, canvas.width, canvas.height);
  gl.uniform1f(rec.cell, cellPx);
  gl.uniform1f(rec.time, performance.now() / 1000);
  for (const d of DIALS) gl.uniform1f(rec.dial[d.key], amount[d.key]);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
}
