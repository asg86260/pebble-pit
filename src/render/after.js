// The afterlife, drawn (DESIGN.md, "Acts 3 and 4", act 3, "The picture"),
// to the mocks the owner voted on 2026-10-18 (docs/mocks/act3-place-2026-10-18,
// docs/mocks/act3-stations-2026-10-18): floor A, the billow edge; layout A,
// camp left and crowd right; the cloud pillar with the pair on it sending up
// bubbles; the shack cut out with its mallet; the six stations polished.
// Its layers are in render.js's LAYERS, drawn only with the camera up there.
// God's crowd, the throne and the camp's own crowd behind the stations are
// render/aftercrowd.js's.
//
// High key, black and white only: white cloud, black for the masses and the
// rims, grey only for material, every material grey picked a cell at a time
// off a fixed hash of where the cell stands (no flat fills, no random draw,
// so it holds still frame to frame). Everything that comes or goes fades.

import { P, GREY, AFTER_CARDS, AFTER_BUILD_FADE_S, AFTER_JOBS, AFTER_JOB_POST, AFTER_BUILD_PIECES, AFTER_POST_STEP,
         AFTER_TIP_HOLD_S, AFTER_SPILL_S, AFTER_HEAP_R, AFTER_ART_WORK_S, AFTER_PILE_FADE_S,
         AFTER_SAW_S, AFTER_CHIP_S, AFTER_PULP_S, AFTER_SIGN_S, AFTER_PRESS_S, SHELF_GLYPH_CELLS } from '../config.js';
import { S } from '../state.js';
import { AFTER_JOB } from '../jobs.js';
import { ctx } from './ctx.js';
import { warning } from './pilemarks.js';
import { buildingGlyph } from './bars.js';
import { writeCount } from './numfont.js';
import { screenAt } from './frame.js';
import { stationBox, stationX0, campSpot, heapMid, notchX, pileAt, fileAt, rankAtY, floorAt, afterFloor, ART } from '../after/place.js';
import { clouds, cloudCells, cloudAlpha, airMotes, cloudW } from '../after/rebel.js';
import { built, heapBrim } from '../after/levels.js';
import { heapFull, airSpills } from '../after/mill.js';
import { postsOf, bodiesOf, atStation } from '../after/bodies.js';
import { frame, now, inView, clamp01, pileState, clearCounts, pendingCounts, hash } from './after/kit.js';
import { drawFloor } from './after/floor.js';
import { drawGrove } from './after/pine.js';
import { DRAW, workerPose, GLYPHS } from './after/stations.js';
import { heap, heapCells, logPile, plankPile, sheetPile, signPile } from './after/piles.js';
import { drawPillar, drawPair, drawBubbles, drawRebelPile } from './after/pedestal.js';

const A = () => S.after;
const snap = v => Math.round(v / P) * P;
const cell = (x, y, tone) => { ctx.fillStyle = GREY[tone]; ctx.fillRect(x, y, P, P); };
const fadeIn = at => (at == null ? 1 : Math.min(1, (now() - at) / AFTER_BUILD_FADE_S));

// The crowd's files and ranks in view: God's crowd draws only these
// (render/aftercrowd.js), and the cost check reads them.
export const crowdSpan = () => ({ f0: fileAt(S.camX - P * 4), f1: fileAt(S.camX + S.viewW + P * 4), r1: rankAtY(S.camY - P * 4) });

// --- the page and the floor ------------------------------------------------------------
export function drawAfterBackdrop() {
  clearCounts();
  ctx.fillStyle = GREY[0];
  ctx.fillRect(S.camX, S.camY, S.viewW, S.viewH);
  drawFloor();
  ctx.fillStyle = '#000';
}

// --- the sky ---------------------------------------------------------------------------
// The clouds, scenery, each an oval of pale cells with a grey edge; the motes
// of rebel coming down to the pile.
const toneAt = (c, r, tones) => tones[Math.floor(hash(c * 13.1 + r * 7.7) * tones.length)];
export function drawAfterSky() {
  if (!A()) return;
  const t = now();
  for (const c of clouds()) {
    const w = cloudW(c);
    if (!inView(c.x, w)) continue;
    const cells = cloudCells(c), set = new Set(cells.map(([i, j]) => `${i},${j}`));
    ctx.globalAlpha = cloudAlpha(c, t);
    const x0 = snap(c.x);
    for (const [i, j] of cells) {
      const rim = !set.has(`${i - 1},${j}`) || !set.has(`${i + 1},${j}`) || !set.has(`${i},${j - 1}`) || !set.has(`${i},${j + 1}`);
      cell(x0 + i * P, c.y + j * P, rim ? 4 : toneAt(i + c.id, j, [1, 1, 2]));
    }
    ctx.globalAlpha = 1;
  }
  for (const m of airMotes()) {
    ctx.fillStyle = '#000'; ctx.fillRect(snap(m.x), snap(m.y), P, P);
    ctx.fillStyle = GREY[1]; ctx.fillRect(snap(m.x) + 1, snap(m.y) + 1, P - 2, P - 2);
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
const frameOf = key => frame(stationX0(key), afterFloor(), ART[key].flip || 0);

// A station's posts: a stake each along its top, black while a member holds
// one or is walking to it, hollow grey while it waits; the newest fades in.
function drawPosts(key, b) {
  let k = 0;
  for (const job of AFTER_JOBS.filter(j => AFTER_JOB_POST[j] === key)) {
    const held = bodiesOf(job).length, posts = postsOf(job);
    for (let n = 0; n < posts; n++, k++) {
      const x = b.x + P + k * AFTER_POST_STEP, y = key === 'pedestal' ? b.y + P : b.y - P * 2;
      ctx.globalAlpha = n === posts - 1 ? fadeIn(A().postAt[job]) : 1;
      cell(x, y, n < held ? 10 : 3);
      cell(x, y + P, n < held ? 10 : 4);
    }
    ctx.globalAlpha = 1;
  }
}
// Where a station will stand, before it is bought: its box, dashed in pale grey.
function ghostBox(b) {
  ctx.fillStyle = GREY[3];
  for (let x = b.x; x < b.x + b.w; x += P * 2) { ctx.fillRect(x, b.y, P, 2); ctx.fillRect(x, b.y + b.h - 2, P, 2); }
  for (let y = b.y; y < b.y + b.h; y += P * 2) { ctx.fillRect(b.x, y, 2, P); ctx.fillRect(b.x + b.w - 2, y, 2, P); }
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
function drawStation(key) {
  const b = stationBox(key);
  if (!inView(b.x - P * 16, b.w + P * 32)) return;
  const a = A(), r = a.raising[key];
  if (!built(key) && !r) { ghostBox(b); return; }
  const draw = key === 'pedestal' ? drawPillar : (d, work, t) => DRAW[key](d, work, t);
  if (!built(key)) {
    // Raised a band a piece, the floor up, each fading in from when it landed.
    ghostBox(b);
    const rows = b.h / P, d = frameOf(key);
    for (let k = 0; k < r.n; k++) {
      const top = Math.round(rows * (k + 1) / AFTER_BUILD_PIECES), bot = Math.round(rows * k / AFTER_BUILD_PIECES);
      ctx.save();
      ctx.beginPath(); ctx.rect(b.x - P * 4, afterFloor() - top * P, b.w + P * 8, (top - bot) * P); ctx.clip();
      ctx.globalAlpha = fadeIn(r.at[k]);
      ctx.fillStyle = GREY[0]; ctx.fillRect(b.x, afterFloor() - top * P, b.w, (top - bot) * P);
      draw(d, false, 0);
      ctx.restore();
    }
    return;
  }
  const s = working(key);
  // A station finished a moment ago is still settling: its last band fading.
  ctx.globalAlpha = r ? fadeIn(r.at[r.at.length - 1]) : 1;
  draw(frameOf(key), s.work, a.t);
  ctx.globalAlpha = 1;
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
// The sawdust heap between the saw mill and the chipper: its grains a cell
// each, its share of the brim, held tipped toward the notch a moment after a
// tip; a tip's grains falling through the notch and fading; its pile-full
// mark under it while it stands at the brim with nowhere to go.
function drawSawdust() {
  const a = A(), fl = afterFloor(), d = frame(heapMid(), fl);
  const cells = heapCells(AFTER_HEAP_R).length;
  const n = Math.round(Math.min(1, a.stock.sawdust / heapBrim()) * cells);
  const tipped = a.tipAt != null && a.t - a.tipAt < AFTER_TIP_HOLD_S;
  heap(d, 0, AFTER_HEAP_R, pileState('sawdust', n), a.stock.sawdust, tipped);
  const nx = notchX();
  for (const sp of airSpills()) {
    const k = sp.age / AFTER_SPILL_S;
    ctx.globalAlpha = Math.max(0, 1 - k);
    for (let g = 0; g < Math.min(6, sp.n); g++) cell(nx + (g % 2) * P, snap(fl - P * 2 + k * P * 5 + g * P), g % 2 ? 4 : 5);
    ctx.globalAlpha = 1;
  }
  if (heapFull()) warning(heapMid() + P / 2, fl + P * 7);
}
// Each station's counted pile, on its own ground.
function drawPiles() {
  const st = A().stock;
  const pile = (key, what, fn, n) => { if (built(key)) fn(frameOf(key), ART[key].pile[what], pileState(what, n)); };
  pile('mill', 'logs', logPile, st.logs);
  pile('mill', 'timber', plankPile, Math.floor(st.timber));
  pile('chipper', 'chiplogs', logPile, st.chiplogs);
  pile('papermill', 'paper', sheetPile, Math.floor(st.paper));
  pile('workshop', 'signs', signPile, Math.floor(st.signs));
  pile('press', 'posters', (d, x, s) => sheetPile(d, x, s, 6, true), Math.floor(st.posters));
}
export function drawAfterCamp() {
  const a = A();
  if (!a) return;
  for (const key of AFTER_CARDS) if (key !== 'grove') drawStation(key);
  drawShackOrder();
  if (built('mill') || built('chipper')) drawSawdust();
  drawPiles();
  drawRebelPile();
  drawPair();
  drawBubbles();
  // The members waiting on the camp's ground, each on its spot, back rows first.
  for (let k = a.camp - 1; k >= 0; k--) {
    const at = campSpot(k);
    if (inView(at.x - P * 2, P * 4)) body(at.x, at.y + floorAt(at.x) - afterFloor());
  }
}

// --- the members ---------------------------------------------------------------------
// A body, the yard's square (the mocks'): 18 px, a black rim 2 px round a
// white middle, its feet at (x, y), x its middle column; a load carried
// overhead, an arm out held on the blow, the shout mark while it gives a line.
function body(x, y, dx = 0, h = 3 * P) {
  const bx = snap(x) - P + dx, by = Math.round(y) - h;
  ctx.fillStyle = '#000'; ctx.fillRect(bx, by, 3 * P, h);
  ctx.fillStyle = GREY[0]; ctx.fillRect(bx + 2, by + 2, 3 * P - 4, h - 4);
  return { x: bx, y: by };
}
function shoutMark(x, y) { ctx.fillStyle = '#000'; ctx.fillRect(x + 8, y - 12, 2, 6); ctx.fillRect(x + 1, y - 9, 2, 2); ctx.fillRect(x + 3, y - 7, 2, 2); ctx.fillRect(x + 15, y - 9, 2, 2); ctx.fillRect(x + 13, y - 7, 2, 2); }
function drawMember(w) {
  // The first worker through a working station's door stands in its pose.
  if (w.at && DRAW[w.at] && atStation(w.at)[0] === w) {
    const s = working(w.at), pose = workerPose(w.at, s.work, A().t);
    if (pose) { frameOf(w.at).body(pose.x, pose.y, pose.dx, 0, pose.squat); return; }
  }
  const ground = Math.abs(w.y - afterFloor()) < 1 ? floorAt(w.x) : w.y;
  const at = body(w.x, ground);
  const x = at.x, y = at.y;
  ctx.fillStyle = '#000';
  if (w.load === 'log') { ctx.fillRect(x - P, y - P, 5 * P, P); cell(x + P, y - P, 3); }
  else if (w.load === 'sign') { ctx.fillRect(x + P + 2, y - P, 2, P); ctx.fillRect(x, y - P * 3, P * 3, P * 2); ctx.fillStyle = GREY[0]; ctx.fillRect(x + 2, y - P * 3 + 2, P * 3 - 4, P * 2 - 4); }
  else if (w.load === 'posters') { ctx.fillRect(x + 2, y - 10, 14, 10); ctx.fillStyle = GREY[0]; ctx.fillRect(x + 4, y - 8, 10, 6); }
  else if (w.load === 'tip') { ctx.fillRect(x + 2, y - 10, 14, 10); ctx.fillStyle = GREY[4]; ctx.fillRect(x + 4, y - 8, 10, 6); }
  if (w.swing != null) {
    if (w.job === AFTER_JOB.AGITATE) shoutMark(x, y);
    else for (let k = 1; k <= 2; k++) cell(x + (w.face > 0 ? 2 + k : -k) * P, y - k * P, 10);
  }
}
export function drawAfterMembers() {
  const a = A();
  if (!a) return;
  for (const w of a.bodies) if (inView(w.x - P * 4, P * 8)) drawMember(w);
}

// --- the counts ----------------------------------------------------------------------
// Each pile's count, in screen pixels after the world, where the piles put it.
export function drawAfterCounts() {
  if (S.view !== 'after' || !A()) return;
  for (const c of pendingCounts()) {
    const at = screenAt(c.x, c.y);
    writeCount(ctx, String(c.n), at.x, at.y);
  }
  clearCounts();
}
