// The quarry: a mouth in the ground away to the left of the rock.
//
// Crew climb down into it and work the face where you can see them. The pace
// is the whole of the mechanic -- it is what an upgrade shortens, and what makes
// sending somebody down there a decision rather than a free tap, because a
// quarrier underground is a worker not carrying dust.
//
// Nothing about the quarry is shown until it is opened, the way nothing about
// cores is shown until one is banked.

import { BENCH_COST, BENCH_RATE, QUARRY_BENCH_MAX, CUT_DIG_MS, CUT_SEAM, CUT_TOSS_MS } from './config.js';
import { P, WORKER, QUARRY_BASE, QUARRY_FLOOR, QUARRY_WALK, QUARRY_SWING, QUARRY_SHUFFLE,
         QUARRY_NEAR_BENCH, QUARRY_FAR_BENCH, QUARRY_FLOOR_STEP, QUARRY_FLOOR_JAG,
         CLIMB_PACE, SHARD_CELL, someFind } from './config.js';
import { foul, throughCutMuck } from './smog.js';
import { QUARRY_FOUL } from './config.js';
import { S, quarry } from './state.js';
import { walkY, groundAt, benches, resite, pileOf } from './world.js';
import { mult } from './lab.js';
import { spawnChip, aim, bell } from './dust.js';
import { now } from './clock.js';

// how long a trip takes, at this pace
export const quarryMs = (lvl = S.quarryPaceLevel) =>
  Math.max(500, Math.round(Math.max(QUARRY_FLOOR, QUARRY_BASE * Math.pow(0.82, lvl)) / mult('quarry')));

export const quarryRate = (lvl = S.quarryPaceLevel) => 60000 / quarryMs(lvl);   // trips a minute

// --- the ladder ---------------------------------------------------------------
// Bodies used to sink into the cut and rise out of it wherever they happened to
// be standing, straight down through the air in the middle of the mouth. That
// is the one thing in this yard that was plainly not a thing that could happen:
// everything else walks, climbs a wall or goes through a door.
//
// So there is a ladder, in the near corner where the wall's toe is -- one place,
// worked out from the cut, so the rungs you can see and the line a body climbs
// are the same line by construction. Going in is walking to the head of it and
// coming down it; coming out is walking back along the floor to its foot and
// going up.
export const LADDER_W = P * 3;         // stile to stile
export const LADDER_OVER = P;          // how far its head stands proud of the top

export function ladder() {
  const c = quarryCut();
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
    swingAt: now() + Math.random() * QUARRY_SWING,
    lunge: 0,
    ph: Math.random() * Math.PI * 2,       // where in its sway it starts
    sp: 0.5 + Math.random() * 0.9,         // and how fast it sways
    pace: 0.7 + Math.random() * 0.6,       // and how briskly it works along the face
    dir: Math.random() < 0.5 ? -1 : 1,
    seat: 0,                               // where along the floor it stands
    x: quarryFace(),
    y: 0,
    carry: 0
  };
}

// The shape of the cut: both walls stepping down in benches, and the uneven
// floor between them. It is worked out from the mouth once and kept, because
// nothing about it moves unless the world is laid out again -- and because
// `quarryFloor` is asked where the ground is once per quarrier per frame.
//
// The benches are scenery, but the floor is not: the crew stand on it, so the
// same numbers that draw it are the ones that put their feet down.
let cut = null, cutKey = '';

export function quarryCut() {
  const key = `${quarry.x}|${quarry.w}|${quarry.h}|${S.groundY}`;
  if (cut && cutKey === key) return cut;

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

  cutKey = key;
  return (cut = { outline, floor, from, to, deep });
}

// Where the ground is inside the cut: the bottom of whatever has been dug out of
// that column. It used to be the floor of a hole that existed whether or not
// anybody had dug it -- there is no hole now until somebody digs one, so the
// ground underfoot is exactly what has been taken away.
export function quarryFloor(x = null) {
  if (x === null) return quarryCut().deep;     // the deepest it will ever go
  return dugTopY(x);
}

// the stretch of floor a quarrier may work: between the toes of the two walls
export const quarryBand = () => {
  const c = quarryCut();
  return { lo: c.from, hi: Math.max(c.from, c.to - WORKER) };
};

// somebody already working the stretch this one is about to walk into
function elbowRoom(w, x) {
  return S.workers.some(o => o !== w && o.type === 'quarrier' && o.goal === 'work' &&
                             (o.x - w.x) * w.dir > 0 && Math.abs(o.x - x) < WORKER * 1.3);
}

function seatX(w) {
  const n = Math.max(1, S.quarriers);
  const i = Math.max(0, S.workers.filter(o => o.type === 'quarrier').indexOf(w));
  const { lo, hi } = quarryBand();
  return lo + ((i + 0.5) / n) * (hi - lo);
}

// A shard knocked off the face is thrown out of the cut and into the quarry's
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
// came out of and the cut filled up with its own shards.
function tossOut(x, y) {
  const p = pileOf('quarry');
  const near = p ? p.from : quarry.x + quarry.w + P * 4;
  const far = p ? Math.max(near + P, p.to - P * 2) : near + P * 20;
  const land = Math.min(far, near + Math.abs(bell()) * (far - near) * 0.5);
  const v = aim(x, y, land, P);
  spawnChip(x, y, v.vx, v.vy, someFind(SHARD_CELL), land);
}

// one quarrier, one frame
export function stepQuarrier(w, now) {
  const rim = quarryFace();

  // Walk along the ground to the head of the ladder -- and wait there if the dig
  // is spent, because there is nothing down an emptied hole to go down for.
  if (w.goal === 'to') {
    w.y = walkY(w.x + WORKER / 2);
    const d = rim - w.x;
    w.x += Math.sign(d) * Math.min(QUARRY_WALK, Math.abs(d));
    if (Math.abs(d) >= 1) return;
    w.x = rim;
    if (S.cutSpent) return;                      // stood at the rim until it fills
    w.goal = 'down';
    w.seat = seatX(w);
    return;
  }

  // Down the ladder, hand over hand, and off it on top of whatever dirt is left.
  // A fresh cut is full to the ground line, so on the first dig that is barely a
  // climb at all; by the time the seam is showing it is the whole way down.
  if (w.goal === 'down') {
    w.x = rim;                                   // it holds on: nothing drifts
    const foot = dugTopY(w.x + WORKER / 2) - WORKER;
    w.y = Math.min(w.y + CLIMB_PACE, foot);
    if (w.y >= foot) { w.y = foot; w.goal = 'work'; w.dugAt = now; }
    return;
  }

  // Down through the dirt, and out at the bottom with what is under it.
  //
  // It stands on the surface of what is left, so the digging is the body itself
  // going down -- there is no bar and no number, the hole simply gets emptier
  // under its feet. At the bottom it turns and throws the seam up over the rim
  // one stone at a time, climbs out, and the cut falls in behind it.
  if (w.goal === 'up') {                         // out, with the seam gone up before it
    w.x = quarryFace();
    const top = walkY(w.x + WORKER / 2);
    w.y = Math.max(w.y - CLIMB_PACE, top);
    if (w.y > top) return;
    w.y = top;
    w.goal = 'to';
    // The last one out is what fills the hole back in. Doing it the moment the
    // seam was emptied dropped the dirt back under the feet of everybody still
    // down there, and they rode it up like a lift.
    if (!S.workers.some(o => o.type === 'quarrier' && o !== w && o.y > S.groundY)) {
      fillCut();
      S.cutSpent = false;
    }
    return;
  }

  // It stands on the ground as it is now: the floor under a quarrier is the
  // bottom of the column it has dug, so the body goes down with its own work.
  w.y = dugTopY(w.x + WORKER / 2) - WORKER + Math.sin(now / 1000 * w.sp + w.ph) * 1.3;
  w.lunge *= 0.82;

  // Nowhere to put a seam, so nothing to do but stand on the dirt. See break.js.
  if (S.pileFull.quarry) { w.resting = true; w.next = now + cellMs(); return; }
  w.resting = false;

  // and it swings on its own rhythm, which is nothing to do with how the digging
  // is going: a cut should look worked whether or not it is about to pay.
  if (now >= w.swingAt) {
    w.lunge = 1;
    w.swingAt = now + QUARRY_SWING * (0.7 + Math.random() * 0.6);
  }

  // At the seam: the handful goes up over the rim, a stone at a time, so it
  // reads as somebody unloading rather than a number arriving.
  //
  // The seam is the hole's, not the finder's. Three bodies at the bottom share
  // one handful out between them -- they got there faster, which is what more
  // hands buys, and a gang that each walked off with a full seam would make
  // headcount pay twice for the same hole.
  if (S.cutOwed > 0) {
    if (now < (w.tossAt || 0)) return;
    tossOut(w.x + WORKER / 2, w.y + WORKER);
    w.quarried = (w.quarried || 0) + 1;
    foul(QUARRY_FOUL, w.x + WORKER / 2, w.y, 'shard');
    S.cutOwed--;
    w.tossAt = now + CUT_TOSS_MS;
    w.lunge = 1;
    if (S.cutOwed <= 0) S.cutSpent = true;       // that is the lot: everybody out
    S.dirty = true;
    return;
  }

  // Seam emptied and the hole dug out: up the ladder. The ground comes back in
  // behind the last one out -- see the 'up' leg.
  if (cutDone()) { w.goal = 'up'; return; }

  // Digging. Silt first: rain fills the cut from the top, and it has to come out
  // before the ground under it does.
  if (throughCutMuck(1) <= 0) return;
  if (now < w.next) return;

  // One cell, off the column it is standing on -- and it works that column down
  // to the mark before moving along, so a face is worked rather than pecked at.
  // This is the rock's own rule: a swing takes a cell, and what a swing looks
  // like is a cell going.
  const c = nextCut(w.x + WORKER / 2);
  if (c < 0) return;
  cutCells()[c]++;
  // Digging raises dust, not only the seam at the bottom. The cut used to foul
  // the air once per shard, which was the same event as producing one; now that
  // production is a lump at the end, fouling only on the payout meant a cut
  // could be worked for half a minute without the sky noticing -- and the blue
  // in the sky over the quarry never appeared at all between seams.
  foul(1, w.x + WORKER / 2, w.y, 'shard');
  w.lunge = 1;
  w.swingAt = now + QUARRY_SWING;
  w.next = now + cellMs() / (w.trained ? 2 : 1) * (0.85 + Math.random() * 0.3);
  // and it stands over what it is taking off, rather than digging at arm's reach
  w.x = quarry.x + c * P + P / 2 - WORKER / 2;
  S.dirty = true;

  if (cutDone() && S.cutOwed <= 0) {
    S.cutOwed = seamShards();
    w.tossAt = 0;
  }
}

// nobody is out of sight any more: the whole point of a cut rather than a shaft
export const underground = () => false;

// --- the dig ------------------------------------------------------------------
// The cut is what has been taken out of the ground, not a shape drawn round a
// hole. Nothing is outlined in advance: the walls, the benches and the uneven
// floor are all *revealed* by digging down to them, one cell at a time, the same
// way the rock is taken apart.
//
// One number per column: how many cells deep it has been dug. Nought everywhere
// is bare ground with no cut in it at all. `cutTarget` says how deep each column
// eventually goes -- that is where the benched walls and the jagged floor come
// from, and it is the same profile the cut has always had; the difference is
// that you now arrive at it rather than being shown it.
export function cutCells() {
  const want = Math.max(0, Math.round(quarry.w / P));
  if (!S.cutCells || S.cutCells.length !== want) {
    const was = S.cutCells || [];
    S.cutCells = new Array(want).fill(0);
    for (let i = 0; i < Math.min(was.length, want); i++) S.cutCells[i] = was[i] || 0;
  }
  return S.cutCells;
}

// how deep column c goes when the cut is finished, in cells
export function cutTarget(c) {
  const cells = cutCells();
  if (c < 0 || c >= cells.length) return 0;
  const x = quarry.x + c * P + P / 2;
  const g = quarryCut();
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

export const dugAt = c => (cutCells()[c] || 0);
export const colOfX = x => Math.floor((x - quarry.x) / P);

// how far down the ground has been taken at x -- which is where a body stands
export function dugTopY(x) {
  const c = colOfX(x);
  const cells = cutCells();
  if (c < 0 || c >= cells.length) return S.groundY;
  return S.groundY + cells[c] * P;
}

// The cut is finished when every column is down to its mark.
export function cutDone() {
  const cells = cutCells();
  for (let c = 0; c < cells.length; c++) if (cells[c] < cutTarget(c)) return false;
  return cells.length > 0;
}

// how much of it is out, for a readout
export function dugShare() {
  const cells = cutCells();
  let have = 0, want = 0;
  for (let c = 0; c < cells.length; c++) { have += cells[c]; want += cutTarget(c); }
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
export function nextCut(x) {
  const cells = cutCells();
  const home = Math.max(0, Math.min(cells.length - 1, colOfX(x)));
  let best = -1, bestDepth = Infinity, bestAway = Infinity;
  for (let c = 0; c < cells.length; c++) {
    if (cells[c] >= cutTarget(c)) continue;
    const away = Math.abs(c - home);
    if (cells[c] < bestDepth || (cells[c] === bestDepth && away < bestAway)) {
      best = c; bestDepth = cells[c]; bestAway = away;
    }
  }
  return best;
}

// and the ground fills back in behind them
export function fillCut() {
  const cells = cutCells();
  for (let c = 0; c < cells.length; c++) cells[c] = 0;
  S.dirty = true;
}

// What the seam is worth: a handful per bench, so taking the cut deeper is worth
// something at the bottom rather than only being further to climb.
export const seamShards = () => Math.max(1, Math.round(benches() * CUT_SEAM));

// How long one cell takes. The whole dig is CUT_DIG_MS at pace nought, spread
// over however many cells the cut is -- so taking the cut deeper makes the dig
// longer, which is the trade for a bigger seam, and the pace upgrade shortens
// the swing rather than the hole.
export function cellMs() {
  const cells = cutCells();
  let want = 0;
  for (let c = 0; c < cells.length; c++) want += cutTarget(c);
  const per = CUT_DIG_MS / Math.max(1, want);
  return Math.max(60, per * Math.pow(0.82, S.quarryPaceLevel) / mult('quarry'));
}


// --- what the cut sells ------------------------------------------------------
// A decision about a place is made at the place. These two used to sit on the
// bench under a heading called "the quarry", which is the shop describing a hole
// on the other side of the yard: you bought a bench you could not see, priced in
// a currency that comes out of the ground you were not standing on. The lab and
// the school are buildings you walk to for exactly this reason, and the cut is
// as much a place as either.
//
// The row that *opens* it stays on the bench, because you cannot walk up to a
// quarry that has not been dug yet.
export const QUARRY_UPGRADES = [
  {
    key: 'quarrybench',
    // What the row says is what you are doing, not what it leaves behind. "Take
    // out a bench" is the quarryman's word for it and the shape you can see in
    // the wall afterwards -- but the thing you are buying is the hole going
    // further down, and that is what the row should say.
    name: 'dig deeper',
    from: () => benches(),
    to: () => benches() + 1,
    cost: () => Math.round(BENCH_COST * Math.pow(BENCH_RATE, S.benchLevel)),
    currency: 'shard',
    buy: () => { S.benchLevel++; resite(); },
    show: () => S.quarryOpen && benches() < QUARRY_BENCH_MAX
  },
  {
    key: 'quarrypace',
    // It was "quarry lamps" -- the fiction being that you work faster when you
    // can see. A nice thought and a bad row: nothing else on these boards is
    // named after the *reason* it works, and a lamp is not a thing this game
    // ever draws. It is how often a shard comes off the face, which is speed.
    name: 'speed',
    unit: 'trips/min',
    pct: true,
    from: () => quarryRate(),
    to: () => quarryRate(S.quarryPaceLevel + 1),
    cost: () => Math.round(3 * Math.pow(1.7, S.quarryPaceLevel)),
    currency: 'shard',
    buy: () => S.quarryPaceLevel++,
    show: () => S.quarryOpen && quarryMs() > QUARRY_FLOOR
  }
];

// One heading. The cut is one place and everything on this board is about the
// same hole, so a second would be a heading for the sake of having two.
export const QUARRY_SECTIONS = [
  { title: 'the cut', keys: ['quarrybench', 'quarrypace'] }
];
