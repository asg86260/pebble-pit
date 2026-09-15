import { PILE_LIMIT } from './crew.js';
import { BANK_SLOPE } from './pit.js';

// --- the piles ---------------------------------------------------------------
// How wide a station's own heap stands, in cells: only as wide as its limit
// needs, so a strip fills to a crest just as the limit is reached and the heap
// can be read. At a slope of BANK_SLOPE a triangular heap of n grains wants a
// base of about sqrt(4n / slope) cells.
//
// Counted rather than rounded: a column may not stand at a fraction of a cell,
// so what a strip really holds is the sum of the FLOORS of its ceilings, and
// the ideal base for the quarry's 180 holds 176. A strip that cannot reach its
// own limit is a station that never stops and a full-pile mark that never
// lights. A loop, because the loss is a sum of fractions with no closed form;
// it runs once a key at layout time, starting from the ideal triangle since
// the answer is never below it.
//
// The rock is not in here on purpose: its spoil is a long bank of dust running
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
// --- the press ---------------------------------------------------------------
// The filter over the finished frame. See press.js for what each one is, and
// why they are drawn in 2D rather than through a shader.
//
// A whisper of scanline, and enough falloff at the edges to put the page in a
// room rather than on a light box. Neither may argue with a picture made of
// whole black pixels, so both are small on purpose, and the look is the pair
// of them rather than either one.
export const PRESS_MIX = { scanlines: 0.2, vignette: 0.15 };
