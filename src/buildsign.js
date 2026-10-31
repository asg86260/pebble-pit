// REVIEW build-sign
// The build sign: a signboard on a post staked in an empty lot, the name of
// what goes up there over its price, which buys the lot's first build (the
// owner, 2026-10-30, mock D of the review "build button in the world"; the
// name on the board where BUILD stood, and no hover, the same day). Every
// place's empty lots wear one: a station row says it has a lot (`lot`,
// stations.js), and that column is the whole of what a place supplies -- the
// row that builds it, the name it goes by, the ground it stands in, the floor
// under it. The rest is here, once.
//
// The sign is the board's row out in the world, so it asks the board's own
// questions and no others: it stands while the row is listed on its board
// (`revealed`, shop.js, the row's `show` behind its one-way `once` door), and
// while the board itself stands; it goes when the row is bought and in the
// works (`building`) or done (`maxed`); it is greyed where the board greys
// the row (`dead`), and each coin you are short of
// is greyed as the tile greys it. A press is the tile's press (`pressRow`),
// so the bill is taken and the builders walk as they do from the board.
//
// Drawn by render/buildsign.js; the pointer's two questions (is it over one,
// press it) are input.js's, asked here; it says nothing on a hover. Its ground is
// claimed in footprints.js (`signRects`), as the lot's.

import { S } from './state.js';
import { P, SHOP_BTN_PX, SHOP_BTN_PAD, SHOP_BTN_ADVANCE, FANG_MARK, AFTER_COIN_MARKS,
         SIGN_PLATE, SIGN_POST, SIGN_GAP, SIGN_COIN_GAP, SIGN_MARK, SIGN_HIT } from './config.js';
import { COIN_MARKS } from './glyphs.js';
import { STATIONS, open } from './stations.js';
import { revealed, pressRow, coinsOf } from './shop.js';
import { billOf, building, canPay } from './upgrades.js';
import { maxed, purse, fmt } from './words.js';
import { msg } from './lang.js';
import { standingIn } from './footprints.js';

// --- the lots --------------------------------------------------------------
// A coin's mark on the price line.
export const SIGN_MARKS = { dust: COIN_MARKS.dust, shard: COIN_MARKS.ore, spore: COIN_MARKS.crop, spark: COIN_MARKS.spark,
                            rebel: AFTER_COIN_MARKS.rebel, timber: AFTER_COIN_MARKS.timber, fang: FANG_MARK };

// The row a lot's sign sells, while the sign stands: listed on a board that
// is up, and neither in the works nor done.
function selling(lot) {
  const u = lot.row();
  if (!u || (lot.board && !open(lot.board))) return null;
  return revealed(u) && !maxed(u) && !building(u) ? u : null;
}

// --- the pieces, in world units ---------------------------------------------
// Widths worked out without measuring, as the UPGRADES button's are (roster.js,
// `shopW`): the node tier, which has no canvas, claims the same ground the
// page draws.
export const textW = s => Math.ceil(s.length * SHOP_BTN_PX * SHOP_BTN_ADVANCE);
// A coin's mark at whole pixels a cell, near the type's height.
export const markScale = g => Math.max(1, Math.round(SIGN_MARK / g.length));
// The price line: each coin's mark and its count, greyed where the purse is
// short of it; nothing to pay says so in a word.
function partsOf(bill, locked) {
  if (!bill.length) return [{ kind: 'text', s: msg('build-free'), short: locked, lead: 0 }];
  return bill.flatMap((c, i) => [
    ...(SIGN_MARKS[c.coin] ? [{ kind: 'mark', grid: SIGN_MARKS[c.coin], coin: c.coin, short: locked || c.short, lead: i ? SIGN_COIN_GAP : 0 }] : []),
    { kind: 'text', s: fmt(c.n), short: locked || c.short, lead: SIGN_MARKS[c.coin] ? SIGN_GAP : i ? SIGN_COIN_GAP : 0 }
  ]);
}
export const partW = p => p.lead + (p.kind === 'text' ? textW(p.s) : p.grid[0].length * markScale(p.grid));
export const rowW = ps => ps.reduce((s, p) => s + partW(p), 0);
const cells = n => Math.ceil(n / P) * P;
const snap = v => Math.round(v / P) * P;
// On the half-cell grid: a lot whose middle is on a half cell keeps its sign
// centered on it.
const half = v => Math.round(v * 2 / P) * P / 2;

// The board and its post at `x`, the post's foot on the floor under the
// board's middle.
function boxAt(x, w, floor) {
  const plate = P * SIGN_PLATE, post = P * SIGN_POST, foot = snap(floor(x + w / 2));
  return { x, y: foot - post - plate, w, h: plate + post, plate, post };
}
const rectsOf = b => [{ x: b.x, y: b.y, w: b.w, h: b.plate }, { x: b.x + b.w / 2 - P / 2, y: b.y + b.plate, w: P, h: b.post }];
const meets = (a, b) => Math.min(a.x + a.w, b.x + b.w) > Math.max(a.x, b.x) && Math.min(a.y + a.h, b.y + b.h) > Math.max(a.y, b.y);
// Centered on the lot, unless that stands it on something else's ground (a
// price wider than the lot, beside the lot's pile): then the nearest spot, a
// cell at a time either way, that touches nothing but the lot.
// As wide as the longer of its two lines, the name or the price.
function boxOf(mid, floor, name, parts, others) {
  const w = cells(Math.max(textW(name), rowW(parts)) + SHOP_BTN_PAD * 2), x0 = half(mid - w / 2);
  const clear = b => !rectsOf(b).some(r => others.some(o => meets(r, o)));
  for (let k = 0; k <= w / P; k++)
    for (const dx of k ? [-k * P, k * P] : [0]) { const b = boxAt(x0 + dx, w, floor); if (clear(b)) return b; }
  return boxAt(x0, w, floor);
}

// Every sign standing in `place` (the view's, unless asked), each with what
// it sells, says and costs and where it stands.
export function signs(place = S.view) {
  const out = [];
  let ground = null; // what else stands in the place, asked once there is a sign to place
  for (const r of STATIONS) {
    const lot = r.lot;
    if (!lot || (r.place || 'yard') !== place) continue;
    const u = selling(lot), spot = u && lot.box();
    if (!spot) continue;
    const id = lot.id ? lot.id() : r.key;
    ground ||= standingIn(place);
    const others = [...ground.filter(o => o.id !== id).flatMap(o => o.rects), ...out.flatMap(s => rectsOf(s.box))];
    const bill = coinsOf(billOf(u), u.coinOrder).map(([coin, n]) => ({ coin, n, short: purse(coin) < n }));
    const state = u.dead?.() ? 'locked' : canPay(u) ? 'ok' : 'short';
    const parts = partsOf(bill, state === 'locked');
    const mid = lot.mid ? lot.mid() : spot.x + spot.w / 2;
    const name = lot.name().toUpperCase();
    const box = boxOf(mid, lot.floor, name, parts, others);
    out.push({ id, key: r.key, place, row: u, act: lot.act, name, bill, state, parts, lot: spot, box });
  }
  return out;
}

// --- the pointer's two questions ---------------------------------------------
export const onSign = (b, x, y) => x >= b.x - SIGN_HIT && x < b.x + b.w + SIGN_HIT && y >= b.y - SIGN_HIT && y < b.y + b.h + SIGN_HIT;
export const signAt = (x, y) => signs().find(s => onSign(s.box, x, y)) || null;
// A press on one is the board tile's press on its row: a bill that cannot be
// paid, or a row that waits, buys nothing, as the tile's press does. True
// when the press was the sign's.
export function signPress(x, y) {
  const s = signAt(x, y);
  if (!s) return false;
  pressRow(s.row, s.act);
  return true;
}

// The ground each sign standing in `place` takes, keyed by the lot it stands
// in: the sign and what is built there are one object.
export const signRects = place => signs(place).map(s => ({ id: s.id, rects: rectsOf(s.box) }));

// For a scene or a check: the middle of a lot's board, by its station's key.
export function signMid(key, place = S.view) {
  const s = signs(place).find(q => q.key === key);
  return s ? { x: s.box.x + s.box.w / 2, y: s.box.y + s.box.plate / 2 } : null;
}
