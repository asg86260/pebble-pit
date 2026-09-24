// The two views, by the pointer (DESIGN.md, "The way between the halves"):
// the arrow at the shaft and the corner's square take the camera down into
// the deep once the snatch has played and back up from it; the drowned
// surface and the deep's roof themselves take no click. The camera's part of
// it is test/deep-view.test.mjs; this is the click reaching it.

import { ok, point, onScreen, run, settle } from './kit.js';
import { countRect } from '../render/counter.js';
import { portalNearEdge } from '../render/portal.js';
import { S } from '../state.js';
import { P, VIEW_GLIDE_S, PORTAL_RX } from '../config.js';
import { mouthX, portalX, portalCircle, deepPortal, deepTop } from '../deep/place.js';
import { abyssLine } from '../pit.js';
import { arrowBox } from '../render/shaftway.js';
import { refreshCorner } from '../corner.js';

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
  }]
];
