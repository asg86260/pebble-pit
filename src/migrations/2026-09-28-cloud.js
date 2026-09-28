// Cloud saves (DESIGN.md, "Cloud saves: a sync code and a worker"): every
// yard carries its own name and its length, which is how two copies of a slot
// are told apart and told which is newer. A save from before them gets a
// fresh name and nought played, which is right: it has never been in the
// cloud, so there is nothing for it to agree with.
import { mintYardId } from '../yardid.js';

export default {
  since: '2026-09-28',
  v: 7,
  // Nothing a player would notice; test/save-floor.test.mjs asks every
  // migration to say what it does all the same.
  says: 'every yard carries its name and how long it has been played',
  apply(s) {
    if (typeof s.yardId !== 'string' || !s.yardId) s.yardId = mintYardId();
    if (!Number.isFinite(s.playedS) || s.playedS < 0) s.playedS = 0;
  }
};
