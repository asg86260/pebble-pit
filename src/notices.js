// The record: what the yard has done (DESIGN.md, "The noticeboard, and the
// record on it").
//
// Recognition and nothing else: no notice pays out, unlocks a row or makes
// anything faster. A notice is earned one of three ways:
//
//   a standing fact   `when` is a predicate over S, asked twice a second.
//   an event hook     no `when`; the moment calls `earn(key)` where it happens.
//   a witness         a flag or stamp in `S.tally`, because the question is
//                     about a stretch of time rather than a moment.
//
// A witness is a key in the one `S.tally` object, bumped at the one place the
// event happens; never a new field on `S`.

import {
  NOTICE_TICK_S, NOTICE_ROCKS, NOTICE_PEBBLES, NOTICE_CREW, NOTICE_ORE,
  NOTICE_RIFT, NOTICE_BREWS, NOTICE_LIVED_MS, NOTICE_FAST_ROCK_S
} from './config.js';
import { S, pit } from './state.js';
import { CATALOG } from './catalog.js';
import { pitCapacity } from './pit.js';
import { now } from './clock.js';
import { JOB } from './jobs.js';

// --- the catalog ---------------------------------------------------------------
// The names and notes are catalog.js's; here is how each is earned, a
// predicate by key. A notice with no `when` is a moment, earned where it
// happens.

// The ladders' thresholds, from the same tables the catalog names them from.
const ladder = (prefix, list, fact) =>
  Object.fromEntries(list.map((n, i) => [prefix + i, () => fact() >= n]));

// every trade taught to everybody doing that job, with somebody in each
const allTrades = () =>
  S.rockhands > 0 && S.breakers >= S.rockhands &&
  S.haulers > 0 && S.carters >= S.haulers &&
  S.quarriers > 0 && S.blasters >= S.quarriers &&
  S.farmhands > 0 && S.growers >= S.farmhands;

// every building the yard can put up, standing
const allBuilt = () =>
  S.quarryOpen && S.farmOpen && S.apothecaryOpen && S.casinoOpen &&
  S.shackOpen && S.outhouseOpen && S.towerOpen && S.scrubOpen;

// A body on every post, read off the JOB word list so a new job is counted
// without this being touched. It must be `jobs.js` (the words) and not
// `crew/jobs.js` (the registry): the registry reaches rock.js, which reaches
// this file, and under that ring the quarry came back from a reload with
// nobody at the face.
const everyJobStaffed = () =>
  Object.values(JOB).every(j => (S[j] | 0) > 0);

// the longest anybody has been on the payroll
const eldest = () => S.workers.reduce((n, w) => Math.max(n, w.lived || 0), 0);

const WHEN = {
  firstgrain: () => S.banked > 0,
  firstrock: () => S.boulderNo >= 2,
  gotout: () => S.rescued,
  firstcore: () => S.seenCore,
  firsthire: () => S.crew >= 2,
  firstshard: () => S.seenShard,
  firstspore: () => S.seenSpore,
  firstspark: () => S.seenSpark,
  // Nine tenths full, not full: the first grain the hole cannot take is the
  // tear, so 'full' and 'torn' would land on the same frame.
  holefull: () => S.seenFullPit || pit.n >= pitCapacity() * 0.9,
  rifttorn: () => S.riftOpen,
  drowned: () => S.drowned,
  star: () => S.meteorOpen,
  firsthat: () => S.wizardHats >= 1,
  firstbrew: () => S.brews >= 1,
  firsttrade: () => S.breakers + S.carters + S.blasters + S.growers >= 1,
  alltrades: allTrades,
  allbuilt: allBuilt,
  ...ladder('rock', NOTICE_ROCKS, () => S.boulderNo),
  ...ladder('pebble', NOTICE_PEBBLES, () => S.banked),
  ...ladder('crew', NOTICE_CREW, () => S.crew),
  ...ladder('ore', NOTICE_ORE, () => S.quarryTotal),
  rift1e6: () => (S.riftAte || 0) >= NOTICE_RIFT,
  brew100: () => (S.brews || 0) >= NOTICE_BREWS,
  lived1h: () => eldest() >= NOTICE_LIVED_MS,
  everyjob: everyJobStaffed,
  muckrain: () => (S.rains | 0) >= 1
};

export const NOTICES = CATALOG.map(n => (WHEN[n.key] ? { ...n, when: WHEN[n.key] } : { ...n }));

const BY_KEY = new Map(NOTICES.map(n => [n.key, n]));
export const noticeFor = key => BY_KEY.get(key) || null;

// --- what is earned -------------------------------------------------------------

export const hasNotice = key => S.won.includes(key);
export const noticeCount = () => S.won.length;
export const noticeTotal = () => NOTICES.length;

// Notices earned but not yet looked at, which puts the tick over the board. A
// subtraction rather than a second list, so it cannot fall out of step.
export const unreadNotices = () => Math.max(0, S.won.length - S.wonSeen);

// The board has been opened: everything on it now counts as read.
export function markNoticesRead() {
  if (S.wonSeen === S.won.length) return;
  S.wonSeen = S.won.length;
}

// `quiet` writes the record without announcing it.
export function earn(key, quiet = false) {
  if (!BY_KEY.has(key) || S.won.includes(key)) return false;
  // A fresh array rather than a push: the save notices a new array where it
  // can miss a mutation in place.
  S.won = [...S.won, key];
  // A sequence, not the clock: `now()` starts again with every page, so a
  // notice earned in the second sitting would sort under one from the first.
  S.wonSeq = (S.wonSeq || 0) + 1;
  S.wonAt = { ...S.wonAt, [key]: S.wonSeq };
  if (quiet) { S.wonSeen = S.won.length; hushNotices(); }
  return true;
}

// Nothing earned so far is announced: the toast says every notice past
// `wonShown`. The one line that knows what silence is.
export function hushNotices() { S.wonShown = S.wonSeq | 0; }

// --- the sampler ----------------------------------------------------------------

let asked = 0;

// Asked twice a second, not sixty times.
export function stepNotices(t) {
  if (t - asked < NOTICE_TICK_S * 1000) return;
  asked = t;
  for (const n of NOTICES) {
    if (!n.when || S.won.includes(n.key)) continue;
    if (n.when()) earn(n.key);
  }
}

// A yard that has been re-made, or a suite starting a fresh game.
export function resetNotices() { asked = 0; hushNotices(); }

// --- the witnesses ---------------------------------------------------------------
// Three flags and a stamp about the rock, cleared when a rock lands; one about
// the last hand thrown, cleared by the next.

// `who` is 'you', 'crew' or 'machine'; `knockOff` in rock.js is the one place
// a bite happens.
export function noteBite(who) {
  const t = S.tally;
  if (who === 'crew') { if (!t.rockCrew) { t.rockCrew = true; } }
  else if (who === 'machine') { if (!t.rockMachine) { t.rockMachine = true; } }
  else if (!t.rockYou) { t.rockYou = true; }
}

// A rock has come off: the rock's witnesses are spent here and cleared.
export function noteRockCleared() {
  const t = S.tally;

  if (S.crew === 0) earn('nobodyhired');
  // A machine is not a worker, but it is not your hand either.
  if (t.rockYou && !t.rockCrew && !t.rockMachine) earn('ownhand');
  if (!t.rockYou && (t.rockCrew || t.rockMachine)) earn('nevertouched');
  if (t.rockAt && now() - t.rockAt < NOTICE_FAST_ROCK_S * 1000) earn('underminute');

  // The hand's witness is kept: a full hand caught across the moment a rock
  // comes off is still a full hand caught.
  S.tally = { rockAt: now(), throwNo: t.throwNo | 0, throwOf: t.throwOf | 0, caught: t.caught | 0 };
}

// A hand has settled at the table; big either way is worth a notice.
export function noteHand(won, n, big) {
  if (n < big) return;
  earn(won ? 'tablebeaten' : 'tableruin');
}

// Every grain of a full hand is stamped with this throw's number so a catch
// can tell which throw it came out of: the notice is about catching all of
// one throw. A smaller throw is not the feat and leaves nothing to count.
export function noteThrow(chips, full) {
  const t = S.tally;
  t.throwNo = (t.throwNo | 0) + 1;
  if (!full) { t.throwOf = 0; t.caught = 0; return; }
  for (const ch of chips) ch.thrown = t.throwNo;
  t.throwOf = chips.length;
  t.caught = 0;
}

// Only the current throw's grains count; one from an earlier hand or off a
// bird carries no stamp.
export function noteCatch(ch) {
  const t = S.tally;
  if (!t.throwOf || ch.thrown !== t.throwNo) return;
  t.caught = (t.caught | 0) + 1;
  if (t.caught >= t.throwOf) { t.throwOf = 0; earn('catchall'); }
}
