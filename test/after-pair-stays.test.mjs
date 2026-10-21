// The pair stay up on the pedestal (the owner, 2026-10-20: "the Couple still
// arent rendered on the pedestal"). They are the act's leads and never come
// down to build; a station bought with nobody in the camp is raised by
// members off their posts (after/build.js, `fillBuilders`). Played two ways
// through the act's first fifteen minutes, every row bought through `__buy`:
// act3-pace's player, and an owner who buys early -- every post the camp can
// fill and every station the moment it opens, which empties the camp before
// the first station is ordered. The clock turns through `run`, so the act is
// reloaded every five seconds as well.
import { group, ok, run, yard } from './helpers.mjs';
import { playAct3 } from '../tools/node/act3-player.mjs';
import { pairSpeaking } from '../src/after/bubbles.js';

const S = yard.S;
const MINUTES = 15, SHARE = 0.95;
const pct = v => `${(v * 100).toFixed(1)}%`;

// Seconds the pair stand up there, over seconds turned.
function share(step) {
  let on = 0, all = 0;
  return { tick: s => { step(s); all += s; if (pairSpeaking()) on += s; }, get: () => (all ? on / all : 0) };
}

group("act3-pace's player: the pair stand on the pedestal through the act's first fifteen minutes", async () => {
  const s = share(run);
  const r = playAct3({ minutes: MINUTES, tick: s.tick });
  const stations = r.bought.filter(b => b.key.startsWith('after-build')).length;
  window.__actsOn(null);
  return [
    ok(stations > 0, 'the player orders stations on the shack', `${stations}`),
    ok(s.get() >= SHARE, `the pair are up there at least ${pct(SHARE)} of the time`, pct(s.get()))
  ];
});

group('an owner who buys early: every member put on a job, the stations still raised and the pair still up', async () => {
  window.__reset();
  window.__actsOn(true);
  window.__actsAt('fallen');
  window.__goPlace('after');
  const ROWS = ['after-axe', 'after-seat-hauler', 'after-seat-woodcutter', 'after-seat-carrier',
                'after-build-mill', 'after-build-chipper', 'after-build-workshop'];
  const JOBS = ['hauler', 'woodcutter', 'carrier'];
  const idle = () => S.after.camp + S.after.bodies.filter(b => b.job == null && b.state === 'work' && b.pair == null).length;
  const s = share(run);
  let emptied = false;
  for (let t = 0; t < MINUTES * 60; t += 0.5) {
    // The coins are the setup this check is not about; the yard's topped up
    // a half minute at a time, since every grant lays its coins in the hole.
    if (t % 30 === 0) window.__grant({ dust: 5e5, spores: 2e5, shards: 2e5, scales: 2e4, sparks: 2e4 });
    window.__afterGrant({ rebel: 2000, timber: 200, paper: 100 });
    // Every member put on a job the moment one is idle, a seat bought
    // whenever a job's are full.
    for (const j of JOBS) window.__afterPress(j);
    for (const k of ROWS) {
      if (k.startsWith('after-build') && idle() === 0) emptied = true;
      window.__buy(k);
    }
    s.tick(0.5);
  }
  const raised = ['mill', 'chipper'].filter(k => S.after.built.includes(k));
  window.__actsOn(null);
  return [
    ok(emptied, 'a station is ordered with nobody idle'),
    ok(raised.length === 2, 'and the stations ordered then still stand', raised.join(' ')),
    ok(s.get() >= SHARE, `the pair are up there at least ${pct(SHARE)} of the time`, pct(s.get()))
  ];
});

// The owner's save of 2026-10-20: the refusal marked played with the pair
// left standing in the camp (`at: 'camp'`, no route), so they never spoke,
// no member joined, and every post bought stood empty. Wherever the story
// leaves them, they walk back up.
group("a save with the refusal played and the pair left in the camp: they walk back up and speak", async () => {
  window.__actsAt('fallen');
  S.acts.pair = { x: 2082, y: -258, route: null, leg: 1, hold: null, carry: 0, mode: 'soul', rims: 0, face: 1, lift: 1, inside: 0, at: 'camp' };
  const before = pairSpeaking();
  run(120);
  const r = [
    ok(!before, 'the pair start off the pedestal, silent'),
    ok(S.acts.pair.at === 'pedestal', 'the pair are back on the pedestal', S.acts.pair.at),
    ok(pairSpeaking(), 'the pair speak again')
  ];
  window.__actsOn(null);
  return r;
});
