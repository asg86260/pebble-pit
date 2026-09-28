// Every ceiling the worker keeps for itself, in the PUT's written order
// (413, the floor, the code's day cap, the worker's day cap, 412, 507), the
// mint cap, and the cron's sweeps with their byte subtraction
// (docs/wave-cloud.md, "Routes", "The daily cron", "Checks").

import test from 'node:test';
import assert from 'node:assert/strict';
import { worker, bytes, NOON, MIN, HOUR, DAY } from './kit.mjs';
import {
  CLOUD_BLOB_MAX, CLOUD_BYTES_MAX, CLOUD_PUSH_FLOOR_S, CLOUD_VAULT_DAY_WRITES, CLOUD_DAY_WRITES,
  CLOUD_MINTS_IP_DAY, CLOUD_EMPTY_D, CLOUD_STALE_D
} from '../../src/config/cloud.js';
import { sweep } from '../src/sweep.js';

const TO_MIDNIGHT_S = 12 * 3600;   // the kit's clock is noon UTC
const past = w => w.tick(CLOUD_PUSH_FLOOR_S * 1000);

test('a blob over the cap is 413 and one at it is taken', async () => {
  const w = worker();
  const code = await w.mint();
  assert.equal((await w.put(code, 1, bytes(CLOUD_BLOB_MAX + 1))).status, 413);
  assert.equal(w.rows('SELECT * FROM slots').length, 0);
  assert.equal((await w.put(code, 1, bytes(CLOUD_BLOB_MAX))).status, 200);
});

test('the floor: a slot pushed again inside it is 429 with the wait, and at it is taken', async () => {
  const w = worker();
  const code = await w.mint();
  await w.put(code, 1, bytes(10));
  w.tick(10 * 1000);
  const r = await w.put(code, 1, bytes(10), { rev: 1 });
  assert.equal(r.status, 429);
  assert.deepEqual(r.json, { retryS: CLOUD_PUSH_FLOOR_S - 10 });
  // The floor is per slot: the next one over is free.
  assert.equal((await w.put(code, 2, bytes(10))).status, 200);
  w.tick((CLOUD_PUSH_FLOOR_S - 10) * 1000);
  assert.equal((await w.put(code, 1, bytes(10), { rev: 1 })).status, 200);
});

test('the code\'s day cap is 429 until midnight UTC, and the next day is new', async () => {
  const w = worker();
  const code = await w.mint();
  const other = await w.mint();
  await w.put(code, 1, bytes(10));
  w.raw.prepare('UPDATE vaults SET day_writes = ? WHERE day = ?').run(CLOUD_VAULT_DAY_WRITES, '2026-09-27');
  past(w);
  const r = await w.put(code, 1, bytes(10), { rev: 1 });
  assert.equal(r.status, 429);
  assert.equal(r.json.retryS, TO_MIDNIGHT_S - CLOUD_PUSH_FLOOR_S);
  assert.equal((await w.put(other, 1, bytes(10))).status, 200, 'another code is not held by it');
  w.now = NOON + DAY;
  assert.equal((await w.put(code, 1, bytes(10), { rev: 1 })).status, 200);
  assert.equal(w.row('SELECT day_writes FROM vaults WHERE day = ?', '2026-09-28').day_writes, 1);
});

test('the worker\'s day cap is 503 with Retry-After to midnight UTC, for every code', async () => {
  const w = worker();
  const code = await w.mint();
  await w.put(code, 1, bytes(10));
  w.raw.prepare('UPDATE totals SET writes = ?').run(CLOUD_DAY_WRITES);
  past(w);
  for (const [n, rev] of [[1, 1], [2, 0]]) {
    const r = await w.put(code, n, bytes(10), { rev });
    assert.equal(r.status, 503);
    assert.equal(r.headers.get('retry-after'), String(TO_MIDNIGHT_S - CLOUD_PUSH_FLOOR_S));
  }
  w.now = NOON + DAY;
  assert.equal((await w.put(code, 1, bytes(10), { rev: 1 })).status, 200);
  assert.equal(w.row('SELECT writes FROM totals').writes, 1);
});

test('the store\'s byte cap is 507, counting what a push replaces', async () => {
  const w = worker();
  const code = await w.mint();
  await w.put(code, 1, bytes(1000));
  w.raw.prepare('UPDATE totals SET bytes = ?').run(CLOUD_BYTES_MAX);
  past(w);
  assert.equal((await w.put(code, 2, bytes(1))).status, 507);
  // A slot replaced by one no larger fits under the same cap.
  const same = await w.put(code, 1, bytes(1000), { rev: 1 });
  assert.equal(same.status, 200);
  assert.equal((await w.put(code, 2, new Uint8Array(0))).status, 200, 'a cleared slot adds nothing');
  assert.equal(w.row('SELECT bytes FROM totals').bytes, CLOUD_BYTES_MAX);
});

test('the PUT\'s refusals come in the written order', async () => {
  const w = worker();
  const code = await w.mint();
  await w.put(code, 1, bytes(10));
  w.tick(5000);
  // Every ceiling tripped at once, then lifted one at a time: each answer is
  // the next in line.
  w.raw.prepare('UPDATE vaults SET day_writes = ?').run(CLOUD_VAULT_DAY_WRITES);
  w.raw.prepare('UPDATE totals SET writes = ?, bytes = ?').run(CLOUD_DAY_WRITES, CLOUD_BYTES_MAX);
  const stale = { rev: 0 };
  assert.equal((await w.put(code, 1, bytes(CLOUD_BLOB_MAX + 1), stale)).status, 413);
  const floor = await w.put(code, 1, bytes(20), stale);
  assert.equal(floor.status, 429);
  assert.equal(floor.json.retryS, CLOUD_PUSH_FLOOR_S - 5);
  past(w);
  const vault = await w.put(code, 1, bytes(20), stale);
  assert.equal(vault.status, 429);
  assert.ok(vault.json.retryS > CLOUD_PUSH_FLOOR_S);
  w.raw.prepare('UPDATE vaults SET day_writes = 0').run();
  assert.equal((await w.put(code, 1, bytes(20), stale)).status, 503);
  w.raw.prepare('UPDATE totals SET writes = 0').run();
  const behind = await w.put(code, 1, bytes(20), stale);
  assert.equal(behind.status, 412);
  assert.equal(behind.json.slot.rev, 1);
  assert.equal((await w.put(code, 1, bytes(20), { rev: 1 })).status, 507);
  w.raw.prepare('UPDATE totals SET bytes = 10').run();
  assert.equal((await w.put(code, 1, bytes(20), { rev: 1 })).status, 200);
  assert.equal(w.row('SELECT bytes FROM totals').bytes, 20);
});

test('mints: three an ip a day, then 429 to midnight; another ip and the next day are free', async () => {
  const w = worker();
  for (let i = 0; i < CLOUD_MINTS_IP_DAY; i++) assert.equal((await w.call('POST', '/vaults')).status, 201);
  const r = await w.call('POST', '/vaults');
  assert.equal(r.status, 429);
  assert.deepEqual(r.json, { retryS: TO_MIDNIGHT_S });
  assert.equal(w.rows('SELECT * FROM vaults').length, CLOUD_MINTS_IP_DAY);
  assert.equal((await w.call('POST', '/vaults', { ip: '198.51.100.2' })).status, 201);
  w.now = NOON + DAY;
  assert.equal((await w.call('POST', '/vaults')).status, 201);
  // The table holds no ip, only its hash with the day.
  for (const { key } of w.rows('SELECT key FROM limits')) {
    assert.ok(!key.includes('203.0.113.7') && !key.includes('198.51.100.2'));
    assert.match(key, /^mint:[0-9a-f]{64}$/);
  }
});

test('the cron sweeps the empty and the stale with their bytes, and the spent rows, and logs one line', async () => {
  const w = worker();
  const empty = await w.mint();            // never pushed to
  const used = await w.mint();             // pushed to, then left
  const live = await w.mint();             // pushed to and still played
  await w.put(used, 1, bytes(300));
  await w.put(used, 2, bytes(200));
  await w.put(live, 1, bytes(100));
  await w.call('POST', '/pairings', { secret: live });
  await w.call('POST', '/pairings/claim', { body: { pair: '000000' }, ip: '192.0.2.1' });
  assert.equal(w.row('SELECT bytes FROM totals').bytes, 600);

  // Inside the grace, nothing goes but what has expired.
  w.tick((CLOUD_EMPTY_D * 24 - 1) * HOUR);
  let s = await sweep(w.env, w.now);
  assert.equal(s.swept, 0);
  assert.equal(w.rows('SELECT * FROM pairings').length, 0, 'the pairing is ten minutes old many times over');
  assert.equal(w.rows('SELECT * FROM limits').length, 0);

  w.tick(2 * HOUR);
  s = await sweep(w.env, w.now);
  assert.equal(s.swept, 1, 'the vault nobody pushed to');
  assert.equal((await w.call('GET', '/slots', { secret: empty })).status, 401);
  assert.equal(w.row('SELECT bytes FROM totals').bytes, 600);

  // The live one is seen every day; the used one never again.
  const end = NOON + CLOUD_STALE_D * DAY + MIN;
  while (w.now < end) {
    w.tick(DAY / 2);
    await w.call('GET', '/slots', { secret: live });
  }
  s = await sweep(w.env, w.now);
  assert.equal(s.swept, 1, 'the vault unseen for half a year');
  assert.equal((await w.call('GET', '/slots', { secret: used })).status, 401);
  assert.equal((await w.call('GET', '/slots', { secret: live })).status, 200);
  assert.equal(w.row('SELECT bytes FROM totals').bytes, 100);
  assert.equal(w.rows('SELECT * FROM slots').length, 1);
  assert.equal(s.line, `cloud: ${new Date(w.now).toISOString().slice(0, 10)} writes 0/${CLOUD_DAY_WRITES} bytes 100/${CLOUD_BYTES_MAX} vaults 1 refused none`);
});
