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
// row here is bought through the one `buy` (upgrades.js), each coin paid
// through `take` and its place's purse (words.js): the act's coins come off
// `S.after`, the yard's off the yard, its counter dropping as they leave. The
// yard's are lifted off the pile and fly up to the thin patch in the cloud
// floor (`flyFrom`), and come out of it as motes that arc to the station
// bought (`paid`; `S.after.coins`, drawn by render/aftercoins.js). The cards keep the
// yard's shape -- `rung`, `rungs`, `from`, `to`, `bill`, `show`, `dead` -- and the yard's
// board draws them as it draws any row: the pointer at a station opens its
// board as it does the yard's (each card is a row of the station table,
// after/stations.js; the yard's sheet, its posts' shelf then its upgrades'),
// the yard's purse and marks know the act's coins (words.js).

import { S } from '../state.js';
import { msg } from '../lang.js';
import { P, AFTER_UPGRADES, AFTER_JOBS, AFTER_JOB_POST, AFTER_POST_REBEL0, AFTER_POST_RATE, AFTER_BUILDS,
         AFTER_CARDS, AFTER_POST_DUST, AFTER_YARD_COINS, AFTER_TAG_ORDER, AFTER_PATCH_AT,
         AFTER_COIN_MOTES, AFTER_COIN_UNDER_S, AFTER_COIN_STAGGER_S, AFTER_COIN_SPREAD, AFTER_COIN_LIFE_S,
         MEET_MEMBERS, SLOW_SHARE, STRIKE_SHARE, AFTER_BOARD_SLOTS, SHADES, SHARD_CELL, SPORE_CELL, SPARK_CELL, FIND_TONES, SCALE_SHADE, SCALE_SPREAD } from '../config.js';
import { registerBoard, openBoardByKey } from '../boardrows.js';
import { purse, leftText } from '../words.js';
import { payTo } from '../pit.js';
import { upCount, built, raising } from './levels.js';
import { postsOf, postCount, addPost } from './bodies.js';
import { clearPlot } from './grove.js';
import { raiseStation } from './build.js';
import { stationBox, plotX, groveX1, afterFloor, afterX0, AP } from './place.js';
import { union, support } from './union.js';
import { setCrowdAt } from './stations.js';

// --- the purse ---------------------------------------------------------------------------
const isYardCoin = coin => AFTER_YARD_COINS.includes(coin);
// What the camp holds of a coin: the yard's purse knows the act's coins
// (words.js `purse`: rebel on the act, timber and paper the chain's stock).
export const afterPurse = coin => purse(coin);
// The act's coin's name, a plain label until the owner words it.
export const rebelSaid = () => msg('after-coin-rebel');

// --- the yard's coins coming up ---------------------------------------------------------
// The thin patch in the cloud floor the yard's coins come up through.
export const patchAt = () => ({ x: afterX0() + AFTER_PATCH_AT * P, y: afterFloor() });
// Where a bought row's coins land: over the station's roof, or over the
// middle of the grove's ground.
const landAt = key => {
  if (key === 'grove') return { x: (plotX(0) + groveX1()) / 2, y: afterFloor() - AP * 8 };
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
// The motes that come out of the patch after the yard's grains, each stamped
// with when it comes out and where it lands. `buy` has already taken the
// coins (the grains rising to `flyFrom`); this is the show that follows.
// Motes that have landed are cleared here, the one place the list is written.
function paid(u, bill) {
  const a = S.after;
  const patch = patchAt(), to = landAt(u.lands || u.card);
  a.coins = (a.coins || []).filter(m => a.t - m.at < AFTER_COIN_LIFE_S);
  let k = 0;
  for (const [coin, n] of bill.filter(([c, n]) => isYardCoin(c) && n > 0)) {
    for (let i = 0; i < Math.min(n, AFTER_COIN_MOTES); i++, k++) {
      const off = ((k * 7) % (2 * AFTER_COIN_SPREAD + 1)) - AFTER_COIN_SPREAD;
      a.coins.push({ v: toneOf(coin, i), x0: patch.x + off * P, y0: patch.y, tx: to.x, ty: to.y,
                     at: a.t + AFTER_COIN_UNDER_S + k * AFTER_COIN_STAGGER_S });
    }
  }
}

// Whether a station's card is up: its station standing.
export const cardOpen = card => built(card);

// What every row up here carries for the yard's board: its bill written the
// act's coins first, its place (the yard's boards being shut is not about
// it), the patch the yard's grains rise to and the motes that follow.
const ACT_ROW = { coinOrder: AFTER_TAG_ORDER, place: 'after', flyFrom: () => patchAt(), paid };

// --- the named upgrades ----------------------------------------------------------------------
const UP_NAMES = {
  'after-podium': () => msg('after-row-podium'), 'after-axe': () => msg('after-row-axe'),
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
// A row with `marks` (the podium ladder) opens each rung when the union's
// support reaches its mark, a share of the strike's: dead until then, saying
// the share it waits on.
const markOf = key => AFTER_UPGRADES[key].marks?.[upCount(key)];
const waitsOn = key => { const m = markOf(key); return m != null && support() < m * STRIKE_SHARE; };
const upRow = key => {
  const { card, bills } = AFTER_UPGRADES[key];
  return {
    key, name: UP_NAMES[key](), card, ...ACT_ROW,
    rung: () => upCount(key), rungs: () => bills.length,
    bill: () => bills[Math.min(upCount(key), bills.length - 1)].map(([c, n]) => [c, n]),
    show: () => cardOpen(card),
    dead: () => waitsOn(key),
    waits: () => (waitsOn(key) ? msg('after-wait-support', { share: Math.round(markOf(key) * 100) }) : null),
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
  key: `after-post-${job}`, name: POST_NAMES[job](), card: AFTER_JOB_POST[job], repeats: true, post: job, ...ACT_ROW,
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
  key: `after-build-${st}`, name: BUILD_NAMES[st](), card: 'shack', lands: st, ...ACT_ROW,
  // A station standing stays on the shack's board, done, whatever the
  // finished-rows switch says: the board is the list of what the camp has.
  keep: true,
  rung: () => (built(st) || raising(st) ? 1 : 0), rungs: () => 1,
  bill: () => AFTER_BUILDS[st].bill.map(([c, n]) => [c, n]),
  show: () => !!S.after,
  dead: () => !needsMet(st),
  waits: () => (needsMet(st) ? null : WAITS[st]()),
  buy: () => { raiseStation(st); }
});

// Nothing up here is for sale before the act has begun.
const inAct = u => ({ ...u, show: () => !!S.after && u.show() });
export const AFTER_ROWS = [
  ...AFTER_JOBS.map(postRow),
  ...Object.keys(AFTER_UPGRADES).map(upRow),
  ...Object.keys(AFTER_BUILDS).map(buildRow)
].map(inAct);
export const afterRow = key => AFTER_ROWS.find(u => u.key === key) || null;

// --- buying ------------------------------------------------------------------------------
export const afterMaxed = u => !!u.rung && u.rung() >= u.rungs();
export const afterBill = u => (u.bill ? u.bill() : []);

// --- the boards ----------------------------------------------------------------------------
// A card's rows, and its planks (tabs choice A, the owner, 2026-10-18): its
// posts' shelf, its heading counting the members posted there, then its
// upgrades'; the shack one shelf, every station in camp order. Registered
// under `after-<card>` (boardrows.js), the key of the card's station row.
const jobsAt = card => AFTER_JOBS.filter(j => AFTER_JOB_POST[j] === card);
const sectionsOf = card => {
  if (card === 'shack') return [{ key: 'after-build', title: msg('after-sect-build'), keys: Object.keys(AFTER_BUILDS).map(s => `after-build-${s}`) }];
  const rows = AFTER_ROWS.filter(u => u.card === card);
  return [{ key: `after-${card}-posts`, title: msg('after-sect-posts'), keys: rows.filter(u => u.post).map(u => u.key),
            heads: () => jobsAt(card).reduce((n, j) => n + postsOf(j), 0) },
          { key: `after-${card}`, title: msg('after-sect-card'), keys: rows.filter(u => !u.post).map(u => u.key) }]
    .filter(s => s.keys.length);
};
export const afterBoard = card => ({ rows: AFTER_ROWS.filter(u => u.card === card), sections: sectionsOf(card) });
// Each board's title, the ground it stands over and the click that opens it
// are its station row's (after/stations.js, in the one station table).
for (const card of AFTER_CARDS)
  registerBoard(`after-${card}`, { rows: () => afterBoard(card).rows, sections: () => afterBoard(card).sections,
                                   slots: AFTER_BOARD_SLOTS });

// --- the crowd's board -----------------------------------------------------------------------
// God's crowd sells nothing: its board is readings (a ledger, as the yard's
// books are), how the union stands against the throne -- the share of God's
// yard won, the members, each gate and how near, and when the throne next
// speaks. Read live off the sim every frame it is open.
const pctSaid = v => msg('after-crowd-pct', { n: Math.floor(v * 100) });
// A gate's reading: reached, or how far along toward it.
const gateSays = (k, have, want, say) => () =>
  (S.after && S.after.gate > k ? msg('after-crowd-reached') : msg('after-crowd-of', { have: say(have()), want: say(want) }));
const readout = (key, name, price) => ({ key, name, price, read: true, show: () => !!S.after,
                                         dead: () => false, cost: () => 0, buy: () => {} });
// Seconds to the throne's next speech, or null while none is set.
export const speechIn = () => { const sp = S.after?.speech; return sp ? Math.max(0, sp.next - S.after.t) : null; };
export const CROWD_ROWS = [
  readout('after-crowd-share', msg('after-crowd-share'), () => pctSaid(S.after ? support() : 0)),
  readout('after-crowd-members', msg('after-crowd-members'), () => String(S.after ? union() : 0)),
  readout('after-crowd-speech', msg('after-crowd-speech'), () => { const s = speechIn(); return s == null ? msg('after-crowd-none') : leftText(s * 1000); }),
  readout('after-crowd-meeting', msg('after-crowd-meeting'), gateSays(0, () => union(), MEET_MEMBERS, String)),
  readout('after-crowd-slowdown', msg('after-crowd-slowdown'), gateSays(1, () => support(), SLOW_SHARE, pctSaid)),
  readout('after-crowd-strike', msg('after-crowd-strike'), gateSays(2, () => support(), STRIKE_SHARE, pctSaid))
];
const CROWD_SECTIONS = [
  { key: 'after-crowd', title: msg('after-sect-crowd'), keys: ['after-crowd-share', 'after-crowd-members', 'after-crowd-speech'] },
  { key: 'after-gates', title: msg('after-sect-gates'), keys: ['after-crowd-meeting', 'after-crowd-slowdown', 'after-crowd-strike'] }
];
registerBoard('after-crowd', { rows: () => CROWD_ROWS, sections: () => CROWD_SECTIONS, ledger: true });

// Opens a board in the yard's sheet by its card (the pad's Y, the scenes):
// `key` a card of AFTER_CARDS or 'crowd', `at` the world point the crowd's
// board stands over (null: over God as drawn). True when it opened; false
// with no page to open it on (the node checks).
export function openAfterBoard(key, at = null) {
  if (!S.after || !(AFTER_CARDS.includes(key) || key === 'crowd')) return false;
  if (key === 'crowd') setCrowdAt(at);
  return openBoardByKey(`after-${key}`);
}
