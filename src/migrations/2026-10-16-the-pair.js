// The game names the two of them (wardrobe.js): which body is the sqwife and
// which the sqhusband, and what each wears. A save from before kept no
// names, so the bodies that best stand for them are named here off the raw
// list -- him the oldest body of the yard (the lowest uid, the first made:
// the opening's survivor, in any yard that has not lost him), her the first
// station's fighter once she is in the deep, else the oldest body that is
// not him -- and whatever this cannot settle (a list with no uids, from
// before bodies had them) is settled the same way once the yard is stood
// (`keepPair`). Such a yard has been played, so the picker is not offered as
// if it were a new one; its two wear the defaults until it is opened.

const num = u => (typeof u === 'string' && u[0] === 'u' ? +u.slice(1) || 0 : 0);
const oldest = (list, not) => {
  let best = null;
  for (const k of list) {
    if (!k || typeof k.uid !== 'string' || k.uid === not) continue;
    if (!best || num(k.uid) < num(best.uid)) best = k;
  }
  return best ? best.uid : null;
};

export default {
  since: '2026-10-16',
  v: 23,
  says: 'the two of them are named among the crew, and the picker is not offered to a yard already played',
  apply(s) {
    if (s.dressOffered == null) s.dressOffered = true;
    if (s.pairIds && typeof s.pairIds === 'object') return;
    const who = Array.isArray(s.who) ? s.who : [];
    const done = Array.isArray(s.beatsDone) ? s.beatsDone : [];
    let him = null, her = null;
    if (done.includes('show') && !s.snatched) him = oldest(who.filter(k => k && !k.deepHome), null);
    if (s.rescued && !s.retired) {
      const st = Array.isArray(s.stations) ? s.stations[0] : null;
      her = s.snatched ? (st && typeof st.fighter === 'string' ? st.fighter : oldest(who.filter(k => k && k.deepHome), null))
                       : oldest(who, him);
    }
    s.pairIds = { her, him };
  }
};
