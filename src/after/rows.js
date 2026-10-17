// The camp's cards: what each of act 3's stations sells, and the buying
// (DESIGN.md, "Acts 3 and 4", act 3; the owner's settled calls, 2026-10-18).
//
// No bands and no ladders up here (call 12, settled: act 3 is outside the
// eight-rungs rule). A card sells its posts and two or three short named
// upgrades, each a change on screen, paid in rebel, timber and paper
// (AFTER_UPGRADES): bought once, but for the grove's plots, a plot a press.
// A post is a member wanted at the station (bodies.js): rebel a post, each
// dearer, every station's counted together, and a member walks from the camp
// to hold it -- nobody waiting, it stands empty. The hall sells the stations'
// doors. The mill's fence is bought, and is then a dial on its card.
//
// The act's coins are not the yard's (words.js `purse`, upgrades.js `take`):
// nothing carries a coin up through the cloud floor, so a row here is bought
// through `buyAfter`, which reads and spends `S.after`, never `buy`. The cards
// keep the yard's shape -- `rung`, `rungs`, `from`, `to`, `bill`, `show`,
// `dead` -- so a board can draw them the way it draws any row; which board
// opens where is `cardAt`.

import { S } from '../state.js';
import { msg } from '../lang.js';
import { P, AFTER_UPGRADES, AFTER_JOBS, AFTER_JOB_POST, AFTER_POST_REBEL0, AFTER_POST_RATE, AFTER_DOORS,
         AFTER_FENCE_STEPS, AFTER_CARDS } from '../config.js';
import { registerBoard } from '../boardrows.js';
import { upCount, built, fenceOn } from './levels.js';
import { postsOf, postCount, addPost } from './bodies.js';
import { clearPlot } from './grove.js';
import { fenceSplit, setFence } from './mill.js';
import { stationBox, plotX, groveX1, afterFloor } from './place.js';

// --- the purse ---------------------------------------------------------------------------
// What the camp holds of a coin: rebel on the act, the rest the chain's stock.
export function afterPurse(coin) {
  const a = S.after;
  if (!a) return 0;
  if (coin === 'rebel') return a.rebel;
  return a.stock[coin] || 0;
}
// The act's coin's name, a plain label until the owner words it, for a
// board's bill once the act's boards are on the pointer.
export const rebelSaid = () => msg('after-coin-rebel');
function spendCoin(coin, n) {
  const a = S.after;
  if (coin === 'rebel') a.rebel -= n; else a.stock[coin] -= n;
}

// Whether a station's card is up: its station standing.
export const cardOpen = card => built(card);

// --- the named upgrades ----------------------------------------------------------------------
const UP_NAMES = {
  'after-shout': () => msg('after-row-shout'), 'after-axe': () => msg('after-row-axe'),
  'after-plot': () => msg('after-row-plot'), 'after-grow': () => msg('after-row-grow'),
  'after-tree': () => msg('after-row-tree'), 'after-stumps': () => msg('after-row-stumps'),
  'after-blade': () => msg('after-row-blade'), 'after-fence': () => msg('after-row-fence'),
  'after-bench': () => msg('after-row-bench'), 'after-signreach': () => msg('after-row-signreach'),
  'after-vat': () => msg('after-row-vat'), 'after-stack': () => msg('after-row-stack'),
  'after-posterreach': () => msg('after-row-posterreach')
};
// What a purchase does beyond counting itself: a plot cleared and a sapling
// set in it; the axe owed to its beat (rebel.js, `axeDue`).
const UP_DOES = {
  'after-plot': () => clearPlot(),
  'after-axe': () => { S.after.axeBought = true; }
};
const upRow = key => {
  const { card, bills } = AFTER_UPGRADES[key];
  return {
    key, name: UP_NAMES[key](), card,
    rung: () => upCount(key), rungs: () => bills.length,
    bill: () => bills[Math.min(upCount(key), bills.length - 1)].map(([c, n]) => [c, n]),
    show: () => cardOpen(card),
    buy: () => { S.after.ups[key] = upCount(key) + 1; S.after.upAt[key] = S.after.t; UP_DOES[key]?.(); }
  };
};

// --- the posts ---------------------------------------------------------------------------
export const postRebel = () => Math.round(AFTER_POST_REBEL0 * Math.pow(AFTER_POST_RATE, postCount()));
const POST_NAMES = {
  agitator: () => msg('after-job-agitator'), woodcutter: () => msg('after-job-woodcutter'),
  hauler: () => msg('after-job-hauler'), sawyer: () => msg('after-job-sawyer'),
  pulper: () => msg('after-job-pulper'), joiner: () => msg('after-job-joiner'),
  carrier: () => msg('after-job-carrier'), printer: () => msg('after-job-printer'),
  paster: () => msg('after-job-paster')
};
const postRow = job => ({
  key: `after-post-${job}`, name: POST_NAMES[job](), card: AFTER_JOB_POST[job], repeats: true, post: job,
  from: () => postsOf(job), to: () => postsOf(job) + 1,
  bill: () => [['rebel', postRebel()]],
  show: () => cardOpen(AFTER_JOB_POST[job]),
  buy: () => { addPost(job); }
});

// --- the hall's doors, and the fence's dial ------------------------------------------------
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
// The fence's cut: a dial on the mill's card once the fence is bought, not a
// purchase (`setAfterDial`).
const CUT_ROW = {
  key: 'after-cut', name: msg('after-row-cut'), card: 'mill', dial: true,
  steps: AFTER_FENCE_STEPS, value: () => fenceSplit(), set: v => setFence(v),
  show: () => cardOpen('mill') && fenceOn()
};

export const AFTER_ROWS = [
  ...AFTER_JOBS.map(postRow),
  ...Object.keys(AFTER_UPGRADES).map(upRow),
  ...Object.keys(AFTER_DOORS).map(doorRow),
  CUT_ROW
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
  for (const [c, n] of afterBill(u)) spendCoin(c, n);
  u.buy();
  S.shopStale = true;
  return true;
}
export function setAfterDial(key, v) {
  const u = afterRow(key);
  return !!(u && u.dial && u.show() && u.set(v));
}

// --- the boards ----------------------------------------------------------------------------
// A card's rows, and its planks: its posts, then its upgrades (and the
// mill's dial); the hall, its doors. Registered under `after-<card>` so a
// board can be opened on one the way any station's is (boardrows.js).
const sectionsOf = card => {
  if (card === 'hall') return [{ key: 'after-build', title: msg('after-sect-build'), keys: Object.keys(AFTER_DOORS).map(s => `after-door-${s}`) }];
  const rows = AFTER_ROWS.filter(u => u.card === card);
  return [{ key: `after-${card}-posts`, title: msg('after-sect-posts'), keys: rows.filter(u => u.post).map(u => u.key) },
          { key: `after-${card}`, title: msg('after-sect-card'), keys: rows.filter(u => !u.post).map(u => u.key) }]
    .filter(s => s.keys.length);
};
export const afterBoard = card => ({ rows: AFTER_ROWS.filter(u => u.card === card), sections: sectionsOf(card) });
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
