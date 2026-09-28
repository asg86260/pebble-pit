// The two views, by the pointer (DESIGN.md, "The way between the halves"):
// the arrow at the shaft and the corner's square take the camera down into
// the deep once the snatch has played and back up from it; the drowned
// surface and the deep's roof themselves take no click. The camera's part of
// it is test/deep-view.test.mjs; this is the click reaching it.

import { ok, point, onScreen, run, settle, hoverStation, hoverAway } from './kit.js';
import { countRect } from '../render/counter.js';
import { portalNearEdge } from '../render/portal.js';
import { S } from '../state.js';
import { P, VIEW_GLIDE_S, PORTAL_RX } from '../config.js';
import { mouthX, portalX, portalCircle, deepPortal, deepTop } from '../deep/place.js';
import { abyssLine } from '../pit.js';
import { arrowBox } from '../render/shaftway.js';
import { refreshCorner } from '../corner.js';
import { draw } from '../render.js';
import { now } from '../clock.js';

const click = (wx, wy) => {
  const [x, y] = onScreen(wx, wy);
  point('pointerdown', x, y);
  point('pointerup', x, y);
};
const clickArrow = deep => { const b = arrowBox(deep); click(b.x + b.w / 2, b.y + b.h / 2); };
// The corner is laid out by the page's frame, which the checks' clock does
// not run: it is laid out here before it is read.
const way = () => { refreshCorner(); return document.getElementById('way'); };
// The corner's square is a page button: pressed the way a pointer does.
const pressWay = () => {
  const b = way();
  if (!b || b.hidden) return false;
  const r = b.getBoundingClientRect();
  const at = { clientX: r.left + r.width / 2, clientY: r.top + r.height / 2, bubbles: true, pointerId: 1, pointerType: 'mouse', button: 0 };
  b.dispatchEvent(new PointerEvent('pointerdown', at));
  b.dispatchEvent(new PointerEvent('pointerup', at));
  b.dispatchEvent(new MouseEvent('click', at));
  return true;
};

// A drowned yard, the camera on the shaft; `snatched` plays the snatch out.
function deepYard(snatched = true) {
  window.__crew(3, 3, 5, 7);
  if (snatched) window.__snatch({ played: true });
  else window.__rift();
  window.__view('yard');
  window.__look(mouthX() - S.viewW / 2);
  run(0.5);
}

export const TESTS = [
  ['deep: the arrow at the shaft goes down and up; the surface and the roof take no click', async () => {
    deepYard();
    // The liquid well clear of the portal, which is a way down of its own.
    click(mouthX() + PORTAL_RX * 3, abyssLine() + P * 2);
    run(VIEW_GLIDE_S + 0.5);
    const surface = S.view;
    clickArrow(false);
    run(VIEW_GLIDE_S + 0.5);
    const down = S.view;
    click(S.camX + S.viewW / 2, deepTop() + P * 3);
    run(VIEW_GLIDE_S + 0.5);
    const roof = S.view;
    clickArrow(true);
    run(VIEW_GLIDE_S + 0.5);
    const up = S.view;
    return [
      ok(surface === 'yard', 'a click on the surface is not a way down any more', surface),
      ok(down === 'deep', 'the arrow over the plank takes the view down', down),
      ok(roof === 'deep', 'a click on the roof is not a way up', roof),
      ok(up === 'yard', 'and the arrow in the light brings it back up', up)
    ];
  }],
  ['deep: a click on the conjured portal goes down, and on its deep end back up', async () => {
    deepYard();
    window.__look(portalX() - S.viewW / 2);
    run(2);                                // held open, and open all the way
    click(portalCircle().x, portalCircle().y);
    run(VIEW_GLIDE_S + 0.5);
    const down = S.view;
    click(deepPortal().x, deepPortal().y);
    run(VIEW_GLIDE_S + 0.5);
    return [ok(down === 'deep', 'the portal in the pit takes the view down', down),
            ok(S.view === 'yard', 'and its end in the deep brings it back up', S.view)];
  }],
  ['deep: the counter card keeps to the ground left of the torn portal', async () => {
    deepYard();
    window.__look(portalX() - S.viewW / 2);
    await settle(2);                       // held open, all the way, and drawn
    const box = countRect(), edge = (portalNearEdge() - S.camX) * S.zoom;
    return [ok(box && box.x + box.w <= edge, 'the card stands clear of the hole', box && `${box.x + box.w} > ${edge}`)];
  }],
  ['deep: the corner square goes down and up, and only after the snatch', async () => {
    deepYard(false);
    run(0.1);
    const hiddenBefore = way().hidden;
    deepYard();
    run(0.1);
    const pressed = pressWay();
    run(VIEW_GLIDE_S + 0.5);
    const down = S.view;
    pressWay();
    run(VIEW_GLIDE_S + 0.5);
    const up = S.view;
    return [
      ok(hiddenBefore, 'before the snatch there is no square'),
      ok(pressed && down === 'deep', 'after it, the square takes the view down', down),
      ok(up === 'yard', 'and back up', up)
    ];
  }],
  // A window taller than the deep lets its camera look up past the ceiling
  // into the yard's lowest rows, and whatever a shared layer draws over a
  // yard body -- a shout, a squat, a roster badge -- hung there over the
  // water. Here the camera is put up there by hand and the frame drawn twice,
  // with the yard's bodies saying something and with them quiet: in the deep
  // the two are the same picture, and in the yard (the control) they are not.
  // The camera is put across as well, over the yard's bodies: the deep's own
  // opens on the deep's end of the portal, mid-deep, with nobody of the
  // yard's under it, and the check would pass in the deep with nothing to hide.
  ['deep: nothing said over a yard body shows in the deep, even with the yard on the glass', async () => {
    deepYard();
    window.__view('deep');
    run(1);
    const up = S.workers.filter(w => w.y < S.worldH && !w.inside);
    const xs = up.map(w => w.x).sort((a, b) => a - b);
    const camX = (xs[xs.length >> 1] ?? 0) - S.viewW / 2;
    const seen = up.filter(w => w.x >= camX && w.x <= camX + S.viewW).length;
    const c = document.getElementById('c');
    const frame = (view, say) => {
      for (const w of up) w.say = say ? { mark: say, until: now() + 60000 } : null;
      const keep = { view: S.view, camX: S.camX, camY: S.camY };
      S.view = view;
      S.camX = camX;
      S.camY = S.groundY - S.viewH * 0.4;
      draw();
      S.view = keep.view; S.camX = keep.camX; S.camY = keep.camY;
      return c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
    };
    const differ = (a, b) => { let n = 0; for (let i = 0; i < a.length; i += 4) if (a[i] !== b[i] || a[i + 1] !== b[i + 1] || a[i + 2] !== b[i + 2]) n++; return n; };
    const out = [];
    for (const mark of ['bang', 'loo', 'burst']) {
      out.push(ok(differ(frame('deep', mark), frame('deep', null)) === 0, `a yard body's ${mark} is not drawn in the deep`,
                  `${differ(frame('deep', mark), frame('deep', null))} pixels`));
    }
    const shown = differ(frame('yard', 'bang'), frame('yard', null));
    out.push(ok(seen > 0 && shown > 0, 'and the same marks are drawn in the yard', `${seen} of ${up.length} bodies on the glass, ${shown} pixels`));
    for (const w of up) w.say = null;
    return out;
  }],
  // The deep has no top on screen: a window taller than the deep looks up
  // past its ceiling, and the water goes on up there, stars and veil, rather
  // than a flat black band over it. The checks' window is short, so the
  // camera is put up there by hand, as the stuck-over-the-water check does.
  ['deep: the water reaches the top of a window that looks up past the deep', async () => {
    deepYard();
    window.__view('deep');
    run(1);
    const c = document.getElementById('c');
    const keep = S.camY;
    S.camY = deepTop() - S.viewH / 2;
    draw();
    S.camY = keep;
    // The band over the deep's ceiling, clear of the corner's squares.
    const y0 = Math.round(c.height * 0.15), h = Math.round(c.height * 0.3);
    const d = c.getContext('2d').getImageData(0, y0, c.width, h).data;
    let lit = 0;
    for (let i = 0; i < d.length; i += 4) if (d[i] + d[i + 1] + d[i + 2] > 120) lit++;
    const share = lit / (d.length / 4);
    return [ok(share > 0.01, 'the water is lit over the deep\'s ceiling, not a black band', `${(share * 100).toFixed(2)}% lit`)];
  }],
  // The pods stand from the snatch with the sqwife's in them, so their board
  // is there from the deep's first frame; another pod is sold on it and not
  // on the altar's.
  ['deep: walking up to the pods opens their own board, with another pod on it', async () => {
    deepYard();
    window.__view('deep');
    run(VIEW_GLIDE_S + 0.5);
    const at = await hoverStation('pods');
    const open = S.podsBoardOpen;
    const rows = [...document.querySelectorAll('#podsshop [data-key]')].map(r => r.dataset.key);
    const title = document.querySelector('#podsboard .title')?.textContent.trim();
    await hoverAway();
    await hoverStation('altar');
    const altar = [...document.querySelectorAll('#altarshop [data-key]')].map(r => r.dataset.key);
    await hoverAway();
    return [
      ok(!!at && open, 'the pods open a board', at ? `${S.pods} pods` : 'no ground'),
      ok(title === 'the pods', 'which says whose it is', title),
      ok(rows.includes('pod'), 'another pod is on it', rows.join(' ')),
      ok(!altar.includes('pod'), "and not on the altar's", altar.join(' '))
    ];
  }]
];

// --- anchor: RAILS (the party wave, track BOARD) ------------------------------------
// A station's rails under a real pointer (deep/rails.js): a tap on a plate
// views the class and fades the other; the Buy takes the class and the other
// rail folds away, height and ink, over RAIL_FOLD_MS; Reset stands both again.
// What each press does to the station is test/rails.test.mjs; this is the
// press reaching it, and the fold being drawn.
import { showPanel } from '../board.js';
import { seatRails } from '../deep/rails.js';
import { RAIL_FOLD_MS } from '../config.js';
import { tap, sleep, raf } from './kit.js';

const rails = () => document.querySelector('.rails[data-station="s1"]');
const fold = cls => rails()?.querySelector(`.rl-fold[data-cls="${cls}"]`);
const tall = cls => fold(cls)?.getBoundingClientRect().height || 0;
const seat = async () => { seatRails(); await raf(); await raf(); seatRails(); };

TESTS.push(['rails: a tap views, the buy takes the class and folds the other, Reset stands both again', async () => {
  // until merge: `__party` (STATE) stands the station; here it is written onto
  // S, an altar with both its classes open, and scales to spend.
  S.stations = [{ id: 's1', kind: 'altar', slot: 0, built: true, cls: null, rung: 0, paid: [], fighter: null }];
  S.stationsBuilt = 2;
  window.__scales(9999);
  showPanel('s1', true);
  await seat();
  const st = S.stations[0];
  const up = !!rails() && S.stationBoardOpen === 's1';
  const both = tall('brawler') > 0 && tall('sword') > 0;

  await tap(rails().querySelector('.rl-plate[data-cls="brawler"]'));
  await seat();
  const faded = fold('sword').classList.contains('dim') && !fold('brawler').classList.contains('dim');
  const blank = st.cls === null && st.rung === 0;
  const says = rails().querySelector('.rl-buybtn .rl-what').textContent;

  await tap(rails().querySelector('.rl-buybtn'));
  // until merge: CREW's `buyRung` is a stub; the rung it will take, by hand.
  if (!st.rung) Object.assign(st, { cls: 'brawler', rung: 1, paid: [['scale', 15]] });
  await seat();
  await sleep(RAIL_FOLD_MS + 100);
  await seat();
  const shut = fold('sword').classList.contains('shut') && tall('sword') < 1;
  const kept = tall('brawler') > 0 && rails().querySelectorAll('.rl-fold[data-cls="brawler"] .rl-rail i.on').length === 1;

  await tap(rails().querySelector('.rl-reset'));
  // until merge: CREW's `resetStation` is a stub; the blank station, by hand.
  if (st.rung) Object.assign(st, { cls: null, rung: 0, paid: [] });
  await seat();
  await sleep(RAIL_FOLD_MS + 100);
  await seat();
  const again = !fold('sword').classList.contains('shut') && tall('sword') > 0 && tall('brawler') > 0;
  showPanel(null, true);
  return [
    ok(up, "the station's board is up with its rails", `${S.stationBoardOpen}`),
    ok(both, 'both rails stand on a blank station', `${tall('brawler')} ${tall('sword')}`),
    ok(faded, 'a tap on the Brawler fades the Swordsman'),
    ok(blank, 'and takes nothing'),
    ok(says === 'Buy Brawler 1', 'Buy names what it buys', says),
    ok(shut, 'after the buy the Swordsman has folded away', `${tall('sword')}px`),
    ok(kept, 'and the Brawler stands, its first pip lit'),
    ok(again, 'Reset stands both rails again', `${tall('brawler')} ${tall('sword')}`)
  ];
}]);
