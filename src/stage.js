// Who is in a scene, and what the rest of the yard does while it plays.
//
// While a scene holds the yard (cutscene.js, `stepHush`) every body on it is
// one of three things to it:
//
//   lead   what the scene is about: the one who dug and the one dug out, the
//          body the first muck follows, her on her first trip down, her at
//          the kill, anybody at all in the opening. Drawn in full ink over
//          the receded yard (render/recede.js).
//   held   an attacker -- the rock's gang, a fighter in the deep. It stops
//          where it is and holds its pose for as long as the scene holds,
//          and picks up again from the same spot and the same swing after.
//          Its work is paused, not dropped: nothing it was doing is lost and
//          nothing is done twice.
//   by     everybody else: haulers and every other bystander. They carry on
//          with their day, faded out of the picture while the scene holds
//          and back in as it lets go, so a body comes back from wherever its
//          own legs took it. Nothing is walked off and nothing teleports.
//
// The snatch's portal waits for the bystanders to have faded (`stageClear`).

import { WORKER } from './config.js';
import { S } from './state.js';
import { TYPE } from './jobs.js';
import { onYard, stand } from './crew/body.js';
import { swim } from './deep/arms.js';
import { meetAt } from './snatch.js';
import { finaleCast } from './finale.js';

// The opening is two bodies on an empty yard, and whoever is there is in it.
const OPENING = new Set(['leave', 'chat', 'fall', 'down', 'up', 'show']);
const ATTACKS = new Set([TYPE.ROCK, TYPE.FIGHTER]);

// Her at the kill: the first station's fighter, whom he walks out to
// (snatch.js, `herX`).
const herAtKill = w => S.beat.yard === 'freed' && !!S.stations?.[0] && w.type === TYPE.FIGHTER && w.station === S.stations[0].id;

export function roleOf(w) {
  if (w.cast || w.met || w.dig || OPENING.has(S.beat.yard)) return 'lead';
  if (S.muckScene && w.uid === S.muckScene.uid) return 'lead';
  if (S.abyss && S.abyss.freeAt == null && w.uid === S.abyss.uid) return 'lead';
  if (herAtKill(w)) return 'lead';
  // The finale's: the two of them, the one taking up her gear, and in the
  // yard the whole crew, who are its crowd (finale.js).
  if (finaleCast(w)) return 'lead';
  return ATTACKS.has(w.type) ? 'held' : 'by';
}

// A lead stays one until the yard is all the way back (`w.cast`, kept by
// `stepHush`): the rescue's pair are two of the crew again before its
// camera lets go, and faded out with the haulers then they would leave the
// scene empty on its last beat.
export function keepCast() {
  for (const w of S.workers) if (!w.cast && roleOf(w) === 'lead') w.cast = true;
}
export function dropCast() {
  for (const w of S.workers) if (w.cast) delete w.cast;
}

// A stage of a body's frame (crew/step.js): an attacker stood still while a
// scene holds. Under the falls and the hand, which no scene interrupts; a
// body in the way of a rock coming down is let go to get out from under it.
export function holdStill(w, c) {
  if (!S.hushOn || roleOf(w) !== 'held') return false;
  if (c.zone && onYard(w) && w.x + WORKER > c.zone.from && w.x < c.zone.to) return false;
  if (onYard(w)) w.y = stand(w);
  return true;
}

// Her at the kill, out of her station's glass to meet him where the two of
// them can be seen (snatch.js, `meetAt`), with nothing in her hands; let go
// with the beat, her own work swims her back to her post.
export function meetHim(w) {
  const m = herAtKill(w) ? meetAt() : null;
  if (!m) return false;
  w.pose = null;
  w.beam = null;
  swim(w, m.x, m.y);
  return true;
}

// Whether the frame holds nobody but the pair: the bystanders faded out.
export const stageClear = () => S.hush >= 1;
