// The notices as Steam achievements.
//
// A notice won in the yard reaches the shell through window.desk and the
// shell's Steam client exactly once; at launch the save's whole record is set
// again, so a player who won them before Steam was in the game has them; with
// no Steam anywhere nothing throws. The win is reached the way the game
// reaches it -- a pebble banked, the notice earned by stepNotices -- and the
// desk and the Steam client are fakes shaped like preload.cjs and steamworks.js.

import { createRequire } from 'node:module';
import { group, ok, run, runUntil, yard, haveRock, quickCrew } from './helpers.mjs';
import { S } from '../src/state.js';
import { NOTICES, earn } from '../src/notices.js';
import { STEAM_ACHIEVEMENTS, steamNameOf, syncSteam } from '../src/achievements.js';

const require = createRequire(import.meta.url);
const steam = require('../electron/steam.cjs');

// steamworks.js's achievement api over a Set, counting every call.
function fakeClient(has = []) {
  const got = new Set(has);
  const c = {
    got, activations: [],
    achievement: {
      isActivated: n => got.has(n),
      activate(n) { c.activations.push(n); got.add(n); return true; }
    }
  };
  return c;
}

// The desk as preload.cjs and main.cjs make it: the page's two calls land on
// the shell's achievements.
const deskOver = client => {
  const a = steam.achievementsOf(client);
  return { achievement: n => a.unlock(n), achievements: ns => a.sync(ns) };
};

const onDesk = async (d, fn) => {
  window.desk = d;
  try { return await fn(); } finally { delete window.desk; }
};

async function bankSomething() {
  haveRock();
  await run(1);
  quickCrew();
  window.__crew(2, 3);
  window.__swing(80);
  await runUntil(() => S.won.includes('firstgrain'), 120);
}

group('a win in the yard reaches Steam once, and a repeat does not', async () => {
  const client = fakeClient();
  await onDesk(deskOver(client), async () => {
    await bankSomething();
    await run(2);
    earn('firstgrain');          // already won: the game refuses it before the desk hears
  });
  const mine = client.activations.filter(n => n === steamNameOf('firstgrain'));
  return [
    ok(S.won.includes('firstgrain'), 'the first pebble is a notice'),
    ok(mine.length === 1, 'and Steam was told once', client.activations.join(',')),
    ok(client.activations.every(n => S.won.map(steamNameOf).includes(n)), 'and told only what was won')
  ];
});

group('a win Steam already has is not set again', async () => {
  const client = fakeClient([steamNameOf('firstgrain')]);
  await onDesk(deskOver(client), async () => { await bankSomething(); });
  return [
    ok(S.won.includes('firstgrain'), 'won'),
    ok(!client.activations.includes(steamNameOf('firstgrain')), 'and not activated over the old one')
  ];
});

group('the launch sync sets every notice the save already holds', async () => {
  const won = ['firstgrain', 'firstrock', 'rock0', 'ore0'];
  const client = fakeClient();
  await onDesk(deskOver(client), () => syncSteam(won));
  const again = fakeClient();
  await onDesk(deskOver(again), () => { syncSteam(won); syncSteam(won); });
  return [
    ok(client.activations.length === won.length &&
       won.every(k => client.got.has(steamNameOf(k))), 'each one is set', client.activations.join(',')),
    ok(again.activations.length === won.length, 'and a second sync sets nothing new')
  ];
});

group('with no Steam, nothing throws and nothing is said', async () => {
  let threw = null;
  try {
    // no desk at all (the web), a desk without the calls (an old shell), and a
    // shell whose Steam never started
    syncSteam(['firstgrain']);
    window.desk = {};
    syncSteam(['firstgrain']);
    window.desk = deskOver(null);
    syncSteam(['firstgrain']);
    earn('firstspore');
    const broken = fakeClient();
    broken.achievement.activate = () => { throw new Error('steam went away'); };
    window.desk = deskOver(broken);
    earn('firstspark');
    syncSteam(['firstgrain']);
  } catch (e) { threw = e; } finally { delete window.desk; }
  return [
    ok(!threw, 'every way of having no Steam is quiet', String(threw)),
    ok(steam.achievementsOf(null).unlock('ACH_FIRSTGRAIN') === false, 'and a shell with no client unlocks nothing'),
    ok(steam.achievementsOf(fakeClient()).unlock('rock0') === false, 'and a name that is not one of ours is refused')
  ];
});

group('every notice has its own Steam name', async () => {
  const names = STEAM_ACHIEVEMENTS.map(a => a.api);
  const catalog = NOTICES.map(n => steamNameOf(n.key));
  const missing = catalog.filter(n => !names.includes(n));
  return [
    ok(new Set(names).size === names.length, 'the names are unique'),
    ok(!missing.length && names.length === NOTICES.length, 'and cover every notice in the game', missing.join(',')),
    ok(names.every(n => steam.ACH_NAME.test(n)), 'and each is one the shell will pass on',
       names.filter(n => !steam.ACH_NAME.test(n)).join(','))
  ];
});
