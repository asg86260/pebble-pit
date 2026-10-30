// REVIEW build-sign
// The build sign as drawn (buildsign.js): a board on a post, BUILD over the
// price, staked in an empty lot. Paper with the boards' dots, a two-pixel
// ink edge, the post a cell wide into the ground under its middle. Greyed,
// edge and all, while its row waits on something; a coin short of greyed on
// the price line alone. Under the pointer it lifts up and left off a hard
// shadow, as the UPGRADES button and the board's tiles do.
//
// It fades on and off, never pops: each sign's last look is kept, so a bought
// one fades out where it stood, and one the yard has moved fades out at the
// old spot while it fades in at the new.

import { S } from '../state.js';
import { P, SHOP_BTN_PX, SHOP_BTN_LIFT, SHELF_HOVER_MS, SIGN_WORD_AT, SIGN_BILL_AT, SIGN_BILL_H, SIGN_FADE_MS } from '../config.js';
import { GREY, COIN } from '../config/palette.js';
import { FACE } from '../lang.js';
import { ctx } from './ctx.js';
import { crispText } from './crisptext.js';
import { fillDots } from './dots.js';
import { now } from '../clock.js';
import { reducedMotion } from '../prefs.js';
import { signs, onSign, signWord, markScale, rowW, textW, signMid, signSays } from '../buildsign.js';
import { showTip } from '../board.js';
import { toScreen } from '../world.js';

const THIN = 2;
const PAPER = () => GREY[0], INK = () => GREY[GREY.length - 1], MID = () => GREY[5];
// A coin with a tone of its own wears it on the price line, as on the counter.
const COIN_INK = { shard: () => COIN.ore, spore: () => COIN.crop, spark: () => COIN.spark };
const font = () => `${SHOP_BTN_PX}px ${FACE}`;

// A coin's mark is a pixel mask cut in the screen's own pixels, as the
// roster's pips are: a cell of it is a whole number of device pixels, near
// the size the layout gave it (`markScale`, in world pixels). At the deep's
// zoom a world pixel is under a device pixel, and the fang's nine rows drawn
// a world pixel a cell came out a grey smear that read as a coin short.
const devPx = () => ctx.getTransform?.().a || 1;
const markCell = g => { const z = devPx(); return Math.max(1, Math.round(markScale(g) * z)) / z; };
const onDev = v => { const z = devPx(); return Math.round(v * z) / z; };
const drawnW = p => p.lead + (p.kind === 'text' ? textW(p.s) : p.grid[0].length * markCell(p.grid));

function drawParts(ps, x, y, h, ink) {
  let at = x - (ps.reduce((s, p) => s + drawnW(p), 0) - rowW(ps)) / 2;
  for (const p of ps) {
    at += p.lead;
    const tone = p.short ? MID() : p.kind === 'mark' && COIN_INK[p.coin] ? COIN_INK[p.coin]() : ink;
    if (p.kind === 'text') {
      crispText(ctx, p.s, at, y + (h - SHOP_BTN_PX) / 2, font(), tone, 'left', PAPER(), GREY);
      at += textW(p.s);
    } else {
      const s = markCell(p.grid), ox = onDev(at), oy = onDev(y + (h - p.grid.length * s) / 2);
      ctx.fillStyle = tone;
      p.grid.forEach((r, j) => { for (let i = 0; i < r.length; i++) if (r[i] === '#') ctx.fillRect(ox + i * s, oy + j * s, s, s); });
      at += p.grid[0].length * s;
    }
  }
}

// The lift under the pointer, eased over the tiles' own hover time.
const lifting = new Map(); // page: a sign's id -> { to, from, at }
function lifted(id, to) {
  const t0 = now();
  let r = lifting.get(id);
  if (!r) lifting.set(id, r = { to, from: to, at: t0 });
  const k = Math.min(1, (t0 - r.at) / SHELF_HOVER_MS), at = r.from + (r.to - r.from) * (1 - Math.pow(1 - k, 3));
  if (r.to !== to) { r.from = at; r.to = to; r.at = t0; }
  return reducedMotion() ? r.to : at;
}

function drawSign(s) {
  const b = s.box, locked = s.state === 'locked', ink = locked ? MID() : INK();
  const over = !locked && !!S.mouse && onSign(b, S.mouse.x, S.mouse.y);
  const t = lifted(s.id, over ? 1 : 0), lift = SHOP_BTN_LIFT * t;
  // the post, a cell wide, into the ground under the board's middle
  ctx.fillStyle = ink;
  ctx.fillRect(b.x + b.w / 2 - P / 2, b.y + b.plate, P, b.post);
  // the shadow the board lifts off
  if (t > 0) { ctx.fillStyle = INK(); ctx.fillRect(b.x, b.y, b.w, b.plate); }
  const x = b.x - lift, y = b.y - lift;
  ctx.fillStyle = PAPER(); ctx.fillRect(x, y, b.w, b.plate);
  fillDots(ctx, x + THIN, y + THIN, b.w - THIN * 2, b.plate - THIN * 2);
  ctx.fillStyle = ink;
  ctx.fillRect(x, y, b.w, THIN); ctx.fillRect(x, y + b.plate - THIN, b.w, THIN);
  ctx.fillRect(x, y, THIN, b.plate); ctx.fillRect(x + b.w - THIN, y, THIN, b.plate);
  crispText(ctx, signWord(), x + b.w / 2, y + P * SIGN_WORD_AT, font(), ink, 'center', PAPER(), GREY);
  drawParts(s.parts, x + (b.w - rowW(s.parts)) / 2, y + P * SIGN_BILL_AT, P * SIGN_BILL_H, ink);
}

// A scene stands the pointer on a lot's sign, its hover up, without
// importing this page module into the node tier (scenes.js is read there
// too); a check finds the sign on the glass to press it as a player does.
globalThis.__signHover = key => {
  const at = signMid(key);
  if (!at) return;
  S.mouse = at;
  const s = signSays(at.x, at.y);
  if (s) showTip(s.text, s.at);
};
globalThis.__signScreen = key => { const at = signMid(key); return at && toScreen(at.x, at.y); };

const seen = new Map(); // page: `${id}@${x}` -> { s, a }, each sign's last look and its opacity
let lastT = 0; // page: the last frame's clock
export function drawBuildSigns() {
  const t = now(), dt = lastT ? Math.max(0, Math.min(100, t - lastT)) : 0;
  lastT = t;
  const here = new Set();
  for (const s of signs()) {
    const k = `${s.id}@${s.box.x}`;
    here.add(k);
    seen.set(k, { s, a: seen.get(k)?.a ?? 0 });
  }
  for (const [k, v] of seen) {
    v.a = Math.max(0, Math.min(1, v.a + (here.has(k) ? 1 : -1) * dt / SIGN_FADE_MS));
    // gone from this place (a camera through to another) takes its fade with it
    if ((!here.has(k) && v.a <= 0) || v.s.place !== S.view) { seen.delete(k); continue; }
    const was = ctx.globalAlpha;
    ctx.globalAlpha = was * v.a;
    drawSign(v.s);
    ctx.globalAlpha = was;
  }
}
