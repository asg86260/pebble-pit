// The ground each station pays out onto, and the marks that hang over a station:
// the pegged pile strips, the pile-full warning triangle and the offer diamond.
// Extracted verbatim from render.js; behavior unchanged. Owns stripMark,
// drawPileMarks, warning, marksOn, markAnchor, markAt,
// pileMarkAt and overPileMark. The shared primitives come from this folder's own
// leaves: ctx from ./ctx.js and drawTriangle from ./marks.js.

import { STATIONS, hasOffer, standRect, stationFoot } from '../board.js';
import { P } from '../config.js';
import { JOB } from '../jobs.js';
import { S, farm, scrub, sky } from '../state.js';
import { capOf } from '../upgrades.js';
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
  // And a hollow body under any station standing open with nobody on its job:
  // a place with capacity and no hands is stopped just as surely as one with a
  // full pile, and until this mark it said so with nothing. (feedback7, item 26)
  for (const key of Object.keys(JOB_AT)) {
    if (!shortAt(key)) continue;
    const at = shortMarkAt(key);
    shortBody(at.x, at.y);
  }
}

// --- the under-staffed mark ---------------------------------------------------
// Which job a station's headcount is read off. Only the stations whose output is
// a gang's: the bench, the house, the books have no job of their own to be short
// of. The rock is not here either -- its gang is optional by design (you swing
// yourself), so an empty rock is a choice rather than a stall.
const JOB_AT = { quarry: JOB.QUARRY, farm: JOB.FARM, scrub: JOB.PURIFY,
                 tower: JOB.WIZARD, lab: JOB.SCHOLAR, apothecary: JOB.STIR,
                 outhouse: JOB.JANITOR, school: JOB.TEACH };

// Open, with room for a body, and nobody on it. `standRect` is null until the
// station is standing, so a place not yet built shows nothing.
const shortAt = key =>
  !!standRect(key) && S[JOB_AT[key]] === 0 && capOf(JOB_AT[key]) > 0;

// The game's own body glyph, wanting: a worker square with a cross in it. A
// body in this yard is a hollow square -- that is the one shape every player
// has already learned means "somebody" -- and the cross inside is the same
// mark the roster's + button wears, so the sign reads "a body, to be added
// here". It replaced a stick figure that belonged to no drawing in the game.
function shortBody(x, y, r = WARN_R) {
  const u = Math.max(1, Math.round(r / 8));          // one stroke of the sign
  const half = Math.round(r * 0.7);                  // the square, about the body's build
  ctx.fillStyle = '#fff';
  ctx.fillRect(x - half, y - half, half * 2, half * 2);
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 2;
  ctx.strokeRect(x - half, y - half, half * 2, half * 2);
  // the cross, centered, clear of the walls
  const arm = Math.round(half * 0.55);
  ctx.fillStyle = '#000';
  ctx.fillRect(x - arm, y - Math.ceil(u / 2), arm * 2, u);
  ctx.fillRect(x - Math.ceil(u / 2), y - arm, u, arm * 2);
}

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
// How far apart the slots sit, and it follows the marks rather than leading
// them. Six cells was the gap the old, larger signs needed; with smaller ones in
// the same slots the pair stopped reading as a row and started reading as two
// marks that happened to be near each other. Four and a half went too far the
// other way -- the triangle is 5.2 cells across and the diamond 3.2, so their
// half-widths alone come to 4.2 and the two were all but touching.
const SLOT_W = P * 5.5;
// 'short' (feedback7, item 26) joins on the right: a mark never moves because a
// different mark appeared, so a new slot may only ever be appended.
const SLOTS = ['stopped', 'offer', 'short'];   // left to right, and never reordered

// Which of them a station is showing right now.
//
// They used to sit in fixed places whether or not the other was there, on the
// argument that a mark which never moves is a mark you learn the position of.
// That is true of a row of controls and wrong for a pair of signs: one sign
// hanging off to the left of nothing reads as a thing that has come loose. So
// they are centred as a group -- one in the middle, two side by side about the
// middle -- which is what anybody drawing this by hand would have done.
function marksOn(key) {
  const on = [];
  if (S.pileFull[key]) on.push('stopped');
  if (STATIONS.includes(key) && hasOffer(key)) on.push('offer');
  if (JOB_AT[key] && shortAt(key)) on.push('short');
  return on;
}

// The middle of a station's row of slots. Everything that hangs under a station
// is measured from here, so moving a station moves its marks with it.
export function markAnchor(key) {
  const box = key === 'scrub' ? scrub : null;
  const strip = S.piles.find(p => p.key === key);
  // A station's signs hang under the station, and for the quarry and the farm
  // the station is the SHACK. That is where its board hangs and where you stand
  // to open it (`standAt` in board.js), and a sign about what is on that board
  // belongs with it -- a diamond out beside a hole is a diamond about nothing
  // you can walk up to. `stationFoot` is the same answer board.js gives to the
  // same question, so the two can no longer drift apart: this used to reach
  // past the mouth of the quarry with a slot's clearance and to the middle of
  // the plots, both worked out here and neither known to the board.
  const x = key === 'rock' ? S.cx
          : key === 'sky' ? sky.x
          : box ? box.x + box.w / 2
          : (f => f != null ? f
                 : strip ? (strip.from + strip.to) / 2
                 : farm.x + farm.w / 2)(stationFoot(key));
  // Clear of the station itself. The star is four hundred pixels up with no
  // ground under it at all, so its marks hang beneath it where the wizards are;
  // everything else stands on the floor of the yard -- the quarry included,
  // whose signs are under its shack now rather than out over the hole.
  const y = key === 'sky' ? sky.y + sky.r + P * 9 : S.groundY + P * 7;
  return { x: Math.round(x / P) * P, y: Math.round(y / P) * P };
}

// One slot of that row.
export function markAt(key, kind) {
  const at = markAnchor(key);
  // Centred as a group, in the order the slots are declared -- so with one up it
  // is in the middle, and when the second appears they part about the middle
  // rather than one of them staying put and the other arriving beside it.
  const on = marksOn(key);
  const i = on.indexOf(kind);
  if (i < 0) return { x: at.x, y: at.y };     // asked about one that is not up
  const left = at.x - (on.length * SLOT_W) / 2 + SLOT_W / 2;
  return { x: Math.round((left + i * SLOT_W) / P) * P, y: at.y };
}

export function pileMarkAt(key) {
  return markAt(key, 'stopped');
}

// The under-staffed mark's slot, the same shape as pileMarkAt so whoever wires
// the tooltip ("nobody works here" -- input.js, not this file's to edit) reads
// the position off the same row of slots the drawing uses.
export function shortMarkAt(key) {
  return markAt(key, 'short');
}

// The same half-slot ask for the hollow body, answered with the station's key
// so the caller does not need this file's JOB_AT table to walk the stations.
export function overShortMark(mx, my) {
  for (const key of Object.keys(JOB_AT)) {
    if (!shortAt(key)) continue;
    const at = shortMarkAt(key);
    if (Math.abs(mx - at.x) < SLOT_W / 2 && Math.abs(my - at.y) < P * 4) return key;
  }
  return null;
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
