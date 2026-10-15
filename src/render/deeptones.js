// The deep's palette, inverted (render/deep.js, "The palette is the yard's,
// inverted"): a tone as it is to be SEEN, turned into what is drawn to get
// it. On the light page every channel flipped, which the deep's negative
// flips back; on the dark page the lightness chosen so the page's own map
// lands it on the tone itself, the hue kept -- a channel flip there would come out
// the complement, the purples green.
//
// The deep's ramps are the abyss's, capped (config DEEP_GREY_RUNGS,
// DEEP_PURPLE_RUNGS): `GREYS[i]` is rung `i` of ABYSS_TONES as the deep
// draws it -- a grey rung the deep does not keep is the kept one under it,
// so nothing is lifted into the white the kits and bodies wear -- and
// `PURPLES[i]` the nearest kept purple, its foot still the black. A drawer
// that steps down a ramp by index stays on the six greys and five purples
// whatever step it takes.
//
// A leaf of its own, so the kits (deep/kits.js) and the scales can name the
// deep's tones without importing the deep's whole drawing, which imports
// them back.

import { ABYSS_TONES, ABYSS_MAGIC_TONES, DEEP_GREY_RUNGS, DEEP_PURPLE_RUNGS, DEEP_GREY, DEEP_PURPLE,
         DEEP_BREATH } from '../config.js';
import { darkPage, landed, raw } from '../ink.js';

const xor = h => '#' + (0xffffff ^ parseInt(h.slice(1), 16)).toString(16).padStart(6, '0');
export const seen = darkPage ? landed : xor;

const WHITE = ABYSS_TONES.length - 1;
const greyRung = i => (i >= WHITE ? WHITE : Math.max(...DEEP_GREY_RUNGS.filter(k => k <= i)));
const purpleRung = i => (i <= 0 ? 0
  : DEEP_PURPLE_RUNGS.reduce((b, k) => (Math.abs(k - i) < Math.abs(b - i) ? k : b), DEEP_PURPLE_RUNGS[0]));
export const GREY_RUNG = ABYSS_TONES.map((_, i) => greyRung(i));
export const PURPLE_RUNG = ABYSS_MAGIC_TONES.map((_, i) => purpleRung(i));

export const GREYS = GREY_RUNG.map(k => seen(ABYSS_TONES[k]));         // the deep's grey ramp, black to white as seen
export const PURPLES = PURPLE_RUNG.map(k => seen(ABYSS_MAGIC_TONES[k])); // and its purple one

// Each role's tone as drawn (config DEEP_GREY, DEEP_PURPLE).
export const TONE = Object.fromEntries(Object.entries(DEEP_GREY).map(([k, i]) => [k, GREYS[i]]));
// On the dark page the darkest the page's map reaches is its own paper, a
// charcoal; the water and a hole in it are written raw so the deep is as
// black there as on the light page.
if (darkPage) TONE.water = TONE.hole = raw('#000');
export const LIGHT = Object.fromEntries(Object.entries(DEEP_PURPLE).map(([k, i]) => [k, PURPLES[i]]));

// Every color the deep may draw, as seen: the kept rungs and white. The
// scales' coin colors are the yard's own and are not listed here.
export const DEEP_SEEN_GREYS = [...DEEP_GREY_RUNGS.map(k => ABYSS_TONES[k]), ABYSS_TONES[WHITE]];
export const DEEP_SEEN = [...DEEP_SEEN_GREYS, ...DEEP_PURPLE_RUNGS.map(k => ABYSS_MAGIC_TONES[k])];

// A tone `n` rungs further down its own ramp, folded onto the kept ones and
// never under the faintest mark the water still shows (the ground's grey,
// the dimmest purple): a thing dimmed in the deep is a fainter mark, never a
// hole in the water. A tone on neither ramp is left as it is.
const RUNG_OF = new Map();
GREYS.forEach((c, i) => RUNG_OF.set(c, ['g', GREY_RUNG[i]]));
PURPLES.forEach((c, i) => { if (i && !RUNG_OF.has(c)) RUNG_OF.set(c, ['p', PURPLE_RUNG[i]]); });
export const greyAt = i => GREYS[Math.max(DEEP_GREY.ground, Math.min(WHITE, i))];
export const purpleAt = i => PURPLES[Math.max(DEEP_PURPLE.dim, Math.min(PURPLES.length - 1, i))];
export function dimmed(c, n) {
  const r = RUNG_OF.get(c);
  if (!r) return c;
  return r[0] === 'g' ? greyAt(r[1] - n) : purpleAt(r[1] - n);
}

// The light along every built top edge, as a rung of the purple ramp. It
// holds still: a station's purple does not change with time.
export const breathAt = () => DEEP_BREATH.rung;

// The abyss's whole ramps, turned: for the yard's rift, which draws them
// all (render/riftlife.js).
export const ABYSS_SEEN = ABYSS_TONES.map(seen);
export const ABYSS_MAGIC_SEEN = ABYSS_MAGIC_TONES.map(seen);
