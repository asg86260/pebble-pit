import { S } from './state.js';
import { openKv } from './idb.js';

// --- the slots (DESIGN.md, "Save slots and the title page") -------------------
//
// Three yards, one open at a time. Every key below is a function of which
// slot is open: slot 1 is the bare keys, slot n the same keys under `/n`.
// Which slot is open is a fact about the page, never on `S` or in a save.
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
// The yard treats the store as synchronous, so every key of ours is read once
// into `cache` by `primeStore` and answered from there after. A write goes to
// the cache now and the database behind it; whether the database took it is
// the answer the *next* write gives, one write behind but never silent. A key
// localStorage has and the database has not is carried across once. A page
// that never calls `primeStore` (a check, the node yard) is on localStorage.
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
// (settings.js): `blocked` is the browser denying the page any storage,
// `full` the origin's quota.
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
  // Bytes, two per character, which is how the cap is counted.
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

// --- the store seam --------------------------------------------------------
//
// Where the save is kept is the one thing the desk changes about the page: on
// the web it is the web store under KEY; in the Electron shell it is a file,
// through `window.desk` (electron/preload.cjs). Nothing else in src/ reaches
// `window.desk` except settings.js's dialog branches. The previous and broken
// saves go through the web store in both modes. Which tab is writing stays in
// localStorage, because the `storage` event fires for nothing else.
//
// The desk's write is a promise and the yard treats the store as synchronous
// (an import writes the blob and reads it straight back), so the adapter
// answers with the last blob it wrote and reads the disk only before the
// first write. This page is the only writer, so the copy in hand is the truth.
let held = {};        // per slot: the last blob written this session, or '' for none; absent before the first write
let heldFor = null;   // ...and which desk it was written through: a new desk is a new store
let diskTook = true;  // what the disk said about the last write that has answered
function desk() {
  const d = (typeof window !== 'undefined' && window.desk) || null;
  if (d !== heldFor) { heldFor = d; held = {}; diskTook = true; }
  return d;
}

// `current` is the raw string exactly as the store has it: '' is a save that
// was cleared on purpose and null a store that has never held one, and `load`
// needs the difference for the migration.
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
  // The save before the current one, on the desk only; what `load` falls
  // back on.
  lastGood() {
    const d = desk();
    if (!d) return null;
    const g = readDesk().lastGood;
    return g == null ? null : g;
  },
  // Whether it was taken. On the desk the answer is the last one the disk
  // gave: one write behind, never silent.
  set(raw) {
    const d = desk();
    if (!d) return web.set(KEY(), raw);
    held[slot] = raw;
    try {
      Promise.resolve(d.write(slot, raw)).then(ok => { diskTook = !!ok; }, () => { diskTook = false; });
    } catch { diskTook = false; }
    return diskTook;
  },
  // On the desk the file is truncated rather than deleted, so the store still
  // says a save was here once and the migration in `load` does not bring the
  // browser's copy back over a reset.
  remove() {
    const d = desk();
    if (!d) { web.remove(KEY()); return; }
    store.set('');
  }
};

// Any slot's blob, read without opening it; null for a slot that has never
// held one or was cleared.
export function slotRaw(n) {
  const d = desk();
  if (!d) return web.get(keyOf(n)) || null;
  if (n === slot && slot in held) return held[slot] || null;
  return readDesk(n).current || null;
}

// The save before the last import: one step of undo, written by `importSave`
// on every import that takes, read back only if the pasted blob will not
// restore, never read by play.
export const PREV_KEY = () => keyOf(slot, '.prev');

// What a blob has to be before it is believed to be a save. `load` and
// `importSave` both ask this one question.
export function isSave(s) {
  // The same three facts `restore` reads before it will take a blob for a
  // yard rather than a first visit; if the two checks differed, `restore`
  // would quietly boot a new game over a blob this one had passed.
  return typeof s?.stored === 'number' && typeof s?.boulder === 'string' &&
         s.gw > 0 && s.gh > 0 && s.boulder.length === s.gw * s.gh;
}

// A blob that was under KEY and would not read. Answering null for it as for
// no save at all would start the opening and write a fresh game over the blob
// inside a second; so it is put here first, and the sheet's SAVE A COPY hands
// it over while `S.broken` says there is one.
export const BROKEN_KEY = () => keyOf(slot, '.broken');

// Which page last wrote the save. Every page names itself once, and a page
// that finds another name there yields (`persist`, and the `storage` listener
// in main.js). The name follows the slot: two tabs on two slots are two yards.
export const OWNER_KEY = () => keyOf(slot, '.tab');
export const TAB = Math.random().toString(36).slice(2, 10);

// The blob as a save, or null, with the raw put aside under BROKEN_KEY when
// there was one and it would not read.
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
  // The first run of the desk on a machine whose browser has a yard: a store
  // that has never held a save (as against a `current` cleared on purpose)
  // takes the browser's copy, once. Slot 1 only: the browser's one save is
  // slot 1's.
  if (d && slot === 1 && raw == null && store.lastGood() == null) {
    const page = web.get(KEY());
    if (page) { store.set(page); raw = page; }
  }
  if (!raw) return null;
  const s = readSave(raw);
  if (s || !d) return s;
  // Desk only: `current` was there and would not read, so the save before it
  // is the yard, and the sheet says so on boot (main.js). Only a blob that is
  // present and bad falls back: an empty `current` is a reset, not undone.
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

// Whether it was written; the caller says so when it was not.
export function save(state) {
  return saveRaw(JSON.stringify(state));
}

// This page's claim to be the one writing the save, and whose it is now. A
// page that has never written holds no claim and defers to nobody.
export function claimTab() {
  try { localStorage.setItem(OWNER_KEY(), TAB); return true; } catch { return false; }
}
export function tabOwner() {
  try { return localStorage.getItem(OWNER_KEY()); } catch { return null; }
}

export function clear() {
  store.remove();
}

// The raw blob under KEY, or null when there is none.
export function loadRaw() {
  return store.get() || null;
}

export function saveRaw(raw) {
  return store.set(raw);
}

// Nothing is written as nothing: a `.prev` left over from an older run would
// be a save nobody asked for waiting to come back.
export function savePrev(raw) {
  if (raw == null) web.remove(PREV_KEY());
  else web.set(PREV_KEY(), raw);
}

export function loadPrev() {
  return web.get(PREV_KEY());
}
