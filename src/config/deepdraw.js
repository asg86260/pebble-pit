// --- how the deep is drawn: its sky, its motes, the serpent, the weapons, the glide ---
// Owned by track RENDER of docs/wave-serpent.md. Every number the track needs
// lives here; a magic number in a module is a bug.
import { msg } from '../lang.js';
import { P } from './yard.js';
import { PURPLE } from './palette.js';
import { ABYSS_TONES, ABYSS_MAGIC_TONES } from './rift.js';

// --- the deep's palette (the owner's B4, 2026-10-14) --------------------------------
// The deep draws from six greys and five purples and nothing else: every
// other rung of the abyss's two ramps (ABYSS_TONES, ABYSS_MAGIC_TONES), plus
// white for what is made or held -- the kits, the bodies, the serpent's
// hide, the fire's heart -- and the scales' own coin colors. A fade is
// opacity, an animation effect, and outside the cap: what is drawn at full
// ink holds to it.
// The browser's `deep palette` group (src/selftest/deeppalette.js) holds it
// there (docs/design-language/canvas.md, "The deep's palette").
export const DEEP_GREY_RUNGS = [0, 2, 4, 6, 8, 10];
export const DEEP_PURPLE_RUNGS = [3, 5, 7, 9, 11];
// What each is for, as a rung. The water is black (the owner, 2026-10-14:
// the deep read a little light), the same as a hole: the portal's mouth reads
// by its purple rim, the furnace's door by the stone round it.
export const DEEP_GREY = { hole: 0, water: 0, ground: 4, stone: 6, lit: 8, pale: 10, white: 11 };
export const DEEP_PURPLE = { dim: 3, low: 5, mid: 7, glow: 9, bright: 11 };
// The light from above along every top edge of what is built down there:
// these rungs in turn, each held this long.
export const DEEP_BREATH = { rungs: [DEEP_PURPLE.low, DEEP_PURPLE.mid, DEEP_PURPLE.glow, DEEP_PURPLE.mid], ms: 1100 };
// As seen, for what is drawn over the finished deep (the numbers, the bar,
// the statuses) and not turned over with it.
const seenGrey = k => ABYSS_TONES[DEEP_GREY[k]];
const seenPurple = k => ABYSS_MAGIC_TONES[DEEP_PURPLE[k]];

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
// A station is its fighter and a prop (deep/props.js): the prop's right-hand
// column stands PROP_GAP cells short of the fighter's body at its post, so a
// kit carried at the body's left (the Monk's beads) has water between it and
// the prop. The Swordsman carries his sword three cells off his body, so his
// rack stands two more off, lest the sword be read as the rack's third.
export const PROP_GAP = 5;
export const PROP_GAP_OF = { sword: 7 };
// Every station stands on a stepped stone plinth, prop and fighter together,
// off the floor (docs/mocks/station-platform-2026-09-28.html, B): this many
// cells high, a cell further out each course down, and reaching this many
// cells past the prop and the body at its top.
export const PLINTH_H = 2;
export const PLINTH_OVER = 1;
export const PLINTH_TONES = { top: DEEP_GREY.lit, body: DEEP_GREY.stone };   // flat, a rung each
// A low dome behind every built station (docs/mocks/station-backdrop-2026-09-28.html,
// B), so the bed of scales heaped on the floor sits behind it and a grey kit
// reads on dark: its walls rise DOME_WALL cells over the fighter's head
// before the arch springs, and it spans the station's ground and the widest
// kit held out from the fighter's middle (DOME_REACH: the rung-8 bow's tip
// and the hand on it), DOME_PAD cells more either side.
export const DOME_WALL = 2;
export const DOME_REACH = 6;
export const DOME_PAD = 1;
export const DOME_TONES = { wall: DEEP_GREY.ground, edge: DEEP_PURPLE.low };   // flat, its top edge lit
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
export const DEEP_PORTAL_DOWN = -P * 2;   // up two cells: its top on the surface, clear of the serpent's bar and still under the roof
export const DEEP_PORTAL_AT = 0.5;
export const SHAFT_ARROW_BOB = P;
export const SHAFT_ARROW_MS = 1600;

// --- the water ---------------------------------------------------------------------
// The drowned pit's own liquid, carried on under its surface, with the pit's
// numbers (config/rift.js, ABYSS_*): one liquid, so the glide between the
// halves hands over on one picture (render/abyssfield.js).

// --- its motes ---------------------------------------------------------------------
// The deep's own kinds, the way the sky's are SMOG_TINTS: silt hanging, flecks
// shed off the serpent. A kind is its rungs, dealt one a mote: the silt the
// purple light hanging in the water, the flecks the hide's greys. Motes are
// drawing only (render/deep.js steps them).
export const DEEP_MOTE_TINTS = {
  silt:  { tones: [DEEP_PURPLE.dim, DEEP_PURPLE.dim, DEEP_PURPLE.low, DEEP_PURPLE.low], purple: true },
  fleck: { tones: [DEEP_GREY.lit, DEEP_GREY.pale, DEEP_GREY.stone, DEEP_GREY.lit] }
};
// A chip off a builder's blows in the deep, fading out by opacity as it goes (render/buildsites.js).
export const DEEP_GRIT_RUNG = DEEP_PURPLE.mid;
export const DEEP_SILT = 75;         // silt motes hanging in a window of the deep
// The deep's stars, quieter than the pit's (the owner, 2026-10-14: the purple
// noise toned down, half, and dimmer): how many in sixteen show, and how many
// rungs each one's brightest is held under.
export const DEEP_STAR_THIN = 8;
export const DEEP_STAR_DIM = 2;
// How far, in cells, the serpent's true eye may drift off the cell it is
// drawn on before it moves: under a cell, so it holds through the head's sway
// instead of flipping between two cells (render/serpent.js).
export const SERPENT_EYE_HOLD = 0.8;
export const DEEP_SILT_SINK = 0.04;  // px a frame the silt settles, against the current's push
export const DEEP_FLECK_EVERY = 0.35; // seconds between flecks off a swaying coil
export const DEEP_FLECK_LIFE = 7;    // seconds a fleck drifts before it is gone
export const DEEP_MOTES_MAX = 400;   // however much is going on

// --- the serpent -------------------------------------------------------------------
export const WARD_MS = 2600;         // one pass of the ward's shimmer along the scales
export const WARD_AT = 0.55;         // how much of the shimmer's wave is lit
// The physical resist's plates (the owner's A, docs/mocks/serpent-resists-2026-09-29.html):
// a band across the hide every PLATE_EVERY cells along it, PLATE_W wide, its
// body PLATE_TONE rungs down from white and its top edge PLATE_EDGE. The
// coming resist flickers in at RESIST_FLICKER_HZ before the fading's switch.
export const PLATE_EVERY = 6;
export const PLATE_W = 2;
export const PLATE_TONE = 6;
export const PLATE_EDGE = 2;
export const RESIST_FLICKER_HZ = 4;
// The explosive resist is a barrier under the body, not a look on the hide:
// a row of floating cells BARRIER_GAP cells under the coil's underside, three
// lit of every BARRIER_EVERY, the middle one a cross. A bomb that it soaks up
// flares the cells under it white, then light purple, over BARRIER_FLARE_MS,
// BARRIER_FLARE_W cells either side.
export const BARRIER_GAP = 3;
export const BARRIER_EVERY = 4;
export const BARRIER_FLARE_MS = 900;
export const BARRIER_FLARE_W = 2;
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
// The deep's head on it (the owner's 2, docs/mocks/objectives-2026-09-30.html):
// it comes up out of the whirlpool with its mouth's middle on the one it
// takes (snatch.js, `jawAt`), the neck at the head's far end inside the ring;
// the jaws hinge SNATCH_HINGE cells back from the snout and part SNATCH_GAPE
// cells at the tip; the crest in the abyss's purples, as seen in the yard.
export const SNATCH_HINGE = 10;
export const SNATCH_GAPE = 4;
export const SNATCH_CREST = [PURPLE[10], PURPLE[12]];
export const SNATCH_HIDE = ['#000', '#1c1c21', '#26262c', '#6e6e78'];   // edge, hide, the lattice, the brow

export const DEEP_DRAW_KNOBS = [
  { key: 'VIEW_GLIDE_S', label: 'deep glide, s', min: 0.2, max: 5, step: 0.1,
    get: () => VIEW_GLIDE_S, set: v => { VIEW_GLIDE_S = v; } }
];

// --- reading the fight: the numbers off the hits and the heal ----------------------
// DESIGN.md, "Reading the fight" (the owner's font, option 4: carved). Drawn in
// screen pixels, not on the P grid, so they stay one size however the camera
// is zoomed. A glyph is six font pixels tall and as wide as its rows (a digit
// four, the m five, the point one), NUM_FONT_PX screen pixels a font pixel,
// one font pixel between glyphs but none before a NUM_FONT_TIGHT one, with its
// drop line one font pixel under it. The letters say a big number short, the
// yard's way (docs/mocks/deep-number-glyphs-2026-10-13.html, option A).
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
  '+': ['....', '.#..', '###.', '.#..', '....', '....'],
  'k': ['#...', '#...', '#.#.', '##..', '#.#.', '#..#'],
  'm': ['.....', '.....', '##.#.', '#.#.#', '#.#.#', '#.#.#'],
  'b': ['#...', '#...', '###.', '#..#', '#..#', '###.'],
  '.': ['.', '.', '.', '.', '.', '#'],
  // what a count can need besides: a negative, the yard's trillions (fmt's
  // 1t) and a language's decimal comma
  '-': ['...', '...', '###', '...', '...', '...'],
  't': ['.#..', '###.', '.#..', '.#..', '.#..', '..##'],
  ',': ['..', '..', '..', '..', '.#', '#.']
};
export const NUM_FONT_TIGHT = '.,';  // set against the glyph before, no gap
export const NUM_FONT_PX = 2;        // screen pixels a font pixel
// The tones as seen, after the deep's negative: the numbers are drawn over
// the finished deep, not turned over with it.
export const NUM_FACE = seenGrey('white');   // a blow: white
export const NUM_DROP = seenGrey('stone');   // on a grey drop line
export const NUM_LIFE_S = 1.3;       // a blow's number, in and out
export const NUM_HEAL_LIFE_S = 1.8;  // the heal's, a little longer
export const NUM_IN_S = 0.08;        // faded in over this
export const NUM_OUT = 0.4;          // and out over this share of its life, at the end
export const NUM_STEPS = 8;          // the fade in whole steps of opacity: never a jump bigger than one
export const NUM_LIFT = 2;           // screen pixels over the coil's top edge a blow's number leaves from
// A blow's number is knocked off the hide (docs/mocks/fight-numbers-2026-09-28.html,
// B): up and away from the hit, the side turn and turn about, on its own
// gravity, held a beat at the top of its arc, then dropping as it fades. A
// bigger blow (`blowK`, 0..1) flies higher and wider; past NUM_KICK_BIG it
// is a font pixel bigger and leaves held speed lines under it on the way up.
// Screen pixels, and screen pixels a second.
export const NUM_KICK_UP = 110;
export const NUM_KICK_UP_K = 40;
export const NUM_KICK_SIDE = 26;
export const NUM_KICK_SIDE_K = 20;
export const NUM_KICK_GRAV = 500;
export const NUM_KICK_HOLD_S = 0.14;
export const NUM_KICK_BIG = 0.5;
export const NUM_KICK_LINE = seenGrey('lit');
export const NUM_KICK_LINE_H = 8;
// The heal's number (B's partner, H2): under the belly, the side turn and turn
// about, climbing slow while a swell runs along its digits a font pixel up and
// down in held steps, the plus first; from NUM_HEAL_FADE of its life it fades
// down this ramp of purples, bright to dark, instead of going see-through.
export const NUM_HEAL_SIDE = 14;     // screen pixels either side of the belly
export const NUM_HEAL_DROP_BY = 26;  // and under the coil's bottom edge it starts
export const NUM_HEAL_RISE = 12;     // screen pixels a second it climbs
export const NUM_HEAL_SWELL = 7;     // how fast the swell runs, radians a second
export const NUM_HEAL_SWELL_LAG = 0.9; // and how far behind each digit is the one before, radians
export const NUM_HEAL_FADE = 0.5;
// Every number then goes into the serpent's bar (render/barflight.js): a
// blow's once it has held at the top of its arc, the heal's NUM_HEAL_LEAVE_S
// after it is said, each falling in over NUM_BAR_IN_S to the end of the fill,
// where a few grains fly off it for NUM_BAR_BITE_S as it lands.
export const NUM_HEAL_LEAVE_S = 0.7;
export const NUM_BAR_IN_S = 0.26;
export const NUM_BAR_BITE_S = 0.12;
export const NUM_HEAL_FACES = ['bright', 'glow', 'mid', 'low', 'dim'].map(seenPurple);
export const NUM_HEAL_DROPS = ['low', 'dim', 'dim', 'dim', 'dim'].map(seenPurple);
// What the sim keeps for them (deep/serpent.js): a weapon that hurts while it
// is held (the lance, the beam) says its sum once this often, a body at a
// time; the heal says what it closed once a meal (config/meals.js).
export const NUM_HELD_S = 1;
// The spots of one blow that lands in several places (a whirlwind's cut)
// landing within this of its first are summed into its one number.
export const NUM_FOLD_S = 1;

// --- the serpent's bar: what is left of the defense up -------------------------------
// DESIGN.md, "The serpent's bar" (option B of four mocked, then the owner's A
// of docs/mocks/serpent-bar-over-2026-09-28.html). In screen pixels, centered
// on the glass and held still BAR_GAP over the highest the coil's top edge
// ever sways: full at a closed wound, empty at the break. Tones as seen, over
// the finished deep.
export const BAR_LEVEL_GAP = 10;       // screen pixels between the last pip and the level
// The level knocked up BAR_KNOCK as it ticks in a recoil's power-up, held this long.
export const LEVEL_KNOCK_S = 0.1;
export const BAR_W = 400;              // screen pixels, the bar's length
export const BAR_H = 14;               // and its height
export const BAR_GAP = 14;             // over the coil's highest reach, from the bottom of the status row
export const BAR_TOP = 12;             // and never nearer the top of the glass than this
export const BAR_PIP = 14;             // a defense's pip, square, after the bar
export const BAR_PIP_GAP = 6;          // between the bar and a pip, and pip to pip
export const BAR_EDGE = seenGrey('lit');     // a one-pixel rim round the bar and each pip
export const BAR_TRACK = seenGrey('hole');    // the empty of it
export const BAR_LEFT = seenGrey('white');     // what the defense has left
export const BAR_HEALED = seenPurple('bright');   // what a heal brings back, while it flows in
export const BAR_TO_COME = seenGrey('stone');  // a defense not yet reached
export const BAR_STUN = seenPurple('bright');     // the defense's pip while a stun has stopped the heal: a ring of the heal's purple
export const BAR_STUN_RIM = 2;         // screen pixels, the ring's width
export const BAR_HEAL_FADE_S = 0.9;    // the heal's purple fades out over this once it is all in
// How the bar moves (docs/mocks/serpent-hp-bar-2026-10-12.html, the owner's B,
// "pixel shards"). A blow is a fraction of a pixel to a few pixels of the
// bar, so the fill slides down to it rather than ticking: it closes on the
// wound with a time constant of BAR_EASE_S, and is let sit on it once within
// BAR_SETTLE of the bar. A heal flows in at BAR_HEAL_RATE of the bar a
// second, slowed to BAR_FLOW_EASE times what is left to come (but never under
// BAR_FLOW_MIN) so it eases into its end; a break's refill flows the same way
// at the break's own pace. All of it is the picture's: the sim's wound moves
// as it always did.
export const BAR_EASE_S = 0.06;
export const BAR_SETTLE = 0.0005;      // a share of the bar
export const BAR_HEAL_RATE = 0.32;     // a share of the bar a second
export const BAR_FLOW_EASE = 4;        // a second, against what is left to come
export const BAR_FLOW_MIN = 0.05;      // a share of the bar a second
export const BAR_STALE_S = 0.25;       // a gap between drawn frames longer than this (away from the deep) shows the bar as it stands
// The stretch a blow took breaks into BAR_SHARD_PX-pixel pieces, held lit in
// the notch where the blow struck for `hold` seconds (lifted `lift` screen
// pixels, and on a big blow a column at a time, BAR_SHARD_STAGGER_S apart),
// then falling on held poses, BAR_SHARD_POSES a second, under BAR_SHARD_GRAV
// screen pixels a second a second. Each is thrown `side` px/s away from the
// side the blow came from plus up to `sideRand`, spread outward by `spread`
// across the stretch, and up by `up` plus up to `upRand` (less `row` for each
// row down). It falls for BAR_SHARD_FALL_S and fades out whole over the last
// BAR_SHARD_FADE_S of that. A big blow is one past NUM_KICK_BIG, as the knock.
export const BAR_SHARD_PX = 3;
export const BAR_SHARD_HOLD = { small: 0.06, big: 0.16 };
export const BAR_SHARD_LIFT = { small: 1, big: 2 };
export const BAR_SHARD_STAGGER_S = 0.012;
export const BAR_SHARD_POSES = 15;
export const BAR_SHARD_GRAV = 520;
export const BAR_SHARD_KICK = { side: 10, sideRand: 26, spread: 40, up: 18, upRand: 40, row: 4 };
export const BAR_SHARD_FALL_S = 0.85;
export const BAR_SHARD_FADE_S = 0.4;
export const BAR_CHIP = seenGrey('pale');     // a piece while it is held lit in the notch (white, as the fill, once it falls)
// And the bar recoils from it, the whole of it and its pips, up and away from
// the number that went into its underside: BAR_KNOCK screen pixels
// (BAR_KNOCK_BIG for a blow past NUM_KICK_BIG) for half of BAR_KNOCK_S, half
// that for the other half, then home.
export const BAR_KNOCK = 4;
export const BAR_KNOCK_BIG = 8;
export const BAR_KNOCK_S = 0.16;
// The statuses as icons (render/statusicons.js; the owner's A and 3 of
// docs/mocks/status-icons-2026-09-28.html): a five-by-five drawing each,
// STATUS_PX screen pixels a pixel, on a dark tile in a rim -- the serpent's
// in the heal's purple, a fighter's in white, Dazed with the serpent's --
// and a timer of STATUS_STEPS steps under it. The serpent's in a row
// STATUS_GAP under its bar; a fighter's up a post STATUS_POST_OUT right of
// its station, standing STATUS_POST_FOOT over the floor. A status renewed by
// more than STATUS_RENEW_MS starts its timer again.
export const STATUS_ICONS = {
  stun:     { rows: ['#.#.#', '.###.', '##.##', '.###.', '#.#.#'], foe: true },
  bleed:    { rows: ['..#..', '.###.', '#####', '#####', '.###.'], foe: true },
  held:     { rows: ['.###.', '#...#', '#####', '##.##', '#####'], foe: true },
  exposed:  { rows: ['#...#', '.#.#.', '..#..', '.#.#.', '#...#'], foe: true },
  haste:    { rows: ['#.#..', '.#.#.', '..#.#', '.#.#.', '#.#..'] },
  inspired: { rows: ['..##.', '..#.#', '..#..', '.##..', '###..'] },
  dazed:    { rows: ['#.#..', '.....', '..#.#', '.....', '#.#..'], foe: true },
  constricted: { rows: ['.###.', '#...#', '#.#.#', '#...#', '.###.'], foe: true },
  // the serpent's own, a phase's mechanic (deep/phases.js): the heal surging,
  // the lash, the sink
  lash:     { rows: ['...##', '..#..', '.#...', '#....', '#....'], own: true },
  sink:     { rows: ['#####', '.....', '.###.', '.....', '..#..'], own: true },
  orb:      { rows: ['.###.', '#...#', '#.#.#', '#...#', '.###.'], own: true },
  // and the phase's standing resist (the owner's B, docs/mocks/status-resists-2026-09-30.html):
  // the ward halves magic, the plates halve physical
  ward:     { rows: ['..#..', '#.#.#', '.###.', '#.#.#', '..#..'], own: true },
  plates:   { rows: ['.###.', '#####', '#####', '.###.', '..#..'], own: true },
  // and the barrier under it soaks up explosives (the owner's F and 1, docs/mocks/explosive-resist-2026-10-07.html)
  barrier:  { rows: ['#.#.#', '.###.', '##.##', '.###.', '#.#.#'], own: true },
};
// A mechanic's tile while it is warned: its rim blinking between these in held
// steps, STATUS_WARN_HZ a second. Answered, it is struck through for the rest
// of its turn.
export const STATUS_WARN_HZ = 4;
export const STATUS_WARN_RIM = [seenGrey('white'), seenGrey('stone')];
export const STATUS_STRUCK = seenPurple('bright');
// What a mechanic's tile and a dazed fighter's say on hover; the statuses' own
// lines are the boards' (deep/rails.js, `statusLine`).
export const STATUS_SAYS = {
  lash:  { calm: msg('serp-lash-calm'), coming: msg('serp-lash-coming'), on: msg('serp-lash-on'), stopped: msg('serp-lash-stopped') },
  sink:  { coming: msg('serp-sink-coming'), on: msg('serp-sink-on') },   // the owner calls it the cloak; nothing answers it
  orb:   { coming: msg('serp-orb-coming'), on: msg('serp-orb-on'), stopped: msg('serp-orb-stopped') },   // the owner's name for it
  dazed: msg('serp-dazed'),
  constricted: msg('serp-constricted'),   // the owner's
  barrier: msg('serp-barrier'),   // the owner's
  ward: msg('serp-ward'),
  plates: msg('serp-plates'),
};
// And each one's name alone, the label under its tile.
export const STATUS_NAMES = {
  lash: msg('serp-lash'), sink: msg('serp-sink'), orb: msg('serp-orb'), dazed: msg('serp-dazed-name'),
  constricted: msg('serp-constricted-name'), barrier: msg('serp-barrier-name'), ward: msg('serp-ward-name'), plates: msg('serp-plates-name')
};
export const STATUS_PX = 3;
// Over the serpent's bar (the owner's B, 2026-10-04): the tiles twice the
// size, each named under it in STATUS_LABEL_PX type, a column each.
export const STATUS_BAR_PX = 6;
export const STATUS_LABEL_PX = 11;
export const STATUS_LABEL_GAP = 3;
export const STATUS_LABEL_GROUND = seenGrey('water');   // what a label stands on, for its smoothing's steps
export const CRISP_TEXT_KEEP = 64;   // labels set in the palette's steps kept at once (render/crisptext.js)
export const STATUS_GAP = 5;
export const STATUS_STEPS = 5;
export const STATUS_RENEW_MS = 5;
export const STATUS_POST_OUT = 4;
export const STATUS_POST_FOOT = 2;
export const STATUS_TILE = seenGrey('hole');
export const STATUS_RIM = seenGrey('lit');
export const STATUS_FOE = seenPurple('bright');
export const STATUS_FACE = seenGrey('white');
export const STATUS_TIMER = seenGrey('white');
export const STATUS_SPENT = seenGrey('ground');
export const STATUS_POST = seenGrey('lit');
// Bleeding's count of sources in a tile's corner, three by four.
export const STATUS_COUNT = { 2: ['##.', '..#', '.#.', '###'], 3: ['##.', '.##', '..#', '##.'], 4: ['#.#', '###', '..#', '..#'] };

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
// The Ranger's shot, a held pose a beat (the owner's A,
// docs/mocks/ranger-draw-2026-09-28.html): from the hip, nocked, drawn in two
// steps as the limbs bend and he sinks, held full with the strain showing,
// loosed with the string snapped up past the stave, a recoil, a settle. Each
// beat is [start, seconds from the release; the pose]: `lift` rows the bow
// sits over its place (minus is higher), `bend` how far its limbs bow up,
// `pull` the string's cells down to the nock (-1 snapped up), `sink` the
// body's cells down. The last beat ends the shot, back to the braced stance.
export const RANGER_BEATS = [
  [-0.76, { arrow: 'hip',    bend: 2, pull: 0 }],
  [-0.62, { arrow: 'nocked', bend: 2, pull: 0 }],
  [-0.50, { arrow: 'nocked', bend: 2, pull: 1 }],
  [-0.42, { arrow: 'nocked', bend: 3, pull: 2, sink: 1 }],
  [-0.34, { arrow: 'nocked', bend: 3, pull: 3, sink: 1, strain: true }],
  [0,     { lift: -1, bend: 1, pull: -1, loose: true }],
  [0.07,  { lift: -1, bend: 2, pull: 0 }],
  [0.23,  { bend: 2, pull: 0 }],
  [0.37,  null],
];
export const RANGER_AIM_HOLD = 0.3;  // s the aimed shot holds its full draw past a plain one's
export const RANGER_LIFT_S = 0.12;   // s each step of lifting the bow over his head, and of lowering it
export const RANGER_SMEAR_S = 0.07;
// The Mage's beam pooled on the hide where it meets it (render/attacks.js,
// `pool`): half as wide as [a narrow beam, a wide one] in cells, and `motes`
// turning `turn` radians a pose, `out` cells off its edge.
export const BEAM_POOL = { half: [2, 3], motes: 5, turn: 0.5, out: 1.5 };  // s the loosed arrow's held streak stands behind it
// Between two moves a fighter sways a cell forward and back, IDLE_STEP_S a
// step, and a melee fighter hops a cell for IDLE_HOP_S as each step lands
// (the owner's G, docs/mocks/idle-2026-09-28.html). It starts IDLE_SETTLE_S
// after the follow-through has settled.
export const IDLE_STEP_S = 0.8;
export const IDLE_HOP_S = 0.16;
export const IDLE_SETTLE_S = 0.35;
// A fighter's pips are the shop's (shelf.css, `.ladder i`): a circle PIP_PX
// across in screen pixels, its ring PIP_RING thick, PIP_GAP apart, drawn at
// the page's size whatever the deep's zoom.
export const PIP_PX = 6;
export const PIP_RING = 1;
export const PIP_GAP = 2;
// The fighter takes every blow it lands (docs/mocks/blow-heft-2026-09-28.html,
// the owner's pick): knocked back off the hide the moment the hit-pause lets
// go, in whole cells by the contact's size ([size from, cells]), held there
// DRAW_KICK_HOLD_S, then back a cell at a time over DRAW_KICK_BACK_S. A class's
// `kickMax` caps it.
export const DRAW_KICK = [[0.7, 2], [0.4, 1.5], [0.1, 1]];
export const DRAW_KICK_HOLD_S = 0.12;
export const DRAW_KICK_BACK_S = 0.2;
// The still cells of a kit are one sprite a class and a rung, painted in a
// box this many cells round the body's top-left corner (deep/kits.js).
export const KIT_BOX = { left: 6, top: 7, w: 16, h: 11 };
export const MOTE_PERIOD = 2.2;      // s a rung-8 mote takes to drift off a kit
export const MOTE_RISE = 3;          // and cells it rises
// The body flinches from a blow (render/serpent.js; the owner's C of
// docs/mocks/coil-give-2026-09-28.html): the stretch of it round the blow,
// DENT_REACH cells either way, is thrown up DENT_LIFT cells as one piece --
// the inner DENT_CORE of it whole, the rest half as far -- held, then half
// down, then at rest (DENT_STEPS, [until, share], in held poses). A blow past
// DENT_BIG is the second of each pair. A stream's ticks (the beam) do not
// move it.
export const DENT_REACH = [9, 14];
export const DENT_LIFT = [1, 2];
export const DENT_BIG = 0.7;
export const DENT_CORE = 0.6;
export const DENT_STEPS = [[0.16, 1], [0.28, 0.5]];
// The statuses on the whole serpent (the class bench's painters).
export const BLEED_DRIPS = 9;        // columns Bleeding drips off
export const BLEED_DRIP_S = 1.25;    // s a drop takes to fall its four cells
export const HELD_EVERY = 11;        // columns between Held's bands
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
// The mark over a station whose Recruit still waits on its first choice
// (docs/mocks/recruit-mark-2026-09-28.html, voted C): a white chevron pointing
// down at it on a dark keyline, CHOOSE_MARK_UP cells over the station's top,
// bobbing a cell every CHOOSE_MARK_BOB_MS, held between.
export const CHOOSE_MARK = ['#.....#', '##...##', '.##.##.', '..###..', '...#...'];
export const CHOOSE_MARK_UP = 3;
export const CHOOSE_MARK_BOB_MS = 600;

// A fighter's level-up (render/levelup.js; the owner's vote, 2026-10-04): one
// strand of flame tongues corkscrews up round the body for LEVELUP_S, and the
// station's Buy stands closed until it has. A strand of LEVELUP_TONGUES,
// LEVELUP_TURNS round, turning LEVELUP_SPIN radians a second at LEVELUP_FPS
// held frames; its reach out from the body's middle from foot to top, in
// cells; how high it climbs, cells over the feet; a tongue's cells at the foot
// and the top. It lights from the feet up over the first LEVELUP_IN of it; over
// its last LEVELUP_FLARE every tongue leaps twice as tall; then for
// LEVELUP_BURST_S each tongue's tip flies out along its own turn as an ember,
// LEVELUP_BURST_STEPS held steps of LEVELUP_BURST_OUT cells out and
// LEVELUP_BURST_RISE up (the owner's C, 2026-10-04).
export const LEVELUP_S = 1.6;
export const LEVELUP_FPS = 12;
export const LEVELUP_TONGUES = 24;
export const LEVELUP_TURNS = 2;
export const LEVELUP_SPIN = 7;
export const LEVELUP_R = [2.5, 5];
export const LEVELUP_H = 12;
export const LEVELUP_TONGUE = [2, 4];
export const LEVELUP_IN = 0.35;
export const LEVELUP_FLARE = 0.12;
export const LEVELUP_BURST_S = 0.6;
export const LEVELUP_BURST_STEPS = 6;
export const LEVELUP_BURST_OUT = 1.6;
export const LEVELUP_BURST_RISE = 1.2;
export const LEVELUP_EMBER = [2, 1];   // an ember's cells square, flown out and then cooled to the last steps

// While the level-up plays the fighter stops fighting and rises LEVELUP_RISE
// cells off where it stood, a cell every LEVELUP_RISE_STEP seconds, holds, and
// settles back the same way to land as the burst ends (deep/party.js `riseOf`).
export const LEVELUP_RISE = 2;
export const LEVELUP_RISE_STEP = 0.12;
