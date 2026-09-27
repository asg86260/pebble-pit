// Track blade of docs/wave-class-anims.md: the altar's Swordsman, the
// armory's Assassin and Ranger, and the statuses they own -- Bleeding and
// Marked on the serpent, Keen on a fighter. Round 2: no hats; each class is
// its kit (docs/mocks/classes/looks-2026-09-27.html), and every attack comes
// out of it. A mock drawn from plain cells through the harness; nothing here
// is read by the game.

import {
  FLOOR, STATION_X, BODY, GREYS, PURPLES, WHITE, hash, clamp, steps,
  cell, line, ring, coilY, coilTop, coilBottom, COIL_X0, COIL_X1,
  burst, chip, drawBody, registerStatus, registerClass,
} from './harness.js';

// --- shared ground -----------------------------------------------------------------

// The class's body at its station, top-left cell.
const HX = STATION_X - 1, HY = FLOOR - 2 - BODY;
// The column over the station a melee fighter strikes at: the body's middle.
const SX = HX + 1;
const lerp = (a, b, p) => a + (b - a) * p;
const along = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
const ease = p => (p = clamp(p, 0, 1), p < 0.5 ? 2 * p * p : 1 - 2 * (1 - p) * (1 - p));
const DEG = Math.PI / 180;
// How fast a status laid at one spot runs out along the coil to cover all of
// it, in cells a second: the whole coil from the station in under a second.
const RUN = 50;
const RUN_S = (COIL_X1 - COIL_X0) / RUN;

// A kit, drawn as the looks page draws it: rows of characters whose bottom
// row is the body's bottom row, `ox` the column of the body's middle. The
// body's own '#' cells are skipped -- the harness's square is the body -- so
// only the held things are laid down, each letter a tone. `tint` swaps a
// letter's tone (a wet blade, a sheathed one, a lit arrowhead).
const KT = { w: WHITE, a: GREYS[10], g: GREYS[9], h: GREYS[8], m: GREYS[7], d: GREYS[6], k: GREYS[4] };
function kit(g, art, x, y, tint) {
  const x0 = x + 1 - art.ox, y0 = y + 2 - art.rows.length + 1;
  art.rows.forEach((row, r) => [...row].forEach((ch, c) => {
    if (ch === '.' || ch === '#') return;
    cell(g, x0 + c, y0 + r, (tint && tint[ch]) || KT[ch]);
  }));
}
// How many rows a kit stands above the body's top: the reach of a strike.
const reach = art => art.rows.length - BODY;

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

// Keen: a point over the fighter, a whetted edge that a glint runs up and
// over now and then. A scene that carries its kit overhead draws Keen first,
// so the kit lies over it.
function drawKeen(g, t, x, y) {
  const pts = [[x - 1, y - 3], [x, y - 4], [x + 1, y - 5], [x + 2, y - 4], [x + 3, y - 3]];
  const p = (t % 1.6) / 0.4;
  pts.forEach(([cx, cy], i) => cell(g, cx, cy, p < 1 && Math.round(p * 4) === i ? WHITE : i === 2 ? GREYS[9] : GREYS[7]));
}
registerStatus('keen', { name: 'Keen', on: 'fighter', fighter(g, t, cx, cy) { drawKeen(g, t, cx, cy); } });

// --- the Swordsman -------------------------------------------------------------------

// The greatsword, from the looks page: at rest stood point-up at his left,
// taller than he is, the crossguard at his shoulder and the hilt at his hand;
// in a cut, lifted over his head, point up, and driven into the hide.
const SWORD_REST = { ox: 5, rows: [
  '.w.....',
  '.a.....',
  '.a.....',
  '.a.....',
  'hhh.###',
  '.d..###',
  '.g..###'] };
const SWORD_UP = { ox: 2, rows: [
  '..w..',
  '..a..',
  '..a..',
  '.hhh.',
  '..d..',
  '.###.',
  '.###.',
  '.###.'] };
const SWORD_REACH = reach(SWORD_UP);
// The blade laid at an angle about his middle, for a turn of it: the guard
// two cells out, the blade four past that, the point white.
function bladeAt(g, x, y, deg, tone, hilt) {
  const px = x + 1, py = y + 1, c = Math.cos(deg * DEG), s = Math.sin(deg * DEG);
  if (hilt) {
    cell(g, px + c * 2, py + s * 2, GREYS[8]);
    cell(g, px + c * 2 - s, py + s * 2 + c, GREYS[8]); cell(g, px + c * 2 + s, py + s * 2 - c, GREYS[8]);
  }
  for (let r = 3; r <= 6; r++) cell(g, px + c * r, py + s * r, r === 6 && hilt ? WHITE : tone);
}
// One sweep of the blade from a0 to a1 degrees over `len` seconds, `a` in:
// six whole positions, never a blend between them, the two it has just left
// drawn behind it a tone and two down.
function sweep(g, x, y, a, len, a0, a1) {
  const k = Math.min(5, Math.floor(a / len * 6));
  const at = i => a0 + (a1 - a0) * i / 5;
  if (k >= 2) bladeAt(g, x, y, at(k - 2), GREYS[5]);
  if (k >= 1) bladeAt(g, x, y, at(k - 1), GREYS[7]);
  bladeAt(g, x, y, at(k), GREYS[10], true);
}
// The overhead sword drawn along the hide: in the stroke's `len` seconds it
// rides from `from` to `to` cells either side of his middle, the point in the
// hide the whole way.
const ride = (a, len, from, to) => Math.round(lerp(from, to, along(a, 0, len)));
// The cut the point leaves along the belly (the looks page's shape): it opens
// behind the point as it rides, dark on the white hide, and closes up the
// greys. `dir` is
// the way it was drawn; `bow` 1 cups it into the hide, -1 the other way, so
// a stroke and its return cross.
const STROKE = 0.12;
function gash(g, t, st, cx0, a, dir = 1, half = 4, bow = 1) {
  if (a < 0 || a >= 1.2) return;
  const k = along(a, 0, STROKE), fade = along(a, STROKE, 1.2);
  const tone = GREYS[[1, 1, 3, 5, 7, 9][Math.floor(fade * 5.99)]];
  for (let dx = -half; dx <= half; dx++) {
    if ((dx * dir + half) / (2 * half) > k) continue;
    const cup = Math.abs(dx) > half / 2 ? 0 : 1;
    cell(g, cx0 + dx, coilBottom(cx0 + dx, t, st) - 1 + (bow > 0 ? cup : 1 - cup), tone);
  }
}
const BLEED = [GREYS[4], GREYS[6], GREYS[8]];

// The swordsman's day at the coil: up with the sword at his side, a cut at
// each of `cuts`, back down. Each cut lifts the sword overhead a moment
// before it lands and holds it there a moment after.
function swordScene(opts) {
  const { cuts, dur, legs } = opts;
  return {
    body: false, dur,
    state(t, api) {
      const n = opts.stacks ? opts.stacks(t) : count(t, cuts, 0.11);
      if (n) api.status('bleeding', Math.min(5, n) / 5);
    },
    draw(g, t, api) {
      const st = api.st, x = HX, { y, moving } = tripY(t, st, legs, SWORD_REACH - 1);
      if (moving) wake(g, t, x, y);
      // the wounds first, so the sword that made them lies over them
      for (const c of cuts) opts.hit(g, t, st, c, t - c, cuts.indexOf(c));
      if (opts.keen) drawKeen(g, t, x, y);
      drawBody(g, x, y);
      const last = cuts.filter(c => t >= c - 0.1).pop();
      const a = last == null ? -1 : t - last;
      if (opts.pose) opts.pose(g, t, api, x, y, a, last);
      else if (a >= -0.1 && a < 0.3) kit(g, SWORD_UP, x + ride(a, STROKE, -2, 2), y);
      else kit(g, SWORD_REST, x, y);
    },
  };
}
const UP = [[0.1, 0.7, 1]];

registerClass({
  key: 'sword', name: 'Swordsman', station: 'altar', group: 'blade',
  look: 'a greatsword taller than him, held point-up at his side, the hilt at his hand; lifted overhead and drawn along the hide',
  hat(g, x, y) { kit(g, SWORD_REST, x, y); },
  scenes: [
    { name: 'Base', about: 'A cut every 1 s: up to the coil, the sword lifted overhead and its point drawn along the hide, a gash, and a short Bleed runs out over the whole snake.',
      ...swordScene({
        cuts: [1.0, 2.0, 3.0], dur: 4.4, legs: [...UP, [3.5, 4.2, 0]],
        hit(g, t, st, c, a, i) {
          const b = coilBottom(SX, t, st);
          burst(g, t, c, SX, b, 0.4, i); chip(g, t, c, SX, b, 0.4, i);
          gash(g, t, st, SX, a);
          if (a >= 0 && a < RUN_S) runAlong(g, t, st, SX, a, BLEED);
        },
      }) },
    { name: 'Swordmaster', about: 'Keen (+25% crit). Every second cut here is a crit: the point is drawn along the hide and straight back, the two cuts cross, and the Bleed goes on twice.',
      ...swordScene({
        cuts: [1.0, 2.0, 3.0, 4.0], dur: 5.4, legs: [...UP, [4.5, 5.2, 0]], keen: true,
        stacks: t => [1, 2, 1, 2].reduce((n, k, i) => n + (t >= [1, 2, 3, 4][i] ? k : 0), 0),
        pose(g, t, api, x, y, a, last) {
          const crit = last === 2.0 || last === 4.0;
          if (a >= -0.1 && a < STROKE) kit(g, SWORD_UP, x + ride(a, STROKE, -2, 2), y);
          else if (crit && a >= STROKE && a < 2 * STROKE + 0.1) kit(g, SWORD_UP, x + ride(a - STROKE - 0.1, STROKE, 2, -2), y);
          else if (a >= 0 && a < (crit ? 0.45 : 0.3)) kit(g, SWORD_UP, x + (crit ? -2 : 2), y);
          else kit(g, SWORD_REST, x, y);
        },
        hit(g, t, st, c, a, i) {
          const crit = i % 2 === 1, b = coilBottom(SX, t, st);
          burst(g, t, c, SX, b, crit ? 0.9 : 0.4, i); chip(g, t, c, SX, b, crit ? 0.8 : 0.4, i);
          gash(g, t, st, SX, a, 1, crit ? 5 : 4);
          if (crit) gash(g, t, st, SX, a - STROKE - 0.1, -1, 5, -1);
          if (a >= 0 && a < RUN_S) runAlong(g, t, st, SX, a, crit ? [GREYS[1], GREYS[4], GREYS[6], GREYS[8]] : BLEED);
        },
      }) },
    { name: 'Whirlwind', about: 'Each cut is a whole turn of the sword from overhead, and it bites three lengths at once: the gash here and one either side.',
      ...swordScene({
        cuts: [1.0, 2.0, 3.0], dur: 4.4, legs: [...UP, [3.5, 4.2, 0]],
        pose(g, t, api, x, y, a) {
          // lifted point-up, a whole turn from there, and back overhead
          if (a >= -0.1 && a < 0) kit(g, SWORD_UP, x, y);
          else if (a >= 0 && a < 0.3) sweep(g, x, y, a, 0.3, -90, -450);
          else if (a >= 0.3 && a < 0.4) kit(g, SWORD_UP, x, y);
          else kit(g, SWORD_REST, x, y);
        },
        hit(g, t, st, c, a, i) {
          [-9, 0, 9].forEach((dx, j) => {
            const cx = SX + dx, at = c + Math.abs(dx) * 0.012, b = coilBottom(cx, t, st);
            burst(g, t, at, cx, b, 0.4, i * 3 + j); chip(g, t, at, cx, b, 0.35, i * 3 + j);
            gash(g, t, st, cx, a - Math.abs(dx) * 0.012, dx < 0 ? -1 : 1, 3);
          });
          // the wide cut: a ring of the blade's reach thrown out from him
          if (a >= 0 && a < 0.3) {
            const { y } = tripY(t, st, UP, SWORD_REACH - 1);
            ring(g, SX, y + 1, 7 + a * 20, a < 0.1 ? GREYS[9] : GREYS[6], 2);
          }
          if (a >= 0 && a < RUN_S) runAlong(g, t, st, SX, a, BLEED);
        },
      }) },
    { name: 'Iaido', about: 'He stops cutting and draws for 4 s -- the sword dark at his side, the meter at the other -- then one cut of all of it, x1.5: the blade laid out level, a line clean through the coil.',
      ...swordScene({
        cuts: [4.8], dur: 6.4, legs: [...UP, [5.5, 6.2, 0]],
        stacks: t => (t >= 4.8 ? 3 : 0),
        pose(g, t, api, x, y, a) {
          if (t >= 0.8 && t < 4.7) {
            // the draw: the blade held still and dark, the meter filling
            kit(g, SWORD_REST, x, y, { w: GREYS[6], a: GREYS[5] });
            const fill = steps((t - 0.8) / 3.8, 4) * 4;
            for (let i = 0; i < 4; i++) cell(g, x + 4, y + 2 - i, i < fill ? (fill >= 4 && Math.floor(t * 8) % 2 ? WHITE : GREYS[9]) : GREYS[3]);
          } else if (t >= 4.7 && t < 5.3) {
            // the drawn cut: out of the rest and laid flat to his right, the
            // guard at his hand, the blade and its point level
            const out = t < 4.8 ? 3 : 4;
            for (const dy of [0, 1, 2]) cell(g, x + out, y + dy, GREYS[8]);
            for (let r = 1; r <= 4; r++) cell(g, x + out + r, y + 1, r === 4 ? WHITE : GREYS[10]);
          } else kit(g, SWORD_REST, x, y);
        },
        hit(g, t, st, c, a) {
          const b = coilBottom(SX, t, st);
          // the line of the cut through the coil, white as it lands, a dark
          // seam as it closes: it runs out from the blade faster than the
          // eye, then closes from its ends inward
          if (a >= 0 && a < 1.5) {
            const tone = GREYS[[0, 1, 2, 4, 6, 8][clamp(Math.floor(a / 0.24), 0, 5)]];
            const far = a < 0.2 ? a * 70 : Math.max(0, 14 - (a - 0.2) * 11);
            for (let cx = SX - 14; cx <= SX + 14; cx++) {
              if (Math.abs(cx - SX) > far) continue;
              const cy = Math.round(coilY(cx, t, st));
              cell(g, cx, cy, tone);
              if (a < 0.3 && Math.abs(cx - SX) < 8) cell(g, cx, cy + 1, tone);
            }
          }
          burst(g, t, c + 0.1, SX, b, 1, 7); chip(g, t, c + 0.1, SX, b, 0.8, 7);
          burst(g, t, c + 0.15, SX + 9, coilBottom(SX + 9, t, st), 0.5, 8);
          burst(g, t, c + 0.15, SX - 8, coilBottom(SX - 8, t, st), 0.5, 9);
          if (a >= 0.1 && a < RUN_S + 0.1) runAlong(g, t, st, SX, a - 0.1, [GREYS[1], GREYS[4], GREYS[6], GREYS[8]]);
        },
      }) },
  ],
});

// --- the Assassin --------------------------------------------------------------------

// Two daggers, from the looks page: one in each fist, arms out, points up, a
// bright blade over a short crossguard. She darts: up from the station fast,
// both blades driven up into the hide at once, and straight back, every stab
// its own trip -- the swordsman goes up and stays; the assassin is never
// under the coil longer than the stab.
const DAG_REST = { ox: 4, rows: [
  '.w.....w.',
  '.a.....a.',
  '.a.....a.',
  'mmm###mmm',
  '.h.###.h.',
  '...###...'] };
const DAG_UP = { ox: 4, rows: [
  '.w.....w.',
  '.a.....a.',
  '.a.....a.',
  'mmm...mmm',
  '.h.....h.',
  '.h.###.h.',
  '...###...',
  '...###...'] };
// The two columns her blades go in, either side of her.
const DL = HX - 2, DR = HX + 4;
const dartLegs = stabs => stabs.flatMap(s => [[s - 0.25, s, 1], [s + 0.12, s + 0.45, 0]]);
// A puncture: a short dark line up into the hide, `len` cells, closing up.
function puncture(g, t, st, cx, a, len) {
  if (a < 0 || a > 1.2) return;
  const tone = GREYS[[1, 2, 4, 6, 8][Math.min(4, Math.floor(a / 0.24))]];
  const b = coilBottom(cx, t, st);
  for (let i = 0; i < len; i++) cell(g, cx, b - i, tone);
}
const VENOM = { w: PURPLES[11], a: PURPLES[9] };
function assassinScene(opts) {
  const { stabs } = opts;
  return {
    body: false, dur: opts.dur,
    state(t, api) { opts.state?.(t, api); },
    draw(g, t, api) {
      const st = api.st, x = HX;
      const { y, moving } = tripY(t, st, dartLegs(stabs), reach(DAG_UP) - 1);
      if (moving) wake(g, t, x, y);
      // the wounds first, so the blades that made them lie over them
      stabs.forEach((s, i) => {
        const k = opts.k(s, i), len = opts.len ? opts.len(i) : 2;
        [DL, DR].forEach((cx, j) => {
          const b = coilBottom(cx, t, st);
          burst(g, t, s, cx, b, k, 20 + i * 2 + j); chip(g, t, s, cx, b, k * 0.9, 20 + i * 2 + j);
          puncture(g, t, st, cx, t - s, len);
        });
        opts.hit?.(g, t, st, s, t - s, i);
      });
      drawBody(g, x, y);
      const near = stabs.find(s => t >= s - 0.1 && t < s + 0.3);
      const tint = opts.venom ? VENOM : null;
      // the instant it lands both blades go a cell further in
      if (near != null) kit(g, DAG_UP, x, y - (t >= near && t < near + 0.1 ? 1 : 0), tint);
      else kit(g, DAG_REST, x, y, tint);
      if (opts.venom) {
        // a drop of it gathering off each guard and falling, at rest or not
        const p = (t % 1.1) / 1.1, gy = near != null ? y - 1 : y + 1;
        if (p > 0.5) for (const dx of [x - 3, x + 5]) cell(g, dx, gy + (p - 0.5) * 10, PURPLES[p < 0.8 ? 9 : 6]);
      }
    },
  };
}

registerClass({
  key: 'assassin', name: 'Assassin', station: 'armory', group: 'blade',
  look: 'a dagger in each fist, arms out, points up; she darts up and drives both in at once',
  hat(g, x, y) { kit(g, DAG_REST, x, y); },
  scenes: [
    { name: 'Base', about: 'Both daggers up every 1.5 s, darting up and back. x3 on a Stunned or Marked serpent: here another fighter stuns it, and the second stab lands big.',
      ...assassinScene({
        stabs: [1.0, 2.5, 4.0], dur: 5.4,
        state(t, api) { api.stun(2.2, 1.5); },
        k: (s, i) => (i === 1 ? 0.8 : 0.3),
        len: i => (i === 1 ? 4 : 2),
      }) },
    { name: 'Execution', about: 'Each stab does more the deeper the wound: every stab here goes in further, the holes bigger, up to x2 at the break.',
      ...assassinScene({
        stabs: [0.8, 2.0, 3.2, 4.4], dur: 5.6,
        k: (s, i) => [0.3, 0.5, 0.7, 1][i],
        len: i => 2 + i,
      }) },
    { name: 'Venom', about: 'Each stab Poisons, a stack a stab: both blades are wet with it, and each stab sends it through the whole snake.',
      ...assassinScene({
        stabs: [1.0, 2.5, 4.0], dur: 5.4, venom: true,
        state(t, api) { const n = count(t, [1.0, 2.5, 4.0]); if (n) api.status('poisoned', n / 10); },
        k: () => 0.3,
        hit(g, t, st, s, a) { if (a >= 0 && a < RUN_S) runAlong(g, t, st, SX, a, [PURPLES[11], PURPLES[9], PURPLES[7]]); },
      }) },
    { name: 'Shadow', about: 'Her stab Marks the serpent, and the Mark stays after: it runs out over the whole coil. Her next stabs land on the Mark, x3.',
      ...assassinScene({
        stabs: [1.0, 2.5, 4.0], dur: 5.4,
        state(t, api) { if (t >= 1.0 + RUN_S) api.status('marked', 1); },
        k: (s, i) => (i ? 0.8 : 0.3),
        len: i => (i ? 4 : 2),
        hit(g, t, st, s, a, i) {
          if (i === 0 && a >= 0 && a < RUN_S) markArrive(g, t, st, SX, a);
          // the stab that lands on the Mark: a ring closing on the spot
          // between her two blades
          if (i > 0 && a >= 0 && a < 0.3) ring(g, SX, Math.round(coilY(SX, t, st)), Math.round(5 - a * 10), PURPLES[a < 0.15 ? 11 : 8]);
        },
      }) },
  ],
});

// --- the Ranger ----------------------------------------------------------------------

// The bow, from the looks page: twice his height at his right side, no
// quiver. To shoot he lifts it up his side and over his head, holds it level
// with the string down, draws the string to his head and lets go: the arrow
// goes straight up. After the last arrow of a run the bow comes back down the
// same way. He never leaves the station.
const BOW_REST = { ox: 1, rows: [
  '....h..',
  '....gh.',
  '....g.h',
  '###.g.h',
  '###.gh.',
  '###.h..'] };
const BOW_LIFT = { ox: 1, rows: [
  '....h..',
  '....gh.',
  '....g.h',
  '....g.h',
  '....gh.',
  '###.h..',
  '###....',
  '###....'] };
const BOW_OVER = { ox: 2, rows: [
  '.......',
  '...hhh.',
  '..h...h',
  '.hgggggh',
  '........',
  '.###....',
  '.###....',
  '.###....'] };
const BOW_BRACED = { ox: 3, rows: [
  '.......',
  '..hhh..',
  '.h...h.',
  'hgggggh',
  '.......',
  '..###..',
  '..###..',
  '..###..'] };
const BOW_DRAWN = { ox: 3, rows: [
  '...w...',
  '..hah..',
  '.h.a.h.',
  'hg.a.gh',
  '..gdg..',
  '..###..',
  '..###..',
  '..###..'] };
const LIFT_S = 0.12;                                  // each step of the lift, and of the lowering
const FLY = 0.25;                                     // an arrow's flight, in seconds
const NOCK = 0.2;                                     // the pull before each release
// Arrows leave from over the drawn bow, at his middle, a cell over the nock.
const launch = () => [SX, HY - 6];
// The bow's pose at t: lifted at `up`, lowered from `down`, and while it is
// over his head, drawn when `pulling` says so.
function bowPose(t, up, down, pulling) {
  if (t < up || t >= down + 2 * LIFT_S) return BOW_REST;
  if (t < up + LIFT_S || t >= down + LIFT_S) return BOW_LIFT;
  if (t < up + 2 * LIFT_S || t >= down) return BOW_OVER;
  return pulling ? BOW_DRAWN : BOW_BRACED;
}
// Where an arrow is `p` of the way along its flight: a straight line from
// over the bow to the hide at column tx.
function arrowPos(t, st, tx, p) {
  const [lx, ly] = launch(), ty = coilBottom(tx, t, st) + 1;
  return [lerp(lx, tx, p), lerp(ly, ty, p)];
}
// One arrow shot at `t0` at column tx: its flight, its landing (a small
// blow), and the shaft left standing out of the hide for a moment.
function arrow(g, t, st, t0, tx, o = {}) {
  const fly = o.fly ?? FLY, a = t - t0;
  if (a < 0) return;
  const head = o.head ?? WHITE;
  const [lx, ly] = launch(), [ex, ey] = arrowPos(t, st, tx, 1);
  const d = Math.hypot(ex - lx, ey - ly) || 1, ux = (lx - ex) / d, uy = (ly - ey) / d;
  if (a < fly) {
    // the shaft lies along the way it is going, two cells behind the head
    const [hx, hy] = arrowPos(t, st, tx, a / fly);
    cell(g, hx, hy, head); cell(g, hx + ux, hy + uy, GREYS[10]); cell(g, hx + 2 * ux, hy + 2 * uy, GREYS[8]);
    return;
  }
  const b = coilBottom(tx, t, st), since = a - fly;
  burst(g, t, t0 + fly, tx, b, o.k ?? 0.2, tx * 3 + (o.id ?? 0));
  chip(g, t, t0 + fly, tx, b, o.k ?? 0.2, tx * 3 + (o.id ?? 0));
  if (since < 0.9) {
    const tone = GREYS[since < 0.4 ? 9 : since < 0.65 ? 7 : 4];
    cell(g, tx + ux, b + uy, tone); cell(g, tx + 2 * ux, b + 2 * uy, tone);
  }
  o.landed?.(g, t, st, since, tx, b);
}
function rangerScene(opts) {
  const { shots } = opts;
  const times = [...new Set(shots.map(([s]) => s))];
  const up = opts.up ?? times[0] - 2 * LIFT_S - NOCK - 0.1, down = times[times.length - 1] + 0.4;
  return {
    body: false, dur: opts.dur,
    state(t, api) { opts.state?.(t, api); },
    draw(g, t, api) {
      const st = api.st;
      const pulling = opts.pull ? opts.pull(t) : times.some(s => t >= s - NOCK && t < s);
      drawBody(g, HX, HY);
      opts.before?.(g, t, st);
      kit(g, bowPose(t, up, down, pulling), HX, HY, opts.tint);
      shots.forEach(([s, tx, o], i) => arrow(g, t, st, s, tx, { ...opts.arrow, ...o, id: i }));
    },
  };
}

// The flare: where an arrow of the Warden lands a ring of the abyss's light
// opens, and the arrowhead stays lit in the hide.
function flare(g, t, st, since, tx, b) {
  if (since < 0.35) ring(g, tx, b, 1 + since * 12, PURPLES[since < 0.12 ? 11 : since < 0.24 ? 9 : 7], since < 0.2 ? 1 : 2);
  if (since < 1.4) cell(g, tx, b, Math.floor(t * 6) % 2 ? PURPLES[11] : PURPLES[9]);
}
const SHOTS = [0.7, 1.5, 2.3, 3.1];

registerClass({
  key: 'ranger', name: 'Ranger', station: 'armory', group: 'blade',
  look: 'a bow twice his height at his side, no quiver; he lifts it over his head, level, and shoots straight up',
  hat(g, x, y) { kit(g, BOW_REST, x, y); },
  scenes: [
    { name: 'Base', about: 'The bow up over his head, then an arrow every 0.8 s straight up into the coil: a small blow that never misses, the shaft left standing in the hide. Then the bow comes back down.',
      ...rangerScene({ dur: 4.2, shots: SHOTS.map(s => [s, SX]) }) },
    { name: 'Marksman', about: 'Every fifth arrow is aimed: a long pull, a sight laid on the hide, then a hard straight shot, x5. On a Marked serpent (here another fighter\'s Mark) it crits.',
      ...rangerScene({
        dur: 5.8,
        shots: [...SHOTS.map(s => [s, SX]), [4.6, SX, { fly: 0.1, k: 1, landed(g, t, st, since, tx) {
          if (since < 0.3) ring(g, tx, Math.round(coilY(tx, t, st)), Math.round(4 - since * 8), PURPLES[since < 0.15 ? 11 : 8]);
        } }]],
        state(t, api) { api.status('marked', 1); },
        pull: t => SHOTS.some(s => t >= s - NOCK && t < s) || (t >= 3.4 && t < 4.6),
        before(g, t, st) {
          // the sight: a dotted line from over the bow up to the hide, and a
          // ring closing onto the spot, brightening as the pull holds
          if (t < 3.5 || t >= 4.6) return;
          const [lx, ly] = launch(), ty = coilBottom(SX, t, st) + 1;
          const tone = t > 4.2 ? GREYS[9] : GREYS[6];
          for (let cy = ly - 1; cy > ty; cy -= 2) cell(g, lx, cy, tone);
          ring(g, SX, ty - 1, Math.max(1, Math.round(4 - (t - 3.5) * 3)), tone, 2);
        },
      }) },
    { name: 'Volley', about: 'Arrows fly three at a time out of the bow over his head, fanning up: each comes down over a different length of the coil.',
      ...rangerScene({
        dur: 4.2,
        shots: SHOTS.flatMap(s => [[s, SX - 8], [s, SX], [s, SX + 8]]),
      }) },
    { name: 'Warden', about: 'Every arrow is a flare, its head lit on the drawn bow: it goes straight up, lands in a ring of the abyss\'s light, and the serpent is Lit -- the whole of it -- from the first one on.',
      ...rangerScene({
        dur: 4.2, shots: SHOTS.map(s => [s, SX]),
        tint: { w: PURPLES[11] },
        arrow: { head: PURPLES[11], landed: flare },
        state(t, api) { if (t >= SHOTS[0] + FLY + RUN_S) api.status('lit', 1); },
        before(g, t, st) {
          const a = t - SHOTS[0] - FLY;
          if (a >= 0 && a < RUN_S) runAlong(g, t, st, SX, a, [PURPLES[11], PURPLES[9], PURPLES[7]]);
        },
      }) },
  ],
});
