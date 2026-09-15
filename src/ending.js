// The end of the story, and the sheet that says so.
//
// Once the rescue's beat is over and the newcomer is one of the crew, one sheet
// stands in the middle of the window until the player picks it up. Nothing
// pauses: the held sheet is the one thing that pauses, and this is not a hold.
// Whether it is up is derived every frame from facts the yard keeps; the button
// is the only thing that sets `storyTold`. It waits for the camera (`S.cine`)
// because the rock is still being set down as the beat ends, and it steps aside
// for the held sheet so two sheets never stand on one spot.

import { S } from './state.js';
import { sayClock } from './stats.js';

const sheet = document.getElementById('saved');
const savedIn = document.getElementById('savedin');

const due = () =>
  S.rescued && S.intro !== 'rescue' && !S.cine && !S.storyTold && !S.paused && !S.fatal;

export function syncEnding() {
  const up = due();
  if (sheet.hidden === up) {
    sheet.hidden = !up;
    // The clock stopped when they walked out (`stepUnder`), so this is the
    // same number the books read.
    if (up) savedIn.textContent = sayClock(S.buriedMs);
  }
}

document.getElementById('keepplaying').addEventListener('click', () => {
  S.storyTold = true;
  S.dirty = true;
});
