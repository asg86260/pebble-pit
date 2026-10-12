import { SHADES, SHARD_CELL, SPORE_CELL, SPARK_CELL, findKind } from '../config/view.js';

// The hole is shorter (config/pit.js): 600 columns became 234, at the same
// depth, and the world ends that much sooner past it. Two saved plots are
// laid out along that length, and both would be refused by a load that
// checks their size and laid again from nothing, flat.
//
// The pile is cut down to the new hole column by column, so it comes back
// the shape it was at the near end. What the new hole cannot hold is left on
// the counter, not spent and not dropped: on load `rehomeDust` (pit.js) fills
// the hole to the brim and sends the rest through the rift as eaten, and a
// hole that had not torn tears on screen for it, the way a full hole does
// when the next grain lands. Keeping the overfill in the hole until spent
// would be dust you own and cannot see.
//
// The ground's plot loses the columns past the new end of the world, which
// lay over the old hole's mouth and the pad past it. What was lying there
// had nowhere to lie but the hole, so it is banked as if it fell in, and the
// same load puts it in the pile or through the rift.
const OLD = { cols: 600, rows: 71 };                          // history, not knobs
const NEW = { cols: 234, hole: 46, heap: 25, slope: 0.12 };
const GONE = OLD.cols - NEW.cols;                              // ground columns the world lost

// Both codecs write "value x length" runs joined by dots.
function unruns(str, want) {
  const list = [];
  for (const part of String(str || '').split('.')) {
    const [v, len] = part.split('x').map(Number);
    if (!(len >= 0) || list.length + len > want) return null;
    for (let i = 0; i < len; i++) list.push(v);
  }
  return list.length === want ? list : null;
}
function runs(list) {
  const out = [];
  let run = list[0], len = 1;
  for (let i = 1; i < list.length; i++) {
    if (list[i] === run) { len++; continue; }
    out.push(run + 'x' + len);
    run = list[i];
    len = 1;
  }
  out.push(run + 'x' + len);
  return out.join('.');
}

function cutPile(s) {
  const sv = s.pit;
  if (!sv || sv.cols !== OLD.cols || sv.rows !== OLD.rows) return;
  const old = unruns(sv.heights, OLD.cols);
  if (!old) return;
  const kept = old.slice(0, NEW.cols);
  // The heap stands only over a full hole, leaning off to nothing at either
  // end, as `heapCeiling` in pit.js has it.
  const full = kept.every(h => h >= NEW.hole);
  const top = c => {
    if (!full) return NEW.hole;
    const fromEnd = Math.min(c, NEW.cols - 1 - c);
    return Math.ceil(NEW.hole + Math.min(NEW.heap, fromEnd * NEW.slope));
  };
  s.pit = { ...sv, cols: NEW.cols,
            heights: runs(kept.map((h, c) => Math.max(0, Math.min(h, top(c))))) };
}

// The ground's plot, row by row: each row keeps its near columns.
function cutGround(s) {
  const f = s.floor;
  if (!f || !(f.cols > GONE) || !(f.rows > 0)) return;
  const cells = unruns(f.cells, f.cols * f.rows);
  if (!cells) return;
  const cols = f.cols - GONE, out = [];
  for (let r = 0; r < f.rows; r++)
    for (let c = 0; c < f.cols; c++) {
      const v = cells[r * f.cols + c];
      if (c < cols) out.push(v);
      else if (v) fellIn(s, v);
    }
  s.floor = { ...f, cols, cells: runs(out) };
}

const COIN = { [SHARD_CELL]: 'shards', [SPORE_CELL]: 'spores', [SPARK_CELL]: 'sparks' };
function fellIn(s, v) {
  const open = !!s.riftOpen;
  if (v > 0 && v <= SHADES.length) {
    s.stored = (+s.stored || 0) + 1;
    s.banked = (+s.banked || 0) + 1;
    if (open) s.rift = (+s.rift || 0) + 1;
  } else {
    const key = COIN[findKind(v)];
    if (!key) return;
    s[key] = (+s[key] || 0) + 1;
    if (open) { s.riftHeld = s.riftHeld || {}; s.riftHeld[key] = (+s.riftHeld[key] || 0) + 1; }
  }
  if (open) s.riftAte = (+s.riftAte || 0) + 1;
}

export default {
  since: '2026-10-12',
  v: 16,
  says: 'the pit is a third as long; the pile and the ground are cut to it, and what the hole cannot hold goes through the rift on load',
  apply(s) {
    // Only a save laid out on the old length: a pile 600 columns long.
    if (s.pit && s.pit.cols !== OLD.cols) return;
    cutPile(s);
    cutGround(s);
  }
};
