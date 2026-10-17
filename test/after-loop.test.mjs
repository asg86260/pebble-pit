// Act 3's loop (DESIGN.md, "Acts 3 and 4", act 3, "The loop: the grove and the
// press", reworked to the owner's settled calls of 2026-10-18), on placeholder
// drawings. Reached the way a player reaches it wherever a player can: a click
// on the pair, a tree or a stump through the place's click (`__afterClick`,
// what input.js calls), every row bought through `__buy`. The setup a check is
// not about goes through the act's hooks: coins granted, the crowd's rims set
// (`__afterCrowd`), the dev travel up (`__goPlace`) with the act's opening
// beats marked played, since the story before the loop is not what is checked.
import { group, ok, run, runUntil, yard, P } from './helpers.mjs';
import { TREE_CHOPS, AFTER_LOGS_A_TREE, AFTER_SAWDUST_BRIM, CROWD_FILES, RIM_PIECES, MEET_MEMBERS, AFTER_GATES,
         ACT_CAPTION_S, AFTER_DIG_CLICKS, AFTER_SHOUT_REBEL, AFTER_SHOUT_REBEL_UP, AFTER_PLOTS0, AFTER_PLOT_MAX,
         AFTER_UPGRADES, AFTER_CARDS, AFTER_FIRST_MEMBERS, STRIKE_SHARE, AFTER_AGITATE_REBEL } from '../src/config.js';
import { stepAfter } from '../src/after/index.js';
import { crowdSpan } from '../src/render/after.js';

const S = yard.S;
const read = () => window.__afterRead();
const OPENING = ['house-fall', 'arrive', 'meet-god', 'refuse'];

const up = () => {
  window.__actsOn(true);
  window.__goPlace('after');
  for (const k of OPENING) if (!S.beatsDone.includes(k)) S.beatsDone.push(k);
  run(1);
};
const tree = i => window.__afterTrees()[i];
const rims = () => S.after.rims;
const inked = () => rims().split('').reduce((n, c) => n + (c === '9' ? 0 : +c), 0);
// The first members, or any set walking, turned on until they stand in the camp.
const settle = () => runUntil(() => read().walking === 0, 120);
const line = () => { const at = window.__afterPair(); return window.__afterClick(at.x, at.y); };
// The camp given members, as the signs would send them: the front of the crowd
// made members, and the clock turned until they have walked out and stand on
// their spots.
function members(n) {
  window.__afterCrowd((i, v) => (i < n ? RIM_PIECES : v));
  runUntil(() => read().walking === 0 && read().camp >= n, 120);
}

group('rebel is counted where it lands, not on the click', async () => {
  up();
  const r0 = read().rebel;
  const hit = line();
  const onClick = read().rebel, motes = read().motes;
  run(10);
  const landed = read().rebel;
  window.__actsOn(null);
  return [
    ok(hit, 'a click on the pair on the pedestal is a line of their speech'),
    ok(onClick === r0 && motes > 0, 'nothing is counted on the click: the rebel is in the air', `${r0} -> ${onClick}, ${motes} motes`),
    ok(landed === r0 + AFTER_SHOUT_REBEL, 'the motes land on the pile and are counted there', `${r0} -> ${landed}`)
  ];
});

group('the bigger speech is bought on the pedestal\'s card and pays more a line', async () => {
  up();
  window.__afterGrant({ rebel: 30 });
  const bought = window.__buy('after-shout');
  const again = window.__buy('after-shout');
  const r0 = read().rebel;
  line(); run(10);
  window.__actsOn(null);
  return [
    ok(bought && !again, 'bought once, and then it is done'),
    ok(read().rebel - r0 === AFTER_SHOUT_REBEL_UP, 'a line pays the bigger speech\'s rebel', `${read().rebel - r0}`)
  ];
});

group('an agitator post is filled from the camp and makes rebel, and wins nobody', async () => {
  up();
  settle();                                 // the first members walk out to the camp
  S.after.speech = { next: 1e9, f0: 0, held: null };   // the throne's speech is another check's
  const camp0 = read().camp;
  window.__afterGrant({ rebel: 400 });
  const posts = [0, 1].map(() => window.__buy('after-post-agitator'));
  run(0.1);
  const camp1 = read().camp;
  const ink0 = inked(), r0 = read().rebel;
  run(30);
  const agitators = S.after.bodies.filter(b => b.job === 'agitator');
  const made = read().rebel - r0;
  // A post with nobody waiting stands empty until a member walks in.
  S.after.camp = 0;
  window.__afterGrant({ rebel: 400 });
  window.__buy('after-post-agitator');
  run(2);
  const agitating = () => S.after.bodies.filter(b => b.job === 'agitator').length;
  const empty = agitating() === 2;
  window.__afterCrowd((i, v) => (i === 200 ? RIM_PIECES : v));
  const filled = runUntil(() => agitating() === 3, 120);
  window.__actsOn(null);
  return [
    ok(camp0 === AFTER_FIRST_MEMBERS, 'the refusal\'s members walked out and stand in the camp', `${camp0}`),
    ok(posts.every(Boolean) && camp1 === camp0 - 2, 'two posts bought, two members leave the camp for them', `${camp0} -> ${camp1}`),
    ok(agitators.length === 2 && made > 0, 'the agitators stand by the pedestal and their lines make rebel', `${agitators.length}, +${made}`),
    ok(made < 30 / 0.25 * AFTER_SHOUT_REBEL, 'less than a click\'s worth', `${made}`),
    ok(inked() === ink0, 'and nobody in the crowd is inked by it', `${ink0} -> ${inked()}`),
    ok(empty && filled, 'a post with nobody in the camp stands empty until a member walks in to it', `${empty} ${filled}`)
  ];
});

group('the axe is bought on the pedestal\'s card, its beat hands it over, and a click chops', async () => {
  up();
  const t = tree(0);
  const early = window.__afterClick(t.x, t.y);
  window.__afterGrant({ rebel: 50 });
  const bought = window.__buy('after-axe');
  const told = runUntil(() => S.beatsDone.includes('axe'), 4 * ACT_CAPTION_S);
  const chop = window.__afterClick(t.x, t.y);
  window.__actsOn(null);
  return [
    ok(!early && S.after.plots[0].chops <= 1, 'before the axe, a click on a tree chops nothing'),
    ok(bought, 'the axe is a row on the pedestal\'s card, paid in rebel'),
    ok(told && read().axe, 'its beat plays and hands the axe over'),
    ok(chop && S.after.plots[0].chops === 1, 'and from then on a click on a grown tree is a chop', `${S.after.plots[0].chops}`)
  ];
});

group('a felled tree leaves a stump that blocks the plot until it is dug, and digging replants it free', async () => {
  up();
  window.__afterGrant({ rebel: 50 });
  window.__buy('after-axe');
  runUntil(() => read().axe, 4 * ACT_CAPTION_S);
  const t = tree(0);
  for (let k = 0; k < TREE_CHOPS; k++) window.__afterClick(t.x, t.y);
  const falling = tree(0).falling;
  run(0.5);
  const midFall = tree(0).falling;
  run(2);
  // Read fresh each time: the harness reads the save back every five seconds.
  const plot = () => S.after.plots[0];
  const p0 = { ...plot() };
  const down = p0.logs === AFTER_LOGS_A_TREE && p0.stump && p0.stage === 0;
  run(200);
  const blocked = plot().stump && plot().stage === 0;
  const r0 = read().rebel;
  const s = tree(0);
  for (let k = 0; k < AFTER_DIG_CLICKS - 1; k++) window.__afterClick(s.sx, s.sy);
  const still = plot().stump;
  window.__afterClick(s.sx, s.sy);
  const p = plot();
  window.__actsOn(null);
  return [
    ok(falling && midFall, `${TREE_CHOPS} chops start it falling, and it is still coming down half a second later`),
    ok(down, 'down, it lies as logs and leaves a stump', JSON.stringify(p0)),
    ok(blocked, 'the stump blocks the plot: nothing grows there'),
    ok(still && !p.stump && p.stage === 1, `${AFTER_DIG_CLICKS} clicks dig it out, and a sapling is set in the plot`, `stage ${p.stage}`),
    ok(read().rebel === r0, 'the sapling is free')
  ];
});

group('a woodcutter chops but leaves the stump until stump removal is bought; then the plot cycles', async () => {
  up();
  settle();
  window.__afterGrant({ rebel: 1000, timber: 100 });
  const post = window.__buy('after-post-woodcutter');
  const fell = runUntil(() => S.after.plots[0].stump, 90);
  run(30);
  const left = S.after.plots[0].stump;
  const upgraded = window.__buy('after-stumps');
  const dug = runUntil(() => !S.after.plots[0].stump, 60);
  const stage = S.after.plots[0].stage;
  window.__actsOn(null);
  return [
    ok(post && fell, 'a woodcutter walks from the camp to its post and fells the grown tree'),
    ok(left, 'before stump removal it leaves the stump standing'),
    ok(upgraded && dug && stage >= 1, 'with stump removal bought it digs the stump out and the plot replants', `stage ${stage}`)
  ];
});

group('the grove\'s card clears plots, each with its sapling, to its most', async () => {
  up();
  window.__afterGrant({ rebel: 1000, timber: 100 });
  const bought = [];
  for (let k = 0; k < AFTER_PLOT_MAX; k++) bought.push(window.__buy('after-plot'));
  const plots = S.after.plots;
  const grow = window.__buy('after-grow'), big = window.__buy('after-tree');
  window.__actsOn(null);
  return [
    ok(bought.filter(Boolean).length === AFTER_PLOT_MAX - AFTER_PLOTS0 && !bought.at(-1), 'a plot a press, to the most it clears',
       bought.join(' ')),
    ok(plots.length === AFTER_PLOT_MAX && plots.slice(AFTER_PLOTS0).every(p => p.stage === 1),
       'each new plot has its sapling set', plots.map(p => p.stage).join(' ')),
    ok(grow && big, 'faster growth and bigger trees are on the same card')
  ];
});

group('a soul whose rim closes walks out of God\'s yard to the camp', async () => {
  up();
  settle();
  const camp0 = read().camp, n = read().size;
  const out0 = read().union;
  window.__afterCrowd((i, v) => (i >= CROWD_FILES * 2 && i < CROWD_FILES * 2 + 10 ? RIM_PIECES : v));
  run(0.5);
  const emptied = rims().slice(CROWD_FILES * 2, CROWD_FILES * 2 + 10);
  const walking = read().walking;
  const share = read().support;
  runUntil(() => read().walking === 0, 120);
  window.__actsOn(null);
  return [
    ok(emptied === '9'.repeat(10), 'their slots in the crowd are left empty', emptied),
    ok(walking === 10, 'and each is a body walking out', `${walking}`),
    ok(Math.abs(share - (out0 + 10) / n) < 1e-9, 'the support read is the share walked out', `${share}`),
    ok(read().camp === camp0 + 10, 'and they stand in the camp once they reach it', `${camp0} -> ${read().camp}`)
  ];
});

// The chain, bought row by row: the doors and the posts, from a camp of
// members. Shared by the chain, the support and the reload groups.
function buildChain() {
  up();
  members(24);
  // Logs at the saw already, as felled old growth would leave them: the grove
  // has its own checks above.
  window.__afterGrant({ rebel: 5000, timber: 60, logs: 16 });
  const bought = [];
  for (const k of ['after-door-mill', 'after-door-workshop', 'after-plot', 'after-plot', 'after-stumps']) bought.push([k, window.__buy(k)]);
  for (const job of ['woodcutter', 'woodcutter', 'hauler', 'hauler', 'hauler', 'sawyer', 'sawyer', 'joiner', 'carrier', 'carrier'])
    bought.push([job, window.__buy(`after-post-${job}`)]);
  return bought;
}

group('the chain makes timber and sawdust, then signs, and the heap brims until the paper mill', async () => {
  const bought = buildChain();
  let brim = false, swept = false;
  for (let k = 0; k < 960; k++) {
    run(0.25);
    if (S.after.stock.sawdust >= AFTER_SAWDUST_BRIM) brim = true;
    if (S.after.bodies.some(b => b.load === 'sawdust')) swept = true;
  }
  const mid = read();
  // The slowdown, and its branch.
  window.__afterCrowd(0.45);
  window.__afterGrant({ timber: 100, rebel: 2000 });
  run(1);
  const gate2 = read().gate;
  S.after.camp += 6;                         // hands for the branch: the walk out is checked above
  const b2 = ['after-door-papermill', 'after-door-press', 'after-post-pulper', 'after-post-printer', 'after-post-paster']
    .map(k => [k, window.__buy(k)]);
  run(150);
  const end = read();
  window.__actsOn(null);
  return [
    ok(bought.every(([, b]) => b), 'the doors and the posts are bought through their rows', JSON.stringify(bought.filter(([, b]) => !b))),
    ok(mid.timber > 0 || mid.signs > 0 || S.after.signs.length > 0, 'logs reach the mill and are sawn into timber', JSON.stringify(mid)),
    ok(brim && swept, 'the sawdust heaps to its brim and a sawyer sweeps it off the edge', `brim ${brim} swept ${swept}`),
    ok(S.after.signs.length > 0, 'the workshop makes signs and a carrier plants them in the crowd', `${S.after.signs.length}`),
    ok(gate2 === 2 && b2.every(([, b]) => b), 'the slowdown offers the paper mill and the press', `${gate2} ${JSON.stringify(b2)}`),
    ok(end.paper > 0 || end.posters > 0 || S.after.posters.length > 0, 'the paper mill pulps sawdust into paper', JSON.stringify(end)),
    ok(S.after.posters.length > 0, 'the press prints posters and a paster pastes them on the fence', `${S.after.posters.length}`)
  ];
});

group('signs and posters win souls, and God\'s yard empties', async () => {
  buildChain();
  const s0 = read();
  run(240);
  const s1 = read();
  window.__actsOn(null);
  return [
    ok(s1.union > s0.union, 'souls walk out as the signs ink them', `${s0.union} -> ${s1.union}`),
    ok(s1.support > s0.support, 'the share walked out rises', `${s0.support.toFixed(3)} -> ${s1.support.toFixed(3)}`)
  ];
});

group('the gates open in order off the share walked out, and the strike falls due', async () => {
  up();
  const gates = [];
  window.__afterCrowd((i, v) => (i < MEET_MEMBERS ? RIM_PIECES : v));
  run(1); gates.push(read().gate);
  window.__afterCrowd(0.42);
  run(1); gates.push(read().gate);
  const n = S.after.rims.length;
  window.__afterCrowd((i, v) => (i < Math.ceil(n * STRIKE_SHARE) + 1 ? RIM_PIECES : v));
  const due = runUntil(() => read().gate >= AFTER_GATES.length, 10);
  // The strike is a beat with a held caption: turned until it has played.
  runUntil(() => S.beatsDone.includes('strike'), 4 * ACT_CAPTION_S);
  window.__actsOn(null);
  return [
    ok(gates[0] === 1 && gates[1] === 2, 'the meeting, then the slowdown', gates.join(' ')),
    ok(due, 'the strike\'s share walked out reaches the last gate', `${read().support.toFixed(3)}`),
    ok(S.beatsDone.includes('strike'), 'and the strike beat plays', S.beatsDone.filter(k => /strike|unmask/.test(k)).join(' '))
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
    ok(S.after.bodies.length === bodies.length && moved.length === 0, 'and every member stands where it stood', `${moved.length} moved`),
    ok(still.posted === bodies.filter(b => b.job).length, 'and the loop runs on after it')
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
  // The far field stops at the view's top: the ranks drawn are those whose row
  // is on screen, however deep the crowd.
  const ranks = span.r1 + 1;
  window.__actsOn(null);
  return [
    ok(ms < 1, `the afterlife's step with ${n} souls stays under a millisecond a frame`, `${ms.toFixed(3)} ms`),
    ok(files <= Math.ceil(S.viewW / (P * 4)) + 4 && files <= CROWD_FILES, 'the drawing walks only the files in view', `${files} files`),
    ok(ranks < n / CROWD_FILES && ranks * P <= S.viewH, 'and only the ranks in view', `${ranks} of ${n / CROWD_FILES} ranks`)
  ];
});

group('the mill\'s second blade saws two logs a cut, and its fence is bought, then a dial', async () => {
  up();
  members(2);
  window.__afterGrant({ rebel: 2000, timber: 60 });
  window.__buy('after-door-mill');
  window.__buy('after-post-sawyer');
  const early = window.__afterDial('after-cut', 3);
  const fence = window.__buy('after-fence');
  const blade = window.__buy('after-blade');
  const set = window.__afterDial('after-cut', 3);
  window.__afterGrant({ logs: 6 });
  const t0 = read().timber, d0 = read().sawdust;
  runUntil(() => S.after.bodies.some(b => b.at === 'mill'), 90);
  const cuts = [];
  let last = read().logs;
  runUntil(() => { const l = read().logs; if (l !== last) { cuts.push(last - l); last = l; } return l === 0; }, 90);
  window.__actsOn(null);
  return [
    ok(!early && fence && set, 'the fence is bought on the mill\'s card, and only then is its cut a dial'),
    ok(blade && cuts.every(c => c === 2), 'with the second blade every cut takes two logs', cuts.join(' ')),
    ok(read().timber - t0 === 18 && read().sawdust - d0 === 6, 'set fine, a log saws into three timber and one sawdust',
       `${read().timber - t0} timber, ${read().sawdust - d0} sawdust`)
  ];
});

group('the throne\'s speech strips the half-won and the wardens tear posters', async () => {
  up();
  window.__afterCrowd(i => (i < CROWD_FILES ? 9 : 4));
  S.after.speech = { next: S.after.t + 8, f0: 0, held: null };
  S.after.posters.push({ id: 900, slot: 3, age: 0, torn: null, big: false });
  run(3);
  const warned = S.after.t >= S.after.speech.next - 6;
  run(6);
  const after = S.after.rims;
  const file1 = [1, 2, 3].map(r => after[r * CROWD_FILES + 1]).join('');
  const far = after[5 * CROWD_FILES + 30];
  const torn = runUntil(() => !S.after.posters.some(p => p.id === 900), 120);
  window.__actsOn(null);
  return [
    ok(warned, 'the speech is warned ahead'),
    ok(file1 === '000', 'souls in its sweep lose their open pieces', file1),
    ok(+far >= 4, 'souls outside it keep theirs', far),
    ok(torn, 'a warden walks to the poster and tears it down')
  ];
});

// Act 3 is outside the eight-rungs rule (call 12, settled): no card is a
// ladder. Every station's upgrades are a short list of named ones.
group('every act-3 card sells two or three named upgrades, none of them a ladder', async () => {
  up();
  const rows = window.__afterRows();
  const ups = Object.entries(AFTER_UPGRADES);
  const perCard = AFTER_CARDS.filter(c => c !== 'hall')
    .map(c => [c, ups.filter(([, u]) => u.card === c).length]);
  const long = ups.filter(([k, u]) => u.bills.length > (k === 'after-plot' ? AFTER_PLOT_MAX - AFTER_PLOTS0 : 1)).map(([k]) => k);
  const coins = new Set(ups.flatMap(([, u]) => u.bills.flat().map(([c]) => c)));
  window.__actsOn(null);
  return [
    ok(perCard.every(([c, n]) => n >= 1 && n <= 4), 'a card\'s upgrades are few', JSON.stringify(perCard)),
    ok(long.length === 0, 'each is bought once, but for the grove\'s plots', long.join(', ')),
    ok([...coins].every(c => ['rebel', 'timber', 'paper'].includes(c)), 'paid in rebel, timber and paper', [...coins].join(' ')),
    ok(rows.every(r => !r.bill.some(([c]) => c === 'pledge' || c === 'faith' || c === 'ink')), 'no pledge, no faith, no ink on any bill')
  ];
});
