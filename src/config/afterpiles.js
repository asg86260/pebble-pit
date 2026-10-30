// --- act 3's piles: blocks on a plot (DESIGN.md, "Act 3's goods are blocks,
// and bodies carry every one"; the owner, 2026-10-27) -------------------------
// A pile is a grid.js plot whose cell is one block, and it is the stock: the
// count is its cells. Here, apart from config/after.js, because after/art.js
// lays each station's ground off how wide its piles stand and config/after.js
// lays the camp off after/art.js: this file imports nothing, so both can read it.

// A good's block, in art cells square: a log 4x4, a plank of timber 2x2.
// ...and a construction site's load (after/build.js), two cells a side, the
// shape the site's piled loads have always been drawn as; and the grove's
// acorn, three cells across.
export const AFTER_BLOCK = { log: 4, plank: 2, sign: 4, load: 2, acorn: 3 };
// A block taller than it is wide, its height in art cells (the owner,
// 2026-10-30: "Teach blocks a height"): the acorn 3x4. Every other block is
// as tall as it is wide.
export const AFTER_BLOCK_H = { acorn: 4 };
// What a log saws into, in timber blocks (16 cells into four 2x2s, a column
// of the cut each; the owner, 2026-10-29), and the logs a cut takes with the mill's second blade.
export const AFTER_LOG_TIMBER = 4;
export const AFTER_BLADE_LOGS = 2;
// Each counted pile: the good it holds and its brim, the most blocks it holds
// (the owner's calls, 2026-10-27). At the brim it wears the pile-full mark
// and its supply stops. `cols` only where the design names a width (the saw
// mill's log pile "two wide beside the wheel"); every other pile is as wide
// as the heap its brim makes at the dust's slope (after/art.js, `pileGrid`).
export const AFTER_PILES = {
  logs:      { good: 'log', brim: 6, cols: 2 },
  grovelogs: { good: 'log', brim: 8 },
  // the timber mound is fed off the saw mill's chute from its near side
  // (after/piles.js, `dropCol`). The saw stops once a cut of four no longer
  // fits, so a pile it fills stands at the brim less three at the least: 21,
  // so every bill of 18 timber can be paid off it.
  timber:    { good: 'plank', brim: 21, near: true },
  // track A: the grove's seed basket by the forestry shack (DESIGN.md, "Act
  // 3's grove, rebuilt", call 12): five acorns, three across, the count what
  // is drawn
  seeds:     { good: 'acorn', brim: 5, cols: 3 }
};
// A pass of the sand rules over a pile, seconds: a block set down rolls off
// the heap's side a cell a pass, slow enough to be seen rolling (the voted
// mock's, mock-log-split round 7).
export const AFTER_PILE_SETTLE_S = 0.07;

// track B: carried goods
// The workshop's two piles (DESIGN.md, "Act 3's goods are blocks, and bodies
// carry every one", the other stations): its timber, walked to it off the
// timber mound a block at a time, two signs' worth on its rack, two blocks
// wide; and the signs it nails, 4x4 blocks stood two wide in its rack until
// a body carries each out to the crowd.
Object.assign(AFTER_PILES, {
  benchtimber: { good: 'plank', brim: 8, cols: 2 },
  signs:       { good: 'sign', brim: 4, cols: 2 }
});
// The floor a pile keeps clear round it, in art cells: a station's piles that
// name no column are laid this far past what stands before them (after/art.js,
// `layPiles`), and each pile's footprint claims it, so nothing placed may
// stand in it (footprints.js; verify.js rule 21).
export const AFTER_PILE_GAP = 3;
