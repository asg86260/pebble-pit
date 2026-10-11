// The first muck's scene is for the first storm's muck. A save that has
// already had a muck storm lived through it without the scene, so it is
// marked had and the scene never plays over a yard that is long past it.
export default {
  since: '2026-10-11',
  v: 12,
  says: 'a yard that has had a muck storm skips the first muck scene',
  apply(s) {
    if (!(s.tally && (s.tally.muckRains | 0) >= 1)) return;
    if (!Array.isArray(s.beatsDone)) s.beatsDone = [];
    if (!s.beatsDone.includes('firstmuck')) s.beatsDone.push('firstmuck');
  }
};
