// Life seen through the rift: between the tear and the drowning, now and then
// something crosses the sky on the other side of the disc. Mostly the deep's
// creatures -- a shoal far off as dark shapes, or one of them nearer in its
// own tones -- and rarely the serpent himself: a length of his coil, his
// crest along the bottom of the window, or his eye right up against it.
// Whatever is crossing when he is due darts off ahead of him first. The
// owner's pick was the combined option of the mock
// (docs/mocks/rift-life-2026-10-12.html on mock/rift-life).
//
// A picture and nothing else: no hit area, no sound, nothing in the yard
// reads it. What is kept is what is crossing (`S.riftLife`) and when the next
// creature and the next serpent are due (`S.riftLifeNext`,
// `S.riftLifeSerpentAt`), all thrown away on a reload with the clock they are
// written on, so a crossing in progress does not come back and the first
// waits its minute again.
//
// Only one thing is ever behind the tear, so "never two at once" is the slot
// itself. The shapes are worked out as cells in render/riftlife.js; what is
// here is when, which, and how long each takes to cross.

import { P, FLOW_KINDS, FLOW_LENGTHS,
         RIFTLIFE_FIRST_S, RIFTLIFE_GAP_S, RIFTLIFE_SERPENT_FIRST_S, RIFTLIFE_SERPENT_GAP_S, RIFTLIFE_SERPENTS,
         RIFTLIFE_SPEED, RIFTLIFE_SCALE, RIFTLIFE_STEP_S, RIFTLIFE_SHOAL_SHARE, RIFTLIFE_SHOAL_N,
         RIFTLIFE_SHOAL_BACK, RIFTLIFE_SHOAL_DY, RIFTLIFE_SHOAL_DEPTHS, RIFTLIFE_SINGLE_DEPTHS,
         RIFTLIFE_LANE, RIFTLIFE_ENTER, RIFTLIFE_FLEE, RIFTLIFE_COIL, RIFTLIFE_EYE } from './config.js';
import { S } from './state.js';
import { stream } from './rng.js';
import { riftRadius } from './rift.js';
import { glimpseHeld } from './glimpse.js';

// Its own chance, so a picture never moves the yard off its stream.
const roll = stream(0x41f71fe);
const pick = list => list[Math.floor(roll() * list.length)];
const between = ([a, b]) => a + roll() * (b - a);
const side = () => (roll() < 0.5 ? -1 : 1);

// The disc's radius in cells, read off its seat as it stands.
export const riftR = () => riftRadius() / P;

// Its own clock, in held steps: nothing about it moves between them.
export const heldS = (s, step = RIFTLIFE_STEP_S) => Math.floor(s / step) * step;

export const isSerpent = e => e.kind !== 'cross';

// --- how far, how long ----------------------------------------------------------
// A crossing's front, in cells from the disc's middle, `lt` seconds in: from
// ENTER cells outside the rim on the side it comes in, a whole cell a step at
// its depth's pace, and three times that from the dart-off on.
export function lead(e, lt) {
  const v = RIFTLIFE_SPEED[e.d];
  const run = e.flee != null && lt > e.flee ? e.flee * v + (lt - e.flee) * v * RIFTLIFE_FLEE : lt * v;
  return -e.dir * (e.R + RIFTLIFE_ENTER) + e.dir * Math.floor(run);
}
// How far behind the front the last of it trails, in cells.
const spanOf = e => Math.max(...e.members.map(([k, back]) => back + FLOW_LENGTHS[k] * RIFTLIFE_SCALE[e.d]));

// Seconds from coming in to gone out the far side.
export function lifeLen(e) {
  if (e.kind === 'eye') return RIFTLIFE_EYE.len;
  if (e.kind !== 'cross') {
    const c = RIFTLIFE_COIL[e.kind];
    return (2 * e.R + 2 + c.enter + c.len) / c.v;
  }
  const v = RIFTLIFE_SPEED[e.d], dist = 2 * e.R + 2 * RIFTLIFE_ENTER + spanOf(e);
  if (e.flee == null) return dist / v;
  const before = e.flee * v;
  return before >= dist ? dist / v : e.flee + (dist - before) / (v * RIFTLIFE_FLEE);
}

// --- what crosses ---------------------------------------------------------------
// A shoal (silhouettes, far or middle) or one creature in its own tones
// (middle or near); `o` pins any of it, for a scene.
function creature(shoal, o) {
  const d = o.d ?? pick(shoal ? RIFTLIFE_SHOAL_DEPTHS : RIFTLIFE_SINGLE_DEPTHS);
  const members = [];
  if (shoal) {
    const n = o.n ?? RIFTLIFE_SHOAL_N[0] + Math.floor(roll() * (RIFTLIFE_SHOAL_N[1] - RIFTLIFE_SHOAL_N[0] + 1));
    let back = 0;
    for (let i = 0; i < n; i++) {
      members.push([Math.floor(roll() * FLOW_KINDS), back,
                    Math.round((roll() * 2 - 1) * RIFTLIFE_SHOAL_DY)]);
      back += Math.round(between(RIFTLIFE_SHOAL_BACK));
    }
  } else members.push([o.of ?? Math.floor(roll() * FLOW_KINDS), 0, 0]);
  return { kind: 'cross', shoal, d, members, y: o.y ?? (roll() * 2 - 1) * RIFTLIFE_LANE };
}

// Starts one now (or `into` seconds along): 'shoal', 'creature', or one of
// the serpent's. What a scene forces; the schedule calls it too. The camera
// it starts under is kept, so it slides with its own sky as the yard pans.
export function startRiftLife(kind, t, o = {}) {
  const e = kind === 'shoal' || kind === 'creature' ? creature(kind === 'shoal', o)
          : kind === 'eye' ? { kind } : { kind, y: o.y ?? (roll() * 2 - 1) };
  e.dir = o.dir ?? side();
  e.R = riftR();
  e.at = t - (o.into || 0) * 1000;
  e.flee = null;
  e.camX = S.camX; e.camY = S.camY;
  S.riftLife = e;
  return e;
}

// --- when ---------------------------------------------------------------------------
// Nothing with the story holding the yard or the camera, the camera in the
// deep or on its way, or the tear still gulping the hole down.
export const riftLifeHeld = () => glimpseHeld() || S.riftGulp > 0;

// Only while torn: and a rescued yard's undrowned rift is only ever the swell
// on the way to the drowning, which is given nothing.
const torn = () => S.riftOpen && !S.drowned && !S.rescued;

export function stepRiftLife(t) {
  if (!torn()) {
    S.riftLife = S.riftLifeNext = S.riftLifeSerpentAt = null;
    return;
  }
  // The first sight of the tear starts both waits.
  if (S.riftLifeNext == null) {
    S.riftLifeNext = t + (RIFTLIFE_FIRST_S + between(RIFTLIFE_GAP_S)) * 1000;
    S.riftLifeSerpentAt = t + (RIFTLIFE_FIRST_S + between(RIFTLIFE_SERPENT_FIRST_S)) * 1000;
  }
  const e = S.riftLife;
  if (riftLifeHeld()) {
    if (e) {
      S.riftLife = null;
      if (!isSerpent(e)) S.riftLifeNext = Math.max(S.riftLifeNext, t + between(RIFTLIFE_GAP_S) * 1000);
    }
    return;
  }
  const due = t >= S.riftLifeSerpentAt;
  if (e) {
    const lt = (t - e.at) / 1000;
    if (lt < lifeLen(e)) {
      // He is coming: whatever is crossing darts off ahead of him.
      if (due && !isSerpent(e) && e.flee == null) e.flee = heldS(lt);
      return;
    }
    S.riftLife = null;
  }
  if (due) {
    const s = startRiftLife(pick(RIFTLIFE_SERPENTS), t);
    S.riftLifeSerpentAt = t + between(RIFTLIFE_SERPENT_GAP_S) * 1000;
    S.riftLifeNext = Math.max(S.riftLifeNext, t + (lifeLen(s) + RIFTLIFE_GAP_S[0]) * 1000);
    return;
  }
  if (t < S.riftLifeNext) return;
  startRiftLife(roll() < RIFTLIFE_SHOAL_SHARE ? 'shoal' : 'creature', t);
  S.riftLifeNext = t + between(RIFTLIFE_GAP_S) * 1000;
}
