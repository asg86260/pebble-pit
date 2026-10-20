// Hell's stations as rows of the one station table (stations.js; DESIGN.md,
// "One place engine", step 4), as act 3's are (after/stations.js): the face,
// the furnace, the barrier, the anvil with its store and the road's foot each
// answer the pointer through `stationAt`, so a board opens on a walk-up,
// hover and cursor serve them and a pan away shuts them. `place: 'hell'`
// keeps them to hell's view.
//
// A kind stands in every chamber the pair has reached, so a row's `hit` asks
// them all, as drawn, and its `stand`, where the board is seated, is the
// chamber of that kind nearest the window's middle. The blow on a face or a
// barrier is the hand's (hell/index.js, `clickHell`), asked before the board
// on a press; the boards' rows are upgrades/rows-hell.js's.

import { S } from '../state.js';
import { P, GANG_MAX, HELL_TIERS } from '../config.js';
import { msg } from '../lang.js';
import { hellOn } from '../acts.js';
import { faceX, faceTop, faceStand, chamberFloor, furnaceBox, barrierBox, barrierStand, anvilX, storeX, roadX } from './place.js';
import { onFace } from './ore.js';
import { onBarrier } from './barriers.js';

const live = () => hellOn() && !!S.hell;
const inBox = (x, y, b) => x >= b.x && x < b.x + b.w && y >= b.y && y <= b.y + b.h;
const chambers = () => { const out = []; for (let i = 0; i <= S.hell.chamber; i++) out.push(i); return out; };
const mid = () => S.camX + S.viewW / 2;
// What a row has made so far, over every ore (the polish bar's door check).
const sum = o => Object.values(o || {}).reduce((n, v) => n + (v || 0), 0);

// The same one-at-a-time flag as act 3's rows: this session's, never saved.
let openKey = null;
const flag = key => {
  const name = `${key.replace(/-(\w)/g, (_, c) => c.toUpperCase())}BoardOpen`;
  Object.defineProperty(S, name, {
    enumerable: false, configurable: true,
    get: () => openKey === key,
    set: v => { if (v) openKey = key; else if (openKey === key) openKey = null; }
  });
  return name;
};

// The box of this kind in the chamber nearest the window's middle.
const nearest = boxOf => {
  let best = null, bd = Infinity;
  for (const i of chambers()) {
    const b = boxOf(i), d = Math.abs(b.x + b.w / 2 - mid());
    if (d < bd) { best = b; bd = d; }
  }
  return best;
};

// A face as drawn, the cells it is cut back to and a cell either side, and
// the ground its miners stand on to work it (`faceStand`, a body's two cells
// and two more). The face itself is the blow's (`work`), so its board opens
// from the miners' ground.
const faceBox = i => {
  const d = S.hell.seams[i] || 0, x = faceX(i, d) - P;
  return { x, y: faceTop(i), w: faceStand(i, d) + 3 * P - x, h: chamberFloor(i) - faceTop(i) };
};
// A barrier and a cell either side of it, and the ground the wall gang
// stands on before it, a slot a body (`barrierStand`); the barrier is the
// blow's, so its board opens from the gang's ground.
const wallBox = i => {
  const b = barrierBox(i), x = barrierStand(i, GANG_MAX - 1) - P;
  return { x, y: b.y, w: b.x + b.w + P - x, h: b.h };
};
// The landing's ground stations: a few cells either side of the spot, over
// the six cells above the first floor.
const AT_W = 3, AT_UP = 6;
const landing = x => ({ x: x - AT_W * P, y: chamberFloor(0) - AT_UP * P, w: AT_W * 2 * P, h: AT_UP * P });

const row = (kind, more) => {
  const key = `hell-${kind}`;
  return {
    key, place: 'hell', glyph: 'crate', after: [], needs: () => false,
    get name() { return msg(`board-hell-${kind}`); },
    open: live, board: flag(key),
    reach: { left: 0, right: 0, up: 0, down: 0 },
    ...more
  };
};

// In the order a press asks them: a face, a furnace, a barrier in each
// chamber, then the anvil with its store and the road.
export const HELL_STATION_ROWS = [
  row('face', { stand: () => nearest(faceBox), hit: (x, y) => chambers().some(i => inBox(x, y, faceBox(i))),
                work: (x, y) => chambers().some(i => onFace(i, x, y)),
                made: () => sum(S.hell.mined) }),
  row('furnace', { stand: () => nearest(furnaceBox), hit: (x, y) => chambers().some(i => inBox(x, y, furnaceBox(i))),
                   made: () => sum(S.hell.smelted) }),
  row('wall', { stand: () => nearest(wallBox), hit: (x, y) => chambers().some(i => inBox(x, y, wallBox(i))),
                work: (x, y) => chambers().some(i => i < HELL_TIERS.length && onBarrier(i, x, y)) }),
  // the tools made, and the strokes on the one under the hammer
  row('anvil', { stand: () => landing(anvilX()), hit: (x, y) => inBox(x, y, landing(anvilX())) || inBox(x, y, landing(storeX())),
                 made: () => S.hell.tool * 1000 + (S.hell.forge ? S.hell.forge.strokes + 1 : 0) }),
  row('muster', { stand: () => landing(roadX()), hit: (x, y) => inBox(x, y, landing(roadX())) })
];
