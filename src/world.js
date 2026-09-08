// Where everything in the world is, and what parts of the ground are spoken for.
//
// The world is a fixed size and never rearranges: the window is only a view onto
// it, and a small window scrolls rather than squashing everything together. Sites
// are placed by their distance from the rock, so adding one is a distance in
// config.js and a line in `layout` below.

import { P, CELL, SKY, SKY_UP, SKY_R, TO_BENCH, TO_QUARRY, TO_LEDGE, GROUND_LEFT,
        ROCK_CLEAR, BANK_SLOPE, ROCK_PILE_TO, PILE_GAP, PILE_STANDOFF, heapBase, PIT_H,
        SITES, TO_FIRST_SITE, STATION_GAP, SHACK_RISE,
        PIT_W_MAX, PIT_PAD, FLOOR_MARGIN, WORKER, DEVICE_PIXELS, QUARRY_W, QUARRY_H, SHAKE_RATE,
        SHAKE_DECAY, TO_FARM, TO_LAB, TO_SCHOOL, TO_CASINO, CASINO_W, CASINO_H, TO_SCRUB,
        SCRUB_W, SCRUB_H, SCHOOL_W, SCHOOL_H, LAB_W, LAB_H, APOTHECARY_W, APOTHECARY_H, FARM_PLOTS0, FARM_PLOTS_MAX, FARM_GAP, FARM_H,
        BENCH_W, QUARRY_BENCH0, QUARRY_BENCH_MAX, QUARRY_DEEPEN, LOOSE_DEEP, SCRUB_CHUTE , TO_TOWER, TOWER_W, TOWER_H, TO_OUTHOUSE, OUTHOUSE_W, OUTHOUSE_H,
        FARM_SHED_W, FARM_SHED_H, QUARRY_SHED_W, QUARRY_SHED_H, SHED_GAP,
        APOTH_POT_ROW, POT_PITCH, POT_W, BUILDBENCH_H, SLOT_PAD } from './config.js';
import { frames } from './clock.js';
import { S, floor, pit, bench, quarry, farm, lab, apothecary, sky, school, casino, scrub, table , tower, outhouse } from './state.js';
import { seatRift } from './rift.js';
import { shapePit } from './pit.js';
import { wakeGrid } from './grid.js';
import { JOB } from './jobs.js';

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
// How many plots the row has laid out, whether or not they are broken yet --
// see C6 in wave-feedback3.md. `plotCount` keeps meaning "bought", because
// nothing about which plots are *worked* changes; this is only for drawing the
// row at its full width from the first frame.
export const plotSlots = () => FARM_PLOTS_MAX;

// The shed each of the two growing sites stands beside, on its own left edge --
// see C5. Worked out off the station's own anchor rather than off `S.placed`,
// because that anchor is already the shed's far edge plus the gap: the two
// numbers cannot come apart.
//
// A course taller than the box config declares, and both of them by the same
// course: `SHACK_RISE` is what item 1 of feedback5 buys -- a shed that reads as
// somewhere a body goes rather than as a crate with a slot in it. It is added
// here rather than in the two pairs of constants because the height a shack
// stands at is one decision, and two numbers that have to be raised together
// are two numbers that will not be.
export const farmShed = () => ({
  x: farm.x - SHED_GAP - FARM_SHED_W, y: S.groundY - FARM_SHED_H - SHACK_RISE,
  w: FARM_SHED_W, h: FARM_SHED_H + SHACK_RISE
});
export const quarryShed = () => ({
  x: quarry.x - SHED_GAP - QUARRY_SHED_W, y: S.groundY - QUARRY_SHED_H - SHACK_RISE,
  w: QUARRY_SHED_W, h: QUARRY_SHED_H + SHACK_RISE
});

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
  if (job === JOB.PURIFY) return S.scrubOpen && x > scrub.x - P * 6 && x < scrub.x + scrub.w + P * 6;
  if (job === JOB.FARM) return S.farmOpen && x > farm.x - P * 10 && x < farm.x + farm.w + P * 10;
  if (job === JOB.STIR) return S.apothecaryOpen && x > apothecary.x - P * 6 && x < apothecary.x + apothecary.w + P * 6;
  if (job === JOB.QUARRY) return S.quarryOpen && x > quarry.x - P * 6 && x < quarry.x + quarry.w + P * 6;
  if (job === JOB.ROCK) return S.gw > 0 && x > rockLeft() - P * 4 && x < rockLeft() + S.gw * P + P * 4;
  return true;                     // carrying is done wherever the dust is
}

export const kitX = job =>
  job === JOB.ROCK ? rockLeft() - P * 4 :
  // well back from the lip: the full-hole warning stands five cells short of
  // the edge, and a trestle under a warning triangle is two marks in one place
  job === JOB.HAUL ? pit.x - P * 16 :
  // clear of the bridge: the ramp up to the deck starts right at the mouth, and
  // a trestle standing on a slope is a trestle about to fall over
  job === JOB.QUARRY ? quarry.x - BRIDGE_RUN - P * 5 :
  // clear of the first plot and of whoever is stooping over it: a farmhand
  // stands a body's width off its plot, which is where a stand four cells out
  // would be standing too
  job === JOB.FARM ? farm.x - P * 18 :
  // The stirrers' stand outside the pot, clear to the left of the door.
  job === JOB.STIR ? apothecary.x - P * 6 :
  // The wizards' stand is at the foot of the tower, because the tower is what
  // makes them: a hat on a stand outside the door of the place it was made in.
  job === JOB.WIZARD ? tower.x - P * 8 :
  // And the janitors' outside the outhouse, which is where their caps come from --
  // the shed keeps them, the way the tower keeps the cones. Clear to the left of
  // the front, because the door is cut in the middle of it and a stand across a
  // doorway is a stand somebody has to walk round to get in.
  job === JOB.JANITOR ? outhouse.x - P * 6 : null;

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
// What the ground depends on, written as one string. Anything that can move a
// site has to be in here, or the yard keeps a layout that was true a purchase
// ago -- which is the whole reason this key exists rather than a door
// remembering to call `refreshPiles` (see the note above).
//
// `buildOrder` is in it because the sites are walked in the order they were
// bought (see `siteOrder`). Without it the ordering worked perfectly and was
// never *seen*: `S.buildOrder` grew in the right order, `placeSites` read it
// and handed back the right x for everybody, and nothing ever asked, because
// the ground had already been laid under the old order and the key had not
// changed. Buying the lab before the school put the lab exactly where buying
// it second would have.
//
// The star's own position used to be in here, from when it was a place the
// layout did not know about and could drift. It is the tower's slot now (see
// SITES), so it is already covered by `buildOrder` -- and a key that depended
// on something the walk itself sets is a key that says "lay again" on the frame
// after every laying.
const groundKey = () =>
  `${S.scrubOpen}|${S.meteorOpen}|${S.apothPots}|${(S.buildOrder || []).join(',')}`;

export function layPiles() {
  const now = groundKey();
  // wave7b-build: the construction bench's rect lives on S -- which a reset or
  // a restore replaces wholesale with the blank declaration, under a `laid`
  // key that has not changed -- so a rect with no width is itself the signal
  // the seats are stale, whatever the key says. Seated below, so this fires
  // once per reset rather than every frame.
  if (now === laid && S.buildbench.w > 0) return;
  laid = now;
  // The strips AND the buildings. `refreshPiles` lays the ground each heap
  // lies on; the boxes the buildings are drawn from are seated in `relayout`,
  // and a site that has moved has to move both or the yard draws a school
  // standing on the lab's ground.
  refreshPiles();
  seatSites();
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
// The order the walk visits the table in -- see C7 in wave-feedback3.md.
// Buildings go up in the order they are bought, not a fixed one, so a save
// that broke the farm's ground before the quarry's sees the farm standing
// nearer the rock than the quarry does.
//
// The bench and the settlement are not part of that: neither is ever bought
// through a row of its own -- the bench is there from the first frame and the
// settlement is what hiring has always drawn -- so they keep the fixed order's
// first two places, always, and `S.buildOrder` only ever reorders what is left.
// A save with nothing in `S.buildOrder` -- new, or from before this existed --
// gets the fixed order back exactly, because an empty list bought nothing and
// leaves everything after the bench and the house in the table's own order.
// Three places the order does not touch, and each is pinned for a reason
// written down somewhere else.
//
// The bench and the settlement keep the front of the walk because neither is
// ever bought through a row of its own -- the bench is there from the first
// frame and the settlement is what hiring has always drawn -- so there is no
// purchase to order them by.
//
// The casino keeps the BACK of it, and that one is a design decision rather
// than a mechanical one: "the last thing on the ground, out past the lab. It
// is the far end of the walk on purpose: it is the one place in the yard that
// makes nothing, and a place that makes nothing should be a place you went
// to" (config.js, over TO_CASINO). Ordering by purchase would let somebody
// who bought it early have it nearest to hand, which is the exact opposite of
// what it is for. `boards.js` says so too, and said so out loud the first time
// this was written without the pin.
const PINNED_FIRST = ['bench', 'house'];
const PINNED_LAST = ['casino'];

function siteOrder() {
  const pinned = [...PINNED_FIRST, ...PINNED_LAST];
  const rest = SITES.filter(row => !pinned.includes(row.key));
  const bought = (S.buildOrder || []).filter(k => rest.some(row => row.key === k));
  const waiting = rest.filter(row => !bought.includes(row.key));
  const pick = keys => keys.flatMap(k => SITES.filter(row => row.key === k));
  return [
    ...pick(PINNED_FIRST),
    ...bought.map(k => rest.find(row => row.key === k)),
    ...waiting,
    ...pick(PINNED_LAST)
  ];
}

// What a site is drawn at TODAY, where that differs from the widest self its
// SITES row reserves (wave6-sky, item 3). The walk used to space the reserved
// futures, so a station that had bought one pot of a possible four stood with
// three pots' worth of bare ground beside it and the yard's rhythm ran 120 to
// 330 pixels from one STATION_GAP. The walk spaces what is actually drawn now,
// and growth re-walks the yard instead: `groundKey` carries the count, so
// buying a pot lays the ground again and everything re-seats -- bodies walk to
// the new seats, nothing teleports.
//
// The farm is NOT in here, deliberately: its fence and its row of posts are
// drawn at the full seven-plot width from the first frame (see C6 and
// `plotSlots`), so its drawn width IS its reserved width.
const DRAWN_W = {
  apothecary: () => APOTH_POT_ROW + POT_PITCH * (Math.max(1, S.apothPots) - 1) + POT_W
};

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

  for (const row of siteOrder()) {
    const w = snap((DRAWN_W[row.key] || row.w)());
    const pileW = row.pile ? heapBase(row.pile) * P : 0;

    // One separation, the same one, between every pair of neighbours: SLOT_PAD
    // of owned apron plus STATION_GAP of walk (both in config/sites.js). Every
    // site gets the pad whether or not it has a heap to stand there, which is
    // what makes the rhythm even -- a site that makes nothing is spaced the
    // same as one buried in its own spoil. A heap, where there is one, stands
    // its standoff from the wall on its own side of the building, inside
    // ground the uniform separation has already reserved.
    const left = snap(x - SLOT_PAD - w);
    at[row.key] = { x: left, w };
    if (pileW) {
      if (row.side === 'left') {
        // The scrubbing house's spout is on its left wall, the tower drops the
        // star's rind on its far side: their heaps lie away from the rock.
        const to = snap(left - row.standoff);
        strips.push({ key: row.pile, from: to - pileW, to });
      } else {
        // Everything else throws towards the rock.
        const from = snap(left + w + row.standoff);
        strips.push({ key: row.pile, from, to: from + pileW });
      }
    }
    x = snap(left - STATION_GAP);
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
                    + `Widen STATION_GAP, or lower PILE_LIMIT.${p.key}.`);
    if (i && p.from < strips[i - 1].to)
      throw new Error(`the ${p.key} heap overlaps the ${strips[i - 1].key} heap: `
                    + `${p.from} is left of ${strips[i - 1].to}.`);
  }
  return { at, strips };
}

export function refreshPiles() {
  laid = groundKey();
  S.piles = [
    // Off the walk that reserved the ground for them, in
    // `placeSites`. They used to be rebuilt here from where the buildings had
    // ended up, with `heap()` clamping the far end against a neighbour -- which
    // is how a strip came back with its end left of its start, and a yard with
    // an inverted strip hangs at boot.
    //
    // The ground is reserved from the moment the table names a site; the strip
    // only *appears* once the site it belongs to is standing, because until then
    // nothing pays out on to it. That is the whole of the difference between
    // reserving a spot and opening one.
    //
    // The star's ground is the same case as the scrubbing house's: the tower's
    // slot reserves it from the first frame, and nothing pays out on to it until
    // the star is up there to knock a rind off.
    ...(S.strips || []).filter(p => (p.key !== 'scrub' || S.scrubOpen)
                                 && (p.key !== 'sky' || S.meteorOpen)),
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
  //      a rockhand's spoil takes, so the sweepings land out along the heap like
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
  // outline as it has actually been mined and lies there until a rockhand throws it
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
  // A strip is a heap of loose stuff and nothing else: it rises from its own
  // ends at the angle sand finds, and its crest is in the middle.
  //
  // It used to stand in a crate -- five cells of flat brim everywhere, and the
  // slope only above that -- which is what the two posts and a floor drawn at
  // every station were. The crate went with item 8 of feedback5, and it took the
  // brim with it: sides you cannot see are a rule nobody can read off the
  // picture. What held the capacity up was never the sides anyway, it was
  // `heapBase` being a cell or two mean about how wide a strip has to be (see
  // config/piles.js, where that is now worked out honestly), and a strip wide
  // enough for its own limit needs nothing holding it in.
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
// Where every building stands, off one walk of the SITES table.
//
// Lifted out of `resize` so that it can be run again when the walk's ANSWER
// changes without the window having changed at all -- which is what buying a
// building does now that the sites are placed in the order they were bought.
// Left inside `resize`, the ordering worked and was invisible: the boxes kept
// the places a walk taken before the purchase had given them.
//
// Each box still says how TALL it is -- height is a fact about the building,
// not about the yard -- but where it stands is the table's business, and the
// strips its heap lies on come off the same pass rather than being worked out
// afterwards from where the buildings ended up.
export function seatSites() {
  const placed = placeSites();
  S.placed = placed.at;
  S.strips = placed.strips;
  const seat = (box, key, h) => {
    const spot = placed.at[key];
    box.w = spot.w; box.h = h; box.x = spot.x; box.y = S.groundY - h;
  };

  seat(bench, 'bench', P * 7);

  // wave7b-build: the construction bench, a trestle on the ground right beside
  // the work bench. Its rect lives on S so a save carries it, but where it
  // stands is this walk's answer like everybody's.
  seat(S.buildbench, 'buildbench', BUILDBENCH_H);

  // The two that are not `seat`-shaped, seated HERE all the same.
  //
  // These lived in `resize`, which runs when the window changes size and at no
  // other time. So the ground could be laid again -- a place bought, the walk
  // re-ordered -- and every building would move to its new slot except these
  // two, which stayed where the last resize had left them. A farm bought while
  // the yard was standing ended up out on its own in the middle of nowhere,
  // with its reserved ground somewhere else entirely.
  //
  // Seating a site is one job and it is this function's.
  quarry.w = S.placed.quarry.w;
  quarry.x = S.placed.quarry.x;
  quarry.y = S.groundY;                 // a hole hangs below the line, not on it

  farm.h = FARM_H;
  // The farm's *reservation* is its widest future self -- see SITES -- while its
  // width today is however many plots have been broken. So it stands where the
  // table put it and grows rightwards into ground already set aside for it,
  // which is why breaking new ground never shoves the lab along.
  farm.x = S.placed.farm.x;
  farm.y = S.groundY;

  // The one thing that is not on the ground -- and it stands beside the tower
  // all the same (item 10 of feedback5). The star used to be its own offset from
  // the rock, three and a half thousand pixels of hand-measured distance that
  // agreed with the walk by luck: it ended up hanging over the casino's roof,
  // which is the one building in the yard that has nothing to do with it.
  //
  // A wizard is made in the tower and flies from the tower to the star, so the
  // two belong together. The tower's slot carries the star's ground on its far
  // side (see SITES), and the star sits over the middle of that ground -- the
  // rind it drops falls straight down, so the strip has to be under where it
  // falls rather than off to one side. Nothing teleports: a wizard already on
  // its way simply has further to fly.
  const under = placed.strips.find(p => p.key === 'sky');
  sky.x = Math.round((under.from + under.to) / 2 / P) * P;
  sky.y = S.groundY - SKY_UP;
  sky.r = SKY_R;

  // The school stands on the bare ground between the quarry's spoil and the
  // crew's front doors: where you go to learn a trade is on the way to work.
  // how deep the quarry has been taken and how many plots have been broken:
  // facts about the two boxes above, and read straight after they are placed.
  resite();

  seat(school, 'school', SCHOOL_H);

  // The lab is not seated any more: it is deleted, and a deleted building must
  // not go on holding ground. Left in, it kept a station's width and a
  // station's padding of empty yard between the scrubbing house and the
  // apothecary -- a gap in the walk where a building used to be, which is what
  // wave5-yard's spacing check was reading. See DESIGN.md, "The lab is
  // deleted".

  // The apothecary, standing right after the farm whose crop it takes. A plain
  // rect, seated off the same walk.
  seat(apothecary, 'apothecary', APOTHECARY_H);

  // Past the lab, at the quiet end of the walk. What it does is about the sky
  // over the whole yard rather than about any one site, so it does not belong
  // among the places that dig -- and the walk out to it is the last of the
  // walks, which is what the cores have bought all the way along.
  seat(scrub, 'scrub', SCRUB_H);

  // The rift, which is not seated with the rest: it does not stand among the
  // buildings at all. It hangs in the hole, over the pile -- see `seatRift`.
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
}

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

  seatSites();

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


