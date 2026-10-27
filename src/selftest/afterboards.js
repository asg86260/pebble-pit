// Act 3's boards through the page (docs/wave-act3-build.md, track C): each
// station's board opened as its plain click opens it (`__openAfterBoard`, what
// Track A's click calls), drawn by the yard's own board builder in the yard's
// sheet, and every row on it bought by a press on its tile, the way a player
// buys it. The yard's objective line and its call to build the bench fade
// out up there. What each board lists, and the crowd's readings against the
// sim, are the node tier's (test/after-boards.test.mjs).

import { S } from '../state.js';
import { newRun, settle, until, raf, ok, panel, point, canvas } from './kit.js';
import { AFTER_CARDS, P, AFTER_PUT_S, AFTER_PILE_REACH, AFTER_PILES } from '../config.js';
import { shopOf } from '../pages.js';
import { support } from '../after/union.js';
import { msg } from '../lang.js';
import { openBoard } from '../board.js';
import { stationBox, signBoard, pileBox } from '../after/place.js';
import { toScreen } from '../world.js';

const OPENING = ['house-fall', 'arrive', 'meet-god', 'refuse'];
async function upThere() {
  window.__actsOn(true);
  S.after = null;
  window.__goPlace('after');
  for (const k of OPENING) if (!S.beatsDone.includes(k)) S.beatsDone.push(k);
  window.__fast(1);
  window.__grant({ dust: 5e6, spores: 2e6, shards: 2e6, scales: 2e5, sparks: 2e5 });
  window.__afterGrant({ rebel: 1e5, timber: 1e4 });
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
    // The shack first, from nothing standing: the saw mill needs nothing;
    // the workshop waits on the saw mill and says so.
    window.__openAfterBoard('shack');
    await settle(0.3);
    const shackUp = !panel().hidden && !document.getElementById('after-shackboard').hidden;
    const shop = tiles('shack').find(b => b.dataset.key === 'after-build-workshop');
    const shopLocked = !!shop && shop.classList.contains('locked') && shop.textContent.includes(msg('after-wait-mill'));
    for (const key of ['after-build-mill']) {
      const was = { rows: rowsNow() };
      tiles('shack').find(b => b.dataset.key === key)?.click();
      await until(() => bought(key, was));
      if (!bought(key, was)) missed.push(key);
    }
    // Every station standing (the setup the rest is not about), then each
    // station's board, every tile on it pressed once.
    for (const st of ['mill', 'workshop']) if (!S.after.built.includes(st)) S.after.built.push(st);
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
        // The timber pile topped up to its brim: it holds no more
        // (after/piles.js), and the tile redrawn affordable before its press.
        window.__afterGrant({ timber: AFTER_PILES.timber.brim });
        await settle(0.05);
        b.click();
        await until(() => bought(key, was));
        if (!bought(key, was)) missed.push(key);
      }
    }
    const want = window.__afterRows().filter(r => r.card !== 'shack').length;
    const pressed = opened.reduce((n, s) => n + +s.split(':')[1], 0);
    window.__actsOn(null);
    return [
      ok(shackUp, 'the shack\'s board opens on the yard\'s sheet'),
      ok(shopLocked, 'the workshop\'s tile is locked, saying what it waits on', shop?.textContent),
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
    await until(() => openBoard() === 'after-shack' && canvas().style.cursor === 'pointer');
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
      const s = toScreen(at[0], at[1]), n = saw().n;
      point('pointermove', r.left + s.x, r.top + s.y, 0);
      await raf();
      const cursor = canvas().style.cursor;
      point('pointerdown', r.left + s.x, r.top + s.y);
      point('pointerup', r.left + s.x, r.top + s.y);
      await until(() => saw().n !== n);
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
    // The fade is the stylesheet's, on the wall's clock, not the game's: wait
    // for both to have gone all the way out.
    await until(() => +getComputedStyle(obj).opacity === 0 && (raise.hidden || +getComputedStyle(raise).opacity === 0));
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
  }],
  ['act 3: the pointer on a roster says what its job does, or why it is standing still', async () => {
    newRun();
    await settle();
    await upThere();
    S.after.built.push('mill');
    window.__afterGrant({ logs: -S.after.stock.logs, grovelogs: -S.after.stock.grovelogs, timber: -S.after.stock.timber });
    const b = stationBox('mill'), r = canvas().getBoundingClientRect();
    window.__look(b.x + b.w / 2 - S.viewW / 2);
    await settle(0.2);
    const hover = async () => {
      const q = window.__afterRoster().find(o => o.job === 'sawyer');
      const s = toScreen((q.less[0] + q.more[0]) / 2, q.less[1]);
      point('pointermove', r.left + s.x, r.top + s.y, 0);
      const t = document.getElementById('tip');
      await until(() => t && !t.hidden && t.textContent.trim());
      return t && !t.hidden ? t.textContent.trim() : '';
    };
    const stalled = await hover();
    window.__afterGrant({ grovelogs: 3 });
    point('pointermove', r.left + 4, r.top + 4, 0);
    await until(() => { const t = document.getElementById('tip'); return !t || t.hidden; });
    const working = await hover();
    window.__actsOn(null);
    return [
      ok(stalled.includes(msg('after-stall-logs')), 'with no logs anywhere the sawyer\'s roster says it waits on logs', stalled),
      ok(working.includes(msg('after-job-sawyer.says')), 'with logs at the shack it says what the sawyer does', working)
    ];
  }],
  ['act 3: the right button held slows the member under the cursor, and the left takes it up', async () => {
    newRun();
    await settle();
    await upThere();
    window.__fast(20);
    S.after.built.push('mill');
    window.__fast(1 / 60);
    const pressed = window.__afterPress('sawyer', 1);
    window.__fast(1 / 60);
    const w = S.after.bodies.find(b => b.job === 'sawyer');
    if (!w) { window.__actsOn(null); return [ok(false, 'a member put on the saw mill', `${pressed} ${S.after.bodies.length} bodies`)]; }
    const r = canvas().getBoundingClientRect();
    const at = () => { const s = toScreen(w.x + P / 2, w.y - P); return [r.left + s.x, r.top + s.y]; };
    const pace = async held => {
      const x0 = w.x;
      for (let k = 0; k < 30; k++) { window.__look(w.x - S.viewW / 2); if (held) point('pointermove', ...at(), 2, 2); window.__fast(1 / 60); await raf(); }
      return Math.abs(w.x - x0);
    };
    const free = await pace(false);
    point('pointerdown', ...at(), 2, 2);
    const sight = S.crewSight != null;
    const slowed = await pace(true);
    point('pointerdown', ...at(), 3, 0);
    const taken = !!w.lifted;
    point('pointerup', ...at(), 2, 0);
    point('pointerup', ...at(), 0, 2);
    await settle(0.5);
    window.__actsOn(null);
    return [
      ok(sight, 'the right button looks at the crew up here too'),
      ok(free > 0 && slowed < free * 0.7, 'the member under the cursor walks slow', `${slowed.toFixed(1)} px held, ${free.toFixed(1)} px free`),
      ok(taken, 'and the left button takes it up')
    ];
  }],
  // Goods by hand (after/hand.js) through the real pointer: the right button
  // held and the left pressed over the forestry shack's log pile, the chord
  // that picks up a member; held there, a second log; carried along to the
  // saw mill's pile and let go, set down there a log at a time.
  ['act 3: two logs taken off the forestry shack\'s pile by the pointer\'s grab and let go on the saw mill\'s', async () => {
    newRun();
    await settle();
    await upThere();
    // The setup it is not about: the saw mill standing, logs on the shack's
    // pile, the yard's carry holding two.
    if (!S.after.built.includes('mill')) S.after.built.push('mill');
    S.haulCarryLevel = 1;
    window.__afterGrant({ grovelogs: 5 });
    const mid = (key, what) => { const b = pileBox(key, what, AFTER_PILE_REACH); return { x: b.x + b.w / 2, y: b.y + b.h * 0.75 }; };
    const from = mid('forestry', 'grovelogs'), to = mid('mill', 'logs');
    window.__look((from.x + to.x) / 2 - S.viewW / 2);
    await settle(0.3);
    const r = canvas().getBoundingClientRect();
    const at = p => { const s = toScreen(p.x, p.y); return [r.left + s.x, r.top + s.y]; };
    const pile0 = S.after.stock.grovelogs, mill0 = S.after.stock.logs;
    point('pointermove', ...at(from), 0);
    await raf();
    const hover = canvas().style.cursor;
    point('pointerdown', ...at(from), 2, 2);
    point('pointermove', ...at(from), 3, 0);
    await raf();
    const holding = canvas().style.cursor, one = S.after.hand?.n;
    // Held still over the pile: a frame of the sim at a time.
    for (let f = 0; f < AFTER_PUT_S * 60 * 4; f++) { point('pointermove', ...at(from), 3, -1); window.__fast(1 / 60); await raf(); }
    const two = S.after.hand?.n;
    for (let k = 1; k <= 30; k++) {
      point('pointermove', ...at({ x: from.x + (to.x - from.x) * k / 30, y: from.y + (to.y - from.y) * k / 30 }), 3, -1);
      window.__fast(1 / 60);
      await raf();
    }
    point('pointerup', ...at(to), 0, 0);
    for (let f = 0; f < 120 && S.after.hand; f++) { window.__fast(1 / 60); await raf(); }
    const counts = { pile: S.after.stock.grovelogs, mill: S.after.stock.logs, hand: S.after.hand };
    S.haulCarryLevel = 0;
    window.__actsOn(null);
    return [
      ok(hover === 'grab', 'the cursor over a pile with logs on it is the open hand', hover),
      ok(one === 1 && holding === 'grabbing', 'the right button held and the left pressed takes a log, the hand closed', `${one} ${holding}`),
      ok(two === 2, 'held over the pile, a second log, the carry full', `${two}`),
      ok(counts.pile === pile0 - 2 && counts.mill === mill0 + 2 && counts.hand === null, 'let go on the saw mill\'s pile, both are set down there', JSON.stringify(counts))
    ];
  }]
];
