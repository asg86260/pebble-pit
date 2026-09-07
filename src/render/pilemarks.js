// The ground each station pays out onto, and the marks that hang over a station:
// the pegged pile strips, the pile-full warning triangle and the offer diamond.
// Extracted verbatim from render.js; behavior unchanged. Owns stripMark,
// drawPileMarks, warning, pileMarkAt and overPileMark. The shared primitives come from this folder's own
// leaves: ctx from ./ctx.js and drawTriangle from ./marks.js.

import { stationFoot } from '../board.js';
import { P } from '../config.js';
import { S, farm, sky } from '../state.js';
import { ctx } from './ctx.js';
import { drawTriangle } from './marks.js';

// --- the ground a station pays out on to -------------------------------------
//
// Every strip in `S.piles` is ground that belongs to somebody, and until this
// went in an empty strip was indistinguishable from the bare walk either side of
// it: there was no way to see where the quarry's stone was going to land, or how
// much room the farm had left before it jammed. So the ground is marked, the way
// a plot is marked before anything is built on it -- a peg at each end with its
// foot turned inwards, a dashed run between them, and the thing that piles here
// standing in the middle of it.
//
// It reads the strips and nothing else. There is no table of positions per
// station in here and there must never be one: the ends come off `from` and
// `to`, the middle is halfway between them, and what it holds comes off
// `PILE_HOLDS`, which defaults to dust. A station added to `SITES` tomorrow gets
// its pegs with no new code -- which is the whole point, and is the opposite of
// what the warning marks below used to do (they named two keys and sent
// everything else to the farm, and two stations spent a while with their signs
// three thousand pixels from the thing that had stopped).
// The strips themselves are unmarked ground now. They wore a crate each for a
// while (item 8 of feedback5 took the crates out), then a glyph or a grey
// mound cut into the ground saying what piles there -- and the glyphs went the
// same way the crates did: a row of icons along a ground line that already
// carries the heaps themselves, which are their own best label. What lands
// where is visible because it lands there.

// A station whose pile is full has stopped, and says so: a bar over it, which is
// the one mark in the game that means nothing is happening. It sits above the
// station rather than above the pile, because the station is the thing that has
// stopped and the pile is only why.
export function drawPileMarks() {
  ctx.fillStyle = '#000';
  // The hole is one of them. A full pit stops the haulers exactly the way a full
  // pile stops a gang, and a crew that stands down with nothing on screen to say
  // why reads as a game that has broken rather than as a hole you have to dig.
  // It stands on the near lip, on the ground the haulers walk to and are not
  // walking to now -- and to the left of it, because the counter is to the right.
  // No mark over the hole. It used to carry the same warning a stopped station
  // does -- a triangle and "the hole is full" under the cursor -- because a full
  // hole stopped the yard and you needed telling why. It cannot stop anything
  // now: the first grain it will not take tears it open and the rest goes
  // through the rift (see `throughRift` in pit.js). A warning about a thing that
  // no longer happens is a warning that teaches you to ignore warnings.
  for (const p of S.piles) {
    if (!S.pileFull[p.key]) continue;
    const at = pileMarkAt(p.key);
    // a warning triangle: hollow, with a bar and a dot inside it. A triangle
    // sits low in its own outline, so the mark hangs below the middle of it.
    warning(at.x, at.y);
  }
}

// (The under-staffed mark -- feedback7 item 26, a figure under any station
// with nobody on its job -- lived here until review dropped it: the drop-zone
// arrows and the roster row already carry the same fact, and three signs for
// one absence is two too many.)

// a warning triangle: hollow, with a bar and a dot inside it. A triangle sits
// low in its own outline, so the mark hangs below the middle of it.
//
// One radius, and everything inside is a fraction of it. The bar and the dot
// used to be four numbers of their own, which meant the triangle could only ever
// be the size those four numbers had been picked for -- shrink it and the mark
// inside stayed put and burst out through the side. The shape has one dimension
// now and changing it changes the whole sign.
const WARN_R = P * 2.6;
function warning(x, y, r = WARN_R) {
  drawTriangle(x, y, r, true);
  ctx.fillStyle = '#000';
  // the mark sits inside the outline rather than on it: a triangle's base is its
  // lowest edge, and a dot resting on that reads as a smudge
  ctx.fillRect(x - r / 8, y - r / 4, r / 4, r * 0.4);
  ctx.fillRect(x - r / 8, y + r * 0.35, r / 4, r / 4);
}

// Under the station, not over it: the pile is the station's problem and the mark
// belongs with the thing that has stopped, and there is nothing else down there
// to read it against. It sits below the ground line, in the space the pit's
// depth already keeps clear on screen.
// Every strip in `S.piles` gets one of these, so every station has to have an
// answer here. It used to name two keys and send everything else to the farm --
// which was fine while there were three piles, and became wrong the moment the
// scrubbing house and the star got strips of their own: both of them stopped
// with their warning hanging over the farm, three thousand pixels from the thing
// that had stopped. A station added tomorrow gets the middle of its own heap
// without anybody remembering to come back here.
// --- where a station's marks go -------------------------------------------------
// Two things can hang under a station: a bar saying it has stopped, and a
// pointer saying its board has something on it. They used to work out their own
// positions independently -- one off `stationFoot`, one off the pile's strip,
// each with its own idea of how far under the line to sit -- and the answer was
// that they landed on top of each other at some stations and a long way apart at
// others, with nothing anywhere deciding which.
//
// So there is a row of **slots** under each station, and each kind of mark has
// one. A slot is a place, not a queue: the pointer sits in the same spot whether
// or not the bar is showing, so a mark never moves because a different mark
// appeared. That is the whole of what makes a row of icons readable -- you learn
// where to look once.
// How wide a mark's own patch of ground is, for the hover test below.
const SLOT_W = P * 5.5;

// Where the stopped mark hangs: under the PILE, in the middle of the strip
// that has filled up.
//
// There was a row of slots here, and a table deciding which mark took which
// place in it. Both other marks are gone -- the offer diamond became the flag
// on the roof, the under-staffed figure was dropped -- and one mark does not
// need a row: what is left is one sign with one place to be.
//
// That place is the pile, not the station. It used to hang under the station,
// which was right for a sign about a board and wrong for this one: what has
// stopped is the gang, and why is a heap of stone lying somewhere else. The
// heap is the thing to walk to and the thing to look at, and the station's own
// ground is where the roster stands now -- the two were overlapping there.
export function pileMarkAt(key) {
  const strip = S.piles.find(p => p.key === key);
  // The star's dust hangs in the air with no ground under it, so its mark
  // stays under the meteor where the wizards are. Everything else has a strip
  // on the floor of the yard; a key with neither falls back to the station.
  const x = key === 'sky' ? sky.x
          : strip ? (strip.from + strip.to) / 2
          : key === 'rock' ? S.cx
          : (f => f != null ? f : farm.x + farm.w / 2)(stationFoot(key));
  const y = key === 'sky' ? sky.y + sky.r + P * 9 : S.groundY + P * 7;
  return { x: Math.round(x / P) * P, y: Math.round(y / P) * P };
}

// where the cursor has to be to be asking about one
export function overPileMark(key, mx, my) {
  const at = pileMarkAt(key);
  // Half a slot, so the two marks can never both answer to the same cursor.
  // This was a flat five cells, which was inside the six-cell gap and is wider
  // than the gap now -- hovering the diamond would have asked about the triangle
  // as well, and whichever was tested first would have won.
  return Math.abs(mx - at.x) < SLOT_W / 2 && Math.abs(my - at.y) < P * 4;
}

// The things the sites give up, lying where they came to rest. Each has a body
// two cells square and its glyph fills it, so what you see is what it is and
// what it collides as -- which is why they stack now instead of overlapping.


// The lab: a squat block with a chimney. Flat black shapes, like everything
// else that stands on this ground. (Its own note is over drawLab.)


// The school. A long block with a belfry over the door and a row of tall narrow
// windows -- read against the lab, which is a tall body with one chimney, and
// against the crew's own place, which is a stack of one-cell rooms. One of them
// is where something is cooked up out of sight, one is where people sleep, and
// this is the one people walk into and come out of again. The silhouettes have
// to say which is which from across the yard, because that is all you can see of
// any of them.
//
// Every edge is a whole cell. It was laid out in fractions of the building's
// width at first, which put the door and the belfry slot a third of a pixel off
// the lattice and drew them with a grey fringe -- the same hairline the whole
// game is arranged to avoid.
