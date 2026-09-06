import { LOO_MUCK, MESS_ANGLE, MESS_SLIDE, MESS_SLUMP, MUCK_MAX, P } from '../config.js';
import { TYPE } from '../jobs.js';
import { pitTop } from '../pit.js';
import { dugTopY } from '../quarry.js';
import { boulderAlive, rockTopY } from '../rock.js';
import { SOLID, footing, solidNear } from '../route.js';
import { S, farm, floor, quarry } from '../state.js';
import { overPitMouth, rockLeft } from '../world.js';

// --- the layer -----------------------------------------------------------------------
// One layer, one depth per column, and each column's mess knows what kind it is.
// This is the whole of what lies on the ground: what is buried, what is in the
// way and what there is to shift are all read off it, so nothing anywhere can
// disagree with what you are looking at.
//
// Two kinds, and they are not the same job. What the sky drops is weather: it
// lands on everybody's yard and everybody clears it. What a body leaves is a
// body's own, and shovelling that is a post -- see `capOf`, and the janitor.
// That difference is one word in the table below and nothing else. It used to be
// two arrays with one set of operations written twice over them and the
// ownership rule spelt out by hand at each of the places that cared, which is
// how `muckFor` and `yardMuck` came to disagree about poop and send a quarrier
// up and down a ladder for as long as anybody watched.
//
// So: one row per kind, holding everything anybody asks about one. Add a row and
// it rains down, slumps, slides off loose ground, gets shovelled by whoever is
// allowed to shovel it and is counted in the yard's own account of itself,
// without a second copy of any of that.
//
//   theirs  somebody's own mess rather than the weather's, so only the body
//           whose post it is may shift it. See `mayShift`.
//
// The kind's name is also where it lives in the save, because a layer that is
// written down under a different name from the one it is asked about is exactly
// the sort of second copy this table exists to stop.
export const MESS = {
  muck: { theirs: false },
  poop: { theirs: true }
};

// In the order the world works them: the weather first, which is what falls
// first and what everybody clears.
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

// The two questions the rest of the game asks, still under their old names
// because they are still the right questions -- what has changed is that there
// is one place that answers them. They hand back the layer itself, so a check
// laying mess by hand writes to the same cells the yard reads.
export const muckCols = () => cols('muck');
export const poopCols = () => cols('poop');

// Whether a given pair of hands may shift a given kind. The whole of the
// ownership rule, asked of the kind rather than re-derived at every call site.
const mayShift = (hand, kind) => !MESS[kind].theirs || !!(hand && hand.type === TYPE.JANITOR);

// What this pair of hands may shift, in the order it works it: its own post
// first, since that is the job it was put on, and the weather after.
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

// Where the muck in a column sits: on the rock if the rock is there, on the floor
// of the quarry if that is, on the ground otherwise. It lies on top of what it
// landed on -- it does not sink into it and it does not float over it.
export function muckFloor(c) {
  const wx = c * P + P / 2;
  const r = rockCols();
  if (r && wx > r.from && wx < r.to) {
    const col = Math.round((wx - rockLeft()) / P);
    if (S.rockTops[col] >= 0) return rockTopY(col);
  }
  // Over the quarry it lands on the quarry's floor -- which is wherever that column has
  // actually been dug to, not the depth the hole will eventually reach. It was
  // the full depth, a fixed line a long way under the ground, so muck over the
  // quarry was drawn hanging at the bottom of a hole that had not been dug yet:
  // as the crew shifted it you watched it slide down through the ground, over
  // the top of everything, because the layer is painted after the world is.
  if (S.quarryOpen && wx > quarry.x && wx < quarry.x + quarry.w)
    return dugTopY(wx);
  // Over the hole it lands on the top of the pile, flush with it. `surfaceY` is
  // where the *next* grain down that column would come to rest, which is one
  // cell above the dust that is already there -- so a layer laid on that line
  // hung a cell over the pile with daylight under it. What muck lies on is the
  // top of the pile, and the top of the pile is one cell below where the next
  // grain would land.
  //
  // It used to land on the ground line, which over an open pit is thin air: a grey
  // lid sitting across the mouth with the hole visible underneath it. Muck lies
  // on top of what it fell on, everywhere, and the pit is not an exception just
  // because the top of it is lower than the ground.
  //
  // On the dust and not in it. Nothing about this counts against what the hole
  // holds -- muck is worth nothing and takes nothing -- it is a layer over the
  // top of the pile, in the way, like the layer over everything else.
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
    S.dirty = true;
  }
  return left;
}

export const throughRockMuck = n => clearRange(rockCols(), n);
export const throughQuarryMuck = n => clearRange(quarryCols(), n);
export const throughPlotMuck = n => clearRange(plotCols(), n);

// Muck put down rather than rained down. The crew make their own now -- see
// `relieve` in crew.js -- and it is the same stuff the sky drops, so the same
// shovelling clears it and no new kind of mess had to be invented.
//
// It refuses the columns a shovel cannot reach. `onSite` holds the rock, the quarry
// and the plots out of the sweep, so muck left standing on one of those would lie
// there for the rest of the run: a body about to go on a site holds on until it
// is somewhere the crew can clean up after it.
// The nearest ground to a place that a shovel can actually reach, or null if
// there is none near. A body standing on the rock is standing on ground that is
// held out of the sweep, so what it leaves goes on the bare yard a step away
// rather than on the rock -- it steps aside, the way anybody would.
export function cleanSpotNear(wx, reach = 90) {
  const m = muckCols();
  const at = solidNear(wx, reach);
  if (at == null) return null;
  const c = colAt(at);
  return c < 0 || c >= m.length ? null : c * P + P / 2;
}

// Where a body goes to stand to work a patch: the patch, if there is footing
// under it, and the nearest footing there is if not.
//
// This used to name the places. The rock was an exception ("a body clearing the
// face climbs up and shovels where the muck is"), the quarry and the plots were
// worked from the edge, and heaps were not thought about at all -- which is why
// a body sent to clear a mess on a full heap stood at the height of the ground
// in the middle of it, and read as walking through the bank rather than in front
// of it. Three answers to one question, and a fourth case nobody had answered.
//
// It is one question now, and `footing` answers it: can you stand here. The rock
// is solid, so the answer over the rock is yes and a body climbs it -- the old
// exception, arrived at rather than written down. A heap is loose and a mouth is
// nothing, so the answer over either is no and the body steps to the side. See
// route.js.
export const workSpot = wx => footing(wx) === SOLID ? wx : (solidNear(wx) ?? wx);

// Capped like everything else the sky drops. A column holds MUCK_MAX and no
// more, whoever put it there -- without that a body could bury a column deeper
// than a downpour ever would, and the crew would still be shovelling it long
// after the weather had been dealt with.
export function dropMuckAt(wx, n, kind = 'muck') {
  const at = cleanSpotNear(wx);
  if (at == null) return false;
  const m = cols(kind);
  const c = colAt(at);
  // A unit at a time, each into the lowest column nearby, which is what makes a
  // heap rather than a pillar.
  //
  // It used to go into one column and stack there until it hit MUCK_MAX -- so
  // what a body left behind was a tower of it in a single cell, standing
  // straight up out of flat ground like a chimney. Nothing else in this yard
  // behaves like that: dust falls where it falls and slumps sideways, and the
  // mess should read the same way, as something that was dropped and settled.
  for (let i = 0; i < n; i++) {
    let best = c, low = m[c] || 0;
    for (let d = 1; d <= MESS_SLUMP; d++) {
      for (const k of [c - d, c + d]) {
        if (k < 0 || k >= m.length) continue;
        const h = m[k] || 0;
        // Strictly lower, so it fills the dip beside the heap before it starts a
        // new one further out -- and the nearer of two equal columns wins,
        // because the loop reaches them in that order.
        if (h < low) { low = h; best = k; }
      }
    }
    if (low >= MUCK_MAX) break;                // nowhere near here has room
    m[best] = Math.min(MUCK_MAX, (m[best] || 0) + 1);
  }
  S.dirty = true;
  return true;
}

// One pass of the mess settling: a column standing more than a step above its
// neighbour topples a unit into it. Sand does this every frame -- see `settle` in
// grid.js -- and the mess is drawn out of the same cells, so it should stand at
// the same angle.
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

// Mess that has ended up on ground that will not hold it, sliding to ground that
// will. `dropMuckAt` already puts what falls on solid footing, so nothing lands
// on a bank -- but a bank grows. Tip a load onto a heap that a rain has already
// dirtied and the mess is suddenly halfway up a slope of loose dust, where
// nobody can stand to shovel it; leave it there and it is a mess that can never
// be cleared, on ground nobody can reach.
//
// So it slides, the same way the mess already topples off its own slopes one
// step above. It is the settling rule applied to a second kind of slope: loose
// dust is a surface nothing rests on, and this is what "nothing rests on it"
// looks like a frame at a time.
//
// One column a pass. This runs every frame, the slide is only ever a few cells,
// and a loop that walked the whole yard looking for solid ground for every dirty
// column would be the most expensive thing in the file.
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
      S.dirty = true;
      return;                       // one column a pass; the rest follow it down
    }
  }
}

// The rest of it, shifted from wherever the body doing the shifting is standing,
// so a gang spread along the yard clears the yard rather than all of them
// working the same column.
//
// A shovel reaches on to a site, and it always should have. `onSite` was in this
// loop, so muck that came down on the rock, the quarry or the plots was not
// something anybody could clear: it was worked off by mining through it, and a
// rock nobody was swinging at -- a full pile, a crew with no rock hands on it, the
// gap between one rock and the next -- kept whatever the sky left on it for the
// rest of the run. A body cannot *stand* on a site, which is a different rule
// and is kept where it belongs, in `cleanSpotNear`: it stands on the ground
// beside the thing and works across it.
// Whole cells, and that is the point of `hand`.
//
// Effort arrives a sixtieth of a second at a time -- three and a half cells a
// second is a twentieth of a cell a frame -- and taking that fraction off the
// column drew a layer sinking smoothly into the ground. Nothing else in this
// yard moves like that: the rock comes off a cell at a time, the pile fills a
// grain at a time, and a shovel takes a shovelful. So the fraction is kept in
// the hand doing the shovelling until it is worth a whole cell, and then a whole
// cell goes.
//
// The carry is capped at one. Without that, a body walking a long way to a patch
// arrives with several seconds of effort saved up and takes a trench out of it
// on the first frame.
export function sweepMuckAt(wx, n, hand) {
  // What this pair of hands may shift, and in what order -- a janitor clears
  // both stacks and takes what a body left first, since that is the job it was
  // put on, and everybody else clears the weather and steps over the rest. The
  // rule is not written here: it is read off the kinds. See `shiftable`.
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
        S.dirty = true;
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
// How much mess is out there, and how much of it is on ground a shovel can be
// swung on. Every body in the crew asks on every frame, and the honest answer is
// a walk over every column in the world asking `onSite` about each -- which asks
// the footing, which builds the ways. Done per body per frame that is a yard
// that stutters for the sake of a number that cannot have changed since the body
// before it asked.
//
// So it is worked out once a frame. Not by a `refresh()` somebody has to
// remember to call at the right moment and null at the right moment -- that is a
// cache whose lifetime nobody can see, and it left `siteAt` sitting here for
// months, assigned on every frame and read by nothing. It is a memo, keyed on
// the things it is an answer about: the frame, and the layer's own arrays. A new
// frame, or a layer rebuilt under it by a reseeding or a wider world, and the
// walk happens again; anything else reads the answer. Nothing has to be told.
//
// Frame-grained on purpose. The crew are stepped before the sky is, so every
// body in a pass has always seen the same figure, and a number that moved under
// the crew mid-pass would mean the first body to ask cleared the mess out from
// under the sixth.
let tallied = null;

// Forget the frame's tally. The memo invalidates itself on a new frame and on
// the arrays being replaced -- but a hand reaching in BETWEEN frames and
// rewriting the cells in place (the __muckSet/__poopSet hooks are the hands)
// changes the world without changing either key, and every reader until the
// next tick gets the old answer. The hook calls this; nothing in play needs to.
export const retally = () => { tallied = null; };

function tally() {
  const stacks = KINDS.map(k => cols(k));
  if (tallied && tallied.tick === S.tick && stacks.every((s, i) => s === tallied.stacks[i]))
    return tallied;
  // Per kind, and the same sum again over only the ground a body can work --
  // which is the pair of numbers `muckFor` and `yardMuckFor` are two ranges of.
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
  // Once the yard has been left in a state it has been: the row that sells the
  // shed hangs off this, and a row that appeared and then vanished again because
  // somebody happened to tidy up would be the game changing its mind. What
  // counts towards it is what the crew left, asked of the kinds rather than
  // named here.
  const theirs = KINDS.reduce((n, k) => (MESS[k].theirs ? n + by[k] : n), 0);
  if (theirs >= LOO_MUCK * 5) S.seenMess = true;
  return (tallied = { tick: S.tick, stacks, all, yard, by, yardBy });
}

// Ground a shovel cannot be swung on, because there is nowhere to stand. It is
// asked of the footing rather than of a list of buildings, so what is held out
// is exactly what cannot be worked: the two mouths, and the plots, which are
// loose in the sense that matters here -- you would be treading on the crop.
//
// The rock is no longer on this list and that is the point. It is solid ground
// that happens to be uphill, so a mess on it is a mess like any other and
// whoever is nearest goes and clears it. It used to be held out here and then
// let back in by a special case in `workSpot`, which is two rules cancelling.
function onSite(c) {
  const x = c * P + P / 2;
  if (footing(x) !== SOLID) return true;
  const p = plotCols();
  return !!p && inRange(c, p.from, p.to);
}

// How much ground a body shovelling claims either side of itself, in columns: a
// body is three cells wide, so this keeps the next one clear of its elbows.
export const MUCK_ELBOW = 4;

// The nearest loose muck to a place, as a world x, or null if the yard is clear.
// Somebody has to walk to it: shovelling from wherever you happen to be standing
// is the sort of thing that makes a crew look like a spreadsheet.
// `taken` is the set of columns somebody else is already walking to. One patch,
// one body -- the same rule the dust has, and for the same reason: without it
// every body in the yard works out the same nearest answer, walks to the same
// cell, and the crew clears a mess as one lump you cannot count. A yard of muck
// is the one job the whole crew drops everything for, so it is the job where
// they bunch up worst.
//
// The claim is a column rather than a body, so a patch two cells wide takes two
// of them and the third goes and finds its own.
// Is there still anything to shift in this column? A claim is held until the
// column it names is clear, so this is what tells a body it is done with it.
export function muckAtCol(c) {
  return c >= 0 && c < floor.cols ? messAt(c) : 0;
}

// A stable number out of who this body is (wave7-sky, A3). The gang used to
// space themselves at exactly MUCK_ELBOW along a heap, because every claim
// scanned from the same place and reserved the same stride -- a picket line,
// not a crew. Each body's jitter and stride come off a hash of its name, so
// they are the same every frame (a per-frame rand() would send the body to a
// different patch each frame, which is a body that never settles) and different
// per body, which is all the irregularity a crowd needs.
const handHash = hand => {
  const s = String((hand && (hand.name || hand.type)) || '');
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
};

export function nearestMuck(wx, taken, hand) {
  // What this pair of hands is allowed to shift. Weather is everybody's; what a
  // body left is the janitor's -- so a hauler walking to the nearest mess must
  // not be sent to a column that is nothing but the other kind, or it walks
  // there, finds nothing it may touch, and stands over it. The rule is the
  // kinds' own -- see `shiftable` -- so a claim can never be made on ground the
  // shovel would then refuse.
  const mine = shiftable(hand).map(k => cols(k));
  // And what this pair of hands can stand on. Muck really does lie over the
  // mouth of the pit -- `muckTop` sends it down to `pitTop` -- but the only body
  // with any business down there is a hauler, and it is the only one whose
  // branch routes down a ladder for it. Every
  // other trade claimed the column through here, walked to it, and then stood at
  // `walkY`: the ground line, with the dust it was shovelling several hundred
  // pixels below its feet. That is the reported "some workers are walking
  // through the air over the pit", and the reason some behaved is that those
  // ones were haulers.
  //
  // The gate belongs here rather than at the five call sites of `takeMuck`,
  // because here is where a claim is made and all five of them claim through it.
  // It tests `overPitMouth`, the same predicate the hauler's own pit branch
  // tests, so the two sides cannot drift apart.
  // A hauler -- and a janitor. The gate was written when the hauler's own pit
  // branch was the only way down; a mess is reached by route now, and the hole
  // is on the ways like everywhere else. What kept the janitor out was only
  // this line -- and poop is the one mess nobody else may shift, so what a body
  // left on the pile (bodies work down there, and cross it) lay in the hole for
  // the rest of the run with the janitor loitering at its shed: barred here,
  // while every hauler that could walk to it was barred by `shiftable`.
  const canDescend = hand && (hand.type === TYPE.HAUL || hand.type === TYPE.JANITOR);
  const m = muckCols();
  const here = c => { let n = 0; for (const s of mine) n += s[c] || 0; return n; };
  // Where the scan starts and how much ground a claim reserves are this body's
  // own (wave7-sky, A3): the jitter shifts its idea of "nearest" a few columns
  // one way, the stride varies its elbow room a little, and between them a gang
  // on one heap stands at uneven gaps instead of on a picket line. The claim
  // itself is untouched -- one column, one body, checked against `taken` the
  // same as ever -- so nothing about the reservation is loosened.
  const h = handHash(hand);
  const jitter = h % (MUCK_ELBOW * 2 + 1) - MUCK_ELBOW;
  const stride = MUCK_ELBOW - 1 + ((h >> 3) % 4);      // ELBOW-1 .. ELBOW+2
  const home = colAt(wx) + jitter;
  for (let d = 0; d < m.length; d++) {
    for (const c of (d ? [home - d, home + d] : [home])) {
      if (c < 0 || c >= m.length || !here(c)) continue;
      if (!canDescend && overPitMouth(c * P + P / 2)) continue;
      if (taken && taken.has(c)) continue;
      // A claim is a stretch, not a cell. Columns are six pixels and a body is
      // eighteen wide, so reserving the one cell somebody is shovelling puts the
      // next body one cell over -- close enough that it never has to walk, and
      // the two of them stand in each other for the whole clear-up. Reserving a
      // body's width either side is what actually sends the next one elsewhere.
      if (taken) for (let k = c - stride; k <= c + stride; k++) taken.add(k);
      return c * P + P / 2;
    }
  }
  // Everything within reach is spoken for -- so there is nothing here for THIS
  // pair of hands, and it says so.
  //
  // There used to be a second pass here that handed out the nearest patch
  // anyway, on the argument that two on one patch beats one doing nothing. What
  // that actually bought was the end of every clear-up: three bodies granted
  // the same last cell, standing in each other and jostling over one shovelful.
  // The dust system answers the same moment the other way -- a hauler with
  // nothing left to claim rests and asks again next frame -- and a claim frees
  // the instant its column is clear, so the wait is a beat, not a stall. One
  // patch, one body, to the very last cell.
  return null;
}

export const muckLeft = () => tally().all;
// how much of it is what a body left, which is the janitor's alone
export const poopLeft = () => tally().by.poop;
// and what a given pair of hands may actually shift, which is the number that
// decides whether it is worth walking over there
//
// One rule, asked at two ranges. What a body may shift is: everything, if it is
// a janitor; everything but what other bodies left, otherwise. That sentence is
// written once, in `mineToShift`, and the two questions that need it differ only
// in how far they look.
//
// They used to be written twice and they disagreed. `muckFor` took the poop out
// and `yardMuck` left it in, so with no outhouse up -- where poop accumulates
// and nothing ever clears it -- a quarrier standing in a full cut was told by
// `yardMuck` that there was work up top and told by `muckFor`, the moment it got
// there, that there was none. It climbed out, was refused a shovel, climbed back
// in, and did that for as long as you watched. That is the reported "quarry
// workers are getting stuck on the ladder": not a ladder fault at all, but two
// spellings of one question.
//
// And it is not written at all any more, in the sense of being a subtraction
// somebody chose: it is the sum of the kinds this pair of hands may shift, which
// is the same sentence `sweepMuckAt` and `nearestMuck` work from. Add a kind to
// `MESS` and all three of them count it or hold it back on the strength of one
// word in the table.
const mineToShift = (w, sums) => shiftable(w).reduce((n, k) => n + sums[k], 0);
export const muckFor = w => mineToShift(w, tally().by);
// the same question, asked only of the ground that is not a site
export const yardMuckFor = w => mineToShift(w, tally().yardBy);
// the raw number, for the yard's own account of itself -- a report wants what is
// out there, not what one pair of hands is allowed to touch
export const yardMuck = () => tally().yard;
export const buried = () => rockMuck() > 0 || quarryMuck() > 0 || plotMuck() > 0;
