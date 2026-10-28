// Act 3's piles are no numbers any more (DESIGN.md, "One resource system for
// every act", section 5): a pile's count is its strip's units on the ground,
// read off the cells, and the sawdust heap's is its grains. A save from before
// keeps `after.stock`, a copy of the pile counts (the ground it was read off
// is saved beside it and holds every unit) and the heap's grain count, which
// was the only record of the heap. Here the sawdust becomes a list to lay
// (`after.lay`, read by after/piles.js, `standPiles`) and `stock` goes.
const obj = v => v && typeof v === 'object' && !Array.isArray(v);

export default {
  since: '2026-10-28',
  v: 33,
  says: 'act 3\'s piles are read off the ground and the sawdust heap is saved as grains: the stock numbers are gone',
  apply(s) {
    const a = s.after;
    if (!obj(a)) return;
    if (obj(a.stock)) {
      const n = Math.max(0, Math.floor(+a.stock.sawdust || 0));
      if (n) a.lay = [...(Array.isArray(a.lay) ? a.lay : []), { what: 'sawdust', n }];
    }
    delete a.stock;
  }
};
