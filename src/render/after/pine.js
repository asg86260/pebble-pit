// The grove, polished (docs/mocks/act3-stations-2026-10-18/polish-grove-saw.html,
// "pine, polished"): a pine of stepped tiers, each a solid stair-sided
// triangle whose top starts two cells a side narrower than the foot of the
// tier over it, so the shelves survive at 1x. One mask draws the tree
// standing and every held pose of its fall, so a turned tree stays solid.
// A plot: soil in its greys a cell; the tree by stage, sapling to grown, its
// trunk ten cells tall; the handsaw across the trunk (saw 3 of
// docs/mocks/act3-saw-2026-10-18, one person's: a grip at the near end, no
// peg at the tip), its kerf opening from the near side a column at a time in
// the blade's rows, sawdust at the foot; the fall in held poses; the tree
// lying on its tiers and fading; the stump, a three-by-two block with a grey
// cut face, lifted by the hand with its roots showing; the logs. Over a grown
// tree the saw icon, over a stump the shovel, each a pointer's mark drawn in
// its own finer dots, no plate under it.

import { P, AFTER_ART_SCALE as A, AFTER_FALL_S, AFTER_FALL_POSES, AFTER_CROWN_FADE_S, AFTER_BUILD_FADE_S, AFTER_DIG_CLICKS,
         TREE_CHOPS, AFTER_ART_WORK_S, AFTER_PILE_FADE_S } from '../../config.js';
import { plotX, afterFloor, pineOf, inPine, PINE_GROWN, STUMP, SAW_ROWS, ICON_DOT, AP } from '../../after/place.js';
import { trees } from '../../after/grove.js';
import { frame, K, W, PALE, MID, SOIL, DUST, toneOf, now, inView, pileState, clamp01 } from './kit.js';
import { logPile } from './piles.js';
import { gestureView, groveIcons } from '../../after/gestures.js';
import { ctx } from '../ctx.js';
import { GREY } from '../../config.js';

// The pine's shape is place.js's (`PINE`), where the hand reads it too.
const stageOf = pineOf;
const GROWN = PINE_GROWN;

// The tiers' cells, turned about the top of the trunk by th (0 upright, PI/2
// lying to the right), the pivot raised by `lift`: worked out once a pose.
const CELLS = new Map();
function tierCells(stage, th, lift) {
  const id = `${stage.trunk}|${stage.tiers.length}|${th}|${lift}`;
  let out = CELLS.get(id);
  if (out) return out;
  const px = 0.5, py = -stage.trunk[1] - lift, cos = Math.cos(th), sin = Math.sin(th), on = new Set();
  for (let y = -46; y < 0; y++) for (let x = -24; x < 48; x++) {
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
// What comes down when a tree is sawn through: the trunk above the stump and
// the tiers on it, turned to the right by th about the near corner of the
// cut (the trunk's right edge at the stump's top) and let `drop` rows down,
// so a ten-cell trunk falls whole rather than leaving its crown in the air.
const FALLEN = new Map();
function fallenCells(stage, th, drop) {
  const id = `${stage.trunk}|${stage.tiers.length}|${th}|${drop}`;
  if (FALLEN.has(id)) return FALLEN.get(id);
  const [w, h] = stage.trunk, sh = STUMP[2], px = (w + 1) / 2, cos = Math.cos(th), sin = Math.sin(th), on = new Set();
  const isTree = (u, v) => (Math.abs(u) <= w / 2 && v >= sh && v < h) || (v >= h && inPine(stage.tiers, u, v - h));
  for (let y = -48; y < 2; y++) for (let x = -8; x < 52; x++) {
    const dx = x + 0.5 - px, dy = -(y + 0.5) + drop - sh;
    const sx = dx * cos - dy * sin + px, sy = dx * sin + dy * cos + sh;
    if (isTree(sx - 0.5, sy)) on.add(`${x},${y}`);
  }
  const out = [];
  for (const k of on) {
    const [x, y] = k.split(',').map(Number);
    if (y >= 0) continue;
    if (th === 0 || on.has(`${x + 1},${y}`) || on.has(`${x - 1},${y}`) || on.has(`${x},${y + 1}`) || on.has(`${x},${y - 1}`)) out.push([x, y]);
  }
  FALLEN.set(id, out);
  return out;
}
const fallen = (d, stage, th, drop = 0) => { for (const [x, y] of fallenCells(stage, th, drop)) d.c(x, y, K); };
function pine(d, stage, a = 1) {
  if (!stage || a <= 0) return;
  d.fade(a, () => { const [w, h] = stage.trunk; d.r(-(w - 1) / 2, -h, w, h, K); tiers(d, stage); });
}
// The stump, lifted `up` px out of the ground by the hand, its roots
// showing under it as it comes.
function stump(d, a, dug, up = 0) {
  d.fade(a, () => {
    const [x0, w, h] = STUMP.map(v => v * P);
    up = Math.round(up / 2) * 2;
    d.px(x0, -h - up, w, h, K); d.px(x0 + 2, -h + 2 - up, w - 4, 2, PALE);
    if (up) { d.px(x0 + 2, -up, w - 4, up, MID); d.px(x0 - 2, -2, 2, 2, MID); d.px(x0 + w, -2, 2, 2, MID); }
    // a root given takes a cell off its top
    for (let k = 0; k < Math.min(dug, AFTER_DIG_CLICKS); k++) d.px((-1 + k) * P, -2 * P - up, P, P, W);
  });
}

// The handsaw at offset `o` cells, as cells (c, r, tone, front): `front`
// cells (the grip) never hide; the blade's hide in the trunk where it is not
// yet cut and show in the kerf. Off the mock's saw 3, its partner's peg cut.
const SAW = new Map();
function sawCells(o) {
  if (SAW.has(o)) return SAW.get(o);
  const out = [], add = (c, r, t, front = false) => out.push([c + o, r, t, front]);
  for (let r = -8; r <= -2; r++) for (let u = -15; u <= -11; u++) {
    const edge = r === -8 || r === -2 || u === -15 || u === -11, hole = r >= -6 && r <= -4 && u >= -14 && u <= -13;
    if (u === -15 && (r === -8 || r === -2)) continue;
    add(u, r, hole ? W : edge ? K : MID, true);
  }
  for (let r = -7; r <= -3; r++) add(-14, r, K, true);
  for (let u = -14; u <= -12; u++) { add(u, -7, K, true); add(u, -3, K, true); }
  const RIP = [0, 1, 2, 3];
  for (let u = -10; u <= 9; u++) {
    const top = u <= -4 ? -8 : u <= 3 ? -7 : -6;
    add(u, top, K);
    for (let r = top + 1; r <= -5; r++) add(u, r, PALE);
    for (let k = 1; k <= RIP[(u + 10) % 4]; k++) add(u, -5 + k, K);
  }
  for (let r = -6; r <= -5; r++) add(9, r, K);
  SAW.set(o, out);
  return out;
}
// The saw across trunk `w` x `h`, `kerf` columns cut from its near side.
function saw(d, o, w, h, kerf) {
  const t0 = -(w - 1) / 2, inTrunk = (c, r) => c >= t0 && c < t0 + w && r >= -h && r <= -1;
  const cut = (c, r) => inTrunk(c, r) && c < t0 + kerf && r >= SAW_ROWS[0] && r <= SAW_ROWS[1];
  for (let r = SAW_ROWS[0]; r <= SAW_ROWS[1]; r++) for (let k = 0; k < kerf; k++) d.c(t0 + k, r, W);
  for (const [c, r, tone, front] of sawCells(o)) if (front || !inTrunk(c, r) || cut(c, r)) d.c(c, r, tone);
}

// The grove's icons, in dots: '#' ink.
const ICONS = {
  saw: ['.###.........', '#...#########', '#.#.#.......#', '#...#......#.', '.####.....#..', '....#.#.#.#..', '.....#.#.#...', '.............'],
  shovel: ['.###.', '.#.#.', '..#..', '..#..', '..#..', '..#..', '..#..', '.###.', '#...#', '#...#', '#...#', '.#.#.', '..#..']
};
// Drawn with the cues (render/aftercues.js), over the bodies: they are the
// pointer's marks, not the grove's material.
const iconSeen = new Map();
export function drawGroveIcons() {
  const t = now(), shown = new Set();
  for (const c of groveIcons()) {
    const id = `${c.kind}${c.i}`;
    shown.add(id);
    let st = iconSeen.get(id);
    if (!st || t < st.at) iconSeen.set(id, st = { at: t, gone: null });
    if (st.gone != null) { st.at = t - Math.max(0, AFTER_PILE_FADE_S - (t - st.gone)); st.gone = null; }
    const a = clamp01((t - st.at) / AFTER_PILE_FADE_S) * (c.held ? 0.35 : 1);
    const rows = ICONS[c.kind], was = ctx.globalAlpha;
    ctx.globalAlpha = was * a;
    ctx.fillStyle = GREY[K];
    rows.forEach((row, j) => [...row].forEach((ch, k) => { if (ch === '#') ctx.fillRect(c.box.x + k * ICON_DOT, c.box.y + j * ICON_DOT, ICON_DOT, ICON_DOT); }));
    ctx.globalAlpha = was;
  }
  for (const [id, st] of iconSeen) if (!shown.has(id) && st.gone == null) st.gone = t;
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
  const view = gestureView() || [], hand = view.find(r => r.key === 'tree'), lift = view.find(r => r.key === 'stump');
  trees().forEach((p, i) => {
    const bx = plotX(i);
    if (!inView(bx - AP * 16, AP * 32)) return;
    const d = frame(bx, fl, 0, null, A), s = plotSeen(i, p);
    const cleared = p.at == null ? 1 : clamp01((t - p.at) / AFTER_BUILD_FADE_S);
    d.fade(cleared, () => { for (let c = -5; c <= 5; c++) d.c(c, -1, toneOf(SOIL, bx / AP + c, 0)); });
    const big = p.big;
    if (p.fall != null) {
      // The fall: held poses over AFTER_FALL_S, quicker as it goes.
      stump(d, 1, 0);
      const k = Math.min(AFTER_FALL_POSES.length - 1, Math.floor((t - p.fall) / AFTER_FALL_S * AFTER_FALL_POSES.length));
      fallen(d, stageOf(GROWN, big), AFTER_FALL_POSES[k]);
    }
    // Down on its tiers, lying, fading as the logs come off it.
    if (p.fell != null) d.fade(Math.max(0, 1 - (t - p.fell) / AFTER_CROWN_FADE_S), () => fallen(d, stageOf(GROWN, big), Math.PI / 2, STUMP[2]));
    if (p.stump && p.fall == null) stump(d, 1, p.dug || 0, lift && lift.i === i ? lift.lift : 0);
    else if (!p.stump && t - s.gone < AFTER_BUILD_FADE_S) stump(d, 1 - (t - s.gone) / AFTER_BUILD_FADE_S, AFTER_DIG_CLICKS);
    if (p.fall == null && p.stage) {
      // A stage coming in, faded over the one it grew from.
      const a = clamp01((t - s.at) / AFTER_BUILD_FADE_S) * cleared;
      if (a < 1 && s.prev) pine(d, stageOf(s.prev, big), (1 - a) * cleared);
      pine(d, stageOf(p.stage, big), a);
      // The saw on its trunk where the hand has put it, on whole cells; or,
      // with a woodcutter at it, pushed and pulled in held steps while the
      // chops come. Its kerf opens a column a third of the chops, and
      // sawdust gathers at the foot.
      if (p.stage === GROWN) {
        const st = stageOf(GROWN, big), [w, h] = st.trunk, kerf = Math.round(Math.min(1, p.chops / TREE_CHOPS) * w);
        const inHand = hand && hand.i === i, cutting = p.chip != null && t - p.chip < AFTER_ART_WORK_S;
        if (inHand) saw(d, Math.round(hand.s / AP), w, h, kerf);
        else if (cutting) saw(d, Math.floor(t / 0.25) % 2 ? 2 : -2, w, h, kerf);
        else if (kerf) for (let r = SAW_ROWS[0]; r <= SAW_ROWS[1]; r++) for (let k = 0; k < kerf; k++) d.c(-(w - 1) / 2 + k, r, W);
        for (let k = 0; k < Math.min(4, Math.floor(p.chops / 2)); k++) { d.c(-2 - (k >> 1), -1, toneOf(DUST, k, 1)); d.c(2 + (k >> 1), -1, toneOf(DUST, k, 2)); }
      }
    }
    // A plot's logs, counted only while there are some: an empty plot says nothing.
    const logs = pileState(`plot${i}`, p.logs);
    if (logs.n || logs.since < AFTER_PILE_FADE_S) logPile(d, 2, logs);
  });
}