// The board of times, the yard's half (times.js): the run is named once at
// the first rock and never again on a reload, the rescue's post carries the
// clock and the save, an offline post waits on the save for the next boot,
// and with no board nothing is called. The server's rules are the server's
// own checks (server/test/times.test.ts); here the server is a stub `fetch`
// the check owns, the same way the desk bridge is stubbed.
// DESIGN.md, "The board of times: a global competition for the rescue".
import { group, ok, state, run, runUntil, yard } from './helpers.mjs';
import { S } from '../src/state.js';

const URL = 'http://board.test';

// The stub: every call is written down, and answered by `reply`.
let calls = [];
let reply = () => ({ ok: true, status: 200, body: {} });
const realFetch = globalThis.fetch;
globalThis.fetch = async (url, init = {}) => {
  const body = init.body ? JSON.parse(init.body) : null;
  calls.push({ url: String(url).replace(URL, ''), method: init.method || 'GET', body });
  const r = reply(calls[calls.length - 1]);
  if (r === 'away') throw new Error('away');
  return { ok: r.ok, status: r.status, json: async () => r.body };
};
const posted = path => calls.filter(c => c.url.startsWith(path));
// A promise chain a stub answers on the microtask queue; one turn of the
// loop lets every reply land.
const settle = () => new Promise(r => setTimeout(r, 0));

// The sqwife under the first rock, the way a player gets there: the opening
// played through.
function underTheRock() {
  window.__reset(true);
  runUntil(() => state().beatsDone.includes('show') && state().buried, 90);
}

group('with no board, nothing is called', async () => {
  calls = [];
  window.__timesUrl('');
  underTheRock();
  run(2);
  await settle();
  const none = calls.length;
  window.__reset();
  return [ok(none === 0, 'no call went out', `${none} calls`)];
});

group('the run is named once at the first rock, and a reload keeps the name', async () => {
  calls = [];
  reply = c => (c.url === '/runs' ? { ok: true, status: 200, body: { id: 'run-1' } } : { ok: true, status: 200, body: {} });
  window.__timesUrl(URL);
  underTheRock();
  await settle();
  run(1);
  const named = state();
  const asked = posted('/runs').length;
  const withSave = calls[0] && typeof calls[0].body?.save === 'string' && calls[0].body.save.length > 100;
  window.__reload();
  window.__bootTimes();                      // a reload here is not a boot; a page's is
  run(2);
  await settle();
  const back = state();
  const askedAgain = posted('/runs').length;
  window.__reset();
  window.__timesUrl('');
  return [
    ok(named.buried && named.runId === 'run-1', 'the yard carries the server\'s name for the run', `runId ${named.runId}`),
    ok(asked === 1, 'asked once', `${asked} asks`),
    ok(withSave, 'with the save behind it'),
    ok(back.runId === 'run-1' && askedAgain === 1, 'a reload keeps it and does not ask again', `runId ${back.runId}, ${askedAgain} asks`)
  ];
});

group('the rescue posts the clock and the save, and takes the rank back', async () => {
  calls = [];
  reply = c => {
    if (c.url === '/runs') return { ok: true, status: 200, body: { id: 'run-2' } };
    if (c.url.endsWith('/time')) return { ok: true, status: 200, body: { id: 'run-2', rank: 3, of: 41 } };
    return { ok: true, status: 200, body: {} };
  };
  window.__timesUrl(URL);
  underTheRock();
  await settle();
  run(1);
  // the rescue's own record, as intro.js leaves it (the walk is shield.test.mjs's)
  S.rescued = true; S.buried = false;
  const r = await window.__postTime('bob');
  const post = posted('/runs/run-2/time')[0];
  const save = post && JSON.parse(post.body.save);
  window.__reset();
  window.__timesUrl('');
  return [
    ok(post && post.body.ms === save.buriedMs && post.body.ms > 0, 'the time is the save\'s own clock', `ms ${post?.body.ms} save ${save?.buriedMs}`),
    ok(save && save.rescued === true && save.runId === 'run-2', 'and the save says rescued, under the run\'s name'),
    ok(post.body.name === 'bob', 'with the name typed'),
    ok(r && r.rank === 3 && r.of === 41, 'and the reply is the rank', JSON.stringify(r)),
    ok(state().timePending === null || state().timePending === undefined, 'nothing is left waiting')
  ];
});

group('a rescue posted while the board is away waits on the save, and goes at the next boot', async () => {
  calls = [];
  reply = c => (c.url === '/runs' ? { ok: true, status: 200, body: { id: 'run-3' } } : 'away');
  window.__timesUrl(URL);
  underTheRock();
  await settle();
  run(1);
  S.rescued = true; S.buried = false;
  const r = await window.__postTime('bob');
  const waiting = state().timePending;
  // the board comes back, and the next boot sends it
  reply = c => ({ ok: true, status: 200, body: { id: 'run-3', rank: 1, of: 1 } });
  window.__reload();
  window.__bootTimes();
  run(1);
  await settle();
  const sent = posted('/runs/run-3/time').length;
  const after = state().timePending;
  window.__reset();
  window.__timesUrl('');
  return [
    ok(r === null, 'the post said nothing'),
    ok(waiting && waiting.name === 'bob' && waiting.ms > 0, 'and waits on the save', JSON.stringify(waiting)),
    ok(sent === 2 && !after, 'the next boot sends it once and clears it', `${sent} posts, pending ${JSON.stringify(after)}`)
  ];
});

group('a run that never got a name posts with none', async () => {
  calls = [];
  reply = c => (c.url === '/runs' ? 'away' : { ok: true, status: 200, body: { id: 'run-4', rank: 1, of: 1 } });
  window.__timesUrl(URL);
  underTheRock();
  await settle();
  run(1);
  const unnamed = state().runId;
  S.rescued = true; S.buried = false;
  const r = await window.__postTime('bob');
  const idless = posted('/runs/time').length;
  const named = state().runId;
  window.__reset();
  window.__timesUrl('');
  globalThis.fetch = realFetch;
  return [
    ok(unnamed == null, 'no name while the board was away', `runId ${unnamed}`),
    ok(idless === 1 && r && r.rank === 1, 'the rescue goes up id-less', `${idless} posts, ${JSON.stringify(r)}`),
    ok(named === 'run-4', 'and takes the name the board minted', `runId ${named}`)
  ];
});
