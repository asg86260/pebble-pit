// The rock: how one is made, where it stands, how it is hit, and what comes off.
//
// A rock is a heightfield, not a disc: a broad hill with crags along its crest,
// sitting flat on the ground. Every cell holds how much rock is still stacked
// there, so a hit takes a sheet off the front and you dig *into* it.

import {
  P, MAX_DEPTH, ROCK_W, ROCK_H, ROCK_GROW_W, ROCK_GROW_H, ROCK_SINK, ROCK_SKY,
  ROCK_W_MAX, ROCK_H_MAX, TO_BENCH, BENCH_W, ROCK_DROP, ROCK_DROP_CLEAR, DROP_GRAV, JOLT_GRAINS, LAND_SAY_MS,
  ROCK_CLEAR, SHAKE_LAND, WORKER
} from './config.js';
import { foul, throughRockMuck } from './smog.js';
import { frames, now } from './clock.js';
import { S, floor } from './state.js';
import { defineMachine } from './machines.js';
import { at, put, addGrain, depthShade, colOf, bottomY } from './grid.js';
import { blocked, rockLeft, rockEdge, refreshPiles, shakeView } from './world.js';
import { spawnSpoil, spawnChip } from './dust.js';
import { pickCount, minerBite, minerMs } from './upgrades.js';

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
  const toBench = Math.abs(TO_BENCH < 0 ? TO_BENCH + BENCH_W : TO_BENCH);
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
        if (w.inside || w.inPit || w.aloft) continue;
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
                  side * (0.2 + Math.random() * 0.5), -(1.2 + Math.random() * 1.4), v);
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
  S.rockTops = new Array(S.gw).fill(-1);
  for (let c = 0; c < S.gw; c++) {
    for (let y = 0; y < S.gh; y++) if (S.boulder[y][c]) { S.rockTops[c] = y; break; }
  }
}

// A heightfield, not a disc: a broad hill with crags along its crest, sitting
// flat on the ground. Cells hold remaining thickness, deepest at the base and
// through the middle, thinning towards the skyline.
export function makeBoulder(fromSky = false) {
  const size = rockSize();
  S.gw = size.w;
  S.gh = size.h;
  const deep = depthOf();
  const seed = [Math.random() * 6, Math.random() * 6, Math.random() * 6,
                Math.random() < 0.5 ? -1 : 1];

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

// shift any dust the last rock left inside this one's apron out to clear ground,
// so a bigger rock never lands standing in a heap
export function clearApron() {
  if (!floor.grid) return;
  for (let c = 0; c < floor.cols; c++) {
    if (!blocked(c)) continue;
    for (let r = 0; r < floor.rows; r++) {
      const v = at(floor, c, r);
      if (!v) continue;
      put(floor, c, r, 0);
      addGrain(floor, floor.x + c * P, blocked, v);     // to the nearest clear column
    }
  }
}

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

export function boulderAlive() {
  for (const row of S.boulder) for (const v of row) if (v) return true;
  return false;
}

// the boulder's whole footprint, so clicking a chipped-out gap still chips
// on the rock if there is rock close by: chipped-out gaps still count, but the
// empty air below it does not, so falling dust can be caught there
// the rock's whole footprint takes a swing, so clicking its general area works
export function overBoulder(mx, my) {
  if (!boulderAlive() || S.rockFall > 0) return false;   // nothing to swing at yet
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
export function knockOff(mx, my, want = pickCount()) {
  const c = pickCell(mx, my);
  if (!c) return;

  // Whatever came down in the last rain is on top of the rock, and a swing goes
  // into that first. It is not lost work -- it is the shift the rain cost you,
  // and it is being paid here rather than out of the counter.
  want = throughRockMuck(want);
  if (want < 1) { S.dirty = true; return; }

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

  for (const cell of near.slice(0, want)) {
    const left = S.boulder[cell.y][cell.x];
    const shade = depthShade(left, depthOf());   // how deep it looked, for colour
    S.boulder[cell.y][cell.x] = left - 1;
    const { px, py } = cellPos(cell.x, cell.y);
    spawnSpoil(px, py, shade);
  }
  // and it goes up from where it came off, not from a counter somewhere
  foul(want, cellPos(c.x, c.y).px, cellPos(c.x, c.y).py, 'dust');
  S.dirty = true;
  refreshRockTops();
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
// Where it stands is the awkward part and worth writing down. `ROCK_CLEAR` keeps
// an apron of bare ground either side of the hill -- `blocked` refuses those
// columns and `clearApron` shovels them -- so the ram cannot stand *in* the
// apron without the yard trying to sweep it away. It stands just outside, and
// reaches: `rockLeft()` less its own width and a cell of daylight. The arm is
// long, which is what an arm is for.
export const ramX = () => Math.round((rockLeft() - ROCK_CLEAR - P * 5) / P) * P;

defineMachine('ram', {
  job: 'miners',
  type: 'miner',
  at: ramX,
  y: () => S.groundY - P * 4,
  // Where the body stands. The yard side of the machine, clear of the apron --
  // `ROCK_CLEAR` is ground the yard actively sweeps, and a tender posted in it
  // would be shovelled at. Without a `tendAt` the runner looked for a miner
  // within reach of the machine's own x, which is fifty-odd pixels the far side
  // of the apron from anywhere a miner ever stands, so the ram was never manned
  // and never took a bite.
  tendAt: () => ramX() - WORKER - P,
  ms: rate => minerMs() / Math.max(0.01, rate),
  ready: () => !S.pileFull.rock && boulderAlive(),
  bite: tender => {
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
    knockOff(x, y, bite);
    // Credited what it took, not one a strike -- `mined` counts cells off the
    // hill everywhere else it is written, and a machine that counted strikes
    // would read as a fifth of the work on the crew list.
    if (tender) tender.mined = (tender.mined || 0) + bite;
    S.dirty = true;
    return true;
  }
});
