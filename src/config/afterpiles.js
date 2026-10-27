// --- act 3's piles: blocks on a plot (DESIGN.md, "Act 3's goods are blocks,
// and bodies carry every one"; the owner, 2026-10-27) -------------------------
// A pile is a grid.js plot whose cell is one block, and it is the stock: the
// count is its cells. Here, apart from config/after.js, because after/art.js
// lays each station's ground off how wide its piles stand and config/after.js
// lays the camp off after/art.js: this file imports nothing, so both can read it.

// A good's block, in art cells square: a log 4x4, a plank of timber 2x2.
export const AFTER_BLOCK = { log: 4, plank: 2, sign: 4 };
// What a log saws into, in timber blocks (16 cells into 12 and the kerf's
// four grains), and the logs a cut takes with the mill's second blade.
export const AFTER_LOG_TIMBER = 3;
export const AFTER_BLADE_LOGS = 2;
// Each counted pile: the good it holds and its brim, the most blocks it holds
// (the owner's calls, 2026-10-27). At the brim it wears the pile-full mark
// and its supply stops. `cols` only where the design names a width (the saw
// mill's log pile "two wide beside the wheel"); every other pile is as wide
// as the heap its brim makes at the dust's slope (after/art.js, `pileGrid`).
export const AFTER_PILES = {
  logs:      { good: 'log', brim: 6, cols: 2 },
  grovelogs: { good: 'log', brim: 8 },
  timber:    { good: 'plank', brim: 20 }
};
// A pass of the sand rules over a pile, seconds: a block set down rolls off
// the heap's side a cell a pass, slow enough to be seen rolling (the voted
// mock's, mock-log-split round 7).
export const AFTER_PILE_SETTLE_S = 0.07;
