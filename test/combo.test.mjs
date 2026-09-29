// A fighter's combo (DESIGN.md, "A fighter's combo"): the quick hits of a
// string come closer than the class's `every`, a rest follows the big hit or
// the string's last, and the whole keeps the average of an even beat -- the
// same damage a second. Bought on its rail, as a player does.

import { group, ok, yard } from './helpers.mjs';
import { CLASSES } from '../src/config.js';
import { climb, openEveryClass } from './party-press.mjs';

const S = yard.S;

function fight(kind, cls, rung) {
  window.__snatch({ played: true });
  window.__serpent({ stage: 3, wound: 0 });
  window.__party({ stations: [{ kind, cls: null, rung: 0 }] });
  openEveryClass();
  return climb(S.stations[0].id, cls, rung);
}
// The moments its swings began over `s` seconds, frame by frame.
function swings(s) {
  const at = [];
  let pose = null;
  for (let f = 0; f < s * 60; f++) {
    yard.fast(1 / 60);
    const w = S.workers.find(o => o.station === S.stations[0].id);
    if (w && w.pose && w.pose !== pose && w.pose.move) { pose = w.pose; at.push(pose.at); }
  }
  return at;
}

for (const [kind, key, rung] of [['altar', 'brawler', 4], ['well', 'martial', 4], ['armory', 'ranger', 4], ['armory', 'assassin', 4]]) {
  group(`the ${key}'s combo: quick hits, a rest, the same pace on average`, async () => {
    fight(kind, key, rung);
    swings(3);
    const at = swings(24), every = CLASSES[key].every * 1000;
    const gaps = at.slice(1).map((t, i) => t - at[i]);
    const mean = (at[at.length - 1] - at[0]) / Math.max(1, gaps.length);
    return [
      ok(gaps.length >= 8, 'it keeps swinging', gaps.length),
      ok(Math.min(...gaps) < every * 0.7, 'a string\'s hits come quicker than an even beat', `${Math.round(Math.min(...gaps))} ms, every ${every}`),
      ok(Math.max(...gaps) > every * 1.4, 'and a rest follows', `${Math.round(Math.max(...gaps))} ms`),
      ok(Math.abs(mean - every) < every * 0.12, 'at the same pace on average', `${Math.round(mean)} ms against ${every}`)
    ];
  }, { reload: false });
}
