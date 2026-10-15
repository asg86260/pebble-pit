// A station is its fighter and a prop (DESIGN.md, "A station is its fighter
// and a prop"): below the fork a crate of the gear, still packed; at the
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

import { group, ok, yard } from './helpers.mjs';
import { P, WORKER, DEEP_W, DEEP_SLOTS, FORK_RUNG, LADDER, PROP_GAP, PROP_GAP_OF, CHOOSE_MARK, PLINTH_H } from '../src/config.js';
import { pressBuy, pressKind } from '../src/deep/rails.js';
import { stationById } from '../src/deep/party.js';
import { doneAt, markDoneSeen } from '../src/works.js';
import { slotX, deepX0, deepFloor, plinthTop, postY, standOfStation } from '../src/deep/place.js';
import { PROPS, propCells } from '../src/deep/props.js';
import { paintOn } from '../src/render/ctx.js';
import { drawDeepStations, chooseMarkAt } from '../src/render/deep.js';
import { GREYS, PURPLES, breathAt } from '../src/render/deeptones.js';
import { now } from '../src/clock.js';

const S = yard.S;

// A context that keeps its cells: every fillRect as a cell at its fill, and
// every image drawn with where it went. The images the renderer makes of its
// props are made with these too, so an image drawn is a map of its cells.
function sheet() {
  const cells = new Map(), draws = [];
  const g = {
    fillStyle: null, imageSmoothingEnabled: true, globalAlpha: 1,
    fillRect: (x, y) => cells.set(`${x / P},${y / P}`, g.fillStyle),
    drawImage: (img, x, y) => draws.push({ img, x, y }),
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
// The prop `key`'s cells, as the drawing of it should hold them: a top edge
// in the light from above as it breathes now.
const want = (key, lit) => new Map(propCells(key, lit)
  .map(([c, r, ramp, i]) => [`${c},${r}`, ramp === 'top' ? PURPLES[breathAt(now())] : (ramp === 'p' ? PURPLES : GREYS)[i]]));
const same = (a, b) => a.size === b.size && [...a].every(([k, v]) => b.get(k) === v);
// The accent's and the rung-8 parts' purple, which the top edges' light is not.
const purple = (key, lit) => propCells(key, lit).filter(([, , ramp]) => ramp === 'p').length;
// The body's left column at its post, which stands on the grid.
const bodyCol = st => Math.round((slotX(st.slot) - WORKER / 2) / P);

group("a station stands beside a crate below the fork, its class's prop from it, lit at 8", async () => {
  window.__party({ stations: [{ kind: 'altar', cls: null, rung: 0 }] });
  window.__scales(99999);
  window.__grant({ dust: 1e8, shards: 1e6, sparks: 1e5 });
  const st = S.stations[0];
  const crate = propOf(st);
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
    ok(crate && same(crate.cells, want('crate', false)), 'a new station stands beside the crate, cell for cell'),
    ok(crate && right(crate) === bodyCol(st) - PROP_GAP, `its right-hand column ${PROP_GAP} cells short of the body`,
       crate && `${right(crate)} vs ${bodyCol(st)}`),
    ok(packed && same(packed.cells, want('crate', false)), 'and still the crate at the last rung below the fork'),
    ok(rack && same(rack.cells, want('sword', false)) && purple('sword', false) === 0,
       "at the fork the Swordsman's rack, with no purple on it"),
    ok(rack && right(rack) === bodyCol(st) - PROP_GAP_OF.sword, `his rack ${PROP_GAP_OF.sword} cells short of him`,
       rack && `${right(rack)} vs ${bodyCol(st)}`),
    ok(top.rung === LADDER && lit && same(lit.cells, want('sword', true)) && purple('sword', true) > 2,
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
// (voted C): a white chevron over it, once the build's own done check has
// been read (reading its board clears that), and gone once rung 1 is bought.
group('a Recruit waiting on its first choice has the chevron over its station, until it is chosen', async () => {
  window.__party({ stations: [{ kind: null }] });
  const st = S.stations[0];
  const inkAt = () => {
    const out = sheetOf(), m = chooseMarkAt(st), cols = CHOOSE_MARK[0].length;
    let n = 0;
    CHOOSE_MARK.forEach((row, r) => [...row].forEach((ch, c) => {
      if (ch === '#' && out.cells.get(`${m.x / P + c},${m.y / P + r}`) === GREYS[11]) n++;
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
  const want = CHOOSE_MARK.join('').split('').filter(c => c === '#').length;
  return [
    ok(ticked === 0, "none while the build's done check still stands", `${ticked}`),
    ok(before.n === want && before.over, 'then the chevron is drawn whole, over the station', JSON.stringify(before)),
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
  const out = 5 * P, grounds = Object.keys(PROPS).map(k => standOfStation({ ...st, cls: k === 'crate' ? null : k }));
  const left = Math.max(...grounds.map(g => mid - g.x)), right = Math.max(...grounds.map(g => g.x + g.w - mid));
  const water = pitch - left - right, scaffolded = water - 2 * out;
  return [
    ok(pitch === 49 * P, 'the slots stand 49 cells apart', `${pitch / P}`),
    ok(water >= 10 * P, 'built, ten cells of water or more between neighbors', `${water / P} cells`),
    ok(scaffolded >= 2 * P, 'and with both scaffolds up, still two cells between their posts', `${scaffolded / P} cells`)
  ];
});
