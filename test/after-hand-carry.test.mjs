// Act 3's goods by hand (DESIGN.md, "Act 3's hand work and hand carrying",
// goods by hand; after/hand.js): a log taken off the forestry shack's pile by
// the shared grab, the press and hold that picks up a member, one at once and
// one more a beat while it is held over the pile, up to the yard's carry at
// a log's weight; let go over the saw mill's pile, set down on it a log a
// beat; let go anywhere else, fallen to the floor, where a member carries
// it home. Nothing vanishes and nothing jumps.
//
// Driven through the very calls a worker pickup goes through
// (crew/pointer.js: `grabAt` at the point, `lift`, `holdBody` frame by frame
// as the cursor moves, `drop`), at the world points where each pile is
// drawn. The setup it is not about: the act on and its opening played, the
// saw mill standing, logs granted on the shack's pile, the yard's carry
// bought up (its own checks are the yard's).
import { group, ok, run, runUntil, yard, restartReloadClock } from './helpers.mjs';
import { AFTER_PUT_S, AFTER_CARRY_SLOTS, AFTER_PILE_REACH, RIM_PIECES } from '../src/config.js';
import { haulCap } from '../src/levels.js';
import { pileBox, afterFloor, stationBox, AP } from '../src/after/place.js';
import { grabAt, lift, holdBody, drop, inHand } from '../src/crew/pointer.js';

const S = yard.S;
const FRAME = 1 / 60;
const OPENING = ['house-fall', 'arrive', 'meet-god', 'refuse'];
const stock = () => S.after.stock;
const laid = () => S.after.groundLogs.filter(q => q.fall != null);
// A pile's middle, as the pointer would find it over the drawn stack.
const over = (key, what) => { const b = pileBox(key, what, AFTER_PILE_REACH); return { x: b.x + b.w / 2, y: b.y + b.h * 0.75 }; };

function up(members = 0) {
  window.__actsOn(true);
  window.__goPlace('after');
  for (const k of OPENING) if (!S.beatsDone.includes(k)) S.beatsDone.push(k);
  window.__grant({ dust: 1e6, spores: 2e5, shards: 2e5, scales: 2e4, sparks: 2e4 });
  S.after.speech = { next: 1e9, f0: 0, held: null };   // the throne's speech is another check's
  if (members) {
    window.__afterCrowd((i, v) => (i < members ? RIM_PIECES : v));
    runUntil(() => window.__afterRead().walking === 0, 240);
  }
  if (!S.after.built.includes('mill')) S.after.built.push('mill');
  S.haulCarryLevel = 1;
  window.__afterGrant({ grovelogs: 5 });
  run(1);
}
// The hand held at (x, y) for `secs`, the cursor still: the frames' most
// taken off `what` in one, and what the hand holds after.
function holdAt(p, secs, what) {
  let most = 0;
  for (let f = 0; f < secs * 60; f++) {
    const was = stock()[what];
    holdBody(inHand(), p.x, p.y);
    run(FRAME);
    most = Math.max(most, was - stock()[what]);
  }
  return most;
}
// The hand carried from a to b a few px a frame, as a cursor crosses: the
// most it moved in a frame.
function carry(a, b, px = 12) {
  const n = Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / px);
  let most = 0, at = { ...a };
  for (let k = 1; k <= n; k++) {
    const p = { x: a.x + (b.x - a.x) * k / n, y: a.y + (b.y - a.y) * k / n };
    holdBody(inHand(), p.x, p.y);
    run(FRAME);
    const h = S.after.hand;
    most = Math.max(most, Math.hypot(h.x - at.x, h.y - at.y));
    at = { x: h.x, y: h.y };
  }
  return most;
}

group('two logs taken off the forestry shack\'s pile by hand and let go on the saw mill\'s, a log at a time', async () => {
  up();
  const want = Math.floor(haulCap() / AFTER_CARRY_SLOTS.log);
  const from = over('forestry', 'grovelogs'), to = over('mill', 'logs');
  const pile0 = stock().grovelogs, mill0 = stock().logs;
  restartReloadClock();
  const it = grabAt(from.x, from.y);
  const took = lift(it);
  const one = S.after.hand && S.after.hand.n === 1 && stock().grovelogs === pile0 - 1;
  const most = holdAt(from, AFTER_PUT_S * (want + 3), 'grovelogs');
  const held = S.after.hand.n, after = stock().grovelogs;
  const stride = carry(from, to);
  const stillHeld = S.after.hand.n === held && stock().grovelogs === after;
  drop(inHand());
  let stepped = true, last = stock().logs;
  for (let f = 0; f < 600 && S.after.hand; f++) {
    run(FRAME);
    if (stock().logs - last > 1) stepped = false;
    last = stock().logs;
  }
  const set = !S.after.hand;
  const counts = { pile: stock().grovelogs, mill: stock().logs };
  // And read back from the save: the counts stand.
  window.__reload();
  const back = { pile: S.after.stock.grovelogs, mill: S.after.stock.logs, hand: S.after.hand };
  S.haulCarryLevel = 0;
  window.__actsOn(null);
  return [
    ok(it && it.kind === 'log' && it.from === 'grovelogs', 'the grab over the forestry shack\'s pile finds a log', JSON.stringify(it)),
    ok(took && one, 'one press takes one log into the hand', `${pile0} -> ${stock().grovelogs}`),
    ok(want === 2 && held === want && after === pile0 - want, 'held over the pile it takes more, up to the carry at a log\'s weight', `${held} of ${want}, pile ${after}`),
    ok(most <= 1, 'a log a beat, never a jump', `${most} in a frame`),
    ok(stride <= 12.5 && stillHeld, 'carried across, the load goes where the cursor goes and takes nothing on the way', `${stride.toFixed(1)} px a frame`),
    ok(set && stepped, 'let go over the saw mill\'s pile, set down on it a log at a time', `${set} ${stepped}`),
    ok(counts.pile === pile0 - 2 && counts.mill === mill0 + 2, 'two off the shack\'s pile, two on the mill\'s', JSON.stringify(counts)),
    ok(back.pile === counts.pile && back.mill === counts.mill && back.hand === null, 'and a save read back says the same', JSON.stringify(back))
  ];
});

group('let go off any pile, the load falls to the floor, and an idle member carries it back to the shack\'s pile', async () => {
  up(4);
  const from = over('forestry', 'grovelogs');
  const mill = stationBox('mill'), floor = afterFloor();
  // Open floor past the mill's right end, well up off it.
  const spot = { x: mill.x + mill.w + AP * 12, y: floor - AP * 8 };
  const total = () => stock().grovelogs + stock().logs + S.after.groundLogs.length
    + S.after.bodies.reduce((n, b) => n + (b.load === 'log' ? b.carry || 0 : 0), 0) + (S.after.hand ? S.after.hand.n : 0);
  const t0 = total(), pile0 = stock().grovelogs;
  restartReloadClock();
  lift(grabAt(from.x, from.y));
  holdAt(from, AFTER_PUT_S * 4, 'grovelogs');
  const held = S.after.hand.n;
  carry(from, spot);
  drop(inHand());
  const down = laid(), empty = !S.after.hand;
  run(1);
  const lying = laid().length === held && laid().every(q => q.kind === 'log' && q.y0 < floor && q.x > mill.x + mill.w);
  // The members idle at the podium gather what lies loose as an errand
  // (bodies.js, ERRANDS), walking out to it and carrying it home.
  let carried = false;
  const home = runUntil(() => {
    carried = carried || S.after.bodies.some(b => b.load === 'log' && b.carry > 0);
    return laid().length === 0 && stock().grovelogs === pile0 && !S.after.bodies.some(b => b.load === 'log');
  }, 400);
  const kept = total() === t0;
  S.haulCarryLevel = 0;
  window.__actsOn(null);
  return [
    ok(held === 2 && empty && down.length === held, 'let go over open floor, the hand empties onto it', `${down.length} of ${held}`),
    ok(down.every(q => q.fall > 0), 'each falls from the hand\'s height', down.map(q => q.fall.toFixed(2)).join(' ')),
    ok(lying, 'and lies on the floor where it fell', `${laid().length}`),
    ok(carried && home, 'an idle member takes them up and carries every one back to the forestry shack\'s pile', `pile ${stock().grovelogs}`),
    ok(kept, 'not one lost on the way', `${t0} -> ${total()}`)
  ];
});

group('a plank is not set down on the saw mill\'s log pile: let go there, it falls to the floor', async () => {
  up();
  window.__afterGrant({ timber: 3 });
  const from = over('mill', 'timber'), to = over('mill', 'logs');
  const logs0 = stock().logs, timber0 = stock().timber;
  restartReloadClock();
  const it = grabAt(from.x, from.y);
  lift(it);
  carry(from, to);
  drop(inHand());
  run(1);
  S.haulCarryLevel = 0;
  window.__actsOn(null);
  return [
    ok(it && it.kind === 'plank', 'the grab over the timber pile finds a plank', JSON.stringify(it)),
    ok(stock().logs === logs0 && stock().timber === timber0 - 1, 'the log pile does not take it', `${stock().logs} logs, ${stock().timber} timber`),
    ok(laid().length === 1 && laid()[0].kind === 'plank', 'it lies on the floor under where it was let go', JSON.stringify(laid()))
  ];
});

group('a load held when the game is saved is laid on the floor where it was held, never lost', async () => {
  up();
  const from = over('forestry', 'grovelogs');
  const spot = { x: from.x + AP * 30, y: from.y - AP * 4 };
  const pile0 = stock().grovelogs;
  restartReloadClock();
  lift(grabAt(from.x, from.y));
  carry(from, spot);
  window.__reload();
  const lying = laid();
  const near = lying.length === 1 && Math.abs(lying[0].x + AP - spot.x) <= AP * 2 && lying[0].y0 <= spot.y + 1;
  S.haulCarryLevel = 0;
  window.__actsOn(null);
  return [
    ok(S.after.hand === null, 'read back, nothing is on the cursor'),
    ok(near && S.after.stock.grovelogs === pile0 - 1, 'the log is let go where it was held, and falls to the floor', JSON.stringify(lying))
  ];
});
