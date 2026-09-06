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
  FLAG_H, FLAG_POLE, FLAG_RIPPLE_MS, FLAG_W,
  OFFER_WAVE_INK, OFFER_WAVE_MS, OFFER_WAVE_R, P,
} from '../config.js';
import { now } from '../clock.js';
import { benchMark } from '../upgrades.js';
import { holdTarget } from '../crew/assign.js';   // wave7b-assign
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
  const x = Math.round(rect.x / P) * P + Math.floor(cols / 2) * P;
  const y = Math.round(rect.y / P) * P;
  return { x, y };
}

// The flag: a one-cell pole off the peak, a black pennant off the top of it.
// The pennant ripples -- each column rides a wave traveling out from the pole,
// a cell up or down -- which is a thing wind does to cloth, not an effect done
// to the player. The tip therefore moves the most, the way a real flag's does.
function drawFlag(rect, t) {
  const { x, y } = roofPeak(rect);
  const top = y - FLAG_POLE * P;
  ctx.fillRect(x, top, P, FLAG_POLE * P);
  for (let i = 0; i < FLAG_W; i++) {
    // the wave grows along the pennant: the column at the pole is pinned to
    // it, the free end swings a whole cell
    // A third of a wavelength across the cloth: one crest riding out at a
    // time. A full wavelength put a crest and a trough on the cloth at once,
    // which in cells is a notch bitten out of the middle of the flag.
    const swing = Math.sin((t / FLAG_RIPPLE_MS - i / (FLAG_W * 3)) * Math.PI * 2)
                * (i / (FLAG_W - 1));
    const dy = Math.round(swing) * P;
    ctx.fillRect(x + P * (1 + i), top + dy, P, P * FLAG_H);
  }
}

// When an offer first opens, one ring of ink breathes off the flag's tip and
// spends itself -- the tower's rings-going-out gesture at a whisper. The flag
// alone carries the standing state after; the ring marks the moment.
const openedAt = new Map();
function drawOpeningWave(rect, since, t) {
  const k = (t - since) / OFFER_WAVE_MS;
  if (k >= 1) return;
  const { x, y } = roofPeak(rect);
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

export function drawAuras() {
  const t = now();
  ctx.save();
  ctx.fillStyle = '#000';
  for (const which of STATIONS) {
    const on = offering(which);
    const r = on && standRect(which);
    if (!on || !r) { openedAt.delete(which); continue; }
    if (!openedAt.has(which)) openedAt.set(which, t);
    drawFlag(r, t);
    drawOpeningWave(r, openedAt.get(which), t);
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
