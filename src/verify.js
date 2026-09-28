// The rules the yard keeps, checked on the frame they are broken.
//
// `fast` in hooks.js calls `verifyWorld` after every frame when the flag is
// on, which under test is always, so every group in the node tier watches
// every rule here whatever it was written to look at. A failure throws on the
// frame it happened and carries the seed, so the run that broke is the run
// you can start over.
//
// It runs on every simulated frame of every check, so it is O(bodies + jobs)
// and nothing else: one `ways()` for the whole crew, no walk of the grids,
// and the one question that needs the cells counted is asked once a second
// (`LEDGER_EVERY`). Play never calls it.

import { WORKER } from './config.js';
import { S, pit, floor, cut, band } from './state.js';
import { P } from './config.js';
import { ways, wayAt, standTop, WORKINGS, belowYard } from './route.js';
import { cutTop } from './quarry.js';
import { rockDown } from './rock.js';
import { KIT, KIT_JOBS, TRADE_OF, JOB_OF, stockOf, liftsOf } from './kit.js';
import { count, countDust } from './grid.js';
import { CORE_CELL, SHARD_CELL, SPORE_CELL, SPARK_CELL, findKind } from './config.js';

// The same table `HELD` in pit.js is built from, written here rather than
// imported because this file must not trust the code it is checking.
const COIN_CELLS = [[CORE_CELL, 'cores'], [SHARD_CELL, 'shards'],
                    [SPORE_CELL, 'spores'], [SPARK_CELL, 'sparks']];
const COIN_OF = Object.fromEntries(COIN_CELLS.map(([cell, key]) => [cell, key]));
import { yardLeft } from './world.js';
import { seed } from './rng.js';
import { now } from './clock.js';
import { JOB, TYPE, DEEP_JOBS, isDeepType, JOB_OF as JOB_OF_TYPE } from './jobs.js';
import { BEATS } from './beats.js';
import { LEDGER } from './smog/rain.js';
import { SERPENT_WOUND, STUN_MAX_S, ROOMBA_MAX, ROOMBA_BIN, FIGHT_STATIONS_MAX, FANG_BREAKS } from './config.js';
import { CALLED } from './deep/party.js';
import { roombasOf, binOf } from './crew/roomba.js';
import { deepBed } from './state.js';
import { deepTop, deepFloor } from './deep/place.js';
import { yardReads } from './persist.js';

// The jobs the roster is made of, and the count on S that owns each: every
// body type and its job, read off the one table (jobs.js) rather than kept
// by hand here, where a job added later was a count with no rule over it.
const ROSTER_COUNTS = JOB_OF_TYPE;

// How far below the surface of its way a body may be, and for how long. Feet
// ease up to the ground fourteen per cent a frame (`climbTo` in crew.js), so
// a body is legitimately inside a sheer step for the length of the climb out;
// the worst lag seen is back under the mark in eight frames, so a body still
// buried a second later is standing in the rock.
const BURIED = WORKER * 1.5;
const BURIED_FRAMES = 60;

// A WeakMap rather than a field on the body: a body is a saved, cloned,
// snapshotted thing and a debug counter has no business travelling with it.
const sunkSince = new WeakMap();

// How far above the highest thing under it a body may be before it is on
// nothing (rule 9): a body's height, because a hop in a dance clears more than
// a cell. The frames are the buried rule's; a dance is on the ground at every
// beat.
const FLOAT = WORKER;
const FLOAT_FRAMES = BURIED_FRAMES;
const floatSince = new WeakMap();
// How many doses each body was under last frame (rule 11).
const dosesLast = new WeakMap();

// How far off the column under its middle a body in the cut may stand (rule
// 10). A course of the floor is a cell, so the slack has to be less than one.
const COURSE = P / 2;
const offFloorSince = new WeakMap();

// The *lowest* thing under a body. `standTop` (the highest surface under any
// of a body's three cells) is where a walking body belongs, but a rockhand
// stands on the column it is hitting, and on a stepped hill the two are a
// step apart, so measuring burial against the higher calls every working
// rockhand buried. Below even the lowest column there is nothing under any
// part of the body, which is the only thing "buried" can honestly mean.
function deepest(leftX, at) {
  let low = -Infinity;
  for (let x = leftX; x < leftX + WORKER; x += P) low = Math.max(low, at(x));
  return Math.max(low, at(leftX + WORKER - 1));
}

// What a station has owned since the last time its books were level. `worn <=
// hats` is not quite an invariant: hats can be taken away while still on heads
// (a machine spends them, a hook sets the count back, a stock station is shut)
// and the bodies then walk them back in. What is never legitimate is more kit
// worn than the station has *ever* owned: one hat counted on two heads. The
// mark comes back down the frame the books are level, so it is not a ratchet.
const everOwned = new Map();

// The yard has soft edges (a stand past the leftmost pile, a throw over the
// far wall), so this is not a fence; it catches a body that has left for the
// horizon, which is what a NaN or a runaway step looks like after a frame or
// two.
const OUTSIDE = WORKER * 8;

// The ledgers cannot be answered without walking the cells, and asked every
// frame they would cost more than the frame. Once a second is soon enough:
// `put` is the only thing that moves the count, and a bug in `put` is wrong on
// every frame after the first.
const LEDGER_EVERY = 60;

// The seed is what makes the failure a run you can start over (rng.js).
function fail(rule, detail) {
  throw new Error(`${rule}: ${detail}  [frame ${S.tick}, seed ${seed()}]`);
}

const who = w => `${w.name || w.type} (${w.type}) at ${Math.round(w.x)},${Math.round(w.y)}`;

// A new game is a new world. The per-body maps take care of themselves (a new
// game builds new bodies), but the marks are keyed on job names and would
// carry over.
export function resetVerify() {
  everOwned.clear();
  playedWas = 0; playedReads = -1;
  forgetSerpent();
}

// The story's table, read for its keys and owners only.
const BEAT_OWNS = new Map(BEATS.map(r => [r.key, r.owns]));

export function verifyWorld() {
  // --- rule 15: the yard's length only grows (wave-cloud SYNC) ---------------
  // `playedS` is what "newer" means between two copies of one yard on two
  // devices (cloud.js), so a frame that took it back, or made it no number,
  // would have the cloud take the older copy over the newer. A load or a new
  // game between two frames is another yard, or this one at another point.
  if (!Number.isFinite(S.playedS) || S.playedS < 0)
    fail('the yard has played for no length of time', `${S.playedS}`);
  if (yardReads === playedReads && S.playedS < playedWas)
    fail('the yard\'s length went back', `${playedWas} then ${S.playedS}`);
  playedWas = S.playedS;
  playedReads = yardReads;

  // --- rule 14: the water is water ------------------------------------------
  // A shower is clean drops with the washed sky among them, and only a drop
  // that was sky may leave a mark (`stepDrops`), so the muck the rain has laid
  // can never pass the dirty drops that have landed. A clean shower that
  // leaves a mark is the wrong shower.
  if (LEDGER.laid > LEDGER.dirty)
    fail('the rain laid more muck than dirty drops landed',
         `laid ${LEDGER.laid}, dirty ${LEDGER.dirty}, clean ${LEDGER.clean}`);

  // --- rule 13: the purse is never poured below zero, and the stake is
  // never more than was poured ---------------------------------------------
  // The casino's hold commits a pebble only while an unspent one covers it
  // (`stepHold` in casino.js), and a grain of the stake landing spends what
  // it carries and no more: so no counter goes negative, and what stands in
  // the funnel plus what is still owed is exactly what was held for.
  if (S.stored < 0 || S.shards < 0 || S.spores < 0 || S.sparks < 0)
    fail('a purse is below zero', `pebbles ${S.stored}, ore ${S.shards}, crops ${S.spores}, sparks ${S.sparks}`);
  if (S.pot) {
    const { stake, n, owed } = S.pot;
    if (!(n >= 0 && owed >= 0 && n + owed <= stake + 1e-9 && n <= stake))
      fail('the stake is more than was poured', `stake ${stake}, landed ${n}, owed ${owed}`);
    if (owed > S.stored + 1e-9)
      fail('the funnel is owed more than the purse holds', `owed ${owed}, purse ${S.stored}`);
  }

  // --- rule 12: one beat an owner, and never one that has played -------------
  // Two beats may run at once only with different owners (beats.js), a
  // running key is a row of the table under the owner it names, and a beat
  // that has played is never running.
  for (const [owner, key] of Object.entries(S.beat)) {
    if (key == null) continue;
    if (BEAT_OWNS.get(key) !== owner)
      fail('a beat is running under the wrong owner', `${key} under ${owner}`);
    if (S.beatsDone.includes(key))
      fail('a beat that has played is running', `${key}`);
  }

  const all = ways();
  const gy = S.groundY;
  const left = Math.min(0, yardLeft()) - OUTSIDE;
  const right = (S.worldW || 0) + OUTSIDE;

  for (const w of S.workers) {
    // --- rule 6: a position is a position -------------------------------------
    // First, because every rule after it reads x and y, and a NaN compared
    // with anything is false, so a body with no place would slip through them.
    if (!Number.isFinite(w.x) || !Number.isFinite(w.y))
      fail('a body has no place', `${w.type} at ${w.x},${w.y}`);
    // The sway is checked one step before the damage: a position multiplied
    // by the sine of `undefined` is the NaN above, and this names the missing
    // field instead.
    if (!Number.isFinite(w.ph) || !Number.isFinite(w.sp))
      fail('a body has no rhythm of its own', `${who(w)} sways ph ${w.ph}, sp ${w.sp}`);
    if (w.x < left || w.x > right)
      fail('a body has left the world',
           `${who(w)}, world runs ${Math.round(left)}..${Math.round(right)}`);

    // --- rule 5: a load is a real load -----------------------------------------
    // `carry` is how many grains are in a body's arms and `load` the shade of
    // each: one thing counted and the same thing written out, so the two are
    // equal. A body that has never held anything has no `load` at all, which
    // is not a violation; the rule is about a load array that exists.
    const carry = w.carry || 0;
    if (!Number.isInteger(carry) || carry < 0)
      fail('a body is carrying a number that is not a count', `${who(w)} carries ${w.carry}`);
    if (Array.isArray(w.load) && carry !== w.load.length)
      fail('a body\'s load and its count disagree',
           `${who(w)} carries ${carry} with ${w.load.length} in the load`);

    // --- rule 3b: a hat is a hat off the table ----------------------------------
    // A `kitOf` that is not a row of KIT is a hat nothing can draw, count or
    // hand back in (kit.js).
    if (w.trained && !KIT[w.kitOf])
      fail('a body is wearing kit that is not in the table',
           `${who(w)} wears ${JSON.stringify(w.kitOf)}`);
    if (w.type && !JOB_OF[w.type])
      fail('a body is doing a job the roster does not have', `${who(w)}`);

    // --- rule 11: a dose is handed over on the ground ---------------------------
    // A dose lands when a stirrer's hand reaches the body (`deal` in
    // apothecary.js), and a hand does not reach a wizard on the ring. Counted
    // on the frame the list grows, so a dose that wears off or is refreshed
    // says nothing. "In the sky" is the feet a body's height over the ground
    // line, not the flag: a wizard that drank and lifted off in the same frame
    // is flagged aloft with its feet on the ground. A body seen for the first
    // time is only written down: a reload stands every body up afresh, doses
    // and all.
    const dosesNow = (w.doses || []).filter(d => d.until > now()).length;
    if (dosesLast.has(w) && dosesNow > dosesLast.get(w) && w.aloft && gy - (w.y + WORKER) > WORKER)
      fail('a dose was handed to a body in the sky', `${who(w)} carries ${dosesNow}`);
    dosesLast.set(w, dosesNow);

    // --- rules 1 and 2: what is underfoot ---------------------------------------
    // Four states are not standing anywhere: held, falling, flying and
    // indoors. None has a surface under it, so neither rule has anything to
    // say.
    if (w.lifted || w.falling || w.aloft || w.inside) { sunkSince.delete(w); continue; }
    // Nor does a body down the shaft or in the deep: it swims, held up by the
    // water, and the deep's own rules are its own (the end of the list).
    if (belowYard(w)) { sunkSince.delete(w); floatSince.delete(w); offFloorSince.delete(w); continue; }

    const feet = w.y + WORKER;

    // The ladder rule: a working is reached and left at its ladder (it has
    // exactly one link out, route.js), so a body under the ground line and
    // outside the span of every working went through a wall. A body's slack
    // at each end, because a body stands with one edge over the lip at the
    // head of the ladder; a body's slack on the depth, because settling and
    // landing put a body a few pixels under the line for a frame or two, and
    // a working is hundreds deep.
    if (feet > gy + WORKER) {
      const down = WORKINGS.some(key => {
        const way = all[key];
        return way && w.x + WORKER > way.from - WORKER && w.x < way.to + WORKER;
      });
      if (!down)
        fail('a body is under the yard with no working under it',
             `${who(w)}, feet ${Math.round(feet - gy)}px below the ground line at ${Math.round(gy)}`);
    }

    // Nobody is inside the hill or the floor of the hole, give or take the
    // climb lag BURIED and BURIED_FRAMES allow. See `deepest` for why the
    // surface asked about is the lowest column rather than the highest.
    // A rock still in the air is not a hill yet: `wayAt` answers `rock` for
    // a body under its footprint, and its top is hundreds of pixels up, so
    // every body there reads as deep inside it until it lands.
    const way = wayAt(w.x, w.y, all);
    const surf = deepest(w.x, way.at);
    if (feet - surf > BURIED && (way.key !== 'rock' || rockDown())) {
      const since = sunkSince.get(w) ?? S.tick;
      sunkSince.set(w, since);
      if (S.tick - since > BURIED_FRAMES)
        fail('a body has been buried in the way it is standing on',
             `${who(w)} is ${Math.round(feet - surf)}px into the ${way.key} `
             + `and has been under it for ${S.tick - since} frames`);
    } else sunkSince.delete(w);

    // --- rule 9: nothing floats --------------------------------------------------
    // The mirror of the buried rule: feet held up over the highest column
    // under any part of a body are on nothing at all. A body walking a route
    // is between surfaces on purpose, and a hop in a dance is back on the
    // ground at every beat, so only a body that *stays* up there is reported.
    const top = standTop(w.x, way.at);
    const aboard = S.tick - (w.aboardAt ?? -9) <= 1;   // in a machine's seat, see stepTender
    if (!(w.route && w.route.length) && !w.floating && !aboard && w.jigAt == null && top - feet > FLOAT) {
      const since = floatSince.get(w) ?? S.tick;
      floatSince.set(w, since);
      if (S.tick - since > FLOAT_FRAMES)
        fail('a body is standing on nothing',
             `${who(w)} has its feet ${Math.round(top - feet)}px over the ${way.key} `
             + `(goal ${w.goal}, foot ${Math.round(w.foot ?? NaN)}, resting ${!!w.resting}, lifted ${!!w.lifted}, dizzy ${!!w.dizzyUntil}, idle ${w.idleAt != null}, walking ${!!w.walking} to ${w.walkTo} leg ${w.leg}, muck ${w.muckAt}, hatOff ${!!w.hatOff}, tend ${w.tending}, wanting ${w.wanting}, fetching ${w.fetching}, trained ${!!w.trained}, kit ${w.kitOf}, robbed ${!!w.robbed}, legs ${JSON.stringify(w.legs)}) `
             + `and has been up there for ${S.tick - since} frames`);
    } else floatSince.delete(w);

    // --- rule 10: the cut is worked from its floor ------------------------------
    // A body on the jagged floor of the cut stands on the column under its
    // middle (`stepQuarrier`, `feetOn`); the yard's highest-of-three rule
    // disagrees by a course over every dip, which is inside rule 9's slack, so
    // this is asked to the cell against `cutTop` itself rather than through
    // `feetOn`. Feet ease to the floor over a few frames after a column under
    // them is cut away.
    if (way.key === 'cut' && !(w.route && w.route.length)) {
      const floorY = cutTop(w.x + WORKER / 2);
      if (Math.abs(feet - floorY) > COURSE) {
        const since = offFloorSince.get(w) ?? S.tick;
        offFloorSince.set(w, since);
        if (S.tick - since > FLOAT_FRAMES)
          fail('a body in the cut is not on the column under its middle',
               `${who(w)} has its feet ${Math.round(feet - floorY)}px off the floor `
               + `at ${Math.round(floorY)} and has been for ${S.tick - since} frames`);
      } else offFloorSince.delete(w);
    } else offFloorSince.delete(w);
  }

  // --- rule 4: the counts are the crew ------------------------------------------
  // `syncWorkers` builds bodies from the counts, so the two are the same
  // number or one is a lie. A negative count is worse than wrong:
  // `room[w.type]-- > 0` stands every body of that type down for ever.
  // Checked after the frame: mid-frame the two legitimately differ, and every
  // path that changes a count ends by calling `syncWorkers`.
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
  // A station cannot have more of its kit on heads than it has owned since
  // its books were last level (see `everOwned` for why not "owns now").
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

  // --- rule 3c: the forklifts are the count, and none of them is crew ----------
  // A forklift drives itself (crew/lifts.js): one body in `S.lifts` for every
  // one owned, and never one in `S.workers`, the people.
  {
    const owned = liftsOf();
    if (!Number.isInteger(owned) || owned < 0)
      fail('the forklifts are a count that is not a count', `${owned}`);
    if ((S.lifts || []).length !== owned)
      fail('the yard does not have a forklift for every one it owns',
           `${(S.lifts || []).length} in the yard, ${owned} owned`);
    for (const w of S.workers)
      if (w.vehicle) fail('a forklift is on the crew', `${who(w)}`);
  }

  // --- rule 3d: the roombas are the count, and none of them is crew -----------
  // The same for the closet's machine (crew/roomba.js): a roomba on the yard
  // for every one owned while the machine stands, never more than the closet
  // holds, never one in `S.workers`, and never a bin fuller than a bin.
  {
    const want = roombasOf();
    if ((S.roombaBots || []).length !== want)
      fail('the yard does not have a roomba for every one it owns',
           `${(S.roombaBots || []).length} in the yard, ${want} owned`);
    if ((S.roombas | 0) > ROOMBA_MAX) fail('the closet owns more roombas than it holds', `${S.roombas}`);
    for (const w of S.workers)
      if (w.roomba) fail('a roomba is on the crew', `${who(w)}`);
    for (const r of S.roombaBots || [])
      if (binOf(r) > ROOMBA_BIN || r.muck < 0 || r.poop < 0)
        fail('a roomba holds more than its bin', `${r.muck} muck, ${r.poop} poop`);
  }

  // --- rule 7: the ledgers --------------------------------------------------------
  // Each grid keeps a running count of its occupied cells so room and dust
  // are field reads. A running count is a second copy of a fact, and a second
  // copy drifts; this line is what makes the copy safe, not care taken at the
  // places that write the cells wholesale.
  if (S.tick % LEDGER_EVERY === 0) {
    for (const [name, b] of [['the hole', pit], ['the yard', floor], ['the cut', cut]]) {
      if (!b.grid || b.n == null) continue;
      const real = count(b);
      if (b.n !== real)
        fail(`${name} has lost count of itself`, `ledger says ${b.n}, the cells say ${real}`);
      // The dust ledger beside it, which the rift swallows against.
      if (b.d != null) {
        const dust = countDust(b);
        if (b.d !== dust)
          fail(`${name} has lost count of its dust`, `ledger says ${b.d}, the cells say ${dust}`);
      }
    }

    // --- rule 8: the coins are in the hole or through the rift ------------------
    // What you own is what is lying in the hole plus what has gone through,
    // for every coin the hole takes. One walk for all four.
    if (pit.grid) {
      const held = S.riftHeld || {};
      const inPile = { cores: 0, shards: 0, spores: 0, sparks: 0 };
      for (const v of pit.grid) {
        if (!v) continue;
        const key = COIN_OF[v === CORE_CELL ? CORE_CELL : findKind(v)];
        if (key) inPile[key]++;
      }
      for (const [, key] of COIN_CELLS) {
        const owned = S[key] || 0, through = held[key] || 0;
        if (inPile[key] + through !== owned)
          fail(`the ${key} in the hole and the rift are not what you own`,
               `${inPile[key]} in the pile + ${through} through = ${inPile[key] + through}, counter ${owned}`);
      }
    }

    // --- rule 14: the load on the belt lies at rest ------------------------------
    // A heap on the band stands up the way one on the ground does (`repose`
    // in grid.js: a grain slides only into a drop of two), what lands on it
    // is put where it rests (`restOn`), and it is settled to rest after
    // everything has landed (`settleBelt`), so no column of it stands more
    // than that drop over the one beside it. A taller one is a needle: what
    // landed this frame outrunning the slump. And the depth the belt keeps
    // of each column (`band.high`) is a second copy of the cells, checked
    // here for the reason the ledgers are.
    if (band.grid && band.n) {
      const deep = c => { for (let r = band.rows - 1; r >= 0; r--) if (band.grid[r * band.cols + c]) return r + 1; return 0; };
      let prev = deep(0);
      for (let c = 0; c < band.cols; c++) {
        const d = deep(c);
        if (band.high && band.high[c] !== d)
          fail('the belt has lost count of a column', `column ${c} of the band stands ${d} deep, the belt says ${band.high[c]}`);
        if (Math.abs(d - prev) > 2)
          fail('the load on the belt stands as a needle',
               `columns ${c - 1} and ${c} of the band stand ${prev} and ${d} deep`);
        prev = d;
      }
    }
  }

  // --- wave serpent: SERPENT -------------------------------------------------------
  // The fight (deep/serpent.js). The wound is held open against the heal and
  // held at its stage's depth until the frame breaks it, so it is never under
  // nought nor over the depth; a defense that has broken stays broken; and
  // the serpent's half is nobody's until it has taken him, so no body is
  // down there before the snatch. The scales are the bed's cells and nothing
  // else, counted in two places for the reason the ledgers are.
  {
    const stage = S.serpentStage;
    if (!Number.isInteger(stage) || stage < 0 || stage > 4)
      fail('the serpent is in a stage it does not have', `${stage}`);
    const depth = stage > 3 ? 0 : SERPENT_WOUND[stage];
    if (!(S.serpentWound >= 0) || S.serpentWound > depth)
      fail('the wound is outside its stage', `wound ${S.serpentWound} in stage ${stage}, depth ${depth}`);
    if (stage < serpentWas)
      fail('the serpent\'s defense went back', `stage ${serpentWas} then ${stage}`);
    // A stunned serpent does not heal: a wound that was stunned at the end
    // of the last frame is no shallower at the end of this one, unless the
    // stage broke under it. And no stun is longer than the longest.
    if (stunWas && stage === serpentWas && S.serpentWound < woundWas - 1e-9)
      fail('the serpent healed while it was stunned', `wound ${woundWas} then ${S.serpentWound} in stage ${stage}`);
    if (!(S.serpentStun >= 0) || S.serpentStun > STUN_MAX_S + 1e-9)
      fail('the stun is outside its bounds', `${S.serpentStun}s, at most ${STUN_MAX_S}`);
    serpentWas = stage;
    woundWas = S.serpentWound;
    stunWas = S.serpentStun > 0;
    if (S.serpentFreed !== (stage > 3))
      fail('he is freed and the belly is not open, or the other way round', `freed ${S.serpentFreed}, stage ${stage}`);
    if (!S.snatched) {
      const top = deepTop();
      for (const w of S.workers)
        if (w.y + WORKER > top) fail('a body is in the deep before the snatch', `${who(w)}`);
    }
    // Nothing in the deep goes through its floor: a body at rest floats and
    // hops (deep/rest.js), and every way it comes down lands on the floor.
    const floor = deepFloor();
    for (const w of S.workers)
      if (w.y + WORKER > floor + 1 && !w.lifted)
        fail('a body is under the deep\'s floor', `${who(w)} has its feet ${Math.round(w.y + WORKER - floor)}px under it`);
    if (!(S.scales >= 0))
      fail('the crusher owes scales', `account ${S.scales}`);
    // The deep's crew is the shaft's count, and its fighters are out of it
    // (DESIGN.md, "The deep's crew is set at the shaft").
    const fighting = DEEP_JOBS.reduce((n, j) => n + (S[j] || 0), 0);
    if (fighting > (S.deepCrew || 0))
      fail('the deep\'s fighters are more than its crew', `${fighting} fighting, ${S.deepCrew} down there`);
    const bodies = S.workers.filter(w => isDeepType(w.type)).length;
    if (bodies !== (S.deepCrew || 0))
      fail('the bodies on the deep\'s jobs are not its crew', `${bodies} on them, ${S.deepCrew} down there`);
    if (S.tick % LEDGER_EVERY === 0 && deepBed.grid && deepBed.n !== count(deepBed))
      fail('the bed has lost count of itself', `ledger says ${deepBed.n}, the cells say ${count(deepBed)}`);
  }

  verifyParty();
}

// --- wave party: STATE -----------------------------------------------------------
// The stations and their fighters (docs/wave-party.md). A station is built on
// a free slot by the first pick or a fang, so there are never more than the
// first and three fangs' worth; a fighter is seated only at a station that
// stands, one a station, and a station holds one fighter; the serpent drops a
// fang at each of its first breaks, so no more have dropped than breaks have
// happened or than it has fangs to drop; and a fighter is the deep's, its
// feet never in the yard. A station names its fighter by the body's uid, so
// no two bodies share one, and a station manned on a call (`CALLED`) has its
// body chosen on the same call: never so at the end of a frame. Exported so
// a check can ask these alone of a party it stood up by hand.
export function verifyParty() {
  const stations = S.stations || [];
  if (stations.length > FIGHT_STATIONS_MAX)
    fail('more stations stand than the party holds', `${stations.length}, at most ${FIGHT_STATIONS_MAX}`);
  const ids = new Set(), seated = new Map();
  for (const st of stations) {
    if (ids.has(st.id)) fail('two stations share a name', `${st.id}`);
    ids.add(st.id);
    if (st.fighter == null) continue;
    if (st.fighter === CALLED) fail('a station is manned and nobody was sent to it', `${st.id} (${st.kind})`);
    if (!st.built) fail('a fighter is seated at a station still going up', `${st.id} (${st.kind})`);
    if (seated.has(st.fighter))
      fail('one fighter is seated at two stations', `${st.fighter} at ${seated.get(st.fighter)} and ${st.id}`);
    seated.set(st.fighter, st.id);
  }
  const uids = new Map();
  for (const w of S.workers) {
    if (w.uid == null) continue;
    if (uids.has(w.uid)) fail('two bodies share a uid', `${uids.get(w.uid)} and ${who(w)}: ${w.uid}`);
    uids.set(w.uid, who(w));
  }
  const at = new Map();
  for (const w of S.workers) {
    if (w.type !== TYPE.FIGHTER) continue;
    const st = stations.find(s => s.id === w.station);
    if (!st) fail('the station a fighter stands for does not exist', `${who(w)} stands for ${JSON.stringify(w.station)}`);
    if (!st.built) fail('the station a fighter stands for is not built', `${who(w)} at ${st.id} (${st.kind})`);
    if (at.has(st.id)) fail('two fighters stand at one station', `${at.get(st.id)} and ${who(w)} at ${st.id}`);
    at.set(st.id, who(w));
    if (st.fighter !== w.uid) fail('a fighter stands at a station that names another', `${who(w)} (${w.uid}) at ${st.id}, which names ${st.fighter}`);
    // A body in the cursor's hand or falling is on its way, not standing.
    if (!belowYard(w) && !w.lifted && !w.falling) fail('a fighter is in the yard', `${who(w)}`);
  }
  if (!Number.isInteger(S.fangs) || S.fangs < 0)
    fail('the fangs are a count that is not a count', `${S.fangs}`);
  if (!Number.isInteger(S.fangsDropped) || S.fangsDropped < 0 || S.fangsDropped > Math.min(S.serpentStage, FANG_BREAKS))
    fail('more fangs have dropped than the serpent has had breaks',
         `${S.fangsDropped} dropped, stage ${S.serpentStage}`);
}

// The last stage seen, for the rule that it never goes back. A new game, or a
// setup that sets the fight outright (`__serpent`), is a new start.
let serpentWas = -1, woundWas = 0, stunWas = false;
// The length on the frame before, and which reading of the yard it was of.
let playedWas = 0, playedReads = -1;
export function forgetSerpent() { serpentWas = -1; stunWas = false; }
