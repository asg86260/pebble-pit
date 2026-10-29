// The saw mill as a machine a log is followed through (DESIGN.md, "Act 3's
// goods are blocks, and bodies carry every one", "The saw mill"): the sawyer
// lifts the top log off the log pile, carries it round and sets it down on
// the bed; the wheel drives the blade a stroke a turn; each column the blade
// eats rides out as a 2x2 timber block, down the chute and onto the timber
// mound, and the kerf falls a grain a down-stroke onto the heap at the saw's
// foot. Nothing is made, lost or moved but by a body, the hand or the blade:
// the log's sixteen cells are counted every frame wherever they are, on the
// pile, in the sawyer's hands, on the bed, riding out, in the air, on the
// mound and on the heap, and the sum never changes.
//
// Reached the way a player reaches it: the saw mill ordered off the shack
// (`__buy`), the sawyer put on through the roster's + (`__afterPress`); by
// hand, a log swept off the pile and let go over the bed through the yard's
// own hand (hands.js), the wheel dragged round and the heap clicked through
// the hand work's own calls (after/gestures.js). The setup it is not about:
// the act on and its opening played, members walked out of God's yard, the
// mill's logs granted onto its pile.
import { group, ok, run, runUntil, yard, restartReloadClock } from './helpers.mjs';
import { goodsRead } from '../src/after/piles.js';
import { lying } from '../src/after/ground.js';
import { RIM_PIECES, AFTER_BLOCK, AFTER_LOG_TIMBER, AFTER_KERF_GRAINS, AFTER_MILL, AFTER_TIP_LOAD } from '../src/config.js';
import { AFTER_JOB } from '../src/jobs.js';
import { track, sweep, release } from '../src/hands.js';
import { stripBox } from '../src/after/ground.js';
import { saw, millView, sawyerPose, sawyerHolds, millLanded, heapPlot } from '../src/after/mill.js';
import { stationX0, groundOf, AP } from '../src/after/place.js';
import { bottomY, count } from '../src/grid.js';
import { spin, click } from './after-hands.mjs';

const S = yard.S;
const OPENING = ['house-fall', 'arrive', 'meet-god', 'refuse'];
const LOG = AFTER_BLOCK.log, PLANK = AFTER_BLOCK.plank;
const st = () => goodsRead();

// The act begun, `n` members walked out, the saw mill ordered off the shack
// and raised.
function chain(n) {
  window.__actsOn(true);
  window.__goPlace('after');
  for (const k of OPENING) if (!S.beatsDone.includes(k)) S.beatsDone.push(k);
  window.__grant({ dust: 1e6, spores: 2e5, shards: 2e5, scales: 2e4, sparks: 2e4 });
  S.after.speech = { next: 1e9, f0: 0, held: null };   // the throne's speech is another check's
  window.__afterCrowd((i, v) => (i < n ? RIM_PIECES : v));
  runUntil(() => window.__afterRead().walking === 0, 240);
  window.__afterGrant({ rebel: 9000, timber: 40 });
  // the timber the build was paid in spent, so the mound starts bare
  const bought = window.__buy('after-build-mill');
  const built = runUntil(() => window.__afterRead().built.includes('mill'), 300);
  window.__afterGrant({ timber: -st().timber, grovelogs: -st().grovelogs });
  return bought && built;
}
// Every cell of wood in the machine's reach, wherever it is now.
function cells() {
  const s = saw(), v = millView();
  const bed = v.log ? v.log.left * LOG + v.grow * PLANK * PLANK + v.teeth : 0;
  return st().logs * LOG * LOG + (sawyerHolds() ? LOG * LOG : 0) + Math.round(bed)
    + s.out.length * PLANK * PLANK + s.dust.length + st().timber * PLANK * PLANK + st().sawdust
    + lying().reduce((n, q) => n + (q.kind === 'log' ? LOG * LOG : q.kind === 'plank' ? PLANK * PLANK : 0), 0);
}
const wx = c => stationX0('mill') + c * AP;
const wy = r => groundOf('mill') + r * AP;

group('one log followed through the sawyer\'s hands, the blade and out: three timber blocks on the mound and four grains on the heap', async () => {
  const stood = chain(2);
  const put = window.__afterPress(AFTER_JOB.SAW);
  window.__afterGrant({ logs: 1 });
  const total = cells(), t0 = st().timber, d0 = st().sawdust;
  let kept = true, liftAt = null, setAt = null, lifts = 0, sets = 0, blocks = 0, grains = 0, steps = true;
  let logs = st().logs, bed = false, timber = t0, dust = d0, landed = millLanded();
  for (let f = 0; f < 60 * 40 && !(timber - t0 === AFTER_LOG_TIMBER && dust - d0 === AFTER_KERF_GRAINS); f++) {
    run(1 / 60);
    kept = kept && cells() === total;
    const p = sawyerPose(), tr = saw().trip;
    // the log comes off the pile only into the sawyer's hands, at the pile
    if (st().logs < logs) { lifts++; liftAt = { x: p.x, ph: tr && tr.ph, holds: sawyerHolds() }; }
    // it goes onto the bed only out of them, the sawyer at the bed
    const on = !!millView().log;
    if (on && !bed) { sets++; setAt = { x: p.x, ph: tr && tr.ph }; }
    // a timber block joins the mound only as one comes off the chute
    if (st().timber > timber) { blocks += st().timber - timber; steps = steps && millLanded() - landed === st().timber - timber; }
    if (st().sawdust > dust) grains += st().sawdust - dust;
    logs = st().logs; bed = on; timber = st().timber; dust = st().sawdust; landed = millLanded();
  }
  const back = runUntil(() => !saw().trip, 10);
  window.__actsOn(null);
  return [
    ok(stood && put, 'the saw mill bought off the shack and a sawyer put on through the roster'),
    ok(lifts === 1 && liftAt && liftAt.ph === 'lift' && liftAt.holds && liftAt.x === AFTER_MILL.pose.pile, 'the log comes off the pile into the sawyer\'s hands, the sawyer at the pile', JSON.stringify(liftAt)),
    ok(sets === 1 && setAt && setAt.ph === 'set' && setAt.x === AFTER_MILL.pose.bed, 'and onto the bed out of them, the sawyer at the bed', JSON.stringify(setAt)),
    ok(blocks === AFTER_LOG_TIMBER && steps, 'three timber blocks reach the mound, each off the chute', `${blocks} blocks`),
    ok(grains === AFTER_KERF_GRAINS, 'four grains reach the heap', `${grains} grains`),
    ok(kept, 'not a cell of the log made or lost on the way, any frame', `${cells()} of ${total}`),
    ok(back && sawyerPose().wheel, 'the sawyer goes back into the wheel')
  ];
});

group('by hand: a log swept off the pile and let go over the bed, the wheel dragged round cuts it', async () => {
  chain(0);
  window.__afterGrant({ logs: 2 });
  S.carryLevel = 0;
  restartReloadClock();
  // nobody at the saw and the bed bare: the wheel turned a good many strokes
  // turns the saw and cuts nothing, nothing feeding it
  const turn0 = saw().turn, bare0 = st().timber + st().sawdust;
  spin('mill', 1.5, () => false, 4);
  run(3);
  const bareTurns = saw().turn - turn0, bareCut = st().timber + st().sawdust - bare0, bareLogs = st().logs;
  const total = cells();
  // the log pile's top block under the hand, then let go over the bed's seat
  const b = stripBox('logs');
  const from = { x: b.x + b.size * AP / 2, y: b.bottom - b.size * AP / 2 };
  S.trail = []; track(from.x, from.y); sweep(from.x, from.y);
  const took = S.held;
  const to = { x: wx(AFTER_MILL.seat.x + LOG / 2), y: wy(AFTER_MILL.frame.bed - LOG * 2) };
  S.trail = []; track(to.x, to.y); release(to.x, to.y);
  const landed = runUntil(() => !!millView().log, 5);
  const t0 = st().timber, d0 = st().sawdust;
  let kept = true;
  let bad = '';
  const secs = spin('mill', 1.5, () => { if (kept && cells() !== total) bad = JSON.stringify({ c: cells(), log: millView().log, st: st() }); kept = kept && cells() === total; return st().timber - t0 === AFTER_LOG_TIMBER && st().sawdust - d0 === AFTER_KERF_GRAINS; }, 30);
  // a turn with no log on the bed cuts nothing
  const t1 = st().timber;
  spin('mill', 1.5, () => false, 2);
  run(3);
  window.__actsOn(null);
  return [
    ok(bareTurns >= 5 && bareCut === 0 && bareLogs === 2, 'with nobody at the saw, the wheel turned with the bed bare cuts nothing and takes no log', `${bareTurns.toFixed(1)} turns, ${bareCut} made, ${bareLogs} logs on the pile`),
    ok(took === 1 && landed, 'the swept log lands on the bed', `${took} held, on the bed ${landed}`),
    ok(secs < 30, 'turned by hand, the log is cut into three timber blocks and four grains', `${secs.toFixed(1)} s`),
    ok(kept, 'not a cell made or lost on the way', `${cells()} of ${total} ${bad}`),
    ok(st().timber === t1, 'a wheel turned with the bed bare cuts nothing')
  ];
});

group('a reload mid-cut stands the log on the bed and the blocks on their way exactly where they were', async () => {
  chain(2);
  window.__afterPress(AFTER_JOB.SAW);
  window.__afterGrant({ logs: 2 });
  runUntil(() => saw().bed && saw().out.length > 0, 40);
  const before = JSON.stringify(saw()), stock = JSON.stringify(st()), total = cells();
  yard.persist();
  yard.restore();
  const after = JSON.stringify(saw()), stock1 = JSON.stringify(st());
  const heapOk = count(heapPlot()) === st().sawdust;
  run(10);
  window.__actsOn(null);
  return [
    ok(before === after && stock1 === stock, 'the machine reads back as it was saved', after.slice(0, 160)),
    ok(heapOk, 'the heap stood back up from its count'),
    ok(cells() === total, 'and runs on, nothing made or lost', `${cells()} of ${total}`)
  ];
});

group('a click on the heap tips a load through the hatch', async () => {
  chain(0);
  window.__afterGrant({ sawdust: 24, logs: 2 });
  run(1);
  const b = heapPlot(), d0 = st().sawdust;
  const box = { x: b.x + b.cols * b.p / 2, y: bottomY(b) - b.p / 2 };
  const took = click(box);
  const d1 = st().sawdust;
  const held = count(b) === d1;
  window.__actsOn(null);
  return [
    ok(took && d0 - d1 === AFTER_TIP_LOAD, 'a click on the heap tips a load', `${d0} -> ${d1}`),
    ok(held, 'the heap\'s plot holds exactly its count after', `${count(b)} grains for ${d1}`)
  ];
});

// The chute and the mound it feeds are laid by one rule (after/art.js): the
// mill's `reach` is the chute's foot and the block on it, and the mound is
// laid the shared gap past that, so the chute never stands over the mound
// and nothing but that gap lies between them.
import { ART } from '../src/after/art.js';
import { AFTER_PILE_GAP } from '../src/config.js';
group('the saw mill\'s chute ends the shared gap short of its timber mound', async () => {
  return [
    ok(ART.mill.reach === AFTER_MILL.chute.x1 + 2, 'the mill\'s reach is the chute\'s foot and the block on it', `${ART.mill.reach} for a foot at ${AFTER_MILL.chute.x1}`),
    ok(ART.mill.pile.timber === ART.mill.reach + AFTER_PILE_GAP, 'and its mound is laid the shared gap past it', `${ART.mill.pile.timber}`)
  ];
});
