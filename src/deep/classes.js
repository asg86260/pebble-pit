// The ten classes at work: what the fighter at a station does, by the class
// bought there (docs/wave-party.md, "Classes"; docs/serpent-classes.md
// section 0). A station with no class has a base fighter, who stands guard.
//
// Every class is one ladder: rungs raise its number (`rungWorth`, off the
// class's LADDERS row), rung 4 gives its move and rung 8 its capstone. The
// melee classes swim up to the hide and hang under it, following its sway;
// the ranged ones stand at their station and loose what they loose from
// there. Nothing lands until its body is in the deep (`working`).
//
// The drawing is driven off the sim's own clocks, never fixed animation
// clocks, so these fields on a fighter's body are the seam (none is saved;
// a reload drops a swing in the air, as it drops a shot):
//
//   pose      the attack in hand: { move, at, hit, end, x, y, big, twice }.
//             `move` names it ('punch' 'haymaker' 'cut' 'whirl' 'palm' 'chi'
//             'thrust' 'finisher' 'shoot' 'aimed' 'stab' 'throw' 'hex'
//             'beam' 'finish' 'sing'); `at` the wind-up's start, `hit` its
//             contact (a melee blow lands, a shot leaves the hand), `end`
//             the follow-through's end, all ms on the game's clock; (x, y)
//             the point on the hide it is aimed at. `big` the heavy form,
//             `twice` a cut that lands twice. Null standing guard.
//   struckAt  ms of the last contact: the impact's clock.
//   pips      lit pips in the class's row, of `pipsMax` (0: no row).
//   beam      the Mage's: { at, until, x, y, tx, ty, seg, width, burn }
//             while she holds it -- from her (x, y) to the hide (tx, ty),
//             `width` and `burn` 0..1 as it widens (rung 4) and burns
//             through (rung 8); `until` when the finishing blow is wound.
//   inspiredUntil / inspiredK, hastedUntil   the buffs (deep/statuses.js)
//
// And in the water, `shots` (deep/arms.js).
//
// Track FIGHT owns this file (docs/wave-party.md).

import { S } from '../state.js';
import { P, WORKER, COIL_SEGS, DOT_TICK_S, EXPOSED_AMP, MOVE_RUNG,
         CAPSTONE_RUNG, MELEE_REACH, FOLLOW_K, SWIM_PACE, DEEP_GRAV, rungValue } from '../config.js';
import { commutePace } from '../levels.js';
import { now } from '../clock.js';
import { slotX, coilAt, coilThick, nearestSeg } from './place.js';
import { stationById, classOf, keyOf } from './party.js';
import { mid, feet, working, swim, loose } from './arms.js';
import { strike, woundK } from './serpent.js';
import { rest } from './rest.js';
import { lay, inspire, haste, tempo } from './statuses.js';

const hasCap = st => st.rung >= CAPSTONE_RUNG;
const hasMove = st => st.rung >= MOVE_RUNG;

// What a rung of a class is worth: its LADDERS row, rung 0..8, a percent
// read as a share for a class that says so.
export const rungWorth = (cls, rung) => rungValue(cls.ladder, rung) / (cls.pct ? 100 : 1);

// The fighter's station, and the middle of it on the floor.
export const stationOf = w => (w && w.station ? stationById(w.station) : null);
export const stationX = st => slotX(st.slot);
const toPost = (w, st) => swim(w, stationX(st) - WORKER / 2, feet());

// --- the rhythm of a swing ---------------------------------------------------------

// True on the frame the next attack is due, and the one after it set a tempo
// on from now (Hasted or not). `next` is a moment the save keeps, so a
// refresh never hands a fighter a free swing.
function due(w, t, every) {
  if (!(w.next > 0)) w.next = t;
  if (t < w.next) return false;
  w.next = t + tempo(w, every) * 1000;
  return true;
}
// A swing begun: the wind-up runs to its contact, then the follow-through.
function swing(w, t, move, windup, p, big = false) {
  const hit = t + windup * 1000;
  w.pose = { move, at: t, hit, end: hit + windup * 1000 * FOLLOW_K, x: p.x, y: p.y, big, landed: false };
  if (p.x !== mid(w)) w.face = p.x > mid(w) ? 1 : -1;
  return w.pose;
}
// The swing whose contact is this frame, once.
function landing(w, t) {
  const p = w.pose;
  if (!p || p.landed || t < p.hit) return null;
  p.landed = true;
  w.struckAt = t;
  return p;
}

// --- where a fighter stands ----------------------------------------------------------

// Melee: up under the segment over it, hanging at `off` under the hide, and
// following its sway -- at `slow` of the swim once within `range` of that
// spot, which for the Assassin is nearly still. Null while it is still on
// the way up.
function closeIn(w, t, off = 0, slow = 1, range = MELEE_REACH) {
  const seg = nearestSeg(mid(w), w.y, t).seg;
  const p = coilAt(seg, t);
  const reach = coilThick(seg) / 2 + off;
  const far = Math.hypot(p.x - mid(w), p.y + reach - w.y) > range;
  const there = swim(w, p.x - WORKER / 2, p.y + reach, commutePace() * SWIM_PACE * (far ? 1 : slow));
  if (!there && far) { w.goal = 'rise'; return null; }
  w.goal = 'fight';
  return { seg, p };
}
// Ranged: on the floor at its station, facing the coil. Null on the way.
function atPost(w, st, t) {
  if (!toPost(w, st)) { w.goal = 'back'; return null; }
  w.goal = 'fight';
  const seg = nearestSeg(mid(w), w.y, t).seg;
  return { seg, p: coilAt(seg, t) };
}
const segNear = (seg, by) => Math.max(0, Math.min(COIL_SEGS - 1, Math.round(seg + by)));

// A straight shot from (x, y) to the segment, landing `fly` seconds on.
function shoot(w, kind, x, y, seg, t, fly, land, arc = 0) {
  return loose({ kind, by: w, x, y, x0: x, y0: y, at: t, fly: fly * 1000, seg, arc, land });
}

// --- the ten -------------------------------------------------------------------------

// Heavy punches; from rung 4 every 4th is a haymaker, x4, and from rung 8
// the haymaker stuns.
function brawler(w, c, st, cls, v) {
  const t = c.now, at = closeIn(w, t);
  if (!at) return;
  const hm = cls.haymaker;
  w.pipsMax = hasMove(st) ? hm.every : 0;
  const hit = landing(w, t);
  if (hit) {
    strike(cls.hit, v * (hit.big ? hm.x : 1), at.p.x, at.p.y, null, 0,
           { by: w, stun: hit.big && hasCap(st) ? cls.capStun : 0 });
  }
  if (!due(w, t, cls.every)) return;
  w.count = (w.count || 0) + 1;
  const big = hasMove(st) && w.count % hm.every === 0;
  w.pips = hasMove(st) ? w.count % hm.every : 0;
  swing(w, t, big ? 'haymaker' : 'punch', cls.windup, at.p, big);
}

// Cuts; from rung 4 each lands at three spots along the coil (the
// whirlwind), and from rung 8 every 3rd cut lands twice, the second landing
// leaving the serpent Bleeding. The spots of one cut are one blow, summed on it.
function sword(w, c, st, cls, v) {
  const t = c.now, at = closeIn(w, t);
  if (!at) return;
  w.pipsMax = 0;
  const hit = landing(w, t);
  if (hit) {
    const wh = cls.whirl, wide = hasMove(st);
    const spots = wide ? wh.spots : 1, each = v * (wide ? wh.x : 1);
    const cut = {};
    for (let n = 0; n < (hit.twice ? 2 : 1); n++) {
      for (let i = 0; i < spots; i++) {
        const q = coilAt(segNear(at.seg, (i - (spots - 1) / 2) * wh.spread), t);
        strike(cls.hit, each, q.x, q.y, cut, 0, { by: w });
      }
    }
    if (hit.twice) lay('bleed', v * cls.bleed.dps, cls.bleed.s, at.seg);
  }
  if (!due(w, t, cls.every)) return;
  w.count = (w.count || 0) + 1;
  const p = swing(w, t, hasMove(st) ? 'whirl' : 'cut', cls.windup, at.p);
  p.twice = hasCap(st) && w.count % cls.capEvery === 0;
}

// Palm waves from the well; each fills chi (twice as fast from rung 4), and
// a full row is a chi palm, x3, that stuns (longer from rung 8).
function monk(w, c, st, cls, v) {
  const t = c.now, at = atPost(w, st, t);
  if (!at) return;
  const chi = cls.chi;
  w.pipsMax = chi.max;
  w.pips = Math.min(chi.max, w.pips || 0);
  const hit = landing(w, t);
  if (hit) {
    const big = hit.big, stun = big ? (hasCap(st) ? cls.capStun : 1) : 0;
    shoot(w, big ? 'chi' : 'palm', mid(w), w.y, at.seg, t, cls.fly, (s, q) =>
      strike(cls.hit, v * (big ? chi.x : 1), q.x, q.y, null, 0, { by: w, stun }));
  }
  if (!due(w, t, cls.every)) return;
  const big = w.pips >= chi.max;
  w.pips = big ? 0 : Math.min(chi.max, w.pips + (hasMove(st) ? chi.moveFill : chi.fill));
  swing(w, t, big ? 'chi' : 'palm', cls.windup, at.p, big);
}

// Quick staff thrusts, each a pip (two from rung 4, the Flow); a full row is
// a finisher, a blow of the row's thrusts together; from rung 8 the
// finisher Hastes the whole party.
function martial(w, c, st, cls, v) {
  const t = c.now, at = closeIn(w, t);
  if (!at) return;
  const pp = cls.pips;
  w.pipsMax = pp.max;
  w.pips = Math.min(pp.max, w.pips || 0);
  const hit = landing(w, t);
  if (hit) {
    strike(cls.hit, v * (hit.big ? pp.max * cls.finisherX : 1), at.p.x, at.p.y, null, 0, { by: w });
    if (hit.big && hasCap(st)) for (const o of fighters()) haste(o, cls.capHaste);
  }
  if (!due(w, t, cls.every)) return;
  const big = w.pips >= pp.max;
  w.pips = big ? 0 : Math.min(pp.max, w.pips + (hasMove(st) ? pp.moveFill : pp.fill));
  swing(w, t, big ? 'finisher' : 'thrust', cls.windup, at.p, big);
}

// Arrows from a bow held over the head, arcing up to the hide; from rung 4
// every 5th is aimed, x5, and from rung 8 the aimed shot stuns.
function ranger(w, c, st, cls, v) {
  const t = c.now, at = atPost(w, st, t);
  if (!at) return;
  const am = cls.aimed;
  w.pipsMax = hasMove(st) ? am.every : 0;
  const hit = landing(w, t);
  if (hit) {
    const big = hit.big, stun = big && hasCap(st) ? cls.capStun : 0;
    shoot(w, big ? 'aimed' : 'arrow', mid(w), w.y - P * 2, at.seg, t, cls.fly, (s, q) =>
      strike(cls.hit, v * (big ? am.x : 1), q.x, q.y, null, 0, { by: w, stun }), cls.arc);
  }
  if (!due(w, t, cls.every)) return;
  w.count = (w.count || 0) + 1;
  const big = hasMove(st) && w.count % am.every === 0;
  w.pips = hasMove(st) ? w.count % am.every : 0;
  swing(w, t, big ? 'aimed' : 'shoot', cls.windup, at.p, big);
}

// Daggers from close by: she comes in to a stand-off under the hide and
// holds nearly still there while each dagger travels. x3 on a stunned
// serpent; from rung 4 x(1 + the wound's share of the phase), to x2; from
// rung 8 each dagger leaves it Bleeding. Read when the dagger lands.
function assassin(w, c, st, cls, v) {
  const t = c.now, at = closeIn(w, t, cls.standoff, cls.drift, cls.range);
  if (!at) return;
  w.pipsMax = 0;
  const hit = landing(w, t);
  if (hit) {
    shoot(w, 'dagger', mid(w), w.y, at.seg, t, cls.fly, (s, q) => {
      let x = S.serpentStun > 0 ? cls.stunnedX : 1;
      const exec = hasMove(st) ? Math.min(cls.execMost, 1 + woundK()) : 1;
      strike(cls.hit, v * x * exec, q.x, q.y, null, 0, { by: w });
      if (hasCap(st)) lay('bleed', v * cls.bleed.dps, cls.bleed.s, s.seg);
    });
  }
  if (!due(w, t, cls.every)) return;
  swing(w, t, 'stab', cls.windup, at.p);
}

// Hexes: a bolt that strikes; from rung 4 it Weakens the heal, and from
// rung 8 it stops the heal outright (Held) and lays Exposed.
function hexer(w, c, st, cls, v) {
  const t = c.now, at = atPost(w, st, t);
  if (!at) return;
  w.pipsMax = 0;
  const hit = landing(w, t);
  if (hit) {
    shoot(w, 'hex', mid(w), w.y, at.seg, t, cls.fly, (s, q) => {
      strike(cls.hit, v, q.x, q.y, null, 0, { by: w });
      if (hasMove(st)) lay('weakened', cls.weaken.k, cls.weaken.s, s.seg);
      if (hasCap(st)) {
        lay('held', 0, cls.hold, s.seg);
        lay('exposed', EXPOSED_AMP, cls.exposed, s.seg);
      }
    });
  }
  if (!due(w, t, cls.every)) return;
  swing(w, t, 'hex', cls.windup, at.p);
}

// Charges thrown on the water's gravity. From rung 4 a charge sticks to the
// hide, ticks down and goes off as one blow, x3, that stuns; from rung 8 two
// are thrown at once and go off together.
function sapper(w, c, st, cls, v) {
  const t = c.now, at = atPost(w, st, t);
  if (!at) return;
  w.pipsMax = 0;
  const hit = landing(w, t);
  if (hit) {
    const n = hasCap(st) ? cls.capCharges : 1, sticky = hasMove(st);
    const pair = { blowAt: 0 };
    for (let i = 0; i < n; i++) {
      const seg = segNear(at.seg, (i - (n - 1) / 2) * cls.spread);
      throwCharge(w, seg, t, cls, (s, q) => {
        if (sticky && s.reached) {
          s.stuck = true;
          s.stuckAt = now();
          pair.blowAt = Math.max(pair.blowAt, s.stuckAt + cls.fuse * 1000);
          s.pair = pair;
          s.land = blow;
          return 'stuck';
        }
        strike(cls.hit, v, q.x, q.y, null, 0, { by: w });
      });
    }
    function blow(s, q) {
      strike(cls.hit, v * cls.stickyX, q.x, q.y, pair, 0, { by: w, stun: 1 });
    }
  }
  if (!due(w, t, cls.every)) return;
  swing(w, t, 'throw', cls.windup, at.p);
}
// Aimed where the segment will be when the charge arrives -- the coil's sway
// is a function of the clock -- on the water's gravity, the drag left out, so
// a throw falls a little short and goes off on the way up.
function throwCharge(w, seg, t, cls, land) {
  const x = mid(w), y = w.y;
  const p = coilAt(seg, t + cls.fly * 1000);
  const n = cls.fly * 60;                        // frames, in the sixtieths speeds are written in
  return loose({ kind: 'charge', by: w, x, y, x0: x, y0: y, at: t, fly: cls.fly * 1000, seg,
                 vx: (p.x - x) / n, vy: (p.y - y - 0.5 * DEEP_GRAV * n * n) / n, land });
}

// A held purple beam: it ticks while she holds it, then she winds one
// finishing blow, which stuns if it is worth the stun's share; then a rest.
// From rung 4 the beam widens and its ticks ramp the longer it is held (the
// finisher with them); from rung 8 it burns through: the phase's half does
// not dim it, and the hide under it chips open wider as it is held.
function mage(w, c, st, cls, v) {
  const t = c.now, at = atPost(w, st, t);
  if (!at) { w.beam = null; return; }
  w.pipsMax = 0;
  let b = w.beam;
  const hit = landing(w, t);
  if (hit && hit.move === 'finish') {
    const q = coilAt(hit.seg, t);
    strike(cls.hit, v * cls.finishX * (hit.ramp || 1), q.x, q.y, null, 0,
           { by: w, stun: 1, share: true, through: hasCap(st) });
  }
  if (!b) {
    if (!due(w, t, cls.hold + cls.rest)) { w.goal = w.pose && t < w.pose.end ? 'fight' : 'rest'; return; }
    b = w.beam = { at: t, until: t + cls.hold * 1000, tickAt: t + DOT_TICK_S * 1000, seg: at.seg,
                   width: 0, burn: 0, chip: null };
    w.pose = { move: 'beam', at: t, hit: t, end: b.until, x: at.p.x, y: at.p.y, big: false, landed: true };
  }
  const q = coilAt(b.seg, t);
  const held = Math.min(1, (t - b.at) / (cls.hold * 1000));
  const ramp = hasMove(st) ? 1 + (cls.rampMost - 1) * held : 1;
  Object.assign(b, { x: mid(w), y: w.y, tx: q.x, ty: q.y,
                     width: hasMove(st) ? held : 0, burn: hasCap(st) ? held : 0 });
  w.face = q.x >= mid(w) ? 1 : -1;
  while (b.tickAt <= t && b.tickAt <= b.until) {
    strike(cls.hit, v * DOT_TICK_S * ramp, q.x, q.y, w, 0, { tick: true, by: w, through: hasCap(st) });
    b.tickAt += DOT_TICK_S * 1000;
  }
  if (hasCap(st)) burnChip(b, t);
  if (t < b.until) return;
  const p = swing(w, t, 'finish', cls.windup, q, true);
  p.seg = b.seg;
  p.ramp = ramp;
  w.beam = null;
}
// The burn: one bite on the hide under the beam, kept open and grown while
// it is held, and left to heal like any other once she lets go.
function burnChip(b, t) {
  if (!b.chip || !S.serpentChips.includes(b.chip)) {
    b.chip = { u: b.seg, side: 1, k: 0, at: t };
    S.serpentChips.push(b.chip);
  }
  b.chip.k = b.burn;
  b.chip.at = t;
}

// Sings: every other fighter is Inspired while she does -- by her ladder's
// share, doubled from rung 4 (the Anthem), lingering 6 s after from rung 8.
// She does no damage, and alone her song gives nothing.
function bard(w, c, st, cls, v) {
  const t = c.now;
  w.pipsMax = 0;
  w.beam = null;
  if (!toPost(w, st)) { w.goal = 'back'; w.pose = null; return; }
  w.goal = 'sing';
  if (!w.pose || w.pose.move !== 'sing') w.pose = { move: 'sing', at: t, hit: t, end: Infinity, x: mid(w), y: w.y, big: false, landed: true };
  const k = v * (hasMove(st) ? cls.anthemX : 1), linger = hasCap(st) ? cls.capLinger : cls.linger;
  for (const o of fighters()) if (o !== w) inspire(o, k, linger);
}

const STEP = { brawler, sword, monk, martial, ranger, assassin, hexer, sapper, mage, bard };

// Every fighter body at a station, the one asking included.
export const fighters = () => S.workers.filter(o => o.station && stationById(o.station));

// A base fighter -- a station with no class yet, or none at all -- stands
// guard: at rest about its station, doing nothing.
function guard(w, st, c) {
  w.goal = 'guard';
  w.pose = null;
  w.beam = null;
  w.pips = w.pipsMax = 0;
  rest(w, st ? stationX(st) : 'pods', c);
}

// One frame of a fighter at work, by its station's class.
export function stepFighter(w, c) {
  if (!working(w)) return;
  const st = stationOf(w);
  const cls = st && st.built !== false ? classOf(st) : null;
  const step = cls && STEP[keyOf(st)];
  if (!step) { guard(w, st, c); return; }
  if (w.goal === 'guard' || w.goal === 'rest') w.lull = null;
  step(w, c, st, cls, rungWorth(cls, st.rung));
}
