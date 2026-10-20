// Act 3's hand work in the world (after/gestures.js; docs/wave-act3-build.md,
// track A): every station worked by dragging its own moving part where it
// stands, the faster the sooner, and a plain click on a station asking for
// its board. Each motion is made the way the pointer makes it -- a press,
// moves and a release through the very calls input.js makes, at the world
// points where the part is drawn, a frame of the act's clock between moves
// (test/after-hands.mjs); the pad's through `__pad`. The setup each check
// is not about (the act up, a station standing, stock on its pile, the axe
// in hand) goes through the act's hooks.
//
// Every group follows a hand's motion across more than five seconds, and the
// motion is this session's by design (a reload stands every station still),
// so the reload harness is kept out: `{ reload: false }`.
import { group, ok, run, yard, P } from './helpers.mjs';
import { AFTER_PODIUM_REBEL, AFTER_TIP_LOAD, AFTER_DIG_CLICKS, TREE_CHOPS, GESTURE_BUBBLE_CRIT, GESTURE_CUE_USES,
         GESTURE_CUE_FADE_S, GESTURE_CUE_IDLE_S, GESTURE_STRAIN_S, GESTURE_ARM_POSES, GESTURE_ARM_SPRING_S,
         GESTURE_JOINER_WAIT_S, GESTURE_NAIL_TAPS, AFTER_CHIP_SAWDUST } from '../src/config.js';
import { gestureDown, gestureMove, gestureUp, gestureView, partsOf, useBubbles, boardAsked, groveIcons } from '../src/after/gestures.js';
import { stationBox } from '../src/after/place.js';
import { godMid, faceY } from '../src/after/sky.js';
import { FRAME, frame, click, timeTo, sawOn, saw, lift, spin, feedLog, pullArm, nailSign, pullBar } from './after-hands.mjs';

const S = yard.S;
const read = () => window.__afterRead();
const OPENING = ['house-fall', 'arrive', 'meet-god', 'refuse'];
const NO_RELOAD = { reload: false };
const mid = b => ({ x: b.x + b.w / 2, y: b.y + b.h / 2 });

// A fresh act each time: the place stood up again from nothing, so a second
// trial in a group starts as still as the first.
function up(stand = [], stock = {}) {
  window.__actsOn(true);
  S.after = null;
  window.__goPlace('after');
  for (const k of OPENING) if (!S.beatsDone.includes(k)) S.beatsDone.push(k);
  run(1);
  for (const k of stand) if (!S.after.built.includes(k)) S.after.built.push(k);
  window.__afterGrant(stock);
}
const rec = key => gestureView().find(r => r.key === key);

group('the saw mill: its flywheel spun faster where it stands cuts a log sooner, up to its cap', async () => {
  const trial = rev => { up(['mill'], { logs: 5 }); const t0 = read().timber; return spin('mill', rev, () => read().timber > t0, 40); };
  const slow = trial(0.5), fast = trial(2), past = trial(4);
  window.__actsOn(null);
  return [
    ok(fast < slow, 'spun four times as fast, the log is cut sooner', `${slow.toFixed(2)} s -> ${fast.toFixed(2)} s`),
    ok(Number.isFinite(slow), 'spun slowly it is still cut', `${slow}`),
    ok(Math.abs(past - fast) < 0.5, 'past the wheel\'s cap, no sooner', `${fast.toFixed(2)} s at the cap, ${past.toFixed(2)} s past it`)
  ];
}, NO_RELOAD);

group('the paper mill: its vat stirred faster fills the batch sooner', async () => {
  const trial = rev => { up(['mill', 'papermill'], { sawdust: 10 }); const p0 = read().paper; return spin('papermill', rev, () => read().paper > p0, 40); };
  const slow = trial(0.4), fast = trial(1.2);
  window.__actsOn(null);
  return [ok(fast < slow && Number.isFinite(slow), 'stirred three times as fast, the sheet comes sooner', `${slow.toFixed(2)} s -> ${fast.toFixed(2)} s`)];
}, NO_RELOAD);

group('the chipper: a log dragged into the jaws, then the arm pulled down and held, chips it; let go, the arm springs back a pose at a time', async () => {
  up(['chipper'], { chiplogs: 3 });
  const d0 = read().sawdust;
  // The arm pulled with nothing in the jaws chips nothing.
  pullArm(6);
  const empty = read().sawdust === d0;
  const laid = feedLog() && rec('chipper').log === 'in';
  // Pulled, then let go at once: the arm comes back up in held steps and the jaws stop.
  const a = mid(partsOf('chipper').arm);
  gestureDown(a.x, a.y); gestureMove(a.x, a.y + 200); frame(); gestureUp(a.x, a.y + 200);
  const poses = new Set();
  for (let f = 0; f < 30; f++) { frame(); poses.add(Math.round(rec('chipper').k * (GESTURE_ARM_POSES - 1))); }
  const sprang = rec('chipper').k === 0 && poses.size >= GESTURE_ARM_POSES - 1;
  const stopped = read().sawdust === d0;
  // Held down: a steady feed, and the log goes through.
  pullArm(6);
  const chipped = read().sawdust - d0;
  window.__actsOn(null);
  return [
    ok(empty, 'the arm pulled with no log in the jaws chips nothing'),
    ok(laid, 'a log dragged off the pile into the jaws is laid in them'),
    ok(sprang, 'let go, the arm springs back up a held pose at a time', [...poses].join(' ')),
    ok(stopped, 'and the jaws stop: nothing chipped'),
    ok(chipped === AFTER_CHIP_SAWDUST, 'pulled down and held, the log is chipped', `${chipped} sawdust`)
  ];
}, NO_RELOAD);

group('the workshop: four nails a sign, two taps each; a miss does nothing; the joiner taps on once the hand stops', async () => {
  up(['mill', 'workshop'], { timber: 10, rebel: 500 });
  window.__grant({ dust: 40000, spores: 5000, shards: 2000, scales: 3000, sparks: 400 });
  const s0 = S.after.stock.signs;
  // Off the nails, on the blank between two of them: nothing.
  const n0 = partsOf('workshop').nails[0];
  click({ x: n0.x + n0.w + P / 2, y: n0.y + n0.h / 2 }); run(0.3);
  const missed = rec('workshop').nails.every(n => n === 0);
  // One tap drives a nail half in, the second flush.
  click(mid(partsOf('workshop').nails[0])); run(0.3);
  const half = rec('workshop').nails[0] === 1;
  click(mid(partsOf('workshop').nails[0])); run(0.3);
  const flush = rec('workshop').nails[0] === GESTURE_NAIL_TAPS;
  click(mid(partsOf('workshop').nails[0])); run(0.3);
  const still = rec('workshop').nails[0] === GESTURE_NAIL_TAPS;
  for (let k = 1; k < 4; k++) for (let n = 0; n < GESTURE_NAIL_TAPS; n++) { click(mid(partsOf('workshop').nails[k])); run(0.3); }
  const one = S.after.stock.signs - s0;
  // A nail half in, then a joiner at the bench: it drives the rest alone.
  window.__afterGrant({ timber: 20 });
  click(mid(partsOf('workshop').nails[2])); run(0.3);
  const t0 = S.after.t;
  S.after.camp += 1;
  window.__buy('after-post-joiner');
  const joined = timeTo(() => {}, () => rec('workshop').nails.every(n => n === 0) && rec('workshop').auto > t0, 120);
  window.__actsOn(null);
  return [
    ok(missed, 'a tap off the nails does nothing'),
    ok(half && flush && still, 'a nail goes half in, then flush, and a flush nail takes no more'),
    ok(one === 1, 'four nails flush: a sign', `${one}`),
    ok(Number.isFinite(joined) && joined > GESTURE_JOINER_WAIT_S, 'the joiner taps the rest on its own once the hand has stopped', `${joined}`)
  ];
}, NO_RELOAD);

group('the press: its bar dragged down to its stop prints, a quicker pull sooner', async () => {
  const trial = secs => {
    up(['mill', 'papermill', 'press'], { paper: 4 });
    const s0 = S.after.stock.posters, h = mid(partsOf('press').handle);
    gestureDown(h.x, h.y);
    const t = timeTo(t => gestureMove(h.x, h.y + Math.min(1, t / secs) * 80), () => S.after.stock.posters > s0, 20);
    gestureUp(h.x, h.y);
    return t;
  };
  const slow = trial(1.5), fast = trial(0.1);
  window.__actsOn(null);
  return [ok(fast < slow && Number.isFinite(slow), 'pulled quickly, the poster prints sooner', `${slow.toFixed(2)} s -> ${fast.toFixed(2)} s`)];
}, NO_RELOAD);

group('a tree: its saw icon clicked puts the handsaw on it; dragged back and forth, a stroke a chop, faster fells it sooner', async () => {
  const trial = period => {
    up();
    window.__afterAxe();
    run(0.5);
    const icon = groveIcons().some(c => c.kind === 'saw' && c.i === 0);
    const on = sawOn(0) && rec('tree').i === 0;
    return { icon, on, secs: saw(0, () => S.after.plots[0].fall != null, period) };
  };
  const slow = trial(3), fast = trial(0.6);
  // A plain click on the trunk asks for the grove's board.
  up();
  window.__afterAxe();
  const t = window.__afterTrees()[0];
  click({ x: t.x, y: t.y });
  const asked = boardAsked();
  window.__actsOn(null);
  return [
    ok(slow.icon && slow.on, 'the saw icon shows over the grown tree, and a click on it puts the saw on'),
    ok(fast.secs < slow.secs && Number.isFinite(slow.secs), `sawn faster, it falls sooner (${TREE_CHOPS} strokes)`, `${slow.secs.toFixed(2)} s -> ${fast.secs.toFixed(2)} s`),
    ok(asked && asked.key === 'grove', 'a plain click on the tree asks for the grove\'s board', JSON.stringify(asked))
  ];
}, NO_RELOAD);

group('the sawdust heap: a load dragged to the notch tips one, a fling tips up to three', async () => {
  const trial = secs => {
    up(['mill'], { sawdust: 24 });
    const p = partsOf('heap'), a = mid(p.heap), d0 = read().sawdust, dist = p.edge - a.x + P * 2;
    gestureDown(a.x, a.y);
    timeTo(t => gestureMove(a.x + Math.min(1, t / secs) * dist, a.y), () => false, secs + FRAME);
    gestureUp(a.x + dist, a.y);
    run(1);
    return (d0 - read().sawdust) / AFTER_TIP_LOAD;
  };
  const carried = trial(2), flung = trial(0.05);
  window.__actsOn(null);
  return [
    ok(carried === 1, 'carried slowly to the notch, one load tips', `${carried}`),
    ok(flung === 3, 'flung hard, three go', `${flung}`)
  ];
}, NO_RELOAD);

group('the pedestal: a popped bubble is a line of the speech, and the big one pays five', async () => {
  const small = { x: 0, y: 0, w: P * 7, h: P * 4, big: false }, big = { x: 0, y: 0, w: P * 10, h: P * 6, big: true };
  const trial = b => {
    up();
    const pair = partsOf('pedestal').box;
    Object.assign(b, { x: pair.x, y: pair.y - P * 12 });
    let air = [b];
    useBubbles({ list: () => air, pop: x => { const had = air.includes(x); air = air.filter(y => y !== x); return had; } });
    const r0 = read().rebel;
    const hit = gestureDown(b.x + b.w / 2, b.y + b.h / 2);
    gestureUp();
    const marks = rec('pedestal').marks.length, asked = boardAsked();
    run(10);
    useBubbles(null);
    return { hit, paid: read().rebel - r0, marks, asked };
  };
  const one = trial(small), five = trial(big);
  window.__actsOn(null);
  return [
    ok(one.hit && one.paid === AFTER_PODIUM_REBEL[0], 'a small bubble popped pays a line', `${one.paid}`),
    ok(five.hit && five.paid === AFTER_PODIUM_REBEL[0] * GESTURE_BUBBLE_CRIT, `the big one pays ${GESTURE_BUBBLE_CRIT} lines`, `${five.paid}`),
    ok(one.marks === 0 && five.marks === 1, 'and only the big one leaves the crit\'s mark', `${one.marks} / ${five.marks}`),
    ok(!one.asked && !five.asked, 'popped where it rises: no board asked for', JSON.stringify([one.asked, five.asked]))
  ];
}, NO_RELOAD);

// The rebel a popped bubble knocks loose starts at the bubble, not at the
// pair's heads, and is counted only when it lands on the pile.
group('the pedestal: a popped bubble\'s rebel starts at the bubble and is counted where it lands', async () => {
  up();
  const pair = partsOf('pedestal').box, b = { x: pair.x + P * 20, y: pair.y - P * 24, w: P * 7, h: P * 4, big: false };
  let air = [b];
  useBubbles({ list: () => air, pop: x => { const had = air.includes(x); air = air.filter(y => y !== x); return had; } });
  const r0 = read().rebel, m0 = S.after.motes.length, at = mid(b);
  gestureDown(at.x, at.y);
  gestureUp();
  const motes = S.after.motes.slice(m0).map(m => ({ x: m.x, y: m.y, v: m.v }));
  const fromBubble = motes.length > 0 && motes.every(m => Math.abs(m.x - at.x) <= b.w && Math.abs(m.y - at.y) <= P);
  const carried = motes.reduce((s, m) => s + m.v, 0), early = read().rebel - r0;
  run(10);
  useBubbles(null);
  const paid = read().rebel - r0;
  window.__actsOn(null);
  return [
    ok(fromBubble, 'every mote starts at the bubble', JSON.stringify({ at, motes })),
    ok(early === 0 && carried === AFTER_PODIUM_REBEL[0], 'carrying the line, and nothing counted on the pop', `${carried} carried, ${early} counted`),
    ok(paid === AFTER_PODIUM_REBEL[0], 'counted once they land on the pile', `${paid}`)
  ];
}, NO_RELOAD);

group('a stump: its shovel shows; dragged up and held, a root gives at a time until it is out, no crit', async () => {
  up();
  Object.assign(S.after.plots[0], { stage: 0, stump: true, dug: 0 });
  run(0.2);
  const shovel = groveIcons().some(c => c.kind === 'shovel' && c.i === 0);
  lift(0, 3, GESTURE_STRAIN_S * 1.5);
  const oneRoot = S.after.plots[0].dug, stillIn = S.after.plots[0].stump;
  lift(0, 3, GESTURE_STRAIN_S * (AFTER_DIG_CLICKS + 1));
  const out = !S.after.plots[0].stump && S.after.plots[0].stage === 1;
  const marks = rec('stump').marks.length, gone = !groveIcons().some(c => c.kind === 'shovel');
  window.__actsOn(null);
  return [
    ok(shovel, 'a stump shows its shovel icon'),
    ok(oneRoot === 1 && stillIn, 'held up a moment, one root gives and the stump stays', `dug ${oneRoot}`),
    ok(out && gone, 'held long enough it comes out, a sapling is set, and the shovel goes'),
    ok(marks === 0, 'and no crit is marked', `${marks}`)
  ];
}, NO_RELOAD);

group('a plain click on a station asks for its board; a click on open floor asks for nothing', async () => {
  up(['mill', 'papermill', 'workshop', 'press']);
  const asked = [];
  for (const k of ['papermill', 'workshop', 'press', 'shack', 'pedestal']) {
    const b = k === 'pedestal' ? partsOf('pedestal').top : stationBox(k);
    click({ x: b.x + P, y: b.y + b.h - P });
    const a = boardAsked();
    asked.push(a && a.key);
  }
  // God's camp where it is drawn, far back on the cloud: a click on him.
  click({ x: godMid(S.camX + S.viewW / 2), y: faceY() });
  const crowd = boardAsked();
  const before = boardAsked(), b = stationBox('workshop');
  const floorTook = click({ x: b.x + b.w + P * 8, y: b.y + b.h - P });
  const after = boardAsked();
  window.__actsOn(null);
  return [
    ok(asked.join() === 'papermill,workshop,press,shack,pedestal', 'each station\'s board, by a click on its drawing', asked.join()),
    ok(crowd && crowd.key === 'crowd', 'a click on the crowd of God asks for its status board', JSON.stringify(crowd)),
    ok(!floorTook && after === before, 'the open floor asks for none, and the click is still the place\'s', `${floorTook}`)
  ];
}, NO_RELOAD);

group('the ghost hand shows until the motion is done three times, then fades, and comes back after a long idle', async () => {
  up(['mill', 'workshop'], { timber: 20 });
  let k = 0;
  const tap = () => { click(mid(partsOf('workshop').nails[k++ % 4])); run(0.3); };
  const a0 = rec('workshop').cueA;
  for (let k = 0; k < GESTURE_CUE_USES - 1; k++) tap();
  run(GESTURE_CUE_FADE_S * 2);
  const before = rec('workshop').cueA;
  tap();
  run(GESTURE_CUE_FADE_S / 2);
  const fading = rec('workshop').cueA;
  run(GESTURE_CUE_FADE_S);
  const gone = rec('workshop').cueA, other = rec('mill').cueA;
  run(GESTURE_CUE_IDLE_S + GESTURE_CUE_FADE_S * 2);
  const back = rec('workshop').cueA;
  window.__actsOn(null);
  return [
    ok(a0 === 1 && before === 1, `shown in full through the first ${GESTURE_CUE_USES - 1} uses`, `${a0} ${before}`),
    ok(fading > 0 && fading < 1, 'after the third, it fades rather than going at once', `${fading}`),
    ok(gone === 0, 'and is gone', `${gone}`),
    ok(other === 1, 'a station not yet worked still shows its own', `${other}`),
    ok(back === 1, 'left idle long enough, it comes back', `${back}`)
  ];
}, NO_RELOAD);

group('the pad: A on the workshop taps nails into a sign, the stick turned round spins the saw mill', async () => {
  const pad = window.__pad;
  up(['mill', 'workshop'], { timber: 10, logs: 5 });
  pad.on();
  pad.press('b');
  // The focus put on the station: the check is about what A and the stick do there.
  S.padFocus = 'ag:workshop';
  const s0 = S.after.stock.signs;
  for (let k = 0; k < 10; k++) { pad.press('a'); run(0.2); }
  const signs = S.after.stock.signs - s0;
  S.padFocus = 'ag:mill';
  const t0 = read().timber;
  for (let f = 0; f < 60 * 6; f++) {
    const a = f / 60 * 1.5 * 2 * Math.PI;
    pad.stick(Math.cos(a), Math.sin(a));
    pad.step(FRAME);
    frame();
  }
  pad.stick(0, 0); pad.step(FRAME);
  const timber = read().timber - t0;
  pad.off();
  window.__actsOn(null);
  return [
    ok(signs >= 1, 'A mashed on the workshop drives the nails, and a sign is joined', `${signs}`),
    ok(timber > 0, 'the stick turned round spins the flywheel and cuts', `${timber}`)
  ];
}, NO_RELOAD);
