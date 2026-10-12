// The board of times is gone from the game (the owner, 2026-10-12): no run
// is named, pinged or posted. A save's run id and any post still waiting to
// go up are dropped.
export default {
  since: '2026-10-12',
  v: 18,
  says: 'the board of times is gone: the run id and a waiting post are dropped',
  apply(s) {
    delete s.runId;
    delete s.timePending;
  }
};
