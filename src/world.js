// Where everything in the world is, and what parts of the ground are spoken for.
//
// The world is a fixed size and never rearranges: the window is only a view onto
// it, and a small window scrolls rather than squashing everything together. Sites
// are placed by their distance from the rock, so adding one is a distance in
// config.js and a line in `layout` below.

import { P, CELL, SKY, TO_SKY, SKY_UP, SKY_R, TO_BENCH, TO_QUARRY, TO_LEDGE, GROUND_LEFT,
        ROCK_CLEAR, BANK_SLOPE, ROCK_PILE_TO, PILE_GAP, PILE_STANDOFF, heapBase, PIT_H,
        SITES, TO_FIRST_SITE,
        PIT_W_MAX, PIT_PAD, FLOOR_MARGIN, WORKER, DEVICE_PIXELS, QUARRY_W, QUARRY_H, SHAKE_RATE,
        SHAKE_DECAY, TO_FARM, TO_LAB, TO_SCHOOL, TO_CASINO, CASINO_W, CASINO_H, TO_SCRUB,
        SCRUB_W, SCRUB_H, SCHOOL_W, SCHOOL_H, LAB_W, LAB_H, FARM_PLOTS0, FARM_PLOTS_MAX, FARM_GAP, FARM_H,
        BENCH_W, QUARRY_BENCH0, QUARRY_BENCH_MAX, QUARRY_DEEPEN, LOOSE_DEEP, SCRUB_CHUTE , TO_TOWER, TOWER_W, TOWER_H, TO_OUTHOUSE, OUTHOUSE_W, OUTHOUSE_H } from './config.js';
import { frames } from './clock.js';
import { S, floor, pit, bench, quarry, farm, lab, sky, school, casino, scrub, table , tower, outhouse, rift } from './state.js';
import { seatRift } from './rift.js';
import { shapePit } from './pit.js';
import { wakeGrid } from './grid.js';

const canvas = document.getElementById('c');

// The only hole in the ground is the pit. The rock stands behind the ground,
// not on it: spoil heaps in front of its foot and the crew walk past it, which
// is what a hill at the back of a yard looks like.
export const overPitMouth = x => x + P > pit.x && x < pit.x + pit.w;
// The mouth of the quarry, the same shape of question for the other hole in
// the ground: is a grain over open air here rather than over anything it could
// come to rest on. Asked while the quarry is shut too -- there is no mouth to
// be over then, and the columns simply never match.
export const overCutMouth = x => S.quarryOpen && x + P > quarry.x && x < quarry.x + quarry.w;
// The rock is anchored by its middle, so an odd width would put this edge half
// a cell off the grid -- and half a cell is a fraction of a device pixel, which
// the canvas draws as a hairline down every seam. Snapped, so a rock loaded from
// an older save stands square too. Everything about the rock measures from here.
export const rockLeft = () => Math.round((S.cx - (S.gw / 2) * P) / P) * P;
// Every station piles to its right, into a strip of ground that belongs to it,
// and each strip stops short of the next station along. Nothing may heap
// anywhere else, so the ground between them stays bare and every pile is
// legibly somebody's -- and a pile that fills is that station's problem rather
// than the whole yard's.
//
// They are worked out when the world is laid out and when the rock changes size,
// not per column: `blocked` is asked about a column thousands of times a frame.
// --- how big the two growing sites are ---------------------------------------
// The quarry and the farm are the only places in the yard that get bigger for
// what they themselves give up. Both grow the same way: one more bench, one
// more plot, one more body that has somewhere to stand. Everything that has to
// know how big they are asks here, so a purchase changes one number and the
// world, the roster and the shop all follow it.
export const benches = () => Math.min(QUARRY_BENCH_MAX, QUARRY_BENCH0 + S.benchLevel);
export const quarryDepth = () => QUARRY_H + S.benchLevel * QUARRY_DEEPEN;
export const plotCount = () => Math.min(FARM_PLOTS_MAX, FARM_PLOTS0 + S.plotLevel);

// A site that has just grown. It is not a relayout: nothing else in the yard
// moves, and the pile strips are the one thing beside the site itself that has
// to be told, because a wider farm is a shorter run of ground to heap on.
export function resite() {
  quarry.h = quarryDepth();
  farm.w = (plotCount() - 1) * FARM_GAP;
  refreshPiles();
}

// Where a station's kit lies when nobody is wearing it, and where a body walks
// to put it on or take it off. One place decides it, so the pile of helmets you
// can see on the ground and the spot a worker walks to are the same spot by
// construction rather than by two files agreeing.
//
// Out to the *left* of the station, which is the way the yard runs -- and clear
// of the work itself: the rock's is in the bare apron, the lip's is back from
// the edge, and the two holes have theirs on the ground beside the mouth.
// Whether a point on the ground belongs to a given station. It is the same
// reach the boards use to decide you are standing at one: what you can walk up
// to and open is what you can be put down on and carry on working at.
export function atStation(job, x) {
  if (job === 'labbers') return S.labOpen && x > lab.x - P * 6 && x < lab.x + lab.w + P * 6;
  if (job === 'scrubbers') return S.scrubOpen && x > scrub.x - P * 6 && x < scrub.x + scrub.w + P * 6;
  if (job === 'rifters') return S.riftOpen && x > rift.x - P * 6 && x < rift.x + rift.w + P * 6;
  if (job === 'farmhands') return S.farmOpen && x > farm.x - P * 10 && x < farm.x + farm.w + P * 10;
  if (job === 'quarriers') return S.quarryOpen && x > quarry.x - P * 6 && x < quarry.x + quarry.w + P * 6;
  if (job === 'miners') return S.gw > 0 && x > rockLeft() - P * 4 && x < rockLeft() + S.gw * P + P * 4;
  return true;                     // carrying is done wherever the dust is
}

export const kitX = job =>
  job === 'miners' ? rockLeft() - P * 4 :
  // well back from the lip: the full-hole warning stands five cells short of
  // the edge, and a trestle under a warning triangle is two marks in one place
  job === 'haulers' ? pit.x - P * 16 :
  // clear of the bridge: the ramp up to the deck starts right at the mouth, and
  // a trestle standing on a slope is a trestle about to fall over
  job === 'quarriers' ? quarry.x - BRIDGE_RUN - P * 5 :
  // clear of the first plot and of whoever is stooping over it: a farmhand
  // stands a body's width off its plot, which is where a stand four cells out
  // would be standing too
  job === 'farmhands' ? farm.x - P * 18 :
  // The wizards' stand is at the foot of the tower, because the tower is what
  // makes them: a hat on a stand outside the door of the place it was made in.
  job === 'wizards' ? tower.x - P * 8 :
  // And the janitors' outside the closet, which is where their caps come from --
  // the shed keeps them, the way the tower keeps the cones. Clear to the left of
  // the front, because the door is cut in the middle of it and a stand across a
  // doorway is a stand somebody has to walk round to get in.
  job === 'janitors' ? outhouse.x - P * 6 : null;

// The strips as they stand, and whether they still describe the yard.
//
// `refreshPiles` lays them once and they are kept, so every door that opens a
// place has to remember to lay them again -- and of all the doors in the game
// exactly one did. The scrubbing house laid its ground; the sky did not, so the
// first star's sparks came down on ground that was nobody's strip, took the
// scatter a bare patch takes, and every one after that walked the length of the
// yard looking for a column with room in it.
//
// So the doors are not asked any more. What the strips depend on is written
// here, beside the strips, and the ground is laid again when it changes: a new
// site gets its strip by existing rather than by remembering.
let laid = null;
export function layPiles() {
  const now = `${S.scrubOpen}|${S.meteorOpen}|${Math.round(sky.x)}`;
  if (now === laid) return;
  laid = now;
  refreshPiles();
}

// Walk the table and hand every site its ground.
//
// Right to left from the rock, because the rock and the lip are the two things
// that may never move: `S.worldW` is measured off `pit.x`, `floor.cols` off
// `S.worldW`, and a changed `floor.cols` invalidates every saved floor grid. So
// the walk starts at a fixed point and everything else follows from the table.
//
// A site's heap is placed in the same step that reserves its ground, which is
// the whole point. `heap()` used to build the strips afterwards from the placed
// buildings and clamp the far end against a neighbour -- so a strip could come
// back with its end left of its start, and a yard with an inverted strip hangs
// at boot. Here the near end and the far end are both produced by one cursor
// walking one way, and an inverted strip is not a thing that can be expressed.
//
// Returns a map of key -> { x, w } and the strips, in yard order.
export function placeSites() {
  const snap = v => Math.round(v / P) * P;
  const at = {}, strips = [];
  // Anchored on `S.cx`, which never moves -- NOT on `rockLeft()`, which moves
  // with the rock. The first draft started the walk at the rock's left edge and
  // tied a knot: the biggest rock is sized by how much room there is before the
  // bench, the bench was placed relative to the rock's edge, and the rock's edge
  // is where its width put it. The yard came up with a bench a hundred and
  // thirty pixels out and a rock taller than it was wide.
  let x = snap(S.cx - TO_FIRST_SITE);

  for (const row of SITES) {
    const w = snap(row.w());
    const pileW = row.pile ? heapBase(row.pile) * P : 0;

    if (row.side === 'left') {
      // The scrubbing house: its spout is on the left wall, so its heap lies on
      // that side and the walk meets the building before the ground it pays on to.
      const left = snap(x - w);
      at[row.key] = { x: left, w };
      if (pileW) {
        const to = snap(left - row.standoff);
        strips.push({ key: row.pile, from: to - pileW, to });
        x = to - pileW;
      } else x = left;
    } else {
      // Everything else throws towards the rock, so its heap is on its right and
      // the walk meets the heap first.
      const to = x;
      const from = to - pileW;
      if (pileW) strips.push({ key: row.pile, from, to });
      const left = snap(from - row.standoff - w);
      at[row.key] = { x: left, w };
      x = left;
    }
    x = snap(x - row.gap);
  }

  // The rock's own spoil is NOT in here, and that is deliberate. Every strip the
  // walk produces belongs to a building that stands still, so it can be worked
  // out once; the rock's near end is `rockLeft() + S.gw * P`, and the rock is a
  // different size for every boulder. Frozen at layout time it went stale the
  // moment a smaller rock came down -- `pileAt` then called columns bare that
  // were in the heap, the ceiling for them was `LOOSE_DEEP` instead of the
  // slope, and the spoil stood twelve cells against the boulder. It is rebuilt
  // live in `refreshPiles`, where it can follow the thing it belongs to.
  strips.sort((a, b) => a.from - b.from);

  // And the one rule a strip has to satisfy, checked here rather than trusted.
  //
  // Three cells is a hard floor, not a taste: `bankCeiling` is zero at both end
  // columns of a strip, so a strip under three cells wide has no column that can
  // hold a single grain -- dust thrown at it would walk off looking for
  // somewhere else and pile up in a neighbour's heap. Loudly, because the
  // failure this replaces was silent: a clamped strip inverted, and the yard
  // hung at boot with nothing said about why.
  for (let i = 0; i < strips.length; i++) {
    const p = strips[i];
    if (!(p.to - p.from >= 3 * P))
      throw new Error(`the ${p.key} heap has no room: ${p.from}..${p.to}. `
                    + `Widen a gap in SITES, or lower PILE_LIMIT.${p.key}.`);
    if (i && p.from < strips[i - 1].to)
      throw new Error(`the ${p.key} heap overlaps the ${strips[i - 1].key} heap: `
                    + `${p.from} is left of ${strips[i - 1].to}.`);
  }
  return { at, strips };
}

export function refreshPiles() {
  laid = `${S.scrubOpen}|${S.meteorOpen}|${Math.round(sky.x)}`;
  S.piles = [
    // The ground under the star, for what the wizards knock off it. Four hundred
    // pixels up is still a station, and what a station makes has to have
    // somewhere of its own to land. It is the one strip not in the SITES table,
    // because the thing that owns it does not stand on the ground and so has no
    // place in a walk along it.
    ...(S.meteorOpen ? [skyHeap()] : []),
    // And the rest off the same walk that reserved the ground for them, in
    // `placeSites`. They used to be rebuilt here from where the buildings had
    // ended up, with `heap()` clamping the far end against a neighbour -- which
    // is how a strip came back with its end left of its start, and a yard with
    // an inverted strip hangs at boot.
    //
    // The ground is reserved from the moment the table names a site; the strip
    // only *appears* once the site it belongs to is standing, because until then
    // nothing pays out on to it. That is the whole of the difference between
    // reserving a spot and opening one.
    ...(S.strips || []).filter(p => p.key !== 'scrub' || S.scrubOpen),
    // and the rock's, worked out fresh every time, because the rock it stands
    // off from is a different size for every boulder
    { key: 'rock', from: rockLeft() + S.gw * P + ROCK_CLEAR, to: S.cx + ROCK_PILE_TO }
  ].sort((a, b) => a.from - b.from);   // `yardLeft` reads the leftmost
  // The strips are what `blocked` and `bankCeiling` are written against, so a
  // column that had settled did so under the old ones. A wider rock, a station
  // opening, the star drifting: any of them can hand a column ground it did not
  // have or a ceiling it may no longer reach, and a column that is asleep would
  // never find out. So the floor gets one full look after every relaying -- it
  // is a handful of times a run, and it costs one ordinary pass.
  wakeGrid(floor);
}


// The ground under the star, centred on it: sparks fall straight down, so the
// strip is under where they fall rather than off to one side of it.
function skyHeap() {
  const half = (heapBase('sky') / 2) * P;
  const mid = Math.round(sky.x / P) * P;
  return { key: 'sky', from: mid - half, to: mid + half };
}

// The ground under the recycler's spout, running left from the wall.
function scrubHeap() {
  const to = Math.round((scrub.x - P) / P) * P;
  return { key: 'scrub', from: to - heapBase('scrub') * P, to };
}

// A site's strip is cut down to the width its limit actually needs, so what it
// makes heaps up into a mound instead of lying along the whole run to the next
// station. The far end is the ground it may not cross whatever the numbers say,
// so a big enough limit gives back the old scatter rather than burying the
// neighbour. It stays against its own station: the pile is that station's, and
// it is where the throw already aims.
function heap(key, from, end) {
  const to = Math.round((from + heapBase(key) * P) / P) * P;
  return { key, from, to: Math.min(to, end) };
}

// which pile a spot on the ground belongs to, or null for the bare ground between
export function pileAt(x) {
  for (const p of S.piles) if (x + P > p.from && x < p.to) return p;
  return null;
}

// The left-hand end of the ground the crew work on. It was the first pile,
// because until the scrubbing house went up the first pile was the leftmost
// thing in the yard and everything beyond it was ground nobody could reach.
//
// The house broke that. It stands at the quiet end of the walk, a long way left
// of the farm's heap, and it is a place the crew go: bodies walk out there to
// man it, and its chute drops real grains on the ground beside it. Left at the
// pile, every one of those grains came down on a barred column -- so `addGrain`
// walked outward looking for one that was not and put it in the farm's heap, a
// hundred cells away. The spout paid out, the counter went up, and nothing ever
// appeared under the spout: dust that looked like it worked and never arrived.
export const yardLeft = () =>
  Math.min(S.piles[0] ? S.piles[0].from : 0,
           // the ground under the chute's reach, which is what it pays on to
           S.scrubOpen ? scrub.x - P * SCRUB_CHUTE : Infinity,
           // and the ground under the meteor, which is the same case again: the
           // rind of it comes down as real dust on real ground, out past the
           // tower, and a barred column there would send every grain of it to
           // the farm's heap without anybody carrying it.
           S.meteorOpen ? sky.x - sky.r - P * 2 : Infinity);
// The ground past the far wall of the hole. It is not a station's strip and
// nothing heaps there on purpose, but a throw that clears the pit has to land
// somewhere, and the somewhere is the floor -- so dust is allowed to lie there
// and be fetched back like anything else.
export const pastPit = x => x >= pit.x + pit.w;
// Where a grain may not come to rest, and it is three places: under the rock and
// over the two mouths. Everywhere else in the world is ground.
//
// It used to be everywhere that was not a station's strip or the ground past the
// hole, which made the piles the only places dust could exist. Drop a grain on the
// bare ground between two stations and `addGrain` found the column full, walked
// outward looking for one that was not, and put it in the nearest heap -- so
// anything you let go of in the open snapped into a pile a hundred cells away.
//
// A pile is where the crew *put* dust, not where dust is allowed to be. Loose
// grains lie where they land, and what keeps the yard from turning into one flat
// beach is the ceiling below, which lets a strip heap up and lets bare ground
// hold no more than a scatter.
//
// Three places stay shut, and they are the three that are not ground.
//
// Over the mouth of the quarry and over
// the mouth of the hole, because neither of those is somewhere to stand a grain:
// they are openings, and dust lying across an opening is dust lying on nothing.
// Dust that reaches the hole goes *in* it, which is the whole point of the hole.
// And under the boulder, because that is not ground either: it is rock.
//
// The ground off the left-hand end of the yard used to be a fourth, on the
// grounds that the crew are held between the first pile and the lip, so a grain
// out there was stranded. It is not stranded. Your own cursor sweeps wherever
// the camera goes and the camera goes to the left edge of the world, so that
// ground is yours to gather rather than theirs to fetch -- and it takes the
// same scatter bare ground takes anywhere. The crew's bounds do not move:
// `yardLeft` is still where they stop walking, and `nearestDust` will not claim
// a column past it.
export const blocked = c => {
  const x = floor.x + c * P;
  // The boulder's own footprint, and nothing wider than it. The clearance either
  // side of it is ground, and this is the second go at saying so.
  //
  // It was opened once before and put back, because opening the whole apron
  // broke three separate things. Each of them has an answer now, and the answers
  // are elsewhere rather than here:
  //
  //   1. `clearApron` used to shovel the clearance into the nearest column that
  //      would take it -- the first column of the rock's own heap, which then
  //      stood twelve cells against the boulder. It throws now, on the same arc
  //      a miner's spoil takes, so the sweepings land out along the heap like
  //      everything else that is thrown at it.
  //   2. A bank standing up against the hill: `bankCeiling` treats the footprint
  //      as the cliff it used to treat the apron as, so the clearance takes a
  //      low scatter that shades up into the heap instead of a wall.
  //   3. The heap's standoff: the strips come out of the SITES table and out of
  //      `rockLeft()`, never out of where dust happens to be lying, so the heap
  //      stands off the rock by `ROCK_CLEAR` whatever is on the ground.
  //
// What is left is the one thing that was never a matter of taste: a grain may
  // not come to rest inside a rock. The footprint moves with every boulder, so
  // it is asked of `rockLeft()` and `S.gw` rather than of anything remembered.
  //
  // Inside it, and not on top of it. The hill stopped blocking dust the day it
  // got a surface of its own: a chip that comes down over the crest lands ON the
  // outline as it has actually been mined and lies there until a miner throws it
  // on the heap. That is `rockSand` in rock.js, and it is a layer above this
  // grid rather than a column in it -- the same shape of answer the cut's mouth
  // got. What this line still bars is the yard's own floor running in under the
  // boulder's foot, which is not a surface at all.
  // The quarry's mouth is not barred any more either: a grain over the open cut
  // does not rest on the opening, it falls INTO it -- the chip loop intercepts
  // it into the cut's own grid, the way the pit has always taken its dust.
  if (pastRock(x) < 0) return true;
  if (overPitMouth(x)) return true;
  return false;
};

// which pile a station's own output belongs in
export const pileOf = key => S.piles.find(p => p.key === key);

// How far past the boulder's own footprint a column is, in cells, or -1 for one
// standing under it. Measured off `rockLeft()` and `S.gw`, so it follows the
// rock: a narrower boulder gives back the ground the last one stood on.
//
// This used to be `pastApron` and was measured off the apron -- the footprint
// plus `ROCK_CLEAR` either side -- because the apron was what `blocked` barred.
// The clearance is ground now, and the only thing here that is not is the rock.
export const pastRock = x => {
  const near = rockLeft(), far = rockLeft() + S.gw * P;
  return x + P <= near ? (near - (x + P)) / P : x >= far ? (x - far) / P : -1;
};

// How high the ground may stand in a column. The cliffs in this yard that the
// sand cannot slump over are the rock's footprint and the near lip of the hole.
// A bank beside either would stand up as a sheer wall -- and a bank that reached
// the lip would tip itself in, four cells at a time, and bank the whole yard for
// free with nobody carrying anything. So a bank may only rise as it gets away
// from them, and it lies as a thin scatter against them. Between them there is
// as much room as the slope allows.
export const bankCeiling = c => {
  const x = floor.x + c * P;
  // The ground past the far wall of the hole is the fourth cliff, and the only
  // one dust is allowed to lie against. A throw that cleared the pit has to come
  // down somewhere, and letting the ceiling stay nought there was what quietly
  // sent it back: every column over there was full, so `addGrain` walked outward
  // looking for one that was not and put the grain down on the near side --
  // which reads as the throw being snatched back to the left.
  //
  // It rises as it gets away from the wall, like every other bank here, so it
  // cannot stand up against the hole and tip itself in.
  if (pastPit(x)) return Math.max(0, (x + P - (pit.x + pit.w)) / P) * BANK_SLOPE;
  const p = pileAt(x);
  // Bare ground takes a scatter and no more. It is not a station's strip and
  // nothing heaps here on purpose, but a grain dropped here has to be able to
  // stay: nought means "full", and full means `addGrain` goes looking for
  // somewhere else and the grain you dropped ends up in a pile you were not
  // pointing at.
  //
  // Except against the hill, which is the cliff this whole rule exists for. The
  // clearance either side of the boulder is bare ground now, and a scatter
  // standing its full depth hard against the rock is the same sheer wall in
  // miniature. So it rises away from the footprint on the arithmetic every other
  // bank here rises on, and levels off at the scatter -- which reads as a low
  // ramp out of the foot of the hill and up into the heap beyond it.
  if (!p) return Math.min(LOOSE_DEEP, Math.max(0, pastRock(x)) * BANK_SLOPE);
  // both ends of a pile are cliffs the sand may not lean on: the station behind
  // it and the bare ground in front of it. So it rises only as it gets away from
  // them, which is what stops it standing up as a wall against either.
  const toEnd = Math.min((x + P - p.from) / P, (p.to - (x + P)) / P);
  return Math.max(0, toEnd) * BANK_SLOPE;
};

// the outside of the rock's apron on one side: spoil and cores are aimed past it
export const rockEdge = side =>
  side < 0 ? rockLeft() - ROCK_CLEAR : rockLeft() + S.gw * P + ROCK_CLEAR;

// Where a worker's feet go, given the surface it is standing on. Everything on
// the ground shares one baseline: snapped to the pixel grid so a row of them
// lines up, and never below the ground line, so nobody sinks into the earth.
export function standOn(surfaceY) {
  const y = Math.min(surfaceY, S.groundY) - WORKER;
  return Math.round(y / P) * P;
}

// The bridge over the quarry: a ramp up, a flat deck over the mouth, a ramp
// down, and the crew walk every bit of it. Twenty degrees is a rise of four
// cells over a run of eleven -- 19.98 degrees, which is as close to twenty as
// this lattice gets, and both ends land on a whole cell.
export const BRIDGE_RISE = P * 4;
export const BRIDGE_RUN = P * 11;

export function bridgeSpan() {
  const d0 = Math.round(quarry.x / P) * P;                 // the deck covers the mouth
  const d1 = Math.round((quarry.x + quarry.w) / P) * P;
  return { x0: d0 - BRIDGE_RUN, d0, d1, x1: d1 + BRIDGE_RUN,
           top: S.groundY - BRIDGE_RISE };
}

// The surface underfoot at x. Everywhere in the world this is just the ground
// line; over the quarry it is whichever part of the bridge is above that point.
// Before the quarry is opened there is no bridge and no hole, so it is ground
// there too.
export function groundAt(x) {
  if (!S.quarryOpen) return S.groundY;
  const { x0, d0, d1, x1, top } = bridgeSpan();
  if (x <= x0 || x >= x1) return S.groundY;
  if (x < d0) return S.groundY - BRIDGE_RISE * (x - x0) / BRIDGE_RUN;   // up the near ramp
  if (x > d1) return S.groundY - BRIDGE_RISE * (x1 - x) / BRIDGE_RUN;   // down the far one
  return top;                                                           // across the deck
}

// Where a walker's top edge goes at x. Not snapped to the lattice the way
// standOn is: on a ramp that would step the crew up in six-pixel jumps and
// leave them floating off a line drawn straight.
export const walkY = x => Math.min(groundAt(x), S.groundY) - WORKER;


// --- layout -----------------------------------------------------------------
// The world is a fixed size and never rearranges: the window is only a view onto
// it, and a small window scrolls rather than squashing everything together.
export function resize(after) {
  // the canvas is told its size outright, in its own inline style and in device
  // pixels, so it does not depend on the stylesheet or on measuring anything
  S.W = Math.max(320, document.documentElement.clientWidth || innerWidth || 320);
  S.H = Math.max(240, document.documentElement.clientHeight || innerHeight || 240);
  // Draw at the screen's real resolution, not a capped one: a phone reports 3
  // and looked soft at 2. Back off only if the backing store would get silly --
  // fill rate is what costs, and that is what the budget is counted in.
  //
  // The ratio is then rounded so that a cell is a whole number of device pixels.
  // That is not tidiness: a cell drawn across a fraction of a device pixel is a
  // cell antialiased against the page, and the seam between two of them comes
  // out grey. It is the same rule as every world position being a whole cell.
  const want = Math.max(1, devicePixelRatio || 1);
  const fit = Math.min(want, Math.sqrt(DEVICE_PIXELS / (S.W * S.H)));
  S.dpr = Math.max(1, Math.round(CELL * fit)) / CELL;

  canvas.style.position = 'fixed';
  canvas.style.left = '0';
  canvas.style.top = '0';
  canvas.style.zIndex = '0';
  canvas.style.width = `${S.W}px`;
  canvas.style.height = `${S.H}px`;
  canvas.width = Math.round(S.W * S.dpr);
  canvas.height = Math.round(S.H * S.dpr);

  // The picture is always the same size. A small window does not shrink the
  // yard, it just shows less of it: a cell is a cell whatever you are looking
  // at this on, and the works is a fixed thing you scroll along rather than a
  // thing that rearranges itself around your window. The game asks for about
  // 830px of height to show the sky, the ground and the whole depth of the pit;
  // anything shorter loses sky off the top, which is the part with nothing in it.
  S.zoom = CELL / P;
  S.viewW = S.W / S.zoom;
  S.viewH = S.H / S.zoom;

  // fixed places, laid out once and never moved
  S.groundY = SKY;
  S.cx = GROUND_LEFT;

  // The lip is a fixed distance from the rock and never moves. How far the hole
  // runs from it is how far it has been dug, which is not a thing the layout
  // decides -- see shapePit.
  pit.x = S.cx + TO_LEDGE;
  shapePit();

  // Everything on the ground comes off one walk of the SITES table. Each box
  // still says how TALL it is -- height is a fact about the building, not about
  // the yard -- but where it stands is the table's business now, and the strips
  // its heap lies on are produced by the same pass rather than worked out
  // afterwards from where the buildings ended up.
  const placed = placeSites();
  S.placed = placed.at;
  S.strips = placed.strips;
  const seat = (box, key, h) => {
    const spot = placed.at[key];
    box.w = spot.w; box.h = h; box.x = spot.x; box.y = S.groundY - h;
  };

  seat(bench, 'bench', P * 7);

  // the one thing that is not on the ground
  sky.x = S.cx + TO_SKY;
  sky.y = S.groundY - SKY_UP;
  sky.r = SKY_R;

  // The school stands on the bare ground between the quarry's spoil and the
  // crew's front doors: where you go to learn a trade is on the way to work.
  seat(school, 'school', SCHOOL_H);

  seat(lab, 'lab', LAB_H);

  // Past the lab, at the quiet end of the walk. What it does is about the sky
  // over the whole yard rather than about any one site, so it does not belong
  // among the places that dig -- and the walk out to it is the last of the
  // walks, which is what the cores have bought all the way along.
  seat(scrub, 'scrub', SCRUB_H);

  // The rift, which is not seated with the rest: it does not stand among the
  // buildings at all. It is past the far wall of the hole, in ground that was
  // already there -- see `seatRift`.
  seatRift();

  // The last thing on the ground. Everything the cores open lies further out
  // than the last, and the one place that makes nothing is the longest walk.
  seat(casino, 'casino', CASINO_H);

  // The outhouse, on the bare strip between the school and the rooms: no pile
  // claims that ground and it is where the crew already are.
  seat(outhouse, 'outhouse', OUTHOUSE_H);

  // The far end of everything. It is tall rather than wide, because it is the one
  // building that goes up rather than along: everything else in this yard is a
  // shed or a hole, and the thing a core buys should not look like either.
  seat(tower, 'tower', TOWER_H);

  // And the ground the pot stands on: everything from the left-hand end of the
  // world to the lab, which is both sides of the casino. A heap goes down beside
  // the building and walks *left* past it when the right-hand side is full,
  // because that is where the empty ground is.
  // The pot's ground runs from the left-hand end of the world to the lab, and
  // stops short of the scrubbing house once that is standing: a heap is allowed
  // to walk left past the casino, and a heap walking into somebody's wall is a
  // heap drawn through a building.
  table.x = 0;
  const potTo = S.scrubOpen ? Math.min(lab.x, scrub.x) : lab.x;
  table.cols = Math.max(1, Math.floor((potTo - P * 4) / P));
  table.y = S.groundY - table.rows * P;

  // the quarry is a hole in the ground, so it hangs below the line rather than
  // standing on it
  quarry.w = placed.at.quarry.w;
  quarry.x = placed.at.quarry.x;
  quarry.y = S.groundY;

  // the plots stand on the ground, out past the quarry
  farm.h = FARM_H;
  // The farm's *reservation* is its widest future self -- see SITES -- while its
  // width today is however many plots have been broken. So it stands where the
  // table put it and grows rightwards into ground already set aside for it,
  // which is why breaking new ground never shoves the lab along.
  farm.x = placed.at.farm.x;
  farm.y = S.groundY;

  // and the two things about them that are not fixed: how deep the quarry has been
  // taken and how many plots have been broken
  resite();

  // The world is the size of the finished works, not of today's. It is laid out
  // around the hole the pit can ever be, so digging widens the hole and not the
  // world: the ground past the far wall is the ground that is already there, and
  // the view does not shift under you because you bought a shop row.
  S.worldW = pit.x + PIT_W_MAX + PIT_PAD * P;
  S.worldH = S.groundY + PIT_H + FLOOR_MARGIN;

  floor.x = 0;
  // Which ground a column belongs to: a station's strip, by name, or `null` for
  // the bare yard between them.
  //
  // It is what stops dust teleporting. A grain landing on full ground looks for
  // room, and it used to look everywhere -- so a grain dropped on a full patch of
  // bare yard walked outward until it found space, which was usually the nearest
  // station's heap a hundred cells away. The spout paid out and the dust appeared
  // somewhere nobody had carried it. A heap may still spread the whole length of
  // itself; it simply may not spread into somebody else's.
  floor.region = c => {
    const x = floor.x + c * P;
    for (const p of S.piles) if (x >= p.from && x < p.to) return p.key;
    return null;
  };
  floor.cols = Math.ceil(S.worldW / P);
  floor.y = S.groundY - floor.rows * P;

  // the pit floor rests on the bottom of the window; everything above it is sky
  S.camY = S.worldH - S.viewH;
  clampCam();

  refreshPiles();                          // and each station's strip of ground
  if (after) after();                      // the sites settle themselves into it
}

// the view can never leave the world; if the window is bigger, it sits still
// only sideways: the pit floor is pinned to the bottom of the window
// Send the view somewhere, gently. Opening a new site is four cores and a row
// in a menu; without this the player buys it and nothing appears to happen,
// because the thing they bought is off the left of the screen.
export function lookAt(x) {
  S.camTo = x - S.viewW / 2;
  sent = true;
}

// Whether the view was sent somewhere since anybody last asked. A purchase that
// opens a place sends the view to the place; a rung on a ladder does not, and
// that is the whole difference between the two as far as the board is
// concerned -- so this is read once, right after a press, rather than kept.
let sent = false;
export const tookLook = () => { const was = sent; sent = false; return was; };

// Keeping up with somebody, rather than with where they were standing when you
// asked. A body walks: by the time a glide reaches the spot they were on, they
// are somewhere else, and a view that arrives at an empty piece of ground is
// worse than one that never moved -- the arrow over their head is off the side
// of the screen and you are looking at sand. So the spot is re-asked every
// frame for as long as the arrow is up, and the glide chases it.
//
// The same glide, so the ordinary case is unchanged: the view slides over,
// catches up, and then simply keeps pace a few pixels behind whoever it is
// watching. It lets go when the arrow does, and the player can take the view
// back at any point by scrolling it themselves.
export function follow(w) {
  S.follow = w;
  if (w) lookAt(w.x + WORKER / 2);
}

export const unfollow = () => { S.follow = null; };

// The one it is watching, while it is still worth watching. The arrow's own
// clock is the whole of the answer -- there is no second timer to keep in step
// with it, and nothing to clear when the pointing runs out.
export const following = t => (S.follow && S.follow.pointed > t ? S.follow : null);

// Where the view opens. The rock comes first -- it is the thing you are here to
// hit -- and the bench and the shacks beside it come too when the window is wide
// enough to hold them. On a phone that is not true, and a view opened on the
// bench would put the rock off the right-hand edge of a game about a rock.
export const openingCamX = () => Math.max(bench.x - P * 10, S.cx - S.viewW * 0.4);

// one frame of that glide
export function stepCamera(t) {
  const w = following(t);
  if (w) lookAt(w.x + WORKER / 2);
  else if (S.follow) S.follow = null;
  if (S.camTo === null) return;
  const d = S.camTo - S.camX;
  if (Math.abs(d) < 1) { S.camX = S.camTo; S.camTo = null; }
  else S.camX += d * 0.12;
  clampCam();
}

// The view, pulled in or let back out. Everything in this game is drawn at one
// fixed size on purpose -- a cell is a cell whatever you are looking at it on --
// and this is the one exception: the opening starts close on two people, because
// two squares at the far end of a yard are two squares, and the whole of the
// first minute is about them being somebody.
export function setZoom(k) {
  // Snapped so that a cell is still a whole number of device pixels.
  //
  // This is the same rule `resize` keeps and for the same reason: a cell drawn
  // across a fraction of a device pixel is a cell antialiased against the page,
  // and the sand grids are blitted up from a scratch canvas at one pixel a cell,
  // so a fractional scale resamples the *whole pile*. Zooming out smoothly made
  // the rock go soft and swim, and the ground read as see-through -- which is
  // not a thing that can be fixed by drawing it differently, only by not asking
  // for a size that does not exist.
  //
  // So the zoom steps rather than slides: down through whole cell sizes, a dozen
  // or so of them between close and normal, every one of them crisp. Everything
  // in this game moves a cell at a time; there is no reason the view should be
  // the exception.
  const unit = CELL * S.dpr;                    // device pixels a cell takes at 1x
  const px = Math.max(1, Math.round(unit * k));
  S.zoom = (CELL / P) * (px / unit);
  S.viewW = S.W / S.zoom;
  S.viewH = S.H / S.zoom;
  clampCam();
}

export function clampCam() {
  S.camX = Math.max(0, Math.min(S.camX, Math.max(0, S.worldW - S.viewW)));
  // The bottom of the world sits on the bottom of the window, always -- the pit
  // runs down to it and the yard is read off the ground line above. The one
  // exception is the opening, which is pulled in close on two people standing on
  // that line: at twice the size the window covers half as much world, and half
  // as much world measured up from the pit floor is all pit. So it says where it
  // wants to be looking and this obeys.
  S.camY = S.camLockY != null ? S.camLockY : S.worldH - S.viewH;
}

// Knock the view. Something heavy has hit the ground and the ground is what the
// whole picture is standing on, so everything in the world moves together --
// this is not the camera being pushed, it is the yard being shaken, and it is
// added on top of wherever you happen to be looking.
export function shakeView(amount) {
  if (amount <= S.shake) return;      // a small knock does not interrupt a big one
  S.shake = amount;
  S.shakePh = 0;
}

// One frame of it: a rock that rings and dies away rather than a jitter. It
// mostly rocks up and down, because that is the direction the thing came from,
// with a slower and shallower sway across. The offsets stay in world pixels and
// are rounded to whole device pixels where they are used, so a shaking yard is
// as crisp as a still one.
export function stepShake() {
  if (!S.shake) return;
  // A rock landing rocks the view for about as long either way, whatever the
  // machine is drawing at: the phase is radians a frame and the fade is a
  // proportion of what is left, so one is stepped and the other raised.
  const f = frames();
  S.shakePh += SHAKE_RATE * f;
  S.shake *= SHAKE_DECAY ** f;
  if (S.shake < 0.2) { S.shake = 0; S.shakeX = 0; S.shakeY = 0; return; }

  // It may only rock as far as there is world to rock into. The view is already
  // pinned to the edges of the place -- the pit floor sits on the bottom of the
  // window and the ground runs out sideways -- so an unchecked shake would show
  // the page through underneath the pit, which is worse than no shake at all.
  const overX = Math.max(0, S.worldW - S.viewW);
  const room = { l: S.camX, r: overX - S.camX, u: FLOOR_MARGIN };
  const y = Math.sin(S.shakePh) * S.shake;
  const x = Math.sin(S.shakePh * 0.6 + 1.7) * S.shake * 0.35;
  S.shakeY = Math.max(-room.u, y);              // down is sky, and there is plenty of it
  S.shakeX = Math.max(-room.r, Math.min(room.l, x));
}

// The pit is drawn through a scratch canvas one pixel per grain, blitted up to
// size. A million fillRects a frame is not a drawing routine; one drawImage is.
// Only the cells that changed are pushed across, so a busy pile costs a strip.


