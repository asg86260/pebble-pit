// The sign in front of a station: the one thing in the yard you walk up to to
// open a board.
//
// Boards used to come out of the buildings themselves -- a patch of ground and
// air round each one, and standing anywhere in it opened the menu. That reads
// differently at every station, because the stations are not alike: the lab is a
// small block, the casino is four times as wide, the cut is a hole with nothing
// standing over it at all, and the crew's block grows a room a body until it is
// taller than the rock. So the same act -- go and look at that -- had a target
// the size of a shed in one place and the size of a wall in another, and two of
// them overlapped each other on the way past.
//
// A sign is one size everywhere. It stands on the ground in front of its
// station, it is the same six cells by three whatever it belongs to, and it is
// what the cursor is for: the building behind it is scenery again, the way the
// rock and the houses always were.
//
// The bench keeps its old whole-thing reach. It is where the game starts, before
// there is anything else on the ground to be consistent with, and a first board
// that hides behind a post is a first board nobody finds.

import { P } from './config.js';
import { S, lab, school, casino, scrub, quarry, farm, tower } from './state.js';
import { houseLeft } from './house.js';

// The board, the post it stands on, and how far clear of its station it stands.
// One set of numbers for every sign there is -- that is the whole point of them.
export const SIGN_W = P * 6;
export const SIGN_H = P * 3;
export const SIGN_POST = P * 3;         // a board about two bodies off the ground
const SIGN_OFF = P * 2;                 // bare ground between the station and its sign

// How far off one you can be and still be reading it. A sign is a small thing on
// a long yard, so the reach is generous sideways and runs the whole way down to
// the ground: the post is part of the sign, and so is standing at its foot.
const REACH = P * 3;

// Which side of its station a sign stands on.
//
// To the right, everywhere but one: the yard is walked from the rock end, so the
// right-hand side of a station is the side you arrive at. The crew's block is
// the exception both ways round -- its door is at the left-hand end, and the
// eight cells off its right are the strip the cursor crosses on its way down to
// the bench's own board, which is ground that has to belong to neither. So the
// block's sign stands at its door, which is where a sign in front of a house
// goes anyway.
const rightOf = r => r.x + r.w + SIGN_OFF;
const leftOf = x => x - SIGN_OFF - SIGN_W;

const WHERE = {
  lab: () => S.labOpen && rightOf(lab),
  school: () => S.schoolOpen && rightOf(school),
  casino: () => S.casinoOpen && rightOf(casino),
  scrub: () => S.scrubOpen && rightOf(scrub),
  tower: () => S.towerOpen && rightOf(tower),
  // the cut and the plots are ground rather than buildings, and a sign at the
  // near end of either is the only thing that says where one begins
  quarry: () => S.quarryOpen && rightOf(quarry),
  farm: () => S.farmOpen && rightOf(farm),
  house: () => S.crew > 0 && leftOf(houseLeft())
};

export const SIGNS = Object.keys(WHERE);

// Where a station's sign is, or null if there is nothing there to sign. The
// board only: the post hangs below it and is worked out from it, so there is one
// number here and not two that can disagree.
export function signAt(which) {
  const at = WHERE[which];
  if (!at) return null;
  const x = at();
  if (x === false || x == null) return null;
  return { x: Math.round(x / P) * P, y: S.groundY - SIGN_POST - SIGN_H,
           w: SIGN_W, h: SIGN_H };
}

// Standing at one. The reach runs down to the ground and a little past it,
// because the post is as much the sign as the board is, and somebody walking up
// to a sign stops at its foot rather than at its face.
export function atSign(which, x, y) {
  const s = signAt(which);
  if (!s) return false;
  return x > s.x - REACH && x < s.x + s.w + REACH &&
         y > s.y - REACH && y < S.groundY + P * 2;
}

// --- drawing -----------------------------------------------------------------

// White paper with a black edge on a black post, which is what a sign is in this
// yard already: the casino's is the same two colours the same way round.
//
// The one that is open is filled in. Nothing else in the game says "this is the
// thing you are reading" -- the board coming out said it, and the board is up
// where the sky is rather than down where the cursor is -- so the sign you are
// standing at goes solid, and the ones you are not stay paper.
// And what is on the board behind it, said without opening it.
//
// The bench has always done this -- a flag on a post for a heading you have not
// read, a dot for something you could buy this second -- and it did it because
// the bench is the one board you are expected to keep coming back to. Every
// board is that now, and a yard of eight stations where only one of them tells
// you whether it is worth the walk is a yard you cross on spec.
//
// The same two marks, on the same terms, over every sign: one alphabet, so
// having learnt the bench you have learnt all of them. The sign you are actually
// standing at shows neither, because you are reading the board itself.
//
// Both of them are *on* the sign. They used to float clear above it -- the dot
// three cells up, the flag on a second post above the post the board is already
// on -- and at the size these are drawn a cell floating on its own in the air
// reads as a speck of grit rather than as a notice, while a post growing out of
// the top of a post reads as a mast. A notice goes on the board and a flag flies
// from the head of the pole, which is where both of them are now.
function drawMark(ctx, s, mark) {
  if (mark === 'flag') {
    // A short mast off the board's own head with a pennant on it. Two cells of
    // mast, because it has to clear the board and nothing more: the flag is the
    // loudest thing a sign can say and it says it by breaking the line the
    // boards make along the yard, not by being tall.
    ctx.fillRect(s.x + P / 2, s.y - P * 2, P, P * 2);
    ctx.fillRect(s.x + P * 1.5, s.y - P * 2, P * 2, P);
  } else if (mark === 'dot') {
    // A notice pinned in the slot, at the end you read to. A cell and a half
    // rather than a cell: one cell survives at full size and disappears the
    // moment the yard is zoomed out, which is exactly when you are looking
    // across it deciding where to walk.
    ctx.fillRect(s.x + s.w - P * 2.5, s.y + P, P * 1.5, P);
  }
}

export function drawSigns(ctx, markOf = () => '') {
  const open = { lab: S.labBoardOpen, school: S.schoolBoardOpen,
                 casino: S.casinoBoardOpen, scrub: S.scrubBoardOpen,
                 tower: S.towerBoardOpen, quarry: S.quarryBoardOpen,
                 farm: S.farmBoardOpen, house: S.houseBoardOpen };
  for (const which of SIGNS) {
    const s = signAt(which);
    if (!s) continue;
    const mid = s.x + s.w / 2 - P / 2;
    ctx.fillStyle = '#000';
    ctx.fillRect(Math.round(mid / P) * P, s.y + s.h, P, SIGN_POST);   // the post
    // the board: black all through when this is the one you are at, and white
    // with a black edge when it is not
    if (open[which]) {
      ctx.fillRect(s.x, s.y, s.w, s.h);
    } else {
      ctx.fillRect(s.x, s.y, s.w, s.h);
      // A letterbox of paper, one cell tall, not the two-cell square it was.
      // Every building in this yard is a black mass with square white windows
      // cut out of it, and a square of white framed in black on a post is a
      // window on a stick -- it was the one thing about these that read as
      // something else entirely. Nothing here is this shape but a sign.
      ctx.fillStyle = '#fff';
      ctx.fillRect(s.x + P, s.y + P, s.w - P * 2, P);
      ctx.fillStyle = '#000';
      drawMark(ctx, s, markOf(which));      // the one you are at needs no telling
    }
    ctx.fillStyle = '#000';
  }
}
