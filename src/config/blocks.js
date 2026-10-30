// --- the kinds of unit on a ground plot (DESIGN.md, "One resource system for
// every act", section 1) -------------------------------------------------------
// A unit is a cell value, as the yard's grain is: grid.js leaves every value
// past the finds and the rock to the owner, and these runs are laid there, one
// run a kind and one value a tone, so a cell says both what it is and which
// tone it keeps. A block (size above 1) fills a size-by-size square of cells
// of one value; a grain (size 1) is a cell on its own.
import { ROCK_CELL } from './view.js';
import { AFTER_BLOCK, AFTER_BLOCK_H } from './afterpiles.js';
import { AFTER_TONES, AFTER_GOODS, GREY } from './palette.js';

// What each kind is, in the order its run of values is laid out (so a kind
// added at the end never shifts a saved value):
//   size     cells across (and the lattice a block stands on)
//   h        cells tall, the size unless named (the owner, 2026-10-30: "Teach
//            blocks a height"), so a square kind is as it always was
//   weight   grains of the hand's capacity one unit takes: a block's area, so
//            a log is sixteen dust and the strength ladder means the same in
//            every act (the owner, 2026-10-28)
//   palette  its tones, one color each (AFTER_GOODS); a unit keeps the one
//            it was born with, a block is one flat square of it
//   home     the pile a body carries it back to (none: it is no good to carry
//            home, and a gatherer leaves it lying)
const KIND_DEFS = [
  { key: 'log',     size: AFTER_BLOCK.log,   palette: AFTER_GOODS.log,                      home: 'grovelogs' },
  { key: 'plank',   size: AFTER_BLOCK.plank, palette: AFTER_GOODS.plank,                    home: 'timber' },
  { key: 'sign',    size: AFTER_BLOCK.sign,  palette: AFTER_GOODS.sign,                     home: 'signs' },
  // a construction site's load (after/build.js): made at the shack's door,
  // laid in a band, carried by nobody home, so no pile is its home
  { key: 'load',    size: AFTER_BLOCK.load, palette: [GREY[AFTER_TONES.mid]],         home: null },
  // the grove's seed (DESIGN.md, "Act 3's grove, rebuilt"): three wide and four
  // tall, a dark cap over a warm nut, drawn as one sprite off the log's
  // tones (render/after/pine.js); its one value is the nut's
  { key: 'acorn',   size: AFTER_BLOCK.acorn, h: AFTER_BLOCK_H.acorn, palette: [AFTER_GOODS.log[0]], home: 'seeds' }
];

// The first value a unit may take, the one after the rock's.
export const BLOCK_CELL = ROCK_CELL + 1;
// A cell of a place's floor laid as ground that never moves (act 3's cloud
// swells and station shelves, after/ground.js): the rock's value, as the
// quarry's undug ground is, since it means the same thing -- not a unit,
// held up and holding up, never taken and never drawn by the ground's painter.
export const TERRAIN_CELL = ROCK_CELL;

// `first` and `tones` are derived, never typed: a kind's run is its palette's
// length, laid after the kind before it.
export const KINDS = {};
{
  let at = BLOCK_CELL;
  for (const d of KIND_DEFS) {
    const h = d.h ?? d.size;
    KINDS[d.key] = { ...d, h, weight: d.size * h, first: at, tones: d.palette.length };
    at += d.palette.length;
  }
  // Cells are bytes (grid.js); a run past 255 would wrap into the shades.
  if (at > 256) throw new Error(`KINDS run to cell value ${at - 1}, past a byte`);
}
