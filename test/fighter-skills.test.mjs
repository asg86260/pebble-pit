// A station's board lists the skills its fighter has, under its name
// (deep/rails.js, `skillsOf`): its class's move from rung 4, its capstone
// from rung 8, nothing before the fork. Each says its line, a status in it
// said out. Climbed the player's way, through the board's rung rows
// (`pressBuy`); the pointer over a skill is the browser group `rails`
// (src/selftest/deep.js).

import { group, ok, yard } from './helpers.mjs';
import { FORK_RUNG, LADDER } from '../src/config.js';
import { railsOf, pressBuy, pressKind } from '../src/deep/rails.js';
import { stationById } from '../src/deep/party.js';

const S = yard.S;

const flush = () => {
  window.__scales(99999);
  window.__grant({ dust: 1e8, shards: 1e6, sparks: 1e5 });
};
// A rung's row pressed, its level-up let go so the next press is not held.
const buy = (st, cls = null) => { const got = pressBuy(st.id, cls); stationById(st.id).lvlAt = null; return got; };
const names = id => (railsOf(id).skills || []).map(k => k.name);

group('the board lists exactly the skills reached: none at rung 3, the move at 4, both at 8', async () => {
  window.__party({ stations: [{ kind: null }] });
  const [st] = S.stations;
  flush();
  const recruit = railsOf(st.id);
  pressKind(st.id, 'armory');
  stationById(st.id).lvlAt = null;
  for (let r = 2; r < FORK_RUNG; r++) buy(st);
  const at3 = { rung: stationById(st.id).rung, skills: names(st.id) };
  buy(st, 'ranger');
  const at4 = { rung: stationById(st.id).rung, skills: names(st.id) };
  while (stationById(st.id).rung < LADDER && buy(st));
  const board8 = railsOf(st.id);
  const at8 = { rung: stationById(st.id).rung, skills: names(st.id) };
  const cap = board8.skills.find(k => k.cap);
  return [
    ok(!recruit.skills?.length, 'a Recruit has none', JSON.stringify(recruit.skills)),
    ok(at3.rung === 3 && at3.skills.length === 0, 'a Scout at rung 3, before the fork, has none', JSON.stringify(at3)),
    ok(at4.rung === 4 && JSON.stringify(at4.skills) === '["Aimed shot"]', "a Ranger at rung 4 has her move", JSON.stringify(at4)),
    ok(at8.rung === 8 && JSON.stringify(at8.skills) === '["Aimed shot","Pinning shot"]', 'and at rung 8 her capstone too', JSON.stringify(at8)),
    ok(board8.skills[0].line === 'Aimed shot: charged arrow', "a skill's line is its name and what it does", board8.skills[0].line),
    ok(cap?.line === 'Pinning shot: Stun (holds still, stops healing)', 'a status in it is said out', cap?.line)
  ];
});
