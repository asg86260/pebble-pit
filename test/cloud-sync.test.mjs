// Cloud saves, the sync (DESIGN.md, "Cloud saves: a sync code and a worker";
// docs/wave-cloud.md, "Checks").
//
// Two or three devices in one process: a device is a store (a fake IndexedDB,
// as test/idb-store.test.mjs primes one), and "picking up the other device" is
// priming its store and booting the way main.js does -- `cloudBoot`, then
// `restore`. The worker is the real one: `fetch` goes into `handle` from
// cloud/src/app.js over node's SQLite, so nothing here is a second copy of the
// contract. Every link and answer goes through the verbs the sheet's buttons
// call. A push from a device that is not being driven here (one ahead, one
// writing junk) is a PUT straight into the same worker.
//
// The clock is the wall's, mocked, so the push cadence and the worker's
// floor are turned by hand and nothing waits.

import { mock } from 'node:test';
import { readFileSync } from 'node:fs';

const { group, ok, run, yard, storeChecks } = await import('./helpers.mjs');
storeChecks();          // every device here is a store of its own; the reload harness would write through them
const { handle } = await import('../cloud/src/app.js');
const { makeD1 } = await import('../cloud/test/d1.mjs');
const cloud = await import('../src/cloud.js');
const { persist, restore, bootYard, switchSlot } = await import('../src/persist.js');
const { primeStore, storeSettled, setSlot, clear, slotRaw, loadPrevOf, writeSlot } = await import('../src/save.js');
const { SAVE_V, CLOUD_BOOT_MS, CLOUD_PUSH_S, CLOUD_TIMEOUT_MS, CLOUD_PUSH_FLOOR_S } = await import('../src/config.js');

const S = yard.S;
const URL_ = 'https://cloud.test';
mock.timers.enable({ apis: ['Date'], now: Date.UTC(2026, 8, 27, 12) });
const later = s => { mock.timers.tick(s * 1000); };

// --- devices ----------------------------------------------------------------------
function fakeKv() {
  const m = new Map();
  return {
    m,
    get: async k => (m.has(k) ? m.get(k) : null),
    set: async (k, v) => { m.set(k, v); return true; },
    del: async k => { m.delete(k); return true; },
    all: async () => new Map(m)
  };
}
const device = () => ({ kv: fakeKv() });
let here = null;
async function pick(dev) {
  await storeSettled();
  here = dev;
  await primeStore(() => Promise.resolve(dev.kv));
}
// A page opening on this device: the cloud first, then the yard.
async function boot(dev) {
  await pick(dev);
  await cloud.cloudBoot();
  S.yielded = false;
  restore();
  bootYard();
}
// A new game on this device's open slot, played a while and saved.
async function played(dev, s = 10) {
  await pick(dev);
  window.__reset();
  window.__crew(2);
  run(s);
  persist();
  await storeSettled();
}
async function playOn(s) { run(s); persist(); await storeSettled(); }

// --- the worker -------------------------------------------------------------------
let w;
function wire() {
  const d1 = makeD1();
  w = { env: { DB: d1.DB, PAIR_PEPPER: 'test', STATS_TOKEN: 't' }, raw: d1.raw, calls: [] };
  cloud.setCloudUrl(URL_);
  // Kept on `w`, so a check can answer one call in the worker's place and
  // hand the rest through.
  w.fetch = async (u, init = {}) => {
    const path = new URL(u).pathname;
    w.calls.push({ method: init.method || 'GET', path, at: Date.now() });
    const h = new Headers(init.headers || {});
    h.set('cf-connecting-ip', '203.0.113.7');
    return handle(new Request(u, { method: init.method, headers: h, body: init.body }), w.env, Date.now());
  };
  cloud.setCloudFetch(w.fetch);
}
const puts = n => w.calls.filter(c => c.method === 'PUT' && c.path === `/slots/${n}`).length;
const row = n => w.raw.prepare('SELECT * FROM slots WHERE n = ?').get(n);
const secret = () => cloud.normalize(cloud.recoveryCode());
const blobOf = raw => JSON.parse(raw);

// Another device's push, straight into the worker.
async function pushFrom(n, raw, rev, { yardId, playedS, saveV = SAVE_V } = {}) {
  const body = raw ? await cloud.gzip(raw) : new Uint8Array(0);
  const r = await handle(new Request(`${URL_}/slots/${n}`, {
    method: 'PUT', body,
    headers: { authorization: `Bearer ${secret()}`, 'if-match': String(rev), 'x-yard-id': yardId,
               'x-played-s': String(Math.floor(playedS)), 'x-save-v': String(saveV), 'cf-connecting-ip': '198.51.100.9' }
  }), w.env, Date.now());
  return r.status;
}
// The same yard, a stretch further on: what a device ahead would have written.
function aheadOf(raw, s) {
  const b = blobOf(raw);
  b.playedS += s;
  b.stored = (b.stored || 0) + 7;
  b.savedAt = Date.now();
  return JSON.stringify(b);
}

// A fresh device with a played yard in slot 1, linked to a new vault.
async function linked(s = 10) {
  wire();
  const a = device();
  await played(a, s);
  await cloud.cloudBoot();
  const code = await cloud.startCloud();
  return { a, code };
}

group('keep my yards in the cloud pushes the open yard', async () => {
  const { code } = await linked();
  const r = row(1);
  return [
    ok(/^PEBBLE(-[0-9A-HJKMNP-TV-Z]{4}){5}$/.test(code || ''), 'the recovery code is shown', String(code)),
    ok(r && r.yard_id === S.yardId, 'slot 1 is in the cloud, this yard', r && r.yard_id),
    ok(r && r.played_s === Math.floor(S.playedS) && r.played_s > 0, 'at its length', `${r?.played_s} vs ${S.playedS}`),
    ok(puts(1) === 1 && puts(2) === 0, 'one push, and none for the empty slots', `${puts(1)}, ${puts(2)}`),
    ok(cloud.cloudStatus().state === 'ok', 'the line says ok', cloud.cloudStatus().state),
    ok(cloud.recoveryCode() === code, 'and show recovery code shows the same code')
  ];
});

group('a second store claims a pairing code and boots the yard', async () => {
  const { a } = await linked();
  const yardA = S.yardId, lenA = S.playedS;
  const pair = await cloud.makePair();
  const onLine = cloud.cloudStatus().pair?.pair === pair?.pair;
  const b = device();
  await pick(b);
  await cloud.cloudBoot();
  const offBefore = cloud.cloudStatus().state;
  const took = await cloud.claimPair(pair.pair.toLowerCase().replace('-', ' '));
  S.yielded = false;
  restore(); bootYard();
  const again = await cloud.claimPair(pair.pair);
  return [
    ok(/^[0-9A-Z]{3}-[0-9A-Z]{3}$/.test(pair?.pair || ''), 'link a device shows a code', pair?.pair),
    ok(pair.expires > Date.now() && onLine, 'with its minutes left, on the line'),
    ok(offBefore === 'off', 'the new device is off until it links', offBefore),
    ok(took === true, 'the code links it, typed however'),
    ok(S.yardId === yardA && Math.abs(S.playedS - lenA) < 1e-6, 'and it boots the same yard', `${S.yardId} ${S.playedS}`),
    ok(again === false, 'the code is spent once used'),
    ok(a && cloud.cloudStatus().state === 'ok', 'the line says ok', cloud.cloudStatus().state)
  ];
});

group('a recovery code links a store with no other device', async () => {
  const { code } = await linked();
  const yardA = S.yardId;
  const c = device();
  await pick(c);
  await cloud.cloudBoot();
  const wrong = await cloud.useRecovery('PEBBLE-0000-0000-0000-0000-0000');
  const took = await cloud.useRecovery(code.toLowerCase());
  S.yielded = false;
  restore(); bootYard();
  return [
    ok(wrong === false, 'a code nobody minted does not link'),
    ok(took === true, 'the recovery code links'),
    ok(S.yardId === yardA, 'and the yard comes back', S.yardId)
  ];
});

group('the higher playedS wins, both ways', async () => {
  const { a, code } = await linked(10);
  const p1 = S.playedS;
  // B joins and plays on.
  const b = device();
  await pick(b);
  await cloud.cloudBoot();
  await cloud.useRecovery(code);
  await boot(b);
  const bStarts = S.playedS;
  await playOn(30);
  const p2 = S.playedS;
  later(CLOUD_PUSH_S + 1);
  await cloud.pump(Date.now());
  const up = row(1).played_s;
  // A opens: the cloud's copy is longer, so it is taken, and A's goes to .prev.
  await boot(a);
  const aTook = S.playedS;
  const prev = blobOf(loadPrevOf(1) || '{}').playedS;
  // A plays on without the cloud hearing, and opens again: its own is longer.
  await playOn(20);
  const p3 = S.playedS;
  await boot(a);
  const aKept = S.playedS;
  later(CLOUD_PUSH_S + 1);
  await cloud.pump(Date.now());
  return [
    ok(Math.abs(bStarts - p1) < 1e-6, 'B starts where A left off', `${bStarts} vs ${p1}`),
    ok(up === Math.floor(p2), 'B pushes its longer yard', `${up} vs ${p2}`),
    ok(Math.abs(aTook - p2) < 1e-6, 'A boots the longer yard from the cloud', `${aTook} vs ${p2}`),
    ok(Math.abs(prev - p1) < 1e-6, 'and keeps its own under .prev', `${prev}`),
    ok(Math.abs(aKept - p3) < 1e-6, 'a longer yard here is kept over the cloud', `${aKept} vs ${p3}`),
    ok(row(1).played_s === Math.floor(p3), 'and goes up on the next push', `${row(1).played_s}`)
  ];
});

group('a device behind stops pushing; keep this one and take it do what they say', async () => {
  const { a } = await linked(10);
  const mine = slotRaw(1);
  // Another device, ahead on this yard, pushes over the rev A holds.
  later(CLOUD_PUSH_S);
  const ahead = aheadOf(mine, 120);
  const st = await pushFrom(1, ahead, row(1).rev, { yardId: S.yardId, playedS: blobOf(ahead).playedS });
  // A plays a little and pushes: the cloud has moved on.
  await playOn(5);
  later(CLOUD_PUSH_S + 1);
  await cloud.pump(Date.now());
  const said = cloud.cloudStatus();
  const n0 = puts(1);
  await playOn(5);
  later(CLOUD_PUSH_S + 1);
  await cloud.pump(Date.now());
  const stopped = puts(1) === n0;
  const untouched = row(1).played_s === Math.floor(blobOf(ahead).playedS);
  // keep this one: A's goes up over the cloud's, which goes to .prev.
  const aLen = blobOf(slotRaw(1)).playedS;
  const kept = await cloud.keepHere(1);
  const keptUp = row(1).played_s === Math.floor(aLen);
  const cloudsToPrev = blobOf(loadPrevOf(1) || '{}').stored === blobOf(ahead).stored;
  const cleared = cloud.cloudStatus().state;
  // And again, answered the other way: take it.
  later(CLOUD_PUSH_S);
  const ahead2 = aheadOf(slotRaw(1), 300);
  await pushFrom(1, ahead2, row(1).rev, { yardId: S.yardId, playedS: blobOf(ahead2).playedS });
  await playOn(5);
  later(CLOUD_PUSH_S + 1);
  await cloud.pump(Date.now());
  const behindAgain = cloud.cloudStatus().state;
  const took = await cloud.takeCloud(1);
  const written = blobOf(slotRaw(1)).playedS === blobOf(ahead2).playedS;
  restore(); bootYard();
  return [
    ok(st === 200, 'the device ahead pushed', String(st)),
    ok(said.state === 'behind' && said.slot === 1, 'A is told another device is newer, on slot 1', JSON.stringify(said)),
    ok(stopped, 'and pushes nothing more on that slot', `${puts(1)} vs ${n0}`),
    ok(untouched, 'the cloud still has the newer yard'),
    ok(kept === true && keptUp, 'keep this one pushes this device\'s over it', `${row(1).played_s} vs ${aLen}`),
    ok(cloudsToPrev, 'and the cloud\'s copy is kept under .prev'),
    ok(cleared === 'ok', 'the line clears', cleared),
    ok(behindAgain === 'behind', 'a second device ahead is caught the same way', behindAgain),
    ok(took === true && written, 'take it has written the cloud\'s copy when it answers'),
    ok(Math.abs(S.playedS - blobOf(ahead2).playedS) < 1e-6, 'and the page comes back on it', `${S.playedS}`),
    ok(!!a, 'on the same device')
  ];
});

group('two different yards are never overwritten until the player chooses', async () => {
  // A: a yard in slots 1 and 2.
  wire();
  const a = device();
  await played(a, 10);
  switchSlot(2); run(10); persist(); await storeSettled();
  const x1 = blobOf(slotRaw(1)).yardId, x2 = blobOf(slotRaw(2)).yardId;
  switchSlot(1);
  await cloud.cloudBoot();
  const code = await cloud.startCloud();
  // C: yards of its own in both.
  const c = device();
  await played(c, 10);
  switchSlot(2); run(10); persist(); await storeSettled();
  switchSlot(1); await storeSettled();
  const y1 = blobOf(slotRaw(1)).yardId, y2 = blobOf(slotRaw(2)).yardId;
  await cloud.cloudBoot();
  const linkedC = await cloud.useRecovery(code);
  const list = cloud.conflicts();
  const n1 = puts(1), n2 = puts(2);
  later(CLOUD_PUSH_S + 1);
  await cloud.pump(Date.now());
  const heldBack = puts(1) === n1 && puts(2) === n2;
  const neither = blobOf(slotRaw(1)).yardId === y1 && blobOf(slotRaw(2)).yardId === y2 &&
                  row(1).yard_id === x1 && row(2).yard_id === x2;
  const state = cloud.cloudStatus().state;
  // Slot 1: the cloud's. Slot 2: this device's.
  S.yielded = false;
  const c1 = await cloud.choose(1, 'cloud');
  S.yielded = false;
  const c2 = await cloud.choose(2, 'here');
  later(CLOUD_PUSH_S + 1);
  await cloud.pump(Date.now());
  return [
    ok(linkedC === true, 'the recovery code links C'),
    ok(list.length === 2 && list[0].n === 1 && list[1].n === 2, 'both slots are in the conflict pane', JSON.stringify(list)),
    ok(list.every(r => /^rock \d+ · \d+ crew/.test(r.here) && /^rock \d+ · \d+ crew/.test(r.cloud)),
       'each side said the way the saves page says a yard', JSON.stringify(list)),
    ok(state === 'conflict', 'the line says choose a yard', state),
    ok(heldBack && neither, 'and nothing is written either way meanwhile'),
    ok(c1 && blobOf(slotRaw(1)).yardId === x1 && blobOf(loadPrevOf(1)).yardId === y1,
       'the cloud\'s chosen: it is the slot, and this device\'s is under .prev'),
    ok(c2 && blobOf(slotRaw(2)).yardId === y2 && blobOf(loadPrevOf(2)).yardId === x2,
       'this device\'s chosen: it stays, and the cloud\'s is under .prev'),
    ok(row(2).yard_id === y2, 'and goes up over the cloud\'s', row(2).yard_id),
    ok(cloud.conflicts().length === 0 && cloud.cloudStatus().state === 'ok', 'the pane empties', cloud.cloudStatus().state)
  ];
});

group('a cleared slot stays cleared on the other device', async () => {
  wire();
  const a = device();
  await played(a, 10);
  switchSlot(2); run(10); persist(); await storeSettled();
  switchSlot(1);
  await cloud.cloudBoot();
  const code = await cloud.startCloud();
  const b = device();
  await pick(b);
  await cloud.cloudBoot();
  await cloud.useRecovery(code);
  const bHad = !!slotRaw(2);
  // A erases slot 2 the way the title page does, and the page pushes.
  await boot(a);
  setSlot(2); clear(); setSlot(1);
  later(CLOUD_PUSH_S + 1);
  await cloud.pump(Date.now());
  const clearedUp = row(2) && row(2).size === 0;
  // B opens: the slot goes, its copy kept under .prev.
  await boot(b);
  const bCleared = slotRaw(2) == null && !!loadPrevOf(2);
  const n2 = puts(2);
  later(CLOUD_PUSH_S + 1);
  await cloud.pump(Date.now());
  await boot(b);
  later(CLOUD_PUSH_S + 1);
  await cloud.pump(Date.now());
  return [
    ok(bHad, 'B had the yard in slot 2'),
    ok(clearedUp, 'the clear goes up as an empty slot, not a deletion', JSON.stringify(row(2) && { size: row(2).size })),
    ok(bCleared, 'B finds it cleared, and keeps its copy under .prev'),
    ok(slotRaw(2) == null && puts(2) === n2, 'and nothing brings it back', `${puts(2)} vs ${n2}`)
  ];
});

group('a cloud blob that will not read is never written', async () => {
  await linked(10);
  const mine = slotRaw(1);
  later(CLOUD_PUSH_S);
  const st = await pushFrom(1, '{"not":"a save"}', row(1).rev, { yardId: S.yardId, playedS: S.playedS + 500 });
  const dev = here;
  await boot(dev);
  const kept = slotRaw(1) === mine;
  later(CLOUD_PUSH_S + 1);
  await cloud.pump(Date.now());
  return [
    ok(st === 200, 'the junk is in the cloud', String(st)),
    ok(kept, 'the yard here is untouched'),
    ok(row(1).played_s === Math.floor(blobOf(mine).playedS), 'and goes back up over the junk', `${row(1).played_s}`)
  ];
});

group('a save from a newer build is neither taken nor pushed over', async () => {
  await linked(10);
  const mine = slotRaw(1);
  later(CLOUD_PUSH_S);
  const newer = JSON.parse(aheadOf(mine, 200));
  newer.saveV = SAVE_V + 1;
  await pushFrom(1, JSON.stringify(newer), row(1).rev, { yardId: S.yardId, playedS: newer.playedS, saveV: SAVE_V + 1 });
  const dev = here;
  await boot(dev);
  const kept = slotRaw(1) === mine;
  const state = cloud.cloudStatus().state;
  const n = puts(1);
  await playOn(10);
  later(CLOUD_PUSH_S + 1);
  await cloud.pump(Date.now());
  return [
    ok(kept, 'the yard here is kept'),
    ok(state === 'newer', 'the line says update to take it', state),
    ok(puts(1) === n && row(1).save_v === SAVE_V + 1, 'and nothing is pushed over it', `${puts(1)} vs ${n}`)
  ];
});

group('a dead cloud boots the local yard inside CLOUD_BOOT_MS', async () => {
  const { a } = await linked(10);
  const yardA = S.yardId;
  await pick(a);
  cloud.setCloudFetch(() => new Promise(() => {}));
  const t0 = Date.now();
  mock.timers.reset();
  mock.timers.enable({ apis: ['Date', 'setTimeout'], now: t0 });
  let done = false;
  let before, after;
  try {
    const p = cloud.cloudBoot().then(() => { done = true; });
    for (let i = 0; i < 5; i++) await Promise.resolve();
    mock.timers.tick(CLOUD_BOOT_MS - 1);
    for (let i = 0; i < 5; i++) await Promise.resolve();
    before = done;
    mock.timers.tick(1);
    await p;
    after = done;
    // The call the boot gave up on times out in its own time.
    mock.timers.tick(CLOUD_TIMEOUT_MS);
  } finally {
    mock.timers.reset();
    mock.timers.enable({ apis: ['Date'], now: t0 + 3600e3 });
  }
  S.yielded = false;
  restore(); bootYard();
  return [
    ok(!before, 'the boot waits for the cloud up to its limit'),
    ok(after, 'and no longer'),
    ok(S.yardId === yardA, 'the local yard boots', S.yardId),
    ok(cloud.cloudStatus().state === 'offline', 'and the line says offline', cloud.cloudStatus().state)
  ];
});

group('an old save gets a yardId and playedS 0 on load', async () => {
  await primeStore(() => Promise.resolve(null));
  const raw = readFileSync(new URL('./fixtures/player-yard.json', import.meta.url), 'utf8');
  const old = JSON.parse(raw);
  localStorage.setItem('boulder-clicker/v4', raw);
  restore(); bootYard();
  const id = S.yardId, len = S.playedS;
  persist();
  const out = JSON.parse(localStorage.getItem('boulder-clicker/v4'));
  localStorage.removeItem('boulder-clicker/v4');
  return [
    ok(!('yardId' in old) && (old.saveV ?? 0) < SAVE_V, 'the fixture is from before', `${old.saveV}`),
    ok(/^[0-9A-HJKMNP-TV-Z]{16}$/.test(id), 'it is given a name', id),
    ok(len === 0, 'and nought played', String(len)),
    ok(out.yardId === id && out.saveV === SAVE_V, 'and saves them')
  ];
});


// --- what the review found (2026-09-28) -------------------------------------------
// A refusal answered in the worker's place, logged like a real call.
const refusal = (status, body) => (u, init = {}) => {
  w.calls.push({ method: init.method || 'GET', path: new URL(u).pathname, at: Date.now() });
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
};

group('a slot not opened since the update is brought up to today and pushed', async () => {
  await linked();
  const old = blobOf(slotRaw(1));
  delete old.yardId;
  delete old.playedS;
  old.saveV = SAVE_V - 1;
  writeSlot(2, JSON.stringify(old));
  await storeSettled();
  later(CLOUD_PUSH_S + 1);
  await cloud.pump(Date.now());
  const r2 = row(2);
  const now2 = blobOf(slotRaw(2));
  return [
    ok(!!r2 && r2.yard_id.length > 0, 'the old slot reaches the cloud with a name', JSON.stringify(r2?.yard_id)),
    ok(now2.saveV === SAVE_V && now2.yardId === r2?.yard_id, 'and is written back in today\'s shape, under the name it went up with'),
    ok(cloud.cloudStatus().state === 'ok', 'the line is ok', cloud.cloudStatus().state)
  ];
});

group('a refusal the client does not know stops that slot, and not the others', async () => {
  await linked();
  const bad = refusal(400, { error: 'bad headers' });
  cloud.setCloudFetch((u, init = {}) =>
    init.method === 'PUT' && new URL(u).pathname === '/slots/2' ? bad(u, init) : w.fetch(u, init));
  const b = blobOf(slotRaw(1));
  writeSlot(2, JSON.stringify({ ...b, yardId: 'two' }));
  writeSlot(3, JSON.stringify({ ...b, yardId: 'three' }));
  await storeSettled();
  later(CLOUD_PUSH_S + 1);
  await cloud.pump(Date.now());
  const tried = puts(2);
  later(CLOUD_PUSH_S * 10);
  await cloud.pump(Date.now());
  const state = cloud.cloudStatus().state;
  cloud.setCloudFetch(w.fetch);
  return [
    ok(row(3)?.yard_id === 'three', 'the slot after it still goes up'),
    ok(tried === 1 && puts(2) === 1, 'the refused slot is not sent again', `${tried}, ${puts(2)}`),
    ok(state === 'refused', 'and the line says so', state)
  ];
});

group('a save that lands while a push is in flight goes up next', async () => {
  await linked();
  const b = blobOf(slotRaw(1));
  writeSlot(2, JSON.stringify({ ...b, yardId: 'two', playedS: 100 }));
  await storeSettled();
  let once = true;
  cloud.setCloudFetch((u, init = {}) => {
    if (once && init.method === 'PUT' && new URL(u).pathname === '/slots/2') {
      once = false;
      writeSlot(2, JSON.stringify({ ...b, yardId: 'two', playedS: 150 }));
    }
    return w.fetch(u, init);
  });
  later(CLOUD_PUSH_S + 1);
  await cloud.pump(Date.now());
  const first = row(2)?.played_s;
  later(CLOUD_PUSH_S + 1);
  await cloud.pump(Date.now());
  cloud.setCloudFetch(w.fetch);
  return [
    ok(first === 100, 'the push in flight took the copy it read', String(first)),
    ok(row(2)?.played_s === 150, 'and the write that landed meanwhile went up next', String(row(2)?.played_s))
  ];
});

group('a 401 signs the device out but keeps its code, and it comes back when the worker knows it', async () => {
  const { a } = await linked();
  const code = cloud.recoveryCode();
  cloud.setCloudFetch(refusal(401, { error: 'unknown code' }));
  await playOn(5);
  later(CLOUD_PUSH_S + 1);
  await cloud.pump(Date.now());
  const out = cloud.cloudStatus().state;
  const kept = cloud.recoveryCode();
  const n0 = w.calls.length;
  await playOn(5);
  later(CLOUD_PUSH_S + 1);
  await cloud.pump(Date.now());
  const quiet = w.calls.length === n0;
  cloud.setCloudFetch(w.fetch);
  await boot(a);
  const back = cloud.cloudStatus().state;
  await playOn(5);
  later(CLOUD_PUSH_S + 1);
  const before = puts(1);
  await cloud.pump(Date.now());
  return [
    ok(out === 'out', 'the line says signed out', out),
    ok(!!code && kept === code, 'and the code is still on this device'),
    ok(quiet, 'which calls nothing more this session'),
    ok(back === 'ok', 'at the next boot the worker knows it again, and it is back', back),
    ok(puts(1) === before + 1, 'and pushing again', `${before} -> ${puts(1)}`)
  ];
});

group('a push too soon after another device\'s waits for that slot alone', async () => {
  await linked();
  later(CLOUD_PUSH_S);
  const ahead = aheadOf(slotRaw(1), 120);
  await pushFrom(1, ahead, row(1).rev, { yardId: S.yardId, playedS: blobOf(ahead).playedS });
  // Straight after it, this device has moved slot 1 and has a yard in slot 2.
  await playOn(5);
  writeSlot(2, JSON.stringify({ ...blobOf(slotRaw(1)), yardId: 'two' }));
  await storeSettled();
  await cloud.pump(Date.now());
  const said = cloud.cloudStatus().state;
  const twoUp = row(2)?.yard_id === 'two';
  later(CLOUD_PUSH_FLOOR_S + 1);
  await cloud.pump(Date.now());
  const then = cloud.cloudStatus();
  return [
    ok(said !== 'paused', 'the floor is not a pause on the line', said),
    ok(twoUp, 'the other slot went up in the same pass'),
    ok(then.state === 'behind' && then.slot === 1, 'and past the floor, slot 1 learns it is behind', JSON.stringify(then))
  ];
});
