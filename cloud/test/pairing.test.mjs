// A pairing code: works once, dies in ten minutes or when a newer one is
// made, is kept only peppered and hashed, carries the secret encrypted, and
// is guarded by both claim caps (docs/wave-cloud.md, "Codes", "Checks").

import test from 'node:test';
import assert from 'node:assert/strict';
import { worker, bytes, dump, NOON, MIN, HOUR } from './kit.mjs';
import { CLOUD_PAIR_S, CLOUD_PAIR_TRIES, CLOUD_PAIR_TRIES_S, CLOUD_PAIR_FAILS_HOUR } from '../../src/config/cloud.js';
import { sha256hex, normalPair, normalSecret } from '../src/codes.js';

const PAIR = /^[0-9A-HJKMNP-TV-Z]{3}-[0-9A-HJKMNP-TV-Z]{3}$/;
const claim = (w, pair, ip) => w.call('POST', '/pairings/claim', { body: { pair }, ip });

test('a claim hands back the vault\'s own secret once, and 404 the second time', async () => {
  const w = worker();
  const code = await w.mint();
  await w.put(code, 1, bytes(64));
  const p = await w.call('POST', '/pairings', { secret: code });
  assert.equal(p.status, 200);
  assert.match(p.json.pair, PAIR);
  assert.equal(p.json.expiresS, CLOUD_PAIR_S);
  // Typed on the other device loosely: lowercase, no dash.
  const c = await claim(w, p.json.pair.replace('-', '').toLowerCase(), '198.51.100.9');
  assert.equal(c.status, 200);
  assert.deepEqual(c.json, { code });
  assert.equal((await w.call('GET', '/slots', { secret: c.json.code })).json.slots[0].size, 64);
  assert.equal((await claim(w, p.json.pair)).status, 404);
  assert.equal(w.rows('SELECT * FROM pairings').length, 0);
});

test('a pairing is dead after its ten minutes', async () => {
  const w = worker();
  const code = await w.mint();
  const { json } = await w.call('POST', '/pairings', { secret: code });
  w.tick(CLOUD_PAIR_S * 1000 - 1);
  const live = w.now;
  w.tick(1);
  assert.equal((await claim(w, json.pair)).status, 404);
  w.now = live;
  assert.equal((await claim(w, json.pair)).status, 200, 'and alive a moment before');
});

test('a newer pairing kills the last', async () => {
  const w = worker();
  const code = await w.mint();
  const first = (await w.call('POST', '/pairings', { secret: code })).json.pair;
  const second = (await w.call('POST', '/pairings', { secret: code })).json.pair;
  assert.equal(w.rows('SELECT * FROM pairings').length, 1);
  assert.equal((await claim(w, first)).status, 404);
  assert.equal((await claim(w, second)).status, 200);
});

test('a new recovery code kills a live pairing, which carried the old one', async () => {
  const w = worker();
  const code = await w.mint();
  const { pair } = (await w.call('POST', '/pairings', { secret: code })).json;
  await w.call('POST', '/vaults/me/rotate', { secret: code });
  assert.equal((await claim(w, pair)).status, 404);
});

test('no secret and no pairing code is in the database in the clear, and the hash moves with the pepper', async () => {
  const w = worker({ pepper: 'pepper-a' });
  const code = await w.mint();
  const { pair } = (await w.call('POST', '/pairings', { secret: code })).json;
  const secret = normalSecret(code);
  const raw = normalPair(pair);
  const all = dump(w.raw);
  for (const s of [code, secret, pair, raw]) assert.ok(!all.includes(s), `${s} is stored`);
  const row = w.row('SELECT hash, wrapped, iv FROM pairings');
  assert.equal(row.hash, await sha256hex('pepper-a' + raw));
  assert.notEqual(row.hash, await sha256hex(raw));
  assert.notEqual(row.hash, await sha256hex('pepper-b' + raw));
  assert.equal(new Uint8Array(row.iv).length, 12);

  // The same vault behind another pepper: the code claimed under the old
  // one is nothing to it.
  const other = worker({ pepper: 'pepper-b' });
  other.raw.exec(`INSERT INTO pairings SELECT * FROM (SELECT '${row.hash}', 'v', ${NOON + HOUR}, x'00', x'00')`);
  assert.equal((await claim(other, pair)).status, 404);
});

test('an ip gets five wrong claims in the window, then 429 even for a good code', async () => {
  const w = worker();
  const code = await w.mint();
  const { pair } = (await w.call('POST', '/pairings', { secret: code })).json;
  const ip = '192.0.2.44';
  const wrong = pair === '000-000' ? '111-111' : '000-000';
  for (let i = 0; i < CLOUD_PAIR_TRIES; i++) assert.equal((await claim(w, wrong, ip)).status, 404);
  const held = await claim(w, pair, ip);
  assert.equal(held.status, 429);
  assert.deepEqual(held.json, { retryS: CLOUD_PAIR_TRIES_S });
  // Junk counts the same as a wrong code, and a different ip is not held.
  const junk = await w.call('POST', '/pairings/claim', { body: new TextEncoder().encode('not json'), ip: '192.0.2.45' });
  assert.equal(junk.status, 404);
  w.tick(CLOUD_PAIR_TRIES_S * 1000 - MIN);
  assert.equal((await claim(w, pair, ip)).status, 429);
  w.tick(MIN);
  // The window is over, and so is that code's life: a fresh one is taken.
  const again = (await w.call('POST', '/pairings', { secret: code })).json.pair;
  assert.equal((await claim(w, again, ip)).status, 200);
});

test('past the worker\'s wrong claims for the hour, every ip is held until the hour turns', async () => {
  const w = worker();
  const code = await w.mint();
  const { pair } = (await w.call('POST', '/pairings', { secret: code })).json;
  const wrong = pair === '000-000' ? '111-111' : '000-000';
  // Spread over many ips, as a botnet would, so the per-ip cap never trips.
  for (let i = 0; i < CLOUD_PAIR_FAILS_HOUR; i++) {
    const ip = `10.${(i >> 16) & 255}.${(i >> 8) & 255}.${i & 255}`;
    assert.equal((await claim(w, wrong, ip)).status, 404);
  }
  const held = await claim(w, pair, '172.16.0.1');
  assert.equal(held.status, 429);
  assert.deepEqual(held.json, { retryS: (HOUR - (NOON % HOUR)) / 1000 });
  w.now = NOON + HOUR;
  const again = (await w.call('POST', '/pairings', { secret: code })).json.pair;
  assert.equal((await claim(w, again, '172.16.0.1')).status, 200);
  assert.equal(w.row('SELECT fails FROM totals').fails, CLOUD_PAIR_FAILS_HOUR);
});
