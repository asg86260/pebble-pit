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
import { P, DPS_BIN_S, DPS_HEAP_W, DPS_HEAP_H, DPS_ROW_H, DPS_BAR_W, DPS_EASE, DPS_HEAD,
         DPS_COL_S, DPS_COL_W, DPS_LINE_K, DPS_DASH, DPS_LABEL_GAP } from '../config.js';
import { now } from '../clock.js';
import { held } from '../reset.js';
import { msg } from '../lang.js';
import { fmt } from '../words.js';
import { raw } from '../ink.js';
import { crusherRect } from '../deep/place.js';
import { meanTo, totalDps, totalSeries, breakPace, sources } from '../deep/dps.js';
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
  // the tone halfway between the tip's ink and its paper
  const rgb = v => (v.match(/[\d.]+/g) || [0, 0, 0]).slice(0, 3).map(Number);
  const a = rgb(cs.color), b = rgb(cs.backgroundColor);
  const mid = `rgb(${a.map((x, i) => Math.round((x + b[i]) / 2)).join(', ')})`;
  return { ink: cs.color, mid, font: `${cs.fontSize} ${cs.fontFamily}`, track: cs.letterSpacing,
           upper: cs.textTransform === 'uppercase' };
}

function draw() {
  const c = cellPx(), ty = typeOf();
  const HW = DPS_HEAP_W * c, HH = DPS_HEAP_H * c, RH = DPS_ROW_H * c;
  // The heap's columns: each the mean of DPS_COL_S finished seconds. The
  // newest finished one comes in from past the right edge while the next
  // fills, so the heap slides on, a column never changes once drawn, and none
  // pops on.
  const per = Math.max(1, Math.round(DPS_COL_S / DPS_BIN_S)), colW = DPS_COL_W * c;
  const tp = now() / 1000 / DPS_BIN_S / per, p0 = Math.floor(tp), fp = tp - p0;
  const cols = [];
  for (let j = 0; j <= Math.ceil(HW / colW) + 1; j++) {
    const p = p0 - 1 - j;
    cols.push({ x: HW - (j + fp) * colW, v: p < 0 ? 0 : meanTo(totalSeries(), (p + 1) * per - 1, per) });
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
  const gap = DPS_LABEL_GAP * c;
  const W = Math.max(HW + gap + labelW, rows.length ? nameW + 2 * c + barW + 2 * c + numW : 0);
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

  // The heap on its baseline, its columns' tops eased against the peak so a
  // new high lifts the heap rather than jumps it.
  const pace = breakPace();
  const top = ease('heap', Math.max(1, pace, ...cols.map(k => k.v)) * DPS_HEAD);
  const lw = Math.max(1, Math.round(c * DPS_LINE_K)), floor = HH - lw;
  const yOf = v => floor - (v / top) * floor;
  g.save();
  g.beginPath(); g.rect(0, 0, HW, HH); g.clip();
  // One skyline filled once: columns at a fractional place filled one by
  // one leave a hairline of paper where each meets the next.
  g.beginPath();
  g.moveTo(cols[0].x + colW, floor);
  for (const k of cols) {
    const y = k.v > 0 ? Math.round(yOf(k.v)) : floor;
    g.lineTo(k.x + colW, y); g.lineTo(k.x, y);
  }
  g.lineTo(cols[cols.length - 1].x, floor);
  g.closePath();
  g.fill();
  g.fillRect(0, floor, HW, lw);
  // The pace that breaks the stage: one dashed rule over it all, in the tone
  // halfway between ink and paper, which reads on the heap and off it.
  if (pace > 0) {
    g.fillStyle = raw(ty.mid);
    const y = Math.round(Math.max(0, Math.min(floor - lw, yOf(pace) - lw / 2)));
    for (let x = 0; x < HW; x += (DPS_DASH + 1) * c) g.fillRect(x, y, DPS_DASH * c, lw);
    g.fillStyle = raw(ty.ink);
  }
  g.restore();
  g.textAlign = 'left';
  g.fillText(label, HW + gap, HH / 2);
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
