// Act 3's crew on the yard's roster (DESIGN.md, "Act 3's crew: assigned like
// the yard's"): every member won over is a worker; one with no job stands at
// the podium behind the pair and agitates; a station's jobs are put on and
// taken off through the roster under it, its - and +, a seat to start and
// more bought on the station's board.
//
// Reached the way a player reaches it: every press is `rosterHit` at the
// button's middle, the call a click there makes (`__afterPress` hands it the
// button off the roster as drawn), and a seat is bought through its row's
// own buy (`__buy`). The setup it is not about: the act on and its opening
// played, members walked out of God's yard (`__afterCrowd`), coins granted.
import { group, ok, run, runUntil, yard } from './helpers.mjs';
import { RIM_PIECES, AFTER_WALK, AFTER_AGITATE_S, AFTER_AGITATE_REBEL } from '../src/config.js';
import { stationBox, stationDoor, idleX, idleSpots } from '../src/after/place.js';

const S = yard.S;
const read = () => window.__afterRead();
const OPENING = ['house-fall', 'arrive', 'meet-god', 'refuse'];
const roster = job => window.__afterRoster().find(r => r.job === job);
const idle = () => S.after.bodies.filter(b => b.job == null && b.state === 'work');

// The act begun with `n` members walked out and standing at the podium.
function up(n) {
  window.__actsOn(true);
  window.__goPlace('after');
  for (const k of OPENING) if (!S.beatsDone.includes(k)) S.beatsDone.push(k);
  window.__grant({ dust: 1e6, spores: 2e5, shards: 2e5, scales: 2e4, sparks: 2e4 });
  S.after.speech = { next: 1e9, f0: 0, held: null };   // the throne's speech is another check's
  window.__afterCrowd((i, v) => (i < n ? RIM_PIECES : v));
  runUntil(() => read().walking === 0 && idle().length >= Math.min(n, idleSpots()), 240);
  run(20);
}

// A body followed frame by frame until `done`: the most it moved in a frame,
// so a body that jumped is seen, and the seconds it took. The clock is turned
// a frame at a time; the reload every five seconds rebuilds the list, so the
// body is found again by its id each frame.
function follow(id, done, limit) {
  const body = () => S.after.bodies.find(b => b.id === id);
  let most = 0, t = 0, was = body();
  let at = was && { x: was.x, y: was.y };
  for (; t < limit && body() && !done(body()); t += 1 / 60) {
    run(1 / 60);
    const w = body();
    if (!w) break;
    most = Math.max(most, Math.hypot(w.x - at.x, w.y - at.y));
    at = { x: w.x, y: w.y };
  }
  return { most, t, w: body() };
}
// The most a body may cover in one frame at the act's pace, and a cell of slack.
const STRIDE = AFTER_WALK / 60 + 6;

group('idle members stand at the podium and agitate, at an agitator\'s pace', async () => {
  up(4);
  // The refusal's members and the four walked out: as many on the spots as
  // they hold, the rest in the crowd.
  const n = read().camp, standing = Math.min(n, idleSpots());
  const at = idle().map(w => Math.round(w.x)), spots = Array.from({ length: standing }, (_, k) => Math.round(idleX(k)));
  const r0 = read().rebel;
  run(40);
  const made = read().rebel - r0;
  const want = Math.floor(40 / AFTER_AGITATE_S) * n * AFTER_AGITATE_REBEL;
  window.__actsOn(null);
  return [
    ok(n >= 4 && idle().length === standing && at.every(x => spots.includes(x)), 'the idle members stand on the spots behind the pedestal',
       `${n} idle: ${at.join(' ')} against ${spots.join(' ')}`),
    ok(at.every(x => x < stationBox('pedestal').x), 'all of them on the pedestal\'s far side, behind the pair'),
    ok(made >= want - n && made <= want + 2 * n, 'their lines, at the podium and in the crowd, make an agitator\'s rebel each', `+${made}, about ${want}`)
  ];
});

group('the + walks a member off the podium to its station; the seat stops a second; a seat bought lets one come', async () => {
  up(4);
  S.after.built.push('mill');
  run(0.5);
  window.__afterGrant({ rebel: 500, timber: 50 });
  const r0 = roster('sawyer');
  const pressed = window.__afterPress('sawyer', 1);
  run(1 / 60);
  const w = S.after.bodies.find(b => b.job === 'sawyer');
  const from = w ? w.x : null, door = stationBox('mill');
  const walk = w ? follow(w.id, b => b.on, 300) : { most: Infinity, t: Infinity };
  // Got there: inside the mill's ground or a little short of it, its door
  // standing off the drawing on the side the logs come in from.
  const there = walk.w && walk.w.x >= Math.min(door.x, stationDoor('mill')) - 48 && walk.w.x <= door.x + door.w + 48;
  const seat = roster('sawyer').seats;
  // One seat: the + does nothing more.
  const second = window.__afterPress('sawyer', 1);
  const held = roster('sawyer').n;
  // A seat bought on the mill's board, and the + takes a second.
  const bought = window.__buy('after-seat-sawyer');
  const third = window.__afterPress('sawyer', 1);
  runUntil(() => S.after.bodies.filter(b => b.job === 'sawyer' && b.on).length === 2, 300);
  const two = roster('sawyer');
  window.__actsOn(null);
  return [
    ok(r0 && r0.n === 0 && r0.cap === 1, 'the saw mill\'s roster stands with one seat, nobody on it', JSON.stringify(r0 && { n: r0.n, cap: r0.cap })),
    ok(pressed && w && from > door.x + door.w, 'a press on its + puts the nearest idle member on, from the podium', `${pressed} from ${from}`),
    ok(walk.most <= STRIDE && there, 'who walks there, never a jump in a frame', `most ${walk.most.toFixed(1)} px a frame, ${walk.t.toFixed(1)} s`),
    ok(seat && seat.filled === 1, 'and the seat\'s pip fills once it has got there', JSON.stringify(seat)),
    ok(!second && held === 1, 'the + with every seat taken does nothing', `${held}`),
    ok(bought && third && two.n === 2 && two.cap === 2 && two.seats.filled === 2, 'a seat bought on the board lets a second member come',
       JSON.stringify({ bought, third, n: two.n, cap: two.cap, filled: two.seats.filled }))
  ];
});

group('the - walks one back to the podium on foot, and the rosters stand through a reload', async () => {
  up(3);
  const pressed = [window.__afterPress('woodcutter', 1), window.__afterPress('gatherer', 1)];
  runUntil(() => S.after.bodies.filter(b => (b.job === 'woodcutter' || b.job === 'gatherer') && b.on).length === 2, 300);
  // A save and a read back, mid-run: the counts, the bodies on them, where they stand.
  const before = { crew: { ...S.after.crew }, at: S.after.bodies.map(b => [b.id, b.job, Math.round(b.x)]) };
  yard.persist(); window.__reload(); run(0.1);
  const after = { crew: { ...S.after.crew }, at: S.after.bodies.map(b => [b.id, b.job, Math.round(b.x)]) };
  const kept = JSON.stringify(before.crew) === JSON.stringify(after.crew)
    && before.at.every(([id, job, x]) => after.at.some(([i, j, x2]) => i === id && j === job && Math.abs(x2 - x) <= STRIDE));
  const w = S.after.bodies.find(b => b.job === 'woodcutter');
  const id = w.id, x0 = w.x;
  const less = window.__afterPress('woodcutter', -1);
  run(1 / 60);
  const o = S.after.bodies.find(b => b.id === id), off = o && { job: o.job, x: o.x };
  const back = follow(id, b => b.job == null && b.x > stationBox('pedestal').x - 6 * 40 && Math.abs(b.x - idleX(idle().indexOf(b))) < 1, 400);
  const r = roster('woodcutter');
  window.__actsOn(null);
  return [
    ok(pressed.every(Boolean), 'a woodcutter and a gatherer put on under the forestry shack'),
    ok(kept, 'a reload stands the rosters and every body back where they were', `${JSON.stringify(before.crew)} -> ${JSON.stringify(after.crew)}`),
    ok(less && off && off.job == null && Math.abs(off.x - x0) <= STRIDE, 'a press on the - takes it off where it stands', `${off && off.job} at ${off && Math.round(off.x)} from ${Math.round(x0)}`),
    ok(back.w && back.most <= STRIDE && back.t < 400, 'and it walks back to its spot at the podium, never a jump', `most ${back.most.toFixed(1)} px, ${back.t.toFixed(1)} s`),
    ok(r.n === 0 && roster('gatherer').n === 1, 'the woodcutter\'s roster reads nobody, the gatherer\'s still one', `${r.n} ${roster('gatherer').n}`)
  ];
});

group('a save from when posts were bought: its posts become what the rosters want, as far as its members go, the rest seats', async () => {
  up(0);
  S.after.built.push('mill');
  S.after.camp = 0;
  // The old shape, written as that save wrote it: agitator bodies on posts
  // bought, more posts bought than members, no rosters.
  const members = idle().length;
  for (const w of idle()) w.job = 'agitator';
  S.after.posts = { agitator: 30, woodcutter: 2, hauler: 3, sawyer: 8 };
  delete S.after.crew;
  yard.persist(); window.__reload(); run(0.1);
  const crew = { ...S.after.crew }, on = Object.values(crew).reduce((a, b) => a + b, 0);
  const seats = ['woodcutter', 'hauler', 'sawyer'].map(j => roster(j)?.cap);
  run(5);
  const agitators = S.after.bodies.filter(b => b.job === 'agitator').length;
  window.__actsOn(null);
  return [
    ok(!('posts' in S.after) && on === Math.min(members, 13) && crew.woodcutter === 2, 'the posts become the rosters, filled in order as far as the members go',
       `${members} members: ${JSON.stringify(crew)}`),
    ok(JSON.stringify(seats) === '[2,3,8]', 'posts bought past a job\'s one seat become seats bought', JSON.stringify(seats)),
    ok(agitators === 0, 'and nobody stands on the agitators\' old post', `${agitators}`)
  ];
});
