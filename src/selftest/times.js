// The board of times on the page (DESIGN.md, "The board of times: a global
// competition for the rescue"): the line on the ending sheet -- the name box
// once, the post through its button, the rank in reply -- and the page on
// the held sheet, best first with your own row boxed. The server is a stub
// `fetch` the group owns; the rules are the server's own checks
// (server/test/times.test.ts) and the run's are the node tier's
// (test/times.test.mjs).

import { newRun, settle, state, ok, run, raf, sleep } from './kit.js';
import { S } from '../state.js';
import { setTimesName, timesName } from '../timesboard.js';

const URL = 'http://board.test';
const held = () => document.getElementById('held');
const press = async () => {
  dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', bubbles: true }));
  await raf();
};

// A board with three rows on it, and every post a rank.
function stubBoard() {
  const real = window.fetch;
  const calls = [];
  const rows = [
    { id: 'r1', ms: 455000, seen: 455000, name: 'bob', at: Date.now() - 60000, itch: 1 },
    { id: 'r2', ms: 812000, seen: 0, name: 'ada', at: Date.now() - 3600000, itch: 0 },
    { id: 'r3', ms: 1930000, seen: 1930000, name: 'cy', at: Date.now(), itch: 0 }
  ];
  window.fetch = async (url, init = {}) => {
    const path = String(url).replace(URL, '');
    calls.push({ path, body: init.body ? JSON.parse(init.body) : null });
    let body = {};
    if (path.startsWith('/times')) body = { rows, mine: { ...rows[2], id: S.runId, rank: 9 }, of: 41 };
    else if (path === '/runs') body = { id: 'mine' };
    else if (path.endsWith('/time')) body = { id: S.runId || 'mine', rank: 3, of: 41 };
    return { ok: true, status: 200, json: async () => body };
  };
  return { calls, done: () => { window.fetch = real; } };
}

export const TESTS = [
  ['the ending sheet asks for a name once, posts through its button, and says the rank', async () => {
    const stub = stubBoard();
    window.__timesUrl(URL);
    setTimesName('');
    newRun();
    await settle();
    // the rescue's own record, as intro.js leaves it; the walk is the node tier's
    S.rescued = true; S.buried = false; S.buriedMs = 600000; S.runId = 'mine';
    run(1 / 60);
    await raf();
    const sheet = document.getElementById('saved');
    const box = document.getElementById('timespost');
    const up = !sheet.hidden;
    const asked = !box.hidden;
    document.getElementById('timesname').value = 'andrew';
    document.getElementById('timesgo').click();
    await sleep(50);
    const said = document.getElementById('timessaid').textContent;
    const post = stub.calls.find(c => c.path === '/runs/mine/time');
    window.__skipBeat('sheet');
    stub.done();
    window.__timesUrl('');
    const name = timesName();
    setTimesName('');
    return [
      ok(up && asked, 'the sheet is up with the name box on it', `up ${up} asked ${asked}`),
      ok(post && post.body.ms === 600000 && post.body.name === 'andrew', 'the button posts the clock under the name typed', JSON.stringify(post?.body && { ms: post.body.ms, name: post.body.name })),
      ok(said === 'on the board: 3rd of 41', 'and the reply is the rank', said),
      ok(name === 'andrew', 'the name is kept for next time', name)
    ];
  }],

  ['the times page lists the board best first, badges itch, marks offline and boxes your own row', async () => {
    const stub = stubBoard();
    window.__timesUrl(URL);
    newRun();
    await settle();
    S.runId = 'mine';
    await press();
    const btn = document.getElementById('timesbtn');
    const shown = !btn.hidden;
    btn.click();
    await sleep(50);
    const rows = [...document.getElementById('times').querySelectorAll('.row')].map(el => el.textContent);
    const mine = document.querySelector('#times .row.mine');
    document.getElementById('timesback').click();     // the front is written as it is turned to
    const label = btn.textContent;
    document.getElementById('resume').click();
    stub.done();
    window.__timesUrl('');
    return [
      ok(shown, 'the button is on the front'),
      ok(rows.length === 4 && rows[0].startsWith('1. 07:35 · bob · itch') && rows[1].startsWith('2. ~13:32 · ada'),
         'best first, itch badged, offline marked ~', rows.join(' | ')),
      ok(mine && mine.textContent.startsWith('9. '), 'and your own row under the list, with its rank', mine?.textContent),
      ok(label === 'times · best 07:35', 'the front carries the best', label)
    ];
  }],

  ['with no board there is no button, no name box and no call', async () => {
    const stub = stubBoard();
    window.__timesUrl('');
    newRun();
    await settle();
    await press();
    const hidden = document.getElementById('timesbtn').hidden;
    document.getElementById('settingsbtn').click();
    const noBox = document.getElementById('boardname').hidden;
    document.getElementById('settingsback').click();
    document.getElementById('resume').click();
    S.rescued = true; S.buried = false;
    run(1 / 60);
    await raf();
    const noAsk = document.getElementById('timespost').hidden;
    window.__skipBeat('sheet');
    const calls = stub.calls.length;
    stub.done();
    return [
      ok(hidden && noBox, 'no button, no name box', `button hidden ${hidden}, box hidden ${noBox}`),
      ok(noAsk, 'the ending sheet has no line'),
      ok(calls === 0, 'and nothing was called', `${calls} calls`)
    ];
  }]
];
