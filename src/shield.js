// The shields: everything the yard puts between itself and the sky (DESIGN.md,
// "The shields"). One mechanism, four kinds: a footprint over the landing
// spot, a build, and an answer when the next rock reaches it. Everything a
// kind does differently is a field in KINDS. A shield failing is never a
// bill: `dropZone` has walked the crew clear, and the wreck mines back as
// dust.
import { S } from './state.js';
import {
  P, ROCK_CLEAR, ROCK_FLANK_CLEAR,
  SHIELD_LEG_W, SHIELD_LID_T, SHIELD_CLEAR_C, SHIELD_PIECE_DUST,
  PROP_FROM, PROP_COST, PROP_PLANKS,
  NET_COST, NET_ROPES, NET_SLOW,
  ARCH_COST, ARCH_BLOCKS, ARCH_HOLD_MS, ARCH_CATCH_SHAKE,
  DOME_BILL, DOME_RINGS, DOME_WORK, DOME_HOLD_MS, DOME_SET_RATE,
  DOME_BOUNCE_C, DOME_FLOOR_C, DOME_FADE_MS, ARCH_SPAN, DOME_SPAN, DROP_GRAV, WORKER,
  SHIELD_WAVE_MS, SHIELD_WAVE_SPAN, SHIELD_WAVE_POWER, SHIELD_CHEER_MS, MAGIC_TONES, SHIELD_GATES
} from './config.js';
import { rockSize, rockFootY, landRock } from './rock.js';
import { workOn } from './works.js';
import { spawnSpoil } from './dust.js';
import { shadeNear } from './grid.js';
import { now, frames } from './clock.js';
// The yard's one generator, never `Math.random`, or a run cannot be had again
// from its seed.
import { rand } from './rng.js';
import { startRescue, buriedOut } from './intro.js';
import { shakeView, rockEdge } from './world.js';
import { sfx } from './audio.js';
import { shockAt } from './shock.js';

// What each shield is made of, what it costs, and how it answers a rock. A
// new one is an entry here and a case in the drawing. The answers escalate:
// not noticed, slowed, stopped, held.
export const KINDS = {
  props: { pieces: PROP_PLANKS, cost: PROP_COST, money: 'dust', answer: 'through' },
  // Rope catches the rock and then pays out under it, all the way to the ground.
  net: { pieces: NET_ROPES, cost: NET_COST, money: 'spore', answer: 'sag', rate: NET_SLOW },
  // Stone catches one and then the crack runs.
  arch: { pieces: ARCH_BLOCKS, cost: ARCH_COST, money: 'shard',
          answer: 'crack', holds: ARCH_HOLD_MS },
  // Cast rather than carried: the wizards pour it (`pourDome`).
  dome: { pieces: DOME_RINGS, bill: DOME_BILL, answer: 'hold',
          cast: true, work: DOME_WORK, holds: DOME_HOLD_MS, rate: DOME_SET_RATE }
};

export const shieldKind = () => S.shield && KINDS[S.shield.kind];
export const shieldUp = () => !!S.shield && S.shield.laid >= KINDS[S.shield.kind].pieces;
export const shieldDone = kind => S.shieldsDone.includes(kind);
// Whether the door a shield opens is open: the shield has failed, or, with
// the shields not doors (SHIELD_GATES), the place before it stands. Every
// station and kit gate reads this rather than `shieldDone`, so the pacing is
// one knob. BEFORE keeps the chain (props -> farm -> net -> quarry -> arch ->
// tower) with the gates off; answering yes to everything put the farm, the
// quarry and the tower on the bench together off a single core.
const BEFORE = { props: () => true, net: () => S.farmOpen,
                 arch: () => S.quarryOpen, dome: () => S.towerOpen };
export const shieldOpened = kind =>
  SHIELD_GATES ? shieldDone(kind) : (BEFORE[kind] || (() => true))();

// The top of whatever is standing: the thing the rock reaches first.
export const shieldTopY = (s = S.shield) => S.groundY - s.h * P;

// Which rock a shield planned now will meet: the one in the air, if there is
// one, else the one after the one on the ground.
const rockToMeet = () => S.rockFall > 0 ? S.boulderNo : S.boulderNo + 1;

// Sized against the rock it has to answer, measured, never tuned: wide enough
// for its footprint and clearance, tall enough to stand over the bigger of
// the rock here and the one coming, with daylight over the peak so the crew
// climb under it rather than into it.
export function shieldPlan(kind) {
  const was = S.boulderNo;
  S.boulderNo = rockToMeet();
  const size = rockSize();
  S.boulderNo = was;
  const rockW = size.w * P;
  let w = rockW + ROCK_CLEAR * 2 + SHIELD_LEG_W * P * 2;
  // The curved kinds are a set share wider than the rock (ARCH_SPAN,
  // DOME_SPAN): their crown is the catch line, and a rock nearly as wide as
  // the span perches on the apex. Even cells, so the middle stays on the
  // grid; and nothing stands closer to the building on the flank than the
  // rock itself may.
  const span = kind === 'arch' ? ARCH_SPAN : kind === 'dome' ? DOME_SPAN : 0;
  if (span) {
    const cells = Math.ceil(rockW * span / P / 2) * 2;
    w = Math.max(w, cells * P);
  }
  w = Math.min(w, rockW + ROCK_FLANK_CLEAR * 2);
  const x = Math.round((S.cx - w / 2) / P) * P;
  const clear = Math.max(S.gh, size.h) + SHIELD_CLEAR_C;
  // The shape decides the height: an arch's curve rises a quarter of the span
  // above the piers (the shallow curve a mason gets away with), and a dome is
  // a half-circle on the span.
  const rise = kind === 'arch' ? Math.round(w / P / 4) : 0;
  const h = kind === 'dome' ? Math.max(clear, Math.round(w / P / 2)) : clear + rise;
  return { kind, x, w, h, rise };
}

// It stands: a wave from the crown and a short cheer. The dome's comes from
// `pourDome` on the frame its last ring is poured; the other three arrive
// finished, so theirs is in `raiseShield`.
function fanfare(s) {
  const magic = !!KINDS[s.kind].cast;
  shockAt(s.x + s.w / 2, shieldTopY(s), SHIELD_WAVE_POWER, s.kind,
          { ms: SHIELD_WAVE_MS, r: s.w * SHIELD_WAVE_SPAN,
            color: magic ? MAGIC_TONES[0] : undefined });
  S.danceUntil = Math.max(S.danceUntil, now() + SHIELD_CHEER_MS);
}

export function raiseShield(kind) {
  // A built shield arrives finished: this is the row's `buy` running when the
  // labor is in (works.js). The dome is poured after.
  const laid = KINDS[kind].cast ? 0 : KINDS[kind].pieces;
  S.shield = { ...shieldPlan(kind), laid, poured: 0, caught: 0, held: 0, strain: 0,
               sag: 0, rising: false, rested: 0, setting: false, fading: 0 };
  if (laid >= KINDS[kind].pieces) fanfare(S.shield);
  refitShield();
  S.dirty = true;
}

// A standing shield is re-sized for the rock that is now going to reach it,
// on `makeBoulder` (rock.js) and on raising, so the plan is never older than
// the rock it is about; a half-built shield may widen under the builders, which
// beats a rock that overhangs it. Nothing with a rock on it is touched.
export function refitShield() {
  const s = S.shield;
  if (!s || s.caught || s.fading) return;
  const { x, w, h, rise } = shieldPlan(s.kind);
  if (x === s.x && w === s.w && h === s.h && rise === s.rise) return;
  Object.assign(s, { x, w, h, rise });
  S.dirty = true;
}

// The ground a shield's build stands on (`siteBox` in works.js): the same
// footprint `raiseShield` will use, so the tape goes up around exactly it.
export function shieldGround() {
  const { x, w } = shieldPlan('props');
  return { x, w };
}

// The shield going up right now, and how far through its work the builders
// are; the drawing raises it in step with the labor.
export function risingShield() {
  for (const kind of Object.keys(KINDS)) {
    if (KINDS[kind].cast) continue;                 // the dome rises off its own clock
    const w = workOn(kind);
    if (w) return { ...shieldPlan(kind), done: w.of ? Math.min(1, w.done / w.of) : 0 };
  }
  return null;
}

// It comes apart into spoil thrown along the heap. The kind is remembered as
// answered, so its row never returns.
export function breakShield() {
  const s = S.shield;
  if (!s) return;
  const top = shieldTopY(s);
  const grains = s.laid * SHIELD_PIECE_DUST;
  for (let i = 0; i < grains; i++) {
    const px = s.x + rand() * s.w;
    const py = top + rand() * P * SHIELD_LID_T;
    spawnSpoil(px, py, shadeNear(3), 'rock');
  }
  if (!S.shieldsDone.includes(s.kind)) S.shieldsDone.push(s.kind);
  S.shield = null;
  S.rockHeld = false;
  S.dirty = true;
}

// A thing under a load it cannot take shakes and sheds. `strain` climbs from
// nought to one across the hold; the drawing reads it for the shake, and the
// shedding happens here because a falling cell is a chip and chips belong to
// the yard. The warning is honest: by the time it is throwing grit it *is*
// about to go.
function strainOn(s, kind) {
  // For a thing that holds and then cracks, how much of its hold is spent;
  // for the rope, which only pays out, how far down its payout the rock has
  // ridden (read off a hold it does not have, the rope was at one on the
  // frame it caught).
  s.strain = kind.holds ? (now() - s.caught) / kind.holds
           : s.held > 0 ? (s.held - S.rockFall) / s.held : 1;
  s.strain = Math.max(0, Math.min(1, s.strain));
  // more of it, and faster, the nearer it is to going
  if (rand() > 0.08 + s.strain * 0.5) return;
  const top = shieldTopY(s) + (s.sag || 0) * P;
  const px = s.x + rand() * s.w;
  // Thrown along the heap, never dropped where it is: dropped, it piled up
  // inside the footprint where the rock was about to be.
  spawnSpoil(px, top, shadeNear(3), 'rock');
}

// The yard stops and looks up: everybody on the ground, the set the landing
// itself marks.
function lookUp(ms) {
  const at = now();
  for (const w of S.workers) {
    if (w.inside || w.inPit || w.aloft) continue;
    w.say = { mark: 'bang', until: at + ms };
  }
}

// Whether the one dug out is still under the rock's footprint on its walk
// clear (intro.js, `getOut`). A scripted square, not a worker, so `dropZone`
// cannot move it; the rock waits on it instead.
const underneath = () => {
  if (S.intro !== 'rescue') return false;
  const b = S.pair[0];
  return !!b && b.x + WORKER > rockEdge(-1) && b.x < rockEdge(1);
};

// What a shield does once it has hold of a rock: one frame of it, and the
// only place the kinds differ in behavior rather than in looks.
function answer(s, kind) {
  const dt = frames() / 60;
  // A thing that is holding does not shed.
  if (kind.answer !== 'hold') strainOn(s, kind);
  // Rope only slows the rock: when the sag reaches the ground the rock
  // finishes its arrival.
  if (kind.answer === 'sag') {
    S.rockFall = Math.max(0, S.rockFall - kind.rate * dt);
    // In courses, kept as a fraction rather than rounded: the drawing rounds
    // per column, so a deepening sag rolls down the span a cell at a time
    // instead of every strand stepping together.
    s.sag = (s.held - S.rockFall) / P;
    if (S.rockFall <= 0) { breakShield(); landRock(); }
    return;
  }
  // The dome gives (the rock springs back up and settles), holds for a beat,
  // then lets it down gently. Its state is put back rather than thrown away:
  // until the rescue is done it stands for the next one, and then
  // `stepShield` starts the fade.
  if (kind.answer === 'hold') {
    // The first hold digs out whoever is under that spot; `startRescue` sends
    // the digger, and where the rock lets itself down to is below.
    if (S.buried && !S.rescued && S.intro !== 'rescue') startRescue(now());
    // The spring is the fall run backward, settled by hand at the end so a
    // rounding error cannot leave it a hair off where it was caught.
    if (s.rising) {
      const f = frames();
      S.rockFallV += DROP_GRAV * f;
      S.rockFall -= S.rockFallV * f;
      if (S.rockFall <= s.held) {
        S.rockFall = s.held;
        S.rockFallV = 0;
        s.rising = false;
        s.rested = now();
      }
      return;
    }
    if (!s.setting) {
      if (now() - (s.rested || s.caught) < kind.holds) return;
      s.setting = true;
      S.dirty = true;
    }
    // Where it may come down to: the ground while nobody is under it,
    // otherwise as far as the dig is far along and never below a few courses
    // over whoever is still in the ground or walking out. Only ever at the
    // set rate, so it creeps rather than jumps.
    const floor = DOME_FLOOR_C * P;
    const want = S.buried ? floor + (s.held - floor) * (1 - buriedOut())
               : underneath() ? floor : 0;
    S.rockFall = Math.max(want, S.rockFall - kind.rate * dt);
    if (S.rockFall <= 0) {
      landRock(true);
      S.rockHeld = false;
      s.setting = false;
      s.caught = 0;
      s.rested = 0;
      S.dirty = true;
    }
    return;
  }
  // Stone stops the rock dead, and then the crack runs.
  if (now() - s.caught >= kind.holds) breakShield();
}

// One frame of a shield's life. The answer happens where the picture says it
// does: in the air, when the rock's foot reaches the top.
export function stepShield() {
  const s = S.shield;
  if (!s) return;
  const kind = KINDS[s.kind];
  // The dome comes down once the rescue is over, read off the facts rather
  // than the frame so an older save left standing fades too. It goes into
  // `shieldsDone` like the kinds that broke, so its row never returns.
  if (kind.answer === 'hold' && S.rescued && S.intro !== 'rescue' && !s.caught && !s.fading) {
    s.fading = now();
    S.dirty = true;
  }
  if (s.fading) {
    if (now() - s.fading >= DOME_FADE_MS) {
      if (!S.shieldsDone.includes(s.kind)) S.shieldsDone.push(s.kind);
      S.shield = null;
      S.dirty = true;
    }
    return;                      // a fading dome catches nothing
  }
  if (S.rockFall > 0 || S.rockHeld) {
    if (s.caught) { answer(s, kind); return; }
    if (rockFootY() < shieldTopY(s) - P) return;
    // An unfinished physical shield is in the way and is smashed; an
    // unfinished dome is not there yet, and the rock goes through.
    if (s.laid < kind.pieces) {
      if (kind.answer !== 'hold') breakShield();
      return;
    }
    if (kind.answer === 'through') { breakShield(); return; }
    s.caught = now();
    s.held = S.rockFall;         // where it was when this took hold of it
    S.rockHeld = true;
    // A rock stopping dead is an arrival; slowed or held is not.
    if (kind.answer === 'crack') {
      shakeView(ARCH_CATCH_SHAKE);
      sfx('arch-catch', { x: s.x + s.w / 2, hard: 1, big: true });
    }
    // The dome gives: the rock is sent back up with the speed a fall of
    // DOME_BOUNCE_C cells would have given it, and gravity does the rest.
    if (kind.answer === 'hold') {
      s.rising = true;
      S.rockFallV = -Math.sqrt(2 * DROP_GRAV * DOME_BOUNCE_C * P);
    }
    lookUp(kind.holds || 1200);
    S.dirty = true;
    return;
  }
}

// --- the dome's pour ----------------------------------------------------------
// The one shield with no labor from the ground in it: the same act as a
// star's summoning. `pourDome` is fed from `stepSummon` in wizard.js, once a
// frame for all of them.
export const domeRising = () =>
  !!S.shield && !!KINDS[S.shield.kind].cast && !S.shield.fading &&
  S.shield.laid < KINDS[S.shield.kind].pieces;

// How far a dome has faded, nought to one, for the shell's alpha.
export const domeFade = (s = S.shield) =>
  s && s.fading ? Math.min(1, (now() - s.fading) / DOME_FADE_MS) : 0;

// Where the ring hangs: just over the crown of the dome being made.
export function domeSpot() {
  const s = S.shield;
  return { x: s.x + s.w / 2, y: S.groundY - (s.h + 4) * P };
}
export const domeOrbitR = () => P * 7;
// How far along the dome is, for the drawing: off the pour rather than the
// count of rings, so the shell creeps up instead of jumping a ring at a time.
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
