// The camp's piles, yard style (docs/mocks/act3-stations-2026-10-18): the
// things themselves, stacked; the counted piles, the workshop's sign rack
// among them, as plots of blocks, each brought and taken by a body or the
// hand and never faded. The sawdust heap takes a frame (kit.js) and the
// pile's state (`pileState`: what it shows, what it showed, since when).
// Cells off the frame's ground.

import { P, GREY, AFTER_COUNT_LIFT, AFTER_BLOCK, AFTER_PILES } from '../../config.js';
import { ctx } from '../ctx.js';
import { AFTER_LOG_ROLL_S } from '../../config.js';
import { units, colX, rowY, tagOf, glideAt } from '../../after/ground.js'; // MOCK after-heaps -- glideAt
import { AP } from '../../after/place.js';
import { SPLIT_S } from './pine.js';
import { K, W, PALE, MID, DUST, hash, pileAlpha, pileState, countAt, pendingCounts, clamp01, inView } from './kit.js';
import { shown } from '../../tween.js';
import { themed } from '../../ink.js'; // MOCK after-goods

// A pile's count, standing on the pile: its plate's foot AFTER_COUNT_LIFT
// over the pile's top `top` (world px), across from `x`. Through the shared
// counts tween (tween.js, `shown`) by the pile's name, so a count taken from
// or added to runs a good at a time rather than jumping. An empty pile has no
// count, as an empty kit stand in the yard has none (roster.js, `kitStands`):
// the count fades on with the pile's first good and off with its last, never
// a zero standing over bare floor.
export function countOver(x, top, n, key) {
  const a = pileAlpha(0, pileState(`count:${key}`, Math.round(n) > 0 ? 1 : 0));
  if (a <= 0) return;
  countAt(x, top - AFTER_COUNT_LIFT, shown(`after-pile:${key}`, n));
  const c = pendingCounts()[pendingCounts().length - 1];
  c.a = a; c.foot = true;
}
// The same off a frame: across from cell cx, over the pile's top at row `top`.
function count(d, n, cx, top, key) { const at = d.world(cx, top); countOver(at.x, at.y, n, key); }

// --- the counted piles as blocks (DESIGN.md, "Act 3's goods are blocks, and
// bodies carry every one"; the voted mock, mock-log-split round 28) ---------
// A good's block: one flat tone, the darkest good's the log's and timber
// pale, a pixel short of its square on its right and bottom so its seam tone
// shows there. Laid on a pile, the pile's shape is that seam tone filled
// solid behind its blocks, so the pixel between two is a seam, not a hole.
// The block's size is the good's (config/afterpiles.js); x, y its top left
// in world px, free (a carried or falling block is laid where it truly is).
// A sign is the camp's black board, as it is planted, its seam the paper
// between two in the rack.
export const BLOCK_TONES = { log: { tone: MID, seam: K }, plank: { tone: PALE, seam: MID }, sign: { tone: K, seam: W }, load: { tone: MID, seam: K } };
export function goodBlock(x, y, kind, seed = 1, base = null) {
  if (goodsLook() && HUES[kind]) { mockBlock(x, y, kind, seed, base); return; } // MOCK after-goods
  const t = BLOCK_TONES[kind], z = AFTER_BLOCK[kind] * AP;
  ctx.fillStyle = GREY[t.seam]; ctx.fillRect(x, y, z, z);
  ctx.fillStyle = GREY[t.tone]; ctx.fillRect(x, y, z - 1, z - 1);
}
// Every good on the act's ground (after/ground.js), piles and open floor
// alike, each block where the heap rule has it: one drawing for all of them,
// so a pile is only where its blocks stand. No count: the pile is the count.
// A unit still arriving is drawn along its way there, whole, at its true
// position: a felled log faded in over the trunk and sliding off to rest,
// slowing, over AFTER_LOG_ROLL_S; a good let go of falling under the yard's
// gravity from where it was let go (ground.js, `fallTag`).
export function drawGround(t) {
  const us = units(), bases = goodsLook() ? mockBases(us) : null; // MOCK after-goods
  for (const u of us) {
    const z = u.z * AP;
    let x = colX(u.c0), y = rowY(u.r0 + u.z), a = 1;
    const tg = tagOf(u.ai);
    if (tg && tg.fall != null) {
      const k = tg.fall > 0 ? clamp01((t - tg.at) / tg.fall) : 1, bot = rowY(u.r0);
      y = (tg.y0 ?? bot) + (bot - (tg.y0 ?? bot)) * k * k - z;
    } else if (tg && tg.x0 != null && tg.at != null) {
      const since = t - tg.at;
      if (since < -SPLIT_S) continue;
      const r = clamp01(since / AFTER_LOG_ROLL_S), e = 1 - (1 - r) * (1 - r);
      x = tg.x0 + (x - tg.x0) * e;
      a = clamp01((since + SPLIT_S) / SPLIT_S);
    }
    const gl = glideAt(tg, t); if (gl) { x += gl.x; y += gl.y; } // MOCK after-heaps
    if (!inView(x - z, z * 3)) continue;
    if (gl && gl.rot) { ctx.save(); ctx.translate(Math.round(x) + z / 2, Math.round(y) + z / 2); ctx.rotate(gl.rot); ctx.translate(-Math.round(x) - z / 2, -Math.round(y) - z / 2); } // MOCK after-heaps
    const was = ctx.globalAlpha;
    ctx.globalAlpha = was * a;
    goodBlock(Math.round(x), Math.round(y), u.kind, STORED() ? u.v : seedOf(u.ai), bases && bases.get(u.ai)); // MOCK after-goods -- seed, base
    ctx.globalAlpha = was;
    if (gl && gl.rot) ctx.restore(); // MOCK after-heaps
  }
}

// --- MOCK after-goods: what the goods look like (mock-goods-look3, never merged)
// Round 2 (the owner: "lets add some variety to each resource instead of a
// border. similar to act 1"): no seam, each block mottled cell by cell as
// act 1's dust is. Act 1's mechanism, reused: a grain carries its shade in
// its cell (grid.js; picked by `shadeNear` as it is made) and keeps it
// through every slump, sweep, throw and landing; a block carries its shade
// (1..6) the same way (after/piles.js `setBlock`, the hand's motes and chips
// `s`), and its cells pick their tones off it with act 3's per-cell hash
// (kit.js `hash`, as the sawdust heap and the soil pick theirs).
// Round 3 (the owner: "lets go even more subtle, right now its hard to tell
// how many are in the pile ... i want to be able to distinguish the
// individual resources"): quieter cells, and each block told from the next
// by itself, never by a seam drawn between two -- its base tone differing
// from every block it touches (d), a one-cell band of its own cells along its
// top and left a step lighter (e), or both, quieter still (f).
// `globalThis.__goodsLook` picks the option; unset, the real drawing above.
import { kindOf, toneOf } from '../../grid.js'; // MOCK after-goods
export const goodsLook = () => globalThis.__goodsLook || null; // MOCK after-goods
export const STORED = () => goodsLook() === 'c' || goodsLook() === 'd'; // MOCK after-goods  the options whose shade is the unit's stored tone
// Each good's ladder, rungs of GREY light to dark; its base tones are all // MOCK after-goods
// but the lightest, which only the lit band (e, f) and a cell off reach. The // MOCK after-goods
// act's four are 0 paper, 3 pale, 6 mid, 10 ink; added, each with one role: // MOCK after-goods
// 2 timber's lit band, 4 timber's second base, 5 timber's third base and the // MOCK after-goods
// log's lit band, 7 the log's second base, 8 the log's third base and the // MOCK after-goods
// sign's lit band, 9 the sign's board. // MOCK after-goods
const LADDER_OF = { log: [5, 6, 7, 8], plank: [2, 3, 4, 5], sign: [8, 9, 10] }; // MOCK after-goods
const BASES = kind => LADDER_OF[kind].length - 1; // MOCK after-goods  how many base tones (rungs 1..)
// How each option paints a block: `off` the share of cells a step off the // MOCK after-goods
// base (half lighter, half darker), `band` the lit top and left, `apart` // MOCK after-goods
// whether a pile's blocks take base tones differing from their neighbors'. // MOCK after-goods
// Round 4 (the owner: "lets go away from using gray tones and textures, and // MOCK after-goods
// more different shades, like act 1"): `flat` paints each block one flat // MOCK after-goods
// square in one shade of its good's family and nothing inside it, as act 1 // MOCK after-goods
// paints a grain (render/marks.js, `drawMark`): `hue` the goods' own color // MOCK after-goods
// families (HUES), `page` act 3's greys (PAGE). // MOCK after-goods
const LOOK = { // MOCK after-goods
  a: { off: 0.24, band: false, apart: false }, // MOCK after-goods-a  round 2's A, as it was
  b1: { flat: 'hue', apart: true }, // MOCK after-goods-b1
  b2: { flat: 'hue', apart: false }, // MOCK after-goods-b2  each block its stored shade alone, as a grain's
  b3: { flat: 'page', apart: true }, // MOCK after-goods-b3
  d: { flat: 'hue', rand: true, fine: true }, // MOCK after-goods-d  ten close shades a family, one picked near the middle at birth
  c: { flat: 'hue', rand: true } // MOCK after-goods-c  six shades a family, one drawn at random when the unit is made, kept in its tone (grid.js `cellOf`)
}; // MOCK after-goods
// Each good's family, four shades light to dark, as each of act 1's coins is // MOCK after-goods
// a run of four (COIN_TONES): its own hue, flat and strong, apart from // MOCK after-goods
// act 1's (ore blue, crop green, spark red, the earned gold, the deep's // MOCK after-goods
// purple). New tones, a role each (listed in the report): // MOCK after-goods
const HUES = { // MOCK after-goods
  log:   ['#9c6a3c', '#8a5c33', '#764e2b', '#634123'], // MOCK after-goods  the log: a warm bark brown
  plank: ['#e6c896', '#d9b782', '#cca770', '#be975e'], // MOCK after-goods  timber: sawn pale wood
  sign:  ['#57606b', '#4a525c', '#3e454e', '#323840'] // MOCK after-goods  the sign: a painted slate board
}; // MOCK after-goods
// sawdust: the timber's wood a step paler, a grain each (stations.js `heapOn`) // MOCK after-goods
export const SAWDUST_HUES = ['#f0dcb6', '#e6cc9e', '#dcbd88']; // MOCK after-goods
// within act 3's black and white: rungs of GREY, flat per block // MOCK after-goods
const PAGE = { log: [5, 6, 7, 8], plank: [2, 3, 4, 5], sign: [8, 9, 10] }; // MOCK after-goods
export const HUES6 = { // MOCK after-goods  option C: B1's range widened half a step each end, six even steps
  log:   ['#a67140', '#96663a', '#875b33', '#78502c', '#694526', '#5a3a1f'],
  plank: ['#edd09f', '#e2c390', '#d7b681', '#cda973', '#c29c64', '#b78f55'],
  sign:  ['#5d6772', '#535c67', '#49515b', '#404750', '#363c44', '#2c3139']
};
export const SAWDUST_C = ['#f5e4c2', '#efdab4', '#e9d1a6', '#e3c898', '#ddbf8a', '#d7b57d'];
// a unit's shade (0..5): its stored tone when its value is one (a block's, a body's load, a thrown chip), else a seed's
export const toneIdx = (kind, seed) => (kindOf(seed) && kindOf(seed).key === kind ? toneOf(seed) : shadeOfSeed(seed) - 1);
export const HUES10 = { // MOCK after-goods  option D: ten shades a step of four apart around each family's middle
  log:   ['#926842', '#8e643e', '#8a603a', '#865c36', '#825832', '#7e542e', '#7a502a', '#764c26', '#724822', '#6e441e'],
  plank: ['#e4c28c', '#e0be88', '#dcba84', '#d8b680', '#d4b27c', '#d0ae78', '#ccaa74', '#c8a670', '#c4a26c', '#c09e68'],
  sign:  ['#575e68', '#535a64', '#4f5660', '#4b525c', '#474e58', '#434a54', '#3f4650', '#3b424c', '#373e48', '#333a44']
};
export const SAWDUST_D = ['#f8dfb1', '#f4dbad', '#f0d7a9', '#ecd3a5', '#e8cfa1', '#e4cb9d', '#e0c799', '#dcc395', '#d8bf91', '#d4bb8d']; // MOCK after-goods
export const famOf = kind => (goodsLook() === 'd' ? HUES10 : HUES6)[kind]; // MOCK after-goods
const familyOf = (L, kind) => (L.fine ? HUES10[kind] : L.rand ? HUES6[kind] : L.flat === 'hue' ? HUES[kind] : PAGE[kind].map(i => GREY[i])); // MOCK after-goods
const KIND_SEED = { log: 11.3, plank: 23.9, sign: 37.1 }; // MOCK after-goods
// a block's base rung (1..BASES) off its own shade, when nothing asks // MOCK after-goods
// otherwise: carried, thrown, laid, or an option that does not keep apart // MOCK after-goods
const ownBase = (kind, s) => 1 + Math.round((s - 1) / 5 * (BASES(kind) - 1)); // MOCK after-goods
const shadeOfSeed = seed => Math.max(1, Math.min(6, Math.round(seed) || 1)); // MOCK after-goods
let into = null; // cache: (MOCK after-goods) the block's own sheet while it is painted
const cell = (x, y, i, j, g) => { into.fillStyle = GREY[g]; into.fillRect(x + i * AP, y + j * AP, AP, AP); }; // MOCK after-goods
// A block is painted once on its own sheet, a pixel a world px, and laid at // MOCK after-goods
// its true position whole (CLAUDE.md, "Art on the grid, motion smooth"): // MOCK after-goods
// cells laid one by one at a carried block's fractional x leave a hairline // MOCK after-goods
// between each. Dropped when the page turns (ink.js, `themed`). // MOCK after-goods
const SHEETS = themed(new Map()); // MOCK after-goods
function mockBlock(x, y, kind, seed, base = null) { // MOCK after-goods
  const F = LOOK[goodsLook()]; // MOCK after-goods
  if (F && F.flat) { // MOCK after-goods
    // one flat square in one shade of the family, a grain's way // MOCK after-goods
    const fam = familyOf(F, kind), z = AFTER_BLOCK[kind] * AP; // MOCK after-goods
    ctx.fillStyle = F.rand ? fam[toneIdx(kind, seed) % fam.length] : fam[((base ?? shadeOfSeed(seed)) - 1) % fam.length]; ctx.fillRect(x, y, z, z); // MOCK after-goods
    return; // MOCK after-goods
  } // MOCK after-goods
  const s = shadeOfSeed(seed), bse = base ?? (LOOK[goodsLook()]?.same ? 2 : ownBase(kind, s)), key = `${goodsLook()}|${kind}|${s}|${bse}`; // MOCK after-goods
  let sheet = SHEETS.get(key); // MOCK after-goods
  if (!sheet) { // MOCK after-goods
    const z = AFTER_BLOCK[kind] * AP; // MOCK after-goods
    sheet = document.createElement('canvas'); sheet.width = sheet.height = z; // MOCK after-goods
    into = sheet.getContext('2d'); paintBlock(kind, s, bse); into = null; // MOCK after-goods
    SHEETS.set(key, sheet); // MOCK after-goods
  } // MOCK after-goods
  const was = ctx.imageSmoothingEnabled; ctx.imageSmoothingEnabled = false; // MOCK after-goods
  ctx.drawImage(sheet, x, y); ctx.imageSmoothingEnabled = was; // MOCK after-goods
} // MOCK after-goods
function paintBlock(kind, s, base) { // MOCK after-goods
  const L = LOOK[goodsLook()] || LOOK.a, lad = LADDER_OF[kind], n = AFTER_BLOCK[kind], last = lad.length - 1; // MOCK after-goods
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { // MOCK after-goods
    const h = hash(s * 7.31 + KIND_SEED[kind] + i * 13.1 + j * 7.7); // MOCK after-goods
    // a 2x2 has no cells to spare for scatter where a lit corner marks it // MOCK after-goods
    const off = L.band && n === 2 ? 0 : L.off; // MOCK after-goods
    let k = base + (h < off / 2 ? -1 : h > 1 - off / 2 ? 1 : 0); // MOCK after-goods
    // the lit band, the block's own cells: its top row and left column, or // MOCK after-goods
    // on a 2x2, its top left cell alone (three of four lit would be the block) // MOCK after-goods
    if (L.band && (n === 2 ? i === 0 && j === 0 : i === 0 || j === 0)) k = base - 1; // MOCK after-goods
    cell(0, 0, i, j, lad[Math.max(0, Math.min(last, k))]); // MOCK after-goods
  } // MOCK after-goods
} // MOCK after-goods
// The ground's blocks with each one's base apart from every block it touches:
// read from the bottom row up and left to right, each block taking its own
// base unless the block left of it or under it already has it (flat: the
// nearest rung two steps from both, else one). A block's own shade is its
// cell's position (`seedOf`), since a block on act 3's ground is one flat
// tone and keeps no shade of its own. // MOCK after-goods
function mockBases(us) { // MOCK after-goods
  const L = LOOK[goodsLook()], out = new Map(); // MOCK after-goods
  if (!L || !L.apart) return out; // MOCK after-goods
  const occ = new Map(), cols = 1 << 12; // MOCK after-goods
  const key = (c, r) => r * cols + c; // MOCK after-goods
  for (const u of us) for (let j = 0; j < u.z; j++) for (let i = 0; i < u.z; i++) occ.set(key(u.c0 + i, u.r0 + j), u.ai); // MOCK after-goods
  for (const u of [...us].sort((p, q) => p.r0 - q.r0 || p.c0 - q.c0)) { // MOCK after-goods
    const nb = L.flat ? familyOf(L, u.kind).length : BASES(u.kind); // MOCK after-goods
    let base = L.flat ? (shadeOfSeed(seedOf(u.ai)) - 1) % nb + 1 : ownBase(u.kind, shadeOfSeed(seedOf(u.ai))); // MOCK after-goods
    const left = out.get(occ.get(key(u.c0 - 1, u.r0))) || 0, under = out.get(occ.get(key(u.c0, u.r0 - 1))) || 0; // MOCK after-goods
    if (L.flat) { // MOCK after-goods
      const gap = k => Math.min(left ? Math.abs(k - left) : 9, under ? Math.abs(k - under) : 9); // MOCK after-goods
      const near = [...Array(nb)].map((_, i) => i + 1).sort((p, q) => Math.abs(p - base) - Math.abs(q - base)); // MOCK after-goods
      base = near.find(k => gap(k) >= 2) ?? near.find(k => gap(k) >= 1) ?? base; // MOCK after-goods
    } else for (let t = 0; t < nb && (base === left || base === under); t++) base = base % nb + 1; // MOCK after-goods
    out.set(u.ai, base); // MOCK after-goods
  } // MOCK after-goods
  return out; // MOCK after-goods
} // MOCK after-goods
// Each option's sawdust: the heap's grain tones, a cell each (kit.js DUST is // MOCK after-goods
// pale flecked mid); here lighter than timber, 2 flecked pale and 4, and // MOCK after-goods
// b's speckled wider, down to 1. // MOCK after-goods
export const MOCK_DUST = { a: [2, PALE, 2, 2, 4], d: [2, PALE, 2, 2, 4], e: [2, PALE, 2, 2, 4], f: [2, PALE, 2, 2, 4] }; // MOCK after-goods
// A block a body carries or lays has no cell to keep a shade in: seeded off // MOCK after-goods
// what holds it (its id, its place in the load), so it holds while held. // MOCK after-goods
export const seedOf = (id, k = 0) => 1 + ((((Number(id) || 0) * 3 + k * 5) % 6) + 6) % 6; // MOCK after-goods
// A heap of grains, in the sawdust's tones a cell, growing as a triangle from
// its middle column `cx`, `R` cells high at its brim. `st` counts cells.
const HEAPS = {};
export function heapCells(R) {
  if (HEAPS[R]) return HEAPS[R];
  const cells = [];
  for (let j = 0; j <= R; j++) for (let dx = -R; dx <= R; dx++) if (Math.abs(dx) + j <= R) cells.push([dx, j]);
  cells.sort((a, b) => (Math.abs(a[0]) + a[1]) - (Math.abs(b[0]) + b[1]) || a[1] - b[1] || a[0] - b[0]);
  return (HEAPS[R] = cells);
}
export function heap(d, cx, R, st, n, tipped = false, pal = DUST, key = st.key) {
  const cells = heapCells(R);
  const full = Math.min(st.n, st.prev), to = Math.min(cells.length, Math.max(st.n, st.prev));
  let top = 0;
  for (let i = 0; i < to; i++) {
    const [dx, j] = cells[i];
    const shift = tipped && j >= R / 2 ? 1 : 0;
    const tone = pal[Math.floor(hash((cx + dx) * 3.3 + j * 17.9) * pal.length)];
    if (i < full) { d.c(cx + dx + shift, -1 - j, tone); top = Math.max(top, j); }
    else d.fade(pileAlpha(i, st), () => d.c(cx + dx + shift, -1 - j, tone));
  }
  count(d, n, cx + 0.5, -1 - top, key);
}

