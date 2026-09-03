// The rock: how one is made, where it stands, how it is hit, and what comes off.
//
// A rock is a heightfield, not a disc: a broad hill with crags along its crest,
// sitting flat on the ground. Every cell holds how much rock is still stacked
// there, so a hit takes a sheet off the front and you dig *into* it.

import {
  P, MAX_DEPTH, ROCK_W, ROCK_H, ROCK_GROW_W, ROCK_GROW_H, ROCK_SINK, ROCK_SKY,
  ROCK_W_MAX, ROCK_H_MAX, ROCK_DROP, ROCK_DROP_CLEAR, DROP_GRAV, JOLT_GRAINS, LAND_SAY_MS,
  ROCK_CLEAR, SHAKE_LAND, WORKER
} from './config.js';
import { throughRockMuck } from './smog.js';
import { frames, now } from './clock.js';
import { S, floor, bench } from './state.js';
import { spriteW, spriteH, stackCol, roofRow, seatCol, RAM } from './sprites.js';
import { defineMachine } from './machines.js';
import { at, put, depthShade, colOf, bottomY } from './grid.js';
import { pastRock, rockLeft, rockEdge, refreshPiles, shakeView } from './world.js';
import { spawnSpoil, spawnChip, critToss } from './dust.js';
import { critRoll } from './crit.js';
import { critBoost } from './apothecary.js';
import { pickCount, minerBite, minerMs } from './upgrades.js';
import { inWorking } from './route.js';
import { rand } from './rng.js';

// --- boulder ----------------------------------------------------------------
// boulder n is n sheets thick (capped) and a little wider than the last, so each
// one is a longer dig. Cells hold remaining thickness, deepest in the middle.
// Thickness is what makes a rock a long dig, and it used to go up with every
// rock, which -- on top of the rock getting wider and taller as well -- tripled
// the material over the first six and made the early ones a slog. It comes on
// every other rock now.
export function depthOf() {
  return Math.min(MAX_DEPTH, 1 + Math.floor(S.boulderNo / 2));
}

// how big rock n is, in cells. It may never grow into the bench, nor out of the
// sky kept clear above the ground line
export function rockSize() {
  const w = Math.round(ROCK_W + (S.boulderNo - 1) * ROCK_GROW_W);
  const h = Math.round(ROCK_H + (S.boulderNo - 1) * ROCK_GROW_H);
  // The width is kept even. The rock is anchored by its middle, so an odd width
  // puts its left edge half a cell off the grid, and half a cell is a fraction
  // of a device pixel: every column then seams against its neighbour.
  // The bench stands off one flank, so what the rock has to spread into is the
  // gap to whichever of its edges faces the rock -- and it keeps a hand's width
  // clear of that, rather than growing up against it.
  // Measured off where the bench actually stands, not off the offset it used to
  // be placed by. The two said the same thing only for as long as nobody moved
  // the bench; now that placement comes out of the SITES table, an edit to that
  // table would have let the rock grow quietly into the bench.
  const toBench = Math.abs(S.cx - (bench.x + bench.w));
  const wide = Math.max(10, Math.min(w, ROCK_W_MAX, Math.floor((toBench - P * 14) * 2 / P)));
  return {
    w: wide - (wide % 2),
    h: Math.max(6, Math.min(h, ROCK_H_MAX, Math.floor((ROCK_SKY - P * 4) / P)))
  };
}

// Where the foot of the rock is right now. A new rock comes down out of the sky,
// so for the second it is falling that is above where it will stand -- and it
// comes down a whole cell at a time, because a rock drawn half a device pixel
// off is a rock with a hairline through every row of it.
export const rockFootY = () =>
  S.groundY + ROCK_SINK - Math.round(S.rockFall / P) * P;

// the rock's foot sits just under the ground line so it looks planted, not laid
export function placeRock() {
  S.cy = rockFootY() - (S.gh / 2) * P;
}

// The ground the next rock is coming down on, or null when nothing is on its
// way. The crew have to be out of it *before* it arrives, which means they have
// to be told about it before it exists: between rocks the size is the next
// number's, and once one is in the air it is simply where that one is landing.
// It is the rock's footprint plus its apron, so nobody is left standing with a
// cliff face against their shoulder.
// Where a held swing lands: the highest rock there is, and the nearest such
// column to where the cursor happens to be.
//
// A single click hits what you clicked -- that is a swing you aimed. Holding the
// button is not aiming, it is *working*, and a gang works a rock from the top
// down. Aimed at the cursor it bored a shaft wherever you happened to leave the
// pointer, which is the one thing the crew are explicitly stopped from doing,
// and it left the rock in spires with a hole through the middle of it.
export function topOfRock(fromX) {
  let peak = S.gh;
  for (let c = 0; c < S.gw; c++) {
    if (S.rockTops[c] >= 0 && S.rockTops[c] < peak) peak = S.rockTops[c];
  }
  let best = -1, near = Infinity;
  const from = Math.round((fromX - rockLeft()) / P);
  for (let c = 0; c < S.gw; c++) {
    if (S.rockTops[c] < 0 || S.rockTops[c] > peak + TOP_BAND) continue;
    const d = Math.abs(c - from);
    if (d >= near) continue;
    near = d;
    best = c;
  }
  if (best < 0) return null;
  return { x: rockLeft() + best * P + P / 2, y: rockTopY(best) + P / 2 };
}
const TOP_BAND = 2;                // cells below the peak that still count as the top

export function dropZone() {
  if (S.rockFall > 0) return { from: rockEdge(-1), to: rockEdge(1) };
  if (boulderAlive()) return null;
  // and nothing is coming while a scene has the yard: the bare ground where the
  // rock will be is somewhere to stand, for as long as the scene wants it. A
  // crew ducking out of a footprint nothing is going to land in is a crew
  // backing away from the one thing the scene is about.
  if (S.sceneHolds) return null;
  const was = S.boulderNo;
  S.boulderNo = was + 1;
  const size = rockSize();
  S.boulderNo = was;
  const half = Math.round((size.w / 2) * P);
  return { from: S.cx - half - ROCK_CLEAR, to: S.cx + half + ROCK_CLEAR };
}

// How far above its place a new rock starts, so that it comes in over the top
// of the window rather than appearing halfway up the sky. The view is pinned to
// the bottom of the world, so the top edge is a fixed distance above the ground
// line for a given window -- measure to it, put the rock's foot a little further
// up than that, and the whole of it is out of sight until it drops into frame.
export function dropHeight() {
  const overhead = S.groundY - S.camY;          // ground line to the top of the window
  return Math.max(ROCK_DROP, overhead + ROCK_DROP_CLEAR);
}

// How long the rock in the air has left, in milliseconds, out of the same three
// numbers the fall itself is made of: what is left to travel, how fast it is
// going, and what the drop adds to that each frame. `stepRock` below adds the
// gravity and then moves, so a fall of n frames covers v*n + g*n*(n+1)/2 -- and
// this is that solved for n, turned into time at the rate a frame is worth.
//
// It is here because the dance asks: the crew are celebrating right up until the
// next rock lands, and a body that leaves the ground has to know whether it can
// be back down before the yard has something else to look at. Nobody outside a
// fall should read this -- it is zero when nothing is coming.
export function fallMs() {
  if (S.rockFall <= 0) return 0;
  const g = DROP_GRAV, v = S.rockFallV + g / 2;
  const n = (Math.sqrt(v * v + 2 * g * S.rockFall) - v) / g;
  return n * (1000 / 60);
}

// One frame of a new rock coming down. It lands, shoves the dust out of the
// ground it needs, and knocks a few grains off the tops of the two banks.
export function stepRock() {
  if (S.rockFall <= 0) return;
  // A rock takes the same time to come down whatever the machine is drawing at
  const f = frames();
  S.rockFallV += DROP_GRAV * f;
  S.rockFall -= S.rockFallV * f;
  if (S.rockFall <= 0) {
    S.rockFall = 0;
    S.rockFallV = 0;
    clearApron();
    jolt();
    // and the yard takes the weight of it. A taller rock is a heavier one, so
    // the knock is measured against the first rock rather than being one size
    // for all of them: rock ninety should land like rock ninety.
    shakeView(SHAKE_LAND * Math.min(1.6, S.gh / ROCK_H));
    // And whoever watched it come down says so, once it is down and they are
    // back on their feet. The opening does this with the first rock -- the body
    // thrown clear gets up and stares at it -- and then the second one lands on
    // the same spot, on the same person underneath, with nobody saying anything
    // at all. It is the same event and it gets the same mark.
    if (S.boulderNo > 1) {
      const at = now();
      for (const w of S.workers) {
        if (w.inside || inWorking(w) || w.aloft) continue;
        w.say = { mark: 'bang', until: at + LAND_SAY_MS };
      }
    }
    S.dirty = true;
  }
  placeRock();
}

// The landing shakes the banks: a grain hops off the top of each heap either
// side. They are the grains that were already lying there, thrown -- nothing
// here makes dust out of nothing, because every pixel is worth exactly one.
function jolt() {
  let left = JOLT_GRAINS;
  for (let d = 0; d < 30 && left > 0; d++) {
    for (const side of [-1, 1]) {
      const c = colOf(floor, rockEdge(side) + side * d * P);
      if (c < 0 || c >= floor.cols) continue;
      for (let r = floor.rows - 1; r >= 0; r--) {
        const v = at(floor, c, r);
        if (!v) continue;
        put(floor, c, r, 0);
        spawnChip(floor.x + c * P, bottomY(floor) - (r + 1) * P,
                  side * (0.2 + rand() * 0.5), -(1.2 + rand() * 1.4), v);
        left--;
        break;                              // one off the top of each column
      }
    }
  }
}

// world y of the top of the rock in a column, or the ground where there is none
export function rockTopY(c) {
  const t = S.rockTops[c];
  return t >= 0 ? rockFootY() - (S.gh - t) * P : S.groundY;
}

// the surface the crew stand on, kept per column so nobody walks it every frame
export function refreshRockTops() {
  const was = S.rockTops || [];
  S.rockTops = new Array(S.gw).fill(-1);
  for (let c = 0; c < S.gw; c++) {
    for (let y = 0; y < S.gh; y++) if (S.boulder[y][c]) { S.rockTops[c] = y; break; }
  }
  // A column the gang have just taken all the way down is not a surface any
  // more, and whatever was lying on it has to go somewhere. It goes on the
  // heap, thrown, like everything else that leaves this hill: the alternative
  // is dust hanging in the air over a hole in the rock.
  for (let c = 0; c < S.gw && c < was.length; c++) {
    if (was[c] >= 0 && S.rockTops[c] < 0) tipSand(c);
  }
}

// --- what is lying on the rock -------------------------------------------------
// The hill does not block dust any more. A chip that comes down over the crest
// lands ON it and lies there until a miner throws it onto the heap, which is the
// same bargain every other piece of ground in this yard has.
//
// Two ways to say that were on the table and this is the second one.
//
// The mess layer already lies on the rock -- `muckFloor` sends a muck column
// down onto `rockTopY` -- and a kind in the MESS table would have arrived with
// slumping, drawing, saving and shovelling all written. But every one of those
// answers the wrong question for dust. A mess is worth nothing and this is worth
// exactly one dust a pixel; a mess is SWEPT out of existence and this must be
// THROWN, conserved, onto a heap; a mess has a depth and no shade, and a grain
// off a deep rock is a different colour from a grain off a shallow one. Beyond
// the sink, `muckLeft`, `buried`, `yardMuck`, the rain and the janitor's whole
// post would each have acquired a member that answers wrongly to it -- the yard
// would report itself filthy because somebody dropped a grain on the hill.
//
// So it is its own layer, and it lives beside `S.rockTops` because it is the
// same shape as `S.rockTops`: one entry per rock column, moving with the rock,
// rebuilt when the rock is. One array of shades per column, bottom-first --
// shades and not a count, because the colour of a grain is the depth it was cut
// from and throwing back a different one would be quietly making dust up.
export function rockSand() {
  if (!S.rockSand || S.rockSand.length !== S.gw) {
    const was = S.rockSand || [];
    S.rockSand = new Array(S.gw);
    for (let c = 0; c < S.gw; c++) S.rockSand[c] = Array.isArray(was[c]) ? was[c] : [];
  }
  return S.rockSand;
}

// how many grains are lying in a column, and what is on top of the stack
export const sandDeep = c => (rockSand()[c] || []).length;
export const sandTop = c => { const s = rockSand()[c]; return s.length ? s[s.length - 1] : 0; };

// World y of the top grain in a column -- where a grain there is drawn, and
// where a throw of it starts from. A column with nothing in it answers with the
// rock's own top, which is where the next grain down it would come to rest.
export const sandTopY = c => rockTopY(c) - sandDeep(c) * P;

// How far out of line a column may stand before a grain rolls off it. Two cells,
// which is what a heap on a hill looks like rather than a spike on one.
const SAND_ANGLE = 2;

// Somewhere for a falling grain to come to rest, if the place it is falling on
// is the rock. False means this is not rock and the grain is somebody else's
// problem -- off the footprint, or in a column the gang have mined away.
export function restOnRock(x, shade) {
  if (!boulderAlive()) return false;
  const c = Math.floor((x - rockLeft()) / P);
  // Written this way round on purpose: a place that is not a number is not a
  // column of this rock either, and `c < 0 || c >= S.gw` lets a NaN straight
  // through both halves and on into the array.
  if (!(c >= 0 && c < S.gw) || S.rockTops[c] < 0) return false;
  const sand = rockSand();
  // It rolls off a shoulder rather than standing up on one: whichever of the
  // three columns is lowest takes it, the same rule `repose` keeps for a heap on
  // the ground. Lower is a *bigger* y.
  let best = c;
  for (const n of [c - 1, c + 1]) {
    if (n < 0 || n >= S.gw || S.rockTops[n] < 0) continue;
    if (sandTopY(n) > sandTopY(best) + SAND_ANGLE * P) best = n;
  }
  sand[best].push(shade);
  S.dirty = true;
  return true;
}

// Lift the top grain off a column, or 0 for a bare one. This is the only way
// anything leaves the layer, and every caller throws what it gets.
export function takeSand(c) {
  const s = rockSand()[c];
  return s && s.length ? s.pop() : 0;
}

// Everything in one column onto the rock's heap, thrown. Used when the ground
// under it stops being ground: a column mined through, a rock replaced.
function tipSand(c) {
  const s = S.rockSand && S.rockSand[c];
  if (!s || !s.length) return;
  const x = rockLeft() + c * P + P / 2;
  while (s.length) spawnSpoil(x, rockTopY(c) - s.length * P, s.pop());
  S.dirty = true;
}

// And the whole hill's worth, for a rock that is about to be replaced by
// another. The apron sweep does the same thing for the ground the foot is going
// to land on; this is the ground on top of the one that is going.
export function tipRockSand() {
  if (!S.rockSand) return;
  for (let c = 0; c < S.rockSand.length; c++) tipSand(c);
}

// A heightfield, not a disc: a broad hill with crags along its crest, sitting
// flat on the ground. Cells hold remaining thickness, deepest at the base and
// through the middle, thinning towards the skyline.
export function makeBoulder(fromSky = false) {
  // Whatever was lying on the last rock goes on the heap before this one is
  // built, while there is still a hill under it to say where it was. A rock
  // being replaced is the other half of `clearApron`: that one deals with the
  // ground the new foot is coming down on, this one with the ground the old top
  // was. Neither destroys a grain.
  tipRockSand();
  S.rockSand = null;
  const size = rockSize();
  S.gw = size.w;
  S.gh = size.h;
  const deep = depthOf();
  const seed = [rand() * 6, rand() * 6, rand() * 6,
                rand() < 0.5 ? -1 : 1];

  const crest = [];
  for (let x = 0; x < S.gw; x++) {
    const u = x / (S.gw - 1);
    let f = Math.pow(Math.sin(Math.PI * u), 0.42);        // broad, with steep shoulders
    f *= 1 + 0.16 * (u - 0.5) * seed[3]                   // it leans one way or the other
           + 0.05 * Math.sin(u * 6.1 + seed[0])           // and the crest is rough, not wavy
           + 0.07 * Math.sin(u * 14.7 - seed[1])
           + 0.06 * Math.sin(u * 27.3 + seed[2]);
    crest.push(Math.max(1, Math.min(S.gh, Math.round(f * S.gh))));
  }

  // Every rock holds until it is finished with. The flag says "this one still
  // has something to give up", not "there is a core in here" -- whether what it
  // gives up is a core is decided when the last pixel goes, in core.js.
  S.coreBuried = true;
  S.boulder = [];
  for (let y = 0; y < S.gh; y++) {
    const row = [];
    for (let x = 0; x < S.gw; x++) {
      const up = S.gh - y;                                   // 1 at the foot, S.gh at the sky
      if (up > crest[x]) { row.push(0); continue; }
      const k = crest[x] <= 1 ? 0 : (up - 1) / (crest[x] - 1);
      const mid = Math.sqrt(Math.max(0, 1 - ((x / (S.gw - 1) - 0.5) * 2) ** 2 * 0.55));
      const t = Math.sqrt(Math.max(0, 1 - k * k)) * mid;
      row.push(Math.max(1, Math.round(deep * t)));
    }
    S.boulder.push(row);
  }
  // A rock that is on its way down clears the ground it needs when it gets
  // there, not before: the dust under it is nobody's problem while it is in
  // the air.
  S.rockFall = fromSky ? dropHeight() : 0;
  S.rockFallV = 0;
  refreshPiles();            // a wider rock is a narrower pile beside it
  placeRock();
  refreshRockTops();
  if (!fromSky) clearApron();
}

// Shift any dust the last rock left standing where this one's foot is going, so
// a boulder never lands in a heap. Only the footprint: the clearance either side
// of it is ground now, and dust lying there is dust lying where it landed.
//
// It is *thrown*, not moved. It used to be handed to `addGrain`, which walks
// outward for the nearest column that will take it -- and the nearest column is
// the first column of the rock's own heap, so a bigger boulder coming down on a
// dusty footprint stood a dozen cells of it hard against its own foot. That is
// the sheer wall `bankCeiling` exists to prevent, arriving by the one door that
// does not go past `bankCeiling` at all.
//
// So the sweepings take the arc a miner's spoil takes, onto the heap that
// belongs to the rock, and land out along it honestly. Nothing is made and
// nothing is lost: every grain lifted here is one grain put back in the air.
export function clearApron() {
  if (!floor.grid) return;
  // Only the footprint's columns are visited. It used to walk every column of
  // the floor asking `pastRock` of each to find the twenty-odd under the rock.
  const c0 = Math.max(0, colOf(floor, rockLeft()) - 1);
  const c1 = Math.min(floor.cols - 1, colOf(floor, rockLeft() + S.gw * P) + 1);
  for (let c = c0; c <= c1; c++) {
    const x = floor.x + c * P;
    if (pastRock(x) >= 0) continue;
    for (let r = 0; r < floor.rows; r++) {
      const v = at(floor, c, r);
      if (!v) continue;
      put(floor, c, r, 0);
      spawnSpoil(x, bottomY(floor) - (r + 1) * P, v);
    }
  }
}


// The rock's surface, as a patch the one tidying rule can work -- see tidy.js.
// A miner between swings picks the nearest grain lying on the hill and throws it
// onto the rock's own heap, which is the same throw its spoil takes.
export const rockPatch = () => ({
  key: 'rock',
  cols: S.gw,
  colOf: x => Math.floor((x - rockLeft()) / P),
  xOf: c => rockLeft() + c * P + P / 2,
  peek: sandTop,
  take: takeSand,
  yOf: sandTopY
});


export function gridToString() {
  let s = '';
  for (const row of S.boulder) for (const v of row) s += String(v);
  return s;
}

export function gridFromString(s, w, h) {
  if (typeof s !== 'string' || !w || !h || s.length !== w * h) return false;
  S.gw = w;
  S.gh = h;
  S.boulder = [];
  for (let y = 0; y < S.gh; y++) {
    const row = [];
    for (let x = 0; x < S.gw; x++) row.push(+s[y * S.gw + x] || 0);
    S.boulder.push(row);
  }
  placeRock();
  refreshRockTops();
  return true;
}

// the rock is anchored by its foot, not its middle: it grows upwards and outwards
export const cellPos = (x, y) => ({ px: rockLeft() + x * P, py: rockFootY() - (S.gh - y) * P });

// Whether there is any rock left. Read off `rockTops`, which `refreshRockTops`
// keeps for every column after every swing, rather than by walking the grid: it
// used to scan every cell of a forty-by-twenty hill, and it is asked every frame
// by the ram, by `stepCore`, by every miner, by every route and by the drawing.
// Measured on the driven-ram yard it was a twelfth of the whole simulation.
//
// Which makes it a rule that nothing zeroes `S.boulder` without going through
// `refreshRockTops` -- see `clearBoulder`, which is the one way to do that.
export function boulderAlive() {
  const tops = S.rockTops;
  if (!tops) return false;
  for (let c = 0; c < tops.length; c++) if (tops[c] >= 0) return true;
  return false;
}

// The rock, gone: every cell to nought, and the tops with it. A dev hook and the
// two fresh-game paths used to zero the grid by hand and leave `rockTops`
// saying there was a hill, which `boulderAlive` now believes.
export function clearBoulder() {
  S.boulder = S.boulder.map(row => row.map(() => 0));
  refreshRockTops();
}

// The rock is there *and on the ground*. One question, asked by your own hand
// (`overBoulder`) and by the ram's `ready`, so the two cannot drift apart: the
// machine used to read `boulderAlive` alone, which is true the instant a new
// hill is built, and hammered the rock the whole way down from the sky. The
// miners already duck out from under a falling rock (`dancing`, crew.js); this
// is the same rule for anything that works the face without walking to it.
export const rockDown = () => boulderAlive() && !(S.rockFall > 0);

// the boulder's whole footprint, so clicking a chipped-out gap still chips
// on the rock if there is rock close by: chipped-out gaps still count, but the
// empty air below it does not, so falling dust can be caught there
// the rock's whole footprint takes a swing, so clicking its general area works
export function overBoulder(mx, my) {
  if (!rockDown()) return false;                         // nothing to swing at yet
  const left = rockLeft();
  const foot = rockFootY();
  return mx > left && mx < left + S.gw * P && my > foot - S.gh * P && my < foot;
}

// the cell under the cursor, or the nearest filled one if that spot is already hollow
export function pickCell(mx, my) {
  const gx = (mx - rockLeft()) / P;
  const gy = S.gh - (rockFootY() - my) / P;
  const hx = Math.floor(gx), hy = Math.floor(gy);
  if (S.boulder[hy]?.[hx]) return { x: hx, y: hy };

  let best = null, bestD = Infinity;
  for (let y = 0; y < S.gh; y++) {
    for (let x = 0; x < S.gw; x++) {
      if (!S.boulder[y][x]) continue;
      const d = (x + 0.5 - gx) ** 2 + (y + 0.5 - gy) ** 2;
      if (d < bestD) { bestD = d; best = { x, y }; }
    }
  }
  return best;
}

// `want` is how many pixels this swing takes. Your pick and a miner's are two
// different tools, so whoever is swinging says which.
// `dirties` is whose swing this is.
//
// The yard fouls the sky; **your own hands do not.** Every mote overhead should
// be something the works did while you watched, and a player tapping the rock is
// not the works -- it is the one job in the game with no wages, no walk and no
// body, and pricing it in smoke taxes the thing the game is named after. It also
// made the opening dirty: a yard with one boulder, no crew and no buildings
// still had a browning sky, from nothing but you clicking.
//
// Everything with a body still pays: a miner's swing, and the ram's.
// `body` is who is swinging -- a miner, or null for your own hand at the rock.
// It is threaded through only so a body under a tonic gets what the tonic
// promised: a bracing tonic lifts this one swing's crit chance (`critBoost`),
// and the cadence a miner swings at is quickened at its own clock in crew.js
// (`workBoost`), the same way the farm quickens a stoop. Your own click carries
// no body and so neither bonus, which is right -- the tonics are dealt to the
// crew, not to your cursor.
export function knockOff(mx, my, want = pickCount(), dirties = true, body = null) {
  const c = pickCell(mx, my);
  if (!c) return;

  // Whatever came down in the last rain is on top of the rock, and a swing goes
  // into that first. It is not lost work -- it is the shift the rain cost you,
  // and it is being paid here rather than out of the counter.
  want = throughRockMuck(want);
  if (want < 1) { S.dirty = true; return; }

  // The rock is an unbounded job, so a crit ADDS: this swing takes several
  // pixels' worth off the face at once, and there is no ceiling on how much
  // stone is in the hill. One roll for the swing, whoever is swinging -- your
  // click and a miner's both come through here, and a miner under a bracing
  // tonic rolls at a lifted chance. Its spoil then flies up as a fountain rather
  // than onto the heap; see the toss below. The rock never fouls the sky and a
  // crit does not change that -- there is no pollution here to add.
  const crit = critRoll(critBoost(body));
  if (crit > 1) want *= crit;

  const reach = Math.ceil(Math.sqrt(want)) + 1;
  const near = [];
  for (let dy = -reach; dy <= reach; dy++) {
    for (let dx = -reach; dx <= reach; dx++) {
      const x = c.x + dx, y = c.y + dy;
      if (!S.boulder[y]?.[x]) continue;
      near.push({ x, y, d: dx * dx + dy * dy });
    }
  }
  near.sort((a, b) => a.d - b.d);

  const took = Math.min(want, near.length);
  for (const cell of near.slice(0, took)) {
    const left = S.boulder[cell.y][cell.x];
    const shade = depthShade(left, depthOf());   // how deep it looked, for colour
    S.boulder[cell.y][cell.x] = left - 1;
    const { px, py } = cellPos(cell.x, cell.y);
    if (crit > 1) critToss(px, py, shade, 'rock', crit);
    else spawnSpoil(px, py, shade);
  }
  // and it goes up from where it came off, not from a counter somewhere
  // Nothing. Taking rock apart does not dirty the sky, by anybody.
  //
  // It was the player's own swings first -- a yard with one boulder and no crew
  // still had a browning sky from nothing but clicking -- and this is the same
  // complaint one step along: a body with a pick is not a works. What dirties
  // this yard is machinery, and the ram's dirt goes up off the ram's stack like
  // every other machine's, in soot, in one place.
  //
  // `dirties` stays because the distinction between your hands and the crew's is
  // still worth being able to draw; there is simply nothing on either side of it
  // at the rock any more.
  S.dirty = true;
  refreshRockTops();
  // How many cells actually came off, so a machine can credit what it took
  // rather than what it asked for.
  return took;
}



// --- the ram --------------------------------------------------------------------
// The machine at the foot of the hill. Its arm reaches up into the face and
// strikes, and what a strike does is exactly what a miner's swing does, through
// `knockOff`, so the muck on top of the rock is spent first and the spoil falls
// where spoil falls.
//
// **It replaces the miners, and not you.** That is the one line DESIGN.md says
// twice, and it falls out for free here: the player's own swings go through
// `knockOff` from `input.js`, which this does not touch. The hill still comes
// apart under your cursor at exactly the rate it did.
//
// The **face**: the near edge of what is left of the boulder. The hill is eaten
// from the left, so this walks steadily right across the run of it, and it is
// the one number the ram's whole geometry hangs off.
//
// Derived every frame, never stored. A new boulder refills `rockTops` from
// column nought, so the face is back at the near end and everything measured
// from it -- where the machine stands, where its tender stands, how far the arm
// has to reach -- comes back with it. That is the same rule the jaw keeps about
// the floor of the cut.
export const rockFaceX = () => {
  for (let c = 0; c < S.gw; c++) if (S.rockTops[c] >= 0) return rockLeft() + c * P;
  return rockLeft() + S.gw * P;            // nothing left of it: the far end
};

// Cells of daylight between the machine's nose and the face -- which is to say,
// how far the arm actually travels.
//
// It used to be three, and two of those were the arm's resting length, so the
// whole stroke moved it by a single cell. A machine whose only moving part
// moves six pixels is a machine that reads as broken: you could watch the ram
// for a minute and never see it do anything. It stands back now and *punches*.
export const RAM_REACH = 8;

// Where it stands: back from the face by its own width and the arm's travel.
//
// **It follows the face.** The ram used to be parked off `rockLeft()`, the far
// edge of the grid, which does not move while the boulder is eaten -- so the
// machine sat in one spot for the whole of a rock and the only thing that told
// you it was working was the smoke. Measured off the face instead, it advances
// into the ground it has cleared, and its tender walks along with it, and the
// progress through the hill is a thing you watch happen rather than a bar.
//
// Nothing is remembered, so the awkward case takes care of itself: a new
// boulder puts the face back at the near end and the ram is at its parked spot
// again. That matters because the boulders grow -- each one reaches further into
// the ground in front of it -- and a ram that remembered how far it had crawled
// would be standing inside the next one.
export const ramX = () =>
  Math.round((rockFaceX() - P * (RAM_REACH + spriteW(RAM))) / P) * P;

defineMachine('ram', {
  job: 'miners',
  type: 'miner',
  at: ramX,
  y: () => S.groundY - P * Math.round(spriteH(RAM) / 2),
  // Up on the roof of the engine, at the end away from the chimney. It stood
  // *behind* the machine, on the yard side, which is where a body stands to work
  // a bench -- and a ram is not a bench. A body that has climbed onto the thing
  // is a body running it.
  seat: () => ({
    x: ramX() + seatCol(RAM) * P,
    y: S.groundY - spriteH(RAM) * P + roofRow(RAM) * P - WORKER
  }),
  // The top of its chimney: where the smoke leaves and, therefore, where the
  // dirt enters the sky. Both read this, so they cannot come from two places.
  stack: () => ({ x: ramX() + stackCol(RAM) * P,
                  y: S.groundY - spriteH(RAM) * P }),
  // Where the body stands. The yard side of the machine, clear of the apron --
  // the ground right against the face is where the next boulder lands, and a
  // tender posted in it would be stood on. Without a `tendAt` the runner looked for a miner
  // within reach of the machine's own x, which is fifty-odd pixels the far side
  // of the apron from anywhere a miner ever stands, so the ram was never manned
  // and never took a bite.
  tendAt: () => ramX() - WORKER - P,
  ms: rate => minerMs() / Math.max(0.01, rate),
  // Not while the rock is still coming down. `rockDown` is what your own hand
  // reads too; with `boulderAlive` alone here the ram struck a hill that was
  // still six hundred pixels up, and the runner holds the beat clock while
  // `ready` is false, so the landing is not followed by a burst of owed beats.
  ready: () => !S.pileFull.rock && rockDown(),
  // `n` beats of work in one strike: see `stepMachines`, which hands a machine
  // everything it is owed this frame at once rather than once per beat. For the
  // ram that is one `knockOff` of `n` bites and therefore one `refreshRockTops`
  // rather than eight of them a frame.
  bite: (tender, n = 1) => {
    // Where the arm lands: the near shoulder of the hill, at about the height a
    // body would be swinging at. `knockOff` finds the cell from there exactly as
    // it does for a miner or for the player's own pointer.
    // The nearest column that still has rock in it, not a fixed spot.
    //
    // It struck `rockLeft() + P` every beat, which is fine until that column is
    // gone -- and then the arm went on swinging at a hole in the air for the
    // rest of the boulder. Measured, the ram came out *slower than the single
    // pair of hands it had stood down*, which is a machine you paid fifty sparks
    // to make things worse. A miner walks the face; the ram reaches along it.
    let col = -1;
    for (let c = 0; c < S.gw; c++) if (S.rockTops[c] >= 0) { col = c; break; }
    if (col < 0) return false;                 // nothing left of this one
    const x = rockLeft() + col * P + P / 2;
    const y = rockTopY(col) + P * 2;
    const bite = minerBite();
    const took = knockOff(x, y, bite * n) || 0;
    if (!took) return 0;
    // Credited what it took, not one a strike -- `mined` counts cells off the
    // hill everywhere else it is written, and a machine that counted strikes
    // would read as a fifth of the work on the crew list.
    if (tender) tender.mined = (tender.mined || 0) + took;
    S.dirty = true;
    // And what it answers is beats' worth, so the stack smokes for the work
    // done and not the number of calls it took.
    return took / bite;
  }
});


// How far through this boulder the yard has got, 0 to 1. The ram draws a bar off
// it: the hill is the one workplace whose progress has no shape you can read
// from beside the machine -- a cut gets visibly deeper, a plot visibly greener,
// and a rock just gets smaller.
export function rockShare() {
  if (!S.boulder || !S.boulder.length) return 0;
  const full = S.gw * S.gh * depthOf();
  if (!full) return 0;
  let left = 0;
  for (const row of S.boulder) for (const v of row) left += v;
  return Math.max(0, Math.min(1, 1 - left / full));
}
