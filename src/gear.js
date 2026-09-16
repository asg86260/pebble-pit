// The way to the settings on a phone. On a desk the held sheet is escape
// away and nothing else summons it; a phone has no escape, so it gets a gear
// in the sky's top-right corner beside the fullscreen button, the same
// square in the same idiom, and a tap opens the held sheet on its settings
// page. Held, on a phone, the sheet is a sheet from the bottom like the
// boards are: the window's width, standing on the foot, a grip on its top
// edge, and it goes down on a drag past a third of its height on the grip
// or a tap on the wash above it. `hold` in input.js is still the one flag;
// this only reaches for it.

import { FS_SIZE, FS_INSET, SHEET_DISMISS, TAP_SLOP } from './config.js';
import { S } from './state.js';
import { coarse } from './prefs.js';
import { onTap } from './tap.js';
import { hold } from './input.js';
import { showPane } from './settings.js';
import { fullscreenAble } from './fullscreen.js';

const gear = document.getElementById('gear');
const held = document.getElementById('held');
const scrim = document.getElementById('scrim');
const grip = document.getElementById('heldgrip');

onTap(gear, () => { hold(true); showPane('settings'); });

// Seated every frame like the rest of the shell. It takes the fullscreen
// button's spot when there is none, and the pin gives the corner up to
// whichever of the two is there (`--fs-room`, shared with fullscreen.js).
let shown = null, beside = null;
export function refreshGear() {
  const want = coarse() && !S.paused;
  if (want !== shown) {
    shown = want;
    gear.hidden = !want;
    if (want) document.documentElement.style.setProperty('--fs-room', `${FS_SIZE + FS_INSET}px`);
  }
  if (!want) return;
  const next = fullscreenAble();
  if (next !== beside) {
    beside = next;
    gear.style.setProperty('--gear-shift', next ? `${FS_SIZE + FS_INSET}px` : '0px');
  }
}

// The held sheet's shape follows the pointer: a sheet from the bottom under
// a thumb, the centered card on a desk. Asked each frame the sheet is up,
// so the switch on the sheet itself takes effect as it is pressed.
let bottom = null;
export function refreshHeldSeat() {
  const want = coarse();
  if (want === bottom) return;
  bottom = want;
  held.classList.toggle('bottom', want);
  grip.hidden = !want;
}

// The grip in hand: dragged down past a third of the sheet's height, the
// sheet goes; anything less, or a tap, is nothing. The wash above the sheet
// is the way out too.
let drag = null;
grip.addEventListener('pointerdown', e => {
  if (e.button !== 0) return;
  drag = { y0: e.clientY };
  try { grip.setPointerCapture(e.pointerId); } catch {}
  held.classList.add('dragging');
});
grip.addEventListener('pointermove', e => {
  if (!drag) return;
  held.style.transform = `translate3d(0, ${Math.max(0, e.clientY - drag.y0)}px, 0)`;
});
const letGo = e => {
  if (!drag) return;
  const dy = e.clientY - drag.y0;
  drag = null;
  held.classList.remove('dragging');
  held.style.transform = '';
  if (dy > TAP_SLOP && dy > held.offsetHeight * SHEET_DISMISS) hold(false);
};
grip.addEventListener('pointerup', letGo);
grip.addEventListener('pointercancel', letGo);
scrim.addEventListener('pointerdown', () => { if (coarse() && S.paused) hold(false); });
