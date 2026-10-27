// Act 3's boards (docs/wave-act3-build.md, track C): what each board lists, in
// what order and on which shelf, read off the boards as the yard's board
// builder reads them (boardrows.js), and the crowd's board's readings against
// the sim. Every row is bought through the yard's own `buy`, the press a
// tile makes (shop.js `pressRow`), which hands an act-3 row to the one `buy`.
// The pointer, the sheet and the drawn tiles are the browser tier's
// (src/selftest/afterboards.js). The setup a check is not about goes through
// the hooks: the dev travel up with the opening marked played, coins granted.
import { group, ok, run, runUntil, yard } from './helpers.mjs';
import { AFTER_BUILDS, AFTER_CARDS, MEET_MEMBERS, SLOW_SHARE, AFTER_SEAT_BILLS } from '../src/config.js';
import { boardOf } from '../src/boardrows.js';
import { afterRow, openAfterBoard, speechIn } from '../src/after/rows.js';
import { buy } from '../src/upgrades.js';
import { msg } from '../src/lang.js';
import { openBoard, showPanel } from '../src/board.js';

const S = yard.S;
const OPENING = ['house-fall', 'arrive', 'meet-god', 'refuse'];
const up = () => {
  window.__actsOn(true);
  window.__goPlace('after');
  for (const k of OPENING) if (!S.beatsDone.includes(k)) S.beatsDone.push(k);
  window.__grant({ dust: 5e6, spores: 1e6, shards: 1e6, scales: 1e5, sparks: 1e5 });
  run(1);
};
// A board's shelves as the builder sees them: each heading and its keys.
const shelves = key => boardOf(`after-${key}`).sections().map(s => [s.title, s.keys]);
const reading = key => boardOf('after-crowd').rows().find(u => u.key === key).price();

group('each board lists its rows on its shelves: seats, then upgrades; the shack one shelf in camp order', async () => {
  up();
  // An unbuilt station stands closed and its board is its rebuild; built,
  // it is the spec's shelves.
  const unbuilt = Object.keys(AFTER_BUILDS);
  const closedOff = unbuilt.filter(k => JSON.stringify(shelves(k)) !== JSON.stringify([[msg('after-sect-rebuild'), [`after-build-${k}`]]]));
  for (const k of unbuilt) S.after.built.push(k);
  const all = Object.fromEntries([...AFTER_CARDS, 'crowd'].map(k => [k, shelves(k)]));
  const seats = msg('after-sect-seats'), ups = msg('after-sect-card');
  const want = {
    shack: [[msg('after-sect-build'), ['mill', 'workshop'].map(s => `after-build-${s}`)]],
    pedestal: [[ups, ['after-recruit', 'after-podium']]],
    grove: [[seats, ['after-seat-woodcutter']], [ups, ['after-axe', 'after-plot', 'after-grow', 'after-tree', 'after-stumps']]],
    mill: [[seats, ['after-seat-sawyer']], [ups, ['after-blade', 'after-heap']]],
    workshop: [[seats, ['after-seat-joiner']], [ups, ['after-bench', 'after-signreach']]]
  };
  const off = Object.entries(want).filter(([k, v]) => JSON.stringify(all[k]) !== JSON.stringify(v)).map(([k]) => k);
  const crowdBuys = boardOf('after-crowd').rows().filter(u => !u.read);
  window.__actsOn(null);
  return [
    ok(closedOff.length === 0, 'a closed station offers its rebuild on its board', closedOff.join(' ')),
    ok(off.length === 0, 'every station\'s board is the spec\'s rows, in its order, on its shelves', off.map(k => `${k}: ${JSON.stringify(all[k])}`).join(' | ')),
    ok(boardOf('after-crowd').ledger && crowdBuys.length === 0, 'the crowd\'s board is readings, nothing to buy', crowdBuys.map(u => u.key).join(' ')),
    ok(Object.keys(AFTER_BUILDS).join() === 'mill,workshop', 'the stations are listed in camp order', Object.keys(AFTER_BUILDS).join())
  ];
});

group('the shack locks a station behind the one it needs, saying which, and a built one stays listed, done', async () => {
  up();
  const say = k => afterRow(`after-build-${k}`).waits();
  const locked0 = { workshop: say('workshop') };
  window.__afterGrant({ rebel: 1000 });
  const deadFirst = !buy(afterRow('after-build-workshop'));
  const bought = buy(afterRow('after-build-mill'));
  const mill = afterRow('after-build-mill');
  const raisingLock = say('workshop');
  runUntil(() => S.after.built.includes('mill'), 480);   // the builders' walks at the art's scale: about 361 s
  const open = say('workshop');
  window.__actsOn(null);
  return [
    ok(locked0.workshop === msg('after-wait-mill'), 'a locked station says what it waits on', JSON.stringify(locked0)),
    ok(deadFirst, 'the workshop is refused before the saw mill stands'),
    ok(bought, 'the saw mill is bought through the yard\'s press, its own act\'s purse paying'),
    ok(mill.rung() === mill.rungs() && mill.keep && boardOf('after-shack').rows().includes(mill), 'and stays on the shack\'s board, done, kept past the finished-rows switch'),
    ok(raisingLock === msg('after-wait-mill'), 'while the saw mill is still going up, the workshop waits on it', String(raisingLock)),
    ok(S.after.built.includes('mill') && open === null, 'and once it stands the workshop\'s lock comes off', String(open))
  ];
});

group('a job\'s seats climb a written table, each no cheaper than the last, and end', async () => {
  up();
  S.after.built.push('mill');
  const row = afterRow('after-seat-sawyer');
  window.__afterGrant({ rebel: 1e5, timber: 1e4 });
  const bills = [];
  for (let k = 0; k < AFTER_SEAT_BILLS.length + 2; k++) { bills.push(row.bill()[0][1]); if (!buy(row)) break; }
  const seats = window.__afterRoster().find(r => r.job === 'sawyer')?.cap;
  window.__actsOn(null);
  return [
    ok(row.rung() === AFTER_SEAT_BILLS.length && seats === AFTER_SEAT_BILLS.length + 1,
       'every seat on the table bought, the roster holding one more each', `${row.rung()} rungs, ${seats} seats`),
    ok(bills.length === AFTER_SEAT_BILLS.length + 1, 'and the press past the last refused', String(bills.length)),
    ok(bills.every((b, i) => i === 0 || b >= bills[i - 1]), 'each seat\'s rebel no cheaper than the last', bills.join(' '))
  ];
});

group('the crowd\'s board reads the sim: share, members, each gate and how near, the next speech', async () => {
  up();
  const before = { meeting: reading('after-crowd-meeting'), union: window.__afterRead().union };
  window.__afterCrowd(0.45);
  run(0.5);
  runUntil(() => window.__afterRead().gate >= 2, 30);
  const r = window.__afterRead();
  const now = {
    share: reading('after-crowd-share'), members: reading('after-crowd-members'), meeting: reading('after-crowd-meeting'),
    slowdown: reading('after-crowd-slowdown'), strike: reading('after-crowd-strike'), speech: reading('after-crowd-speech')
  };
  const s = speechIn();
  window.__actsOn(null);
  const pct = v => msg('after-crowd-pct', { n: Math.floor(v * 100) });
  return [
    ok(before.meeting === msg('after-crowd-of', { have: String(before.union), want: String(MEET_MEMBERS) }),
      'before the meeting, its reading is the members of the members it wants', `${before.meeting} (${before.union})`),
    ok(now.share === pct(r.support), 'the share won is the sim\'s support', `${now.share} vs ${r.support}`),
    ok(now.members === String(r.union), 'members is the souls walked out', `${now.members} vs ${r.union}`),
    ok(r.gate >= 2 && now.meeting === msg('after-crowd-reached') && now.slowdown === msg('after-crowd-reached'),
      'past the meeting and the slowdown, both read reached', `${r.gate}: ${now.meeting}, ${now.slowdown}`),
    ok(now.strike === msg('after-crowd-of', { have: pct(r.support), want: pct(0.8) }), 'the strike reads how near, of its share', now.strike),
    ok(s != null && s > 0 && /\d:\d\d/.test(now.speech), 'the next speech is a time left, off the speech\'s clock', `${now.speech} (${s})`),
    ok(r.support >= SLOW_SHARE, 'the setup reached the slowdown', String(r.support))
  ];
});

group('opening a board puts that board up, and a key that is no board opens nothing', async () => {
  up();
  const before = JSON.stringify(window.__afterRead());
  const mill = openAfterBoard('mill'), atMill = openBoard();
  const crowd = openAfterBoard('crowd', { x: 0, y: 0 }), atCrowd = openBoard();
  const none = openAfterBoard('nowhere');
  const after = JSON.stringify(window.__afterRead());
  showPanel(null, true);
  window.__actsOn(null);
  return [
    ok(mill && atMill === 'after-mill', 'the saw mill\'s board is up', `${mill} ${atMill}`),
    ok(crowd && atCrowd === 'after-crowd', 'then the crowd\'s, in its place', `${crowd} ${atCrowd}`),
    ok(none === false, 'a key that is no board answers false'),
    ok(before === after, 'and opening boards changes nothing in the yard')
  ];
});
