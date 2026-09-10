const KEY = 'boulder-clicker/v4';

// The save before the last import (wave-release, track C).
//
// `importSave` in persist.js writes whatever was under KEY here before it lets
// a pasted blob replace it, and reads it back only if that blob will not
// restore. It is one step of undo and nothing more: written on every import
// that takes, never rolled, never read by play. The Electron wave turns this
// into a rolling backup on disk; until then it is the one place a good save is
// not lost to a bad paste.
export const PREV_KEY = 'boulder-clicker/v4.prev';

// What a blob has to be before it is believed to be a save. `load` and
// `importSave` both ask this one question, so a blob refused at the door of
// one is refused at the door of the other.
export function isSave(s) {
  return typeof s?.stored === 'number' && typeof s?.boulder === 'string';
}

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (!isSave(s)) return null;
    return s;
  } catch {
    return null;
  }
}

export function save(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // storage full or blocked (private mode) - the game keeps running unsaved
  }
}

export function clear() {
  try { localStorage.removeItem(KEY); } catch {}
}

// The raw blob under KEY, or null when there is none. `save` takes the state
// and writes it; an import has a string in hand and no state yet, so the
// string goes in as it is.
export function loadRaw() {
  try { return localStorage.getItem(KEY); } catch { return null; }
}

export function saveRaw(raw) {
  try { localStorage.setItem(KEY, raw); } catch {}
}

// A page that has never saved has nothing to keep, and a `.prev` left over
// from an older run would be a save nobody asked for waiting to come back --
// so nothing is written as nothing.
export function savePrev(raw) {
  try {
    if (raw == null) localStorage.removeItem(PREV_KEY);
    else localStorage.setItem(PREV_KEY, raw);
  } catch {}
}

export function loadPrev() {
  try { return localStorage.getItem(PREV_KEY); } catch { return null; }
}
