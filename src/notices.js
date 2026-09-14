// The record: what the yard has done, and what it says about it.
//
// The yard has counted its own rocks, pebbles and bodies since the first frame
// and never said any of it back. This is the forty-nine things it now says. See
// DESIGN.md, "The noticeboard, and the record on it", which is the approved
// catalog and where every one of these names was argued over.
//
// **Recognition, and nothing else.** No notice pays out, unlocks a row or makes
// anything faster. It is the same bargain records.js strikes with the crew's own
// histories: no number here feeds a rate. That is the one rule this file must
// never break -- a record that pays is a quest log.
//
// A notice is earned one of three ways, and which one is a fact about the thing
// being recognized rather than a style:
//
//   a standing fact   `when` is a predicate over S, asked twice a second.
//                     Thirty-one of the forty-nine. Nothing is remembered for these
//                     because the yard already remembers it.
//   an event hook     no `when`. Something that happens calls `earn(key)` where
//                     it happens -- a hand settling, a rock coming off. The
//                     notice list is itself the record, so there is nothing
//                     further to keep.
//   a witness         a per-rock flag or a stamp in `S.tally`, because the
//                     question is about a stretch of time rather than a moment.
//                     Three of them about the rock, cleared when a rock lands,
//                     and one about the last hand thrown, cleared by the next.
//
// The rule that keeps this file from growing a counter per notice: a witness is
// a KEY in the one `S.tally` object, bumped at the one place the event happens.
// It is never a new field on `S`, and there is never a second place that knows
// about notices.

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
// The names and notes are catalog.js's -- data a page with no yard can read
// (the landing page's record). What is here is how each is earned: a
// predicate by key, joined to the catalog below. The four feats, the two
// casino notices and six of the seven things done by hand carry no `when`:
// they are moments, and the moment calls `earn` where it happens. `every job
// staffed` is the one feat that is simply true or not true at any instant, so
// it is a predicate, and so is a rain: the yard counts its rains already.

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

// A body on every post there is, read off the JOB word list rather than off a
// list written out here -- so a job added tomorrow is counted without this
// being touched.
//
// It is `jobs.js` (the words) and NOT `crew/jobs.js` (the registry), and that
// is not a preference. The registry reaches rockhand.js, which reaches
// rock.js, which now reaches this file: a ring. Under that ring the quarry
// came back from a reload with nobody at the face -- a failure a long way
// from anything to do with notices, and one that would have been a puzzle to
// anybody who found it later. The words module imports nothing at all, so it
// can be read from anywhere.
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
  // tear, so 'full' and 'torn' landed on the same frame with two notes for one
  // act (critics 2026-09-10, C15). This one lands as the hole is about to.
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

// Notices earned but not yet looked at. This is what puts the bobbing tick over
// the board, and it is a subtraction rather than a second list: the list of what
// you have is already saved, and a count of how much of it you have read is one
// number that cannot fall out of step with it.
export const unreadNotices = () => Math.max(0, S.won.length - S.wonSeen);

// The board has been opened: everything on it now counts as read.
export function markNoticesRead() {
  if (S.wonSeen === S.won.length) return;
  S.wonSeen = S.won.length;
  S.dirty = true;
}

// Earn one. `quiet` is the veteran save's pass -- see `catchUpNotices` -- and is
// the difference between a record being written and a record being announced.
export function earn(key, quiet = false) {
  if (!BY_KEY.has(key) || S.won.includes(key)) return false;
  // A fresh array rather than a push: `won` is a saved field, and the save
  // notices a new array where it can miss a mutation in place -- the same
  // reasoning as `seenRows` in shop.js.
  S.won = [...S.won, key];
  // In order, not on the clock: `now()` starts again with every page, so a
  // notice earned ten minutes into the second sitting sorted under one earned
  // two hours into the first (critics 2026-09-10, C14). A count only goes up.
  S.wonSeq = (S.wonSeq || 0) + 1;
  S.wonAt = { ...S.wonAt, [key]: S.wonSeq };
  if (quiet) { S.wonSeen = S.won.length; hushNotices(); }
  S.dirty = true;
  return true;
}

// Nothing earned so far is announced. The toast (toast.js) says every notice
// whose place in the order is past `wonShown`, so moving that up to the end of
// the record is how a save coming back, a yard starting over and the veteran
// catch-up all stay quiet: what was earned before this sitting is on the
// sheet, not in the air. Every one of those calls this rather than writing
// the field, so there is one line that knows what silence is.
export function hushNotices() { S.wonShown = S.wonSeq | 0; }

// --- the sampler ----------------------------------------------------------------

let asked = 0;

// Asked twice a second, not sixty times. Only rules with a `when` are asked, and
// only ones not already earned -- so a yard with everything on the board does no
// work at all here.
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

// The first load of a save written before any of this existed. Forty rocks in,
// thirty rules are true at once, and thirty ticks is a feature introducing
// itself by shouting. So they are all earned SILENTLY and marked already read:
// you open the board and find your record already written, which is what it
// should say -- these are things you did, and the board is late, not you.
//
// The event-hook notices are deliberately NOT caught up. Nothing in the save
// says whether a rock was ever cleared with an empty payroll, and a record that
// guesses is worse than a record that starts from here.
export function catchUpNotices() {
  if (S.noticeMigrated) return;
  S.noticeMigrated = true;
  for (const n of NOTICES) if (n.when && n.when()) earn(n.key, true);
  S.wonSeen = S.won.length;
}

// --- the witnesses ---------------------------------------------------------------
// Three flags and a stamp, all about one event, all cleared when a rock lands.
// This is the whole of what this feature remembers that the yard did not already
// know, and it is one object.

// Somebody took a bite out of the rock. `who` is 'you', 'crew' or 'machine' --
// see `knockOff` in rock.js, which is the one place a bite happens.
export function noteBite(who) {
  const t = S.tally;
  if (who === 'crew') { if (!t.rockCrew) { t.rockCrew = true; S.dirty = true; } }
  else if (who === 'machine') { if (!t.rockMachine) { t.rockMachine = true; S.dirty = true; } }
  else if (!t.rockYou) { t.rockYou = true; S.dirty = true; }
}

// A rock has come off, and this is the only place that asks what the last one
// was like. Everything the witnesses were keeping is spent here and cleared.
export function noteRockCleared() {
  const t = S.tally;

  if (S.crew === 0) earn('nobodyhired');
  // "your own hand alone" -- nothing but you touched it. A machine is not a
  // worker, but it is not your hand either, so it disqualifies too.
  if (t.rockYou && !t.rockCrew && !t.rockMachine) earn('ownhand');
  // ...and the other way round: you never swung at it once.
  if (!t.rockYou && (t.rockCrew || t.rockMachine)) earn('nevertouched');
  if (t.rockAt && now() - t.rockAt < NOTICE_FAST_ROCK_S * 1000) earn('underminute');

  // The hand's witness is the one thing not spent here: a throw is not about
  // the rock, and a full hand caught across the moment a rock comes off is
  // still a full hand caught.
  S.tally = { rockAt: now(), throwNo: t.throwNo | 0, throwOf: t.throwOf | 0, caught: t.caught | 0 };
  S.dirty = true;
}

// A hand has settled at the table. Big either way is worth a notice; the size is
// read where the hand settles, so nothing is carried between hands.
export function noteHand(won, n, big) {
  if (n < big) return;
  earn(won ? 'tablebeaten' : 'tableruin');
}

// A full hand has been thrown. Every grain of it is stamped with this throw's
// number so a catch can tell which throw it came out of: the notice is about
// catching *all of one throw*, and a cursor that caught the tail of one and
// the head of the next has done something else. Only a full hand is stamped;
// a smaller throw is not the feat and leaves nothing to count.
export function noteThrow(chips, full) {
  const t = S.tally;
  t.throwNo = (t.throwNo | 0) + 1;
  if (!full) { t.throwOf = 0; t.caught = 0; return; }
  for (const ch of chips) ch.thrown = t.throwNo;
  t.throwOf = chips.length;
  t.caught = 0;
  S.dirty = true;
}

// A grain has been caught out of the air. Only the current throw's grains
// count; one that has been lying about since an earlier hand, or that came off
// a bird, carries no stamp and is just dust in the hand.
export function noteCatch(ch) {
  const t = S.tally;
  if (!t.throwOf || ch.thrown !== t.throwNo) return;
  t.caught = (t.caught | 0) + 1;
  if (t.caught >= t.throwOf) { t.throwOf = 0; earn('catchall'); }
}
