// What the player has said about how the game should behave, as opposed to
// what has happened in it (`S` and the save). A preference survives a reset
// and does not travel with an exported save, so it has its own key rather
// than a place in state.js's lists.

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

// Whether the camera and the shake should hold still: the sheet's switch, else
// the system's answer. The node yard has no `matchMedia`, so it gets the full
// picture, which is what the checks are written against.
export function reducedMotion() {
  if (prefs.motion != null) return prefs.motion;
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}
