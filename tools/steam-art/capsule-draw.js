// The Steam capsules, "the rock on its line": the yard's own parts drawn from
// plain cells, at the yard's own cell, in the yard's own colors.
//
// A classic script with no DOM beyond a canvas, injected into a headless page
// by tools/steam-art.mjs. It owns no color: the tool reads every one from
// src/config (and the rock's shading function from src/grid.js) and hands them
// in through `SteamArt.use`, so a capsule can never wear a tone the game does
// not. The rules it keeps are the yard's (docs/design-language/store.md):
//
//   - one cell, `P`, everywhere. A capsule bigger than its picture is drawn at
//     a fraction of its size and scaled up by a whole number, never redrawn at
//     a second cell;
//   - every fillRect on a whole cell, so no edge is antialiased;
//   - nothing floats: a body's feet are on the highest cell under it;
//   - nothing is cut: clouds, motes and birds keep clear of the title rather
//     than a white box being painted over them.
//
// The capsules of 2026-10-12 (docs/mocks/steam-capsules-2026-10-12.html) used
// the tool's own warm paper, a banded rock and a knockout box; that mock is a
// record and no longer draws from this file.
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

let K = null;   // the game's palette and shapes, from `use`
function use(pal) {
  K = pal;
  // depthShade is src/grid.js's own function, handed in as its source: it
  // closes over SHADES, so it is rebuilt here against the same list.
  K.depthShade = new Function('SHADES', `return ${pal.depthShadeSrc};`)(pal.shades);
  K.shadeOf = v => pal.shades[Math.min(pal.shades.length, Math.max(1, v)) - 1];
}
const need = () => { if (!K) throw new Error('SteamArt.use(palette) first: the capsules own no color'); return K; };

const hash = (a, b, s = 0) => { let h = (a * 374761393 + b * 668265263 + s * 2147483647) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0); };
function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

// A cell painter: x and y in cells, always whole.
function cells(g, c) {
  return {
    c,
    at(x, y, col) { g.fillStyle = col; g.fillRect(Math.round(x) * c, Math.round(y) * c, c, c); }
  };
}

// ---------------------------------------------------------------- the letters
// A 5x7 face. The game's own name is DOM text on the title page; until one
// drawing of it lives in src, the capsules keep this one, with every font
// pixel a whole number of cells.
const FONT = {
  P: ['11110', '10001', '10001', '11110', '10000', '10000', '10000'],
  E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
  B: ['11110', '10001', '10001', '11110', '10001', '10001', '11110'],
  L: ['10000', '10000', '10000', '10000', '10000', '10000', '11111'],
  I: ['111', '010', '010', '010', '010', '010', '111'],
  T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
  ' ': ['000', '000', '000', '000', '000', '000', '000']
};
const FONT_H = 7;
const glyphRows = ch => FONT[ch] || FONT[' '];
const textW = s => [...s].reduce((n, ch, i) => n + glyphRows(ch)[0].length + (i ? 1 : 0), 0);
function eachCell(s, plot) {
  let x = 0;
  [...s].forEach(ch => {
    const rows = glyphRows(ch);
    rows.forEach((r, y) => [...r].forEach((v, i) => { if (v === '1') plot(x + i, y); }));
    x += rows[0].length + 1;
  });
}
const titleLines = two => two ? ['PEBBLE', 'PIT'] : ['PEBBLE PIT'];
const titleBox = (lines, s) => ({ w: Math.max(...lines.map(textW)) * s, h: (lines.length * (FONT_H + 2) - 2) * s });
function solidTitle(g, lines, x0, y0, s, col, align = 'left', boxW = 0) {
  g.fillStyle = col;
  lines.forEach((ln, k) => {
    const w = textW(ln) * s;
    const ox = align === 'center' ? x0 + Math.round((boxW - w) / 2 / s) * s : x0;
    const oy = y0 + k * (FONT_H + 2) * s;
    eachCell(ln, (x, y) => g.fillRect(ox + x * s, oy + y * s, s, s));
  });
}

// ---------------------------------------------------------------- the yard's parts
// What a cell may not be painted on: the title's box and a margin round it.
const clear = (keep, x, y) => !keep || x < keep.x0 || x > keep.x1 || y < keep.y0 || y > keep.y1;

// The ground: the page, the hatch of GROUND_TEXTURE 2 (a mark a cell on every
// GROUND_TILE-th diagonal), at GROUND_INK of black.
function ground(p, cols, rows, gy) {
  const { paper, hatch, groundTile: n } = need();
  for (let y = gy; y < rows; y++) for (let x = 0; x < cols; x++) p.at(x, y, (x + y) % n === 0 ? hatch : paper);
}
// The line is the yard's: a third of a cell, the same 2 px the world draws.
function groundLine(g, W, gyPx) { const { ink, P } = need(); g.fillStyle = ink; g.fillRect(0, gyPx, W, P / 3); }
// Specks of dust in the air: the rock's lightest two shades.
function motes(p, cols, top, bot, n, r, keep) {
  const { shades } = need();
  for (let i = 0; i < n; i++) {
    const x = Math.floor(r() * cols), y = top + Math.floor(r() * (bot - top)), tone = shades[r() < .7 ? 0 : 1];
    if (clear(keep, x, y)) p.at(x, y, tone);
  }
}
// A cloud as weather.js shades one: puffs on a flat base, lit from above.
// A cell's depth is how far it sits under the nearest top within
// CLOUD_SHADE_REACH columns, as a share of the cloud's height: lit to
// CLOUD_LIT, body to CLOUD_MID, shade below, and the base row the underside.
function cloudShape(w, seed) {
  const r = rng(seed), puffs = 2 + Math.floor(r() * 2), top = new Array(w).fill(0);
  for (let k = 0; k < puffs; k++) {
    const cx = (k + .5) / puffs * w + (r() - .5) * w / puffs * .6, rad = w / puffs * (.75 + r() * .45);
    for (let x = 0; x < w; x++) { const d = x + .5 - cx; if (Math.abs(d) < rad) top[x] = Math.max(top[x], Math.round(Math.sqrt(rad * rad - d * d))); }
  }
  for (let x = 0; x < w; x++) top[x] = Math.max(top[x], 1);
  return top;
}
function cloud(p, x0, base, w, seed, top = cloudShape(w, seed)) {
  const { cloud: tones, cloudLit, cloudMid, cloudReach } = need();
  const H = Math.max(...top);
  for (let i = 0; i < w; i++) for (let j = 0; j < top[i]; j++) {
    let depth = Infinity;
    for (let d = -cloudReach; d <= cloudReach; d++) { const t = top[i + d]; if (t > j) depth = Math.min(depth, t - 1 - j); }
    const share = depth / H;
    const tone = j === 0 ? tones[3] : share < cloudLit ? tones[0] : share < cloudMid ? tones[1] : tones[2];
    p.at(x0 + i, base - j, tone);
  }
  return { x0, x1: x0 + w - 1, y0: base - H + 1, y1: base };
}
// The yard's bird: the three-cell chevron, in BIRD_TONE.
function bird(p, x, y) { const { bird: tone } = need(); p.at(x, y, tone); p.at(x + 1, y + 1, tone); p.at(x + 2, y, tone); }
// A body as drawBody draws one: WORKER square, white, a 2-px black rule round
// it. A hat from sprites.js's HATS stands with its bottom row on the body's top.
function body(g, x, y, hat) {
  const { ink, paper, P, worker, hats } = need(), t = P / 3;
  g.fillStyle = ink; g.fillRect(x, y, worker, worker);
  g.fillStyle = paper; g.fillRect(x + t, y + t, worker - 2 * t, worker - 2 * t);
  const rows = hat && hats[hat];
  if (!rows) return;
  const w = Math.max(...rows.map(r => r.length)), left = x + (worker - w * P) / 2;
  g.fillStyle = ink;
  rows.forEach((r, j) => [...r].forEach((ch, i) => { if (ch === '#') g.fillRect(left + i * P, y - (rows.length - j) * P, P, P); }));
}

// The rock: a stepped half-disc, shaded by depthShade on how far a cell is in
// from the rim, as the yard's boulder is darker where more of it is stacked.
// Returns the height of its top cell in each column, for whoever stands on it.
function rock(p, cx, gy, R, seed) {
  const { depthShade, shadeOf, shades } = need(), rim = Math.max(3, Math.round(R * .14));
  const tops = new Map();
  for (let y = 0; y <= R; y++) {
    const half = Math.round(Math.sqrt(R * R - y * y) + ((hash(y, seed) % 3) - 1) * (y > R * .5 ? .6 : .3));
    for (let x = -half; x <= half; x++) {
      const d = R - Math.sqrt(x * x + y * y);
      // a grain's own tone: a step either way near the rim, as shadeNear does
      const v = depthShade(Math.max(.01, d), rim) + (d < rim ? (hash(cx + x, y, seed) % 3) - 1 : 0);
      p.at(cx + x, gy - 1 - y, shadeOf(Math.min(shades.length, v)));
      tops.set(cx + x, Math.max(tops.get(cx + x) ?? -1, y));
    }
  }
  return tops;
}
// The rock as the app icon draws it: solid ink, widths bottom row up from
// build/icon.png, each row's left edge on a whole cell.
const ICON = [16, 15, 13, 11, 10, 7, 4];
function iconRock(g, x, gyPx, u, ink) {
  g.fillStyle = ink;
  ICON.forEach((w, j) => g.fillRect(x + Math.floor((16 - w) / 2) * u, gyPx - (j + 1) * u, w * u, u));
  g.fillRect(x - u, gyPx, 18 * u, u);
}
// The spoil heap: dust, a shade a grain around the middle of the ramp.
function heap(p, cx, gy, half, h, seed) {
  const { shadeOf } = need();
  for (let x = -half; x <= half; x++) {
    const t = 1 - Math.abs(x) / half;
    const top = Math.round(h * Math.pow(t, 1.15) + ((hash(x, seed) % 3) - 1) * .7);
    for (let y = 0; y < top; y++) p.at(cx + x, gy - 1 - y, shadeOf(2 + hash(cx + x, y, seed) % 3));
  }
}
// Crew along the crest, each standing on the highest rock cell under its
// three columns.
function crestCrew(g, c, cx, gy, R, n, seed, tops) {
  const r = rng(seed), cellsW = need().worker / c;
  for (let i = 0; i < n; i++) {
    const x = Math.round(cx - R * .55 + (R * 1.1) * (i + r() * .6) / n);
    let h = -1;
    for (let k = 0; k < cellsW; k++) h = Math.max(h, tops.get(x + k) ?? -1);
    const feet = (gy - 1 - h) * c;   // the top of the highest cell under it
    body(g, x * c, feet - need().worker, r() < .5 ? 'helmet' : null);
  }
}
// Dust thrown up off the crest.
function spray(p, cx, top, R, n, seed, keep) {
  const { shades } = need(), r = rng(seed);
  for (let i = 0; i < n; i++) {
    const a = Math.PI * (.15 + r() * .7), d = 3 + r() * R * .9;
    const x = Math.round(cx + Math.cos(a) * d * (r() < .5 ? -1 : 1)), y = Math.round(top - Math.sin(a) * d * .8);
    if (clear(keep, x, y)) p.at(x, y, shades[r() < .35 ? 2 : 0]);
  }
}

// ---------------------------------------------------------------- the capsules
// Every layout in design pixels at the yard's cell. `k` is the whole number a
// capsule is scaled up by from its design: the hero and the logo are drawn at
// half their size and doubled, so their cell is two of the yard's, not a
// second cell size. Title scales `ts` are whole multiples of the cell.
const LAYOUT = {
  header:   { k: 1, gy: .74, rx: .72, R: 31, ts: 2, two: true,  tx: 48, ty: 54, crew: 5 },
  small:    { k: 1, gy: .80, small: true, ts: 1 },
  main:     { k: 1, gy: .76, rx: .74, R: 44, ts: 3, two: true,  tx: 72, ty: 84, crew: 6 },
  vertical: { k: 1, gy: .80, rx: .5,  R: 46, ts: 3, two: true,  center: true, ty: 72, crew: 6 },
  capital:  { k: 1, gy: .82, rx: .5,  R: 40, ts: 2, two: true,  center: true, ty: 84, crew: 5 },
  hero:     { k: 2, gy: .74, rx: .64, R: 34, crew: 6 },
  logo:     { k: 2, ts: 2, two: true }
};

// `ink` colors the logo's letters and rock: black for a light library, white
// for a dark one. The other kinds draw their own picture and ignore it.
function draw(g, W, H, kind, ink) {
  const { P, ink: INK, paper } = need(), L = LAYOUT[kind], c = P;
  ink = ink || INK;
  if (kind === 'logo') {
    const s = L.ts * c, lines = titleLines(true), b = titleBox(lines, s);
    const x = Math.round((W - b.w) / 2 / c) * c, y = Math.round(((H - b.h) / 2 - 36) / c) * c;
    solidTitle(g, lines, x, y, s, ink, 'center', b.w);
    iconRock(g, Math.round((W / 2 - 8 * c) / c) * c, y + b.h + 10 * c, c, ink);
    return;
  }
  const cols = Math.ceil(W / c), rows = Math.ceil(H / c), gy = Math.round(rows * L.gy);
  const p = cells(g, c), r = rng(11);
  g.fillStyle = paper; g.fillRect(0, 0, W, H);
  ground(p, cols, rows, gy);

  // the title's box in cells, with three cells of air round it
  let keep = null, lines = null, s = 0, tx = 0, ty = 0, b = null;
  if (L.ts) {
    s = L.ts * c; lines = titleLines(!!L.two); b = titleBox(lines, s);
    tx = L.small ? 2 * c : L.center ? Math.round((W - b.w) / 2 / c) * c : L.tx;
    ty = L.small ? Math.round((gy * c - b.h) / 2 / c) * c : L.ty;
    keep = { x0: tx / c - 3, x1: (tx + b.w) / c + 3, y0: ty / c - 3, y1: (ty + b.h) / c + 3 };
  }
  // clouds kept whole: in the sky, inside the frame, clear of the title and
  // of one another
  const placed = [];
  for (let i = 0, tries = 0; i < Math.max(2, Math.round(cols / 55)) && tries < 200; tries++) {
    const w = 14 + Math.floor(r() * 18), x0 = 1 + Math.floor(r() * (cols - w - 2)), top = cloudShape(w, 50 + i);
    const H = Math.max(...top), base = H + 2 + Math.floor(r() * Math.max(2, gy * .45 - H));
    const box = { x0, x1: x0 + w - 1, y0: base - H + 1, y1: base };
    const hits = q => !(box.x1 + 2 < q.x0 || box.x0 - 2 > q.x1 || box.y1 + 2 < q.y0 || box.y0 - 2 > q.y1);
    if (box.y0 < 1 || (keep && hits(keep)) || placed.some(hits)) continue;
    if (box.y1 > gy - 12) continue;
    placed.push(cloud(p, x0, base, w, 50 + i, top)); i++;
  }
  const inCloud = (x, y) => placed.some(q => x >= q.x0 && x <= q.x1 && y >= q.y0 && y <= q.y1);
  motes(p, cols, 2, gy - 2, Math.round(cols * rows / 260), r, { x0: keep?.x0 ?? -1, x1: keep?.x1 ?? -1, y0: keep?.y0 ?? -1, y1: keep?.y1 ?? -1 });
  groundLine(g, W, gy * c);
  if (L.small) {
    solidTitle(g, lines, tx, ty, s, INK);
    iconRock(g, W - 18 * c, gy * c, c, INK);
    return;
  }
  const cx = Math.round(cols * L.rx);
  const tops = rock(p, cx, gy, L.R, 3);
  // the spoil heap beside it, on whichever side it stands whole
  const heapAt = [cx + L.R + 10, cx - L.R - 10].find(x => x - 8 >= 0 && x + 8 < cols);
  if (heapAt !== undefined) heap(p, heapAt, gy, 8, 4, 9);
  spray(p, cx, gy - L.R - 3, L.R, Math.round(L.R * 1.4), 21, keep);
  crestCrew(g, c, cx, gy, L.R, L.crew, 5, tops);
  for (let i = 0, n = 0; n < 3 && i < 40; i++) {
    const bx = Math.floor(cols * (.15 + r() * .3)), by = 6 + Math.floor(r() * rows * .15);
    if (!clear(keep, bx, by) || !clear(keep, bx + 2, by + 1) || inCloud(bx, by) || inCloud(bx + 2, by + 1)) continue;
    bird(p, bx, by); n++;
  }
  if (lines) solidTitle(g, lines, tx, ty, s, INK);
}

// The capsule at its Steam size: drawn at its design size, scaled up by its
// whole number with smoothing off.
function capsule(kind, W, H, ink) {
  const k = LAYOUT[kind].k, w = W / k, h = H / k;
  if (w !== Math.round(w) || h !== Math.round(h)) throw new Error(`${kind}: ${W}x${H} is not a whole ${k} times its design`);
  const d = document.createElement('canvas'); d.width = w; d.height = h;
  draw(d.getContext('2d'), w, h, kind, ink);
  if (k === 1) return d;
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d'); g.imageSmoothingEnabled = false; g.drawImage(d, 0, 0, W, H);
  return c;
}

root.SteamArt = { SIZES, LAYOUT, use, capsule };
})(globalThis);
