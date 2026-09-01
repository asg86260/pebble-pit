// The rules the yard keeps, checked on the frame they are broken.
//
// Everything in this file was already checked somewhere, and every one of those
// checks was a *watcher*: a group that built a busy yard, ran it for thirty or
// forty simulated seconds a sixtieth at a time, looked at every body on every
// frame, and reported at the end that something had gone through a wall. They
// work, and they cost more than everything else in the suite put together.
// Worse, they are only ever as good as the yard they happened to build -- a rule
// broken by a state the watcher's own scenario never reaches is a rule nobody
// checks, and there is no way to tell from a green run which of those you have.
//
// So the watching moves into the game. `verifyWorld` is the same set of
// questions asked once, from the inside, after a frame has been stepped -- and
// `fast` in hooks.js calls it after every frame when the flag is on, which under
// test is always. Every group in the node tier is now a watcher for every rule
// here, whatever it was written to look at: the janitor group watches the
// ladder, the pit group watches the books, the sky groups watch the roster.
// Nobody had to write that down. The scenario a group builds is the input, and
// the rules are checked against whatever it builds.
//
// Three things follow, and they are the whole reason this exists:
//
//   **A failure names the frame.** A watcher says "somebody left the cut through
//   the wall at some point in the last twelve seconds". This says which frame,
//   which body, and by how much -- because it throws on the frame it happened
//   rather than counting up violations and reporting at the end.
//
//   **A failure can be had again.** The message carries the seed (see rng.js).
//   The run that broke is the run you can start over.
//
//   **The watchers can go.** A sampling loop whose predicate is one of the rules
//   below is now double work. Several of them have been cut back to the scenario
//   that generated the interesting yard, with the watching taken out.
//
// What it must not be is expensive. It runs on every simulated frame of every
// check, so it is O(bodies + jobs) and nothing else: one `ways()` for the whole
// crew rather than one each, no walk of the grids, and the one question that
// genuinely needs sixty thousand cells counted is asked once a second instead of
// sixty times (see `LEDGER_EVERY`).
//
// It is debug-only and off by default. Play never calls it -- nothing in main.js
// reaches the flag -- so a rule added here costs a player nothing.

import { WORKER } from './config.js';
import { S, pit, floor, cut } from './state.js';
import { P } from './config.js';
import { ways, wayAt, WORKINGS } from './route.js';
import { KIT, KIT_JOBS, TRADE_OF, JOB_OF, stockOf } from './kit.js';
import { count } from './grid.js';
import { yardLeft } from './world.js';
import { seed } from './rng.js';

// The jobs the roster is made of, and the count on S that owns each. This is the
// same list `syncWorkers` builds the crew from, and it has to be: a job missing
// from one of them is a job with a count and no bodies, which is the failure
// rule 4 is here to catch.
const ROSTER_COUNTS = { miner: 'miners', hauler: 'haulers', quarrier: 'quarriers',
                        farmhand: 'farmhands', labber: 'labbers',
                        scrubber: 'scrubbers', rifter: 'rifters',
                        janitor: 'janitors', wizard: 'wizards' };

// How far below the surface of the way it is on a body may be, and for how long.
//
// The depth cannot be zero, because a body's feet do not follow the ground
// instantly: they ease up to it, fourteen per cent of what is left every frame
// (`climbTo` in crew.js). Meet a sheer step in a mined hill and the body is
// legitimately inside it for the length of the climb out. A body and a half is
// the size of an ordinary one of those.
//
// And the depth alone still says nothing, which is what the first draft of this
// rule got wrong: checked on the frame, it fired on eleven groups in the quick
// tier, every one of them a miner part way up a step it was already climbing.
// What is actually wrong is a body that is inside the hill and *stays* there.
// Fourteen per cent a frame takes the worst lag seen -- ninety-one pixels, at a
// step the gang had just cut -- back under the mark in eight frames, so a body
// still buried a whole second later is not climbing, it is standing in the rock.
const BURIED = WORKER * 1.5;
const BURIED_FRAMES = 60;

// How long each body has been under the surface, if it is. A WeakMap rather
// than a field on the body: a body is a saved, cloned, snapshotted thing and a
// debug counter has no business travelling with it, and one that did would have
// to be remembered by every path that makes a body.
const sunkSince = new WeakMap();

// The *lowest* thing under a body, rather than the highest.
//
// `standTop` -- the highest surface under any part of a body's three cells -- is
// where a body walking a slope belongs, and most of the yard puts a body there.
// The gang on the rock do not: a miner stands on the column it is hitting (see
// `rockTopY(colAtX(...))` in the miner's branch), because a body working a face
// stands on the face and not on the step behind it. Both are right, and on a
// stepped hill they are a step apart -- so measuring burial against the higher
// of them calls every working miner buried, which is what the first draft of
// this file did to four groups in the tier.
//
// So the question asked is the one both rules agree on: is the body below *even
// the lowest* of the columns it is standing across? Above that and it is on one
// of them, whichever rule put it there. Below it and there is nothing under any
// part of it at all, which is the only thing "buried" can honestly mean.
function deepest(leftX, at) {
  let low = -Infinity;
  for (let x = leftX; x < leftX + WORKER; x += P) low = Math.max(low, at(x));
  return Math.max(low, at(leftX + WORKER - 1));
}

// What a station has owned since the last time its books were level.
//
// `worn <= hats` is not quite an invariant, and the reason is that hats can be
// taken *away* from a station while they are still on heads. A machine spends
// them (see `buy` in machines.js), the school's count can be set back by a dev
// hook, a save from another shape of the game arrives that way, and a station
// whose kit is a stock rather than a purchase loses the lot the moment the
// building is shut (`__loo(false)`, and the caps are on two heads). In all of them
// the bodies then walk over and hand the kit in -- `stepKit` reasserts it -- and
// for the length of those walks the station is legitimately over.
//
// What is never legitimate is the bug the kit table was built to end: one hat
// counted on two heads, because `worn` was read off the job a body was doing
// rather than off the hat it was wearing. That one shows up as a station with
// more kit worn than it has *ever* owned, and this is the mark that says so.
//
// It comes back down as soon as the books are level, so it is not a ratchet that
// forgives everything after one busy moment: the frame the last stray hat is
// handed in, the mark is the count again.
const everOwned = new Map();

// How far outside the world a body may be. The yard has soft edges -- a station
// puts its stand a little past the leftmost pile, a throw clears the far wall --
// so this is not a fence, it is a check that a position is still a position.
// The failure it catches is a body that has left for the horizon, which is what
// a NaN or a runaway step looks like once it has been going for a frame or two.
const OUTSIDE = WORKER * 8;

// The ledgers are the one rule here that cannot be answered without walking the
// cells, and the pit is sixty thousand of them and the yard floor twice that.
// Asked every frame it would cost more than the frame does. So it is asked once
// a second, which is soon enough:
// `put` is the only thing that moves the count, a `put` that does not is a bug
// in `put` and not in a caller, and a bug in `put` is wrong on every frame after
// the first rather than on one unlucky one.
const LEDGER_EVERY = 60;

// What went wrong, where in the run, and how to have the run again.
//
// The seed matters more than anything else in this string. A failure from a
// forty-second yard used to be a report you read and could not act on; with the
// seed and the frame it is a place you can stand.
function fail(rule, detail) {
  throw new Error(`${rule}: ${detail}  [frame ${S.tick}, seed ${seed()}]`);
}

const who = w => `${w.name || w.type} (${w.type}) at ${Math.round(w.x)},${Math.round(w.y)}`;

// Forget what the last yard did. The two things kept between frames are about
// *this* run of the world, and a new game is a new world: a station's high-water
// mark from the group before is not something to hold this one to. The bodies
// take care of themselves -- `sunkSince` is keyed on them, and a new game builds
// new ones -- but the marks are keyed on job names and would carry over.
export function resetVerify() {
  everOwned.clear();
}

export function verifyWorld() {
  const all = ways();
  const gy = S.groundY;
  const left = Math.min(0, yardLeft()) - OUTSIDE;
  const right = (S.worldW || 0) + OUTSIDE;

  for (const w of S.workers) {
    // --- rule 6: a position is a position -------------------------------------
    // First, because every rule after it reads x and y, and a NaN compared with
    // anything is false -- so a body that has stopped having a place would slip
    // silently through all of them and be reported as fine.
    if (!Number.isFinite(w.x) || !Number.isFinite(w.y))
      fail('a body has no place', `${w.type} at ${w.x},${w.y}`);
    // And the sway it is drawn with, because that is where the last body at NaN
    // came from: the janitor was given something to do while it waits, read a
    // phase nothing had handed it, and multiplied its position by the sine of
    // `undefined`. Checked one step before the damage rather than after it, so
    // the report names the missing field instead of the ruined position.
    if (!Number.isFinite(w.ph) || !Number.isFinite(w.sp))
      fail('a body has no rhythm of its own', `${who(w)} sways ph ${w.ph}, sp ${w.sp}`);
    if (w.x < left || w.x > right)
      fail('a body has left the world',
           `${who(w)}, world runs ${Math.round(left)}..${Math.round(right)}`);

    // --- rule 5: a load is a real load -----------------------------------------
    // `carry` is how many grains are in a body's arms and `load` is what shade
    // each of them is, and they are not two things kept level with each other:
    // they are one thing counted and the same thing written out. A grain is
    // pushed on to `load` and counted on to `carry`; a grain shaken out is
    // popped and counted off; a load put down empties both. **So a body with a
    // load array has exactly as many shades in it as it has grains.**
    //
    // This used to be asserted one way only -- never fewer shades than grains --
    // with the other way written off as untidy but harmless, because the one
    // place that broke it was the spill in `drop`: a body shaken until it let go
    // had its `carry` zeroed and its `load` left standing. Nothing read past
    // `carry`, so nothing showed. But "nothing reads past the count" is a
    // promise about every reader there will ever be, and the fix was one line at
    // the source. The count and the shades leave together now, so the rule can
    // be the equality it always meant, and a stale shade is a failure rather
    // than a shrug.
    //
    // A body that has never held anything has no `load` at all -- the factories
    // hand out `carry: 0` and nothing else -- and that is not a violation of
    // anything. The rule is about a load array that exists.
    const carry = w.carry || 0;
    if (!Number.isInteger(carry) || carry < 0)
      fail('a body is carrying a number that is not a count', `${who(w)} carries ${w.carry}`);
    if (Array.isArray(w.load) && carry !== w.load.length)
      fail('a body\'s load and its count disagree',
           `${who(w)} carries ${carry} with ${w.load.length} in the load`);

    // --- rule 3b: a hat is a hat off the table ----------------------------------
    // `trained` says a body walked to a stand and picked something up, and what
    // it picked up is named by `kitOf`. A `kitOf` that is not a row of KIT is a
    // hat nothing can draw, count or hand back in -- the exact shape of the bug
    // the one table was built to end (see kit.js).
    if (w.trained && !KIT[w.kitOf])
      fail('a body is wearing kit that is not in the table',
           `${who(w)} wears ${JSON.stringify(w.kitOf)}`);
    if (w.type && !JOB_OF[w.type])
      fail('a body is doing a job the roster does not have', `${who(w)}`);

    // --- rules 1 and 2: what is underfoot ---------------------------------------
    // Both of them are about a body *standing* somewhere, and there are four
    // states in this game that are not standing anywhere at all: held in the
    // player's hand, falling out of it, flying (a wizard aloft is four hundred
    // pixels over the yard on purpose), and indoors. None of those has a surface
    // under it and none of them is a walk, so neither rule has anything to say.
    // A body picked up and waved about over the crest of the hill is inside the
    // rock in the only sense that matters to `standTop`, and that is the gesture
    // working rather than a wall being crossed.
    if (w.lifted || w.falling || w.aloft || w.inside) { sunkSince.delete(w); continue; }

    const feet = w.y + WORKER;

    // The ladder rule. Below the ground line is down a working, and a working is
    // reached at its ladder and left at its ladder -- that is not a rule written
    // anywhere, it is what having exactly one link out means (see route.js). So a
    // body under the ground line and outside the span of every working did not
    // walk there: it went through a wall.
    //
    // A body's slack on the depth, and a body's slack at each end of the span.
    //
    // The ends, because a body is three cells wide and stands with one edge out
    // over the lip while it steps on and off the head of the ladder. The depth,
    // because settling on to uneven ground and landing out of a dance both put a
    // body a few pixels under the line for a frame or two -- seven is the worst
    // the suite produces -- and a few pixels under the line is not down a hole.
    // Nothing is given away by allowing it: a working is hundreds of pixels
    // deep, so a body that has gone through a wall is nowhere near this mark.
    if (feet > gy + WORKER) {
      const down = WORKINGS.some(key => {
        const way = all[key];
        return way && w.x + WORKER > way.from - WORKER && w.x < way.to + WORKER;
      });
      if (!down)
        fail('a body is under the yard with no working under it',
             `${who(w)}, feet ${Math.round(feet - gy)}px below the ground line at ${Math.round(gy)}`);
    }

    // Nobody is inside the hill, or inside the floor of the hole. The way a body
    // is on answers what is under it, and its feet belong on it -- give or take
    // the climb lag BURIED allows for and the time BURIED_FRAMES allows it. See
    // `deepest` for why the surface asked about is the lowest column the body
    // stands across rather than the highest.
    const way = wayAt(w.x, w.y, all);
    const surf = deepest(w.x, way.at);
    if (feet - surf > BURIED) {
      const since = sunkSince.get(w) ?? S.tick;
      sunkSince.set(w, since);
      if (S.tick - since > BURIED_FRAMES)
        fail('a body has been buried in the way it is standing on',
             `${who(w)} is ${Math.round(feet - surf)}px into the ${way.key} `
             + `and has been under it for ${S.tick - since} frames`);
    } else sunkSince.delete(w);
  }

  // --- rule 4: the counts are the crew ------------------------------------------
  // The crew is a set of counts and `syncWorkers` builds bodies from them, so the
  // two are the same number or one of them is a lie. A count that has gone
  // negative is worse than wrong: `room[w.type]-- > 0` stands every body of that
  // type down for ever, and the station runs on the number alone with nobody ever
  // walking to it.
  //
  // This is checked after the frame rather than inside it on purpose. Mid-frame
  // the two legitimately differ -- a board sets a count and `syncWorkers` walks
  // the bodies over on the next line -- and every path that changes a count ends
  // by calling it, so by the end of a frame they agree again.
  let want = 0;
  for (const key of Object.values(ROSTER_COUNTS)) {
    const n = S[key];
    if (!Number.isInteger(n) || n < 0)
      fail('a job has a count that is not a count', `${key} is ${n}`);
    want += n;
  }
  if (S.workers.length !== want)
    fail('the crew is not the counts', `${S.workers.length} bodies against ${want} on the books`);

  // --- rule 3a: the books balance on hats ----------------------------------------
  // A hat belongs to the station, so a station cannot have more of its kit out on
  // heads than it owns -- that was the bug the kit table was built for: `worn`
  // counted off the job a body was doing rather than off the hat it was wearing,
  // so a helmet on a hauler's head stopped being counted at the rock and was lent
  // out again. One helmet, two heads, and books that said all was well.
  //
  // Asked against what the station has owned since its books were last level
  // rather than against what it owns this second, because hats can be taken away
  // while they are still on heads and the bodies then walk them back. See
  // `everOwned` for the whole of that.
  for (const job of KIT_JOBS) {
    const owned = stockOf(job);
    if (!Number.isInteger(owned) || owned < 0)
      fail('a station has a hat count that is not a count',
           `${TRADE_OF[job] || job} is ${owned}`);
    let out = 0;
    for (const w of S.workers) if (w.trained && w.kitOf === job) out++;
    const mark = out <= owned ? owned : Math.max(everOwned.get(job) ?? owned, owned);
    everOwned.set(job, mark);
    if (out > mark)
      fail('a station has more kit worn than it has ever owned',
           `${job}: ${out} worn, ${owned} owned now and never more than ${mark}`);
  }

  // --- rule 7: the ledgers --------------------------------------------------------
  // The hole and the yard floor each keep a running count of their occupied
  // cells, so that "is there room in the hole" and "how much dust is lying
  // about" are field reads rather than walks of sixty and a hundred and twenty
  // thousand cells. A running count is a second copy of a fact, and a second
  // copy drifts: this is the only thing in the game that would ever notice.
  //
  // Which is the whole reason the floor is allowed one at all. It was left
  // without deliberately -- a second copy drifts -- and what makes it safe now
  // is not care taken at the six places that write those cells wholesale
  // (`fillFlat`, `resizeGrid`, `gridFill` through `restoreGrid`, `clearFloor`,
  // the reset in persist.js) but this line, which catches it if any of them is
  // ever missed or a seventh is added.
  if (S.tick % LEDGER_EVERY === 0) {
    for (const [name, b] of [['the hole', pit], ['the yard', floor], ['the cut', cut]]) {
      if (!b.grid || b.n == null) continue;
      const real = count(b);
      if (b.n !== real)
        fail(`${name} has lost count of itself`, `ledger says ${b.n}, the cells say ${real}`);
    }
  }
}
