// The deep's boards: the scale is a coin, and the deep's ladders lead with it.
//
// What a player sees (docs/wave-party.md, "The boards"): the pods' board sells
// another pod and nothing else, paid in scales lifted off the deep's floor
// rather than out of the hole; no board sells a weapon, a door or the star any
// more; a station's ladder, on its rails, leads with scales and its second
// band adds the yard's dust on top; a station's board is its fighter's
// heading, keyed by the station's id; and the scales are on the counter's
// card and in the purse beside an open board once the yard has seen one.
//
// The setup is the snatch played (`__snatch`, then the yard's clock turned
// until it has) and scales laid on the bed (`__grant`, through the serpent's
// `__scales`); what the checks are about -- the pod -- is pressed through
// `__buy`, as a player presses it. The rails' own presses are
// test/rails.test.mjs.

import { group, ok, run, runUntil, yard } from './helpers.mjs';
import { TIER_BAND, rungDust, DUST_PER_SCALE, PARTY_IDS } from '../src/config.js';
import { countLines } from '../src/render/counter.js';
import { purseCoins } from '../src/board.js';
import { boardOf } from '../src/boardrows.js';
import { classLadder, DEEP_ROWS } from '../src/deep/rows.js';

const S = yard.S;
const row = key => window.__rows().find(r => r.key === key);
const coin = (bill, money) => (bill.find(([m]) => m === money) || [])[1] || 0;

// The snatch played, and a bed of scales to spend.
const down = (scales = 2000) => {
  window.__reset();
  window.__snatch();
  runUntil(() => S.snatched, 120);
  window.__grant({ scales });
  runUntil(() => S.scales >= scales, 30);
  run(0.5);
};

// The rows the deep's boards sold before the party (docs/wave-serpent.md).
const RETIRED = ['punch', 'brawl', 'unlockwell', 'unlockfont', 'unlockcircle', 'unlockspire',
                 'lance', 'lancehold', 'grenade', 'grenadepace', 'sigil', 'beam', 'curse',
                 'callstar', 'tunestar'];

group('a pod is paid in scales, lifted off the deep\'s floor', async () => {
  window.__reset();
  run(0.5);
  const hidden = !row('pod').shown;
  down();
  const offered = row('pod');
  const scales = S.scales, dust = S.stored;
  const pressed = window.__buy('pod');
  const paid = scales - S.scales;
  const lifted = S.lifting.length > 0;
  const dustAfter = S.stored;
  return [
    ok(hidden, 'the pods sell nothing before the snatch'),
    ok(offered.shown, 'and offer another pod once it has played'),
    ok(coin(offered.bill, 'scale') > 0 && coin(offered.bill, 'dust') === 0,
       'a pod asks scales and nothing else', JSON.stringify(offered.bill)),
    ok(pressed, 'the row can be pressed'),
    ok(paid === coin(offered.bill, 'scale'), 'the bed gives up exactly the bill', `${scales} -> ${S.scales}`),
    ok(lifted, 'and the scales paid are lifted off it, not counted away'),
    ok(dustAfter === dust, 'the hole is not touched', `${dust} -> ${dustAfter}`)
  ];
});

group('no board of the deep sells a weapon, a door or the star', async () => {
  down();
  window.__serpent({ stage: 3 });
  run(0.5);
  const rows = window.__rows().map(r => r.key);
  const back = RETIRED.filter(k => rows.includes(k));
  const pods = DEEP_ROWS.pods.map(u => u.key);
  return [
    ok(back.length === 0, 'none of the old rows is on any board', back.join(', ')),
    ok(Object.keys(DEEP_ROWS).join() === 'pods' && pods.join() === 'pod', 'the pods sell pods alone',
       `${Object.keys(DEEP_ROWS).join()} / ${pods.join()}`)
  ];
});

group("a station's board is its fighter's heading, keyed by the station's id", async () => {
  const boards = PARTY_IDS.map(id => boardOf(id));
  const heads = boards.map(b => b?.sections().map(s => s.title).join());
  return [
    ok(boards.every(b => b && b.rows().length === 0), 'every id has a board that sells no card'),
    ok(heads.every(h => h === 'the fighter'), 'its one heading is the fighter', heads.join(' | '))
  ];
});

group("the second band of a station's ladder adds the yard's dust to the scales", async () => {
  // A station at the top of its first band, which is where the rails' Buy
  // would stand after the band's rungs; the climb itself is test/rails.test.mjs.
  const st = { id: 's1', kind: 'altar', slot: 0, built: true, cls: 'brawler', rung: TIER_BAND, paid: [], fighter: null };
  const foot = classLadder({ ...st, rung: 0 }, 'brawler').bill().filter(([, n]) => n > 0);
  const bill = classLadder(st, 'brawler').bill().filter(([, n]) => n > 0);
  const scale = rungDust('brawler', TIER_BAND);
  return [
    ok(foot.length === 1 && coin(foot, 'scale') === rungDust('brawler', 0), 'the first band is scales alone', JSON.stringify(foot)),
    ok(coin(bill, 'scale') === scale, 'the second band still leads with scales', JSON.stringify(bill)),
    ok(coin(bill, 'dust') === scale * DUST_PER_SCALE, "and adds dust at the scale's rate", JSON.stringify(bill)),
    ok(!bill.some(([m]) => m === 'shard' || m === 'spark'), 'and nothing past it yet', JSON.stringify(bill))
  ];
});

group('the scales are on the counter and in the purse', async () => {
  window.__reset();
  run(0.5);
  const before = countLines().some(l => l.cell === 'scale') || purseCoins().some(([m]) => m === 'scale');
  down(300);
  run(2);                                          // the counts run to their figure
  const line = countLines().find(l => l.cell === 'scale');
  const purse = purseCoins().find(([m]) => m === 'scale');
  return [
    ok(!before, 'no scale is shown before the yard has seen one'),
    ok(line && line.text === String(S.scales), 'the counter carries the scales', line ? line.text : 'no line'),
    ok(purse && purse[1] === S.scales, 'and so does the purse', purse ? String(purse[1]) : 'no coin')
  ];
});
