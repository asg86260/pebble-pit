// The build sign under a real pointer (buildsign.js): moved onto, the cursor
// says a press will do something and the hover says what it builds; pressed,
// the board's own press pays and starts the build, and the sign goes. A sign
// whose row waits takes the press and buys nothing, its cursor asking why.
// What the sign shows and when, and every buy's outcome, are the node tier's
// (test/build-sign.test.mjs); this is what only a page can tell.

import { S } from '../state.js';
import { SHACK_DUST } from '../config.js';
import { newRun, settle, frames, ok, point, onScreen, canvas } from './kit.js';
import { signs, signMid } from '../buildsign.js';
import { UPGRADES, building } from '../upgrades.js';
import { raising } from '../after/levels.js';
import { msg } from '../lang.js';

const tipText = () => { const t = document.getElementById('tip'); return t && !t.hidden ? t.textContent : null; };
const onSign = (key, place) => signs(place).some(s => s.key === key);
// The pointer moved onto a sign's middle, and its press and release there.
async function moveTo(key) {
  const at = signMid(key);
  const [x, y] = onScreen(at.x, at.y);
  point('pointermove', x, y, 0);
  await frames(2);
  return [x, y];
}
async function press([x, y]) {
  point('pointerdown', x, y, 1);
  point('pointerup', x, y, 0);
  await frames(2);
}

export const TESTS = [
  ['build sign: a real pointer on the shack\'s sign points, says its price, and a press starts the hut', async () => {
    newRun();
    await settle();
    window.__crew(3, 2);
    S.seenBench = true;
    window.__give(SHACK_DUST * 2);
    await settle(0.5);
    const at = signMid('shack');
    window.__look(at.x - S.viewW / 2);
    await frames(3);
    const spot = await moveTo('shack');
    const cursor = canvas().style.cursor, says = tipText();
    const had = S.stored;
    await press(spot);
    const row = UPGRADES.find(u => u.key === 'unlockshack');
    const paid = had - S.stored, works = building(row);
    await frames(30);
    return [
      ok(cursor === 'pointer', 'over the sign the cursor is the pointing hand', cursor),
      ok(says === msg('build-sign-say', { call: row.name, bill: msg('build-sign-coin', { n: String(SHACK_DUST), coin: msg('books-dust') }) }),
         'and the hover names what it builds and its price', String(says)),
      ok(paid === SHACK_DUST && works, 'the press pays the price and starts the build', `paid ${paid}, building ${works}`),
      ok(!onSign('shack', 'yard'), 'and the sign is gone')
    ];
  }],

  ['build sign: up in act 3, the workshop\'s greyed sign asks why under the pointer and a press buys nothing', async () => {
    newRun();
    await settle();
    window.__actsOn(true);
    S.after = null;
    window.__goPlace('after');
    for (const k of ['house-fall', 'arrive', 'meet-god', 'refuse']) if (!S.beatsDone.includes(k)) S.beatsDone.push(k);
    window.__fast(1);
    window.__grant({ dust: 5e6, spores: 2e6, shards: 2e6 });
    window.__afterGrant({ rebel: 1000 });
    await settle(0.2);
    const at = signMid('after-workshop');
    window.__look(at.x - S.viewW / 2);
    await frames(3);
    const spot = await moveTo('after-workshop');
    const cursor = canvas().style.cursor, says = tipText();
    const rebel = S.after.rebel;
    await press(spot);
    const bought = S.after.rebel !== rebel || raising('workshop');
    window.__actsOn(null);
    return [
      ok(cursor === 'help', 'over a sign that waits the cursor asks why', cursor),
      ok(says === msg('build-sign-wait', { call: msg('build-sign-call', { name: msg('after-build-workshop') }), why: msg('after-wait-mill') }),
         'and the hover says what it waits on', String(says)),
      ok(!bought, 'a press on it buys nothing', `rebel ${rebel} -> ${S.after.rebel}`)
    ];
  }]
];
