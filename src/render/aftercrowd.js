// Act 3's sky, drawn flat (DESIGN.md, "The sky, redrawn flat"; the owner's
// votes, docs/mocks/act3-sky-flat-2026-10-19, a3gaze the cumulative one):
// God's crowd as a mass at the foot of the sky, God behind it on his block
// throne and stepped base, the line of souls climbing it to be blessed, his
// turns at glaring round the crowd, and the speech burning a sign. Every
// place is after/sky.js's.
//
// Everything up here is squares, one flat tone a shape: no flecks, no
// dither, no faces in the crowd, and no outline but God's. A length is in
// sky cells (`H`), half a God-cell -- or less, where the sky is too short to
// hold the mock's layout under him -- so the picture is the mock's at every
// window. A pose is held a tick (SKY_TICK_S), the mock's quarter second.
//
// The crowd is planes of souls packed with no gaps (SKY_BANDS, as many as are
// listed: now the far one pale and the near one mid), so a plane is solid and
// only its top edge steps square by square. It stands in God's camp, never
// over the workshops (after/sky.js, `bandEdge`). As support rises each sinks
// toward the bank, the far one first and fading out at the end, the near one
// stopping low, and gives up ground toward God's camp, so God shows more and
// more over them. A sign is a fist flag planted in the plane its rank is in,
// an aura round it (DESIGN.md, "The level, the two crowds and the flags");
// a member it wins orbits it and drifts across to the union's camp. A rally
// off a sign lifts the squares it passes; the throne's roar ducks them.
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
// The frame's cost: the throne and its base, God in each pose, every board
// and the cloud bank are bitmaps taken once a zoom; each band is a fill for
// its body and one for each run of columns that share a top. What is drawn
// live is the rays, the hands, the line, the gaze and the bubbles.

import { S } from '../state.js';
import { P, GREY, STRIKE_SHARE, CROWD_X0, CROWD_FILES, CROWD_PITCH, CROWD_NEAR, CROWD_ROW, AFTER_SPEECH_WARN_S,
         SKY_BANDS, SKY_BOB, SKY_BANK_RATE, SKY_EDGE, SKY_TICK_S, SKY_FIT, SKY_SIGN_RANKS, SKY_EDGE_STEPS,
         SKY_SUPPORT_EASE, SKY_WON, SKY_FLAG, SKY_AURA, SKY_RALLY, SKY_ROAR, SKY_GRUMBLE, SKY_RING_W, SKY_RING_LIFT,
         GOD_N, GOD_EDGE, GOD_CROWN, GOD_EYES, GOD_HAND, GOD_THRONE, GOD_RAYS, GOD_IDLE, TITHE, GAZE,
         AFTER_GAZE_SETTLE_S, AFTER_BURN_S, AFTER_POSTER_FADE_S, SKY_POSTER, SKY_DRIFT,
         AFTER_SEAT_DARK, AFTER_LINE_DARK, AFTER_GAZE_EDGE, AFTER_TONES } from '../config.js';
import { AFTER_JOB } from '../jobs.js';
import { ctx } from './ctx.js';
import { raw, darkPage } from '../ink.js';
import { afterFloor, afterX0, slotX, soulX, overCrowd, crowdX1, stationBox, unionJoinAt } from '../after/place.js';
import { support, union, souls, OUT_RIM, speechTarget } from '../after/union.js';
import { signReach } from '../after/levels.js';
import { skyFrame, layerX, godMid, restW, bandEdge } from '../after/sky.js';
import { smoothstep } from '../motion.js';
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
function vnoise(x, y, seed) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = smoothstep(x - xi), yf = smoothstep(y - yi);
  return lerp(lerp(hsh(xi, yi, seed), hsh(xi + 1, yi, seed), xf), lerp(hsh(xi, yi + 1, seed), hsh(xi + 1, yi + 1, seed), xf), yf);
}

// The sky's own tones outside the four, raw: God and his light white, his
// features and outline black, on either page.
const WHITE = '#ffffff', BLACK = '#000000';
const SEAT_TONE = darkPage ? AFTER_SEAT_DARK : INK;
const LINE_TONE = darkPage ? AFTER_LINE_DARK : PALE;
const CROWN_TONE = darkPage ? WHITE : BLACK;
const RAY_TONE = darkPage ? WHITE : PALE;
const BAND_TONE = SKY_BANDS.map(b => AFTER_TONES[b.tone]);
// The union's ink: the flags, the auras and a won soul's darkening; on the
// dark page the light grey the line's souls wear, as the mocks have it.
const UNION_TONE = darkPage ? AFTER_LINE_DARK : INK;

// --- the frame's camera ---------------------------------------------------------------
// The device pixels a world pixel takes, the window's middle, the zoom over
// the rest frame, the sky's frame, its cell and the tick, read once a frame.
// A rect's edges are each put on a whole device pixel, so a stroke stays
// whole at any zoom.
let K = 1, CX = 0, Z = 1, F = null, H = 1, TK = 0;
function camFrame() {
  K = (S.zoomShow || S.zoom) * S.dpr; CX = S.camX + S.viewW / 2; F = skyFrame();
  Z = restW() / Math.max(1, S.viewW);
  H = Math.max(1, Math.floor(Math.min(F.gc / 2, (F.bank - F.gy0) / SKY_FIT) * 2) / 2);
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
// The share of the way to the strike won (1 at STRIKE_SHARE), eased so a
// band sinks smoothly; snapped on a new act or a reload. `line` is the line's
// own clock, in ticks, run only while he blesses.
const shown = { after: null, s: 0, lastT: null, line: 0, out: new Uint8Array(0), outN: 0, won: [] };
const share = () => clamp(support() / STRIKE_SHARE, 0, 1);
export const skyShare = () => shown.s;
function stepShown() {
  const A = S.after, t = now();
  if (shown.after !== A) {
    shown.after = A; shown.s = share(); shown.lastT = t; shown.won.length = 0; resyncOut();
    shown.line = lineAtOpen(t);
  }
  const gap = t - shown.lastT, dt = clamp(gap, 0, 0.25);
  shown.lastT = t;
  const want = share();
  // Time passed undrawn (the camera elsewhere, a jump of the clock): caught up.
  if (gap > 1) { shown.s = want; shown.line = lineAtOpen(t); }
  shown.s += clamp(want - shown.s, -dt * SKY_SUPPORT_EASE, dt * SKY_SUPPORT_EASE);
  return dt;
}
// God's glare: full at the start, dimming as support rises, gone at the strike.
export const glareAlpha = () => clamp(1 - support() / STRIKE_SHARE, 0, 1);
// His rays: shorter and fainter as support rises, none at the strike.
export const raysLeft = () => 1 - shown.s;

// A band's share sunk.
function bandL(k) {
  const b = SKY_BANDS[k];
  return Math.min(b.cap, clamp((shown.s - b.from) / b.span, 0, 1));
}
// Its top, world y, sunk from its own toward `to` cells over the bank, on the cell.
const bandTop = k => {
  const b = SKY_BANDS[k], to = F.bank - b.to * H;
  return F.tops[k] + snap((to - F.tops[k]) * smoothstep(bandL(k)), H);
};
const NEAR = SKY_BANDS.length - 1;

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
const ringLift = rate => Math.max(H, snap(SKY_RING_LIFT[0] + SKY_RING_LIFT[1] * rate, H));
// What the rings do to a band's column at (x, y): a rally lifts it, a roar
// ducks it under a square of `sq`, a grumble lifts it a cell. World px, down.
function ringsAt(x, y, rate, sq) {
  let lift = 0;
  for (const r of RINGS) {
    const w = ringW(rate) * (r.kind === 'grumble' ? 0.5 : 1);
    if (Math.abs(Math.hypot(x - r.x, y - r.y) - r.rad) >= w) continue;
    if (r.kind === 'rally') lift = Math.min(lift, -ringLift(rate));
    else if (r.kind === 'roar') { if (lift === 0) lift = Math.min(sq - H, snap(ringLift(rate) / 2, H)); }
    else if (lift === 0) lift = -H;
  }
  return lift;
}

// --- the mass ---------------------------------------------------------------------------------------
// A band's columns: a soul's square across, from the layer's own left edge,
// so a column keeps its height however the camera pans. `e` is the column
// its left edge is in, and `fe` how far through it the edge stands.
const bandOrigin = () => afterX0() - SKY_EDGE;
function bandCols(k) {
  const b = SKY_BANDS[k], n = b.n * H, shift = (CX - F.XR) * (1 - b.rate), x0 = bandOrigin() + shift;
  const ex = layerX(bandEdge(k, shown.s), b.rate, CX), ef = (ex - x0) / n, e = Math.floor(ef);
  const i0 = Math.max(e, Math.floor((S.camX - x0) / n) - 1);
  return { n, x0, e, fe: ef - e, i0, i1: Math.ceil((S.camX + S.viewW - x0) / n) + 1 };
}
// A column's top over the band's own: up to `up` cells, a bob a tick.
const colUp = (k, i) => {
  const b = SKY_BANDS[k];
  return Math.floor(hsh(i, b.seed) * (b.up + 1)) + (((i * SKY_BOB.mul + TK) % SKY_BOB.every + SKY_BOB.every) % SKY_BOB.every === 0 ? 1 : 0);
};
const drawn = { souls: 0, cells: 0, runs: 0 };
export const crowdDrawn = () => ({ ...drawn, won: shown.won.length, bands: SKY_BANDS.map((b, k) => bandL(k)) });
// A band's alpha: whole, or fading out over the last of its sinking.
const bandAlpha = k => { const b = SKY_BANDS[k], L = bandL(k); return b.fade > 0 ? 1 - smoothstep((L - (1 - b.fade)) / b.fade) : 1; };
// One plane of God's crowd: a body of packed squares from its left edge on,
// only its top edge stepping square by square; its first SKY_EDGE_STEPS
// columns stepped down toward the edge, the column the edge is in fading as
// the plane gives it up.
function drawBand(k) {
  const b = SKY_BANDS[k], a = bandAlpha(k);
  const top = bandTop(k), { n, x0, e, fe, i0, i1 } = bandCols(k);
  // How many souls stand in view: a fact of support, not of the bob or the rings.
  const count = a > 0.001 && i1 >= i0 ? (i1 - i0 + 1) * Math.max(0, F.bank - top) / n : 0;
  if (k === NEAR) drawn.souls = count; else drawn.cells += count;
  if (a <= 0.001 || i1 < i0) return;
  const foot = F.bank + 2 * H, colY = i => top - colUp(k, i) * H + ringsAt(x0 + (i + 0.5) * n, top, b.rate, n);
  alpha(a, () => {
    ctx.fillStyle = style(BAND_TONE[k]);
    const body = Math.max(i0, e + SKY_EDGE_STEPS), bx = Math.max(S.camX, x0 + body * n);
    rect(bx, top + n, S.camX + S.viewW - bx, foot - top - n);
    // the edge: each column stepped down half a soul more toward it, the
    // outermost fading
    for (let i = Math.max(i0, e); i < body && i <= i1; i++) {
      const y = colY(i) + (e + SKY_EDGE_STEPS - i) * Math.ceil(b.n / 2) * H;
      if (i === e) alpha(1 - fe, () => rect(x0 + i * n, y, n, foot - y)); else rect(x0 + i * n, y, n, foot - y);
    }
    // the top edge: a run of columns sharing a top, one fill
    let start = body, at = null;
    const flush = end => { if (at != null && at < top + n) { rect(x0 + start * n, at, (end - start) * n, top + n - at); drawn.runs++; } };
    for (let i = body; i <= i1 + 1; i++) {
      const y = i <= i1 ? colY(i) : null;
      if (y !== at) { flush(i); start = i; at = y; }
    }
  });
}
// God's crowd: its planes far to near, and after each what stands in it
// (`inPlane(k)`). The one place the crowd's own shape is drawn, so a crowd
// drawn another way (rows, say) is this function and what it reads; the
// flags stand at their signs' spots whatever draws it.
function drawGodsCrowd(planes, inPlane) {
  for (let k = 0; k < planes.length; k++) { drawBand(k); inPlane(k); }
}

// --- souls won over ----------------------------------------------------------------------------------
// A member walking out of God's yard (union.js, `walkOuts`) beside a sign is
// a soul won by it: it lifts out of the sign's plane, darkening toward the
// union's ink, orbits the sign a turn and a half in held steps, then drifts
// sideways across to the union's camp (place.js, `unionJoinAt`) and fades
// there. Read off the field: the slots newly emptied since the last frame,
// each matched to the nearest standing sign whose reach it is in. A member
// with no sign by it (one of the first) raises none.
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
// Where a won soul is `T` ticks on: its middle in the world, its alpha, how
// dark it has gone (0 its plane's tone, 1 the union's ink), and whether it
// has left its plane for the drift across.
function wonAt(w, T) {
  const W0 = SKY_WON, g = flagBox(w), R = auraR(g, 0) * H, top = bandTop(g.k);
  if (T < W0.lift) { const u = T / W0.lift; return { x: g.cx + R * 0.7, y: lerp(top, g.cy + R * 0.7, u), a: 1, dk: 0.3 * u, out: false }; }
  if (T < W0.lift + W0.orbit) {
    const ang = Math.PI / 4 + Math.floor((T - W0.lift) / W0.step) * Math.PI / 4;
    return { x: g.cx + Math.cos(ang) * R, y: g.cy + Math.sin(ang) * R, a: 1, dk: 0.3 + 0.7 * (T - W0.lift) / W0.orbit, out: false };
  }
  const u = Math.min(1, (T - W0.lift - W0.orbit) / W0.drift), to = unionJoinAt();
  const ang = Math.PI / 4 + (W0.orbit / W0.step) * Math.PI / 4, x0 = g.cx + Math.cos(ang) * R, y0 = g.cy + Math.sin(ang) * R;
  return { x: lerp(x0, to.x, u), y: lerp(y0, to.y, u) - Math.sin(u * Math.PI) * W0.arc * H,
           a: u < 1 - W0.fade ? 1 : (1 - u) / W0.fade, dk: 1, out: true };
}
// The won souls of plane `k` still at their sign, or (`out`) every one
// drifting across, over the whole crowd.
function drawWon(k, out) {
  const t = now();
  for (const w of shown.won) {
    const T = Math.floor((t - w.t0) / SKY_TICK_S), g = planeOf(w);
    if (!out && g !== k) continue;
    const p = wonAt(w, T);
    if (p.out !== out) continue;
    const sz = Math.max(2, SKY_BANDS[g].n - 1) * H, x = snap(p.x - sz / 2, H), y = snap(p.y - sz / 2, H);
    if (!inView(x, sz)) continue;
    alpha(p.a, () => { rect(x, y, sz, sz, BAND_TONE[g]); alpha(p.dk, () => rect(x, y, sz, sz, UNION_TONE)); });
  }
}

// --- God ---------------------------------------------------------------------------------------------
// Everything of his in sky cells off his middle (x) and his square's top at
// rest (y), the mock's: his square 0 to GOD_N down, the seat under it.
const SEAT = GOD_N;
const gx = () => godMid(CX);
const godFoot = () => ({ x: gx(), y: F.gy0 + (SEAT + GOD_THRONE.seatH) * H });
const cache = { key: '', throne: null, poses: new Map(), signs: new Map(), bank: null };
function freshCaches() {
  const key = `${K}|${H}|${F.top}|${F.W}`;
  if (key === cache.key) return;
  cache.key = key; cache.throne = null;
  cache.poses.clear(); cache.signs.clear(); cache.bank = null;
}
// The steps of the base, down from under the seat to the bank and one more.
const baseSteps = () => Math.max(1, Math.ceil((F.bank - F.gy0 - (SEAT + GOD_THRONE.seatH) * H) / (GOD_THRONE.step * H)) + 1);

// The block throne and its stepped base (the mock's): a back up to his
// cheeks, a broad seat under him, and below the seat steps a soul's width
// out a step, down into the crowd. One tone, black on the light page.
function throne() {
  if (cache.throne) return cache.throne;
  const T = GOD_THRONE, n = baseSteps(), X0 = -(T.baseHalf + T.step * n), Y0 = T.backTop;
  const Y1 = SEAT + T.seatH + T.step * n;
  const pic = sprite(-2 * X0 * H, (Y1 - Y0) * H, fill => {
    const f = (x, y, w, h) => fill((x - X0) * H, (y - Y0) * H, w * H, h * H, SEAT_TONE);
    f(-T.backHalf, T.backTop, 2 * T.backHalf, SEAT - T.backTop);
    f(-T.seatHalf, SEAT, 2 * T.seatHalf, T.seatH);
    for (let k = 0; k < n; k++) f(-T.baseHalf - T.step * k, SEAT + T.seatH + T.step * k, 2 * (T.baseHalf + T.step * k), T.step);
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
  return k > n + 1 ? null : [x, levelY(k)];
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
    if (age < climbT) { soul(TOP[0], levelY(n - Math.floor(age / T.climb)), i, 1); continue; }
    const b = age - climbT;
    if (b < T.bless) {
      const B = blessing(b);
      hands = B;
      if (B.light != null) glow(B.light);
      soul(TOP[0], TOP[1], i, B.load);
      continue;
    }
    const p = walkAt(b - T.bless, n);
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
function gazeNow() {
  const g = glaring();
  if (g <= 0) return { ...GZ0, x: gx(), y: bandTop(NEAR) };
  const A = S.after, sp = A.speech, t = now(), Tq = TK * SKY_TICK_S;
  const pts = GAZE.sweep, i = Math.floor(TK / GAZE.hold) % pts.length, k = (TK % GAZE.hold) / GAZE.move;
  const y = Math.min(bandTop(NEAR), F.bank - 4 * H);
  let x = gx() + lerp(pts[i], pts[(i + 1) % pts.length], eio(Math.min(1, k))) * S.viewW, w = GAZE.w, on = null, yy = y;
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
      const k = (y - y0) / (y1 - y0), cx = Math.round(lerp(0, fx, k)), hw = Math.max(2, Math.round(lerp(GAZE.w0, gz.w, k)));
      const l = cx - hw - 1, r = cx + hw;
      alpha(darkPage ? GAZE.bodyDark : GAZE.body, () => c(l + 1, y, r - l - 1, 1, WHITE));
      // each edge a joined line two cells thick: a run across to where the row above left off
      const run = (x, px) => { const a = px == null ? x : Math.min(x, px), b = px == null ? x : Math.max(x, px); c(a, y, b - a + 2, 1, AFTER_GAZE_EDGE); };
      run(l - 1, pl); run(r, pr);
      pl = l - 1; pr = r;
    }
    const hw = gz.w, ry = Math.max(2, Math.round(hw * GAZE.flat)), rows = [], sx = Math.round(fx), sy = Math.round(fy);
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
// planted at its sign's spot in the plane its rank stands in, at that
// plane's scale and parallax, behind the planes nearer than it. A poster is
// on the fence at the crowd's front, in the near plane.
const planeOf = q => NEAR - Math.min(NEAR, Math.floor(q.r / SKY_SIGN_RANKS));
const rallied = q => EV.rallies.some(r => r.thing.q === q && now() - r.at < SKY_RALLY.lift);
// A flag's box: `px` its pole's left, the flag from a flag cell (`U`) right
// of it, `y` its top at rest, its middle (`cx`, `cy`), and its plane `k`.
function flagBox(q) {
  const k = planeOf(q), b = SKY_BANDS[k], U = b.flag * H, FL = SKY_FLAG;
  const px = snap(layerX(soulX(q.f) + P / 2, b.rate, CX), H), w = FL.w * U, h = FL.h * U;
  const y = bandTop(k) - FL.up * U - h - (q.id != null && rallied(q) ? U : 0);
  return { k, U, px, x: px + U, y, w, h, cx: px + U + w / 2, cy: y + h / 2 };
}
function posterBox(q) {
  const b = SKY_BANDS[NEAR], PO = SKY_POSTER, w = PO.w * H, h = PO.h * H;
  const x = snap(layerX(slotX(q.slot) + P / 2, b.rate, CX) - w / 2, H);
  const y = bandTop(NEAR) - PO.up * H - h - (rallied(q) ? H : 0);
  return { x, y, w, h };
}
// Where a sign or poster is drawn (its flag's or its sheet's box), for the
// rings and the gaze.
function thingAt(kind, q) {
  const g = kind === 'poster' ? posterBox(q) : flagBox(q);
  return { x: g.x, y: g.y, w: g.w, h: g.h, poster: kind === 'poster' };
}
// The flag in one of its ripple's poses (a3flag's): columns a third of a
// flag cell (`c` sky cells) wide, each dropped by a sine along the flag in
// thirds of a cell, the fist riding the same ripple. `fist` the fist's tone
// (paper; pale, then ink, as it chars).
function flagSprite(c, phase, fist) {
  const key = `f${c}|${phase}|${fist}`;
  let pic = cache.signs.get(key);
  if (pic) return pic;
  const FL = SKY_FLAG, U = c * H, t = U / 3, A = Math.max(1, Math.round(FL.amp * 3)), cols = FL.w * 3;
  pic = sprite(FL.w * U, FL.h * U + 2 * A * t, fill => {
    for (let i = 0; i < cols; i++) {
      const d = Math.round(Math.sin(i / (cols / 3) - phase / FL.phases * Math.PI * 2) * FL.amp * 3), y0 = (A + d) * t;
      fill(i * t, y0, t, FL.h * U, UNION_TONE);
      const gi = Math.floor(i / 3) - FL.x;
      if (gi >= 0 && gi < FL.fist[0].length) FL.fist.forEach((row, j) => { if (row[gi] === 'X') fill(i * t, y0 + (FL.y + j) * U, t, U, fist); });
    }
  });
  cache.signs.set(key, pic);
  return pic;
}
// The poster's sheet: paper, the fist in ink on it, flat.
function posterSprite(sheet, fist) {
  const key = `p|${sheet}|${fist}`;
  let pic = cache.signs.get(key);
  if (pic) return pic;
  const PO = SKY_POSTER;
  pic = sprite(PO.w * H, PO.h * H, fill => {
    fill(0, 0, PO.w * H, PO.h * H, sheet);
    SKY_FLAG.fist.forEach((row, j) => [...row].forEach((ch, i) => { if (ch === 'X') fill((PO.x + i) * H, (PO.y + j) * H, H, H, fist); }));
  });
  cache.signs.set(key, pic);
  return pic;
}
// A sign's aura, in sky cells across the half: breathing a cell.
const auraR = (g, breath) => Math.round(SKY_AURA.r * SKY_FLAG.w * SKY_BANDS[g.k].flag) + SKY_AURA.pad + breath;
function discSprite(R) {
  const key = `d${R}`;
  let pic = cache.signs.get(key);
  if (pic) return pic;
  pic = sprite((2 * R + 1) * H, (2 * R + 1) * H, fill => {
    for (let dy = -R; dy <= R; dy++) { const w = Math.round(Math.sqrt(R * R - dy * dy)); fill((R - w) * H, (R + dy) * H, 2 * w * H, H, UNION_TONE); }
  });
  cache.signs.set(key, pic);
  return pic;
}
// The aura: a faint disc of the union's ink round the flag, and a ring of
// ink squares on its rim turning slowly round it.
function drawAura(g, q) {
  const AU = SKY_AURA, R = auraR(g, (Math.floor(TK / AU.breath) + q.f) % 2), c = H;
  const cx = snap(g.cx, H), cy = snap(g.cy, H);
  alpha(darkPage ? AU.discDark : AU.disc, () => blit(discSprite(R), cx - R * H, cy - R * H));
  alpha(AU.ring, () => {
    ctx.fillStyle = style(UNION_TONE);
    const m = Math.max(10, Math.round(R * AU.per));
    for (let i = 0; i < m; i += 2) {
      const a = (i + Math.floor(TK / AU.turn) * 0.5) / m * Math.PI * 2;
      rect(snap(cx + Math.cos(a) * R * H - c / 2, H), snap(cy + Math.sin(a) * R * H - c / 2, H), c, c);
    }
  });
}
// The flags of plane `k`, each with its aura behind it and the souls it is
// winning round it. Burning, a flag chars in held steps -- the fist going
// pale, then all ink -- and fades by the time it is gone.
function drawFlags(k) {
  const t = now(), phase = TK % SKY_FLAG.phases;
  for (const q of S.after.signs) {
    if (planeOf(q) !== k) continue;
    const g = flagBox(q), A = Math.max(1, Math.round(SKY_FLAG.amp * 3)) * g.U / 3;
    if (!inView(g.px - 60 * H, g.w + 120 * H)) continue;
    const u = q.burnt == null ? null : clamp((t - q.burnt) / AFTER_BURN_S, 0, 1), st = u == null ? -1 : Math.floor(u * 4);
    const fist = st < 0 ? W : st === 0 ? PALE : UNION_TONE;
    alpha(u == null ? 1 : u < 0.5 ? 1 : 1 - (u - 0.5) / 0.5, () => {
      if (u == null) drawAura(g, q);
      rect(g.px, g.y - A, g.U, F.bank + 12 - g.y + A, UNION_TONE);
      blit(flagSprite(SKY_BANDS[k].flag, (phase + q.f) % SKY_FLAG.phases, fist), g.x, g.y - A);
    });
  }
  drawWon(k, false);
}
function drawPosters() {
  const t = now();
  for (const q of S.after.posters) {
    const g = posterBox(q);
    if (!inView(g.x - 20, g.w + 40)) continue;
    const fading = q.torn != null ? clamp(1 - (t - q.torn) / AFTER_POSTER_FADE_S, 0, 1) : 1;
    const u = q.burnt == null ? null : clamp((t - q.burnt) / AFTER_BURN_S, 0, 1), st = u == null ? -1 : Math.floor(u * 4);
    alpha(fading * (u == null || u < 0.5 ? 1 : 1 - (u - 0.5) / 0.5), () => {
      rect(snap(g.x + g.w / 2 - H / 2, H), g.y + g.h, H, F.bank + 12 - g.y - g.h, UNION_TONE);
      blit(posterSprite(st < 0 ? W : st === 0 ? PALE : UNION_TONE, UNION_TONE), g.x, g.y);
    });
  }
}

// --- the cloud bank --------------------------------------------------------------------------------
// A lumpy billow of paper cells over the crowd's feet, the only horizon.
const layerSpan = rate => {
  const half = F.W / 2;
  return [F.c0 - half - (F.c0 - F.XR) * (1 - rate) - SKY_EDGE, F.c1 + half - (F.c1 - F.XR) * (1 - rate) + SKY_EDGE];
};
function drawBank() {
  const [x0, x1] = layerSpan(SKY_BANK_RATE);
  if (!cache.bank) cache.bank = sprite(x1 - x0, 60, r => {
    for (let i = 0; i < (x1 - x0) / P; i++) {
      const top = 2 + Math.round(vnoise(i / 5, 0, 31) * 3 + hsh(i, 0, 32));
      r(i * P, top * P, P, (10 - top) * P, W);
    }
  });
  const shift = (CX - F.XR) * (1 - SKY_BANK_RATE), pic = cache.bank;
  const sx = clamp((S.camX - shift - x0) * K, 0, pic.width), sw = clamp(S.viewW * K + 2 * K, 0, pic.width - sx);
  if (sw > 0) ctx.drawImage(pic, sx, 0, sw, pic.height, onPx(x0 + shift + sx / K), onPx(F.bank - 12), sw / K, pic.height / K);
  rect(S.camX, F.bank + 48, S.viewW, F.floor - P * 3 - F.bank - 48, W);
}

// --- bodies standing in God's yard ----------------------------------------------------------------
// The floor where the crowd stood is drawn as the cloud bank: a body walking
// in climbs it at the edge and stands up in the near band, among the signs,
// smaller and at their rate; a member walking out climbs down. Where a sim
// point there is drawn, and how big a body is (1 on the floor).
const NEAR_K = 12 / (P * 3);
export function seenAt(x, y) {
  if (!S.after) return { x, y, k: 1 };
  camFrame();
  const edge = CROWD_PITCH * 2;
  const w = smoothstep((x - (CROWD_X0 - edge)) / edge) * smoothstep((crowdX1() + edge - x) / edge);
  if (w <= 0) return { x, y, k: 1 };
  const d = clamp((afterFloor() - y) / (CROWD_NEAR * CROWD_ROW), 0, 1.5);
  const rate = 1 + (SKY_BANDS[NEAR].rate - 1) * w;
  return { x: layerX(x, rate, CX), y: lerp(y, F.bank - d * 24, w), k: lerp(1, NEAR_K, w) };
}
// A body there: a flat square of ink, its load flat over it.
function body(w) {
  const v = seenAt(w.x, w.y), u = P * v.k;
  const x = onPx(v.x - u * 1.5), y = onPx(v.y - u * 3);
  rect(x, y, u * 3, u * 3, INK);
  if (w.load === 'log') rect(x - u, y - u, u * 5, u, PALE);
  else if (w.load === 'sign') { rect(x + u, y - u, u, u, INK); rect(x, y - u * 2, u * 3, u, PALE); }
  else if (w.load === 'posters') rect(x, y - u, u * 3, u, PALE);
  else if (w.load === 'tip') rect(x, y - u, u * 2, u, PALE);
  if (w.swing != null) {
    if (w.job === AFTER_JOB.AGITATE) { rect(x + u, y - u * 5, u, u * 2, INK); rect(x + u, y - u * 2, u, u, INK); }
    else for (let k = 1; k <= 2; k++) rect(x + (w.face > 0 ? 2 + k : -k) * u, y - k * u, u, u, INK);
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
    if (inView(x, 6)) alpha(a, () => rect(x, y, 6, 6, MID));
  }
}

// --- the layers ------------------------------------------------------------------------------------
// The sky behind the camp, back to front: his rays, the throne and its base,
// God and his hands, the line, then the planes of his crowd far to near, the
// flags planted in each behind the nearer ones (the gaze on the near one, the
// posters along its front), the souls won drifting across to the union's
// camp, and the cloud bank over the crowd's feet.
let GZ = null;
export function drawSkyCrowd() {
  if (!S.after) return;
  camFrame();
  freshCaches();
  const dt = stepShown();
  drawn.runs = 0; drawn.cells = 0;
  EV = eventsNow();
  RINGS = ringsNow();
  GZ = gazeNow();
  // The line waits on its steps while he glares; it slows as support rises
  // and stands still at the strike.
  if (GZ.g <= 0 && shown.s < 0.98) shown.line += dt / SKY_TICK_S * (1 - TITHE.slow * shown.s);
  pickWon();
  drawRays();
  const th = throne();
  blit(th, gx() + th.X0 * H, F.gy0 + th.Y0 * H);
  drawGod(GZ);
  const B = drawLine(), rest = handsRest();
  hand(...(B ? B.l : rest.l)); hand(...(B ? B.r : rest.r));
  drawGodsCrowd(SKY_BANDS, k => {
    if (k === NEAR) drawGaze(GZ);
    drawFlags(k);
    if (k === NEAR) drawPosters();
  });
  drawWon(null, true);
  drawBank();
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
// Over the camp: the bodies standing in God's yard, the souls drifting up,
// and the throne's bubbles.
export function drawAfterCrowd() {
  if (!S.after) return;
  camFrame();
  if (!GZ) return;
  for (const w of S.after.bodies) if (overCrowd(w.x)) body(w);
  drawDrift();
  drawBubbles();
}
