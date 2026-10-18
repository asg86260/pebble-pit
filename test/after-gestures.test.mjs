// Act 3's hand work (after/gestures.js; docs/mocks/act3-gestures-2026-10-18,
// and the card it is made on, docs/mocks/act3-handcontrol-2026-10-18):
// every station worked by its own motion on its card's big part, the faster
// the sooner, two crits that are moments of timing, and the ghost hand that
// fades once the motion is learned. Each card is opened the way the pointer
// opens it -- a click on the station -- and each motion made the way the
// pointer makes it, on the card: a press, moves and a release through the
// very calls input.js makes (`gestureDown`, `gestureMove`, `gestureUp`), at
// the world points the pointer gives over the card's part, a frame of the
// act's clock between moves; the pad's through `__pad`. The setup each check
// is not about (the act up, a station standing, stock on its pile, the axe
// in hand) goes through the act's hooks.
//
// Every group follows a hand's motion across more than five seconds, and the
// motion is this session's by design (a reload stands every station still),
// so the reload harness is kept out: `{ reload: false }`.
import { group, ok, run, yard, P } from './helpers.mjs';
import { AFTER_SHOUT_REBEL, AFTER_TIP_LOAD, AFTER_DIG_CLICKS, TREE_CHOPS, GESTURE_BUBBLE_CRIT, GESTURE_CUE_USES,
         GESTURE_CUE_FADE_S, GESTURE_CUE_IDLE_S, GESTURE_SAW_AMP, GESTURE_BAR_DRAG, GESTURE_SWING_S, GESTURE_SIGN_BLOWS,
         GESTURE_STUMP_DRAG, CARD_IN_S } from '../src/config.js';
import { gestureDown, gestureMove, gestureUp, gestureView, partsOf, useBubbles, stumpWobble, cardOpen, cardToWorld,
         cardsView } from '../src/after/gestures.js';
import { stationBox, stationParts } from '../src/after/place.js';

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
const mid = b => ({ x: b.x + b.w / 2, y: b.y + b.h / 2 });
// Where a click on a station lands: the middle of its drawing, a tree's
// crown, a stump's block, the heap.
function stationAt(key, i = 0) {
  if (key === 'tree') { const t = window.__afterTrees()[i]; return { x: t.x, y: t.y }; }
  if (key === 'stump') { const t = window.__afterTrees()[i]; return { x: t.sx, y: t.sy }; }
  if (key === 'heap') return mid(stationParts('heap').heap);
  return mid(stationBox(key));
}
// A click: a press and a release at a world point.
const click = p => { const took = gestureDown(p.x, p.y); gestureUp(p.x, p.y); return took; };
// Station `key`'s card opened by a click on it, and given its fade in.
function openOn(key, i = 0) {
  click(stationAt(key, i));
  run(CARD_IN_S * 2);
  return cardOpen();
}
// The pointer on the open card's grid: card px in, world px out.
const on = (x, y) => cardToWorld(x, y);
const down = (x, y) => { const p = on(x, y); return gestureDown(p.x, p.y); };
const move = (x, y) => { const p = on(x, y); gestureMove(p.x, p.y); };
const lift = (x, y) => { const p = on(x, y); if (p) gestureUp(p.x, p.y); else gestureUp(); };

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
// A pointer turning round the card's part at `rev` turns a second: pressed
// on its rim, then moved along it a frame at a time.
function spin(part, rev, done, limit) {
  const at = a => ({ x: part.x + Math.cos(a) * (part.r || part.rx), y: part.y + Math.sin(a) * (part.r || part.ry) });
  const p0 = at(0);
  down(p0.x, p0.y);
  const secs = timeTo(t => { const p = at(t * rev * 2 * Math.PI); move(p.x, p.y); }, done, limit);
  lift(p0.x, p0.y);
  return secs;
}

group('the saw mill: a faster spin of the flywheel on its card cuts a log sooner, up to its cap', async () => {
  const trial = rev => {
    up(['mill'], { logs: 5 });
    openOn('mill');
    const t0 = read().timber;
    return spin(partsOf('mill').wheel, rev, () => read().timber > t0, 40);
  };
  const slow = trial(0.5), fast = trial(2), past = trial(4);
  window.__actsOn(null);
  return [
    ok(fast < slow, 'spun four times as fast, the log is cut sooner', `${slow.toFixed(2)} s -> ${fast.toFixed(2)} s`),
    ok(Number.isFinite(slow), 'spun slowly it is still cut', `${slow}`),
    ok(Math.abs(past - fast) < 0.5, 'past the wheel\'s cap, no sooner', `${fast.toFixed(2)} s at the cap, ${past.toFixed(2)} s past it`)
  ];
}, NO_RELOAD);

group('the paper mill: a faster stir of the vat on its card fills the batch sooner', async () => {
  const trial = rev => {
    up(['mill', 'papermill'], { sawdust: 10 });
    openOn('papermill');
    const p0 = read().paper;
    return spin(partsOf('papermill').vat, rev, () => read().paper > p0, 40);
  };
  const slow = trial(0.4), fast = trial(1.2);
  window.__actsOn(null);
  return [ok(fast < slow && Number.isFinite(slow), 'stirred three times as fast, the sheet comes sooner', `${slow.toFixed(2)} s -> ${fast.toFixed(2)} s`)];
}, NO_RELOAD);

group('the chipper: its feed held down on the card ramps up, and chips a log sooner than pecks', async () => {
  const trial = pulse => {
    up(['chipper'], { chiplogs: 4 });
    openOn('chipper');
    const at = mid(partsOf('chipper').box), d0 = read().sawdust;
    let held = false;
    const secs = timeTo(t => {
      const want = !pulse || (t % (pulse * 2)) < pulse;
      if (want && !held) { down(at.x, at.y); held = true; }
      if (!want && held) { lift(at.x, at.y); held = false; }
    }, () => read().sawdust > d0, 40);
    lift(at.x, at.y);
    return secs;
  };
  const held = trial(0), pecked = trial(0.3);
  window.__actsOn(null);
  return [ok(held < pecked, 'held, the log is chipped sooner than pressed in pecks', `${pecked.toFixed(2)} s pecked, ${held.toFixed(2)} s held`)];
}, NO_RELOAD);

group('the workshop: each tap on the card\'s pad a blow, faster taps join a sign sooner, no faster than the swing', async () => {
  const trial = every => {
    up(['mill', 'workshop'], { timber: 10 });
    openOn('workshop');
    const at = mid(partsOf('workshop').box), s0 = S.after.stock.signs;
    return timeTo(t => { if (Math.floor(t / every) !== Math.floor((t - FRAME) / every) || t === 0) { down(at.x, at.y); lift(at.x, at.y); } },
                  () => S.after.stock.signs > s0, 40);
  };
  const slow = trial(0.5), fast = trial(0.15), mashed = trial(FRAME);
  window.__actsOn(null);
  return [
    ok(fast < slow, 'tapped faster, the sign is done sooner', `${slow.toFixed(2)} s -> ${fast.toFixed(2)} s`),
    ok(mashed >= (GESTURE_SIGN_BLOWS - 1) * GESTURE_SWING_S, 'mashed every frame, no sooner than a blow a swing', `${mashed.toFixed(2)} s mashed`)
  ];
}, NO_RELOAD);

group('the press: the card\'s bar dragged down to its stop prints, a quicker pull sooner', async () => {
  const trial = pull => {
    up(['mill', 'papermill', 'press'], { paper: 4 });
    openOn('press');
    const b = partsOf('press').box, x = b.x + b.w / 2, y0 = b.y + P, s0 = S.after.stock.posters;
    down(x, y0);
    const secs = timeTo(t => move(x, y0 + Math.min(1, t / pull) * GESTURE_BAR_DRAG * 1.2), () => S.after.stock.posters > s0, 20);
    lift(x, y0);
    return secs;
  };
  const slow = trial(1.5), fast = trial(0.1);
  window.__actsOn(null);
  return [ok(fast < slow && Number.isFinite(slow), 'pulled quickly, the poster prints sooner', `${slow.toFixed(2)} s -> ${fast.toFixed(2)} s`)];
}, NO_RELOAD);

group('a tree: the card\'s two-person saw dragged back and forth, a stroke a chop, faster fells it sooner', async () => {
  const trial = period => {
    up();
    window.__afterAxe();
    openOn('tree', 0);
    const s = partsOf('tree').saw;
    down(s.x, s.y);
    const secs = timeTo(t => move(s.x + Math.sin(t / period * 2 * Math.PI) * GESTURE_SAW_AMP * 1.2, s.y),
                        () => S.after.plots[0].fall != null, 60);
    lift(s.x, s.y);
    return secs;
  };
  const slow = trial(3), fast = trial(0.6);
  window.__actsOn(null);
  return [
    ok(fast < slow && Number.isFinite(slow), `sawn faster, it falls sooner (${TREE_CHOPS} strokes)`, `${slow.toFixed(2)} s -> ${fast.toFixed(2)} s`)
  ];
}, NO_RELOAD);

group('the sawdust heap: a load on its card dragged to the edge tips one, a fling tips up to three', async () => {
  const trial = (secs) => {
    up(['mill'], { sawdust: 24 });
    openOn('heap');
    const p = partsOf('heap'), x0 = p.box.x + P, y = p.box.y + p.box.h - P * 2, d0 = read().sawdust;
    down(x0, y);
    const dist = p.edge - x0 + P * 2;
    timeTo(t => move(x0 + Math.min(1, t / secs) * dist, y), () => false, secs + FRAME);
    lift(x0 + dist, y);
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
    const marks = rec('pedestal').marks.length, card = cardOpen();
    run(10);
    useBubbles(null);
    return { hit, paid: read().rebel - r0, marks, card };
  };
  const one = trial(small), five = trial(big);
  window.__actsOn(null);
  return [
    ok(one.hit && one.paid === AFTER_SHOUT_REBEL, 'a small bubble popped pays a line', `${one.paid}`),
    ok(five.hit && five.paid === AFTER_SHOUT_REBEL * GESTURE_BUBBLE_CRIT, `the big one pays ${GESTURE_BUBBLE_CRIT} lines`, `${five.paid}`),
    ok(one.marks === 0 && five.marks === 1, 'and only the big one leaves the crit\'s mark', `${one.marks} / ${five.marks}`),
    ok(!one.card && !five.card, 'popped where it rises: the pedestal opens no card', JSON.stringify([one.card, five.card]))
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
    ok(early === 0 && carried === AFTER_SHOUT_REBEL, 'carrying the line, and nothing counted on the pop', `${carried} carried, ${early} counted`),
    ok(paid === AFTER_SHOUT_REBEL, 'counted once they land on the pile', `${paid}`)
  ];
}, NO_RELOAD);

group('a stump: its card\'s grip held up gives a root at a time; yanked as it wobbles it comes out in one pull', async () => {
  const stump = () => { up(); Object.assign(S.after.plots[0], { stage: 0, stump: true, dug: 0 }); openOn('stump', 0); return partsOf('stump').at; };
  // Held high and kept there: a root a strain.
  let a = stump();
  const opened = cardOpen();
  down(a.x, a.y);
  move(a.x, a.y - 3 * P / GESTURE_STUMP_DRAG);
  run(1);
  const oneRoot = S.after.plots[0].dug, stillIn = S.after.plots[0].stump;
  lift(a.x, a.y);
  // Held low, then yanked the frame the stump starts to wobble.
  a = stump();
  down(a.x, a.y);
  move(a.x, a.y - P / GESTURE_STUMP_DRAG);
  let waited = 0;
  while (!(stumpWobble() && stumpWobble().wobbling) && waited++ < 600) frame();
  const dug0 = S.after.plots[0].dug;
  move(a.x, a.y - 4 * P / GESTURE_STUMP_DRAG);
  for (let f = 0; f < 15; f++) frame();
  lift(a.x, a.y);
  const out = !S.after.plots[0].stump, marks = rec('stump').marks;
  window.__actsOn(null);
  return [
    ok(opened && opened.key === 'stump' && opened.i === 0, 'a click on the stump opens its card', JSON.stringify(opened)),
    ok(oneRoot === 1 && stillIn, 'held up a second, one root snaps and the stump stays', `dug ${oneRoot}`),
    ok(waited < 600 && dug0 === 0, 'held low it waits for the wobble with every root in', `${waited} frames, dug ${dug0}`),
    ok(out, 'yanked in the wobble it comes out at once, and a sapling is set'),
    ok(marks.length === 1 && marks[0].n === AFTER_DIG_CLICKS && marks[0].card, `the crit's mark on the card counts the ${AFTER_DIG_CLICKS} roots`, JSON.stringify(marks))
  ];
}, NO_RELOAD);

group('the card: a click opens it, a click on another station swaps it, a floor click shuts it', async () => {
  up(['mill', 'papermill', 'workshop'], { timber: 10, logs: 5 });
  const shut0 = cardOpen();
  openOn('papermill');
  const first = cardOpen(), shown = cardsView().map(c => c.key);
  // Another station: the one open swaps, both on the glass a moment, the
  // leaving one sliding aside as it goes.
  const r0 = cardsView().find(c => c.key === 'papermill').rect.x;
  click(stationAt('workshop'));
  run(1 / 10);
  const both = cardsView().map(c => c.key).sort(), slid = cardsView().find(c => c.key === 'papermill');
  run(1);
  const swapped = cardOpen(), after = cardsView().map(c => c.key);
  // The floor, well away from every station: shut, and the click is still the place's.
  const b = stationBox('workshop');
  const floorTook = click({ x: b.x + b.w + P * 6, y: b.y + b.h - P });
  run(1);
  const shut = cardOpen(), gone = cardsView().length;
  window.__actsOn(null);
  return [
    ok(shut0 === null, 'no card is open at first', JSON.stringify(shut0)),
    ok(first && first.key === 'papermill' && shown.join() === 'papermill', 'a click on the paper mill opens its card', JSON.stringify(first)),
    ok(both.join() === 'papermill,workshop' && slid && !slid.want && slid.rect.x !== r0, 'a click on the workshop: the two are up together a moment, the leaving one sliding aside',
       `${both} ${slid && slid.rect.x} from ${r0}`),
    ok(swapped && swapped.key === 'workshop' && after.join() === 'workshop', 'then only the workshop\'s card is open', JSON.stringify(after)),
    ok(!floorTook && shut === null && gone === 0, 'a click on the floor shuts it and is still the place\'s click', `${floorTook} ${JSON.stringify(shut)} ${gone}`)
  ];
}, NO_RELOAD);

group('the card: a press on its paper away from the part does nothing, and the station is worked only on its part', async () => {
  up(['mill', 'workshop'], { timber: 10, logs: 5 });
  openOn('workshop');
  const s0 = S.after.stock.signs, b0 = rec('workshop').blows, uses0 = rec('workshop').uses;
  // The paper off the pad (the right of the grid), and the title band: a no-op.
  const pad = partsOf('workshop').box;
  const paper = [[pad.x + pad.w + P * 2, pad.y + P * 2], [P * 4, -P * 2]];
  const took = paper.map(([x, y]) => { const t = down(x, y); lift(x, y); run(0.2); return t; });
  const still = cardOpen(), blows = rec('workshop').blows, uses = rec('workshop').uses;
  // A press on the station itself, the card open: not a blow, the card stays.
  click(stationAt('workshop'));
  run(0.2);
  const onStation = rec('workshop').blows;
  // And on the pad: a blow.
  const at = mid(pad);
  down(at.x, at.y); lift(at.x, at.y);
  const struck = rec('workshop').blows;
  window.__actsOn(null);
  return [
    ok(took.every(t => t === true), 'the press is the card\'s, so nothing behind it takes it', JSON.stringify(took)),
    ok(blows === b0 && uses === uses0 && S.after.stock.signs === s0, 'and it strikes nothing', `${b0} -> ${blows} blows`),
    ok(still && still.key === 'workshop', 'the card stays open', JSON.stringify(still)),
    ok(onStation === b0, 'a click on the station opens (keeps) its card, it is no blow', `${onStation}`),
    ok(struck === b0 + 1, 'a press on the pad is a blow', `${struck}`)
  ];
}, NO_RELOAD);

group('the ghost hand shows until the motion is done three times, then fades, and comes back after a long idle', async () => {
  up(['mill', 'workshop'], { timber: 20 });
  openOn('workshop');
  const at = mid(partsOf('workshop').box);
  const tap = () => { down(at.x, at.y); lift(at.x, at.y); run(0.3); };
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

group('the pad: A opens the card, A mashed on it joins a sign, LB steps the card on, the stick spins the saw mill', async () => {
  const pad = window.__pad;
  up(['mill', 'workshop'], { timber: 10, logs: 5 });
  pad.on();
  pad.press('b');
  // The focus put on the station: the check is about what A and the stick do there.
  S.padFocus = 'ag:workshop';
  const s0 = S.after.stock.signs;
  const blind = rec('workshop').blows;
  pad.press('a');
  run(0.3);
  const opened = cardOpen(), firstBlows = rec('workshop').blows;
  for (let k = 0; k < 12; k++) { pad.press('a'); run(0.2); }
  const signs = S.after.stock.signs - s0;
  // LB steps the card to the saw mill, the station to its left, and the focus with it.
  pad.press('lb');
  run(0.3);
  const stepped = cardOpen(), focus = S.padFocus;
  const t0 = read().timber;
  for (let f = 0; f < 60 * 6; f++) {
    const a = f / 60 * 1.5 * 2 * Math.PI;
    pad.stick(Math.cos(a), Math.sin(a));
    pad.step(FRAME);
    frame();
  }
  pad.stick(0, 0); pad.step(FRAME);
  const timber = read().timber - t0;
  pad.press('b');
  const shut = cardOpen();
  pad.off();
  window.__actsOn(null);
  return [
    ok(opened && opened.key === 'workshop' && firstBlows === blind, 'A on the station opens its card, and is not yet a blow', `${JSON.stringify(opened)} ${firstBlows}`),
    ok(signs >= 1, 'A mashed on the card is blows, and a sign is joined', `${signs}`),
    ok(stepped && stepped.key === 'mill' && focus === 'ag:mill', 'LB steps the open card to the saw mill, the focus with it', `${JSON.stringify(stepped)} ${focus}`),
    ok(timber > 0, 'the stick turned round spins the flywheel and cuts', `${timber}`),
    ok(shut === null, 'B shuts the card', JSON.stringify(shut))
  ];
}, NO_RELOAD);
