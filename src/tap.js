// One definition of a tap for the whole page (DESIGN.md, "A tap buys"): a
// press that neither wanders past `TAP_SLOP` nor lingers past `TAP_TIME`.
// The yard's own tap (a finger on a station opens its board), a row on a
// board, a hop arrow and the grab bar's track all ask this file, so the
// four cannot drift.
//
// A row used to buy on `click`, and on a phone a `click` fires on any
// press-and-release on the same element -- a scroll of the board that ended
// where it started was a purchase. So the press is watched from
// `pointerdown`, and the `click` the platform raises after it is let through
// only when the press was a tap. A click with no press before it (the
// keyboard, `el.click()` in a check) is a tap by construction. A press held
// past the time is a long press: `long` is told, once, and the release buys
// nothing -- that is the phone's one gesture for "tell me about this".

import { TAP_SLOP, TAP_TIME } from './config.js';

// Whether a press that started at (x0, y0) and let go at (x, y) after `dt`
// ms was a tap. The pure question, for a caller that tracks its own presses
// (the yard, in input.js) on its own clock.
export const isTap = (x0, y0, x, y, dt) =>
  Math.hypot(x - x0, y - y0) < TAP_SLOP && dt < TAP_TIME;

export function onTap(el, fn, { long = null } = {}) {
  let press = null;          // the press in progress: where it began, and whether it is still a tap
  let swallow = false;       // the click after a press that was not a tap is not a click
  let timer = 0;

  const end = () => { clearTimeout(timer); timer = 0; };

  el.addEventListener('pointerdown', e => {
    if (e.button !== 0) return;
    press = { x: e.clientX, y: e.clientY, at: performance.now(), far: false, held: false };
    swallow = false;
    if (long) timer = setTimeout(() => {
      if (!press || press.far) return;
      press.held = true;
      long(e);
    }, TAP_TIME);
  });
  el.addEventListener('pointermove', e => {
    if (!press || press.far) return;
    if (Math.hypot(e.clientX - press.x, e.clientY - press.y) >= TAP_SLOP) { press.far = true; end(); }
  });
  const up = e => {
    end();
    if (!press) return;
    const tap = !press.far && !press.held && performance.now() - press.at < TAP_TIME;
    press = null;
    // A release that was not a tap swallows the click the platform raises
    // for it; a cancel (the platform took the touch as a scroll) raises none.
    if (!tap && e.type === 'pointerup') swallow = true;
  };
  el.addEventListener('pointerup', up);
  el.addEventListener('pointercancel', up);
  el.addEventListener('click', e => {
    if (swallow) { swallow = false; e.stopPropagation(); e.preventDefault(); return; }
    fn(e);
  });
}
