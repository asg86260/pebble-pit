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
// The deep drawn unseen while the yard is idle, so the ripple's first frames
// are not the deep's first (render/ripple.js): the first two runs of the
// coil's code are three and five times the settled one's, the third near it.
export const RIPPLE_WARM_PASSES = 3;
export const RIPPLE_WARM_WAIT_MS = 1000; // the longest a pass waits for an idle moment
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
// The crusher's fire (docs/mocks/crusher-fire-2026-09-24.html, option C):
// the door's inside is one heat field. A cell's heat is the base, raised by
// the breath and by the scales going in, less CRUSH_FIRE.rise a row up from
// the door's foot and CRUSH_FIRE.side times the square of its distance from
// the door's middle, stirred by CRUSH_STIR; it paints white over `white`,
// the palest grey over `grey`, the purple ramp's rung `rampAt + v * rampPer`
// under that, and nothing under `dark`. The stir climbs `climb` rows a
// second. Times in seconds.
export const CRUSH_FIRE = {
  breathS: 1.4, base: 4.6, breath: 1.1, heat: 2, rise: 0.62, side: 0.16,
  stir: 0.9, climb: 2.2, dark: 0.4, white: 5.3, grey: 4.6, rampAt: 5, rampPer: 1.45
};
// The stir: two sine waves summed and halved, the first bent by a third.
// sin(col * a.col + t * a.t + sin(row * bend.row - t * bend.t) * bend.amp)
// + sin(row * b.row + t * b.t + col * b.col).
export const CRUSH_STIR = {
  a: { col: 1.9, t: 3.1 }, bend: { row: 0.7, t: 1.3, amp: 1.5 }, b: { row: 1.3, t: 5.3, col: 0.6 }
};
// How warm the scales going in make it: each one adds `each`, swelling in
// over `swellS` and easing back over `easeS`, summed and bent under one
// (1 - e^-sum). A landing older than `keepS` is forgotten.
export const CRUSH_HEAT = { each: 0.3, swellS: 0.22, easeS: 1.0, keepS: 5 };
export const CRUSH_HEAT_KEEP = 32;     // landings kept at most, however fast they come
// Each scale spits CRUSH_SPARKS sparks out of the door, one each way, that
// fly CRUSH_SPARK_MS: `up` rows over the door's foot, out `out` cells plus
// `speed` (and up to `spread` more) across the flight, up `rise` and down
// `fall` on a parabola, onto the floor at the drawing's foot. White for the
// first `whiteFor` of the flight, the top of the purple ramp until
// `coolAfter`, then `cool` rungs down it for every whole flight after.
export const CRUSH_SPARKS = 2;
export const CRUSH_SPARK_MS = 1000;
export const CRUSH_SPARK = { up: 2, out: 1, speed: 5, spread: 4, rise: 9, fall: 12,
                             whiteFor: 0.1, coolAfter: 0.5, cool: 20 };
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
// shed off the serpent. A kind is its tones (dark to
// light, as they will be seen on the black) and an `ink`, the weight it is
// drawn at. Motes are drawing only (render/deep.js steps them).
export const DEEP_MOTE_TINTS = {
  silt:  { tones: ['#26262c', '#333339', '#42424a', '#55555e'], ink: 0.8 },
  fleck: { tones: ['#8b8b96', '#b4b4c0', '#6e6e78', '#9b9ba6'], ink: 1 }
};
export const DEEP_SILT = 150;        // silt motes hanging in a window of the deep
export const DEEP_SILT_SINK = 0.04;  // px a frame the silt settles, against the current's push
export const DEEP_FLECK_EVERY = 0.35; // seconds between flecks off a swaying coil
export const DEEP_FLECK_LIFE = 7;    // seconds a fleck drifts before it is gone
export const DEEP_MOTES_MAX = 400;   // however much is going on

// --- the serpent -------------------------------------------------------------------
export const WARD_MS = 2600;         // one pass of the ward's shimmer along the scales
export const WARD_AT = 0.55;         // how much of the shimmer's wave is lit
// Splitting: the coil stays whole and thrashes, a ripple a length running
// down it on top of the sway. place.js lays it into the centerline, so a
// click, a lance and a ring all land on the body as drawn.
export const SPLIT_WRITHE = P * 3;   // how far the thrash throws the body
export const SPLIT_WRITHE_MS = 1900; // and how fast a ripple runs
export const WOUND_GAP = P * 6;      // the wound, wide open: a body's width and a cell of water each side
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

// A blow lands (DESIGN.md, "Blows land: the burst and the stun", option C of
// docs/mocks/serpent-impact-2026-09-26.html). How big a blow is, 0..1, is
// read off what it did on a log scale -- a punch of one is nothing, a star is
// all of it -- and the bite and the spray both grow with that one number.
export const BLOW_FULL = 3000;       // the damage a blow is at its biggest from: a first star
// The bite: a hole of cells in the hide where a single blow landed, on the
// edge the blow came from, closing over CHIP_HEAL_S. A few of its cells are
// left standing so its edge is ragged.
export const CHIP_R = [1, 4.5];    // its radius in cells, the least blow and the biggest
export const CHIP_HEAL_S = 3;        // seconds it takes to close
export const CHIP_RAGGED = 0.2;      // the share of its cells left standing
export const CHIPS_MAX = 24;         // bites kept at once, however fast they come
// The spray: the scales a blow knocks loose leave the bitten edge outward,
// at SCALE_KICK and up to SPRAY_GAIN times more for the biggest blow, across
// SPRAY_FAN radians either side of straight out.
export const SPRAY_GAIN = 2.5;
export const SPRAY_FAN = 1.1;
// A stunned coil holds still, and a flat ring of cells stands over its head
// (the owner's call, 2026-09-27, off the class bench): one bright cell runs
// round it with a short tail fading behind, over a dim ring. The cells are
// offsets in cells from the ring's middle, in the order the bright one runs.
export const STUN_RING = [[-2, 0], [-1, -1], [0, -1], [1, -1], [2, 0], [1, 1], [0, 1], [-1, 1]];
export const STUN_RING_UP = 6;       // cells from the head's top edge up to the ring's middle, clear of the crest
export const STUN_RING_BACK = 1;     // and cells back along the body from the head's segment
export const STUN_RING_STEP_MS = 70; // the bright cell moves on a cell this often
// The tones, as rungs down from the ramp's white: the bright cell, its tail
// behind it, and the rest of the ring.
export const STUN_RING_TONES = [0, 1, 2];
export const STUN_RING_DIM = 4;

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

// --- reading the fight: the numbers off the hits and the heal ----------------------
// DESIGN.md, "Reading the fight" (the owner's font, option 4: carved). Drawn in
// screen pixels, not on the P grid, so they stay one size however the camera
// is zoomed. A glyph is four font pixels by six, NUM_FONT_PX screen pixels a
// font pixel, one font pixel between glyphs, with its drop line one font pixel
// under it.
export const NUM_FONT = {
  '0': ['.##.', '#..#', '#..#', '#..#', '#..#', '.##.'],
  '1': ['.#..', '##..', '.#..', '.#..', '.#..', '###.'],
  '2': ['.##.', '#..#', '..#.', '.#..', '#...', '####'],
  '3': ['###.', '...#', '.##.', '...#', '...#', '###.'],
  '4': ['#..#', '#..#', '####', '...#', '...#', '...#'],
  '5': ['####', '#...', '###.', '...#', '...#', '###.'],
  '6': ['.##.', '#...', '###.', '#..#', '#..#', '.##.'],
  '7': ['####', '...#', '..#.', '.#..', '.#..', '.#..'],
  '8': ['.##.', '#..#', '.##.', '#..#', '#..#', '.##.'],
  '9': ['.##.', '#..#', '#..#', '.###', '...#', '.##.'],
  '+': ['....', '.#..', '###.', '.#..', '....', '....']
};
export const NUM_FONT_PX = 2;        // screen pixels a font pixel
// The tones as seen, after the deep's negative: the numbers are drawn over
// the finished deep, not turned over with it.
export const NUM_FACE = '#ffffff';   // a blow: white
export const NUM_DROP = '#42424a';   // on a grey drop line
export const NUM_HEAL = '#9b5de5';   // the heal: the abyss's purple
export const NUM_HEAL_DROP = '#2d1d47'; // on a dark purple drop
export const NUM_LIFE_S = 1.3;       // a blow's number, in and out
export const NUM_HEAL_LIFE_S = 1.6;  // the heal's, a little longer
export const NUM_IN_S = 0.12;        // faded in over this; out over the last half of its life
export const NUM_STEPS = 8;          // the fade in whole steps of opacity: never a jump bigger than one
export const NUM_RISE = 14;          // screen pixels a second a number climbs
export const NUM_LIFT = 6;           // screen pixels over the coil's top edge it starts
export const NUM_JITTER = 6;         // screen pixels either way a blow's number is set off its hit
export const NUM_HEAL_SIDE = 14;     // screen pixels either side of the belly the heal alternates
export const NUM_HEAL_DROP_BY = 22;  // and under the coil's bottom edge it starts
// What the sim keeps for them (deep/serpent.js): a weapon that hurts while it
// is held (the lance, the beam) says its sum once this often, a body at a
// time; the heal says what it actually closed once this often.
export const NUM_HELD_S = 1;
export const NUM_HEAL_EVERY_S = 1;
// Blows of one kind landing this near each other before the last one's number
// has risen clear of its own height are summed into it: three brawlers
// swinging as one, or one swinging faster than its numbers climb, print a
// running sum and not a smear of digits over digits.
export const NUM_FOLD_S = (NUM_FONT['0'].length + 1) * NUM_FONT_PX / NUM_RISE;
export const NUM_FOLD_R = P * 4;

// --- the serpent's bar: what is left of the defense up -------------------------------
// DESIGN.md, "The serpent's bar" (option B of four mocked). In screen pixels,
// top-center of the glass, like the counter: full at a closed wound, empty at
// the break. Tones as seen, over the finished deep.
export const BAR_W = 240;              // screen pixels, the bar's length
export const BAR_H = 8;                // and its height
export const BAR_TOP = 12;             // from the top of the glass
export const BAR_PIP = 8;              // a defense's pip, square, after the bar
export const BAR_PIP_GAP = 6;          // between the bar and a pip, and pip to pip
export const BAR_EDGE = '#8b8b96';     // a one-pixel rim round the bar and each pip
export const BAR_TRACK = '#000000';    // the empty of it
export const BAR_LEFT = '#ffffff';     // what the defense has left
export const BAR_TRAIL = '#55555e';    // what a blow just took, lingering
export const BAR_HEALED = '#9b5de5';   // what the heal has given back since the last blow
export const BAR_TO_COME = '#55555e';  // a defense not yet reached
export const BAR_STUN = '#9b5de5';     // the defense's pip while a stun has stopped the heal: a ring of the heal's purple
export const BAR_STUN_RIM = 2;         // screen pixels, the ring's width
export const BAR_TRAIL_HOLD_S = 0.5;  // the trail waits this long after the last blow
export const BAR_TRAIL_RATE = 1;       // then drains at this share of the bar a second

// --- track RENDER of docs/wave-party.md: the fighters, their kits and attacks ---------
// The kit growth page's feel (docs/mocks/kit-growth-2026-09-27.html, all three
// passes on). Each class's own turn -- when its blows land, how far a fist
// winds back -- is its table in render/attacks.js, as the page wrote it; the
// numbers every class shares are here.
export const DRAW_POSE = 0.08;       // s, one held pose of the classic pass round a contact
export const DRAW_KEY_EX = 1.7;      // how far the classic pass pushes a key pose (a wind-up, a pull back)
export const DRAW_HOLDS = 2;         // poses a contact holds the fighter (the hit-pause)
export const DRAW_HAY_HOLDS = 3;     // and the Haymaker's: the fist held a pose alone, then the star (the owner's C)
export const DRAW_NEAR_BEAT = 0.32;  // s either side of a beat the clock steps in poses; smooth further off
// A move straight after another begins from the fight's stance when the two
// contacts are closer than DRAW_ROOM_S; further apart, from a standing start.
// A fighter with no move due for DRAW_LOWER_S lowers what it holds up (the
// Ranger's bow). A shot's landing -- its ring, its blast, the stuck arrow --
// is drawn for LAND_FX_S at the most.
export const DRAW_ROOM_S = 3;
export const DRAW_LOWER_S = 2;
export const LAND_FX_S = 1.3;
// Between two moves a fighter sways a cell forward and back, IDLE_STEP_S a
// step, and a melee fighter hops a cell for IDLE_HOP_S as each step lands
// (the owner's G, docs/mocks/idle-2026-09-28.html). It starts IDLE_SETTLE_S
// after the follow-through has settled.
export const IDLE_STEP_S = 0.8;
export const IDLE_HOP_S = 0.16;
export const IDLE_SETTLE_S = 0.35;
// The recoil after a heavy contact, in cells: [the contact's size from, cells].
export const DRAW_KICK = [[1.2, 2], [0.7, 1.5], [0.45, 0.75]];
// The still cells of a kit are one sprite a class and a rung, painted in a
// box this many cells round the body's top-left corner (deep/kits.js).
export const KIT_BOX = { left: 6, top: 7, w: 16, h: 11 };
export const MOTE_PERIOD = 2.2;      // s a rung-8 mote takes to drift off a kit
export const MOTE_RISE = 3;          // and cells it rises
// The coil's give under a contact (render/serpent.js): pushed up over
// DENT_RISE_S, springing back at DENT_DECAY an s, gone by DENT_S. Its width
// and depth in cells are [base, per unit of the blow's size].
export const DENT_S = 0.6;
export const DENT_RISE_S = 0.05;
export const DENT_DECAY = 9;
export const DENT_W = [1.2, 2];
export const DENT_DEPTH = [0.5, 1.6];
// The statuses on the whole serpent (the class bench's painters).
export const BLEED_DRIPS = 9;        // columns Bleeding drips off
export const BLEED_DRIP_S = 1.25;    // s a drop takes to fall its four cells
export const HELD_EVERY = 11;        // columns between Held's bands
export const HELD_BRIGHT_RUNG = 8;   // a Hexer this high edges the bands in white: Held takes more
export const EXPOSED_EVERY = 4;      // columns between Exposed's lifted scales
export const EXPOSED_LIFT_HZ = 1.5;  // how often a lifted scale lifts or settles
// The fang (docs/wave-party.md): a white fang of a few cells, point down,
// sinking and carried like a scale: a root three cells across narrowing to
// its point. '#' white, '+' a grey a step down.
export const FANG_SPRITE = ['###', '.#+', '.#.'];
// Its mark on the counter card and the build button is FANG_MARK (config/deepboard.js).
// The scaffold over a station not yet built: posts this many bands tall,
// the tape at head height.
export const SCAFFOLD_BANDS = 5;
