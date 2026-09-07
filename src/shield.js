// The shields: everything the yard puts between itself and the sky. See
// DESIGN.md, "The shields" -- three of them across a run, and the first two
// fail on purpose, because the rocks are the game's income and a wall that
// worked in the middle of it would starve the yard that built it.
//
// One mechanism, three kinds. A shield is a footprint over the landing spot, a
// build the crew walk out plank by plank, and an answer when the next rock
// reaches it: the timber is come straight through, the stone catches one rock
// and then cracks, and the dome holds. Everything a kind does differently is a
// field in KINDS; nothing below asks which one it is drawing.
//
// What a shield failing owes the player is that it is never a bill: nobody is
// under it when it goes -- `dropZone` has already walked the crew clear -- and
// the wreck flies out along the heap as ordinary spoil and mines back as dust.
import { S } from './state.js';
import {
  P, ROCK_CLEAR,
  SHIELD_LEG_W, SHIELD_LID_T, SHIELD_CLEAR_C, SHIELD_PIECE_DUST,
  PROP_FROM, PROP_COST, PROP_PLANKS,
  NET_COST, NET_ROPES, NET_SLOW,
  ARCH_COST, ARCH_BLOCKS, ARCH_HOLD_MS,
  JACK_COST, JACK_PARTS, JACK_HOLD_MS, JACK_PUSH, JACK_PUSH_RATE,
  DOME_COST, DOME_RINGS, DOME_WORK, DOME_HOLD_MS, DOME_SET_RATE
} from './config.js';
import { rockSize, rockFootY, landRock } from './rock.js';
import { workOn } from './works.js';
import { spawnSpoil } from './dust.js';
import { shadeNear } from './grid.js';
import { now, frames } from './clock.js';
import { startRescue } from './intro.js';

// What each shield is, and the whole of what makes it different from the
// others: what it is made of, what it costs, and how it answers a rock. A new
// one is an entry here and a case in the drawing -- nothing below asks which
// kind it is holding.
//
// The five run dust, spore, shard, spark, core: every coin the yard makes,
// spent once each on the same question. And the answers escalate, which is
// what keeps four failures from being one failure told four times -- not
// noticed, slowed, stopped, shoved back, held.
export const KINDS = {
  // Timber. It does not even slow the rock down.
  props: { pieces: PROP_PLANKS, cost: PROP_COST, money: 'dust', answer: 'through' },
  // Rope. It catches the rock and then pays out under it, all the way to the
  // ground: the first time a boulder comes down gently, and it arrives anyway.
  net: { pieces: NET_ROPES, cost: NET_COST, money: 'spore', answer: 'sag', rate: NET_SLOW },
  // Quarried stone. It catches one -- the yard has a moment of having won --
  // and then the crack runs and it comes down with the rock on top of it.
  arch: { pieces: ARCH_BLOCKS, cost: ARCH_COST, money: 'shard',
          answer: 'crack', holds: ARCH_HOLD_MS },
  // A machine, so it is bought with what machines are bought with. The only
  // shield that gives ground back before it loses it.
  jack: { pieces: JACK_PARTS, cost: JACK_COST, money: 'spark', answer: 'buckle',
          holds: JACK_HOLD_MS, push: JACK_PUSH, rate: JACK_PUSH_RATE },
  // Magic, and the end of the argument. Cast rather than carried: the wizards
  // fly over and pour it, the way they pour a star into an empty sky, and its
  // progress is their pouring -- see `pourDome`.
  dome: { pieces: DOME_RINGS, cost: DOME_COST, money: 'core', answer: 'hold',
          cast: true, work: DOME_WORK, holds: DOME_HOLD_MS, rate: DOME_SET_RATE }
};

export const shieldKind = () => S.shield && KINDS[S.shield.kind];
export const shieldUp = () => !!S.shield && S.shield.laid >= KINDS[S.shield.kind].pieces;
export const shieldDone = kind => S.shieldsDone.includes(kind);

// The top of whatever is standing: the lid's upper course, the arch's crown.
// One height for every kind, because what a shield is *for* is the same in all
// of them -- being the thing the rock reaches first.
export const shieldTopY = (s = S.shield) => S.groundY - s.h * P;

// Sized against the rock it has to answer: wide enough for the *next* one's
// footprint and its clearance, and tall enough to stand over whichever is
// bigger of the rock here now and the one coming -- with a body's worth of
// daylight over the peak, so the crew climb under it rather than into it.
// Measured, never tuned: a later rock cannot outgrow sums taken against it.
export function shieldPlan(kind) {
  const was = S.boulderNo;
  S.boulderNo = was + 1;
  const size = rockSize();
  S.boulderNo = was;
  const w = size.w * P + ROCK_CLEAR * 2 + SHIELD_LEG_W * P * 2;
  const x = Math.round((S.cx - w / 2) / P) * P;
  const clear = Math.max(S.gh, size.h) + SHIELD_CLEAR_C;
  // An arch's height is a consequence of its span rather than a free choice:
  // the piers carry the clearance, and the curve rises a quarter of the span
  // above them. A flat arch is a lintel and a tall one is a tunnel; a quarter
  // is the shallow segmental curve a mason gets away with over a wide opening.
  const rise = kind === 'arch' ? Math.round(w / P / 4) : 0;
  // A dome is a half-circle on the span, so its crown is half the span up
  // whether the rock needs that much room or not: the shape decides the
  // height, the same way the arch's rise does.
  const h = kind === 'dome' ? Math.max(clear, Math.round(w / P / 2)) : clear + rise;
  return { kind, x, w, h, rise };
}

export function raiseShield(kind) {
  // A built shield arrives finished, because the building already happened: it
  // is a work like any other now (works.js) -- paid for, fenced, hammered at
  // by a lent body under a bar, and this is the row's `buy` running when the
  // last of that labor is in. The dome is the exception both ways: nothing is
  // hammered and nobody is lent, the tower pours it on its own clock.
  const laid = KINDS[kind].cast ? 0 : KINDS[kind].pieces;
  S.shield = { ...shieldPlan(kind), laid, poured: 0, caught: 0, held: 0, strain: 0,
               sag: 0, shove: 0, setting: false };
  S.dirty = true;
}

// The ground a shield's build stands on, for the fence, the bar and the
// builder (siteBox in works.js): the same footprint `raiseShield` will use,
// worked out the same way, so the tape goes up around exactly the ground the
// thing will stand on.
export function shieldGround() {
  const { x, w } = shieldPlan('props');
  return { x, w };
}

// The shield going up right now, if any: which kind, and how far through its
// work the builders are. The drawing reads this to raise the thing in step
// with the labor -- the legs climb as the work climbs -- so what you watch is
// the actual progress, not an animation with the same length.
export function risingShield() {
  for (const kind of Object.keys(KINDS)) {
    if (KINDS[kind].cast) continue;                 // the dome rises off its own clock
    const w = workOn(kind);
    if (w) return { ...shieldPlan(kind), done: w.of ? Math.min(1, w.done / w.of) : 0 };
  }
  return null;
}

// It comes apart. Every piece laid breaks into spoil thrown along the heap in
// the arc a miner's spoil takes and lands as ordinary minable dust, so the
// wreck comes most of the way home. The kind is remembered as answered, so its
// row never returns: the yard has learned what that material is worth against
// the sky, and the story moves on.
export function breakShield() {
  const s = S.shield;
  if (!s) return;
  const top = shieldTopY(s);
  const grains = s.laid * SHIELD_PIECE_DUST;
  for (let i = 0; i < grains; i++) {
    const px = s.x + Math.random() * s.w;
    const py = top + Math.random() * P * SHIELD_LID_T;
    spawnSpoil(px, py, shadeNear(3), 'rock');
  }
  if (!S.shieldsDone.includes(s.kind)) S.shieldsDone.push(s.kind);
  S.shield = null;
  S.rockHeld = false;
  S.dirty = true;
}

// What a thing under a load it cannot take does before it goes: it shakes, and
// it sheds. A cell of itself comes loose every so often and falls -- grit off
// the arch's crown, dust off the jack's welds -- and `strain` climbs from
// nought to one across the hold, so all of it gets worse the closer the thing
// is to failing. The drawing reads `strain` for the shake; this is where the
// shedding happens, because a falling cell is a chip and chips belong to the
// yard rather than to the picture.
//
// It matters that the warning is honest: by the time the arch is trembling and
// throwing grit, it *is* about to crack. Nothing here is atmosphere -- it is
// the shield telling you what is about to happen, in the only vocabulary this
// game has, which is stuff coming off things.
function strainOn(s, kind) {
  const held = kind.holds || 1;
  s.strain = Math.max(0, Math.min(1, (now() - s.caught) / held));
  // more of it, and faster, the nearer it is to going
  if (Math.random() > 0.08 + s.strain * 0.5) return;
  const top = shieldTopY(s) + (s.sag || 0) * P;
  const px = s.x + Math.random() * s.w;
  // Thrown along the heap like every other spoil, never dropped where it is.
  // The grit used to fall straight down -- into the footprint, where it lay in
  // a little pile *inside* the rock the moment the rock came the rest of the
  // way down, until the landing's clearApron shoved it out. Aimed at the heap
  // it can never be somewhere a rock is about to be.
  spawnSpoil(px, top, shadeNear(3), 'rock');
}

// The yard stops and looks up. Everybody on the ground -- the same set the
// landing itself marks -- because a rock stopping in the air is the first time
// in this game that the thing overhead has not simply arrived.
function lookUp(ms) {
  const at = now();
  for (const w of S.workers) {
    if (w.inside || w.inPit || w.aloft) continue;
    w.say = { mark: 'bang', until: at + ms };
  }
}

// What a shield does once it has hold of a rock. One frame of it, and the only
// place the kinds differ in behavior rather than in looks.
function answer(s, kind) {
  const dt = frames() / 60;
  // Everything that is going to fail complains first. The dome does not: it is
  // not straining, it is holding, and a thing that is holding does not shed.
  if (kind.answer !== 'hold') strainOn(s, kind);
  // Rope. It never really stopped the rock, it only slowed it: the sag deepens
  // as the rope pays out, and when it reaches the ground the rope has nothing
  // left to give and the rock finishes its arrival.
  if (kind.answer === 'sag') {
    S.rockFall = Math.max(0, S.rockFall - kind.rate * dt);
    // How far the rope has been pulled below where it was slung, in courses,
    // measured from where the rock was when it took hold -- and kept as a
    // fraction of a course rather than rounded to whole cells. The drawing
    // rounds it per column, so a deepening sag *rolls* down the span a cell at
    // a time instead of the whole rope dropping a course at once. Round it
    // here and every strand steps together, which is what rope does not do.
    s.sag = (s.held - S.rockFall) / P;
    if (S.rockFall <= 0) { breakShield(); landRock(); }
    return;
  }
  // The machine. Braced under the weight for a moment, then the rams drive the
  // rock back up -- the closest the yard comes to winning -- and then they give
  // out all at once.
  if (kind.answer === 'buckle') {
    if (now() - s.caught < kind.holds) return;
    if (s.shove < kind.push) {
      const by = Math.min(kind.rate * dt, kind.push - s.shove);
      s.shove += by;
      S.rockFall += by;
      S.dirty = true;
      return;
    }
    breakShield();
    return;
  }
  // The dome. It holds the rock overhead for a beat and then lets it down --
  // gently, which is the one arrival in this game with no shake and no shout
  // in it. The dome is still standing afterwards, ready for the next one, so
  // its own state is put back rather than thrown away.
  if (kind.answer === 'hold') {
    if (!s.setting) {
      // And the first time it holds one, whoever is under that spot walks out
      // from under it -- which is the beat this whole arc was built to reach,
      // so the rock waits overhead until they are clear. See `startRescue`.
      if (S.buried && !S.rescued) { startRescue(now()); return; }
      if (S.intro === 'rescue') return;
      if (now() - s.caught >= kind.holds) { s.setting = true; S.dirty = true; }
      return;
    }
    S.rockFall = Math.max(0, S.rockFall - kind.rate * dt);
    if (S.rockFall <= 0) {
      landRock(true);
      S.rockHeld = false;
      s.setting = false;
      s.caught = 0;
      S.dirty = true;
    }
    return;
  }
  // Stone. It stops the rock dead, and then the crack runs.
  if (now() - s.caught >= kind.holds) breakShield();
}

// One frame of a shield's life. While a rock is falling, watch for its foot
// reaching the top -- the answer happens where the picture says it does, in
// the air, not at the ground. Otherwise the thing is still going up: cast by
// the tower on a clock, or carried out by the crew a piece at a time.
export function stepShield() {
  const s = S.shield;
  if (!s) return;
  const kind = KINDS[s.kind];
  if (S.rockFall > 0 || S.rockHeld) {
    if (s.caught) { answer(s, kind); return; }
    if (rockFootY() < shieldTopY(s) - P) return;
    // A shield that is not finished is not there yet. The physical ones are
    // simply in the way and are smashed for it; the dome is a spell half
    // woven, and a rock goes through where it is not yet.
    if (s.laid < kind.pieces) {
      if (kind.answer !== 'hold') breakShield();
      return;
    }
    if (kind.answer === 'through') { breakShield(); return; }
    // Everything else gets hold of it, and the yard stops and looks up: the
    // first time in this game that the thing overhead has not simply arrived.
    s.caught = now();
    s.shove = 0;
    s.held = S.rockFall;         // where it was when this took hold of it
    S.rockHeld = true;
    lookUp(kind.holds || 1200);
    S.dirty = true;
    return;
  }
}

// --- the dome's pour ----------------------------------------------------------
// The one shield with no labor from the ground in it. The wizards fly over,
// take a ring above the crown, and pour -- exactly the shape of a star's
// summoning, because it is the same act: making something out of an empty
// place with poured light. `pourDome` is fed from `stepSummon` in wizard.js,
// once a frame for all of them, so what rises is one thing being made by
// everybody in the ring rather than a share each.
export const domeRising = () =>
  !!S.shield && !!KINDS[S.shield.kind].cast && S.shield.laid < KINDS[S.shield.kind].pieces;

// Where the ring hangs: just over the crown of the dome being made.
export function domeSpot() {
  const s = S.shield;
  return { x: s.x + s.w / 2, y: S.groundY - (s.h + 4) * P };
}
export const domeOrbitR = () => P * 7;
export const domeAt = () =>
  S.shield ? Math.min(1, S.shield.laid / KINDS[S.shield.kind].pieces) : 0;

export function pourDome(hands, secs) {
  const s = S.shield;
  if (!domeRising() || hands <= 0) return;
  s.poured = (s.poured || 0) + hands * secs;
  const laid = Math.min(KINDS.dome.pieces,
                        Math.floor(KINDS.dome.pieces * s.poured / KINDS.dome.work));
  if (laid !== s.laid) { s.laid = laid; S.dirty = true; }
}
