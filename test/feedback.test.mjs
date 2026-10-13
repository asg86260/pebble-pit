// The feedback form, the game's side (DESIGN.md, "Feedback form", "Dev and
// checks"): the form as feedback.js works it, which is what the page draws,
// driven the player's way -- words typed, the tick pressed, send pressed --
// against the real worker's `handle` over node's SQLite. What the request
// carries is read off what the worker was sent, and a ticked save is read
// back through the owner's save route into this same yard.

import { mock } from 'node:test';

const { group, ok, run, yard } = await import('./helpers.mjs');
const { handle } = await import('../feedback/src/app.js');
const { makeD1 } = await import('../feedback/test/d1.mjs');
const fb = await import('../src/feedback.js');
const { feedbackUrlFor, FEEDBACK_URL, FEEDBACK_TEXT_MAX } = await import('../src/config/feedback.js');
const { persist, restore, bootYard } = await import('../src/persist.js');
const { storeSettled, slotRaw, openSlot, writeSlot } = await import('../src/save.js');
const { pref, setPref } = await import('../src/prefs.js');

const S = yard.S;
const URL_ = 'https://feedback.test';
const TOKEN = 'owner';
mock.timers.enable({ apis: ['Date'], now: Date.UTC(2026, 9, 13, 12) });

// The worker, in-process, and every request the form made of it. The page's
// Origin is the browser's to add; a dev server's is said here in its place.
let w;
function wire({ answer } = {}) {
  const d1 = makeD1();
  w = { env: { DB: d1.DB, IP_PEPPER: 'p', FEEDBACK_TOKEN: TOKEN }, raw: d1.raw, sent: [] };
  fb.setFeedbackUrl(URL_);
  fb.setFeedbackFetch(async (u, init = {}) => {
    w.sent.push({ url: u, method: init.method, body: init.body });
    if (answer) return answer(u, init);
    const h = new Headers(init.headers || {});
    h.set('origin', 'http://localhost:5184');
    h.set('cf-connecting-ip', '203.0.113.7');
    return handle(new Request(u, { method: init.method, headers: h, body: init.body }), w.env, Date.now());
  });
}
function unwire() {
  fb.setFeedbackUrl('');
  fb.setFeedbackFetch(null);
}
const sentBody = (i = 0) => JSON.parse(w.sent[i].body);

// A yard played a while and saved to its slot: the blob the tick offers.
async function played(s = 10) {
  window.__reset();
  window.__crew(2);
  run(s);
  persist();
  await storeSettled();
  return slotRaw(openSlot());
}

// A form on the held sheet, the player's way: words typed, and the tick
// pressed or not.
async function form({ page = 'game', words = 'the crew stand still by the quarry', tick = false, fatal = null } = {}) {
  const f = fb.feedbackForm({ page, fatal, raw: () => slotRaw(openSlot()) });
  await f.ready;
  if (words != null) f.type(words);
  if (tick) f.tick();
  return f;
}

group('the request carries the words and the six facts, and no save unless ticked', async () => {
  await played();
  wire();
  setPref('feedbackDraft', '');
  const f = await form();
  const tookOff = f.ticked === false;
  const sentOk = await f.send();
  const body = sentBody();
  const keys = Object.keys(body).join(',');
  const metaKeys = Object.keys(body.meta).join(',');
  const row = w.raw.prepare('SELECT * FROM reports').get();
  unwire();
  return [
    ok(tookOff, 'the tick is off as the form opens'),
    ok(sentOk && f.phase === 'sent', 'send is taken', f.phase),
    ok(keys === 'text,meta', 'the request is the words and the facts, nothing else', keys),
    ok(metaKeys === 'version,target,shell,os,lang,page', 'the facts are the six the design lists', metaKeys),
    ok(body.meta.version === 'dev' && body.meta.target === 'itch' && body.meta.shell === 'web' && body.meta.page === 'game',
      'version, target, shell and page as this build is', JSON.stringify(body.meta)),
    ok(['windows', 'mac', 'linux', 'android', 'ios', 'other'].includes(body.meta.os), 'the machine as one word', body.meta.os),
    ok(body.meta.lang === 'en · followed', 'the language in force, followed', body.meta.lang),
    ok(row && row.text === 'the crew stand still by the quarry' && row.save_bytes === 0, 'the worker kept the words and no save', JSON.stringify(row)),
    ok(!/navigator|Mozilla|stack/i.test(w.sent[0].body), 'no user agent and no stack ride along'),
  ];
});

group('a ticked save is the open slot\'s blob, and the worker\'s copy is the same yard', async () => {
  const raw = await played(20);
  wire();
  const before = { yardId: S.yardId, playedS: S.playedS, stored: S.stored, crew: S.crew, boulderNo: S.boulderNo, workers: S.workers.length };
  const f = await form({ tick: true });
  const line = f.goes().map(g => g.text).join(' | ');
  await f.send();
  const body = sentBody();
  const res = await handle(new Request(`${URL_}/reports/1/save`, { headers: { authorization: `Bearer ${TOKEN}` } }), w.env, Date.now());
  const back = await res.text();
  // Another yard stands in this slot; the report's copy is put back over it
  // as a fixture is, and opened.
  window.__reset();
  run(2);
  const reset = S.yardId !== before.yardId || S.playedS !== before.playedS;
  writeSlot(openSlot(), back);
  restore();
  bootYard();
  const after = { yardId: S.yardId, playedS: S.playedS, stored: S.stored, crew: S.crew, boulderNo: S.boulderNo, workers: S.workers.length };
  unwire();
  return [
    ok(f.ticked && 'save' in body, 'the tick puts the save in the request'),
    ok(/KB/.test(line), 'and the line gains the save and its size', line),
    ok(res.status === 200 && back === raw, 'the save route hands back the open slot\'s blob, byte for byte', `${res.status} ${back.length} vs ${raw.length}`),
    ok(reset, 'another yard stood in its place meanwhile'),
    ok(JSON.stringify(after) === JSON.stringify(before), 'and the report\'s save opens as the same yard', `${JSON.stringify(before)} -> ${JSON.stringify(after)}`),
  ];
});

group('the line of what goes lists exactly the request\'s keys, on every page and either way the tick is', async () => {
  await played();
  wire();
  const out = [];
  for (const [page, fatal] of [['game', null], ['title', null], ['crashed', 'TypeError: w.route is undefined']]) {
    for (const tick of [false, true]) {
      const f = await form({ page, tick, fatal });
      const listed = f.goes().map(g => g.key).join(',');
      const carried = fb.keysOf(f.report()).join(',');
      out.push(ok(listed === carried, `${page}, tick ${tick ? 'on' : 'off'}: the line is the request`, `${listed} vs ${carried}`));
      if (page === 'crashed') out.push(ok(f.report().meta.fatal === fatal && f.goes().some(g => g.text === fatal), 'the crashed sheet sends the crash\'s first line, and lists it'));
      else out.push(ok(!('fatal' in f.report().meta), `${page}: no crash line off the crashed sheet`));
    }
  }
  // A key the request gains is on the line before anybody writes words for it.
  const extra = fb.goesOf({ text: 'x', meta: {}, kind: 'bug' });
  out.push(ok(extra.some(g => g.key === 'kind' && g.text === 'bug'), 'a new key is listed as it stands'));
  unwire();
  return out;
});

group('a refused or offline send keeps the words and the tick, and sends nothing later', async () => {
  await played();
  const out = [];
  for (const [what, answer] of [
    ['offline', () => Promise.reject(new TypeError('Failed to fetch'))],
    ['capped', () => new Response(JSON.stringify({ retryS: 60 }), { status: 429, headers: { 'retry-after': '60' } })],
    ['paused', () => new Response(JSON.stringify({ retryS: 86400 }), { status: 503 })],
  ]) {
    wire({ answer });
    const f = await form({ tick: true, words: `${what}: the belt is stuck` });
    const took = await f.send();
    const n = w.sent.length;
    run(30);
    mock.timers.tick(3600 * 1000);
    await new Promise(r => setTimeout(r, 0));
    out.push(ok(!took && f.phase === 'failed', `${what}: the form says it did not go`, f.phase));
    out.push(ok(f.text === `${what}: the belt is stuck` && f.ticked, `${what}: the words and the tick are kept`));
    out.push(ok(pref('feedbackDraft') === `${what}: the belt is stuck`, `${what}: and the draft still holds the words`));
    out.push(ok(n === 1 && w.sent.length === 1, `${what}: one request, and none later`, `${n} then ${w.sent.length}`));
    out.push(ok(f.canSend(), `${what}: send can be pressed again`));
  }
  // A full worker takes the words and not the save, and the form says so.
  wire({ answer: () => new Response(JSON.stringify({ id: 9, save: false }), { status: 201 }) });
  const f = await form({ tick: true });
  await f.send();
  out.push(ok(f.phase === 'sent' && f.sentSave && f.savedKept === false, 'a report taken without its save is said so'));
  unwire();
  return out;
});

group('the words survive a reload as a draft, never the save; a sent report clears it', async () => {
  await played();
  wire();
  setPref('feedbackDraft', '');
  const f = await form({ tick: true, words: 'half a thought' });
  // The page goes away and comes back: the preferences read off the store
  // again, as a fresh page's are.
  const again = await import('../src/prefs.js?reload=1');
  const kept = again.pref('feedbackDraft');
  const blob = localStorage.getItem('boulder-clicker/prefs');
  const g = await form({ words: null });
  const draftBack = g.text === 'half a thought' && !g.ticked;
  g.type('half a thought, finished');
  await g.send();
  const cleared = pref('feedbackDraft') === '' && g.text === '';
  const h = await form({ words: null });
  const empty = h.text === '';
  // The box takes no more than the worker does.
  h.type('x'.repeat(FEEDBACK_TEXT_MAX + 50));
  unwire();
  return [
    ok(f.text === 'half a thought', 'typed'),
    ok(kept === 'half a thought', 'the draft is in the preferences a fresh page reads', String(kept)),
    ok(!/"save"|saveV|boulder/.test(blob), 'and the save is not', blob.slice(0, 80)),
    ok(draftBack, 'a form opened again has the words back, its tick off'),
    ok(cleared, 'a report taken clears the draft'),
    ok(empty, 'and the next form opens empty'),
    ok(h.left() === 0 && h.text.length === FEEDBACK_TEXT_MAX, 'the words stop at FEEDBACK_TEXT_MAX', String(h.text.length)),
  ];
});

group('an empty slot greys the tick and the line says why', async () => {
  wire();
  const f = fb.feedbackForm({ page: 'title', raw: () => null, yard: true });
  await f.ready;
  f.type('a word');
  f.tick();
  const big = await fb.offerOf(JSON.stringify({ noise: Array.from({ length: 120000 }, (_, i) => Math.random().toString(36) + i) }));
  unwire();
  return [
    ok(!f.canTick() && !f.ticked, 'nothing to tick in an empty slot'),
    ok(f.why() === '[owner\'s words: no save to send, the slot is empty]', 'the line says why', f.why()),
    ok(big.why === 'big' && /too big/.test(fb.whyNot(big)), 'a save past the cap is not offered either', JSON.stringify({ why: big.why, bytes: big.bytes })),
  ];
});

group('the landing page\'s line names the yard the save is', async () => {
  await played();
  wire();
  const f = fb.feedbackForm({ page: 'title', raw: () => slotRaw(openSlot()), yard: true });
  await f.ready;
  f.type('hello');
  f.tick();
  const save = f.goes().find(g => g.key === 'save')?.text || '';
  unwire();
  return [ok(save.includes(`rock ${S.boulderNo}`) && save.includes(`${S.crew} crew`) && /KB$/.test(save), 'rock and crew, then the size', save)];
});

group('an empty VITE_FEEDBACK_URL leaves the form inert', async () => {
  unwire();
  let called = 0;
  fb.setFeedbackFetch(() => { called++; return new Response(null, { status: 201 }); });
  const f = await form();
  const sent = await f.send();
  fb.setFeedbackFetch(null);
  return [
    ok(feedbackUrlFor({}) === '' && feedbackUrlFor({ VITE_FEEDBACK_URL: '' }) === '', 'no address is no form'),
    ok(feedbackUrlFor({ VITE_TARGET: 'steam', VITE_FEEDBACK_URL: URL_ }) === URL_, 'and a Steam build keeps the address it was given'),
    ok(FEEDBACK_URL === '', 'the node yard has none'),
    ok(!fb.feedbackReady(), 'not ready'),
    ok(!f.canSend() && !sent && called === 0 && f.phase === 'edit', 'send cannot be pressed and nothing is asked', `${sent} ${called} ${f.phase}`),
  ];
});
