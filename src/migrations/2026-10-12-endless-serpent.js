// The endless serpent (DESIGN.md, "Endless serpent"): the level fought, the
// best reached and the fangs the kills have dropped. An older save is at the
// story's serpent with no kill's fang dropped -- the defaults, and nothing
// else. A save past the kill is not handed level 2: it rises there on screen
// (deep/serpent.js, `rise`), and the rise drops the story kill's fang the old
// build never dropped (deep/party.js, `dropKillFang`).
export default {
  since: '2026-10-12',
  v: 19,
  says: 'the serpent has a level, a best level and the kills\' fangs, from the story\'s serpent',
  apply(s) {
    if (!Number.isInteger(s.serpentLevel)) s.serpentLevel = 1;
    if (!Number.isInteger(s.serpentBest)) s.serpentBest = s.serpentLevel;
    if (!Number.isInteger(s.killFangs)) s.killFangs = 0;
  }
};
