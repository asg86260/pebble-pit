// A row's gain line names what it is a gain *of*.
//
// "boots +45%" is a noun and a number: forty-five per cent of what? Most rows
// are called after the thing you buy -- boots, a harness, a stew -- rather than
// the thing it changes, so the board leads the gain with the verb: "walk +45%",
// "carry 1 -> 3", "crit 4 -> 8%". See `gainText` in upgrades.js.
//
// Two facts, both read the way a player meets them. The rule is held over every
// row on every board: a proportional row must say what it is a share of, since
// "+30%" alone is a share of nothing. And the bench's own rows are read off
// `__rows`, which prints what the board prints.

import { group, ok, openSites } from './helpers.mjs';
import { S } from '../src/state.js';
import { UPGRADES } from '../src/upgrades.js';
import { TOWER_UPGRADES } from '../src/tower.js';
import { SCHOOL_UPGRADES } from '../src/school.js';
import { SCRUB_UPGRADES } from '../src/scrubhouse.js';
import { QUARRY_UPGRADES } from '../src/quarry.js';
import { FARM_UPGRADES } from '../src/farm.js';
import { CASINO_UPGRADES } from '../src/casino.js';
import { APOTHECARY_UPGRADES } from '../src/apothecary.js';

const EVERY = [...UPGRADES, ...TOWER_UPGRADES, ...SCHOOL_UPGRADES, ...SCRUB_UPGRADES,
               ...QUARRY_UPGRADES, ...FARM_UPGRADES, ...CASINO_UPGRADES, ...APOTHECARY_UPGRADES];

group('every share on every board says what it is a share of', async () => {
  const shares = EVERY.filter(u => u.pct);
  const mute = shares.filter(u => !u.does).map(u => u.key);
  const wordy = EVERY.filter(u => u.does && u.does.split(' ').length > 2).map(u => u.key);
  return [
    ok(shares.length > 0, 'there are proportional rows to hold to it', `${shares.length}`),
    ok(mute.length === 0, 'and none of them is a bare percentage', mute.join(',') || 'none'),
    ok(wordy.length === 0, 'and a verb is a word or two, not a sentence', wordy.join(',') || 'none')
  ];
});

group("the haulers' rows say what they are about", async () => {
  window.__reset();
  openSites();
  window.__crew(1, 0);
  S.seenShard = true;
  window.__levels({ haulPaceLevel: 5 });      // boots wait on pace -- see ladder-chain
  const row = key => window.__rows().find(r => r.key === key);
  const pace = row('haulpace'), boots = row('boots'), load = row('haulcarry');
  window.__crew(0, 0);
  return [
    ok(boots && boots.gain.startsWith('walk '), 'boots: walk +…', boots?.gain),
    ok(load && load.gain.startsWith('carry '), 'load: carry 1 → 2', load?.gain),
    // A finished ladder says nothing in the gain column, verb included: "walk"
    // over "done" would be a promise with nothing after it.
    ok(pace && pace.gain === '', 'a finished pace ladder has no gain line',
       JSON.stringify(pace?.gain))
  ];
});
