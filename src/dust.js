// Dust in the air: what comes off the rock, and how it gets to the ground.
//
// Nothing here knows what a worker is or what the shop sells. A chip is a shade,
// a place and a velocity, and it stops being one when it lands.

import { P, GRAV, WORKER } from './config.js';
import { rockEdge, pileOf } from './world.js';
import { S, floor, pit } from './state.js';
import { defineMachine, machine } from './machines.js';
import { at, put, colOf, bottomY } from './grid.js';
import { scoopMs, haulCap } from './upgrades.js';
import { pitFull, pitRefuses } from './pit.js';
import { rand } from './rng.js';
import { JOB, TYPE } from './jobs.js';
import { shockAt } from './shock.js';       // F4: the ring a crit throws

// roughly normal, in about -1.5..1.5, most of it near nothing
export const bell = () => rand() + rand() + rand() - 1.5;

// `land` is where an aimed chip is meant to come down. A chip without one comes
// down wherever it meets the ground, which is what a swept or spilled grain does.
export function spawnChip(x, y, vx, vy, shade = 1, land = null) {
  S.chips.push({ x, y, vx, vy, s: shade, land });
}

// A rockhand tosses its spoil onto the heap. It is a person throwing, the same as a
// quarrier putting a seam up over the rim or a hauler tipping a load into the
// hole -- somebody with a shovel and somewhere to put what is on it.
//
// This was aimed once, then not, and now is again, and the difference matters.
// What was wrong before was that *the rock* posted its spoil: every grain picked
// a spot before it had left the face, so the heap was a destination rather than
// somewhere dust ended up, and nothing ever landed anywhere awkward because
// nothing was allowed to. What was wrong with letting it simply fall is that a
// rock has two sides and only one of them is the yard: half the spoil came off
// the back of the hill, where the crew, the bench and the hole are not, and lay
// there in a layer nobody had a reason to walk to.
//
// So the rockhand throws, and where it throws is the heap that belongs to the rock.
// The arc is the same one everything else in this yard is thrown on.
// `key` is whose heap it is going on. A farmhand tosses a spore onto the farm's
// heap, not across the yard onto the rock's -- each place has its own strip of
// ground and throws onto it.
export function spawnSpoil(px, py, shade, key = 'rock') {
  const p = pileOf(key);
  const near = p ? p.from : rockEdge(1);
  const far = p ? Math.max(near + P, p.to - P * 2) : near + P * 24;
  // most of it near the rock end of the heap, tailing away out along it, which
  // is the shape a heap somebody is throwing onto actually takes
  const land = Math.min(far, near + P * 2 + Math.abs(bell()) * (far - near) * 0.45);
  const v = aim(px, py, land, P);
  spawnChip(px, py, v.vx, v.vy, shade, land);
}

// A crit throws its spoil up as a fountain instead of tossing it onto the heap.
// It is the same payload -- the very grains the work turned up -- aimed up on a
// taller arc than anything else in the yard and fanned out across the heap as it
// falls, so it lands and banks like any other dust (there is no parallel settle
// path, and there must not be: the pile is the dust). A grain is flagged so the
// draw loop can swell it through the top of its arc, and carries the speed it
// left at (`cv`) as the reference for that swell and the crit's power (`cp`) so a
// harder crit blooms fatter. See `critToss` callers at the rock, the cut and the
// farm, and the swell in render.js.
//
// `power` is the crit's multiplier: a harder crit throws higher, so it hangs
// longer near its slow apex, so it reads as both higher and fatter for nothing.
// The arc reuses `aim` with a `rise`, which already knows how to climb out of a
// hole -- a shard thrown off the floor of the cut clears the rim the same way a
// quarrier's ordinary toss does, just higher.
export function critToss(px, py, shade, key = 'rock', power = 3) {
  const p = pileOf(key);
  const near = p ? p.from : rockEdge(1);
  const far = p ? Math.max(near + P, p.to - P * 2) : near + P * 24;
  // Fanned across the whole width of the heap rather than tailing off along it:
  // a fountain spreads into a bell on the way down, so where each grain comes
  // down is spread evenly rather than piled near the work.
  const land = near + rand() * (far - near);
  // A peak well above the ground line -- taller than spoil's own pop -- and
  // taller again with the crit's power. `bell` gives the column its ragged top.
  const rise = P * (16 + 6 * power) + Math.abs(bell()) * P * 5;
  const v = aim(px, py, land, P, rise);
  spawnChip(px, py, v.vx, v.vy, shade, land);
  const ch = S.chips[S.chips.length - 1];
  ch.crit = true;
  ch.cv = Math.abs(v.vy) || 1;   // launch |vy|: the fastest it moves, the swell's floor
  ch.cp = power;
  // And the blow itself: a ring going out and a scatter of specks, which are not
  // dust and are not counted -- see shock.js. Asked for once per grain, because
  // this is called once per grain; `shockAt` keeps one shock per blow -- one
  // frame at one place of work -- rather than the caller having to know it is in
  // a loop.
  shockAt(px, py, power, key);
}

// The one arc from here to there: the pop is sized to the distance, and the
// sideways speed follows from how long that pop keeps it in the air.
//
// It also works from *below* where it is going, which is what the quarry needs:
// thrown off the floor of an open cut, the pop has to lift it over the rim
// before any of the rest applies. That is one number, not another throw.
//
// `rise`, when given, replaces the distance-sized pop with one sized to reach
// exactly that height above the ground line before it starts down again --
// see B3 in wave-feedback3.md, where a core lobbed off the lip wants a
// particular peak (about ninety world pixels) rather than whatever a chip's
// own travel distance would have picked.
export function aim(x, y, land, size, rise = null) {
  const target = S.groundY - size;                     // the line it comes down to
  const climb = Math.max(0, y - target);               // how far up before any of that
  const pop = rise != null
    ? Math.sqrt(2 * GRAV * Math.max(P, rise - (S.groundY - y)))
    : Math.max(2 + Math.min(4.5, Math.abs(land - x) / 90),
               Math.sqrt(2 * GRAV * (climb + P * 8)));
  const t = (pop + Math.sqrt(Math.max(0, pop * pop + 2 * GRAV * (target - y)))) / GRAV;
  return { vx: (land - x) / t, vy: -pop };
}



// --- the belt -------------------------------------------------------------------
// From the rock to the hole, and the one machine that changes the yard's traffic
// rather than a station's rate.
//
// It does not work a face. What it works is the *ground between* the rock and
// the lip: it picks loose dust off the floor a grain at a time and puts it in
// the hole, which is the whole of what a hauler does, minus the walking. That is
// why it has no site of its own and stands along the run instead.
//
// Its tender stands at the lip, where the haulers already gather.
//
// Three x's, and they are three different things, which is why they are three
// functions rather than one with arithmetic done on it at each call site:
//
//   `beltFrom`  the tail, out by the rock, where the run starts.
//   `beltTo`    the head, which **overhangs the mouth of the hole**. A belt that
//               stopped short of the lip would need the last two cells thrown,
//               and a load thrown off the end of a conveyor is the bouncing this
//               replaced. It runs out over the hole and the load falls off it.
//   `beltPost`  where the tender stands, which is on the near lip and nowhere
//               near the head: the head is out over open air.
//   `beltReach` the last ground it sweeps -- the near lip, not the head, since
//               there is no ground under the head to pick anything off.
export const beltFrom = () => Math.round((S.cx + P * 6) / P) * P;
export const beltTo = () => Math.round((pit.x + P * 4) / P) * P;
export const beltReach = () => Math.round((pit.x - P * 2) / P) * P;
export const beltPost = () => beltReach() - WORKER - P;
export const beltY = () => S.groundY - P * 5;

// How fast the band runs, in world pixels a frame at sixty. Fast enough that a
// load is plainly travelling rather than creeping, slow enough that you can
// watch one go the length of the yard.
export const BELT_PACE = P * 0.9;
// And how fast the scoop lifts one out of the ground onto it. Quicker than the
// band, because the climb is a couple of cells and the run is the whole yard.
const BELT_LIFT = P * 0.7;

// --- what is riding it ----------------------------------------------------------
// A load is a grain and where it has got to: `{ x, y, s }`. It is **not a chip**,
// and that is the whole of this feature. A chip is a thing in the air with a
// velocity, thrown once and then left to gravity; a load is a thing being
// carried, and where it goes next is decided by the machine every frame.
//
// It used to be a chip: the bite threw the grain the whole length of the yard in
// one arc, over the top of a belt it never touched, and what you saw running
// along the band was a white pattern painted on it. The belt was scenery with a
// catapult behind it.
//
// A load has two legs and they are the same two lines of code. It is lifted --
// the scoop takes it out of wherever it lay and puts it on the band, which is a
// *climb* and not a throw, because the heap between the rock and the hole is
// routinely deeper than the belt is tall and a grain tossed at the band from
// inside a heap lands back on the heap. Then it rides, and the ride is the belt
// doing its job.
//
// It is not saved. Neither are the chips (see `restore`), and for the same
// reason: what is in the air at the moment you close the tab is a frame's worth
// of dust, and a save format that carried it would be carrying it for ever.
export const bandY = () => beltY() - P;       // where a load sits: on top of the band

// A grain leaves the ground and is on the machine from this moment. Wherever it
// lay -- buried in a heap, or up on top of one well above the band -- the scoop
// takes it to the band, down as readily as up.
export function loadBelt(x, y, shade) {
  S.belt.push({ x, y, s: shade });
  S.dirty = true;
}

// Whether the band is actually running: bought, switched on, and with somebody
// standing at it this moment. `mannedAt` is stamped by `stepMachines`, which is
// the one place that knows. Both the ride and the catch ask this, because a
// stopped band must neither move what is on it nor take anything new.
export function beltRunning(now) {
  const m = machine('belt');
  return !!(m && m.bought && now - (m.mannedAt || 0) <= 250);
}

// --- landing on it ---------------------------------------------------------------
// The band is a **surface**. Anything thrown across it comes down on it and is
// carried, exactly the way anything thrown across the ground comes down on the
// ground -- which means the rock's spoil goes straight onto the belt from the
// rockhand's shovel and never touches the yard at all.
//
// That is the whole point of a belt from the rock to the hole, and without it
// the machine was doing the job the long way round: every grain fell to the
// floor, sat there, and was then picked back up and lifted five cells to a band
// that had been directly over it the whole time. The scoop is still there and
// still needed -- there is dust lying about the yard from before the belt was
// bought, and dust that misses it -- but it is the exception now rather than the
// only way on.
//
// `f` is the frame, so the crossing can be tested exactly: a chip lands on the
// band when its underside reaches the band's top having been above it a frame
// ago. Tested that way rather than against a tolerance, because a fast chip
// covers more than a cell in a frame and a slow one covers a fraction of it, and
// any fixed band of slack is wrong for one of them.
export function catchBelt(ch, now, f) {
  if (ch.vy <= 0) return false;                       // still going up: it has landed on nothing
  if (!beltRunning(now)) return false;
  // A full hole stops the band (see `stepBelt`), and a stopped band takes
  // nothing new: without this the ram's spoil landed on it, rode to the head,
  // was handed back out of the brim onto the ground, and rode again -- a loop
  // that ran for as long as the hole stayed full. Refused here, the spoil falls
  // through to the rock's own pile, and the pile filling is what stands the ram
  // down: the same mark that stops every other machine.
  if (pitRefuses()) return false;
  const y = beltY();
  const under = ch.y + P, was = under - ch.vy * f;
  if (was > y || under < y) return false;             // did not cross the band this frame
  if (ch.x + P <= beltFrom() || ch.x >= beltReach()) return false;
  // And not over another station's strip. The same rule the bite keeps, for the
  // same reason: the cut's stone and the farm's crop are carried by hand to
  // their own piles and belong there, and a belt that took them out of the air
  // over those piles would be stealing rather than hauling.
  const c = colOf(floor, ch.x);
  const reg = floor.region ? floor.region(c) : null;
  if (reg !== null && reg !== 'rock') return false;
  S.belt.push({ x: ch.x, y: bandY(), s: ch.s });
  S.dirty = true;
  return true;
}

// One frame of the band. It runs while the belt is on and manned -- `mannedAt`
// is stamped by `stepMachines`, which is the one place that knows whether
// anybody is standing at it -- so a belt whose tender wanders off stops with its
// load still on it, which is the rule every other machine keeps.
//
// It is not gated on the machine having *bitten* this frame: the ground goes
// clean long before the last load reaches the hole, and a band that stopped when
// there was nothing left to pick up would leave a row of grains hanging in the
// air over the yard.
export function stepBelt(now, f) {
  if (!S.belt || !S.belt.length) return;
  if (!beltRunning(now)) return;
  // Nowhere to put anything down: the band stands still with its loads on it,
  // exactly as it does when its tender walks off. `ready` already refuses new
  // bites on a full hole; this is the other half, without which the loads
  // already riding were tipped into a hole that handed every one straight back.
  if (pitRefuses()) return;
  const top = bandY(), head = beltTo();
  for (let i = S.belt.length - 1; i >= 0; i--) {
    const b = S.belt[i];
    if (b.y !== top) {
      // Still on the scoop. It creeps forward while it climbs, so the lift reads
      // as a machine taking it up onto the band rather than a grain levitating.
      const d = top - b.y;
      b.y += Math.sign(d) * Math.min(BELT_LIFT * f, Math.abs(d));
      b.x += BELT_PACE * 0.35 * f;
      continue;
    }
    b.x += BELT_PACE * f;
    if (b.x < head) continue;
    // Off the end of the head, which is out over the mouth of the hole: it
    // drops, carrying the band's speed forward with it, and the chip loop puts
    // it in the hole exactly as it does everything else thrown at that hole.
    S.belt.splice(i, 1);
    spawnChip(b.x, b.y, BELT_PACE, 0, b.s);
  }
  S.dirty = true;
}

defineMachine('belt', {
  job: JOB.HAUL,
  type: TYPE.HAUL,
  at: beltFrom,
  y: beltY,
  // The ground the machine covers, tail to reach, for anything that has to
  // point at the belt as a whole rather than at one end of it -- the build
  // bar hangs over the middle of this. See `siteBox` in works.js.
  box: () => ({ x: beltFrom(), w: beltReach() - beltFrom() }),
  tendAt: beltPost,
  // At the lip end, over the last leg that has ground under it -- not at the
  // head, which hangs out over the hole.
  stack: () => ({ x: beltPost(), y: beltY() - P * 3 }),
  // A grain moved takes the same time a hauler's scoop does, divided by what the
  // belt is worth. `scoopMs` carries the lip's own ladders, so everything bought
  // for carrying still applies to the machine that replaced it.
  ms: rate => scoopMs() / Math.max(0.01, rate),
  ready: () => !pitRefuses(),
  // A beat lifts a *load*, not a grain: `haulCap()` of them, the same number a
  // carter carries in one trip, because the belt is the whole of what a hauler
  // does minus the walking and a hauler does not carry one grain. It was one a
  // beat, and at the beats cap every machine shares that pinned the band at
  // eight grains a frame against the ram's forty-eight cells -- a deficit no
  // rung of either ladder could close, so the rock's strip filled, the ram
  // stood down, the band cleared a handful, and the ram refilled it in two
  // frames. The unit comes off the carry ladder the belt already sits beside
  // on the board rather than being a number of its own.
  //
  // `n` beats' worth in one walk of the run, answered in beats.
  bite: (tender, n = 1) => {
    // The nearest loose grains along the run. Never out of a station's strip:
    // those heaps belong to their stations and are carried by hand -- the belt
    // is for what is lying on the open ground between the rock and the hole,
    // which is where the rock's spoil lands and where a machine's output piles
    // up while it waits for somebody.
    const from = beltFrom(), to = beltReach();
    const c0 = colOf(floor, from), c1 = colOf(floor, to);
    const load = Math.max(1, haulCap());
    let want = Math.max(1, Math.floor(n)) * load, got = 0;
    for (let c = c0; c <= c1 && got < want; c++) {
      // The rock's own spoil and the bare ground between here and the lip. Not
      // another station's heap: the cut's stone and the farm's crop are carried
      // by hand to their own piles and belong there, and a belt that swept them
      // into the hole would be stealing rather than hauling.
      //
      // The rock's *is* fair game, and is most of the point: it is what the ram
      // buries the yard in, and it is the pile the haulers were built to empty.
      const reg = floor.region ? floor.region(c) : null;
      if (reg !== null && reg !== 'rock') continue;
      for (let r = floor.rows - 1; r >= 0 && got < want; r--) {
        const v = at(floor, c, r);
        if (!v) continue;
        put(floor, c, r, 0);
        // Onto the band above where it lay, and then it *rides*. It used to be
        // thrown the whole way to the hole in one arc, which is a machine that
        // lobs -- the belt was scenery with a catapult behind it, and the load
        // you saw moving along the band was a white pattern painted on it. Now
        // the pattern is the band and the grains on it are the grains: the scoop
        // tosses one up, it comes down on the belt, and the belt carries it out
        // over the hole and drops it in. See `loadBelt` and `stepBelt`.
        const x = floor.x + c * P;
        const y = bottomY(floor) - (r + 1) * P;
        loadBelt(x, y, v);
        if (tender) tender.stored = (tender.stored || 0) + 1;
        got++;
      }
    }
    if (!got) return 0;
    S.dirty = true;
    return got / load;
  }
});
