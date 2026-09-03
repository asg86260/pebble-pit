// The quarry: a mouth in the ground away to the left of the rock.
//
// Crew climb down into it and work the face where you can see them. The pace
// is the whole of the mechanic -- it is what an upgrade shortens, and what makes
// sending somebody down there a decision rather than a free tap, because a
// quarrier underground is a worker not carrying dust.
//
// Nothing about the quarry is shown until it is opened, the way nothing about
// cores is shown until one is banked.

import { keepTo, stepRoute, ways, wayAt, feetOn, climbTo } from './route.js';
import { BENCH_COST, BENCH_RATE, QUARRY_BENCH_MAX, CUT_DIG_MS, CUT_SEAM, JAW_BILL, RUNGS } from './config.js';
import { P, WORKER, QUARRY_BASE, QUARRY_FLOOR, QUARRY_WALK, CUT_STEP, QUARRY_SWING, QUARRY_SHUFFLE,
         QUARRY_NEAR_BENCH, QUARRY_FAR_BENCH, QUARRY_FLOOR_STEP, QUARRY_FLOOR_JAG,
         CLIMB_PACE, SHARD_CELL, someFind, QUARRY_H, QUARRY_DEEPEN, QUARRY_BENCH0 } from './config.js';
import { throughQuarryMuck, yardMuckFor } from './smog.js';
import { QUARRY_FOUL } from './config.js';
import { spriteW, spriteH, stackCol, roofRow, seatCol, DRILL } from './sprites.js';
import { S, quarry, cut, floor } from './state.js';
import { walkY, groundAt, benches, resite, pileOf, bridgeSpan } from './world.js';
import { at, put, wakeGrid, isDust, surfaceY, topRow, colOf } from './grid.js';
import { makePainter } from './painter.js';
import { ROCK_CELL } from './config.js';
import { mult } from './lab.js';
import { spawnChip, aim, bell, critToss } from './dust.js';
import { critRoll } from './crit.js';
import { now } from './clock.js';
import { defineMachine, buyMachine, canBuy } from './machines.js';
import { spelled } from './tower.js';
import { SPELL_LUCK } from './config.js';
import { rebalance, kitFull, commutePace, swing, rungCost } from './upgrades.js';
import { tuneRow } from './machines.js';
import { MACHINE_TUNE } from './config.js';
import { rand } from './rng.js';
import { tidyStep } from './tidy.js';
import { registerRows } from './works.js';

// how long a trip takes, at this pace
// A ladder with an end on it, like every other rate in the game -- five rungs
// from the base to the floor, and the fifth rung *is* the floor. See `swing` in
// upgrades.js, whose comment is the argument for this shape.
//
// It used to be a fraction a level for ever: multiply by 0.82 and clamp. Which
// put the floor at somewhere around the ninth rung -- a number nobody had
// written down and the board could not show, so the row simply stopped being
// worth buying at a point you had to discover by buying past it. Spread over the
// rungs, the last one lands on the floor and the row says so.
// The ladder is built at the moment it is read rather than once at the top of
// the file. Two reasons, and both of them matter: the base is a dial in the dev
// tuner (`let`, in config.js), so a ladder frozen at module load would go on
// answering with the number the game started with -- and upgrades.js imports
// this file, so a `swing(...)` run while this module's body is being evaluated
// can be reached before upgrades.js has finished defining it.
const quarryGap = lvl => swing(QUARRY_BASE, QUARRY_FLOOR, RUNGS)(Math.min(lvl, RUNGS));
export const quarryMs = (lvl = S.quarryPaceLevel) =>
  Math.max(500, Math.round(quarryGap(lvl) / mult('quarry')));

export const quarryRate = (lvl = S.quarryPaceLevel) => 60000 / quarryMs(lvl);   // trips a minute

// --- the ladder ---------------------------------------------------------------
// Bodies used to sink into the quarry and rise out of it wherever they happened to
// be standing, straight down through the air in the middle of the mouth. That
// is the one thing in this yard that was plainly not a thing that could happen:
// everything else walks, climbs a wall or goes through a door.
//
// So there is a ladder, in the near corner where the wall's toe is -- one place,
// worked out from the quarry, so the rungs you can see and the line a body climbs
// are the same line by construction. Going in is walking to the head of it and
// coming down it; coming out is walking back along the floor to its foot and
// going up.
export const LADDER_W = P * 3;         // stile to stile
export const LADDER_OVER = P;          // how far its head stands proud of the top

export function ladder() {
  const c = quarryShape();
  const x = Math.round(c.from / P) * P;
  // It comes up to the *bridge*, not to the ground line. The deck runs over the
  // mouth four cells above the rim, and the ladder stands in the mouth, so a
  // ladder that stopped at ground level was a ladder ending in mid-air a body's
  // height under the road everybody walks in on. `groundAt` already knows where
  // the walking surface is at a given x -- over the mouth that is the deck --
  // so asking it is the same as asking where the top of the ladder should be.
  const top = groundAt(x + LADDER_W / 2) - LADDER_OVER;
  return { x, w: LADDER_W, top, foot: quarryFloor(c.from + P) };
}

// where a quarrier stands to get on it, going either way
export const quarryFace = () => ladder().x + LADDER_W / 2 - WORKER / 2;

export function newQuarrier() {
  return {
    type: 'quarrier',
    goal: 'to',                            // to the rim, then down, then work
    next: 0,
    // Not on the same beat as everybody else. Two quarriers used to walk the
    // face at exactly the same pace, turn at exactly the same wall and start
    // swinging on the same frame, which read as one animation played twice
    // rather than as two people working. The miners have had their own rhythms
    // since the day they were written; these are the same four numbers.
    swingAt: now() + rand() * QUARRY_SWING,
    lunge: 0,
    ph: rand() * Math.PI * 2,       // where in its sway it starts
    sp: 0.5 + rand() * 0.9,         // and how fast it sways
    pace: 0.7 + rand() * 0.6,       // and how briskly it works along the face
    dir: rand() < 0.5 ? -1 : 1,
    seat: 0,                               // where along the floor it stands
    x: quarryFace(),
    y: 0,
    carry: 0
  };
}

// The shape of the quarry: both walls stepping down in benches, and the uneven
// floor between them. It is worked out from the mouth once and kept, because
// nothing about it moves unless the world is laid out again -- and because
// `quarryFloor` is asked where the ground is once per quarrier per frame.
//
// The benches are scenery, but the floor is not: the crew stand on it, so the
// same numbers that draw it are the ones that put their feet down.
let shape = null, shapeKey = '';

// Four numbers compared, not a string built. The key was a template string
// made on every call, and this is called once per quarrier per frame and once
// per route -- measured, building the string was a twentieth of the driven
// yard's whole frame, for a shape that changes a handful of times a run.
let keyX = NaN, keyW = NaN, keyH = NaN, keyG = NaN;

export function quarryShape() {
  if (shape && keyX === quarry.x && keyW === quarry.w && keyH === quarry.h && keyG === S.groundY) return shape;
  const key = `${quarry.x}|${quarry.w}|${quarry.h}|${S.groundY}`;
  keyX = quarry.x; keyW = quarry.w; keyH = quarry.h; keyG = S.groundY;

  const snap = v => Math.round(v / P) * P;
  const deep = snap(S.groundY + quarry.h);

  // one wall, rim to floor. `dir` is which way it eats into the mouth, and the
  // drops are shares of the depth, so the last bench lands exactly on the floor
  // however the pattern is edited.
  const wall = (benches, x0, dir) => {
    const total = benches.reduce((a, b) => a + b[1], 0);
    const pts = [[x0, S.groundY]];
    let x = x0, y = S.groundY;
    benches.forEach(([inset, drop], i) => {
      x = snap(x + dir * inset * quarry.w);
      pts.push([x, y]);                                          // in along the bench
      y = i === benches.length - 1 ? deep : snap(y + (drop / total) * quarry.h);
      pts.push([x, y]);                                          // and down the face
    });
    return pts;
  };

  const near = wall(QUARRY_NEAR_BENCH, quarry.x, 1);
  const far = wall(QUARRY_FAR_BENCH, quarry.x + quarry.w, -1);
  const from = near[near.length - 1][0], to = far[far.length - 1][0];

  // and the floor, in stretches a few cells wide, each sitting a cell or two
  // above the deepest line
  const floor = [];
  for (let i = 0, x = from; x < to; i++) {
    const nx = Math.min(to, x + QUARRY_FLOOR_STEP * P);
    floor.push({ from: x, to: nx, y: deep - QUARRY_FLOOR_JAG[i % QUARRY_FLOOR_JAG.length] * P });
    x = nx;
  }

  // Each wall's toe meets the floor it actually runs into, rather than the
  // deepest line: a wall that dropped past its own floor left a slot at the
  // bottom that reads as a crack rather than a corner.
  near[near.length - 1][1] = floor[0].y;
  far[far.length - 1][1] = floor[floor.length - 1].y;

  // The whole outline, rim to rim, for whoever has to draw it -- with the
  // repeats dropped, because a bench of no width and a stretch of floor that
  // carries on at the same height both put the same point in twice.
  const outline = [];
  const add = ([x, y]) => {
    const last = outline[outline.length - 1];
    if (!last || last[0] !== x || last[1] !== y) outline.push([x, y]);
  };
  near.forEach(add);
  for (const f of floor) { add([f.from, f.y]); add([f.to, f.y]); }
  far.reverse().forEach(add);

  shapeKey = key;
  return (shape = { outline, floor, from, to, deep });
}

// Where the ground is inside the quarry: the bottom of whatever has been dug out of
// that column. It used to be the floor of a hole that existed whether or not
// anybody had dug it -- there is no hole now until somebody digs one, so the
// ground underfoot is exactly what has been taken away.
export function quarryFloor(x = null) {
  if (x === null) return quarryShape().deep;     // the deepest it will ever go
  return dugTopY(x);
}

// --- the cut's own sand ---------------------------------------------------------
// The dust that falls down the cut's mouth needs somewhere to lie, and the
// column heights above are not it: they say how far down the rock has been
// taken, not what is sitting on the floor that leaves. So the cut gets a grid
// of its own, the way the pit has one -- see `cut` in state.js for why every
// field is declared up front.
//
// The rock still to come out is *in* the grid, as `ROCK_CELL`: it fills every
// column from the very floor of the plot up to the line the dig has actually
// reached (see config.js). A grain lands on top of whatever rock is still
// there and falls no further than that -- the same `at`/`put` the dust already
// answers to -- and the moment a swing takes a cell of rock out from under it,
// the ordinary sand rules carry it down one more row on their own. Nothing
// here has to know that a quarry exists.
//
// Sized once, at the deepest the cut can ever be worked to (`QUARRY_BENCH_MAX`
// benches), rather than grown a row at a time as benches are bought: a bench
// bought mid-dig only ever adds *more permanent floor* under a column's current
// target, it never moves a row index a grain is already resting in, so nothing
// has to be re-packed when it happens.
function cutRows() {
  return Math.round((QUARRY_H + (QUARRY_BENCH_MAX - QUARRY_BENCH0) * QUARRY_DEEPEN) / P);
}

// Build the cut's grid, or leave it alone if it is already the right shape.
// Called once from `settleIntoWorld`, after `quarry.x`/`quarry.w` are laid out
// -- a resize of the window moves neither, so this only ever does real work
// once a run.
export function wireCut() {
  cut.x = quarry.x;
  cut.cols = Math.max(0, Math.round(quarry.w / P));
  cut.rows = cutRows();
  cut.y = S.groundY;
  const want = cut.cols * cut.rows;
  if (cut.grid && cut.grid.length === want) {
    if (cut.painter) cut.painter.repaint();
    return;
  }
  cut.grid = new Uint8Array(want);
  cut.n = 0;
  cut.rock = 0;
  cut.fixed = (c, r) => at(cut, c, r) === ROCK_CELL;
  cut.painter = makePainter(cut);
  cut.onPut = cut.painter.mark;
  layCut();
}

// Lay fresh rock into every column, up to however far it has (not) been dug --
// the whole plot on an empty quarry, nothing at all on one worked all the way
// out. It is what a fresh cut looks like from the first frame, and what
// `fillQuarry` puts back once a dig is spent.
export function layCut() {
  if (!cut.grid) return;
  const cells = quarryCells();
  for (let c = 0; c < cut.cols; c++) {
    const top = cut.rows - 1 - (cells[c] || 0);
    for (let r = 0; r <= top && r < cut.rows; r++) {
      if (at(cut, c, r) !== ROCK_CELL) { put(cut, c, r, ROCK_CELL); cut.rock++; }
    }
  }
}

// Take one cell of rock out of column c, the shallowest one still standing --
// which is exactly the cell `dugTopY` moves past. Whatever dust is sitting
// above it is not touched here at all: it simply has nothing under it on the
// next pass, and `settle` takes it from there.
export function digCell(c) {
  const cells = quarryCells();
  if (cut.grid) {
    const r = cut.rows - 1 - cells[c];
    if (r >= 0 && r < cut.rows && at(cut, c, r) === ROCK_CELL) {
      put(cut, c, r, 0);
      cut.rock = Math.max(0, cut.rock - 1);
    }
  }
  cells[c]++;
  S.quarryTotal = (S.quarryTotal || 0) + 1;
}

// Whatever fell down the cut comes back up with the ground, thrown out at the
// mouth exactly the way a shard is: every pixel is worth one dust, and closing
// the fill over it instead would be a hole that destroys what a dig did not
// spend. Called before the columns are zeroed, so there is still a floor under
// what is being lifted off it.
function tipCut() {
  if (!cut.grid) return;
  for (let c = 0; c < cut.cols; c++) {
    for (let r = cut.rows - 1; r >= 0; r--) {
      const v = at(cut, c, r);
      if (!v || !isDust(v)) continue;
      put(cut, c, r, 0);
      const x = cut.x + c * P + P / 2;
      const y = cut.y + (cut.rows - 1 - r) * P;
      tossOut(x, y, v);
    }
  }
}

// The top of the cut at x: the dust lying there if there is any, the rock
// under it otherwise. `dugTopY` alone is what a quarrier's feet answered to
// before this grid existed, and it is still the honest floor of a column with
// nothing on it -- but a column with dust on it stands taller than that, and a
// body or a route asking "what is underfoot here" wants the dust's own top, not
// the rock two feet under it. See `stepQuarrier` and `ways` in route.js.
export function cutTop(x) {
  const c = colOfX(x);
  if (!cut.grid || c < 0 || c >= cut.cols) return dugTopY(x);
  return surfaceY(cut, c) + cut.p;
}

// The floor of the cut, as a patch the one tidying rule can work -- see tidy.js.
// A quarrier between digs picks up the nearest grain that has fallen in on it
// and throws it up over the rim onto the quarry's own heap, on the same arc a
// seam takes: `tossOut` is what clears the rim, and dust and stone leave this
// hole exactly the same way.
//
// The claim book it is handed is `cutTaken`, which is the haulers' book for the
// same floor -- one book, so a quarrier and a hauler can never go for the same
// column. See the pick in crew.js.
export const cutPatch = () => ({
  key: 'quarry',
  cols: cut.cols,
  colOf: x => colOf(cut, x),
  xOf: c => cut.x + c * P + P / 2,
  peek: c => { const r = topRow(cut, c); return r >= 0 && isDust(at(cut, c, r)) ? at(cut, c, r) : 0; },
  take: c => {
    const r = topRow(cut, c);
    if (r < 0 || !isDust(at(cut, c, r))) return 0;
    const v = at(cut, c, r);
    put(cut, c, r, 0);
    return v;
  },
  yOf: c => cut.y + (cut.rows - 1 - topRow(cut, c)) * P
});

// Back to a fresh cut: no dust, and the rock refilled to whatever the dig
// depth is at the time it is called. Used when a save comes in, since the dig
// depth it names has already been restored by the time this runs -- see
// `restore` in persist.js -- and by a full reset of the game.
export function resetCut() {
  if (!cut.grid) return;
  cut.grid.fill(0);
  cut.n = 0;
  cut.rock = 0;
  wakeGrid(cut);
  layCut();
}

// the stretch of floor a quarrier may work: between the toes of the two walls
export const quarryBand = () => {
  const c = quarryShape();
  return { lo: c.from, hi: Math.max(c.from, c.to - WORKER) };
};

// somebody already working the stretch this one is about to walk into
function elbowRoom(w, x) {
  return S.workers.some(o => o !== w && o.type === 'quarrier' && o.goal === 'work' &&
                             (o.x - w.x) * (w.face || 1) > 0 &&
                             Math.abs(o.x - x) < WORKER * 1.3);
}

function seatX(w) {
  const n = Math.max(1, S.quarriers);
  const i = Math.max(0, S.workers.filter(o => o.type === 'quarrier').indexOf(w));
  const { lo, hi } = quarryBand();
  return lo + ((i + 0.5) / n) * (hi - lo);
}

// A shard knocked off the face is thrown out of the quarry and into the quarry's
// own pile -- by the same throw the rock's spoil uses, aimed the same way, over
// the rim because the arc knows how to climb.
// Up and out over the rim. This one is aimed, and should be: it is a body at the
// bottom of a hole throwing stone up onto the ground above it, which is a person
// deciding where something goes -- the same as a hauler tipping a load into the
// pit. What the rock does is the opposite: nobody throws spoil off a boulder, it
// simply comes off, so that falls where it falls.
//
// Without the arc it does not get out at all. A knocked-loose grain has a pop
// sized for a face at head height, and the floor of a worked cut is a good
// forty cells under the rim -- so the whole seam landed back on the floor it
// came out of and the quarry filled up with its own shards.
function tossOut(x, y, what = someFind(SHARD_CELL)) {
  const p = pileOf('quarry');
  const near = p ? p.from : quarry.x + quarry.w + P * 4;
  const far = p ? Math.max(near + P, p.to - P * 2) : near + P * 20;
  const land = Math.min(far, near + Math.abs(bell()) * (far - near) * 0.5);
  const v = aim(x, y, land, P);
  spawnChip(x, y, v.vx, v.vy, what, land);
}

// one quarrier, one frame
export function stepQuarrier(w, now, ctx = null) {
  const rim = quarryFace();

  // Going down to work, and there is nothing here about a ladder.
  //
  // These two used to be a walk along the ground to the head of the ladder and
  // then a climb down it, both written out by hand -- and the same pair was
  // written out again in `stepCommute`, and a third time in the pit, and every
  // other path that moved a body knew about none of them. That is what "they
  // climb out the sides depending on what they are doing" was: a rule kept in
  // the places that happened to remember it.
  //
  // Now the body asks for a route to its seat and walks it. The route goes down
  // the ladder because the ladder is the only edge between the yard and the
  // floor of the cut -- see route.js -- so a body that gets down there at all
  // gets down there that way, and one that is asked to go somewhere no route
  // reaches simply does not go.
  if (w.goal === 'to') {
    // Stood at the head of the ladder until the seam fills back in: there is
    // nothing down an emptied hole to go down for.
    if (S.quarrySpent) {
      if (!keepTo(w, rim)) return;
      if (stepRoute(w, QUARRY_WALK)) return;
      w.route = null;
      return;
    }
    // Ground nobody has broken into yet. `fillQuarry` lays the stone in behind a
    // finished dig, but the first hole of a session was never filled in by
    // anybody -- it has simply always been there -- so it is laid here.
    if (S.quarryOwed <= 0 && !dugShare()) S.quarryOwed = seamShards();
    w.seat = seatX(w);
    w.goal = 'down';
    w.route = null;
    return;
  }

  if (w.goal === 'down') {
    if (!keepTo(w, w.seat, ways().cut)) { w.goal = 'to'; return; }
    // The dig-shuffle pace is for legs in the cut; a leg up in the open is a
    // commute. A quarrier carried across the yard by a shovelling errand used
    // to walk its whole way home at the shuffle -- a fifth of a walking pace,
    // for however far the errand had taken it. Only up in the open: below the
    // ground line everything keeps the shuffle, so nothing about the ladder,
    // the descent or the fill-in behind the last body out moves by a frame.
    const brisk = w.y + WORKER <= S.groundY + 1
      && Math.abs(w.x - quarryFace()) > P * 50
      && w.route && w.route[0] && w.route[0].along && w.route[0].along.key !== 'cut';
    if (stepRoute(w, brisk ? commutePace() : QUARRY_WALK)) return;
    w.route = null;
    w.goal = 'work';
    w.dugAt = now;
    return;
  }

  // Down through the dirt, and out at the bottom with what is under it.
  //
  // It stands on the surface of what is left, so the digging is the body itself
  // going down -- there is no bar and no number, the hole simply gets emptier
  // under its feet. At the bottom it turns and throws the seam up over the rim
  // one stone at a time, climbs out, and the quarry falls in behind it.
  if (w.goal === 'up') {                         // out, with the seam gone up before it
    if (!keepTo(w, rim, ways().yard)) { w.goal = 'work'; return; }
    const briskUp = w.y + WORKER <= S.groundY + 1
      && Math.abs(w.x - quarryFace()) > P * 50
      && w.route && w.route[0] && w.route[0].along && w.route[0].along.key !== 'cut';
    if (stepRoute(w, briskUp ? commutePace() : QUARRY_WALK)) return;
    w.route = null;
    w.goal = 'to';
    w.cell = null;                             // it is not digging anything now
    // The last one out is what fills the hole back in. Doing it the moment the
    // seam was emptied dropped the dirt back under the feet of everybody still
    // down there, and they rode it up like a lift.
    if (!S.workers.some(o => o.type === 'quarrier' && o !== w && o.y > S.groundY)) {
      fillQuarry();
      S.quarrySpent = false;
    }
    return;
  }

  // Digging happens down the cut, and a body that is not down the cut is not
  // digging, whatever its goal happens to say.
  //
  // The line below takes a height from a *place* -- the floor of the hole -- and
  // puts a body at it, and until this guard it did that wherever the body was
  // standing. Anything that leaves `work` set while the body is somewhere else
  // -- picked up and put down, shoved along, sent off for a hat, a walk cut
  // short -- pinned it to the height of a hole thousands of pixels away, and it
  // stayed there, swinging, because nothing in this branch ever asked where it
  // was. Reported from a browser run as a quarrier sunk a hundred pixels into
  // the hill it was standing on, for hundreds of frames.
  //
  // So the state answers for itself: if where a body is disagrees with what it
  // says it is doing, it is the state that is wrong. Outside the span of the
  // cut it goes back to the top of the walk and asks for a route down like
  // anybody else, and stands on the way it is actually on in the meantime.
  // Asked of the quarry's own ground rather than of the cut way, because the
  // way only exists once the quarry has been opened and the digging does not
  // wait on that: a gang put on an unopened quarry work it just the same.
  const all = ways();
  if (w.x + WORKER <= quarry.x || w.x >= quarry.x + quarry.w) {
    w.goal = 'to';
    w.route = null;
    w.cell = null;
    w.resting = false;
    w.y = climbTo(w, feetOn(wayAt(w.x, w.y, all), w.x));
    return;
  }

  // It stands on the ground as it is now: the floor under a quarrier is the
  // bottom of the column it has dug, or the top of whatever dust has fallen in
  // on top of that -- see `cutTop`. The body goes down with its own work and
  // rides up on anything that piles up under its feet.
  w.y = cutTop(w.x + WORKER / 2) - WORKER + Math.sin(now / 1000 * w.sp + w.ph) * 1.3;

  // Nowhere to put a seam, so nothing to do but stand on the dirt. See break.js.
  //
  // Unless there is a mess up top, in which case there is plenty to do and no
  // reason to stand in a hole doing none of it. It walks along its own floor to
  // the foot of the ladder and climbs out the way it always climbs out; the
  // crew loop takes it from there and hands it a shovel. Nobody is lifted out.
  if (S.pileFull.quarry) {
    // Nowhere to put a seam and a mess up top: it goes and clears the mess. It
    // used to walk itself along its own floor to the foot of the ladder here,
    // which is the third copy of that walk in this file. It asks to be up top
    // instead, and the route takes it along the floor and up the rungs -- the
    // same three lines that carry it anywhere else.
    if (yardMuckFor(w) > 0) {
      w.cell = null;
      w.goal = 'up';
      w.route = null;
      w.resting = false;
      w.next = now + cellMs();
      return;
    }
    w.resting = true; w.next = now + cellMs(); return;
  }
  w.resting = false;

  // and it swings on its own rhythm, which is nothing to do with how the digging
  // is going: a cut should look worked whether or not it is about to pay.
  if (now >= w.swingAt) {
    w.lunge = 1;
    w.swingAt = now + QUARRY_SWING * (0.7 + rand() * 0.6);
  }

  // The hole dug out: up the ladder. The ground comes back in behind the last
  // one out -- see the 'up' leg. There is nothing to stay down for: whatever the
  // ground held was found on the way through it.
  if (quarryDone()) { w.goal = 'up'; return; }

  // Digging. Silt first: rain fills the quarry from the top, and it has to come out
  // before the ground under it does.
  if (throughQuarryMuck(1) <= 0) return;
  // Between digs, and only between them: what has fallen down the mouth is
  // lying on the floor it is working, so it goes up over the rim on the same
  // throw the seam takes. Behind the swing's own clock, so tidying never costs
  // a cell -- see tidy.js.
  if (now < w.next) { tidyStep(w, cutPatch(), ctx && ctx.cutTaken, now); return; }

  // A cell is somewhere you go, not something that happens wherever you are
  // standing. It picks one, walks to it, and digs when it gets there -- which is
  // the same rule the muck follows, and the same rule everything in this yard
  // follows: nobody is ever put where they are needed.
  const cells = quarryCells();
  if (w.cell == null || w.cell < 0 || cells[w.cell] >= quarryTarget(w.cell))
    w.cell = nextQuarryCell(w.x + WORKER / 2, w);
  if (w.cell == null || w.cell < 0) return;

  const to = quarry.x + w.cell * P + P / 2 - WORKER / 2;
  const d = to - w.x;
  if (Math.abs(d) > 1) {
    // A blaster is a little quicker on its feet as well as quicker with the pick.
    // Halving only the swing stopped doubling anything the moment a body had to
    // walk to every cell -- but a trade is a man who knows the work, not a man
    // who runs, so it is a shade over a shuffle rather than a sprint.
    w.x += Math.sign(d) * Math.min(CUT_STEP * (w.trained ? 1.5 : 1), Math.abs(d));
    return;                                    // on its way: it is not digging yet
  }
  w.x = to;
  if (now < w.next) return;

  const c = w.cell;
  // What is still in the ground, counted before this swing takes a cell out of
  // it, so the cell being dug is one of the ones the stone could be in.
  const left = cellsLeft();
  digCell(c);
  w.cell = null;                               // done with that one: it picks another
  findShards(w, left);
  // Digging raises dust, and none of it reaches the sky. This used to foul once
  // per cell taken, on the argument that digging dirties the air whether or not
  // it turns up a shard -- which is true of dust and false of the rule the yard
  // now keeps: hand work never fouls, anywhere, and a machine's stack is the
  // only thing that does. See `foul`, which refuses everything but a machine's
  // dirt rather than trusting nobody else to ask.
  w.lunge = 1;
  w.swingAt = now + QUARRY_SWING;
  w.next = now + cellMs() / (w.trained ? 2 : 1) * (0.85 + rand() * 0.3);
  S.dirty = true;

  if (quarryDone()) S.quarrySpent = true;      // that is the lot: everybody out
}

// --- what is in the ground ------------------------------------------------------
// A dig is worth `seamShards()`, and it always was. What changed is where in the
// dig they turn up.
//
// They used to be a seam at the bottom: dig the whole cut out, then stand there
// and throw a handful up over the rim. Which made the digging itself worth
// nothing to watch -- a minute of swinging that pays on the last frame is a
// loading bar with people drawn on it, and the pile outside only ever moved
// while nobody was digging.
//
// So the stone is *scattered through the ground* instead, and a swing either
// turns some up or does not. The scatter is dealt rather than rolled: each shard
// still in the ground is in one of the cells still in the ground, picked evenly,
// so a swing turns one up with a chance of one-in-what-is-left. Two things fall
// out of that and both are the point. The dig pays exactly what it always paid,
// so `dig deeper` is worth exactly what the board says. And the last cell of a
// cut is certain -- one cell left, one place a shard can be -- so a dig never
// ends owing you anything, and there is no run of bad luck that costs you a
// quarry.
//
// `left` is the count *including* the cell just swung, which is what makes that
// last cell come out at one-in-one.
export function findShards(w, left) {
  if (S.quarryOwed <= 0 || left <= 0) return;
  let found = 0;
  for (let n = 0; n < S.quarryOwed; n++) if (rand() * left < 1) found++;
  // The dig is a bounded job, so a crit PULLS FORWARD rather than adds: it takes
  // several of the shards *already owed* in one swing -- a lump, not a trickle --
  // so the dig finishes sooner and the total never moves. This is the whole of
  // why the cut can have crits at all: `S.quarryOwed` starts at `seamShards()`
  // and only ever comes down, so a dig with every swing critting still yields
  // exactly `seamShards()`, not a shard more. The crit does not put extra stone
  // in the ground; it brings forward stone that was going to come up anyway.
  const crit = critRoll();
  if (crit > 1) found = Math.min(S.quarryOwed, Math.max(found, crit));
  if (!found) return;
  S.quarryOwed -= found;
  w.quarried = (w.quarried || 0) + found;
  // The swing that found it is the swing that throws it out, so the stone leaves
  // the hole from the cell it came out of rather than from wherever the body
  // happened to finish up. A crit throws its lump up as a fountain -- higher and
  // out over the rim, the same climb `tossOut` makes, only taller.
  for (let n = 0; n < found; n++) {
    if (crit > 1) critToss(w.x + WORKER / 2, w.y + WORKER, someFind(SHARD_CELL), 'quarry', crit);
    else tossOut(w.x + WORKER / 2, w.y + WORKER);
  }
  S.dirty = true;
}

// nobody is out of sight any more: the whole point of a cut rather than a shaft
export const underground = () => false;

// --- the dig ------------------------------------------------------------------
// The quarry is what has been taken out of the ground, not a shape drawn round a
// hole. Nothing is outlined in advance: the walls, the benches and the uneven
// floor are all *revealed* by digging down to them, one cell at a time, the same
// way the rock is taken apart.
//
// One number per column: how many cells deep it has been dug. Nought everywhere
// is bare ground with no cut in it at all. `quarryTarget` says how deep each column
// eventually goes -- that is where the benched walls and the jagged floor come
// from, and it is the same profile the quarry has always had; the difference is
// that you now arrive at it rather than being shown it.
export function quarryCells() {
  const want = Math.max(0, Math.round(quarry.w / P));
  if (!S.quarryCells || S.quarryCells.length !== want) {
    const was = S.quarryCells || [];
    S.quarryCells = new Array(want).fill(0);
    for (let i = 0; i < Math.min(was.length, want); i++) S.quarryCells[i] = was[i] || 0;
  }
  return S.quarryCells;
}

// how deep column c goes when the quarry is finished, in cells
export function quarryTarget(c) {
  const cells = quarryCells();
  if (c < 0 || c >= cells.length) return 0;
  const x = quarry.x + c * P + P / 2;
  const g = quarryShape();
  if (x <= g.from || x >= g.to) {
    // the walls: the benched steps either side, read off the outline itself
    let deepest = 0;
    for (const [px, py] of g.outline) {
      if (Math.abs(px - x) > quarry.w) continue;
      if ((x <= g.from && px <= x) || (x >= g.to && px >= x))
        deepest = Math.max(deepest, (py - S.groundY) / P);
    }
    return Math.max(0, Math.round(deepest));
  }
  for (const f of g.floor) if (x >= f.from && x < f.to) return Math.round((f.y - S.groundY) / P);
  return Math.round((g.deep - S.groundY) / P);
}

// How many of the open cells nearest a body it will choose between. Enough that
// a gang scatters rather than queues, few enough that nobody crosses the face
// for a cell that takes a moment to dig.
const NEAR_CELLS = 5;

export const dugAt = c => (quarryCells()[c] || 0);
export const colOfX = x => Math.floor((x - quarry.x) / P);

// how far down the ground has been taken at x -- which is where a body stands
export function dugTopY(x) {
  const c = colOfX(x);
  const cells = quarryCells();
  if (c < 0 || c >= cells.length) return S.groundY;
  return S.groundY + cells[c] * P;
}

// The quarry is finished when every column is down to its mark.
export function quarryDone() {
  const cells = quarryCells();
  for (let c = 0; c < cells.length; c++) if (cells[c] < quarryTarget(c)) return false;
  return cells.length > 0;
}

// and how much of it is still in, in cells -- what a find is drawn against
export function cellsLeft() {
  const cells = quarryCells();
  let left = 0;
  for (let c = 0; c < cells.length; c++) left += Math.max(0, quarryTarget(c) - cells[c]);
  return left;
}

// how much of it is out, for a readout
export function dugShare() {
  const cells = quarryCells();
  let have = 0, want = 0;
  for (let c = 0; c < cells.length; c++) { have += cells[c]; want += quarryTarget(c); }
  return want ? have / want : 0;
}

// The column a body at x should take the next cell off.
//
// The shallowest ground first, and the nearest of those. A cut is worked *down*
// in layers -- the whole floor comes off a course at a time and the hole opens
// out as it deepens, which is what a quarry looks like. Working whichever column
// you happen to be standing on until it is finished digs a slot: one cell wide,
// straight down, and nothing like a cut.
//
// A column that has reached its mark is done: that is where the benched walls
// and the uneven floor come from, since the marks differ across the width and
// the shallow ones stop early while the middle keeps going.
export function nextQuarryCell(x, self = null) {
  const cells = quarryCells();

  // Nobody else's cell. A body walks to the one it has picked, so two of them
  // picking the same one is two bodies walking to the same spot and one of them
  // arriving to find the work done.
  const taken = new Set();
  for (const o of S.workers)
    if (o !== self && o.type === 'quarrier' && o.cell != null && o.cell >= 0) taken.add(o.cell);

  // The shallowest ground first: a cut is worked *down* in layers, the whole
  // floor coming off a course at a time, and the hole opens out as it deepens.
  let shallow = Infinity;
  for (let c = 0; c < cells.length; c++) {
    if (cells[c] >= quarryTarget(c) || taken.has(c)) continue;
    shallow = Math.min(shallow, cells[c]);
  }
  if (shallow === Infinity) return -1;

  // Then one of the nearest few of that layer, picked at random between them.
  //
  // Both halves matter. Always the *nearest* puts the whole gang on one spot
  // working along in a queue -- one body digging and the rest walking after it.
  // Anywhere in the layer is worse: a body walks to each cell now, and a cell
  // takes a tenth of a second to dig against two seconds to cross the face for,
  // so picking at random across the whole width is a gang that spends its shift
  // walking. A handful of candidates is scatter you can see, on walks that cost
  // about what the digging does.
  const open = [];
  for (let c = 0; c < cells.length; c++) {
    if (cells[c] === shallow && cells[c] < quarryTarget(c) && !taken.has(c)) open.push(c);
  }
  if (!open.length) return -1;
  const home = Math.max(0, Math.min(cells.length - 1, colOfX(x)));
  open.sort((a, b) => Math.abs(a - home) - Math.abs(b - home));
  return open[Math.floor(rand() * Math.min(NEAR_CELLS, open.length))];
}

// and the ground fills back in behind them
export function fillQuarry() {
  // Whatever fell down the cut comes back up with the ground, thrown out at the
  // mouth. The other answer was available -- the fill closes over it and it is
  // gone -- and it is the wrong one for this game: every pixel is worth one
  // dust, the hole is the only thing that destroys nothing, and a yard that eats
  // a load because a dig happened to finish is a yard where the counter and the
  // picture say different things. So the stone comes in underneath and what was
  // lying on it is pushed up and out, by the same throw the seam leaves by.
  tipCut();
  const cells = quarryCells();
  for (let c = 0; c < cells.length; c++) cells[c] = 0;
  layCut();                                    // and the ground is back in the plot
  // Fresh ground with the next dig's stone already in it. It is set here rather
  // than when somebody first swings because the amount depends on how deep the
  // cut is, and a bench bought halfway down a dig should pay from the next one
  // -- the ground you are standing in holds what it held when it was laid.
  S.quarryOwed = seamShards();
  S.dirty = true;
}

// What the seam is worth: a handful per bench, so taking the quarry deeper is worth
// something at the bottom rather than only being further to climb.
export const seamShards = () =>
  Math.max(1, Math.round(benches() * CUT_SEAM * (spelled('luck') ? SPELL_LUCK : 1)));

// How long one cell takes. The whole dig is CUT_DIG_MS at pace nought, spread
// over however many cells the quarry is -- so taking the quarry deeper makes the dig
// longer, which is the trade for a bigger seam, and the pace upgrade shortens
// the swing rather than the hole.
export function cellMs() {
  const cells = quarryCells();
  let want = 0;
  for (let c = 0; c < cells.length; c++) want += quarryTarget(c);
  const per = CUT_DIG_MS / Math.max(1, want);
  return Math.max(60, per * Math.pow(0.82, S.quarryPaceLevel) / mult('quarry'));
}


// --- what the quarry sells ------------------------------------------------------
// A decision about a place is made at the place. These two used to sit on the
// bench under a heading called "the quarry", which is the shop describing a hole
// on the other side of the yard: you bought a bench you could not see, priced in
// a currency that comes out of the ground you were not standing on. The lab and
// the school are buildings you walk to for exactly this reason, and the quarry is
// as much a place as either.
//
// The row that *opens* it stays on the bench, because you cannot walk up to a
// quarry that has not been dug yet.
export const QUARRY_UPGRADES = [
  {
    key: 'quarrybench',
    // A place, and the cut's own gang takes it out. While the quarriers are
    // cutting the next bench they are not bringing stone up, which is the whole
    // of what the wait costs -- see works.js.
    kind: 'place', site: 'quarry',
    // A place is standing room for one more body: `capOfBare` caps quarriers at
    // `benches()`, so what you are buying is another quarrier's shovel at the
    // face, not a bigger yield out of the same hole. The name says who; the cut
    // a bench deeper is what it leaves behind.
    name: 'another shovel',
    // What the from/to is counting, so the gain reads "1 -> 2 shovels".
    unit: 'shovels',
    from: () => benches(),
    to: () => benches() + 1,
    cost: () => Math.round(BENCH_COST * Math.pow(BENCH_RATE, S.benchLevel)),
    // Green, not blue. A station that is bought deeper with the very thing it
    // produces is a station that pays for itself, and a loop that closes on
    // itself like that is not a decision -- you dig because digging buys more
    // digging. Priced in the *other* ground's crop, the cut and the plots pay
    // for each other, and getting the quarry down a bench means the farm has
    // been kept up. Same argument as the machines, one tier down.
    currency: 'spore',
    buy: () => { S.benchLevel++; resite(); },
    show: () => S.quarryOpen && benches() < QUARRY_BENCH_MAX
  },
  {
    // The last thing the cut ever sells, and it does not appear until the hole is
    // as deep as it will ever go. See `canBuy`.
    key: 'jaw',
    kind: 'machine', site: 'quarry',
    name: 'the drill',
    bill: () => JAW_BILL,
    buy: () => { buyMachine('jaw'); rebalance(); },
    show: () => S.quarryOpen && canBuy('jaw', () => benches() >= QUARRY_BENCH_MAX,
                                       () => kitFull('quarriers'))
  },
  {
    key: 'quarrypace',
    kind: 'rung', site: 'quarry',
    // It was "quarry lamps" -- the fiction being that you work faster when you
    // can see. A nice thought and a bad row: nothing else on these boards is
    // named after the *reason* it works, and a lamp is not a thing this game
    // ever draws. It is how often a shard comes off the face, which is speed.
    name: 'speed',
    unit: 'trips/min',
    pct: true,
    from: () => quarryRate(),
    to: () => quarryRate(S.quarryPaceLevel + 1),
    rung: () => S.quarryPaceLevel,
    // A rung of its own, on its own price. It used to be `BENCH_COST` on
    // `BENCH_RATE` -- the very numbers the row above it uses -- so a bench in
    // the wall and a rung of speed cost exactly the same at every level, which
    // is a coincidence rather than a decision. A rung is a rung now: `rungCost`,
    // like every other ladder in the game, and its own first price.
    cost: () => rungCost(4, S.quarryPaceLevel),
    currency: 'spore',
    buy: () => S.quarryPaceLevel++,
    // It stays on the board once it is finished, saying "done" -- it used to
    // vanish the moment it reached the floor, which is a cap the game had and
    // would not admit to.
    show: () => S.quarryOpen
  }
,

  // The drill's own ladder, on the quarry's own board. It never ends -- see
  // `tuneRow` in machines.js: the machines are where an endgame's dust goes.
  //
  // Keyed 'jaw', which is what the machine was called before it became a drill
  // and is still what every save has in it. The key is the machine's; the words
  // are what anybody reads. See the note over `MACHINES` in machines.js.
  tuneRow('jaw', 'tune the drill',
          () => `the drill bites ${MACHINE_TUNE}x harder, again`, 'quarry')
];

// One heading. The quarry is one place and everything on this board is about the
// same hole, so a second would be a heading for the sake of having two.
export const QUARRY_SECTIONS = [
  { title: 'the quarry', keys: ['quarrybench', 'quarrypace', 'jaw', 'tunejaw'] }
];


// --- the jaw --------------------------------------------------------------------
// The machine that works the cut, and the hoist that lifts what it finds up over
// the rim. What it does is exactly what a quarrier does -- pick a cell, take it
// out, and see what was in it -- and it does it by calling the same two
// functions a quarrier calls.
//
// That is the rule, and it is worth being blunt about why. `findShards` pays a
// dig exactly `seamShards()` *because* `left` is `cellsLeft()` counted before
// each single cell comes out, which is what makes the last cell one-in-one. A
// jaw that ate a whole column at a beat "to look mechanical" would quietly
// rewrite what `dig deeper` is worth and collapse the argument the scatter is
// built on. So it takes one cell, through the station's own code, and every
// ladder underneath it keeps applying because it is the same code the hands run.
//
// Its own geometry is derived every frame and never stored: `fillQuarry` zeroes
// every column when the ground falls back in, and a jaw with a remembered `y`
// would be under it. `dugTopY` is where it stands, the same answer a quarrier's
// feet get.
// The middle of the mouth.
//
// It stood beside the ladder in the near corner, which is the busiest few cells
// in the yard -- the rungs, the tender, the hoist and the kit stand all in one
// column -- and it read as a thing shoved into a corner rather than as the
// machine working the cut. A cut is worked from the middle of it.
//
// Derived off the shape of the hole, so it stays in the middle however deep the
// thing is taken.
export const jawX = () => {
  const c = quarryShape();
  // Half the rig's width off the middle, read off the picture: a machine centred
  // by a literal is a machine that walks sideways the day it is redrawn.
  return Math.round(((c.from + c.to) / 2 - P * Math.round(spriteW(DRILL) / 2)) / P) * P;
};

// Where the rig stands: on the bridge deck, which is the only solid ground over
// a hole. Its feet are the bottom row of the picture.
export const rigTop = () => Math.round((bridgeSpan().top - spriteH(DRILL) * P) / P) * P;

// Which column the shaft comes down, read off the picture: the gap the legs
// leave in the bottom row is the bore, and there is only one of them.
export const shaftX = () => jawX() + DRILL[spriteH(DRILL) - 1].indexOf('.') * P;

// The floor it is boring, as the floor is now. Derived every frame off
// `dugTopY`, so when the quarry falls in behind the last body out the bit comes
// up with the ground exactly the way a quarrier's feet do.
export const jawY = () => dugTopY(shaftX());

// Where the body working it stands: on the rig's roof, at the end away from the
// chimney. Both read off the picture -- see `roofRow` and `seatCol` -- so the rig
// carries its operator's footing with it.
export const drillSeat = () => ({
  x: jawX() + seatCol(DRILL) * P,
  y: rigTop() + roofRow(DRILL) * P - WORKER
});

defineMachine('jaw', {
  job: 'quarriers',
  type: 'quarrier',
  at: jawX,
  y: jawY,
  // The top of its chimney. The jaw's stack is not part of its picture -- it is
  // drawn beside it, because the smoke has to know where the top is and the
  // sprite would have to grow two rows it never uses. So the column is named
  // here, once, and the drawing reads it back rather than keeping its own copy.
  // The top of its chimney. The rig stands on the deck, so its stack is up in
  // the daylight rather than down the hole -- which is where the smoke of a
  // drill actually comes from, and where the dirt therefore goes up.
  stack: () => ({ x: jawX() + stackCol(DRILL) * P, y: rigTop() }),
  // Up on the roof. A body works this machine from on top of it, so it is put
  // there rather than walked to a spot beside it -- see `stepTender`.
  seat: drillSeat,
  // Where the *body* stands, which is not where the machine is. The jaw is on
  // the floor of the cut; its tender works the hoist on the deck at the head of
  // the ladder, which is also where the lever is. A tender posted down the hole
  // would have to climb a ladder into a hole full of machine to do a job that is
  // done at the top of it.
  tendAt: quarryFace,
  // One cell takes it the station's own clock divided by what it is worth. The
  // pace upgrade and the quarry's own multiplier are inside `cellMs`, so they
  // keep applying to the machine exactly as they do to the hands.
  ms: rate => cellMs() / Math.max(0.01, rate),
  // Not while the ground it stands on is gone, not while the hole is full of
  // silt, and not while there is nowhere to put what comes out. Every one of
  // those is the station's own rule, asked the station's own way.
  // Not while there is nowhere to put what comes out, and not while the hole is
  // full of silt. `quarryDone()` is deliberately *not* here: the beat on which
  // the cut is worked out is the beat on which the ground has to come back in,
  // and forbidding it deadlocked the quarry for good -- `fillQuarry` has only
  // two callers, this machine and a quarrier climbing out, and a tended station
  // does not run one.
  ready: () => !S.pileFull.quarry && throughQuarryMuck(1) > 0,
  bite: tender => {
    // A cut already worked out: the ground comes back in and this beat is spent
    // on that. See `ready`, which used to refuse the beat entirely.
    if (quarryDone()) {
      if (S.workers.some(o => o.type === 'quarrier' && o.y > S.groundY)) return false;
      fillQuarry();
      S.quarrySpent = false;
      return false;
    }
    const cells = quarryCells();
    // The tender is passed through, not `null`. A body keeps its `cell` claim
    // when it takes up tending, and a claim nobody is walking to would keep the
    // machine off that cell for as long as the machine ran.
    const c = nextQuarryCell(shaftX(), tender);
    if (c == null || c < 0) return false;
    const left = cellsLeft();
    digCell(c);
    // The find is credited to whoever is standing at it. A machine has no
    // record of its own -- the crew list counts people -- and the tender is the
    // one who brought it up, which is what `quarried` has always meant.
    // The same finds a swing turns up: the jaw takes cells the way a body does,
    // so it owes the same shards. What it does *not* share is the sky -- the jaw
    // fouls from its own stack, in `stepMachines`, and a body digging fouls not
    // at all.
    findShards(tender || { x: shaftX(), y: jawY() }, left);
    // And the ground comes back in behind it.
    //
    // Worked by hand this happens on the way *out*: the last body up the ladder
    // fills the hole in behind itself, because dropping the dirt back under the
    // feet of anybody still down there rode them up like a lift. A machine has
    // nobody down there to consider -- its tender works the hoist on the deck --
    // so the cut falls in the moment it is worked out, which is the same event
    // without the climb.
    //
    // Without this the jaw dug the hole out exactly once and then stood in it
    // for ever: `fillQuarry` had only ever been reached from a quarrier's own
    // step, and a tended station does not run one.
    if (quarryDone()) {
      const below = S.workers.some(o => o.type === 'quarrier' && o.y > S.groundY);
      if (!below) { fillQuarry(); S.quarrySpent = false; }
      else S.quarrySpent = true;
    }
    S.dirty = true;
    return true;
  }
});

// and the yard is told what these rows are, so a work coming back out of a
// save knows which row it belongs to. See `registerRows` in works.js.
registerRows(QUARRY_UPGRADES);
