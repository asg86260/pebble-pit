// The skip hint: "hold space to skip", at the bottom edge, while a scene has
// the yard. DOM, like the toast, and in the shell with it: the simulation
// frame knows the key is down (skip.js) and nothing about what says so.
//
// The bar under the words fills as the hold counts, so the key is seen to be
// doing something from the first frame it is down rather than at the end;
// let go, it empties. The hint hides under the held sheet -- a scene held is
// not running, and the sheet already says what the keys do.

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
