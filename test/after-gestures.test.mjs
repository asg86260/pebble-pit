// Act 3's hand work (after/gestures.js; docs/mocks/act3-gestures-2026-10-18):
// every station worked by its own motion, the faster the sooner, two crits
// that are moments of timing, and the ghost hand that fades once the motion
// is learned. Each motion is made the way the pointer makes it -- a press,
// moves and a release through the very calls input.js makes (`gestureDown`,
// `gestureMove`, `gestureUp`), a frame of the act's clock between moves --
// and the pad's through `__pad`. The setup each check is not about (the act
// up, a station standing, stock on its pile, the axe in hand) goes through
// the act's hooks.
//
// Every group follows a hand's motion across more than five seconds, and the
// motion is this session's by design (a reload stands every station still),
// so the reload harness is kept out: `{ reload: false }`.
import { group, ok, run, yard, P } from './helpers.mjs';
import { AFTER_SHOUT_REBEL, AFTER_TIP_LOAD, AFTER_DIG_CLICKS, TREE_CHOPS, GESTURE_BUBBLE_CRIT, GESTURE_CUE_USES,
         GESTURE_CUE_FADE_S, GESTURE_CUE_IDLE_S, GESTURE_SAW_AMP, GESTURE_BAR_DRAG, GESTURE_SWING_S, GESTURE_SIGN_BLOWS,
         GESTURE_STUMP_DRAG } from '../src/config.js';
import { gestureDown, gestureMove, gestureUp, gestureView, partsOf, useBubbles, stumpWobble } from '../src/after/gestures.js';

const S = yard.S;
const read = () => window.__afterRead();
const OPENING = ['house-fall', 'arrive', 'meet-god', 'refuse'];
const NO_RELOAD = { reload: false };
const FRAME = 1 / 60;

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
const frame = () => run(FRAME);
// Frames until `done`, each first moved by `motion(t)` (t the seconds since
// it began); the seconds it took, or Infinity past `limit`.
function timeTo(motion, done, limit = 40) {
  for (let f = 0; f < limit * 60; f++) {
    motion(f * FRAME);
    frame();
    if (done()) return (f + 1) * FRAME;
  }
  return Infinity;
}
// A pointer turning round (cx, cy) at `rev` turns a second: pressed on the
// circle, then moved along it a frame at a time.
function spin(key, part, rev, done, limit) {
  const at = a => ({ x: part.x + Math.cos(a) * (part.r || part.rx), y: part.y + Math.sin(a) * (part.r || part.ry) });
  const p0 = at(0);
  gestureDown(p0.x, p0.y);
  const secs = timeTo(t => { const p = at(t * rev * 2 * Math.PI); gestureMove(p.x, p.y); }, done, limit);
  gestureUp();
  return secs;
}
const mid = b => ({ x: b.x + b.w / 2, y: b.y + b.h / 2 });

group('the saw mill: a faster spin of the flywheel cuts a log sooner, up to its cap', async () => {
  const trial = rev => {
    up(['mill'], { logs: 5 });
    const t0 = read().timber;
    return spin('mill', partsOf('mill').wheel, rev, () => read().timber > t0, 40);
  };
  const slow = trial(0.5), fast = trial(2), past = trial(4);
  window.__actsOn(null);
  return [
    ok(fast < slow, 'spun four times as fast, the log is cut sooner', `${slow.toFixed(2)} s -> ${fast.toFixed(2)} s`),
    ok(Number.isFinite(slow), 'spun slowly it is still cut', `${slow}`),
    ok(Math.abs(past - fast) < 0.5, 'past the wheel\'s cap, no sooner', `${fast.toFixed(2)} s at the cap, ${past.toFixed(2)} s past it`)
  ];
}, NO_RELOAD);

group('the paper mill: a faster stir fills the batch sooner', async () => {
  const trial = rev => {
    up(['mill', 'papermill'], { sawdust: 10 });
    const p0 = read().paper;
    return spin('papermill', partsOf('papermill').vat, rev, () => read().paper > p0, 40);
  };
  const slow = trial(0.4), fast = trial(1.2);
  window.__actsOn(null);
  return [ok(fast < slow && Number.isFinite(slow), 'stirred three times as fast, the sheet comes sooner', `${slow.toFixed(2)} s -> ${fast.toFixed(2)} s`)];
}, NO_RELOAD);

group('the chipper: held down, the feed ramps up, and a held feed chips a log sooner than pecks', async () => {
  const trial = pulse => {
    up(['chipper'], { chiplogs: 4 });
    const at = mid(partsOf('chipper').box), d0 = read().sawdust;
    let down = false;
    const secs = timeTo(t => {
      const want = !pulse || (t % (pulse * 2)) < pulse;
      if (want && !down) { gestureDown(at.x, at.y); down = true; }
      if (!want && down) { gestureUp(); down = false; }
    }, () => read().sawdust > d0, 40);
    gestureUp();
    return secs;
  };
  const held = trial(0), pecked = trial(0.3);
  window.__actsOn(null);
  return [ok(held < pecked, 'held, the log is chipped sooner than pressed in pecks', `${pecked.toFixed(2)} s pecked, ${held.toFixed(2)} s held`)];
}, NO_RELOAD);

group('the workshop: each tap a blow, faster taps join a sign sooner, no faster than the swing', async () => {
  const trial = every => {
    up(['mill', 'workshop'], { timber: 10 });
    const at = mid(partsOf('workshop').box), s0 = S.after.stock.signs;
    return timeTo(t => { if (Math.floor(t / every) !== Math.floor((t - FRAME) / every) || t === 0) { gestureDown(at.x, at.y); gestureUp(); } },
                  () => S.after.stock.signs > s0, 40);
  };
  const slow = trial(0.5), fast = trial(0.15), mashed = trial(FRAME);
  window.__actsOn(null);
  return [
    ok(fast < slow, 'tapped faster, the sign is done sooner', `${slow.toFixed(2)} s -> ${fast.toFixed(2)} s`),
    ok(mashed >= (GESTURE_SIGN_BLOWS - 1) * GESTURE_SWING_S, 'mashed every frame, no sooner than a blow a swing', `${mashed.toFixed(2)} s mashed`)
  ];
}, NO_RELOAD);

group('the press: the bar dragged down to its stop prints, a quicker pull sooner', async () => {
  const trial = pull => {
    up(['mill', 'papermill', 'press'], { paper: 4 });
    const b = partsOf('press').box, x = b.x + b.w / 2, y0 = b.y + P, s0 = S.after.stock.posters;
    gestureDown(x, y0);
    const secs = timeTo(t => gestureMove(x, y0 + Math.min(1, t / pull) * GESTURE_BAR_DRAG * 1.2), () => S.after.stock.posters > s0, 20);
    gestureUp();
    return secs;
  };
  const slow = trial(1.5), fast = trial(0.1);
  window.__actsOn(null);
  return [ok(fast < slow && Number.isFinite(slow), 'pulled quickly, the poster prints sooner', `${slow.toFixed(2)} s -> ${fast.toFixed(2)} s`)];
}, NO_RELOAD);

group('a tree: the two-person saw dragged back and forth, a stroke a chop, faster fells it sooner', async () => {
  const trial = period => {
    up();
    window.__afterAxe();
    const s = partsOf('tree', 0).saw;
    gestureDown(s.x, s.y);
    const secs = timeTo(t => gestureMove(s.x + Math.sin(t / period * 2 * Math.PI) * GESTURE_SAW_AMP * 1.2, s.y),
                        () => S.after.plots[0].fall != null, 60);
    gestureUp();
    return secs;
  };
  const slow = trial(3), fast = trial(0.6);
  window.__actsOn(null);
  return [
    ok(fast < slow && Number.isFinite(slow), `sawn faster, it falls sooner (${TREE_CHOPS} strokes)`, `${slow.toFixed(2)} s -> ${fast.toFixed(2)} s`)
  ];
}, NO_RELOAD);

group('the sawdust heap: a load dragged to the edge tips one, a fling tips up to three', async () => {
  const trial = (secs) => {
    up(['mill'], { sawdust: 24 });
    const p = partsOf('heap'), x0 = p.box.x + P, y = p.box.y + p.box.h - P * 2, d0 = read().sawdust;
    gestureDown(x0, y);
    const dist = p.edge - x0 + P * 2;
    timeTo(t => gestureMove(x0 + Math.min(1, t / secs) * dist, y), () => false, secs + FRAME);
    gestureUp();
    run(1);
    return (d0 - read().sawdust) / AFTER_TIP_LOAD;
  };
  const carried = trial(2), flung = trial(0.05);
  window.__actsOn(null);
  return [
    ok(carried === 1, 'carried slowly to the edge, one load tips', `${carried}`),
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
    const marks = rec('pedestal').marks.length;
    run(10);
    useBubbles(null);
    return { hit, paid: read().rebel - r0, marks };
  };
  const one = trial(small), five = trial(big);
  window.__actsOn(null);
  return [
    ok(one.hit && one.paid === AFTER_SHOUT_REBEL, 'a small bubble popped pays a line', `${one.paid}`),
    ok(five.hit && five.paid === AFTER_SHOUT_REBEL * GESTURE_BUBBLE_CRIT, `the big one pays ${GESTURE_BUBBLE_CRIT} lines`, `${five.paid}`),
    ok(one.marks === 0 && five.marks === 1, 'and only the big one leaves the crit\'s mark', `${one.marks} / ${five.marks}`)
  ];
}, NO_RELOAD);

group('a stump: held up it gives a root at a time; yanked as it wobbles it comes out in one pull', async () => {
  const stump = () => { up(); Object.assign(S.after.plots[0], { stage: 0, stump: true, dug: 0 }); return partsOf('stump', 0).at; };
  // Held high and kept there: a root a strain.
  let a = stump();
  gestureDown(a.x, a.y);
  gestureMove(a.x, a.y - 3 * P / GESTURE_STUMP_DRAG);
  run(1);
  const oneRoot = S.after.plots[0].dug, stillIn = S.after.plots[0].stump;
  gestureUp();
  // Held low, then yanked the frame the stump starts to wobble.
  a = stump();
  gestureDown(a.x, a.y);
  gestureMove(a.x, a.y - P / GESTURE_STUMP_DRAG);
  let waited = 0;
  while (!(stumpWobble() && stumpWobble().wobbling) && waited++ < 600) frame();
  const dug0 = S.after.plots[0].dug;
  gestureMove(a.x, a.y - 4 * P / GESTURE_STUMP_DRAG);
  for (let f = 0; f < 15; f++) frame();
  gestureUp();
  const out = !S.after.plots[0].stump, marks = rec('stump').marks;
  window.__actsOn(null);
  return [
    ok(oneRoot === 1 && stillIn, 'held up a second, one root snaps and the stump stays', `dug ${oneRoot}`),
    ok(waited < 600 && dug0 === 0, 'held low it waits for the wobble with every root in', `${waited} frames, dug ${dug0}`),
    ok(out, 'yanked in the wobble it comes out at once, and a sapling is set'),
    ok(marks.length === 1 && marks[0].n === AFTER_DIG_CLICKS, `the crit's mark counts the ${AFTER_DIG_CLICKS} roots`, JSON.stringify(marks.map(m => m.n)))
  ];
}, NO_RELOAD);

group('the ghost hand shows until the motion is done three times, then fades, and comes back after a long idle', async () => {
  up(['mill', 'workshop'], { timber: 20 });
  const at = mid(partsOf('workshop').box);
  const tap = () => { gestureDown(at.x, at.y); gestureUp(); run(0.3); };
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

group('the pad: A mashed on the workshop joins a sign, the stick turned spins the saw mill', async () => {
  const pad = window.__pad;
  up(['mill', 'workshop'], { timber: 10, logs: 5 });
  pad.on();
  pad.press('b');
  // The focus put on the station: the check is about what A and the stick do there.
  S.padFocus = 'ag:workshop';
  const s0 = S.after.stock.signs;
  for (let k = 0; k < 12; k++) { pad.press('a'); run(0.2); }
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
    ok(signs >= 1, 'A mashed at the workshop is blows, and a sign is joined', `${signs}`),
    ok(timber > 0, 'the stick turned round spins the flywheel and cuts', `${timber}`)
  ];
}, NO_RELOAD);
