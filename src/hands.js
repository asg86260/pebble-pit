// Your hands: what a click, a drag and a flick do.
//
// Sweeping lifts dust off the ground onto the cursor, a flick throws it, a
// held hand throws handfuls off the pile it is near at the hole by itself
// (once that is bought), and anything still in the air can be caught on the
// way past.
//
// The ground is whichever plot is under the hand: the yard's floor, or an act
// place's pile (acts.js, a place's `plots`; act 3's in after/piles.js), so
// act 3's goods are picked up and thrown as act 1's dust is (DESIGN.md, "Act
// 3's goods are blocks, and bodies carry every one", rule 5). One kind in the
// hand at a time: each mote remembers what it is, a place's goods (`kind`,
// `place`) or the yard's dust, and a let-go lands as that.

import { P, BRUSH, THROW, THROW_MAX, LADDER, TOSS_RISE, TOSS_RISE_VARY, HAND_ARC, TOSS_NEAR, DEEP_THROW, AFTER_BLOCK, HAND_ONE, HAND_FLOOR, HAND_SWAY } from './config.js';
import { S, floor } from './state.js';
import { at, put, inside, colOf, bottomY, topRow } from './grid.js';
import { spawnChip, aim, bell } from './dust.js';
import { holeLanding } from './pit.js';
import { capacity, tossReach } from './levels.js';
import { now } from './clock.js';
import { rand } from './rng.js';
import { noteThrow, noteCatch } from './notices.js';
import { inDeep, crusherRect } from './deep/place.js';
import { scoop, bedNear, tossIn } from './deep/scales.js';
import { PLACES, placeAt } from './acts.js';

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

// A held thing's size in art cells a side: a place's block by its own size,
// a grain (or a good drawn a grain big) one.
const sizeOf = kind => (kind && AFTER_BLOCK[kind]) || 1;
// How many of `kind` (null: the yard's dust) the hand holds, by size alone
// (config, HAND_ONE): one log, a share of the hand of planks, a full hand of
// dust.
export function handHolds(kind = null) {
  const z = sizeOf(kind);
  if (z >= HAND_ONE) return 1;
  if (z <= 1) return capacity();
  return Math.max(HAND_FLOOR, Math.floor(capacity() / (z * z)));
}
// The share of a grain's drift a held thing of `kind` moves by (HAND_SWAY).
function swayOf(kind) {
  const z = sizeOf(kind);
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
// Whether a press here is the hand's: dust (or a place's goods) to sweep
// under it, or a place's goods thrown to catch on the way past. Asked by
// every press that is not the hand's wherever it lands (input.js: a finger
// anywhere, a press in an act's place): a gate that asked only for what
// lies on the ground let a press on a thrown block fall through to whatever
// stood behind it.
export const handTakes = (mx, my, radius = BRUSH) => dustUnder(mx, my, radius) || airUnder(mx, my);

// pixels still in flight are caught if they pass the cursor while it is held
export function catchAir(mx, my) {
  catchSinking(mx, my);
  let had = S.held ? S.motes[0] : null;
  if (had && S.held >= handHolds(had.kind)) return;

  for (let i = S.chips.length - 1; i >= 0; i--) {
    const ch = S.chips[i];
    // not what the held hand itself just let go, or the toss would come
    // straight back off the cursor it left from
    if (ch.auto) continue;
    // one kind in the hand: a grain into a hand of dust, a block into a hand
    // of its own goods
    if (had && (had.kind || null) !== (ch.kind || null)) continue;
    // full of the held kind (an empty hand has room for anything)
    if (S.held >= handHolds(ch.kind)) break;
    if (!inReach(ch, mx, my)) continue;
    S.chips.splice(i, 1);
    S.held++;
    if (ch.kind) S.motes.push(mote(ch.s, ch));
    else { noteCatch(ch); S.motes.push(mote(ch.s)); }
    had = S.motes[0];
  }
}

// The deep's water is the same air to the hand: a scale sinking past the held
// cursor is caught as a falling grain is, into the hand that sweeps the
// floor. Only a free fall: one riding a toss's arc to the crusher (`arc`) is
// already on its way in. A hand holding the yard's dust is not handed
// scales on top of it: a let-go would drop only the one kind.
function catchSinking(mx, my) {
  if (S.held || !S.sinking.length) return;
  let room = capacity() - S.heldScales;
  if (room <= 0) return;
  const sink = S.sinking;
  let keep = 0;
  for (let i = 0; i < sink.length; i++) {
    const g = sink[i];
    if (room > 0 && g.arc == null && Math.abs(g.x - mx) <= REACH && Math.abs(g.y - my) <= REACH) {
      S.motes.push(mote(g.s));
      S.heldScales++;
      room--;
      continue;
    }
    sink[keep++] = g;
  }
  sink.length = keep;
}

// One grain on the cursor, or one of a place's blocks (`goods`: its `kind`
// and `place`), which drifts out as far as its own size takes it, and swings
// round and bobs by its weight (`sway`): a log hangs nearly still.
const mote = (s, goods = null) => {
  const z = goods ? sizeOf(goods.kind) * P / 2 : P, w = swayOf(goods && goods.kind);
  const m = { s, a: rand() * Math.PI * 2, d: z * w * (1 + rand() * 2.6), spin: (rand() - 0.5) * 0.03 * w, bob: rand() * Math.PI * 2, sway: w };
  if (goods) { m.kind = goods.kind; m.place = goods.place; }
  return m;
};
// What the hand holds when it is a place's goods: its first mote (every mote
// in a hand is one kind), or null for the yard's dust or an empty hand.
export const heldGoods = () => (S.held && S.motes[0] && S.motes[0].kind ? S.motes[0] : null);

// The plot under a point: an act place's pile there ({ b, what, kind,
// place }), its floor where goods lie within `reach` px ({ lying, kind,
// place }), the yard's floor ({ b }), or null over an act place's bare
// ground, which is no floor of the yard's though it lies on the same x.
function plotAt(x, y, reach = BRUSH * P) {
  const pl = placeAt(x, y);
  if (!pl) return { b: floor };
  const spot = pl.plots ? pl.plots.at(x, y, reach) : null;
  if (spot) spot.place = Object.keys(PLACES).find(k => PLACES[k] === pl);
  return spot;
}

// A plot's cells within the brush, in the order the brush walks them. The
// brush's reach is a distance, so a plot of bigger cells takes fewer.
function* brushCells(mx, my, radius = BRUSH, b = floor) {
  if (b.p !== P) radius = Math.round(radius * P / b.p);
  const c0 = colOf(b, mx);
  const r0 = Math.floor((bottomY(b) - my) / b.p);
  for (let dr = -radius; dr <= radius; dr++) {
    for (let dc = -radius; dc <= radius; dc++) {
      if (dc * dc + dr * dr > radius * radius) continue;
      const c = c0 + dc, r = r0 + dr;
      if (inside(b, c, r) && at(b, c, r)) yield [c, r];
    }
  }
}

// Whether a sweep here would find anything, at the same reach `sweep` uses,
// without taking it. A finger on a phone asks it once, on the press, to tell
// a sweep from a look about (DESIGN.md, "One finger looks about").
// Is there dust to sweep within `radius` cells of a point: the brush by
// default, or a finger's reach (input.js, `fingerReach`).
export function dustUnder(mx, my, radius = BRUSH) {
  if (inDeep(mx, my)) return bedNear(mx, my, radius * P);
  const spot = plotAt(mx, my, radius * P);
  if (!spot) return false;
  if (spot.lying) return true;
  for (const _ of brushCells(mx, my, radius, spot.b)) return true;
  return false;
}

export function sweep(mx, my) {
  // In the deep the same hand works the floor's loose scales, and what it
  // throws is thrown into the water (DESIGN.md, "The crusher"). Where the
  // pointer is in the world decides it, not which half is on the screen.
  if (inDeep(mx, my)) { sweepScales(mx, my); return; }
  const spot = plotAt(mx, my);
  if (!spot) return;
  if (spot.kind) { sweepGoods(mx, my, spot); return; }
  // a hand of a place's goods sweeps no dust
  if (heldGoods()) return;
  let room = capacity() - S.held;
  if (room <= 0) return;

  let taken = 0;
  for (const [c, r] of brushCells(mx, my)) {
    if (room <= 0) break;
    const v = at(floor, c, r);
    put(floor, c, r, 0);
    S.motes.push(mote(v));
    taken++;
    room--;
  }
  if (taken) {
    S.held += taken;
    // The bench's 'strength' row appears the first time this happens.
    if (!S.seenDrag) { S.seenDrag = true; S.shopStale = true; }
  }
}

// A place's blocks off the pile under the hand, through the place's own door
// (its `plots.take`), so the pile and its stock stay one. Only into an empty
// hand or one of the same goods: a hand of planks sweeps no logs, and a hand
// of dust no blocks.
function sweepGoods(mx, my, spot) {
  const had = S.held ? S.motes[0] : null;
  if (had && (!had.kind || had.place !== spot.place)) return;
  if (spot.lying) { liftGoods(mx, my, spot, had); return; }
  if (had && had.kind !== spot.kind) return;
  let room = handHolds(spot.kind) - S.held;
  if (room <= 0) return;
  const plots = PLACES[spot.place].plots;
  // gathered first: a take lets the blocks over it slump, and the brush
  // takes the heap as it stood when the hand came down on it
  const cells = [...brushCells(mx, my, BRUSH, spot.b)];
  for (const [c, r] of cells) {
    if (room <= 0) break;
    const v = at(spot.b, c, r);
    if (!v || !plots.take(spot, c, r)) continue;
    S.motes.push(mote(v, spot));
    S.held++;
    room--;
  }
}

// A place's goods lying on its floor within the brush, nearest first, into
// the hand through the place's door (`plots.lift`): one kind, the held
// one's or else the nearest's, so a hand of planks passed over a log takes
// the planks beside it.
function liftGoods(mx, my, spot, had) {
  const kind = had ? had.kind : spot.kind;
  let room = handHolds(kind) - S.held;
  if (room <= 0) return;
  const plots = PLACES[spot.place].plots;
  for (const q of plots.lyingNear(mx, my, BRUSH * P, kind)) {
    if (room <= 0) break;
    if (!plots.lift(q)) continue;
    S.motes.push(mote(1, { kind, place: spot.place }));
    S.held++;
    room--;
  }
}

// Scales off the deep's bed onto the cursor, as far as the hand holds: the
// same hand as the yard's, so the same `capacity`. Only near the bed's top:
// a sweep up in the water is a sweep through nothing.
function sweepScales(mx, my) {
  const room = capacity() - S.heldScales;
  if (room <= 0 || !bedNear(mx, my, BRUSH * P)) return;
  const got = scoop(mx, room, BRUSH * P);
  for (const v of got) S.motes.push(mote(v));
  S.heldScales += got.length;
}

export function release(x, y) {
  const { vx, vy } = throwVel();
  // Scales in the hand go into the water where they are let go, on the
  // deep's own gravity: over the hopper, they fall in and are crushed. Let go
  // on the furnace itself, below its mouth, they would sink behind the brick
  // to the floor, so the hand tosses them up over the lip on the gatherers'
  // arc instead: the furnace is the thing a player drops them on.
  if (S.heldScales) {
    const c = crusherRect();
    if (x >= c.x && x < c.x + c.w && y >= c.y && y < c.y + c.h) {
      tossIn(x, y, Array.from({ length: S.heldScales }, (_, i) => S.motes[i]?.s || 1));
      S.heldScales = 0;
      S.motes = [];
      return;
    }
    for (let i = 0; i < S.heldScales; i++) {
      S.sinking.push({ x: x + (rand() - 0.5) * P * 4, y: y + (rand() - 0.5) * P * 4,
                       vx: vx * DEEP_THROW, vy: vy * DEEP_THROW, s: S.motes[i]?.s || 1 });
    }
    S.heldScales = 0;
    S.motes = [];
    return;
  }
  if (!S.held) return;
  // A place's goods are thrown as themselves, a block a mote with the
  // flick's velocity, and land on its piles or its ground (game.js,
  // `stepChips`). Not the yard's juggling: no dust was thrown.
  const goods = heldGoods();
  if (goods) {
    const spread = AFTER_BLOCK[goods.kind] * P;
    for (let i = 0; i < S.held; i++) {
      spawnChip(x + (rand() - 0.5) * spread, y + (rand() - 0.5) * spread,
                vx + (rand() - 0.5) * 1.4, vy + (rand() - 0.5) * 1.4, S.motes[i]?.s || 1);
      const ch = S.chips[S.chips.length - 1];
      ch.kind = goods.kind;
      ch.place = goods.place;
    }
    S.held = 0;
    S.motes = [];
    return;
  }
  // The juggling notice is for the biggest hand there is: a level-0 hand is
  // one grain, and throwing one grain is not juggling.
  const full = S.carryLevel >= LADDER && S.held >= capacity();
  const from = S.chips.length;
  for (let i = 0; i < S.held; i++) {
    spawnChip(x + (rand() - 0.5) * P * 6, y + (rand() - 0.5) * P * 6,
              vx + (rand() - 0.5) * 1.4,
              vy + (rand() - 0.5) * 1.4,
              S.motes[i]?.s || 1);
  }
  noteThrow(S.chips.slice(from), full);
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

