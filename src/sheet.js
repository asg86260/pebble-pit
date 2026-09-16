// A sheet from the bottom, on a phone (DESIGN.md, "Boards as bottom
// sheets"): the one mechanism for every sheet the phone has -- the boards'
// panel (board.js) and the held sheet's settings (gear.js). The window's
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
// (SHEET_MS) eases it to a stop only once the finger has gone. The rows
// keep their last line inside the part that shows (`--sheet-hidden`),
// written at the stops and never a frame at a time.
//
// A seat is made for an element and asked to `place` it every frame the
// sheet is up, `leave` when the pointer stops being a thumb, and answers
// `rect` and `stop` for whoever stands things around it.

import { SHEET_H, SHEET_TALL, SHEET_DISMISS, SHEET_MS, SHEET_HANDLE, SHEET_RAIL_W, SHEET_RAIL_INSET, TAP_SLOP } from './config.js';
import { S } from './state.js';

const root = document.documentElement;
root.style.setProperty?.('--sheet-ms', `${SHEET_MS}ms`);
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
export function sheetSeat(el, { handle, list, open, dismiss, enter = null, rail = true }) {
  let tall = false;                        // the stop it stands at
  let drag = null;                         // the handle in hand: where the finger began, and how far it has come
  let put = null;                          // the last transform written, so a still sheet leaves its layer alone
  let shown = 0;                           // how much of it shows at the stop it stands at, px
  let box = 0;                             // the box itself: always the tall stop's

  const stopHeight = () => Math.round(S.H * (tall ? SHEET_TALL : (1 - SHEET_H)));
  const tallHeight = () => Math.round(S.H * SHEET_TALL);

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
    if (!el.classList.contains('bottom')) {
      el.classList.add('bottom');
      handle.hidden = false;
      el.style.transform = '';
      put = null;
      enter?.();
    }
    const b = tallHeight();
    if (b !== box) { box = b; el.style.height = `${b}px`; }
    const seat = stopHeight();
    // Off the foot by however much of the box is not showing: all of it
    // while it is down, tall-minus-seat at the seat, none when tall.
    let slide = open() ? b - seat : b;
    if (drag) slide = Math.max(0, Math.min(b, slide + (drag.y - drag.y0)));
    const showing = b - slide;
    if (showing !== shown) {
      shown = showing;
      if (!drag) el.style.setProperty('--sheet-hidden', `${slide}px`);
    }
    const tf = `translate3d(0, ${slide}px, 0)`;
    if (tf !== put) { put = tf; el.style.transform = tf; }
    if (el.classList.contains('dragging') !== !!drag) el.classList.toggle('dragging', !!drag);
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
    handle.hidden = true;
    shown = 0; box = 0; put = null; tall = false; drag = null;
  }

  const seated = () => el.classList.contains('bottom');
  // Where it is on the glass: the window's width, standing on its foot.
  const rect = () => (el.hidden || !seated() ? null : { x: 0, y: S.H - shown, w: S.W, h: shown });

  // --- the handle in hand ---------------------------------------------------------
  // The press is tracked on the handle itself, captured, so the finger may
  // wander off it; the release decides between the three stops by how far
  // it went, and a press that went nowhere is a tap, which is nothing.
  handle.addEventListener('pointerdown', e => {
    if (e.button !== 0) return;
    drag = { y0: e.clientY, y: e.clientY };
    try { handle.setPointerCapture(e.pointerId); } catch {}
    place();
  });
  handle.addEventListener('pointermove', e => {
    if (!drag) return;
    drag.y = e.clientY;
    place();
  });
  const letGo = e => {
    if (!drag) return;
    const dy = (e.clientY ?? drag.y) - drag.y0;
    const seat = stopHeight();
    drag = null;
    if (Math.abs(dy) < TAP_SLOP) { place(); return; }
    // Down past a third of what shows: from tall back to the seat, from
    // the seat away. Up: tall.
    if (dy > seat * SHEET_DISMISS) { if (tall) tall = false; else { dismiss(); return; } }
    else if (dy < 0) tall = true;
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
      drag = { y0: pull.y0, y: t.clientY };
    }
    drag.y = t.clientY;
    e.preventDefault();
    place();
  }, { passive: false });
  const pullEnd = e => {
    if (!pull) return;
    pull = null;
    if (drag) letGo({ clientY: e.changedTouches[0]?.clientY });
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
