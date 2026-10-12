// Counters keep apart: no two roster counters in the yard touch, each pair
// holds COUNTER_GAP of bare ground, the garage clears the house, and a crowd
// counter's buttons sit against its pips and stay under the pointer while it
// is pressed.

import { group, ok, state, run, openSites, yard } from './helpers.mjs';
import { COUNTER_GAP, COUNTER_TOP_DROP, GARAGE_W, P } from '../src/config.js';
import { rosterReport, postAt, posts, rosterHit } from '../src/roster.js';
import { garage } from '../src/crew/lifts.js';
import { houseRect } from '../src/house.js';

const S = yard.S;

// Every yard counter on the ground line, left to right, as [key, left, right].
const spans = () => rosterReport().filter(r => r.span && !posts().find(p => p.key === r.key).deep)
  .map(r => [r.key, r.span[0], r.span[1]]).sort((a, b) => a[1] - b[1]);

const gaps = () => {
  const s = spans(), out = [];
  for (let i = 1; i < s.length; i++) out.push([`${s[i - 1][0]}|${s[i][0]}`, s[i][1] - s[i - 1][2]]);
  return out;
};

group('no two counters touch, at the widest they get', async () => {
  window.__reset();
  openSites();
  window.__fullSites();
  window.__crew(40, 40);                      // both crowds past their twelve
  window.__kit({ carters: 5, breakers: 4, drivers: 14 });
  run(20);
  const g = gaps(), worst = g.reduce((a, b) => (b[1] < a[1] ? b : a), ['none', Infinity]);
  const h = houseRect(), ga = garage();
  return [
    ok(spans().some(s => s[0] === 'garage') && spans().some(s => s[0] === 'carry'), 'the garage and the carriers both show'),
    ok(worst[1] >= COUNTER_GAP, `every pair keeps ${COUNTER_GAP} apart`, JSON.stringify(g)),
    ok(ga.x + GARAGE_W < h.x, 'and the garage stands clear of the house', `${ga.x + GARAGE_W} against ${h.x}`)
  ];
});

group('a crowd counter hugs its pips, and the + stays under the pointer while it is pressed', async () => {
  window.__reset();
  openSites();
  window.__crew(9, 0);
  { const l = rosterReport().find(r => r.key === "mine").less; S.mouse = { x: l[0], y: l[1] }; run(0.1); for (let i = 0; i < 6; i++) rosterHit(l[0], l[1]); }
  run(10);
  const mine = () => rosterReport().find(r => r.key === 'mine');
  const wide3 = mine().span[1] - mine().span[0];
  const pips = mine().crowd.pips;
  const edge = (pips[0].at[0] - mine().span[0]) - P * 1;   // pip middle less the button column
  const [mx, my] = mine().more;
  S.mouse = { x: mx, y: my };
  const pressed = [];
  for (let i = 0; i < 2; i++) {
    const was = mine().more[0];
    rosterHit(S.mouse.x, S.mouse.y);
    run(0.1);
    pressed.push(mine().more[0] - was);
  }
  const at = mine().more;
  const moved = Math.abs(at[0] - mx);
  S.mouse = { x: mx - 2000, y: my };
  run(0.1);
  const after = mine().span[1] - mine().span[0];
  return [
    ok(wide3 <= 5 * P * 2 + 3 * (P * 3) + P, 'the strip is its three pips and the buttons, no more', `${wide3} n=${mine().n} pips=${mine().crowd.pips.length}`),
    ok(edge > 0, 'with the first pip right of the minus'),
    ok(pressed.every(d => d === 0) && moved === 0, 'the + does not move under a pointer that presses it twice',
       `${pressed} moved ${moved}`),
    ok(after > wide3, 'and the counter reflows once the pointer leaves', `${wide3} then ${after}`)
  ];
});

group('the -/+ stand level with the first row, and stay put as rows are added under it', async () => {
  window.__reset();
  openSites();
  window.__crew(3, 0);
  run(5);
  const mine = () => rosterReport().find(r => r.key === 'mine');
  const one = mine();
  window.__crew(16, 0);
  run(10);
  const three = mine();
  const rows = r => new Set(r.crowd.pips.map(q => q.at[1])).size;
  return [
    ok(rows(one) === 1 && rows(three) === 3, 'one row of diggers, then three', `${rows(one)} then ${rows(three)}`),
    ok(three.less[1] === one.less[1] && three.more[1] === one.more[1], 'the buttons do not move down as the block grows',
       `${one.less[1]} then ${three.less[1]}`),
    ok(three.crowd.block.y + COUNTER_TOP_DROP === three.less[1], 'and they are level with its first row',
       `${three.crowd.block.y + COUNTER_TOP_DROP} against ${three.less[1]}`)
  ];
});
