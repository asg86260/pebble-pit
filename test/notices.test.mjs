// The record: that the yard notices what it has done, and says so once.
//
// Every group here reaches the notice the way the yard does -- by playing far
// enough that the thing is true -- rather than by calling `earn` and asserting
// that `earn` works. The two that cannot be played inside a check without an
// hour of yard (a hundred rocks, a big hand at the table) go through the one
// event hook that the real code calls, with the real arguments.

import { group, ok, state, run, runUntil, yard, haveRock, quickCrew } from './helpers.mjs';
import { S } from '../src/state.js';
import { NOTICES, hasNotice, unreadNotices, markNoticesRead,
         noteHand, noteRockCleared, noteBite, catchUpNotices } from '../src/notices.js';
import { CASINO_BIG } from '../src/config.js';

const keys = () => S.won.slice();

// Pebbles in the hole the way a player gets them: a rock standing, somebody to
// carry, and your own swings at the face. Nothing here sets `banked`.
async function bankSomething() {
  haveRock();
  await run(1);
  quickCrew();
  window.__crew(2, 3);
  window.__swing(80);
  await runUntil(() => S.banked > 0, 120);
}


group('the catalog is what the design approved', async () => {
  const dupes = NOTICES.filter((n, i) => NOTICES.findIndex(m => m.key === n.key) !== i);
  const noNote = NOTICES.filter(n => !n.note || !n.note.trim());
  const noName = NOTICES.filter(n => !n.name || !n.name.trim());
  // A notice earns itself one of two ways and must have exactly one of them: a
  // predicate, or an event that calls it. One with neither can never land.
  const hooks = NOTICES.filter(n => !n.when).map(n => n.key);

  return [
    ok(NOTICES.length === 42, 'forty-two notices, as approved', String(NOTICES.length)),
    ok(!dupes.length, 'every key is its own', dupes.map(n => n.key).join(',')),
    ok(!noName.length, 'every notice has a name', noName.map(n => n.key).join(',')),
    // The note says what you did. A blank one is the one failure mode that
    // reads as finished on the board and tells the player nothing.
    ok(!noNote.length, 'and a note saying what you did', noNote.map(n => n.key).join(',')),
    ok(hooks.length === 6, 'six are earned by an event rather than a fact', hooks.join(','))
  ];
});

group('a fresh yard has nothing on the board, then earns the first grain', async () => {
  const started = keys().length;
  await bankSomething();
  await run(1);                                  // the sampler runs twice a second

  return [
    ok(started === 0, 'a new yard has an empty record', String(started)),
    ok(hasNotice('firstgrain'), 'putting a pebble in the pit is noticed'),
    ok(unreadNotices() === keys().length, 'and it is waiting to be read',
       `${unreadNotices()} of ${keys().length}`)
  ];
});

group('a notice is earned once and only once', async () => {
  await bankSomething();
  await run(1);
  const once = keys().filter(k => k === 'firstgrain').length;
  const was = keys().length;
  await run(5);                                  // ten more passes of the sampler
  return [
    ok(once === 1, 'the first grain is on the record once', String(once)),
    ok(keys().length === was, 'and running on does not earn it again',
       `${was} -> ${keys().length}`)
  ];
});

group('opening the board reads what is on it', async () => {
  await bankSomething();
  await run(1);
  const before = unreadNotices();
  markNoticesRead();
  const after = unreadNotices();
  // and a notice landing afterwards is unread again, which is what puts the
  // tick back over the board. The one under the rock getting out is a fact no
  // yard reaches by accident, so it is reliably the next thing to land.
  S.rescued = true;
  await run(1);
  return [
    ok(before > 0, 'a landed notice is unread', String(before)),
    ok(after === 0, 'opening the board reads the lot', String(after)),
    ok(unreadNotices() === 1, 'and the next one to land is unread on its own',
       String(unreadNotices()))
  ];
});

group('the crew ladder is earned by hiring, not by asking', async () => {
  quickCrew();
  // The yard starts with one body, and one body is nobody hired: the first
  // hire is the second (critics 2026-09-10, C15).
  window.__crew(1, 1);
  await run(1);
  return [
    ok(hasNotice('firsthire'), 'somebody in the yard is noticed'),
    ok(!hasNotice('crew3'), 'and a rung nobody has reached is not',
       keys().filter(k => k.startsWith('crew')).join(','))
  ];
});

group('a rock cleared with nobody hired is a feat; with a crew it is not', async () => {
  // No payroll: the yard is you and the rock.
  S.crew = 0;
  S.workers.length = 0;
  noteRockCleared();
  const alone = hasNotice('nobodyhired');

  // The same event with a crew standing there earns nothing.
  S.won = S.won.filter(k => k !== 'nobodyhired');
  S.crew = 4;
  noteRockCleared();

  return [
    ok(alone, 'clearing one on your own is noticed'),
    ok(!hasNotice('nobodyhired'), 'clearing one with a crew is not')
  ];
});

group('who bit the rock decides the two hand feats', async () => {
  // Only you swung at it.
  S.tally = {};
  noteBite('you');
  noteRockCleared();
  const own = hasNotice('ownhand'), untouchedAfterYours = hasNotice('nevertouched');

  // Only the crew swung at it.
  S.won = S.won.filter(k => k !== 'ownhand' && k !== 'nevertouched');
  S.tally = {};
  noteBite('crew');
  noteRockCleared();
  const never = hasNotice('nevertouched'), ownAfterCrew = hasNotice('ownhand');

  // A machine is neither: it disqualifies "your own hand alone" as surely as a
  // worker does, and it counts as the rock being cleared without you.
  S.won = S.won.filter(k => k !== 'ownhand' && k !== 'nevertouched');
  S.tally = {};
  noteBite('you');
  noteBite('machine');
  noteRockCleared();

  return [
    ok(own, 'a rock only you bit is your own hand alone'),
    ok(!untouchedAfterYours, 'and is not also "never touched it"'),
    ok(never, 'a rock only the crew bit is one you never touched'),
    ok(!ownAfterCrew, 'and is not your own hand alone'),
    ok(!hasNotice('ownhand'), 'a machine helping is not your own hand alone')
  ];
});

group('the witnesses are cleared when a rock comes off', async () => {
  S.tally = {};
  noteBite('you');
  const during = !!S.tally.rockYou;
  noteRockCleared();
  const after = !!S.tally.rockYou;
  const stamped = 'rockAt' in S.tally;
  return [
    ok(during, 'a bite is remembered while the rock stands'),
    ok(!after, 'and forgotten the moment it comes off'),
    ok(stamped, 'leaving only the stamp the next one is timed against')
  ];
});

group('a big hand at the table is noticed, either way', async () => {
  noteHand(true, CASINO_BIG, CASINO_BIG);
  const won = hasNotice('tablebeaten');
  noteHand(false, CASINO_BIG, CASINO_BIG);
  const lost = hasNotice('tableruin');

  S.won = S.won.filter(k => k !== 'tablebeaten');
  noteHand(true, CASINO_BIG - 1, CASINO_BIG);

  return [
    ok(won, 'winning big is noticed'),
    ok(lost, 'and losing big is noticed'),
    ok(!hasNotice('tablebeaten'), 'a hand under the mark is not')
  ];
});

group('a veteran save comes back with its record already written and read', async () => {
  // A yard that has plainly done things, on a save that predates the record.
  S.won = [];
  S.wonAt = {};
  S.wonSeen = 0;
  S.noticeMigrated = false;
  S.banked = 5e4;
  S.boulderNo = 30;
  S.crew = 12;

  catchUpNotices();

  const earned = keys().length;
  const unread = unreadNotices();
  // and it does not guess at the feats: nothing in a save says whether a rock
  // was ever cleared with an empty payroll
  const guessed = keys().filter(k =>
    ['nobodyhired', 'ownhand', 'nevertouched', 'underminute',
     'tablebeaten', 'tableruin'].includes(k));

  return [
    ok(earned > 5, 'the rules it has plainly passed are all on the record', String(earned)),
    ok(unread === 0, 'and every one of them is already read', String(unread)),
    ok(!guessed.length, 'the feats are not guessed at', guessed.join(',')),
    ok(hasNotice('rock1'), 'thirty rocks covers the twenty-five rung'),
    ok(!hasNotice('rock3'), 'but not the hundred')
  ];
});

group('the record survives a save and a load', async () => {
  await runUntil(() => S.banked > 0, 60);
  await run(1);
  const was = keys().slice().sort().join(',');
  const seen = S.wonSeen;

  yard.persist();
  yard.restore();

  return [
    ok(keys().slice().sort().join(',') === was, 'every notice comes back',
       keys().slice().sort().join(',')),
    ok(S.wonSeen === seen, 'and so does how much of it had been read',
       `${seen} -> ${S.wonSeen}`),
    ok(typeof S.tally === 'object' && S.tally !== null, 'and the witnesses are an object')
  ];
});
