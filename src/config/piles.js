import { PILE_LIMIT } from './crew.js';
import { BANK_SLOPE } from './pit.js';

// --- Track PILES ------------------------------------------------------------
// How wide a station's own heap stands, in cells. A pile you cannot read is a
// number you have to go and look up: 180 grains along seventy cells lie two
// deep, and two deep looks the same at a quarter full as at the limit. So a
// site's strip is only as wide as its limit needs. At a slope of BANK_SLOPE a
// triangular heap of n grains wants a base of about sqrt(4n / slope) cells --
// the area of a triangle, read backwards -- and a strip that wide fills to a
// crest just as the limit is reached.
//
// Counted rather than rounded, and that is Track F2's correction. A column may
// not stand at a fraction of a cell, so what a strip really holds is the sum of
// the FLOORS of its ceilings, and every one of those loses up to most of a cell:
// the ideal triangle for the quarry's 180 wants a base of 21.9, and the 22 cells
// that were reserved hold 176. The four missing grains never showed, because a
// crate stood on the strip and its five cells of flat brim covered them over --
// so the rounding-up was never actually the headroom the note above claimed, the
// crate was. Item 8 took the crate away, which leaves this the one thing holding
// a station's limit up, and a strip that cannot reach its own limit is a station
// that never stops and a full-pile mark that never lights.
//
// So: the narrowest base whose whole cells hold the limit. It is a loop rather
// than a formula because the loss is a sum of fractions and there is no closed
// form for it -- and it is cheap, run once a key at layout time. The ideal
// triangle is where it starts from, since the answer is never below that.
//
// The rock is not in here on purpose. Its spoil is a long bank of dust running
// out to the lip of the pit, and a bank is what it should look like.
const holds = base => {
  let n = 0;
  for (let c = 0; c < base; c++) n += Math.floor(Math.min(c + 1, base - 1 - c) * BANK_SLOPE);
  return n;
};
export const heapBase = key => {
  const want = PILE_LIMIT[key];
  let base = Math.ceil(Math.sqrt(4 * want / BANK_SLOPE));
  while (holds(base) < want) base++;
  return base;
};
// --- Track PRESS ------------------------------------------------------------
// The filter over the finished frame. See press.js for what each one is, and why
// these three are drawn in 2D rather than through a shader -- the pass that used
// to do this cost twenty milliseconds a frame on a large window, and none of it
// was the shading.
//
// A whisper of scanline, and enough falloff at the edges to put the page in a
// room rather than on a light box. The point of both is that the yard reads as
// coming off a screen rather than out of a printer, and neither may argue with a
// picture made of whole black pixels -- so both numbers are small on purpose,
// and the look is the pair of them rather than either one.
export const PRESS_MIX = { scanlines: 0.2, vignette: 0.15 };
