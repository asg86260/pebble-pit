// The rock: how one is made, where it stands, how it is hit, and what comes off.
//
// A rock is a heightfield, not a disc: a broad hill with crags along its crest,
// sitting flat on the ground. Every cell holds how much rock is still stacked
// there, so a hit takes a sheet off the front and you dig *into* it.

import {
  P, MAX_DEPTH, ROCK_W, ROCK_H, ROCK_GROW_W, ROCK_GROW_H, ROCK_SINK, ROCK_SKY,
  ROCK_W_MAX, ROCK_H_MAX, ROCK_FLANK_CLEAR, ROCK_DROP, ROCK_DROP_CLEAR, DROP_GRAV, JOLT_GRAINS, LAND_SAY_MS,
  ROCK_CLEAR, SHAKE_LAND, WORKER, RAM_CRAWL, RAM_BACK, RAM_CLEAR, SQUASH_MS
} from './config.js';
import { throughRockMuck } from './smog.js';
import { frames, now } from './clock.js';
import { S, floor } from './state.js';
import { noteBite } from './notices.js';
import { spriteW, spriteH, stackCol, roofRow, seatCol, RAM } from './sprites.js';
import { defineMachine } from './machines.js';
import { at, put, depthShade, colOf, bottomY } from './grid.js';
import { pastRock, rockLeft, rockEdge, refreshPiles, shakeView, flankX } from './world.js';
import { spawnSpoil, spawnChip, critToss } from './dust.js';
import { critRoll } from './crit.js';
import { critBoost } from './apothecary.js';
import { pickCount, rockhandBite, rockhandMs } from './upgrades.js';
import { inWorking } from './route.js';
import { rand } from './rng.js';
import { JOB, TYPE } from './jobs.js';
import { sfx } from './audio.js';
import { refitShield } from './shield.js';

// --- boulder ----------------------------------------------------------------
// Thickness comes on every other rock: with the rock also growing wider and
// taller, a sheet a rock tripled the material over the first six.
export function depthOf() {
  return Math.min(MAX_DEPTH, 1 + Math.floor(S.boulderNo / 2));
}

// How wide rock n would be, in cells, before the flank has its say: what the
// shack stands off (`shackSpot`, world.js).
export const rockWidthAt = n => {
  const w = Math.min(ROCK_W_MAX, Math.round(ROCK_W + (n - 1) * ROCK_GROW_W));
  return w - (w % 2);
};

export function rockSize() {
  const w = Math.round(ROCK_W + (S.boulderNo - 1) * ROCK_GROW_W);
  const h = Math.round(ROCK_H + (S.boulderNo - 1) * ROCK_GROW_H);
  // The width is kept even: the rock is anchored by its middle, so an odd
  // width puts its edge half a cell off the grid and every column seams.
  // It keeps ROCK_FLANK_CLEAR clear of the nearest building, measured off
  // where that building actually stands (`flankX`); `TO_FIRST_SITE` is
  // derived from the same number, so this clamp only bites in a yard whose
  // sites table has been edited.
  const toFlank = Math.abs(S.cx - flankX());
  const wide = Math.max(10, Math.min(w, ROCK_W_MAX,
                                     Math.floor((toFlank - ROCK_FLANK_CLEAR) * 2 / P)));
  return {
    w: wide - (wide % 2),
    h: Math.max(6, Math.min(h, ROCK_H_MAX, Math.floor((ROCK_SKY - P * 4) / P)))
  };
}

// Where the foot of the rock is right now: above its place while it falls,
// a whole cell at a time, because a rock drawn half a device pixel off has a
// hairline through every row.
export const rockFootY = () =>
  S.groundY + ROCK_SINK - Math.round(S.rockFall / P) * P;

// the rock's foot sits just under the ground line so it looks planted, not laid
export function placeRock() {
  S.cy = rockFootY() - (S.gh / 2) * P;
}

// Where a held swing lands: the highest rock there is, at the nearest such
// column to the cursor. A click hits what you aimed at; a hold is working,
// and a gang works a rock from the top down, or it bores a shaft wherever
// the pointer was left.
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

// The ground the next rock is coming down on, or null when nothing is on its
// way. Between rocks the size is the next number's, so the crew can be told
// before the rock exists; footprint plus apron, so nobody is left with a
// cliff face against their shoulder.
export function dropZone() {
  // The rock the dome holds for the rescue waits overhead while somebody
  // walks in under it to dig; a footprint to be got out of would walk the
  // digger straight back out. Once they are out it is coming down.
  if (S.intro === 'rescue' && S.buried) return null;
  if (S.rockFall > 0) return { from: rockEdge(-1), to: rockEdge(1) };
  if (boulderAlive()) return null;
  // Nothing is coming while a scene has the yard, so the bare ground is
  // somewhere to stand.
  if (S.sceneHolds) return null;
  const was = S.boulderNo;
  S.boulderNo = was + 1;
  const size = rockSize();
  S.boulderNo = was;
  const half = Math.round((size.w / 2) * P);
  return { from: S.cx - half - ROCK_CLEAR, to: S.cx + half + ROCK_CLEAR };
}

// How far above its place a new rock starts: past the top of the window, so
// it comes in over the top rather than appearing halfway up the sky.
export function dropHeight() {
  const overhead = S.groundY - S.camY;          // ground line to the top of the window
  return Math.max(ROCK_DROP, overhead + ROCK_DROP_CLEAR);
}

// How long the rock in the air has left, in milliseconds. `stepRock` adds
// the gravity and then moves, so a fall of n frames covers v*n + g*n*(n+1)/2
// and this is that solved for n. The dance asks it: a body that leaves the
// ground has to know whether it can be back down before the landing. Zero
// when nothing is coming.
export function fallMs() {
  if (S.rockFall <= 0) return 0;
  return msToFall(S.rockFall, S.rockFallV);
}

// The whole of a fall from the sky, asked before there is one, for a scene
// that wants the frame a beat after the landing. Nothing in play reads it.
export function dropMs() {
  return msToFall(dropHeight(), 0);
}

function msToFall(left, v0) {
  const g = DROP_GRAV, v = v0 + g / 2;
  const n = (Math.sqrt(v * v + 2 * g * left) - v) / g;
  return n * (1000 / 60);
}

// One frame of a new rock coming down.
export function stepRock() {
  if (S.rockFall <= 0) return;
  // Something is holding it (shield.js): resting on something, not falling.
  if (S.rockHeld) { placeRock(); return; }
  // A rock takes the same time to come down whatever the machine is drawing at
  const f = frames();
  S.rockFallV += DROP_GRAV * f;
  S.rockFall -= S.rockFallV * f;
  if (S.rockFall <= 0) landRock();
  placeRock();
}

// It is down. One place for everything the yard does about that, however it
// arrived: dropped, or let down by the dome, which is the same event with
// the violence taken out.
export function landRock(gentle = false) {
  S.rockFall = 0;
  S.rockFallV = 0;
  // when it stopped being a falling rock and started being a hill -- see
  // `rockShape`. A rock set down by the dome does not splat: it is placed.
  S.landAt = gentle ? 0 : now();
  clearApron();
  sfx('boulder-land', { x: (rockEdge(-1) + rockEdge(1)) / 2, hard: 1, big: !gentle });
  if (!gentle) {
    jolt();
    // A taller rock is a heavier one: rock ninety should land like rock ninety.
    shakeView(SHAKE_LAND * Math.min(1.6, S.gh / ROCK_H));
    // Whoever watched it come down says so, and is knocked off their feet
    // for a beat (`hopAt`, `hopK`, drawn and never simulated; see
    // `drawWorkers`), at the shake's own scale. A body already off the
    // ground (falling, lifted, aloft, floating, or up in a dance jump) has
    // nothing to be knocked off; a rock 1 landing is the opening's own beat.
    if (S.boulderNo > 1) {
      const at = now();
      const k = Math.min(1.6, S.gh / ROCK_H);
      for (const w of S.workers) {
        if (w.inside || inWorking(w) || w.aloft) continue;
        w.say = { mark: 'bang', until: at + LAND_SAY_MS };
        if (w.falling || w.lifted || w.floating) continue;
        if (w.jigAt != null && w.y < w.foot) continue;
        w.hopAt = at;
        w.hopK = k;
      }
    }
  }
  S.dirty = true;
}

// The landing shakes the banks: grains already lying there hop off the top
// of each heap. Nothing here makes dust out of nothing.
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
  // A column just taken all the way down is not a surface any more, so what
  // was lying on it is thrown onto the heap rather than left hanging in the
  // air over a hole in the rock.
  for (let c = 0; c < S.gw && c < was.length; c++) {
    if (was[c] >= 0 && S.rockTops[c] < 0) tipSand(c);
  }
}

// --- what is lying on the rock -------------------------------------------------
// A chip that comes down over the crest lands ON the hill and lies there
// until a rockhand throws it onto the heap. Its own layer rather than a kind
// in the MESS table: a mess is worth nothing and is swept away, this is worth
// one dust a pixel and must be thrown, conserved, and every muck reading
// would have counted it as filth. One array of shades per column, bottom
// first; shades and not a count, because a grain's color is the depth it was
// cut from.
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

// World y of the top grain in a column. A bare column answers with the
// rock's own top, where the next grain down it would come to rest.
export const sandTopY = c => rockTopY(c) - sandDeep(c) * P;

// How far out of line a column may stand before a grain rolls off it.
const SAND_ANGLE = 2;

// Somewhere for a falling grain to rest, if the place it is falling on is
// the rock. False means the grain is somebody else's problem.
export function restOnRock(x, shade) {
  if (!boulderAlive()) return false;
  const c = Math.floor((x - rockLeft()) / P);
  // Written this way round on purpose: `c < 0 || c >= S.gw` lets a NaN
  // straight through both halves and on into the array.
  if (!(c >= 0 && c < S.gw) || S.rockTops[c] < 0) return false;
  const sand = rockSand();
  // It rolls off a shoulder rather than standing up on one: whichever of the
  // three columns is lowest takes it. Lower is a *bigger* y.
  let best = c;
  for (const n of [c - 1, c + 1]) {
    if (n < 0 || n >= S.gw || S.rockTops[n] < 0) continue;
    if (sandTopY(n) > sandTopY(best) + SAND_ANGLE * P) best = n;
  }
  sand[best].push(shade);
  S.dirty = true;
  return true;
}

// Lift the top grain off a column, or 0 for a bare one. The only way
// anything leaves the layer, and every caller throws what it gets.
export function takeSand(c) {
  const s = rockSand()[c];
  return s && s.length ? s.pop() : 0;
}

// Everything in one column onto the rock's heap, thrown, when the ground
// under it stops being ground.
function tipSand(c) {
  const s = S.rockSand && S.rockSand[c];
  if (!s || !s.length) return;
  const x = rockLeft() + c * P + P / 2;
  while (s.length) spawnSpoil(x, rockTopY(c) - s.length * P, s.pop());
  S.dirty = true;
}

// And the whole hill's worth, for a rock about to be replaced.
export function tipRockSand() {
  if (!S.rockSand) return;
  for (let c = 0; c < S.rockSand.length; c++) tipSand(c);
}

// Cells hold remaining thickness, deepest at the base and through the
// middle, thinning toward the skyline.
export function makeBoulder(fromSky = false) {
  // Whatever was lying on the last rock goes on the heap while there is
  // still a hill under it to say where it was.
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

  // The flag says "this one still has something to give up", not "there is
  // a core in here"; core.js decides which when the last pixel goes.
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
  // A falling rock clears the ground it needs when it gets there, not before.
  S.rockFall = fromSky ? dropHeight() : 0;
  S.rockFallV = 0;
  // A standing shield was planned for whichever rock was next; this is that
  // rock, so it is re-planned to fit. After the fall is set, so the plan
  // reads this rock as the one in the air.
  refitShield();
  refreshPiles();            // a wider rock is a narrower pile beside it
  placeRock();
  refreshRockTops();
  if (!fromSky) clearApron();
}

// Shift any dust standing where this rock's foot is going, so a boulder never
// lands in a heap. Only the footprint. *Thrown* onto the rock's heap, not
// handed to `addGrain`: its outward walk lands in the first column of the
// rock's own heap and stands a dozen cells hard against the foot, the sheer
// wall `bankCeiling` exists to prevent.
export function clearApron() {
  if (!floor.grid) return;
  // Only the footprint's columns are visited.
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


// The rock's surface, as a patch the one tidying rule can work (tidy.js): a
// rockhand between swings throws the nearest grain lying on the hill onto
// the rock's own heap.
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

// What shape the rock is in at this instant: round in the air, a hill on the
// ground. `round` is 1 all the way down and drops to 0 on impact; `squash`
// runs the other way for a fraction of a second after, which is why the
// change of shape reads as an impact rather than a substitution. Both are
// read off the clock and `rockFall`, so nothing is saved or reset.
export const rockShape = () => {
  if (S.rockFall > 0) return { round: 1, squash: 0 };
  const since = now() - (S.landAt || 0);
  if (since >= SQUASH_MS) return { round: 0, squash: 0 };
  const k = 1 - since / SQUASH_MS;
  return { round: 0, squash: k * k };            // spreads hardest at the first frame
};

// Whether there is any rock left, off `rockTops` rather than the grid: it
// is asked every frame by the ram, `stepCore`, every rockhand, every route
// and the drawing. So nothing zeroes `S.boulder` without going through
// `refreshRockTops` (`clearBoulder` is the one way).
export function boulderAlive() {
  const tops = S.rockTops;
  if (!tops) return false;
  for (let c = 0; c < tops.length; c++) if (tops[c] >= 0) return true;
  return false;
}

// The rock, gone: every cell to nought, and the tops with it.
export function clearBoulder() {
  S.boulder = S.boulder.map(row => row.map(() => 0));
  refreshRockTops();
}

// The rock is there *and on the ground*. One question for your own hand
// (`overBoulder`) and the ram's `ready`: `boulderAlive` alone is true the
// instant a new hill is built, and the ram hammered it all the way down from
// the sky.
export const rockDown = () => boulderAlive() && !(S.rockFall > 0);

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

// `want` is how many pixels this swing takes; your pick and a rockhand's are
// two tools. `dirties` is whose swing this is, kept though nothing at the
// rock fouls the sky any more. `body` is who is swinging (null for your own
// hand) so a body under a bracing tonic gets its lifted crit chance
// (`critBoost`); your click carries no body and no bonus.
export function knockOff(mx, my, want = pickCount(), dirties = true, body = null, from = 'you') {
  const c = pickCell(mx, my);
  if (!c) return;

  // Whatever came down in the last rain is on top of the rock, and a swing
  // goes into that first: the shift the rain cost you, paid here.
  want = throughRockMuck(want);
  if (want < 1) { S.dirty = true; return; }

  noteBite(body ? 'crew' : from);   // somebody has now bitten this rock

  // The rock is an unbounded job, so a crit ADDS pixels. One roll for the
  // swing, whoever is swinging; the spoil then flies up as a fountain.
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
  // How deep the nearest cell still is, as a share of the rock's full thickness:
  // the pick sounds lower and duller the more sheets are under it.
  const hard = took ? S.boulder[near[0].y][near[0].x] / depthOf() : 0;
  let through = null;                          // the first cell taken down to daylight
  for (const cell of near.slice(0, took)) {
    const left = S.boulder[cell.y][cell.x];
    const shade = depthShade(left, depthOf());   // how deep it looked, for color
    S.boulder[cell.y][cell.x] = left - 1;
    const { px, py } = cellPos(cell.x, cell.y);
    if (left === 1 && through === null) through = px;
    if (crit > 1) critToss(px, py, shade, 'rock', crit);
    else spawnSpoil(px, py, shade);
  }
  // The pick meeting stone. Your own click is never folded and a crit is an
  // event of its own; a body's swing folds with the yard. The ram is not
  // heard here: its strike is sounded by `stepMachines` at a body's pace,
  // and a second sound per strike made it twice as loud as anything else.
  if (took && from !== 'machine') {
    const yours = from === 'you' && !body;
    sfx(yours ? (crit > 1 ? 'rock-crit' : 'rock-hit') : (crit > 1 ? 'crew-crit' : 'rock-swing'), { x: mx, hard });
  }
  // ...and the last sheet of a cell going: the band moves as the rock gives way.
  if (through !== null) sfx('rock-through', { x: through, hard: 1 / depthOf() });
  // Taking rock apart does not dirty the sky, by anybody: what dirties this
  // yard is machinery, and the ram's dirt goes up off the ram's stack.
  S.dirty = true;
  refreshRockTops();
  // How many cells actually came off, so a machine can credit what it took
  // rather than what it asked for.
  return took;
}



// --- the ram --------------------------------------------------------------------
// The machine at the foot of the hill. A strike is a rockhand's swing through
// `knockOff`, so the muck on top is spent first and the spoil falls where
// spoil falls. **It replaces the rock hands, and not you**: your own swings
// come through `knockOff` from `input.js`, which this does not touch.
//
// The **face** is the near edge of what is left of the boulder, eaten from
// the left, and the one number the ram's geometry hangs off. Derived every
// frame: a new boulder puts the face back at the near end, and everything
// measured from it comes back with it.
export const rockFaceX = () => {
  for (let c = 0; c < S.gw; c++) if (S.rockTops[c] >= 0) return rockLeft() + c * P;
  return rockLeft() + S.gw * P;            // nothing left of it: the far end
};

// Cells of daylight between the machine's nose and the face: how far the arm
// travels. A stroke of one cell reads as a machine that is broken.
export const RAM_REACH = 8;

// Where it stands: back from the face by its own width and the arm's travel.
// **It follows the face**, so progress through the hill is watched rather
// than read off a bar, and **it drives, it does not teleport**: the parked
// spot is the target and the machine chases it, a slow crawl forward and a
// brisk reverse when a boulder is finished, clamped by real elapsed time so
// it advances the same under a fast-forwarded clock. The target is clamped
// clear of the nearest building (`flankX`), since a fresh boulder's face is
// near enough to park the ram inside its silhouette.
const ramTargetX = () => {
  const parked = rockFaceX() - P * (RAM_REACH + spriteW(RAM));
  return Math.round(Math.max(flankX() + RAM_CLEAR, parked) / P) * P;
};
let ramNowX = null, ramMovedAt = 0;
export function ramX() {
  const target = ramTargetX();
  const t = now();
  if (ramNowX == null) { ramNowX = target; ramMovedAt = t; }
  const f = Math.max(0, (t - ramMovedAt) / (1000 / 60));   // elapsed, in frames
  ramMovedAt = t;
  const d = target - ramNowX;
  const speed = d < 0 ? RAM_BACK : RAM_CRAWL;              // left is the drive home
  ramNowX += Math.sign(d) * Math.min(Math.abs(d), speed * f);
  return Math.round(ramNowX / P) * P;
}

defineMachine('ram', {
  job: JOB.ROCK,
  type: TYPE.ROCK,
  at: ramX,
  y: () => S.groundY - P * Math.round(spriteH(RAM) / 2),
  // Up on the roof of the engine, at the end away from the chimney: a body
  // that has climbed onto the thing is a body running it.
  seat: () => ({
    x: ramX() + seatCol(RAM) * P,
    y: S.groundY - spriteH(RAM) * P + roofRow(RAM) * P - WORKER
  }),
  // The top of its chimney: where the smoke leaves and where the dirt enters
  // the sky. Both read this, so they cannot come from two places.
  stack: () => ({ x: ramX() + stackCol(RAM) * P,
                  y: S.groundY - spriteH(RAM) * P }),
  // The yard side of the machine, clear of the apron where the next boulder
  // lands. Without a `tendAt` the runner looks for a rockhand within reach
  // of the machine's own x, the far side of the apron from anywhere a
  // rockhand stands, and the ram is never manned.
  tendAt: () => ramX() - WORKER - P,
  ms: rate => rockhandMs() / Math.max(0.01, rate),
  // Not while the rock is still coming down. The runner holds the beat clock
  // while `ready` is false, so the landing is not followed by a burst of
  // owed beats.
  ready: () => !S.pileFull.rock && rockDown(),
  // `n` beats of work in one strike (`stepMachines` hands a machine all it
  // is owed this frame at once): one `knockOff` and one `refreshRockTops`
  // rather than eight a frame.
  bite: (tender, n = 1) => {
    // The nearest column that still has rock in it, not a fixed spot: struck
    // at a fixed column, the arm went on swinging at a hole in the air for
    // the rest of the boulder.
    let col = -1;
    for (let c = 0; c < S.gw; c++) if (S.rockTops[c] >= 0) { col = c; break; }
    if (col < 0) return false;                 // nothing left of this one
    const x = rockLeft() + col * P + P / 2;
    const y = rockTopY(col) + P * 2;
    const bite = rockhandBite();
    const took = knockOff(x, y, bite * n, true, null, 'machine') || 0;
    if (!took) return 0;
    // Credited what it took, not one a strike: `mined` counts cells off the
    // hill everywhere else it is written.
    if (tender) tender.mined = (tender.mined || 0) + took;
    S.dirty = true;
    // Answered in beats' worth, so the stack smokes for the work done.
    return took / bite;
  }
});


// How far through this boulder the yard has got, 0 to 1. The ram draws a bar
// off it: a rock just gets smaller, with no shape to read progress from.
export function rockShare() {
  if (!S.boulder || !S.boulder.length) return 0;
  const full = S.gw * S.gh * depthOf();
  if (!full) return 0;
  let left = 0;
  for (const row of S.boulder) for (const v of row) left += v;
  return Math.max(0, Math.min(1, 1 - left / full));
}
