// The quarry: a mouth in the ground away to the left of the rock.
//
// Crew climb down into it and work the face where you can see them. The pace
// is the whole of the mechanic: a quarrier underground is a worker not
// carrying dust. Nothing about the quarry is shown until it is opened.

import { keepTo, stepRoute, ways, wayAt, feetOn, climbTo, plant } from './route.js';
import { BENCH_SHARDS, BENCH_RATE, rungValue,
         QUARRY_BENCH_MAX, CUT_DIG_MS, CUT_SWING_MIN, CUT_SEAM, JAW_BILL,
         CUT_BEAT_MS, CUT_BEAT_MIN, CUT_POCKET, CUT_RUN, CUT_BLAST_POWER } from './config.js';
import { shockAt } from './shock.js';
import { P, WORKER, QUARRY_WALK, CUT_STEP, QUARRY_SWING, QUARRY_NEAR_BENCH, QUARRY_FAR_BENCH, QUARRY_FLOOR_STEP, QUARRY_FLOOR_JAG, SHARD_CELL, someFind, findKind, QUARRY_H, QUARRY_DEEPEN, QUARRY_BENCH0 } from './config.js';
import { throughQuarryMuck, yardMuckFor } from './smog.js';

import { spriteW, spriteH, stackCol, roofRow, seatCol, DRILL } from './sprites.js';
import { S, quarry, cut, floor } from './state.js';
import { groundAt, benches, resite, pileOf, bridgeSpan } from './world.js';
import { at, put, wakeGrid, isDust, surfaceY, topRow, colOf } from './grid.js';
import { makePainter } from './painter.js';
import { ROCK_CELL } from './config.js';
import { tierRows, tierLevel } from './upgrades/tiers.js';
import { spawnChip, aim, bell, critToss } from './dust.js';
import { critRoll } from './crit.js';
import { critBoost, speedBoost, stronger } from './apothecary.js';
import { now } from './clock.js';
import { defineMachine, buyMachine, canBuy } from './machines.js';
import { spelled } from './tower.js';
import { SPELL_LUCK } from './config.js';
import { rebalance } from './staffing.js';
import { kitFull, commutePace } from './levels.js';
import { tuneRow } from './machines.js';
import { MACHINE_TUNE, LADDER } from './config.js';
import { rand } from './rng.js';
import { tidyStep } from './tidy.js';
import { registerRows } from './works.js';
import { JOB, TYPE } from './jobs.js';

// Where the two quarry ladders stand, clamped to their length (`tierLevel`).
export const paceLadder = () => tierLevel('quarryPaceLevel');
export const seamLadder = () => tierLevel('seamLevel');

// The pace is written in trips a minute (config/rungs.js); the gap a trip
// takes is sixty thousand over that, floored where the digging stops reading.
export const quarryRate = (lvl = paceLadder()) => rungValue('quarrypace', lvl);   // trips a minute
export const quarryMs = (lvl = paceLadder()) => Math.max(500, Math.round(60000 / quarryRate(lvl)));

// The ladder's share of a pace-nought dig. It governs *both* halves of a dig,
// the beat (`beatMs`, and past its floor the pocket, `pocketOf`) and the
// shuffle between cells (`stepQuarrier`), because measured, a quarrier spends
// nine tenths of its shift walking; a ladder that shortened the swing alone
// changed nothing. Off one curve, the row's claim and the dig's speed are the
// same number by construction.
export const paceShare = (lvl = paceLadder()) => quarryMs(lvl) / quarryMs(0);

// --- the ladder ---------------------------------------------------------------
// One place, in the near corner where the wall's toe is, worked out from the
// quarry, so the rungs you can see and the line a body climbs are the same
// line by construction.
export const LADDER_W = P * 3;         // stile to stile
export const LADDER_OVER = P;          // how far its head stands proud of the top

export function ladder() {
  const c = quarryShape();
  const x = Math.round(c.from / P) * P;
  // Up to the *bridge*, not the ground line: the deck runs over the mouth
  // four cells above the rim, and `groundAt` already answers where the
  // walking surface is at a given x.
  const top = groundAt(x + LADDER_W / 2) - LADDER_OVER;
  return { x, w: LADDER_W, top, foot: quarryFloor(c.from + P) };
}

// where a quarrier stands to get on it, going either way
export const quarryFace = () => ladder().x + LADDER_W / 2 - WORKER / 2;

export function newQuarrier() {
  return {
    type: TYPE.QUARRY,
    goal: 'to',                            // to the rim, then down, then work
    next: 0,
    // Its own rhythm, or two quarriers read as one animation played twice.
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
// floor between them. Kept, because nothing about it moves unless the world
// is laid out again, and `quarryFloor` is asked once per quarrier per frame.
// The benches are scenery, but the floor is not: the same numbers that draw
// it put the crew's feet down.
let shape = null, shapeKey = '';

// Four numbers compared, not a string built: building the key string here
// was a twentieth of the driven yard's whole frame.
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

  // Each wall's toe meets the floor it runs into, rather than the deepest
  // line: a wall that dropped past its own floor left a slot that reads as a
  // crack.
  near[near.length - 1][1] = floor[0].y;
  far[far.length - 1][1] = floor[floor.length - 1].y;

  // The whole outline, rim to rim, with the repeats dropped: a bench of no
  // width and a stretch of floor at the same height both put a point in twice.
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

// Where the ground is inside the quarry: the bottom of whatever has been dug
// out of that column. There is no hole until somebody digs one.
export function quarryFloor(x = null) {
  if (x === null) return quarryShape().deep;     // the deepest it will ever go
  return dugTopY(x);
}

// --- the cut's own sand ---------------------------------------------------------
// The column heights say how far down the rock has been taken, not what is
// lying on the floor that leaves, so the cut has a grid of its own like the
// pit's (`cut` in state.js). The rock still to come out is *in* the grid as
// `ROCK_CELL`, from the floor of the plot up to the line the dig has reached:
// a grain lands on top of whatever rock is there, and the moment a swing takes
// a cell out from under it the ordinary sand rules carry it down.
//
// Sized once, at the deepest the cut can ever be worked to: a bench bought
// mid-dig only adds more permanent floor under a column's target, never moves
// a row index a grain is resting in.
function cutRows() {
  return Math.round((QUARRY_H + (QUARRY_BENCH_MAX - QUARRY_BENCH0) * QUARRY_DEEPEN) / P);
}

// Called once from `settleIntoWorld`, after `quarry.x`/`quarry.w` are laid
// out; a window resize moves neither.
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

// Lay fresh rock into every column up to however far it has (not) been dug:
// what a fresh cut looks like, and what `fillQuarry` puts back.
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

// Make the grid's rock agree with the count. The count is the dig and the
// outline is drawn from it; the grid's rock is what a body's feet stand on
// (`cutTop`). A save's grid is laid over the fresh rock whole, so a grid that
// disagreed with its count stayed disagreeing for the life of the yard:
// `digCell` only takes the counted row, so rock left above it was never dug
// and the gang stood a course above the floor. Rock above the counted line
// goes; anything but rock at or under it becomes rock; what is lying loose
// above stays.
export function squareCut() {
  if (!cut.grid) return;
  const cells = quarryCells();
  for (let c = 0; c < cut.cols; c++) {
    const top = cut.rows - 1 - (cells[c] || 0);
    for (let r = 0; r < cut.rows; r++) {
      const v = at(cut, c, r);
      if (r <= top && v !== ROCK_CELL) put(cut, c, r, ROCK_CELL);
      else if (r > top && v === ROCK_CELL) put(cut, c, r, 0);
    }
  }
  cut.rock = 0;
  for (const v of cut.grid) if (v === ROCK_CELL) cut.rock++;
}

// Take one cell of rock out of column c, the shallowest still standing, which
// is the cell `dugTopY` moves past. Dust above it is not touched: it has
// nothing under it on the next pass, and `settle` takes it from there.
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

// What is lying loose on the floor of the cut: dust, and a shard that was
// thrown at the rim and came down short. Not `isDust`, because a shard is a
// find and a floor that saw only dust left it through every tidy for the
// refill to bury. Never the rock the cut is dug out of.
const loose = v => isDust(v) || findKind(v) > 0;

// Whatever fell down the cut comes back up with the ground, thrown out at the
// mouth like a shard: closing the fill over it would be a hole that destroys
// what a dig did not spend. Called before the columns are zeroed, so there is
// still a floor under what is being lifted off it.
function tipCut() {
  if (!cut.grid) return;
  for (let c = 0; c < cut.cols; c++) {
    for (let r = cut.rows - 1; r >= 0; r--) {
      const v = at(cut, c, r);
      if (!loose(v)) continue;
      put(cut, c, r, 0);
      const x = cut.x + c * P + P / 2;
      const y = cut.y + (cut.rows - 1 - r) * P;
      tossOut(x, y, v);
    }
  }
}

// The top of the cut at x: the dust lying there if any, the rock under it
// otherwise. A body or a route asking "what is underfoot" wants the dust's
// own top, not the rock two feet under it.
export function cutTop(x) {
  const c = colOfX(x);
  if (!cut.grid || c < 0 || c >= cut.cols) return dugTopY(x);
  return surfaceY(cut, c) + cut.p;
}

// The floor of the cut, as a patch the one tidying rule can work (tidy.js): a
// quarrier between digs throws what has fallen in up over the rim by
// `tossOut`, the same arc a seam takes. The claim book it is handed is
// `cutTaken`, the haulers' book for the same floor, so a quarrier and a
// hauler never go for the same column.
export const cutPatch = () => ({
  key: 'quarry',
  cols: cut.cols,
  colOf: x => colOf(cut, x),
  xOf: c => cut.x + c * P + P / 2,
  peek: c => { const r = topRow(cut, c); return r >= 0 && loose(at(cut, c, r)) ? at(cut, c, r) : 0; },
  take: c => {
    const r = topRow(cut, c);
    if (r < 0 || !loose(at(cut, c, r))) return 0;
    const v = at(cut, c, r);
    put(cut, c, r, 0);
    return v;
  },
  yOf: c => cut.y + (cut.rows - 1 - topRow(cut, c)) * P
});

// Back to a fresh cut: no dust, and the rock refilled to the dig depth at the
// time it is called. Used when a save comes in (the depth is already restored
// by then, `restore` in persist.js) and by a full reset.
export function resetCut() {
  if (!cut.grid) return;
  cut.grid.fill(0);
  cut.n = 0;
  cut.rock = 0;
  // And the dust ledger, which only exists once a save has been read
  // (`recount` in persist.js). Left standing, a new game after a load carried
  // the last yard's count over an empty grid, and rule 7 in verify.js said so.
  if (cut.d != null) cut.d = 0;
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
  return S.workers.some(o => o !== w && o.type === TYPE.QUARRY && o.goal === 'work' &&
                             (o.x - w.x) * (w.face || 1) > 0 &&
                             Math.abs(o.x - x) < WORKER * 1.3);
}

function seatX(w) {
  const n = Math.max(1, S.quarriers);
  const i = Math.max(0, S.workers.filter(o => o.type === TYPE.QUARRY).indexOf(w));
  const { lo, hi } = quarryBand();
  return lo + ((i + 0.5) / n) * (hi - lo);
}

// Up and out over the rim, into the quarry's own pile. Aimed, because it is a
// body at the bottom of a hole throwing stone up onto the ground above it;
// without the arc a knocked-loose grain's pop is sized for a face at head
// height and the whole seam lands back on the floor it came out of.
function tossOut(x, y, what = someFind(SHARD_CELL)) {
  const p = pileOf('quarry');
  const near = p ? p.from : quarry.x + quarry.w + P * 4;
  const far = p ? Math.max(near + P, p.to - P * 2) : near + P * 20;
  const land = Math.min(far, near + Math.abs(bell()) * (far - near) * 0.5);
  const v = aim(x, y, land, P);
  spawnChip(x, y, v.vx, v.vy, what, land);
}

// Down the hole: between the walls, under the ground line, and with its feet
// on the floor, not still on the ladder's rungs, which are inside the span
// too. A body this is true of is at its station, whatever its goal says.
const inCut = w => S.quarryOpen
  && w.x + WORKER > quarry.x && w.x < quarry.x + quarry.w
  && w.y + WORKER > S.groundY + 1
  && Math.abs(w.y + WORKER - cutTop(w.x + WORKER / 2)) <= P;

// one quarrier, one frame
export function stepQuarrier(w, now, ctx = null) {
  const rim = quarryFace();

  // Going down to work, and nothing here about a ladder: the body asks for a
  // route to its seat and walks it, and the route goes down the ladder
  // because the ladder is the only edge between the yard and the floor
  // (route.js).
  if (w.goal === 'to') {
    // Stood at the head of the ladder until the seam fills back in.
    //
    // Asked of the ground as well as of the flag: `quarrySpent` is not saved,
    // so a refresh that caught the gang climbing out of a finished cut sent
    // each body back down to find nothing, and since somebody was always
    // still below, nobody was ever the last one out who fills the hole. The
    // fill is asked for here too, by whoever is stood at the rim with nobody
    // left below, because the frame the last one out would have filled it on
    // is exactly the frame a refresh can lose.
    if (S.quarrySpent || quarryDone()) {
      if (!S.workers.some(o => o.type === TYPE.QUARRY && o.y > S.groundY)) {
        fillQuarry();
        S.quarrySpent = false;
      } else {
        if (!keepTo(w, rim)) return;
        if (stepRoute(w, QUARRY_WALK)) return;
        w.route = null;
        return;
      }
    }
    // The first hole of a session was never filled in by anybody, so its
    // stone is laid here.
    if (S.quarryOwed <= 0 && !dugShare()) S.quarryOwed = seamShards();
    // Already down the hole (a reload, a body put down there, a leg cut short)
    // is already at work; sent round by the rim it climbed out, crossed the
    // top and climbed back in.
    if (inCut(w)) { w.goal = 'work'; w.route = null; return; }
    w.seat = seatX(w);
    w.goal = 'down';
    w.route = null;
    return;
  }

  if (w.goal === 'down') {
    if (inCut(w)) { w.route = null; w.goal = 'work'; w.dugAt = now; return; }
    // The seat is not saved (a live target into a cut that may have moved), so
    // a body restored mid-descent has the factory's `seat: 0`, the left edge
    // of the world. A seat outside the cut is no seat.
    if (!(w.seat >= quarry.x && w.seat <= quarry.x + quarry.w)) w.seat = seatX(w);
    if (!keepTo(w, w.seat, ways().cut)) { w.goal = 'to'; return; }
    // The dig-shuffle pace is for legs in the cut; a leg up in the open is a
    // commute, or a body carried across the yard by an errand walks its whole
    // way home at a fifth of a walking pace. Only up in the open: below the
    // ground line everything keeps the shuffle, so nothing about the ladder
    // or the fill-in moves by a frame.
    const brisk = w.y + WORKER <= S.groundY + 1
      && w.route && w.route[0] && w.route[0].along && w.route[0].along.key !== 'cut';
    if (stepRoute(w, brisk ? commutePace() : QUARRY_WALK)) return;
    w.route = null;
    w.goal = 'work';
    w.dugAt = now;
    return;
  }

  // Out, with the seam gone up before it.
  if (w.goal === 'up') {
    if (!keepTo(w, rim, ways().yard)) { w.goal = 'work'; return; }
    const briskUp = w.y + WORKER <= S.groundY + 1
      && Math.abs(w.x - quarryFace()) > P * 50
      && w.route && w.route[0] && w.route[0].along && w.route[0].along.key !== 'cut';
    if (stepRoute(w, briskUp ? commutePace() : QUARRY_WALK)) return;
    w.route = null;
    w.goal = 'to';
    w.cell = null;                             // it is not digging anything now
    // The last one out fills the hole: doing it the moment the seam emptied
    // dropped the dirt under the feet of everybody still down there, and they
    // rode it up like a lift. And only out of a cut that is worked out: a body
    // climbs this leg to clear a mess up top too, and a half-dug cut that
    // filled behind it laid a fresh seam over what the old one still owed.
    if ((S.quarrySpent || quarryDone())
        && !S.workers.some(o => o.type === TYPE.QUARRY && o !== w && o.y > S.groundY)) {
      fillQuarry();
      S.quarrySpent = false;
    }
    return;
  }

  // Digging happens down the cut, and a body that is not down the cut is not
  // digging, whatever its goal says. The line below takes a height from a
  // *place* and puts a body at it; anything that leaves `work` set while the
  // body is somewhere else (picked up and put down, sent off for a hat) pinned
  // it to the height of a hole thousands of pixels away. Asked of the
  // quarry's own ground rather than the cut way, because the way only exists
  // once the quarry has been opened and a gang put on an unopened quarry work
  // it just the same.
  const all = ways();
  if (w.x + WORKER <= quarry.x || w.x >= quarry.x + quarry.w) {
    w.goal = 'to';
    w.route = null;
    w.cell = null;
    w.resting = false;
    w.y = climbTo(w, feetOn(wayAt(w.x, w.y, all), w.x));
    return;
  }

  // It stands on the ground as it is now (`cutTop`): down with its own work,
  // up on anything that piles under its feet. Planted, not written, so the
  // climber's memory (`w.foot`, route.js) goes down with the feet; written as
  // a position, the first route after the dig eased from a stale height and
  // the whole gang slid down to the floor a cell a frame. The sway is on top
  // of the feet, not a position the climber is asked to trust.
  plant(w, cutTop(w.x + WORKER / 2) - WORKER);
  w.y += Math.sin(now / 1000 * w.sp + w.ph) * 1.3;

  // Nowhere to put a seam: stand on the dirt (break.js), unless there is a
  // mess up top, in which case it asks to be up top and the route takes it
  // along the floor and up the rungs.
  if (S.pileFull.quarry) {
    if (yardMuckFor(w) > 0) {
      w.cell = null;
      w.goal = 'up';
      w.route = null;
      w.resting = false;
      w.next = now + beatMs();
      return;
    }
    w.resting = true; w.next = now + beatMs(); return;
  }
  w.resting = false;

  // It swings on its own rhythm, nothing to do with how the digging is going:
  // a cut should look worked whether or not it is about to pay.
  if (now >= w.swingAt) {
    w.lunge = 1;
    w.swingAt = now + QUARRY_SWING * (0.7 + rand() * 0.6);
  }

  // The hole dug out: up the ladder. The ground comes back in behind the last
  // one out (the 'up' leg).
  if (quarryDone()) { w.goal = 'up'; return; }

  // Silt first: rain fills the quarry from the top, and it has to come out
  // before the ground under it does.
  if (throughQuarryMuck(1) <= 0) return;
  // Between digs, and only between them, so tidying never costs a cell
  // (tidy.js).
  if (now < w.next) { tidyStep(w, cutPatch(), ctx && ctx.cutTaken, now); return; }

  // A cell is somewhere you go, not something that happens wherever you are
  // standing. It picks a *run* of them, a stretch of its course walked one
  // way: picking again after every one-frame cell was a body that never stood
  // still.
  const cells = quarryCells();
  if (!runStands(w)) w.run = nextQuarryRun(w.x + WORKER / 2, w);
  if (!w.run || !w.run.length) { w.cell = null; return; }
  w.cell = w.run[0];

  const to = quarry.x + w.cell * P + P / 2 - WORKER / 2;
  const d = to - w.x;
  if (Math.abs(d) > 1) {
    // A blaster is a shade quicker on its feet too, or halving the swing
    // doubled nothing once a body had to walk to every cell. And the ladder
    // is under its feet (`paceShare`).
    const step = CUT_STEP * (w.trained ? 1.5 : 1) / paceShare();
    w.x += Math.sign(d) * Math.min(step, Math.abs(d));
    return;                                    // on its way: it is not digging yet
  }
  w.x = to;
  if (now < w.next) return;

  const c = w.cell;
  // One swing takes a pocket: the cell under the pick and its neighbors along
  // the course, a blaster's twice as many. A crit takes more ground still (a
  // crit that only pulled the seam's shards forward changed nothing about
  // when the dig finished), and a strong brew is a wider pocket by the same
  // argument.
  const crit = critRoll(critBoost(w));
  const take = stronger(w, pocketOf(w)) + (crit - 1);
  // Each cell is dealt its own share of the seam, counted before it comes
  // out, so a pocket of three is three one-in-what-is-left chances exactly as
  // three swings were, and the last cell of a cut is still certain. The
  // crit's fountain goes on the first.
  const course = cells[c];
  findShards(w, cellsLeft(), crit);
  digCell(c);
  w.run.shift();
  for (let k = 1; k < take; k++) {
    const n = nearestUndug(c, course);
    if (n < 0) break;
    findShards(w, cellsLeft(), 1);
    digCell(n);
    const i = w.run.indexOf(n);
    if (i >= 0) w.run.splice(i, 1);          // a neighbor the run had coming
  }
  // The blaster's swing is the blast: the same ring a crit leaves, at a third
  // of the power. `shockAt` keeps one ring per frame at one place of work, so
  // a blaster's crit is one ring, not two. A crit's ring is the swing's, not
  // the stone's: more ground out at once is what bursts, whether or not any
  // of it held a shard.
  if (crit > 1) shockAt(w.x + WORKER / 2, cutTop(w.x + WORKER / 2), crit, 'quarry');
  else if (w.trained && CUT_BLAST_POWER > 0)
    shockAt(w.x + WORKER / 2, cutTop(w.x + WORKER / 2), CUT_BLAST_POWER, 'quarry');
  // Hand work never fouls the sky, anywhere; a machine's stack is the only
  // thing that does (`foul` refuses everything else).
  w.lunge = 1;
  w.swingAt = now + QUARRY_SWING;
  // A hearty stew quickens this body's own digging (apothecary.js).
  w.next = now + beatMs() / speedBoost(w) * (0.85 + rand() * 0.3);

  if (quarryDone()) S.quarrySpent = true;      // that is the lot: everybody out
}

// --- what is in the ground ------------------------------------------------------
// A dig is worth `seamShards()`, scattered through the ground rather than
// paid on the last frame. The scatter is dealt, not rolled: each shard still
// in the ground is in one of the cells still in the ground, picked evenly, so
// a swing turns one up with a chance of one-in-what-is-left. The dig pays
// exactly what the board says, and the last cell of a cut is certain, so a
// dig never ends owing you anything.
//
// `left` is the count *including* the cell just swung, which is what makes
// that last cell come out at one-in-one.
export function findShards(w, left, crit = critRoll(critBoost(w))) {
  if (S.quarryOwed <= 0 || left <= 0) return;
  let found = 0;
  for (let n = 0; n < S.quarryOwed; n++) if (rand() * left < 1) found++;
  // A crit is not more stone from this cell: the swing takes `crit - 1` cells
  // more and each is dealt its own share. Pulling whole shards forward here as
  // well emptied the ground in the first layers, so the ore only ever came up
  // out of the top of the cut. `crit` says only how the stone leaves.
  if (!found) return;
  S.quarryOwed -= found;
  w.quarried = (w.quarried || 0) + found;
  // The swing that found it throws it out, so the stone leaves from the cell
  // it came out of. A crit throws its lump up as a fountain.
  for (let n = 0; n < found; n++) {
    if (crit > 1) critToss(w.x + WORKER / 2, w.y + WORKER, someFind(SHARD_CELL), 'quarry', crit);
    else tossOut(w.x + WORKER / 2, w.y + WORKER);
  }
}

// The nearest column to `c` still standing at `course`, for the rest of a
// pocket. Same course, not nearest undug at any depth: once a neighbor was
// taken it was still the nearest undug column, one deeper, so a crit's extra
// cells went down the same neighbor as a shaft. A column taken once this
// swing is no longer on the course.
function nearestUndug(c, course) {
  const cells = quarryCells();
  for (let d = 1; d < cells.length; d++) {
    for (const i of [c - d, c + d]) {
      if (i < 0 || i >= cells.length) continue;
      if (cells[i] === course && cells[i] < quarryTarget(i)) return i;
    }
  }
  return -1;
}

// nobody is out of sight any more: the whole point of a cut rather than a shaft
export const underground = () => false;

// --- the dig ------------------------------------------------------------------
// The quarry is what has been taken out of the ground: one number per column,
// how many cells deep it has been dug. `quarryTarget` says how deep each
// column eventually goes, which is where the benched walls and the jagged
// floor come from; you arrive at the profile rather than being shown it.
export function quarryCells() {
  const want = Math.max(0, Math.round(quarry.w / P));
  if (!S.quarryCells || S.quarryCells.length !== want) {
    const was = S.quarryCells || [];
    S.quarryCells = new Array(want).fill(0);
    for (let i = 0; i < Math.min(was.length, want); i++) S.quarryCells[i] = was[i] || 0;
  }
  return S.quarryCells;
}

// The dig, on the save (persist.js, `SAVERS`). The cut's own sand is the
// codec's (`CUT` in persist.js), read after the ground; it only means
// anything against these, so the two are written together.
export const SAVE = {
  fields: ['quarryCells'],
  write(out) {
    out.quarryCells = S.quarryCells ? Array.from(S.quarryCells) : null;
  },
  read(s) {
    // Null is an unbroken floor, which `resetCut` lays fresh rock to match.
    S.quarryCells = Array.isArray(s.quarryCells) ? s.quarryCells.map(v => +v || 0) : null;
  },
  blank() {}
};

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

// --- the beat and the pocket ---------------------------------------------------
// A swing comes round on a beat you can see, shortened through `paceShare`
// down to a floor under which the pick never lands on anything.
export function beatMs(lvl = paceLadder()) {
  return Math.max(CUT_BEAT_MIN, CUT_BEAT_MS * paceShare(lvl));
}

// How many cells a swing takes. `CUT_POCKET` until the beat is at its floor;
// past the floor the pocket widens by the share the beat could not take, so
// the ground keeps coming out at the ladder's rate. A blaster takes twice as
// many.
export function pocketOf(w = null, lvl = paceLadder()) {
  const want = CUT_BEAT_MS * paceShare(lvl);
  const wide = want < CUT_BEAT_MIN ? CUT_BEAT_MIN / want : 1;
  return Math.max(1, Math.round(CUT_POCKET * wide)) * (w && w.trained ? 2 : 1);
}

// Whether the run a body is on is still worth walking: it has one, it still
// holds its claim (`cell` is what every leg that stands a body down clears),
// the cells left are still standing, and still on the shallowest course.
function runStands(w) {
  if (w.cell == null || w.cell < 0 || !w.run || !w.run.length) return false;
  const cells = quarryCells();
  w.run = w.run.filter(c => cells[c] < quarryTarget(c));
  if (!w.run.length) return false;
  let shallow = Infinity;
  for (let c = 0; c < cells.length; c++)
    if (cells[c] < quarryTarget(c)) shallow = Math.min(shallow, cells[c]);
  return cells[w.run[0]] === shallow;
}

// Every column some other quarrier is about to swing at: its cell and the
// neighbors its pocket will take. The rest of a run is a plan, not a claim: a
// body held up tidying with the whole stretch booked left the others digging
// the far end two courses down while its end stood.
function claimedCells(self) {
  const taken = new Set();
  for (const o of S.workers) {
    if (o === self || o.type !== TYPE.QUARRY || o.cell == null || o.cell < 0) continue;
    taken.add(o.cell - 1); taken.add(o.cell); taken.add(o.cell + 1);
  }
  return taken;
}

// The stretch of course a body at x works next: the nearest open cell on the
// shallowest course, and from there along the course one way, up to
// `CUT_RUN` pockets' worth. One way, so the walk is one walk. Toward the side
// with more of the course still standing, so a gang starting from the ladder
// fans out along the face rather than queueing at its foot.
export function nextQuarryRun(x, self = null) {
  const cells = quarryCells();
  const taken = claimedCells(self);
  let shallow = Infinity;
  for (let c = 0; c < cells.length; c++) {
    if (cells[c] >= quarryTarget(c) || taken.has(c)) continue;
    shallow = Math.min(shallow, cells[c]);
  }
  if (shallow === Infinity) return null;
  const open = c => c >= 0 && c < cells.length && cells[c] === shallow
    && cells[c] < quarryTarget(c) && !taken.has(c);
  const home = Math.max(0, Math.min(cells.length - 1, colOfX(x)));
  let start = -1;
  for (let d = 0; d < cells.length && start < 0; d++) {
    if (open(home - d)) start = home - d;
    else if (open(home + d)) start = home + d;
  }
  if (start < 0) return null;
  let left = 0, right = 0;
  for (let c = start - 1; open(c); c--) left++;
  for (let c = start + 1; open(c); c++) right++;
  const dir = right >= left ? 1 : -1;
  const run = [];
  const most = CUT_RUN * pocketOf(self);
  for (let c = start; open(c) && run.length < most; c += dir) run.push(c);
  return run;
}

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

// The column a thing at x takes the next cell off: the jaw's question. The
// shallowest ground first, then the nearest, so the cut is worked *down* in
// layers rather than as a one-cell slot. Nobody else's cell (`claimedCells`).
export function nextQuarryCell(x, self = null) {
  const run = nextQuarryRun(x, self);
  return run && run.length ? run[0] : -1;
}

// and the ground fills back in behind them
export function fillQuarry() {
  // What was lying on the floor is pushed up and out by the same throw the
  // seam leaves by: every pixel is worth one dust, and the hole is the only
  // thing that destroys nothing.
  tipCut();
  const cells = quarryCells();
  for (let c = 0; c < cells.length; c++) cells[c] = 0;
  layCut();                                    // and the ground is back in the plot
  // The next dig's stone is set when the ground is laid, not when somebody
  // first swings: a bench bought halfway down a dig pays from the next one.
  S.quarryOwed = seamShards();
}

// What one dig is worth: the handful a bench, and the yield ladder's share on
// top. A share rather than a flat extra, because the handful already scales
// with how deep the cut is. It is what the row's own gain line reads.
export const seamDig = (lvl = seamLadder()) =>
  Math.max(1, Math.round(benches() * CUT_SEAM * rungValue('seam', lvl)));

// What actually goes into the ground when a cut is laid: that, with the luck
// spell over it. Multiplied here, at the one place the amount is decided, so
// `S.quarryOwed` is still set once when the ground is laid and only ever
// comes down, and a dig still pays exactly what the board says.
export const seamShards = () =>
  Math.max(1, Math.round(seamDig() * (spelled('luck') ? SPELL_LUCK : 1)));

// How long one cell takes: CUT_DIG_MS at pace nought spread over however many
// cells the quarry is (deeper is longer, the trade for a bigger seam), and
// the pace ladder's share off that. The floor is under the pace-nought swing,
// not under the ladder's answer: a cut is more cells than CUT_DIG_MS has
// sixtieths, so a ladder applied *inside* the max had nothing to shorten.
export function cellMs(lvl = paceLadder()) {
  const cells = quarryCells();
  let want = 0;
  for (let c = 0; c < cells.length; c++) want += quarryTarget(c);
  const per = CUT_DIG_MS / Math.max(1, want);
  return Math.max(CUT_SWING_MIN, per) * paceShare(lvl);
}


// --- what the quarry sells ------------------------------------------------------
// A decision about a place is made at the place. The row that *opens* it
// stays on the bench, because you cannot walk up to a quarry that has not
// been dug. The two ladders sell what one dig turns up and how often a dig
// happens (DESIGN.md, "What the two grounds sell").
const QUARRY_YIELD = tierRows({
  field: 'seamLevel',
  unit: 'shards/dig',
  value: lvl => seamDig(lvl),
  site: 'quarry', board: 'quarry',
  show: () => S.quarryOpen,
  bands: [
    { key: 'seam',    name: 'ore yield',     coins: [] },
    { key: 'seam2',   name: 'ore yield',  coins: ['shard'] },
    { key: 'seam3',   name: 'ore yield', coins: ['shard', 'spore'] },
    // The spark rung. `restore` still knows the old key, `labseam`.
    { key: 'seam4',   name: 'ore yield', coins: ['shard', 'spore', 'spark'] }
  ]
});

const QUARRY_SPEED = tierRows({
  field: 'quarryPaceLevel',
  unit: 'trips/min', pct: true, does: 'dig',
  value: lvl => quarryRate(lvl),
  site: 'quarry', board: 'quarry',
  show: () => S.quarryOpen,
  bands: [
    { key: 'quarrypace',  name: 'mining speed',     coins: [] },
    { key: 'quarrypace2', name: 'mining speed',  coins: ['shard'] },
    { key: 'quarrypace3', name: 'mining speed', coins: ['shard', 'spore'] },
    { key: 'quarrypace4', name: 'mining speed', coins: ['shard', 'spore', 'spark'] }
  ]
});

export const QUARRY_UPGRADES = [
  ...QUARRY_YIELD,
  ...QUARRY_SPEED,
  {
    key: 'quarrybench',
    // A place: while the quarriers are cutting the next bench they are not
    // bringing stone up (works.js).
    kind: 'place', site: 'quarry',
    // `capOfBare` caps quarriers at `benches()`, so what you are buying is
    // another quarrier's shovel at the face; the cut a bench deeper is what
    // it leaves behind.
    name: 'another shovel',
    // What the from/to is counting, so the gain reads "1 -> 2 shovels".
    unit: 'shovels',
    from: () => benches(),
    to: () => benches() + 1,
    // A ladder as far as the tile is concerned: a pip a bench, and the work
    // climbs with it.
    rung: () => S.benchLevel,
    rungs: () => QUARRY_BENCH_MAX - QUARRY_BENCH0,
    // A cut of the cut's own stone: the next bench comes out of what the
    // gang is already bringing up.
    bill: () => [['shard', Math.round(BENCH_SHARDS * Math.pow(BENCH_RATE, S.benchLevel))]],
    buy: () => { S.benchLevel++; resite(); },
    show: () => S.quarryOpen && benches() < QUARRY_BENCH_MAX
  },
  {
    // Gated like the ram: both of the cut's ladders topped and a helmet on
    // every quarrier (`canBuy`), not the last bench -- the benches are room,
    // and a machine replaces the hands, not the floor.
    key: 'jaw',
    kind: 'machine', site: 'quarry',
    name: 'the drill',
    bill: () => JAW_BILL,
    buy: () => { buyMachine('jaw'); rebalance(); },
    show: () => S.quarryOpen && canBuy('jaw',
                                       () => S.quarryPaceLevel >= LADDER && S.seamLevel >= LADDER,
                                       () => kitFull(JOB.QUARRY))
  },

  // The drill's own ladder, three rungs of red (`tuneRow` in machines.js).
  // Keyed 'jaw', which is what every save has in it; the words are what
  // anybody reads.
  tuneRow('jaw', 'drill bite',
          () => `the drill bites ${MACHINE_TUNE}x harder`, 'quarry')
];

// Two headings: who works the hole (the blaster's lamps lodge here from
// upgrades/rows-kit.js, see `lodgers`), and what the hole pays. Every card of
// both ladders is named; only the band you are on answers `true` to `show`.
export const QUARRY_SECTIONS = [
  { title: JOB.QUARRY, keys: ['quarrybench', 'blaster', 'jaw', 'tunejaw'] },
  { title: 'the ore',   keys: ['seam', 'quarrypace'] }
];


// --- the jaw --------------------------------------------------------------------
// The machine that works the cut. It does exactly what a quarrier does, by
// calling the same two functions: `findShards` pays a dig exactly
// `seamShards()` *because* `left` is `cellsLeft()` counted before each single
// cell comes out, and a jaw that ate a whole column at a beat would quietly
// rewrite what `dig deeper` is worth.
//
// Its geometry is derived every frame and never stored: `fillQuarry` zeroes
// every column, and a jaw with a remembered `y` would be under the new ground.

// The middle of the mouth, derived off the shape of the hole so it stays in
// the middle however deep the thing is taken.
export const jawX = () => {
  const c = quarryShape();
  // Half the rig's width off the middle, read off the picture: a machine
  // centered by a literal walks sideways the day it is redrawn.
  return Math.round(((c.from + c.to) / 2 - P * Math.round(spriteW(DRILL) / 2)) / P) * P;
};

// On the bridge deck, the only solid ground over a hole. Its feet are the
// bottom row of the picture.
export const rigTop = () => Math.round((bridgeSpan().top - spriteH(DRILL) * P) / P) * P;

// Which column the shaft comes down, read off the picture: the gap the legs
// leave in the bottom row is the bore.
export const shaftX = () => jawX() + DRILL[spriteH(DRILL) - 1].indexOf('.') * P;

// The floor it is boring, as the floor is now, so when the quarry falls in the
// bit comes up with the ground.
export const jawY = () => dugTopY(shaftX());

// Where the body working it stands: on the rig's roof, read off the picture
// (`roofRow`, `seatCol`), so the rig carries its operator's footing with it.
export const drillSeat = () => ({
  x: jawX() + seatCol(DRILL) * P,
  y: rigTop() + roofRow(DRILL) * P - WORKER
});

defineMachine('jaw', {
  job: JOB.QUARRY,
  type: TYPE.QUARRY,
  at: jawX,
  y: jawY,
  // The top of its chimney. Not part of the sprite, which would have to grow
  // two rows it never uses, so the column is named here once and the drawing
  // reads it back. The rig stands on the deck, so its stack is up in the
  // daylight, which is where the dirt goes up.
  stack: () => ({ x: jawX() + stackCol(DRILL) * P, y: rigTop() }),
  // A body works this machine from on top of it (`stepTender`).
  seat: drillSeat,
  // Where the *body* stands: the tender works the hoist on the deck at the
  // head of the ladder, not down a hole full of machine.
  tendAt: quarryFace,
  // The station's own clock at pace nought, divided by what the machine is
  // worth. The cut's pace ladder is NOT in here: its rungs are the walk
  // between cells, and a rig on the deck does not walk. The machine's own
  // ladder is `drill bite`. (Read off the ladder, the jaw ran four times
  // faster at pace eight and fouled four times as much.)
  ms: rate => cellMs(0) / Math.max(0.01, rate),
  // `quarryDone()` is deliberately *not* here: the beat on which the cut is
  // worked out is the beat on which the ground has to come back in, and
  // forbidding it deadlocked the quarry for good, since `fillQuarry` has only
  // two callers, this machine and a quarrier climbing out.
  ready: () => !S.pileFull.quarry && throughQuarryMuck(1) > 0,
  bite: tender => {
    // A cut already worked out: this beat is spent on the ground coming back.
    if (quarryDone()) {
      if (S.workers.some(o => o.type === TYPE.QUARRY && o.y > S.groundY)) return false;
      fillQuarry();
      S.quarrySpent = false;
      return false;
    }
    const cells = quarryCells();
    // The tender is passed through, not `null`: a body keeps its `cell` claim
    // when it takes up tending, and a claim nobody is walking to would keep
    // the machine off that cell for as long as it ran.
    const c = nextQuarryCell(shaftX(), tender);
    if (c == null || c < 0) return false;
    const left = cellsLeft();
    digCell(c);
    // The find is credited to the tender, who brought it up; the machine has
    // no record of its own. The same finds a swing turns up. What the jaw
    // does *not* share is the sky: it fouls from its own stack in
    // `stepMachines`, and a body digging fouls not at all.
    findShards(tender || { x: shaftX(), y: jawY() }, left);
    // The ground comes back in behind it. By hand this happens on the way
    // *out*, for the sake of anybody still down there; a machine has nobody
    // down there, so the cut falls in the moment it is worked out. Without
    // this the jaw dug the hole out once and stood in it forever.
    if (quarryDone()) {
      const below = S.workers.some(o => o.type === TYPE.QUARRY && o.y > S.groundY);
      if (!below) { fillQuarry(); S.quarrySpent = false; }
      else S.quarrySpent = true;
    }
    return true;
  }
});

// So a work coming back out of a save knows which row it belongs to
// (`registerRows` in works.js).
registerRows(QUARRY_UPGRADES);
