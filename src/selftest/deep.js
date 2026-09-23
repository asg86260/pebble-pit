// The two views, by the pointer: a click on the drowned surface takes the
// camera down into the deep once the snatch has played, and a click on the
// underside of the surface, from down there, brings it back up. The camera's
// part of it is test/deep-view.test.mjs; this is the click reaching it.

import { ok, point, onScreen, run } from './kit.js';
import { S } from '../state.js';
import { P, VIEW_GLIDE_S } from '../config.js';
import { mouthX, deepTop } from '../deep/place.js';
import { abyssLine } from '../pit.js';

const click = (wx, wy) => {
  const [x, y] = onScreen(wx, wy);
  point('pointerdown', x, y);
  point('pointerup', x, y);
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
  ['deep: a click on the drowned surface goes down, and one on the ceiling comes up', async () => {
    // Before the snatch the surface is only the abyss.
    deepYard(false);
    click(mouthX(), abyssLine() + P * 2);
    run(VIEW_GLIDE_S + 0.5);
    const before = S.view;
    deepYard();
    click(mouthX(), abyssLine() + P * 2);
    run(VIEW_GLIDE_S + 0.5);
    const down = S.view;
    const roof = deepTop() + P * 3;
    const roofOn = onScreen(S.camX + S.viewW / 2, roof)[1] >= 0;
    click(S.camX + S.viewW / 2, roof);
    run(VIEW_GLIDE_S + 0.5);
    const up = S.view;
    return [
      ok(before === 'yard', 'before the snatch a click on the surface is not a way down', before),
      ok(down === 'deep', 'after it, a click on the surface takes the view down', down),
      ok(roofOn, 'the underside of the surface is on the screen down there'),
      ok(up === 'yard', 'and a click on it brings the view back up', up)
    ];
  }]
];
