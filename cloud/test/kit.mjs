// What every cloud check shares: a worker over a fresh in-memory D1, real
// `Request`s into the real `handle`, and a clock the check turns itself.

import { makeD1 } from './d1.mjs';
import { handle } from '../src/app.js';

// Noon UTC, so a check has half a day either side before a day cap turns.
export const NOON = Date.UTC(2026, 8, 27, 12);
export const MIN = 60 * 1000;
export const HOUR = 60 * MIN;
export const DAY = 24 * HOUR;

export function worker({ pepper = 'pepper-a', stats = 'owner-token', paused } = {}) {
  const d1 = makeD1();
  const env = { DB: d1.DB, PAIR_PEPPER: pepper, STATS_TOKEN: stats };
  if (paused) env.CLOUD_PAUSED = paused;
  let now = NOON;
  const w = {
    env, counter: d1.counter, raw: d1.raw,
    get now() { return now; },
    set now(t) { now = t; },
    tick(ms) { now += ms; },
    // One request. `secret` rides as the bearer; a plain object body goes as
    // JSON, a Uint8Array as bytes.
    async call(method, path, { secret, body, headers = {}, ip = '203.0.113.7' } = {}) {
      const h = { 'cf-connecting-ip': ip, ...headers };
      if (secret) h.authorization = `Bearer ${secret}`;
      let b = body;
      if (body && !(body instanceof Uint8Array)) { b = JSON.stringify(body); h['content-type'] = 'application/json'; }
      const res = await handle(new Request(`https://cloud.test${path}`, { method, headers: h, body: b }), env, now);
      const bytes = new Uint8Array(await res.arrayBuffer());
      let json = null;
      if ((res.headers.get('content-type') || '').includes('json')) json = JSON.parse(new TextDecoder().decode(bytes));
      return { status: res.status, headers: res.headers, json, bytes };
    },
    async mint(ip) {
      const r = await w.call('POST', '/vaults', { ip });
      return r.json.code;
    },
    // A push as the game makes one: the base rev and the yard's three facts.
    put(secret, n, body, { rev = 0, yardId = 'yard-1', playedS = 100, saveV = 7, headers = {} } = {}) {
      return w.call('PUT', `/slots/${n}`, {
        secret, body,
        headers: { 'if-match': String(rev), 'x-yard-id': yardId, 'x-played-s': String(playedS), 'x-save-v': String(saveV), ...headers }
      });
    },
    row: (sql, ...a) => d1.raw.prepare(sql).get(...a),
    rows: (sql, ...a) => d1.raw.prepare(sql).all(...a)
  };
  return w;
}

export const bytes = n => {
  const b = new Uint8Array(n);
  for (let i = 0; i < n; i++) b[i] = (i * 31 + 7) & 255;
  return b;
};

// Everything the database holds, as one string: text as is, blobs as both
// hex and latin-1, so a code stored in any shape would show up in it.
export function dump(raw) {
  const out = [];
  for (const { name } of raw.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all()) {
    for (const row of raw.prepare(`SELECT * FROM ${name}`).all()) {
      for (const v of Object.values(row)) {
        if (v instanceof Uint8Array) out.push(Buffer.from(v).toString('hex'), Buffer.from(v).toString('latin1'));
        else out.push(String(v));
      }
    }
  }
  return out.join('\n').toUpperCase();
}
