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
  ARCH_COST, ARCH_BLOCKS, ARCH_HOLD_MS, ARCH_CATCH_SHAKE,
  DOME_BILL, DOME_RINGS, DOME_WORK, DOME_HOLD_MS, DOME_SET_RATE,
  SHIELD_WAVE_MS, SHIELD_WAVE_SPAN, SHIELD_WAVE_POWER, SHIELD_CHEER_MS, MAGIC_TONES
} from './config.js';
import { rockSize, rockFootY, landRock } from './rock.js';
import { workOn } from './works.js';
import { spawnSpoil } from './dust.js';
import { shadeNear } from './grid.js';
import { now, frames } from './clock.js';
import { startRescue } from './intro.js';
import { shakeView } from './world.js';
import { sfx } from './audio.js';
import { shockAt } from './shock.js';

// What each shield is, and the whole of what makes it different from the
// others: what it is made of, what it costs, and how it answers a rock. A new
// one is an entry here and a case in the drawing -- nothing below asks which
// kind it is holding.
//
// The four run dust, spore, shard, then everything: each is bought in the coin
// of the station before it, and each failure opens the station after it --
// DESIGN.md, "The shields are the spine". And the answers escalate, which is
// what keeps three failures from being one failure told three times -- not
// noticed, slowed, stopped, held. There was a jack once, steel on rams,
// between the arch and the dome; it was cut when the failures became doors,
// because there was no station for steel to open.
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
  // Magic, and the end of the argument. Cast rather than carried: the wizards
  // fly over and pour it, the way they pour a star into an empty sky, and its
  // progress is their pouring -- see `pourDome`.
  dome: { pieces: DOME_RINGS, bill: DOME_BILL, answer: 'hold',
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

// It stands. A thing this dear going up a plank at a time earned a moment
// when the last one is in: a wave goes out from the crown -- the crit's ring,
// sized to the span, and purple for the dome because magic is -- and the
// crew cheer under it, the dance they do for a finished rock, kept short. The
// dome's comes from `pourDome` on the frame its last ring is poured; the
// other three arrive finished, so theirs is here.
function fanfare(s) {
  const magic = !!KINDS[s.kind].cast;
  shockAt(s.x + s.w / 2, shieldTopY(s), SHIELD_WAVE_POWER, s.kind,
          { ms: SHIELD_WAVE_MS, r: s.w * SHIELD_WAVE_SPAN,
            color: magic ? MAGIC_TONES[0] : undefined });
  S.danceUntil = Math.max(S.danceUntil, now() + SHIELD_CHEER_MS);
}

export function raiseShield(kind) {
  // A built shield arrives finished, because the building already happened: it
  // is a work like any other now (works.js) -- paid for, fenced, hammered at
  // by a lent body under a bar, and this is the row's `buy` running when the
  // last of that labor is in. The dome is the exception both ways: nothing is
  // hammered and nobody is lent, the tower pours it on its own clock.
  const laid = KINDS[kind].cast ? 0 : KINDS[kind].pieces;
  S.shield = { ...shieldPlan(kind), laid, poured: 0, caught: 0, held: 0, strain: 0,
               sag: 0, setting: false };
  if (laid >= KINDS[kind].pieces) fanfare(S.shield);
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
// the arch's crown -- and `strain` climbs from
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
  // How near it is to going: for a thing that holds and then cracks, how much
  // of its hold is spent; for the rope, which never holds and only pays out,
  // how far down its payout the rock has ridden. The rope used to be read off
  // a hold it does not have, which put it at one on the frame it caught -- the
  // whole payout at full tremble, shedding as hard as an arch a beat from
  // cracking.
  s.strain = kind.holds ? (now() - s.caught) / kind.holds
           : s.held > 0 ? (s.held - S.rockFall) / s.held : 1;
  s.strain = Math.max(0, Math.min(1, s.strain));
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
      // It waits overhead only while somebody is still in the ground under
      // it. The moment they are up and walking it starts down -- the walk out
      // from under is half a second and the descent is six, so the two of
      // them have their beat under a rock coming down beside them rather than
      // stood about waiting for it. It used to wait for the whole beat, and
      // the scene was two things in a row that should have been one.
      if (S.intro === 'rescue' && S.buried) return;
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
    s.held = S.rockFall;         // where it was when this took hold of it
    S.rockHeld = true;
    // Stone stops it dead, and a rock stopping dead is an arrival: the view
    // takes the knock and the yard hears it, smaller than the ground's. The
    // rope only slows it and the dome holds it, and neither of those is a
    // landing.
    if (kind.answer === 'crack') {
      shakeView(ARCH_CATCH_SHAKE);
      sfx('arch-catch', { x: s.x + s.w / 2, hard: 1, big: true });
    }
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
// How far along the dome is, for the drawing: off the pour itself rather than
// off the count of rings, so the shell creeps up as they pour instead of
// jumping a ring every couple of seconds. The count is what the game plays
// against; the pour is what the eye sees.
export const domeAt = () => {
  const s = S.shield;
  if (!s) return 0;
  const k = KINDS[s.kind];
  if (!k.cast) return Math.min(1, s.laid / k.pieces);
  return Math.min(1, s.laid >= k.pieces ? 1 : (s.poured || 0) / k.work);
};

export function pourDome(hands, secs) {
  const s = S.shield;
  if (!domeRising() || hands <= 0) return;
  s.poured = (s.poured || 0) + hands * secs;
  const laid = Math.min(KINDS.dome.pieces,
                        Math.floor(KINDS.dome.pieces * s.poured / KINDS.dome.work));
  if (laid !== s.laid) {
    s.laid = laid;
    if (laid >= KINDS.dome.pieces) fanfare(s);
    S.dirty = true;
  }
}
