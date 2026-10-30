// MOCK build-button-in-the-world
// Throwaway review code, never merged: the owner's "remove the upgrades
// button for shops that haven't been built yet, and add a button in the
// world for the initial build", as four options on the review bench. A
// station not yet built shows no UPGRADES button (after/stations.js reads
// the same flag); something standing at its lot buys its first build
// instead, through the board's own press (`pressRow`, shop.js), so the bill
// is taken and the builders walk exactly as a tile's press makes them.
//
// `globalThis.__buildBtnMock` picks the option ('a'..'d'), null is the game
// as it is; a reset puts it away, so no other scene stands with it.
//   a  the UPGRADES plate's spot and look, saying BUILD and the price
//   b  a BUILD pill on the station's dotted outline, the price on hover
//   c  the bench's call (#raise) for every lot: a DOM button over it
//   d  a staked sign on the lot, BUILD over the price

import { S, shack } from './state.js';
import { P, WORKER, SHOP_BTN_PX, SHOP_BTN_H, SHOP_BTN_PAD, SHOP_BTN_AIR, SHOP_BTN_LIFT,
         AFTER_ROSTER_DOWN, AFTER_ROSTER_SHOP_DROP } from './config.js';
import { AFTER_COIN_MARKS } from './config/after.js';
import { GREY, COIN } from './config/palette.js';
import { COIN_MARKS } from './glyphs.js';
import { held } from './reset.js';
import { msg, FACE } from './lang.js';
import { ctx } from './render/ctx.js';
import { crispText } from './render/crisptext.js';
import { fillDots } from './render/dots.js';
import { fmt, MARK, priceText, purse } from './words.js';
import { toScreen } from './world.js';
import { UPGRADES, canPay, billOf } from './upgrades.js';

// option c's buttons wear the bench's call (style.css, `#raise`)
// (a link, not an import: the node tier reads this file too)
if (typeof document !== 'undefined' && document.head && !document.getElementById('buildcall-style')) {
  const l = document.createElement('link');
  l.id = 'buildcall-style'; l.rel = 'stylesheet'; l.href = new URL('./buildmock.css', import.meta.url).href;
  document.head.appendChild(l);
}
import { pressRow, coinsOf } from './shop.js';
import { offered } from './stations.js';
import { workOn } from './works.js';
import { stationBox, groundOf, closed } from './after/place.js';
import { raising } from './after/levels.js';
import { afterRow } from './after/rows.js';
import { drawnMid } from './footprints.js';
import { onTap } from './tap.js';
import { showTip, showTipAt } from './board.js';

held('build-mock', () => { globalThis.__buildBtnMock = null; });
const mode = () => globalThis.__buildBtnMock || null;

// --- the lots --------------------------------------------------------------
// Each lot not yet built and offered: act 3's closed stations, and act 1's
// shack once its row would be on the bench (`offered`, the row's own reveal).
const COIN_NAME = { dust: 'books-dust', shard: 'books-shard', spore: 'books-spore', spark: 'books-spark', rebel: 'after-coin-rebel' };
const COIN_GRID = { dust: COIN_MARKS.dust, shard: COIN_MARKS.ore, spore: COIN_MARKS.crop, spark: COIN_MARKS.spark,
                    rebel: AFTER_COIN_MARKS.rebel, timber: AFTER_COIN_MARKS.timber };
const COIN_INK = { shard: () => COIN.ore, spore: () => COIN.crop, spark: () => COIN.spark };
const afterLot = card => {
  if (S.view !== 'after' || !S.after || !closed(card) || raising(card)) return null;
  const row = afterRow(`after-build-${card}`), b = stationBox(card), foot = groundOf(card);
  return { id: card, row, call: msg('buildmock-call', { name: row.name }), mid: drawnMid(card) ?? b.x + b.w / 2,
           top: b.y, foot, x: b.x, w: b.w, line: foot + AFTER_ROSTER_DOWN + AFTER_ROSTER_SHOP_DROP };
};
const yardLot = () => {
  if (S.view !== 'yard' || S.shackOpen || !offered('shack') || workOn('unlockshack')) return null;
  const row = UPGRADES.find(u => u.key === 'unlockshack'), foot = shack.y + shack.h;
  return { id: 'shack', row, call: row.name, mid: shack.x + shack.w / 2, top: shack.y, foot, x: shack.x, w: shack.w,
           line: foot + AFTER_ROSTER_DOWN + AFTER_ROSTER_SHOP_DROP };
};
const LOTS = [() => afterLot('mill'), () => afterLot('workshop'), yardLot];
function lots() {
  if (!mode()) return [];
  return LOTS.map(f => f()).filter(Boolean).map(l => {
    const bill = coinsOf(billOf(l.row), l.row.coinOrder).map(([coin, n]) => ({ coin, n, short: purse(coin) < n }));
    return { ...l, bill, state: l.row.dead?.() ? 'locked' : canPay(l.row) ? 'ok' : 'short' };
  });
}

// --- what it says ------------------------------------------------------------
const billSaid = l => l.bill.map(c => msg('buildmock-coin', { n: priceText(c.coin, c.n), coin: msg(COIN_NAME[c.coin] || c.coin) })).join(', ');
const says = l => (l.state === 'locked' ? msg('buildmock-wait', { call: l.call, why: l.row.waits?.() || '' })
                                        : msg('buildmock-say', { call: l.call, bill: billSaid(l) }));

// --- the pieces, in world units -----------------------------------------------
const PX = SHOP_BTN_PX, GAP = 4, COIN_GAP = 10;
const font = () => `${PX}px ${FACE}`;
const textW = s => { ctx.font = font(); return Math.ceil(ctx.measureText(s).width); };
const word = () => msg('buildmock-word').toUpperCase();
// A coin's mark at whole pixels a cell, near the type's height.
const markScale = g => Math.max(1, Math.round(10 / g.length));
const parts = l => l.bill.flatMap((c, i) => [
  { kind: 'mark', grid: COIN_GRID[c.coin], coin: c.coin, short: c.short, lead: i ? COIN_GAP : 0 },
  { kind: 'text', s: fmt(c.n), short: c.short, lead: GAP }
]);
const partW = p => p.lead + (p.kind === 'text' ? textW(p.s) : p.grid[0].length * markScale(p.grid));
const rowW = ps => ps.reduce((s, p) => s + partW(p), 0);
const cells = n => Math.ceil(n / P) * P;
const snap = v => Math.round(v / P) * P;
// on the half-cell grid: a lot whose middle is on a half cell keeps its button centered on it
const half = v => Math.round(v * 2 / P) * P / 2;

function boxOf(l, m = mode()) {
  if (m === 'a') {
    const w = cells(textW(word()) + COIN_GAP + rowW(parts(l)) + SHOP_BTN_PAD * 2);
    const y = snap(l.line) - WORKER / 2 - WORKER - SHOP_BTN_AIR - SHOP_BTN_H;
    return { x: half(l.mid - w / 2), y, w, h: SHOP_BTN_H };
  }
  if (m === 'b') {
    const w = cells(textW(word()) + SHOP_BTN_PAD * 2);
    return { x: half(l.mid - w / 2), y: snap((l.top + l.foot) / 2 - SHOP_BTN_H / 2), w, h: SHOP_BTN_H };
  }
  if (m === 'd') {
    const w = cells(Math.max(textW(word()), rowW(parts(l))) + SHOP_BTN_PAD * 2);
    const h = P * 7, post = P * 4;
    return { x: half(l.mid - w / 2), y: l.foot - post - h, w, h: h + post, plate: h, post };
  }
  return null;
}
const HIT = P;
const inside = (b, x, y) => !!b && x >= b.x - HIT && x < b.x + b.w + HIT && y >= b.y - HIT && y < b.y + b.h + HIT;
const lotAt = (x, y) => lots().find(l => inside(boxOf(l), x, y)) || null;

// --- the pointer's three questions -------------------------------------------
export const buildMockOver = (x, y) => !!lotAt(x, y);
export function buildMockSays(x, y) {
  const l = lotAt(x, y);
  if (!l) return null;
  const b = boxOf(l);
  return { text: says(l), at: { x: b.x + b.w / 2, y: b.y + b.h } };
}
// A press on a lot's button is the board tile's press on its row: a bill
// that cannot be paid buys nothing, as a tile's does.
export function buildMockPress(x, y) {
  const l = lotAt(x, y);
  if (!l) return false;
  pressRow(l.row);
  return true;
}
// For a scene: the button's middle, to stand the pointer on.
export function buildMockAt(id) {
  const l = lots().find(q => q.id === id), b = l && boxOf(l);
  return b ? { x: b.x + b.w / 2, y: b.y + Math.min(b.h, b.plate || b.h) / 2 } : null;
}
export function buildMockHover(id) {
  // option c's button is the page's: the pointer is parked off the glass and
  // the button seats its own hover once it stands (`seatCalls`)
  if (mode() === 'c') { S.mouse = parked = { x: -1e6, y: -1e6 }; showTipAt(null); hoverC = id; return; }
  const at = buildMockAt(id);
  if (!at) return;
  S.mouse = at;
  const s = buildMockSays(at.x, at.y);
  if (s) showTip(s.text, s.at);
}

// --- drawing -----------------------------------------------------------------
// Faded on and off, never popped: each lot's last look is kept so a bought
// one fades out where it stood.
const seen = new Map(); // page: id -> { l, a, m }
let lastT = 0; // page: the last frame's clock
const FADE_MS = 200;
const PAPER = () => GREY[0], INK = () => GREY[GREY.length - 1], MID = () => GREY[5];

function drawParts(ps, x, y, h, ink, ground) {
  let at = x;
  for (const p of ps) {
    at += p.lead;
    const tone = p.short ? MID() : p.kind === 'mark' && COIN_INK[p.coin] ? COIN_INK[p.coin]() : ink;
    if (p.kind === 'text') {
      crispText(ctx, p.s, at, y + (h - PX) / 2, font(), tone, 'left', ground, GREY);
      at += textW(p.s);
    } else {
      const s = markScale(p.grid), gh = p.grid.length * s, oy = Math.round(y + (h - gh) / 2);
      ctx.fillStyle = tone;
      p.grid.forEach((r, j) => { for (let i = 0; i < r.length; i++) if (r[i] === '#') ctx.fillRect(at + i * s, oy + j * s, s, s); });
      at += p.grid[0].length * s;
    }
  }
}
function plate(b, h, over, dotted, ink) {
  const lift = over ? SHOP_BTN_LIFT : 0, x = b.x - lift, y = b.y - lift;
  if (over) { ctx.fillStyle = INK(); ctx.fillRect(b.x, b.y, b.w, h); }
  ctx.fillStyle = PAPER(); ctx.fillRect(x, y, b.w, h);
  fillDots(ctx, x + 2, y + 2, b.w - 4, h - 4);
  ctx.fillStyle = ink;
  if (!dotted) {
    ctx.fillRect(x, y, b.w, 2); ctx.fillRect(x, y + h - 2, b.w, 2);
    ctx.fillRect(x, y, 2, h); ctx.fillRect(x + b.w - 2, y, 2, h);
  } else {
    for (let i = 0; i < b.w; i += 4) { ctx.fillRect(x + i, y, 2, 2); ctx.fillRect(x + i, y + h - 2, 2, 2); }
    for (let j = 0; j < h; j += 4) { ctx.fillRect(x, y + j, 2, 2); ctx.fillRect(x + b.w - 2, y + j, 2, 2); }
  }
  return { x, y };
}
// Act 1 has no closed look of its own: the lot's ground dotted in, as act 3's
// closed stations are (render/after.js, `closedStation`).
function yardOutline(l) {
  ctx.fillStyle = MID();
  const x0 = snap(l.x), x1 = snap(l.x + l.w), y0 = snap(l.top), y1 = l.foot - P;
  for (let x = x0; x < x1; x += P * 2) { ctx.fillRect(x, y0, P, P); ctx.fillRect(x, y1, P, P); }
  for (let y = y0; y <= y1; y += P * 2) { ctx.fillRect(x0, y, P, P); ctx.fillRect(x1 - P, y, P, P); }
}
function drawLot(l, m) {
  const b = boxOf(l, m);
  if (!b) return;
  const over = !!S.mouse && inside(b, S.mouse.x, S.mouse.y) && l.state !== 'locked';
  const ink = l.state === 'locked' ? MID() : INK();
  if (m === 'a') {
    // the UPGRADES button's look: the word alone until the pointer is on it
    const lift = over ? SHOP_BTN_LIFT : 0;
    if (over) plate(b, b.h, true, false, ink);
    const x = b.x - lift + SHOP_BTN_PAD, y = b.y - lift;
    crispText(ctx, word(), x, y + (b.h - PX) / 2, font(), ink, 'left', PAPER(), GREY);
    drawParts(parts(l).map(p => (l.state === 'locked' ? { ...p, short: true } : p)), x + textW(word()) + COIN_GAP, y, b.h, ink, PAPER());
  } else if (m === 'b') {
    if (l.id === 'shack') yardOutline(l);
    const at = plate(b, b.h, over, l.state !== 'ok', ink);
    crispText(ctx, word(), at.x + b.w / 2, at.y + (b.h - PX) / 2, font(), l.state === 'ok' ? INK() : MID(), 'center', PAPER(), GREY);
  } else if (m === 'd') {
    // the post, a cell wide, into the ground under the plate's middle
    ctx.fillStyle = ink;
    ctx.fillRect(b.x + b.w / 2 - P / 2, b.y + b.plate, P, b.post);
    const at = plate({ ...b, h: b.plate }, b.plate, over, false, ink);
    const top = { x: at.x, y: at.y + P }, ps = parts(l).map(p => (l.state === 'locked' ? { ...p, short: true } : p));
    crispText(ctx, word(), at.x + b.w / 2, top.y, font(), ink, 'center', PAPER(), GREY);
    drawParts(ps, at.x + (b.w - rowW(ps)) / 2, at.y + P * 3.5, P * 2.5, ink, PAPER());
  }
}
export function drawBuildMock() {
  const m = mode();
  const t = performance.now(), dt = lastT ? Math.min(100, t - lastT) : 0;
  lastT = t;
  seatCalls();
  if (!m) { seen.clear(); return; }
  const here = new Set();
  for (const l of lots()) { here.add(l.id); const s = seen.get(l.id); seen.set(l.id, { l, a: s ? s.a : 0, m }); }
  for (const [id, s] of seen) {
    s.a = Math.max(0, Math.min(1, s.a + (here.has(id) ? 1 : -1) * dt / FADE_MS));
    if (!here.has(id) && s.a <= 0) { seen.delete(id); continue; }
    if (m === 'c') continue;
    const was = ctx.globalAlpha;
    ctx.globalAlpha = was * s.a;
    drawLot(s.l, m);
    ctx.globalAlpha = was;
  }
}

// --- option c: the bench's call, for every lot ---------------------------------
const calls = new Map(); // page: id -> the button
function callFor(id) {
  let b = calls.get(id);
  if (b) return b;
  b = document.createElement('button');
  b.type = 'button';
  b.className = 'buildcall';
  document.body.appendChild(b);
  onTap(b, () => { const l = lots().find(q => q.id === id); if (l) pressRow(l.row); });
  b.addEventListener('pointerenter', () => { const l = lots().find(q => q.id === id); if (l) tipFor(b, l); });
  b.addEventListener('pointerleave', () => showTipAt(null));
  calls.set(id, b);
  return b;
}
const tipFor = (b, l) => { const r = b.getBoundingClientRect(); showTipAt(says(l), r.left + r.width / 2, r.bottom + 6, true); };
function seatCalls(hover = null) {
  if (S.mouse !== parked) hoverC = null;
  const on = mode() === 'c' ? lots() : [];
  const ids = new Set(on.map(l => l.id));
  for (const [id, b] of calls) if (!ids.has(id)) b.classList.remove('on', 'over');
  for (const l of on) {
    const b = callFor(l.id);
    const html = `<span class="say">${l.call}</span><span class="bill">${l.bill.map(c =>
      `<span class="${c.short ? 'short' : 'have'}">${MARK[c.coin] || ''} ${priceText(c.coin, c.n)}</span>`).join('')}</span>`;
    if (b.dataset.html !== html) { b.innerHTML = html; b.dataset.html = html; }
    b.classList.add('on');
    b.classList.toggle('dead', l.state === 'locked');
    // centered over the lot, its foot two cells clear of the station's top,
    // as the bench's call stands over the bench (board.js, `seatCall`)
    const w = b.offsetWidth;
    const mid = toScreen(l.mid, 0).x, top = toScreen(0, l.top - P * 2).y;
    const x = Math.round(Math.max(4, Math.min(mid - w / 2, S.W - w - 4)));
    const bottom = Math.round(S.H - top);
    b.style.transform = `translate3d(${x}px, ${-bottom}px, 0)`;
    // a scene's pointer, once the button stands where it is seen
    b.classList.toggle('over', (hover || hoverC) === l.id);
    if ((hover || hoverC) === l.id) tipFor(b, l);
  }
}
// The lot a scene stood the pointer over, held every frame until a real
// pointer moves over the yard (which sets S.mouse).
let hoverC = null; // page: a scene's pointer on an option c button
let parked = null; // page: the off-glass pointer a scene left, replaced by any real move
held('build-mock-hover', () => { hoverC = null; });

// A scene stands the pointer on a lot's button without importing this page
// module into the node tier (scenes.js is read there too).
globalThis.__buildMockHover = buildMockHover;
// ...and a check finds the button on the glass, to press it as a player does
globalThis.__buildMockScreen = id => { const a = buildMockAt(id); return a && toScreen(a.x, a.y); };
