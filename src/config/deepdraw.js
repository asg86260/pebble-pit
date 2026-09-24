// --- how the deep is drawn: its sky, its motes, the serpent, the weapons, the glide ---
// Owned by track RENDER of docs/wave-serpent.md. Every number the track needs
// lives here; a magic number in a module is a bug.
import { P } from './yard.js';

// --- the view, and the glide between the two halves -----------------------------
// The glide is one clock: a ripple out of the wizards' portal that the deep
// is drawn inside, the camera still (view.js).
export let VIEW_GLIDE_S = 1.3;       // the whole glide, down or up
export const RIPPLE_RINGS = 4;       // rings in the ripple out of the portal, the leading one brightest
export const RIPPLE_GAP = 3;         // cells between one ring and the next
// The floor kept up off the window's foot, with the deep's roster in the band
// under it: a station stood on the very edge of the glass, under its own
// plus and minus, was hard to find.
export const DEEP_FLOOR_MARGIN = P * 9;
export const DEEP_POST_DOWN = P * 5;   // the roster's posts, this far under the floor
// The stations are drawn cell for cell off their sprites, each under a lit
// dome. The dome stands DOME_PAD out from the drawing either side, its walls
// rise to DOME_WALL over the drawing's top, and the arch is a half circle
// over that.
export const DOME_PAD = P * 4;
export const DOME_WALL = P * 4;
// The crusher's rollers, as seen through its window.
export const CRUSHER_ROLLER = P * 4;
// Where the water line stands, under the deep's top edge, and how far it
// breathes (the same swell the drowned pit's surface has).
export const DEEP_SURFACE = P * 5;
// How far into the abyss's field the deep's water is seen, all of it: the
// field's own depth, which fades toward the pit's surface, is lifted by this
// (render/abyssfield.js), so the deep reads as deep from the window's top
// edge to its floor, however tall the window.
export const DEEP_WATER_DEPTH = 1;
// The arrow that says the view goes through (render/shaftway.js): in the
// yard in the liquid this far right of the torn portal's lip, level with its
// middle, pointing left at it and bobbing toward it and back; in the deep
// this far under the bottom of the deep's own end, pointing up into it and
// bobbing up and down -- a cell each way (SHAFT_ARROW_BOB) over SHAFT_ARROW_MS.
export const SHAFT_ARROW_SIDE = P * 3;
export const SHAFT_ARROW_DOWN = P * 2;
// The deep's end of the portal, the way back up: a circle hanging in the
// water, its top this far under the highest the deep's framing ever shows
// (view.js, `deepZoom`), so it is on the glass whatever the window. Across,
// it hangs this fraction of DEEP_W in from the deep's left end -- its middle,
// so the camera that opens on it (view.js) shows it in the middle of the
// window however much of the deep the window holds (the owner's call).
export const DEEP_PORTAL_R = P * 15;
export const DEEP_PORTAL_DOWN = P;
export const DEEP_PORTAL_AT = 0.5;
export const SHAFT_ARROW_BOB = P;
export const SHAFT_ARROW_MS = 1600;

// --- the water ---------------------------------------------------------------------
// The drowned pit's own liquid, carried on under its surface, with the pit's
// numbers (config/rift.js, ABYSS_*): one liquid, so the glide between the
// halves hands over on one picture (render/abyssfield.js).

// --- its motes ---------------------------------------------------------------------
// The deep's own kinds, the way the sky's are SMOG_TINTS: silt hanging, flecks
// shed off the serpent, the churn off a burst. A kind is its tones (dark to
// light, as they will be seen on the black) and an `ink`, the weight it is
// drawn at. Motes are drawing only (render/deep.js steps them).
export const DEEP_MOTE_TINTS = {
  silt:  { tones: ['#26262c', '#333339', '#42424a', '#55555e'], ink: 0.8 },
  fleck: { tones: ['#8b8b96', '#b4b4c0', '#6e6e78', '#9b9ba6'], ink: 1 },
  churn: { tones: ['#5c2ba6', '#6a2fbe', '#4e2090', '#9b5de5'], ink: 1 }
};
export const DEEP_SILT = 150;        // silt motes hanging in a window of the deep
export const DEEP_SILT_SINK = 0.04;  // px a frame the silt settles, against the current's push
export const DEEP_FLECK_EVERY = 0.35; // seconds between flecks off a swaying coil
export const DEEP_FLECK_LIFE = 7;    // seconds a fleck drifts before it is gone
export const DEEP_CHURN = 22;        // motes thrown off a burst
export const DEEP_CHURN_LIFE = 2.5;  // seconds they churn
export const DEEP_MOTES_MAX = 400;   // however much is going on

// --- the serpent -------------------------------------------------------------------
export const WARD_MS = 2600;         // one pass of the ward's shimmer along the scales
export const WARD_AT = 0.55;         // how much of the shimmer's wave is lit
// Splitting: the coil stays whole and thrashes, a ripple a length running
// down it on top of the sway. place.js lays it into the centerline, so a
// click, a lance and a ring all land on the body as drawn.
export const SPLIT_WRITHE = P * 3;   // how far the thrash throws the body
export const SPLIT_WRITHE_MS = 1900; // and how fast a ripple runs
export const FADE_SEEN = 0.25;       // stage four: how much of the coil is seen where no beam lights it
export const BEAM_LIGHTS = 5;        // segments either side of a beam's touch it lights
export const WOUND_GAP = P * 6;      // the wound, wide open: a body's width and a cell of water each side
export const BOUND_BANDS = 3;        // bands of sigil across a held length of coil
// The wound read on the body (DESIGN.md, "The serpent, redrawn").
export const CRACK_REACH = P * 34;   // how far the cracks run each way from the belly, at a wound about to break
export const COIL_STEP = P / 2;      // how finely the body is laid along its curve
// The head (the owner's pick of five mocked, 2026-09-23): a long snout, and a
// finned crest of the abyss's purple running back along the neck.
export const SNOUT = P * 6;          // the snout, run on past the head's segment
export const CREST_LEN = P * 34;     // how far back along the neck the crest runs
export const CREST_H = 3;            // its tallest spikes, in cells over the body
// The belly swells round the one it holds, a cage of ribs he is seen through.
export const BELLY_BULGE = P * 2;    // how much fuller than the body either side
export const BELLY_LEN = P * 8;      // half its length along the coil
export const RIB_EVERY = 3;          // cells between ribs

// --- the weapons -------------------------------------------------------------------
export const LANCE_LEN = P * 8;      // a lance of black water
export const RING_CELLS = 28;        // cells round a burst's ring, at its widest
export const BEAM_MS = 700;          // one crest travelling the length of a beam
export const BEAM_WAVE = 0.35;       // radians of the beam's interference a cell
export const SIGIL_RX = P * 7;       // a sigil on the floor, across
export const SIGIL_RY = P * 2;       // and seen edge-on
export const STAR_TAIL = 7;          // cells of the called star's tail
export const PUNCH_MS = 260;         // a brawler's fist out and back
// The scrap the invert filter is tried on before the frame is turned over
// with it (render/invert.js): big enough that Firefox puts it on the graphics
// card as it does the window (smaller, it is drawn in software, where the
// filter is a step off), and a side of cells for every channel value. The
// grit's turned-over patch (render/buildsites.js) is sized in the same steps,
// to stay on the card.
export const INVERT_PROBE = 256;
export const INVERT_PROBE_SIDE = 16;


// --- the snatch, from the yard -----------------------------------------------------
// The serpent's head and neck rising out of the drowned pit at the shaft.
export const SNATCH_HEAD_W = P * 16;
export const SNATCH_HEAD_H = P * 9;
export const SNATCH_NECK_W = P * 7;

export const DEEP_DRAW_KNOBS = [
  { key: 'VIEW_GLIDE_S', label: 'deep glide, s', min: 0.2, max: 5, step: 0.1,
    get: () => VIEW_GLIDE_S, set: v => { VIEW_GLIDE_S = v; } }
];
