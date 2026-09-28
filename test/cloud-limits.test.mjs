// Cloud saves, the fail-safes from the client's side (DESIGN.md, "Fail-safes:
// space and budget"; docs/wave-cloud.md, "Checks").
//
// A linked yard on a fake store, the real worker behind `fetch`, and the
// page's pump turned by hand on a mocked wall clock: `pump(now)` is exactly
// what main.js calls every CLOUD_PUMP_MS. Where a check is about what the
// client does with a refusal, a wrapper answers that refusal in the worker's
// place, and the local save is watched the whole time.

import { mock } from 'node:test';

const { group, ok, yard, storeChecks } = await import('./helpers.mjs');
storeChecks();          // a store of its own, written through at sixty a second
const { handle } = await import('../cloud/src/app.js');
const { makeD1 } = await import('../cloud/test/d1.mjs');
const cloud = await import('../src/cloud.js');
const { persist } = await import('../src/persist.js');
const { primeStore, storeSettled, saveRaw, loadRaw } = await import('../src/save.js');
const { CLOUD_PUSH_S, CLOUD_PUMP_MS, CLOUD_PUSH_HOUR_MAX, CLOUD_PUSH_FLOOR_S } = await import('../src/config.js');

const S = yard.S;
mock.timers.enable({ apis: ['Date'], now: Date.UTC(2026, 8, 27, 12) });
const MS = 1000;
const PUMP_S = CLOUD_PUMP_MS / MS;

function fakeKv() {
  const m = new Map();
  return {
    m,
    get: async k => (m.has(k) ? m.get(k) : null),
    set: async (k, v) => { m.set(k, v); return true; },
    del: async k => { m.delete(k); return true; },
    all: async () => new Map(m)
  };
}

// `refuse()` answers a PUT in the worker's place when it returns a Response;
// anything else goes through to the worker.
let w, refuse = null;
function wire() {
  const d1 = makeD1();
  w = { env: { DB: d1.DB, PAIR_PEPPER: 'test', STATS_TOKEN: 't' }, puts: [] };
  refuse = null;
  cloud.setCloudUrl('https://cloud.test');
  cloud.setCloudFetch(async (u, init = {}) => {
    if (init.method === 'PUT') {
      w.puts.push({ at: Date.now() });
      const r = refuse && refuse();
      if (r) return r;
    }
    const h = new Headers(init.headers || {});
    h.set('cf-connecting-ip', '203.0.113.7');
    return handle(new Request(u, { method: init.method, headers: h, body: init.body }), w.env, Date.now());
  });
}
const answer = (status, body, headers = {}) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', ...headers } });

// A played yard on a store of its own, linked and pushed. When it was.
async function linked() {
  wire();
  await primeStore(() => Promise.resolve(fakeKv()));
  window.__reset();
  yard.fast(10);
  persist();
  await storeSettled();
  await cloud.cloudBoot();
  await cloud.startCloud();
  return Date.now();
}

// The page at sixty frames a second: a frame, a save written to the store on
// every one, and the pump. A whole `persist` once a game second and the blob
// written again on the frames between -- sixty writes a second either way,
// at a tenth of the cost.
async function frames(seconds) {
  const t0 = Date.now();
  let blob = null, unsaved = false;
  for (let i = 1; i <= Math.round(seconds * 60); i++) {
    yard.fast(1 / 60);
    if (!blob || i % 60 === 0) { persist(); blob = loadRaw(); }
    else saveRaw(blob);
    unsaved ||= S.unsaved;
    mock.timers.setTime(t0 + Math.round(i * 1000 / 60));
    await cloud.pump(Date.now());
  }
  await storeSettled();
  return unsaved;
}

// The page a pump at a time, for checks about the wait rather than the frame:
// a frame of play and a save between pumps, so the yard has always moved.
// `move` false is a yard left standing, saved all the same.
async function pumps(seconds, { move = true, step = PUMP_S, hide = false } = {}) {
  let unsaved = false;
  for (let t = 0; t < seconds; t += step) {
    if (move) yard.fast(1 / 60);
    persist();
    unsaved ||= S.unsaved;
    mock.timers.tick(step * MS);
    await cloud.pump(Date.now());
    if (hide) await cloud.flush(Date.now());
  }
  await storeSettled();
  return unsaved;
}

const putsFrom = t => w.puts.filter(p => p.at >= t);
const gaps = list => list.slice(1).map((p, i) => (p.at - list[i].at) / MS);

group('an autosave at sixty a second for ten minutes sends ten pushes', async () => {
  const t0 = await linked();
  const unsaved = await frames(600);
  const sent = w.puts.filter(p => p.at > t0);
  const g = gaps(sent);
  return [
    ok(sent.length === 10, 'ten pushes in ten minutes', `${sent.length}: ${sent.map(p => (p.at - t0) / MS).join(', ')}`),
    ok(g.every(x => x >= CLOUD_PUSH_S), 'never two within a minute', g.join(', ')),
    ok(!unsaved && cloud.cloudStatus().state === 'ok', 'and the yard saved and the line says ok', cloud.cloudStatus().state)
  ];
});

group('a yard that does not move sends nothing', async () => {
  const t0 = await linked();
  const unsaved = await pumps(600, { move: false });
  const sent = w.puts.filter(p => p.at > t0);
  return [
    ok(sent.length === 0, 'no push in ten minutes of an idle yard', `${sent.length}`),
    ok(!unsaved, 'while it saves as ever')
  ];
});

group('a 429 waits as told once, then doubles', async () => {
  const t0 = await linked();
  refuse = () => answer(429, { retryS: 1 });
  const unsaved = await pumps(1000);
  const sent = w.puts.filter(p => p.at > t0);
  const g = gaps(sent);
  return [
    ok(sent.length === 5, 'the refused slot tries again, less and less often', `${sent.length}`),
    ok(g[0] <= PUMP_S, 'the first wait is what the worker said', g.join(', ')),
    ok(g[1] === 2 * CLOUD_PUSH_S && g[2] === 4 * CLOUD_PUSH_S && g[3] === 8 * CLOUD_PUSH_S,
       'and each wait after it double the last', g.join(', ')),
    ok(cloud.cloudStatus().state === 'paused', 'the line says paused', cloud.cloudStatus().state),
    ok(!unsaved, 'while the yard saves as ever')
  ];
});

group('a 503 obeys Retry-After, and a cloud that answers again is pushed a minute apart', async () => {
  const t0 = await linked();
  const RETRY = 1000;
  refuse = () => answer(503, { retryS: RETRY }, { 'retry-after': String(RETRY) });
  await pumps(2 * RETRY + 100);
  const refused = w.puts.filter(p => p.at > t0);
  const g = gaps(refused);
  const t1 = Date.now();
  refuse = null;
  const unsaved = await pumps(RETRY + 5 * CLOUD_PUSH_S);
  const back = putsFrom(t1);
  const g2 = gaps(back);
  return [
    ok(refused.length === 3 && g.every(x => x === RETRY), 'each try waits as long as it was told', g.join(', ')),
    ok(back.length >= 4 && g2.every(x => x === CLOUD_PUSH_S), 'and once it answers, a push a minute again', g2.join(', ')),
    ok(cloud.cloudStatus().state === 'ok', 'the line is ok again', cloud.cloudStatus().state),
    ok(!unsaved, 'while the yard saves as ever')
  ];
});

group('413 and 507 each stop pushing and leave the local save writing', async () => {
  const out = [];
  for (const [status, state] of [[413, 'big'], [507, 'full']]) {
    const t0 = await linked();
    refuse = () => answer(status, { error: 'no' });
    const unsaved = await pumps(600);
    const sent = w.puts.filter(p => p.at > t0);
    out.push(ok(sent.length === 1, `${status} stops the pushes after one`, `${sent.length}`),
             ok(cloud.cloudStatus().state === state, `and the line says ${state}`, cloud.cloudStatus().state),
             ok(!unsaved && S.unsaved === false, 'while the yard saves as ever'));
  }
  return out;
});

group('the hour cap stops a looping session and leaves the local save writing', async () => {
  // A worker that takes every push, and a page hidden every floor's length,
  // each hide one more push: twice the healthy rate, the loop the cap is for.
  const t0 = await linked();
  let rev = 100;
  refuse = () => answer(200, { rev: ++rev });
  const unsaved = await pumps(2 * 3600, { step: CLOUD_PUSH_FLOOR_S, hide: true });
  const sent = putsFrom(t0);
  const inHour = sent.filter(p => p.at - t0 < 3600 * MS).length;
  return [
    ok(inHour === CLOUD_PUSH_HOUR_MAX, 'the session stops at the cap', `${inHour} in the hour`),
    ok(sent.length === inHour, 'and stays stopped', `${sent.length}`),
    ok(cloud.cloudStatus().state === 'paused', 'the line says paused', cloud.cloudStatus().state),
    ok(!unsaved && S.unsaved === false, 'while the yard saves as ever')
  ];
});
