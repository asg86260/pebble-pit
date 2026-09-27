// Track blade of docs/wave-class-anims.md: the well's two classes (the
// Swordsman and the Assassin), the armory's Ranger, and the statuses they
// own -- Bleeding and Marked on the serpent, Keen on a fighter. A mock drawn
// from plain cells through the harness; nothing here is read by the game.

import {
  P, FLOOR, STATION_X, BODY, GREYS, PURPLES, WHITE, INK, hash, clamp, steps,
  cell, rect, line, ring, coilY, coilTop, coilBottom, COIL_X0, COIL_X1,
  burst, chip, drawBody, registerStatus, registerClass, STATUS,
} from './harness.js';

// --- shared ground -----------------------------------------------------------------

// The class's body at its station, top-left cell.
const HX = STATION_X - 1, HY = FLOOR - 2 - BODY;
// The column over the station a melee fighter strikes at.
const SX = HX + 1;
const lerp = (a, b, p) => a + (b - a) * p;
const ease = p => (p = clamp(p, 0, 1), p < 0.5 ? 2 * p * p : 1 - 2 * (1 - p) * (1 - p));
const DEG = Math.PI / 180;
// How fast a status laid at one spot runs out along the coil to cover all of
// it, in cells a second: the whole coil from the station in under a second.
const RUN = 50;
const RUN_S = (COIL_X1 - COIL_X0) / RUN;

// A melee fighter's trip: up from the station to hover under the coil, and
// back. `legs` is [[t0, t1, up]] -- a swim up (up = 1) or down (up = 0)
// between t0 and t1; before the first leg it is home. `gap` is the rows
// between the coil's belly-side edge and the body's top, so a weapon of that
// reach touches the hide.
function tripY(t, st, legs, gap) {
  const hover = coilBottom(SX, t, st) + gap + 1;
  let at = 0;                                   // 0 home, 1 hovering
  for (const [t0, t1, up] of legs) {
    if (t < t0) break;
    const p = ease((t - t0) / (t1 - t0));
    at = up ? p : 1 - p;
  }
  return { y: Math.round(lerp(HY, hover, at)), moving: legs.some(([a, b]) => t > a && t < b) };
}
// Bubbles trailing a swimmer, so a move reads as a swim and not a slide.
function wake(g, t, x, y) {
  for (let i = 0; i < 3; i++) {
    const k = (t * 3 + i / 3) % 1;
    cell(g, x + 1 + (hash(i + Math.floor(t * 3)) < 0.5 ? -1 : 1) * (i % 2), y + BODY + 1 + k * 3, GREYS[5 - i]);
  }
}
function drawMe(g, cls, x, y, t) { drawBody(g, x, y); cls.hat(g, x, y, t); }

// A pulse running out both ways along the coil from column x0, `a` seconds
// after it left: the loud moment of a status being laid on the whole snake.
function runAlong(g, t, st, x0, a, tones) {
  const d = a * RUN;
  for (const side of [-1, 1]) for (let j = 0; j < tones.length; j++) {
    const cx = Math.round(x0 + side * (d - j));
    if (cx < COIL_X0 || cx > COIL_X1 || (side < 0 ? cx > x0 : cx < x0)) continue;
    for (let cy = coilTop(cx, t, st) + 1; cy < coilBottom(cx, t, st); cy++) cell(g, cx, cy, tones[j]);
  }
}
// Hits so far: how many of `times` (+ `lag`) have come by t.
const count = (t, times, lag = 0) => times.filter(h => t >= h + lag).length;

// --- statuses ---------------------------------------------------------------------

// Bleeding: nicks across the whole coil, each weeping a drop off the belly
// side that falls and fades into the water. More stacks, more nicks.
registerStatus('bleeding', {
  name: 'Bleeding', on: 'serpent',
  serpent(g, t, s, level) {
    const n = Math.round(2 + 8 * level);
    for (let i = 0; i < n; i++) {
      const cx = COIL_X0 + 2 + Math.floor(hash(i * 13 + 1) * (COIL_X1 - COIL_X0 - 4));
      const mid = Math.round(coilY(cx, t, s)), bot = coilBottom(cx, t, s);
      // the nick: a short diagonal on the hide
      cell(g, cx, mid - 1, GREYS[5]); cell(g, cx + 1, mid, GREYS[6]);
      // the wound's edge, and the drop that leaves it
      cell(g, cx, bot, GREYS[6]);
      const per = 1.3 + hash(i + 40) * 0.9, p = ((t + hash(i + 7) * per) % per) / per;
      if (p > 0.15 && p < 0.45) cell(g, cx, bot + 1, GREYS[8]);
      else if (p >= 0.45) {
        const f = (p - 0.45) / 0.55;
        cell(g, cx, bot + 1 + f * 6, GREYS[8 - Math.round(f * 5)]);
      }
    }
  },
});

// Marked: a diamond sight on the coil every few lengths, head to tail, in
// the abyss's purple. It stands quietly; the scene that lays it draws it
// arriving (markArrive), ringed as each sight lands.
const MARKS = [];
for (let cx = COIL_X0 + 5; cx <= COIL_X1 - 3; cx += 9) MARKS.push(cx);
function drawSight(g, t, s, cx, tone) {
  const m = Math.round(coilY(cx, t, s));
  cell(g, cx, m - 1, tone); cell(g, cx - 1, m, tone); cell(g, cx + 1, m, tone); cell(g, cx, m + 1, tone);
}
function drawMarks(g, t, s, only) {
  MARKS.forEach((cx, i) => {
    if (only && !only(cx)) return;
    // a slow pulse down the row, so it stands without shouting
    const hot = ((t * 0.8 - i * 0.12) % 1.6 + 1.6) % 1.6 < 0.15;
    drawSight(g, t, s, cx, hot ? PURPLES[11] : PURPLES[9]);
    if (hot) cell(g, cx, Math.round(coilY(cx, t, s)), PURPLES[6]);
  });
}
// The Mark running out from x0, `a` seconds after it was laid: each sight
// lands with a ring of cells that shrinks onto it.
function markArrive(g, t, s, x0, a) {
  MARKS.forEach(cx => {
    const age = a - Math.abs(cx - x0) / RUN;
    if (age < 0) return;
    const m = Math.round(coilY(cx, t, s));
    if (age < 0.3) ring(g, cx, m, age < 0.1 ? 3 : 2, age < 0.15 ? PURPLES[11] : PURPLES[8]);
    drawSight(g, t, s, cx, age < 0.3 ? PURPLES[11] : PURPLES[9]);
  });
  runAlong(g, t, s, x0, a, [PURPLES[10], PURPLES[8], PURPLES[6]]);
}
registerStatus('marked', { name: 'Marked', on: 'serpent', serpent(g, t, s) { drawMarks(g, t, s); } });

// Keen: a honed edge held level across the fighter, a cell out either side,
// and a glint running along it now and then.
function drawKeen(g, t, x, y) {
  const row = y + 1;
  for (const cx of [x - 2, x - 1, x + 3, x + 4]) cell(g, cx, row, GREYS[8]);
  for (let cx = x; cx < x + BODY; cx++) cell(g, cx, row, GREYS[7]);
  const p = (t % 1.6) / 0.5;
  if (p < 1) {
    const gx = Math.round(x - 2 + p * 6);
    cell(g, gx, row, gx >= x && gx < x + BODY ? INK : WHITE);
    cell(g, gx, row - 1, gx >= x && gx < x + BODY ? GREYS[8] : GREYS[6]);
  }
}
registerStatus('keen', { name: 'Keen', on: 'fighter', fighter(g, t, cx, cy) { drawKeen(g, t, cx, cy); } });

// --- the Swordsman -------------------------------------------------------------------

// The sword: at rest, held upright at the right side; in a cut, a blade
// four cells long turning about the body's middle, with the two positions
// it has just left drawn behind it a tone and two down.
function swordRest(g, x, y, tone = WHITE) {
  cell(g, x + 3, y + 2, GREYS[6]);
  cell(g, x + 4, y + 1, GREYS[7]);
  for (let r = 0; r < 3; r++) cell(g, x + 3, y + 1 - r, tone);
}
function bladeAt(g, x, y, deg, tone, hilt) {
  const px = x + 1, py = y + 1, c = Math.cos(deg * DEG), s = Math.sin(deg * DEG);
  if (hilt) cell(g, px + c * 2, py + s * 2, GREYS[6]);
  for (let r = 3; r <= 5; r++) cell(g, px + c * r, py + s * r, tone);
}
// One sweep of the blade from a0 to a1 degrees over `len` seconds, `a` in:
// six whole positions, never a blend between them.
function sweep(g, x, y, a, len, a0, a1) {
  const k = Math.min(5, Math.floor(a / len * 6));
  const at = i => a0 + (a1 - a0) * i / 5;
  if (k >= 2) bladeAt(g, x, y, at(k - 2), GREYS[5]);
  if (k >= 1) bladeAt(g, x, y, at(k - 1), GREYS[8]);
  bladeAt(g, x, y, at(k), WHITE, true);
}
// The cut left on the hide: a diagonal from belly-side up across the body,
// dark as it opens, closing up through the greys.
function slash(g, t, st, cx0, a, dir = 1, len = 2) {
  if (a < 0 || a > 1.2) return;
  const tone = GREYS[[1, 3, 5, 7, 9][Math.min(4, Math.floor(a / 0.24))]];
  const b = coilBottom(cx0, t, st);
  for (let i = -len; i <= len; i++) {
    const cx = cx0 + i * dir, cy = b - (i + len);
    if (cy >= coilTop(cx, t, st) && cy <= coilBottom(cx, t, st)) cell(g, cx, cy, tone);
  }
}
const BLEED = [GREYS[4], GREYS[6], GREYS[8]];

// The swordsman's day at the coil: up, a cut at each of `cuts`, back down.
function swordScene(opts) {
  const { cuts, dur, legs } = opts;
  return {
    body: false,
    state(t, api) {
      const n = opts.stacks ? opts.stacks(t) : count(t, cuts, 0.11);
      if (n) api.status('bleeding', Math.min(5, n) / 5);
    },
    draw(g, t, api) {
      const st = api.st, x = HX, { y, moving } = tripY(t, st, legs, 3);
      if (moving) wake(g, t, x, y);
      drawMe(g, api.cls, x, y, t);
      if (opts.keen) drawKeen(g, t, x, y);
      const last = cuts.filter(c => t >= c).pop();
      const a = last == null ? -1 : t - last;
      if (opts.pose) opts.pose(g, t, api, x, y, a, last);
      else if (a >= 0 && a < 0.45) sweep(g, x, y, Math.min(a, 0.22), 0.22, 20, -200);
      else swordRest(g, x, y);
      for (const c of cuts) opts.hit(g, t, st, c, t - c - 0.11, cuts.indexOf(c));
    },
    dur,
  };
}
const UP = [[0.1, 0.7, 1]];

registerClass({
  key: 'sword', name: 'Swordsman', station: 'well', group: 'blade',
  look: 'a headband, its tails flying, and a topknot; a long sword upright at the right side',
  hat(g, x, y, t) {
    rect(g, x, y - 1, BODY, 1, GREYS[8]);
    cell(g, x + 1, y - 2, GREYS[9]);                     // the topknot
    const flap = Math.floor(t * 4) % 2;
    cell(g, x - 1, y - 1, GREYS[8]);                     // the knot's tails
    cell(g, x - 2, y - 1 + flap, GREYS[7]);
  },
  scenes: [
    { name: 'Base', about: 'A cut every 1 s: up to the coil, a sweep of the blade, a gash, and a short Bleed runs out over the whole snake.',
      ...swordScene({
        cuts: [1.0, 2.0, 3.0], dur: 4.4, legs: [...UP, [3.5, 4.2, 0]],
        hit(g, t, st, c, a, i) {
          const b = coilBottom(SX, t, st);
          burst(g, t, c + 0.11, SX, b, 0.4, i); chip(g, t, c + 0.11, SX, b, 0.4, i);
          slash(g, t, st, SX, a);
          if (a >= 0 && a < RUN_S) runAlong(g, t, st, SX, a, BLEED);
        },
      }) },
    { name: 'Swordmaster', about: 'Keen (+25% crit). Every second cut here is a crit: the blade comes back the other way, the gash is a cross, and the Bleed goes on twice.',
      ...swordScene({
        cuts: [1.0, 2.0, 3.0, 4.0], dur: 5.4, legs: [...UP, [4.5, 5.2, 0]], keen: true,
        stacks: t => [1, 2, 1, 2].reduce((n, k, i) => n + (t >= [1, 2, 3, 4][i] + 0.11 ? k : 0), 0),
        pose(g, t, api, x, y, a, last) {
          const crit = last === 2.0 || last === 4.0;
          if (a >= 0 && a < 0.22) sweep(g, x, y, a, 0.22, 20, -200);
          else if (crit && a >= 0.22 && a < 0.44) sweep(g, x, y, a - 0.22, 0.22, -200, 20);
          else if (a >= 0 && a < 0.5) bladeAt(g, x, y, crit ? 20 : -200, WHITE, true);
          else swordRest(g, x, y);
        },
        hit(g, t, st, c, a, i) {
          const crit = i % 2 === 1, b = coilBottom(SX, t, st);
          burst(g, t, c + 0.11, SX, b, crit ? 0.9 : 0.4, i); chip(g, t, c + 0.11, SX, b, crit ? 0.8 : 0.4, i);
          slash(g, t, st, SX, a, 1, crit ? 3 : 2);
          if (crit) slash(g, t, st, SX, a - 0.22, -1, 3);
          if (a >= 0 && a < RUN_S) runAlong(g, t, st, SX, a, crit ? [GREYS[1], GREYS[4], GREYS[6], GREYS[8]] : BLEED);
        },
      }) },
    { name: 'Whirlwind', about: 'Each cut is a whole turn of the blade, and it bites three lengths at once: the gash here and one either side.',
      ...swordScene({
        cuts: [1.0, 2.0, 3.0], dur: 4.4, legs: [...UP, [3.5, 4.2, 0]],
        pose(g, t, api, x, y, a) {
          if (a >= 0 && a < 0.3) sweep(g, x, y, a, 0.3, 0, -360);
          else swordRest(g, x, y);
        },
        hit(g, t, st, c, a, i) {
          [-9, 0, 9].forEach((dx, j) => {
            const cx = SX + dx, at = c + 0.11 + Math.abs(dx) * 0.012, b = coilBottom(cx, t, st);
            burst(g, t, at, cx, b, 0.4, i * 3 + j); chip(g, t, at, cx, b, 0.35, i * 3 + j);
            slash(g, t, st, cx, a - Math.abs(dx) * 0.012);
          });
          // the wide cut: a ring of the blade's reach thrown out from her
          if (a >= -0.1 && a < 0.25) {
            const { y } = tripY(t, st, UP, 3);
            ring(g, HX + 1, y + 1, 6 + a * 24, a < 0.08 ? GREYS[9] : GREYS[6], 2);
          }
          if (a >= 0 && a < RUN_S) runAlong(g, t, st, SX, a, BLEED);
        },
      }) },
    { name: 'Iaido', about: 'She stops cutting and draws for 4 s -- the meter at her side -- then one cut of all of it, x1.5: a line clean through the coil.',
      ...swordScene({
        cuts: [4.8], dur: 6.4, legs: [...UP, [5.5, 6.2, 0]],
        stacks: t => (t >= 4.91 ? 3 : 0),
        pose(g, t, api, x, y, a) {
          // the draw: the blade held sheathed, dark, the meter filling
          if (t >= 0.8 && t < 4.8) {
            swordRest(g, x, y, GREYS[5]);
            const fill = steps((t - 0.8) / 3.8, 4) * 4;
            for (let i = 0; i < 4; i++) cell(g, x - 2, y + 2 - i, i < fill ? (fill >= 4 && Math.floor(t * 8) % 2 ? WHITE : GREYS[9]) : GREYS[3]);
          } else if (a >= 0 && a < 0.5) {
            // the drawn cut is level: the blade laid out flat and right
            for (let r = 3; r <= 6; r++) cell(g, x + r, y + 1, WHITE);
          } else swordRest(g, x, y);
        },
        hit(g, t, st, c, a) {
          const b = coilBottom(SX, t, st);
          // the line of the cut through the coil, white as it lands, a dark
          // seam as it closes
          if (a >= -0.11 && a < 1.4) {
            // the seam runs out from the blade faster than the eye, then
            // closes from its ends inward
            const tone = GREYS[[0, 1, 2, 4, 6, 8][clamp(Math.floor(a / 0.24), 0, 5)]];
            const reach = a < 0.1 ? (a + 0.11) * 70 : Math.max(0, 14 - (a - 0.1) * 11);
            for (let cx = SX - 14; cx <= SX + 14; cx++) {
              if (Math.abs(cx - SX) > reach) continue;
              const cy = Math.round(coilY(cx, t, st));
              cell(g, cx, cy, tone);
              if (a < 0.2 && Math.abs(cx - SX) < 8) cell(g, cx, cy + 1, tone);
            }
          }
          burst(g, t, c + 0.11, SX, b, 1, 7); chip(g, t, c + 0.11, SX, b, 0.8, 7);
          burst(g, t, c + 0.16, SX + 9, coilBottom(SX + 9, t, st), 0.5, 8);
          burst(g, t, c + 0.16, SX - 8, coilBottom(SX - 8, t, st), 0.5, 9);
          if (a >= 0 && a < RUN_S) runAlong(g, t, st, SX, a, [GREYS[1], GREYS[4], GREYS[6], GREYS[8]]);
        },
      }) },
  ],
});

// --- the Assassin --------------------------------------------------------------------

// She darts: up from the station fast, one stab, and straight back, every
// stab its own trip -- the swordsman goes up and stays; the assassin is
// never under the coil longer than the stab.
const AX = HX + 3;                                   // the column her dagger goes in
const dartLegs = stabs => stabs.flatMap(s => [[s - 0.25, s, 1], [s + 0.12, s + 0.45, 0]]);
// The dagger: at rest, short and upright at her left; in a stab, up her
// right side into the hide, a cell further at the instant it lands.
function daggerRest(g, x, y, tone = WHITE) {
  cell(g, x - 1, y + 2, GREYS[6]);
  cell(g, x - 1, y + 1, tone); cell(g, x - 1, y, tone);
}
function daggerStab(g, x, y, deep, tone = WHITE) {
  cell(g, x + 3, y, GREYS[6]);
  for (let r = 1; r <= 2 + deep; r++) cell(g, x + 3, y - r, tone);
}
// The puncture: a short dark line up into the hide, `len` cells, closing up.
function puncture(g, t, st, a, len) {
  if (a < 0 || a > 1.2) return;
  const tone = GREYS[[1, 2, 4, 6, 8][Math.min(4, Math.floor(a / 0.24))]];
  const b = coilBottom(AX, t, st);
  for (let i = 0; i < len; i++) cell(g, AX, b - i, tone);
}
function assassinScene(opts) {
  const { stabs } = opts;
  return {
    body: false, dur: opts.dur,
    state(t, api) { opts.state?.(t, api); },
    draw(g, t, api) {
      const st = api.st, x = HX, { y, moving } = tripY(t, st, dartLegs(stabs), 2);
      if (moving) wake(g, t, x, y);
      drawMe(g, api.cls, x, y, t);
      const near = stabs.find(s => t >= s - 0.1 && t < s + 0.3);
      const tone = opts.venom ? PURPLES[10] : WHITE;
      if (near != null) daggerStab(g, x, y, t >= near && t < near + 0.1 ? 1 : 0, tone);
      else daggerRest(g, x, y, tone);
      if (opts.venom) {
        // a drop of it gathering on the blade and falling, at rest or not
        const p = (t % 1.1) / 1.1;
        const [dx, dy] = near != null ? [x + 4, y - 1] : [x - 2, y + 1];
        if (p > 0.5) cell(g, dx, dy + (p - 0.5) * 10, PURPLES[p < 0.8 ? 9 : 6]);
      }
      stabs.forEach((s, i) => {
        const b = coilBottom(AX, t, st), k = opts.k(s, i);
        burst(g, t, s, AX, b, k, 20 + i); chip(g, t, s, AX, b, k * 0.9, 20 + i);
        puncture(g, t, st, t - s, opts.len ? opts.len(i) : 2);
        opts.hit?.(g, t, st, s, t - s, i);
      });
    },
  };
}

registerClass({
  key: 'assassin', name: 'Assassin', station: 'well', group: 'blade',
  look: 'a pointed hood that shades the face, one eye showing; a short dagger at the left, darting up to stab',
  hat(g, x, y) {
    rect(g, x - 1, y - 1, BODY + 2, 1, GREYS[6]);
    cell(g, x, y - 2, GREYS[6]); cell(g, x + 1, y - 2, GREYS[7]);    // the hood's point
    rect(g, x, y, BODY, 1, GREYS[4]);                                 // the face in its shadow
    cell(g, x + 2, y, WHITE);                                         // the one eye
  },
  scenes: [
    { name: 'Base', about: 'A stab every 1.5 s, darting up and back. x3 on a Stunned or Marked serpent: here another fighter stuns it, and the second stab lands big.',
      ...assassinScene({
        stabs: [1.0, 2.5, 4.0], dur: 5.4,
        state(t, api) { api.stun(2.2, 1.5); },
        k: (s, i) => (i === 1 ? 0.8 : 0.3),
        len: i => (i === 1 ? 4 : 2),
      }) },
    { name: 'Execution', about: 'Each stab does more the deeper the wound: every stab here goes in further, the hole bigger, up to x2 at the break.',
      ...assassinScene({
        stabs: [0.8, 2.0, 3.2, 4.4], dur: 5.6,
        k: (s, i) => [0.3, 0.5, 0.7, 1][i],
        len: i => 2 + i,
      }) },
    { name: 'Venom', about: 'Each stab Poisons, a stack a stab: the blade is wet with it, and each stab sends it through the whole snake.',
      ...assassinScene({
        stabs: [1.0, 2.5, 4.0], dur: 5.4, venom: true,
        state(t, api) { const n = count(t, [1.0, 2.5, 4.0]); if (n) api.status('poisoned', n / 10); },
        k: () => 0.3,
        hit(g, t, st, s, a) { if (a >= 0 && a < RUN_S) runAlong(g, t, st, AX, a, [PURPLES[11], PURPLES[9], PURPLES[7]]); },
      }) },
    { name: 'Shadow', about: 'Her stab Marks the serpent, and the Mark stays after: it runs out over the whole coil. Her next stabs land on the Mark, x3.',
      ...assassinScene({
        stabs: [1.0, 2.5, 4.0], dur: 5.4,
        state(t, api) { if (t >= 1.0 + RUN_S) api.status('marked', 1); },
        k: (s, i) => (i ? 0.8 : 0.3),
        len: i => (i ? 4 : 2),
        hit(g, t, st, s, a, i) {
          if (i === 0 && a >= 0 && a < RUN_S) markArrive(g, t, st, AX, a);
          // the stab that lands on the Mark: a ring closing on the spot
          if (i > 0 && a >= 0 && a < 0.3) ring(g, AX, Math.round(coilY(AX, t, st)), Math.round(4 - a * 8), PURPLES[a < 0.15 ? 11 : 8]);
        },
      }) },
  ],
});
