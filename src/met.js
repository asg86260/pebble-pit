// What the player has met, for the index (DESIGN.md, "The index"). An entry
// is listed once it is met and never hidden again: met is read off the save's
// own facts where it has one (the `met` column of config/index.js), and
// `S.seen` keeps every key once it has been true, so a count that falls back
// to nought -- the diggers reassigned, the helmets spent on the ram -- does
// not take its entry out of the book. The few things the save has no fact
// for (a crit, a bolt of lightning, a bird, poop) are written into `S.seen`
// where they first happen, through `meet`.
//
// No DOM and nothing heavier than the state: the sim calls `meet` from deep
// inside the crew and the weather.

import { S } from './state.js';
import { INDEX } from './config/index.js';

// The thing has happened in front of the player.
export function meet(key) {
  if (!S.seen.includes(key)) S.seen.push(key);
}

// A `met` string split into its kind and its argument: 'tally:muckRains' is
// ['tally', 'muckRains'], a bare 'seenShard' is ['field', 'seenShard'].
export const metParts = met => {
  const i = met.indexOf(':');
  return i < 0 ? ['field', met] : [met.slice(0, i), met.slice(i + 1)];
};

const yes = v => Array.isArray(v) ? v.length > 0 : typeof v === 'number' ? v > 0 : !!v;

// Whether the save's own fact says it is met, this moment.
export function metNow(e) {
  const [kind, arg] = metParts(e.met);
  if (kind === 'field') {
    if (arg === 'start') return true;
    if (arg === 'seen') return S.seen.includes(e.key);
    return yes(S[arg]);
  }
  if (kind === 'tally') return ((S.tally && S.tally[arg]) | 0) > 0;
  if (kind === 'machine') return !!(S.machines && S.machines[arg] && S.machines[arg].bought);
  if (kind === 'shield') return S.shieldsDone.includes(arg) || (!!S.shield && S.shield.kind === arg);
  if (kind === 'beat') return S.beatsDone.includes(arg);
  return false;
}

export const isMet = e => S.seen.includes(e.key) || metNow(e);

// The entries in the book, in its order. `serpent` is whether the deep's half
// is on (`serpentOn` in snatch.js, passed in so this file stays light).
export const metEntries = serpent => INDEX.filter(e => (serpent || !e.serpent) && isMet(e));

// Once in a while, from the frame: every entry met by its fact goes into
// `S.seen`, so it stays met whatever that fact does next.
export function noteMet() {
  for (const e of INDEX) if (!S.seen.includes(e.key) && metNow(e)) S.seen.push(e.key);
}

// The dot: met and never opened.
export const unread = e => !S.indexRead.includes(e.key);
export function markRead(key) {
  if (!S.indexRead.includes(key)) S.indexRead.push(key);
}
