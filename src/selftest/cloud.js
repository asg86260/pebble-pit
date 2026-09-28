// Cloud saves on the page (docs/wave-cloud.md, "The face" and "Checks"): the
// line in the landing page's foot bar, the block on its settings page and
// the rows that ask which yard a slot keeps, each pressed the player's way.
// The page cannot reach the worker's `handle`, so a scripted `fetch` answers
// the contract's routes; the sync's own rules are the node tier's
// (test/cloud-sync.test.mjs) and the worker's are cloud/test's.
//
// Everything happens on index.html in a frame, which runs its own copy of
// cloud.js: the frame's module is reached by importing it inside the frame
// under the URL the page itself loaded it by, so it is the same instance.

import { sleep, newRun, settle, ok, run } from './kit.js';
import { S } from '../state.js';
import { persist, exportSave } from '../persist.js';
import { storeSettled } from '../save.js';

const WORKER = 'http://cloud.test';
const SECRET = '7F3KQ9WM2HXD';
const PAIR = 'K7Q94M';

const until = async (fn, tries = 60) => {
  for (let i = 0; i < tries; i++) { if (fn()) return true; await sleep(50); }
  return !!fn();
};
const json = (status, body) =>
  new Response(body == null ? null : JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
const gzip = async text =>
  new Uint8Array(await new Response(new Blob([text]).stream().pipeThrough(new CompressionStream('gzip'))).arrayBuffer());

// The worker, as a list of answers by route. `slots` is what `GET /slots`
// says; `blobs` the gzipped bodies by slot number.
function worker({ slots = [null, null, null], blobs = {} } = {}) {
  const calls = [];
  let rev = 0;
  const fetch = async (url, init = {}) => {
    const path = String(url).replace(WORKER, '');
    const method = (init.method || 'GET').toUpperCase();
    calls.push(`${method} ${path}`);
    const one = path.match(/^\/slots\/(\d)$/);
    if (method === 'POST' && path === '/vaults') return json(201, { code: SECRET });
    if (method === 'GET' && path === '/slots') return json(200, { slots });
    if (one && method === 'GET') {
      const body = blobs[one[1]];
      return body ? new Response(body, { status: 200, headers: { 'content-type': 'application/gzip', 'x-rev': String(slots[one[1] - 1]?.rev || 1) } })
                  : json(404, null);
    }
    if (one && method === 'PUT') return json(200, { rev: ++rev });
    if (method === 'POST' && path === '/pairings') return json(200, { pair: 'K7Q-94M', expiresS: 600 });
    if (method === 'POST' && path === '/pairings/claim') {
      let pair = '';
      try { pair = String(JSON.parse(init.body).pair).replace(/-/g, '').toUpperCase(); } catch {}
      return pair === PAIR ? json(200, { code: SECRET }) : json(404, null);
    }
    if (method === 'POST' && path === '/vaults/me/rotate') return json(200, { code: SECRET });
    if (method === 'DELETE') return new Response(null, { status: 204 });
    return json(404, null);
  };
  return { calls, fetch };
}

// index.html in a frame, pointed at the scripted worker (or at nothing).
// This page's own autosave is held for the visit, as the landing page's
// check holds it, so the only writer of the slots is the page under test.
async function landing(stub) {
  const wasStaged = S.staged;
  S.staged = true;
  const f = document.createElement('iframe');
  f.style.cssText = 'position:fixed;left:0;top:0;width:960px;height:600px;visibility:hidden';
  document.body.appendChild(f);
  const loaded = new Promise(r => f.addEventListener('load', r, { once: true }));
  f.src = 'index.html';
  await loaded;
  const d = f.contentDocument;
  await until(() => d.getElementById('playlabel').textContent);
  // By the URL the page loaded each one under: once a file has been edited,
  // the dev server hands it out with a stamp on the end, and the bare path
  // would be a second instance that the page never reads.
  const loadedAs = name => f.contentWindow.performance.getEntriesByType('resource')
    .map(e => e.name).filter(u => new URL(u).pathname === `/src/${name}.js`).pop() || `/src/${name}.js`;
  const mod = name => f.contentWindow.eval(`import(${JSON.stringify(loadedAs(name))})`);
  const cloud = await mod('cloud');
  const sheet = await mod('cloudsheet');
  const save = await mod('save');
  if (stub) {
    cloud.setCloudUrl(WORKER);
    cloud.setCloudFetch(stub.fetch);
    // Every check starts unlinked: a code an earlier run left in this
    // origin's store would boot the page on, whatever the check expects.
    await cloud.stopCloud();
    await save.storeSettled();
    sheet.refreshCloud();
  }
  const done = async () => {
    try { if (stub) await cloud.stopCloud(); } catch {}
    // The forgetting is a database write; a frame removed before it lands
    // aborts it, and the next check's page would boot still linked.
    try { await save.storeSettled(); } catch {}
    cloud.setCloudUrl('');
    cloud.setCloudFetch(null);
    f.remove();
    S.staged = wasStaged;
  };
  return { f, d, cloud, sheet, save, done };
}

const foot = d => d.getElementById('cloud');
const footSays = d => foot(d).textContent.replace(/\s+/g, ' ').trim();
const buttonIn = (el, text) => [...el.querySelectorAll('button')].find(b => b.textContent === text);

// Turned on the player's way: the settings page's button.
async function turnOn(d) {
  d.getElementById('settingsbtn').click();
  const block = d.getElementById('cloudsheet');
  const b = buttonIn(block, 'keep my yards in the cloud');
  if (!b) return false;
  b.click();
  return until(() => block.querySelector('.code'));
}

// A code typed into the foot bar's box, a key at a time as far as the box
// can tell.
function type(d, text) {
  const box = foot(d).querySelector('input');
  box.value = text;
  box.dispatchEvent(new Event('input', { bubbles: true }));
  return box.value;
}

export const TESTS = [
  ['the cloud: the foot bar shows nothing with cloud unset', async () => {
    newRun();
    await settle();
    const { d, done } = await landing(null);
    let text = null, width = -1, build = '';
    try {
      text = foot(d).textContent;
      width = foot(d).getBoundingClientRect().width;
      build = d.getElementById('build').textContent;
    } finally { await done(); }
    return [
      ok(text === '' && width === 0, 'no cloud line and no room kept for one', `"${text}" ${width}px`),
      ok(!!build, 'and the build number stands where it did', build)
    ];
  }],

  ['the cloud: the settings page shows the recovery code once', async () => {
    newRun();
    await settle();
    const { d, done } = await landing(worker());
    let shown = false, code = '', told = false, copy = false, again = true, show = false, titled = false;
    try {
      shown = await turnOn(d);
      const block = d.getElementById('cloudsheet');
      code = block.querySelector('.code')?.textContent || '';
      told = block.textContent.includes('write this down: it brings your yards back on a new device');
      copy = !!buttonIn(block, 'copy');
      titled = block.querySelector('.head')?.textContent === 'cloud saves' && !!buttonIn(block, 'stop cloud saves');
      d.getElementById('settingsback').click();
      d.getElementById('settingsbtn').click();
      again = !!block.querySelector('.code');
      show = !!buttonIn(block, 'show recovery code');
    } finally { await done(); }
    return [
      ok(shown && /^[0-9A-Z]{4}(-[0-9A-Z]{4}){2}$/.test(code), 'keep my yards in the cloud shows the recovery code', code),
      ok(told && copy, 'with copy and the words to write it down', `told ${told} copy ${copy}`),
      ok(titled, 'under a cloud saves heading, its stop saying what it stops'),
      ok(!again && show, 'and once: the page turned again shows it only on asking', `again ${again} show ${show}`)
    ];
  }],

  ['the cloud: link a device shows a code in the foot bar and it counts down', async () => {
    newRun();
    await settle();
    const stub = worker();
    const { d, done } = await landing(stub);
    let before = '', code = '', t0 = '', t1 = '', back = '';
    try {
      await turnOn(d);
      d.getElementById('settingsback').click();
      await until(() => buttonIn(foot(d), 'link a device'));
      before = footSays(d);
      buttonIn(foot(d), 'link a device').click();
      await until(() => foot(d).querySelector('.code'));
      code = foot(d).querySelector('.code')?.textContent || '';
      t0 = foot(d).querySelector('.count')?.textContent || '';
      await sleep(1100);
      t1 = foot(d).querySelector('.count')?.textContent || '';
      buttonIn(foot(d), 'done')?.click();
      back = footSays(d);
    } finally { await done(); }
    const secs = t => { const m = /^(\d+):(\d\d)$/.exec(t); return m ? +m[1] * 60 + +m[2] : NaN; };
    return [
      ok(/^cloud · saved .+ · link a device$/.test(before), 'on, the line says when the yards went up', before),
      ok(code === 'K7Q-94M' && stub.calls.includes('POST /pairings'), 'link a device asks for a code and shows it', code),
      ok(secs(t0) <= 600 && secs(t0) > 590 && secs(t1) < secs(t0), 'and it counts down', `${t0} -> ${t1}`),
      ok(/link a device$/.test(back), 'done puts it away', back)
    ];
  }],

  ['the cloud: enter a code links with a good code and says so with a bad one', async () => {
    newRun();
    await settle();
    const stub = worker();
    const { d, done } = await landing(stub);
    let off = '', typed = '', wrong = '', claims = 0, linked = '';
    try {
      await until(() => buttonIn(foot(d), 'enter a code'));
      off = footSays(d);
      buttonIn(foot(d), 'enter a code').click();
      typed = type(d, 'k7q9o');
      type(d, 'zzzzzz');
      buttonIn(foot(d), 'link').click();
      await until(() => d.getElementById('said').textContent);
      wrong = d.getElementById('said').textContent;
      type(d, 'k7q94m');
      buttonIn(foot(d), 'link').click();
      await until(() => buttonIn(foot(d), 'link a device'));
      claims = stub.calls.filter(c => c === 'POST /pairings/claim').length;
      linked = footSays(d);
    } finally { await done(); }
    return [
      ok(off === 'cloud · off · enter a code', 'off, the line offers a code', off),
      ok(typed === 'K7Q-90', 'the box reads a code as it is typed', typed),
      ok(wrong === "that code didn't work", 'a bad code says so', wrong),
      ok(claims === 2 && /link a device$/.test(linked), 'and a good one links', `${claims} claims, "${linked}"`)
    ];
  }],

  ['the cloud: the conflict pane\'s buttons call choose', async () => {
    newRun();
    await settle();
    window.__crew(2, 2);
    run(5);
    persist();
    await storeSettled();
    // The cloud's slot 1 is a different yard, further along.
    const other = JSON.parse(exportSave());
    other.yardId = 'another-yard';
    other.playedS = 99999;
    other.crew = 9;
    const body = await gzip(JSON.stringify(other));
    const stub = worker({
      slots: [{ rev: 1, yardId: 'another-yard', playedS: 99999, saveV: other.saveV, size: body.length, at: Date.now() }, null, null],
      blobs: { 1: body }
    });
    const { d, cloud, save, done } = await landing(stub);
    let rows = [], paneUp = false, left = -1, kept = '', front = false;
    try {
      await until(() => buttonIn(foot(d), 'enter a code'));
      buttonIn(foot(d), 'enter a code').click();
      type(d, PAIR);
      buttonIn(foot(d), 'link').click();
      const clashes = d.getElementById('clashes');
      paneUp = await until(() => !clashes.hidden && clashes.querySelector('.clash'));
      rows = [...clashes.querySelectorAll('.clash')].map(r => [...r.querySelectorAll('button')].map(b => b.textContent));
      clashes.querySelector('.clash button.cloud')?.click();
      await until(() => !cloud.conflicts().length && clashes.hidden);
      left = cloud.conflicts().length;
      front = !d.getElementById('play').hidden;
      try { kept = JSON.parse(save.slotRaw(1)).yardId; } catch {}
    } finally { await done(); }
    return [
      ok(paneUp, 'a link that meets a different yard opens the conflict pane'),
      ok(rows.length === 1 && /^this device · 1 · rock \d+ · 4 crew/.test(rows[0][0]) && /^cloud · 1 · rock \d+ · 9 crew/.test(rows[0][1]),
         'one row a slot, this device and the cloud', JSON.stringify(rows)),
      ok(left === 0 && kept === 'another-yard', 'the cloud button keeps the cloud\'s yard', `${left} left, kept ${kept}`),
      ok(front, 'and the page turns back to the front')
    ];
  }],
];
