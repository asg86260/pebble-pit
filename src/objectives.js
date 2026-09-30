// The story's objectives (DESIGN.md, "The story's objectives"): one line, the
// next step of the story in a few words. Every step is a fact the save already
// holds, so an old save opens on the right line, and nothing waits on it: the
// story never follows the line, the line follows the story.
//
// The yard's half only; the line on the page is objline.js.

import { S } from './state.js';
import { shieldDone } from './shield.js';
import { serpentOn } from './snatch.js';
import { beatDone } from './beats.js';

// In the order they come. `done` is the fact that finishes a step, and it
// must imply every step before it (a fact that can come early, like the pit
// drowning or the tower standing, is asked together with the one it follows); `when`, if
// it has one, is whether the step is part of this story at all. The first
// step not done is the line.
export const STEPS = [
  { key: 'rock', say: 'dig out the rock', done: () => S.boulderNo > 1 || beatDone('meet') },
  { key: 'falling', say: 'the rocks keep falling', done: () => S.boulderNo > 1 },
  { key: 'props', say: 'build the props', done: () => shieldDone('props') || S.rescued },
  { key: 'net', say: 'string the net', done: () => shieldDone('net') || S.rescued },
  { key: 'arch', say: 'raise the arch', done: () => shieldDone('arch') || S.rescued },
  { key: 'dome', say: 'raise the dome', done: () => shieldDone('dome') || S.rescued },
  { key: 'rescue', say: 'save the sqwife', done: () => !!S.rescued },
  // The second half: the snatch waits on the pit drowning, then the way down
  // is the wizards', and the portal is a row on their board.
  { key: 'drown', say: 'drown the pit', when: serpentOn, done: () => (!!S.drowned && !!S.rescued) || !!S.snatched },
  { key: 'snatch', say: '', when: serpentOn, done: () => !!S.snatched },
  { key: 'tower', say: 'build the wizards\' tower', when: serpentOn, done: () => !!S.snatched && (!!S.towerOpen || !!S.portalOpen) },
  { key: 'wizards', say: 'ask the wizards how to get down', when: serpentOn,
    done: () => !!S.snatched && (!!S.askedWizards || S.portalPour > 0 || !!S.portalOpen) },
  { key: 'portal', say: 'buy the portal', when: serpentOn, done: () => !!S.snatched && (S.portalPour > 0 || !!S.portalOpen) },
  { key: 'free', say: 'free your sqhusband from the serpent\'s belly', when: serpentOn, done: () => !!S.serpentFreed },
];

// The step the story is on, or null once it is told: the first step after
// the last one done, so a later fact always stands for the steps before it (a
// sqwife out means the shields are behind you, whatever this save recorded of
// them). The snatch has no line: nothing the player does starts it, so while
// it is due the line is empty rather than a thing to do.
export function objective() {
  const live = STEPS.filter(s => !s.when || s.when());
  let from = 0;
  live.forEach((s, i) => { if (s.done()) from = i + 1; });
  const next = live[from];
  return next && next.say ? next : null;
}
