// The deep's palette, inverted (render/deep.js, "The palette is the yard's,
// inverted"): a tone as it is to be SEEN, turned into what is drawn to get
// it. On the light page every channel flipped, which the deep's negative
// flips back; on the dark page the lightness turned over with the hue kept,
// which the page's own map turns back -- a channel flip there would come out
// the complement, the purples green.
//
// A leaf of its own, so the kits (deep/kits.js) and the scales can name the
// deep's tones without importing the deep's whole drawing, which imports
// them back.

import { ABYSS_TONES, ABYSS_MAGIC_TONES } from '../config.js';
import { darkPage, turned } from '../ink.js';

const xor = h => '#' + (0xffffff ^ parseInt(h.slice(1), 16)).toString(16).padStart(6, '0');
export const seen = darkPage ? turned : xor;
export const GREYS = ABYSS_TONES.map(seen);         // the deep's grey ramp, black to white as seen
export const PURPLES = ABYSS_MAGIC_TONES.map(seen); // and its purple one
