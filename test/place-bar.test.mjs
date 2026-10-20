// The polish bar's station walker (docs/polish-bar.md, "Automated gates" 1).
//
// Every open row of STATIONS in every place, stood up as a player would find
// it, asked what the bar asks of a station: a name; a drawn glyph of its own
// (no two of a place alike, none the bench's crate); the pointer's one hit
// test and the hover answering at its hit; a board with rows or an `empty`
// line; a stop for the hop, the digits and the pad; its board shut by a pan
// two windows off it; a pile forced full showing the shared mark, its hover
// and the `help` cursor; every job it names registered; and through the
// door -- with every body of its place held off, five game seconds move
// nothing it has `made`.
//
// What it finds is a set of `place:key:item` gaps. KNOWN_GAPS below is
// today's, and the last group asks that the two are the same set: a new gap
// is red, and so is a gap fixed but still listed. The list only shrinks.

import { group, ok, run, runUntil, yard, buyBuilt } from './helpers.mjs';
import { doneAt } from '../src/works.js';
import { doneMarkAt } from '../src/render.js';
import { hear } from '../src/audio.js';
import { lift, drop, shakeHeld } from '../src/crew/pointer.js';
import { STATIONS, stationAt, nearStation, hitRect, standRect } from '../src/stations.js';
import { GLYPHS } from '../src/glyphs.js';
import { stops } from '../src/stops.js';
import { whatIsAt, cursorAt, pan } from '../src/input.js';
import { showPanel, openBoard, listFor } from '../src/board.js';
import { markedPiles, pileMarkAt, overPileMark } from '../src/render/pilemarks.js';
import { LAYERS } from '../src/render.js';
import { PLACES } from '../src/acts.js';
import { JOBS } from '../src/crew/jobs.js';
import { TYPE_OF } from '../src/jobs.js';
import { SCENES } from '../src/scenes.js';
import { APOTH_POTS_MAX, P, SHAKE_TURNS } from '../src/config.js';

const S = yard.S;

// Today's gaps, each `place:key:item`. Fixing one takes it off; nothing is
// added without the owner.
export const KNOWN_GAPS = [
  // an act's loads have no ground to lie on yet (each act's own design)
  'after:fall:spill', 'hell:fall:spill',
  // made nothing in five seconds free, so the door is not proved (no input, not built, worked by hand)
  'after:after-mill:door-idle', 'after:after-papermill:door-idle', 'after:after-pedestal:door-idle', 'after:after-press:door-idle',
  'after:after-shack:door-idle', 'after:after-workshop:door-idle', 'hell:hell-furnace:door-idle',
  'after:after-chipper:glyph', 'after:after-chipper:stop', 'after:after-crowd:glyph', 'after:after-crowd:made', 'after:after-crowd:stop', 'after:after-grove:glyph', 'after:after-grove:made', 'after:after-grove:stop', 'after:after-mill:glyph', 'after:after-mill:stop', 'after:after-papermill:glyph', 'after:after-papermill:stop', 'after:after-pedestal:glyph', 'after:after-pedestal:stop', 'after:after-press:glyph', 'after:after-press:stop', 'after:after-shack:glyph', 'after:after-shack:stop', 'after:after-workshop:glyph', 'after:after-workshop:stop',
  'deep:crusher:hover', 'deep:crusher:made', 'deep:pods:hover', 'deep:pods:made', 'deep:pods:pan', 'deep:s1:hover', 'deep:s1:made', 'deep:s1:pan', 'deep:s2:hover', 'deep:s2:made', 'deep:s3:hover', 'deep:s3:made', 'deep:s4:hover', 'deep:s4:made', 'deep:s5:glyph', 'deep:s5:hover', 'deep:s5:made', 'deep:s6:hover', 'deep:s6:made', 'deep:s6:pan', 'deep:s7:glyph', 'deep:s7:hover', 'deep:s7:made',
  'hell:hell-anvil:glyph', 'hell:hell-face:glyph', 'hell:hell-furnace:glyph', 'hell:hell-muster:glyph', 'hell:hell-muster:made', 'hell:hell-wall:glyph', 'hell:hell-wall:made',
  'yard:apothecary:made', 'yard:bench:made', 'yard:casino:made', 'yard:farm:door', 'yard:filter:made', 'yard:house:made', 'yard:outhouse:made', 'yard:quarry:door', 'yard:shack:made', 'yard:stats:made', 'yard:tower:made',
];

const found = new Set();
const gap = (place, key, item) => found.add(`${place}:${key}:${item}`);

// Where a row stands: the yard and the deep share one world, and each has
// its own half of the stops.
const placeOf = row => row.place || 'yard';

// A point on a row's hit that the pointer's one hit test gives to it: its
// ground's middle if that answers, else the nearest cell of its hit box (or
// of what is drawn, for a row with a `hit`) that does.
function hitPoint(row) {
  const r = standRect(row.key);
  if (!r) return null;
  const c = { x: r.x + r.w / 2, y: r.y + r.h / 2 };
  if (stationAt(c.x, c.y) === row.key) return c;
  const box = row.hit ? { x: r.x - P * 8, y: r.y - P * 8, w: r.w + P * 16, h: r.h + P * 16 } : hitRect(row.key);
  let best = null, bd = Infinity;
  for (let y = box.y + P / 2; y < box.y + box.h; y += P)
    for (let x = box.x + P / 2; x < box.x + box.w; x += P) {
      if (!nearStation(row.key, x, y) || stationAt(x, y) !== row.key) continue;
      const d = Math.hypot(x - c.x, y - c.y);
      if (d < bd) { bd = d; best = { x, y }; }
    }
  return best;
}

const drawsIn = (name, place) => LAYERS.filter(l => l.name === name)
  .some(l => (l.in || 'yard') === place || (Array.isArray(l.in) && l.in.includes(place)));

// Every body of a place, the yard's crew for the yard and the deep.
const bodiesOf = place => (PLACES[place] ? PLACES[place].crew.list() || [] : S.workers);

// The walk over every open row of the place on screen.
function walk(place) {
  const rows = STATIONS.filter(r => r.stand && r.name && placeOf(r) === place && r.open());
  const glyphs = new Map();
  for (const row of rows) {
    const { key } = row;
    // a name and a glyph of its own
    if (!row.name) gap(place, key, 'name');
    const g = row.glyph;
    if (!GLYPHS[g] || (g === 'crate' && key !== 'bench')) gap(place, key, 'glyph');
    else if (glyphs.has(g)) gap(place, key, 'glyph');
    else glyphs.set(g, key);

    // the pointer's hit and the hover's word
    const at = hitPoint(row);
    if (!at) gap(place, key, 'hit');
    else if (!whatIsAt(at.x, at.y)) gap(place, key, 'hover');

    // a board with something on it
    if (row.board) {
      const rowsOn = listFor(key).length;
      if (!rowsOn && !row.empty) gap(place, key, 'board');
    }

    // a stop, in its own half
    if (!stops(place).some(s => s.id === `st:${key}`)) gap(place, key, 'stop');

    // panned two windows off it, its board comes down
    if (row.board && at) {
      showPanel(null, true);
      const camX = S.camX, camY = S.camY;
      S.camX = at.x - S.viewW / 2;
      showPanel(key, true);
      const up = openBoard() === key;
      const pl = PLACES[place];
      const lo = pl ? pl.x0() : -Infinity, hi = pl ? pl.x1() : Infinity;
      // toward whichever end has the more room
      const dir = (hi - at.x) > (at.x - lo) ? 1 : -1;
      for (let k = 0; k < 8; k++) pan(dir * S.viewW / 4);
      if (!up || openBoard() === key) gap(place, key, 'pan');
      showPanel(null, true);
      S.camX = camX; S.camY = camY;
    }

    // a pile that can fill: the mark, its hover and the help cursor
    if (row.pile) {
      const was = S.pileFull[key];
      S.pileFull[key] = true;
      if (!markedPiles().some(p => p.key === key) || !drawsIn('pile marks', place)) gap(place, key, 'pilemark');
      const m = pileMarkAt(key);
      if (!overPileMark(key, m.x, m.y)) gap(place, key, 'pilehover');
      if (cursorAt(m.x, m.y) !== 'help') gap(place, key, 'pilehelp');
      S.pileFull[key] = was;
    }

    // the job its roster names is a job the crew has
    if (row.post && !(JOBS[TYPE_OF[row.post.job]] && JOBS[TYPE_OF[row.post.job]].want)) gap(place, key, 'job');

    if (!row.made) gap(place, key, 'made');
  }
  return rows.map(r => r.key);
}

// Through the door: every body of the place held off, and five seconds of the
// clock move nothing any row has made. Held by the hand's own flag, which
// every stage of every crew passes over.
// The control first: five seconds with the bodies free, in which a row must
// make something, or holding them proves nothing about it (`door-idle`).
function door(place) {
  const rows = STATIONS.filter(r => r.stand && r.name && placeOf(r) === place && r.open() && r.made);
  // The place's own clock, so a held-still place cannot pass for a quiet one.
  const clock = () => (place === 'after' ? S.after.t : place === 'hell' ? S.hell.clock : S.tick);
  const free = rows.map(r => r.made());
  run(5);
  const busy = rows.map((r, i) => r.made() !== free[i]);
  rows.forEach((r, i) => { if (!busy[i]) gap(place, r.key, 'door-idle'); });
  for (const w of bodiesOf(place)) w.lifted = true;
  const before = rows.map(r => r.made());
  const t0 = clock();
  run(5);
  if (!(clock() > t0)) gap(place, 'clock', 'still');
  rows.forEach((r, i) => { if (busy[i] && r.made() !== before[i]) gap(place, r.key, 'door'); });
  for (const w of bodiesOf(place)) { w.lifted = false; w.falling = true; w.vx = w.vy = 0; }
  return rows.length;
}

// Every site of the yard open and every ladder topped (test/no-overlap.test.mjs).
function fullYard() {
  SCENES.everything.run();
  for (const k of ['casino', 'filter', 'apothecary', 'outhouse', 'tower', 'meteor']) S[k + 'Open'] = true;
  S.seenBench = true;
  S.apothPots = APOTH_POTS_MAX;
  window.__fullSites();
}

// The door check holds the bodies off for five seconds; a save in the middle
// of it would let the held bodies fall and walk back to work.
const QUIET = { reload: false };

group('the yard: every station meets the bar', async () => {
  fullYard();
  window.__view('yard');
  run(2);
  const keys = walk('yard');
  const held = door('yard');
  // A finished rung's tick over its station, inside the station's reach:
  // the cursor there is the question mark, as over any mark (§6).
  window.__grant({ shards: 100000, dust: 40000 });
  window.__kit({ learned: true });
  buyBuilt('carter');
  const site = Object.keys(S.siteDone).find(s => doneAt(s).length);
  const m = site && doneMarkAt(site);
  if (!m) gap('yard', 'done', 'none');
  else if (cursorAt(m.x, m.y) !== 'help') gap('yard', site, 'donehelp');
  return [ok(keys.length >= 8 && held >= 1, 'the yard stands its stations', keys.join(' '))];
}, QUIET);

group('the deep: every station meets the bar', async () => {
  SCENES.late.run();
  window.__view('deep');
  run(2);
  const keys = walk('deep');
  door('deep');
  window.__view('yard');
  return [ok(keys.includes('crusher') && keys.includes('pods'), 'the deep stands its stations', keys.join(' '))];
}, QUIET);

group('act 3: every station meets the bar', async () => {
  // The chain running: the saw mill, the chipper and the workshop at work.
  SCENES['after-chain'].run();
  window.__goPlace('after');
  // The scene's ninety seconds leave the grove felled: its inputs, the setup
  // this check is not about, so every station has something to work.
  window.__afterGrant({ logs: 40, chiplogs: 40, timber: 200, paper: 40 });
  S.after.stock.sawdust = 0;   // the heap at its brim stops the saw (a full pile)
  run(2);
  const keys = walk('after');
  const held = door('after');
  window.__view('yard');
  window.__actsOn(null);
  return [ok(keys.length >= 4 && held >= 1, 'the camp stands its stations', keys.join(' '))];
}, QUIET);

group('hell: every station meets the bar', async () => {
  SCENES['hell-forge'].run();
  window.__goPlace('hell');
  run(2);
  const keys = walk('hell');
  const held = door('hell');
  window.__view('yard');
  window.__actsOn(null);
  return [ok(keys.length >= 4 && held >= 1, 'hell stands its stations', keys.join(' '))];
}, QUIET);

// An act's bodies as the hand meets them (polish bar §2, "In the hand" and
// "Asked about"): hovered, a body says its job; taken up, shaken and let go,
// it lands with the landing's sound, stands dizzy, and lets go of what it
// held where it came down (its place's `spill`).
const heardNow = [];
hear((name, opts) => heardNow.push([name, opts && opts.place]));
function hand(place) {
  const crew = PLACES[place].crew;
  const w = crew.list().find(o => o.job && crew.pickable(o) && !o.falling);
  if (!w) { gap(place, 'hand', 'none'); return; }
  const b = crew.box(w);
  S.camX = w.x - S.viewW / 2;
  if (!whatIsAt(b.x + b.w / 2, b.y + b.h / 2)) gap(place, 'body', 'hover');
  lift(w);
  for (let k = 0; k < SHAKE_TURNS + 2; k++) { yard.fast(1 / 60); shakeHeld(w, k % 2 ? 12 : -12); }
  heardNow.length = 0;
  drop(w);
  runUntil(() => !w.falling, 5);
  if (!heardNow.some(([n, p]) => n === 'body-land' && p === place)) gap(place, 'fall', 'land');
  if (!w.dizzyUntil) gap(place, 'fall', 'dizzy');
  if (!crew.spill) gap(place, 'fall', 'spill');
}

group('the acts: a body hovered, shaken and let go, as the yard\'s', async () => {
  SCENES['act3-mid'].run();
  window.__goPlace('after');
  run(2);
  hand('after');
  SCENES['hell-forge'].run();
  window.__goPlace('hell');
  run(2);
  hand('hell');
  window.__view('yard');
  window.__actsOn(null);
  return [ok(true, 'stood')];
}, QUIET);

// Last: what the walk found is exactly the list.
group('KNOWN_GAPS lists exactly the gaps there are', async () => {
  const stale = KNOWN_GAPS.filter(k => !found.has(k));
  const fresh = [...found].filter(k => !KNOWN_GAPS.includes(k)).sort();
  return [
    ok(stale.length === 0, 'every listed gap is still a gap (take a fixed one off the list)', stale.join(', ')),
    ok(fresh.length === 0, 'every gap is listed', fresh.map(k => `'${k}',`).join(' '))
  ];
});
