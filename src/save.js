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
  // The same three facts `restore` reads before it will take a blob for a
  // yard rather than a first visit: a purse, and a rock whose string is the
  // size its width and height say it is. A blob with any string for a rock
  // used to pass here, and `restore` then quietly booted a new game over the
  // player's -- so the shape check and the boot's own check are one rule.
  return typeof s?.stored === 'number' && typeof s?.boulder === 'string' &&
         s.gw > 0 && s.gh > 0 && s.boulder.length === s.gw * s.gh;
}

// A blob that was under KEY and would not read (wave-critics, A11).
//
// `load` used to answer null for it, exactly as for no save at all -- and the
// boot's no-save arm starts the opening, the opening dirties the yard, and the
// interval writes a fresh game over the blob inside a second. A truncated
// store, or any shape a later `isSave` refuses, cost the run without a word.
// So a blob that will not read is put here before null is answered, and the
// sheet's SAVE A COPY hands it over while `S.broken` says there is one.
export const BROKEN_KEY = 'boulder-clicker/v4.broken';

// Which page last wrote the save (wave-critics, A10). Two tabs on one origin
// share the store, and each wrote its own yard over the other's once a second:
// an hour played in one was gone the moment the other, left open in the
// background, was clicked. Every page names itself once, writes its name
// beside the save, and a page that finds another name there yields -- see
// `persist`, and the `storage` listener in main.js.
export const OWNER_KEY = 'boulder-clicker/v4.tab';
export const TAB = Math.random().toString(36).slice(2, 10);

export function load() {
  let raw = null;
  try {
    raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (!isSave(s)) { stash(raw); return null; }
    return s;
  } catch {
    stash(raw);
    return null;
  }
}

function stash(raw) {
  try { if (raw) localStorage.setItem(BROKEN_KEY, raw); } catch {}
}
export function loadBroken() {
  try { return localStorage.getItem(BROKEN_KEY); } catch { return null; }
}
export function clearBroken() {
  try { localStorage.removeItem(BROKEN_KEY); } catch {}
}

// Whether it was written. Storage full or blocked (a private window, a quota,
// an eviction) used to be swallowed here and the game ran on unsaved with no
// word; the caller says so now.
export function save(state) {
  return saveRaw(JSON.stringify(state));
}

// This page's claim to be the one writing the save, and whose it is now. A
// page that has never written -- the node yard, a page that is only reading --
// holds no claim and defers to nobody: only a name that is not its own is
// another page.
export function claimTab() {
  try { localStorage.setItem(OWNER_KEY, TAB); } catch {}
}
export function tabOwner() {
  try { return localStorage.getItem(OWNER_KEY); } catch { return null; }
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
  try { localStorage.setItem(KEY, raw); return true; } catch { return false; }
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
