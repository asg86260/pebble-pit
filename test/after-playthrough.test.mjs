// Act 3 played through, start to the strike, as a player plays it (DESIGN.md,
// "Acts 3 and 4", act 3): from a yard just past act 2's finale, the go-on
// card over the house; the house's fall, the arrival, the meeting and the
// refusal, each beat played to its end, the two of them up on the pedestal;
// the pair's speech bubbles popped for rebel; the axe bought, a tree sawn
// down by hand and its stump pulled; the saw mill raised off the shack
// and its flywheel spun; members put on their jobs through the rosters; the chain
// built on to the workshop; signs winning souls, who are hired on
// the pedestal's recruit row and walk out to our crowd; the gates stepping; the strike due and played, and the unmasking
// after it.
//
// Every purchase goes through the row's own buy (`__buy` hands an act-3 key
// to `buy`, what a card's press calls), every click and motion through
// the calls input.js makes (`__goOn`, `gestureDown` / `gestureMove` /
// `gestureUp`). The setup the check is not about, and nothing else:
//  - the yard's coins (dust, crops, ore, scales, sparks) a bill names,
//    granted just before that bill is bought (the yard's earning is act 2's
//    checks, and act 3's bills take far more of them than a hole holds at once);
//  - rebel for the seats and the stations past the saw mill, granted in one
//    block once the axe's and the mill's have been earned off the bubbles.
import { group, ok, run, yard, P } from './helpers.mjs';
import { lying } from '../src/after/ground.js';
import { AFTER_GATES, AFTER_BUILDS, AFTER_UPGRADES, AFTER_SEAT_BILLS, GESTURE_STUMP_DRAG, AFTER_FIRST_MEMBERS, AFTER_LOG_TIMBER } from '../src/config.js';
import { gestureDown, gestureMove, gestureUp, partsOf } from '../src/after/gestures.js';
import { sawOn, saw, spin } from './after-hands.mjs';
import { bubbles } from '../src/after/bubbles.js';
import { stationBox } from '../src/after/place.js';
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
// seconds: two and a quarter hours, about half again what it takes with the
// art at twice its size (the strike at about 7900 s of act 3, against about
// 5600 s with the art at its first size: the camp is wider to walk).
const STRETCH_S = 8100;
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
// `n` logs are sawn through and their timber is down the chute on the mound
// (the sawyer sets each log on the bed: after/mill.js).
function spinMill(n) {
  const t0 = read().timber;
  spin('mill', 2, () => read().timber - t0 >= n * AFTER_LOG_TIMBER, 60);
  return { cut: Math.floor((read().timber - t0) / AFTER_LOG_TIMBER) };
}
// The yard's coins on a bill, granted as the hooks name them; rebel and
// timber are the act's own and are left to the check.
const YARD = { dust: 'dust', spore: 'spores', shard: 'shards', scale: 'scales', spark: 'sparks' };
const fund = bill => window.__grant(Object.fromEntries(bill.filter(([c]) => YARD[c]).map(([c, n]) => [YARD[c], n])));
// A `post-<job>` on the lists below is a member put on that job, as a player
// puts one: the + on its roster under the station, its seat bought on the
// station's board first where the job's seats are full.
const jobOf = key => (key.startsWith('post-') ? key.slice('post-'.length) : null);
const full = job => { const r = window.__afterRoster().find(q => q.job === job); return !r || r.n >= r.cap; };
// The next bill of an act-3 row by its key past `after-`: a post's is its
// seat's while the job's seats are full, and nothing while one is free.
const billOf = key => {
  const job = jobOf(key);
  if (job) return full(job) ? AFTER_SEAT_BILLS[Math.min(S.after.ups[`after-seat-${job}`] || 0, AFTER_SEAT_BILLS.length - 1)] : [];
  const bills = AFTER_UPGRADES[`after-${key}`].bills, n = S.after.ups[`after-${key}`] || 0;
  return bills[Math.min(n, bills.length - 1)];
};
const take = key => {
  const job = jobOf(key);
  if (!job) return window.__buy(`after-${key}`);
  return (!full(job) || !!window.__buy(`after-seat-${job}`)) && window.__afterPress(job);
};
const buyRow = key => { fund(billOf(key)); return take(key); };
// A worker hired as a player hires one: the recruit row bought on the
// pedestal's board while nobody stands free and a won soul waits.
let hired = 0;
const hireIfNone = () => { if (read().camp < 1 && read().ready > 0 && window.__buy('after-recruit')) hired++; };
// A member put on as a player puts one, once one is free to put on: the
// press tried as the clock turns, up to ten minutes, while the signs win more
// and the recruit row hires them.
const putOnWhenFree = job => until(() => { hireIfNone(); return buyRow(`post-${job}`); }, 600) < Infinity;
// A station bought on the shack and the clock turned until it stands: up to
// ten minutes, since with the camp emptied onto posts the pair step down and
// carry its loads across the camp themselves (after/build.js).
const raise = key => { fund(AFTER_BUILDS[key].bill); return window.__buy(`after-build-${key}`) && until(() => read().built.includes(key), 600) < Infinity; };

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
  // (The idle members at the podium give lines of their own the while: the
  // bubbles are to earn fifty more than they have.)
  const popped = earn(r0 + 50, 300);
  const earned = read().rebel - r0;
  const axe = buyRow('axe');
  const handed = until(() => beatDone('axe') && read().axe, 60, 0.25);
  note(`popped ${popped} earned ${earned} axe ${axe} ${handed}`);
  // A tree sawn down by hand, and its stump pulled out on its own.
  const sawn = sawTree(0);
  run(3);
  const logsDown = lying().filter(q => q.i === 0).length;
  const pulled = pullStump(0);
  const replanted = S.after.plots[0].stage;
  note(`sawn ${JSON.stringify(sawn)} logs ${logsDown} pulled ${JSON.stringify(pulled)}`);

  // The saw mill off the shack, for rebel the bubbles earn, and two members put
  // on (a job's first seat is free).
  earn(AFTER_BUILDS.mill.bill.find(([c]) => c === 'rebel')[1], 300);
  const mill = raise('mill');
  // A woodcutter's post and a sawyer's: a member walks out of the camp to
  // each, the one carrying the fallen logs to the forestry shack and the
  // other fetching them on to the mill; the flywheel spun by hand saws one.
  const camp0 = read().camp;
  const post = buyRow('post-woodcutter') && buyRow('post-sawyer');
  run(0.25);
  const left = read().camp, onJobs = S.after.bodies.filter(b => (b.job === 'woodcutter' || b.job === 'sawyer') && b.state === 'work').length;
  const fed = until(() => read().logs > 0, 180);
  const t0 = read().timber;
  const spun = spinMill(1);
  const sawnInto = read().timber - t0;
  note(`mill ${mill} post ${post} on ${onJobs} idle ${camp0}->${left} fed ${fed} spun ${JSON.stringify(spun)} +${sawnInto} timber`);

  // On through the chain, rebel granted for its bills (see the head): the
  // first members onto the posts, the workshop off the shack.
  window.__afterGrant({ rebel: 3000 });
  const rows = [];
  for (const job of ['woodcutter', 'sawyer']) rows.push([job, putOnWhenFree(job)]);
  for (const k of ['workshop']) rows.push([k, raise(k)]);
  for (const job of ['joiner']) rows.push([job, putOnWhenFree(job)]);
  const signed = until(() => S.after.signs.length > 0, 600);
  note(`rows ${JSON.stringify(rows)} first sign ${signed}`);

  // A player's stretch: every few seconds whatever on the list can be paid
  // for is bought, the stumps the woodcutters leave are pulled by hand until
  // stump removal is, and the bubbles are popped, while the signs win
  // souls, who walk out to the camp and fill the posts.
  const want = ['plot', 'grow', 'stumps', 'plot', 'post-woodcutter', 'post-woodcutter', 'post-sawyer', 'post-joiner',
                'post-joiner', 'post-sawyer', 'post-joiner', 'bench', 'blade', 'post-joiner'];
  const u0 = read().union, gates = [];
  let planted = 0, peakCamp = 0, due = false;
  // The yard's coins for the next row on the list, once each: the yard
  // keeps earning while act 3 plays, and this stands in for it.
  let funded = -1;
  for (let t = 0; t < STRETCH_S && !beatDone('strike'); t += 5) {
    if (want.length && funded !== want.length) { fund(billOf(want[0])); funded = want.length; }
    hireIfNone();
    for (let k = 0; k < want.length; k++) if (take(want[k])) want.splice(k--, 1);
    const st = S.after.plots.findIndex(p => p.stump && p.fall == null);
    if (st >= 0 && !S.after.ups['after-stumps']) pullStump(st);
    popAll();
    planted = Math.max(planted, S.after.signs.length);
    peakCamp = Math.max(peakCamp, read().camp);
    if (read().gate > gates.length) { gates.push(read().gate); note(`gate ${read().gate} at support ${read().support.toFixed(3)}`); }
    due = due || read().strike;
    run(5);
  }
  const struck = beatDone('strike');
  const unmasked = until(() => beatDone('unmask'), 120);
  note(`struck ${struck} union ${u0}->${read().union} camp up to ${peakCamp} signs ${planted} unbought ${want.join(' ')}`);
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
    ok(axe && handed < Infinity, 'the axe is bought on the grove\'s card and its beat hands it over', `${axe} ${handed}`),
    ok(sawn.fell && logsDown > 0, 'a tree sawn by hand falls and lies as logs', JSON.stringify(sawn)),
    ok(pulled.out && replanted === 1, 'its stump pulled by hand comes out and a sapling is set', JSON.stringify(pulled)),
    ok(mill && post && onJobs === 2 && left <= camp0 - 2 && fed < Infinity, 'the saw mill raised off the shack, a woodcutter and a sawyer walk off the podium to their jobs and carry the logs in', story),
    ok(spun.cut >= 1 && sawnInto > 0, 'the flywheel spun by hand saws a log into timber', JSON.stringify(spun)),
    ok(rows.every(([, b]) => b), 'the posts and the workshop are all bought through their rows',
       JSON.stringify(rows.filter(([, b]) => !b))),
    ok(signed < Infinity && planted > 0, 'signs are planted in the crowd', `${planted} signs`),
    ok(hired > 0 && read().union > u0, 'the souls they win are hired on the recruit row and walk out of God\'s yard to our camp', `${hired} hired, ${u0} -> ${read().union}, camp up to ${peakCamp}`),
    ok(gates.join(' ') === AFTER_GATES.map((_, i) => i + 1).join(' '), 'the gates step, the meeting, the slowdown and the strike, in order', story),
    ok(due && struck && inOrder(act3), 'the strike falls due and plays, after everything before it', story),
    ok(unmasked < Infinity, 'and the unmasking follows it', S.beatsDone.join(' '))
  ];
});
