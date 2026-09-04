// The hole in the ground: what goes in it, what it can hold, and what paying
// takes back out.
//
// The pile is the dust, not a picture of it: one grain is one dust, and the pile
// always shows as much of the hole as will fit in it. `PIT_GRAINS` in config.js
// lists the sizes a grain may be drawn at -- adding finer ones lets the pile
// settle to them as it fills, keeping every grain and only losing resolution.

import { P, WORKER, PIT_W_MAX,
        PIT_H, PIT_HEAP, PIT_HEAP_SLOPE, PIT_GRAINS, CORE_CELL, SHARD_CELL, SPORE_CELL, SPARK_CELL,
        RIFT_GULP, RIFT_SHAKE, findKind, someFind } from './config.js';
import { S, pit, rift } from './state.js';
import { at, put, addGrain, count, countDust, dustIn, isDust, roomFor, recount, bottomY, settleSome, wakeGrid,
         surfaceY, colOf, topRow } from './grid.js';
import { SETTLE_BUDGET } from './config.js';
import { makePainter } from './painter.js';
import { buildShop } from './shop.js';
import { rand } from './rng.js';

// --- how big the hole is -----------------------------------------------------
// One hole, the whole thing, from the first frame.
//
// It used to be dug out a purchase at a time, from a scrape to the full pit --
// twenty-three of them. Which made the hole the ceiling on everything else: what
// you could hold was what you had dug, so every price in the game was really a
// statement about how much pit you had bought first, and a row you could not
// afford was as often a row you had nowhere to put as one you had not earned.
//
// The hole is scenery with a number in it. It is not the thing the game is
// about, and making it the gate on the things the game *is* about was the tail
// wagging the dog.
export const pitWidth = () => PIT_W_MAX;
export const pitDepth = () => PIT_H;

// --- the shape of it, for anybody who has to walk it -------------------------
// Where the top of the pile is and where the rungs are. It is geometry of the
// hole, so it lives with the hole.
//
// It used to live in smog.js, because the muck layer was the first thing that
// needed to know how deep the pile was and the answer got written where it was
// first asked for. Which left `route.js` -- the file that says where a body may
// walk -- importing the pit's ladders out of the file about the sky. Nobody
// reading either of them would look there.
//
// The ladders into the hole: one down each wall, and the dust in the bottom
// between them.
//
// The crew used to reach the layer in the pit from the lip, arm out over the
// mouth. It read as a fudge -- somebody shovelling a thing eight cells away and
// two deep without going near it -- and every other hole in this yard is one you
// go down: the quarry has a ladder in its near corner and the crew climb it hand
// over hand.
//
// Two of them, because the hole has two sides and there is ground beyond it. A
// single ladder in the near wall made the pit a dead end: everything past it was
// somewhere the crew could see muck lying and never reach, since the lip clamp
// pins them this side of the mouth. With a ladder in each wall the pit stops
// being a wall and becomes a way through -- down one side, across the top of the
// pile, and up the other.
export const NEAR = -1, FAR = 1;

export function pitLadder(side) {
  const x = side === FAR ? pit.x + pit.w - P : pit.x + P;
  return { x, top: S.groundY - WORKER, foot: pitTop(x) - WORKER };
}

// The top of whatever is in the hole at a place: the dust, or the floor when it
// is empty. What a body in the pit stands on, and what the muck lies on.
//
// `surfaceY` answers a different question -- where the *next* grain down this
// column would come to rest -- and that is one cell above the dust already
// there. Read as a surface it put everything a cell too high: the layer hung
// over the pile with daylight under it, and the crew walked the hole a cell off
// the ground the way they walk the yard a cell off the ground, which is to say
// not at all. One cell down is the top of the pile itself.
export function pitTop(wx) {
  const c = colOf(pit, wx);
  if (c < 0 || c >= pit.cols) return S.groundY + pitDepth();
  return surfaceY(pit, c) + pit.p;
}

// Where the plot sits and how many cells it is. The near lip never moves: a dig
// takes the far wall out and the floor down, so nothing you can already see
// changes place. Called from the layout, and again on every dig.
export function shapePit() {
  pit.w = pitWidth();
  pit.h = pitDepth() + PIT_HEAP;         // the hole, and room to heap over it
  pit.cols = pit.w / pit.p;
  pit.rows = pit.h / pit.p;
  pit.y = S.groundY - PIT_HEAP;          // the plot starts above the ground line
}

// A bigger plot with the same pile in it. Columns keep their number, so the pile
// stays where it was against the near lip; rows do too, so the sand comes down
// onto the new floor rather than hanging in the air over it. Nothing is lost and
// nothing is counted twice -- this is a bigger box, not a new one.
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

// One dig, bought at the bench: the far wall goes out and the floor goes down.
// The world is not laid out again -- it never depended on how far the hole had
// got, only on how far it can ever get -- so this is the plot and nothing else.
// The grain the pile is drawn at, which is one size and takes no argument. It
// used to take a step down a list and the press bought the steps; the list is
// one long now, so this is "build the plot at the size a grain is" and nothing
// else. Its painter is made fresh, the scratch canvas being the grid's size.
export function setPitGrain() {
  pit.p = PIT_GRAINS[0];
  shapePit();
  pit.grid = null;                       // a fresh plot, not a resize
  pit.gridCols = 0;
  regridPit();
  if (pit.ceiling) wirePit();            // the ceiling and the room are the new shape's
}

// nothing bars the pile, it just fills; it lies flat rather than heaping; and
// every change is told to the painter
export function wirePit() {
  regridPit();                             // as big as it has been dug out
  pit.blocked = null;                      // nothing bars the pile, it just fills
  pit.repose = false;                      // and inside the hole it lies flat
  // What stands above the brim is a heap in the middle of the hole, and nothing
  // at either end. Two rules, and they are both about not lying to you:
  //
  //   the hole fills first  -- nothing goes over the brim while there is still
  //                            room down there, so a pile above the ground line
  //                            always means the hole underneath it is full;
  //   and it heaps from the -- so it tapers away to nothing at the lip instead
  //   middle                   of standing there as a wall against the ground.
  // Whether the heap over the mouth is unlocked yet is a question about the
  // *pile*, not about the counter. They are nearly the same number and the
  // difference is the whole bug: a core in the pile takes a cell and is not
  // dust, so the hole was physically full one grain before the counter agreed,
  // the heap never unlocked, and the crew stood at the lip throwing dust at a
  // brim with nowhere under it.
  pit.holeCap = pit.cols * (pitDepth() / pit.p);
  pit.ceiling = c => pit.n < pit.holeCap ? pitDepth() / pit.p : heapCeiling(c);
  measurePit();
  if (!pit.painter) pit.painter = makePainter(pit);
  pit.onPut = pit.painter.mark;            // every change is told to the painter
  pit.painter.repaint();
  wakeGrid(pit);                           // a dug hole is a new ceiling over every column
}

// Whether the hole underneath was full the last time the pile was settled. The
// pit is the one grid whose ceiling changes for every column at once: while
// there is room down there nothing may stand above the brim, and the moment the
// hole fills every column is allowed to heap. That is a rule change, not a cell
// change, so the grain that happened to fill the hole wakes its own column and
// nothing else -- and every other column would sit at the old brim for ever.
// One comparison a frame buys the whole plot another look at the moment it
// matters. It goes the other way too: spending lifts grains off the top, the
// hole stops being full, and the brim comes back down over the lot.
let wasFull = false;

export function settlePit() {
  const full = pit.n >= pit.holeCap;
  if (full !== wasFull) { wasFull = full; wakeGrid(pit); }
  settleSome(pit, SETTLE_BUDGET);
}

// A full hole takes nothing. The pile is the dust -- one grain one dust, always
// -- so a counter that went on climbing while the pile stood still would be the
// number and the picture saying different things, which is the one thing this
// game does not do. When there is no room the dust does not go in and is not
// counted, and the way to bank another grain is to dig.
//
// A find is counted in with everything else. It used to go in over the ceiling
// on the grounds that a shard is a thing you went and got rather than a grain
// that happened -- but a hole that holds everything except the four things it
// does not hold is a hole with a rule you cannot see, and the counter over it
// stops being a reading of what is down there. One capacity, one queue: a shard
// takes a grain of room the same as a grain of dust does, and the crew book it
// the same way.
export const pitFull = () => pit.n >= pitCapacity();

// ...and whether it will actually TURN SOMETHING AWAY, which is a different
// question and the one everything that carries dust is really asking.
//
// A hole at its brim is full. A hole that has collapsed is full and still takes
// everything, because what will not fit goes through the rift. Machines and
// bodies were reading `pitFull` and standing down: the belt held its loads over
// a hole that would have swallowed them, and the ram would not bite. That is the
// old wall wearing a new name.
export const pitRefuses = () => pitFull() && !S.riftOpen;

// Grains of dust the hole would still take. What the crew book their trips
// against: see `pitFree` in crew.js.
export const pitRoom = () => Math.max(0, pitCapacity() - pit.n);

// Something goes in the hole. A grain of dust is worth one dust; a shard, a
// or a spore is worth one of itself. Either way it is a grain in the pile
// from here on, and the pile shows exactly what you are holding. False means
// the hole would not take it, and whatever was carrying it still has it.
// What happens when the hole has no room left.
//
// It used to refuse the grain, and the body carrying it kept it: a hauler stood
// at the lip holding a load it could not put down, the ones behind it backed up,
// and the yard stopped. The cure was a purchase -- a black hole summoned from
// the tower with red you could only get by playing -- so a yard that filled its
// hole before it could afford one had nothing to do about it. That is a game
// that stops, and worse, a game that can stop where no amount of playing gets
// you out: the coin you would spend to fix it is the coin that will not fit.
//
// So the hole does not refuse. It COLLAPSES: the first grain it cannot take
// opens the rift, and that grain goes straight through it. Nothing stops,
// nothing is lost, and there is no purchase standing between you and playing.
//
// Through the rift is not away. `inHole` is what you own less what is through,
// so the counters do not move and the pile simply shows less of what you have --
// which is the same account the rift has always kept, arrived at without the
// hole having to say no first. See `swallow`.
function throughRift(x, shade) {
  S.seenFullPit = true;
  if (!S.riftOpen) {
    // The hole gives way. This is the one dramatic thing that ever happens to
    // the pit: it does not open and then start draining at its rate, it takes
    // the whole pile, and the yard is rocked while it goes. See `gulp` in
    // rift.js for the emptying and RIFT_GULP in config.js for why.
    S.riftOpen = true;
    S.riftGulp = RIFT_GULP;
    S.riftShake = RIFT_SHAKE;      // knocked by whoever steps the world: see game.js
  }
  const held = riftHeld();
  if (isDust(shade)) {
    S.stored++;
    S.banked++;
    S.rift = (S.rift || 0) + 1;
  } else {
    const kind = findKind(shade);
    if (shade === CORE_CELL || kind === CORE_CELL) { S.cores++; S.seenCore = true; held.cores++; }
    else if (kind === SHARD_CELL) { S.shards++; S.seenShard = true; held.shards++; }
    else if (kind === SPORE_CELL) { S.spores++; S.seenSpore = true; held.spores++; }
    else if (kind === SPARK_CELL) { S.sparks++; S.seenSpark = true; held.sparks++; }
    else return false;              // nothing this hole knows how to hold
    buildShop();
  }
  S.dirty = true;
  return true;
}

// A grain thrown at a torn pit is the rift's from the moment it crosses the
// mouth. It used to land on the pile first and be lifted straight back off it
// the next frame -- the rift inhales everything in the hole, so with the rift
// open the pile is only ever a waiting room -- and a grain that touches down
// for one frame purely to be picked up again is a round trip with no meaning.
// It counts exactly as an overflow grain does (`throughRift`), and joins the
// orbit from where it was caught, so the picture is the throw being pulled in
// rather than a landing and a second lift.
//
// The cap on the orbit list is a drawing budget, not an account: a grain past
// it is counted all the same and simply not drawn on its way in, the same
// bargain `lift` strikes with SHOWN.
export function riftCatch(x, y, shade) {
  if (!throughRift(x, shade)) return false;
  if (S.gulped.length < SHOWN) {
    S.gulped.push({ x0: x, y0: y, x, y, t: 0,
                    a0: rand() * Math.PI * 2, spin: rand() < 0.5 ? -1 : 1, s: shade });
  }
  return true;
}

export function bankDust(x, shade = 1) {
  // A hole with no room turns the grain away and whatever was carrying it keeps
  // it. It used to settle the pile finer and try again; there is no finer now.
  // What makes room is the rift swallowing, which happens on its own clock.
  //
  // And the refusal is remembered, because it is what the rift is an answer to.
  // The row that sells one is offered the first time the hole says no and not
  // before -- the scrubbing house's rule, which is that a cure sold before the
  // disease is a cure for a number. It was a threshold on `banked` for an hour
  // and the threshold was unreachable: `banked` after filling the hole to the
  // brim is 37,566, and the number written down was fifty thousand, so the row
  // could not appear in a game that had done the exact thing it is about.
  if (!addGrain(pit, x, null, shade)) return throughRift(x, shade);
  if (isDust(shade)) {
    S.stored++;                              // every pixel is worth one
    S.banked++;                              // the books count what came in, not what is left
  } else if (findKind(shade) === SHARD_CELL) { S.shards++; S.seenShard = true; buildShop(); }
  else if (findKind(shade) === SPORE_CELL) { S.spores++; S.seenSpore = true; buildShop(); }
  // The red out of the meteor's core. It came down out of the sky, was fetched
  // off the ground like anything else, and is counted where everything else is
  // counted: in the hole.
  else if (findKind(shade) === SPARK_CELL) { S.sparks++; S.seenSpark = true; buildShop(); }
  S.dirty = true;
  return true;
}

// How much the plot can actually hold, which is no longer the whole of it: the
// hole fills to the brim everywhere, and above the brim only as much as the
// heap is allowed to lean. Counted once when the plot changes shape rather than
// every time somebody pays for something.
// how high a column may stand once the hole beneath it is full
function heapCeiling(c) {
  const fromEnd = Math.min(c, pit.cols - 1 - c);
  return pitDepth() / pit.p + Math.min(PIT_HEAP / pit.p, fromEnd * PIT_HEAP_SLOPE);
}

// What the plot would hold at a given dig, without digging it. The board asks
// this for the next one along, so it can say what the purchase buys.
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

// A full hole simply stays full.
//
// There used to be somewhere for it to go: `refinePit` settled the whole pile to
// a finer grain, sharing each column out across the finer columns standing where
// it did so the profile survived and only the resolution changed, and the press
// sold the steps. Both are cut -- see PIT_GRAINS in config.js. The hole is one
// size, and what overflows it goes through the rift instead.


// --- what is here, and what is somewhere else ---------------------------------
// The counter is all the dust you own. The pile is all the dust that is *here*.
// Late in the game those stop being the same number, because the rift holds the
// rest of it in another dimension -- see `## The rift` in DESIGN.md.
//
// Which is not the counter and the picture disagreeing, the thing this game does
// not do. It is the picture answering a narrower question than the counter, and
// saying so: the pile shows what is in the hole, the rift's own reading shows
// what is in the rift, and the two of them add up to the counter. Before the
// rift is built `S.rift` is nought and this is the number it always was.
export const inHole = () => Math.max(0, S.stored - (S.rift || 0));

// Every cell in the plot, dust and finds alike -- what the tearing has to get
// through. `inHole` is the dust account; this is the thing on the screen.
export const pitGrains = () => count(pit);

// And what the pile is allowed to show of it, which is what the hole will take.
const pileTarget = () => Math.min(inHole(), pitCapacity());

// How many grains of a lift are ever drawn in flight at once. A few hundred is
// plenty to read as a stream, and past that they are drawing over each other.
// The tearing asks for more (`RIFT_GULP_SHOW`), because the sight of it is the
// entire point of that moment.
const SHOWN = 200;

// Lift `n` grains off the top of the pile, handing each one to `leaving` so it
// can be drawn on its way out.
//
// Two things take grains back out of the hole -- paying for something, and the
// rift swallowing -- and they differ only in where the grains go and what that
// looks like. One walk, two destinations: writing the second one as its own copy
// of this loop is how the two of them drift apart.
// `takes` says which cells this lift is about. Paying in dust lifts dust, so
// that is the default; the rift takes whatever is on top, which is what makes it
// a hole rather than a sieve -- see `swallow`.
//
// `near` is the other thing the two destinations differ in, and it is what makes
// a rift look like a rift. A purchase comes off the top of the pile *anywhere* --
// that is the whole picture of paying, a stream off the heap -- so it walks the
// plot row by row and takes what it finds. A hole cannot eat that way: it would
// wear six hundred columns down evenly and flat while the disc hung over one of
// them, pulling nothing. Given a point, the walk goes nearest-that-point first
// instead; see `nearestSurface`.
// Where paid grains fly to. Null is the default -- the bench -- and `payTo` sets
// it for the length of one purchase so the grains a row costs arc to the station
// that sold the row, not to the bench. See `buy` in upgrades.js and `fly` in
// game.js, which reads the target off each grain. A spend with no `payTo` around
// it (the rift, an old call) leaves these null and falls back to the bench.
let payX = null, payY = null;
export const payTo = (x = null, y = null) => { payX = x; payY = y; };

function lift(n, leaving, takes = isDust, took = null, near = null, show = SHOWN) {
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
        // Paying lifts a block of grains in one frame and wants them to leave as
        // a stream, so each one waits its own fraction of a path before it
        // starts. The rift lifts a few every frame for as long as it is
        // swallowing: it is already a stream, and staggering it as well leaves
        // most of a full list lying on the pile waiting its turn -- which is a
        // ring of two or three grains under a hole eating thousands a second.
        t: near ? 0 : -rand() * 0.5,
        rate: 0.012 + rand() * 0.01,
        lift: 60 + rand() * 90,     // how high it arcs on the way
        // and, for the ones going into the rift, where on the ring they join
        // it and which way round they go -- see `orbit` in game.js
        a0: rand() * Math.PI * 2,
        spin: rand() < 0.5 ? -1 : 1,
        // Where this grain is paying to -- the selling station, or null for the
        // bench. Stamped at lift so a grain keeps its destination however the
        // list is stepped. See `fly` in game.js.
        tx: payX, ty: payY,
        s: v
      });
    }
  };

  if (near) nearestSurface(near, n, takes, take);
  else {
    for (let r = pit.rows - 1; r >= 0 && left > 0; r--) {
      for (let c = 0; c < pit.cols && left > 0; c++) {
        const v = at(pit, c, r);
        if (takes(v)) take(c, r, v);
      }
    }
  }
  S.dirty = true;
}

// Take `want` grains off the pile, nearest a point first, and hand each one to
// `hit`.
//
// **Only the top grain of a column is a candidate.** A hole pulls at what is
// exposed to it; a grain with three grains lying on it is not exposed. So the
// pile is read as a row of surfaces, and this takes the surface nearest the
// mouth, over and over. Every take drops that column's surface by one and so
// pushes it further away, which hands the next take to somebody else -- and what
// falls out of that, with no shape written down anywhere and no constant to
// tune, is a bowl. That is the whole of the crater: it is not drawn, it is what
// eating nearest-first leaves behind.
//
// Nearest-first is an **order, not a reach**. Capping it at a radius would look
// better still for a second and then stop the yard: a crater eaten out faster
// than the pile can slump into it would leave the rift swallowing nothing with a
// full hole either side of it, and a full hole is what the rift is for. There is
// always a farthest grain and it is always the last one taken.
//
// The columns are opened lazily, into a small heap keyed by distance. A column
// can never be nearer than its own offset from the mouth, so one is only worth
// opening once the best distance in hand has reached that offset -- which is why
// swallowing out of a pile six hundred columns wide only ever looks at the few
// dozen it is actually eating.
function nearestSurface(mouth, want, takes, hit) {
  const p = pit.p;
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

// The same, said as a ceiling rather than a count. Paying knows what the pile
// ought to end up holding; the rift knows how many grains it is taking.
//
// `countDust` walks the whole plot, so which of the two a caller wants is worth
// getting right: `swallow` used to ask this way and then be asked again inside,
// which was three walks of forty thousand cells every frame the rift ran, to
// move a dozen grains.
const liftTo = (target, leaving) => lift(dustIn(pit) - target, leaving);

// paying comes out of the hole: grains are lifted off the top until the pile is
// worth no more than the counter says.
//
// Out of the hole first and the rift only after it is empty. What you pay with
// should be what you are looking at -- the stream of grains arcing out of the
// pile to the bench is the whole of what a purchase looks like in this yard --
// and a payment taken invisibly out of another dimension while a full pile sat
// there untouched would be a purchase with no picture at all.
export function spend(cost) {
  S.stored -= cost;
  // Spent past everything in the hole, the rest comes out of the rift. It can
  // only ever come *down* to the counter: the rift never holds more than you own.
  if ((S.rift || 0) > S.stored) S.rift = Math.max(0, S.stored);
  liftTo(pileTarget(), S.paid);
}

// The rift swallowing: grains off the top of the pile and into another
// dimension. The counter does not move -- nothing has been spent and nothing has
// been lost, it is only somewhere else -- so this is the one thing in the game
// that takes dust out of the pile without taking it off you.
//
// It takes and it does not give back. A rift that handed grains out again
// whenever the hole had room would spend the endgame cycling dust in and out of
// the mouth for no reason anybody could act on; what the hole is for is what is
// coming *in*, and the rift is where the overflow goes. The way to see your
// dust again is to spend it.
// It takes **everything**, not only dust. A grain is a grain whatever it is:
// the shards, the spores, the red and the cores go through it exactly as the
// dust does, and what it holds of each is counted in `S.riftHeld`. It used to
// step over anything that was not dust, which left an endgame hole with its
// dust eaten away to nothing and a scatter of finds lying on the floor under a
// black disc that would not touch them -- a hole that holds everything except
// the four things it does not hold, which is the rule the pit threw out once
// already (see `bankDust`).
//
// Nothing is spent and nothing is lost, for a find the same as for dust: the
// counters do not move, the pile shows the counter less what is through, and
// the two of them together are still what you own.
// `everywhere` is the tearing's: the hole itself has given way, so the whole
// pile lifts off at once, top down, from end to end -- not a crater eaten at the
// mouth while the rest of the pile stands off the side of the window waiting its
// turn. What the rift does afterwards is pull at what is near it; what the tear
// does is take the lot.
export function swallow(n, show, everywhere) {
  const take = Math.max(0, Math.min(Math.floor(n), count(pit)));
  if (!take) return 0;
  const held = riftHeld();
  let dust = 0;
  // Out of the pile nearest the mouth first: the disc eats what it is over. The
  // mouth is read off `rift` in the state rather than asked of rift.js, which
  // reaches this file for `swallow` and would be a circle.
  lift(take, S.gulped, v => !!v, v => {
    if (isDust(v)) { dust++; return; }
    const key = HELD_OF[v === CORE_CELL ? CORE_CELL : findKind(v)];
    if (key) held[key]++;
  }, everywhere ? null : { x: rift.x + rift.w * 0.5, y: rift.y + rift.h * 0.5 }, show);
  S.rift = (S.rift || 0) + dust;
  return take;
}


// Put the dust where it belongs, wherever it was before.
//
// Called after a save is read. Two things can be wrong at that point and they
// have the same cure:
//
//   the pile is short  -- the saved pile did not fit this hole and was thrown
//                         away. `pitFromSave` bails when the plot it was written
//                         from is a different shape, which is exactly what a save
//                         made on a pressed pile is: 1800 columns of two-pixel
//                         grains arriving at a hole 600 columns wide. The hole
//                         was then left EMPTY with the counter still reading two
//                         hundred thousand -- the number and the picture saying
//                         different things, which is the one thing this game does
//                         not do, sitting in the reload path all along.
//
//   the pile is over   -- more dust is owned than this hole can show. That is not
//                         an error and never was: it is what the rift is for.
//
// So: fill the hole to what it will take, and everything past that goes through
// the rift. Nothing is clamped and nothing is destroyed. A player who pressed
// their pile twice and banked two hundred thousand opens the new build to a hole
// full of proper six-pixel dust and a rift holding the rest.
export function rehomeDust() {
  if (!pit.grid) return;
  const want = Math.min(inHole(), pitCapacity());

  // Short: fill along, a column at a time. Along rather than at random, because
  // a grain offered to a random column is refused once that column is full and
  // a hole nearly full turns nearly every offer away.
  let have = countDust(pit), col = 0;
  while (have < want && col < pit.cols) {
    if (addGrain(pit, pit.x + col * pit.p + pit.p / 2, null, 1 + Math.floor(rand() * 4))) have++;
    else col++;
  }

  // Over: whatever the hole would not take is through the rift, and a save that
  // needs one has one. It is not a purchase in that case -- it is where the dust
  // already was, under a name the old build did not have for it.
  const over = inHole() - have;
  if (over > 0) {
    S.rift = (S.rift || 0) + over;
    S.riftOpen = true;
  }
  // And anything left over the target comes off the top, which is the ordinary
  // case of a hole that shrank.
  if (have > want) liftTo(want, null);
  S.dirty = true;
}

// The pile shows exactly what you still hold, of everything that is not dust:
// top up after a resize or a reload, and take them back out when they are spent.
// Nothing about where any one of them sits is worth saving, so this is also how
// they come back from a save.
//
// The red is in here, and was not. Nothing was ever priced in sparks, so a
// spark went into the pile when it was banked and was never reconciled again --
// which meant a reload put the counter back and the grains did not come with
// it. Every coin the hole holds is reconciled the same way or the pile is
// showing four of the five things you own.
const HELD = [[CORE_CELL, 'cores'], [SHARD_CELL, 'shards'],
              [SPORE_CELL, 'spores'], [SPARK_CELL, 'sparks']];

// The same table read the other way: which counter a cell belongs to. Derived,
// so a fifth coin is a line above rather than a second place to forget.
const HELD_OF = Object.fromEntries(HELD.map(([cell, key]) => [cell, key]));

// What the rift is holding of each, and never undefined: a save from before it
// existed has none, and every read here would otherwise have to guard.
export function riftHeld() {
  if (!S.riftHeld) S.riftHeld = { cores: 0, shards: 0, spores: 0, sparks: 0 };
  return S.riftHeld;
}

// How many of a kind are actually in the hole, which is what the pile shows:
// what you own, less what has gone through the rift. The counter on the card is
// still the two together -- exactly the split `inHole` makes for dust.
export const heldInHole = key => Math.max(0, (S[key] || 0) - (riftHeld()[key] || 0));

export function seedPitCores() {
  if (!pit.grid) return;
  const held = riftHeld();
  for (const [cell, key] of HELD) {
    let have = 0;
    for (const v of pit.grid) if (v === cell || (cell !== CORE_CELL && findKind(v) === cell)) have++;
    const want = heldInHole(key);
    for (let i = have; i < want; i++) {
      // near the lip, where the dust is and where you can see them: a dug-out pit
      // runs a long way right, and one out in the empty end is one nobody finds.
      // A hole that has not been dug that far is spread over what there is.
      if (!addGrain(pit, pit.x + (0.1 + 0.8 * ((i + 0.5) / Math.max(1, want))) * Math.min(700, pit.w), null,
                    cell === CORE_CELL ? cell : someFind(cell))) break;
      have++;
    }
    // Whatever the hole would not take is through the rift, which is the same
    // answer `rehomeDust` gives for dust and for the same reason: nothing is
    // clamped and nothing is destroyed, and a coin the pile cannot show is not
    // a coin you have stopped owning. An endgame hole is full to the brim, so
    // without this a find had nowhere to be and the counter was left saying you
    // held something the yard could not point at.
    const over = (S[key] || 0) - (held[key] || 0) - have;
    if (over > 0) {
      held[key] = (held[key] || 0) + over;
      S.riftOpen = true;
    }
    if (have > want) takeCoreCells(have - want, cell);
  }
}

// Lift cells of one kind out of the pile, topmost first, and say how many were
// actually there. What it could not find is not missing: it is through the rift,
// and `take` in upgrades.js pays the rest out of there -- out of the hole first
// and the other dimension only after it is empty, which is the rule paying in
// dust already keeps.
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

// Spending one of the coins the pile holds: the grains come out of the hole
// where you can see them go, and whatever the hole did not have comes off what
// the rift is holding. One call, so the two halves cannot be done in one place
// and forgotten in another -- `take` in upgrades.js and the casino's stake both
// go through here.
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
