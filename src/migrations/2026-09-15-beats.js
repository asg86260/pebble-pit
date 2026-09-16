import { BEATS } from '../beats.js';

// The story's progress was six flags; it is the set of beats that have played
// (beats.js). A save from before the opening existed with nobody hired is a
// game that has not started; `reunionDone` came in after the second rock
// could already have fallen; `storyTold` came in after the rescue could
// already have happened, and a sheet weeks later is not the moment; the
// rescue's own fact marks its beat. A scene the last sitting closed the tab
// on (`cineOwed`) is the running camera beat, played once over the event as
// it now stands.
const chain = from => {
  const keys = [];
  for (let row = BEATS.find(r => r.key === from); row; row = BEATS.find(r => r.key === row.next)) keys.push(row.key);
  return keys;
};

export default {
  since: '2026-09-15',
  v: 1,
  says: 'the six story flags became the set of beats',
  apply(s) {
    if (!Array.isArray(s.beatsDone)) {
      const done = new Set();
      if (!!s.introDone || (s.crew ?? 0) > 0) for (const k of chain('leave')) done.add(k);
      if (s.reunionDone ?? ((s.boulderNo ?? 1) > 1)) for (const k of chain('meet')) done.add(k);
      if (s.rescued) done.add('rescue');
      if ('storyTold' in s ? !!s.storyTold : !!s.rescued) done.add('ending');
      s.beatsDone = [...done];
    }
    if (!s.beat && typeof s.cineOwed === 'string') s.beat = { camera: s.cineOwed };
    delete s.introDone; delete s.reunionDone; delete s.storyTold; delete s.cineOwed;
  }
};
