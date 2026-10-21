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
         TREE_CHOPS, AFTER_ART_WORK_S, AFTER_PILE_FADE_S, AFTER_FALL_BOUNCE_S, AFTER_FALL_BOUNCE, AFTER_LOG_ROLL_S,
         AFTER_STUMP_LOOK, GESTURE_STRAIN_LIFT, GESTURE_STRAIN_S, GESTURE_STUMP_DRAG,
         STUMP_ROPE_W, STUMP_ROPE_SLACK, STUMP_ROPE_POSES, STUMP_ROPE_FADE_S, STUMP_ROCK_DEG, STUMP_GIVE, STUMP_RISE_S,
         STUMP_RIP_UP, STUMP_RIP_S, STUMP_THROW_DEG, STUMP_HANG_S, STUMP_GONE_FADE_S,
         STUMP_CREEP_UP, STUMP_CREEP_S, STUMP_BREAK_UP, STUMP_BREAK_S, STUMP_BITS,
         STUMP_CLODS, STUMP_CLOD_V, STUMP_CLOD_SPREAD, STUMP_CLOD_GRAV, STUMP_CLOD_S, STUMP_HOLE_S, STUMP_SAPLING_WAIT_S } from '../../config.js';
import { plotX, afterFloor, pineOf, inPine, PINE_GROWN, STUMP, SAW_ROWS, ICON_DOT, AP } from '../../after/place.js';
import { trees, groundLogs } from '../../after/grove.js';
import { frame, K, W, PALE, MID, SOIL, DUST, toneOf, now, inView, clamp01, hash } from './kit.js';
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

// The stump pulled (AFTER_STUMP_LOOK 1 and 2): the block and its roots one
// cached drawing, placed at its true lift and turned by its true angle, so it
// comes up out of the ground whole and never stretches. Roots, in art px off
// the block's foot (its left corner), 2 by 2 each: hidden under the ground
// line and showing as the stump comes up.
const ROOTS = [[2, 0], [4, 0], [8, 0], [12, 0], [14, 0], [1, 2], [5, 2], [8, 2], [13, 2], [16, 2],
               [-1, 4], [6, 4], [9, 4], [17, 4], [-3, 6], [9, 6], [19, 6], [10, 8]];
const ROOT_M = 4, ROOT_D = 12;
const STUMP_SPRITE = new Map();
function stumpSprite() {
  const id = `${GREY[K]}|${GREY[PALE]}`;
  if (STUMP_SPRITE.has(id)) return STUMP_SPRITE.get(id);
  const [, w, h] = STUMP.map(v => v * P), cv = paper();
  if (!cv) return null;
  cv.width = (w + ROOT_M * 2) * A; cv.height = (h + ROOT_D) * A;
  const g = cv.getContext('2d');
  if (!g) return null;
  const px = (x, y, ww, hh, tone) => { g.fillStyle = GREY[tone]; g.fillRect((x + ROOT_M) * A, (y + h) * A, ww * A, hh * A); };
  px(0, -h, w, h, K); px(2, -h + 2, w - 4, 2, PALE);
  for (const [x, y] of ROOTS) px(x, y, 2, 2, K);
  // `ox`, `oy` the block's foot-left in the sheet, in screen px
  const out = { cv, ox: ROOT_M * A, oy: h * A, w: w * A, h: h * A };
  STUMP_SPRITE.set(id, out);
  return out;
}
const easeOut = u => 1 - (1 - u) * (1 - u) * (1 - u);
const ease = u => u * u * (3 - 2 * u);
// Where the stump stands: `up` px out of the ground, turned `th` about the
// foot corner it leans on; read off the sim's own lift, strain and roots.
function pullPose(p, i, s, rec, t) {
  const look = AFTER_STUMP_LOOK, deg = Math.PI / 180;
  if (s.dug == null) { s.dug = s.shownDug = s.dugFrom = p.dug || 0; s.dugAt = -1e9; }
  if (s.dug !== (p.dug || 0)) { s.dugFrom = s.shownDug; s.dug = p.dug || 0; s.dugAt = t; }
  const riseS = look === 1 ? STUMP_RISE_S : STUMP_CREEP_S;
  const k = ease(clamp01((t - s.dugAt) / riseS));
  s.shownDug = s.dugFrom + (s.dug - s.dugFrom) * k;
  const step = look === 1 ? STUMP_GIVE * A : STUMP_CREEP_UP * AP;
  let up = s.shownDug * step, th = 0;
  const mine = rec && rec.i === i && rec.grab;
  if (look === 1 && mine && rec.lift >= GESTURE_STRAIN_LIFT) {
    const n = STUMP_ROCK_DEG.length;
    th = STUMP_ROCK_DEG[Math.min(n - 1, Math.floor(rec.strain / GESTURE_STRAIN_S * n))] * deg;
  }
  return { up, th };
}
// The rope from the stump's top to the hand: bowed out while slack, in held
// poses, straight once the lift reaches the strain height.
function rope(top, handY, slack, a) {
  if (a <= 0 || handY >= top.y - STUMP_ROPE_W) return;
  const bow = Math.round(slack * STUMP_ROPE_POSES) / STUMP_ROPE_POSES * STUMP_ROPE_SLACK * AP;
  const len = top.y - handY, n = Math.ceil(len / (STUMP_ROPE_W / 2));
  ctx.save();
  ctx.globalAlpha *= a;
  ctx.fillStyle = GREY[K];
  for (let j = 0; j <= n; j++) {
    const f = j / n, x = top.x + bow * Math.sin(Math.PI * f), y = top.y - len * f;
    ctx.fillRect(Math.round(x - STUMP_ROPE_W / 2), Math.round(y - STUMP_ROPE_W / 2), STUMP_ROPE_W, STUMP_ROPE_W);
  }
  ctx.restore();
}
// Small cells flung from (x, y) at `since` s: clods of soil, or bits of root.
function flung(x, y, since, n, seed, v0, life, tone) {
  if (since < 0 || since > life) return;
  const fl = afterFloor(), sz = 2 * A;
  ctx.save();
  ctx.globalAlpha *= 1 - since / life;
  for (let k = 0; k < n; k++) {
    const h1 = hash(seed + k * 3.1), h2 = hash(seed + k * 7.7);
    const vx = (h1 - 0.5) * 2 * STUMP_CLOD_SPREAD, vy = -(v0[0] + (v0[1] - v0[0]) * h2);
    const cx = x + vx * since, cy = Math.min(fl - sz, y + vy * since + STUMP_CLOD_GRAV * since * since / 2);
    ctx.fillStyle = GREY[tone === SOIL ? toneOf(SOIL, k, seed) : tone];
    ctx.fillRect(Math.round(cx), Math.round(cy), sz, sz);
  }
  ctx.restore();
}
// The stump at plot i, in the ground or coming out of it: drawn while it
// stands, and on after it is out until it has gone.
function pulledStump(d, p, i, s, rec, t, bx) {
  const fl = afterFloor(), sp = stumpSprite(), look = AFTER_STUMP_LOOK, deg = Math.PI / 180;
  const x0 = bx + STUMP[0] * AP;
  let up, th, a = 1;
  if (p.stump) {
    ({ up, th } = pullPose(p, i, s, rec, t));
    s.up = up; s.th = th;
    if (rec && rec.i === i) { s.handY = rec.y0 - rec.target / GESTURE_STUMP_DRAG; s.slack = 1 - clamp01(rec.lift / GESTURE_STRAIN_LIFT); }
  } else {
    // Out: up in one eased lift from where it stood, held, faded.
    if (s.ripAt !== s.gone) { s.ripAt = s.gone; s.up0 = s.up || 0; s.th0 = s.th || 0; }
    const since = t - s.gone, ripS = look === 1 ? STUMP_RIP_S : STUMP_BREAK_S;
    const e = easeOut(clamp01(since / ripS));
    up = s.up0 + (look === 1 ? STUMP_RIP_UP : STUMP_BREAK_UP) * AP * e;
    th = s.th0 + ((look === 1 ? STUMP_THROW_DEG : 0) * deg - s.th0) * e;
    a = 1 - clamp01((since - ripS - STUMP_HANG_S) / STUMP_GONE_FADE_S);
    // the hole it leaves, fading back to soil
    d.fade(1 - since / STUMP_HOLE_S, () => { for (let c = STUMP[0]; c < STUMP[0] + STUMP[1]; c++) d.c(c, -1, W); });
    flung(x0 + STUMP[1] * AP / 2, fl - AP, since, STUMP_CLODS[look - 1], i * 17 + 1, STUMP_CLOD_V, STUMP_CLOD_S, SOIL);
    if (since < STUMP_CLOD_S) d.fade(1 - since / STUMP_CLOD_S, () => {
      const rise = Math.floor(since / STUMP_CLOD_S * 3);
      for (let k = 0; k < 8; k++) d.c(STUMP[0] - 2 + k * 1, -1 - rise - (k % 2), toneOf(DUST, k, 5));
    });
  }
  // The hole under a stump already lifted clear of its row.
  if (p.stump && up >= 2 * A) for (let c = STUMP[0]; c < STUMP[0] + STUMP[1]; c++) d.c(c, -1, W);
  // B: bits of root torn off the foot at each root given.
  if (look === 2 && p.stump) flung(x0 + STUMP[1] * AP / 2, fl - AP / 2, t - s.dugAt, STUMP_BITS, i * 31 + s.dug, [60, 110], 0.45, K);
  // The rope, faded in on the grab and out let go or once the stump is out.
  const held = !!(rec && rec.i === i && rec.grab && p.stump);
  if (held !== s.held) { s.held = held; s.heldAt = t; }
  const ra = held ? clamp01((t - s.heldAt) / STUMP_ROPE_FADE_S) : 1 - clamp01((t - s.heldAt) / STUMP_ROPE_FADE_S);
  if (!sp || a <= 0) return;
  // the block's foot corner it leans on, and the point the rope is tied to
  const left = th < 0, pvx = left ? x0 : x0 + sp.w, pvy = fl - up;
  const cos = Math.cos(th), sin = Math.sin(th), tx = x0 + sp.w / 2 - pvx, ty = -sp.h;
  const top = { x: pvx + tx * cos - ty * sin, y: pvy + tx * sin + ty * cos };
  if (s.handY != null) rope(top, s.handY, s.slack ?? 1, ra * a);
  ctx.save();
  ctx.beginPath(); ctx.rect(x0 - AP * 4, fl - AP * 20, sp.w + AP * 8, AP * 20); ctx.clip();
  ctx.globalAlpha *= a;
  ctx.imageSmoothingEnabled = false;
  ctx.translate(pvx, pvy);
  ctx.rotate(th);
  ctx.drawImage(sp.cv, x0 - pvx - sp.ox, -sp.oy);
  ctx.restore();
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
  if (p.stage !== s.stage) { s.prev = s.stage; s.stage = p.stage; s.at = t; s.wait = 0; }
  if (s.stump && !p.stump) {
    s.gone = t;
    // the sapling set in the hole only once the stump pulled has gone
    if (AFTER_STUMP_LOOK && s.at === t) s.wait = STUMP_SAPLING_WAIT_S;
  }
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
    if (AFTER_STUMP_LOOK) { if ((p.stump && p.fall == null) || (!p.stump && t - s.gone < STUMP_HOLE_S)) pulledStump(d, p, i, s, lift, t, bx); }
    else if (p.stump && p.fall == null) stump(d, 1, p.dug || 0, lift && lift.i === i ? lift.lift : 0);
    else if (!p.stump && t - s.gone < AFTER_BUILD_FADE_S) stump(d, 1 - (t - s.gone) / AFTER_BUILD_FADE_S, AFTER_DIG_CLICKS);
    if (p.fall == null && p.stage) {
      // A stage coming in, faded over the one it grew from.
      const a = clamp01((t - s.at - (s.wait || 0)) / AFTER_BUILD_FADE_S) * cleared;
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
  });
  drawGroundLogs(t);
}
const DUST_S = 0.8;