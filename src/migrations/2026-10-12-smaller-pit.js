// The hole is a third as deep (config/pit.js): 46 rows of hole and 25 of heap
// became 14 and 8, across the same 600 columns. A saved pile is a profile of
// the old plot, which `pitFromSave` (persist.js) would refuse and the load
// would lay again from the near lip, flat. Here it is cut down to the new
// plot column by column instead, so the pile comes back the shape it was,
// only lower.
//
// What the new hole cannot hold is left on the counter, not spent and not
// dropped: on load `rehomeDust` (pit.js) fills the hole to the brim and sends
// the rest through the rift as eaten, and a hole that had not torn tears on
// screen for it, the way a full hole does when the next grain lands. Keeping
// the overfill in the hole until spent would be dust you own and cannot see.
const OLD = { cols: 600, rows: 71 };                          // history, not knobs
const NEW = { cols: 600, hole: 14, heap: 8, slope: 0.12 };

// The pile's codec writes "value x length" runs joined by dots.
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

export default {
  since: '2026-10-12',
  v: 16,
  says: 'the pit is a third as deep; a saved pile is cut down to the new hole and the rest goes through the rift on load',
  apply(s) {
    const sv = s.pit;
    if (!sv || sv.cols !== OLD.cols || sv.rows !== OLD.rows) return;
    const old = unruns(sv.heights, OLD.cols);
    if (!old) return;
    // The heap stands only over a full hole, leaning off to nothing at either
    // end, as `heapCeiling` in pit.js has it.
    const inHole = old.reduce((a, h) => a + Math.min(h, NEW.hole), 0);
    const full = inHole >= NEW.hole * NEW.cols;
    const top = c => {
      if (!full) return NEW.hole;
      const fromEnd = Math.min(c, NEW.cols - 1 - c);
      return Math.ceil(NEW.hole + Math.min(NEW.heap, fromEnd * NEW.slope));
    };
    s.pit = { ...sv, rows: NEW.hole + NEW.heap,
              heights: runs(old.map((h, c) => Math.max(0, Math.min(h, top(c))))) };
  }
};
