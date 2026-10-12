// The shields: everything the yard puts between itself and the sky (DESIGN.md,
// "The shields"). One mechanism, four kinds: a footprint over the landing
// spot, a build, and an answer when the next rock reaches it. Everything a
// kind does differently is a field in KINDS. A shield failing is never a
// bill: `dropZone` has walked the crew clear, and the wreck mines back as
// dust.
import { belowYard } from './route.js';
import { S, floor } from './state.js';
import { P, shieldWidth, ROCK_SINK, ROCK_CLEAR, ROCK_FLANK_CLEAR, SHIELD_LEG_W, SHIELD_LID_T, SHIELD_CLEAR_C, SHIELD_PIECE_DUST, PROP_COST, PROP_PLANKS, NET_COST, NET_ROPES, NET_SLOW, ARCH_COST, ARCH_BLOCKS, ARCH_HOLD_MS, ARCH_CATCH_SHAKE, DOME_BILL, DOME_RINGS, DOME_WORK, DOME_FADE_MS, DOME_BURST_MS, DOME_SQUASH, DOME_BURST_GRAV, DOME_BURST_SPEED, DOME_BURST_FLING, DOME_BURST_LIFT, DOME_BURST_POP, DOME_BURST_JITTER, DOME_SLIDE_KEEP, ARCH_SPAN, DOME_SPAN, SHIELD_WAVE_MS, SHIELD_WAVE_SPAN, SHIELD_WAVE_POWER, SHIELD_CHEER_MS, MAGIC_TONES } from './config.js';
import { rockSize, rockFootY, landRock, lumpCells, depthOf, clearBoulder, tipRockSand } from './rock.js';
import { workOn } from './works.js';
import { spawnSpoil, spawnChip } from './dust.js';
import { shadeNear, depthShade, surfaceY, colOf } from './grid.js';
import { now, frames } from './clock.js';
// The yard's one generator, never `Math.random`, or a run cannot be had again
// from its seed.
import { rand } from './rng.js';
import { beatRunning } from './beats.js';
import { shakeView, rockLeft } from './world.js';
import { sfx } from './audio.js';
import { shockAt } from './shock.js';
import { open, shieldBefore } from './stations.js';

// What each shield is made of, what it costs, and how it answers a rock. A
// new one is an entry here and a case in the drawing. The answers escalate:
// not noticed, slowed, stopped, burst. (The dome's answer is still called
// 'hold': it does take hold of the rock, for the held beat before the burst,
// and the rescue beat starts on that hold.)
export const KINDS = {
  props: { pieces: PROP_PLANKS, cost: PROP_COST, money: 'dust', answer: 'through' },
  // Rope catches the rock and then pays out under it, all the way to the ground.
  net: { pieces: NET_ROPES, cost: NET_COST, money: 'spore', answer: 'sag', rate: NET_SLOW },
  // Stone catches one and then the crack runs.
  arch: { pieces: ARCH_BLOCKS, cost: ARCH_COST, money: 'shard',
          answer: 'crack', holds: ARCH_HOLD_MS },
  // Cast rather than carried: the wizards pour it (`pourDome`).
  dome: { pieces: DOME_RINGS, bill: DOME_BILL, answer: 'hold',
          cast: true, work: DOME_WORK, holds: DOME_BURST_MS }
};

export const shieldUp = () => !!S.shield && S.shield.laid >= KINDS[S.shield.kind].pieces;
export const shieldDone = kind => S.shieldsDone.includes(kind);
// Whether the door a shield stands before is open: the shields are not
// doors, so it is whether the place before it stands (`shieldBefore`, off the
// table in stations.js; the props stand before nothing). The kit gates read
// this rather than `shieldDone`, so the pacing is one knob.
export const shieldOpened = kind => { const k = shieldBefore(kind); return !k || open(k); };

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
  const w = shieldWidth(kind, rockW);
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
               sag: 0, fading: 0 };
  if (laid >= KINDS[kind].pieces) fanfare(S.shield);
  refitShield();
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
    if (w.inside || w.inPit || w.aloft || belowYard(w)) continue;   // the deep's never see it
    w.say = { mark: 'bang', until: at + ms };
  }
}

// --- the dome's burst ---------------------------------------------------------
// The dome takes hold of the rock on its crown for one held beat, squashed
// there (`domeSquash`), and then the rock comes apart into its own grains: the
// lump's cells as drawn, each one's grains in its own tone, flung out from the
// crown. They skate down the shell (`slideOnDome`) and come down outside it as
// ordinary dust, which the haulers carry to the hole. The grains are the
// rock's sheets, a grain a sheet as a pick takes them, so the burst hands the
// yard exactly what mining the rock would have: nothing made, nothing lost.

// How squashed the rock on the crown is: the held pose, the whole beat.
export const domeSquash = () => {
  const s = S.shield;
  return s && KINDS[s.kind].cast && s.caught && S.rockHeld ? DOME_SQUASH : 0;
};

function burstRock(s) {
  const a = s.w / 2;                       // the shell's radius
  const ox = s.x + a, crownY = S.groundY - a;
  const left = rockLeft(), top = rockFootY() - S.gw * P;
  const deep = depthOf();
  const cells = lumpCells();
  let owed = 0;
  for (const row of S.boulder) for (const v of row) owed += v;
  let thick = 0;
  for (const c of cells) thick += c.v;
  // Radii a second into world pixels a frame, and radii a second a second
  // into world pixels a frame a frame.
  const perS = a / 60, g = DOME_BURST_GRAV * a / 3600;
  const [lo, hi] = DOME_BURST_SPEED;
  const [pop0, pop1] = DOME_BURST_POP;
  // The rock's sheets shared over the lump's cells by thickness, the running
  // total floored so the shares add up to the sheets exactly.
  let sum = 0, given = 0;
  for (const c of cells) {
    sum += c.v;
    const due = thick ? Math.floor(sum * owed / thick) : 0;
    const n = due - given;
    given = due;
    const cx = left + c.x * P + P / 2, cy = top + c.y * P + P / 2;
    const dx = cx - ox, dy = crownY - cy, len = Math.hypot(dx, dy) || 1;
    const shade = depthShade(c.v, deep);
    for (let k = 0; k < n; k++) {
      const sp = (lo + rand() * (hi - lo)) * perS;
      const vx = dx / len * sp * DOME_BURST_FLING + (rand() - 0.5) * 2 * DOME_BURST_JITTER * perS;
      const up = dy / len * sp * DOME_BURST_LIFT + (pop0 + rand() * (pop1 - pop0)) * perS;
      spawnChip(cx - P / 2, cy - P / 2, vx, -up, shade);
      const ch = S.chips[S.chips.length - 1];
      ch.g = g;
      ch.dome = true;
    }
  }
  // Whatever lay on the rock goes on the heap while there is a rock to say
  // where it was, and then the rock is gone the one way a rock goes.
  tipRockSand();
  clearBoulder();
  S.rockFall = 0;
  S.rockFallV = 0;
  S.rockHeld = false;
  s.caught = 0;
  s.held = 0;
  s.burstAt = now();                       // for the flare down the band
  sfx('dome-burst', { x: ox, hard: 1, big: true });
}

// One frame of a burst grain against the shell: a grain that has come down
// on to it is put back on its surface and keeps only the speed along it, less
// a little, so it skates down the curve and leaves at the feet. Measured to
// the grain's middle half a cell outside the footprint, so a grain at the foot
// lands on the first column clear of it. Called from the chip loop (game.js)
// for the grains `burstRock` threw.
export function slideOnDome(ch, f) {
  const s = S.shield;
  if (!s || !KINDS[s.kind].cast) { ch.dome = false; return; }
  const a = s.w / 2, ox = s.x + a, R = a + P / 2;
  const cx = ch.x + P / 2, up = S.groundY - (ch.y + P / 2);
  if (up <= 0) return;
  const dx = cx - ox, d = Math.hypot(dx, up);
  if (d >= R || d === 0) return;
  const nx = dx / d, ny = up / d;
  ch.x = ox + nx * R - P / 2;
  ch.y = S.groundY - ny * R - P / 2;
  // About to come down beside a foot, it comes down clear of it: the ground
  // takes a grain by the column its left edge is in, and a grain hugging the
  // shell low on the right still has that edge a hair inside.
  if (ch.y + P >= surfaceY(floor, colOf(floor, ch.x)) - P)
    ch.x = dx > 0 ? Math.max(ch.x, s.x + s.w) : Math.min(ch.x, s.x - P);
  let vUp = -ch.vy;
  const vn = ch.vx * nx + vUp * ny;
  if (vn < 0) { ch.vx -= vn * nx; vUp -= vn * ny; }
  const keep = Math.pow(DOME_SLIDE_KEEP, f / 60);
  ch.vx *= keep;
  ch.vy = -vUp * keep;
}

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
  // The dome: the held beat, then the burst. The dome itself is untouched:
  // until the rescue is done it stands for the next one, and then
  // `stepShield` starts the fade.
  if (kind.answer === 'hold') {
    if (now() - s.caught >= kind.holds) burstRock(s);
    return;
  }
  // Stone stops the rock dead, and then the crack runs.
  if (now() - s.caught >= kind.holds) breakShield();
}

// The shield, on the save (persist.js, `SAVERS`): the standing one field by
// field (the live one carries more than a save should), the set that have
// answered, and the catch taken again once the rock's fall has been read.
export const SAVE = {
  fields: ['shield', 'shieldsDone'],
  write(out) {
    out.shield = S.shield && { kind: S.shield.kind, x: S.shield.x, w: S.shield.w,
                               h: S.shield.h, rise: S.shield.rise, laid: S.shield.laid,
                               // So a re-caught rock picks up where the rope was.
                               strain: S.shield.strain || 0, sag: S.shield.sag || 0,
                               caughtAgo: S.shield.caught ? Math.max(0, Math.round(now() - S.shield.caught)) : null };
    out.shieldsDone = [...S.shieldsDone];
  },
  read(s) {
    // The catch is taken again below, once the rock's fall has been read.
    S.shield = s.shield ? { kind: s.shield.kind, x: s.shield.x, w: s.shield.w,
                            h: s.shield.h, rise: s.shield.rise || 0,
                            laid: s.shield.laid || 0, caught: 0, held: 0,
                            strain: 0, sag: 0,
                            poured: 0, fading: 0 } : null;
    // What is woven is the fact; the wizard-seconds behind it are worked
    // back out of it.
    if (S.shield && KINDS[S.shield.kind].cast) {
      const k = KINDS[S.shield.kind];
      S.shield.poured = (S.shield.laid / k.pieces) * k.work;
    }
    S.shieldsDone = Array.isArray(s.shieldsDone) ? s.shieldsDone : [];
    S.rockHeld = false;
    // A rock that was in the shield's hands is in them still, or it falls
    // the rest of the way on its own, lands inside the net without the net
    // giving up, and `shieldsDone` never gets the word. Only a finished
    // shield of a kind that catches; the rock goes through anything else
    // anyway.
    if (S.shield && S.rockFall > 0) {
      const k = KINDS[S.shield.kind];
      if (S.shield.laid >= k.pieces && k.answer !== 'through' && s.shield.caughtAgo != null && Number.isFinite(+s.shield.caughtAgo)) {
        // `held` is the catch height (where a falling rock's foot meets the
        // shield's top, as in `stepShield`), not where the rock is now, or
        // every refresh would have the rope start straining from nothing.
        S.shield.caught = now() - (+s.shield.caughtAgo || 0);
        S.shield.held = (S.shield.h + 1) * P + ROCK_SINK;
        S.shield.strain = +s.shield.strain || 0;
        S.shield.sag = +s.shield.sag || 0;
        S.rockFallV = 0;
        S.rockHeld = true;
      }
    }
  },
  blank() {
    S.shield = null;
    S.shieldsDone = [];
    S.rockHeld = false;
  }
};

// One frame of a shield's life. The answer happens where the picture says it
// does: in the air, when the rock's foot reaches the top.
export function stepShield() {
  const s = S.shield;
  if (!s) return;
  const kind = KINDS[s.kind];
  // The dome comes down once the rescue is over, read off the facts rather
  // than the frame so an older save left standing fades too. It goes into
  // `shieldsDone` like the kinds that broke, so its row never returns.
  if (kind.answer === 'hold' && S.rescued && !beatRunning('rescue') && !s.caught && !s.fading) {
    s.fading = now();
  }
  if (s.fading) {
    if (now() - s.fading >= DOME_FADE_MS) {
      if (!S.shieldsDone.includes(s.kind)) S.shieldsDone.push(s.kind);
      S.shield = null;
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
    // The dome stops it dead on the crown for the held beat (`answer`).
    if (kind.answer === 'hold') S.rockFallV = 0;
    lookUp(Math.max(kind.holds || 0, 1200));
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
  }
}
