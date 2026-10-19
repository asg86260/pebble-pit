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
         AFTER_UPGRADES, AFTER_CARDS, AFTER_YARD_COINS, AFTER_FIRST_MEMBERS, STRIKE_SHARE, AFTER_AGITATE_REBEL,
         AFTER_BUILD_PIECES, AFTER_LOG_TIMBER, AFTER_LOG_SAWDUST, AFTER_SAW_S, AFTER_TIP_LOAD, AFTER_CHIP_SAWDUST,
         AFTER_BUILDS, AFTER_POST_DUST, AFTER_PULP_S, AFTER_VAT_SHEETS, AFTER_DRY_VATS, AFTER_PULP_SAWDUST, AFTER_SIGN_INK_S, AFTER_BURN_S } from '../src/config.js';
import { speechTarget } from '../src/after/union.js';
import { stepAfter } from '../src/after/index.js';
import { crowdSpan } from '../src/render/after.js';
import { pileAt, stationBox, plotX } from '../src/after/place.js';

const S = yard.S;
const read = () => window.__afterRead();
const OPENING = ['house-fall', 'arrive', 'meet-god', 'refuse'];

// Act 3's bills take the yard's coins too (DESIGN.md, "The yard pays too"):
// the yard given enough of each for every path bought below, which is setup
// no check here is about (test/after-yard-coins.test.mjs is): every bill on
// every card once, and posts enough at the dearest post's dust.
const YARD_PURSE = (() => {
  const sum = { dust: AFTER_POST_DUST[AFTER_POST_DUST.length - 1] * 40, spore: 0, shard: 0, scale: 0, spark: 0 };
  const bills = [...Object.values(AFTER_BUILDS).map(b => b.bill), ...Object.values(AFTER_UPGRADES).flatMap(u => u.bills)];
  for (const bill of bills) for (const [c, n] of bill) if (c in sum) sum[c] += n;
  return { dust: sum.dust, spores: sum.spore, shards: sum.shard, scales: sum.scale, sparks: sum.spark };
})();
const up = () => {
  window.__actsOn(true);
  window.__goPlace('after');
  for (const k of OPENING) if (!S.beatsDone.includes(k)) S.beatsDone.push(k);
  window.__grant(YARD_PURSE);
  run(1);
};
const tree = i => window.__afterTrees()[i];
const rims = () => S.after.rims;
// The ink on the first `n` souls: a soul rising into the back of the crowd
// since may arrive part-inked, which no station did.
const inked = (n = Infinity) => rims().slice(0, n).split('').reduce((t, c) => t + (c === '9' ? 0 : +c), 0);
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
  const n0 = rims().length, ink0 = inked(n0), r0 = read().rebel;
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
    ok(inked(n0) === ink0, 'and nobody in the crowd is inked by it', `${ink0} -> ${inked(n0)}`),
    ok(empty && filled, 'a post with nobody in the camp stands empty until a member walks in to it', `${empty} ${filled}`)
  ];
});

group('a member bought into a post steps out of our crowd near it: the grove and the pedestal both a short walk', async () => {
  up();
  settle();
  S.after.speech = { next: 1e9, f0: 0, held: null };
  window.__afterGrant({ rebel: 2000, timber: 200 });
  // Seconds from the post bought until its member stands where the post
  // first sends it: a woodcutter at its tree, an agitator behind the pedestal.
  const trip = (job, there) => {
    if (!window.__buy(`after-post-${job}`)) return Infinity;
    let s = 0;
    while (s < 60) { run(1); s++; const w = S.after.bodies.find(b => b.job === job); if (w && there(w)) return s; }
    return Infinity;
  };
  const cut = trip('woodcutter', w => Math.abs(w.x - (plotX(0) + P * 3)) < 1);
  const agit = trip('agitator', w => w.t > 0);
  window.__actsOn(null);
  return [
    ok(cut <= 12, 'a woodcutter is at its tree within twelve seconds', `${cut} s`),
    ok(agit <= 12, 'an agitator is at its spot within twelve seconds', `${agit} s`)
  ];
});

group('the axe is bought on the grove\'s card, its beat hands it over, and a click chops', async () => {
  up();
  const t = tree(0);
  const early = window.__afterClick(t.x, t.y);
  window.__afterGrant({ rebel: 50 });
  const card = window.__afterRows().find(r => r.key === 'after-axe').card;
  const bought = window.__buy('after-axe');
  const told = runUntil(() => S.beatsDone.includes('axe'), 4 * ACT_CAPTION_S);
  const chop = window.__afterClick(t.x, t.y);
  window.__actsOn(null);
  return [
    ok(!early && S.after.plots[0].chops <= 1, 'before the axe, a click on a tree chops nothing'),
    ok(bought && card === 'grove', 'the axe is a row on the grove\'s card, paid in rebel', card),
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
  window.__afterGrant({ rebel: 3000, timber: 400 });
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
  window.__afterGrant({ rebel: 3000, timber: 400 });
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

// Stations bought on the shack, each in turn, and the clock turned until it
// stands (one may need the one before).
function raise(...keys) {
  return keys.every(k => window.__buy(`after-build-${k}`) && runUntil(() => read().built.includes(k), 180));
}

group('a station bought on the shack is raised a piece at a time by a member from the camp', async () => {
  up();
  settle();
  window.__afterGrant({ rebel: 200 });
  const shown = window.__afterRows().filter(r => r.card === 'shack' && r.shown).map(r => r.key);
  const locked = window.__buy('after-build-workshop');
  const camp0 = read().camp;
  const bought = window.__buy('after-build-mill');
  run(0.1);
  const builder = S.after.bodies.find(b => b.job === 'builder');
  const pieces = [];
  runUntil(() => { const r = S.after.raising.mill; if (r && pieces.at(-1) !== r.n) pieces.push(r.n); return read().built.includes('mill'); }, 120);
  const n = S.after.raising.mill.at.length;
  run(30);
  const back = read().camp;
  window.__actsOn(null);
  return [
    ok(['mill', 'chipper', 'workshop', 'papermill', 'press'].every(k => shown.includes(`after-build-${k}`)),
       'every station is on the shack\'s board from the start', shown.join(' ')),
    ok(!locked, 'one that needs another first cannot be bought before it'),
    ok(bought && builder && builder.pair == null && read().camp <= camp0, 'bought, a member leaves the camp to build it'),
    ok(pieces.join(' ') === '0 1 2 3 4' && n === AFTER_BUILD_PIECES, 'it goes up a piece at a time, standing only with the last', pieces.join(' ')),
    ok(back === camp0, 'and the builder walks back to the camp after', `${camp0} -> ${back}`)
  ];
});

group('with nobody in the camp the pair step down and build, and climb back up', async () => {
  up();
  settle();
  S.after.camp = 0;
  window.__afterGrant({ rebel: 200 });
  window.__buy('after-build-chipper');
  run(0.1);
  const pair = S.after.bodies.filter(b => b.job === 'builder' && b.pair != null).length;
  const quiet = !line();
  const stood = runUntil(() => read().built.includes('chipper'), 120);
  const home = runUntil(() => !S.after.bodies.some(b => b.job === 'builder'), 60);
  window.__actsOn(null);
  return [
    ok(pair === 2, 'the two of them come down off the pedestal', `${pair}`),
    ok(quiet, 'and while they are down a click on the pedestal gives no line'),
    ok(stood && home, 'the station stands and they climb back up')
  ];
});

group('a station is worked by the click before any member, and a post works it slower', async () => {
  up();
  window.__afterGrant({ rebel: 500, logs: 20 });
  raise('mill');
  const at = window.__afterAt('mill');
  const t0 = read().timber;
  for (let k = 0; k < 5; k++) window.__afterClick(at.x, at.y);
  const byHand = read().timber - t0;
  settle();
  window.__buy('after-post-sawyer');
  runUntil(() => S.after.bodies.some(b => b.at === 'mill'), 60);
  const l0 = read().logs;
  run(12);
  const byPost = l0 - read().logs;
  window.__actsOn(null);
  return [
    ok(byHand === 5 * AFTER_LOG_TIMBER, 'five clicks on the saw mill, five cuts', `${byHand} timber`),
    ok(byPost >= 1 && byPost <= Math.ceil(12 / AFTER_SAW_S), 'a sawyer at its post cuts on its own clock, slower than a hand', `${byPost} cuts in 12 s`)
  ];
});

group('with no paper mill the heap stops the saw, and a click on it tips a load through the notch', async () => {
  up();
  window.__afterGrant({ rebel: 2000, logs: 4, timber: 40 });
  raise('mill');
  window.__afterGrant({ sawdust: AFTER_SAWDUST_BRIM });
  const at = window.__afterAt('mill'), heap = window.__afterAt('heap');
  const stopped = !window.__afterClick(at.x, at.y) || read().logs === 4;
  const d0 = read().sawdust;
  const tipped = window.__afterClick(heap.x, heap.y);
  const d1 = read().sawdust;
  const sawn = window.__afterClick(at.x, at.y) && read().logs === 3;
  // With a paper mill the heap has somewhere better to go.
  raise('papermill');
  const kept = !window.__afterClick(heap.x, heap.y);
  window.__actsOn(null);
  return [
    ok(stopped, 'the heap at its brim stops the saw'),
    ok(tipped && d0 - d1 === AFTER_TIP_LOAD, 'a click on the heap tips a load off it', `${d0} -> ${d1}`),
    ok(sawn, 'and the saw runs again'),
    ok(kept, 'once the paper mill stands, the heap is not tipped')
  ];
});

group('the chipper turns logs into sawdust alone, and haulers feed the smaller pile', async () => {
  up();
  window.__afterGrant({ rebel: 2000, chiplogs: 2 });
  raise('chipper');
  const at = window.__afterAt('chipper');
  const t0 = read().timber, d0 = read().sawdust;
  window.__afterClick(at.x, at.y);
  const chipped = read().sawdust - d0 === AFTER_CHIP_SAWDUST && read().timber === t0;
  raise('mill');
  window.__afterGrant({ logs: 3 });
  S.after.plots[0].logs = 4;                 // logs lying in the grove, as a felled tree leaves them
  settle();
  window.__buy('after-post-hauler');
  const fed = runUntil(() => read().chiplogs > 1, 240);
  window.__actsOn(null);
  return [
    ok(chipped, 'a click on the chipper turns a log into sawdust, no timber', `${read().sawdust - d0} sawdust`),
    ok(fed && read().logs === 3, 'a hauler takes the grove\'s logs to the chipper, the smaller pile', `${read().logs} ${read().chiplogs}`)
  ];
});

// The chain, bought row by row: the stations raised off the shack, then the
// posts, from a camp of members. Shared by the chain, the support and the
// reload groups.
function buildChain() {
  up();
  members(24);
  // Logs at the saw already, as felled old growth would leave them: the grove
  // has its own checks above.
  window.__afterGrant({ rebel: 5000, timber: 60, logs: 16 });
  const bought = [['raised', raise('mill', 'workshop')]];
  for (const k of ['after-plot', 'after-plot', 'after-stumps']) bought.push([k, window.__buy(k)]);
  for (const job of ['woodcutter', 'woodcutter', 'hauler', 'hauler', 'hauler', 'sawyer', 'sawyer', 'joiner', 'carrier', 'carrier'])
    bought.push([job, window.__buy(`after-post-${job}`)]);
  return bought;
}

group('the chain makes timber and sawdust, then signs, and a sawyer tips the full heap until the paper mill', async () => {
  const bought = buildChain();
  let brim = false, tipped = false;
  for (let k = 0; k < 960; k++) {
    run(0.25);
    if (S.after.stock.sawdust >= AFTER_SAWDUST_BRIM) brim = true;
    if (S.after.bodies.some(b => b.load === 'tip')) tipped = true;
  }
  const mid = read();
  // The second branch, raised off the shack.
  window.__afterGrant({ timber: 100, rebel: 2000 });
  S.after.camp += 6;                         // hands for the branch: the walk out is checked above
  const raised = raise('papermill', 'press');
  const b2 = ['after-post-pulper', 'after-post-printer', 'after-post-paster'].map(k => [k, window.__buy(k)]);
  run(150);
  const end = read();
  window.__actsOn(null);
  return [
    ok(bought.every(([, b]) => b), 'the stations and the posts are bought through their rows', JSON.stringify(bought.filter(([, b]) => !b))),
    ok(mid.timber > 0 || mid.signs > 0 || S.after.signs.length > 0, 'logs reach the mill and are sawn into timber', JSON.stringify(mid)),
    ok(brim && tipped, 'the sawdust heaps to its brim and a sawyer tips a load through the notch', `brim ${brim} tipped ${tipped}`),
    ok(S.after.signs.length > 0, 'the workshop makes signs and a carrier plants them in the crowd', `${S.after.signs.length}`),
    ok(raised && b2.every(([, b]) => b), 'the paper mill and the press are raised and posted', JSON.stringify(b2)),
    ok(end.paper > 0 || end.posters > 0 || S.after.posters.length > 0, 'the paper mill pulps sawdust into paper', JSON.stringify(end)),
    ok(S.after.posters.length > 0, 'the press prints posters and a paster pastes them on the fence', `${S.after.posters.length}`)
  ];
});

group('signs and posters win souls, and God\'s yard empties', async () => {
  buildChain();
  S.after.speech = { next: 1e9, f0: 0, held: null };   // the throne's speech is another check's
  const s0 = read();
  run(2 * RIM_PIECES * AFTER_SIGN_INK_S);   // long enough for a sign to ink a pale soul full, twice over
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

group('the mill\'s second blade saws two logs a cut, at the fixed split', async () => {
  up();
  members(2);
  window.__afterGrant({ rebel: 2000, timber: 60 });
  raise('mill');
  window.__buy('after-post-sawyer');
  const blade = window.__buy('after-blade');
  window.__afterGrant({ logs: 6 });
  const t0 = read().timber, d0 = read().sawdust;
  runUntil(() => S.after.bodies.some(b => b.at === 'mill'), 90);
  const cuts = [];
  let last = read().logs;
  runUntil(() => { const l = read().logs; if (l !== last) { cuts.push(last - l); last = l; } return l === 0; }, 90);
  window.__actsOn(null);
  return [
    ok(blade && cuts.every(c => c === 2), 'with the second blade every cut takes two logs', cuts.join(' ')),
    ok(read().timber - t0 === 6 * AFTER_LOG_TIMBER && read().sawdust - d0 === 6 * AFTER_LOG_SAWDUST,
       'a log saws into the fixed timber and sawdust', `${read().timber - t0} timber, ${read().sawdust - d0} sawdust`)
  ];
});

// The paper mill's two upgrades are two things (the owner, 2026-10-18): the
// bigger vat is more paper a batch, the drying line a second batch stirred
// at once, a pulper at each vat.
group('the bigger vat makes more paper a batch; the drying line stirs a second batch beside it', async () => {
  up();
  members(3);
  window.__afterGrant({ rebel: 20000, timber: 400, paper: 100 });
  raise('mill', 'chipper', 'papermill');
  const at = window.__afterAt('papermill');
  const batch = () => { window.__afterGrant({ sawdust: 40 }); const p0 = read().paper; window.__afterClick(at.x, at.y); return read().paper - p0; };
  const plain = batch();
  const vat = window.__buy('after-vat');
  const big = batch();
  const pulping = () => S.after.bodies.filter(b => b.job === 'pulper' && b.at === 'papermill').length;
  const posts = [window.__buy('after-post-pulper'), window.__buy('after-post-pulper')];
  window.__afterGrant({ sawdust: 4000 });
  runUntil(() => S.after.bodies.filter(b => b.job === 'pulper').length === 2 && pulping() === 1, 90);
  run(2);
  const one = pulping();
  const p0 = read().paper;
  run(10 * AFTER_PULP_S);
  const single = read().paper - p0;
  const dry = window.__buy('after-dry');
  runUntil(() => pulping() === 2, 30);
  const two = pulping();
  const p1 = read().paper;
  run(10 * AFTER_PULP_S);
  const double = read().paper - p1;
  const dried = batch();
  window.__actsOn(null);
  return [
    ok(plain === 1 && vat && big === AFTER_VAT_SHEETS, 'a batch is a sheet; with the bigger vat, more', `${plain} -> ${big}`),
    ok(posts.every(Boolean) && one === 1, 'two pulpers posted, one vat: one stirs, the other waits at the door', `${one} stirring`),
    ok(dry && two === AFTER_DRY_VATS, 'the drying line puts the second at a vat of its own', `${two} stirring`),
    ok(double >= single * 1.8, 'and the mill pulls twice the batches in the same time', `${single} -> ${double} sheets`),
    ok(dried === AFTER_VAT_SHEETS, 'a batch is still the vat\'s sheets: the drying line adds batches, not sheets', `${dried}`)
  ];
});

// The throne's speech (docs/wave-act3-build.md, track B): warned first by God's
// gaze settling on one sign or poster, then that one burnt away. Souls are
// never knocked back, and nobody walks rounds.
group('a speech burns a sign after its warning, and knocks no soul back', async () => {
  up();
  window.__afterCrowd(i => (i < CROWD_FILES ? 9 : 4));
  S.after.signs.push({ id: 901, f: 6, r: 1, askew: false, pull: null, big: false, age: 0 });
  S.after.speech = { next: S.after.t + 8, target: null, burnt: null };
  const before = rims();
  run(1);
  const early = speechTarget();
  run(2);
  const aimed = speechTarget(), standing = S.after.signs.some(q => q.id === 901 && q.burnt == null);
  runUntil(() => S.after.signs.some(q => q.id === 901 && q.burnt != null), 10);
  const burnt = S.after.speech.burnt;
  const after = rims();
  const back = [...after].filter((c, i) => c !== '9' && +c < +before[i]).length;
  const gone = runUntil(() => !S.after.signs.some(q => q.id === 901), AFTER_BURN_S + 1);
  window.__actsOn(null);
  return [
    ok(early === null, 'no mark before the warning'),
    ok(aimed && aimed.id === 901 && standing, 'warned: the gaze settles on the sign, still standing', JSON.stringify(S.after.speech)),
    ok(burnt && burnt.kind === 'sign' && burnt.id === 901, 'then the speech burns that sign', JSON.stringify(burnt)),
    ok(back === 0, 'and not one soul is knocked back', `${back}`),
    ok(gone, 'the sign chars away and is gone'),
    ok(!('wardens' in S.after), 'no wardens walk the crowd')
  ];
});

// Act 3 is outside the eight-rungs rule (call 12, settled): no card is a
// ladder. Every station's upgrades are a short list of named ones.
group('every act-3 card sells two or three named upgrades, none of them a ladder', async () => {
  up();
  const rows = window.__afterRows();
  const ups = Object.entries(AFTER_UPGRADES);
  const perCard = AFTER_CARDS.filter(c => c !== 'shack')
    .map(c => [c, ups.filter(([, u]) => u.card === c).length]);
  const long = ups.filter(([k, u]) => u.bills.length > (k === 'after-plot' ? AFTER_PLOT_MAX - AFTER_PLOTS0 : 1)).map(([k]) => k);
  const coins = new Set(ups.flatMap(([, u]) => u.bills.flat().map(([c]) => c)));
  window.__actsOn(null);
  return [
    ok(perCard.every(([c, n]) => n >= 1 && n <= 5), 'a card\'s upgrades are few (the grove\'s five, the axe among them)', JSON.stringify(perCard)),
    ok(long.length === 0, 'each is bought once, but for the grove\'s plots', long.join(', ')),
    ok([...coins].every(c => ['rebel', 'timber', 'paper', ...AFTER_YARD_COINS].includes(c)), 'paid in rebel, timber and paper and the yard\'s coins', [...coins].join(' ')),
    ok(rows.every(r => !r.bill.some(([c]) => c === 'pledge' || c === 'faith' || c === 'ink')), 'no pledge, no faith, no ink on any bill')
  ];
});
