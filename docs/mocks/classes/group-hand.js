// Track hand of docs/wave-class-anims.md: the altar's two classes (Brawler,
// Martial Artist) and the spire's inward one (Monk), and the two serpent
// statuses this track owns (Stunned, Exposed). A mock drawn from plain cells.
//
// The three are told apart by how they reach the coil: the Brawler swims up
// and swings big fists, the Martial Artist swims up and jabs fast off a pip
// meter, the Monk never leaves her spire and pushes waves of the abyss up
// from her palms, filling a ring of chi round herself.

import {
  P, FLOOR, STATION_X, BUDDY_X, BODY, GREYS, PURPLES, WHITE, INK, hash, clamp, steps,
  cell, rect, line, ring, coilY, coilTop, coilBottom, coilCells, COIL_X0, COIL_X1,
  burst, chip, drawBody, registerStatus, registerClass,
} from './harness.js';

// --- shared motion ------------------------------------------------------------------
const HOME_X = STATION_X - 1, HOME_Y = FLOOR - 2 - BODY;
const BUDDY_HX = BUDDY_X - 1;
const ease = u => { u = clamp(u, 0, 1); return u * u * (3 - 2 * u); };
const along = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
// The last of `times` at or before t, or null.
const lastOf = (times, t) => { let r = null; for (const x of times) if (x <= t) r = x; return r; };
const countTo = (times, t) => times.filter(x => x <= t).length;

// A stunning blow: the harness's freeze and shudder, and this track's mark
// over the head for as long as it stands.
function stunFor(api, t, from, len) {
  api.stun(from, len);
  if (t >= from && t < from + len) api.status('stunned', 1);
}

// Where a melee fighter hovers under the coil: its body's top `gap` cells
// under the coil's underside at its own column, so it rides the sway (and
// the stun's shudder) rather than punching air.
const hoverY = (t, st, gap) => coilBottom(STATION_X, t, st) + gap;
// A swim up at [up0, up1] and back at [dn0, dn1]: the body's row at t.
function tripY(t, st, gap, up0, up1, dn0, dn1) {
  const h = hoverY(t, st, gap);
  const k = t < dn0 ? ease(along(t, up0, up1)) : 1 - ease(along(t, dn0, dn1));
  return Math.round(HOME_Y + (h - HOME_Y) * k);
}

// A hit's both halves (the voted C) at once.
function land(g, t, t0, cx, cy, k, id) { chip(g, t, t0, cx, cy, k, id); burst(g, t, t0, cx, cy, k, id); }

// --- the statuses ----------------------------------------------------------------------
// Stunned: a dizzy ring over the head, flat as a halo, with a bright cell
// racing round it and a tail behind, while the harness freezes the sway and
// shudders the whole coil.
const HALO = [[-2, 0], [-1, -1], [0, -1], [1, -1], [2, 0], [1, 1], [0, 1], [-1, 1]];
registerStatus('stunned', {
  name: 'Stunned', on: 'serpent',
  serpent(g, t, s) {
    const hx = COIL_X0 + 3, hy = coilTop(hx, t, s) - 3;
    const lead = Math.floor(t * 14) % HALO.length;
    HALO.forEach(([dx, dy], i) => {
      const behind = (lead - i + HALO.length) % HALO.length;
      cell(g, hx + dx, hy + dy, behind === 0 ? WHITE : behind === 1 ? GREYS[9] : behind === 2 ? GREYS[7] : GREYS[5]);
    });
  },
});

// Exposed: the hide opened. Every few columns along the whole coil a scale
// is lifted: a notch of black in the edge and the scale standing a cell off
// it. Quiet on its own; the blow that applies it runs a wave of it along the
// body first (exposeWave, below).
const OPEN_EVERY = 4;
// One column's share of the pattern, so the wave that applies it can lay it
// down column by column as it passes.
function exposedAt(g, t, s, cx) {
  if ((cx - COIL_X0 - 2) % OPEN_EVERY !== 0 || cx > COIL_X1 - 1) return;
  const top = coilTop(cx, t, s), bot = coilBottom(cx, t, s);
  // the scale lifts and settles a cell on its own slow clock
  const up = hash(cx * 7 + Math.floor(t * 1.5 + hash(cx) * 3)) < 0.5 ? 1 : 2;
  cell(g, cx, top, INK);
  cell(g, cx, top - up, GREYS[9]);
  cell(g, cx + 2, bot, INK);
}
registerStatus('exposed', {
  name: 'Exposed', on: 'serpent',
  serpent(g, t, s) { for (let cx = COIL_X0; cx <= COIL_X1; cx++) exposedAt(g, t, s, cx); },
});
// The loud half of Exposed: from the blow at column hx, a front of torn
// scales runs both ways along the body until it has covered all of it.
const EXPOSE_RUN = 1.4;   // seconds for the tear to run the whole coil
function exposeWave(g, t, t0, hx, st) {
  const a = t - t0;
  if (a < 0 || a > EXPOSE_RUN) return;
  const d = a * 34;
  for (let cx = COIL_X0; cx <= COIL_X1; cx++) {
    const off = d - Math.abs(cx - hx);
    if (off < 0) continue;
    if (off > 5) { exposedAt(g, t, st, cx); continue; }
    const top = coilTop(cx, t, st), bot = coilBottom(cx, t, st);
    // the front itself: a dark band across the whole girth
    if (off < 1) { for (let cy = top; cy <= bot; cy++) cell(g, cx, cy, GREYS[5]); continue; }
    // behind it the hide tears: black at both edges, scales thrown up off the top
    cell(g, cx, top, INK); cell(g, cx, bot, INK);
    const lift = off < 3 ? 2 : 1;
    cell(g, cx, top - lift, off < 3 ? WHITE : GREYS[8]);
  }
}

// --- the Brawler ---------------------------------------------------------------------
// Strength: a flat cap with its peak forward, and two bare fists as big as
// his head, hung either side of him. He swims up under the coil and swings
// them straight up into it, one then the other.
const FIST = 2;
// A fist's column: left hangs two cells off the body, right one past it.
const fistX = (x, side) => side < 0 ? x - FIST - 0 : x + BODY;
function drawFist(g, fx, fy, size = FIST) {
  rect(g, fx, fy, size, size, WHITE);
  // the knuckles: a darker row along the striking face
  rect(g, fx, fy, size, 1, GREYS[9]);
}
// A punch's reach at time t for one that lands at L: 0 rest, 1 full, -1 the
// wind-up (fist drawn down).
function punchReach(t, L) {
  const a = t - L;
  if (a < -0.24 || a > 0.3) return 0;
  if (a < -0.08) return -1;
  if (a < 0) return (a + 0.08) / 0.08;
  if (a < 0.1) return 1;
  return 1 - (a - 0.1) / 0.2;
}
// Both fists, the one punching extended up to the coil's underside with its
// arm behind it. `punches` is a list of { at, side, size }.
function drawFists(g, t, x, y, st, punches, rest0 = FIST) {
  for (const side of [-1, 1]) {
    const mine = punches.filter(p => p.side === side);
    let reach = 0, size = rest0;
    for (const p of mine) { const r = punchReach(t, p.at); if (r !== 0) { reach = r; size = p.size || FIST; } }
    const fx = side < 0 ? x - size : x + BODY;
    const rest = y + 1;
    let fy = rest;
    if (reach < 0) fy = rest + 1;
    else if (reach > 0) {
      const face = Math.max(coilBottom(fx, t, st), coilBottom(fx + size - 1, t, st)) + 1;
      fy = Math.round(rest + (face - rest) * reach);
    }
    // the arm, from the shoulder to the fist, on the fist's inner column
    const armX = side < 0 ? x - 1 : x + BODY;
    for (let r = fy + size; r < y + 1; r++) cell(g, armX, r, GREYS[8]);
    drawFist(g, fx, fy, size);
  }
}
// Where a punch lands, for the burst: the middle of the fist's face.
function punchSpot(t, st, x, side, size = FIST) {
  const fx = side < 0 ? x - size : x + BODY;
  return { cx: fx + (size - 1) / 2, cy: Math.max(coilBottom(fx, t, st), coilBottom(fx + size - 1, t, st)) };
}

const BR_GAP = 6;
// A trip up and a row of punches, then home: the shape every Brawler scene
// shares. Returns the body's (x, y) for the frame.
function brawlerAt(t, st, up0, up1, dn0, dn1, shake = 0) {
  const y = tripY(t, st, BR_GAP, up0, up1, dn0, dn1);
  const x = HOME_X + (shake ? (hash(Math.floor(t * 18)) < 0.5 ? -1 : 0) : 0);
  return { x, y };
}
function drawBrawler(g, t, api, at, punches, heavy = [], fist = FIST) {
  // the bite and the scales first, so the fist is seen in front of them
  for (const p of [...punches, ...heavy]) {
    const s = punchSpot(t, api.st, at.x, p.side, p.size || FIST);
    land(g, t, p.at, s.cx, s.cy, p.k || 0.3, Math.round(p.at * 10));
  }
  drawBody(g, at.x, at.y);
  api.cls.hat(g, at.x, at.y, t);
  drawFists(g, t, at.x, at.y, api.st, [...punches, ...heavy], fist);
}
const alt = (times, k = 0.3) => times.map((at, i) => ({ at, side: i % 2 ? 1 : -1, k }));

const BR_BASE = [1.0, 2.2, 3.4];
const PUM_JABS = [1.0, 1.6, 2.2], PUM_HAY = 3.2, PUM_STUN = 1.8;
const RAGE = Array.from({ length: 12 }, (_, i) => 1.0 + i * 0.42);
const BRU = [1.0, 2.2, 3.4];

registerClass({
  key: 'brawler', name: 'Brawler', station: 'altar', group: 'hand',
  look: 'a flat cap, peak forward; two bare fists as big as his head',
  hat(g, cx, cy) {
    // the crown sits on the head, the peak juts a cell forward
    rect(g, cx, cy - 1, BODY, 1, GREYS[8]);
    rect(g, cx, cy - 2, 2, 1, GREYS[8]);
    cell(g, cx + BODY, cy - 1, GREYS[9]);
  },
  scenes: [
    {
      name: 'Base', about: 'A heavy punch every 1.2 s: he swims up under the coil and swings, one fist then the other.',
      dur: 4.8, body: false,
      state() {},
      draw(g, t, api) {
        const at = brawlerAt(t, api.st, 0.2, 0.8, 3.8, 4.5);
        drawBrawler(g, t, api, at, alt(BR_BASE));
      },
    },
    {
      name: 'Pummel', about: 'Every fourth punch is a haymaker: he sinks, winds right back and drives up with a fist twice the size. It stuns.',
      dur: 6.4, body: false,
      state(t, api) { stunFor(api, t, PUM_HAY, PUM_STUN); },
      draw(g, t, api) {
        const st = api.st;
        let at = brawlerAt(t, st, 0.2, 0.8, 5.4, 6.1);
        // the haymaker's wind-up: the body sinks two cells, then drives up
        const a = t - PUM_HAY;
        if (a > -0.5 && a < 0) at = { x: at.x, y: at.y + (a < -0.12 ? 2 : 0) };
        const heavy = [{ at: PUM_HAY, side: 1, size: 3, k: 0.75 }];
        drawBrawler(g, t, api, at, alt(PUM_JABS), heavy);
        // the count to four: a pip a punch beside him, the fourth the haymaker
        const n = countTo([...PUM_JABS, PUM_HAY], t) % 4 || (t >= PUM_HAY && t < PUM_HAY + 0.6 ? 4 : 0);
        if (t < 5.4) for (let i = 0; i < 4; i++)
          cell(g, at.x - 3, at.y + 2 - i, i < n ? (i === 3 ? WHITE : GREYS[9]) : GREYS[3]);
        // the blow rings the coil out from where it landed
        if (a >= 0 && a < 0.5) {
          const s = punchSpot(t, st, at.x, 1, 3);
          ring(g, s.cx, s.cy, 1 + a * 14, a < 0.25 ? WHITE : GREYS[7], 2);
        }
      },
    },
    {
      name: 'Rage', about: 'Each punch in a row hits 5% harder, to +60%: he steams, then shakes, and the blows grow.',
      dur: 7.4, body: false,
      state() {},
      draw(g, t, api) {
        const rage = countTo(RAGE, t) / RAGE.length * (t < 6.4 ? 1 : 1 - along(t, 6.4, 7.2));
        const at = brawlerAt(t, api.st, 0.2, 0.8, 6.4, 7.1, rage >= 1);
        // past half rage the fists swell a cell, and the blows with them
        const big = i => i >= RAGE.length / 2 ? 3 : FIST;
        const punches = RAGE.map((p, i) => ({ at: p, side: i % 2 ? 1 : -1, size: big(i), k: 0.25 + 0.4 * (i / (RAGE.length - 1)) }));
        drawBrawler(g, t, api, at, punches, [], rage >= 0.5 ? 3 : FIST);
        // steam off his head, more of it the longer the row: puffs rise off
        // both sides of the cap and step down the tones as they go
        const puffs = Math.round(rage * 8);
        for (let i = 0; i < puffs; i++) {
          const side = i % 2 ? at.x + BODY : at.x - 1;
          const rise = (t * 3 + hash(i + 3) * 4) % 4;
          const drift = rise > 2 ? (i % 2 ? 1 : -1) : 0;
          cell(g, side + drift, at.y - 1 - rise, [WHITE, GREYS[9], GREYS[7], GREYS[5]][Math.floor(rise)]);
        }
      },
    },
    {
      name: 'Bruiser', about: 'Every punch Exposes: the first tears the hide open along the whole coil; the rest keep it open.',
      dur: 4.8, body: false,
      // the status stands once the tear has run the length of the coil
      state(t, api) { if (t >= BRU[0] + EXPOSE_RUN) api.status('exposed', 1); },
      draw(g, t, api) {
        const at = brawlerAt(t, api.st, 0.2, 0.8, 3.8, 4.5);
        const punches = alt(BRU);
        drawBrawler(g, t, api, at, punches);
        punches.forEach((p, i) => {
          const s = punchSpot(t, api.st, at.x, p.side);
          if (i === 0) exposeWave(g, t, p.at, s.cx, api.st);
          else {
            // a later punch re-opens round where it lands: a short tear either side
            const a = t - p.at;
            if (a >= 0 && a < 0.3) for (let d = -3; d <= 3; d++)
              cell(g, s.cx + d, coilBottom(s.cx + d, t, api.st), (d + Math.floor(a * 20)) % 2 ? INK : GREYS[9]);
          }
        });
      },
    },
  ],
});

// --- the Martial Artist -------------------------------------------------------------
// Technique: a white headband with its two tails streaming behind her, and
// small hands. She swims up under the coil and jabs, a thin fast streak a
// strike, three a second; every strike lights a pip of the five under her,
// and at five she crouches and launches her whole body into the coil.
const MA_GAP = 5, PIPS = 5;
function maHands(g, x, y, busy, guard) {
  const hy = guard ? y : y + 1;
  if (!busy.includes(-1)) cell(g, x - 1, hy, WHITE);
  if (!busy.includes(1)) cell(g, x + BODY, hy, WHITE);
}
// A jab landing at L from the hand on `side`: the hand shoots up as a streak
// from the head to the coil's underside and pulls back as it fades.
function jab(g, t, L, x, y, side, st, echo = false) {
  const a = t - L;
  if (a < -0.06 || a > 0.16) return false;
  const col = side < 0 ? x - 1 : x + BODY;
  const face = coilBottom(col, t, st) + 1;
  const tip = a < 0 ? Math.round(y - 1 + (face - (y - 1)) * (1 + a / 0.06)) : face;
  const shaft = a < 0.05 ? GREYS[8] : a < 0.1 ? GREYS[6] : GREYS[4];
  for (let r = tip; r <= y; r++) cell(g, col, r, r === tip && a < 0.1 ? WHITE : shaft);
  // Flow's double: an after-image a column out, a beat behind
  if (echo && a > 0) for (let r = face; r <= y; r++) cell(g, col + side, r, a < 0.08 ? GREYS[7] : GREYS[4]);
  return true;
}
function drawPips(g, x, y, n, flash) {
  for (let i = 0; i < PIPS; i++)
    cell(g, x - 1 + i, y + BODY + 1, flash ? (flash > 0 ? WHITE : GREYS[6]) : i < n ? WHITE : GREYS[3]);
}
// The finisher at F: crouch two cells, launch the body up into the coil,
// hold, drop back to the hover. Returns the body's row, or null when the
// finisher is not under way.
function finisherY(t, F, hover, face) {
  const a = t - F;
  if (a < -0.35 || a > 0.45) return null;
  if (a < -0.15) return hover + 2;
  if (a < 0) return Math.round(hover + 2 + (face - hover - 2) * ease((a + 0.15) / 0.15));
  if (a < 0.2) return face;
  return Math.round(face + (hover - face) * ease((a - 0.2) / 0.25));
}
function launchTrail(g, t, F, x, y, from) {
  const a = t - F;
  if (a < -0.15 || a > 0.1) return;
  for (let r = y + BODY; r < from + BODY; r++) {
    const k = (r - y - BODY) / Math.max(1, from - y);
    rect(g, x, r, BODY, 1, k < 0.3 ? GREYS[7] : k < 0.6 ? GREYS[5] : GREYS[3]);
  }
}
// One Martial Artist scene's whole drawing, off its timetable.
//   jabs: [{ at, side }], fins: [finisher times], trip: [up0, up1, dn0, dn1],
//   per: pips a jab lights, echo: Flow's after-image, k: the finisher's size.
function drawMartial(g, t, api, { jabs, fins, trip, per = 1, echo = false, k = 0.65 }) {
  const st = api.st, x = HOME_X;
  const hover = tripY(t, st, MA_GAP, ...trip);
  const face = coilBottom(STATION_X, t, st) + 1;
  let y = hover, fin = null;
  for (const F of fins) { const fy = finisherY(t, F, hover, face); if (fy != null) { y = fy; fin = F; } }
  // the bite and the scales under everything she draws
  for (const j of jabs) {
    const col = j.side < 0 ? x - 1 : x + BODY;
    land(g, t, j.at, col, coilBottom(col, t, st), 0.18, Math.round(j.at * 10));
  }
  for (const F of fins) land(g, t, F, x + 1, face - 1, k, Math.round(F * 10) + 50);
  if (fin != null) launchTrail(g, t, fin, x, y, hover + 2);
  drawBody(g, x, y);
  api.cls.hat(g, x, y, t);
  const busy = [];
  for (const j of jabs) if (jab(g, t, j.at, x, y, j.side, st, echo)) busy.push(j.side);
  maHands(g, x, y, busy, false);
  // the pips: jabs since the last finisher, `per` a jab, flashing as she crouches
  const lastF = lastOf(fins, t) ?? -1;
  const n = Math.min(PIPS, jabs.filter(j => j.at <= t && j.at > lastF).length * per);
  const next = fins.find(F => t >= F - 0.35 && t < F);
  drawPips(g, x, y, n, next != null ? (Math.floor(t * 16) % 2 ? 1 : -1) : 0);
  return { x, y, face };
}
const jabRow = (from, n, gap = 1 / 3) => Array.from({ length: n }, (_, i) => ({ at: from + i * gap, side: i % 2 ? 1 : -1 }));

const MA_BASE = { jabs: jabRow(0.8, 5), fins: [2.75], trip: [0.1, 0.6, 3.5, 4.1] };
const MA_FLOW = { jabs: [...jabRow(0.8, 3), ...jabRow(2.45, 3)], fins: [2.0, 3.65], trip: [0.1, 0.6, 4.3, 4.9], per: 2, echo: true };
const MA_PP = { ...MA_BASE, k: 0.55 };
const PP_F = MA_PP.fins[0];
// Counter: the thrash's ripple leaves the belly at THRASH and she answers
// the moment it reaches her.
const THRASH = 0.8, RIPPLE_V = 30, RIPPLE_X = 34;
const RIPPLE_REACH = Math.hypot(STATION_X - RIPPLE_X, (HOME_Y + 1) - 12) / RIPPLE_V;
const COUNTER = THRASH + RIPPLE_REACH + 0.25;

registerClass({
  key: 'martial', name: 'Martial Artist', station: 'altar', group: 'hand',
  look: 'a white headband, its two tails streaming; small quick hands; five pips under her',
  hat(g, cx, cy, t) {
    // a band a shade under the body's white, so it reads as cloth on a head
    rect(g, cx, cy - 1, BODY, 1, GREYS[8]);
    // the tails stream back off the knot and flutter a cell
    const f = Math.floor(t * 6) % 2;
    cell(g, cx - 1, cy - 1, WHITE);
    cell(g, cx - 2, cy - 1 + f, GREYS[10]);
  },
  scenes: [
    {
      name: 'Base', about: 'Quick light strikes, three a second, each a pip; at five pips she launches herself into the coil, all five in one blow.',
      dur: 4.6, body: false,
      state() {},
      draw(g, t, api) { drawMartial(g, t, api, MA_BASE); },
    },
    {
      name: 'Flow', about: 'Each strike counts double: two pips a jab, an after-image beside every hand, and the finisher twice as often.',
      dur: 5.4, body: false,
      state() {},
      draw(g, t, api) { drawMartial(g, t, api, MA_FLOW); },
    },
    {
      name: 'Pressure Points', about: 'Her finisher is aimed: a sight closes on one point, and the blow Marks the whole coil.',
      dur: 4.6, body: false,
      state(t, api) { if (t >= PP_F) api.status('marked', 1); },
      draw(g, t, api) {
        const { x, face } = drawMartial(g, t, api, MA_PP);
        const a = t - PP_F, cx = x + 1, cy = face - 2;
        // the sight: four arms of two cells closing on the point before she launches
        if (a > -0.6 && a < 0) {
          const r = Math.round(1 + 4 * (-a / 0.6));
          // black where it falls on the hide, white where it falls on the water
          for (const [dx, dy] of [[-r, 0], [r, 0], [0, -r], [0, r], [-r - 1, 0], [r + 1, 0], [0, -r - 1], [0, r + 1]]) {
            const px = cx + dx, py = cy + dy;
            const onHide = py >= coilTop(px, t, api.st) && py <= coilBottom(px, t, api.st);
            cell(g, px, py, onHide ? INK : a > -0.2 ? WHITE : GREYS[8]);
          }
        }
        // and the Mark runs out from the point along the body both ways
        if (a >= 0 && a < 1.2) {
          const d = a * 44;
          for (const dir of [-1, 1]) for (let k = 0; k < 3; k++) {
            const px = Math.round(cx + dir * (d - k * 2));
            if (px < COIL_X0 || px > COIL_X1 || d - k * 2 < 0) continue;
            cell(g, px, Math.round(coilY(px, t, api.st)), k === 0 ? INK : GREYS[5]);
          }
        }
      },
    },
    {
      name: 'Counter', about: 'She waits in guard. When the serpent thrashes, its ripple reaches her and she answers at once with a full finisher.',
      dur: 4, body: false,
      state() {},
      draw(g, t, api) {
        const st = api.st, x = HOME_X;
        // the thrash: rings of cells out of the belly, drawn below the coil
        const a = t - THRASH;
        if (a >= 0 && a < 1.2) {
          const by = Math.round(coilY(RIPPLE_X, t, st));
          for (const [dr, tone] of [[0, GREYS[8]], [-3, GREYS[5]], [-6, GREYS[3]]]) {
            const r = a * RIPPLE_V + dr;
            if (r < 2) continue;
            const n = Math.ceil(Math.PI * 2 * r);
            for (let i = 0; i < n; i++) {
              const ang = i / n * Math.PI * 2;
              const px = RIPPLE_X + Math.cos(ang) * r, py = by + Math.sin(ang) * r;
              if (py <= coilBottom(Math.round(px), t, st) || py >= FLOOR) continue;
              cell(g, px, py, tone);
            }
          }
        }
        // her answer: a straight dash from the station into the coil and back
        const face = coilBottom(STATION_X, t, st) + 1;
        const c = t - COUNTER;
        let y = HOME_Y;
        if (c > -0.25 && c < 0) y = Math.round(HOME_Y + (face - HOME_Y) * ease((c + 0.25) / 0.25));
        else if (c >= 0 && c < 0.2) y = face;
        else if (c >= 0.2 && c < 0.9) y = Math.round(face + (HOME_Y - face) * ease((c - 0.2) / 0.7));
        land(g, t, COUNTER, x + 1, face - 1, 0.7, 77);
        if (c > -0.25 && c < 0.1) launchTrail(g, t, COUNTER, x, y, HOME_Y);
        drawBody(g, x, y);
        api.cls.hat(g, x, y, t);
        maHands(g, x, y, [], y === HOME_Y);
        // in guard the pips stand full; the counter spends them all, and
        // they fill again once she is home
        const n = c >= 0 && c < 1.4 ? Math.floor(Math.max(0, c - 0.9) / 0.1) : PIPS;
        drawPips(g, x, y, n, c > -0.25 && c < 0 ? 1 : 0);
      },
    },
  ],
});
