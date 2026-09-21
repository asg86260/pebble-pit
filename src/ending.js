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
import { timesOn, timesName, postTime, sayRank, BOARD_DOWN } from './times.js';

const sheet = document.getElementById('saved');
const savedIn = document.getElementById('savedin');

const due = () => beatRunning('ending') && !S.paused && !S.fatal;

export function syncEnding() {
  const up = due();
  if (sheet.hidden === up) {
    sheet.hidden = !up;
    // The clock stopped when they walked out (`stepUnder`), so this is the
    // same number the books read.
    if (up) { savedIn.textContent = sayClock(S.buriedMs); offerPost(); }
    else posted = false;                    // the next story's sheet gets its own line
  }
}

// The board of times' line: with no board the line is blank; with a name
// already kept the time goes up as the sheet comes up; otherwise the box and
// the button, once. The reply is the rank, or the refusal in the player's
// words, and a board that could not be reached says so -- the post waits on
// the save for the next boot (times.js).
const postRow = document.getElementById('timespost');
const nameBox = document.getElementById('timesname');
const goBtn = document.getElementById('timesgo');
const timesSaid = document.getElementById('timessaid');
let posted = false;
function offerPost() {
  timesSaid.textContent = '';
  postRow.hidden = true;
  if (!timesOn() || posted) return;
  if (timesName()) { send(timesName()); return; }
  nameBox.value = '';
  postRow.hidden = false;
}
async function send(name) {
  if (!name.trim()) return;
  posted = true;
  postRow.hidden = true;
  timesSaid.textContent = 'telling the board…';
  let r = null;
  try { r = await postTime(name); } catch {}
  if (r === null) timesSaid.textContent = BOARD_DOWN + '; your time is kept and goes up next time you open the game';
  else if (r.error) timesSaid.textContent = r.error;
  else timesSaid.textContent = `on the board: ${sayRank(r.rank, r.of)}`;
}
goBtn.addEventListener('click', () => send(nameBox.value));
nameBox.addEventListener('keydown', e => { if (e.key === 'Enter') send(nameBox.value); });

document.getElementById('keepplaying').addEventListener('click', () => {
  skipBeat(now(), 'sheet');
});
