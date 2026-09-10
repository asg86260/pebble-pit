// The record: what the yard has done, and what it says about it.
//
// The yard has counted its own rocks, pebbles and bodies since the first frame
// and never said any of it back. This is the forty-two things it now says. See
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
//                     Thirty of the forty-two. Nothing is remembered for these
//                     because the yard already remembers it.
//   an event hook     no `when`. Something that happens calls `earn(key)` where
//                     it happens -- a hand settling, a rock coming off. The
//                     notice list is itself the record, so there is nothing
//                     further to keep.
//   a witness         a per-rock flag or a stamp in `S.tally`, because the
//                     question is about a stretch of time rather than a moment.
//                     Three of them, all about the same event, all cleared when
//                     a rock lands.
//
// The rule that keeps this file from growing a counter per notice: a witness is
// a KEY in the one `S.tally` object, bumped at the one place the event happens.
// It is never a new field on `S`, and there is never a second place that knows
// about notices.

import {
  NOTICE_TICK_S, NOTICE_ROCKS, NOTICE_PEBBLES, NOTICE_CREW, NOTICE_ORE,
  NOTICE_RIFT, NOTICE_BREWS, NOTICE_LIVED_MS, NOTICE_FAST_ROCK_S
} from './config.js';
import { S } from './state.js';
import { now } from './clock.js';
import { JOB } from './jobs.js';

// --- the catalog ---------------------------------------------------------------
// Name, note, and how it is earned. The note says WHAT YOU DID -- the plain
// requirement, in the words the yard would use -- and never a remark about it.
// See DESIGN.md: a record that comments on itself is a record you read twice.

// The ladders are built from their tables rather than written out, so the count
// on the board and the thresholds in config.js cannot drift apart.
const ladder = (prefix, list, name, note, fact) =>
  list.map((n, i) => ({
    key: prefix + i,
    name: name(n, i),
    note: note(n, i),
    when: () => fact() >= n
  }));

const SAY = ['ten', 'twenty-five', 'fifty', 'a hundred'];
const PEBBLE_SAY = ['ten thousand', 'a hundred thousand', 'a million',
                    'ten million', 'a hundred million'];
const CREW_SAY = ['five', 'ten', 'twenty five', 'fifty'];

// every trade taught to everybody doing that job, with somebody in each
const allTrades = () =>
  S.rockhands > 0 && S.breakers >= S.rockhands &&
  S.haulers > 0 && S.carters >= S.haulers &&
  S.quarriers > 0 && S.blasters >= S.quarriers &&
  S.farmhands > 0 && S.growers >= S.farmhands;

// every building the yard can put up, standing
const allBuilt = () =>
  S.quarryOpen && S.farmOpen && S.apothecaryOpen && S.casinoOpen &&
  S.shackOpen && S.outhouseOpen && S.buildbenchOpen && S.towerOpen &&
  S.schoolOpen && S.scrubOpen;

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

export const NOTICES = [
  // --- what happens on its own -------------------------------------------------
  { key: 'firstgrain', name: 'makin money',
    note: 'throw a pebble into the pit', when: () => S.banked > 0 },
  { key: 'firstrock', name: 'better keep digging',
    note: 'clear the first rock', when: () => S.boulderNo >= 2 },
  { key: 'gotout', name: 'you saved your sqwife',
    note: 'no more rocks, you did it.', when: () => S.rescued },
  { key: 'firstcore', name: 'something was inside it',
    note: 'bank a core out of a broken rock', when: () => S.seenCore },
  { key: 'firsthire', name: "you've constructed additional pylons",
    note: 'build another house', when: () => S.crew >= 1 },
  { key: 'firstshard', name: 'the first ore',
    note: 'bring ore up out of the quarry', when: () => S.seenShard },
  { key: 'firstspore', name: 'cultivation',
    note: 'grow your first crop', when: () => S.seenSpore },
  { key: 'firstspark', name: 'magic in the air',
    note: 'earn your first spark', when: () => S.seenSpark },
  { key: 'holefull', name: 'the pit is full',
    note: 'fill up the pit', when: () => S.seenFullPit },
  { key: 'rifttorn', name: 'the rift torn, storage is solved',
    note: 'fill the pit causing an inter-dimensional rift', when: () => S.riftOpen },
  { key: 'drowned', name: 'the rift has gotten bigger',
    note: 'a whole ocean of inter-dimensional storage.', when: () => S.drowned },
  { key: 'star', name: 'conjure a star',
    note: 'call a star down from the tower', when: () => S.meteorOpen },
  { key: 'firsthat', name: "you're a wizard squarey",
    note: 'finish a wizard hat at the tower', when: () => S.wizardHats >= 1 },
  { key: 'firstbrew', name: 'hello, potion seller',
    note: 'brew a batch at the apothecary', when: () => S.brews >= 1 },
  { key: 'firsttrade', name: 'first day of school',
    note: 'send somebody to the school and teach them a trade',
    when: () => S.breakers + S.carters + S.blasters + S.growers >= 1 },
  { key: 'alltrades', name: 'educating the masses',
    note: 'teach every trade there is to teach', when: allTrades },
  { key: 'allbuilt', name: 'building complete',
    note: 'you built everything', when: allBuilt },

  // --- numbers, for the long tail ----------------------------------------------
  ...ladder('rock', NOTICE_ROCKS,
            (n, i) => `${SAY[i]} rocks`,
            (n, i) => `clear ${SAY[i]} boulders` +
                      (i === SAY.length - 1 ? ', thats a lot of rocks' : ''),
            () => S.boulderNo),
  ...ladder('pebble', NOTICE_PEBBLES,
            (n, i) => `${PEBBLE_SAY[i]} pebbles`,
            (n, i) => `bank ${PEBBLE_SAY[i]} pebbles`,
            () => S.banked),
  ...ladder('crew', NOTICE_CREW,
            (n, i) => `${CREW_SAY[i]} squares`,
            (n, i) => `hire a crew of ${CREW_SAY[i]}`,
            () => S.crew),
  ...ladder('ore', NOTICE_ORE,
            (n, i) => i === 0 ? 'a thousand ore out of the cut' : 'ten thousand ore',
            (n, i) => `dig ${i === 0 ? 'a thousand' : 'ten thousand'} ore out of the quarry`,
            () => S.quarryTotal),
  { key: 'rift1e6', name: 'a million through the rift',
    note: 'send a million pebbles through the rift',
    when: () => (S.riftAte || 0) >= NOTICE_RIFT },
  { key: 'brew100', name: 'a hundred batches',
    note: 'brew a hundred batches', when: () => (S.brews || 0) >= NOTICE_BREWS },
  { key: 'lived1h', name: 'an hour on one clock',
    note: 'keep one body on the payroll for an hour',
    when: () => eldest() >= NOTICE_LIVED_MS },

  // --- feats you would have to set out for --------------------------------------
  // The first four and the last two carry no `when`: they are moments, and the
  // moment calls `earn` where it happens. `every job staffed` is the one feat
  // that is simply true or not true at any instant, so it is a predicate.
  { key: 'nobodyhired', name: 'nobody hired',
    note: 'clear a whole boulder with nobody on the payroll' },
  { key: 'ownhand', name: 'your own hand alone',
    note: 'clear a boulder without a single worker touching it' },
  { key: 'nevertouched', name: 'never touched it',
    note: 'clear a boulder without swinging at it once yourself' },
  { key: 'underminute', name: 'a rock off in under a minute',
    note: 'clear a boulder in under a minute' },
  { key: 'everyjob', name: 'every job staffed at once',
    note: 'put at least one body on every job at once', when: everyJobStaffed },
  { key: 'tablebeaten', name: "we're so back",
    note: 'win 50k in a single spin at the casino' },
  { key: 'tableruin', name: 'time to get a loan',
    note: 'lose a 50k stake in a single spin at the casino' }
];

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
  S.wonAt = { ...S.wonAt, [key]: now() };
  if (quiet) S.wonSeen = S.won.length;
  S.dirty = true;
  return true;
}

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
export function resetNotices() { asked = 0; }

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

  S.tally = { rockAt: now() };
  S.dirty = true;
}

// A hand has settled at the table. Big either way is worth a notice; the size is
// read where the hand settles, so nothing is carried between hands.
export function noteHand(won, n, big) {
  if (n < big) return;
  earn(won ? 'tablebeaten' : 'tableruin');
}
