// The casino became the plinko: a pot stands in the hopper on the roof or in
// the tray at its foot, and the save names which. A pot from the wheel's day
// names no plot, and stands where a stake stands.
export default {
  since: '2026-09-15',
  v: 1,
  says: 'a pot stands in a named plot',
  apply(s) {
    if (s.pot && s.pot.cur && s.pot.where !== 'tray') s.pot.where = 'hopper';
  }
};
