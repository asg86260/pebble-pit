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
// free to mean anything else. Colour in this game belongs to the things that
// never came off the rock.
export const SHADES = ['#8a8a8a', '#757575', '#5f5f5f', '#464646', '#2c2c2c', '#111111'];
// Cells above the shades are not dust. They heap and are carried exactly like
// it -- a shard on the ground is a grain in the same plot, and a worker scooping
// a column picks it up without knowing what it is -- but they are counted as
// themselves when they land in the pit, and the pile draws them as their mark.
// How big a thing that is not dust is drawn, in world pixels. It occupies one
// cell and collides as one, but a cell is five screen pixels and a triangle five
// pixels across is a smudge -- so it is drawn a little larger than its cell,
// with the page showing through behind it. That white surround is what keeps two
// of them side by side readable as two things rather than one shape.
// A thing that is not dust is one cell, exactly like a grain of dust, because it
// *is* a grain of dust as far as the ground is concerned -- it falls, heaps,
// slumps, is scooped and is carried by the same code, and differs only in the
// mark drawn on it and what it is worth when it lands in the pit. Two systems
// that both mean "a thing in a pile" is one system too many, and every rule they
// did not share was a bug waiting: the ceiling, the lattice, the repose angle.
export const MARK_SIZE = P;
export const CORE_CELL = SHADES.length + 1;   // a core sitting in a pile, among the dust

// Each kind of find gets a run of cell values rather than one, because each
// grain carries its own tone: a heap of shards is a speckle of blues the way a
// heap of dust is a speckle of greys. The tone has to live in the cell and not
// be worked out from where the cell is -- a grain slides as the heap settles,
// and a grain that changed colour on its way down a slope would be a mess.
export const FIND_TONES = 4;
export const SHARD_CELL = CORE_CELL + 1;                  // and the three after it
export const SPORE_CELL = SHARD_CELL + FIND_TONES;
export const SPARK_CELL = SPORE_CELL + FIND_TONES;
export const FIND_TOP = SPARK_CELL + FIND_TONES - 1;

// And one cell that is not a grain at all: the rock a plot of sand is dug into.
//
// The cut in the quarry is a plot of sand whose floor moves -- it is the top of
// whatever has not been dug out yet, one height per column, and it goes down as
// the gang work. A grid's `ceiling` cannot say that: a ceiling counts up from
// the bottom of the plot, and the bottom of the cut is the deepest the hole will
// ever be, so a ceiling would stand the dust at the bottom of a hole nobody has
// dug and leave rock hanging over it.
//
// So the rock is *in* the plot, as cells, which is what it is. Undug ground
// fills its column from the floor of the grid upwards; dust lands on top of it
// and falls further the frame a cell is taken out from under it, without the
// sand being told that a quarry exists. The painter has no colour for it, so it
// draws as nothing and the quarry's own drawing shows through -- see painter.js,
// "anything the painter does not have a colour for is left clear".
export const ROCK_CELL = FIND_TOP + 1;

// The first colour in the game, and the reason it goes here first: everything
// the *ground* makes is a grey, because grey is how deep the rock was. The
// things the sites give up are not dust and never came off the rock, so they are
// the one thing a colour can mean something about. And a solid coloured cell
// tiles a heap exactly the way a grey one does -- a triangle fills half its cell
// however neatly it stacks, so a heap of them is half air by geometry.
//
// Flat and strong, not pastel: this is a game of flat shapes on white paper.
// What the wizards throw, and what comes off them while they fly. Purple, and
// the only purple in the game: everything else in the sky is the star -- its
// crust, its fire, the sparks it sheds -- and that is red. So the rule reads at
// a glance and never has to be explained. Red is the stuff; purple is the magic
// moving it.
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

// The dev panel's rows for the knobs above. A row lives beside the binding it
// moves because nothing but this file can assign to one: an imported `let` is
// read-only everywhere else, so the get/set pair has to be written where the
// `let` is. config.js gathers every file's rows into one TUNABLE.
export const VIEW_KNOBS = [
  // The one dial that is about the frame rate rather than the game, and it is
  // here because the frame rate is a pixel count: this yard fills pixels, it
  // does not think -- measured, its own work is under a twentieth of a frame and
  // the picture costs the rest, scaling exactly with the size of the window.
  //
  // What it caps is the *backing store*, so it only does anything on a screen
  // that reports more than one device pixel to the css pixel. On a plain
  // monitor the ratio is already one and turning this down changes nothing;
  // on a laptop at two, halving the budget is halving the work.
  { key: 'DEVICE_PIXELS', label: 'pixels a frame', min: 1e6, max: 12e6, step: 5e5, layout: true,
    get: () => DEVICE_PIXELS, set: v => { DEVICE_PIXELS = v; } }
];

// The wisp off the apothecary's fire. It was a literal in the drawing; a tone
// is a number and lives here with the rest.
export const APOTH_SMOKE = '#3a3a3a';
