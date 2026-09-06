import { P } from './yard.js';

// --- the offer aura (wave7-ui, feedback7 item 4) ------------------------------
// A station with something affordable on its board breathes: a dashed white
// outline around the building, pulsing in and out. The numbers are here so the
// drawing (src/render/aura.js) has none of its own.
export const AURA_CYCLE_MS = 1600;   // one full breath, out and back
export const AURA_DASH = 4;          // the dash and its gap, in px
export const AURA_MARCH = 6;         // px/s the dashes crawl along the outline
export const AURA_IN = 2;            // how far inside the walls the breath starts
export const AURA_BREATH = 4;        // and how far past them it swells before dissolving

// --- assignment by hand (wave7b-assign, feedback7 item 16) --------------------
// How far past a station's own ground a held body may be dropped and still mean
// that station. A body is a bigger thing than a cursor; a drop that has to land
// on the doorway to the pixel is a control nobody hits twice.
export const ASSIGN_PAD = P * 2;     // on every side of the stand rect
