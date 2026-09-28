// The cloud's routes (docs/wave-cloud.md, "Routes"). `handle` is the whole
// worker as a function of the request, the bindings and the clock, so the
// worker's checks and the game's node checks run this same code in-process
// over cloud/test/d1.mjs.
//
// Every refusal here is safe to meet: the client treats it as the cloud
// being down and keeps saving locally. So the ceilings are checked before
// anything is written, and a write that passes them is one batch.

import {
  CLOUD_BLOB_MAX, CLOUD_BYTES_MAX, CLOUD_PUSH_FLOOR_S, CLOUD_VAULT_DAY_WRITES,
  CLOUD_DAY_WRITES, CLOUD_MINTS_IP_DAY, CLOUD_SECRET_LEN, CLOUD_PAIR_LEN,
  CLOUD_PAIR_S, CLOUD_PAIR_TRIES, CLOUD_PAIR_TRIES_S, CLOUD_PAIR_FAILS_HOUR,
  CLOUD_PAUSED_RETRY_S, CLOUD_YARD_ID_MAX, CLOUD_PAIR_DRAWS,
  CLOUD_CODE_TRIES, CLOUD_CODE_TRIES_S, CLOUD_ORIGINS, CLOUD_REFUSALS_COUNTED
} from '../../src/config/cloud.js';
import { SLOTS } from '../../src/config/saves.js';
import { draw, normalSecret, normalPair, showSecret, showPair, sha256hex, seal, unseal, sameSecret } from './codes.js';
import { SECOND_MS, HOUR_MS, DAY_MS, utcDay, nextMidnight, hourOf, secondsUntil } from './clock.js';

// A slot past SLOTS (config/saves.js, the game's own number) is a 404.
export { SLOTS };

// Where a request comes from, for the rate limits only, and only ever hashed.
const NO_IP = '0.0.0.0';

// The origin itself is added by `handle`, echoed back only for a page on
// CLOUD_ORIGINS.
const CORS = {
  'access-control-allow-methods': 'GET, POST, PUT, DELETE',
  'access-control-allow-headers': 'authorization, content-type, if-match, x-yard-id, x-played-s, x-save-v',
  // Without this a page on another origin cannot read the slot's rev or how
  // long to wait, and both are part of the answer.
  'access-control-expose-headers': 'x-rev, retry-after'
};

function reply(status, body = null, headers = {}) {
  const h = { ...CORS, ...headers };
  if (body === null) return new Response(null, { status, headers: h });
  if (body instanceof Uint8Array) return new Response(body, { status, headers: h });
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', ...h } });
}
const retry = (status, retryS, extra = {}) => reply(status, { retryS }, extra);

// D1 takes a blob as an ArrayBuffer; the adapter and D1 alike hand one back
// as something `new Uint8Array` reads.
const blob = u8 => u8.buffer.slice(u8.byteOffset, u8.byteOffset + u8.byteLength);

const meta = row => row && {
  rev: row.rev, yardId: row.yard_id, playedS: row.played_s, saveV: row.save_v, size: row.size, at: row.at
};

// The limit rows key on the ip and the day hashed together, so the table
// holds no ip and no row can be tied to one across days. The kind in front
// keeps the mint and claim counts apart.
async function ipKey(kind, request, now) {
  const ip = request.headers.get('cf-connecting-ip') || NO_IP;
  return `${kind}:${await sha256hex(ip + utcDay(now))}`;
}

// What the database keeps of a secret: its hash with the pepper mixed in,
// so a copy of the database alone cannot be searched for the codes, which
// at sixty bits could be. Changing the pepper therefore signs every device
// out -- as well as killing live pairings -- and is a last resort.
async function vaultHash(env, secret) {
  if (!env.PAIR_PEPPER) throw new Error('PAIR_PEPPER is not set');
  return sha256hex(env.PAIR_PEPPER + '/vault/' + secret);
}

async function vaultOf(request, env) {
  const m = /^Bearer\s+(.+)$/i.exec(request.headers.get('authorization') || '');
  const secret = m && normalSecret(m[1]);
  if (!secret) return null;
  const vault = await env.DB.prepare('SELECT * FROM vaults WHERE hash = ?').bind(await vaultHash(env, secret)).first();
  return vault && { vault, secret };
}

// A wrong code, of either kind: one more against this ip's tries in its
// window, and one more against the worker's hour.
function wrongCode(env, key, until, now) {
  const hour = hourOf(now);
  return env.DB.batch([
    env.DB.prepare(`INSERT INTO limits (key, until, n) VALUES (?, ?, 1) ON CONFLICT(key) DO UPDATE SET
        n = CASE WHEN until > ? THEN n + 1 ELSE 1 END, until = CASE WHEN until > ? THEN until ELSE ? END`)
      .bind(key, until, now, now, until),
    env.DB.prepare('UPDATE totals SET fails = CASE WHEN fail_hour = ? THEN fails + 1 ELSE 1 END, fail_hour = ? WHERE id = 1')
      .bind(hour, hour)
  ]);
}

// Whether this ip, or the worker as a whole, has had too many wrong codes
// to look up another: the answer to give, or null to go on.
async function tooManyWrong(env, key, tries, now) {
  const lim = await env.DB.prepare('SELECT until, n FROM limits WHERE key = ?').bind(key).first();
  if (lim && lim.until > now && lim.n >= tries) return retry(429, secondsUntil(lim.until, now));
  const hour = hourOf(now);
  const totals = await env.DB.prepare('SELECT fail_hour, fails FROM totals WHERE id = 1').first();
  if (totals.fail_hour === hour && totals.fails >= CLOUD_PAIR_FAILS_HOUR) {
    return retry(429, secondsUntil((hour + 1) * HOUR_MS, now));
  }
  return null;
}

// ---- routes ----------------------------------------------------------------

async function mintVault(request, env, now) {
  const key = await ipKey('mint', request, now);
  const lim = await env.DB.prepare('SELECT until, n FROM limits WHERE key = ?').bind(key).first();
  if (lim && lim.until > now && lim.n >= CLOUD_MINTS_IP_DAY) return retry(429, secondsUntil(lim.until, now));
  const secret = draw(CLOUD_SECRET_LEN);
  const until = nextMidnight(now);
  await env.DB.batch([
    env.DB.prepare('INSERT INTO vaults (id, hash, created, seen) VALUES (?, ?, ?, ?)')
      .bind(crypto.randomUUID(), await vaultHash(env, secret), now, now),
    env.DB.prepare(`INSERT INTO limits (key, until, n) VALUES (?, ?, 1) ON CONFLICT(key) DO UPDATE SET
        n = CASE WHEN until > ? THEN n + 1 ELSE 1 END, until = CASE WHEN until > ? THEN until ELSE ? END`)
      .bind(key, until, now, now, until)
  ]);
  return reply(201, { code: showSecret(secret) });
}

async function listSlots({ vault }, env, now) {
  const { results } = await env.DB.prepare('SELECT n, rev, yard_id, played_s, save_v, size, at FROM slots WHERE vault = ?')
    .bind(vault.id).all();
  const slots = Array.from({ length: SLOTS }, () => null);
  for (const r of results) if (r.n >= 1 && r.n <= SLOTS) slots[r.n - 1] = meta(r);
  // `seen` feeds only the 180-day sweep, so a day's precision is all it
  // needs and one write a day is all it costs.
  if (utcDay(vault.seen) !== utcDay(now)) {
    await env.DB.prepare('UPDATE vaults SET seen = ? WHERE id = ?').bind(now, vault.id).run();
  }
  return reply(200, { slots });
}

async function getSlot({ vault }, env, n) {
  const row = await env.DB.prepare('SELECT rev, body FROM slots WHERE vault = ? AND n = ?').bind(vault.id, n).first();
  if (!row) return reply(404, { error: 'no slot' });
  return reply(200, new Uint8Array(row.body), { 'content-type': 'application/gzip', 'x-rev': String(row.rev) });
}

const count = v => (v !== null && v !== '' && Number.isInteger(+v) && +v >= 0 ? +v : null);

async function putSlot(request, { vault }, env, n, now) {
  const declared = +request.headers.get('content-length');
  if (declared > CLOUD_BLOB_MAX) return reply(413, { max: CLOUD_BLOB_MAX });
  const body = new Uint8Array(await request.arrayBuffer());
  if (body.byteLength > CLOUD_BLOB_MAX) return reply(413, { max: CLOUD_BLOB_MAX });

  // A cleared slot is an empty body and has no yard to describe, so its
  // headers may be missing; a yard's may not.
  const cleared = body.byteLength === 0;
  const ifMatch = count(request.headers.get('if-match'));
  const yardId = request.headers.get('x-yard-id') ?? (cleared ? '' : null);
  const playedRaw = request.headers.get('x-played-s') ?? (cleared ? '0' : null);
  const playedS = playedRaw === null || playedRaw === '' ? NaN : +playedRaw;
  const saveV = count(request.headers.get('x-save-v') ?? (cleared ? '0' : null));
  if (ifMatch === null || yardId === null || yardId.length > CLOUD_YARD_ID_MAX || (!cleared && !yardId)
    || !Number.isFinite(playedS) || playedS < 0 || saveV === null) {
    return reply(400, { error: 'bad headers' });
  }

  const row = await env.DB.prepare('SELECT rev, yard_id, played_s, save_v, size, at FROM slots WHERE vault = ? AND n = ?')
    .bind(vault.id, n).first();
  const floorAt = row ? row.at + CLOUD_PUSH_FLOOR_S * SECOND_MS : 0;
  if (row && now < floorAt) return retry(429, secondsUntil(floorAt, now));

  const today = utcDay(now);
  const midnight = nextMidnight(now);
  if (vault.day === today && vault.day_writes >= CLOUD_VAULT_DAY_WRITES) return retry(429, secondsUntil(midnight, now));

  const totals = await env.DB.prepare('SELECT * FROM totals WHERE id = 1').first();
  if (totals.day === today && totals.writes >= CLOUD_DAY_WRITES) {
    const s = secondsUntil(midnight, now);
    return retry(503, s, { 'retry-after': String(s) });
  }

  if ((row ? row.rev : 0) !== ifMatch) return reply(412, { slot: meta(row) });

  const oldSize = row ? row.size : 0;
  if (totals.bytes - oldSize + body.byteLength > CLOUD_BYTES_MAX) return reply(507, { error: 'full' });

  // The checks above ran outside any transaction, so two writers from the
  // same base can both pass them. The slot's write is therefore conditional
  // itself -- it takes only if the row is still at the base -- and the two
  // counters are written only if it took (`changes()` is the statement
  // before), so the loser changes nothing and is answered 412 below.
  const rev = ifMatch + 1;
  const [slotRun] = await env.DB.batch([
    env.DB.prepare(`INSERT INTO slots (vault, n, rev, yard_id, played_s, save_v, size, at, body)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(vault, n) DO UPDATE SET
        rev = excluded.rev, yard_id = excluded.yard_id, played_s = excluded.played_s, save_v = excluded.save_v,
        size = excluded.size, at = excluded.at, body = excluded.body WHERE slots.rev = ?`)
      .bind(vault.id, n, rev, yardId, playedS, saveV, body.byteLength, now, blob(body), ifMatch),
    env.DB.prepare(`UPDATE vaults SET pushed = ?, seen = ?,
        day_writes = CASE WHEN day = ? THEN day_writes + 1 ELSE 1 END, day = ?
        WHERE id = ? AND changes() = 1`)
      .bind(now, now, today, today, vault.id),
    env.DB.prepare(`UPDATE totals SET bytes = bytes + ?,
        writes = CASE WHEN day = ? THEN writes + 1 ELSE 1 END, day = ?
        WHERE id = 1 AND changes() = 1`)
      .bind(body.byteLength - oldSize, today, today)
  ]);
  if (!slotRun.meta.changes) {
    const now2 = await env.DB.prepare('SELECT rev, yard_id, played_s, save_v, size, at FROM slots WHERE vault = ? AND n = ?')
      .bind(vault.id, n).first();
    return reply(412, { slot: meta(now2) });
  }
  return reply(200, { rev });
}

async function makePairing({ vault, secret }, env, now) {
  for (let i = 0; i < CLOUD_PAIR_DRAWS; i++) {
    const pair = draw(CLOUD_PAIR_LEN);
    const hash = await sha256hex(env.PAIR_PEPPER + pair);
    const { wrapped, iv } = await seal(env.PAIR_PEPPER, pair, secret);
    try {
      // One live pairing a vault: minting another kills the last. An expired
      // row that happens to hold the same hash goes too, before the cron would.
      await env.DB.batch([
        env.DB.prepare('DELETE FROM pairings WHERE vault = ? OR (hash = ? AND expires <= ?)').bind(vault.id, hash, now),
        env.DB.prepare('INSERT INTO pairings (hash, vault, expires, wrapped, iv) VALUES (?, ?, ?, ?, ?)')
          .bind(hash, vault.id, now + CLOUD_PAIR_S * SECOND_MS, blob(wrapped), blob(iv))
      ]);
      return reply(200, { pair: showPair(pair), expiresS: CLOUD_PAIR_S });
    } catch (err) {
      // Another vault's live code has this hash: draw again. Anything else
      // is the database in trouble, and goes to `handle`'s logged 500 rather
      // than being dressed up as a collision.
      if (!/UNIQUE/i.test(String(err?.message || err))) throw err;
    }
  }
  return reply(503, { error: 'try again' });
}

async function claimPairing(request, env, now) {
  const key = await ipKey('claim', request, now);
  const held = await tooManyWrong(env, key, CLOUD_PAIR_TRIES, now);
  if (held) return held;

  let asked = null;
  try { asked = (await request.json())?.pair; } catch { /* a body that is not JSON is a wrong claim */ }
  const pair = normalPair(asked);
  if (pair) {
    const hash = await sha256hex(env.PAIR_PEPPER + pair);
    const row = await env.DB.prepare('SELECT vault, expires, wrapped, iv FROM pairings WHERE hash = ?').bind(hash).first();
    if (row && row.expires > now) {
      const secret = await unseal(env.PAIR_PEPPER, pair, row.wrapped, row.iv);
      // Spent the moment it is read, so a code seen over a shoulder is dead
      // by the time it is typed a second time.
      const took = await env.DB.prepare('DELETE FROM pairings WHERE hash = ?').bind(hash).run();
      if (secret && took.meta.changes) return reply(200, { code: showSecret(secret) });
    }
  }

  await wrongCode(env, key, now + CLOUD_PAIR_TRIES_S * SECOND_MS, now);
  return reply(404, { error: 'no such code' });
}

async function rotateSecret({ vault }, env) {
  const secret = draw(CLOUD_SECRET_LEN);
  // A live pairing carries the old secret, which is about to stop working;
  // it goes with it, and the device that wanted it pairs again.
  await env.DB.batch([
    env.DB.prepare('UPDATE vaults SET hash = ? WHERE id = ?').bind(await vaultHash(env, secret), vault.id),
    env.DB.prepare('DELETE FROM pairings WHERE vault = ?').bind(vault.id)
  ]);
  return reply(200, { code: showSecret(secret) });
}

// Forgetting a vault is the same few statements the sweep runs for each of
// its vaults, so both keep the byte total honest the same way.
export function forgetVault(env, id) {
  return [
    env.DB.prepare('UPDATE totals SET bytes = bytes - (SELECT COALESCE(SUM(size), 0) FROM slots WHERE vault = ?) WHERE id = 1').bind(id),
    env.DB.prepare('DELETE FROM slots WHERE vault = ?').bind(id),
    env.DB.prepare('DELETE FROM pairings WHERE vault = ?').bind(id),
    env.DB.prepare('DELETE FROM vaults WHERE id = ?').bind(id)
  ];
}

async function deleteVault({ vault }, env) {
  await env.DB.batch(forgetVault(env, vault.id));
  return reply(204);
}

async function stats(request, env, now) {
  const token = /^Bearer\s+(.+)$/i.exec(request.headers.get('authorization') || '')?.[1];
  if (!env.STATS_TOKEN || !token || !(await sameSecret(token, env.STATS_TOKEN))) return reply(401, { error: 'no' });
  return reply(200, await statsOf(env, now));
}

// The owner's view, shared by `GET /stats` and the cron's log line.
export async function statsOf(env, now) {
  const totals = await env.DB.prepare('SELECT * FROM totals WHERE id = 1').first();
  const vaults = await env.DB.prepare('SELECT COUNT(*) AS n FROM vaults').first('n');
  const day = utcDay(now);
  const yesterday = utcDay(now - DAY_MS);
  const { results } = await env.DB.prepare('SELECT day, status, n FROM refusals WHERE day IN (?, ?)')
    .bind(day, yesterday).all();
  // Refusals by status, today's and yesterday's; a count at the cap means
  // "at least that many".
  const by = d => Object.fromEntries(results.filter(r => r.day === d).map(r => [r.status, r.n]));
  return {
    day,
    writes: totals.day === day ? totals.writes : 0,
    capWrites: CLOUD_DAY_WRITES,
    bytes: totals.bytes,
    capBytes: CLOUD_BYTES_MAX,
    vaults,
    refused: { today: by(day), yesterday: by(yesterday), countedTo: CLOUD_REFUSALS_COUNTED }
  };
}

// ---- the router --------------------------------------------------------------

async function route(request, env, now) {
  const { pathname } = new URL(request.url);
  const path = pathname.replace(/\/+$/, '') || '/';
  const m = request.method;

  if (m === 'GET' && path === '/health') return reply(200, { ok: true });
  if (m === 'GET' && path === '/stats') return stats(request, env, now);
  if (m === 'POST' && path === '/vaults') return mintVault(request, env, now);
  if (m === 'POST' && path === '/pairings/claim') return claimPairing(request, env, now);

  const slot = /^\/slots\/(\d+)$/.exec(path);
  const n = slot ? +slot[1] : 0;
  let handler = null;
  if (m === 'GET' && path === '/slots') handler = who => listSlots(who, env, now);
  else if (slot && n >= 1 && n <= SLOTS && m === 'GET') handler = who => getSlot(who, env, n);
  else if (slot && n >= 1 && n <= SLOTS && m === 'PUT') handler = who => putSlot(request, who, env, n, now);
  else if (m === 'POST' && path === '/pairings') handler = who => makePairing(who, env, now);
  else if (m === 'POST' && path === '/vaults/me/rotate') handler = who => rotateSecret(who, env);
  else if (m === 'DELETE' && path === '/vaults/me') handler = who => deleteVault(who, env);
  if (!handler) return reply(404, { error: 'no route' });

  // A secret is looked up only for an ip that has not been guessing: past
  // CLOUD_CODE_TRIES unknown ones in the window, or the worker's hour of
  // wrong codes, it is refused without a lookup.
  const key = await ipKey('code', request, now);
  const held = await tooManyWrong(env, key, CLOUD_CODE_TRIES, now);
  if (held) return held;
  const who = await vaultOf(request, env);
  if (!who) {
    await wrongCode(env, key, now + CLOUD_CODE_TRIES_S * SECOND_MS, now);
    return reply(401, { error: 'unknown code' });
  }
  return handler(who);
}

// Whether a browser on this page may call: CLOUD_ORIGINS, where `*` stands
// for one or more labels of a host or for any port, and `#` for one number
// of an address.
const escape = s => s.replace(/[.+?^${}()|[\]\\]/g, ch => '\\' + ch);
const pattern = p => new RegExp('^' + escape(p)
  .replace(/:\*$/, ':\\d+')
  .replace(/#/g, '\\d{1,3}')
  .replace(/\*/g, '[a-z0-9-]+(\\.[a-z0-9-]+)*') + '$', 'i');
const ORIGINS = CLOUD_ORIGINS.map(pattern);
export const originAllowed = o => ORIGINS.some(re => re.test(o));

export async function handle(request, env, now = Date.now()) {
  // A browser says which page is calling. One on a page that is not the
  // game's is refused before anything else runs, preflight or not; a request
  // with no Origin is not a browser's, and is left to the codes and the caps.
  const origin = request.headers.get('origin');
  let res;
  if (origin !== null && !originAllowed(origin)) {
    res = reply(403, { error: 'not from the game' });
  } else {
    res = await answer(request, env, now);
    if (origin !== null) {
      res.headers.set('access-control-allow-origin', origin);
      res.headers.set('vary', 'Origin');
    }
  }
  // A paused worker touches nothing, its own counts included.
  if (res.status >= 400 && res.status !== 412 && env.CLOUD_PAUSED !== '1') await noteRefusal(request, env, now, res.status, origin);
  return res;
}

// --- watching it ----------------------------------------------------------------
// A refusal the players never report -- a page the worker does not know, a
// cap met, a fault -- is only seen here. One log line for Workers Logs, and
// one more on today's count for /stats. The line names the route with the
// slot number folded away and the page it came from; never the code, never
// the ip. A 412 is not a refusal but the sync working, and is not counted.
const routeOf = request => {
  const path = new URL(request.url).pathname.replace(/\/slots\/\d+$/, '/slots/n').slice(0, 40);
  return `${request.method} ${path}`;
};
async function noteRefusal(request, env, now, status, origin) {
  console.log(JSON.stringify({ refused: status, route: routeOf(request), origin }));
  try {
    // Counted up to CLOUD_REFUSALS_COUNTED and then left: an update whose
    // WHERE fails writes no row, so a flood costs a bounded number of writes.
    await env.DB.prepare(`INSERT INTO refusals (day, status, n) VALUES (?, ?, 1)
        ON CONFLICT(day, status) DO UPDATE SET n = n + 1 WHERE n < ?`)
      .bind(utcDay(now), status, CLOUD_REFUSALS_COUNTED).run();
  } catch (err) {
    // The count is for watching; it never costs a player the answer.
    console.error('cloud: refusal count', err?.message || err);
  }
}

async function answer(request, env, now) {
  // A preflight touches nothing and must pass even when paused: a browser
  // that fails the preflight never sees the 503 or its Retry-After.
  if (request.method === 'OPTIONS') return reply(204);
  // The kill switch answers before anything else, D1 included: it is what
  // the owner reaches for when D1 itself is the trouble.
  if (env.CLOUD_PAUSED === '1') {
    return retry(503, CLOUD_PAUSED_RETRY_S, { 'retry-after': String(CLOUD_PAUSED_RETRY_S) });
  }
  try {
    return await route(request, env, now);
  } catch (err) {
    console.error('cloud:', err?.stack || err);
    return reply(500, { error: 'worker' });
  }
}
