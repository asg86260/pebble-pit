// The camp's cards: what each of act 3's stations sells, and the buying
// (DESIGN.md, "Acts 3 and 4", act 3, "Ladders in bands, and what is bought
// with what").
//
// Every ladder is one card through `tierRows`, eight rungs in its bands, a
// written table (AFTER_LADDERS, in LADDERS' shape): faith only, then faith and
// timber, then faith, timber and paper, then timber, paper and a pledge
// (AFTER_BANDS; call 12 open, the pledge the placeholder in the top band's
// seat -- a member walks out of the crowd and keeps the station for good).
// Ink is never a bill. The hall sells hands: a volunteer a press, each dearer,
// a member out of the crowd every one; and the doors of the stations each
// gate offers. The mill's card carries the fence, a dial.
//
// The act's coins are not the yard's (words.js `purse`, upgrades.js `take`):
// nothing carries a coin up through the cloud floor, so a row here is bought
// through `buyAfter`, which reads and spends `S.after`, never `buy`. The cards
// keep the yard's shape -- `rung`, `rungs`, `from`, `to`, `bill`, `show`,
// `dead` -- so a board can draw them the way it draws any row; which board
// opens where is `cardAt` (Track C wires it to the pointer).

import { S } from '../state.js';
import { msg } from '../lang.js';
import { P, TIER_BAND, AFTER_BANDS, AFTER_PER, AFTER_LADDERS, AFTER_LADDER_CARD, AFTER_JOBS, AFTER_JOB_POST,
         AFTER_HIRE_FAITH0, AFTER_HIRE_RATE, AFTER_DOORS, AFTER_FENCE_STEPS, AFTER_CARDS } from '../config.js';
import { tierRows, named } from '../upgrades/tiers.js';
import { registerBoard } from '../boardrows.js';
import { rungAt, ladderValue, built } from './levels.js';
import { members } from './union.js';
import { hireVolunteer, volunteerCount, bodiesOf } from './bodies.js';
import { fenceSplit, setFence } from './mill.js';
import { stationBox, plotX, groveX1, afterFloor } from './place.js';

// --- the purse ---------------------------------------------------------------------------
// What the camp holds of a coin: faith and ink on the act, the chain's stock,
// and a pledge is a member still in the crowd.
export function afterPurse(coin) {
  const a = S.after;
  if (!a) return 0;
  if (coin === 'faith') return a.faith;
  if (coin === 'ink') return a.ink;
  if (coin === 'pledge') return members();
  return a.stock[coin] || 0;
}
// Spent from where it is kept. A pledge is a member walking out of the crowd
// to keep the station `card`.
function spendCoin(coin, n, card) {
  const a = S.after;
  if (coin === 'faith') a.faith -= n;
  else if (coin === 'ink') a.ink -= n;
  else if (coin === 'pledge') for (let k = 0; k < n; k++) hireVolunteer('keeper', card);
  else a.stock[coin] -= n;
}

// --- the ladders ---------------------------------------------------------------------------
// The next rung's bill: its written faith cost turned into each of its band's
// coins (AFTER_PER), a pledge one member.
export function ladderBill(key) {
  const lvl = rungAt(key);
  const cost = AFTER_LADDERS[key].cost[Math.min(lvl, AFTER_LADDERS[key].cost.length - 1)];
  const coins = AFTER_BANDS[Math.min(AFTER_BANDS.length - 1, Math.floor(lvl / TIER_BAND))];
  return coins.map(c => [c, c === 'pledge' ? 1 : Math.max(1, Math.round(cost / AFTER_PER[c]))]);
}

// Whether a station's card is up: its station standing.
export const cardOpen = card => !!S.after && (card === 'grove' ? built('grove') : built(card));

const NAMES = {
  'after-puff': () => msg('after-row-puff'), 'after-axe': () => msg('after-row-axe'),
  'after-grow': () => msg('after-row-grow'), 'after-saw': () => msg('after-row-saw'),
  'after-joinery': () => msg('after-row-joinery'), 'after-pulp': () => msg('after-row-pulp'),
  'after-print': () => msg('after-row-print'), 'after-wring': () => msg('after-row-wring')
};
function ladder(key) {
  const card = AFTER_LADDER_CARD[key];
  const [row] = tierRows({
    field: { get: () => rungAt(key), set: v => { S.after.rungs[key] = v; } },
    value: lvl => ladderValue(key, lvl),
    // The axe's ladder is the hand's once it holds the axe.
    show: () => cardOpen(card) && (key !== 'after-axe' || !!S.after.axe),
    bands: named(key, NAMES[key]())
  });
  row.card = card;
  row.bill = () => ladderBill(key);
  // Every coin of the act is had from the act's first frame but the pledge,
  // and a pledge is a member: the press is dead only with none free.
  row.waits = () => null;
  row.dead = () => ladderBill(key).some(([c]) => c === 'pledge') && members() < 1;
  return row;
}

// --- the hall: hands, and the doors ----------------------------------------------------
export const hireFaith = () => Math.round(AFTER_HIRE_FAITH0 * Math.pow(AFTER_HIRE_RATE, volunteerCount()));
const HIRE_NAMES = {
  canvasser: () => msg('after-job-canvasser'), gatherer: () => msg('after-job-gatherer'),
  planter: () => msg('after-job-planter'), feller: () => msg('after-job-feller'),
  hauler: () => msg('after-job-hauler'), sawyer: () => msg('after-job-sawyer'),
  pulper: () => msg('after-job-pulper'), joiner: () => msg('after-job-joiner'),
  printer: () => msg('after-job-printer'), carrier: () => msg('after-job-carrier'),
  paster: () => msg('after-job-paster')
};
const hireRow = job => ({
  key: `after-hire-${job}`, name: HIRE_NAMES[job](), card: 'hall', repeats: true,
  from: () => bodiesOf(job).length, to: () => bodiesOf(job).length + 1,
  bill: () => [['faith', hireFaith()]],
  // Its post standing, or a job of the open cloud.
  show: () => !!S.after && (AFTER_JOB_POST[job] == null || built(AFTER_JOB_POST[job])),
  dead: () => members() < 1,
  waits: () => (members() < 1 ? msg('after-wait-member') : null),
  buy: () => { hireVolunteer(job); }
});
const DOOR_NAMES = {
  mill: () => msg('after-door-mill'), workshop: () => msg('after-door-workshop'),
  papermill: () => msg('after-door-papermill'), press: () => msg('after-door-press')
};
const doorRow = st => ({
  key: `after-door-${st}`, name: DOOR_NAMES[st](), card: 'hall',
  bill: () => AFTER_DOORS[st].bill.map(([c, n]) => [c, n]),
  show: () => !!S.after && S.after.gate >= AFTER_DOORS[st].gate && !built(st),
  buy: () => { S.after.built.push(st); S.after.builtAt[st] = S.after.t; }
});
// The fence: a dial on the mill's card, not a purchase (`setAfterDial`).
const FENCE_ROW = {
  key: 'after-fence', name: msg('after-row-fence'), card: 'mill', dial: true,
  steps: AFTER_FENCE_STEPS, value: () => fenceSplit(), set: v => setFence(v),
  show: () => cardOpen('mill')
};

export const AFTER_ROWS = [
  ...Object.keys(AFTER_LADDERS).map(ladder),
  ...AFTER_JOBS.map(hireRow),
  ...Object.keys(AFTER_DOORS).map(doorRow),
  FENCE_ROW
];
export const afterRow = key => AFTER_ROWS.find(u => u.key === key) || null;

// --- buying ------------------------------------------------------------------------------
export const afterMaxed = u => !!u.rung && u.rung() >= u.rungs();
export const afterBill = u => (u.bill ? u.bill() : []);
export const afterCanPay = u => afterBill(u).every(([c, n]) => afterPurse(c) >= n);
// True when something was bought: offered, not dead, not finished, paid in
// full, and then the row's own `buy`.
export function buyAfter(u) {
  if (typeof u === 'string') u = afterRow(u);
  if (!u || u.dial || !S.after || !u.show() || u.dead?.() || afterMaxed(u) || !afterCanPay(u)) return false;
  for (const [c, n] of afterBill(u)) spendCoin(c, n, u.card);
  u.buy();
  S.shopStale = true;
  return true;
}
export function setAfterDial(key, v) {
  const u = afterRow(key);
  return !!(u && u.dial && u.show() && u.set(v));
}

// --- the boards ----------------------------------------------------------------------------
// A card's rows, and its planks: the ladders, then (the hall) the hands and
// the doors. Registered under `after-<card>` so a board can be opened on one
// the way any station's is (boardrows.js).
const CARD_SECTIONS = {
  hall: () => [{ key: 'after-hands', title: msg('after-sect-hands'), keys: AFTER_JOBS.map(j => `after-hire-${j}`) },
               { key: 'after-build', title: msg('after-sect-build'), keys: Object.keys(AFTER_DOORS).map(s => `after-door-${s}`) }]
};
export const afterBoard = card => {
  const rows = AFTER_ROWS.filter(u => u.card === card);
  const sections = CARD_SECTIONS[card] ? CARD_SECTIONS[card]()
                 : [{ key: `after-${card}`, title: msg('after-sect-card'), keys: rows.map(u => u.key) }];
  return { rows, sections };
};
for (const card of AFTER_CARDS)
  registerBoard(`after-${card}`, { rows: () => afterBoard(card).rows, sections: () => afterBoard(card).sections });

// The card a world point opens: a standing station's box, or the grove's
// ground. Null anywhere else.
export function cardAt(x, y) {
  if (!S.after) return null;
  for (const card of AFTER_CARDS) {
    if (card === 'grove') continue;
    const b = stationBox(card);
    if (b && built(card) && x >= b.x && x < b.x + b.w && y >= b.y && y <= b.y + b.h) return card;
  }
  if (built('grove') && x >= plotX(0) - P * 4 && x < groveX1() && y <= afterFloor() && y >= afterFloor() - P * 20) return 'grove';
  return null;
}
