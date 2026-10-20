// Act 3's stations as rows of the one station table (stations.js; DESIGN.md,
// "One place engine", step 1): each card's board, and God's crowd's, stands
// where the station is drawn, so the pointer's one hit test (`stationAt`),
// the hover, the cursor and a board's close on scroll serve them as they
// serve the yard's. `place: 'after'` keeps them to the afterlife's view.
//
// A row's `hit` is the click area as drawn, where it is not its whole ground
// padded: a station's drawing (the pedestal's podium top, the saw mill's heap
// too), the forestry shack for the grove's, God's camp on its stage. Their boards'
// rows are after/rows.js's (`registerBoard`); the moving parts a press works
// are the hand's (after/gestures.js), asked before any of this.

import { S } from '../state.js';
import { P } from '../config.js';
import { msg } from '../lang.js';
import { afterlifeOn } from '../acts.js';
import { built } from './levels.js';
import { stationBox, stationParts, closed } from './place.js';
import { godCampAt, godMid, faceY } from './sky.js';

const live = () => afterlifeOn() && !!S.after;
const inBox = (x, y, b) => !!b && x >= b.x && x < b.x + b.w && y >= b.y && y <= b.y + b.h;
// The window's middle, which God's camp is drawn against (after/sky.js).
const mid = () => S.camX + S.viewW / 2;

// Which act board is up: one at a time, as the yard's own flags are, each
// row reading and writing its share through an accessor of its own name.
// This session's, never saved: a reload finds the boards shut.
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

// The point God's crowd's board was asked over (after/rows.js
// `openAfterBoard`), or null: over God as drawn.
let crowdAt = null;
export const setCrowdAt = at => { crowdAt = at; };

const NAMES = {
  pedestal: () => msg('after-board-pedestal'), shack: () => msg('after-board-shack'), grove: () => msg('after-board-grove'),
  mill: () => msg('after-build-mill'), chipper: () => msg('after-build-chipper'), workshop: () => msg('after-build-workshop'),
  papermill: () => msg('after-build-papermill'), press: () => msg('after-build-press'), crowd: () => msg('after-board-crowd')
};

// A station's drawing, the area a plain click on it opens its board in.
const drawn = card => (card === 'pedestal' ? stationParts('pedestal').top : stationBox(card));

const row = (card, more) => {
  const key = `after-${card}`;
  return {
    key, place: 'after', glyph: 'crate', after: [], needs: () => false,
    get name() { return NAMES[card](); },
    board: flag(key),
    // the hit is the drawing itself, never padded past it
    reach: { left: 0, right: 0, up: 0, down: 0 },
    ...more
  };
};

// In the order a press asks them, the old click's: the standing stations,
// the heap (the saw mill's), the grove, God's camp.
const STATION_CARDS = ['mill', 'chipper', 'papermill', 'workshop', 'press', 'shack', 'pedestal'];
export const AFTER_STATION_ROWS = [
  ...STATION_CARDS.map(card => row(card, {
    // closed too: its board offers its rebuild
    open: () => live() && (built(card) || closed(card)),
    stand: () => stationBox(card),
    hit: (x, y) => inBox(x, y, drawn(card)) || (card === 'mill' && inBox(x, y, stationParts('heap').heap))
  })),
  // The grove's board is the forestry shack's, in front of its trees (the
  // owner, 2026-10-20): a press on a tree is the saw's (after/gestures.js).
  row('grove', {
    open: live,
    stand: () => stationBox('forestry'),
    hit: (x, y) => inBox(x, y, stationBox('forestry'))
  }),
  row('crowd', {
    open: live,
    stand: () => (crowdAt ? { x: crowdAt.x - P, y: crowdAt.y - P, w: P * 2, h: P * 2 }
                          : { x: godMid(mid()) - P, y: faceY() - P, w: P * 2, h: P * 2 }),
    hit: (x, y) => godCampAt(x, y, mid())
  })
];
