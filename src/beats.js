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
// still walks the body out: nothing teleports); a sheet with nothing to land
// has none, and is put down all the same. `next` follows straight on.
//
// The bodies of the rows live with the things they move: intro.js walks the
// pair, cutscene.js points the camera, ending.js draws the sheet. This file is
// the order and the rule, nothing else.

import { demoOn } from './demo.js';
import { shieldDone } from './shield.js';
import { DANCE_MS, RESCUE_SHEET_HOLD_S } from './config.js';
import { S } from './state.js';
import { now } from './clock.js';
import { boulderAlive } from './rock.js';
import { startIntro, cutOpening, stepLeave, arriveChat, stepChat, crush, stepFall,
         startDown, stepDown, startUp, stepUp, begin, stepShow,
         startMeet, stepMeet, cutMeet, parted, stepPart, letGo,
         startRescue, stepRescue, cutRescue } from './intro.js';
import { cameraCues, play, stepShot, release, dropShot, stepHush } from './cutscene.js';
import { abyssDue, startAbyss, stepAbyss, cutAbyss, endAbyss } from './abyssintro.js';
import { snatchDue, startSnatch, stepSnatch, cutSnatch, startFreed, stepFreed, cutFreed, serpentOn, deepOn } from './snatch.js';
import { shieldUp, KINDS } from './shield.js';
import { setZoomNow, clampCam } from './world.js';
import { firstMuckDue, startFirstMuck } from './firstmuck.js';
import { startFinale, stepFinale, cutFinale, sheetDown, workPaused } from './finale.js';
import { afterlifeOn, hellOn, owed, paid } from './acts.js';
import { WALL_BEATS } from './hell/story.js';
import { actBody, actDue } from './actbeats.js';

const OWNERS = ['yard', 'camera', 'sheet'];

// An act's beat (DESIGN.md, "Acts 3 and 4", "The story, beat by beat"): its
// body is actbeats.js's placeholder cutscene (which calls the act's own story
// file on the way in), its trigger its own fact there (`actDue`) or a key
// owed (acts.js, `__actOwe`), and only with its act's switch on. A beat
// `next` follows is never set off by a trigger of its own. Every one owns the
// camera, not the yard: owning the yard holds the yard's crew still, and
// everything keeps running (the owner's call 1). The pair a beat needs held
// are held by its own facts (actbeats.js, "Who a beat holds").
// The body is made on first use: actbeats.js and this file import each other.
const actBeat = on => (key, next = null, first = true) => {
  let made = null;
  const body = () => (made ??= actBody(key, next));
  return {
    key, owns: 'camera', next,
    when: first ? () => on() && (owed(key) || actDue(key)) : () => false,
    enter: t => { paid(key); body().enter(t); },
    step: t => body().step(t),
    skip: t => body().skip(t)
  };
};
const after = actBeat(afterlifeOn);
const hell = actBeat(hellOn);

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
  // Each is the gulp owed, which a restored save (its gulp already spent)
  // never shows, so a reload replays nothing; `riftDue` says which of the two
  // moments it is, and the moment waits for the camera (rift.js, `due`).
  { key: 'tear', owns: 'camera', next: null,
    when: cue => cue.gulp && S.riftDue === 'tear', enter: () => play('tear'), step: stepShot, skip: release },
  { key: 'drown', owns: 'camera', next: null,
    when: cue => cue.gulp && S.riftDue === 'drown', enter: () => play('drown'), step: stepShot, skip: release },

  // --- the shields' answers -----------------------------------------------
  { key: 'props', owns: 'camera', next: null,
    when: shieldFalls('props'), enter: () => play('props'), step: stepShot, skip: release },
  { key: 'net', owns: 'camera', next: null,
    when: shieldFalls('net'), enter: () => play('net'), step: stepShot, skip: release },
  { key: 'arch', owns: 'camera', next: null,
    when: shieldFalls('arch'), enter: () => play('arch'), step: stepShot, skip: release },
  { key: 'dome', owns: 'camera', next: null,
    when: shieldFalls('dome'), enter: () => play('dome'), step: stepShot, skip: release },

  // --- the first muck (firstmuck.js) -------------------------------------
  // After the first storm that left muck, the first body to go for it.
  { key: 'firstmuck', owns: 'camera', next: null,
    when: () => firstMuckDue(),
    enter: () => { startFirstMuck(); play('firstmuck'); }, step: stepShot, skip: release },

  // --- the end of the story -----------------------------------------------
  // Once the rescue's beat is over and the newcomer is one of the crew. It
  // waits for the camera because the rock is still being set down as the
  // beat ends. The sheet stands until the player picks it up (ending.js);
  // putting it down is the skip, and the crew have their dance about it --
  // unless the pit has drowned and the half is on, when what comes next is
  // the snatch.
  // With the half on there is no button: the sheet stands RESCUE_SHEET_HOLD_S
  // and the story carries on into the snatch (ending.js floats it away).
  { key: 'ending', owns: 'sheet', next: null,
    when: () => S.rescued && !S.beat.yard && !S.beat.camera,
    enter: t => { S.endingAt = t; },
    step: t => {
      if (!S.endingAt) S.endingAt = t;
      return !(serpentOn() && t - S.endingAt >= RESCUE_SHEET_HOLD_S * 1000);
    },
    skip: () => { if (S.rockhands > 0 && !(S.drowned && serpentOn())) S.danceUntil = now() + DANCE_MS; } },

  // --- the demo's end (DESIGN.md, "Three builds") ------------------------
  // The net failed in the demo: the sheet that points to the full game,
  // stood until it is put down (ending.js); the yard plays on behind it.
  { key: 'demoend', owns: 'sheet', next: null,
    when: () => demoOn() && shieldDone('net') && !S.beat.yard && !S.beat.camera,
    enter: () => {}, step: () => true },

  // --- the teaser's end (DESIGN.md, "Three builds") ------------------------
  // On the free build the snatch plays and the wizards are asked; what they
  // would answer is the paid game's. The sheet that says so, stood until it is
  // put down (ending.js).
  { key: 'teaseend', owns: 'sheet', next: null,
    when: () => serpentOn() && !deepOn() && S.snatched && S.askedWizards && !S.beat.yard && !S.beat.camera,
    enter: () => {}, step: () => true },

  // --- the second half (snatch.js; docs/wave-serpent.md, "The story") -----
  // The serpent takes him: once the sqwife is out and the pit has drowned,
  // whichever was second, and once only.
  { key: 'snatch', owns: 'yard', next: null,
    when: snatchDue, enter: startSnatch, step: stepSnatch, skip: cutSnatch },
  // And the camera pulled in on the plank while it plays (cutscene.js).
  { key: 'snatchcam', owns: 'camera', next: null,
    when: () => S.beat.yard === 'snatch', enter: () => play('snatchcam'), step: stepShot, skip: release },
  // The last defense broken: the kill, and him out and back with her
  // (snatch.js). A skip plays it out at once. The story's serpent's only: a
  // kill after it is the kill alone (DESIGN.md, "Endless serpent").
  { key: 'freed', owns: 'yard', next: 'finale',
    when: () => S.serpentFreed && S.serpentLevel <= 1, enter: startFreed, step: stepFreed, skip: cutFreed },
  // And straight on, the two of them going home (finale.js): her gear hung
  // on her station and taken up, up through the portal and the length of
  // the yard with the crew behind them, to the sunset. With nobody handed
  // over it is done on its first frame. A skip plays the rest faster.
  { key: 'finale', owns: 'yard', next: null,
    when: () => false, enter: startFinale, step: stepFinale, skip: cutFinale },
  // The first trip down (abyssintro.js): on the arrival, the ripple done,
  // the camera on him in the cage and then on her first blow. A skip lets
  // the camera go and her with it; she swims to her own work.
  { key: 'abyss', owns: 'camera', next: null,
    when: cue => cue.arrive && abyssDue(),
    enter: t => { startAbyss(t); play('abyss'); },
    step: abyssShot, skip: () => { cutAbyss(); return release(); } },
  // And the sheet that says so, stood until it is put down (ending.js), over
  // the sunset still held. Put down, the serpent gathers itself again
  // (render/serpent.js) and the yard is let go (finale.js).
  { key: 'freedsheet', owns: 'sheet', next: null,
    when: () => beatDone('finale') && !S.beat.yard && !S.beat.camera,
    enter: () => {},
    step: () => true,
    skip: t => { S.reformAt = t; sheetDown(); } },

  // --- act 3: the afterlife (after/story.js), behind AFTERLIFE_ON ----------
  // The fall and the opening, played through as one story; the axe on its
  // own; the strike and what it uncovers, through to the road down.
  after('house-fall', 'arrive'),
  after('arrive', 'meet-god', false),
  after('meet-god', 'refuse', false),
  after('refuse', null, false),
  after('axe'),
  after('strike', 'unmask'),
  after('unmask', 'hell-told', false),
  after('hell-told', 'ghost-road', false),
  after('ghost-road', null, false),

  // --- act 4: hell (hell/story.js), behind HELL_ON ---------------------------
  // The return as ghosts; the first descent and the first attempt; a fall for
  // each barrier but the cage; the cage's fall and the way home.
  hell('haunt'),
  hell('descend', 'wall-first'),
  hell('wall-first', null, false),
  ...WALL_BEATS.map(k => hell(k)),
  hell('unchain', 'alive'),
  hell('alive', 'home-again', false),
  hell('home-again', null, false),

  // --- the end: the mansion's sheet (actbeats.js, mansionsheet.js) -----------
  // Once the freed souls have gathered at the mansion, stood until put down.
  { key: 'mansionsheet', owns: 'sheet', next: null,
    when: () => hellOn() && !!S.acts && S.acts.ended && !S.beat.yard && !S.beat.camera,
    enter: () => {}, step: () => true },
];

const ROW = new Map(BEATS.map(r => [r.key, r]));

// The first trip down's frame: the scene says where to look, the shot frames
// it, and its end lets the camera go.
function abyssShot(t) {
  const s = stepAbyss(t);
  if (s.gone) { dropShot(); endAbyss(); return false; }
  if (s.over) release();
  if (stepShot(t, s.want)) return true;
  endAbyss();
  return false;
}

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
}

// The beats, on the save (persist.js, `SAVERS`). Only the camera's beat is
// written, and only until it has been seen through; the yard's beats come
// back by their own triggers (the opening from the door, the rescue from the
// dome's next hold) and the sheet by its fact. `beatsDone` is a plain saved
// field; `read` only takes back what a save mid-chain must play again.
export const SAVE = {
  fields: ['beat'],
  write(out) {
    // A scene on its way out has let go as far as the player is concerned,
    // so it is written down as seen: its cue was an edge, and a reload that
    // dropped it from both would leave it neither playing nor played.
    const leaving = S.shot && S.shot.out;
    out.beat = { camera: S.beat.camera && !leaving ? S.beat.camera : null };
    if (S.beat.camera && leaving && Array.isArray(out.beatsDone) && !out.beatsDone.includes(S.beat.camera))
      out.beatsDone = [...out.beatsDone, S.beat.camera];
  },
  read(s) {
    // A chain of beats (the opening, the reunion) is one story: a save taken
    // partway through it does not write the yard's beat down, so the beats
    // it had played come off the set and the story starts over from its
    // first.
    // A chain of camera beats (the acts') is told on from the camera beat the
    // save names, so the beats before it in that chain stay played.
    const cam = typeof s.beat?.camera === 'string' ? s.beat.camera : null;
    const done = new Set(S.beatsDone);
    for (const row of BEATS) {
      let end = row;
      const keys = [row.key];
      while (end.next) { end = BEATS.find(r => r.key === end.next); keys.push(end.key); }
      if (end !== row && !done.has(end.key) && !(cam && keys.indexOf(cam) > 0)) done.delete(row.key);
    }
    S.beatsDone = [...done];
    // A scene the last sitting closed the tab on is the running camera beat,
    // played once over the event as it now stands.
    const owed = typeof s.beat?.camera === 'string' ? s.beat.camera : null;
    const camera = BEATS.find(r => r.key === owed && r.owns === 'camera' && !done.has(owed));
    S.beat = { yard: null, camera: camera ? camera.key : null, sheet: null };
    // A yard read back with no scene owed is a yard nothing holds: a page
    // opens on it with no bands and nothing receded.
    if (!S.beat.camera) { S.hush = 0; S.hushOn = false; }
    // A shot of some other scene is the old yard's; the same scene, still
    // standing in this process, carries on rather than starting over. The
    // view's center is kept across the zoom going back, the way the scene's
    // own way out keeps it: a seat let go by its left edge slides off the
    // thing it was looking at by half the width it gained.
    if (S.shot && S.shot.name !== S.beat.camera) {
      const center = S.camX + S.viewW / 2;
      S.shot = null;
      setZoomNow(1);
      S.camX = center - S.viewW / 2;
      clampCam();
    }
  },
  blank() {}
};

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
    // While the finale holds the yard nothing else starts but its sheet.
    if (workPaused() && row.key !== 'freedsheet') continue;
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
  // And the yard held around whatever now has it (cutscene.js), read off
  // the owners this frame left standing.
  stepHush(t);
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
    if (row.skip?.(t) === false) continue;    // it carries on, on its own legs
    markDone(...chain(key));
  }
  return cut;
}
