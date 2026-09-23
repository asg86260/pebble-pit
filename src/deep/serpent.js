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
         SIGIL_CUT_MAX, CURSE_CUT_MAX, SCALE_PER_DMG, SCALE_HIT_MAX, COIL_THICK,
         COIL_SEGS, BEAM_LIGHT, rungValue } from '../config.js';
import { now } from '../clock.js';
import { nearestSeg, coilAt } from './place.js';
import { shed } from './scales.js';

// The four defenses are 0..3; the fourth break leaves the stage at 4, which
// is struck on the last defense's column and has nothing left to heal.
const LAST = 3;
const column = () => Math.min(LAST, S.serpentStage);
const depth = () => S.serpentStage > LAST ? 0 : SERPENT_WOUND[S.serpentStage];

// The coil is lit while any wizard's beam is on it (arms.js keeps `S.beams`
// to the bodies channelling this frame).
const lit = () => S.beams.length > 0;

// A hit: `weapon` is a key of SERPENT_DEFENSE, `dmg` what the weapon is
// worth before the defense, (x, y) where it landed. Returns the damage done.
// A hit that did nothing sheds nothing: a glancing weapon is still a weapon,
// but nothing is knocked loose by a blow that did not land. Before the
// snatch there is no serpent to hit.
export function strike(weapon, dmg, x, y) {
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
  shed(x, y, Math.min(SCALE_HIT_MAX, Math.max(1, Math.round(done * SCALE_PER_DMG))));
  return done;
}

// A click in the deep, in world coordinates: true if it was the serpent's.
// It lands where the body is, not where the pointer is, so the scales come
// off the coil.
export function clickDeep(x, y) {
  if (!S.snatched) return false;
  const t = now();
  const near = nearestSeg(x, y, t);
  if (near.d > COIL_THICK) return false;
  const p = coilAt(near.seg, t);
  strike('punch', rungValue('punch', S.punchLevel), p.x, p.y);
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
// defense, and anything short of it closes at the heal. The break is asked
// first, or the heal takes the last of the depth back off the blow that
// reached it. The circles on the floor were drawn against the defense they
// held, and go with it.
export const stepSerpent = c => {
  if (!S.snatched || S.serpentStage > LAST) return;
  const d = depth();
  if (S.serpentWound < d) {
    S.serpentWound = Math.max(0, Math.min(d, S.serpentWound - healNow() * c.dt / 1000));
    return;
  }
  S.serpentStage++;
  S.serpentWound = 0;
  S.sigils = [];
  if (S.serpentStage > LAST) S.serpentFreed = true;
};
