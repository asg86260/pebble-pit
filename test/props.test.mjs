// A station is its fighter and a prop (DESIGN.md, "A station is its fighter
// and a prop"): below the fork a blank flag on a pole, its cloth waving; at the
// fork the class's own prop; from rung 8 its parts in the capstone's purple.
// The prop stands on the station's plinth, its right-hand column PROP_GAP
// cells short of the fighter's body at its post (PROP_GAP_OF for the
// Swordsman), the plinth under both on the floor, and the station's ground
// spans the plinth, the prop and the post.
//
// Read off the drawing itself: the deep's stations are painted onto a sheet
// that keeps every cell it is handed (`paintOn`), so what is checked is what
// `drawDeepStations` put down, not what a helper says it would. The rungs are
// bought where the player buys them, on the station's board (`pressBuy`).

import { group, ok, yard, run } from './helpers.mjs';
import { FLAG_WAVE, P, WORKER, DEEP_W, DEEP_SLOTS, FORK_RUNG, LADDER, PROP_GAP, PROP_GAP_OF, PLINTH_H, HAND_PRESS, PROP_FLAME, STATION_RISE_S } from '../src/config.js';
import { HANDS, handPressed } from '../src/render/hand.js';
import { pressBuy, pressKind } from '../src/deep/rails.js';
import { stationById, stationLanded } from '../src/deep/party.js';
import { doneAt, markDoneSeen } from '../src/works.js';
import { slotX, deepX0, deepFloor, plinthTop, postY, standOfStation } from '../src/deep/place.js';
import { PROPS, propCells, flameCells, clothCells, clothLift } from '../src/deep/props.js';
import { now } from '../src/clock.js';
import { paintOn } from '../src/render/ctx.js';
import { drawDeepStations, chooseMarkAt } from '../src/render/deep.js';
import { GREYS, PURPLES } from '../src/render/deeptones.js';

const S = yard.S;

// A context that keeps its cells: every fillRect as a cell at its fill, and
// every image drawn with where it went. The images the renderer makes of its
// props are made with these too, so an image drawn is a map of its cells.
function sheet() {
  const cells = new Map(), draws = [];
  const g = {
    fillStyle: null, imageSmoothingEnabled: true, globalAlpha: 1,
    fillRect: (x, y) => cells.set(`${x / P},${y / P}`, g.fillStyle),
    drawImage: (img, x, y) => draws.push({ img, x, y, alpha: g.globalAlpha }),
    save() {}, restore() {}, translate() {}, setTransform() {}
  };
  const el = { width: 0, height: 0, cells, getContext: () => g };
  return { el, g, cells, draws };
}
// Everything the deep's stations layer paints this frame, over the whole
// floor: its cells, and the images it drew with where each went.
function sheetOf() {
  S.camX = deepX0(); S.viewW = DEEP_W;
  const make = document.createElement;
  document.createElement = () => sheet().el;
  const out = sheet();
  try { paintOn(out.el, () => drawDeepStations()); } finally { document.createElement = make; }
  return out;
}
const drawn = () => sheetOf().draws;
// The prop image drawn at station `st`'s place, as its cells, and where.
function propOf(st) {
  const d = drawn().filter(o => o.img.cells && o.y + o.img.height === plinthTop())
    .find(o => o.x < slotX(st.slot) && o.x > slotX(st.slot) - P * 30);
  return d && { x: d.x, y: d.y, w: d.img.width, cells: d.img.cells };
}
// What is drawn on the floor round station `st`'s slot, and its place in the
// order: the plinth is PLINTH_H cells high, and nothing taller stands there
// (the dome that stood behind it is gone: option C, 2026-10-15).
const onFloor = st => drawn().map((o, i) => ({ ...o, i }))
  .filter(o => o.img.cells && o.y + o.img.height === deepFloor() && o.x < slotX(st.slot) && o.x + o.img.width > slotX(st.slot));
function plinthOf(st) {
  const d = onFloor(st).find(o => o.img.height === PLINTH_H * P);
  return d && { x: d.x, y: d.y, w: d.img.width, i: d.i, cells: d.img.cells };
}
const behind = st => onFloor(st).filter(o => o.img.height > PLINTH_H * P);
// The highest grey rung among an image's cells (its purples left out): the
// one the eye lands on. Read as a rung, not a channel, since the deep is
// written turned and seen through the page's map.
const lightest = cells => Math.max(-1, ...[...cells.values()].map(c => GREYS.lastIndexOf(c)));
// The prop `key`'s cells, as the drawing of it should hold them.
const want = (key, lit) => new Map(propCells(key, lit)
  .map(([c, r, ramp, i]) => [`${c},${r}`, (ramp === 'p' ? PURPLES : GREYS)[i]]));
const same = (a, b) => a.size === b.size && [...a].every(([k, v]) => b.get(k) === v);
// The purple cells: the class accent before rung 8, and the parts too from it.
const purple = (key, lit) => propCells(key, lit).filter(([, , ramp]) => ramp === 'p').length;
const accents = key => PROPS[key].rows.join('').split('*').length - 1;
// The body's left column at its post, which stands on the grid.
const bodyCol = st => Math.round((slotX(st.slot) - WORKER / 2) / P);

group("a station stands beside a flag below the fork, its class's prop from it, lit at 8", async () => {
  window.__party({ stations: [{ kind: 'altar', cls: null, rung: 0 }] });
  window.__scales(99999);
  window.__grant({ dust: 1e8, shards: 1e6, sparks: 1e5 });
  const st = S.stations[0];
  const flag = propOf(st);
  // A rung's level-up holds the next press back (test/rails.test.mjs); the
  // climb here lets each one go.
  const buy = (cls = null) => { const got = pressBuy(st.id, cls); stationById(st.id).lvlAt = null; return got; };
  for (let r = 1; r < FORK_RUNG; r++) buy();
  const packed = propOf(stationById(st.id));
  buy('sword');
  const rack = propOf(stationById(st.id));
  while (stationById(st.id).rung < LADDER && buy()) { /* climb */ }
  const top = stationById(st.id);
  const lit = propOf(top), plinth = plinthOf(top), backdrop = behind(top);
  const g = standOfStation(top), post = bodyCol(top) * P;
  const right = p => (p.x + p.w) / P - 1;
  return [
    ok(flag && same(flag.cells, want('flag', false)), "a new station stands beside the flag's pole, cell for cell"),
    ok(flag && right(flag) === bodyCol(st) - PROP_GAP, `its right-hand column ${PROP_GAP} cells short of the body`,
       flag && `${right(flag)} vs ${bodyCol(st)}`),
    ok(packed && same(packed.cells, want('flag', false)), 'and still the flag at the last rung below the fork'),
    ok(rack && same(rack.cells, want('sword', false)) && purple('sword', false) === accents('sword'),
       "at the fork the Swordsman's rack, its only purple the class accent"),
    ok(rack && right(rack) === bodyCol(st) - PROP_GAP_OF.sword, `his rack ${PROP_GAP_OF.sword} cells short of him`,
       rack && `${right(rack)} vs ${bodyCol(st)}`),
    ok(top.rung === LADDER && lit && same(lit.cells, want('sword', true)) && purple('sword', true) > accents('sword'),
       'at rung 8 its parts are purple', lit && `rung ${top.rung}, ${purple('sword', true)} purple cells`),
    ok(lit && plinthTop() < deepFloor() && lit.y === plinthTop() - PROPS.sword.rows.length * P, 'standing on its plinth, off the floor'),
    ok(plinth && lit && plinth.y === plinthTop() && plinth.x < lit.x && plinth.x + plinth.w > post + WORKER,
       'the plinth on the floor under the prop and the post', JSON.stringify(plinth)),
    ok(g.x <= plinth?.x && g.x + g.w >= plinth?.x + plinth?.w && g.y <= lit.y, "and the station's ground spans the plinth, the prop and the post",
       `${g.x}..${g.x + g.w} over ${plinth?.x}..${plinth?.x + plinth?.w}`),
    ok(backdrop.length === 0, 'nothing stands behind it: no dome', `${backdrop.length} drawn`),
    ok(rack && plinth && lightest(rack.cells) > lightest(plinth.cells), "the prop's grey is lighter than any of its plinth's",
       rack && plinth && `${lightest(rack.cells)} vs ${lightest(plinth.cells)}`)
  ];
});

// A station whose Recruit still waits on its first choice wears the mark
// (the pointing hand, option E): its white fill over it, once the build's own
// done check has been read (reading its board clears that), and gone once
// rung 1 is bought.
group('a Recruit waiting on its first choice has the hand over its station, until it is chosen', async () => {
  window.__party({ stations: [{ kind: null }] });
  const st = S.stations[0];
  const inkAt = () => {
    const out = sheetOf(), m = chooseMarkAt(st), cols = HANDS.down[0].length, dy = handPressed() ? HAND_PRESS : 0;
    let n = 0;
    HANDS.down.forEach((row, r) => [...row].forEach((ch, c) => {
      if (ch === 'o' && out.cells.get(`${m.x / P + c},${m.y / P + r + dy}`) === GREYS[11]) n++;
    }));
    return { n, over: m.y + m.h <= standOfStation(st).y, cols };
  };
  const ticked = doneAt(st.id).length > 0 && inkAt().n;
  markDoneSeen(st.id);
  const before = inkAt();
  window.__scales(99999);
  window.__grant({ dust: 1e8 });
  const chose = pressKind(st.id, 'altar');
  const after = inkAt();
  const want = HANDS.down.join('').split('').filter(c => c === 'o').length;
  return [
    ok(ticked === 0, "none while the build's done check still stands", `${ticked}`),
    ok(before.n === want && before.over, 'then the hand is drawn whole, over the station', JSON.stringify(before)),
    ok(chose && after.n === 0, 'and gone once the Recruit is chosen', JSON.stringify(after))
  ];
});

// The props are drawn big (option C, 2026-10-15), so every prop is stood at
// a slot and measured against the next slot along: its ground with the
// build's scaffold round it (three cells out, two of post). The prop stands
// left of the slot and the fighter on it, so the furthest any ground reaches
// left of its slot and the furthest any reaches right, together, are short
// of the pitch: two neighbors always have black water between them.
group("every prop's station, scaffold and all, keeps clear of the next slot", async () => {
  window.__party({ stations: [{ kind: 'altar', cls: null, rung: 0 }] });
  const st = S.stations[0], mid = slotX(st.slot), mids = DEEP_SLOTS.map((_, i) => slotX(i)).sort((a, b) => a - b);
  const pitch = Math.min(...mids.slice(1).map((m, i) => m - mids[i]));
  const out = 5 * P, grounds = Object.keys(PROPS).map(k => standOfStation({ ...st, cls: k === 'flag' ? null : k }));
  const left = Math.max(...grounds.map(g => mid - g.x)), right = Math.max(...grounds.map(g => g.x + g.w - mid));
  const water = pitch - left - right, scaffolded = water - 2 * out;
  return [
    ok(pitch === 49 * P, 'the slots stand 49 cells apart', `${pitch / P}`),
    ok(water >= 10 * P, 'built, ten cells of water or more between neighbors', `${water / P} cells`),
    ok(scaffolded >= 2 * P, 'and with both scaffolds up, still two cells between their posts', `${scaffolded / P} cells`)
  ];
});

// The flag's cloth waves (the owner, 2026-10-15): drawn over the pole each
// frame, every cell of it there on every frame, a column lifted a whole cell
// at most and the hoist never, the crest travelling out from the pole a
// column a frame; and two stations' flags are not on the same frame.
group("the flag's cloth waves a cell at a time, out from the pole, each station on its own beat", async () => {
  window.__party({ stations: [{ kind: 'altar', cls: null, rung: 0 }, { kind: 'altar', cls: null, rung: 0 }] });
  const [a, b] = S.stations, W = FLAG_WAVE, hold = W.period / W.length;
  const cloth = PROPS.flag.rows.join('').split('').filter(ch => PROPS.flag.cloth.includes(ch)).length;
  const cols = PROPS.flag.rows[0].length;
  const keyOf = cells => cells.map(([c, r]) => `${c},${r}`).sort().join(' ');
  const frames = Array.from({ length: W.length }, (_, i) => clothCells('flag', false, i * hold, a.id));
  const lifts = Array.from({ length: cols }, (_, c) => Array.from({ length: W.length }, (_, k) => clothLift(c, k)));
  const out = lifts.findIndex(row => row.some(d => d !== 0));
  // past the swing's growth, a column on the next frame is the one inside it on this
  const travels = lifts.every((row, c) => c <= W.grow || row.every((d, k) => lifts[c][(k + 1) % W.length] === lifts[c - 1][k]));
  // what is drawn at the station: the cloth's cells where clothCells puts them
  const sh = sheetOf(), p = propOf(a);
  const drawnCloth = p && clothCells('flag', false, now() / 1000, a.id)
    .filter(([c, r, , i]) => sh.cells.get(`${p.x / P + c},${p.y / P + r}`) === GREYS[i]).length;
  // the cloth sampled at 60 frames a second over a period changes W.length times
  let steps = 0;
  for (let i = 1, was = keyOf(frames[0]); i <= W.period * 60; i++) {
    const is = keyOf(clothCells('flag', false, i / 60, a.id));
    if (is !== was) steps++;
    was = is;
  }
  const together = Array.from({ length: W.length }, (_, i) =>
    keyOf(clothCells('flag', false, i * hold, a.id)) === keyOf(clothCells('flag', false, i * hold, b.id)));
  return [
    ok(frames.every(f => f.length === cloth), 'every frame holds the whole cloth', frames.map(f => f.length).join(',')),
    ok(new Set(frames.map(keyOf)).size > 1, 'and it moves from frame to frame'),
    ok(lifts.flat().every(d => Math.abs(d) <= 1) && lifts[0].every(d => d === 0) && out > 0,
       'a cell at most, the hoist held to the pole', `first moving column ${out}`),
    ok(travels, 'the crest travels out from the pole a column a frame'),
    ok(steps <= W.length, `a frame is held, not redrawn sub-cell: ${W.length} steps a period`, `${steps}`),
    ok(drawnCloth === cloth, "the cloth is drawn at the station's flag", `${drawnCloth} of ${cloth}`),
    ok(together.includes(false), "two stations' flags are not on the same frame")
  ];
});

// The Mage's candle flame sways (the owner, 2026-10-15): held poses of the
// `*` tone alone, out of the still image, upright every other pose, each
// held 0.15 to 0.3 s, and two stations' flames not in step.
group("the Mage's flame sways in held poses, each station's its own", async () => {
  const at = (t, seed) => JSON.stringify(flameCells('mage', false, t, seed));
  const holds = [], seen = new Set(), lo = PROP_FLAME.hold * (1 - PROP_FLAME.jitter), hi = PROP_FLAME.hold * (1 + PROP_FLAME.jitter);
  let prev = at(0, 3), since = 0, apart = 0;
  for (let i = 1; i < 60 * 20; i++) {
    const t = i / 60, k = at(t, 3);
    seen.add(k);
    if (at(t, 3) !== at(t, 4)) apart++;
    if (k !== prev) { if (since > 0) holds.push(t - since); since = t; prev = k; }
  }
  const tones = new Set([...flameCells('mage', false, 1, 0), ...flameCells('mage', false, 2, 0)].map(c => c[3]));
  const still = propCells('mage', false).filter(([c, r]) => PROPS.mage.rows[r][c] === '*').length;
  return [
    ok(seen.size === PROP_FLAME.frames.length, 'every pose is struck', `${seen.size}`),
    ok(Math.min(...holds) >= lo - 1 / 60 && Math.max(...holds) <= hi + 1 / 60, 'each held 0.15 to 0.3 s',
       `${Math.min(...holds).toFixed(2)}..${Math.max(...holds).toFixed(2)}`),
    ok(tones.size === 1 && still === 0, 'in the one accent tone, none of it in the still image', `${tones.size} tones, ${still} still`),
    ok(apart > 60 * 20 * 0.3, 'two stations out of step', `${apart} frames apart`)
  ];
});

// A station that stands while it is watched fades in, and its scaffold out,
// over STATION_RISE_S, instead of swapping on one frame (nothing pops).
group('a station that stands fades in over its scaffold, and the scaffold out', async () => {
  window.__party({ stations: [{ kind: 'altar', cls: null, rung: 0 }] });
  const st = S.stations[0];
  st.built = false;
  // the scaffold's left post, the only thing drawn left of the station's ground
  const posts = () => [...sheetOf().cells.keys()].filter(k => +k.split(',')[0] * P < standOfStation(st).x).length;
  const before = posts();
  stationLanded(st.id);
  const landed = drawn().some(o => o.img.cells && o.y + o.img.height === plinthTop() && o.x < slotX(st.slot));
  run(STATION_RISE_S / 2);
  const mid = propOf(st) && drawn().find(o => o.img.cells && o.y + o.img.height === plinthTop() && o.x < slotX(st.slot));
  const midCells = posts();
  run(STATION_RISE_S);
  drawn();
  const end = drawn().find(o => o.img.cells && o.y + o.img.height === plinthTop() && o.x < slotX(st.slot));
  return [
    ok(before > 0, 'a scaffold stands first', `${before} cells`),
    ok(!landed, 'on the frame it lands, no prop yet'),
    ok(mid && mid.alpha > 0 && mid.alpha < 1, 'halfway, the prop is part faded in', mid && `${mid.alpha}`),
    ok(midCells > 0, 'and the scaffold still there, fading', `${midCells} cells`),
    ok(end && end.alpha === 1, 'then the prop is whole', end && `${end.alpha}`)
  ];
});
