// The skip hint: "hold space to skip", at the bottom edge, while a scene has
// the yard. DOM in the shell; the simulation frame knows the key is down
// (skip.js) and nothing about what says so. Hidden under the held sheet,
// which already says what the keys do.
//
// It is a button as well as a hint: a phone has no space bar, and the
// opening -- the one scene a click does not skip, since a rested hand is not
// a decision -- had no way out there at all. Held, the button is the key:
// the same `holdSkip`, the same hold, the same bar filling under the words.
// Under a thumb the words drop the key they cannot press.

import { S } from './state.js';
import { fadeIn, fadeOut } from './fade.js';
import { skippable, skipHeld, holdSkip } from './skip.js';
import { coarse } from './prefs.js';

const el = document.getElementById('skip');
const bar = el.querySelector('.bar');
const say = el.querySelector('.say');

let said = null;
export function stepSkipHint() {
  const up = skippable() && !S.paused;
  (up ? fadeIn : fadeOut)(el);
  if (!up) return;
  bar.style.width = `${(skipHeld() * 100).toFixed(1)}%`;
  const words = coarse() ? 'hold to skip' : 'hold space to skip';
  if (words !== said) { said = words; say.textContent = words; }
}

// Pressed and held, the button is the key held; let go, or the finger gone
// off it, is the key up.
el.addEventListener('pointerdown', e => { e.preventDefault(); holdSkip(true); });
for (const type of ['pointerup', 'pointercancel', 'pointerleave']) el.addEventListener(type, () => holdSkip(false));
