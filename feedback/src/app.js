// The feedback worker's routes (DESIGN.md, "Feedback form", "The worker").
// `handle` is the whole worker as a function of the request, the bindings,
// the clock and the context that carries `waitUntil`, so the worker's checks and the game's node check run this
// same code in-process over feedback/test/d1.mjs.
//
// A report is checked whole before D1 is touched, and a report that passes
// is one batch. Every refusal is safe to meet: the form says the send did not
// go and keeps the words.

import {
  FEEDBACK_TEXT_MAX, FEEDBACK_SAVE_MAX, FEEDBACK_BODY_MAX, FEEDBACK_META_MAX, FEEDBACK_FATAL_MAX,
  FEEDBACK_IP_DAY, FEEDBACK_DAY, FEEDBACK_BYTES_MAX, FEEDBACK_PAUSED_RETRY_S,
  FEEDBACK_TARGETS, FEEDBACK_SHELLS, FEEDBACK_OSES, FEEDBACK_PAGES, FEEDBACK_KINDS
} from '../../src/config/feedback.js';
import { gunzip } from '../../src/gzip.js';
import { sha256hex, sameSecret } from '../../cloud/src/codes.js';
import { utcDay, nextMidnight, secondsUntil } from '../../cloud/src/clock.js';
import { originAllowed } from '../../cloud/src/app.js';
import { mailOn, notify } from './mail.js';

// Where a request comes from, for the day's cap only, and only ever hashed.
const NO_IP = '0.0.0.0';

const CORS = {
  'access-control-allow-methods': 'GET, POST',
  'access-control-allow-headers': 'authorization, content-type',
  'access-control-expose-headers': 'retry-after'
};

function reply(status, body = null, headers = {}) {
  const h = { ...CORS, ...headers };
  if (body === null) return new Response(null, { status, headers: h });
  if (typeof body === 'string') return new Response(body, { status, headers: { 'content-type': 'application/json', ...h } });
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', ...h } });
}
const retry = (status, retryS) => reply(status, { retryS }, { 'retry-after': String(retryS) });

// D1 takes a blob as an ArrayBuffer.
const blob = u8 => u8.buffer.slice(u8.byteOffset, u8.byteOffset + u8.byteLength);

// The counter's key: the ip, the day and the pepper, hashed together.
async function ipKey(request, env, now) {
  if (!env.IP_PEPPER) throw new Error('IP_PEPPER is not set');
  const ip = request.headers.get('cf-connecting-ip') || NO_IP;
  return sha256hex(`${env.IP_PEPPER}/${utcDay(now)}/${ip}`);
}

async function owner(request, env) {
  const token = /^Bearer\s+(.+)$/i.exec(request.headers.get('authorization') || '')?.[1];
  return !!env.FEEDBACK_TOKEN && !!token && (await sameSecret(token, env.FEEDBACK_TOKEN));
}

// --- reading a report ---------------------------------------------------------
// Each fact is one of its short list, or a short string; anything else is
// dropped rather than refused, so a build newer than the worker still lands.
const oneOf = list => v => (list.includes(v) ? v : null);
const short = max => v => (typeof v === 'string' && v.length > 0 && v.length <= max ? v : null);
const META = {
  version: short(FEEDBACK_META_MAX),
  target: oneOf(FEEDBACK_TARGETS),
  shell: oneOf(FEEDBACK_SHELLS),
  os: oneOf(FEEDBACK_OSES),
  lang: short(FEEDBACK_META_MAX),
  page: oneOf(FEEDBACK_PAGES),
  fatal: short(FEEDBACK_FATAL_MAX)
};
export const META_KEYS = Object.keys(META);

function metaOf(m) {
  const out = {};
  for (const k of META_KEYS) out[k] = m && typeof m === 'object' ? META[k](m[k]) : null;
  return out;
}

function fromBase64(s) {
  if (typeof s !== 'string' || !/^[A-Za-z0-9+/]*={0,2}$/.test(s)) return null;
  try {
    const bin = atob(s);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  } catch { return null; }
}

// A save is base64 of gzip of JSON with a numeric `saveV`: a shape, not the
// game's `isSave`, since the worker does not import the game. Loading it in
// the node yard is the real check. The answer is the gzip, or a refusal.
async function saveOf(b64) {
  const gz = fromBase64(b64);
  if (!gz || !gz.length) return { refused: reply(400, { error: 'not a save' }) };
  if (gz.length > FEEDBACK_SAVE_MAX) return { refused: reply(413, { max: FEEDBACK_SAVE_MAX }) };
  let s = null;
  try { s = JSON.parse(await gunzip(gz)); } catch {}
  if (!s || typeof s !== 'object' || typeof s.saveV !== 'number') return { refused: reply(400, { error: 'not a save' }) };
  return { gz };
}

// --- routes -----------------------------------------------------------------------

async function takeReport(request, env, now, ctx) {
  // From the game's page, or nothing: a report has no other door.
  const origin = request.headers.get('origin');
  if (origin === null || !originAllowed(origin)) return reply(403, { error: 'not from the game' });

  const declared = +request.headers.get('content-length');
  if (declared > FEEDBACK_BODY_MAX) return reply(413, { max: FEEDBACK_BODY_MAX });
  const raw = await request.text();
  if (raw.length > FEEDBACK_BODY_MAX) return reply(413, { max: FEEDBACK_BODY_MAX });
  let body = null;
  try { body = JSON.parse(raw); } catch {}
  if (!body || typeof body !== 'object') return reply(400, { error: 'not a report' });

  const text = typeof body.text === 'string' ? body.text : '';
  if (!text.trim() || text.length > FEEDBACK_TEXT_MAX) return reply(400, { error: 'words' });
  const kind = FEEDBACK_KINDS.includes(body.kind) ? body.kind : null;
  const meta = metaOf(body.meta);
  let gz = null;
  if (body.save != null) {
    const s = await saveOf(body.save);
    if (s.refused) return s.refused;
    gz = s.gz;
  }

  // The caps, before anything is written: this ip's day, then everybody's.
  const today = utcDay(now);
  const untilMidnight = secondsUntil(nextMidnight(now), now);
  const key = await ipKey(request, env, now);
  const mine = await env.DB.prepare('SELECT n FROM limits WHERE key = ? AND day = ?').bind(key, today).first('n');
  if (mine >= FEEDBACK_IP_DAY) return retry(429, untilMidnight);
  const totals = await env.DB.prepare('SELECT * FROM totals WHERE id = 1').first();
  if (totals.day === today && totals.reports >= FEEDBACK_DAY) return retry(503, untilMidnight);
  // Past the ceiling the words are still taken and the save is not.
  if (gz && totals.bytes + gz.length > FEEDBACK_BYTES_MAX) gz = null;

  const size = gz ? gz.length : 0;
  const writes = [
    env.DB.prepare(`INSERT INTO reports (at, kind, text, version, target, shell, os, lang, page, fatal, save_bytes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`)
      .bind(now, kind, text, meta.version, meta.target, meta.shell, meta.os, meta.lang, meta.page, meta.fatal, size),
    env.DB.prepare(`UPDATE totals SET bytes = bytes + ?,
        reports = CASE WHEN day = ? THEN reports + 1 ELSE 1 END, day = ? WHERE id = 1`)
      .bind(size, today, today),
    env.DB.prepare(`INSERT INTO limits (key, day, n) VALUES (?, ?, 1)
        ON CONFLICT(key) DO UPDATE SET n = n + 1`).bind(key, today)
  ];
  // The save rides the same batch, keyed on the row just written.
  if (gz) writes.splice(1, 0, env.DB.prepare('INSERT INTO saves (report_id, blob) VALUES (last_insert_rowid(), ?)').bind(blob(gz)));
  const [inserted] = await env.DB.batch(writes);
  const id = inserted.results[0].id;
  // The owner's mail goes after the answer, on the worker's own time: a slow
  // or failing mail never holds up or fails a report already stored.
  if (mailOn(env)) later(ctx, notify(env, { id, text, kind, meta, saveBytes: size }));
  return reply(201, { id, save: !!gz });
}

// `ctx.waitUntil` on Cloudflare; a caller with no ctx (the game's node check)
// lets the promise run on, which `notify` never lets reject.
function later(ctx, promise) {
  if (ctx && typeof ctx.waitUntil === 'function') ctx.waitUntil(promise);
}

async function getSave(request, env, id) {
  if (!(await owner(request, env))) return reply(401, { error: 'no' });
  const row = await env.DB.prepare('SELECT blob FROM saves WHERE report_id = ?').bind(id).first();
  if (!row) return reply(404, { error: 'no save' });
  // Un-gzipped here, so the file lands in test/fixtures as the store holds
  // it, with nothing to unpack.
  return reply(200, await gunzip(new Uint8Array(row.blob)));
}

async function stats(request, env, now) {
  if (!(await owner(request, env))) return reply(401, { error: 'no' });
  return reply(200, await statsOf(env, now));
}

// The owner's view, shared by `GET /stats` and the cron's log line.
export async function statsOf(env, now) {
  const totals = await env.DB.prepare('SELECT * FROM totals WHERE id = 1').first();
  const day = utcDay(now);
  const counts = await env.DB.prepare(
    'SELECT COUNT(*) AS reports, SUM(read_at IS NULL) AS unread, SUM(save_bytes > 0) AS saves FROM reports').first();
  return {
    day,
    today: totals.day === day ? totals.reports : 0,
    capToday: FEEDBACK_DAY,
    bytes: totals.bytes,
    capBytes: FEEDBACK_BYTES_MAX,
    reports: counts.reports,
    unread: counts.unread || 0,
    saves: counts.saves || 0
  };
}

async function route(request, env, now, ctx) {
  const { pathname } = new URL(request.url);
  const path = pathname.replace(/\/+$/, '') || '/';
  const m = request.method;
  if (m === 'GET' && path === '/health') return reply(200, { ok: true });
  if (m === 'POST' && path === '/reports') return takeReport(request, env, now, ctx);
  if (m === 'GET' && path === '/stats') return stats(request, env, now);
  const save = /^\/reports\/(\d+)\/save$/.exec(path);
  if (m === 'GET' && save) return getSave(request, env, +save[1]);
  return reply(404, { error: 'no route' });
}

export async function handle(request, env, now = Date.now(), ctx = null) {
  const origin = request.headers.get('origin');
  let res;
  // A page that is not the game's is refused before anything runs, preflight
  // or not; the owner's routes come with no Origin, from a terminal.
  if (origin !== null && !originAllowed(origin)) res = reply(403, { error: 'not from the game' });
  else res = await answer(request, env, now, ctx);
  if (origin !== null && originAllowed(origin)) {
    res.headers.set('access-control-allow-origin', origin);
    res.headers.set('vary', 'Origin');
  }
  // One line for Workers Logs a refusal: its status, route and page, never
  // the words or the ip.
  if (res.status >= 400) {
    const route = `${request.method} ${new URL(request.url).pathname.replace(/\/\d+\//, '/n/').slice(0, 40)}`;
    console.log(JSON.stringify({ refused: res.status, route, origin }));
  }
  return res;
}

async function answer(request, env, now, ctx) {
  // A preflight touches nothing and passes even when paused: a browser that
  // fails it never sees the 503 or its Retry-After.
  if (request.method === 'OPTIONS') return reply(204);
  // The kill switch answers before anything else, D1 included.
  if (env.FEEDBACK_PAUSED === '1') return retry(503, FEEDBACK_PAUSED_RETRY_S);
  try {
    return await route(request, env, now, ctx);
  } catch (err) {
    console.error('feedback:', err?.stack || err);
    return reply(500, { error: 'worker' });
  }
}
