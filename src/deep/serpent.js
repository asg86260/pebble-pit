// The serpent: its four defenses, the wound held open against its heal (banked and landed by the meals, `deep/meals.js`), and
// the one door every fighter strikes it through.
//
// Damage is a rate, not a total. The wound is what the fighters have opened
// and the heal is what the serpent closes a second, so a strike slower than
// the heal never gets anywhere and a stage breaks only when the party can
// hold the wound open to its depth (DESIGN.md, "The serpent is the rock").
// The last break is the story's kill: the serpent comes apart, gathers itself
// again and comes back once, on its last defense at level 2 (`rise`); from
// there each bar emptied is a level: a recoil (the rear, the near-death, the
// power-up) and the bar full again a level deeper (DESIGN.md, "Endless
// serpent"; `recoil`).
//
// Track FIGHT owns this file (docs/wave-party.md).

import { S } from '../state.js';
import { SERPENT_PHASES, SCALE_PER_DECADE, SCALE_BASE, ORB_R, ORB_CLICK_X, P,
         KILL, KILL_REFORM_S,
         NUM_HELD_S, NUM_LIFE_S, NUM_HEAL_LIFE_S, NUM_FOLD_S,
         STUN_SHARE, STUN_BASE_S, STUN_MAX_S, STUN_GRACE_S, BLOW_FULL, CHIP_HEAL_S, CHIPS_MAX,
         CLICK_DMG, DAMAGE_KIND, BARRIER_FLARE_MS } from '../config.js';
import { now } from '../clock.js';
import { nearestSeg, coilAt, coilThick, bellySeg, bellyAt } from './place.js';
import { shed } from './scales.js';
import { ampOf, has, clearStatuses } from './statuses.js';
import { mealNow, turned, streamS } from './meals.js';
import { stepMechanic, resetMechanic, sunk, guardOf, breaking, stepBreak, killA, hitOrb, orbOn, orbMiddle, settleResist,
         breakOrb, recoiling, recoilLen, recoilTickAt } from './phases.js';
import { depthAt } from './depth.js';

// The defenses are 0..LAST; the last break leaves the stage past it, which
// resists nothing and has nothing left to heal.
const LAST = SERPENT_PHASES - 1;
const depth = () => S.serpentStage > LAST ? 0 : depthAt(S.serpentStage);

// What a hit did, kept a moment for the number over it (render/fightnums.js).
// Every blow is its own number, however many land together. Something that
// hurts while it is held (the beam, a bleed) is not a blow but a stream, and
// would stand a column of small numbers on the coil, so its ticks are summed
// on the thing ticking (`from`) into one entry, said when its second is up
// (`shut`); the spots of one blow that lands in several places (a
// whirlwind's cut) are summed on the blow likewise, being one blow. Stood over the coil's top edge where it
// landed, so the number is not born inside the white hide.
const topAt = (x, y, t) => {
  const seg = nearestSeg(x, y, t).seg;
  return coilAt(seg, t).y - coilThick(seg) / 2;
};
function keep(weapon, done, x, y, from, held) {
  const t = now();
  const was = from && S.hits.find(h => h.key === from && t < h.fold);
  if (was) {
    was.done += done;
    // A held thing's second is said where its last tick landed: the coil
    // has swayed on under a beam in a second, and the sum stood where the
    // first tick was would hang off in the water.
    if (held) { was.x = x; was.y = topAt(x, y, t); }
    return;
  }
  const shut = held ? t + NUM_HELD_S * 1000 : t;
  const fold = held ? shut : t + NUM_FOLD_S * 1000;
  S.hits.push({ at: t, shut, fold, x, y: topAt(x, y, t), done, weapon,
                key: from || null, side: S.hits.length });
}

// How big a blow is, 0..1, on a log scale of what it did: the bite and the
// spray are both read off it, so a punch chips and a sticky charge bursts.
export const blowK = done => Math.max(0, Math.min(1, Math.log(Math.max(1, done)) / Math.log(BLOW_FULL)));

// A stunning blow (DESIGN.md, "Blows land: the burst and the stun"): `k` is
// the move's own stretch of it (1 plain). It lasts STUN_BASE_S, longer on
// the square root of how many times over STUN_SHARE of the stage's depth the
// blow was, and never past STUN_MAX_S. A stun never stacks -- the longer of
// the two stands -- and none starts in the grace after one has ended.
// The share is of the level-1 depth, so a party's stuns last as long at every
// level: the levels grow the serpent's health and nothing else.
function stun(blow, k) {
  const d = S.serpentStage > LAST ? 0 : depthAt(S.serpentStage, 1);
  if (!(d > 0)) return;
  const over = blow / (d * STUN_SHARE);
  if (!(S.serpentStun > 0) && S.serpentGrace > 0) return;
  const s = Math.min(STUN_MAX_S, STUN_BASE_S * k * Math.sqrt(Math.max(1, over)));
  S.serpentStun = Math.max(S.serpentStun, s);
  S.serpentGrace = 0;
}

// A hit: `weapon` is a key of DAMAGE_KIND, `dmg` what it is worth before
// the phase's resist (`guardOf`), (x, y) where it landed, `from` what struck it when it strikes
// more than once (a beam, a bleed, a blow landing at several spots), `side`
// the edge it bit (-1 the top, 1 the underside, the default). `o`:
//
//   tick     a held thing's tick, not a blow: it only bleeds scales, never
//            bites the hide and never stuns, however big
//   by       the fighter whose hit it is, for its Inspired
//   stun     a stunning blow, and how far it stretches the stun (1 plain)
//   through  the phase's half does not dim it (the Mage's capstone)
//
// Returns the damage done. A hit that did nothing sheds nothing. Before the
// snatch there is no serpent to hit, and while he is sunk nothing reaches him.
export function strike(weapon, dmg, x, y, from = null, side = 0, o = {}) {
  if (!S.snatched || !(dmg > 0)) return 0;
  if (sunk() || breaking() || recoiling() || killA() != null) return 0;   // in the abyss, breaking, reeling, or down and gone (deep/phases.js)
  const kept = guardOf(weapon);
  if (kept === undefined) return 0;
  const guard = o.through ? Math.max(1, kept) : kept;
  // An explosive the barrier soaks up flares it where it burst (render/serpent.js).
  if (guard < 1 && DAMAGE_KIND[weapon] === 'explosive') {
    const t = now();
    S.barrierHits = S.barrierHits.filter(h => t - h.at < BARRIER_FLARE_MS);
    S.barrierHits.push({ x, at: t });
  }
  const done = dmg * guard * ampOf(!!o.tick, o.by);
  if (!(done > 0)) return 0;
  // Held at the stage's depth rather than over it: the break is the frame's
  // (`stepSerpent`), and a wound past its depth is a number nothing draws.
  // The constrict's orb takes the blows first (deep/phases.js).
  const through = hitOrb(done);
  if (S.serpentStage <= LAST) S.serpentWound = Math.min(depth(), S.serpentWound + through);
  const n = scalesOf(done);
  if (o.tick) shed(x, y, n);
  else {
    const blow = from ? (from.dealt = (from.dealt || 0) + done) : done;
    const t = now(), seg = nearestSeg(x, y, t).seg, edge = side || 1;
    const k = blowK(blow);
    S.serpentChips.push({ u: seg, side: edge, k, at: t });
    if (S.serpentChips.length > CHIPS_MAX) S.serpentChips.splice(0, S.serpentChips.length - CHIPS_MAX);
    // The scales leave the bitten edge, outward.
    shed(x, coilAt(seg, t).y + edge * coilThick(seg) / 2, n, { dir: edge, k });
    if (o.stun) stun(blow, o.stun);
  }
  keep(weapon, done, x, y, from, !!o.tick);
  return done;
}

// The scales a hit of `done` knocks loose.
export const scalesOf = done => Math.max(1, Math.round(SCALE_BASE + SCALE_PER_DECADE * Math.log10(done)));

// What the click is worth: the first station's rung, so the hand grows with
// the first fighter's ladder.
export const clickDmg = () => {
  const st = S.stations && S.stations[0];
  return CLICK_DMG[Math.max(0, Math.min(CLICK_DMG.length - 1, (st && st.rung) || 0))];
};

// The constrict's orb's middle if (x, y) is on it, else null. Its fighter
// stands on its station's ground, so the pointer asks this before the
// station's board (input.js).
export function onOrb(x, y) {
  const orb = orbOn(), c = orb && orbMiddle(orb.st);
  return c && Math.hypot(x - c.x, y - c.y) <= ORB_R * P ? c : null;
}

// A click in the deep, in world coordinates: true if it was the serpent's.
// It lands where the body is, not where the pointer is, so the scales come
// off the coil. Always a punch.
export function clickDeep(x, y) {
  if (!S.snatched) return false;
  const t = now();
  // On the constrict's orb, a punch several times over (deep/phases.js).
  const c = onOrb(x, y);
  if (c) { strike('punch', clickDmg() * ORB_CLICK_X, c.x, c.y); return true; }
  const near = nearestSeg(x, y, t);
  if (near.d > coilThick(near.seg)) return false;
  const p = coilAt(near.seg, t);
  strike('punch', clickDmg(), p.x, p.y, null, y < p.y ? -1 : 1);
  return true;
}

export const stageOf = () => S.serpentStage;           // 0..LAST the defense up, past it freed
export const woundK = () => {                          // the wound as a fraction of the stage's depth
  const d = depth();
  return d > 0 ? Math.max(0, Math.min(1, S.serpentWound / d)) : 0;
};

// Who hears a phase break: the fang's drop (CREW's party.js) and anything
// else that answers one. Called with the stage just reached, 1..4, on the
// frame the defense goes; the returned function stops the listening.
const breakers = [];
export function onBreak(fn) {
  if (!breakers.includes(fn)) breakers.push(fn);
  return () => { const i = breakers.indexOf(fn); if (i >= 0) breakers.splice(i, 1); };
}

// One frame of the fight: a wound the fighters held at its depth breaks the
// defense, and anything short of it closes at the heal -- unless the serpent
// is stunned, when nothing closes and the coil's sway is held back by the
// frame, or Held, when nothing closes. The break is asked first, or the heal takes the last of the
// depth back off the blow that reached it. What was laid on a defense was
// laid against it, and goes with it: the stun and every status.
export const stepSerpent = c => {
  forget(c.now);
  if (S.snatched && S.serpentFreed && stepDown(c)) return;
  if (!S.snatched || S.serpentStage > LAST) { S.serpentStun = S.serpentGrace = 0; return; }
  if (S.recoilT != null) { stepRecoil(c); return; }
  const stunned = S.serpentStun > 0, secs = c.dt / 1000;
  if (stunned) {
    S.serpentStun = Math.max(0, S.serpentStun - secs);
    if (!(S.serpentStun > 0)) S.serpentGrace = STUN_GRACE_S;
  } else if (S.serpentGrace > 0) S.serpentGrace = Math.max(0, S.serpentGrace - secs);
  if (stunned) S.serpentStill += c.dt;
  // A break playing holds everything else: no turn, no heal, no meal; the
  // meal's clock runs on so the next one is a wait after the break began.
  if (stepBreak(c)) { landTurned(c); return; }
  stepMechanic(c);
  const d = depth();
  if (S.serpentWound < d) { stepMeal(c, stunned || has('held')); return; }
  // Past the story the last defense never breaks: its bar emptied is a level.
  if (S.serpentLevel > 1 && S.serpentStage === LAST) { recoil(); return; }
  S.serpentStage++;
  S.serpentWound = 0;
  S.mealT = 0;                              // a new defense opens a new window
  S.meal++;
  S.serpentStun = S.serpentGrace = 0;
  clearStatuses();
  resetMechanic();
  settleResist(S.serpentStage);
  if (S.serpentStage > LAST) { S.serpentFreed = true; S.freedAt = c.now; }
  else S.breakT = 0;
  for (const fn of breakers.slice()) fn(S.serpentStage);
};

// --- the return -------------------------------------------------------------------
// After the story's kill the serpent is down: it goes limp and comes apart on
// the kill's own clock (`killA`), its sheet puts it down (beats.js sets
// `reformAt`), the motes gather it again over KILL_REFORM_S, and it comes back
// once, on its last defense at level 2. A sheet put down before `reformAt`
// was saved gathers as soon as the coming apart is done.
//
// A moment ahead of the clock was written by an older page (the clock starts
// again with each one) and reads as long past.
const DOWN_S = () => KILL.last + KILL.limp + KILL.apart;
const storyDone = () => S.serpentLevel > 1 || S.beatsDone.includes('freedsheet');
function stepDown(c) {
  if (S.reformAt == null) {
    if (!storyDone()) return false;
    const a = S.freedAt == null || S.freedAt > c.now ? Infinity : (c.now - S.freedAt) / 1000;
    if (a < DOWN_S()) return false;
    S.reformAt = Number.isFinite(a) ? S.freedAt + DOWN_S() * 1000 : c.now;
  }
  if (S.reformAt <= c.now && c.now - S.reformAt < KILL_REFORM_S * 1000) return false;
  rise();
  return true;
}

// Who hears the return: the kill's fang owed and not yet dropped (party.js).
const risers = [];
export function onRise(fn) {
  if (!risers.includes(fn)) risers.push(fn);
  return () => { const i = risers.indexOf(fn); if (i >= 0) risers.splice(i, 1); };
}

// The clean slate a break gives a defense: what was laid on the one before
// goes, the turn opens calm, the meal's window opens again.
function cleanSlate() {
  S.serpentWound = 0;
  S.orb = null;
  S.serpentChips = [];
  S.serpentStun = S.serpentGrace = 0;
  clearStatuses();
  resetMechanic();
  S.mealT = 0;
  S.mealI = null;
  S.meal++;
}

// Gathered whole: level 2, on its last defense, and never on another again.
export function rise() {
  S.serpentLevel = Math.max(1, S.serpentLevel | 0) + 1;
  S.serpentBest = Math.max(S.serpentBest | 0, S.serpentLevel);
  S.serpentStage = LAST;
  S.serpentFreed = false;
  S.freedAt = S.reformAt = S.breakT = S.recoilT = null;
  cleanSlate();
  S.resistBy = {};
  settleResist(LAST);
  S.shopStale = true;
  for (const fn of risers.slice()) fn(S.serpentLevel);
}

// --- the recoil -------------------------------------------------------------------
// Past the story a level's bar emptied: the serpent rears, breaks near to
// death and draws the deep in, for `recoilLen` (deep/phases.js, config
// RECOIL, NEARDEATH, POWERUP), nothing landing and nothing healing, its sway
// held where the blow caught it. The level goes up as the first mote lands
// (`recoilTickAt`), and the sequence plays on until the bar is full. What was
// laid on the level goes on its first frame, the orb with it (its fighter
// let go), and the bar's fang drops from the belly.
const recoilers = [];
export function onRecoil(fn) {
  if (!recoilers.includes(fn)) recoilers.push(fn);
  return () => { const i = recoilers.indexOf(fn); if (i >= 0) recoilers.splice(i, 1); };
}
function recoil() {
  S.recoilT = 0;
  S.serpentStun = S.serpentGrace = 0;
  clearStatuses();
  breakOrb();
  resetMechanic();
  for (const fn of recoilers.slice()) fn(S.serpentLevel);
}
// The tick is read off the clock crossing it, so a reload past it (the
// level already up, saved) never ticks it twice.
function stepRecoil(c) {
  S.serpentStill += c.dt;
  const was = S.recoilT;
  S.recoilT += c.dt / 1000;
  landTurned(c);
  if (was < recoilTickAt() && S.recoilT >= recoilTickAt()) levelUp();
  if (S.recoilT >= recoilLen()) S.recoilT = null;
}
function levelUp() {
  S.serpentLevel = Math.max(1, S.serpentLevel | 0) + 1;
  S.serpentBest = Math.max(S.serpentBest | 0, S.serpentLevel);
  cleanSlate();
  settleResist(LAST);
  S.shopStale = true;
}

// The numbers' list keeps itself: a hit goes once its number has faded; and
// so does the hide, a bite once it has closed.
function forget(t) {
  const chips = S.serpentChips;
  let m = 0;
  for (const ch of chips) if (t < ch.at + CHIP_HEAL_S * 1000) chips[m++] = ch;
  chips.length = m;
  let n = 0;
  for (const h of S.hits) {
    if (t < h.shut + (h.weapon === 'heal' ? NUM_HEAL_LIFE_S : NUM_LIFE_S) * 1000) S.hits[n++] = h;
  }
  S.hits.length = n;
}

// The heal is banked as it accrues (stopped, as it always was, by a stun or
// Held) and closes the wound in one lump when the meal lands: the serpent
// swallows what swam in, and the lump goes in at the belly. The clock runs
// whatever is on the serpent, so a creature comes either way; only the bank
// is what the stun and Held stop. A lump under a whole one is not said.
function stepMeal(c, stopped) {
  // The window's clock: stopped by a stun or Held, and let be once the
  // creature has turned for the mouth.
  const clock = streamS(c.now);
  if (S.mealI == null) S.mealT += (stopped ? 0 : 1) * c.dt / 1000;
  else S.mealT += c.dt / 1000;
  const meal = mealNow(clock);
  if (S.mealI == null && turned(meal.toLand)) S.mealI = meal.i;
  if (meal.toLand <= 0) land(c, meal, true);
}
// A creature that turned for the mouth before a break is still eaten, during
// it: the new defense is whole already, so it closes nothing.
function landTurned(c) {
  if (S.mealI == null) return;
  const meal = mealNow(streamS(c.now));
  if (meal.toLand <= 0) land(c, meal, false);
}
// The swallow at the belly: the wound closed whole (DESIGN.md, "The serpent
// heals whole"), and the number said where it lands.
function land(c, meal, heals) {
  S.mealT = Math.max(0, -meal.toLand);
  S.meal++;
  S.eaten = [...(S.eaten || []), meal.i].slice(-EATEN_KEPT);
  S.mealI = null;
  S.mealLandedAt = c.now;
  const closed = heals ? S.serpentWound : 0;
  S.serpentWound -= closed;
  if (Math.round(closed) < 1) return;
  const p = bellyAt(c.now), seg = bellySeg();
  S.hits.push({ at: c.now, shut: c.now, fold: c.now, x: p.x, y: p.y + coilThick(seg) / 2, done: closed,
                weapon: 'heal', key: null, side: S.meal });
}
// How many eaten creatures are remembered: more than can be in the water at once.
const EATEN_KEPT = 12;
