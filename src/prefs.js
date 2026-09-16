// What the player has said about how the game should behave, as opposed to
// what has happened in it (`S` and the save). A preference survives a reset
// and does not travel with an exported save, so it has its own key rather
// than a place in state.js's lists.

const KEY = 'boulder-clicker/prefs';

const DEFAULTS = {
  motion: null,      // null = follow the system; true = less; false = full
  muted: false,      // the mute (DESIGN.md, the sound of the yard)
  volume: 1,         // the slider: a share of SND_MASTER, 0..1, so 1 is "quiet"
  touch: null,       // null = follow the pointer; true = a thumb; false = a mouse
  dark: null,        // null = follow the system; true = white on black; false = black on white
};

let prefs = { ...DEFAULTS };
try {
  const raw = localStorage.getItem(KEY);
  if (raw) prefs = { ...DEFAULTS, ...JSON.parse(raw) };
} catch {
  // no storage, or a bad blob: the defaults are the preference
}

export const pref = name => prefs[name];

export function setPref(name, value) {
  prefs[name] = value;
  try { localStorage.setItem(KEY, JSON.stringify(prefs)); } catch {}
}

// Whether the camera and the shake should hold still: the sheet's switch, else
// the system's answer. The node yard has no `matchMedia`, so it gets the full
// picture, which is what the checks are written against.
export function reducedMotion() {
  if (prefs.motion != null) return prefs.motion;
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// Whether the pointer is a thumb (DESIGN.md, "Playing it on a phone"): the
// sheet's switch, else what the platform says its primary pointer is. Not
// the width and not the user agent -- a narrow desk window keeps its wheel
// and a wide tablet gets the hop, because it is the finger these are for.
// Asked once of the platform and kept: a pointer does not change kind
// mid-game, and every seat in the frame asks this.
let coarsePointer = null;
export function coarse() {
  if (forced != null) return forced;
  if (prefs.touch != null) return prefs.touch;
  coarsePointer ??= typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;
  return coarsePointer;
}
// A phone stood up for a scene or a check, without writing the player's
// preference: in memory only, cleared with null.
let forced = null;
export const forceCoarse = v => { forced = v; };

// Whether the page is turned over, white on black (DESIGN.md, "Dark mode"):
// the sheet's switch, else what the system asks for. The node yard has no
// `matchMedia` and reads "off", which is what every shot is checked against.
let forcedDark = null;
export function dark() {
  if (forcedDark != null) return forcedDark;
  if (prefs.dark != null) return prefs.dark;
  return typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: dark)').matches;
}

// The class the stylesheets turn the page over on, put on the root of the
// top page only: a framed page (the title's picture, the scene bench) is
// turned over by the page around it, and turning it again would put it back.
// Each page's head puts the same class on from the store before the first
// paint (play.html, index.html), so the page never opens white and then goes
// dark; this is the switch and the system changing its mind afterwards.
export function applyDark() {
  if (typeof document === 'undefined' || window !== window.top) return;
  document.documentElement.classList.toggle('dark', dark());
}
if (typeof matchMedia === 'function') matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', applyDark);

// Dark stood up for a scene or a check, without writing the preference.
export const forceDark = v => { forcedDark = v; applyDark(); };
