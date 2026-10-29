// MOCK grove: the grove redesign's drawing (after/grovemock.js is its
// director), never merged. While `globalThis.__groveMock` is set, plot 0 is
// drawn from here instead of render/after/pine.js: the mock pine (a trunk a
// log wide, its length its logs end to end, the crown in tiers on it),
// standing, growing cell by cell, going over by its true angle (today's tip,
// the fall's numbers), its crown breaking where it hits into pieces that
// fly, tumble and fade (the one fade the owner allowed); the trunk lying in
// the log's own look, the cut opening at its far end and the end log
// tumbling off it; the stump the top half of a log's block, its root half
// under the ground until it is pulled. Over the members, the woodcutter's
// tools in its hands and the cone on a planter's head; over everything, the
// ghost hand and the hand.
//
// Art on the grid, motion smooth: every drawing is whole cells on its own
// grid, and a thing that moves or turns is laid at its true position.

import { GREY, P, AFTER_FALL_S, AFTER_FALL_BOUNCE_S, AFTER_FALL_BOUNCE, GESTURE_CUE_ALPHA, TREE_CHOPS, AFTER_DIG_CLICKS } from '../../config.js';
import { ctx } from '../ctx.js';
import { K, W, PALE, MID, SOIL, DUST, toneOf, now, clamp01, hash } from './kit.js';
import { goodBlock } from './piles.js';
import { handOn } from '../aftercues.js';
import { drawBody, drawSquat } from '../crew.js';
import { trees } from '../../after/grove.js';
import { gestureView } from '../../after/gestures.js';
import { AP } from '../../after/place.js';
import { M, MT, TRUNK_TOP, treeCells, grownShape, rowOrder, bx, fl, pivotX, cutX, trunkTop, GRIP, SWING, ROLL_S, handSaw, SAW_ANG, SAW_TIP, groveMockOn } from '../../after/grovemock.js';

export { groveMockOn };
const BODY = 3 * P;
const fill = (tone, x, y, w, h) => { ctx.fillStyle = GREY[tone]; ctx.fillRect(x, y, w, h); };
const paper = () => (typeof document === 'undefined' ? null : document.createElement('canvas'));
const ease = u => u * u * (3 - 2 * u);

// --- sprites -------------------------------------------------------------------------------
// A drawing of cells [x, y, tone] (cell coordinates off its origin, which is
// the corner at cell (0, 0)'s top left) cached on its own sheet, with where
// its origin sits on the sheet.
const SPRITES = new Map();
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
    g.fillStyle = GREY[tone];
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

// --- the pine's pieces --------------------------------------------------------------------
// In cells off the pivot the fall turns about (the trunk's right edge on the
// stump's top): the trunk past the stump, a log's flat tone with its seam
// down its right edge as a log block has (it lies as the log blocks it
// makes), and the crown in ink.
const PIV_C = MT.c0 + MT.w, PIV_R = -MT.stump;
const trunkCells = () => {
  const out = [];
  for (let r = TRUNK_TOP; r < -MT.stump; r++) for (let c = MT.c0; c < MT.c0 + MT.w; c++) {
    const x = c - PIV_C, y = r - PIV_R;
    out.push([x, y, MID]);
    if (c === MT.c0 + MT.w - 1) out.push([x, y, K, AP - 1, 0, 1, AP]);
  }
  return out;
};
const crownCells = () => treeCells().filter(q => q[2] === 'crown').map(([c, r, , ti]) => [c - PIV_C, r - PIV_R, K, ti]);
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
    PIECES.push({ key, cx: rx * AP, cy: ry * AP, cells: qs.map(q => [q[0] - rx, q[1] - ry, K]), seed: ++n * 7.31 });
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
    lay(sprite(`pc|${pc.key}`, pc.cells), x, y, th + w * since, false, a);
  }
}

// --- the standing, growing and lying pine -------------------------------------------------
const cellAt = (c, r, tone) => fill(tone, bx() + c * AP, fl() + r * AP, AP, AP);
function soil() { for (let c = -6; c <= 5; c++) cellAt(c, -1, toneOf(SOIL, bx() / AP + c, 0)); }
// The standing pine, or the cells of it grown so far: the trunk (and its
// stump) a log's tone, its seam down the right, and the crown in ink.
function pineCells(cells) {
  for (const [c, r, part] of cells) {
    cellAt(c, r, part === 'crown' ? K : MID);
    if (part !== 'crown' && c === MT.c0 + MT.w - 1) fill(K, bx() + (c + 1) * AP - 1, fl() + r * AP, 1, AP);
  }
}
// The felling cut along the stump's top, `n` cells in from the left: a seam
// opening, as the cut a log block is split along.
function fellCut(n) { if (n > 0) fill(K, bx() + MT.c0 * AP, fl() - MT.stump * AP - 1, Math.round(n * AP), 1); }
// The stump: the top half of a log's block standing out of the ground, its
// root half under it; `up` px pulled out, clipped at the ground line.
function stump(up = 0) {
  const x = bx() + MT.c0 * AP, y = fl() - MT.stump * AP - up;
  ctx.save();
  ctx.beginPath(); ctx.rect(x - AP, y - AP, MT.w * AP + 2 * AP, fl() - y + AP); ctx.clip();
  goodBlock(x, y, 'log');
  ctx.restore();
}
// The trunk lying from the pivot along the floor, `n` logs of it, one log
// block long apiece but seamless till cut: its seam along the bottom and the
// far end, and the cut at the far log opening down from the top.
function lyingTrunk(n, cut) {
  if (n <= 0) return;
  const x = pivotX(), y = trunkTop(), w = n * MT.log * AP, h = MT.w * AP;
  fill(K, x, y, w, h); fill(MID, x, y, w - 1, h - 1);
  if (cut > 0 && n > 1) fill(K, cutX(n) - 1, y, 1, Math.round(Math.min(1, cut) * h));
}
// A log cut free, tumbling off the end: a quarter turn over its far bottom
// corner, slow then quick, its seam drawn turned back so it lands as the
// block lies (seam right and bottom).
function rolling(t) {
  if (!M.roll) return;
  const k = clamp01((t - M.roll.at) / ROLL_S), th = Math.PI / 2 * k * k, z = MT.log * AP;
  const rx = M.roll.x + z, ry = fl();
  ctx.save();
  ctx.translate(rx, ry); ctx.rotate(th);
  fill(K, -z, -z, z, z); fill(MID, -z, -z + 1, z - 1, z - 1);
  ctx.restore();
}
// The cone: two by two, a scale of ink across it.
function cone(x, y) { fill(MID, x, y, AP * 2, AP * 2); fill(K, x + AP, y, AP, AP); fill(K, x, y + AP, AP, AP); }
const CONE_SINK_S = 0.9;
function coneInGround(t) {
  const c = M.cone;
  if (!c) return;
  const sx = bx() - AP, rest = fl() - 3 * AP;
  if (c.state === 'lying') { cone(Math.round(c.x), Math.round(c.y)); return; }
  if (c.state === 'set') {
    const k = ease(clamp01((t - c.at) / 0.5));
    cone(Math.round(c.from.x + (sx - c.from.x) * k), Math.round(c.from.y + (rest - c.from.y) * k - Math.sin(Math.PI * k) * AP * 2));
    return;
  }
  if (c.state === 'in') {
    const k = clamp01((t - c.at) / CONE_SINK_S);
    if (k >= 1) return;
    ctx.save();
    ctx.beginPath(); ctx.rect(sx - AP, rest - AP * 4, AP * 4, AP * 4 + 2 * AP); ctx.clip();
    cone(sx, Math.round(rest + 2 * AP * k));
    ctx.restore();
  }
}
// The saw across the standing trunk (F1, before it goes over), `s` px along
// where the hand has it: a grip at the near end and the blade along the
// trunk's foot at the felling cut, its teeth under it; the blade hidden in
// the wood where it has not cut, showing in the cut.
function standingSaw(s, kerf) {
  const t0 = MT.c0, row = -MT.stump - 1, inTrunk = c => c >= t0 && c < t0 + MT.w;
  ctx.save();
  ctx.translate(s, 0);
  for (let r = -6; r <= -3; r++) for (let c = -15; c <= -13; c++) {
    const hole = c === -14 && (r === -5 || r === -4);
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

export function drawGroveMock() {
  const t = now(), p = trees()[0];
  if (!p) return;
  soil();
  coneInGround(t);
  // the stump, standing or coming up on the hand's pull
  const pulling = M.opt === 'f3' && p.stump;
  const falling = p.fall != null || (p.fell != null && t - p.fell < AFTER_FALL_BOUNCE_S);
  if (p.stump || falling) stump(pulling ? (p.dug || 0) / AFTER_DIG_CLICKS * AP * 1.5 : 0);
  if (falling) {
    // over whole, the trunk and the crown one drawing turned about the cut;
    // the crown broken off the moment it hits
    const { th, drop } = fallPose(p, t), o = turnPt(0, 0, th, drop);
    lay(sprite('trunk', trunkCells()), o.x, o.y, th);
    if (p.fall != null) lay(sprite('crown', crownCells()), o.x, o.y, th);
  } else if (M.logs > 0) lyingTrunk(M.logs, M.cut);
  if (M.landed != null) drawCrownBreak(t);
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
}

// --- the tools --------------------------------------------------------------------------
// The axe: a handle of three cells and a head of two by three, off the hand
// at the handle's near end (after/grovemock.js, AXE_BIT, AXE_FRONT); the
// edge down when the handle is level.
const AXE = () => sprite('axe', [[0, 0, MID], [1, 0, MID], [2, 0, MID], [3, -1, K], [4, -1, K], [3, 0, K], [4, 0, K], [3, 1, K], [4, 1, K]].map(([x, y, tone]) => [x, y, tone]));
// laid so the hand is the middle of the handle's first cell
const axeAt = (x, y, ang, flip, a = 1) => { const sp = AXE(); if (sp) lay({ ...sp, ox: sp.ox + AP / 2, oy: sp.oy + AP / 2 }, x, y, ang, flip, a); };
// The hand's axe: the same with a handle two cells longer, so it shows past
// the fist that holds its end (after/grovemock.js, HAND_AXE_FRONT).
const HAND_AXE = () => sprite('handaxe', [0, 1, 2, 3, 4].map(x => [x, 0, MID]).concat([[5, -1, K], [6, -1, K], [5, 0, K], [6, 0, K], [5, 1, K], [6, 1, K]]));
const handAxeAt = (x, y, ang, a = 1) => { const sp = HAND_AXE(); if (sp) lay({ ...sp, ox: sp.ox + AP / 2, oy: sp.oy + AP / 2 }, x, y, ang, false, a); };
// The saw: a grip of two by two and a blade of three, its teeth along one
// side; held upright its tip is SAW_TIP under the grip.
const SAW = () => sprite('saw', [[-1, -1, K], [0, -1, K], [-1, 0, K], [0, 0, K],
  [1, 0, PALE], [2, 0, PALE], [3, 0, PALE], [1, 1, K], [3, 1, K], [1, 0, K, 0, 0, AP * 3, 1]]);
// laid with the hand on the grip's middle
const sawAt = (x, y, ang, flip) => lay(SAW(), x, y, ang, flip);
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
function body(b, t) {
  const x = Math.round(b.x), y = b.y - BODY, flip = b.face < 0;
  if (b.squat) drawSquat(x, Math.round(y)); else drawBody(x, Math.round(y));
  if (b.carry === 'cone') cone(x + BODY / 2 - AP, Math.round(y) - AP * 2 - (b.squat ? -P : 0));
  if (!b.tool) return;
  const gx = flip ? b.x + BODY - GRIP.dx : b.x + GRIP.dx, gy = b.y + GRIP.dy;
  if (b.tool === 'axe') {
    if (b.pose === 'fly') smear(gx, gy, b.from, b.ang, flip);
    axeAt(gx, gy, b.ang, flip);
    if (b.pose === 'hit') {
      const ex = gx + (flip ? -1 : 1) * (Math.cos(b.ang) * 3.5 * AP - Math.sin(b.ang) * 1.5 * AP), ey = gy + Math.sin(b.ang) * 3.5 * AP + Math.cos(b.ang) * 1.5 * AP;
      puff(ex, ey, t - (b.hitAt ?? t));
    }
  } else if (b.tool === 'saw') {
    // upright in the cut at the body's side, its tip as deep as the cut
    const s = b.s || 0, cutting = M.ph === 'cut' ? M.cut * MT.w * AP : 0;
    sawAt(b.x + BODY + 1 + AP / 2, b.y - SAW_TIP + cutting + s, SAW_ANG, false);
  }
}
export function drawGroveMockBodies() {
  const t = now();
  for (const b of M.bodies) body(b, t);
}

// --- the hands --------------------------------------------------------------------------
// The ghost hand teaching (the cues' own, faint) and the hand itself, drawn
// over everything as the saw mill's hand scene draws it; what each holds
// under it: the axe, the saw, the cone, the stump on its rope.
export function drawGroveMockCues() {
  const t = now(), p = trees()[0];
  const g = M.ghost;
  if (g) {
    ctx.globalAlpha = GESTURE_CUE_ALPHA;
    handOn(ctx, g.x, g.y, g.pose);
    if (g.tool === 'axe') handAxeAt(g.x, g.y, g.ang, 0.6);
    ctx.globalAlpha = 1;
  }
  const c = M.cone;
  if (c && (c.state === 'held' || c.state === 'falling')) cone(Math.round(c.x), Math.round(c.y));
  // the stump's rope while it is pulled, and the stump out on the hand
  if (M.opt === 'f3' && M.cursor && (p && p.stump && M.ph === 'pull')) {
    const top = fl() - MT.stump * AP - (p.dug || 0) / AFTER_DIG_CLICKS * AP * 1.5;
    rope(bx(), top, M.cursor.x, M.cursor.y);
  }
  if (M.stumpOut) {
    const s = M.stumpOut;
    rope(s.x + MT.log * AP / 2, s.y, M.cursor.x, M.cursor.y);
    goodBlock(Math.round(s.x), Math.round(s.y), 'log');
  }
  const h = M.cursor;
  if (!h) return;
  if (h.tool === 'axe' && h.phase === 'fly') smear(h.x, h.y, h.from, h.ang, false, 6 * AP);
  handOn(ctx, h.x, h.y, h.pose, P / 2, '#000');
  // the handle over the fist that holds it
  if (h.tool === 'axe') handAxeAt(h.x, h.y, h.ang);
  if (M.sawAt && M.sawAt.buck) sawAt(h.x, h.y, SAW_ANG, false);
}
// A rope from the stump's top to the hand: a line of half cells.
function rope(x0, y0, x1, y1) {
  const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / (P / 2)));
  ctx.fillStyle = GREY[K];
  for (let j = 0; j <= n; j++) { const f = j / n; ctx.fillRect(Math.round(x0 + (x1 - x0) * f - 1), Math.round(y0 + (y1 - y0) * f - 1), 2, 2); }
}
