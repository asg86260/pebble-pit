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
import { cutsceneRunning } from './cutscene.js';
import { reducedMotion } from './prefs.js';
import { hold } from './input.js';
import { showPane } from './settings.js';
import { STATIONS, standRect } from './board.js';
import { houseRect } from './crewboard.js';

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
  seatX = null;
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

// Where the card stands: the top edge, centered -- unless a building reaches
// into that sky, as the settlement does once it is a few storeys tall in a
// short window (a phone on its side), in which case the card slides sideways
// to the clearer side of it, inside the glass. Asked every frame the card is
// up, since the view moves under it; written only when the answer changes.
// The buildings are the stations' own rectangles, read through the same
// door the boards use, so a new station is dodged without being named.
let seatX = null;
function seatToast() {
  const w = el.offsetWidth, h = el.offsetHeight;
  if (!w) return;
  const top = 12, left0 = (S.W - w) / 2;
  const box = { x: left0, y: top, w, h };
  const rects = STATIONS.map(standRect).filter(Boolean);
  if (S.crew > 0) rects.push(houseRect());
  const onScreen = r => ({ x: (r.x - S.camX) * S.zoom, y: (r.y - S.camY) * S.zoom, w: r.w * S.zoom, h: r.h * S.zoom });
  const meets = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
  // and the two squares in the corner (fullscreen.js, gear.js), which are
  // the page's, already on the glass
  const boxes = rects.map(onScreen);
  for (const id of ['gear', 'fullscreen']) {
    const b = document.getElementById(id);
    if (b && !b.hidden) { const r = b.getBoundingClientRect(); boxes.push({ x: r.left, y: r.top, w: r.width, h: r.height }); }
  }
  let x = left0;
  for (const r of boxes) {
    if (!meets(box, r)) continue;
    // to whichever side of the building has the room, and only if it has it
    const leftOf = r.x - 8 - w, rightOf = r.x + r.w + 8;
    if (rightOf + w <= S.W - 8 && (leftOf < 8 || S.W - rightOf >= r.x)) x = rightOf;
    else if (leftOf >= 8) x = leftOf;
    box.x = x;
  }
  const at = Math.round(x + w / 2);
  if (at === seatX) return;
  seatX = at;
  // As an offset on the transform, not a `left`: a fixed box given a left and
  // no right shrinks to the room past it, and the words folded.
  el.style.setProperty('--toast-dx', `${Math.round(at - S.W / 2)}px`);
}

// Once a frame, from `frame()` in main.js, on the game's clock: a held game
// holds the card, and a check sees it on the game's seconds.
export function stepToast() {
  const t = now();
  // A seeded run winds the clock back to nought; a card that went up before
  // that would otherwise stay up until the clock caught up with it.
  if (upAt > t) upAt = t;
  if (downAt > t) downAt = t - TOAST_GAP_MS;
  if (up) {
    // said its piece, or says a notice the record no longer has
    if (!S.won.includes(up) || t - upAt >= TOAST_MS) hide();
    else seatToast();
    return;
  }
  const next = pending();
  if (!next.length) return;
  // Not over a cutscene: the line holds until the camera is given back.
  if (cutsceneRunning()) return;
  if (t - downAt < TOAST_GAP_MS) return;
  show(next[0]);
}

// For the checks. A card fading out counts as down.
export const toastUp = () =>
  up ? { key: up, name: nameEl.textContent, note: noteEl.textContent } : null;
export const toastWaiting = () => pending().length;
// and where the card stands, for a check that it is over clear sky
export const toastRect = () => (up ? el.getBoundingClientRect() : null);
