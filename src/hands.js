// Your hands: what a click, a drag and a flick do.
//
// Sweeping lifts dust off the ground onto the cursor, a flick throws it, a
// held hand throws handfuls off the pile it is near at the hole by itself
// (once that is bought), and anything still in the air can be caught on the
// way past.

import { P, BRUSH, THROW, THROW_MAX, LADDER, TOSS_RISE, TOSS_RISE_VARY, HAND_ARC, TOSS_NEAR, DEEP_THROW } from './config.js';
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

// pixels still in flight are caught if they pass the cursor while it is held
export function catchAir(mx, my) {
  catchSinking(mx, my);
  let room = capacity() - S.held;
  if (room <= 0) return;

  const reach = (BRUSH + 2) * P;      // forgiving: dust falls quickly
  for (let i = S.chips.length - 1; i >= 0 && room > 0; i--) {
    const ch = S.chips[i];
    // not what the held hand itself just let go, or the toss would come
    // straight back off the cursor it left from
    if (ch.auto) continue;
    // one kind in the hand: goods catch into a hand of the same goods, dust into a hand of dust
    if ((ch.goods || null) !== heldKind && S.held) continue;
    if (Math.abs(ch.x + P / 2 - mx) > reach || Math.abs(ch.y + P / 2 - my) > reach) continue;
    S.chips.splice(i, 1);
    S.held++;
    room--;
    noteCatch(ch);
    heldKind = ch.goods || null;
    S.motes.push(mote(ch.s, heldKind));
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
  const reach = (BRUSH + 2) * P;
  const sink = S.sinking;
  let keep = 0;
  for (let i = 0; i < sink.length; i++) {
    const g = sink[i];
    if (room > 0 && g.arc == null && Math.abs(g.x - mx) <= reach && Math.abs(g.y - my) <= reach) {
      S.motes.push(mote(g.s));
      S.heldScales++;
      room--;
      continue;
    }
    sink[keep++] = g;
  }
  sink.length = keep;
}

// MOCK, round 29: the hand works whichever plot is under it -- the yard's
// floor, or a place's pile (act 3's, through __handPlotAt) -- with one kind
// in it at a time; what it holds remembers its kind, so a throw lands as it.
const actPlot = (x, y) => globalThis.__handPlotAt?.(x, y) || null;
let heldKind = null;
export const handKind = () => heldKind;
// One grain on the cursor.
const mote = (s, kind = null) => ({ s, kind, a: rand() * Math.PI * 2, d: P * (1 + rand() * 2.6), spin: (rand() - 0.5) * 0.03, bob: rand() * Math.PI * 2 });

// The ground's cells within the brush, in the order the brush walks them.
function* brushCells(mx, my, radius = BRUSH, b = floor) {
  // the brush's reach is a distance, so a plot of bigger cells takes fewer of them
  if (b !== floor) radius = Math.max(0, Math.round(radius * P / b.p));
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
  const ap = actPlot(mx, my);
  if (ap) { for (const _ of brushCells(mx, my, radius, ap.b)) return true; return false; }
  for (const _ of brushCells(mx, my, radius)) return true;
  return false;
}

export function sweep(mx, my) {
  // In the deep the same hand works the floor's loose scales, and what it
  // throws is thrown into the water (DESIGN.md, "The crusher"). Where the
  // pointer is in the world decides it, not which half is on the screen.
  if (inDeep(mx, my)) { sweepScales(mx, my); return; }
  const ap = actPlot(mx, my);
  if (ap || heldKind) {
    // one kind in the hand at a time: a hand of planks sweeps no logs
    if (!ap || (S.held && heldKind !== ap.kind)) return;
    let room = capacity() - S.held, taken = 0;
    for (const [c, r] of brushCells(mx, my, BRUSH, ap.b)) {
      if (room <= 0) break;
      const v = at(ap.b, c, r);
      put(ap.b, c, r, 0);
      S.motes.push(mote(v, ap.kind));
      taken++; room--;
    }
    if (taken) { S.held += taken; heldKind = ap.kind; globalThis.__goodsTaken?.(ap.key, taken); }
    return;
  }
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
  // a place's goods are thrown as themselves, and land on its piles (game.js stepChips)
  if (heldKind) {
    for (let i = 0; i < S.held; i++) {
      spawnChip(x + (rand() - 0.5) * P * 6, y + (rand() - 0.5) * P * 6, vx + (rand() - 0.5) * 1.4, vy + (rand() - 0.5) * 1.4, S.motes[i]?.s || 1);
      S.chips[S.chips.length - 1].goods = heldKind;
    }
    S.held = 0; S.motes = []; heldKind = null;
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
export function tossFromPile(mx) {
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

