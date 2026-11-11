// Act bodies on the yard's engine (DESIGN.md, "Act bodies on the yard's
// engine"): an act's body is taken up, shaken and let go of by the yard's
// hand (crew/pointer.js `lift`, `holdBody`, `shakeHeld`, `drop`), falls by
// the yard's fall, and a drop on one of its place's stations puts THAT body
// on the station's job, as the yard's drop does. Reached the player's way:
// the hand's own calls, the body held where the cursor is.
import { group, ok, run, runUntil, yard } from './helpers.mjs';
import { RIM_PIECES, SHAKE_TURNS, P, GHOST_WALK } from '../src/config.js';
import { HELL_JOB } from '../src/jobs.js';
import { stationBox, idleSpots } from '../src/after/place.js';
import { lift, drop, holdBody, shakeHeld } from '../src/crew/pointer.js';
import { push, count } from '../src/carry.js';
import { lying } from '../src/after/ground.js';
import { cellOf } from '../src/grid.js';
import { dropTargets } from '../src/crew/assign.js';
import { AFTER_CREW } from '../src/after/bodies.js';
import { standRect } from '../src/stations.js';
import { source } from '../src/flow.js';
import { chamberFloor, ladderX, chamberX0 } from '../src/hell/place.js';

const S = yard.S;
const read = () => window.__afterRead();
const OPENING = ['house-fall', 'arrive', 'meet-god', 'refuse'];
const idle = () => S.after.bodies.filter(b => b.job == null && b.state === 'work' && !b.errand);

function up(n) {
  window.__actsOn(true);
  window.__goPlace('after');
  for (const k of OPENING) if (!S.beatsDone.includes(k)) S.beatsDone.push(k);
  window.__grant({ dust: 1e6, spores: 2e5, shards: 2e5, scales: 2e4, sparks: 2e4 });
  S.after.speech = { next: 1e9, f0: 0, held: null };
  window.__afterCrowd((i, v) => (i < n ? RIM_PIECES : v));
  runUntil(() => read().walking === 0 && idle().length >= Math.min(n, idleSpots()), 240);
  run(20);
}

// Taken up, carried over (x, y) and let go of with the hand still.
function carryTo(w, x, y) {
  lift(w);
  holdBody(w, x, y);
  S.mouse.x = x; S.mouse.y = y;
  drop(w);
}

group('an act 3 member dropped on the saw mill is the mill\'s sawyer, and walks to it', () => {
  up(4);
  S.after.built.push('mill');
  run(1);
  const w = idle()[0];
  const mill = stationBox('mill');
  const id = w.id, crew0 = S.after.crew.sawyer || 0;
  carryTo(w, mill.x + mill.w / 2, mill.y - P * 6);
  const put = w.job === 'sawyer' && (S.after.crew.sawyer || 0) === crew0 + 1;
  const landed = runUntil(() => !S.after.bodies.find(b => b.id === id)?.falling, 10);
  const there = runUntil(() => S.after.bodies.find(b => b.id === id)?.at === 'mill' || S.after.bodies.find(b => b.id === id)?.on, 30);
  const b = S.after.bodies.find(o => o.id === id);
  return [
    ok(put, 'the body let go of over the mill is put on the sawyer\'s job, the roster one more', `${w.job} ${S.after.crew.sawyer}`),
    ok(landed && there, 'it comes down and is at its job', JSON.stringify(b && { job: b.job, on: b.on, at: b.at }))
  ];
});

group('an act 3 member thrown on open floor keeps its work; shaken, it sees stars and lays down its load', () => {
  up(3);
  const w = idle()[0];
  const id = w.id;
  push(w, cellOf('log'));
  source('log', 1, 'test');
  const held = count(w), lying0 = lying().length;
  lift(w);
  holdBody(w, w.x + P * 20, w.y - P * 10);
  for (let k = 0; k < SHAKE_TURNS + 1; k++) shakeHeld(w, k % 2 ? 8 : -8);
  drop(w);
  const job0 = w.job;
  runUntil(() => !S.after.bodies.find(b => b.id === id)?.falling, 10);
  const b = S.after.bodies.find(o => o.id === id);
  const dizzy = !!b.dizzyUntil;
  const laid = count(b) === 0 && lying().length > lying0;
  run(5);
  const b2 = S.after.bodies.find(o => o.id === id);
  return [
    ok(dizzy, 'shaken, it lands seeing stars'),
    ok(held > 0 && laid, 'what it held is laid on the floor where it came down, not lost', `${held} -> ${count(b)}, lying ${lying0} -> ${lying().length}`),
    ok(!b2.dizzyUntil && b2.job === job0, 'the stars clear and it is back at what it was', `${b2.dizzyUntil} ${b2.job}`)
  ];
});

group('a hell ghost dropped on a far chamber comes down by the yard\'s fall and climbs down the ladder back to its face', () => {
  window.__actsOn(true); window.__crew(2, 1); window.__goPlace('hell');
  window.__hell({ chamber: 1 });
  const miner = () => S.hell.bodies.find(o => o.job === HELL_JOB.MINE);
  runUntil(() => miner() && miner().c === 1 && !(miner().route && miner().route.length), 120);
  const b = miner();
  if (!b) return [ok(false, 'a miner on the second chamber', JSON.stringify(S.hell.bodies.map(o => [o.job, o.c])))];
  const id = b.id, me = () => S.hell.bodies.find(o => o.id === id);
  lift(b);
  holdBody(b, chamberX0(0) + P * 4, chamberFloor(0) - P * 10);
  drop(b);
  const down = runUntil(() => !me().falling, 10);
  const g = me(), landedC = g.c, onFloor = Math.abs(g.y - chamberFloor(g.c)) < 1;
  // Followed a frame at a time down the ladder: never more than a stride a
  // frame, and down at the ladder's x; read back from a save halfway down,
  // still on the rung it was on.
  let most = 0, climbedAt = null, at = { x: g.x, y: g.y }, reread = null;
  for (let t = 0; t < 30 && !(me().c === 1 && !(me().route && me().route.length)); t += 1 / 60) {
    run(1 / 60);
    const w = me();
    most = Math.max(most, Math.hypot(w.x - at.x, w.y - at.y));
    if (w.y < chamberFloor(1) - 1 && w.y > chamberFloor(0) + 1) {
      climbedAt = w.x;
      if (!reread) {
        const was = { x: w.x, y: w.y };
        window.__reload();
        reread = { was, now: { x: me().x, y: me().y } };
        run(1 / 60);
        reread.next = { x: me().x, y: me().y };
      }
    }
    at = { x: me().x, y: me().y };
  }
  const home = me().c === 1;
  const kept = reread && reread.now.x === reread.was.x && reread.now.y === reread.was.y
    && reread.next.x === reread.was.x && reread.next.y > reread.was.y;
  return [
    ok(down && onFloor && landedC === 0, 'it comes down on the floor of the chamber it is over', JSON.stringify({ c: landedC, y: g.y, floor: chamberFloor(landedC) })),
    ok(home && climbedAt === ladderX(1), 'and climbs back down by the ladder to its work', `${home} ${climbedAt} ${ladderX(1)}`),
    ok(most <= GHOST_WALK / 60 + 1, 'never more than a stride in a frame', `${most}`),
    ok(kept, 'read back halfway down, it carries on down the same rung', JSON.stringify(reread))
  ];
});

group('a member slowed under the hand and read back from a save walks at its own pace again', () => {
  up(2);
  const w = idle()[0], id = w.id;
  w.slowUntil = 1e15;
  window.__reload();
  const b = S.after.bodies.find(o => o.id === id);
  return [ok(b && !(b.slowUntil > 0), 'the hover\'s stamp on the clock is not read back onto the body', `${b && b.slowUntil}`)];
});
