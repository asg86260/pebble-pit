// The toast: a notice said out loud, the moment it lands.
//
// Everything else the game has to tell you, it tells you with a mark on the
// ground where the thing is, and asks you to walk over. That rule stands for
// the yard and bends here, once, for the record (DESIGN.md, "a toast when one
// lands"): a notice is about you rather than about a station, and the moment
// the record is written is the one moment worth saying so. So one card comes
// down from the top edge of the window -- the record's own card, name and
// note, the thing you will later find on the held sheet -- stays a few
// seconds, and goes.
//
// It is DOM, and lives in the browser shell with record.js and settings.js:
// nothing in the simulation frame knows it exists. It reads the record the
// same way the held sheet does -- `S.wonAt` is the order every notice landed
// in, and `S.wonShown` is how far through that order this has said -- and it
// never decides what is earned. notices.js is still the one place that does.

import { S } from './state.js';
import { now } from './clock.js';
import { TOAST_MS, TOAST_GAP_MS } from './config.js';
import { noticeFor } from './notices.js';
import { cutsceneRunning } from './cutscene.js';
import { reducedMotion } from './prefs.js';
import { hold } from './input.js';
import { showPane } from './settings.js';

const el = document.getElementById('toast');
const nameEl = el.querySelector('.name');
const noteEl = el.querySelector('.note');

// One at a time, in the order they landed. A rock can land three notices in
// one frame, and three cards stacked is a pile, and a pile is read as noise.
// Every one gets its beat -- the line is never cut short, because a notice
// that was announced and one that was not are different things to the player.
//
// There is no queue of its own here. What is waiting is whatever `S.wonAt`
// places after `S.wonShown`, read again each frame -- so a yard starting over
// (which empties `wonAt`) or `hushNotices` (which moves `wonShown` to the end)
// empties the line without this being told, and nothing said is ever a thing
// the record has forgotten.
const pending = () =>
  Object.entries(S.wonAt)
    .filter(([, at]) => at > (S.wonShown | 0))
    .sort((a, b) => a[1] - b[1])
    .map(([key]) => key);

let up = null;      // the key on the card now, or null
let upAt = 0;       // when it went up
let downAt = 0;     // when the last one came down, for the gap between two

// Pressing the card is asking to see the record: the game is held, and the
// sheet comes up turned to the achievements page rather than its front.
// `hold` opens the front and marks the record read; the page is turned after.
el.addEventListener('click', () => {
  hold(true);
  showPane('record');
});

function show(key) {
  const n = noticeFor(key);
  up = key;
  upAt = now();
  S.wonShown = S.wonAt[key];
  if (!n) return hide();
  nameEl.textContent = n.name;
  noteEl.textContent = n.note;
  // Under `motion: less` the card appears and disappears in place rather than
  // sliding; the class is set as it goes up, so flipping the switch mid-card
  // takes effect on the next one and never mid-slide.
  el.classList.toggle('still', reducedMotion());
  el.hidden = false;
  // `hidden` off and `up` on in the same style pass would skip the slide, so
  // the layout is read once between them, which is what makes the browser
  // start from the hidden pose. Same frame, so the fact and the picture agree.
  void el.offsetWidth;
  el.classList.add('up');
}

// Down is the `up` class coming off: the fade runs on that, and the element
// leaves the tree when the fade is over (or now, if there is no fade to run).
// The fact of the card is the class, not `hidden` -- `hidden` lags it by one
// fade, and a card fading out is not a card that is up.
function hide() {
  el.classList.remove('up');
  if (el.classList.contains('still')) el.hidden = true;
  up = null;
  upAt = 0;
  downAt = now();
}
el.addEventListener('transitionend', () => {
  if (!el.classList.contains('up')) el.hidden = true;
});

// Once a frame, from `frame()` in main.js. The clock is the game's, so a held
// game holds the card where it is, and a check turning the handle sees the
// card go up and come down on the game's seconds rather than the machine's.
export function stepToast() {
  const t = now();
  // A seeded run winds the clock back to nought; a card that went up before
  // that would otherwise stay up until the clock caught up with it, and a
  // gap owed from before it is not owed now.
  if (upAt > t) upAt = t;
  if (downAt > t) downAt = t - TOAST_GAP_MS;
  if (up) {
    // The card says a notice the record no longer has -- the yard started
    // over under it -- or has said its piece.
    if (!S.won.includes(up) || t - upAt >= TOAST_MS) hide();
    return;
  }
  const next = pending();
  if (!next.length) return;
  // A card over a cutscene is a card over the one thing the game has asked
  // you to watch, so the line holds until the camera is given back.
  if (cutsceneRunning()) return;
  if (t - downAt < TOAST_GAP_MS) return;
  show(next[0]);
}

// What is on the card now, for the checks: its name and note, or null while
// nothing is up (a card fading out counts as down). And how many are waiting.
export const toastUp = () =>
  up ? { key: up, name: nameEl.textContent, note: noteEl.textContent } : null;
export const toastWaiting = () => pending().length;
