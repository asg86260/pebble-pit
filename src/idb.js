// IndexedDB as a key-value store, and nothing more of it: one database, one
// object store, strings under string keys. The save lives here rather than in
// localStorage because itch.io serves every game from one origin and
// localStorage's five megabytes are shared across all of them (DESIGN.md,
// "The save is in IndexedDB"). `openKv` answers null wherever IndexedDB is
// missing, refused or broken, and save.js then keeps the save in localStorage.

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
  // A store cleared under the page closes the connection; the next call throws,
  // which save.js reports as a refused write rather than losing.
  const tx = mode => db.transaction(STORE, mode).objectStore(STORE);
  return {
    get: key => done(tx('readonly').get(key)).then(v => (typeof v === 'string' ? v : null)),
    set: (key, raw) => done(tx('readwrite').put(raw, key)).then(() => true),
    del: key => done(tx('readwrite').delete(key)).then(() => true),
    // Every key and value, for the one read at boot: the yard treats the store
    // as synchronous, so it is all read once and answered from memory after.
    async all() {
      const os = tx('readonly');
      const [keys, vals] = await Promise.all([done(os.getAllKeys()), done(os.getAll())]);
      const m = new Map();
      keys.forEach((k, i) => { if (typeof vals[i] === 'string') m.set(k, vals[i]); });
      return m;
    }
  };
}
