// The story, as one table: the opening, the reunion, the rescue, the
// cutscenes and the ending are rows of `BEATS`, in the order they may play,
// and one machine plays them (DESIGN.md, "Beats and gates: one table each").
//
// A row is `{ key, owns, when, enter, step, skip, next }`. `owns` is what the
// beat takes while it runs: the yard (nothing rolls in on its own, the crew's
// own stepping waits), the camera (the one thing allowed to point it), or the
// sheet (the ending). Two beats may run at once only with different owners --
// the rescue owns the yard while the dome's answer owns the camera -- and a
// beat whose owner is held is refused until it is free. `when` is watched
// every frame while the beat has not played; `step` returns true while it
// runs; `skip` is the click, lands the fact the beat was about, and returns
// false only when the beat has to carry on after it (a rescue cut mid-dig
// still walks the body out: nothing teleports). `next` follows straight on.
//
// The bodies of the rows live with the things they move: intro.js walks the
// pair, cutscene.js points the camera, ending.js draws the sheet. This file is
// the order and the rule, nothing else.

import { DANCE_MS } from './config.js';
import { S } from './state.js';
import { now } from './clock.js';
import { boulderAlive } from './rock.js';
import { startIntro, cutOpening, stepLeave, arriveChat, stepChat, crush, stepFall,
         startDown, stepDown, startUp, stepUp, begin, stepShow,
         startMeet, stepMeet, cutMeet, parted, stepPart, letGo,
         startRescue, stepRescue, cutRescue } from './intro.js';
import { cameraCues, play, stepShot, release } from './cutscene.js';
import { shieldUp, KINDS } from './shield.js';

const OWNERS = ['yard', 'camera', 'sheet'];

// A shield's answer is a scene on the frame the rock leaves the sky over a
// finished span of that kind: the timber breaks on the frame the rock reaches
// it, so a camera that went on the answer would see a wreck. The dome answers
// every rock, and only its first hold, the one with the rescue in it, is a
// beat.
const shieldFalls = kind => cue =>
  cue.fall && shieldUp() && S.shield.kind === kind &&
  (KINDS[kind].answer !== 'hold' || (S.buried && !S.rescued));

export const BEATS = [
  // --- the opening: two of them walk out, and a rock comes down on one ------
  // A game nobody has played: no crew, nobody under a rock, the first rock.
  { key: 'leave', owns: 'yard', next: 'chat',
    when: () => S.crew === 0 && S.workers.length === 0 && !S.buried && S.boulderNo === 1,
    enter: startIntro, step: stepLeave, skip: cutOpening },
  { key: 'chat', owns: 'yard', next: 'fall',
    when: () => false, enter: arriveChat, step: stepChat, skip: cutOpening },
  { key: 'fall', owns: 'yard', next: 'down',
    when: () => false, enter: crush, step: stepFall, skip: cutOpening },
  { key: 'down', owns: 'yard', next: 'up',
    when: () => false, enter: startDown, step: stepDown, skip: cutOpening },
  { key: 'up', owns: 'yard', next: 'show',
    when: () => false, enter: startUp, step: stepUp, skip: cutOpening },
  { key: 'show', owns: 'yard', next: null,
    when: () => false, enter: begin, step: stepShow, skip: cutOpening },

  // --- the reunion: the first rock mined out, and somebody comes over ------
  // Once the opening has been had and the first rock is dead, with its core
  // out of the way (the core comes out first: it is yours).
  { key: 'meet', owns: 'yard', next: 'part',
    when: () => beatDone('show') && S.boulderNo === 1 && !boulderAlive() && !S.coreBuried,
    enter: startMeet, step: stepMeet, skip: cutMeet },
  { key: 'part', owns: 'yard', next: null,
    when: () => false, enter: parted, step: stepPart, skip: letGo },

  // --- the rescue: the dome holds a rock off whoever is under it ----------
  { key: 'rescue', owns: 'yard', next: null,
    when: () => S.buried && !S.rescued && S.rockHeld && !!S.shield && KINDS[S.shield.kind].answer === 'hold',
    enter: startRescue, step: stepRescue, skip: cutRescue },

  // --- the hole: the tearing, and the drowning ----------------------------
  // Each is the gulp starting, which a restored save (its gulp already spent)
  // never shows, so a reload replays nothing; `drowned` says which of the two
  // moments a fresh gulp is.
  { key: 'tear', owns: 'camera', next: null,
    when: cue => cue.gulp && !S.drowned, enter: () => play('tear'), step: stepShot, skip: release },
  { key: 'drown', owns: 'camera', next: null,
    when: cue => cue.gulp && S.drowned, enter: () => play('drown'), step: stepShot, skip: release },

  // --- the shields' answers -----------------------------------------------
  { key: 'props', owns: 'camera', next: null,
    when: shieldFalls('props'), enter: () => play('props'), step: stepShot, skip: release },
  { key: 'net', owns: 'camera', next: null,
    when: shieldFalls('net'), enter: () => play('net'), step: stepShot, skip: release },
  { key: 'arch', owns: 'camera', next: null,
    when: shieldFalls('arch'), enter: () => play('arch'), step: stepShot, skip: release },
  { key: 'dome', owns: 'camera', next: null,
    when: shieldFalls('dome'), enter: () => play('dome'), step: stepShot, skip: release },

  // --- the end of the story -----------------------------------------------
  // Once the rescue's beat is over and the newcomer is one of the crew. It
  // waits for the camera because the rock is still being set down as the
  // beat ends. The sheet stands until the player picks it up (ending.js);
  // putting it down is the skip, and the crew have their dance about it.
  { key: 'ending', owns: 'sheet', next: null,
    when: () => S.rescued && !S.beat.yard && !S.beat.camera,
    enter: () => { S.dirty = true; },
    step: () => true,
    skip: () => { if (S.rockhands > 0) S.danceUntil = now() + DANCE_MS; S.dirty = true; } },
];

const ROW = new Map(BEATS.map(r => [r.key, r]));

export const beatDone = key => S.beatsDone.includes(key);
export const beatRunning = key => OWNERS.some(o => S.beat[o] === key);
export const ownsYard = () => !!S.beat.yard;
export const ownsCamera = () => !!S.beat.camera;
export const ownsSheet = () => !!S.beat.sheet;

// Played, and never again. A beat marked done while it runs is over: its
// owner is let go in the same act, so the rule in verify.js holds on the
// frame it is asked.
export function markDone(...keys) {
  for (const key of keys) {
    if (!S.beatsDone.includes(key)) S.beatsDone.push(key);
    for (const o of OWNERS) if (S.beat[o] === key) S.beat[o] = null;
  }
  S.dirty = true;
}

// Every beat a chain of `next`s reaches from this one, itself first. A skip
// finishes the whole chain: the one thing a skipped opening owes is the yard
// as it stands after all of it.
function chain(key) {
  const out = [];
  for (let k = key; k && !out.includes(k); k = ROW.get(k).next) out.push(k);
  return out;
}

function start(row, t) {
  S.beat[row.owns] = row.key;
  row.enter(t);
  S.dirty = true;
}

// Enter a beat now, whether or not its `when` has come: the boot puts the
// opening's pair at the door before the first frame is drawn, so the walk
// out is watched from the house rather than glided to. Refused, quietly, if
// it has played or its owner is held.
export function startBeat(key, t = now()) {
  const row = ROW.get(key);
  if (!row || beatDone(key) || S.beat[row.owns]) return false;
  start(row, t);
  return true;
}

// One frame of the story. The triggers are watched, not called: pit.js tears
// the rift, rift.js drowns the hole and shield.js answers a rock without
// knowing a camera exists. Every not-done row's `when` is asked, in table
// order, whether or not its owner is free, because the two cues are edges
// (the gulp starting, the rock leaving the sky) and an edge nobody looked at
// would be found still standing when the owner let go.
export function stepBeats(t) {
  const cue = cameraCues();
  for (const row of BEATS) {
    if (beatDone(row.key) || S.beat[row.owns] === row.key) continue;
    if (!row.when(cue)) continue;
    if (S.beat[row.owns]) continue;
    start(row, t);
  }
  for (const o of OWNERS) {
    const key = S.beat[o];
    if (!key) continue;
    const row = ROW.get(key);
    if (row.step(t)) continue;
    markDone(key);
    if (row.next && !beatDone(row.next)) start(ROW.get(row.next), t);
  }
  // The ground under the rock is only somewhere to get out of once something
  // is actually coming down on it -- see `dropZone`.
  S.sceneHolds = ownsYard() && !S.rockFall;
}

// The click. One owner's beat, or, with none named, everything a scene click
// means: the camera let go and the scene ended, in that order, since the
// dome's first hold is both at once. The sheet has a button of its own. True
// if anything was cut.
export function skipBeat(t = now(), owner = null) {
  const owners = owner ? [owner] : ['camera', 'yard'];
  let cut = false;
  for (const o of owners) {
    const key = S.beat[o];
    if (!key) continue;
    const row = ROW.get(key);
    cut = true;
    if (row.skip(t) === false) continue;      // it carries on, on its own legs
    markDone(...chain(key));
  }
  return cut;
}
