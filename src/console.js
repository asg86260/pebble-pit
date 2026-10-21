// The handles, hung on `window` where the checks and the dev panel look for
// them. main.js reaches for this behind `import.meta.env.DEV`, so a production
// build drops this file and everything it imports: the hooks, the report and
// the browser suite. The `__` names are not an interface; the game itself
// never calls one.

import './selftest.js';        // adds __test() to the console
import * as hooks from './hooks.js';
import { snapshot } from './report.js';
import { seatBoard, boardFit, showPanel } from './board.js';
import { barSpot, pileMarkAt } from './render.js';
import { dialRect } from './render/filter.js';
import { siteBox } from './works.js';
import { nameOf } from './stations.js';
import { S } from './state.js';
import { toScreen } from './world.js';
import { take } from './upgrades.js';
import { subject, bandCells, liftArrived } from './cutscene.js';
import { CELL } from './config.js';
import { orbOn, orbMiddle } from './deep/phases.js';
import { partsOf, HANDWORK_KEYS } from './after/gestures.js';
import { handworkShown } from './render/aftercues.js';

// Act 3's hand work for a capture tool: each hand-worked station's parts in
// the world, what the hint drew last frame, and a world point on the glass
// in client pixels, where a dispatched pointer lands on it.
window.__handwork = () => ({ parts: Object.fromEntries(HANDWORK_KEYS.map(k => [k, partsOf(k)])), shown: handworkShown() });
window.__toGlass = (x, y) => { const r = document.getElementById('c').getBoundingClientRect(), s = toScreen(x, y); return [r.left + s.x, r.top + s.y]; };

// Everything hooks.js offers, under the name the checks call it by.
Object.assign(window, {
  ...hooks.HANDLES,
  __placeBoard: seatBoard, __boardFit: boardFit,
  // Open or close a board without walking to it. No linger either way: a check
  // that put the board away and hovered a pot found the board still up for a
  // tenth of a second and the picker refusing to open under it.
  __board: which => showPanel(which, true)
});

// Facts about the page rather than the game, which is why they are here and
// not in report.js. Each reads the function that places the thing: a check
// that copies the layout goes red the next time the layout is right.
window.__barAt = barSpot;
window.__siteBox = siteBox;
window.__siteName = nameOf;
window.__pileMarkAt = pileMarkAt;
window.__dialRect = dialRect;
// What the scene holding the yard is about, on the glass, against the
// letterbox's bands (cutscene.js, `subject`), and whether it is framed yet:
// the bands all the way in and the camera's move between them made.
window.__framed = () => {
  const box = subject(), band = bandCells() * CELL;
  const rect = box && { ...toScreen(box.x, box.y), w: box.w * S.zoomShow, h: box.h * S.zoomShow };
  return { hush: S.hush, band, W: S.W, H: S.H, rect, framed: !!box && S.hush >= 1 && liftArrived() };
};

// The constrict's orb's middle on the glass, in client pixels, for a tool to
// press the pointer on it; null with no orb up.
window.__orbAt = () => {
  const o = orbOn(), c = o && orbMiddle(o.st);
  return c && { ...toScreen(c.x, c.y), left: o.left, max: o.max };
};

window.__state = () => ({
  ...snapshot(),
  hushed: document.getElementById('panel').classList.contains('hushed'),
  // Read out of the DOM, and only while the sheet is out: the rows are built
  // once and kept, so a folded-away list still has every name in it.
  crewRows: [...document.querySelectorAll('#modal:not([hidden]) #modalcrew:not([hidden]) [data-key^="who"]')]
              .map(r => r.textContent),
  // and the two rows on the board itself: what you can put up, and the way in
  houseRow: (r => r && r.textContent)(document.querySelector('#crewshop [data-key="house"]')),
  crewDoor: (r => r && r.textContent)(document.querySelector('#crewshop [data-key="crewlist"]'))
});

// Every coin to the amounts named, nought for any not named:
// `setResources()` empties the purse, `setResources({ dust: 5000, sparks: 20 })`
// sets those two and empties the rest. Through the game's own paying and
// granting, so the cells leave and land in the hole the way a purchase and a
// handout move them, rather than a counter jumping.
window.setResources = (want = {}) => {
  const coins = [['dust', 'stored', 'dust'], ['shards', 'shards', 'shard'], ['spores', 'spores', 'spore'],
                 ['sparks', 'sparks', 'spark'], ['scales', 'scales', 'scale']];
  for (const [name, field, money] of coins) {
    const d = Math.round(want[name] || 0) - Math.round(S[field] || 0);
    if (d < 0) take(money, -d);
    else if (d > 0) hooks.grant({ [name]: d });
  }
  return Object.fromEntries(coins.map(([name, field]) => [name, Math.round(S[field] || 0)]));
};
