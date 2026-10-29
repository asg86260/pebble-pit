// The afterlife, drawn (DESIGN.md, "Acts 3 and 4", act 3, "The picture"),
// to the mocks the owner voted on 2026-10-18 (docs/mocks/act3-place-2026-10-18,
// docs/mocks/act3-stations-2026-10-18): floor A, the billow edge; layout A,
// camp left and crowd right; the cloud pillar with the pair on it sending up
// bubbles; the shack cut out with its mallet; the six stations polished.
// Its layers are in render.js's LAYERS, drawn only with the camera up there.
// God's crowd, the throne and the camp's own crowd behind the stations are
// render/aftercrowd.js's.
//
// High key, the act's four tones only (config, AFTER_TONES): white cloud,
// black for the masses and the rims, the pale and the mid grey only for
// material, every material tone picked a cell at a time off a fixed hash of
// where the cell stands (no flat fills, no random draw, so it holds still
// frame to frame). Everything that comes or goes fades, but the goods: every
// block is brought and taken by a body or the hand, so none ever fades.

import { P, GREY, AFTER_BLOCK, AFTER_CARRY_SHOWN, AFTER_STATIONS, AFTER_START_BUILT, AFTER_SIGN_FLAG_U, AFTER_ART_SCALE, AFTER_CARDS, AFTER_BUILD_FADE_S, AFTER_BUILD_PIECES,
         AFTER_TIP_HOLD_S, AFTER_SPILL_S, AFTER_ART_WORK_S,
         AFTER_SAW_S, AFTER_SIGN_S, SHELF_GLYPH_CELLS,
         NUM_FONT_PX, AFTER_COUNT_PAD } from '../config.js';
import { S } from '../state.js';
import { ctx } from './ctx.js';
import { fillDots } from './dots.js';
import { buildingGlyph } from './bars.js';
import { writeCount, widthOf, drawable, GH } from './numfont.js';
import { screenAt } from './frame.js';
import { stationBox, stationX0, heapMid, notchX, fileAt, rankAtY, groundOf, ART, AP } from '../after/place.js';
import { airMotes } from '../after/rebel.js';
import { built, heapBrim } from '../after/levels.js';
import { airSpills } from '../after/mill.js';
import { atStation, bodyInk, carried as carryOf } from '../after/bodies.js';
import { gestureView } from '../after/gestures.js';
import { loadKind } from '../carry.js';
import { frame, now, inView, clamp01, pileState, clearCounts, pendingCounts, backing, K, W, PALE, MID } from './after/kit.js';
import { drawFloor } from './after/floor.js';
import { deepAt } from '../after/sky.js';
import { drawCloudSky } from './after/cloudsky.js';
import { drawGrove } from './after/pine.js';
import { DRAW, workerPose, GLYPHS, backOf, drawMillHeap } from './after/stations.js';
import { drawFistFlag } from './aftercrowd.js';
import { heap, heapCells, drawGround, goodBlock } from './after/piles.js';
import { goodsLook, STORED, MOCK_DUST, seedOf } from './after/piles.js'; // MOCK
import { drawBody } from './crew.js';
import { onDevice } from './wardrobe.js';
import { drawPillar, drawPair, drawBubbles, drawRebelPile } from './after/pedestal.js';
import { drawUnionCrowd } from './after/unioncrowd.js';
import { drawRoster, drawShops } from '../roster.js';
import { now as wallNow } from '../clock.js';
import { motePos } from './cursor.js';

const A = () => S.after;
const snap = v => Math.round(v / P) * P;
const cell = (x, y, tone) => { ctx.fillStyle = GREY[tone]; ctx.fillRect(x, y, P, P); };
// A drawing laid with its origin at a world point put on a whole device
// pixel (render/crew.js, `rigid`), drawn off (0, 0) in whole pixels: a thing
// that moves goes by its true position, and its insides never shear.
function onPixel(x, y, draw) {
  const m = ctx.getTransform ? ctx.getTransform() : null;
  const tx = m ? onDevice(x, m.a, m.e) : Math.round(x), ty = m ? onDevice(y, m.d, m.f) : Math.round(y);
  ctx.translate(tx, ty);
  try { draw(); } finally { ctx.translate(-tx, -ty); }
}
const fadeIn = at => (at == null ? 1 : Math.min(1, (now() - at) / AFTER_BUILD_FADE_S));

// The crowd's files and ranks in view: God's crowd draws only these
// (render/aftercrowd.js), and the cost check reads them.
export const crowdSpan = () => ({ f0: fileAt(S.camX - P * 4), f1: fileAt(S.camX + S.viewW + P * 4), r1: rankAtY(S.camY - P * 4) });

// --- the page and the floor ------------------------------------------------------------
// The paper and the sky's ranges of cloud at the horizon. The main plane's path and the foreground
// are drawn with the camp, over God's stage, whose front meets the path.
export function drawAfterBackdrop() {
  clearCounts();
  ctx.fillStyle = GREY[W];
  ctx.fillRect(S.camX, S.camY, S.viewW, S.viewH);
  drawCloudSky();
  ctx.fillStyle = GREY[K];
}

// --- the sky ---------------------------------------------------------------------------
// The motes of rebel coming down to the pile. The sky's clouds are the one
// cloud renderer's, drawn with the backdrop (render/after/cloudsky.js).
export function drawAfterSky() {
  if (!A()) return;
  // Each a cell's drawing laid at its true position, moving as one piece.
  for (const m of airMotes()) onPixel(m.x, m.y, () => {
    ctx.fillStyle = GREY[K]; ctx.fillRect(0, 0, P, P);
    ctx.fillStyle = GREY[W]; ctx.fillRect(1, 1, P - 2, P - 2);
  });
}

// --- the grove -------------------------------------------------------------------------
export function drawAfterGrove() { if (A()) drawGrove(); }

// --- the camp ------------------------------------------------------------------------
// Whether a station is working now: a member at its door with the work
// coming (its clock held full means its input is short), or the hand's last
// unit within AFTER_ART_WORK_S. The material shows how far along it is
// (DESIGN.md, "Act 3's goods are blocks", rule 3), so nothing hangs over it.
const PERIOD = { mill: AFTER_SAW_S, workshop: AFTER_SIGN_S };
function working(key) {
  const a = A();
  const w = atStation(key)[0];
  if (w && PERIOD[key] && w.t < PERIOD[key]) return { work: true };
  const h = a.workAt[key];
  return { work: h != null && a.t - h < AFTER_ART_WORK_S };
}
const frameOf = key => frame(stationX0(key), groundOf(key), ART[key].flip || 0, null, AFTER_ART_SCALE);
// The hand's motion at each station this frame (after/gestures.js), by key.
let hands = {};   // cache: this frame's gestures, read afresh at the top of each draw
const readHands = () => { hands = {}; for (const r of gestureView() || []) hands[r.key] = r; };

// What a station's drawing reads besides its pose. The workshop's blanks are
// none: its timber is the plot of blocks carried to its rack (after/piles.js,
// `benchtimber`), drawn with the other piles, never a count of the mound.
const extras = () => ({});
// The glyph over a station, `at` of it built: hung where the yard hangs one,
// seven cells over the top.
function glyphOver(b, rows, at) {
  if (!rows) return;
  buildingGlyph(snap(b.x + b.w / 2), b.y - P * 7 - (SHELF_GLYPH_CELLS / 2 - 1.5) * P, rows, clamp01(at));
}
// How far a station's build has taken its closed look down, 0 to 1: each
// piece landed, faded in over AFTER_BUILD_FADE_S, its share.
const openedBy = r => (r ? r.at.slice(0, r.n).reduce((s, at) => s + fadeIn(at), 0) / AFTER_BUILD_PIECES : 0);
const openedOf = key => { const r = A().raising[key]; return built(key) ? (r ? openedBy(r) : 1) : openedBy(r); };
const alphaDo = (a, fn) => { if (a <= 0) return; const was = ctx.globalAlpha; ctx.globalAlpha = was * Math.min(1, a); fn(); ctx.globalAlpha = was; };
// Its outline: the drawing's own cells (its silhouette) at its edge, every
// other one, in the mid grey: a plan of what will stand.
const OUTLINES = {};
function outlineOf(key) {
  if (OUTLINES[key]) return OUTLINES[key];
  const on = new Set();
  for (const [row, a, b] of backOf(key)) for (let c = a; c <= b; c++) on.add(`${c},${row}`);
  const out = [];
  for (const k of on) {
    const [c, row] = k.split(',').map(Number);
    const edge = !on.has(`${c - 1},${row}`) || !on.has(`${c + 1},${row}`) || !on.has(`${c},${row - 1}`) || !on.has(`${c},${row + 1}`);
    if (edge && (c + row) % 2 === 0) out.push([c, row]);
  }
  return (OUTLINES[key] = out);
}
// A closed station: its dotted outline, faded off as its build lands, and
// the station going up a course a piece, the floor up, each fading in as it
// lands.
function closedStation(key, draw, opened) {
  const d = frameOf(key), b = stationBox(key), r = A().raising[key], rows = b.h / P;
  alphaDo(1 - opened, () => { for (const [c, row] of outlineOf(key)) d.c(c, row, MID); });
  for (let k = 0; r && k < r.n; k++) {
    const top = Math.round(rows * (k + 1) / AFTER_BUILD_PIECES), bot = Math.round(rows * k / AFTER_BUILD_PIECES);
    ctx.save();
    ctx.beginPath(); ctx.rect(b.x - AP * 4, groundOf(key) - top * P, b.w + AP * 10, (top - bot) * P + (k ? 0 : P)); ctx.clip();
    ctx.globalAlpha = fadeIn(r.at[k]);
    draw(d, false, 0);
    ctx.restore();
  }
}
function drawStation(key) {
  const b = stationBox(key);
  if (!inView(b.x - P * 16, b.w + P * 32)) return;
  const a = A(), r = a.raising[key];
  // Each drawn on its paper backing, so the camp's crowd behind it does not
  // show through its open parts; the pillar is paper through already.
  const draw = key === 'pedestal' ? drawPillar : (d, work, t) => { backing(d, backOf(key)); DRAW[key](d, work, t, hands[key], atStation(key).length > 0, extras(key)); };
  // Closed, or just built and its closed look still fading off as the last
  // piece lands: its loads on the spot while it goes up.
  const opened = openedOf(key);
  if (opened < 1 && key !== 'pedestal' && !AFTER_START_BUILT.includes(key)) {
    closedStation(key, draw, opened);
    return;
  }
  draw(frameOf(key), working(key).work, a.t);
}
// The shack, ordering: the glyph of the station going up filling over it a
// piece at a time, each fading in as it lands.
function drawShackOrder() {
  const a = A(), b = stationBox('shack');
  const key = AFTER_CARDS.find(k => a.raising[k] && !built(k));
  if (!key) return;
  const r = a.raising[key];
  const last = r.at.length ? fadeIn(r.at[r.at.length - 1]) : 1;
  glyphOver(b, GLYPHS[key], (r.n - 1 + last) / AFTER_BUILD_PIECES);
}
// The saw mill's sawdust heap is its machine's, drawn with it under its bed
// (render/after/stations.js), a grain a cell.
// Each station's counted piles, on its own ground, the workshop's signs and
// timber among them: drawn over the lip of billows along the path's front
// (render.js), so a pile stands on the floor as a body does, its bottom row
// whole rather than cut into dashes between the puffs.
export function drawAfterPiles() {
  const a = A();
  if (!a) return;
  drawGround(a.t);
  if (built('mill')) drawMillHeap(frameOf('mill'));
}
export function drawAfterCamp() {
  const a = A();
  if (!a) return;
  readHands();
  // The main plane's path, then the union's crowd behind everything of the
  // camp's: the pair's podium stands in front of it. The lip of billows
  // along the path's front is drawn over the camp and under the members
  // (render.js), so a station's foot tucks behind it and a body stands on it.
  drawFloor();
  drawUnionCrowd();
  // the forestry shack, the grove's, then the cards' stations
  for (const key of Object.keys(AFTER_STATIONS)) drawStation(key);
  drawShackOrder();
  drawRebelPile();
  drawPair();
  drawBubbles();
  // The members waiting are our crowd behind the camp (render/aftercrowd.js).
}

// --- the members ---------------------------------------------------------------------
// A body is the yard's (render/crew.js, `drawBody`): its square, its top
// left at (x, y). A member walking is laid at its true position, and its load
// overhead, an arm out held on the blow and the shout mark while it gives a
// line are drawn off the same origin, so the whole of it moves as one piece.
function shoutMark(x, y) { ctx.fillStyle = GREY[K]; ctx.fillRect(x + 8, y - 12, 2, 6); ctx.fillRect(x + 1, y - 9, 2, 2); ctx.fillRect(x + 3, y - 7, 2, 2); ctx.fillRect(x + 15, y - 9, 2, 2); ctx.fillRect(x + 13, y - 7, 2, 2); }
// A load of `n` of a good stacked the yard's way (render/crew.js), a thing a
// row, as many rows as it carries, up to AFTER_CARRY_SHOWN: over a head whose
// top left is (x, y).
function drawLoad(x, y, kind, n, id = 0, load = null) { // MOCK after-goods -- id, load
  n = Math.min(AFTER_CARRY_SHOWN, n);
  // Logs and timber as the blocks they lie on their piles as
  // (render/after/piles.js, `goodBlock`), stacked a block on a block over the
  // body's middle column.
  if (kind === 'load') {
    // A station's load on a head, a paper rim round it so it stands clear of
    // the black station rising behind it.
    const z = AFTER_BLOCK.load * AP, lx = x + 1.5 * P - z / 2, ly = y - z;
    ctx.fillStyle = GREY[W]; ctx.fillRect(lx - 2, ly - 2, z + 4, z + 4);
    goodBlock(lx, ly, kind);
  } else if (kind === 'log' || kind === 'plank') {
    const z = AFTER_BLOCK[kind] * AP, lx = x + 1.5 * P - z / 2;
    for (let k = 0; k < n; k++) goodBlock(lx, y - (k + 1) * z, kind, STORED() && load && load[k] ? load[k] : seedOf(id, k)); // MOCK after-goods -- seed, or the carried unit's own value
  } else if (kind === 'sign' && goodsLook()) { // MOCK after-goods
    const z = AFTER_BLOCK.sign * AP, lx = x + 1.5 * P - z / 2; // MOCK after-goods
    for (let k = 0; k < n; k++) goodBlock(lx, y - (k + 1) * z, kind, STORED() && load && load[k] ? load[k] : seedOf(id, k)); // MOCK after-goods
  } else if (kind === 'sign') {
    // The one in front held up on its post; the rest boards on the shoulder.
    drawFistFlag(x + P, y + P * 2, AFTER_SIGN_FLAG_U.held, 1, AFTER_SIGN_FLAG_U.up * P);
    ctx.fillStyle = GREY[K];
    for (let k = 1; k < n; k++) ctx.fillRect(x - P, y - k * 2 * P, 3 * P, P);
  }
}
// The goods the yard's hand holds and throws up here (hands.js): each block
// swept off a pile drifting round the cursor where a grain of dust would
// (render/cursor.js, `motePos`), and each one thrown still in the air
// (S.chips, whose `x, y` is a block's middle), drawn as the block it is on
// its pile, whole cells across and laid at its true position. Here, in the
// act's own layer and tones, not the yard's cursor or chips.
function drawHandGoods() {
  const t = wallNow() / 1000;
  if (S.held && S.mouse) {
    for (const m of S.motes) {
      if (m.place !== 'after' || !AFTER_BLOCK[m.kind]) continue;
      const z = AFTER_BLOCK[m.kind] * AP, at = motePos(m, t);
      onPixel(at.x - z / 2, at.y - z / 2, () => goodBlock(0, 0, m.kind, m.s)); // MOCK after-goods -- m.s
    }
  }
  for (const ch of S.chips) {
    if (ch.place !== 'after' || !AFTER_BLOCK[ch.kind]) continue;
    const z = AFTER_BLOCK[ch.kind] * AP;
    if (!inView(ch.x - z, z * 2)) continue;
    goodBlock(Math.round(ch.x - z / 2), Math.round(ch.y - z / 2), ch.kind, ch.s); // MOCK after-goods -- ch.s
  }
}
function drawMember(w) {
  // The first worker through a working station's door stands in its pose.
  if (w.at && DRAW[w.at] && atStation(w.at)[0] === w) {
    const s = working(w.at), pose = workerPose(w.at, s.work, A().t);
    if (pose) { frameOf(w.at).body(pose.x, pose.y, pose.dx, 0, pose.squat); return; }
  }
  onPixel(w.x - P, w.y - 3 * P, () => {
    const x = 0, y = 0;
    drawBody(x, y);
    ctx.fillStyle = GREY[K];
    drawLoad(x, y, loadKind(w), carryOf(w), w.id, w.load); // MOCK: w.id, w.load
    if (w.tipping) { ctx.fillRect(x + 2, y - 10, 14, 10); ctx.fillStyle = GREY[PALE]; ctx.fillRect(x + 4, y - 8, 10, 6); }
    if (w.swing != null) {
      if (w.job == null) shoutMark(x, y);
      else for (let k = 1; k <= 2; k++) cell(x + (w.face > 0 ? 2 + k : -k) * P, y - k * P, K);
    }
  });
}
export function drawAfterMembers() {
  const a = A();
  if (!a) return;
  // Those out on the way to God's camp are drawn in depth, among his crowd
  // (render/aftercrowd.js), crossed over from here in the way's first cells.
  // Each faded as it steps out of our crowd or walks back into it. One the
  // hand has lifted is drawn here, on the cursor, wherever it is held.
  for (const w of a.bodies) {
    const deep = w.lifted ? 0 : deepAt(w.x);
    if (deep >= 1 || !inView(w.x - P * 4, P * 8)) continue;
    ctx.globalAlpha = bodyInk(w) * (1 - deep);
    drawMember(w);
    ctx.globalAlpha = 1;
  }
  // and the goods in the hand and in the air, over every body, as a lifted
  // one is
  drawHandGoods();
}

// --- the counts ----------------------------------------------------------------------
// Each pile's count, in screen pixels after the world, where the piles put
// it, on a plate of paper its own size, so the camp's crowd behind it does
// not crowd its digits.
// A world spot on the glass, in screen px, on the device pixel the world's
// own drawing puts it on (render/frame.js, `enterWorld`, rounds the camera's
// offset once and lays the drawing off it), so a count holds its place over
// its pile as the camera pans instead of rounding a pixel either way of it.
function onWorld(wx, wy) {
  const k = S.zoom * S.dpr;
  return { x: (Math.round(wx * k) + Math.round((-S.camX + S.shakeX) * k)) / S.dpr,
           y: (Math.round(wy * k) + Math.round((-S.camY + S.shakeY) * k)) / S.dpr };
}
export function drawAfterCounts() {
  if (S.view !== 'after' || !A()) return;
  for (const c of pendingCounts()) {
    // faded on and off with its pile (render/after/piles.js, `countOver`)
    const at = onWorld(c.x, c.y), str = String(c.n), was = ctx.globalAlpha;
    ctx.globalAlpha = was * (c.a == null ? 1 : c.a);
    const w = widthOf(drawable(str), NUM_FONT_PX), h = GH * NUM_FONT_PX, pad = AFTER_COUNT_PAD;
    // a pile's count stood on its foot, its plate's bottom at the spot
    if (c.foot) at.y -= h / 2 + pad;
    ctx.fillStyle = GREY[W];
    ctx.fillRect(Math.round(at.x - w / 2) - pad, Math.round(at.y - h / 2) - pad, w + pad * 2, h + pad * 2);
    fillDots(ctx, Math.round(at.x - w / 2) - pad, Math.round(at.y - h / 2) - pad, w + pad * 2, h + pad * 2);
    writeCount(ctx, str, at.x, at.y);
    ctx.globalAlpha = was;
  }
  clearCounts();
}

// --- the rosters ---------------------------------------------------------------------
// Under each station, the yard's roster (roster.js; after/roster.js hands it
// the act's posts): its counter's sprite the yard's own body, as every
// member up here is drawn.
export function drawAfterRoster() {
  if (!A()) return;
  drawRoster(ctx, drawBody, () => {}, null, null);
  drawShops(ctx);
}
