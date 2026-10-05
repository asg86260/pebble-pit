// The statuses as icons (docs/mocks/status-icons-2026-09-28.html, the owner's
// A and 3): what the fighters have laid on the serpent in a row under its bar,
// in the order they landed; what is on each fighter up a short post at its
// station's right edge. A tile an icon, a timer under it draining in held
// steps, Bleeding's count of sources in its corner.
//
// In screen pixels, like the numbers and the bar: one size however the camera
// is zoomed, over the finished deep, their tones written as seen.

import { S } from '../state.js';
import { ctx } from './ctx.js';
import { now } from '../clock.js';
import { darkPage, turned } from '../ink.js';
import { inspiredK, hasted } from '../deep/statuses.js';
import { standOfStation, deepFloor } from '../deep/place.js';
import { part, resistNow, resistNext, inOrb, orbOn } from '../deep/phases.js';
import { statusLine } from '../deep/rails.js';
import { STATUS_ICONS, STATUS_PX, STATUS_GAP, STATUS_STEPS, STATUS_RENEW_MS, STATUS_TILE, STATUS_RIM,
         STATUS_FOE, STATUS_FACE, STATUS_TIMER, STATUS_SPENT, STATUS_POST, STATUS_POST_OUT, STATUS_POST_FOOT,
         STATUS_COUNT, STATUS_WARN_HZ, RESIST_TURN_S, STATUS_WARN_RIM, STATUS_STRUCK, STATUS_SAYS, MECHANICS } from '../config.js';

const seen = c => darkPage ? turned(c) : c;

// Where each tile stood this frame, in screen pixels, and what its hover says:
// the pointer asks `statusAt` (input.js). The bar's row and the posts, apart.
let barTiles = [], postTiles = [];
export function statusAt(cx, cy) {
  for (const r of [...barTiles, ...postTiles]) if (cx >= r.x - 1 && cx <= r.x + r.w + 1 && cy >= r.y - 1 && cy <= r.y + r.h + 4) return r;
  return null;
}
// A tile's hover: its name and what it does. A phase's mechanic says too
// whether it is coming, on, or stopped.
function saysOf(key, n = 0, mech = null) {
  if (mech) return (STATUS_SAYS[key][mech.struck ? 'stopped' : mech.warn ? 'coming' : mech.calm ? 'calm' : 'on'] ?? '').replace('{x}', mech.x);
  if (key === 'dazed' || key === 'ward' || key === 'plates' || key === 'constricted') return STATUS_SAYS[key];
  const line = statusLine(key);
  return n > 1 ? line.replace(':', ` x${n}:`) : line;
}

// How much of a status is left, 0..1, and when it first came on, by `id`: a
// status's full span is from when it was laid, or last renewed, to its end.
// A lingering buff renewed every frame reads full for as long as it is kept up.
const spans = new Map();
function spanOf(id, until, t) {
  let m = spans.get(id);
  if (!m || t >= m.until) m = { first: t, from: t, until };
  else if (until > m.until + STATUS_RENEW_MS) m.from = t;
  m.until = until;
  spans.set(id, m);
  return { k: Math.max(0, Math.min(1, (until - t) / Math.max(1, until - m.from))), first: m.first };
}

// One tile at (x, y), its top-left, in screen pixels: the icon on dark in its
// rim, the timer under it, a count in its corner. Returns its width.
function tile(key, x, y, k, n = 0, o = {}) {
  const px = STATUS_PX, s = 5 * px + 4, ic = STATUS_ICONS[key];
  const fill = (c, fx, fy, w, h) => { ctx.fillStyle = seen(c); ctx.fillRect(Math.round(fx), Math.round(fy), Math.round(w), Math.round(h)); };
  fill(o.rim || (ic.foe ? STATUS_FOE : STATUS_RIM), x - 1, y - 1, s + 2, s + 2);
  fill(STATUS_TILE, x, y, s, s);
  ctx.fillStyle = seen(ic.foe ? STATUS_FOE : STATUS_FACE);
  ic.rows.forEach((row, r) => [...row].forEach((ch, c) => { if (ch === '#') ctx.fillRect(x + 2 + c * px, y + 2 + r * px, px, px); }));
  const lit = Math.ceil(k * STATUS_STEPS), step = s / STATUS_STEPS;
  for (let i = 0; i < STATUS_STEPS; i++) fill(i < lit ? STATUS_TIMER : STATUS_SPENT, x + i * step, y + s + 2, step - 1, 2);
  if (o.struck) for (let i = 0; i < s; i++) fill(STATUS_STRUCK, x + i, y + s - 1 - i, 1, 1);
  if (n > 1) {
    const d = STATUS_COUNT[Math.min(n, 4)];
    fill(STATUS_TILE, x + s - 5, y + s - 6, 5, 6);
    ctx.fillStyle = seen(STATUS_FACE);
    d.forEach((row, r) => [...row].forEach((ch, c) => { if (ch === '#') ctx.fillRect(x + s - 4 + c, y + s - 5 + r, 1, 1); }));
  }
  return s;
}
const tileW = () => 5 * STATUS_PX + 4;

// --- on the serpent ---------------------------------------------------------------------
// What is on it now, oldest first: the stun (the built stun, `S.serpentStun`)
// and the four laid statuses; Bleeding with how many fighters' bleeds tick.
function foeStatuses(t) {
  const out = [];
  if (S.serpentStun > 0) out.push({ key: 'stun', until: t + S.serpentStun * 1000 });
  for (const key of ['bleed', 'exposed', 'held']) {
    const e = S.statuses?.[key];
    if (!e || !(t < e.until)) continue;
    const n = key === 'bleed' ? Object.values(e.src || {}).filter(b => t < b.until).length : 0;
    out.push({ key, until: e.until, n });
  }
  return out.map(s => ({ ...s, ...spanOf('foe:' + s.key, s.until, t) })).sort((a, b) => a.first - b.first);
}
// The row under the serpent's bar, from its left end, in screen pixels (the
// bar's own transform, render/serpentbar.js).
export function drawFoeStatuses(x, y) {
  const t = now(), s = tileW();
  barTiles = [];
  // first the serpent's own, the phase's mechanic: warned, its rim blinking
  // and its timer the time until it comes on; on, its timer what is left;
  // answered, struck through; then a step, and what the fighters have laid
  // The lash stays up all phase, whether or not it is coming: the melee
  // fighters have to plan round it.
  const p = part();
  if (p.m && (p.part !== 'calm' || p.m.kind === 'lash')) {
    const warn = p.part === 'warn', calm = p.part === 'calm';
    const rim = warn ? STATUS_WARN_RIM[Math.floor(t / 1000 * STATUS_WARN_HZ) % 2] : null;
    barTiles.push({ x, y, w: s, h: s, text: saysOf(p.m.kind, 0, { warn, calm, struck: S.mechSkip, x: p.m.x }) });
    x += tile(p.m.kind, x, y, calm ? 1 : 1 - p.k, 0, { rim, struck: S.mechSkip }) + STATUS_GAP;
  }
  // then the resist the phase stands in, beside the debuffs: in the fading it
  // is the one up, its timer the turn, its rim blinking as the other comes in
  const kind = resistNow();
  if (kind) {
    const key = kind === 'magic' ? 'ward' : 'plates';
    const turn = resistNext() ? STATUS_WARN_RIM[Math.floor(t / 1000 * STATUS_WARN_HZ) % 2] : null;
    barTiles.push({ x, y, w: s, h: s, text: saysOf(key) });
    x += tile(key, x, y, S.serpentStage === 3 ? 1 - (S.phaseAt % RESIST_TURN_S) / RESIST_TURN_S : 1, 0, { rim: turn }) + STATUS_GAP;
  }
  for (const o of foeStatuses(t)) {
    barTiles.push({ x, y, w: s, h: s, text: saysOf(o.key, o.n) });
    x += tile(o.key, x, y, o.k, o.n) + STATUS_GAP;
  }
}

// --- on the fighters ----------------------------------------------------------------------
// What is on a fighter now: its buffs, and dazed while it is thrown and seeing stars.
function ownStatuses(w, t) {
  const out = [];
  if (hasted(w)) out.push({ key: 'haste', until: w.hastedUntil });
  if (inspiredK(w) > 0) out.push({ key: 'inspired', until: w.inspiredUntil });
  const orb = inOrb(w) && orbOn();
  if (orb) out.push({ key: 'constricted', until: orb.at + MECHANICS[S.serpentStage].last * 1000 });
  if (w.dizzyUntil > t) out.push({ key: 'dazed', until: w.dizzyUntil });
  else if (w.falling && w.dizzyFor) out.push({ key: 'dazed', until: t + w.dizzyFor });
  return out.map(s => ({ ...s, ...spanOf(`${w.uid ?? w.id}:${s.key}`, s.until, t) })).sort((a, b) => a.first - b.first);
}
// Up a short post at each station's right edge, a tile a status, the first
// nearest the floor. Drawn in the world's pass, over the finished deep: the
// station's place read through the deep's camera.
export function drawStationStatuses() {
  postTiles = [];
  if (S.view !== 'deep' || !S.snatched) return;
  const t = now(), m = ctx.getTransform(), u = S.dpr;
  const posts = [];
  for (const st of S.stations || []) {
    if (!st.built) continue;
    const w = S.workers.find(o => o.station === st.id);
    if (!w) continue;
    const list = ownStatuses(w, t);
    if (!list.length) continue;
    const g = standOfStation(st);
    posts.push({ list, x: (m.a * (g.x + g.w) + m.e) / u + STATUS_POST_OUT, foot: (m.d * deepFloor() + m.f) / u - STATUS_POST_FOOT });
  }
  if (!posts.length) return;
  ctx.save();
  ctx.setTransform(u, 0, 0, u, 0, 0);
  const s = tileW(), rise = s + STATUS_GAP + 4;
  for (const p of posts) {
    ctx.fillStyle = seen(STATUS_POST);
    ctx.fillRect(Math.round(p.x), Math.round(p.foot - p.list.length * rise - 2), 2, Math.round(p.list.length * rise + 2));
    p.list.forEach((s0, i) => {
      const ty = p.foot - (i + 1) * rise;
      postTiles.push({ x: p.x + 4, y: ty, w: s, h: s, text: saysOf(s0.key) });
      tile(s0.key, p.x + 4, ty, s0.k);
    });
  }
  ctx.restore();
}
