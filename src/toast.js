// The toast: a notice said out loud, the moment it lands (DESIGN.md, "a toast
// when one lands"). One card comes down from the top edge, stays a few
// seconds, and goes.
//
// It is DOM in the browser shell; nothing in the simulation frame knows it
// exists. It reads the record the way the held sheet does -- `S.wonAt` is the
// order every notice landed in, `S.wonShown` how far through that order this
// has said -- and never decides what is earned; notices.js does.

import { S } from './state.js';
import { now } from './clock.js';
import { TOAST_MS, TOAST_GAP_MS } from './config.js';
import { noticeFor } from './notices.js';
import { cutsceneRunning, holding } from './cutscene.js';
import { reducedMotion } from './prefs.js';
import { hold } from './input.js';
import { showPane } from './settings.js';
import { STATIONS, standRect } from './board.js';
import { houseRect } from './house.js';
import { cornerCards, clearBelow } from './dodge.js';

const el = document.getElementById('toast');
const nameEl = el.querySelector('.name');
const noteEl = el.querySelector('.note');

// One at a time, in the order they landed, and every one gets its beat. No
// queue of its own: what is waiting is read off `S.wonAt` each frame, so a
// yard starting over or `hushNotices` empties the line without this being
// told.
const pending = () =>
  Object.entries(S.wonAt)
    .filter(([, at]) => at > (S.wonShown | 0))
    .sort((a, b) => a[1] - b[1])
    .map(([key]) => key);

let up = null;      // the key on the card now, or null
let upAt = 0;       // when it went up
let downAt = 0;     // when the last one came down, for the gap between two

// Pressing the card opens the held sheet on the record page. `hold` opens the
// front and marks the record read; the page is turned after.
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
  // Set as it goes up, so flipping the switch mid-card takes effect on the
  // next one and never mid-slide.
  el.classList.toggle('still', reducedMotion());
  el.hidden = false;
  // `hidden` off and `up` on in the same style pass would skip the slide, so
  // the layout is read once between them.
  void el.offsetWidth;
  seat = null;
  seatToast();
  el.classList.add('up');
}

// The fact of the card is the class, not `hidden`: `hidden` lags it by one
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

// Where the card stands: the top edge, centered, drawn over whatever is
// there -- a notice is the top layer, over the houses and every building, a
// settlement reaching into the sky included (the owner's call, 2026-10-12).
// It steps aside only for the page's own squares in the corner (fullscreen.js,
// pause.js), which are clickable and already on the glass, and stands under a
// corner card it would still land on -- the story's, on a phone -- as the mess
// tags do (dodge.js), gliding there if the card grows under it. Asked every
// frame the card is up; written only when the answer changes.
let seat = null;
function seatToast() {
  const w = el.offsetWidth, h = el.offsetHeight;
  if (!w) return;
  const left0 = (S.W - w) / 2;
  const box = { x: left0, y: el.offsetTop, w, h };
  const meets = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
  const boxes = [];
  for (const id of ['pause', 'fullscreen']) {
    const b = document.getElementById(id);
    if (b && !b.hidden) { const r = b.getBoundingClientRect(); boxes.push({ x: r.left, y: r.top, w: r.width, h: r.height }); }
  }
  let x = left0;
  for (const r of boxes) {
    if (!meets(box, r)) continue;
    // to whichever side of the square has the room, and only if it has it
    const leftOf = r.x - 8 - w, rightOf = r.x + r.w + 8;
    if (rightOf + w <= S.W - 8 && (leftOf < 8 || S.W - rightOf >= r.x)) x = rightOf;
    else if (leftOf >= 8) x = leftOf;
    box.x = x;
  }
  const top0 = el.offsetTop;
  const dy = clearBelow(x, x + w, top0, h, cornerCards()) - top0;
  const at = `${Math.round(x + w / 2)} ${dy}`;
  if (at === seat) return;
  seat = at;
  // As an offset on the transform, not a `left`: a fixed box given a left and
  // no right shrinks to the room past it, and the words folded.
  el.style.setProperty('--toast-dx', `${Math.round(x + w / 2 - S.W / 2)}px`);
  el.style.setProperty('--toast-dy', `${dy}px`);
}

// Once a frame, from `frame()` in main.js, on the game's clock: a held game
// holds the card, and a check sees it on the game's seconds.
export function stepToast() {
  const t = now();
  // A seeded run winds the clock back to nought; a card that went up before
  // that would otherwise stay up until the clock caught up with it.
  if (upAt > t) upAt = t;
  if (downAt > t) downAt = t - TOAST_GAP_MS;
  // Not over a scene: the bands are its, top and foot, and a card would sit
  // on the top one. One already up when the bands come in goes, and is put
  // back at the head of the line to be said in full after.
  const scened = cutsceneRunning() || holding() || S.hush > 0;
  if (up && scened) {
    S.wonShown = Math.min(S.wonShown | 0, S.wonAt[up] - 1);
    hide();
    return;
  }
  if (up) {
    // said its piece, or says a notice the record no longer has
    if (!S.won.includes(up) || t - upAt >= TOAST_MS) hide();
    else seatToast();
    return;
  }
  const next = pending();
  if (!next.length) return;
  // ...and the line holds until the yard is given back.
  if (scened) return;
  if (t - downAt < TOAST_GAP_MS) return;
  show(next[0]);
}

// For the checks. A card fading out counts as down.
export const toastUp = () =>
  up ? { key: up, name: nameEl.textContent, note: noteEl.textContent } : null;
export const toastWaiting = () => pending().length;
// and where the card stands, for a check that it is over clear sky
export const toastRect = () => (up ? el.getBoundingClientRect() : null);
