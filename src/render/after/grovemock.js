// MOCK grove: the grove redesign's drawing (after/grovemock.js is its
// director), never merged. While `globalThis.__groveMock` is set, plot 0 is
// drawn from here instead of render/after/pine.js: the mock pine (a trunk a
// log wide, its length its logs end to end, each log a shade of the log's
// brown, the crown in tiers on it), standing, growing cell by cell, going
// over by its true angle (today's tip, the fall's numbers), its crown
// breaking where it hits into pieces that fly, tumble and fade (the one fade
// the owner allowed); the trunk lying as its logs, the cut opening at its
// far end and the end log tumbling off it; the stump a whole log's block.
// Over the members, the woodcutter's tools and the acorn on a planter's
// head; over everything, the ghost hand and the hand.
//
// The first plot stands by the forestry shack, so a tree there falls away
// from it, left: for the options with a fall the director works it as a fall
// to the right and everything here is drawn turned about the plot's middle
// line (`turned`, `mx`).
//
// Art on the grid, motion smooth: every drawing is whole cells on its own
// grid, and a thing that moves or turns is laid at its true position.

import { GREY, P, AFTER_FALL_S, AFTER_FALL_BOUNCE_S, AFTER_FALL_BOUNCE, GESTURE_CUE_ALPHA, TREE_CHOPS, AFTER_DIG_CLICKS } from '../../config.js';
import { ctx } from '../ctx.js';
import { themed, darkPage, raw } from '../../ink.js';
import { K, W, PALE, MID, SOIL, DUST, toneOf, now, clamp01, hash } from './kit.js';
import { goodTone } from './piles.js';
import { handOn } from '../aftercues.js';
import { drawBody, drawSquat } from '../crew.js';
import { trees } from '../../after/grove.js';
import { gestureView } from '../../after/gestures.js';
import { AP, basketBox, GROVE_BASKET } from '../../after/place.js';
import { M, MT, TRUNK_TOP, treeCells, grownShape, rowOrder, bx, fl, mx, pivotX, cutX, trunkTop, GRIP, SWING, ROLL_S, SAW_ANG, SAW_TIP,
         STROKE, shovelAt, SHOVEL_H, basketSlot, TREE_ACORNS, TIP_S, groveMockOn } from '../../after/grovemock.js';

export { groveMockOn };
const BODY = 3 * P;
// A tone: one of the act's greys by its rung, or a color itself (the goods').
const ink = tone => (typeof tone === 'string' || tone instanceof String ? tone : GREY[tone]);
// The crown in colour (C-green-1..3): four tones a family at the goods' act 1
// contrast, lightest first -- the lit tips, the body, the body's darker
// half, the shadow under each shelf -- every cell one of them, picked once
// off where it stands; on the dark page each lifted a step, drawn raw as the
// goods' are. Kept clear of act 1's crop green (#57c074): these are darker,
// bluer or browner. 0, the crown in ink as it is.
const CROWNS = {
  1: { light: ['#3e7a52', '#336645', '#2c5a3c', '#1f432c'], dark: ['#54996b', '#47855b', '#3d7650', '#2f5e3e'] },   // deep pine green
  2: { light: ['#7d8c3a', '#6a7731', '#5e6a2b', '#475121'], dark: ['#98a84c', '#839240', '#758339', '#5d692c'] },   // warm moss green
  3: { light: ['#3b7a76', '#316764', '#2b5a57', '#1f4442'], dark: ['#4f9893', '#43837f', '#3a7470', '#2d5c59'] }    // blue-green
};
// A crown cell's tone, by where it stands in the tree (its own column and
// row, so it keeps its shade standing, falling and in a broken piece): the
// two body tones most, the lit tone on a shelf's top row's ends, the shadow
// on a shelf's bottom row.
const ROLE = new Map();   // cache: each crown cell's role, worked out once off the pine
function crownRoles() {
  if (ROLE.size) return ROLE;
  const crown = treeCells().filter(q => q[2] === 'crown'), rows = new Map();
  for (const [c, r, , ti] of crown) { const k = `${ti}|${r}`; const s = rows.get(k) || [c, c]; rows.set(k, [Math.min(s[0], c), Math.max(s[1], c)]); }
  const bottom = new Map();
  for (const [, r, , ti] of crown) bottom.set(ti, Math.max(bottom.get(ti) ?? r, r));
  for (const [c, r, , ti] of crown) {
    const [a, b] = rows.get(`${ti}|${r}`);
    ROLE.set(`${c}|${r}`, r === bottom.get(ti) ? 3 : (c === a || c === b) ? 0 : null);
  }
  return ROLE;
}
function crownTone(c, r) {
  const pal = CROWNS[M.crownPal];
  if (!pal) return K;
  const l = darkPage ? pal.dark.map(raw) : pal.light, role = crownRoles().get(`${c}|${r}`), h = hash(c * 31.7 + r * 17.3);
  // the shelf's underside in shadow, its stepped ends lit, the body the two
  // middle tones a cell at a time
  return l[role != null ? role : h < 0.5 ? 1 : 2];
}
const fill = (tone, x, y, w, h) => { ctx.fillStyle = ink(tone); ctx.fillRect(x, y, w, h); };
const paper = () => (typeof document === 'undefined' ? null : document.createElement('canvas'));
const ease = u => u * u * (3 - 2 * u);
// The log's shades (the goods' brown, config/palette.js AFTER_GOODS.log): a
// trunk's logs and its stump each one of them, picked once a tree.
const LOG = i => goodTone('log', i || 0);
const logTone = j => LOG(M.tones ? M.tones[Math.min(MT.logs - 1, Math.max(0, j))] : 0);
const stumpTone = () => LOG(M.stumpTone);
// The trunk's log a row of the standing tree is part of (0 the lowest).
const segOf = r => Math.floor((-MT.stump - 1 - r) / MT.log);
// Everything of the plot's drawn turned about its middle line, for a fall to the left.
function turned(draw) {
  if (!M.flip) { draw(); return; }
  ctx.save();
  ctx.translate(2 * bx(), 0); ctx.scale(-1, 1);
  try { draw(); } finally { ctx.restore(); }
}

// --- sprites -------------------------------------------------------------------------------
// A drawing of cells [x, y, tone] (cell coordinates off its origin, which is
// the corner at cell (0, 0)'s top left) cached on its own sheet, with where
// its origin sits on the sheet.
const SPRITES = themed(new Map());   // cleared on a theme change, as pine.js's pieces are
function sprite(id, cells) {
  if (SPRITES.has(id)) return SPRITES.get(id);
  const cv = paper();
  if (!cv || !cells.length) return null;
  const x0 = Math.min(...cells.map(c => c[0])), y0 = Math.min(...cells.map(c => c[1]));
  const x1 = Math.max(...cells.map(c => c[0])), y1 = Math.max(...cells.map(c => c[1]));
  cv.width = (x1 - x0 + 1) * AP; cv.height = (y1 - y0 + 1) * AP;
  const g = cv.getContext('2d');
  if (!g) return null;
  for (const [x, y, tone, sx, sy, sw, sh] of cells) {
    g.fillStyle = ink(tone);
    if (sw) g.fillRect((x - x0) * AP + sx, (y - y0) * AP + sy, sw, sh);
    else g.fillRect((x - x0) * AP, (y - y0) * AP, AP, AP);
  }
  const out = { cv, ox: -x0 * AP, oy: -y0 * AP };
  SPRITES.set(id, out);
  return out;
}
// A sprite laid with its origin at (x, y), turned th about it, mirrored with `flip`.
function lay(sp, x, y, th = 0, flip = false, a = 1) {
  if (!sp || a <= 0) return;
  ctx.save();
  ctx.globalAlpha *= a;
  ctx.imageSmoothingEnabled = false;
  ctx.translate(x, y);
  if (flip) ctx.scale(-1, 1);
  ctx.rotate(th);
  ctx.drawImage(sp.cv, -sp.ox, -sp.oy);
  ctx.restore();
}
// A sprite laid by the middle of its cell (0, 0) rather than its corner.
const layMid = (sp, x, y, th, flip, a) => { if (sp) lay({ ...sp, ox: sp.ox + AP / 2, oy: sp.oy + AP / 2 }, x, y, th, flip, a); };

// --- the pine's pieces --------------------------------------------------------------------
// In cells off the pivot the fall turns about (the trunk's right edge on the
// stump's top): the trunk past the stump, its logs each in its shade, and
// the crown in ink.
const PIV_C = MT.c0 + MT.w, PIV_R = -MT.stump;
const trunkCells = () => {
  const out = [];
  for (let r = TRUNK_TOP; r < -MT.stump; r++) for (let c = MT.c0; c < MT.c0 + MT.w; c++) out.push([c - PIV_C, r - PIV_R, logTone(segOf(r))]);
  return out;
};
const crownCells = () => treeCells().filter(q => q[2] === 'crown').map(([c, r, , ti]) => [c - PIV_C, r - PIV_R, crownTone(c, r), ti]);
// The crown broken where it hits: each tier in pieces across, each a sprite
// about its own middle, with where that middle is off the pivot.
const PIECES = [];
function crownPieces() {
  if (PIECES.length) return PIECES;
  const cells = crownCells(), cut = [-PIV_C - 3, -PIV_C, -PIV_C + 3];
  const groups = new Map();
  for (const q of cells) {
    const band = q[0] < cut[0] ? 0 : q[0] < cut[1] ? 1 : q[0] < cut[2] ? 2 : 3;
    const key = `${q[3]}|${band}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(q);
  }
  let n = 0;
  for (const [key, qs] of groups) {
    const cx = qs.reduce((s, q) => s + q[0] + 0.5, 0) / qs.length, cy = qs.reduce((s, q) => s + q[1] + 0.5, 0) / qs.length;
    const rx = Math.round(cx), ry = Math.round(cy);
    // its cells off a whole cell near its middle, so it turns about that
    // each cell with where it stood in the tree, for its tone
    PIECES.push({ key, cx: rx * AP, cy: ry * AP, cells: qs.map(q => [q[0] - rx, q[1] - ry, q[0] + PIV_C, q[1] + PIV_R]), seed: ++n * 7.31 });
  }
  return PIECES;
}
// The fall's pose (render/after/pine.js, `fallPose`, the same numbers): the
// angle and the drop growing as the square of the time, then the rock back.
function fallPose(p, t) {
  const sh = MT.stump * AP;
  if (p.fall != null) { const u = clamp01((t - p.fall) / AFTER_FALL_S), k = u * u; return { th: Math.PI / 2 * k, drop: sh * k }; }
  const v = clamp01((t - p.fell) / AFTER_FALL_BOUNCE_S);
  return { th: Math.PI / 2 - AFTER_FALL_BOUNCE * Math.sin(Math.PI * v) * (1 - v), drop: sh };
}
// Where a point off the pivot (upright, px) is with the tree turned th, let `drop` down.
const turnPt = (x, y, th, drop) => ({ x: pivotX() + x * Math.cos(th) - y * Math.sin(th), y: fl() - MT.stump * AP + drop + x * Math.sin(th) + y * Math.cos(th) });

const CROWN_S = 1.7, CROWN_HOLD = 0.3, GRAV = 620;
function drawCrownBreak(t) {
  const since = t - M.landed;
  if (since < 0 || since > CROWN_S) return;
  const th = Math.PI / 2, drop = MT.stump * AP, a = since < CROWN_HOLD ? 1 : 1 - (since - CROWN_HOLD) / (CROWN_S - CROWN_HOLD);
  for (const pc of crownPieces()) {
    const h1 = hash(pc.seed), h2 = hash(pc.seed + 3.3), h3 = hash(pc.seed + 9.1);
    const at = turnPt(pc.cx, pc.cy, th, drop);
    const vx = 20 + (h1 - 0.5) * 150, vy = -(60 + h2 * 110), w = (h3 - 0.5) * 6;
    const half = AP * 1.5, x = at.x + vx * (1 - Math.exp(-2.2 * since)) / 2.2;
    const y = Math.min(fl() - half, at.y + vy * since + GRAV * since * since / 2);
    lay(sprite(`pc|${pc.key}|${M.crownPal}`, pc.cells.map(([cx, cy, c, r]) => [cx, cy, crownTone(c, r)])), x, y, th + w * since, false, a);
  }
}

// --- the standing, growing and lying pine -------------------------------------------------
const cellAt = (c, r, tone) => fill(tone, bx() + c * AP, fl() + r * AP, AP, AP);
// The plot's bed of soil, its cells across BED (render/after/ground.js keeps
// the cloud's lip off it, so the plot reads above the cloud line).
export const BED = [-6, 5];
function soil() { for (let c = BED[0]; c <= BED[1]; c++) cellAt(c, -1, toneOf(SOIL, bx() / AP + c, 0)); }
// The standing pine, or the cells of it grown so far: the stump and each of
// the trunk's logs in its shade, the crown in ink.
function pineCells(cells) {
  for (const [c, r, part] of cells) cellAt(c, r, part === 'crown' ? crownTone(c, r) : r >= -MT.stump ? stumpTone() : logTone(segOf(r)));
}
// The felling cut along the stump's top, `n` cells in from the near side: a
// line opening across the trunk.
function fellCut(n) { if (n > 0) fill(K, bx() + MT.c0 * AP, fl() - MT.stump * AP - 1, Math.round(n * AP), 1); }
// The stump: a whole log's block on the ground. F3a: lifted `up` px on the
// hand, its roots under it, those not yet snapped strained to the ground and
// the snapped ones stubs. F3b: tilted `tilt` up off the shovel's side about
// its far foot.
// Three roots (the owner: "a little more root like and thicker"), each cells
// [column off the block's left, depth under its foot]: two thick where they
// leave the stump, tapering and branching as they go down, in the log's
// darkest shade. Pulled, each shows as far as the stump is up; snapped, only
// its stub where it leaves the block.
const ROOTS = [
  [[0, 0], [1, 0], [-1, 1], [0, 1], [-1, 2], [0, 2], [-2, 3], [0, 3]],
  [[2, 0], [1, 1], [2, 1], [2, 2], [1, 3], [3, 3]],
  [[3, 0], [4, 0], [3, 1], [4, 1], [4, 2], [3, 2], [5, 3]]
];
function stump(up = 0, tilt = 0, roots = 0) {
  const x = bx() + MT.c0 * AP, y = fl() - MT.stump * AP - up, z = MT.w * AP;
  if (tilt) {
    ctx.save(); ctx.translate(x, fl()); ctx.rotate(-tilt);
    fill(stumpTone(), 0, -z, z, z);
    ctx.restore();
    return;
  }
  const foot = fl() - up, wood = LOG(3);
  ROOTS.forEach((cells, k) => {
    const live = k >= ROOTS.length - roots;
    for (const [c, d] of cells) {
      if (!live && d > 0) continue;
      const cy = foot + d * AP, h = Math.min(AP, fl() - cy);
      if (h > 0) fill(wood, x + c * AP, cy, AP, h);
    }
  });
  fill(stumpTone(), x, y, z, z);
}
// F3a-1, -2, -3: the stump pulled with more to read in it (after/grovemock.js,
// `_f3a`). `left` the roots not yet snapped; the next to go is the lowest
// index still whole (they go left to right).
// F3a-3's roots as cords over the soil from the start, one to a root, cells
// [column off the plot's trunk line, row]: the first the end tied to the
// stump (it rises with it), the rest lying on the ground.
const CORDS = [
  [[-3, -1], [-4, -1], [-5, -1], [-6, -1], [-7, -1]],
  [[2, -1], [3, -1], [4, -1]],
  [[2, -3], [3, -2], [4, -2], [5, -1], [6, -1]]
];
const CHIP_S = 0.7, CHIPS = 7;
// `block` false once the stump is out and on the hand: only what it left.
function pulledStump(p, t, block) {
  const s = M.style, dig = AFTER_DIG_CLICKS, left = p.stump ? dig - (p.dug || 0) : (M.ph === 'last' ? 1 : 0);
  const next = left > 0 ? dig - left : -1, since = M.snapAt == null ? 9 : t - M.snapAt;
  let up = M.stumpUp || 0;
  // the snap held: the stump jerked up a cell, held a beat (the earth gives)
  if (s === 1 && since < 0.3) up += AP;
  const x = bx() + MT.c0 * AP, z = MT.w * AP, foot = fl() - up, wood = LOG(3);
  // the earth gives: the soil cracked either side, wider as the work goes
  if (s === 1) {
    const q = Math.min(1, ((p.dug || 0) + M.strain) / dig), n = p.stump ? Math.ceil(q * 4) : 4;
    for (let i = 0; i < n; i++) { cellAt(MT.c0 - 1 - i * 2, -1, K); cellAt(MT.c0 + MT.w + i * 2, -1, K); }
  }
  // the roots under it: snapped ones stubs; the one under strain taut (1),
  // stretched (2); the last and biggest thicker (2)
  if (block) ROOTS.forEach((cells, k) => {
    const live = k >= dig - left, strained = k === next && M.strain > 0;
    for (const [c, d] of cells) {
      if (!live && d > 0) continue;
      const cx = x + c * AP;
      if (s === 1 && strained && M.strain > 0.45) {
        // taut: straight down to the ground under where it leaves the stump
        if (d === 0) fill(wood, cx, foot, AP, Math.max(0, fl() - foot));
        continue;
      }
      const stretch = s === 2 && strained ? 1 + Math.round(M.strain * 2) / 2 : 1;
      const cy = foot + d * AP * stretch, h = Math.min(AP * stretch, fl() - cy);
      if (h > 0) { fill(wood, cx, cy, AP, h); if (s === 2 && k === ROOTS.length - 1 && live) fill(wood, cx - AP, cy, AP, Math.min(AP, h)); }
    }
  });
  // root count: the cords over the soil, the tied end rising with the stump;
  // a snapped cord broken, its stub on the stump and the rest left lying
  if (s === 3) CORDS.forEach((cells, k) => {
    const live = k >= dig - left, [ac, ar] = cells[0], ay = fl() + ar * AP - up;
    if (block) fill(wood, bx() + ac * AP, ay, AP, AP);
    if (live && up > 0) fill(wood, bx() + ac * AP, ay, AP, Math.max(AP, fl() + ar * AP - ay + AP));
    for (const [c, r] of cells.slice(live ? 1 : 2)) fill(wood, bx() + c * AP, fl() + r * AP, AP, AP);
  });
  if (block) fill(stumpTone(), x, foot - z, z, z);
  // each snap's burst: dirt chips (1, 3) thrown off the break, lying where
  // they land on the soil; the held impact a star at the break (3)
  for (const b of M.chips || []) {
    const age = t - b.at, bx0 = x + (ROOTS[b.k][0][0] + 0.5) * AP;
    for (let j = 0; j < CHIPS; j++) {
      const h1 = hash(b.at * 7 + j), h2 = hash(b.at * 13 + j * 3), a = Math.min(age, CHIP_S);
      const vx = (h1 - 0.5) * 140, vy = -(70 + h2 * 90), cx = bx0 + vx * a, cy = Math.min(fl() - AP - AP / 2, fl() - AP + vy * a + 400 * a * a);
      fill(toneOf(SOIL, j, b.k), Math.round(cx), Math.round(cy), AP / 2, AP / 2);
    }
    if (s === 3 && age < 0.3) for (const [dx, dy] of [[1, 0], [-1, 0], [0, -1], [1, -1], [-1, -1]]) fill(K, Math.round(bx0 + dx * AP * 1.5), Math.round(fl() - AP + dy * AP * 1.5), AP / 2, AP / 2);
  }
}
// The trunk lying from the pivot along the floor, `n` logs of it, each in
// its shade, and the cut at the far log opening down from the top.
function lyingTrunk(n, cut) {
  if (n <= 0) return;
  const y = trunkTop(), z = MT.log * AP, h = MT.w * AP;
  for (let j = 0; j < n; j++) fill(logTone(j), pivotX() + j * z, y, z, h);
  if (cut > 0 && n > 1) fill(K, cutX(n) - 1, y, 1, Math.round(Math.min(1, cut) * h));
}
// A log cut free, tumbling off the end: a quarter turn over its far bottom
// corner, slow then quick.
function rolling(t) {
  if (!M.roll) return;
  const k = clamp01((t - M.roll.at) / ROLL_S), th = Math.PI / 2 * k * k, z = MT.log * AP;
  ctx.save();
  ctx.translate(M.roll.x + z, fl()); ctx.rotate(th);
  fill(logTone(M.logs - 1), -z, -z, z, z);
  ctx.restore();
}
// The acorn (the owner: "lets make the seed look like an acorn"): three
// cells wide and four high off its top left, a stalk and a cap in the log's
// darkest shade over a nut in its warmest, rounded at the foot.
const AW = 3, AH = 4;
const ACORN_CELLS = () => [[1, 0, LOG(3)], [0, 1, LOG(3)], [1, 1, LOG(3)], [2, 1, LOG(3)], [0, 2, LOG(0)], [1, 2, LOG(0)], [2, 2, LOG(0)], [1, 3, LOG(0)]];
function acorn(x, y) { for (const [c, r, tone] of ACORN_CELLS()) fill(tone, x + c * AP, y + r * AP, AP, AP); }
// The crown's acorns as one drawing in cells off the fall's pivot, turned with the tree.
const treeAcornCells = () => TREE_ACORNS.flatMap(([x, y]) => ACORN_CELLS().map(([c, r, tone]) => [x + c, y + r, tone]));
export const ACORN = { w: AW * AP, h: AH * AP };
const SINK_S = 0.9;
function acornInGround(t) {
  const c = M.cone;
  if (!c) return;
  const sx = bx() - AW * AP / 2, rest = fl() - AP - AH * AP;
  if (c.state === 'lying') { acorn(Math.round(c.x), Math.round(c.y)); return; }
  if (c.state === 'set') {
    const k = ease(clamp01((t - c.at) / 0.5));
    acorn(Math.round(c.from.x + (sx - c.from.x) * k), Math.round(c.from.y + (rest - c.from.y) * k - Math.sin(Math.PI * k) * AP * 2));
    return;
  }
  if (c.state === 'in') {
    // pressed into the soil, under its top
    const k = clamp01((t - c.at) / SINK_S);
    if (k >= 1) return;
    ctx.save();
    ctx.beginPath(); ctx.rect(sx - AP, rest - AP * 6, AP * 6, AP * 6 + AH * AP); ctx.clip();
    acorn(sx, Math.round(rest + AH * AP * k));
    ctx.restore();
  }
}
// The saw across the standing trunk (F1, before it goes over), `s` px along
// where the hand has it: a grip at the near end and the blade along the
// felling cut, a log's height up the trunk, its teeth under it; the blade
// hidden in the wood where it has not cut, showing in the cut.
function standingSaw(s, kerf) {
  const t0 = MT.c0, row = -MT.stump - 1, inTrunk = c => c >= t0 && c < t0 + MT.w;
  ctx.save();
  ctx.translate(s, 0);
  for (let r = row - 3; r <= row; r++) for (let c = -15; c <= -13; c++) {
    const hole = c === -14 && (r === row - 2 || r === row - 1);
    cellAt(c, r, hole ? W : K);
  }
  for (let c = -12; c <= 5; c++) {
    // the trunk column this blade cell is over, the saw where the hand has it
    const cc = Math.round(c + s / AP);
    if (inTrunk(cc) && cc >= t0 + kerf) continue;
    cellAt(c, row, PALE);
    fill(K, bx() + c * AP, fl() + row * AP, AP, 1);
    if ((c & 1) === 0 && !inTrunk(cc)) cellAt(c, row + 1, K);
  }
  ctx.restore();
}
// F3b's shovel: a grip, a handle and a blade in the ground, off its foot.
const SHOVEL = () => sprite('shovel', [[-1, -7, K], [0, -7, K], [1, -7, K], ...[-6, -5, -4, -3, -2].map(r => [0, r, MID]), [-1, -1, K], [0, -1, K], [1, -1, K]]);
function shovel() {
  const s = shovelAt(), sh = M.shovel || { ang: 0 };
  if (sh.sm) layMid(SHOVEL(), s.x, s.y + AP / 2, sh.from, false, 0.35);
  layMid(SHOVEL(), s.x, s.y + AP / 2, sh.ang, false);
}

// The seed basket beside the shack (after/place.js, `basketBox`): the
// acorns in it, M.basket of them, each where it sits (`basketSlot`), and
// over their feet the basket, a rim and a body tapering to its foot in
// timber's pale wood, a weave of its darker shade across the middle.
function basket() {
  const k = basketBox(), rim = goodTone('plank', 3), body = goodTone('plank', 1), weave = goodTone('plank', 2);
  for (let i = 0; i < M.basket; i++) { const s = basketSlot(i); acorn(Math.round(s.x), Math.round(s.y)); }
  fill(rim, k.x, k.y, k.w, AP);
  fill(body, k.x, k.y + AP, k.w, AP);
  for (let c = 1; c < GROVE_BASKET.w; c += 2) fill(weave, k.x + c * AP, k.y + AP, AP, AP);
  fill(body, k.x + AP, k.y + 2 * AP, k.w - 2 * AP, AP);
}

export function drawGroveMock() {
  const t = now(), p = trees()[0];
  if (!p) return;
  basket();
  turned(() => {
    soil();
    acornInGround(t);
    // the stump, standing, coming up on the hand, or levered over
    const falling = p.fall != null || (p.fell != null && t - p.fell < AFTER_FALL_BOUNCE_S);
    const tipping = M.opt === 'f3b' && M.ph === 'tip';
    if (M.style && /^f3a\d$/.test(M.opt)) pulledStump(p, t, p.stump || M.ph === 'last');
    else if (p.stump || falling || tipping) {
      if (M.opt === 'f3') stump(p.stump ? (p.dug || 0) / AFTER_DIG_CLICKS * AP * 1.5 : 0);
      else if (M.opt === 'f3a') stump(M.stumpUp || 0, 0, AFTER_DIG_CLICKS - (p.dug || 0));
      else if (M.opt === 'f3b') stump(0, M.tilt || 0);
      else stump();
    }
    if (M.opt === 'f3b') shovel();
    if (falling) {
      // over whole, the trunk and the crown one drawing turned about the cut;
      // the crown broken off the moment it hits
      const { th, drop } = fallPose(p, t), o = turnPt(0, 0, th, drop);
      lay(sprite(`trunk|${M.tones}`, trunkCells()), o.x, o.y, th);
      if (p.fall != null) lay(sprite(`crown|${M.crownPal}`, crownCells()), o.x, o.y, th);
    } else if (M.logs > 0) lyingTrunk(M.logs, M.cut);
    if (M.landed != null) drawCrownBreak(t);
    // S1: the acorns in the crown, standing and going over with it; then out
    // of it, falling to the ground and lying, or being lifted onto a head
    if (M.opt === 's1' && M.landed == null) {
      if (falling) { const { th, drop } = fallPose(p, t), o = turnPt(0, 0, th, drop); lay(sprite('tree-acorns', treeAcornCells()), o.x, o.y, th); }
      else if (p.stage) for (const [x, y] of TREE_ACORNS) acorn(bx() + (x + PIV_C) * AP, fl() + (y + PIV_R) * AP);
    }
    for (const q of M.dropped || []) {
      if (q.taken) continue;
      const rest = fl() - AH * AP, since = t - q.at, y = Math.min(rest, q.y0 + 0.5 * 900 * since * since);
      if (q.liftAt && M.bodies[0]) {
        const b = M.bodies[0], k = ease(clamp01((t - q.liftAt) / 0.35)), hx = b.x + BODY / 2 - AW * AP / 2, hy = b.y - BODY + P - (b.acorns + 1) * AH * AP;
        acorn(Math.round(q.x + (hx - q.x) * k), Math.round(rest + (hy - rest) * k));
      } else acorn(Math.round(q.x), Math.round(y));
    }
    rolling(t);
    // standing whole, or growing
    if (p.stage && p.fall == null) {
      pineCells(treeCells());
      const rec = (gestureView() || []).find(r => r.key === 'tree');
      const kerf = M.opt === 'f1' ? Math.ceil(Math.min(1, p.chops / TREE_CHOPS) * MT.w) : M.notch;
      fellCut(kerf);
      if (M.sawAt && !M.sawAt.buck) standingSaw(rec && rec.i === 0 ? rec.s : 0, kerf);
    } else if (M.grow && !p.stage && !p.stump) {
      const f = clamp01((t - M.grow.at) / M.grow.dur);
      if (f > 0) {
        if (M.grow.kind === 'b1') { const all = rowOrder(); pineCells(all.slice(0, Math.max(1, Math.floor(f * all.length)))); }
        else pineCells(grownShape(Math.max(0.04, Math.floor(f * 40) / 40)));
      }
    }
  });
}

// --- the tools --------------------------------------------------------------------------
// The axe: a handle of three cells and a head of two by three, off the hand
// at the handle's near end (after/grovemock.js, AXE_BIT, AXE_FRONT); the
// edge down when the handle is level.
const AXE = () => (M.axe ? sprite(`axe${M.axe}`, AXES[M.axe]()) : sprite('axe', [[0, 0, MID], [1, 0, MID], [2, 0, MID], [3, -1, K], [4, -1, K], [3, 0, K], [4, 0, K], [3, 1, K], [4, 1, K]]));
// The D2 axe drawings (after/grovemock.js, AXE_FRONTS: the far face, cells
// off the hand): a haft of five cells in the timber's mid shade, an eye and
// cheek in ink, and the bit, the cutting edge facing on along the haft so it
// leads into the cut, flaring wider than the poll, in timber's pale shade.
//   1 a felling axe: poll two cells tall, cheek three, the bit five
//   2 a bearded axe: the head's beard sweeping down under it to a long bit
const HAFT = () => [0, 1, 2, 3, 4].map(x => [x, 0, goodTone('plank', 2)]);
const AXES = {
  1: () => [...HAFT(), [5, -1, K], [5, 0, K], [6, -1, K], [6, 0, K], [6, 1, K],
            ...[-2, -1, 0, 1, 2].map(y => [7, y, goodTone('plank', 0)])],
  2: () => [...HAFT(), [5, -1, K], [5, 0, K], [6, -1, K], [6, 0, K], [6, 1, K], [6, 2, K], [5, 2, K],
            ...[-1, 0, 1, 2, 3].map(y => [7, y, goodTone('plank', 0)])]
};
// where the edge is, off the hand, the haft level: for the blow's puff
const AXE_EDGE = { 0: [3.5, 1.5], 1: [7.5, 0], 2: [7.5, 1] };
const axeAt = (x, y, ang, flip, a = 1) => layMid(AXE(), x, y, ang, flip, a);
// The hand's axe: the same with a handle two cells longer, so it shows past
// the fist that holds its end (after/grovemock.js, HAND_AXE_FRONT).
const HAND_AXE = () => sprite('handaxe', [0, 1, 2, 3, 4].map(x => [x, 0, MID]).concat([[5, -1, K], [6, -1, K], [5, 0, K], [6, 0, K], [5, 1, K], [6, 1, K]]));
const handAxeAt = (x, y, ang, flip, a = 1) => layMid(HAND_AXE(), x, y, ang, flip, a);
// The bucking saw: a grip of two by two and a blade of three, its teeth
// along one side; held upright its tip is SAW_TIP under the grip.
const SAW = () => sprite('saw', [[-1, -1, K], [0, -1, K], [-1, 0, K], [0, 0, K],
  [1, 0, PALE], [2, 0, PALE], [3, 0, PALE], [1, 1, K], [3, 1, K], [1, 0, K, 0, 0, AP * 3, 1]]);
const sawAt = (x, y, ang, flip) => lay(SAW(), x, y, ang, flip);
// The woodcutter's felling saws, three designs, each off the hand at its
// grip (cell (0, 0)), the blade along row 0 forward, the teeth under it:
//   saw1 the two-man crosscut: a long blade between two upright pegs
//   saw2 the bow saw: a blade strung under a bow of ink
//   saw3 the pruning saw: a short curved blade off a grip
const TEETH = xs => xs.map(x => [x, 1, K]);
const FELL_SAWS = {
  saw1: () => [[0, -2, K], [0, -1, K], [0, 0, K], ...[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(x => [x, 0, PALE]), ...TEETH([1, 3, 5, 7, 9]), [11, -2, K], [11, -1, K], [11, 0, K]],
  saw2: () => [[0, 0, K], [0, -1, K], [1, -2, K], [2, -3, K], [3, -3, K], [4, -3, K], [5, -3, K], [6, -3, K], [7, -2, K], [8, -1, K], [8, 0, K],
               ...[1, 2, 3, 4, 5, 6, 7].map(x => [x, 0, PALE]), ...TEETH([2, 4, 6])],
  saw3: () => [[-1, 0, K], [0, 0, K], [-1, 1, K], [1, 0, PALE], [2, 0, PALE], [3, 0, PALE], [4, 0, PALE], [5, -1, PALE], ...TEETH([1, 3]), [4, 1, K]]
};
const TRAVEL = { saw1: 3, saw2: 2, saw3: 1.5 };
const fellSaw = tool => sprite(`fell|${tool}`, FELL_SAWS[tool]());
// The swing's smear: pale cells along the arc the head swept, a frame or two.
function smear(x, y, a0, a1, flip, r = 4 * AP) {
  const n = 6;
  for (let k = 0; k <= n; k++) {
    const a = a0 + (a1 - a0) * k / n, dx = Math.cos(a) * r * (flip ? -1 : 1), dy = Math.sin(a) * r;
    fill(PALE, Math.round(x + dx - AP / 2), Math.round(y + dy - AP / 2), AP, AP);
  }
}
// A puff on the blow, held with it: dust off the wood at the head.
function puff(x, y, since) {
  if (since > SWING.held) return;
  const a = 1 - since / SWING.held, was = ctx.globalAlpha;
  ctx.globalAlpha = was * a;
  for (let k = 0; k < 4; k++) fill(toneOf(DUST, k, 5), Math.round(x + (k - 1.5) * AP * 0.9), Math.round(y - AP - (k % 2) * AP - since * 30), AP / 2, AP / 2);
  ctx.globalAlpha = was;
}

// A mock body (the yard's square, its feet at y), its load and its tool.
// The square itself is laid at its turned place, never under the turn (the
// yard's square reads the transform's scale for its rim); its load and tool
// are drawn turned with the plot.
function square(b) {
  const x = Math.round(M.flip ? 2 * bx() - b.x - BODY : b.x), y = Math.round(b.y - BODY);
  if (b.squat) drawSquat(x, y); else drawBody(x, y);
}
function body(b, t) {
  const x = Math.round(b.x), y = b.y - BODY, flip = b.face < 0;
  if (b.carry && b.carry.tone != null) {
    // a log lifted off the ground onto the head, as the yard carries a load
    const z = MT.log * AP, k = ease(b.carry.k ?? 1), hx = b.x + BODY / 2 - z / 2, hy = b.y - BODY - z;
    fill(LOG(b.carry.tone), Math.round(b.carry.x + (hx - b.carry.x) * k), Math.round(fl() - z + (hy - fl() + z) * k), z, z);
  }
  // acorns carried on the head, a stack of them
  for (let i = 0; i < (b.acorns || 0); i++) acorn(x + BODY / 2 - AW * AP / 2, Math.round(y) + (b.squat ? P : 0) - (i + 1) * AH * AP);
  if (b.carry === 'cone') acorn(x + BODY / 2 - AW * AP / 2, Math.round(y) - AH * AP + (b.squat ? P : 0));
  if (!b.tool) return;
  const gx = flip ? b.x + BODY - GRIP.dx : b.x + GRIP.dx, gy = b.y + GRIP.dy;
  if (b.tool === 'axe') {
    if (b.pose === 'fly') smear(gx, gy, b.from, b.ang, flip);
    axeAt(gx, gy, b.ang, flip);
    if (b.pose === 'hit') {
      const [ea, eb] = AXE_EDGE[M.axe || 0], ex = gx + (flip ? -1 : 1) * (Math.cos(b.ang) * ea * AP - Math.sin(b.ang) * eb * AP), ey = gy + Math.sin(b.ang) * ea * AP + Math.cos(b.ang) * eb * AP;
      puff(ex, ey, t - (b.hitAt ?? t));
    }
  } else if (b.tool === 'saw') {
    // upright in the cut at the body's side, its tip as deep as the cut
    const s = b.s || 0, cutting = M.ph === 'cut' ? M.cut * MT.w * AP : 0;
    sawAt(b.x + BODY + 1 + AP / 2, b.y - SAW_TIP + cutting + s, SAW_ANG, false);
  } else if (FELL_SAWS[b.tool]) {
    const sp = fellSaw(b.tool);
    if (b.pose === 'carry') { layMid(sp, x + BODY / 2 + (flip ? AP : -AP), y - AP, flip ? 0.35 : -0.35, flip); return; }
    // held up at the felling cut, a log's height, an arm up to it: the blade
    // along the cut, `s` of its stroke in
    const cutY = fl() - MT.stump * AP, hx = b.x + BODY + 1, hy = cutY - AP / 2;
    fill(K, b.x + BODY - AP, hy, AP / 2, y - hy + 2);
    const dx = (b.s || 0) * TRAVEL[b.tool] * AP;
    if (b.smear) layMid(sp, hx + (b.smear === 'in' ? 0 : TRAVEL[b.tool] * AP), hy, 0, false, 0.35);
    layMid(sp, hx + dx, hy, 0, false);
  }
}
export function drawGroveMockBodies() {
  const t = now();
  for (const b of M.bodies) square(b);
  turned(() => { for (const b of M.bodies) body(b, t); });
  // an acorn tipped off a head into the basket
  if (M.tip) {
    const k = ease(clamp01((t - M.tip.at) / TIP_S)), a = M.tip.from, z = M.tip.to;
    acorn(Math.round(a.x + (z.x - a.x) * k), Math.round(a.y + (z.y - a.y) * k - Math.sin(Math.PI * k) * AP * 3));
  }
  // an acorn on its way out of the basket onto a planter's head
  if (M.taking && M.bodies[0]) {
    const b = M.bodies[0], k = ease(clamp01((t - M.taking.at) / 0.45)), s = M.taking.from;
    const hx = b.x + BODY / 2 - AW * AP / 2, hy = b.y - BODY - AH * AP + (b.squat ? P : 0);
    acorn(Math.round(s.x + (hx - s.x) * k), Math.round(s.y + (hy - s.y) * k - Math.sin(Math.PI * k) * AP * 2));
  }
}

// --- the hands --------------------------------------------------------------------------
// The ghost hand teaching (the cues' own, faint) and the hand itself, drawn
// over everything as the saw mill's hand scene draws it, at their turned
// places but never mirrored themselves; what each holds: the axe, the saw,
// the acorn, the stump.
export function drawGroveMockCues() {
  const p = trees()[0];
  const g = M.ghost;
  if (g) {
    ctx.globalAlpha = GESTURE_CUE_ALPHA;
    handOn(ctx, mx(g.x), g.y, g.pose);
    if (g.tool === 'axe') handAxeAt(mx(g.x), g.y, g.ang, M.flip, 0.6);
    ctx.globalAlpha = 1;
  }
  const c = M.cone;
  if (c && (c.state === 'held' || c.state === 'falling')) acorn(Math.round(c.x), Math.round(c.y));
  // the old F3's rope while it is pulled, and the stump out on the hand
  if (M.opt === 'f3' && M.cursor && p && p.stump && M.ph === 'pull') {
    const top = fl() - MT.stump * AP - (p.dug || 0) / AFTER_DIG_CLICKS * AP * 1.5;
    rope(bx(), top, M.cursor.x, M.cursor.y);
  }
  if (M.stumpOut) {
    const s = M.stumpOut;
    if (M.opt === 'f3') rope(s.x + MT.log * AP / 2, s.y, M.cursor.x, M.cursor.y);
    fill(stumpTone(), Math.round(mx(s.x + (M.flip ? MT.log * AP : 0))), Math.round(s.y), MT.log * AP, MT.log * AP);
  }
  const h = M.cursor;
  if (!h) return;
  const hx = mx(h.x);
  if (h.tool === 'axe' && h.phase === 'fly') smear(hx, h.y, h.from, h.ang, M.flip, 6 * AP);
  // tug of war: the fist leaning back harder the more the root strains, in
  // three held steps
  const lean = M.opt === 'f3a2' && M.ph === 'pull' && M.strain > 0 ? -0.14 * Math.ceil(M.strain * 3) : 0;
  if (lean) { ctx.save(); ctx.translate(hx, h.y); ctx.rotate(lean); handOn(ctx, 0, 0, h.pose, P / 2, '#000'); ctx.restore(); }
  else handOn(ctx, hx, h.y, h.pose, P / 2, '#000');
  // the handle over the fist that holds it
  if (h.tool === 'axe') handAxeAt(hx, h.y, h.ang, M.flip);
  if (M.sawAt && M.sawAt.buck) sawAt(hx, h.y, SAW_ANG, M.flip);
}
// A rope from the stump's top to the hand: a line of half cells.
function rope(x0, y0, x1, y1) {
  const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / (P / 2)));
  ctx.fillStyle = GREY[K];
  for (let j = 0; j <= n; j++) { const f = j / n; ctx.fillRect(Math.round(x0 + (x1 - x0) * f - 1), Math.round(y0 + (y1 - y0) * f - 1), 2, 2); }
}
