// Every route's happy path, the bearer check, the conditional PUT under two
// writers, rotate and delete, the owner's stats, and the kill switch
// answering before a single statement runs (docs/wave-cloud.md, "Checks").

import test from 'node:test';
import assert from 'node:assert/strict';
import { worker, bytes, dump, MIN, DAY } from './kit.mjs';
import { CLOUD_PUSH_FLOOR_S, CLOUD_BYTES_MAX, CLOUD_DAY_WRITES } from '../../src/config/cloud.js';
import { sha256hex, normalSecret } from '../src/codes.js';

const SHOWN = /^PEBBLE(-[0-9A-HJKMNP-TV-Z]{4}){5}$/;
const past = w => w.tick(CLOUD_PUSH_FLOOR_S * 1000 + 1);

test('health answers, and every answer carries open CORS, a preflight included', async () => {
  const w = worker();
  const h = await w.call('GET', '/health');
  assert.equal(h.status, 200);
  assert.deepEqual(h.json, { ok: true });
  for (const r of [h, await w.call('OPTIONS', '/slots/1'), await w.call('GET', '/slots'), await w.call('GET', '/nowhere')]) {
    assert.equal(r.headers.get('access-control-allow-origin'), '*');
    assert.equal(r.headers.get('access-control-allow-methods'), 'GET, POST, PUT, DELETE');
    assert.equal(r.headers.get('access-control-allow-headers'), 'authorization, content-type, if-match, x-yard-id, x-played-s, x-save-v');
  }
  assert.equal((await w.call('OPTIONS', '/slots/1')).status, 204);
});

test('a minted vault is a shown secret, stored only as its hash, with three empty slots', async () => {
  const w = worker();
  const r = await w.call('POST', '/vaults');
  assert.equal(r.status, 201);
  assert.match(r.json.code, SHOWN);
  const raw = normalSecret(r.json.code);
  assert.equal(w.row('SELECT hash FROM vaults').hash, await sha256hex(raw));
  assert.ok(!dump(w.raw).includes(raw));
  const s = await w.call('GET', '/slots', { secret: r.json.code });
  assert.equal(s.status, 200);
  assert.deepEqual(s.json, { slots: [null, null, null] });
});

test('the bearer is read loosely and checked strictly', async () => {
  const w = worker();
  const code = await w.mint();
  const raw = normalSecret(code);
  // Lowercase, no prefix, spaces, and the look-alike letters all name it.
  const loose = raw.toLowerCase().replace(/0/g, 'o').replace(/1/g, 'l').replace(/(.{5})/g, '$1 ');
  assert.equal((await w.call('GET', '/slots', { secret: loose })).status, 200);
  assert.equal((await w.call('GET', '/slots', { secret: raw })).status, 200);
  assert.equal((await w.call('GET', '/slots')).status, 401);
  assert.equal((await w.call('GET', '/slots', { secret: 'PEBBLE-0000-0000-0000-0000-0000' })).status, 401);
  assert.equal((await w.call('GET', '/slots', { secret: 'nonsense' })).status, 401);
  assert.equal((await w.call('PUT', '/slots/1', { secret: 'PEBBLE-0000-0000-0000-0000-0000', body: bytes(10) })).status, 401);
});

test('a push is read back: its meta on the list, its bytes as gzip with the rev', async () => {
  const w = worker();
  const code = await w.mint();
  const blob = bytes(5000);
  const p = await w.put(code, 2, blob, { rev: 0, yardId: 'abc', playedS: 321, saveV: 7 });
  assert.equal(p.status, 200);
  assert.deepEqual(p.json, { rev: 1 });
  const list = await w.call('GET', '/slots', { secret: code });
  assert.deepEqual(list.json.slots, [null, { rev: 1, yardId: 'abc', playedS: 321, saveV: 7, size: 5000, at: w.now }, null]);
  const g = await w.call('GET', '/slots/2', { secret: code });
  assert.equal(g.status, 200);
  assert.equal(g.headers.get('content-type'), 'application/gzip');
  assert.equal(g.headers.get('x-rev'), '1');
  assert.deepEqual(g.bytes, blob);
  assert.equal((await w.call('GET', '/slots/1', { secret: code })).status, 404);
  assert.equal((await w.call('GET', '/slots/4', { secret: code })).status, 404);
  assert.equal((await w.put(code, 4, blob)).status, 404);
  past(w);
  const p2 = await w.put(code, 2, bytes(10), { rev: 1, playedS: 400 });
  assert.deepEqual(p2.json, { rev: 2 });
  assert.equal(w.row('SELECT bytes FROM totals').bytes, 10);
});

test('a cleared slot is an empty row, not a missing one', async () => {
  const w = worker();
  const code = await w.mint();
  await w.put(code, 1, bytes(300));
  past(w);
  const c = await w.call('PUT', '/slots/1', { secret: code, body: new Uint8Array(0), headers: { 'if-match': '1' } });
  assert.equal(c.status, 200);
  const list = await w.call('GET', '/slots', { secret: code });
  assert.equal(list.json.slots[0].size, 0);
  assert.equal(list.json.slots[0].rev, 2);
  const g = await w.call('GET', '/slots/1', { secret: code });
  assert.equal(g.status, 200);
  assert.equal(g.bytes.length, 0);
  assert.equal(w.row('SELECT bytes FROM totals').bytes, 0);
});

test('a push with its headers missing or wrong is refused and writes nothing', async () => {
  const w = worker();
  const code = await w.mint();
  for (const headers of [{ 'if-match': 'x' }, { 'x-yard-id': '' }, { 'x-played-s': '-1' }, { 'x-save-v': '1.5' }, { 'x-yard-id': 'y'.repeat(65) }]) {
    assert.equal((await w.put(code, 1, bytes(10), { headers })).status, 400);
  }
  assert.equal(w.rows('SELECT * FROM slots').length, 0);
});

test('two writers from one base: one takes, the other is 412 with the slot as it now is', async () => {
  const w = worker();
  const code = await w.mint();
  await w.put(code, 1, bytes(100), { playedS: 10 });
  past(w);
  // At once: the batches are held until both writers have reached theirs,
  // so both have passed every check and the guard in the write itself is
  // what decides -- the race D1 would run between two isolates.
  const DB = w.env.DB;
  const held = [];
  w.env.DB = {
    ...DB,
    batch: async list => {
      await new Promise(go => { held.push(go); if (held.length === 2) held.forEach(f => f()); });
      return DB.batch(list);
    }
  };
  const [a, b] = await Promise.all([
    w.put(code, 1, bytes(200), { rev: 1, yardId: 'yard-1', playedS: 20 }),
    w.put(code, 1, bytes(300), { rev: 1, yardId: 'yard-1', playedS: 30 })
  ]);
  w.env.DB = DB;
  assert.deepEqual([a.status, b.status].sort(), [200, 412]);
  const lost = a.status === 412 ? a : b;
  const won = a.status === 200 ? a : b;
  assert.equal(won.json.rev, 2);
  assert.equal(lost.json.slot.rev, 2);
  const row = w.row('SELECT rev, size FROM slots');
  assert.equal(row.rev, 2);
  // Only the winner counted: one write today past the first, and the bytes
  // of the one blob that is there.
  assert.equal(w.row('SELECT writes FROM totals').writes, 2);
  assert.equal(w.row('SELECT day_writes FROM vaults').day_writes, 2);
  assert.equal(w.row('SELECT bytes FROM totals').bytes, row.size);

  // One after the other: a device still on base 1 meets the slot at 2.
  past(w);
  const late = await w.put(code, 1, bytes(50), { rev: 1, playedS: 25 });
  assert.equal(late.status, 412);
  assert.deepEqual(late.json.slot, { rev: 2, yardId: 'yard-1', playedS: row.size === 200 ? 20 : 30, saveV: 7, size: row.size, at: w.now - CLOUD_PUSH_FLOOR_S * 1000 - 1 });
  const fresh = await w.put(code, 1, bytes(50), { rev: 0 });
  assert.equal(fresh.status, 412);
});

test('seen moves at most once a UTC day', async () => {
  const w = worker();
  const code = await w.mint();
  const minted = w.now;
  w.tick(MIN);
  await w.call('GET', '/slots', { secret: code });
  assert.equal(w.row('SELECT seen FROM vaults').seen, minted);
  w.tick(DAY);
  await w.call('GET', '/slots', { secret: code });
  const next = w.now;
  assert.equal(w.row('SELECT seen FROM vaults').seen, next);
  const before = w.counter.statements;
  w.tick(MIN);
  await w.call('GET', '/slots', { secret: code });
  assert.equal(w.counter.statements - before, 2, 'the vault and its slots, no write');
  assert.equal(w.row('SELECT seen FROM vaults').seen, next);
});

test('rotate: a new secret for the same slots, and the old one is 401 from now', async () => {
  const w = worker();
  const old = await w.mint();
  await w.put(old, 1, bytes(40));
  const r = await w.call('POST', '/vaults/me/rotate', { secret: old });
  assert.equal(r.status, 200);
  assert.match(r.json.code, SHOWN);
  assert.notEqual(r.json.code, old);
  assert.equal((await w.call('GET', '/slots', { secret: old })).status, 401);
  const list = await w.call('GET', '/slots', { secret: r.json.code });
  assert.equal(list.json.slots[0].size, 40);
  assert.equal(w.rows('SELECT * FROM vaults').length, 1);
});

test('delete: the vault, its slots and its pairing gone, its bytes subtracted', async () => {
  const w = worker();
  const keep = await w.mint();
  const gone = await w.mint();
  await w.put(keep, 1, bytes(100));
  await w.put(gone, 1, bytes(250));
  await w.put(gone, 3, bytes(50));
  await w.call('POST', '/pairings', { secret: gone });
  assert.equal(w.row('SELECT bytes FROM totals').bytes, 400);
  const d = await w.call('DELETE', '/vaults/me', { secret: gone });
  assert.equal(d.status, 204);
  assert.equal((await w.call('GET', '/slots', { secret: gone })).status, 401);
  assert.equal(w.row('SELECT bytes FROM totals').bytes, 100);
  assert.equal(w.rows('SELECT * FROM slots').length, 1);
  assert.equal(w.rows('SELECT * FROM pairings').length, 0);
  assert.equal(w.rows('SELECT * FROM vaults').length, 1);
});

test('stats are the owner\'s only', async () => {
  const w = worker();
  const code = await w.mint();
  await w.put(code, 1, bytes(64));
  assert.equal((await w.call('GET', '/stats')).status, 401);
  assert.equal((await w.call('GET', '/stats', { secret: 'wrong' })).status, 401);
  assert.equal((await w.call('GET', '/stats', { secret: code })).status, 401);
  const s = await w.call('GET', '/stats', { secret: 'owner-token' });
  assert.equal(s.status, 200);
  assert.deepEqual(s.json, { day: '2026-09-27', writes: 1, capWrites: CLOUD_DAY_WRITES, bytes: 64, capBytes: CLOUD_BYTES_MAX, vaults: 1 });
  w.tick(DAY);
  assert.equal((await w.call('GET', '/stats', { secret: 'owner-token' })).json.writes, 0);
  // A worker nobody gave a token has no stats, rather than stats for anyone.
  const bare = worker({ stats: '' });
  assert.equal((await bare.call('GET', '/stats')).status, 401);
});

test('CLOUD_PAUSED answers 503 with a day\'s wait before any statement runs', async () => {
  const w = worker();
  const code = await w.mint();
  w.env.CLOUD_PAUSED = '1';
  const before = w.counter.statements;
  const calls = [
    ['GET', '/health'], ['POST', '/vaults'], ['GET', '/slots'], ['GET', '/slots/1'], ['PUT', '/slots/1'],
    ['POST', '/pairings'], ['POST', '/pairings/claim'], ['POST', '/vaults/me/rotate'], ['DELETE', '/vaults/me'],
    ['GET', '/stats']
  ];
  for (const [m, p] of calls) {
    const r = await w.call(m, p, { secret: code, body: m === 'PUT' ? bytes(10) : undefined });
    assert.equal(r.status, 503, `${m} ${p}`);
    assert.equal(r.headers.get('retry-after'), '86400');
    assert.equal(r.headers.get('access-control-allow-origin'), '*');
  }
  // The preflight still passes, so a browser can read the 503 that follows.
  assert.equal((await w.call('OPTIONS', '/slots')).status, 204);
  assert.equal(w.counter.statements, before);
  // Any other value is not the switch.
  w.env.CLOUD_PAUSED = '0';
  assert.equal((await w.call('GET', '/slots', { secret: code })).status, 200);
});
