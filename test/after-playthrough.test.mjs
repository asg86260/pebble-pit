// Act 3 played through, start to the strike, as a player plays it (DESIGN.md,
// "Acts 3 and 4", act 3): from a yard just past act 2's finale, the go-on
// card over the house; the house's fall, the arrival, the meeting and the
// refusal, each beat played to its end, the two of them up on the pedestal;
// the pair's speech bubbles popped for rebel; the axe bought, a tree sawn
// down by hand and its stump pulled; the saw mill raised off the shack
// and its flywheel spun; posts bought that members walk out to; the chain
// built on to the press; signs and posters winning souls who walk out to our
// crowd; the gates stepping; the strike due and played, and the unmasking
// after it.
//
// Every purchase goes through the row's own buy (`__buy` hands an act-3 key
// to `buyAfter`, what a card's press calls), every click and motion through
// the calls input.js makes (`__goOn`, `gestureDown` / `gestureMove` /
// `gestureUp`). The setup the check is not about, and nothing else:
//  - the yard's coins (dust, crops, ore, sparks) granted once at the start,
//    as a late act-2 yard holds them (the yard's earning is act 2's checks);
//  - rebel for the posts and the stations past the saw mill, granted in one
//    block once the axe's and the mill's have been earned off the bubbles;
//  - the timber the paper mill's and the press's bills take, granted a bill
//    at a time: the one plot's planks all go on signs, and the grove's pace
//    is the pacing tool's, not this check's.
import { group, ok, run, yard, P } from './helpers.mjs';
import { AFTER_GATES, AFTER_BUILDS, GESTURE_STUMP_DRAG, AFTER_FIRST_MEMBERS } from '../src/config.js';
import { gestureDown, gestureMove, gestureUp, partsOf } from '../src/after/gestures.js';
import { sawOn, saw, spin } from './after-hands.mjs';
import { bubbles } from '../src/after/bubbles.js';
import { stationBox } from '../src/after/place.js';
import { postRebel } from '../src/after/rows.js';
import { goOnAlpha } from '../src/actbeats.js';
import { beatDone } from '../src/beats.js';

const S = yard.S;
const read = () => window.__afterRead();
const FRAME = 1 / 60;
// A frame of a hand's motion: the clock turned outside the reload harness,
// since a held motion is this session's by design (a reload stands every
// station still, after/gestures.js) and a save in the middle of a stroke
// would be a release nobody made. Everything else runs under the harness.
const frame = () => yard.fast(FRAME);
// How long the player's stretch may take to reach the strike, in game
// seconds: an hour and a half, about half again what it takes.
const STRETCH_S = 5400;
const log = [];
const note = s => { log.push(`${Math.round(S.after ? S.after.t : 0)}s ${s}`); };

// Seconds of game until `done`, at most `limit`: Infinity past it.
function until(done, limit, step = 1) {
  for (let s = 0; s < limit; s += step) { if (done()) return s; run(step); }
  return done() ? limit : Infinity;
}
// The beats played, each once and in order.
const inOrder = keys => keys.every(k => S.beatsDone.filter(d => d === k).length === 1)
  && keys.every((k, i) => i === 0 || S.beatsDone.indexOf(keys[i - 1]) < S.beatsDone.indexOf(k));
const mid = b => ({ x: b.x + b.w / 2, y: b.y + b.h / 2 });
// A click as the pointer makes one up there: a press and a release.
const click = p => { const took = gestureDown(p.x, p.y); gestureUp(p.x, p.y); return took; };
// Every bubble up now popped, the way the pointer pops one: a press on it.
function popAll() {
  let n = 0;
  for (const b of bubbles()) if (b.open && gestureDown(b.x + b.w / 2, b.y + b.h / 2)) { gestureUp(); n++; }
  return n;
}
// Bubbles popped as they rise until the pile holds `want` rebel.
function earn(want, limit) {
  let popped = 0;
  for (let f = 0; f < limit * 4 && read().rebel < want; f++) { popped += popAll(); run(0.25); }
  return popped;
}

// A tree's saw put on by its icon, dragged back and forth until it falls.
function sawTree(i) {
  const on = sawOn(i);
  if (!on) return { on, fell: false };
  const secs = saw(i, () => S.after.plots[i].fall != null, 0.6, 60);
  return { on, fell: S.after.plots[i].fall != null, secs: +secs.toFixed(2) };
}
// A stump taken hold of where it stands and held up until the roots give.
function pullStump(i) {
  const g = partsOf('stump', i).stump, p0 = { x: g.x + g.w / 2, y: g.y + g.h / 2 }, p1 = { x: p0.x, y: p0.y - 3 * P / GESTURE_STUMP_DRAG };
  gestureDown(p0.x, p0.y); gestureMove(p1.x, p1.y);
  let f = 0;
  for (; f < 60 * 30 && S.after.plots[i].stump; f++) frame();
  gestureUp(p1.x, p1.y);
  return { out: !S.after.plots[i].stump, secs: +(f * FRAME).toFixed(2) };
}
// The saw mill's flywheel spun where it stands, two turns a second, until
// `n` logs are sawn.
function spinMill(n) {
  const l0 = read().logs;
  spin('mill', 2, () => l0 - read().logs >= n, 60);
  return { cut: l0 - read().logs };
}
// A station bought on the shack and the clock turned until it stands.
const raise = key => window.__buy(`after-build-${key}`) && until(() => read().built.includes(key), 240) < Infinity;

group('act 3 from the go-on card to the strike, played as a player plays it', async () => {
  // A yard just past act 2's finale, the two of them at home, the act on,
  // and the yard's coins a late yard holds (see the head).
  window.__actsOn(true);
  window.__crew(2, 2);
  window.__actsAt('home');
  window.__grant({ dust: 60000, spores: 8000, shards: 3000, sparks: 600 });
  run(0.5);

  // The go-on card, pressed once it has faded in.
  const cardIn = until(() => goOnAlpha() >= 1, 60, 0.25);
  const goOn = window.__goOn();
  // The opening, each beat to its end: the camera handed back, no sheet up.
  const opened = until(() => beatDone('refuse') && !S.beat.camera && !S.beat.sheet, 300);
  const camped = until(() => read().walking === 0 && read().camp >= AFTER_FIRST_MEMBERS, 120);
  const stood = { view: S.view, at: S.acts.pair && S.acts.pair.at, top: S.acts.pair && S.acts.pair.top, house: S.acts.house };
  note(`opened ${opened} ${JSON.stringify(stood)} camp ${read().camp}`);

  // The pair's speech: bubbles popped as they rise, for the axe's rebel.
  const r0 = read().rebel;
  const popped = earn(50, 300);
  const earned = read().rebel - r0;
  const axe = window.__buy('after-axe');
  const handed = until(() => beatDone('axe') && read().axe, 60, 0.25);
  note(`popped ${popped} earned ${earned} axe ${axe} ${handed}`);
  // A tree sawn down by hand, and its stump pulled out on its own.
  const sawn = sawTree(0);
  run(3);
  const logsDown = S.after.plots[0].logs;
  const pulled = pullStump(0);
  const replanted = S.after.plots[0].stage;
  note(`sawn ${JSON.stringify(sawn)} logs ${logsDown} pulled ${JSON.stringify(pulled)}`);

  // The saw mill off the shack, and a post, for rebel the bubbles earn.
  earn(AFTER_BUILDS.mill.bill.find(([c]) => c === 'rebel')[1] + postRebel(), 300);
  const mill = raise('mill');
  // A hauler's post: a member walks out of the camp to it and carries the logs
  // in; the flywheel spun by hand saws one.
  const camp0 = read().camp;
  const post = window.__buy('after-post-hauler');
  run(0.25);
  const left = read().camp;
  const fed = until(() => read().logs > 0, 180);
  const t0 = read().timber;
  const spun = spinMill(1);
  const sawnInto = read().timber - t0;
  note(`mill ${mill} post ${post} camp ${camp0}->${left} fed ${fed} spun ${JSON.stringify(spun)} +${sawnInto} timber`);

  // On through the chain, rebel granted for its bills (see the head): the
  // first members onto the posts, the workshop and the chipper off the shack,
  // then the paper branch, its timber granted a bill at a time.
  window.__afterGrant({ rebel: 3000 });
  const rows = [];
  for (const job of ['woodcutter', 'sawyer', 'hauler']) rows.push([job, window.__buy(`after-post-${job}`)]);
  for (const k of ['workshop', 'chipper']) rows.push([k, raise(k)]);
  for (const job of ['joiner', 'carrier']) rows.push([job, window.__buy(`after-post-${job}`)]);
  const signed = until(() => S.after.signs.length > 0, 600);
  for (const [k, timber] of [['papermill', 30], ['press', 40]]) { window.__afterGrant({ timber }); rows.push([k, raise(k)]); }
  for (const job of ['pulper', 'printer', 'paster']) rows.push([job, window.__buy(`after-post-${job}`)]);
  note(`rows ${JSON.stringify(rows)} first sign ${signed}`);

  // A player's stretch: every few seconds whatever on the list can be paid
  // for is bought, the stumps the woodcutters leave are pulled by hand until
  // stump removal is, and the bubbles are popped, while the signs and
  // posters win souls, who walk out to the camp and fill the posts.
  const want = ['plot', 'grow', 'stumps', 'plot', 'post-woodcutter', 'post-hauler', 'post-carrier', 'post-paster',
                'post-joiner', 'post-sawyer', 'post-carrier', 'post-paster', 'bench', 'blade', 'post-pulper',
                'post-printer', 'post-carrier', 'post-paster'];
  const u0 = read().union, gates = [];
  let pasted = 0, planted = 0, peakCamp = 0, due = false;
  for (let t = 0; t < STRETCH_S && !beatDone('strike'); t += 5) {
    for (let k = 0; k < want.length; k++) if (window.__buy(`after-${want[k]}`)) want.splice(k--, 1);
    const st = S.after.plots.findIndex(p => p.stump && p.fall == null);
    if (st >= 0 && !S.after.ups['after-stumps']) pullStump(st);
    popAll();
    pasted = Math.max(pasted, S.after.posters.length); planted = Math.max(planted, S.after.signs.length);
    peakCamp = Math.max(peakCamp, read().camp);
    if (read().gate > gates.length) { gates.push(read().gate); note(`gate ${read().gate} at support ${read().support.toFixed(3)}`); }
    due = due || read().strike;
    run(5);
  }
  const struck = beatDone('strike');
  const unmasked = until(() => beatDone('unmask'), 120);
  note(`struck ${struck} union ${u0}->${read().union} camp up to ${peakCamp} signs ${planted} posters ${pasted} unbought ${want.join(' ')}`);
  window.__actsOn(null);
  const act3 = ['house-fall', 'arrive', 'meet-god', 'refuse', 'axe', 'strike', 'unmask'];
  const story = log.join(' | ');
  return [
    ok(cardIn < Infinity && goOn, 'the go-on card fades in over the house and answers the press', `${cardIn} ${goOn}`),
    ok(opened < Infinity && inOrder(act3.slice(0, 4)), 'the house falls, they arrive, meet God and refuse, each beat to its end', S.beatsDone.join(' ')),
    ok(stood.house === 'fallen' && stood.view === 'after' && stood.at === 'pedestal' && stood.top === 1,
       'the house under the rock, the two of them up on the pedestal, the camera with them', JSON.stringify(stood)),
    ok(camped < Infinity, 'the refusal\'s first members walk out to the camp', `${read().camp}`),
    ok(popped > 0 && earned >= 50, 'bubbles popped off the pair as they rise earn the axe\'s rebel', `${popped} popped, ${earned} rebel`),
    ok(axe && handed < Infinity, 'the axe is bought on the pedestal\'s card and its beat hands it over', `${axe} ${handed}`),
    ok(sawn.fell && logsDown > 0, 'a tree sawn by hand falls and lies as logs', JSON.stringify(sawn)),
    ok(pulled.out && replanted === 1, 'its stump pulled by hand comes out and a sapling is set', JSON.stringify(pulled)),
    ok(mill && post && left === camp0 - 1 && fed < Infinity, 'the saw mill raised off the shack, a hauler walks out of the camp to its post and carries the logs in', story),
    ok(spun.cut >= 1 && sawnInto > 0, 'the flywheel spun by hand saws a log into timber', JSON.stringify(spun)),
    ok(rows.every(([, b]) => b), 'the posts, the workshop, the chipper, the paper mill and the press are all bought through their rows',
       JSON.stringify(rows.filter(([, b]) => !b))),
    ok(signed < Infinity && planted > 0 && pasted > 0, 'signs are planted in the crowd and posters pasted on the fence', `${planted} signs, ${pasted} posters`),
    ok(read().union > u0 && peakCamp > AFTER_FIRST_MEMBERS, 'the souls they win walk out of God\'s yard to our camp', `${u0} -> ${read().union}, camp up to ${peakCamp}`),
    ok(gates.join(' ') === AFTER_GATES.map((_, i) => i + 1).join(' '), 'the gates step, the meeting, the slowdown and the strike, in order', story),
    ok(due && struck && inOrder(act3), 'the strike falls due and plays, after everything before it', story),
    ok(unmasked < Infinity, 'and the unmasking follows it', S.beatsDone.join(' '))
  ];
});
