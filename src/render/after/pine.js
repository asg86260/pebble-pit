// The grove, drawn (DESIGN.md, "Act 3's grove, rebuilt", "The tree, drawn";
// the signed-off mock OAK-2, taken cell for cell). A plot: a bed of soil a
// row deep; the tree on it, the stump and each of the trunk's four logs in
// its own tone of the log's brown, the crown OAK-2 -- a dome of clumps,
// mirror-symmetric, oak-leaf green, its boughs and leader showing through
// the gaps; grown row by row from the ground up, each row from the middle
// out (B1), after the acorn is first seen sinking into the soil; the kerf a
// one-pixel line across the trunk at the stump's top, opening a cell per
// quarter of the strokes; the fall, the trunk and the crown one drawing
// turned by its true angle about the stump's top on the fall side, quicker
// as it goes, rocking back once; then the crown broken into its clumps,
// which scatter and fade (the one fade on a tree), while the trunk's logs,
// units of the ground by then, hop apart (render/after/piles.js). The stump
// stands as one whole log block until its roots are pulled.
//
// Art on the grid, motion smooth: every drawing is whole cells on its own
// sheet, and a thing that moves or turns is laid at its true position.
//
// Over the plots, the anchors the other tracks draw into: the saw and its
// sawdust (render/after/saw.js), the stump pulled (render/after/stump.js) and
// the seed basket (render/after/basket.js).

import { P, GREY, TREE_CHOPS, AFTER_FALL_S, AFTER_FALL_BOUNCE_S, AFTER_FALL_BOUNCE, AFTER_TREE, AFTER_BED, AFTER_SEED_SINK_S,
         AFTER_CROWN_S, AFTER_CROWN_HOLD_S, AFTER_CROWN_GRAV, AFTER_LEAVES, AFTER_LEAVES_DARK, AFTER_BUILD_FADE_S,
         AFTER_PILE_FADE_S, AFTER_BLOCK, AFTER_BLOCK_H } from '../../config.js';
import { plotX, groundOf, treeCells, growOrder, TRUNK_TOP, SAW_ROWS, ICON_DOT, AP } from '../../after/place.js';
import { trees, stumped } from '../../after/grove.js';
import { K, W, PALE, SOIL, toneOf, now, inView, clamp01, hash } from './kit.js';
import { gestureView, groveIcons } from '../../after/gestures.js';
import { goodTone } from './piles.js';
import { ctx } from '../ctx.js';
import { themed, darkPage, raw } from '../../ink.js';
import { drawSaw } from './saw.js';
import { drawStumpPull } from './stump.js';

const { c0: C0, w: TW, stump: SH, logs: LOGS, log: LOG_C } = AFTER_TREE;
const ease = u => u * u * (3 - 2 * u);
const ink = tone => (typeof tone === 'number' ? GREY[tone] : tone);
const fill = (tone, x, y, w, h) => { ctx.fillStyle = ink(tone); ctx.fillRect(x, y, w, h); };
const paper = () => (typeof document === 'undefined' ? null : document.createElement('canvas'));
const fl = () => groundOf('grove');

// --- tones ------------------------------------------------------------------------------
// The log's four (config/palette.js AFTER_GOODS.log, raw on the dark page):
// each of the trunk's logs and the stump in the tone picked when its acorn
// went in (`tones`), the boughs and leader the darkest.
const LOG = i => goodTone('log', i || 0);
const logTone = (p, j) => LOG(p.tones ? p.tones[Math.max(0, Math.min(LOGS - 1, j))] : 0);
const stumpTone = p => LOG(p.tones ? p.tones[LOGS] : 0);
const BOUGH = 3;
// The trunk's log a row of the standing tree is part of (0 the lowest).
const segOf = r => Math.floor((-SH - 1 - r) / LOG_C);
// A crown cell's role (config/palette.js AFTER_LEAVES): with sky under it,
// or the next clump, the underside (3); with sky over it, the lit edge (0);
// the rest the two body tones (1, 2) by a hash mirrored about the trunk's
// middle, so the crown balances. By where it stands in the tree, so it keeps
// its tone standing, falling and in a broken piece.
let ROLES = null; // cache: each crown cell's role, worked out once
function roleOf(c, r) {
  if (!ROLES) {
    ROLES = new Map();
    const crown = treeCells().filter(q => q[2] === 'crown'), clump = new Map(crown.map(([cc, rr, , k]) => [`${cc}|${rr}`, k]));
    for (const [cc, rr, , k] of crown) {
      const below = clump.get(`${cc}|${rr + 1}`), above = clump.get(`${cc}|${rr - 1}`);
      ROLES.set(`${cc}|${rr}`, below == null || below !== k ? 3 : above == null ? 0 : hash(Math.abs(cc + 0.5) * 31.7 + rr * 17.3) < 0.5 ? 1 : 2);
    }
  }
  return ROLES.get(`${c}|${r}`) ?? 1;
}
const leaf = i => (darkPage ? raw(AFTER_LEAVES_DARK[i]) : AFTER_LEAVES[i]);
const crownTone = (c, r) => leaf(roleOf(c, r));
// A cell of the tree in its tone.
const toneAt = (p, [c, r, part]) => (part === 'crown' ? crownTone(c, r) : part === 'bough' ? LOG(BOUGH) : part === 'stump' ? stumpTone(p) : logTone(p, segOf(r)));

// --- sprites ----------------------------------------------------------------------------
// A drawing of cells [x, y, tone] cached on its own sheet, with where its
// cell (0, 0)'s top-left corner sits on the sheet.
const SPRITES = themed(new Map());   // cleared on a theme change
function sprite(id, cells) {
  if (SPRITES.has(id)) return SPRITES.get(id);
  const cv = paper();
  if (!cv || !cells.length) return null;
  const x0 = Math.min(...cells.map(c => c[0])), y0 = Math.min(...cells.map(c => c[1]));
  const x1 = Math.max(...cells.map(c => c[0])), y1 = Math.max(...cells.map(c => c[1]));
  cv.width = (x1 - x0 + 1) * AP; cv.height = (y1 - y0 + 1) * AP;
  const g = cv.getContext('2d');
  if (!g) return null;
  for (const [x, y, tone] of cells) { g.fillStyle = ink(tone); g.fillRect((x - x0) * AP, (y - y0) * AP, AP, AP); }
  const out = { cv, ox: -x0 * AP, oy: -y0 * AP };
  SPRITES.set(id, out);
  return out;
}
// A sprite laid with its origin at (x, y), turned th about it, at alpha a.
function lay(sp, x, y, th = 0, a = 1) {
  if (!sp || a <= 0) return;
  ctx.save();
  ctx.globalAlpha *= a;
  ctx.imageSmoothingEnabled = false;
  ctx.translate(x, y);
  ctx.rotate(th);
  ctx.drawImage(sp.cv, -sp.ox, -sp.oy);
  ctx.restore();
}

// --- the fall --------------------------------------------------------------------------
// The tree falls away from the forestry shack, to the left: it turns about
// the pivot, the trunk's left edge on the stump's top. Cells off the pivot.
const PIV_C = C0, PIV_R = -SH;
const trunkCells = p => {
  const out = [];
  for (let r = TRUNK_TOP; r < -SH; r++) for (let c = C0; c < C0 + TW; c++) out.push([c - PIV_C, r - PIV_R, logTone(p, segOf(r))]);
  return out;
};
const crownCells = () => treeCells().filter(q => q[2] === 'crown' || q[2] === 'bough')
  .map(([c, r, part, k]) => [c - PIV_C, r - PIV_R, part === 'bough' ? LOG(BOUGH) : crownTone(c, r), k, part, c, r]);
// The fall's pose: the angle and the drop growing as the square of the time,
// so it goes over slowly and comes down fast; landed, rocked back once,
// AFTER_FALL_BOUNCE at most, settling over AFTER_FALL_BOUNCE_S. Negative: to the left.
function fallPose(p, t) {
  const sh = SH * AP;
  if (p.fall != null) { const u = clamp01((t - p.fall) / AFTER_FALL_S), k = u * u; return { th: -Math.PI / 2 * k, drop: sh * k }; }
  const v = clamp01((t - p.fell) / AFTER_FALL_BOUNCE_S);
  return { th: -(Math.PI / 2 - AFTER_FALL_BOUNCE * Math.sin(Math.PI * v) * (1 - v)), drop: sh };
}
// Where a point off the pivot (upright, px) is with the tree turned th, let `drop` down.
const turnPt = (bx, x, y, th, drop) => ({ x: bx + PIV_C * AP + x * Math.cos(th) - y * Math.sin(th), y: fl() + PIV_R * AP + drop + x * Math.sin(th) + y * Math.cos(th) });
// The crown broken where it hits: each clump in pieces across, cut either side
// of the trunk and three cells out, each a sprite about a whole cell near its
// middle, with where that middle is off the pivot.
let PIECES = null; // cache: the crown's pieces, worked out once
function crownPieces() {
  if (PIECES) return PIECES;
  const groups = new Map(), cut = [-PIV_C - 3, -PIV_C, -PIV_C + 3];
  for (const q of crownCells()) {
    const band = q[0] < cut[0] ? 0 : q[0] < cut[1] ? 1 : q[0] < cut[2] ? 2 : 3, key = `${q[3]}|${band}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(q);
  }
  PIECES = [];
  let n = 0;
  for (const [key, qs] of groups) {
    const rx = Math.round(qs.reduce((s, q) => s + q[0] + 0.5, 0) / qs.length), ry = Math.round(qs.reduce((s, q) => s + q[1] + 0.5, 0) / qs.length);
    PIECES.push({ key, cx: rx * AP, cy: ry * AP, cells: qs.map(q => [q[0] - rx, q[1] - ry, q[4], q[5], q[6]]), seed: ++n * 7.31 });
  }
  return PIECES;
}
// The clumps flung off the landing, flying, tumbling and fading: held whole
// AFTER_CROWN_HOLD_S, then faded to nothing by AFTER_CROWN_S. A pure function
// of the landing time and each piece's hash, so a reload mid-break carries on.
function crownBreak(p, bx, t) {
  const since = t - p.fell;
  if (since < 0 || since > AFTER_CROWN_S) return;
  const th = -Math.PI / 2, drop = SH * AP, a = since < AFTER_CROWN_HOLD_S ? 1 : 1 - (since - AFTER_CROWN_HOLD_S) / (AFTER_CROWN_S - AFTER_CROWN_HOLD_S);
  for (const pc of crownPieces()) {
    const h1 = hash(pc.seed), h2 = hash(pc.seed + 3.3), h3 = hash(pc.seed + 9.1);
    const at = turnPt(bx, pc.cx, pc.cy, th, drop);
    const vx = -(20 + (h1 - 0.5) * 150), vy = -(60 + h2 * 110), w = (h3 - 0.5) * 6, half = AP * 1.5;
    const x = at.x + vx * (1 - Math.exp(-2.2 * since)) / 2.2;
    const y = Math.min(fl() - half, at.y + vy * since + AFTER_CROWN_GRAV * since * since / 2);
    const sp = sprite(`piece|${pc.key}|${darkPage}`, pc.cells.map(([x0, y0, part, c, r]) => [x0, y0, part === 'bough' ? LOG(BOUGH) : crownTone(c, r)]));
    lay(sp, x, y, th - w * since, a);
  }
}

// --- the acorn ---------------------------------------------------------------------------
// Three cells across and four tall off its top left (config/blocks.js): a
// stalk and a cap in the log's darkest tone over a nut in its warmest.
const ACORN = () => [[1, 0, LOG(3)], [0, 1, LOG(3)], [1, 1, LOG(3)], [2, 1, LOG(3)], [0, 2, LOG(0)], [1, 2, LOG(0)], [2, 2, LOG(0)], [1, 3, LOG(0)]];
export function drawAcorn(x, y) { for (const [c, r, tone] of ACORN()) fill(tone, Math.round(x + c * AP), Math.round(y + r * AP), AP, AP); }
// The acorn just planted, moved down into the soil over AFTER_SEED_SINK_S and
// clipped at the soil's top: sunk, not faded.
function sinking(p, bx, t) {
  const k = clamp01((t - p.seed) / AFTER_SEED_SINK_S);
  if (k >= 1) return;
  const w = AFTER_BLOCK.acorn * AP, h = AFTER_BLOCK_H.acorn * AP, top = fl() - AP, sx = bx - w / 2;
  ctx.save();
  ctx.beginPath(); ctx.rect(sx - AP, top - h * 2, w + AP * 2, h * 2); ctx.clip();
  drawAcorn(sx, top - h + h * ease(k));
  ctx.restore();
}

// --- the plot ----------------------------------------------------------------------------
const cellAt = (bx, c, r, tone) => fill(tone, bx + c * AP, fl() + r * AP, AP, AP);
// The bed of soil under the plot, in the soil's tones a cell
// (render/after/ground.js keeps the cloud's lip off it).
const soil = bx => { for (let c = AFTER_BED[0]; c <= AFTER_BED[1]; c++) cellAt(bx, c, -1, toneOf(SOIL, bx / AP + c, 0)); };
// The kerf: a one-pixel line in at the stump's top from the side the saw
// works from (the shack's, away from the fall), a cell a quarter of the strokes.
function kerf(p, bx) {
  const n = Math.ceil(Math.min(1, p.chops / TREE_CHOPS) * TW);
  if (n > 0) fill(K, bx + (C0 + TW - n) * AP, fl() - SH * AP - 1, n * AP, 1);
}
// The stump: one whole log block, lifted a little by each root snapped (the
// pull itself is track C's, `drawStumpPull`).
const stumpBlock = (p, bx, up = 0) => fill(stumpTone(p), bx + C0 * AP, fl() - SH * AP - up, TW * AP, SH * AP);

// The handsaw across a grown trunk where the hand has put it: the hand's
// placeholder until track B's saw lies across the trunk, its kerf showing
// the blade. A grip of ink round a paper hole, a pale blade with its back
// and teeth in ink, off the saw's offset `o` cells.
function placeholderSaw(bx, o, cutting) {
  const [r0, r1] = SAW_ROWS, t0 = C0, inTrunk = c => c >= t0 && c < t0 + TW;
  for (let r = r0; r <= r1; r++) for (let u = -15; u <= -12; u++) cellAt(bx, u + o, r, (u === -14 || u === -13) && r > r0 && r < r1 ? W : K);
  for (let u = -11; u <= 9; u++) {
    if (inTrunk(u + o) && !cutting) continue;
    cellAt(bx, u + o, r0, K);
    for (let r = r0 + 1; r <= r1; r++) cellAt(bx, u + o, r, u & 1 && r === r1 ? K : PALE);
  }
}

// --- the grove's icons -------------------------------------------------------------------
// The hand's placeholder until tracks B and C retire them: the saw over a
// grown tree and the shovel over a stump, each a pointer's mark drawn in its
// own dots, faded in and out. Drawn with the cues (render/aftercues.js).
const ICONS = {
  saw: ['.###.........', '#...#########', '#.#.#.......#', '#...#......#.', '.####.....#..', '....#.#.#.#..', '.....#.#.#...', '.............'],
  shovel: ['.###.', '.#.#.', '..#..', '..#..', '..#..', '..#..', '..#..', '.###.', '#...#', '#...#', '#...#', '.#.#.', '..#..']
};
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
    const was = ctx.globalAlpha;
    ctx.globalAlpha = was * a;
    ctx.fillStyle = GREY[K];
    ICONS[c.kind].forEach((row, j) => [...row].forEach((ch, k) => { if (ch === '#') ctx.fillRect(c.box.x + k * ICON_DOT, c.box.y + j * ICON_DOT, ICON_DOT, ICON_DOT); }));
    ctx.globalAlpha = was;
  }
  for (const [id, st] of iconSeen) if (!shown.has(id) && st.gone == null) st.gone = t;
}

// A plot cleared while the page watches fades its bed in; one there when the
// page first saw the act is simply there. Drawing state only.
const bedSeen = []; // page: when each plot's bed was first seen, -Infinity for one there from the start
let bedsFor = null; // page: the act state the beds were seen for
function bedAlpha(i, t) {
  const plots = trees();
  if (bedsFor !== plots) { bedsFor = plots; bedSeen.length = 0; for (let k = 0; k < plots.length; k++) bedSeen[k] = -Infinity; }
  if (bedSeen[i] === undefined || t < bedSeen[i]) bedSeen[i] = t;
  return clamp01((t - bedSeen[i]) / AFTER_BUILD_FADE_S);
}

export function drawGrove() {
  const t = now();
  const view = gestureView() || [], hand = view.find(r => r.key === 'tree');
  trees().forEach((p, i) => {
    const bx = plotX(i);
    if (!inView(bx - AP * 40, AP * 60)) return;
    const was = ctx.globalAlpha;
    ctx.globalAlpha = was * bedAlpha(i, t);
    soil(bx);
    ctx.globalAlpha = was;
    if (p.fall != null || p.fell != null) {
      // Going over, or down and rocking back: the trunk and the crown one
      // drawing about the pivot; from the landing the crown breaks, and once
      // rocked back the trunk is its logs, lying on the ground.
      stumpBlock(p, bx);
      const { th, drop } = fallPose(p, t), o = turnPt(bx, 0, 0, th, drop);
      if (p.fall != null || t - p.fell < AFTER_FALL_BOUNCE_S) lay(sprite(`trunk|${p.tones}|${darkPage}`, trunkCells(p)), o.x, o.y, th);
      if (p.fall != null) lay(sprite(`crown|${darkPage}`, crownCells()), o.x, o.y, th);
      else crownBreak(p, bx, t);
    } else if (stumped(p)) stumpBlock(p, bx, Math.round((p.dug || 0) * AP / 2));
    else if (p.grow != null) {
      if (p.seed != null) sinking(p, bx, t);
      if (p.grow >= 1) {
        for (const q of treeCells()) cellAt(bx, q[0], q[1], toneAt(p, q));
        kerf(p, bx);
        if (hand && hand.i === i) placeholderSaw(bx, Math.round(hand.s / AP), p.chops > 0);
      } else {
        const all = growOrder(), n = Math.floor(p.grow * all.length);
        for (let k = 0; k < n; k++) cellAt(bx, all[k][0], all[k][1], toneAt(p, all[k]));
      }
    }
  });
  drawSaw();
  drawStumpPull();
}
