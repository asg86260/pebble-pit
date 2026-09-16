// Where everything in the world is, and what parts of the ground are spoken for.
//
// The world is a fixed size and never rearranges: the window is only a view onto
// it, and a small window scrolls rather than squashing everything together. Sites
// are placed by one walk of the SITES table (config/sites.js), so adding one is
// a row there and a `seat` in `seatSites`.

import { P, CELL, SKY, SKY_UP, SKY_R, TO_BENCH, TO_QUARRY, TO_LEDGE, GROUND_LEFT,
        ROCK_CLEAR, BANK_SLOPE, ROCK_PILE_TO, PILE_GAP, PILE_STANDOFF, heapBase, PIT_H,
        SITES, TO_FIRST_SITE, STATION_GAP, SHACK_RISE, SHACK_SCOOT, SHACK_CLEAR, RAM_CLEAR,
        PIT_W_MAX, PIT_PAD, FLOOR_MARGIN, WORKER, DEVICE_PIXELS, QUARRY_W, QUARRY_H, SHAKE_RATE,
        SHAKE_DECAY, TO_FARM, TO_LAB, TO_CASINO, CASINO_W, CASINO_H, TO_SCRUB, HOPPER_H, TRAY_H,
        SCRUB_W, SCRUB_H, LAB_W, LAB_H, APOTHECARY_W, APOTHECARY_H, FARM_PLOTS0, FARM_PLOTS_MAX, FARM_GAP, FARM_H,
        BENCH_W, QUARRY_BENCH0, QUARRY_BENCH_MAX, QUARRY_DEEPEN, LOOSE_DEEP, SCRUB_CHUTE , TO_TOWER, TOWER_W, TOWER_H, TO_OUTHOUSE, OUTHOUSE_W, OUTHOUSE_H, SHACK_W, SHACK_H,
        FARM_SHED_W, FARM_SHED_H, QUARRY_SHED_W, QUARRY_SHED_H, SHED_GAP, QUARRY_SHED_GAP,
        APOTH_POT_ROW, POT_PITCH, POT_W, BOARD_H, BOARD_LEG, BOARD_W, padOf, hangOf, KIT_OUT,
        BRIDGE_RISE, BRIDGE_RUN,
        OPENING_MARGIN, OPENING_ROCK_AT } from './config.js';
import { frames } from './clock.js';
import { S, floor, pit, bench, quarry, farm, apothecary, sky, casino, scrub, table, tray, tower, outhouse, shack } from './state.js';
import { seatRift } from './rift.js';
import { rockWidthAt, RAM_REACH } from './rock.js';
import { machine } from './machines.js';
import { spriteW, RAM } from './sprites.js';
import { shapePit } from './pit.js';
import { wakeGrid } from './grid.js';
import { JOB } from './jobs.js';
import { reducedMotion } from './prefs.js';

const canvas = document.getElementById('c');

// Is a grain over open air here rather than over anything it could rest on.
export const overPitMouth = x => x + P > pit.x && x < pit.x + pit.w;
// Asked while the quarry is shut too: there is no mouth then, and the
// columns simply never match.
export const overCutMouth = x => S.quarryOpen && x + P > quarry.x && x < quarry.x + quarry.w;
// Snapped to the cell: the rock is anchored by its middle, so an odd width
// puts this edge half a cell off the grid, a fraction of a device pixel the
// canvas draws as a hairline down every seam. Everything about the rock
// measures from here.
export const rockLeft = () => Math.round((S.cx - (S.gw / 2) * P) / P) * P;

// --- how big the two growing sites are ---------------------------------------
// The quarry and the farm get bigger for what they give up; everything that
// has to know how big they are asks here.
export const benches = () => Math.min(QUARRY_BENCH_MAX, QUARRY_BENCH0 + S.benchLevel);
export const quarryDepth = () => QUARRY_H + S.benchLevel * QUARRY_DEEPEN;
export const plotCount = () => Math.min(FARM_PLOTS_MAX, FARM_PLOTS0 + S.plotLevel);
// How many plots the row has laid out, broken or not: the row is drawn at
// its full width from the first frame. `plotCount` keeps meaning "bought".
export const plotSlots = () => FARM_PLOTS_MAX;

// The shed each growing site stands beside, on its own left edge, worked out
// off the station's own anchor so the two numbers cannot come apart.
// `SHACK_RISE` is added here rather than in the two pairs of constants
// because the height a shack stands at is one decision.
export const farmShed = () => ({
  x: farm.x - SHED_GAP - FARM_SHED_W, y: S.groundY - FARM_SHED_H - SHACK_RISE,
  w: FARM_SHED_W, h: FARM_SHED_H + SHACK_RISE
});
export const quarryShed = () => ({
  x: quarry.x - QUARRY_SHED_GAP - QUARRY_SHED_W, y: S.groundY - QUARRY_SHED_H - SHACK_RISE,
  w: QUARRY_SHED_W, h: QUARRY_SHED_H + SHACK_RISE
});

// A site that has just grown. Not a relayout: only the pile strips have to
// be told, because a wider farm is a shorter run of ground to heap on.
export function resite() {
  quarry.h = quarryDepth();
  farm.w = (plotCount() - 1) * FARM_GAP;
  refreshPiles();
}

// Whether a point on the ground belongs to a given station: the same reach
// the boards use to decide you are standing at one.
export function atStation(job, x) {
  if (job === JOB.PURIFY) return S.scrubOpen && x > scrub.x - P * 6 && x < scrub.x + scrub.w + P * 6;
  if (job === JOB.FARM) return S.farmOpen && x > farm.x - P * 10 && x < farm.x + farm.w + P * 10;
  if (job === JOB.STIR) return S.apothecaryOpen && x > apothecary.x - P * 6 && x < apothecary.x + apothecary.w + P * 6;
  if (job === JOB.QUARRY) return S.quarryOpen && x > quarry.x - P * 6 && x < quarry.x + quarry.w + P * 6;
  if (job === JOB.ROCK) return S.gw > 0 && x > rockLeft() - P * 4 && x < rockLeft() + S.gw * P + P * 4;
  return true;                     // carrying is done wherever the dust is
}

// Where a station's kit lies when nobody is wearing it, and where a body
// walks to put it on: one place, so the pile on the ground and the spot a
// worker walks to are the same spot by construction. Out to the left of the
// station, clear of the work and the doorway. How far out is `KIT_OUT`
// (config/sites.js), because the walk that spaces the yard pads every site's
// left side by its own stand.
export const kitX = job =>
  // The gang's, outside the shack; before there is a shack, the rock's own
  // left flank.
  job === JOB.ROCK ? (S.shackOpen ? shack.x - KIT_OUT.shack : rockLeft() - P * 4) :
  // well back from the lip: the full-hole warning stands five cells short of
  // the edge, and a trestle under a warning triangle is two marks in one place
  job === JOB.HAUL ? pit.x - P * 16 :
  job === JOB.QUARRY ? quarry.x - KIT_OUT.quarry :
  job === JOB.FARM ? farm.x - KIT_OUT.farm :
  job === JOB.STIR ? apothecary.x - KIT_OUT.apothecary :
  job === JOB.WIZARD ? tower.x - KIT_OUT.tower :
  job === JOB.JANITOR ? outhouse.x - KIT_OUT.outhouse : null;

// The strips are laid once and kept. Rather than every door remembering to
// lay them again, what they depend on is written here as one key and the
// ground is laid again when it changes: a new site gets its strip by
// existing.
let laid = null;
// Anything that can move a site has to be in here, or the yard keeps a
// layout that was true a purchase ago. `buildOrder` because the sites are
// walked in the order they were bought (`siteOrder`). The star's position
// is not in here: it is the tower's slot now, covered by `buildOrder`, and a
// key that depends on something the walk itself sets says "lay again" on
// the frame after every laying.
const groundKey = () =>
  `${S.scrubOpen}|${S.meteorOpen}|${S.apothPots}|${(S.buildOrder || []).join(',')}`;

export function layPiles() {
  const now = groundKey();
  // The noticeboard's rect lives on S, which a reset or a restore replaces
  // wholesale under a `laid` key that has not changed, so a rect with no
  // width is itself the signal the seats are stale.
  if (now === laid && S.noticeboard.w > 0) return;
  laid = now;
  // The strips AND the buildings: a site that has moved has to move both, or
  // the yard draws a casino standing on the lab's ground.
  refreshPiles();
  seatSites();
}

// Walk the table and hand every site its ground.
//
// Right to left from the rock, because the rock and the lip may never move:
// `S.worldW` is measured off `pit.x`, `floor.cols` off `S.worldW`, and a
// changed `floor.cols` invalidates every saved floor grid. A site's heap is
// placed in the same step that reserves its ground, so the near end and the
// far end come from one cursor walking one way and an inverted strip cannot
// be expressed (an inverted strip hangs the yard at boot).
//
// Buildings go up in the order they are bought, except three pinned places.
// The bench and the settlement are never bought through a row, so keep the
// front. The shack belongs to the rock, which stood before anything was
// bought. The casino keeps the back on purpose: the one place that makes
// nothing should be a place you went to (config.js, over TO_CASINO). The
// noticeboard is not in the table at all; it is furniture (`seatSites`).
const PINNED_FIRST = ['shack', 'bench', 'house'];
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
// SITES row reserves. The walk spaces what is drawn, and growth re-walks the
// yard: `groundKey` carries the count, so buying a pot lays the ground again
// and bodies walk to the new seats. The farm is NOT in here: its fence is
// drawn at the full width from the first frame (`plotSlots`).
const DRAWN_W = {
  apothecary: () => APOTH_POT_ROW + POT_PITCH * (Math.max(1, S.apothPots) - 1) + POT_W
};

// Returns a map of key -> { x, w } and the strips, in yard order.
export function placeSites() {
  const snap = v => Math.round(v / P) * P;
  const at = {}, strips = [];
  // Anchored on `S.cx`, which never moves, NOT on `rockLeft()`: the biggest
  // rock is sized by the room before the bench, so a bench placed off the
  // rock's edge is a knot.
  let x = snap(S.cx - TO_FIRST_SITE);

  for (const row of siteOrder()) {
    const w = snap((DRAWN_W[row.key] || row.w)());
    const pileW = row.pile ? heapBase(row.pile) * P : 0;

    // One separation between every pair of neighbors: the ground each site
    // owns for its heap (`padOf`), the ground for what it hangs off its left
    // (`hangOf`: kit stand, shed), plus STATION_GAP of bare walk. The pad
    // lies on whichever side the heap does and the hang always on the left,
    // so the bare ground between one drawn thing and the next is STATION_GAP
    // everywhere.
    const pad = padOf(row);
    const near = row.side === 'left' ? 0 : pad;     // on the rock side of the wall
    const left = snap(x - near - w);
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
    x = snap(left - (pad - near) - hangOf(row) - STATION_GAP);
  }

  // The rock's own spoil is NOT in here: the rock is a different size for
  // every boulder, and a strip frozen at layout time went stale the moment a
  // smaller rock came down. It is rebuilt live in `refreshPiles`.
  strips.sort((a, b) => a.from - b.from);

  // Three cells is a hard floor: `bankCeiling` is zero at both end columns
  // of a strip, so a narrower strip has no column that can hold a grain.
  // Loudly, because a clamped strip used to invert silently and hang the
  // yard at boot.
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
    // The ground is reserved from the moment the table names a site; the
    // strip only *appears* once the site is standing, because until then
    // nothing pays out on to it.
    ...(S.strips || []).filter(p => (p.key !== 'scrub' || S.scrubOpen)
                                 && (p.key !== 'sky' || S.meteorOpen)),
    // and the rock's, worked out fresh every time, because the rock it stands
    // off from is a different size for every boulder
    { key: 'rock', from: rockLeft() + S.gw * P + ROCK_CLEAR, to: S.cx + ROCK_PILE_TO }
  ].sort((a, b) => a.from - b.from);   // `yardLeft` reads the leftmost
  // The strips are what `blocked` and `bankCeiling` are written against, so
  // a column that settled did so under the old ones and, asleep, would never
  // find out. A handful of times a run.
  wakeGrid(floor);
}


// The ground under the recycler's spout, running left from the wall.
function scrubHeap() {
  const to = Math.round((scrub.x - P) / P) * P;
  return { key: 'scrub', from: to - heapBase('scrub') * P, to };
}

// A site's strip cut down to the width its limit needs, against its own
// station, never past `end`.
function heap(key, from, end) {
  const to = Math.round((from + heapBase(key) * P) / P) * P;
  return { key, from, to: Math.min(to, end) };
}

// which pile a spot on the ground belongs to, or null for the bare ground between
export function pileAt(x) {
  for (const p of S.piles) if (x + P > p.from && x < p.to) return p;
  return null;
}

// The left-hand end of the ground the crew work on. Not simply the first
// pile: the scrubbing house's chute and the star's rind both drop real
// grains on ground left of it, and a grain landing on a barred column walks
// outward into the farm's heap without anybody carrying it.
export const yardLeft = () =>
  Math.min(S.piles[0] ? S.piles[0].from : 0,
           // the ground under the chute's reach, which is what it pays on to
           S.scrubOpen ? scrub.x - P * SCRUB_CHUTE : Infinity,
           // and the ground under the meteor, where the rind comes down
           S.meteorOpen ? sky.x - sky.r - P * 2 : Infinity);
// The ground past the far wall of the hole: not a strip, but a throw that
// clears the pit has to land somewhere, so dust may lie there and be fetched.
export const pastPit = x => x >= pit.x + pit.w;
// Where a grain may not come to rest: under the rock and over the pit's
// mouth, the two places that are not ground. Everywhere else, including the
// bare yard between stations and the ground off the left end, takes a
// scatter (`bankCeiling`); barring bare ground sent every grain let go in
// the open to a heap a hundred cells away.
//
// Inside the rock, not on top of it: a chip over the crest lands on the
// hill's own surface (`rockSand` in rock.js). The quarry's mouth is not
// barred either: a grain over the cut falls INTO it (the chip loop).
export const blocked = c => {
  const x = floor.x + c * P;
  // The footprint only, off `rockLeft()` and `S.gw` so it follows the rock.
  // The clearance either side is ground: `clearApron` throws its sweepings,
  // `bankCeiling` treats the footprint as the cliff, and the heap stands off
  // by `ROCK_CLEAR` from the table, so nothing needs the apron barred.
  if (pastRock(x) < 0) return true;
  if (overPitMouth(x)) return true;
  return false;
};

// which pile a station's own output belongs in
export const pileOf = key => S.piles.find(p => p.key === key);

// How far past the boulder's own footprint a column is, in cells, or -1 for
// one standing under it. Follows the rock, so a narrower boulder gives back
// the ground the last one stood on.
export const pastRock = x => {
  const near = rockLeft(), far = rockLeft() + S.gw * P;
  return x + P <= near ? (near - (x + P)) / P : x >= far ? (x - far) / P : -1;
};

// How high the ground may stand in a column. The cliffs sand cannot slump
// over are the rock's footprint and the near lip of the hole; a bank beside
// either would stand as a sheer wall, and one that reached the lip would tip
// itself in and bank the yard for free. So a bank rises only as it gets
// away from them.
export const bankCeiling = c => {
  const x = floor.x + c * P;
  // The ground past the far wall is a cliff dust may lie against, rising
  // away from the wall like every other bank. Nought there sent every throw
  // that cleared the pit back to the near side.
  if (pastPit(x)) return Math.max(0, (x + P - (pit.x + pit.w)) / P) * BANK_SLOPE;
  const p = pileAt(x);
  // Bare ground takes a scatter and no more; nought means "full", and full
  // means `addGrain` puts the grain in a pile you were not pointing at.
  // Against the hill it rises from the footprint on the slope, so the
  // clearance reads as a low ramp out of the foot of the hill.
  if (!p) return Math.min(LOOSE_DEEP, Math.max(0, pastRock(x)) * BANK_SLOPE);
  // A strip is a heap of loose stuff: it rises from its own ends at the
  // angle sand finds, and its crest is in the middle. A strip wide enough
  // for its own limit (`heapBase`, config/piles.js) needs nothing holding
  // it in.
  const toEnd = Math.min((x + P - p.from) / P, (p.to - (x + P)) / P);
  return Math.max(0, toEnd) * BANK_SLOPE;
};

// the outside of the rock's apron on one side: spoil and cores are aimed past it
export const rockEdge = side =>
  side < 0 ? rockLeft() - ROCK_CLEAR : rockLeft() + S.gw * P + ROCK_CLEAR;

// Where a worker's feet go, given the surface it is standing on: snapped to
// the pixel grid so a row of them lines up, and never below the ground line.
export function standOn(surfaceY) {
  const y = Math.min(surfaceY, S.groundY) - WORKER;
  return Math.round(y / P) * P;
}

// The bridge over the quarry: a ramp up, a flat deck over the mouth, a ramp
// down. Its shape is in config/quarry.js, where the yard's spacing can read
// it; re-exported so nothing that walks it has to know that.
export { BRIDGE_RISE, BRIDGE_RUN };

export function bridgeSpan() {
  const d0 = Math.round(quarry.x / P) * P;                 // the deck covers the mouth
  const d1 = Math.round((quarry.x + quarry.w) / P) * P;
  return { x0: d0 - BRIDGE_RUN, d0, d1, x1: d1 + BRIDGE_RUN,
           top: S.groundY - BRIDGE_RISE };
}

// The surface underfoot at x: the ground line, or over the quarry whichever
// part of the bridge is above that point.
export function groundAt(x) {
  if (!S.quarryOpen) return S.groundY;
  const { x0, d0, d1, x1, top } = bridgeSpan();
  if (x <= x0 || x >= x1) return S.groundY;
  if (x < d0) return S.groundY - BRIDGE_RISE * (x - x0) / BRIDGE_RUN;   // up the near ramp
  if (x > d1) return S.groundY - BRIDGE_RISE * (x1 - x) / BRIDGE_RUN;   // down the far one
  return top;                                                           // across the deck
}

// Where a walker's top edge goes at x. Not snapped the way `standOn` is: on
// a ramp that would step the crew up in six-pixel jumps off a line drawn
// straight.
export const walkY = x => Math.min(groundAt(x), S.groundY) - WORKER;


// --- layout -----------------------------------------------------------------
// Where every building stands, off one walk of the SITES table. Separate
// from `resize` so it can run again when the walk's answer changes without
// the window changing, which is what buying a building does. Each box says
// how TALL it is; where it stands is the table's business.

// Where the hut stands for the rock that is here: SHACK_CLEAR off its left
// edge, never further out than the slot the walk reserved (where it stands
// at the biggest rock). Off the rock's NUMBER rather than its placed width,
// because the placed width is clamped to what stands on its flank and a hut
// placed off that is the knot `placeSites` was untied from. Once the ram is
// bought the hut stands behind the ram's parking space instead.
export const shackSpot = () => {
  const spot = S.placed?.shack;
  if (!spot) return shack.x;
  const ram = machine('ram')?.bought;
  const clear = ram ? RAM_CLEAR + P * (RAM_REACH + spriteW(RAM)) : SHACK_CLEAR;
  const near = S.cx - (rockWidthAt(S.boulderNo) / 2) * P - clear - shack.w;
  return Math.max(spot.x, Math.round(near / P) * P);
};

// The hut where it belongs, now: for laying the yard out and for a check
// that jumps the rock number, where a rockhand at the door would otherwise
// be standing inside the boulder.
export const settleShack = () => { shack.x = shackSpot(); };

// One frame of the hut scooting over at SHACK_SCOOT. Everything hung off
// `shack.x` follows, because they all read the live rect.
export function stepShack(dt) {
  const to = shackSpot();
  if (shack.x === to) return;
  const step = SHACK_SCOOT * dt / 1000;               // dt is in milliseconds
  shack.x = shack.x > to ? Math.max(to, shack.x - step) : Math.min(to, shack.x + step);
  S.dirty = true;
}

// The rock's left flank: the right-hand edge of whatever stands nearest it,
// which is what the biggest rock is measured against (`rockSize`). Asked of
// every seated site rather than a named one, because the walk's order is
// the player's and a rule that names one site lets a rock grow through a
// wall the next time the walk is reordered.
export function flankX() {
  let x = -Infinity;
  for (const spot of Object.values(S.placed || {})) x = Math.max(x, spot.x + spot.w);
  return x;
}

export function seatSites() {
  const placed = placeSites();
  S.placed = placed.at;
  S.strips = placed.strips;
  const seat = (box, key, h) => {
    const spot = placed.at[key];
    box.w = spot.w; box.h = h; box.x = spot.x; box.y = S.groundY - h;
  };

  seat(bench, 'bench', P * 7);

  // The noticeboard does NOT get a slot: a row reserves ground, the world
  // gets wider, the floor gains columns, and the sky's dust budget goes with
  // it. It is furniture, centered in the gap between the bench and the front
  // doors, so it moves when they move. The rect is the PANEL, which hangs on
  // its posts.
  const gapFrom = placed.at.house.x + placed.at.house.w;
  const gapTo = placed.at.bench.x;
  S.noticeboard.w = BOARD_W;
  S.noticeboard.h = BOARD_H;
  S.noticeboard.x = Math.round((gapFrom + (gapTo - gapFrom - BOARD_W) / 2) / P) * P;
  S.noticeboard.y = S.groundY - BOARD_H - BOARD_LEG;

  // The two that are not `seat`-shaped, seated HERE all the same: seating a
  // site is one job and this function's, and a box seated only in `resize`
  // stays where the last resize left it when the ground is laid again.
  //
  // Whoever is down the cut moves with it: the dug shape and the sand are
  // columns off `quarry.x`, so the hole goes with the seat, and a body left
  // behind is under ground that is no longer a hole. Its route is dropped so
  // it is planned again from where it now stands.
  const dx = S.placed.quarry.x - quarry.x;
  if (dx && S.quarryOpen && quarry.w) {
    for (const w of S.workers) {
      if (w.y + WORKER > S.groundY && w.x + WORKER > quarry.x && w.x < quarry.x + quarry.w) {
        w.x += dx;
        if (w.seat != null) w.seat += dx;
        w.route = null;
      }
    }
  }
  quarry.w = S.placed.quarry.w;
  quarry.x = S.placed.quarry.x;
  quarry.y = S.groundY;                 // a hole hangs below the line, not on it

  farm.h = FARM_H;
  // The farm's reservation is its widest future self (SITES); it grows
  // rightward into ground already set aside, so breaking new ground never
  // shoves the lab along.
  farm.x = S.placed.farm.x;
  farm.y = S.groundY;

  // The star stands beside the tower, over the middle of the ground the
  // tower's slot carries on its far side (SITES): the rind it drops falls
  // straight down, so the strip has to be under it.
  const under = placed.strips.find(p => p.key === 'sky');
  sky.x = Math.round((under.from + under.to) / 2 / P) * P;
  sky.y = S.groundY - SKY_UP;
  sky.r = SKY_R;

  // how deep the quarry has been taken and how many plots have been broken:
  // facts about the two boxes above, and read straight after they are placed.
  resite();

  // Seated whether or not it has been bought, like every site: the ground is
  // reserved from the moment the table names it, and the draw waits on the
  // flag. The hut itself stands nearer, off the rock that is there
  // (`shackSpot`).
  seat(shack, 'shack', SHACK_H);
  settleShack();

  // The lab is deleted and is not seated: a deleted building must not go on
  // holding ground (DESIGN.md, "The lab is deleted").

  seat(apothecary, 'apothecary', APOTHECARY_H);

  seat(scrub, 'scrub', SCRUB_H);

  // The rift does not stand among the buildings: it hangs in the hole
  // (`seatRift`).
  seatRift();

  seat(casino, 'casino', CASINO_H);

  seat(outhouse, 'outhouse', OUTHOUSE_H);

  seat(tower, 'tower', TOWER_H);
}

export function resize(after) {
  // the canvas is told its size outright, in its own inline style and in device
  // pixels, so it does not depend on the stylesheet or on measuring anything
  S.W = Math.max(320, document.documentElement.clientWidth || innerWidth || 320);
  S.H = Math.max(240, document.documentElement.clientHeight || innerHeight || 240);
  // The screen's real resolution, backed off only if the backing store would
  // get silly (fill rate is what costs). Rounded so a cell is a whole number
  // of device pixels: a cell drawn across a fraction of one is antialiased
  // against the page, and the seam between two comes out gray.
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

  // A small window does not shrink the yard, it shows less of it. About
  // 830px of height shows the sky, the ground and the whole depth of the
  // pit; anything shorter loses sky off the top.
  S.zoom = CELL / P;
  S.viewW = S.W / S.zoom;
  S.viewH = S.H / S.zoom;

  // fixed places, laid out once and never moved
  S.groundY = SKY;
  S.cx = GROUND_LEFT;

  // The lip is a fixed distance from the rock and never moves; how far the
  // hole runs from it is `shapePit`'s.
  pit.x = S.cx + TO_LEDGE;
  shapePit();

  seatSites();

  // The casino's two plots of sand: the hopper on its roof, where the stake
  // stands, and the tray at its foot, where the bins pay into. Both are the
  // building's inner width, a wall in from each side; the hopper is the top of
  // the block and the tray is the bottom of it. See casino.js.
  table.x = casino.x + P;
  table.cols = CASINO_W / P - 2;
  table.rows = HOPPER_H;
  table.y = casino.y;
  tray.x = casino.x + P;
  tray.cols = CASINO_W / P - 2;
  tray.rows = TRAY_H;
  tray.y = casino.y + casino.h - TRAY_H * P;

  // The world is the size of the finished works: laid out around the hole
  // the pit can ever be, so the view does not shift under you for a shop row.
  S.worldW = pit.x + PIT_W_MAX + PIT_PAD * P;
  S.worldH = S.groundY + PIT_H + FLOOR_MARGIN;

  floor.x = 0;
  // Which ground a column belongs to: a station's strip, by name, or `null`
  // for the bare yard between. A heap may spread the whole length of itself
  // and never into somebody else's (`addGrain`).
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

// Send the view somewhere, gently: a place opened off the left of the screen
// is a purchase where nothing appears to happen. Every glide in the game
// comes through this one door, so under reduced motion declining here is
// the whole of the camera. The preference is read on every call so the
// switch takes effect on the next glide.
export function lookAt(x) {
  S.camTo = x - S.viewW / 2;
  sent = true;
  if (reducedMotion()) { S.camX = S.camTo; S.camTo = null; clampCam(); }
}

// Whether the view was sent somewhere since anybody last asked: read once,
// right after a press, since a door sends the view and a rung does not.
let sent = false;
export const tookLook = () => { const was = sent; sent = false; return was; };

// Keeping up with somebody rather than with where they were standing: the
// spot is re-asked every frame for as long as the arrow is up, and the same
// glide chases it. The player takes the view back by scrolling.
export function follow(w) {
  S.follow = w;
  if (w) lookAt(w.x + WORKER / 2);
}

export const unfollow = () => { S.follow = null; };

// The one it is watching, while it is still worth watching: the arrow's own
// clock is the whole of the answer.
export const following = t => (S.follow && S.follow.pointed > t ? S.follow : null);

// Where the view opens: the rock, with the bench beside it when the window
// is wide enough to hold both, measured rather than assumed. When it does
// not fit the seat is the seat and nothing else has a say: a guard of
// `max(withBench, seat)` opened a phone on the bench with the rock off the
// right-hand edge of a game about a rock.
export const openingCamX = () => {
  const withBench = bench.x - OPENING_MARGIN;
  const rockFar = rockLeft() + S.gw * P + OPENING_MARGIN;
  return rockFar - withBench <= S.viewW ? withBench : S.cx - S.viewW * OPENING_ROCK_AT;
};

// --- the scroller ---------------------------------------------------------------
// On a phone the platform holds the camera's x (DESIGN.md, "Momentum
// scrolling"): the grab bar along the bottom edge is a horizontal scroller
// with a spacer as wide as the world, a finger drags or flings it with the
// platform's own coast, and the game reads where it got to. `S.camX` stays
// the fact everything draws by; `scrollLeft` is where the platform keeps it.
// Every writer of the camera comes through `clampCam`, which writes the
// scroller, and `stepCamera` reads it back once a frame, so a fling and a
// glide cannot disagree for longer than a frame. On a desk the band is
// hidden and both halves stand down; the node yard binds no scroller at
// all; either way the camera is the same fact without one.
let scroller = null, spacer = null;
let wroteLeft = -1, spacerW = -1;
// What to do when the platform has moved the view: input.js hangs the
// board's rule here, since a board follows its station out of the window
// the same whether a finger or a wheel took it there.
let taken = null;
export function bindScroller(el, sp, onTaken) {
  scroller = el; spacer = sp; taken = onTaken;
  wroteLeft = -1; spacerW = -1;
}
// A scene owns the camera for its run, and a fling in flight would fight it:
// the scroller is shut for the length of the scene (cutscene.js).
export function lockScroller(on) {
  if (scroller) scroller.style.overflowX = on ? 'hidden' : '';
}
// A hidden element has no scroll position to keep, so the band shown again
// (the switch on the sheet) is written afresh rather than trusted.
const bandUp = () => scroller && !scroller.hidden;
export function resyncScroller() { wroteLeft = -1; spacerW = -1; writeScroll(); }
function writeScroll() {
  if (!bandUp()) return;
  const w = Math.round(S.worldW * S.zoom);
  if (w !== spacerW) { spacerW = w; spacer.style.width = `${w}px`; }
  const left = S.camX * S.zoom;
  if (left === wroteLeft) return;
  scroller.scrollLeft = left;
  // Kept as the platform kept it, not as asked: it rounds to its own pixels
  // and clamps to its own edges, and the next read must not take its own
  // rounding for a fling.
  wroteLeft = scroller.scrollLeft;
}
// The platform's move, if it made one since the last write: a drag or a
// fling in the band. The seat is taken back from whatever was gliding it,
// the way `pan` does for a drag.
function readScroll() {
  if (!bandUp()) return;
  const left = scroller.scrollLeft;
  if (left === wroteLeft) return;
  wroteLeft = left;
  S.camX = left / S.zoom;
  S.camTo = null;
  S.follow = null;
  S.dirty = true;
  clampCam();
  taken?.();
}

// one frame of that glide
export function stepCamera(t) {
  readScroll();
  const w = following(t);
  if (w) lookAt(w.x + WORKER / 2);
  else if (S.follow) S.follow = null;
  if (S.camTo === null) return;
  const d = S.camTo - S.camX;
  if (Math.abs(d) < 1) { S.camX = S.camTo; S.camTo = null; }
  else S.camX += d * 0.12;
  clampCam();
}

// The view, pulled in or let back out: the one exception to a cell being a
// cell, for the opening and the cutscenes.
export function setZoom(k) {
  // Snapped so a cell is still a whole number of device pixels, the rule
  // `resize` keeps: the sand grids are blitted up from a scratch canvas at
  // one pixel a cell, so a fractional scale resamples the whole pile and
  // the ground reads as see-through. The zoom steps through whole cell
  // sizes rather than sliding.
  const unit = CELL * S.dpr;                    // device pixels a cell takes at 1x
  const px = Math.max(1, Math.round(unit * k));
  S.zoom = (CELL / P) * (px / unit);
  S.viewW = S.W / S.zoom;
  S.viewH = S.H / S.zoom;
  clampCam();
}

export function clampCam() {
  S.camX = Math.max(0, Math.min(S.camX, Math.max(0, S.worldW - S.viewW)));
  // The bottom of the world sits on the bottom of the window, always, except
  // when a scene locks the height: pulled in close, half as much world
  // measured up from the pit floor is all pit.
  S.camY = S.camLockY != null ? S.camLockY : S.worldH - S.viewH;
  // And the platform is told where the view now is, so the next fling
  // starts from here and not from where the last one ended.
  writeScroll();
}

// Knock the view: the yard being shaken, added on top of wherever you are
// looking. Under reduced motion nothing moves; every caller still asks and
// none of them needs to know.
export function shakeView(amount) {
  if (reducedMotion()) return;
  if (amount <= S.shake) return;      // a small knock does not interrupt a big one
  S.shake = amount;
  S.shakePh = 0;
}

// One frame of it: a rock that rings and dies away, mostly up and down with
// a slower, shallower sway across. The offsets stay in world pixels and are
// rounded to whole device pixels where used, so a shaking yard is crisp.
export function stepShake() {
  if (!S.shake) return;
  // The same length whatever the machine is drawing at: the phase is radians
  // a frame and the fade a proportion of what is left.
  const f = frames();
  S.shakePh += SHAKE_RATE * f;
  S.shake *= SHAKE_DECAY ** f;
  if (S.shake < 0.2) { S.shake = 0; S.shakeX = 0; S.shakeY = 0; return; }

  // Only as far as there is world to rock into, or the page shows through
  // under the pit.
  const overX = Math.max(0, S.worldW - S.viewW);
  const room = { l: S.camX, r: overX - S.camX, u: FLOOR_MARGIN };
  const y = Math.sin(S.shakePh) * S.shake;
  const x = Math.sin(S.shakePh * 0.6 + 1.7) * S.shake * 0.35;
  S.shakeY = Math.max(-room.u, y);              // down is sky, and there is plenty of it
  S.shakeX = Math.max(-room.r, Math.min(room.l, x));
}

