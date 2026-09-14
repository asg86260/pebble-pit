// A sheet coming up and going down as a fade, with `hidden` still the truth.
//
// `hidden` is what every check and every observer reads, so it stays
// honest: a sheet fading in is not hidden from the first frame, and a sheet
// fading out is hidden only once it has gone. What moves is the `on` class
// -- style.css fades opacity on it -- put on after the element is showing
// (a reflow between, so the browser has a frame at nought to fade from)
// and taken off ahead of the hide. Both are safe to call every frame: a
// sheet already up is left alone, and a sheet on its way down is not
// restarted. Under motion: less (body.still) the fade is nought and the
// hide is immediate.

import { SHEET_FADE_MS } from './config.js';

const going = new WeakMap();   // element -> the timer that will hide it

export function fadeIn(el) {
  clearTimeout(going.get(el));
  going.delete(el);
  if (!el.hidden && el.classList.contains('on')) return;
  el.hidden = false;
  void el.offsetWidth;
  el.classList.add('on');
}

export function fadeOut(el) {
  if (el.hidden || !el.classList.contains('on')) return;
  el.classList.remove('on');
  if (document.body.classList.contains('still')) { el.hidden = true; return; }
  going.set(el, setTimeout(() => { going.delete(el); if (!el.classList.contains('on')) el.hidden = true; }, SHEET_FADE_MS));
}
