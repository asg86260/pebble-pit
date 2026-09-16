// The yard's small shapes, written down instead of worked out. A shape is a
// picture of itself, one character to a cell:
//
//     '#'  black -- the yard is drawn in solid black on white
//     'o'  white, painted over the black: a hole cut in the shape
//     '.'  nothing, the ground shows through
//     ' '  the same as '.', so a row can be padded without meaning anything
//
// Rows run top to bottom, characters left to right, laid out from a top-left
// corner in whole cells. Anything whose shape is a fact about the state of the
// game (the rock, the pit, the plots) is a grid, not a sprite, and stays code.

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

// Which column the chimney is in, read off the picture: every engine is drawn
// with its stack standing proud, so the top row holds the chimney and nothing
// else. A literal would go on pointing at the fender after a mirror.
export const stackCol = rows => Math.max(0, rows[0].search(/[^. ]/));

// Where a body stands when it works a machine from on top: the first row solid
// all the way across (everything above it is chimney and mast), at whichever
// end the chimney is not, three in from the far edge for a three-wide body.
export const roofRow = rows => Math.max(0, rows.findIndex(r => !r.includes('.')));
export const seatCol = rows =>
  stackCol(rows) < spriteW(rows) / 2 ? spriteW(rows) - 4 : 1;

// How wide and tall a shape is, in cells.
export const spriteW = rows => Math.max(...rows.map(r => r.length));
export const spriteH = rows => rows.length;

// --- what the crew wear ---------------------------------------------------------
// A body is three cells wide, and a hat sits with its bottom row one cell
// above the top of it. Anything wider than three overhangs the shoulders.
export const HATS = {
  // A rockhand's helmet.
  helmet: [
    '###'
  ],
  // A quarrier's, with the lamp on the front of it.
  lamp: [
    '.#.',
    '###'
  ],
  // A farmhand's sun hat: the overhang is the shape.
  brim: [
    '..###..',
    '#######'
  ],
  // A wizard's point.
  point: [
    '..#..',
    '.###.',
    '#####'
  ],
  // A janitor's flat cap.
  cap: [
    '###',
    '###'
  ]
};

// The same hats with the overhang taken off, for a counter with no bare ground
// either side; written out rather than sliced by code, because a shape trimmed
// by code is a shape nobody has looked at.
export const HATS_TIGHT = {
  brim: [
    '.###.',
    '#####'
  ]
};

// --- the machines ---------------------------------------------------------------
// Each one is a picture, and the parts that move are separate pictures drawn
// beside it, because a moving part is a different shape, not the same shape
// shifted.

// The quarry's machine: a bore drill on the deck over the mouth. The shaft's
// length is how deep the cut has been taken. The body working it stands on
// the roof, at the end away from the chimney; the white slot in the housing
// says engine, not a place anybody is. The gap in the bottom row is where the
// shaft comes through (`shaftX` reads which column off this picture).
export const DRILL = [
  '.......#.',
  '.......#.',
  '#########',
  '#ooo#####',
  '#ooo#####',
  '#########',
  '#####.###'
];

// The bit: a triangle, point down. Four rows, because a taper of one row
// reads as a bar with a nub under it. Its own picture because it travels down
// the bore as the floor drops away.
export const BIT = [
  '#######',
  '.#####.',
  '..###..',
  '...#...'
];

// The ram, at the foot of the hill. The arm is drawn separately because its
// length is the animation.
export const RAM = [
  '..##.......',
  '..##.......',
  '..##.......',
  '###########',
  '#oooo######',
  '#oooo######',
  '#oooo######',
  '###########'
];

// The tiller: a tractor, big wheel at the back, little one at the front. It
// faces *right*, which is what `flip` means everywhere in the yard: a sprite
// is drawn as it stands going right and mirrored going left.
export const TILLER = [
  '.......#..',
  '#......#..',
  '#......#..',
  '#..#####..',
  '##########',
  '#oooo##oo#',
  '#oooo##oo#',
  '.####..##.'
];

// The same three at roster size. The one rule a mark keeps is that it is the
// *same machine*, smaller: the same silhouette, feature for feature (the ram's
// arm, the tractor's unequal wheels), so the thing on the strip and the thing
// in the yard are obviously one object.
export const MACHINE_MARK = {
  jaw: [
    '.#....',
    '.#....',
    '######',
    '#oo###',
    '##.###',
    '.###..',
    '..#...'
  ],
  ram: [
    '.#.......',
    '.#.......',
    '######..#',
    '#oo######',
    '#oo######',
    '######..#'
  ],
  tiller: [
    '.....#.',
    '#....#.',
    '#.####.',
    '#######',
    '#oo##o#',
    '.##..#.'
  ]
};
