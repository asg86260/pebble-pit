// The way to the settings on a phone. On a desk the held sheet is escape
// away and nothing else summons it; a phone has no escape, so it gets a gear
// in the sky's top-right corner beside the fullscreen button, the same
// square in the same idiom, and a tap opens the held sheet on its settings
// page. Held, on a phone, the sheet is a sheet from the bottom through the
// same seat the boards use (sheet.js): the same handle and stops, the same
// drag, the same pull past SHEET_DISMISS to put it away, and the wash above
// it is the tap outside. `hold` in input.js is still the one flag; this
// only reaches for it.

import { FS_SIZE, FS_INSET } from './config.js';
import { S } from './state.js';
import { coarse } from './prefs.js';
import { onTap } from './tap.js';
import { hold } from './input.js';
import { showPane } from './settings.js';
import { fullscreenAble } from './fullscreen.js';
import { sheetSeat } from './sheet.js';

const gear = document.getElementById('gear');
const held = document.getElementById('held');
const scrim = document.getElementById('scrim');

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

// The held sheet's seat. The sheet is its own scroller, so it carries no
// rail (a rail inside it would scroll with the rows); `on` is the class
// fade.js keeps for it, so the slide up and down rides the same beat as the
// wash's fade.
const seat = sheetSeat(held, {
  handle: document.getElementById('heldhandle'),
  list: () => held,
  open: () => held.classList.contains('on'),
  dismiss: () => hold(false),
  rail: false,
});
export const heldSheet = () => seat.stop();

// The held sheet's shape follows the pointer: a sheet from the bottom under
// a thumb, the centered card on a desk. Asked each frame, so the switch on
// the sheet itself takes effect as it is pressed.
export function refreshHeldSeat() {
  if (coarse() && !held.hidden) seat.place();
  else if (seat.seated()) seat.leave();
}

// The wash above the sheet is the tap outside -- through the page's one
// definition of a tap (tap.js), so a touch that began on the sheet and
// lifted over the wash is the sheet's, not a tap here.
onTap(scrim, () => { if (coarse() && S.paused) hold(false); });
