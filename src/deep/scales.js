// Scales: knocked off the serpent, fallen through the water, lying on the
// deep's floor. The bed is the deep's purse, the way the pit is the yard's.
//
// SKELETON. Track SERPENT owns this file and replaces every body below; the
// exports and their signatures are the contract (docs/wave-serpent.md).

// Loose `n` scales from (x, y): they sink and are counted where they land.
export const shed = (x, y, n) => {};
// Pay `n` scales: taken off the top of the bed and lifted toward (toX, toY).
// True if the bed held them.
export const spendScales = (n, toX, toY) => false;
export const wireBed = () => {};
export const stepScales = c => {};

export const SAVE = {
  fields: ['deepBed'],
  write(out) { out.deepBed = ''; },
  read(s) {},
  blank() {}
};
