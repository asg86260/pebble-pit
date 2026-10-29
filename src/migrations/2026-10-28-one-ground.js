// Act 3's goods are units of one ground since 2026-10-28 (DESIGN.md, "One
// resource system for every act", section 6): a pile is a strip of the
// ground and its count is read off its cells, and a good lying on the floor
// is a block on it rather than a row of a list. A save from before keeps
// each pile as a number (`after.stock`), each lying good as a row
// (`after.groundLogs`), and the saw caught mid-trip with a log in its
// sawyer's arms and grains in the air. Here, on the raw save, all of it
// becomes a list to lay (`after.lay`): a pile's count, or a kind and the x
// it lay at. The act's reader lays the list onto the ground once the place
// is laid out (after/piles.js, `standPiles`), settled before the first
// frame, every unit where it was or beside its pile past the brim: nothing
// a player had is lost. The pile counts are zeroed here, since the ground
// they are read off starts empty.
//
// The saw's log on its bed and the blocks on its chute stay the saw's own
// state, read as they were. The log in the sawyer's arms is laid on the
// ground at the saw mill's door (the reader resolves `near`), its trip sent
// back to the wheel; its grains in the air are on the heap, which is counted.
const obj = v => v && typeof v === 'object' && !Array.isArray(v);
// The counted piles of that day, by their stock keys (config/afterpiles.js).
const PILED = ['logs', 'grovelogs', 'timber', 'benchtimber', 'signs'];
// The sawyer's trip phases with a log in its hands (after/mill.js, `held`).
const holding = tr => obj(tr) && (tr.ph === 'carry' || (tr.ph === 'lift' && obj(tr.log)) || (tr.ph === 'set' && !tr.down));

export default {
  since: '2026-10-28',
  v: 31,
  says: 'act 3\'s goods are blocks on one ground: a save\'s pile counts, lying goods and the sawyer\'s log are laid on it',
  apply(s) {
    const a = s.after;
    if (!obj(a)) return;
    const lay = Array.isArray(a.lay) ? a.lay : [];
    if (obj(a.stock)) {
      for (const what of PILED) {
        const n = Math.max(0, Math.floor(+a.stock[what] || 0));
        if (n) lay.push({ what, n });
        if (what in a.stock) a.stock[what] = 0;
      }
    }
    if (Array.isArray(a.groundLogs)) {
      for (const q of a.groundLogs) if (obj(q) && Number.isFinite(+q.x)) lay.push({ kind: q.kind || 'log', x: +q.x });
    }
    delete a.groundLogs;
    const saw = a.saw;
    if (obj(saw)) {
      if (holding(saw.trip)) { lay.push({ kind: 'log', near: 'mill' }); saw.trip = { ph: 'back', t: 0 }; }
      if (Array.isArray(saw.dust) && saw.dust.length) {
        if (obj(a.stock)) a.stock.sawdust = (+a.stock.sawdust || 0) + saw.dust.length;
        saw.grains = (+saw.grains || 0) + saw.dust.length;
        saw.dust = [];
      }
    }
    a.lay = lay;
    a.ground = null;
  }
};
