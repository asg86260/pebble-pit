// MOCK the-furnace-dps-graph: a graph of the party's damage a second in the
// furnace's hover (the crusher, deep/place.js), never merged. Three shapes,
// picked by `globalThis.__furnaceGraphMock`: 'a' a sparkline, 'b' stepped
// bars, 'c' a filled heap with a dotted rule at the pace that breaks the
// stage inside one window. Unset, the furnace has no hover, as in the game.
//
// The history is the one door every hit goes through (`strike` in
// deep/serpent.js hands its `done` to `feed`), bucketed on the game clock so
// `__fast` fills it as play does. Nothing here touches the page at load: the
// tip's seating is handed over by input.js (`wireFurnaceMock`).

import { S } from '../state.js';
import { P, FURNACE_DPS_BIN_S, FURNACE_DPS_SPAN_S, FURNACE_DPS_NOW_S, FURNACE_DPS_BAR_S,
         FURNACE_DPS_W, FURNACE_DPS_H, FURNACE_DPS_EASE, FURNACE_DPS_SMOOTH_S, SERPENT_PHASES } from '../config.js';
import { now } from '../clock.js';
import { held } from '../reset.js';
import { msg } from '../lang.js';
import { fmt } from '../words.js';
import { depthAt } from './depth.js';
import { windowS } from './meals.js';
import { crusherRect } from './place.js';
import { raw } from '../ink.js';

const N = Math.round(FURNACE_DPS_SPAN_S / FURNACE_DPS_BIN_S) + 2;
const sums = new Float64Array(N);
const stamps = new Int32Array(N).fill(-1);
let scale = 0;          // held: the graph's eased top, in damage a second
let lastWall = 0;       // held: the wall clock of the last draw, for the ease
held('furnace-dps-mock', () => {
  sums.fill(0); stamps.fill(-1); scale = 0; lastWall = 0;
  globalThis.__furnaceGraphMock = undefined;
});

const SMOOTH = Math.max(1, Math.round(FURNACE_DPS_SMOOTH_S / FURNACE_DPS_BIN_S));
const binOf = t => Math.floor(t / 1000 / FURNACE_DPS_BIN_S);

// A hit's damage into its second's bucket.
export function feed(done) {
  const k = binOf(now()), i = k % N;
  if (stamps[i] !== k) { stamps[i] = k; sums[i] = 0; }
  sums[i] += done;
}

// The rate of bucket `k`, damage a second; nought for a second nothing landed in.
const rateAt = k => (k >= 0 && stamps[k % N] === k ? sums[k % N] / FURNACE_DPS_BIN_S : 0);
// The mean over `n` whole buckets ending at bucket `k`.
const meanTo = (k, n) => { let s = 0; for (let j = 0; j < n; j++) s += rateAt(k - j); return s / n; };

// The number beside the graph: the mean over the last whole seconds.
export const dpsNow = () => meanTo(binOf(now()) - 1, Math.round(FURNACE_DPS_NOW_S / FURNACE_DPS_BIN_S));

// The pace that opens the wound to its depth inside one window: the dotted rule.
const breakPace = () => (S.serpentStage < SERPENT_PHASES ? depthAt(S.serpentStage) / windowS() : 0);

// --- the tip --------------------------------------------------------------------

let wired = null;       // page: input.js's tip seating, handed over once at load
let canvas = null;      // page: the graph's canvas, worn in front of the tip's words
let looping = false;    // page: whether the redraw loop is running
export const wireFurnaceMock = w => { wired = w; };

const option = () => globalThis.__furnaceGraphMock;
const cellPx = () => Math.max(2, Math.round(P * S.zoomShow));
const said = () => msg('hover-furnace-dps', { n: fmt(dpsNow()) });

// Over the furnace in the deep, with a shape picked: the tip's words, where it
// stands (over the furnace's top, in world pixels) and the graph.
export function furnaceMockSays(x, y) {
  if (!option() || S.view !== 'deep' || !S.snatched) return null;
  const c = crusherRect();
  if (x < c.x || x > c.x + c.w || y < c.y || y > c.y + c.h) return null;
  return { text: said(), at: { x: c.x + c.w / 2, y: c.y }, lead: graph() };
}

function graph() {
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.style.verticalAlign = 'middle';
    canvas.style.display = 'inline-block';
  }
  draw();
  if (!looping) { looping = true; requestAnimationFrame(loop); }
  return canvas;
}

// Seated over the furnace, centered, clear of its chimney.
export function seat(say) {
  if (!wired) return;
  const sp = wired.toScreen(say.at.x, say.at.y);
  wired.showTipAt(say.text, sp.x, sp.y, true, false, say.lead);
  const tip = document.getElementById('tip');
  wired.showTipAt(say.text, sp.x, sp.y - tip.offsetHeight - cellPx() * 2, true, false, say.lead);
}

// The line moves while the pointer stands still: redrawn every frame the tip
// is up, the number beside it with it.
function loop() {
  const tip = document.getElementById('tip');
  if (!canvas || !canvas.isConnected || tip.hidden || !option()) { looping = false; return; }
  draw();
  const words = canvas.nextSibling;
  if (words) words.nodeValue = ` ${said()}`;
  requestAnimationFrame(loop);
}

// The page's own ink, read off the tip so either theme is right.
const inkNow = () => getComputedStyle(document.getElementById('tip')).color;

function draw() {
  const c = cellPx(), W = FURNACE_DPS_W * c, H = FURNACE_DPS_H * c;
  const dpr = window.devicePixelRatio || 1;
  if (canvas.width !== Math.round(W * dpr) || canvas.height !== Math.round(H * dpr)) {
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    canvas.style.width = `${W}px`; canvas.style.height = `${H}px`;
  }
  const g = canvas.getContext('2d');
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.clearRect(0, 0, W, H);
  g.fillStyle = g.strokeStyle = raw(inkNow());   // the tip's ink as it is, past the canvas's dark map

  const opt = option();
  const t = now() / 1000 / FURNACE_DPS_BIN_S, k0 = Math.floor(t), frac = t - k0;
  // The newest whole second comes in from past the right edge as the next
  // one fills, so the line slides on smoothly and its end never pops on. Each
  // point is the mean of the seconds up to it only, so a point already drawn
  // never changes when a new second lands.
  const shown = N - 2, dx = W / (shown - 2);
  const pts = [];
  if (opt !== 'b') for (let j = 0; j <= shown; j++) {
    const k = k0 - 1 - j;
    pts.push({ x: W + dx - (j + frac) * dx, v: meanTo(k, SMOOTH) });
  }
  const bars = [];
  if (opt === 'b') {
    const per = Math.round(FURNACE_DPS_BAR_S / FURNACE_DPS_BIN_S), tb = t / per, b0 = Math.floor(tb), fb = tb - b0;
    const step = 2 * c, count = Math.ceil(W / step) + 1;
    for (let j = 0; j < count; j++) {
      const b = b0 - j, from = b * per, to = Math.min(from + per, k0);   // the newest bar is its seconds so far
      let s = 0, n = 0;
      for (let k = from; k < to; k++) { s += rateAt(k); n++; }
      // The newest bar slides in from past the right edge as its seconds fill.
      bars.push({ x: W + c - (j + fb) * step, v: n ? s / n : 0 });
    }
  }
  const pace = opt === 'c' ? breakPace() : 0;
  let peak = Math.max(1, pace, ...pts.map(p => p.v), ...bars.map(b => b.v)) * 1.15;
  const wall = performance.now(), dt = lastWall ? Math.min(0.25, (wall - lastWall) / 1000) : 1;
  lastWall = wall;
  scale = scale ? scale + (peak - scale) * Math.min(1, dt * FURNACE_DPS_EASE) : peak;
  const yOf = v => H - (v / scale) * H;

  if (opt === 'a' || opt === 'c') {
    g.beginPath();
    pts.forEach((p, i) => (i ? g.lineTo(p.x, yOf(p.v)) : g.moveTo(p.x, yOf(p.v))));
    if (opt === 'a') {
      g.lineWidth = c / 2 >= 2 ? Math.round(c / 2) : 2;
      g.lineJoin = 'round';
      g.stroke();
      // The live end: one cell, where the number beside it is read.
      const xq = W - c / 2, i = Math.max(1, pts.findIndex(p => p.x <= xq));
      const a = pts[i - 1], b = pts[i], u = (xq - b.x) / (a.x - b.x);
      g.fillRect(W - c, yOf(b.v + (a.v - b.v) * u) - c / 2, c, c);
    } else {
      g.lineTo(pts[pts.length - 1].x, H); g.lineTo(pts[0].x, H); g.closePath();
      g.fill();
      if (pace > 0) {
        // The rule's cells: ink on the paper, paper on the heap.
        g.globalCompositeOperation = 'xor';
        const y = Math.max(0, Math.min(H - c, yOf(pace) - c / 2));
        for (let x = 0; x < W; x += 2 * c) g.fillRect(x, y, c, c);
        g.globalCompositeOperation = 'source-over';
      }
    }
  } else if (opt === 'b') {
    for (const b of bars) {
      const h = (b.v / scale) * FURNACE_DPS_H, whole = Math.floor(h), part = h - whole;
      if (whole) g.fillRect(b.x, H - whole * c, c, whole * c);
      // The top cell fades up as the bar climbs to it, never pops on.
      if (part > 0.02) { g.globalAlpha = part; g.fillRect(b.x, H - (whole + 1) * c, c, c); g.globalAlpha = 1; }
    }
  }
  // The floor: a dotted row of cells, the graph's nought.
  if (opt !== 'c') for (let x = 0; x < W; x += 2 * c) g.fillRect(x, H - Math.max(1, c / 3), c, Math.max(1, c / 3));
}

// The scene's hover: the tip stood over the furnace as the pointer would.
globalThis.__furnaceMockHover = () => {
  const c = crusherRect();
  const say = furnaceMockSays(c.x + c.w / 2, c.y + c.h / 2);
  if (say) seat(say);
  return !!say;
};
