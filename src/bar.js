// The grab bar (DESIGN.md, "Momentum scrolling"): a band along the bottom
// edge of a phone's window, and the one place the yard is scrolled from.
//
// The band is the platform's own scroller -- `#scroller`, with a spacer as
// wide as the world inside it (world.js writes the width and reads the
// position back) -- so a drag in it is a native scroll, one for one with the
// finger and coasting the way every list on the phone coasts, and no code
// here moves the view. What this file does is make the band read as the
// scrollbar it is: `#bar` under it carries a track and a thumb as wide as the
// window's share of the world, seated from `camX` each frame, so the thumb
// follows a fling, a hop, a glide and a cutscene alike. A tap on the track
// (no movement past the slop) glides the view there, since a tap is where
// you want to be and a drag is how far you want to go.
//
// On a desk (`coarse()` false) neither element is on the page: the wheel is
// the scroll there, and a bar would be a second one.

import { BAR_H, BAR_INSET, BAR_THUMB_MIN } from './config.js';
import { S } from './state.js';
import { coarse } from './prefs.js';
import { lookAt, resyncScroller } from './world.js';
import { onTap } from './tap.js';

const scroller = document.getElementById('scroller');
const bar = document.getElementById('bar');
const thumb = bar.querySelector('.thumb');

// The band's height and its inset from the bottom edge are the stylesheet's
// to draw and this file's to know, so both are handed over once.
document.documentElement.style.setProperty?.('--bar-h', `${BAR_H}px`);
document.documentElement.style.setProperty?.('--bar-inset', `${BAR_INSET}px`);

// How much of the glass's foot the band takes, for whatever else stands
// there (the counter): the band, its inset and the safe area under it on a
// phone; nothing on a desk. The safe area is read off the page, since only
// the page knows whether there is a home indicator.
let safeBottom = 0;
export function measureSafeArea() {
  if (typeof getComputedStyle !== 'function') return;
  const v = getComputedStyle(document.documentElement).getPropertyValue('--safe-bottom');
  safeBottom = parseFloat(v) || 0;
}
export const barRoom = () => (coarse() ? BAR_H + BAR_INSET + safeBottom : 0);

// Seated every frame from `camX`: written only when the numbers change, so
// a still view leaves the layer alone.
let shown = null, putX = null, putW = null;
export function refreshBar() {
  const want = coarse() && !S.paused;
  if (want !== shown) {
    shown = want;
    scroller.hidden = !want;
    bar.hidden = !want;
    // and whatever else stands at the foot of the glass (the skip hint) is
    // told how much of it the band has
    document.documentElement.style.setProperty('--bar-room', want ? `${barRoom()}px` : '0px');
    // Shown again, the band has no position of its own to trust: it is
    // written from the camera afresh.
    if (want) resyncScroller();
    if (!want) return;
  }
  if (!want) return;
  const world = Math.max(1, S.worldW);
  const w = Math.max(BAR_THUMB_MIN, Math.round(S.W * Math.min(1, S.viewW / world)));
  const x = Math.round(Math.min(S.W - w, S.W * (S.camX / world)));
  if (x === putX && w === putW) return;
  putX = x; putW = w;
  thumb.style.transform = `translate3d(${x}px, 0, 0)`;
  thumb.style.width = `${w}px`;
}

// Where the thumb was drawn, for the checks: the track is the window's
// width, so the thumb's share of it is the view's share of the world.
export const thumbRect = () => (shown && putX !== null ? { x: putX, w: putW } : null);

// A tap on the track: the spot under the finger, as a share of the world,
// looked at with the yard's own glide. A drag never gets here -- the platform
// takes it as a scroll and the pointer is cancelled -- and a press that
// wanders past the slop or lingers past the time is not a tap either.
onTap(scroller, e => {
  const share = e.clientX / Math.max(1, S.W);
  lookAt(share * S.worldW);
});
