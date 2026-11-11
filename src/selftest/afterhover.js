// Act 3 answers the shared hover as the yard does: a label over a station's
// drawing, and nothing over a part the hand works. Both acts name their
// bodies, piles and stations off the shared readers (DESIGN.md, "Clicks on
// the yard's engine"), and a board with its UPGRADES button is neither
// opened nor shut by a pointer passing over.

import { S } from '../state.js';
import { newRun, settle, until, ok, point, canvas, raf, runUntil } from './kit.js';
import { PLACES } from '../acts.js';
import { openBoard } from '../board.js';
import { shopBoxOf } from '../roster.js';
import { msg } from '../lang.js';
import { P } from '../config.js';
import { stationBox, stationParts } from '../after/place.js';
import { toScreen } from '../world.js';

const OPENING = ['house-fall', 'arrive', 'meet-god', 'refuse'];
async function upThere() {
  window.__actsOn(true);
  S.after = null;
  window.__goPlace('after');
  for (const k of OPENING) if (!S.beatsDone.includes(k)) S.beatsDone.push(k);
  window.__fast(1);
  S.after.built.push('mill');
  await settle(0.2);
}
const hoverAt = async (wx, wy) => {
  const r = canvas().getBoundingClientRect(), s = toScreen(wx, wy);
  point('pointermove', r.left + s.x, r.top + s.y, 0);
  await settle(0.1);
};
const tipText = () => { const t = document.getElementById('tip'); return t && !t.hidden ? t.textContent.trim() : ''; };
const glass = (wx, wy) => { const r = canvas().getBoundingClientRect(), s = toScreen(wx, wy); return [r.left + s.x, r.top + s.y]; };
// A body of a place standing at its work (where it stood a frame ago), the
// camera on it, nothing turned since: its box as it is drawn now.
async function standingBody(crew) {
  let was = new Map();
  const free = w => crew.pickable(w) && !w.falling && !w.lifted && was.get(w) === `${w.x},${w.y}`;
  const pick = () => { const w = (crew.list() || []).find(free); was = new Map((crew.list() || []).map(o => [o, `${o.x},${o.y}`])); return w; };
  runUntil(() => !!pick(), 120);
  const w = pick();
  if (!w) return null;
  window.__look(w.x - S.viewW / 2);
  await raf(); await raf();
  return { w, box: crew.box(w) };
}
// The tip over a world point, the pointer moved there and nothing turned.
async function tipOver(wx, wy) {
  point('pointermove', ...glass(wx, wy), 0);
  await raf();
  return tipText();
}

export const TESTS = [
  // No tooltip over a working part or while one is worked (DESIGN.md, "Act
  // 3's goods are blocks", rule 4): the flywheel is the hand's.
  ['act 3: the hover names a station by its drawing, and says nothing over a working part or while one is worked', async () => {
    newRun();
    await settle();
    await upThere();
    const m = stationBox('mill'), w = stationParts('mill').wheel;
    // the mill at the window's left, its board's room on its right
    window.__look(m.x - P * 2);
    await settle(0.2);
    await hoverAt(m.x + m.w / 2, m.y + m.h / 2);
    await until(() => tipText());
    const station = tipText();
    await hoverAt(w.x, w.y);
    for (let k = 0; k < 20 && tipText(); k++) await settle(0.05);
    const wheel = tipText();
    // Named over the frame, then taken hold of at its rim and dragged back
    // out over the frame: still worked, so nothing said.
    await hoverAt(m.x + m.w / 2, m.y + m.h / 2);
    await until(() => tipText());
    const r = canvas().getBoundingClientRect(), rim = toScreen(w.x + w.r, w.y), frame = toScreen(m.x + m.w / 2, m.y + m.h / 2);
    point('pointerdown', r.left + rim.x, r.top + rim.y);
    point('pointermove', r.left + frame.x, r.top + frame.y);
    await settle(0.3);
    const working = tipText();
    point('pointerup', r.left + frame.x, r.top + frame.y);
    window.__actsOn(null);
    return [
      ok(station === msg('after-build-mill'), 'over the saw mill the label is its name', station),
      ok(wheel === '', 'over its flywheel nothing is said', wheel),
      ok(working === '', 'nor while the flywheel is held, wherever the pointer goes', working)
    ];
  }],

  // A member named by the pointer up there, the shared hover reading the
  // act's crew; a station passed over with its button standing opens no
  // board, and the board its button opened stays up while the pointer
  // crosses other stations and bare sky.
  ['clicks on the yard\'s engine: act 3 names its bodies, and a board asked for stays asked', async () => {
    newRun();
    await settle();
    await upThere();
    window.__fast(20);
    const crew = PLACES.after.crew;
    const got = await standingBody(crew);
    const body = got ? await tipOver(got.box.x + got.box.w / 2, got.box.y + got.box.h / 2) : '';
    const said = got ? crew.says(got.w) : null;
    // the construction shack opens nothing, but is named over its drawing
    // (its row's `over`), high up where no body stands in front of it
    const sh = stationBox('shack');
    window.__look(sh.x + sh.w / 2 - S.viewW / 2);
    await raf(); await raf();
    const shack = await tipOver(sh.x + sh.w / 2, sh.y + P * 2);
    // the mill's frame, passed over: nothing opens
    const m = stationBox('mill'), wk = stationBox('workshop');
    window.__look(m.x - P * 2);
    await settle(0.2);
    point('pointermove', ...glass(m.x + m.w / 2, m.y + P), 0);
    for (let i = 0; i < 10; i++) await raf();
    const passed = openBoard();
    // its button pressed: its board, which the pointer then carries across
    // the workshop and out over bare sky
    const k = shopBoxOf('after-mill');
    const [bx, by] = k ? glass(k.x + k.w / 2, k.y + k.h / 2) : [0, 0];
    if (k) { point('pointermove', bx, by, 0); point('pointerdown', bx, by); point('pointerup', bx, by); }
    await until(() => openBoard() === 'after-mill', 60);
    const asked = openBoard();
    point('pointermove', ...glass(wk.x + wk.w / 2, wk.y + P), 0);
    for (let i = 0; i < 30; i++) await raf();
    const crossed = openBoard();
    point('pointermove', ...glass(m.x + m.w / 2, m.y - P * 30), 0);
    for (let i = 0; i < 30; i++) await raf();
    const away = openBoard();
    window.__actsOn(null);
    return [
      ok(!!got, 'a member stands at its work up there'),
      ok(!!said && body === said, 'the pointer over it names it as its crew calls it', `${body} vs ${said}`),
      ok(shack === msg('after-board-shack'), 'the construction shack, which opens nothing, is named over its drawing', shack),
      ok(passed === null, 'passing over the saw mill opens no board: it has its button', String(passed)),
      ok(!!k && asked === 'after-mill', 'its UPGRADES button pressed opens its board', String(asked)),
      ok(crossed === 'after-mill', 'the pointer crossing the workshop leaves it up', String(crossed)),
      ok(away === 'after-mill', 'and crossing bare sky leaves it up too', String(away))
    ];
  }],

  // Down in hell a ghost is named, a face's board opens on a walk-up with
  // the pointing hand, and a press there is the pick's blow, the board left
  // standing.
  ['clicks on the yard\'s engine: hell names its ghosts, opens a face on a walk-up and strikes it on a press', async () => {
    newRun();
    await settle();
    window.__crew(3, 3, 5, 7);
    window.__snatch({ played: true });
    window.__actsOn(true);
    window.__actsAt('act4');
    window.__goPlace('hell');
    window.__fast(1);
    window.__hell({ brimstone: 1e5 });
    window.__fast(30);
    const crew = PLACES.hell.crew;
    const got = await standingBody(crew);
    const ghost = got ? await tipOver(got.box.x + got.box.w / 2, got.box.y + got.box.h / 2) : '';
    const f = window.__hellAt('face', 0);
    window.__look(f.x - S.viewW / 2);
    await settle(0.1);
    const [fx, fy] = glass(f.x, f.y);
    for (let k = 6; k >= 1; k--) { point('pointermove', fx - k * 14, fy, 0); await raf(); }
    point('pointermove', fx, fy, 0);
    await until(() => openBoard() === 'hell-face', 60);
    const opened = openBoard(), cursor = canvas().style.cursor;
    const h0 = S.hell.faces[0].hits, o0 = JSON.stringify(S.hell.ore);
    point('pointerdown', fx, fy); point('pointerup', fx, fy);
    await raf();
    const h1 = S.hell.faces[0].hits, struck = h1 > h0 || JSON.stringify(S.hell.ore) !== o0;
    const after = openBoard();
    window.__view('yard');
    window.__actsOn(null);
    return [
      ok(!!got, 'a ghost stands at its work down there'),
      ok(ghost === msg('hover-ghost'), 'the pointer over it names it', ghost),
      ok(opened === 'hell-face', 'walked up to the face, its board opens', String(opened)),
      ok(cursor === 'pointer', 'with the pointing hand over it', cursor),
      ok(struck, 'a press on the face is the pick\'s blow', `${h0} -> ${h1}`),
      ok(after === 'hell-face', 'and the face\'s board stays up through it', String(after))
    ];
  }]
];
