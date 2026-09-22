// The window: larger reading, opened off a board and centered over the yard's
// wash, for anything too long to hang off a station as a popover. A board
// keeps what you glance at; the window holds what you sit and read -- the
// books' four sheets side by side, the crew list one card a body.
//
// The yard keeps running under it. The books are live readings, and a window
// that held the game would freeze the very arrows it was opened to watch;
// holding is the held sheet's job, and it stands over this one.
//
// It stays until it is closed -- the cross, escape, or a press on the wash --
// rather than when the pointer wanders, because a thing you read is not a
// thing you pass by.

import { S } from './state.js';
import { fadeIn, fadeOut } from './fade.js';
import { onTap } from './tap.js';

const winEl = document.getElementById('modal');
const washEl = document.getElementById('modalwash');
const titleEl = document.getElementById('modaltitle');
const closeEl = document.getElementById('modalclose');

// What can be opened, by name: its title, the body that holds it, and how to
// fill it. `fill` builds and refreshes the body's rows; it is asked every frame
// the window is open, the way an open board is, because what it reads moves on
// its own. Registered by the owner of the content (`windowFor`), so this file
// knows nothing about the books or the crew.
const KINDS = {};
export function windowFor(kind, o) { KINDS[kind] = o; }

export const openWindow = () => S.modal;

export function showWindow(kind) {
  const k = kind && KINDS[kind];
  S.modal = k ? kind : null;
  for (const [name, o] of Object.entries(KINDS)) {
    const body = document.getElementById(o.body);
    if (body) body.hidden = name !== S.modal;
  }
  if (k) { titleEl.textContent = k.title; k.fill(); }
}

export const closeWindow = () => { if (!S.modal) return false; showWindow(null); return true; };

// Once a frame, from the hud: the window and its wash kept in step with the
// flag as fades, and the open one's rows brought up to date.
export function stepWindow() {
  (S.modal ? fadeIn : fadeOut)(winEl);
  (S.modal ? fadeIn : fadeOut)(washEl);
  if (S.modal) KINDS[S.modal]?.fill();
}

if (closeEl) onTap(closeEl, () => closeWindow());
if (washEl) onTap(washEl, () => closeWindow());
