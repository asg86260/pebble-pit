// The serpent: its four defenses, the wound held open against its heal, and
// the one door every weapon strikes it through.
//
// Damage is a rate, not a total. The wound is what the weapons have opened
// and the heal is what the serpent closes a second, so a strike slower than
// the heal never gets anywhere and a stage breaks only when the yard can hold
// the wound open to its depth (DESIGN.md, "The serpent is the rock"). The
// fourth break is the belly, and after it the serpent stays, coiled and
// healed, to be struck for its scales.
//
// Track SERPENT owns this file (docs/wave-serpent.md).

import { S } from '../state.js';
import { SERPENT_HEAL, SERPENT_WOUND, SERPENT_DEFENSE, FADE_UNLIT, SIGIL_HEAL_CUT,
         SIGIL_CUT_MAX, CURSE_CUT_MAX, SCALE_PER_DMG, SCALE_HIT_MAX,
         COIL_SEGS, BEAM_LIGHT, GRENADE_RING_S, NUM_HELD_S, NUM_HEAL_EVERY_S,
         NUM_LIFE_S, NUM_HEAL_LIFE_S, NUM_FOLD_S, NUM_FOLD_R, STUN_SHARE, STUN_BASE_S,
         STUN_MAX_S, STUN_GRACE_S, BLOW_FULL, CHIP_HEAL_S, CHIPS_MAX, rungValue } from '../config.js';
import { now } from '../clock.js';
import { nearestSeg, coilAt, coilThick, bellySeg, bellyAt } from './place.js';
import { shed } from './scales.js';

// The four defenses are 0..3; the fourth break leaves the stage at 4, which
// is struck on the last defense's column and has nothing left to heal.
const LAST = 3;
const column = () => Math.min(LAST, S.serpentStage);
const depth = () => S.serpentStage > LAST ? 0 : SERPENT_WOUND[S.serpentStage];

// The coil is lit while any wizard's beam is on it (arms.js keeps `S.beams`
// to the bodies channelling this frame).
const lit = () => S.beams.length > 0;

// What a blow did, kept a moment for the number over it (render/fightnums.js).
// A weapon that hurts while it is held (the lance, the beam) would stand a
// column of small numbers on the coil, so a body's ticks are summed into one
// entry and said when its second is up (`shut`); a grenade's burst strikes
// each length of a split coil once, and its lengths are summed into the one
// number as they land. `from` is the thing doing it -- the lance, the ring,
// the wizard. Stood over the coil's top edge where it landed, so the number
// is not born inside the white hide.
const HELD = new Set(['lance', 'beam']);
const topAt = (x, y, t) => {
  const seg = nearestSeg(x, y, t).seg;
  return coilAt(seg, t).y - coilThick(seg) / 2;
};
function keep(weapon, done, x, y, from) {
  const t = now();
  // Blows of one kind landing together on one place (a gang of brawlers
  // swinging as one) are one number, or they print over each other.
  const was = from ? S.hits.find(h => h.key === from && t < h.fold)
    : S.hits.find(h => !h.key && h.weapon === weapon && t < h.fold && Math.abs(h.x - x) <= NUM_FOLD_R);
  if (was) {
    was.done += done;
    // A held weapon's second is said where its last tick landed: the coil
    // has swayed on under a lance in a second, and the sum stood where the
    // first tick was would hang off in the water.
    if (HELD.has(weapon)) { was.x = x; was.y = topAt(x, y, t); }
    return;
  }
  const held = HELD.has(weapon);
  const shut = held ? t + NUM_HELD_S * 1000 : t;
  const fold = held ? shut : t + (weapon === 'grenade' ? GRENADE_RING_S : NUM_FOLD_S) * 1000;
  S.hits.push({ at: t, shut, fold, x, y: topAt(x, y, t), done, weapon,
                key: from || null, side: S.hits.length });
}

// How big a blow is, 0..1, on a log scale of what it did: the bite and the
// spray are both read off it, so a punch chips and a star bursts.
export const blowK = done => Math.max(0, Math.min(1, Math.log(Math.max(1, done)) / Math.log(BLOW_FULL)));

// Which edge of the body a blow bites when the one striking has not said: a
// star falls on the top, and everything else comes up from the floor.
const EDGE = { star: -1 };

// A heavy blow stuns (DESIGN.md, "Blows land: the burst and the stun"): a
// blow worth STUN_SHARE of the stage's depth, longer the more it was worth.
// A stun never stacks -- the longer of the two stands -- and none starts in
// the grace after one has ended.
function stun(blow) {
  const d = depth();
  if (!(d > 0)) return;
  const over = blow / (d * STUN_SHARE);
  if (!(over >= 1)) return;
  if (!(S.serpentStun > 0) && S.serpentGrace > 0) return;
  S.serpentStun = Math.max(S.serpentStun, Math.min(STUN_MAX_S, STUN_BASE_S * Math.sqrt(over)));
  S.serpentGrace = 0;
}

// A hit: `weapon` is a key of SERPENT_DEFENSE, `dmg` what the weapon is
// worth before the defense, (x, y) where it landed, `from` what struck it
// when it strikes more than once (above), `side` the edge it bit (-1 the
// top, 1 the underside; the weapon's own when not said). Returns the damage
// done. A hit that did nothing sheds nothing: a glancing weapon is still a
// weapon, but nothing is knocked loose by a blow that did not land. Before
// the snatch there is no serpent to hit.
//
// A blow -- anything but a held weapon's tick -- bites the hide, bursts its
// scales off that edge and may stun. A burst that strikes several lengths of
// a split coil is one blow, summed on the thing that struck them. A held
// weapon's ticks only bleed: its scales trickle off, and it never stuns
// however big it is, which is what the burst styles buy over it.
export function strike(weapon, dmg, x, y, from = null, side = 0) {
  if (!S.snatched || !(dmg > 0)) return 0;
  const table = SERPENT_DEFENSE[weapon];
  if (!table) return 0;
  let done = dmg * table[column()];
  // Fading: a coil nobody has lit is barely there to hit. The beam is the
  // light, so it is never the one dimmed.
  if (S.serpentStage === LAST && weapon !== 'beam' && !lit()) done *= FADE_UNLIT;
  if (!(done > 0)) return 0;
  // Held at the stage's depth rather than over it: the break is the frame's
  // (`stepSerpent`), and a wound past its depth is a number nothing draws.
  if (S.serpentStage <= LAST) S.serpentWound = Math.min(depth(), S.serpentWound + done);
  const n = Math.min(SCALE_HIT_MAX, Math.max(1, Math.round(done * SCALE_PER_DMG)));
  if (HELD.has(weapon)) shed(x, y, n);
  else {
    const blow = from ? (from.dealt = (from.dealt || 0) + done) : done;
    const t = now(), seg = nearestSeg(x, y, t).seg, edge = side || EDGE[weapon] || 1;
    const k = blowK(blow);
    S.serpentChips.push({ u: seg, side: edge, k, at: t });
    if (S.serpentChips.length > CHIPS_MAX) S.serpentChips.splice(0, S.serpentChips.length - CHIPS_MAX);
    // The scales leave the bitten edge, outward.
    shed(x, coilAt(seg, t).y + edge * coilThick(seg) / 2, n, { dir: edge, k });
    stun(blow);
  }
  keep(weapon, done, x, y, from);
  return done;
}

// A click in the deep, in world coordinates: true if it was the serpent's.
// It lands where the body is, not where the pointer is, so the scales come
// off the coil.
export function clickDeep(x, y) {
  if (!S.snatched) return false;
  const t = now();
  const near = nearestSeg(x, y, t);
  if (near.d > coilThick(near.seg)) return false;
  const p = coilAt(near.seg, t);
  strike('punch', rungValue('punch', S.punchLevel), p.x, p.y, null, y < p.y ? -1 : 1);
  return true;
}

export const stageOf = () => S.serpentStage;           // 0..3 the defense up, 4 freed
export const woundK = () => {                          // the wound as a fraction of the stage's depth
  const d = depth();
  return d > 0 ? Math.max(0, Math.min(1, S.serpentWound / d)) : 0;
};

// What the sigils take off the heal, 0..SIGIL_CUT_MAX, and the curse on top.
const sigilCut = () => Math.min(SIGIL_CUT_MAX, S.sigils.length * SIGIL_HEAL_CUT);
const curseCut = () => Math.min(CURSE_CUT_MAX, rungValue('curse', S.curseLevel) / 100);

// The heal this frame, after sigils and the curse, in wound a second.
export const healNow = () => S.serpentStage > LAST ? 0
  : SERPENT_HEAL[S.serpentStage] * Math.max(0, 1 - sigilCut() - curseCut());

// Which segments a beam is on, and how much of the coil that is: the fading
// coil is drawn at a low ink except where it is lit.
export function isLit(i) {
  for (const b of S.beams) if (Math.abs(b.seg - i) <= BEAM_LIGHT) return true;
  return false;
}
export function litK() {
  if (!S.beams.length) return 0;
  let n = 0;
  for (let i = 0; i < COIL_SEGS; i++) if (isLit(i)) n++;
  return n / COIL_SEGS;
}
// How much of the coil the sigils hold still, 0..1: the share of the most
// they can take off the heal.
export const boundK = () => sigilCut() / SIGIL_CUT_MAX;

// One frame of the fight: a wound the weapons held at its depth breaks the
// defense, and anything short of it closes at the heal -- unless the serpent
// is stunned, when nothing closes and the coil's sway is held back by the
// frame. The break is asked first, or the heal takes the last of the depth
// back off the blow that reached it. The circles on the floor were drawn
// against the defense they held, and go with it; a stun was measured
// against it too, and goes with it.
export const stepSerpent = c => {
  forget(c.now);
  if (!S.snatched || S.serpentStage > LAST) { S.serpentStun = S.serpentGrace = 0; return; }
  const held = S.serpentStun > 0, secs = c.dt / 1000;
  if (held) {
    S.serpentStill += c.dt;
    S.serpentStun = Math.max(0, S.serpentStun - secs);
    if (!(S.serpentStun > 0)) S.serpentGrace = STUN_GRACE_S;
  } else if (S.serpentGrace > 0) S.serpentGrace = Math.max(0, S.serpentGrace - secs);
  const d = depth();
  if (S.serpentWound < d) {
    if (held) return;
    const was = S.serpentWound;
    S.serpentWound = Math.max(0, Math.min(d, S.serpentWound - healNow() * c.dt / 1000));
    tallyHeal(was - S.serpentWound, c.now);
    return;
  }
  S.serpentStage++;
  S.serpentWound = 0;
  S.sigils = [];
  S.serpentStun = S.serpentGrace = 0;
  if (S.serpentStage > LAST) S.serpentFreed = true;
};

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

// The heal says what it actually closed, once a second, off the wound at the
// belly: the rate it could heal at says nothing while the wound is shut, and
// a sigil or the curse reads as a smaller `+`. Less than a whole one is kept
// for the next second rather than said as nothing.
function tallyHeal(closed, t) {
  S.healSum += closed;
  if (!(S.healAt > 0) || S.healAt > t + NUM_HEAL_EVERY_S * 1000) S.healAt = t + NUM_HEAL_EVERY_S * 1000;
  if (t < S.healAt) return;
  S.healAt += NUM_HEAL_EVERY_S * 1000;
  if (S.healAt <= t) S.healAt = t + NUM_HEAL_EVERY_S * 1000;
  if (Math.round(S.healSum) < 1) return;
  const p = bellyAt(t), seg = bellySeg();
  S.hits.push({ at: t, shut: t, fold: t, x: p.x, y: p.y + coilThick(seg) / 2, done: S.healSum,
                weapon: 'heal', key: null, side: Math.round(t / (NUM_HEAL_EVERY_S * 1000)) });
  S.healSum = 0;
}
