import { LOO_MUCK, MESS_ANGLE, MESS_SLIDE, MESS_SLUMP, MUCK_MAX, P } from '../config.js';
import { TYPE } from '../jobs.js';
import { pitTop } from '../pit.js';
import { dugTopY } from '../quarry.js';
import { boulderAlive, rockTopY } from '../rock.js';
import { SOLID, footing, solidNear } from '../route.js';
import { S, farm, floor, quarry } from '../state.js';
import { overPitMouth, rockLeft } from '../world.js';

// --- the layer -----------------------------------------------------------------------
// One layer, one depth per column, and each column's mess knows what kind it
// is. Everything that lies on the ground is read off it, so nothing can
// disagree with what you are looking at.
//
// One row per kind, holding everything anybody asks about one. Add a row and
// it rains down, slumps, slides off loose ground, is shovelled by whoever may
// shovel it and is counted, without a second copy of any of that.
//
//   theirs  somebody's own mess rather than the weather's, so only the body
//           whose post it is may shift it. See `mayShift`.
//
// The kind's name is also where it lives in the save.
export const MESS = {
  muck: { theirs: false },
  poop: { theirs: true }
};

// In the order the world works them: the weather first.
const KINDS = Object.keys(MESS);

// One column array per kind, kept the length of the world.
export function cols(kind) {
  if (!S[kind] || S[kind].length !== floor.cols) {
    const was = S[kind] || [];
    S[kind] = new Array(floor.cols).fill(0);
    for (let i = 0; i < Math.min(was.length, floor.cols); i++) S[kind][i] = was[i] || 0;
  }
  return S[kind];
}

// A saved layer lines up with the floor it was written over, and the floor
// slides on the way back in when the yard has changed width (`floorShift`,
// persist.js): the mess slides with it, by the same columns, so what lay
// under a station still does. Read column by column without this, a save
// from a wider yard stood its muck under the wrong buildings and lost the
// far end of it off the edge.
export function slideLayers(shift) {
  if (!shift) return;
  for (const kind of KINDS) {
    const was = S[kind] || [];
    const next = new Array(floor.cols).fill(0);
    for (let i = 0; i < was.length; i++) {
      const c = i + shift;
      if (c >= 0 && c < floor.cols) next[c] = was[i] || 0;
    }
    S[kind] = next;
  }
}

// They hand back the layer itself, so a check laying mess by hand writes to
// the same cells the yard reads.
export const muckCols = () => cols('muck');
export const poopCols = () => cols('poop');

// The whole of the ownership rule, asked of the kind rather than re-derived
// at every call site.
const mayShift = (hand, kind) => !MESS[kind].theirs || !!(hand && hand.type === TYPE.JANITOR);

// What this pair of hands may shift, its own post first and the weather after.
const shiftable = hand => KINDS.filter(k => mayShift(hand, k))
  .sort((a, b) => (MESS[b].theirs ? 1 : 0) - (MESS[a].theirs ? 1 : 0));

// what is standing in a column, of whatever kind: for heights, for drawing, and
// for anything that only wants to know whether the ground is clear
export const messAt = c => KINDS.reduce((n, k) => n + (cols(k)[c] || 0), 0);

export const colAt = wx => Math.floor(wx / P);
const inRange = (c, from, to) => c >= colAt(from) && c <= colAt(to);

const rockCols = () => boulderAlive()
  ? { from: rockLeft(), to: rockLeft() + S.gw * P } : null;
const quarryCols = () => S.quarryOpen ? { from: quarry.x, to: quarry.x + quarry.w } : null;
const plotCols = () => S.farmOpen ? { from: farm.x, to: farm.x + farm.w } : null;

function depthOver(range) {
  if (!range) return 0;
  const m = muckCols();
  let n = 0;
  for (let c = colAt(range.from); c <= colAt(range.to); c++) n += m[c] || 0;
  return n;
}

export const rockMuck = () => depthOver(rockCols());
export const quarryMuck = () => depthOver(quarryCols());
export const plotMuck = () => depthOver(plotCols());

// Where the muck in a column sits. It lies on top of what it landed on: it
// does not sink into it and it does not float over it.
export function muckFloor(c) {
  const wx = c * P + P / 2;
  const r = rockCols();
  if (r && wx > r.from && wx < r.to) {
    const col = Math.round((wx - rockLeft()) / P);
    if (S.rockTops[col] >= 0) return rockTopY(col);
  }
  // The quarry's floor as actually dug, not the depth the hole will reach:
  // on the full depth the muck hangs at the bottom of a hole not dug yet.
  if (S.quarryOpen && wx > quarry.x && wx < quarry.x + quarry.w)
    return dugTopY(wx);
  // The top of the pile, not `surfaceY`: that is where the *next* grain would
  // rest, a cell above the dust already there, and a layer on it hangs with
  // daylight under it. The ground line over an open pit is thin air.
  if (overPitMouth(wx)) return pitTop(wx);
  return S.groundY;
}

function clearRange(range, effort) {
  if (!range) return effort;
  const m = muckCols();
  const from = colAt(range.from), to = colAt(range.to);
  let left = effort;
  for (let c = from; c <= to && left > 0; c++) {
    if (!m[c]) continue;
    const took = Math.min(m[c], left);
    m[c] -= took;
    left -= took;
  }
  return left;
}

export const throughRockMuck = n => clearRange(rockCols(), n);
export const throughQuarryMuck = n => clearRange(quarryCols(), n);
export const throughPlotMuck = n => clearRange(plotCols(), n);

// The nearest ground to a place that a shovel can actually reach, or null.
// A body on the rock is on ground held out of the sweep, so what it leaves
// goes on the bare yard a step away rather than lying on the rock for the
// rest of the run.
export function cleanSpotNear(wx, reach = 90) {
  const m = muckCols();
  const at = solidNear(wx, reach);
  if (at == null) return null;
  const c = colAt(at);
  return c < 0 || c >= m.length ? null : c * P + P / 2;
}

// Where a body stands to work a patch: the patch if there is footing under
// it, the nearest footing if not. One question, answered by `footing`: the
// rock is solid so a body climbs it; a heap is loose and a mouth is nothing,
// so the body steps to the side. See route.js.
export const workSpot = wx => footing(wx) === SOLID ? wx : (solidNear(wx) ?? wx);

// Capped at MUCK_MAX whoever put it there; without that a body buries a column
// deeper than a downpour ever would.
export function dropMuckAt(wx, n, kind = 'muck') {
  const at = cleanSpotNear(wx);
  if (at == null) return false;
  const m = cols(kind);
  const c = colAt(at);
  // A unit at a time, each into the lowest column nearby, which is what makes
  // a heap rather than a chimney.
  for (let i = 0; i < n; i++) {
    let best = c, low = m[c] || 0;
    for (let d = 1; d <= MESS_SLUMP; d++) {
      for (const k of [c - d, c + d]) {
        if (k < 0 || k >= m.length) continue;
        const h = m[k] || 0;
        // Strictly lower, so it fills the dip beside the heap before starting
        // a new one further out; the nearer of two equal columns wins because
        // the loop reaches it first.
        if (h < low) { low = h; best = k; }
      }
    }
    if (low >= MUCK_MAX) break;                // nowhere near here has room
    m[best] = Math.min(MUCK_MAX, (m[best] || 0) + 1);
  }
  return true;
}

// One pass of the mess settling: a column more than a step above its neighbor
// topples a unit into it, at the same angle sand stands at (`settle` in
// grid.js), since both are drawn out of the same cells.
export function slumpMess() {
  for (const kind of KINDS) {
    const m = cols(kind);
    for (let c = 0; c < m.length; c++) {
      const h = m[c] || 0;
      if (h < 2) continue;
      for (const k of [c - 1, c + 1]) {
        if (k < 0 || k >= m.length) continue;
        if (h - (m[k] || 0) > MESS_ANGLE) { m[c]--; m[k] = (m[k] || 0) + 1; break; }
      }
    }
  }
  slideOffLoose();
}

// Mess on ground that will not hold it slides to ground that will. Nothing
// lands on a bank, but a bank grows under a mess, and a mess halfway up a
// slope of loose dust is one nobody can stand to shovel, for ever.
//
// One column a pass: this runs every frame, the slide is only ever a few
// cells, and a walk over the whole yard for every dirty column would be the
// most expensive thing in the file.
function slideOffLoose() {
  for (const kind of KINDS) {
    const m = cols(kind);
    for (let c = 0; c < m.length; c++) {
      if (!m[c]) continue;
      const x = c * P + P / 2;
      if (footing(x) === SOLID) continue;
      const to = solidNear(x, MESS_SLIDE);
      if (to == null) continue;
      const k = colAt(to);
      if (k === c || k < 0 || k >= m.length || (m[k] || 0) >= MUCK_MAX) continue;
      m[c]--;
      m[k] = (m[k] || 0) + 1;
      return;                       // one column a pass; the rest follow it down
    }
  }
}

// Shifted from wherever the body doing the shifting stands, so a gang spread
// along the yard clears the yard. A shovel reaches on to a site (a body
// cannot *stand* on one; that rule is `cleanSpotNear`'s), or muck on a rock
// nobody is swinging at stays for the rest of the run.
//
// Whole cells, and that is the point of `hand`: effort arrives a twentieth
// of a cell a frame, and taking the fraction off the column draws a layer
// sinking smoothly into the ground. The fraction is kept in the hand until
// it is worth a whole cell. The carry is capped at one, or a body walking a
// long way arrives with seconds of effort saved up and takes a trench out on
// the first frame.
export function sweepMuckAt(wx, n, hand) {
  // The rule is not written here: it is read off the kinds. See `shiftable`.
  const stacks = shiftable(hand).map(k => cols(k));
  const home = colAt(wx);
  const hold = hand || loose;
  hold.owed = Math.min(1, (hold.owed || 0) + n);
  let cells = Math.floor(hold.owed);
  if (cells < 1) return 0;
  let took = 0;
  for (let d = 0; d < 60 && cells > 0; d++) {
    for (const c of (d ? [home - d, home + d] : [home])) {
      if (c < 0 || c >= floor.cols || cells < 1) continue;
      for (const m of stacks) {
        if (!m[c] || cells < 1) continue;
        const take = Math.min(m[c], cells);
        m[c] -= take;
        cells -= take;
        took += take;
      }
    }
  }
  hold.owed -= took;
  return took;
}

// for a sweep nobody owns -- a hook, a check -- so the fraction has somewhere to
// live either way
const loose = { owed: 0 };

// --- the frame's answers, worked out once -------------------------------------
// How much mess is out there and how much of it is on workable ground. Every
// body asks every frame and the answer is a walk over every column asking the
// footing, so it is a memo keyed on the frame and the layer's own arrays: a
// new frame, or a layer rebuilt by a reseeding or a wider world, walks again.
//
// Frame-grained on purpose. The crew are stepped before the sky is, so every
// body in a pass sees the same figure; a number that moved mid-pass would
// mean the first body to ask cleared the mess out from under the sixth.
let tallied = null;

// A hand rewriting the cells in place between frames (the __muckSet/__poopSet
// hooks) changes the world without changing either key, and every reader
// until the next tick gets the old answer. The hook calls this; nothing in
// play needs to.
export const retally = () => { tallied = null; };

function tally() {
  const stacks = KINDS.map(k => cols(k));
  if (tallied && tallied.tick === S.tick && stacks.every((s, i) => s === tallied.stacks[i]))
    return tallied;
  // Per kind, and the same sum again over only the ground a body can work.
  const by = {}, yardBy = {};
  for (const k of KINDS) by[k] = yardBy[k] = 0;
  let all = 0, yard = 0;
  for (let c = 0; c < stacks[0].length; c++) {
    let v = 0;
    for (const s of stacks) v += s[c] || 0;
    if (!v) continue;              // and `onSite` is never asked about bare ground
    const off = !onSite(c);
    for (let i = 0; i < KINDS.length; i++) {
      const n = stacks[i][c] || 0;
      by[KINDS[i]] += n;
      if (off) yardBy[KINDS[i]] += n;
    }
    all += v;
    if (off) yard += v;
  }
  // Once the yard has been left in a state it has been: the row that sells
  // the shed hangs off this, and a row that vanished because somebody tidied
  // up would be the game changing its mind.
  const theirs = KINDS.reduce((n, k) => (MESS[k].theirs ? n + by[k] : n), 0);
  if (theirs >= LOO_MUCK * 5) S.seenMess = true;
  return (tallied = { tick: S.tick, stacks, all, yard, by, yardBy });
}

// Ground a shovel cannot be swung on because there is nowhere to stand: the
// two mouths, and the plots (you would be treading on the crop). Asked of the
// footing, not of a list of buildings. The rock is solid ground that happens
// to be uphill, so it is not held out.
function onSite(c) {
  const x = c * P + P / 2;
  if (footing(x) !== SOLID) return true;
  const p = plotCols();
  return !!p && inRange(c, p.from, p.to);
}

// How much ground a body shovelling claims either side of itself, in columns: a
// body is three cells wide, so this keeps the next one clear of its elbows.
export const MUCK_ELBOW = 4;

// What is left to shift in a column. With a hand, only what *that* hand may
// shift: a claim is made on a kind the hand may touch (`nearestMuck`) and
// must be released on the same question, or a hauler that cleared the
// weather off a column with a body's own mess under it holds the claim for
// good. With no hand it is the raw height, for heights and drawing.
export function muckAtCol(c, hand = null) {
  if (c < 0 || c >= floor.cols) return 0;
  if (!hand) return messAt(c);
  return shiftable(hand).reduce((n, k) => n + (cols(k)[c] || 0), 0);
}

// A stable number out of who this body is: the same every frame (a per-frame
// rand() sends the body to a different patch each frame and it never
// settles) and different per body, so a gang on one heap stands at uneven
// gaps instead of on a picket line.
const handHash = hand => {
  const s = String((hand && (hand.name || hand.type)) || '');
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
};

export function nearestMuck(wx, taken, hand) {
  // Only kinds this hand may shift (`shiftable`), so a claim is never made on
  // ground the shovel would then refuse and the body stand over.
  const mine = shiftable(hand).map(k => cols(k));
  // Muck lies over the mouth of the pit, and only a hauler or a janitor may
  // go down for it; any other trade claiming it walks to the mouth and stands
  // at the ground line with the mess hundreds of pixels below its feet. The
  // gate is here because every call site claims through here, and it tests
  // `overPitMouth` like the hauler's own pit branch so the two cannot drift.
  // The janitor is let down because poop is the one mess nobody else may
  // shift, and bodies work and cross the pile.
  const canDescend = hand && (hand.type === TYPE.HAUL || hand.type === TYPE.JANITOR);
  // A rockhand shovels only its own site (`rockhandMess`): handed the nearest
  // column of anything, a gang follows the drift at the rock's foot out across
  // the yard while the rock stands under its last patch. Unless its pile is
  // full and there is nothing else for it to do anyway.
  const own = hand && hand.type === TYPE.ROCK && !S.pileFull.rock ? rockCols() : null;
  const inside = c => !own || (c * P + P / 2 >= own.from && c * P + P / 2 < own.to);
  const m = muckCols();
  const here = c => { let n = 0; for (const s of mine) n += s[c] || 0; return n; };
  // Where the scan starts and how much ground a claim reserves are this
  // body's own; the claim itself is still one column, one body.
  const h = handHash(hand);
  const jitter = h % (MUCK_ELBOW * 2 + 1) - MUCK_ELBOW;
  const stride = MUCK_ELBOW - 1 + ((h >> 3) % 4);      // ELBOW-1 .. ELBOW+2
  const home = colAt(wx) + jitter;
  for (let d = 0; d < m.length; d++) {
    for (const c of (d ? [home - d, home + d] : [home])) {
      if (c < 0 || c >= m.length || !here(c) || !inside(c)) continue;
      const x = c * P + P / 2;
      const down = overPitMouth(x);
      if (!canDescend && down) continue;
      if (taken && taken.has(c)) continue;
      // Nor a column with nowhere to stand within a shovel's reach of it: the
      // claim would be dropped at the shovel (`takeMess`) and picked again
      // here, a frame at a time, for as long as the mess lay there. Not asked
      // of the mouth by a body that goes down it: its stance there is the
      // hole's floor (`downTheHole`), and a torn mouth is hundreds of columns
      // with no ground within reach of any of them (test/perf-gate.test.mjs).
      if (!down && footing(x) !== SOLID && solidNear(x) == null) continue;
      // A claim is a stretch, not a cell: columns are six pixels and a body
      // eighteen wide, so reserving one cell puts the next body one cell over,
      // standing in the first for the whole clear-up.
      if (taken) for (let k = c - stride; k <= c + stride; k++) taken.add(k);
      return c * P + P / 2;
    }
  }
  // Everything within reach is spoken for. No second pass handing out the
  // nearest patch anyway: that ends every clear-up with three bodies standing
  // in each other over one shovelful. A claim frees the instant its column is
  // clear, so the wait is a beat.
  return null;
}

export const muckLeft = () => tally().all;
// how much of it is what a body left, which is the janitor's alone
export const poopLeft = () => tally().by.poop;
// What a given pair of hands may shift, which decides whether it is worth
// walking over there. One sentence (`shiftable`) asked at two ranges; two
// spellings of it once disagreed about poop and sent a quarrier up and down
// its ladder for as long as anybody watched.
const mineToShift = (w, sums) => shiftable(w).reduce((n, k) => n + sums[k], 0);
export const muckFor = w => mineToShift(w, tally().by);
// the same question, asked only of the ground that is not a site
export const yardMuckFor = w => mineToShift(w, tally().yardBy);
// the raw number, for the yard's own account of itself
export const yardMuck = () => tally().yard;
export const buried = () => rockMuck() > 0 || quarryMuck() > 0 || plotMuck() > 0;
