// The end of the story, and the sheet that says so.
//
// Once the rescue's beat is over and the newcomer is one of the crew, one sheet
// stands in the middle of the window until the player picks it up. Nothing
// pauses: the held sheet is the one thing that pauses, and this is not a hold.
// Whether it is up is the `ending` beat (beats.js), which owns the sheet from
// the moment nothing else is running until the button puts it down; the button
// is the beat's skip. It steps aside for the held sheet so two sheets never
// stand on one spot.

import { S } from './state.js';
import { sayClock } from './stats.js';
import { now } from './clock.js';
import { beatRunning, skipBeat } from './beats.js';

const sheet = document.getElementById('saved');
const savedIn = document.getElementById('savedin');

const due = () => beatRunning('ending') && !S.paused && !S.fatal;

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
  skipBeat(now(), 'sheet');
});
