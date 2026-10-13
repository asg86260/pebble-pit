// What every feedback check shares: a worker over a fresh in-memory D1, real
// `Request`s into the real `handle`, and a clock the check turns itself.

import { makeD1 } from './d1.mjs';
import { handle } from '../src/app.js';
import { gzip } from '../../src/gzip.js';

// Noon UTC, so a check has half a day either side before a day cap turns.
export const NOON = Date.UTC(2026, 9, 13, 12);
export const MIN = 60 * 1000;
export const HOUR = 60 * MIN;
export const DAY = 24 * HOUR;
// A page the worker answers: an itch host, as the web game is served.
export const GAME = 'https://html-classic.itch.zone';
export const TOKEN = 'owner-token';

export function worker({ pepper = 'pepper-a', token = TOKEN, paused } = {}) {
  const d1 = makeD1();
  const env = { DB: d1.DB, IP_PEPPER: pepper, FEEDBACK_TOKEN: token };
  if (paused) env.FEEDBACK_PAUSED = paused;
  let now = NOON;
  const w = {
    env, counter: d1.counter, raw: d1.raw,
    get now() { return now; },
    set now(t) { now = t; },
    tick(ms) { now += ms; },
    // One request. A plain object body goes as JSON, a string as it is.
    async call(method, path, { body, headers = {}, ip = '203.0.113.7', origin = GAME, bearer } = {}) {
      const h = { 'cf-connecting-ip': ip, ...headers };
      if (origin != null) h.origin = origin;
      if (bearer) h.authorization = `Bearer ${bearer}`;
      let b = body;
      if (body != null && typeof body !== 'string') { b = JSON.stringify(body); h['content-type'] = 'application/json'; }
      const res = await handle(new Request(`https://feedback.test${path}`, { method, headers: h, body: b }), env, now);
      const text = await res.text();
      let json = null;
      if ((res.headers.get('content-type') || '').includes('json') && text) json = JSON.parse(text);
      return { status: res.status, headers: res.headers, json, text };
    },
    // A report as the form sends one.
    report(body = {}, opts = {}) {
      return w.call('POST', '/reports', { body: { text: 'the crew stand still', meta: META, ...body }, ...opts });
    },
    row: (sql, ...a) => d1.raw.prepare(sql).get(...a),
    rows: (sql, ...a) => d1.raw.prepare(sql).all(...a)
  };
  return w;
}

export const META = { version: '0.9.14 · 3f2a9c1', target: 'itch', shell: 'web', os: 'windows', lang: 'en · followed', page: 'game' };

// A save's shape as the form sends it: JSON with a `saveV`, gzipped, base64.
export const b64 = bytes => Buffer.from(bytes).toString('base64');
export async function saveB64(obj = { saveV: 19, stored: 1, boulder: 'x' }) {
  return b64(await gzip(JSON.stringify(obj)));
}

// Everything the database holds, as one string, for the check that no column
// holds an ip.
export function dump(raw) {
  const out = [];
  for (const { name } of raw.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all()) {
    for (const row of raw.prepare(`SELECT * FROM ${name}`).all()) {
      for (const v of Object.values(row)) {
        if (v instanceof Uint8Array) out.push(Buffer.from(v).toString('latin1'));
        else out.push(String(v));
      }
    }
  }
  return out.join('\n');
}
