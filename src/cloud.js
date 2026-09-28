// Cloud saves, the game's side (DESIGN.md, "Cloud saves: a sync code and a
// worker"; docs/wave-cloud.md, "src/cloud.js"). The only module that talks to
// the worker.
//
// The cloud is a mirror, not the store. The yard reads and writes its own
// store exactly as it did before this file existed; what is here is pulled
// once at boot, inside CLOUD_BOOT_MS, and pushed behind the yard on a pump
// the page turns. Every refusal, timeout and bug in here ends the same way:
// the yard plays and saves locally as if the cloud were down. So nothing here
// throws into the game, and a build with no cloud (`cloudReady()` false) finds
// every export inert.
//
// What this device knows about the cloud is one blob under
// `boulder-clicker/cloud` (save.js): the secret, and per slot the `rev` it
// last agreed with the cloud on (its *base*) and the `playedS` of the copy
// they agreed on (`-1` for a slot agreed empty). Everything else -- when a
// slot is next due, the backoff, which slots have stopped and why -- is this
// session's and starts over with the page.

import { S } from './state.js';
import { SLOTS, openSlot, slotRaw, writeSlot, savePrevOf, onSaved, isSave, cloudRaw, setCloudRaw } from './save.js';
import { since } from './slots.js';
import { SAVE_V } from './config/saves.js';
import {
  CLOUD_URL, CLOUD_BOOT_MS, CLOUD_TIMEOUT_MS, CLOUD_PUSH_S, CLOUD_PUSH_FLOOR_S, CLOUD_PUSH_HOUR_MAX,
  CLOUD_BACKOFF_MAX_S, CLOUD_KEEPALIVE_MAX, CLOUD_BLOB_MAX, CLOUD_SECRET_LEN, CLOUD_PAIR_LEN,
  CLOUD_ALPHABET, YARD_ID_LEN, CLOUD_SECRET_PREFIX
} from './config/cloud.js';

// --- where the worker is ------------------------------------------------------
// The checks point the yard at the real worker's `handle`, in-process, with
// these two (`__cloudUrl`, `__cloudFetch`); a build's answer is the constant.
let url = CLOUD_URL;
let fetchFn = null;
export const setCloudUrl = u => { url = u || ''; };
export const setCloudFetch = fn => { fetchFn = typeof fn === 'function' ? fn : null; };

// The title's picture and the scene bench are pages standing a yard nobody
// owns; a staged yard the same. None of them is a device the player linked.
function framed() {
  try {
    const q = new URLSearchParams(globalThis.location?.search || '');
    return q.has('demo') || q.has('bench');
  } catch { return false; }
}
export function cloudReady() {
  try {
    return !!url && !S.staged && !framed() && typeof (fetchFn || globalThis.fetch) === 'function';
  } catch { return false; }
}

// --- codes --------------------------------------------------------------------
function draw(n) {
  const b = new Uint8Array(n);
  try { crypto.getRandomValues(b); }
  catch { for (let i = 0; i < n; i++) b[i] = Math.floor(Math.random() * 256); }
  let s = '';
  for (const x of b) s += CLOUD_ALPHABET[x & 31];
  return s;
}
// A new yard's name (persist.js, and the migration for a yard from before).
export const mintYardId = () => draw(YARD_ID_LEN);

// A code as it was typed, as the worker reads it: the characters a hand
// confuses folded together, the dashes and the prefix dropped. The prefix goes
// before the fold, because PEBBLE has an L in it.
export function normalize(code) {
  let c = String(code || '').toUpperCase().replace(/[\s-]/g, '');
  if (c.length === CLOUD_SECRET_PREFIX.length + CLOUD_SECRET_LEN && c.startsWith(CLOUD_SECRET_PREFIX))
    c = c.slice(CLOUD_SECRET_PREFIX.length);
  return c.replace(/O/g, '0').replace(/[IL]/g, '1');
}
const inGroups = (c, n) => (c.match(new RegExp(`.{1,${n}}`, 'g')) || []).join('-');

// --- what this device knows -----------------------------------------------------
function facts() {
  try {
    const f = JSON.parse(cloudRaw() || 'null');
    if (f && typeof f.secret === 'string' && f.secret)
      return { secret: f.secret, base: f.base || {}, pushed: f.pushed || {}, at: Number.isFinite(f.at) ? f.at : null };
  } catch {}
  return null;
}
function keep(f) {
  try { setCloudRaw(f ? JSON.stringify(f) : null); } catch {}
}

// This session's: what is dirty and when it is due, the backoff, the hour's
// pushes, and every slot that has stopped and why. `playing` is whether a yard
// is running on this page (the pump turns only where one is): a newer copy of
// the open slot is then a question for the player, never a write under a yard
// that would put itself back over it a second later.
function fresh(playing = false) {
  return {
    playing,
    dirty: new Set(Array.from({ length: SLOTS }, (_, i) => i + 1)),
    due: {}, last: {},
    holdUntil: 0, wait: CLOUD_PUSH_S,
    sent: [], capped: false,
    stop: {},          // n -> 'big' | 'full' | 'behind' | 'newer'
    ahead: {},         // n -> the cloud's meta, for a slot behind another device
    clash: new Map(),  // n -> { raw, s, rev }: two yards, the player to choose
    trouble: null,     // 'offline' | 'paused' | null, from the last call
    recheck: false,    // the boot's comparison has still to be made
    pair: null
  };
}
let session = fresh();
onSaved(n => { session.dirty.add(n); });

// One thing at a time: the pump, the boot and the buttons all read the facts,
// wait on the network and write the facts back, and two of them interleaved
// would each write back a copy the other had not seen.
let chain = Promise.resolve();
let queued = 0;
function serial(fn) {
  queued++;
  const p = chain.then(fn).catch(() => null).finally(() => { queued--; });
  chain = p;
  return p;
}

// --- the wire -----------------------------------------------------------------
// One shape for every call: a timeout, and `{ status: 0 }` for anything that is
// not an answer. A refusal's wait is read from `Retry-After` or the body's
// `retryS`, whichever is longer.
async function call(method, path, { secret, body, headers = {}, keepalive = false, bytes = false } = {}) {
  const ctl = typeof AbortController === 'function' ? new AbortController() : null;
  let timer = null;
  const h = { ...headers };
  if (secret) h.authorization = 'Bearer ' + secret;
  let payload = body;
  if (body !== undefined && !(body instanceof Uint8Array)) {
    h['content-type'] = 'application/json';
    payload = JSON.stringify(body);
  }
  try {
    const go = (fetchFn || globalThis.fetch)(url.replace(/\/$/, '') + path,
      { method, headers: h, body: payload, keepalive, signal: ctl?.signal });
    const late = new Promise((_, no) => {
      timer = setTimeout(() => { try { ctl?.abort(); } catch {} no(new Error('timeout')); }, CLOUD_TIMEOUT_MS);
    });
    const r = await Promise.race([go, late]);
    const out = { status: r.status, retryS: 0, data: null };
    const after = +r.headers.get('retry-after');
    if (Number.isFinite(after) && after > 0) out.retryS = after;
    out.rev = +r.headers.get('x-rev') || 0;
    if (bytes && r.ok) out.bytes = new Uint8Array(await Promise.race([r.arrayBuffer(), late]));
    else { try { out.data = await Promise.race([r.json(), late]); } catch {} }
    if (Number.isFinite(out.data?.retryS)) out.retryS = Math.max(out.retryS, out.data.retryS);
    return out;
  } catch {
    return { status: 0, retryS: 0, data: null };
  } finally {
    if (timer) clearTimeout(timer);
  }
}

// A slot goes up gzipped: a busy yard is a few kilobytes that way.
async function pipe(data, stream) {
  return new Uint8Array(await new Response(new Blob([data]).stream().pipeThrough(stream)).arrayBuffer());
}
export const gzip = raw => pipe(new TextEncoder().encode(raw), new CompressionStream('gzip'));
const gunzip = async b => (b.length ? new TextDecoder().decode(await pipe(b, new DecompressionStream('gzip'))) : '');

// --- reading a slot ---------------------------------------------------------------
const playedOf = s => (Number.isFinite(+s?.playedS) ? +s.playedS : 0);
function parse(raw) {
  if (!raw) return null;
  try { const s = JSON.parse(raw); return isSave(s) ? s : null; } catch { return null; }
}
function local(n) {
  const raw = slotRaw(n) || null;
  return { raw, s: parse(raw) };
}
// A copy as the saves page says a yard (slots.js, `slotLabels`), less the
// slot's number: the conflict pane puts `this device` or `cloud` there.
function lineOf(s, now = Date.now()) {
  if (!s) return 'empty';
  const parts = [`rock ${s.boulderNo || 1}`, `${s.crew || 0} crew`];
  if (Number.isFinite(s.savedAt)) parts.push(since(s.savedAt, now));
  return parts.join(' · ');
}

// The cloud's copy of a slot: `{ raw, rev }`, `raw` '' for a cleared or absent
// slot, or null when the cloud could not be asked.
async function fetchSlot(n, secret) {
  const r = await call('GET', `/slots/${n}`, { secret, bytes: true });
  if (r.status === 404) return { raw: '', rev: 0 };
  if (r.status !== 200) { note(r); return null; }
  try { return { raw: await gunzip(r.bytes || new Uint8Array(0)), rev: r.rev }; } catch { return null; }
}

// What a refusal says about the cloud as a whole, for the status line.
function note(r) {
  if (r.status === 401) { forget(); return; }
  session.trouble = !r.status || r.status >= 500 && r.status !== 503 ? 'offline'
                  : r.status === 429 || r.status === 503 ? 'paused' : session.trouble;
}
// The secret is dead: rotated away on another device, or the vault deleted.
// This device is off again, and its yards are exactly as they were.
function forget() {
  keep(null);
  session = fresh(session.playing);
}

// The page is running the open slot and the cloud has a newer copy of it the
// player took: the yard stands aside (the autosave stops) and the page starts
// again on the copy now in the store.
function reboot() {
  S.yielded = true;
  try { globalThis.location?.reload?.(); } catch {}
}

// --- the comparison (DESIGN.md, "The sync") --------------------------------------
// One slot against the cloud's meta for it. `ctx.late` is set once the boot
// has stopped waiting: from then on this pass writes nothing, and the pump
// makes it again with the yard running.
async function agreeSlot(n, m, f, ctx) {
  if (ctx.late) return;
  const here = local(n);
  const base = f.base[n], pushed = f.pushed[n];
  const live = session.playing && n === openSlot();
  delete session.stop[n]; delete session.ahead[n]; session.clash.delete(n);
  // The cloud has never held this slot: whatever is here goes up.
  if (!m) {
    delete f.base[n];
    if (here.s) session.dirty.add(n);
    return;
  }
  // A copy this build cannot read: neither taken nor pushed over.
  if (+m.saveV > SAVE_V) { session.stop[n] = 'newer'; return; }
  const agreed = base != null && base === m.rev;
  if (!m.size) {
    // Cleared in the cloud. By the device that had this yard, since this one
    // last agreed with it, and nothing played here since: cleared here too.
    if (!here.raw) { f.base[n] = m.rev; f.pushed[n] = -1; return; }
    if (!agreed && base != null && here.s && pushed === playedOf(here.s)) {
      if (live) { session.stop[n] = 'behind'; session.ahead[n] = m; return; }
      savePrevOf(n, here.raw);
      writeSlot(n, '');
      f.base[n] = m.rev; f.pushed[n] = -1;
      return;
    }
    // Otherwise the yard here is the one to keep, and it goes up over the clear.
    f.base[n] = m.rev;
    session.dirty.add(n);
    return;
  }
  if (!here.raw) {
    // Cleared here since the two agreed on a yard: the clear goes up.
    if (agreed && pushed != null && pushed !== -1) { session.dirty.add(n); return; }
    await take(n, m, f, ctx, here);
    return;
  }
  if (!here.s) { await take(n, m, f, ctx, here); return; }
  if (here.s.yardId === m.yardId) {
    // One yard at two points: the longer is the newer.
    if (+m.playedS > playedOf(here.s)) {
      if (live) { session.stop[n] = 'behind'; session.ahead[n] = m; return; }
      await take(n, m, f, ctx, here);
      return;
    }
    f.base[n] = m.rev;
    session.dirty.add(n);
    return;
  }
  // Two yards. This device put its own new yard over the one they had agreed
  // on: it goes up. Otherwise the player chooses, and nothing is written until
  // they have.
  if (agreed) { session.dirty.add(n); return; }
  const got = await fetchSlot(n, f.secret);
  if (ctx.late) return;
  if (!got) { session.recheck = true; return; }
  const s = parse(got.raw);
  // A cloud copy that will not read is not a yard to choose: the one here
  // stays and goes up over it.
  if (!s) { f.base[n] = got.rev || m.rev; session.dirty.add(n); return; }
  session.clash.set(n, { raw: got.raw, s, rev: got.rev || m.rev });
}

// The cloud's copy into the store: through `isSave` like any other blob, the
// copy here to `.prev` first.
async function take(n, m, f, ctx, here) {
  const got = await fetchSlot(n, f.secret);
  if (ctx.late) return false;
  if (!got) { session.recheck = true; return false; }
  const s = parse(got.raw);
  if (!s) {
    // Never written. A yard here goes up over the copy that would not read.
    if (here.s) { f.base[n] = got.rev || m.rev; session.dirty.add(n); }
    return false;
  }
  if (+s.saveV > SAVE_V) { session.stop[n] = 'newer'; return false; }
  if (here.raw) savePrevOf(n, here.raw);
  writeSlot(n, got.raw);
  f.base[n] = got.rev || m.rev;
  f.pushed[n] = playedOf(s);
  session.dirty.delete(n);
  return true;
}

// `GET /slots` and every slot against it. Whether the cloud answered.
async function agree(f, ctx) {
  const r = await call('GET', '/slots', { secret: f.secret });
  if (ctx.late) return false;
  if (r.status !== 200 || !Array.isArray(r.data?.slots)) { note(r); session.recheck = true; return false; }
  for (let n = 1; n <= SLOTS; n++) await agreeSlot(n, r.data.slots[n - 1] || null, f, ctx);
  if (ctx.late) return false;
  if (!session.recheck) session.trouble = null;
  if (facts()?.secret === f.secret) keep(f);
  return true;
}

// --- boot -------------------------------------------------------------------------
// After `primeStore`, before `restore`. Never longer than CLOUD_BOOT_MS: past
// it the local yard boots, this pass writes nothing more, and the pump makes
// the comparison again in the background.
export async function cloudBoot() {
  session = fresh();
  chain = Promise.resolve();
  if (!cloudReady()) return;
  const f = facts();
  if (!f) return;
  const ctx = { late: false };
  let timer = null;
  const work = serial(() => agree(f, ctx));
  const late = new Promise(r => { timer = setTimeout(r, CLOUD_BOOT_MS); });
  const won = await Promise.race([work.then(() => 'done'), late.then(() => 'late')]);
  clearTimeout(timer);
  if (won === 'late') {
    ctx.late = true;
    session.recheck = true;
    session.trouble = 'offline';
  }
}

// --- pushing ----------------------------------------------------------------------
function backoff(now, retryS) {
  session.wait = Math.min(session.wait * 2, CLOUD_BACKOFF_MAX_S);
  session.holdUntil = now + Math.max(session.wait, retryS || 0) * 1000;
}

// One slot up, if it has moved since the cloud and this device last agreed.
// Answers 'hold' when nothing more should go this pass.
async function pushSlot(n, f, now, keepalive = false) {
  const here = local(n);
  let yard = '', played = -1, v = SAVE_V;
  if (here.raw) {
    if (!here.s) { session.dirty.delete(n); return 'skip'; }
    played = playedOf(here.s);
    yard = String(here.s.yardId || '');
    v = Number.isFinite(+here.s.saveV) ? +here.s.saveV : SAVE_V;
    if (f.pushed[n] === played) { session.dirty.delete(n); return 'same'; }
  } else if (f.pushed[n] == null || f.pushed[n] === -1) {
    session.dirty.delete(n);
    return 'same';
  }
  const body = here.raw ? await gzip(here.raw) : new Uint8Array(0);
  // Measured before it is sent: over the worker's cap is a save's size bug,
  // and the slot stays local rather than try.
  if (body.length > CLOUD_BLOB_MAX) { session.stop[n] = 'big'; return 'skip'; }
  if (keepalive && body.length >= CLOUD_KEEPALIVE_MAX) return 'skip';
  // The hour's pushes: a healthy one is sixty and a few page hides, so past
  // the cap this session is looping, and stops.
  session.sent = session.sent.filter(t => now - t < 3600e3);
  if (session.sent.length >= CLOUD_PUSH_HOUR_MAX) { session.capped = true; return 'hold'; }
  session.sent.push(now);
  session.last[n] = now;
  session.due[n] = now + CLOUD_PUSH_S * 1000;
  const r = await call('PUT', `/slots/${n}`, {
    secret: f.secret, body, keepalive,
    headers: {
      'if-match': String(f.base[n] || 0),
      'x-yard-id': yard,
      'x-played-s': String(Math.max(0, Math.floor(played))),
      'x-save-v': String(v)
    }
  });
  if (facts()?.secret !== f.secret) return 'hold';        // stopped or rotated meanwhile
  if (r.status === 200) {
    f.base[n] = +r.data?.rev || (f.base[n] || 0) + 1;
    f.pushed[n] = here.raw ? played : -1;
    f.at = now;
    keep(f);
    session.wait = CLOUD_PUSH_S;
    session.trouble = null;
    session.dirty.delete(n);
    return 'ok';
  }
  if (r.status === 412) {
    const m = r.data?.slot || null;
    if (m && here.s && m.yardId === yard && +m.saveV <= SAVE_V) {
      // Another device is ahead on this yard: this one stops and asks.
      if (+m.playedS > Math.floor(played)) { session.stop[n] = 'behind'; session.ahead[n] = m; return 'next'; }
      // This one is ahead of whatever moved the cloud: its base catches up and
      // it goes again on the next pass.
      f.base[n] = m.rev;
      keep(f);
      session.due[n] = now;
      return 'next';
    }
    await agreeSlot(n, m, f, { late: false });
    keep(f);
    return 'next';
  }
  if (r.status === 413) { session.stop[n] = 'big'; return 'next'; }
  if (r.status === 507) { session.stop[n] = 'full'; return 'next'; }
  note(r);
  if (r.status === 401) return 'hold';
  backoff(now, r.retryS);
  return 'hold';
}

async function pumpNow(now, keepalive = false) {
  let f = facts();
  if (!f || session.capped || now < session.holdUntil) return;
  if (session.recheck && !keepalive) {
    session.recheck = false;
    if (!(await agree(f, { late: false }))) { backoff(now, 0); return; }
    f = facts();
    if (!f) return;
  }
  for (let n = 1; n <= SLOTS; n++) {
    if (!session.dirty.has(n) || session.stop[n] || session.clash.has(n)) continue;
    if (keepalive ? now - (session.last[n] ?? -Infinity) < CLOUD_PUSH_FLOOR_S * 1000
                  : now < (session.due[n] || 0)) continue;
    if (await pushSlot(n, f, now, keepalive) === 'hold') break;
    f = facts();
    if (!f) return;
  }
}

// Whatever is due. The page calls it every CLOUD_PUMP_MS (main.js) and the
// checks with a clock of their own; a pass still under way is not doubled.
export function pump(nowMs = Date.now()) {
  if (!cloudReady()) return Promise.resolve();
  session.playing = true;
  if (queued) return chain;
  return serial(() => pumpNow(nowMs));
}

// The page going away (`pagehide`, a hidden tab, the desk's close): one more
// push of anything moved, with `keepalive` so it outlives the page, which the
// browser allows only under CLOUD_KEEPALIVE_MAX; a bigger one waits for the
// next boot's.
export function flush(nowMs = Date.now()) {
  if (!cloudReady()) return Promise.resolve();
  return serial(() => pumpNow(nowMs, true));
}

// --- the buttons ------------------------------------------------------------------
const recovery = f => (f ? `${CLOUD_SECRET_PREFIX}-${inGroups(f.secret, 4)}` : null);

// *keep my yards in the cloud*: a new vault, and every yard here up at once.
// Answers the recovery code, shown once, or null.
export function startCloud() {
  if (!cloudReady()) return Promise.resolve(null);
  return serial(async () => {
    const had = facts();
    if (had) return recovery(had);
    const r = await call('POST', '/vaults');
    if (r.status !== 201 || typeof r.data?.code !== 'string') { note(r); return null; }
    const f = { secret: normalize(r.data.code), base: {}, pushed: {}, at: null };
    keep(f);
    session = fresh(session.playing);
    if (await agree(f, { late: false })) await pushAll(Date.now());
    return recovery(facts());
  });
}
async function pushAll(now) {
  for (let n = 1; n <= SLOTS; n++) session.due[n] = 0;
  await pumpNow(now);
}

// *link a device*: a pairing code, live CLOUD_PAIR_S. `{ code, until }`, the
// code as shown and when it dies (wall ms), or null.
export function makePair() {
  if (!cloudReady()) return Promise.resolve(null);
  return serial(async () => {
    const f = facts();
    if (!f) return null;
    const r = await call('POST', '/pairings', { secret: f.secret });
    if (r.status !== 200 || typeof r.data?.pair !== 'string') { note(r); return null; }
    session.pair = { code: inGroups(normalize(r.data.pair), 3), until: Date.now() + (+r.data.expiresS || 0) * 1000 };
    return session.pair;
  });
}

// A secret handed over: kept, and the comparison made at once, so the player
// sees any two yards to choose between before they play.
async function link(secret) {
  const f = { secret, base: {}, pushed: {}, at: null };
  keep(f);
  session = fresh(session.playing);
  await agree(f, { late: false });
  return true;
}

// *enter a code*: the other device's pairing code. Whether it linked.
export function claimPair(pair) {
  if (!cloudReady()) return Promise.resolve(false);
  const p = normalize(pair);
  if (p.length !== CLOUD_PAIR_LEN) return Promise.resolve(false);
  return serial(async () => {
    const r = await call('POST', '/pairings/claim', { body: { pair: p } });
    if (r.status !== 200 || typeof r.data?.code !== 'string') { if (r.status !== 404) note(r); return false; }
    return link(normalize(r.data.code));
  }).then(Boolean);
}

// *use a recovery code*: the secret itself, from paper. Whether it linked.
export function useRecovery(code) {
  if (!cloudReady()) return Promise.resolve(false);
  const c = normalize(code);
  if (c.length !== CLOUD_SECRET_LEN) return Promise.resolve(false);
  return serial(async () => {
    const r = await call('GET', '/slots', { secret: c });
    if (r.status !== 200) { if (r.status !== 401) note(r); return false; }
    return link(c);
  }).then(Boolean);
}

// *new recovery code*: a new secret for the same vault; every other device is
// signed out and pairs again. The new code, or null.
export function rotate() {
  if (!cloudReady()) return Promise.resolve(null);
  return serial(async () => {
    const f = facts();
    if (!f) return null;
    const r = await call('POST', '/vaults/me/rotate', { secret: f.secret });
    if (r.status !== 200 || typeof r.data?.code !== 'string') { note(r); return null; }
    f.secret = normalize(r.data.code);
    keep(f);
    return recovery(f);
  });
}

// *stop*: this device forgets the secret. The cloud's copies stay, for the
// other devices.
export function stopCloud() {
  if (!cloudReady()) return Promise.resolve();
  return serial(async () => { forget(); });
}

// *show recovery code*.
export function recoveryCode() {
  if (!cloudReady()) return null;
  return recovery(facts());
}

// --- two yards, and a device behind -------------------------------------------------
export function conflicts() {
  if (!cloudReady()) return [];
  const out = [];
  for (const [n, c] of session.clash) out.push({ n, here: lineOf(local(n).s), cloud: lineOf(c.s) });
  return out.sort((a, b) => a.n - b.n);
}

// The player's answer to two yards in one slot. The one not kept goes to that
// slot's `.prev`, where *save a copy* still hands it out.
export function choose(n, side) {
  if (!cloudReady()) return Promise.resolve(false);
  return serial(async () => {
    const c = session.clash.get(n);
    const f = facts();
    if (!c || !f) return false;
    session.clash.delete(n);
    if (side === 'cloud') {
      const here = local(n);
      if (here.raw) savePrevOf(n, here.raw);
      writeSlot(n, c.raw);
      f.base[n] = c.rev;
      f.pushed[n] = playedOf(c.s);
      keep(f);
      session.dirty.delete(n);
      if (session.playing && n === openSlot()) reboot();
      return true;
    }
    savePrevOf(n, c.raw);
    f.base[n] = c.rev;
    keep(f);
    session.dirty.add(n);
    session.due[n] = 0;
    return true;
  }).then(Boolean);
}

// *take it*: the newer copy another device pushed, over this one.
export function takeCloud(n) {
  if (!cloudReady()) return Promise.resolve(false);
  return serial(async () => {
    const f = facts();
    if (!f || session.stop[n] !== 'behind') return false;
    const got = await fetchSlot(n, f.secret);
    if (!got) return false;
    const here = local(n);
    if (got.raw) {
      const s = parse(got.raw);
      if (!s || +s.saveV > SAVE_V) return false;
      if (here.raw) savePrevOf(n, here.raw);
      writeSlot(n, got.raw);
      f.pushed[n] = playedOf(s);
    } else {
      if (here.raw) savePrevOf(n, here.raw);
      writeSlot(n, '');
      f.pushed[n] = -1;
    }
    f.base[n] = got.rev || session.ahead[n]?.rev || f.base[n];
    keep(f);
    delete session.stop[n]; delete session.ahead[n];
    session.dirty.delete(n);
    if (session.playing && n === openSlot()) reboot();
    return true;
  }).then(Boolean);
}

// *keep this one*: this device's copy over the cloud's, which goes to `.prev`.
export function keepHere(n) {
  if (!cloudReady()) return Promise.resolve(false);
  return serial(async () => {
    const f = facts();
    if (!f || session.stop[n] !== 'behind') return false;
    const got = await fetchSlot(n, f.secret);
    if (!got) return false;
    if (got.raw) savePrevOf(n, got.raw);
    f.base[n] = got.rev || session.ahead[n]?.rev || f.base[n];
    keep(f);
    delete session.stop[n]; delete session.ahead[n];
    session.dirty.add(n);
    session.due[n] = 0;
    await pushSlot(n, f, Date.now());
    return true;
  }).then(Boolean);
}

// --- the line ---------------------------------------------------------------------
// `state` is one of off, ok, offline, behind, newer, big, full, paused,
// conflict: the one that asks something of the player first. `at` is the last
// push that took (wall ms); `pair` the live pairing code, `{ code, until }`.
// `behind` names the slots another device is ahead on, for *take it*.
export function cloudStatus() {
  const f = cloudReady() ? facts() : null;
  if (!f) return { state: 'off', at: null, pair: null, behind: [] };
  const pair = session.pair && session.pair.until > Date.now() ? session.pair : null;
  const stops = Object.values(session.stop);
  const behind = Object.keys(session.stop).filter(n => session.stop[n] === 'behind').map(Number);
  const state = session.clash.size ? 'conflict'
              : stops.includes('behind') ? 'behind'
              : stops.includes('newer') ? 'newer'
              : stops.includes('full') ? 'full'
              : stops.includes('big') ? 'big'
              : session.capped || session.trouble === 'paused' ? 'paused'
              : session.trouble === 'offline' ? 'offline'
              : 'ok';
  return { state, at: f.at, pair, behind };
}
