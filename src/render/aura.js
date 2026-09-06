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
import { ctx } from './ctx.js';

// Whether a station is offering. The bench answers through its own mark --
// benchMark() also counts an unread heading, which is the bench's older, richer
// version of the same question -- and everything else through hasOffer.
const offering = which =>
  which === 'bench' ? !!benchMark() : hasOffer(which);

export function drawAuras() {
  const t = now();
  // One breath for every station, in step: half a cycle out, half back, eased
  // with a sine so the turn at either end is soft rather than a bounce.
  const breath = (1 - Math.cos((t % AURA_CYCLE_MS) / AURA_CYCLE_MS * Math.PI * 2)) / 2;
  // Whole pixels, so the 1-px line stays a 1-px line: a fractional offset is
  // painted as a two-pixel grey fringe, which is the hairline the whole game is
  // arranged to avoid. The breath steps through a handful of positions and the
  // easing spends longest at the turns, which reads as breathing, not ticking.
  const out = Math.round(AURA_IN + breath * AURA_BREATH);

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
    // The box is snapped to the cell grid; the breath then pushes it out by
    // whole pixels, off the lattice on purpose -- a pulse quantized to cells
    // would jump six pixels at a stroke and read as a glitch, not a breath.
    const x = Math.round(r.x / P) * P - out;
    const y = Math.round(r.y / P) * P - out;
    const w = Math.round(r.w / P) * P + out * 2;
    const h = Math.round(r.h / P) * P + out * 2;
    ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  }
  ctx.restore();
}
