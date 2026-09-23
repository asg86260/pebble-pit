// The deep's purse moved from its floor to the crusher (DESIGN.md, "The
// crusher"). A save from the first pass of the deep counted every scale on
// the floor as money; it comes back with those scales crushed -- the account
// is what the floor held, and the floor is bare -- so nothing a player had is
// lost and nothing lying there is counted twice.
export default {
  since: '2026-09-23',
  v: 6,
  says: 'the deep\'s floor scales are crushed',
  apply(s) {
    const bed = s.deepBed;
    if (!bed || !Array.isArray(bed.heights)) return;
    s.scales = bed.heights.reduce((n, h) => n + (h | 0), 0);
    bed.heights = bed.heights.map(() => 0);
  }
};
