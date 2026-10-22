// Act 3's stations as rows of the one station table (stations.js; DESIGN.md,
// "One place engine", step 1): each card's board, and God's crowd's, stands
// where the station is drawn, so the pointer's one hit test (`stationAt`),
// the hover, the cursor and a board's close on scroll serve them as they
// serve the yard's. `place: 'after'` keeps them to the afterlife's view.
//
// Every station sells from its sign (the owner, 2026-10-21): the drawing is
// the hand's, worked where it stands (after/gestures.js), and opens no board.
// The grove's sign is the forestry shack's; God's crowd sells nothing and
// has no sign, its `hit` his camp on its stage. Their boards' rows are
// after/rows.js's (`registerBoard`).

import { S } from '../state.js';
import { P } from '../config.js';
import { msg } from '../lang.js';
import { afterlifeOn } from '../acts.js';
import { built } from './levels.js';
import { stationBox, signBoard, closed } from './place.js';
import { godCampAt, godMid, faceY } from './sky.js';

const live = () => afterlifeOn() && !!S.after;
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
    set: v => {
      const was = openKey;
      if (v) openKey = key; else if (openKey === key) openKey = null;
      // The point the crowd's board was asked over is that opening's only:
      // left behind once it shut, it stood the crowd's ground somewhere God
      // is not drawn, and the next hand to reach for him found nothing there.
      if (was === CROWD && openKey !== CROWD) crowdAt = null;
    }
  });
  return name;
};

// The station a card's sign and ground are: the grove's are the forestry
// shack's, in front of its trees (the owner, 2026-10-20).
const ground = card => (card === 'grove' ? 'forestry' : card);
// Whether the board sold from station `key`'s sign is up: the sign shows it.
export const signUp = key => !!openKey && ground(openKey.slice('after-'.length)) === key;

// The point God's crowd's board was asked over (after/rows.js
// `openAfterBoard`), or null: over God as drawn.
// Held only while that board is up (`flag` lets go of it when it shuts), so a
// later opening by the hand stands over God again.
const CROWD = 'after-crowd';
let crowdAt = null;
export const setCrowdAt = at => { crowdAt = at; };

const NAMES = {
  pedestal: () => msg('after-board-pedestal'), shack: () => msg('after-board-shack'), grove: () => msg('after-board-grove'),
  mill: () => msg('after-build-mill'), chipper: () => msg('after-build-chipper'), workshop: () => msg('after-build-workshop'),
  papermill: () => msg('after-build-papermill'), press: () => msg('after-build-press'), crowd: () => msg('after-board-crowd')
};

const row = (card, more) => {
  const key = `after-${card}`;
  return {
    key, place: 'after', glyph: 'crate', after: [], needs: () => false,
    get name() { return NAMES[card](); },
    board: flag(key),
    // its hit box is its ground, never padded past it
    reach: { left: 0, right: 0, up: 0, down: 0 },
    stand: () => stationBox(ground(card)),
    sign: () => signBoard(ground(card)),
    ...more
  };
};

// In the order a press asks them: the standing stations, the grove, God's camp.
const STATION_CARDS = ['mill', 'chipper', 'papermill', 'workshop', 'press', 'shack', 'pedestal'];
export const AFTER_STATION_ROWS = [
  ...STATION_CARDS.map(card => row(card, {
    // closed too: its board offers its rebuild
    open: () => live() && (built(card) || closed(card))
  })),
  // A press on a tree is the saw's (after/gestures.js).
  row('grove', { open: live }),
  row('crowd', {
    sign: null,
    open: live,
    stand: () => (crowdAt ? { x: crowdAt.x - P, y: crowdAt.y - P, w: P * 2, h: P * 2 }
                          : { x: godMid(mid()) - P, y: faceY() - P, w: P * 2, h: P * 2 }),
    hit: (x, y) => godCampAt(x, y, mid())
  })
];
