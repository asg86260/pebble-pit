// The yard's small shapes, written down instead of worked out.
//
// Everything here used to be arithmetic: a handful of `fillRect` calls with
// offsets in them, so a hat was three lines of sums and changing it meant doing
// the sums again. Which is the wrong tool twice over -- it is hard to read, and
// it is *impossible to design*. Nobody can look at `fillRect(x + P, y - P,
// WORKER - P * 2, P)` and see a flat cap.
//
// So a shape is a picture of itself. One character to a cell:
//
//     '#'  black -- the yard is drawn in solid black on white
//     'o'  white, painted over the black: a hole cut in the shape
//     '.'  nothing, the ground shows through
//     ' '  the same as '.', so a row can be padded without meaning anything
//
// Rows run top to bottom, characters left to right, and the whole thing is laid
// out from a top-left corner in whole cells. To redraw the janitor's cap you
// retype the cap. There is no other step.
//
// What is *not* here, and cannot be: the rock, the pit, the quarry, the plots
// and the sky. Those are not shapes, they are grids the game is playing on --
// the hill is however many cells are left of it, and drawing it from a picture
// would mean the picture and the boulder disagreeing about what has been dug
// out. Anything whose shape is a fact about the state of the game stays code.

import { P } from './config.js';

// One shape, from a top-left corner. `flip` mirrors it, for a body facing the
// other way.
export function drawSprite(ctx, rows, x, y, o = {}) {
  if (!rows) return;
  const w = Math.max(...rows.map(r => r.length));
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    for (let c = 0; c < row.length; c++) {
      const ch = row[c];
      if (ch === '.' || ch === ' ') continue;
      const cx = o.flip ? w - 1 - c : c;
      ctx.fillStyle = ch === 'o' ? '#fff' : '#000';
      ctx.fillRect(x + cx * P, y + r * P, P, P);
    }
  }
  ctx.fillStyle = '#000';
}

// How wide and tall a shape is, in cells -- for anything that needs to sit a
// sprite against something else.
export const spriteW = rows => Math.max(...rows.map(r => r.length));
export const spriteH = rows => rows.length;

// --- what the crew wear ---------------------------------------------------------
// A body is three cells wide, and a hat sits with its bottom row one cell above
// the top of it. Anything wider than three overhangs the shoulders, which is the
// whole of what a sun hat is and most of what says wizard.
//
// These are the sizes the yard has always drawn. The first go at moving them
// here guessed at them and made every one of them bigger -- a five-by-two
// helmet on a three-cell body -- so the crew wore buckets.
export const HATS = {
  // A miner's helmet: the body's own width, one course.
  helmet: [
    '###'
  ],
  // A quarrier's, with the lamp on the front of it.
  lamp: [
    '.#.',
    '###'
  ],
  // A farmhand's sun hat. The overhang *is* the shape -- two clear cells past
  // the body each side -- and there is a low crown on top of it now. The crown
  // was always meant to be there and was drawn at a negative width, so for as
  // long as this hat has existed it has been a flat disc.
  brim: [
    '..###..',
    '#######'
  ],
  // A wizard's point, and the only hat here that goes up rather than across.
  point: [
    '..#..',
    '.###.',
    '#####'
  ],
  // A janitor's flat cap: a low crown with the peak out front. It is the only
  // hat that is not a trade -- a janitor buys no kit and wears nothing the
  // school sells -- so it is the one that has to be told apart by shape alone,
  // which is why it is lopsided where the others are symmetrical.
  cap: [
    '###',
    '###'
  ]
};

// Some hats are drawn on a counter, where there is no bare ground either side to
// overhang into. These are the same hats with the overhang taken off -- written
// out rather than sliced off the wide one, because a shape trimmed by code is a
// shape nobody has looked at.
export const HATS_TIGHT = {
  brim: [
    '.###.',
    '#####'
  ]
};

// --- the machines ---------------------------------------------------------------
// Each one is a picture, and the parts that move are separate pictures drawn
// beside it -- an arm at a length, a wheel at an angle -- because a moving part
// is a different shape, not the same shape shifted.

// The jaw, on the floor of the cut. Its mouth opens and shuts, so there are two
// of it.
export const JAW = [
  [
    '.####',
    'ooo##',
    'ooo##',
    '#####'
  ],
  [
    '.####',
    '#o###',
    '#o###',
    '#####'
  ]
];

// The hoist's frame, on the deck over the mouth. The rope and the skip are drawn
// under it, as long as the hole is deep.
export const HOIST = [
  '###',
  '#o#',
  '#o#',
  '#o#',
  '#o#',
  '#o#',
  '#.#'
];

// The ram, at the foot of the hill. The arm is drawn separately because its
// length is the animation.
export const RAM = [
  '.##....',
  '.##....',
  '#######',
  '#ooo###',
  '#ooo###',
  '#######'
];

// The tiller: a tractor, and the silhouette everybody already knows -- a big
// wheel at the back, a little one at the front, a bonnet sloping down between
// them, and the driver up over the back axle.
export const TILLER = [
  '.#.....',
  '.#..###',
  '####..#',
  '#######',
  '#o##o##',
  '.oo.ooo'
];
