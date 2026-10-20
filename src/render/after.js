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
// frame to frame). Everything that comes or goes fades.

import { P, GREY, AFTER_CLOSED, AFTER_START_BUILT, AFTER_SIGN_FLAG_U, SKY_FLAG, GESTURE_NAIL_TAPS, AFTER_ART_SCALE, AFTER_BUILD_DROP_S, AFTER_SIGN_TIMBER, GESTURE_STIR_TURNS, AFTER_LINE_SHORT, AFTER_LINE_LONG, AFTER_CARDS, AFTER_BUILD_FADE_S, AFTER_JOBS, AFTER_JOB_POST, AFTER_BUILD_PIECES, AFTER_POST_STEP,
         AFTER_TIP_HOLD_S, AFTER_SPILL_S, AFTER_HEAP_R, AFTER_ART_WORK_S, AFTER_PILE_FADE_S,
         AFTER_SAW_S, AFTER_CHIP_S, AFTER_PULP_S, AFTER_SIGN_S, AFTER_PRESS_S, SHELF_GLYPH_CELLS,
         NUM_FONT_PX, AFTER_COUNT_PAD } from '../config.js';
import { S } from '../state.js';
import { AFTER_JOB } from '../jobs.js';
import { ctx } from './ctx.js';
import { warning } from './pilemarks.js';
import { buildingGlyph } from './bars.js';
import { writeCount, widthOf, drawable, GH } from './numfont.js';
import { screenAt } from './frame.js';
import { buildPileAt, stationBox, stationX0, stationDoor, heapMid, notchX, fileAt, rankAtY, afterFloor, ART, AP } from '../after/place.js';
import { airMotes } from '../after/rebel.js';
import { built, heapBrim, vatSheets, vats } from '../after/levels.js';
import { heapFull, airSpills } from '../after/mill.js';
import { postsOf, bodiesOf, atStation, bodyInk } from '../after/bodies.js';
import { gestureView } from '../after/gestures.js';
import { frame, now, inView, clamp01, pileState, pileAlpha, countAt, clearCounts, pendingCounts, backing, K, W, PALE, MID } from './after/kit.js';
import { drawFloor } from './after/floor.js';
import { deepAt } from '../after/sky.js';
import { drawGround, drawForeground } from './after/ground.js';
import { drawCloudSky } from './after/cloudsky.js';
import { drawGrove } from './after/pine.js';
import { DRAW, workerPose, GLYPHS, backOf } from './after/stations.js';
import { drawFistFlag } from './aftercrowd.js';
import { heap, heapCells, logPile, plankPile, sheetPile, signPile, buildPile, BUILD_SLOTS, plankAt, blockAt } from './after/piles.js';
import { siteOf } from '../after/build.js';
import { drawPillar, drawPair, drawBubbles, drawRebelPile } from './after/pedestal.js';
import { drawUnionCrowd } from './after/unioncrowd.js';

const A = () => S.after;
const snap = v => Math.round(v / P) * P;
const cell = (x, y, tone) => { ctx.fillStyle = GREY[tone]; ctx.fillRect(x, y, P, P); };
const fadeIn = at => (at == null ? 1 : Math.min(1, (now() - at) / AFTER_BUILD_FADE_S));

// The crowd's files and ranks in view: God's crowd draws only these
// (render/aftercrowd.js), and the cost check reads them.
export const crowdSpan = () => ({ f0: fileAt(S.camX - P * 4), f1: fileAt(S.camX + S.viewW + P * 4), r1: rankAtY(S.camY - P * 4) });

// --- the page and the floor ------------------------------------------------------------
// The paper, the sky's ranges of cloud at the horizon and the far cloud under
// them (render/after/ground.js). The main plane's path and the foreground
// are drawn with the camp, over God's stage, whose front meets the path.
export function drawAfterBackdrop() {
  clearCounts();
  ctx.fillStyle = GREY[W];
  ctx.fillRect(S.camX, S.camY, S.viewW, S.viewH);
  drawCloudSky();
  drawGround();
  ctx.fillStyle = GREY[K];
}

// --- the sky ---------------------------------------------------------------------------
// The motes of rebel coming down to the pile. The sky's clouds are the one
// cloud renderer's, drawn with the backdrop (render/after/cloudsky.js).
export function drawAfterSky() {
  if (!A()) return;
  for (const m of airMotes()) {
    ctx.fillStyle = GREY[K]; ctx.fillRect(snap(m.x), snap(m.y), P, P);
    ctx.fillStyle = GREY[W]; ctx.fillRect(snap(m.x) + 1, snap(m.y) + 1, P - 2, P - 2);
  }
}

// --- the grove -------------------------------------------------------------------------
export function drawAfterGrove() { if (A()) drawGrove(); }

// --- the camp ------------------------------------------------------------------------
// Whether a station is working now, and how far through its unit: a member at
// its door with the work coming (its clock held full means its input is
// short), or the hand's last unit within AFTER_ART_WORK_S.
const PERIOD = { mill: AFTER_SAW_S, chipper: AFTER_CHIP_S, papermill: AFTER_PULP_S, workshop: AFTER_SIGN_S, press: AFTER_PRESS_S };
function working(key) {
  const a = A();
  const w = atStation(key)[0];
  if (w && PERIOD[key] && w.t < PERIOD[key]) return { work: true, at: w.t / PERIOD[key], ink: 1 };
  const h = a.workAt[key], since = h == null ? Infinity : a.t - h;
  if (since < AFTER_ART_WORK_S) return { work: true, at: since / AFTER_ART_WORK_S, ink: clamp01(Math.min(since, AFTER_ART_WORK_S - since) / AFTER_PILE_FADE_S) };
  return { work: false, at: 0, ink: 0 };
}
const frameOf = key => frame(stationX0(key), afterFloor(), ART[key].flip || 0, null, AFTER_ART_SCALE);
// The hand's motion at each station this frame (after/gestures.js), by key.
let hands = {};
const readHands = () => { hands = {}; for (const r of gestureView() || []) hands[r.key] = r; };

// What a station's drawing reads besides its pose: the paper mill's vat as
// full as the batch is stirred (by the hand, or the pulper's clock), its
// count, and how many sheets the mould lifts and the line holds.
function extras(key) {
  if (key === 'workshop') return { blanks: Math.floor(A().stock.timber / AFTER_SIGN_TIMBER) };
  if (key !== 'papermill') return {};
  const h = hands.papermill, w = atStation('papermill')[0];
  const fill = h && h.prog ? h.prog / GESTURE_STIR_TURNS : w ? w.t / AFTER_PULP_S : 0;
  return { paper: A().stock.paper, moulds: vatSheets(), slots: vats() > 1 ? AFTER_LINE_LONG : AFTER_LINE_SHORT, fill };
}
// A station's posts: a stake each along its top, black while a member holds
// one or is walking to it, hollow pale while it waits; the newest fades in.
function drawPosts(key, b) {
  let k = 0;
  for (const job of AFTER_JOBS.filter(j => AFTER_JOB_POST[j] === key)) {
    const held = bodiesOf(job).length, posts = postsOf(job);
    for (let n = 0; n < posts; n++, k++) {
      const x = b.x + P + k * AFTER_POST_STEP, y = key === 'pedestal' ? b.y + P : b.y - P * 2;
      ctx.globalAlpha = n === posts - 1 ? fadeIn(A().postAt[job]) : 1;
      cell(x, y, n < held ? K : PALE);
      cell(x, y + P, n < held ? K : PALE);
    }
    ctx.globalAlpha = 1;
  }
}
// A station's loads on its spot while it is raised (after/build.js): each
// fading on as it is set down and off as a builder takes it.
const ramp = (t, t0, dur) => (t0 == null ? 0 : clamp01((t - t0) / dur));
function drawSite(key) {
  const r = siteOf(key);
  if (!r) return;
  const t = now(), d = frame(0, afterFloor(), 0, null, AFTER_ART_SCALE);
  buildPile(d, buildPileAt(key) / AP, i => ramp(t, r.drop[i], AFTER_BUILD_DROP_S) * (1 - ramp(t, r.pick[i], AFTER_PILE_FADE_S)));
}
// The glyph over a station, `at` of it built, faded in and out at the ends
// of its window: hung where the yard hangs one, seven cells over the top.
function glyphOver(b, rows, at, alpha = 1) {
  if (!rows || alpha <= 0) return;
  const was = ctx.globalAlpha;
  ctx.globalAlpha = was * alpha;
  buildingGlyph(snap(b.x + b.w / 2), b.y - P * 7 - (SHELF_GLYPH_CELLS / 2 - 1.5) * P, rows, clamp01(at));
  ctx.globalAlpha = was;
}
// The closed sign at a station's door (config, AFTER_CLOSED), its foot on
// the floor and `x` its middle, world px: a board on a post crossed through
// corner to corner, symbols only, drawn on the act's art cell (AP) with its
// rim the art's stroke.
function closedSign(x) {
  const C = AFTER_CLOSED, fl = afterFloor(), r = 2 * AFTER_ART_SCALE, u = AP;
  const w = C.w * u, h = C.h * u, x0 = snap(x) - Math.round(C.w / 2) * u, top = fl - (C.post + C.h) * u;
  ctx.fillStyle = GREY[K];
  ctx.fillRect(snap(x) - r, top + h, 2 * r, C.post * u);
  ctx.fillRect(x0, top, w, h);
  ctx.fillStyle = GREY[W];
  ctx.fillRect(x0 + r, top + r, w - 2 * r, h - 2 * r);
  // the cross, a stroke two rims thick laid in steps of a rim on the rim's grid
  ctx.fillStyle = GREY[K];
  const cx = x0 + 2 * r, cy = top + 2 * r, cw = w - 4 * r, ch = h - 4 * r, s = 2 * r, n = Math.round((cw - s) / r) + 1;
  for (let i = 0; i < n; i++) {
    const y = cy + Math.round((ch - s) * i / (n - 1) / r) * r;
    ctx.fillRect(cx + i * r, y, s, s); ctx.fillRect(cx + cw - s - i * r, y, s, s);
  }
}
// How far a station's build has taken its closed look down, 0 to 1: each
// piece landed, faded in over AFTER_BUILD_FADE_S, its share.
const openedBy = r => (r ? r.at.slice(0, r.n).reduce((s, at) => s + fadeIn(at), 0) / AFTER_BUILD_PIECES : 0);
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
// A closed station (config, AFTER_CLOSED): its dotted outline and its board
// at the door, faded off as its build lands, and the station going up a
// course a piece, the floor up, each fading in as it lands.
function closedStation(key, draw, opened) {
  const d = frameOf(key), b = stationBox(key), r = A().raising[key], rows = b.h / P;
  alphaDo(1 - opened, () => { for (const [c, row] of outlineOf(key)) d.c(c, row, MID); });
  for (let k = 0; r && k < r.n; k++) {
    const top = Math.round(rows * (k + 1) / AFTER_BUILD_PIECES), bot = Math.round(rows * k / AFTER_BUILD_PIECES);
    ctx.save();
    ctx.beginPath(); ctx.rect(b.x - AP * 4, afterFloor() - top * P, b.w + AP * 10, (top - bot) * P + (k ? 0 : P)); ctx.clip();
    ctx.globalAlpha = fadeIn(r.at[k]);
    draw(d, false, 0);
    ctx.restore();
  }
  alphaDo(1 - opened, () => closedSign(stationDoor(key)));
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
  const opened = built(key) ? (r ? openedBy(r) : 1) : openedBy(r);
  if (opened < 1 && key !== 'pedestal' && !AFTER_START_BUILT.includes(key)) {
    closedStation(key, draw, opened);
    if (!built(key)) { if (r) drawSite(key); return; }
    return;
  }
  const s = working(key);
  draw(frameOf(key), s.work, a.t);
  drawPosts(key, b);
  if (s.work) glyphOver(b, GLYPHS[key], s.at, s.ink);
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
// The sawdust heap under the chipper's chute: its grains a cell
// each, its share of the brim, held tipped toward the notch a moment after a
// tip; a tip's grains falling through the notch and fading; its pile-full
// mark under it while it stands at the brim with nowhere to go.
function drawSawdust() {
  const a = A(), fl = afterFloor(), d = frame(heapMid(), fl, 0, null, AFTER_ART_SCALE);
  const cells = heapCells(AFTER_HEAP_R).length;
  const n = Math.round(Math.min(1, a.stock.sawdust / heapBrim()) * cells);
  const tipped = a.tipAt != null && a.t - a.tipAt < AFTER_TIP_HOLD_S;
  heap(d, 0, AFTER_HEAP_R, pileState('sawdust', n), a.stock.sawdust, tipped);
  const nx = notchX();
  for (const sp of airSpills()) {
    const k = sp.age / AFTER_SPILL_S;
    ctx.globalAlpha = Math.max(0, 1 - k);
    for (let g = 0; g < Math.min(6, sp.n); g++) cell(nx + (g % 2) * P, snap(fl - P * 2 + k * P * 5 + g * P), g % 2 ? PALE : MID);
    ctx.globalAlpha = 1;
  }
  if (heapFull()) warning(heapMid() + P / 2, fl + P * 5);   // under the heap, clear of the window's foot
}
// The finished signs as the fist flags they will be planted as (config,
// AFTER_SIGN_FLAG_U), stood in a rack on a low rail outside the workshop, each
// fading in as it is laid; and while the joiner works, the next one standing
// in the rack's next slot, its fist lettered on as the work goes.
function signRack(d, x, st) {
  const FU = AFTER_SIGN_FLAG_U, at = d.world(x, 0), U = FU.rack, step = FU.apart * P, n = Math.min(Math.max(st.n, st.prev), 3);
  ctx.fillStyle = GREY[K]; ctx.fillRect(at.x - P, at.y - P, step * 3 + P, P);
  for (let i = 0; i < n; i++) d.fade(pileAlpha(i, st), () => drawFistFlag(at.x + i * step, at.y - P, U));
  // The sign on the bench, lettered in the next slot a row of the fist a
  // blow: as far along as its nails are driven, by the hand or the joiner.
  const h = hands.workshop, done = h && h.nails ? h.nails.reduce((a, k) => a + k, 0) / (h.nails.length * GESTURE_NAIL_TAPS) : 0;
  if (done > 0 && st.n < 3) drawFistFlag(at.x + st.n * step, at.y - P, U, done);
  countAt(at.x + step * 1.5, at.y - (SKY_FLAG.h + SKY_FLAG.up + 3) * U - P * 2, st.n);
}
// Each station's counted pile, on its own ground.
function drawPiles() {
  const st = A().stock;
  const pile = (key, what, fn, n) => { if (built(key)) fn(frameOf(key), ART[key].pile[what], pileState(what, n)); };
  pile('forestry', 'grovelogs', logPile, st.grovelogs);
  pile('mill', 'logs', logPile, st.logs);
  pile('mill', 'timber', plankPile, Math.floor(st.timber));
  pile('chipper', 'chiplogs', logPile, st.chiplogs);
  pile('papermill', 'paper', sheetPile, Math.floor(st.paper));
  pile('workshop', 'signs', signRack, Math.floor(st.signs));
  pile('press', 'posters', (d, x, s) => sheetPile(d, x, s, 6, true), Math.floor(st.posters));
}
export function drawAfterCamp() {
  const a = A();
  if (!a) return;
  readHands();
  // The main plane's path and the foreground clouds under it, then the
  // union's crowd behind everything of the camp's: the pair's podium stands
  // in front of it.
  drawFloor();
  drawForeground();
  drawUnionCrowd();
  // the forestry shack, the grove's, then the cards' stations
  drawStation('forestry');
  for (const key of AFTER_CARDS) if (key !== 'grove') drawStation(key);
  drawShackOrder();
  if (built('mill') || built('chipper')) drawSawdust();
  drawPiles();
  drawRebelPile();
  drawPair();
  drawBubbles();
  // The members waiting are our crowd behind the camp (render/aftercrowd.js).
}

// --- the members ---------------------------------------------------------------------
// A body, the yard's square (the mocks'): 18 px, a black rim 2 px round a
// white middle, its feet at (x, y), x its middle column; a load carried
// overhead, an arm out held on the blow, the shout mark while it gives a line.
function body(x, y, dx = 0, h = 3 * P) {
  const bx = snap(x) - P + dx, by = Math.round(y) - h;
  ctx.fillStyle = GREY[K]; ctx.fillRect(bx, by, 3 * P, h);
  ctx.fillStyle = GREY[W]; ctx.fillRect(bx + 2, by + 2, 3 * P - 4, h - 4);
  return { x: bx, y: by };
}
function shoutMark(x, y) { ctx.fillStyle = GREY[K]; ctx.fillRect(x + 8, y - 12, 2, 6); ctx.fillRect(x + 1, y - 9, 2, 2); ctx.fillRect(x + 3, y - 7, 2, 2); ctx.fillRect(x + 15, y - 9, 2, 2); ctx.fillRect(x + 13, y - 7, 2, 2); }
// A station's load on a head, a paper rim round it so it stands clear of
// the black station rising behind it: a plank across, or a block.
function carried(x, y, s) {
  const plank = s.k === 'plank', lx = plank ? x - P * 1.5 : x + P / 2, ly = plank ? y - P : y - P * 2;
  const w = plank ? P * 6 : P * 2, h = plank ? P : P * 2;
  ctx.fillStyle = GREY[W]; ctx.fillRect(lx - 2, ly - 2, w + 4, h + 4);
  const d = frame(lx, ly);
  if (plank) plankAt(d, 0, 0); else blockAt(d, 0, 0);
}
function drawMember(w) {
  // The first worker through a working station's door stands in its pose.
  if (w.at && DRAW[w.at] && atStation(w.at)[0] === w) {
    const s = working(w.at), pose = workerPose(w.at, s.work, A().t);
    if (pose) { frameOf(w.at).body(pose.x, pose.y, pose.dx, 0, pose.squat); return; }
  }
  // On the floor a body stands on the line, which is drawn flat (render/
  // after/floor.js): it walks level over the cloud.
  const ground = w.y;
  const at = body(w.x, ground);
  const x = at.x, y = at.y;
  ctx.fillStyle = GREY[K];
  if (w.load === 'log') { ctx.fillRect(x - P, y - P, 5 * P, P); cell(x + P, y - P, PALE); }
  else if (w.load === 'sign') drawFistFlag(x + P, y + P * 2, AFTER_SIGN_FLAG_U.held, 1, AFTER_SIGN_FLAG_U.up * P);
  else if (w.load === 'posters') { ctx.fillRect(x + 2, y - 10, 14, 10); ctx.fillStyle = GREY[W]; ctx.fillRect(x + 4, y - 8, 10, 6); }
  else if (w.load === 'carry' || w.load === 'lay') carried(x, y, BUILD_SLOTS[w.slot] || BUILD_SLOTS[0]);
  else if (w.load === 'tip') { ctx.fillRect(x + 2, y - 10, 14, 10); ctx.fillStyle = GREY[PALE]; ctx.fillRect(x + 4, y - 8, 10, 6); }
  if (w.swing != null) {
    if (w.job === AFTER_JOB.AGITATE) shoutMark(x, y);
    else for (let k = 1; k <= 2; k++) cell(x + (w.face > 0 ? 2 + k : -k) * P, y - k * P, K);
  }
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
    const at = onWorld(c.x, c.y), str = String(c.n);
    const w = widthOf(drawable(str), NUM_FONT_PX), h = GH * NUM_FONT_PX, pad = AFTER_COUNT_PAD;
    ctx.fillStyle = GREY[W];
    ctx.fillRect(Math.round(at.x - w / 2) - pad, Math.round(at.y - h / 2) - pad, w + pad * 2, h + pad * 2);
    writeCount(ctx, str, at.x, at.y);
  }
  clearCounts();
}
