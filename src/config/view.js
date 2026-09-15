import { rand } from '../rng.js';
import { P } from './yard.js';

export let DEVICE_PIXELS = 9e6;
// cells of sand any one grid is allowed to look at in a frame. The ground can
// hold a hundred thousand and the pit a million; walking either every frame is
// the most expensive thing in the game, and settling a band at a time is free
export const SETTLE_BUDGET = 40000;
export const MAX_DEPTH = 6;      // sheets of rock a boulder can be thick
// A cell holds how much rock is still stacked there. Thick rock is dark, and it
// pales as you dig through it; an empty cell is the white page showing through.
// These stay grey on purpose: shade is how deep the rock was, and it is not
// free to mean anything else. Color in this game belongs to the things that
// never came off the rock.
export const SHADES = ['#8a8a8a', '#757575', '#5f5f5f', '#464646', '#2c2c2c', '#111111'];
// Cells above the shades are not dust, but they are one cell exactly like a
// grain of dust: they fall, heap, slump, are scooped and are carried by the
// same code, and differ only in the mark drawn on them and what they are worth
// when they land in the pit. Two systems that both mean "a thing in a pile" is
// one system too many, and every rule they did not share was a bug waiting.
export const MARK_SIZE = P;
export const CORE_CELL = SHADES.length + 1;   // a core sitting in a pile, among the dust

// Each kind of find gets a run of cell values rather than one, because each
// grain carries its own tone: a heap of shards is a speckle of blues the way a
// heap of dust is a speckle of greys. The tone lives in the cell rather than
// being worked out from where the cell is, because a grain slides as the heap
// settles and must not change color on its way down a slope.
export const FIND_TONES = 4;
export const SHARD_CELL = CORE_CELL + 1;                  // and the three after it
export const SPORE_CELL = SHARD_CELL + FIND_TONES;
export const SPARK_CELL = SPORE_CELL + FIND_TONES;
export const FIND_TOP = SPARK_CELL + FIND_TONES - 1;

// One cell that is not a grain at all: the rock a plot of sand is dug into.
// The cut in the quarry is a plot of sand whose floor moves, and a grid's
// `ceiling` cannot say that (it counts up from the bottom of the plot, which is
// the deepest the hole will ever be). So the rock is *in* the plot, as cells:
// undug ground fills its column from the floor of the grid upward, dust lands
// on top of it and falls further the frame a cell is taken out from under it.
// The painter has no color for it, so it draws as nothing and the quarry's own
// drawing shows through (painter.js).
export const ROCK_CELL = FIND_TOP + 1;

// Everything the *ground* makes is a grey, because grey is how deep the rock
// was; the things the sites give up never came off the rock, so they are the
// one thing a color can mean something about. Flat and strong, not pastel.
// What the wizards throw, and what comes off them while they fly: purple, and
// the only purple in the game. Everything else in the sky is the star, and
// that is red. Red is the stuff; purple is the magic moving it.
export const MAGIC_TONES = ['#9b5de5', '#8244d8', '#6a2fbe', '#4e2090'];

export const FIND_COLOR = {
  [SHARD_CELL]: ['#5b83e0', '#3f68d4', '#2f5fd0', '#2748a4'],   // the quarry: a cold blue
  [SPORE_CELL]: ['#57c074', '#3aa957', '#2e9e4b', '#227b3a'],   // the farm: green, it grew
  // The meteor's core: red, and the only red in the game. The quarry is cold and
  // the plots are alive; this came out of the sky and is still hot.
  [SPARK_CELL]: ['#e8503a', '#d93a25', '#c62d1c', '#9c2214']
};

// which kind a cell belongs to, and one of that kind with a tone of its own
export const findKind = v =>
  v >= SHARD_CELL && v <= FIND_TOP ? SHARD_CELL + Math.floor((v - SHARD_CELL) / FIND_TONES) * FIND_TONES : 0;
export const someFind = base => base + Math.floor(rand() * FIND_TONES);

// Where the view opens -- see `openingCamX` in world.js. The rock is seated this
// far across the window, as a share of its width, when the window has no room
// for the bench as well: left of center, because everything you can buy is to
// the left of the rock and the pit lip to the right, and the lip is the nearer.
export const OPENING_ROCK_AT = 0.4;
// And when there is room, the bench stands this far in from the left-hand
// edge, with the same air past the rock's far side before the edge counts as
// reached. Ten cells: enough that the bench is not flush against the frame.
export const OPENING_MARGIN = P * 10;
// The landing page's menu column, in screen pixels: the demo yard behind it
// (main.js, `demo`) is the opening view pushed right by this much, so the
// column stands over empty ground. title.css draws the column this wide.
export const TITLE_COLUMN = 320;
// and how far the demo is run before its first frame: the rock down, the
// crew across the yard and swinging, so the page never opens on an empty one
export const DEMO_HEAD_START_S = 45;
// How long the landing page takes to go white on play, in ms, before it
// asks for the game page; the game page's own veil (style.css) lifts in
// about the same. Two fades either side of a load, not a cut.
export const VEIL_MS = 350;
// and how long the held sheet and its wash take to come up and go down
// (fade.js; style.css fades #held and #scrim in the same time)
export const SHEET_FADE_MS = 180;
// The most the landing page waits for its picture (the demo frame's load)
// before lifting its veil regardless: a frame that will not come must not
// hold the page white.
export const PICTURE_WAIT_MS = 4000;

// The dev panel's rows for the knobs above, beside the bindings because an
// imported `let` is read-only; config.js gathers every file's rows into TUNABLE.
export const VIEW_KNOBS = [
  // The one dial that is about the frame rate rather than the game, because
  // the frame rate is a pixel count: the yard's own work is under a twentieth
  // of a frame and the picture costs the rest. What it caps is the *backing
  // store*, so it only does anything on a screen that reports more than one
  // device pixel to the css pixel.
  { key: 'DEVICE_PIXELS', label: 'pixels a frame', min: 1e6, max: 12e6, step: 5e5, layout: true,
    get: () => DEVICE_PIXELS, set: v => { DEVICE_PIXELS = v; } }
];

// The wisp off the apothecary's fire.
export const APOTH_SMOKE = '#3a3a3a';
