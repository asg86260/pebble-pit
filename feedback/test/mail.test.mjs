// The owner's mail a report (DESIGN.md, "Feedback form"; feedback/src/mail.js):
// a stored report sends exactly one, with the id, the words and the facts and
// never the token; a refused report, a paused worker and a worker with no
// binding or no address send none; a mail that throws leaves the report a
// 201; and the words cannot reach past the subject into a header.

import test from 'node:test';
import assert from 'node:assert/strict';
import { worker, mailStub, saveB64, META, TOKEN, NOTIFY_TO, NOTIFY_FROM } from './kit.mjs';
import { FEEDBACK_MAIL_SUBJECT_MAX } from '../../src/config/feedback.js';

test('a stored report sends one mail: the id, the words, the facts, the save route, no token', async () => {
  const mail = mailStub();
  const w = worker({ mail });
  const words = 'the crew stand still by the quarry\nand will not walk\n\nsecond paragraph';
  const save = await saveB64();
  const r = await w.report({ text: words, save, meta: { ...META, page: 'crashed', fatal: 'TypeError: w.route is undefined' } });
  assert.equal(r.status, 201);
  await w.settle();
  assert.equal(mail.sent.length, 1);
  const m = mail.sent[0];
  assert.equal(m.to, NOTIFY_TO);
  assert.equal(m.from, NOTIFY_FROM);
  assert.equal(m.subject, 'report #1: the crew stand still by the quarry and will not walk second...');
  assert.ok(!('html' in m), 'plain text only');
  assert.ok(m.text.startsWith(words + '\n'), 'the words in full, first');
  for (const line of [
    'report: #1', `version: ${META.version}`, 'target: itch', 'shell: web', 'os: windows',
    `lang: ${META.lang}`, 'page: crashed', 'fatal: TypeError: w.route is undefined',
    `save: yes, ${Buffer.from(save, 'base64').length} bytes gzipped`, '/reports/1/save'
  ]) assert.ok(m.text.includes(line), line);
  assert.ok(!JSON.stringify(m).includes(TOKEN), 'the token is nowhere in the mail');

  // without a save the mail says so and names no route
  await w.report({ text: 'only words' });
  await w.settle();
  assert.equal(mail.sent.length, 2);
  assert.ok(mail.sent[1].text.includes('save: no'));
  assert.ok(!mail.sent[1].text.includes('/save'));
  assert.ok(!mail.sent[1].text.includes('fatal:'), 'no fatal line when there was none');
});

test('a refused report, a paused worker and a worker with no binding or address send nothing', async () => {
  const mail = mailStub();
  const w = worker({ mail });
  assert.equal((await w.report({ text: '' })).status, 400);
  assert.equal((await w.report({}, { origin: 'https://evil.example' })).status, 403);
  assert.equal((await w.report({ save: '!!!' })).status, 400);
  await w.settle();
  assert.equal(mail.sent.length, 0);

  const paused = worker({ mail, paused: '1' });
  assert.equal((await paused.report()).status, 503);
  await paused.settle();
  assert.equal(mail.sent.length, 0);

  for (const drop of ['NOTIFY_TO', 'MAIL', 'NOTIFY_FROM']) {
    const bare = worker({ mail });
    delete bare.env[drop];
    assert.equal((await bare.report()).status, 201, drop);
    assert.equal(bare.pending.length, 0, `nothing waits without ${drop}`);
  }
  assert.equal(mail.sent.length, 0);
});

test('a mail that throws still leaves the report a 201, stored', async () => {
  const w = worker({ mail: mailStub({ fails: true }) });
  const r = await w.report();
  assert.equal(r.status, 201);
  assert.deepEqual(r.json, { id: 1, save: false });
  const outcomes = await w.settle();
  assert.deepEqual(outcomes, [false], 'the promise handed to waitUntil resolves, never rejects');
  assert.equal(w.row('SELECT COUNT(*) AS n FROM reports').n, 1);
});

test('the words cannot open a header: the subject is one line, cut short', async () => {
  const mail = mailStub();
  const w = worker({ mail });
  const evil = 'hi\r\nBcc: victim@example.com\r\nContent-Type: text/html\n X-Evil: 1\u0000 tail';
  await w.report({ text: evil });
  await w.report({ text: 'y'.repeat(500) });
  await w.settle();
  const [a, b] = mail.sent;
  assert.doesNotMatch(a.subject, /[\p{Cc}\p{Zl}\p{Zp}]/u);
  assert.equal(a.subject, 'report #1: hi Bcc: victim@example.com Content-Type: text/html X-Evil: 1...');
  assert.deepEqual(Object.keys(a).sort(), ['from', 'subject', 'text', 'to'], 'no field the words chose');
  assert.equal(a.to, NOTIFY_TO);
  assert.equal(b.subject, `report #2: ${'y'.repeat(FEEDBACK_MAIL_SUBJECT_MAX)}...`);
});
