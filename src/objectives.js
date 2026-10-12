// The story's objectives (DESIGN.md, "The story's objectives"): one line, the
// next step of the story in a few words. Every step is a fact the save already
// holds, so an old save opens on the right line, and nothing waits on it: the
// story never follows the line, the line follows the story.
//
// The yard's half only; the line on the page is objline.js.

import { demoOn } from './demo.js';
import { PAST_DEMO } from './config.js';
import { S } from './state.js';
import { shieldDone } from './shield.js';
import { serpentOn } from './snatch.js';
import { beatDone } from './beats.js';
import { open } from './stations.js';

// In the order they come. `done` is the fact that finishes a step, and it
// must imply every step before it (a fact that can come early, like the pit
// drowning or the tower standing, is asked together with the one it follows); `when`, if
// it has one, is whether the step is part of this story at all. The first
// step not done is the line. `row` is the shop row the step is bought
// through: the card under the line sells it (objbarrier.js).
export const STEPS = [
  { key: 'rock', say: 'dig the boulder to save your sqwife!', done: () => S.boulderNo > 1 || beatDone('meet'),
    // the intro's quest (DESIGN.md, "Quests under the story's line")
    quest: [
      { key: 'chip', say: 'mine the boulder', done: () => !!S.handChipped },
      { key: 'pickup', say: 'grab a pebble', done: () => !!S.seenDrag },
      { key: 'toss', say: 'toss the pebble into the pit', done: () => S.banked > 0 },
    ] },
  { key: 'falling', say: 'try to dig the boulder again!', done: () => S.boulderNo > 1 },
  { key: 'props', row: 'props', say: 'maybe building a wooden roof will stop the next boulder?', done: () => shieldDone('props') || S.rescued },
  // A place step (no line of its own): the barrier that just fell opened the
  // next place, so the card sells it before the next barrier. It is done when
  // the place stands (or the barrier after it has fallen), so a place already
  // open is skipped.
  { key: 'farm', row: 'unlockfarm', place: 'farm', say: '', done: () => open('farm') || shieldDone('net') || !!S.rescued },
  { key: 'net', row: 'net', say: 'nope, try catching the boulder and slowing it down', done: () => shieldDone('net') || S.rescued },
  { key: 'quarry', row: 'unlockquarry', place: 'quarry', say: '', done: () => open('quarry') || shieldDone('arch') || !!S.rescued },
  { key: 'arch', row: 'arch', say: "lets try building an arch from the mined ore and stone. surely that's sturdy enough.", done: () => shieldDone('arch') || S.rescued },
  { key: 'buytower', row: 'unlocktower', place: 'tower', say: '', done: () => open('tower') || shieldDone('dome') || !!S.rescued },
  { key: 'dome', row: 'dome', say: 'out of options, lets see if the wizards can help.', done: () => shieldDone('dome') || S.rescued },
  { key: 'rescue', say: 'save your sqwife', done: () => !!S.rescued },
  // The second half: the snatch waits on the pit drowning, then the way down
  // is the wizards', and the portal is a row on their board.
  { key: 'drown', say: 'drown the pit', when: serpentOn, done: () => (!!S.drowned && !!S.rescued) || !!S.snatched },
  { key: 'snatch', say: '', when: serpentOn, done: () => !!S.snatched },
  { key: 'tower', say: 'build the wizards\' tower', when: serpentOn, done: () => !!S.snatched && (!!S.towerOpen || !!S.portalOpen) },
  { key: 'ask', say: 'ask the wizards how to get down', when: serpentOn,
    done: () => !!S.snatched && (!!S.askedWizards || S.portalPour > 0 || !!S.portalOpen) },
  { key: 'portal', say: "conjure a portal to the abyss, what's down there?", when: serpentOn, done: () => !!S.snatched && (S.portalPour > 0 || !!S.portalOpen) },
  { key: 'free', say: 'free your sqhusband from the serpent\'s belly', when: serpentOn, done: () => !!S.serpentFreed },
];

// The step the story is on, or null once it is told: the first step after
// the last one done, so a later fact always stands for the steps before it (a
// sqwife out means the shields are behind you, whatever this save recorded of
// them). The snatch has no line: nothing the player does starts it, so while
// it is due the line is empty rather than a thing to do. A place step has no
// line either, only its row, and it is the step from the moment the barrier
// before it falls, before the bench offers the place: the goal shows with its
// bill and a dimmed buy (the owner, 2026-10-10), so the card is never empty
// between one barrier and the next.
export function objective() {
  // the demo's line ends with the net; its last sheet says the rest
  const cut = demoOn() ? PAST_DEMO : [];
  const live = STEPS.filter(s => (!s.when || s.when()) && !cut.includes(s.key));
  let from = 0;
  live.forEach((s, i) => { if (s.done()) from = i + 1; });
  const next = live[from];
  return next && (next.say || next.place) ? next : null;
}

// The quest under the step the line is on, item by item with whether each is
// done, or null when the step has none or every item is done.
export function questNow() {
  const step = objective();
  if (!step || !step.quest) return null;
  const items = step.quest.map(q => ({ key: q.key, say: q.say, done: !!q.done() }));
  return items.every(i => i.done) ? null : items;
}
