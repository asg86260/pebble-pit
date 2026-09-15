// The objects on the shelf: one small sprite a row, in the yard's own alphabet
// ('#' rows, see sprites.js), eight cells square, drawn to a canvas at
// SHELF_GLYPH_CELL screen pixels a cell so it is crisp at any zoom.
//
// A glyph is the thing, never the effect: a sack for carry, the hat the kit
// sells, a machine's mark for a machine, a crate for a build. Everything here
// is a placeholder until the set is drawn as a batch against shelf.html; a
// row with no glyph of its own gets the crate, so a missing one is visible on
// the shelf rather than a blank.
import { SHELF_GLYPH_CELL as CELL, SHELF_GLYPH_CELLS as CELLS, SHELF_INK } from './config.js';

// The drawings, by the object's name. A drawing that is not here yet is a
// row still wearing the crate, and the review sheet (glyphs.html) says so.
export const GLYPHS = {
  sack:       ['########', '#......#', '#..##..#', '########', '#..##..#', '#......#', '#......#', '########'],
  lever:      ['....#...', '...##...', '..###...', '.####...', '#####...', '.####...', '..###...', '....#...'],
  swing:      ['......##', '.....##.', '....##..', '...##...', '..##....', '.###....', '####....', '.##.....'],
  pickhead:   ['.....###', '....####', '...##.#.', '..##....', '.##.....', '##......', '#.......', '........'],
  spark:      ['...#....', '...#....', '.#.#.#..', '..###...', '#######.', '..###...', '.#.#.#..', '...#....'],
  cracked:    ['#......#', '.#....#.', '..#..#..', '...##...', '...##...', '..#..#..', '.#....#.', '#......#'],
  boot:       ['......##', '.....###', '....####', '...#####', '..######', '.#..##..', '#...##..', '....##..'],
  cart:       ['........', '.######.', '.#....#.', '.#....#.', '########', '#......#', '.#....#.', '..#..#..'],
  belt:       ['........', '........', '.######.', '#......#', '.######.', '.#....#.', '..#..#..', '........'],
  crate:      ['...##...', '..####..', '.######.', '########', '#......#', '#.#..#.#', '#......#', '########'],
  shield:     ['#.#.#.#.', '########', '#......#', '#.####.#', '#.#..#.#', '#.####.#', '#......#', '########'],
  hat:        ['........', '...##...', '..####..', '.######.', '########', '........', '........', '........'],
};

// The badges: three cells square, in the bottom-right corner, saying what is
// being done to the object -- tune it, another of it, a spell on it, a tonic
// of it, or which coin it is about (docs/glyphs.md, "borrow the object,
// badge the how").
export const BADGES = {
  wrench: ['#.#', '###', '.#.'],
  plus:   ['.#.', '###', '.#.'],
  star:   ['#.#', '.#.', '#.#'],
  vial:   ['.#.', '.#.', '###'],
  dust:   ['###', '###', '###'],
  crop:   ['.#.', '###', '.#.'],
  ore:    ['.#.', '.#.', '###'],
  spark:  ['.#.', '###', '.#.'],
};

// The glyph editor (glyphs.html) keeps its work in the browser until it is
// pasted into the tables above; a dev build reads it over them, so a drawing
// in progress can be judged on the plank. Nothing of this ships, and a saved
// override for a name that has since been drawn here is dropped by the
// editor, not by the game.
export const OVERRIDES_KEY = 'boulder-clicker/glyphs';
if (import.meta.env && import.meta.env.DEV && typeof localStorage !== 'undefined') {
  try {
    const saved = JSON.parse(localStorage.getItem(OVERRIDES_KEY) || '{}');
    Object.assign(GLYPHS, saved.glyphs || {});
    Object.assign(BADGES, saved.badges || {});
  } catch { /* a bad save is no save */ }
}

// Every row on every shelf: the drawing it borrows and, if any, the badge.
// This is the whole of docs/glyphs.md as a table, so a row never names a
// picture in its own file and the inventory and the code cannot drift.
export const GLYPH_OF = {
  // the bench
  props: ['planks'], net: ['net'], arch: ['arch'], askwizards: ['point'],
  carry: ['sack'], auto: ['lever'], speed: ['swing'], pick: ['pickhead'],
  critchance: ['spark'], critmult: ['cracked'],
  haulcarry: ['sack'], haulpace: ['boot'], carter: ['cart'], belt: ['belt'], tunebelt: ['belt', 'wrench'],
  unlockquarry: ['hoist'], unlockfarm: ['furrow'], unlockapothecary: ['pot'], unlockcasino: ['die'],
  unlockshack: ['hut'], unlockouthouse: ['bucket'], unlocktower: ['tower'], unlockscrub: ['fan'],
  // the house and the closet
  crewlist: ['door'], house: ['house', 'plus'], loopost: ['cap', 'plus'],
  // the shack
  rockhandpick: ['pickhead'], rockhandspeed: ['swing'], breaker: ['helmet'], ram: ['ram'], tuneram: ['ram', 'wrench'],
  // the quarry
  quarrybench: ['shovel', 'plus'], seam: ['ore'], quarrypace: ['swing'], jaw: ['jaw'], tunejaw: ['jaw', 'wrench'],
  // the farm
  farmplot: ['furrow', 'plus'], crop: ['ear'], tend: ['hoe'], tiller: ['tiller'], tunetiller: ['tiller', 'wrench'],
  // the apothecary
  potkeep: ['pot'], potprefer: ['pot', 'vial'], anotherpot: ['pot', 'plus'],
  bufflength: ['vial'], brewdoses: ['vial', 'plus'],
  'potency-stew': ['bowl', 'vial'], 'potency-brace': ['spark', 'vial'], 'potency-strong': ['sack', 'vial'],
  'potency-swift': ['boot', 'vial'], 'potency-gleam': ['star', 'vial'],
  // the tower
  wizard: ['point'], wizspeed: ['wand'], wizpower: ['bolt'],
  spelldrive: ['ram', 'star'], spellluck: ['ore', 'star'], spellthrift: ['house', 'star'], spellsweep: ['cap', 'star'],
  dome: ['dome'],
  // the scrubbing house
  fan: ['fan'], balloon: ['balloon'], recycler: ['bin'],
  // the casino
  chip: ['chip'], stakedust: ['chip', 'dust'], stakeshard: ['chip', 'ore'], stakespore: ['chip', 'crop'],
  bank: ['sack', 'dust'], ride: ['die'],
};

// A row's picture: its drawing with its badge laid into the bottom-right
// corner, cell for cell (the badge's cells replace the drawing's, so it reads
// on top). A drawing not made yet is the crate, so the shelf shows the gap.
export const glyphFor = key => {
  const [name, badge] = GLYPH_OF[key] || ['crate'];
  const rows = (GLYPHS[name] || GLYPHS.crate).map(r => [...r]);
  if (badge && BADGES[badge]) {
    const b = BADGES[badge], oy = CELLS - b.length, ox = CELLS - b[0].length;
    // a clear cell round the badge, so it reads against the drawing
    for (let y = oy - 1; y < CELLS; y++) for (let x = ox - 1; x < CELLS; x++) if (y >= 0 && x >= 0) rows[y][x] = '.';
    b.forEach((br, y) => [...br].forEach((c, x) => { rows[oy + y][ox + x] = c === '#' ? '#' : '.'; }));
  }
  return rows.map(r => r.join(''));
};
// Whether a row's drawing exists yet, for the review sheet.
export const drawn = key => !!GLYPHS[(GLYPH_OF[key] || ['crate'])[0]];

// The drawn cells' left and right edge, in cells: what the glyph is centered on.
// A sprite's box is eight wide; its ink is often narrower and off to one side,
// and a box centered under a name puts the ink off center.
export const inkSpan = rows => {
  let lo = CELLS, hi = 0;
  rows.forEach(r => [...r].forEach((c, x) => { if (c === '#') { lo = Math.min(lo, x); hi = Math.max(hi, x + 1); } }));
  return [lo, hi];
};

// The glyph as a canvas: black cells, and a one-pixel stroke in `tint` round
// the outside of the shape only. Outside is found by flooding from the margin,
// so a hole in the shape -- the carter's window, the belt's slots -- stays
// white rather than filling with color. `tint` null is no stroke; `done` draws
// the shape itself grey. `ink` is the shape's own color: black, or the shelf's
// short grey on a tile whose bill you cannot yet pay -- the stroke keeps its
// coin either way, since it is the rung's legend and not a verdict on it.
export const drawGlyph = (rows, tint = null, ink = '#000') => {
  const M = 2, W = CELLS * CELL + 2 * M, H = CELLS * CELL + 2 * M;
  const c = document.createElement('canvas');
  c.width = W; c.height = H; c.className = 'glyph';
  const g = c.getContext('2d');
  const solid = new Uint8Array(W * H);
  rows.forEach((r, y) => [...r].forEach((ch, x) => {
    if (ch !== '#') return;
    for (let j = 0; j < CELL; j++) for (let i = 0; i < CELL; i++) solid[(y * CELL + j + M) * W + x * CELL + i + M] = 1;
  }));
  if (tint && tint !== SHELF_INK.done) {
    const out = new Uint8Array(W * H); const q = [0]; out[0] = 1;
    while (q.length) {
      const k = q.pop(), x = k % W, y = (k - x) / W;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
        const n = ny * W + nx;
        if (out[n] || solid[n]) continue;
        out[n] = 1; q.push(n);
      }
    }
    g.fillStyle = tint;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (!out[y * W + x]) continue;
      let near = false;
      for (let dy = -1; dy <= 1 && !near; dy++) for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx, ny = y + dy;
        if (nx >= 0 && ny >= 0 && nx < W && ny < H && solid[ny * W + nx]) { near = true; break; }
      }
      if (near) g.fillRect(x, y, 1, 1);
    }
  }
  g.fillStyle = tint === SHELF_INK.done ? tint : ink;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (solid[y * W + x]) g.fillRect(x, y, 1, 1);
  // Centered on the ink: the canvas's left edge sits on the tile's center
  // line, and this pulls it left by exactly the ink's half-width.
  const [lo, hi] = inkSpan(rows);
  c.style.marginLeft = `${-(M + (lo + hi) / 2 * CELL)}px`;
  return c;
};
