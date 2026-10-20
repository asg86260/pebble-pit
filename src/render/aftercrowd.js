// Act 3's sky, drawn flat (DESIGN.md, "The sky, redrawn flat"; the owner's
// votes, docs/mocks/act3-sky-flat-2026-10-19, a3gaze the cumulative one), and
// God's camp standing in the clouds (DESIGN.md, "God's camp stands in the
// clouds", "The camps are far apart for the eye"): God far back on the cloud
// floor on his block throne and stepped base, his crowd standing in the floor
// round it, the line of souls climbing it to be blessed, his turns at glaring
// round the crowd, and the speech burning a sign. Every place is
// after/sky.js's, and every far thing goes through its depth camera.
//
// Everything up here is squares, one flat tone a shape: no flecks, no
// dither, no faces in the crowd, and no outline but God's. God's lengths are
// in sky cells (`H`), half a God-cell -- or less, where the sky is too short
// to hold the mock's layout under him -- so the picture is the mock's at
// every window. A pose is held a tick (SKY_TICK_S), the mock's quarter second.
//
// God's camp stands on a stage in the clouds (DESIGN.md, "God's camp stands
// on a stage in the clouds"; docs/mocks/act3-clouds-2026-10-19/a3platform):
// one broad paper stage tilted toward the viewer, its front a stepped plinth
// in the throne base's family, the cloud sea lapping its foot. It slides as
// one with his layer, so nothing on it skates. His crowd stands on it at a
// giant's scale, rows of separate souls with the stage between them,
// emptying from the front to bare stage as support rises. A sign is a fist
// flag planted at its spot on the stage, an aura round it (DESIGN.md, "The
// level, the two crowds and the flags"); a member it wins orbits it and
// walks the long way back across to the union's camp. A rally off a sign
// lifts the souls it passes. The bodies out on the way between are drawn
// among them: across the cloud, up the plinth, out over the top.
//
// God is a light source on either page: he, his rays, his light and his
// gaze are drawn raw (src/ink.js), outside the act's four tones, and so are
// his throne and the souls of his line, which the dark page sets apart from
// the crowd (config, AFTER_SEAT_DARK, AFTER_LINE_DARK). He takes turns: a
// while blessing the line, then a while glaring round the crowd while the
// line waits on its steps; the speech's warning makes him glare whenever it
// falls. Nothing of it is saved: it is read off the act's clock and the
// sim's speech, so a reload stands it where it was, the line give or take.
//
// The frame's cost: the throne and its base, God in each pose and every
// board are bitmaps taken once a zoom; the stage is a few fills; a soul is a
// fill. What is drawn live is the crowd, the rays, the hands, the line, the
// gaze and the bubbles.

import { S } from '../state.js';
import { P, GREY, STRIKE_SHARE, CROWD_X0, CROWD_FILES, CROWD_PITCH, AFTER_SPEECH_WARN_S,
         SKY_TICK_S, GOD_CROWD, GOD_STAGE, GOD_FLAG, GOD_RATE,
         SKY_SUPPORT_EASE, SKY_WON, SKY_FLAG, SKY_AURA, SKY_RALLY, SKY_ROAR, SKY_GRUMBLE, SKY_RING_W, SKY_RING_LIFT,
         GOD_N, GOD_EDGE, GOD_CROWN, GOD_EYES, GOD_HAND, GOD_THRONE, GOD_RAYS, GOD_IDLE, TITHE, GAZE,
         AFTER_GAZE_SETTLE_S, AFTER_BURN_S, AFTER_POSTER_FADE_S, SKY_POSTER, SKY_DRIFT,
         AFTER_SEAT_DARK, AFTER_LINE_DARK, AFTER_GAZE_EDGE, SIGN_FADE_S } from '../config.js';
import { AFTER_JOB } from '../jobs.js';
import { ctx } from './ctx.js';
import { layerAt } from './frame.js';
import { raw, darkPage } from '../ink.js';
import { afterX0, slotX, stationBox, unionJoinAt, afterFloor } from '../after/place.js';
import { support, union, souls, OUT_RIM, speechTarget } from '../after/union.js';
import { signReach } from '../after/levels.js';
import { skyFrame, godX0, stage, stageHalf, stageFore, stageSpot, stageSoul, walkSeen, deepAt } from '../after/sky.js';
import { K as INK, W, PALE, MID } from './after/kit.js';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, k) => a + (b - a) * k;
const snap = (v, q) => Math.round(v / q) * q;
const eio = u => (u < 0.5 ? 2 * u * u : 1 - 2 * (1 - u) * (1 - u));
const now = () => (S.after ? S.after.t : 0);
function hsh(a, b = 0, c = 0) {
  let h = (a * 374761393 + b * 668265263 + c * 2246822519) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

// The sky's own tones outside the four, raw: God and his light white, his
// features and outline black, on either page.
const WHITE = '#ffffff', BLACK = '#000000';
const SEAT_TONE = darkPage ? AFTER_SEAT_DARK : INK;
const LINE_TONE = darkPage ? AFTER_LINE_DARK : PALE;
const CROWN_TONE = darkPage ? WHITE : BLACK;
const RAY_TONE = darkPage ? WHITE : PALE;
// The stage's top: paper on the light page, the light ink on the dark, never
// the cloud's pale; its risers mid. His souls alternate mid and pale by row
// (the mock's second grey is a fifth tone; the act has four).
const TOP_TONE = darkPage ? INK : W;
const RISE_TONE = MID;
const SOUL_TONES = [MID, PALE];
// The union's ink: the flags, the auras and a won soul's darkening; on the
// dark page the light grey the line's souls wear, as the mocks have it.
const UNION_TONE = darkPage ? AFTER_LINE_DARK : INK;

// --- the frame's camera ---------------------------------------------------------------
// The device pixels a world pixel takes, the window's middle, the sky's
// frame, its cell and the tick, read once a frame. A rect's edges are each
// put on a whole device pixel, so a stroke stays whole at any zoom.
let K = 1, CX = 0, F = null, H = 1, TK = 0;
function camFrame() {
  K = (S.zoomShow || S.zoom) * S.dpr; CX = S.camX + S.viewW / 2; F = skyFrame();
  H = F.h;
  TK = Math.floor(now() / SKY_TICK_S);
}
const onPx = v => Math.round(v * K) / K;
// A tone: a rung of GREY by number, through the page's map; a color by
// string, raw, as written on either page.
const style = c => (typeof c === 'number' ? GREY[c] : raw(c));
function rect(x, y, w, h, tone) {
  if (tone != null) ctx.fillStyle = style(tone);
  const x0 = Math.round(x * K), y0 = Math.round(y * K);
  const ww = Math.round((x + w) * K) - x0, hh = Math.round((y + h) * K) - y0;
  if (ww > 0 && hh > 0) ctx.fillRect(x0 / K, y0 / K, ww / K, hh / K);
}
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
// scale; `paint(fill)` fills rects in a tone as `rect` takes one.
function sprite(w, h, paint) {
  const c = canvas(w * K + 1, h * K + 1), g = c.getContext('2d');
  if (!g) return c;
  g.setTransform(1, 0, 0, 1, 0, 0);
  paint((x, y, ww, hh, tone) => {
    const x0 = Math.round(x * K), y0 = Math.round(y * K);
    const a = Math.round((x + ww) * K) - x0, b = Math.round((y + hh) * K) - y0;
    g.fillStyle = style(tone);
    if (a > 0 && b > 0) g.fillRect(x0, y0, a, b);
  });
  return c;
}
const blit = (pic, x, y) => ctx.drawImage(pic, onPx(x), onPx(y), pic.width / K, pic.height / K);


// --- support, read off the sim ---------------------------------------------------------------
// The share of the way to the strike won (1 at STRIKE_SHARE), eased so the
// crowd thins smoothly; snapped on a new act or a reload. `line` is the
// line's own clock, in ticks, run only while he blesses.
const shown = { after: null, s: 0, lastT: null, line: 0, out: new Uint8Array(0), outN: 0, won: [] };
const share = () => clamp(support() / STRIKE_SHARE, 0, 1);
export const skyShare = () => shown.s;
function stepShown() {
  const A = S.after, t = now();
  if (shown.after !== A) {
    shown.after = A; shown.s = share(); shown.lastT = t; shown.won.length = 0; resyncOut();
    shown.line = lineAtOpen(t); seeAllSigns();
  }
  const gap = t - shown.lastT, dt = clamp(gap, 0, 0.25);
  shown.lastT = t;
  const want = share();
  // Time passed undrawn (the camera elsewhere, a jump of the clock): caught up.
  if (gap > 1) { shown.s = want; shown.line = lineAtOpen(t); seeAllSigns(); }
  shown.s += clamp(want - shown.s, -dt * SKY_SUPPORT_EASE, dt * SKY_SUPPORT_EASE);
  return dt;
}
// God's glare: full at the start, dimming as support rises, gone at the strike.
export const glareAlpha = () => clamp(1 - support() / STRIKE_SHARE, 0, 1);
// His rays: shorter and fainter as support rises, none at the strike.
export const raysLeft = () => 1 - shown.s;

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
const ringLift = rate => Math.max(P, snap(SKY_RING_LIFT[0] + SKY_RING_LIFT[1] * rate, P));
// What the rings do to a soul at (x, y) seen at `rate` (1 / its depth): a
// rally lifts it, a roar ducks a square of `sq` (one of two cells or less
// would duck half out of sight, so it stands), a grumble lifts it a cell.
// World px, down.
function ringsAt(x, y, rate, sq) {
  let lift = 0;
  for (const r of RINGS) {
    const w = ringW(rate) * (r.kind === 'grumble' ? 0.5 : 1);
    if (Math.abs(Math.hypot(x - r.x, y - r.y) - r.rad) >= w) continue;
    if (r.kind === 'rally') lift = Math.min(lift, -ringLift(rate));
    else if (r.kind === 'roar') { if (lift === 0 && sq > 2 * P) lift = Math.min(sq - P, snap(ringLift(rate) / 2, P)); }
    else if (lift === 0) lift = -P;
  }
  return lift;
}

// --- the stage -------------------------------------------------------------------------------
// The top a trapezoid from behind his foot forward to the main plane's line,
// and the side face the window can see (toward its middle) down its slanted
// edge. A plain shape; its front meets the main plane's path, which is drawn
// over its foot (render/after/floor.js).
function drawStage() {
  const st = stage(), G = GOD_STAGE, x = gx(), side = x > CX ? -1 : 1, sw = G.side * st.mx;
  ctx.fillStyle = style(RISE_TONE);
  for (let y = st.yb; y < st.yf; y += P) {
    const hw = Math.round(stageHalf(st, y));
    rect(side < 0 ? x - hw - sw : x + hw, y, sw, P);
  }
  ctx.fillStyle = style(TOP_TONE);
  for (let y = st.yb; y < st.yf; y += P) { const hw = Math.round(stageHalf(st, y)); rect(x - hw, y, 2 * hw, P); }
}

// --- the crowd on the stage ----------------------------------------------------------------
// Rows from the front edge back, a soul growing from the back's size to the
// front's, a gap between souls, each row stepping back a little more than
// its soul so the stage shows between rows; the throne's foot and an aisle up
// the middle kept clear. A fact of the window.
let ROWS = [], rowsKey = '';
function crowdRows() {
  const st = stage(), G = GOD_CROWD, key = `${st.yb}|${st.yf}|${st.mx}`;
  if (key === rowsKey) return ROWS;
  const out = [];
  for (let y = st.yf - P, r = 0; y > st.yb + P; r++) {
    const n = stageSoul(st, y);
    out.push({ y: snap(y, P), n, k: stageFore(st, y), r });
    y -= Math.max(P, snap(n * G.rows, P));
  }
  rowsKey = key; ROWS = out.reverse();
  return ROWS;
}
// How much a soul of row r (of n, 0 the back) at spot i stands, 0 to 1: gone
// from the front first as support rises, fading through the last of it.
function standing(r, n, i) {
  const G = GOD_CROWD, fore = n > 1 ? r / (n - 1) : 1;
  const v = (1 - shown.s) * G.keep - fore * G.fore - hsh(i, r + 9) * G.luck + G.base;
  return clamp(v / G.soft, 0, 1);
}
const drawn = { souls: 0 };
export const crowdDrawn = () => ({ ...drawn, won: shown.won.length });
// The souls of row r in view, each { r, i, x, y, w, a }: x its left, y its foot.
function rowSouls(r, R, n, out) {
  const G = GOD_CROWD, st = stage(), mid = gx(), w = R.n, gap = G.gap * st.mx, pitch = w + gap;
  const hw = stageHalf(st, R.y) - G.margin * st.mx, clear = st.throne + w / 2 + 2 * st.mx, aisle = G.aisle * st.mx + w / 2;
  let i = 0;
  for (let cx = mid - hw + ((R.r & 1) * pitch) / 2; cx < mid + hw - w; cx += pitch, i++) {
    const c = cx + w / 2;
    // behind the throne's foot, or in the aisle in front of it: kept clear
    if (R.y - w < st.throneY + P && Math.abs(c - mid) < clear) continue;
    if (R.y > st.throneY && Math.abs(c - mid) < aisle) continue;
    const x0 = mid + snap(cx - mid + (hsh(i, R.r, 5) - 0.5) * 2 * G.jit * st.mx, 2);
    if (x0 + w < S.camX - P || x0 > S.camX + S.viewW + P) continue;
    const a = standing(r, n, i);
    if (a > 0.001) out.push({ r, i, x: x0, y: R.y - (hsh(i, R.r, 6) < G.lift ? P : 0), w, a });
  }
}
// God's crowd: its rows back to front, and before each whatever stands on
// the stage behind it (`between(y)` draws what stands with its foot above
// world y, and `between(Infinity)` the rest after the front row). The one
// place the crowd's own shape is drawn, so a crowd drawn another way is this
// function and what it reads.
function drawGodsCrowd(rows, between) {
  let count = 0;
  rows.forEach((R, r) => {
    between(R.y);
    const souls = [];
    rowSouls(r, R, rows.length, souls);
    ctx.fillStyle = style(SOUL_TONES[R.r & 1]);
    for (const s of souls) {
      if (s.a > 0.5) count++;
      const lift = ringsAt(s.x + s.w / 2, s.y, 1, s.w);
      const was = ctx.globalAlpha;
      if (s.a < 1) ctx.globalAlpha = was * s.a;
      rect(s.x, s.y - s.w + lift, s.w, s.w - Math.max(0, lift));
      ctx.globalAlpha = was;
    }
  });
  drawn.souls = count;
  between(Infinity);
}

// --- souls won over ----------------------------------------------------------------------------------
// A member walking out of God's yard (union.js, `walkOuts`) beside a sign is
// a soul won by it: it lifts out of the crowd by the sign, darkening toward
// the union's ink, orbits the sign a turn and a half in held steps, then
// walks the long way across to the union's camp (place.js, `unionJoinAt`),
// out of depth toward the near layer, growing as it comes, and fades there.
// Read off the field: the slots newly emptied since the last frame, each
// matched to the nearest standing sign whose reach it is in. A member with
// no sign by it (one of the first) raises none.
function resyncOut() {
  const a = souls();
  if (shown.out.length !== a.length) shown.out = new Uint8Array(a.length);
  let n = 0;
  for (let i = 0; i < a.length; i++) { const o = a[i] === OUT_RIM ? 1 : 0; shown.out[i] = o; n += o; }
  shown.outN = n;
}
function signBy(i) {
  const f = i % CROWD_FILES, r = Math.floor(i / CROWD_FILES);
  let best = null, bd = Infinity;
  for (const q of S.after.signs) {
    if (q.burnt != null) continue;
    const d = Math.max(Math.abs(q.f - f), Math.abs(q.r - r));
    if (d <= signReach(q.big) && d < bd) { bd = d; best = q; }
  }
  return best;
}
const wonLife = () => (SKY_WON.lift + SKY_WON.orbit + SKY_WON.drift) * SKY_TICK_S;
function pickWon() {
  const a = souls(), n = union(), t = now();
  if (shown.won.length) shown.won = shown.won.filter(w => t - w.t0 < wonLife());
  if (n === shown.outN && shown.out.length === a.length) return;
  if (n < shown.outN) { resyncOut(); return; }
  if (shown.out.length !== a.length) {
    const o = new Uint8Array(a.length);
    o.set(shown.out.subarray(0, Math.min(a.length, shown.out.length)));
    shown.out = o;
  }
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== OUT_RIM || shown.out[i]) continue;
    shown.out[i] = 1;
    if (S.view !== 'after' || shown.won.length >= SKY_WON.most) continue;
    const q = signBy(i);
    if (q) shown.won.push({ t0: t, f: q.f, r: q.r, big: q.big });
  }
  shown.outN = n;
}
// Where a won soul is `T` ticks on: its middle in the world, its side, its
// alpha, how dark it has gone (0 the crowd's tone, 1 the union's ink), its
// painting order, and whether it has left its sign for the walk back.
function wonAt(w, T) {
  const W0 = SKY_WON, g = flagBox(w), R = auraR(g, 0) * g.U, st = stage(), sz = stageSoul(st, g.foot), top = g.foot - sz;
  const o = { a: 1, ord: g.foot, sz };
  if (T < W0.lift) { const u = T / W0.lift; return { ...o, x: g.cx + R * 0.7, y: lerp(top, g.cy + R * 0.7, u), dk: 0.3 * u, out: false }; }
  if (T < W0.lift + W0.orbit) {
    const ang = Math.PI / 4 + Math.floor((T - W0.lift) / W0.step) * Math.PI / 4;
    return { ...o, x: g.cx + Math.cos(ang) * R, y: g.cy + Math.sin(ang) * R, dk: 0.3 + 0.7 * (T - W0.lift) / W0.orbit, out: false };
  }
  // The walk back, the carriers' way the other way about: across the top to
  // its front corner, down the plinth, and back over the cloud to the
  // union's camp (after/sky.js, `walkSeen`), fading there.
  const u = Math.min(1, (T - W0.lift - W0.orbit) / W0.drift), to = unionJoinAt();
  const ang = Math.PI / 4 + (W0.orbit / W0.step) * Math.PI / 4, x0 = g.cx + Math.cos(ang) * R, y0 = g.cy + Math.sin(ang) * R;
  const fade = u < 1 - W0.fade ? 1 : (1 - u) / W0.fade;
  const A = W0.top, B = W0.top + W0.down;
  if (u < A) {
    // over the top to the front corner, coming down to its feet as it goes
    const k = u / A, c = stageSpot(0, 0), cx = gx() + c.dx, foot = lerp(g.foot, st.yf - P, k), s = lerp(sz, stageSoul(st, st.yf), k);
    return { x: lerp(x0, cx, k), y: lerp(y0, foot - s / 2, Math.min(1, k * 3)), sz: s, a: fade, dk: 1, out: true, ord: foot };
  }
  // then the sim's way back: down the plinth, and across the cloud
  const edge = CROWD_X0 - CROWD_PITCH;
  const x = u < B ? lerp(CROWD_X0 + P, edge, (u - A) / (B - A)) : lerp(edge, to.x, (u - B) / (1 - B));
  const v = walkSeen(x, afterFloor(), CX);
  return { x: v.x, y: v.y - v.s / 2, sz: v.s, a: fade, dk: 1, out: true, ord: v.ord };
}
// The won souls with their feet above world y and not yet drawn, at their
// signs or on their way back.
function drawWon(y0) {
  const t = now();
  for (const w of shown.won) {
    if (w.drawn === TK) continue;
    const T = Math.floor((t - w.t0) / SKY_TICK_S), p = wonAt(w, T);
    if (p.ord > y0) continue;
    w.drawn = TK;
    const sz = p.sz, x = snap(p.x - sz / 2, 1), y = snap(p.y - sz / 2, 1);
    if (!inView(x, sz)) continue;
    alpha(p.a, () => { rect(x, y, sz, sz, SOUL_TONES[0]); alpha(p.dk, () => rect(x, y, sz, sz, UNION_TONE)); });
  }
}

// --- God ---------------------------------------------------------------------------------------------
// Everything of his in sky cells off his middle (x) and his square's top at
// rest (y), the mock's: his square 0 to GOD_N down, the seat under it.
const SEAT = GOD_N;
// God's middle (after/sky.js, `godMid`) as his layer's own slide: a fixed
// place on a whole device pixel plus the layer's offset on one of its own,
// as render/after/ground.js lays its layers. Everything of his camp is laid
// off it, so the camp moves as one piece and never wobbles a pixel against
// the camera's own rounding.
const gx = () => Math.round(godX0() * K) / K + layerAt(0, GOD_RATE, F.XR);
const godFoot = () => ({ x: gx(), y: F.gy0 + (SEAT + GOD_THRONE.seatH) * H });
const cache = { key: '', throne: null, poses: new Map(), signs: new Map() };
function freshCaches() {
  const key = `${K}|${H}|${F.top}|${F.W}`;
  if (key === cache.key) return;
  cache.key = key; cache.throne = null;
  cache.poses.clear(); cache.signs.clear();
}
// The steps of the base, down from under the seat to his foot in the cloud.
const baseSteps = () => Math.max(1, Math.ceil((F.bank - F.gy0 - (SEAT + GOD_THRONE.seatH) * H) / (GOD_THRONE.step * H)));

// The block throne and its stepped base (the mock's): a back up to his
// cheeks, a broad seat under him, and below the seat steps a soul's width
// out a step, down to his foot in the cloud. One tone, black on the light page.
function throne() {
  if (cache.throne) return cache.throne;
  const T = GOD_THRONE, n = baseSteps(), X0 = -(T.baseHalf + T.step * n), Y0 = T.backTop;
  const foot = (F.bank - F.gy0) / H;
  const pic = sprite(-2 * X0 * H, (foot - Y0) * H, fill => {
    const f = (x, y, w, h) => fill((x - X0) * H, (y - Y0) * H, w * H, h * H, SEAT_TONE);
    f(-T.backHalf, T.backTop, 2 * T.backHalf, SEAT - T.backTop);
    f(-T.seatHalf, SEAT, 2 * T.seatHalf, T.seatH);
    for (let k = 0; k < n; k++) {
      const y = SEAT + T.seatH + T.step * k;
      f(-T.baseHalf - T.step * k, y, 2 * (T.baseHalf + T.step * k), Math.min(T.step, foot - y));
    }
  });
  pic.X0 = X0; pic.Y0 = Y0;
  return (cache.throne = pic);
}
// God's face (docs/mocks/act3-god-2026-10-19, face (c), the owner's pick):
// on the surface a calm square -- level lids over visible pupils, a quiet
// smile -- and a roar opens his mouth. Unmasked, once the unmask beat has
// played, he is Satan: the horns come in, heavy brows over the lids, the
// smile drops, the roar bares teeth.
export const godFace = () => (S.beatsDone.includes('unmask') ? 'unmasked' : 'serene');
const HORN = [[-3, -4], [-5, -8], [-5, -12], [-3, -16]];
// God himself in one pose: a white square outlined in ink, his face and the
// halo-crown over him. `br` his breath (a cell up), `look` his pupils in
// cells, `lit` his eyes lit from inside while he glares.
function godSprite(br, look, lit, roaring, face = godFace()) {
  const key = `${face}|${br}|${look}|${lit ? 1 : 0}|${roaring ? 1 : 0}`;
  let pic = cache.poses.get(key);
  if (pic) return pic;
  const N = GOD_N, E = GOD_EDGE, X0 = -N / 2 - 12, Y0 = -GOD_CROWN.up - 14, mask = face === 'unmasked';
  pic = sprite((N + 24) * H, (SEAT - Y0 + 1) * H, fill => {
    const f = (x, y, w, h, tone) => fill((x - X0) * H, (y - Y0) * H, w * H, h * H, tone);
    const x0 = -N / 2, y0 = -br;
    if (mask) for (const side of [0, 1]) for (const [hx, hy] of HORN) {
      const x = side ? x0 + N - hx - 4 : x0 + hx, y = y0 + hy;
      f(x - E, y - E, 4 + 2 * E, 4 + 2 * E, BLACK);
    }
    if (mask) for (const side of [0, 1]) for (const [hx, hy] of HORN) f(side ? x0 + N - hx - 4 : x0 + hx, y0 + hy, 4, 4, WHITE);
    f(x0 - E, y0 - E, N + 2 * E, SEAT - y0 + E, BLACK);
    f(x0, y0, N, SEAT - y0, WHITE);
    const ey = y0 + GOD_EYES.y;
    for (const ox of GOD_EYES.x) {
      if (mask) {
        // heavy brows stepping down to the nose
        const inner = ox < N / 2 ? ox + GOD_EYES.w - 4 : ox;
        f(x0 + ox, ey - 4, GOD_EYES.w, 2, BLACK); f(x0 + inner, ey - 2, 4, 2, BLACK);
      }
      f(x0 + ox, ey, GOD_EYES.w, 2, BLACK);
      if (lit) { f(x0 + ox + 2 + look, ey + 2, 6, 4, BLACK); f(x0 + ox + 3 + look, ey + 3, 4, 2, WHITE); }
      else f(x0 + ox + 3 + look, ey + 2, 4, 2, BLACK);
    }
    if (roaring) {
      f(x0 + 12, y0 + 25, 16, 6, BLACK);
      if (mask) for (const tx of [14, 18, 22, 25]) f(x0 + tx, y0 + 25, 2, 2, WHITE);
    } else if (mask) f(x0 + 12, y0 + 28, 16, 2, BLACK);
    else { f(x0 + 12, y0 + 26, 2, 2, BLACK); f(x0 + 14, y0 + 28, 12, 2, BLACK); f(x0 + 26, y0 + 26, 2, 2, BLACK); }
    // the halo-crown: a ring seen edge on over his head, points standing on
    // its back rim, every cell two square
    const C = GOD_CROWN, cy = y0 - C.up, cells = new Set();
    for (let i = 0; i < 160; i++) {
      const a = i / 160 * 2 * Math.PI;
      cells.add(2 * Math.floor((N / 2 + Math.cos(a) * (N / 2 + C.rx)) / 2) + ',' + 2 * Math.round((cy + Math.sin(a) * C.ry) / 2));
    }
    for (const [x, h] of C.points) for (let k = 2; k <= h; k += 2) cells.add(x + ',' + (2 * Math.round(cy / 2) - 2 - k));
    for (const c of cells) { const [x, y] = c.split(',').map(Number); f(x0 + x, y, 2, 2, CROWN_TONE); }
  });
  pic.X0 = X0; pic.Y0 = Y0;
  if (cache.poses.size > 128) cache.poses.clear();
  cache.poses.set(key, pic);
  return pic;
}
// A hand: a white square outlined like him, its top left in cells.
function hand(x, y) {
  const E = GOD_EDGE, s = GOD_HAND.w, ox = gx(), oy = F.gy0;
  rect(ox + (x - E) * H, oy + (y - E) * H, (s + 2 * E) * H, (s + 2 * E) * H, BLACK);
  rect(ox + x * H, oy + y * H, s * H, s * H, WHITE);
}
const handsRest = () => ({ l: [-GOD_N / 2 - 10, SEAT + GOD_HAND.rest], r: [GOD_N / 2 + 4, SEAT + GOD_HAND.rest] });

// His rays: runs of square cells out from his middle, turning a step a tick,
// shortening and fading as support rises; pale on the light page, his light
// on the dark.
function drawRays() {
  const R = GOD_RAYS, left = raysLeft();
  if (left < 0.02) return;
  const ox = gx(), oy = F.gy0 + (GOD_N / 2) * H, th = TK * R.turn, c = R.cell;
  alpha((darkPage ? R.dark : 1) * left, () => {
    ctx.fillStyle = style(RAY_TONE);
    for (let i = 0; i < R.n; i++) {
      const a = th + i / R.n * Math.PI * 2, len = (i % 2 ? R.short : R.long) * left;
      for (let d = R.r; d < R.r + len; d += c) {
        const x = c * Math.round(Math.cos(a) * d / c), y = c * Math.round(Math.sin(a) * d / c);
        rect(ox + x * H, oy + y * H, c * H, c * H);
      }
    }
  });
}

// --- the turns -------------------------------------------------------------------------------------
// How much he glares, 0 to 1: on his own turns, a phase blessing and a phase
// glaring, each turn fading in and out over two ticks; and whenever the
// speech is warned or burning, whatever the turn.
const PH = TITHE.phase * SKY_TICK_S, RAMP = 2 * SKY_TICK_S;
function glaring() {
  const t = now(), p = ((t % (2 * PH)) + 2 * PH) % (2 * PH);
  let g = p < PH ? 0 : Math.min(1, (p - PH) / RAMP, (2 * PH - p) / RAMP);
  const sp = S.after.speech;
  if (speechTarget() && sp) g = Math.max(g, clamp((t - (sp.next - AFTER_SPEECH_WARN_S)) / RAMP, 0, 1));
  const b = sp?.burnt;
  if (b && t >= b.at) g = Math.max(g, clamp((b.at + AFTER_BURN_S + RAMP - t) / RAMP, 0, 1));
  return g;
}
// The line's clock where the act stood at `t`: every tick of his blessing
// turns so far, offset so a turn falls between two blessings.
function lineAtOpen(t) {
  const T = Math.floor(t / SKY_TICK_S), P2 = 2 * TITHE.phase;
  return Math.floor(T / P2) * TITHE.phase + Math.min(((T % P2) + P2) % P2, TITHE.phase) + TITHE.offset;
}

// For a scene: where the line and his turns stand at the act's clock, as the
// first frame drawn after a jump of the clock draws them.
export function skyMoment() {
  if (!S.after) return null;
  camFrame();
  const d = lineAtOpen(now()) - baseSteps() * TITHE.climb, b = d - Math.floor(d / TITHE.gap) * TITHE.gap;
  return { bless: d >= 0 && b < TITHE.bless ? b / TITHE.bless : null, glare: glaring() };
}

// --- the line and the blessing -------------------------------------------------------------------
// A soul starts up out of the crowd every `gap` ticks and climbs the middle
// of the base a step every `climb`; on the top step he blesses it -- both
// hands in either side, its square edged in his light and short rays
// standing out from its edges, widening and fading in held steps, its load
// fading in his hands -- and it walks off a cell a tick along the seat and
// down the base's side, back behind the crowd. Every soul is a fact of the
// line's clock, so the line runs for as long as the act.
const S4 = TITHE.soul, STEP = GOD_THRONE.step;
const TOP = [-S4 / 2, SEAT + GOD_THRONE.seatH - S4];
const levelY = k => TOP[1] + STEP * k;
// The walk off, a cell a tick: along the top step, then down the base's
// side, a step down each time its left edge passes a step's end, so it
// stands on each tread in turn.
function walkAt(w, n) {
  const x = TOP[0] + w, edge = GOD_THRONE.baseHalf;
  const k = x < edge ? 0 : Math.floor((x - edge) / STEP) + 1;
  return k > n ? null : [x, levelY(k)];
}
function blessing(b) {
  const T = TITHE, u = b / T.bless, rest = handsRest();
  const at = { l: [TOP[0] - 9, TOP[1] - 1], r: [TOP[0] + 7, TOP[1] - 1] };
  const k = u < T.in ? eio(u / T.in) : u < T.back ? 1 : 1 - eio(clamp((u - T.back) / T.in, 0, 1));
  const mix = (a, c) => [Math.round(lerp(a[0], c[0], k)), Math.round(lerp(a[1], c[1], k))];
  return { l: mix(rest.l, at.l), r: mix(rest.r, at.r), light: u >= T.light && u < T.out ? (u - T.light) / (T.out - T.light) : null,
           load: clamp(1 - Math.floor((u - T.light) / (T.back - T.light) * 4) / 4, 0, 1) };
}
// The light round the blessed soul's square, in held steps.
function glow(L) {
  const st4 = Math.floor(L * 4), ox = gx(), oy = F.gy0, [x, y] = TOP;
  const c = (cx, cy, w, h) => rect(ox + cx * H, oy + cy * H, w * H, h * H, WHITE);
  c(x - 1, y - 1, S4 + 2, S4 + 2);
  alpha(1 - st4 / 4, () => {
    const len = 2 + st4, mx = x + S4 / 2, my = y + S4 / 2;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, -1], [0, 1], [1, -1], [-1, -1]])
      for (let d = 5; d < 5 + len; d++) c(mx + dx * d - 1, my + dy * d - 1, 1, 1);
  });
}
// The line drawn, and what his hands are doing for God's own drawing.
function drawLine() {
  const T = TITHE, L = Math.floor(shown.line), n = baseSteps(), climbT = n * T.climb, s = shown.s;
  const ox = gx(), oy = F.gy0, thin = Math.min(0.93, s * 1.05);
  let hands = null;
  const soul = (x, y, i, load) => {
    const pres = clamp((hsh(i, 0, 80) + 0.2 - 1.2 * thin) / 0.2, 0, 1);
    alpha(pres, () => {
      rect(ox + x * H, oy + y * H, S4 * H, S4 * H, LINE_TONE);
      // the load: a plank, or a sheaf every third soul, a cell clear over it
      alpha(load, () => (i % 3 === 0 ? rect(ox + (x) * H, oy + (y - 3) * H, S4 * H, 2 * H) : rect(ox + (x - 1) * H, oy + (y - 2) * H, (S4 + 2) * H, H)));
    });
  };
  for (let i = Math.floor(L / T.gap); i >= 0; i--) {
    const age = L - i * T.gap;
    if (age < climbT) { soul(TOP[0], levelY(n - 1 - Math.floor(age / T.climb)), i, 1); continue; }
    const b = age - climbT;
    if (b < T.bless) {
      const B = blessing(b);
      hands = B;
      if (B.light != null) glow(B.light);
      soul(TOP[0], TOP[1], i, B.load);
      continue;
    }
    const p = walkAt(b - T.bless, n - 1);
    if (!p) break;
    soul(p[0], p[1], i, 0);
  }
  return hands;
}
function drawGod(gz) {
  const t = now(), br = (TK % GOD_IDLE.breath) < GOD_IDLE.breath / 2 ? 0 : 1;
  const roaring = EV.roars.some(r => r.kind === 'roar' && t - r.at < SKY_ROAR.mouth);
  const look = gz.g > 0 ? clamp(Math.round((gz.x - gx()) / (GOD_N * H)), -2, 2) : [0, 2, 0, -2][Math.floor(TK / GOD_IDLE.look) % 4];
  const pic = godSprite(br, look, gz.g > 0, roaring);
  blit(pic, gx() + pic.X0 * H, F.gy0 + pic.Y0 * H);
}

// --- the gaze ----------------------------------------------------------------------------------------
// Glaring, it sweeps the crowd in held steps; warned, it moves onto the mark
// and narrows on it in three steps, and holds there while the speech burns it.
const GZ0 = { g: 0, x: 0, y: 0, w: GAZE.w, on: null };
// Where on the stage the sweep runs: across its middle.
const gazeY = () => { const st = stage(); return snap((st.yb + st.yf) / 2, P); };
// The spot's scale: as wide, against a soul there, as the mock's against a
// near soul.
const gazeK = () => stageSoul(stage(), gazeY()) / (GAZE.soul * H);
function gazeNow() {
  const g = glaring();
  if (g <= 0) return { ...GZ0, x: gx(), y: gazeY() };
  const A = S.after, sp = A.speech, t = now(), Tq = TK * SKY_TICK_S;
  const pts = GAZE.sweep, i = Math.floor(TK / GAZE.hold) % pts.length, k = (TK % GAZE.hold) / GAZE.move;
  // The sweep's points are shares of the stage across, either side of him.
  const y = gazeY(), reach = 2 * stageHalf(stage(), y);
  let x = gx() + lerp(pts[i], pts[(i + 1) % pts.length], eio(Math.min(1, k))) * reach, w = GAZE.w, on = null, yy = y;
  const target = speechTarget();
  const onThing = (kind, q) => { const b = thingAt(kind, q); return { x: b.x + b.w / 2, y: b.y + b.h / 2 }; };
  if (target && sp) {
    const kind = A.signs.includes(target) ? 'sign' : 'poster', m = onThing(kind, target);
    const tau = Tq - (sp.next - AFTER_SPEECH_WARN_S), span = (AFTER_SPEECH_WARN_S - AFTER_GAZE_SETTLE_S) / GAZE.narrow.length;
    if (tau < AFTER_GAZE_SETTLE_S) { const e = eio(clamp(tau / AFTER_GAZE_SETTLE_S, 0, 1)); x = lerp(x, m.x, e); yy = lerp(y, m.y, e); }
    else { x = m.x; yy = m.y; w = GAZE.narrow[Math.min(GAZE.narrow.length - 1, Math.floor((tau - AFTER_GAZE_SETTLE_S) / span))]; }
    on = target;
  } else if (sp?.burnt && t >= sp.burnt.at && t - sp.burnt.at < AFTER_BURN_S + 1) {
    // held on the ash, then back to the sweep
    const q = (sp.burnt.kind === 'sign' ? A.signs : A.posters).find(o => o.id === sp.burnt.id);
    const m = q ? onThing(sp.burnt.kind, q) : null;
    if (m) {
      const e = eio(clamp((Tq - sp.burnt.at - AFTER_BURN_S) / 1, 0, 1));
      x = lerp(m.x, x, e); yy = lerp(m.y, y, e); w = Math.round(lerp(GAZE.narrow[GAZE.narrow.length - 1], GAZE.w, e));
    }
  }
  return { g, x: snap(x, H), y: snap(yy, H), w, on };
}
// A cone of his light from his eyes, across his face, to a round spot on the
// crowd: a body of his light, each edge a line of the gaze's grey two cells
// thick, the spot a stepped disc flattened to lie on the crowd, its rim the
// same grey.
function drawGaze(gz) {
  if (gz.g <= 0) return;
  const ox = gx(), oy = F.gy0, eyeY = GOD_EYES.y + 2, fx = (gz.x - ox) / H, fy = (gz.y - oy) / H;
  const y0 = eyeY + 2, y1 = Math.round(fy) + 4;
  if (y1 <= y0) return;
  const c = (x, y, w, h, tone) => rect(ox + x * H, oy + y * H, w * H, h * H, tone);
  alpha(gz.g, () => {
    let pl = null, pr = null;
    for (let y = y0; y <= y1; y++) {
      const k = (y - y0) / (y1 - y0), cx = Math.round(lerp(0, fx, k));
      const hw = Math.max(2, Math.round(lerp(GAZE.w0, gz.w * gazeK(), k)));
      const l = cx - hw - 1, r = cx + hw;
      alpha(darkPage ? GAZE.bodyDark : GAZE.body, () => c(l + 1, y, r - l - 1, 1, WHITE));
      // each edge a joined line two cells thick: a run across to where the row above left off
      const run = (x, px) => { const a = px == null ? x : Math.min(x, px), b = px == null ? x : Math.max(x, px); c(a, y, b - a + 2, 1, AFTER_GAZE_EDGE); };
      run(l - 1, pl); run(r, pr);
      pl = l - 1; pr = r;
    }
    // The spot lies on the crowd at its own scale.
    const hw = Math.max(3, Math.round(gz.w * gazeK()));
    const ry = Math.max(2, Math.round(hw * GAZE.flat)), rows = [], sx = Math.round(fx), sy = Math.round(fy);
    for (let dy = -ry; dy <= ry; dy++) rows.push([dy, Math.round(hw * Math.sqrt(1 - (dy / (ry + 0.5)) ** 2))]);
    alpha(darkPage ? GAZE.spotDark : GAZE.spot, () => { for (const [dy, w] of rows) c(sx - w, sy + dy, 2 * w, 1, WHITE); });
    rows.forEach(([dy, w], i) => {
      const out = Math.max(i ? rows[i - 1][1] : 0, i < rows.length - 1 ? rows[i + 1][1] : 0);
      if (dy === -ry || dy === ry) { c(sx - w - 1, sy + dy, 2 * w + 2, 1, AFTER_GAZE_EDGE); return; }
      c(sx - w - 1, sy + dy, Math.max(1, w - out + 1), 1, AFTER_GAZE_EDGE);
      c(sx + Math.min(w, out), sy + dy, Math.max(1, w - out + 1), 1, AFTER_GAZE_EDGE);
    });
  });
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
  const t = now(), x0 = gx() - (GOD_N / 2) * H, x1 = gx() + (GOD_N / 2) * H;
  for (const r of EV.roars) {
    const tau = t - r.at, life = r.kind === 'roar' ? SKY_ROAR.bubble : SKY_GRUMBLE.bubble;
    if (tau > life || tau < 0) continue;
    const a = Math.min(1, tau / 0.2) * (tau > life - 0.4 ? (life - tau) / 0.4 : 1);
    const gp = r.kind === 'roar' ? Math.round((r.big ? 1.5 : 1.0) * H * 1.33) : Math.max(2, Math.round(H * 0.67));
    const glyphW = r.g.reduce((s, k) => s + GL[k][0].length + 1, -1);
    const bw = (glyphW + 4) * gp, bh = 12 * gp;
    const bx = r.kind === 'roar' ? x1 + 6 * H : x0 - 6 * H - bw;
    const by = r.kind === 'roar' ? F.gy0 - 10 * H - bh * 0.4 : F.gy0 + 4 * H;
    const ink = r.kind === 'roar' ? INK : MID, u = Math.max(2, gp);
    alpha(a, () => {
      rect(bx + u, by, bw - 2 * u, bh, ink); rect(bx, by + u, bw, bh - 2 * u, ink);
      rect(bx + u, by + u, bw - 2 * u, bh - 2 * u, W);
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

// --- signs and posters --------------------------------------------------------------------------------
// A sign is a flag (docs/mocks/act3-level-2026-10-19, a3flag, the fist):
// planted at its spot on the stage (after/sky.js, `stageSpot`), at a readable
// size, bigger toward the front, among the souls in front of and behind it.
// A poster is on the stage's front edge.
const rallied = q => EV.rallies.some(r => r.thing.q === q && now() - r.at < SKY_RALLY.lift);
// A flag's cell, world px, for a flag `n` stage cells tall: the cloth about
// as wide as the flag is tall.
const flagU = n => Math.max(1, Math.round(n * stage().mx / SKY_FLAG.w));
// A flag's box: `px` its pole's left, the flag a flag cell (`U`) right of
// it, `y` its top at rest, its middle (`cx`, `cy`), and `foot` its pole's
// foot on the stage.
function flagBox(q) {
  const st = stage(), sp = stageSpot(q.f, q.r), foot = snap(sp.y, P), U = flagU(lerp(GOD_FLAG.n[0], GOD_FLAG.n[1], stageFore(st, foot)));
  const FL = SKY_FLAG, px = snap(gx() + sp.dx, 1), w = FL.w * U, h = FL.h * U;
  const y = foot - stageSoul(st, foot) - FL.up * U - h - (q.id != null && rallied(q) ? U : 0);
  return { foot, U, px, x: px + U, y, w, h, cx: px + U + w / 2, cy: y + h / 2 };
}
// A poster on the stage's front edge, at its slot along it.
function posterBox(q) {
  const st = stage(), f = (slotX(q.slot) - CROWD_X0 - P) / CROWD_PITCH, sp = stageSpot(f, 0), foot = snap(st.yf - P, P);
  const U = flagU(GOD_FLAG.n[0]), PO = SKY_POSTER, w = PO.w * U, h = PO.h * U;
  const x = snap(gx() + sp.dx - w / 2, 1);
  const y = foot - PO.up * U - h - (rallied(q) ? U : 0);
  return { foot, U, x, y, w, h };
}
// Where a sign or poster is drawn (its flag's or its sheet's box), for the
// rings and the gaze.
function thingAt(kind, q) {
  const g = kind === 'poster' ? posterBox(q) : flagBox(q);
  return { x: g.x, y: g.y, w: g.w, h: g.h, poster: kind === 'poster' };
}
// The flag in one of its ripple's poses (a3flag's): columns a third of a
// flag cell (`U` world px) wide, each dropped by a sine along the flag in
// thirds of a cell, the fist riding the same ripple. `fist` the fist's tone
// (paper; pale, then ink, as it chars).
function flagSprite(U, phase, fist) {
  const key = `f${U}|${phase}|${fist}`;
  let pic = cache.signs.get(key);
  if (pic) return pic;
  // A column a third of a cell, or a pixel where a cell is under three.
  const FL = SKY_FLAG, t = Math.max(1, U / 3), per = U / t, A = Math.max(1, Math.round(FL.amp * per)), cols = Math.round(FL.w * per);
  pic = sprite(FL.w * U, FL.h * U + 2 * A * t, fill => {
    for (let i = 0; i < cols; i++) {
      const d = Math.round(Math.sin(i / per - phase / FL.phases * Math.PI * 2) * FL.amp * per), y0 = (A + d) * t;
      fill(i * t, y0, t, FL.h * U, UNION_TONE);
      const gi = Math.floor(i / per) - FL.x;
      if (gi >= 0 && gi < FL.fist[0].length) FL.fist.forEach((row, j) => { if (row[gi] === 'X') fill(i * t, y0 + (FL.y + j) * U, t, U, fist); });
    }
  });
  cache.signs.set(key, pic);
  return pic;
}
// The poster's sheet: paper, the fist in ink on it, flat.
function posterSprite(U, sheet, fist) {
  const key = `p${U}|${sheet}|${fist}`;
  let pic = cache.signs.get(key);
  if (pic) return pic;
  const PO = SKY_POSTER;
  pic = sprite(PO.w * U, PO.h * U, fill => {
    fill(0, 0, PO.w * U, PO.h * U, sheet);
    SKY_FLAG.fist.forEach((row, j) => [...row].forEach((ch, i) => { if (ch === 'X') fill((PO.x + i) * U, (PO.y + j) * U, U, U, fist); }));
  });
  cache.signs.set(key, pic);
  return pic;
}
// A sign's aura, in flag cells across the half: breathing a cell.
const auraR = (g, breath) => Math.round(SKY_AURA.r * SKY_FLAG.w) + SKY_AURA.pad + breath;
function discSprite(R, U) {
  const key = `d${R}|${U}`;
  let pic = cache.signs.get(key);
  if (pic) return pic;
  pic = sprite((2 * R + 1) * U, (2 * R + 1) * U, fill => {
    for (let dy = -R; dy <= R; dy++) { const w = Math.round(Math.sqrt(R * R - dy * dy)); fill((R - w) * U, (R + dy) * U, 2 * w * U, U, UNION_TONE); }
  });
  cache.signs.set(key, pic);
  return pic;
}
// The aura: a faint disc of the union's ink round the flag, and a ring of
// ink squares on its rim turning slowly round it.
function drawAura(g, q) {
  const AU = SKY_AURA, U = g.U, R = auraR(g, (Math.floor(TK / AU.breath) + q.f) % 2);
  const cx = snap(g.cx, 1), cy = snap(g.cy, 1);
  alpha(darkPage ? AU.discDark : AU.disc, () => blit(discSprite(R, U), cx - R * U, cy - R * U));
  alpha(AU.ring, () => {
    ctx.fillStyle = style(UNION_TONE);
    const m = Math.max(10, Math.round(R * AU.per));
    for (let i = 0; i < m; i += 2) {
      const a = (i + Math.floor(TK / AU.turn) * 0.5) / m * Math.PI * 2;
      rect(snap(cx + Math.cos(a) * R * U - U / 2, 1), snap(cy + Math.sin(a) * R * U - U / 2, 1), U, U);
    }
  });
}
// A flag, its aura behind it. Burning, a flag chars in held steps -- the
// fist going pale, then all ink -- and fades by the time it is gone.
// When each sign was first seen, so one planted while the act is watched
// fades in rather than popping; those standing when the drawing catches up
// (a new act, a reload, a jump of the clock) are simply there. Drawing state.
const seenSigns = new Map();
function seeAllSigns() {
  seenSigns.clear(); for (const q of S.after.signs) seenSigns.set(q.id, -Infinity);
  carrying.clear(); setDown = [];
}
function drawFlag(q) {
  const t = now(), phase = TK % SKY_FLAG.phases;
  if (!seenSigns.has(q.id)) seenSigns.set(q.id, t);
  const born = clamp((t - seenSigns.get(q.id)) / SIGN_FADE_S, 0, 1);
  const g = flagBox(q), per = g.U / Math.max(1, g.U / 3), A = Math.max(1, Math.round(SKY_FLAG.amp * per)) * Math.max(1, g.U / 3);
  if (!inView(g.px - 40 * g.U, g.w + 80 * g.U)) return;
  const u = q.burnt == null ? null : clamp((t - q.burnt) / AFTER_BURN_S, 0, 1), st = u == null ? -1 : Math.floor(u * 4);
  const fist = st < 0 ? W : st === 0 ? PALE : UNION_TONE;
  alpha(born * (u == null ? 1 : u < 0.5 ? 1 : 1 - (u - 0.5) / 0.5), () => {
    if (u == null) drawAura(g, q);
    rect(g.px, g.y - A, g.U, g.foot - g.y + A, UNION_TONE);
    blit(flagSprite(g.U, (phase + q.f) % SKY_FLAG.phases, fist), g.x, g.y - A);
  });
}
function drawPoster(q) {
  const t = now(), g = posterBox(q);
  if (!inView(g.x - 20, g.w + 40)) return;
  const fading = q.torn != null ? clamp(1 - (t - q.torn) / AFTER_POSTER_FADE_S, 0, 1) : 1;
  const u = q.burnt == null ? null : clamp((t - q.burnt) / AFTER_BURN_S, 0, 1), st = u == null ? -1 : Math.floor(u * 4);
  alpha(fading * (u == null || u < 0.5 ? 1 : 1 - (u - 0.5) / 0.5), () => {
    rect(snap(g.x + g.w / 2 - g.U / 2, 1), g.y + g.h, g.U, g.foot - g.y - g.h, UNION_TONE);
    blit(posterSprite(g.U, st < 0 ? W : st === 0 ? PALE : UNION_TONE, UNION_TONE), g.x, g.y);
  });
}

// --- bodies out on the way, and on the stage ---------------------------------------------------------
// The sim's walk past the union's camp is short; the eye's crosses the cloud,
// climbs the plinth and spreads over the top (after/sky.js, `walkSeen`). On
// the near layer a body is drawn as the camp draws it (render/after.js), the
// two crossed over the first cells of the way so nothing pops.
export function seenAt(x, y) {
  if (!S.after) return { x, y, k: 1 };
  camFrame();
  const v = walkSeen(x, y, CX);
  return { x: v.x, y: v.y, k: v.s / (3 * P), ord: v.ord };
}
// A body there: one of the union's, as its crowd is drawn (render/after/
// unioncrowd.js) -- a mid body under a cap of the union's ink, so out on God's
// stage it is never taken for one of his souls -- its size the way's; its
// load over it.
function body(w) {
  const v = seenAt(w.x, w.y), u = P * v.k, s = u * 3;
  const x = onPx(v.x - s / 2), y = onPx(v.y - s);
  alpha(deepAt(w.x), () => {
    rect(x, y, s, s, MID);
    rect(x, y, s, Math.max(2, Math.round(s / 5)), UNION_TONE);
    if (w.load === 'log') rect(x - u, y - u, u * 5, u, PALE);
    else if (w.load === 'sign') carriedSign(x, y, u);
    else if (w.load === 'posters') rect(x, y - u, u * 3, u, PALE);
    else if (w.load === 'tip') rect(x, y - u, u * 2, u, PALE);
    if (w.swing != null) {
      if (w.job === AFTER_JOB.AGITATE) { rect(x + u, y - u * 5, u, u * 2, INK); rect(x + u, y - u * 2, u, u, INK); }
      else for (let k = 1; k <= 2; k++) rect(x + (w.face > 0 ? 2 + k : -k) * u, y - k * u, u, u, INK);
    }
  });
}

// A carried sign over a body's head at (x, y), u its cell.
function carriedSign(x, y, u) { rect(x + u, y - u, u, u, INK); rect(x, y - u * 2, u * 3, u, UNION_TONE); }
// A sign set down: when a carrier's load goes from a sign to nothing it has
// planted it, and the sign it carried fades out where it was, on the stage,
// over the span the planted flag fades in over (`drawFlag`). Drawing state.
const carrying = new Map();
let setDown = [];
function watchSigns() {
  const t = now(), gm = gx();
  for (const w of S.after.bodies) {
    const was = carrying.get(w.id);
    if (was === 'sign' && w.load !== 'sign') {
      const v = seenAt(w.x, w.y), u = P * v.k, s = u * 3;
      setDown.push({ at: t, dx: v.x - s / 2 - gm, y: v.y - s, u, ord: v.ord + 0.3 });
    }
    carrying.set(w.id, w.load);
  }
  setDown = setDown.filter(g => t - g.at < SIGN_FADE_S && t >= g.at);
}
function drawSetDown(g) {
  alpha(1 - (now() - g.at) / SIGN_FADE_S, () => carriedSign(onPx(gx() + g.dx), onPx(g.y), g.u));
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
    if (inView(x, 6)) alpha(a, () => rect(x, y, 6, 6, MID));
  }
}

// --- the layers ------------------------------------------------------------------------------------
// God's camp, back to front: his rays, the stage, the throne on it, God and
// his hands, the line, then his crowd's rows back to front with what stands
// on the stage among them by where its foot is -- the flags, the posters on
// its front edge, the won souls, the bodies out on the way -- and the gaze
// over them all.
let GZ = null;
export function drawSkyCrowd() {
  if (!S.after) return;
  camFrame();
  freshCaches();
  const dt = stepShown();
  EV = eventsNow();
  RINGS = ringsNow();
  GZ = gazeNow();
  // The line waits on its steps while he glares; it slows as support rises
  // and stands still at the strike.
  if (GZ.g <= 0 && shown.s < 0.98) shown.line += dt / SKY_TICK_S * (1 - TITHE.slow * shown.s);
  pickWon();
  drawRays();
  drawStage();
  const th = throne();
  blit(th, gx() + th.X0 * H, F.gy0 + th.Y0 * H);
  drawGod(GZ);
  const B = drawLine(), rest = handsRest();
  hand(...(B ? B.l : rest.l)); hand(...(B ? B.r : rest.r));
  // What stands among the crowd, by its foot, drawn as the rows pass it.
  const items = [];
  for (const q of S.after.signs) items.push({ y: flagBox(q).foot, draw: () => drawFlag(q) });
  for (const q of S.after.posters) items.push({ y: posterBox(q).foot + 0.5, draw: () => drawPoster(q) });
  for (const w of S.after.bodies) if (deepAt(w.x) > 0) items.push({ y: seenAt(w.x, w.y).ord + 0.25, draw: () => body(w) });
  watchSigns();
  for (const g of setDown) items.push({ y: g.ord, draw: () => drawSetDown(g) });
  items.sort((a, b) => a.y - b.y);
  let next = 0;
  for (const w of shown.won) w.drawn = null;
  drawGodsCrowd(crowdRows(), y => {
    while (next < items.length && items[next].y <= y) items[next++].draw();
    drawWon(y);
  });
  drawGaze(GZ);
}
// For a scene: the members walked out since the sky last looked, seen now,
// as the next frame drawn would see them, so a scene can turn the clock on to
// a won soul's moment before any frame is drawn.
export function skyWatch() {
  if (!S.after) return;
  camFrame();
  stepShown();
  pickWon();
}
// Over the camp: the souls drifting up, and the throne's bubbles.
export function drawAfterCrowd() {
  if (!S.after) return;
  camFrame();
  if (!GZ) return;
  drawDrift();
  drawBubbles();
}
