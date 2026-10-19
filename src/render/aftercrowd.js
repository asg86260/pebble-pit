// Act 3's sky, drawn: God's crowd filling it, God on his tower throne, the
// sermon and the tithe line (docs/mocks/act3-skycrowd-2026-10-18, round 2,
// the owner's vote, with horns and a harder scowl added after it;
// docs/wave-act3-build.md, track B). Every place is after/sky.js's.
//
// The crowd is seven parallax bands from the window's top down to a cloud
// bank over the floor: six far bands of grey cells, palest furthest, and a
// near band of souls with ink rims and eyes on God. It thins soul by soul as
// support rises -- each soul and far cell has its own threshold, the back
// rows first -- and each band sinks as it empties, so the top of the sky
// clears first and God is left alone by the strike. A member walking out is
// a near soul in view inking its rim and fading.
//
// Its life is the sea (one long wave through every band, held steps) and the
// rings: a rally off a sign or a poster, the throne's roar and grumble, each
// running out through every band, its width and jump by the band's rate.
// Those are the drawing's own, read off the act's clock, so nothing of them
// is saved and a reload stands them where they were.
//
// God is a light source on either page: he, his glare, halo, rays and gaze
// are drawn in raw tones (src/ink.js), and only the stone -- the throne's
// back and the tower -- takes the page's map. His rays shorten and fade as
// support rises, gone at the strike.
//
// The frame's cost: each far band is a canvas a texel a cell, its cells'
// opacities written again only when its share of support moves
// (SKY_REDRAW_STEP), drawn as a few column slices a frame; God, his stone,
// the halo, the cloud bank and every standing sign are bitmaps taken once a
// zoom (God once a pose). What is drawn live is the near band's souls, the
// tithe line, the gaze and the bubbles.

import { S } from '../state.js';
import { P, GREY, STRIKE_SHARE, CROWD_X0, CROWD_PITCH, CROWD_NEAR, CROWD_ROW, AFTER_SPEECH_WARN_S,
         SKY_BANDS, SKY_NEAR, SKY_BANK_RATE, SKY_SIGN_RATE, SKY_CLOUDS_AFTER, SKY_CLOUD_DRIFT, SKY_EDGE,
         SKY_THIN, SKY_KEEP_SOFT, SKY_SINK, SKY_SUPPORT_EASE, SKY_REDRAW_STEP, SKY_JOIN,
         SKY_SEA, SKY_RALLY, SKY_ROAR, SKY_GRUMBLE, SKY_RING_W, SKY_RING_LIFT, SKY_RING_STEP,
         GOD_RATE, GOD_GLARE_R, GOD_HALO_R, GOD_SPOKES, GOD_IDLE, GOD_GAZE_HOLD_S,
         AFTER_GAZE_SETTLE_S, AFTER_BURN_S, AFTER_POSTER_FADE_S, SKY_SIGN, SKY_POSTER,
         TITHE_CARRIERS, TITHE_LAP, TITHE_GLARE_R, SKY_DRIFT } from '../config.js';
import { AFTER_JOB } from '../jobs.js';
import { ctx } from './ctx.js';
import { raw, inkOf } from '../ink.js';
import { afterFloor, afterX0, slotX, soulX, overCrowd, crowdX1, stationBox } from '../after/place.js';
import { support, union, speechTarget } from '../after/union.js';
import { skyFrame, layerX, godMid, pullAt, restW } from '../after/sky.js';
import { smoothstep } from '../motion.js';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, k) => a + (b - a) * k;
const frac = v => v - Math.floor(v);
const snap = (v, q) => Math.round(v / q) * q;
const now = () => (S.after ? S.after.t : 0);
function hsh(a, b = 0, c = 0) {
  let h = (a * 374761393 + b * 668265263 + c * 2246822519) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}
function vnoise(x, y, seed) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = smoothstep(x - xi), yf = smoothstep(y - yi);
  return lerp(lerp(hsh(xi, yi, seed), hsh(xi + 1, yi, seed), xf), lerp(hsh(xi, yi + 1, seed), hsh(xi + 1, yi + 1, seed), xf), yf);
}

// --- the frame's camera ---------------------------------------------------------------
// The device pixels a world pixel takes, the window's middle, the zoom over
// the rest frame, and the sky's frame, read once a frame. A rect's edges are
// each put on a whole device pixel, so a stroke stays whole at any zoom.
let K = 1, CX = 0, Z = 1, F = null;
function camFrame() {
  K = (S.zoomShow || S.zoom) * S.dpr; CX = S.camX + S.viewW / 2; F = skyFrame();
  Z = restW() / Math.max(1, S.viewW);
}
const onPx = v => Math.round(v * K) / K;
function rect(x, y, w, h, tone) {
  if (tone != null) ctx.fillStyle = GREY[tone];
  const x0 = Math.round(x * K), y0 = Math.round(y * K);
  const ww = Math.round((x + w) * K) - x0, hh = Math.round((y + h) * K) - y0;
  if (ww > 0 && hh > 0) ctx.fillRect(x0 / K, y0 / K, ww / K, hh / K);
}
// A light: the same tone on either page.
function lit(x, y, w, h, tone) { ctx.fillStyle = raw(GREY[tone]); rect(x, y, w, h); }
function alpha(a, fn) {
  if (a <= 0.001) return;
  const was = ctx.globalAlpha;
  ctx.globalAlpha = was * Math.min(1, a);
  fn();
  ctx.globalAlpha = was;
}
const inView = (x, w) => x + w >= S.camX && x <= S.camX + S.viewW;
function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h));
  return c;
}
// A bitmap painted in world px about its own top left at the frame's device
// scale; `paint(r, lit)` fills mapped and raw rects.
function sprite(w, h, paint) {
  const c = canvas(w * K + 1, h * K + 1), g = c.getContext('2d');
  c.w = w; c.h = h;
  if (!g) return c;
  g.setTransform(1, 0, 0, 1, 0, 0);
  const fill = (x, y, ww, hh) => {
    const x0 = Math.round(x * K), y0 = Math.round(y * K);
    const a = Math.round((x + ww) * K) - x0, b = Math.round((y + hh) * K) - y0;
    if (a > 0 && b > 0) g.fillRect(x0, y0, a, b);
  };
  paint((x, y, ww, hh, tone) => { g.fillStyle = GREY[tone]; fill(x, y, ww, hh); },
        (x, y, ww, hh, tone) => { g.fillStyle = raw(GREY[tone]); fill(x, y, ww, hh); });
  return c;
}
const blit = (pic, x, y) => ctx.drawImage(pic, onPx(x), onPx(y), pic.width / K, pic.height / K);

// --- support, read off the sim ---------------------------------------------------------------
// The share of the way to the strike won (1 at STRIKE_SHARE), eased so a
// band empties smoothly; snapped on a new act or a reload.
const shown = { after: null, s: 0, lastT: null, members: 0, joins: new Map(), tithe: 0 };
const share = () => clamp(support() / STRIKE_SHARE, 0, 1);
export const skyShare = () => shown.s;
function stepShown() {
  const A = S.after, t = now();
  if (shown.after !== A) {
    shown.after = A; shown.s = share(); shown.lastT = t; shown.members = union(); shown.joins.clear(); shown.tithe = 0;
  }
  const gap = t - shown.lastT, dt = clamp(gap, 0, 0.25);
  shown.lastT = t;
  const want = share();
  // Time passed undrawn (the camera elsewhere, a jump of the clock): caught up.
  if (gap > 1) shown.s = want;
  shown.s += clamp(want - shown.s, -dt * SKY_SUPPORT_EASE, dt * SKY_SUPPORT_EASE);
  return dt;
}
// God's glare: full at the start, dimming as support rises, gone at the strike.
export const glareAlpha = () => clamp(1 - support() / STRIKE_SHARE, 0, 1);
// His rays: shorter and fainter as support rises, none at the strike.
export const raysLeft = () => 1 - shown.s;

// A band's share emptied: band k starts at SKY_THIN.from + step a band.
function bandL(k) {
  const L = clamp((shown.s - SKY_THIN.from - k * SKY_THIN.step) / SKY_THIN.span, 0, 1);
  return k === SKY_BANDS.length ? Math.min(SKY_THIN.nearCap, L) : L;
}
const thrOf = (h, u) => 0.75 * h + 0.25 * u;
const keep = (thr, L) => clamp((thr + SKY_KEEP_SOFT - L * (1 + SKY_KEEP_SOFT)) / SKY_KEEP_SOFT, 0, 1);
const sinkOf = (k, L) => L * SKY_SINK * (F.bank - F.tops[k]);
const sea = (xl, k) => Math.round(Math.sin(xl / SKY_SEA.len - now() * SKY_SEA.hz + k * SKY_SEA.lag) * SKY_SEA.amp);

// --- the rings: rallies, roars, grumbles ---------------------------------------------------------
// Each a fact of the clock: the n-th of each falls at a time read off n, so
// a ring running is the same ring after a reload. None while the speech is
// warned: the sky holds its breath.
const rallyAt = n => n * 7.5 + (SKY_RALLY.every[1] - SKY_RALLY.every[0]) * (hsh(n, 9) - 0.5);
const roarAt = n => n * SKY_ROAR.every + 2.5;
const GRUMBLE_MID = (SKY_GRUMBLE.every[0] + SKY_GRUMBLE.every[1]) / 2;
const grumbleAt = n => n * GRUMBLE_MID + (SKY_GRUMBLE.every[1] - SKY_GRUMBLE.every[0]) * 0.5 * (hsh(n, 8) - 0.5);
const quiet = at => {
  const sp = S.after?.speech;
  return !!sp && !!sp.target && at >= sp.next - AFTER_SPEECH_WARN_S && at < sp.next;
};
// What stands for a rally to start at: the signs and posters not burning, by id.
const standingThings = () => [...S.after.signs.filter(q => q.burnt == null).map(q => ({ kind: 'sign', q })),
                              ...S.after.posters.filter(q => q.burnt == null && q.torn == null).map(q => ({ kind: 'poster', q }))]
  .sort((a, b) => a.q.id - b.q.id);
function eventsNow() {
  const t = now(), out = { rallies: [], roars: [] };
  const things = standingThings();
  if (things.length) for (let n = Math.floor((t - SKY_RALLY.life) / 7.5) - 1; n <= Math.floor(t / 7.5) + 1; n++) {
    const at = rallyAt(n);
    if (at > t || t - at >= SKY_RALLY.life || at < 0 || quiet(at)) continue;
    out.rallies.push({ at, thing: things[Math.floor(hsh(n, 5) * things.length)] });
  }
  for (let n = Math.max(0, Math.floor((t - SKY_ROAR.life) / SKY_ROAR.every) - 1); roarAt(n) <= t; n++) {
    const at = roarAt(n);
    if (t - at < SKY_ROAR.life && !quiet(at)) out.roars.push({ at, kind: 'roar', g: ROARS[Math.floor(hsh(n, 2) * 4)] });
  }
  for (let n = Math.max(0, Math.floor((t - SKY_ROAR.life) / GRUMBLE_MID) - 1); grumbleAt(n) <= t; n++) {
    const at = grumbleAt(n);
    if (at >= 0 && t - at < SKY_GRUMBLE.bubble + 2 && !quiet(at)) out.roars.push({ at, kind: 'grumble', g: GRUMBLES[Math.floor(hsh(n, 4) * 3)] });
  }
  // The speech's own roar, a bolt, as it falls.
  const b = S.after.speech?.burnt;
  if (b && t >= b.at - 0.6 && t - (b.at - 0.6) < SKY_ROAR.life) out.roars.push({ at: b.at - 0.6, kind: 'roar', g: ROARS[4], big: true });
  // ...and before it has fallen, the moment it will.
  const sp = S.after.speech;
  if (sp && sp.target && t >= sp.next - 0.6 && t < sp.next) out.roars.push({ at: sp.next - 0.6, kind: 'roar', g: ROARS[4], big: true });
  return out;
}
let EV = { rallies: [], roars: [] }, RINGS = [];
function ringsNow() {
  const t = now(), out = [];
  for (const r of EV.rallies) {
    const s = thingAt(r.thing.kind, r.thing.q);
    out.push({ kind: 'rally', x: s.x + s.w / 2, y: s.y + s.h / 2, rad: SKY_RALLY.speed * (t - r.at) });
  }
  const foot = godFoot();
  for (const r of EV.roars) {
    const big = r.kind === 'roar', rad = (big ? SKY_ROAR.speed : SKY_GRUMBLE.speed) * (t - r.at);
    if (!big && rad > SKY_GRUMBLE.reach) continue;
    out.push({ kind: big ? 'roar' : 'grumble', x: foot.x, y: foot.y, rad });
  }
  return out;
}
const ringW = rate => SKY_RING_W[0] + SKY_RING_W[1] * rate;
const ringLift = (rate, p) => Math.max(p, snap(SKY_RING_LIFT[0] + SKY_RING_LIFT[1] * rate, p));
// What the rings do at one near soul: raised arms, a duck, or a short lift.
function ringsAt(x, y, rate) {
  let lift = 0, arms = false, duck = false;
  for (const r of RINGS) {
    const w = ringW(rate) * (r.kind === 'grumble' ? 0.5 : 1);
    if (Math.abs(Math.hypot(x - r.x, y - r.y) - r.rad) >= w) continue;
    if (r.kind === 'rally') { arms = true; lift = -ringLift(rate, 2); }
    else if (r.kind === 'roar') { duck = true; lift = ringLift(rate, 2) / 2; }
    else if (!arms && !duck) lift = -2;
  }
  return { lift, arms, duck };
}

// --- the far bands: a canvas each, a texel a cell ---------------------------------------------------
// A band's layer x runs from where the left edge of the furthest-left window
// shows it to where the right edge of the furthest-right one does.
const layerSpan = rate => {
  const half = F.W / 2;
  return [F.c0 - half - (F.c0 - F.XR) * (1 - rate) - SKY_EDGE, F.c1 + half - (F.c1 - F.XR) * (1 - rate) + SKY_EDGE];
};
const PALETTE = () => GREY.map(c => { const m = inkOf(c); return parseInt(String(m).slice(1, 3), 16); });
let bands = [];
const drawn = { souls: 0, cells: 0, rewrites: 0, slices: 0 };
let rewrote = false;
const BUCKETS = 1024;
const bucketOf = t => Math.min(BUCKETS - 1, Math.floor(t * BUCKETS));
export const crowdDrawn = () => ({ ...drawn, joins: shown.joins.size, bands: bands.map(b => b && b.L) });
function bandCanvas(k) {
  const b = SKY_BANDS[k];
  let bc = bands[k];
  if (!bc) {
    const [x0, x1] = layerSpan(b.rate);
    const tw = Math.ceil((x1 - x0) / b.q), th = Math.ceil((F.bank - F.tops[k] + 8 * b.p) / b.q);
    const cv = canvas(tw, th), g = cv.getContext('2d');
    const cols = Math.ceil(tw / b.cp), rows = Math.ceil(th / b.cp);
    const thr = new Float32Array(cols * rows), tone = new Uint8Array(cols * rows);
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      const n = j * cols + i;
      if (j === 0 && hsh(i, 1, k) < 0.4) { thr[n] = -1; continue; }      // a lumpy top of heads
      thr[n] = thrOf(hsh(i, j, k + 60), j / rows);
      const r = hsh(i, j, k + 20);
      tone[n] = clamp(Math.round(b.tone + (j < 2 ? 1.2 : 0) + (r < 0.09 ? -1 : r > 0.91 ? 1 : 0)), 0, 10);
    }
    // The cells by threshold, in buckets, so a move of support touches only
    // the cells whose opacity it can change.
    const start = new Uint32Array(BUCKETS + 1);
    for (let n = 0; n < thr.length; n++) if (thr[n] >= 0) start[bucketOf(thr[n]) + 1]++;
    for (let i = 0; i < BUCKETS; i++) start[i + 1] += start[i];
    const order = new Uint32Array(start[BUCKETS]), fill = start.slice(0, BUCKETS);
    for (let n = 0; n < thr.length; n++) if (thr[n] >= 0) order[fill[bucketOf(thr[n])]++] = n;
    bc = bands[k] = { cv, g, img: g && g.createImageData ? g.createImageData(tw, th) : null, x0, tw, th, cols, rows, thr, tone,
                      start, order, al: new Uint8Array(cols * rows), L: -1, kept: 0 };
  }
  // One band's cells written a frame at most, a new one's always: while
  // support moves, the bands take turns rather than all landing on one frame.
  const L = snap(bandL(k), SKY_REDRAW_STEP);
  if (bc.L !== L && (bc.L < 0 || !rewrote)) {
    rewrote = true;
    const soft = SKY_KEEP_SOFT, full = bc.L < 0;
    const lo = full ? 0 : Math.min(bc.L, L) * (1 + soft) - soft, hi = full ? 1 : Math.max(bc.L, L) * (1 + soft);
    const b0 = bucketOf(Math.max(0, lo)), b1 = bucketOf(Math.min(1, hi));
    const pal = PALETTE(), px = bc.img ? new Uint32Array(bc.img.data.buffer) : null;
    for (let o = bc.start[b0]; o < bc.start[b1 + 1]; o++) {
      const n = bc.order[o], byte = Math.round(keep(bc.thr[n], L) * 255);
      if (byte === bc.al[n]) continue;
      bc.kept += (byte - bc.al[n]) / 255;
      bc.al[n] = byte;
      if (!px) continue;
      const i = n % bc.cols, j = (n - i) / bc.cols, gv = pal[bc.tone[n]];
      const word = byte ? ((byte << 24) | (gv << 16) | (gv << 8) | gv) >>> 0 : 0;
      const ox = i * b.cp + (b.st && (j % 2) ? b.st : 0), oy = j * b.cp;
      for (let y = 0; y < b.hs && oy + y < bc.th; y++) {
        const row = (oy + y) * bc.tw;
        for (let x = 0; x < b.hs; x++) if (ox + x < bc.tw) px[row + ox + x] = word;
      }
    }
    if (px) bc.g.putImageData(bc.img, 0, 0);
    bc.L = L;
    drawn.rewrites++;
  }
  return bc;
}
function drawBand(k) {
  const b = SKY_BANDS[k], L = bandL(k);
  const a = 1 - smoothstep((L - 0.85) / 0.15);
  if (a <= 0) return;
  const bc = bandCanvas(k), img = bc.cv;
  drawn.cells += bc.kept;
  const yTop = F.tops[k] + snap(sinkOf(k, L), b.p);
  const colPx = b.cp * b.q, shift = (CX - F.XR) * (1 - b.rate);
  const toCol = wx => (wx - shift - bc.x0) / colPx;
  const i0 = Math.max(0, Math.floor(toCol(S.camX)) - 1), i1 = Math.min(Math.floor(bc.tw / b.cp) - 1, Math.ceil(toCol(S.camX + S.viewW)) + 1);
  if (F.bank + 2 * b.p - yTop <= 0 || i1 < i0) return;
  alpha(a, () => {
    // The sea: column runs sharing a step, each one slice.
    let start = i0, off = null;
    const flush = end => {
      if (off == null) return;
      const y = yTop + off * b.p, hh = F.bank + 2 * b.p - y, sh = Math.min(hh / b.q, bc.th);
      if (hh > 0) {
        ctx.drawImage(img, start * b.cp, 0, (end - start) * b.cp, sh, onPx(bc.x0 + shift + start * colPx), onPx(y), (end - start) * colPx, sh * b.q);
        drawn.slices++;
      }
    };
    for (let i = i0; i <= i1 + 1; i++) {
      const o = i <= i1 ? sea(bc.x0 + i * colPx, k) : null;
      if (o !== off) { flush(i); start = i; off = o; }
    }
    // The rings: inside each the crowd jumps and inks (a rally) or ducks and
    // pales (a roar), slice by slice, in steps of this band's own size.
    const step = SKY_RING_STEP / Z;
    for (const r of RINGS) {
      const w = ringW(b.rate) * (r.kind === 'grumble' ? 0.5 : 1);
      const lift = (r.kind === 'rally' ? -1 : r.kind === 'roar' ? 0.6 : -0.5) * ringLift(b.rate, b.p);
      const tone = r.kind === 'rally' ? 10 : 0, oa = (r.kind === 'rally' ? 0.3 : r.kind === 'roar' ? 0.35 : 0.15) * (1 - L);
      if (r.rad - w > Math.hypot(S.viewW, S.viewH) * 1.5) continue;
      const lo = Math.max(S.camX, Math.floor((r.x - r.rad - w) / step) * step), hi = Math.min(S.camX + S.viewW, r.x + r.rad + w);
      for (let sx = lo; sx < hi; sx += step) {
        const dx = Math.abs(sx + step / 2 - r.x);
        if (dx >= r.rad + w) continue;
        const ho = Math.sqrt((r.rad + w) ** 2 - dx * dx), hiR = dx < r.rad - w ? Math.sqrt((r.rad - w) ** 2 - dx * dx) : 0;
        for (const [s0, s1] of [[r.y - ho, r.y - hiR], [r.y + hiR, r.y + ho]]) {
          const y0 = Math.max(s0, yTop), y1 = Math.min(s1, F.bank);
          if (y1 - y0 < 2) continue;
          const lx = sx - shift - bc.x0, ly = y0 - yTop;
          ctx.drawImage(img, lx / b.q, ly / b.q, step / b.q, (y1 - y0) / b.q, onPx(sx), onPx(y0 + lift), step, y1 - y0);
          alpha(oa, () => rect(sx, y0 + lift, step, y1 - y0, tone));
          drawn.slices++;
        }
      }
    }
  });
}

// Thin cloud strips between bands: broken billows of near-white cells.
function drawCloudStrip(k) {
  const y = F.tops[k + 1] - P, rate = (SKY_BANDS[k].rate + (SKY_BANDS[k + 1] || SKY_NEAR).rate) / 2;
  const drift = now() * (SKY_CLOUD_DRIFT + k), shift = (CX - F.XR) * (1 - rate);
  const i0 = Math.floor((S.camX - shift + drift) / P) - 1, i1 = Math.ceil((S.camX + S.viewW - shift + drift) / P) + 1;
  alpha(0.9, () => {
    for (let i = i0; i <= i1; i++) {
      const n = vnoise(i / 14, k, 50);
      if (n < 0.42) continue;
      const tall = P * Math.min(3, 1 + Math.floor((n - 0.42) * 8 + hsh(i, k, 52)));
      for (let j = 0; j < tall; j += P) rect(i * P - drift + shift, y - tall + j + P, P, P, hsh(i, j + k, 51) < 0.3 ? 1 : 0);
    }
  });
}

// --- the near band, soul by soul ------------------------------------------------------------------
// The near band's rows, top to bank, and whether a soul (col, row) is one
// joining: inked, held, fading out.
const nearRows = () => Math.ceil((F.bank - F.tops[SKY_BANDS.length] + 10) / SKY_NEAR.rowp);
const nearKey = (col, row) => col * 64 + row;
function nearAt(col, row, L, rows) {
  const b = SKY_NEAR, sink = snap(sinkOf(SKY_BANDS.length, L), 2), shift = (CX - F.XR) * (1 - b.rate);
  const xl = afterX0() - SKY_EDGE + col * b.pitch + (row % 2 ? b.pitch / 2 : 0);
  return { xl, x: xl + shift, y: F.tops[SKY_BANDS.length] + sink + row * b.rowp, thr: thrOf(hsh(col, row, 67), row / rows) };
}
// A member walked out since the last frame: a near soul in view, standing
// whole, the next its threshold would take, inks and fades.
function pickJoins() {
  const n = union(), gained = n - shown.members;
  shown.members = n;
  if (gained <= 0 || S.view !== 'after') return;
  const b = SKY_NEAR, L = bandL(SKY_BANDS.length), rows = nearRows(), shift = (CX - F.XR) * (1 - b.rate);
  const c0 = Math.ceil((S.camX + P * 10 - shift - afterX0() + SKY_EDGE) / b.pitch), c1 = Math.floor((S.camX + S.viewW - P * 10 - shift - afterX0() + SKY_EDGE) / b.pitch);
  if (c1 <= c0) return;
  for (let k = 0; k < Math.min(gained, SKY_JOIN.most); k++) {
    let best = null;
    for (let tries = 0; tries < 24; tries++) {
      const col = c0 + Math.floor(hsh(n, k, tries) * (c1 - c0)), row = Math.floor(hsh(n, k, tries + 50) * Math.max(1, rows - 1));
      const key = nearKey(col, row);
      if (shown.joins.has(key)) continue;
      const s = nearAt(col, row, L, rows);
      if (keep(s.thr, L) < 0.95) continue;
      if (!best || s.thr < best.thr) best = { key, thr: s.thr };
    }
    if (best) shown.joins.set(best.key, now());
  }
}
function joinFade(key) {
  const t0 = shown.joins.get(key);
  if (t0 == null) return { a: 1, inked: false };
  const tau = now() - t0;
  return { a: tau < SKY_JOIN.hold ? 1 : clamp(1 - (tau - SKY_JOIN.hold) / SKY_JOIN.fade, 0, 1), inked: true };
}
function drawNearSouls() {
  const b = SKY_NEAR, L = bandL(SKY_BANDS.length), rows = nearRows(), shift = (CX - F.XR) * (1 - b.rate);
  const c0 = Math.floor((S.camX - shift - afterX0() + SKY_EDGE) / b.pitch) - 1, c1 = Math.ceil((S.camX + S.viewW - shift - afterX0() + SKY_EDGE) / b.pitch) + 1;
  const gx = godMid(CX), t = now(), s = b.soul;
  let count = 0;
  for (let row = 0; row < rows; row++) for (let col = c0; col <= c1; col++) {
    const p = nearAt(col, row, L, rows);
    if (p.y > F.bank + P) continue;
    const j = joinFade(nearKey(col, row));
    const a = keep(p.thr, L) * j.a;
    if (a <= 0.01) continue;
    const rg = ringsAt(p.x, p.y, b.rate);
    const x = p.x + Math.round(Math.sin(p.xl / SKY_SEA.swayLen - t * SKY_SEA.swayHz)) * 2;
    const y = p.y + sea(p.xl, SKY_BANDS.length) * 2 + rg.lift;
    if (!inView(p.x - 4, s + 8)) continue;   // culled by its column, sway and all, so a soul at the edge is in or out for good
    const tone = hsh(col, row, 68) < 0.3 ? 1 : 0, look = p.x < gx - 40 ? 1 : p.x > gx + 40 ? -1 : 0;
    count++;
    alpha(a, () => {
      rect(x, y, s, s, j.inked ? 10 : 8);
      rect(x + 2, y + 2, s - 4, s - 4, tone);
      if (rg.duck) { rect(x + 3, y + 5, 2, 1, 8); rect(x + 7, y + 5, 2, 1, 8); }
      else { rect(x + 3 + look, y + 4, 2, 2, 8); rect(x + 7 + look, y + 4, 2, 2, 8); }
      if (rg.arms) { rect(x - 2, y - 8, 2, 8, 10); rect(x + s, y - 8, 2, 8, 10); }
    });
  }
  drawn.souls = count;
}

// --- God ---------------------------------------------------------------------------------------------
// God-cells about his square's top left; every pose held, never tweened.
function godPose() {
  const t = now();
  const breath = frac(t / GOD_IDLE.breath_s) < 0.45 ? 1 : 0;
  const dp = frac(t / GOD_IDLE.drum_s) * GOD_IDLE.drum_s, finger = dp < 0.9 ? Math.floor(dp / 0.15) % 3 : -1;
  const cp = ((t - 4) % GOD_IDLE.crown_s + GOD_IDLE.crown_s) % GOD_IDLE.crown_s;
  let tilt = 0, hand = 0;
  if (cp < 3) tilt = 1;
  else if (cp < 3.3) { tilt = 1; hand = 1; }
  else if (cp < 3.7) hand = 2;
  else if (cp < 4.0) hand = 1;
  return { breath, finger, tilt, hand };
}
const GC = () => F.gc;
// His square's top left, world.
const godX = () => godMid(CX) - 9 * GC();
const godFoot = () => ({ x: godMid(CX), y: F.gy0 + 28 * GC() });
const cache = { key: '', stone: null, halo: null, poses: new Map(), signs: new Map(), bank: null };
function freshCaches() {
  const key = `${K}|${F.gc}|${F.top}|${F.W}`;
  if (key === cache.key) return;
  cache.key = key; cache.stone = null; cache.halo = null; cache.poses.clear(); cache.signs.clear(); cache.bank = null;
  bands = [];
}
// The stone: the throne's spiked back, its arms and seat, and the tall slit
// tower down to the cloud bank -- the only part of him that takes the map.
// Painted from 8 cells left of the square and 16 above it.
const STONE_X = -8, STONE_Y = -16;
function stone() {
  if (cache.stone) return cache.stone;
  const c = GC(), towerTo = (F.bank + 20 - F.gy0) / c;
  cache.stone = sprite(34 * c, (towerTo - STONE_Y) * c, (r) => {
    const Fr = (x, y, w, h, tone) => r((x - STONE_X) * c, (y - STONE_Y) * c, w * c, h * c, tone);
    // the tower
    Fr(4, 30, 10, towerTo - 30, 10);
    for (let y = 30; y < towerTo; y++) for (let x = 5; x < 13; x++) Fr(x, y, 1, 1, hsh(x, y, 70) < 0.3 ? 5 : 6);
    for (let y = 34; y < towerTo; y += 7) Fr(8, y, 2, 3, 10);
    Fr(1, 30, 16, 3, 10); Fr(2, 31, 14, 1, 7);
    // the back, spiked
    const spike = (x, top) => { Fr(x, top, 3, -5 - top, 10); for (let y = top + 1; y < -5; y++) Fr(x + 1, y, 1, 1, 4); };
    [-4, 3, 12, 19].forEach(x => spike(x, -11)); spike(7.5, -15);
    Fr(-4, -6, 26, 34, 10);
    for (let y = -5; y < 27; y++) for (let x = -3; x < 21; x++) Fr(x, y, 1, 1, hsh(x, y, 71) < 0.25 ? 4 : 5);
    Fr(-7, 18, 6, 3, 10); Fr(19, 18, 6, 3, 10); Fr(-7, 21, 2, 7, 10); Fr(23, 21, 2, 7, 10);
    Fr(-7, 26, 32, 4, 10);
  });
  return cache.stone;
}
// God himself, lit from within: a white square edged in ink, horns, slit
// eyes under heavy brows in a hard scowl, a white pinpoint each, teeth when
// he roars; the robe, the crown in an ink outline, the hands.
function godSprite(pose, gaze, roaring) {
  const key = `${pose.breath}${pose.finger}${pose.tilt}${pose.hand}|${gaze.look}${gaze.squint ? 1 : 0}|${roaring ? 1 : 0}`;
  let pic = cache.poses.get(key);
  if (pic) return pic;
  const c = GC();
  pic = sprite(34 * c, 47 * c, (r, L) => {
    const Fd = (x, y, w, h, tone) => L((x - STONE_X) * c, (y - STONE_Y) * c, w * c, h * c, tone);
    const top = -pose.breath;
    // the horns, out of the square's top corners and up past the crown
    const horn = [[-1, 3], [-1, 2], [-2, 2], [-2, 1], [-3, 1], [-3, 0], [-4, 0], [-4, -1], [-4, -2], [-4, -3], [-4, -4], [-3, -5], [-3, -6], [-2, -7]];
    for (const side of [0, 1]) {
      const cells = horn.map(([x, y]) => [side ? 17 - x : x, y + top]);
      cells.forEach(([x, y]) => Fd(x - 1, y - 1, 3, 3, 10));
      cells.forEach(([x, y]) => Fd(x, y, 1, 1, 0));
    }
    Fd(0, top, 18, 18 - top, 10);
    Fd(1, top + 1, 16, 16 - top, 0);
    for (let y = top + 1; y < 17; y++) for (let x = 1; x < 17; x++) if (hsh(x, y, 72) < 0.14) Fd(x, y, 1, 1, 1);
    const ey = 6 + top;
    [[3, 1], [10, -1]].forEach(([ex, side]) => {
      const outer = side > 0 ? ex : ex + 2, inner = side > 0 ? ex + 1 : ex;
      // the brow: two heavy ink bars stepping down hard to the nose
      if (!gaze.squint) { Fd(side > 0 ? ex - 1 : ex + 3, ey - 1, 2, 1, 10); Fd(outer, ey, 3, 1, 10); }
      Fd(inner, ey + 1, 4, 1, 10);
      Fd(ex + 2 + gaze.look, ey + 1, 1, 1, 0);
    });
    // the furrow between the brows
    Fd(8, ey - 1, 1, 2, 10); Fd(9, ey - 1, 1, 2, 10);
    if (roaring) { Fd(5, 11 + top, 8, 3, 10); for (const x of [6, 8, 10, 12]) Fd(x, 11 + top, 1, 1, 0); }
    else { Fd(6, 12 + top, 6, 1, 10); Fd(5, 13 + top, 1, 1, 10); Fd(12, 13 + top, 1, 1, 10); }
    // the robe, widening down over the seat
    for (let y = 15; y < 30; y++) {
      const half = 9 + Math.floor((y - 15) / 3);
      Fd(9 - half, y, half * 2, 1, 10);
      for (let x = 9 - half + 1; x < 9 + half - 1; x++) Fd(x, y, 1, 1, hsh(x, y, 73) < 0.3 ? 2 : 3);
      Fd(8, y, 2, 1, y === 15 ? 10 : 0);
    }
    Fd(0, 15, 18, 1, 10);
    // the crown, a step askew when slipped
    const cy = -3 + top, crown = [];
    for (let x = 1; x < 17; x++) {
      const d = pose.tilt && x < 9 ? 1 : 0, tall = x <= 3 || (x >= 8 && x <= 10) || x >= 15;
      for (let y = tall ? -3 : 0; y < 2; y++) crown.push([x, cy + d + y]);
    }
    crown.forEach(([x, y]) => Fd(x - 1, y - 1, 3, 3, 10));
    crown.forEach(([x, y]) => Fd(x, y, 1, 1, 0));
    Fd(8, cy, 2, 1, 10);
    // hands: the left on its arm or up at the crown; the right drumming
    const hl = [[-6, 15], [-5, 6], [-2, cy - 1]][pose.hand];
    Fd(hl[0], hl[1], 4, 3, 10); Fd(hl[0] + 1, hl[1] + 1, 2, 1, 0);
    Fd(20, 15, 4, 3, 10); Fd(21, 16, 2, 1, 0);
    for (let f = 0; f < 3; f++) Fd(20 + f, 18 - (pose.finger === f ? 1 : 0), 1, 1, 10);
  });
  if (cache.poses.size > 64) cache.poses.clear();
  cache.poses.set(key, pic);
  return pic;
}
// The halo: a white band edged grey either side, a fainter inner ring and
// marks between, so it reads faintly as an iris. Taken once a zoom.
function halo() {
  if (cache.halo) return cache.halo;
  const c = GC(), R = (GOD_HALO_R + 2) * c, sq = Math.max(2, snap(c * 0.67, 2));
  cache.halo = sprite(R * 2, R * 2, (r, L) => {
    const at = (a, d) => [snap(R + Math.cos(a) * d, sq), snap(R + Math.sin(a) * d, sq)];
    const ring = (rad, thick, tone) => {
      const n = Math.ceil(2 * Math.PI * rad / (sq * 0.7));
      for (let i = 0; i < n; i++) { const a = i / n * 2 * Math.PI; for (let d = 0; d < thick; d += sq) { const [x, y] = at(a, rad + d); L(x, y, sq, sq, tone); } }
    };
    ring(GOD_HALO_R * c - sq, sq, 4); ring(GOD_HALO_R * c + c, sq, 4); ring(GOD_HALO_R * c, c, 0);
    ring(16 * c, sq, 3);
    for (let i = 0; i < 28; i++) { const a = i / 28 * 2 * Math.PI; for (let d = 16.5 * c; d < 20 * c; d += sq) { const [x, y] = at(a, d); L(x, y, sq, sq, 3); } }
  });
  cache.halo.R = R;
  return cache.halo;
}
function drawGodBack() {
  const c = GC(), cx = godMid(CX), cy = F.gy0 + 6 * c, gx = godX();
  // the glare: a pale disc behind the throne, lifting the far crowd round him
  const rad = GOD_GLARE_R * c, q = c >= 6 ? 6 : 3;
  alpha(0.85 - 0.3 * shown.s, () => {
    ctx.fillStyle = raw(GREY[0]);
    for (let y = -rad; y < rad; y += q) { const hw = snap(Math.sqrt(Math.max(0, rad * rad - y * y)), q); rect(cx - hw, cy + y, hw * 2, q); }
  });
  const h = halo();
  alpha(0.8, () => blit(h, cx - h.R, cy - h.R));
  // the spokes, turning about the ring: shorter and fainter as support
  // rises, gone at the strike
  const left = raysLeft(), sq = Math.max(2, snap(c * 0.67, 2));
  if (left > 0.02) alpha(Math.pow(left, 0.7), () => {
    const th = now() * 2 * Math.PI / GOD_SPOKES.turn_s;
    for (let i = 0; i < GOD_SPOKES.n; i++) {
      const a = th + i / GOD_SPOKES.n * 2 * Math.PI, len = (i % 2 ? GOD_SPOKES.short : GOD_SPOKES.long) * c * left;
      for (let d = GOD_SPOKES.r * c; d < GOD_SPOKES.r * c + len; d += sq * 1.5) {
        const x = snap(cx + Math.cos(a) * d, sq), y = snap(cy + Math.sin(a) * d, sq);
        lit(x - 2, y - 2, sq + 4, sq + 4, 4); lit(x, y, sq, sq, 0);
      }
    }
  });
  blit(stone(), gx + STONE_X * c, F.gy0 + STONE_Y * c);
}
function drawGod(gz) {
  const c = GC(), t = now();
  const roaring = EV.roars.some(r => r.kind === 'roar' && t - r.at < SKY_ROAR.mouth);
  blit(godSprite(godPose(), gz, roaring), godX() + STONE_X * c, F.gy0 + STONE_Y * c);
}

// --- the gaze ----------------------------------------------------------------------------------------
// It sweeps right, center and left of the sky, then holds on the camp; the
// speech swings it onto its mark and holds it there narrowed.
function sweepFoot() {
  const f = F, gx = godMid(CX), vw = f.W / Z, half = 9 * GC();
  const camp = { x: clamp(CX - 0.3 * vw, afterX0(), stationBox('pedestal').x), y: f.floor - 12 };
  const pts = [
    { x: gx - half + 0.36 * vw, y: f.top + f.sky * 0.66, hold: 0.8, move: 2.2 },
    { x: gx - half - 0.10 * vw, y: f.top + f.sky * 0.52, hold: 0.3, move: 1.8 },
    { x: gx - half - 0.32 * vw, y: f.top + f.sky * 0.80, hold: 0.6, move: 1.6 },
    { ...camp, hold: GOD_GAZE_HOLD_S, move: 2.4, camp: true },
    { x: gx - half + 0.08 * vw, y: f.top + f.sky * 0.62, hold: 0.4, move: 2.4 }
  ];
  const total = pts.reduce((a, p) => a + p.hold + p.move, 0);
  let u = frac(now() / total) * total;
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i], q = pts[(i + 1) % pts.length];
    if (u < p.hold) return { x: p.x, y: p.y, camp: !!p.camp };
    u -= p.hold;
    if (u < p.move) { const k = smoothstep(u / p.move); return { x: lerp(p.x, q.x, k), y: lerp(p.y, q.y, k), camp: false }; }
    u -= p.move;
  }
  return { x: pts[0].x, y: pts[0].y, camp: false };
}
function gazeNow() {
  const sw = sweepFoot(), A = S.after, t = now(), sp = A.speech;
  let foot = sw, narrow = 0, on = null, marks = 0;
  const target = speechTarget();
  if (target && sp) {
    const kind = A.signs.includes(target) ? 'sign' : 'poster', g = thingAt(kind, target), s = { x: g.x + g.w / 2, y: g.y + g.h / 2 };
    const tau = t - (sp.next - AFTER_SPEECH_WARN_S), span = AFTER_SPEECH_WARN_S - AFTER_GAZE_SETTLE_S;
    if (tau < AFTER_GAZE_SETTLE_S) { const k = smoothstep(tau / AFTER_GAZE_SETTLE_S); foot = { x: lerp(sw.x, s.x, k), y: lerp(sw.y, s.y, k) }; }
    else { foot = s; narrow = smoothstep((tau - AFTER_GAZE_SETTLE_S) / 0.6); }
    on = target; marks = clamp((tau - AFTER_GAZE_SETTLE_S) / span, 0, 1);
  } else if (sp && sp.burnt && t - sp.burnt.at < 1) {
    // back from the ash to the sweep
    const q = (sp.burnt.kind === 'sign' ? A.signs : A.posters).find(o => o.id === sp.burnt.id);
    if (q) { const g = thingAt(sp.burnt.kind, q), k = smoothstep(t - sp.burnt.at); foot = { x: lerp(g.x + g.w / 2, sw.x, k), y: lerp(g.y + g.h / 2, sw.y, k) }; }
  }
  const eye = { x: godMid(CX), y: F.gy0 + 7 * GC() };
  const dx = foot.x - eye.x, vw = F.W / Z;
  return { eye, foot, narrow, on, marks, look: dx < -vw * 0.08 ? -1 : dx > vw * 0.08 ? 1 : 0, squint: !!sw.camp && !target };
}
function drawGaze(gz) {
  const { eye, foot } = gz;
  const len = Math.hypot(foot.x - eye.x, foot.y - eye.y), row = 3, c = GC();
  const hwF = lerp(Math.max(24, len * 0.09), Math.max(12, len * 0.035), gz.narrow);
  const seat = F.gy0 + 30 * c, chin = F.gy0 + 15 * c;
  if (foot.y <= eye.y) return;
  alpha(0.5 + 0.15 * gz.narrow, () => {
    ctx.fillStyle = raw(GREY[0]);
    for (let y = eye.y; y < foot.y; y += row) {
      if (y < seat) continue;
      const k = (y - eye.y) / (foot.y - eye.y), cx = lerp(eye.x, foot.x, k), hw = lerp(c, hwF, k);
      if (inView(cx - hw, hw * 2)) rect(cx - hw, y, hw * 2, row);
    }
  });
  ctx.fillStyle = raw(GREY[4]);
  let n = 0;
  for (let y = eye.y; y < foot.y; y += row, n++) {
    if (n % 2 || y < chin) continue;
    const k = (y - eye.y) / (foot.y - eye.y), cx = lerp(eye.x, foot.x, k), hw = lerp(c, hwF, k);
    rect(cx - hw, y, 2, 2); rect(cx + hw - 2, y, 2, 2);
  }
}

// --- the sermon's bubbles ------------------------------------------------------------------------------
const GL = {
  '!': ['.#.', '.#.', '.#.', '.#.', '.#.', '...', '.#.'],
  '?': ['.###.', '#...#', '...#.', '..#..', '..#..', '.....', '..#..'],
  '#': ['.#.#.', '#####', '.#.#.', '.#.#.', '#####', '.#.#.', '.....'],
  'k': ['.###.', '#####', '#.#.#', '#####', '.###.', '.#.#.', '.....'],
  'z': ['...##', '..##.', '.##..', '#####', '..##.', '.##..', '##...', '#....'],
  '~': ['.....', '.....', '.#...', '#.#.#', '...#.', '.....', '.....'],
  '.': ['.', '.', '.', '.', '.', '.', '#']
};
const ROARS = [['!', '!'], ['?', '!'], ['#', '!'], ['k', '!'], ['z']];
const GRUMBLES = [['~'], ['.', '.', '.'], ['~', '~']];
function drawBubbles() {
  const c = GC(), t = now(), gx = godX();
  for (const r of EV.roars) {
    const tau = t - r.at, life = r.kind === 'roar' ? SKY_ROAR.bubble : SKY_GRUMBLE.bubble;
    if (tau > life || tau < 0) continue;
    const a = Math.min(1, tau / 0.2) * (tau > life - 0.4 ? (life - tau) / 0.4 : 1);
    const gp = r.kind === 'roar' ? Math.round((r.big ? 1.5 : 1.0) * c * 0.67) : Math.max(2, Math.round(c / 3));
    const glyphW = r.g.reduce((s, k) => s + GL[k][0].length + 1, -1);
    const bw = (glyphW + 4) * gp, bh = 12 * gp;
    const bx = r.kind === 'roar' ? gx + 18 * c + 2 * c : gx - 2 * c - bw;
    const by = r.kind === 'roar' ? F.gy0 - 6 * c - bh * 0.4 : F.gy0 + 2 * c;
    const ink = r.kind === 'roar' ? 10 : 6, u = Math.max(2, gp);
    alpha(a, () => {
      rect(bx + u, by, bw - 2 * u, bh, ink); rect(bx, by + u, bw, bh - 2 * u, ink);
      rect(bx + u, by + u, bw - 2 * u, bh - 2 * u, 0);
      const tx = r.kind === 'roar' ? bx + u : bx + bw - 2 * u;
      for (let i = 0; i < 3; i++) rect(tx + (r.kind === 'roar' ? -i * u : i * u), by + bh + i * u - u, 2 * u, 2 * u, ink);
      let x = bx + 2 * gp;
      for (const k of r.g) {
        GL[k].forEach((line, j) => { for (let i = 0; i < line.length; i++) if (line[i] === '#') rect(x + i * gp, by + 2 * gp + j * gp, gp, gp, ink); });
        x += (GL[k][0].length + 1) * gp;
      }
    });
  }
}

// --- the tithe line -------------------------------------------------------------------------------------
// Its path at the act's opening, each point with its rate and a carrier's
// size there; a point at God's rate rides with God through the dive.
function tithePath() {
  const c = GC(), b = stationBox('pedestal'), campRight = b.x + b.w;
  const g0 = F.XR + (godMid(F.XR) - F.XR), Gs = 18 * c, gX = g0 - Gs / 2, seatB = F.gy0 + 30 * c;
  const pts = [
    { x: campRight - 10, y: F.floor, r: 1, s: 14 },
    { x: campRight + 80, y: F.bank + 8, r: 0.9, s: 11 },
    { x: gX + Gs + 2.2 * Gs, y: lerp(seatB, F.bank, 0.72), r: 0.78, s: 8 },
    { x: gX - 2.2 * Gs, y: lerp(seatB, F.bank, 0.45), r: 0.70, s: 7 },
    { x: gX + Gs + 1.4 * Gs, y: lerp(seatB, F.bank, 0.18), r: 0.66, s: 6 },
    { x: gX - 7 * c, y: F.gy0 + 27 * c, r: GOD_RATE, s: 6 }
  ];
  const ride = godMid(CX) - layerX(g0, GOD_RATE, CX);
  let L = 0;
  return pts.map((p, i) => {
    const q = { ...p, x: layerX(p.x, p.r, CX) + ride * clamp((1 - p.r) / (1 - GOD_RATE), 0, 1) };
    if (i) L += Math.hypot(p.x - pts[i - 1].x, p.y - pts[i - 1].y);
    q.L = L;
    return q;
  });
}
function pathAt(path, u) {
  const d = u * path[path.length - 1].L;
  for (let i = 1; i < path.length; i++) if (d <= path[i].L || i === path.length - 1) {
    const a = path[i - 1], b = path[i], k = clamp((d - a.L) / Math.max(1e-6, b.L - a.L), 0, 1);
    return { x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k), s: lerp(a.s, b.s, k), dir: Math.sign(b.x - a.x) || 1 };
  }
  return path[0];
}
function drawTithe(dt) {
  const s = shown.s, path = tithePath(), N = TITHE_CARRIERS;
  shown.tithe += dt * (s >= 0.98 ? 0 : TITHE_LAP * (1 - 0.6 * s));
  const thin = Math.min(0.93, s * 1.05);
  // the ledge: grey steps under their feet
  alpha(1 - 0.85 * thin, () => {
    ctx.fillStyle = GREY[4];
    for (let u = 0.03; u < 0.985; u += 0.005) { const q = pathAt(path, u); if (inView(q.x, 2)) rect(q.x, q.y, 2, 2); }
  });
  for (let i = 0; i < N; i++) {
    const pres = clamp((hsh(i, 0, 80) + 0.2 - 1.2 * thin) / 0.2, 0, 1);
    if (pres <= 0.01) continue;
    const u = frac(i / N + shown.tithe), q = pathAt(path, u);
    const sz = Math.max(4, snap(q.s, 2)), bw = sz, bh = Math.round(sz * 0.75);
    const up = s >= 0.98 ? 0 : (Math.floor(now() * 4 + i) % 2);
    const x = q.x - bw / 2, y = q.y - bh - up;
    if (!inView(x - sz, sz * 3)) continue;
    const a = pres * clamp(u / 0.03, 0, 1) * clamp((1 - u) / 0.05, 0, 1);
    const loadA = clamp((0.94 - u) / 0.04, 0, 1), rim = sz >= 10 ? 2 : 1;
    alpha(a, () => {
      rect(x, y, bw, bh, 10); rect(x + rim, y + rim, bw - 2 * rim, bh - 2 * rim, 0);
      const hs = Math.max(2, snap(sz * 0.4, 1));
      rect(q.dir > 0 ? x + bw - 1 : x - hs + 1, y + bh - hs - 1, hs, hs, 10);      // the head, bowed low
      alpha(loadA, () => {
        if (i % 3 === 0) { const ls = Math.round(sz * 0.8); rect(x + (bw - ls) / 2, y - ls + 1, ls, ls, 10); rect(x + (bw - ls) / 2 + rim, y - ls + 1 + rim, ls - 2 * rim, ls - 2 * rim, 1); }
        else { const pl = Math.round(sz * 1.8), th = Math.max(2, Math.round(sz / 4)); rect(x + bw / 2 - pl / 2, y - th, pl, th, 7); }
      });
    });
  }
  // the glare at his left hand that takes the load, then the carrier
  const end = path[path.length - 1], c = GC(), rad = TITHE_GLARE_R * c, q = c >= 6 ? 3 : 2;
  alpha(0.92 - 0.3 * s, () => {
    ctx.fillStyle = raw(GREY[0]);
    for (let y = -rad; y < rad; y += q) { const hw = Math.sqrt(Math.max(0, rad * rad - y * y)); rect(snap(end.x - hw, q), end.y - 2 * c + y, snap(hw * 2, q), q); }
  });
}

// --- signs and posters --------------------------------------------------------------------------------
// Each stands in the near band, at its own x and the signs' rate: a board
// on a pole down into the cloud bank. Where it is drawn (its board's box).
function thingAt(kind, q) {
  const poster = kind === 'poster', d = poster ? SKY_POSTER : SKY_SIGN;
  const x0 = poster ? slotX(q.slot) : soulX(q.f), up = poster ? 108 : 96 + Math.min(q.r || 0, 10) * 2;
  const lift = EV.rallies.some(r => r.thing.q === q && now() - r.at < SKY_RALLY.lift) ? -P : 0;
  return { x: layerX(x0 - d.w / 2, SKY_SIGN_RATE, CX), y: F.bank - up + lift, w: d.w, h: d.h, poster };
}
// A board's cells: tone of (cx, cy), the pole two cells down its middle.
function boardCells(poster, fn) {
  const d = poster ? SKY_POSTER : SKY_SIGN, cw = d.w / d.cell, ch = d.h / d.cell;
  for (let cy = 0; cy < ch; cy++) for (let cx = 0; cx < cw; cx++) {
    const edge = cx === 0 || cy === 0 || cx === cw - 1 || cy === ch - 1;
    let tone = edge ? 10 : 0;
    if (!poster && !edge && (cy === 3 || cy === 6 || cy === 8) && cx > 2 && cx < cw - 3 - (cy === 8 ? 5 : 0)) tone = 5;
    if (poster && !edge) {
      // a crossed-out crown, the placeholder picture
      if (cy >= 6 && cy <= 7 && cx > 2 && cx < 11) tone = 9;
      if (cy >= 3 && cy <= 5 && (cx === 3 || cx === 6 || cx === 7 || cx === 10)) tone = 9;
      if (cy >= 2 && cy <= 11 && Math.abs(cx - 1.5 - (cy - 2) * 1.05) < 0.8) tone = 10;
      if ((cy === 14 || cy === 16) && cx > 2 && cx < 11) tone = 5;
    }
    fn(cx, cy, tone, cy * 40 + cx);
  }
}
function boardSprite(poster, poleH) {
  const key = `${poster ? 'p' : 's'}${Math.round(poleH)}`;
  let pic = cache.signs.get(key);
  if (pic) return pic;
  const d = poster ? SKY_POSTER : SKY_SIGN, cell = d.cell;
  pic = sprite(d.w, d.h + poleH, r => {
    r(d.w / 2 - cell, d.h, cell * 2, poleH, 10);
    boardCells(poster, (cx, cy, tone) => r(cx * cell, cy * cell, cell, cell, tone));
  });
  cache.signs.set(key, pic);
  return pic;
}
function drawThings(gz) {
  const A = S.after, t = now();
  const all = [...A.posters.map(q => ['poster', q]), ...A.signs.map(q => ['sign', q])];
  for (const [kind, q] of all) {
    const g = thingAt(kind, q), d = g.poster ? SKY_POSTER : SKY_SIGN, cell = d.cell;
    if (!inView(g.x - 20, g.w + 40)) continue;
    const poleH = F.bank + 12 - (g.y + g.h);
    // the warning: four ink corner marks closing in on it in held steps
    if (gz.on === q) {
      const m = 6 + 6 * (3 - Math.min(3, Math.floor(gz.marks * 4))), L = 10;
      for (const [cx, cy, sx, sy] of [[g.x - m, g.y - m, 1, 1], [g.x + g.w + m, g.y - m, -1, 1], [g.x - m, g.y + g.h + m, 1, -1], [g.x + g.w + m, g.y + g.h + m, -1, -1]]) {
        rect(sx > 0 ? cx : cx - L, sy > 0 ? cy : cy - 2, L, 2, 10);
        rect(sx > 0 ? cx : cx - 2, sy > 0 ? cy : cy - L, 2, L, 10);
      }
    }
    const fading = q.torn != null ? clamp(1 - (t - q.torn) / AFTER_POSTER_FADE_S, 0, 1) : 1;
    if (q.burnt == null) { alpha(fading, () => blit(boardSprite(g.poster, poleH), g.x, g.y)); continue; }
    // Burning: charred from the foot up, cell by cell, raw soot on either
    // page, each charred cell then burning away; embers rising.
    const burn = (t - q.burnt) * (4.6 / AFTER_BURN_S), i = q.id, ch = d.h / cell, total = ch + poleH / cell;
    const cellAt = (cx, cy, tone, id) => {
      const charAt = hsh(id, i, 90) * 0.5 + (1 - cy / total) * 0.7;
      const fa = 1 - clamp((burn - (1.2 + hsh(id, i, 91) * 1.6)) / 0.4, 0, 1);
      if (fa <= 0) return;
      alpha(fa, () => (burn > charAt ? lit(g.x + cx * cell, g.y + cy * cell, cell, cell, 10) : rect(g.x + cx * cell, g.y + cy * cell, cell, cell, tone)));
    };
    for (let j = 0; j < poleH / cell; j++) { cellAt(d.w / cell / 2 - 1, ch + j, 10, 1000 + j); cellAt(d.w / cell / 2, ch + j, 10, 2000 + j); }
    boardCells(g.poster, cellAt);
    if (burn > 0.6 && burn < 4.5) for (let e = 0; e < 14; e++) {
      const k = (burn - (0.6 + hsh(e, i, 92) * 2.4)) / 1.4;
      if (k < 0 || k > 1) continue;
      alpha(1 - k, () => rect(snap(g.x + hsh(e, i, 93) * g.w + Math.sin(e + burn * 3) * 3, 2), snap(g.y + g.h * 0.6 - k * 50, 2), 2, 2, 9));
    }
  }
}

// --- the cloud bank --------------------------------------------------------------------------------
// A lumpy billow of near-white cells over the crowd's feet, the only horizon.
function drawBank() {
  const [x0, x1] = layerSpan(SKY_BANK_RATE);
  if (!cache.bank) cache.bank = sprite(x1 - x0, 60, r => {
    for (let i = 0; i < (x1 - x0) / P; i++) {
      const top = 2 + Math.round(vnoise(i / 5, 0, 31) * 3 + hsh(i, 0, 32));
      for (let j = top; j < 10; j++) r(i * P, j * P, P, P, hsh(i, j, 33) < 0.25 ? 2 : 1);
    }
  });
  const shift = (CX - F.XR) * (1 - SKY_BANK_RATE), pic = cache.bank;
  const sx = clamp((S.camX - shift - x0) * K, 0, pic.width), sw = clamp(S.viewW * K + 2 * K, 0, pic.width - sx);
  if (sw > 0) ctx.drawImage(pic, sx, 0, sw, pic.height, onPx(x0 + shift + sx / K), onPx(F.bank - 12), sw / K, pic.height / K);
  rect(S.camX, F.bank + 48, S.viewW, F.floor - P * 3 - F.bank - 48, 0);
}

// --- bodies standing in God's yard ----------------------------------------------------------------
// The floor where the crowd stood is drawn as the cloud bank: a body walking
// in climbs it at the edge and stands up in the near band, among the signs,
// smaller and at their rate; a member walking out climbs down. Where a sim
// point there is drawn, and how big a body is (1 on the floor).
const NEAR_K = SKY_NEAR.soul / (P * 3);
export function seenAt(x, y) {
  if (!S.after) return { x, y, k: 1 };
  camFrame();
  const edge = CROWD_PITCH * 2;
  const w = smoothstep((x - (CROWD_X0 - edge)) / edge) * smoothstep((crowdX1() + edge - x) / edge);
  if (w <= 0) return { x, y, k: 1 };
  const d = clamp((afterFloor() - y) / (CROWD_NEAR * CROWD_ROW), 0, 1.5);
  const rate = 1 + (SKY_SIGN_RATE - 1) * w;
  return { x: layerX(x, rate, CX), y: lerp(y, F.bank - d * 24, w), k: lerp(1, NEAR_K, w) };
}
function body(w) {
  const v = seenAt(w.x, w.y), u = P * v.k;
  const x = onPx(v.x - u * 1.5), y = onPx(v.y - u * 3);
  rect(x, y, u * 3, u * 3, 10);
  rect(x + u, y + u, u, u, 1);
  if (w.load === 'log') for (let c = -1; c <= 3; c++) rect(x + c * u, y - u, u, u, c === 1 ? 2 : 8);
  else if (w.load === 'sign') { rect(x + u, y - u, u, u, 10); rect(x, y - u * 2, u * 3, u, 1); }
  else if (w.load === 'posters') { rect(x, y - u, u, u, 0); rect(x + u, y - u, u, u, 2); rect(x + u * 2, y - u, u, u, 0); }
  else if (w.load === 'tip') rect(x, y - u, u * 2, u, 4);
  if (w.swing != null) {
    if (w.job === AFTER_JOB.AGITATE) { rect(x + u, y - u * 5, u, u * 2, 10); rect(x + u, y - u * 2, u, u, 10); }
    else for (let k = 1; k <= 2; k++) rect(x + (w.face > 0 ? 2 + k : -k) * u, y - k * u, u, u, 10);
  }
}

// --- souls drifting up from the camp ---------------------------------------------------------------
const DRIFT_MID = (SKY_DRIFT.every[0] + SKY_DRIFT.every[1]) / 2;
function drawDrift() {
  const t = now(), b = stationBox('pedestal'), x0 = stationBox('mill')?.x ?? afterX0(), x1 = b.x + b.w + P * 60;
  for (let n = Math.max(0, Math.floor((t - SKY_DRIFT.life) / DRIFT_MID) - 1); n * DRIFT_MID <= t; n++) {
    const at = n * DRIFT_MID + (hsh(n, 14) - 0.5) * (SKY_DRIFT.every[1] - SKY_DRIFT.every[0]), tau = t - at;
    if (tau < 0 || tau > SKY_DRIFT.life) continue;
    const a = Math.min(1, tau / 1.2) * Math.min(1, (SKY_DRIFT.life - tau) / 3) * 0.9;
    const x = snap(lerp(x0, x1, hsh(n, 12)) + Math.sin(tau * 0.8 + hsh(n, 13) * 6) * 6, 2), y = snap(F.floor - 40 - tau * SKY_DRIFT.rise, 2);
    if (inView(x, 6)) alpha(a, () => { rect(x, y, 6, 6, 6); rect(x + 2, y + 2, 2, 2, 0); });
  }
}

// --- the layers ------------------------------------------------------------------------------------
// The sky behind the camp: the far bands and their clouds, God, the near
// bands, the tithe line and the signs, the cloud bank over their feet.
let GZ = null, lastDt = 0;
export function drawSkyCrowd() {
  if (!S.after) return;
  camFrame();
  freshCaches();
  lastDt = stepShown();
  drawn.cells = 0; drawn.slices = 0; rewrote = false;
  EV = eventsNow();
  RINGS = ringsNow();
  GZ = gazeNow();
  pickJoins();
  const far = SKY_BANDS.length;
  for (let k = 0; k < far - 1; k++) {
    drawBand(k);
    if (SKY_CLOUDS_AFTER.includes(k) && k !== far - 2) drawCloudStrip(k);
  }
  drawGodBack();
  drawGod(GZ);
  drawCloudStrip(far - 2);
  drawBand(far - 1);
  drawNearSouls();
  drawTithe(lastDt);
  drawThings(GZ);
  drawBank();
}
// Over the camp: the bodies standing in God's yard, the souls drifting up,
// the gaze, which lights whatever it crosses, and the throne's bubbles.
export function drawAfterCrowd() {
  if (!S.after) return;
  camFrame();
  if (!GZ) return;
  for (const w of S.after.bodies) if (overCrowd(w.x)) body(w);
  drawDrift();
  drawGaze(GZ);
  drawBubbles();
}
