// The save floor, and the migrations as files (docs/saves.md).
//
// A save this game reads was written by the first public build or later, and
// every such save carries a `build` stamp. One with no stamp is put aside the
// way a blob that will not parse is, and the sheet offers it back as a file:
// nothing is silently discarded, and nothing below the floor is read. Above
// the floor every change to the save's shape is a file in src/migrations/,
// run over the raw blob before `restore()` reads a field, keyed on `saveV`.

import { group, ok, state, run, yard, storeChecks } from './helpers.mjs';
import { exportSave } from '../src/persist.js';
import { BROKEN_KEY } from '../src/save.js';
import { MIGRATIONS, migrate } from '../src/migrations/index.js';
import { SAVE_V, SAVE_FLOOR, TIER_RUNGS } from '../src/config.js';
storeChecks();          // this file is about the store itself: no reload harness

const KEY = 'boulder-clicker/v4';
const S = yard.S;

// A blob today's game writes, as an object to edit and put back.
const blobOf = () => {
  window.__reset(true);
  window.__crew(2, 2);
  window.__grant({ dust: 500 });
  run(2);
  yard.persist();
  return JSON.parse(localStorage.getItem(KEY));
};
const put = s => localStorage.setItem(KEY, typeof s === 'string' ? s : JSON.stringify(s));

group('a save with no build stamp is refused, kept, and offered back', async () => {
  const s = blobOf();
  delete s.build;
  const raw = JSON.stringify(s);
  window.__reset(true);                          // nobody standing from the blob's own yard
  put(raw);
  localStorage.removeItem(BROKEN_KEY());
  yard.restore();
  const fresh = state();
  run(3);                                        // the interval would have written by now
  const stashed = localStorage.getItem(BROKEN_KEY());
  const handed = exportSave();
  const said = S.broken;

  localStorage.removeItem(BROKEN_KEY());
  S.broken = false;
  return [
    ok(s.stored > 0 && s.crew === 4, 'the blob was a played yard', `${s.stored} dust, ${s.crew} crew`),
    ok(fresh.crew === 0 && fresh.stored === 0 && fresh.beat.yard, 'the page boots a fresh game', `${fresh.crew} crew, ${fresh.stored} dust`),
    ok(said, 'and says the save it found would not read'),
    ok(stashed === raw, 'and has put the blob aside byte for byte', `${(stashed || '').length} of ${raw.length} bytes`),
    ok(handed === raw, 'and save a copy hands that over, not the fresh game', `${handed.length} bytes`)
  ];
});

group('a save with a dev stamp and no saveV gets every migration', async () => {
  const s = blobOf();
  delete s.saveV;
  s.build = { version: '', hash: 'dev', date: '' };
  // Two of the migrations, in their pre-migration shape: a rung of the lab's
  // multiplier over a finished tend ladder, and the story as six flags.
  s.tendLevel = TIER_RUNGS - 1;
  s.mult = { tend: 2 };
  delete s.beatsDone;
  s.introDone = true;
  s.reunionDone = true;
  put(s);
  yard.restore();
  const done = S.beatsDone;
  yard.persist();
  const back = JSON.parse(localStorage.getItem(KEY));
  return [
    ok(S.tendLevel === TIER_RUNGS, 'the multiplier reads as the spark rung bought', `${S.tendLevel}`),
    ok(done.includes('show') && done.includes('part'), 'the flags read as the beats they stood for', done.join(',')),
    ok(!('mult' in back) && !('introDone' in back), 'and the old fields are not written again',
       Object.keys(back).filter(k => k === 'mult' || k === 'introDone').join(',')),
    ok(back.saveV === SAVE_V, 'and the save is stamped with today\'s shape', `${back.saveV}`)
  ];
});

// The plinko's pot was a chip already taken from the purse, its `n` the
// grains the picture showed (two a pebble in the player's yard) and its
// place the hopper or the tray; the pour's is pebbles held for, spent as
// they land. A stake standing in the hopper is still the player's stake; a
// pot won and standing in the tray, or one in a coin the pour does not take,
// is paid out of the foot, since the bank button it waited for is gone.
group('a pot from the plinko comes back a stake, or is paid out', async () => {
  const s = blobOf();
  s.saveV = 1;
  s.casinoOpen = true;
  s.pot = { cur: 'dust', stake: 300, n: 600, where: 'hopper' };
  put(s);
  yard.restore();
  const staked = S.pot && { ...S.pot };
  const t = blobOf();
  t.saveV = 1;
  t.casinoOpen = true;
  t.pot = { cur: 'shard', stake: 7, n: 14, where: 'tray' };
  t.paying = { left: 40, grains: 8 };
  put(t);
  yard.restore();
  const paid = S.paying && { ...S.paying.left };
  return [
    ok(staked && staked.stake === 300 && staked.n === 300 && staked.owed === 0 && staked.where === 'hopper',
       'a stake in the hopper is the pour\'s stake, spent and standing', JSON.stringify(staked)),
    ok(!S.pot && paid && paid.shard === 7 && paid.dust === 40,
       'a pot won in ore is owed out of the foot with what was already on its way', JSON.stringify(paid))
  ];
});

// The done mark over a station was the one key of the last thing landed; it
// is the list of everything landed since the board was read.
group('a done mark from before comes back as a list of one', async () => {
  const s = blobOf();
  s.saveV = 2;
  s.siteDone = { quarry: 'quarrybench', farm: '' };
  put(s);
  yard.restore();
  const done = JSON.stringify(S.siteDone);
  return [
    ok(Array.isArray(S.siteDone.quarry) && S.siteDone.quarry[0] === 'quarrybench' && S.siteDone.quarry.length === 1,
       'the one key is a list of one', done),
    ok(!('farm' in S.siteDone), 'and an empty mark is dropped', done)
  ];
});

group('a save at today\'s saveV gets no migration', async () => {
  const s = blobOf();
  s.mult = { tend: 2 };                          // a stray old field is left alone
  s.tendLevel = 1;
  const copy = JSON.parse(JSON.stringify(s));
  const ran = migrate(copy);
  put(s);
  yard.restore();
  return [
    ok(s.saveV === SAVE_V, 'the blob carries today\'s saveV', `${s.saveV}`),
    ok(ran.length === 0, 'and migrate runs nothing on it', ran.map(m => m.says).join('; ')),
    ok(S.tendLevel === 1, 'so the stray field folds nothing', `${S.tendLevel}`)
  ];
});

group('the migrations are in date order and none is ahead of SAVE_V', async () => {
  const dates = MIGRATIONS.map(m => m.since);
  const sorted = [...dates].sort();
  const vs = MIGRATIONS.map(m => m.v);
  return [
    ok(MIGRATIONS.length > 0, 'there are migrations to check', `${MIGRATIONS.length}`),
    ok(dates.every((d, i) => d === sorted[i]), 'the list is in date order', dates.join(', ')),
    ok(dates.every(d => /^\d{4}-\d{2}-\d{2}$/.test(d) && d >= SAVE_FLOOR),
       'and every one is dated on or after the floor', `${SAVE_FLOOR}: ${dates.join(', ')}`),
    ok(vs.every(v => Number.isInteger(v) && v >= 1 && v <= SAVE_V), 'and every v is at most SAVE_V', vs.join(', ')),
    ok(vs.every((v, i) => !i || v >= vs[i - 1]), 'climbing with the list', vs.join(', ')),
    ok(MIGRATIONS.every(m => typeof m.apply === 'function' && typeof m.says === 'string'),
       'and each says what it does and can do it')
  ];
});
