// --- how the deep is drawn: its sky, its motes, the serpent, the weapons, the glide ---
// Owned by track RENDER of docs/wave-serpent.md. Every number the track needs
// lives here; a magic number in a module is a bug.
import { P } from './yard.js';

// --- the view, and the glide between the two halves -----------------------------
// The glide is one clock: the camera closes on the surface over the first
// half, the frame is black at the middle and the camera is moved there, and
// the other half opens out of its own side of the surface over the second.
export let VIEW_GLIDE_S = 1.8;       // the whole glide, down or up
export const VIEW_GLIDE_ZOOM = 3;    // how far in the camera has pulled at the black, times the view's own
// The deep is framed whole: a window too short to hold it from the floor to
// the underside of the surface is pulled back until it does, so the way home
// is always on the screen. This much of the roof shows over the ceiling.
export const DEEP_ROOF = P * 4;
// The floor kept up off the window's foot, with the deep's roster in the band
// under it: a station stood on the very edge of the glass, under its own
// plus and minus, was hard to find.
export const DEEP_FLOOR_MARGIN = P * 12;
export const DEEP_POST_DOWN = P * 5;   // the roster's posts, this far under the floor
// The stations are drawn at twice their sprites' cells, each under a lit
// dome: at one cell a cell they were lost against the water and the bed.
// The dome stands DOME_PAD out from the sprite either side, its walls rise to
// DOME_WALL over the sprite's top, and the arch is a half circle over that.
export const STATION_SCALE = 2;
export const DOME_PAD = P * 3;
export const DOME_WALL = P * 4;
// The crusher's rollers, as seen through its window, and how near the brim
// the floor's bed has to lie for the pile-full mark to hang over it.
export const CRUSHER_ROLLER = P * 4;
export const CRUSHER_BRIM = 4;       // rows short of the bed's top
// The band at the top of the deep a click goes up through: the underside of
// the surface, and the roof over it.
export const DEEP_CEILING = P * 14;
// Where the underside of the surface stands, under the deep's top edge, and
// how far it breathes (the same swell the drowned pit's surface has).
export const DEEP_SURFACE = P * 7;
// The shaft's light: the yard showing through where the pit opens, as wide
// as a body going down it, and how far its spill reaches into the water.
export const SHAFT_LIGHT_W = P * 5;
export const SHAFT_SPILL = P * 36;
// From the yard, how far under the surface a click still means "go down":
// the liquid's own top few cells, not the plank over it.
export const SURFACE_CLICK = P * 6;

// --- the water ---------------------------------------------------------------------
// The flowing interference the drowned pit already draws, everywhere, and
// fainter: the deep is lit by one shaft, so its smoke never reaches the
// brighter rungs the pit's surface lets its veils climb to.
export const DEEP_VEIL_LIT = 0.22;   // how far up the grey ramp the veils get
export const DEEP_VEIL_DEEP = 0.14;  // and how much further toward the floor
export const DEEP_STAR_EVERY = 61;   // one cell in this many carries a breathing star
export const DEEP_STAR_TOP = 6;      // and it never climbs past this rung of its ramp

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
export const COIL_TAIL = 0.3;        // the tail's width, as a share of the body's
export const HEAD_SEGS = 3;          // segments of head, thicker than the neck
export const HEAD_PLUS = P * 2;      // and how much thicker
export const WARD_MS = 2600;         // one pass of the ward's shimmer along the scales
export const WARD_AT = 0.55;         // how much of the shimmer's wave is lit
export const SPLIT_GAP = P * 3;      // the open water between two lengths of a split coil
export const SPLIT_WRITHE = P * 3;   // how far each length throws itself on its own
export const SPLIT_WRITHE_MS = 1900; // and how fast
export const FADE_SEEN = 0.25;       // stage four: how much of the coil is seen where no beam lights it
export const BEAM_LIGHTS = 5;        // segments either side of a beam's touch it lights
export const WOUND_GAP = P * 6;      // the wound, wide open: a body's width and a cell of water each side
export const BOUND_BANDS = 3;        // bands of sigil across a held length of coil

// --- the weapons -------------------------------------------------------------------
export const LANCE_LEN = P * 8;      // a lance of black water
export const RING_CELLS = 28;        // cells round a burst's ring, at its widest
export const BEAM_MS = 700;          // one crest travelling the length of a beam
export const BEAM_WAVE = 0.35;       // radians of the beam's interference a cell
export const SIGIL_RX = P * 7;       // a sigil on the floor, across
export const SIGIL_RY = P * 2;       // and seen edge-on
export const STAR_TAIL = 7;          // cells of the called star's tail
export const PUNCH_MS = 260;         // a brawler's fist out and back

// --- swimmers ----------------------------------------------------------------------
// A body in the deep swims rather than walks: the same square, bobbing on
// its own tempo and kicking behind it.
export const SWIM_BOB = 3;           // px up and down, never more than half a cell
export const SWIM_BOB_MS = 1100;
export const SWIM_KICK_MS = 420;

// --- the snatch, from the yard -----------------------------------------------------
// The serpent's head and neck rising out of the drowned pit at the shaft.
export const SNATCH_HEAD_W = P * 16;
export const SNATCH_HEAD_H = P * 9;
export const SNATCH_NECK_W = P * 7;

export const DEEP_DRAW_KNOBS = [
  { key: 'VIEW_GLIDE_S', label: 'deep glide, s', min: 0.2, max: 5, step: 0.1,
    get: () => VIEW_GLIDE_S, set: v => { VIEW_GLIDE_S = v; } }
];
