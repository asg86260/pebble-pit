// --- act 3: the crowds, God and the camera (track C) ------------------------------
// The round 3 mock (docs/mocks/act3-crowd-2026-10-18, the main option),
// approved by the owner 2026-10-18 ("lets build it. we can refine later"),
// with our crowd on the left and the glare dimming added the same day.
// Every number the mock gives is the mock's; the rest are defaults.
import { P } from './yard.js';

// --- the near rows -----------------------------------------------------------------
// The front row is the sim's first rank, a body P * 3 square on the floor.
// Behind it, nine rows shrinking with distance, each a row of souls of that
// size, holding this many of the sim's ranks (two ranks in one row stand half
// a file apart, so a small row is as dense as the mock's).
export const CROWD_FRONT_BODY = P * 3;
export const CROWD_NEAR_SIZES = [14, 11, 9, 8, 7, 6, 6, 5, 5];
export const CROWD_NEAR_RANKS = [1, 1, 2, 2, 2, 2, 2, 2, 2];
export const CROWD_NEAR_RATE = [0.95, 0.62];   // the first near row's parallax and the last's
export const CROWD_NEAR_LIFT = 2;              // px between the front row's heads and the first near row
export const CROWD_RIM = 2;                    // a near soul's rim, px
export const CROWD_RIM_FROM = 6;               // a soul this size or more is a rim; smaller, a filled square
export const CROWD_PIECES_FROM = 12;           // ...and this size or more inks a piece at a time
export const CROWD_NEAR_TONES = [[3, 3, 2], [2, 2, 3]];   // a pale soul's rim, rows of 8 px and up, then smaller
export const CROWD_FRONT_TONES = [3, 3, 4];
// How fast the drawing catches the sim: rim pieces a second, and visual ranks
// a second a soul steps forward into a hole a member left.
export const CROWD_INK_FADE = 2;
export const CROWD_STEP_UP = 1.5;

// --- the mass ------------------------------------------------------------------------
// Three flat bands behind the near rows, nearest first: parallax rate, cell
// px, rows of cells at full depth, its grey and the step-off grey a patch of
// its cells take. Every band's foot is the top of the near rows (worked out
// in render/aftercrowd.js), so a band's end slopes down to the rows rather
// than floating over paper, and no near soul is drawn over a band.
export const CROWD_BANDS = [
  { rate: 0.55, cell: 4, rows: 7, tone: 3, alt: 2 },
  { rate: 0.42, cell: 3, rows: 16, tone: 2, alt: 1 },
  { rate: 0.3, cell: 2, rows: 36, tone: 1, alt: 0 },
];
// The step-off grey in soft patches where a slow noise runs over this, never
// a single cell (the mock's sixth of single cells, both ways, read as speckle).
export const CROWD_MASS_ALT = 0.78;
export const CROWD_MASS_ALT_GRAIN = [0.3, 0.45];   // the patches' noise, a cell across and down
export const CROWD_MASS_HEADS = 0.55;    // share of columns with a head over the band's top, in runs
export const CROWD_MASS_TAPER = 14;      // columns at each end of a band that ease down to its foot
export const CROWD_MASS_STEP_S = 4;      // a band's picture taken again this often, crossfaded over the same
export const CROWD_MASS_READ_S = 0.5;    // the crowd's counts read again at most this often
// Ink clumps: a band's cell is inked where a slow noise falls under the
// share won there: the inked rim pieces of the souls it stands for, and the
// share of the whole crowd walked out.
export const CROWD_INK_LOCAL = 0.6;
export const CROWD_INK_WON = 0.7;
export const CROWD_CLUMP = [10, 7];      // the clumps' coarse grid, cells across and down: a clump a square at most
export const CROWD_CLUMP_K = 2.5;        // a square's chance of a clump, a share won
export const CROWD_CLUMP_R = [2, 3.2];   // a clump's half-width, cells, smallest and largest
export const CROWD_CLUMP_TALL = 0.8;     // a clump's height, a share of its width
export const CROWD_CLUMP_LEAST = 10;     // cells: any ink smaller is a fleck and is not drawn

// --- our crowd -------------------------------------------------------------------------
// The members who have walked out, behind the camp, from the grove's edge to
// the pedestal: the same rows and bands, filling front to back from the end
// nearest God's yard. The mass is full when the strike's share has arrived.
export const OURS_X0 = P * 14;
// Our mass's ink clumps (every one of ours is a member), and our back near
// row's ink, a share of the front's: ours is palest furthest and meets our
// mass in its own grey.
export const OURS_INK = 0.15;

// --- God -------------------------------------------------------------------------------
// Far off on the horizon, on the slowest layer, still taller than the crowd.
// A placeholder figure, as in the mock: every offset is off God's middle and
// the cloud floor, world px.
export const GOD_RATE = 0.2;
export const GOD_HORIZON_UP = 150;
// From the camp and the crowd's front God stands this much of his size on
// the horizon, and shows this strongly; both grow to whole across the pan
// (view.js, `godScaleAt`), so he looms only once the camera has walked to him.
export const GOD_FAR = 0.45;
export const GOD_FAR_ALPHA = 0.6;
export const GOD_THRONE = { w: 120, top: 450, h: 172 };         // the throne's back
export const GOD_SEAT = { w: 148, up: 284, h: 14 };
export const GOD_FACE = { w: 96, up: 384, eye: 10, eyeAt: [-26, 16], eyeUp: 352 };
export const GOD_CROWN = { up: 406, prongs: 3, prong: [12, 16], band: [88, 8] };
export const GOD_HAZE_TONE = 5;          // God and the throne far off; the ink fades in over it as the camera arrives
export const GOD_GLARE = { up: 370, r0: 116, r1: [136, 162], rays: 16, tone: 2, pulse: 1.1 };
// The cloud switchback up to the seat: three billow ledges (left, right, up)
// and the flights between, and the tithe carriers climbing it.
export const GOD_LEDGES = [[-176, -26, 184], [-4, 154, 218], [-98, 98, 252]];
export const GOD_FLIGHTS = [[-236, 150, -172, 184], [-40, 184, 6, 218], [140, 218, 96, 252]];
export const GOD_TITHE_PATH = [[-250, 150], [-236, 150], [-172, 184], [-40, 184], [6, 218], [140, 218], [96, 252], [70, 252]];
export const GOD_CARRIERS = 6;
export const GOD_CARRIER_LAP_S = 40;

// --- the camera ------------------------------------------------------------------------
// The act-3 camera zooms as it pans from the crowd's front toward God: near
// 1x through the crowd, then a dive at the far end, the cube of an ease, to
// this; and lifts toward the top of the throne as it does, that point drawn
// to this share of the window's height.
export const AFTER_ZOOM_MAX = 2.4;
export const AFTER_FOCUS_UP = 420;
export const AFTER_FOCUS_AT = 0.38;
