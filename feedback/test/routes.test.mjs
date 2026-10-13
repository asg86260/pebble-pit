// The feedback worker (DESIGN.md, "Feedback form", "Dev and checks"): a
// report taken and read back; the save route handing the blob back
// un-gzipped, and only to the owner; every refusal answered before a write;
// the ip's day, the worker's day, the byte ceiling taking the words and not
// the save, the kill switch; no column holding an ip; and the sweep's two
// ages.

import test from 'node:test';
import assert from 'node:assert/strict';
import { worker, saveB64, b64, dump, META, TOKEN, DAY, HOUR, GAME } from './kit.mjs';
import { gzip } from '../../src/gzip.js';
import {
  FEEDBACK_TEXT_MAX, FEEDBACK_BODY_MAX, FEEDBACK_SAVE_MAX, FEEDBACK_IP_DAY, FEEDBACK_DAY, FEEDBACK_BYTES_MAX,
  FEEDBACK_PAUSED_RETRY_S, FEEDBACK_SAVE_KEEP_D, FEEDBACK_REPORT_KEEP_D, FEEDBACK_FATAL_MAX
} from '../../src/config/feedback.js';
import { sweep } from '../src/sweep.js';

const reports = w => w.row('SELECT COUNT(*) AS n FROM reports').n;
const saves = w => w.row('SELECT COUNT(*) AS n FROM saves').n;

test('a report is taken and read back, with its facts and its save', async () => {
  const w = worker();
  const yard = { saveV: 19, stored: 5, boulder: 'abc', chips: [1, 2, 3] };
  const save = await saveB64(yard);
  const r = await w.report({ save, meta: { ...META, page: 'crashed', fatal: 'TypeError: w.route is undefined' } });
  assert.equal(r.status, 201);
  assert.deepEqual(r.json, { id: 1, save: true });
  assert.equal(r.headers.get('access-control-allow-origin'), GAME);
  const row = w.row('SELECT * FROM reports WHERE id = 1');
  assert.equal(row.text, 'the crew stand still');
  assert.equal(row.at, w.now);
  assert.equal(row.kind, null);
  assert.deepEqual([row.version, row.target, row.shell, row.os, row.lang, row.page, row.fatal],
    [META.version, 'itch', 'web', 'windows', 'en · followed', 'crashed', 'TypeError: w.route is undefined']);
  assert.equal(row.save_bytes, Buffer.from(save, 'base64').length);
  assert.equal(row.read_at, null);
  assert.equal(w.row('SELECT bytes FROM totals').bytes, row.save_bytes);
  // without a save, the row says so
  const r2 = await w.report({ text: 'only words' });
  assert.deepEqual(r2.json, { id: 2, save: false });
  assert.equal(w.row('SELECT save_bytes FROM reports WHERE id = 2').save_bytes, 0);
  assert.equal(saves(w), 1);
});

test('the save route hands the save back un-gzipped, to the owner alone', async () => {
  const w = worker();
  const yard = { saveV: 19, stored: 5, boulder: 'abc', name: 'ünïcode ✚' };
  await w.report({ save: await saveB64(yard) });
  const got = await w.call('GET', '/reports/1/save', { bearer: TOKEN, origin: null });
  assert.equal(got.status, 200);
  assert.equal(got.headers.get('content-type'), 'application/json');
  assert.deepEqual(JSON.parse(got.text), yard);
  assert.equal(got.text, JSON.stringify(yard), 'the JSON the store holds, byte for byte');
  assert.equal((await w.call('GET', '/reports/1/save', { origin: null })).status, 401);
  assert.equal((await w.call('GET', '/reports/1/save', { bearer: 'nope', origin: null })).status, 401);
  assert.equal((await w.call('GET', '/reports/2/save', { bearer: TOKEN, origin: null })).status, 404);
  const s = await w.call('GET', '/stats', { bearer: TOKEN, origin: null });
  assert.equal(s.status, 200);
  assert.equal(s.json.today, 1);
  assert.equal(s.json.reports, 1);
  assert.equal(s.json.unread, 1);
  assert.equal(s.json.saves, 1);
  assert.equal((await w.call('GET', '/stats', { origin: null })).status, 401);
  // A worker with no token set opens to nobody.
  const bare = worker({ token: '' });
  assert.equal((await bare.call('GET', '/stats', { bearer: 'x', origin: null })).status, 401);
});

test('every refusal of a report answers before a single statement runs', async () => {
  const w = worker();
  const notJson = await gzip('this is not json');
  const noV = await saveB64({ stored: 1 });
  const big = new Uint8Array(FEEDBACK_SAVE_MAX + 1);
  const cases = [
    ['another site', await w.report({}, { origin: 'https://evil.example' }), 403],
    ['no origin at all', await w.report({}, { origin: null }), 403],
    ['a declared body past the cap', await w.report({}, { headers: { 'content-length': String(FEEDBACK_BODY_MAX + 1) } }), 413],
    ['a body past the cap', await w.call('POST', '/reports', { body: JSON.stringify({ text: 'x'.repeat(FEEDBACK_BODY_MAX) }) }), 413],
    ['not JSON', await w.call('POST', '/reports', { body: '{nope' }), 400],
    ['no words', await w.report({ text: '' }), 400],
    ['only spaces', await w.report({ text: '   \n ' }), 400],
    ['too many words', await w.report({ text: 'x'.repeat(FEEDBACK_TEXT_MAX + 1) }), 400],
    ['words that are not a string', await w.report({ text: 42 }), 400],
    ['a save that is not base64', await w.report({ save: '!!!not base64!!!' }), 400],
    ['a save that is not gzip', await w.report({ save: b64(new TextEncoder().encode('{"saveV":1}')) }), 400],
    ['a save that is not JSON', await w.report({ save: b64(notJson) }), 400],
    ['a save with no saveV', await w.report({ save: noV }), 400],
    ['a save past the cap', await w.report({ save: b64(big) }), 413],
  ];
  for (const [what, r, want] of cases) assert.equal(r.status, want, what);
  assert.equal(w.counter.statements, 0, 'not one statement for any of them');
  assert.equal(reports(w), 0);
  // the longest words there may be are taken
  assert.equal((await w.report({ text: 'x'.repeat(FEEDBACK_TEXT_MAX) })).status, 201);
});

test('a fact that is not one of ours is dropped, the report still taken', async () => {
  const w = worker();
  const r = await w.report({ kind: 'words', meta: { version: 'v'.repeat(41), target: 'xbox', shell: 'web', os: 'beos', lang: 'de · chosen', page: 'game', fatal: 'f'.repeat(FEEDBACK_FATAL_MAX + 1), ua: 'Mozilla/5.0' } });
  assert.equal(r.status, 201);
  const row = w.row('SELECT * FROM reports');
  assert.deepEqual([row.kind, row.version, row.target, row.shell, row.os, row.lang, row.page, row.fatal],
    ['words', null, null, 'web', null, 'de · chosen', 'game', null]);
  assert.ok(!('ua' in row));
  assert.equal((await w.report({ kind: 'rant', meta: 'not an object' })).status, 201);
  assert.equal(w.row('SELECT kind, page FROM reports WHERE id = 2').kind, null);
});

test('an ip sends FEEDBACK_IP_DAY reports a day, and the next day more', async () => {
  const w = worker();
  for (let i = 0; i < FEEDBACK_IP_DAY; i++) assert.equal((await w.report()).status, 201);
  const held = await w.report();
  assert.equal(held.status, 429);
  assert.equal(+held.headers.get('retry-after'), 12 * 3600);
  assert.equal(held.headers.get('access-control-expose-headers'), 'retry-after');
  assert.equal(reports(w), FEEDBACK_IP_DAY);
  assert.equal((await w.report({}, { ip: '198.51.100.2' })).status, 201, 'another ip is not held');
  w.tick(DAY);
  assert.equal((await w.report()).status, 201, 'a new day, a new count');
});

test('the worker takes FEEDBACK_DAY reports a day from everybody', async () => {
  const w = worker();
  w.raw.prepare("UPDATE totals SET day = '2026-10-13', reports = ?").run(FEEDBACK_DAY - 1);
  assert.equal((await w.report()).status, 201);
  const full = await w.report({}, { ip: '198.51.100.3' });
  assert.equal(full.status, 503);
  assert.equal(+full.headers.get('retry-after'), 12 * 3600);
  assert.equal(reports(w), 1);
  w.tick(DAY);
  assert.equal((await w.report({}, { ip: '198.51.100.3' })).status, 201);
  assert.equal(w.row('SELECT reports FROM totals').reports, 1, 'the day count starts over');
});

test('past the byte ceiling the words are taken and the save is not', async () => {
  const w = worker();
  const save = await saveB64();
  w.raw.prepare('UPDATE totals SET bytes = ?').run(FEEDBACK_BYTES_MAX - 10);
  const r = await w.report({ save });
  assert.equal(r.status, 201);
  assert.deepEqual(r.json, { id: 1, save: false });
  assert.equal(saves(w), 0);
  assert.equal(w.row('SELECT save_bytes FROM reports').save_bytes, 0);
  assert.equal(w.row('SELECT bytes FROM totals').bytes, FEEDBACK_BYTES_MAX - 10);
});

test('paused, every route answers 503 before a statement; a preflight still passes', async () => {
  const w = worker({ paused: '1' });
  for (const [m, p, o] of [['POST', '/reports', {}], ['GET', '/stats', { bearer: TOKEN }], ['GET', '/reports/1/save', { bearer: TOKEN }], ['GET', '/health', {}]]) {
    const r = await w.call(m, p, { body: m === 'POST' ? { text: 'hi', meta: META } : undefined, ...o });
    assert.equal(r.status, 503, `${m} ${p}`);
    assert.equal(+r.headers.get('retry-after'), FEEDBACK_PAUSED_RETRY_S);
  }
  const pre = await w.call('OPTIONS', '/reports');
  assert.equal(pre.status, 204);
  assert.equal(pre.headers.get('access-control-allow-origin'), GAME);
  assert.equal(pre.headers.get('access-control-allow-headers'), 'authorization, content-type');
  assert.equal(w.counter.statements, 0);
});

test('no column holds an ip, and the day count keys on a pepper', async () => {
  const w = worker();
  const ip = '203.0.113.77';
  await w.report({}, { ip });
  await w.report({ save: await saveB64() }, { ip });
  assert.ok(!dump(w.raw).includes(ip), 'the ip is nowhere');
  const keys = w.rows('SELECT key FROM limits');
  assert.equal(keys.length, 1);
  // the same ip under another pepper is another key
  const w2 = worker({ pepper: 'pepper-b' });
  await w2.report({}, { ip });
  assert.notEqual(w2.row('SELECT key FROM limits').key, keys[0].key);
});

test('the sweep: a save goes after FEEDBACK_SAVE_KEEP_D days, a report after FEEDBACK_REPORT_KEEP_D, an ip count the next day', async () => {
  const w = worker();
  const save = await saveB64();
  await w.report({ save });
  const bytes = w.row('SELECT bytes FROM totals').bytes;
  assert.ok(bytes > 0);
  w.tick(HOUR);
  await w.report({ save, text: 'later' });
  w.tick(DAY);
  let s = await sweep(w.env, w.now);
  assert.equal(w.rows('SELECT * FROM limits').length, 0, 'yesterday\'s ip counts go');
  assert.equal(saves(w), 2);
  w.now = Date.UTC(2026, 9, 13, 12) + FEEDBACK_SAVE_KEEP_D * DAY + 1;
  s = await sweep(w.env, w.now);
  assert.equal(s.saves, 1, 'the first save, past its days');
  assert.equal(saves(w), 1);
  assert.equal(w.row('SELECT save_bytes FROM reports WHERE id = 1').save_bytes, 0);
  assert.ok(w.row('SELECT save_bytes FROM reports WHERE id = 2').save_bytes > 0);
  assert.equal(w.row('SELECT bytes FROM totals').bytes, bytes, 'the total loses the swept save\'s bytes');
  assert.equal((await w.call('GET', '/reports/1/save', { bearer: TOKEN, origin: null })).status, 404);
  assert.equal(reports(w), 2, 'the words stay');
  w.now = Date.UTC(2026, 9, 13, 12) + FEEDBACK_REPORT_KEEP_D * DAY + 1;
  s = await sweep(w.env, w.now);
  assert.equal(s.reports, 1);
  assert.deepEqual(w.rows('SELECT text FROM reports').map(r => r.text), ['later']);
  assert.equal(w.row('SELECT bytes FROM totals').bytes, 0);
  assert.match(s.line, /^feedback: \d{4}-\d\d-\d\d today 0\/500 bytes 0\/\d+ reports 1 unread 1$/);
});

test('the desk\'s pages, a dev server and the owner\'s domain may send; health answers', async () => {
  const w = worker();
  for (const origin of ['null', 'http://localhost:5173', 'https://graham-things.com', 'https://cameldash.itch.io']) {
    assert.equal((await w.report({}, { origin, ip: origin })).status, 201, origin);
  }
  assert.deepEqual((await w.call('GET', '/health', { origin: null })).json, { ok: true });
  assert.equal((await w.call('GET', '/nowhere', { origin: null })).status, 404);
});
