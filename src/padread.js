// Reading a pad (DESIGN.md, "Controller support"): the browser's Gamepad API,
// in every build -- the page, itch's desk build and Steam's, whose Chromium
// has it -- polled once a frame, since it raises no event for a button. A
// pad is read in the "standard" layout, so the confirm is always button 0,
// the bottom face button, whatever the pad prints on it.
//
// What comes out is one plain reading of every pad at once: which buttons
// are down, how far each trigger is pulled, where each stick is. pad.js
// decides what that means; this file decides nothing. A check stands a pad
// of its own in (`fakePad`) and it is read exactly as a real one is.
//
// Also here, because they are about the pad and not the game: which family
// it is (Xbox letters, or drawn shapes for a PlayStation pad), the glyph a
// prompt wears for a button, and the rumble.

import { PAD_RUMBLE_MS, PAD_RUMBLE_STRONG, PAD_RUMBLE_WEAK } from './config.js';

// The standard layout's buttons, by the name the map uses (the Xbox one).
export const BUTTON = {
  a: 0, b: 1, x: 2, y: 3, lb: 4, rb: 5, lt: 6, rt: 7, view: 8, menu: 9,
  l3: 10, r3: 11, up: 12, down: 13, left: 14, right: 15
};
const NAMES = Object.keys(BUTTON);

// A pad a check holds: the same shape a reading is, written by hand.
let fake = null;                // page: the pad a check holds, plugged in until it says off
export const fakePad = p => { fake = p; };

// Every pad's reading, folded into one: a button is down if it is down on
// any pad, a stick is the one pushed furthest. Null when no pad is there.
export function readPads() {
  const pads = [];
  try {
    for (const g of (navigator.getGamepads?.() || [])) if (g && g.connected !== false) pads.push(g);
  } catch {}
  if (fake) pads.push(fake);
  if (!pads.length) return null;
  const out = { down: {}, value: {}, axes: [0, 0, 0, 0], id: '' };
  for (const name of NAMES) { out.down[name] = false; out.value[name] = 0; }
  for (const g of pads) {
    if (!out.id && g.id) out.id = g.id;
    for (const name of NAMES) {
      const b = g.buttons?.[BUTTON[name]];
      if (!b) continue;
      const v = typeof b === 'number' ? b : (b.value ?? (b.pressed ? 1 : 0));
      const pressed = typeof b === 'number' ? b > 0.5 : !!b.pressed;
      if (pressed) out.down[name] = true;
      out.value[name] = Math.max(out.value[name], v);
    }
    (g.axes || []).slice(0, 4).forEach((v, i) => {
      if (Math.abs(v) > Math.abs(out.axes[i])) out.axes[i] = v;
    });
  }
  return out;
}

// --- which pad, and what it prints -------------------------------------------
// The face buttons' marks by family. A PlayStation pad is told by its id
// (Sony's vendor number, or its own name in it); everything else prints the
// Xbox letters in the Xbox places, the Deck included.
const FACES = {
  xbox: { a: 'A', b: 'B', x: 'X', y: 'Y' },
  ps: { a: '✕', b: '○', x: '□', y: '△' }
};
let family = 'xbox';            // page: which maker's pad is in the hand, for its glyphs
export function seeFamily(id = '') {
  family = /054c|playstation|dualshock|dualsense/i.test(id) ? 'ps' : 'xbox';
  return family;
}
export const padFamily = () => family;

// The glyph a prompt wears for a button: a flat ink shape with the mark in
// it (style.css, `.g`), never a brand's color.
const SHAPE = {
  a: 'face', b: 'face', x: 'face', y: 'face',
  lb: 'bump', rb: 'bump', lt: 'trig', rt: 'trig', view: 'bump', menu: 'bump',
  up: 'pad', down: 'pad', left: 'pad', right: 'pad', l: 'stick', r: 'stick', l3: 'stick', r3: 'stick'
};
const MARK = { lb: 'LB', rb: 'RB', lt: 'LT', rt: 'RT', view: '⧉', menu: '≡',
               up: '↑', down: '↓', left: '←', right: '→', l: 'L', r: 'R', l3: 'L', r3: 'R' };
export const markOf = name => FACES[family][name] || MARK[name] || name;
export function glyph(name) {
  const g = document.createElement('b');
  g.className = `g ${SHAPE[name] || 'face'}`;
  g.textContent = markOf(name);
  return g;
}

// --- the rumble ---------------------------------------------------------------
// A short knock on every pad that can give one; a pad that cannot is left
// alone, which is the whole of the fallback.
export function rumble() {
  let pads = [];
  try { pads = [...(navigator.getGamepads?.() || [])]; } catch {}
  if (fake) pads.push(fake);
  for (const g of pads) {
    const act = g?.vibrationActuator;
    if (!act?.playEffect) continue;
    try {
      const p = act.playEffect('dual-rumble', { duration: PAD_RUMBLE_MS,
        strongMagnitude: PAD_RUMBLE_STRONG, weakMagnitude: PAD_RUMBLE_WEAK });
      p?.catch?.(() => {});
    } catch {}
  }
}
