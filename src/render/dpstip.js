// The furnace's hover: the fight's damage a second (deep/dps.js), drawn on a
// canvas worn in the shared tip (board.js `showTipAt`'s `lead`). The last
// minute as a filled heap with a dotted rule at the pace that breaks the
// stage inside one window, the total beside it, and under it a row a fighter:
// the name, a bar and its dps, the highest on top (the owner's pick of three,
// 2026-10-31; DESIGN.md, "The furnace's dps").
//
// The canvas is redrawn every frame the tip is up, so the heap slides on and
// the numbers move while the pointer stands still. Its words are drawn in the
// tip's own type, ink and case, read off the tip, so either page reads right.
// REVIEW the-furnace-dps-graph-built

import { S } from '../state.js';
import { P, DPS_BIN_S, DPS_HEAP_W, DPS_HEAP_H, DPS_ROW_H, DPS_BAR_W, DPS_EASE, DPS_HEAD } from '../config.js';
import { now } from '../clock.js';
import { held } from '../reset.js';
import { msg } from '../lang.js';
import { fmt } from '../words.js';
import { raw } from '../ink.js';
import { crusherRect } from '../deep/place.js';
import { BINS, SMOOTH_BINS, meanTo, totalDps, totalSeries, breakPace, sources } from '../deep/dps.js';
import { showTipAt } from '../board.js';
import { toScreen } from '../world.js';

const eased = { heap: 0, rows: 0 };   // the tops the heap and the bars are drawn against, eased
const rowAt = new Map();              // a row's key -> { slot, a }: its place, and how far it has faded in
let lastWall = 0;                     // held: the wall clock of the last draw, for the eases
held('dps-tip', () => { eased.heap = eased.rows = 0; rowAt.clear(); lastWall = 0; });

let canvas = null;      // page: the canvas the tip wears
let looping = false;    // page: whether the redraw runs

const cellPx = () => Math.max(2, Math.round(P * S.zoomShow));
const tipEl = () => document.getElementById('tip');

// Over the furnace in the deep: the crusher's rect, once it stands.
export const overFurnace = (x, y) => {
  if (S.view !== 'deep' || !S.snatched) return false;
  const c = crusherRect();
  return x >= c.x && x <= c.x + c.w && y >= c.y && y <= c.y + c.h;
};

// The tip stood over the furnace's top, centered, clear of its chimney.
export function showFurnaceTip() {
  // A tip newly up stands its rows in their places; only a change while it
  // is up fades.
  if (!canvas?.isConnected || tipEl().hidden) rowAt.clear();
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.className = 'dpsgraph';
  }
  draw();
  const c = crusherRect(), sp = toScreen(c.x + c.w / 2, c.y);
  showTipAt('', sp.x, sp.y, true, false, canvas);
  showTipAt('', sp.x, sp.y - tipEl().offsetHeight - cellPx() * 2, true, false, canvas);
  if (!looping) { looping = true; requestAnimationFrame(loop); }
}

function loop() {
  if (!canvas || !canvas.isConnected || tipEl().hidden) { looping = false; return; }
  draw();
  requestAnimationFrame(loop);
}

function typeOf() {
  const cs = getComputedStyle(tipEl());
  return { ink: cs.color, font: `${cs.fontSize} ${cs.fontFamily}`, track: cs.letterSpacing,
           upper: cs.textTransform === 'uppercase' };
}

function draw() {
  const c = cellPx(), ty = typeOf();
  const HW = DPS_HEAP_W * c, HH = DPS_HEAP_H * c, RH = DPS_ROW_H * c;
  const t = now() / 1000 / DPS_BIN_S, k0 = Math.floor(t), frac = t - k0;
  // The newest whole second comes in from past the right edge as the next
  // one fills, so the heap slides on and its end never pops on. A point is
  // the mean of the seconds up to it only, so a point drawn never changes.
  const shown = BINS - 2, dx = HW / (shown - 2);
  const xs = [], heap = [];
  for (let j = 0; j <= shown; j++) {
    xs.push(HW + dx - (j + frac) * dx);
    heap.push(meanTo(totalSeries(), k0 - 1 - j, SMOOTH_BINS));
  }
  const rows = sources();
  const say = s => (ty.upper ? s.toUpperCase() : s);

  // Sized to what it holds: the heap and the total beside it, the rows under.
  const g = canvas.getContext('2d');
  g.font = ty.font; g.letterSpacing = ty.track;
  const label = say(msg('hover-furnace-dps', { n: fmt(totalDps()) }));
  const labelW = Math.ceil(g.measureText(label).width);
  const nameW = Math.ceil(Math.max(0, ...rows.map(r => g.measureText(say(r.name)).width)));
  const numW = Math.ceil(Math.max(0, ...rows.map(r => g.measureText(fmt(r.dps)).width)));
  const barW = DPS_BAR_W * c;
  const W = Math.max(HW + 2 * c + labelW, rows.length ? nameW + 2 * c + barW + 2 * c + numW : 0);
  const H = HH + (rows.length ? c + rows.length * RH : 0);
  const dpr = window.devicePixelRatio || 1;
  if (canvas.width !== Math.round(W * dpr) || canvas.height !== Math.round(H * dpr)) {
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    canvas.style.width = `${W}px`; canvas.style.height = `${H}px`;
  }
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.clearRect(0, 0, W, H);
  // The tip's ink as it is: the canvas's dark map would turn it again.
  g.fillStyle = raw(ty.ink);
  g.font = ty.font; g.letterSpacing = ty.track; g.textBaseline = 'middle';

  const wall = performance.now(), dt = lastWall ? Math.min(0.25, (wall - lastWall) / 1000) : 1;
  lastWall = wall;
  const ease = (key, peak) => (eased[key] = eased[key] ? eased[key] + (peak - eased[key]) * Math.min(1, dt * DPS_EASE) : peak);

  // The heap, and the rule's cells over it: ink on the paper, paper on the heap.
  const pace = breakPace();
  const top = ease('heap', Math.max(1, pace, ...heap) * DPS_HEAD);
  const yOf = v => HH - (v / top) * HH;
  g.save();
  g.beginPath(); g.rect(0, 0, HW, HH); g.clip();
  g.beginPath();
  xs.forEach((x, i) => (i ? g.lineTo(x, yOf(heap[i])) : g.moveTo(x, yOf(heap[i]))));
  g.lineTo(xs[xs.length - 1], HH); g.lineTo(xs[0], HH); g.closePath();
  g.fill();
  if (pace > 0) {
    g.globalCompositeOperation = 'xor';
    const y = Math.max(0, Math.min(HH - c, yOf(pace) - c / 2));
    for (let x = 0; x < HW; x += 2 * c) g.fillRect(x, y, c, c);
    g.globalCompositeOperation = 'source-over';
  }
  g.restore();
  g.textAlign = 'left';
  g.fillText(label, HW + 2 * c, HH / 2);
  if (!rows.length) return;

  // The rows, ranked by whole cells of bar, ties kept where they stood: two
  // fighters a point apart do not trade places every second. A row changing
  // places fades out where it was and back in where it goes once that place
  // is clear; a glide would run two rows' words through each other.
  const most = ease('rows', Math.max(1, ...rows.map(r => r.dps)));
  const cellsOf = r => Math.round((r.dps / most) * DPS_BAR_W);
  const slotOf = r => rowAt.get(r.key)?.slot ?? 0;
  const order = [...rows].sort((a, b) => cellsOf(b) - cellsOf(a) || slotOf(a) - slotOf(b));
  const fade = Math.min(1, dt * DPS_EASE * 3);
  order.forEach((r, i) => {
    const was = rowAt.get(r.key);
    if (!was) { rowAt.set(r.key, { slot: i, a: 1 }); return; }
    if (was.slot === i) { was.a = Math.min(1, was.a + fade); return; }
    was.a = Math.max(0, was.a - fade);
    const taken = [...rowAt].some(([k, o]) => k !== r.key && o.slot === i && o.a > 0);
    if (was.a === 0 && !taken) was.slot = i;
  });
  const y0 = HH + c, bx = nameW + 2 * c;
  for (const r of rows) {
    const { slot, a } = rowAt.get(r.key);
    if (!(a > 0)) continue;
    const mid = y0 + slot * RH + RH / 2, by = Math.round(mid - c);
    g.globalAlpha = a;
    g.textAlign = 'left'; g.fillText(say(r.name), 0, mid);
    const cells = (r.dps / most) * DPS_BAR_W, whole = Math.floor(cells), part = cells - whole;
    if (whole) g.fillRect(bx, by, whole * c, 2 * c);
    // The last cell fades in as the bar reaches it, never pops on.
    if (part > 0.02) { g.globalAlpha = part * a; g.fillRect(bx + whole * c, by, c, 2 * c); g.globalAlpha = a; }
    g.textAlign = 'right'; g.fillText(fmt(r.dps), W, mid);
  }
  g.globalAlpha = 1;
  g.textAlign = 'left';
}

// The rows as drawn, for the checks: name and number, top to bottom.
export const furnaceTipRows = () => [...rowAt].filter(([, o]) => o.a > 0).sort((a, b) => a[1].slot - b[1].slot).map(([key]) => key);
