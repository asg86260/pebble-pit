// Act 3's boards through the page (docs/wave-act3-build.md, track C): each
// station's board opened as its way in opens it (`__openAfterBoard`, the
// board its UPGRADES button or, with no roster, its click asks for), drawn by the yard's own board builder in the yard's
// sheet, and every row on it bought by a press on its tile, the way a player
// buys it. The yard's objective line and its call to build the bench fade
// out up there. What each board lists, and the crowd's readings against the
// sim, are the node tier's (test/after-boards.test.mjs).

import { S } from '../state.js';
import { newRun, settle, until, raf, ok, panel, point, canvas } from './kit.js';
import { AFTER_CARDS, P, AFTER_PILES, LADDER } from '../config.js';
import { shopOf } from '../pages.js';
import { support } from '../after/union.js';
import { msg } from '../lang.js';
import { openBoard } from '../board.js';
import { stationBox, floorAt, AP } from '../after/place.js';
import { stripBox, unitNear, lying } from '../after/ground.js';
import { toScreen } from '../world.js';
import { shopBoxOf } from '../roster.js';
import { layGood } from '../after/grove.js';
import { handHolds } from '../hands.js';
import { source } from '../flow.js';
import { goodsRead } from '../after/piles.js';

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
        // A row billed in timber is an order: it lands once members have
        // carried its blocks to its station (after/build.js).
        for (let k = 0; k < 240 && S.after.orders.length; k++) window.__fast(1);
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
  // The station is its own shop (DESIGN.md, "Act 3's goods are blocks", rule 4).
  // Even the shack, with no roster under it, opens only from its UPGRADES
  // button: up here a board is asked for, never come upon (the owner,
  // 2026-10-28).
  ['act 3: the shack opens neither on the pointer nor a click on it, its UPGRADES button opens its board, and a pan off it closes it', async () => {
    newRun();
    await settle();
    await upThere();
    // The shack where it is drawn, its middle on the glass, as the pointer gives it.
    const b = stationBox('shack'), r = canvas().getBoundingClientRect();
    window.__look(b.x + b.w / 2 - S.viewW / 2);
    await settle(0.2);
    const s = toScreen(b.x + b.w / 2, b.y + b.h / 2);
    point('pointermove', r.left + s.x, r.top + s.y, 0);
    await settle(0.3);
    const hovered = openBoard(), cursor = canvas().style.cursor;
    point('pointerdown', r.left + s.x, r.top + s.y);
    point('pointerup', r.left + s.x, r.top + s.y);
    await settle(0.3);
    const clicked = openBoard();
    const k = shopBoxOf('after-shack'), ks = toScreen(k.x + k.w / 2, k.y + k.h / 2);
    point('pointermove', r.left + ks.x, r.top + ks.y, 0);
    point('pointerdown', r.left + ks.x, r.top + ks.y);
    point('pointerup', r.left + ks.x, r.top + ks.y);
    await until(() => openBoard() === 'after-shack');
    const open = openBoard();
    // The wheel pans the shack out of the window: its board goes, as the yard's do.
    for (let k = 0; k < 6; k++) { canvas().dispatchEvent(new WheelEvent('wheel', { deltaY: 1200, bubbles: true, cancelable: true })); await raf(); }
    for (let k = 0; k < 40 && openBoard(); k++) await raf();
    const gone = openBoard(), off = b.x + b.w < S.camX || b.x > S.camX + S.viewW;
    window.__actsOn(null);
    return [
      ok(hovered === null && clicked === null, 'the pointer over the shack and a click on it open nothing', JSON.stringify([hovered, clicked])),
      ok(cursor !== 'pointer', 'and the cursor over it promises nothing', cursor),
      ok(open === 'after-shack', 'its UPGRADES button opens its board', String(open)),
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
    { const r = window.__afterRead(); window.__afterGrant({ logs: -r.logs, grovelogs: -r.grovelogs, timber: -r.timber }); }
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
  // Goods by hand (hands.js, the yard's sweep) through the real pointer: a
  // plain left press and hold on the forestry shack's log pile takes logs
  // into the hand, as a press on the yard's dust takes dust; carried along to
  // the saw mill's log pile, held still there and let go, they fall onto it.
  ['act 3: a left press and hold on the forestry shack\'s pile takes logs, and a let-go over the saw mill\'s drops them on it', async () => {
    newRun();
    await settle();
    await upThere();
    // The setup it is not about: the saw mill standing, logs on the shack's
    // pile, the yard's carry bought a rung.
    if (!S.after.built.includes('mill')) S.after.built.push('mill');
    S.carryLevel = 2;
    window.__afterGrant({ grovelogs: 6 });
    await settle(0.3);
    const from = window.__afterPile('forestry', 'grovelogs');
    const mill = stripBox('logs'), to = { x: mill.x + mill.w / 2, y: mill.top - AP * 8 };
    window.__look((from.x + to.x) / 2 - S.viewW / 2);
    await settle(0.3);
    const r = canvas().getBoundingClientRect();
    const at = p => { const s = toScreen(p.x, p.y); return [r.left + s.x, r.top + s.y]; };
    const pile0 = window.__afterRead().grovelogs, mill0 = window.__afterRead().logs, lying0 = lying().length;
    point('pointermove', ...at(from), 0);
    await raf();
    point('pointerdown', ...at(from), 1, 0);
    await raf();
    const took = S.held, kind = S.motes[0]?.kind, off = pile0 - window.__afterRead().grovelogs;
    for (let k = 1; k <= 30; k++) {
      point('pointermove', ...at({ x: from.x + (to.x - from.x) * k / 30, y: from.y + (to.y - from.y) * k / 30 }), 1, -1);
      window.__fast(1 / 60);
      await raf();
    }
    // held still a moment over the pile, so the let-go is a drop, not a flick
    for (let f = 0; f < 12; f++) { point('pointermove', ...at(to), 1, -1); await raf(); }
    point('pointerup', ...at(to), 0, 0);
    const thrown = S.chips.filter(c => c.place === 'after').length, empty = S.held === 0;
    for (let f = 0; f < 240 && S.chips.some(c => c.place); f++) { window.__fast(1 / 60); await raf(); }
    const counts = { pile: window.__afterRead().grovelogs, mill: window.__afterRead().logs, lying: lying().length - lying0 };
    S.carryLevel = 0;
    window.__actsOn(null);
    return [
      ok(took > 0 && kind === 'log' && off === took, 'a left press and hold on the pile takes logs into the hand and off the pile', `${took} held, ${off} off, ${kind}`),
      ok(empty && thrown === took, 'let go, every log leaves the hand', `${thrown} in the air`),
      ok(counts.mill > mill0 && counts.mill - mill0 + counts.lying === took, 'they fall onto the saw mill\'s pile, any it has no room for on the floor', JSON.stringify(counts))
    ];
  }],
  // A held drag sweeps as act 1's does (hands.js): pressed on bare ground
  // off every pile, the hold dragged across two planks lying on the floor
  // and on over the timber mound, everything of the hand's kind the brush
  // passes over joins the hand, up to what the hand holds of planks.
  ['act 3: a press on bare ground dragged across lying planks and the timber mound sweeps up planks the whole way, to a full hand', async () => {
    newRun();
    await settle();
    await upThere();
    if (!S.after.built.includes('mill')) S.after.built.push('mill');
    S.carryLevel = LADDER;
    window.__afterGrant({ timber: 12 - goodsRead().timber });
    await settle(0.3);
    const b = stripBox('timber'), y = b.bottom - AP / 2;
    const right = b.x + b.w + 2 * AP;
    source('plank', 2, 'test setup');
    layGood('plank', right, floorAt(right) - P * 2);
    layGood('plank', right + P * 4, floorAt(right) - P * 2);
    await settle(0.6);
    const lyingN = () => lying().filter(q => q.kind === 'plank').length;
    let sx = right + P * 14;
    while (unitNear(sx, y, P * 6)) sx += P * 2;
    const from = { x: sx, y }, to = { x: b.x + AP, y };
    window.__look((from.x + to.x) / 2 - S.viewW / 2);
    await settle(0.3);
    const r = canvas().getBoundingClientRect();
    const at = p => { const s = toScreen(p.x, p.y); return [r.left + s.x, r.top + s.y]; };
    const lying0 = lyingN(), t0 = goodsRead().timber, holds = handHolds('plank');
    S.held = 0; S.motes = [];
    point('pointermove', ...at(from), 0);
    await raf();
    point('pointerdown', ...at(from), 1, 0);
    await raf();
    const pressed = S.dragging, empty0 = S.held === 0;
    let afterLying = null;
    for (let k = 1; k <= 40; k++) {
      const p = { x: from.x + (to.x - from.x) * k / 40, y };
      point('pointermove', ...at(p), 1, -1);
      window.__fast(1 / 60);
      await raf();
      if (afterLying == null && p.x < b.x + b.w + AP) afterLying = { held: S.held, lying: lyingN() };
    }
    const held = S.held, kind = S.motes[0]?.kind, offMound = t0 - goodsRead().timber, left = lyingN();
    point('pointerup', ...at(to), 0, 0);
    for (let f = 0; f < 240 && S.chips.some(c => c.place); f++) { window.__fast(1 / 60); await raf(); }
    S.carryLevel = 0;
    window.__actsOn(null);
    return [
      ok(lying0 === 2 && empty0 && pressed, 'the press on bare ground takes the hand down, empty', JSON.stringify({ lying0, empty0, pressed })),
      ok(afterLying && afterLying.lying === 0 && afterLying.held === 2, 'dragged over the planks lying there, both join the hand', JSON.stringify(afterLying)),
      ok(held === holds && kind === 'plank' && offMound === holds - 2 && left === 0, 'dragged on over the mound, it fills the hand with planks and no more', JSON.stringify({ held, holds, kind, offMound, left }))
    ];
  }],
  // A thrown log is the hand's again, as thrown dust is: a press on it in
  // the air catches it, and one let go onto open floor is picked up by a
  // press on it where it lies. The press is the page's own pointerdown, so
  // the gate that decides a press up there is the hand's is the one checked.
  ['act 3: a log thrown up is caught by a press on it in the air, and one let go on the floor picked up again', async () => {
    newRun();
    await settle();
    await upThere();
    S.carryLevel = 2;
    window.__afterGrant({ grovelogs: 6 });
    await settle(0.3);
    const from = window.__afterPile('forestry', 'grovelogs');
    window.__look(from.x - S.viewW / 2);
    await settle(0.3);
    const r = canvas().getBoundingClientRect();
    const at = p => { const s = toScreen(p.x, p.y); return [r.left + s.x, r.top + s.y]; };
    const frame = async () => { window.__fast(1 / 60); await raf(); };
    const flying = () => S.chips.filter(c => c.place === 'after' && c.kind === 'log');
    point('pointermove', ...at(from), 0);
    await raf();
    point('pointerdown', ...at(from), 1, 0);
    await raf();
    const took = S.held;
    // the flick: up and to the right, a frame a step, let go on the move
    let p = from;
    for (let k = 1; k <= 3; k++) { p = { x: p.x + 18, y: p.y - 26 }; point('pointermove', ...at(p), 1, -1); await frame(); }
    point('pointerup', ...at(p), 0, 0);
    const thrown = flying().length;
    for (let f = 0; f < 5; f++) await frame();
    const c0 = flying()[0];
    if (c0) { point('pointermove', ...at(c0), 0); point('pointerdown', ...at(c0), 1, 0); }
    for (let f = 0; f < 40 && flying().length; f++) { const c = flying()[0]; point('pointermove', ...at(c), 1, -1); await frame(); }
    const caught = S.held === 1 && S.motes[0]?.kind === 'log' && !flying().length;
    // carried off to open floor, held still, let go: it comes down there
    const clear = x => [-24, 0, 24].every(k => !unitNear(x + k, floorAt(x) - P * 2, P * 6));
    let x = from.x - P * 20;
    while (x > from.x - P * 200 && !clear(x)) x -= P * 2;
    const spot = { x, y: floorAt(x) - P * 6 };
    for (let k = 0; k < 12; k++) { point('pointermove', ...at(spot), 1, -1); await frame(); }
    point('pointerup', ...at(spot), 0, 0);
    const laid = () => lying().filter(q => q.kind === 'log' && q.fall != null);
    for (let f = 0; f < 120 && !laid().length; f++) await frame();
    const q = laid()[0];
    const lay = q ? { x: q.x + P * 2, y: floorAt(q.x + P) - P * 2 } : spot;
    point('pointermove', ...at(lay), 0);
    point('pointerdown', ...at(lay), 1, 0);
    await raf();
    const repicked = S.held === 1 && S.motes[0]?.kind === 'log' && !laid().length;
    point('pointerup', ...at(from), 0, 0);
    S.carryLevel = 0;
    window.__actsOn(null);
    return [
      ok(took === 1 && thrown === 1, 'the log is taken off the pile and thrown', `${took} held, ${thrown} in the air`),
      ok(caught, 'a press on it in the air catches it back into the hand', `${S.held} held`),
      ok(!!q && repicked, 'let go on open floor, a press on it where it lies picks it up again', JSON.stringify({ lying: !!q, repicked }))
    ];
  }]
];
