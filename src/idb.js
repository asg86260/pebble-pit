// IndexedDB as a key-value store, and nothing more of it.
//
// The save lived in localStorage, and on itch.io that is the wrong place: every
// HTML game there is served from one origin, and localStorage's cap -- about
// five megabytes -- is one cap for the whole origin, shared with every other
// game a player has ever run there. A player with a full one saw "storage is
// blocked or full" from us while games that write a high score kept working,
// because a high score still fit and a yard did not. IndexedDB has its own
// quota, hundreds of megabytes on the same origin, and the same partitioning
// and blocking rules as localStorage, so the save is no worse off anywhere and
// out of the shared wall. See DESIGN.md, "The save is in IndexedDB".
//
// This file is the whole of what the game knows about IndexedDB: one database,
// one object store, strings under string keys, and four promises. `openKv`
// answers null wherever IndexedDB is missing, refused or broken -- a browser
// blocking third-party storage, an old private window, the node yard -- and
// save.js then keeps the save in localStorage exactly as before.

const DB = 'boulder-clicker';
const STORE = 'kv';

const done = req => new Promise((ok, no) => {
  req.onsuccess = () => ok(req.result);
  req.onerror = () => no(req.error);
});

export async function openKv() {
  if (typeof indexedDB === 'undefined') return null;
  let db;
  try {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    db = await done(req);
  } catch {
    return null;
  }
  // A store that has vanished under the page -- the site's data cleared while
  // it is open -- closes the connection; the next call finds `db` closed and
  // throws, which save.js reports as a refused write rather than losing.
  const tx = mode => db.transaction(STORE, mode).objectStore(STORE);
  return {
    get: key => done(tx('readonly').get(key)).then(v => (typeof v === 'string' ? v : null)),
    set: (key, raw) => done(tx('readwrite').put(raw, key)).then(() => true),
    del: key => done(tx('readwrite').delete(key)).then(() => true),
    // Every key and value, for the one read the boot makes before the first
    // frame: the yard treats the store as synchronous, so it is all read once
    // and answered from memory after.
    async all() {
      const os = tx('readonly');
      const [keys, vals] = await Promise.all([done(os.getAllKeys()), done(os.getAll())]);
      const m = new Map();
      keys.forEach((k, i) => { if (typeof vals[i] === 'string') m.set(k, vals[i]); });
      return m;
    }
  };
}
