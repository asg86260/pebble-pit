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

// Which column the chimney is in, read off the picture rather than written down
// beside it.
//
// Every engine here is drawn with its stack standing proud of the body, so the
// top row of the sprite holds the chimney and nothing else -- and the first cell
// in that row is therefore the pipe. Which means the one thing nobody has to
// remember when a machine is redrawn, or mirrored, is where its smoke comes out.
// The tractor was mirrored once already and its exhaust moved from one end of
// the picture to the other; a literal would have gone on pointing at the fender.
export const stackCol = rows => Math.max(0, rows[0].search(/[^. ]/));

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
//
// Half again the size it was, and that is the whole of the change. A machine in
// this yard costs a full set of specialists and does the work of all of them, and
// at five cells by four it was two-thirds the height of one of the bodies it had
// just put out of a job -- so the thing you had saved up the whole ladder for
// arrived looking like a crate somebody had left in the hole. Every machine here
// is now about three bodies wide, which is the smallest a thing can be and still
// read as *plant* rather than as an object.
export const JAW = [
  [
    '..######',
    '.#######',
    'oooo####',
    'oooo####',
    'oooo####',
    '########'
  ],
  [
    '..######',
    '.#######',
    '#oo#####',
    '#oo#####',
    '#oo#####',
    '########'
  ]
];

// The hoist's frame, on the deck over the mouth. The rope and the skip are drawn
// under it, as long as the hole is deep.
//
// A frame, and drawn like one: white knocked out of the whole inside of it with
// a band of black across the middle and a stub of upright in each half, so it
// reads as braced steel rather than as a black slab. Filled in, at this height,
// it was a monolith standing over the cut -- the biggest black shape in the yard,
// and a picture of nothing.
//
// The rope runs down the channel at the bottom, and which column that is, is
// read off the sprite rather than written down twice -- see `ropeCol`.
export const HOIST = [
  '#####',
  '#ooo#',
  '#o#o#',
  '#ooo#',
  '#####',
  '#ooo#',
  '#o#o#',
  '#ooo#',
  '#o.o#'
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

// The tiller: a tractor, and the silhouette everybody already knows -- a big
// wheel at the back, a little one at the front, a bonnet sloping down between
// them, and the driver up over the back axle.
//
// The wheels are rings: white knocked out of the chassis for the hub, black left
// round it for the tyre, and the bottom row broken so the two of them are two
// wheels rather than one long skirt. The back one is twice the width of the
// front, which is the one thing about a tractor everybody can see from a field
// away.
//
// It faces *right*, which is what `flip` means everywhere else in the yard: a
// sprite is drawn as it stands when the thing is going right, and mirrored when
// it is going left. This one was drawn facing left, so `drawTiller`'s mirror --
// correct on its own terms -- turned it the wrong way at both ends of the row
// and the tractor crossed the field backwards the whole time. Mirroring the
// picture is the fix; the columns off it moved with it.
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

// The same three at roster size.
//
// A machine's own picture is the best possible icon of it right up until the
// picture is eleven cells wide and eight tall, and a roster strip is eighteen by
// four. So the switch gets a mark -- and the one rule a mark has to keep is that
// it is the *same machine*, smaller. Not a family resemblance: the same
// silhouette, feature for feature, so that the thing on the strip and the thing
// standing in the yard are obviously one object.
//
// The ram's first mark failed that and it was worth working out why. It had a
// chimney in the middle where the yard's is at the front, a thin wide slot where
// the yard's is a square, and -- this is the one that mattered -- no arm at all.
// The arm is the ram: it is the only machine whose working end is somewhere
// other than where its body stands, and a ram without one is a shed.
export const MACHINE_MARK = {
  // A block with a mouth cut white out of its front, and the stack on the back
  // of it. The stack is not what tells a jaw from a tiller -- all three smoke --
  // but the yard's jaw has one and this is supposed to be the same machine.
  jaw: [
    '....#.',
    '....#.',
    '.#####',
    'ooo###',
    'ooo###',
    '######'
  ],
  // Chimney at the front, square slot, and the arm reaching out to a striking
  // head -- the yard's ram with the middle taken out of it.
  ram: [
    '.#.......',
    '.#.......',
    '######..#',
    '#oo######',
    '#oo######',
    '######..#'
  ],
  // The tractor, reduced feature for feature and facing the way the yard's does:
  // stack at the front on the right, bonnet sloping back from it, the rear fender
  // behind the seat on the left, and two wheels of *different* sizes -- a wide
  // ring at the back and a small one at the front, which is the one thing about a
  // tractor anybody can see from a field away.
  //
  // Both marks this replaces missed the same things. The older one was the
  // tractor as it was drawn before the machines grew: no fender, both wheels the
  // same, and a cab step where the bonnet should be. The next was pointed the
  // right way but kept the equal wheels. A mark has one job, and it is to be the
  // same machine as the one standing in the yard.
  tiller: [
    '.....#.',
    '#....#.',
    '#.####.',
    '#######',
    '#oo##o#',
    '.##..#.'
  ]
};
