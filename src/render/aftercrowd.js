// Act 3's sky, drawn flat (DESIGN.md, "The sky, redrawn flat"; the owner's
// votes, docs/mocks/act3-sky-flat-2026-10-19, a3gaze the cumulative one), and
// God's camp standing in the clouds (DESIGN.md, "God's camp stands in the
// clouds", "The camps are far apart for the eye"): God far back on the cloud
// floor on his block throne and stepped base, his crowd standing round it,
// his talk and the wave each word sends through the crowd, his turns at
// glaring round the crowd, and the speech burning a sign. Every place is
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
// one broad stage from behind his throne forward to the main plane's line.
// It spans the depths between, so each line of it slides at its own depth's
// rate (after/sky.js, `campMid`) and the stage leans as the camera pans; a
// row of his crowd, a flag or a body on it slides with its line, so nothing
// on it skates. His crowd stands on it at a
// giant's scale, rows of separate souls with the stage between them,
// emptying from the front to bare stage as support rises. A sign is a fist
// flag planted at its spot on the stage, an aura round it (DESIGN.md, "The
// level, the two crowds and the flags"); a member it wins orbits it and
// walks the long way back across to the union's camp. A rally off a sign
// lifts the souls it passes. The bodies out on the way between are drawn
// among them: along the main plane, onto the front edge, out over the top.
//
// God is a light source on either page: he, his rays, his light and his
// gaze are drawn raw (src/ink.js), outside the act's four tones, and so is
// his throne, which the dark page sets apart from the crowd (config,
// AFTER_SEAT_DARK). He takes turns: a while talking to his crowd, then a
// while glaring round it; the speech's warning makes him glare whenever it
// falls. He talks in phrases, a syllable a beat, his mouth open on each,
// and every syllable is a wave: rings off his head, then a front out across
// the crowd from his foot, each soul hopping the moment it arrives (the
// owner, 2026-10-20: the talking and the crowd's wave "super connected").
// Nothing of it is saved: it is read off the act's clock and the sim's
// speech, so a reload stands it where it was.
//
// The frame's cost: the throne and its base, God in each pose and every
// board are bitmaps taken once a zoom; the stage is a few fills; a soul is a
// fill. What is drawn live is the crowd, the rays, the hands, the waves, the
// gaze and the bubbles.

import { S } from '../state.js';
import { P, GREY, GOD_BACK, STRIKE_SHARE, CROWD_X0, CROWD_FILES, CROWD_PITCH, AFTER_SPEECH_WARN_S,
         SKY_TICK_S, GOD_CROWD, GOD_STAGE, GOD_FLAG,
         SKY_SUPPORT_EASE, SKY_WON, SKY_FLAG, SKY_AURA, SKY_RALLY, SKY_ROAR, SKY_GRUMBLE, SKY_RING_W, SKY_RING_LIFT,
         GOD_N, GOD_MASS, GOD_EDGE, GOD_CROWN, GOD_EYES, GOD_HAND, GOD_THRONE, GOD_RAYS, GOD_IDLE, GOD_TALK, GAZE,
         AFTER_GAZE_SETTLE_S, AFTER_BURN_S, AFTER_POSTER_FADE_S, SKY_POSTER, SKY_DRIFT,
         AFTER_SEAT_DARK, AFTER_LINE_DARK, AFTER_GAZE_EDGE, SIGN_FADE_S } from '../config.js';
import { ctx } from './ctx.js';
import { layerAt } from './frame.js';
import { raw, darkPage, perPage, themeGen } from '../ink.js';
import { afterX0, slotX, stationBox, unionJoinAt, afterFloor } from '../after/place.js';
import { support, union, souls, OUT_RIM, speechTarget } from '../after/union.js';
import { signReach } from '../after/levels.js';
import { skyFrame, campX0, rateAt, stage, stageHalf, crowdHalf, campHalf, stageFore, stageSpot, stageSoul, stageGap, walkSeen, deepAt } from '../after/sky.js';
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
// Each is the page's, worked out again when it turns (ink.js, `perPage`).
let SEAT_TONE, CROWN_TONE, RAY_TONE, LIT_TONE, TOP_TONE, UNION_TONE;   // cache: the page's tones, worked out again at each turn (ink.js, perPage)
perPage(() => {
  SEAT_TONE = darkPage ? AFTER_SEAT_DARK : INK;
  CROWN_TONE = darkPage ? WHITE : BLACK;
  // His rays and his voice's rings: white on the dark page; on the light one
  // mid, since the day's sky and its clouds are paper and pale.
  RAY_TONE = darkPage ? WHITE : MID;
  // A soul his word lights (take b): his light on the dark page; on the light
  // one the ink, since a paper soul lit white would not show.
  LIT_TONE = darkPage ? WHITE : INK;
  // The stage's top: paper on the light page, the light ink on the dark, never
  // the cloud's pale; its risers mid. His souls alternate mid and pale by row
  // (the mock's second grey is a fifth tone; the act has four).
  TOP_TONE = darkPage ? INK : W;
  // The union's ink: the flags, the auras and a won soul's darkening; on the
  // dark page a light grey (AFTER_LINE_DARK), as the mocks have it.
  UNION_TONE = darkPage ? AFTER_LINE_DARK : INK;
});
const RISE_TONE = MID;
const SOUL_TONES = [MID, PALE];

// --- the frame's camera ---------------------------------------------------------------
// The device pixels a world pixel takes, the window's middle, the sky's
// frame, its cell and the tick, read once a frame. A rect's edges are each
// put on a whole device pixel, so a stroke stays whole at any zoom.
let K = 1, CX = 0, F = null, H = 1, TK = 0;   // cache: this frame's camera, read by camFrame at each draw
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
// crowd thins smoothly; snapped on a new act or a reload.
const shown = { after: null, s: 0, lastT: null, out: new Uint8Array(0), outN: 0, won: [] };
const share = () => clamp(support() / STRIKE_SHARE, 0, 1);
export const skyShare = () => shown.s;
function stepShown() {
  const A = S.after, t = now();
  if (shown.after !== A) {
    shown.after = A; shown.s = share(); shown.lastT = t; shown.won.length = 0; resyncOut();
    seeAllSigns();
  }
  const gap = t - shown.lastT, dt = clamp(gap, 0, 0.25);
  shown.lastT = t;
  const want = share();
  // Time passed undrawn (the camera elsewhere, a jump of the clock): caught up.
  if (gap > 1) { shown.s = want; seeAllSigns(); }
  shown.s += clamp(want - shown.s, -dt * SKY_SUPPORT_EASE, dt * SKY_SUPPORT_EASE);
  return dt;
}
// God's glare: full at the start, dimming as support rises, gone at the strike.
export const glareAlpha = () => clamp(1 - support() / STRIKE_SHARE, 0, 1);
// His rays: shorter and fainter as support rises, none at the strike.
export const raysLeft = () => 1 - shown.s;

// --- the rings and the talk ------------------------------------------------------------------
// Each a fact of the clock: the n-th of each falls at a time read off n, so
// a ring or a phrase running is the same after a reload. None while the
// speech is warned: the sky holds its breath. A phrase starts on a tick, so
// his mouth opens on the held poses' own beat.
const rallyAt = n => n * 7.5 + (SKY_RALLY.every[1] - SKY_RALLY.every[0]) * (hsh(n, 9) - 0.5);
const onTick = at => Math.ceil(at / SKY_TICK_S - 1e-9) * SKY_TICK_S;
const roarAt = n => onTick(n * SKY_ROAR.every + 2.5);
const GRUMBLE_MID = (SKY_GRUMBLE.every[0] + SKY_GRUMBLE.every[1]) / 2;
const grumbleAt = n => onTick(n * GRUMBLE_MID + (SKY_GRUMBLE.every[1] - SKY_GRUMBLE.every[0]) * 0.5 * (hsh(n, 8) - 0.5));
const quiet = at => {
  const sp = S.after?.speech;
  return !!sp && !!sp.target && at >= sp.next - AFTER_SPEECH_WARN_S && at < sp.next;
};
// What stands for a rally to start at: the signs and posters not burning, by id.
const standingThings = () => [...S.after.signs.filter(q => q.burnt == null).map(q => ({ kind: 'sign', q })),
                              ...S.after.posters.filter(q => q.burnt == null && q.torn == null).map(q => ({ kind: 'poster', q }))]
  .sort((a, b) => a.q.id - b.q.id);
// A phrase's syllables, and how long it runs from its first.
const BEAT_S = GOD_TALK.beat * SKY_TICK_S;
const sylls = r => (r.big ? GOD_TALK.big : r.kind === 'roar' ? GOD_TALK.loud : GOD_TALK.mutter);
function eventsNow() {
  const t = now(), out = { rallies: [], roars: [] };
  const things = standingThings();
  if (things.length) for (let n = Math.floor((t - SKY_RALLY.life) / 7.5) - 1; n <= Math.floor(t / 7.5) + 1; n++) {
    const at = rallyAt(n);
    if (at > t || t - at >= SKY_RALLY.life || at < 0 || quiet(at)) continue;
    out.rallies.push({ at, thing: things[Math.floor(hsh(n, 5) * things.length)] });
  }
  // Kept SKY_ROAR.life, a mutter too: long enough for every wave a phrase
  // sent to have crossed the crowd.
  const life = SKY_ROAR.life;
  for (let n = Math.max(0, Math.floor((t - life) / SKY_ROAR.every) - 1); roarAt(n) <= t; n++) {
    const at = roarAt(n);
    if (t - at < SKY_ROAR.life && !quiet(at)) out.roars.push({ at, kind: 'roar', g: ROARS[Math.floor(hsh(n, 2) * 4)] });
  }
  for (let n = Math.max(0, Math.floor((t - life) / GRUMBLE_MID) - 1); grumbleAt(n) <= t; n++) {
    const at = grumbleAt(n);
    if (at >= 0 && t - at < life && !quiet(at)) out.roars.push({ at, kind: 'grumble', g: GRUMBLES[Math.floor(hsh(n, 4) * 3)] });
  }
  // The speech's own roar, a bolt, as it falls.
  const b = S.after.speech?.burnt, bigAt = x => onTick(x - 0.6);
  if (b && t >= bigAt(b.at) && t - bigAt(b.at) < SKY_ROAR.life) out.roars.push({ at: bigAt(b.at), kind: 'roar', g: ROARS[4], big: true });
  // ...and before it has fallen, the moment it will.
  const sp = S.after.speech;
  if (sp && sp.target && t >= bigAt(sp.next) && t < sp.next) out.roars.push({ at: bigAt(sp.next), kind: 'roar', g: ROARS[4], big: true });
  return out;
}
let EV = { rallies: [], roars: [] }, RINGS = [], WORDS = [];   // cache: this frame's, worked out at the top of each drawSkyCrowd
function ringsNow() {
  const t = now(), out = [];
  for (const r of EV.rallies) {
    const s = thingAt(r.thing.kind, r.thing.q);
    out.push({ kind: 'rally', x: s.x + s.w / 2, y: s.y + s.h / 2, rad: SKY_RALLY.speed * (t - r.at) });
  }
  return out;
}
const ringW = rate => SKY_RING_W[0] + SKY_RING_W[1] * rate;
const ringLift = rate => Math.max(P, snap(SKY_RING_LIFT[0] + SKY_RING_LIFT[1] * rate, P));
// What a rally does to a soul at (x, y) seen at `rate` (1 / its depth): it
// lifts it. World px, down.
function ringsAt(x, y, rate) {
  let lift = 0;
  for (const r of RINGS) {
    if (Math.abs(Math.hypot(x - r.x, y - r.y) - r.rad) >= ringW(rate)) continue;
    lift = Math.min(lift, -ringLift(rate));
  }
  return lift;
}

// --- his words and their waves ---------------------------------------------------------------
// Every syllable he has said whose wave is still out, each { ts, kind, big,
// k }: when it left his mouth, the phrase's kind, and its place in it.
function wordsNow() {
  const t = now(), out = [];
  for (const r of EV.roars) {
    const n = sylls(r);
    for (let k = 0; k < n; k++) {
      const ts = r.at + k * BEAT_S;
      if (ts > t) break;
      out.push({ ts, kind: r.kind, big: !!r.big, k });
    }
  }
  return out;
}
// His mouth this tick: 0 shut, 1 a mutter's syllable, 2 a loud one -- open
// for `open` ticks from each syllable's tick.
function mouthNow() {
  const t = now();
  let m = 0;
  for (const w of WORDS) if (t - w.ts < GOD_TALK.open * SKY_TICK_S) m = Math.max(m, w.kind === 'roar' ? 2 : 1);
  return m;
}
// The wave's way, world px: from his mouth down over his throne to his foot
// on the stage (`drop`), then out across the stage, its front lying flat on
// it -- a soul `dx` across and `dy` toward the window from his foot is
// `drop` + the flattened distance out. One clock drives both the front as
// drawn and the souls' hops, so a soul moves on the frame the front reaches it.
const mouth = () => ({ x: gx(), y: F.gy0 + 28 * H });
const WV = { speed: 0, drop: 0, reach: 0, fx: 0, fy: 0 };
function waveFrame() {
  const st = stage(), m = mouth();
  WV.speed = GOD_TALK.speed * H; WV.fx = gx(); WV.fy = st.throneY;
  WV.drop = WV.fy - m.y; WV.reach = campHalf();
}
const waveDist = (x, y) => WV.drop + Math.hypot(x - WV.fx, (y - WV.fy) / GOD_TALK.flat);
// How strong a word's front is `d` px along its way: whole, then fading out
// over the last `fade` of the crowd's half; a mutter's dies out sooner.
function waveAmp(w, d) {
  const far = (w.kind === 'roar' ? 1 : GOD_TALK.reach) * WV.reach, out = d - WV.drop;
  return clamp((far - out) / (far * GOD_TALK.fade), 0, 1);
}
// A soul at (x, foot y): how far up its word lifts it, world px (negative,
// put on a whole device pixel so the square moves as one piece), and how lit
// it is, 0 to 1 -- whole through the hop, going out over its last `unlit`.
// A hop is up and down once over `hopS`, starting the moment the front gets
// there.
// Each word's hop is under way along a band of its way, from where its front
// is now back to where it was a hop ago: the bands, laid out once a frame,
// so a soul out of all of them is passed over on one distance.
const HOP = { lift: 0, lit: 0 };
let HOPS = [];   // cache: this frame's bands, laid out by hopBands each draw
function hopBands() {
  const t = now(), out = [];
  for (const w of WORDS) {
    const hi = (t - w.ts) * WV.speed, lo = hi - GOD_TALK.hopS * WV.speed;
    if (hi > WV.drop && lo < WV.drop + WV.reach / GOD_TALK.flat) out.push({ w, lo, hi });
  }
  HOPS = out;
}
function hopAt(x, y) {
  HOP.lift = 0; HOP.lit = 0;
  if (!HOPS.length) return HOP;
  const t = now(), d = waveDist(x, y), T = GOD_TALK;
  for (const { w, lo, hi } of HOPS) {
    if (d <= lo || d > hi) continue;
    const u = (t - w.ts - d / WV.speed) / T.hopS;
    if (u < 0 || u >= 1) continue;
    const a = waveAmp(w, d);
    if (a <= 0) continue;
    const up = Math.sin(Math.PI * u) * (w.big ? T.bigHop : T.hop) * H * a;
    if (up > -HOP.lift) HOP.lift = -up;
    HOP.lit = Math.max(HOP.lit, a * clamp((1 - u) / T.unlit, 0, 1));
  }
  HOP.lift = Math.round(HOP.lift * K) / K;
  return HOP;
}
// The rings off his head: a word leaves his mouth as a ring of his light
// widening round his head, over his throne and behind him, fading as it reaches
// `head` cells past his square, shown only as the arcs either side of his
// mouth, stepped sound marks.
function drawHeadRings() {
  const t = now(), T = GOD_TALK, c = T.cell * H, m = mouth(), r0 = (GOD_N / 2) * H, far = r0 + T.head * H;
  ctx.fillStyle = style(RAY_TONE);
  for (const w of WORDS) {
    const rad = WV.speed * (t - w.ts);
    if (rad > far) continue;
    const a = (1 - clamp((rad - r0) / (far - r0), 0, 1)) * (w.kind === 'roar' ? 1 : 0.6);
    alpha(a, () => {
      const n = Math.max(12, Math.ceil(2 * Math.PI * rad / c)), seen = new Set();
      for (let i = 0; i < n; i++) {
        const th = i / n * 2 * Math.PI, cs = Math.cos(th), sn = Math.sin(th);
        if (Math.abs(sn) > 0.45) continue;
        const x = c * Math.round(cs * rad / c), y = c * Math.round(sn * rad / c), key = x + ',' + y;
        if (seen.has(key)) continue;
        seen.add(key);
        rect(m.x + x - c / 2, m.y + y - c / 2, c, c);
      }
    });
  }
}
// --- the stage -------------------------------------------------------------------------------
// The top from behind his foot forward to the main plane's line, a line at a
// time at its own depth's place (`gxAt`), so it leans as the camera pans,
// and a side face down each slanted edge: the top widens toward the window,
// so both sides face it, wherever he stands on it (a face chosen by which
// half of the window he is in would pop across as he passes its middle).
// A plain shape; its front meets the main plane's path, which is drawn over
// its foot (render/after/floor.js).
function drawStage() {
  const st = stage(), G = GOD_STAGE, sw = G.side * st.mx;
  // A line's face runs out from its own edge as far as the line above's or
  // below's, whichever stands further out, so where the stage leans more
  // than a face's width a line the edge stays one unbroken line.
  const left = y => gxAt(y) - Math.round(stageHalf(st, y)), right = y => gxAt(y) + Math.round(stageHalf(st, y));
  const near = y => clamp(y, st.yb, st.yf - P);
  ctx.fillStyle = style(RISE_TONE);
  for (let y = st.yb; y < st.yf; y += P) {
    const l0 = left(y), r0 = right(y);
    const lo = Math.min(l0, left(near(y - P)), left(near(y + P))), hi = Math.max(r0, right(near(y - P)), right(near(y + P)));
    rect(lo - sw, y, l0 - lo + sw, P);
    rect(r0, y, hi - r0 + sw, P);
  }
  ctx.fillStyle = style(TOP_TONE);
  for (let y = st.yb; y < st.yf; y += P) { const x = gxAt(y), hw = Math.round(stageHalf(st, y)); rect(x - hw, y, 2 * hw, P); }
}

// --- the crowd on the stage ----------------------------------------------------------------
// Rows from the front edge back, a soul growing from the back's size to the
// front's, a gap between souls, each row stepping back a little more than
// its soul so the stage shows between rows; the throne's foot kept clear.
// A fact of the window.
let ROWS = [], rowsKey = '';   // cache: keyed by the stage's geometry
function crowdRows() {
  const st = stage(), G = GOD_CROWD, key = `${st.yb}|${st.yf}|${st.mx}`;
  if (key === rowsKey) return ROWS;
  const out = [];
  // Straight rows a soul and a row's gap apart, every soul one size.
  const step = n => n + stageGap() - GOD_MASS.rise;   // a row tucked under the next by a rise, so no square lifting shows the stage
  for (let y = st.yf - P, r = 0; y > st.yb + P; r++) {
    const n = stageSoul(st, y);
    out.push({ y, n, k: stageFore(st, y), r });
    y -= step(n);
  }
  rowsKey = key; ROWS = out.reverse();
  return ROWS;
}
// How much a soul of row r (of n, 0 the back) at spot i stands, 0 to 1: gone
// from the front first as support rises, fading through the last of it. `out`
// is how far out past the stage's edge it stands, 0 on the stage to 1 at the
// crowd's end: the crowd thins raggedly out over the cloud.
function standing(r, n, i, out = 0) {
  const G = GOD_CROWD, fore = n > 1 ? r / (n - 1) : 1;
  const R = GOD_BACK;
  const v = (1 - shown.s) * R.keep - fore * R.fore - hsh(i, r + 9) * R.luck + R.base - out * R.fringe * (0.4 + hsh(i, r, 31));
  return clamp(v / G.soft, 0, 1);
}
const drawn = { souls: 0 };
// A soul's rise, world px (0 to -rise, on a whole device pixel): a smooth sine
// on the soul's own period, its phase the wave across the mass plus its own,
// so the mass rolls and no two squares keep step.
function rippleAt(x, i, r) {
  const M = GOD_MASS, own = hsh(i, r, 11), per = lerp(M.period[0], M.period[1], hsh(i, r, 17));
  const ph = x / M.wave + r * M.drift + own * M.own;
  const u = 0.5 + 0.5 * Math.sin(2 * Math.PI * (now() / per + ph));
  return Math.round(-M.rise * u * K) / K;
}
export const crowdDrawn = () => ({ ...drawn, won: shown.won.length });
// The souls of row r in view, each { r, i, x, y, w, a }: x its left, y its
// foot. Straight files, every row's souls on the same columns either side of
// the camp's middle, a soul and a file's gap apart, across the stage and out
// over the cloud past it (after/sky.js, `crowdHalf`); the throne's foot kept
// clear. A file's index is its place off the middle, so it keeps its soul as
// the rows change.
function rowSouls(r, R, n, out) {
  const st = stage(), mid = gxAt(R.y), god = gx(), w = R.n;
  const edge = stageHalf(st, R.y), hw = crowdHalf(st, R.y), clear = st.throne + w / 2 + 2 * st.mx;
  const pitch = w + stageGap(), K = Math.floor((hw - w / 2) / pitch);
  for (let k = -K; k <= K; k++) {
    const c = mid + k * pitch, x0 = c - w / 2;
    if (R.y - w < st.throneY + P && Math.abs(c - god) < clear) continue;
    if (x0 + w < S.camX - P || x0 > S.camX + S.viewW + P) continue;
    const past = clamp((Math.abs(c - mid) - edge) / Math.max(1, hw - edge), 0, 1);
    const i = k + 1000, a = standing(r, n, i, past);
    if (a > 0.001) out.push({ r, i, x: x0, y: R.y, w, a });
  }
}
// God's crowd: its rows back to front, and before each whatever stands on
// the stage behind it (`between(y)` draws what stands with its foot above
// world y, and `between(Infinity)` the rest after the front row). The one
// place the crowd's own shape is drawn, so a crowd drawn another way is this
// function and what it reads.
function drawGodsCrowd(rows, between) {
  let count = 0;
  const M = GOD_MASS;
  rows.forEach((R, r) => {
    between(R.y);
    const souls = [];
    rowSouls(r, R, rows.length, souls);
    const back = 1 - (rows.length > 1 ? r / (rows.length - 1) : 1);
    for (const s of souls) {
      if (s.a > 0.5) count++;
      const hop = hopAt(s.x + s.w / 2, s.y), lift = Math.min(ringsAt(s.x + s.w / 2, s.y, 1), hop.lift);
      const was = ctx.globalAlpha;
      if (s.a < 1) ctx.globalAlpha = was * s.a;
      // a flat square, one of the page's two greys, up and down on its own
      // phase of the wave across the mass
      const y = s.y - s.w + lift + rippleAt(s.x, s.i, r);
      rect(s.x, y, s.w, s.w, hsh(s.i, r, 5) < M.pale + M.deepPale * back ? PALE : MID);
      // lit in his light as his word reaches it
      if (hop.lit > 0.01) {
        ctx.globalAlpha = was * s.a * hop.lit;
        rect(s.x, y, s.w, s.w, LIT_TONE);
      }
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
    const k = u / A, c = stageSpot(0, 0), cx = gxAt(st.yf - P) + c.dx, foot = lerp(g.foot, st.yf - P, k), s = lerp(sz, stageSoul(st, st.yf), k);
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
// The camp's middle at world y as drawn (after/sky.js, `campMid`): its fixed
// place at that depth on a whole device pixel plus its depth's slide on one
// of its own, as render/after/ground.js lays its layers. A row of the stage
// is laid off one of these, so it moves as one piece and never wobbles a
// pixel against the camera's own rounding; the back steps with the far
// cloud, the front with the world. God, his throne and all above the
// stage's back are the back's (`gx`).
const gxAt = y => { const r = rateAt(stage(), y); return Math.round(campX0(r) * K) / K + layerAt(0, r, F.XR); };
const gx = () => gxAt(-Infinity);
const godFoot = () => ({ x: gx(), y: F.gy0 + (SEAT + GOD_THRONE.seatH) * H });
const cache = { key: '', throne: null, poses: new Map(), signs: new Map() };
function freshCaches() {
  const key = `${themeGen}|${K}|${H}|${F.top}|${F.W}`;
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
// cells, `lit` his eyes lit from inside while he glares, `mouth` 0 shut, 1
// a mutter's syllable, 2 a loud one.
function godSprite(br, look, lit, mouth, face = godFace()) {
  const key = `${face}|${br}|${look}|${lit ? 1 : 0}|${mouth}`;
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
    if (mouth === 2) {
      f(x0 + 12, y0 + 25, 16, 6, BLACK);
      if (mask) for (const tx of [14, 18, 22, 25]) f(x0 + tx, y0 + 25, 2, 2, WHITE);
    } else if (mouth === 1) {
      f(x0 + 14, y0 + 26, 12, 4, BLACK);
      if (mask) for (const tx of [16, 22]) f(x0 + tx, y0 + 26, 2, 2, WHITE);
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
// A hand: a white square outlined like him, its top left in cells, resting
// on the seat either side of him.
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
  // Whole until support has taken most of them, then faded out with the
  // last of their length, so they read on the day's paper to the end.
  alpha((darkPage ? R.dark : 1) * clamp(left * R.hold, 0, 1), () => {
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
// How much he glares, 0 to 1: on his own turns, a phase talking and a phase
// glaring, each turn fading in and out over two ticks; and whenever the
// speech is warned or burning, whatever the turn.
const PH = GAZE.phase * SKY_TICK_S, RAMP = 2 * SKY_TICK_S;
function glaring() {
  const t = now(), p = ((t % (2 * PH)) + 2 * PH) % (2 * PH);
  let g = p < PH ? 0 : Math.min(1, (p - PH) / RAMP, (2 * PH - p) / RAMP);
  const sp = S.after.speech;
  if (speechTarget() && sp) g = Math.max(g, clamp((t - (sp.next - AFTER_SPEECH_WARN_S)) / RAMP, 0, 1));
  const b = sp?.burnt;
  if (b && t >= b.at) g = Math.max(g, clamp((b.at + AFTER_BURN_S + RAMP - t) / RAMP, 0, 1));
  return g;
}

// For a scene: where his turns and his talk stand at the act's clock --
// how much he glares, how far into a loud phrase he is (null between), and
// the seconds to the next.
export function skyMoment() {
  if (!S.after) return null;
  camFrame();
  const t = now(), r = eventsNow().roars.find(q => q.kind === 'roar' && t - q.at < sylls(q) * BEAT_S);
  let n = 0;
  while (roarAt(n) <= t) n++;
  return { glare: glaring(), talk: r ? (t - r.at) / (sylls(r) * BEAT_S) : null, next: roarAt(n) - t };
}

function drawGod(gz) {
  const br = (TK % GOD_IDLE.breath) < GOD_IDLE.breath / 2 ? 0 : 1;
  const look = gz.g > 0 ? clamp(Math.round((gz.x - gx()) / (GOD_N * H)), -2, 2) : [0, 2, 0, -2][Math.floor(TK / GOD_IDLE.look) % 4];
  const pic = godSprite(br, look, gz.g > 0, mouthNow());
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
  const FL = SKY_FLAG, px = snap(gxAt(foot) + sp.dx, 1), w = FL.w * U, h = FL.h * U;
  const y = foot - stageSoul(st, foot) - FL.up * U - h - (q.id != null && rallied(q) ? U : 0);
  return { foot, U, px, x: px + U, y, w, h, cx: px + U + w / 2, cy: y + h / 2 };
}
// A poster on the stage's front edge, at its slot along it.
function posterBox(q) {
  const st = stage(), f = (slotX(q.slot) - CROWD_X0 - P) / CROWD_PITCH, sp = stageSpot(f, 0), foot = snap(st.yf - P, P);
  const U = flagU(GOD_FLAG.n[0]), PO = SKY_POSTER, w = PO.w * U, h = PO.h * U;
  const x = snap(gxAt(foot) + sp.dx - w / 2, 1);
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
      if (w.job == null) { rect(x + u, y - u * 5, u, u * 2, INK); rect(x + u, y - u * 2, u, u, INK); }
      else for (let k = 1; k <= 2; k++) rect(x + (w.face > 0 ? 2 + k : -k) * u, y - k * u, u, u, INK);
    }
  });
}

// A carried sign over a body's head at (x, y), u its cell: the planted fist
// flag (`flagSprite`) a third of the body's cell to its cell, held high on
// a pole up off the body's middle, as the main plane carries it.
function carriedSign(x, y, u) {
  const FL = SKY_FLAG, U = Math.max(1, Math.round(u / 3)), t = Math.max(1, U / 3), A = Math.max(1, Math.round(FL.amp * U / t)) * t;
  const px = x + u, top = y - u * 4 - FL.h * U;
  rect(px, top - A, U, y - top + A, UNION_TONE);
  blit(flagSprite(U, TK % FL.phases, W), px + U, top - A);
}
// A sign set down: when a carrier's load goes from a sign to nothing it has
// planted it, and the sign it carried fades out where it was, on the stage,
// over the span the planted flag fades in over (`drawFlag`). Drawing state.
const carrying = new Map();
let setDown = [];   // cache: keyed by the act, emptied by seeAllSigns when S.after changes
function watchSigns() {
  const t = now();
  for (const w of S.after.bodies) {
    const was = carrying.get(w.id);
    if (was === 'sign' && w.load !== 'sign') {
      const v = seenAt(w.x, w.y), u = P * v.k, s = u * 3;
      setDown.push({ at: t, dx: v.x - s / 2 - gxAt(v.y), foot: v.y, y: v.y - s, u, ord: v.ord + 0.3 });
    }
    carrying.set(w.id, w.load);
  }
  setDown = setDown.filter(g => t - g.at < SIGN_FADE_S && t >= g.at);
}
function drawSetDown(g) {
  alpha(1 - (now() - g.at) / SIGN_FADE_S, () => carriedSign(onPx(gxAt(g.foot) + g.dx), onPx(g.y), g.u));
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
// God's camp, back to front: his rays, the stage, the throne on it,
// the rings off his head, God and his hands, then his crowd's rows back to
// front with what stands on the stage among them by where its foot is --
// the flags, the posters on its front edge, the won souls, the bodies out on
// the way -- his words' fronts over them, and the gaze over them all.
let GZ = null;   // cache: this frame's gaze, worked out at the top of each drawSkyCrowd
export function drawSkyCrowd() {
  if (!S.after) return;
  camFrame();
  freshCaches();
  stepShown();
  EV = eventsNow();
  RINGS = ringsNow();
  WORDS = wordsNow();
  waveFrame();
  hopBands();
  GZ = gazeNow();
  pickWon();
  drawRays();
  drawStage();
  const th = throne();
  blit(th, gx() + th.X0 * H, F.gy0 + th.Y0 * H);
  drawHeadRings();
  drawGod(GZ);
  const rest = handsRest();
  hand(...rest.l); hand(...rest.r);
  // What stands among the crowd, by its foot, drawn as the rows pass it.
  const items = [];
  for (const q of S.after.signs) items.push({ y: flagBox(q).foot, draw: () => drawFlag(q) });
  for (const q of S.after.posters) items.push({ y: posterBox(q).foot + 0.5, draw: () => drawPoster(q) });
  for (const w of S.after.bodies) if (!w.lifted && deepAt(w.x) > 0) items.push({ y: seenAt(w.x, w.y).ord + 0.25, draw: () => body(w) });
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

// --- a fist flag anywhere ------------------------------------------------------------
// The planted flag's own drawing (`flagSprite`) on its pole, for a sign not
// yet planted: racked outside the workshop, held high by a carrier, or being
// lettered on the bench. `px` the pole's left and `foot` its foot, world px;
// `U` a flag cell; `lettered` how much of the fist is on it, 0 to 1, top down
// in whole rows of the fist -- the cloth blank under the rows still to come;
// `pole` world px more pole under the flag than a planted one stands on.
export function drawFistFlag(px, foot, U, lettered = 1, pole = 0) {
  if (!S.after) return;
  camFrame();
  freshCaches();
  const FL = SKY_FLAG, phase = TK % FL.phases, t = Math.max(1, U / 3), A = Math.max(1, Math.round(FL.amp * U / t)) * t;
  const y = foot - (FL.h + FL.up) * U - pole, x = px + U;
  rect(px, y - A, U, foot - y + A, UNION_TONE);
  const rows = Math.round(FL.fist.length * Math.max(0, Math.min(1, lettered)));
  if (rows >= FL.fist.length) { blit(flagSprite(U, phase, W), x, y - A); return; }
  blit(flagSprite(U, phase, UNION_TONE), x, y - A);
  if (rows <= 0) return;
  ctx.save();
  ctx.beginPath(); ctx.rect(x, y - A, FL.w * U, (FL.y + rows) * U + A); ctx.clip();
  blit(flagSprite(U, phase, W), x, y - A);
  ctx.restore();
}
