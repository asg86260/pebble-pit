// The Steam layer (DESIGN.md, "Three builds").
//
// electron/steam.cjs is plain Node, like the store it mirrors, so it is
// checked here against a temp directory and a fake remote storage -- a Map
// with the three calls the shell makes, and a count of the writes -- with no
// Steam and no Electron anywhere. What it promises: every save that lands on
// disk lands in Steam too; at launch the copy played longer wins, in either
// direction, and a tie writes nothing; with no Steam the store is the disk
// and nothing throws; a Steam build never has our cloud; and the full game's
// first launch offers the demo's save once.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { SLOTS as GAME_SLOTS } from '../src/config/saves.js';
import { cloudOnFor, cloudUrlFor, targetOf } from '../src/config/cloud.js';

const require = createRequire(import.meta.url);
const { openStore } = require('../electron/store.cjs');
const steam = require('../electron/steam.cjs');

const fresh = () => fs.mkdtempSync(path.join(os.tmpdir(), 'boulder-steam-'));
const blob = playedS => JSON.stringify({ playedS, boulder: 'x', gw: 1, gh: 1 });

function fakeRemote(files = {}) {
  const m = new Map(Object.entries(files));
  return {
    files: m, writes: 0, removes: 0,
    read(name) { return m.has(name) ? m.get(name) : null; },
    write(name, raw) { this.writes++; m.set(name, raw); return true; },
    remove(name) { this.removes++; m.delete(name); return true; }
  };
}

// An SDK as steamworks.js shapes it, over a fake remote's map.
function fakeSdk({ account = true, app = true, throwOn = null, files = {} } = {}) {
  const m = new Map(Object.entries(files));
  const trip = what => { if (throwOn === what) throw new Error(`steam: ${what}`); };
  return {
    files: m,
    init() {
      trip('init');
      return {
        cloud: {
          isEnabledForAccount: () => account,
          isEnabledForApp: () => app,
          fileExists: n => { trip('read'); return m.has(n); },
          readFile: n => { trip('read'); return m.get(n); },
          writeFile: (n, raw) => { trip('write'); m.set(n, raw); return true; },
          deleteFile: n => { trip('write'); return m.delete(n); }
        }
      };
    }
  };
}

// Steam's keyboard for a name typed on a pad (src/wardrobepage.js): the text
// back, or null for one put away, one that threw, or no Steam at all.
test('Steam\'s keyboard answers the text typed, and null for every way it can fail', async () => {
  const asked = [];
  const client = text => ({ utils: { showGamepadTextInput: async (...a) => { asked.push(a); if (text instanceof Error) throw text; return text; } } });
  assert.equal(await steam.textInputOf(client('ada'))('name', 12, 'ad'), 'ada');
  assert.deepEqual(asked[0], [0, 0, 'name', 12, 'ad'], 'single line, plain text, the cap and the name so far');
  assert.equal(await steam.textInputOf(client(null))('name', 12, ''), null);
  assert.equal(await steam.textInputOf(client(new Error('no big picture')))('name', 12, ''), null);
  assert.equal(await steam.textInputOf(null)('name', 12, ''), null);
});

test('every save that lands on disk lands in Steam, slots included', () => {
  const remote = fakeRemote();
  const store = steam.mirror(openStore(fresh()), remote);
  assert.equal(store.write(1, blob(10)), true);
  assert.equal(store.write(2, blob(20)), true);
  assert.equal(store.write(3, blob(30)), true);
  assert.equal(remote.files.get('current.json'), blob(10));
  assert.equal(remote.files.get('slot-2.json'), blob(20));
  assert.equal(remote.files.get('slot-3.json'), blob(30));
  assert.equal(store.read(2).current, blob(20), 'reads are the disk\'s');

  assert.equal(store.write(1, '{not json'), false);
  assert.equal(remote.files.get('current.json'), blob(10), 'a refused write never reaches Steam');

  assert.equal(store.write(2, ''), true);
  assert.equal(remote.files.has('slot-2.json'), false, 'a reset deletes the slot from Steam');
});

test('at launch the copy played longer wins, either way, and a tie writes nothing', () => {
  // Steam is ahead in slot 1, the disk in slot 2, the two agree in slot 3.
  const dir = fresh();
  const disk = openStore(dir);
  disk.write(1, blob(100));
  disk.write(2, blob(500));
  disk.write(3, blob(300));
  const remote = fakeRemote({ 'current.json': blob(900), 'slot-2.json': blob(50), 'slot-3.json': blob(300) });
  const store = steam.mirror(disk, remote);

  assert.deepEqual(store.reconcile(), ['steam', 'disk', 'same']);
  assert.deepEqual(disk.read(1), { current: blob(900), lastGood: blob(100) },
    'Steam\'s copy is the save, and the disk\'s is kept behind it as last-good');
  assert.equal(remote.files.get('slot-2.json'), blob(500), 'the disk\'s newer copy goes up');
  assert.equal(remote.writes, 1, 'only slot 2 was written to Steam');
  assert.equal(disk.read(3).lastGood, null, 'the tie wrote nothing to disk');

  // A second launch finds the two in step.
  assert.deepEqual(store.reconcile(), ['same', 'same', 'same']);
  assert.equal(remote.writes, 1);
});

test('one side empty or unreadable: the save there is the save', () => {
  const disk = openStore(fresh());
  disk.write(2, blob(40));
  const remote = fakeRemote({ 'current.json': blob(7), 'slot-3.json': '{torn' });
  const store = steam.mirror(disk, remote);
  assert.deepEqual(store.reconcile(), ['steam', 'disk', 'same']);
  assert.equal(disk.read(1).current, blob(7), 'a new machine takes Steam\'s save');
  assert.equal(remote.files.get('slot-2.json'), blob(40), 'a save made offline goes up');
  assert.equal(disk.read(3).current, null, 'a torn remote blob is never taken');
});

test('Steam unavailable: the disk alone, and nothing throws', () => {
  assert.equal(steam.startSteam({ sdk: null }), null, 'no SDK installed');
  assert.equal(steam.startSteam({ sdk: fakeSdk({ throwOn: 'init' }) }), null, 'Steam not running');
  assert.equal(steam.startSteam({ sdk: fakeSdk({ account: false }) }), null, 'cloud off for the account');
  assert.equal(steam.startSteam({ sdk: fakeSdk({ app: false }) }), null, 'cloud off for the game');
  assert.equal(steam.loadSdk() === null || typeof steam.loadSdk().init === 'function', true);

  const disk = openStore(fresh());
  const store = steam.mirror(disk, null);
  assert.deepEqual(store.reconcile(), []);
  assert.equal(store.write(1, blob(1)), true);
  assert.equal(store.read(1).current, blob(1));

  // Steam that starts and then fails mid-game: every call swallowed, and the
  // disk write still counts.
  const sdk = fakeSdk({ throwOn: 'write', files: { 'current.json': blob(9) } });
  const remote = steam.startSteam({ sdk });
  assert.ok(remote, 'it started');
  const mirrored = steam.mirror(openStore(fresh()), remote);
  assert.equal(mirrored.write(1, blob(2)), true);
  assert.equal(mirrored.write(1, ''), true);
  const reading = steam.startSteam({ sdk: fakeSdk({ throwOn: 'read' }) });
  assert.equal(reading.read('current.json'), null);
  assert.deepEqual(steam.mirror(openStore(fresh()), reading).reconcile(), ['same', 'same', 'same']);
});

test('through the SDK: the mirror reads and writes Steam\'s remote storage', () => {
  const sdk = fakeSdk({ files: { 'slot-2.json': blob(80) } });
  const disk = openStore(fresh());
  const store = steam.mirror(disk, steam.startSteam({ sdk }));
  store.reconcile();
  assert.equal(disk.read(2).current, blob(80));
  store.write(1, blob(3));
  assert.equal(sdk.files.get('current.json'), blob(3));
  store.write(1, '');
  assert.equal(sdk.files.has('current.json'), false);
});

test('a Steam build never has our cloud', () => {
  const url = 'https://cloud.example';
  assert.equal(targetOf({}), 'itch');
  assert.equal(cloudOnFor('itch'), true);
  assert.equal(cloudUrlFor({ VITE_CLOUD_URL: url }), url, 'itch keeps the cloud it was pointed at');
  assert.equal(cloudOnFor('steam'), false);
  assert.equal(cloudUrlFor({ VITE_TARGET: 'steam', VITE_CLOUD_URL: url }), '');

  // The mode files the Steam builds are made with, read as vite reads them.
  for (const mode of ['steam', 'steam-demo']) {
    const env = Object.fromEntries(
      fs.readFileSync(new URL(`../.env.${mode}`, import.meta.url), 'utf8')
        .split(/\r?\n/).filter(l => /^\w+=/.test(l)).map(l => l.split('='))
    );
    assert.equal(targetOf(env), 'steam', `.env.${mode} is a Steam build`);
    assert.equal(cloudUrlFor({ ...env, VITE_CLOUD_URL: url }), '', `.env.${mode} has no cloud, even pointed at one`);
  }

  // The shell's Steam layer reaches nothing but the disk and the SDK, and the
  // language file its dialog's words are in (lang.cjs, the disk and Fluent).
  const reach = file => {
    const src = fs.readFileSync(new URL(`../electron/${file}`, import.meta.url), 'utf8');
    assert.doesNotMatch(src, /fetch\(|https?:\/\//, file);
    return [...src.matchAll(/require\('([^']+)'\)/g)].map(m => m[1]).sort();
  };
  assert.deepEqual(reach('steam.cjs'), ['./lang.cjs', 'node:fs', 'node:path', 'steamworks.js']);
  assert.deepEqual(reach('lang.cjs'), ['@fluent/bundle', 'node:fs', 'node:path']);
});

test('the full game offers the demo\'s save on its first launch, once', () => {
  const root = fresh();
  const demoSaves = path.join(steam.demoDirOf(path.join(root, 'Pebble Pit')), 'saves');
  const demo = openStore(demoSaves);
  demo.write(1, blob(60));
  demo.write(2, blob(1800));   // the slot played longest is the one carried
  const remote = fakeRemote();
  const store = steam.mirror(openStore(path.join(root, 'Pebble Pit', 'saves')), remote);
  const marker = path.join(root, 'demo-carry.json');
  let asked = 0, words = null;
  const ask = w => { asked++; words = w; return true; };

  assert.equal(steam.offerDemoSave({ store, demoSaves, marker, ask }), 'carried');
  assert.equal(asked, 1);
  assert.deepEqual(words, steam.CARRY_WORDS, 'the dialog carries the owner\'s words');
  assert.equal(store.read(1).current, blob(1800));
  assert.equal(remote.files.get('current.json'), blob(1800), 'and the carried save is in Steam');

  // Never again: not on the next launch, and not after a reset either.
  store.write(1, '');
  assert.equal(steam.offerDemoSave({ store, demoSaves, marker, ask }), 'asked before');
  fs.rmSync(marker);
  assert.equal(steam.offerDemoSave({ store, demoSaves, marker, ask }), 'not first',
    'a store that has held a save is not a first launch');
  assert.equal(asked, 1);
});

test('the offer declined is the offer made; no demo save, no offer', () => {
  const root = fresh();
  const demoSaves = path.join(root, 'demo', 'saves');
  const store = openStore(path.join(root, 'full', 'saves'));
  const marker = path.join(root, 'demo-carry.json');
  let asked = 0;
  const no = () => { asked++; return false; };

  assert.equal(steam.offerDemoSave({ store, demoSaves, marker, ask: no }), 'no demo save');
  assert.equal(fs.existsSync(marker), false, 'nothing offered, so the next launch may still ask');
  assert.equal(fs.existsSync(demoSaves), false, 'and the demo\'s folder is never made');

  // The demo's own Steam copy, when reachable, is read too, and the newer wins.
  openStore(demoSaves).write(1, blob(10));
  const demoRemote = fakeRemote({ 'current.json': blob(99) });
  assert.equal(steam.demoSave({ demoSaves, demoRemote }), blob(99));

  assert.equal(steam.offerDemoSave({ store, demoSaves, demoRemote, marker, ask: no }), 'declined');
  assert.equal(store.read(1).current, null, 'declined: nothing written');
  assert.equal(steam.offerDemoSave({ store, demoSaves, demoRemote, marker, ask: no }), 'asked before');
  assert.equal(asked, 1);
});

test('the app id and the slot count', () => {
  assert.equal(steam.SLOTS, GAME_SLOTS, 'the shell counts the slots the game does');
  assert.equal(steam.appIdFor({ packaged: false, env: {} }), steam.DEV_APP);
  assert.equal(steam.DEV_APP, 480);
  assert.equal(steam.appIdFor({ packaged: false, env: { STEAM_APP_ID: '1234' } }), 1234);
  assert.equal(steam.appIdFor({ packaged: true, env: {} }), steam.APPS.full ?? undefined,
    'packaged with no id: Steam says which app it launched');
});
