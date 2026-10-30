// Act 3's loop (DESIGN.md, "Acts 3 and 4", act 3, "The loop: the grove and the
// press", reworked to the owner's settled calls of 2026-10-18), on placeholder
// drawings. Reached the way a player reaches it wherever a player can: a click
// on the pair, a tree or a stump through the place's click (`__afterClick`,
// what input.js calls), every row bought through `__buy`, every member put on through its roster's + (`__afterPress`). The setup a check is
// not about goes through the act's hooks: coins granted, the crowd's rims set
// (`__afterCrowd`), the dev travel up (`__goPlace`) with the act's opening
// beats marked played, since the story before the loop is not what is checked.
import { bestMs, group, ok, run, runUntil, yard, P } from './helpers.mjs';
import { goodCount } from '../src/after/piles.js';
import { siteLoads } from '../src/after/build.js';
import { lying } from '../src/after/ground.js';
import { TREE_CHOPS, AFTER_TREE, CROWD_FILES, RIM_PIECES, MEET_MEMBERS, AFTER_GATES,
         ACT_CAPTION_S, AFTER_DIG_CLICKS, AFTER_PODIUM_REBEL, AFTER_PODIUM_CLIMB, AFTER_PODIUM_TOPS, AFTER_PODIUM_U, AFTER_PLOTS0, AFTER_PLOT_MAX,
         AFTER_UPGRADES, AFTER_CARDS, AFTER_YARD_COINS, AFTER_FIRST_MEMBERS, STRIKE_SHARE, AFTER_AGITATE_REBEL, AFTER_AGITATE_S,
         AFTER_BUILD_PIECES, AFTER_LOG_TIMBER, AFTER_MILL, AFTER_SAW_S,
         AFTER_BUILDS, AFTER_SEAT_BILLS, AFTER_WALK, AFTER_SIGN_INK_S, AFTER_BURN_S,
         GESTURE_STRAIN_S, AFTER_PILES } from '../src/config.js';
import { speechTarget } from '../src/after/union.js';
import { stepAfter } from '../src/after/index.js';
import { crowdSpan } from '../src/render/after.js';
import { pileAt, stationBox, plotX, speakerAt, afterFloor, idleSpots, AP } from '../src/after/place.js';
import { sawSpot } from '../src/after/bodies.js';
import { sawOn, saw, lift, spin, loadBed } from './after-hands.mjs';
import { millView } from '../src/after/mill.js';

const S = yard.S;
const read = () => window.__afterRead();
const OPENING = ['house-fall', 'arrive', 'meet-god', 'refuse'];

// Act 3's bills take the yard's coins too (DESIGN.md, "The yard pays too"):
// the yard given enough of each for every path bought below, which is setup
// no check here is about (test/after-yard-coins.test.mjs is): every bill on
// every card once, and every seat twice over.
const YARD_PURSE = (() => {
  const sum = { dust: 0, spore: 0, shard: 0, scale: 0, spark: 0 };
  const bills = [...Object.values(AFTER_BUILDS).map(b => b.bill), ...Object.values(AFTER_UPGRADES).flatMap(u => u.bills), ...AFTER_SEAT_BILLS, ...AFTER_SEAT_BILLS];
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
// A member put on `job` as a player puts one: the + on its roster, and with
// its seats full a seat bought on its station's board first.
// The timber pile topped up to its brim before a bill that names timber: a
// pile holds no more than its brim (after/piles.js), so a check buying
// several rows grants it again between them.
const topUp = () => window.__afterGrant({ timber: AFTER_PILES.timber.brim });
// A bill paid in timber is an order (after/build.js): its row lands when idle
// members have carried its last block to its station.
const landed = () => runUntil(() => !S.after.orders.length, 240);
const putOn = job => window.__afterPress(job) || (topUp(), !!window.__buy(`after-seat-${job}`) && (landed(), window.__afterPress(job)));
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
  // The members agitate rebel onto the same pile: another check's.
  S.after.bodies = []; S.after.camp = 0;
  const r0 = read().rebel;
  const hit = line();
  const onClick = read().rebel, motes = read().motes;
  run(10);
  const landed = read().rebel;
  window.__actsOn(null);
  return [
    ok(hit, 'a click on the pair on the pedestal is a line of their speech'),
    ok(onClick === r0 && motes > 0, 'nothing is counted on the click: the rebel is in the air', `${r0} -> ${onClick}, ${motes} motes`),
    ok(landed === r0 + AFTER_PODIUM_REBEL[0], 'the motes land on the pile and are counted there', `${r0} -> ${landed}`)
  ];
});

// The pair's podium is a ladder of five (DESIGN.md, "The level, the two
// crowds and the flags"): bought a rung at a time on the pedestal's card,
// each rung opening when the union's support reaches its mark; the new
// podium goes up where the old stood and the pair step up onto it partway
// through; from up there a line carries further, and a reload keeps it.
group("the podium is a ladder bought on the pedestal's card, a rung at each support mark, and the pair step up onto it", async () => {
  up();
  S.after.speech = { next: 1e9, f0: 0, held: null };   // the throne's speech is another check's
  window.__afterGrant({ rebel: 5000, timber: 500 });
  const short = window.__buy('after-podium');
  const { marks } = AFTER_UPGRADES['after-podium'];
  // Read against the crowd as it stands: souls keep rising into its back while
  // a rung's timber is carried.
  const toMark = k => { const n = rims().length; return window.__afterCrowd((i, v) => (i < Math.ceil(n * marks[k] * STRIKE_SHARE) + 2 ? 9 : v)); };
  toMark(0); run(0.1);
  const y0 = speakerAt(0).y;
  const bought = window.__buy('after-podium'), early = window.__buy('after-podium');
  landed();
  run(AFTER_PODIUM_CLIMB.s * AFTER_PODIUM_CLIMB.rise[1]);
  const yMid = speakerAt(0).y;
  run(AFTER_PODIUM_CLIMB.s);
  const y1 = speakerAt(0).y;
  // The line's own motes, read as they are knocked off: the idle members at
  // the podium are giving lines of their own the while.
  const m0 = S.after.motes.length;
  line();
  const paid = S.after.motes.slice(m0).reduce((s, m) => s + m.v, 0);
  run(10);
  const rungs = [];
  for (let k = 1; k < marks.length; k++) { toMark(k); run(0.1); topUp(); rungs.push(window.__buy('after-podium')); landed(); run(AFTER_PODIUM_CLIMB.s); }
  const done = window.__buy('after-podium');
  const top = afterFloor() - speakerAt(0).y;
  yard.persist(); window.__reload(); run(0.1);
  const kept = S.after.ups['after-podium'], keptTop = afterFloor() - speakerAt(0).y;
  window.__actsOn(null);
  return [
    ok(!short, 'shut before the union\'s support reaches the first mark'),
    ok(bought && !early, 'the first rung bought at its mark, and the next shut until its own', `${bought} ${early}`),
    ok(y0 === afterFloor() - AFTER_PODIUM_TOPS[0] * AFTER_PODIUM_U && yMid === y0, 'the pair stay on the soapbox while the crates go up', `${y0} ${yMid}`),
    ok(y1 === afterFloor() - AFTER_PODIUM_TOPS[1] * AFTER_PODIUM_U, 'then step up onto them', `${y1}`),
    ok(paid === AFTER_PODIUM_REBEL[1], 'and a line from up there carries further', `${paid}`),
    ok(rungs.every(Boolean) && !done, 'every rung bought at its mark, and the ladder ends at the column', rungs.join()),
    ok(top === AFTER_PODIUM_TOPS[4] * AFTER_PODIUM_U && kept === 4 && keptTop === top, 'the column stands after a reload', `${top} ${kept} ${keptTop}`),
    ok(AFTER_PODIUM_TOPS.every((v, i) => i === 0 || v > AFTER_PODIUM_TOPS[i - 1]), 'each rung stands taller than the one before', AFTER_PODIUM_TOPS.join(' '))
  ];
});

group('the idle members stand at the podium and make rebel, and win nobody', async () => {
  up();
  settle();                                 // the first members walk out to the camp
  S.after.speech = { next: 1e9, f0: 0, held: null };   // the throne's speech is another check's
  const idle = () => S.after.bodies.filter(b => b.job == null && b.state === 'work');
  const members0 = read().camp;
  const n0 = rims().length, ink0 = inked(n0), r0 = read().rebel;
  run(30);
  const made = read().rebel - r0;
  const atPodium = idle().every(w => w.x < stationBox('pedestal').x);
  window.__actsOn(null);
  return [
    ok(members0 === AFTER_FIRST_MEMBERS, 'the refusal\'s members walked out, nobody on a job yet', `${members0}`),
    ok(idle().length === Math.min(AFTER_FIRST_MEMBERS, idleSpots()) && atPodium && made > 0,
       'they stand behind the pedestal, as many as its spots hold, and their lines make rebel', `${idle().length}, +${made}`),
    ok(made >= Math.floor(30 / AFTER_AGITATE_S) * AFTER_FIRST_MEMBERS * AFTER_AGITATE_REBEL - AFTER_FIRST_MEMBERS,
       'those past the spots, in the crowd, agitating at the same pace', `+${made}`),
    ok(made < 30 / 0.25 * AFTER_PODIUM_REBEL[0], 'less than a click\'s worth', `${made}`),
    ok(inked(n0) === ink0, 'and nobody in the crowd is inked by it', `${ink0} -> ${inked(n0)}`)
  ];
});

group('a member put on through the roster walks off the podium to the grove in a short walk', async () => {
  up();
  settle();
  S.after.speech = { next: 1e9, f0: 0, held: null };
  window.__afterSaw();                       // the woodcutter fells only with the saw handed over
  // Seconds from the press until the member stands at its tree.
  const trip = (job, there) => {
    if (!window.__afterPress(job)) return Infinity;
    let s = 0;
    while (s < 120) { run(1); s++; const w = S.after.bodies.find(b => b.job === job); if (w && there(w)) return s; }
    return Infinity;
  };
  const cut = trip('woodcutter', w => !!w.sawing && Math.abs(w.x - sawSpot(0)) <= AP);
  window.__actsOn(null);
  // The walk is the camp's length, podium to grove, at the act's pace.
  const far = Math.ceil((stationBox('pedestal').x - plotX(0)) / AFTER_WALK) + 2;
  return [
    ok(cut <= far, `a woodcutter is at its tree within the walk's ${far} seconds`, `${cut} s`)
  ];
});

group('the hand saws a tree from the start; the saw is bought on the grove\'s card and its beat hands it to the woodcutter', async () => {
  up();
  // The hand needs nothing bought (the owner, 2026-10-30: "the player can
  // always cut the tree down, the saw unlocks worker automation").
  const on = sawOn(0);
  saw(0, () => S.after.plots[0].chops >= 1);
  const chopped = S.after.plots[0].chops;
  window.__afterGrant({ rebel: 50 });
  const card = window.__afterRows().find(r => r.key === 'after-saw').card;
  const before = read().sawHanded;
  const bought = window.__buy('after-saw');
  const told = runUntil(() => S.beatsDone.includes('saw'), 4 * ACT_CAPTION_S);
  window.__actsOn(null);
  return [
    ok(on && chopped === 1, 'before the saw is bought, the hand saw lies across the tree and a stroke is a chop', String(chopped)),
    ok(!before && bought && card === 'grove', 'the saw is a row on the grove\'s card, paid in rebel', card),
    ok(told && read().sawHanded, 'its beat plays and hands the saw to the woodcutter')
  ];
});

group('a felled tree breaks into its logs and leaves a stump that blocks the plot until it is pulled, and out it comes as a log', async () => {
  up();
  sawOn(0);
  saw(0, () => S.after.plots[0].fall != null);
  const falling = tree(0).falling;
  run(0.5);
  const midFall = tree(0).falling;
  run(2);
  // Read fresh each time: the harness reads the save back every five seconds.
  const plot = () => S.after.plots[0];
  const p0 = { ...plot() };
  const down = lying().filter(q => q.i === 0).length === AFTER_TREE.logs && p0.stump && p0.grow == null;
  run(200);
  const blocked = plot().stump && plot().grow == null;
  const logs0 = lying().length;
  lift(0, 3, GESTURE_STRAIN_S * (AFTER_DIG_CLICKS - 0.5));
  const still = plot().stump;
  lift(0, 3, GESTURE_STRAIN_S * 2);
  const p = plot();
  run(1);
  const logs1 = lying().length;
  window.__actsOn(null);
  return [
    ok(falling && midFall, `${TREE_CHOPS} strokes start it falling, and it is still coming down half a second later`, `${falling} ${midFall}`),
    ok(down, 'down, it lies as its four logs and leaves a stump', JSON.stringify(p0)),
    ok(blocked, 'the stump blocks the plot: nothing grows there'),
    ok(still && !p.stump && p.grow == null, 'lifted and held, its roots give one by one, and out it comes, the plot bare for an acorn', JSON.stringify(p)),
    ok(logs1 === logs0 + 1, 'the stump out is one more log', `${logs0} -> ${logs1}`)
  ];
});

group('a woodcutter fells only once the saw is bought, leaves the stump until stump removal is bought, then pulls it', async () => {
  up();
  settle();
  window.__afterGrant({ rebel: 3000, timber: 400 });
  const post = putOn('woodcutter');
  run(60);
  const waited = !S.after.plots[0].stump && S.after.plots[0].fall == null && S.after.plots[0].chops === 0;
  window.__buy('after-saw');
  const fell = runUntil(() => S.after.plots[0].stump, 240);   // the walk from the podium is the camp's length
  const by = S.after.plots[0].by;
  run(30);
  const left = S.after.plots[0].stump;
  const upgraded = window.__buy('after-stumps');
  const dug = runUntil(() => !S.after.plots[0].stump, 60);
  const bare = S.after.plots[0].grow == null && !S.after.plots[0].stump;
  window.__actsOn(null);
  return [
    ok(post && waited, 'a woodcutter does not fell a tree before the saw is bought'),
    ok(fell && by === 'worker', 'with the saw handed over it walks from the podium to the grove and fells the grown tree', String(by)),
    ok(left, 'before stump removal it leaves the stump standing'),
    ok(upgraded && dug && bare, 'with stump removal bought it pulls the stump out, the plot bare for an acorn')
  ];
});

group('the grove\'s card clears plots, each a bare bed, to its most', async () => {
  up();
  window.__afterGrant({ rebel: 3000, timber: 400 });
  const bought = [];
  for (let k = 0; k < AFTER_PLOT_MAX; k++) { topUp(); bought.push(window.__buy('after-plot')); landed(); }
  const plots = S.after.plots;
  topUp();
  const grow = window.__buy('after-grow');
  window.__actsOn(null);
  return [
    ok(bought.filter(Boolean).length === AFTER_PLOT_MAX - AFTER_PLOTS0 && !bought.at(-1), 'a plot a press, to the most it clears',
       bought.join(' ')),
    ok(plots.length === AFTER_PLOT_MAX && plots.slice(AFTER_PLOTS0).every(p => p.grow == null && !p.stump),
       'each new plot is a bare bed, waiting on an acorn', plots.map(p => p.grow).join(' ')),
    ok(grow, 'faster growth is on the same card')
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

// Stations bought on the shack, each in turn (one may need the one before),
// and stood up at once: the carry and the raising are checked on their own
// above, and their walks are minutes of setup no other check is about.
function raise(...keys) {
  return keys.every(k => { const took = window.__buy(`after-build-${k}`); if (took) S.after.built.push(k); run(0.1); return took; });
}

group('a station bought on the shack is carried in as a pile and raised off it a band at a time', async () => {
  up();
  settle();
  window.__afterGrant({ rebel: 200 });
  const shown = window.__afterRows().filter(r => r.card === 'shack' && r.shown).map(r => r.key);
  const locked = window.__buy('after-build-workshop');
  const camp0 = read().camp;
  const bought = window.__buy('after-build-mill');
  run(0.1);
  const crew = S.after.bodies.filter(b => b.job === 'builder');
  // Turned a tenth at a time, so every band and the pile's top are seen.
  const bands = [], piles = [];
  let carried = false;
  for (let k = 0; k < 6000 && !read().built.includes('mill'); k++) {
    run(0.1);
    const r = S.after.raising.mill;
    if (bands.at(-1) !== r.n) bands.push(r.n);
    const on = siteLoads('mill');
    if (piles.at(-1) !== on) piles.push(on);
    carried ||= S.after.bodies.some(b => b.phase === 'carry');
  }
  const n = S.after.raising.mill.at.length;
  run(60);
  const back = read().camp;
  window.__actsOn(null);
  return [
    ok(['mill', 'workshop'].every(k => shown.includes(`after-build-${k}`)),
       'every station is on the shack\'s board from the start', shown.join(' ')),
    ok(!locked, 'one that needs another first cannot be bought before it'),
    ok(bought && crew.length === Math.min(4, camp0) && crew.every(b => b.pair == null), 'bought, members leave the camp to carry it', `${crew.length} of ${camp0}`),
    ok(carried && Math.max(...piles) === 8, 'they carry its eight loads onto its spot as a pile', piles.join(' ')),
    ok(bands.join(' ') === '0 1 2 3 4' && n === AFTER_BUILD_PIECES, 'it goes up a band at a time, standing only with the last', bands.join(' ')),
    ok(piles.at(-1) === 0, 'and the pile is used up as it goes', piles.join(' ')),
    ok(back === camp0, 'and every hand walks back out of the camp after', `${camp0} -> ${back}`)
  ];
});

group('with nobody idle members step off their jobs to build, and the pair stay up speaking', async () => {
  up();
  settle();
  window.__afterGrant({ rebel: 2000, timber: 200 });
  S.after.camp = 0;
  // Every member there is put on the grove's woodcutting, a seat bought for each past the first.
  const n = S.after.bodies.filter(b => b.job == null && b.state === 'work').length;
  for (let k = 0; k < n; k++) putOn('woodcutter');
  const cutting = () => S.after.bodies.filter(b => b.job === 'woodcutter' && b.state === 'work').length;
  runUntil(() => cutting() === n, 60);
  window.__buy('after-build-mill');
  run(0.1);
  const crew = S.after.bodies.filter(b => b.job === 'builder');
  const borrowed = n >= 2 && crew.length === 2 && crew.every(b => b.pair == null) && cutting() === n - 2;
  const speaks = !!line();
  const stood = runUntil(() => read().built.includes('mill'), 900);
  const back = runUntil(() => !S.after.bodies.some(b => b.job === 'builder') && cutting() === n, 180);
  window.__actsOn(null);
  return [
    ok(borrowed, 'two woodcutters step off their job to build, and the pair do not come down', `${n} on, ${JSON.stringify(crew.map(b => b.pair))}`),
    ok(speaks, 'and a click on the pedestal still gives a line'),
    ok(stood && back, 'the station stands and the two walk back to the grove', `${stood} ${back}`)
  ];
});

group('a station is worked by hand before any member, and a post works it slower', async () => {
  up();
  window.__afterGrant({ rebel: 500, logs: 20 });
  raise('mill');
  // the mound emptied, so five logs' timber has room on it
  window.__afterGrant({ timber: -read().timber });
  const t0 = read().timber;
  // each log swept onto the bed by hand, then the wheel spun through it
  for (let k = 1; k <= 5; k++) { loadBed(); spin('mill', 2, () => read().timber - t0 >= k * AFTER_LOG_TIMBER, 20); }
  const byHand = read().timber - t0;
  settle();
  putOn('sawyer');
  runUntil(() => S.after.bodies.some(b => b.job === 'sawyer' && b.at === 'mill'), 120);
  // the pile stood up again for the post, and the mound the hand filled emptied
  window.__afterGrant({ logs: 6, timber: -read().timber });
  const l0 = read().logs;
  run(12);
  const byPost = l0 - read().logs;
  window.__actsOn(null);
  return [
    ok(byHand === 5 * AFTER_LOG_TIMBER, 'the flywheel spun by hand through five logs, five cuts', `${byHand} timber`),
    ok(byPost >= 1 && byPost <= Math.ceil(12 / AFTER_SAW_S), 'a sawyer at its post cuts on its own clock, slower than a hand', `${byPost} cuts in 12 s`)
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
  for (const job of ['woodcutter', 'woodcutter', 'woodcutter', 'sawyer', 'sawyer', 'joiner', 'joiner'])
    bought.push([job, putOn(job)]);
  return bought;
}

group('the chain makes timber, then signs', async () => {
  const bought = buildChain();
  for (let k = 0; k < 960; k++) {
    run(0.25);
  }
  const mid = read();
  window.__actsOn(null);
  return [
    ok(bought.every(([, b]) => b), 'the stations bought through their rows, the members put on through the rosters', JSON.stringify(bought.filter(([, b]) => !b))),
    ok(mid.timber > 0 || mid.signs > 0 || S.after.signs.length > 0, 'logs reach the mill and are sawn into timber', JSON.stringify(mid)),
    ok(S.after.signs.length > 0, 'the workshop makes signs and its joiner plants them in the crowd', `${S.after.signs.length}`)
  ];
});

group('signs win souls, who wait in God\'s yard to be hired', async () => {
  buildChain();
  S.after.speech = { next: 1e9, f0: 0, held: null };   // the throne's speech is another check's
  const s0 = read();
  // Long enough for a sign to ink a pale soul full, twice over, and for the
  // joiners' walk across the wide camp (track A) to plant it.
  run(2 * RIM_PIECES * AFTER_SIGN_INK_S + 120);
  const s1 = read();
  window.__actsOn(null);
  return [
    ok(s1.ready > s0.ready, 'souls are won as the signs ink them', `${s0.ready} -> ${s1.ready}`),
    ok(s1.union === s0.union, 'and none walks out unhired', `${s0.union} -> ${s1.union}`),
    ok(s1.support > s0.support, 'the share won rises', `${s0.support.toFixed(3)} -> ${s1.support.toFixed(3)}`)
  ];
});

group('the gates open in order off the share won, and the strike falls due', async () => {
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
    ok(due, 'the strike\'s share won reaches the last gate', `${read().support.toFixed(3)}`),
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
  const count = S.after.bodies.length, moved = S.after.bodies.filter((b, i) => Math.hypot(b.x - bodies[i].x, b.y - bodies[i].y) > P || b.job !== bodies[i].job);
  run(10);
  const still = read();
  window.__actsOn(null);
  return [
    ok(back === want, 'every fact of the act comes back from the save', back.length + ' vs ' + want.length),
    ok(count === bodies.length && moved.length === 0, 'and every member stands where it stood', `${moved.length} moved`),
    ok(still.posted === bodies.filter(b => b.job).length, 'and the loop runs on after it')
  ];
});

group('a big crowd costs the frame little, and only its files in view are drawn', async () => {
  up();
  const n = 24000;
  S.after.rims = '1'.repeat(n);
  run(1);
  const ms = bestMs(() => stepAfter({ now: 0, dt: 1000 / 60 }), 600);
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

group('the mill\'s second blade cuts a log in half the strokes, at the fixed split', async () => {
  up();
  members(2);
  window.__afterGrant({ rebel: 2000, timber: 60 });
  raise('mill');
  putOn('sawyer');
  const blade = window.__buy('after-blade');
  landed();
  // The pile emptied, so all five logs' timber (the mound's brim) has room on it.
  window.__afterGrant({ logs: 5, timber: -goodCount('timber') });
  const t0 = read().timber;
  runUntil(() => S.after.bodies.some(b => b.at === 'mill'), 90);
  // the strokes each log takes on the bed, from set down to its last column
  const strokes = [];
  let on = null;
  runUntil(() => {
    const s = S.after.saw, bed = !!(s && s.bed);
    if (bed && on == null) on = s.n;
    if (!bed && on != null) { strokes.push(s.n - on); on = null; }
    return read().logs === 0 && !bed && s && !s.out.length && !s.trip;
  }, 180);
  // a log's strokes with one blade: carried up to the blade, then each column's
  const one = 1 + AFTER_MILL.strokes.reduce((n, k) => n + k, 0);
  window.__actsOn(null);
  return [
    ok(blade && strokes.length === 5 && strokes.every(n => n <= Math.ceil(one / 2) + 1), 'with the second blade every log is cut in about half the strokes', `${strokes.join(' ')} of ${one}`),
    ok(read().timber - t0 === 5 * AFTER_LOG_TIMBER, 'a log saws into the fixed timber', `${read().timber - t0} timber`)
  ];
});

// The throne's speech (docs/wave-act3-build.md, track B): warned first by God's
// gaze settling on one sign, then that one burnt away. Souls are
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
group('every act-3 card sells two or three named upgrades, none of them a ladder but the podium', async () => {
  up();
  const rows = window.__afterRows();
  const ups = Object.entries(AFTER_UPGRADES);
  const perCard = AFTER_CARDS.filter(c => c !== 'shack')
    .map(c => [c, ups.filter(([, u]) => u.card === c).length]);
  // The podium is the one ladder (DESIGN.md, "The level, the two crowds and
  // the flags"): a rung a support mark, not the yard's bands.
  const long = ups.filter(([k, u]) => u.bills.length > (k === 'after-plot' ? AFTER_PLOT_MAX - AFTER_PLOTS0 : u.marks ? u.marks.length : 1)).map(([k]) => k);
  const coins = new Set(ups.flatMap(([, u]) => u.bills.flat().map(([c]) => c)));
  window.__actsOn(null);
  return [
    ok(perCard.every(([c, n]) => n >= 1 && n <= 5), 'a card\'s upgrades are few (the grove\'s five, the saw among them)', JSON.stringify(perCard)),
    ok(long.length === 0, 'each is bought once, but for the grove\'s plots', long.join(', ')),
    ok([...coins].every(c => ['rebel', 'timber', ...AFTER_YARD_COINS].includes(c)), 'paid in rebel, timber and the yard\'s coins', [...coins].join(' ')),
    ok(rows.every(r => !r.bill.some(([c]) => c === 'pledge' || c === 'faith' || c === 'ink')), 'no pledge, no faith, no ink on any bill')
  ];
});
