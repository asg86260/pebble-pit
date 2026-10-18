// The yard's coins coming up into act 3 (DESIGN.md, "The yard pays too"): a
// bill's yard coins leave the yard's pile as the yard's own grains, fly up to
// the thin patch in the cloud floor (after/rows.js, `payYard`), and come out
// of it here as motes -- each a grain in the tone it had on the pile -- that
// rise a little, then arc to the station bought and land on it.
//
// A mote is stamped once, when it is paid for (`S.after.coins`: its tone, the
// spot it comes out at, where it lands, and the act's time it comes out), and
// where it is is read off the act's clock, so a mote costs no stepping and a
// save mid-flight reads back with every mote where it was. The arc is the
// yard's own (game.js, `fly`): eased in and out, lifted on a half sine.

import { S } from '../state.js';
import { P, AFTER_COIN_UP, AFTER_COIN_RISE_S, AFTER_COIN_FLY_S, AFTER_COIN_LIFE_S as LIFE_S, AFTER_COIN_LIFT,
         AFTER_COIN_FADE_S } from '../config.js';
import { shadeOf } from '../grid.js';
import { ctx } from './ctx.js';

const ease = e => e * e * (3 - 2 * e);

// Where a mote is at the act's time `t`, and how much ink it carries: null
// before it comes out of the cloud and once it has landed.
export function coinAt(m, t) {
  const s = t - m.at;
  if (s < 0 || s >= LIFE_S) return null;
  const ink = Math.min(1, s / AFTER_COIN_FADE_S, (LIFE_S - s) / AFTER_COIN_FADE_S);
  const topY = m.y0 - AFTER_COIN_UP;
  if (s < AFTER_COIN_RISE_S) return { x: m.x0, y: m.y0 - AFTER_COIN_UP * ease(s / AFTER_COIN_RISE_S), ink };
  const e = ease((s - AFTER_COIN_RISE_S) / AFTER_COIN_FLY_S);
  return { x: m.x0 + (m.tx - m.x0) * e, y: topY + (m.ty - topY) * e - Math.sin(e * Math.PI) * AFTER_COIN_LIFT, ink };
}

// Drawn the way the yard draws its paid grains (render/cores.js): a cell of
// the grain's own tone, on the grid's size.
export function drawAfterCoins() {
  const a = S.after;
  if (!a?.coins?.length) return;
  const was = ctx.globalAlpha;
  for (const m of a.coins) {
    const at = coinAt(m, a.t);
    if (!at) continue;
    ctx.globalAlpha = was * at.ink;
    ctx.fillStyle = shadeOf(m.v);
    ctx.fillRect(Math.round(at.x - P / 2), Math.round(at.y - P / 2), P, P);
  }
  ctx.globalAlpha = was;
  ctx.fillStyle = '#000';
}
