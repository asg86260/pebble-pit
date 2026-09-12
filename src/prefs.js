// What the player has said about how the game should behave -- as opposed to
// what has happened in the game, which is `S` and the save.
//
// A preference is not part of a run. It survives a reset, it should not travel
// with an exported save, and it is read by the page rather than by the yard.
// So it has its own key and its own two-line store rather than a place in
// state.js's lists. Everything here is a plain value with a default; the one
// with three states is motion, where `null` means "whatever the system asked
// for", which is what a player who never opened the sheet gets.

const KEY = 'boulder-clicker/prefs';

const DEFAULTS = {
  motion: null,      // null = follow the system; true = less; false = full
  muted: false,      // the mute (DESIGN.md, the sound of the yard)
  volume: 1,         // the slider: a share of SND_MASTER, 0..1, so 1 is "quiet"
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

// Whether the camera and the shake should hold still. The system's answer is
// the default, and the sheet's switch overrides it either way. Off the node
// yard there is no `matchMedia`, so the answer there is the full picture, which
// is what every existing check was written against.
export function reducedMotion() {
  if (prefs.motion != null) return prefs.motion;
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}
