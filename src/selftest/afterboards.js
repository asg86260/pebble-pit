// Act 3's boards through the page (docs/wave-act3-build.md, track C): each
// station's board opened as its plain click opens it (`__openAfterBoard`, what
// Track A's click calls), drawn by the yard's own board builder in the yard's
// sheet, and every row on it bought by a press on its tile, the way a player
// buys it. The yard's objective line and its call to build the bench fade
// out up there. What each board lists, and the crowd's readings against the
// sim, are the node tier's (test/after-boards.test.mjs).

import { S } from '../state.js';
import { newRun, settle, sleep, raf, ok, panel, point, canvas } from './kit.js';
import { AFTER_CARDS } from '../config.js';
import { shopOf } from '../pages.js';
import { support } from '../after/union.js';
import { msg } from '../lang.js';
import { openBoard } from '../board.js';
import { stationBox, signBoard } from '../after/place.js';
import { toScreen } from '../world.js';

const OPENING = ['house-fall', 'arrive', 'meet-god', 'refuse'];
async function upThere() {
  window.__actsOn(true);
  S.after = null;
  window.__goPlace('after');
  for (const k of OPENING) if (!S.beatsDone.includes(k)) S.beatsDone.push(k);
  window.__fast(1);
  window.__grant({ dust: 5e6, spores: 2e6, shards: 2e6, scales: 2e5, sparks: 2e5 });
  window.__afterGrant({ rebel: 1e5, timber: 1e4, paper: 1e4 });
  await settle(0.2);
}
// The open board's tiles, by key, as drawn.
const tiles = key => [...shopOf(`after-${key}`).querySelectorAll('button[data-key]')];
const rowsNow = () => Object.fromEntries(window.__afterRows().map(r => [r.key, r]));
// What a press changed: a rung climbed (a seat row's too).
const bought = (key, was) => {
  const r = rowsNow()[key];
  return r.rung > was.rows[key].rung;
};

export const TESTS = [
  ['act 3: each board opens in the yard\'s sheet, and every row on it is bought by a press on its tile', async () => {
    newRun();
    await settle();
    await upThere();
    const missed = [], opened = [];
    // The shack first, from nothing standing: the saw mill and the chipper
    // need nothing; the press waits on the paper mill and says so.
    window.__openAfterBoard('shack');
    await settle(0.3);
    const shackUp = !panel().hidden && !document.getElementById('after-shackboard').hidden;
    const press = tiles('shack').find(b => b.dataset.key === 'after-build-press');
    const pressLocked = !!press && press.classList.contains('locked') && press.textContent.includes(msg('after-wait-papermill'));
    for (const key of ['after-build-mill', 'after-build-chipper']) {
      const was = { rows: rowsNow() };
      tiles('shack').find(b => b.dataset.key === key)?.click();
      await sleep(60);
      if (!bought(key, was)) missed.push(key);
    }
    // Every station standing (the setup the rest is not about), then each
    // station's board, every tile on it pressed once.
    for (const st of ['mill', 'chipper', 'papermill', 'workshop', 'press']) if (!S.after.built.includes(st)) S.after.built.push(st);
    // ...and the union's support past the podium ladder's first mark, which
    // its first rung waits on (after/rows.js `waitsOn`), the souls won left
    // waiting for the recruit row.
    window.__afterCrowd(0.6, true);
    await settle(0.2);
    for (const card of AFTER_CARDS.filter(c => c !== 'shack')) {
      window.__openAfterBoard(card);
      await settle(0.2);
      const drawn = tiles(card);
      opened.push(`${card}:${drawn.length}`);
      for (const b of drawn) {
        const key = b.dataset.key;
        const was = { rows: rowsNow() };
        b.click();
        await sleep(40);
        if (!bought(key, was)) missed.push(key);
      }
    }
    const want = window.__afterRows().filter(r => r.card !== 'shack').length;
    const pressed = opened.reduce((n, s) => n + +s.split(':')[1], 0);
    window.__actsOn(null);
    return [
      ok(shackUp, 'the shack\'s board opens on the yard\'s sheet'),
      ok(pressLocked, 'the press\'s tile is locked, saying what it waits on', press?.textContent),
      ok(pressed === want, 'every station\'s board draws every row it sells as a tile', `${pressed} of ${want}: ${opened.join(' ')}`),
      ok(missed.length === 0, 'and a press on each tile buys it', missed.join(' '))
    ];
  }],
  ['act 3: the crowd\'s board reads the union off the sim, and sells nothing', async () => {
    newRun();
    await settle();
    await upThere();
    window.__afterCrowd(0.3);
    await settle(0.5);
    window.__openAfterBoard('crowd', { x: S.camX + S.viewW / 2, y: S.camY + S.viewH / 2 });
    await settle(0.3);
    const el = shopOf('after-crowd');
    const share = el.querySelector('[data-key="after-crowd-share"] .cost')?.textContent;
    const members = el.querySelector('[data-key="after-crowd-members"] .cost')?.textContent;
    const r = window.__afterRead();
    const buys = [...el.querySelectorAll('button[data-key]')].filter(b => !b.classList.contains('stat'));
    window.__actsOn(null);
    return [
      ok(share === msg('after-crowd-pct', { n: Math.floor(support() * 100) }), 'the share won is the sim\'s', `${share} vs ${r.support}`),
      ok(members === String(r.union), 'the members are the souls walked out', `${members} vs ${r.union}`),
      ok(buys.length === 0, 'every line a reading', buys.map(b => b.dataset.key).join(' '))
    ];
  }],
  ['act 3: the pointer on a station\'s sign opens its board, the cursor says so, and a pan off it closes it', async () => {
    newRun();
    await settle();
    await upThere();
    // The shack's sign where it is drawn, its middle on the glass, as the pointer gives it.
    const b = signBoard('shack'), r = canvas().getBoundingClientRect();
    window.__look(b.x + b.w / 2 - S.viewW / 2);
    await settle(0.2);
    const s = toScreen(b.x + b.w / 2, b.y + b.h / 2);
    point('pointermove', r.left + s.x, r.top + s.y, 0);
    await sleep(250);
    const open = openBoard(), cursor = canvas().style.cursor;
    // The wheel pans the shack out of the window: its board goes, as the yard's do.
    for (let k = 0; k < 6; k++) { canvas().dispatchEvent(new WheelEvent('wheel', { deltaY: 1200, bubbles: true, cancelable: true })); await raf(); }
    for (let k = 0; k < 40 && openBoard(); k++) await raf();
    const gone = openBoard(), off = b.x + b.w < S.camX || b.x > S.camX + S.viewW;
    window.__actsOn(null);
    return [
      ok(open === 'after-shack', 'the pointer over the shack\'s sign opens its board', String(open)),
      ok(cursor === 'pointer', 'and the cursor turns to the pointing hand', cursor),
      ok(off && gone === null, 'panned off it, the board closes', `${off} ${gone}`)
    ];
  }],
  ['act 3: a click on a roster\'s + under the saw mill puts a member on, and on its - takes one off; no board opens', async () => {
    newRun();
    await settle();
    await upThere();
    // The setup it is not about: the saw mill standing and a member waiting.
    if (!S.after.built.includes('mill')) S.after.built.push('mill');
    S.after.camp += 1;
    await settle(0.3);
    const b = stationBox('mill'), r = canvas().getBoundingClientRect();
    window.__look(b.x + b.w / 2 - S.viewW / 2);
    await settle(0.3);
    const press = async at => {
      const s = toScreen(at[0], at[1]);
      point('pointermove', r.left + s.x, r.top + s.y, 0);
      await raf();
      const cursor = canvas().style.cursor;
      point('pointerdown', r.left + s.x, r.top + s.y);
      point('pointerup', r.left + s.x, r.top + s.y);
      await sleep(60);
      return cursor;
    };
    const saw = () => window.__afterRoster().find(q => q.job === 'sawyer');
    const n0 = saw()?.n;
    const over = await press(saw().more);
    const n1 = saw().n, board = openBoard();
    await press(saw().less);
    const n2 = saw().n;
    window.__actsOn(null);
    return [
      ok(n0 === 0 && n1 === 1, 'the + under the saw mill, clicked, puts a member on', `${n0} -> ${n1}`),
      ok(over === 'pointer', 'the cursor over it is the pointing hand', over),
      ok(board === null, 'and the click is the roster\'s, not the station\'s board', String(board)),
      ok(n2 === 0, 'the - clicked takes the member off again', `${n2}`)
    ];
  }],
  ['act 3: the yard\'s objective line and its call to build the bench fade out up there, and come back down below', async () => {
    newRun();
    await settle(0.5);
    const obj = document.getElementById('objective'), raise = document.getElementById('raise');
    const below = { obj: obj.classList.contains('away'), raise: raise.classList.contains('away') };
    await upThere();
    // The fade is the stylesheet's, on the wall's clock, not the game's.
    await sleep(800);
    const up = { obj: obj.classList.contains('away'), raise: raise.classList.contains('away'),
                 seen: +getComputedStyle(obj).opacity, raiseSeen: raise.hidden ? 0 : +getComputedStyle(raise).opacity };
    window.__view('yard');
    await settle(0.3);
    const back = { obj: obj.classList.contains('away'), raise: raise.classList.contains('away') };
    window.__actsOn(null);
    return [
      ok(!below.obj && !below.raise, 'in the yard neither is put away', JSON.stringify(below)),
      ok(up.obj && up.raise && up.seen === 0 && up.raiseSeen === 0, 'up in act 3 both are faded out', JSON.stringify(up)),
      ok(!back.obj && !back.raise, 'and back down in the yard both return', JSON.stringify(back))
    ];
  }]
];
