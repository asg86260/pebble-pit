// Which column a review sits in, worked out from what was written and when.
// Pure, so the page (review.html) and test/review-status.test.mjs read the
// same rule.
//
// A keep note puts a review to iterating only until something newer than the
// note arrives: a `changed` line the coordinator wrote, or a new fingerprint
// from the dev server. After that the move is the owner's, so it is waiting on
// them. A written status entry (building, or iterating set by hand) wins while
// it stands; a stop is signed off.
const at = x => Date.parse(x) || 0;

// entry: the review's status.json row or null; notes, changes: this review's
// own; printSince: when its fingerprint last changed (ISO) or null.
export function reviewState({ entry = null, notes = [], changes = [], printSince = null, landed = false, now = Date.now(), staleMs = 2 * 3600e3 }) {
  const last = notes.reduce((a, n) => !a || at(n.at) >= at(a.at) ? n : a, null);
  const stale = !!entry && now - at(entry.since) > staleMs;
  const w = entry ? { what: entry.what, since: entry.since, stale } : { what: last?.say || '', since: last?.at, stale: false };
  if (landed) return { state: 'landed', ...w };
  if (last?.verdict === 'stop') return { state: 'signed', ...w, what: entry?.what || '', since: entry?.since, rebuilding: !!entry };
  if (entry) return { state: entry.state === 'building' ? 'building' : 'iterating', ...w };
  const newest = Math.max(printSince ? at(printSince) : 0, ...changes.map(c => at(c.at)));
  if (last && !(newest > at(last.at))) return { state: 'iterating', ...w };
  return { state: 'waiting', what: '', since: null, stale: false };
}
