// The end of the story, and the sheet that says so.
//
// Once the rescue's beat is over and the newcomer is one of the crew, one sheet
// stands in the middle of the window until the player picks it up. Nothing
// pauses: the held sheet is the one thing that pauses, and this is not a hold.
// Whether it is up is the `ending` beat (beats.js), which owns the sheet from
// the moment nothing else is running until the button puts it down; the button
// is the beat's skip. It steps aside for the held sheet so two sheets never
// stand on one spot.

import { STORE_URL } from './config.js';
import { S } from './state.js';
import { sayClock } from './stats.js';
import { now } from './clock.js';
import { beatRunning, skipBeat } from './beats.js';
import { timesOn, timesName, postTime, sayRank, BOARD_DOWN } from './times.js';
import { serpentOn } from './snatch.js';
import { RESCUE_SHEET_LEAVE_S } from './config.js';

const sheet = document.getElementById('saved');
const savedIn = document.getElementById('savedin');
const endOnly = [...sheet.querySelectorAll('.endonly')];
const keepPlaying = document.getElementById('keepplaying');
// With the half on the sheet has no button and floats away as its beat ends
// (beats.js): it stays up, leaving, for RESCUE_SHEET_LEAVE_S after.
let leavingUntil = 0, wasUp = false;

const due = () => beatRunning('ending') && !S.paused && !S.fatal;

export function syncEnding() {
  const due0 = due(), t = performance.now();
  if (wasUp && !due0 && serpentOn() && !S.paused && !S.fatal) leavingUntil = t + RESCUE_SHEET_LEAVE_S * 1000;
  wasUp = due0;
  const leaving = !due0 && t < leavingUntil;
  sheet.classList.toggle('leaving', leaving);
  const up = due0 || leaving;
  if (sheet.hidden === up) {
    sheet.hidden = !up;
    // The clock stopped when they walked out (`stepUnder`), so this is the
    // same number the books read.
    if (up) {
      savedIn.textContent = sayClock(S.buriedMs);
      offerPost();
    }
    else posted = false;                    // the next story's sheet gets its own line
  }
  // With the second half on, the snatch follows this sheet: it says the
  // story goes on rather than that it is over.
  if (up) {
    const on = serpentOn();
    keepPlaying.hidden = on;
    for (const el of endOnly) el.hidden = on;
  }
  // The second half's end, the same way: up while its beat has the sheet.
  const freedUp = beatRunning('freedsheet') && !S.paused && !S.fatal;
  if (freed.hidden === freedUp) freed.hidden = !freedUp;
  const demoUp = beatRunning('demoend') && !S.paused && !S.fatal;
  if (demoEnd.hidden === demoUp) demoEnd.hidden = !demoUp;
  const teaseUp = beatRunning('teaseend') && !S.paused && !S.fatal;
  if (teaseEnd.hidden === teaseUp) teaseEnd.hidden = !teaseUp;
}

// The demo's last sheet, the same way, with the store's link when there is
// a store page to point at (config STORE_URL).
const demoEnd = document.getElementById('demoend');
const demoStore = document.getElementById('demostore');
if (STORE_URL) { demoStore.href = STORE_URL; demoStore.hidden = false; }
document.getElementById('demokeep').addEventListener('click', () => {
  skipBeat(now(), 'sheet');
});

// The teaser's last sheet on the free build, the same way.
const teaseEnd = document.getElementById('teaseend');
const teaseStore = document.getElementById('teasestore');
if (STORE_URL) { teaseStore.href = STORE_URL; teaseStore.hidden = false; }
document.getElementById('teasekeep').addEventListener('click', () => {
  skipBeat(now(), 'sheet');
});

// The sqhusband out of the belly (snatch.js). The second half is not timed
// and not on the board of times, so the sheet is the words and the button.
const freed = document.getElementById('freed');
document.getElementById('freedkeep').addEventListener('click', () => {
  skipBeat(now(), 'sheet');
});

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
