// The serpent's glimpses: now and then, once the pit has drowned, a bit of it
// shows above the abyss's surface and goes back under -- the hump of a coil,
// the crest cutting across like a fin, or the top of the head with an eye
// open on whoever is standing on the lip. The owner's pick was all three, one
// at a time, from the drowning on: before the snatch it is a promise of what
// is down there, after it a reminder that he is still down there with the one
// it took (the mock, docs/mocks/surface-serpent-2026-10-12.html).
//
// A picture and nothing else: no hit area, no sound, nothing in the yard
// reads it. What is kept is which one is up and where (`S.glimpse`), and
// which comes next and when (`S.glimpseNext`); both are thrown away on a
// reload, since the clock they are written on starts again with the page,
// so a glimpse in progress does not come back and the wait is drawn afresh.
//
// It never shows under a beat that has the yard or the camera, nor with the
// camera in the deep or on its way there: one that is up when any of those
// starts goes, and the next waits its turn. The shapes are worked out here as
// cells on the surface (`glimpseFrame`); drawAbyss (render/cores.js) lays
// them on the real liquid, under the bridge.

import { P, WORKER, ABYSS_TONES, SNATCH_HIDE, SNATCH_CREST,
         GLIMPSE_KINDS, GLIMPSE_WEIGHT, GLIMPSE_GAP_S, GLIMPSE_LEN_S, GLIMPSE_STEP_S,
         GLIMPSE_LIP, GLIMPSE_CLEAR, GLIMPSE_TRIES, GLIMPSE_RETRY_S,
         GLIMPSE_FOAM, GLIMPSE_FOAM_DIM, GLIMPSE_RING, GLIMPSE_RING_STEP, GLIMPSE_RING_LAG, GLIMPSE_RING_HEAP,
         GLIMPSE_BROW_DARK, GLIMPSE_HUMP, GLIMPSE_FIN, GLIMPSE_WATCHER } from './config.js';
import { S, pit } from './state.js';
import { stream } from './rng.js';
import { mouthX, portalCircle, portalReach } from './deep/place.js';
import { belowYard } from './route.js';

// Its own chance, so a glimpse never moves the yard off its stream: a picture
// that spent `rand()` would make a seeded run a different run once drowned.
const roll = stream(0x5e7be47);

const [EDGE, HIDE, LATTICE, BROW] = SNATCH_HIDE;
const [CREST, CREST_HI] = SNATCH_CREST;
const tone = k => ABYSS_TONES[k];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const mod = (v, n) => ((v % n) + n) % n;

// --- the shapes ------------------------------------------------------------------
// Each draws one glimpse at `lt` seconds into it, at column `g.x`, heading
// `g.dir`, into a frame: `lift` raises the surface a cell over a column,
// `notch` paints the surface's own top cell, `cells` stand `up` cells over
// the surface, `blot` puts out the liquid's lights where the body passes
// under (`deep` cells under the line), and `bubbles` climb in the liquid
// (`deep` cells under the surface).
const splash = (f, c) => { f.lift[c] = 1; f.notch[c] = tone(GLIMPSE_FOAM); };

function rings(f, cx, hw, a) {
  if (a < GLIMPSE_RING_HEAP) for (let d = -1; d <= 1; d++) f.lift[cx + d] = 1;   // the liquid closing over
  for (let i = 0; i < 2; i++) {
    const k = Math.floor((a - i * GLIMPSE_RING_LAG) / GLIMPSE_RING_STEP);
    if (k < 0 || k >= GLIMPSE_RING.length) continue;
    for (const s of [-1, 1]) {
      const c = cx + s * (hw + 1 + k);
      f.notch[c] = tone(GLIMPSE_RING[k]);
      if (k < GLIMPSE_RING.length / 2) f.lift[c] = 1;   // a crest running out, settling as it goes
    }
  }
}

// A. The hump: slow and heavy, the hump creeping a cell while the scales
// slide through it twice as fast, so it reads as a long body passing rather
// than a lump bobbing.
function hump(f, lt, g) {
  const H = GLIMPSE_HUMP, d = g.dir, top = H.halfW.length - 1;
  const cx = g.x + d * Math.floor(clamp(lt - H.riseAt, 0, H.creepFor) / H.creep);
  const tall = lt < H.riseAt ? 0
             : lt < H.rollAt ? Math.min(top, 1 + Math.floor((lt - H.riseAt) / H.riseStep))
             : lt < H.sinkAt ? top
             : lt < H.goneAt ? top - Math.floor((lt - H.sinkAt) / H.riseStep) : 0;
  if (lt < H.goneAt) f.blot.push({ c0: cx - H.blotW, c1: cx + H.blotW, deep: H.blotDeep });
  if (lt >= H.bulgeAt && lt < H.riseAt) for (let k = -H.bulgeW; k <= H.bulgeW; k++) f.lift[cx + k] = 1;
  if (tall > 0) {
    const hw = H.halfW[tall], slide = Math.floor(lt / H.slide);
    for (let dd = -hw; dd <= hw; dd++) {
      const c = cx + dd;
      const h = Math.max(1, Math.round(tall * Math.sqrt(1 - (dd / (hw + H.round)) ** 2)));
      const s = mod(c - d * slide, 3);    // the snatch's lattice, a scale every third cell
      for (let k = 0; k < h; k++) {
        const t = k === 0 ? EDGE : k === 1 ? (s === 0 ? tone(GLIMPSE_BROW_DARK) : BROW) : (s ? HIDE : LATTICE);
        f.cells.push({ c, up: h - k, tone: t });
      }
    }
    splash(f, cx - hw - 1); splash(f, cx + hw + 1);
    // rolling, a cell of liquid pushed up ahead of it with foam beyond
    if (lt >= H.rollAt && lt < H.sinkAt) { f.lift[cx + d * (hw + 1)] = 1; f.notch[cx + d * (hw + 2)] = tone(GLIMPSE_FOAM_DIM); }
  }
  if (lt >= H.goneAt) rings(f, cx, H.ringW, lt - H.goneAt);
}

// B. The fin: the crest's spikes, tallest at the front, crossing with a bow
// wave ahead and a wake fading behind, then under front first.
function fin(f, lt, g) {
  const F = GLIMPSE_FIN, d = g.dir, tallest = Math.max(...F.spikes), over = F.goAt + F.crossFor;
  const L = g.x + d * Math.floor(clamp(lt - F.goAt, 0, F.crossFor) / F.cross);
  const moving = lt >= F.goAt && lt < over;
  if (lt < F.ringsAt) {
    const a = L - d * F.blotBack, b = L + d * F.bow;
    f.blot.push({ c0: Math.min(a, b), c1: Math.max(a, b), deep: F.blotDeep });
  }
  F.spikes.forEach((full, j) => {
    const col = L - d * F.apart * j;
    const from = F.upAt + j * F.upStep;
    let up = lt < from ? 0 : Math.min(full, Math.floor((lt - from) / F.upStep) + 1);
    const sinkAt = F.sinkAt + j * F.sinkLag;
    if (lt >= sinkAt) up = Math.max(0, up - (Math.floor((lt - sinkAt) / F.sinkStep) + 1));
    for (let u = 1; u <= up; u++) f.cells.push({ c: col, up: u, tone: u === full && full === tallest ? CREST_HI : CREST });
  });
  if (lt >= F.bowAt && lt < F.bowEnd) {
    for (let k = 1; k <= F.bow; k++) f.lift[L + k * d] = 1;
    if (lt >= F.foamAt) f.notch[L + F.bow * d] = tone(moving ? GLIMPSE_FOAM : GLIMPSE_FOAM_DIM);
  }
  if (lt >= F.goAt && lt < F.wakeEnd) {
    const fade = lt < over ? 0 : Math.floor((lt - over) / F.wakeStep) + 1;
    const tail = L - d * F.wakeBack;
    for (let k = 1; k <= F.wakeLen; k++) {
      const i = k - 1 + fade;
      if (i < F.wake.length) f.notch[tail - d * k] = tone(F.wake[i]);
    }
  }
  if (lt >= F.ringsAt) rings(f, L - d * F.ringBack, F.ringW, lt - F.ringsAt);
}

// C. The watcher: bubbles, a bulge, the brow and the eye; it looks toward
// `g.dir` (the nearest body on the lip, see `stepGlimpse`), blinks once and
// rolls back under, away from them.
function watcher(f, lt, g) {
  const W = GLIMPSE_WATCHER, d = g.dir, hw = W.halfW;
  [-1, 1, 0].forEach((dc, b) => {
    const age = lt - b * W.bubbleLag;
    if (age < 0) return;
    const deep = W.bubbleDeep - Math.floor(age / W.bubbleStep);
    if (deep > 1) f.bubbles.push({ c: g.x + dc, deep });
    else if (deep > -1) splash(f, g.x + dc);
  });
  if (lt >= W.bulgeAt && lt < W.upAt) for (let k = -W.bulgeW; k <= W.bulgeW; k++) f.lift[g.x + k] = 1;
  const cx = g.x - d * Math.floor(Math.max(0, lt - W.rollAt) / W.roll);
  const tall = lt < W.upAt ? 0 : lt < W.fullAt ? 1 : lt < W.dropAt ? 2 : lt < W.goneAt ? 1 : 0;
  if (lt >= W.blotFrom && lt < W.goneAt) f.blot.push({ c0: cx - W.blotW, c1: cx + W.blotW, deep: W.blotDeep });
  if (tall > 0) {
    for (let dd = -hw; dd <= hw; dd++) {
      const h = Math.abs(dd) === hw ? tall - 1 : tall;
      for (let k = 0; k < h; k++) f.cells.push({ c: cx + dd, up: h - k, tone: k === 0 ? EDGE : BROW });
    }
    f.cells.push({ c: cx - d, up: tall + 1, tone: CREST_HI });
    if (tall >= 2) f.cells.push({ c: cx - 3 * d, up: tall, tone: CREST });
    splash(f, cx - hw - 1); splash(f, cx + hw + 1);
    // the eye: opening, looking, a blink, closing
    let eye = null;
    if (lt >= W.eyeOpen && lt < W.eyeWide) eye = tone(GLIMPSE_FOAM);
    else if (lt >= W.eyeWide && lt < W.eyeShut) eye = lt >= W.blinkAt && lt < W.blinkEnd ? tone(GLIMPSE_BROW_DARK) : '#fff';
    else if (lt >= W.eyeShut && lt < W.eyeGone) eye = tone(GLIMPSE_FOAM);
    if (eye && tall >= 2) f.cells.push({ c: cx + d * (lt >= W.turnAt ? 2 : 1), up: 1, tone: eye });
  }
  if (lt >= W.goneAt) rings(f, cx, hw, lt - W.goneAt);
}

const SHAPES = { hump, fin, watcher };
// The watcher turns toward whoever is nearest while it comes up, so the
// stretch it is given has to hold it facing either way.
const TURNS = { watcher: true };

const blankFrame = () => ({ lift: {}, notch: {}, cells: [], blot: [], bubbles: [] });
const lenMs = kind => GLIMPSE_LEN_S[kind] * 1000;

// Its own clock, in held steps: nothing about it moves between them.
const heldS = ms => Math.floor(ms / 1000 / GLIMPSE_STEP_S) * GLIMPSE_STEP_S;

// The glimpse that is up, as a frame of cells at the clock `t`, or null.
export function glimpseFrame(t) {
  const g = S.glimpse;
  if (!g) return null;
  const lt = heldS(t - g.at);
  if (lt < 0 || lt >= GLIMPSE_LEN_S[g.kind]) return null;
  const f = blankFrame();
  SHAPES[g.kind](f, lt, g);
  return f;
}

// --- where one may come up ---------------------------------------------------------
// The columns a glimpse touches over its whole life, from its own column,
// heading `dir`: read off the shapes themselves a step at a time, so a shape
// that changes carries its room with it.
const reaches = new Map();
function footprint(kind, dir) {
  const key = kind + dir;
  if (reaches.has(key)) return reaches.get(key);
  let lo = 0, hi = 0;
  const see = c => { if (c < lo) lo = c; if (c > hi) hi = c; };
  for (const d of TURNS[kind] ? [-1, 1] : [dir]) {
    for (let lt = 0; lt < GLIMPSE_LEN_S[kind]; lt += GLIMPSE_STEP_S) {
      const f = blankFrame();
      SHAPES[kind](f, lt, { x: 0, dir: d });
      for (const c in f.lift) see(+c);
      for (const c in f.notch) see(+c);
      for (const s of f.cells) see(s.c);
      for (const s of f.bubbles) see(s.c);
      for (const b of f.blot) { see(b.c0); see(b.c1); }
    }
  }
  const r = { lo, hi };
  reaches.set(key, r);
  return r;
}

// The stretches of the surface nothing may come up on just now, in columns:
// where grains are going in, the shaft at the mouth, and the portal's tear
// once it stands or is being poured.
function kept() {
  const out = [];
  const around = (x, half) => out.push([Math.floor((x - half) / P) - GLIMPSE_CLEAR, Math.ceil((x + half) / P) + GLIMPSE_CLEAR]);
  for (const m of S.gulped) around(m.x, 0);
  for (const r of S.ripples) around(r.x, 0);
  around(mouthX(), WORKER);
  if (S.portalOpen || S.portalPour > 0) around(portalCircle().x, portalReach());
  return out;
}

// A column for a glimpse of `kind` heading `dir`, inside the pit and clear of
// everything `kept`; in view where the view has room for it, so the one the
// player is looking at the pit for is the one they see. Null if none was
// found this time.
function spotFor(kind, dir) {
  const { lo, hi } = footprint(kind, dir);
  const c0 = Math.ceil(pit.x / P) + GLIMPSE_LIP - lo;
  const c1 = Math.floor((pit.x + pit.w) / P) - 1 - GLIMPSE_LIP - hi;
  if (c1 < c0) return null;
  const v0 = Math.max(c0, Math.ceil(S.camX / P) - lo), v1 = Math.min(c1, Math.floor((S.camX + S.viewW) / P) - 1 - hi);
  const bans = kept();
  const clear = x => bans.every(([a, b]) => x + hi < a || x + lo > b);
  for (const [a, b] of v1 >= v0 ? [[v0, v1], [c0, c1]] : [[c0, c1]])
    for (let i = 0; i < GLIMPSE_TRIES; i++) {
      const x = a + Math.floor(roll() * (b - a + 1));
      if (clear(x)) return x;
    }
  return null;
}

// Toward the nearest body standing on the lip or the plank, or `dir` if there
// is nobody up there.
function lookToward(x, dir) {
  let best = Infinity, to = dir;
  const mid = (x + 0.5) * P;
  for (const w of S.workers) {
    if (belowYard(w)) continue;
    const dx = w.x + WORKER / 2 - mid;
    if (Math.abs(dx) < best) { best = Math.abs(dx); to = dx < 0 ? -1 : 1; }
  }
  return to;
}

// --- when ---------------------------------------------------------------------------
// Which comes next, by weight, and when: its own wait from `t`.
function nextAfter(t) {
  const total = GLIMPSE_KINDS.reduce((s, k) => s + GLIMPSE_WEIGHT[k], 0);
  let r = roll() * total, kind = GLIMPSE_KINDS[GLIMPSE_KINDS.length - 1];
  for (const k of GLIMPSE_KINDS) { if ((r -= GLIMPSE_WEIGHT[k]) < 0) { kind = k; break; } }
  const [a, b] = GLIMPSE_GAP_S[kind];
  return { kind, at: t + (a + roll() * (b - a)) * 1000 };
}

// Nothing may come up with the story holding the yard or the camera, nor
// with the camera in the deep or on its way.
export const glimpseHeld = () =>
  !!(S.beat.camera || S.beat.yard || S.shot || S.view === 'deep' || S.viewTo != null);

// Up from `t` (or `into` seconds already gone), at `x` heading `dir`, or
// wherever there is room. What a scene forces; the schedule calls it too.
export function startGlimpse(kind, t, { x = null, dir = null, into = 0 } = {}) {
  const d = dir ?? (roll() < 0.5 ? -1 : 1);
  const at = x ?? spotFor(kind, d);
  if (at == null) return null;
  S.glimpse = { kind, at: t - into * 1000, x: at, dir: kind === 'watcher' ? lookToward(at, d) : d };
  return S.glimpse;
}

export function stepGlimpse(t) {
  if (!S.drowned) { S.glimpse = null; S.glimpseNext = null; return; }
  const g = S.glimpse;
  if (glimpseHeld()) {
    if (g) { S.glimpse = null; S.glimpseNext = nextAfter(t); }
    return;
  }
  if (g) {
    if (t - g.at < lenMs(g.kind)) {
      // the eye settles on whoever is nearest until it opens, and stays there
      if (g.kind === 'watcher' && (t - g.at) / 1000 < GLIMPSE_WATCHER.eyeOpen) g.dir = lookToward(g.x, g.dir);
      return;
    }
    S.glimpse = null;
    S.glimpseNext = nextAfter(t);
    return;
  }
  if (!S.glimpseNext) S.glimpseNext = nextAfter(t);
  if (t < S.glimpseNext.at) return;
  if (!startGlimpse(S.glimpseNext.kind, t)) { S.glimpseNext.at = t + GLIMPSE_RETRY_S * 1000; return; }
  S.glimpseNext = null;
}
