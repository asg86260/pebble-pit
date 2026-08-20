const KEY = 'boulder-clicker/v3';

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (typeof s?.stored !== 'number' || typeof s?.boulder !== 'string') return null;
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
