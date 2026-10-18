// The grove, polished (docs/mocks/act3-stations-2026-10-18/polish-grove-saw.html,
// "pine, polished"): a pine of stepped tiers, each a solid stair-sided
// triangle whose top starts two cells a side narrower than the foot of the
// tier over it, so the shelves survive at 1x. One mask draws the tree
// standing and every held pose of its fall, so a turned tree stays solid.
// A plot: soil in its greys a cell; the tree by stage, sapling to grown;
// the saw, one clean line pushed and pulled, its kerf a white line eating
// into the trunk; the fall in held poses; the tree lying on its tiers and
// fading; the stump, a three-by-two block with a grey cut face; the logs.

import { P, AFTER_FALL_S, AFTER_FALL_POSES, AFTER_CROWN_FADE_S, AFTER_BUILD_FADE_S, AFTER_DIG_CLICKS,
         TREE_CHOPS, AFTER_ART_WORK_S, AFTER_PILE_FADE_S } from '../../config.js';
import { plotX, afterFloor } from '../../after/place.js';
import { trees, GROWN } from '../../after/grove.js';
import { frame, K, W, SOIL, toneOf, now, inView, pileState, clamp01 } from './kit.js';
import { logPile } from './piles.js';

// A stage: its trunk [width, height] and its tiers { v0, h, s }: a tier's foot
// v0 cells over the top of the trunk, h rows tall, its top row 2s+1 wide. The
// big pine (the grove's bigger trees) is the grown one with a tier more under it.
const PINE = {
  1: { trunk: [1, 1], tiers: [{ v0: 0, h: 3, s: 0 }] },
  2: { trunk: [1, 1], tiers: [{ v0: 0, h: 4, s: 1 }, { v0: 4, h: 3, s: 0 }] },
  3: { trunk: [3, 2], tiers: [{ v0: 0, h: 6, s: 2 }, { v0: 6, h: 5, s: 1 }, { v0: 11, h: 4, s: 0 }] },
  big: { trunk: [3, 3], tiers: [{ v0: 0, h: 7, s: 3 }, { v0: 7, h: 6, s: 2 }, { v0: 13, h: 5, s: 1 }, { v0: 18, h: 4, s: 0 }] }
};
const stageOf = (stage, big) => (stage === GROWN && big ? PINE.big : PINE[stage]);
const inPine = (tiers, u, v) => tiers.some(({ v0, h, s }) => v >= v0 && v < v0 + h && Math.abs(u) <= (v0 + h - v) - 0.5 + s + 1e-6);

// The tiers' cells, turned about the top of the trunk by th (0 upright, PI/2
// lying to the right), the pivot raised by `lift`: worked out once a pose.
const CELLS = new Map();
function tierCells(stage, th, lift) {
  const id = `${stage.trunk}|${stage.tiers.length}|${th}|${lift}`;
  let out = CELLS.get(id);
  if (out) return out;
  const px = 0.5, py = -stage.trunk[1] - lift, cos = Math.cos(th), sin = Math.sin(th), on = new Set();
  for (let y = -30; y < 0; y++) for (let x = -24; x < 28; x++) {
    const dx = x + 0.5 - px, dy = y + 0.5 - py;
    if (inPine(stage.tiers, dx * cos + dy * sin, dx * sin - dy * cos)) on.add(`${x},${y}`);
  }
  // A turned stair leaves the odd cell hanging by a corner: drop any cell
  // with no neighbor beside, above or below it.
  out = [];
  for (const k of on) {
    const [x, y] = k.split(',').map(Number);
    if (th === 0 || on.has(`${x + 1},${y}`) || on.has(`${x - 1},${y}`) || on.has(`${x},${y + 1}`) || on.has(`${x},${y - 1}`)) out.push([x, y]);
  }
  CELLS.set(id, out);
  return out;
}
const tiers = (d, stage, th = 0, lift = 0, dx = 0) => { for (const [x, y] of tierCells(stage, th, lift)) d.c(x + dx, y, K); };
function pine(d, stage, a = 1) {
  if (!stage || a <= 0) return;
  d.fade(a, () => { const [w, h] = stage.trunk; d.r(-(w - 1) / 2, -h, w, h, K); tiers(d, stage); });
}
function stump(d, a, dug) {
  d.fade(a, () => {
    d.r(-1, -2, 3, 2, K); d.px(-P + 2, -2 * P + 2, 3 * P - 4, 2, 3);
    // a swing of the spade takes a cell off its top
    for (let k = 0; k < Math.min(dug, AFTER_DIG_CLICKS); k++) d.c(-1 + k, -2, W);
  });
}

// What each plot showed last, so a stage coming in fades over the one going
// out and a stump dug out fades away: drawing state only.
const seen = [];
function plotSeen(i, p) {
  const t = now();
  let s = seen[i];
  if (!s || t < s.at) s = seen[i] = { stage: p.stage, prev: p.stage, at: -1e9, stump: p.stump, gone: -1e9 };
  if (p.stage !== s.stage) { s.prev = s.stage; s.stage = p.stage; s.at = t; }
  if (s.stump && !p.stump) s.gone = t;
  s.stump = p.stump;
  return s;
}

export function drawGrove() {
  const t = now(), fl = afterFloor();
  trees().forEach((p, i) => {
    const bx = plotX(i);
    if (!inView(bx - P * 10, P * 30)) return;
    const d = frame(bx, fl), s = plotSeen(i, p);
    const cleared = p.at == null ? 1 : clamp01((t - p.at) / AFTER_BUILD_FADE_S);
    d.fade(cleared, () => { for (let c = -5; c <= 5; c++) d.c(c, -1, toneOf(SOIL, bx / P + c, 0)); });
    const big = p.big;
    if (p.fall != null) {
      // The fall: held poses over AFTER_FALL_S, quicker as it goes.
      stump(d, 1, 0);
      const k = Math.min(AFTER_FALL_POSES.length - 1, Math.floor((t - p.fall) / AFTER_FALL_S * AFTER_FALL_POSES.length));
      tiers(d, stageOf(GROWN, big), AFTER_FALL_POSES[k]);
    }
    // Down on its tiers, lying, fading as the logs come off it.
    if (p.fell != null) d.fade(Math.max(0, 1 - (t - p.fell) / AFTER_CROWN_FADE_S), () => tiers(d, stageOf(GROWN, big), Math.PI / 2, 4.5, 1));
    if (p.stump && p.fall == null) stump(d, 1, p.dug || 0);
    else if (!p.stump && t - s.gone < AFTER_BUILD_FADE_S) stump(d, 1 - (t - s.gone) / AFTER_BUILD_FADE_S, AFTER_DIG_CLICKS);
    if (p.fall == null && p.stage) {
      // A stage coming in, faded over the one it grew from.
      const a = clamp01((t - s.at) / AFTER_BUILD_FADE_S) * cleared;
      if (a < 1 && s.prev) pine(d, stageOf(s.prev, big), (1 - a) * cleared);
      pine(d, stageOf(p.stage, big), a);
      // The saw: its kerf eaten into the trunk a chop at a time, and the
      // blade pushed and pulled in held steps while the chops come.
      if (p.stage === GROWN && p.chops > 0) {
        const kerf = Math.round(Math.min(1, p.chops / TREE_CHOPS) * 3 * P);
        d.px(2 * P - kerf, -2 * P + 2, kerf, 2, W);
        if (p.chip != null && t - p.chip < AFTER_ART_WORK_S) {
          const sh = Math.floor(t / 0.25) % 2 ? 4 : -4;
          d.px(-2 * P + sh, -2 * P + 2, 5 * P, 2, K);
        }
      }
    }
    // A plot's logs, counted only while there are some: an empty plot says nothing.
    const logs = pileState(`plot${i}`, p.logs);
    if (logs.n || logs.since < AFTER_PILE_FADE_S) logPile(d, 2, logs);
  });
}