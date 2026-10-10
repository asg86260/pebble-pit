// A sheet from the bottom, on a phone (DESIGN.md, "Boards as bottom
// sheets"): the one mechanism for every sheet the phone has -- the boards'
// panel (board.js) and the held sheet's settings (pause.js). The window's
// width, standing on the foot, a handle on its top edge, the rows scrolling
// within, and three stops and no free height: down (gone), the seat (its
// top at SHEET_H of the window) and tall (SHEET_TALL) for a long board,
// dragged between by the handle or by the rows pulled down from their top.
//
// How it moves is the whole of it. The box is sized for the tall stop
// always and stood on the foot; the seat is the same box slid down by the
// difference, and gone is the box slid off the foot, both as a transform.
// In hand it follows the finger with the same transform and nothing else
// changes -- a height written every move reflowed the rows and the rail each
// frame, which was the jank -- and the stylesheet's one transition
// (SHEET_MS, SHEET_EASE) eases it to a stop only once the finger has gone.
// Let go, it goes to the stop nearest where it would coast, not the next
// one along: a flick from tall closes it. The rows
// keep their last line inside the part that shows (`--sheet-hidden`),
// written at the stops and never a frame at a time.
//
// A seat is made for an element and asked to `place` it every frame the
// sheet is up, `leave` when the pointer stops being a thumb, and answers
// `rect` and `stop` for whoever stands things around it.

import { SHEET_H, SHEET_TALL, SHEET_FLING_MS, SHEET_DECAY, SHEET_RUBBER, SHEET_MS, SHEET_EASE,
         SHEET_HANDLE, SHEET_RAIL_W, SHEET_RAIL_INSET, TAP_SLOP } from './config.js';
import { S } from './state.js';

const root = document.documentElement;
root.style.setProperty?.('--sheet-ms', `${SHEET_MS}ms`);
root.style.setProperty?.('--sheet-ease', `cubic-bezier(${SHEET_EASE.join(', ')})`);
root.style.setProperty?.('--sheet-grip-w', `${SHEET_HANDLE[0]}px`);
root.style.setProperty?.('--sheet-grip-h', `${SHEET_HANDLE[1]}px`);
root.style.setProperty?.('--sheet-rail-w', `${SHEET_RAIL_W}px`);
root.style.setProperty?.('--sheet-rail-inset', `${SHEET_RAIL_INSET}px`);

// `el`      the sheet
// `handle`  its handle, the grip's row on its top edge
// `list`    () => the element that scrolls inside it (the rows), or el itself
// `open`    () => whether it is up (the fade class its owner keeps)
// `dismiss` () => put it away, the owner's way
// `enter`   () => once, as it becomes a sheet (the owner's measuring)
// `rail`    whether to draw the rows' own scrollbar (a sheet that is its own
//           scroller cannot hold one: the rail would scroll with the rows)
// `backdrop` the wash behind it, if it has one: under a finger it thins as
//           the sheet comes down below its seat, so the yard shows through
//           as much as the sheet has let go of it
export function sheetSeat(el, { handle, list, open, dismiss, enter = null, rail = true, backdrop = null }) {
  let tall = false;                        // the stop it stands at
  let drag = null;                         // the handle in hand: where the finger began, where it is, and its last moves
  let put = null;                          // the last transform written, so a still sheet leaves its layer alone
  let shown = 0;                           // how much of it shows at the stop it stands at, px
  let box = 0;                             // the box itself: always the tall stop's

  // Read off the window every time, so a turned phone's stops are its own.
  const seatHeight = () => Math.round(S.H * (1 - SHEET_H));
  const tallHeight = () => Math.round(S.H * SHEET_TALL);
  const stopHeight = () => (tall ? tallHeight() : seatHeight());

  // How much of it shows under the finger: the stop it stood at moved by the
  // finger, never below the foot, and past tall the rubber band -- the
  // further it is pulled the less it follows, never a window's height past.
  function heldHeight() {
    const h = stopHeight() - (drag.y - drag.y0), top = tallHeight();
    if (h <= top) return Math.max(0, h);
    return top + (1 - 1 / ((h - top) * SHEET_RUBBER / S.H + 1)) * S.H;
  }

  // --- the rail -----------------------------------------------------------------
  // The sheet's own scrollbar: a phone's overlay bar is invisible until the
  // list moves, so it is hard to know there is more. A cell-wide rail down
  // the right edge, a thumb the viewport's share of the content, seated
  // from scrollTop, shown only while the rows overflow.
  const railEl = document.createElement('i');
  railEl.className = 'rail';
  railEl.hidden = true;
  const thumb = document.createElement('i');
  thumb.className = 'thumb';
  railEl.appendChild(thumb);
  if (rail) el.appendChild(railEl);
  let railPut = null;
  function placeRail() {
    if (!rail) return;
    const l = list();
    const over = !!l && l.scrollHeight > l.clientHeight + 1;
    if (railEl.hidden !== !over) railEl.hidden = !over;
    if (!over) { railPut = null; return; }
    const top = l.offsetTop, h = l.clientHeight;
    const th = Math.max(SHEET_RAIL_W * 3, Math.round(h * l.clientHeight / l.scrollHeight));
    const ty = Math.round((h - th) * (l.scrollTop / Math.max(1, l.scrollHeight - l.clientHeight)));
    const key = `${top},${h},${th},${ty}`;
    if (key === railPut) return;
    railPut = key;
    railEl.style.top = `${top}px`;
    railEl.style.height = `${h}px`;
    thumb.style.height = `${th}px`;
    thumb.style.transform = `translate3d(0, ${ty}px, 0)`;
  }

  // --- the seat ---------------------------------------------------------------------
  function place() {
    const b = tallHeight();
    if (!el.classList.contains('bottom')) {
      // The one way in, for every sheet: stood below the foot with no
      // transition, laid out there, and only then let ease up to its stop.
      // Without the reflow the slide would start from wherever the element
      // last stood -- the desk's centered card, flying in from mid-screen.
      el.classList.add('bottom', 'dragging');
      handle.hidden = false;
      box = b;
      el.style.height = `${b}px`;
      el.style.setProperty('--sheet-box', `${b}px`);
      el.style.transform = put = `translate3d(0, ${b}px, 0)`;
      void el.offsetHeight;
      el.classList.remove('dragging');
      enter?.();
    }
    if (b !== box) { box = b; el.style.height = `${b}px`; el.style.setProperty('--sheet-box', `${b}px`); }
    // Put away, however it went, it comes back at the seat.
    if (!open() && tall) { tall = false; el.classList.remove('tall'); }
    // Off the foot by however much of the box is not showing: all of it
    // while it is down, tall-minus-seat at the seat, none when tall -- and
    // under a finger past tall, lifted off the foot, the stylesheet's paper
    // below the box filling the gap.
    const slide = drag ? Math.round(b - heldHeight()) : open() ? b - stopHeight() : b;
    const showing = b - slide;
    if (showing !== shown) {
      shown = showing;
      if (!drag) el.style.setProperty('--sheet-hidden', `${slide}px`);
    }
    const tf = `translate3d(0, ${slide}px, 0)`;
    if (tf !== put) { put = tf; el.style.transform = tf; }
    if (el.classList.contains('dragging') !== !!drag) el.classList.toggle('dragging', !!drag);
    // In hand, the wash is as deep as the sheet is up to its seat; let go,
    // it is the fade's again, which carries on from wherever it stood.
    if (backdrop) {
      const wash = drag ? String(Math.min(1, showing / seatHeight())) : '';
      if (backdrop.style.opacity !== wash) { backdrop.style.opacity = wash; backdrop.style.transition = drag ? 'none' : ''; }
    }
    // Nothing about the rail moves under a finger: the box does not change.
    if (!drag) placeRail();
  }

  // Back to what it was: the pointer stopped being a thumb under an open
  // sheet. Everything the seat wrote is taken back.
  function leave() {
    el.classList.remove('bottom', 'dragging', 'tall');
    railEl.hidden = true; railPut = null;
    el.style.height = '';
    el.style.transform = '';
    el.style.removeProperty('--sheet-hidden');
    el.style.removeProperty('--sheet-box');
    if (backdrop) { backdrop.style.opacity = ''; backdrop.style.transition = ''; }
    handle.hidden = true;
    shown = 0; box = 0; put = null; tall = false; drag = null;
  }

  const seated = () => el.classList.contains('bottom');
  // Where it is on the glass: the window's width, standing on its foot.
  const rect = () => (el.hidden || !seated() ? null : { x: 0, y: S.H - shown, w: S.W, h: shown });

  // --- the handle in hand ---------------------------------------------------------
  // The press is tracked on the handle itself, captured, so the finger may
  // wander off it; the release picks the stop, and a press that went
  // nowhere is a tap, which is nothing.
  const grab = (y, t) => { drag = { y0: y, y, moves: [{ y, t }] }; };
  // Where the finger is, and when. Only the last SHEET_FLING_MS of moves are
  // kept: the speed a sheet is let go at is the speed at the end, not the
  // drag's average.
  function follow(y, t) {
    drag.y = y;
    drag.moves.push({ y, t });
    while (drag.moves.length > 1 && drag.moves[0].t < t - SHEET_FLING_MS) drag.moves.shift();
  }
  handle.addEventListener('pointerdown', e => {
    if (e.button !== 0) return;
    grab(e.clientY, e.timeStamp);
    try { handle.setPointerCapture(e.pointerId); } catch {}
    place();
  });
  handle.addEventListener('pointermove', e => {
    if (!drag) return;
    follow(e.clientY, e.timeStamp);
    place();
  });
  const letGo = e => {
    if (!drag) return;
    follow(e.clientY ?? drag.y, e.timeStamp ?? performance.now());
    const moved = Math.abs(drag.y - drag.y0);
    const h = heldHeight();
    // px/s upward over the moves kept; a finger that sat still through the
    // whole window has left one move and no speed
    const a = drag.moves[0], z = drag.moves[drag.moves.length - 1];
    const v = z.t > a.t ? (a.y - z.y) / (z.t - a.t) * 1000 : 0;
    drag = null;
    if (moved < TAP_SLOP) { place(); return; }
    // Where it would coast to under UIKit's decay, and the stop nearest
    // that out of all three, so a flick from tall can go straight to gone.
    const coast = h + (v / 1000) * SHEET_DECAY / (1 - SHEET_DECAY);
    const to = [0, seatHeight(), tallHeight()].reduce((best, s) => (Math.abs(s - coast) < Math.abs(best - coast) ? s : best));
    if (to === 0) { dismiss(); return; }
    tall = to === tallHeight();
    el.classList.toggle('tall', tall);
    place();
  };
  handle.addEventListener('pointerup', letGo);
  handle.addEventListener('pointercancel', letGo);

  // The rows scrolled to their very top and pulled further down is the sheet
  // being pulled, the way every sheet on a phone works: the touch is taken
  // from the list at that move (`preventDefault`) and handed to the same
  // drag the handle runs. A pull with the list not at the top just scrolls
  // it; `overscroll-behavior: contain` on it keeps the page from
  // rubber-banding in its stead. Touch events rather than pointer events,
  // since the list's own scroll cancels the pointer. A touch that began on
  // the sheet is the sheet's until it ends, wherever the finger is by then.
  let pull = null;
  el.addEventListener('touchstart', e => {
    if (!seated() || drag) return;
    const l = list();
    if (!l || !l.contains(e.target) || handle.contains(e.target)) return;
    pull = { y0: e.changedTouches[0].clientY, atTop: l.scrollTop <= 0 };
  }, { passive: true });
  el.addEventListener('touchmove', e => {
    if (!pull) return;
    const t = e.changedTouches[0];
    if (!drag) {
      if (!pull.atTop || t.clientY - pull.y0 <= 0) { pull = null; return; }   // scrolling the list: not ours
      grab(pull.y0, e.timeStamp);
    }
    follow(t.clientY, e.timeStamp);
    e.preventDefault();
    place();
  }, { passive: false });
  const pullEnd = e => {
    if (!pull) return;
    pull = null;
    if (drag) letGo({ clientY: e.changedTouches[0]?.clientY, timeStamp: e.timeStamp });
  };
  el.addEventListener('touchend', pullEnd);
  el.addEventListener('touchcancel', pullEnd);

  return {
    place, leave, rect, seated,
    // for the checks: which stop, how tall, and the rail's reading
    stop: () => (seated() ? { tall, height: shown, rect: rect() } : null),
    rail: () => (railEl.hidden ? null : { track: railEl.getBoundingClientRect(), thumb: thumb.getBoundingClientRect(), list: list() }),
  };
}
