// MOCK the-furnace-dps-graph: a graph of the party's damage a second in the
// furnace's hover (the crusher, deep/place.js), never merged. Picked by
// `globalThis.__furnaceGraphMock`; every shape is the last minute as a filled
// heap with a dotted rule at the pace that breaks the stage inside one window:
//   'c' the heap and the total beside it (round 1's pick)
//   'd' the heap stacked by fighter, a fill a fighter, a key under it
//   'e' the heap as the total, a row a fighter under it: a bar and its dps,
//       the highest on top
//   'f' the heap as the total, a small sparkline a fighter under it
// Unset, the furnace has no hover, as in the game.
//
// The history is the one door every hit goes through (`strike` in
// deep/serpent.js hands its `done`, its weapon and its striker to `feed`),
// bucketed on the game clock so `__fast` fills it as play does. A hit with a
// striker is that fighter's; a bleed's tick names only its weapon, so it is
// the class's whose weapon it is; anything else (the click) is "you".
// Nothing here touches the page at load: the tip's seating is handed over by
// input.js (`wireFurnaceMock`).

import { S } from '../state.js';
import { P, FURNACE_DPS_BIN_S, FURNACE_DPS_SPAN_S, FURNACE_DPS_NOW_S,
         FURNACE_DPS_W, FURNACE_DPS_H, FURNACE_DPS_EASE, FURNACE_DPS_SMOOTH_S, SERPENT_PHASES,
         FURNACE_DPS_ROW_H, FURNACE_DPS_ROW_W, FURNACE_DPS_SPARK_H } from '../config.js';
import { CLASSES } from '../config/classes.js';
import { now } from '../clock.js';
import { held } from '../reset.js';
import { msg } from '../lang.js';
import { fmt } from '../words.js';
import { depthAt } from './depth.js';
import { windowS } from './meals.js';
import { crusherRect } from './place.js';
import { stationById, classOf } from './party.js';
import { raw } from '../ink.js';

const N = Math.round(FURNACE_DPS_SPAN_S / FURNACE_DPS_BIN_S) + 2;
const SMOOTH = Math.max(1, Math.round(FURNACE_DPS_SMOOTH_S / FURNACE_DPS_BIN_S));
const NOW_BINS = Math.round(FURNACE_DPS_NOW_S / FURNACE_DPS_BIN_S);
const make = () => ({ sums: new Float64Array(N), stamps: new Int32Array(N).fill(-1) });
const total = make();
const bySource = new Map();   // the key a striker is known by -> its buckets
const eased = { heap: 0, rows: 0 };   // the graphs' eased tops, in damage a second
const rowY = new Map();       // option E: each row's place and how far it has faded in
let lastWall = 0;             // held: the wall clock of the last draw, for the ease
held('furnace-dps-mock', () => {
  total.sums.fill(0); total.stamps.fill(-1); bySource.clear(); rowY.clear();
  eased.heap = eased.rows = 0; lastWall = 0;
  globalThis.__furnaceGraphMock = undefined;
});

const binOf = t => Math.floor(t / 1000 / FURNACE_DPS_BIN_S);
const put = (s, k, done) => { const i = k % N; if (s.stamps[i] !== k) { s.stamps[i] = k; s.sums[i] = 0; } s.sums[i] += done; };

// Whose a hit is: the fighter's station, else the class whose weapon ticked,
// else the hand.
const HIT_OF = () => Object.fromEntries(Object.entries(CLASSES).filter(([, c]) => c.hit).map(([k, c]) => [c.hit, k]));
let hitOf = null;             // cache: weapon -> class, read once off the table
const sourceOf = (weapon, by) => {
  if (by && by.station) return `st:${by.station}`;
  hitOf ||= HIT_OF();
  return hitOf[weapon] ? `cls:${hitOf[weapon]}` : 'you';
};

// A hit's damage into its second's bucket, the total's and its striker's.
export function feed(done, weapon, by) {
  const k = binOf(now());
  put(total, k, done);
  const key = sourceOf(weapon, by);
  let s = bySource.get(key);
  if (!s) bySource.set(key, s = make());
  put(s, k, done);
}

// The rate of bucket `k`, damage a second; nought for a second nothing landed in.
const rateAt = (s, k) => (k >= 0 && s.stamps[k % N] === k ? s.sums[k % N] / FURNACE_DPS_BIN_S : 0);
// The mean over `n` whole buckets ending at bucket `k`.
const meanTo = (s, k, n) => { let v = 0; for (let j = 0; j < n; j++) v += rateAt(s, k - j); return v / n; };
const nowOf = s => meanTo(s, binOf(now()) - 1, NOW_BINS);

// The number beside the graph: the mean over the last whole seconds.
export const dpsNow = () => nowOf(total);

// The pace that opens the wound to its depth inside one window: the dotted rule.
const breakPace = () => (S.serpentStage < SERPENT_PHASES ? depthAt(S.serpentStage) / windowS() : 0);

// The fighters with a hit in the minute shown, in the party's slot order,
// then a class's ticks, then the hand.
function sources() {
  const k0 = binOf(now()), slot = key => {
    if (key === 'you') return 1e6;
    if (key.startsWith('cls:')) return 1e5;
    const i = S.stations.findIndex(st => `st:${st.id}` === key);
    return i < 0 ? 1e4 : i;
  };
  const live = [...bySource].filter(([, s]) => { for (let j = 1; j < N - 1; j++) if (rateAt(s, k0 - j) > 0) return true; return false; });
  return live.sort((a, b) => slot(a[0]) - slot(b[0])).map(([key, s]) => ({ key, s, name: nameOf(key), now: nowOf(s) }));
}
function nameOf(key) {
  if (key === 'you') return msg('hover-furnace-you');
  if (key.startsWith('cls:')) return CLASSES[key.slice(4)]?.name || '';
  const st = stationById(key.slice(3));
  return (st && classOf(st)?.name) || '';
}

// --- the tip --------------------------------------------------------------------

let wired = null;       // page: input.js's tip seating, handed over once at load
let canvas = null;      // page: the graph's canvas, worn in front of the tip's words
let looping = false;    // page: whether the redraw loop is running
export const wireFurnaceMock = w => { wired = w; };

const option = () => globalThis.__furnaceGraphMock;
const cellPx = () => Math.max(2, Math.round(P * S.zoomShow));
const said = () => msg('hover-furnace-dps', { n: fmt(dpsNow()) });
// C wears the total as the tip's words; the others draw every word in the
// canvas, rows and all, so the tip's own words are none.
const inCanvas = () => option() !== 'c';

// Over the furnace in the deep, with a shape picked: the tip's words, where it
// stands (over the furnace's top, in world pixels) and the graph.
export function furnaceMockSays(x, y) {
  if (!option() || S.view !== 'deep' || !S.snatched) return null;
  const c = crusherRect();
  if (x < c.x || x > c.x + c.w || y < c.y || y > c.y + c.h) return null;
  return { text: inCanvas() ? '⁠' : said(), at: { x: c.x + c.w / 2, y: c.y }, lead: graph() };
}

function graph() {
  // A tip newly up stands its rows in their places; only a change while it
  // is up glides.
  if (!canvas?.isConnected) rowY.clear();
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.style.display = 'inline-block';
  }
  // The tip's words after the canvas start with a space; with none to say,
  // the space is taken back so the padding stays even.
  canvas.style.verticalAlign = inCanvas() ? 'top' : 'middle';
  canvas.style.marginRight = inCanvas() ? '-1ch' : '0';
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
  if (words && !inCanvas()) words.nodeValue = ` ${said()}`;
  requestAnimationFrame(loop);
}

// --- drawing --------------------------------------------------------------------

// A fighter's fill, in whole cells, so stacked bands tell apart in one ink:
// solid, checked, ruled, hatched, posts, dotted. Read at (cell x, cell y).
const FILLS = [
  () => true,
  (x, y) => (x + y) % 2 === 0,
  (x, y) => y % 2 === 0,
  (x, y) => (x - y + 300) % 3 === 0,
  x => x % 2 === 0,
  (x, y) => x % 2 === 0 && y % 2 === 0,
];
const fillOf = (rows, key) => (key === 'you' ? FILLS.length - 1 : rows.findIndex(r => r.key === key) % (FILLS.length - 1));
const tiles = new Map();      // cache: a fill's tile, keyed by fill, cell and ink
function tileOf(f, c, ink) {
  const id = `${f}|${c}|${ink}`;
  if (tiles.has(id)) return tiles.get(id);
  const t = document.createElement('canvas'), n = 6;   // six cells: a whole period of every fill
  t.width = t.height = n * c;
  const g = t.getContext('2d');
  g.fillStyle = raw(ink);
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (FILLS[f](x, y)) g.fillRect(x * c, y * c, c, c);
  tiles.set(id, t);
  return t;
}
// The fill as a pattern riding with the data: `ox` the slide, so a band's
// cells move with its seconds rather than standing still under them.
function patternOf(g, f, c, ink, ox) {
  const p = g.createPattern(tileOf(f, c, ink), 'repeat');
  p.setTransform(new DOMMatrix().translate(ox, 0));
  return p;
}

// The tip's own type, ink and case, so the canvas's words read as the tip's.
function typeOf() {
  const cs = getComputedStyle(document.getElementById('tip'));
  return { ink: cs.color, paper: cs.backgroundColor, font: `${cs.fontSize} ${cs.fontFamily}`, track: cs.letterSpacing,
           upper: cs.textTransform === 'uppercase' };
}

function draw() {
  const c = cellPx(), opt = option(), ty = typeOf();
  const HW = FURNACE_DPS_W * c, HH = FURNACE_DPS_H * c;
  const t = now() / 1000 / FURNACE_DPS_BIN_S, k0 = Math.floor(t), frac = t - k0;
  // The newest whole second comes in from past the right edge as the next
  // one fills, so the line slides on smoothly and its end never pops on. Each
  // point is the mean of the seconds up to it only, so a point already drawn
  // never changes when a new second lands.
  const shown = N - 2, dx = HW / (shown - 2);
  const xs = [], at = [];
  for (let j = 0; j <= shown; j++) { xs.push(HW + dx - (j + frac) * dx); at.push(k0 - 1 - j); }
  const line = s => at.map(k => meanTo(s, k, SMOOTH));
  const heap = line(total);
  const rows = opt === 'c' ? [] : sources();
  const say = s => (ty.upper ? s.toUpperCase() : s);

  // Sized to what it holds: the heap and the total beside it, then the rows.
  const dpr = window.devicePixelRatio || 1;
  const m = canvas.getContext('2d');
  m.font = ty.font; m.letterSpacing = ty.track;
  const label = say(said()), labelW = inCanvas() ? Math.ceil(m.measureText(label).width) : 0;
  const RH = FURNACE_DPS_ROW_H * c, nameW = Math.ceil(Math.max(0, ...rows.map(r => m.measureText(say(r.name)).width)));
  const numW = Math.ceil(Math.max(0, ...rows.map(r => m.measureText(fmt(r.now)).width)));
  const visW = opt === 'd' ? 4 * c : FURNACE_DPS_ROW_W * c;
  const rowsW = rows.length ? (opt === 'd' ? visW + 2 * c + nameW + 2 * c + numW : nameW + 2 * c + visW + 2 * c + numW) : 0;
  const W = Math.max(HW + (labelW ? 2 * c + labelW : 0), rowsW);
  const H = HH + (rows.length ? c + rows.length * RH : 0);
  if (canvas.width !== Math.round(W * dpr) || canvas.height !== Math.round(H * dpr)) {
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    canvas.style.width = `${W}px`; canvas.style.height = `${H}px`;
  }
  const g = canvas.getContext('2d');
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.clearRect(0, 0, W, H);
  g.fillStyle = g.strokeStyle = raw(ty.ink);   // the tip's ink as it is, past the canvas's dark map
  g.font = ty.font; g.letterSpacing = ty.track; g.textBaseline = 'middle';

  // The tops ease to their peaks, so a new high lifts the graph, not jumps it.
  const pace = breakPace();
  const wall = performance.now(), dt = lastWall ? Math.min(0.25, (wall - lastWall) / 1000) : 1;
  lastWall = wall;
  const ease = (key, peak) => (eased[key] = eased[key] ? eased[key] + (peak - eased[key]) * Math.min(1, dt * FURNACE_DPS_EASE) : peak);
  const top = ease('heap', Math.max(1, pace, ...heap) * 1.15);
  const yOf = v => HH - (v / top) * HH;

  // The heap: stacked a band a fighter (D), or one ink (the rest).
  g.save();
  g.beginPath(); g.rect(0, 0, HW, HH); g.clip();
  if (opt === 'd' && rows.length) {
    const ox = -((k0 + frac) * dx) % (6 * c);
    let under = xs.map(() => 0);
    for (const r of rows) {
      const v = line(r.s), over = under.map((u, i) => u + v[i]);
      g.beginPath();
      xs.forEach((x, i) => (i ? g.lineTo(x, yOf(over[i])) : g.moveTo(x, yOf(over[i]))));
      for (let i = xs.length - 1; i >= 0; i--) g.lineTo(xs[i], yOf(under[i]));
      g.closePath();
      g.fillStyle = patternOf(g, fillOf(rows, r.key), c, ty.ink, ox);
      g.fill();
      // a hairline of paper along its top, so two fills meeting read as two
      g.beginPath();
      xs.forEach((x, i) => (i ? g.lineTo(x, yOf(over[i])) : g.moveTo(x, yOf(over[i]))));
      g.strokeStyle = raw(ty.paper); g.lineWidth = 1; g.stroke();
      under = over;
    }
    g.fillStyle = raw(ty.ink);
  } else {
    g.beginPath();
    xs.forEach((x, i) => (i ? g.lineTo(x, yOf(heap[i])) : g.moveTo(x, yOf(heap[i]))));
    g.lineTo(xs[xs.length - 1], HH); g.lineTo(xs[0], HH); g.closePath();
    g.fill();
  }
  if (pace > 0) {
    // The rule's cells: ink on the paper, paper on the heap.
    g.globalCompositeOperation = 'xor';
    const y = Math.max(0, Math.min(HH - c, yOf(pace) - c / 2));
    for (let x = 0; x < HW; x += 2 * c) g.fillRect(x, y, c, c);
    g.globalCompositeOperation = 'source-over';
  }
  g.restore();
  if (labelW) g.fillText(label, HW + 2 * c, HH / 2);
  if (!rows.length) return;

  const y0 = HH + c;
  if (opt === 'd') {
    // The key, top to bottom as the bands stand: a swatch, the name, its dps.
    [...rows].reverse().forEach((r, i) => {
      const y = y0 + i * RH, mid = y + RH / 2;
      g.fillStyle = patternOf(g, fillOf(rows, r.key), c, ty.ink, 0);
      g.save(); g.translate(0, Math.round(mid - 1.5 * c)); g.fillRect(0, 0, visW, 3 * c); g.restore();
      g.fillStyle = raw(ty.ink);
      g.textAlign = 'left'; g.fillText(say(r.name), visW + 2 * c, mid);
      g.textAlign = 'right'; g.fillText(fmt(r.now), W, mid);
    });
  } else if (opt === 'e') {
    // A bar a fighter, the highest on top. A row changing places fades out
    // where it was and back in where it goes, once its new place is clear:
    // a glide would run two rows' words through each other.
    const most = ease('rows', Math.max(1, ...rows.map(r => r.now)));
    // Ranked by whole cells of bar, ties kept where they stood: two fighters
    // a point apart do not trade places every second.
    const cellsOf = r => Math.round((r.now / most) * FURNACE_DPS_ROW_W);
    const slotOf = r => rowY.get(r.key)?.slot ?? 0;
    const order = [...rows].sort((a, b) => cellsOf(b) - cellsOf(a) || slotOf(a) - slotOf(b));
    const fade = Math.min(1, dt * FURNACE_DPS_EASE * 3);
    order.forEach((r, i) => {
      const was = rowY.get(r.key);
      if (!was) { rowY.set(r.key, { slot: i, a: 1 }); return; }
      if (was.slot === i) { was.a = Math.min(1, was.a + fade); return; }
      was.a = Math.max(0, was.a - fade);
      const taken = [...rowY].some(([k, o]) => k !== r.key && o.slot === i && o.a > 0);
      if (was.a === 0 && !taken) was.slot = i;
    });
    for (const r of rows) {
      const { slot, a } = rowY.get(r.key);
      if (a <= 0) continue;
      g.globalAlpha = a;
      const y = y0 + slot * RH, mid = y + RH / 2;
      g.textAlign = 'left'; g.fillText(say(r.name), 0, mid);
      const cells = (r.now / most) * FURNACE_DPS_ROW_W, whole = Math.floor(cells), part = cells - whole;
      const bx = nameW + 2 * c, by = Math.round(mid - c);
      if (whole) g.fillRect(bx, by, whole * c, 2 * c);
      // The last cell fades in as the bar reaches it, never pops on.
      if (part > 0.02) { g.globalAlpha = part * a; g.fillRect(bx + whole * c, by, c, 2 * c); g.globalAlpha = a; }
      g.textAlign = 'right'; g.fillText(fmt(r.now), W, mid);
      g.globalAlpha = 1;
    }
  } else if (opt === 'f') {
    // A small line a fighter, all on one scale so they compare by eye.
    const SW = FURNACE_DPS_ROW_W * c, SH = FURNACE_DPS_SPARK_H * c, sdx = SW / (shown - 2);
    const lines = rows.map(r => line(r.s));
    const most = ease('rows', Math.max(1, ...lines.flat()) * 1.1);
    rows.forEach((r, i) => {
      const y = y0 + i * RH, mid = y + RH / 2;
      g.textAlign = 'left'; g.fillText(say(r.name), 0, mid);
      const sx = nameW + 2 * c, sy = Math.round(mid - SH / 2);
      g.save(); g.beginPath(); g.rect(sx, sy - c, SW, SH + 2 * c); g.clip();
      g.beginPath();
      lines[i].forEach((v, j) => {
        const x = sx + SW + sdx - (j + frac) * sdx, yy = sy + SH - (v / most) * SH;
        j ? g.lineTo(x, yy) : g.moveTo(x, yy);
      });
      g.lineWidth = Math.max(2, Math.round(c / 2)); g.lineJoin = 'round'; g.stroke();
      g.restore();
      // its nought: a dotted floor
      for (let x = 0; x < SW; x += 2 * c) g.fillRect(sx + x, sy + SH, c, 1);
      g.textAlign = 'right'; g.fillText(fmt(r.now), W, mid);
    });
  }
  g.textAlign = 'left';
}

// The scene's hover: the tip stood over the furnace as the pointer would.
globalThis.__furnaceMockHover = () => {
  const c = crusherRect();
  const say = furnaceMockSays(c.x + c.w / 2, c.y + c.h / 2);
  if (say) seat(say);
  return !!say;
};
