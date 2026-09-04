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
// Rounded up, and that rounding is also the headroom. A column may not stand at
// a fraction of a cell, so every one of them holds a little more than the ideal
// triangle wants: 180 grains go into 187 cells of room here, which leaves the
// half-dozen still in the air when the station stops somewhere to land.
//
// The rock is not in here on purpose. Its spoil is a long bank of dust running
// out to the lip of the pit, and a bank is what it should look like.
export const heapBase = key => Math.ceil(Math.sqrt(4 * PILE_LIMIT[key] / BANK_SLOPE));
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
