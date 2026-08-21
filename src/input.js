// Wiring the mouse, the wheel and the keyboard to the game.
//
// Nothing in here decides anything: it turns an event into a call on somebody
// else's module. If a new site needs a click, it gets a branch here and its own
// file for the behaviour.

import { P, MINE_DELAY, WORKER } from './config.js';
import { S, bench } from './state.js';
import { clampCam } from './world.js';
import { overBoulder, knockOff } from './rock.js';
import { overMeteor, knockMeteor } from './meteor.js';
import { sweep, release, track } from './hands.js';
import { nearBench, nearLab, showPanel, placeBoard, showTip } from './board.js';
import { overPileMark, pileMarkAt } from './render.js';
import { reset } from './persist.js';
import { mineMs } from './upgrades.js';
import { now } from './clock.js';

const canvas = document.getElementById('c');
const resetEl = document.getElementById('reset');

// Every finger currently down, so a second one can mean something different
// from the first. A mouse only ever has one, so none of this gets in its way.
const down = new Map();
let panning = null;                        // where the fingers were last frame
const TAP_SLOP = 14;                       // pixels a tap may wander and still be a tap
const TAP_TIME = 500;

const middle = () => {
  let x = 0, y = 0;
  for (const p of down.values()) { x += p.x; y += p.y; }
  return { x: x / down.size, y: y / down.size };
};

// a second finger means the player wants to look around, not dig: whatever the
// first one had started is dropped, and the two of them move the view together
function startPan() {
  S.mining = false;
  S.dragging = false;                      // the load stays on the cursor, unthrown
  panning = middle();
}

export function pos(e) {
  const r = canvas.getBoundingClientRect();
  return {
    x: (e.clientX - r.left) / S.zoom + S.camX,
    y: (e.clientY - r.top) / S.zoom + S.camY
  };
}

canvas.addEventListener('pointerdown', e => {
  down.set(e.pointerId, { x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY,
                          at: now(), kind: e.pointerType });
  if (down.size === 2) { startPan(); return; }
  if (down.size > 2) return;

  const p = pos(e);
  S.mouse = p;
  if (overMeteor(p.x, p.y)) {                 // knock a charged spark loose
    knockMeteor(now());
    return;
  }
  if (overBoulder(p.x, p.y)) {                // false once the rock is finished
    knockOff(p.x, p.y);
    S.mining = S.autoMine;                      // holding only mines once unlocked
    S.nextHit = now() + MINE_DELAY;
    try { canvas.setPointerCapture(e.pointerId); } catch {}
    return;
  }
  S.dragging = true;
  S.trail = [];
  track(p.x, p.y);
  try { canvas.setPointerCapture(e.pointerId); } catch {}
  sweep(p.x, p.y);
});

canvas.addEventListener('pointermove', e => {
  const held = down.get(e.pointerId);
  if (held) { held.x = e.clientX; held.y = e.clientY; }

  if (panning && down.size >= 2) {           // two fingers: drag the view along
    const now = middle();
    pan((panning.x - now.x) / S.zoom);
    panning = now;
    return;
  }

  S.mouse = pos(e);
  track(S.mouse.x, S.mouse.y);
  // there is no hovering on a touchscreen, so the board opens on a tap instead
  if (e.pointerType !== 'touch') {
    // one menu: whichever station the cursor is standing at, or none
    showPanel(nearLab(S.mouse.x, S.mouse.y) ? 'lab'
            : nearBench(S.mouse.x, S.mouse.y) ? 'bench' : null);
  }
  if (e.buttons === 0 && (S.mining || S.dragging)) { endDrag(e); return; }
  if (S.dragging) sweep(S.mouse.x, S.mouse.y);
});

export function endDrag(e) {
  const held = down.get(e.pointerId);
  down.delete(e.pointerId);
  if (down.size < 2) panning = null;

  // A tap on a touchscreen is what a hover is on a desk: near the bench it opens
  // the board, anywhere else it puts it away.
  if (held && held.kind === 'touch' && !panning &&
      Math.hypot(e.clientX - held.x0, e.clientY - held.y0) < TAP_SLOP &&
      now() - held.at < TAP_TIME) {
    // one board at a time: two of them open at once on a phone screen would
    // simply sit on top of each other
    const p = pos(e);
    if (nearBench(p.x, p.y)) showPanel(S.boardOpen ? null : 'bench');
    else if (nearLab(p.x, p.y)) showPanel(S.labBoardOpen ? null : 'lab');
    else showPanel(null);
  }

  S.mining = false;
  if (!S.dragging) return;
  S.dragging = false;
  const p = pos(e);
  release(p.x, p.y);
}
canvas.addEventListener('pointerup', endDrag);
canvas.addEventListener('pointercancel', endDrag);
addEventListener('pointerup', endDrag);          // catch releases outside the canvas
addEventListener('blur', () => {
  down.clear();
  panning = null;
  S.mining = false;
  if (S.dragging) { S.dragging = false; release(S.mouse.x, S.mouse.y); }
});


export function disarmReset() {
  S.resetArmed = 0;
  resetEl.classList.remove('armed');
  resetEl.textContent = 'reset progress';
}

resetEl.addEventListener('click', () => {
  if (!S.resetArmed) {
    S.resetArmed = setTimeout(disarmReset, 4000);
    resetEl.classList.add('armed');
    resetEl.textContent = 'erase everything?';
    return;
  }
  clearTimeout(S.resetArmed);
  disarmReset();
  reset();
});

export // A stopped station says why, in the one place words are cheap: under the
// cursor, and only when the cursor goes looking.
function askedAbout(x, y) {
  for (const p of S.piles) {
    if (!S.pileFull[p.key] || !overPileMark(p.key, x, y)) continue;
    showTip('pile is full', pileMarkAt(p.key));
    return;
  }
  showTip(null);
}

function pan(dx) {
  S.camTo = null;                          // the player takes the view back
  const was = S.camX;
  S.camX += dx;
  clampCam();
  if (S.camX !== was && S.boardOpen) placeBoard();
}

canvas.addEventListener('wheel', e => {
  e.preventDefault();
  pan((Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY) * 0.8);
}, { passive: false });

// the cursor leaving the menu itself closes it, whichever station it is at
document.getElementById('panel').addEventListener('pointerleave', () => showPanel(null));
addEventListener('keydown', e => {
  if (e.key === 'r' || e.key === 'R') reset();
  if (e.key === 'ArrowRight') pan(P * 12);
  if (e.key === 'ArrowLeft') pan(-P * 12);
});
