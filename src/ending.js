// The end of the story, and the sheet that says so.
//
// The rescue is the beat the whole arc was built to reach (intro.js,
// `startRescue`): the dome holds the rock, somebody digs, the one under it
// walks out and joins the crew. It happened in a working yard and nothing
// stopped for it, which is right -- but a story that ends without saying so
// is a story the player is left waiting on. So once the two of them have had
// their beat and the newcomer is one of the crew, this puts one sheet in the
// middle of the window: you did it, that was the story, keep playing if you
// like. The yard runs on behind it. Nothing here pauses, because the held
// sheet is the one thing that pauses and this is not a hold; it is a card
// left on the table until the player picks it up.
//
// Whether the sheet is up is worked out from facts the yard already keeps,
// every frame, the way main.js keeps the held sheet in step with `S.paused`:
// the rescue is over (`rescued`, and the beat no longer running) and the
// sheet has not been put down (`storyTold`). The button is the only thing
// that sets `storyTold`. A reload with the sheet up brings it back; a reset
// clears it with everything else; the held sheet coming up over it puts it
// away until the yard is resumed, so two sheets never stand on one spot.
//
// And it waits for the camera. The rescue is a cutscene (cutscene.js) and the
// rock is still being set down as the beat ends; a card over that is a card
// over the one thing the game has asked you to watch, so the sheet comes up
// once the scene has let go all the way -- the same rule the notices keep.

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
    // The time it took, written once as the sheet comes up: the clock stopped
    // when they walked out (`stepUnder`), so it is the same number the books
    // read.
    if (up) savedIn.textContent = sayClock(S.buriedMs);
  }
}

document.getElementById('keepplaying').addEventListener('click', () => {
  S.storyTold = true;
  S.dirty = true;
});
