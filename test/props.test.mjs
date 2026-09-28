// A station is its fighter and a prop (DESIGN.md, "A station is its fighter
// and a prop"): below the fork a crate of the gear, still packed; at the
// fork the class's own prop; from rung 8 its parts in the capstone's purple.
// The prop stands on the floor, its right-hand column PROP_GAP cells short
// of the fighter's body at its post (PROP_GAP_OF for the Swordsman), and the
// station's ground spans the prop and the post.
//
// Read off the drawing itself: the deep's stations are painted onto a sheet
// that keeps every cell it is handed (`paintOn`), so what is checked is what
// `drawDeepStations` put down, not what a helper says it would. The rungs are
// bought where the player buys them, on the station's board (`pressBuy`).

import { group, ok, yard } from './helpers.mjs';
import { P, WORKER, DEEP_W, FORK_RUNG, LADDER, PROP_GAP, PROP_GAP_OF } from '../src/config.js';
import { pressBuy } from '../src/deep/rails.js';
import { stationById } from '../src/deep/party.js';
import { slotX, deepX0, deepFloor, standOfStation } from '../src/deep/place.js';
import { PROPS, propCells } from '../src/deep/props.js';
import { paintOn } from '../src/render/ctx.js';
import { drawDeepStations } from '../src/render/deep.js';
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
    drawImage: (img, x, y) => draws.push({ img, x, y }),
    save() {}, restore() {}, translate() {}, setTransform() {}
  };
  const el = { width: 0, height: 0, cells, getContext: () => g };
  return { el, g, cells, draws };
}
// Everything the deep's stations layer draws this frame, over the whole floor.
function drawn() {
  S.camX = deepX0(); S.viewW = DEEP_W;
  const make = document.createElement;
  document.createElement = () => sheet().el;
  const out = sheet();
  try { paintOn(out.el, () => drawDeepStations()); } finally { document.createElement = make; }
  return out.draws;
}
// The prop image drawn at station `st`'s place, as its cells, and where.
function propOf(st) {
  const d = drawn().filter(o => o.img.cells && o.y + o.img.height === deepFloor())
    .find(o => o.x < slotX(st.slot) && o.x > slotX(st.slot) - P * 30);
  return d && { x: d.x, y: d.y, w: d.img.width, cells: d.img.cells };
}
// The prop `key`'s cells, as the drawing of it should hold them.
const want = (key, lit) => new Map(propCells(key, lit)
  .map(([c, r, ramp, i]) => [`${c},${r}`, (ramp === 'p' ? PURPLES : GREYS)[i]]));
const same = (a, b) => a.size === b.size && [...a].every(([k, v]) => b.get(k) === v);
const purple = cells => [...cells.values()].filter(t => PURPLES.includes(t) && !GREYS.includes(t)).length;
// The body's left column at its post, which stands on the grid.
const bodyCol = st => Math.round((slotX(st.slot) - WORKER / 2) / P);

group("a station stands beside a crate below the fork, its class's prop from it, lit at 8", async () => {
  window.__party({ stations: [{ kind: 'altar', cls: null, rung: 0 }] });
  window.__scales(99999);
  window.__grant({ dust: 1e8, shards: 1e6, sparks: 1e5 });
  const st = S.stations[0];
  const crate = propOf(st);
  for (let r = 1; r < FORK_RUNG; r++) pressBuy(st.id);
  const packed = propOf(stationById(st.id));
  pressBuy(st.id, 'sword');
  const rack = propOf(stationById(st.id));
  while (stationById(st.id).rung < LADDER && pressBuy(st.id)) { /* climb */ }
  const top = stationById(st.id);
  const lit = propOf(top);
  const g = standOfStation(top), post = bodyCol(top) * P;
  const right = p => (p.x + p.w) / P - 1;
  return [
    ok(crate && same(crate.cells, want('crate', false)), 'a new station stands beside the crate, cell for cell'),
    ok(crate && right(crate) === bodyCol(st) - PROP_GAP, `its right-hand column ${PROP_GAP} cells short of the body`,
       crate && `${right(crate)} vs ${bodyCol(st)}`),
    ok(packed && same(packed.cells, want('crate', false)), 'and still the crate at the last rung below the fork'),
    ok(rack && same(rack.cells, want('sword', false)) && purple(rack.cells) === 0,
       "at the fork the Swordsman's rack, with no purple on it"),
    ok(rack && right(rack) === bodyCol(st) - PROP_GAP_OF.sword, `his rack ${PROP_GAP_OF.sword} cells short of him`,
       rack && `${right(rack)} vs ${bodyCol(st)}`),
    ok(top.rung === LADDER && lit && same(lit.cells, want('sword', true)) && purple(lit.cells) > 2,
       'at rung 8 its parts are purple', lit && `rung ${top.rung}, ${purple(lit.cells)} purple cells`),
    ok(lit && lit.y === deepFloor() - PROPS.sword.rows.length * P, 'standing on the floor'),
    ok(g.x === lit.x && g.x + g.w >= post + WORKER && g.y <= lit.y, "and the station's ground spans the prop and the post",
       `${g.x}..${g.x + g.w} over ${lit.x}..${post + WORKER}`)
  ];
});
