// The camp's cards: what each of act 3's stations sells, and the buying
// (DESIGN.md, "Acts 3 and 4", act 3; the owner's settled calls, 2026-10-18).
//
// No bands and no ladders up here (call 12, settled: act 3 is outside the
// eight-rungs rule). A card sells its posts and two or three short named
// upgrades, each a change on screen, paid in rebel, timber and paper and the
// yard's coins (AFTER_UPGRADES): bought once, but for the grove's plots, a
// plot a press. A post is a member wanted at the station (bodies.js): rebel
// and dust a post, each dearer, every station's counted together, and a
// member walks from the camp
// to hold it -- nobody waiting, it stands empty. The construction shack sells
// every station, all of them on its board and priced from the start, each
// raised a piece at a time once bought (build.js).
//
// A bill names the act's coins (rebel, timber, paper: `S.after`) and the
// yard's (dust, crops, ore, sparks: DESIGN.md, "The yard pays too"), so a
// row here is bought through `buyAfter`, never `buy`: the act's coins come
// off `S.after`, the yard's through the yard's own purse and `take`
// (words.js, upgrades.js), the yard's counter dropping as they leave. They
// are lifted off the yard's pile and fly up to the thin patch in the cloud
// floor, and come out of it as motes that arc to the station bought
// (`S.after.coins`, drawn by render/aftercoins.js). The cards keep the
// yard's shape -- `rung`, `rungs`, `from`, `to`, `bill`, `show`, `dead` -- so
// a board can draw them the way it draws any row; which board opens where is
// `cardAt`.

import { S } from '../state.js';
import { msg } from '../lang.js';
import { P, AFTER_UPGRADES, AFTER_JOBS, AFTER_JOB_POST, AFTER_POST_REBEL0, AFTER_POST_RATE, AFTER_BUILDS,
         AFTER_CARDS, AFTER_POST_DUST, AFTER_YARD_COINS, AFTER_TAG_ORDER, AFTER_PATCH_AT,
         AFTER_COIN_MOTES, AFTER_COIN_UNDER_S, AFTER_COIN_STAGGER_S, AFTER_COIN_SPREAD, AFTER_COIN_LIFE_S,
         SHADES, SHARD_CELL, SPORE_CELL, SPARK_CELL, FIND_TONES, SCALE_SHADE, SCALE_SPREAD } from '../config.js';
import { registerBoard } from '../boardrows.js';
import { purse, MARK, priceText } from '../words.js';
import { take } from '../upgrades.js';
import { payTo } from '../pit.js';
import { upCount, built, raising } from './levels.js';
import { postsOf, postCount, addPost } from './bodies.js';
import { clearPlot } from './grove.js';
import { raiseStation } from './build.js';
import { stationBox, plotX, groveX1, afterFloor, afterX0 } from './place.js';

// --- the purse ---------------------------------------------------------------------------
const isYardCoin = coin => AFTER_YARD_COINS.includes(coin);
// What the camp holds of a coin: rebel on the act, the yard's coins the
// yard's purse, the rest the chain's stock.
export function afterPurse(coin) {
  if (isYardCoin(coin)) return purse(coin);
  const a = S.after;
  if (!a) return 0;
  if (coin === 'rebel') return a.rebel;
  return a.stock[coin] || 0;
}
// The act's coin's name, a plain label until the owner words it, for a
// board's bill once the act's boards are on the pointer.
export const rebelSaid = () => msg('after-coin-rebel');
// The act's own coins, said as words: the yard's are drawn as the yard's marks.
const ACT_SAID = { rebel: rebelSaid, timber: () => msg('after-coin-timber'), paper: () => msg('after-coin-paper') };
function spendCoin(coin, n) {
  const a = S.after;
  if (coin === 'rebel') a.rebel -= n; else a.stock[coin] -= n;
}

// --- the yard's coins coming up ---------------------------------------------------------
// The thin patch in the cloud floor the yard's coins come up through.
export const patchAt = () => ({ x: afterX0() + AFTER_PATCH_AT * P, y: afterFloor() });
// Where a bought row's coins land: over the station's roof, or over the
// middle of the grove's ground.
const landAt = key => {
  if (key === 'grove') return { x: (plotX(0) + groveX1()) / 2, y: afterFloor() - P * 8 };
  const b = stationBox(key);
  return { x: b.x + b.w / 2, y: b.y - P * 2 };
};
// A mote's tone, the yard's grain it stands for: a grey of the dust's run, or
// a find's tone of its kind, stepped by the mote's place in its run so a
// handful is a speckle the way a heap is.
const FIND_BASE = { spore: SPORE_CELL, shard: SHARD_CELL, spark: SPARK_CELL };
// A scale is no grain of the yard's: its mote is in a scale's own shade, stepped
// either side of it as the deep deals them (deep/scales.js, `shadeNear`).
const toneOf = (coin, i) => (coin === 'dust' ? 1 + (i % SHADES.length)
  : coin === 'scale' ? SCALE_SHADE + (i % (2 * SCALE_SPREAD + 1)) - SCALE_SPREAD
  : FIND_BASE[coin] + (i % FIND_TONES));
// The yard's share of a bill paid: off the yard's pile through `take`, its
// grains sent up to the patch (`payTo`), and the motes that come out of the
// patch after them, each stamped with when it comes out and where it lands.
// Motes that have landed are cleared here, the one place the list is written.
function payYard(bill, key) {
  const a = S.after;
  const patch = patchAt(), to = landAt(key);
  a.coins = (a.coins || []).filter(m => a.t - m.at < AFTER_COIN_LIFE_S);
  payTo(patch.x, patch.y);
  for (const [coin, n] of bill) take(coin, n, patch);   // the deep's scales lift off the bed bound for the patch too
  payTo();
  let k = 0;
  for (const [coin, n] of bill) {
    for (let i = 0; i < Math.min(n, AFTER_COIN_MOTES); i++, k++) {
      const off = ((k * 7) % (2 * AFTER_COIN_SPREAD + 1)) - AFTER_COIN_SPREAD;
      a.coins.push({ v: toneOf(coin, i), x0: patch.x + off * P, y0: patch.y, tx: to.x, ty: to.y,
                     at: a.t + AFTER_COIN_UNDER_S + k * AFTER_COIN_STAGGER_S });
    }
  }
}

// Whether a station's card is up: its station standing.
export const cardOpen = card => built(card);

// --- the named upgrades ----------------------------------------------------------------------
const UP_NAMES = {
  'after-shout': () => msg('after-row-shout'), 'after-axe': () => msg('after-row-axe'),
  'after-plot': () => msg('after-row-plot'), 'after-grow': () => msg('after-row-grow'),
  'after-tree': () => msg('after-row-tree'), 'after-stumps': () => msg('after-row-stumps'),
  'after-blade': () => msg('after-row-blade'), 'after-heap': () => msg('after-row-heap'),
  'after-drum': () => msg('after-row-drum'), 'after-spout': () => msg('after-row-spout'),
  'after-dry': () => msg('after-row-dry'),
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
const postDust = () => AFTER_POST_DUST[Math.min(postCount(), AFTER_POST_DUST.length - 1)];
const POST_NAMES = {
  agitator: () => msg('after-job-agitator'), woodcutter: () => msg('after-job-woodcutter'),
  hauler: () => msg('after-job-hauler'), sawyer: () => msg('after-job-sawyer'), feeder: () => msg('after-job-feeder'),
  pulper: () => msg('after-job-pulper'), joiner: () => msg('after-job-joiner'),
  carrier: () => msg('after-job-carrier'), printer: () => msg('after-job-printer'),
  paster: () => msg('after-job-paster')
};
const postRow = job => ({
  key: `after-post-${job}`, name: POST_NAMES[job](), card: AFTER_JOB_POST[job], repeats: true, post: job,
  from: () => postsOf(job), to: () => postsOf(job) + 1,
  bill: () => [['rebel', postRebel()], ['dust', postDust()]],
  show: () => cardOpen(AFTER_JOB_POST[job]),
  buy: () => { addPost(job); }
});

// --- the shack: every station ------------------------------------------------------------
// On the board from the act's first frame, each with its price; one that
// needs another standing first is dead until then, saying which.
const BUILD_NAMES = {
  mill: () => msg('after-build-mill'), chipper: () => msg('after-build-chipper'),
  workshop: () => msg('after-build-workshop'), papermill: () => msg('after-build-papermill'),
  press: () => msg('after-build-press')
};
const WAITS = { workshop: () => msg('after-wait-mill'), papermill: () => msg('after-wait-sawdust'),
                press: () => msg('after-wait-papermill') };
const needsMet = st => { const n = AFTER_BUILDS[st].needs; return !n.length || n.some(k => built(k)); };
const buildRow = st => ({
  key: `after-build-${st}`, name: BUILD_NAMES[st](), card: 'shack', lands: st,
  rung: () => (built(st) || raising(st) ? 1 : 0), rungs: () => 1,
  bill: () => AFTER_BUILDS[st].bill.map(([c, n]) => [c, n]),
  show: () => !!S.after,
  dead: () => !needsMet(st),
  waits: () => (needsMet(st) ? null : WAITS[st]()),
  buy: () => { raiseStation(st); }
});

export const AFTER_ROWS = [
  ...AFTER_JOBS.map(postRow),
  ...Object.keys(AFTER_UPGRADES).map(upRow),
  ...Object.keys(AFTER_BUILDS).map(buildRow)
];
export const afterRow = key => AFTER_ROWS.find(u => u.key === key) || null;

// --- buying ------------------------------------------------------------------------------
export const afterMaxed = u => !!u.rung && u.rung() >= u.rungs();
export const afterBill = u => (u.bill ? u.bill() : []);
export const afterCanPay = u => afterBill(u).every(([c, n]) => afterPurse(c) >= n);
// A row's price tag, written the way a yard card writes one (shop.js
// `tagOf`): a cell a coin, `have` or `short` off what is held of it, so a
// card short of any coin takes the dashed edge (style.css), the yard's coins
// in the yard's marks and the act's said as words, the act's first.
export function afterTag(u) {
  const bill = afterBill(u).filter(([, n]) => n > 0)
    .sort((a, b) => AFTER_TAG_ORDER.indexOf(a[0]) - AFTER_TAG_ORDER.indexOf(b[0]));
  return bill.map(([c, n]) => `<span class="${afterPurse(c) >= n ? 'have' : 'short'}">`
    + `${isYardCoin(c) ? MARK[c] : ACT_SAID[c]()} ${priceText(c, n)}</span>`).join('');
}
// True when something was bought: offered, not dead, not finished, paid in
// full, and then the row's own `buy`. The act's coins come off the camp; the
// yard's off the yard, flying to the station bought (a shack row's station,
// else its card's).
export function buyAfter(u) {
  if (typeof u === 'string') u = afterRow(u);
  if (!u || u.dial || !S.after || !u.show() || u.dead?.() || afterMaxed(u) || !afterCanPay(u)) return false;
  const bill = afterBill(u);
  for (const [c, n] of bill) if (!isYardCoin(c)) spendCoin(c, n);
  const yard = bill.filter(([c, n]) => isYardCoin(c) && n > 0);
  if (yard.length) payYard(yard, u.lands || u.card);
  u.buy();
  S.shopStale = true;
  return true;
}

// --- the boards ----------------------------------------------------------------------------
// A card's rows, and its planks: its posts, then its upgrades; the shack,
// every station. Registered under `after-<card>` so a
// board can be opened on one the way any station's is (boardrows.js).
const sectionsOf = card => {
  if (card === 'shack') return [{ key: 'after-build', title: msg('after-sect-build'), keys: Object.keys(AFTER_BUILDS).map(s => `after-build-${s}`) }];
  const rows = AFTER_ROWS.filter(u => u.card === card);
  return [{ key: `after-${card}-posts`, title: msg('after-sect-posts'), keys: rows.filter(u => u.post).map(u => u.key) },
          { key: `after-${card}`, title: msg('after-sect-card'), keys: rows.filter(u => !u.post).map(u => u.key) }]
    .filter(s => s.keys.length);
};
export const afterBoard = card => ({ rows: AFTER_ROWS.filter(u => u.card === card), sections: sectionsOf(card) });
for (const card of AFTER_CARDS)
  registerBoard(`after-${card}`, { rows: () => afterBoard(card).rows, sections: () => afterBoard(card).sections });

// The card a world point opens: the strip along a standing station's roof,
// its posts (the box below is worked by the click, rebel.js `workAt`), or
// the whole of a station nobody works by hand; or the grove's ground. Null
// anywhere else.
export function cardAt(x, y) {
  if (!S.after) return null;
  for (const card of AFTER_CARDS) {
    if (card === 'grove') continue;
    const b = stationBox(card);
    const roof = card === 'pedestal' || card === 'shack' ? b.y + b.h : b.y + P * 2;
    if (b && built(card) && x >= b.x && x < b.x + b.w && y >= b.y - P * 3 && y < roof) return card;
  }
  if (built('grove') && x >= plotX(0) - P * 4 && x < groveX1() && y <= afterFloor() && y >= afterFloor() - P * 20) return 'grove';
  return null;
}
