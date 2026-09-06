// The offer aura (wave7-ui, feedback7 item 4): a station whose board holds
// something you could buy this second breathes -- a 1-px white dashed outline
// around the building, easing out and back on a slow cycle, its dashes crawling.
// It replaces the diamond that used to hang under the station: a mark ON the
// building says "this place has something for you" without adding another glyph
// to the row of signs under it. (The diamond itself is deleted post-merge; see
// drawOffers in render/crew.js, which is not this track's file this wave.)
//
// White on the yard's black-and-white, no gradients, flat 1-px line. The box is
// snapped to the P grid and the stroke sits on the half-pixel, so the line is a
// crisp single pixel rather than a two-pixel grey smear.

import { STATIONS, hasOffer, standRect } from '../board.js';
import { AURA_BREATH, AURA_CYCLE_MS, AURA_DASH, AURA_IN, AURA_MARCH, P } from '../config.js';
import { now } from '../clock.js';
import { benchMark } from '../upgrades.js';
import { holdTarget } from '../crew/assign.js';   // wave7b-assign
import { ctx } from './ctx.js';

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

export function drawAuras() {
  const t = now();
  // One breath for every station, in step: half a cycle out, half back, eased
  // with a sine so the turn at either end is soft rather than a bounce.
  const breath = (1 - Math.cos((t % AURA_CYCLE_MS) / AURA_CYCLE_MS * Math.PI * 2)) / 2;

  ctx.save();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 1;
  ctx.setLineDash([AURA_DASH, AURA_DASH]);
  // the dashes march slowly along the outline, so the ring reads as alive even
  // at the still ends of the breath
  ctx.lineDashOffset = -(t / 1000 * AURA_MARCH) % (AURA_DASH * 2);
  for (const which of STATIONS) {
    if (!offering(which)) continue;
    const r = standRect(which);
    if (!r) continue;
    auraRing(r, breath);
  }
  // wave7b-assign: the station under a held body wears the same ring, steady
  // -- fully swelled, solid line, no breath and no crawl -- so the offer to
  // retrain reads before the hand commits. holdTarget is null over a full
  // station: no ring, no deal, one rule, and both read off assign.js's table.
  const hold = holdTarget();
  if (hold) {
    ctx.setLineDash([]);
    auraRing(hold.rect, 1);
  }
  ctx.restore();
}
