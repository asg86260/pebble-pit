// Act 3's grove rebuilt since 2026-10-30 (DESIGN.md, "Act 3's grove,
// rebuilt", "Saves and migration"). A tree is planted from an acorn and grows
// as one fraction rather than in held stages; there is no axe, only a saw
// bought for the woodcutter; and the grove and the forestry shack stand on a
// raised floor, the plots counted from the shack, the shack grown by its
// seed basket, every station past it shifted right.
//
// Here, on the raw save:
// - each plot becomes { grow, seed, tones, stump, dug, fall, fell, chops, by }:
//   a tree mid-growth keeps its progress (stage 1 or 2 with `grow` seconds is
//   ((stage - 1) * T + grow) / (2 * T), T the stage time it was growing at),
//   a grown or falling tree is 1, a stump keeps its roots dug; `big`, `chip`,
//   `logs` and `at` go, and the tones are picked when the act is read;
// - the axe's names are renamed to the saw's and kept under no old name;
//   bigger trees becomes self-seeding's first rung;
// - every unit on act 3's ground becomes the reader's one-time lay list
//   (`after.lay`, v31's precedent), since the ground moves under its cells:
//   a unit on a pile's strip is laid on that strip, one lying loose near its
//   plot or its station by where it lay off it; the basket starts full;
// - a woodcutter chooses again on its first frame.
import { kindOf, toneOf, sizeOfCell } from '../grid.js';

const obj = v => v && typeof v === 'object' && !Array.isArray(v);
// The layout of SAVE_V 34, as it stood the day this was written: the
// grove's plot lines and the stations' grounds' left edges, world px, and
// each counted pile's strip, in ground columns. Frozen here, because the
// config no longer knows it.
const V34 = {
  plots: [510, 636, 762, 888],
  stations: { forestry: 1164, mill: 1488, workshop: 2112, shack: 2598, pedestal: 3090 },
  strips: { logs: [246, 254, 'log'], grovelogs: [179, 199, 'log'], timber: [311, 329, 'plank'], benchtimber: [397, 401, 'plank'], signs: [381, 389, 'sign'] },
  cell: 6,
  stageS: 30, stageSUp: 15
};
const SEEDS0 = 5;
// The old ground's runs, read back to cells (after/ground.js, `runsOf`).
function cellsOf(str, n) {
  if (typeof str !== 'string' || !str) return null;
  const cells = new Uint8Array(n);
  let i = 0;
  for (const part of str.split('.')) {
    const x = part.indexOf('x'), v = +part.slice(0, x), len = +part.slice(x + 1);
    if (x < 0 || !(len >= 0) || i + len > n) return null;
    if (v) cells.fill(v, i, i + len);
    i += len;
  }
  return i === n ? cells : null;
}
// Where a loose unit at world x (its left edge) is laid again: near its
// plot in the grove, by its offset off the plot's line turned to the fall's
// new side (a tree fell right then and falls left now); else near the
// station whose ground it lay on, by its offset off that ground.
function looseAt(x) {
  if (x < V34.stations.forestry) {
    const i = Math.max(0, Math.min(V34.plots.length - 1, Math.round((x - V34.plots[0]) / (V34.plots[1] - V34.plots[0]))));
    return { plot: i, off: -(x - V34.plots[i]) };
  }
  const keys = Object.keys(V34.stations).filter(k => V34.stations[k] <= x);
  const key = keys.reduce((a, k) => (V34.stations[k] > V34.stations[a] ? k : a), keys[0]);
  return { near: key, dx: x - V34.stations[key] };
}

export default {
  since: '2026-10-30',
  v: 35,
  says: 'act 3\'s grove rebuilt: plots grow from acorns, the axe is the saw, and the ground\'s units are laid again on the new layout',
  apply(s) {
    const a = s.after;
    if (Array.isArray(s.beatsDone)) s.beatsDone = s.beatsDone.map(b => (b === 'axe' ? 'saw' : b));
    if (!obj(a)) return;
    const ups = obj(a.ups) ? a.ups : (a.ups = {}), upAt = obj(a.upAt) ? a.upAt : (a.upAt = {});
    const T = ups['after-grow'] ? V34.stageSUp : V34.stageS;
    const lay = Array.isArray(a.lay) ? a.lay : [];
    // the plots
    if (Array.isArray(a.plots)) {
      a.plots = a.plots.map((p, i) => {
        if (!obj(p)) return p;
        const stage = +p.stage || 0, falling = p.fall != null;
        const grow = falling || stage >= 3 ? 1 : stage > 0 ? Math.min(1, ((stage - 1) * T + (+p.grow || 0)) / (2 * T)) : null;
        const stump = !falling && !!p.stump && grow == null;
        for (let k = 0; k < (+p.logs || 0); k++) lay.push({ kind: 'log', plot: i, off: -(k + 1) * 4 * V34.cell });
        return { grow, seed: null, tones: null, stump, dug: stump ? Math.max(0, Math.min(2, +p.dug || 0)) : 0,
                 fall: falling ? p.fall : null, fell: null, chops: grow === 1 ? (+p.chops || 0) : 0, by: null };
      });
    }
    // the axe, renamed to the saw
    a.sawBought = !!(a.axeBought || a.sawBought);
    a.sawHanded = !!(a.axe || a.sawHanded);
    delete a.axeBought; delete a.axe;
    if ('after-axe' in ups) { ups['after-saw'] = ups['after-axe']; delete ups['after-axe']; }
    if ('after-axe' in upAt) { upAt['after-saw'] = upAt['after-axe']; delete upAt['after-axe']; }
    // bigger trees retires into self-seeding's first rung (track D's row)
    if (ups['after-tree']) { ups['after-selfseed'] = Math.max(1, +ups['after-selfseed'] || 0); if (upAt['after-tree'] != null) upAt['after-selfseed'] = upAt['after-tree']; }
    delete ups['after-tree']; delete upAt['after-tree'];
    a.seedsOwed = +a.seedsOwed || 0;
    a.selfSeed = +a.selfSeed || 0;
    // the ground's units, laid again on the new layout
    const g = a.ground;
    if (obj(g) && g.cols > 0 && g.rows > 0) {
      const cells = cellsOf(g.cells, g.cols * g.rows);
      for (const ai of cells && Array.isArray(g.blocks) ? g.blocks : []) {
        const v = cells[ai], k = kindOf(v);
        if (!k || !Number.isInteger(ai)) continue;
        const c0 = ai % g.cols, tone = toneOf(v);
        const strip = Object.entries(V34.strips).find(([, [s0, s1, good]]) => good === k.key && c0 >= s0 && c0 + sizeOfCell(v) <= s1);
        lay.push(strip ? { what: strip[0], kind: k.key, tone } : { kind: k.key, tone, ...looseAt(c0 * V34.cell) });
      }
    }
    a.ground = null;
    lay.push({ what: 'seeds', n: SEEDS0 });
    a.lay = lay;
    // a woodcutter chooses again; its load is kept
    for (const w of Array.isArray(a.bodies) ? a.bodies : []) if (obj(w) && w.job === 'woodcutter') { w.target = null; w.t = 0; w.dig = false; }
  }
};
