// The grove, polished (docs/mocks/act3-stations-2026-10-18/polish-grove-saw.html,
// "pine, polished"): a pine of stepped tiers, each a solid stair-sided
// triangle whose top starts two cells a side narrower than the foot of the
// tier over it, so the shelves survive at 1x. One mask draws the tree
// standing and every held pose of its fall, so a turned tree stays solid.
// A plot: soil in its greys a cell; the tree by stage, sapling to grown, its
// trunk ten cells tall; the handsaw across the trunk (saw 3 of
// docs/mocks/act3-saw-2026-10-18, one person's: a grip at the near end, no
// peg at the tip), its kerf opening from the near side a column at a time in
// the blade's rows, sawdust at the foot; the fall, the tree over the stump
// turned as one drawing by its true angle about the cut, quicker as it goes
// (the motion rule, the owner 2026-10-20), hitting the ground with the dust
// coming up and rocking back once; then its trunk splitting into the logs,
// which roll off a little and lie, and its crown fading; the stump, a
// three-by-two block with a grey cut face, lifted by the hand with its roots
// showing. Over a grown
// tree the saw icon, over a stump the shovel, each a pointer's mark drawn in
// its own finer dots, no plate under it.

import { P, AFTER_ART_SCALE as A, AFTER_FALL_S, AFTER_CROWN_FADE_S, AFTER_BUILD_FADE_S, AFTER_DIG_CLICKS,
         TREE_CHOPS, AFTER_ART_WORK_S, AFTER_PILE_FADE_S, AFTER_FALL_BOUNCE_S, AFTER_FALL_BOUNCE, AFTER_LOG_ROLL_S } from '../../config.js';
import { plotX, afterFloor, pineOf, inPine, PINE_GROWN, STUMP, sawGeom, ICON_DOT, AP } from '../../after/place.js';
import { trees, groundLogs } from '../../after/grove.js';
import { frame, K, W, PALE, MID, SOIL, DUST, toneOf, now, inView, clamp01 } from './kit.js';
import { gestureView, groveIcons } from '../../after/gestures.js';
import { ctx } from '../ctx.js';
import { GREY, AFTER_SAW_GRIP, AFTER_SAW_BLADE_ROWS } from '../../config.js';

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
// A sheet to cache a drawing on: none where the page has no canvas (the node
// tier), where what these sheets carry is not drawn at all.
const paper = () => (typeof document === 'undefined' ? null : document.createElement('canvas'));
// What comes down when a tree is sawn through, as one drawing each, cached:
// the trunk above the stump (`trunk`) and the tiers on it (`crown`), in its
// cells, each a sprite with the pivot it turns about, the near corner of the
// cut (the trunk's right edge at the stump's top), in its own px.
const PIECES = new Map();
function piece(stage, part) {
  const id = `${stage.trunk}|${stage.tiers.length}|${part}|${GREY[K]}`;
  if (PIECES.has(id)) return PIECES.get(id);
  const [w, h] = stage.trunk, sh = STUMP[2], cells = [];
  if (part === 'trunk') { for (let y = -h; y < -sh; y++) for (let x = -(w - 1) / 2; x <= (w - 1) / 2; x++) cells.push([x, y]); }
  else cells.push(...tierCells(stage, 0, 0));
  const x0 = Math.min(...cells.map(c => c[0])), y0 = Math.min(...cells.map(c => c[1]));
  const x1 = Math.max(...cells.map(c => c[0])), y1 = Math.max(...cells.map(c => c[1]));
  const cv = paper();
  if (!cv) return null;
  cv.width = (x1 - x0 + 1) * AP; cv.height = (y1 - y0 + 1) * AP;
  const g = cv.getContext('2d');
  if (!g) return null;
  g.fillStyle = GREY[K];
  for (const [x, y] of cells) g.fillRect((x - x0) * AP, (y - y0) * AP, AP, AP);
  const out = { cv, px: ((w + 1) / 2 - x0) * AP, py: (-sh - y0) * AP, at: (w + 1) / 2 * AP };
  PIECES.set(id, out);
  return out;
}
// A piece of plot bx's tree turned th about the cut and let `drop` px down.
function turned(pc, bx, th, drop, a = 1) {
  if (!pc || a <= 0) return;
  ctx.save();
  ctx.globalAlpha *= a;
  ctx.imageSmoothingEnabled = false;
  ctx.translate(bx + pc.at, afterFloor() - STUMP[2] * AP + drop);
  ctx.rotate(th);
  ctx.drawImage(pc.cv, -pc.px, -pc.py);
  ctx.restore();
}
// The tree's angle and drop through its fall and the rock back after the
// hit: falling, over AFTER_FALL_S from `fall`, the angle and the drop
// growing as the square of the time, so it goes over slowly and comes down
// fast; landed, from `fell`, the crown lifted back off the ground and down
// again once, AFTER_FALL_BOUNCE at most, settling over AFTER_FALL_BOUNCE_S.
function fallPose(p, t) {
  const sh = STUMP[2] * AP;
  if (p.fall != null) { const u = clamp01((t - p.fall) / AFTER_FALL_S), k = u * u; return { th: Math.PI / 2 * k, drop: sh * k }; }
  const v = clamp01((t - p.fell) / AFTER_FALL_BOUNCE_S);
  return { th: Math.PI / 2 - AFTER_FALL_BOUNCE * Math.sin(Math.PI * v) * (1 - v), drop: sh };
}
// A log on the ground, end on: a round of bark, its pale cut face and a
// grey heart off its middle, so its turn shows as it rolls. Cached.
const LOG = new Map();
function logSprite() {
  const id = `${GREY[K]}|${GREY[PALE]}|${GREY[MID]}`;
  if (LOG.has(id)) return LOG.get(id);
  const s = 2 * AP, r = A * 2, cv = paper();
  if (!cv) return null;
  cv.width = cv.height = s;
  const g = cv.getContext('2d');
  if (!g) return null;
  g.fillStyle = GREY[K]; g.fillRect(r, 0, s - 2 * r, s); g.fillRect(0, r, s, s - 2 * r);
  g.fillStyle = GREY[PALE]; g.fillRect(r * 2, r, s - 4 * r, s - 2 * r); g.fillRect(r, r * 2, s - 2 * r, s - 4 * r);
  g.fillStyle = GREY[MID]; g.fillRect(s / 2, r * 2, r * 2, r * 2);
  LOG.set(id, cv);
  return cv;
}
// Each log lying, or rolling to where it lies: faded in over the trunk as
// it splits, then off along the ground, slowing to rest over
// AFTER_LOG_ROLL_S, turned by how far it has rolled.
const SPLIT_S = 0.15;
function drawGroundLogs(t) {
  const fl = afterFloor(), cv = logSprite(), R0 = AP;
  if (!cv) return;
  for (const q of groundLogs()) {
    const since = t - q.at;
    if (since < -SPLIT_S || !inView(q.x0 - AP * 2, q.x - q.x0 + AP * 6)) continue;
    const r = clamp01(since / AFTER_LOG_ROLL_S), e = 1 - (1 - r) * (1 - r);
    const x = q.x0 + (q.x - q.x0) * e;
    ctx.save();
    ctx.globalAlpha *= clamp01((since + SPLIT_S) / SPLIT_S);
    ctx.imageSmoothingEnabled = false;
    ctx.translate(x + R0, fl - R0);
    ctx.rotate((x - q.x0) / R0);
    ctx.drawImage(cv, -R0, -R0);
    ctx.restore();
  }
}
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
// The look-2 saw (config's AFTER_SAW_*, place.js `sawGeom`): a grip of
// edge and a hole, and a blade of a spine, a pale body and a row of teeth,
// all on the yard's grid, as cells like `sawCells`.
function miniCells(g, o) {
  const out = [], add = (c, r, t, front = false) => out.push([c + o, r, t, front]);
  const [gw, gh] = AFTER_SAW_GRIP;
  for (let r = g.top; r < g.top + gh; r++) for (let u = g.u0 - gw; u < g.u0; u++) {
    const edge = r === g.top || r === g.top + gh - 1 || u === g.u0 - gw || u === g.u0 - 1;
    add(u, r, edge ? K : W, true);
  }
  for (let u = g.u0; u < g.u0 + g.B; u++) {
    add(u, g.b0, K);
    for (let r = g.b0 + 1; r < g.b0 + AFTER_SAW_BLADE_ROWS - 1; r++) add(u, r, PALE);
    if ((u - g.u0) % 2 === 0) add(u, g.b0 + AFTER_SAW_BLADE_ROWS - 1, K);
  }
  return out;
}
// The kerf's px: `kerf` of the trunk's w columns, from its near side, over the
// rows the saw's blade cuts.
const kerfRect = (w, kerf) => { const g = sawGeom(w); return { x: -(w - 1) / 2 * AP, y: g.kerf[0] * g.cs, w: kerf * AP, h: (g.kerf[1] - g.kerf[0] + 1) * g.cs }; };
// The saw across trunk `w` x `h`, `kerf` columns cut from its near side, `o`
// its cells along; drawn on the yard's grid in px, `d` a frame at scale 1.
function saw(d, o, w, h, kerf) {
  const g = sawGeom(w), cs = g.cs, tl = -(w - 1) / 2 * AP, tr = tl + w * AP, kr = kerfRect(w, kerf);
  const inTrunk = (x, y) => x >= tl && x + cs <= tr && y >= -h * AP && y + cs <= 0;
  const cut = (x, y) => inTrunk(x, y) && x < tl + kr.w && y >= kr.y && y + cs <= kr.y + kr.h;
  if (kerf) d.px(kr.x, kr.y, kr.w, kr.h, W);
  const cells = g.u0 == null ? sawCells(o).map(([c, r, t, f]) => [c + g.du, r + g.dr, t, f]) : miniCells(g, o);
  for (const [c, r, tone, front] of cells) { const x = c * cs, y = r * cs; if (front || !inTrunk(x, y) || cut(x, y)) d.px(x, y, cs, cs, tone); }
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
    if (p.fall != null || p.fell != null) {
      // Going over, or down and rocking back; once it has settled its trunk
      // goes to its logs (faded out as they fade in over it) and its crown
      // fades off where it lies.
      if (p.fall != null) stump(d, 1, 0);
      const st = stageOf(GROWN, big), { th, drop } = fallPose(p, t);
      const down = p.fell == null ? 0 : t - p.fell - AFTER_FALL_BOUNCE_S;
      turned(piece(st, 'trunk'), bx, th, drop, p.fell == null ? 1 : clamp01(-down / SPLIT_S));
      turned(piece(st, 'crown'), bx, th, drop, p.fell == null ? 1 : 1 - clamp01(down / AFTER_CROWN_FADE_S));
      // the dust coming up off the hit along the trunk and the crown
      if (p.fell != null && t - p.fell < DUST_S) d.fade(1 - (t - p.fell) / DUST_S, () => {
        const up = Math.floor((t - p.fell) / DUST_S * 3);
        for (let k = 0; k < 12; k++) d.c(2 + k * 2, -1 - up - (k % 2), toneOf(DUST, k, 3));
      });
    }
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
        const cs = sawGeom(w).cs, d1 = frame(bx, fl, 0, null, 1), kr = kerfRect(w, kerf);
        if (inHand) saw(d1, Math.round(hand.s / cs), w, h, kerf);
        else if (cutting) saw(d1, (Math.floor(t / 0.25) % 2 ? 2 : -2) * AP / cs, w, h, kerf);
        else if (kerf) d1.px(kr.x, kr.y, kr.w, kr.h, W);
        for (let k = 0; k < Math.min(4, Math.floor(p.chops / 2)); k++) { d.c(-2 - (k >> 1), -1, toneOf(DUST, k, 1)); d.c(2 + (k >> 1), -1, toneOf(DUST, k, 2)); }
      }
    }
  });
  drawGroundLogs(t);
}
const DUST_S = 0.8;