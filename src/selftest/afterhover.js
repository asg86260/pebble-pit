// Act 3 answers the shared hover as the yard does: a label over a station's
// drawing and over the heap, and the sawdust heap's pile-full mark with its
// tooltip and the help hand (a mark that will tell you why).

import { S } from '../state.js';
import { newRun, settle, until, ok, point, canvas } from './kit.js';
import { msg } from '../lang.js';
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

export const TESTS = [
  // No tooltip over a working part or while one is worked (DESIGN.md, "Act
  // 3's goods are blocks", rule 4): the flywheel and the heap are the hand's.
  ['act 3: the hover names a station by its drawing, and says nothing over a working part or while one is worked', async () => {
    newRun();
    await settle();
    await upThere();
    // Sawdust on the heap, so it is a part the hand works: an empty heap is
    // only named. (This held only while the pointer over the mill opened
    // its board, which up here it no longer does.)
    window.__afterGrant({ sawdust: 8 });
    await settle(0.1);
    const m = stationBox('mill'), h = stationParts('heap').heap, w = stationParts('mill').wheel;
    window.__look((m.x + h.x) / 2 - S.viewW / 2);
    await settle(0.2);
    await hoverAt(m.x + m.w / 2, m.y + m.h / 2);
    await until(() => tipText());
    const station = tipText();
    await hoverAt(w.x, w.y);
    for (let k = 0; k < 20 && tipText(); k++) await settle(0.05);
    const wheel = tipText();
    await hoverAt(h.x + h.w / 2, h.y + h.h - 4);
    for (let k = 0; k < 20 && tipText(); k++) await settle(0.05);
    const heap = tipText();
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
      ok(heap === '', 'nor over the sawdust heap, worked by hand', heap),
      ok(working === '', 'nor while the flywheel is held, wherever the pointer goes', working)
    ];
  }],
  ['act 3: the full sawdust heap\'s mark says why, and the cursor on it is the help hand', async () => {
    newRun();
    await settle();
    await upThere();
    const h = stationParts('heap').heap;
    window.__look(h.x - S.viewW / 2);
    S.after.stock.sawdust = 1e6;
    await settle(0.3);
    const full = !!S.pileFull['after-sawdust'];
    const at = window.__pileMarkAt('after-sawdust');
    await hoverAt(at.x, at.y);
    await until(() => tipText() === msg('after-stall-heap'));
    const tip = tipText(), cursor = canvas().style.cursor;
    S.after.stock.sawdust = 0;
    await settle(0.3);
    const cleared = !S.pileFull['after-sawdust'];
    window.__actsOn(null);
    return [
      ok(full, 'the heap at its brim is a full pile on the shared table'),
      ok(tip === msg('after-stall-heap'), 'its mark says the heap is full', tip),
      ok(cursor === 'help', 'and the cursor on it is the help hand, not the crosshair', cursor),
      ok(cleared, 'tipped, it is no longer full')
    ];
  }]
];
