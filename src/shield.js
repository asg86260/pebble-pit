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
import { S, bench } from './state.js';
import {
  P, WORKER, ROCK_CLEAR,
  SHIELD_LEG_W, SHIELD_LID_T, SHIELD_CLEAR_C, SHIELD_PIECE_DUST,
  PROP_FROM, PROP_COST, PROP_PLANKS,
  ARCH_COST, ARCH_BLOCKS, ARCH_HOLD_MS
} from './config.js';
import { rockSize, rockFootY } from './rock.js';
import { sendOn } from './crew.js';
import { spawnSpoil } from './dust.js';
import { shadeNear } from './grid.js';
import { now } from './clock.js';

// What each shield is, and the whole of what makes it different from the
// others. A new one is an entry here and a case in the drawing.
export const KINDS = {
  // Timber. It does not even slow the rock down.
  props: { pieces: PROP_PLANKS, cost: PROP_COST, money: 'dust', holds: 0 },
  // Quarried stone. It catches one -- the yard has a moment of having won --
  // and then the crack runs and it comes down with the rock on top of it.
  arch: { pieces: ARCH_BLOCKS, cost: ARCH_COST, money: 'shard', holds: ARCH_HOLD_MS }
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
export function raiseShield(kind) {
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
  S.shield = { kind, x, w, h: clear + rise, rise, laid: 0, caught: 0 };
  S.dirty = true;
}

// One trip is one piece: fetched from the bench and walked out to whichever
// side is next, so the material visibly arrives from somewhere. One builder at
// a time, like the kit walk -- the build is a story beat, not a race, and a
// gang filing across the yard in step reads as a procession.
function sendBuilder() {
  const s = S.shield;
  if (S.workers.some(w => w.leg === 'piece' || (w.legs && w.legs.some(l => l.do === 'piece')))) return;
  let who = null, near = Infinity;
  for (const w of S.workers) {
    if (w.inside || w.inPit || w.aloft || w.walking || w.carry || w.resting) continue;
    if (w.legs && w.legs.length) continue;   // already on a commute of its own
    const d = Math.abs(w.x - bench.x);
    if (d < near) { near = d; who = w; }
  }
  if (!who) return;
  const side = s.laid % 2 ? 1 : -1;
  const at = side < 0 ? s.x - WORKER : s.x + s.w;
  sendOn(who, [
    { to: bench.x + Math.round(bench.w / 2), do: 'grab' },
    { to: at, do: 'piece' }
  ]);
}

// A piece is laid by the body that carried it -- crew.js calls this from the
// walk's last leg, and nothing else moves the count, so a shield cannot grow
// except by somebody crossing the yard.
export function layPiece() {
  const s = S.shield;
  if (!s || s.laid >= KINDS[s.kind].pieces) return;
  s.laid++;
  S.dirty = true;
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

// One frame of a shield's life. While a rock is falling, watch for its foot
// reaching the top -- the answer happens where the picture says it does, in
// the air, not at the ground. Otherwise keep a builder on the job.
export function stepShield() {
  const s = S.shield;
  if (!s) return;
  const kind = KINDS[s.kind];
  if (S.rockFall > 0 || S.rockHeld) {
    // Caught, and being held. The rock does not move while this runs -- see
    // `rockHeld` in state.js -- and when the hold is up, the crack runs: the
    // shield comes apart and the rock carries on down from where it stopped.
    if (s.caught) {
      if (now() - s.caught >= kind.holds) breakShield();
      return;
    }
    if (rockFootY() < shieldTopY(s) - P) return;
    if (!kind.holds || s.laid < kind.pieces) { breakShield(); return; }
    // A finished shield that catches: the one beat in the game where the thing
    // coming down stops before the ground.
    s.caught = now();
    S.rockHeld = true;
    lookUp(kind.holds);
    S.dirty = true;
    return;
  }
  if (s.laid < kind.pieces) sendBuilder();
}
