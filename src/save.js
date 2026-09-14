import { S } from './state.js';
import { openKv } from './idb.js';

// --- the slots (DESIGN.md, "Save slots and the title page") -------------------
//
// Three yards, one open at a time. Every key below is a function of which
// slot is open: slot 1 is exactly the keys the game has always used, so no
// existing save moves; slot n is the same keys under `/n`. Which slot is open
// is a fact about the page and not about any yard -- it is never on `S` and
// never in a save -- so it lives beside the prefs, read once as the module
// loads and written by `openSlot`.
export const SLOTS = 3;
const SLOT_KEY = 'boulder-clicker/slot';
const BASE = 'boulder-clicker/v4';
let slot = 1;
export const openSlot = () => slot;
export function setSlot(n) {
  if (!(n >= 1 && n <= SLOTS)) return;
  slot = n;
  web.set(SLOT_KEY, String(n));
}
const keyOf = (n, suffix = '') => (n === 1 ? BASE : BASE + '/' + n) + suffix;
const KEY = () => keyOf(slot);

// --- the web store: IndexedDB, with localStorage as the way in and the way out
//
// The page's store is IndexedDB (idb.js says why), and the yard treats the
// store as synchronous, so every key of ours is read once, before the boot,
// into `cache`, and answered from there after. A write goes to the cache now
// and to the database behind it; whether the database took it is the answer
// the *next* write gives -- one write behind, the shape the desk adapter
// below already has, and never silent. localStorage is where the save was
// until now, so a key the database has not got and localStorage has is
// carried across once and let go of there, which also hands back the shared
// quota it was sitting in. And localStorage is the store when IndexedDB is
// not to be had -- the node yard, a browser refusing it -- exactly as before.
//
// `primeStore` is the one read. main.js awaits it before `restore`; a page
// that never calls it (a check, the node yard) is on localStorage.
let kv = null;              // the database, or null for localStorage
const cache = new Map();    // every key of ours, as the database has them
let dbTook = true;          // what the database said about the last write that has answered
let pending = Promise.resolve();
const OURS = () => {
  const keys = [SLOT_KEY];
  for (let n = 1; n <= SLOTS; n++) keys.push(keyOf(n), keyOf(n, '.prev'), keyOf(n, '.broken'));
  return keys;
};
export async function primeStore(open = openKv) {
  cache.clear();
  kv = null;
  dbTook = true;
  try { kv = await open(); } catch { kv = null; }
  if (kv) {
    let all;
    try { all = await kv.all(); } catch { kv = null; }
    if (kv) {
      for (const k of OURS()) {
        if (all.has(k)) { cache.set(k, all.get(k)); continue; }
        let was = null;
        try { was = localStorage.getItem(k); } catch {}
        if (was == null) continue;
        cache.set(k, was);
        try {
          await kv.set(k, was);
          try { localStorage.removeItem(k); } catch {}
        } catch {}
      }
    }
  }
  const n = +web.get(SLOT_KEY);
  slot = n >= 1 && n <= SLOTS ? n : 1;
}
// For a check: the database write behind the last `set`, settled.
export const storeSettled = () => pending;

// What went wrong the last time the store refused, so the sheet can say which
// (settings.js). `blocked` is the browser denying the page any storage at all
// -- third-party storage turned off, and every read throws too; `full` is
// the origin's quota, which on a shared host is mostly other sites' doing.
let trouble = null;
function refused(err) {
  const name = err?.name || String(err);
  const kind = name === 'SecurityError' ? 'blocked'
             : /Quota|NS_ERROR_DOM_QUOTA/.test(name) || err?.code === 22 || err?.code === 1014 ? 'full'
             : 'other';
  trouble = { kind, name };
}
export function storeTrouble() {
  if (!trouble) return null;
  // How much of the origin's localStorage there is, and how much is ours,
  // in bytes -- two per character, which is how the cap is counted.
  let used = 0, ours = 0;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      const n = (k.length + (localStorage.getItem(k) || '').length) * 2;
      used += n;
      if (k.startsWith('boulder-clicker')) ours += n;
    }
  } catch {}
  return { ...trouble, used, ours };
}

const web = {
  get(k) {
    if (kv) return cache.has(k) ? cache.get(k) : null;
    try { return localStorage.getItem(k); } catch (err) { refused(err); return null; }
  },
  set(k, raw) {
    if (kv) {
      cache.set(k, raw);
      const took = dbTook;
      pending = kv.set(k, raw).then(() => { dbTook = true; trouble = null; },
                                    err => { dbTook = false; refused(err); });
      return took;
    }
    try { localStorage.setItem(k, raw); trouble = null; return true; } catch (err) { refused(err); return false; }
  },
  remove(k) {
    if (kv) {
      cache.delete(k);
      pending = kv.del(k).catch(() => {});
      return;
    }
    try { localStorage.removeItem(k); } catch {}
  }
};

// --- the store seam (wave-desk-sound, track A) --------------------------------
//
// Where the save is kept is the one thing the desk changes about the page. On
// a web page it is the web store above, under KEY; in the Electron shell it is
// a file, reached through the five functions of `window.desk`
// (electron/preload.cjs). Everything below that reads or writes the save goes
// through this object and nothing else in src/ ever reaches `window.desk`
// except settings.js's two dialog branches. The other keys -- the previous
// save, a broken one -- go through the web store in both modes: it exists in
// the shell, and those are facts about the page rather than the save. Which
// tab is writing stays in localStorage on its own, because the `storage`
// event that tells a tab it has been overtaken fires for nothing else.
//
// The desk's write is a promise and its read is synchronous, and the yard
// treats the store as synchronous everywhere -- an import writes the blob and
// reads it straight back through `restore`. So the adapter keeps the last blob
// it wrote and answers with that, and the disk is only read when this page
// has not written yet. This page is the only writer, so the copy in hand is
// the truth and the file is only ever behind it, never ahead.
let held = {};        // per slot: the last blob written this session, or '' for none; absent before the first write
let heldFor = null;   // ...and which desk it was written through: a new desk is a new store
let diskTook = true;  // what the disk said about the last write that has answered
function desk() {
  const d = (typeof window !== 'undefined' && window.desk) || null;
  if (d !== heldFor) { heldFor = d; held = {}; diskTook = true; }
  return d;
}

// `desk.read()`'s two blobs, or the page's one. `current` is the raw string
// exactly as the store has it -- '' is a save that was cleared on purpose and
// null is a store that has never held one, and `load` needs the difference
// for the migration.
function readDesk(n = slot) {
  try { return desk().read(n) || {}; } catch { return {}; }
}

const store = {
  get() {
    const d = desk();
    if (!d) return web.get(KEY());
    if (slot in held) return held[slot];
    const c = readDesk().current;
    return c == null ? null : c;
  },
  // The save before the current one, on the desk only: the page has no second
  // copy of its own, and the desk's is the one `load` falls back on.
  lastGood() {
    const d = desk();
    if (!d) return null;
    const g = readDesk().lastGood;
    return g == null ? null : g;
  },
  // Whether it was taken. On the desk the write is fire-and-forget and the
  // answer is the last one the disk gave, so a refused write is reported on
  // the next -- one write behind, but never silent.
  set(raw) {
    const d = desk();
    if (!d) return web.set(KEY(), raw);
    held[slot] = raw;
    try {
      Promise.resolve(d.write(slot, raw)).then(ok => { diskTook = !!ok; }, () => { diskTook = false; });
    } catch { diskTook = false; }
    return diskTook;
  },
  // On the desk, removing is writing nothing: the file is truncated rather
  // than deleted, so the store still says a save was here once and the
  // migration below does not bring the browser's copy back over a reset.
  remove() {
    const d = desk();
    if (!d) { web.remove(KEY()); return; }
    store.set('');
  }
};

// Any slot's blob, read without opening it -- what the saves page reads its
// labels off. Null for a slot that has never held one or was cleared. On the
// desk the open slot answers from the copy in hand, as `get` does.
export function slotRaw(n) {
  const d = desk();
  if (!d) return web.get(keyOf(n)) || null;
  if (n === slot && slot in held) return held[slot] || null;
  return readDesk(n).current || null;
}

// The save before the last import (wave-release, track C).
//
// `importSave` in persist.js writes whatever was under KEY here before it lets
// a pasted blob replace it, and reads it back only if that blob will not
// restore. It is one step of undo and nothing more: written on every import
// that takes, never rolled, never read by play. On the desk the store keeps
// its own `last-good.json` beside the save (electron/store.cjs); this key is
// still the one step of undo an import has, in both modes.
export const PREV_KEY = () => keyOf(slot, '.prev');

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
export const BROKEN_KEY = () => keyOf(slot, '.broken');

// Which page last wrote the save (wave-critics, A10). Two tabs on one origin
// share the store, and each wrote its own yard over the other's once a second:
// an hour played in one was gone the moment the other, left open in the
// background, was clicked. Every page names itself once, writes its name
// beside the save, and a page that finds another name there yields -- see
// `persist`, and the `storage` listener in main.js.
// The name follows the slot: two tabs on two different slots are two yards,
// and neither yields to the other.
export const OWNER_KEY = () => keyOf(slot, '.tab');
export const TAB = Math.random().toString(36).slice(2, 10);

// The blob as a save, or null when it is not one -- with the raw put aside
// under BROKEN_KEY when there was one and it would not read.
function readSave(raw) {
  try {
    const s = JSON.parse(raw);
    if (isSave(s)) return s;
  } catch {}
  stash(raw);
  return null;
}

export function load() {
  const d = desk();
  S.fellBack = false;
  let raw = store.get();
  // Migration (wave-desk-sound, track A): the first run of the desk, on a
  // machine whose browser has a yard. A store that has never held a save --
  // neither file there, as against a `current` that was cleared on purpose --
  // takes the browser's copy, once. The localStorage copy is left where it
  // is; it is never read again while the file exists, because the file exists.
  // Slot 1 only: the browser's one save is slot 1's, and an empty slot 2 on
  // the desk is empty, not a store that has never been migrated.
  if (d && slot === 1 && raw == null && store.lastGood() == null) {
    const page = web.get(KEY());
    if (page) { store.set(page); raw = page; }
  }
  if (!raw) return null;
  const s = readSave(raw);
  if (s || !d) return s;
  // Fallback (desk only): `current` was there and would not read, so the save
  // before it is the yard, and the sheet says so on boot -- see main.js. Only
  // a blob that is present and bad falls back: an empty `current` is a reset,
  // and the reset is not undone. The bad blob is under BROKEN_KEY already.
  const good = store.lastGood();
  if (!good) return null;
  let fell = null;
  try { const g = JSON.parse(good); if (isSave(g)) fell = g; } catch {}
  if (fell) S.fellBack = true;
  return fell;
}

function stash(raw) {
  if (raw) web.set(BROKEN_KEY(), raw);
}
export function loadBroken() {
  return web.get(BROKEN_KEY());
}
export function clearBroken() {
  web.remove(BROKEN_KEY());
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
  try { localStorage.setItem(OWNER_KEY(), TAB); return true; } catch { return false; }
}
export function tabOwner() {
  try { return localStorage.getItem(OWNER_KEY()); } catch { return null; }
}

export function clear() {
  store.remove();
}

// The raw blob under KEY, or null when there is none. `save` takes the state
// and writes it; an import has a string in hand and no state yet, so the
// string goes in as it is.
export function loadRaw() {
  return store.get() || null;
}

export function saveRaw(raw) {
  return store.set(raw);
}

// A page that has never saved has nothing to keep, and a `.prev` left over
// from an older run would be a save nobody asked for waiting to come back --
// so nothing is written as nothing.
export function savePrev(raw) {
  if (raw == null) web.remove(PREV_KEY());
  else web.set(PREV_KEY(), raw);
}

export function loadPrev() {
  return web.get(PREV_KEY());
}
