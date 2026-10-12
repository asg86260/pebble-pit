// The finale (finale.js; docs/mocks/retire-2026-10-12.html, the owner's
// picks): after the kill her gear is hung back on her station, one of the
// deep's own crew takes it up, and the two of them go home through the portal
// and down the yard to its left end, where they stay, off the crew, for good.
//
// Reached the player's way where it can be: the party breaks the last defense
// itself, and the sheet is put down with its button's own call. The setup
// the checks are not about is the hooks': the yard past the snatch, the
// party, the crew.
import { group, ok, run, runUntil } from './helpers.mjs';
import { S } from '../src/state.js';
import { P, WORKER, SERPENT_PHASES, SERPENT_WOUND, FINALE_END_CELLS } from '../src/config.js';
import { TYPE, isDeepType } from '../src/jobs.js';
import { belowYard } from '../src/route.js';
import { migrate } from '../src/migrations/index.js';
import finale from '../src/migrations/2026-10-12-finale.js';

const LAST = SERPENT_PHASES - 1;

// A yard past the snatch with a crew of every kind up top, a party of two at
// the last defense, and a gatherer by the crusher.
function yardAtTheEnd() {
  window.__fullSites();
  window.__snatch({ played: true });
  window.__crew(3, 6, 3, 3, 0, 0);
  window.__party({ stations: [{ kind: 'altar', cls: 'sword', rung: 8 }, { kind: 'armory', cls: 'ranger', rung: 6 }] });
  window.__deepCrew({ spare: 2 });
  window.__serpent({ stage: LAST, wound: 0 });
  run(8);
  window.__serpent({ stage: LAST, wound: SERPENT_WOUND[LAST] * 0.95 });
}
// The party at it until the last defense goes, as a player's would.
const killed = () => runUntil(() => S.serpentFreed, 60);
const phase = () => S.finale && S.finale.phase;
const until = (fn, limit = 120) => { for (let i = 0; i < limit * 60 && !fn(); i++) run(1 / 60); return fn(); };

group('the kill: her gear hung on her station, and one of the deep\'s crew takes it up', async () => {
  yardAtTheEnd();
  // read afresh each time: the harness reads the yard back every few seconds
  const st0 = () => S.stations[0];
  const cls = st0().cls, rung = st0().rung, her = st0().fighter;
  const gatherers = S.workers.filter(w => w.type === TYPE.GATHER).map(w => w.uid);
  const died = killed();
  until(() => phase() === 'heart');
  const hung = st0().hung === true && !S.workers.some(w => w.uid === her);
  until(() => phase() === 'up');
  const st = st0(), heir = S.workers.find(w => w.uid === st.fighter);
  return [
    ok(died, 'the party breaks the last defense'),
    ok(hung, 'her gear is hung on the station and she is off it', `hung ${st.hung}`),
    ok(heir && gatherers.includes(heir.uid) && heir.type === TYPE.FIGHTER, 'a gatherer took the station',
       `${heir && heir.uid} of ${gatherers}`),
    ok(st.hung === false, 'and has taken up the gear', `hung ${st.hung}`),
    ok(st.cls === cls && st.rung === rung, 'the station keeps its class and rung', `${st.cls} ${st.rung}`)
  ];
});

group('the two of them leave the crew: not counted, not on a job, not in the deep\'s count', async () => {
  yardAtTheEnd();
  const crew0 = S.crew, deep0 = S.deepCrew, bodies0 = S.workers.length;
  killed();
  until(() => S.beat.sheet === 'freedsheet');
  window.__skipBeat('sheet');
  run(5);
  const deepBodies = S.workers.filter(w => isDeepType(w.type)).length;
  return [
    ok(S.crew === crew0 - 1 && S.workers.length === bodies0 - 1, 'the crew is one fewer: her, and he never joins it',
       `crew ${crew0} then ${S.crew}, bodies ${bodies0} then ${S.workers.length}`),
    ok(S.deepCrew === deep0 - 1 && deepBodies === S.deepCrew, "and the deep's count with it", `${deep0} then ${S.deepCrew}, ${deepBodies} on its jobs`),
    ok(S.retired && S.retired.x.length === 2, 'the two of them are kept apart from it', JSON.stringify(S.retired))
  ];
});

// Every body followed frame by frame through the whole finale: none moves
// further in one frame than a hurried step, and the two of them move only by
// walking or swimming -- except through the portal, which is the way between
// the halves.
group('nothing teleports through the finale', async () => {
  yardAtTheEnd();
  killed();
  until(() => S.beat.yard === 'finale');
  let jump = 0, who = '', pairJump = 0, at = '';
  const was = new Map();
  let pairWas = null;
  for (let i = 0; i < 120 * 60 && S.beat.yard === 'finale'; i++) {
    run(1 / 60);
    for (const w of S.workers) {
      const b = was.get(w.uid);
      if (b && !w.falling) {
        const d = Math.hypot(w.x - b.x, w.y - b.y);
        if (d > jump) { jump = d; who = `${w.type} ${w.uid} in ${phase()}`; }
      }
      was.set(w.uid, { x: w.x, y: w.y });
    }
    const pair = S.finale && S.finale.pair.filter(Boolean).map(o => ({ x: o.x, y: o.y }));
    if (pairWas && pair && pair.length === pairWas.length && phase() !== 'out') {
      pair.forEach((o, k) => {
        const d = Math.hypot(o.x - pairWas[k].x, o.y - pairWas[k].y);
        if (d > pairJump) { pairJump = d; at = phase(); }
      });
    }
    pairWas = phase() === 'through' ? null : pair;
  }
  return [
    ok(jump <= P * 3, 'no body jumps', `${jump.toFixed(1)}px, ${who}`),
    ok(pairJump <= P * 3, 'and nor do the two of them', `${pairJump.toFixed(1)}px in ${at}`)
  ];
});

// The crowd falls in behind and the rest of the yard stands still; nothing
// is banked while it plays and its sheet is up; put down, the crowd walks
// home and the hole fills again.
group('work stands still through the finale and its sheet, and goes again after', async () => {
  yardAtTheEnd();
  killed();
  until(() => phase() === 'walk');
  run(3);
  const still = new Map(S.workers.filter(w => !w.parade && !belowYard(w)).map(w => [w.uid, { x: w.x, y: w.y }]));
  const banked0 = S.banked;
  until(() => S.beat.sheet === 'freedsheet');
  run(3);
  const moved = S.workers.filter(w => still.has(w.uid) && !w.parade
    && Math.hypot(w.x - still.get(w.uid).x, w.y - still.get(w.uid).y) > 1).length;
  const paraded = S.workers.filter(w => w.parade).length;
  const banked1 = S.banked;
  window.__skipBeat('sheet');
  const home = runUntil(() => S.banked > banked1 + 5, 60);
  return [
    ok(paraded >= 4, 'the crew falls in behind them', `${paraded} in the procession`),
    ok(moved === 0, 'everybody else stands where they were', `${moved} of ${still.size} moved`),
    ok(banked1 === banked0, 'and nothing goes in the hole', `${banked0} then ${banked1}`),
    ok(!S.workers.some(w => w.parade), 'the sheet put down, the procession is over'),
    ok(home, 'and the work goes on again', `${banked1} then ${S.banked}`)
  ];
});

group('afterwards the two of them stay at the yard\'s left end, and a reload keeps them there', async () => {
  yardAtTheEnd();
  killed();
  until(() => S.beat.sheet === 'freedsheet');
  window.__skipBeat('sheet');
  run(20);
  const near = () => S.retired && S.retired.x.every(x => x < (FINALE_END_CELLS + 20) * P);
  const before = near();
  window.__reload();
  run(1);
  const after = near();
  const crew = S.crew, n = S.workers.length;
  return [
    ok(before, 'at the left end', JSON.stringify(S.retired)),
    ok(after, 'and still there after a reload', JSON.stringify(S.retired)),
    ok(!S.finale && !S.beat.yard && !S.beat.sheet, 'with nothing replayed', `${phase()} ${JSON.stringify(S.beat)}`),
    ok(crew === n, 'the crew read back is its bodies, the two of them not among them', `${crew} ${n}`)
  ];
});

group('the two of them cannot be put on a job', async () => {
  yardAtTheEnd();
  killed();
  until(() => S.beat.sheet === 'freedsheet');
  window.__skipBeat('sheet');
  run(2);
  const spots = JSON.stringify(S.retired.x.map(x => Math.round(x / P)));
  const crew = S.crew;
  // every job the roster has, asked for: the spare hands answer, never them
  for (const job of ['quarriers', 'farmhands', 'rockhands', 'janitors']) window.__assign(job, 1);
  run(5);
  const mid = S.retired.x.map(x => x + WORKER / 2);
  const onThem = S.workers.filter(w => mid.some(m => Math.abs(w.x + WORKER / 2 - m) < 1)).length;
  return [
    ok(S.crew === crew, 'no count takes them in', `${crew} then ${S.crew}`),
    ok(!S.workers.some(w => w.uid == null), 'every body on the crew is one of the crew'),
    ok(S.retired && S.retired.x.length === 2, 'and they are where they were, idling', spots)
  ].concat(onThem > 2 ? [ok(false, 'a body stands in for them', `${onThem}`)] : []);
});

// A reload in the middle lands at the end: the two of them at the left end,
// the kill and the finale played, her off the crew, the sheet still to come.
group('a reload mid-finale lands at its end', async () => {
  yardAtTheEnd();
  const crew0 = S.crew;
  killed();
  until(() => phase() === 'walk');
  run(2);
  window.__reload();
  run(1 / 60);
  const done = S.beatsDone.includes('freed') && S.beatsDone.includes('finale');
  run(1);
  return [
    ok(done, 'the kill and the finale are played', S.beatsDone.join()),
    ok(S.retired && S.retired.x[0] === FINALE_END_CELLS * P, 'the two of them at the left end', JSON.stringify(S.retired)),
    ok(S.crew === crew0 - 1, 'her off the crew', `${crew0} then ${S.crew}`),
    ok(S.beat.sheet === 'freedsheet', 'and the sheet comes up', JSON.stringify(S.beat))
  ];
});

// A save from before the finale, past the kill: the two of them put at the
// left end and off the counts, her station's gear hung up for its next hand.
group('an old save past the kill gets the two of them at the left end, off the count', async () => {
  const s = {
    saveV: finale.v - 1, crew: 5, deepCrew: 3, serpentFreed: true, snatched: true,
    beatsDone: ['show', 'freed', 'freedsheet'],
    stations: [{ id: 's1', kind: 'altar', slot: 0, built: true, cls: 'sword', rung: 8, paid: [], fighter: 'u9' }],
    who: [{ type: 'hauler', uid: 'u1' }, { type: 'hauler', uid: 'u2' },
          { type: 'fighter', uid: 'u9', station: 's1' }, { type: 'gatherer', uid: 'u7', deepHome: true },
          { type: 'gatherer', uid: 'u8', deepHome: true }]
  };
  migrate(s);
  return [
    ok(s.beatsDone.includes('finale'), 'the finale is had', s.beatsDone.join()),
    ok(s.retired && s.retired.x[0] === FINALE_END_CELLS * P, 'the two of them at the left end', JSON.stringify(s.retired)),
    ok(!s.who.some(w => w.uid === 'u9' || w.uid === 'u8'), 'her and him off the crew', s.who.map(w => w.uid).join()),
    ok(s.crew === 3 && s.deepCrew === 1, 'and off the counts', `${s.crew} ${s.deepCrew}`),
    ok(s.stations[0].fighter === null && s.stations[0].hung === true, 'her gear hung on her station', JSON.stringify(s.stations[0]))
  ];
});
