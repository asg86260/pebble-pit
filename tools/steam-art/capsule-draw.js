// Direction A of the Steam capsule art, "the rock on its line": the one drawing
// both docs/mocks/steam-capsules-2026-10-12.html and tools/steam-art.mjs use.
// A classic script with no DOM beyond a canvas context, so the mock loads it by
// <script src> (works from file://) and the render script injects its text into
// a headless page. Everything is on the P=6-style cell grid, black and white
// with per-cell tone. state.bars draws the mock-only placeholder bar; the
// final files never do.
(function (root) {
const SIZES = [
  ['header', 920, 430, 'header capsule'],
  ['small', 462, 174, 'small capsule'],
  ['main', 1232, 706, 'main capsule'],
  ['vertical', 748, 896, 'vertical capsule'],
  ['capital', 600, 900, 'library capital'],
  ['hero', 3840, 1240, 'library hero'],
  ['logo', 1280, 720, 'library logo (transparent)']
];
const PAPER = '#f6f6f4', EARTH = '#efefec', HATCH = '#e1e1dd', LINE = '#141414';
const ROCK_RIND = ['#6f6f6f', '#7b7b7b', '#868686', '#747474'];
const ROCK_MANTLE = ['#2e2e2e', '#353535', '#3d3d3d', '#323232'];
const ROCK_CORE = ['#0f0f0f', '#151515', '#1b1b1b', '#121212'];
const HEAP = ['#5f5f5f', '#6a6a6a', '#767676', '#808080', '#8b8b8b'];
const STONE = ['#1c1c1c', '#2a2a2a', '#393939', '#474747', '#565656'];
const CLOUD = ['#d9d9d6', '#cfcfcc', '#c6c6c3'];
const ORE = ['#3f68d4', '#2f5fd0', '#2748a4', '#5b83e0'];
const CROP = ['#3aa957', '#2e9e4b', '#227b3a', '#57c074'];

const hash = (a, b, s = 0) => { let h = (a * 374761393 + b * 668265263 + s * 2147483647) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0); };
const pick = (arr, a, b, s) => arr[hash(a, b, s) % arr.length];
function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

const state = { bars: true, caps: true };

// A cell painter: everything is placed in cells of `c` pixels.
function cells(g, c) {
  return {
    c,
    at(x, y, col) { g.fillStyle = col; g.fillRect(Math.round(x) * c, Math.round(y) * c, c, c); },
    rect(x, y, w, h, col) { g.fillStyle = col; g.fillRect(Math.round(x) * c, Math.round(y) * c, Math.round(w) * c, Math.round(h) * c); }
  };
}

// ---------------------------------------------------------------- the letters
const FONT = {
  P: ['11110', '10001', '10001', '11110', '10000', '10000', '10000'],
  E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
  B: ['11110', '10001', '10001', '11110', '10001', '10001', '11110'],
  L: ['10000', '10000', '10000', '10000', '10000', '10000', '11111'],
  I: ['111', '010', '010', '010', '010', '010', '111'],
  T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
  ' ': ['000', '000', '000', '000', '000', '000', '000'],
  // lowercase on a 9-row box: two ascender rows, five x-height, two descender
  p: ['00000', '00000', '11110', '10001', '10001', '10001', '11110', '10000', '10000'],
  e: ['00000', '00000', '01110', '10001', '11111', '10000', '01111', '00000', '00000'],
  b: ['10000', '10000', '11110', '10001', '10001', '10001', '11110', '00000', '00000'],
  l: ['110', '010', '010', '010', '010', '010', '111', '000', '000'],
  i: ['010', '000', '110', '010', '010', '010', '111', '000', '000'],
  t: ['0100', '0100', '1110', '0100', '0100', '0100', '0011', '0000', '0000']
};
const word = s => state.caps ? s.toUpperCase() : s.toLowerCase();
const glyphRows = ch => FONT[ch] || FONT[' '];
const textW = s => [...s].reduce((n, ch, i) => n + glyphRows(ch)[0].length + (i ? 1 : 0), 0);
const textH = () => state.caps ? 7 : 9;
// plot(x, y) is called once per lit font cell, in font-cell units from the
// text's top-left.
function eachCell(s, plot) {
  let x = 0;
  [...s].forEach(ch => {
    const rows = glyphRows(ch);
    rows.forEach((r, y) => [...r].forEach((v, i) => { if (v === '1') plot(x + i, y); }));
    x += rows[0].length + 1;
  });
}
// The title as lines: one or two, in the current case.
const titleLines = two => two ? [word('pebble'), word('pit')] : [word('pebble pit')];

function solidTitle(g, lines, x0, y0, s, col, align = 'left', boxW = 0) {
  g.fillStyle = col;
  lines.forEach((ln, k) => {
    const w = textW(ln) * s;
    const ox = align === 'center' ? x0 + Math.round((boxW - w) / 2) : x0;
    const oy = y0 + k * (textH() + 2) * s;
    eachCell(ln, (x, y) => g.fillRect(ox + x * s, oy + y * s, s, s));
  });
}
function knockout(g, x, y, w, h, pad) { g.fillStyle = PAPER; g.fillRect(x - pad, y - pad, w + 2 * pad, h + 2 * pad); }
const titleBox = (lines, s) => ({ w: Math.max(...lines.map(textW)) * s, h: (lines.length * (textH() + 2) - 2) * s });

// A pebble on a 4x4 sub-grid: a rounded square, a lit corner, a tone of its own.
function pebble(g, x, y, s, seed) {
  const u = s / 4, tone = STONE[hash(x, y, seed) % STONE.length];
  const map = ['.##.', '####', '####', '.##.'];
  const lumpy = hash(y, x, seed + 7) % 4;   // some stones lose a corner more
  map.forEach((r, j) => [...r].forEach((v, i) => {
    if (v !== '#') return;
    if (lumpy === 0 && j === 2 && i === 3) return;
    g.fillStyle = (i === 1 && j === 1) ? '#8a8a8a' : tone;
    g.fillRect(x + i * u, y + j * u, u, u);
  }));
}
// The pebble face is the same letters with every stroke doubled sideways, so
// a line of stones reads as a stroke rather than a string of beads.
function boldCells(ln) {
  const out = new Set(); let x = 0;
  [...ln].forEach(ch => {
    const rows = glyphRows(ch);
    rows.forEach((r, y) => [...r].forEach((v, i) => { if (v === '1') { out.add((x + i) + ',' + y); out.add((x + i + 1) + ',' + y); } }));
    x += rows[0].length + 2;
  });
  return { cells: [...out].map(k => k.split(',').map(Number)), w: x - 2 };
}
const boldBox = (lines, s) => ({ w: Math.max(...lines.map(l => boldCells(l).w)) * s, h: (lines.length * (textH() + 2) - 2) * s });
function pebbleTitle(g, lines, x0, y0, s, seed, align = 'left', boxW = 0) {
  lines.forEach((ln, k) => {
    const { cells: cs, w } = boldCells(ln);
    const ox = align === 'center' ? x0 + Math.round((boxW - w * s) / 2) : x0;
    const oy = y0 + k * (textH() + 2) * s;
    cs.forEach(([x, y]) => pebble(g, ox + x * s, oy + y * s, s, seed + k));
  });
}

// ---------------------------------------------------------------- the yard's parts
function sky(g, W, H) { g.fillStyle = PAPER; g.fillRect(0, 0, W, H); }
function ground(p, cols, rows, gy, lineW) {
  for (let y = gy; y < rows; y++) for (let x = 0; x < cols; x++)
    p.at(x, y, (x + y) % 4 === 0 ? HATCH : EARTH);
}
function groundLine(g, W, gyPx, lw) { g.fillStyle = LINE; g.fillRect(0, gyPx - Math.floor(lw / 2), W, lw); }
function motes(p, cols, rowsTop, rowsBot, n, r) {
  for (let i = 0; i < n; i++) p.at(Math.floor(r() * cols), rowsTop + Math.floor(r() * (rowsBot - rowsTop)), r() < .5 ? '#bdbdbd' : '#d0d0d0');
}
function cloud(p, x, y, w, seed) {
  // a stepped bank: three bumps on a flat underside, a darker sole
  const r = rng(seed);
  const h = Math.max(3, Math.round(w / 5));
  for (let i = 0; i < w; i++) {
    const bump = Math.round(h * (0.55 + 0.45 * Math.abs(Math.sin((i / w) * Math.PI * (1.5 + r())))));
    const top = Math.round(h * Math.sin((i + .5) / w * Math.PI) * 0.6) + Math.min(bump, h);
    for (let j = 0; j < top; j++) p.at(x + i, y - j, j === 0 ? CLOUD[2] : pick(CLOUD, x + i, y - j, seed));
  }
}
function bird(p, x, y) { p.at(x, y, '#444'); p.at(x + 1, y + 1, '#444'); p.at(x + 2, y, '#444'); }
// A body: three cells square, white with a black skin; a hat if asked.
function body(g, c, x, y, hat) {
  const s = 3 * c, k = Math.max(1, Math.round(c / 3));
  g.fillStyle = LINE; g.fillRect(x * c, y * c, s, s);
  g.fillStyle = '#fff'; g.fillRect(x * c + k, y * c + k, s - 2 * k, s - 2 * k);
  if (hat) { g.fillStyle = LINE; g.fillRect(x * c, y * c, s, Math.max(k, Math.round(c * .7))); if (hat === 'brim') g.fillRect(x * c - k, y * c + Math.round(c * .5), s + 2 * k, k); }
}
// The rock: a stepped half-disc in bands, its rim a little lumpy.
function rock(p, cx, gy, R, seed) {
  for (let y = 0; y <= R; y++) {
    const half = Math.round(Math.sqrt(R * R - y * y) + ((hash(y, seed) % 3) - 1) * (y > R * .5 ? .6 : .3));
    for (let x = -half; x <= half; x++) {
      const d = R - Math.sqrt(x * x + y * y);
      const pal = d < R * .09 + 1.2 ? ROCK_RIND : d < R * .26 + 1.5 ? ROCK_MANTLE : ROCK_CORE;
      p.at(cx + x, gy - 1 - y, pick(pal, cx + x, y, seed));
    }
  }
}
// The rock as the icon draws it: sixteen cells, no bands.
const ICON = [16, 15, 13, 11, 10, 7, 4];   // widths, bottom row up, from build/icon.png
function iconRock(g, x, gyPx, u) {
  ICON.forEach((w, j) => { g.fillStyle = LINE; g.fillRect(x + ((16 - w) / 2 - 0) * u, gyPx - (j + 1) * u, w * u, u); });
  g.fillRect(x - u, gyPx, 18 * u, u);
}
function heap(p, cx, gy, half, h, seed, pal = HEAP) {
  for (let x = -half; x <= half; x++) {
    const t = 1 - Math.abs(x) / half;
    const top = Math.round(h * Math.pow(t, 1.15) + ((hash(x, seed) % 3) - 1) * .7);
    for (let y = 0; y < top; y++) p.at(cx + x, gy - 1 - y, pick(pal, cx + x, y, seed));
  }
}
function placeholder(g, x, y, w, h) {
  if (!state.bars) return;
  g.save();
  g.fillStyle = 'rgba(255,255,255,.85)'; g.fillRect(x, y, w, h);
  g.strokeStyle = '#7a7a7a'; g.lineWidth = Math.max(1, Math.round(h / 24)); g.setLineDash([h / 6, h / 8]);
  g.strokeRect(x + .5, y + .5, w - 1, h - 1);
  g.setLineDash([]);
  g.beginPath(); g.rect(x, y, w, h); g.clip();
  g.strokeStyle = '#d0d0d0'; g.lineWidth = 1;
  for (let i = -h; i < w; i += Math.max(6, h / 4)) { g.beginPath(); g.moveTo(x + i, y + h); g.lineTo(x + i + h, y); g.stroke(); }
  g.fillStyle = '#6a6a6a'; g.font = `${Math.max(9, Math.round(h * .32))}px ui-monospace, monospace`;
  g.textBaseline = 'middle'; g.fillText('PLACEHOLDER: OWNER TEXT', x + h * .4, y + h / 2);
  g.restore();
}

// Crew standing along the crest of a rock of radius R centered at cx.
function crestCrew(g, c, cx, gy, R, n, seed) {
  const r = rng(seed);
  for (let i = 0; i < n; i++) {
    const x = Math.round(cx - R * .55 + (R * 1.1) * (i + r() * .6) / n);
    const top = Math.round(Math.sqrt(Math.max(0, R * R - (x - cx) ** 2)));
    body(g, c, x - 1, gy - top - 3 - (r() < .3 ? 1 : 0), r() < .5 ? 'cap' : null);
  }
}
function spray(p, cx, top, R, n, seed) {
  const r = rng(seed);
  for (let i = 0; i < n; i++) {
    const a = Math.PI * (.15 + r() * .7), d = 3 + r() * R * .9;
    p.at(cx + Math.cos(a) * d * (r() < .5 ? -1 : 1), top - Math.sin(a) * d * .8, r() < .35 ? '#9a9a9a' : '#cfc9c4');
  }
}

// ---------------------------------------------------------------- direction A
function drawA(g, W, H, kind) {
  const logo = kind === 'logo';
  const L = {
    header:   { c: 6,  gy: .74, rx: .72, R: 31, ts: 12, two: true,  tx: 48,  ty: 54, crew: 5 },
    small:    { c: 3,  gy: .80, small: true, ts: 6, two: false },
    main:     { c: 6,  gy: .76, rx: .74, R: 44, ts: 15, two: true,  tx: 72,  ty: 86, crew: 6, bar: [72, 0, 420, 34] },
    vertical: { c: 6,  gy: .80, rx: .5,  R: 46, ts: 16, two: true,  center: true, ty: 72, crew: 6, bar: [64, 0, 620, 34] },
    capital:  { c: 6,  gy: .82, rx: .5,  R: 40, ts: 13, two: true,  center: true, ty: 80, crew: 5 },
    hero:     { c: 12, gy: .74, rx: .64, R: 34, crew: 6 },
    logo:     { ts: 20, two: true }
  }[kind];
  if (logo) {
    const lines = titleLines(true), b = titleBox(lines, L.ts);
    const x = Math.round((W - b.w) / 2), y = Math.round((H - b.h) / 2) - 70;
    solidTitle(g, lines, x, y, L.ts, LINE, 'center', b.w);
    iconRock(g, Math.round(W / 2 - 9 * 10), y + b.h + 120, 10);
    return;
  }
  const c = L.c, cols = Math.ceil(W / c), rows = Math.ceil(H / c), gy = Math.round(rows * L.gy);
  const p = cells(g, c), r = rng(11);
  sky(g, W, H);
  ground(p, cols, rows, gy);
  for (let i = 0; i < Math.round(cols / 30); i++) cloud(p, Math.floor(r() * cols), 4 + Math.floor(r() * rows * .25), 8 + Math.floor(r() * 14), 50 + i);
  motes(p, cols, 2, gy - 2, Math.round(cols * rows / 260), r);
  groundLine(g, W, gy * c, Math.max(2, Math.round(c / 3)));
  if (L.small) {
    const s = L.ts, lines = titleLines(false), b = titleBox(lines, s);
    const ty = Math.round((gy * c - b.h) / 2);
    knockout(g, 18, ty, b.w, b.h, s);
    solidTitle(g, lines, 18, ty, s, LINE);
    const u = 5; iconRock(g, W - 18 * u - 14, gy * c, u);
    return;
  }
  const cx = Math.round(cols * L.rx);
  rock(p, cx, gy, L.R, 3);
  heap(p, cx + L.R + 10, gy, 8, 4, 9);
  spray(p, cx, gy - L.R - 3, L.R, Math.round(L.R * 1.4), 21);
  crestCrew(g, c, cx, gy, L.R, L.crew, 5);
  // birds keep clear of the title: two dots over a letter read as an umlaut
  const tb = L.ts ? titleBox(titleLines(L.two), L.ts) : null;
  const tx0 = tb ? (L.center ? Math.round((W - tb.w) / 2) : L.tx) : 0;
  for (let i = 0; i < 3; i++) {
    const bx = Math.floor(cols * (.15 + r() * .3)), by = 6 + Math.floor(r() * rows * .15);
    const hit = tb && bx * c > tx0 - 6 * c && bx * c < tx0 + tb.w + 6 * c && by * c > L.ty - 6 * c && by * c < L.ty + tb.h + 6 * c;
    if (!hit) bird(p, bx, by);
  }
  if (L.ts) {
    const lines = titleLines(L.two), b = titleBox(lines, L.ts);
    knockout(g, L.center ? Math.round((W - b.w) / 2) : L.tx, L.ty, b.w, b.h, L.ts);
    if (L.center) solidTitle(g, lines, 0, L.ty, L.ts, LINE, 'center', W);
    else solidTitle(g, lines, L.tx, L.ty, L.ts, LINE);
    if (L.bar) placeholder(g, L.center ? Math.round((W - L.bar[2]) / 2) : L.bar[0], L.ty + b.h + 26, L.bar[2], L.bar[3]);
  }
}

root.SteamArt = { SIZES, PAPER, EARTH, HATCH, LINE, ROCK_RIND, ROCK_MANTLE, ROCK_CORE, HEAP, STONE, CLOUD, ORE, CROP, hash, pick, rng, state, cells, FONT, word, glyphRows, textW, textH, eachCell, titleLines, solidTitle, knockout, titleBox, pebble, boldCells, boldBox, pebbleTitle, sky, ground, groundLine, motes, cloud, bird, body, rock, ICON, iconRock, heap, placeholder, crestCrew, spray, drawA };
})(globalThis);
