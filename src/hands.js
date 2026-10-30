// Your hands: what a click, a drag and a flick do.
//
// One hand for every place (DESIGN.md, "One resource system for every act",
// section 2). Sweeping lifts units off the ground under the pointer onto the
// cursor, a flick throws them, a held hand throws handfuls off the pile it is
// near at the hole by itself (once that is bought), and anything still in the
// air can be caught on the way past.
//
// A place supplies its ground, a plot of cells (`groundAt`): the yard's floor,
// the deep's bed, act 3's ground. A unit is a cell value, a grain or a block
// (grid.js, `takeUnit`), so a scale, a plank and a grain of dust are lifted,
// held, thrown, caught and lifted again by the same calls. One kind in the
// hand at a time: each mote remembers its value, and a let-go lands as that.
// The hand holds `capacity()` grains of weight, and a unit weighs its kind's
// `weight` (config/blocks.js): a grain one, a plank four, a log sixteen, and
// never fewer than one unit in the hand.

import { P, BRUSH, THROW, THROW_MAX, LADDER, TOSS_RISE, TOSS_RISE_VARY, HAND_ARC, TOSS_NEAR, DEEP_THROW, HAND_SWAY, KINDS, TOSS_DELAY } from './config.js';
import { S, floor, deepBed } from './state.js';
import { at, put, inside, colOf, bottomY, topRow, takeUnit, kindOf } from './grid.js';
import { spawnChip, aim, bell } from './dust.js';
import { holeLanding } from './pit.js';
import { capacity, tossReach } from './levels.js';
import { now } from './clock.js';
import { rand } from './rng.js';
import { noteThrow, noteCatch } from './notices.js';
import { inDeep, crusherRect } from './deep/place.js';
import { tossIn, dropScale } from './deep/scales.js';
import { placeAt } from './acts.js';

export function track(x, y) {
  S.trail.push({ x, y, t: now() });
  if (S.trail.length > 5) S.trail.shift();
}

// velocity of the flick you let go on
export function throwVel() {
  if (S.trail.length < 2) return { vx: 0, vy: 0 };
  const a = S.trail[0], b = S.trail[S.trail.length - 1];
  const dt = Math.max(16, b.t - a.t);
  if (now() - b.t > 120) return { vx: 0, vy: 0 };   // paused before letting go
  const clamp = v => Math.max(-THROW_MAX, Math.min(THROW_MAX, v));
  return { vx: clamp((b.x - a.x) / dt * THROW), vy: clamp((b.y - a.y) / dt * THROW) };
}

// --- the ground under the hand ---------------------------------------------------
// What a place supplies: { b } its ground plot, `place` the key its thrown
// units are tagged with (none for the yard, whose chain lands them), and
// optionally `take(c, r)`, the place's own door for a unit it keeps a count
// of (act 3's piles, acts.js).
const YARD = { b: floor, place: null };
// The deep's let-go: over the furnace the scales are tossed in on the
// gatherers' arc, else they enter the water as chips on the deep's own pull.
const DEEP = {
  b: deepBed, place: 'deep',
  letGo(x, y, vx, vy, vals) {
    const c = crusherRect();
    if (x >= c.x && x < c.x + c.w && y >= c.y && y < c.y + c.h) { tossIn(x, y, vals); return true; }
    for (const s of vals) dropScale(x + (rand() - 0.5) * P * 4, y + (rand() - 0.5) * P * 4, vx * DEEP_THROW, vy * DEEP_THROW, s);
    return true;
  }
};
// The ground under a world point. Where the pointer is in the world decides
// it, not which half is on the screen; null over a place with no ground.
function groundAt(x, y) {
  if (inDeep(x, y)) return DEEP;
  const pl = placeAt(x, y);
  return pl ? pl.ground || null : YARD;
}

// How many units of `kind` (null: a grain) the hand holds: its capacity in
// grains of weight over the kind's weight, never fewer than one.
export const handHolds = kind => (kind ? Math.max(1, Math.floor(capacity() / KINDS[kind].weight)) : capacity());
// The share of a grain's drift a held unit of `kind` moves by (HAND_SWAY).
function swayOf(kind) {
  const z = kind ? KINDS[kind].size : 1;
  let at = 1;
  for (const k of Object.keys(HAND_SWAY)) if (+k <= z && +k >= at) at = +k;
  return HAND_SWAY[at];
}

// How near the held cursor a thing in flight is caught: forgiving, since dust
// falls quickly. A block's x, y is its middle; a grain's, its cell's top left.
const REACH = (BRUSH + 2) * P;
const inReach = (ch, mx, my) => {
  const off = ch.kind ? 0 : P / 2;
  return Math.abs(ch.x + off - mx) <= REACH && Math.abs(ch.y + off - my) <= REACH;
};
// Whether a press here has a place's goods to catch in the air, at the
// reach `catchAir` catches at. Only a place's: in the yard a mouse press
// anywhere is the hand's already, and a finger near the yard's own traffic
// (a hauler's toss, a stream over the hole) is still the platform's scroll.
function airUnder(mx, my) {
  for (const ch of S.chips) if (ch.place && !ch.auto && inReach(ch, mx, my)) return true;
  return false;
}
// Whether a press here is the hand's: units to sweep under it, or a place's
// goods thrown to catch on the way past. Asked by every press that is not the
// hand's wherever it lands (input.js: a finger anywhere, a press in an act's
// place): a gate that asked only for what lies on the ground let a press on
// a thrown block fall through to whatever stood behind it.
export const handTakes = (mx, my, radius = BRUSH) => dustUnder(mx, my, radius) || airUnder(mx, my);

// Pixels still in flight are caught if they pass the cursor while it is held:
// one kind, in one place, in the hand at a time, up to what it holds.
export function catchAir(mx, my) {
  let had = S.held ? S.motes[0] : null;
  if (had && S.held >= handHolds(had.kind || null)) return;
  {
    const list = S.chips;
    for (let i = list.length - 1; i >= 0; i--) {
      const ch = list[i];
      const place = ch.place || null;
      // not what the held hand itself just let go, or the toss would come
      // straight back off the cursor it left from
      if (ch.auto) continue;
      if (had && ((had.kind || null) !== (ch.kind || null) || (had.place || null) !== place)) continue;
      // full of the held kind (an empty hand has room for anything)
      if (S.held >= handHolds(ch.kind || null)) break;
      if (!inReach(ch, mx, my)) continue;
      list.splice(i, 1);
      S.held++;
      if (!ch.kind && !place) noteCatch(ch);
      S.motes.push(mote(ch.s, place));
      had = S.motes[0];
    }
  }
}

// One unit on the cursor, which drifts out as far as its own size takes it,
// and swings round and bobs by its weight (`sway`): a log hangs nearly still.
const mote = (v, place = null) => {
  const k = kindOf(v), z = (k ? k.size : 1) * P / 2, w = swayOf(k && k.key);
  const m = { s: v, a: rand() * Math.PI * 2, d: z * w * (1 + rand() * 2.6), spin: (rand() - 0.5) * 0.03 * w, bob: rand() * Math.PI * 2, sway: w };
  if (k) m.kind = k.key;
  if (place) m.place = place;
  return m;
};
// What the hand holds when it is a block of some kind (grid.js): its first
// mote (every mote in a hand is one kind), or null for dust, scales or an
// empty hand.
export const heldGoods = () => (S.held && S.motes[0] && S.motes[0].kind ? S.motes[0] : null);

// A plot's cells within the brush, in the order the brush walks them. The
// brush's reach is a distance, so a plot of bigger cells takes fewer. A
// terrain cell is part of the ground, never a unit.
function* brushCells(mx, my, radius = BRUSH, b = floor) {
  if (b.p !== P) radius = Math.round(radius * P / b.p);
  const c0 = colOf(b, mx);
  const r0 = Math.floor((bottomY(b) - my) / b.p);
  for (let dr = -radius; dr <= radius; dr++) {
    for (let dc = -radius; dc <= radius; dc++) {
      if (dc * dc + dr * dr > radius * radius) continue;
      const c = c0 + dc, r = r0 + dr;
      if (inside(b, c, r) && at(b, c, r) && !(b.fixed && b.fixed(c, r))) yield [c, r];
    }
  }
}

// Whether a sweep here would find anything, at the same reach `sweep` uses,
// without taking it. A finger on a phone asks it once, on the press, to tell
// a sweep from a look about (DESIGN.md, "One finger looks about"); `radius`
// is the brush by default or a finger's reach (input.js, `fingerReach`).
export function dustUnder(mx, my, radius = BRUSH) {
  const g = groundAt(mx, my);
  if (!g) return false;
  for (const _ of brushCells(mx, my, radius, g.b)) return true;
  return false;
}
// The hand taken down by a press, in the yard or an act's place alike
// (input.js): the sweep begins under it and goes on at every move while it
// is held, so a press on bare ground dragged onto goods takes them as one
// begun on them does.
export function handDown(mx, my) {
  S.dragging = true;
  S.nextToss = now() + TOSS_DELAY;         // a held sweep throws by itself once unlocked
  S.trail = [];
  track(mx, my);
  sweep(mx, my);
}

// Units off the ground under the hand, as far as it holds: the first it
// takes says the kind, and the rest of the brush's cells that are another
// kind are left. A block comes whole, and only off the top of a heap
// (grid.js, `takeUnit`).
export function sweep(mx, my) {
  const g = groundAt(mx, my);
  if (!g) return;
  const had = S.held ? S.motes[0] : null;
  // a hand of one place's goods sweeps no other's: dust and blocks do not mix
  if (had && (had.place || null) !== (g.place || null)) return;
  let kind = had ? had.kind || null : undefined;   // undefined: an empty hand, which the first unit decides
  let taken = 0;
  for (const [c, r] of brushCells(mx, my, BRUSH, g.b)) {
    if (kind !== undefined && S.held >= handHolds(kind)) break;
    const v = at(g.b, c, r);                 // a block taken whole has left its other cells empty
    if (!v) continue;
    const k = kindOf(v), key = k ? k.key : null;
    if (kind !== undefined && key !== kind) continue;
    const got = g.take ? g.take(c, r) : takeUnit(g.b, c, r);
    if (!got) continue;
    S.motes.push(mote(got, g.place));
    S.held++;
    kind = key;
    taken++;
  }
  // The bench's 'strength' row appears the first time this happens.
  if (taken && !S.seenDrag) { S.seenDrag = true; S.shopStale = true; }
}

// --- track C: a unit put straight into the hand (DESIGN.md, "Act 3's grove,
// rebuilt": the stump pulled out comes into the hand that holds it) ---------------
// A unit of value `v` taken into the hand from where it is now, world point
// `at`: one kind in a hand and no more than it holds, as a sweep keeps it,
// and held as a sweep holds, so the moves and the let-go after are the
// hand's own. Its mote starts where the unit is, off the pointer, its
// spin still, with the distance a held unit of its kind would hang at kept
// as `home` for the caller to swing it in to; nothing jumps. The mote, or
// null when the hand cannot take it.
export function holdUnit(v, at) {
  const g = groundAt(at.x, at.y), place = g ? g.place || null : null, k = kindOf(v), key = k ? k.key : null;
  const had = S.held ? S.motes[0] : null;
  if (had && ((had.kind || null) !== key || (had.place || null) !== place)) return null;
  if (S.held >= handHolds(key)) return null;
  const m = mote(v, place), mx = S.mouse ? S.mouse.x : at.x, my = S.mouse ? S.mouse.y : at.y;
  Object.assign(m, { home: m.d, a: Math.atan2(at.y - my, at.x - mx), d: Math.hypot(at.x - mx, at.y - my), spin: 0 });
  S.motes.push(m);
  S.held++;
  if (!S.dragging) {
    S.dragging = true;
    S.nextToss = now() + TOSS_DELAY;
    S.trail = [];
    track(mx, my);
  }
  return m;
}

// A flick lets the hand go: a chip a unit, its value kept, thrown with the
// flick's velocity and tagged with its place, which lands it on that place's
// ground (game.js, `stepChips`).
export function release(x, y) {
  if (!S.held) return;
  const { vx, vy } = throwVel();
  const m0 = S.motes[0] || {}, kind = m0.kind || null, place = m0.place || null;
  if (place === 'deep' && DEEP.letGo(x, y, vx, vy, S.motes.map(m => m.s || 1))) {
    S.held = 0;
    S.motes = [];
    return;
  }
  // The juggling notice is for the biggest hand there is: a level-0 hand is
  // one grain, and throwing one grain is not juggling.
  const full = !kind && S.carryLevel >= LADDER && S.held >= capacity();
  const spread = kind ? KINDS[kind].size * P : P * 6;
  const from = S.chips.length;
  for (let i = 0; i < S.held; i++) {
    spawnChip(x + (rand() - 0.5) * spread, y + (rand() - 0.5) * spread,
              vx + (rand() - 0.5) * 1.4, vy + (rand() - 0.5) * 1.4, S.motes[i]?.s || 1);
    const ch = S.chips[S.chips.length - 1];
    if (kind) ch.kind = kind;
    if (place) ch.place = place;
  }
  if (!place && !kind) noteThrow(S.chips.slice(from), full);
  S.held = 0;
  S.motes = [];
}

// The pile a held hand works: the one under it, or the nearest whose end is
// within TOSS_NEAR of it. Null on open ground.
export function pileNear(mx) {
  let best = null, gap = TOSS_NEAR + 1;
  for (const p of S.piles) {
    const d = mx < p.from ? p.from - mx : mx >= p.to ? mx - p.to : 0;
    if (d < gap) { best = p; gap = d; }
  }
  return best;
}

// Hold to toss: a handful off the pile the hand is near, thrown from where it
// lay, aimed at the hole on the arc the haulers throw on (`holdToToss` in
// game.js decides when). Not what is in the hand: that stays until you flick
// it. The handful is a brush-wide scoop off the crust nearest the hand, so
// the pile goes from the near end rather than being shaved flat. Near a
// station's strip the hand works the whole strip; anywhere it also reaches
// TOSS_NEAR either side, so a handful that fell short on open ground is
// picked up from there. The hand has a reach (the bench's ladder): a hole
// further off than that gets the handful thrown that far toward it, to land
// on the ground and be picked up again from there. The peak grows with the
// distance, so a throw from the far side of the rock clears it. Not a
// juggle: nothing here is thrown to be caught. Returns how many grains went.
export function tossFromPile(mx, my = S.groundY) {
  // the yard's floor only: a hand held over an act place, on the same x, is
  // over none of it
  if (placeAt(mx, my)) return 0;
  const p = pileNear(mx);
  const from = S.chips.length;
  const c0 = colOf(floor, mx);
  const lo = Math.max(0, Math.min(colOf(floor, mx - TOSS_NEAR), p ? colOf(floor, p.from) : Infinity));
  const hi = Math.min(floor.cols - 1, Math.max(colOf(floor, mx + TOSS_NEAR), p ? colOf(floor, p.to - 1) : -Infinity));
  let room = capacity();
  const perCol = Math.max(1, Math.ceil(room / (BRUSH * 2 + 1)));
  const hole = holeLanding();
  const take = c => {
    for (let k = 0; k < perCol && room > 0; k++) {
      const r = topRow(floor, c);
      if (r < 0) return;
      const v = at(floor, c, r);
      put(floor, c, r, 0);
      room--;
      const fx = floor.x + c * P, fy = bottomY(floor) - (r + 1) * P;
      const land = Math.abs(hole - fx) <= tossReach() ? hole : fx + Math.sign(hole - fx) * tossReach();
      const rise = Math.max(TOSS_RISE, Math.abs(land - fx) * HAND_ARC) * (1 + bell() * TOSS_RISE_VARY * 0.4);
      const vel = aim(fx, fy, land, P, rise);
      spawnChip(fx, fy, vel.vx, vel.vy, v);
      S.chips[S.chips.length - 1].auto = true;    // past the hand that threw it (catchAir)
    }
  };
  // nearest columns first, either side of the hand, out to the strip's ends
  for (let d = 0; room > 0 && (c0 - d >= lo || c0 + d <= hi); d++) {
    if (c0 - d >= lo && c0 - d <= hi) take(c0 - d);
    if (d && c0 + d >= lo && c0 + d <= hi) take(c0 + d);
  }
  const went = S.chips.length - from;
  if (went) noteThrow(S.chips.slice(from), false);
  return went;
}

