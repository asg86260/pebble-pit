// The offer flag: a station whose board holds something you could buy this
// second flies a flag off its roof peak -- a pole, a black pennant rippling in
// the wind, and, the moment the offer first opens, one ring of ink breathing
// off the tip (the tower's own gesture at a whisper). It replaces the dashed
// breathing outline, which was the one thing in the yard that was an effect
// laid over a building rather than a thing standing in it; a flag is an object
// the wind moves, which is the register everything else here works in.
//
// The pole stands on the middle column of the station's stand box, so any
// station, present or future, is covered without knowing its drawing.

import { STATIONS, hasOffer, standRect } from '../board.js';
import {
  AURA_BREATH, AURA_IN,
  DROP_MARK_BOB_MS, DROP_MARK_LIFT,
  FLAG_GUST_MS, FLAG_GUST_SPAN, FLAG_H, FLAG_POLE, FLAG_RIPPLE_MS, FLAG_W,
  OFFER_WAVE_INK, OFFER_WAVE_MS, OFFER_WAVE_R, P, TOWER_SHAFT,
} from '../config.js';
import { now } from '../clock.js';
import { chimneyAt } from '../house.js';
import { S, bench, lab, school, tower } from '../state.js';
import { benchMark } from '../upgrades.js';
import { holdOptions, holdTarget } from '../crew/assign.js';   // wave7b-assign
import { ctx } from './ctx.js';
import { cell } from './marks.js';

// Whether a station is offering. The bench answers through its own mark --
// benchMark() also counts an unread heading, which is the bench's older, richer
// version of the same question -- and everything else through hasOffer.
const offering = which =>
  which === 'bench' ? !!benchMark() : hasOffer(which);

// One ring, at one point of the breath. `phase` is 0..1 through the swell:
// 0 is the line fully inset on the walls, 1 fully out past them. The caller
// owns the stroke state (dash, color), so the same body draws the breathing
// offer ring and the steady hold-a-body ring off one piece of arithmetic.
//
// The breath runs from INSIDE the walls to just outside them. The ground the
// buildings stand against is white, so a ring that lived wholly outside the
// box would be white on white -- invisible. Starting inset, the white line
// lies on the black of the building where it reads, and the outward half of
// the breath carries it over the edge and lets it dissolve into the sky --
// which is what makes it a pulse rather than a stripe painted on the wall.
// Whole pixels, so the 1-px line stays a 1-px line: a fractional offset is
// painted as a two-pixel grey fringe, the hairline the game is arranged to
// avoid.
export function auraRing(rect, phase) {
  const out = Math.round(-AURA_IN + phase * (AURA_IN + AURA_BREATH));
  // The box is snapped to the cell grid; the breath then pushes it out by
  // whole pixels, off the lattice on purpose -- a pulse quantized to cells
  // would jump six pixels at a stroke and read as a glitch, not a breath.
  const x = Math.round(rect.x / P) * P - out;
  const y = Math.round(rect.y / P) * P - out;
  const w = Math.round(rect.w / P) * P + out * 2;
  const h = Math.round(rect.h / P) * P + out * 2;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
}

// The roof peak, in whole cells: the middle column of the stand box, at its top
// edge. Derived from the box rather than from any station's own drawing, so a
// station nobody has built yet gets its mark for free.
function roofPeak(rect) {
  const cols = Math.round(rect.w / P);
  // The exact middle of the front, less half the pole's own cell: on an
  // odd-width building this is the center cell, on an even one the pole
  // straddles the middle boundary. Half a cell is still whole pixels, and a
  // solid fill carries no hairline -- snapping to the lattice here just
  // pushed every even-width flag half a cell to the right.
  const x = Math.round(rect.x / P) * P + (cols * P) / 2 - P / 2;
  const y = Math.round(rect.y / P) * P;
  return { x, y };
}

// Where a station's pole stands: on the building's own topmost feature, read
// off the same geometry the drawing reads, so the two cannot drift apart. The
// house's chimney climbs as the settlement grows and the flag climbs with it.
// A station not listed gets the middle column of its stand box's top edge,
// which is right for anything with a flat or peaked roof.
// Each two-cell feature takes the pole astride its middle boundary -- half a
// cell in from its left edge -- so the flag stands centered on it; the lab's
// three-cell stack centers on its middle cell outright.
const SPOT = {
  house: () => { const f = chimneyAt(); return f && { x: f.x + P / 2, y: f.y - P * 4 }; },
  bench: () => ({ x: bench.x + P * 4.5, y: bench.y - P * 2 }),  // the clamped block
  school: () => ({ x: school.x + P * 9.5, y: school.y }),       // the belfry
  lab: () => ({ x: lab.x + P * 3, y: lab.y }),                  // the chimney
  // The tower's stand box is the shaft plus the turret hung off its right side,
  // so the middle of the box is the spire's right shoulder -- two and a half
  // cells right of the point and three below the vane. The pole goes on the
  // vane's own mast instead, the topmost thing the tower draws, so the flag
  // continues the staff the vane already stands on. (bars.js works around the
  // same wide box with towerSpireBox.)
  tower: () => ({ x: tower.x + P * (TOWER_SHAFT / 2 - 0.5), y: tower.y - P * 3 }),
};

function flagBase(rect, which) {
  const spot = (SPOT[which] && SPOT[which]()) || roofPeak(rect);
  // The half-cell center is a real place but not a drawable one: the view maps
  // whole cells to whole device pixels (CELL/P is fractional), so a rect on
  // the half-cell smears into grey fringes down both edges. Snap the base to
  // the device-pixel grid instead -- within half a pixel of true center, and
  // every column of the flag, P multiples from here, stays crisp with it.
  const k = S.zoom * S.dpr;
  return { x: Math.round(spot.x * k) / k, y: spot.y };
}

// The highest pixel a station's flag can reach -- the pole's top, less the
// cell the pennant's crest rides up on. Answered whether or not the station is
// flying one this second: anything hanging above a station (its work bar, its
// done tick) clears the flag by this, and a clearance that came and went with
// the offer would make those marks hop every time a board changed. Null for a
// station that is not standing, which has nothing to clear.
export function flagReach(which) {
  const r = standRect(which);
  if (!r) return null;
  return flagBase(r, which).y - (FLAG_POLE + 1) * P;
}

// A stable per-station number in 0..1, so every flag flutters out of step with
// its neighbors without anything being stored or saved.
const seedOf = which => {
  let h = 0;
  for (const c of which) h = (h * 31 + c.charCodeAt(0)) % 997;
  return h / 997;
};

// The wind, as the flags feel it: two slow sines beating against each other,
// so the strength swells and dies on no cycle the eye can count, and the sign
// is the way the cloth flies. It is a wave over the yard, not a clock -- the
// same gust reaches each flag when its front actually gets there, so flags
// far apart turn at different moments while any two neighbors agree. One
// field for the whole yard: per-flag seeds in the *direction* would say two
// skies.
const windAt = (x, t) =>
  Math.sin((t / FLAG_GUST_MS - x / FLAG_GUST_SPAN) * Math.PI * 2) * 0.7 +
  Math.sin((t / (FLAG_GUST_MS * 0.377) - x / (FLAG_GUST_SPAN * 0.61)) * Math.PI * 2 + 2) * 0.5;

// The flag: a one-cell pole off the peak, a black pennant off the top of it.
// The pennant ripples -- each column rides a wave traveling out from the pole,
// a cell up or down -- which is a thing wind does to cloth, not an effect done
// to the player. The tip moves the most, the way a real flag's does; the whole
// cloth goes slack as a gust dies and picks up again -- sometimes on the other
// side of the pole -- as the next one arrives. The turn hides in the slack:
// the cloth only crosses the pole while it is hanging nearly straight.
//
// The pole runs all the way down to the ground and this layer is painted
// BEFORE the buildings, so whatever roofline a station actually draws -- a
// step, a slope, a turret off center -- covers the pole's lower run and the
// pole reads as standing on the silhouette. Anchoring it by arithmetic on the
// stand box put it floating over every roof that was not flat.
function drawFlag(rect, which, t) {
  // The pole stands on the station's own topmost feature where one is named
  // (FLAG_SPOTS, in cells off the stand box's corner), and on the middle of
  // the box's top edge otherwise.
  const { x, y } = flagBase(rect, which);
  const top = y - FLAG_POLE * P;
  // Two cells past the base, into the feature it stands on -- enough to bury
  // the foot in the chimney or the roof mass. It ran to the ground for a
  // while, trusting the silhouette to cover it, and the bench is mostly air:
  // the pole showed straight through between its legs.
  ctx.fillRect(x, top, P, FLAG_POLE * P + P * 2);
  const seed = seedOf(which);
  const wind = windAt(x, t);
  const dir = wind < 0 ? -1 : 1;
  // How far the cloth is out. The turn is a fold, not a flip: as the gust
  // dies the pennant shortens back toward the pole, hangs as a stub for the
  // still moment, and unfurls out the other side as the next gust arrives --
  // which is what cloth actually does when the wind comes about. The wind is
  // continuous through zero, so the fold and the turn cost no state.
  const out = Math.min(1, Math.abs(wind) * 1.6);
  const len = Math.max(1, Math.round(out * FLAG_W));
  const amp = out;
  for (let i = 0; i < len; i++) {
    // The wave grows along the pennant: the column at the pole is pinned to
    // it, the free end swings a whole cell. A third of a wavelength across
    // the cloth, so one crest rides it at a time -- a full wavelength put a
    // crest and a trough on the cloth at once, which in cells is a notch
    // bitten out of the middle of the flag. The per-station seed staggers
    // pace and phase so the yard's flags never beat in unison.
    const swing = Math.sin((t / (FLAG_RIPPLE_MS * (0.85 + 0.3 * seed))
                            - i / (FLAG_W * 3)) * Math.PI * 2 + seed * 7)
                * (i / (FLAG_W - 1)) * amp;
    const dy = Math.round(swing) * P;
    ctx.fillRect(x + dir * P * (1 + i), top + dy, P, P * FLAG_H);
  }
}

// When an offer first opens, one ring of ink breathes off the flag's tip and
// spends itself -- the tower's rings-going-out gesture at a whisper. The flag
// alone carries the standing state after; the ring marks the moment.
const openedAt = new Map();
function drawOpeningWave(rect, which, since, t) {
  const k = (t - since) / OFFER_WAVE_MS;
  if (k >= 1) return;
  const { x, y } = flagBase(rect, which);
  const from = { x: x + P / 2, y: y - FLAG_POLE * P };
  const rad = k * OFFER_WAVE_R;
  if (rad < P) return;
  ctx.globalAlpha = (1 - k) * OFFER_WAVE_INK;
  const n = Math.max(10, Math.round((Math.PI * 2 * rad) / P));
  ctx.beginPath();
  for (let j = 0; j < n; j++) {
    const a = (j / n) * Math.PI * 2;
    cell(from.x + Math.cos(a) * rad, from.y + Math.sin(a) * rad);
  }
  ctx.fill();
  ctx.globalAlpha = 1;
}

// The flags, painted before the buildings so the poles stand behind the
// rooflines (see drawFlag). The hold ring stays in drawAuras, over everything.
export function drawFlags() {
  const t = now();
  ctx.save();
  ctx.fillStyle = '#000';
  for (const which of STATIONS) {
    const on = offering(which);
    const r = on && standRect(which);
    if (!on || !r) { openedAt.delete(which); continue; }
    if (!openedAt.has(which)) openedAt.set(which, t);
    drawFlag(r, which, t);
    drawOpeningWave(r, which, openedAt.get(which), t);
  }
  ctx.restore();
}

export function drawAuras() {
  ctx.save();
  // While a body is held, every station it could join wears a small arrow
  // pointing down at it, bobbing -- the options laid out before the hand
  // wanders, read off the same table the drop consults. The zone itself is
  // the whole column of sky over the station, so the arrow hangs in the air
  // the way the drop does.
  const t = now();
  const bob = Math.round(Math.sin(t / DROP_MARK_BOB_MS * Math.PI * 2)) * P;
  ctx.fillStyle = '#000';
  for (const o of holdOptions()) {
    const cols = Math.round(o.ring.w / P);
    const cx = Math.round(o.ring.x / P) * P + Math.floor(cols / 2) * P;
    const y = Math.round(o.ring.y / P) * P - DROP_MARK_LIFT * P + bob;
    ctx.fillRect(cx - P, y, P * 3, P);
    ctx.fillRect(cx, y + P, P, P);
  }
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 1;
  // wave7b-assign: the station under a held body wears the same ring, steady
  // -- solid line, no breath and no crawl -- so the offer to retrain reads
  // before the hand commits. At phase 0, fully inset: the line lies on the
  // black of the building where a white line is at its brightest; swelled out
  // it would sit in the white sky, which on this palette is no ring at all.
  // holdTarget is null over a full station: no ring, no deal, one rule, and
  // the ring and the drop read one table in assign.js.
  const hold = holdTarget();
  if (hold) {
    ctx.setLineDash([]);
    auraRing(hold.ring, 0);
  }
  ctx.restore();
}
