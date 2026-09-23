// The objects on the shelf: one small sprite a row, in the yard's own alphabet
// ('#' rows, see sprites.js), eight cells square, drawn to a canvas at
// SHELF_GLYPH_CELL screen pixels a cell so it is crisp at any zoom.
//
// A glyph is the thing, never the effect. A row with no glyph of its own gets
// the crate, so a missing one is visible on the shelf rather than a blank.
import { SHELF_GLYPH_CELL as CELL, SHELF_GLYPH_CELLS as CELLS, SHELF_INK, SHELF_BADGE_HALO as BADGE_HALO, SHELF_BADGE_CELL as BCELL, SHELF_HAND_CELLS as HAND, SHELF_HAND_GAP as HAND_GAP, SHELF_HAND_SLIDE as HAND_SLIDE } from './config.js';

// The drawings, by the object's name; the review sheet (glyphs.html) says
// which are still wearing the crate.
export const GLYPHS = {
  sack:       ['########', '#......#', '#..##..#', '########', '#..##..#', '#......#', '#......#', '########'],
  planks:     ['........', '........', '###..###', '#..##..#', '#......#', '#......#', '#......#', '#......#'],
  net:        ['........', '........', '##.#.#.#', '#.#.#.##', '##.#.#.#', '#.#.#.##', '#......#', '#......#'],
  arch:       ['........', '...##...', '.######.', '###..###', '#......#', '#......#', '#......#', '#......#'],
  point:      ['........', '........', '........', '...##...', '..####..', '.######.', '........', '........'],
  lever:      ['........', '..###...', '.#...#.#', '#......#', '#....###', '#.......', '.#...#..', '..###...'],
  swing:      ['...##...', '##..##..', '.##..##.', '..##..##', '..##..##', '.##..##.', '##..##..', '...##...'],
  pickhead:   ['........', '..###...', '.#####..', '#..#..#.', '...#....', '...#....', '...#....', '...#....'],
  spark:      ['........', '.#...##.', '..#..##.', '...#....', '....#...', '.##..#..', '.##...#.', '........'],
  cracked:    ['##....##', '###..###', '.######.', '..####..', '..####..', '.######.', '###..###', '##....##'],
  boot:       ['........', '........', '........', '........', '.####...', '..##....', '..####..', '..####..'],
  cart:       ['........', '........', '........', '########', '#......#', '#......#', '########', '...##...'],
  belt:       ['........', '########', '#..#..#.', '.#..#..#', '.#..#..#', '#..#..#.', '########', '........'],
  lift:       ['........', '........', '.....#..', '.###.#..', '######..', '#....#..', '######..', '.#.#.###'],
  hoist:      ['........', '#......#', '#......#', '##....##', '##....##', '.#....#.', '.#.##.#.', '.######.'],
  furrow:     ['........', '.#...#..', '.##..##.', '.#...#..', '##..##..', '.#...#..', '.##..##.', '.#...#..'],
  die:        ['...#####', '...#...#', '...#.#.#', '#####..#', '#...####', '#.#.#...', '#...#...', '#####...'],
  hut:        ['########', '.##..##.', '.#....#.', '.######.', '.######.', '.#....#.', '.#....#.', '.#....#.'],
  bucket:     ['........', '........', '..#.....', '..#.....', '..#.....', '..#.....', '.###....', '.###....'],
  tower:      ['.#......', '###.....', '#.#.....', '###.#...', '######..', '#.##.#..', '######..', '#.####..'],
  door:       ['........', '........', '.######.', '.#....#.', '.#....#.', '.#....#.', '.#....#.', '.######.'],
  house:      ['........', '........', '........', '.#######', '..#####.', '..#...#.', '..#...#.', '..#...#.'],
  cap:        ['........', '........', '...#....', '...#....', '...#....', '...#....', '..###...', '..###...'],
  helmet:     ['.#####..', '#######.', '#.....#.', '..###...', '.#####..', '#..#..#.', '...#....', '...#....'],
  shovel:     ['..###...', '...#....', '...#....', '...#....', '...#....', '..###...', '..###...', '...#....'],
  ore:        ['........', '........', '........', '........', '...##...', '..####..', '.######.', '########'],
  jaw:        ['...##...', '...##...', '...##...', '########', '########', '.######.', '..####..', '...##...'],
  ear:        ['........', '..#.....', '..##....', '..#.....', '.##.....', '..#.....', '..##....', '..#.....'],
  pot:        ['########', '.######.', '########', '########', '########', '########', '.######.', '..#..#..'],
  ram:        ['........', '........', '........', '.#......', '.#......', '######.#', '#.######', '######.#'],
  hoe:        ['........', '........', '####....', '.###....', '.#......', '.#......', '.#......', '.#......'],
  tiller:     ['........', '........', '.....#..', '.....#..', '#.####..', '#######.', '#..##.#.', '.##..#..'],
  vial:       ['........', '........', '........', '........', '.##.....', '####....', '####....', '####....'],
  bowl:       ['........', '.#..#...', '..#..#..', '...#..#.', '#.#..#.#', '#......#', '########', '.######.'],
  star:       ['...#....', '...#....', '..###...', '..###...', '.#####..', '.#####..', '.#####..', '..###...'],
  wand:       ['.###....', '.#.#....', '.###....', '..#.....', '..#.....', '..#.....', '..#.....', '..#.....'],
  bolt:       ['....####', '...#####', '...#..##', '..##..##', '.#.####.', '#.#.#...', '.#.#....', '#.#.....'],
  dome:       ['........', '........', '........', '..####..', '.#....#.', '#......#', '#......#', '#......#'],
  chip:       ['........', '...##...', '..#..#..', '.#.##.#.', '.#.##.#.', '..#..#..', '...##...', '........'],
  balloon:    ['...##...', '..#..#..', '.#....#.', '.#....#.', '.#....#.', '..#..#..', '...##...', '...##...'],
  lamp:       ['........', '........', '........', '........', '...##...', '.######.', '........', '........'],
  brim:       ['........', '........', '........', '........', '..###...', '#######.', '........', '........'],
  crate:      ['...##...', '..####..', '.######.', '########', '#......#', '#.#..#.#', '#......#', '########'],
  shield:     ['#.#.#.#.', '########', '#......#', '#.####.#', '#.#..#.#', '#.####.#', '#......#', '########'],
  // the tower's machine: a shell round a star
  sphere:     ['..##....', '.#..#.#.', '.......#', '.#.##..#', '#..##.#.', '#.......', '.#.#..#.', '....##..'],
  hat:        ['........', '...##...', '..####..', '.######.', '########', '........', '........', '........'],
  // the casino's same-bet button: a turn, an arrow chasing its own tail
  again:      ['..####..', '.#....#.', '#......#', '#..#...#', '#...##.#', '#..####.', '.#......', '..####..'],
};

// The badges, in the top-right corner, saying what is being done to the
// object: more of it, a spell on it, or which coin it is about (docs/glyphs.md,
// "borrow the object, badge the how"). A finer grid than the drawing's, so a
// mark a third the drawing's size still has a shape.
export const BADGES = {
  up:     ['..#..', '.#.#.', '.....', '..#..', '.#.#.'],
  plus:   ['.....', '..#..', '.###.', '..#..', '.....'],
  star:   ['..#..', '.#.#.', '.....', '..#..', '.#.#.'],
  dust:   ['..###', '..###', '..###', '.....', '.....'],
  crop:   ['..#..', '.###.', '#####', '.###.', '..#..'],
  ore:    ['.....', '.....', '..#..', '.###.', '#####'],
  spark:  ['..#..', '..#..', '#####', '..#..', '..#..'],
};

// The glyph editor (glyphs.html) keeps its work in the browser; a dev build
// reads it over the tables above. Nothing of this ships.
export const OVERRIDES_KEY = 'boulder-clicker/glyphs';
if (import.meta.env && import.meta.env.DEV && typeof localStorage !== 'undefined') {
  try {
    const saved = JSON.parse(localStorage.getItem(OVERRIDES_KEY) || '{}');
    Object.assign(GLYPHS, saved.glyphs || {});
    Object.assign(BADGES, saved.badges || {});
  } catch { /* a bad save is no save */ }
}

// Every row on every shelf: the drawing it borrows and, if any, the badge.
// docs/glyphs.md as a table, so a row never names a picture in its own file.
export const GLYPH_OF = {
  // the bench
  props: ['planks'], net: ['net'], arch: ['arch'], askwizards: ['point'],
  carry: ['sack'], auto: ['lever'], speed: ['swing'], pick: ['pickhead'],
  autotoss: ['lever'], toss: ['swing', 'up'], reach: ['swing'],
  critchance: ['spark'], critmult: ['cracked'],
  haulcarry: ['sack'], haulpace: ['boot', 'up'], carter: ['cart'], driver: ['lift'], liftload: ['lift', 'plus'], liftpace: ['lift', 'up'], belt: ['belt'],
  unlockquarry: ['hoist'], unlockfarm: ['furrow'], unlockapothecary: ['pot'], unlockcasino: ['die'],
  unlockshack: ['hut'], unlockouthouse: ['bucket'], unlocktower: ['tower'], unlockfilter: ['balloon'],
  // the house and the closet
  crewlist: ['door'], house: ['house', 'plus'], loopost: ['cap', 'plus'],
  // the shack
  rockhandpick: ['pickhead'], rockhandspeed: ['swing'], breaker: ['helmet'], ram: ['ram'], tuneram: ['ram', 'plus'],
  // the quarry
  blaster: ['lamp', 'plus'], quarrybench: ['shovel', 'plus'], seam: ['ore', 'plus'], quarrypace: ['swing'], jaw: ['jaw'], tunejaw: ['jaw', 'plus'],
  // the farm
  farmplot: ['furrow', 'plus'], grower: ['brim', 'plus'], crop: ['ear', 'plus'], tend: ['hoe', 'up'], tiller: ['tiller'], tunetiller: ['tiller', 'plus'],
  // the apothecary
  potkeep: ['pot'], anotherpot: ['pot', 'plus'],
  bufflength: ['pot', 'plus'], brewdoses: ['vial', 'plus'],
  'potency-stew': ['bowl', 'plus'], 'potency-brace': ['spark', 'plus'], 'potency-strong': ['sack', 'plus'],
  // the tower
  wizard: ['point', 'plus'], wizspeed: ['wand', 'up'], wizpower: ['bolt'],
  spelldrive: ['ram', 'star'], spellluck: ['ore', 'star'], spellgmo: ['ear', 'star'], spellthrift: ['house', 'star'], spellsweep: ['cap', 'star'],
  dome: ['dome'], sphere: ['sphere'], tunesphere: ['sphere', 'plus'],
  // the air filter
  power: ['balloon', 'plus'], balloonspeed: ['balloon', 'up'], balloon: ['balloon'], recycler: ['lever'],
  // the casino
  chip: ['chip', 'plus'], stakedust: ['chip', 'dust'], stakeshard: ['chip', 'ore'], stakespore: ['chip', 'crop'],
  letgo: ['lever'], bank: ['sack', 'dust'], ride: ['die'],
  // the deep (docs/wave-serpent.md): borrowed drawings, standing in until the
  // deep's own are drawn in the glyph editor
  punch: ['swing'], brawl: ['swing', 'up'],
  unlockwell: ['bucket'], unlockfont: ['bowl'], unlockcircle: ['wand'], unlockspire: ['tower'],
  lance: ['bolt'], lancehold: ['bolt', 'plus'], grenade: ['chip'], grenadepace: ['chip', 'up'],
  sigil: ['wand', 'plus'], beam: ['wand'], curse: ['cracked'],
  callstar: ['star'], tunestar: ['star', 'plus'],
  gathercarry: ['sack'], gatherpace: ['sack', 'up'],
};

// A row's drawing; the crate while it is not made yet.
export const glyphFor = key => GLYPHS[(GLYPH_OF[key] || ['crate'])[0]] || GLYPHS.crate;
// Its badge's rows, if it wears one. Laid on in `drawGlyph` at the pixel, not
// the cell: a one-pixel halo round the badge's ink is all that is cut out of
// the drawing, since a whole cell cleared took the corner off the belt.
export const badgeFor = key => { const b = (GLYPH_OF[key] || [])[1]; return b && BADGES[b] || null; };
// Whether a row's drawing exists yet, for the review sheet.
export const drawn = key => !!GLYPHS[(GLYPH_OF[key] || ['crate'])[0]];

// The drawn cells' left and right edge, in cells: what the glyph is centered
// on, since the ink is often narrower than the box and off to one side.
export const inkSpan = rows => {
  let lo = CELLS, hi = 0;
  rows.forEach(r => [...r].forEach((c, x) => { if (c === '#') { lo = Math.min(lo, x); hi = Math.max(hi, x + 1); } }));
  return [lo, hi];
};

// The glyph as a canvas: `ink` cells, and a one-pixel stroke in `tint` round
// the outside of the shape only. Outside is found by flooding from the
// margin, so a hole in the shape stays white. `tint` null is no stroke. The stroke keeps
// its coin whatever the ink: it is the rung's legend, not a verdict on it.
//
// `built` is how many of the drawing's cells are up on a tile being built
// (DESIGN.md, "A tile being built shows the building"): laid bottom row
// first, left to right, the rest the shape's own one-pixel edge in ghost,
// the same outline the drawing wears everywhere else it is not yet up. Null
// is the whole drawing. The stroke goes round the cells that are up, so it
// grows with the fill (the owner, 2026-09-17: "only show the outline for the
// built cells? not the whole glyph"). `'plan'` is a thing in line: its
// outline and nothing inside -- the stroke round the whole drawing, or that
// same ghost edge when the rung has no coin.
export const cellsOf = rows => rows.reduce((n, r) => n + [...r].filter(ch => ch === '#').length, 0);
//
// `hands` are the bodies at the site (DESIGN.md, "A hand on the tile"): one
// `{ dy, chips, on }` a body. `dy` is pixels below the glyph's foot this
// frame, `chips` the specks its blows have thrown (`{ x, y, a }` off the
// body's top-left), `on` how far it has arrived, nought to one, drawn that
// faint and that far to the left of its place. The bodies stand on a margin
// added to the left of the canvas, which the anchor's margin below allows
// for, so the picture does not move when a hand arrives.
export const drawGlyph = (rows, tint = null, ink = '#000', badge = null, built = null, hands = []) => {
  const M = 2, L = hands.length ? (hands.length * (HAND + HAND_GAP) + HAND_SLIDE) * CELL : 0;
  // and a cell under the foot for them: a blow drops a body a cell below
  // where it stands
  const W = L + CELLS * CELL + 2 * M, H = CELLS * CELL + 2 * M + (hands.length ? CELL : 0);
  const c = document.createElement('canvas');
  c.width = W; c.height = H; c.className = 'glyph';
  const g = c.getContext('2d');
  const solid = new Uint8Array(W * H), ghost = new Uint8Array(W * H);
  const laid = [];
  rows.forEach((r, y) => [...r].forEach((ch, x) => { if (ch === '#') laid.push([x, y]); }));
  laid.sort((a, b) => b[1] - a[1] || a[0] - b[0]);
  const plan = built === 'plan';
  // The whole drawing's footprint, up or not: what a plan's stroke goes round.
  const shape = new Uint8Array(W * H);
  laid.forEach(([x, y], k) => {
    const up = built === null || (!plan && k < built);
    for (let j = 0; j < CELL; j++) for (let i = 0; i < CELL; i++) {
      const at = (y * CELL + j + M) * W + x * CELL + i + M + L;
      shape[at] = 1;
      if (up) solid[at] = 1;
    }
  });
  // The unbuilt part's edge, found on the shape rather than the outside, so
  // it is inside the footprint and the ink lands where the built cells will.
  // A plan with a stroke skips it: two rings read as a frame.
  if (built !== null && !(plan && tint)) {
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (!shape[y * W + x] || solid[y * W + x]) continue;
      const edge = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => !shape[(y + dy) * W + x + dx]);
      if (edge) ghost[y * W + x] = 1;
    }
  }
  // The badge, top-right: its ink, and a halo of BADGE_HALO pixels round it
  // knocked out of the drawing beneath.
  if (badge) {
    // on its own, finer grid, its top-right pixel on the drawing's
    const mark = new Uint8Array(W * H), ox = L + CELLS * CELL + M - badge[0].length * BCELL, oy = M;
    badge.forEach((r, y) => [...r].forEach((ch, x) => {
      if (ch !== '#') return;
      for (let j = 0; j < BCELL; j++) for (let i = 0; i < BCELL; i++) mark[(oy + y * BCELL + j) * W + ox + x * BCELL + i] = 1;
    }));
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (mark[y * W + x]) { solid[y * W + x] = 1; continue; }
      let near = false;
      for (let dy = -BADGE_HALO; dy <= BADGE_HALO && !near; dy++) for (let dx = -BADGE_HALO; dx <= BADGE_HALO; dx++) {
        const nx = x + dx, ny = y + dy;
        if (nx >= 0 && ny >= 0 && nx < W && ny < H && mark[ny * W + nx]) { near = true; break; }
      }
      if (near) solid[y * W + x] = 0;
    }
  }
  if (tint) {
    // Round the cells that are up (the badge cut into them on a finished
    // drawing); a plan has none, so round its whole footprint.
    const mass = plan ? shape : solid;
    const out = new Uint8Array(W * H); const q = [0]; out[0] = 1;
    while (q.length) {
      const k = q.pop(), x = k % W, y = (k - x) / W;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
        const n = ny * W + nx;
        if (out[n] || mass[n]) continue;
        out[n] = 1; q.push(n);
      }
    }
    g.fillStyle = tint;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (!out[y * W + x]) continue;
      let near = false;
      for (let dy = -1; dy <= 1 && !near; dy++) for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx, ny = y + dy;
        if (nx >= 0 && ny >= 0 && nx < W && ny < H && mass[ny * W + nx]) { near = true; break; }
      }
      if (near) g.fillRect(x, y, 1, 1);
    }
  }
  g.fillStyle = ink;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (solid[y * W + x]) g.fillRect(x, y, 1, 1);
  g.fillStyle = SHELF_INK.ghost;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (ghost[y * W + x]) g.fillRect(x, y, 1, 1);
  const [lo, hi] = inkSpan(rows);
  // The hands: the yard's square at this scale, each a body's width further
  // off the ink's left edge, on the ink's bottom row. Chips go over it on the
  // cell grid, off the body's resting place rather than its hop, so a chip
  // thrown does not ride the next swing.
  if (hands.length) {
    const foot = M + (laid.length ? Math.max(...laid.map(([, y]) => y)) + 1 : CELLS) * CELL;
    const side = HAND * CELL;
    hands.forEach((h, i) => {
      const on = h.on ?? 1, ease = 1 - (1 - on) * (1 - on);
      const x = M + L + lo * CELL - (i + 1) * (HAND + HAND_GAP) * CELL - Math.round((1 - ease) * HAND_SLIDE * CELL);
      const y = foot - side + Math.round(h.dy);
      // Four strips round a white middle, not a black square under a white
      // one: at half alpha the second shows through the first.
      g.globalAlpha = on;
      g.fillStyle = '#fff'; g.fillRect(x + 1, y + 1, side - 2, side - 2);
      g.fillStyle = '#000';
      g.fillRect(x, y, side, 1); g.fillRect(x, y + side - 1, side, 1);
      g.fillRect(x, y, 1, side); g.fillRect(x + side - 1, y, 1, side);
      g.globalAlpha = 1;
      g.fillStyle = '#000';
      for (const s of h.chips || []) {
        g.globalAlpha = Math.max(0, Math.min(1, s.a));
        g.fillRect(Math.round((x + s.x) / CELL) * CELL, Math.round((foot - side + s.y) / CELL) * CELL, CELL, CELL);
      }
      g.globalAlpha = 1;
    });
  }
  // Centered on the ink: the canvas's left edge sits on the tile's center
  // line, pulled left by the ink's half-width past the hands' margin.
  c.style.marginLeft = `${-(M + L + (lo + hi) / 2 * CELL)}px`;
  return c;
};
