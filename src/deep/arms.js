// The weapons made of the abyss: what a body at each deep station does, and
// what is in the water because of it -- lances, grenades and their rings,
// sigils, beams, the called star.
//
// Nothing strikes the serpent that a body did not bring or a click did not
// swing. A lance is drawn at the well and carried up by the hand that threw
// it; a grenade leaves a grenadier's hands; a beam is there only while a
// wizard stands at the spire channelling it. So every step below does
// nothing until its body has arrived in the deep (`working`), and a body
// that is still on its way down the shaft is not yet anybody's weapon.
//
// A body's work is kept in fields the crew's save already carries (`KEEPS`
// and the moments in crew/records.js): `goal` for what it is in the middle
// of, `holding` for a lance or grenade in hand, `spot` for its place on the
// floor, and `next` / `swingAt` for its clocks. Anything else here is worked
// out again on the frame after a reload.
//
// Track SERPENT owns this file (docs/wave-serpent.md). The `step*` functions
// are each deep job's `work` step, called by the JOBS registry
// (src/crew/jobs.js) once the body is at its station.

import { S } from '../state.js';
import { P, WORKER, COIL_SEGS, COIL_THICK, SPLIT_LENGTHS, DEEP_STAND_W, DEEP_GRAV,
         SWIM_PACE, PUNCH_REACH, LANCE_DRAW_S, LANCE_FLY, LANCE_THROW_R, GRENADE_DRAW_S,
         GRENADE_FLY_S, GRENADE_R, GRENADE_RING_S, SIGIL_DRAW_S, SIGIL_GAP, BEAM_REACH,
         DOT_TICK_S, STAR_EVERY_S, STAR_DMG, STAR_FALL_S, STAR_SKY_H, STAR_UNDER_S,
         STAR_DEEP_S, rungValue } from '../config.js';
import { frames } from '../clock.js';
import { commutePace } from '../levels.js';
import { abyssLine } from '../pit.js';
import { deepTop, deepFloor, deepX0, deepX1, inDeep, mouthX, spotX, coilAt, nearestSeg } from './place.js';
import { strike } from './serpent.js';

// --- a body in the water ----------------------------------------------------------

export const mid = w => w.x + WORKER / 2;
// Where a body's top stands on the deep's floor: the deep way's feet.
export const feet = () => deepFloor() - WORKER;

// Arrived: not commuting, and down in the deep rather than in the shaft or
// the yard above it.
export const working = w => !w.walking && inDeep(mid(w), w.y + WORKER - 1);

// A body off the floor is held up by the water, the way a seat holds a
// driver: stamped every frame it is up there, so the rules about falling and
// floating (crew/step.js, verify.js rule 9) read it as supported for as long
// as it is swimming and not a frame longer.
const afloat = w => { if (w.y < feet() - P) w.aboardAt = S.tick; };

// One frame's swim toward a top-left (tx, ty), at a share of the walk.
// True once it is there.
export function swim(w, tx, ty) {
  const step = commutePace() * SWIM_PACE * frames();
  const dx = tx - w.x, dy = ty - w.y, d = Math.hypot(dx, dy);
  if (dx) w.face = dx > 0 ? 1 : -1;
  if (d <= step) { w.x = tx; w.y = ty; afloat(w); return true; }
  w.x += dx / d * step;
  w.y += dy / d * step;
  afloat(w);
  return false;
}

// A body's own place at its station: where it arrived, while that is still
// on the station's footprint; the station's middle otherwise (a body moved
// from another deep job carries its old spot).
function home(w, key) {
  const at = spotX(key) - WORKER / 2;
  if (!(Number.isFinite(w.spot) && Math.abs(w.spot - at) <= DEEP_STAND_W / 2)) {
    w.spot = Math.abs(w.x - at) <= DEEP_STAND_W / 2 ? Math.round(w.x) : at;
  }
  return w.spot;
}

// Back on the floor at its place; true once there.
const toFloor = (w, key) => swim(w, home(w, key), feet());

// --- the five jobs ----------------------------------------------------------------

// Punching: up from the altar to the segment over it, and at it for as long
// as it is on the job. It stays at the coil and follows its sway.
export const stepBrawler = (w, c) => {
  if (!working(w)) return;
  const t = c.now;
  const seg = nearestSeg(mid(w), w.y, t).seg;
  const p = coilAt(seg, t);
  if (!swim(w, p.x - WORKER / 2, p.y + COIL_THICK / 2)
      && Math.hypot(p.x - mid(w), p.y - w.y) > PUNCH_REACH + COIL_THICK / 2) {
    w.goal = 'rise';
    return;
  }
  w.goal = 'fight';
  if (w.swingAt > t) return;
  strike('punch', rungValue('punch', S.punchLevel), p.x, p.y);
  w.punchAt = t;                                     // for the drawing: the fist out
  w.swingAt = t + 1000 / rungValue('brawl', S.brawlLevel);
};

// Lances: drawn at the well, carried up toward the coil, thrown from a
// throw's length off it, and the thrower swims back down for the next.
export const stepLancer = (w, c) => {
  if (!working(w)) return;
  const t = c.now;
  if (!w.holding) {
    if (!toFloor(w, 'well')) { w.goal = 'back'; return; }
    if (w.goal !== 'draw' || !(w.next > 0)) { w.goal = 'draw'; w.next = t + LANCE_DRAW_S * 1000; }
    if (t < w.next) return;
    w.holding = 1;
    w.next = 0;
    w.goal = 'swim';
    return;
  }
  w.goal = 'swim';
  const near = nearestSeg(mid(w), w.y, t);
  const p = coilAt(near.seg, t);
  if (near.d > LANCE_THROW_R) { swim(w, p.x - WORKER / 2, p.y + COIL_THICK); return; }
  afloat(w);
  S.lances.push({ x: mid(w), y: w.y, x0: mid(w), y0: w.y, at: t, seg: near.seg,
                  until: 0, stuck: false, tickAt: 0 });
  w.holding = 0;
  w.goal = 'back';
};

// Grenades: held at the font, thrown at the coil at the grenadier's pace.
export const stepGrenadier = (w, c) => {
  if (!working(w)) return;
  const t = c.now;
  if (!toFloor(w, 'font')) { w.goal = 'back'; w.holding = 0; return; }
  const hold = GRENADE_DRAW_S * 1000;
  const every = Math.max(hold, 60000 / rungValue('grenadepace', S.grenadepaceLevel));
  if (!(w.next > 0)) w.next = t + hold;
  // In hand for the last stretch before the throw; the rest of the wait is
  // the pace.
  w.holding = w.next - t <= hold ? 1 : 0;
  w.goal = w.holding ? 'draw' : 'wait';
  if (t < w.next) return;
  throwGrenade(w, t);
  w.holding = 0;
  w.next = t + every;
};

// Aimed where the segment over the font will be when it arrives: the coil's
// sway is a function of the clock, so where it will be is known. The water's
// drag is left out of the aim, so a throw falls a little short and bursts on
// the way up instead; the ring reaches the coil all the same.
function throwGrenade(w, t) {
  const x = mid(w), y = w.y;
  const seg = nearestSeg(x, y, t).seg;
  const p = coilAt(seg, t + GRENADE_FLY_S * 1000);
  const n = GRENADE_FLY_S * 60;                      // frames, in the sixtieths speeds are written in
  S.grenades.push({ x, y, at: t, vx: (p.x - x) / n,
                    vy: (p.y - y - 0.5 * DEEP_GRAV * n * n) / n });
}

// Sigils: circles drawn on the floor under the coil, either side of the
// circle station, up to what the ladder holds. A circle is drawn where the
// scribe stands, so it walks to each one.
export const stepScribe = (w, c) => {
  if (!working(w)) return;
  const t = c.now;
  const want = rungValue('sigil', S.sigilLevel);
  if (S.sigils.length >= want) {
    w.circle = null;
    w.goal = 'rest';
    w.next = 0;
    toFloor(w, 'circle');
    return;
  }
  if (w.circle == null || slotTaken(w.circle, w)) w.circle = freeSlot(w);
  if (!swim(w, slotX(w.circle) - WORKER / 2, feet())) { w.goal = 'go'; return; }
  if (w.goal !== 'draw' || !(w.next > 0)) { w.goal = 'draw'; w.next = t + SIGIL_DRAW_S * 1000; }
  if (t < w.next) return;
  S.sigils.push({ x: slotX(w.circle), slot: w.circle });
  w.circle = null;
  w.next = 0;
  w.goal = 'go';
};

// The places a circle may be drawn: one either side of the station, then two
// either side, and so on out, inside the deep.
function slotX(i) {
  const k = Math.floor(i / 2) + 1, side = i % 2 ? -1 : 1;
  const x = spotX('circle') + side * k * SIGIL_GAP;
  return Math.max(deepX0() + P, Math.min(deepX1() - P * 2, x));
}
const slotTaken = (i, by) => S.sigils.some(s => s.slot === i)
  || S.workers.some(o => o !== by && o.type === by.type && o.circle === i && o.goal === 'draw');
function freeSlot(w) {
  let i = 0;
  while (slotTaken(i, w)) i++;
  return i;
}

// Wizards: from the spire, a beam to the nearest segment in reach, striking
// for as long as it is held and lighting the coil it touches.
const beamOf = new WeakMap();
export const stepWarlock = (w, c) => {
  if (!working(w)) return;
  const t = c.now;
  if (!toFloor(w, 'spire')) { w.goal = 'back'; return; }
  const x = mid(w), y = w.y;
  const near = nearestSeg(x, y, t);
  if (near.d > BEAM_REACH) { w.goal = 'rest'; w.next = 0; return; }
  w.goal = 'channel';
  const p = coilAt(near.seg, t);
  let b = beamOf.get(w);
  if (!b || !S.beams.includes(b)) { b = {}; beamOf.set(w, b); S.beams.push(b); }
  Object.assign(b, { x, y, tx: p.x, ty: p.y, seg: near.seg, tick: S.tick });
  if (!(w.next > 0)) w.next = t + DOT_TICK_S * 1000;
  if (t < w.next) return;
  strike('beam', rungValue('beam', S.beamLevel) * DOT_TICK_S, p.x, p.y);
  w.next = Math.max(t, w.next) + DOT_TICK_S * 1000;
};

// --- the water's own ----------------------------------------------------------------

// Which length of the coil a segment is in: in the splitting stage it has
// come apart into SPLIT_LENGTHS, and otherwise it is one body.
export const lengthOf = i => S.serpentStage === 2 ? Math.floor(i * SPLIT_LENGTHS / COIL_SEGS) : 0;

// A lance in the water flies to its segment; stuck, it rides the coil,
// bleeding in ticks until it dissolves.
function stepLances(t) {
  const hold = rungValue('lancehold', S.lanceholdLevel) * 1000;
  let keep = 0;
  for (const l of S.lances) {
    const p = coilAt(l.seg, t);
    if (!l.stuck) {
      const k = Math.min(1, (t - l.at) / (LANCE_FLY * 1000));
      l.x = l.x0 + (p.x - l.x0) * k;
      l.y = l.y0 + (p.y - l.y0) * k;
      if (k >= 1) { l.stuck = true; l.until = t + hold; l.tickAt = t + DOT_TICK_S * 1000; }
      S.lances[keep++] = l;
      continue;
    }
    l.x = p.x;
    l.y = p.y;
    while (l.tickAt <= t && l.tickAt <= l.until) {
      strike('lance', rungValue('lance', S.lanceLevel) * DOT_TICK_S, p.x, p.y);
      l.tickAt += DOT_TICK_S * 1000;
    }
    if (t >= l.until) continue;                     // dissolved
    S.lances[keep++] = l;
  }
  S.lances.length = keep;
}

// A grenade on the deep's gravity until it reaches the coil, or has been in
// the water twice its aimed time, and then it bursts where it is.
function stepGrenades(t) {
  const f = frames();
  let keep = 0;
  for (const g of S.grenades) {
    g.vy += DEEP_GRAV * f;
    g.x += g.vx * f;
    g.y += g.vy * f;
    const reached = nearestSeg(g.x, g.y, t).d <= COIL_THICK;
    const lost = t - g.at > GRENADE_FLY_S * 2000 || g.y < deepTop() || g.y > deepFloor();
    if (reached || lost) { S.rings.push({ x: g.x, y: g.y, at: t, r: 0, hit: [] }); continue; }
    S.grenades[keep++] = g;
  }
  S.grenades.length = keep;
}

// A burst's ring grows to its reach, and strikes each length of coil once,
// the first frame it touches any segment of it.
function stepRings(t) {
  const span = GRENADE_RING_S * 1000;
  const dmg = rungValue('grenade', S.grenadeLevel);
  let keep = 0;
  for (const ring of S.rings) {
    const k = Math.min(1, (t - ring.at) / span);
    ring.r = GRENADE_R * k;
    for (let i = 0; i < COIL_SEGS; i++) {
      const len = lengthOf(i);
      if (ring.hit.includes(len)) continue;
      const p = coilAt(i, t);
      if (Math.hypot(p.x - ring.x, p.y - ring.y) > ring.r + COIL_THICK / 2) continue;
      ring.hit.push(len);
      strike('grenade', dmg, p.x, p.y);
    }
    if (k < 1) S.rings[keep++] = ring;
  }
  S.rings.length = keep;
}

// The called star. Every so often one is pulled out of the yard's sky into
// the pit at the shaft, seen from the yard all the way down; under the
// surface it is unseen, and it comes out of the deep's ceiling onto the coil
// -- onto what a wizard is lighting, if one is. The wait runs only while no
// star is on its way, so a reload that loses one mid-fall calls it again.
function stepStar(c) {
  if (!S.starOpen) { S.starFall = null; return; }
  const t = c.now;
  const lvl = Math.max(0, Math.min(STAR_EVERY_S.length - 1, S.starLevel));
  const s = S.starFall;
  if (!s) {
    S.starAt -= c.dt / 1000;
    if (S.starAt > 0) return;
    const y0 = S.groundY - STAR_SKY_H;
    S.starFall = { x: mouthX(), y: y0, y0, at: t, phase: 'sky', seg: null };
    return;
  }
  if (s.phase === 'sky') {
    const k = Math.min(1, (t - s.at) / (STAR_FALL_S * 1000));
    s.y = s.y0 + (abyssLine() - s.y0) * k;
    if (k >= 1) { s.phase = 'under'; s.at = t; s.y0 = s.y; }
    return;
  }
  if (s.phase === 'under') {
    const k = Math.min(1, (t - s.at) / (STAR_UNDER_S * 1000));
    s.y = s.y0 + (deepTop() - s.y0) * k;
    if (k < 1) return;
    s.phase = 'deep';
    s.at = t;
    s.y0 = deepTop();
    s.seg = S.beams.length ? S.beams[0].seg : nearestSeg(s.x, deepTop(), t).seg;
    s.x0 = s.x;
    return;
  }
  const p = coilAt(s.seg, t);
  const k = Math.min(1, (t - s.at) / (STAR_DEEP_S * 1000));
  s.x = s.x0 + (p.x - s.x0) * k;
  s.y = s.y0 + (p.y - s.y0) * k;
  if (k < 1) return;
  strike('star', STAR_DMG[lvl], p.x, p.y);
  S.starFall = null;
  S.starAt = STAR_EVERY_S[lvl];
}

// The water's own: lances bleeding, grenades flying, rings spreading, beams,
// the star. A beam is only this frame's: a wizard that has stopped
// channelling -- taken off, gone up, out of reach -- leaves none behind.
export const stepArms = c => {
  S.beams = S.beams.filter(b => b.tick === S.tick);
  stepLances(c.now);
  stepGrenades(c.now);
  stepRings(c.now);
  stepStar(c);
};
