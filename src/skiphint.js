// The skip hint: "hold space to skip", at the bottom edge, while a scene has
// the yard. DOM in the shell; the simulation frame knows the key is down
// (skip.js) and nothing about what says so. Hidden under the held sheet,
// which already says what the keys do.

import { S } from './state.js';
import { fadeIn, fadeOut } from './fade.js';
import { skippable, skipHeld } from './skip.js';

const el = document.getElementById('skip');
const bar = el.querySelector('.bar');

export function stepSkipHint() {
  const up = skippable() && !S.paused;
  (up ? fadeIn : fadeOut)(el);
  if (up) bar.style.width = `${(skipHeld() * 100).toFixed(1)}%`;
}
