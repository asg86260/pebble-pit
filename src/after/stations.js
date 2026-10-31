// Act 3's stations as rows of the one station table (stations.js; DESIGN.md,
// "One place engine", step 1): each card's board, and God's crowd's, stands
// where the station is drawn, so the pointer's one hit test (`stationAt`),
// the hover, the cursor and a board's close on scroll serve them as they
// serve the yard's. `place: 'after'` keeps them to the afterlife's view.
//
// Every station is its own shop (DESIGN.md, "Act 3's goods are blocks",
// rule 4): its board opens from the UPGRADES button under it (roster.js
// `rosterShops`), and from nothing else, so no board comes up under a
// passing pointer. The board hangs off the button (`boardAnchor`). The
// grove's board is the forestry shack's; God's crowd's button stands under
// his camp on its stage. Their boards' rows are after/rows.js's
// (`registerBoard`).

import { held } from '../reset.js';
import { S } from '../state.js';
import { P, AFTER_ROSTER_DOWN, AFTER_ROSTER_SHOP_DROP, AFTER_BUILDS } from '../config.js';
import { msg } from '../lang.js';
import { afterlifeOn } from '../acts.js';
import { built } from './levels.js';
import { stationBox, groundOf, afterFloor, closed, pilePlace, pileOwner, floorAt } from './place.js';
import { afterRow } from './rows.js';
import { PILED, pileFull } from './piles.js';
import { godCampAt, godMid, faceY } from './sky.js';
import { shopBoxOf, rosterShops } from '../roster.js';
import { drawnMid } from '../footprints.js';

const live = () => afterlifeOn() && !!S.after;
// A counted pile's name, and the box its mark hangs from: `pileMarkAt` hangs
// a pile row's mark five cells over its box's top, so the box's top is the
// plot's at its fullest.
const PILE_NAMES = { logs: 'hover-pile-logs', grovelogs: 'hover-pile-logs', timber: 'hover-pile-planks', benchtimber: 'hover-pile-planks', signs: 'hover-pile-signs', seeds: 'hover-pile-seeds' };
function pileTop(what) {
  const g = pilePlace(what);
  return { x: g.x, y: g.y, w: g.cols * g.p, h: g.rows * g.p };
}
// The window's middle, which God's camp is drawn against (after/sky.js).
const mid = () => S.camX + S.viewW / 2;

// Which act board is up: one at a time, as the yard's own flags are, each
// row reading and writing its share through an accessor of its own name.
// This session's, never saved: a reload finds the boards shut.
let openKey = null; // held: the act board that is up, never saved
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

// The station a card's ground is: the grove's is the forestry shack's, in
// front of its trees (the owner, 2026-10-20).
const ground = card => (card === 'grove' ? 'forestry' : card);

// The point God's crowd's board was asked over (after/rows.js
// `openAfterBoard`), or null: over God as drawn.
// Held only while that board is up (`flag` lets go of it when it shuts), so a
// later opening by the hand stands over God again.
const CROWD = 'after-crowd';
let crowdAt = null; // held: the point the crowd's board was asked over
held('after-boards', () => { openKey = null; crowdAt = null; });
export const setCrowdAt = at => { crowdAt = at; };

const NAMES = {
  pedestal: () => msg('after-board-pedestal'), shack: () => msg('after-board-shack'), grove: () => msg('after-board-grove'),
  mill: () => msg('after-build-mill'), workshop: () => msg('after-build-workshop'), crowd: () => msg('after-board-crowd')
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
    // Where a roster under the station stands, so its UPGRADES button stands
    // there whether or not one does (roster.js `rosterShops`): the middle of
    // its drawing (footprints.js `drawnMid`),
    // as far under its ground as the act's rosters stand.
    line: () => { const x = drawnMid(ground(card)); return x != null && { x, y: groundOf(ground(card)) + AFTER_ROSTER_DOWN + AFTER_ROSTER_SHOP_DROP }; },
    // Off the button that asked for it, over the button's top, near enough
    // to read as the button's. Asked for by a press, it may stand over the
    // station and its neighbors (the owner, 2026-10-28), but never over the
    // button, which puts it away again (`keep`: a window too short to stand
    // it over the button sets it beside it, board.js).
    boardAnchor: () => {
      const k = shopBoxOf(key);
      return k && { x: k.x - P * 4, y: k.y, w: k.w + P * 8, h: k.h, side: 'right', keep: k };
    },
    ...more
  };
};

// A station the camp builds, while it is not standing: its lot, for the build
// sign staked in it (buildsign.js). Its row is the shack's build row for it,
// listed on the shack's board; the sign stands in the station's drawing at
// its middle, on the floor as the floor runs under it.
const lotOf = card => ({
  id: () => card,
  row: () => (closed(card) ? afterRow(`after-build-${card}`) : null),
  board: 'after-shack',
  box: () => stationBox(card),
  mid: () => drawnMid(card),
  floor: floorAt,
  name: NAMES[card]
});

// In the order a press asks them: the standing stations, the grove, God's camp.
const STATION_CARDS = ['mill', 'workshop', 'shack', 'pedestal'];
export const AFTER_STATION_ROWS = [
  ...STATION_CARDS.map(card => row(card, {
    // Standing only once built: a station not yet built has no board and no
    // button, and its drawing opens nothing; its build sign is the way in,
    // and the shack's board the other.
    open: () => live() && built(card),
    ...(card in AFTER_BUILDS ? { lot: lotOf(card) } : {})
  })),
  // A press on a tree is the saw's (after/gestures.js).
  row('grove', { open: live }),
  // The counted piles at their brims (after/piles.js): each wears the same
  // mark over its plot, and its hover is the yard's own "pile is full".
  ...PILED.map(what => ({
    key: `after-pile-${what}`, place: 'after', glyph: 'crate', after: [], needs: () => false,
    get name() { return msg(PILE_NAMES[what]); },
    open: () => live() && built(pileOwner(what)), stand: () => pileTop(what), hit: () => false,
    pile: () => pileFull(what)
  })),
  row('crowd', {
    open: live,
    // God's camp: his middle, sliding at his layer's rate, and the main
    // plane's line, which his stage's front stands on
    line: () => ({ x: godMid(mid()), y: afterFloor() + AFTER_ROSTER_DOWN + AFTER_ROSTER_SHOP_DROP }),
    stand: () => (crowdAt ? { x: crowdAt.x - P, y: crowdAt.y - P, w: P * 2, h: P * 2 }
                          : { x: godMid(mid()) - P, y: faceY() - P, w: P * 2, h: P * 2 }),
    hit: (x, y) => godCampAt(x, y, mid())
  })
];
// Every station with a board hands its button to the roster, shown while the
// station's board can be asked for: once it stands.
const SHOP_ROWS = AFTER_STATION_ROWS.filter(r => r.board && r.line)
  .map(r => ({ board: r.key, place: 'after', show: () => r.open() && !(globalThis.__buildBtnMock && closed(r.key.slice(6))), line: r.line })); // MOCK build-button-in-the-world  no UPGRADES on a station not yet built
rosterShops('after', () => SHOP_ROWS);
