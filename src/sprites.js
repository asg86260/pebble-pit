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

// Where a body stands when it works a machine from on top of it: the roof, and a
// spot on the roof clear of the chimney.
//
// The roof is the first row of the picture that is solid all the way across --
// everything above it is chimney and mast, which is a cell or two wide and not a
// thing anybody stands on. The spot is at whichever end the chimney is not,
// because the two would otherwise want the same cells: a body is three wide, so
// it goes three in from the far edge, leaving a cell of margin.
//
// Read off the picture, both of them, so a machine that is redrawn -- or
// mirrored, which has happened once already -- keeps its operator on top of
// itself and out of its own smoke.
export const roofRow = rows => Math.max(0, rows.findIndex(r => !r.includes('.')));
export const seatCol = rows =>
  stackCol(rows) < spriteW(rows) / 2 ? spriteW(rows) - 4 : 1;

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
  // A rockhand's helmet: the body's own width, one course.
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

// The quarry's machine: a bore drill standing on the deck over the mouth.
//
// It was two things and neither read. A block on the floor of the cut with a
// mouth cut white out of it, and a headframe over the top with a rope down it
// and a skip riding the rope -- so what you actually saw was a black slab with
// dots scattered down it, a second black lump in the hole, and one white cell on
// a line that looked like a hole in the tower rather than a thing being hauled
// out of it. Three pictures that needed explaining, for one machine.
//
// A bore drill needs no explaining, and it is one object: the rig sits on the
// deck, the shaft goes down the hole, and the bit on the end of it eats the
// floor. The shaft's length is how deep the cut has been taken, so the one thing
// the old rope was genuinely good at -- showing the depth -- is kept.
//
// It stands on the bridge, on the deck laid over the mouth, because that is the
// only solid thing above a hole -- a rig hanging in the air over the cut was the
// last thing about this machine that had to be explained away.
//
// The body working it stands on the roof, at the end away from the chimney. It
// was inside, in a cab knocked out of the left of the housing, and at the size
// this is actually seen a white square inside a black machine is not a body --
// it is a window. On top, against the sky, it is a body.
//
// The white slot left in the housing is the machine's own, the same as the ram's
// piston slot: a hole that says engine, not a place anybody is.
//
// The gap in the bottom row is where the shaft comes through, and the legs stand
// either side of the bore. Which column that is, is read off this picture -- see
// `shaftX` -- as is the chimney, which is the first cell of the top row.
export const DRILL = [
  '.......#.',
  '.......#.',
  '#########',
  '#ooo#####',
  '#ooo#####',
  '#########',
  '#####.###'
];

// The bit: a triangle, point down, boring. Four rows rather than three, because
// a taper of one row reads as a bar with a nub under it rather than as a point --
// and the point is the whole of what says *drill*. As wide as the rig, so the
// bore it sinks is the width of the machine sinking it, and its own picture
// because it travels down that bore as the floor drops away from it.
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
  // The rig, and the bit under it on its shaft. Small as it is, it is the same
  // object as the one over the cut: chimney, housing, and a triangle boring.
  jaw: [
    '.#....',
    '.#....',
    '######',
    '#oo###',
    '##.###',
    '.###..',
    '..#...'
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
