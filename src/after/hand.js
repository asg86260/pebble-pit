// Goods by hand (DESIGN.md, "Act 3's hand work and hand carrying", goods by
// hand; the owner, 2026-10-20: "players should be able to pick up and move
// resources themselves between stations"): a log, a plank, a sheet of paper
// or a sign taken off a station's pile by the shared grab, the same press
// and hold that picks up a member (crew/pointer.js), and let go over another
// pile that takes it, or anywhere else onto the floor.
//
// The hand carries the way a member does (bodies.js, `holds`): as many of
// one good as the yard's carry holds at its weight in slots, taken up one a
// beat (AFTER_PUT_S) while it is held over the pile it took from, and set
// down on a pile one a beat, so a pile counts by the item. Let go over no
// pile that takes it, the load falls to the floor and lies there with the
// felled logs (grove.js, `layGood`), where a gatherer, or the hand again,
// takes it up. Nothing in the hand is ever lost: a save written with a load
// held lays it on the floor where it was held when read back.
//
// The hand is `S.after.hand`, saved with the act: null, or
//   { goods, kind, n, x, y, from, t, held, put }
// -- what it holds and how many, where it is (world px, the cursor's point),
// the pile it took from (`from`, a stock key, or 'floor'), the beat's clock,
// whether it is on the cursor (`held`) or setting its load down on the pile
// `put`.

import { S } from '../state.js';
import { P, AFTER_PUT_S, AFTER_PILE_GOODS, AFTER_PILE_REACH, AFTER_GOODS_FOOT, AFTER_LAY_GAP } from '../config.js';
import { holds } from './bodies.js';
import { built } from './levels.js';
import { groundLogs, settled, takeGroundLog, kindOf, layGood } from './grove.js';
import { pileOwner, pileBox, floorAt, afterX0, afterX1, AP } from './place.js';
import { secs } from './util.js';

const PLACE = 'after';
const inBox = (b, x, y, pad) => x >= b.x - pad && x <= b.x + b.w + pad && y >= b.y - pad && y <= b.y + b.h + pad;
// A pile's whole goods: timber and paper are counted in fractions as they
// are made, and only a whole plank or sheet can be picked up.
const whole = what => Math.floor(S.after.stock[what] || 0);

// The counted pile under (x, y) whose good is `kind` (any, for null), its
// station standing: its stock key, or null.
function pileUnder(x, y, pad, kind = null) {
  for (const [what, k] of Object.entries(AFTER_PILE_GOODS)) {
    if (kind && k !== kind) continue;
    const key = pileOwner(what);
    if (key && built(key) && inBox(pileBox(key, what, AFTER_PILE_REACH), x, y, pad)) return what;
  }
  return null;
}
// A good lying still on the floor under (x, y), of `kind` (any, for null).
function lyingUnder(x, y, pad, kind = null) {
  for (let i = groundLogs().length - 1; i >= 0; i--) {
    const q = groundLogs()[i];
    if (!settled(q) || (kind && kindOf(q) !== kind)) continue;
    if (inBox({ x: q.x, y: floorAt(q.x + AP) - 2 * AP, w: AFTER_GOODS_FOOT[kindOf(q)] * AP, h: 2 * AP }, x, y, pad)) return q;
  }
  return null;
}

// One taken up off `from` into the hand, of `kind`: true if there was one.
function takeOne(from, kind, x, y, pad) {
  if (from === 'floor') { const q = lyingUnder(x, y, pad, kind); return !!q && takeGroundLog(q.id); }
  if (whole(from) < 1) return false;
  S.after.stock[from] -= 1;
  return true;
}

// The load let go onto the floor, each fallen from where the hand holds it,
// a gap apart about the hand's point, kept inside the place as a body's
// landing is (bodies.js, AFTER_CREW `land`).
function lay(h) {
  const step = (AFTER_GOODS_FOOT[h.kind] + AFTER_LAY_GAP) * AP;
  const x0 = afterX0() + P, x1 = afterX1() - P * 2 - AFTER_GOODS_FOOT[h.kind] * AP;
  for (let k = 0; k < h.n; k++) {
    const x = h.x - AFTER_GOODS_FOOT[h.kind] * AP / 2 + (k - (h.n - 1) / 2) * step;
    layGood(h.kind, Math.max(x0, Math.min(x1, Math.round(x / P) * P)), h.y);
  }
  S.after.hand = null;
}

// The place's goods, as the shared hand asks them (crew/pointer.js): what is
// under the pointer, whether a thing is this hand's, taking it up, holding
// it on the cursor and letting it go.
export const AFTER_GOODS = {
  // A good under (x, y) the hand could take: a pile with a whole one on it,
  // or one lying on the floor. Nothing while the hand is setting a load down.
  at(x, y, pad = 0) {
    const a = S.after;
    if (!a || a.hand) return null;
    const what = pileUnder(x, y, pad);
    if (what && whole(what) >= 1) return { goods: PLACE, kind: AFTER_PILE_GOODS[what], from: what, x, y, pad };
    const q = lyingUnder(x, y, pad);
    return q ? { goods: PLACE, kind: kindOf(q), from: 'floor', x, y, pad } : null;
  },
  owns: o => !!o && o.goods === PLACE,
  held: () => (S.after && S.after.hand && S.after.hand.held ? S.after.hand : null),
  // The press: one taken at once, into the hand where the pointer is.
  lift(o) {
    if (!S.after || S.after.hand || !takeOne(o.from, o.kind, o.x, o.y, o.pad || 0)) return false;
    S.after.hand = { goods: PLACE, kind: o.kind, n: 1, x: o.x, y: o.y, from: o.from, pad: o.pad || 0, t: 0, held: true, put: null };
    return true;
  },
  hold(h, x, y) { h.x = x; h.y = y; },
  // Let go: over a pile that takes the good, set down on it a beat at a
  // time (`step`); anywhere else, onto the floor.
  drop(h) {
    if (!h || !h.held) return;
    h.held = false;
    h.t = 0;
    const what = pileUnder(h.x, h.y, h.pad || 0, h.kind);
    if (what) h.put = what;
    else lay(h);
  }
};

// One frame of the hand: held over the pile it took from, another taken up
// each beat until the load is full or the pile bare; let go over a pile,
// one set down on it each beat until the hand is empty.
export function stepHand(c) {
  const a = S.after, h = a && a.hand;
  if (!h) return;
  const dt = secs(c);
  if (h.held) {
    const over = h.from === 'floor' ? !!lyingUnder(h.x, h.y, h.pad || 0, h.kind) : pileUnder(h.x, h.y, h.pad || 0, h.kind) === h.from;
    if (!over || h.n >= holds(h.kind)) { h.t = 0; return; }
    h.t += dt;
    if (h.t < AFTER_PUT_S) return;
    h.t = 0;
    if (takeOne(h.from, h.kind, h.x, h.y, h.pad || 0)) h.n += 1;
    return;
  }
  if (!h.put) { lay(h); return; }
  h.t += dt;
  if (h.t < AFTER_PUT_S) return;
  h.t = 0;
  a.stock[h.put] += 1;
  h.n -= 1;
  if (h.n <= 0) a.hand = null;
}

// A hand read back from a save: a load that was on the cursor is let go
// where it was, onto the floor (the pointer that held it is not held now).
export function settleHand() {
  const h = S.after && S.after.hand;
  if (h && h.held) lay(h);
}
