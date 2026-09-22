// The hole in the ground: what goes in it, what it can hold, and what paying
// takes back out.
//
// The pile is the dust, not a picture of it: one grain is one dust, and the pile
// always shows as much of the hole as will fit in it. `PIT_GRAINS` in config.js
// lists the sizes a grain may be drawn at.

import { P, WORKER, PIT_W_MAX,
        PIT_H, PIT_HEAP, PIT_HEAP_SLOPE, PIT_GRAINS, CORE_CELL, SHARD_CELL, SPORE_CELL, SPARK_CELL,
        RIFT_GULP, RIFT_SHAKE, RIFT_G, RIFT_G_MIN, RIFT_EAT, RIFT_SWING,
        ABYSS_DOWN, findKind, someFind } from './config.js';
import { S, pit, rift } from './state.js';
import { at, put, addGrain, count, countDust, dustIn, isDust, roomFor, recount, bottomY, settleSome, wakeGrid,
         surfaceY, colOf, topRow } from './grid.js';
import { SETTLE_BUDGET } from './config.js';
import { makePainter } from './painter.js';
import { rand } from './rng.js';
import { bell } from './dust.js';
import { sfx } from './audio.js';
import { earned } from './income.js';

// --- how big the hole is -----------------------------------------------------
// One hole, the whole thing, from the first frame. The hole is scenery with a
// number in it, not a gate on the things the game is about.
export const pitWidth = () => PIT_W_MAX;
export const pitDepth = () => PIT_H;

// --- the shape of it, for anybody who has to walk it -------------------------
// The ladders into the hole, one down each wall, with the dust between them.
// Two, so the pit is a way through rather than a dead end: down one side,
// across the top of the pile, up the other.
export const NEAR = -1, FAR = 1;

export function pitLadder(side) {
  const x = side === FAR ? pit.x + pit.w - P : pit.x + P;
  return { x, top: S.groundY - WORKER, foot: pitTop(x) - WORKER };
}

// The top of whatever is in the hole at a place: what a body in the pit
// stands on, and what the muck lies on. `surfaceY` is one cell above this
// (where the *next* grain would rest); read as a surface it puts everything
// a cell too high.
export function pitTop(wx) {
  // A drowned pit is crossed on the plank at the mouth: the liquid is not
  // ground, and the pit must not go back to being a dead end. A merely torn
  // hole is still the working floor.
  if (S.drowned) return S.groundY;
  const c = colOf(pit, wx);
  if (c < 0 || c >= pit.cols) return S.groundY + pitDepth();
  return surfaceY(pit, c) + pit.p;
}

// Where the abyss's surface stands: a few cells below the brim once the hole
// has drowned. During the tear it rises out of the floor over the same
// breath `riftGulp` runs down. Owned here rather than by rift.js, which
// already reaches into this file for `swallow`.
export function abyssLine() {
  const line = S.groundY + ABYSS_DOWN;
  const floorY = S.groundY + pitDepth();
  const k = Math.max(0, Math.min(1, (S.riftGulp || 0) / RIFT_GULP));
  return line + (floorY - line) * k;
}

// Where the plot sits and how many cells it is. The near lip never moves.
// Where a handful thrown at the hole is aimed: most near the lip, tailing
// down the hole; or the disc with the rift open, since `riftCatch` takes
// every grain at the mouth and a spread across a floor that is not there is
// two motions. A little scatter either way, or grains on one pixel go round
// in single file. The haulers and your own held hand (`tossAtHole`) share it.
export function holeLanding() {
  if (S.riftOpen && !S.drowned) return rift.x + rift.w / 2 + bell() * rift.w * 0.4;
  const far = pit.x + Math.max(P, pit.w - P * 2);
  return Math.min(far, pit.x + P * 2 + Math.abs(bell()) * (far - pit.x) * 0.45);
}

export function shapePit() {
  pit.w = pitWidth();
  pit.h = pitDepth() + PIT_HEAP;         // the hole, and room to heap over it
  pit.cols = pit.w / pit.p;
  pit.rows = pit.h / pit.p;
  pit.y = S.groundY - PIT_HEAP;          // the plot starts above the ground line
}

// A bigger plot with the same pile in it. Columns and rows keep their
// numbers, so the pile stays against the near lip and the sand comes down
// onto the new floor rather than hanging over it.
function regridPit() {
  const want = pit.cols * pit.rows;
  if (pit.grid && pit.grid.length === want && pit.gridCols === pit.cols) return;
  const old = pit.grid, oldCols = pit.gridCols || 0, oldRows = pit.gridRows || 0;
  pit.grid = new Uint8Array(want);
  pit.gridCols = pit.cols;
  pit.gridRows = pit.rows;
  if (old && oldCols) {
    for (let c = 0; c < Math.min(oldCols, pit.cols); c++)
      for (let r = 0; r < Math.min(oldRows, pit.rows); r++)
        pit.grid[r * pit.cols + c] = old[r * oldCols + c];
  }
  recount(pit);                          // the cells were copied, not put
  pit.painter = makePainter(pit);        // the scratch canvas is the grid's size
  pit.onPut = pit.painter.mark;
}

// Build the plot at the size a grain is, with a fresh painter.
export function setPitGrain() {
  pit.p = PIT_GRAINS[0];
  shapePit();
  pit.grid = null;                       // a fresh plot, not a resize
  pit.gridCols = 0;
  regridPit();
  if (pit.ceiling) wirePit();            // the ceiling and the room are the new shape's
}

export function wirePit() {
  regridPit();                             // as big as it has been dug out
  pit.blocked = null;                      // nothing bars the pile, it just fills
  pit.repose = false;                      // and inside the hole it lies flat
  // What stands above the brim is a heap in the middle of the hole and
  // nothing at either end: the hole fills first, so a pile above the ground
  // line always means the hole under it is full, and it heaps from the
  // middle so it tapers to nothing at the lip. Whether the heap is unlocked
  // is a question about the *pile* (`pit.n`), not the counter: a core takes
  // a cell and is not dust, so by the counter the heap unlocked one grain
  // late and the crew stood throwing dust at a brim with nowhere under it.
  pit.holeCap = pit.cols * (pitDepth() / pit.p);
  pit.ceiling = c => pit.n < pit.holeCap ? pitDepth() / pit.p : heapCeiling(c);
  measurePit();
  if (!pit.painter) pit.painter = makePainter(pit);
  pit.onPut = pit.painter.mark;            // every change is told to the painter
  pit.painter.repaint();
  wakeGrid(pit);                           // a dug hole is a new ceiling over every column
}

// The pit is the one grid whose ceiling changes for every column at once
// when the hole fills or empties. That is a rule change, not a cell change,
// so the grain that filled the hole wakes only its own column; this wakes
// the rest.
let wasFull = false;

export function settlePit() {
  const full = pit.n >= pit.holeCap;
  if (full !== wasFull) { wasFull = full; wakeGrid(pit); }
  settleSome(pit, SETTLE_BUDGET);
}

// Whether the hole is full BY COUNT. A reading only: the board and the notice
// watch it, and nothing reads it to decide whether to carry. The count
// credits cells at the heap's shoulders the pile's search never fills, so a
// hole gated on it stood refusing a few grains short while the rift stayed
// shut. The pile alone knows whether a grain fits (`bankDust`). A find is
// counted in with everything else: one capacity, one queue.
export const pitFull = () => pit.n >= pitCapacity();

// Grains the count says the hole would still take, for the hooks that size a
// handout; nothing in the yard stands down on it.
export const pitRoom = () => Math.max(0, pitCapacity() - pit.n);

// What happens when the hole has no room left: it does not refuse, it
// COLLAPSES. The first grain it cannot take opens the rift and goes through
// it, so nothing stops and no purchase stands between the player and
// playing. Through the rift is not away: `inHole` is what you own less what
// is through, so the counters do not move (`swallow`).
export function throughRift(x, shade, n = 1, income = true) {
  S.seenFullPit = true;
  if (!S.riftOpen) {
    // The hole gives way: it takes the whole pile, and the yard is rocked
    // while it goes (`gulp` in rift.js).
    S.riftOpen = true;
    S.riftGulp = RIFT_GULP;
    S.riftShake = RIFT_SHAKE;      // knocked by whoever steps the world: see game.js
    sfx('rift-tear', { x: pit.x + pit.w / 2 });
  }
  const held = riftHeld();
  S.riftAte = (S.riftAte || 0) + n;   // fed at the mouth counts toward its growth
  let coin;
  if (isDust(shade)) {
    S.stored += n;
    S.banked += n;
    S.rift = (S.rift || 0) + n;
    coin = 'dust';
  } else {
    const kind = findKind(shade);
    if (shade === CORE_CELL || kind === CORE_CELL) { S.cores += n; S.seenCore = true; held.cores += n; coin = 'core'; }
    else if (kind === SHARD_CELL) { S.shards += n; S.seenShard = true; held.shards += n; coin = 'shard'; }
    else if (kind === SPORE_CELL) { S.spores += n; S.seenSpore = true; held.spores += n; coin = 'spore'; }
    else if (kind === SPARK_CELL) { S.sparks += n; S.seenSpark = true; held.sparks += n; coin = 'spark'; }
    else return false;              // nothing this hole knows how to hold
    S.shopStale = true;
  }
  if (income) earned(coin, n);
  return true;
}

// A bill handed back (`pullOut` in works.js, `buy` in upgrades.js): the
// payment's own picture the other way. The grains go back in the hole now,
// one `bankDust` each, and are shown arcing from the station (`x`, `y`) to
// the pile on `S.paid`, the flight `fly` in game.js already steps. What the
// hole will not take is not owed.
const CELL_OF = { dust: 1, core: CORE_CELL, shard: SHARD_CELL, spore: SPORE_CELL, spark: SPARK_CELL };
export function refund(money, n, x, y) {
  const cell = CELL_OF[money];
  if (!cell || !n) return 0;
  let got = 0;
  for (let i = 0; i < n; i++) {
    const shade = money === 'dust' ? 1 + Math.floor(rand() * 4) : someFind(cell);
    // A bill handed back is the player's own coin coming home, not income.
    if (!bankDust(pit.x + rand() * Math.min(700, pit.w), shade, 1, false)) break;
    got++;
    if (S.paid.length >= SHOWN) continue;
    S.paid.push({ x0: x, y0: y, x, y,
                  t: -rand() * 0.5, rate: 0.012 + rand() * 0.01,
                  lift: 60 + rand() * 90,
                  tx: pit.x + rand() * Math.min(700, pit.w), ty: S.groundY - P * 2,
                  s: shade });
  }
  return got;
}

// The speed a grain enters the drain with: whatever it had, plus a sideways
// nudge that makes it swirl instead of plunging. An initial condition, not a
// path: a share of the circular speed for where it joined (`sqrt(g*d)`), so
// it means the same at any distance. Which way round is the grain's own; a
// few going against the run is what a heap being dragged in looks like.
//
// The disc's rect is read off `rift` in the state rather than through
// rift.js, which reads this file.
function enterDrain(x, y, vx, vy) {
  const R = Math.max(1, rift.w * 0.5);
  const dx = (rift.x + rift.w * 0.5) - x, dy = (rift.y + rift.h * 0.5) - y;
  const d = Math.hypot(dx, dy);
  if (!d) return { vx, vy };
  // the same pull `orbit` in game.js will apply, so the two agree about what a
  // circular orbit here would need
  const g = Math.max(RIFT_G_MIN,
                     RIFT_G * (R * R) / Math.max(d * d, R * R * RIFT_EAT * RIFT_EAT));
  const v = RIFT_SWING * Math.sqrt(g * d) * (rand() < 0.5 ? -1 : 1);
  return { vx: vx + (-dy / d) * v, vy: vy + (dx / d) * v };
}

// A grain thrown at a torn pit is the rift's from the moment it crosses the
// mouth, rather than landing on a pile the rift would lift it straight back
// off. It counts exactly as an overflow grain does and joins the orbit from
// where it was caught. The cap on the orbit list is a drawing budget: a
// grain past it is counted and not drawn.
export function riftCatch(x, y, shade, vx = 0, vy = 0) {
  if (!throughRift(x, shade)) return false;
  if (S.gulped.length < SHOWN) {
    // It keeps the speed it arrived with: the rift pulls (`orbit` in
    // game.js) and what the grain does about it depends on how fast it was
    // going, so a hauler's throw swings round the hole and a grain lying
    // still drops.
    S.gulped.push({ x0: x, y0: y, x, y, t: 0, ...enterDrain(x, y, vx, vy), s: shade });
  }
  return true;
}

// `n` grains of one shade at one spot: the casino's pay lands a square worth
// millions. The pile is still asked a grain at a time, but once it has
// refused one it will refuse the rest, so the rest go through the rift as one
// sum; each refusal is a search of the whole pile. The grains are laid a
// column further out each, either side of `x` in turn, so each finds its
// column with room rather than searching out from the one the last filled.
export function bankDust(x, shade = 1, n = 1, income = true) {
  // The pile is asked, never the count: the first grain it has no cell for
  // is what tears the hole open (`throughRift`). So this never answers
  // false, and nothing carrying dust ever needs to ask the hole first.
  const c0 = colOf(pit, x);
  let laid = 0;
  for (; laid < n; laid++) {
    const off = (laid & 1 ? -1 : 1) * Math.ceil(laid / 2);
    const c = ((c0 + off) % pit.cols + pit.cols) % pit.cols;
    if (!addGrain(pit, laid ? pit.x + c * pit.p : x, null, shade)) break;
  }
  if (laid) {
    sfx('pit-land', { x });
    let coin = null;
    if (isDust(shade)) {
      S.stored += laid;                      // every pixel is worth one
      S.banked += laid;                      // the books count what came in, not what is left
      coin = 'dust';
    } else if (findKind(shade) === SHARD_CELL) { S.shards += laid; S.seenShard = true; S.shopStale = true; coin = 'shard'; }
    else if (findKind(shade) === SPORE_CELL) { S.spores += laid; S.seenSpore = true; S.shopStale = true; coin = 'spore'; }
    // The red out of the meteor's core, counted where everything else is.
    else if (findKind(shade) === SPARK_CELL) { S.sparks += laid; S.seenSpark = true; S.shopStale = true; coin = 'spark'; }
    if (coin && income) earned(coin, laid);
  }
  return laid < n ? throughRift(x, shade, n - laid, income) : true;
}

// how high a column may stand once the hole beneath it is full
function heapCeiling(c) {
  const fromEnd = Math.min(c, pit.cols - 1 - c);
  return pitDepth() / pit.p + Math.min(PIT_HEAP / pit.p, fromEnd * PIT_HEAP_SLOPE);
}

// What the plot can hold: the hole to the brim, and above it only as much as
// the heap is allowed to lean. Counted once when the plot changes shape.
export function capacityAt() {
  const p = pit.p;
  const cols = pitWidth() / p;
  const holeRows = pitDepth() / p;
  const rows = holeRows + PIT_HEAP / p;
  let n = 0;
  for (let c = 0; c < cols; c++) {
    // a column holds every row *below* its ceiling, so a ceiling of 71.4 is
    // seventy-two rows and not seventy-one
    const fromEnd = Math.min(c, cols - 1 - c);
    n += Math.min(rows, Math.ceil(holeRows + Math.min(PIT_HEAP / p, fromEnd * PIT_HEAP_SLOPE)));
  }
  return n;
}

export function measurePit() {
  pit.cap = capacityAt();
  return pit.cap;
}

export const pitCapacity = () => pit.cap || pit.cols * pit.rows;


// --- what is here, and what is somewhere else ---------------------------------
// The counter is all the dust you own; the pile is all the dust that is
// *here*; the rift holds the rest, and the two add up to the counter (see
// `## The rift` in DESIGN.md). Before the rift opens `S.rift` is nought.
export const inHole = () => Math.max(0, S.stored - (S.rift || 0));

// Every cell in the plot, dust and finds alike: what the tearing has to get
// through.
export const pitGrains = () => count(pit);

// What the pile is allowed to show, which is what the hole will take.
const pileTarget = () => Math.min(inHole(), pitCapacity());

// How many grains of a lift are drawn in flight at once; past a few hundred
// they draw over each other. The tearing asks for more (`RIFT_GULP_SHOW`).
const SHOWN = 200;

// Where paid grains fly to. Null is the bench; `payTo` sets it for the length
// of one purchase so the grains arc to the station that sold the row (`buy`
// in upgrades.js, `fly` in game.js).
let payX = null, payY = null;
export const payTo = (x = null, y = null) => { payX = x; payY = y; };

// Lift `n` grains off the top of the pile, handing each to `leaving` to be
// drawn on its way out. Paying and the rift both come through here, one
// walk with two destinations. `takes` says which cells (paying lifts dust;
// the rift takes whatever is on top, which is what makes it a hole rather
// than a sieve). `near` is what makes a rift look like one: a purchase comes
// off the top anywhere, a hole eats nearest its mouth first
// (`nearestSurface`), or it would wear six hundred columns down flat.
function lift(n, leaving, takes = isDust, took = null, near = null, show = SHOWN, within = Infinity) {
  let left = n;

  // What taking one grain is, wherever the walk found it: out of the plot, off
  // the ledger, and onto the list of things in flight.
  const take = (c, r, v) => {
    put(pit, c, r, 0);
    left--;
    if (took) took(v);
    if (leaving && leaving.length < show) {
      leaving.push({
        x0: pit.x + c * pit.p,
        y0: bottomY(pit) - (r + 1) * pit.p,
        x: pit.x + c * pit.p,
        y: bottomY(pit) - (r + 1) * pit.p,
        // Paying lifts a block in one frame and staggers it into a stream.
        // The rift lifts a few every frame and is already a stream;
        // staggered as well, most of a full list lies on the pile waiting.
        t: near ? 0 : -rand() * 0.5,
        rate: 0.012 + rand() * 0.01,
        lift: 60 + rand() * 90,     // how high it arcs on the way
        // A lifted grain was lying still, so `enterDrain` alone decides
        // whether it swings round the hole or drops down it.
        ...enterDrain(pit.x + c * pit.p, bottomY(pit) - (r + 1) * pit.p, 0, 0),
        // Stamped at lift so a grain keeps its destination however the list
        // is stepped.
        tx: payX, ty: payY,
        s: v
      });
    }
  };

  if (near) nearestSurface(near, n, takes, take, within);
  else {
    for (let r = pit.rows - 1; r >= 0 && left > 0; r--) {
      for (let c = 0; c < pit.cols && left > 0; c++) {
        const v = at(pit, c, r);
        if (takes(v)) take(c, r, v);
      }
    }
  }
  return n - left;                           // what was actually taken
}

// Take `want` grains off the pile, nearest a point first, handing each to
// `hit`.
//
// **Only the top grain of a column is a candidate.** The pile is read as a
// row of surfaces and the surface nearest the mouth is taken over and over;
// each take pushes that column further away and hands the next to somebody
// else, and what falls out with no shape written down is a bowl. That is the
// whole of the crater.
//
// Nearest-first is an **order, not a reach**: capped at a radius, a crater
// eaten faster than the pile can slump would leave the rift swallowing
// nothing beside a full hole.
//
// The columns are opened lazily into a heap keyed by distance. A column can
// never be nearer than its own offset from the mouth, so one is only opened
// once the best distance in hand has reached that offset, which is why a
// six-hundred-column pile only ever looks at the few dozen it is eating.
function nearestSurface(mouth, want, takes, hit, within = Infinity) {
  const p = pit.p;
  const limit = within * within;             // squared, like the keys
  const mcol = colOf(pit, mouth.x);
  const mrow = (bottomY(pit) - mouth.y) / p - 0.5;   // the mouth, in rows

  // the heap: a column, the top grain in it, and the square of how far that
  // grain is from the mouth. Squared, because nothing here needs the root.
  const col = [], top = [], key = [];
  let size = 0;
  const far = (c, r) => { const dx = c - mcol, dy = r - mrow; return dx * dx + dy * dy; };
  const swap = (i, j) => {
    const c = col[i], t = top[i], k = key[i];
    col[i] = col[j]; top[i] = top[j]; key[i] = key[j];
    col[j] = c; top[j] = t; key[j] = k;
  };
  const up = i => {
    while (i > 0) { const par = (i - 1) >> 1; if (key[par] <= key[i]) break; swap(i, par); i = par; }
  };
  const down = i => {
    for (;;) {
      const l = i * 2 + 1, r = l + 1;
      let m = i;
      if (l < size && key[l] < key[m]) m = l;
      if (r < size && key[r] < key[m]) m = r;
      if (m === i) return;
      swap(i, m); i = m;
    }
  };
  const drop = () => {                       // the top of the heap is finished with
    size--;
    if (size) { col[0] = col[size]; top[0] = top[size]; key[0] = key[size]; down(0); }
  };
  const open = c => {
    const r = topRow(pit, c);
    if (r < 0) return;                       // an empty column has no surface
    col[size] = c; top[size] = r; key[size] = far(c, r); size++;
    up(size - 1);
  };

  // the frontier of columns nobody has looked at yet, spreading either way
  let lo = mcol, hi = mcol + 1, reach = -1;
  const spread = to => {
    while (lo >= 0 && mcol - lo <= to) open(lo--);
    while (hi < pit.cols && hi - mcol <= to) open(hi++);
    reach = to;
  };

  let n = 0;
  spread(0);
  while (n < want) {
    // Anything nearer than the best in hand has to be opened before the best is
    // believed. With nothing in hand at all, widen a column at a time until
    // there is something or the pile has been read from end to end.
    const need = size ? Math.ceil(Math.sqrt(key[0])) : reach + 1;
    if (need > reach) spread(Math.min(need, pit.cols));
    if (!size) { if (lo < 0 && hi >= pit.cols) break; continue; }

    if (key[0] > limit) break;               // the nearest left is past the reach
    const c = col[0], r = top[0], v = at(pit, c, r);
    if (!takes(v)) { drop(); continue; }     // and nothing under it can be reached
    hit(c, r, v);
    n++;
    let next = r - 1;                        // whatever was lying under it
    while (next >= 0 && !at(pit, c, next)) next--;
    if (next < 0) drop();
    else { top[0] = next; key[0] = far(c, next); down(0); }
  }
  return n;
}

// The same, said as a ceiling rather than a count. `dustIn` is the ledger;
// `countDust` walks the whole plot, and three walks a frame to move a dozen
// grains was the rift's whole cost.
const liftTo = (target, leaving) => lift(dustIn(pit) - target, leaving);

// Paying comes out of the hole first and the rift only after it is empty:
// what you pay with should be what you are looking at.
export function spend(cost) {
  S.stored -= cost;
  const fromHole = Math.min(cost, dustIn(pit));
  // The rift never holds more than you own.
  if ((S.rift || 0) > S.stored) S.rift = Math.max(0, S.stored);
  liftTo(pileTarget(), S.paid);
  // What the hole could not show leaving surfaces out of the abyss (drowned)
  // or out of the disc's own middle (torn) and arcs to the station like any
  // lifted grain; a payment taken invisibly out of another dimension is a
  // purchase with no picture.
  const short = cost - fromHole;
  if (short > 0 && S.riftOpen) {
    const room = Math.max(0, SHOWN - S.paid.length);
    for (let i = 0; i < Math.min(short, room); i++) {
      let x, y0;
      if (S.drowned) {
        x = pit.x + rand() * Math.min(700, pit.w);
        y0 = abyssLine();
      } else {
        x = rift.x + rift.w * (0.25 + rand() * 0.5);
        y0 = rift.y + rift.h * (0.25 + rand() * 0.5);
      }
      S.paid.push({ x0: x, y0, x, y: y0,
                    t: -rand() * 0.5, rate: 0.012 + rand() * 0.01,
                    lift: 60 + rand() * 90,
                    tx: payX, ty: payY, s: 1 + Math.floor(rand() * 4) });
    }
  }
}

// The rift swallowing: grains off the top of the pile and into another
// dimension. The counter does not move, so this is the one thing that takes
// dust out of the pile without taking it off you. It takes and never gives
// back (the way to see your dust again is to spend it), and it takes
// **everything**, finds included, counting each kind in `S.riftHeld`: a hole
// that holds everything except four things is a rule you cannot see.
//
// `everywhere` is the tearing's: the whole pile lifts off top down, end to
// end, not a crater at the mouth. `within` is how far from the mouth a grain
// may lie and be taken (`riftReach`).
export function swallow(n, show, everywhere, within = Infinity) {
  const take = Math.max(0, Math.min(Math.floor(n), count(pit)));
  if (!take) return 0;
  const held = riftHeld();
  let dust = 0;
  // The mouth is read off `rift` in the state rather than asked of rift.js,
  // which reaches this file for `swallow`.
  const got = lift(take, S.gulped, v => !!v, v => {
    if (isDust(v)) { dust++; return; }
    const key = HELD_OF[v === CORE_CELL ? CORE_CELL : findKind(v)];
    if (key) held[key]++;
    // The grains go to the disc's UNDERSIDE, not its middle: measured from
    // the middle, a bigger disc sits its attractor higher, the distances to
    // neighboring columns even out, and the well under the mouth flattens
    // into a wide shallow scoop (`it eats the pile under it` in
    // rift.test.mjs). The underside stands RIFT_UP cells over the ground at
    // every size.
  }, everywhere ? null : { x: rift.x + rift.w * 0.5, y: rift.y + rift.h }, show, within);
  S.rift = (S.rift || 0) + dust;
  // What it has eaten, ever. Monotonic, and what the disc's size and the
  // drowning are derived from (`riftCells`, `stepRift`). What was taken, not
  // what was asked: with a reach the two differ, and crediting the ask grew
  // the disc off an empty pile.
  S.riftAte = (S.riftAte || 0) + got;
  return got;
}


// Put the dust where it belongs, after a save is read. The pile may be
// short (the saved pile did not fit this hole and was thrown away) or over
// (more is owned than the hole can show); either way, fill the hole to what
// it will take and everything past that goes through the rift. Nothing is
// clamped and nothing is destroyed.
export function rehomeDust() {
  if (!pit.grid) return;
  const want = Math.min(inHole(), pitCapacity());

  // Short: fill along, a column at a time. A grain offered to a random
  // column is refused once that column is full, and a hole nearly full turns
  // nearly every offer away.
  let have = countDust(pit), col = 0;
  while (have < want && col < pit.cols) {
    if (addGrain(pit, pit.x + col * pit.p + pit.p / 2, null, 1 + Math.floor(rand() * 4))) have++;
    else col++;
  }

  // Over: whatever the hole would not take is through the rift, and a save
  // that needs one has one.
  const over = inHole() - have;
  if (over > 0) {
    S.rift = (S.rift || 0) + over;
    S.riftOpen = true;
  }
  // And anything left over the target comes off the top, which is the ordinary
  // case of a hole that shrank.
  if (have > want) liftTo(want, null);
}

// The pile shows exactly what you still hold of everything that is not
// dust: topped up after a resize or a reload, taken out when spent. Every
// coin the hole holds is reconciled the same way, or the pile shows four of
// the five things you own.
const HELD = [[CORE_CELL, 'cores'], [SHARD_CELL, 'shards'],
              [SPORE_CELL, 'spores'], [SPARK_CELL, 'sparks']];

// The same table read the other way, derived so a fifth coin is one line.
const HELD_OF = Object.fromEntries(HELD.map(([cell, key]) => [cell, key]));

// What the rift is holding of each, never undefined: a save from before it
// existed has none.
export function riftHeld() {
  if (!S.riftHeld) S.riftHeld = { cores: 0, shards: 0, spores: 0, sparks: 0 };
  return S.riftHeld;
}

// How many of a kind are actually in the hole: what you own, less what has
// gone through the rift. The same split `inHole` makes for dust.
export const heldInHole = key => Math.max(0, (S[key] || 0) - (riftHeld()[key] || 0));

export function seedPitCores() {
  if (!pit.grid) return;
  const held = riftHeld();
  for (const [cell, key] of HELD) {
    let have = 0;
    for (const v of pit.grid) if (v === cell || (cell !== CORE_CELL && findKind(v) === cell)) have++;
    const want = heldInHole(key);
    // Near the lip, where the dust is and where you can see them. Each find
    // is aimed at its own spot along the lip; when that column has no room
    // it goes to the next that has, found by a cursor that only ever moves
    // on (the lip first, then the whole hole) rather than by `addGrain`'s
    // outward search, which walked half the hole per find once the lip was
    // heaped: eleven million column reads to seed a full hole, on every
    // reload.
    const lip = Math.max(1, Math.min(pit.cols, Math.floor(Math.min(700, pit.w) / pit.p)));
    const hasRoom = c => roomFor(pit, c, topRow(pit, c) + 1);
    // The cursor sweeps the middle four fifths of the lip, never its first
    // columns, which are where the carters tip: finds seeded there made a
    // full hole refuse the next tip a beat earlier, which is a different
    // yard.
    let lo = Math.floor(0.1 * lip), hi = Math.max(lo + 1, Math.floor(0.9 * lip)), cur = lo;
    const nextRoom = () => {
      for (;;) {
        for (let tried = 0; tried < hi - lo; tried++, cur = lo + (cur + 1 - lo) % (hi - lo)) if (hasRoom(cur)) return cur;
        if (lo === 0 && hi === pit.cols) return -1;  // the whole hole has no room: the rest is the rift's
        lo = 0; hi = pit.cols; cur = 0;
      }
    };
    for (let i = have; i < want; i++) {
      // The tone is rolled before the column is found: the roll is a draw on
      // the yard's one generator, and a seeded run that drew one fewer here
      // would be a different run from that frame on.
      const tone = cell === CORE_CELL ? cell : someFind(cell);
      let c = Math.floor((0.1 + 0.8 * ((i + 0.5) / Math.max(1, want))) * lip);
      if (!hasRoom(c)) c = nextRoom();
      if (c < 0 || !addGrain(pit, pit.x + (c + 0.5) * pit.p, null, tone)) break;
      have++;
    }
    // Whatever the hole would not take is through the rift, the same answer
    // `rehomeDust` gives for dust: a coin the pile cannot show is not a coin
    // you have stopped owning.
    const over = (S[key] || 0) - (held[key] || 0) - have;
    if (over > 0) {
      held[key] = (held[key] || 0) + over;
      S.riftOpen = true;
    }
    if (have > want) takeCoreCells(have - want, cell);
  }
}

// The rift, on the save (persist.js, `SAVERS`): the one part of the pile
// that is not in the pile. `stored` counts it, the hole does not hold it.
// The pile itself is the codec's (`PIT` in persist.js), read just before
// this, because how much belongs in the hole depends on how much is already
// through.
export const SAVE = {
  fields: ['rift', 'riftHeld'],
  write(out) {
    out.rift = S.rift;
    out.riftHeld = S.riftHeld;
  },
  read(s) {
    // Clamped to the counter: a rift holding more than you own leaves
    // `inHole` reading nought against a pile that plainly has dust in it.
    S.riftGulp = 0; S.riftShake = 0;     // a save comes back after the tearing, never in it
    S.rift = Math.max(0, Math.min(Math.round(+s.rift || 0), S.stored));
    // The coins through it, clamped to their own counters the same way.
    S.riftHeld = { cores: 0, shards: 0, spores: 0, sparks: 0 };
    for (const k of ['cores', 'shards', 'spores', 'sparks'])
      S.riftHeld[k] = Math.max(0, Math.min(Math.round(+(s.riftHeld?.[k]) || 0), S[k] || 0));
    rehomeDust();
    seedPitCores();
  },
  blank() {
    // A new yard has no hole in the air in it, and nothing standing on the
    // other side of one. An event is not a state (state.js).
    S.riftGulp = 0; S.riftShake = 0;
    S.rift = 0;
    S.riftHeld = { cores: 0, shards: 0, spores: 0, sparks: 0 };
    setPitGrain();
  }
};

// Lift cells of one kind out of the pile, topmost first, and say how many
// were there. What it could not find is through the rift, and `take` in
// upgrades.js pays the rest out of there.
export function takeCoreCells(n, cell = CORE_CELL) {
  let got = 0;
  for (let r = pit.rows - 1; r >= 0 && n > 0; r--) {
    for (let c = 0; c < pit.cols && n > 0; c++) {
      const v = at(pit, c, r);
      // by kind, not by tone: a shard is a shard whichever blue it happens to be
      if (v === cell || (cell !== CORE_CELL && findKind(v) === cell)) {
        put(pit, c, r, 0);
        n--;
        got++;
      }
    }
  }
  return got;
}

// Spending one of the coins the pile holds: out of the hole where you can
// see them go, and whatever the hole did not have off what the rift holds.
// One call, so the two halves cannot be done in one place and forgotten in
// another (`take` in upgrades.js and the casino's stake both come here).
export function spendHeld(n, cell) {
  const key = HELD_OF[cell];
  const got = takeCoreCells(n, cell);
  const over = n - got;
  if (over > 0 && key) {
    const held = riftHeld();
    held[key] = Math.max(0, (held[key] || 0) - over);
  }
  return got;
}
