// Act 3's loop, the grove and the press (DESIGN.md, "Acts 3 and 4", act 3,
// "The loop: the grove and the press"), on placeholder drawings. Reached the
// way a player reaches it wherever a player can: a click on a cloud or a tree
// through the place's click (`__afterClick`, what input.js calls), every row
// bought through `__buy`. The setup a check is not about goes through the
// act's hooks: coins granted, the crowd's rims set (`__afterCrowd`), the dev
// travel up (`__goPlace`), since the house's fall is not built.
import { group, ok, run, runUntil, yard, P } from './helpers.mjs';
import { CHOP_CLICKS, TREE_CHOPS, AFTER_LOGS_A_TREE, AFTER_SAWDUST_BRIM, CROWD_FILES, RIM_PIECES,
         MEET_MEMBERS, AFTER_GATES } from '../src/config.js';
import { stepAfter } from '../src/after/index.js';
import { crowdSpan } from '../src/render/after.js';

const S = yard.S;
const KEY = 'boulder-clicker/v4';
const read = () => window.__afterRead();

const up = () => { window.__actsOn(true); window.__goPlace('after'); run(1); };
// A click on a cloud of `kind` (any, with null), as the player makes it: on
// its middle. Waits a second for one to drift in if none is up.
function clickCloud(kind = 'white') {
  for (let k = 0; k < 20; k++) {
    const c = window.__afterClouds().find(q => !kind || q.kind === kind);
    if (c) return window.__afterClick(c.x, c.y);
    run(1);
  }
  return false;
}
const tree = i => window.__afterTrees()[i];
// The meeting reached, as the canvassers would reach it: the front rank made
// members, the setup a check about the chain is not about.
const members = n => window.__afterCrowd((i, v) => (i < n ? RIM_PIECES : v));

group('faith is counted where it lands, not on the click', async () => {
  up();
  const f0 = read().faith;
  const hit = clickCloud('white');
  const onClick = read().faith;
  run(10);
  const landed = read().faith;
  window.__actsOn(null);
  return [
    ok(hit, 'a click on a white cloud hits it'),
    ok(onClick === f0, 'nothing is counted on the click', `${f0} -> ${onClick}`),
    ok(landed > f0, 'the motes land on the plate and are counted there', `${f0} -> ${landed}`)
  ];
});

group('storm clouds give ink to the well', async () => {
  up();
  S.after.clouds.push({ id: 999, x: 1500, y: -700, size: 4, max: 4, kind: 'storm', vx: 0, age: 9, die: null });
  const ink0 = read().ink, hit = clickCloud('storm');
  run(10);
  window.__actsOn(null);
  return [ok(hit && read().ink > ink0, 'a storm cloud hit wrings ink, landing in the well', `${ink0} -> ${read().ink}`)];
});

group('the hand takes an axe after enough cloud hits, and a chop needs it', async () => {
  up();
  const t = tree(0);
  const early = window.__afterClick(t.x, t.y);
  let hits = 0;
  for (let k = 0; k < CHOP_CLICKS * 3 && read().clicks < CHOP_CLICKS; k++) { if (clickCloud(null)) hits++; run(0.25); }
  const before = read().axe;
  run(1);
  const after = read().axe;
  const chop = window.__afterClick(t.x, t.y);
  window.__actsOn(null);
  return [
    ok(!early, 'before the axe, a click on a tree does nothing'),
    ok(read().clicks >= CHOP_CLICKS, `${CHOP_CLICKS} cloud hits counted`, `${read().clicks}`),
    ok(after && S.beatsDone.includes('axe'), 'the axe beat plays and hands the axe over', `${before} -> ${after}`),
    ok(chop && S.after.plots[0].chops === 1, 'and from then on a click on a grown tree is a chop', `${S.after.plots[0].chops}`)
  ];
});

group('a chopped tree falls in held frames and lies as logs', async () => {
  up();
  S.after.axe = true;                      // the axe's own check is above
  const t = tree(2);
  for (let k = 0; k < TREE_CHOPS; k++) window.__afterClick(t.x, t.y);
  const falling = tree(2).falling, standing = tree(2).stage;
  run(0.5);
  const midFall = tree(2).falling;
  run(2);
  const p = S.after.plots[2];
  window.__actsOn(null);
  return [
    ok(falling && standing === 3, `${TREE_CHOPS} chops start it falling`, `falling ${falling}`),
    ok(midFall, 'it is still coming down half a second later: nothing pops'),
    ok(p.logs === AFTER_LOGS_A_TREE && p.stump && p.stage === 0, 'down, it lies as logs and leaves a stump',
       JSON.stringify(p)),
    ok(p.fell != null, 'its crown is still fading off', `${p.fell}`)
  ];
});

// The chain, bought row by row: the meeting's doors and hands, then the
// slowdown's. Shared by the chain, the support and the reload groups.
function buildChain() {
  up();
  members(MEET_MEMBERS + 24);
  run(1);
  window.__afterGrant({ faith: 5000, ink: 200 });
  const bought = [];
  for (const k of ['after-door-mill', 'after-door-workshop']) bought.push([k, window.__buy(k)]);
  for (const job of ['feller', 'feller', 'hauler', 'hauler', 'hauler', 'sawyer', 'sawyer', 'joiner', 'carrier', 'carrier', 'planter', 'gatherer'])
    bought.push([job, window.__buy(`after-hire-${job}`)]);
  return bought;
}

group('the chain makes timber and sawdust, then signs, and the heap brims until the paper mill', async () => {
  const bought = buildChain();
  const gate = read().gate;
  let brim = false, swept = false;
  for (let k = 0; k < 960; k++) {
    run(0.25);
    if (S.after.stock.sawdust >= AFTER_SAWDUST_BRIM) brim = true;
    if (S.after.bodies.some(b => b.load === 'sawdust')) swept = true;
  }
  const mid = read();
  // The slowdown, and its branch.
  window.__afterCrowd(0.45);
  window.__afterGrant({ timber: 100 });
  run(1);
  const gate2 = read().gate;
  const b2 = ['after-door-papermill', 'after-door-press', 'after-hire-pulper', 'after-hire-printer', 'after-hire-paster']
    .map(k => [k, window.__buy(k)]);
  window.__afterGrant({ ink: 200 });
  run(150);
  const end = read();
  window.__actsOn(null);
  return [
    ok(bought.every(([, b]) => b), 'the meeting\'s doors and hands are bought through their rows', JSON.stringify(bought.filter(([, b]) => !b))),
    ok(gate >= 1, 'the first meeting is reached', `${gate}`),
    ok(mid.timber > 0 || mid.signs > 0 || S.after.signs.length > 0, 'logs reach the mill and are sawn into timber', JSON.stringify(mid)),
    ok(brim && swept, 'the sawdust heaps to its brim and a sawyer sweeps it off the edge', `brim ${brim} swept ${swept}`),
    ok(S.after.signs.length > 0, 'the workshop makes signs and a carrier plants them in the crowd', `${S.after.signs.length}`),
    ok(gate2 === 2 && b2.every(([, b]) => b), 'the slowdown offers the paper mill and the press', `${gate2} ${JSON.stringify(b2)}`),
    ok(end.paper > 0 || end.posters > 0 || S.after.posters.length > 0, 'the paper mill pulps sawdust into paper', JSON.stringify(end)),
    ok(S.after.posters.length > 0, 'the press prints posters and a paster pastes them on the fence', `${S.after.posters.length}`)
  ];
});

group('signs, posters and word of mouth raise support', async () => {
  buildChain();
  const s0 = read();
  const inked0 = S.after.rims.split('').reduce((n, c) => n + Math.min(8, +c), 0);
  run(200);
  const s1 = read();
  const inked1 = S.after.rims.split('').reduce((n, c) => n + Math.min(8, +c), 0);
  window.__actsOn(null);
  return [
    ok(inked1 > inked0 + 50, 'the crowd\'s rims ink', `${inked0} -> ${inked1}`),
    ok(s1.support > s0.support, 'support rises', `${s0.support.toFixed(3)} -> ${s1.support.toFixed(3)}`)
  ];
});

group('the gates open in order and the strike falls due at its share', async () => {
  up();
  const gates = [];
  members(MEET_MEMBERS);
  run(1); gates.push(read().gate);
  // Two in five, and then the front made members up to just short of the
  // strike: word of mouth carries it over.
  window.__afterCrowd(0.42);
  run(1); gates.push(read().gate);
  const n = S.after.rims.length;
  window.__afterCrowd((i, v) => (i < Math.floor(n * 0.795) ? RIM_PIECES : i < n * 0.9 ? 6 : v));
  const due = runUntil(() => read().gate >= AFTER_GATES.length, 120);
  run(1);
  window.__actsOn(null);
  return [
    ok(gates[0] === 1 && gates[1] === 2, 'the meeting, then the slowdown', gates.join(' ')),
    ok(due, 'the spread carries the crowd over the strike\'s share', `${read().support.toFixed(3)}`),
    ok(S.beatsDone.includes('strike'), 'and the strike beat is owed and plays', S.beatsDone.filter(k => /strike|unmask/.test(k)).join(' '))
  ];
});

group('a reload mid-chain stands the afterlife back as it was', async () => {
  buildChain();
  run(60);
  yard.persist();
  const want = JSON.stringify(S.after);
  const bodies = S.after.bodies.map(b => ({ x: b.x, y: b.y, job: b.job }));
  window.__reload();
  const back = JSON.stringify(S.after);
  const moved = S.after.bodies.filter((b, i) => Math.hypot(b.x - bodies[i].x, b.y - bodies[i].y) > P || b.job !== bodies[i].job);
  run(10);
  const still = read();
  window.__actsOn(null);
  return [
    ok(back === want, 'every fact of the act comes back from the save', back.length + ' vs ' + want.length),
    ok(S.after.bodies.length === bodies.length && moved.length === 0, 'and every volunteer stands where it stood', `${moved.length} moved`),
    ok(still.bodies === bodies.length, 'and the loop runs on after it')
  ];
});

group('a big crowd costs the frame little, and only its files in view are drawn', async () => {
  up();
  const n = 24000;
  S.after.rims = '1'.repeat(n);
  run(1);
  const t0 = performance.now();
  const FR = 600;
  for (let k = 0; k < FR; k++) stepAfter({ now: 0, dt: 1000 / 60 });
  const ms = (performance.now() - t0) / FR;
  const span = crowdSpan();
  const files = span.f1 - span.f0 + 1;
  window.__actsOn(null);
  return [
    ok(ms < 1, `the afterlife's step with ${n} souls stays under a millisecond a frame`, `${ms.toFixed(3)} ms`),
    ok(files <= Math.ceil(S.viewW / (P * 4)) + 4 && files <= CROWD_FILES, 'the drawing walks only the files in view', `${files} files`)
  ];
});

group('a thunderhead hit is a burst', async () => {
  up();
  S.after.clouds.push({ id: 998, x: 1500, y: -700, size: 8, max: 8, kind: 'thunder', vx: 0, age: 9, die: null });
  const f0 = read().faith, hit = clickCloud('thunder');
  run(10);
  window.__actsOn(null);
  return [ok(hit && read().faith - f0 >= 6, 'a thunderhead gives several hits\' faith at once', `${f0} -> ${read().faith}`)];
});

group('the plate\'s card climbs in bands, and the puff rung pays more a hit', async () => {
  up();
  window.__afterGrant({ faith: 400, timber: 40 });
  const rows = () => Object.fromEntries(window.__afterRows().map(r => [r.key, r]));
  const bill0 = rows()['after-puff'].bill.map(([c]) => c).join('+');
  const bought = [0, 1, 2].map(() => window.__buy('after-puff'));
  const r = rows()['after-puff'];
  const bill2 = r.bill.map(([c]) => c).join('+');
  const f0 = read().faith;
  clickCloud('white');
  run(10);
  const gain = read().faith - f0;
  window.__actsOn(null);
  return [
    ok(bought.every(Boolean) && r.rung === 3, 'three rungs bought through the card', `${bought} rung ${r.rung}`),
    ok(bill0 === 'faith' && bill2 === 'faith+timber', 'the first band is faith, the second faith and timber', `${bill0} then ${bill2}`),
    ok(gain >= 4, 'a hit pays the rung\'s faith', `${gain}`),
    ok(!rows()['after-axe'].shown, 'the axe\'s ladder waits for the axe')
  ];
});

group('the fence sets the split of every log', async () => {
  up();
  members(MEET_MEMBERS + 4); run(1);
  window.__afterGrant({ faith: 500 });
  window.__buy('after-door-mill');
  window.__buy('after-hire-sawyer');
  const set = window.__afterDial('after-fence', 3);
  window.__afterGrant({ logs: 5 });
  const t0 = read().timber, d0 = read().sawdust;
  runUntil(() => read().logs === 0, 90);
  window.__actsOn(null);
  return [
    ok(set, 'the fence is a dial on the mill\'s card'),
    ok(read().timber - t0 === 15 && read().sawdust - d0 === 5, 'set fine, a log saws into three timber and one sawdust',
       `${read().timber - t0} timber, ${read().sawdust - d0} sawdust`)
  ];
});

group('the speech is warned, strips the half-won and keeps every member; wardens tear posters', async () => {
  up();
  // Every soul half-inked but the front rank, made members.
  window.__afterCrowd(i => (i < CROWD_FILES ? RIM_PIECES : 4));
  S.after.speech = { next: S.after.t + 8, f0: 0, held: null };
  S.after.posters.push({ id: 900, slot: 3, age: 0, torn: null });
  run(3);
  const warned = S.after.t >= S.after.speech.next - 6;
  const before = S.after.rims;
  run(6);
  const after = S.after.rims;
  const file1 = [0, 1, 2, 3].map(r => after[r * CROWD_FILES + 1]).join('');
  const far = after[5 * CROWD_FILES + 30];
  const torn = runUntil(() => !S.after.posters.some(p => p.id === 900), 120);
  window.__actsOn(null);
  return [
    ok(warned, 'the speech is warned ahead'),
    ok(file1 === '8000', 'souls in its sweep lose their open pieces, members keep theirs', file1),
    ok(+far >= 4, 'souls outside it keep theirs', far),
    ok(before !== after, 'the field changed'),
    ok(torn, 'a warden walks to the poster and tears it down')
  ];
});
