// The story's dialog since 2026-11-01 (DESIGN.md, "A dialog system"): a line
// read is remembered in `heard`, so a beat played again after a reload shows
// only the lines not yet read. A save from before has read none: a beat it
// has done never plays again, and a beat it was in when it closed had no
// lines to read, so an empty list is the whole truth.
export default {
  since: '2026-11-01',
  v: 36,
  says: 'the story\'s dialog: the lines read are remembered, none yet in a save from before',
  apply(s) {
    if (!Array.isArray(s.heard)) s.heard = [];
  }
};
