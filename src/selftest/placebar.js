// The polish bar's browser gates (docs/polish-bar.md, "Automated gates" 6
// and 7, and the owner's rule of 2026-10-20 for a station's hand-worked
// parts), with a real pointer on the page:
//
//   - walk-up: the pointer walked onto each act station opens its board,
//     titled with the station's name, and panning away shuts it;
//   - work: over the middle of every hand-worked part in every place the
//     cursor is the work hand, no board opens (by walk-up or hover), and a
//     press works the part (the owner: "the manual pieces of stations should
//     not open the shop menus");
//   - the dark page: hell and act 3 on `?dark`, in a frame of their own, and
//     no color on the glass outside the place's own map.
//
// What each finds is a set of `place:key:item` gaps; each group's allowlist
// is today's, and the group is red for a new gap and for a listed gap that
// is fixed.

import { S } from '../state.js';
import { ok, settle, raf, sleep, point, canvas, run, runUntil } from './kit.js';
import { STATIONS, here } from '../stations.js';
import { openBoard } from '../board.js';
import { pageOf } from '../pages.js';
import { until, wheel, glass, lookAt, walkTo, visit, toBare } from './playcheck.js';
import { gestureStops, gestureUnder, pressTaken, gestureUp } from '../after/gestures.js';
import { GREY, PURPLE, COIN_TONES, AFTER_TONES, CLOUDS_PALETTE, HELL_TIERS, P } from '../config.js';
import { barrierFallen } from '../hell/barriers.js';
import { hellSwing } from '../hell/index.js';

// --- the allowlists ---------------------------------------------------------------
export const WALKUP_GAPS = [
  'after:after-crowd:pan',
];
export const WORK_GAPS = [
];
export const DARK_GAPS = [
  // hell's a few hundred pixels at the rock's edges; act 3's backdrop tens of thousands
  'after:after backdrop:dark', 'after:after camp:dark', 'after:after heaven:dark', 'hell:hell backdrop:dark', 'hell:hell chambers:dark',
];

const same = (name, found, listed) => {
  const stale = listed.filter(k => !found.has(k));
  const fresh = [...found].filter(k => !listed.includes(k)).sort();
  return [
    ok(stale.length === 0, `${name}: every listed gap is still a gap (take a fixed one off the list)`, stale.join(', ')),
    ok(fresh.length === 0, `${name}: every gap is listed`, fresh.map(k => `'${k}',`).join(' '))
  ];
};

// The two acts stood at work, as their scenes stand them.
async function standChain() { window.__scene('after-chain'); window.__afterAxe(); window.__goPlace('after'); window.__fast(1); await settle(0.3); }
async function standAfter() { window.__scene('act3-mid'); window.__goPlace('after'); window.__fast(1); await settle(0.3); }
async function standHell() { window.__scene('hell-forge'); window.__goPlace('hell'); window.__fast(1); await settle(0.3); }
const leave = async () => { point('pointermove', 4, 4, 0); window.__view('yard'); window.__actsOn(null); await settle(0.2); };

// --- 6: walk-up --------------------------------------------------------------------
async function walkUps(place, found) {
  const rows = STATIONS.filter(r => r.board && r.stand && r.place === place && here(r) && r.open());
  for (const row of rows) {
    // Twice before it is a gap: the walk is wall frames, and a body or a
    // bubble crossing the spot on the first can take the pointer's hover.
    let v = await visit(row);
    if (!v.spot || !v.opened) v = await visit(row);
    if (!v.spot || !v.opened) { found.add(`${place}:${row.key}:walkup`); continue; }
    const title = pageOf(row.key)?.querySelector('.title');
    const said = title ? (title.dataset.name || title.textContent || '') : '';
    if (!said.includes(row.name)) found.add(`${place}:${row.key}:title`);
    const shut = await until(() => { wheel(1500); return openBoard() === null; }, 200);
    if (!shut) found.add(`${place}:${row.key}:pan`);
  }
  return rows.length;
}

// --- the work targets ------------------------------------------------------------
// Every hand-worked part standing now, by its middle: act 3's, off the hand
// work's own hit test over each station's parts (the cells of its box that
// take a press, and the one of those nearest their middle); hell's faces and
// barriers, where a blow lands.
function afterTargets() {
  const out = [];
  for (const g of gestureStops()) {
    const pts = [];
    for (let y = g.r.y - P * 2; y < g.r.y + g.r.h + P * 2; y += P / 2)
      for (let x = g.r.x - P * 2; x < g.r.x + g.r.w + P * 2; x += P / 2) if (gestureUnder(x, y)) pts.push({ x, y });
    if (!pts.length) continue;
    const c = pts.reduce((a, p) => ({ x: a.x + p.x / pts.length, y: a.y + p.y / pts.length }), { x: 0, y: 0 });
    const at = pts.reduce((b, p) => (Math.hypot(p.x - c.x, p.y - c.y) < Math.hypot(b.x - c.x, b.y - c.y) ? p : b));
    out.push({ key: g.key, ...at });
  }
  return out;
}
function hellTargets() {
  const out = [];
  for (let i = 0; i <= S.hell.chamber; i++) out.push({ key: `face${i}`, ...window.__hellAt('face', i) });
  for (let i = 0; i <= Math.min(S.hell.chamber, HELL_TIERS.length - 1); i++)
    if (!barrierFallen(i)) out.push({ key: `wall${i}`, ...window.__hellAt('wall', i) });
  return out;
}

// Over the part: the cursor, and no board for a walk-up, a linger or a hover.
// Then a press: the hand work took it (act 3), or the blow landed (hell).
async function workChecks(place, targets, found) {
  for (const t of targets) {
    await toBare();
    await until(() => openBoard() === null, 90);
    await lookAt(t.x);
    const [sx, sy] = glass(t.x, t.y);
    await walkTo(sx, sy);
    let opened = false;
    for (let i = 0; i < 40; i++) { await raf(); if (openBoard() !== null) opened = true; }
    if (opened) found.add(`${place}:${t.key}:board`);
    if (canvas().style.cursor !== 'grab') found.add(`${place}:${t.key}:cursor`);
    // hell's: the pair's blow swung there (hell/index.js, `hellSwing`)
    const before = place === 'hell' ? hellSwing() : null;
    point('pointerdown', sx, sy, 1, 0);
    const took = place === 'hell' ? hellSwing() !== before : pressTaken();
    point('pointerup', sx, sy, 0, 0);
    if (place === 'after') gestureUp(t.x, t.y);
    for (let i = 0; i < 4; i++) { await raf(); if (openBoard() !== null) opened = true; }
    if (!took) found.add(`${place}:${t.key}:press`);
    if (opened && !found.has(`${place}:${t.key}:board`)) found.add(`${place}:${t.key}:board`);
  }
  return targets.length;
}

// --- 7: the dark page --------------------------------------------------------------
// A place on `?dark` in a frame of its own (as the index's 390px check
// stands one), staged so it never touches the save, drawn at full ink, and
// every color on its glass asked of the map the place is drawn in: every
// tone the palette writes, through that map and through the reading layers'
// ('line'), plus the cloud palette's own tones for act 3 and God's raw light.
const MIN_PX = 40;
const hex = (d, k) => '#' + ((1 << 24) | (d[k] << 16) | (d[k + 1] << 8) | d[k + 2]).toString(16).slice(1);
export async function darkOff(scene, place) {
  const f = document.createElement('iframe');
  f.src = './play.html?dark&bench';
  f.style.cssText = 'position:fixed;left:0;top:0;width:1280px;height:800px;border:0;opacity:0;pointer-events:none;z-index:-1';
  document.body.appendChild(f);
  try {
    const t0 = performance.now();
    const booted = () => { const x = f.contentWindow; return !!(x?.__reset && x.__fast && x.__scene && x.__inkOf); };
    while (!booted() && performance.now() - t0 < 30000) await sleep(50);
    const w = f.contentWindow;
    if (!booted()) return null;
    w.__scene(scene);
    w.__goPlace(place);
    w.__holdShot(0);
    for (let i = 0; i < 90; i++) w.__fast(1 / 60);
    w.__still(true);   // the page's own frames held, so each read is the frame drawn for it
    const map = w.__mapOf(place);
    const tones = [...GREY, ...PURPLE, ...Object.values(COIN_TONES).flat(), '#000000', '#ffffff',
                   ...Object.values(CLOUDS_PALETTE.light), ...Object.values(CLOUDS_PALETTE.dark || {})];
    const allowed = new Set();
    for (const c of tones) for (const m of [map, 'line']) allowed.add(w.__inkOf(c, m).toLowerCase());
    for (const c of Object.values(AFTER_TONES)) allowed.add(w.__inkOf(GREY[c], 'after').toLowerCase());
    allowed.add('#ffffff');
    const c = f.contentDocument.getElementById('c'), g = c.getContext('2d');
    // The colors off the map on a frame drawn with `skip` left out.
    const offWith = skip => {
      w.__drawFullInk(skip);
      const d = g.getImageData(0, 0, c.width, c.height).data;
      const seen = new Map();
      for (let y = 0; y < c.height; y += 2) for (let x = 0; x < c.width; x++) {
        const h = hex(d, (y * c.width + x) * 4);
        if (!allowed.has(h)) seen.set(h, (seen.get(h) || 0) + 1);
      }
      return [...seen].filter(([, n]) => n >= MIN_PX).sort((a, b) => b[1] - a[1]);
    };
    const sum = o => o.reduce((n, [, k]) => n + k, 0);
    const off = offWith(null), total = sum(off);
    // Which layers draw them: the ones whose absence takes some away (as the
    // deep's palette check names them, selftest/deeppalette.js).
    const by = [];
    if (total) for (const name of w.__layerNames(place)) {
      if (['page', 'world', 'world:done', 'screen', 'press'].includes(name)) continue;
      if (total - sum(offWith(name)) >= MIN_PX) by.push(name);
    }
    w.__still(false);
    return { map, off, by };
  } finally { f.remove(); }
}

export const TESTS = [
  ['place bar: walk-up opens every act station, titled, and a pan shuts it', async () => {
    const found = new Set();
    await standAfter();
    const a = await walkUps('after', found);
    await leave();
    await standHell();
    const h = await walkUps('hell', found);
    await leave();
    return [ok(a >= 4 && h >= 3, 'both acts stand their stations', `${a} ${h}`), ...same('walk-up', found, WALKUP_GAPS)];
  }],
  ['place bar: a hand-worked part is worked, never a board', async () => {
    const found = new Set();
    await standChain();
    const at = afterTargets();
    const a = await workChecks('after', at, found);
    await leave();
    await standHell();
    const h = await workChecks('hell', hellTargets(), found);
    await leave();
    return [ok(a >= 3 && h >= 1, 'both acts stand parts to work', `${at.map(t => t.key).join(' ')} / ${h}`),
            ...same('work', found, WORK_GAPS)];
  }],
  ['place bar: the dark page draws each act in its own map', async () => {
    const found = new Set(), out = [];
    for (const [scene, place] of [['hell-forge', 'hell'], ['act3-mid', 'after']]) {
      const r = await darkOff(scene, place);
      if (!r) { out.push(ok(false, `${place}: the game boots on the dark page in a frame`)); continue; }
      for (const name of r.by) found.add(`${place}:${name}:dark`);
      if (r.off.length && !r.by.length) found.add(`${place}:dark:off`);
      out.push(ok(true, `${place} in map ${r.map}`, r.off.slice(0, 6).map(([h, n]) => `${h} x${n}`).join(' ')));
    }
    return [...out, ...same('dark page', found, DARK_GAPS)];
  }],
];
