// The finale after the kill (finale.js): the two of them leave the crew and
// go home to the yard's left end for good, her gear hung on her station for
// the next hand. A save already past the kill has had its ending, so the
// finale is marked had and its end is laid as the finale would leave it:
// her off the crew and off her station, its gear hung up; him off the crew
// as well -- he came out of the belly the deep's one more gatherer, the last
// such on the list -- and the two of them at the left end, idling.
import { P } from '../config/yard.js';
import { TYPE } from '../jobs.js';
import { WORKER } from '../config/crew.js';
import { FINALE_END_CELLS, FINALE_PAIR_GAP, RETIRED_TURN_S } from '../config/finale.js';

export default {
  since: '2026-10-12',
  v: 17,
  says: 'a yard past the kill has had the finale: the two of them at the left end, off the crew, her gear hung on her station',
  apply(s) {
    const done = Array.isArray(s.beatsDone) ? s.beatsDone : [];
    if (!done.includes('freed')) return;
    if (!done.includes('finale')) done.push('finale');
    s.beatsDone = done;
    if (s.retired) return;
    const who = Array.isArray(s.who) ? s.who : [];
    const drop = w => {
      who.splice(who.indexOf(w), 1);
      s.crew = Math.max(0, (s.crew | 0) - 1);
      s.deepCrew = Math.max(0, (s.deepCrew | 0) - 1);
    };
    const st = Array.isArray(s.stations) ? s.stations[0] : null;
    const her = st && st.fighter && who.find(w => w && w.uid === st.fighter);
    if (her) { drop(her); st.fighter = null; st.hung = true; }
    const him = [...who].reverse().find(w => w && w.type === TYPE.GATHER && w.deepHome);
    if (him) drop(him);
    const x = FINALE_END_CELLS * P;
    s.retired = { x: [x, x + WORKER + FINALE_PAIR_GAP], mode: 'sit', left: RETIRED_TURN_S[0], u: 0, home: x };
  }
};
