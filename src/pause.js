// The way to the held sheet on a phone. On a desk the held sheet is escape
// away and nothing else summons it; a phone has no escape, so it gets a pause
// button in the sky's top-right corner beside the fullscreen button, the same
// square in the same idiom, and a tap holds the yard with the sheet on its
// front page, as escape does. Held, on a phone, the sheet is a sheet from the
// bottom through the same seat the boards use (sheet.js): the same handle and
// stops, the same drag, the same pull past SHEET_DISMISS to put it away, and
// the wash above it is the tap outside. `hold` in input.js is still the one
// flag; this only reaches for it.

import { S } from './state.js';
import { coarse } from './prefs.js';
import { onTap } from './tap.js';
import { hold } from './input.js';
import { sheetSeat } from './sheet.js';

const pause = document.getElementById('pause');
const held = document.getElementById('held');
const scrim = document.getElementById('scrim');

// Seated in the same task as it is shown, so the first frame it paints is
// already the sheet from below and not the desk's card for a frame.
onTap(pause, () => { hold(true); refreshHeldSeat(); });

// Seated every frame like the rest of the shell. Where it stands is the
// corner's row (corner.js), beside the fullscreen button or in its spot.
export function refreshPause() {
  pause.hidden = !(coarse() && !S.paused);
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
