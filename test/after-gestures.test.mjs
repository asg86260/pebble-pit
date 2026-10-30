// Act 3's hand work in the world (after/gestures.js; docs/wave-act3-build.md,
// track A): every station worked by dragging its own moving part where it
// stands, the faster the sooner; a station's board asked for by the UPGRADES
// button over its roster, or by a plain click on a station with no roster.
// Each motion is made the way the pointer makes it -- a press,
// moves and a release through the very calls input.js makes, at the world
// points where the part is drawn, a frame of the act's clock between moves
// (test/after-hands.mjs); the pad's through `__pad`. The setup each check
// is not about (the act up, a station standing, stock on its pile, the saw
// in hand) goes through the act's hooks.
//
// Every group follows a hand's motion across more than five seconds, and the
// motion is this session's by design (a reload stands every station still),
// so the reload harness is kept out: `{ reload: false }`.
import { group, ok, run, yard, P } from './helpers.mjs';
import { goodCount } from '../src/after/piles.js';
import { AFTER_PODIUM_REBEL, AFTER_DIG_CLICKS, TREE_CHOPS, GESTURE_BUBBLE_CRIT, GESTURE_CUE_USES,
         GESTURE_CUE_FADE_S, GESTURE_CUE_IDLE_S, GESTURE_STRAIN_S,
         GESTURE_JOINER_WAIT_S, GESTURE_NAIL_TAPS } from '../src/config.js';
import { gestureDown, gestureMove, gestureUp, gestureView, gestureHover, gestureUnder, partsOf, useBubbles, groveIcons } from '../src/after/gestures.js';
import { stationBox } from '../src/after/place.js';
import { GESTURE_HOVER_S } from '../src/config.js';
import { godMid, faceY } from '../src/after/sky.js';
import { FRAME, frame, click, asks, opens, pressShop, timeTo, sawOn, saw, lift, spin, nailSign, loadBed } from './after-hands.mjs';
import { shopBoxOf, rosterHit, rosterUp } from '../src/roster.js';
import { station } from '../src/stations.js';
import { drawnMid } from '../src/footprints.js';

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
// A click on every point of a station's drawing, a cell apart, that its hand
// work would not take: how many such points, and every board they opened
// (none where the station's board has its UPGRADES button).
function frameAsks(key) {
  const b = stationBox(key), got = new Set();
  let spots = 0;
  for (let x = b.x + P / 2; x < b.x + b.w; x += P)
    for (let y = b.y + P / 2; y < b.y + b.h; y += P) {
      if (gestureUnder(x, y)) continue;
      spots++;
      got.add(opens({ x, y }));
    }
  return { spots, asks: [...got] };
}

group('the saw mill: its flywheel spun faster where it stands cuts a log sooner, up to its cap', async () => {
  // a log by hand onto the bed first (after-hands.mjs, `loadBed`): the wheel cuts what is on it
  const trial = rev => { up(['mill'], { logs: 5 }); loadBed(); const t0 = read().timber; return spin('mill', rev, () => read().timber > t0, 40); };
  const slow = trial(0.5), fast = trial(2), past = trial(4);
  window.__actsOn(null);
  return [
    ok(fast < slow, 'spun four times as fast, the log is cut sooner', `${slow.toFixed(2)} s -> ${fast.toFixed(2)} s`),
    ok(Number.isFinite(slow), 'spun slowly it is still cut', `${slow}`),
    ok(Math.abs(past - fast) < 0.5, 'past the wheel\'s cap, no sooner', `${fast.toFixed(2)} s at the cap, ${past.toFixed(2)} s past it`)
  ];
}, NO_RELOAD);

group('the workshop: four nails a sign, two taps each; a miss does nothing; the joiner taps on once the hand stops', async () => {
  up(['mill', 'workshop'], { timber: 10, benchtimber: 8, rebel: 500 });
  window.__grant({ dust: 40000, spores: 5000, shards: 2000, scales: 3000, sparks: 400 });
  const s0 = goodCount('signs');
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
  const one = goodCount('signs') - s0;
  // A nail half in, then a joiner at the bench: it drives the rest alone.
  window.__afterGrant({ timber: 20, benchtimber: 8 });
  click(mid(partsOf('workshop').nails[2])); run(0.3);
  const t0 = S.after.t;
  S.after.camp += 1;
  window.__afterPress('joiner');
  const joined = timeTo(() => {}, () => rec('workshop').nails.every(n => n === 0) && rec('workshop').auto > t0, 120);
  window.__actsOn(null);
  return [
    ok(missed, 'a tap off the nails does nothing'),
    ok(half && flush && still, 'a nail goes half in, then flush, and a flush nail takes no more'),
    ok(one === 1, 'four nails flush: a sign', `${one}`),
    ok(Number.isFinite(joined) && joined > GESTURE_JOINER_WAIT_S, 'the joiner taps the rest on its own once the hand has stopped', `${joined}`)
  ];
}, NO_RELOAD);

group('a tree: the hand saw lies across its trunk, no icon; taken and dragged back and forth, a stroke a chop, faster fells it sooner', async () => {
  const trial = period => {
    up();
    run(0.5);
    const icon = groveIcons().some(c => c.kind !== 'shovel');
    const on = sawOn(0);
    return { icon, on, secs: saw(0, () => S.after.plots[0].fall != null, period), by: S.after.plots[0].by };
  };
  const slow = trial(3), fast = trial(0.6);
  // A plain click on the tree takes the saw lying across it (the owner,
  // 2026-10-20: "clicking a tree starts the sawing"); the grove's board is
  // the forestry shack's, opened from the UPGRADES button over the
  // woodcutters' roster and not from the shack's drawing.
  up();
  const t = window.__afterTrees()[0];
  const asked = asks({ x: t.x, y: t.y }), sawing = rec('tree').on === 0;
  const board = frameAsks('forestry'), button = pressShop('after-grove');
  window.__actsOn(null);
  return [
    ok(!slow.icon && slow.on && slow.by === 'hand', 'no icon over the grown tree; the saw lies across its trunk, nothing bought, and the hand fells it', JSON.stringify(slow)),
    ok(fast.secs < slow.secs && Number.isFinite(slow.secs), `sawn faster, it falls sooner (${TREE_CHOPS} strokes)`, `${slow.secs.toFixed(2)} s -> ${fast.secs.toFixed(2)} s`),
    ok(asked === null && sawing, 'a plain click on the tree takes its saw, no board asked for', JSON.stringify([asked, sawing])),
    ok(board.spots > 0 && JSON.stringify(board.asks) === '[null]', 'a click on the forestry shack opens no board', JSON.stringify(board)),
    ok(button === 'after-grove', 'the UPGRADES button over its roster asks for the grove\'s', String(button))
  ];
}, NO_RELOAD);

// The camp's members agitate rebel onto the same pile on their own clock:
// another check's (test/after-roster.test.mjs), so these stand none.
const noAgitators = () => { S.after.bodies = []; S.after.camp = 0; };
group('the pedestal: a popped bubble is a line of the speech, and the big one pays five', async () => {
  const small = { x: 0, y: 0, w: P * 7, h: P * 4, big: false }, big = { x: 0, y: 0, w: P * 10, h: P * 6, big: true };
  const trial = b => {
    up();
    noAgitators();
    const pair = partsOf('pedestal').box;
    Object.assign(b, { x: pair.x, y: pair.y - P * 12 });
    let air = [b];
    useBubbles({ list: () => air, pop: x => { const had = air.includes(x); air = air.filter(y => y !== x); return had; } });
    const r0 = read().rebel;
    const hit = gestureDown(b.x + b.w / 2, b.y + b.h / 2);
    gestureUp();
    // a press the hand work took asks for no board (input.js stops there)
    const marks = rec('pedestal').marks.length, asked = !hit;
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
  noAgitators();
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
  Object.assign(S.after.plots[0], { grow: null, stump: true, dug: 0 });
  run(0.2);
  const shovel = groveIcons().some(c => c.kind === 'shovel' && c.i === 0);
  lift(0, 3, GESTURE_STRAIN_S * 1.5);
  const oneRoot = S.after.plots[0].dug, stillIn = S.after.plots[0].stump;
  lift(0, 3, GESTURE_STRAIN_S * (AFTER_DIG_CLICKS + 1));
  const out = !S.after.plots[0].stump && S.after.plots[0].grow == null;
  const marks = rec('stump').marks.length, gone = !groveIcons().some(c => c.kind === 'shovel');
  window.__actsOn(null);
  return [
    ok(shovel, 'a stump shows its shovel icon'),
    ok(oneRoot === 1 && stillIn, 'held up a moment, one root gives and the stump stays', `dug ${oneRoot}`),
    ok(out && gone, 'held long enough it comes out, the plot left bare for an acorn, and the shovel goes'),
    ok(marks === 0, 'and no crit is marked', `${marks}`)
  ];
}, NO_RELOAD);

// The station is its own shop (DESIGN.md, "Act 3's goods are blocks", rule
// 4), opened from the UPGRADES button under it and from nothing else (the
// owner, 2026-10-28): a click anywhere on a station, God's camp too, opens
// nothing.
const CARDS = { mill: 'mill', workshop: 'workshop', shack: 'shack', pedestal: 'pedestal', forestry: 'grove' };
group('a plain click on a station or on God\'s camp opens no board, on a part none; a click on open floor asks for nothing', async () => {
  up(['mill', 'workshop'], { logs: 4, timber: 20 });
  const drawings = {};
  for (const k of Object.keys(CARDS)) drawings[k] = frameAsks(k);
  // The parts themselves: the flywheel's rim and a nail are the hand's.
  const w = partsOf('mill').wheel, nail = mid(partsOf('workshop').nails[0]);
  const parts = { wheel: asks({ x: w.x + w.r, y: w.y }), nail: asks(nail) };
  // God's camp where it is drawn, far back on the cloud: a click on him.
  const god = { x: godMid(S.camX + S.viewW / 2), y: faceY() }, crowd = [asks(god), opens(god)];
  const b = stationBox('workshop'), floor = { x: b.x + b.w + P * 8, y: b.y + b.h - P };
  const floorTook = click(floor), after = asks(floor);
  window.__actsOn(null);
  return [
    ok(Object.keys(CARDS).every(k => drawings[k].spots > 0 && JSON.stringify(drawings[k].asks) === '[null]'),
       'a click anywhere on a station\'s drawing off its parts opens no board', JSON.stringify(drawings)),
    ok(parts.wheel == null && parts.nail == null, 'and none by a click on a working part', JSON.stringify(parts)),
    ok(crowd[0] === 'after-crowd' && crowd[1] === null, 'a click on the crowd of God lands on his camp and opens nothing', JSON.stringify(crowd)),
    ok(!floorTook && after === null, 'the open floor asks for none, and the click is still the place\'s', `${floorTook}`)
  ];
}, NO_RELOAD);

group('the ghost hand shows until the motion is done three times, then fades, and comes back after a long idle', async () => {
  up(['mill', 'workshop'], { timber: 20, benchtimber: 8 });
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
  up(['mill', 'workshop'], { timber: 10, benchtimber: 8, logs: 5 });
  pad.on();
  pad.press('b');
  // The focus put on the station: the check is about what A and the stick do there.
  S.padFocus = 'ag:workshop';
  const s0 = goodCount('signs');
  for (let k = 0; k < 10; k++) { pad.press('a'); run(0.2); }
  const signs = goodCount('signs') - s0;
  S.padFocus = 'ag:mill';
  loadBed();
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

// The hover, the way a mouse makes it (input.js calls `gestureHover` on every
// move): one ghost hand, back faint while the pointer is on a part, gone the
// moment the part is taken hold of, and back once it is let go with the
// pointer still there (DESIGN.md, "Act 3's goods are blocks", rule 3).
group('hovered, a part brings its ghost hand back; taken hold of, the hand goes; let go, it is back; the pointer gone, it fades', async () => {
  up(['mill', 'workshop'], { logs: 0, timber: 20 });
  const r = () => rec('mill'), w = partsOf('mill').wheel, at = a => [w.x + Math.cos(a) * w.r, w.y + Math.sin(a) * w.r];
  const before = { hint: r().hintA };
  gestureHover(...at(0));
  run(GESTURE_HOVER_S + 0.1);
  const shown = { hint: r().hintA };
  gestureDown(...at(0));
  for (let f = 1; f <= 120; f++) { gestureMove(...at(f / 60 * 2 * 2 * Math.PI)); gestureHover(...at(f / 60 * 2 * 2 * Math.PI)); frame(); }
  const working = { hint: r().hintA, held: r().held, prog: r().prog };
  gestureUp(...at(0));
  gestureHover(...at(0));
  run(GESTURE_HOVER_S + 0.1);
  const after = { hint: r().hintA, held: r().held };
  gestureHover(null);
  run(GESTURE_HOVER_S + 0.1);
  const gone = { hint: r().hintA };
  // Every station's part, not only the wheel's: a nail on the workshop's bench.
  gestureHover(mid(partsOf('workshop').nails[0]).x, mid(partsOf('workshop').nails[0]).y);
  run(GESTURE_HOVER_S + 0.1);
  const nail = { hint: rec('workshop').hintA, wheel: r().hintA };
  window.__actsOn(null);
  return [
    ok(before.hint === 0, 'unhovered, no hover hand', JSON.stringify(before)),
    ok(shown.hint === 1, 'hovered, the hand comes back', JSON.stringify(shown)),
    ok(working.hint === 0 && working.held && working.prog > 0, 'taken hold of and spun, the hand is gone', JSON.stringify(working)),
    ok(after.hint === 1 && !after.held, 'let go with the pointer still on it, the hand is back', JSON.stringify(after)),
    ok(gone.hint === 0, 'the pointer gone, it fades', JSON.stringify(gone)),
    ok(nail.hint === 1 && nail.wheel === 0, 'a nail on the bench brings the workshop\'s hand back, and only its', JSON.stringify(nail))
  ];
}, NO_RELOAD);

// Every station up here with a board carries its UPGRADES button, God's crowd
// and a station not yet built (its board is where it is built) too, pressed
// the way a click presses it (roster.js `rosterHit`, the call input.js
// makes). Each stands at the one spot its station gives it, under the
// station: centered on it, and where a roster stands, over its count.
const meets = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
const BOARDS = ['after-grove', 'after-mill', 'after-workshop', 'after-shack', 'after-pedestal', 'after-crowd'];
const GROUND = { 'after-grove': 'forestry', 'after-mill': 'mill', 'after-workshop': 'workshop', 'after-shack': 'shack', 'after-pedestal': 'pedestal' };
group('every station\'s UPGRADES button asks for its own board, centered under its station and over its roster; a station not built has one too', async () => {
  up(['mill', 'workshop'], { logs: 4, timber: 20 });
  const pressed = Object.fromEntries(BOARDS.map(k => [k, pressShop(k)]));
  const boxes = Object.fromEntries(BOARDS.map(k => [k, shopBoxOf(k)]));
  // Under its station, centered exactly on what the station draws (its
  // drawing's span, footprints.js `drawnMid`), its edges on the grid (the
  // owner, 2026-10-28: "each should be centered to the station").
  const under = Object.entries(GROUND).every(([k, g]) => {
    const s = stationBox(g), b = boxes[k];
    return b && b.y >= s.y + s.h && b.x + b.w / 2 === drawnMid(g) && b.x % P === 0 && b.w % P === 0;
  });
  // The roster under it centered exactly on the drawing too, and inside it
  // each counter's sprite exactly over its pips.
  const ROSTER_AT = { sawyer: 'mill', joiner: 'workshop', woodcutter: 'forestry' };
  const centered = window.__afterRoster().every(r => (r.span[0] + r.span[1]) / 2 === drawnMid(ROSTER_AT[r.job]));
  const stacked = window.__afterRoster().every(r => r.marks.every(m => m.pips == null || m.sprite === m.pips));
  // Over the count of the roster standing under it, and no two buttons touching.
  const roster = window.__afterRoster(), over = ['sawyer', 'joiner', 'woodcutter'].every(job => {
    const r = roster.find(q => q.job === job), k = { sawyer: 'after-mill', joiner: 'after-workshop', woodcutter: 'after-grove' }[job];
    return r && boxes[k].y + boxes[k].h < Math.min(r.less[1], r.more[1]) && boxes[k].x < r.more[0] && boxes[k].x + boxes[k].w > r.less[0];
  });
  const apart = BOARDS.every(a => BOARDS.every(b => a === b || !meets(boxes[a], boxes[b])));
  // Hung off its button, the board's anchor is the button's.
  const hung = BOARDS.every(k => { const a = station(k).boardAnchor(); return !!a && !!a.keep && a.x <= boxes[k].x && a.x + a.w >= boxes[k].x + boxes[k].w; });
  // Off the button, a cell past its hit margin, the press is nobody's button.
  const b = boxes['after-mill'], beside = rosterHitAt(b.x + b.w / 2, b.y - P * 4);
  // The workshop taken down: no roster, still its button, and its drawing opens nothing.
  S.after.built = S.after.built.filter(k => k !== 'workshop');
  run(0.5);
  const down = { button: pressShop('after-workshop'), drawing: frameAsks('workshop').asks };
  window.__actsOn(null);
  return [
    ok(BOARDS.every(k => pressed[k] === k), 'each button asks for its own station\'s board', JSON.stringify(pressed)),
    ok(under, 'each stands under its station, centered on it exactly, on the grid', JSON.stringify(boxes)),
    ok(centered, 'and each roster is centered exactly on what its station draws', JSON.stringify(roster.map(r => [r.job, r.span]))),
    ok(stacked, 'and in each roster the worker sprite stands exactly over its pips', JSON.stringify(roster.map(r => [r.job, r.marks]))),
    ok(over, 'where a roster stands, the button is over its count', JSON.stringify(roster.map(r => [r.job, r.less, r.more]))),
    ok(apart, 'no two buttons touch', JSON.stringify(boxes)),
    ok(hung, 'and each board hangs off its button', ''),
    ok(beside === false, 'a press off the button is no press on it', String(beside)),
    ok(down.button === 'after-workshop' && JSON.stringify(down.drawing) === '[null]', 'a station not standing keeps its button for its rebuild, and a click on it opens nothing', JSON.stringify(down))
  ];
}, NO_RELOAD);
const rosterHitAt = (x, y) => { const r = rosterHit(x, y); rosterUp(); return r; };

